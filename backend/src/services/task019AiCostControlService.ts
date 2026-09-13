import { getRedisClient } from '../lib/redis';
import { logger } from '../utils/logger';
import type { AiCostRouteType, AiCostEstimate, AiCostBudgetUsage, AiCostDecision } from '../contracts/task019RuntimeControlContracts';
import type { AiCostBudgetConfig } from '../contracts/aiRuntimeCostContracts';
import { recordLimitAuditEvent } from './task019RuntimeLimitAuditService';

const KEY_PREFIX = 'ai-cost:';

const DEFAULT_COST_PER_TOKEN_MINOR_UNITS: Record<AiCostRouteType, { input: number; output: number }> = {
  chat: { input: 1, output: 3 },
  research: { input: 2, output: 5 },
  voice_stt: { input: 8, output: 0 },
  voice_tts: { input: 0, output: 10 },
  video_recommendation: { input: 1, output: 2 },
  challenge_generation: { input: 2, output: 5 },
  revision_generation: { input: 2, output: 4 },
};

const DEFAULT_STUDENT_DAILY_BUDGET: Record<AiCostRouteType, number> = {
  chat: 150000,
  research: 50000,
  voice_stt: 30000,
  voice_tts: 30000,
  video_recommendation: 50000,
  challenge_generation: 50000,
  revision_generation: 50000,
};

const DEFAULT_SCHOOL_DAILY_BUDGET: Record<AiCostRouteType, number> = {
  chat: 5000000,
  research: 2000000,
  voice_stt: 1000000,
  voice_tts: 1000000,
  video_recommendation: 2000000,
  challenge_generation: 1000000,
  revision_generation: 1000000,
};

const DEFAULT_ROUTE_DAILY_BUDGET: Record<AiCostRouteType, number> = {
  chat: 10000000,
  research: 5000000,
  voice_stt: 2000000,
  voice_tts: 2000000,
  video_recommendation: 5000000,
  challenge_generation: 3000000,
  revision_generation: 3000000,
};

function getCostMultiplier(routeType: AiCostRouteType): { input: number; output: number } {
  return DEFAULT_COST_PER_TOKEN_MINOR_UNITS[routeType] || { input: 1, output: 3 };
}

export function estimateAiCost(
  routeType: AiCostRouteType,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  estimatedAudioSeconds: number
): AiCostEstimate {
  const costMultiplier = getCostMultiplier(routeType);
  const tokenCost = (estimatedInputTokens * costMultiplier.input) + (estimatedOutputTokens * costMultiplier.output);
  const audioCost = estimatedAudioSeconds * 5;
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  return {
    routeType,
    estimatedTokens: estimatedTotalTokens,
    estimatedAudioSeconds,
    estimatedCostUnits: tokenCost + audioCost,
  };
}

