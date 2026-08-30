import { Router, Request, Response } from 'express';
import { phase3DailyObjectiveCheckRepository } from '../services/phase3DailyObjectiveCheckRepository';
import { phase3DailyObjectiveCheckSessionService } from '../services/phase3DailyObjectiveCheckSessionService';
import { phase3DailyObjectiveConfidenceService } from '../services/phase3DailyObjectiveConfidenceService';
import { phase3DailyObjectiveCheckAttemptService } from '../services/phase3DailyObjectiveCheckAttemptService';
import { phase3DailyObjectiveCheckCompletionService } from '../services/phase3DailyObjectiveCheckCompletionService';
import { phase3DailyObjectiveCheckAuditService } from '../services/phase3DailyObjectiveCheckAuditService';
import { phase3DailyObjectiveTeacherSummaryService } from '../services/phase3DailyObjectiveTeacherSummaryService';
import { phase3DailyObjectiveLearnerResponseService } from '../services/phase3DailyObjectiveLearnerResponseService';
import {
  rejectForbiddenDailyObjectiveCheckPayloadFields,
} from '../lib/phase3DailyObjectiveCheckValidation';

const router = Router();

function safeMeta(req: Request) {
  return {
    requestId: (req as any).requestId || 'unknown',
    schoolId: (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId || 'unknown',
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
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId || '';
}

const IS_TEST = process.env.NODE_ENV === 'test';
function usePrisma(): boolean {
  return !IS_TEST || process.env.R4_USE_PRISMA === 'true';
}

// ── Learner Routes ──

router.post('/start', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(req.body || {});
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  const body = req.body as Record<string, any>;

  const learnerId = body.studentId || userId;
  if (role === 'student' && learnerId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only start their own checks.', ['cross_learner_denied'], 403);
  }

  const payload = {
    schoolId,
    studentId: learnerId,
    classId: body.classId,
    subjectId: body.subjectId || '',
    topicId: body.topicId,
    skillId: body.skillId,
    objectiveId: body.objectiveId,
    dailySeedId: body.dailySeedId,
    blueprintId: body.blueprintId,
    sourceTruthStatus: body.sourceTruthStatus || 'approved',
  };

  let result: any;
  if (usePrisma()) {
    result = await phase3DailyObjectiveCheckSessionService.startDailyObjectiveCheckSessionAsync(payload as any);
  } else {
    result = phase3DailyObjectiveCheckSessionService.startDailyObjectiveCheckSession(payload as any);
  }

  if (result.error) {
    return fail(res, 'SESSION_START_FAILED', result.error, ['session_start_failed'], 400);
  }

  return ok(res, {
    session: result.session,
    learnerResponse: result.learnerResponse,
  }, safeMeta(req));
});

router.get('/:checkSessionId', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  let session: any;
  if (usePrisma()) {
    try {
      session = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(req.params.checkSessionId);
    } catch (e: any) {
      return fail(res, 'PERSISTENCE_FAILED', e.message, ['persistence_failed'], 500);
    }
  } else {
    session = phase3DailyObjectiveCheckRepository.getCheckSessionById(req.params.checkSessionId);
  }
  if (!session) {
    return fail(res, 'SESSION_NOT_FOUND', 'Check session not found.', ['session_not_found'], 404);
  }
  if (session.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }
  if (role === 'student' && session.studentId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only view their own check sessions.', ['cross_learner_denied'], 403);
  }

  const learnerResponse = phase3DailyObjectiveLearnerResponseService.createSessionStartedResponse(session);

  return ok(res, { session, learnerResponse }, safeMeta(req));
});

