#!/usr/bin/env python3
"""Write content/media/manifest.json from the exported files and config.py.

Usage (from the repo root), after export_images.py and encode_videos.py:
  python scripts/media/build_manifest.py

Widths, heights, durations and byte sizes are read from the files on disk, never typed by hand.
"""
from __future__ import annotations

import sys

sys.dont_write_bytecode = True  # keep __pycache__ out of the repo

import json
from datetime import datetime, timezone
from math import gcd
from pathlib import Path

from PIL import Image

from common import IMG_DIR, MANIFEST, POSTER_DIR, REPO, VIDEO_DIR, video_info
from config import EXCLUDED, FACTS, IMAGES, VIDEOS


def public_url(path: Path) -> str:
    return "/" + path.resolve().relative_to(REPO / "public").as_posix()


def aspect(w: int, h: int) -> str:
    g = gcd(w, h)
    if (w // g, h // g) in {(9, 16), (16, 9), (4, 5), (1, 1)}:
        return f"{w // g}:{h // g}"
    return f"{w / h:.2f}:1" if w >= h else f"1:{h / w:.2f}"


def main() -> int:
    images = []
    for e in IMAGES:
        p = IMG_DIR / e["out"] if e["project"] == "profile" else IMG_DIR / e["project"] / e["out"]
        with Image.open(p) as im:
            w, h = im.size
        item = {"project": e["project"], "src": public_url(p), "width": w, "height": h,
                "bytes": p.stat().st_size, "alt": e["alt"]}
        if e.get("group"):
            item["group"] = e["group"]
        if e.get("caption"):
            item["caption"] = e["caption"]
        item["source"] = ("Ehjay.webp (approved portrait, supplied separately; not in ehjay-files)"
                          if e["src"] == "PORTRAIT" else e["src"])
        images.append(item)

    videos, excluded = [], []
    for v in VIDEOS:
        p = VIDEO_DIR / v["project"] / v["out"]
        poster = POSTER_DIR / v["project"] / (Path(v["out"]).stem + ".jpg")
        i = video_info(p)
        if i["audio_streams"]:
            raise SystemExit(f"{p} still has audio")
        videos.append({
            "project": v["project"], "src": public_url(p), "poster": public_url(poster),
            "width": i["width"], "height": i["height"], "aspectRatio": aspect(i["width"], i["height"]),
            "durationSec": round(i["duration"], 2), "bytes": i["bytes"], "audio": False,
            "title": v["title"], "description": v["description"], "posterTimeSec": v["poster_t"],
            "source": v["src"],
        })
        for d in v.get("duplicates", []):
            excluded.append({"source": d, "reason": f"Exact duplicate (same md5) of {v['src']}; encoded once as {public_url(p)}."})
    excluded += [{"source": x["source"], "reason": x["reason"]} for x in EXCLUDED]

    manifest = {
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "images": images,
        "videos": videos,
        "excluded": excluded,
        "facts": FACTS,
        "totals": {"videoBytes": sum(v["bytes"] for v in videos), "imageBytes": sum(i["bytes"] for i in images)},
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    t = manifest["totals"]
    print(f"wrote {MANIFEST.relative_to(REPO).as_posix()}: {len(images)} images ({t['imageBytes'] / 1e6:.2f} MB), "
          f"{len(videos)} videos ({t['videoBytes'] / 1e6:.2f} MB), {len(excluded)} exclusions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
