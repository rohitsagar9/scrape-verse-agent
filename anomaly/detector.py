"""
anomaly/detector.py
────────────────────────────────────────────────────────────────
ScrapeForge — Anomaly Detector
Runs after every extraction and writes data/anomalies.json.
7 detectors, severity-coded, recommendation included.

Usage (called from CI or manually):
    python anomaly/detector.py --data data/2026-08-20.json \
                               --baseline fingerprint/baseline.json \
                               --out data/anomalies.json

Detectors:
  1. NullFieldDetector        — null spike vs baseline rate
  2. DuplicateDetector        — exact-duplicate rows
  3. TypeDriftDetector        — mixed types in a numeric field
  4. OutlierDetector          — z-score > 3σ in numeric fields
  5. DistributionShiftDetector— PSI > 0.25 vs baseline distribution
  6. SchemaBreakDetector      — missing/new fields
  7. VolumeAnomalyDetector    — row count vs baseline ±30%
"""

import argparse
import json
import os
import math
import statistics
import hashlib
from datetime import datetime, timezone
from collections import Counter


# ── helpers ─────────────────────────────────────────────────────────

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def dump_json(obj, path):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)

def z_score(value, mean, std):
    return abs(value - mean) / std if std > 0 else 0.0

def psi_bin(observed, expected, bins=10, eps=1e-6):
    """Compute Population Stability Index for a numeric column."""
    if not observed or not expected:
        return 0.0
    all_vals = sorted(set(observed + expected))
    edges = [all_vals[int(i * len(all_vals) / bins)] for i in range(bins + 1)]
    edges[-1] += 1  # include max

    def bin_counts(vals, edges):
        counts = [0] * (len(edges) - 1)
        for v in vals:
            for j, e in enumerate(edges[1:]):
                if v < e:
                    counts[j] += 1
                    break
        total = max(sum(counts), 1)
        return [c / total for c in counts]

    obs_p = bin_counts(observed, edges)
    exp_p = bin_counts(expected, edges)
    psi = sum(
        (o - e) * math.log((o + eps) / (e + eps))
        for o, e in zip(obs_p, exp_p)
    )
    return round(psi, 4)


def quality_score(findings):
    """0-100 score: 100 = perfect, penalises by severity."""
    penalty = {"critical": 25, "high": 10, "medium": 5, "low": 2}
    total = sum(penalty.get(f["severity"], 0) for f in findings)
    return max(0, 100 - total)


def verdict(score):
    if score >= 90: return "clean"
    if score >= 70: return "minor_issues"
    if score >= 50: return "moderate_issues"
    return "critical_issues"


# ── detectors ───────────────────────────────────────────────────────

SCHEMA_FIELDS = ["title", "url", "score", "author", "comments_count", "rank"]
NUMERIC_FIELDS = ["score", "comments_count", "rank"]
BASELINE_NULL_RATE = 0.0   # HN is well-structured; we expect 0 nulls
BASELINE_ROW_COUNT = 30


def null_detector(rows):
    findings = []
    total = len(rows)
    for field in SCHEMA_FIELDS:
        nulls = [i for i, r in enumerate(rows) if r.get(field) is None]
        rate = len(nulls) / total if total else 0
        if rate > BASELINE_NULL_RATE and len(nulls) > 0:
            severity = "critical" if rate > 0.2 else "high" if rate > 0.1 else "medium"
            findings.append({
                "severity": severity,
                "detector": "NullFieldDetector",
                "field": field,
                "title": f"Null spike in field '{field}'",
                "description": f"{len(nulls)}/{total} rows ({rate*100:.1f}%) have null '{field}'. Baseline null rate: {BASELINE_NULL_RATE*100:.1f}%.",
                "recommendation": f"Investigate the source selector for '{field}'; it may have broken or the field is optional on some pages.",
                "rows": nulls,
                "count": len(nulls),
            })
    return findings


