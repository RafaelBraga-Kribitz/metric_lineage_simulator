/// <reference lib="webworker" />
/**
 * Monte Carlo Web Worker (ADR-0008 Phase 3a): keeps the UI responsive for large runs.
 */
import { summarizeMonteCarlo, type MonteCarloRequest } from "./montecarloProtocol";

self.onmessage = (event: MessageEvent<MonteCarloRequest>) => {
  self.postMessage(summarizeMonteCarlo(event.data));
};
