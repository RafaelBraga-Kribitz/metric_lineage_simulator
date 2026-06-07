---
id: 0004
title: "Product model, positioning, and marketing-science invariants"
status: accepted
date: 2026-06-07
deciders: [Rafael Braga]
supersedes: null
superseded_by: null
---

# ADR-0004: Product model, positioning, and marketing-science invariants

## Context

Normative product definition from build specs v2→v4. v2 had two edge kinds (`identity`,
`assumed`); v3 split `assumed` into `modeled` + `hypothesized`; v4 added the Experimentation
Flywheel and Guesstimate (modeled + elasticity distribution, not a fourth edge kind).

## Decision

### Positioning

Product name: **Metric Driver-Tree Studio** (codename repo: `metric_lineage_simulator`).

Do not use “causal” unless an actual causal method backs the claim.

Positioning line:

> An interactive driver-tree studio that separates what is true by definition, what is a
> declared assumption, and what is an untested belief, lets you make your guesses explicit
> and uncertain, and then helps you prioritize which guesses are worth testing against real
> data. A thinking aid for metric design and a discipline for measurement, not an
> econometric oracle.

Honesty is the differentiator, not a disclaimer to hide.

### Path A (locked since v3)

Single-player rigorous tool. No crowdsourcing, consensus, or backend community layer.
BRAGA portfolio asset: personal reference, project template, free interactive website tool.

### Experimentation Flywheel (v4 organizing idea)

```text
1. TOPOLOGY      — hypothesized edge: A may affect B, no number
2. GUESSTIMATE   — modeled edge: elasticity distribution + functional form
3. PROPAGATE     — does uncertainty move the north star? (value of information)
4. PRIORITIZE    — rank tests by impact × uncertainty / test cost
5. TEST          — estimate from user's data with statistical rigor
6. UPDATE        — promote edge, narrow distribution, raise evidence grade → back to 3
```

A guess is never an answer. Steps 2–3 decide what to test, not impact. Step 5 yields
association unless an experiment backs causation.

### Three edge kinds (spine)

| Visual | Kind | Known | In compute |
|---|---|---|---|
| Thick blue solid | `identity` | Definitional formula | Yes, locked |
| Amber solid | `modeled` | Mechanism + elasticity (point or distribution) + functional form | Yes, flagged |
| Grey dashed | `hypothesized` | Direction + rationale only | No (topology) |

**Guesstimate** is not a fourth kind: it is `modeled` with `elasticity_distribution` and
low evidence grade (`illustrative` or `estimated`).

Edge lifecycle: `hypothesized` → `modeled` (guessed) → `modeled` (tested, higher grade) →
rarely `identity` if definitional.

### Edge direction convention

`MetricEdge { parent, child }`: parent is explained (aggregate/effect); child is
component/driver. **Computation flows child → parent.** Document in all engine JSDoc.

### Two cognitive modes (one `BusinessModel`)

- **Canvas:** topology; home of `hypothesized` edges.
- **Formula/verbal:** quantification; `identity` via formula parser; `modeled` via edge panel.

Verbal builder (Phase 2+): algebraic composition, not boolean rules. Segment conditions
(Hazel-style all/any) are future scope.

### Scope evolution (from v2)

v2 proposed 3–5 flagship models. **Current decision:** one DTC seed until excellent; add
SaaS/marketplace later (ADR-0008). Austrian presets are illustrative labels only, never
copies of real internal metrics.

### Launch gate (v3)

Do not attach Rafael's name publicly or link from portfolio until illustrative numbers are
replaced with a defended one-week authoring pass. Build and demo freely before then.

### Marketing-science invariants (DTC seed + copy)

- North star = **contribution profit**, not revenue.
- Conversion decomposed to funnel stages (ADR-0008).
- LTV from retention/survival with discounting, not ARPU × guessed lifetime.
- CAC fully loaded (media + tooling + allocated headcount).
- LTV:CAC and payback are guardrails, not NSM.
- Attribution defaults to hypothesized until tested.
- **Selection trap:** `loyalty_membership → customer_ltv` stays hypothesized with warning:
  “Loyalty members show higher LTV in cohort data, but this is almost certainly selection:
  heavy buyers enroll, not vice versa. Do not model as causal without a randomized
  enrollment experiment.”

### Honesty layer (all phases)

- Evidence grade on every modeled/hypothesized edge; no decorative confidence scores.
- Methodology panel explains three kinds, multiplicative modeled assumption, functional-form
  library, Guesstimate VoI framing.
- Observational findings never labeled causal. Untested edges carry “What would prove this?”

## Consequences

All UI copy, seed edges, and data-test verdicts must align with this ADR.

## References

- Absorbed: build spec v2 §0–2, v3 §0–3, v4 §0–3, §9, §12
