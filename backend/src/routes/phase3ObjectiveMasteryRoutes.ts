import { Router, Request, Response } from 'express';
import { phase3ObjectiveRepository } from '../services/phase3ObjectiveRepository';
import { phase3ObjectiveEvidenceBridgeService } from '../services/phase3ObjectiveEvidenceBridgeService';
import { phase3ObjectiveMasteryService } from '../services/phase3ObjectiveMasteryService';
import { phase3ObjectiveCheckBlueprintService } from '../services/phase3ObjectiveCheckBlueprintService';
import { phase3TeacherObjectiveProgressService } from '../services/phase3TeacherObjectiveProgressService';
import { phase3LearnerObjectiveProgressService } from '../services/phase3LearnerObjectiveProgressService';
import { phase3DailyObjectiveSeedService } from '../services/phase3DailyObjectiveSeedService';
import { phase3ObjectiveAuditService } from '../services/phase3ObjectiveAuditService';
import {
  validateObjectiveCreateInput,
  validateObjectiveUpdateInput,
  validateObjectiveCheckBlueprintRequest,
  validateObjectiveEvidenceBridgeInput,
  validateTeacherObjectiveProgressQuery,
  validateLearnerObjectiveProgressQuery,
  rejectForbiddenObjectivePayloadFields,
} from '../lib/phase3ObjectiveMasteryValidation';
import type {
  Phase3ObjectiveSuccessCriterion,
  Phase3SourceTruthStatus,
} from '../contracts/phase3ObjectiveMasteryContracts';

const router = Router();

function safeMeta(req: Request) {
  return {
    requestId: (req as any).requestId || 'unknown',
    schoolId: req.schoolId || (req as any).verifiedSchoolIdentity?.schoolId || 'unknown',
    sourceTruthStatus: 'approved',
    safeEvidenceRefs: [],
  };
}

function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  return res.json({ ok: true, data, meta: meta || {} });
}

function fail(res: Response, code: string, message: string, safeReasonCodes: string[], status = 400) {
  return res.status(status).json({
    ok: false,
    error: { code, message, safeReasonCodes },
  });
}

function getRole(req: Request): string {
  return (req as any).verifiedSchoolIdentity?.role || (req as any).user?.role || 'unknown';
}

function getUserId(req: Request): string {
  return (req as any).verifiedSchoolIdentity?.externalUserId || (req as any).user?.id || '';
}

function getSchoolId(req: Request): string {
  return req.schoolId || (req as any).verifiedSchoolIdentity?.schoolId || '';
}

function getClassId(req: Request): string | undefined {
  return (req.query.classId as string) || (req.body?.classId as string) || undefined;
}

// ── Teacher/Admin Objective Routes ──

router.post('/', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can create objectives.', ['insufficient_role'], 403);
  }

  const forbiddenErrors = rejectForbiddenObjectivePayloadFields(req.body || {});
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  const validation = validateObjectiveCreateInput({ ...req.body, schoolId });
  if (!validation.ok) {
    return fail(res, 'PHASE3_OBJECTIVE_VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  const body = req.body as Record<string, any>;

  const successCriteria: Phase3ObjectiveSuccessCriterion[] = (body.successCriteria || []).map((c: any, i: number) => ({
    criterionId: `sc_${Date.now().toString(36)}_${i}`,
    description: c.description || '',
    measurableIndicator: c.measurableIndicator || '',
    successThreshold: c.successThreshold,
    orderIndex: i,
  }));

  const obj = phase3ObjectiveRepository.createObjective({
    schoolId,
    classId: body.classId,
    subjectId: body.subjectId,
    topicId: body.topicId,
    skillId: body.skillId,
    teacherId: role === 'teacher' ? userId : body.teacherId || userId,
    creatorId: userId,
    creatorRole: role,
    objectiveType: body.objectiveType,
    difficultyBucket: body.difficultyBucket || 'core',
    title: body.title,
    safeDescription: body.safeDescription || body.title,
    successCriteria,
    sourceTruthStatus: { status: body.sourceTruthStatus || 'unknown' },
    estimatedMinutes: body.estimatedMinutes || 15,
  });

  phase3ObjectiveAuditService.recordObjectiveCreated(schoolId, userId, role, obj.objectiveId, obj.classId, obj.subjectId, obj.topicId, obj.skillId);

  return ok(res, obj, safeMeta(req));
});

