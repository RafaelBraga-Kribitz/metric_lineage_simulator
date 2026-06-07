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
forbidden. Cap at 200 lines.
================================================================================
-->

<!-- SSOT_METADATA_START
version: 0.1.0
status: active
last_updated: 2026-06-07
last_reviewed: 2026-06-07
owner: Rafael Braga
project_codename: metric_lineage_simulator
SSOT_METADATA_END -->

# Project Charter: Metric Lineage Simulator

> **This is the Single Source of Truth (SSOT).** If you are looking for what
> the project is, what it does, what it does not do, or why a decision was
> made, **the answer is here or in [`governance/adrs/`](./governance/adrs/).**
> Nowhere else. CI enforces this discipline.

## 1. Quick Facts

| Field | Value |
|---|---|
| Project codename | `metric_lineage_simulator` |
| Owner | Rafael Braga |
| Primary goal | Typed driver-tree engine for metric lineage, validation, and what-if simulation |
| Status | Phase 1 core complete; UI deferred |

## 2. Documentation Discipline

This file is the SSOT. No parallel requirements, spec, or design documents.
State it once, link everywhere else. Every scope change needs an ADR in
`governance/adrs/`. Every content change needs a `governance/CHANGELOG.md`
entry and a `last_updated` bump.

Full rules: `CONTRIBUTING.md` and `governance/AUDIT_PROCEDURE.md`.

## 3. Business Case

### 3.1 Problem Statement

Marketing and analytics teams model metrics as driver trees, but most tools blur three things that must stay separate: relationships true by definition (`identity`), declared behavioral effects with explicit uncertainty (`modeled`), and directional beliefs not yet tested (`hypothesized`). That blur produces false precision, weak test prioritization, and casual causal language. This project gives a typed, validated engine and seed models that enforce the distinction before any UI ships.

### 3.2 Project Goal

Deliver a strict-mode TypeScript driver-tree core (schema, validation, compute, what-if, sensitivity, Monte Carlo, recommender) with vitest coverage and a reconciled DTC seed — no React or Vite in Phase 1.

### 3.3 Success Criteria

The project succeeds if **all** of these are true at completion:

| Criterion | Measurement | Verification |
|---|---|---|
| Typed core matches spec v4 | Schema, engine, formula parser, DTC seed | `driver_tree_studio/` source + `metric_driver_tree_studio_build_spec_v4.md` |
| Validation gate | DTC seed passes all validate rules incl. reconciliation | `npm test` in `driver_tree_studio/`; `validate.test.ts`, `dtc_seed.test.ts` |
| Phase 1 test suite | All engine/lib/schema/content tests green | `npx vitest run` in `driver_tree_studio/` |
| Governance closure | Open Phase 1 findings closed with passing scripts | `make verify` |

### 3.4 Stakeholders

| Stakeholder | Role | Engagement |
|---|---|---|
| Rafael Braga | Owner | Daily |

### 3.5 Out of Scope

- React components, Vite, or any UI (Phase 2+).
- Value-of-Information panel and experimentation flywheel UI (later phases).
- Additional business-model seeds beyond DTC ecommerce in Phase 1.
- Backend, crowdsourcing, or community layers (Path A: single-player rigorous tool per spec v4).
- Calling relationships "causal" without an experiment backing the claim.

### 3.6 Known Limitations

- Phase 1 guardrail checks use a simplified "below baseline" rule; richer direction metadata comes later.
- Hypothesized edges are topology-only; they never enter compute until promoted via ADR + evidence.
- Only `metric_driver_tree_studio_build_spec_v4.md` is authoritative for implementation detail; older v2/v3 specs are historical until superseded by ADR.

## 4. Documentation Index

| Document | Purpose | Location |
|---|---|---|
| Methodology | Three roles, finding lifecycle | `governance/AUDIT_PROCEDURE.md` |
| Agent Protocol | LLM session contract | `CLAUDE.md` |
| Contributor Rules | Standards, PR rules | `CONTRIBUTING.md` |
| ADRs | Append-only decision log | `governance/adrs/` |
| Change Log | Version history | `governance/CHANGELOG.md` |

<!-- END OF SSOT. Any content below this line is a violation. -->
