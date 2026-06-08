/**
 * Horizontal session-to-order funnel: absolute counts per stage and conversion % between stages.
 *
 * @example
 * <FunnelChart stages={buildFunnelStages(model, values)!} />
 */
"use client";

import { formatMetricValue } from "@/lib/formatMetric";
import type { FunnelStage } from "@/lib/funnelStages";

interface FunnelChartProps {
  stages: FunnelStage[] | null;
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (!stages || stages.length === 0) return null;

  const maxCount = stages[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-3 py-1">
      {stages.map((stage, index) => {
        const widthPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const minWidth = Math.max(widthPct, 8);

        return (
          <div key={stage.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary">
                {stage.label}
              </span>
              <span className="text-xs font-bold text-text-primary">
                {formatMetricValue(stage.count, "count")}
              </span>
            </div>
            <div className="relative h-7 w-full overflow-hidden rounded-md bg-bg-input">
              <div
                className="flex h-full items-center rounded-md bg-edge-identity transition-all duration-300"
                style={{ width: `${minWidth}%` }}
              />
            </div>
            {stage.conversionToNext != null && index < stages.length - 1 && (
              <div className="text-[11px] text-text-muted">
                → {formatMetricValue(stage.conversionToNext, "percent")} to{" "}
                {stages[index + 1]?.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
