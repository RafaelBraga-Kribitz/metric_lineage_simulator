# CLAUDE.md: Metric Driver-Tree Studio Design System

This document is the single source of truth for all visual decisions in the Metric
Driver-Tree Studio. It was extracted from the Phase 0 artifact and the V4 build spec.
Cursor reads this before touching any styled component. Enforced in Cursor via
`.cursor/rules/phase2-driver-tree-studio.mdc`. Do not invent colors, fonts, or
edge styles. Everything is here.

---

## 1. Project identity and aesthetic direction

The tool is part of the BRAGA portfolio. The visual language is Swiss International Style:
editorial, typography-first, minimal, high-information-density without clutter. Dark theme
throughout. The aesthetic must signal "rigorous data scientist" not "startup SaaS dashboard."

Primary constraint: the three-edge-kind encoding (identity, modeled, hypothesized) must
always be visually unambiguous. This is the core product thesis made visible. Never deviate
from it. Everything else is secondary.

---

## 2. Color tokens

All colors are defined as CSS custom properties in `app/globals.css`. Use these variables
everywhere. Never use raw hex values in component files.

### Backgrounds
```css
--color-bg-app:    #0F172A;   /* root background */
--color-bg-panel:  #1E293B;   /* panel/card surface */
--color-bg-card:   #334155;   /* elevated card */
--color-bg-input:  #0F172A;   /* input backgrounds */
```

### Text
```css
--color-text-primary:   #F8FAFC;
--color-text-secondary: #E2E8F0;
--color-text-muted:     #94A3B8;
--color-text-faint:     #64748B;
```

### Borders
```css
--color-border-default: #334155;
--color-border-subtle:  #2B3A52;
```

### Edge kinds (load-bearing, never change)
```css
--color-edge-identity:     #2563EB;   /* blue  — thick 4px solid  */
--color-edge-modeled:      #D97706;   /* amber — 2px solid        */
--color-edge-hypothesized: #9CA3AF;   /* grey  — 2px dashed 6 5   */
```

### Node layer badges
```css
--color-layer-north-star: #7C3AED;   /* violet */
--color-layer-outcome:    #0891B2;   /* cyan   */
--color-layer-driver:     #475569;   /* slate  */
--color-layer-input:      #1E293B;   /* dark   — white border */
--color-layer-guardrail:  #DC2626;   /* red    */
--color-layer-counter:    #EA580C;   /* orange */
```

Node layer fill colors used directly in SVG and React Flow nodes:
```
north_star: fill #2563EB, text #FFFFFF
outcome:    fill #0D9488, text #FFFFFF
driver:     fill #475569, text #E2E8F0
input:      fill #F1F5F9, text #0F172A  (light node on dark canvas)
guardrail:  fill #E11D48, text #FFFFFF
```

### Evidence grade badges
```css
--color-grade-none-bg:          #374151;   text #9CA3AF
--color-grade-illustrative-bg:  #78350F;   text #FCD34D
--color-grade-estimated-bg:     #422006;   text #FDBA74
--color-grade-anecdotal-bg:     #713F12;   text #FDE68A
--color-grade-observational-bg: #164E63;   text #67E8F9
--color-grade-experimental-bg:  #064E3B;   text #6EE7B7
```

### State colors
```css
--color-success: #16A34A;
--color-warning: #CA8A04;
--color-error:   #DC2626;
--color-delta-positive: #6EE7B7;   /* green for up/better */
--color-delta-negative: #FCA5A5;   /* red   for down/worse */
```

### BRAGA brand accent (Phase 4 introduction)
```css
--color-braga-coral: #E8624A;      /* coral accent, BRAGA identity */
--color-braga-grey:  #8B97A6;      /* cool grey, BRAGA identity    */
```

