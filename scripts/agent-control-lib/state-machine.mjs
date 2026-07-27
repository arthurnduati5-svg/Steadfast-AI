import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRuntimeDir, ensureDir, computeHash, writeJSON, readJSON, readLines, appendLine } from './repository.mjs';

const STATE_SCHEMA_VERSION = 1;

export const STATES = Object.freeze({
  CREATED: 'CREATED',
  BASELINE_CAPTURE: 'BASELINE_CAPTURE',
  AUDITING: 'AUDITING',
  IMPLEMENTING: 'IMPLEMENTING',
  ERROR_REPAIR: 'ERROR_REPAIR',
  VERIFYING: 'VERIFYING',
  STAGING: 'STAGING',
  COMMITTING: 'COMMITTING',
  POST_COMMIT_VERIFYING: 'POST_COMMIT_VERIFYING',
  ACCEPTED: 'ACCEPTED',
  OWNER_INPUT_REQUIRED: 'OWNER_INPUT_REQUIRED',
});

export const VALID_TRANSITIONS = {
  [STATES.CREATED]: [STATES.BASELINE_CAPTURE, STATES.ERROR_REPAIR, STATES.OWNER_INPUT_REQUIRED],
  [STATES.BASELINE_CAPTURE]: [STATES.AUDITING, STATES.ERROR_REPAIR],
  [STATES.AUDITING]: [STATES.IMPLEMENTING, STATES.ERROR_REPAIR],
  [STATES.IMPLEMENTING]: [STATES.VERIFYING, STATES.ERROR_REPAIR],
  [STATES.ERROR_REPAIR]: [STATES.BASELINE_CAPTURE, STATES.AUDITING, STATES.IMPLEMENTING, STATES.VERIFYING, STATES.STAGING, STATES.COMMITTING, STATES.POST_COMMIT_VERIFYING, STATES.OWNER_INPUT_REQUIRED],
  [STATES.VERIFYING]: [STATES.STAGING, STATES.ERROR_REPAIR],
  [STATES.STAGING]: [STATES.COMMITTING, STATES.ERROR_REPAIR],
  [STATES.COMMITTING]: [STATES.POST_COMMIT_VERIFYING, STATES.ERROR_REPAIR],
  [STATES.POST_COMMIT_VERIFYING]: [STATES.ACCEPTED, STATES.ERROR_REPAIR],
  [STATES.ACCEPTED]: [],
  [STATES.OWNER_INPUT_REQUIRED]: [STATES.ERROR_REPAIR],
};

