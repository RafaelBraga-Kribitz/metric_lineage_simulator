/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
      },
      colors: {
        bg: {
          app: "var(--color-bg-app)",
          panel: "var(--color-bg-panel)",
          card: "var(--color-bg-card)",
          input: "var(--color-bg-input)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          faint: "var(--color-text-faint)",
        },
        border: {
          DEFAULT: "var(--color-border-default)",
          subtle: "var(--color-border-subtle)",
        },
        edge: {
          identity: "var(--color-edge-identity)",
          modeled: "var(--color-edge-modeled)",
          hypothesized: "var(--color-edge-hypothesized)",
        },
        layer: {
          "north-star": "var(--color-layer-north-star)",
          outcome: "var(--color-layer-outcome)",
          driver: "var(--color-layer-driver)",
          input: "var(--color-layer-input)",
          guardrail: "var(--color-layer-guardrail)",
          counter: "var(--color-layer-counter)",
        },
        grade: {
          none: "var(--color-grade-none-bg)",
          illustrative: "var(--color-grade-illustrative-bg)",
          estimated: "var(--color-grade-estimated-bg)",
          anecdotal: "var(--color-grade-anecdotal-bg)",
          observational: "var(--color-grade-observational-bg)",
          experimental: "var(--color-grade-experimental-bg)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        delta: {
          positive: "var(--color-delta-positive)",
          negative: "var(--color-delta-negative)",
        },
        notice: {
          text: "var(--color-notice-text)",
          bg: "var(--color-notice-bg)",
          border: "var(--color-notice-border)",
        },
        recon: {
          "ok-bg": "var(--color-recon-ok-bg)",
          "ok-border": "var(--color-recon-ok-border)",
          "bad-bg": "var(--color-recon-bad-bg)",
          "bad-border": "var(--color-recon-bad-border)",
        },
        caveat: {
          bg: "var(--color-caveat-bg)",
          border: "var(--color-caveat-border)",
          text: "var(--color-caveat-text)",
        },
        braga: {
          coral: "var(--color-braga-coral)",
          grey: "var(--color-braga-grey)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
