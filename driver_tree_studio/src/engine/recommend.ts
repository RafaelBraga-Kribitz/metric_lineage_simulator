/**
 * Recommendation surface for the studio.
 */

import type { BusinessModel, MetricEdge } from "../schema/types.js";
import { applyLevers, computeBaseline, type Levers } from "./compute.js";
import { tornado, type TornadoEntry } from "./sensitivity.js";

export interface RecommendResult {
  topLevers: TornadoEntry[];
  brokenGuardrails: Array<{ id: string; baseline: number; current: number }>;
  untestedBeliefs: MetricEdge[];
}

/**
 * Phase 1 simplification: a guardrail/counter is "broken" when its value drops
 * below baseline by > 1e-9. A richer sign convention will land with the
 * guardrail-direction metadata in a later phase.
 */
export function recommend(model: BusinessModel, levers: Levers): RecommendResult {
  const baseline = computeBaseline(model);
  const current = applyLevers(model, levers);

  const brokenGuardrails: Array<{ id: string; baseline: number; current: number }> = [];
  for (const n of model.nodes) {
    if (n.layer !== "guardrail" && n.layer !== "counter") continue;
    const b = baseline[n.id] ?? 0;
    const c = current[n.id] ?? 0;
    if (c < b - 1e-9) brokenGuardrails.push({ id: n.id, baseline: b, current: c });
  }

  const untestedBeliefs = model.edges.filter((e) => e.kind === "hypothesized");
  const topLevers = tornado(model).slice(0, 5);

  return { topLevers, brokenGuardrails, untestedBeliefs };
}
