import { Request, Response, Router } from 'express';
import { requireRole, resolveRequestRole } from '../lib/rbac';
import { logger } from '../utils/logger';
import {
  getAbnormalBehaviorDashboard,
  recordAbnormalBehaviorTrace,
} from '../services/abnormalBehaviorService';

type AuthedRequest = Request & { user?: { id?: string; role?: string } };

const router = Router();

const safeText = (value: unknown, maxLen = 256) => String(value || '').trim().slice(0, maxLen);

router.post('/trace', async (req: AuthedRequest, res: Response) => {
  try {
    const role = resolveRequestRole(req as any);
    const bodyStudentId = safeText(req.body?.studentId, 128);
    const studentId = role === 'admin' && bodyStudentId ? bodyStudentId : safeText(req.user?.id, 128);
    const actorId = safeText(req.user?.id, 128);

    if (!actorId) return res.status(401).send({ message: 'Authentication required.' });
    if (!studentId) return res.status(400).send({ message: 'studentId is required.' });

    const category = safeText(req.body?.category, 64);
    const summary = safeText(req.body?.summary, 500);
    if (!category) return res.status(400).send({ message: 'category is required.' });
    if (!summary) return res.status(400).send({ message: 'summary is required.' });

    const result = await recordAbnormalBehaviorTrace({
      actorId,
      actorRole: role,
      studentId,
      category,
      severity: safeText(req.body?.severity, 16).toLowerCase() as 'info' | 'warn' | 'critical',
      sessionId: safeText(req.body?.sessionId, 128) || null,
      turnId: safeText(req.body?.turnId, 128) || null,
      route: safeText(req.body?.route, 64) || null,
      source: safeText(req.body?.source, 64) || null,
      summary,
      metadata: (req.body?.metadata || null) as Record<string, unknown> | null,
    });

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error) }, '[AnomaliesAPI] POST /trace failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/dashboard', async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin']);
    if (!viewerRole) return;

    const result = await getAbnormalBehaviorDashboard({
      studentId: safeText(req.query.studentId, 128),
      hours: Number(req.query.hours || 24),
      limit: Number(req.query.limit || 100),
    });

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error) }, '[AnomaliesAPI] GET /dashboard failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;
