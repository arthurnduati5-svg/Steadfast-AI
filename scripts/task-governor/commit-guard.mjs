import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getRepositoryRoot } from './repository-root.mjs';
import { loadManifest } from './manifest-loader.mjs';
import { validateManifest } from './manifest-validator.mjs';
import { loadState, updateState } from './state-store.mjs';
import { verifyChain, addRecord } from './evidence-ledger.mjs';
import { getCurrentHead, getStatus, classifyPath } from './workspace-guard.mjs';
import { STATES } from './constants.mjs';
import { GovernorError, CommitOrderError } from './errors.mjs';

function runGit(args) {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 15000,
    }).trim();
  } catch {
    return '';
  }
}

export function prepareCommit(taskId) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);

  if (state.currentState !== STATES.PRE_COMMIT_VERIFICATION && state.currentState !== STATES.STAGING) {
    throw new GovernorError(`prepare-commit requires state PRE_COMMIT_VERIFICATION or STAGING, current: ${state.currentState}`, 15);
  }

  const staged = runGit('diff --cached --name-only').split('\n').filter(l => l.trim());
  if (staged.length === 0) {
    throw new GovernorError('No staged files. Stage files before running prepare-commit.', 15);
  }

  for (const file of staged) {
    const classification = classifyPath(file, manifest);
    if (classification !== 'TASK_ALLOWED') {
      throw new GovernorError(`Unauthorized staged file: ${file} (${classification})`, 13);
    }
  }

  const checkResult = runGit('diff --cached --check');
  if (checkResult && !checkResult.includes('No trailing whitespace') && checkResult.includes('trailing whitespace')) {
    throw new GovernorError(`Whitespace issues in staged files:\n${checkResult}`, 15);
  }

  const headBefore = getCurrentHead();
  addRecord({
    taskId,
    gateId: 'prepare-commit',
    stateBefore: state.currentState,
    stateAfter: STATES.STAGING,
    headBefore,
    headAfter: headBefore,
    exitCode: 0,
    executable: 'git',
    args: ['diff', '--cached'],
    manifestHash: state.manifestHash,
  });

  updateState(taskId, { currentState: STATES.STAGING });

  return {
    passed: true,
    stagedCount: staged.length,
    stagedFiles: staged,
  };
}

export function recordImplementationCommit(taskId, commitMessage) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);

  if (state.currentState !== STATES.STAGING) {
    throw new GovernorError(`record-implementation-commit requires state STAGING, current: ${state.currentState}`, 15);
  }

  const headBefore = getCurrentHead();
  const currentHead = getCurrentHead();

  const log = runGit('log --oneline -1');
  const newHead = runGit('rev-parse HEAD');

  if (newHead === headBefore) {
    throw new GovernorError('HEAD did not change. No commit was created.', 15);
  }

  const mergeBase = runGit(`merge-base --is-ancestor ${headBefore} ${newHead}`).trim();

  const message = runGit('log --oneline --format=%s -1');
  if (commitMessage && !message.includes(commitMessage.replace(/^fix\(|^feat\(|^docs\(/g, '').replace(/\).*$/, ''))) {
  }

  const committedFiles = runGit('diff --name-status HEAD~1..HEAD').split('\n').filter(l => l.trim());
  for (const line of committedFiles) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const status = parts[0];
    const file = parts[1];
    if (status !== 'D') {
      const classification = classifyPath(file, manifest);
      if (classification === 'PROTECTED_UNRELATED' || classification === 'NEW_UNAUTHORIZED_CHANGE') {
        throw new GovernorError(`Implementation commit contains unauthorized file: ${file}`, 13);
      }
    }
  }

  const isDocsOnly = committedFiles.every(line => {
    const file = line.split('\t')[1];
    return file && (file.startsWith('docs/') || file.endsWith('.md'));
  });

  if (isDocsOnly) {
    throw new CommitOrderError('Implementation commit appears docs-only. Use record-accountability-commit instead.');
  }

  addRecord({
    taskId,
    gateId: 'implementation-commit',
    stateBefore: state.currentState,
    stateAfter: STATES.IMPLEMENTATION_COMMITTED,
    headBefore,
    headAfter: newHead,
    exitCode: 0,
    executable: 'git',
    args: ['commit'],
    manifestHash: state.manifestHash,
  });

  updateState(taskId, {
    currentState: STATES.IMPLEMENTATION_COMMITTED,
    implementationCommitHash: newHead,
    currentHead: newHead,
  });

  return {
    passed: true,
    implementationCommitHash: newHead,
    committedFiles,
  };
}

