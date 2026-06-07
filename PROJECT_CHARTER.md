<!--
================================================================================
PROJECT CHARTER: Single Source of Truth (SSOT)
================================================================================
This document is the ONLY authoritative source for project goals, scope,
requirements, and design decisions.

RULES (enforced by CI):
  1. Any project decision that is not in this document or in governance/adrs/
     does not exist.
  2. Changes to anything in this file require a corresponding ADR entry.
  3. README.md and code docstrings MAY summarize from this file but MUST link
     back here for authority.
  4. The metadata block below is machine-read by scripts/check_charter_size.py.

DO NOT create separate Charter.md, Requirements.md, SRS.md, etc. Sprawl is
forbidden. Cap at 200 lines. Index long specs in §4; do not paste them here.
================================================================================
-->

<!-- SSOT_METADATA_START
version: 0.2.0
status: active
last_updated: 2026-06-07
last_reviewed: 2026-06-07
owner: Rafael Braga
project_codename: metric_lineage_simulator
SSOT_METADATA_END -->

# Project Charter: Metric Lineage Simulator

> **This is the Single Source of Truth (SSOT).** Goals, phase status, and which
> spec is authoritative live here or in [`governance/adrs/`](./governance/adrs/).
> Engine and UI contracts stay in indexed documents (§4).

## 1. Quick Facts

| Field | Value |
|---|---|
| Project codename | `metric_lineage_simulator` |
| Owner | Rafael Braga |
| Primary goal | Honest driver-tree studio: definitional, declared, and untested edges separated |
| Authoritative build spec | `metric_driver_tree_studio_build_spec_v4.md` |
| Authoritative workflow | `tool_workflow_and_prompts_v4.md` |
| Status | Phase 1 core complete; Review Gate 1 pending |

## 2. Documentation Discipline

This file indexes decisions; it does not replace build spec v4 or workflow v4.
Every scope change needs an ADR. Every charter edit needs `governance/CHANGELOG.md`
and a `last_updated` bump. Superseded specs remain as historical lineage only.

Full rules: `CONTRIBUTING.md` and `governance/AUDIT_PROCEDURE.md`.

## 3. Business Case

### 3.1 Problem Statement

Marketing and analytics teams build metric driver trees, but most tools blur three
states that must stay distinct: relationships true by definition (`identity`),
declared behavioral effects with explicit uncertainty (`modeled`), and directional
beliefs not yet tested (`hypothesized`). That blur drives false precision, weak
test prioritization, and casual causal language — especially harmful for a
portfolio piece that must signal measurement discipline.

### 3.2 Project Goal

Ship the Metric Driver-Tree Studio as a BRAGA portfolio asset: a personal reference,
a template for rigorous projects, and a free interactive tool that drives traffic
by demonstrating honest metric design — starting with a provably correct TS core
before any production UI.

### 3.3 Spec lineage (how we got here)

| Version | Focus | Key change from prior |
|---|---|---|
| v2 (`metric_lineage_simulator_build_spec_v2.md`) | Lineage simulator | Two edge kinds (`identity`, `assumed`); 3–5 model library |
| v3 (`metric_driver_tree_studio_build_spec_v3.md`) | Driver-Tree Studio | Three kinds; Path A single-player; one DTC seed; evidence grades |
| v4 (**authoritative**) | Experimentation Flywheel | Guesstimate = `modeled` + distribution; functional forms; test loop |

Positioning (v4): separate definition, declared assumption, and untested belief;
make guesses explicit and uncertain; prioritize what to test — not an econometric
oracle. Never say "causal" without a method that backs it.

### 3.4 Delivery phases (tool workflow)

| Phase | Tool | Deliverable | Status |
|---|---|---|---|
| 0 | Claude Artifacts | Visual demo; three edge encodings; honesty layer | Partial (`driver-tree-studio.tsx`) |
| 1 | Claude Code | `driver_tree_studio/` TS core + tests + DTC JSON | **Complete** (35 vitest) |
| — | Review Gate 1 | Artifact + vitest + validate + reconciliation | Pending |
| — | Figma MCP | Design tokens, canvas reference | Pending |
| 2 | Cursor | Next.js + React Flow; canvas ↔ model sync | Pending |
| 3a | Claude Code | Data-test engine, MC worker, extra models | Pending |
| 3b | Cursor | Data-test UI, Monte Carlo panel | Pending |
| 4 | Cursor | SEO, shareable URLs, BRAGA brand | Pending |
| 5 | Code + Cursor | Experimentation Flywheel UI + prioritize loop | Pending |

Tool constraints: Claude Code never writes React; Artifacts are throwaway; Cursor
starts after Gate 1 and a Figma design ref.

### 3.5 Success Criteria (current: Phase 1 + Gate 1 prep)

| Criterion | Measurement | Verification |
|---|---|---|
| Typed core matches spec v4 | Schema, engine, parser, seed | `driver_tree_studio/` + build spec v4 |
| Validation + reconciliation | DTC seed rules + identity math | `validate.test.ts`, `dtc_seed.test.ts` |
| Test suite | All Phase 1 invariants | `npx vitest run` in `driver_tree_studio/` |
| Governance | Findings closed with scripts | `make verify` |

### 3.6 Stakeholders

| Stakeholder | Role | Engagement |
|---|---|---|
| Rafael Braga | Owner | Daily |

### 3.7 Out of Scope (now)

- Production UI before Gate 1 (Phase 2+).
- Crowdsourcing or community backend (Path A locked since v3).
- Public BRAGA link with illustrative-only evidence grades (Gate before Phase 4).
- Calling edges causal without experiment backing.
- Flywheel / Guesstimate UI before Phase 5 (engine hooks exist in v4 spec).

### 3.8 Known Limitations

- DTC seed numbers are illustrative until the one-week authoring pass (v3 gate).
- Phase 0 artifact and Phase 1 package coexist until F-002 resolves migration.
- `recommend.ts` guardrail check is simplified (below baseline only).
- Hypothesized edges are topology-only until promoted via ADR + evidence.

## 4. Documentation Index

| Document | Purpose | Location |
|---|---|---|
| Build spec v2 (historical) | Two-edge lineage simulator origin | `metric_lineage_simulator_build_spec_v2.md` |
| Build spec v3 (historical) | Three-edge studio; supersedes v2 | `metric_driver_tree_studio_build_spec_v3.md` |
| Build spec v4 (**authoritative**) | Engine contract + flywheel | `metric_driver_tree_studio_build_spec_v4.md` |
| Tool workflow v4 (**authoritative**) | Phases, gates, prompts, tool roles | `tool_workflow_and_prompts_v4.md` |
| Tool workflow v3 (historical) | Superseded by v4 | `tool_workflow_and_prompts_v3.md` |
| Prompts addendum v4 (historical) | Merged into workflow v4 | `prompts_addendum_v4.md` |
| Phase 1 handoff | Claude Code checklist (complete) | `phase-1_Metric_Driver-Tree_Studio.md` |
| Phase 0 artifact | Throwaway React demo | `driver-tree-studio.tsx` |
| Governance bootstrap kit | Reusable scaffolding templates | `governance-bootstrap/` |
| Methodology | Steward / Remediator / Adversary | `governance/AUDIT_PROCEDURE.md` |
| Agent protocol | Session-start contract | `CLAUDE.md` |
| Contributor rules | PR + finding workflow | `CONTRIBUTING.md` |
| ADRs | Append-only decision log | `governance/adrs/` |
| Change log | Version history | `governance/CHANGELOG.md` |

<!-- END OF SSOT. Any content below this line is a violation. -->
