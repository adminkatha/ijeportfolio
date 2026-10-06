#!/usr/bin/env python3
"""Contact sheets of the exported media, for the privacy review (written to MEDIA_TMP/review, not the repo).

Usage (from the repo root):
  python scripts/media/review_sheets.py              # images per project + posters + frames of every video
  python scripts/media/review_sheets.py --every 2    # web recordings: one frame every 2 s (default 2)
  python scripts/media/review_sheets.py --only images

Look at every sheet before committing: no customer data, business figures, e-mails, phone numbers
or street addresses may be readable.
"""
from __future__ import annotations

import sys

sys.dont_write_bytecode = True  # keep __pycache__ out of the repo

import argparse
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from common import IMG_DIR, POSTER_DIR, TMP, VIDEO_DIR, grab_frame, video_info
from config import IMAGES, VIDEOS

OUT = TMP / "review"


def font(size: int):
    for f in ("C:/Windows/Fonts/consola.ttf", "/System/Library/Fonts/Menlo.ttc",
              "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def sheet(items: list[tuple[str, Image.Image]], out: Path, tile_w: int, cols: int) -> None:
    lab = 22
    tiles = []
    for label, im in items:
        im = im.convert("RGB")
        im = im.resize((tile_w, max(1, round(im.height * tile_w / im.width))), Image.LANCZOS)
        tiles.append((label, im))
    rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
    heights = [max(t.height for _, t in r) + lab for r in rows]
    S = Image.new("RGB", (cols * (tile_w + 6), sum(heights) + 6 * len(rows)), (40, 40, 40))
    d, f = ImageDraw.Draw(S), font(15)
    y = 0
    for r, h in zip(rows, heights):
        for c, (label, im) in enumerate(r):
            x = c * (tile_w + 6)
            d.text((x + 3, y + 3), label[:60], fill=(255, 255, 0), font=f)
            S.paste(im, (x, y + lab))
        y += h + 6
    out.parent.mkdir(parents=True, exist_ok=True)
    S.save(out, quality=88)
    print(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--every", type=float, default=2.0, help="seconds between frames for web recordings")
    ap.add_argument("--only", choices=["images", "videos"])
    a = ap.parse_args()

    by_project: dict[str, list] = {}
    for e in IMAGES if a.only != "videos" else []:
        p = IMG_DIR / e["out"] if e["project"] == "profile" else IMG_DIR / e["project"] / e["out"]
        by_project.setdefault(e["project"], []).append((p.name, Image.open(p)))
    for project, items in by_project.items():
        sheet(items, OUT / f"images_{project}.jpg", 420, 4)

    if a.only == "images":
        return 0
    sheet([(f"{v['project']}/{Path(v['out']).stem} @{v['poster_t']}s",
            Image.open(POSTER_DIR / v["project"] / (Path(v["out"]).stem + ".jpg"))) for v in VIDEOS],
          OUT / "posters.jpg", 300, 6)

    for v in VIDEOS:
        p = VIDEO_DIR / v["project"] / v["out"]
        dur = video_info(p)["duration"]
        if v["kind"] == "social":
            times = [(i + 0.5) * dur / 12 for i in range(12)]
            tile, cols = 300, 6
        else:
            times, t = [], 0.0
            while t < dur - 0.05:
                times.append(t)
                t += a.every
            tile, cols = 640, 3
        sheet([(f"t={t:.1f}s", grab_frame(p, t)) for t in times],
              OUT / f"video_{v['project']}_{Path(v['out']).stem}.jpg", tile, cols)
    return 0


if __name__ == "__main__":
    sys.exit(main())
