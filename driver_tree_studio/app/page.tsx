"use client";

/**
 * Main application shell: header, three-panel layout, methodology bar.
 */
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { MetricCanvas } from "@/components/Canvas/MetricCanvas";
import { LeftSidebar } from "@/components/LeftSidebar/LeftSidebar";
import { MethodologyNote } from "@/components/MethodologyNote/MethodologyNote";
import { MetricInspector } from "@/components/MetricInspector/MetricInspector";
import { FormulaField } from "@/components/VerbalBuilder/FormulaField";
import { useMetricModel } from "@/hooks/useMetricModel";

export default function HomePage() {
  const state = useMetricModel();
  const { setSelectedNodeId } = state;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-app">
      <AppHeader state={state} />
      <div className="flex min-h-0 flex-1">
        <LeftSidebar
          state={state}
          onSelectNode={setSelectedNodeId}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
          <MetricCanvas state={state} />
          <FormulaField state={state} />
        </main>
        <MetricInspector state={state} />
      </div>
      <MethodologyNote />
    </div>
  );
}
