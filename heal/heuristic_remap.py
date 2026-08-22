"""
heal/heuristic_remap.py
------------------------
Stage 1 of the cascading heal pipeline.

For each field whose hash changed, search the siblings and cousins of the
last-known selector path for an element whose content type, tag, and class
names match what we expect for that field. Score each candidate 0–1 using
heal/confidence.py. If confidence > THRESHOLD, adopt the new selector.

Returns a RemapResult indicating which fields were confidently remapped
and which need to escalate to Stage 2 (LLM heal).
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from bs4 import BeautifulSoup, Tag

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

from confidence import score_selector_candidate  # noqa: E402

# Confidence threshold above which we adopt the remapped selector
CONFIDENCE_THRESHOLD = 0.85

# How many levels up to search from the original selector
SEARCH_DEPTH = 3

# Default HN field selectors (the "last known good" map)
DEFAULT_FIELD_SELECTORS: dict[str, str] = {
    "title":          "span.titleline > a",
    "url":            "span.titleline > a",
    "score":          "span.score",
    "author":         "a.hnuser",
    "comments_count": "a[href*='item?id=']:last-child",
    "rank":           "span.rank",
}


@dataclass
class FieldRemapResult:
    field: str
    old_selector: str
    new_selector: Optional[str]
    confidence: float
    remapped: bool
    reason: str


@dataclass
class RemapResult:
    stage: str = "heuristic_remap"
    fields: list[FieldRemapResult] = field(default_factory=list)
    escalate_fields: list[str] = field(default_factory=list)  # fields that need LLM
    success: bool = False   # True only if ALL changed fields were remapped

    def as_dict(self) -> dict:
        d = asdict(self)
        return d


def _get_css_selector(element: Tag) -> str:
    """Build a simple CSS selector string for an element."""
    parts = []
    el = element
    for _ in range(4):  # max 4 ancestors
        tag = el.name
        classes = [c for c in (el.get("class") or []) if not _is_hash(c)]
        id_ = el.get("id", "")

        if id_ and not _is_hash(str(id_)):
            parts.append(f"#{id_}")
            break
        elif classes:
            parts.append(f"{tag}.{'.'.join(classes)}")
        else:
            # nth-child fallback
            parent = el.parent
            if parent:
                siblings = [s for s in parent.children if isinstance(s, Tag) and s.name == tag]
                idx = siblings.index(el) + 1
                parts.append(f"{tag}:nth-child({idx})")
            else:
                parts.append(tag)

        parent = el.parent
        if parent is None or parent.name in ("html", "body", "[document]"):
            break
        el = parent

    return " > ".join(reversed(parts))


def _is_hash(token: str) -> bool:
    import re
    return bool(re.match(r"^[a-zA-Z0-9_-]{6,20}$", token)) and not bool(re.search(r"[aeiou]", token[:4]))


def _candidates_for_field(
    soup: BeautifulSoup,
    old_selector: str,
    field_name: str,
    search_depth: int = SEARCH_DEPTH,
) -> list[tuple[Tag, str, float]]:
    """
    Find candidate elements by searching around the last-known selector.
    Returns [(element, css_selector_str, confidence_score)].
    """
    candidates: list[tuple[Tag, str, float]] = []

    # First, try the original selector — maybe it still works
    direct = soup.select(old_selector)
    for el in direct[:3]:
        text = el.get_text(strip=True)
        classes = el.get("class") or []
        conf = score_selector_candidate(text, el.name, classes, field_name)
        if conf > 0:
            candidates.append((el, old_selector, conf))

    # Walk up from old selector's approximate location, then search subtrees
    # We'll search the whole document filtered by likely tag types
    field_lower = field_name.lower()
    tag_hints = {
        "price":          ["span", "div", "p"],
        "score":          ["span", "div"],
        "title":          ["a", "h1", "h2", "h3", "span"],
        "name":           ["a", "h1", "h2", "span"],
        "url":            ["a"],
        "image_url":      ["img", "a"],
        "author":         ["a", "span"],
        "comments_count": ["a", "span"],
        "rank":           ["span", "td"],
        "rating":         ["span", "div"],
        "description":    ["p", "div", "span"],
    }
    search_tags = tag_hints.get(field_lower, ["span", "div", "a", "p"])

    for tag_name in search_tags:
        for el in soup.find_all(tag_name, limit=100):
            text = el.get_text(strip=True)
            if not text:
                continue
            classes = el.get("class") or []
            conf = score_selector_candidate(text, el.name, classes, field_name)
            if conf >= CONFIDENCE_THRESHOLD * 0.7:
                sel = _get_css_selector(el)
                candidates.append((el, sel, conf))

    # Sort by confidence, deduplicate by selector
    seen: set[str] = set()
    unique: list[tuple[Tag, str, float]] = []
    for el, sel, conf in sorted(candidates, key=lambda x: -x[2]):
        if sel not in seen:
            seen.add(sel)
            unique.append((el, sel, conf))

    return unique[:10]


def remap(
    html: str,
    changed_fields: list[str],
    field_selectors: dict[str, str] | None = None,
) -> RemapResult:
    """
    Attempt heuristic remapping for all changed_fields.
    Returns a RemapResult with per-field outcomes.
    """
    if field_selectors is None:
        field_selectors = DEFAULT_FIELD_SELECTORS.copy()

    soup = BeautifulSoup(html, "html.parser")
    results: list[FieldRemapResult] = []
    escalate: list[str] = []

    for field_name in changed_fields:
        old_sel = field_selectors.get(field_name, "")
        candidates = _candidates_for_field(soup, old_sel, field_name)

        if not candidates:
            results.append(FieldRemapResult(
                field=field_name,
                old_selector=old_sel,
                new_selector=None,
                confidence=0.0,
                remapped=False,
                reason="no candidates found",
            ))
            escalate.append(field_name)
            continue

        best_el, best_sel, best_conf = candidates[0]

        if best_conf >= CONFIDENCE_THRESHOLD:
            results.append(FieldRemapResult(
                field=field_name,
                old_selector=old_sel,
                new_selector=best_sel,
                confidence=best_conf,
                remapped=True,
                reason=f"heuristic confidence {best_conf:.2f} ≥ threshold {CONFIDENCE_THRESHOLD}",
            ))
        else:
            results.append(FieldRemapResult(
                field=field_name,
                old_selector=old_sel,
                new_selector=best_sel,
                confidence=best_conf,
                remapped=False,
                reason=f"best confidence {best_conf:.2f} < threshold {CONFIDENCE_THRESHOLD} — escalating to LLM",
            ))
            escalate.append(field_name)

    success = len(escalate) == 0

    return RemapResult(
        stage="heuristic_remap",
        fields=results,
        escalate_fields=escalate,
        success=success,
    )


if __name__ == "__main__":
    # Quick test: load raw page and remap a known changed field
    raw_path = Path(__file__).parent.parent / "fingerprint" / "raw_page.json"
    if not raw_path.exists():
        print("Run fingerprint/fetch_block.py first.", file=sys.stderr)
        sys.exit(1)
    data = json.loads(raw_path.read_text())
    result = remap(data["html"], changed_fields=["score", "author"])
    print(json.dumps(result.as_dict(), indent=2))
