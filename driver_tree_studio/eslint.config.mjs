import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const RAW_HEX = "/#[0-9a-fA-F]{3,8}\\b/";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "coverage/**", "node_modules/**", "next-env.d.ts", "playwright-report/**", "test-results/**"],
  },
  {
    // CLAUDE_DESIGN_SYSTEM.md §2: never use raw hex in components; use tokens.
    files: ["app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${RAW_HEX}]`, message: "Raw hex color: use a design token (app/globals.css)." },
        { selector: `TemplateElement[value.raw=${RAW_HEX}]`, message: "Raw hex color: use a design token (app/globals.css)." },
      ],
    },
  },
  {
    // The engine stays framework-free (ADR-0010 open decision 2).
    files: ["src/engine/**/*.ts", "src/schema/**/*.ts", "src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["react", "react-*", "next", "next/*", "@xyflow/*"] }],
    },
  },
];

export default config;