export async function checkAiCost(
  schoolId: string,
  studentId: string | undefined,
  routeType: AiCostRouteType,
  estimate: AiCostEstimate
): Promise<AiCostDecision> {
  const redis = await getRedisClient();
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = dayStart.getTime() + 86400000;
  const ttlMs = dayEnd - now;

  const costUnits = estimate.estimatedCostUnits;

  const studentDailyBudget = DEFAULT_STUDENT_DAILY_BUDGET[routeType] || 100000;
  const schoolDailyBudget = DEFAULT_SCHOOL_DAILY_BUDGET[routeType] || 1000000;
  const routeDailyBudget = DEFAULT_ROUTE_DAILY_BUDGET[routeType] || 5000000;

  try {
    let studentUsed = 0;
    let schoolUsed = 0;
    let routeUsed = 0;

    const studentKey = `${KEY_PREFIX}student:${studentId}:${routeType}`;
    const schoolKey = `${KEY_PREFIX}school:${schoolId}:${routeType}`;
    const routeKey = `${KEY_PREFIX}route:${routeType}`;

    if (redis && studentId) {
      const studentVal = await redis.get(studentKey);
      studentUsed = studentVal ? Number(studentVal) : 0;
    }

    if (redis && schoolId) {
      const schoolVal = await redis.get(schoolKey);
      schoolUsed = schoolVal ? Number(schoolVal) : 0;
    }

    if (redis) {
      const routeVal = await redis.get(routeKey);
      routeUsed = routeVal ? Number(routeVal) : 0;
    }

    const studentRemaining = Math.max(0, studentDailyBudget - studentUsed);
    const schoolRemaining = Math.max(0, schoolDailyBudget - schoolUsed);
    const routeRemaining = Math.max(0, routeDailyBudget - routeUsed);

    if (studentUsed + costUnits > studentDailyBudget) {
      const usage: AiCostBudgetUsage = {
        schoolId, studentId, routeType,
        schoolBudgetUsed: schoolUsed, schoolBudgetRemaining: schoolRemaining,
        studentBudgetUsed: studentUsed, studentBudgetRemaining: studentRemaining,
        routeBudgetUsed: routeUsed, routeBudgetRemaining: routeRemaining,
      };
      recordLimitAuditEvent({
        actorId: studentId || schoolId,
        actorRole: 'student',
        schoolId,
        route: routeType,
        operation: 'cost_check',
        decision: 'deny_quota_exceeded',
        reasonCodes: ['student_budget_exhausted', 'ai_cost_control'],
      });
      logger.warn({ studentId, routeType, used: studentUsed, budget: studentDailyBudget }, '[AiCostControl] Student budget exhausted');
      return { allowed: false, reasonCode: 'student_budget_exhausted', usage };
    }

    if (schoolUsed + costUnits > schoolDailyBudget) {
      const usage: AiCostBudgetUsage = {
        schoolId, studentId, routeType,
        schoolBudgetUsed: schoolUsed, schoolBudgetRemaining: schoolRemaining,
        studentBudgetUsed: studentUsed, studentBudgetRemaining: studentRemaining,
        routeBudgetUsed: routeUsed, routeBudgetRemaining: routeRemaining,
      };
      recordLimitAuditEvent({
        actorId: schoolId,
        actorRole: 'system',
        schoolId,
        route: routeType,
        operation: 'cost_check',
        decision: 'deny_quota_exceeded',
        reasonCodes: ['school_budget_exhausted', 'ai_cost_control'],
      });
      logger.warn({ schoolId, routeType, used: schoolUsed, budget: schoolDailyBudget }, '[AiCostControl] School budget exhausted');
      return { allowed: false, reasonCode: 'school_budget_exhausted', usage };
    }

    if (routeUsed + costUnits > routeDailyBudget) {
      const usage: AiCostBudgetUsage = {
        schoolId, studentId, routeType,
        schoolBudgetUsed: schoolUsed, schoolBudgetRemaining: schoolRemaining,
        studentBudgetUsed: studentUsed, studentBudgetRemaining: studentRemaining,
        routeBudgetUsed: routeUsed, routeBudgetRemaining: routeRemaining,
      };
      recordLimitAuditEvent({
        actorId: 'system',
        actorRole: 'system',
        route: routeType,
        operation: 'cost_check',
        decision: 'deny_quota_exceeded',
        reasonCodes: ['route_budget_exhausted', 'ai_cost_control'],
      });
      logger.warn({ routeType, used: routeUsed, budget: routeDailyBudget }, '[AiCostControl] Route budget exhausted');
      return { allowed: false, reasonCode: 'route_budget_exhausted', usage };
    }

    if (redis) {
      if (studentId) await redis.incrBy(studentKey, costUnits);
      if (schoolId) await redis.incrBy(schoolKey, costUnits);
      await redis.incrBy(routeKey, costUnits);
      if (studentId) await redis.pExpire(studentKey, ttlMs);
      if (schoolId) await redis.pExpire(schoolKey, ttlMs);
      await redis.pExpire(routeKey, ttlMs);
    }

    const usage: AiCostBudgetUsage = {
      schoolId, studentId, routeType,
      schoolBudgetUsed: schoolUsed + costUnits,
      schoolBudgetRemaining: Math.max(0, schoolDailyBudget - schoolUsed - costUnits),
      studentBudgetUsed: studentUsed + costUnits,
      studentBudgetRemaining: Math.max(0, studentDailyBudget - studentUsed - costUnits),
      routeBudgetUsed: routeUsed + costUnits,
      routeBudgetRemaining: Math.max(0, routeDailyBudget - routeUsed - costUnits),
    };

    return { allowed: true, reasonCode: 'budget_ok', usage };
  } catch (err) {
    logger.error({ err, schoolId, routeType }, '[AiCostControl] Error — allowing request (fail-open)');
    return {
      allowed: true,
      reasonCode: 'estimate_error',
      usage: {
        schoolId, studentId, routeType,
        schoolBudgetUsed: 0, schoolBudgetRemaining: schoolDailyBudget,
        studentBudgetUsed: 0, studentBudgetRemaining: studentDailyBudget,
        routeBudgetUsed: 0, routeBudgetRemaining: routeDailyBudget,
      },
    };
  }
}

export async function recordAiCostUsage(
  schoolId: string,
  studentId: string | undefined,
  routeType: AiCostRouteType,
  costUnits: number
): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;

  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const ttlMs = (dayStart.getTime() + 86400000) - now;

  try {
    if (studentId) {
      await redis.incrBy(`${KEY_PREFIX}student:${studentId}:${routeType}`, costUnits);
      await redis.pExpire(`${KEY_PREFIX}student:${studentId}:${routeType}`, ttlMs);
    }
    if (schoolId) {
      await redis.incrBy(`${KEY_PREFIX}school:${schoolId}:${routeType}`, costUnits);
      await redis.pExpire(`${KEY_PREFIX}school:${schoolId}:${routeType}`, ttlMs);
    }
    await redis.incrBy(`${KEY_PREFIX}route:${routeType}`, costUnits);
    await redis.pExpire(`${KEY_PREFIX}route:${routeType}`, ttlMs);
  } catch (err) {
    logger.error({ err, schoolId, routeType }, '[AiCostControl] Record usage error');
  }
}
