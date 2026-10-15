import { describe, expect, it } from "vitest";
import seed from "../../src/content/dtc_ecommerce.json";
import {
  MAX_ENCODED_CHARS,
  decodeShareState,
  encodeShareState,
  isBusinessModel,
  tokenFromHash,
} from "../../src/lib/shareState.js";
import type { BusinessModel } from "../../src/schema/types.js";

const dtc = seed as unknown as BusinessModel;

describe("share state", () => {
  it("round-trips model and levers and fits the size budget", async () => {
    const levers = { average_order_value: { mode: "multiplier" as const, value: 1.1 } };
    const token = await encodeShareState({ model: dtc, levers });
    expect(token.startsWith("v1.")).toBe(true);
    expect(token).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    expect(token.length).toBeLessThan(MAX_ENCODED_CHARS / 2);
    const back = await decodeShareState(token);
    expect(back).toEqual({ ok: true, payload: { model: dtc, levers } });
  });

  it("rejects unknown versions, garbage, oversize and structurally bad models", async () => {
    expect((await decodeShareState("v9.abc")).ok).toBe(false);
    expect((await decodeShareState("v1.%%%")).ok).toBe(false);
    expect((await decodeShareState("v1." + "A".repeat(MAX_ENCODED_CHARS)))).toEqual({ ok: false, error: "Shared link is too long." });
    const bad = await encodeShareState({ model: { ...dtc, nodes: "x" } as unknown as BusinessModel, levers: {} });
    expect(await decodeShareState(bad)).toEqual({ ok: false, error: "Shared link does not contain a valid model." });
  });

  it("drops malformed levers but keeps the model", async () => {
    const token = await encodeShareState({ model: dtc, levers: { x: { mode: "nope", value: 1 } } as never });
    const back = await decodeShareState(token);
    expect(back.ok && back.payload.levers).toEqual({});
  });

  it("refuses a deflate bomb", async () => {
    const huge = { ...dtc, narrative: "a".repeat(2_000_000) };
    const token = await encodeShareState({ model: huge, levers: {} });
    expect(token.length).toBeLessThan(MAX_ENCODED_CHARS);
    expect(await decodeShareState(token)).toEqual({ ok: false, error: "Shared link is corrupted." });
  });

  it("guards structure and parses the fragment", () => {
    expect(isBusinessModel(dtc)).toBe(true);
    expect(isBusinessModel({ ...dtc, north_star_id: "missing" })).toBe(false);
    expect(isBusinessModel({ ...dtc, edges: [{ parent: "a", child: "b", kind: "magic" }] })).toBe(false);
    expect(tokenFromHash("#s=v1.abc")).toBe("v1.abc");
    expect(tokenFromHash("#other=1")).toBeNull();
  });
});
