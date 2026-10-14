# Progress log

Append-only log of portfolio-completion PRs (ADR-0010). One row per PR, newest last.
This is a record of what landed and the gate evidence, not a plan: the work queue is
`governance/findings/`.

| Date | Finding | PR branch | What landed | Gate evidence |
|---|---|---|---|---|
| 2026-10-14 | F-012 | `claude/f-012-adr-0010-scope` | ADR-0010 (proposed P1–P6); charter v0.4.0; this log; CI runs on every PR base | `make verify` green; vitest 44/44; typecheck clean |
| 2026-10-14 | F-013 | `claude/f-013-adversary-ratchet-lookup` | Adversary ratchet resolves slugged finding files, so closed findings now fail on regression | `make verify` green; F-013 test fails on the old helper |
| 2026-10-14 | F-014 | `claude/f-014-estimate-engine` | `estimate.ts` BYOD test, CSV reader, shared stats; 21 new tests incl. property tests | vitest 65/65; engine line coverage 97.9%; `make verify` green |
| 2026-10-14 | F-015 | `claude/f-015-voi-prioritize` | `valueOfInformation.ts` + `prioritize.ts` with analytic check (P90−P10 ≈ 2·1.2816·σ) | vitest 73/73; `make verify` green |
| 2026-10-14 | F-016 | `claude/f-016-app-ci-gates` | ESLint + raw-hex ban, offline font, static export, Playwright smoke, CI `app` job | lint 0 problems; build OK; e2e 1/1; vitest 73/73; `make verify` green |
| 2026-10-14 | F-017 | `claude/f-017-phase2-ui` | Analysis panel (tornado, MC worker, untested beliefs), notice banner, coloured markers, keyboard selection | vitest 75/75; e2e 2/2, 0 console errors; lint clean; `make verify` green |
| 2026-10-14 | F-018 | `claude/f-018-data-test-panel` | Data-test panel (BYOD CSV, mapping, verdict, accept), SYNTHETIC selection-trap example | vitest 77/77; e2e 4/4; lint clean; `make verify` green |
| 2026-10-14 | F-019 | `claude/f-019-authoring-pass` | Seed authoring pass (2 public sources, flagged illustrative edges), headline worked example + "What to test first" panel | vitest 80/80; e2e 4/4; `npm run example` reproduces `docs/results/`; `make verify` green |
| 2026-10-14 | F-020 | `claude/f-020-share-embed` | Share URL (`#s=v1.`), embed route, metadata + og.png, static deploy config, slider a11y names | vitest 85/85; e2e 6/6; `make verify` green |
