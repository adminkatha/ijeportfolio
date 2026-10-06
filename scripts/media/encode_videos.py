#!/usr/bin/env python3
"""Encode the portfolio videos and their posters from the originals.

Usage (from the repo root):
  python scripts/media/encode_videos.py                 # web recordings, then social videos, posters, checks
  python scripts/media/encode_videos.py --only web      # or: social | posters | verify
  python scripts/media/encode_videos.py --keys janet,park --only social

Social (9:16): 720x1280 lanczos, 30 fps, H.264 High, yuv420p, preset slow, two-pass, faststart, with the
  original soundtrack re-encoded to AAC-LC stereo (config.SOCIAL_AUDIO; the owner confirmed on 2026-10-06
  that the music is licensed). The bitrate budget left after the website recordings and the audio is
  shared out by duration, weighted by a CRF-26 complexity probe (--alpha 1; use --alpha 0 for duration
  only), with a per-file floor.
Web recordings: 1280 wide, 30 fps, CRF, audio stripped. Decoded frames pass through Python so that
  blur boxes can follow the scrolling page (offsets are measured frame to frame), and cut ranges are
  dropped. Posters: one JPEG (quality 80) per video at the output resolution, from config.poster_t.
"""
from __future__ import annotations

import sys

sys.dont_write_bytecode = True  # keep __pycache__ out of the repo

import argparse
import json
import math
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from common import (FFMPEG, MAX_VIDEO_FILE_BYTES, MAX_VIDEO_TOTAL_BYTES, POSTER_DIR, SRC, TMP, VIDEO_DIR,
                    grab_frame, obscure, rel, run, save_jpeg, video_info)
from config import SOCIAL_AUDIO, VIDEOS

FPS = 30
SOCIAL_W, SOCIAL_H = 720, 1280
WEB_W = 1280
RESERVE_BYTES = 2_000_000          # headroom for container overhead and two-pass drift
FLOOR_KBPS = 500


def out_path(v: dict) -> Path:
    return VIDEO_DIR / v["project"] / v["out"]


def poster_path(v: dict) -> Path:
    return POSTER_DIR / v["project"] / (Path(v["out"]).stem + ".jpg")


def web_size(v: dict) -> tuple[int, int, int]:
    x0, y0, x1, y1 = v["crop"]
    w, h = x1 - x0, y1 - y0
    return w, h, round(h * WEB_W / w / 2) * 2


# ------------------------------------------------------------------------------------------------
# Website recordings
# ------------------------------------------------------------------------------------------------
def decode_cmd(v: dict, pix_fmt: str) -> list[str]:
    x0, y0, x1, y1 = v["crop"]
    return [FFMPEG, "-nostdin", "-v", "error", "-i", str(SRC / v["src"]),
            "-vf", f"fps={FPS},crop={x1 - x0}:{y1 - y0}:{x0}:{y0}", "-f", "rawvideo", "-pix_fmt", pix_fmt, "-"]


def match_score(a: Image.Image, b: Image.Image, d: int) -> float:
    """Mean difference when frame b equals frame a with the page moved up by d pixels."""
    h = a.height
    if abs(d) >= h - 8:
        return 1e9
    if d >= 0:
        pa, pb = a.crop((0, d, a.width, h)), b.crop((0, 0, b.width, h - d))
    else:
        pa, pb = a.crop((0, 0, a.width, h + d)), b.crop((0, -d, b.width, h))
    return sum(ImageStat.Stat(ImageChops.difference(pa, pb)).mean)


