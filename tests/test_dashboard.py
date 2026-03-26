"""Tests for devtools-dashboard.py — ProductionOS Mission Control dashboard."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

import pytest

DASHBOARD_SCRIPT = Path(__file__).parent.parent / "hooks" / "devtools-dashboard.py"


@pytest.fixture
def state_dir(tmp_path):
    """Create a temporary ProductionOS state directory."""
    analytics = tmp_path / "analytics"
    analytics.mkdir()
    sessions = tmp_path / "sessions"
    sessions.mkdir()
    instincts = tmp_path / "instincts" / "learned"
    instincts.mkdir(parents=True)
    return tmp_path


def run_dashboard(state_dir, mode, costs_file=None):
    """Run the dashboard script with a custom state dir."""
    env = os.environ.copy()
    env["PRODUCTIONOS_HOME"] = str(state_dir)
    if costs_file:
        # We need to monkeypatch the costs file path — use a wrapper
        pass
    result = subprocess.run(
        ["python3", str(DASHBOARD_SCRIPT), mode],
        capture_output=True,
        text=True,
        env=env,
        timeout=10,
    )
    return result


class TestBannerMode:
    def test_empty_state_shows_no_activity(self, state_dir):
        result = run_dashboard(state_dir, "--banner")
        assert result.returncode == 0
        assert "no activity yet" in result.stdout

    def test_with_edit_events(self, state_dir):
        analytics = state_dir / "analytics" / "skill-usage.jsonl"
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        events = [
            {"event": "edit", "ts": f"{today}T10:00:00Z", "file": "test.py"},
            {"event": "edit", "ts": f"{today}T10:01:00Z", "file": "test2.py"},
            {"event": "edit", "ts": f"{today}T10:02:00Z", "file": "test3.py"},
        ]
        with open(analytics, "w") as f:
            for e in events:
                f.write(json.dumps(e) + "\n")

        result = run_dashboard(state_dir, "--banner")
        assert result.returncode == 0
        assert "3 edits" in result.stdout


class TestFullMode:
    def test_empty_state_shows_zeros(self, state_dir):
        result = run_dashboard(state_dir, "--full")
        assert result.returncode == 0
        assert "Sessions today:    0" in result.stdout
        assert "Edits today:       0" in result.stdout
        assert "No eval data yet" in result.stdout
        assert "No agents dispatched" in result.stdout

    def test_with_eval_convergence(self, state_dir):
        convergence = state_dir / "analytics" / "eval-convergence.jsonl"
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        scores = [
            {"ts": f"{today}T10:00:00Z", "score": 4.2, "edits": 10},
            {"ts": f"{today}T10:10:00Z", "score": 6.5, "edits": 20},
            {"ts": f"{today}T10:20:00Z", "score": 8.1, "edits": 30},
        ]
        with open(convergence, "w") as f:
            for s in scores:
                f.write(json.dumps(s) + "\n")

        result = run_dashboard(state_dir, "--full")
        assert result.returncode == 0
        assert "8.1/10" in result.stdout
        assert "Data points:       3" in result.stdout

    def test_with_hot_files(self, state_dir):
        cache = state_dir / "instincts" / "learned" / "hot-files-cache.json"
        with open(cache, "w") as f:
            json.dump(
                {
                    "hot_files": {
                        "/path/to/AppLayout.vue": 9,
                        "/path/to/useTheme.ts": 5,
                    },
                    "updated": "2026-03-26T10:00:00Z",
                },
                f,
            )

        result = run_dashboard(state_dir, "--full")
        assert result.returncode == 0
        assert "AppLayout.vue" in result.stdout
        assert "useTheme.ts" in result.stdout


class TestSnapshotMode:
    def test_creates_snapshot_file(self, state_dir):
        result = run_dashboard(state_dir, "--snapshot")
        assert result.returncode == 0
        snapshot = state_dir / "sessions" / "cost-snapshot.json"
        assert snapshot.exists()
        data = json.loads(snapshot.read_text())
        assert "cumulative_cost" in data
        assert "snapshot_ts" in data


class TestMalformedInput:
    def test_malformed_analytics_skipped(self, state_dir):
        analytics = state_dir / "analytics" / "skill-usage.jsonl"
        with open(analytics, "w") as f:
            f.write("not json\n")
            f.write('{"event": "edit", "ts": "2026-03-26T10:00:00Z"}\n')
            f.write("{broken\n")

        result = run_dashboard(state_dir, "--banner")
        assert result.returncode == 0
        # Should not crash — malformed lines skipped

    def test_malformed_hot_files_cache(self, state_dir):
        cache = state_dir / "instincts" / "learned" / "hot-files-cache.json"
        with open(cache, "w") as f:
            f.write("not json")

        result = run_dashboard(state_dir, "--full")
        assert result.returncode == 0
        assert "No churn data yet" in result.stdout

    def test_missing_all_files(self, state_dir):
        # Empty state dir — nothing exists
        result = run_dashboard(state_dir, "--full")
        assert result.returncode == 0
        assert "Sessions today:    0" in result.stdout


class TestSparkline:
    def test_sparkline_renders(self):
        # Import the function directly
        import importlib.util

        spec = importlib.util.spec_from_file_location("dashboard", DASHBOARD_SCRIPT)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        result = mod.sparkline([1.0, 3.0, 5.0, 7.0, 9.0])
        assert len(result) == 5
        # Should use block characters
        assert all(c in "▁▂▃▄▅▆▇█" for c in result)

    def test_sparkline_empty(self):
        import importlib.util

        spec = importlib.util.spec_from_file_location("dashboard", DASHBOARD_SCRIPT)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        result = mod.sparkline([])
        assert result == ""
