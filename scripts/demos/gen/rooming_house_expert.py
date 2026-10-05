"""Sample data.json for the Rooming House Expert dashboard demo (Meta funnel, email, lead magnet, demographics).

Usage: python rooming_house_expert.py --out data.json [--manifest manifest.json]
Every figure is synthetic and seeded. One neutral ad-account label is used. Ad copy is the client's
public ad copy, shortened where it named a property, a street address or a town; campaign and ad
names lose street names and team members' first names. The saved page only rendered the Meta tab,
so the email, lead-magnet and demographics labels (campaigns, lists, automations, templates, quiz
answers) are neutral placeholders, not the client's.
"""
import json
import math
from datetime import date, timedelta
from common import rng, days, months, shift, wchoice, lognorm, poisson, r2, write_json, arg, GENERATED_AT

R = rng(20261008)
META_START, META_END = "2024-01-15", "2026-10-05"
MAIL_START, MAIL_END = "2025-07-21", "2026-09-29"
SEP = "\u001f"
ACCT = "rhe"
man = json.load(open(arg("--manifest"), encoding="utf-8")) if arg("--manifest") else {}
imgs = man.get("creatives", [])


def img(i):  # 1-based gallery position -> asset path or ""
    return ("assets/" + imgs[i - 1]) if i - 1 < len(imgs) and imgs[i - 1] else ""


