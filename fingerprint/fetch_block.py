"""
fingerprint/fetch_block.py
--------------------------
Fetches the raw HTML of the target page.
• Tries a plain HTTPS fetch first.
• Falls back to Bright Data's Web Unlocker if the response looks like a
  bot-block / CAPTCHA (so the fingerprint layer sees the same rendered DOM
  that the Scraper Studio collector sees).

Output: writes raw_html + metadata to fingerprint/raw_page.json
        also returns (html: str, timestamp: str) for pipeline use.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── config ────────────────────────────────────────────────────────────────────
TARGET_URL: str = os.environ.get("TARGET_URL", "https://news.ycombinator.com")
BRIGHT_DATA_API_TOKEN: str = os.environ.get("BRIGHT_DATA_API_TOKEN", "")

# Bright Data Web Unlocker endpoint (used as fallback)
UNLOCKER_ENDPOINT = "https://api.brightdata.com/request"

# Specific indicators that indicate a Cloudflare/CAPTCHA challenge page rather than normal content
BOT_WALL_SIGNALS = [
    "<title>just a moment...</title>",
    "cf-browser-verification",
    "cf-challenge-running",
    "g-recaptcha",
    "challenges.cloudflare.com",
    "cf-turnstile",
    "attention required! | cloudflare",
    "security check to access",
]

RAW_OUTPUT_PATH = Path(__file__).parent / "raw_page.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def _is_bot_wall(html: str) -> bool:
    low = html.lower()
    # Check if page is unusually small and contains common blocker title/texts
    if len(html) < 2000 and any(kw in low for kw in ["access denied", "403 forbidden", "verify you are human"]):
        return True
    return any(sig in low for sig in BOT_WALL_SIGNALS)


def fetch_via_web_unlocker(url: str, token: str) -> str:
    """Use Bright Data Web Unlocker to bypass bot protection."""
    if not token:
        raise RuntimeError(
            "BRIGHT_DATA_API_TOKEN is required for the Web Unlocker fallback. "
            "Set it in your environment or GitHub Actions secrets."
        )
    payload = {
        "url": url,
        "zone": "web_unlocker1",  # default Web Unlocker zone name
    }
    resp = requests.post(
        UNLOCKER_ENDPOINT,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )
    resp.raise_for_status()
    return resp.text


def fetch_page(url: str = TARGET_URL) -> tuple[str, str]:
    """
    Returns (html, timestamp_iso).
    Tries plain HTTPS; falls back to Web Unlocker on bot-wall detection.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    html: str | None = None
    source = "direct"

    # ── Attempt 1: plain HTTPS ─────────────────────────────────────────────
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        html = resp.text
        if _is_bot_wall(html):
            print(
                "[fetch_block] Bot-wall detected on direct fetch — "
                "switching to Web Unlocker.",
                file=sys.stderr,
            )
            html = None  # force fallback
        else:
            print(f"[fetch_block] Direct fetch OK ({len(html)} chars)", file=sys.stderr)
    except requests.RequestException as exc:
        print(f"[fetch_block] Direct fetch failed: {exc}", file=sys.stderr)

    # ── Attempt 2: Bright Data Web Unlocker ───────────────────────────────
    if html is None:
        source = "web_unlocker"
        token = BRIGHT_DATA_API_TOKEN
        try:
            html = fetch_via_web_unlocker(url, token)
            print(
                f"[fetch_block] Web Unlocker fetch OK ({len(html)} chars)",
                file=sys.stderr,
            )
        except Exception as exc:
            raise RuntimeError(f"Both direct fetch and Web Unlocker failed: {exc}") from exc

    # ── Persist ───────────────────────────────────────────────────────────
    output = {
        "url": url,
        "timestamp": timestamp,
        "source": source,
        "html_length": len(html),
        "html": html,
    }
    RAW_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2))
    print(f"[fetch_block] Wrote {RAW_OUTPUT_PATH}", file=sys.stderr)

    return html, timestamp


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else TARGET_URL
    html, ts = fetch_page(url)
    print(json.dumps({"timestamp": ts, "html_length": len(html)}))
