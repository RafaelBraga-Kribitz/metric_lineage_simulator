/**
 * Minimal CSV reader for the bring-your-own-data test.
 *
 * Handles quoted fields, `,` or `;` delimiters (auto-detected from the header row) and
 * European decimal commas when the delimiter is `;` (typical German/Austrian Excel export).
 * Runs entirely in the browser; nothing is uploaded.
 */

export interface CsvTable {
  headers: string[];
  rows: string[][];
  delimiter: "," | ";";
}

function detectDelimiter(firstLine: string): "," | ";" {
  const semis = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(text: string): CsvTable {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], delimiter: "," };
  const delimiter = detectDelimiter(lines[0] as string);
  const headers = splitLine(lines[0] as string, delimiter);
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter));
  return { headers, rows, delimiter };
}

/** Parse one cell to a finite number, or NaN. Decimal comma only when delimiter is `;`. */
export function parseNumber(cell: string | undefined, delimiter: "," | ";"): number {
  if (cell === undefined) return Number.NaN;
  let s = cell.trim();
  if (s === "") return Number.NaN;
  if (delimiter === ";" && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const v = Number(s);
  return Number.isFinite(v) ? v : Number.NaN;
}

/** Extract two numeric columns as paired arrays (NaN kept; the estimator drops them). */
export function pairedColumns(
  table: CsvTable,
  xHeader: string,
  yHeader: string,
): { x: number[]; y: number[] } {
  const xi = table.headers.indexOf(xHeader);
  const yi = table.headers.indexOf(yHeader);
  if (xi < 0 || yi < 0) return { x: [], y: [] };
  const x = table.rows.map((r) => parseNumber(r[xi], table.delimiter));
  const y = table.rows.map((r) => parseNumber(r[yi], table.delimiter));
  return { x, y };
}
