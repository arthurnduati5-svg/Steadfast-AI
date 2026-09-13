import { logger } from '../utils/logger';

export interface LimitAuditEvent {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  tutorLearnerId?: string;
  sessionId?: string;
  route: string;
  operation: string;
  decision: 'allow' | 'allow_degraded' | 'deny_retry_later' | 'deny_rate_limited' | 'deny_quota_exceeded' | 'deny_abuse';
  reasonCodes: string[];
  quotaCategory?: string;
  pressureStatus?: string;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

const auditBuffer: LimitAuditEvent[] = [];
const MAX_BUFFER = 1000;

export function recordLimitAuditEvent(event: Omit<LimitAuditEvent, 'createdAt'> & { createdAt?: string }): void {
  const record: LimitAuditEvent = {
    ...event,
    createdAt: event.createdAt || new Date().toISOString()
  };

  auditBuffer.push(record);
  if (auditBuffer.length > MAX_BUFFER) {
    auditBuffer.shift();
  }

  if (event.decision.startsWith('deny')) {
    logger.warn({ event: record }, '[RuntimeLimitAudit] Limit denied');
  }
}

export function getLimitAuditEvents(
  opts?: {
    actorId?: string;
    schoolId?: string;
    route?: string;
    decision?: string;
    since?: string;
    limit?: number;
  }
): LimitAuditEvent[] {
  let results = [...auditBuffer];

  if (opts?.actorId) {
    results = results.filter(e => e.actorId === opts.actorId);
  }
  if (opts?.schoolId) {
    results = results.filter(e => e.schoolId === opts.schoolId);
  }
  if (opts?.route) {
    results = results.filter(e => e.route === opts.route);
  }
  if (opts?.decision) {
    results = results.filter(e => e.decision === opts.decision);
  }
  if (opts?.since) {
    const sinceMs = new Date(opts.since).getTime();
    results = results.filter(e => new Date(e.createdAt).getTime() >= sinceMs);
  }

  const limit = opts?.limit || 100;
  return results.slice(-limit);
}

export function clearLimitAuditBuffer(): void {
  auditBuffer.length = 0;
}

export function getLimitAuditBufferSize(): number {
  return auditBuffer.length;
}
