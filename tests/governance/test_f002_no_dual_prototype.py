"""F-002: Root prototype must not coexist with extracted driver_tree_studio package."""

from __future__ import annotations

from pathlib import Path

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-002"

PROTOTYPE = REPO_ROOT / "driver-tree-studio.tsx"
PACKAGE = REPO_ROOT / "driver_tree_studio" / "src"


def test_no_dual_prototype() -> None:
    prototype_exists = PROTOTYPE.exists()
    package_exists = PACKAGE.is_dir()
    dual = prototype_exists and package_exists
    ratchet(
        FINDING,
        not dual,
        f"{PROTOTYPE.name} and {PACKAGE.relative_to(REPO_ROOT)}/ both present",
    )
