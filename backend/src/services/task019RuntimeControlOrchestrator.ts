import type { RuntimeControlContext, RuntimeControlDecision, DegradedMode, AiCostRouteType, RetryStormSignal } from '../contracts/task019RuntimeControlContracts';
import { checkMultiTenantLimit } from './task019MultiTenantRateLimitService';
import { checkAbuse } from './task019AbuseDetectionService';
import { checkQuota } from './task019QuotaManagerService';
import { checkRetryStorm } from './task019RetryStormGuardService';
import { checkAiCost, estimateAiCost } from './task019AiCostControlService';
import { decideDegradedMode } from './task019DegradedModeDecisionService';
import { emitRuntimeControlTelemetry, createAllowedTelemetry, createBlockedTelemetry } from './task019RuntimeControlTelemetryBridge';
import { validateRuntimeControlContext } from '../lib/task019RuntimeControlValidation';
import { getBackpressureState } from '../middleware/task019BackpressureMiddleware';
import { logger } from '../utils/logger';

function getRouteTypeKey(routeKey: string): AiCostRouteType {
  if (routeKey.includes('/voice/stt') || routeKey.includes('/voice/transcribe')) return 'voice_stt';
  if (routeKey.includes('/voice/tts') || routeKey.includes('/voice/synthesize')) return 'voice_tts';
  if (routeKey.includes('/research')) return 'research';
  if (routeKey.includes('/video/recommend')) return 'video_recommendation';
  if (routeKey.includes('/adaptive-challenge')) return 'challenge_generation';
  if (routeKey.includes('/revision') || routeKey.includes('/practice')) return 'revision_generation';
  return 'chat';
}

function getRetryStormSignal(routeKey: string, method: string): RetryStormSignal {
  if (routeKey.includes('/voice') && method === 'POST') return 'voice_start_stop_loop';
  if (routeKey.includes('/sse') || routeKey.includes('/stream')) return 'sse_reconnect_storm';
  if (routeKey.includes('/ai') || routeKey.includes('/copilot/chat')) return 'client_retry_loop';
  return 'request_fingerprint_replay';
}

