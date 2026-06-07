/**
 * Baseline and lever-applied computation.
 *
 * Modeled-edge composition: effective = base * Π applyForm(form, childDeltaPct, edge).
 * ASSUMPTION: modeled effects are multiplicative and independent (spec §5).
 * Hypothesized edges contribute nothing to compute.
 */

import type {
  BusinessModel,
  FunctionalForm,
  MetricEdge,
} from "../schema/types.js";
import { buildGraph, topoOrder } from "./graph.js";

export type Levers = Record<string, { mode: "multiplier" | "absolute"; value: number }>;

const TINY = 1e-12;

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Multiplier applied by one modeled edge given its child's % change. */
export function applyForm(
  form: FunctionalForm,
  childDeltaPct: number,
  edge: MetricEdge,
  elasticity: number,
): number {
  switch (form) {
    case "linear":
      return 1 + elasticity * childDeltaPct;
    case "logarithmic": {
      const arg = 1 + childDeltaPct;
      if (arg <= 0) return 0;
      return 1 + elasticity * Math.log(arg);
    }
    case "power": {
      const arg = 1 + childDeltaPct;
      if (arg < 0) return 0;
      return Math.pow(arg, elasticity);
    }
    case "s_curve": {
      const k = edge.form_params?.k ?? 1;
      return 1 + elasticity * (2 * logistic(k * childDeltaPct) - 1);
    }
  }
}

/**
 * Compute a value map walking topoOrder.
 * @param leafOverrides per-leaf effective values (used by levers or MC)
 * @param edgeElasticity per-edge elasticity override (used by MC); defaults to edge.elasticity ?? 0
 */
function computeWith(
  model: BusinessModel,
  leafOverrides: Record<string, number>,
  edgeElasticity?: Map<MetricEdge, number>,
): Record<string, number> {
  const { incomingOf, nodesById } = buildGraph(model);
  const order = topoOrder(model);
  const values: Record<string, number> = {};

  for (const id of order) {
    const node = nodesById.get(id);
    if (!node) continue;
    const incoming = incomingOf.get(id) ?? [];
    const identityEdges = incoming.filter((e) => e.kind === "identity");
    const modeledEdges = incoming.filter((e) => e.kind === "modeled");

    let base: number;
    if (identityEdges.length > 0) {
      // recompute from identity children via formula_role
      let acc: number | null = null;
      // group by role
      const factors = identityEdges.filter((e) => e.formula_role === "factor");
      const addends = identityEdges.filter((e) => e.formula_role === "addend");
      const subs = identityEdges.filter((e) => e.formula_role === "subtrahend");
      const divisors = identityEdges.filter((e) => e.formula_role === "divisor");
      if (factors.length > 0) {
        acc = 1;
        for (const e of factors) acc *= values[e.child] ?? 0;
      }
      if (addends.length > 0 || subs.length > 0) {
        if (acc === null) acc = 0;
        for (const e of addends) acc += values[e.child] ?? 0;
        for (const e of subs) acc -= values[e.child] ?? 0;
      }
      if (divisors.length > 0) {
        if (acc === null) acc = 1;
        for (const e of divisors) {
          const d = values[e.child] ?? 0;
          acc = Math.abs(d) < TINY ? 0 : acc / d;
        }
      }
      base = acc ?? 0;
    } else if (Object.prototype.hasOwnProperty.call(leafOverrides, id)) {
      base = leafOverrides[id] as number;
    } else {
      base = node.baseline;
    }

    if (modeledEdges.length > 0) {
      let mult = 1;
      for (const e of modeledEdges) {
        const childVal = values[e.child] ?? 0;
        const childNode = nodesById.get(e.child);
        const childBaseline = childNode?.baseline ?? 0;
        const childDeltaPct =
          Math.abs(childBaseline) < TINY ? 0 : (childVal - childBaseline) / childBaseline;
        const elas = edgeElasticity?.get(e) ?? e.elasticity ?? 0;
        mult *= applyForm(e.functional_form ?? "linear", childDeltaPct, e, elas);
      }
      base = base * mult;
    }

    values[id] = base;
  }
  return values;
}

/** Compute every node value from stored baselines. Identity parents are recomputed. */
export function computeBaseline(model: BusinessModel): Record<string, number> {
  return computeWith(model, {});
}

/** Apply levers (multiplier or absolute) on input leaves, recompute the graph. */
export function applyLevers(
  model: BusinessModel,
  levers: Levers,
): Record<string, number> {
  const overrides: Record<string, number> = {};
  for (const n of model.nodes) {
    const l = levers[n.id];
    if (!l) continue;
    overrides[n.id] = l.mode === "multiplier" ? n.baseline * l.value : l.value;
  }
  return computeWith(model, overrides);
}

/** Internal MC entry point: leaf overrides + per-edge elasticity sampling. */
export function computeForMonteCarlo(
  model: BusinessModel,
  leafOverrides: Record<string, number>,
  edgeElasticity: Map<MetricEdge, number>,
): Record<string, number> {
  return computeWith(model, leafOverrides, edgeElasticity);
}
