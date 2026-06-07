<!--
================================================================================
PROJECT CHARTER: Single Source of Truth (SSOT)
================================================================================
RULES (enforced by CI):
  1. Any project decision not in this file or governance/adrs/ does not exist.
  2. Charter changes require an ADR. Content changes need CHANGELOG + last_updated bump.
  3. No parallel Charter.md, Requirements.md, SRS.md, or root build-spec files.
  4. Metadata block below is machine-read by scripts/check_charter_size.py. Cap: 200 lines.
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

> **Executive SSOT.** Normative detail lives in `governance/adrs/` (not root spec files).
> Read §7 ADR index after this charter. Prompts may live in a transient workflow doc.

## 1. Quick Facts

| Field | Value |
|---|---|
| Project codename | `{PROJECT_SLUG}` |
| Owner | {PROJECT_OWNER} |
| Primary goal | {PROJECT_GOAL} |
| Status | bootstrapping |

## 2. Documentation Discipline

No root `metric_*_build_spec*.md`, `phase-*.md`, or parallel requirements docs. State
decisions in this charter or ADRs. Scope changes need ADRs. Bump `last_updated` and
`governance/CHANGELOG.md` on edits. Full rules: `CONTRIBUTING.md`, `AUDIT_PROCEDURE.md`.

## 3. Business Case

### 3.1 Problem Statement

<!-- 2–4 sentences -->

### 3.2 Project Goal

<!-- One sentence for current phase gate -->

### 3.3 Product principles

<!-- Edge kinds, positioning, flywheel — or pointer to ADR-0004 equivalent -->

### 3.4 Success Criteria

| Criterion | Measurement | Verification |
|---|---|---|
| <!-- row --> | | |

### 3.5 Stakeholders

| Stakeholder | Role | Engagement |
|---|---|---|
| {PROJECT_OWNER} | Owner | Daily |

### 3.6 Out of Scope

<!-- Phase locks -->

### 3.7 Known Limitations

<!-- Accepted constraints -->

## 4. Phase Roadmap

<!-- Table: Phase | Tool | Deliverable | Status -->

## 5. Normative ADR Index

| ADR | Purpose |
|---|---|
| 0003 | Documentation consolidation policy |
| 0004 | Product model and positioning |
| 0005 | Schema and validation |
| 0006 | Engine and formula parser |
| 0007 | Phase 1 implementation |
| 0008 | Phases 2–5 |

Add project ADRs under `governance/adrs/`; list every normative ADR here.

## 6. Governance Index

| Document | Location |
|---|---|
| Methodology | `governance/AUDIT_PROCEDURE.md` |
| Agent protocol | `CLAUDE.md` |
| Contributor rules | `CONTRIBUTING.md` |
| ADRs | `governance/adrs/` |
| Change log | `governance/CHANGELOG.md` |

<!-- END OF SSOT. Any content below this line is a violation. -->
