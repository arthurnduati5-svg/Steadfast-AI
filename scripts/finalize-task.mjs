#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { getRepositoryRoot, getRuntimeDir, getCurrentHead, computeHash, writeJSON, readJSON, ensureDir } from './agent-control-lib/repository.mjs';

const _filename = fileURLToPath(import.meta.url);
import { STATES, loadState, transitionState } from './agent-control-lib/state-machine.mjs';

function requireTaskId(args) {
  const idx = args.indexOf('--task');
  if (idx < 0) throw new Error('--task <task-id> required');
  return args[idx + 1];
}

function runGateCheck(script, argsList) {
  const root = getRepositoryRoot();
  try {
    const result = execSync(`node ${script} ${argsList.join(' ')}`, {
      cwd: root,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe',
    });
    return { passed: true, output: result };
  } catch (e) {
    return { passed: false, output: e.stderr || e.message };
  }
}

function printResult(result) {
  if (result.accepted) {
    console.log(`TASK_ACCEPTED: ${result.taskId}`);
    console.log(`ACCEPTED_COMMIT: ${result.acceptanceRecord?.acceptedCommit || ''}`);
    console.log(`SENTINEL: ${result.sentinel || ''}`);
    if (result.sentinel) console.log(result.sentinel);
  } else {
    console.log('TASK_NOT_ACCEPTED');
    console.log(`TASK_ID=${result.taskId}`);
    console.log(`STATE=${result.state || ''}`);
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((e, i) => console.log(`ERROR_${i + 1}=${e}`));
    }
    console.log('NEXT_REQUIRED_ACTION=Repair all errors and rerun finalize-task.mjs');
  }
}

