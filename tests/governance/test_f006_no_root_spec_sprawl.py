"""F-006: No root spec sprawl; charter lists normative ADRs 0003-0008."""

from __future__ import annotations

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-006"

FORBIDDEN_GLOBS = (
    "metric_*_build_spec*.md",
    "phase-*.md",
    "prompts_addendum*.md",
    "tool_workflow_and_prompts_v3.md",
)

REQUIRED_ADRS = tuple(f"000{i}" for i in range(3, 9))

STALE_SPEC_NAMES = (
    "metric_lineage_simulator_build_spec_v2.md",
    "metric_driver_tree_studio_build_spec_v3.md",
    "metric_driver_tree_studio_build_spec_v4.md",
    "phase-1_Metric_Driver-Tree_Studio.md",
)


def _forbidden_files() -> list[str]:
    found: list[str] = []
    for pattern in FORBIDDEN_GLOBS:
        for p in REPO_ROOT.glob(pattern):
            if p.is_file():
                found.append(p.name)
    return sorted(set(found))


def _charter_gaps(charter: str) -> list[str]:
    gaps: list[str] = []
    missing_adrs = [adr for adr in REQUIRED_ADRS if adr not in charter]
    if missing_adrs:
        gaps.append(f"charter missing ADR refs: {missing_adrs}")
    stale_refs = [name for name in STALE_SPEC_NAMES if name in charter]
    if stale_refs:
        gaps.append(f"charter stale spec refs: {stale_refs}")
    if "authoritative build spec" in charter.lower():
        gaps.append("charter still claims external build spec authority")
    return gaps


def test_no_root_spec_sprawl_and_charter_complete() -> None:
    charter = (REPO_ROOT / "PROJECT_CHARTER.md").read_text()
    forbidden = _forbidden_files()
    gaps = _charter_gaps(charter)
    if forbidden:
        gaps.append(f"forbidden files remain: {', '.join(forbidden)}")
    fixed = len(gaps) == 0
    ratchet(FINDING, fixed, "; ".join(gaps) or "consolidation incomplete")
