import prisma from '../utils/prismaClient';
import { logger } from '../utils/logger';

const prismaAny = prisma as any;

type Role = 'admin' | 'counselor' | 'student';

type TracePayload = {
  actorId: string;
  actorRole: Role | string;
  studentId: string;
  category: string;
  severity?: 'info' | 'warn' | 'critical';
  sessionId?: string | null;
  turnId?: string | null;
  route?: string | null;
  source?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

type DashboardFilters = {
  studentId?: string;
  hours?: number;
  limit?: number;
};

type AnomalyItem = Record<string, unknown> & {
  type: string;
  severity: string;
  severityWeight: number;
  createdAt?: string;
};

const safeText = (value: unknown, maxLen: number) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.slice(0, maxLen);
};

const toBoundedInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
};

const sortByCreatedDesc = <T extends { createdAt?: string; severityWeight: number }>(items: T[]) =>
  items.sort((a, b) => {
    if (a.severityWeight !== b.severityWeight) return b.severityWeight - a.severityWeight;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });

const severityWeight = (severity: string) => {
  const normalized = String(severity || '').toLowerCase();
  if (normalized === 'critical') return 3;
  if (normalized === 'warn' || normalized === 'high') return 2;
  return 1;
};

export async function recordAbnormalBehaviorTrace(payload: TracePayload) {
  const actorId = safeText(payload.actorId, 128);
  const studentId = safeText(payload.studentId, 128);
  const category = safeText(payload.category, 64);
  const summary = safeText(payload.summary, 500);
  const severity = (safeText(payload.severity || 'warn', 16).toLowerCase() || 'warn') as 'info' | 'warn' | 'critical';

  if (!actorId) throw new Error('actorId is required.');
  if (!studentId) throw new Error('studentId is required.');
  if (!category) throw new Error('category is required.');
  if (!summary) throw new Error('summary is required.');

  const metadata = {
    studentId,
    sessionId: safeText(payload.sessionId, 128) || null,
    turnId: safeText(payload.turnId, 128) || null,
    route: safeText(payload.route, 64) || null,
    source: safeText(payload.source, 64) || null,
    severity,
    summary,
    ...(payload.metadata || {}),
  };

  logger.warn(
    {
      actorId,
      actorRole: payload.actorRole,
      studentId,
      category,
      severity,
      sessionId: metadata.sessionId,
      turnId: metadata.turnId,
      route: metadata.route,
      source: metadata.source,
    },
    '[AbnormalBehavior] Trace recorded'
  );

  if (!prismaAny?.safetyEventAudit) {
    return { stored: false, category, severity };
  }

  const created = await prismaAny.safetyEventAudit.create({
    data: {
      actorId,
      actorRole: safeText(payload.actorRole || 'student', 32) || 'student',
      action: 'abnormal_behavior_trace',
      targetType: category,
      targetId: (metadata.turnId as string | null) || (metadata.sessionId as string | null) || null,
      metadata,
    },
  });

  return { stored: true, id: created.id, category, severity };
}

