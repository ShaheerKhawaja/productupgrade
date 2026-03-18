#!/usr/bin/env bash
# ProductUpgrade — Competitor UX Scraper
# Uses Playwright to capture screenshots and extract design patterns
# Usage: ./scrape-competitor.sh https://competitor.com [output_dir]

set -euo pipefail

URL="${1:?Usage: scrape-competitor.sh <url> [output_dir]}"
OUTPUT_DIR="${2:-.productupgrade/competitors/$(echo "$URL" | sed 's/https\?:\/\///' | sed 's/[\/:]/_/g')}"

mkdir -p "$OUTPUT_DIR"

echo "=== ProductUpgrade Competitor Scraper ==="
echo "URL: $URL"
echo "Output: $OUTPUT_DIR"

# Check for Playwright
if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js first."
  exit 1
fi

# Generate Playwright script for screenshot capture
cat > "$OUTPUT_DIR/_scrape.js" << 'PLAYWRIGHT_SCRIPT'
const { chromium } = require('playwright');

const url = process.argv[2];
const outputDir = process.argv[3];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop screenshots
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await dPage.screenshot({ path: `${outputDir}/desktop-home.png`, fullPage: true });
  console.log('Desktop screenshot captured');

  // Mobile screenshots
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  });
  const mPage = await mobile.newPage();
  await mPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await mPage.screenshot({ path: `${outputDir}/mobile-home.png`, fullPage: true });
  console.log('Mobile screenshot captured');

  // Extract design tokens
  const tokens = await dPage.evaluate(() => {
    const styles = getComputedStyle(document.body);
    const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 20).map(a => ({
      text: a.textContent?.trim().slice(0, 50),
      href: a.href
    }));
    return {
      fonts: styles.fontFamily,
      background: styles.backgroundColor,
      color: styles.color,
      navLinks: links,
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
    };
  });

  require('fs').writeFileSync(
    `${outputDir}/tokens.json`,
    JSON.stringify(tokens, null, 2)
  );
  console.log('Design tokens extracted');

  await browser.close();
})();
PLAYWRIGHT_SCRIPT

# Run the scraper
npx playwright install chromium --with-deps 2>/dev/null || true
node "$OUTPUT_DIR/_scrape.js" "$URL" "$OUTPUT_DIR" 2>/dev/null || {
  echo "Warning: Playwright scrape failed. Falling back to curl."
  curl -sL "$URL" -o "$OUTPUT_DIR/page.html" 2>/dev/null || true
}

echo "=== Scrape complete: $OUTPUT_DIR ==="
ls -la "$OUTPUT_DIR/"
