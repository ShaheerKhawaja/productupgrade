#!/usr/bin/env node

// ProductionOS Installer
// Zero dependencies -- uses only Node.js built-ins.
// .cjs extension ensures CommonJS even when package.json has "type": "module".
//
// Usage:
//   npx productionos@latest              Install globally to ~/.claude/
//   npx productionos@latest --uninstall  Remove all ProductionOS files
//   npx productionos@latest --update     Pull latest version and reinstall
//   npx productionos@latest --help       Show this message

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRODUCT = 'ProductionOS';
const VERSION = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
const PKG_ROOT = path.join(__dirname, '..');

// Namespace constants -- avoids collisions with other plugins (GSD uses gsd-)
const COMMANDS_NS = 'productionos';      // -> commands/productionos/
const AGENTS_PREFIX = 'pos-';            // -> agents/pos-*.md
const DATA_DIR = 'productionos';         // -> productionos/ (VERSION, data)

// Source paths relative to the npm package root
const SRC = {
  commands: path.join(PKG_ROOT, '.claude', 'commands'),
  skills:   path.join(PKG_ROOT, '.claude', 'skills'),
  agents:   path.join(PKG_ROOT, 'agents'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the Claude config directory, respecting CLAUDE_CONFIG_DIR. */
function resolveTarget() {
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return path.join(os.homedir(), '.claude');
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

function install() {
  var target = resolveTarget();
  console.log('\n  Installing ' + PRODUCT + ' v' + VERSION);
  console.log('  Target: ' + target + '\n');

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
  printBanner(cmdCount, agentCount);
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstall() {
  var target = resolveTarget();
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

// ---------------------------------------------------------------------------
// Update -- delegates to npx to fetch the latest published version
// ---------------------------------------------------------------------------

function update() {
  console.log('\n  Updating ' + PRODUCT + ' to latest...\n');
  try {
    // execFileSync prevents shell injection -- args are passed as an array
    execFileSync('npx', ['productionos@latest'], { stdio: 'inherit' });
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
    '    npx productionos@latest              Install to ~/.claude/',
    '    npx productionos@latest --uninstall  Remove all ProductionOS files',
    '    npx productionos@latest --update     Pull latest version and reinstall',
    '    npx productionos@latest --help       Show this message',
    '',
    '  Environment:',
    '    CLAUDE_CONFIG_DIR   Override the Claude config directory',
    '                        (default: ~/.claude/)',
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
    ''
  ].join('\n'));
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function printBanner(cmdCount, agentCount) {
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

  if (flags['--uninstall']) {
    uninstall();
    return;
  }

  if (flags['--update']) {
    update();
    return;
  }

  // Default: install
  install();
}

main();
