/**
 * Lever sliders for all is_controllable nodes (50%–200% of baseline).
 */
"use client";

import { Slider } from "@/components/ui/slider";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { formatMetricValue, pctChange } from "@/lib/formatMetric";

interface LeverPanelProps {
  state: MetricModelState;
  onSelectNode: (id: string) => void;
}

export function LeverPanel({ state, onSelectNode }: LeverPanelProps) {
  const { model, values, levers, setLevers } = state;
  const controllable = model.nodes.filter((n) => n.is_controllable);

  return (
    <div className="bg-bg-panel border border-border rounded-xl p-4 mb-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold tracking-wide text-text-primary">Levers</h3>
        <span
          className="cursor-help text-xs text-text-muted"
          title="Modeled effects compose multiplicatively and independently (declared assumption)."
        >
          modeled composition
        </span>
      </div>
      <p className="mb-3 text-[11.5px] text-text-muted">
        Range is 50% to 200% of baseline. Moving a lever recomputes the whole tree.
      </p>

      {controllable.map((n) => {
        const base = n.baseline;
        const multiplier = levers[n.id]?.value ?? 1;
        const val = values[n.id] ?? base;
        return (
          <div
            key={n.id}
            className="border-b border-border-subtle py-2 last:border-0"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <button
                type="button"
                className="text-left text-xs text-text-secondary hover:text-text-primary"
                onClick={() => onSelectNode(n.id)}
              >
                {n.name}
              </button>
              <span className="text-xs font-bold">
                {formatMetricValue(val, n.unit)}{" "}
                <span
                  className={
                    val >= base ? "text-delta-positive" : "text-delta-negative"
                  }
                >
                  {pctChange(val, base)}
                </span>
              </span>
            </div>
            <Slider
              min={0.5}
              max={2}
              step={0.01}
              value={[multiplier]}
              onValueChange={([v]) => {
                const next = v ?? 1;
                setLevers((prev) => ({
                  ...prev,
                  [n.id]: { mode: "multiplier", value: next },
                }));
              }}
              style={{
                accentColor:
                  Math.abs(val - base) > 1e-9
                    ? "var(--color-edge-identity)"
                    : "#6B7280",
              }}
            />
          </div>
        );
      })}

      <button
        type="button"
        className="mt-3 text-xs text-text-muted hover:text-text-secondary"
        onClick={() => setLevers({})}
      >
        Reset all levers
      </button>
    </div>
  );
}
