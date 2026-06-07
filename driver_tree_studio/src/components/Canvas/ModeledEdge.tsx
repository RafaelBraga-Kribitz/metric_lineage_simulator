/**
 * Modeled edge: 2px solid amber with evidence chip via EdgeLabelRenderer.
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { MetricEdgeData } from "./modelToFlow";

export function ModeledEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const edge = (data as MetricEdgeData | undefined)?.edge;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const chip =
    edge?.elasticity !== undefined
      ? `e=${edge.elasticity.toFixed(2)} | ${edge.evidence_grade ?? "none"}`
      : edge?.evidence_grade ?? "modeled";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "var(--color-edge-modeled)",
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute rounded-full px-1.5 py-0.5 text-[9px] font-bold lowercase tracking-wide"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "var(--color-edge-modeled)",
            color: "#ffffff",
            border: "1px solid var(--color-edge-modeled)",
          }}
        >
          {chip}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
