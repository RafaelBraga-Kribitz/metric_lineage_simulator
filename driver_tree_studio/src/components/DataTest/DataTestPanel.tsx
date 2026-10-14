/**
 * Bring-your-own-data test (ADR-0008 Phase 3b). The CSV is parsed in the browser and never
 * leaves it. Verdict wording separates association from effect; a fixed causal note and a
 * "what would prove this" design accompany every result.
 */
"use client";

import { EdgeKindChip, EvidenceGradeChip } from "@/components/shared/chips";
import { Button } from "@/components/ui/button";
import {
  acceptEstimate,
  estimateRelationship,
  type EstimateResult,
  type StudyDesign,
} from "@/engine/estimate";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { pairedColumns, parseCsv, type CsvTable } from "@/lib/csv";
import { SAMPLE_NOTE, syntheticLoyaltyCsv } from "@/lib/sampleData";
import { cn } from "@/lib/utils";
import type { MetricEdge } from "@/schema/types";
import { AlertTriangle, FlaskConical, Upload } from "lucide-react";
import { useId, useMemo, useState, type ChangeEvent, type DragEvent } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

const edgeKey = (e: MetricEdge) => `${e.child}->${e.parent}:${e.kind}`;

const fieldClass =
  "h-9 w-full rounded-md border border-border bg-bg-input px-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-edge-identity";

function guessColumn(headers: string[], id: string, fallbackIndex: number): string {
  return headers.find((h) => h.toLowerCase() === id.toLowerCase()) ?? headers[fallbackIndex] ?? "";
}

function fmt(v: number | null | undefined, digits = 3): string {
  return v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toFixed(digits);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-bg-card/40 p-2">
      <dt className="text-[11px] text-text-muted">{label}</dt>
      <dd className="text-sm font-bold tabular-nums text-text-primary">{value}</dd>
      {hint && <dd className="text-[10.5px] text-text-faint">{hint}</dd>}
    </div>
  );
}

