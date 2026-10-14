"""F-017: Phase 2 analysis surfaces exist and stay wired into the page."""

from __future__ import annotations

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-017"
STUDIO = REPO_ROOT / "driver_tree_studio"
REQUIRED_FILES = (
    "src/components/Analysis/TornadoChart.tsx",
    "src/components/Analysis/MonteCarloPanel.tsx",
    "src/components/Analysis/UntestedBeliefs.tsx",
    "src/workers/montecarlo.worker.ts",
    "tests/workers/montecarloProtocol.test.ts",
    "e2e/analysis.spec.ts",
)


def _read(rel: str) -> str:
    p = STUDIO / rel
    return p.read_text() if p.is_file() else ""


def _gaps() -> list[str]:
    gaps = [f"missing {f}" for f in REQUIRED_FILES if not (STUDIO / f).is_file()]
    page = _read("app/page.tsx")
    for comp in ("<AnalysisPanel", "<IllustrativeNotice"):
        if comp not in page:
            gaps.append(f"page.tsx does not render {comp}")
    if "var(--color-edge-${e.kind})" not in _read("src/components/Canvas/modelToFlow.ts"):
        gaps.append("edge markers do not inherit the edge colour")
    if "new Worker(" not in _read("src/hooks/useMonteCarlo.ts"):
        gaps.append("Monte Carlo does not run in a Web Worker")
    if "<GuessCaveat" not in _read("src/components/Analysis/MonteCarloPanel.tsx"):
        gaps.append("Monte Carlo panel lacks the GUESS caveat")
    return gaps


def test_phase2_analysis_surfaces() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
