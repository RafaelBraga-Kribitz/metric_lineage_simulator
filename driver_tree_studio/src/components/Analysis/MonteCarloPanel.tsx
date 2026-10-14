/**
 * Monte Carlo forecast range for the north star under the declared input ranges.
 * Runs in a Web Worker; seeded and deterministic.
 */
"use client";

import { GuessCaveat } from "@/components/shared/Caveats";
import { Button } from "@/components/ui/button";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { useMonteCarlo } from "@/hooks/useMonteCarlo";
import { formatMetricValue } from "@/lib/formatMetric";
import { useEffect, useState } from "react";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RUN_OPTIONS = [1000, 5000, 20000];
const SEED = 42;

export function MonteCarloPanel({ state }: { state: MetricModelState }) {
  const { model } = state;
  const { result, running, run } = useMonteCarlo();
  const [runs, setRuns] = useState(5000);
  const ns = model.nodes.find((n) => n.id === model.north_star_id);
  const unit = ns?.unit ?? "currency";
  const fmt = (v: number) => formatMetricValue(v, unit);
  const nameOf = (id: string) => model.nodes.find((n) => n.id === id)?.name ?? id;

  useEffect(() => {
    run(model, runs, SEED);
  }, [model, runs, run]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11.5px] text-text-muted">
          Samples every controllable input from its declared range and every modeled elasticity
          from its distribution, then recomputes the tree. Inputs are sampled independently (no
          correlation between, e.g., order value and cost per order), which widens the range. Seed {SEED}.
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="Number of draws">
          {RUN_OPTIONS.map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={n === runs ? "default" : "ghost"}
              className="h-7 px-2.5"
              aria-pressed={n === runs}
              onClick={() => setRuns(n)}
            >
              {n.toLocaleString("en-US")}
            </Button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="grid grid-cols-3 gap-2.5">
        {(["p10", "p50", "p90"] as const).map((k) => (
          <div key={k} className="rounded-lg bg-bg-card/40 p-2">
            <div className="text-[11px] uppercase tracking-wide text-text-muted">{k.toUpperCase()}</div>
            <div className="text-lg font-extrabold text-text-primary">
              {result ? fmt(result[k]) : running ? "…" : "—"}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <>
          <div className="h-[180px] w-full" aria-label={`Histogram of ${result.runs} simulated ${ns?.name ?? "north star"} values`} role="img">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={result.histogram.map((b) => ({ mid: (b.from + b.to) / 2, count: b.count }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap={1}>
                <XAxis dataKey="mid" type="number" domain={["dataMin", "dataMax"]} ticks={[result.p10, result.p50, result.p90]} tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} tickFormatter={(v) => fmt(Number(v))} />
                <YAxis hide />
                <ReferenceLine x={result.p10} stroke="var(--color-text-muted)" strokeDasharray="3 3" />
                <ReferenceLine x={result.p50} stroke="var(--color-edge-identity)" />
                <ReferenceLine x={result.p90} stroke="var(--color-text-muted)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-app)", border: "1px solid var(--color-border-default)", borderRadius: 8, color: "var(--color-text-secondary)" }}
                  labelFormatter={(v) => fmt(Number(v))}
                  formatter={(v) => [String(v), "draws"]}
                />
                <Bar dataKey="count" fill="var(--color-text-faint)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-bold text-text-secondary">Which input range drives the spread</h4>
            <ul className="space-y-1">
              {result.varianceContribution.slice(0, 6).map((v) => (
                <li key={v.leafId} className="flex items-center gap-2 text-[11.5px] text-text-secondary">
                  <span className="w-44 truncate">{nameOf(v.leafId)}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-bg-card">
                    <span className="block h-1.5 rounded-full bg-edge-identity" style={{ width: `${(v.share * 100).toFixed(1)}%` }} />
                  </span>
                  <span className="w-12 text-right tabular-nums">{(v.share * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] text-text-faint">Share of squared correlation with the north star (normalised).</p>
          </div>
        </>
      )}
      <GuessCaveat />
    </div>
  );
}
