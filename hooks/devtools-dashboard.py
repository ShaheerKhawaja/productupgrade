#!/usr/bin/env python3
"""ProductionOS DevTools Dashboard — single source of truth for session metrics.

Usage:
    python3 devtools-dashboard.py --banner    # One-liner for session-start.sh banner
    python3 devtools-dashboard.py --full      # Full report for /devtools status command
    python3 devtools-dashboard.py --snapshot  # Record cost baseline at session start
"""
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

STATE_DIR = Path(os.environ.get("PRODUCTIONOS_HOME", os.path.expanduser("~/.productionos")))
COSTS_FILE = Path(os.path.expanduser("~/.claude/metrics/costs.jsonl"))
ANALYTICS_FILE = STATE_DIR / "analytics" / "skill-usage.jsonl"
DISPATCH_LOG = STATE_DIR / "dispatch-log.jsonl"
EVAL_CONVERGENCE = STATE_DIR / "analytics" / "eval-convergence.jsonl"
HOT_FILES_CACHE = STATE_DIR / "instincts" / "learned" / "hot-files-cache.json"
COST_SNAPSHOT = STATE_DIR / "sessions" / "cost-snapshot.json"


def read_jsonl(path: Path, date_filter: str | None = None) -> list[dict]:
    """Read JSONL file, optionally filtering by date prefix in 'ts' or 'timestamp'."""
    entries = []
    if not path.exists():
        return entries
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if date_filter:
                        ts = entry.get("ts", entry.get("timestamp", ""))
                        if not ts.startswith(date_filter):
                            continue
                    entries.append(entry)
                except (json.JSONDecodeError, TypeError):
                    continue
    except (OSError, PermissionError):
        pass
    return entries


def read_json(path: Path) -> dict:
    """Read a JSON file, returning empty dict on any error."""
    if not path.exists():
        return {}
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return {}


def get_session_cost() -> float:
    """Compute session cost delta from snapshot."""
    snapshot = read_json(COST_SNAPSHOT)
    baseline = snapshot.get("cumulative_cost", 0.0)
    current = sum(e.get("estimated_cost_usd", 0) for e in read_jsonl(COSTS_FILE))
    return max(0.0, current - baseline)


def get_total_cost() -> float:
    """Sum all costs from costs.jsonl."""
    return sum(e.get("estimated_cost_usd", 0) for e in read_jsonl(COSTS_FILE))


def get_today_events() -> list[dict]:
    """Get all analytics events from today."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return read_jsonl(ANALYTICS_FILE, date_filter=today)


def get_agent_dispatches() -> list[dict]:
    """Get all agent dispatches from dispatch log."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return read_jsonl(DISPATCH_LOG, date_filter=today)


def get_eval_scores() -> list[dict]:
    """Get eval convergence scores."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return read_jsonl(EVAL_CONVERGENCE, date_filter=today)


def get_hot_files() -> dict[str, int]:
    """Get hot files from cache."""
    cache = read_json(HOT_FILES_CACHE)
    return cache.get("hot_files", {})


def sparkline(values: list[float]) -> str:
    """Render values as ASCII sparkline."""
    if not values:
        return ""
    chars = "▁▂▃▄▅▆▇█"
    mn, mx = min(values), max(values)
    rng = mx - mn if mx != mn else 1
    return "".join(chars[min(int((v - mn) / rng * 7), 7)] for v in values)


def banner_mode():
    """One-liner for session-start.sh banner."""
    events = get_today_events()
    edits = len([e for e in events if e.get("event") == "edit"])
    agents = get_agent_dispatches()
    scores = get_eval_scores()
    cost = get_session_cost()

    parts = []
    if edits:
        parts.append(f"{edits} edits")
    if agents:
        parts.append(f"{len(agents)} agents")
    if scores:
        last_score = scores[-1].get("score", "?")
        trend = sparkline([s.get("score", 0) for s in scores[-10:]])
        parts.append(f"eval {last_score} {trend}")
    if cost > 0:
        parts.append(f"${cost:.2f}")

    if parts:
        print(" | ".join(parts))
    else:
        print("no activity yet")


def full_mode():
    """Full report for /devtools status command."""
    events = get_today_events()
    agents = get_agent_dispatches()
    scores = get_eval_scores()
    hot_files = get_hot_files()
    cost = get_session_cost()
    total_cost = get_total_cost()

    # Header
    print("ProductionOS DevTools Dashboard")
    print("=" * 50)
    print()

    # Session metrics
    edits = len([e for e in events if e.get("event") == "edit"])
    sessions = len([e for e in events if e.get("event") == "session_start"])
    security = len([e for e in events if e.get("event") == "security_edit"])
    print(f"  Sessions today:    {sessions}")
    print(f"  Edits today:       {edits}")
    print(f"  Security events:   {security}")
    print(f"  Agent dispatches:  {len(agents)}")
    print()

    # Cost
    print("Cost")
    print("-" * 50)
    print(f"  This session:      ${cost:.2f}")
    print(f"  All time:          ${total_cost:.2f}")
    print()

    # Eval convergence
    print("Eval Convergence")
    print("-" * 50)
    if scores:
        values = [s.get("score", 0) for s in scores]
        print(f"  Latest score:      {values[-1]}/10")
        print(f"  Trend:             {sparkline(values)}")
        print(f"  Data points:       {len(values)}")
    else:
        print("  No eval data yet (runs every 10 edits)")
    print()

    # Agent dispatches
    print("Agent Dispatches")
    print("-" * 50)
    if agents:
        agent_types = Counter(a.get("agent_type", "unknown") for a in agents)
        for agent_type, count in agent_types.most_common(5):
            print(f"  {agent_type}: {count}")
    else:
        print("  No agents dispatched today")
    print()

    # Hot files (churn)
    print("Hot Files (cross-session churn)")
    print("-" * 50)
    if hot_files:
        for filepath, count in sorted(hot_files.items(), key=lambda x: -x[1])[:10]:
            name = os.path.basename(filepath)
            bar = "#" * min(count, 20)
            print(f"  {name:40s} {bar} ({count})")
    else:
        print("  No churn data yet (aggregates every 100 events)")
    print()

    # Event breakdown
    print("Event Breakdown")
    print("-" * 50)
    event_counts = Counter(e.get("event", "unknown") for e in events)
    for event_type, count in event_counts.most_common(10):
        print(f"  {event_type:25s} {count}")


def snapshot_mode():
    """Record cost baseline at session start."""
    total = get_total_cost()
    snapshot = {
        "cumulative_cost": total,
        "snapshot_ts": datetime.now(timezone.utc).isoformat(),
        "pid": os.getpid(),
    }
    snapshot_path = COST_SNAPSHOT
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    with open(snapshot_path, "w") as f:
        json.dump(snapshot, f, indent=2)
    print(f"Cost snapshot: ${total:.2f}")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--banner"
    if mode == "--banner":
        banner_mode()
    elif mode == "--full":
        full_mode()
    elif mode == "--snapshot":
        snapshot_mode()
    else:
        print(f"Unknown mode: {mode}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
