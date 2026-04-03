#!/usr/bin/env node

// ProductionOS Installer
// Zero dependencies -- uses only Node.js built-ins.
// .cjs extension ensures CommonJS even when package.json has "type": "module".
//
// Usage:
//   npx productionos@latest                    Install for Claude Code (default)
//   npx productionos@latest --codex           Install skill + plugin for Codex
//   npx productionos@latest --all-targets     Install for Claude Code and Codex
//   npx productionos@latest --uninstall       Remove Claude Code install
//   npx productionos@latest --uninstall --codex
//                                              Remove Codex install
//   npx productionos@latest --update [flags]  Pull latest version and reinstall
//   npx productionos@latest --help            Show this message

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRODUCT = 'ProductionOS';
const PRODUCT_SLUG = 'productionos';
const VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
const PKG_ROOT = path.join(__dirname, '..');

// Namespace constants -- avoids collisions with other plugins (GSD uses gsd-)
const COMMANDS_NS = PRODUCT_SLUG;        // -> commands/productionos/
const AGENTS_PREFIX = 'pos-';            // -> agents/pos-*.md
const DATA_DIR = PRODUCT_SLUG;           // -> productionos/ (VERSION, data)
const INSTALL_EXCLUDES = { '.git': true, 'node_modules': true };

// Source paths relative to the npm package root
const SRC = {
  commands: path.join(PKG_ROOT, '.claude', 'commands'),
  skills:   path.join(PKG_ROOT, '.claude', 'skills'),
  codexAliases: path.join(PKG_ROOT, 'codex-skills'),
  agents:   path.join(PKG_ROOT, 'agents'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveScopedPath(raw, envName) {
  var resolved = path.resolve(raw);
  var home = os.homedir();
  if (!resolved.startsWith(home + path.sep) && resolved !== home) {
    console.error('ERROR: ' + envName + ' must be within home directory. Got: ' + resolved);
    process.exit(1);
  }
  return resolved;
}

/** Resolve the Claude config directory, respecting CLAUDE_CONFIG_DIR. */
function resolveClaudeTarget() {
  return resolveScopedPath(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'CLAUDE_CONFIG_DIR');
}

/** Resolve the Codex config directory, respecting CODEX_HOME. */
function resolveCodexTarget() {
  return resolveScopedPath(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'CODEX_HOME');
}

/** Recursively copy a directory. Returns file count. Applies optional prefix to filenames. */
function copyDir(src, dest, opts) {
  opts = opts || {};
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  var count = 0;
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var srcPath = path.join(src, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, path.join(dest, entry.name), opts);
    } else {
      var destName = opts.prefix ? opts.prefix + entry.name : entry.name;
      fs.copyFileSync(srcPath, path.join(dest, destName));
      count++;
    }
  }
  return count;
}

