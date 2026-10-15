/**
 * Verbatim caveats from CLAUDE_DESIGN_SYSTEM.md §6–§7. Never paraphrase.
 */
import { GUESS_CAVEAT } from "@/engine/valueOfInformation";
import type { BusinessModel } from "@/schema/types";
import { AlertTriangle } from "lucide-react";

export const ILLUSTRATIVE_NOTICE =
  "Illustrative DTC e-commerce model. Numbers are placeholders, not estimated from data.";

export function hasIllustrativeEdges(model: BusinessModel): boolean {
  return model.edges.some((e) => e.evidence_grade === "illustrative");
}

export function IllustrativeNotice({ model }: { model: BusinessModel }) {
  if (!hasIllustrativeEdges(model)) return null;
  return (
    <div
      role="note"
      className="rounded-lg border border-notice-border bg-notice-bg px-3 py-1.5 text-[11.5px] text-notice-text"
    >
      {ILLUSTRATIVE_NOTICE}
    </div>
  );
}

export function GuessCaveat() {
  return (
    <div
      role="note"
      className="flex gap-2 rounded-lg border border-caveat-border bg-caveat-bg px-3 py-2 text-[11.5px] font-semibold text-caveat-text"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{GUESS_CAVEAT}</span>
    </div>
  );
}
