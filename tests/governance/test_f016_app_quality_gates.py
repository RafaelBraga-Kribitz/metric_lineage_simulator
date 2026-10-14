"""F-016: the studio app is gated by typecheck, lint, coverage, build and an e2e smoke test."""

from __future__ import annotations

import re

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-016"
STUDIO = REPO_ROOT / "driver_tree_studio"
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "governance.yml"
CI_STEPS = ("npm run typecheck", "npm run lint", "npm run coverage", "npm run build", "npm run e2e")


def _read(path) -> str:
    return path.read_text() if path.is_file() else ""


def _config_gaps() -> list[str]:
    gaps = []
    eslint = _read(STUDIO / "eslint.config.mjs")
    if "Raw hex color" not in eslint:
        gaps.append("eslint raw-hex rule missing")
    if "no-restricted-imports" not in eslint:
        gaps.append("eslint engine-import rule missing")
    if 'output: "export"' not in _read(STUDIO / "next.config.mjs"):
        gaps.append("next.config.mjs is not a static export")
    if "next/font/google" in _read(STUDIO / "app" / "layout.tsx"):
        gaps.append("layout.tsx fetches Google Fonts at build time")
    if not list((STUDIO / "e2e").glob("*.spec.ts")):
        gaps.append("no Playwright spec in driver_tree_studio/e2e")
    return gaps


def _hex_gaps() -> list[str]:
    pattern = re.compile(r"#[0-9a-fA-F]{3,8}\b")
    files = list((STUDIO / "src" / "components").rglob("*.tsx")) + list((STUDIO / "app").glob("*.tsx"))
    return [f"raw hex in {p.relative_to(STUDIO)}" for p in files if pattern.search(p.read_text())]


def test_app_quality_gates() -> None:
    ci = _read(WORKFLOW)
    gaps = _config_gaps() + _hex_gaps()
    gaps += [f"CI missing step '{step}'" for step in CI_STEPS if step not in ci]
    ratchet(FINDING, not gaps, "; ".join(gaps))
