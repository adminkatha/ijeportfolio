"""Extract the images a demo needs from a saved dashboard page, resized and renamed.

Usage: python assets.py --slug <slug> --inner <saved inner page> --files <saved _files dir>
                        --out <public/demos/<slug>/assets> --manifest <json>

- the client logo (from the page's own #logo data URI) -> logo.png (max 200 px, optimised)
- public ad-creative thumbnails -> creative-NN.jpg / .webp (max 720 px wide, quality 80),
  renamed (original names are Meta creative IDs or ad titles), de-duplicated by content
- dashboard-specific generic text (Honey Tribe's retail-season guide) -> manifest
Nothing else is copied. The agency logo is never extracted.
"""
import base64
import hashlib
import html
import io
import json
import os
import re
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = 60_000_000


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


SLUG, INNER, FILES, OUT, MANIFEST = (arg("--slug"), arg("--inner"), arg("--files"), arg("--out"), arg("--manifest"))
os.makedirs(OUT, exist_ok=True)
page = open(INNER, encoding="utf-8", errors="replace").read()
manifest = {"creatives": [], "logo": None}


def data_uri_of(img_tag):
    m = re.search(r'src="data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)"', img_tag)
    return (m.group(1), base64.b64decode(m.group(2))) if m else (None, None)


def open_raster(mime, raw):
    if mime and mime.startswith("image/svg"):
        svg = raw.decode("utf-8", "replace")
        inner = re.search(r'href="data:image/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)"', svg)
        if not inner:
            raise SystemExit("SVG logo without an embedded raster: convert it by hand")
        raw = base64.b64decode(inner.group(1))
    return Image.open(io.BytesIO(raw))


def save_logo():
    tag = re.search(r'<img[^>]*\bid="logo"[^>]*>', page)
    mime, raw = data_uri_of(tag.group(0)) if tag else (None, None)
    if not raw:
        return
    im = open_raster(mime, raw)
    im = im.convert("RGBA")
    im.thumbnail((200, 200), Image.LANCZOS)
    path = os.path.join(OUT, "logo.png")
    im.save(path, optimize=True)
    manifest["logo"] = {"src": "assets/logo.png", "width": im.size[0], "height": im.size[1]}


def save_creative(im, idx, seen):
    h = hashlib.sha1(im.tobytes()).hexdigest()
    if h in seen:
        return seen[h]
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    if im.width > 720:
        im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    if has_alpha:
        name = "creative-%02d.webp" % idx
        im.convert("RGBA").save(os.path.join(OUT, name), "WEBP", quality=80, method=6)
    else:
        name = "creative-%02d.jpg" % idx
        im.convert("RGB").save(os.path.join(OUT, name), "JPEG", quality=80, optimize=True, progressive=True)
    seen[h] = name
    return name


def creatives_from_files(order, skip=()):
    """Saved files referenced by the gallery (`src="./<file>"`), in gallery order.
    `skip` holds 1-based gallery positions that must not be published."""
    seen, out = {}, []
    for i, fname in enumerate(order):
        path = os.path.join(FILES, fname)
        if (i + 1) in skip or not os.path.exists(path):
            out.append(None)
            continue
        name = save_creative(Image.open(path), len(seen) + 1, seen)
        out.append(name)
    return out


def creatives_from_data_uris(pattern):
    seen, out = {}, []
    for tag in re.findall(pattern, page):
        mime, raw = data_uri_of(tag)
        if not raw:
            continue
        name = save_creative(Image.open(io.BytesIO(raw)), len(seen) + 1, seen)
        alt = re.search(r'alt="([^"]*)"', tag)
        out.append({"file": name, "alt": html.unescape(alt.group(1)) if alt else ""})
    return out


save_logo()

if SLUG == "honey-tribe":
    rows = re.search(r'id="tblGuide".*?<tbody>(.*?)</tbody>', page, re.S)
    guide = []
    for tr in re.findall(r"<tr>(.*?)</tr>", rows.group(1) if rows else "", re.S):
        cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(cells) == 3:
            guide.append({"mn": cells[0], "fs": cells[1], "why": cells[2]})
    manifest["guide"] = guide

elif SLUG == "rooming-house-expert":
    # gallery thumbnails are saved files named by Meta creative id; keep gallery order only
    order = re.findall(r'<img class="cc-thumb"[^>]*src="\./([0-9]+)"', page)
    # gallery card 7's image prints a property's street address (and another company's logo);
    # card 6's is an empty white frame. Both fall back to the dashboard's headline tile instead.
    manifest["creatives"] = creatives_from_files(order, skip={6, 7})

elif SLUG == "riverdance-rv":
    manifest["creatives"] = creatives_from_data_uris(r'<img(?![^>]*\bid=)[^>]*src="data:image/jpeg;base64,[^"]+"[^>]*>')

elif SLUG == "the-contract-shop":
    manifest["creatives"] = creatives_from_data_uris(r'<img(?![^>]*\bid=)[^>]*src="data:image/webp;base64,[^"]+"[^>]*>')

json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), indent=1)
print(SLUG, "assets:", sorted(os.listdir(OUT)))
