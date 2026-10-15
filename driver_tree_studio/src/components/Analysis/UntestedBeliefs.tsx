/**
 * Untested beliefs: every hypothesized edge, what it claims, and why it is not computed.
 */
"use client";

import { EvidenceGradeChip } from "@/components/shared/chips";
import type { BusinessModel } from "@/schema/types";

const DIRECTION_WORD = { increases: "raises", decreases: "lowers", unclear: "moves" } as const;

export function UntestedBeliefs({ model }: { model: BusinessModel }) {
  const beliefs = model.edges.filter((e) => e.kind === "hypothesized");
  const nameOf = (id: string) => model.nodes.find((n) => n.id === id)?.name ?? id;
  if (beliefs.length === 0) {
    return <p className="text-[11.5px] text-text-muted">No hypothesized edges. Every relationship is either an identity or a declared assumption.</p>;
  }
  return (
    <div>
      <p className="mb-2 text-[11.5px] text-text-muted">
        These beliefs are drawn on the canvas (grey dashed, “?”) but contribute nothing to any number.
        Each needs a guesstimate range or a data test before it can.
      </p>
      <ul className="space-y-2">
        {beliefs.map((e) => (
          <li key={`${e.child}->${e.parent}`} className="rounded-lg border border-border-subtle p-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span
                aria-hidden
                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-edge-hypothesized text-[11px] font-bold text-bg-app"
              >
                ?
              </span>
              <span>
                Belief: <strong>{nameOf(e.child)}</strong> {DIRECTION_WORD[e.direction ?? "unclear"]}{" "}
                <strong>{nameOf(e.parent)}</strong>
              </span>
              <EvidenceGradeChip grade={e.evidence_grade ?? "none"} />
            </div>
            {e.rationale && <p className="mt-1 text-[11.5px] text-text-muted">{e.rationale}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
