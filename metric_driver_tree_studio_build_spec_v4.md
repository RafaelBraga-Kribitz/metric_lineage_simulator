# Metric Driver-Tree Studio: Build Spec v4

Supersedes v3. Path A is locked: a single-player, rigorous tool that demonstrates
marketing-data-science judgment. No crowdsourcing, no consensus, no backend community layer.

Author context: BRAGA portfolio, marketing data scientist transitioning into DA/BI/DS.
Goals: a personal reference, a template for building better projects, and a free interactive
tool on the BRAGA website that drives traffic and signals rigor.

New in v4: the Experimentation Flywheel. The tool now models the full loop from untested
belief to guessed estimate to prioritized test to evidence-backed relationship. This is the
differentiator and is sequenced after the base deploy so it never blocks shipping.

---

## 0. Naming and positioning

Do not use the word "causal" in the product unless an actual causal method backs the claim.

Positioning line:
> An interactive driver-tree studio that separates what is true by definition, what is a
> declared assumption, and what is an untested belief, lets you make your guesses explicit
> and uncertain, and then helps you prioritize which guesses are worth testing against real
> data. A thinking aid for metric design and a discipline for measurement, not an econometric
> oracle.

The honesty is the differentiator, not a disclaimer to hide.

---

## 1. The Experimentation Flywheel (the organizing idea)

Every other feature serves this loop. It is what turns a metric calculator into a measurement
discipline.

```text
1. TOPOLOGY      draw a hypothesized edge: A may affect B, no number
2. GUESSTIMATE   attach a guessed elasticity as a distribution + a functional form
3. PROPAGATE     does that uncertainty move the north star? (value of information)
4. PRIORITIZE    rank tests by impact x uncertainty / test cost
5. TEST          estimate from your own data with statistical rigor
6. UPDATE        promote the edge, narrow the distribution, raise the evidence grade
   -> back to PROPAGATE
```

The honest principle that governs the whole loop: a guess is never an answer. Steps 2 and 3
exist to decide what to test, not to estimate impact. Step 5 is the only step that produces
evidence, and even then it produces association, not causation, unless an experiment backs it.

---

## 2. Core principle: three edge kinds

Every relationship is exactly one of three kinds. This is the spine.

| Visual        | Kind           | What is known                          | Formula | Number              | In computation |
|---------------|----------------|----------------------------------------|---------|---------------------|----------------|
| Thick + blue  | `identity`     | True by definition (Revenue = P x Q)   | Yes     | Exact               | Yes, locked    |
| Solid + amber | `modeled`      | Declared behavioral effect             | No*     | Elasticity or distribution | Yes, flagged |
| Dashed + grey | `hypothesized` | Directional belief only, untested      | No      | None                | No, topology only |

*Modeled edges carry an elasticity (point or distribution) plus a functional form and a
plain-English mechanism, not a formula in the parent's identity.

Edge color is a redundant signal alongside line weight and dash pattern, so colorblind users
get two cues without relying on color.

Lifecycle of an edge:
`hypothesized` (drawn on canvas) -> `modeled` with a guessed distribution and a low evidence
grade (Guesstimate) -> `modeled` with a tested distribution and a higher evidence grade
(after a data test) -> rarely, promoted to `identity` if it turns out to be definitional.

The Guesstimate state is NOT a fourth edge kind. It is a `modeled` edge whose elasticity is a
distribution and whose evidence grade is low (`illustrative` or `estimated`). This keeps the
mental model at three kinds.

---

## 3. Two cognitive modes, kept in sync

Two editing surfaces over one shared `BusinessModel`. They serve different activities and
stay synced.

- Canvas mode (visual): topology. "What influences what?" Drag nodes, draw edges. Home of
  `hypothesized` edges.
- Verbal/formula mode (text): quantification. "By how much, through what mechanism?" Home of
  `identity` (via the formula parser) and `modeled` (via the edge panel).

The verbal builder (Idea from Phase 0 review): clicking empty canvas space flips to a text
view of the same model. Borrow the visual cleanliness of the Hazel and Kayako rule builders
(indented readable rows, add/remove, nested groups), but the content is algebraic composition
and elasticity declaration, NOT boolean conditions. Example rendering:

```text
Contribution Profit is defined as
    Net Revenue                              [identity, add]
    minus Variable Costs                     [identity, subtract]

Net Revenue is defined as
    Orders x Average Order Value             [identity, multiply]

Returning Sessions is influenced by
    Email Capture Rate                       [modeled, elasticity 0.3, illustrative]

Conversion Rate is believed to be influenced by
    Page Load Speed                          [hypothesized, decreases, untested]
```

Boolean nesting (the literal Hazel "all/any of the following") fits only one advanced case:
segment conditions, e.g. "this elasticity applies when channel = paid AND device = mobile."
That is a future feature, explicitly out of scope for now. The verbal builder is a Phase 2
nice-to-have, not a priority; the canvas plus a formula input field already provides
bi-directional editing.

Edge-direction convention (get this right or nothing reconciles): a data edge
`{ parent, child }` means parent is the explained metric (effect/aggregate), child is the
component/driver. Computation flows child -> parent. The canvas and verbal view both render
child -> parent (cause toward the north star), which is visually opposite to nothing here
because reading bottom-up matches the data; document the convention regardless.

---

## 4. Data schema

TypeScript in `src/schema/types.ts`, JSON Schema in `schema/model.schema.json`. Content
models are JSON files.

Conventions: snake_case for data ids, JSON fields, file names; PascalCase for
types/interfaces/classes; camelCase for functions and variables.

```typescript
export type Unit = "currency" | "count" | "ratio" | "percent" | "duration_s";

export type MetricLayer =
  | "north_star" | "strategic_objective" | "outcome" | "driver"
  | "operational" | "input" | "guardrail" | "counter";

export type EdgeKind = "identity" | "modeled" | "hypothesized";

export type FormulaRole = "factor" | "addend" | "subtrahend" | "divisor";

export type FunctionalForm = "linear" | "logarithmic" | "power" | "s_curve";

export type EvidenceGrade =
  | "none"          // hypothesized
  | "illustrative"  // a single placeholder number, not from data
  | "estimated"     // a reasoned guess with an explicit uncertainty range (Guesstimate)
  | "anecdotal"
  | "observational"
  | "experimental";

export type Direction = "increases" | "decreases" | "unclear";

export type DistributionKind = "point" | "triangular" | "normal" | "lognormal";

export interface Distribution {
  kind: DistributionKind;
  params: Record<string, number>; // point:{value}; triangular:{min,mode,max};
                                   // normal:{mean,sd}; lognormal:{mu,sigma}
}

export interface GovernanceMeta {
  owner: string; business_function: string; data_source: string;
  warehouse_table: string; calculation_grain: string; update_frequency: string;
  dimensions: string[];
}

export interface MetricNode {
  id: string; name: string; definition: string;
  unit: Unit; layer: MetricLayer;
  baseline: number; is_controllable: boolean;
  distribution?: Distribution;        // required iff is_controllable (input uncertainty)
  governance: GovernanceMeta;
  explainer?: string;
  position?: { x: number; y: number }; // canvas layout
  funnel_stage_order?: number;         // set on funnel-rate inputs for funnel viz ordering
}

export interface MetricEdge {
  parent: string;                      // explained metric
  child: string;                       // component / driver

  kind: EdgeKind;

  // identity only
  formula_role?: FormulaRole;

  // modeled only
  functional_form?: FunctionalForm;    // shape of the behavioral relationship
  elasticity?: number;                 // point estimate or central parameter
  elasticity_distribution?: Distribution; // uncertainty around the parameter (Guesstimate)
  form_params?: Record<string, number>;   // shape params (e.g., s_curve steepness k)
  mechanism?: string;

  // hypothesized only
  direction?: Direction;

  // modeled + hypothesized
  evidence_grade?: EvidenceGrade;
  evidence_note?: string;
  rationale?: string;
  test_cost?: number;                  // 1 (cheap) to 5 (expensive), for prioritization
}

export interface Scenario {
  id: string; name: string; description: string;
  levers: Record<string, { mode: "multiplier" | "absolute"; value: number }>;
}

export interface BusinessModel {
  id: string; name: string; industry: string;
  preset_labels?: string[];
  north_star_id: string;
  nodes: MetricNode[];
  edges: MetricEdge[];
  scenarios: Scenario[];
  narrative: string;
}
```

---

## 5. Engine layer (pure, framework-free, tested)

