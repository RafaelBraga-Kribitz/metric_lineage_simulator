"""Technical-debt scanner — language-aware, gracefully degrading.

Writes governance/DEBT_BASELINE.json: a normalized snapshot of debt metrics
(dead code, unused exports, duplication, complexity) measured by whatever
specialized tools are installed. Each metric records the tool that produced it
and whether the tool was available, so the ratchet (check_debt_ratchet.py) only
gates metrics it can actually measure on both sides.

Philosophy: this is the static-analysis analogue of the finding ratchet. The
baseline can only move *down*. `make debt-scan` rewrites it (use after you've
reduced debt, to lock in the gain). `make debt-check` re-scans and fails if any
ratcheted metric grew — that is the "remediate before it grows" gate.

Optional scan roots in governance/debt_config.yaml support monorepos where
package.json lives in a subdirectory (e.g. driver_tree_studio/).

Tool matrix (install what applies; missing tools are skipped, not fatal):

  Python : ruff (unused imports/vars), vulture (dead code),
           radon (cyclomatic complexity), jscpd (duplication, optional)
  TS/JS  : knip (unused files/exports/deps), jscpd (duplication),
           eslint (unused, optional)

Fallow (https://github.com/fallow-rs/fallow), if present, is used directly for
TS/JS and supersedes knip+jscpd for those metrics.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GOV = REPO_ROOT / "governance"
BASELINE_PATH = GOV / "DEBT_BASELINE.json"
CONFIG_PATH = GOV / "debt_config.yaml"

# Defaults; override per-project via governance/debt_config.yaml.
DEFAULT_THRESHOLDS = {
    "duplication_pct_max": 5.0,
    "complexity_cc_max": 10,  # radon rank C ≈ CC 11-20; we count blocks worse than this
}

_TIMEOUT = 180


def _have(tool: str) -> bool:
    return shutil.which(tool) is not None


def _run(cmd: list[str], *, cwd: Path | None = None) -> tuple[int, str]:
    try:
        proc = subprocess.run(  # noqa: S603
            cmd,
            cwd=cwd or REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
            timeout=_TIMEOUT,
        )
        return proc.returncode, proc.stdout + proc.stderr
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return 1, str(exc)


def _metric(value, available: bool, tool: str, lower_is_better: bool = True) -> dict:
    return {
        "value": value,
        "available": available,
        "tool": tool,
        "lower_is_better": lower_is_better,
    }


def _load_config() -> dict:
    thresholds = dict(DEFAULT_THRESHOLDS)
    scan_paths: dict[str, list[str]] = {"python": [], "typescript": []}
    if CONFIG_PATH.exists():
        try:
            import yaml

            cfg = yaml.safe_load(CONFIG_PATH.read_text()) or {}
            thresholds.update(cfg.get("thresholds", {}))
            raw = cfg.get("scan_paths") or {}
            scan_paths["python"] = list(raw.get("python") or [])
            scan_paths["typescript"] = list(raw.get("typescript") or [])
        except Exception:  # noqa: BLE001 — config is best-effort
            pass
    return {"thresholds": thresholds, "scan_paths": scan_paths}


def _resolve_paths(rel_paths: list[str]) -> list[Path]:
    return [REPO_ROOT / p for p in rel_paths if (REPO_ROOT / p).exists()]


def detect_languages(scan_paths: dict[str, list[str]]) -> list[str]:
    langs: list[str] = []
    py_paths = _resolve_paths(scan_paths.get("python", []))
    if py_paths or any(REPO_ROOT.glob("**/*.py")) or (REPO_ROOT / "pyproject.toml").exists():
        langs.append("python")
    ts_paths = _resolve_paths(scan_paths.get("typescript", []))
    if ts_paths or (REPO_ROOT / "package.json").exists() or (REPO_ROOT / "tsconfig.json").exists():
        langs.append("ts-js")
    return langs


def _knip_cwd(ts_paths: list[Path]) -> Path | None:
    for p in ts_paths:
        if (p / "package.json").is_file():
            return p
    if (REPO_ROOT / "package.json").is_file():
        return REPO_ROOT
    return ts_paths[0] if ts_paths else None


# ── Python tools ────────────────────────────────────────────────────────────


def _metric_ruff(targets: list[str]) -> dict:
    if not _have("ruff"):
        return _metric(None, False, "ruff")
    _rc, out = _run(
        ["ruff", "check", "--select", "F401,F811,F841", "--output-format", "json", *targets]
    )
    try:
        n = len(json.loads(out)) if out.strip().startswith("[") else 0
    except json.JSONDecodeError:
        n = 0
    return _metric(n, True, "ruff")


def _metric_vulture(targets: list[str]) -> dict:
    if not _have("vulture"):
        return _metric(None, False, "vulture")
    _rc, out = _run(["vulture", *targets, "--min-confidence", "80"])
    n = sum(1 for line in out.splitlines() if ":" in line and "unused" in line.lower())
    return _metric(n, True, "vulture")


def _metric_radon(targets: list[str], thresholds: dict) -> dict:
    if not _have("radon"):
        return _metric(None, False, "radon")
    _rc, out = _run(["radon", "cc", "-j", "-n", "C", *targets])
    try:
        data = json.loads(out) if out.strip().startswith("{") else {}
        n = sum(
            1
            for blocks in data.values()
            for b in blocks
            if isinstance(b, dict) and b.get("complexity", 0) > thresholds["complexity_cc_max"]
        )
    except json.JSONDecodeError:
        n = 0
    return _metric(n, True, "radon")


def scan_python(thresholds: dict, py_paths: list[Path]) -> dict[str, dict]:
    targets = [str(p.relative_to(REPO_ROOT)) for p in py_paths] or ["."]
    return {
        "ruff_unused": _metric_ruff(targets),
        "vulture_dead_code": _metric_vulture(targets),
        "radon_complex_blocks": _metric_radon(targets, thresholds),
    }


# ── TS/JS tools ─────────────────────────────────────────────────────────────


def _metric_fallow(knip_cwd: Path) -> dict[str, dict] | None:
    if not _have("fallow"):
        return None
    _rc, out = _run(["fallow", "scan", "--json"], cwd=knip_cwd)
    try:
        data = json.loads(out) if out.strip().startswith("{") else {}
        return {
            "fallow_dead_code": _metric(int(data.get("dead_code_count", 0)), True, "fallow"),
            "fallow_duplication_pct": _metric(
                float(data.get("duplication_pct", 0.0)), True, "fallow"
            ),
        }
    except (json.JSONDecodeError, ValueError):
        return None


def _metric_knip(knip_cwd: Path) -> tuple[dict, dict]:
    if not _have("knip"):
        return _metric(None, False, "knip"), _metric(None, False, "knip")
    _rc, out = _run(["knip", "--reporter", "json"], cwd=knip_cwd)
    try:
        data = json.loads(out) if out.strip().startswith("{") else {}
        files = len(data.get("files", []))
        issues = data.get("issues", [])
        exports = (
            sum(len(i.get("exports", [])) for i in issues) if isinstance(issues, list) else 0
        )
        return _metric(files, True, "knip"), _metric(exports, True, "knip")
    except json.JSONDecodeError:
        return _metric(None, False, "knip"), _metric(None, False, "knip")


def _metric_jscpd(ts_paths: list[Path]) -> dict:
    if not _have("jscpd"):
        return _metric(None, False, "jscpd")
    jscpd_targets = [str(p.relative_to(REPO_ROOT)) for p in ts_paths] or ["."]
    with tempfile.TemporaryDirectory(prefix="jscpd-") as tmp:
        _rc, _out = _run(
            ["jscpd", "--silent", "--reporters", "json", "--output", tmp, *jscpd_targets]
        )
        report = Path(tmp) / "jscpd-report.json"
        pct = 0.0
        if report.exists():
            try:
                stats = json.loads(report.read_text()).get("statistics", {})
                pct = float(stats.get("total", {}).get("percentage", 0.0))
            except (json.JSONDecodeError, ValueError):
                pct = 0.0
        return _metric(pct, True, "jscpd")


def scan_ts_js(thresholds: dict, ts_paths: list[Path]) -> dict[str, dict]:
    del thresholds  # TS scan uses absolute caps via check_debt_ratchet, not here
    m: dict[str, dict] = {}
    knip_cwd = _knip_cwd(ts_paths)

    if knip_cwd:
        fallow = _metric_fallow(knip_cwd)
        if fallow is not None:
            return fallow

    if knip_cwd:
        m["knip_unused_files"], m["knip_unused_exports"] = _metric_knip(knip_cwd)
    else:
        m["knip_unused_files"] = _metric(None, False, "knip")
        m["knip_unused_exports"] = _metric(None, False, "knip")

    m["jscpd_duplication_pct"] = _metric_jscpd(ts_paths)
    return m


def scan() -> dict:
    cfg = _load_config()
    thresholds = cfg["thresholds"]
    scan_paths = cfg["scan_paths"]
    py_paths = _resolve_paths(scan_paths.get("python", []))
    ts_paths = _resolve_paths(scan_paths.get("typescript", []))
    languages = detect_languages(scan_paths)
    metrics: dict[str, dict] = {}
    if "python" in languages:
        metrics.update(scan_python(thresholds, py_paths))
    if "ts-js" in languages:
        metrics.update(scan_ts_js(thresholds, ts_paths))
    return {
        "writer": "scripts/debt_scan.py",
        "generated_at": datetime.now(UTC).isoformat(),
        "languages": languages,
        "scan_paths": scan_paths,
        "thresholds": thresholds,
        "metrics": metrics,
    }


def main() -> int:
    snapshot = scan()
    GOV.mkdir(parents=True, exist_ok=True)
    BASELINE_PATH.write_text(json.dumps(snapshot, indent=2, sort_keys=True) + "\n")
    measured = {k: v["value"] for k, v in snapshot["metrics"].items() if v["available"]}
    skipped = [v["tool"] for v in snapshot["metrics"].values() if not v["available"]]
    print(f"[debt_scan] wrote {BASELINE_PATH.relative_to(REPO_ROOT)}")
    print(f"[debt_scan]   languages: {', '.join(snapshot['languages']) or 'none detected'}")
    for name, value in sorted(measured.items()):
        print(f"[debt_scan]   {name}: {value}")
    if skipped:
        print(f"[debt_scan]   skipped (tool not installed): {', '.join(sorted(set(skipped)))}")
        print("[debt_scan]   → see governance/DEBT_TOOLS.md to enable more coverage")
    return 0


if __name__ == "__main__":
    sys.exit(main())
