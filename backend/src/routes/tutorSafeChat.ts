import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import { orchestrateTutorTurn } from '../services/tutorOrchestration/tutorTurnOrchestrationEngine';
import { logger } from '../utils/logger';

const router = Router();

function sendError(res: Response, status: number, code: string, message: string, requestId?: string) {
  res.status(status).json({
    ok: false,
    error: { code, message, ...(requestId ? { requestId } : {}) },
  });
}

router.post('/tutor/messages', async (req: AuthedRequest, res: Response) => {
  const requestId = `tmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const user = req.user;
    if (!user) {
      sendError(res, 401, 'invalid_auth', 'Authentication required.', requestId);
      return;
    }

    const { tutorSessionId, messageText, clientContext } = req.body || {};
    const studentId = user.id;

    if (!tutorSessionId) {
      sendError(res, 400, 'invalid_input', 'tutorSessionId is required.', requestId);
      return;
    }

    if (!messageText || String(messageText).trim().length === 0) {
      sendError(res, 400, 'invalid_input', 'messageText is required.', requestId);
      return;
    }

    if (String(messageText).length > 10000) {
      sendError(res, 400, 'invalid_input', 'Message too long.', requestId);
      return;
    }

    const displayMode = clientContext?.displayMode === 'fullscreen' ? 'fullscreen' : 'widget';

    const result = await orchestrateTutorTurn({
      requestId,
      schoolId: (user as any).schoolId || '',
      tutorLearnerId: studentId,
      tutorSessionId,
      messageText: String(messageText).trim(),
      learnerGrade: (user as any).grade,
      learnerAge: (user as any).age,
      preferredLanguage: (user as any).preferredLanguage,
      clientContext: clientContext ? {
        displayMode: displayMode as 'widget' | 'fullscreen',
        activeSchoolPage: clientContext.activeSchoolPage,
        subjectHint: clientContext.subjectHint,
        topicHint: clientContext.topicHint,
      } : undefined,
    });

    res.json({
      ok: true,
      response: {
        text: result.responseText,
        responseMove: result.responseMove,
        state: {
          initialState: result.state.initialState,
          finalState: result.state.finalState,
        },
        intent: result.intent,
        hint: result.hint || undefined,
        stepCheck: result.stepCheck || undefined,
        attemptFeedback: result.attemptFeedback || undefined,
        practiceQuestion: result.practiceQuestion || undefined,
        mistakeAnalysis: result.mistakeAnalysis || undefined,
        subjectValidation: result.subjectValidation || undefined,
        evidenceWrite: result.evidenceWrite || undefined,
        revisionUpdate: result.revisionUpdate || undefined,
        clientSafeMetadata: result.clientSafeMetadata,
      },
      session: {
        tutorSessionId,
        displayMode,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ requestId, error: errorMessage }, 'Tutor turn orchestration route error');
    sendError(res, 500, 'internal_error', 'An internal error occurred.', requestId);
  }
});

export default router;
