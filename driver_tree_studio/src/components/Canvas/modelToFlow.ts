/**
 * Converts BusinessModel nodes/edges to React Flow elements.
 * Edge direction: child → parent (cause flows toward north star).
 */
import { layoutGraph } from "@/lib/graphLayout";
import type { BusinessModel, MetricEdge } from "@/schema/types";
import type { Edge, Node } from "@xyflow/react";

export interface MetricNodeData extends Record<string, unknown> {
  node: BusinessModel["nodes"][number];
  value: number;
  baseline: number;
  selected: boolean;
}

export interface MetricEdgeData extends Record<string, unknown> {
  edge: MetricEdge;
}

export function modelToNodes(
  model: BusinessModel,
  values: Record<string, number>,
  baselineValues: Record<string, number>,
  selectedNodeId: string | null,
): Node<MetricNodeData>[] {
  const auto = layoutGraph(model);
  return model.nodes.map((n) => ({
    id: n.id,
    type: "metricNode",
    position: n.position ?? auto[n.id] ?? { x: 0, y: 0 },
    data: {
      node: n,
      value: values[n.id] ?? 0,
      baseline: baselineValues[n.id] ?? 0,
      selected: n.id === selectedNodeId,
    },
  }));
}

export function modelToEdges(model: BusinessModel): Edge<MetricEdgeData>[] {
  return model.edges.map((e, i) => ({
    id: edgeId(e, i),
    source: e.child,
    target: e.parent,
    type:
      e.kind === "identity"
        ? "identity"
        : e.kind === "modeled"
          ? "modeled"
          : "hypothesized",
    data: { edge: e },
    deletable: e.kind !== "identity",
    selectable: e.kind !== "identity",
  }));
}

export function edgeId(edge: MetricEdge, index: number): string {
  return `${edge.child}->${edge.parent}:${edge.kind}:${index}`;
}

export function findEdgeIndex(model: BusinessModel, edge: MetricEdge): number {
  return model.edges.findIndex(
    (e) =>
      e.parent === edge.parent &&
      e.child === edge.child &&
      e.kind === edge.kind,
  );
}
