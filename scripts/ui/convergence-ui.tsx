import React from "react";
import { render, Box, Text } from "ink";
import Spinner from "ink-spinner";
import { readFileSync, existsSync } from "fs";

interface Iteration {
  iteration: number;
  score: number;
  delta: number;
  decision: string;
  focus: string[];
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const filled = Math.round(score * 2); // 0-20 scale
  const color = score >= 8 ? "green" : score >= 6 ? "yellow" : "red";
  return (
    <Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text color="gray">{"░".repeat(20 - filled)}</Text>
      <Text bold color={color}> {score.toFixed(1)}</Text>
    </Text>
  );
};

const ConvergenceDisplay: React.FC<{ logPath: string; inProgress: boolean }> = ({ logPath, inProgress }) => {
  const iterations: Iteration[] = [];

  if (existsSync(logPath)) {
    const lines = readFileSync(logPath, "utf-8").trim().split("\n");
    let prevScore = 0;
    for (const line of lines) {
      try {
        const d = JSON.parse(line);
        const score = d.score || d.grade || 0;
        iterations.push({
          iteration: iterations.length + 1,
          score,
          delta: score - prevScore,
          decision: d.decision || "CONTINUE",
          focus: d.focusDimensions || d.focus || [],
        });
        prevScore = score;
      } catch { /* skip */ }
    }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={0}>
        <Text bold color="cyan">Convergence Tracker</Text>
        {inProgress && (
          <Text color="yellow"> <Spinner type="dots" /> running</Text>
        )}
      </Box>

      {iterations.length === 0 ? (
        <Box paddingX={2}>
          <Text color="gray">No convergence data yet.</Text>
        </Box>
      ) : (
        <>
          <Box paddingX={2} gap={1}>
            <Box width={4}><Text bold color="gray">#</Text></Box>
            <Box width={24}><Text bold color="gray">Score</Text></Box>
            <Box width={8}><Text bold color="gray">Delta</Text></Box>
            <Box width={12}><Text bold color="gray">Decision</Text></Box>
            <Text bold color="gray">Focus</Text>
          </Box>

          {iterations.map((it) => (
            <Box key={it.iteration} paddingX={2} gap={1}>
              <Box width={4}><Text>{it.iteration}</Text></Box>
              <Box width={24}><ScoreBar score={it.score} /></Box>
              <Box width={8}>
                <Text color={it.delta > 0 ? "green" : it.delta < 0 ? "red" : "gray"}>
                  {it.delta > 0 ? "+" : ""}{it.delta.toFixed(1)}
                </Text>
              </Box>
              <Box width={12}>
                <Text color={
                  it.decision === "SUCCESS" ? "green" :
                  it.decision === "PIVOT" ? "yellow" : "gray"
                }>{it.decision}</Text>
              </Box>
              <Text color="gray">{it.focus.slice(0, 3).join(", ")}</Text>
            </Box>
          ))}

          <Box paddingX={2} marginTop={0}>
            <Text>
              Latest: <Text bold color={
                iterations[iterations.length - 1].score >= 8 ? "green" : "yellow"
              }>{iterations[iterations.length - 1].score.toFixed(1)}/10</Text>
              {iterations.length >= 2 && (
                <Text color="gray"> (from {iterations[0].score.toFixed(1)})</Text>
              )}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

const logPath = process.argv[2] || ".productionos/CONVERGENCE-LOG.jsonl";
const inProgress = process.argv[3] === "true";
render(<ConvergenceDisplay logPath={logPath} inProgress={inProgress} />);
