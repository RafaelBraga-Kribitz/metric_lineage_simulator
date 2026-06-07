"""F-004: Phase 1 spec requires montecarlo and recommend engine tests."""

from __future__ import annotations

from pathlib import Path

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-004"

REQUIRED = (
    "driver_tree_studio/tests/engine/montecarlo.test.ts",
    "driver_tree_studio/tests/engine/recommend.test.ts",
)


def test_phase1_engine_test_artifacts_exist() -> None:
    missing = [p for p in REQUIRED if not (REPO_ROOT / p).exists()]
    fixed = len(missing) == 0
    ratchet(FINDING, fixed, f"missing: {', '.join(missing)}")
