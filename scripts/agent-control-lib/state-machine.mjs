import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRuntimeDir, ensureDir, computeHash, writeJSON, readJSON, appendLine } from './repository.mjs';

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
  return {
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
    previousStateHash: crypto.createHash('sha256').update('genesis').digest('hex'),
    stateHash: '',
    postCommitVerifiedHead: '',
    acceptedAt: '',
    acceptedSentinelHash: '',
  };
}

export function loadState(taskId) {
  const sp = getStatePath(taskId);
  if (!existsSync(sp)) return null;
  return JSON.parse(readFileSync(sp, 'utf-8'));
}

function computeStateHash(state) {
  const obj = { ...state };
  delete obj.previousStateHash;
  delete obj.stateHash;
  return computeHash(JSON.stringify(obj));
}

export function transitionState(taskId, toState, transitionBy = 'task-governor.mjs') {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

  if (!isValidTransition(state.currentState, toState)) {
    throw new Error(`Illegal state transition: ${state.currentState} -> ${toState}`);
  }

  const previousHash = state.stateHash || crypto.createHash('sha256').update('genesis').digest('hex');
  const newStateHash = computeStateHash({ ...state, currentState: toState, previousState: state.currentState });

  const newState = {
    ...state,
    previousState: state.currentState,
    currentState: toState,
    resumeState: (toState !== STATES.ERROR_REPAIR && toState !== STATES.OWNER_INPUT_REQUIRED) ? toState : state.resumeState || state.currentState,
    revision: state.revision + 1,
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: transitionBy,
    previousStateHash: previousHash,
    stateHash: newStateHash,
  };

  writeJSON(getStatePath(taskId), newState);

  const historyRecord = {
    timestamp: newState.lastTransitionAt,
    fromState: state.currentState,
    toState,
    revision: newState.revision,
    transitionBy,
    previousStateHash: previousHash,
    stateHash: newStateHash,
  };
  appendLine(getHistoryPath(taskId), JSON.stringify(historyRecord));

  return newState;
}

export function recordFailure(taskId, failureId, originatingState, returnState, failingCommand, exitCode, evidencePath) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

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

  const runtimeDir = getRuntimeDir(taskId);
  const failuresPath = resolve(runtimeDir, 'task-state.json');
  const updated = {
    ...state,
    activeFailureIds: [...new Set([...state.activeFailureIds, failureId])],
    currentState: STATES.ERROR_REPAIR,
    previousState: state.currentState,
    resumeState: returnState || state.currentState,
    revision: state.revision + 1,
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: 'task-governor.mjs',
  };

  writeJSON(failuresPath, updated);
  return updated;
}

export function resolveFailure(taskId, failureId) {
  const state = loadState(taskId);
  if (!state) throw new Error(`Task ${taskId} not found`);

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
  };

  writeJSON(getStatePath(taskId), updated);
  return updated;
}

export function isAccepted(taskId) {
  const state = loadState(taskId);
  return state && state.currentState === STATES.ACCEPTED;
}
