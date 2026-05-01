import { Prisma } from '@prisma/client';
import { Request, Response, Router } from 'express';
import {
  applyVoicePaymentGrant,
  authorizeVoiceSession,
  getVoiceBalanceSummary,
  startVoiceSession,
  stopVoiceSession
} from '../services/voiceLedgerService';
import { requireRole } from '../lib/rbac';
import { logger } from '../utils/logger';

type AuthedRequest = Request & { user?: { id?: string; role?: string } };

const router = Router();

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const intValue = Math.floor(parsed);
  return intValue > 0 ? intValue : null;
};

const parseOptionalDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveStudentId = (req: AuthedRequest, explicitStudentId?: unknown): string => {
  const fromBody = typeof explicitStudentId === 'string' ? explicitStudentId.trim() : '';
  if (fromBody) return fromBody;
  const fromUser = req.user?.id?.trim();
  if (!fromUser) throw new Error('studentId is required.');
  return fromUser;
};

router.post('/admin/grants/apply', async (req: AuthedRequest, res: Response) => {
  const role = requireRole(req as Request & { user?: { id?: string; role?: string } }, res, ['admin']);
  if (!role) return;

  try {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : '';
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required.' });
    }

    const minutesPurchased = parsePositiveInt(req.body?.minutesPurchased);
    if (!minutesPurchased) {
      return res.status(400).json({ message: 'minutesPurchased must be a positive integer.' });
    }

    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : '';
    const paymentReference = typeof req.body?.paymentReference === 'string' ? req.body.paymentReference.trim() : '';
    if (!provider) {
      return res.status(400).json({ message: 'provider is required.' });
    }
    if (!paymentReference) {
      return res.status(400).json({ message: 'paymentReference is required.' });
    }

    const appliedGrant = await applyVoicePaymentGrant({
      studentId,
      minutesPurchased,
      provider,
      paymentReference,
      expiresAt: parseOptionalDate(req.body?.expiresAt),
      metadata: req.body?.metadata
    });

    return res.status(200).json({
      ok: true,
      studentId,
      applied: appliedGrant.applied,
      alreadyExists: appliedGrant.alreadyExists,
      grantId: appliedGrant.grantId,
      secondsGranted: appliedGrant.secondsGranted,
      remainingSeconds: appliedGrant.remainingSeconds,
      remainingMinutesRoundedDown: appliedGrant.remainingMinutesRoundedDown,
      display: appliedGrant.display
    });
  } catch (error: any) {
    logger.error({ error: String(error) }, '[VOICE] payment grant apply failed');
    return res.status(500).json({ message: error?.message || 'Failed to apply payment grant.' });
  }
});

router.get('/balance', async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = resolveStudentId(req, req.query?.studentId);
    const summary = await getVoiceBalanceSummary(studentId);
    return res.status(200).json(summary);
  } catch (error: any) {
    logger.error({ error: String(error) }, '[VOICE] balance failed');
    return res.status(500).json({ message: error?.message || 'Failed to fetch voice balance.' });
  }
});

router.post('/session/start', async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = resolveStudentId(req, req.body?.studentId);
    const chatSessionIdRaw = typeof req.body?.chatSessionId === 'string' ? req.body.chatSessionId.trim() : '';
    const metadata = (req.body?.metadata ?? undefined) as Prisma.InputJsonValue | undefined;

    const result = await startVoiceSession({
      studentId,
      chatSessionId: chatSessionIdRaw || null,
      metadata
    });

    if (!result.allowed) {
      return res.status(402).json({
        allowed: false,
        reason: 'time_exhausted',
        remainingSeconds: 0,
        message: 'Voice time finished'
      });
    }

    return res.status(200).json({
      allowed: true,
      sessionUsageId: result.sessionUsageId,
      mode: result.mode,
      remainingSeconds: result.remainingSeconds
    });
  } catch (error: any) {
    logger.error({ error: String(error) }, '[VOICE] session/start failed');
    return res.status(500).json({ message: error?.message || 'Failed to start voice session.' });
  }
});

router.post('/session/authorize', async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = resolveStudentId(req, req.body?.studentId);
    const sessionUsageId = typeof req.body?.sessionUsageId === 'string' ? req.body.sessionUsageId.trim() : '';
    if (!sessionUsageId) {
      return res.status(400).json({ message: 'sessionUsageId is required.' });
    }

    const result = await authorizeVoiceSession({ studentId, sessionUsageId });
    if (!result.allowed) {
      const status =
        result.reason === 'time_exhausted'
          ? 402
          : result.reason === 'session_not_found'
            ? 404
            : 409;
      return res.status(status).json({
        allowed: false,
        sessionUsageId: result.sessionUsageId,
        remainingSeconds: result.remainingSeconds,
        reason: result.reason,
        message:
          result.reason === 'time_exhausted'
            ? 'Voice time finished'
            : 'Voice session is not active.'
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ error: String(error) }, '[VOICE] session/authorize failed');
    return res.status(500).json({ message: error?.message || 'Failed to authorize voice session.' });
  }
});

router.post('/session/stop', async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = resolveStudentId(req, req.body?.studentId);
    const sessionUsageId = typeof req.body?.sessionUsageId === 'string' ? req.body.sessionUsageId.trim() : '';
    if (!sessionUsageId) {
      return res.status(400).json({ message: 'sessionUsageId is required.' });
    }

    const result = await stopVoiceSession({
      studentId,
      sessionUsageId,
      stopReason: req.body?.stopReason,
      listeningSecondsUsed: req.body?.listeningSecondsUsed,
      ttsSecondsUsed: req.body?.ttsSecondsUsed,
      metadata: (req.body?.metadata ?? undefined) as Prisma.InputJsonValue | undefined
    });

    return res.status(200).json({
      sessionUsageId: result.sessionUsageId,
      billedSeconds: result.billedSeconds,
      remainingSeconds: result.remainingSeconds,
      reason: result.timeExhausted ? 'time_exhausted' : result.stopReason,
      mode: result.mode
    });
  } catch (error: any) {
    const message = String(error?.message || error);
    if (message.toLowerCase().includes('not found')) {
      return res.status(404).json({ message: 'Voice session not found.' });
    }
    logger.error({ error: message }, '[VOICE] session/stop failed');
    return res.status(500).json({ message: error?.message || 'Failed to stop voice session.' });
  }
});

export default router;
