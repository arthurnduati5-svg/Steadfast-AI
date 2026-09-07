// ─────────────────────────────────────────────────────────────
// Steadfast AI — R6 Study Plan Routes (real, tracked implementation)
// Mounted at /api/phase3/study-plans by src/index.ts.
//
// R6 rules:
//  - Delegates to the live studySupportService (StudyPlan / StudyGoal owners).
//  - Academic priorities come from canonical learning intelligence, never from
//    self-reported weakAreas as academic truth.
//  - StudyGoal completion means "plan step completed" only — it never mutates
//    canonical Mastery.
//  - Identity comes from middleware; body userId/schoolId are never trusted.
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanDetails,
  getStudyGoals,
  updateStudyGoal,
  updateStudyPlan,
  setStudyPlanLifecycle,
  createStudyPlanGoal,
  completeStudyGoal,
  generateAdaptiveStudyPlan,
} from '../services/studySupportService';
import { getLearningIntelligenceSnapshot } from '../services/learningIntelligenceIntegrationService'; // tracked R6 read adapter
import { createApiSuccess, createApiError } from '../services/apiEnvelopeService';
import { buildApiResponseMeta } from '../services/apiMetadataService';

const router = Router();

type AuthedRequest = Request & {
  user?: { id: string; schoolId?: string; role?: string };
  requestId?: string;
};

function resolveIdentity(req: AuthedRequest): { userId: string; schoolId: string | null } | null {
  const userId = safeString(req.user?.id).trim();
  if (!userId) return null;
  return { userId, schoolId: safeString(req.user?.schoolId).trim() || null };
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function sendError(res: Response, req: AuthedRequest, route: string, status: number, code: string, message: string) {
  return res.status(status).json(
    createApiError(
      {
        code,
        message,
        status,
        type: `https://steadfast.ai/errors/${code.toLowerCase()}`,
        meta: buildApiResponseMeta({ route, method: req.method, requestId: req.requestId }),
      },
      status,
    ),
  );
}

// ── GET /api/phase3/study-plans ──
router.get('/', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const plans = await getStudyPlans(identity.userId);
    const goals = await getStudyGoals(identity.userId);
    return res.status(200).json(
      createApiSuccess({
        data: { plans, goals },
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans', method: 'GET', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans', 500, 'INTERNAL_ERROR', 'Failed to list study plans.');
  }
});

// ── GET /api/phase3/study-plans/priorities ──
// Canonical academic priorities for planning (read-only projection).
router.get('/priorities', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/priorities', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const subject = safeString(req.query.subject).trim() || null;
    const snapshot = await getLearningIntelligenceSnapshot({
      learnerId: identity.userId,
      schoolId: identity.schoolId,
      subject,
    });
    return res.status(200).json(
      createApiSuccess({
        data: {
          priorities: snapshot.priority,
          canonicalMasteryAvailable: snapshot.mastery.available,
          generatedAt: snapshot.generatedAt,
        },
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/priorities', method: 'GET', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/priorities', 500, 'INTERNAL_ERROR', 'Failed to resolve canonical priorities.');
  }
});

// ── GET /api/phase3/study-plans/:planId ──
router.get('/:planId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/:planId', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const details = await getStudyPlanDetails(identity.userId, safeString(req.params.planId));
    if (!details) return sendError(res, req, '/api/phase3/study-plans/:planId', 404, 'NOT_FOUND', 'Study plan not found.');
    return res.status(200).json(
      createApiSuccess({
        data: details,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/:planId', method: 'GET', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/:planId', 500, 'INTERNAL_ERROR', 'Failed to load study plan.');
  }
});

// ── POST /api/phase3/study-plans ──
router.post('/', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const scope = safeString(body.scope).trim() === 'exam' ? 'exam_focus' : 'weekly';
    const plan = await createStudyPlan({
      userId: identity.userId,
      scope,
      subject: safeString(body.subject).trim() || null,
      topic: safeString(body.topic).trim() || null,
      subjects: Array.isArray(body.subjects) ? body.subjects.map((s) => safeString(s)).filter(Boolean) : null,
      examFocus: body.examFocus === true,
    });
    return res.status(201).json(
      createApiSuccess({
        data: plan,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans', method: 'POST', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans', 500, 'INTERNAL_ERROR', 'Failed to create study plan.');
  }
});

// ── POST /api/phase3/study-plans/adaptive ──
// Canonical-priority-driven adaptive plan. weakAreas/strengths are treated as
// learner self-report and never override canonical contradictory evidence.
router.post('/adaptive', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/adaptive', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const scope = safeString(body.scope).trim() === 'exam' ? 'exam_focus' : safeString(body.scope).trim() === 'month' ? 'month' : 'weekly';
    const plan = await generateAdaptiveStudyPlan({
      userId: identity.userId,
      scope,
      subject: safeString(body.subject).trim() || null,
      gradeLevel: safeString(body.gradeLevel).trim() || null,
      goal: safeString(body.goal).trim() || null,
      availableMinutesPerDay: Number(body.availableMinutesPerDay) || null,
      examDate: safeString(body.examDate).trim() || null,
      strengths: Array.isArray(body.strengths) ? body.strengths.map((s) => safeString(s)).filter(Boolean) : null,
      weakAreas: Array.isArray(body.weakAreas) ? body.weakAreas.map((s) => safeString(s)).filter(Boolean) : null,
      preferredSupportStyle: safeString(body.preferredSupportStyle).trim() || null,
      topic: safeString(body.topic).trim() || null,
    });
    return res.status(201).json(
      createApiSuccess({
        data: plan,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/adaptive', method: 'POST', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/adaptive', 500, 'INTERNAL_ERROR', 'Failed to generate adaptive study plan.');
  }
});

// ── PATCH /api/phase3/study-plans/:planId ──
router.patch('/:planId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/:planId', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.title === 'string') patch.title = body.title;
    if (typeof body.summary === 'string') patch.summary = body.summary;
    if (typeof body.subject === 'string' || body.subject === null) patch.subject = body.subject ?? null;
    if (typeof body.topic === 'string' || body.topic === null) patch.topic = body.topic ?? null;
    if (Array.isArray(body.focusAreas)) patch.focusAreas = body.focusAreas.map((s) => safeString(s)).filter(Boolean);
    if (Array.isArray(body.recommendedBlocks)) patch.recommendedBlocks = body.recommendedBlocks.map((s) => safeString(s)).filter(Boolean);
    const result = await updateStudyPlan({
      userId: identity.userId,
      planId: safeString(req.params.planId),
      patch: patch as any,
    });
    if (!result) return sendError(res, req, '/api/phase3/study-plans/:planId', 404, 'NOT_FOUND', 'Study plan not found.');
    return res.status(200).json(
      createApiSuccess({
        data: result,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/:planId', method: 'PATCH', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/:planId', 500, 'INTERNAL_ERROR', 'Failed to update study plan.');
  }
});

