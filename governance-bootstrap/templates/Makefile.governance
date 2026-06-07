# ── Governance — see governance/AUDIT_PROCEDURE.md ───────────────────────────
#
# Append (or merge) the targets below into your project's Makefile.
# Only the governance-specific targets are defined here; your project's
# build/test/lint targets stay separate.

.PHONY: audit verify session-start session-end

PYTHON ?= python

audit:
	@echo "── make audit ─────────────────────────────────────────────"
	@$(PYTHON) scripts/check_claude_md.py
	@$(PYTHON) scripts/check_charter_size.py
	@$(PYTHON) scripts/check_finding_coverage.py
	@$(PYTHON) scripts/write_audit_state.py
	@echo "✓ audit complete — see governance/AUDIT_STATE.json"

# verify = audit + tests + closed-finding re-verification
verify: audit
	@echo "── make verify ────────────────────────────────────────────"
	@if ls tests/governance/test_*.py >/dev/null 2>&1; then \
		$(PYTHON) -m pytest tests/governance/ -q; \
	else \
		echo "(no governance tests yet — skipping pytest)"; \
	fi
	@$(PYTHON) scripts/check_closed_findings.py
	@echo "✓ verify complete"

session-start: audit
	@$(PYTHON) scripts/session_start.py
	@echo ""
	@echo "→ Read governance/SESSION_HANDOUT.md before choosing work."

session-end:
	@$(PYTHON) scripts/write_audit_state.py
	@$(PYTHON) scripts/session_end.py
	@echo ""
	@echo "→ Edit free-text fields in governance/SESSION_END.md, then commit."
