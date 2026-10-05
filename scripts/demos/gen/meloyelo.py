"""Sample data.json for the MeloYelo dashboard demo (e-bike sales, rider CRM, inventory, marketing).

Usage: python meloyelo.py --out data.json [--manifest manifest.json]
Every figure is synthetic and seeded. Selling agents are neutral placeholders ("Agent #07"),
never people; leads and riders carry only generated ids. Model, colour, region and stage labels
are the public/generic vocabulary the dashboard uses.
"""
import math
from common import rng, days, months, shift, wchoice, lognorm, poisson, r2, write_json, arg, GENERATED_AT

R = rng(20261006)
DATA_THROUGH = "2026-10-05"
SALES_START = "2023-04-01"
CRM_MAX = "2026-09-28"

# ---------------------------------------------------------------- vocabulary
MODELS = {  # model: (price median, cogs share, weight, colours, sizes)
    "SuperLite3": (3790, 0.57, 30, ["Haze Purple", "Blaze Bronze", "Storm Grey"], ["Small", "Large"]),
    "Ascent3": (3190, 0.59, 28, ["Sunshine Yellow", "Moonlight Blue", "Forest Green"], ["Small", "Large"]),
    "Town'n Trail": (2490, 0.58, 20, ["Jade", "Electric Blue", "Coral"], ["Small", "Large"]),
    "SuperTrail": (4290, 0.6, 12, ["Gunmetal Grey", "Champagne", "Sage"], ["Large"]),
    "Zoomin": (1690, 0.63, 8, ["Seashell", "Teal"], [""]),
}
AGENTS = ["Agent #%02d" % i for i in range(1, 37)]
AGENT_W = [lognorm(R, 1.0, 0.75) for _ in AGENTS]
AGENT_ST = {a: ("Active" if R.random() > 0.12 else "Inactive") for a in AGENTS}
CTS = ["Franchisee", "Stockist / Retailer", "Associate", "Admin/Sales", "Franchise - Stocking Agent", "Other"]
CT_W = [66, 14, 7, 6, 5, 2]
REGIONS = ["Canterbury", "Wellington", "Hawke's Bay", "Waikato", "Auckland", "Nelson-Marlborough", "Bay of Plenty",
           "Northland", "Taranaki", "Otago", "Manawatu-Whanganui", "Southland", "Gisborne", "West Coast"]
REG_W = [lognorm(R, 1.0, 0.5) * w for w in [10, 8, 7, 7, 9, 6, 5, 4, 4, 4, 3, 2, 1, 1]]
FY_START = {"m": 4}

# ---------------------------------------------------------------- sales lines
lines = []
order_no = 0


def fy_season(day):
    m = int(day[5:7])
    return {9: 1.15, 10: 1.25, 11: 1.3, 12: 1.2, 1: 0.95, 2: 1.0, 3: 1.05, 4: 0.85, 5: 0.75, 6: 0.7, 7: 0.75, 8: 0.95}[m]


