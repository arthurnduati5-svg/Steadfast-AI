// Steadfast AI — Task 019 Production Rate Limiting, Abuse Protection,
// Quotas, Backpressure, and Multi-Tenant Runtime Controls

// ─── Rate Limit Tiers & Strategies ──────────────────────────────

export type RateLimitTier = 'global' | 'route' | 'role' | 'student' | 'school';
export type RateLimitStrategy = 'token_bucket' | 'sliding_window' | 'fixed_window';
export type RateLimitRole = 'student' | 'admin' | 'counselor' | 'system' | 'service' | 'anonymous';

export interface RateLimitConfig {
  tier: RateLimitTier;
  strategy: RateLimitStrategy;
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
  burstCapacity: number;
  windowMs?: number;
  maxRequests?: number;
}

export interface RouteRateLimitRule {
  route: string;
  methods: string[];
  student: Partial<RateLimitConfig>;
  school: Partial<RateLimitConfig>;
  roleOverrides?: Partial<Record<RateLimitRole, Partial<RateLimitConfig>>>;
  enabled: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  total: number;
  tier: RateLimitTier;
  strategy: RateLimitStrategy;
}

export interface RateLimitHeaders {
  'RateLimit-Limit': number;
  'RateLimit-Remaining': number;
  'RateLimit-Reset': number;
  'Retry-After'?: number;
}

// ─── Quota Types ────────────────────────────────────────────────

export type QuotaWindow = 'daily' | 'weekly' | 'monthly';

export interface QuotaConfig {
  window: QuotaWindow;
  maxRequests: number;
  scope: 'student' | 'school';
  routes?: string[];
}

export interface QuotaState {
  current: number;
  max: number;
  windowStart: number;
  windowEnd: number;
  remaining: number;
  resetMs: number;
}

export interface QuotaResult {
  allowed: boolean;
  quota: QuotaState;
}

// ─── Abuse Detection Types ──────────────────────────────────────

export interface AbuseDetectionConfig {
  rapidFireThreshold: number;
  rapidFireWindowMs: number;
  errorRateThreshold: number;
  errorRateWindowMs: number;
  minSamples: number;
  cooldownMs: number;
}

export interface AbuseDetectionResult {
  isAbusive: boolean;
  reason?: string;
  cooldownRemainingMs: number;
  confidence: number;
  recommendedAction: 'allow' | 'degrade' | 'block' | 'challenge';
}

export type AbuseSignal =
  | 'rapid_fire'
  | 'high_error_rate'
  | 'sequential_errors'
  | 'unusual_pattern'
  | 'no_abuse';

// ─── Backpressure Types ─────────────────────────────────────────

export interface BackpressureConfig {
  maxConcurrent: number;
  maxQueueDepth: number;
  rejectionSampleSize: number;
  cooldownThreshold: number;
}

export interface BackpressureState {
  activeCount: number;
  maxConcurrent: number;
  queueDepth: number;
  rejectionRate: number;
  isUnderPressure: boolean;
  isCoolingDown: boolean;
}

export interface BackpressureResult {
  accepted: boolean;
  state: BackpressureState;
  estimatedWaitMs: number;
  token?: string;
}

// ─── Multi-Tenant Types ─────────────────────────────────────────

export interface SchoolRateLimitProfile {
  schoolId: string;
  maxConcurrentSessions: number;
  requestsPerMinute: number;
  dailyRequestCap: number;
  monthlyRequestCap: number;
  burstCapacity: number;
  isEnabled: boolean;
}

export interface MultiTenantLimitResult {
  allowed: boolean;
  studentAllowed: boolean;
  schoolAllowed: boolean;
  studentRemaining: number;
  schoolRemaining: number;
  reason?: string;
}

// ─── Unified Middleware Types ───────────────────────────────────

export interface RateLimitMiddlewareOptions {
  enabled: boolean;
  useBackpressure: boolean;
  useAbuseDetection: boolean;
  useQuotas: boolean;
  useMultiTenant: boolean;
  failOpen: boolean;
}

export interface RateLimitMiddlewareResult {
  passed: boolean;
  statusCode: number;
  headers: Record<string, string | number>;
  body: Record<string, unknown>;
  retryAfterMs: number;
}

// ─── Error Response ─────────────────────────────────────────────

export interface RateLimitErrorResponse {
  message: string;
  retryAfterMs: number;
  retryAfterSec: number;
}

export function createRateLimitMessage(retryAfterMs: number): string {
  if (retryAfterMs <= 0) {
    return 'Rate limit exceeded. Please reduce request frequency.';
  }
  const sec = Math.ceil(retryAfterMs / 1000);
  return `Rate limit exceeded. Please try again in ${sec} second${sec === 1 ? '' : 's'}.`;
}