export function recordAccountabilityCommit(taskId, commitMessage) {
  const manifest = loadManifest(taskId);
  validateManifest(manifest);
  const state = loadState(taskId);

  if (state.currentState !== STATES.ACCOUNTABILITY_COMMITTED && state.currentState !== STATES.POST_COMMIT_VERIFICATION) {
    throw new GovernorError(
      `record-accountability-commit requires state POST_COMMIT_VERIFICATION or ACCOUNTABILITY_COMMITTED, current: ${state.currentState}`,
      15
    );
  }

  const headBefore = getCurrentHead();
  const newHead = runGit('rev-parse HEAD');

  if (newHead === headBefore) {
    throw new GovernorError('HEAD did not change. No commit was created.', 15);
  }

  const committedFiles = runGit('diff --name-status HEAD~1..HEAD').split('\n').filter(l => l.trim());

  const docsOnly = committedFiles.every(line => {
    const file = line.split('\t')[1];
    return file && (file.startsWith('docs/') || file.endsWith('.md'));
  });

  if (!docsOnly) {
    throw new GovernorError('Accountability commit must be docs-only', 15);
  }

  if (manifest.scope && manifest.scope.accountabilityDocument) {
    const docFound = committedFiles.some(line => {
      const file = line.split('\t')[1];
      return file === manifest.scope.accountabilityDocument;
    });
    if (!docFound) {
      throw new GovernorError(`Accountability commit must include the configured accountability document: ${manifest.scope.accountabilityDocument}`, 15);
    }
  }

  for (const line of committedFiles) {
    const file = line.split('\t')[1];
    if (file === manifest.scope.accountabilityDocument) {
      const root = getRepositoryRoot();
      const docPath = resolve(root, file);
      if (existsSync(docPath)) {
        const content = readFileSync(docPath, 'utf-8');
        if (content.includes(manifest.acceptance.sentinel)) {
          throw new GovernorError('Accountability document contains the acceptance sentinel', 15);
        }
        if (content.includes(newHead)) {
          throw new GovernorError('Accountability document contains its own commit hash', 15);
        }
      }
    }
  }

  const postCommitVerification = runGit('diff --name-only').split('\n').filter(l => l.trim());
  for (const file of postCommitVerification) {
    if (manifest.scope.allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      if (!committedFiles.some(line => line.split('\t')[1] === file)) {
        throw new GovernorError(`Code file changed but not committed: ${file}`, 15);
      }
    }
  }

  addRecord({
    taskId,
    gateId: 'accountability-commit',
    stateBefore: state.currentState,
    stateAfter: STATES.ACCOUNTABILITY_COMMITTED,
    headBefore,
    headAfter: newHead,
    exitCode: 0,
    executable: 'git',
    args: ['commit'],
    manifestHash: state.manifestHash,
  });

  updateState(taskId, {
    currentState: STATES.ACCOUNTABILITY_COMMITTED,
    accountabilityCommitHash: newHead,
    currentHead: newHead,
  });

  return {
    passed: true,
    accountabilityCommitHash: newHead,
    committedFiles,
  };
}

export function verifyCommitOrdering(taskId) {
  const state = loadState(taskId);

  if (state.implementationCommitHash && state.accountabilityCommitHash) {
    const implTime = runGit(`log -1 --format=%ct ${state.implementationCommitHash}`);
    const accTime = runGit(`log -1 --format=%ct ${state.accountabilityCommitHash}`);

    if (implTime && accTime && parseInt(accTime) < parseInt(implTime)) {
      throw new CommitOrderError('Accountability commit predates implementation commit');
    }
  }

  return true;
}
