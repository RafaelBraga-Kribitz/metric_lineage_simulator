/**
 * Collapsible assumptions ledger listing modeled and hypothesized edges.
 */
"use client";

import {
  EdgeKindChip,
  EvidenceGradeChip,
} from "@/components/shared/chips";
import type { BusinessModel } from "@/schema/types";
import { useState } from "react";

const LEDGER_DISCLAIMER =
  "Modeled edges use illustrative elasticities. Hypothesized edges have no quantification. Neither should be treated as empirical evidence.";

interface AssumptionsLedgerProps {
  model: BusinessModel;
}

export function AssumptionsLedger({ model }: AssumptionsLedgerProps) {
  const [open, setOpen] = useState(false);
  const assumptionEdges = model.edges.filter(
    (e) => e.kind === "modeled" || e.kind === "hypothesized",
  );
  const nameOf = (id: string) =>
    model.nodes.find((n) => n.id === id)?.name ?? id;

  return (
    <div className="bg-bg-panel border border-border rounded-xl p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between border-none bg-transparent text-text-primary"
        onClick={() => setOpen((v) => !v)}
      >
        <h3 className="text-sm font-bold tracking-wide">Assumptions ledger</h3>
        <span className="text-xs text-text-muted">{open ? "− hide" : "+ show"}</span>
      </button>

      {open && (
        <div className="mt-3">
          <p className="mb-3 rounded-lg border border-[#78350f] bg-[#78350f33] px-3 py-1.5 text-[11.5px] text-[#FBBF24]">
            {LEDGER_DISCLAIMER}
          </p>
          <p className="mb-2 text-xs font-bold text-text-secondary">
            All assumptions are declared. None are hidden.
          </p>

          <div className="space-y-2">
            {assumptionEdges.map((e, i) => {
              const isTrap =
                e.child === "loyalty_membership" && e.parent === "customer_ltv";
              return (
                <div
                  key={`${e.parent}-${e.child}-${i}`}
                  className={`rounded-lg border border-border-subtle p-2 ${isTrap ? "border-warning bg-bg-card" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {nameOf(e.parent)}{" "}
                      <span className="text-text-faint">←</span>{" "}
                      {nameOf(e.child)}
                    </span>
                    <EdgeKindChip kind={e.kind} />
                    {e.evidence_grade && (
                      <EvidenceGradeChip grade={e.evidence_grade} />
                    )}
                  </div>
                  {(e.rationale || e.mechanism) && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-text-muted">
                      {e.rationale ?? e.mechanism}
                    </p>
                  )}
                  {isTrap && (
                    <p className="mt-1 text-[11px] text-warning">
                      Selection trap: cohort correlation is not causal lift.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
