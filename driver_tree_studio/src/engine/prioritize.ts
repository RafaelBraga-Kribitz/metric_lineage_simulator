/**
 * Test prioritization (ADR-0008 Phase 5a): priorityScore = voiScore / test_cost.
 *
 * Ranks which GUESS is most worth testing per unit of test effort. It does not rank
 * levers by impact. test_cost is a relative effort unit declared on the edge; when missing
 * it is assumed to be 1 and flagged.
 */

import type { VoiEntry } from "./valueOfInformation.js";

export interface PriorityEntry extends VoiEntry {
  testCost: number;
  testCostAssumed: boolean;
  priorityScore: number | null;
  rank: number | null;
}

export function prioritize(entries: VoiEntry[]): PriorityEntry[] {
  const withScores = entries.map((e) => {
    const declared = e.edge.test_cost;
    const testCostAssumed = declared === undefined || !(declared > 0);
    const testCost = testCostAssumed ? 1 : (declared as number);
    const priorityScore = e.voiScore === null ? null : e.voiScore / testCost;
    return { ...e, testCost, testCostAssumed, priorityScore, rank: null as number | null };
  });
  withScores.sort((a, b) => {
    if (a.priorityScore === null) return b.priorityScore === null ? 0 : 1;
    if (b.priorityScore === null) return -1;
    return b.priorityScore - a.priorityScore;
  });
  let rank = 0;
  for (const e of withScores) if (e.priorityScore !== null && e.priorityScore > 0) e.rank = ++rank;
  return withScores;
}