for day in days(SALES_START, DATA_THROUGH):
    y = int(day[:4]) + int(day[5:7]) / 12.0
    base = 1.45 * (1 + 0.06 * (y - 2023.3)) * fy_season(day)
    if R.random() < 0.035:
        base *= R.uniform(2.0, 3.2)  # agent stock-up days
    wk = 0.35 if R.random() < 2 / 7 else 1.0
    for _ in range(poisson(R, base * wk)):
        order_no += 1
        o = "SO-%05d" % order_no
        ag = "Direct Sale" if R.random() < 0.04 else ("MeloYelo Internal" if R.random() < 0.02 else wchoice(R, AGENTS, AGENT_W))
        st = "Active" if ag in ("Direct Sale", "MeloYelo Internal") else AGENT_ST[ag]
        ct = wchoice(R, CTS, CT_W)
        bikes = wchoice(R, [0, 1, 2, 3], [34, 52, 10, 4])
        for _b in range(bikes):
            m = wchoice(R, list(MODELS), [v[2] for v in MODELS.values()])
            price, cshare, _w, cols, sizes = MODELS[m]
            size, col = R.choice(sizes), R.choice(cols)
            p = ", ".join([x for x in (m if m != "Town'n Trail" else "Town'n Trail 3", size, col) if x])
            grp = "Bikes" if R.random() > 0.03 else "Special Bike Package"
            rev = r2(lognorm(R, price, 0.06))
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": m, "p": p, "g": grp,
                          "u": 1, "r": rev, "c": r2(rev * lognorm(R, cshare, 0.04))})
        for _p in range(wchoice(R, [0, 1, 2, 3], [45, 30, 17, 8])):
            g = wchoice(R, ["Parts", "Accessories", "Clothing", "Other"], [50, 40, 6, 4])
            q = wchoice(R, [1, 2, 4], [80, 15, 5])
            unit = lognorm(R, {"Parts": 38, "Accessories": 26, "Clothing": 22, "Other": 9}[g], 0.5)
            rev = r2(unit * q)
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": "", "g": g, "u": q,
                          "p": {"Parts": "Spare part", "Accessories": "Accessory", "Clothing": "Rider apparel", "Other": "Sundry"}[g],
                          "r": rev, "c": r2(rev * (0.5 if g in ("Parts", "Accessories") else 0.0))})
        if bikes and R.random() < 0.55:
            rev = r2(R.choice([45, 65, 85, 95]) * bikes)
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": "", "g": "Freight", "u": 1,
                          "p": "Freight", "r": rev, "c": 0.0})
        if bikes and R.random() < 0.3:
            rev = -r2(R.choice([100, 150, 200, 250, 300]) * bikes)
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": "", "g": "Discounts & Promotions",
                          "u": 1, "p": "Promotion credit", "r": rev, "c": 0.0})
    # parts & accessories orders without a bike (agents restocking, riders servicing)
    for _ in range(poisson(R, 1.75 * wk * (1 + 0.05 * (y - 2023.3)))):
        order_no += 1
        o = "SO-%05d" % order_no
        ag = "Direct Sale" if R.random() < 0.12 else wchoice(R, AGENTS, AGENT_W)
        st = "Active" if ag == "Direct Sale" else AGENT_ST[ag]
        ct = wchoice(R, CTS, CT_W)
        for _p in range(wchoice(R, [1, 2, 3, 4], [48, 30, 14, 8])):
            g = wchoice(R, ["Parts", "Accessories", "Clothing", "Other"], [56, 36, 5, 3])
            q = wchoice(R, [1, 2, 3, 5], [70, 18, 7, 5])
            unit = lognorm(R, {"Parts": 42, "Accessories": 29, "Clothing": 24, "Other": 11}[g], 0.55)
            rev = r2(unit * q)
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": "", "g": g, "u": q,
                          "p": {"Parts": "Spare part", "Accessories": "Accessory", "Clothing": "Rider apparel", "Other": "Sundry"}[g],
                          "r": rev, "c": r2(rev * (0.5 if g in ("Parts", "Accessories") else 0.0))})
        if R.random() < 0.35:
            lines.append({"d": day, "o": o, "ag": ag, "as": st, "ct": ct, "m": "", "g": "Freight", "u": 1,
                          "p": "Freight", "r": R.choice([9.5, 12.0, 15.0]), "c": 0.0})

# ---------------------------------------------------------------- CRM: riders, requests, events
SRCS = ["Warranty Registration", "Unattributed", "Website Form", "AgentForm", "Agent"]
LEGACY = ["Ascent", "SuperLite", "Town n Trail", "Traverse", "Tranzit", "Ascent MD", "Townee", "Tranzit MD",
          "Townee 2.0", "Town'n Trail", "SuperTrail"]
LEG_W = [lognorm(R, 1.0, 0.6) * w for w in [12, 10, 7, 4, 4, 4, 3, 2, 2, 2, 1]]
riders = []
rid = 0
# bulk warranty imports appear as steps; organic joins trickle in
for imp_day, n in (("2024-02-12", 1520), ("2025-03-03", 940), ("2026-05-18", 690)):
    for _ in range(n):
        rid += 1
        riders.append({"id": "R%05d" % rid, "d": imp_day, "ag": wchoice(R, AGENTS, AGENT_W),
                       "src": "Warranty Registration" if R.random() < 0.55 else "Unattributed",
                       "rg": wchoice(R, REGIONS, REG_W), "m": wchoice(R, LEGACY, LEG_W)})
for day in days("2024-01-01", CRM_MAX):
    for _ in range(poisson(R, 0.95)):
        rid += 1
        riders.append({"id": "R%05d" % rid, "d": day, "ag": wchoice(R, AGENTS, AGENT_W),
                       "src": wchoice(R, SRCS, [30, 22, 30, 15, 3]),
                       "rg": wchoice(R, REGIONS, REG_W), "m": wchoice(R, LEGACY + ["SuperLite3", "Ascent3"], LEG_W + [6, 6])})

STAGES = ["Lead", "Made contact", "Contact Failed", "Test Ride Booked", "Test Ride Completed",
          "Test Ride Declined", "Offer Accepted", "Offer Declined", "MY Customer"]