# ---------------------------------------------------------------- creatives (public ad copy, vetted)
CREATIVES = [  # gallery position, head, body
    (1, "Convert. Rent. Repeat.", "Turn 1 property into 2-3x rental income - see if yours qualifies! Not every home is suited to a "
        "rooming house conversion, but if yours is, it could be earning far more than a standard rental."),
    (2, "Reel_Compilation1 V2", "Most property investors are still playing the same tired game: low yield, long hold, hope for "
        "growth. We take a different approach."),
    (3, "Transform Your $500/Wk Rental Into $2,300/Wk", "Are you stuck with a standard investment property only yielding "
        "$500/week? In The Ultimate Rooming House Conversion Guide, we break down the strategy smart investors use."),
    (4, "Access the Private Investor Brochure", "Now for sale: a fully registered 9-bedroom rooming house, purpose-built "
        "for both people and performance. Tap Learn More for the brochure."),
    (5, "Pivot to Positive Cash Flow", "Over the last two decades, my team and I have completed hundreds of conversions "
        "for savvy investors. We handle council permits, builders and designers so you do not have to."),
    (6, "Replace Chaos With Control", "High rooming house returns sound attractive. Getting the project built is where "
        "things get messy. A standardised studio system replaces the blank page."),
    (7, "Fully Licensed Class 1B Rooming House", "A fully licensed Class 1B rooming house opportunity, already positioned "
        "for strong cashflow. Sign up for the full property brochure."),
    (8, "A Proven High-Yield Rooming House Investment", "While most investors settle for 3-5% residential yields, this "
        "licensed Class 1B rooming house is doing something entirely different."),
    (9, "Could Your Rooming House Qualify?", "You might not have to pay land tax on your rooming house - some Victorian "
        "rooming houses may qualify for an exemption, subject to the relevant requirements."),
    (10, "Council approval: learn more", "Permits for a rooming house conversion? In Victoria it takes both a planning "
         "permit and a building permit - and we handle it from start to finish."),
    (11, "Could Your Rooming House Qualify?", "Some Victorian rooming houses may qualify for a land tax exemption. The "
         "Ultimate Rooming House Conversion Guide breaks down what investors need to know."),
    (12, "4 Bedrooms to 9 Bedrooms Rooming House Conversion!", "From 4 bedrooms to 9: one smart conversion turned a "
         "modest rental into a high-yield rooming house."),
]
# ad name (vetted), gallery position, created date
ADS = {
    "Static Images_URHCG_Download": (1, "2026-03-26"),
    "Reel_Compilation1 V2": (2, "2026-05-29"),
    "Reel_AI_Signup": (0, "2026-01-29"),
    "Static Images_Guide_Download": (3, "2025-11-04"),
    "Static Images_Brochure_Listing B": (4, "2025-12-05"),
    "Reel_Founder_Cashflow": (5, "2026-02-10"),
    "Video Reel_Listing A_0726_2": (6, "2026-07-16"),
    "Static Images_LICENSED_Listing C_0528": (7, "2026-06-03"),
    "Static Images_Listing D_Brochure": (8, "2026-02-01"),
    "RHE | Interstate | Winner Angle - Copy": (9, "2026-09-21"),
    "Reel_Council Approval_Learn More": (10, "2026-01-20"),
    "RHE | Interstate | Land Tax": (11, "2026-04-02"),
    "Reel_CarSeat2_Download": (12, "2026-04-16"),
    "Reel1_ it's not a maybe one day development play_Download": (0, "2026-03-19"),
    "Reel_Community Looks_V1_LearnMore": (0, "2026-01-01"),
    "Static Images_Guide_2025_A": (0, "2025-01-20"),
    "Static Images_Guide_2025_B": (0, "2025-05-12"),
    "Reel_Guide_2024": (0, "2024-01-15"),
    "Static Images_Guide_2024": (0, "2024-06-01"),
}
CAMPAIGNS = [  # name, start, end, daily budget, ctr, lead rate (leads / link click), ads
    ("LEADS_RHE_URHCG - 2024", "2024-01-15", "2024-12-31", 48, 0.012, 0.21, ["Reel_Guide_2024", "Static Images_Guide_2024"]),
    ("LEADS_RHE_URHCG - 2025", "2025-01-02", "2025-11-29", 82, 0.0125, 0.2, ["Static Images_Guide_2025_A", "Static Images_Guide_2025_B", "Static Images_Guide_Download"]),
    ("LEADS_RHE_URHCG - 12/2025", "2025-12-01", META_END, 140, 0.0098, 0.11,
     ["Static Images_URHCG_Download", "Reel_AI_Signup", "Reel_Compilation1 V2", "Reel_CarSeat2_Download", "Reel1_ it's not a maybe one day development play_Download",
      "Reel_Community Looks_V1_LearnMore", "Reel_Founder_Cashflow", "Reel_Council Approval_Learn More"]),
    ("LEADS_RHE_Interstate_URHCG", "2026-04-02", META_END, 26, 0.017, 0.12, ["RHE | Interstate | Winner Angle - Copy", "RHE | Interstate | Land Tax"]),
    ("LISTING LEADS_SCD_Listing B-Dec2025", "2025-12-05", "2026-10-02", 19, 0.015, 0.06, ["Static Images_Brochure_Listing B"]),
    ("LISTING LEADS_SCD_Listing D-February2026 Campaign", "2026-02-01", META_END, 17, 0.021, 0.075, ["Static Images_Listing D_Brochure"]),
    ("LISTING LEADS_SCD_Listing C-April2026 Campaign", "2026-06-03", META_END, 18, 0.013, 0.07, ["Static Images_LICENSED_Listing C_0528"]),
    ("LISTING LEADS_SCD_Listing A-July 2026 Campaign", "2026-07-16", META_END, 38, 0.017, 0.085, ["Video Reel_Listing A_0726_2"]),
    ("LIKES_RHE Page Campaign 03/31/2026", "2026-03-31", META_END, 20, 0.0002, 0.0, ["Reel_Community Looks_V1_LearnMore"]),
]
cid_of = {name: "cr%02d" % (i + 1) for i, name in enumerate(ADS)}

rows = []
for camp, a, b, budget, ctr, lrate, ads in CAMPAIGNS:
    w = [lognorm(R, 1.0, 0.6) for _ in ads]
    for day in days(a, b):
        ramp = 1.0
        if camp.endswith("12/2025") and day >= "2026-07-01":
            ramp = 1.4  # the budget step-up the "Budget context" note talks about
        live = [(ad, wt) for ad, wt in zip(ads, w) if ADS[ad][1] <= day]
        live_w = sum(wt for _, wt in live)
        for ad, wt in live:
            spend = r2(lognorm(R, budget * ramp * wt / live_w, 0.3))
            imps = int(spend / lognorm(R, 39 if "LIKES" not in camp else 9, 0.18) * 1000)
            reach = int(imps / R.uniform(1.05, 1.3))
            lclk = int(imps * lognorm(R, ctr, 0.25))
            clicks = int(lclk * R.uniform(1.6, 2.4) + imps * 0.004)
            leads = poisson(R, lclk * lrate)
            react = poisson(R, imps * (0.006 if "LIKES" not in camp else 0.02))
            rows.append({"d": day, "acct": ACCT, "camp": camp, "ad": ad, "cid": cid_of[ad], "spend": spend,
                         "imps": imps, "clicks": clicks, "lclk": lclk, "reach": reach, "leads": leads,
                         "thru": int(imps * R.uniform(0.02, 0.06)), "react": react,
                         "ulead": leads, "ulclk": int(lclk * 0.93), "freq": round(imps / max(1, reach), 3),
                         "created": ADS[ad][1], "title": ""})

