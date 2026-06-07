/**
 * UI-only metric value formatting.
 * currency: EUR 0 decimals; percent: 2dp; count: comma-separated; duration: 1dp + "s".
 */
import type { Unit } from "../schema/types";

export function formatMetricValue(
  v: number | null | undefined,
  unit: Unit,
): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (unit) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(v);
    case "percent":
      return `${(v * 100).toFixed(2)}%`;
    case "count":
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(Math.round(v));
    case "duration_s":
      return `${v.toFixed(1)}s`;
    case "ratio":
      return v.toFixed(3);
    default:
      return String(v);
  }
}

export function signedMetricValue(v: number, unit: Unit): string {
  const s = formatMetricValue(Math.abs(v), unit);
  return (v >= 0 ? "+" : "−") + s;
}

export function pctChange(curr: number, base: number): string {
  if (!base) return "0.0%";
  const p = ((curr - base) / base) * 100;
  return (p >= 0 ? "+" : "−") + Math.abs(p).toFixed(1) + "%";
}
