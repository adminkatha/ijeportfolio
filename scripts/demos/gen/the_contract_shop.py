"""Sample data.json for The Contract Shop dashboard demo (quiz-lead diagnostics + Meta lead gen).

Usage: python the_contract_shop.py --out data.json [--manifest manifest.json]
Every figure is synthetic and seeded. Leads are placeholders ("Lead #1042") with a masked handle
("lead1042@•••", deliberately not an email address); no real person appears. Email subject lines,
campaign and ad names are the client's public marketing copy (no names, IDs or addresses).
"""
import json
from datetime import date, timedelta
from common import rng, days, months, shift, wchoice, lognorm, poisson, r2, write_json, arg, GENERATED_AT

R = rng(20261009)
QUIZ_START, QUIZ_END = "2024-10-01", "2026-10-04"
PAID_START, PAID_END = "2025-08-04", "2026-09-28"
man = json.load(open(arg("--manifest"), encoding="utf-8")) if arg("--manifest") else {}
imgs = ["assets/" + c["file"] for c in man.get("creatives", [])]
IMG_TABLET = imgs[0] if imgs else ""
IMG_BANNER = imgs[1] if len(imgs) > 1 else ""

SUBJECTS = [
    "Your quiz results are in!", "Don't Say We Didn't Warn You ...", "FINAL CALL", "Our Top 3 Best-Selling Contracts",
    "Forget the Noise — Focus on What You Really Need", "Why Thousands Trust Our Templates", "Last Day to Save $$$",
    "Why Contracts?", "It's Time to Get Legal, {{ first_name|default:'friend' }}",
    "Are You Signing Contracts the Right Way?", "\"Obsessed, Per the Usual\"", "Protect your business before you sign",
]

# ---------------------------------------------------------------- quiz leads
leads, lead_emails = [], {}
n = 1000
for day in days(QUIZ_START, QUIZ_END):
    yr = day[:4]
    lam = {"2024": 1.05, "2025": 1.95, "2026": 0.82}[yr] * (1.3 if day[5:7] in ("01", "09") else 1.0)
    for _ in range(poisson(R, lam)):
        n += 1
        age = (date.fromisoformat(QUIZ_END) - date.fromisoformat(day)).days
        p_conv = {"2024": 0.058, "2025": 0.034, "2026": 0.012}[yr] * min(1.0, age / 120 + 0.2)
        conv = R.random() < p_conv
        sends = max(1, min(30, int(age / 14) + R.randint(0, 3)))
        clicks = sum(1 for _ in range(sends) if R.random() < (0.012 if yr == "2026" else 0.03))
        dtc = int(lognorm(R, 33, 0.7)) if conv else None
        handle = "lead%d@•••" % n
        leads.append({"first_name": "Lead #%d" % n, "email": handle,
                      "submitted_at": day + "T%02d:%02d:00" % (R.randint(7, 22), R.randint(0, 59)),
                      "is_converted": conv, "revenue_post_quiz": r2(lognorm(R, 380, 0.6)) if conv else 0,
                      "emails_sent": sends, "clicks": clicks, "click_rate": clicks / sends,
                      "days_to_convert": dtc})
        log, d0 = [], date.fromisoformat(day)
        for i in range(min(sends, 14)):
            sd = (d0 + timedelta(days=i * R.randint(4, 12))).isoformat()
            if sd > QUIZ_END:
                break
            subj = SUBJECTS[0] if i == 0 else wchoice(R, SUBJECTS[1:], [9, 8, 8, 7, 7, 6, 6, 5, 4, 3, 3])
            opened = R.random() < (0.56 if i == 0 else 0.4)
            clicked = opened and R.random() < 0.05
            log.append([sd, subj, opened, clicked])
        lead_emails[handle] = log
total_leads = len(leads)
leads_shown = sorted(leads, key=lambda x: x["submitted_at"], reverse=True)[:600]  # the export caps the list
lead_emails = {l["email"]: lead_emails[l["email"]] for l in leads_shown}

# ---------------------------------------------------------------- activity (monthly + weekly) and cohorts
def bucket(key_fn):
    by = {}
    for l in leads:
        k = key_fn(l["submitted_at"][:10])
        b = by.setdefault(k, {"leads": 0, "sales": 0, "clicks": 0, "sends": 0})
        b["leads"] += 1
        b["sales"] += 1 if l["is_converted"] else 0
        b["clicks"] += l["clicks"]
        b["sends"] += l["emails_sent"]
    return by


mon = bucket(lambda d: d[:7])
activity_monthly = [{"month": k, **v, "click_rate": (v["clicks"] / v["sends"]) if v["sends"] else None} for k, v in sorted(mon.items())]
wk = bucket(lambda d: (date.fromisoformat(d) - timedelta(days=date.fromisoformat(d).weekday())).isoformat())
activity_weekly = [{"week": k, **v, "click_rate": (v["clicks"] / v["sends"]) if v["sends"] else None} for k, v in sorted(wk.items())]
cohorts = []
for yr in ("2024", "2025", "2026"):
    cl = [l for l in leads if l["submitted_at"].startswith(yr)]
    cv = [l for l in cl if l["is_converted"]]
    cohorts.append({"cohort": yr, "leads": len(cl), "converted": len(cv), "conversion_rate": len(cv) / len(cl),
                    "pct_leads_opened": R.uniform(0.5, 0.7), "first_email_open_rate": R.uniform(0.45, 0.58),
                    "first5_open_rate": R.uniform(0.36, 0.53), "revenue": r2(sum(l["revenue_post_quiz"] for l in cv))})
