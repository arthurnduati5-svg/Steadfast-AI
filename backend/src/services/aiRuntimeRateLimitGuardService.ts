type RateWindow = {
  // Monotonic timestamp buffer with a logical head offset.
  // pruneWindow advances `start` past expired entries (amortized O(1))
  // instead of allocating a filtered copy on every check/record.
  // The backing array is compacted only when the dead prefix grows large,
  // so steady-state operation performs zero allocations.
  //
  // Ordering contract: timestamps are appended in non-decreasing order.
  // Production callers always use Date.now(); explicit-nowMs callers
  // (tests, harness) pass non-decreasing sequences. Under this contract
  // head-pruning counts exactly the entries with t > cutoff, identical to
  // the previous filter copy. Window boundary (strict t > cutoff),
  // per-scope limits, retryAfterMs, and sweep cadence are unchanged.
  timestamps: number[];
  start: number;
};

type RateLimitKey = string;

const WINDOW_MS = 60000;

const DEFAULT_LIMITS = {
  studentRequestsPerMinute: 30,
  schoolRequestsPerMinute: 500,
  providerRequestsPerMinute: 1000,
};

const windows = new Map<RateLimitKey, RateWindow>();

// Opportunistic stale-key sweep cadence: at most one full key iteration per
// WINDOW_MS across the whole process (not per actor, not per request).
let lastSweepMs = 0;

function makeKey(prefix: string, id: string): RateLimitKey {
  return `${prefix}:${id}`;
}

function pruneWindow(window: RateWindow, nowMs: number): void {
  const cutoff = nowMs - WINDOW_MS;
  const ts = window.timestamps;
  let start = window.start;
  while (start < ts.length && ts[start] <= cutoff) start++;
  window.start = start;
  // Compact the dead prefix only when it dominates the buffer, keeping
  // amortized O(1) behavior without per-call allocation. The live count
  // (length - start) is unchanged by compaction.
  if (window.start > 1024 && window.start * 2 >= ts.length) {
    window.timestamps = ts.slice(window.start);
    window.start = 0;
  } else if (window.start === ts.length && ts.length > 0) {
    // Fully expired small buffer: reset in place without allocation.
    ts.length = 0;
    window.start = 0;
  }
}

function liveCount(window: RateWindow): number {
  return window.timestamps.length - window.start;
}

function countInWindow(window: RateWindow, nowMs: number): number {
  pruneWindow(window, nowMs);
  return liveCount(window);
}

function getOrCreateWindow(key: RateLimitKey): RateWindow {
  let w = windows.get(key);
  if (!w) {
    w = { timestamps: [], start: 0 };
    windows.set(key, w);
  }
  return w;
}

function maybeSweepStaleKeys(nowMs: number): void {
  if (nowMs - lastSweepMs < WINDOW_MS) return;
  lastSweepMs = nowMs;
  for (const [key, window] of windows) {
    pruneWindow(window, nowMs);
    if (liveCount(window) === 0) windows.delete(key);
  }
}

export function checkAiRateLimit(input: {
  actorType?: string;
  actorId?: string;
  schoolId?: string;
  provider: string;
  operation: string;
  nowMs?: number;
}): {
  allowed: boolean;
  reason: 'allowed' | 'student_rate_limited' | 'school_rate_limited' | 'provider_rate_limited';
  retryAfterMs?: number;
} {
  const nowMs = input.nowMs ?? Date.now();
  maybeSweepStaleKeys(nowMs);

  if (input.actorType === 'student' && input.actorId) {
    const key = makeKey('student', input.actorId);
    const w = getOrCreateWindow(key);
    const count = countInWindow(w, nowMs);
    if (count >= DEFAULT_LIMITS.studentRequestsPerMinute) {
      return { allowed: false, reason: 'student_rate_limited', retryAfterMs: WINDOW_MS };
    }
  }

  if (input.schoolId) {
    const key = makeKey('school', input.schoolId);
    const w = getOrCreateWindow(key);
    const count = countInWindow(w, nowMs);
    if (count >= DEFAULT_LIMITS.schoolRequestsPerMinute) {
      return { allowed: false, reason: 'school_rate_limited', retryAfterMs: WINDOW_MS };
    }
  }

  const providerKey = makeKey('provider', `${input.provider}:${input.operation}`);
  const providerWindow = getOrCreateWindow(providerKey);
  const providerCount = countInWindow(providerWindow, nowMs);
  if (providerCount >= DEFAULT_LIMITS.providerRequestsPerMinute) {
    return { allowed: false, reason: 'provider_rate_limited', retryAfterMs: WINDOW_MS };
  }

  return { allowed: true, reason: 'allowed' };
}

export function recordAiRateLimitUsage(input: {
  actorType?: string;
  actorId?: string;
  schoolId?: string;
  provider: string;
  operation: string;
  nowMs?: number;
}): void {
  const nowMs = input.nowMs ?? Date.now();
  maybeSweepStaleKeys(nowMs);

  if (input.actorType === 'student' && input.actorId) {
    const key = makeKey('student', input.actorId);
    const w = getOrCreateWindow(key);
    w.timestamps.push(nowMs);
  }

  if (input.schoolId) {
    const key = makeKey('school', input.schoolId);
    const w = getOrCreateWindow(key);
    w.timestamps.push(nowMs);
  }

  const providerKey = makeKey('provider', `${input.provider}:${input.operation}`);
  const providerWindow = getOrCreateWindow(providerKey);
  providerWindow.timestamps.push(nowMs);
}

export function resetAiRateLimitStateForTests(): void {
  windows.clear();
  lastSweepMs = 0;
}

export function getAiRateLimitTrackedKeyCountForTests(): number {
  return windows.size;
}
