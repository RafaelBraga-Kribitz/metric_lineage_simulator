# Agent instructions

This repository is governed. Cursor always-on rules live in `.cursor/rules/governance-*.mdc`.

## Every session

```bash
make session-start
```

Read `governance/SESSION_HANDOUT.md` before choosing work.

## Operating model

| Role | When | Contract |
|---|---|---|
| Steward | Session start | Regenerate handout; read-only |
| Remediator | Fixing a finding | One `F-NNN` per PR; run verification; `make verify` |
| Adversary | CI / local verify | Re-run all closed finding scripts |

Full protocol: `CLAUDE.md`, `CONTRIBUTING.md`, `governance/AUDIT_PROCEDURE.md`.
