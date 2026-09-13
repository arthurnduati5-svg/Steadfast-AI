/**
 * AI Route Module — Document & Voice Quota
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 9871-10055.
 * Domain: document-voice
 *
 * Voice chat / STT / TTS routes remain deferred in ai.ts (high risk).
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import {
  getVoiceBalanceSummary,
  startVoiceSession,
  stopVoiceSession,
} from '../../services/voiceLedgerService';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';

const router = Router();

// ── Inline helpers (extracted from ai.ts preamble) ──

const MAX_VOICE_SESSIONS_PER_DAY = 3;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function getDocumentQuotaState(studentId: string) {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUploads = await prisma.voiceUsage.count({
    where: { studentId, startedAt: { gte: windowStart } },
  });
  const maxDocs = 2;
  return {
    allowed: recentUploads < maxDocs,
    usedToday: recentUploads,
    remaining: Math.max(0, maxDocs - recentUploads),
    maxPerDay: maxDocs,
  };
}

async function consumeDocumentQuota(studentId: string) {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUploads = await prisma.voiceUsage.count({
    where: { studentId, startedAt: { gte: windowStart } },
  });
  const maxDocs = 2;
  if (recentUploads >= maxDocs) {
    return { allowed: false, usedToday: recentUploads, remaining: 0, maxPerDay: maxDocs };
  }
  await prisma.voiceUsage.create({
    data: { studentId, durationSec: 0, source: 'document-upload' },
  });
  return { allowed: true, usedToday: recentUploads + 1, remaining: Math.max(0, maxDocs - recentUploads - 1), maxPerDay: maxDocs };
}

function isDocumentKind(kind: string): boolean {
  return ['pdf', 'image', 'worksheet', 'assignment'].includes(kind);
}

function getVoiceDayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

function computeVoiceQuota(args: { count: number; seconds: number; bonusSeconds: number }) {
  const dailyLimitSeconds = MAX_VOICE_SESSIONS_PER_DAY * 180;
  const remainingDailySeconds = Math.max(0, dailyLimitSeconds - args.seconds);
  const remainingSessions = Math.max(0, MAX_VOICE_SESSIONS_PER_DAY - args.count);
  return {
    dailyLimitSeconds,
    remainingDailySeconds,
    dailySessionsUsed: args.count,
    maxDailySessions: MAX_VOICE_SESSIONS_PER_DAY,
    remainingSessions,
  };
}

// ── GET /document/quota ──
router.get('/document/quota', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const quota = await getDocumentQuotaState(studentId);
    return res.status(200).send(quota);
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// ── POST /document/consume ──
router.post('/document/consume', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const kind = safeString(req.body?.documentKind || req.body?.kind).toLowerCase();
    if (!isDocumentKind(kind)) {
      return res.status(400).send({ message: 'Unsupported document kind.' });
    }

    const quota = await consumeDocumentQuota(studentId);
    if (!quota.allowed) {
      return res.status(429).send({
        message: 'Daily document limit reached (2 per 24 hours).',
        ...quota,
      });
    }

    return res.status(200).send({
      message: 'Document quota consumed.',
      ...quota,
    });
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /voice/balance ──
router.get('/voice/balance', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const summary = await getVoiceBalanceSummary(studentId);
    res.status(200).send({
      studentId: summary.studentId,
      remainingSeconds: summary.remainingSeconds,
      remainingMinutesRoundedDown: summary.remainingMinutesRoundedDown,
      display: summary.display,
    });
  } catch {
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── POST /voice/session/start ──
router.post('/voice/session/start', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const chatSessionId = safeString(req.body?.chatSessionId || '') || null;
    const metadata = req.body?.metadata;
    const started = await startVoiceSession({ studentId, chatSessionId, metadata });

    if (!started.allowed) {
      return res.status(402).send({
        allowed: false,
        reason: started.reason,
        remainingSeconds: started.remainingSeconds,
        message: 'Voice time finished'
      });
    }

    return res.status(200).send({
      allowed: true,
      sessionUsageId: started.sessionUsageId,
      mode: started.mode,
      remainingSeconds: started.remainingSeconds,
    });
  } catch {
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── POST /voice/session/stop ──
router.post('/voice/session/stop', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const sessionUsageId = safeString(req.body?.sessionUsageId);
    if (!sessionUsageId) {
      return res.status(400).send({ message: 'sessionUsageId is required.' });
    }

    const result = await stopVoiceSession({
      studentId,
      sessionUsageId,
      stopReason: safeString(req.body?.stopReason),
      listeningSecondsUsed: Number(req.body?.listeningSecondsUsed || 0),
      ttsSecondsUsed: Number(req.body?.ttsSecondsUsed || 0),
      metadata: req.body?.metadata,
    });

    return res.status(200).send({
      sessionUsageId: result.sessionUsageId,
      billedSeconds: result.billedSeconds,
      remainingSeconds: result.remainingSeconds,
      reason: result.stopReason,
      mode: result.mode,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    if (message.includes('Voice session not found')) {
      return res.status(404).send({ message: 'Voice session not found.' });
    }
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /voice/quota ──
router.get('/voice/quota', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { start, end } = getVoiceDayRange();
    const [summary, dailySessions] = await Promise.all([
      getVoiceBalanceSummary(studentId),
      prisma.voiceSessionUsage.findMany({
        where: { studentId, startedAt: { gte: start, lte: end } },
        select: { billedSeconds: true },
        orderBy: { startedAt: 'asc' }
      })
    ]);

    const count = dailySessions.length;
    const seconds = dailySessions.reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
    const bonusSeconds = dailySessions
      .slice(MAX_VOICE_SESSIONS_PER_DAY)
      .reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
    const quota = computeVoiceQuota({ count, seconds, bonusSeconds });

    res.status(200).send({
      date: new Date().toISOString().slice(0, 10),
      count,
      seconds,
      bonusSeconds,
      remainingBalanceSeconds: summary.remainingSeconds,
      ...quota,
    });
  } catch {
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── POST /voice/usage ──
router.post('/voice/usage', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const durationRaw = Number(req.body?.durationSec);
    if (!Number.isFinite(durationRaw) || durationRaw <= 0) {
      return res.status(400).send({ message: 'Duration required.' });
    }
    const durationSec = Math.ceil(durationRaw);
    const startedAtRaw = req.body?.startedAt;
    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date();
    const sessionId = safeString(req.body?.sessionId || '') || null;
    const source = safeString(req.body?.source || '');

    const started = await startVoiceSession({
      studentId,
      chatSessionId: sessionId,
      metadata: { source: source || 'legacy-usage', startedAt: Number.isNaN(startedAt.getTime()) ? new Date().toISOString() : startedAt.toISOString() }
    });

    if (!started.allowed || !started.sessionUsageId) {
      return res.status(429).send({ message: "You've used today's voice time. Try again tomorrow." });
    }

    const stopped = await stopVoiceSession({
      studentId,
      sessionUsageId: started.sessionUsageId,
      stopReason: 'user_stop',
      listeningSecondsUsed: durationSec,
      ttsSecondsUsed: 0,
      metadata: { source: source || 'legacy-usage' }
    });

    res.status(200).send({ ok: true, recordId: stopped.sessionUsageId, billedSeconds: stopped.billedSeconds, remainingSeconds: stopped.remainingSeconds });
  } catch {
    res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;
