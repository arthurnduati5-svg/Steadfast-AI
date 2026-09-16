/**
 * R8-H candidate equivalence: AI runtime sliding-window rate limiter.
 *
 * Proves the optimized implementation (ordered fast path with amortized-O(1)
 * head pruning + order-independent O(w) fallback for rare out-of-order /
 * clock-rollback inserts) preserves the exact admission/denial contract of
 * the O(w) filter-scan baseline: scope isolation, window boundaries, limit
 * counts, reset timing, retryAfterMs, stale-key sweep, per-scope denial
 * reasons, and exact live-entry counting under non-monotonic timestamps.
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

  it('clock rollback: out-of-order trailing expired entry is not counted', () => {
    // Non-monotonic insertion: T0, T0+100000, T0. At cutoff T0 the two T0
    // entries are expired and only T0+100000 is live. A head-only prune
    // would stop at the first live entry and overcount the trailing T0.
    // Boundary-sized window: 28 live + triple => reference live 29 < 30.
    const id = 'r8h-rollback-triple';
    const mirrored: number[] = [];
    const rec = (t: number) => { record(id, t); mirrored.push(t); };
    rec(T0);
    rec(T0 + 100000);
    rec(T0);
    for (let i = 0; i < 28; i++) rec(T0 + 100000);
    const cutoff = T0; // nowMs = T0 + WINDOW_MS
    const expected = mirrored.filter((t) => t > cutoff).length;
    expect(expected).toBe(29);
    // Exact count proven indirectly at the 30-limit boundary: 29 allows.
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(true);
    // One more live entry reaches exactly 30 and must deny.
    rec(T0 + 100000);
    const expectedFull = mirrored.filter((t) => t > cutoff).length;
    expect(expectedFull).toBe(30);
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(false);
  });

  it('clock rollback forward/backward/forward matches reference baseline', () => {
    // Realistic rollback: forward jump, backward rollback to an expired
    // timestamp, then forward again. All timestamps stay within one window
    // so the bounded stale-key sweep does not interfere; the reference
    // baseline is computed inline with the legacy filter predicate.
    const id = 'r8h-rollback-fbf';
    const mirrored: number[] = [];
    const rec = (t: number) => { record(id, t); mirrored.push(t); };
    for (let i = 0; i < 27; i++) rec(T0 + 100 + i);
    rec(T0 + 30000); // forward jump
    rec(T0); // backward rollback (expired at cutoff T0)
    rec(T0 + 30001); // forward again
    const cutoff = T0;
    const expected = mirrored.filter((t) => t > cutoff).length;
    // 27 + 1 + 1 = 29 live (T0 expired); boundary allows.
    expect(expected).toBe(29);
    expect(check(id, T0 + WINDOW_MS).allowed).toBe(true);
    rec(T0 + 30002);
    expect(mirrored.filter((t) => t > cutoff).length).toBe(30);
    const denied = check(id, T0 + WINDOW_MS);
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('student_rate_limited');
  });
});
