"use client";

/**
 * Run Monte Carlo in a Web Worker, falling back to the main thread when Workers are
 * unavailable. Results are deterministic for a given seed either way.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BusinessModel } from "../schema/types";
import {
  summarizeMonteCarlo,
  type MonteCarloRequest,
  type MonteCarloSummary,
} from "../workers/montecarloProtocol";

export function useMonteCarlo() {
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(0);
  const [result, setResult] = useState<MonteCarloSummary | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const w = new Worker(new URL("../workers/montecarlo.worker.ts", import.meta.url));
    w.onmessage = (e: MessageEvent<MonteCarloSummary>) => {
      if (e.data.id === nextId.current) {
        setResult(e.data);
        setRunning(false);
      }
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const run = useCallback((model: BusinessModel, runs: number, seed: number) => {
    const req: MonteCarloRequest = { id: ++nextId.current, model, runs, seed };
    setRunning(true);
    if (workerRef.current) {
      workerRef.current.postMessage(req);
    } else {
      setResult(summarizeMonteCarlo(req));
      setRunning(false);
    }
  }, []);

  return { result, running, run };
}