this_year = [l for l in leads if l["submitted_at"] >= "2026"]
prior = [l for l in leads if l["submitted_at"] < "2026"]
conv_all = [l for l in leads if l["is_converted"]]
rate = lambda ls: sum(l["clicks"] for l in ls) / max(1, sum(l["emails_sent"] for l in ls))
kpis = {"leads": total_leads, "converted": len(conv_all), "conversion_rate": len(conv_all) / total_leads,
        "revenue": r2(sum(l["revenue_post_quiz"] for l in conv_all)),
        "avg_days_to_convert": sum(l["days_to_convert"] for l in conv_all) / max(1, len(conv_all)),
        "avg_clicks": sum(l["clicks"] for l in leads) / total_leads,
        "click_rate_this_year": rate(this_year), "click_rate_prior": rate(prior),
        "leads_this_year": len(this_year), "converted_this_year": sum(1 for l in this_year if l["is_converted"])}

# ---------------------------------------------------------------- paid media (Meta)
CAMPS = [  # name, objective, start, end, budget/day, ctr, cpc-ish lead rate (leads per link click)
    ("2025.5 Free Quiz x Checklist", "OUTCOME_LEADS", PAID_START, PAID_END, 16.5, 0.027, 0.045),
    ("2025.6 Free Quiz x Checklist - Testing Campaign", "OUTCOME_LEADS", "2025-10-06", "2026-02-27", 9.0, 0.024, 0.04),
    ("2023.9 Starting a Business Checklist (Website Leads Goal)", "OUTCOME_LEADS", "2025-08-04", "2026-01-30", 6.2, 0.026, 0.01),
]
ADS = [  # ad name, campaign index, budget share, status, creative title, thumbnail
    ("Ad #7 - Starting a Business Checklist", 0, 0.82, "ACTIVE", "Get your free checklist now", IMG_BANNER),
    ("Ad #7 - Email Lead Goal - Business Checklist Animated", 0, 0.18, "ACTIVE", "Protect yourself with a lawyer's checklist", IMG_TABLET),
    ("Ad #7 - Starting a Business Checklist", 1, 0.85, "CAMPAIGN_PAUSED", "Get your free checklist now", ""),
    ("Ad #7 - Email Lead Goal - Business Checklist Animated", 1, 0.15, "CAMPAIGN_PAUSED", "Protect yourself with a lawyer's checklist", IMG_TABLET),
    ("Ad #7 - Starting a Business Checklist", 2, 0.5, "CAMPAIGN_PAUSED", "Get your free checklist now", ""),
    ("Ad #8 - Email Lead Goal - Business Checklist Animated", 2, 0.3, "CAMPAIGN_PAUSED", "Did the work, didn't get paid?", IMG_TABLET),
    ("Ad #7 - Email Lead Goal - Business Checklist Animated", 2, 0.2, "CAMPAIGN_PAUSED", "Protect yourself with a lawyer's checklist", IMG_BANNER),
]
daily_by = {}
ad_tot = [{"spend": 0.0, "imps": 0, "reach": 0, "lclk": 0, "lpv": 0, "leads": 0} for _ in ADS]
for ai, (an, ci, share, st, title, th) in enumerate(ADS):
    cname, obj, a, b, budget, ctr, lr = CAMPS[ci]
    for day in days(a, b):
        sp = r2(lognorm(R, budget * share, 0.3))
        im = int(sp / lognorm(R, 23, 0.2) * 1000)
        rc = int(im / R.uniform(1.04, 1.25))
        lc = int(im * lognorm(R, ctr, 0.2))
        lpv = int(lc * (R.uniform(0.75, 0.92) if ci != 2 else R.uniform(0.1, 0.3)))
        ld = poisson(R, lpv * lr * (1.35 if ci != 2 else 3.0))
        t = ad_tot[ai]
        t["spend"] += sp; t["imps"] += im; t["reach"] += rc; t["lclk"] += lc; t["lpv"] += lpv; t["leads"] += ld
        d = daily_by.setdefault(day, {"day": day, "spend": 0.0, "leads": 0, "impressions": 0, "link_clicks": 0, "purchases": 0, "revenue": 0.0})
        d["spend"] += sp; d["leads"] += ld; d["impressions"] += im; d["link_clicks"] += lc
        if R.random() < 0.004:
            d["purchases"] += 1; d["revenue"] += r2(lognorm(R, 120, 0.4))
daily = [dict(v, spend=r2(v["spend"]), revenue=r2(v["revenue"])) for k, v in sorted(daily_by.items())]

