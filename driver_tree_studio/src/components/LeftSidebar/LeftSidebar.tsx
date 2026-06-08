/**
 * Left sidebar: model selector and illustrative banner (280px).
 */
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MetricModelState } from "@/hooks/useMetricModel";

interface LeftSidebarProps {
  state: MetricModelState;
}

export function LeftSidebar({ state }: LeftSidebarProps) {
  const { model } = state;

  return (
    <aside className="flex w-[280px] shrink-0 flex-col gap-0 overflow-y-auto border-r border-border bg-bg-app p-4">
      <div className="mb-4">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-text-muted">
          Model
        </label>
        <Select value={model.id} disabled>
          <SelectTrigger>
            <SelectValue placeholder={model.name} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={model.id}>{model.name}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-3 rounded-lg border border-[var(--color-grade-illustrative-bg)] bg-[color-mix(in_srgb,var(--color-grade-illustrative-bg)_20%,transparent)] px-3 py-1.5 text-[11.5px] text-[var(--color-grade-illustrative-text)]">
        Illustrative DTC e-commerce model. Numbers are placeholders, not estimated
        from data.
      </div>

    </aside>
  );
}
