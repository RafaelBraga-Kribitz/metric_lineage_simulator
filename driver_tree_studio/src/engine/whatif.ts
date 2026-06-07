/**
 * Single-leaf what-if analysis.
 */

import type { BusinessModel, MetricEdge } from "../schema/types.js";
import { applyLevers, computeBaseline } from "./compute.js";
import { buildGraph } from "./graph.js";

export interface WhatIfResult {
  values: Record<string, number>;
  northStarDelta: number;
  touchedModeledEdges: MetricEdge[];
}

/**
 * Perturb one leaf by a relative delta and recompute.
 * @param deltaPct e.g. 0.1 means +10%
 */
export function whatIf(
  model: BusinessModel,
  changedLeafId: string,
  deltaPct: number,
): WhatIfResult {
  const baseline = computeBaseline(model);
  const values = applyLevers(model, {
    [changedLeafId]: { mode: "multiplier", value: 1 + deltaPct },
  });
  const ns = model.north_star_id;
  const northStarDelta = (values[ns] ?? 0) - (baseline[ns] ?? 0);

  // BFS in child->parent direction collecting modeled edges on any path to NS
  const { outgoingOf } = buildGraph(model);
  const visited = new Set<string>();
  const touched: MetricEdge[] = [];
  const stack = [changedLeafId];
  while (stack.length) {
    const id = stack.pop() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const e of outgoingOf.get(id) ?? []) {
      if (e.kind === "modeled") touched.push(e);
      if (e.kind !== "hypothesized") stack.push(e.parent);
    }
  }
  // Dedup by reference (same edge object can be hit only once via this BFS)
  return { values, northStarDelta, touchedModeledEdges: touched };
}
