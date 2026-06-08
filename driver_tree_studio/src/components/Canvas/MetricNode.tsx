/**
 * Custom React Flow metric node: layer badge, name, value, delta from baseline.
 */
import { getLayerStyles, layerLabel } from "@/components/shared/chips";
import {
  formatMetricValue,
  pctChange,
} from "@/lib/formatMetric";
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo } from "react";
import type { MetricNodeData } from "./modelToFlow";

function MetricNodeComponent({ data }: NodeProps<Node<MetricNodeData, "metricNode">>) {
  const { node, value, baseline, selected } = data;
  const styles = getLayerStyles(node.layer);
  const delta = value - baseline;
  const deltaUp = delta >= 0;

  return (
    <div
      className="relative overflow-visible rounded-[10px] border transition-[border-color] duration-150"
      style={{
        width: 152,
        height: 56,
        background: styles.fill,
        color: styles.text,
        borderColor: selected ? styles.hoverBorder : "var(--color-border-default)",
        borderWidth: selected ? 2 : 1,
      }}
    >
      {/* child → parent flows upward (NSM on top): source exits top, target enters bottom */}
      <Handle type="target" position={Position.Bottom} className="!bg-edge-identity !w-2 !h-2" />
      <Handle type="source" position={Position.Top} className="!bg-edge-identity !w-2 !h-2" />

      <div className="flex h-full flex-col gap-0.5 overflow-hidden px-2 py-1">
        <span
          className="inline-block w-fit shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase leading-none tracking-wide"
          style={{ background: styles.badgeBg, color: styles.badgeText }}
        >
          {layerLabel(node.layer)}
        </span>
        <div className="flex min-h-0 flex-1 items-center">
          <div className="w-full truncate text-[10px] font-semibold leading-[13px]">
            {node.name}
          </div>
        </div>
        <div className="flex shrink-0 items-baseline justify-between gap-1 text-[10.5px] font-extrabold leading-none">
          <span>{formatMetricValue(value, node.unit)}</span>
          {Math.abs(delta) > 1e-9 && (
            <span
              className="text-[10px] font-bold"
              style={{
                color: deltaUp
                  ? "var(--color-delta-positive)"
                  : "var(--color-delta-negative)",
              }}
            >
              {pctChange(value, baseline)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const MetricNode = memo(MetricNodeComponent);