router.post('/:checkSessionId/confidence-before', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;
  const learnerId = body.studentId || userId;

  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields({ ...body, checkSessionId: req.params.checkSessionId });
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  let result: any;
  if (usePrisma()) {
    result = await phase3DailyObjectiveConfidenceService.recordConfidenceBeforeAsync({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      confidenceLevel: body.confidenceLevel,
      checkpointType: 'before',
    });
  } else {
    result = phase3DailyObjectiveConfidenceService.recordConfidenceBefore({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      confidenceLevel: body.confidenceLevel,
      checkpointType: 'before',
    });
  }

  if (result.error) {
    return fail(res, 'CONFIDENCE_FAILED', result.error, ['confidence_failed'], 400);
  }

  const response = phase3DailyObjectiveLearnerResponseService.createConfidenceRecordedResponse(
    result.session!,
    'before',
  );

  return ok(res, { checkpoint: result.checkpoint, session: result.session, learnerResponse: response }, safeMeta(req));
});

router.post('/:checkSessionId/attempt', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;
  const learnerId = body.studentId || userId;

  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields({ ...body, checkSessionId: req.params.checkSessionId });
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  let result: any;
  if (usePrisma()) {
    result = await phase3DailyObjectiveCheckAttemptService.recordSafeAttemptSignalAsync({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      attemptType: body.attemptType,
      signalBucket: body.signalBucket,
      hintUsageBucket: body.hintUsageBucket,
      explanationQualityBucket: body.explanationQualityBucket,
      recallQualityBucket: body.recallQualityBucket,
      teachBackQualityBucket: body.teachBackQualityBucket,
      transferCheckBucket: body.transferCheckBucket,
      delayedRecallBucket: body.delayedRecallBucket,
      antiCheatLabels: body.antiCheatLabels,
      timeSpentSeconds: body.timeSpentSeconds,
      safeEvidenceRef: body.safeEvidenceRef,
    });
  } else {
    result = phase3DailyObjectiveCheckAttemptService.recordSafeAttemptSignal({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      attemptType: body.attemptType,
      signalBucket: body.signalBucket,
      hintUsageBucket: body.hintUsageBucket,
      explanationQualityBucket: body.explanationQualityBucket,
      recallQualityBucket: body.recallQualityBucket,
      teachBackQualityBucket: body.teachBackQualityBucket,
      transferCheckBucket: body.transferCheckBucket,
      delayedRecallBucket: body.delayedRecallBucket,
      antiCheatLabels: body.antiCheatLabels,
      timeSpentSeconds: body.timeSpentSeconds,
      safeEvidenceRef: body.safeEvidenceRef,
    });
  }

  if (result.error) {
    return fail(res, 'ATTEMPT_FAILED', result.error, ['attempt_failed'], 400);
  }

  const response = phase3DailyObjectiveLearnerResponseService.createAttemptAcceptedResponse(result.session!);

  return ok(res, { attempt: result.attempt, session: result.session, learnerResponse: response }, safeMeta(req));
});

