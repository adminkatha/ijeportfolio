"""Shared paths and helpers for the media pipeline.

Paths can be overridden with environment variables:
  EHJAY_FILES     folder with his original files (default: ../ehjay-files next to the repo)
  EHJAY_PORTRAIT  the approved portrait (default: <EHJAY_FILES>/photo/ehjay.jpeg, chosen by the owner 2026-10-06)
  MEDIA_TMP       scratch folder for probes, pass logs and review sheets (default: <system temp>/ehjay-media)
  FFMPEG, FFPROBE executables (default: found on PATH)

Needs Python 3.12+, Pillow and ffmpeg/ffprobe. No secrets live here.
"""
from __future__ import annotations

import io
import json
import os
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageCms, ImageFilter, ImageOps

REPO = Path(__file__).resolve().parents[2]
SRC = Path(os.environ.get("EHJAY_FILES", REPO.parent / "ehjay-files"))
PORTRAIT_SRC = Path(os.environ.get("EHJAY_PORTRAIT", SRC / "photo" / "ehjay.jpeg"))
TMP = Path(os.environ.get("MEDIA_TMP", Path(tempfile.gettempdir()) / "ehjay-media"))
PUBLIC_MEDIA = REPO / "public" / "media"
IMG_DIR = PUBLIC_MEDIA / "img"
VIDEO_DIR = PUBLIC_MEDIA / "video"
POSTER_DIR = PUBLIC_MEDIA / "poster"
MANIFEST = REPO / "content" / "media" / "manifest.json"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("FFPROBE", "ffprobe")

# Budgets (decimal megabytes: 1 MB = 1,000,000 bytes).
MAX_VIDEO_FILE_BYTES = 14_500_000
MAX_VIDEO_TOTAL_BYTES = 78_000_000   # all 16 videos, audio included (2026-10-06)


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    """Run a command with stdin closed (ffmpeg otherwise reads the terminal)."""
    kw.setdefault("stdin", subprocess.DEVNULL)
    return subprocess.run(cmd, check=True, **kw)


def ffprobe(path: Path) -> dict:
    out = run([FFPROBE, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
              capture_output=True, text=True).stdout
    return json.loads(out)


def video_info(path: Path) -> dict:
    """Codec, size, duration and audio presence of a video file."""
    j = ffprobe(path)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return {
        "codec": v["codec_name"],
        "profile": v.get("profile"),
        "pix_fmt": v.get("pix_fmt"),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": v.get("avg_frame_rate"),
        "duration": float(j["format"]["duration"]),
        "bytes": int(j["format"]["size"]),
        "audio_streams": sum(1 for s in j["streams"] if s["codec_type"] == "audio"),
        "audio": next(({"codec": s["codec_name"], "profile": s.get("profile"), "channels": s.get("channels"),
                        "sample_rate": s.get("sample_rate"), "kbps": round(int(s.get("bit_rate", 0)) / 1000),
                        "start": float(s.get("start_time", 0)), "duration": float(s.get("duration", 0))}
                       for s in j["streams"] if s["codec_type"] == "audio"), None),
        "video_start": float(v.get("start_time", 0)),
        "tags": j["format"].get("tags", {}),
    }


def grab_frame(path: Path, t: float) -> Image.Image:
    """One decoded frame at time t (seconds) as an RGB image."""
    out = run([FFMPEG, "-nostdin", "-v", "error", "-ss", f"{t:.3f}", "-i", str(path), "-frames:v", "1",
               "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    return Image.open(io.BytesIO(out)).convert("RGB")


def to_srgb(im: Image.Image) -> Image.Image:
    """Normalise orientation and colour, and return a plain RGB image (no metadata attached)."""
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if icc:
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            im = ImageCms.profileToProfile(im, src, ImageCms.createProfile("sRGB"), outputMode="RGB")
        except Exception:
            pass
    # Copy pixels into a fresh image so no info/exif/xmp from the source can travel with it.
    clean = Image.new("RGB", im.size)
    clean.paste(im)
    return clean


def save_jpeg(im: Image.Image, path: Path, quality: int = 82) -> int:
    """Save as progressive JPEG with no EXIF/XMP/ICC. Returns the file size in bytes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = Image.new("RGB", im.size)
    clean.paste(im.convert("RGB"))
    clean.save(path, "JPEG", quality=quality, progressive=True, optimize=True)
    return path.stat().st_size


def assert_no_metadata(path: Path) -> None:
    with Image.open(path) as im:
        leftovers = [k for k in ("exif", "xmp", "icc_profile", "photoshop", "comment") if k in im.info]
        if len(im.getexif()) or leftovers:
            raise SystemExit(f"metadata left in {path}: {leftovers or 'exif'}")


def obscure(im: Image.Image, box: tuple[int, int, int, int], block: int = 14, radius: float = 9) -> None:
    """Make the text inside box unreadable: pixelate, then blur (in place)."""
    x0, y0, x1, y1 = (max(0, box[0]), max(0, box[1]), min(im.width, box[2]), min(im.height, box[3]))
    if x1 - x0 < 2 or y1 - y0 < 2:
        return
    region = im.crop((x0, y0, x1, y1))
    w, h = region.size
    small = region.resize((max(1, w // block), max(1, h // block)), Image.BOX)
    region = small.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius))
    im.paste(region, (x0, y0))


def fill(im: Image.Image, box: tuple[int, int, int, int], color: tuple[int, int, int]) -> None:
    """Paint a rectangle with a flat colour (used to remove a UI element cleanly)."""
    Image.Image.paste(im, color, box)


def rel(path: Path) -> str:
    """Path relative to the repo, with forward slashes."""
    return path.resolve().relative_to(REPO).as_posix()