requests, events = [], []
lid = 0
for day in days("2025-01-01", CRM_MAX):
    m = int(day[5:7])
    lam = 1.05 * {9: 1.3, 10: 1.4, 11: 1.3, 4: 1.2, 5: 1.0, 6: 0.8, 7: 0.75}.get(m, 1.0)
    for _ in range(poisson(R, lam)):
        lid += 1
        pid = "L%05d" % lid
        src = wchoice(R, ["Website Form", "AgentForm", "Agent"], [62, 34, 4])
        ag = wchoice(R, AGENTS, AGENT_W)
        rg = wchoice(R, REGIONS, REG_W)
        # furthest stage reached so far (late-window leads have had less time)
        age = (int(CRM_MAX[:4]) * 365 + int(CRM_MAX[5:7]) * 30) - (int(day[:4]) * 365 + int(day[5:7]) * 30)
        r_ = R.random()
        if r_ < 0.18:
            path = ["Test Ride Request", "Lead"]
        elif r_ < 0.26:
            path = ["Test Ride Request", "Made contact", "Contact Failed"]
        elif r_ < 0.36:
            path = ["Test Ride Request", "Made contact"]
        elif r_ < 0.47:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked"]
        elif r_ < 0.55:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked", "Test Ride Declined"]
        elif r_ < 0.66:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked", "Test Ride Completed"]
        elif r_ < 0.74:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked", "Test Ride Completed", "Offer Declined"]
        elif r_ < 0.80:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked", "Test Ride Completed", "Offer Accepted"]
        else:
            path = ["Test Ride Request", "Made contact", "Test Ride Booked", "Test Ride Completed", "Offer Accepted", "MY Customer"]
        if age < 45 and len(path) > 3 and R.random() < 0.6:
            path = path[:3]
        stage = path[-1] if path[-1] != "Test Ride Request" else "Lead"
        stl = int(lognorm(R, 1250, 1.05)) if len(path) > 2 or R.random() < 0.4 else None
        req = {"id": pid, "d": day, "ag": ag, "src": src, "rg": rg, "stage": stage}
        if stl is not None:
            req["stl"] = stl
        requests.append(req)
        t = day
        for s in path:
            if s == "Lead":
                continue
            events.append({"id": pid, "m": s, "d": t, "ag": ag, "src": src})
            t = shift(t, R.randint(1, 9))
            if t > CRM_MAX:
                break
# organic "MY Customer" conversions outside the test-ride flow
for r_ in riders:
    if r_["src"] in ("Website Form", "AgentForm", "Agent") and r_["d"] >= "2025-01-01":
        events.append({"id": r_["id"], "m": "MY Customer", "d": r_["d"], "ag": r_["ag"], "src": r_["src"]})

# ---------------------------------------------------------------- inventory
available = []
for m, (price, cs, w, cols, sizes) in MODELS.items():
    for size in sizes:
        for col in cols:
            if R.random() < 0.15:
                continue
            name = ", ".join([x for x in (m if m != "Town'n Trail" else "Town'n Trail 3", size, col) if x])
            q = max(0, int(lognorm(R, 22, 0.75)) - (6 if R.random() < 0.3 else 0))
            available.append({"v": name, "m": m, "q": q, "code": "V-%03d" % (len(available) + 1)})
onway = [
    {"po": "PI41_80pcs AS3", "m": "Ascent3", "q": 80, "stage": "Shipped", "prod": "2026-08-17", "ship": "2026-09-08", "tl": "On track", "act": "Bikes are packed and on the water."},
    {"po": "PI42_100pcs Superlite3", "m": "SuperLite3", "q": 100, "stage": "Packed", "prod": "2026-08-28", "ship": "2026-10-14", "tl": "On track", "act": "Packed; waiting on the next container."},
    {"po": "PI43_60pcs TNT3", "m": "Town'n Trail", "q": 60, "stage": "Assembly", "prod": "2026-09-12", "ship": "2026-10-27", "tl": "On track", "act": "Frames done, assembly under way."},
    {"po": "PI44_40pcs Supertrail", "m": "SuperTrail", "q": 40, "stage": "Inspection", "prod": "2026-09-20", "ship": "2026-11-03", "tl": "Overdue", "act": "Inspection found a paint issue; respray booked."},
    {"po": "PI45_120pcs OffRode", "m": "OffRode", "q": 120, "stage": "Material Preparation", "prod": "2026-10-24", "ship": "2026-12-01", "tl": "On track", "act": "Waiting on accessories confirmation."},
]
for o in onway:
    o["upd"] = "2026-10-02"