router.post('/:checkSessionId/step-complete', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;
  const stepType = body.stepType;
  if (!stepType || typeof stepType !== 'string') {
    return fail(res, 'MISSING_STEP_TYPE', 'Step type is required.', ['missing_step_type'], 400);
  }

  let session: any;
  if (usePrisma()) {
    try {
      session = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(req.params.checkSessionId);
    } catch (e: any) {
      return fail(res, 'PERSISTENCE_FAILED', e.message, ['persistence_failed'], 500);
    }
  } else {
    session = phase3DailyObjectiveCheckRepository.getCheckSessionById(req.params.checkSessionId);
  }
  if (!session) {
    return fail(res, 'SESSION_NOT_FOUND', 'Check session not found.', ['session_not_found'], 404);
  }
  if (session.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }
  if (role === 'student' && session.studentId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only complete their own steps.', ['cross_learner_denied'], 403);
  }

  let updatedSession: any;
  if (usePrisma()) {
    updatedSession = await phase3DailyObjectiveCheckRepository.markRequiredStepCompletedAsync(req.params.checkSessionId, stepType);
  } else {
    updatedSession = phase3DailyObjectiveCheckRepository.markRequiredStepCompleted(req.params.checkSessionId, stepType);
  }
  if (!updatedSession) {
    return fail(res, 'STEP_FAILED', 'Could not mark step as completed.', ['step_failed'], 400);
  }

  const nextStep = phase3DailyObjectiveCheckSessionService.resolveNextRequiredCheckStep(updatedSession);
  const nextStatus =
    nextStep === 'teach_back' ? 'awaiting_teach_back' :
    nextStep === 'transfer_check' ? 'awaiting_transfer_check' :
    nextStep === 'delayed_recall' ? 'awaiting_delayed_recall' :
    nextStep === 'confidence_after' ? 'awaiting_confidence_after' :
    nextStep === 'complete' ? 'completed' : 'in_progress';

  if (nextStatus !== updatedSession.status) {
    if (usePrisma()) {
      await phase3DailyObjectiveCheckRepository.updateCheckSessionStatusAsync(req.params.checkSessionId, nextStatus as any);
    } else {
      phase3DailyObjectiveCheckRepository.updateCheckSessionStatus(req.params.checkSessionId, nextStatus as any);
    }
  }

  phase3DailyObjectiveCheckAuditService.recordDailyObjectiveRequiredStepCompleted(
    schoolId, userId, role, session.studentId,
    session.objectiveId, req.params.checkSessionId,
  );

  let updated: any;
  if (usePrisma()) {
    try {
      updated = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(req.params.checkSessionId);
    } catch (e: any) {
      return fail(res, 'PERSISTENCE_FAILED', e.message, ['persistence_failed'], 500);
    }
  } else {
    updated = phase3DailyObjectiveCheckRepository.getCheckSessionById(req.params.checkSessionId);
  }
  if (!updated) {
    return fail(res, 'SESSION_NOT_FOUND', 'Check session not found after update.', ['session_not_found'], 404);
  }

  const learnerResponse = phase3DailyObjectiveLearnerResponseService.createNextStepRequiredResponse(updated, nextStep);

  return ok(res, { session: updated, learnerResponse }, safeMeta(req));
});

router.post('/:checkSessionId/confidence-after', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;
  const learnerId = body.studentId || userId;

  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields({ ...body, checkSessionId: req.params.checkSessionId });
  if (forbiddenErrors.length > 0) {
    return fail(res, 'FORBIDDEN_FIELDS', 'Payload contains forbidden fields.', ['forbidden_fields_detected'], 400);
  }

  let result: any;
  if (usePrisma()) {
    result = await phase3DailyObjectiveConfidenceService.recordConfidenceAfterAsync({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      confidenceLevel: body.confidenceLevel,
      checkpointType: 'after',
    });
  } else {
    result = phase3DailyObjectiveConfidenceService.recordConfidenceAfter({
      checkSessionId: req.params.checkSessionId,
      schoolId,
      studentId: learnerId,
      confidenceLevel: body.confidenceLevel,
      checkpointType: 'after',
    });
  }

  if (result.error) {
    return fail(res, 'CONFIDENCE_FAILED', result.error, ['confidence_failed'], 400);
  }

  const session = result.session!;
  if (session.completedSteps.includes('confidence_after') || session.confidenceAfter) {
    if (usePrisma()) {
      await phase3DailyObjectiveCheckRepository.markRequiredStepCompletedAsync(req.params.checkSessionId, 'confidence_after');
    } else {
      phase3DailyObjectiveCheckRepository.markRequiredStepCompleted(req.params.checkSessionId, 'confidence_after');
    }
  }

  const response = phase3DailyObjectiveLearnerResponseService.createConfidenceRecordedResponse(session, 'after');

  return ok(res, { checkpoint: result.checkpoint, session, learnerResponse: response }, safeMeta(req));
});

router.post('/:checkSessionId/complete', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const body = req.body as Record<string, any>;
  const learnerId = body.studentId || userId;

  const result = await phase3DailyObjectiveCheckCompletionService.completeDailyObjectiveCheckSession({
    checkSessionId: req.params.checkSessionId,
    schoolId,
    studentId: learnerId,
  });

  if (result.error) {
    return fail(res, 'COMPLETION_FAILED', result.error, ['completion_failed'], 400);
  }

  return ok(res, {
    result: result.result,
    learnerResponse: result.learnerResponse,
    teacherSummary: result.teacherSummary,
  }, safeMeta(req));
});

