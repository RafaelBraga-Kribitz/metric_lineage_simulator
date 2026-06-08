"use client";

/**
 * Main application shell: header, map viewport, scrollable controls, methodology bar.
 */
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { AssumptionsLedger } from "@/components/AssumptionsLedger/AssumptionsLedger";
import { MetricCanvas } from "@/components/Canvas/MetricCanvas";
import { LeftSidebar } from "@/components/LeftSidebar/LeftSidebar";
import { LeverPanel } from "@/components/LeverPanel/LeverPanel";
import { MethodologyNote } from "@/components/MethodologyNote/MethodologyNote";
import { MetricInspector } from "@/components/MetricInspector/MetricInspector";
import { ResultsPanel } from "@/components/ResultsPanel/ResultsPanel";
import { FormulaField } from "@/components/VerbalBuilder/FormulaField";
import { useMetricModel } from "@/hooks/useMetricModel";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

/** Map zone height: viewport minus header (~4.5rem) and collapsed methodology (3rem). */
const MAP_MIN_HEIGHT = "min-h-[calc(100dvh-7.5rem)]";

export default function HomePage() {
  const state = useMetricModel();
  const { setSelectedNodeId, selectedNodeId } = state;
  const [leftOpen, setLeftOpen] = useState(false);

  const closeInspector = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeInspector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeInspector]);

  const inspectorOpen = selectedNodeId != null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-app">
      <AppHeader
        state={state}
        leftPanelOpen={leftOpen}
        onToggleLeftPanel={() => setLeftOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className={`flex ${MAP_MIN_HEIGHT} shrink-0`}>
          <AnimatePresence initial={false}>
            {leftOpen && (
              <motion.div
                key="left-sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="shrink-0 overflow-hidden"
              >
                <LeftSidebar state={state} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex min-w-0 flex-1 flex-col p-4">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold tracking-wide text-text-primary">
                Driver Tree
              </h2>
              <span className="text-[11px] text-text-muted">
                Edges flow child to parent toward the north star
              </span>
            </div>
            <div className="min-h-0 flex-1">
              <MetricCanvas state={state} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 pt-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr]">
            <LeverPanel state={state} onSelectNode={setSelectedNodeId} />
            <ResultsPanel state={state} />
          </div>
          <AssumptionsLedger model={state.model} />
          <FormulaField state={state} />
        </div>
      </div>

      <MethodologyNote />

      <div
        className={`fixed inset-0 z-30 bg-black/55 transition-opacity ${
          inspectorOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeInspector}
        aria-hidden={!inspectorOpen}
      />
      <MetricInspector state={state} open={inspectorOpen} onClose={closeInspector} />
    </div>
  );
}
