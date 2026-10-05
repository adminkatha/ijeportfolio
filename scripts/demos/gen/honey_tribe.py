"""Sample data.json for the Honey Tribe dashboard demo (Shopify x Meta, e-commerce).

Usage: python honey_tribe.py --out data.json [--manifest manifest.json]
The manifest (from assets.py) carries the generic "US seasonal retail guide" table lifted from
the saved page (month, retail season, why it matters). It holds no client data.
Every number below is synthetic and seeded; product names are generic, not the real catalogue.
"""
import json
import math
from common import (rng, days, months, shift, wchoice, lognorm, poisson, r2, write_json, arg,
                    MONFULL, GENERATED_AT)

R = rng(20261005)
DATA_THROUGH = "2026-10-04"
SHOP_START = "2020-03-02"
META_START = "2025-01-01"

# ---------------------------------------------------------------- generic catalogue
CATS = {
    "Outerwear / Layering": (["Kimono", "Duster", "Cardigan", "Shacket", "Wrap Jacket", "Cropped Jacket"], 115),
    "Bottoms - Pants": (["Wide-Leg Pant", "Palazzo Pant", "Straight Denim", "Cargo Pant", "Jogger"], 88),
    "Tops": (["Wrap Top", "Crop Top", "Tunic", "Button-Up Shirt", "Tank", "Bodysuit"], 62),
    "Dresses": (["Maxi Dress", "Midi Dress", "Shirt Dress", "Wrap Dress", "Shift Dress"], 105),
    "Jumpsuits / Rompers": (["Jumpsuit", "Romper", "Overall"], 98),
    "Jewelry": (["Hoop Earrings", "Bangle Set", "Statement Necklace", "Ring Set"], 34),
    "Bottoms - Shorts": (["Denim Short", "Linen Short", "Biker Short"], 48),
    "Two-Piece Sets": (["Lounge Set", "Co-ord Set", "Skirt Set"], 120),
    "Accessories": (["Head Wrap", "Canvas Tote", "Silk Scarf", "Woven Belt"], 30),
    "Bottoms - Skirts": (["Midi Skirt", "Mini Skirt", "Wrap Skirt"], 64),
    "Uncategorized": (["Statement Piece", "Gift Bundle", "Archive Piece"], 70),
}
CAT_WEIGHT = {"Outerwear / Layering": 20, "Bottoms - Pants": 18, "Tops": 15, "Dresses": 11,
              "Jumpsuits / Rompers": 8, "Jewelry": 6, "Bottoms - Shorts": 4, "Two-Piece Sets": 4,
              "Accessories": 2, "Bottoms - Skirts": 1.5, "Uncategorized": 13}
PRINTS = ["Sunset", "Indigo", "Terracotta", "Marigold", "Cobalt", "Saffron", "Mosaic", "Palm",
          "Ember", "Coral", "Olive", "Sienna", "Zebra", "Geo", "Floral", "Stripe", "Patchwork",
          "Batik", "Desert", "Lagoon", "Citrus", "Midnight", "Copper", "Meadow"]
SIZES = ["Small", "Medium", "Large", "X-Large", "XX-Large", "X-Small", "Small/Medium", "Medium/Large", "XXX-Large"]
SIZE_W = [16, 26, 24, 10, 4, 3, 5, 6, 1]

products = []
seen = set()
for cat, (nouns, base) in CATS.items():
    n = max(6, int(CAT_WEIGHT[cat] * 1.6))
    for i in range(n):
        for _ in range(20):
            name = R.choice(PRINTS) + " " + R.choice(nouns)
            if name not in seen:
                break
        seen.add(name)
        price = round(max(18, lognorm(R, base, 0.22)) / 1) - 0.01
        products.append({"p": name, "cat": cat, "price": price,
                         "w": CAT_WEIGHT[cat] * lognorm(R, 1.0, 0.9)})
P_W = [p["w"] for p in products]

