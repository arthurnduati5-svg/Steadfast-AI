/**
 * AI Route Module — Safety & Constitution
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 9299-9560.
 * Domain: safety
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { getProductConstitutionHealth } from '../../services/constitutionHealthService';
import { getFounderTruthSummary } from '../../services/founderTruthService';
import { detectSafetyRisk } from '../../services/safetyRiskService';
import { notifyCounselor } from '../../services/safetyNotifier';
import { requireRole } from '../../lib/rbac';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';

const router = Router();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ── GET /constitution-health ──
router.get('/constitution-health', schoolAuthMiddleware, requireRole('admin'), async (req: AuthedRequest, res) => {
  try {
    const targetUserId = safeString(req.query?.userId as string).trim() || req.user!.id;
    const windowDays = Math.min(180, Math.max(1, Number(req.query?.windowDays) || 30));
    const health = await getProductConstitutionHealth({ userId: targetUserId, days: windowDays });
    res.status(200).send(health);
  } catch (error) {
    logger.error({ err: error }, '[GET /constitution-health] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /founder-truth ──
router.get('/founder-truth', schoolAuthMiddleware, requireRole('admin'), async (req: AuthedRequest, res) => {
  try {
    const targetUserId = safeString(req.query?.userId as string).trim() || req.user!.id;
    const windowDays = Math.min(180, Math.max(1, Number(req.query?.windowDays) || 30));
    const truth = await getFounderTruthSummary({ userId: targetUserId, days: windowDays });
    res.status(200).send(truth);
  } catch (error) {
    logger.error({ err: error }, '[GET /founder-truth] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /safety/alerts ──
router.get('/safety/alerts', schoolAuthMiddleware, requireRole('admin', 'counselor'), async (req: AuthedRequest, res) => {
  try {
    const status = safeString(req.query?.status as string).trim() || undefined;
    const severity = safeString(req.query?.severity as string).trim() || undefined;
    const studentId = safeString(req.query?.studentId as string).trim() || undefined;
    const userRole = (req.user as any)?.role || 'student' as string;
    const isCounselor = userRole === 'counselor';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (isCounselor) {
      where.severity = { in: ['high', 'critical'] };
    } else if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.safetyAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    await prisma.safetyEventAudit.create({
      data: {
        actorId: req.user!.id,
        actorRole: userRole,
        action: 'safety.alerts.list',
        targetType: 'safety_alert',
        metadata: { filterStatus: status, filterSeverity: severity, resultCount: alerts.length },
      },
    });

    res.status(200).send(alerts);
  } catch (error) {
    logger.error({ err: error }, '[GET /safety/alerts] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /safety/alerts/:id ──
router.get('/safety/alerts/:id', schoolAuthMiddleware, requireRole('admin', 'counselor'), async (req: AuthedRequest, res) => {
  try {
    const alertId = safeString(req.params?.id).trim();
    const alert = await prisma.safetyAlert.findUnique({ where: { id: alertId } });
    if (!alert) return res.status(404).send({ message: 'Alert not found' });

    const userRole = (req.user as any)?.role || 'student';
    if (userRole === 'counselor' && !['high', 'critical'].includes(alert.severity)) {
      return res.status(403).send({ message: 'Access restricted' });
    }

    const contextMessages: unknown[] = [];
    if (alert.sessionId) {
      const targetMessageId = alert.messageId;
      const allMessages = await prisma.chatMessage.findMany({
        where: { sessionId: alert.sessionId },
        orderBy: { timestamp: 'asc' },
        take: 200,
      });
      const targetIdx = targetMessageId
        ? allMessages.findIndex((m) => m.id === targetMessageId)
        : allMessages.length - 1;
      const startIdx = Math.max(0, (targetIdx >= 0 ? targetIdx : allMessages.length - 1) - 10);
      const contextSlice = allMessages.slice(startIdx, startIdx + 20);
      contextMessages.push(
        ...contextSlice.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content?.slice(0, 500),
          createdAt: m.timestamp,
        }))
      );
    }

    await prisma.safetyEventAudit.create({
      data: {
        actorId: req.user!.id,
        actorRole: (req.user as any)?.role || 'unknown',
        action: 'safety.alerts.view',
        targetType: 'safety_alert',
        targetId: alertId,
        metadata: { alertId, alertSeverity: alert.severity },
      },
    });

    res.status(200).send({ ...alert, contextMessages });
  } catch (error) {
    logger.error({ err: error }, '[GET /safety/alerts/:id] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── PATCH /safety/alerts/:id/status ──
router.patch('/safety/alerts/:id/status', schoolAuthMiddleware, requireRole('admin', 'counselor'), async (req: AuthedRequest, res) => {
  try {
    const alertId = safeString(req.params?.id).trim();
    const { status, note } = req.body || {};
    const allowedStatuses = ['open', 'reviewing', 'resolved', 'dismissed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).send({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const updated = await prisma.safetyAlert.update({
      where: { id: alertId },
      data: {
        status,
        ...(note ? { metadata: { updatedBy: req.user!.id, note, updatedAt: new Date().toISOString() } } : {}),
      },
    });

    await prisma.safetyEventAudit.create({
      data: {
        actorId: req.user!.id,
        actorRole: (req.user as any)?.role || 'unknown',
        action: 'safety.alerts.updateStatus',
        targetType: 'safety_alert',
        targetId: alertId,
        metadata: { alertId, newStatus: status, previousStatus: updated.status },
      },
    });

    res.status(200).send(updated);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /safety/alerts/:id/status] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /safety/chats ──
router.get('/safety/chats', schoolAuthMiddleware, requireRole('admin'), async (req: AuthedRequest, res) => {
  try {
    const studentId = safeString(req.query?.studentId as string).trim();
    const sessionId = safeString(req.query?.sessionId as string).trim();
    const searchQuery = safeString(req.query?.q as string).trim();

    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: { orderBy: { timestamp: 'asc' } },
        },
      });
      if (!session) return res.status(404).send({ message: 'Session not found' });

      await prisma.safetyEventAudit.create({
        data: {
          actorId: req.user!.id,
          actorRole: (req.user as any)?.role || 'unknown',
          action: 'safety.chats.view',
          targetType: 'chat_session',
          targetId: sessionId,
          metadata: { sessionId, studentId: session.studentId },
        },
      });

      return res.status(200).send({ session, messages: session.messages });
    }

    if (searchQuery) {
      const messages = await prisma.chatMessage.findMany({
        where: {
          ...(studentId ? { chatSession: { studentId } } : {}),
          content: { contains: searchQuery, mode: 'insensitive' },
        },
        include: { chatSession: { select: { id: true, studentId: true, topic: true } } },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      await prisma.safetyEventAudit.create({
        data: {
          actorId: req.user!.id,
          actorRole: (req.user as any)?.role || 'unknown',
          action: 'safety.chats.search',
          targetType: 'chat_search',
          metadata: { searchQuery, studentId: studentId || null, resultCount: messages.length },
        },
      });

      return res.status(200).send({ messages });
    }

    const sessions = await prisma.chatSession.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        studentId: true,
        topic: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    res.status(200).send({ sessions });
  } catch (error) {
    logger.error({ err: error }, '[GET /safety/chats] Failed');
    res.status(500).send({ message: 'Internal server error' });
  }
});

export default router;
