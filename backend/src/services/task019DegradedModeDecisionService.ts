import { getBackpressureState } from '../middleware/task019BackpressureMiddleware';
import { getLimitAuditEvents } from './task019RuntimeLimitAuditService';
import type { DegradedMode, DegradedModeDecision } from '../contracts/task019RuntimeControlContracts';

interface DegradedConfig {
  backpressureThreshold: number;
  errorRateThreshold: number;
  recentDenialThreshold: number;
  denialWindowMs: number;
}

const DEFAULT_CONFIG: DegradedConfig = {
  backpressureThreshold: 0.3,
  errorRateThreshold: 0.2,
  recentDenialThreshold: 50,
  denialWindowMs: 60000,
};

export function decideDegradedMode(opts?: {
  config?: Partial<DegradedConfig>;
  isSafeguardingPath?: boolean;
  isReadinessPath?: boolean;
  isCoreTutoring?: boolean;
  isResearchPath?: boolean;
}): DegradedModeDecision {
  const config = { ...DEFAULT_CONFIG, ...opts?.config };
  const bp = getBackpressureState();
  const now = Date.now();

  const recentDenials = getLimitAuditEvents({
    since: new Date(now - config.denialWindowMs).toISOString(),
    limit: 1000,
  }).filter(e => e.decision.startsWith('deny')).length;

  const reasonCodes: string[] = [];

  if (opts?.isReadinessPath) {
    return {
      mode: 'allow_full',
      reasonCodes: ['readiness_path_bypass'],
      studentSafeMessage: '',
    };
  }

  if (opts?.isSafeguardingPath) {
    return {
      mode: 'allow_full',
      reasonCodes: ['safeguarding_path_preserved'],
      studentSafeMessage: 'Your safety concern is being handled. Please wait for a response.',
    };
  }

  if (bp.isUnderPressure && bp.rejectionRate > config.backpressureThreshold) {
    reasonCodes.push('backpressure_high');

    if (bp.rejectionRate > 0.8) {
      return {
        mode: 'block_with_safe_message',
        reasonCodes: [...reasonCodes, 'critical_backpressure'],
        studentSafeMessage: 'The system is busy right now, so I can give a shorter safe response or you can retry soon.',
      };
    }

    if (opts?.isResearchPath) {
      return {
        mode: 'allow_cached_or_short',
        reasonCodes: [...reasonCodes, 'backpressure_research_shortened'],
        studentSafeMessage: 'I\'ll provide a shorter response to keep things moving quickly.',
      };
    }

    if (!opts?.isCoreTutoring) {
      return {
        mode: 'allow_limited',
        reasonCodes: [...reasonCodes, 'backpressure_limited'],
        studentSafeMessage: 'The system is experiencing high demand. Responses may be shorter than usual.',
      };
    }

    return {
      mode: 'allow_limited',
      reasonCodes: [...reasonCodes, 'backpressure_core_tutoring_preserved'],
      studentSafeMessage: 'The system is busy. I\'ll focus on your core question.',
    };
  }

  if (recentDenials > config.recentDenialThreshold) {
    reasonCodes.push('high_denial_rate');

    if (!opts?.isCoreTutoring) {
      return {
        mode: 'delay',
        reasonCodes: [...reasonCodes, 'denial_rate_delay'],
        studentSafeMessage: 'This action is temporarily paused to keep the tutor stable. Please try again shortly.',
      };
    }

    return {
      mode: 'allow_limited',
      reasonCodes: [...reasonCodes, 'denial_rate_core_tutoring_preserved'],
      studentSafeMessage: 'The system is experiencing high demand. Responses may be shorter than usual.',
    };
  }

  return {
    mode: 'allow_full',
    reasonCodes: ['normal_operation'],
    studentSafeMessage: '',
  };
}

export function getDefaultDegradedConfig(): DegradedConfig {
  return { ...DEFAULT_CONFIG };
}
