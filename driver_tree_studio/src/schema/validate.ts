/**
 * BusinessModel validation per spec v4 §15/§16.
 */

import type { BusinessModel, MetricEdge } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REL_TOL = 1e-6;
const TINY = 1e-12;

/** Recompute an identity parent from its children using formula_role semantics. */
function reconcileNode(
  parentId: string,
  identityEdges: MetricEdge[],
  values: Map<string, number>,
): number {
  let acc: number | null = null;
  const factors = identityEdges.filter((e) => e.formula_role === "factor");
  const addends = identityEdges.filter((e) => e.formula_role === "addend");
  const subs = identityEdges.filter((e) => e.formula_role === "subtrahend");
  const divisors = identityEdges.filter((e) => e.formula_role === "divisor");
  if (factors.length > 0) {
    acc = 1;
    for (const e of factors) acc *= values.get(e.child) ?? 0;
  }
  if (addends.length > 0 || subs.length > 0) {
    if (acc === null) acc = 0;
    for (const e of addends) acc += values.get(e.child) ?? 0;
    for (const e of subs) acc -= values.get(e.child) ?? 0;
  }
  if (divisors.length > 0) {
    if (acc === null) acc = 1;
    for (const e of divisors) {
      const d = values.get(e.child) ?? 0;
      acc = Math.abs(d) < TINY ? 0 : acc / d;
    }
  }
  return acc ?? values.get(parentId) ?? 0;
}

/** Validate a BusinessModel. Returns { valid, errors }. */
export function validate(model: BusinessModel): ValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set(model.nodes.map((n) => n.id));

  // 1. Edge endpoints exist
  for (const e of model.edges) {
    if (!nodeIds.has(e.parent)) errors.push(`[edge-ref] missing parent '${e.parent}'`);
    if (!nodeIds.has(e.child)) errors.push(`[edge-ref] missing child '${e.child}'`);
  }

  // Per-node incoming/outgoing
  const incoming = new Map<string, MetricEdge[]>();
  const outgoing = new Map<string, MetricEdge[]>();
  for (const id of nodeIds) {
    incoming.set(id, []);
    outgoing.set(id, []);
  }
  for (const e of model.edges) {
    incoming.get(e.parent)?.push(e);
    outgoing.get(e.child)?.push(e);
  }

  // 2. DAG (Kahn)
  const indeg = new Map<string, number>();
  for (const id of nodeIds) indeg.set(id, incoming.get(id)?.length ?? 0);
  const queue: string[] = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift() as string;
    order.push(id);
    for (const e of outgoing.get(id) ?? []) {
      const d = (indeg.get(e.parent) ?? 0) - 1;
      indeg.set(e.parent, d);
      if (d === 0) queue.push(e.parent);
    }
  }
  if (order.length !== nodeIds.size) {
    errors.push("[dag] cycle detected in metric graph");
  }

  // 3. Exactly one north_star with no incoming edges
  const northStars = model.nodes.filter((n) => n.layer === "north_star");
  if (northStars.length !== 1) {
    errors.push(`[north-star] expected exactly one north_star node, got ${northStars.length}`);
  } else {
    const ns = northStars[0];
    if (ns) {
      // "no parents" per spec: the north star is the topmost aggregate, so it
      // must never appear as the `child` of any edge.
      if ((outgoing.get(ns.id)?.length ?? 0) > 0) {
        errors.push(`[north-star] '${ns.id}' must have no parents (appears as child in some edge)`);
      }
      if (ns.id !== model.north_star_id) {
        errors.push(`[north-star] model.north_star_id '${model.north_star_id}' does not match the sole north_star node '${ns.id}'`);
      }
    }
  }

  // 4. Controllable nodes: leaves in identity tree, must have distribution
  for (const n of model.nodes) {
    if (!n.is_controllable) continue;
    const out = incoming.get(n.id) ?? []; // edges where n is parent
    const hasIdentityChildren = out.some((e) => e.kind === "identity");
    if (hasIdentityChildren) {
      errors.push(`[controllable-leaf] '${n.id}' is controllable but decomposes via identity edges`);
    }
    if (!n.distribution) {
      errors.push(`[controllable-leaf] '${n.id}' is controllable but has no distribution`);
    }
  }

  // 5. Per-edge required-field checks
  for (const e of model.edges) {
    const tag = `${e.child}->${e.parent}`;
    if (e.kind === "identity") {
      if (!e.formula_role) errors.push(`[edge-identity] ${tag}: missing formula_role`);
      if (e.elasticity !== undefined || e.elasticity_distribution)
        errors.push(`[edge-identity] ${tag}: must not carry elasticity`);
      if (e.direction) errors.push(`[edge-identity] ${tag}: must not carry direction`);
    } else if (e.kind === "modeled") {
      if (!e.functional_form) errors.push(`[edge-modeled] ${tag}: missing functional_form`);
      if (!e.mechanism) errors.push(`[edge-modeled] ${tag}: missing mechanism`);
      if (!e.evidence_grade) errors.push(`[edge-modeled] ${tag}: missing evidence_grade`);
      if (e.elasticity === undefined && !e.elasticity_distribution)
        errors.push(`[edge-modeled] ${tag}: must have elasticity or elasticity_distribution`);
      if (e.formula_role) errors.push(`[edge-modeled] ${tag}: must not carry formula_role`);
    } else if (e.kind === "hypothesized") {
      if (!e.direction) errors.push(`[edge-hypothesized] ${tag}: missing direction`);
      if (!e.rationale) errors.push(`[edge-hypothesized] ${tag}: missing rationale`);
      if (e.evidence_grade !== "none")
        errors.push(`[edge-hypothesized] ${tag}: evidence_grade must be 'none'`);
      if (e.elasticity !== undefined || e.elasticity_distribution)
        errors.push(`[edge-hypothesized] ${tag}: must not carry elasticity`);
    }
  }

  // 6. No node is both an identity-parent and modeled-parent target
  for (const id of nodeIds) {
    const inc = incoming.get(id) ?? [];
    const hasIdentity = inc.some((e) => e.kind === "identity");
    const hasModeled = inc.some((e) => e.kind === "modeled");
    if (hasIdentity && hasModeled) {
      errors.push(`[double-count] '${id}' is both an identity parent and a modeled target`);
    }
  }

  // 7. Identity reconciliation (skip if DAG already broken)
  if (order.length === nodeIds.size) {
    const values = new Map<string, number>();
    for (const id of order) {
      const node = model.nodes.find((n) => n.id === id);
      if (!node) continue;
      const inc = (incoming.get(id) ?? []).filter((e) => e.kind === "identity");
      if (inc.length === 0) {
        values.set(id, node.baseline);
      } else {
        const computed = reconcileNode(id, inc, values);
        const denom = Math.max(Math.abs(node.baseline), 1);
        const rel = Math.abs(computed - node.baseline) / denom;
        if (rel >= REL_TOL) {
          errors.push(
            `[reconciliation] '${id}': expected ${node.baseline}, got ${computed} (rel ${rel.toExponential(2)})`,
          );
        }
        values.set(id, node.baseline);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
