import React from "react";
import { render, Box, Text } from "ink";

type Severity = "pass" | "warning" | "block";

interface EvalProps {
  score: number;
  threshold: number;
  edits: number;
  reportPath?: string;
}

const severityColor = (s: Severity): string =>
  s === "pass" ? "green" : s === "warning" ? "yellow" : "red";

const severityIcon = (s: Severity): string =>
  s === "pass" ? "✓" : s === "warning" ? "⚠" : "✕";

const EvalGate: React.FC<EvalProps> = ({ score, threshold, edits, reportPath }) => {
  const severity: Severity = score >= threshold ? "pass" : score >= 6 ? "warning" : "block";
  const color = severityColor(severity);
  const icon = severityIcon(severity);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={color} paddingX={2} paddingY={0}>
        <Text bold color={color}>{icon} EVAL GATE</Text>
      </Box>

      <Box paddingX={2} gap={2}>
        <Text>Score: <Text bold color={color}>{score.toFixed(1)}/10</Text></Text>
        <Text color="gray">Threshold: {threshold}/10</Text>
        <Text color="gray">After {edits} edits</Text>
      </Box>

      {severity === "pass" && (
        <Box paddingX={2}>
          <Text color="green">Production-ready. Proceeding.</Text>
        </Box>
      )}

      {severity === "warning" && (
        <Box paddingX={2} flexDirection="column">
          <Text color="yellow">Below threshold. Self-heal loop triggered.</Text>
          {reportPath && (
            <Text color="gray">See: {reportPath}</Text>
          )}
        </Box>
      )}

      {severity === "block" && (
        <Box paddingX={2} flexDirection="column">
          <Text color="red" bold>BLOCKED. Do not commit. Escalate to human.</Text>
          {reportPath && (
            <Text color="gray">Findings: {reportPath}</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const props: EvalProps = {
  score: parseFloat(process.argv[2] || "0"),
  threshold: parseInt(process.argv[3] || "8"),
  edits: parseInt(process.argv[4] || "0"),
  reportPath: process.argv[5] || undefined,
};

render(<EvalGate {...props} />);