/** Recursively copy the packaged repo tree for Codex skill/plugin installs. */
function copyProjectTree(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  var count = 0;
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (INSTALL_EXCLUDES[entry.name]) continue;
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyProjectTree(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

/** Recursively remove a directory if it exists. */
function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Remove all files matching a prefix from a flat directory. */
function rmPrefixed(dir, prefix) {
  if (!fs.existsSync(dir)) return;
  var files = fs.readdirSync(dir);
  for (var i = 0; i < files.length; i++) {
    if (files[i].startsWith(prefix)) {
      fs.unlinkSync(path.join(dir, files[i]));
    }
  }
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

function installClaude() {
  var target = resolveClaudeTarget();
  console.log('\n  Installing ' + PRODUCT + ' v' + VERSION);
  console.log('  Target (Claude Code): ' + target + '\n');

  // 1. Commands -> {target}/commands/productionos/
  var cmdDest = path.join(target, 'commands', COMMANDS_NS);
  var cmdCount = copyDir(SRC.commands, cmdDest);

  // 2. Skills -> {target}/skills/productionos/
  var skillDest = path.join(target, 'skills', COMMANDS_NS);
  var skillCount = copyDir(SRC.skills, skillDest);

  // 3. Agents -> {target}/agents/ with pos- prefix to avoid collisions
  var agentDest = path.join(target, 'agents');
  var agentCount = copyDir(SRC.agents, agentDest, { prefix: AGENTS_PREFIX });

  // 4. Write VERSION file for update tracking
  var dataDest = path.join(target, DATA_DIR);
  fs.mkdirSync(dataDest, { recursive: true });
  fs.writeFileSync(path.join(dataDest, 'VERSION'), VERSION + '\n');

  // 5. Print summary
  console.log('  Installed:');
  console.log('    Commands : ' + cmdCount + ' -> ' + cmdDest);
  if (skillCount > 0) {
    console.log('    Skills   : ' + skillCount + ' -> ' + skillDest);
  }
  console.log('    Agents   : ' + agentCount + ' -> ' + agentDest);
  console.log('    Version  : ' + VERSION + '  -> ' + path.join(dataDest, 'VERSION'));
  console.log();
  printClaudeBanner(cmdCount, agentCount);
}

function installCodex() {
  var target = resolveCodexTarget();
  console.log('\n  Installing ' + PRODUCT + ' v' + VERSION);
  console.log('  Target (Codex): ' + target + '\n');

  var pluginDest = path.join(target, 'plugins', PRODUCT_SLUG);
  var skillDest = path.join(target, 'skills', PRODUCT_SLUG);
  var aliasDest = path.join(target, 'skills');

  rmDir(pluginDest);
  rmDir(skillDest);

  var pluginFileCount = copyProjectTree(PKG_ROOT, pluginDest);
  var skillFileCount = copyProjectTree(PKG_ROOT, skillDest);
  var aliasCount = copyDir(SRC.codexAliases, aliasDest);

  console.log('  Installed:');
  console.log('    Plugin   : ' + pluginFileCount + ' files -> ' + pluginDest);
  console.log('    Skill    : ' + skillFileCount + ' files -> ' + skillDest);
  console.log('    Aliases  : ' + aliasCount + ' skills -> ' + aliasDest);
  console.log();
  printCodexBanner(pluginFileCount, skillFileCount, aliasCount);
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstallClaude() {
  var target = resolveClaudeTarget();
  console.log('\n  Uninstalling ' + PRODUCT + ' from ' + target + '\n');

  // Remove commands namespace directory
  rmDir(path.join(target, 'commands', COMMANDS_NS));

  // Remove skills namespace directory
  rmDir(path.join(target, 'skills', COMMANDS_NS));

  // Remove prefixed agent files (pos-*.md)
  rmPrefixed(path.join(target, 'agents'), AGENTS_PREFIX);

  // Remove ProductionOS data directory (VERSION, etc.)
  rmDir(path.join(target, DATA_DIR));

  console.log('  All ProductionOS files removed.');
  console.log('  Claude Code marketplace plugin install is unaffected.\n');
}

function uninstallCodex() {
  var target = resolveCodexTarget();
  console.log('\n  Uninstalling ' + PRODUCT + ' Codex install from ' + target + '\n');

  rmDir(path.join(target, 'plugins', PRODUCT_SLUG));
  rmDir(path.join(target, 'skills', PRODUCT_SLUG));
  rmPrefixed(path.join(target, 'skills'), PRODUCT_SLUG + '-');

  console.log('  Codex plugin and skill install removed.\n');
}

// ---------------------------------------------------------------------------
// Update -- delegates to npx to fetch the latest published version
// ---------------------------------------------------------------------------

function update() {
  var forwardFlags = [];
  if (process.argv.includes('--codex')) forwardFlags.push('--codex');
  if (process.argv.includes('--all-targets')) forwardFlags.push('--all-targets');
  if (process.argv.includes('--claude')) forwardFlags.push('--claude');
  console.log('\n  Updating ' + PRODUCT + ' to latest...\n');
  try {
    // execFileSync prevents shell injection -- args are passed as an array
    execFileSync('npx', ['productionos@latest'].concat(forwardFlags), { stdio: 'inherit' });
  } catch (e) {
    console.error('  Update failed. Try manually: npx productionos@latest');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp() {
  console.log([
    '',
    '  ' + PRODUCT + ' v' + VERSION + ' -- Agentic Development OS',
    '',
    '  Usage:',
    '    npx productionos@latest                 Install to ~/.claude/ (default)',
    '    npx productionos@latest --codex        Install to ~/.codex/plugins + ~/.codex/skills',
    '    npx productionos@latest --all-targets  Install to Claude Code and Codex',
    '    npx productionos@latest --uninstall    Remove Claude Code install',
    '    npx productionos@latest --uninstall --codex',
    '                                           Remove Codex install',
    '    npx productionos@latest --update [flags]',
    '                                           Pull latest version and reinstall',
    '    npx productionos@latest --help         Show this message',
    '',
    '  Environment:',
    '    CLAUDE_CONFIG_DIR   Override the Claude config directory',
    '                        (default: ~/.claude/)',
    '    CODEX_HOME         Override the Codex config directory',
    '                        (default: ~/.codex/)',
    '',
    '  After install, use slash commands in Claude Code:',
    '    /omni-plan-nth        Recursive orchestration, loops until 10/10',
    '    /auto-swarm-nth       Recursive swarm, 100% coverage',
    '    /production-upgrade   Recursive product audit',
    '    /deep-research        8-phase research pipeline',
    '    /max-research         500-1000 agent exhaustive research',
    '    /security-audit       7-domain OWASP/MITRE/NIST audit',
    '    /agentic-eval         CLEAR v2.0 evaluation',
    '    /logic-mode           Business idea validation',
    '    /learn-mode           Interactive code tutor',
    '    /context-engineer     Token-optimized context packaging',
    '    /omni-plan            13-step pipeline with tri-tiered judging',
    '    /auto-swarm           Distributed agent swarm',
    '    /productionos-help    Full command reference',
    '    /productionos-update  Self-update from GitHub',
    '',
    '  After Codex install, use:',
    '    $productionos         Root Codex skill',
    '    ~/.codex/plugins/productionos/.codex-plugin/plugin.json',
    '                        Native Codex plugin manifest',
    ''
  ].join('\n'));
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function printClaudeBanner(cmdCount, agentCount) {
  var pad2 = function(n) { return String(n).length < 2 ? ' ' + n : String(n); };
  console.log('  +---------------------------------------------------+');
  console.log('  |  ' + PRODUCT + ' v' + VERSION + ' installed successfully        |');
  console.log('  |  ' + pad2(cmdCount) + ' commands  |  ' + pad2(agentCount) + ' agents                      |');
  console.log('  |                                                   |');
  console.log('  |  Start with:  /omni-plan-nth [target]             |');
  console.log('  |  Full list:   /productionos-help                  |');
  console.log('  |  Uninstall:   npx productionos --uninstall        |');
  console.log('  +---------------------------------------------------+');
  console.log();
}

function printCodexBanner(pluginFileCount, skillFileCount, aliasCount) {
  console.log('  +---------------------------------------------------+');
  console.log('  |  ' + PRODUCT + ' v' + VERSION + ' installed for Codex         |');
  console.log('  |  Plugin files: ' + pluginFileCount + '  |  Skill files: ' + skillFileCount + '             |');
  console.log('  |  Workflow aliases: ' + aliasCount + '                           |');
  console.log('  |                                                   |');
  console.log('  |  Use:        $productionos                        |');
  console.log('  |  Alias:      $productionos-review                 |');
  console.log('  |  Plugin:     ~/.codex/plugins/productionos        |');
  console.log('  |  Skill:      ~/.codex/skills/productionos         |');
  console.log('  +---------------------------------------------------+');
  console.log();
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

function main() {
  var args = process.argv.slice(2);
  var flags = {};
  for (var i = 0; i < args.length; i++) {
    flags[args[i].toLowerCase()] = true;
  }

  if (flags['--help'] || flags['-h']) {
    printHelp();
    return;
  }

  if (flags['--update']) {
    update();
    return;
  }

  var installCodexTarget = !!flags['--codex'] || !!flags['--all-targets'];
  var installClaudeTarget = !!flags['--claude'] || !!flags['--all-targets'] || !installCodexTarget;

  if (flags['--uninstall']) {
    if (installClaudeTarget) uninstallClaude();
    if (installCodexTarget) uninstallCodex();
    return;
  }

  if (installClaudeTarget) installClaude();
  if (installCodexTarget) installCodex();
}

main();
