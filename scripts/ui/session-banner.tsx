import React from "react";
import { render, Box, Text } from "ink";

interface BannerProps {
  version: string;
  agents: number;
  commands: number;
  hooks: number;
  sessions: number;
  autoReview: boolean;
  proactive: boolean;
  projectName?: string;
  devToolsStatus: string;
  metrics?: string;
  contextRecovery?: string;
  learningsCount?: number;
  profileSlug?: string;
  firstRun?: boolean;
}

const StatusDot: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <Text>
    <Text color={active ? "green" : "gray"}>{active ? "●" : "○"}</Text>
    <Text> {label}: </Text>
    <Text bold color={active ? "green" : "gray"}>{active ? "on" : "off"}</Text>
  </Text>
);

const Banner: React.FC<BannerProps> = (props) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={0} flexDirection="column">
        <Box justifyContent="space-between">
          <Text bold color="cyan">ProductionOS {props.version}</Text>
          <Text color="gray"> Production House</Text>
        </Box>
        <Box marginTop={0}>
          <Text color="gray">
            {props.agents} agents | {props.commands} commands | {props.hooks} hooks
          </Text>
        </Box>
      </Box>

      <Box marginTop={0} paddingX={1} gap={3}>
        <Text>Sessions: <Text bold>{props.sessions}</Text></Text>
        <StatusDot active={props.autoReview} label="Review" />
        <StatusDot active={props.proactive} label="Learn" />
      </Box>

      {props.projectName && (
        <Box paddingX={1}>
          <Text>Project: <Text bold color="yellow">{props.projectName}</Text></Text>
          {props.profileSlug && (
            <Text color="gray"> (profile loaded)</Text>
          )}
        </Box>
      )}

      <Box paddingX={1}>
        <Text>DevTools: <Text bold color={
          props.devToolsStatus === "live" ? "green" :
          props.devToolsStatus === "ready" ? "yellow" : "gray"
        }>{props.devToolsStatus}</Text></Text>
        {props.learningsCount !== undefined && props.learningsCount > 0 && (
          <Text color="gray">  Learnings: {props.learningsCount}</Text>
        )}
      </Box>

      {props.metrics && (
        <Box paddingX={1}>
          <Text color="gray">Metrics: {props.metrics}</Text>
        </Box>
      )}

      {props.firstRun && (
        <Box marginTop={0} paddingX={1}>
          <Text color="magenta" bold>First run detected — onboarding will start</Text>
        </Box>
      )}
    </Box>
  );
};

// Parse CLI args
const args = process.argv.slice(2);
const props: BannerProps = {
  version: args[0] || "1.1.0-beta.2",
  agents: parseInt(args[1] || "79"),
  commands: parseInt(args[2] || "41"),
  hooks: parseInt(args[3] || "17"),
  sessions: parseInt(args[4] || "1"),
  autoReview: args[5] === "true",
  proactive: args[6] === "true",
  projectName: args[7] || undefined,
  devToolsStatus: args[8] || "off",
  metrics: args[9] || undefined,
  contextRecovery: args[10] || undefined,
  learningsCount: args[11] ? parseInt(args[11]) : undefined,
  profileSlug: args[12] || undefined,
  firstRun: args[13] === "true",
};

render(<Banner {...props} />);
