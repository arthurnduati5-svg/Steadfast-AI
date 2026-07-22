import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getGovernorRuntimeDir } from './repository-root.mjs';
import { STATES } from './constants.mjs';

function ensureDir(p) {
  const d = dirname(p);
  if (!existsSync(d)) {
    mkdirSync(d, { recursive: true });
  }
}

function getStatePath(taskId) {
  return `${getGovernorRuntimeDir(taskId)}/state.json`;
}

export function getDefaultState(taskId) {
  return {
    taskId,
    currentState: STATES.PREFLIGHT,
    currentTodoId: null,
    lastSuccessfulGateId: null,
    lastFailedGateId: null,
    failedCommand: null,
    failedExitCode: null,
    repairAttempts: 0,
    implementationCommitHash: null,
    accountabilityCommitHash: null,
    currentHead: null,
    manifestHash: null,
    postCommitVerifiedHead: null,
    todoCompletion: {},
    gateCompletion: {},
    baselineCaptured: false,
  };
}

export function loadState(taskId) {
  const statePath = getStatePath(taskId);
  if (!existsSync(statePath)) {
    return getDefaultState(taskId);
  }
  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    return getDefaultState(taskId);
  }
}

export function saveState(state) {
  const statePath = getStatePath(state.taskId);
  ensureDir(statePath);
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function updateState(taskId, updates) {
  const state = loadState(taskId);
  Object.assign(state, updates);
  saveState(state);
  return state;
}
