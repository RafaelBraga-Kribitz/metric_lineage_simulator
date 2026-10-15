"""F-020: share URL, embed route, metadata and static deploy config stay in place."""

from __future__ import annotations

import json

from _ratchet import REPO_ROOT, ratchet

FINDING = "F-020"
STUDIO = REPO_ROOT / "driver_tree_studio"


def _read(rel: str) -> str:
    p = STUDIO / rel
    return p.read_text() if p.is_file() else ""


def _gaps() -> list[str]:
    gaps = []
    share = _read("src/lib/shareState.ts")
    for needle in ('SHARE_VERSION = "v1"', "MAX_ENCODED_CHARS", "MAX_DECODED_BYTES", "isBusinessModel"):
        if needle not in share:
            gaps.append(f"shareState.ts lacks {needle}")
    if "index: false" not in _read("app/embed/layout.tsx"):
        gaps.append("embed route missing or indexable")
    if "openGraph" not in _read("app/layout.tsx") or not (STUDIO / "public" / "og.png").is_file():
        gaps.append("Open Graph metadata or og.png missing")
    vercel = json.loads(_read("vercel.json") or "{}")
    if vercel.get("outputDirectory") != "out":
        gaps.append("vercel.json does not serve the static export")
    if not (STUDIO / "e2e" / "share.spec.ts").is_file():
        gaps.append("e2e share spec missing")
    return gaps


def test_share_embed_launch_polish() -> None:
    gaps = _gaps()
    ratchet(FINDING, not gaps, "; ".join(gaps))
