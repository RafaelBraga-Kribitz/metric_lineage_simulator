/**
 * Tornado chart: north-star change when each controllable lever moves ±10%.
 * Bars are one-sided (the larger-magnitude side, signed), sorted by magnitude.
 */
"use client";

import type { MetricModelState } from "@/hooks/useMetricModel";
import { tornado } from "@/engine/sensitivity";
import { formatMetricValue, signedMetricValue } from "@/lib/formatMetric";
import { useMemo } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TornadoChart({ state }: { state: MetricModelState }) {
  const { model } = state;
  const ns = model.nodes.find((n) => n.id === model.north_star_id);
  const data = useMemo(
    () =>
      tornado(model, 0.1).map((t) => ({
        name: model.nodes.find((n) => n.id === t.leafId)?.name ?? t.leafId,
        delta: t.northStarDelta,
      })),
    [model],
  );
  const unit = ns?.unit ?? "currency";
  return (
    <figure aria-label="Tornado chart of north-star sensitivity">
      <figcaption className="mb-2 text-[11.5px] text-text-muted">
        Change in {ns?.name ?? "north star"} when each lever moves ±10% (larger side shown). Hypothesized
        edges contribute nothing, so their drivers show zero.
      </figcaption>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <XAxis
              type="number"
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              tickFormatter={(v) => formatMetricValue(Number(v), unit)}
            />
            <YAxis type="category" dataKey="name" width={170} tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }} />
            <ReferenceLine x={0} stroke="var(--color-border-default)" />
            <Tooltip
              cursor={{ fill: "var(--color-bg-card)", fillOpacity: 0.3 }}
              contentStyle={{
                background: "var(--color-bg-app)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 8,
                color: "var(--color-text-secondary)",
              }}
              formatter={(v) => [signedMetricValue(Number(v), unit), "north-star change"]}
            />
            <Bar dataKey="delta" radius={[2, 2, 2, 2]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.delta >= 0 ? "var(--color-delta-positive)" : "var(--color-delta-negative)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Tornado values</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.name}>
              <th scope="row">{d.name}</th>
              <td>{signedMetricValue(d.delta, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