### Tailwind config (tailwind.config.ts)
Map ALL above tokens into the Tailwind theme so utility classes are available:
```typescript
theme: {
  extend: {
    colors: {
      bg: { app: "var(--color-bg-app)", panel: "var(--color-bg-panel)",
             card: "var(--color-bg-card)" },
      text: { primary: "var(--color-text-primary)", muted: "var(--color-text-muted)",
               faint: "var(--color-text-faint)" },
      edge: { identity: "var(--color-edge-identity)",
               modeled: "var(--color-edge-modeled)",
               hypothesized: "var(--color-edge-hypothesized)" },
      layer: { "north-star": "var(--color-layer-north-star)",
                outcome: "var(--color-layer-outcome)", ... },
      braga: { coral: "var(--color-braga-coral)", grey: "var(--color-braga-grey)" },
    },
  },
}
```

---

## 3. Typography

Phase 0 uses system fonts as a prototype. Phase 2 migrates to DM Sans.

```css
/* Phase 0 (artifact) */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

/* Phase 2+ (Next.js, load via next/font) */
font-family: "DM Sans", sans-serif;   /* primary, all weights */
```

### Type scale
| Role                | Size    | Weight | Letter spacing | Color        |
|---------------------|---------|--------|----------------|--------------|
| App title (h1)      | 22px    | 800    | -0.3px         | text-primary |
| Panel header (h3)   | 14px    | 700    | +0.2px         | text-primary |
| Metric name (node)  | 10.5px  | 600    | 0              | varies       |
| Value (node)        | 11.5px  | 800    | 0              | varies       |
| Body / label        | 12.5px  | 400    | 0              | text-secondary |
| Small / muted       | 11.5px  | 400    | 0              | text-muted   |
| Chip / badge        | 10px    | 700    | +0.2px         | per badge    |
| North star headline | 34px    | 800    | -1px           | text-primary |

---

## 4. Spacing and sizing

Base unit: 4px. All spacing is a multiple of 4.

```
Panel padding:      16px
Panel gap:          16px
Card padding:       10px
Lever row gap:      8px
Section gap:        14px
Border radius (panel):  12px
Border radius (card):   8px
Border radius (chip):   999px (pill)
Border radius (badge):  999px (pill)
Node size (SVG):    152 x 56px, rx 10
Drawer width:       min(400px, 92vw)
Left sidebar:       280px (Phase 2)
Right panel:        320px (Phase 2)
Bottom bar:         48px  (Phase 2)
```

---

## 5. The three edge kinds (load-bearing rule)

This encoding must be IDENTICAL everywhere: the SVG tree, React Flow canvas, verbal
builder, inspector, ledger legend, and methodology note. Never deviate.

| Kind          | Stroke color            | Width | Dash pattern | Extra badge        |
|---------------|-------------------------|-------|--------------|-------------------|
| identity      | #2563EB (--edge-identity) | 4px | none (solid) | none              |
| modeled       | #D97706 (--edge-modeled)  | 2px  | none (solid) | evidence-grade chip |
| hypothesized  | #9CA3AF (--edge-hyp.)     | 2px  | "6 5"        | "?" badge (circle, r=9) |

### React Flow edge implementation
```tsx
// IdentityEdge: strokeWidth={4} stroke="var(--color-edge-identity)"
// ModeledEdge:  strokeWidth={2} stroke="var(--color-edge-modeled)" + EdgeLabelRenderer chip
// HypothesizedEdge: strokeWidth={2} stroke="var(--color-edge-hypothesized)"
//                   strokeDasharray="6 5" + "?" badge via EdgeLabelRenderer
```

Arrow markers must inherit the edge color. Use SVG `<marker>` per edge kind.

---

## 6. Component patterns

### Panel
The base container. Every section of the UI lives in a panel.
```tsx
<div className="bg-bg-panel border border-border-default rounded-[12px] p-4 mb-4">
  <div className="flex justify-between items-baseline mb-2.5 gap-2">
    <h3>{title}</h3>
    <span className="text-text-muted text-xs">{subtitle}</span>
  </div>
  {children}
</div>
```

