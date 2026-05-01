import prisma from '../utils/prismaClient';
import { logger } from '../utils/logger';

type ThresholdConfig = {
  warn: number;
  critical: number;
};

type ThresholdKey =
  | 'sttMs'
  | 'sttFirstTokenMs'
  | 'firstTokenMs'
  | 'tutorLatencyMs'
  | 'doneMs'
  | 'ttsStartMs'
  | 'ttsFirstByteMs'
  | 'totalMs';

type Breach = {
  thresholdType: ThresholdKey;
  observedMs: number;
  thresholdMs: number;
  severity: 'warn' | 'critical';
};

export type TurnLatencyPayload = {
  studentId: string;
  sessionId?: string | null;
  turnId?: string;
  responseMode?: string;
  route?: string;
  forceWebSearch?: boolean;
  languageMode?: string;
  source?: string;
  sttMs?: number | null;
  sttFirstTokenMs?: number | null;
  firstTokenMs?: number | null;
  tutorLatencyMs?: number | null;
  doneMs?: number | null;
  totalMs?: number | null;
  ttsStartMs?: number | null;
  ttsFirstByteMs?: number | null;
  aiMs?: number | null;
  inputChars?: number | null;
  outputChars?: number | null;
  metadata?: Record<string, unknown> | null;
};

type DashboardFilters = {
  studentId?: string;
  responseMode?: string;
  route?: string;
  hours?: number;
  limit?: number;
};

const prismaAny = prisma as any;

const toPositiveInt = (value: unknown, max: number): number | null => {
  if (!Number.isFinite(Number(value))) return null;
  const parsed = Math.floor(Number(value));
  if (parsed < 0) return null;
  return Math.min(parsed, max);
};

const safeText = (value: unknown, maxLen: number): string | null => {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.slice(0, maxLen);
};

const readThreshold = (envKey: string, fallback: number) => {
  const raw = Number(process.env[envKey] || fallback);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
};

const THRESHOLDS: Record<ThresholdKey, ThresholdConfig> = {
  sttMs: {
    warn: readThreshold('LATENCY_THRESHOLD_STT_WARN_MS', 1800),
    critical: readThreshold('LATENCY_THRESHOLD_STT_CRITICAL_MS', 3200),
  },
  sttFirstTokenMs: {
    warn: readThreshold('LATENCY_THRESHOLD_STT_FIRST_TOKEN_WARN_MS', 900),
    critical: readThreshold('LATENCY_THRESHOLD_STT_FIRST_TOKEN_CRITICAL_MS', 1800),
  },
  firstTokenMs: {
    warn: readThreshold('LATENCY_THRESHOLD_FIRST_TOKEN_WARN_MS', 2200),
    critical: readThreshold('LATENCY_THRESHOLD_FIRST_TOKEN_CRITICAL_MS', 4200),
  },
  tutorLatencyMs: {
    warn: readThreshold('LATENCY_THRESHOLD_TUTOR_WARN_MS', 2200),
    critical: readThreshold('LATENCY_THRESHOLD_TUTOR_CRITICAL_MS', 4200),
  },
  doneMs: {
    warn: readThreshold('LATENCY_THRESHOLD_DONE_WARN_MS', 6500),
    critical: readThreshold('LATENCY_THRESHOLD_DONE_CRITICAL_MS', 11000),
  },
  ttsStartMs: {
    warn: readThreshold('LATENCY_THRESHOLD_TTS_START_WARN_MS', 1800),
    critical: readThreshold('LATENCY_THRESHOLD_TTS_START_CRITICAL_MS', 3200),
  },
  ttsFirstByteMs: {
    warn: readThreshold('LATENCY_THRESHOLD_TTS_FIRST_BYTE_WARN_MS', 1200),
    critical: readThreshold('LATENCY_THRESHOLD_TTS_FIRST_BYTE_CRITICAL_MS', 2600),
  },
  totalMs: {
    warn: readThreshold('LATENCY_THRESHOLD_TOTAL_WARN_MS', 7500),
    critical: readThreshold('LATENCY_THRESHOLD_TOTAL_CRITICAL_MS', 13000),
  },
};

