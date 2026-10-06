#!/usr/bin/env python3
"""Export the curated images from his original files.

Usage (from the repo root):  python scripts/media/export_images.py

For each entry in config.IMAGES: open the source, normalise to sRGB RGB, apply the listed redactions
(`fill`, `obscure`) and `crop`, cap the long edge at 2400 px, and save a progressive JPEG (quality 82)
with no EXIF/XMP/ICC metadata to public/media/img/<project>/<name>.jpg. The portrait goes to
public/media/img/ehjay-lorenzo-portrait.jpg.
"""
from __future__ import annotations

import sys

sys.dont_write_bytecode = True  # keep __pycache__ out of the repo


from PIL import Image

from common import IMG_DIR, PORTRAIT_SRC, SRC, assert_no_metadata, fill, obscure, rel, save_jpeg, to_srgb
from config import IMAGES

MAX_EDGE = 2400


def output_path(entry: dict):
    if entry["project"] == "profile":
        return IMG_DIR / entry["out"]
    return IMG_DIR / entry["project"] / entry["out"]


def export(entry: dict) -> dict:
    src = PORTRAIT_SRC if entry["src"] == "PORTRAIT" else SRC / entry["src"]
    with Image.open(src) as raw:
        im = to_srgb(raw)
    for box, color in entry.get("fill", []):
        fill(im, box, color)
    for box in entry.get("obscure", []):
        obscure(im, box)
    if "crop" in entry:
        im = im.crop(entry["crop"])
    if max(im.size) > MAX_EDGE:
        scale = MAX_EDGE / max(im.size)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    out = output_path(entry)
    size = save_jpeg(im, out, quality=82)
    assert_no_metadata(out)
    return {"out": rel(out), "width": im.width, "height": im.height, "bytes": size}


def main() -> None:
    total = 0
    for entry in IMAGES:
        r = export(entry)
        total += r["bytes"]
        print(f"{r['out']:<78} {r['width']:>5}x{r['height']:<5} {r['bytes'] / 1e3:7.1f} kB")
    print(f"{len(IMAGES)} images, {total / 1e6:.2f} MB")


if __name__ == "__main__":
    sys.exit(main())
