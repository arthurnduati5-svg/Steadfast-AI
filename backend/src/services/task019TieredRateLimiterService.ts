import { checkTokenBucket } from './task019TokenBucketService';
import { getEffectiveRateLimits, getRoleLimits } from './task019RateLimitConfigurationService';
import type { RateLimitResult, RateLimitConfig } from '../contracts/task019Contracts';
import { logger } from '../utils/logger';

export interface TieredRateLimitOutcome {
  allowed: boolean;
  results: RateLimitResult[];
  remaining: number;
  resetMs: number;
}

export async function checkTieredRateLimit(
  studentId: string | undefined,
  schoolId: string | undefined,
  method: string,
  path: string,
  role?: string
): Promise<TieredRateLimitOutcome> {
  const results: RateLimitResult[] = [];
  const limits = getEffectiveRateLimits(method, path, role);

  if (studentId) {
    const studentResult = await checkTokenBucket('student', studentId, limits.student);
    results.push(studentResult);
    if (!studentResult.allowed) {
      return { allowed: false, results, remaining: studentResult.remaining, resetMs: studentResult.resetMs };
    }
  }

  if (schoolId) {
    const schoolResult = await checkTokenBucket('school', schoolId, limits.school);
    results.push(schoolResult);
    if (!schoolResult.allowed) {
      return { allowed: false, results, remaining: schoolResult.remaining, resetMs: schoolResult.resetMs };
    }
  }

  if (role) {
    const roleLimits = getRoleLimits(role);
    if (roleLimits.tier === 'role') {
      const roleResult = await checkTokenBucket('role', role, roleLimits);
      results.push(roleResult);
      if (!roleResult.allowed) {
        return { allowed: false, results, remaining: roleResult.remaining, resetMs: roleResult.resetMs };
      }
    }
  }

  const minRemaining = results.length > 0 ? Math.min(...results.map(r => r.remaining)) : Infinity;
  const maxResetMs = results.length > 0 ? Math.max(...results.map(r => r.resetMs)) : 0;

  return {
    allowed: true,
    results,
    remaining: minRemaining,
    resetMs: maxResetMs
  };
}

export async function checkSimpleRateLimit(
  namespace: string,
  id: string,
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const effectiveConfig: Partial<RateLimitConfig> = config || {
    maxTokens: 30,
    refillRate: 0.5,
    burstCapacity: 40,
    tier: 'student',
    strategy: 'token_bucket'
  };
  return checkTokenBucket(namespace, String(id), effectiveConfig);
}
