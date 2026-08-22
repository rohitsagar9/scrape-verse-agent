"""
heal/confidence.py
------------------
Shared confidence scoring utilities used by:
  - heal/heuristic_remap.py  (candidate selector scoring)
  - validate/schema_check.py  (field value quality)

A confidence score is a float in [0.0, 1.0] derived from discrete, explainable
checks — not a black-box model. This keeps demo narration honest.
"""

from __future__ import annotations

import re
from typing import Any

# ── Value-type classifiers ────────────────────────────────────────────────────

_PRICE_RE = re.compile(
    r"""
    ^[\$€£¥₹]?          # optional currency symbol
    \s*
    \d{1,10}            # integer part
    (\.\d{1,4})?        # optional decimal
    \s*
    [kKmMbB]?           # optional magnitude suffix
    $
    """,
    re.VERBOSE,
)

_URL_RE = re.compile(r"^https?://\S+")
_IMAGE_RE = re.compile(r"\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$", re.IGNORECASE)


def is_price_shaped(text: str) -> bool:
    """Returns True if text looks like a price / numeric value with optional currency."""
    text = text.strip()
    return bool(_PRICE_RE.match(text))


def is_url_shaped(text: str) -> bool:
    return bool(_URL_RE.match(text.strip()))


def is_image_url(text: str) -> bool:
    return is_url_shaped(text) and bool(_IMAGE_RE.search(text))


def is_numeric(text: str) -> bool:
    try:
        float(re.sub(r"[^\d.\-]", "", text.strip()))
        return True
    except (ValueError, AttributeError):
        return False


def is_non_empty_string(val: Any) -> bool:
    return isinstance(val, str) and len(val.strip()) > 1


# ── Selector candidate scorer ─────────────────────────────────────────────────

def score_selector_candidate(
    element_text: str,
    element_tag: str,
    element_classes: list[str],
    field_name: str,
    field_hint: str | None = None,
) -> float:
    """
    Score how likely a DOM element candidate is to be the correct replacement
    selector for a given field. Returns a float in [0.0, 1.0].

    Uses:
      - Tag appropriateness for the field type
      - Class name semantic match against field name
      - Text content type match (price-shaped, URL-shaped, etc.)
    """
    score = 0.0
    reasons: list[str] = []

    field_lower = field_name.lower()
    text = element_text.strip()
    classes_lower = [c.lower() for c in element_classes]
    tag_lower = element_tag.lower()

    # ── 1. Semantic class match (up to 0.35) ─────────────────────────────
    field_tokens = re.split(r"[-_\s]", field_lower)
    class_match = any(
        any(tok in cls for tok in field_tokens)
        for cls in classes_lower
    )
    if class_match:
        score += 0.35
        reasons.append("class-name semantic match")

    # ── 2. Tag appropriateness (up to 0.25) ──────────────────────────────
    tag_scores = {
        "price":          {"span": 0.25, "div": 0.15, "p": 0.10},
        "score":          {"span": 0.25, "div": 0.15, "p": 0.10},
        "title":          {"a": 0.25, "h1": 0.20, "h2": 0.20, "span": 0.10},
        "name":           {"a": 0.25, "h1": 0.20, "h2": 0.20, "span": 0.10},
        "url":            {"a": 0.25, "link": 0.20},
        "image_url":      {"img": 0.25, "a": 0.10},
        "author":         {"a": 0.25, "span": 0.15},
        "comments_count": {"a": 0.20, "span": 0.15},
        "rank":           {"span": 0.25, "td": 0.15},
        "rating":         {"span": 0.25, "div": 0.15},
        "description":    {"p": 0.25, "div": 0.15, "span": 0.10},
    }
    field_tag_map = tag_scores.get(field_lower, {})
    tag_boost = field_tag_map.get(tag_lower, 0.05)
    score += tag_boost
    if tag_boost > 0.1:
        reasons.append(f"tag <{tag_lower}> matches field type")

    # ── 3. Text content type match (up to 0.30) ──────────────────────────
    if text:
        if field_lower in ("price", "score", "rating", "comments_count", "rank"):
            if is_price_shaped(text) or is_numeric(text):
                score += 0.30
                reasons.append("text is numeric/price-shaped")
        elif field_lower in ("url",):
            if is_url_shaped(text):
                score += 0.30
                reasons.append("text is URL-shaped")
        elif field_lower in ("image_url",):
            if is_image_url(text):
                score += 0.30
                reasons.append("text is image URL")
        elif field_lower in ("title", "name", "description", "author"):
            if is_non_empty_string(text):
                score += 0.20
                reasons.append("text is non-empty string")

    # ── 4. Field hint override (up to 0.10) ──────────────────────────────
    if field_hint and field_hint.lower() in " ".join(classes_lower + [element_text.lower()]):
        score += 0.10
        reasons.append("hint match")

    return min(round(score, 4), 1.0)
