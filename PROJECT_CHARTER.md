<!--
================================================================================
PROJECT CHARTER: Single Source of Truth (SSOT)
================================================================================
RULES (enforced by CI):
  1. Any project decision not in this file or governance/adrs/ does not exist.
  2. Charter changes require an ADR. Content changes need CHANGELOG + last_updated bump.
  3. No root build-spec or phase-*.md files (F-006). Prompts transient in workflow v4 only.
  4. Metadata block below is machine-read by scripts/check_charter_size.py. Cap: 200 lines.
================================================================================
-->

<!-- SSOT_METADATA_START
version: 0.3.0
status: active
last_updated: 2026-06-07
last_reviewed: 2026-06-07
owner: Rafael Braga
project_codename: metric_lineage_simulator
SSOT_METADATA_END -->

# Project Charter: Metric Lineage Simulator

> **Executive SSOT.** Read this first, then normative ADRs 0003–0008. Prompts only in
> [`tool_workflow_and_prompts_v4.md`](tool_workflow_and_prompts_v4.md) (transient). Types in
> [`driver_tree_studio/src/schema/types.ts`](driver_tree_studio/src/schema/types.ts).

## 1. Quick Facts

| Field | Value |
|---|---|
| Product | Metric Driver-Tree Studio |
| Codename | `metric_lineage_simulator` |
| Owner | Rafael Braga |
| Path | A — single-player, rigorous, no crowdsourcing |
| Status | Phase 1 complete (35 vitest); Review Gate 1 pending |

## 2. Documentation Discipline

**Normative:** this charter + `governance/adrs/0003` through `0008`. **Forbidden at repo
root:** `metric_*_build_spec*.md`, `phase-*.md`, `prompts_addendum*.md`,
`tool_workflow_and_prompts_v3.md`. **Transient:** `tool_workflow_and_prompts_v4.md` (copy-paste
prompts only; not product authority). **Implementation types:** `driver_tree_studio/`.

Governance methodology: `CONTRIBUTING.md`, `governance/AUDIT_PROCEDURE.md`, `CLAUDE.md`.
Every session: `make session-start` → read `governance/SESSION_HANDOUT.md`.

## 3. Business Case

**Problem:** Metric tools blur definitional identities, declared elasticities, and untested
beliefs → false precision and casual causal language.

**Goal:** BRAGA portfolio asset — honest driver-tree studio as personal reference, project
template, and free interactive tool demonstrating measurement discipline.

**Positioning:** Separate what is true by definition, declared with uncertainty, and untested;
prioritize what to test — not an econometric oracle. Never say “causal” without a backing method.

**Flywheel:** topology → guesstimate → propagate (VoI) → prioritize → test → update (ADR-0004).

**Three edges:** `identity` (locked formula) | `modeled` (elasticity + form) | `hypothesized`
(topology only). Guesstimate = modeled + `elasticity_distribution`, not a fourth kind.

## 4. Phase Roadmap

| Phase | Tool | Deliverable | Status |
|---|---|---|---|
| 0 | Claude Artifacts | Visual demo, honesty layer | Partial (`driver-tree-studio.tsx`) |
| 1 | Claude Code | `driver_tree_studio/` TS core + DTC seed | **Complete** |
| — | Review Gate 1 | Artifact + vitest + validate + reconciliation | Pending |
| — | Figma MCP | Design tokens, canvas ref | Pending |
| 2 | Cursor | Next.js + React Flow + funnel + verbal builder | Pending |
| 3a/b | Code + Cursor | BYOD data test, MC worker + UI | Pending |
| 4 | Cursor | SEO, share URLs, BRAGA launch | Pending |
| 5 | Code + Cursor | Guesstimate + VoI + prioritize UI | Pending |

**Tool constraints:** Claude Code never writes React; Artifacts are throwaway; Cursor after
Gate 1 + design ref (workflow v4 §0).

## 5. Current Gate (Phase 1 + Gate 1)

| Criterion | Verification |
|---|---|
| Engine matches ADR-0006 | `driver_tree_studio/src/engine/` |
| Validation ADR-0005 | `tests/schema/validate.test.ts`, `dtc_seed.test.ts` |
| Full Phase 1 matrix ADR-0007 | `cd driver_tree_studio && npx vitest run` (35 tests) |
| Governance | `make verify` |

Stop after Gate 1 human review before Phase 2 UI (ADR-0007).

## 6. Out of Scope / Limitations

- No production UI before Gate 1. No VoI/Guesstimate UI before Phase 5.
- Illustrative DTC numbers until defended authoring pass (public BRAGA link gated Phase 4).
- Phase 0 TSX prototype coexists until F-002 resolved.
- `recommend.ts` guardrails: simplified below-baseline check (Phase 1).

## 7. Normative ADR Index (read for detail)

| ADR | Purpose |
|---|---|
| [0003](governance/adrs/0003-documentation-consolidation.md) | Consolidation policy; supersession; deleted files |
| [0004](governance/adrs/0004-product-model-and-positioning.md) | Positioning, flywheel, edges, marketing invariants |
| [0005](governance/adrs/0005-schema-and-validation.md) | Schema conventions; validate() rule order |
| [0006](governance/adrs/0006-engine-and-formula.md) | Engine modules, applyForm, MC, formula parser |
| [0007](governance/adrs/0007-phase-1-implementation.md) | Phase 1 layout, DTC seed, tests, verification |
| [0008](governance/adrs/0008-phases-2-through-5.md) | Phases 2–5, BYOD test, funnel, open decisions |

Superseded: ADR-0001, ADR-0002 → see ADR-0003.

## 8. Governance Index

| Document | Location |
|---|---|
| Methodology | `governance/AUDIT_PROCEDURE.md` |
| Agent protocol | `CLAUDE.md` |
| Contributor rules | `CONTRIBUTING.md` |
| Findings queue | `governance/findings/` |
| Change log | `governance/CHANGELOG.md` |
| Prompts (transient) | `tool_workflow_and_prompts_v4.md` |

<!-- END OF SSOT. Any content below this line is a violation. -->
