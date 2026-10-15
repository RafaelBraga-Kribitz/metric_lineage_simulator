"use client";

/**
 * Central model state hook: loads seed, applies levers, exposes what-if and validation.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyLevers,
  computeBaseline,
  type Levers,
} from "../engine/compute";
import { whatIf as engineWhatIf } from "../engine/whatif";
import { loadDefaultModel } from "../lib/modelLoader";
import { decodeShareState, encodeShareState, SHARE_PARAM, tokenFromHash } from "../lib/shareState";
import type { BusinessModel } from "../schema/types";
import { validate } from "../schema/validate";

export function useMetricModel() {
  const [model, setModelState] = useState<BusinessModel>(() => loadDefaultModel());
  const [levers, setLevers] = useState<Levers>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [formulaParentId, setFormulaParentId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [fromSharedLink, setFromSharedLink] = useState(false);

  // Restore state from a shared link (`#s=v1....`) once, on load.
  useEffect(() => {
    const token = tokenFromHash(window.location.hash);
    if (!token) return;
    void decodeShareState(token).then((r) => {
      if (r.ok) {
        setModelState(r.payload.model);
        setLevers(r.payload.levers);
        setFromSharedLink(true);
      } else {
        setShareError(r.error);
      }
    });
  }, []);

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

  /** Absolute URL that reproduces the current model and levers. */
  const shareUrl = useCallback(
    async (path = window.location.pathname) => {
      const token = await encodeShareState({ model, levers });
      return `${window.location.origin}${path}#${SHARE_PARAM}=${token}`;
    },
    [model, levers],
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
    shareUrl,
    shareError,
    fromSharedLink,
  };
}

export type MetricModelState = ReturnType<typeof useMetricModel>;
