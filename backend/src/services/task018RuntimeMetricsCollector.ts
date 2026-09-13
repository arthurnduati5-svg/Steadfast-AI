// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Runtime Metrics Collector
// Collects and aggregates safe runtime metrics in memory.
// Stores aggregate counts only — never raw text, prompts,
// provider responses, or private memory.
// ─────────────────────────────────────────────────────────────

import type {
  RuntimeMetricPoint,
  RuntimeMetricAggregate,
  RuntimeMetricsSnapshot,
  MetricsCategorySnapshot,
  TelemetryComponent,
} from '../contracts/task018Contracts';

const MAX_METRIC_POINTS = 50000;

interface InternalMetricPoint {
  name: string;
  component: TelemetryComponent;
  value: number;
  timestamp: number;
}

const metricPoints: InternalMetricPoint[] = [];
let redactionCount = 0;
let totalTelemetryEvents = 0;

export function recordMetricPoint(input: {
  name: string;
  component: TelemetryComponent;
  value: number;
  timestamp?: number;
}): void {
  metricPoints.push({
    name: input.name,
    component: input.component,
    value: input.value,
    timestamp: input.timestamp ?? Date.now(),
  });
  if (metricPoints.length > MAX_METRIC_POINTS) {
    metricPoints.splice(0, metricPoints.length - MAX_METRIC_POINTS);
  }
}

export function recordRedactionApplied(): void {
  redactionCount++;
}

export function recordTelemetryEvent(): void {
  totalTelemetryEvents++;
}

export function recordCategoryCount(category: keyof RuntimeMetricsSnapshot): void {
  recordMetricPoint({ name: `count.${category}`, component: 'operations_monitoring', value: 1 });
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function buildLatencySummary(durations: number[]): { p50: number | null; p95: number | null; p99: number | null; max: number | null } {
  return {
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    max: durations.length > 0 ? Math.max(...durations) : null,
  };
}

function buildCategorySnapshot(name: string, component: TelemetryComponent): MetricsCategorySnapshot {
  const totalMetrics = metricPoints.filter((p) => p.name === name);
  const successMetrics = metricPoints.filter((p) => p.name === `${name}.success`);
  const failureMetrics = metricPoints.filter((p) => p.name === `${name}.failure`);
  const blockedMetrics = metricPoints.filter((p) => p.name === `${name}.blocked`);
  const latencyMetrics = metricPoints.filter((p) => p.name === `${name}.latency`).map((p) => p.value);

  return {
    totalRequests: totalMetrics.length,
    successCount: successMetrics.length,
    failureCount: failureMetrics.length,
    blockedCount: blockedMetrics.length,
    latencyMs: latencyMetrics.length > 0 ? buildLatencySummary(latencyMetrics) : undefined,
  };
}

export function resetMetricsForTests(): void {
  metricPoints.length = 0;
  redactionCount = 0;
  totalTelemetryEvents = 0;
}

export function getMetricsSnapshot(): RuntimeMetricsSnapshot {
  const now = Date.now();
  const windowMs = 300000;
  const windowStart = now - windowMs;

  const recentPoints = metricPoints.filter((p) => p.timestamp >= windowStart);

  const conversationSuccess = recentPoints.filter((p) => p.name === 'conversation.success').length;
  const conversationFailure = recentPoints.filter((p) => p.name === 'conversation.failure').length;
  const conversationBlocked = recentPoints.filter((p) => p.name === 'conversation.blocked').length;
  const conversationLatencies = recentPoints.filter((p) => p.name === 'conversation.latency').map((p) => p.value);

  const streamStartedCount = recentPoints.filter((p) => p.name === 'stream.start').length;
  const streamCompletedCount = recentPoints.filter((p) => p.name === 'stream.complete').length;
  const streamErrorCount = recentPoints.filter((p) => p.name === 'stream.error').length;
  const streamEventCount = recentPoints.filter((p) => p.name === 'stream.event').length;

  const sessionStarted = recentPoints.filter((p) => p.name === 'session.start').length;
  const sessionResumed = recentPoints.filter((p) => p.name === 'session.resume').length;
  const sessionCompleted = recentPoints.filter((p) => p.name === 'session.complete').length;
  const sessionTransitions = recentPoints.filter((p) => p.name === 'session.transition').length;
  const sessionCheckpoints = recentPoints.filter((p) => p.name === 'session.checkpoint').length;

  const evidenceAttempts = recentPoints.filter((p) => p.name === 'evidence.attempt').length;
  const evidenceSuccesses = recentPoints.filter((p) => p.name === 'evidence.success').length;
  const evidenceFailures = recentPoints.filter((p) => p.name === 'evidence.failure').length;

  const aiStartCount = recentPoints.filter((p) => p.name === 'ai_gateway.start').length;
  const aiCompleteCount = recentPoints.filter((p) => p.name === 'ai_gateway.complete').length;
  const aiFailCount = recentPoints.filter((p) => p.name === 'ai_gateway.failure').length;
  const aiFallbackCount = recentPoints.filter((p) => p.name === 'ai_gateway.fallback').length;

  const policyTriggers = recentPoints.filter((p) => p.name === 'policy_guard.trigger').length;
  const deenBoundaries = recentPoints.filter((p) => p.name === 'policy_guard.deen').length;
  const safeguardingBoundaries = recentPoints.filter((p) => p.name === 'policy_guard.safeguarding').length;

  const idempotencyHits = recentPoints.filter((p) => p.name === 'idempotency.hit').length;
  const idempotencyMisses = recentPoints.filter((p) => p.name === 'idempotency.miss').length;
  const idempotencyConflicts = recentPoints.filter((p) => p.name === 'idempotency.conflict').length;

  const errorPoints = recentPoints.filter((p) => p.name.startsWith('error.'));
  const errorCategories: Record<string, number> = {};
  for (const ep of errorPoints) {
    const category = ep.name.replace('error.', '');
    errorCategories[category] = (errorCategories[category] || 0) + 1;
  }

  return {
    window: { startMs: windowStart, endMs: now },
    conversation: {
      totalRequests: conversationSuccess + conversationFailure + conversationBlocked,
      successCount: conversationSuccess,
      failureCount: conversationFailure,
      blockedCount: conversationBlocked,
      latencyMs: conversationLatencies.length > 0 ? buildLatencySummary(conversationLatencies) : undefined,
    },
    streaming: {
      startCount: streamStartedCount,
      completedCount: streamCompletedCount,
      errorCount: streamErrorCount,
      totalEvents: streamEventCount,
    },
    sessions: {
      started: sessionStarted,
      resumed: sessionResumed,
      completed: sessionCompleted,
      transitions: sessionTransitions,
      checkpoints: sessionCheckpoints,
    },
    evidence: {
      writeAttempts: evidenceAttempts,
      writeSuccesses: evidenceSuccesses,
      writeFailures: evidenceFailures,
    },
    aiGateway: {
      callsStarted: aiStartCount,
      callsCompleted: aiCompleteCount,
      callsFailed: aiFailCount,
      fallbackUsed: aiFallbackCount,
    },
    policyGuards: {
      totalTriggers: policyTriggers,
      deenBoundaries,
      safeguardingBoundaries,
    },
    idempotency: {
      hits: idempotencyHits,
      misses: idempotencyMisses,
      conflicts: idempotencyConflicts,
    },
    errors: {
      total: errorPoints.length,
      byCategory: errorCategories,
    },
    privacy: {
      redactionsApplied: redactionCount,
      totalEvents: totalTelemetryEvents,
    },
    generatedAt: new Date().toISOString(),
  };
}
