/**
 * Identity edge: 4px solid blue, no badge.
 */
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
export function IdentityEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: "var(--color-edge-identity)",
        strokeWidth: 4,
      }}
    />
  );
}

export const identityEdgeDefaults = {
  type: "identity" as const,
};
