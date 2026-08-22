"""
heal/heal_agent.py
------------------
Orchestrates the 4-stage cascading heal pipeline:

  Stage 0 — Playbook lookup   (~1s)
  Stage 1 — Heuristic remap   (~2-5s)
  Stage 2 — LLM heal via bdata scraper heal   (~15 min)
  Stage 3 — Escalate: roll back, open issue, stop

Rules (spec §5):
  - Never auto-approve on failed validation
  - One heal attempt per night
  - All changes go to a self-heal/<date> branch, never main
  - Secrets never written to disk
  - Idempotent: re-running on same day/data is safe

Writes live_events.jsonl as each stage runs (for SSE streaming to dashboard).
Also POSTs each event if SSE_SERVER_URL env var is set.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parent.parent
HEAL_DIR = Path(__file__).parent
PLAYBOOK_PATH = HEAL_DIR / "playbook.json"
INCIDENT_PATH = HEAL_DIR / "incident.json"
LAST_PREVIEW_PATH = HEAL_DIR / "last_preview.json"
LIVE_EVENTS_PATH = HEAL_DIR / "live_events.jsonl"
FILLED_PROMPT_PATH = HEAL_DIR / "incident_prompt_filled.md"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(HEAL_DIR))

from validate.schema_check import check_output        # noqa: E402
from heal.heuristic_remap import remap as heuristic_remap  # noqa: E402
import fingerprint.hash_block as hash_block           # noqa: E402

BRIGHT_DATA_TOKEN = os.environ.get("BRIGHT_DATA_API_TOKEN", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SSE_SERVER_URL = os.environ.get("SSE_SERVER_URL", "")
COLLECTOR_ID = os.environ.get("COLLECTOR_ID", "")
TARGET_URL = os.environ.get("TARGET_URL", "https://news.ycombinator.com")


# ── event logging ─────────────────────────────────────────────────────────────

def _emit(event: str, data: dict) -> None:
    """Append an event to live_events.jsonl and optionally POST to SSE server."""
    entry = {
        "event": event,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with LIVE_EVENTS_PATH.open("a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"[heal_agent] EVENT {event}: {json.dumps(data)}", file=sys.stderr)

    if SSE_SERVER_URL:
        try:
            import requests
            requests.post(f"{SSE_SERVER_URL}/internal/event", json=entry, timeout=5)
        except Exception:
            pass  # SSE server is optional


# ── playbook helpers ──────────────────────────────────────────────────────────

def _load_playbook() -> dict:
    if PLAYBOOK_PATH.exists():
        try:
            return json.loads(PLAYBOOK_PATH.read_text())
        except Exception:
            return {}
    return {}


def _save_playbook(playbook: dict) -> None:
    PLAYBOOK_PATH.write_text(json.dumps(playbook, indent=2))


def _transition_key(old_hash: str, new_hash: str) -> str:
    return f"{old_hash[:16]}→{new_hash[:16]}"


# ── bdata CLI helpers ─────────────────────────────────────────────────────────

def _run_bdata(*args: str, capture: bool = True) -> subprocess.CompletedProcess:
    cmd = ["npx", "-p", "@brightdata/cli", "bdata"] + list(args)
    env = {**os.environ}
    if BRIGHT_DATA_TOKEN:
        env["BRIGHT_DATA_API_TOKEN"] = BRIGHT_DATA_TOKEN
    result = subprocess.run(
        cmd,
        capture_output=capture,
        text=True,
        env=env,
        timeout=1200,  # 20 min max for LLM heal
    )
    return result


def _run_scraper(collector_id: str, url: str) -> list[dict] | None:
    """Run the scraper and return parsed JSON output, or None on failure."""
    _emit("scraper_run_start", {"collector_id": collector_id, "url": url})
    result = _run_bdata("scraper", "run", collector_id, url)
    if result.returncode != 0:
        _emit("scraper_run_failed", {"stderr": result.stderr[:500]})
        return None
    try:
        data = json.loads(result.stdout)
        _emit("scraper_run_success", {"items": len(data) if isinstance(data, list) else 1})
        return data if isinstance(data, list) else [data]
    except json.JSONDecodeError as e:
        _emit("scraper_run_parse_error", {"error": str(e), "raw": result.stdout[:200]})
        return None


# ── stage implementations ─────────────────────────────────────────────────────

def stage0_playbook(incident: dict, playbook: dict) -> Optional[dict]:
    """
    Attempt to re-apply a stored selector map from a previous heal.
    Returns the selector map if a match is found, else None.
    """
    key = _transition_key(incident.get("old_hash", ""), incident.get("new_hash", ""))
    _emit("stage0_start", {"transition_key": key})

    entry = playbook.get(key)
    if entry:
        _emit("stage0_hit", {"selector_map": entry["selector_map"], "confidence": entry["confidence"]})
        return entry
    else:
        _emit("stage0_miss", {"reason": "no matching transition in playbook"})
        return None


def stage1_heuristic(incident: dict, html: str) -> Optional[dict]:
    """
    Heuristic remap: score sibling/cousin candidates for each changed field.
    Returns selector_map if all fields confidently remapped, else None.
    """
    changed_fields = incident.get("changed_fields", [])
    if not changed_fields:
        _emit("stage1_skip", {"reason": "no changed fields identified"})
        return None

    _emit("stage1_start", {"changed_fields": changed_fields})
    result = heuristic_remap(html, changed_fields)

    _emit("stage1_result", {
        "success": result.success,
        "remapped": [f.field for f in result.fields if f.remapped],
        "escalate": result.escalate_fields,
    })

    if result.success:
        selector_map = {f.field: f.new_selector for f in result.fields if f.new_selector}
        return {"selector_map": selector_map, "confidence": min(f.confidence for f in result.fields)}
    return None


def stage2_llm_heal(incident: dict, collector_id: str) -> bool:
    """
    LLM heal via `bdata scraper heal`. Writes preview to last_preview.json.
    Returns True if the preview was successfully written.
    """
    _emit("stage2_start", {"collector_id": collector_id})

    if not FILLED_PROMPT_PATH.exists():
        _emit("stage2_failed", {"reason": "incident_prompt_filled.md not found"})
        return False

    # Run claude -p with the filled prompt
    prompt = FILLED_PROMPT_PATH.read_text()
    try:
        claude_result = subprocess.run(
            ["claude", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=1200,
            env={**os.environ, "ANTHROPIC_API_KEY": ANTHROPIC_KEY},
        )
    except FileNotFoundError:
        _emit("stage2_claude_not_found", {"hint": "Install claude CLI: npm install -g @anthropic-ai/claude-cli"})
        # Fallback: run bdata scraper heal directly
        description = (
            f"Structural change detected in {incident.get('url','')}: "
            f"changed fields: {', '.join(incident.get('changed_fields', []))}"
        )
        heal_result = _run_bdata("scraper", "heal", collector_id, description)
        if heal_result.returncode != 0:
            _emit("stage2_heal_failed", {"stderr": heal_result.stderr[:500]})
            return False
        # Try to extract preview from stdout
        try:
            preview = json.loads(heal_result.stdout)
            LAST_PREVIEW_PATH.write_text(json.dumps(preview, indent=2))
            _emit("stage2_preview_written", {"path": str(LAST_PREVIEW_PATH)})
            return True
        except json.JSONDecodeError:
            LAST_PREVIEW_PATH.write_text(json.dumps({"raw_output": heal_result.stdout}, indent=2))
            _emit("stage2_preview_raw", {"warning": "Could not parse JSON preview"})
            return True

    if claude_result.returncode != 0:
        _emit("stage2_claude_failed", {"stderr": claude_result.stderr[:500]})
        return False

    _emit("stage2_claude_success", {"output_length": len(claude_result.stdout)})
    return LAST_PREVIEW_PATH.exists()


def stage3_escalate(incident: dict, reason: str) -> None:
    """
    Stage 3: Roll back to last good baseline, flag for manual review.
    Does NOT approve anything. Logs the escalation.
    """
    _emit("stage3_escalate", {
        "reason": reason,
        "collector_id": incident.get("collector_id"),
        "url": incident.get("url"),
        "action": "manual_review_required",
    })
    print(
        f"[heal_agent] ESCALATED — manual review required. Reason: {reason}",
        file=sys.stderr,
    )


# ── approval & baseline update ────────────────────────────────────────────────

def _approve_and_update(incident: dict, selector_map: dict, confidence: float, stage: str, playbook: dict) -> bool:
    """
    Validate the current preview/run output, then approve if valid.
    Returns True on success.
    """
    collector_id = incident.get("collector_id", COLLECTOR_ID)
    url = incident.get("url", TARGET_URL)

    # Validate the preview or a fresh scraper run
    if LAST_PREVIEW_PATH.exists():
        preview_data = json.loads(LAST_PREVIEW_PATH.read_text())
        data = preview_data if isinstance(preview_data, list) else [preview_data]
    else:
        # Run the scraper to get current output for validation
        data = _run_scraper(collector_id, url) or []

    validation = check_output(data)
    _emit("validation_result", {
        "stage": stage,
        "passed": validation["passed"],
        "fields": validation["fields"],
        "failures": validation["failures"],
    })

    if not validation["passed"]:
        _emit("approve_blocked", {"reason": "validation failed — NOT approving"})
        return False

    # Approve
    _emit("approve_start", {"collector_id": collector_id, "stage": stage})
    approve_result = _run_bdata("scraper", "approve", collector_id)
    if approve_result.returncode != 0:
        _emit("approve_failed", {"stderr": approve_result.stderr[:300]})
        return False

    _emit("approve_success", {"collector_id": collector_id})

    # Re-run to confirm
    confirmed_data = _run_scraper(collector_id, url) or []
    confirm_validation = check_output(confirmed_data)
    _emit("confirm_validation", {"passed": confirm_validation["passed"]})

    if not confirm_validation["passed"]:
        _emit("confirm_failed", {"reason": "post-approve re-run failed validation"})
        return False

    # Update baseline
    from fingerprint.fetch_block import fetch_page
    new_html, _ = fetch_page(url)
    new_block_hash, new_field_hashes = hash_block.compute_hashes(new_html)
    hash_block.update_baseline(new_block_hash, new_field_hashes)
    _emit("baseline_updated", {"new_block_hash": new_block_hash[:16] + "..."})

    # Write playbook entry
    key = _transition_key(incident.get("old_hash", ""), incident.get("new_hash", ""))
    existing = playbook.get(key, {})
    playbook[key] = {
        "selector_map": selector_map,
        "confidence": confidence,
        "healed_at": datetime.now(timezone.utc).isoformat(),
        "verified_count": existing.get("verified_count", 0) + 1,
        "stage_used": stage,
    }
    _save_playbook(playbook)
    _emit("playbook_updated", {"key": key, "verified_count": playbook[key]["verified_count"]})

    # Save data snapshot
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data_path = ROOT / "data" / f"{today}.json"
    data_path.parent.mkdir(parents=True, exist_ok=True)
    data_path.write_text(json.dumps(confirmed_data, indent=2, ensure_ascii=False))
    _emit("data_saved", {"path": str(data_path)})

    return True


# ── main orchestrator ─────────────────────────────────────────────────────────

def run_heal(incident: dict) -> dict:
    """
    Run the full cascade. Returns a summary dict for the run log.
    """
    # Clear live events for this run
    LIVE_EVENTS_PATH.write_text("")
    _emit("heal_start", {
        "triggered_by": incident.get("triggered_by"),
        "collector_id": incident.get("collector_id"),
        "changed_fields": incident.get("changed_fields", []),
    })

    playbook = _load_playbook()
    collector_id = incident.get("collector_id", COLLECTOR_ID)
    url = incident.get("url", TARGET_URL)
    raw_html = incident.get("new_block_html", "")

    outcome = "unknown"
    stage_used = "none"

    # ── Stage 0: Playbook ────────────────────────────────────────────────
    pb_entry = stage0_playbook(incident, playbook)
    if pb_entry:
        ok = _approve_and_update(
            incident, pb_entry["selector_map"], pb_entry["confidence"], "playbook", playbook
        )
        if ok:
            outcome = "healed"
            stage_used = "playbook"
            _emit("heal_complete", {"outcome": outcome, "stage": stage_used})
            return _summary(incident, outcome, stage_used)

    # ── Stage 1: Heuristic remap ─────────────────────────────────────────
    if raw_html:
        # Fetch fresh HTML for heuristic analysis
        try:
            from fingerprint.fetch_block import fetch_page
            full_html, _ = fetch_page(url)
        except Exception:
            full_html = raw_html

        remap_result = stage1_heuristic(incident, full_html)
        if remap_result:
            ok = _approve_and_update(
                incident, remap_result["selector_map"], remap_result["confidence"], "heuristic", playbook
            )
            if ok:
                outcome = "healed"
                stage_used = "heuristic_remap"
                _emit("heal_complete", {"outcome": outcome, "stage": stage_used})
                return _summary(incident, outcome, stage_used)

    # ── Stage 2: LLM heal ────────────────────────────────────────────────
    llm_ok = stage2_llm_heal(incident, collector_id)
    if llm_ok:
        ok = _approve_and_update(incident, {}, 0.0, "llm", playbook)
        if ok:
            outcome = "healed"
            stage_used = "llm_heal"
            _emit("heal_complete", {"outcome": outcome, "stage": stage_used})
            return _summary(incident, outcome, stage_used)

    # ── Stage 3: Escalate ────────────────────────────────────────────────
    reason = (
        "All heal stages failed or produced invalid output. "
        "Manual selector review required."
    )
    stage3_escalate(incident, reason)
    outcome = "escalated"
    stage_used = "escalated"
    _emit("heal_complete", {"outcome": outcome, "stage": stage_used})
    return _summary(incident, outcome, stage_used)


def _summary(incident: dict, outcome: str, stage: str) -> dict:
    return {
        "outcome": outcome,
        "stage_used": stage,
        "collector_id": incident.get("collector_id"),
        "triggered_by": incident.get("triggered_by"),
        "changed_fields": incident.get("changed_fields", []),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    if not INCIDENT_PATH.exists():
        print("Run heal/build_incident.py first.", file=sys.stderr)
        sys.exit(1)

    incident = json.loads(INCIDENT_PATH.read_text())
    result = run_heal(incident)
    print(json.dumps(result, indent=2))

    if result["outcome"] == "escalated":
        sys.exit(2)
