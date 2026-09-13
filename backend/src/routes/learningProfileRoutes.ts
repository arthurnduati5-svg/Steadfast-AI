import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { getStudentLearningProfile, refreshStudentLearningProfile, getStudentProfileForStudentView, getStudentProfileForTeacherView, getStudentProfileForAdminView, getMasteryPathway, getWeakTopics, getAcademicMemory } from '../services/studentLearningProfileService';
import { resolveProfileAccess } from '../services/learningProfileAccessPolicy';
import { rejectRawProfileInput } from '../services/learningProfilePrivacyGuard';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import { LearningProfileRefreshSchema, LearningProfileQuerySchema, MasteryPathwayQuerySchema, WeakTopicsQuerySchema, AcademicMemoryQuerySchema } from '../lib/studentLearningProfileValidation';
import type { AccessRequest } from '../services/learningProfileAccessPolicy';

const router = Router();

function buildMeta(req: Request) {
  return {
    requestId: (req as any).requestId || 'unknown',
    timestamp: new Date().toISOString(),
    route: req.originalUrl || req.url,
    method: req.method,
    contractVersion: '1.0.0',
  };
}

function getStudentIdFromIdentity(req: Request): string | null {
  const identity = (req as any).verifiedSchoolIdentity;
  if (!identity) return null;
  return identity.externalStudentId || identity.externalUserId || null;
}

// ── GET /api/copilot/learning-profile ──
router.get('/copilot/learning-profile', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentIdFromIdentity(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const profile = await getStudentProfileForStudentView(identity.schoolId, studentId);
    res.json(createApiSuccess({ data: { profile }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get learning profile', meta));
  }
});

// ── POST /api/copilot/learning-profile/refresh ──
router.post('/copilot/learning-profile/refresh', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentIdFromIdentity(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const keyCheck = rejectRawProfileInput(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    const parsed = LearningProfileRefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const profile = await refreshStudentLearningProfile(
      identity.schoolId,
      studentId,
      parsed.data.subjectId,
      parsed.data.topicId,
      parsed.data.forceRecompute,
    );

    res.json(createApiSuccess({ data: { profile }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to refresh learning profile', meta));
  }
});

// ── GET /api/copilot/learning-profile/:studentId (teacher/admin route) ──
router.get('/copilot/learning-profile/:studentId', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const targetStudentId = req.params.studentId;
    const actorId = (req as any).userId || identity.externalUserId || '';
    const actorRole = identity.role || 'student';

    // Resolve access
    const accessRequest: AccessRequest = {
      actorId,
      actorSchoolId: identity.schoolId,
      actorRole,
      targetStudentId,
      targetSchoolId: identity.schoolId,
    };

    const access = resolveProfileAccess(accessRequest);
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    let profile;
    if (actorRole === 'student') {
      profile = await getStudentProfileForStudentView(identity.schoolId, targetStudentId);
    } else if (actorRole === 'teacher') {
      profile = await getStudentProfileForTeacherView(identity.schoolId, targetStudentId);
    } else {
      profile = await getStudentProfileForAdminView(identity.schoolId, targetStudentId);
    }

    res.json(createApiSuccess({ data: { profile }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get student profile', meta));
  }
});

// ── GET /api/copilot/mastery-pathway ──
router.get('/copilot/mastery-pathway', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentIdFromIdentity(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const parsed = MasteryPathwayQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const pathway = await getMasteryPathway(identity.schoolId, studentId, parsed.data.subjectId);
    res.json(createApiSuccess({ data: pathway, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get mastery pathway', meta));
  }
});

// ── GET /api/copilot/weak-topics ──
router.get('/copilot/weak-topics', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentIdFromIdentity(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const parsed = WeakTopicsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const weakTopics = await getWeakTopics(identity.schoolId, studentId, parsed.data.subjectId);
    res.json(createApiSuccess({ data: { weakTopics }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get weak topics', meta));
  }
});

// ── GET /api/copilot/academic-memory ──
router.get('/copilot/academic-memory', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentIdFromIdentity(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const parsed = AcademicMemoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const academicMemory = await getAcademicMemory(identity.schoolId, studentId);
    res.json(createApiSuccess({ data: academicMemory, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get academic memory', meta));
  }
});

export default router;