### Chip / badge (DTS chip pattern)
Used for edge-kind badges and evidence-grade badges. Pill shape.
```tsx
<span
  className="inline-block text-[10px] font-bold py-0.5 px-1.5 rounded-full lowercase tracking-wide"
  style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}` }}
>
  {label}
</span>
```

### Lever (input range)
```tsx
<div className="py-2 border-b border-border-subtle">
  <div className="flex justify-between items-baseline gap-2 mb-1">
    <button className="lever-name">{metric.name}</button>
    <span className="font-bold text-xs">{value} <span className={delta >= 0 ? "text-delta-positive" : "text-delta-negative"}>{pct}</span></span>
  </div>
  <input type="range" style={{ accentColor: hasEffect ? "var(--color-edge-identity)" : "#6B7280" }} />
</div>
```

### Collapse head (for ledger and methodology)
```tsx
<button className="w-full bg-transparent border-none flex justify-between items-center cursor-pointer text-text-primary">
  <h3>{title}</h3>
  <span className="text-text-muted text-xs">{open ? "− hide" : "+ show"}</span>
</button>
```

### Metric inspector drawer
Slides in from the right. CSS transition only in artifact; Framer Motion in Next.js.
```tsx
// Width: min(400px, 92vw)
// Transform: translateX(101%) when closed, translateX(0) when open
// Backdrop: fixed overlay rgba(0,0,0,0.55) with pointer-events toggle
```

### Demo/illustrative notice banner
Always shown when the model has illustrative data. Amber on dark amber.
```tsx
<div className="text-[11.5px] text-[#FBBF24] bg-[#78350f33] border border-[#78350f] py-1.5 px-3 rounded-lg mb-4">
  Illustrative DTC e-commerce model. Numbers are placeholders, not estimated from data.
</div>
```

### Identity reconciliation badge
```tsx
<div className={`flex flex-col gap-0.5 text-xs font-bold py-2 px-3 rounded-[10px] ${ok ? "bg-[#052e1f] text-[#6EE7B7] border border-[#065f46]" : "bg-[#3f1d1d] text-[#FCA5A5] border border-[#7f1d1d]"}`}>
  {ok ? "✓" : "✗"} Identity reconciled
  <span className="text-[11px] font-medium opacity-85">computed = baseline</span>
