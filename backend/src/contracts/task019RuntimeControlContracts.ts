import type { RateLimitResult, QuotaResult, AbuseDetectionResult, BackpressureResult } from './task019Contracts';

export type RetryStormSignal =
  | 'client_retry_loop'
  | 'sse_reconnect_storm'
  | 'voice_start_stop_loop'
  | 'repeated_ai_failure'
  | 'idempotency_key_replay'
  | 'request_fingerprint_replay'
  | 'no_storm';

export type RetryStormDecision = {
  action: 'allow' | 'delay' | 'soft_block' | 'hard_block';
  reasonCode: RetryStormSignal;
  retryAfterMs: number;
  confidence: number;
};

export type AiCostRouteType = 'chat' | 'research' | 'voice_stt' | 'voice_tts' | 'video_recommendation' | 'challenge_generation' | 'revision_generation';

export type AiCostEstimate = {
  routeType: AiCostRouteType;
  estimatedTokens: number;
  estimatedAudioSeconds: number;
  estimatedCostUnits: number;
};

export type AiCostBudgetUsage = {
  schoolId: string;
  studentId?: string;
  routeType: AiCostRouteType;
  schoolBudgetUsed: number;
  schoolBudgetRemaining: number;
  studentBudgetUsed: number;
  studentBudgetRemaining: number;
  routeBudgetUsed: number;
  routeBudgetRemaining: number;
};

export type AiCostDecision = {
  allowed: boolean;
  reasonCode: 'budget_ok' | 'student_budget_exhausted' | 'school_budget_exhausted' | 'route_budget_exhausted' | 'estimate_error';
  usage: AiCostBudgetUsage;
};

export type DegradedMode = 'allow_full' | 'allow_limited' | 'allow_cached_or_short' | 'delay' | 'block_with_safe_message' | 'admin_only_block';

export type DegradedModeDecision = {
  mode: DegradedMode;
  reasonCodes: string[];
  studentSafeMessage: string;
};

export type RuntimeControlContext = {
  schoolId?: string;
  studentId?: string;
  role?: string;
  routeKey: string;
  method: string;
  isAbuseCheck?: boolean;
  isQuotaCheck?: boolean;
  isCostCheck?: boolean;
  requestId?: string;
};

export type RuntimeControlDecision = {
  allowed: boolean;
  mode: DegradedMode;
  reasonCodes: string[];
  studentSafeMessage: string;
  adminSafeSummary: string;
  retryAfterMs: number;
  safeHeaders: Record<string, string | number>;
  telemetryEvent: RuntimeControlTelemetryEvent;
  auditEvent: RuntimeControlAuditEvent;
};

export type RuntimeControlAuditEvent = {
  eventType: 'rate_limit_allowed' | 'rate_limit_blocked' | 'quota_allowed' | 'quota_blocked' | 'abuse_signal_detected' | 'retry_storm_detected' | 'backpressure_watch' | 'backpressure_degraded' | 'ai_cost_budget_warning' | 'ai_cost_blocked' | 'degraded_mode_selected';
  schoolId?: string;
  studentId?: string;
  role?: string;
  routeKey: string;
  decision: string;
  reasonCodes: string[];
  retryAfterMs: number;
  timestamp: string;
};

export type RuntimeControlTelemetryEvent = {
  eventType: string;
  schoolId?: string;
  studentId?: string;
  role?: string;
  routeKey: string;
  decision: string;
  reasonCodes: string[];
  window?: string;
  safeCounts?: Record<string, number>;
  safeBudgetUnits?: Record<string, number>;
  retryAfterMs: number;
  timestamp: string;
};

export type RuntimeControlAdminSummary = {
  rateLimitSummary: {
    totalAllowed: number;
    totalBlocked: number;
    activeBuckets: number;
  };
  quotaSummary: {
    activeQuotas: number;
    exhaustedQuotas: number;
  };
  abuseSummary: {
    activeCooldowns: number;
    totalSignals: number;
  };
  retryStormSummary: {
    activeBlocks: number;
    totalStorms: number;
  };
  backpressureSummary: {
    activeCount: number;
    maxConcurrent: number;
    rejectionRate: number;
    mode: string;
  };
  costSummary: {
    schoolBudgetExhausted: number;
    studentBudgetExhausted: number;
    totalEstimatedCost: number;
  };
  degradedModeSummary: {
    currentMode: string;
    reasonCodes: string[];
  };
  timestamp: string;
};
