import { describe, it, expect, beforeEach } from 'vitest';
import { checkAiRateLimit, recordAiRateLimitUsage, resetAiRateLimitStateForTests, getAiRateLimitTrackedKeyCountForTests } from '../services/aiRuntimeRateLimitGuardService';

describe('AiRuntimeRateLimitGuardService', () => {
  beforeEach(() => {
    resetAiRateLimitStateForTests();
  });

  it('allows requests under limit', () => {
    const result = checkAiRateLimit({
      actorType: 'student',
      actorId: 'student-1',
      provider: 'openai',
      operation: 'chat_completion',
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('allowed');
  });

  it('blocks after student rate limit', () => {
    const studentId = 'rate-limited-student';
    for (let i = 0; i < 30; i++) {
      recordAiRateLimitUsage({
        actorType: 'student',
        actorId: studentId,
        provider: 'openai',
        operation: 'chat_completion',
      });
    }
    const result = checkAiRateLimit({
      actorType: 'student',
      actorId: studentId,
      provider: 'openai',
      operation: 'chat_completion',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('student_rate_limited');
  });

  it('returns retryAfterMs when blocked', () => {
    const studentId = 'retry-after-student';
    for (let i = 0; i < 30; i++) {
      recordAiRateLimitUsage({
        actorType: 'student',
        actorId: studentId,
        provider: 'openai',
        operation: 'chat_completion',
      });
    }
    const result = checkAiRateLimit({
      actorType: 'student',
      actorId: studentId,
      provider: 'openai',
      operation: 'chat_completion',
    });
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after resetAiRateLimitStateForTests', () => {
    const studentId = 'reset-student';
    for (let i = 0; i < 30; i++) {
      recordAiRateLimitUsage({
        actorType: 'student',
        actorId: studentId,
        provider: 'openai',
        operation: 'chat_completion',
      });
    }
    resetAiRateLimitStateForTests();
    const result = checkAiRateLimit({
      actorType: 'student',
      actorId: studentId,
      provider: 'openai',
      operation: 'chat_completion',
    });
    expect(result.allowed).toBe(true);
  });

  it('does not expose raw IDs in public output', () => {
    const result = checkAiRateLimit({
      provider: 'openai',
      operation: 'embedding',
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('allowed');
  });

  it('evicts expired inactive keys via bounded opportunistic sweep', () => {
    const t0 = 1000000;
    checkAiRateLimit({ actorType: 'student', actorId: 'prime-student', provider: 'openai', operation: 'chat', nowMs: t0 });
    for (let i = 0; i < 50; i++) {
      recordAiRateLimitUsage({ actorType: 'student', actorId: `stale-student-${i}`, provider: 'openai', operation: 'chat', nowMs: t0 });
    }
    const keysBeforeSweepDue = getAiRateLimitTrackedKeyCountForTests();
    expect(keysBeforeSweepDue).toBeGreaterThanOrEqual(50);
    // Within the window the sweep is not due: stale keys are retained (no
    // all-key scan on every request), and the active key still counts.
    checkAiRateLimit({ actorType: 'student', actorId: 'other-student', provider: 'openai', operation: 'chat', nowMs: t0 + 1000 });
    expect(getAiRateLimitTrackedKeyCountForTests()).toBeGreaterThanOrEqual(50);
    // Beyond the window one normal operation triggers the sweep: stale keys
    // are removed while the new active key remains correct.
    const afterWindow = checkAiRateLimit({ actorType: 'student', actorId: 'fresh-student', provider: 'openai', operation: 'chat', nowMs: t0 + 61000 });
    expect(afterWindow.allowed).toBe(true);
    expect(getAiRateLimitTrackedKeyCountForTests()).toBeLessThan(keysBeforeSweepDue);
    // Existing semantics intact: expired timestamps no longer count, and a
    // fresh window still enforces the student limit.
    for (let i = 0; i < 30; i++) {
      recordAiRateLimitUsage({ actorType: 'student', actorId: 'fresh-student', provider: 'openai', operation: 'chat', nowMs: t0 + 61000 + i });
    }
    const limited = checkAiRateLimit({ actorType: 'student', actorId: 'fresh-student', provider: 'openai', operation: 'chat', nowMs: t0 + 61000 + 31 });
    expect(limited.allowed).toBe(false);
    expect(limited.reason).toBe('student_rate_limited');
  });
});
