# Governance Bootstrap Prompt

**Purpose:** Replicate the governance + ratchet + Adversary discipline of `warehouse_humanoid_tco` into any project — greenfield, mid-flight, or complex existing — with maximum determinism and minimum interpretation.

**How to use:** Paste this entire file as the first message in a new Claude Code session, with one line added at the top:

```
PROJECT_NAME: <your-project-slug>
PROJECT_MODE: greenfield | midflight | refactor
PROJECT_LANGUAGE: python | typescript | rust | go | mixed
```

Then attach (or paste) the contents of `templates/` from this kit.

---

## Hard constraints (do not interpret, do not deviate)

These are non-negotiable. If any of these conflicts with codebase conventions, raise the conflict and stop — do not silently adapt.

1. **The methodology is `governance/AUDIT_PROCEDURE.md`.** Three roles only: Steward, Remediator, Adversary. Do not invent a new scoring framework, dimension count, scoring tier, or audit "phase" beyond what's in that file. Banned phrases: TIER0/1/2, 11-dim, 12-dim, "let me first audit everything from scratch", "adversarial-Explore", "comprehensive review."
2. **One finding per PR.** PR title must contain the finding ID `F-NNN`. Exception: trivial cross-cutting cleanups under 10 lines.
3. **A finding is closed only when its `verification_script` exits 0.** Editing `status: closed` without a passing script is forbidden.
4. **`governance/AUDIT_STATE.json` is machine-generated.** Hand-editing it is forbidden. Always regenerate via `make session-start`.
5. **Read state from disk, not from chat history.** Every session begins with `make session-start` and reads `governance/SESSION_HANDOUT.md`.
6. **The ratchet pattern** (`tests/governance/_ratchet.py`) is the only sanctioned way to gate a finding. xfails while open, hard-fails on regression when closed.
7. **No claims without artifacts.** Banned phrasings in commits, PRs, READMEs, charters: "audited", "fixed", "closed", "complete" — unless backed by a `verification_script` reference.

---

## Phase 0 — Detect mode (≤2 minutes)

Before doing anything, classify the project and acknowledge it explicitly to the user:

| Signal | greenfield | midflight | refactor |
|---|---|---|---|
| `governance/` exists | no | partial | possibly |
| `CLAUDE.md` exists | no | no | possibly |
| Test suite | none / template | partial | exists |
| CI workflows | none | partial | exists |
| Code volume | <500 LOC | 500–5000 LOC | >5000 LOC |

If unclear, ask the user once with `AskUserQuestion`. Do not guess.

State explicitly: "Bootstrapping governance in `<mode>` mode for project `<name>`."

---

## Phase 1 — Install non-negotiable scaffolding (deterministic file drops)

Copy the following files from this kit's `templates/` into the target project. **Do not modify them except for the four placeholders listed below.**

| Source | Destination | Modify? |
|---|---|---|
| `templates/CLAUDE.md` | `CLAUDE.md` | Replace `{PROJECT_SLUG}` only |
| `templates/AUDIT_PROCEDURE.md` | `governance/AUDIT_PROCEDURE.md` | No |
| `templates/CONTRIBUTING.md` | `CONTRIBUTING.md` | Merge with existing if present; do not overwrite custom rules |
| `templates/PROJECT_CHARTER.md` | `PROJECT_CHARTER.md` | Replace `{PROJECT_*}` placeholders; fill §3 only |
| `templates/Makefile.governance` | `Makefile` (append) | No (append to existing) |
| `templates/scripts/_governance_check.py` | `scripts/_governance_check.py` | No |
| `templates/scripts/write_audit_state.py` | `scripts/write_audit_state.py` | No |
| `templates/scripts/session_start.py` | `scripts/session_start.py` | No |
| `templates/scripts/session_end.py` | `scripts/session_end.py` | No |
| `templates/scripts/check_closed_findings.py` | `scripts/check_closed_findings.py` | No |
| `templates/scripts/check_claude_md.py` | `scripts/check_claude_md.py` | No |
| `templates/scripts/check_finding_coverage.py` | `scripts/check_finding_coverage.py` | No |
| `templates/scripts/check_charter_size.py` | `scripts/check_charter_size.py` | No |
| `templates/tests/governance/_ratchet.py` | `tests/governance/_ratchet.py` | No |
| `templates/tests/governance/conftest.py` | `tests/governance/conftest.py` | No |
| `templates/governance/findings/F-TEMPLATE.yaml` | `governance/findings/F-TEMPLATE.yaml` | No (template only) |
| `templates/governance/migrations/MIGRATION_TEMPLATE.yaml` | `governance/migrations/MIGRATION_TEMPLATE.yaml` | No (template only) |
| `templates/governance/adrs/ADR-TEMPLATE.md` | `governance/adrs/ADR-TEMPLATE.md` | No (template only) |
| `templates/.github/workflows/governance.yml` | `.github/workflows/governance.yml` | No |
| `templates/.pre-commit-config.yaml` | `.pre-commit-config.yaml` | Merge with existing |

