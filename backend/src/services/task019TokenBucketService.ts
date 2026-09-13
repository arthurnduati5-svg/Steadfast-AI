import { getRedisClient } from '../lib/redis';
import { logger } from '../utils/logger';
import type { RateLimitConfig, RateLimitResult } from '../contracts/task019Contracts';

const KEY_PREFIX = 'tb:';
const LUA_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refillRate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local cost = tonumber(ARGV[4])

  local state = redis.call('hmget', key, 'tokens', 'lastRefill')
  local tokens = tonumber(state[1]) or capacity
  local lastRefill = tonumber(state[2]) or now

  local elapsed = math.max(0, now - lastRefill)
  tokens = math.min(capacity, tokens + elapsed * refillRate)
  tokens = tokens - cost

  local allowed = tokens >= 0
  if not allowed then
    tokens = tokens + cost
  end

  redis.call('hmset', key, 'tokens', tokens, 'lastRefill', now)
  redis.call('expire', key, 86400)

  local remaining = math.max(0, math.floor(tokens))
  local refillNeeded = (capacity - remaining)
  local resetMs = 0
  if refillNeeded > 0 and refillRate > 0 then
    resetMs = math.ceil(refillNeeded / refillRate) * 1000
  end

  return {allowed and 1 or 0, remaining, resetMs, capacity}
`;

function buildKey(namespace: string, id: string): string {
  return `${KEY_PREFIX}${namespace}:${id}`;
}

export async function checkTokenBucket(
  namespace: string,
  id: string,
  config: Partial<RateLimitConfig>,
  cost = 1
): Promise<RateLimitResult> {
  const capacity = config.burstCapacity || config.maxTokens || 60;
  const refillRate = config.refillRate || 1;
  const now = Date.now();

  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('[TokenBucket] Redis unavailable — allowing request (fail-open)');
    return { allowed: true, remaining: capacity, resetMs: 0, total: capacity, tier: config.tier || 'student', strategy: config.strategy || 'sliding_window' };
  }

  try {
    const key = buildKey(namespace, String(id));
    const result = await redis.eval(LUA_SCRIPT, {
      keys: [key],
      arguments: [String(capacity), String(refillRate / 1000), String(now), String(cost)]
    }) as [number, number, number, number];

    const [allowedRaw, remainingRaw, resetMs, total] = result;

    return {
      allowed: allowedRaw === 1,
      remaining: remainingRaw,
      resetMs,
      total,
      tier: config.tier || 'student',
      strategy: config.strategy || 'sliding_window'
    };
  } catch (err) {
    logger.error({ err, namespace, id }, '[TokenBucket] Redis eval failed — allowing request (fail-open)');
    return { allowed: true, remaining: capacity, resetMs: 0, total: capacity, tier: config.tier || 'student', strategy: config.strategy || 'sliding_window' };
  }
}

export async function resetTokenBucket(namespace: string, id: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(buildKey(namespace, String(id)));
  } catch (err) {
    logger.error({ err, namespace, id }, '[TokenBucket] Reset failed');
  }
}

export async function getTokenBucketState(namespace: string, id: string): Promise<{ tokens: number; lastRefill: number } | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const key = buildKey(namespace, String(id));
    const state = await redis.hmGet(key, ['tokens', 'lastRefill']);
    if (!state[0] || !state[1]) return null;
    return { tokens: Number(state[0]), lastRefill: Number(state[1]) };
  } catch {
    return null;
  }
}
