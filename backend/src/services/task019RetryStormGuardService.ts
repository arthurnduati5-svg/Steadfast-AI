import { getRedisClient } from '../lib/redis';
import { logger } from '../utils/logger';
import type { RetryStormSignal, RetryStormDecision } from '../contracts/task019RuntimeControlContracts';
import { recordLimitAuditEvent } from './task019RuntimeLimitAuditService';

const KEY_PREFIX = 'retry-storm:';
const DEFAULT_WINDOW_MS = 10000;
const DEFAULT_STORM_THRESHOLD = 5;
const DEFAULT_DELAY_MS = 2000;
const SOFT_BLOCK_DURATION_MS = 15000;
const HARD_BLOCK_DURATION_MS = 60000;

interface StormCounter {
  count: number;
  windowStart: number;
}

const memoryStore = new Map<string, StormCounter>();

function getStormKey(fingerprint: string, signalType: string): string {
  return `${KEY_PREFIX}${signalType}:${fingerprint}`;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, counter] of memoryStore.entries()) {
    if (now - counter.windowStart > DEFAULT_WINDOW_MS * 2) {
      memoryStore.delete(key);
    }
  }
}

export async function checkRetryStorm(
  fingerprint: string,
  signalType: RetryStormSignal,
  threshold?: number
): Promise<RetryStormDecision> {
  if (signalType === 'no_storm') {
    return { action: 'allow', reasonCode: 'no_storm', retryAfterMs: 0, confidence: 1 };
  }

  const effectiveThreshold = threshold ?? DEFAULT_STORM_THRESHOLD;
  const key = getStormKey(fingerprint, signalType);
  const now = Date.now();

  const redis = await getRedisClient();

  if (redis) {
    try {
      const result = await checkRetryStormWithRedis(redis!, key, signalType, effectiveThreshold, now);
      if (result) return result;
    } catch (err) {
      logger.error({ err, fingerprint, signalType }, '[RetryStormGuard] Redis error — falling back to memory');
    }
  }

  return checkRetryStormInMemory(key, signalType, effectiveThreshold, now);
}

async function checkRetryStormWithRedis(
  redis: NonNullable<Awaited<ReturnType<typeof getRedisClient>>>,
  key: string,
  signalType: RetryStormSignal,
  threshold: number,
  now: number
): Promise<RetryStormDecision | null> {
  const existing = await redis.get(key);
  let count = 1;
  let windowStart = now;

  if (existing) {
    try {
      const parsed = JSON.parse(existing) as StormCounter;
      if (now - parsed.windowStart < DEFAULT_WINDOW_MS) {
        count = parsed.count + 1;
        windowStart = parsed.windowStart;
      }
    } catch {
      count = 1;
    }
  }

  const counter: StormCounter = { count, windowStart };
  await redis.set(key, JSON.stringify(counter), { PX: DEFAULT_WINDOW_MS * 2 });

  return makeStormDecision(key, signalType, count, threshold, now);
}

function checkRetryStormInMemory(
  key: string,
  signalType: RetryStormSignal,
  threshold: number,
  now: number
): RetryStormDecision {
  const existing = memoryStore.get(key);
  let count = 1;
  let windowStart = now;

  if (existing && now - existing.windowStart < DEFAULT_WINDOW_MS) {
    count = existing.count + 1;
    windowStart = existing.windowStart;
  }

  memoryStore.set(key, { count, windowStart });
  pruneExpired();

  return makeStormDecision(key, signalType, count, threshold, now);
}

function makeStormDecision(
  key: string,
  _signalType: RetryStormSignal,
  count: number,
  threshold: number,
  now: number
): RetryStormDecision {
  if (count >= threshold * 3) {
    const retryAfterMs = HARD_BLOCK_DURATION_MS;
    recordLimitAuditEvent({
      actorId: key,
      actorRole: 'system',
      route: 'retry-storm-guard',
      operation: 'hard_block',
      decision: 'deny_abuse',
      reasonCodes: ['retry_storm', 'hard_block'],
    });
    logger.warn({ key, count, threshold }, '[RetryStormGuard] Hard block');
    return { action: 'hard_block', reasonCode: _signalType, retryAfterMs, confidence: 0.95 };
  }

  if (count >= threshold * 2) {
    const retryAfterMs = SOFT_BLOCK_DURATION_MS;
    recordLimitAuditEvent({
      actorId: key,
      actorRole: 'system',
      route: 'retry-storm-guard',
      operation: 'soft_block',
      decision: 'deny_abuse',
      reasonCodes: ['retry_storm', 'soft_block'],
    });
    logger.warn({ key, count, threshold }, '[RetryStormGuard] Soft block');
    return { action: 'soft_block', reasonCode: _signalType, retryAfterMs, confidence: 0.85 };
  }

  if (count >= threshold) {
    const retryAfterMs = DEFAULT_DELAY_MS;
    recordLimitAuditEvent({
      actorId: key,
      actorRole: 'system',
      route: 'retry-storm-guard',
      operation: 'delay',
      decision: 'allow_degraded',
      reasonCodes: ['retry_storm', 'delay'],
    });
    logger.warn({ key, count, threshold }, '[RetryStormGuard] Delay');
    return { action: 'delay', reasonCode: _signalType, retryAfterMs, confidence: 0.75 };
  }

  return { action: 'allow', reasonCode: 'no_storm', retryAfterMs: 0, confidence: 1 };
}

export function resetRetryStormState(): void {
  memoryStore.clear();
}
