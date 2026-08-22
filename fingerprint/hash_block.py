"""
fingerprint/hash_block.py
-------------------------
SHA-256 hashes the canonical block string and per-field canonical strings.
Compares against fingerprint/baseline.json.

On first run: writes baseline.json and exits cleanly (nothing to detect yet).
On subsequent runs: returns a ChangeReport indicating which fields changed.

Outputs:
  fingerprint/baseline.json  — written/updated here
  stdout: JSON ChangeReport  (for pipeline consumption)
"""

import hashlib
import json
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

BASELINE_PATH = Path(__file__).parent / "baseline.json"
RAW_PATH = Path(__file__).parent / "raw_page.json"

# Import normalize from the same package
sys.path.insert(0, str(Path(__file__).parent))
from normalize import normalize_block  # noqa: E402


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@dataclass
class ChangeReport:
    first_run: bool = False
    block_changed: bool = False
    old_block_hash: str = ""
    new_block_hash: str = ""
    changed_fields: list[str] = field(default_factory=list)
    field_hashes: dict = field(default_factory=dict)   # field → {old, new, changed}
    timestamp: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


def compute_hashes(html: str) -> tuple[str, dict[str, str]]:
    """Returns (block_hash, {field: hash})."""
    result = normalize_block(html)
    block_hash = sha256(result.block_canonical)
    field_hashes = {f: sha256(canon) for f, canon in result.per_field.items()}
    return block_hash, field_hashes


def load_baseline() -> dict | None:
    if BASELINE_PATH.exists():
        try:
            data = json.loads(BASELINE_PATH.read_text())
            if data.get("block_hash"):
                return data
        except Exception:
            pass
    return None


def write_baseline(block_hash: str, field_hashes: dict[str, str], timestamp: str) -> None:
    baseline = {
        "block_hash": block_hash,
        "field_hashes": field_hashes,
        "last_verified": timestamp,
        "selector_path": "table#hnmain",
    }
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    BASELINE_PATH.write_text(json.dumps(baseline, indent=2))
    print(f"[hash_block] Baseline written to {BASELINE_PATH}", file=sys.stderr)


def compare(html: str) -> ChangeReport:
    timestamp = datetime.now(timezone.utc).isoformat()
    new_block_hash, new_field_hashes = compute_hashes(html)

    baseline = load_baseline()
    if baseline is None or "--init" in sys.argv:
        # First run — write baseline, nothing to detect yet
        write_baseline(new_block_hash, new_field_hashes, timestamp)
        print(
            "[hash_block] First run — baseline established. Re-run tomorrow to detect changes.",
            file=sys.stderr,
        )
        return ChangeReport(first_run=True, new_block_hash=new_block_hash, timestamp=timestamp)

    old_block_hash = baseline.get("block_hash", "")
    old_field_hashes = baseline.get("field_hashes", {})

    block_changed = new_block_hash != old_block_hash

    changed_fields = []
    field_detail = {}
    all_fields = set(old_field_hashes) | set(new_field_hashes)
    for f in all_fields:
        old_h = old_field_hashes.get(f, "")
        new_h = new_field_hashes.get(f, "")
        changed = old_h != new_h
        if changed:
            changed_fields.append(f)
        field_detail[f] = {"old": old_h, "new": new_h, "changed": changed}

    report = ChangeReport(
        first_run=False,
        block_changed=block_changed,
        old_block_hash=old_block_hash,
        new_block_hash=new_block_hash,
        changed_fields=changed_fields,
        field_hashes=field_detail,
        timestamp=timestamp,
    )

    if block_changed or changed_fields:
        print(
            f"[hash_block] MISMATCH — block_changed={block_changed}, "
            f"changed_fields={changed_fields}",
            file=sys.stderr,
        )
    else:
        print("[hash_block] Hashes match — no structural change detected.", file=sys.stderr)

    return report


def update_baseline(new_block_hash: str, new_field_hashes: dict[str, str]) -> None:
    """Called by heal_agent after a successful heal to commit the new baseline."""
    timestamp = datetime.now(timezone.utc).isoformat()
    write_baseline(new_block_hash, new_field_hashes, timestamp)


if __name__ == "__main__":
    if not RAW_PATH.exists():
        print("Run fetch_block.py first to populate fingerprint/raw_page.json", file=sys.stderr)
        sys.exit(1)

    raw = json.loads(RAW_PATH.read_text())
    report = compare(raw["html"])
    print(json.dumps(report.as_dict(), indent=2))

    # Exit code 1 if change detected (so CI step can branch on it)
    if not report.first_run and (report.block_changed or report.changed_fields):
        sys.exit(1)
