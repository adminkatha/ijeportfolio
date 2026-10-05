"""Sample data.json for the Riverdance RV Resort dashboard demo (Meta paid social + ActiveCampaign email).

Usage: python riverdance_rv.py --out data.json [--manifest manifest.json]
Every figure is synthetic and seeded. Ad names and ad copy are the resort's public creatives;
campaign names carry no IDs or names. The email tab uses neutral, resort-only campaign, list and
automation names (the live account also served other businesses; none of those are shown), and no
account handle. Images come from the manifest written by assets.py.
"""
import json
from common import rng, days, shift, lognorm, poisson, r2, write_json, arg, GENERATED_AT

R = rng(20261007)
START, END = "2026-05-13", "2026-10-04"
man = json.load(open(arg("--manifest"), encoding="utf-8")) if arg("--manifest") else {}
img_by_alt = {c["alt"]: "assets/" + c["file"] for c in man.get("creatives", [])}

CONV = "2026_05_May Mountain Recharge_Conversions V1"
LEADS = "Riverdance | Extended Stay | Leads"
ADS = [  # ad name, type tag, public headline, campaign, start, end, daily budget, ctr, booking rate
    ("Mountain Recharge", "Image", "Wake Up on the Eagle River, starting at $80/Night.", CONV, START, END, 22, 0.034, 0.0075),
    ("Mountain Recharge - Copy", "Image", "RV Sites Near Vail Valley", CONV, "2026-06-02", END, 13, 0.031, 0.0068),
    ("Carousel_Modern Rver", "Ad", "", CONV, "2026-06-10", "2026-08-15", 4.5, 0.016, 0.004),
    ("Extended Stay | 3+ Months Stay", "Ad", "Settle In for the Winter Season", LEADS, "2026-09-15", END, 5.5, 0.036, 0.0),
    ("Extended Stay | 1-2 Months Stay", "Ad", "Stay for a Month. Explore More.", LEADS, "2026-09-15", END, 2.8, 0.033, 0.0),
]
NIGHTLY = [80, 80, 85, 95, 95, 105]

rows = []
for ad, typ, title, camp, a, b, budget, ctr, brate in ADS:
    for day in days(a, b):
        m = int(day[5:7])
        seas = {5: 0.8, 6: 1.0, 7: 1.25, 8: 1.15, 9: 1.0, 10: 0.9}.get(m, 1.0)
        spend = r2(lognorm(R, budget * seas, 0.35))
        cpm = lognorm(R, 11.5, 0.22)
        imps = int(spend / cpm * 1000)
        reach = int(imps / R.uniform(1.5, 2.1))
        clicks = int(imps * lognorm(R, ctr, 0.25))
        lclk = int(clicks * R.uniform(0.32, 0.42))
        book_init = poisson(R, lclk * brate * 2.2)
        pur = sum(1 for _ in range(book_init) if R.random() < 0.47)  # initiated -> completed
        rev = 0.0
        for _ in range(pur):
            nights = R.choice([1, 1, 2, 2, 2, 3, 3, 4, 5, 7, 14])
            rev += R.choice(NIGHTLY) * nights * R.uniform(1.0, 1.12)
        rows.append({"date": day, "camp": camp, "ad": ad, "spend": spend, "imps": imps, "reach": reach,
                     "clicks": clicks, "lclk": lclk, "pur": pur, "rev": r2(rev), "book_init": book_init})

dates = sorted({r["date"] for r in rows})
creatives = [{"ad": ad, "type": typ, "label": ad, "title": title, "body": "",
              "img": img_by_alt.get(ad)} for ad, typ, title, *_ in ADS]

# ---------------------------------------------------------------- audience (Meta breakdowns)
age_gender = []
for age, w in (("18-24", 0.6), ("25-34", 7), ("35-44", 17), ("45-54", 21), ("55-64", 26), ("65+", 28)):
    for g, gw in (("female", 0.52), ("male", 0.46), ("unknown", 0.02)):
        imps = int(470000 * w / 100 * gw * R.uniform(0.85, 1.15))
        age_gender.append({"age": age, "gender": g, "imps": imps, "clicks": int(imps * R.uniform(0.025, 0.04)),
                           "spend": r2(imps / 1000 * R.uniform(10, 13))})
region = []
for day in dates[::7]:
    for rg, w in (("Colorado", 0.92), ("Utah", 0.055), ("Wyoming", 0.012), ("Unknown", 0.0001)):
        imps = int(470000 / len(dates[::7]) * w * R.uniform(0.8, 1.2))
        region.append({"date": day, "region": rg, "imps": imps, "clicks": int(imps * 0.03),
                       "spend": r2(imps / 1000 * 11.8)})

