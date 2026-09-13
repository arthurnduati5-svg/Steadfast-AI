import { checkTokenBucket } from './task019TokenBucketService';
import { checkAbuse } from './task019AbuseDetectionService';
import { checkQuota } from './task019QuotaManagerService';
import { checkTieredRateLimit } from './task019TieredRateLimiterService';
import type { MultiTenantLimitResult } from '../contracts/task019Contracts';
import { logger } from '../utils/logger';

const DEFAULT_SCHOOL_BURST = 600;
const DEFAULT_STUDENT_BURST = 40;

export async function checkMultiTenantLimit(
  studentId: string | undefined,
  schoolId: string | undefined,
  method: string,
  path: string,
  role?: string
): Promise<MultiTenantLimitResult> {
  const tieredResult = await checkTieredRateLimit(studentId, schoolId, method, path, role);

  if (!tieredResult.allowed) {
    return {
      allowed: false,
      studentAllowed: false,
      schoolAllowed: true,
      studentRemaining: tieredResult.remaining,
      schoolRemaining: DEFAULT_SCHOOL_BURST,
      reason: 'Student rate limit exceeded'
    };
  }

  if (schoolId) {
    const schoolResult = await checkTokenBucket('school', schoolId, {
      maxTokens: DEFAULT_SCHOOL_BURST,
      refillRate: 10,
      burstCapacity: DEFAULT_SCHOOL_BURST,
      tier: 'school',
      strategy: 'token_bucket'
    });

    if (!schoolResult.allowed) {
      return {
        allowed: false,
        studentAllowed: true,
        schoolAllowed: false,
        studentRemaining: tieredResult.remaining,
        schoolRemaining: schoolResult.remaining,
        reason: 'School rate limit exceeded'
      };
    }
  }

  if (studentId) {
    const dailyQuota = await checkQuota('student', studentId, path);
    if (!dailyQuota.allowed) {
      return {
        allowed: false,
        studentAllowed: false,
        schoolAllowed: true,
        studentRemaining: dailyQuota.quota.remaining,
        schoolRemaining: DEFAULT_SCHOOL_BURST,
        reason: 'Student daily quota exceeded'
      };
    }
  }

  if (schoolId) {
    const schoolQuota = await checkQuota('school', schoolId, path);
    if (!schoolQuota.allowed) {
      return {
        allowed: false,
        studentAllowed: true,
        schoolAllowed: false,
        studentRemaining: DEFAULT_STUDENT_BURST,
        schoolRemaining: schoolQuota.quota.remaining,
        reason: 'School daily quota exceeded'
      };
    }
  }

  return {
    allowed: true,
    studentAllowed: true,
    schoolAllowed: true,
    studentRemaining: DEFAULT_STUDENT_BURST,
    schoolRemaining: DEFAULT_SCHOOL_BURST
  };
}