def scroll_offsets(frames: list[Image.Image], search: int = 360, step: int = 4) -> list[int]:
    """Cumulative scroll offset per frame (content moved up by off[k] px since the first frame)."""
    small = [f.resize((f.width // step, f.height // step), Image.BOX) for f in frames]
    offs = [0]
    for k in range(len(frames) - 1):
        r = search // step
        coarse = min(range(-r, r + 1), key=lambda d: match_score(small[k], small[k + 1], d))
        fine = min(range(coarse * step - step, coarse * step + step + 1),
                   key=lambda d: match_score(frames[k], frames[k + 1], d))
        offs.append(offs[-1] + fine)
    return offs


def plan_boxes(v: dict, n_frames: int) -> dict[int, list[tuple[int, int, int, int]]]:
    """Blur boxes per source frame index (content coordinates)."""
    w, h, _ = web_size(v)
    boxes: dict[int, list] = {}
    for s in v.get("static", []):
        t0, t1 = s["window"]
        for k in range(max(0, math.floor(t0 * FPS)), min(n_frames, math.ceil(t1 * FPS) + 1)):
            boxes.setdefault(k, []).append(s["box"])
    tracked = v.get("tracked", [])
    if not tracked:
        return boxes
    band = v["track_band"]
    clip_top = v.get("clip_top", 0)
    windows = sorted({tuple(t["window"]) for t in tracked})
    for (t0, t1) in windows:
        k0, k1 = max(0, math.floor(t0 * FPS)), min(n_frames - 1, math.ceil(t1 * FPS))
        frames = []
        proc = subprocess.Popen(decode_cmd(v, "gray"), stdout=subprocess.PIPE, stdin=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL)
        size = w * h
        k = 0
        while k <= k1:
            buf = proc.stdout.read(size)
            if len(buf) < size:
                break
            if k >= k0:
                frames.append(Image.frombytes("L", (w, h), buf).crop(band))
            k += 1
        proc.kill()
        proc.wait()
        proc.stdout.close()
        offs = scroll_offsets(frames)
        for t in (t for t in tracked if tuple(t["window"]) == (t0, t1)):
            kref = round(t["ref_t"] * FPS) - k0
            bx0, by0, bx1, by1 = t["box"]
            for i, off in enumerate(offs):
                shift = off - offs[kref]
                y0, y1 = max(clip_top, by0 - shift), min(h, by1 - shift)
                if y1 - y0 > 1:
                    boxes.setdefault(k0 + i, []).append((bx0, y0, bx1, y1))
        dump = TMP / "tracking" / f"{v['key']}_{t0:g}-{t1:g}.json"
        dump.parent.mkdir(parents=True, exist_ok=True)
        dump.write_text(json.dumps({"k0": k0, "offsets": offs}))
    return boxes


def encode_web(v: dict) -> None:
    src = SRC / v["src"]
    w, h, oh = web_size(v)
    n_frames = math.floor(video_info(src)["duration"] * FPS) + 2
    boxes = plan_boxes(v, n_frames)
    cuts = v.get("cuts", [])
    out = out_path(v)
    out.parent.mkdir(parents=True, exist_ok=True)
    enc = subprocess.Popen(
        [FFMPEG, "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
         "-framerate", str(FPS), "-i", "-", "-vf", f"scale={WEB_W}:{oh}:flags=lanczos,format=yuv420p",
         "-c:v", "libx264", "-preset", "slow", "-crf", str(v.get("crf", 28)), "-profile:v", "high",
         "-pix_fmt", "yuv420p", "-g", "150", "-an", "-map_metadata", "-1", "-map_chapters", "-1",
         "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE)
    dec = subprocess.Popen(decode_cmd(v, "rgb24"), stdout=subprocess.PIPE, stdin=subprocess.DEVNULL)
    size = w * h * 3
    k = kept = 0
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        t = k / FPS
        if not any(a <= t < b for a, b in cuts):
            frame = boxes.get(k)
            if frame:
                im = Image.frombytes("RGB", (w, h), buf)
                for box in frame:
                    obscure(im, box)
                buf = im.tobytes()
            enc.stdin.write(buf)
            kept += 1
        k += 1
    dec.stdout.close()
    dec.wait()
    enc.stdin.close()
    if enc.wait() != 0:
        raise SystemExit(f"encode failed: {v['key']}")
    print(f"  web {v['key']}: {k} frames read, {kept} kept, {len(boxes)} frames with blur boxes -> {rel(out)}")


# ------------------------------------------------------------------------------------------------
# Social videos
# ------------------------------------------------------------------------------------------------
def social_filter(v: dict) -> str:
    chain = f"fps={FPS},scale={SOCIAL_W}:{SOCIAL_H}:flags=lanczos,format=yuv420p"
    blurs = v.get("blur", [])
    if not blurs:
        return f"[0:v]setpts=PTS-STARTPTS,{chain}[v]"
    parts = [f"[0:v]setpts=PTS-STARTPTS,split={len(blurs) + 1}[base]" + "".join(f"[s{i}]" for i in range(len(blurs)))]
    last = "base"
    for i, b in enumerate(blurs):
        x0, y0, x1, y1 = b["box"]
        t0, t1 = b["window"]
        parts.append(f"[s{i}]crop={x1 - x0}:{y1 - y0}:{x0}:{y0},"
                     f"boxblur=luma_radius=22:luma_power=3:chroma_radius=11:chroma_power=3[b{i}]")
        parts.append(f"[{last}][b{i}]overlay={x0}:{y0}:enable='between(t,{t0},{t1})'[o{i}]")
        last = f"o{i}"
    parts.append(f"[{last}]{chain}[v]")
    return ";".join(parts)


def probe_complexity(v: dict) -> float:
    """Mbit/s that x264 (veryfast, CRF 26, 720x1280) needs for this video: a complexity measure."""
    cache = TMP / "probe" / f"{v['key']}.json"
    src = SRC / v["src"]
    if cache.exists():
        c = json.loads(cache.read_text())
        if c.get("bytes_src") == src.stat().st_size:
            return c["mbps"]
    cache.parent.mkdir(parents=True, exist_ok=True)
    tmp = cache.with_suffix(".mp4")
    run([FFMPEG, "-nostdin", "-v", "error", "-y", "-i", str(src), "-an", "-filter_complex", social_filter(v),
         "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-threads", "4", str(tmp)])
    info = video_info(tmp)
    mbps = info["bytes"] * 8 / info["duration"] / 1e6
    cache.write_text(json.dumps({"bytes_src": src.stat().st_size, "mbps": mbps}))
    tmp.unlink()
    return mbps


def audio_kbps() -> int:
    return SOCIAL_AUDIO["kbps"] if SOCIAL_AUDIO else 0


def audio_budget_bytes(jobs: list[dict]) -> int:
    """Expected audio bytes (3% margin for the encoder's average-bitrate drift and container overhead)."""
    return int(sum(audio_kbps() * 1.03 * video_info(SRC / v["src"])["duration"] * 1000 / 8 for v in jobs))


def allocate(jobs: list[dict], budget_bytes: int, alpha: float, floor_kbps: int) -> dict[str, int]:
    """Target video kbps per job so that sum(kbps * duration) fits the budget."""
    durs = {v["key"]: video_info(SRC / v["src"])["duration"] for v in jobs}
    weights = {v["key"]: (v["complexity"] ** alpha) for v in jobs}
    caps = {k: 0.97 * MAX_VIDEO_FILE_BYTES * 8 / d / 1000 - audio_kbps() for k, d in durs.items()}
    budget_kbit = budget_bytes * 8 / 1000

    def rates(K):
        return {k: max(floor_kbps, min(caps[k], K * weights[k])) for k in durs}

    lo, hi = 0.0, 100_000.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if sum(r * durs[k] for k, r in rates(mid).items()) > budget_kbit:
            hi = mid
        else:
            lo = mid
    return {k: int(r) for k, r in rates(lo).items()}


def encode_social(v: dict, kbps: int) -> None:
    src, out = SRC / v["src"], out_path(v)
    out.parent.mkdir(parents=True, exist_ok=True)
    log = TMP / "passlogs" / v["key"]
    log.parent.mkdir(parents=True, exist_ok=True)
    common = [FFMPEG, "-nostdin", "-v", "error", "-y", "-i", str(src), "-filter_complex", social_filter(v),
              "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
              "-b:v", f"{kbps}k", "-g", "150", "-threads", "4", "-passlogfile", str(log)]
    # Source audio and video both start at 0 (checked with ffprobe), so the soundtrack is mapped as is.
    sound = (["-map", "0:a:0", "-c:a", "aac", "-profile:a", "aac_low", "-b:a", f"{audio_kbps()}k", "-ac", "2"]
             if SOCIAL_AUDIO else ["-an"])
    run(common + ["-an", "-pass", "1", "-f", "null", "-"])
    run(common + sound + ["-pass", "2", "-map_metadata", "-1", "-map_chapters", "-1",
                          "-movflags", "+faststart", str(out)])
    print(f"  social {v['key']}: video {kbps} kbps, audio {audio_kbps()} kbps -> {rel(out)} "
          f"({out.stat().st_size / 1e6:.2f} MB)")


# ------------------------------------------------------------------------------------------------
def make_posters(jobs: list[dict]) -> None:
    for v in jobs:
        im = grab_frame(out_path(v), v["poster_t"])
        save_jpeg(im, poster_path(v), quality=80)
        print(f"  poster {rel(poster_path(v))} @ {v['poster_t']}s ({im.width}x{im.height})")


def verify(jobs: list[dict]) -> int:
    total, problems = 0, []
    print(f"{'file':<84} {'res':>9} {'sec':>7} {'MB':>6} {'kbps':>6} {'audio':>14}")
    for v in jobs:
        p = out_path(v)
        i = video_info(p)
        total += i["bytes"]
        kbps = i["bytes"] * 8 / i["duration"] / 1000
        a = i["audio"]
        audio = f"{a['codec']} {a['channels']}ch {a['kbps']}k" if a else "none"
        print(f"{rel(p):<84} {i['width']:>4}x{i['height']:<4} {i['duration']:7.2f} {i['bytes'] / 1e6:6.2f} {kbps:6.0f} {audio:>14}")
        want_audio = 1 if (v["kind"] == "social" and SOCIAL_AUDIO) else 0
        if i["codec"] != "h264" or i["audio_streams"] != want_audio or i["pix_fmt"] != "yuv420p":
            problems.append(f"{p.name}: codec={i['codec']} audio={i['audio_streams']} (want {want_audio}) pix={i['pix_fmt']}")
        if a and (a["codec"] != "aac" or a["channels"] != 2 or abs(a["start"] - i["video_start"]) > 0.05):
            problems.append(f"{p.name}: audio {a}")
        if i["bytes"] >= MAX_VIDEO_FILE_BYTES:
            problems.append(f"{p.name}: {i['bytes']} bytes is over the per-file limit")
        want = (SOCIAL_W, SOCIAL_H) if v["kind"] == "social" else (WEB_W, web_size(v)[2])
        if (i["width"], i["height"]) != want:
            problems.append(f"{p.name}: {i['width']}x{i['height']} != {want}")
        if not poster_path(v).exists():
            problems.append(f"{p.name}: poster missing")
    print(f"total {total / 1e6:.2f} MB ({total} bytes); limit {MAX_VIDEO_TOTAL_BYTES / 1e6:.0f} MB")
    if total > MAX_VIDEO_TOTAL_BYTES:
        problems.append("total over budget")
    for pr in problems:
        print("PROBLEM:", pr)
    return 1 if problems else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["web", "social", "posters", "verify"])
    ap.add_argument("--keys", help="comma-separated subset of config keys")
    ap.add_argument("--alpha", type=float, default=1.0, help="complexity weight (0 = duration only)")
    ap.add_argument("--floor-kbps", type=int, default=FLOOR_KBPS)
    ap.add_argument("--budget-mb", type=float, default=MAX_VIDEO_TOTAL_BYTES / 1e6)
    ap.add_argument("--parallel", type=int, default=3)
    a = ap.parse_args()
    keys = set(a.keys.split(",")) if a.keys else None
    jobs = [v for v in VIDEOS if keys is None or v["key"] in keys]
    web = [v for v in jobs if v["kind"] == "web"]
    social = [v for v in jobs if v["kind"] == "social"]

    if a.only in (None, "web"):
        for v in web:
            encode_web(v)
    if a.only in (None, "social") and social:
        with ThreadPoolExecutor(a.parallel) as ex:
            for v, c in zip(social, ex.map(probe_complexity, social)):
                v["complexity"] = c
        all_social = [v for v in VIDEOS if v["kind"] == "social"]
        for v in all_social:
            if "complexity" not in v:
                v["complexity"] = probe_complexity(v)
        web_bytes = sum(out_path(v).stat().st_size for v in VIDEOS if v["kind"] == "web")
        sound_bytes = audio_budget_bytes(all_social)
        budget = int(a.budget_mb * 1e6) - web_bytes - sound_bytes - RESERVE_BYTES
        rates = allocate(all_social, budget, a.alpha, a.floor_kbps)
        plan = {v["key"]: {"complexity_mbps": round(v["complexity"], 3), "kbps": rates[v["key"]]} for v in all_social}
        (TMP / "allocation.json").write_text(json.dumps({"alpha": a.alpha, "floor_kbps": a.floor_kbps,
                                                         "audio_kbps": audio_kbps(),
                                                         "social_video_budget_bytes": budget, "plan": plan}, indent=1))
        print(f"social video budget {budget / 1e6:.2f} MB (total {a.budget_mb:.0f} MB - web {web_bytes / 1e6:.2f} MB "
              f"- audio {sound_bytes / 1e6:.2f} MB - reserve {RESERVE_BYTES / 1e6:.1f} MB)")
        for k, p in plan.items():
            print(f"  {k:<16} complexity {p['complexity_mbps']:.2f} Mbit/s -> {p['kbps']} kbps")
        with ThreadPoolExecutor(a.parallel) as ex:
            list(ex.map(lambda v: encode_social(v, rates[v["key"]]), social))
    if a.only in (None, "posters", "web", "social"):
        make_posters(web if a.only == "web" else social if a.only == "social" else jobs)
    return verify([v for v in jobs if out_path(v).exists()])


if __name__ == "__main__":
    sys.exit(main())
