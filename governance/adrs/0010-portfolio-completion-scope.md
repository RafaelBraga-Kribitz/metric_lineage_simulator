---
id: 0010
title: "Portfolio-completion scope: thin vertical slice, Claude-authored UI, analyst-stack export"
status: proposed
date: 2026-10-14
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0010: Portfolio-completion scope (PROPOSALS)

> **Status: proposed.** Every decision below is a *proposal* recorded by the agent that
> finishes the product. The owner can reverse any of them by marking this ADR
> `superseded` and writing a successor. Until then the repository is built against them.

## Context

Phase 1 passed Review Gate 1 on 2026-06-07. A Phase 2 UI shell (React Flow canvas, three
edge components, lever panel, inspector, formula field) was merged on 2026-06-08 under
F-007, but charter §4 still lists Phase 2 as "pending", blocks it on a Figma design
reference, and says "Claude Code never writes React". The owner now uses Claude to finish
the whole product so it can be shown as a finished portfolio piece. The owner's portfolio
notes (17/09/2026) contain one project-specific entry: keep this repository private until
done. Nothing there changes product scope. The proposals below come from the owner's
portfolio rules and job-ad study (SQL, Power BI, KPIs/Kennzahlen, forecasting,
e-commerce/CRM and data quality are advertised most; A/B testing is a differentiator).

## Decision (proposals P1–P6)

**P1 — Thin vertical slice first.** Ship Phase 2 (canvas, funnel, what-if, tornado,
Monte Carlo panel, untested-beliefs list), Phase 3 (BYOD data test) and Phase 4 (share
URL, embed, metadata, static deploy config) on the single DTC model. Phase 5 engine
modules (`valueOfInformation.ts`, `prioritize.ts`) are built with tests; the Phase 5 UI is
a minimal read-only panel and only if time remains. Additional models (SaaS, marketplace)
stay deferred (ADR-0008). Three finished phases beat five half-done.

**P2 — Tooling constraint amended.** Supersede the single charter constraint "Claude Code
never writes React; Cursor after Gate 1 + design ref". Claude Code may author the Next.js
app. Every other Phase 2 requirement of ADR-0008 stays normative (three edge encodings,
bi-directional `BusinessModel` sync, drag-connect dialogs, FunnelChart, VerbalBuilder as
nice-to-have).

**P3 — Design reference.** `CLAUDE_DESIGN_SYSTEM.md` is the design reference for Phase 2
(tokens, edge encodings, layer fills, evidence-grade badges, verbatim caveats). A Figma
file, if the owner provides one later, may refine visuals but is not a gate. Owner visual
review is a human-only item.

**P4 — Analyst-stack export bridge.** Add exports from a validated `BusinessModel` to
(a) a KPI definition table as CSV and SQL view DDL, (b) Power BI DAX measures for
identity edges, plus a written Power BI build kit in `docs/powerbi/` (a `.pbix` cannot be
produced here; building it is human-only). Add German controlling-vocabulary display
labels (Kennzahlen, Deckungsbeitrag, Warenkorbwert, Konversionsrate) as ILLUSTRATIVE
labels only, never real company metrics (consistent with ADR-0004).

**P5 — Defended authoring pass.** For each modeled edge in the DTC seed, either cite a
public, verifiable source (name, URL, year, what it measures) and set an honest evidence
grade, or keep it `illustrative` and visibly flagged. No fabricated sources. One worked
example ("what to test first", ranked by value of information) is the single headline
result, reproducible by one command.

**P6 — Governance unchanged.** The finding queue, Adversary, and debt ratchet stay as is
and gate every PR of this programme. Each milestone is filed as one finding and lands as
one PR whose title carries the finding ID.

### Open decision 2 (ADR-0008) — resolved as proposal

Single package, not a monorepo split: the Next.js app lives in `driver_tree_studio/app/`
and `src/components/`; the engine stays framework-free in `src/engine/`, `src/schema/`,
`src/lib/` and remains importable without React. A governance test enforces that engine
files import no React/Next modules.

### Clarifications recorded with this ADR

- **Funnel seed.** ADR-0008 quotes `0.60 × 0.25 × 0.50 × 0.40 = 0.03` as an example. The
  implemented seed (ADR-0007, Gate 1) uses `purchase_completion_rate = 0.2667`, giving
  `conversion_rate = 0.02` and contribution profit 48,000. The seed values stand; the
  ADR-0008 figure is an arithmetic illustration, not a seed requirement.
- **Progress log.** `docs/PROGRESS.md` is an append-only log of merged/opened PRs with the
  gate evidence for each. It is not a plan, roadmap or TODO list (CONTRIBUTING bans those);
  the work queue stays `governance/findings/`.
- **Launch gate (ADR-0004/0008) stands.** Public, name-attached launch stays gated until no
  modeled edge carries only an illustrative grade without a visible flag. Repository
  visibility, deployment, and domain are human-only actions.

## Consequences

### Positive

- The product becomes runnable end-to-end on one model instead of five partial phases.
- Export bridge makes the tool's output usable in SQL/Power BI workflows.
- Charter matches what is actually in the repository.

### Negative

- A UI authored without a Figma pass may need visual refinement after owner review.
- Phase 5 UI may ship minimal or not at all.

### Neutral

- Cursor remains an allowed tool; it is no longer the only allowed UI author.

## Alternatives considered

- **Wait for Figma before any UI work** — rejected: the design system already fixes every
  token the UI needs, and the shell already exists.
- **Build all five phases at equal depth** — rejected: produces five half-finished surfaces.
- **Split engine and app into separate repositories** — rejected: doubles CI and
  governance overhead for a single-player tool.

## References

- ADR-0004, ADR-0007, ADR-0008, ADR-0009
- `CLAUDE_DESIGN_SYSTEM.md`
- F-007 (Phase 2 UI shell), F-012 (this ADR's finding)
