"use client";

/**
 * Central model state hook: loads seed, applies levers, exposes what-if and validation.
 */
import { useCallback, useMemo, useState } from "react";
import {
  applyLevers,
  computeBaseline,
  type Levers,
} from "../engine/compute";
import { whatIf as engineWhatIf } from "../engine/whatif";
import { loadDefaultModel } from "../lib/modelLoader";
import type { BusinessModel } from "../schema/types";
import { validate } from "../schema/validate";

export function useMetricModel() {
  const [model, setModelState] = useState<BusinessModel>(() => loadDefaultModel());
  const [levers, setLevers] = useState<Levers>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [formulaParentId, setFormulaParentId] = useState<string | null>(null);

  const setModel = useCallback((updater: BusinessModel | ((m: BusinessModel) => BusinessModel)) => {
    setModelState((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const baselineValues = useMemo(() => computeBaseline(model), [model]);
  const values = useMemo(() => applyLevers(model, levers), [model, levers]);
  const validation = useMemo(() => validate(model), [model]);

  const whatIf = useCallback(
    (changedLeafId: string, deltaPct: number) =>
      engineWhatIf(model, changedLeafId, deltaPct),
    [model],
  );

  const reconciliationErrors = validation.errors.filter((e) =>
    e.startsWith("[reconciliation]"),
  );
  const identityReconciled = reconciliationErrors.length === 0;
  const validationWarnings = validation.errors.filter(
    (e) => !e.startsWith("[reconciliation]"),
  );

  return {
    model,
    setModel,
    baselineValues,
    values,
    levers,
    setLevers,
    whatIf,
    selectedNodeId,
    setSelectedNodeId,
    formulaParentId,
    setFormulaParentId,
    validation,
    identityReconciled,
    validationWarnings,
  };
}

export type MetricModelState = ReturnType<typeof useMetricModel>;