# ---------------------------------------------------------------- exact reach: preset windows + months
def preset(code, mx, mn):
    if code == "all":
        return [mn, mx]
    if code == "ytd":
        y0 = mx[:4] + "-01-01"
        return [mn if y0 < mn else y0, mx]
    if code == "lastyear":
        y = int(mx[:4]) - 1
        f, t = "%d-01-01" % y, "%d-12-31" % y
        f = mn if f < mn else f
        t = mx if t > mx else t
        return preset("365", mx, mn) if f > t else [f, t]
    ff = shift(mx, -(int(code) - 1))
    return [mn if ff < mn else ff, mx]


ALL_MIN, ALL_MAX = min(META_START, MAIL_START), max(META_END, MAIL_END)
windows = []
for code in ("7", "14", "30", "90", "180", "365", "ytd", "lastyear", "all"):
    f, t = preset(code, ALL_MAX, ALL_MIN)
    f, t = max(f, META_START), min(t, META_END)
    if f > t:
        continue
    span = (date.fromisoformat(t) - date.fromisoformat(f)).days + 1
    fq = 1.15 + 0.48 * math.log(span)
    sel = [r for r in rows if f <= r["d"] <= t]
    acct_imps = sum(r["imps"] for r in sel)
    win = {"from": f, "to": t, "acct": {ACCT: [int(acct_imps / fq), acct_imps]}, "camp": {}, "ad": {}}
    by_c, by_a = {}, {}
    for r in sel:
        by_c[r["camp"]] = by_c.get(r["camp"], 0) + r["imps"]
        key = r["camp"] + SEP + r["ad"]
        by_a[key] = by_a.get(key, 0) + r["imps"]
    for c, im in by_c.items():
        win["camp"][ACCT + SEP + c] = [int(im / (fq * R.uniform(0.85, 1.0))), im]
    for k, im in by_a.items():
        win["ad"][ACCT + SEP + k] = [int(im / (fq * R.uniform(0.7, 1.05))), im]
    windows.append(win)
month_rows = []
for m in months(META_START, META_END):
    sel = [r for r in rows if r["d"][:7] == m]
    im = sum(r["imps"] for r in sel)
    if im:
        month_rows.append({"m": m, "acct": ACCT, "reach": int(im / R.uniform(2.1, 2.7)), "imps": im,
                           "spend": r2(sum(r["spend"] for r in sel))})

creatives = []
for name, (pos, _created) in ADS.items():
    if not pos:
        continue
    _, head, body = CREATIVES[pos - 1]
    creatives.append({"cid": cid_of[name], "ad": name, "head": head, "body": body, "thumb": img(pos),
                      "link": "", "cached": False})

# ---------------------------------------------------------------- email (ActiveCampaign) - neutral labels
EXP = ["First property investor", "Own 1-2 investment properties", "Own 3+ properties", "Already own a rooming house"]
TIME = ["Ready now", "Within 3 months", "3-12 months", "Just researching"]
contacts = []
for day in days("2024-02-01", MAIL_END):
    lam = 3.2 if day < "2025-12-01" else 6.0
    for _ in range(poisson(R, lam)):
        answered = R.random() < 0.46
        exp = wchoice(R, EXP, [38, 34, 19, 9]) if answered else ""
        tl = wchoice(R, TIME, [12, 26, 34, 28]) if answered and R.random() < 0.9 else ""
        opened = R.random() < (0.52 if exp in ("Own 3+ properties", "Already own a rooming house") else 0.43)
        clicked = opened and R.random() < 0.11
        contacts.append({"cdate": day, "experience": exp, "timeline": tl, "opened": opened, "clicked": clicked,
                         "converted": False, "sent": max(1, int(lognorm(R, 9, 0.6)))})
