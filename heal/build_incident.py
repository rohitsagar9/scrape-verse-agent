"""
heal/build_incident.py
-----------------------
Packages the incident JSON object (spec §4.6) for a detected structural change.

Reads:
  - fingerprint/raw_page.json (new HTML)
  - fingerprint/baseline.json (old hashes)
  - scraper/collector.json (collector metadata)
  - Latest hash change report (passed as argument or read from env)

Writes:
  - heal/incident.json (the incident package)
  - heal/incident_prompt_filled.md (ready to pass to claude -p)
"""

from __future__ import annotations

import json
import sys
import textwrap
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW_PATH = ROOT / "fingerprint" / "raw_page.json"
BASELINE_PATH = ROOT / "fingerprint" / "baseline.json"
COLLECTOR_PATH = ROOT / "scraper" / "collector.json"
PROMPT_TEMPLATE_PATH = Path(__file__).parent / "incident_prompt.md"
INCIDENT_PATH = Path(__file__).parent / "incident.json"
FILLED_PROMPT_PATH = Path(__file__).parent / "incident_prompt_filled.md"

MAX_HTML_CHARS = 6000  # truncate new_block_html to keep prompt sane


def _extract_block(html: str, selector: str = "table.itemlist") -> str:
    """Extract and truncate the target block HTML."""
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        block = soup.select_one(selector)
        if block:
            return str(block)[:MAX_HTML_CHARS]
    except Exception:
        pass
    # Fallback: return beginning of full page
    return html[:MAX_HTML_CHARS]


def build_incident(
    change_report: dict,
    validation_failures: list | None = None,
    triggered_by: str = "hash_mismatch",
) -> dict:
    """
    Build and write the incident JSON + filled prompt template.
    Returns the incident dict.
    """
    validation_failures = validation_failures or []

    # Load required files
    raw = json.loads(RAW_PATH.read_text()) if RAW_PATH.exists() else {}
    baseline = json.loads(BASELINE_PATH.read_text()) if BASELINE_PATH.exists() else {}
    collector = json.loads(COLLECTOR_PATH.read_text()) if COLLECTOR_PATH.exists() else {}

    new_html = raw.get("html", "")
    new_block_html = _extract_block(new_html, collector.get("target_selector", "table.itemlist"))

    # Determine trigger string
    if change_report.get("block_changed") and validation_failures:
        triggered_by = "both"
    elif change_report.get("block_changed"):
        triggered_by = "hash_mismatch"
    elif validation_failures:
        triggered_by = "data_validation"

    incident = {
        "collector_id": collector.get("collector_id", "c_xxxxxxxxxxxxxxxx"),
        "url": collector.get("url", raw.get("url", "")),
        "triggered_by": triggered_by,
        "old_hash": change_report.get("old_block_hash", baseline.get("block_hash", "")),
        "new_hash": change_report.get("new_block_hash", ""),
        "changed_fields": change_report.get("changed_fields", []),
        "new_block_html": new_block_html,
        "validation_failures": validation_failures,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "per_field_hashes": change_report.get("field_hashes", {}),
    }

    # Write incident JSON
    INCIDENT_PATH.parent.mkdir(parents=True, exist_ok=True)
    INCIDENT_PATH.write_text(json.dumps(incident, indent=2, ensure_ascii=False))
    print(f"[build_incident] Wrote {INCIDENT_PATH}", file=sys.stderr)

    # Fill prompt template
    if PROMPT_TEMPLATE_PATH.exists():
        template = PROMPT_TEMPLATE_PATH.read_text()
        filled = (
            template
            .replace("{{collector_id}}", incident["collector_id"])
            .replace("{{url}}", incident["url"])
            .replace("{{triggered_by}}", incident["triggered_by"])
            .replace("{{changed_fields}}", ", ".join(incident["changed_fields"]) or "none")
            .replace("{{old_hash}}", incident["old_hash"][:16] + "...")
            .replace("{{new_hash}}", incident["new_hash"][:16] + "...")
            .replace("{{new_block_html}}", incident["new_block_html"])
        )
        FILLED_PROMPT_PATH.write_text(filled)
        print(f"[build_incident] Wrote {FILLED_PROMPT_PATH}", file=sys.stderr)

    return incident


if __name__ == "__main__":
    # Accept a change report JSON on stdin or as a file path argument
    if len(sys.argv) > 1:
        report_path = Path(sys.argv[1])
        change_report = json.loads(report_path.read_text())
    else:
        # Try reading from stdin
        try:
            change_report = json.loads(sys.stdin.read())
        except Exception:
            change_report = {}

    incident = build_incident(change_report)
    print(json.dumps(incident, indent=2, ensure_ascii=False))
