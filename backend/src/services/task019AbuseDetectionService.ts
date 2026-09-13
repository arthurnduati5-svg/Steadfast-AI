import { getRedisClient } from '../lib/redis';
import { logger } from '../utils/logger';
import type { AbuseDetectionConfig, AbuseDetectionResult, AbuseSignal } from '../contracts/task019Contracts';

const KEY_PREFIX = 'abuse:';

const DEFAULT_CONFIG: AbuseDetectionConfig = {
  rapidFireThreshold: 10,
  rapidFireWindowMs: 2000,
  errorRateThreshold: 0.5,
  errorRateWindowMs: 60000,
  minSamples: 5,
  cooldownMs: 30000
};

interface SlidingWindowCount {
  count: number;
  oldestTs: number;
}

async function getSlidingCount(redis: Awaited<ReturnType<typeof getRedisClient>>, key: string, windowMs: number): Promise<SlidingWindowCount> {
  if (!redis) return { count: 0, oldestTs: 0 };

  const now = Date.now();
  const cutoff = now - windowMs;

  await redis.zRemRangeByScore(key, 0, cutoff);

  const count = await redis.zCard(key);
  const oldest = await redis.zRangeByScore(key, 0, now, { LIMIT: { offset: 0, count: 1 } });
  const oldestTs = oldest.length > 0 ? Number(oldest[0]) : now;

  await redis.pExpire(key, Math.ceil(windowMs / 1000) + 10);

  return { count, oldestTs };
}

async function recordEvent(redis: Awaited<ReturnType<typeof getRedisClient>>, key: string, now: number): Promise<void> {
  if (!redis) return;
  await redis.zAdd(key, { score: now, value: `${now}` });
}

export async function checkAbuse(
  studentId: string,
  route: string,
  method: string,
  statusCode?: number
): Promise<AbuseDetectionResult> {
  const redis = await getRedisClient();
  if (!redis) {
    return { isAbusive: false, cooldownRemainingMs: 0, confidence: 0, recommendedAction: 'allow' };
  }

  try {
    const now = Date.now();
    const rapidKey = `${KEY_PREFIX}rapid:${studentId}:${route}:${method}`;
    const errorKey = `${KEY_PREFIX}error:${studentId}`;
    const cooldownKey = `${KEY_PREFIX}cooldown:${studentId}`;

    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      const remaining = parseInt(cooldown, 10) - now;
      if (remaining > 0) {
        return {
          isAbusive: true,
          reason: 'cooldown_active',
          cooldownRemainingMs: remaining,
          confidence: 1,
          recommendedAction: 'block'
        };
      }
      await redis.del(cooldownKey);
    }

    const rapidCount = await getSlidingCount(redis, rapidKey, DEFAULT_CONFIG.rapidFireWindowMs);

    await recordEvent(redis, rapidKey, now);

    if (rapidCount.count >= DEFAULT_CONFIG.rapidFireThreshold) {
      await redis.set(cooldownKey, String(now + DEFAULT_CONFIG.cooldownMs), { PX: DEFAULT_CONFIG.cooldownMs });
      logger.warn({ studentId, route, method, count: rapidCount.count }, '[AbuseDetection] Rapid fire detected');
      return {
        isAbusive: true,
        reason: 'rapid_fire',
        cooldownRemainingMs: DEFAULT_CONFIG.cooldownMs,
        confidence: 0.8,
        recommendedAction: 'degrade'
      };
    }

    const totalKey = `${KEY_PREFIX}total:${studentId}`;

    if (statusCode && statusCode >= 400) {
      await recordEvent(redis, errorKey, now);
      const errorCount = await getSlidingCount(redis, errorKey, DEFAULT_CONFIG.errorRateWindowMs);

      if (errorCount.count >= DEFAULT_CONFIG.minSamples) {
        const totalCount = await getSlidingCount(redis, totalKey, DEFAULT_CONFIG.errorRateWindowMs);
        const effectiveTotal = totalCount.count || 1;
        const errorRate = errorCount.count / effectiveTotal;

        if (errorRate >= DEFAULT_CONFIG.errorRateThreshold) {
          logger.warn({ studentId, errorRate, errorCount: errorCount.count }, '[AbuseDetection] High error rate detected');
          return {
            isAbusive: true,
            reason: 'high_error_rate',
            cooldownRemainingMs: 5000,
            confidence: 0.6,
            recommendedAction: 'degrade'
          };
        }
      }
    }

    await recordEvent(redis, totalKey, now);

    return {
      isAbusive: false,
      cooldownRemainingMs: 0,
      confidence: 0,
      recommendedAction: 'allow'
    };
  } catch (err) {
    logger.error({ err, studentId }, '[AbuseDetection] Error — allowing request (fail-open)');
    return { isAbusive: false, cooldownRemainingMs: 0, confidence: 0, recommendedAction: 'allow' };
  }
}

export async function getAbuseStatus(studentId: string): Promise<{ rapidFireCount: number; cooldownActive: boolean; cooldownRemainingMs: number }> {
  const redis = await getRedisClient();
  if (!redis) return { rapidFireCount: 0, cooldownActive: false, cooldownRemainingMs: 0 };

  try {
    const now = Date.now();
    const cooldownKey = `${KEY_PREFIX}cooldown:${studentId}`;
    const rapidKey = `${KEY_PREFIX}rapid:${studentId}:*`;

    const cooldown = await redis.get(cooldownKey);
    const cooldownRemaining = cooldown ? Math.max(0, parseInt(cooldown, 10) - now) : 0;

    return {
      rapidFireCount: 0,
      cooldownActive: cooldownRemaining > 0,
      cooldownRemainingMs: cooldownRemaining
    };
  } catch {
    return { rapidFireCount: 0, cooldownActive: false, cooldownRemainingMs: 0 };
  }
}
