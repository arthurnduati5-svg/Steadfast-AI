import { Request, Response, Router } from 'express';
import { requireRole, resolveRequestRole } from '../lib/rbac';
import { logger } from '../utils/logger';
import {
  acknowledgeLatencyAlert,
  getLatencyDashboard,
  listLatencyAlerts,
  recordTurnLatency,
} from '../services/latencyService';

type AuthedRequest = Request & { user?: { id?: string; role?: string } };

const router = Router();

const safeString = (value: unknown, maxLen = 128) => String(value || '').trim().slice(0, maxLen);

router.post('/turn', async (req: AuthedRequest, res: Response) => {
  try {
    const role = resolveRequestRole(req as any);
    const bodyStudentId = safeString(req.body?.studentId);
    const studentId = role === 'admin' && bodyStudentId ? bodyStudentId : safeString(req.user?.id);

    if (!studentId) {
      return res.status(400).send({ message: 'studentId is required.' });
    }

    const result = await recordTurnLatency({
      studentId,
      sessionId: safeString(req.body?.sessionId),
      turnId: safeString(req.body?.turnId),
      responseMode: safeString(req.body?.responseMode, 64),
      route: safeString(req.body?.route, 64),
      forceWebSearch: Boolean(req.body?.forceWebSearch),
      languageMode: safeString(req.body?.languageMode, 64),
      source: safeString(req.body?.source, 64),
      sttMs: req.body?.sttMs,
      sttFirstTokenMs: req.body?.sttFirstTokenMs,
      firstTokenMs: req.body?.firstTokenMs,
      tutorLatencyMs: req.body?.tutorLatencyMs,
      doneMs: req.body?.doneMs,
      totalMs: req.body?.totalMs,
      ttsStartMs: req.body?.ttsStartMs,
      ttsFirstByteMs: req.body?.ttsFirstByteMs,
      aiMs: req.body?.aiMs,
      inputChars: req.body?.inputChars,
      outputChars: req.body?.outputChars,
      metadata: (req.body?.metadata || null) as Record<string, unknown> | null,
    });

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error) }, '[LatencyAPI] POST /turn failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/dashboard', async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin']);
    if (!viewerRole) return;

    const result = await getLatencyDashboard({
      studentId: safeString(req.query.studentId),
      responseMode: safeString(req.query.responseMode, 64),
      route: safeString(req.query.route, 64),
      hours: Number(req.query.hours || 24),
      limit: Number(req.query.limit || 500),
    });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error) }, '[LatencyAPI] GET /dashboard failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/alerts', async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin']);
    if (!viewerRole) return;

    const acknowledgedRaw = String(req.query.acknowledged || '').trim().toLowerCase();
    const acknowledged =
      acknowledgedRaw === 'true' ? true : acknowledgedRaw === 'false' ? false : undefined;
    const severityRaw = safeString(req.query.severity, 16).toLowerCase();
    const severity = severityRaw === 'warn' || severityRaw === 'critical' ? severityRaw : undefined;

    const result = await listLatencyAlerts({
      hours: Number(req.query.hours || 24),
      limit: Number(req.query.limit || 200),
      acknowledged,
      severity,
    });

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error) }, '[LatencyAPI] GET /alerts failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/alerts/:id/ack', async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin']);
    if (!viewerRole) return;

    const alertId = safeString(req.params.id);
    if (!alertId) return res.status(400).send({ message: 'Alert id is required.' });

    const result = await acknowledgeLatencyAlert(alertId, safeString(req.user?.id));
    if (!result.updated) {
      return res.status(404).send({ message: result.reason || 'Alert not found.' });
    }

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), alertId: req.params.id }, '[LatencyAPI] PATCH /alerts/:id/ack failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;
