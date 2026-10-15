/**
 * Share the exact model + lever state as a link (no server; state lives in the URL fragment)
 * or as an iframe embed snippet.
 */
"use client";

import { Button } from "@/components/ui/button";
import type { MetricModelState } from "@/hooks/useMetricModel";
import { MAX_ENCODED_CHARS } from "@/lib/shareState";
import { Code2, Link2 } from "lucide-react";
import { useState } from "react";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareControls({ state }: { state: MetricModelState }) {
  const [status, setStatus] = useState<string>("");
  const [snippet, setSnippet] = useState<string | null>(null);

  const make = async (path: string) => {
    const url = await state.shareUrl(path);
    if (url.length > MAX_ENCODED_CHARS) {
      setStatus("Model is too large to share as a link.");
      return null;
    }
    return url;
  };

  const shareLink = async () => {
    const url = await make(window.location.pathname);
    if (!url) return;
    window.history.replaceState(null, "", url);
    setSnippet(null);
    setStatus((await copy(url)) ? "Link copied. It contains the whole model; nothing is stored on a server." : "Link is in the address bar.");
  };

  const embed = async () => {
    const url = await make("/embed");
    if (!url) return;
    const html = `<iframe src="${url}" title="Metric Driver-Tree Studio" width="100%" height="560" style="border:0" loading="lazy"></iframe>`;
    setSnippet(html);
    setStatus((await copy(html)) ? "Embed snippet copied." : "Copy the embed snippet below.");
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => void shareLink()}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Share link
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void embed()}>
          <Code2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Embed
        </Button>
      </div>
      <p role="status" className="min-h-[14px] text-right text-[10.5px] text-text-muted">
        {state.shareError ?? status}
      </p>
      {snippet && (
        <label className="w-80 text-[10.5px] text-text-muted">
          Embed snippet
          <textarea readOnly value={snippet} rows={3} className="mt-0.5 w-full rounded-md border border-border bg-bg-input p-1.5 font-mono text-[10px] text-text-secondary" />
        </label>
      )}
    </div>
  );
}
