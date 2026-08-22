"""
fingerprint/normalize.py
------------------------
Strips volatile / build-hash content from a parsed HTML block and produces
a canonical string representing the structural skeleton.

Rules (from spec §4.3):
  STRIP:  all text nodes, style/nonce/data-* attrs (except allowlist),
          onclick/on* event handlers, build-hash id/class tokens
  KEEP:   tag names, nesting depth, semantic class names, href (no query strings)

Output per field selector: a canonical string ready to be SHA-256'd.
Also outputs a whole-block canonical string.
"""

import re
import sys
from pathlib import Path
from typing import NamedTuple

from bs4 import BeautifulSoup, Tag

# ── allowlisted data-* attributes ────────────────────────────────────────────
DATA_ATTR_ALLOWLIST = frozenset(
    ["data-id", "data-type", "data-sort", "data-page"]
)

# ── build-hash pattern: 6-20 chars, no obvious vowel/dict-word run ────────────
# A token is "hash-like" if it has 2+ consecutive consonant clusters or
# matches a pure hex/base62 run with no recognisable word inside.
_HASH_LIKE = re.compile(
    r"^[a-zA-Z0-9_-]{6,20}$"  # length guard
)
_HAS_VOWEL_RUN = re.compile(r"[aeiou]{1,}", re.IGNORECASE)  # real words tend to have vowels
_SEMANTIC_WORD_SEP = re.compile(r"[-_]")  # kebab / snake tokens are usually semantic


def _is_hash_like(token: str) -> bool:
    """Heuristic: returns True if the token looks like a build hash / CSS module name."""
    if not _HASH_LIKE.match(token):
        return False
    # Tokens with word separators (kebab-case, snake_case) are probably semantic
    parts = _SEMANTIC_WORD_SEP.split(token)
    if len(parts) > 1:
        return False  # e.g. "product-price" → semantic
    # Pure runs without vowels are hash-like (e.g. "a3f9x1", "xKPqZ7mR")
    if not _HAS_VOWEL_RUN.search(token):
        return True
    # Also catch things like "sc-bdfxgf" - single non-word part
    if len(token) >= 8 and not any(c.isalpha() and c.lower() in "aeiou" for c in token[2:4]):
        return True
    return False


def _strip_href_query(href: str) -> str:
    """Keep scheme + domain + path, drop query string and fragment."""
    # Simple split — avoids urllib overhead for the common case
    href = href.split("?")[0].split("#")[0]
    return href.strip()


def _clean_attrs(tag: Tag) -> dict:
    """Return a pruned attribute dict for a tag."""
    kept = {}
    for attr, val in tag.attrs.items():
        attr_lower = attr.lower()

        # ── strip rules ───────────────────────────────────────────────────
        if attr_lower in ("style", "nonce"):
            continue
        if attr_lower.startswith("on"):  # onclick, onmouseover, etc.
            continue
        if attr_lower.startswith("data-") and attr_lower not in DATA_ATTR_ALLOWLIST:
            continue
        if attr_lower in ("data-testid", "data-reactid"):
            continue

        # ── id: strip if hash-like ────────────────────────────────────────
        if attr_lower == "id":
            id_val = val if isinstance(val, str) else " ".join(val)
            if _is_hash_like(id_val):
                continue
            kept["id"] = id_val
            continue

        # ── class: keep only semantic tokens ─────────────────────────────
        if attr_lower == "class":
            tokens = val if isinstance(val, list) else val.split()
            semantic = [t for t in tokens if not _is_hash_like(t)]
            if semantic:
                kept["class"] = " ".join(sorted(semantic))  # sorted for canonicality
            continue

        # ── href: strip query string ──────────────────────────────────────
        if attr_lower == "href":
            href_val = val if isinstance(val, str) else " ".join(val)
            kept["href"] = _strip_href_query(href_val)
            continue

        # ── src: keep (structural) ────────────────────────────────────────
        if attr_lower == "src":
            kept["src"] = val if isinstance(val, str) else " ".join(val)
            continue

    return kept


def _canonicalize(tag: Tag, depth: int = 0) -> str:
    """
    Recursively produce a canonical string of the skeleton.
    Text nodes are dropped. Attributes are pruned via _clean_attrs.
    """
    lines: list[str] = []
    indent = "  " * depth

    attrs = _clean_attrs(tag)
    attr_str = ""
    if attrs:
        parts = []
        for k in sorted(attrs):
            parts.append(f'{k}="{attrs[k]}"')
        attr_str = " " + " ".join(parts)

    lines.append(f"{indent}<{tag.name}{attr_str}>")

    for child in tag.children:
        if isinstance(child, Tag):
            lines.append(_canonicalize(child, depth + 1))

    lines.append(f"{indent}</{tag.name}>")
    return "\n".join(lines)


class NormalizeResult(NamedTuple):
    block_canonical: str          # whole-block canonical string
    per_field: dict[str, str]     # field_name → canonical string of that element


def normalize_block(
    html: str,
    block_selector: str = "table#hnmain",
    field_selectors: dict[str, str] | None = None,
) -> NormalizeResult:
    """
    Parse the HTML and return canonical strings for the block and each field.

    field_selectors: mapping of field name → CSS selector relative to the
    block element. Defaults to Hacker News selectors.
    """
    if field_selectors is None:
        # Hacker News selectors (relative to block root)
        field_selectors = {
            "title":          "span.titleline > a",
            "url":            "span.titleline > a",
            "score":          "span.score",
            "author":         "a.hnuser",
            "comments_count": "a[href*='item?id=']:last-child",
            "rank":           "span.rank",
        }

    soup = BeautifulSoup(html, "html.parser")
    block = soup.select_one(block_selector)

    if block is None:
        # Fallback: use body
        block = soup.body or soup
        print(
            f"[normalize] Warning: block selector '{block_selector}' not found; "
            "using body as fallback.",
            file=sys.stderr,
        )

    block_canonical = _canonicalize(block)

    per_field: dict[str, str] = {}
    for field, selector in field_selectors.items():
        try:
            elements = block.select(selector)
            if elements:
                # Canonical all matched elements concatenated
                per_field[field] = "\n".join(_canonicalize(el) for el in elements[:5])
            else:
                per_field[field] = f"<MISSING selector='{selector}'>"
                print(
                    f"[normalize] Warning: field '{field}' selector '{selector}' matched nothing.",
                    file=sys.stderr,
                )
        except Exception as exc:
            per_field[field] = f"<ERROR: {exc}>"

    return NormalizeResult(block_canonical=block_canonical, per_field=per_field)


if __name__ == "__main__":
    import json
    from pathlib import Path

    raw_path = Path(__file__).parent / "raw_page.json"
    if not raw_path.exists():
        print("Run fetch_block.py first.", file=sys.stderr)
        sys.exit(1)

    data = json.loads(raw_path.read_text())
    result = normalize_block(data["html"])
    print(json.dumps({
        "block_canonical_length": len(result.block_canonical),
        "per_field_lengths": {k: len(v) for k, v in result.per_field.items()},
    }, indent=2))