def duplicate_detector(rows):
    seen = {}
    dupes = []
    for i, r in enumerate(rows):
        key = hashlib.md5(json.dumps(r, sort_keys=True).encode()).hexdigest()
        if key in seen:
            dupes.append((seen[key], i))
        else:
            seen[key] = i
    if not dupes:
        return []
    affected = sorted(set(idx for pair in dupes for idx in pair))
    return [{
        "severity": "high",
        "detector": "DuplicateDetector",
        "field": None,
        "title": f"{len(dupes)} duplicate row(s) found",
        "description": f"{len(dupes)} group(s) of exact-duplicate rows. First duplicate at rows {list(dupes[0])}.",
        "recommendation": "Add a deduplication step keyed on hn_id, or check for a pagination/offset bug in the scraper.",
        "rows": affected,
        "count": len(dupes),
    }]


def type_drift_detector(rows):
    findings = []
    for field in NUMERIC_FIELDS:
        nums, strs, bad_rows = 0, 0, []
        for i, r in enumerate(rows):
            v = r.get(field)
            if v is None:
                continue
            if isinstance(v, (int, float)):
                nums += 1
            else:
                try:
                    float(v)
                    nums += 1
                except (ValueError, TypeError):
                    strs += 1
                    bad_rows.append(i)
        if strs > 0 and nums > 0:
            findings.append({
                "severity": "high",
                "detector": "TypeDriftDetector",
                "field": field,
                "title": f"Type drift in field '{field}'",
                "description": f"Field '{field}' contains both numbers ({nums}) and strings ({strs}). Rows {bad_rows} have non-numeric values where numbers were expected.",
                "recommendation": f"Coerce '{field}' to numeric, treating non-numeric values as null, or add an extraction rule to handle the new site format.",
                "rows": bad_rows,
                "count": strs,
            })
    return findings


def outlier_detector(rows):
    findings = []
    for field in NUMERIC_FIELDS:
        vals = [(i, float(r[field])) for i, r in enumerate(rows) if r.get(field) is not None and isinstance(r[field], (int, float))]
        if len(vals) < 4:
            continue
        nums = [v for _, v in vals]
        mean = statistics.mean(nums)
        std  = statistics.stdev(nums)
        outliers = [(i, v) for i, v in vals if z_score(v, mean, std) > 3.0]
        if outliers:
            worst_i, worst_v = max(outliers, key=lambda x: z_score(x[1], mean, std))
            findings.append({
                "severity": "medium",
                "detector": "OutlierDetector",
                "field": field,
                "title": f"{len(outliers)} outlier(s) in field '{field}'",
                "description": f"Field '{field}' has {len(outliers)} value(s) beyond 3.0σ (mean={mean:.2f}, std={std:.2f}). Most extreme: value={worst_v} (z={z_score(worst_v, mean, std):.2f}).",
                "recommendation": f"Check whether outlier values are real (genuine extremes) or scraping artifacts (e.g. a placeholder like 999999).",
                "rows": [i for i, _ in outliers],
                "count": len(outliers),
            })
    return findings


def distribution_shift_detector(rows, baseline_rows):
    findings = []
    if not baseline_rows:
        return findings
    for field in NUMERIC_FIELDS:
        obs  = [float(r[field]) for r in rows      if r.get(field) is not None and isinstance(r.get(field), (int, float))]
        base = [float(r[field]) for r in baseline_rows if r.get(field) is not None and isinstance(r.get(field), (int, float))]
        if len(obs) < 4 or len(base) < 4:
            continue
        psi = psi_bin(obs, base)
        if psi > 0.25:
            severity = "critical" if psi > 0.5 else "high" if psi > 0.35 else "medium"
            findings.append({
                "severity": severity,
                "detector": "DistributionShiftDetector",
                "field": field,
                "title": f"Distribution shift in '{field}' (PSI={psi})",
                "description": f"Population Stability Index for '{field}' is {psi} (threshold 0.25). The value distribution has shifted relative to the baseline.",
                "recommendation": "A distribution shift often means the source site changed its content mix or ranking. Re-baseline or investigate the source.",
                "rows": list(range(len(rows))),
                "count": len(obs),
            })
    return findings


