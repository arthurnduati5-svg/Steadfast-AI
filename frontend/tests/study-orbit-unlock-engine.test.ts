import { describe, expect, it } from 'vitest';
import { buildStudyOrbitUnlockView } from '@/lib/study-orbit-unlock-engine';

describe('study orbit unlock engine', () => {
  it('asks for quick check when no engagement yet', () => {
    const view = buildStudyOrbitUnlockView({
      stage: 'orienting',
      evidenceScore: 4,
      confidenceScore: 12,
      opens: 0,
      quickChecks: 0,
      teachBackChecks: 0,
      reflections: 0,
      strongChecks: 0,
      closeChecks: 0,
      keepCount: 0,
      saveToRevisionCount: 0,
      similarQuestionAttempts: 0,
      nextTopic: 'Ionic equations',
    });

    expect(view.action).toBe('quick_check');
    expect(view.guidance).toMatch(/quick check/i);
  });

  it('asks for keep anchor when reflection exists but consolidation is missing', () => {
    const view = buildStudyOrbitUnlockView({
      stage: 'reflecting',
      evidenceScore: 52,
      confidenceScore: 58,
      opens: 2,
      quickChecks: 2,
      teachBackChecks: 1,
      reflections: 1,
      strongChecks: 1,
      closeChecks: 1,
      keepCount: 0,
      saveToRevisionCount: 0,
      similarQuestionAttempts: 1,
      nextTopic: 'Ionic equations',
    });

    expect(view.action).toBe('keep_anchor');
    expect(view.readiness).toBe('nearly_ready');
  });

  it('returns open-next state when ready to unlock', () => {
    const view = buildStudyOrbitUnlockView({
      stage: 'ready_to_unlock',
      evidenceScore: 86,
      confidenceScore: 88,
      opens: 3,
      quickChecks: 3,
      teachBackChecks: 2,
      reflections: 2,
      strongChecks: 2,
      closeChecks: 1,
      keepCount: 1,
      saveToRevisionCount: 1,
      similarQuestionAttempts: 1,
      nextTopic: 'Ionic equations',
    });

    expect(view.action).toBe('open_next');
    expect(view.readiness).toBe('ready');
  });
});