daily = []
for day in days(MAIL_START, MAIL_END):
    base = 120 if day < "2025-12-01" else 210
    s = int(lognorm(R, base, 0.35))
    o = int(s * R.uniform(0.18, 0.3)) if day >= "2026-05-02" else 0
    daily.append({"d": day, "sends": s, "opens": o, "mpp": int(s * R.uniform(0.08, 0.16)) if o else 0})
BCAST = [("February newsletter", "2026-02-12"), ("Land tax explainer", "2026-03-05"), ("Webinar invitation", "2026-03-26"),
         ("Case study: 4 to 9 bedrooms", "2026-04-16"), ("Council permits Q&A", "2026-05-07"), ("New listing alert", "2026-05-28"),
         ("Winter newsletter", "2026-06-18"), ("Investor brochure", "2026-07-09"), ("Market update: yields", "2026-07-30"),
         ("Spring newsletter", "2026-09-03"), ("Webinar replay", "2026-09-17")]
campaigns = []
for i, (nm, dt) in enumerate(BCAST):
    sent = int(lognorm(R, 3900, 0.15))
    opens = int(sent * R.uniform(0.24, 0.36))
    clicks = int(opens * R.uniform(0.02, 0.07))
    campaigns.append({"id": 500 + i, "name": nm, "date": dt, "sent": sent, "opens": opens, "clicks": clicks,
                      "clicks_total": int(clicks * R.uniform(1.2, 1.5)), "unsubs": int(sent * R.uniform(0.002, 0.009)),
                      "bounces": int(sent * R.uniform(0.003, 0.012))})
autos = [{"name": n, "active": a, "entered": e, "exited": x} for n, a, e, x in (
    ("Guide download - welcome sequence", True, 3912, 3640), ("Interstate investor nurture", True, 842, 611),
    ("Listing enquiry follow-up", True, 655, 640), ("Brochure request", True, 418, 418),
    ("Webinar reminders", True, 377, 377), ("Re-engagement (90 days quiet)", True, 1290, 1104),
    ("Old guide sequence (2024)", False, 2210, 2210), ("Consultation booking follow-up", True, 96, 81))]
lists = [{"name": n, "subscribers": s} for n, s in (
    ("Master list", 4310), ("Guide downloads", 3605), ("Interstate investors", 812), ("Listing enquiries", 640),
    ("Webinar registrants", 377), ("Newsletter only", 205))]
templates = []
for i, nm in enumerate(["Guide delivery - email 1", "Guide follow-up - email 2", "Case study - email 3", "Permits explained - email 4",
                        "Book a call - email 5", "Interstate - email 1", "Interstate - email 2", "Listing brochure delivery",
                        "Webinar reminder - 24h", "Webinar reminder - 1h", "Re-engagement - email 1", "Re-engagement - email 2",
                        "Land tax - email 1", "Yield calculator - email", "Welcome - short version"]):
    s = int(5200 * (0.62 ** i) * R.uniform(0.8, 1.2)) + R.randint(20, 90)
    first = shift(MAIL_START, R.randint(0, 120))
    templates.append({"name": nm, "sends": s, "first": first, "last": shift(MAIL_END, -R.randint(0, 20))})
templates.sort(key=lambda t: -t["sends"])
email = {"enabled": True, "partial": False, "watermark": {"events_oldest": "2026-05-02T00:00:00Z"},
         "totals": {"contacts": len(contacts), "engaged": sum(1 for c in contacts if c["opened"]),
                    "sends": sum(d["sends"] for d in daily), "campaigns_sent": len(campaigns),
                    "campaigns": len(campaigns) + 23, "converted": 0},
         "contacts": contacts, "daily": daily, "campaigns": campaigns, "automations": autos, "lists": lists,
         "templates": templates, "quiz": {"experience": EXP, "timeline": TIME}}

# ---------------------------------------------------------------- Meta breakdowns (weekly rows)
def week_totals():
    by = {}
    for r in rows:
        if r["d"] < "2025-09-29":
            continue
        d0 = date.fromisoformat(r["d"])
        wk = (d0 - timedelta(days=d0.weekday())).isoformat()
        b = by.setdefault(wk, {"spend": 0.0, "imps": 0, "clicks": 0, "lclk": 0, "reach": 0, "leads": 0})
        for k in b:
            b[k] += r[k]
    return by