def schema_break_detector(rows):
    findings = []
    expected = set(SCHEMA_FIELDS)
    missing_in_any, new_in_any = set(), set()
    bad_missing, bad_new = [], []
    for i, r in enumerate(rows):
        row_fields = set(r.keys())
        missing = expected - row_fields
        new     = row_fields - expected - {"hn_id", "hn_url", "timestamp"}
        if missing:
            missing_in_any |= missing
            bad_missing.append(i)
        if new:
            new_in_any |= new
            bad_new.append(i)
    if missing_in_any:
        findings.append({
            "severity": "critical",
            "detector": "SchemaBreakDetector",
            "field": list(missing_in_any)[0],
            "title": f"Missing expected field(s): {sorted(missing_in_any)}",
            "description": f"{len(missing_in_any)} expected field(s) are absent from some rows: {sorted(missing_in_any)}. The source page layout may have changed.",
            "recommendation": "This is the #1 sign the scraper needs Bright Data's AI self-healing (bdata scraper heal). Trigger a heal cycle.",
            "rows": bad_missing,
            "count": len(bad_missing),
        })
    if new_in_any:
        findings.append({
            "severity": "low",
            "detector": "SchemaBreakDetector",
            "field": list(new_in_any)[0],
            "title": f"New unexpected field(s): {sorted(new_in_any)}",
            "description": f"{len(new_in_any)} field(s) not in the expected schema appeared: {sorted(new_in_any)}. The source added content.",
            "recommendation": "Review whether the new fields are worth adding to the schema, or filter them out.",
            "rows": bad_new,
            "count": len(bad_new),
        })
    return findings


def volume_anomaly_detector(rows):
    count = len(rows)
    delta_pct = (count - BASELINE_ROW_COUNT) / BASELINE_ROW_COUNT * 100
    if abs(delta_pct) < 30:
        return []
    direction = "increase" if delta_pct > 0 else "decrease"
    severity = "critical" if abs(delta_pct) > 80 else "high" if abs(delta_pct) > 50 else "medium"
    return [{
        "severity": severity,
        "detector": "VolumeAnomalyDetector",
        "field": None,
        "title": f"Row count anomaly: {count} rows ({delta_pct:+.1f}% vs baseline {BASELINE_ROW_COUNT})",
        "description": f"Extracted {count} rows, a {delta_pct:+.1f}% {direction} from the baseline of {BASELINE_ROW_COUNT}. This may indicate a pagination change, a site outage, or new content.",
        "recommendation": "Compare with the last successful run. A large increase may need deduplication; a large decrease may mean the scraper is failing silently.",
        "rows": list(range(count)),
        "count": count,
    }]


# ── main ────────────────────────────────────────────────────────────

def run(data_path, baseline_path, out_path):
    rows = load_json(data_path)
    if not isinstance(rows, list):
        rows = [rows]

    # Load baseline for distribution comparison (optional)
    baseline_rows = []
    if baseline_path and os.path.exists(baseline_path):
        bl = load_json(baseline_path)
        if isinstance(bl, list):
            baseline_rows = bl

    findings = []
    findings += null_detector(rows)
    findings += duplicate_detector(rows)
    findings += type_drift_detector(rows)
    findings += outlier_detector(rows)
    findings += distribution_shift_detector(rows, baseline_rows)
    findings += schema_break_detector(rows)
    findings += volume_anomaly_detector(rows)

    # Sort: critical first
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda f: sev_order.get(f["severity"], 9))

    score = quality_score(findings)
    by_severity = Counter(f["severity"] for f in findings)
    by_detector = Counter(f["detector"] for f in findings)

    report = {
        "report_id": f"rpt_{hashlib.md5(data_path.encode()).hexdigest()[:10]}",
        "generated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source_file": data_path,
        "rows_scraped": len(rows),
        "data_quality_score": score,
        "verdict": verdict(score),
        "findings_count": len(findings),
        "by_severity": dict(by_severity),
        "by_detector": dict(by_detector),
        "findings": findings,
    }

    dump_json(report, out_path)
    print(f"[anomaly] {len(findings)} findings | score={score}/100 | verdict={verdict(score)} -> {out_path}")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ScrapeForge anomaly detector")
    parser.add_argument("--data",     required=True,  help="Path to extracted JSON (list of rows)")
    parser.add_argument("--baseline", default=None,   help="Path to baseline JSON for distribution comparison")
    parser.add_argument("--out",      required=True,  help="Output path for anomalies.json")
    args = parser.parse_args()
    run(args.data, args.baseline, args.out)
