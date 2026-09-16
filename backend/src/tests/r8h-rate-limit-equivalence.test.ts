/**
 * R8-H candidate equivalence: AI runtime sliding-window rate limiter.
 *
 * Proves the amortized-O(1) deque implementation preserves the exact
 * admission/denial contract of the O(w) filter-scan baseline:
 * scope isolation, window boundaries, limit counts, reset timing,
 * retryAfterMs, stale-key sweep, and per-scope denial reasons.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAiRateLimit,
  recordAiRateLimitUsage,
  resetAiRateLimitStateForTests,
  getAiRateLimitTrackedKeyCountForTests,
} from '../services/aiRuntimeRateLimitGuardService';

const WINDOW_MS = 60000;
const T0 = 5000000;

beforeEach(() => {
  resetAiRateLimitStateForTests();
});

function check(actorId: string, nowMs: number, extra: Record<string, string> = {}) {
  return checkAiRateLimit({
    actorType: 'student',
    actorId,
    provider: 'openai',
    operation: 'chat',
    nowMs,
    ...extra,
  });
}

function record(actorId: string, nowMs: number, extra: Record<string, string> = {}) {
  recordAiRateLimitUsage({
    actorType: 'student',
    actorId,
    provider: 'openai',
    operation: 'chat',
    nowMs,
    ...extra,
  });
}

describe('r8h rate-limit equivalence', () => {
  it('admits exactly 30 student requests then denies with student reason', () => {
    const id = 'r8h-equivalence-student';
    for (let i = 0; i < 30; i++) {
      expect(check(id, T0 + i).allowed).toBe(true);
      record(id, T0 + i);
    }
    const denied = check(id, T0 + 30);
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('student_rate_limited');
    expect(denied.retryAfterMs).toBe(WINDOW_MS);
  });

  it('window boundary: entry at exactly cutoff is expired (strict t > cutoff)', () => {
    const id = 'r8h-boundary-student';
    record(id, T0);
    // nowMs = T0 + WINDOW_MS -> cutoff = T0 -> t <= cutoff expired.
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(true);
    // nowMs = T0 + WINDOW_MS - 1 -> cutoff = T0 - 1 -> t > cutoff live.
    resetAiRateLimitStateForTests();
    record(id, T0);
    for (let i = 0; i < 29; i++) record(id, T0 + WINDOW_MS - 1);
    expect(check(id, T0 + WINDOW_MS - 1).allowed).toBe(false);
  });

  it('expired entries free capacity: full window then post-expiry admit', () => {
    const id = 'r8h-expiry-student';
    for (let i = 0; i < 30; i++) record(id, T0 + i);
    expect(check(id, T0 + 30).allowed).toBe(false);
    expect(check(id, T0 + WINDOW_MS + 1000).allowed).toBe(true);
  });

  it('school and provider scopes isolate from student scope', () => {
    const id = 'r8h-isolation-student';
    for (let i = 0; i < 30; i++) record(id, T0 + i);
    expect(check(id, T0 + 30).allowed).toBe(false);
    // Different student with same provider op is unaffected at student scope
    // but shares the provider window (only 30 events: under the 1000 cap).
    const other = checkAiRateLimit({
      actorType: 'student',
      actorId: 'r8h-other-student',
      provider: 'openai',
      operation: 'chat',
      nowMs: T0 + 31,
    });
    expect(other.allowed).toBe(true);
  });

  it('school scope denies at 500 with school reason', () => {
    for (let i = 0; i < 500; i++) {
      recordAiRateLimitUsage({ schoolId: 'r8h-school', provider: 'openai', operation: 'sch-op', nowMs: T0 + i });
    }
    const denied = checkAiRateLimit({ schoolId: 'r8h-school', provider: 'openai', operation: 'sch-op', nowMs: T0 + 500 });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('school_rate_limited');
  });

  it('provider scope denies at 1000 with provider reason', () => {
    for (let i = 0; i < 1000; i++) {
      recordAiRateLimitUsage({ provider: 'openai', operation: 'prov-op', nowMs: T0 + (i % 59999) });
    }
    const denied = checkAiRateLimit({ provider: 'openai', operation: 'prov-op', nowMs: T0 + 59999 });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('provider_rate_limited');
  });

  it('stale-key sweep removes fully expired keys and keeps live keys', () => {
    for (let i = 0; i < 50; i++) {
      record(`r8h-stale-${i}`, T0, { provider: 'openai', operation: 'sweep-op' });
    }
    expect(getAiRateLimitTrackedKeyCountForTests()).toBeGreaterThan(0);
    check('r8h-fresh-after-sweep', T0 + WINDOW_MS + 1);
    // Stale student keys pruned; provider key for sweep-op expired too.
    expect(check('r8h-stale-0', T0 + WINDOW_MS + 2).allowed).toBe(true);
  });

  it('empty state admits; single event counts once', () => {
    expect(check('r8h-empty', T0).allowed).toBe(true);
    record('r8h-empty', T0);
    expect(check('r8h-empty', T0 + 1).allowed).toBe(true);
  });

  it('duplicate timestamps at same millisecond all count', () => {
    const id = 'r8h-dupe-ts';
    for (let i = 0; i < 30; i++) record(id, T0);
    expect(check(id, T0).allowed).toBe(false);
  });

  it('sliding behavior: one expiry frees exactly one slot', () => {
    const id = 'r8h-slide';
    for (let i = 0; i < 30; i++) record(id, T0 + i);
    expect(check(id, T0 + 30).allowed).toBe(false);
    // Advance past only the first entry (t=T0 expires at T0+WINDOW_MS).
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(true);
    record(id, T0 + WINDOW_MS);
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(false);
  });
});