stages, ads_out = [], []
for (an, ci, share, st, title, th), t in zip(ADS, ad_tot):
    sig = t["lclk"] >= 60
    ctr_ = t["lclk"] / t["imps"] if t["imps"] else None
    stages.append({"ad_name": an, "campaign_name": CAMPS[ci][0], "is_significant": sig, "spend": r2(t["spend"]),
                   "reach_daily_sum": t["reach"], "impr_per_reach": t["imps"] / max(1, t["reach"]), "ctr": ctr_,
                   "lp_rate": t["lpv"] / t["lclk"] if t["lclk"] else None,
                   "lead_rate": t["leads"] / t["lpv"] if t["lpv"] else None,
                   "leads_per_reach": t["leads"] / t["reach"] if t["reach"] else None,
                   "cpl": t["spend"] / t["leads"] if t["leads"] else None})
    ads_out.append({"ad_name": an, "is_significant": sig, "thumbnail_data": th, "status": st, "creative_title": title,
                    "spend": r2(t["spend"]), "leads": t["leads"], "cpl": t["spend"] / t["leads"] if t["leads"] else None,
                    "ctr": ctr_})
stages.sort(key=lambda s: -s["spend"])
ads_out.sort(key=lambda s: -s["spend"])

campaigns = []
for ci, (cname, obj, *_r) in enumerate(CAMPS):
    idx = [i for i, a in enumerate(ADS) if a[1] == ci]
    sp = sum(ad_tot[i]["spend"] for i in idx); im = sum(ad_tot[i]["imps"] for i in idx)
    lc = sum(ad_tot[i]["lclk"] for i in idx); ld = sum(ad_tot[i]["leads"] for i in idx)
    campaigns.append({"campaign_name": cname, "objective": obj, "ads": len(idx) + (1 if ci else 1), "spend": r2(sp),
                      "impressions": im, "link_clicks": lc, "ctr": lc / im if im else None,
                      "cpc": sp / lc if lc else None, "leads": ld, "cpl": sp / ld if ld else None})
campaigns.sort(key=lambda c: -c["spend"])

funnel = []
for m in months(PAID_START, PAID_END):
    dd = [d for d in daily if d["day"][:7] == m]
    sp = sum(d["spend"] for d in dd)
    mrl = sum(d["leads"] for d in dd)
    ql = sum(1 for l in leads if l["submitted_at"][:7] == m)
    cu = sum(1 for l in leads if l["submitted_at"][:7] == m and l["is_converted"])
    rv = sum(l["revenue_post_quiz"] for l in leads if l["submitted_at"][:7] == m and l["is_converted"])
    complete = len(dd) >= 25
    funnel.append({"month": m + "-01", "is_complete_month": complete, "spend_days": len(dd), "spend": r2(sp),
                   "meta_reported_leads": mrl, "quiz_leads": ql,
                   "blended_cost_per_quiz_lead": sp / ql if ql else None, "customers": cu,
                   "blended_cost_per_sale": sp / cu if cu else None, "quiz_revenue": r2(rv),
                   "blended_return_on_spend": rv / sp if sp else None})

def window(a, b):
    dd = [d for d in daily if a <= d["day"] <= b]
    sp, ld = sum(d["spend"] for d in dd), sum(d["leads"] for d in dd)
    return sp, ld, (sp / ld if ld else None)


s30, l30, c30 = window(shift(PAID_END, -29), PAID_END)
sp30, lp30, cp30 = window(shift(PAID_END, -59), shift(PAID_END, -30))
tsp = sum(d["spend"] for d in daily); tld = sum(d["leads"] for d in daily)
tim = sum(d["impressions"] for d in daily); tlc = sum(d["link_clicks"] for d in daily)
trv = sum(d["revenue"] for d in daily)
paid = {"kpis": {"spend": r2(tsp), "active_days": len(daily), "leads": tld, "ads": len(ADS) + 4, "campaigns": len(CAMPS),
                 "cpl": tsp / tld, "spend_30d": r2(s30), "spend_prev30": r2(sp30), "leads_30d": l30, "leads_prev30": lp30,
                 "cpl_30d": c30, "cpl_prev30": cp30, "ctr": tlc / tim, "cpc": tsp / tlc, "revenue": r2(trv),
                 "roas": trv / tsp, "first_day": daily[0]["day"], "last_day": daily[-1]["day"]},
        "daily": daily, "ads": ads_out, "campaigns": campaigns, "funnel": funnel, "stages": stages}

data = {
    "client": "The Contract Shop",
    "last_updated": GENERATED_AT,
    "data_through": QUIZ_END,
    "kpis": kpis,
    "activity_monthly": activity_monthly,
    "activity_weekly": activity_weekly,
    "cohorts": cohorts,
    "leads": leads_shown,
    "lead_emails": lead_emails,
    "campaigns": [],
    "paid": paid,
}
write_json(data, arg("--out", "data.json"))
print("the-contract-shop: %d leads (%d listed), %d converted; paid spend %.0f, leads %d, CPL %.2f" %
      (total_leads, len(leads_shown), len(conv_all), tsp, tld, tsp / tld))