export async function orchestrateRuntimeControl(
  ctx: RuntimeControlContext,
  opts?: {
    checkAbuseEnabled?: boolean;
    checkQuotaEnabled?: boolean;
    checkRetryStormEnabled?: boolean;
    checkCostEnabled?: boolean;
    isSafeguardingPath?: boolean;
    isReadinessPath?: boolean;
    isCoreTutoring?: boolean;
    isResearchPath?: boolean;
  }
): Promise<RuntimeControlDecision> {
  const validation = validateRuntimeControlContext(ctx);
  if (!validation.valid) {
    return createBlockedDecision(ctx, ['invalid_context'], 0);
  }

  if (opts?.isReadinessPath) {
    const degraded = decideDegradedMode({ isReadinessPath: true });
    const telemetry = createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'rate_limit_allowed', ['readiness_bypass']);
    emitRuntimeControlTelemetry(telemetry);

    return {
      allowed: true,
      mode: degraded.mode,
      reasonCodes: ['readiness_bypass'],
      studentSafeMessage: '',
      adminSafeSummary: 'Readiness path bypassed runtime controls',
      retryAfterMs: 0,
      safeHeaders: {},
      telemetryEvent: telemetry,
      auditEvent: {
        eventType: 'rate_limit_allowed',
        schoolId: ctx.schoolId,
        studentId: ctx.studentId,
        role: ctx.role,
        routeKey: ctx.routeKey,
        decision: 'allow',
        reasonCodes: ['readiness_bypass'],
        retryAfterMs: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (opts?.isSafeguardingPath) {
    const degraded = decideDegradedMode({ isSafeguardingPath: true });
    const telemetry = createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'rate_limit_allowed', ['safeguarding_preserved']);
    emitRuntimeControlTelemetry(telemetry);

    return {
      allowed: true,
      mode: degraded.mode,
      reasonCodes: ['safeguarding_preserved'],
      studentSafeMessage: '',
      adminSafeSummary: 'Safeguarding path preserved runtime controls',
      retryAfterMs: 0,
      safeHeaders: {},
      telemetryEvent: telemetry,
      auditEvent: {
        eventType: 'rate_limit_allowed',
        schoolId: ctx.schoolId,
        studentId: ctx.studentId,
        role: ctx.role,
        routeKey: ctx.routeKey,
        decision: 'allow',
        reasonCodes: ['safeguarding_preserved'],
        retryAfterMs: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    if (opts?.checkRetryStormEnabled !== false && ctx.studentId) {
      const stormSignal = getRetryStormSignal(ctx.routeKey, ctx.method);
      const stormDecision = await checkRetryStorm(
        `${ctx.schoolId || 'anon'}:${ctx.studentId}:${ctx.method}:${ctx.routeKey}`,
        stormSignal
      );

      if (stormDecision.action === 'hard_block') {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'retry_storm_detected', [stormDecision.reasonCode, 'hard_block'], stormDecision.retryAfterMs);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, [stormDecision.reasonCode, 'hard_block'], stormDecision.retryAfterMs, 'The system is temporarily paused to keep the tutor stable. Please try again shortly.');
      }

      if (stormDecision.action === 'soft_block') {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'retry_storm_detected', [stormDecision.reasonCode, 'soft_block'], stormDecision.retryAfterMs);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, [stormDecision.reasonCode, 'soft_block'], stormDecision.retryAfterMs, 'This action is temporarily paused to keep the tutor stable. Please try again shortly.');
      }

      if (stormDecision.action === 'delay') {
        emitRuntimeControlTelemetry(createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_watch', [stormDecision.reasonCode, 'delay'], stormDecision.retryAfterMs));
        await new Promise(resolve => setTimeout(resolve, stormDecision.retryAfterMs));
      }
    }

    if (opts?.checkAbuseEnabled !== false && ctx.studentId) {
      const abuseResult = await checkAbuse(ctx.studentId, ctx.routeKey, ctx.method);
      if (abuseResult.isAbusive && abuseResult.recommendedAction === 'block') {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'abuse_signal_detected', ['abuse_block', abuseResult.reason || 'unknown'], abuseResult.cooldownRemainingMs);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, ['abuse', abuseResult.reason || 'unknown'], abuseResult.cooldownRemainingMs, 'Too many requests. Please slow down.');
      }

      if (abuseResult.isAbusive && abuseResult.recommendedAction === 'degrade') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        emitRuntimeControlTelemetry(createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_degraded', ['abuse_degrade', abuseResult.reason || 'unknown']));
      }
    }

    if (opts?.checkQuotaEnabled !== false && ctx.studentId) {
      const quotaResult = await checkQuota('student', ctx.studentId, ctx.routeKey);
      if (!quotaResult.allowed) {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'quota_blocked', ['student_quota_exceeded'], quotaResult.quota.resetMs);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, ['quota', 'student_quota_exceeded'], quotaResult.quota.resetMs, 'You have reached today\u2019s usage limit for this action. Ask your teacher or try again later.');
      }
    }

    if (opts?.checkQuotaEnabled !== false && ctx.schoolId) {
      const schoolQuotaResult = await checkQuota('school', ctx.schoolId, ctx.routeKey);
      if (!schoolQuotaResult.allowed) {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'quota_blocked', ['school_quota_exceeded'], schoolQuotaResult.quota.resetMs);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, ['quota', 'school_quota_exceeded'], schoolQuotaResult.quota.resetMs, 'The system is temporarily paused to keep the tutor stable. Please try again shortly.');
      }
    }

    if (opts?.checkCostEnabled !== false && ctx.schoolId) {
      const routeType = getRouteTypeKey(ctx.routeKey);
      const estimate = estimateAiCost(routeType, 500, 1500, 0);
      const costDecision = await checkAiCost(ctx.schoolId, ctx.studentId, routeType, estimate);

      if (!costDecision.allowed) {
        const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'ai_cost_blocked', [costDecision.reasonCode], 60000);
        emitRuntimeControlTelemetry(telemetry);
        return createBlockedDecision(ctx, ['ai_cost', costDecision.reasonCode], 60000, 'You have reached today\u2019s usage limit for this action. Ask your teacher or try again later.');
      }

      if (costDecision.usage.studentBudgetRemaining < 10000 || costDecision.usage.schoolBudgetRemaining < 100000) {
        emitRuntimeControlTelemetry(createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'ai_cost_budget_warning', ['budget_low']));
      }
    }

    const multiTenantResult = await checkMultiTenantLimit(ctx.studentId, ctx.schoolId, ctx.method, ctx.routeKey, ctx.role);
    if (!multiTenantResult.allowed) {
      const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'rate_limit_blocked', [multiTenantResult.reason || 'multi_tenant_limit'], 60000);
      emitRuntimeControlTelemetry(telemetry);
      return createBlockedDecision(ctx, ['rate_limit', multiTenantResult.reason || 'multi_tenant_limit'], 60000);
    }

    const bpState = getBackpressureState();
    const degraded = decideDegradedMode({
      isCoreTutoring: opts?.isCoreTutoring,
      isResearchPath: opts?.isResearchPath,
    });

    if (degraded.mode === 'block_with_safe_message') {
      const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_degraded', ['critical_backpressure'], 10000);
      emitRuntimeControlTelemetry(telemetry);
      return createBlockedDecision(ctx, ['backpressure', 'critical_backpressure'], 10000, degraded.studentSafeMessage);
    }

    if (degraded.mode === 'delay') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      emitRuntimeControlTelemetry(createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_watch', ['delayed']));
    }

    if (degraded.mode === 'admin_only_block') {
      const telemetry = createBlockedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_degraded', ['admin_only_block'], 30000);
      emitRuntimeControlTelemetry(telemetry);
      return createBlockedDecision(ctx, ['backpressure', 'admin_only_block'], 30000, 'The system is busy right now, so I can give a shorter safe response or you can retry soon.');
    }

    if (degraded.mode === 'allow_limited' || degraded.mode === 'allow_cached_or_short') {
      emitRuntimeControlTelemetry(createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'backpressure_degraded', degraded.reasonCodes));
    }

    const telemetry = createAllowedTelemetry(ctx.schoolId, ctx.studentId, ctx.role, ctx.routeKey, 'rate_limit_allowed', degraded.reasonCodes);
    emitRuntimeControlTelemetry(telemetry);

    return {
      allowed: true,
      mode: degraded.mode,
      reasonCodes: degraded.reasonCodes,
      studentSafeMessage: degraded.studentSafeMessage,
      adminSafeSummary: `Allowed. Mode: ${degraded.mode}. Reasons: ${degraded.reasonCodes.join(', ')}. BP: ${bpState.activeCount}/${bpState.maxConcurrent}`,
      retryAfterMs: 0,
      safeHeaders: {
        'X-RateLimit-Limit': 'configured',
        'X-RateLimit-Remaining': 'true',
      },
      telemetryEvent: telemetry,
      auditEvent: {
        eventType: 'rate_limit_allowed',
        schoolId: ctx.schoolId,
        studentId: ctx.studentId,
        role: ctx.role,
        routeKey: ctx.routeKey,
        decision: 'allow',
        reasonCodes: degraded.reasonCodes,
        retryAfterMs: 0,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error({ err, ctx }, '[RuntimeControlOrchestrator] Error — allowing request (fail-open)');
    return createBlockedDecision(ctx, ['orchestrator_error'], 0);
  }
}