export async function getAbnormalBehaviorDashboard(filters: DashboardFilters) {
  const hours = toBoundedInt(filters.hours, 24, 24 * 14);
  const limit = toBoundedInt(filters.limit, 100, 1000);
  const studentId = safeText(filters.studentId, 128);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const latencyWhere: Record<string, unknown> = { createdAt: { gte: since } };
  const safetyWhere: Record<string, unknown> = { createdAt: { gte: since } };
  const auditWhere: Record<string, unknown> = { createdAt: { gte: since }, action: 'abnormal_behavior_trace' };

  if (studentId) {
    latencyWhere.studentId = studentId;
    safetyWhere.studentId = studentId;
    auditWhere.metadata = { path: ['studentId'], equals: studentId };
  }

  const [metrics, safetyAlerts, traces] = await Promise.all([
    prismaAny?.turnLatencyMetric?.findMany
      ? prismaAny.turnLatencyMetric.findMany({
          where: latencyWhere,
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
    prismaAny?.safetyAlert?.findMany
      ? prismaAny.safetyAlert.findMany({
          where: safetyWhere,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 200),
        })
      : Promise.resolve([]),
    prismaAny?.safetyEventAudit?.findMany
      ? prismaAny.safetyEventAudit.findMany({
          where: auditWhere,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 300),
        })
      : Promise.resolve([]),
  ]);

  const anomalyItems: AnomalyItem[] = [];

  for (const row of metrics as any[]) {
    const meta = (row?.metadata || {}) as Record<string, unknown>;
    const createdAt = row?.createdAt?.toISOString ? row.createdAt.toISOString() : String(row?.createdAt || '');
    const route = String(row?.route || '');

    if (row?.thresholdLevel === 'critical') {
      anomalyItems.push({
        type: 'latency_critical',
        severity: 'critical',
        severityWeight: 3,
        studentId: row.studentId,
        sessionId: row.sessionId,
        turnId: row.turnId,
        route,
        summary: `Critical latency on ${route || 'unknown route'}.`,
        metrics: {
          firstTokenMs: row.firstTokenMs,
          doneMs: row.doneMs,
          totalMs: row.totalMs,
          sttMs: row.sttMs,
          ttsStartMs: row.ttsStartMs,
        },
        createdAt,
      });
    }

    const ttsCutoffCount = Number(meta.ttsCutoffCount || 0);
    const ttsRetryCount = Number(meta.ttsRetryCount || 0);
    const ttsResumeCount = Number(meta.ttsResumeCount || 0);
    const failed = Boolean(meta.failed);

    if (ttsCutoffCount > 0) {
      anomalyItems.push({
        type: 'voice_cutoff',
        severity: ttsCutoffCount >= 2 ? 'critical' : 'warn',
        severityWeight: ttsCutoffCount >= 2 ? 3 : 2,
        studentId: row.studentId,
        sessionId: row.sessionId,
        turnId: row.turnId,
        route,
        summary: `Voice cutoff detected during playback${route ? ` on ${route}` : ''}.`,
        metrics: {
          ttsCutoffCount,
          ttsRetryCount,
          ttsResumeCount,
          ttsStartMs: row.ttsStartMs,
        },
        createdAt,
      });
    } else if (ttsRetryCount >= 2 || ttsResumeCount >= 2) {
      anomalyItems.push({
        type: 'voice_instability',
        severity: 'warn',
        severityWeight: 2,
        studentId: row.studentId,
        sessionId: row.sessionId,
        turnId: row.turnId,
        route,
        summary: 'Voice playback recovered through repeated retries/resumes.',
        metrics: {
          ttsRetryCount,
          ttsResumeCount,
          ttsStartMs: row.ttsStartMs,
        },
        createdAt,
      });
    }

    if (failed) {
      anomalyItems.push({
        type: 'failed_turn',
        severity: 'warn',
        severityWeight: 2,
        studentId: row.studentId,
        sessionId: row.sessionId,
        turnId: row.turnId,
        route,
        summary: `Turn failed${route ? ` on ${route}` : ''}.`,
        createdAt,
      });
    }
  }

  for (const alert of safetyAlerts as any[]) {
    const createdAt = alert?.createdAt?.toISOString ? alert.createdAt.toISOString() : String(alert?.createdAt || '');
    const severity = String(alert?.severity || 'warn').toLowerCase();
    anomalyItems.push({
      type: 'safety_risk',
      severity,
      severityWeight: severityWeight(severity),
      studentId: alert.studentId,
      sessionId: alert.sessionId,
      alertId: alert.id,
      summary: `Safety alert: ${alert.category} (${severity}).`,
      status: alert.status,
      counselorNotified: Boolean(alert.counselorNotified),
      createdAt,
    });
  }

  for (const trace of traces as any[]) {
    const metadata = (trace?.metadata || {}) as Record<string, unknown>;
    const severity = String(metadata.severity || 'warn').toLowerCase();
    anomalyItems.push({
      type: 'manual_trace',
      severity,
      severityWeight: severityWeight(severity),
      studentId: String(metadata.studentId || ''),
      sessionId: String(metadata.sessionId || ''),
      turnId: String(metadata.turnId || ''),
      route: String(metadata.route || ''),
      source: String(metadata.source || ''),
      traceId: trace.id,
      category: trace.targetType,
      summary: String(metadata.summary || trace.targetType || 'Manual anomaly trace'),
      createdAt: trace?.createdAt?.toISOString ? trace.createdAt.toISOString() : String(trace?.createdAt || ''),
    });
  }

  const recent = sortByCreatedDesc(anomalyItems).slice(0, Math.min(limit, 200)).map(({ severityWeight, ...item }) => item);
  const summary = {
    criticalCount: recent.filter((item) => String(item.severity || '') === 'critical').length,
    warnCount: recent.filter((item) => String(item.severity || '') === 'warn' || String(item.severity || '') === 'high').length,
    voiceCutoffCount: recent.filter((item) => String(item.type || '') === 'voice_cutoff').length,
    failedTurnCount: recent.filter((item) => String(item.type || '') === 'failed_turn').length,
    safetyRiskCount: recent.filter((item) => String(item.type || '') === 'safety_risk').length,
    manualTraceCount: recent.filter((item) => String(item.type || '') === 'manual_trace').length,
  };

  return {
    enabled: true,
    windowHours: hours,
    studentId: studentId || null,
    summary,
    recent,
  };
}
