"""F-007: Phase 2 UI invariants — node labels, formula leaf sync, reconciliation badge."""

from __future__ import annotations

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-007"
STUDIO = REPO_ROOT / "driver_tree_studio"


def _read(rel: str) -> str:
    path = STUDIO / rel
    if not path.is_file():
        return ""
    return path.read_text()


def _check_metric_node(gaps: list[str]) -> None:
    node = _read("src/components/Canvas/MetricNode.tsx")
    if "flex min-h-0 flex-1 items-center" not in node:
        gaps.append("MetricNode missing flex-1 name row (label clipping)")
    if "justify-between px-2 py-1.5" in node:
        gaps.append("MetricNode still uses justify-between layout")


def _check_page(gaps: list[str]) -> None:
    page = _read("app/page.tsx")
    if "setFormulaParentId" in page:
        gaps.append("page.tsx still sets formulaParentId on node select")
    if "onSelectNode={setSelectedNodeId}" not in page:
        gaps.append("page.tsx must wire onSelectNode to setSelectedNodeId only")


def _check_formula_field(gaps: list[str]) -> None:
    formula = _read("src/components/VerbalBuilder/FormulaField.tsx")
    if "defaultFormulaParent" not in formula:
        gaps.append("FormulaField missing defaultFormulaParent")
    if "setError(null)" not in formula or "activeParent, model.edges" not in formula:
        gaps.append("FormulaField must clear errors when syncing formula from model")
    if "Numeric literals are not supported" not in formula:
        gaps.append("FormulaField missing numeric-literal guard copy")


def _check_hook(gaps: list[str]) -> None:
    hook = _read("src/hooks/useMetricModel.ts")
    if "identityReconciled" not in hook or "validationWarnings" not in hook:
        gaps.append("useMetricModel must split identityReconciled and validationWarnings")
    if "[reconciliation]" not in hook:
        gaps.append("useMetricModel must filter [reconciliation] errors for badge")


def _check_header(gaps: list[str]) -> None:
    header = _read("src/components/AppHeader/AppHeader.tsx")
    if "validationWarnings" not in header:
        gaps.append("AppHeader must show validationWarnings separately")
    if "identityReconciled" not in header:
        gaps.append("AppHeader must use identityReconciled for badge")


def _all_checks() -> tuple[bool, str]:
    gaps: list[str] = []
    _check_metric_node(gaps)
    _check_page(gaps)
    _check_formula_field(gaps)
    _check_hook(gaps)
    _check_header(gaps)
    if gaps:
        return False, "; ".join(gaps)
    return True, "phase 2 UI invariants present"


def test_phase2_ui_invariants() -> None:
    fixed, gap = _all_checks()
    ratchet(FINDING, fixed, gap)
