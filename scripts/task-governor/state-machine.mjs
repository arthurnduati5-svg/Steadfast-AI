import { STATES, TRANSITIONS, TERMINAL_STATES, EXIT_CODES } from './constants.mjs';
import { GovernorError } from './errors.mjs';

export function isValidTransition(fromState, toState) {
  const allowed = TRANSITIONS[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}

export function canExecuteState(state) {
  return !TERMINAL_STATES.has(state);
}

export function getNextNormalState(currentState) {
  const allowed = TRANSITIONS[currentState];
  if (!allowed) return null;
  const normal = allowed.find(s => s !== STATES.ERROR_REPAIR && s !== STATES.BLOCKED);
  return normal || null;
}

export function getDefaultFirstState() {
  return STATES.PREFLIGHT;
}

export function isTerminal(state) {
  return TERMINAL_STATES.has(state);
}