# ---------------------------------------------------------------- email (ActiveCampaign)
EMAILS = [
    ("Monthly update - November", "2025-11-21"), ("Holiday greetings", "2025-12-19"),
    ("Winter rates are live", "2026-01-08"), ("Annual letter", "2026-01-15"),
    ("Spring opening - save the date", "2026-02-20"), ("Riverdance - coming soon", "2026-03-05"),
    ("Riverdance coming soon - tenants", "2026-03-06"), ("Open house reminder", "2026-03-19"),
    ("Email 1 - Extended stays", "2026-04-02"), ("Email 2 - Extended stays", "2026-04-09"),
    ("Email 3 - Extended stays", "2026-04-16"), ("Email 4 - Extended stays", "2026-04-23"),
    ("Monthly update - May", "2026-05-01"), ("Email 5 - Extended stays", "2026-05-07"),
    ("Memorial Day weekend", "2026-05-19"), ("Summer events on the river", "2026-05-28"),
    ("Monthly update - June", "2026-06-02"), ("Fourth of July weekend", "2026-06-25"),
    ("Monthly update - July", "2026-07-02"), ("Riverdance RV show - no promo", "2026-07-09"),
    ("Riverdance RV show - owners list promo", "2026-07-10"), ("Partnership", "2026-07-16"),
    ("Late summer availability", "2026-07-30"), ("Monthly update - August", "2026-08-04"),
    ("Labor Day weekend", "2026-08-27"), ("Extended stay - fall rates", "2026-09-03"),
    ("Monthly update - September", "2026-09-08"), ("Winter extended stays - early list", "2026-09-17"),
    ("Fall colours weekend", "2026-09-24"), ("Last call for fall sites", "2026-09-30"),
]
camps = []
for i, (name, day) in enumerate(EMAILS):
    tenants = "tenants" in name.lower()
    owners = "owners" in name.lower()
    sent = R.randint(90, 160) if tenants else (R.randint(6, 14) if owners else int(lognorm(R, 1350, 0.55)))
    opens = int(sent * R.uniform(0.33, 0.47) if sent > 40 else sent * R.uniform(0.55, 0.8))
    clicks = int(opens * (R.uniform(0.01, 0.08) if R.random() > 0.2 else R.uniform(0.15, 0.6)))
    camps.append({"id": 9000 + i, "name": name, "date": day, "sent": sent, "opens": opens, "clicks": clicks,
                  "unsubs": int(sent * R.uniform(0.0, 0.012)), "bounces": int(sent * R.uniform(0.0, 0.01)),
                  "forwards": 0, "replies": 0, "socialshares": 0,
                  "opens_total": int(opens * R.uniform(1.3, 1.8)), "clicks_total": int(clicks * R.uniform(1.0, 1.4))})
lists = [{"name": n, "subscribers": s, "total": s + R.randint(0, 40)} for n, s in (
    ("Riverdance", 2870), ("Riverdance - Extended Stay Leads", 1046), ("Riverdance - Newsletter", 812),
    ("Riverdance - Tenants", 143), ("Riverdance - RV Show Leads", 96), ("Riverdance - Owners", 12))]
autos = [{"name": n, "active": act, "entered": e, "exited": x} for n, act, e, x in (
    ("New Riverdance long-term form notification", True, 198, 198),
    ("Riverdance extended stay leads", True, 92, 88),
    ("Riverdance welcome series", True, 141, 112),
    ("Long-term stay interest form (old)", False, 87, 86),
    ("Riverdance - vehicle registration", True, 31, 31),
    ("RV extended stay - under 3 months", True, 14, 9),
    ("RV extended stay - all year", True, 6, 2),
    ("General inquiry", True, 4, 4))]
ac = {"enabled": True, "crm_enabled": False, "fetched": "2026-10-04",
      "totals": {"contacts": 8814, "campaigns_sent": len(camps), "lists": 14, "automations": 21},
      "campaigns": camps, "lists": lists, "automations": autos}

data = {
    "client": "Riverdance RV Resort",
    "location": "Gypsum, CO",
    "logo": "assets/logo.png",
    "generated_at": GENERATED_AT,
    "last_updated": GENERATED_AT,
    "source": {"platform": "Meta (Facebook)", "account": "the resort's ad account", "connector": "Windsor.ai"},
    "dates": dates,
    "rows": rows,
    "creatives": creatives,
    "demographics": {"age_gender": age_gender, "region": region},
    "activecampaign": ac,
}
write_json(data, arg("--out", "data.json"))
sp = sum(r["spend"] for r in rows)
rv = sum(r["rev"] for r in rows)
print("riverdance-rv: %d rows, spend %.0f, revenue %.0f, bookings %d, %d emails" %
      (len(rows), sp, rv, sum(r["pur"] for r in rows), len(camps)))