# ---------------------------------------------------------------- geography (shuffled weights)
STATES = {"CA": 39, "TX": 30, "FL": 22, "NY": 20, "PA": 13, "IL": 12.5, "OH": 11.8, "GA": 11, "NC": 10.8,
          "MI": 10, "NJ": 9.3, "VA": 8.7, "WA": 7.8, "AZ": 7.4, "MA": 7, "TN": 7, "IN": 6.8, "MD": 6.2,
          "MO": 6.2, "WI": 5.9, "CO": 5.9, "MN": 5.7, "SC": 5.3, "AL": 5.1, "LA": 4.6, "KY": 4.5,
          "OR": 4.2, "OK": 4, "CT": 3.6, "UT": 3.4, "IA": 3.2, "NV": 3.2, "AR": 3, "MS": 2.9, "KS": 2.9,
          "NM": 2.1, "NE": 2, "ID": 1.9, "WV": 1.8, "HI": 1.4, "NH": 1.4, "ME": 1.4, "RI": 1.1, "MT": 1.1,
          "DE": 1, "SD": 0.9, "ND": 0.8, "AK": 0.7, "DC": 0.7, "VT": 0.6, "WY": 0.6}
ST_K = list(STATES)
ST_W = [v * lognorm(R, 1.0, 0.45) for v in STATES.values()]

PLATS = ["direct", "instagram", "facebook", "google", "email", "pinterest", "tiktok", "bing"]
PLAT_W = [44, 21, 17, 8, 5, 2.5, 1.5, 1]

# ---------------------------------------------------------------- orders + line items
SEASON = {1: 0.85, 2: 0.8, 3: 1.0, 4: 1.0, 5: 1.08, 6: 1.02, 7: 1.12, 8: 1.0, 9: 0.92, 10: 0.95, 11: 1.25, 12: 1.3}


def level(iso_d):
    y = int(iso_d[:4]) + (int(iso_d[5:7]) - 1) / 12.0
    # slow ramp, a plateau, then a gentle easing: sample shape only
    return 0.8 * (2.4 + 2.2 * (1 - math.exp(-(y - 2020.2) / 1.6)) - 0.35 * max(0, y - 2024.0))


orders, lines = [], []
customers = []
cust_seq = 0
mood = 1.0
for day in days(SHOP_START, DATA_THROUGH):
    mood = max(0.45, min(1.8, mood * math.exp(R.gauss(0, 0.06)) * (1.0 if R.random() > 0.02 else 1.6)))
    mood = 1.0 + (mood - 1.0) * 0.93
    lam = level(day) * SEASON[int(day[5:7])] * mood
    for _ in range(poisson(R, lam)):
        if customers and R.random() < 0.40:
            cid = R.choice(customers[-1800:]) if R.random() < 0.7 else R.choice(customers)
            ct = "ret"
        else:
            cust_seq += 1
            cid = "c%05d" % cust_seq
            customers.append(cid)
            ct = "first"
        pr = wchoice(R, ST_K, ST_W) if R.random() > 0.015 else ""
        plat = wchoice(R, PLATS, PLAT_W)
        n_lines = wchoice(R, [1, 2, 3, 4], [74, 19, 5, 2])
        oi = len(orders)
        q_tot, sub = 0, 0.0
        for _l in range(n_lines):
            pdx = R.choices(range(len(products)), weights=P_W, k=1)[0]
            prod = products[pdx]
            q = 1 if R.random() > 0.08 else 2
            disc = 1.0 if R.random() > 0.22 else R.choice([0.7, 0.8, 0.85])
            amt = r2(prod["price"] * q * disc)
            if prod["cat"] in ("Jewelry", "Accessories"):
                sz = R.choice(["OS", "One Size"]) if R.random() > 0.2 else ""
            elif prod["cat"] == "Uncategorized":
                sz = "" if R.random() > 0.4 else wchoice(R, SIZES, SIZE_W)
            else:
                sz = wchoice(R, SIZES, SIZE_W)
            lines.append({"d": day, "p": prod["p"], "cat": prod["cat"], "q": q, "amt": amt,
                          "sz": sz, "oi": oi, "ct": ct, "pr": pr})
            q_tot += q
            sub += amt
        ship = 0 if sub >= 150 else R.choice([7.95, 9.95, 12.5])
        tot = r2(sub * R.uniform(1.04, 1.09) + ship)
        orders.append({"d": day, "cid": cid, "ct": ct, "pr": pr, "plat": plat, "tot": tot, "q": q_tot})

# ---------------------------------------------------------------- curated trend sheet (product-months)
trend_m = {}
for l in lines:
    if l["d"] < "2024-01-01":
        continue
    m = int(l["d"][5:7])
    k = (m, l["p"])
    t = trend_m.setdefault(k, {"m": m, "mn": MONFULL[m - 1], "t": l["p"], "cat": l["cat"], "u": 0, "s": 0.0})
    t["u"] += l["q"]
    t["s"] += l["amt"]
