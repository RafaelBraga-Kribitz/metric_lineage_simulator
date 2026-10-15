/**
 * Shareable URL state (ADR-0008 Phase 4). The whole model plus lever positions is encoded in
 * the URL fragment, so nothing is sent to a server:
 *
 *   #s=v1.<base64url(deflate-raw(JSON))>
 *
 * Versioned (`v1`), size-limited on both ends, and structurally checked on decode so a
 * hand-edited link cannot crash the studio.
 */
import type { Levers } from "../engine/compute.js";
import type { BusinessModel, EdgeKind } from "../schema/types.js";

export const SHARE_VERSION = "v1";
export const SHARE_PARAM = "s";
/** Fragment budget. Browsers accept far more, but chat apps and email clients truncate. */
export const MAX_ENCODED_CHARS = 16_000;
/** Decompression cap: refuses deflate bombs. */
export const MAX_DECODED_BYTES = 1_000_000;

export interface SharePayload {
  model: BusinessModel;
  levers: Levers;
}

export type DecodeResult = { ok: true; payload: SharePayload } | { ok: false; error: string };

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, cap: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new Error("decoded state exceeds size limit");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

export async function encodeShareState(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ v: 1, ...payload }));
  const packed = await pipe(json, new CompressionStream("deflate-raw"), Number.POSITIVE_INFINITY);
  return `${SHARE_VERSION}.${toBase64Url(packed)}`;
}

const EDGE_KINDS: EdgeKind[] = ["identity", "modeled", "hypothesized"];
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Structural guard: enough shape for the engine to run without throwing. */
export function isBusinessModel(x: unknown): x is BusinessModel {
  if (!isObj(x) || typeof x.id !== "string" || typeof x.north_star_id !== "string") return false;
  if (!Array.isArray(x.nodes) || !Array.isArray(x.edges) || !Array.isArray(x.scenarios)) return false;
  const nodesOk = x.nodes.every(
    (n) => isObj(n) && typeof n.id === "string" && typeof n.name === "string" && Number.isFinite(n.baseline) && isObj(n.governance),
  );
  const edgesOk = x.edges.every(
    (e) => isObj(e) && typeof e.parent === "string" && typeof e.child === "string" && EDGE_KINDS.includes(e.kind as EdgeKind),
  );
  return nodesOk && edgesOk && x.nodes.some((n) => isObj(n) && n.id === x.north_star_id);
}

function isLevers(x: unknown): x is Levers {
  return (
    isObj(x) &&
    Object.values(x).every((l) => isObj(l) && (l.mode === "multiplier" || l.mode === "absolute") && Number.isFinite(l.value))
  );
}

export async function decodeShareState(token: string): Promise<DecodeResult> {
  if (token.length > MAX_ENCODED_CHARS) return { ok: false, error: "Shared link is too long." };
  const [version, body] = token.split(".", 2);
  if (version !== SHARE_VERSION || !body) return { ok: false, error: `Unsupported share format '${version ?? ""}'.` };
  try {
    const raw = await pipe(fromBase64Url(body), new DecompressionStream("deflate-raw"), MAX_DECODED_BYTES);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!isObj(parsed) || !isBusinessModel(parsed.model)) return { ok: false, error: "Shared link does not contain a valid model." };
    const levers = isLevers(parsed.levers) ? parsed.levers : {};
    return { ok: true, payload: { model: parsed.model, levers } };
  } catch {
    return { ok: false, error: "Shared link is corrupted." };
  }
}

/** Read the share token from a URL fragment like `#s=v1.xxx`. */
export function tokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get(SHARE_PARAM);
}