export function isValidTransition(fromState, toState) {
  const allowed = VALID_TRANSITIONS[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}

function getStatePath(taskId) {
  return resolve(getRuntimeDir(taskId), 'task-state.json');
}

function getHistoryPath(taskId) {
  return resolve(getRuntimeDir(taskId), 'state-history.jsonl');
}

export function getDefaultState(taskId, manifestHash, startingHead, taskWorktree, taskBranch) {
  const genesis = crypto.createHash('sha256').update('genesis').digest('hex');
  const base = {
    schemaVersion: STATE_SCHEMA_VERSION,
    taskId,
    manifestHash: manifestHash || '',
    currentState: STATES.CREATED,
    previousState: '',
    resumeState: '',
    revision: 0,
    startingHead: startingHead || '',
    workingHead: startingHead || '',
    taskWorktree: taskWorktree || '',
    taskBranch: taskBranch || '',
    activeFailureIds: [],
    resolvedFailureIds: [],
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: 'system',
    previousStateHash: genesis,
    stateHash: '',
    postCommitVerifiedHead: '',
    acceptedAt: '',
    acceptedSentinelHash: '',
  };
  const hash = computeStateHash(base);
  base.stateHash = hash;
  return base;
}

export function loadState(taskId) {
  const sp = getStatePath(taskId);
  if (!existsSync(sp)) return null;
  return JSON.parse(readFileSync(sp, 'utf-8'));
}

export function computeStateHash(state) {
  const obj = { ...state };
  delete obj.previousStateHash;
  delete obj.stateHash;
  return computeHash(JSON.stringify(obj));
}

export function writeState(taskId, state) {
  const stateHash = computeStateHash(state);
  const toWrite = { ...state, stateHash };
  const sp = getStatePath(taskId);
  writeJSON(sp, toWrite);
  return toWrite;
}

export function validateStateChain(taskId) {
  const state = loadState(taskId);
  if (!state) return { valid: false, errors: ['STATE_NOT_FOUND'] };
  const errors = [];
  const recomputed = computeStateHash(state);
  if (state.stateHash && state.stateHash !== recomputed) {
    errors.push('STATE_HASH_MISMATCH');
  }
  if (state.revision < 0) {
    errors.push('NEGATIVE_REVISION');
  }
  const historyPath = getHistoryPath(taskId);
  const historyLines = readLines(historyPath);
  if (historyLines.length > 0 && state.revision > 0 && historyLines.length < state.revision) {
    errors.push('STATE_HISTORY_INCOMPLETE');
  }
  if (historyLines.length > 0) {
    const lastHistory = JSON.parse(historyLines[historyLines.length - 1]);
    if (lastHistory.stateHash !== state.stateHash) {
      errors.push('STATE_HISTORY_LAST_HASH_MISMATCH');
    }
    if (lastHistory.revision !== state.revision) {
      errors.push('STATE_HISTORY_REVISION_MISMATCH');
    }
  }
  if (state.revision > 0 && !state.previousStateHash) {
    errors.push('MISSING_PREVIOUS_STATE_HASH');
  }
  return { valid: errors.length === 0, errors };
}

export function transitionState(taskId, toState, transitionBy = 'task-governor.mjs') {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  if (!isValidTransition(state.currentState, toState)) {
    throw new Error(`Illegal state transition: ${state.currentState} -> ${toState}`);
  }

  if (toState === STATES.ACCEPTED && transitionBy !== 'finalize-task.mjs') {
    throw new Error(`Only finalize-task.mjs can transition to ACCEPTED`);
  }

  const chainCheck = validateStateChain(taskId);
  if (!chainCheck.valid) {
    throw new Error(`State chain invalid before transition: ${chainCheck.errors.join(', ')}`);
  }

  const previousHash = state.stateHash || crypto.createHash('sha256').update('genesis').digest('hex');

  const newState = {
    ...state,
    previousState: state.currentState,
    currentState: toState,
    resumeState: (toState !== STATES.ERROR_REPAIR && toState !== STATES.OWNER_INPUT_REQUIRED) ? toState : state.resumeState || state.currentState,
    revision: state.revision + 1,
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: transitionBy,
    previousStateHash: previousHash,
    stateHash: '',
    postCommitVerifiedHead: (toState === STATES.ACCEPTED) ? state.postCommitVerifiedHead : state.postCommitVerifiedHead,
  };

  const written = writeState(taskId, newState);

  const historyRecord = {
    timestamp: newState.lastTransitionAt,
    fromState: state.currentState,
    toState,
    revision: written.revision,
    transitionBy,
    previousStateHash: previousHash,
    stateHash: written.stateHash,
  };
  const historyPath = getHistoryPath(taskId);
  appendLine(historyPath, JSON.stringify(historyRecord));

  return written;
}

export function recordFailure(taskId, failureId, originatingState, returnState, failingCommand, exitCode, evidencePath) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  const chainCheck = validateStateChain(taskId);
  if (!chainCheck.valid) {
    throw new Error(`State chain invalid before recording failure: ${chainCheck.errors.join(', ')}`);
  }

  const failureRecord = {
    failureId,
    originatingState,
    returnState,
    failingCommand,
    exitCode,
    evidencePath,
    rootCauseStatus: 'unresolved',
    repairAttemptCount: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = {
    ...state,
    activeFailureIds: [...new Set([...state.activeFailureIds, failureId])],
    currentState: STATES.ERROR_REPAIR,
    previousState: state.currentState,
    resumeState: returnState || state.currentState,
    revision: state.revision + 1,
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: 'task-governor.mjs',
    previousStateHash: state.stateHash || crypto.createHash('sha256').update('genesis').digest('hex'),
  };

  const written = writeState(taskId, updated);
  return written;
}

export function resolveFailure(taskId, failureId) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  const chainCheck = validateStateChain(taskId);
  if (!chainCheck.valid) {
    throw new Error(`State chain invalid before resolving failure: ${chainCheck.errors.join(', ')}`);
  }

  const activeFailures = state.activeFailureIds.filter(f => f !== failureId);
  const resolvedFailures = [...new Set([...state.resolvedFailureIds, failureId])];
  const returnState = state.resumeState;

  const updated = {
    ...state,
    activeFailureIds: activeFailures,
    resolvedFailureIds: resolvedFailures,
    currentState: activeFailures.length === 0 ? returnState : STATES.ERROR_REPAIR,
    revision: state.revision + 1,
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: 'task-governor.mjs',
    previousStateHash: state.stateHash || crypto.createHash('sha256').update('genesis').digest('hex'),
  };

  const written = writeState(taskId, updated);
  return written;
}

export function isAccepted(taskId) {
  const state = loadState(taskId);
  return state && state.currentState === STATES.ACCEPTED;
}
