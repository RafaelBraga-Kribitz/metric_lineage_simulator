# Governance Changelog

## 2026-06-08 — F-010 closed (knip unused exports)

- Trimmed dead UI exports in Canvas + shadcn components; added `driver_tree_studio/knip.json`.
- Baseline `knip_unused_exports=0`. F-011 (radon complexity) remains open.

## 2026-06-08 — F-009 closed (ruff unused); F-010/F-011 opened

- Filed F-009 (ruff_unused), F-010 (knip_unused_exports), F-011 (radon_complex_blocks) from debt baseline hotspots.
- F-009 closed: removed 11 unused imports/vars in `scripts/` and `tests/governance/`; baseline `ruff_unused=0`.
- F-010 and F-011 remain open (11 knip exports, 9 radon blocks above CC cap).

## 2026-06-08 — F-008 closed (tech-debt ratchet)

- Installed `scripts/debt_scan.py`, `scripts/check_debt_ratchet.py`, `governance/debt_config.yaml`.
- Added CI `tech-debt` job; `make verify` now runs debt ratchet.
- Baseline (`governance/DEBT_BASELINE.json`): ruff_unused=11, knip_unused_exports=11,
  radon_complex_blocks=9, jscpd_duplication_pct=0.0, vulture_dead_code=0, knip_unused_files=0.
- ADR-0009; `governance/DEBT_TOOLS.md`, `governance/CATEGORIES.md`; charter §8 index updated.

## 2026-06-07 — F-002 closed

- Relocated Phase 0 `driver-tree-studio.tsx` to `archive/phase-0/`; demo imports updated.
- Review Gate 1 approved; charter and ADR-0007 updated.

## 2026-06-07 — F-006 closed

- Deleted superseded root specs; SSOT is charter + ADRs 0003–0008 + transient workflow v4.

## 2026-06-07 — F-006 draft: charter + ADR consolidation

- ADRs 0003–0008 absorb build specs v2–v4 and Phase 1 handoff.
- Executive charter v0.3 (122 lines); F-001 → closed_historical; F-006 open until deletes.

## 2026-06-07 — F-001 closed

- Expanded `PROJECT_CHARTER.md` with spec lineage (v2→v3→v4), phase roadmap, full §4 index; ADR-0002.
- Updated `governance-bootstrap/templates/PROJECT_CHARTER.md` to same structure for future bootstraps.

## 2026-06-07 — F-005 closed

- Filled `PROJECT_CHARTER.md` §3 Business Case; ADR-0001 documents the change.

## 2026-06-07 — F-004 closed

- Added `montecarlo.test.ts` and `recommend.test.ts`; split MC leaf/edge RNG streams.

## 2026-06-07 — F-003 closed

- Fixed `parseFormula` addend/subtrahend mapping for `+`/`-` expressions.

## 2026-06-07 — Governance bootstrap (midflight)

- Installed governance scaffolding from `governance-bootstrap/` kit.
- Filed findings F-001 through F-005 (no fixes in bootstrap commit).
- Mode: midflight (~2980 LOC TypeScript, partial vitest suite, no CI yet).
