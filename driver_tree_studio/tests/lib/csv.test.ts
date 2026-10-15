import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pairedColumns, parseCsv, parseNumber } from "../../src/lib/csv.js";

const fixture = (name: string) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");

describe("parseCsv", () => {
  it("reads a comma-delimited file", () => {
    const t = parseCsv(fixture("anscombe_1.csv"));
    expect(t.delimiter).toBe(",");
    expect(t.headers).toEqual(["x", "y"]);
    expect(t.rows).toHaveLength(11);
  });

  it("reads a semicolon file with decimal commas (German Excel export)", () => {
    const t = parseCsv(fixture("anscombe_1_de.csv"));
    expect(t.delimiter).toBe(";");
    const { x, y } = pairedColumns(t, "Treiber", "Kennzahl");
    expect(x[0]).toBe(10);
    expect(y[0]).toBeCloseTo(8.04, 10);
  });

  it("handles quotes, escaped quotes, BOM and blank lines", () => {
    const t = parseCsv('﻿a,"b, c"\n"1","say ""hi"""\n\n2,3\n');
    expect(t.headers).toEqual(["a", "b, c"]);
    expect(t.rows).toEqual([["1", 'say "hi"'], ["2", "3"]]);
  });

  it("returns empty table for empty input and empty columns for unknown headers", () => {
    expect(parseCsv("").headers).toEqual([]);
    expect(pairedColumns(parseCsv("a,b\n1,2"), "a", "zzz")).toEqual({ x: [], y: [] });
  });

  it("parses numbers strictly", () => {
    expect(parseNumber("1.234,5", ";")).toBeCloseTo(1234.5, 10);
    expect(parseNumber("2.5", ";")).toBe(2.5);
    expect(parseNumber("abc", ",")).toBeNaN();
    expect(parseNumber("", ",")).toBeNaN();
    expect(parseNumber(undefined, ",")).toBeNaN();
  });
});
