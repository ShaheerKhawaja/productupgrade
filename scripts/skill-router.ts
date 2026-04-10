// scripts/skill-router.ts
// ProductionOS Skill Router — intent -> composite skill chain

interface SkillChainStep {
  skill: string;
  args?: string;
  condition?: string; // only run if this condition is met
}

interface RouteResult {
  chain: SkillChainStep[];
  confidence: number;
  reasoning: string;
}

// Intent categories with composite chains
interface IntentConfig {
  keywords: string[];
  phrases?: string[];  // compound phrases that give +2 bonus each
  chain: SkillChainStep[];
  description: string;
}

const INTENT_CHAINS: Record<string, IntentConfig> = {
  "audit-and-fix": {
    keywords: ["audit", "fix", "improve", "upgrade", "production"],
    phrases: ["find and fix", "audit and fix", "check the codebase", "production ready"],
    chain: [
      { skill: "security-audit" },
      { skill: "production-upgrade", args: "--mode=audit" },
      { skill: "self-eval", args: "last" },
    ],
    description: "Security audit -> production upgrade -> self-evaluation",
  },
  "growth-audit": {
    keywords: [
      "marketing",
      "seo",
      "growth",
      "ads",
      "content",
      "conversion",
      "traffic",
    ],
    phrases: ["marketing audit", "growth audit", "seo audit", "ad spend", "content audit"],
    chain: [
      { skill: "seo-audit" },
      { skill: "content-strategy" },
      { skill: "ads-audit", condition: "has_paid_ads" },
      { skill: "analytics-tracking" },
    ],
    description: "SEO -> content -> ads -> analytics audit",
  },
  "ship-safe": {
    keywords: ["ship", "deploy", "release", "push", "merge", "pr"],
    phrases: ["create pr", "create a pr", "ship this", "push to main", "merge my"],
    chain: [
      { skill: "self-eval", args: "diff" },
      { skill: "review" },
      { skill: "ship" },
    ],
    description: "Self-eval -> review -> ship",
  },
  "research-and-plan": {
    keywords: ["research", "plan", "design", "architect", "spec"],
    phrases: ["research how", "spec out", "plan the", "architect the", "design the"],
    chain: [
      { skill: "deep-research" },
      { skill: "plan-ceo-review" },
      { skill: "plan-eng-review" },
    ],
    description: "Deep research -> CEO review -> eng review",
  },
  "full-cycle": {
    keywords: ["everything", "full", "complete", "end-to-end", "e2e"],
    phrases: ["do everything", "full cycle", "end to end", "make it production", "production ready"],
    chain: [
      { skill: "security-audit" },
      { skill: "production-upgrade" },
      { skill: "deep-research" },
      { skill: "plan-ceo-review" },
      { skill: "auto-swarm", args: "--mode=fix" },
      { skill: "self-eval", args: "session" },
      { skill: "ship" },
    ],
    description:
      "Full cycle: audit -> upgrade -> research -> plan -> swarm fix -> eval -> ship",
  },
  debug: {
    keywords: ["bug", "error", "broken", "crash", "fail", "fix"],
    phrases: ["root cause", "why is", "not working", "keeps crashing"],
    chain: [{ skill: "investigate" }, { skill: "self-eval", args: "last" }],
    description: "Investigate root cause -> self-evaluate fix",
  },
  quality: {
    keywords: ["test", "qa", "quality", "coverage", "lint"],
    phrases: ["run tests", "test coverage", "quality check"],
    chain: [{ skill: "qa" }, { skill: "self-eval", args: "session" }],
    description: "QA testing -> self-evaluation",
  },
  design: {
    keywords: [
      "ui",
      "ux",
      "design",
      "frontend",
      "visual",
      "css",
      "component",
    ],
    phrases: ["design system", "ui redesign", "ux audit", "frontend redesign"],
    chain: [
      { skill: "designer-upgrade" },
      { skill: "plan-design-review" },
    ],
    description: "Design upgrade -> design review",
  },
  security: {
    keywords: [
      "security",
      "vulnerability",
      "owasp",
      "auth",
      "injection",
      "xss",
    ],
    phrases: ["security audit", "security scan", "find vulnerabilities", "owasp audit"],
    chain: [
      { skill: "security-audit" },
      { skill: "production-upgrade", args: "--mode=fix" },
    ],
    description: "Security audit -> fix vulnerabilities",
  },
  learn: {
    keywords: ["learn", "teach", "explain", "understand", "how"],
    phrases: ["teach me", "explain how", "help me understand"],
    chain: [{ skill: "learn-mode" }],
    description: "Interactive learning mode",
  },
};

function routeIntent(goal: string): RouteResult {
  const goalLower = goal.toLowerCase();
  const scores: { intent: string; score: number; specificity: number }[] = [];

  for (const [intent, config] of Object.entries(INTENT_CHAINS)) {
    let score = 0;
    let matchedCount = 0;
    for (const kw of config.keywords) {
      if (goalLower.includes(kw)) {
        score += 1;
        matchedCount += 1;
      }
    }
    // Compound phrase matching — +2 per matched phrase.
    // Phrases are more specific than single keywords and should
    // strongly influence routing (e.g. "marketing audit" -> growth-audit).
    if (config.phrases) {
      for (const phrase of config.phrases) {
        if (goalLower.includes(phrase)) {
          score += 2;
        }
      }
    }
    // Exact intent name bonus — only for multi-word intent names to avoid
    // single-word intents (e.g. "security", "debug") getting a free +3
    // just because the word appears anywhere in the goal.
    const intentPhrase = intent.replace(/-/g, " ");
    if (intentPhrase.includes(" ") && goalLower.includes(intentPhrase)) {
      score += 3;
    }
    if (score > 0) {
      // Specificity ratio: proportion of keywords matched (used for tiebreaking)
      const specificity = matchedCount / config.keywords.length;
      scores.push({ intent, score, specificity });
    }
  }

  // Primary sort by score, secondary by specificity (higher ratio = more targeted match)
  scores.sort((a, b) => b.score - a.score || b.specificity - a.specificity);

  if (scores.length === 0) {
    return {
      chain: [{ skill: "build-productionos" }],
      confidence: 0.3,
      reasoning: "No strong intent match -- falling back to smart router",
    };
  }

  const best = scores[0];
  const config = INTENT_CHAINS[best.intent];
  const confidence = Math.min(0.95, 0.5 + best.score * 0.15);

  return {
    chain: config.chain,
    confidence,
    reasoning: `Matched "${best.intent}": ${config.description} (score: ${best.score})`,
  };
}

// CLI interface
if (process.argv[2]) {
  const result = routeIntent(process.argv.slice(2).join(" "));
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(
    'Usage: bun run scripts/skill-router.ts "your goal here"'
  );
  console.log("\nAvailable composite chains:");
  for (const [name, config] of Object.entries(INTENT_CHAINS)) {
    console.log(`  ${name}: ${config.description}`);
  }
}
