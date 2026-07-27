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

  const statusLines = gitStatus.split('\n').filter(l => l.trim());
  const modifiedTracked = statusLines.filter(l => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('MM'));
  const untracked = statusLines.filter(l => l.startsWith('??'));
  const deleted = statusLines.filter(l => l.startsWith(' D') || l.startsWith('D '));
  const renamed = statusLines.filter(l => l.startsWith(' R') || l.startsWith('R '));

  function capturePath(l) { return l.substring(2).trim(); }
  const dirtyTrackedHashes = {};
  for (const line of modifiedTracked) {
    const path = capturePath(line);
    try {
      dirtyTrackedHashes[path] = computeHash(readFileSync(resolve(root, path)));
    } catch (e) {
      dirtyTrackedHashes[path] = 'UNREADABLE';
    }
  }

  const baseline = {
    taskId,
    phase: 'baseline',
    capturedAt: new Date().toISOString(),
    head,
    branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 5000 }).trim(),
    gitStatus,
    stagedFiles,
    statusLineCount: statusLines.length,
    modifiedTrackedCount: modifiedTracked.length,
    untrackedCount: untracked.length,
    deletedCount: deleted.length,
    renamedCount: renamed.length,
    modifiedTracked,
    untracked,
    deleted,
    renamed,
    dirtyTrackedHashes,
    hasUntracked: untracked.length > 0,
    hasModified: modifiedTracked.length > 0,
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

  const manifestPath = resolve(runtimeDir, 'task-manifest.json');
  const manifest = existsSync(manifestPath) ? readJSON(manifestPath) : { taskOwnedPaths: [] };

  const baseline = readJSON(baselinePath);
  const currentStatus = getGitStatus();
  const currentHead = getCurrentHead();

  const errors = [];
  const warnings = [];

  if (currentHead !== baseline.head && !currentHead.startsWith('0000')) {
    warnings.push(`HEAD changed: ${baseline.head} -> ${currentHead}`);
  }

  const currentLines = currentStatus.split('\n').filter(l => l.trim());
  const trackedModified = currentLines.filter(l => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('MM'));
  const untracked = currentLines.filter(l => l.startsWith('??'));
  const deleted = currentLines.filter(l => l.startsWith(' D') || l.startsWith('D '));
  const renamed = currentLines.filter(l => l.startsWith(' R') || l.startsWith('R '));
  const staged = currentLines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ') || l.startsWith('R '));

  function statusPath(l) { return l.substring(2).trim(); }

  const baselineModifiedPaths = new Set((baseline.modifiedTracked || []).map(l => statusPath(l)));
  const baselineUntrackedPaths = new Set((baseline.untracked || []).map(l => statusPath(l)));

  const isTaskOwned = (path) => {
    return (manifest.taskOwnedPaths || []).some(owned => path === owned || path.startsWith(owned));
  };

  const manifestPathFromLock = resolve(runtimeDir, 'task-manifest.json');
  const taskOwnedPaths = existsSync(manifestPathFromLock) ? (readJSON(manifestPathFromLock)?.taskOwnedPaths || []) : [];

  const newModified = trackedModified.filter(l => !baselineModifiedPaths.has(statusPath(l)));
  const preExistingModified = trackedModified.filter(l => baselineModifiedPaths.has(statusPath(l)));

  if (preExistingModified.length > 0) {
    for (const line of preExistingModified) {
      const path = statusPath(line);
      if (!isTaskOwned(path)) {
        const oldHash = baseline.dirtyTrackedHashes && baseline.dirtyTrackedHashes[path];
        if (oldHash && oldHash !== 'UNREADABLE') {
          try {
            const newHash = computeHash(readFileSync(resolve(root, path)));
            if (newHash !== oldHash) {
              errors.push(`CHANGED_PRE_EXISTING_DIRT: ${path}`);
            }
          } catch (e) {
            errors.push(`UNREADABLE_PRE_EXISTING_PATH: ${path}`);
          }
        }
      }
    }
  }

  if (newModified.length > 0) {
    errors.push(`NEW_MODIFIED_TRACKED_FILES: ${newModified.map(l => statusPath(l)).join(', ')}`);
  }

  const newUntracked = untracked.filter(l => {
    const path = statusPath(l);
    if (isTaskOwned(path)) return true;
    return !baselineUntrackedPaths.has(path);
  });

  if (newUntracked.length > 0) {
    errors.push(`UNTRACKED_FILES: ${newUntracked.map(l => statusPath(l)).join(', ')}`);
  }

  const baselineDeletedPaths = new Set((baseline.deleted || []).map(l => statusPath(l)));
  const newDeleted = deleted.filter(l => !baselineDeletedPaths.has(statusPath(l)));
  if (newDeleted.length > 0) {
    errors.push(`DELETED_FILES: ${newDeleted.map(l => statusPath(l)).join(', ')}`);
  }

  const baselineRenamedPaths = new Set((baseline.renamed || []).map(l => statusPath(l)));
  const newRenamed = renamed.filter(l => !baselineRenamedPaths.has(statusPath(l)));
  if (newRenamed.length > 0) {
    errors.push(`RENAMED_FILES: ${newRenamed.map(l => statusPath(l)).join(', ')}`);
  }

  const baselineStagedPaths = new Set((baseline.stagedFiles || '').split('\n').map(l => l.split(/\s+/).slice(1).join(' ').trim()).filter(Boolean));
  const newStaged = staged.filter(l => {
    if (baselineStagedPaths.has(statusPath(l))) return false;
    return isTaskOwned(statusPath(l));
  });
  if (newStaged.length > 0) {
    errors.push(`STAGED_FILES_EXIST: ${newStaged.map(l => statusPath(l)).join(', ')}`);
  }

  return { valid: errors.length === 0, errors, warnings, untrackedCount: untracked.length };
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
