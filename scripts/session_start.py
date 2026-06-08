"""Write governance/SESSION_HANDOUT.md from AUDIT_STATE.json.

The handout is what the next agent reads first. It must give a complete picture
of where work stands without requiring the agent to traverse YAML files
manually.
"""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = REPO_ROOT / "governance" / "AUDIT_STATE.json"
HANDOUT_PATH = REPO_ROOT / "governance" / "SESSION_HANDOUT.md"
SESSION_END_PATH = REPO_ROOT / "governance" / "SESSION_END.md"
DEBT_PATH = REPO_ROOT / "governance" / "DEBT_BASELINE.json"


def _debt_missing_section(lines: list[str]) -> None:
    lines.append("## Technical debt")
    lines.append("")
    lines.append(
        "No `governance/DEBT_BASELINE.json` yet. Run `make debt-scan` to "
        "establish a baseline the ratchet can hold."
    )
    lines.append("")


def _append_debt_hotspots(lines: list[str], measured: dict) -> None:
    nonzero = {k: v["value"] for k, v in measured.items() if v.get("value")}
    if nonzero:
        lines.append("Current hotspots (candidates for the next remediation finding):")
        lines.append("")
        for name, value in sorted(nonzero.items(), key=lambda kv: -float(kv[1])):
            lines.append(f"- `{name}`: {value}")
        lines.append("")
        return
    lines.append("All measured debt metrics are at zero.")
    lines.append("")


def _append_debt_skipped_tools(lines: list[str], metrics: dict) -> None:
    skipped = sorted({v.get("tool") for v in metrics.values() if not v.get("available")})
    if not skipped:
        return
    lines.append(
        f"Unmeasured (tool not installed): {', '.join(skipped)} — "
        "see `governance/DEBT_TOOLS.md` to widen coverage."
    )
    lines.append("")


def _debt_baseline_section(lines: list[str], debt: dict) -> None:
    metrics = debt.get("metrics", {})
    measured = {k: v for k, v in metrics.items() if v.get("available")}

    lines.append("## Technical debt (baseline)")
    lines.append("")
    lines.append(
        f"Languages: {', '.join(debt.get('languages', [])) or 'none'} · "
        f"baseline written {debt.get('generated_at', 'unknown')[:10]}. "
        "The ratchet (`make debt-check`) fails any PR where these grow."
    )
    lines.append("")
    _append_debt_hotspots(lines, measured)
    _append_debt_skipped_tools(lines, metrics)


def _append_debt_section(lines: list[str]) -> None:
    if not DEBT_PATH.exists():
        _debt_missing_section(lines)
        return
    try:
        debt = json.loads(DEBT_PATH.read_text())
    except json.JSONDecodeError:
        return
    _debt_baseline_section(lines, debt)


def _append_snapshot(lines: list[str], summary: dict) -> None:
    lines.append("## Snapshot")
    lines.append("")
    lines.append(
        f"- Findings: total={summary['findings_total']}, "
        f"open={summary['findings_open']}, "
        f"in_progress={summary['findings_in_progress']}, "
        f"closed={summary['findings_closed']}, "
        f"historical={summary['findings_closed_historical']}"
    )
    lines.append(
        f"- Migrations: total={summary['migrations_total']}, "
        f"in_progress={summary['migrations_in_progress']}"
    )
    lines.append("")


def _append_open_by_category(lines: list[str], summary: dict) -> None:
    if not summary.get("open_by_category"):
        return
    lines.append("## Open by category")
    lines.append("")
    for cat, n in sorted(summary["open_by_category"].items()):
        lines.append(f"- `{cat}`: {n}")
    lines.append("")


def _append_in_progress(lines: list[str], findings: list[dict]) -> None:
    in_progress = [f for f in findings if f["status"] == "in_progress"]
    if not in_progress:
        return
    lines.append("## In progress")
    lines.append("")
    for f in in_progress:
        lines.append(f"- **{f['id']}** — {f['title']} (`{f['path']}`)")
    lines.append("")


def _append_open_queue(lines: list[str], open_findings: list[dict]) -> None:
    if open_findings:
        lines.append("## Open findings (work queue)")
        lines.append("")
        for f in open_findings:
            lines.append(f"- **{f['id']}** ({f['category']}) — {f['title']}")
            lines.append(f"  - YAML: `{f['path']}`")
            if f.get("verification_script"):
                lines.append(f"  - Verification: `{f['verification_script']}`")
            else:
                lines.append("  - Verification: **TODO — write the script first**")
        lines.append("")
        recommended = open_findings[0]
        lines.append("## Recommended next action")
        lines.append("")
        lines.append(f"Pick up **{recommended['id']}** — {recommended['title']}.")
        lines.append("")
        return

    lines.append("## Open findings")
    lines.append("")
    lines.append("None. The queue is empty.")
    lines.append("")
    lines.append("## Recommended next action")
    lines.append("")
    lines.append(
        "No open findings. Either file new findings against newly discovered "
        "drift, work an `in_progress` finding to close, or hand off via "
        "`make session-end`."
    )
    lines.append("")


def _append_prior_handoff(lines: list[str]) -> None:
    if not SESSION_END_PATH.exists():
        return
    lines.append("## Prior session handoff")
    lines.append("")
    lines.append(f"See `{SESSION_END_PATH.relative_to(REPO_ROOT)}`.")
    lines.append("")


def _append_validation_errors(lines: list[str], state: dict) -> None:
    if not state.get("validation_errors"):
        return
    lines.append("## ⚠ Validation errors")
    lines.append("")
    for err in state["validation_errors"]:
        lines.append(f"- {err}")
    lines.append("")


def main() -> int:
    if not STATE_PATH.exists():
        print(f"[session_start] {STATE_PATH} missing — run `make audit` first", file=sys.stderr)
        return 1
    state = json.loads(STATE_PATH.read_text())
    summary = state["summary"]
    findings = state["findings"]

    open_findings = [f for f in findings if f["status"] == "open"]
    open_findings.sort(key=lambda f: (f.get("category") or "", f.get("id") or ""))

    lines: list[str] = []
    lines.append(f"# Session Handout — {datetime.now(UTC).strftime('%Y-%m-%d')}")
    lines.append("")
    lines.append(
        f"Generated by `make session-start` from `{STATE_PATH.relative_to(REPO_ROOT)}` "
        f"(state SHA: `{state.get('git_head_sha', 'unknown')[:8]}`)."
    )
    lines.append("")

    _append_snapshot(lines, summary)
    _append_open_by_category(lines, summary)
    _append_in_progress(lines, findings)
    _append_open_queue(lines, open_findings)
    _append_debt_section(lines)
    _append_prior_handoff(lines)
    _append_validation_errors(lines, state)

    HANDOUT_PATH.write_text("\n".join(lines))
    print(f"[session_start] wrote {HANDOUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