async function finalize(taskId) {
  const root = getRepositoryRoot();
  const runtimeDir = getRuntimeDir(taskId);
  const errors = [];
  const scriptsDir = resolve(import.meta.dirname);

  const state = loadState(taskId);
  if (!state) {
    errors.push('TASK_NOT_FOUND');
    const result = finalizeResult(taskId, errors);
    printResult(result);
    return result;
  }

  if (state.currentState === STATES.ACCEPTED) {
    errors.push('TASK_ALREADY_ACCEPTED');
    const result = finalizeResult(taskId, errors);
    printResult(result);
    return result;
  }

  const gateScript = resolve(scriptsDir, 'task-governor.mjs');
  const wsScript = resolve(scriptsDir, 'workspace-guard.mjs');

  const manifestLockPath = resolve(runtimeDir, 'task-manifest.lock.json');
  if (!existsSync(manifestLockPath)) {
    errors.push('MANIFEST_NOT_LOCKED');
    const result = finalizeResult(taskId, errors);
    printResult(result);
    return result;
  }

  const lock = readJSON(manifestLockPath);
  if (!lock) {
    errors.push('MANIFEST_NOT_LOCKED');
    const result = finalizeResult(taskId, errors);
    printResult(result);
    return result;
  }

  const manifestPath = resolve(runtimeDir, 'task-manifest.json');
  let manifest = null;
  if (existsSync(manifestPath)) {
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifestHash = computeHash(manifestContent);
    manifest = JSON.parse(manifestContent);
    if (manifestHash !== lock.manifestHash) {
      errors.push('MANIFEST_HASH_CHANGED');
    }
    if (manifest.originalPromptHash) {
      const promptPath = resolve(runtimeDir, 'original-prompt.md');
      if (existsSync(promptPath)) {
        const promptContent = readFileSync(promptPath, 'utf-8');
        const promptHash = computeHash(promptContent);
        if (promptHash !== manifest.originalPromptHash) {
          errors.push('ORIGINAL_PROMPT_HASH_MISMATCH');
        }
      } else {
        errors.push('ORIGINAL_PROMPT_MISSING');
      }
    }
  }

  if (state.activeFailureIds && state.activeFailureIds.length > 0) {
    errors.push('ACTIVE_FAILURES_REMAIN');
  }

  const workspaceCheck = runGateCheck(wsScript, ['check', '--task', taskId]);
  if (!workspaceCheck.passed) errors.push('WORKSPACE_SCOPE_VIOLATION');

  const commitVerPath = resolve(runtimeDir, 'commits', 'commit-verification.json');
  if (!existsSync(commitVerPath)) {
    errors.push('COMMIT_MISSING');
  } else {
    const commitVer = readJSON(commitVerPath);
    if (!commitVer.passed) errors.push('COMMIT_GUARD_FAILED');
    const currentHead = getCurrentHead();
    if (commitVer.head !== currentHead) {
      errors.push('COMMIT_HEAD_MISMATCH');
    }
  }

  const postCommitPath = resolve(runtimeDir, 'post-commit', 'verification.json');
  if (!existsSync(postCommitPath)) {
    errors.push('POST_COMMIT_VERIFICATION_MISSING');
  } else {
    const postVer = readJSON(postCommitPath);
    if (!postVer.passed) errors.push('POST_COMMIT_VERIFICATION_FAILED');
    const currentHead = getCurrentHead();
    if (postVer.head !== currentHead) {
      errors.push('POST_COMMIT_VERIFICATION_STALE');
    }
  }

  const sentinelPath = resolve(runtimeDir, 'acceptance', 'accepted-sentinel.txt');
  if (existsSync(sentinelPath)) {
    const sentinelContent = readFileSync(sentinelPath, 'utf-8').trim();
    if (!sentinelContent.includes('finalize-task.mjs')) {
      errors.push('AGENT_AUTHORED_SENTINEL');
    }
  }

  const stagingReceiptPath = resolve(runtimeDir, 'staging', 'staging-receipt.json');
  if (!existsSync(stagingReceiptPath)) {
    errors.push('STAGING_RECEIPT_MISSING');
  }

  const acceptedSentinel = (manifest && manifest.acceptedSentinel) || `${taskId}_ACCEPTED`;

  const result = finalizeResult(taskId, errors, state, lock);

  if (errors.length === 0) {
    if (!manifest) {
      errors.push('MANIFEST_ACCESS_REQUIRED');
      const r = finalizeResult(taskId, errors, state, lock);
      printResult(r);
      return r;
    }
    const expectedSentinel = manifest.acceptedSentinel;
    if (!expectedSentinel || expectedSentinel.trim().length === 0) {
      errors.push('MANIFEST_SENTINEL_EMPTY');
      const r = finalizeResult(taskId, errors, state, lock);
      printResult(r);
      return r;
    }
    transitionState(taskId, STATES.ACCEPTED, 'finalize-task.mjs');
    const sentinelText = expectedSentinel;
    const sentinelContent = [
      `Task: ${taskId}`,
      `Manifest hash: ${lock.manifestHash}`,
      `Accepted commit: ${getCurrentHead()}`,
      `Post-commit verification hash: ${computeHash(JSON.stringify(result))}`,
      `Acceptance timestamp: ${new Date().toISOString()}`,
      `Final sentinel: ${sentinelText}`,
      `Finalizer script: scripts/finalize-task.mjs`,
      `Produced by: finalize-task.mjs`,
    ].join('\n');

    ensureDir(resolve(runtimeDir, 'acceptance'));
    writeFileSync(sentinelPath, sentinelContent, 'utf-8');

    const acceptanceRecord = {
      taskId,
      manifestHash: lock.manifestHash,
      acceptedCommit: getCurrentHead(),
      acceptedAt: new Date().toISOString(),
      sentinelText,
      sentinelHash: computeHash(sentinelContent),
      finalizerScript: 'scripts/finalize-task.mjs',
      finalizerHash: computeHash(readFileSync(_filename, 'utf-8')),
      gatesPassed: errors.length === 0,
    };
    writeJSON(resolve(runtimeDir, 'acceptance', 'acceptance-record.json'), acceptanceRecord);

    result.accepted = true;
    result.sentinel = sentinelText;
    result.acceptanceRecord = acceptanceRecord;

    printResult(result);
  } else {
    printResult(result);
  }

  return result;
}

function finalizeResult(taskId, errors, state, lock) {
  return {
    accepted: false,
    taskId,
    errors,
    state: state?.currentState,
    manifestHash: lock?.manifestHash,
  };
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const taskId = requireTaskId(args);
    await finalize(taskId);
  } catch (e) {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  }
}

main();
