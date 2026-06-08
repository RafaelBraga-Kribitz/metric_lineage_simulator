/**
 * App header with title and identity reconciliation badge.
 */
"use client";

import type { MetricModelState } from "@/hooks/useMetricModel";
import { PanelLeft } from "lucide-react";

interface AppHeaderProps {
  state: MetricModelState;
  leftPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
}

export function AppHeader({
  state,
  leftPanelOpen = false,
  onToggleLeftPanel,
}: AppHeaderProps) {
  const { identityReconciled, validationWarnings } = state;

  return (
    <header className="flex items-center justify-between border-b border-border bg-bg-panel px-4 py-3">
      <div className="flex items-center gap-3">
        {onToggleLeftPanel && (
          <button
            type="button"
            onClick={onToggleLeftPanel}
            className={`rounded-md border p-2 text-text-muted hover:bg-bg-card hover:text-text-primary ${
              leftPanelOpen ? "border-edge-identity text-text-primary" : "border-border"
            }`}
            aria-label={leftPanelOpen ? "Hide model panel" : "Show model panel"}
            aria-pressed={leftPanelOpen}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-text-primary">
            Metric Driver-Tree Studio
          </h1>
          <p className="text-xs text-text-muted">{state.model.name}</p>
        </div>
      </div>
      <div className="flex max-w-md flex-col items-end gap-1">
        <div
          className={`flex flex-col gap-0.5 rounded-[10px] px-3 py-2 text-xs font-bold ${
            identityReconciled
              ? "border border-[#065f46] bg-[#052e1f] text-delta-positive"
              : "border border-[#7f1d1d] bg-[#3f1d1d] text-delta-negative"
          }`}
        >
          <span>{identityReconciled ? "✓" : "✗"} Identity reconciled</span>
          <span className="text-[11px] font-medium opacity-85">
            {identityReconciled ? "computed = baseline" : reconciliationErrorsText(state)}
          </span>
        </div>
        {validationWarnings.length > 0 && (
          <p className="text-right text-[10px] text-warning">
            {validationWarnings[0]}
            {validationWarnings.length > 1
              ? ` (+${validationWarnings.length - 1} more)`
              : ""}
          </p>
        )}
      </div>
    </header>
  );
}

function reconciliationErrorsText(state: MetricModelState): string {
  const msg = state.validation.errors.find((e) =>
    e.startsWith("[reconciliation]"),
  );
  return msg ?? "identity parents do not reconcile to baseline";
}
