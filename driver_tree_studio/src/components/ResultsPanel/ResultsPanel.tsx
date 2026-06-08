/**
 * Results panel: north-star headline, supporting metrics, bar chart or funnel toggle.
 *
 * @example
 * <ResultsPanel state={useMetricModel()} />
 */
"use client";

import { FunnelChart } from "@/components/FunnelChart/FunnelChart";
import { Button } from "@/components/ui/button";
import type { MetricModelState } from "@/hooks/useMetricModel";
import {
  formatMetricValue,
  pctChange,
  signedMetricValue,
} from "@/lib/formatMetric";
import { buildFunnelStages, hasFunnelStages } from "@/lib/funnelStages";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ResultsView = "metrics" | "funnel";

interface ResultsPanelProps {
  state: MetricModelState;
}

export function ResultsPanel({ state }: ResultsPanelProps) {
  const { values, baselineValues, model } = state;
  const [view, setView] = useState<ResultsView>("metrics");

  const showFunnel = hasFunnelStages(model);
  const funnelStages = useMemo(
    () => (showFunnel ? buildFunnelStages(model, values) : null),
    [showFunnel, model, values],
  );

  const profit = values.contribution_profit ?? 0;
  const profitBase = baselineValues.contribution_profit ?? 0;
  const dProfit = profit - profitBase;

  const rows = [
    { id: "net_revenue", name: "Net Revenue", higherBetter: true },
    { id: "variable_costs", name: "Variable Costs", higherBetter: false },
  ] as const;

  const chartData = [
    {
      name: "Contrib. Profit",
      baseline: profitBase,
      current: profit,
    },
    {
      name: "Net Revenue",
      baseline: baselineValues.net_revenue ?? 0,
      current: values.net_revenue ?? 0,
    },
    {
      name: "Var. Costs",
      baseline: baselineValues.variable_costs ?? 0,
      current: values.variable_costs ?? 0,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-bg-panel p-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold tracking-wide text-text-primary">
          Results
        </h3>
        {showFunnel && (
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={view === "metrics" ? "default" : "ghost"}
              size="sm"
              className={cn("h-7 px-2.5", view !== "metrics" && "text-text-muted")}
              onClick={() => setView("metrics")}
            >
              Metrics
            </Button>
            <Button
              type="button"
              variant={view === "funnel" ? "default" : "ghost"}
              size="sm"
              className={cn("h-7 px-2.5", view !== "funnel" && "text-text-muted")}
              onClick={() => setView("funnel")}
            >
              Funnel
            </Button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-[11px] uppercase tracking-wide text-text-muted">
          Contribution Profit (north star)
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-text-primary">
          {formatMetricValue(profit, "currency")}
        </div>
        <div
          className={cn(
            "text-xs",
            dProfit >= 0 ? "text-delta-positive" : "text-delta-negative",
          )}
        >
          {signedMetricValue(dProfit, "currency")} ({pctChange(profit, profitBase)})
          vs baseline
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        {rows.map((r) => {
          const cur = values[r.id] ?? 0;
          const b = baselineValues[r.id] ?? 0;
          const d = cur - b;
          const good = r.higherBetter ? d >= 0 : d <= 0;
          return (
            <div key={r.id} className="rounded-lg bg-bg-card/40 p-2">
              <div className="text-[11px] text-text-muted">{r.name}</div>
              <div className="text-sm font-bold text-text-primary">
                {formatMetricValue(cur, "currency")}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  good ? "text-delta-positive" : "text-delta-negative",
                )}
              >
                {signedMetricValue(d, "currency")} ({pctChange(cur, b)})
              </div>
            </div>
          );
        })}
      </div>

      {view === "funnel" && funnelStages ? (
        <FunnelChart stages={funnelStages} />
      ) : (
        <>
          <div className="mb-2 flex gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-text-faint" />
              Baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm bg-edge-identity" />
              Current
            </span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-default)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
                  width={48}
                  tickFormatter={(v) =>
                    "\u20AC" + (Number(v) / 1000).toFixed(0) + "k"
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{
                    background: "var(--color-bg-app)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 8,
                    color: "var(--color-text-secondary)",
                  }}
                  formatter={(v, key) => [
                    formatMetricValue(Number(v), "currency"),
                    key === "baseline" ? "Baseline" : "Current",
                  ]}
                />
                <Bar
                  dataKey="baseline"
                  fill="var(--color-text-faint)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="current"
                  fill="var(--color-edge-identity)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
