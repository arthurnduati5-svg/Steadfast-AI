import { getRedisClient } from '../lib/redis';
import { logger } from '../utils/logger';
import type { QuotaConfig, QuotaWindow, QuotaState, QuotaResult } from '../contracts/task019Contracts';

const KEY_PREFIX = 'quota:';

function getWindowBoundary(window: QuotaWindow): { start: number; end: number } {
  const now = Date.now();
  const msInDay = 86400000;
  const msInWeek = msInDay * 7;

  switch (window) {
    case 'daily': {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = start.getTime() + msInDay;
      return { start: start.getTime(), end };
    }
    case 'weekly': {
      const start = new Date();
      const dayOfWeek = start.getUTCDay();
      start.setUTCDate(start.getUTCDate() - ((dayOfWeek + 6) % 7));
      start.setUTCHours(0, 0, 0, 0);
      return { start: start.getTime(), end: start.getTime() + msInWeek };
    }
    case 'monthly': {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const nextMonth = new Date(start);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      return { start: start.getTime(), end: nextMonth.getTime() };
    }
  }
}

const DEFAULT_QUOTAS: QuotaConfig[] = [
  { window: 'daily', maxRequests: 500, scope: 'student', routes: ['/api/copilot/chat'] },
  { window: 'daily', maxRequests: 100, scope: 'student', routes: ['/api/voice'] },
  { window: 'monthly', maxRequests: 10000, scope: 'student' },
  { window: 'daily', maxRequests: 50000, scope: 'school' },
  { window: 'monthly', maxRequests: 500000, scope: 'school' }
];

function getRelevantQuotas(scope: 'student' | 'school', route?: string): QuotaConfig[] {
  return DEFAULT_QUOTAS.filter(q => {
    if (q.scope !== scope) return false;
    if (q.routes && q.routes.length > 0 && route) {
      return q.routes.some(r => route.startsWith(r)) || !route;
    }
    return !q.routes || q.routes.length === 0;
  });
}

export async function checkQuota(
  scope: 'student' | 'school',
  id: string,
  route?: string
): Promise<QuotaResult> {
  const quotas = getRelevantQuotas(scope, route);
  if (quotas.length === 0) {
    return { allowed: true, quota: { current: 0, max: Infinity, windowStart: 0, windowEnd: 0, remaining: Infinity, resetMs: 0 } };
  }

  const results: Array<{ allowed: boolean; quota: QuotaState }> = [];

  for (const quota of quotas) {
    const result = await checkSingleQuota(scope, id, quota);
    results.push(result);
    if (!result.allowed) {
      const { windowStart, windowEnd, max } = result.quota;
      return {
        allowed: false,
        quota: { current: max, max, windowStart, windowEnd, remaining: 0, resetMs: Math.max(0, windowEnd - Date.now()) }
      };
    }
  }

  const best = results.reduce((best, r) =>
    r.quota.remaining < best.quota.remaining ? r : best
  , results[0]);

  return best;
}

async function checkSingleQuota(
  scope: 'student' | 'school',
  id: string,
  config: QuotaConfig
): Promise<QuotaResult> {
  const windowBoundary = getWindowBoundary(config.window);
  const key = `${KEY_PREFIX}${config.window}:${scope}:${id}`;

  const redis = await getRedisClient();
  if (!redis) {
    return {
      allowed: true,
      quota: { current: 0, max: config.maxRequests, windowStart: windowBoundary.start, windowEnd: windowBoundary.end, remaining: config.maxRequests, resetMs: windowBoundary.end - Date.now() }
    };
  }

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      const ttlMs = windowBoundary.end - Date.now();
      await redis.pExpire(key, Math.max(1000, ttlMs));
    }

    const remaining = Math.max(0, config.maxRequests - current);
    return {
      allowed: current <= config.maxRequests,
      quota: {
        current,
        max: config.maxRequests,
        windowStart: windowBoundary.start,
        windowEnd: windowBoundary.end,
        remaining,
        resetMs: Math.max(0, windowBoundary.end - Date.now())
      }
    };
  } catch (err) {
    logger.error({ err, scope, id }, '[QuotaManager] Redis error — allowing request (fail-open)');
    return {
      allowed: true,
      quota: { current: 0, max: config.maxRequests, windowStart: windowBoundary.start, windowEnd: windowBoundary.end, remaining: config.maxRequests, resetMs: windowBoundary.end - Date.now() }
    };
  }
}

export async function getQuotaState(
  scope: 'student' | 'school',
  id: string,
  window: QuotaWindow
): Promise<QuotaState | null> {
  const key = `${KEY_PREFIX}${window}:${scope}:${id}`;
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const current = await redis.get(key);
    if (current === null) return null;
    const boundary = getWindowBoundary(window);
    const config = DEFAULT_QUOTAS.find(q => q.window === window && q.scope === scope);
    const max = config?.maxRequests || Infinity;
    const value = Number(current);
    return {
      current: value,
      max,
      windowStart: boundary.start,
      windowEnd: boundary.end,
      remaining: Math.max(0, max - value),
      resetMs: Math.max(0, boundary.end - Date.now())
    };
  } catch {
    return null;
  }
}
