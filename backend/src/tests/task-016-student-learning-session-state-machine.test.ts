import { describe, it, expect } from 'vitest';
import {
  getInitialSessionState,
  canTransitionSession,
  transitionSessionState,
  buildBlockedTransitionResult,
} from '../services/studentLearningSessionStateMachine';
import { STUDENT_LEARNING_SESSION_TRANSITION_TYPES } from '../contracts/studentLearningSessionContracts';
import type { StudentLearningSessionReasonCode } from '../contracts/studentLearningSessionContracts';

describe('Task 016: StudentLearningSessionStateMachine', () => {
  it('getInitialSessionState returns status=created, stage=orienting, mode=none', () => {
    const state = getInitialSessionState();
    expect(state.status).toBe('created');
    expect(state.stage).toBe('orienting');
    expect(state.currentMode).toBe('none');
  });

  it('canTransitionSession allows created -> active via start_session', () => {
    expect(canTransitionSession('created', 'orienting', 'none', 'start_session')).toBe(true);
  });

  it('canTransitionSession allows active -> paused via pause_session', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'pause_session')).toBe(true);
  });

  it('canTransitionSession allows paused -> active via resume_session (frozen R1 semantics)', () => {
    expect(canTransitionSession('paused', 'orienting', 'chat', 'resume_session')).toBe(true);
  });

  it('canTransitionSession blocks resumed -> any (resumed is legacy status, not used for new transitions)', () => {
    for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
      expect(canTransitionSession('resumed', 'orienting', 'chat', tt)).toBe(false);
    }
  });

  it('canTransitionSession allows active -> completed via complete_session', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'complete_session')).toBe(true);
  });

  it('canTransitionSession allows active -> abandoned via abandon_session', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'abandon_session')).toBe(true);
  });

  it('canTransitionSession allows active -> expired via expire_session', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'expire_session')).toBe(true);
  });

  it('canTransitionSession blocks completed -> any (all transition types)', () => {
    for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
      expect(canTransitionSession('completed', 'orienting', 'none', tt)).toBe(false);
    }
  });

  it('canTransitionSession blocks abandoned -> any', () => {
    for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
      expect(canTransitionSession('abandoned', 'orienting', 'none', tt)).toBe(false);
    }
  });

  it('canTransitionSession blocks expired -> resume_session', () => {
    expect(canTransitionSession('expired', 'orienting', 'none', 'resume_session')).toBe(false);
  });

  it('canTransitionSession allows expired -> start_session (restart)', () => {
    expect(canTransitionSession('expired', 'orienting', 'none', 'start_session')).toBe(true);
  });

  it('canTransitionSession blocks blocked -> any', () => {
    for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
      expect(canTransitionSession('blocked', 'orienting', 'none', tt)).toBe(false);
    }
  });

  it('Mode transitions: none -> chat via start_session', () => {
    expect(canTransitionSession('created', 'orienting', 'none', 'start_session')).toBe(true);
  });

  it('Mode: chat -> focus via enter_focus', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'enter_focus')).toBe(true);
  });

  it('Mode: chat -> quiz via enter_quiz', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'enter_quiz')).toBe(true);
  });

  it('Mode: chat -> revision via enter_revision', () => {
    expect(canTransitionSession('active', 'orienting', 'chat', 'enter_revision')).toBe(true);
  });

  it('Mode: focus -> challenge via enter_challenge', () => {
    expect(canTransitionSession('active', 'orienting', 'focus', 'enter_challenge')).toBe(true);
  });

  it('Mode: quiz -> revision via enter_revision', () => {
    expect(canTransitionSession('active', 'orienting', 'quiz', 'enter_revision')).toBe(true);
  });

  it('Mode: quiz -> teach_back via enter_teach_back', () => {
    expect(canTransitionSession('active', 'orienting', 'quiz', 'enter_teach_back')).toBe(true);
  });

  it('Mode: teach_back -> revision via enter_revision', () => {
    expect(canTransitionSession('active', 'orienting', 'teach_back', 'enter_revision')).toBe(true);
  });

  it('Mode: revision -> challenge via enter_challenge', () => {
    expect(canTransitionSession('active', 'orienting', 'revision', 'enter_challenge')).toBe(true);
  });

  it('Mode: challenge -> remediation via enter_remediation', () => {
    expect(canTransitionSession('active', 'orienting', 'challenge', 'enter_remediation')).toBe(true);
  });

  it('Mode: remediation -> revision via enter_revision', () => {
    expect(canTransitionSession('active', 'orienting', 'remediation', 'enter_revision')).toBe(true);
  });

  it('transitionSessionState returns correct transition result for valid transitions', () => {
    const result = transitionSessionState('created', 'orienting', 'none', 'start_session');
    expect(result.allowed).toBe(true);
    expect(result.transitionType).toBe('start_session');
    expect(result.fromMode).toBe('none');
    expect(result.toMode).toBe('chat');
    expect(result.sessionStatus).toBe('active');
    expect(result.transitionStatus).toBe('allowed');
  });

  it('transitionSessionState returns blocked result for invalid transitions', () => {
    const result = transitionSessionState('completed', 'orienting', 'none', 'start_session');
    expect(result.allowed).toBe(false);
    expect(result.transitionStatus).toBe('blocked');
    expect(result.policyDecision).toBe('blocked_invalid_transition');
  });

  it('buildBlockedTransitionResult returns correct blocked result', () => {
    const reasonCodes: StudentLearningSessionReasonCode[] = ['invalid_transition'];
    const result = buildBlockedTransitionResult('chat', 'focus', 'enter_focus', 'blocked_invalid_transition', reasonCodes);
    expect(result.allowed).toBe(false);
    expect(result.transitionType).toBe('enter_focus');
    expect(result.fromMode).toBe('chat');
    expect(result.toMode).toBe('focus');
    expect(result.policyDecision).toBe('blocked_invalid_transition');
    expect(result.transitionStatus).toBe('blocked');
    expect(result.safeReasonCodes).toEqual(reasonCodes);
  });
});