router.get('/learner/history', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);
  const userId = getUserId(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  const studentId = (req.query.studentId as string) || userId;
  if (role === 'student' && studentId !== userId) {
    return fail(res, 'CROSS_LEARNER_DENIED', 'Students can only view their own history.', ['cross_learner_denied'], 403);
  }

  let sessions: any[];
  if (usePrisma()) {
    try {
      sessions = await phase3DailyObjectiveCheckRepository.listCheckSessionsByLearnerAsync(schoolId, studentId);
    } catch (e: any) {
      return fail(res, 'PERSISTENCE_FAILED', e.message, ['persistence_failed'], 500);
    }
  } else {
    sessions = phase3DailyObjectiveCheckRepository.listCheckSessionsByLearner(schoolId, studentId);
  }
  const learnerResponses = sessions.map(s => {
    try {
      return phase3DailyObjectiveLearnerResponseService.createSessionStartedResponse(s);
    } catch {
      return null;
    }
  }).filter(Boolean);

  return ok(res, {
    sessions,
    learnerResponses,
    count: sessions.length,
  }, safeMeta(req));
});

// ── Teacher/Admin Routes ──

router.get('/teacher/summaries', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can view teacher summaries.', ['insufficient_role'], 403);
  }

  const summaries = phase3DailyObjectiveTeacherSummaryService.getTeacherSummaries(schoolId);

  return ok(res, { summaries, count: summaries.length }, safeMeta(req));
});

router.get('/teacher/summaries/:checkSessionId', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can view teacher summaries.', ['insufficient_role'], 403);
  }

  const summary = phase3DailyObjectiveTeacherSummaryService.getTeacherSummaryBySession(schoolId, req.params.checkSessionId);
  if (!summary) {
    return fail(res, 'SUMMARY_NOT_FOUND', 'Teacher summary not found.', ['summary_not_found'], 404);
  }

  return ok(res, summary, safeMeta(req));
});

router.post('/:checkSessionId/expire', async (req: Request, res: Response) => {
  const schoolId = getSchoolId(req);
  const role = getRole(req);

  if (!schoolId) {
    return fail(res, 'SCHOOL_CONTEXT_REQUIRED', 'Verified school context required.', ['missing_school_context'], 401);
  }

  if (role !== 'teacher' && role !== 'admin' && role !== 'internal') {
    return fail(res, 'INSUFFICIENT_ROLE', 'Only teachers and admins can expire check sessions.', ['insufficient_role'], 403);
  }

  let session: any;
  if (usePrisma()) {
    try {
      session = await phase3DailyObjectiveCheckRepository.getCheckSessionByIdAsync(req.params.checkSessionId);
    } catch (e: any) {
      return fail(res, 'PERSISTENCE_FAILED', e.message, ['persistence_failed'], 500);
    }
  } else {
    session = phase3DailyObjectiveCheckRepository.getCheckSessionById(req.params.checkSessionId);
  }
  if (!session) {
    return fail(res, 'SESSION_NOT_FOUND', 'Check session not found.', ['session_not_found'], 404);
  }
  if (session.schoolId !== schoolId) {
    return fail(res, 'CROSS_SCHOOL_DENIED', 'Cross-school access denied.', ['cross_school_denied'], 403);
  }

  let expired: any;
  if (usePrisma()) {
    expired = await phase3DailyObjectiveCheckRepository.expireCheckSessionAsync(req.params.checkSessionId);
  } else {
    expired = phase3DailyObjectiveCheckRepository.expireCheckSession(req.params.checkSessionId);
  }
  if (!expired) {
    return fail(res, 'EXPIRE_FAILED', 'Could not expire check session.', ['expire_failed'], 400);
  }

  phase3DailyObjectiveCheckAuditService.recordDailyObjectiveCheckExpired(
    schoolId, getUserId(req), role, session.studentId,
    session.objectiveId, req.params.checkSessionId,
  );

  return ok(res, { session: expired }, safeMeta(req));
});

export default router;