function createBlockedDecision(
  ctx: RuntimeControlContext,
  reasonCodes: string[],
  retryAfterMs: number,
  studentSafeMessage?: string
): RuntimeControlDecision {
  const message = studentSafeMessage || 'This action is temporarily paused to keep the tutor stable. Please try again shortly.';
  const telemetry = {
    eventType: reasonCodes.includes('rate_limit') ? 'rate_limit_blocked' as const
      : reasonCodes.includes('quota') ? 'quota_blocked' as const
      : reasonCodes.includes('abuse') ? 'abuse_signal_detected' as const
      : reasonCodes.includes('retry_storm') ? 'retry_storm_detected' as const
      : reasonCodes.includes('ai_cost') ? 'ai_cost_blocked' as const
      : reasonCodes.includes('backpressure') ? 'backpressure_degraded' as const
      : 'rate_limit_blocked' as const,
    schoolId: ctx.schoolId,
    studentId: ctx.studentId,
    role: ctx.role,
    routeKey: ctx.routeKey,
    decision: 'block',
    reasonCodes,
    retryAfterMs,
    timestamp: new Date().toISOString(),
  };

  return {
    allowed: false,
    mode: 'block_with_safe_message',
    reasonCodes,
    studentSafeMessage: message,
    adminSafeSummary: `Blocked. Reasons: ${reasonCodes.join(', ')}`,
    retryAfterMs,
    safeHeaders: {
      'Retry-After': Math.ceil(retryAfterMs / 1000),
      'X-RateLimit-Reset': String(retryAfterMs),
    },
    telemetryEvent: telemetry,
    auditEvent: {
      eventType: telemetry.eventType,
      schoolId: ctx.schoolId,
      studentId: ctx.studentId,
      role: ctx.role,
      routeKey: ctx.routeKey,
      decision: 'block',
      reasonCodes,
      retryAfterMs,
      timestamp: new Date().toISOString(),
    },
  };
}
