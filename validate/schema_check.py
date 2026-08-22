"""
validate/schema_check.py
-------------------------
Field-level validation of scraped JSON output.
Implements the spec §4.5 + Dashboard Addendum §2 (per-field confidence scores).

Input:  path to a JSON file (array of story objects) or a list of dicts
Output: {
  "passed": bool,
  "fields": { field: { "ok": bool, "confidence": float } },
  "failures": [ { "item_index": int, "field": str, "reason": str } ]
}

Confidence is derived from concrete checks — not a fuzzy model score.
Each passing check contributes weight; the final score is deterministic.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any

# ── field contracts ───────────────────────────────────────────────────────────
# Each entry is a list of (check_fn, weight, failure_description)
# weight is how much a passing check contributes to confidence (sum → 1.0)

URL_RE = re.compile(r"^https?://")
SCORE_RE = re.compile(r"^\d+(\s+points?)?$", re.IGNORECASE)


def _check_title(val: Any) -> list[tuple[bool, float, str]]:
    return [
        (isinstance(val, str), 0.4, "must be a string"),
        (isinstance(val, str) and len(val) > 1, 0.4, "must be non-empty (length > 1)"),
        (isinstance(val, str) and len(val) <= 500, 0.2, "suspiciously long (>500 chars)"),
    ]


def _check_url(val: Any) -> list[tuple[bool, float, str]]:
    return [
        (isinstance(val, str), 0.3, "must be a string"),
        (isinstance(val, str) and URL_RE.match(val) is not None, 0.5, "must start with http/https"),
        (isinstance(val, str) and len(val) > 5, 0.2, "must not be an empty URL"),
    ]


def _check_score(val: Any) -> list[tuple[bool, float, str]]:
    if isinstance(val, (int, float)):
        return [
            (True, 0.4, "numeric type"),
            (val >= 0, 0.4, "must be non-negative"),
            (val < 100_000, 0.2, "implausibly large score"),
        ]
    if isinstance(val, str):
        numeric_str = re.sub(r"[^\d]", "", val)
        try:
            num = int(numeric_str) if numeric_str else -1
        except ValueError:
            num = -1
        return [
            (True, 0.2, "string type (acceptable)"),
            (SCORE_RE.match(val.strip()) is not None, 0.4, "must be numeric string"),
            (num >= 0, 0.4, "must parse as non-negative number"),
        ]
    return [(False, 1.0, f"invalid type {type(val).__name__}")]


def _check_author(val: Any) -> list[tuple[bool, float, str]]:
    return [
        (isinstance(val, str), 0.4, "must be a string"),
        (isinstance(val, str) and len(val) > 0, 0.4, "must be non-empty"),
        (isinstance(val, str) and len(val) <= 100, 0.2, "implausibly long author name"),
    ]


def _check_comments_count(val: Any) -> list[tuple[bool, float, str]]:
    if isinstance(val, (int, float)):
        return [
            (True, 0.4, "numeric type"),
            (val >= 0, 0.4, "must be non-negative"),
            (val < 100_000, 0.2, "implausibly large count"),
        ]
    if isinstance(val, str):
        numeric_str = re.sub(r"[^\d]", "", val)
        try:
            num = int(numeric_str) if numeric_str else -1
        except ValueError:
            num = -1
        return [
            (True, 0.2, "string type (acceptable)"),
            (num >= 0, 0.4, "must parse as non-negative number"),
            (num < 100_000, 0.4, "implausibly large count"),
        ]
    return [(False, 1.0, f"invalid type {type(val).__name__}")]


def _check_rank(val: Any) -> list[tuple[bool, float, str]]:
    if isinstance(val, (int, float)):
        return [
            (True, 0.5, "numeric type"),
            (1 <= val <= 100, 0.5, "rank must be 1–100"),
        ]
    if isinstance(val, str):
        numeric_str = re.sub(r"[^\d]", "", val)
        try:
            num = int(numeric_str) if numeric_str else -1
        except ValueError:
            num = -1
        return [
            (True, 0.3, "string type (acceptable)"),
            (num >= 1, 0.4, "must parse as positive number"),
            (num <= 100, 0.3, "rank must be ≤ 100"),
        ]
    return [(False, 1.0, f"invalid type {type(val).__name__}")]


FIELD_CHECKERS = {
    "title":          _check_title,
    "url":            _check_url,
    "score":          _check_score,
    "author":         _check_author,
    "comments_count": _check_comments_count,
    "rank":           _check_rank,
}

# Minimum confidence to consider a field "ok" overall
CONFIDENCE_THRESHOLD = 0.6


def check_item(item: dict, item_index: int = 0) -> dict:
    """Validate a single scraped item. Returns per-field result dict + failures list."""
    field_results: dict[str, dict] = {}
    failures: list[dict] = []

    for field_name, checker in FIELD_CHECKERS.items():
        val = item.get(field_name)

        if val is None:
            field_results[field_name] = {"ok": False, "confidence": 0.0}
            failures.append({
                "item_index": item_index,
                "field": field_name,
                "reason": "missing / null",
            })
            continue

        checks = checker(val)
        total_weight = sum(w for _, w, _ in checks)
        passed_weight = sum(w for ok, w, _ in checks if ok)
        confidence = round(passed_weight / total_weight, 4) if total_weight > 0 else 0.0

        all_passed = all(ok for ok, _, _ in checks)
        ok = confidence >= CONFIDENCE_THRESHOLD

        field_results[field_name] = {"ok": ok, "confidence": confidence}

        if not ok:
            failed_reasons = [desc for ok_, _, desc in checks if not ok_]
            failures.append({
                "item_index": item_index,
                "field": field_name,
                "reason": "; ".join(failed_reasons) or "low confidence",
            })

    return {"fields": field_results, "failures": failures}


def check_output(data: list[dict] | dict) -> dict:
    """
    Validate the full scraper output (list of items or single item).
    Returns the aggregate result shape from spec.
    """
    if isinstance(data, dict):
        data = [data]

    all_failures: list[dict] = []
    # Aggregate per-field across all items: track min confidence
    agg_fields: dict[str, list[float]] = {f: [] for f in FIELD_CHECKERS}
    agg_ok: dict[str, list[bool]] = {f: [] for f in FIELD_CHECKERS}

    for i, item in enumerate(data):
        result = check_item(item, i)
        all_failures.extend(result["failures"])
        for f, fr in result["fields"].items():
            agg_fields[f].append(fr["confidence"])
            agg_ok[f].append(fr["ok"])

    # Aggregate: field is ok if >80% of items pass; confidence = average
    summary_fields: dict[str, dict] = {}
    for f in FIELD_CHECKERS:
        confs = agg_fields[f]
        oks = agg_ok[f]
        if confs:
            avg_conf = round(sum(confs) / len(confs), 4)
            pass_rate = sum(oks) / len(oks)
            summary_fields[f] = {
                "ok": pass_rate >= 0.8,
                "confidence": avg_conf,
                "pass_rate": round(pass_rate, 4),
            }
        else:
            summary_fields[f] = {"ok": False, "confidence": 0.0, "pass_rate": 0.0}

    overall_passed = all(v["ok"] for v in summary_fields.values()) and len(all_failures) == 0

    return {
        "passed": overall_passed,
        "fields": summary_fields,
        "failures": all_failures,
        "items_checked": len(data),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Try to auto-find the latest data file
        data_dir = Path(__file__).parent.parent / "data"
        candidates = sorted(data_dir.glob("*.json")) if data_dir.exists() else []
        if not candidates:
            print("Usage: python schema_check.py <path-to-data.json>", file=sys.stderr)
            sys.exit(1)
        path = candidates[-1]
        print(f"[schema_check] Auto-selected: {path}", file=sys.stderr)
    else:
        path = Path(sys.argv[1])

    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        sys.exit(1)

    raw = json.loads(path.read_text())
    result = check_output(raw)
    print(json.dumps(result, indent=2))

    if not result["passed"]:
        sys.exit(1)
