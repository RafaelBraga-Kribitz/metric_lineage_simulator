/**
 * Analysis surface: sensitivity, forecast range, untested beliefs (+ data test, VoI later).
 */
"use client";

import { MonteCarloPanel } from "@/components/Analysis/MonteCarloPanel";
import { TornadoChart } from "@/components/Analysis/TornadoChart";
import { UntestedBeliefs } from "@/components/Analysis/UntestedBeliefs";
import { WhatToTestFirst } from "@/components/Analysis/WhatToTestFirst";
import { DataTestPanel } from "@/components/DataTest/DataTestPanel";
import { Tabs, type TabDef } from "@/components/shared/Tabs";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { useState } from "react";

type AnalysisTab = "testfirst" | "sensitivity" | "montecarlo" | "beliefs" | "datatest";

const TABS: TabDef<AnalysisTab>[] = [
  { id: "testfirst", label: "What to test first" },
  { id: "sensitivity", label: "Sensitivity" },
  { id: "montecarlo", label: "Forecast range" },
  { id: "beliefs", label: "Untested beliefs" },
  { id: "datatest", label: "Test with your data" },
];

export function AnalysisPanel({ state }: { state: MetricModelState }) {
  const [tab, setTab] = useState<AnalysisTab>("testfirst");
  return (
    <section aria-labelledby="analysis-heading" className="rounded-xl border border-border bg-bg-panel p-4">
      <h3 id="analysis-heading" className="mb-2 text-sm font-bold tracking-wide text-text-primary">
        Analysis
      </h3>
      <Tabs label="Analysis views" tabs={TABS} active={tab} onChange={setTab} idPrefix="analysis">
        {tab === "testfirst" && <WhatToTestFirst state={state} />}
        {tab === "sensitivity" && <TornadoChart state={state} />}
        {tab === "montecarlo" && <MonteCarloPanel state={state} />}
        {tab === "beliefs" && <UntestedBeliefs model={state.model} />}
        {tab === "datatest" && <DataTestPanel state={state} />}
      </Tabs>
    </section>
  );
}
