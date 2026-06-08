/**
 * Hypothesized edge: 2px dashed grey with "?" badge via EdgeLabelRenderer.
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export function HypEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "var(--color-edge-hypothesized)",
          strokeWidth: 2,
          strokeDasharray: "6 5",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full text-[11px] font-bold"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            width: 18,
            height: 18,
            background: "var(--color-grade-none-bg)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-edge-hypothesized)",
          }}
        >
          ?
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