// ── POST /api/phase3/study-plans/:planId/lifecycle ──
router.post('/:planId/lifecycle', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/:planId/lifecycle', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const status = safeString(body.status).trim();
    if (!['active', 'paused', 'completed'].includes(status)) {
      return sendError(res, req, '/api/phase3/study-plans/:planId/lifecycle', 400, 'VALIDATION_ERROR', 'status must be active, paused or completed.');
    }
    const result = await setStudyPlanLifecycle({
      userId: identity.userId,
      planId: safeString(req.params.planId),
      lifecycle: status as 'active' | 'paused' | 'completed',
    });
    if (!result) return sendError(res, req, '/api/phase3/study-plans/:planId/lifecycle', 404, 'NOT_FOUND', 'Study plan not found.');
    return res.status(200).json(
      createApiSuccess({
        data: result,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/:planId/lifecycle', method: 'POST', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/:planId/lifecycle', 500, 'INTERNAL_ERROR', 'Failed to update plan lifecycle.');
  }
});

// ── POST /api/phase3/study-plans/:planId/goals ──
router.post('/:planId/goals', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/:planId/goals', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const title = safeString(body.title).trim();
    if (!title) return sendError(res, req, '/api/phase3/study-plans/:planId/goals', 400, 'VALIDATION_ERROR', 'title is required.');
    const goalType = safeString(body.goalType).trim() || 'practise_topic';
    const goal = await createStudyPlanGoal({
      userId: identity.userId,
      planId: safeString(req.params.planId),
      title,
      description: safeString(body.description).trim() || null,
      goalType: goalType as any,
      targetCount: Number(body.targetCount) || null,
      subject: safeString(body.subject).trim() || null,
      topic: safeString(body.topic).trim() || null,
      dueAt: safeString(body.dueAt).trim() || null,
      metadata: (body.metadata as Record<string, unknown> | null) || null,
    });
    if (!goal) return sendError(res, req, '/api/phase3/study-plans/:planId/goals', 404, 'NOT_FOUND', 'Study plan not found.');
    return res.status(201).json(
      createApiSuccess({
        data: goal,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/:planId/goals', method: 'POST', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/:planId/goals', 500, 'INTERNAL_ERROR', 'Failed to create study goal.');
  }
});

// ── POST /api/phase3/study-plans/goals/:goalId/complete ──
// Plan-step completion only. Never mutates canonical Mastery.
router.post('/goals/:goalId/complete', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/goals/:goalId/complete', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const goal = await completeStudyGoal({
      userId: identity.userId,
      goalId: safeString(req.params.goalId),
      completionNote: safeString((req.body || {}).completionNote).trim() || null,
    });
    if (!goal) return sendError(res, req, '/api/phase3/study-plans/goals/:goalId/complete', 404, 'NOT_FOUND', 'Study goal not found.');
    return res.status(200).json(
      createApiSuccess({
        data: { goal, note: 'Plan step completed. This does not change canonical mastery.' },
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/goals/:goalId/complete', method: 'POST', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/goals/:goalId/complete', 500, 'INTERNAL_ERROR', 'Failed to complete study goal.');
  }
});

// ── PATCH /api/phase3/study-plans/goals/:goalId ──
router.patch('/goals/:goalId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const identity = resolveIdentity(req);
  if (!identity) return sendError(res, req, '/api/phase3/study-plans/goals/:goalId', 401, 'UNAUTHENTICATED', 'Authentication required.');
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const patch: { status?: string; currentCount?: number } = {};
    if (typeof body.status === 'string') patch.status = body.status;
    if (typeof body.currentCount === 'number') patch.currentCount = body.currentCount;
    const goal = await updateStudyGoal({
      userId: identity.userId,
      goalId: safeString(req.params.goalId),
      patch: patch as any,
    });
    if (!goal) return sendError(res, req, '/api/phase3/study-plans/goals/:goalId', 404, 'NOT_FOUND', 'Study goal not found.');
    return res.status(200).json(
      createApiSuccess({
        data: goal,
        meta: buildApiResponseMeta({ route: '/api/phase3/study-plans/goals/:goalId', method: 'PATCH', requestId: req.requestId }),
      }),
    );
  } catch (err) {
    return sendError(res, req, '/api/phase3/study-plans/goals/:goalId', 500, 'INTERNAL_ERROR', 'Failed to update study goal.');
  }
});

export default router;