function VerdictCard({ result }: { result: EstimateResult }) {
  const supportive = result.verdict === "association_found" || result.verdict === "association_matches_direction";
  return (
    <div className="space-y-3">
      <p
        className={cn(
          "rounded-lg border px-3 py-2 text-sm font-bold",
          supportive ? "border-recon-ok-border bg-recon-ok-bg text-delta-positive" : "border-border bg-bg-card/40 text-text-secondary",
        )}
      >
        {result.verdictText}
      </p>
      {result.leakageWarning && (
        <p role="alert" className="flex gap-2 rounded-lg border border-caveat-border bg-caveat-bg px-3 py-2 text-[11.5px] font-semibold text-caveat-text">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {result.leakageWarning}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Usable rows (n)" value={String(result.n)} hint={result.nDropped ? `${result.nDropped} dropped` : undefined} />
        <Stat
          label="Correlation r"
          value={fmt(result.pearsonR)}
          hint={result.rCi95 ? `95% CI ${fmt(result.rCi95[0])} to ${fmt(result.rCi95[1])}` : undefined}
        />
        <Stat
          label="OLS slope"
          value={fmt(result.ols?.slope, 4)}
          hint={result.ols ? `95% CI ${fmt(result.ols.slopeCi95[0], 4)} to ${fmt(result.ols.slopeCi95[1], 4)}` : undefined}
        />
        <Stat
          label="Elasticity at means"
          value={fmt(result.elasticityAtMeans)}
          hint={result.elasticitySe !== null ? `± ${fmt(result.elasticitySe)} (1 s.e.)` : undefined}
        />
        <Stat label="In-sample r²" value={fmt(result.ols?.r2)} />
        <Stat label="Out-of-sample r² (80/20)" value={fmt(result.outOfSampleR2)} hint="seeded split; lower than in-sample is normal" />
      </dl>
      {result.warnings.length > 0 && (
        <ul className="list-disc pl-5 text-[11.5px] text-warning">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <div className="rounded-lg border border-notice-border bg-notice-bg px-3 py-2 text-[11.5px] text-notice-text">
        <strong>Read this first.</strong> {result.causalNote}
      </div>
      <div className="rounded-lg border border-border-subtle px-3 py-2 text-[11.5px] text-text-secondary">
        <strong>What would prove this.</strong> {result.whatWouldProveThis}
      </div>
    </div>
  );
}

export function DataTestPanel({ state }: { state: MetricModelState }) {
  const { model, setModel } = state;
  const ids = useId();
  const testable = useMemo(() => model.edges, [model.edges]);
  const firstHyp = testable.find((e) => e.kind === "hypothesized") ?? testable[0];
  const [selectedKey, setSelectedKey] = useState<string>(firstHyp ? edgeKey(firstHyp) : "");
  const [table, setTable] = useState<CsvTable | null>(null);
  const [source, setSource] = useState<string>("");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [design, setDesign] = useState<StudyDesign>("observational");
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const edge = testable.find((e) => edgeKey(e) === selectedKey) ?? firstHyp;
  const nameOf = (id: string) => model.nodes.find((n) => n.id === id)?.name ?? id;

  const loadText = (text: string, label: string, forEdge: MetricEdge | undefined = edge) => {
    const t = parseCsv(text);
    setTable(t);
    setSource(label);
    setMessage(null);
    if (forEdge) {
      setXCol(guessColumn(t.headers, forEdge.child, 0));
      setYCol(guessColumn(t.headers, forEdge.parent, 1));
    }
  };

  // The synthetic file is about loyalty -> LTV; point the test at that edge when present.
  const loadSample = () => {
    const loyalty = testable.find((e) => e.child === "loyalty_membership" && e.parent === "customer_ltv");
    if (loyalty) setSelectedKey(edgeKey(loyalty));
    loadText(syntheticLoyaltyCsv(), "synthetic example", loyalty ?? edge);
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setMessage("File is larger than 5 MB. Aggregate it (e.g. weekly) before testing.");
      return;
    }
    loadText(await file.text(), file.name);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    void loadFile(e.dataTransfer.files[0]);
  };

  const result = useMemo(() => {
    if (!table || !edge || !xCol || !yCol) return null;
    const { x, y } = pairedColumns(table, xCol, yCol);
    return estimateRelationship(x, y, {
      edge,
      design,
      childName: nameOf(edge.child),
      parentName: nameOf(edge.parent),
    });
    // nameOf depends on model.nodes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, edge, xCol, yCol, design, model.nodes]);

  const accept = () => {
    if (!edge || !result) return;
    const out = acceptEstimate(model, edge, result);
    setMessage(out.reason);
    if (out.accepted) {
      setModel(out.model);
      const updated = out.model.edges.find((e) => e.child === edge.child && e.parent === edge.parent);
      if (updated) setSelectedKey(edgeKey(updated));
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11.5px] text-text-muted">
        Test one relationship against your own data. The file is read in your browser and never uploaded.
        Comma or semicolon CSV; decimal commas are understood.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-edge`} className="mb-1 block text-xs font-bold text-text-secondary">
            Relationship to test
          </label>
          <select id={`${ids}-edge`} className={fieldClass} value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
            {testable.map((e) => (
              <option key={edgeKey(e)} value={edgeKey(e)}>
                {nameOf(e.child)} → {nameOf(e.parent)} ({e.kind})
              </option>
            ))}
          </select>
          {edge && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <EdgeKindChip kind={edge.kind} />
              {edge.evidence_grade && <EvidenceGradeChip grade={edge.evidence_grade} />}
              {edge.direction && <span className="text-[11px] text-text-muted">hypothesized direction: {edge.direction}</span>}
            </div>
          )}
        </div>
        <fieldset>
          <legend className="mb-1 block text-xs font-bold text-text-secondary">How was the driver assigned?</legend>
          <div className="flex flex-col gap-1 text-[12.5px] text-text-secondary">
            <label className="flex items-center gap-2">
              <input type="radio" name={`${ids}-design`} checked={design === "observational"} onChange={() => setDesign("observational")} />
              Observed (it varied on its own): association only
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name={`${ids}-design`} checked={design === "randomized"} onChange={() => setDesign("randomized")} />
              Randomized by us (A/B test, holdout)
            </label>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        <label
          htmlFor={`${ids}-file`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-[72px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-[12.5px] text-text-secondary focus-within:ring-1 focus-within:ring-edge-identity",
            dragging ? "border-edge-identity bg-bg-card/60" : "border-border",
          )}
        >
          <Upload className="h-4 w-4" aria-hidden />
          <span>Drop a CSV here or choose a file</span>
          <input
            id={`${ids}-file`}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e: ChangeEvent<HTMLInputElement>) => void loadFile(e.target.files?.[0])}
          />
        </label>
        <Button type="button" variant="outline" className="h-auto min-h-[72px]" onClick={loadSample}>
          <FlaskConical className="mr-2 h-4 w-4" aria-hidden />
          Load synthetic example
        </Button>
      </div>
      {source === "synthetic example" && <p className="text-[11px] text-notice-text">{SAMPLE_NOTE}</p>}

      {table && (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-x`} className="mb-1 block text-xs font-bold text-text-secondary">
              Driver column ({edge ? nameOf(edge.child) : "x"})
            </label>
            <select id={`${ids}-x`} className={fieldClass} value={xCol} onChange={(e) => setXCol(e.target.value)}>
              {table.headers.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-y`} className="mb-1 block text-xs font-bold text-text-secondary">
              Metric column ({edge ? nameOf(edge.parent) : "y"})
            </label>
            <select id={`${ids}-y`} className={fieldClass} value={yCol} onChange={(e) => setYCol(e.target.value)}>
              {table.headers.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-text-faint md:col-span-2">
            {source}: {table.rows.length} rows, {table.headers.length} columns, delimiter “{table.delimiter}”.
          </p>
        </div>
      )}

      <div aria-live="polite">
        {result && <VerdictCard result={result} />}
      </div>

      {result && edge && edge.kind !== "identity" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={accept}>
            Accept and update the edge
          </Button>
          <span className="text-[11px] text-text-muted">
            Promotes the edge to modeled with an {design === "randomized" ? "experimental" : "observational"} grade. Refused when the
            data does not support the declared direction.
          </span>
        </div>
      )}
      {message && (
        <p role="status" className="text-[12px] text-text-secondary">
          {message}
        </p>
      )}
    </div>
  );
}
