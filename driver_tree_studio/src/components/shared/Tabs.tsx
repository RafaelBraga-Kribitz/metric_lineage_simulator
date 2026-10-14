/**
 * Minimal accessible tabs (WAI-ARIA tabs pattern: arrow keys move between tabs).
 */
"use client";

import { cn } from "@/lib/utils";
import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  label: string;
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  idPrefix: string;
  children: ReactNode;
}

export function Tabs<T extends string>({ label, tabs, active, onChange, idPrefix, children }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === active);
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + tabs.length) % tabs.length;
    onChange((tabs[next] as TabDef<T>).id);
    refs.current[next]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="mb-3 flex flex-wrap gap-1 border-b border-border-subtle">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 text-xs font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-edge-identity",
              t.id === active
                ? "border-edge-identity text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel-${active}`} aria-labelledby={`${idPrefix}-tab-${active}`}>
        {children}
      </div>
    </div>
  );
}
