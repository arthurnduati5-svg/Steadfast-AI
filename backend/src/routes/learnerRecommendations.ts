import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { learnerRecommendationTransparencyRuntime } from '../services/learnerRecommendationTransparencyRuntime';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

const router = Router();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

router.get('/recommendations/next', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const subject = req.query.subject as string | undefined;
    const topic = req.query.topic as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    const mode = req.query.mode as 'practice' | 'revision' | 'challenge' | 'continue' | undefined;

    const result = await learnerRecommendationTransparencyRuntime.getNextRecommendation(identity, {
      subject,
      topic,
      sessionId,
      mode,
    });

    res.json({
      ok: true,
      explanation: result.explanation,
      safety: result.safety,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/recommendations/:recommendationId/explanation', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { recommendationId } = req.params;

    const result = await learnerRecommendationTransparencyRuntime.getExplanationForRecommendation(
      identity,
      recommendationId,
    );

    if (!result.explanation) {
      return sendError(res, 404, 'not_found', 'Recommendation explanation not available');
    }

    res.json({
      ok: true,
      explanation: result.explanation,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/revision/:revisionItemId/why', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { revisionItemId } = req.params;

    const result = await learnerRecommendationTransparencyRuntime.getRevisionExplanation(
      identity,
      revisionItemId,
    );

    if (!result.explanation) {
      return sendError(res, 404, 'not_found', 'Revision explanation not available');
    }

    res.json({
      ok: true,
      explanation: result.explanation,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/progress/narrative', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const result = await learnerRecommendationTransparencyRuntime.getProgressNarrative(identity);

    res.json({
      ok: true,
      narratives: result.narratives,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/privacy/visibility', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const deenSensitive = req.query.deenSensitive === 'true';
    const visibility = await learnerRecommendationTransparencyRuntime.getPrivacyVisibility(
      identity,
      deenSensitive,
    );

    res.json({
      ok: true,
      visibility,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.post('/recommendations/preference', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { optionId, feedback, recommendationId } = req.body;

    if (!optionId || !feedback) {
      return sendError(res, 400, 'validation_error', 'optionId and feedback are required');
    }

    const result = await learnerRecommendationTransparencyRuntime.submitRecommendationPreference(
      identity,
      { optionId, feedback, recommendationId },
    );

    res.json({
      ok: result.ok,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

export default router;
