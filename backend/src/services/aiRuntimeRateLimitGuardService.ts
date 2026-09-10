type RateWindow = {
  timestamps: number[];
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
  window.timestamps = window.timestamps.filter(t => t > cutoff);
}

function countInWindow(window: RateWindow, nowMs: number): number {
  pruneWindow(window, nowMs);
  return window.timestamps.length;
}

function getOrCreateWindow(key: RateLimitKey): RateWindow {
  let w = windows.get(key);
  if (!w) {
    w = { timestamps: [] };
    windows.set(key, w);
  }
  return w;
}

function maybeSweepStaleKeys(nowMs: number): void {
  if (nowMs - lastSweepMs < WINDOW_MS) return;
  lastSweepMs = nowMs;
  for (const [key, window] of windows) {
    pruneWindow(window, nowMs);
    if (window.timestamps.length === 0) windows.delete(key);
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
