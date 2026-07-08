import type {
  TelemetryEvent,
  TelemetryEventCategory,
  OperationalSeverity,
  OperationalMetricsSnapshot,
} from '../contracts/task024OperationsContracts';
import { redactObject, assertNoLeaks } from './task024RedactionAndLeakDetectionService';

const MAX_EVENTS = 1000;

const FORBIDDEN_FIELDS = new Set([
  'rawChat', 'prompt', 'providerResponse', 'answerKey',
  'teacherOnlyContent', 'studentPrivateMemory', 'safeguardingRaw',
  'deenSensitiveRaw', 'token', 'secret', 'databaseUrl',
  'authorizationHeader', 'cookie', 'stackTraceWithSensitiveData',
]);

const EVENT_STORE: TelemetryEvent[] = [];

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `tev_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function hasForbiddenField(event: Partial<TelemetryEvent> | Record<string, unknown>): string | undefined {
  for (const key of Object.keys(event)) {
    if (FORBIDDEN_FIELDS.has(key)) {
      return key;
    }
  }
  return undefined;
}

export function validateEventPrivacyLevel(
  event: TelemetryEvent,
): { safe: boolean; reason?: string } {
  const forbidden = hasForbiddenField(event as unknown as Record<string, unknown>);
  if (forbidden) {
    return { safe: false, reason: `Forbidden field present: ${forbidden}` };
  }
  return { safe: true };
}

export function recordSafeEvent(
  event: Omit<TelemetryEvent, 'id' | 'timestamp'>,
): TelemetryEvent {
  const fullEvent: TelemetryEvent = {
    ...event,
    id: generateId(),
    timestamp: nowISO(),
  };

  const validation = validateEventPrivacyLevel(fullEvent);
  if (!validation.safe) {
    throw new Error(`Safe Telemetry: ${validation.reason}`);
  }

  if (EVENT_STORE.length >= MAX_EVENTS) {
    EVENT_STORE.shift();
  }

  EVENT_STORE.push(fullEvent);
  return fullEvent;
}

export function redactSensitivePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return redactObject(payload);
}

export function getMetricsSnapshot(): OperationalMetricsSnapshot {
  const now = nowISO();
  const errorCount = EVENT_STORE.filter((e) => e.category === 'error').length;
  const requestCount = EVENT_STORE.filter((e) => e.category === 'request').length;

  const severityCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const readinessCounts: Record<string, number> = {};

  for (const ev of EVENT_STORE) {
    severityCounts[ev.severity] = (severityCounts[ev.severity] ?? 0) + 1;
    categoryCounts[ev.category] = (categoryCounts[ev.category] ?? 0) + 1;
    if (ev.status) {
      readinessCounts[ev.status] = (readinessCounts[ev.status] ?? 0) + 1;
    }
  }

  return {
    timestamp: now,
    requestId: `snapshot_${Date.now()}`,
    requestCount,
    errorCount,
    rateLimitCount: 0,
    readinessStatusCounts: readinessCounts,
    incidentCountBySeverity: severityCounts,
    incidentCountByCategory: categoryCounts,
    contentGapCount: 0,
    approvedSourceUnavailableCount: 0,
    schoolContextDeniedCount: 0,
    aiGatewayBlockedCount: 0,
    databaseReadinessFailures: 0,
    backupReadinessStatus: 'unknown',
    restoreDrillStatus: 'unknown',
  };
}

export function filterByComponent(component: string): TelemetryEvent[] {
  return EVENT_STORE.filter((e) => e.component === component);
}

export function filterByCategory(category: TelemetryEventCategory): TelemetryEvent[] {
  return EVENT_STORE.filter((e) => e.category === category);
}

export function filterBySeverity(severity: OperationalSeverity): TelemetryEvent[] {
  return EVENT_STORE.filter((e) => e.severity === severity);
}

export function filterByTimeRange(from: string, to: string): TelemetryEvent[] {
  return EVENT_STORE.filter((e) => e.timestamp >= from && e.timestamp <= to);
}

export function clearEvents(): void {
  EVENT_STORE.length = 0;
}