WT = week_totals()


def split(dimvals, weights, lead_bias):
    out = []
    for wk, t in sorted(WT.items()):
        ws = [w * R.uniform(0.8, 1.2) for w in weights]
        tw = sum(ws)
        lb = [w * lb_ * R.uniform(0.85, 1.15) for w, lb_ in zip(ws, lead_bias)]
        tl = sum(lb)
        for dv, wv, lv in zip(dimvals, ws, lb):
            share = wv / tw
            out.append(dict(dv, d=wk, spend=r2(t["spend"] * share), imps=int(t["imps"] * share),
                            clicks=int(t["clicks"] * share), lclk=int(t["lclk"] * share),
                            reach=int(t["reach"] * share), leads=int(round(t["leads"] * lv / tl))))
    return out


ages = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
ag_dims, ag_w, ag_l = [], [], []
for a, wa, la in zip(ages, [2, 9, 19, 26, 25, 19], [0.6, 0.9, 1.15, 1.2, 1.0, 0.75]):
    for g, wg, lg in (("female", 0.42, 0.95), ("male", 0.56, 1.05), ("unknown", 0.02, 0.6)):
        ag_dims.append({"age": a, "gender": g}); ag_w.append(wa * wg); ag_l.append(la * lg)
plat = ["facebook", "instagram", "audience_network", "messenger"]
pos = ["feed", "facebook_reels", "instagram_reels", "instagram_stories", "marketplace", "video_feeds", "an_classic", "search"]
dev = ["android_smartphone", "iphone", "desktop", "ipad", "android_tablet"]
regions = ["Victoria", "New South Wales", "Queensland", "Western Australia", "South Australia", "Tasmania",
           "Australian Capital Territory", "Northern Territory"]
reg_rows = []
for m in months("2025-10-01", META_END):
    sel = [r for r in rows if r["d"][:7] == m]
    sp, im, lc = sum(r["spend"] for r in sel), sum(r["imps"] for r in sel), sum(r["lclk"] for r in sel)
    for rg, w in zip(regions, [70, 9, 7, 5, 4, 2.5, 1.5, 1]):
        s = w / 100 * R.uniform(0.85, 1.15)
        reg_rows.append({"d": m, "region": rg, "spend": r2(sp * s), "imps": int(im * s), "clicks": int(lc * s * 1.8),
                         "lclk": int(lc * s), "reach": int(im * s / 2.4), "leads": 0})
breakdowns = {
    "enabled": True,
    "age_gender": {"rows": split(ag_dims, ag_w, ag_l)},
    "platform": {"rows": split([{"publisher_platform": p} for p in plat], [64, 31, 4, 1], [1.05, 0.95, 0.45, 0.5])},
    "position": {"rows": split([{"platform_position": p} for p in pos], [38, 17, 16, 11, 7, 6, 3, 2], [1.1, 0.95, 1.0, 0.8, 0.9, 0.7, 0.4, 0.6])},
    "device": {"rows": split([{"impression_device": d_} for d_ in dev], [48, 41, 6, 3, 2], [1.0, 1.05, 0.8, 0.9, 0.7])},
    "region": {"rows": reg_rows},
}

data = {
    "client": "Rooming House Expert",
    "tagline": "Turning underperforming property into cash-flow.",
    "currency": "AUD",
    "generated_at": GENERATED_AT,
    "data_through": META_END,
    "brand": {"mark": "assets/logo.png"},
    "source": {"meta_through": META_END, "email_through": MAIL_END},
    "meta": {"range": [META_START, META_END], "rows": rows},
    "reach": {"sep": SEP, "windows": windows, "months": month_rows},
    "creatives": {"enabled": True, "items": creatives},
    "email": email,
    "breakdowns": breakdowns,
}
write_json(data, arg("--out", "data.json"))
last30 = [r for r in rows if r["d"] >= shift(META_END, -29)]
sp = sum(r["spend"] for r in last30)
ld = sum(r["leads"] for r in last30)
print("rooming-house-expert: %d meta rows, last 30d spend %.0f, leads %d, CPL %.2f; %d contacts" % (len(rows), sp, ld, sp / max(1, ld), len(contacts)))