router.get('/', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const classId = getClassId(req);
  const teacherId = req.query.teacherId as string;
  let objectives;

  if (teacherId) {
    objectives = phase3ObjectiveRepository.listObjectivesByTeacher(schoolId, teacherId);
  } else if (classId) {
    objectives = phase3ObjectiveRepository.listObjectivesByClass(schoolId, classId);
  } else {
    objectives = phase3ObjectiveRepository.listObjectivesBySchool(schoolId);
  }

  return ok(res, { objectives, count: objectives.length }, safeMeta(req));
});

router.get('/:objectiveId', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const obj = phase3ObjectiveRepository.getObjectiveById(req.params.objectiveId);
  if (!obj) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found.', ['objective_not_found'], 404);
  }
  if (obj.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  return ok(res, obj, safeMeta(req));
});

router.patch('/:objectiveId', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can update objectives.', ['insufficient_role'], 403);
  }

  const forbiddenErrors = rejectForbiddenObjectivePayloadFields(req.body || {});
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  const validation = validateObjectiveUpdateInput({ ...req.body, schoolId });
  if (!validation.ok) {
    return fail(res, 'PHASE3_OBJECTIVE_VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  const existing = phase3ObjectiveRepository.getObjectiveById(req.params.objectiveId);
  if (!existing) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found.', ['objective_not_found'], 404);
  }
  if (existing.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  const body = req.body as Record<string, any>;
  const updated = phase3ObjectiveRepository.updateObjective(req.params.objectiveId, {
    title: body.title,
    safeDescription: body.safeDescription,
    difficultyBucket: body.difficultyBucket,
    estimatedMinutes: body.estimatedMinutes,
  } as any);

  if (updated) {
    phase3ObjectiveAuditService.recordObjectiveUpdated(schoolId, userId, role, req.params.objectiveId);
  }

  return ok(res, updated, safeMeta(req));
});

router.post('/:objectiveId/archive', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can archive objectives.', ['insufficient_role'], 403);
  }

  const existing = phase3ObjectiveRepository.getObjectiveById(req.params.objectiveId);
  if (!existing) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found.', ['objective_not_found'], 404);
  }
  if (existing.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  const archived = phase3ObjectiveRepository.archiveObjective(req.params.objectiveId);
  if (archived) {
    phase3ObjectiveAuditService.recordObjectiveArchived(schoolId, userId, role, req.params.objectiveId);
  }

  return ok(res, archived, safeMeta(req));
});

router.post('/:objectiveId/check-blueprint', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can create check blueprints.', ['insufficient_role'], 403);
  }

  const validation = validateObjectiveCheckBlueprintRequest({ objectiveId: req.params.objectiveId, schoolId });
  if (!validation.ok) {
    return fail(res, 'VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  const existing = phase3ObjectiveRepository.getObjectiveById(req.params.objectiveId);
  if (!existing) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found.', ['objective_not_found'], 404);
  }
  if (existing.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  const blueprint = phase3ObjectiveCheckBlueprintService.createObjectiveCheckBlueprint(req.params.objectiveId, schoolId, role);
  if ('error' in blueprint) {
    return fail(res, 'BLUEPRINT_FAILED', blueprint.error, ['blueprint_creation_failed'], 400);
  }

  phase3ObjectiveAuditService.recordObjectiveCheckBlueprintCreated(schoolId, userId, role, req.params.objectiveId);

  return ok(res, blueprint, safeMeta(req));
});

router.get('/:objectiveId/check-blueprint', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const blueprint = phase3ObjectiveCheckBlueprintService.getObjectiveCheckBlueprint(req.params.objectiveId);
  if (!blueprint) {
    return fail(res, 'BLUEPRINT_NOT_FOUND', 'No check blueprint found for this objective.', ['blueprint_not_found'], 404);
  }
  if (blueprint.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  return ok(res, blueprint, safeMeta(req));
});

router.get('/teacher/progress', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can view teacher progress.', ['insufficient_role'], 403);
  }

  const teacherId = (req.query.teacherId as string) || userId;
  const classId = getClassId(req);

  const validation = validateTeacherObjectiveProgressQuery({ schoolId, teacherId });
  if (!validation.ok) {
    return fail(res, 'VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  let view;
  if (classId) {
    view = phase3TeacherObjectiveProgressService.getClassObjectiveProgress(schoolId, classId);
  } else {
    view = phase3TeacherObjectiveProgressService.getTeacherObjectiveProgressView(schoolId, teacherId);
  }

  phase3ObjectiveAuditService.recordTeacherObjectiveProgressViewed(schoolId, userId, role);

  return ok(res, view, safeMeta(req));
});

