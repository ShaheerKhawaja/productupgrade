#!/usr/bin/env bun

import { writeGeneratedTargetFiles } from "./lib/runtime-targets";

const written = writeGeneratedTargetFiles();

console.log("Generated runtime targets:");
for (const file of written) {
  console.log(`- ${file.path}`);
}
