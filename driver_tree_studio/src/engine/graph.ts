/**
 * Graph utilities.
 *
 * Direction convention (spec v4 §5): a MetricEdge { parent, child } means the
 * `parent` is the explained metric (aggregate/effect); the `child` is the
 * component or driver. Value flow is child -> parent.
 * topoOrder() therefore returns children before parents.
 */

import type { BusinessModel, MetricEdge, MetricNode } from "../schema/types.js";

export interface BuiltGraph {
  /** incoming edges to a node (edges where node === parent), i.e. its drivers */
  incomingOf: Map<string, MetricEdge[]>;
  /** outgoing edges from a node (edges where node === child), i.e. parents it feeds */
  outgoingOf: Map<string, MetricEdge[]>;
  nodesById: Map<string, MetricNode>;
}

/** Build adjacency maps from a BusinessModel. */
export function buildGraph(model: BusinessModel): BuiltGraph {
  const incomingOf = new Map<string, MetricEdge[]>();
  const outgoingOf = new Map<string, MetricEdge[]>();
  const nodesById = new Map<string, MetricNode>();
  for (const n of model.nodes) {
    nodesById.set(n.id, n);
    incomingOf.set(n.id, []);
    outgoingOf.set(n.id, []);
  }
  for (const e of model.edges) {
    incomingOf.get(e.parent)?.push(e);
    outgoingOf.get(e.child)?.push(e);
  }
  return { incomingOf, outgoingOf, nodesById };
}

/**
 * Kahn's algorithm in child->parent direction.
 * Returns node ids with children before parents. Throws on cycle.
 */
export function topoOrder(model: BusinessModel): string[] {
  const { incomingOf, outgoingOf } = buildGraph(model);
  const indeg = new Map<string, number>();
  for (const n of model.nodes) indeg.set(n.id, incomingOf.get(n.id)?.length ?? 0);
  const queue: string[] = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  const out: string[] = [];
  while (queue.length) {
    const id = queue.shift() as string;
    out.push(id);
    for (const e of outgoingOf.get(id) ?? []) {
      const next = e.parent;
      const d = (indeg.get(next) ?? 0) - 1;
      indeg.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  if (out.length !== model.nodes.length) {
    throw new Error("cycle detected in metric graph");
  }
  return out;
}
