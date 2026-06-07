/**
 * Formula parser. Converts strings like
 *   "net_revenue = orders * average_order_value"
 * into identity MetricEdges. Stubs are emitted for unknown ids.
 *
 * Operator -> formula_role:
 *   *  -> factor
 *   +  -> addend
 *   -  -> subtrahend  (only for the right operand of a binary `-`)
 *   /  -> divisor
 *
 * Only identity edges are produced.
 */

import type {
  FormulaRole,
  GovernanceMeta,
  MetricEdge,
  MetricNode,
} from "../schema/types.js";

type Tok =
  | { kind: "id"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i] as string;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(") {
      out.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      out.push({ kind: "op", value: c });
      i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j] as string)) j++;
      out.push({ kind: "id", value: s.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`unexpected char '${c}' at position ${i}`);
  }
  return out;
}

interface ParserState {
  toks: Tok[];
  i: number;
}

/** Collect operands with the role each one contributes when flattened into the parent. */
interface Operand {
  ids: string[];
  role: FormulaRole;
}

/* Grammar:
 *   expr   = term (("+"|"-") term)*
 *   term   = factor (("*"|"/") factor)*
 *   factor = id | "(" expr ")"
 *
 * Flattening for identity edges (the parent is the LHS of "=").
 *   Top-level expr operands at the same +/- chain become addend/subtrahend.
 *   Top-level term operands at the same * / chain become factor/divisor.
 *   Parenthesized groups: a sub-tree contributes its IDs with the role assigned
 *     by the operator that connects the group to the parent.
 */

function parseExpr(p: ParserState): Operand[] {
  const ops: Operand[] = [];
  const first = parseTerm(p);
  for (const o of first) ops.push({ ids: o.ids, role: o.role });
  while (p.i < p.toks.length) {
    const t = p.toks[p.i];
    if (t?.kind === "op" && (t.value === "+" || t.value === "-")) {
      p.i++;
      const next = parseTerm(p);
      const role: FormulaRole = t.value === "+" ? "addend" : "subtrahend";
      for (const o of next) ops.push({ ids: o.ids, role });
    } else break;
  }
  return ops;
}

function parseTerm(p: ParserState): Operand[] {
  const ops: Operand[] = [];
  const first = parseFactor(p);
  for (const o of first) ops.push({ ids: o.ids, role: o.role });
  while (p.i < p.toks.length) {
    const t = p.toks[p.i];
    if (t?.kind === "op" && (t.value === "*" || t.value === "/")) {
      p.i++;
      const next = parseFactor(p);
      const role: FormulaRole = t.value === "*" ? "factor" : "divisor";
      for (const o of next) ops.push({ ids: o.ids, role });
    } else break;
  }
  return ops;
}

function parseFactor(p: ParserState): Operand[] {
  const t = p.toks[p.i];
  if (!t) throw new Error("unexpected end of formula");
  if (t.kind === "id") {
    p.i++;
    return [{ ids: [t.value], role: "factor" }];
  }
  if (t.kind === "lparen") {
    p.i++;
    const inner = parseExpr(p);
    const close = p.toks[p.i];
    if (close?.kind !== "rparen") throw new Error("missing ')'");
    p.i++;
    // collapse: all ids of inner, but role is set by caller. Return a single Operand
    // by concatenating ids; caller assigns role.
    const ids: string[] = [];
    for (const o of inner) ids.push(...o.ids);
    return [{ ids, role: "factor" }];
  }
  throw new Error(`unexpected token at position ${p.i}`);
}

const placeholderGovernance = (): GovernanceMeta => ({
  owner: "",
  business_function: "",
  data_source: "",
  warehouse_table: "",
  calculation_grain: "",
  update_frequency: "",
  dimensions: [],
});

export interface ParseFormulaResult {
  newEdges: MetricEdge[];
  newNodes: MetricNode[];
}

/**
 * Parse an identity formula of the form "lhs = rhs" into edges + stub nodes.
 * @param existingNodes nodes already known; stubs are only emitted for unknown ids.
 */
export function parseFormula(
  formula: string,
  existingNodes: MetricNode[],
): ParseFormulaResult {
  const eq = formula.indexOf("=");
  if (eq === -1) throw new Error("formula must contain '='");
  const lhs = formula.slice(0, eq).trim();
  const rhs = formula.slice(eq + 1).trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lhs)) {
    throw new Error(`lhs must be a single identifier, got '${lhs}'`);
  }
  const toks = tokenize(rhs);
  const state: ParserState = { toks, i: 0 };
  const operands = parseExpr(state);
  if (state.i !== toks.length) throw new Error("trailing tokens after expression");

  const known = new Set(existingNodes.map((n) => n.id));
  const seen = new Set<string>();
  const newNodes: MetricNode[] = [];
  const newEdges: MetricEdge[] = [];

  for (const op of operands) {
    for (const id of op.ids) {
      newEdges.push({
        parent: lhs,
        child: id,
        kind: "identity",
        formula_role: op.role,
      });
      if (!known.has(id) && !seen.has(id)) {
        seen.add(id);
        newNodes.push({
          id,
          name: id,
          definition: "",
          unit: "count",
          layer: "input",
          baseline: 0,
          is_controllable: false,
          governance: placeholderGovernance(),
        });
      }
    }
  }
  if (!known.has(lhs) && !seen.has(lhs)) {
    newNodes.push({
      id: lhs,
      name: lhs,
      definition: "",
      unit: "count",
      layer: "outcome",
      baseline: 0,
      is_controllable: false,
      governance: placeholderGovernance(),
    });
  }

  return { newEdges, newNodes };
}
