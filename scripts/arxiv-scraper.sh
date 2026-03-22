#!/usr/bin/env bash
# arxiv-scraper.sh — Extract AI prompting papers from arxiv
# Usage: bash scripts/arxiv-scraper.sh [query] [max_results] [output_dir]
#
# Examples:
#   bash scripts/arxiv-scraper.sh "prompt engineering" 50
#   bash scripts/arxiv-scraper.sh "chain of thought reasoning" 30
#   bash scripts/arxiv-scraper.sh "LLM self-improvement" 20

set -euo pipefail

QUERY="${1:-prompt+engineering+LLM}"
MAX_RESULTS="${2:-50}"
OUTPUT_DIR="${3:-.productionos/arxiv}"

mkdir -p "$OUTPUT_DIR"

# Arxiv API endpoint
ARXIV_API="http://export.arxiv.org/api/query"

# Default queries for ProductionOS research
QUERIES=(
  "prompt+engineering+techniques+2025+2026"
  "chain+of+thought+reasoning+LLM"
  "tree+of+thought+graph+of+thought"
  "LLM+as+judge+evaluation+framework"
  "self-refine+self-heal+self-debug+LLM"
  "confidence+calibration+LLM+bias"
  "multi-agent+debate+ensemble+LLM"
  "reflexion+verbal+reinforcement+learning"
  "constitutional+AI+safety+alignment"
  "mixture+of+agents+swarm+intelligence"
  "code+generation+verification+test+driven"
  "automated+code+review+quality"
)

echo "╔══════════════════════════════════════════╗"
echo "║    ARXIV PAPER SCRAPER — ProductionOS   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Function to query arxiv API
fetch_papers() {
  local query="$1"
  local output_file="$2"
  local max="$3"

  echo "Querying: $query (max: $max results)"

  # URL encode the query
  local encoded_query
  encoded_query=$(echo "$query" | sed 's/ /+/g')

  # Fetch from arxiv API (returns Atom XML)
  curl -s "${ARXIV_API}?search_query=all:${encoded_query}&start=0&max_results=${max}&sortBy=submittedDate&sortOrder=descending" \
    > "${output_file}.xml" 2>/dev/null

  # Extract key fields using grep/sed (works without xmllint)
  echo "# Arxiv Papers: ${query}" > "$output_file"
  echo "# Fetched: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$output_file"
  echo "# Query: ${query}" >> "$output_file"
  echo "" >> "$output_file"

  # Parse entries from XML
  local count=0
  while IFS= read -r line; do
    if echo "$line" | grep -q "<title>"; then
      local title
      title=$(echo "$line" | sed 's/.*<title>//;s/<\/title>.*//' | tr -s ' ' | sed 's/^ *//')
      if [ "$title" != "ArXiv Query:" ]; then
        count=$((count + 1))
        echo "## ${count}. ${title}" >> "$output_file"
      fi
    elif echo "$line" | grep -q "<id>"; then
      local url
      url=$(echo "$line" | sed 's/.*<id>//;s/<\/id>.*//')
      if echo "$url" | grep -q "arxiv.org"; then
        echo "**URL:** ${url}" >> "$output_file"
      fi
    elif echo "$line" | grep -q "<published>"; then
      local date
      date=$(echo "$line" | sed 's/.*<published>//;s/<\/published>.*//' | cut -c1-10)
      echo "**Published:** ${date}" >> "$output_file"
    elif echo "$line" | grep -q "<summary>"; then
      local summary
      summary=$(echo "$line" | sed 's/.*<summary>//;s/<\/summary>.*//' | tr -s ' ' | head -c 500)
      echo "**Abstract:** ${summary}..." >> "$output_file"
      echo "" >> "$output_file"
    fi
  done < "${output_file}.xml"

  echo "  → Found ${count} papers → ${output_file}"
  rm -f "${output_file}.xml"
}

# If specific query provided, use it
if [ "$QUERY" != "prompt+engineering+LLM" ]; then
  SAFE_NAME=$(echo "$QUERY" | tr ' +' '_' | tr -cd '[:alnum:]_' | head -c 50)
  fetch_papers "$QUERY" "${OUTPUT_DIR}/${SAFE_NAME}.md" "$MAX_RESULTS"
else
  # Run all default queries
  for query in "${QUERIES[@]}"; do
    SAFE_NAME=$(echo "$query" | tr '+' '_' | head -c 50)
    fetch_papers "$query" "${OUTPUT_DIR}/${SAFE_NAME}.md" "$MAX_RESULTS"
    sleep 3  # Be polite to arxiv API (rate limit: 1 req/3s)
  done
fi

echo ""
echo "Results saved to: ${OUTPUT_DIR}/"
echo "Total files: $(ls ${OUTPUT_DIR}/*.md 2>/dev/null | wc -l)"
echo ""
echo "Next steps:"
echo "  1. Review papers in ${OUTPUT_DIR}/"
echo "  2. Identify techniques not in ProductionOS"
echo "  3. Add new prompt layers to prompts/"
