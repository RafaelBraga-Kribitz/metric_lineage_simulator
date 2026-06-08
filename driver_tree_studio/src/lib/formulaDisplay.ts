/**
 * UI-only inverse of parseFormula: serialize identity edges to a formula string.
 */
import type { FormulaRole, MetricEdge } from "../schema/types";

export function identityEdgesToFormula(
  parentId: string,
  edges: MetricEdge[],
): string {
  const idEdges = edges.filter(
    (e) => e.parent === parentId && e.kind === "identity",
  );
  if (idEdges.length === 0) return `${parentId} =`;

  const byRole = (role: FormulaRole) =>
    idEdges.filter((e) => e.formula_role === role).map((e) => e.child);

  const factors = byRole("factor");
  const addends = byRole("addend");
  const subtrahends = byRole("subtrahend");
  const divisors = byRole("divisor");

  const parts: string[] = [];

  if (factors.length > 0) {
    parts.push(factors.join(" * "));
  }

  if (addends.length > 0 || subtrahends.length > 0) {
    const addParts: string[] = [];
    if (addends.length > 0) addParts.push(addends.join(" + "));
    for (const s of subtrahends) addParts.push(`- ${s}`);
    parts.push(addParts.join(" "));
  }

  if (divisors.length > 0) {
    const divExpr = divisors.map((d) => `/ ${d}`).join(" ");
    if (parts.length > 0) parts[0] = `${parts[0]!} ${divExpr}`;
    else parts.push(divExpr.trim());
  }

  return `${parentId} = ${parts.join(" ").trim()}`;
}

/** Pick the best parent to show in the formula field (selected node or first identity parent). */
export function defaultFormulaParent(
  selectedNodeId: string | null,
  edges: MetricEdge[],
): string | null {
  if (selectedNodeId) {
    const hasIdentityChildren = edges.some(
      (e) => e.parent === selectedNodeId && e.kind === "identity",
    );
    if (hasIdentityChildren) return selectedNodeId;
    const incoming = edges.find(
      (e) => e.child === selectedNodeId && e.kind === "identity",
    );
    if (incoming) return incoming.parent;
  }
  const first = edges.find((e) => e.kind === "identity");
  return first?.parent ?? null;
}
