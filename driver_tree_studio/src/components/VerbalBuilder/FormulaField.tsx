/**
 * Formula input below canvas: bi-directional sync with identity edges via parseFormula.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { parseFormula } from "@/lib/formula";
import {
  defaultFormulaParent,
  identityEdgesToFormula,
} from "@/lib/formulaDisplay";
import { useEffect, useMemo, useState } from "react";

interface FormulaFieldProps {
  state: MetricModelState;
}

export function FormulaField({ state }: FormulaFieldProps) {
  const { model, setModel, selectedNodeId, formulaParentId, setFormulaParentId } =
    state;
  const [formula, setFormula] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeParent = useMemo(() => {
    if (formulaParentId) {
      const hasIdentityChildren = model.edges.some(
        (e) => e.parent === formulaParentId && e.kind === "identity",
      );
      if (hasIdentityChildren) return formulaParentId;
    }
    return (
      defaultFormulaParent(selectedNodeId, model.edges) ?? model.north_star_id
    );
  }, [formulaParentId, selectedNodeId, model.edges, model.north_star_id]);

  const hasIdentityDecomposition = model.edges.some(
    (e) => e.parent === activeParent && e.kind === "identity",
  );

  useEffect(() => {
    setFormula(identityEdgesToFormula(activeParent, model.edges));
    setError(null);
  }, [activeParent, model.edges]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eq = formula.indexOf("=");
    if (eq === -1) {
      setError("Formula must contain '='");
      return;
    }
    const rhs = formula.slice(eq + 1).trim();
    if (!rhs) {
      setError("Add identity terms after '=' (identifiers only, not numeric literals)");
      return;
    }

    try {
      const { newEdges, newNodes } = parseFormula(formula, model.nodes);
      const parent = formula.slice(0, eq).trim();
      if (!parent) throw new Error("Invalid formula");

      setModel((m) => {
        const filteredEdges = m.edges.filter(
          (edge) => !(edge.parent === parent && edge.kind === "identity"),
        );
        const existingIds = new Set(m.nodes.map((n) => n.id));
        const mergedNodes = [
          ...m.nodes,
          ...newNodes.filter((n) => !existingIds.has(n.id)),
        ];
        return {
          ...m,
          nodes: mergedNodes,
          edges: [...filteredEdges, ...newEdges],
        };
      });
      setFormulaParentId(parent);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse error");
    }
  };

  const selectedNode = selectedNodeId
    ? model.nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-lg border border-border bg-bg-panel p-3"
    >
      <Label htmlFor="formula" className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-muted">
        Identity formula
      </Label>
      <div className="flex gap-2">
        <Input
          id="formula"
          value={formula}
          onChange={(e) => {
            setFormula(e.target.value);
            setError(null);
          }}
          placeholder="parent_id = child_id * child_id"
          className="font-mono text-xs"
        />
        <Button type="submit" size="sm">
          Apply
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
      {!hasIdentityDecomposition && selectedNode && (
        <p className="mt-2 text-[11px] text-text-muted">
          {selectedNode.name} is a leaf input — showing the identity formula for{" "}
          <span className="font-mono text-text-secondary">{activeParent}</span>.
          Select a metric that decomposes via identity edges to edit its formula directly.
        </p>
      )}
      <p className="mt-1 text-[11px] text-text-faint">
        Use metric ids and operators (* + - /) only. Numeric literals are not supported.
        Submit replaces identity edges for the parent on the left-hand side.
      </p>
    </form>
  );
}