SE = {12: "Winter", 1: "Winter", 2: "Winter", 3: "Spring", 4: "Spring", 5: "Spring",
      6: "Summer", 7: "Summer", 8: "Summer", 9: "Fall", 10: "Fall", 11: "Fall"}
trend = []
for t in trend_m.values():
    u = max(1, int(round(t["u"] * R.uniform(0.8, 1.25))))
    trend.append({"m": t["m"], "mn": t["mn"], "se": SE[t["m"]], "t": t["t"], "cat": t["cat"],
                  "u": u, "s": round(t["s"] * u / max(1, t["u"]))})

# ---------------------------------------------------------------- seasons guide (generic, from the page)
man_path = arg("--manifest")
guide = json.load(open(man_path, encoding="utf-8")).get("guide", []) if man_path else []
seasons = []
if guide:
    for g in guide:
        m = MONFULL.index(g["mn"]) + 1
        seasons.append({"m": m, "mn": g["mn"], "se": SE[m], "fs": g["fs"], "why": g["why"]})
else:
    seasons = [{"m": m, "mn": MONFULL[m - 1], "se": SE[m], "fs": SE[m], "why": ""} for m in range(1, 13)]

# ---------------------------------------------------------------- Meta ads (daily rows)
# Agency-convention campaign/ad names (no IDs, no person names), active in plausible windows.
CAMPAIGNS = [
    ("Honeytribe-Sales-Campaign-6thJune25", "2025-01-01", "2025-07-16", "sales",
     ["Sales-Ad-2025collections", "Traffic-Ad-NewArrivalCollection"]),
    ("NewSales-Campaign-17July25", "2025-07-17", "2025-10-30", "sales",
     ["Ad+NewArrival+30July25", "Sales-Ad-2025collections"]),
    ("HT-TrafficCampaign-31stOct'25", "2025-10-31", "2025-12-31", "traffic",
     ["NewArrival-17thOct'25", "Traffic-Ad-Restock Alert-26thDec25"]),
    ("HT-SalesAdv+Campaign-2026", "2026-01-02", "2026-10-04", "sales",
     ["HT-Sales-Ad-2026collections", "HT-Ad-NewArrivalCollections-Video"]),
    ("HT-Traffic-NewArrival-23rdJan26", "2026-01-23", "2026-04-30", "traffic",
     ["HT-Ad-RestockCollection-13thFeb26", "HT-Ad-Restock&NewArrivals-20thMar26"]),
    ("HT-SalesCampaign-8thMay26", "2026-05-08", "2026-08-20", "sales",
     ["HT-Ad-CustomerReview-8thMay26", "HT-Ad-NewArrivalCollection-Video-8thMay26"]),
    ("HT-Sales-RetargetingCampaign-RestockCollection-USAlocation-21stAug26", "2026-08-21", "2026-10-04", "sales",
     ["HT-Ad-RestockCollection-Video-21stAug26"]),
    ("HT-TrafficCampaign-New Arrival-2ndOct26 Campaign", "2026-09-12", "2026-10-04", "traffic",
     ["HT-Ad-NewArrivalCollection-Video4"]),
]
# Public ad copy shown on the creative cards (kept: no names, IDs or personal data).
COPY = {
    "HT-Sales-Ad-2026collections": ("HT-Sales-Ad-2026collections",
        "Own your style. Join the TRIBE. Bold styles, fresh details, and modern cuts made to stand out. "
        "Step into the TRIBE and own your style."),
    "HT-Ad-RestockCollection-Video-21stAug26": ("Want a look that turns heads?",
        "Fresh arrivals, bold designs, and effortless style are here. Step into the TRIBE and make your "
        "next look unforgettable."),
    "HT-Ad-NewArrivalCollection-Video4": ("Ready for Something New?",
        "Ready to refresh your wardrobe? Meet the new styles designed to bring something fresh to your "
        "everyday look."),
}
ads, rows = {}, []
cid_seq = 0
for camp, a, b, kind, ad_names in CAMPAIGNS:
    budget = lognorm(R, 16 if kind == "sales" else 5, 0.25)
    for name in ad_names:
        cid_seq += 1
        ads[(camp, name)] = "cr%02d" % cid_seq
    for day in days(a, b):
        for name in ad_names:
            share = 1.0 / len(ad_names) * R.uniform(0.55, 1.45)
            spend = max(0.0, budget * share * R.uniform(0.6, 1.35))
            if spend < 0.5:
                continue
            cpm = lognorm(R, 17.5 if kind == "sales" else 9.5, 0.18)
            imps = int(spend / cpm * 1000)
            reach = int(imps / R.uniform(1.08, 1.35))
            ctr = lognorm(R, 0.042 if kind == "sales" else 0.07, 0.2)
            lclk = int(imps * ctr)
            clicks = int(lclk * R.uniform(1.15, 1.5))
            atc = int(lclk * lognorm(R, 0.11, 0.3)) if kind == "sales" else int(lclk * 0.02)
            pur = poisson(R, max(0.0, atc * lognorm(R, 0.12, 0.35))) if kind == "sales" else (1 if R.random() < 0.05 else 0)
            rev = r2(sum(lognorm(R, 118, 0.35) for _ in range(pur)))
            rows.append({"d": day, "camp": camp, "ad": name, "cid": ads[(camp, name)],
                         "spend": r2(spend), "imps": imps, "reach": reach, "clicks": clicks,
                         "lclk": lclk, "atc": atc, "pur": pur, "rev": rev,
                         "freq": round(imps / max(1, reach), 3)})

