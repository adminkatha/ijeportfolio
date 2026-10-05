"""Shared helpers for the sample-data generators (deterministic, seeded, offline).

Every generator writes a synthetic `data.json` in the shape the dashboard renderer expects.
No value is copied from a real report: magnitudes are only "the same order" so the demo
looks plausible. Person names never appear; leads/agents get neutral placeholders.
"""
import json
import math
import random
import sys
from datetime import date, datetime, timedelta

MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONFULL = ["January", "February", "March", "April", "May", "June", "July", "August",
           "September", "October", "November", "December"]


def rng(seed):
    return random.Random(seed)


def d(iso):
    return date.fromisoformat(iso[:10])


def iso(dt):
    return dt.isoformat()[:10]


def days(start, end):
    """Inclusive list of ISO dates."""
    a, b = d(start), d(end)
    out = []
    while a <= b:
        out.append(iso(a))
        a += timedelta(days=1)
    return out


def months(start, end):
    """Inclusive list of 'YYYY-MM' keys."""
    a, b = d(start).replace(day=1), d(end).replace(day=1)
    out = []
    while a <= b:
        out.append(a.isoformat()[:7])
        a = (a.replace(day=28) + timedelta(days=4)).replace(day=1)
    return out


def shift(iso_s, n):
    return iso(d(iso_s) + timedelta(days=n))


def wchoice(r, items, weights):
    return r.choices(items, weights=weights, k=1)[0]


def lognorm(r, median, sigma):
    return median * math.exp(r.gauss(0, sigma))


def jitter(r, v, pct):
    return v * (1 + r.uniform(-pct, pct))


def season_factor(month, peaks):
    """Smooth multiplicative seasonality; `peaks` maps month -> factor."""
    return peaks.get(month, 1.0)


def poisson(r, lam):
    if lam <= 0:
        return 0
    if lam > 60:
        return max(0, int(round(r.gauss(lam, math.sqrt(lam)))))
    L, k, p = math.exp(-lam), 0, 1.0
    while True:
        k += 1
        p *= r.random()
        if p <= L:
            return k - 1


def r2(v):
    return round(v + 0.0, 2)


def write_json(obj, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def arg(name, default=None):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return default


GENERATED_AT = "2026-10-05T09:00:00Z"
