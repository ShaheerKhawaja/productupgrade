import React from "react";
import { render, Box, Text } from "ink";
import { readFileSync, existsSync } from "fs";

interface SkillUsage {
  skill: string;
  count: number;
}

const BarChart: React.FC<{ value: number; max: number; width?: number }> = ({ value, max, width = 20 }) => {
  const filled = Math.round((value / max) * width);
  return (
    <Text>
      <Text color="cyan">{"█".repeat(filled)}</Text>
      <Text color="gray">{"░".repeat(width - filled)}</Text>
    </Text>
  );
};

const Dashboard: React.FC<{ analyticsPath: string }> = ({ analyticsPath }) => {
  const filePath = `${analyticsPath}/skill-usage.jsonl`;

  if (!existsSync(filePath)) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="cyan">ProductionOS Analytics</Text>
        <Text color="gray">No analytics data yet.</Text>
      </Box>
    );
  }

  const lines = readFileSync(filePath, "utf-8").trim().split("\n");
  const counts: Record<string, number> = {};
  for (const line of lines) {
    try {
      const d = JSON.parse(line);
      const key = d.skill || d.event || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    } catch { /* skip malformed */ }
  }

  const sorted: SkillUsage[] = Object.entries(counts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxCount = sorted[0]?.count || 1;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={0}>
        <Text bold color="cyan">ProductionOS Analytics</Text>
      </Box>
      <Box marginTop={0} paddingX={1}>
        <Text>Total events: <Text bold>{lines.length}</Text></Text>
      </Box>
      <Box marginTop={0} paddingX={1}>
        <Text bold>Top Skills:</Text>
      </Box>
      {sorted.map((s) => (
        <Box key={s.skill} paddingX={2} gap={1}>
          <Box width={24}>
            <Text>{s.skill.slice(0, 22)}</Text>
          </Box>
          <BarChart value={s.count} max={maxCount} />
          <Text bold> {s.count}</Text>
        </Box>
      ))}
    </Box>
  );
};

const stateDir = process.env.PRODUCTIONOS_HOME || `${process.env.HOME}/.productionos`;
render(<Dashboard analyticsPath={`${stateDir}/analytics`} />);
