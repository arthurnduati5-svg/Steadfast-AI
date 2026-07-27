#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, getCurrentHead, ensureDir, computeHash, writeJSON, readJSON } from './agent-control-lib/repository.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

async function runPostCommit(taskId) {
  const root = getRepositoryRoot();
  const runtimeDir = getRuntimeDir(taskId);
  const errors = [];

  const commitVerPath = resolve(runtimeDir, 'commits', 'commit-verification.json');
  if (!existsSync(commitVerPath)) {
    errors.push('POST_COMMIT_VERIFICATION_MISSING: no commit verification found');
    writeVerification(taskId, errors);
    process.exit(1);
  }

  const commitVer = readJSON(commitVerPath);
  if (!commitVer.passed) {
    errors.push('COMMIT_GUARD_FAILED: commit verification did not pass');
  }

  const currentHead = getCurrentHead();
  if (currentHead !== commitVer.head) {
    errors.push(`POST_COMMIT_VERIFICATION_STALE: HEAD changed from ${commitVer.head} to ${currentHead}`);
  }

  const manifest = readJSON(resolve(runtimeDir, 'task-manifest.json'));
  const postCommitCommands = manifest?.postCommitCommands || [];

  if (postCommitCommands.length > 0) {
    for (const cmd of postCommitCommands) {
      try {
        const result = execSync(cmd, { cwd: root, encoding: 'utf-8', timeout: 60000, stdio: 'pipe' });
      } catch (e) {
        errors.push(`POST_COMMIT_COMMAND_FAILED: "${cmd}" exited with ${e.status}`);
      }
    }
  }

  const currentStatus = execSync('git status --porcelain=v1', { cwd: root, encoding: 'utf-8' }).trim();
  const dirtyLines = currentStatus.split('\n').filter(l => l.trim());
  const taskOwnedDirty = dirtyLines.filter(l => {
    const status = l.slice(0, 2).trim();
    const path = l.slice(3).trim();
    return status !== '' && manifest?.taskOwnedPaths?.some(owp => path.startsWith(owp));
  });

  if (taskOwnedDirty.length > 0) {
    errors.push(`DIRTY_TASK_WORKTREE: ${taskOwnedDirty.length} task-owned file(s) dirty after commit`);
  }

  const result = writeVerification(taskId, errors);
  if (errors.length > 0) {
    errors.forEach(e => console.error(`ERROR: ${e}`));
    console.log(`Valid: false`);
    process.exit(1);
  }

  console.log(`Post-commit verification passed.`);
  console.log(`Verified HEAD: ${currentHead}`);
  console.log(`Valid: true`);
}

function writeVerification(taskId, errors) {
  const runtimeDir = getRuntimeDir(taskId);
  ensureDir(resolve(runtimeDir, 'post-commit'));

  const head = getCurrentHead();
  const verification = {
    taskId,
    verifiedAt: new Date().toISOString(),
    head,
    errors,
    passed: errors.length === 0,
  };

  writeJSON(resolve(runtimeDir, 'post-commit', 'verification.json'), verification);
  return verification;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (!command || command === 'run') {
      const taskId = requireTaskId(args);
      await runPostCommit(taskId);
    } else if (command === 'check') {
      const taskId = requireTaskId(args);
      const verPath = resolve(getRuntimeDir(taskId), 'post-commit', 'verification.json');
      if (!existsSync(verPath)) {
        console.log('POST_COMMIT_VERIFICATION_MISSING');
        process.exit(1);
      }
      const ver = readJSON(verPath);
      console.log(`Post-commit verified: ${ver.passed}`);
      console.log(`Verified HEAD: ${ver.head}`);
      console.log(`Verified at: ${ver.verifiedAt}`);
      process.exit(ver.passed ? 0 : 1);
    } else {
      console.error('Usage: node scripts/post-commit-verifier.mjs run --task <task-id>');
      console.error('       node scripts/post-commit-verifier.mjs check --task <task-id>');
      process.exit(1);
    }
  } catch (e) {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  }
}

main();