All in `src/engine/`. No React. Deterministic. Seeded randomness. Vitest.

Computation rules (so the model reconciles):

- A node's value has exactly one structural source: input leaf (own value, lever-adjustable,
  then adjusted by incoming modeled edges) OR identity parent (exact formula over identity
  children). No node is both an identity parent and a modeled parent. Enforced in validation.
- `identity`: exact formula in topological order.
- `modeled`: for a target with incoming modeled edges,
  `effective = base * product over edges of applyForm(form, childDeltaPct, edge)`.
  applyForm returns a multiplier:
  - linear:        `1 + e * childDeltaPct`
  - logarithmic:   `1 + e * ln(1 + childDeltaPct)`         (diminishing returns)
  - power:         `(1 + childDeltaPct) ** e`               (constant elasticity)
  - s_curve:       `1 + e * (2 * logistic(k * childDeltaPct) - 1)`  (saturating; k in form_params)
  This composition (multiplicative, independent effects) is a declared assumption. Surface it
  in the methodology panel. Document each form's parameterization in code.
- `hypothesized`: contributes nothing to computation.

```typescript
// graph.ts:   buildGraph(model), topoOrder(graph)
// compute.ts: computeBaseline(model), applyLevers(model, levers), applyForm(form, delta, edge)
// whatif.ts:  whatIf(model, changedLeaf, deltaPct) -> { values, northStarDelta, touchedModeledEdges }
// sensitivity.ts:
//   tornado(model, deltaPct=0.1) -> Array<{ leafId, northStarDelta }> sorted desc
// montecarlo.ts (Web Worker; identity + modeled; samples elasticity_distribution when present):
//   monteCarlo(model, runs, seed) -> { samples, p10, p50, p90, varianceContribution }
// valueOfInformation.ts:
//   voi(model, runs, seed) -> Array<{ edgeId, northStarSpread, varianceShare }>
//     northStarSpread = p90 - p10 of the north star attributable to that edge's uncertainty
// prioritize.ts:
//   prioritizeTests(model) -> Array<{ edgeId, voiScore, testCost, priorityScore, reason }>
//     priorityScore = voiScore / testCost, sorted desc.
//     reason is plain-English: "high uncertainty, large north-star swing, cheap to test"
// estimate.ts (data test; see section 8)
// recommend.ts:
//   recommend(model, levers) -> { topLevers, brokenGuardrails, untestedBeliefs }
```

Invariant tests (minimum): zero lever change yields zero north-star change; identity-only
models reconcile exactly; hypothesized edges never alter a computed value; Monte Carlo with
point distributions equals the deterministic baseline; seeded Monte Carlo reproducible; each
functional form returns 1.0 at childDeltaPct = 0; logarithmic and s_curve show diminishing
marginal effect; no node is both an identity and a modeled parent (validation rejects).

---

## 6. Formula parser (text drives identity topology)

`src/lib/formula.ts`. parseFormula(formula, existingNodes) -> { newEdges, newNodes }.
Input: `net_revenue = orders * average_order_value`. Operators map to roles: * factor,
+ addend, - subtrahend, / divisor. Supports parentheses and precedence. Produces identity
edges only. Modeled edges are declared in the edge panel; hypothesized edges are drawn on the
canvas. The verbal builder (section 3) reads and writes through this parser for identity rows.

---

## 7. Visual canvas (React Flow, Phase 2)

`src/components/Canvas/`. Custom nodes (layer badge, name, value, delta). Custom edges render
the three kinds (thick/solid/dashed plus color) with a "?" badge on hypothesized edges and an
evidence-grade chip on modeled edges. Drag-to-connect opens an edge-creation dialog (identity
-> formula editor; modeled -> form + elasticity + mechanism + evidence; hypothesized ->
direction + rationale). Node positions persist. Does not run in a Claude Artifact; the Phase 0
artifact uses a read-interactive tree instead.

---

## 8. Bring-your-own-data testing (the test step of the flywheel)

`src/components/DataTest/` and `src/engine/estimate.ts`. Single-player: the user tests against
their own uploaded CSV, so no privacy, pooling, or legal problem.

