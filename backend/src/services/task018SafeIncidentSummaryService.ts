// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Safe Incident Summary Service
// Creates safe summaries for operational failures.
// No stack traces, no raw payloads, no private memory exposed.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import type {
  SafeIncidentSummary,
  IncidentSeverity,
  TelemetryComponent,
  TelemetryPrivacyMetadata,
} from '../contracts/task018Contracts';
import { PRIVACY_CLEAN_METADATA } from '../contracts/task018Contracts';

const MAX_INCIDENTS = 200;

interface InternalIncident {
  severity: IncidentSeverity;
  component: TelemetryComponent;
  errorCode: string;
  safeMessage: string;
  retryable: boolean;
  recommendedOperatorAction: string;
  timestamp: number;
}

const incidents: InternalIncident[] = [];

const OPERATOR_ACTIONS: Record<string, string> = {
  AI_PROVIDER_UNAVAILABLE: 'Check AI provider configuration and network connectivity',
  DATABASE_ERROR: 'Check database connection and migrate schema if needed',
  STREAM_ABORTED: 'Investigate streaming runtime for resource constraints',
  EVIDENCE_WRITE_FAILED: 'Check evidence pipeline and database availability',
  AUTH_REQUIRED: 'Verify authentication configuration',
  RATE_LIMITED: 'Consider scaling or reviewing rate limit configuration',
  SESSION_NOT_FOUND: 'Verify session state repository is operational',
  IDEMPOTENCY_CONFLICT: 'Investigate idempotency key collision rate',
  POLICY_GUARD_ERROR: 'Review policy guard configuration and rules',
  DEEN_BOUNDARY_ERROR: 'Verify Deen sensitivity classification service',
  SAFEGUARDING_ERROR: 'Check safeguarding policy service and configuration',
  TIMEOUT: 'Check for downstream service latency or resource exhaustion',
  UNKNOWN: 'Review recent logs for the incident requestId',
};

function getDefaultAction(errorCode: string): string {
  return OPERATOR_ACTIONS[errorCode] || OPERATOR_ACTIONS.UNKNOWN;
}

export function recordIncident(input: {
  severity: IncidentSeverity;
  component: TelemetryComponent;
  errorCode: string;
  safeMessage: string;
  retryable?: boolean;
  recommendedOperatorAction?: string;
}): void {
  incidents.push({
    severity: input.severity,
    component: input.component,
    errorCode: input.errorCode,
    safeMessage: input.safeMessage.slice(0, 500),
    retryable: input.retryable ?? true,
    recommendedOperatorAction: input.recommendedOperatorAction || getDefaultAction(input.errorCode),
    timestamp: Date.now(),
  });

  if (incidents.length > MAX_INCIDENTS) {
    incidents.splice(0, incidents.length - MAX_INCIDENTS);
  }
}

export function getRecentIncidents(
  limit: number = 20,
  component?: TelemetryComponent,
): SafeIncidentSummary[] {
  let filtered = [...incidents].reverse();

  if (component) {
    filtered = filtered.filter((i) => i.component === component);
  }

  const grouped = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();

  for (const inc of filtered) {
    const key = `${inc.component}:${inc.errorCode}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = inc.timestamp;
    } else {
      grouped.set(key, {
        count: 1,
        firstSeen: inc.timestamp,
        lastSeen: inc.timestamp,
      });
    }
  }

  const summaries: SafeIncidentSummary[] = [];

  for (const [key, group] of grouped) {
    const [componentStr, errorCode] = key.split(':');
    const match = filtered.find((i) => i.component === componentStr && i.errorCode === errorCode);
    if (!match) continue;

    summaries.push({
      incidentId: randomUUID(),
      severity: match.severity,
      component: componentStr as TelemetryComponent,
      errorCode,
      safeMessage: match.safeMessage,
      count: group.count,
      firstSeenAt: new Date(group.firstSeen).toISOString(),
      lastSeenAt: new Date(group.lastSeen).toISOString(),
      retryable: match.retryable,
      recommendedOperatorAction: match.recommendedOperatorAction,
      privacyMetadata: PRIVACY_CLEAN_METADATA,
    });
  }

  return summaries.slice(0, limit);
}

export function getIncidentCount(): number {
  return incidents.length;
}

export function getErrorCategories(): Record<string, number> {
  const categories: Record<string, number> = {};
  for (const inc of incidents) {
    categories[inc.errorCode] = (categories[inc.errorCode] || 0) + 1;
  }
  return categories;
}

export function resetIncidentsForTests(): void {
  incidents.length = 0;
}
