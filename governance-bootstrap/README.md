# Governance Bootstrap Kit

Replicate the governance / ratchet / Adversary discipline of `warehouse_humanoid_tco` into any future project. Greenfield, mid-flight, or refactor.

## What's in here

```
BOOTSTRAP_PROMPT.md      ← the master prompt; paste into a new Claude Code session
templates/               ← deterministic file drops; do not modify in transit
  CLAUDE.md              ← agent protocol (anti-patterns + session-start rule)
  AUDIT_PROCEDURE.md     ← three-role methodology (Steward / Remediator / Adversary)
  CONTRIBUTING.md        ← the four rules, banned anti-patterns, finding workflow
  PROJECT_CHARTER.md     ← SSOT skeleton with metadata block (≤200 lines)
  CATEGORIES.md          ← sanctioned finding category slugs
  Makefile.governance    ← append to your Makefile (audit, verify, session-start, session-end)
  .pre-commit-config.yaml
  CATEGORIES.md          ← sanctioned finding category slugs + debt→category map
  scripts/
    _governance_check.py        ← ratchet helper for check_*.py scripts
    write_audit_state.py        ← regenerates AUDIT_STATE.json
    session_start.py            ← regenerates SESSION_HANDOUT.md (+ debt hotspots)
    session_end.py              ← scaffolds SESSION_END.md handoff
    check_closed_findings.py    ← the Adversary
    check_claude_md.py          ← CLAUDE.md anti-pattern guard
    check_finding_coverage.py   ← every finding has a real verification_script
    check_charter_size.py       ← ≤200-line charter budget
    debt_scan.py                ← technical-debt scanner → DEBT_BASELINE.json
    check_debt_ratchet.py       ← debt ratchet gate (fails if debt grows)
  tests/governance/
    _ratchet.py                 ← ratchet helper for pytest-based verification scripts
    conftest.py                 ← makes _ratchet importable
  governance/
    DEBT_TOOLS.md               ← per-language debt tool install guide
    findings/F-TEMPLATE.yaml
    migrations/MIGRATION_TEMPLATE.yaml
    adrs/ADR-TEMPLATE.md
    adrs/0002-tech-debt-ratchet.md  ← example ADR for the debt ratchet
  .github/workflows/
    governance.yml              ← governance-audit + adversary + tech-debt CI jobs
```

## How to use

### Option A — let Claude Code do it

In your new project's terminal:

```bash
cp -r /tmp/governance-bootstrap ~/Desktop/governance-bootstrap   # keep a copy
cd <new-project>
# Open a Claude Code session here
# Paste the contents of ~/Desktop/governance-bootstrap/BOOTSTRAP_PROMPT.md
# with three lines prepended (see top of that file)
```

The prompt is structured to be deterministic: it lists exactly which files to copy where, what placeholders to replace, and what success looks like.

### Option B — do it yourself

```bash
cd <new-project>
cp -r /tmp/governance-bootstrap/templates/* .
cp -r /tmp/governance-bootstrap/templates/.github .
cp /tmp/governance-bootstrap/templates/.pre-commit-config.yaml .

# Replace placeholders
PROJECT_SLUG=my_project
PROJECT_TITLE="My Project"
PROJECT_OWNER="Your Name"
PROJECT_GOAL="One sentence about the goal"
for f in CLAUDE.md PROJECT_CHARTER.md CONTRIBUTING.md; do
  sed -i.bak \
    -e "s|{PROJECT_SLUG}|$PROJECT_SLUG|g" \
    -e "s|{PROJECT_TITLE}|$PROJECT_TITLE|g" \
    -e "s|{PROJECT_OWNER}|$PROJECT_OWNER|g" \
    -e "s|{PROJECT_GOAL}|$PROJECT_GOAL|g" \
    "$f" && rm "$f.bak"
done

# Merge Makefile.governance into your Makefile (or rename to Makefile if none)
cat Makefile.governance >> Makefile
rm Makefile.governance

# Initialize empty queue
mkdir -p governance/findings governance/migrations governance/adrs

# Verify
make session-start
```

Expected last lines:

```
[write_audit_state] wrote governance/AUDIT_STATE.json
[write_audit_state]   findings: total=0 open=0 in_progress=0 closed=0 historical=0
✓ audit complete
[session_start] wrote governance/SESSION_HANDOUT.md
```

## What the bootstrap does NOT install

- App-specific code, tests, or fixtures
- Language toolchain (Python `pyproject.toml`, TypeScript `package.json`, etc.)
- A CI workflow for lint/test — only the governance workflow
- Any external SaaS integrations (no LLM-judge bots, no Codex review bots)

These are project-specific and remain yours.

## The deterministic core

The four things that make this system work — and that you should never modify in transit:

1. **`tests/governance/_ratchet.py`** + **`scripts/_governance_check.py`** — the ratchet pattern. xfail / [GAP] while open, hard-fail / [FAIL] when closed-and-regressed.
2. **`scripts/check_closed_findings.py`** — the Adversary. Runs every closed finding's script on every PR.
3. **`scripts/check_debt_ratchet.py`** — the debt ratchet. Re-scans dead code / duplication / complexity and fails any PR where they grow past `DEBT_BASELINE.json`. Same ratchet idea, applied to mechanical debt instead of findings.
4. **`governance/AUDIT_PROCEDURE.md`** — the three roles. If you find yourself doing something that doesn't map to Steward / Remediator / Adversary, you are about to drift.

## Technical-debt ratchet (the "remediate before it grows" layer)

Inspired by [Fallow](https://github.com/fallow-rs/fallow) (TS/JS), generalized to
any language. `make debt-scan` measures debt with whatever tools are installed
(Python: ruff + vulture + radon; TS/JS: knip + jscpd, or Fallow directly) and
writes `governance/DEBT_BASELINE.json`. `make debt-check` re-scans on every PR
and **fails if any metric grew** — debt can only move down. The Steward surfaces
current hotspots in the session handout so the next cleanup is a normal
one-finding PR, not an ad-hoc sweep. Full guide: `governance/DEBT_TOOLS.md`.
