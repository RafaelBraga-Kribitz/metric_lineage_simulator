/**
 * Inspector drawer: node details, governance, incoming edges (slides in from right).
 */
"use client";

import {
  EdgeKindChip,
  EvidenceGradeChip,
  getLayerStyles,
  layerLabel,
} from "@/components/shared/chips";
import type { MetricModelState } from "@/hooks/useMetricModel";
import {
  formatMetricValue,
  pctChange,
  signedMetricValue,
} from "@/lib/formatMetric";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface MetricInspectorProps {
  state: MetricModelState;
  open: boolean;
  onClose: () => void;
}

export function MetricInspector({ state, open, onClose }: MetricInspectorProps) {
  const { model, selectedNodeId, values, baselineValues } = state;
  const node = model.nodes.find((n) => n.id === selectedNodeId);
  const incoming = node ? model.edges.filter((e) => e.parent === node.id) : [];
  const layerStyles = node ? getLayerStyles(node.layer) : null;

  return (
    <motion.aside
      className="fixed right-0 top-0 z-40 h-full w-[min(400px,92vw)] overflow-y-auto border-l border-border bg-bg-app p-4 shadow-[-12px_0_40px_rgba(0,0,0,0.5)]"
      initial={false}
      animate={{ x: open && node ? 0 : "101%" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      aria-hidden={!open || !node}
    >
      <AnimatePresence mode="wait">
        {node && (
          <motion.div
            key={node.id}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                Metric inspector
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-text-muted hover:bg-bg-card hover:text-text-primary"
                aria-label="Close inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <hr className="mb-3 border-border" />

            {layerStyles && (
              <span
                className="mb-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background: layerStyles.badgeBg,
                  color: layerStyles.badgeText,
                }}
              >
                {layerLabel(node.layer)}
              </span>
            )}

            <h2 className="text-lg font-bold text-text-primary">{node.name}</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-text-muted">
              {node.definition}
            </p>

            <hr className="my-3 border-border" />

            <div className="grid grid-cols-3 gap-2 text-[11px] text-text-muted">
              <span>Current</span>
              <span>Baseline</span>
              <span>Delta</span>
              <span className="text-base font-extrabold text-text-primary">
                {formatMetricValue(values[node.id], node.unit)}
              </span>
              <span className="text-base font-extrabold text-text-primary">
                {formatMetricValue(baselineValues[node.id], node.unit)}
              </span>
              <span
                className={`text-base font-extrabold ${
                  (values[node.id] ?? 0) >= (baselineValues[node.id] ?? 0)
                    ? "text-delta-positive"
                    : "text-delta-negative"
                }`}
              >
                {signedMetricValue(
                  (values[node.id] ?? 0) - (baselineValues[node.id] ?? 0),
                  node.unit,
                )}{" "}
                <span className="text-[10px]">
                  {pctChange(values[node.id] ?? 0, baselineValues[node.id] ?? 0)}
                </span>
              </span>
            </div>

            {node.explainer && (
              <p className="mt-3 text-xs text-text-secondary">{node.explainer}</p>
            )}

            <h3 className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Components / drivers
            </h3>
            <div className="space-y-2">
              {incoming.map((e, i) => {
                const child = model.nodes.find((n) => n.id === e.child);
                return (
                  <div
                    key={`${e.child}-${i}`}
                    className="rounded-lg border border-border-subtle p-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <EdgeKindChip kind={e.kind} />
                      {e.evidence_grade && (
                        <EvidenceGradeChip grade={e.evidence_grade} />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      {child?.name ?? e.child}
                      {e.formula_role ? ` (${e.formula_role})` : ""}
                      {e.elasticity !== undefined ? ` · e=${e.elasticity}` : ""}
                    </p>
                    {(e.rationale || e.mechanism || e.evidence_note) && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {e.rationale ?? e.mechanism ?? e.evidence_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Governance
            </h3>
            <dl className="space-y-1 text-[11px]">
              {Object.entries(node.governance).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[1fr_1.2fr] gap-2">
                  <dt className="text-text-faint">{k.replace(/_/g, " ")}</dt>
                  <dd className="text-text-secondary">
                    {Array.isArray(v) ? v.join(", ") : v || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
