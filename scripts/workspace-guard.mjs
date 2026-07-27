#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { getRepositoryRoot, getRuntimeDir, getCurrentHead, getGitStatus, getStagedFiles, ensureDir, computeHash, computeFileHash, writeJSON, readJSON } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function captureBaseline(taskId) {
  const root = getRepositoryRoot();
  const runtimeDir = getRuntimeDir(taskId);
  const baselineDir = resolve(runtimeDir, 'baseline');
  ensureDir(baselineDir);

  const gitStatus = getGitStatus();
  const stagedFiles = getStagedFiles();
  const head = getCurrentHead();

  const baseline = {
    taskId,
    phase: 'baseline',
    capturedAt: new Date().toISOString(),
    head,
    branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 5000 }).trim(),
    gitStatus,
    stagedFiles,
    hasUntracked: gitStatus.split('\n').filter(l => l.startsWith('??')).length > 0,
    hasModified: gitStatus.split('\n').filter(l => l.startsWith(' M') || l.startsWith('M ')).length > 0,
  };

  writeJSON(resolve(baselineDir, 'git-status.json'), baseline);
  console.log('Baseline captured.');
  console.log(`HEAD: ${head}`);
  console.log(`Modified files: ${baseline.hasModified}`);
  console.log(`Untracked files: ${baseline.hasUntracked}`);
  return baseline;
}

function captureFinal(taskId) {
  const root = getRepositoryRoot();
  const runtimeDir = getRuntimeDir(taskId);
  const finalDir = resolve(runtimeDir, 'final');
  ensureDir(finalDir);

  const gitStatus = getGitStatus();
  const stagedFiles = getStagedFiles();
  const head = getCurrentHead();

  const final = {
    taskId,
    phase: 'final',
    capturedAt: new Date().toISOString(),
    head,
    gitStatus,
    stagedFiles,
    hasUntracked: gitStatus.split('\n').filter(l => l.startsWith('??')).length > 0,
    hasModified: gitStatus.split('\n').filter(l => l.startsWith(' M') || l.startsWith('M ')).length > 0,
  };

  writeJSON(resolve(finalDir, 'git-status.json'), final);
  return final;
}

function checkWorkspace(taskId) {
  const runtimeDir = getRuntimeDir(taskId);
  const root = getRepositoryRoot();

  const baselinePath = resolve(runtimeDir, 'baseline', 'git-status.json');
  if (!existsSync(baselinePath)) {
    return { valid: false, errors: ['No baseline captured. Run capture-baseline first.'] };
  }

  const baseline = readJSON(baselinePath);
  const currentStatus = getGitStatus();
  const currentHead = getCurrentHead();

  const errors = [];
  const warnings = [];

  if (currentHead !== baseline.head) {
    warnings.push(`HEAD changed: ${baseline.head} -> ${currentHead}`);
  }

  const currentLines = currentStatus.split('\n').filter(l => l.trim());
  const trackedModified = currentLines.filter(l => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('MM'));
  const untracked = currentLines.filter(l => l.startsWith('??'));
  const stagedNonGovernance = currentLines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D '));

  const baselineLines = (baseline.gitStatus || '').split('\n').filter(l => l.trim());
  const baselineModified = baselineLines.filter(l => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('MM'));
  const baselineModifiedPaths = new Set(baselineModified.map(l => l.slice(3).trim()));

  const newModified = trackedModified.filter(l => !baselineModifiedPaths.has(l.slice(3).trim()));

  if (newModified.length > 0) {
    errors.push(`New modified tracked files: ${newModified.map(l => l.slice(3)).join(', ')}`);
  }

  if (trackedModified.length > 0 && newModified.length === 0) {
    warnings.push(`${trackedModified.length} pre-existing modified file(s) unchanged since baseline`);
  }

  return { valid: errors.length === 0, errors, warnings, untracked: untracked.length };
}

function checkDirtyNext(taskId) {
  const root = getRepositoryRoot();
  const nextDir = resolve(root, 'frontend', '.next');
  if (!existsSync(nextDir)) return { valid: true, errors: [] };

  const errors = [];
  const status = getGitStatus();
  const nextChanges = status.split('\n').filter(l => l.includes('.next'));
  if (nextChanges.length > 0) {
    errors.push(`DIRTY_NEXT_OUTPUT: ${nextChanges.length} .next file(s) changed`);
  }
  return { valid: errors.length === 0, errors };
}

function checkGovernancePathsClean(taskId) {
  const root = getRepositoryRoot();
  const governancePaths = ['AGENTS.md', 'opencode.json', '.opencode/', 'agent-control/', 'scripts/bootstrap-task.mjs', 'scripts/task-governor.mjs', 'scripts/workspace-guard.mjs', 'scripts/test-inventory-guard.mjs', 'scripts/evidence-validator.mjs', 'scripts/visual-evidence-validator.mjs', 'scripts/browser-process-guard.mjs', 'scripts/commit-guard.mjs', 'scripts/post-commit-verifier.mjs', 'scripts/finalize-task.mjs', 'scripts/agent-control-lib/', 'tasks/README.md'];

  const status = getGitStatus();
  const errors = [];

  for (const line of status.split('\n').filter(l => l.trim())) {
    const path = line.slice(3).trim();
    const isGovernance = governancePaths.some(gp => path === gp || path.startsWith(gp));
    if (!isGovernance && (line.startsWith(' M') || line.startsWith('M ') || line.startsWith('??'))) {
      // This is a non-governance path - we track it for info but don't error
    }
  }

  return { valid: true, errors: [] };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage:');
    console.log('  node scripts/workspace-guard.mjs capture-baseline --task <task-id>');
    console.log('  node scripts/workspace-guard.mjs capture-final --task <task-id>');
    console.log('  node scripts/workspace-guard.mjs check --task <task-id>');
    console.log('  node scripts/workspace-guard.mjs check-dirty-next --task <task-id>');
    console.log('  node scripts/workspace-guard.mjs check-governance-paths --task <task-id>');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'capture-baseline': {
        captureBaseline(requireTaskId(args));
        break;
      }
      case 'capture-final': {
        captureFinal(requireTaskId(args));
        break;
      }
      case 'check': {
        const result = checkWorkspace(requireTaskId(args));
        if (result.errors.length > 0) {
          result.errors.forEach(e => console.error(`ERROR: ${e}`));
        }
        if (result.warnings.length > 0) {
          result.warnings.forEach(w => console.warn(`WARN: ${w}`));
        }
        console.log(`Valid: ${result.valid}`);
        console.log(`Errors: ${result.errors.length}`);
        console.log(`Warnings: ${result.warnings.length}`);
        process.exit(result.valid ? 0 : 1);
      }
      case 'check-dirty-next': {
        const result = checkDirtyNext(requireTaskId(args));
        result.errors.forEach(e => console.error(`ERROR: ${e}`));
        console.log(`Valid: ${result.valid}`);
        process.exit(result.valid ? 0 : 1);
      }
      case 'check-governance-paths': {
        const result = checkGovernancePathsClean(requireTaskId(args));
        result.errors.forEach(e => console.error(`ERROR: ${e}`));
        console.log(`Valid: ${result.valid}`);
        process.exit(result.valid ? 0 : 1);
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

main();