const createTurnId = () => `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readMetric = (metric: Record<string, unknown>, key: ThresholdKey): number | null => {
  const direct = Number(metric[key]);
  if (Number.isFinite(direct) && direct >= 0) return Math.floor(direct);
  const metadata = asRecord(metric.metadata);
  if (!metadata) return null;
  const fromMetadata = Number(metadata[key]);
  if (Number.isFinite(fromMetadata) && fromMetadata >= 0) return Math.floor(fromMetadata);
  if (key === 'tutorLatencyMs') {
    const fromAiMs = Number(metric.aiMs);
    if (Number.isFinite(fromAiMs) && fromAiMs >= 0) return Math.floor(fromAiMs);
  }
  return null;
};

const evaluateBreaches = (metric: Record<string, unknown>): Breach[] => {
  const breaches: Breach[] = [];
  (Object.keys(THRESHOLDS) as ThresholdKey[]).forEach((key) => {
    const observed = readMetric(metric, key);
    if (!Number.isFinite(observed) || observed < 0) return;
    const threshold = THRESHOLDS[key];
    if (observed >= threshold.critical) {
      breaches.push({
        thresholdType: key,
        observedMs: observed,
        thresholdMs: threshold.critical,
        severity: 'critical',
      });
      return;
    }
    if (observed >= threshold.warn) {
      breaches.push({
        thresholdType: key,
        observedMs: observed,
        thresholdMs: threshold.warn,
        severity: 'warn',
      });
    }
  });
  return breaches;
};

const percentile = (values: number[], p: number): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
};

const extractMetricNumbers = (rows: any[], key: ThresholdKey): number[] =>
  rows
    .map((row) => readMetric((row || {}) as Record<string, unknown>, key))
    .filter((value): value is number => Number.isFinite(value) && value >= 0)
    .map((value) => Math.floor(value));

const summarizeMode = (rows: any[]) => {
  const buckets = new Map<string, any[]>();
  rows.forEach((row) => {
    const key = String(row?.responseMode || 'default');
    const list = buckets.get(key) || [];
    list.push(row);
    buckets.set(key, list);
  });

  return Array.from(buckets.entries())
    .map(([mode, list]) => {
      const sttMs = extractMetricNumbers(list, 'sttMs');
      const sttFirstTokenMs = extractMetricNumbers(list, 'sttFirstTokenMs');
      const firstTokenMs = extractMetricNumbers(list, 'firstTokenMs');
      const tutorLatencyMs = extractMetricNumbers(list, 'tutorLatencyMs');
      const doneMs = extractMetricNumbers(list, 'doneMs');
      const ttsStartMs = extractMetricNumbers(list, 'ttsStartMs');
      const ttsFirstByteMs = extractMetricNumbers(list, 'ttsFirstByteMs');
      const breached = list.filter((item) => Boolean(item?.thresholdBreached)).length;
      return {
        mode,
        count: list.length,
        breachRatePct: list.length > 0 ? Number(((breached / list.length) * 100).toFixed(2)) : 0,
        avgSttMs: average(sttMs),
        p95SttMs: percentile(sttMs, 95),
        avgSttFirstTokenMs: average(sttFirstTokenMs),
        p95SttFirstTokenMs: percentile(sttFirstTokenMs, 95),
        avgFirstTokenMs: average(firstTokenMs),
        p95FirstTokenMs: percentile(firstTokenMs, 95),
        avgTutorLatencyMs: average(tutorLatencyMs),
        p95TutorLatencyMs: percentile(tutorLatencyMs, 95),
        avgDoneMs: average(doneMs),
        p95DoneMs: percentile(doneMs, 95),
        avgTtsStartMs: average(ttsStartMs),
        p95TtsStartMs: percentile(ttsStartMs, 95),
        avgTtsFirstByteMs: average(ttsFirstByteMs),
        p95TtsFirstByteMs: percentile(ttsFirstByteMs, 95),
      };
    })
    .sort((a, b) => b.count - a.count);
};

export async function recordTurnLatency(payload: TurnLatencyPayload) {
  if (!prismaAny?.turnLatencyMetric) {
    return { stored: false, reason: 'latency models not configured', turnId: payload.turnId || createTurnId() };
  }

  const studentId = safeText(payload.studentId, 128);
  if (!studentId) {
    throw new Error('studentId is required');
  }

  const turnId = safeText(payload.turnId, 128) || createTurnId();
  const now = new Date();
  const sttMs = toPositiveInt(payload.sttMs, 300000);
  const sttFirstTokenMs = toPositiveInt(payload.sttFirstTokenMs, 300000);
  const firstTokenMs = toPositiveInt(payload.firstTokenMs, 300000);
  const tutorLatencyMs =
    toPositiveInt(payload.tutorLatencyMs, 300000) ??
    toPositiveInt(payload.aiMs, 300000) ??
    firstTokenMs;
  const doneMs = toPositiveInt(payload.doneMs, 300000);
  const totalMs = toPositiveInt(payload.totalMs, 300000);
  const ttsStartMs = toPositiveInt(payload.ttsStartMs, 300000);
  const ttsFirstByteMs = toPositiveInt(payload.ttsFirstByteMs, 300000);
  const baseMetadata = asRecord(payload.metadata) || {};
  const latencyMetadata = {
    ...baseMetadata,
    ...(sttFirstTokenMs !== null ? { sttFirstTokenMs } : {}),
    ...(tutorLatencyMs !== null ? { tutorLatencyMs } : {}),
    ...(ttsFirstByteMs !== null ? { ttsFirstByteMs } : {}),
  };
  const upsertData: Record<string, unknown> = {
    sessionId: safeText(payload.sessionId, 128),
    responseMode: safeText(payload.responseMode, 64) || 'default',
    route: safeText(payload.route, 64) || 'copilot_chat',
    forceWebSearch: Boolean(payload.forceWebSearch),
    languageMode: safeText(payload.languageMode, 64),
    source: safeText(payload.source, 64),
    sttMs,
    firstTokenMs,
    doneMs,
    totalMs,
    ttsStartMs,
    aiMs: tutorLatencyMs,
    inputChars: toPositiveInt(payload.inputChars, 100000),
    outputChars: toPositiveInt(payload.outputChars, 100000),
    metadata: Object.keys(latencyMetadata).length > 0 ? latencyMetadata : null,
    updatedAt: now,
  };

  try {
    const existing = await prismaAny.turnLatencyMetric.findUnique({
      where: { studentId_turnId: { studentId, turnId } },
    });

    const metric = existing
      ? await prismaAny.turnLatencyMetric.update({
          where: { id: existing.id },
          data: upsertData,
        })
      : await prismaAny.turnLatencyMetric.create({
          data: {
            studentId,
            turnId,
            createdAt: now,
            ...upsertData,
          },
        });

    const breaches = evaluateBreaches(metric as Record<string, unknown>);
    const highestSeverity: 'warn' | 'critical' | null = breaches.some((item) => item.severity === 'critical')
      ? 'critical'
      : breaches.length > 0
        ? 'warn'
        : null;

    await prismaAny.turnLatencyMetric.update({
      where: { id: metric.id },
      data: {
        thresholdBreached: Boolean(highestSeverity),
        thresholdLevel: highestSeverity,
      },
    });

    if (breaches.length > 0 && prismaAny?.latencyThresholdAlert?.createMany) {
      await prismaAny.latencyThresholdAlert.createMany({
        data: breaches.map((breach) => ({
          metricId: metric.id,
          studentId,
          severity: breach.severity,
          thresholdType: breach.thresholdType,
          thresholdMs: breach.thresholdMs,
          observedMs: breach.observedMs,
          metadata: {
            route: metric.route,
            responseMode: metric.responseMode,
            source: metric.source,
          },
        })),
        skipDuplicates: true,
      });
    }

    if (highestSeverity) {
      logger.warn(
        {
          studentId,
          sessionId: metric.sessionId,
          turnId: metric.turnId,
          severity: highestSeverity,
          firstTokenMs: metric.firstTokenMs,
          doneMs: metric.doneMs,
          sttMs: metric.sttMs,
          ttsStartMs: metric.ttsStartMs,
          totalMs: metric.totalMs,
        },
        '[LatencyAlert] Threshold breached'
      );
    }

    return { stored: true, turnId, breaches, severity: highestSeverity };
  } catch (error) {
    logger.error({ error: String(error), turnId, studentId }, '[Latency] Failed to persist turn latency.');
    return { stored: false, turnId, breaches: [], severity: null };
  }
}

export async function getLatencyDashboard(filters: DashboardFilters) {
  if (!prismaAny?.turnLatencyMetric) {
    return {
      enabled: false,
      message: 'Latency models not configured.',
      windowHours: filters.hours || 24,
      totalTurns: 0,
      breaches: 0,
      breachRatePct: 0,
      metrics: {},
      byMode: [],
      recent: [],
      thresholds: THRESHOLDS,
    };
  }

  const hours = Math.max(1, Math.min(24 * 14, Number(filters.hours || 24)));
  const limit = Math.max(10, Math.min(2000, Number(filters.limit || 500)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const where: Record<string, unknown> = {
    createdAt: { gte: since },
  };

  const studentId = safeText(filters.studentId, 128);
  const responseMode = safeText(filters.responseMode, 64);
  const route = safeText(filters.route, 64);
  if (studentId) where.studentId = studentId;
  if (responseMode) where.responseMode = responseMode;
  if (route) where.route = route;

  const rows = await prismaAny.turnLatencyMetric.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const sttMs = extractMetricNumbers(rows, 'sttMs');
  const sttFirstTokenMs = extractMetricNumbers(rows, 'sttFirstTokenMs');
  const firstTokenMs = extractMetricNumbers(rows, 'firstTokenMs');
  const tutorLatencyMs = extractMetricNumbers(rows, 'tutorLatencyMs');
  const doneMs = extractMetricNumbers(rows, 'doneMs');
  const ttsStartMs = extractMetricNumbers(rows, 'ttsStartMs');
  const ttsFirstByteMs = extractMetricNumbers(rows, 'ttsFirstByteMs');
  const totalMs = extractMetricNumbers(rows, 'totalMs');
  const breaches = rows.filter((row: any) => Boolean(row?.thresholdBreached)).length;

  return {
    enabled: true,
    windowHours: hours,
    totalTurns: rows.length,
    breaches,
    breachRatePct: rows.length > 0 ? Number(((breaches / rows.length) * 100).toFixed(2)) : 0,
    metrics: {
      firstTokenMs: {
        avg: average(firstTokenMs),
        p50: percentile(firstTokenMs, 50),
        p95: percentile(firstTokenMs, 95),
      },
      sttFirstTokenMs: {
        avg: average(sttFirstTokenMs),
        p50: percentile(sttFirstTokenMs, 50),
        p95: percentile(sttFirstTokenMs, 95),
      },
      tutorLatencyMs: {
        avg: average(tutorLatencyMs),
        p50: percentile(tutorLatencyMs, 50),
        p95: percentile(tutorLatencyMs, 95),
      },
      doneMs: {
        avg: average(doneMs),
        p50: percentile(doneMs, 50),
        p95: percentile(doneMs, 95),
      },
      ttsStartMs: {
        avg: average(ttsStartMs),
        p50: percentile(ttsStartMs, 50),
        p95: percentile(ttsStartMs, 95),
      },
      ttsFirstByteMs: {
        avg: average(ttsFirstByteMs),
        p50: percentile(ttsFirstByteMs, 50),
        p95: percentile(ttsFirstByteMs, 95),
      },
      sttMs: {
        avg: average(sttMs),
        p50: percentile(sttMs, 50),
        p95: percentile(sttMs, 95),
      },
      totalMs: {
        avg: average(totalMs),
        p50: percentile(totalMs, 50),
        p95: percentile(totalMs, 95),
      },
    },
    byMode: summarizeMode(rows),
    recent: rows.slice(0, 50).map((row: any) => ({
      id: row.id,
      studentId: row.studentId,
      sessionId: row.sessionId,
      turnId: row.turnId,
      responseMode: row.responseMode,
      route: row.route,
      sttMs: row.sttMs,
      sttFirstTokenMs: readMetric(row, 'sttFirstTokenMs'),
      firstTokenMs: row.firstTokenMs,
      tutorLatencyMs: readMetric(row, 'tutorLatencyMs'),
      doneMs: row.doneMs,
      ttsStartMs: row.ttsStartMs,
      ttsFirstByteMs: readMetric(row, 'ttsFirstByteMs'),
      totalMs: row.totalMs,
      thresholdBreached: row.thresholdBreached,
      thresholdLevel: row.thresholdLevel,
      createdAt: row.createdAt?.toISOString ? row.createdAt.toISOString() : row.createdAt,
    })),
    thresholds: THRESHOLDS,
  };
}

export async function listLatencyAlerts(options: {
  hours?: number;
  limit?: number;
  acknowledged?: boolean;
  severity?: 'warn' | 'critical';
}) {
  if (!prismaAny?.latencyThresholdAlert) {
    return { enabled: false, alerts: [] };
  }

  const hours = Math.max(1, Math.min(24 * 14, Number(options.hours || 24)));
  const limit = Math.max(1, Math.min(1000, Number(options.limit || 200)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const where: Record<string, unknown> = { createdAt: { gte: since } };

  if (typeof options.acknowledged === 'boolean') where.acknowledged = options.acknowledged;
  if (options.severity) where.severity = options.severity;

  const alerts = await prismaAny.latencyThresholdAlert.findMany({
    where,
    include: {
      metric: {
        select: {
          id: true,
          turnId: true,
          route: true,
          responseMode: true,
          firstTokenMs: true,
          doneMs: true,
          sttMs: true,
          ttsStartMs: true,
          aiMs: true,
          metadata: true,
          totalMs: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  return {
    enabled: true,
    alerts: alerts.map((alert: any) => ({
      ...alert,
      createdAt: alert.createdAt?.toISOString ? alert.createdAt.toISOString() : alert.createdAt,
      updatedAt: alert.updatedAt?.toISOString ? alert.updatedAt.toISOString() : alert.updatedAt,
      metric: alert.metric
        ? {
          ...alert.metric,
          sttFirstTokenMs: readMetric(alert.metric, 'sttFirstTokenMs'),
          tutorLatencyMs: readMetric(alert.metric, 'tutorLatencyMs'),
          ttsFirstByteMs: readMetric(alert.metric, 'ttsFirstByteMs'),
          createdAt: alert.metric.createdAt?.toISOString
            ? alert.metric.createdAt.toISOString()
            : alert.metric.createdAt,
        }
        : null,
    })),
  };
}

export async function acknowledgeLatencyAlert(alertId: string, actorId: string) {
  if (!prismaAny?.latencyThresholdAlert) {
    return { updated: false, reason: 'latency alerts not configured' };
  }

  const cleanAlertId = safeText(alertId, 128);
  if (!cleanAlertId) {
    return { updated: false, reason: 'alertId is required' };
  }

  const updated = await prismaAny.latencyThresholdAlert.update({
    where: { id: cleanAlertId },
    data: {
      acknowledged: true,
      metadata: {
        acknowledgedBy: actorId,
        acknowledgedAt: new Date().toISOString(),
      },
    },
  });

  return { updated: true, alert: updated };
}
