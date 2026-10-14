/**
 * Read-only prioritization view (Phase 5b minimal, ADR-0010 P1): value of information per
 * unit of test cost for the current model. Output is value of information, never impact.
 */
"use client";

import { GuessCaveat } from "@/components/shared/Caveats";
import { EvidenceGradeChip } from "@/components/shared/chips";
import { buildWorkedExample } from "@/engine/workedExample";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { formatMetricValue } from "@/lib/formatMetric";
import type { EvidenceGrade } from "@/schema/types";
import { useMemo } from "react";

const STATUS_TEXT: Record<string, string> = {
  needs_guesstimate: "needs a range first",
  point_only: "point guess only",
  not_on_path: "does not feed the north star",
  driver_not_leverable: "driver is an identity",
};

export function WhatToTestFirst({ state }: { state: MetricModelState }) {
  const { model } = state;
  const ex = useMemo(() => buildWorkedExample(model), [model]);
  const nameOf = (id: string) => model.nodes.find((n) => n.id === id)?.name ?? id;
  const label = (edge: string) => edge.split(" → ").map(nameOf).join(" → ");
  const maxVoi = Math.max(1, ...ex.rows.map((r) => r.voiScore ?? 0));
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-text-primary">{ex.decision}</p>
      <p className="text-[11.5px] text-text-muted">
        Planned decisions: pages 10% faster, email capture +10%, other drivers +10%. For each guess, only its elasticity is sampled
        ({ex.settings.runs.toLocaleString("en-US")} draws, seed {ex.settings.seed}); the bar is the P90 − P10 spread of the north star.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px] text-text-secondary">
          <caption className="sr-only">Guesses ranked by value of information per unit of test cost</caption>
          <thead className="text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th scope="col" className="py-1 pr-2">Rank</th>
              <th scope="col" className="py-1 pr-2">Guess</th>
              <th scope="col" className="py-1 pr-2">Grade</th>
              <th scope="col" className="py-1 pr-2">Value of information (P90 − P10)</th>
              <th scope="col" className="py-1 pr-2 text-right">Test cost</th>
              <th scope="col" className="py-1 text-right">Priority</th>
            </tr>
          </thead>
          <tbody>
            {ex.rows.map((r) => (
              <tr key={r.edge} className="border-t border-border-subtle align-top">
                <td className="py-1.5 pr-2 font-bold text-text-primary">{r.rank ?? "—"}</td>
                <td className="py-1.5 pr-2">
                  {label(r.edge)}
                  {r.sources.length > 0 && <div className="text-[10.5px] text-text-faint">{r.sources.length} public source(s)</div>}
                </td>
                <td className="py-1.5 pr-2">
                  <EvidenceGradeChip grade={r.grade as EvidenceGrade} />
                </td>
                <td className="py-1.5 pr-2">
                  {r.status === "scored" ? (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-32 rounded-full bg-bg-card">
                        <span className="block h-1.5 rounded-full bg-edge-modeled" style={{ width: `${((r.voiScore ?? 0) / maxVoi) * 100}%` }} />
                      </span>
                      <span className="tabular-nums">{formatMetricValue(r.voiScore, "currency")}</span>
                    </div>
                  ) : (
                    <span className="text-text-faint">{STATUS_TEXT[r.status] ?? r.status}</span>
                  )}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {r.testCost}
                  {r.testCostAssumed && <span className="text-text-faint"> (assumed)</span>}
                </td>
                <td className="py-1.5 text-right tabular-nums">{r.priorityScore === null ? "—" : r.priorityScore.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GuessCaveat />
    </div>
  );
}
