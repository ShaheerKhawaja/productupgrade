#!/usr/bin/env bash
# ProductUpgrade — Source Code Puller
# Clones a repo and generates a Repomix-style analysis
# Usage: ./pull-source.sh https://github.com/owner/repo [output_dir]

set -euo pipefail

REPO_URL="${1:?Usage: pull-source.sh <repo_url> [output_dir]}"
REPO_NAME=$(basename "$REPO_URL" .git)
OUTPUT_DIR="${2:-.productupgrade/sources/$REPO_NAME}"

mkdir -p "$OUTPUT_DIR"

echo "=== ProductUpgrade Source Puller ==="
echo "Repo: $REPO_URL"
echo "Output: $OUTPUT_DIR"

# Shallow clone for analysis
if [ -d "$OUTPUT_DIR/repo" ]; then
  echo "Repo already cloned, pulling latest..."
  cd "$OUTPUT_DIR/repo" && git pull --ff-only 2>/dev/null || true
  cd -
else
  git clone --depth 1 "$REPO_URL" "$OUTPUT_DIR/repo" 2>&1
fi

# Generate analysis
cd "$OUTPUT_DIR/repo"

echo "--- File structure ---"
find . -type f -not -path './.git/*' -not -path '*/node_modules/*' -not -path '*/.venv/*' | \
  head -500 > "../file-list.txt"

echo "--- LOC count ---"
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.py' -o -name '*.js' -o -name '*.jsx' \) \
  -not -path '*/node_modules/*' -not -path '*/.venv/*' | \
  xargs wc -l 2>/dev/null | tail -1 > "../loc-count.txt" || echo "0 total" > "../loc-count.txt"

echo "--- Package dependencies ---"
cat package.json 2>/dev/null | python3 -c "
import json, sys
try:
    pkg = json.load(sys.stdin)
    deps = list(pkg.get('dependencies', {}).keys())
    devdeps = list(pkg.get('devDependencies', {}).keys())
    print(f'Dependencies: {len(deps)}')
    for d in deps[:20]: print(f'  - {d}')
    print(f'DevDependencies: {len(devdeps)}')
    for d in devdeps[:10]: print(f'  - {d}')
except: pass
" > "../dependencies.txt" 2>/dev/null || true

cat pyproject.toml 2>/dev/null | head -50 >> "../dependencies.txt" 2>/dev/null || true

echo "--- Git stats ---"
git log --oneline -20 > "../git-log.txt" 2>/dev/null || true
git shortlog -sn --all | head -10 > "../contributors.txt" 2>/dev/null || true

cd -

echo "=== Source pull complete: $OUTPUT_DIR ==="
ls -la "$OUTPUT_DIR/"
