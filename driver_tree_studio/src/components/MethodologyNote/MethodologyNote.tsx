/**
 * Permanently visible methodology bar (48px collapsed) with one-click expand.
 */
"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";

const COLLAPSED =
  "This tool separates identities, declared assumptions, and untested beliefs. Click to read more.";

const EXPANDED = `This tool separates three kinds of metric relationship:
Identity: true by definition, computes exactly.
Modeled: a declared behavioral assumption with an elasticity. Flagged and editable.
Hypothesized: a directional belief with no quantification. Not included in computation.
This distinction follows the practice of building a causal structure (DAG) before
quantifying it. Real elasticities require data and a causal identification strategy.
This tool is a thinking aid, not an econometric model.`;

export function MethodologyNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-20 border-t border-border bg-bg-panel">
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between px-4 text-left text-xs text-text-secondary hover:bg-bg-card"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-text-muted" />
          {COLLAPSED}
        </span>
        <span className="text-text-muted">{open ? "−" : "?"}</span>
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto border-t border-border-subtle px-4 py-3 text-[11.5px] leading-relaxed text-text-secondary whitespace-pre-line">
          {EXPANDED}
        </div>
      )}
    </div>
  );
}