// ── Learner Objective Routes ──

router.get('/learner/progress', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const learnerId = (req.query.learnerId as string) || userId;
  const classId = getClassId(req);

  if (role === 'student' && learnerId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only view their own progress.', ['cross_learner_denied'], 403);
  }

  const validation = validateLearnerObjectiveProgressQuery({ schoolId, learnerId });
  if (!validation.ok) {
    return fail(res, 'VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  const view = phase3LearnerObjectiveProgressService.getLearnerObjectiveProgressView(schoolId, learnerId, classId);

  phase3ObjectiveAuditService.recordLearnerObjectiveProgressViewed(schoolId, userId, role, learnerId);

  return ok(res, view, safeMeta(req));
});

router.get('/learner/progress/:objectiveId', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const learnerId = (req.query.learnerId as string) || userId;

  if (role === 'student' && learnerId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only view their own progress.', ['cross_learner_denied'], 403);
  }

  const card = phase3LearnerObjectiveProgressService.getLearnerObjectiveProgressCard(schoolId, learnerId, req.params.objectiveId);
  if (!card) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found for this learner.', ['objective_not_found'], 404);
  }

  return ok(res, card, safeMeta(req));
});

router.get('/learner/daily-seeds', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const studentId = (req.query.studentId as string) || userId;

  if (role === 'student' && studentId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only view their own seeds.', ['cross_learner_denied'], 403);
  }

  const seeds = phase3LearnerObjectiveProgressService.getLearnerObjectiveDailySeeds(schoolId, studentId);
  return ok(res, { seeds, count: seeds.length }, safeMeta(req));
});

router.post('/learner/daily-seeds/:seedId/complete', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const seed = phase3DailyObjectiveSeedService.markDailyObjectiveSeedCompleted(req.params.seedId);
  if (!seed) {
    return fail(res, 'SEED_NOT_FOUND', 'Daily objective seed not found.', ['seed_not_found'], 404);
  }
  if (seed.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }
  if (role === 'student' && seed.studentId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only complete their own seeds.', ['cross_learner_denied'], 403);
  }

  return ok(res, seed, safeMeta(req));
});

// ── Objective Evidence Bridge Route ──

router.post('/:objectiveId/evidence', (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;

  const validation = validateObjectiveEvidenceBridgeInput({
    objectiveId: req.params.objectiveId,
    schoolId,
    learnerId: body.learnerId || userId,
    safeEvidenceRef: body.safeEvidenceRef,
    evidenceType: body.evidenceType,
    antiCheatLabels: body.antiCheatLabels,
    idempotencyKey: body.idempotencyKey,
  });
  if (!validation.ok) {
    return fail(res, 'EVIDENCE_VALIDATION_FAILED', validation.errors[0]?.message || 'Validation failed.', validation.errors[0]?.safeReasonCodes || [], 400);
  }

  const existing = phase3ObjectiveRepository.getObjectiveById(req.params.objectiveId);
  if (!existing) {
    return fail(res, 'OBJECTIVE_NOT_FOUND', 'Objective not found.', ['objective_not_found'], 404);
  }
  if (existing.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  const result = phase3ObjectiveEvidenceBridgeService.linkSafeEvidenceToObjective({
    objectiveId: req.params.objectiveId,
    schoolId,
    learnerId: body.learnerId || userId,
    classId: body.classId || existing.classId,
    subjectId: body.subjectId || existing.subjectId,
    topicId: body.topicId || existing.topicId,
    skillId: body.skillId || existing.skillId,
    modeSessionId: body.modeSessionId,
    evidenceType: body.evidenceType || 'unknown',
    evidenceStrength: body.evidenceStrength || 'weak',
    sourceMode: body.sourceMode || 'unknown',
    safeEvidenceRef: body.safeEvidenceRef || '',
    signalBuckets: body.signalBuckets || {},
    antiCheatLabels: body.antiCheatLabels,
    confidenceLabel: body.confidenceLabel,
    attemptNumber: body.attemptNumber,
    hintUsed: body.hintUsed === true,
    timeSpentBucket: body.timeSpentBucket,
    reasonCodes: body.reasonCodes || [],
    idempotencyKey: body.idempotencyKey || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });

  return ok(res, result, safeMeta(req));
});

export default router;
