#!/usr/bin/env bash
# ProductionOS — GUI Audit
# Screenshots all routes, runs Lighthouse, checks accessibility
# Usage: ./gui-audit.sh http://localhost:3000 [output_dir]

set -euo pipefail

BASE_URL="${1:?Usage: gui-audit.sh <base_url> [output_dir]}"
OUTPUT_DIR="${2:-.productionos/gui-audit}"

mkdir -p "$OUTPUT_DIR/screenshots" "$OUTPUT_DIR/lighthouse"

echo "=== ProductionOS GUI Audit ==="
echo "URL: $BASE_URL"
echo "Output: $OUTPUT_DIR"

# Generate Playwright screenshot script
cat > "$OUTPUT_DIR/_audit.js" << 'AUDIT_SCRIPT'
const { chromium } = require('playwright');
const fs = require('fs');

const baseUrl = process.argv[2];
const outputDir = process.argv[3];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

// Common routes to check
const ROUTES = ['/', '/generate', '/dashboard', '/studio', '/settings', '/settings/billing'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const findings = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      const page = await context.newPage();
      const url = `${baseUrl}${route}`;
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        const status = response?.status() || 0;

        if (status >= 200 && status < 400) {
          const filename = `${vp.name}-${route.replace(/\//g, '_') || 'home'}.png`;
          await page.screenshot({ path: `${outputDir}/screenshots/${filename}`, fullPage: true });

          // Check for common UX issues
          const issues = await page.evaluate(() => {
            const problems = [];
            // Check for missing alt text
            document.querySelectorAll('img:not([alt])').forEach(() =>
              problems.push('Image missing alt text'));
            // Check for small touch targets
            document.querySelectorAll('button, a, [role="button"]').forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44)
                problems.push(`Small touch target: ${el.textContent?.trim().slice(0, 30)}`);
            });
            // Check for empty states
            const mainContent = document.querySelector('main') || document.body;
            if (mainContent.textContent?.trim().length < 50)
              problems.push('Page appears empty or has very little content');
            return problems;
          });

          findings.push({ route, viewport: vp.name, status, issues, screenshot: filename });
        } else {
          findings.push({ route, viewport: vp.name, status, issues: [`HTTP ${status}`] });
        }
      } catch (err) {
        findings.push({ route, viewport: vp.name, status: 0, issues: [err.message] });
      }
      await page.close();
    }

    await context.close();
  }

  fs.writeFileSync(`${outputDir}/findings.json`, JSON.stringify(findings, null, 2));
  await browser.close();

  // Summary
  const totalIssues = findings.reduce((sum, f) => sum + f.issues.length, 0);
  console.log(`GUI Audit complete: ${findings.length} checks, ${totalIssues} issues found`);
})();
AUDIT_SCRIPT

# Run the audit
npx playwright install chromium --with-deps || echo "INFO: Playwright install skipped"
node "$OUTPUT_DIR/_audit.js" "$BASE_URL" "$OUTPUT_DIR" 2>/dev/null || {
  echo "Warning: Playwright audit failed. The app may not be running at $BASE_URL"
}

# Run Lighthouse if available
if command -v npx &>/dev/null; then
  echo "Running Lighthouse..."
  npx lighthouse "$BASE_URL" \
    --output=json --output-path="$OUTPUT_DIR/lighthouse/report.json" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    || echo "INFO: Lighthouse audit skipped (not available)"
fi

echo "=== GUI Audit complete: $OUTPUT_DIR ==="