</div>
```

---

## 7. Disclaimer and caveat components

Two recurring verbatim texts. Never paraphrase.

### Assumptions ledger disclaimer (amber box)
```
"Modeled edges use illustrative elasticities. Hypothesized edges have no quantification.
Neither should be treated as empirical evidence."
```

### Methodology note (verbatim, always visible, never collapsible into zero)
```
"This tool separates three kinds of metric relationship:
Identity: true by definition, computes exactly.
Modeled: a declared behavioral assumption with an elasticity. Flagged and editable.
Hypothesized: a directional belief with no quantification. Not included in computation.
This distinction follows the practice of building a causal structure (DAG) before
quantifying it. Real elasticities require data and a causal identification strategy.
This tool is a thinking aid, not an econometric model."
```

### Guesstimate / VoI caveat (red box, always visible, never hidden)
```
"This interval is the uncertainty in your GUESS, not evidence. A distribution looks like
data and is not. Its only purpose is to help you decide what to test, never to estimate
impact."
```

---

## 8. Layout structure (Phase 2, 1440px reference)

```
┌─────────────────────────────────────────────────────────────┐
│  Header (app title + reconciliation badge)                  │
├────────────┬────────────────────────────────┬───────────────┤
│ Sidebar    │   Canvas (React Flow)          │  Inspector    │
│ 280px      │   fills remaining space        │  320px        │
│ - model    │                                │  (on select)  │
│   selector │                                │               │
│ - levers   │                                │               │
│ - ledger   │                                │               │
│   (collapse│                                │               │
├────────────┴────────────────────────────────┴───────────────┤
│  Bottom bar 48px: Methodology note (? icon → expand)        │
└─────────────────────────────────────────────────────────────┘
```

At 880px and below: sidebar collapses; inspector becomes a bottom sheet or overlay.

---

## 9. Icon system

Phase 2 uses Lucide React.
```tsx
import { ChevronDown, HelpCircle, TrendingUp, TrendingDown, CheckCircle2,
         AlertTriangle, XCircle, Info } from "lucide-react"
```

No custom icon font. SVG icons only. Size defaults: 14px (inline), 16px (panel header).
The "?" on hypothesized edges is NOT a Lucide icon; it is a plain text character in an SVG
circle to allow precise canvas positioning.

---

## 10. Animation and transitions

Phase 0 (artifact): CSS transitions only.
```css
rect { transition: stroke 0.15s ease; }    /* node hover */
.dts-drawer { transition: transform 0.28s ease; }
.dts-backdrop { transition: opacity 0.28s ease; }
```

Phase 2 (Next.js): Framer Motion for:
- Drawer slide-in (`AnimatePresence` + `motion.div` with `x: "100%"` initial)
- Node value changes (layout animation on value update)
- Lever delta indicator (spring on number change)

Do not add motion for the sake of it. Every animation must communicate state change, not
decorate.

---

## 11. Responsive breakpoints

| Name | Width  | Behavior |
|------|--------|----------|
| base | < 640px | Single column, canvas stacks above levers |
| sm   | 640px  | Two-column grid (levers + results) |
| md   | 880px  | Full three-panel layout minus right inspector |
| lg   | 1280px | Full three-panel layout with inspector always visible |

---

## 12. How to use this when receiving a Figma design

When given a Figma design to implement:
1. Identify which component in section 6 it corresponds to.
2. Use CSS custom properties from section 2. Never extract raw hex from Figma.
3. Verify the edge encoding (section 5) is correct if the design includes edges.
4. Check that any disclaimer/caveat text (section 7) is verbatim.
5. Use `tailwind.config.ts` tokens from section 2, not hardcoded Tailwind color names.
6. If the Figma design conflicts with this document on colors or the edge encoding, this
   document wins. Flag the conflict rather than silently picking the Figma value.
7. Framer Motion is available in Phase 2. Use it for transitions listed in section 10 only.

---

## 13. File locations (Phase 2 Next.js)

| Artifact                | Path                                      |
|-------------------------|-------------------------------------------|
| CSS custom properties   | `app/globals.css`                         |
| Tailwind config         | `tailwind.config.ts`                      |
| Canvas components       | `src/components/Canvas/`                  |
| Identity edge component | `src/components/Canvas/IdentityEdge.tsx`  |
| Modeled edge component  | `src/components/Canvas/ModeledEdge.tsx`   |
| Hyp. edge component     | `src/components/Canvas/HypEdge.tsx`       |
| Metric node component   | `src/components/Canvas/MetricNode.tsx`    |
| Lever panel             | `src/components/LeverPanel/`              |
| Assumptions ledger      | `src/components/AssumptionsLedger/`       |
| Methodology note        | `src/components/MethodologyNote/`         |
| Inspector drawer        | `src/components/MetricInspector/`         |
| Funnel chart            | `src/components/FunnelChart/`             |
| Verbal builder          | `src/components/VerbalBuilder/`           |
| Guesstimate panel       | `src/components/Guesstimate/`             |
| Prioritization view     | `src/components/PrioritizationView/`      |
| Design tokens (types)   | `src/schema/types.ts` (FunctionalForm etc.)|

---

## 14. What is explicitly forbidden

- Raw hex values in component files (use CSS custom properties).
- The word "causes" or "causal relationship" in any UI copy for observational results.
- Modifying the verbatim methodology note text (section 7).
- Hiding the methodology note behind more than one click.
- Hiding the Guesstimate caveat behind any click.
- Using the edge-kind colors for any purpose other than edge rendering.
- localStorage (banned in artifact; use URL state in Next.js).
- Inventing a fourth edge kind visually.
- Any purple-gradient-on-white aesthetic. This is a dark, cool, editorial tool.