estimateRelationship(data, parentId, childId, controlIds, edge) -> EstimationResult with:
correlation and CI; OLS regression (coefficient, intercept, r_squared, out-of-sample
r_squared from an 80/20 split, SE, t, p, effect-size note); a verdict that always distinguishes
association from effect and never prints "causes" for observational data; a fixed causal_note
("This is observational data. It does not establish causation."); a what_would_prove_this
block describing the experiment that would raise the grade to experimental; a leakage_warning
that fires and returns early if the edge is an identity; and a promoted_elasticity candidate
(null if out-of-sample r_squared < 0.05).

On accept: update evidence_grade and evidence_note; a hypothesized edge can be promoted to
modeled with the estimated coefficient and grade `observational`. Implement OLS manually
(transparent math), no regression library in the engine.

---

## 9. Marketing-science lens

Baked into the DTC seed and copy. The difference between generic DS and marketing DS.

- Contribution profit is the north star, not revenue. Resisting a vanity NSM is a signal.
- Conversion rate is decomposed into a real funnel (section 11), giving stage-level levers.
- LTV from a retention/survival curve with discounting, not ARPU times a guessed lifetime.
- CAC fully loaded (media + tooling + allocated headcount).
- LTV:CAC and payback are guardrails, not the NSM.
- Attribution treated as a hard problem; channel edges default to hypothesized until tested.
- Incrementality versus correlation surfaced in the data-test verdict and in the Guesstimate
  caveat: a guess that an ad drives sales is not evidence the ad drives sales.
- The loyalty_membership -> customer_ltv edge stays hypothesized with the selection-trap
  warning. When data-tested it shows strong correlation and the tool refuses to promote it to
  a causal claim without a randomized enrollment experiment.

---

## 10. Guesstimate and value-of-information (the guess and prioritize steps)

This is the highest false-rigor risk in the project. Treat the guardrails as load-bearing.

The Guesstimate UI lets the user put a distribution on a modeled edge's elasticity (triangular
low/likely/high is the default, mapping to the worst/expected/best intuition) and pick a
functional form. The Monte Carlo engine samples the elasticity and propagates to the north
star.

Non-negotiable framing rules:
- The output is value of information, never impact. It answers "how much would resolving this
  guess change my view of the north star, and is that worth the cost of testing?" It never
  says "the expected impact is X with Y% confidence."
- Every Guesstimate result carries a louder caveat than the regular Monte Carlo caveat:
  "This interval is the uncertainty in your GUESS, not evidence. A distribution looks like
  data and is not. Its only purpose is to help you decide what to test."
- Functional forms are a named library (linear, diminishing-returns/logarithmic, power,
  s-curve/saturation), not arbitrary f(x). Choosing the right shape (most marketing levers
  saturate) is a rigor signal; arbitrary functions are rope to hang yourself with.

Prioritization view: prioritizeTests(model) ranks edges by priorityScore = voiScore /
test_cost. The table shows, per edge: current uncertainty (the guess spread), north-star
swing (VoI), test cost (user-entered 1 to 5), priority score, and a plain-English reason.
This is value-of-information prioritization, which is more defensible than gut-feel ICE
scoring. It is a view over the existing engine plus one scoring function, not a new platform.

---

## 11. Funnel visualization and the enriched DTC funnel

Decompose conversion_rate into real funnel stages so the funnel viz is meaningful and you gain
stage-level levers:

```text
conversion_rate = product_view_rate * add_to_cart_rate * checkout_start_rate * purchase_completion_rate
```

Seed values that reconcile to the existing 0.03 conversion rate:
product_view_rate 0.60, add_to_cart_rate 0.25, checkout_start_rate 0.50,
purchase_completion_rate 0.40 (product = 0.03). Each is an input lever with
funnel_stage_order set 1..4.

The funnel component renders contextually when a funnel-shaped chain exists: Sessions ->
Product Views -> Carts -> Checkouts -> Orders, with stage conversion percentages between bars.
It is an additional viz alongside the bar chart, not a replacement. Its value scales with
funnel granularity, which is why the decomposition above matters.

---

## 12. Honesty layer

Every modeled and hypothesized edge shows its evidence_grade on the edge and in the
Assumptions Ledger. A persistent Methodology panel explains the three kinds, the modeled
composition assumption (section 5), the functional-form library, the Guesstimate VoI framing,
and the Pearl causal-DAG lineage. The tool never labels observational findings as causal.
Every untested edge carries a "What would prove this?" prompt. No decorative confidence
scores; confidence is the evidence grade, which is earned.

