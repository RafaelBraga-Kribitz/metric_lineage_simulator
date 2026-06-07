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
version: 0.1.0
status: active
last_updated: 2026-01-01
last_reviewed: 2026-01-01
owner: {PROJECT_OWNER}
project_codename: {PROJECT_SLUG}
SSOT_METADATA_END -->

# Project Charter: {PROJECT_TITLE}

> **This is the Single Source of Truth (SSOT).** Goals, scope, phase status, and
> which spec is authoritative live here or in [`governance/adrs/`](./governance/adrs/).
> Detailed contracts stay in indexed documents (§4).

## 1. Quick Facts

| Field | Value |
|---|---|
| Project codename | `{PROJECT_SLUG}` |
| Owner | {PROJECT_OWNER} |
| Primary goal | {PROJECT_GOAL} |
| Authoritative build spec | `metric_driver_tree_studio_build_spec_v4.md` |
| Authoritative workflow | `tool_workflow_and_prompts_v4.md` |
| Status | <!-- e.g. Phase 1 core complete; Gate 1 pending --> |

## 2. Documentation Discipline

This file is the SSOT **index and decision record**, not a paste of every spec.
State decisions once; link to contracts. Every scope change needs an ADR in
`governance/adrs/`. Every content change needs a `governance/CHANGELOG.md`
entry and a `last_updated` bump.

Full rules: `CONTRIBUTING.md` and `governance/AUDIT_PROCEDURE.md`.

**Supersession rule:** When a build spec version is superseded, record it in
an ADR. Older specs remain as historical lineage only; implementation follows
the authoritative version named in §1.

## 3. Business Case

### 3.1 Problem Statement

<!-- 2–4 sentences. Who has the problem and why existing tools fail.
     Example arc: metric tools blur definitional identities, declared
     elasticities, and untested beliefs → false precision and weak test
     prioritization. -->

### 3.2 Project Goal

<!-- One sentence for the current phase gate, not the entire multi-year vision.
     Example: typed TS core + reconciled DTC seed + vitest, no UI (Phase 1). -->

### 3.3 Spec lineage (how we got here)

Capture supersession so agents do not re-derive from chat. One row per major
spec revision; link files in §4.

| Version | Focus | Key change from prior |
|---|---|---|
| v2 (`metric_lineage_simulator_build_spec_v2.md`) | Lineage simulator | Two edge kinds (`identity`, `assumed`); 3–5 model library scope |
| v3 (`metric_driver_tree_studio_build_spec_v3.md`) | Driver-Tree Studio | Three kinds (`identity`, `modeled`, `hypothesized`); Path A single-player; one DTC seed |
| v4 (`metric_driver_tree_studio_build_spec_v4.md`) | **Authoritative** | Experimentation Flywheel; Guesstimate = `modeled` + elasticity distribution; functional forms |

Positioning (from v4): separate what is true by definition, declared with
uncertainty, and untested; prioritize what to measure — not an econometric
oracle. Do not use "causal" without a backing method.

### 3.4 Delivery phases (tool workflow)

Phases from `tool_workflow_and_prompts_v4.md`. Update **Status** as work advances.

| Phase | Tool | Deliverable | Status |
|---|---|---|---|
| 0 | Claude Artifacts | Visual demo; three edge encodings; honesty layer | <!-- done / partial --> |
| 1 | Claude Code | `driver_tree_studio/` TS core + tests + DTC JSON | <!-- done / in progress --> |
| — | Review Gate 1 | Artifact + vitest + validate + reconciliation | <!-- pending --> |
| — | Figma MCP | Design tokens, canvas reference frames | <!-- pending --> |
| 2 | Cursor | Next.js + React Flow; canvas ↔ model sync | <!-- pending --> |
| 3a | Claude Code | Data-test engine, MC worker, extra models | <!-- pending --> |
| 3b | Cursor | Data-test UI, Monte Carlo panel | <!-- pending --> |
| 4 | Cursor | SEO, shareable URLs, BRAGA brand | <!-- pending --> |
| 5 | Claude Code + Cursor | Experimentation Flywheel (Guesstimate, prioritize, test loop) | <!-- pending --> |

Hard constraints (workflow §0): Claude Code never writes React; Artifacts never
ship to production; Cursor starts after Phase 1 tests pass and design ref exists.

### 3.5 Success Criteria

The **current phase** succeeds when all rows pass:

| Criterion | Measurement | Verification |
|---|---|---|
| <!-- phase-specific --> | <!-- how measured --> | <!-- script / test path --> |

### 3.6 Stakeholders

| Stakeholder | Role | Engagement |
|---|---|---|
| {PROJECT_OWNER} | Owner | Daily |

### 3.7 Out of Scope

<!-- Phase-specific locks. Example: no UI in Phase 1; no crowdsourcing (Path A);
     no "causal" claims without experiments; flywheel UI deferred to Phase 5. -->

### 3.8 Known Limitations

<!-- Accepted at current phase. Example: illustrative seed numbers until
     authoring pass; guardrail direction simplified in Phase 1 recommend.ts. -->

## 4. Documentation Index

Every root-level spec and workflow file **must** appear here (CI finding F-001).

| Document | Purpose | Location |
|---|---|---|
| Build spec v2 (historical) | Two-edge lineage simulator origin | `metric_lineage_simulator_build_spec_v2.md` |
| Build spec v3 (historical) | Three-edge studio; supersedes v2 | `metric_driver_tree_studio_build_spec_v3.md` |
| Build spec v4 (**authoritative**) | Engine contract + flywheel | `metric_driver_tree_studio_build_spec_v4.md` |
| Tool workflow v4 (**authoritative**) | Phases, gates, prompts, tool roles | `tool_workflow_and_prompts_v4.md` |
| Tool workflow v3 (historical) | Superseded by v4 | `tool_workflow_and_prompts_v3.md` |
| Prompts addendum v4 (historical) | Merged into workflow v4 | `prompts_addendum_v4.md` |
| Phase handoff | Implementation checklist for current phase | `phase-1_Metric_Driver-Tree_Studio.md` |
| Phase 0 artifact | Throwaway React demo (not production) | `driver-tree-studio.tsx` |
| Methodology | Steward / Remediator / Adversary | `governance/AUDIT_PROCEDURE.md` |
| Agent protocol | Session-start contract | `CLAUDE.md` |
| Contributor rules | PR + finding workflow | `CONTRIBUTING.md` |
| ADRs | Append-only decision log | `governance/adrs/` |
| Change log | Version history | `governance/CHANGELOG.md` |

<!-- END OF SSOT. Any content below this line is a violation. -->