# ---------------------------------------------------------------- email (Campaign Monitor)
email_names = [  # most recent first, as the dashboard lists them
    ("October 2026 EDM to agents", "2026-10-01"), ("Spring riding guide EDM", "2026-09-27"),
    ("Customer survey results", "2026-09-21"), ("Test ride weekend reminder", "2026-09-15"),
    ("$50 Accessory discount code - final batch", "2026-09-08"), ("September 2026 EDM to agents", "2026-09-01"),
    ("$50 Accessory discount code - fourth batch", "2026-08-28"), ("Supergold campaign EDM", "2026-08-19"),
    ("Customer survey reminder, August 2026", "2026-08-12"), ("$50 Accessory discount code - third batch", "2026-08-06"),
    ("August 2026 EDM to agents", "2026-08-03"), ("SuperTrail champagne - main audience reminder", "2026-07-29"),
    ("$50 Accessory discount code - second batch", "2026-07-22"), ("Finance offer EDM", "2026-07-15"),
    ("Customer survey, July 2026", "2026-07-08"), ("July 2026 EDM to agents", "2026-07-01"),
    ("SuperTrail champagne - test ride, no booking", "2026-06-24"), ("SuperTrail champagne - MY Customers 12m+", "2026-06-24"),
    ("$50 Accessory discount code", "2026-06-17"), ("Why riders choose an e-bike EDM", "2026-06-10"),
    ("June 2026 EDM to agents", "2026-06-01"), ("Winter servicing reminder", "2026-05-26"),
    ("New colourways announcement", "2026-05-19"), ("Mid-year sale EDM", "2026-05-12"),
    ("May 2026 EDM to agents", "2026-05-01"),
]
camp_rows = []
for i, (name, dt) in enumerate(email_names):
    agentish = "agents" in name
    small = "discount code" in name and R.random() < 0.6
    rec = R.randint(18, 30) if agentish else (R.randint(1, 3) if small else int(lognorm(R, 21500, 0.08)))
    uo = int(rec * (R.uniform(0.62, 0.86) if agentish or rec < 40 else R.uniform(0.26, 0.34)))
    uc = int(rec * (R.uniform(0.0, 0.03) if rec < 40 else R.uniform(0.008, 0.026)))
    camp_rows.append({"name": name, "date": dt, "recipients": rec, "uopens": uo, "uclicks": uc})
email = {"mode": "live", "extracted_through": "2026-10-01",
         "totals": {"campaigns": 371, "sends": 2318430, "unique_opens": 893115, "clicks": 77420},
         "campaigns": camp_rows}

# ---------------------------------------------------------------- Meta ads (daily, per campaign)
META = [
    ("2607-find-your-perfect-e-bike - Version B - Incentive", "2026-07-06", "2026-10-04", 17, 0.012, 0.22),
    ("2607-find-your-perfect-e-bike - Version A - No Incentive", "2026-07-06", "2026-10-04", 9, 0.011, 0.15),
    ("2609 September Campaign", "2026-09-01", "2026-10-04", 19, 0.024, 0.012),
    ("2609 - Supergold-always-on", "2026-09-02", "2026-10-04", 11, 0.035, 0.007),
    ("2609_RideGuide_Recruitment_Auckland/Franklin (leads)", "2026-09-05", "2026-10-04", 4.5, 0.024, 0.012),
    ("2609-event-promo-christchurch-supporting-awareness", "2026-09-10", "2026-10-02", 4, 0.0012, 0.0),
    ("2609_RideGuide_Recruitment_Napier/Hastings", "2026-09-12", "2026-10-04", 3, 0.02, 0.0),
    ("2610-event-promo-north-shore", "2026-10-01", "2026-10-04", 10, 0.004, 0.0),
    ("2605 Autumn always-on", "2026-05-01", "2026-07-05", 14, 0.015, 0.05),
]
meta_rows = []
for camp, a, b, budget, ctr_m, lead_rate in META:
    for day in days(a, b):
        sp = r2(lognorm(R, budget, 0.3))
        im = int(sp / lognorm(R, 10.8, 0.2) * 1000)
        lc = int(im * lognorm(R, ctr_m, 0.2))
        cl = int(lc * R.uniform(1.3, 1.6))
        lpv = int(lc * R.uniform(0.6, 0.82))
        ld = poisson(R, lc * lead_rate)
        meta_rows.append({"d": day, "camp": camp, "sp": sp, "im": im, "cl": cl, "lc": lc, "ld": ld, "lpv": lpv})

data = {
    "client": "MeloYelo",
    "generated_at": GENERATED_AT,
    "data_through": DATA_THROUGH,
    "brand": {"mark": "assets/logo.png"},
    "targets": {"fy_bikes": 820},
    "sales": {"range": [SALES_START, DATA_THROUGH], "lines": lines},
    "crm": {"range": ["2024-01-01", CRM_MAX], "riders": riders, "requests": requests, "events": events},
    "inventory": {"available": available, "onway": onway},
    "email": email,
    "meta_ads": {"enabled": True, "mode": "live", "range": ["2026-05-01", "2026-10-04"], "rows": meta_rows},
}
write_json(data, arg("--out", "data.json"))
print("meloyelo: %d sales lines, %d riders, %d requests, %d events, %d meta rows" %
      (len(lines), len(riders), len(requests), len(events), len(meta_rows)))
