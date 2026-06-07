/**
 * Core schema types for the Metric Driver-Tree Studio.
 * Mirrors spec v4 section 4. All exports are named; no default export.
 */

export type Unit = "currency" | "count" | "ratio" | "percent" | "duration_s";

export type MetricLayer =
  | "north_star"
  | "strategic_objective"
  | "outcome"
  | "driver"
  | "operational"
  | "input"
  | "guardrail"
  | "counter";

export type EdgeKind = "identity" | "modeled" | "hypothesized";

export type FormulaRole = "factor" | "addend" | "subtrahend" | "divisor";

export type FunctionalForm = "linear" | "logarithmic" | "power" | "s_curve";

export type EvidenceGrade =
  | "none"
  | "illustrative"
  | "estimated"
  | "anecdotal"
  | "observational"
  | "experimental";

export type Direction = "increases" | "decreases" | "unclear";

export type DistributionKind = "point" | "triangular" | "normal" | "lognormal";

export interface Distribution {
  kind: DistributionKind;
  params: Record<string, number>;
}

export interface GovernanceMeta {
  owner: string;
  business_function: string;
  data_source: string;
  warehouse_table: string;
  calculation_grain: string;
  update_frequency: string;
  dimensions: string[];
}

export interface MetricNode {
  id: string;
  name: string;
  definition: string;
  unit: Unit;
  layer: MetricLayer;
  baseline: number;
  is_controllable: boolean;
  distribution?: Distribution;
  governance: GovernanceMeta;
  explainer?: string;
  position?: { x: number; y: number };
  funnel_stage_order?: number;
}

export interface MetricEdge {
  parent: string;
  child: string;
  kind: EdgeKind;
  formula_role?: FormulaRole;
  functional_form?: FunctionalForm;
  elasticity?: number;
  elasticity_distribution?: Distribution;
  form_params?: Record<string, number>;
  mechanism?: string;
  direction?: Direction;
  evidence_grade?: EvidenceGrade;
  evidence_note?: string;
  rationale?: string;
  test_cost?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  levers: Record<string, { mode: "multiplier" | "absolute"; value: number }>;
}

export interface BusinessModel {
  id: string;
  name: string;
  industry: string;
  preset_labels?: string[];
  north_star_id: string;
  nodes: MetricNode[];
  edges: MetricEdge[];
  scenarios: Scenario[];
  narrative: string;
}