creatives = []
for (camp, name), cid in ads.items():
    head, body = COPY.get(name, (name, ""))
    creatives.append({"cid": cid, "ad": name, "head": head, "body": body,
                      "thumb": "", "link": "", "cached": False})

# ---------------------------------------------------------------- sessions (month x platform)
sess_rows = []
SESS_W = {"direct": 50, "instagram": 22, "facebook": 17, "google": 7, "email": 1.2, "pinterest": 0.5,
          "tiktok": 0.6, "bing": 0.25, "linktree": 0.3}
for m in months("2024-01-01", "2026-09-30"):
    tot = lognorm(R, 5200, 0.22)
    for plat, w in SESS_W.items():
        sess_rows.append({"m": m, "plat": plat, "sessions": int(tot * w / 100 * R.uniform(0.7, 1.3))})

# ---------------------------------------------------------------- Meta demographics
AGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
AGE_W = [1.5, 11, 34, 27, 13, 9]
age_gender = []
for m in months("2025-10-01", "2026-09-30"):
    base = lognorm(R, 52000, 0.2)
    for age, w in zip(AGES, AGE_W):
        for g, gw in (("female", 0.86), ("male", 0.12), ("unknown", 0.02)):
            reach = int(base * w / 100 * gw * R.uniform(0.75, 1.25))
            imps = int(reach * R.uniform(1.1, 1.4))
            lclk = int(imps * R.uniform(0.02, 0.05))
            age_gender.append({"d": m + "-01", "age": age, "g": g, "reach": reach, "imps": imps,
                               "lclk": lclk, "spend": r2(imps / 1000 * R.uniform(9, 16))})
REGIONS = ["Georgia", "Texas", "New York", "Maryland", "California", "Florida", "North Carolina",
           "Illinois", "New Jersey", "Virginia", "Pennsylvania", "Alabama", "Ohio", "Tennessee"]
region = []
reg_w = {r_: lognorm(R, 1.0, 0.5) for r_ in REGIONS}
for m in months("2025-10-01", "2026-09-30"):
    for rg, w in reg_w.items():
        reach = int(5200 * w * R.uniform(0.6, 1.4))
        imps = int(reach * R.uniform(1.1, 1.4))
        region.append({"m": m, "region": rg, "reach": reach, "imps": imps,
                       "lclk": int(imps * R.uniform(0.02, 0.05)),
                       "spend": r2(imps / 1000 * R.uniform(9, 16))})

data = {
    "client": "Honey Tribe",
    "generated_at": GENERATED_AT,
    "data_through": DATA_THROUGH,
    "brand": {"mark": "assets/logo.png"},
    "shopify": {"range": [SHOP_START, DATA_THROUGH], "orders": orders, "lines": lines},
    "meta": {"range": [META_START, DATA_THROUGH], "rows": rows,
             "campaigns": sorted({c[0] for c in CAMPAIGNS})},
    "trend": trend,
    "seasons": seasons,
    "sessions": {"enabled": True, "since": "2024-01-01", "rows": sess_rows},
    "demographics": {"age_gender": age_gender, "region": region, "window": "last_365d"},
    "creatives": {"enabled": True, "items": creatives},
}
write_json(data, arg("--out", "data.json"))
print("honey-tribe: %d orders, %d lines, %d meta rows, %d creatives" % (len(orders), len(lines), len(rows), len(creatives)))
