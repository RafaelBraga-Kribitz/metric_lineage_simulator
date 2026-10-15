/**
 * Analyst-stack export (ADR-0010 P4): KPI dictionary CSV, SQL view DDL and DAX measures for
 * the CURRENT model. Identities become formulas; assumptions are documented, never computed.
 */
"use client";

import { Button } from "@/components/ui/button";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { daxMeasures, kpiDefinitionsCsv, kpiRows, kpiSql } from "@/lib/exporters";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";

type Kind = "csv" | "sql" | "dax";

const FILES: Record<Kind, { label: string; name: string; mime: string }> = {
  csv: { label: "KPI dictionary (CSV)", name: "kpi_definitions.csv", mime: "text/csv" },
  sql: { label: "SQL view (DDL)", name: "kpi_tree.sql", mime: "application/sql" },
  dax: { label: "Power BI measures (DAX)", name: "measures.dax", mime: "text/plain" },
};

function download(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ state }: { state: MetricModelState }) {
  const { model, validation } = state;
  const [preview, setPreview] = useState<Kind>("dax");
  const outputs = useMemo(() => {
    try {
      return { csv: kpiDefinitionsCsv(model), sql: kpiSql(model), dax: daxMeasures(model), error: null };
    } catch (e) {
      return { csv: "", sql: "", dax: "", error: (e as Error).message };
    }
  }, [model]);
  const rows = useMemo(() => kpiRows(model), [model]);

  return (
    <div className="space-y-3">
      <p className="text-[11.5px] text-text-muted">
        Hand the tree to the BI stack: a KPI dictionary, a SQL view that recomputes every identity
        from a long <code>kpi_inputs(period, metric_id, value)</code> table, and one DAX measure per
        metric. Modeled and hypothesized edges travel as documented assumptions, never as formulas. A
        full Power BI build kit with expected values lives in <code>docs/powerbi/</code>.
      </p>
      {!validation.valid && (
        <p role="alert" className="text-[11.5px] text-warning">
          The model has validation messages; exports reflect it as-is: {validation.errors[0]}
        </p>
      )}
      {outputs.error ? (
        <p role="alert" className="text-[11.5px] text-delta-negative">{outputs.error}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILES) as Kind[]).map((k) => (
            <Button key={k} type="button" variant="outline" size="sm" onClick={() => download(FILES[k].name, FILES[k].mime, outputs[k])}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {FILES[k].label}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs font-bold text-text-secondary">Kennzahlen (DE labels are ILLUSTRATIVE)</h4>
          <div className="max-h-64 overflow-auto rounded-lg border border-border-subtle">
            <table className="w-full text-left text-[11.5px] text-text-secondary">
              <caption className="sr-only">KPI dictionary with German labels and identity formulas</caption>
              <thead className="sticky top-0 bg-bg-panel text-[10.5px] uppercase tracking-wide text-text-muted">
                <tr>
                  <th scope="col" className="px-2 py-1">Metric</th>
                  <th scope="col" className="px-2 py-1">Kennzahl</th>
                  <th scope="col" className="px-2 py-1">Formula</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.metric_id)} className="border-t border-border-subtle">
                    <td className="px-2 py-1">{r.name}</td>
                    <td className="px-2 py-1">{r.name_de || "—"}</td>
                    <td className="px-2 py-1 font-mono text-[10.5px]">{r.formula || <span className="text-text-faint">input</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2" role="group" aria-label="Preview file">
            {(Object.keys(FILES) as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={preview === k}
                onClick={() => setPreview(k)}
                className={`text-xs font-bold ${preview === k ? "text-text-primary underline" : "text-text-muted"}`}
              >
                {FILES[k].name}
              </button>
            ))}
          </div>
          <pre aria-label={`Preview of ${FILES[preview].name}`} className="max-h-64 overflow-auto rounded-lg border border-border-subtle bg-bg-input p-2 font-mono text-[10.5px] text-text-secondary">
            {outputs[preview]}
          </pre>
        </div>
      </div>
    </div>
  );
}
