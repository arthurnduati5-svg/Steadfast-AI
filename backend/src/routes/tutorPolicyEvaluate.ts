import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import { evaluateTutorTurnPolicy } from '../services/tutorTurnPolicy';

const router = Router();

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

router.post('/policy/evaluate', async (req: AuthedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const { tutorSessionId, messageText, clientContext } = req.body || {};
    const studentId = user.id;

    if (!tutorSessionId) {
      sendError(res, 400, 'MISSING_SESSION', 'tutorSessionId is required.');
      return;
    }
    if (!messageText || String(messageText).trim().length === 0) {
      sendError(res, 400, 'MISSING_MESSAGE', 'messageText is required.');
      return;
    }

    const policyPacket = await evaluateTutorTurnPolicy({
      requestId: `pol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      schoolId: (user as any).schoolId || '',
      tutorLearnerId: studentId,
      tutorSessionId,
      messageText: String(messageText).trim(),
      learnerGrade: (user as any).grade,
      learnerAge: (user as any).age,
      preferredLanguage: (user as any).preferredLanguage,
      clientContext: clientContext ? {
        displayMode: clientContext.displayMode,
        activeSchoolPage: clientContext.activeSchoolPage,
        subjectHint: clientContext.subjectHint,
        topicHint: clientContext.topicHint,
      } : undefined,
    });

    res.json({
      ok: true,
      policy: policyPacket,
    });
  } catch (error: any) {
    sendError(res, 500, 'INTERNAL_ERROR', 'An internal error occurred while evaluating policy.');
  }
});

export default router;
