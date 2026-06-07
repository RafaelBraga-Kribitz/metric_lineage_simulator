---
id: 0008
title: "Phases 2–5, future engine modules, and open decisions"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0008: Phases 2–5, future engine modules, and open decisions

## Context

Normative scope for post–Phase 1 work from build spec v4 §7–14, §17–18 and workflow v4.
Not implemented in Phase 1; charter §4 tracks status.

## Decision

### Phase 2 — Cursor / Next.js + React Flow

- Custom canvas: three edge visual encodings (thick blue identity, amber modeled, grey dashed
  hypothesized with “?” badge).
- Bi-directional sync with `BusinessModel`; drag-connect edge creation dialogs.
- **FunnelChart** when funnel chain exists (see funnel decomposition below).
- **VerbalBuilder** (nice-to-have): Hazel-style readable rows for identity/modeled rows.
- Deploy to Vercel after Gate 1 + Figma design ref.
- Prerequisites: Phase 1 tests pass; design tokens from Figma MCP.

### Phase 3 — Data test + Monte Carlo worker

**3a (Claude Code):** `estimate.ts`, MC Web Worker, models 2–3 (SaaS, marketplace after DTC
excellent), scenarios.

**3b (Cursor):** Data-test hero panel, Monte Carlo panel in Next.js app.

**estimateRelationship** (BYOD CSV, single-player):

- Correlation + CI; OLS (manual, transparent); 80/20 out-of-sample r².
- Verdict distinguishes association vs effect; never “causes” on observational data.
- Fixed `causal_note`; `what_would_prove_this`; `leakage_warning` if edge is identity.
- On accept: update grade; hypothesized → modeled with `observational` grade.

Deferred flagship models (from v2 scope): subscription/PLG SaaS, two-sided marketplace,
optional crypto/casino — only after DTC is excellent.

### Phase 4 — Launch polish

SEO per model; shareable URL state; iframe embed; BRAGA brand.

**Gate:** Do not merge to production until DTC seed has no edges with only illustrative
grades for public Rafael-branded launch.

### Phase 5 — Experimentation Flywheel UI

**5a engine:** `valueOfInformation.ts`, `prioritize.ts` (VoI = north-star spread from edge
uncertainty; priorityScore = voiScore / test_cost).

**5b UI:** Guesstimate panel + prioritization view.

**Non-negotiable framing:**

- Output is **value of information**, never impact.
- Louder caveat: “This interval is the uncertainty in your GUESS, not evidence.”
- Functional forms are named library only (no arbitrary f(x)).

Sequencing: ship Phases 0–2 first; Phase 5 is post-launch flagship, must not block deploy.

### Funnel decomposition (Phase 2+)

```text
conversion_rate = product_view_rate × add_to_cart_rate × checkout_start_rate × purchase_completion_rate
```

Seed reconciling to 0.03: 0.60 × 0.25 × 0.50 × 0.40. Each stage: input lever with
`funnel_stage_order` 1..4.

### Future repository layout (full product)

```text
driver_tree_studio/ or monorepo app/
  src/engine/     # + valueOfInformation, prioritize, estimate
  src/workers/    # montecarlo.worker.ts
  src/components/ # Canvas, DataTest, Guesstimate, etc.
  app/ public/    # Next.js
```

Exact monorepo vs split: open decision below.

### LLM integration (when added)

- Proposed edges arrive as hypothesized, grade none.
- LLM never supplies elasticity as truth; optional Guesstimate range user must accept.

### v3→v4 changelog (preserved)

- Functional forms + elasticity_distribution (Guesstimate).
- VoI + prioritize modules.
- Funnel decomposition + FunnelChart.
- Verbal builder refined; Experimentation Flywheel + Phase 5.
- `estimated` grade + `test_cost` field.

### Open decisions

1. Domain and final product URL name.
2. Monorepo vs separate repos (artifact demo vs Next.js site).
3. Keep `estimated` and `illustrative` as distinct grades (**recommended: yes**).
4. DTC remains flagship model (**confirmed**).

## References

- build spec v4 §7–14, §17–18; workflow v4 phases 2–5