---

## 13. LLM integration

Authoring assist proposes a draft tree; all proposed edges arrive as hypothesized,
evidence_grade none. Evidence search returns citations for review, never auto-attached. The
LLM never supplies an elasticity as truth; asked for a number it returns a hypothesis flagged
as needing evidence, optionally pre-filling a Guesstimate range the user must accept. Keys:
provided API in the artifact; user-supplied key (session only) in the deployed app.

---

## 14. Channels and phasing

| Phase | Channel | Deliverable |
|-------|---------|-------------|
| 0 | Claude Artifact | DONE. One model, read-interactive tree, levers, results, ledger, methodology. Optional additive VoI prototype panel (see prompts addendum). |
| 1 | Claude Code / Cursor | Schema (v4) + engine (incl. functional forms, VoI, prioritize) + formula parser + Vitest; illustrative DTC seed with the funnel decomposition; reconcile before UI. |
| 2 | Cursor on Vercel | Next.js + React Flow canvas + bi-directional sync + funnel viz + verbal builder; deploy. (Folds in funnel and verbal builder.) |
| 3 | Cursor + Claude Code | Bring-your-own-data testing; Monte Carlo worker; models 2 and 3; scenarios. |
| 4 | Cursor | SEO per model; shareable URL state; embed; BRAGA brand; launch (gated on real DTC authoring). |
| 5 | Cursor + Claude Code | Experimentation Flywheel: Guesstimate panel + value-of-information + prioritization view. The flagship post-launch feature that closes the loop. |

Sequencing discipline: ship Phases 0 to 2 first; that deployed honest tree is already
interview-worthy and should start earning conversations. Phase 5 is the differentiator you
build once the base is live and earning, and it becomes your headline demo and write-up. Do
not let Phase 5 block the deploy.

---

## 15. Repository structure

```text
driver_tree_studio/
  README.md  package.json  tsconfig.json
  schema/ (model.schema.json, validate.ts)
  src/
    schema/types.ts
    engine/   # graph, compute, whatif, sensitivity, montecarlo, valueOfInformation,
              # prioritize, estimate, recommend
    lib/      # formula parser, rng, url-state, formatting
    workers/  # montecarlo.worker.ts
    components/
      Canvas/ Tree/ LeverPanel/ MetricInspector/ AssumptionsLedger/
      DataTest/ MonteCarloPanel/ FunnelChart/ VerbalBuilder/
      Guesstimate/ PrioritizationView/ MethodologyNote/
    content/  # one JSON file per model
  tests/  app/  public/
```

---

## 16. Validation rules

All edges reference existing nodes; DAG; exactly one north_star with no parents; every
controllable node is a leaf with a distribution; identity edges have formula_role and
reconcile to 1e-6; modeled edges have functional_form, mechanism, evidence_grade, and either
elasticity or elasticity_distribution; hypothesized edges have direction, rationale,
evidence_grade none, and no elasticity; no node is both an identity and a modeled parent;
hypothesized edges excluded from reconciliation and compute; funnel stage rates multiply to
the stored conversion_rate baseline.

---

## 17. Changelog v3 to v4

- Modeled edges gain named functional forms (linear, logarithmic, power, s_curve) and an
  optional distribution-valued elasticity (Guesstimate), without adding a fourth edge kind.
- Added value-of-information (valueOfInformation.ts) and test prioritization (prioritize.ts).
- Decomposed DTC conversion_rate into a real funnel; added the FunnelChart component.
- Refined the verbal builder: algebraic composition with Hazel-style cleanliness, not boolean
  logic; segment conditions noted as future scope.
- Added the Experimentation Flywheel as the organizing idea and Phase 5.
- Added `estimated` evidence grade and `test_cost` field.
- Reaffirmed false-rigor guardrails on the Guesstimate layer (VoI not impact; louder caveat;
  named forms not arbitrary f(x)).
- Sequencing discipline: ship 0 to 2 first; Phase 5 is the post-launch flagship.

---

## 18. Open decisions

1. Domain and product name.
2. Monorepo or separate repos for artifact demo and Next.js site.
3. Whether `estimated` and `illustrative` are distinct grades or one. (Recommendation: keep
   both; estimated = guess-with-range, illustrative = single placeholder.)
4. DTC stays flagship: confirmed.
