"use client";

/**
 * Compact embed view (iframe): canvas + north-star readout, state from the URL fragment.
 */
import { MetricCanvas } from "@/components/Canvas/MetricCanvas";
import { IllustrativeNotice } from "@/components/shared/Caveats";
import { useMetricModel } from "@/hooks/useMetricModel";
import { formatMetricValue } from "@/lib/formatMetric";

export default function EmbedPage() {
  const state = useMetricModel();
  const { model, values } = state;
  const ns = model.nodes.find((n) => n.id === model.north_star_id);
  return (
    <main className="flex h-screen flex-col gap-2 bg-bg-app p-3">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h1 className="text-sm font-bold text-text-primary">{model.name}</h1>
          <p className="text-xs text-text-muted">
            {ns?.name}: <strong className="text-text-primary">{formatMetricValue(values[model.north_star_id], ns?.unit ?? "currency")}</strong>
          </p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            // The fragment is client-only; attach it at click time to avoid a hydration mismatch.
            e.currentTarget.href = `/${window.location.hash}`;
          }}
          target="_blank" rel="noreferrer" className="text-xs text-text-secondary underline decoration-dotted">
          Open in Metric Driver-Tree Studio
        </a>
      </header>
      {state.shareError && <p role="alert" className="text-xs text-delta-negative">{state.shareError}</p>}
      <IllustrativeNotice model={model} />
      <div className="min-h-0 flex-1">
        <MetricCanvas state={state} />
      </div>
    </main>
  );
}