**Placeholders to replace globally (`sed -i` after copy):**

```
{PROJECT_SLUG}        # e.g., warehouse_humanoid_tco
{PROJECT_TITLE}       # e.g., Warehouse Humanoid TCO Analyzer
{PROJECT_OWNER}       # e.g., Rafael Braga
{PROJECT_GOAL}        # 1-sentence primary goal
```

If `Makefile` does not exist, create one with the appended governance targets.

If `tests/` does not exist, create `tests/governance/` only — do not scaffold app tests.

After file drops, **commit** with message: `chore: install governance scaffolding (no behavior change)`.

---

## Phase 2 — Wire the Adversary CI job

Append `templates/.github/workflows/governance.yml` to `.github/workflows/`. This adds two jobs:

- `governance-audit` — runs `make audit` on every PR
- `adversary` — runs `scripts/check_closed_findings.py` on every PR

Do not merge these into existing CI workflows. They run as separate jobs so failures are attributable.

If the project has no GitHub Actions yet, this is the first workflow.

---

## Phase 3 — Verify scaffolding works

Run, in order:

```bash
mkdir -p governance/findings governance/migrations governance/adrs
make session-start
```

Expected output:

```
[write_audit_state] wrote governance/AUDIT_STATE.json
[write_audit_state]   findings: total=0 open=0 in_progress=0 closed=0 historical=0
[write_audit_state]   migrations: total=0 in_progress=0
✓ audit complete — see governance/AUDIT_STATE.json
[session_start] wrote governance/SESSION_HANDOUT.md
```

If `make session-start` errors, fix the error before proceeding. Do not advance to Phase 4.

---

## Phase 4 — Mode-specific work

### Mode = greenfield

1. Fill in `PROJECT_CHARTER.md` §3 (Business Case / Charter). Keep total file ≤200 lines.
2. Write the first ADR at `governance/adrs/0001-initial-tech-stack.md` documenting language, framework, and tooling choices.
3. Commit. PR title: `feat: project charter + ADR-0001`.
4. Open the first finding to seed the queue — typically `F-001: PROJECT_CHARTER.md exceeds 200-line scannable budget` (gate that the charter stays small).

### Mode = midflight

1. Read existing code structure. Do not rewrite.
2. Inventory the top 5 inconsistencies that match a category in `templates/CATEGORIES.md`. Each becomes a finding YAML in `governance/findings/`.
3. Write the `verification_script` for each finding *before* attempting the fix. Each script must xfail while the finding is open.
4. Commit findings as `chore: file findings F-001 through F-005 (no fixes)`. **Do not** make any code changes in this commit.
5. After findings are filed, work them one PR at a time per the Remediator role.

### Mode = refactor (existing complex project)

Same as midflight but with a longer triage budget. Do **not** attempt to re-architect. The governance system documents reality, it doesn't enforce a different reality.

1. Triage existing problems into finding categories (max 20 findings on first pass).
2. Mark obvious historical ones as `closed_historical` with empty `verification_script` — these become the audit trail without requiring fixes.
3. Reserve `status: open` for things you can actually fix. Reserve `status: wont_fix` for things you can't, with mandatory `wont_fix_reason`.

---

## Phase 5 — Hand off

Run `make session-end` to write `governance/SESSION_END.md`. Commit and push. The next session begins by reading `SESSION_END.md` and running `make session-start`.

---

## What this prompt explicitly does NOT do

- **It does not write app code.** The governance scaffolding is content-agnostic.
- **It does not impose a directory structure beyond `governance/`, `scripts/`, `tests/governance/`, `.github/workflows/`.** Your `src/` layout is yours.
- **It does not import or call any third-party SaaS** (no Codex, no LLM-judges, no external review bots beyond what the project already had).
- **It does not require Python.** The governance scripts are Python but can be ported. The methodology (three roles, ratchet, Adversary) is language-agnostic.

---

## Anti-pattern detection

If at any point during execution you find yourself doing any of the following, **stop and report**:

- "Let me do a comprehensive audit / review / scan / sweep first."
- "I'll create a TODO.md / PLAN.md / ROADMAP.md."
- "Let me add a quick fix for X while I'm here."
- "I notice the code also has problem Y — let me file findings for that too."
- Writing more than 200 lines of governance file content beyond the templates.
- Editing more than one finding YAML in a single commit.
- Closing a finding without running its `verification_script` to confirm exit 0.

These are the failure modes that produced the original eight-session amnesia cycle. The whole system exists to prevent them.

---

## Success criteria

Bootstrap is complete when:

1. `make session-start` exits 0 and writes `SESSION_HANDOUT.md`.
2. `make verify` (or `make audit` if no tests yet) exits 0.
3. CI workflow `governance.yml` runs green on the first commit.
4. `governance/AUDIT_STATE.json` shows `total_findings ≥ 0` (zero is acceptable for greenfield).
5. The first finding (or the explicit decision to file no findings yet) is documented in `CHANGELOG.md`.

Report these five things to the user with concrete numbers/paths, then stop.
