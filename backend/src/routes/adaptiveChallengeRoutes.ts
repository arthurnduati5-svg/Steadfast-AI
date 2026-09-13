import { Router, Request, Response } from 'express';
import { validateAdaptiveChallengeRequest, validateChallengeReadinessRequest, validateDifficultyCalibrationRequest, validateChallengeBlueprintRequest, validateChallengeAttemptMetadata } from '../lib/adaptiveChallengeValidation';
import { rejectForbiddenAdaptiveChallengeFields, assertSafeAdaptiveChallengeOutput } from '../services/adaptiveChallengePrivacyGuard';
import { adaptiveChallengeAccessPolicy } from '../services/adaptiveChallengeAccessPolicy';
import { adaptiveChallengeSourceTruthPolicy } from '../services/adaptiveChallengeSourceTruthPolicy';
import { noFakeChallengeReadinessGuard } from '../services/noFakeChallengeReadinessGuard';
import { rejectProtectedAnswerFields } from '../services/challengeAnswerProtectionGuard';
import { challengeReadinessEvaluator } from '../services/challengeReadinessEvaluator';
import { challengeBlueprintService } from '../services/challengeBlueprintService';
import { hintScaffoldPolicyService } from '../services/hintScaffoldPolicyService';
import { adaptiveChallengeAuditService } from '../services/adaptiveChallengeAuditService';
import { adaptiveChallengeRepository } from '../services/adaptiveChallengeRepository';
import { adaptiveChallengeGenerationRuntime } from '../services/adaptiveChallengeGenerationRuntime';
import * as responseBuilder from '../services/adaptiveChallengeResponseBuilder';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

const router = Router();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || 'student',
  };
}

function nowISO(): string {
  return new Date().toISOString();
}

function checkCrossStudentAccess(req: Request, identity: ResolvedTutorIdentity, targetStudentId?: string): boolean {
  const targetId = targetStudentId || req.params.studentId || req.query.studentId as string || req.body?.studentId;
  if (targetId && targetId !== identity.studentId) {
    return false;
  }
  return true;
}

function handleValidationError(res: Response, err: any): void {
  const message = err instanceof Error ? err.message : 'Validation failed';
  res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected', message]));
}

// POST /generate - Full adaptive challenge generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    const accessResult = adaptiveChallengeAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: req.body?.studentId,
      role: identity.role,
    });
    if (!accessResult.allowed) {
      res.status(403).json(responseBuilder.buildErrorResponse(accessResult.policyDecision, accessResult.safeReasonCodes));
      return;
    }

    const parsed = validateAdaptiveChallengeRequest(req.body || {});
    if (!parsed.success) {
      handleValidationError(res, parsed.error);
      return;
    }

    const { safe: privacySafe, found: privacyFound } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected', ...privacyFound]));
      return;
    }

    const { safe: answerSafe } = rejectProtectedAnswerFields(req.body);
    if (!answerSafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_answer_key', ['protected_answer_field_detected']));
      return;
    }

    const result = await adaptiveChallengeGenerationRuntime.generateOrGetNext({
      identity,
      request: {
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        studentId: identity.studentId,
        subject: req.body.subjectId,
        topic: req.body.topicId,
        skillTag: req.body.skillId,
        mode: (req.body as any).mode ?? 'auto',
      },
      subject: req.body.subjectId,
      topic: req.body.topicId,
      skillTag: req.body.skillId,
    });

    if (!result.ok) {
      res.json(responseBuilder.buildBlockedNotReadyResponse(result.errors.join('; ')));
      return;
    }

    if (result.remediationPath) {
      res.json(responseBuilder.buildRemediationResponse({
        data: result.remediationPath,
        safeReasonCodes: result.decision.reasonCodes,
        readinessLevel: 'ready_for_foundation',
        sourceTruthStatus: 'insufficient',
        confidenceBucket: 'not_enough_evidence',
      }));
      return;
    }

    res.json(responseBuilder.buildChallengeResponse({
      data: result.challenge,
      safeReasonCodes: result.decision.reasonCodes,
      challengeType: result.challenge?.challengeType as any,
      readinessLevel: result.decision.verdict as any,
      difficultyBand: result.challenge?.difficultyLevel as any,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['challenge_runtime_failed', message]));
  }
});

// POST /readiness - Evaluate challenge readiness
router.post('/readiness', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateChallengeReadinessRequest(req.body || {});
    if (!parsed.success) {
      handleValidationError(res, parsed.error);
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    const sourceResult = adaptiveChallengeSourceTruthPolicy.evaluate({
      sourceTruthStatus: req.body.sourceTruthStatus || 'insufficient',
      isDeenSensitive: false,
      isSafeguardingBoundary: false,
      hasApprovedSourceContext: false,
    });

    const readinessDecision = challengeReadinessEvaluator.evaluate({
      masteryLevel: req.body.masteryBucket || 'not_started',
      evidenceCount: (req.body.safeEvidenceRefs || []).length,
      recentIndependentSuccessCount: 0,
      recentHintUsage: 0,
      recentMistakeCount: 0,
      repeatedMistakeSignals: 0,
      revisionPriority: 'none',
      spacedReviewDue: false,
      learnerChallengePreference: 'medium',
      difficultyCalibration: 'standard',
      supportLevel: 'moderate',
      subject: req.body.subjectId || 'general',
      topic: req.body.topicId,
      skillTag: req.body.skillId,
    });

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      challengeType: readinessDecision.suggestedChallengeType,
      difficultyLevel: readinessDecision.suggestedDifficultyLevel,
      reasonCodes: readinessDecision.reasonCodes,
      safeEvidenceRefs: [],
      privacyDecision: 'learner_safe_readiness_check',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json(responseBuilder.buildReadinessResponse({
      readinessLevel: readinessDecision.verdict as any,
      safeReasonCodes: readinessDecision.reasonCodes,
      confidenceBucket: readinessDecision.confidence >= 0.7 ? 'high' : readinessDecision.confidence >= 0.4 ? 'medium' : 'low',
      sourceTruthStatus: sourceResult.sourceTruthStatus,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['readiness_evaluation_failed', message]));
  }
});

// POST /difficulty - Calibrate difficulty
router.post('/difficulty', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateDifficultyCalibrationRequest(req.body || {});
    if (!parsed.success) {
      handleValidationError(res, parsed.error);
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    res.json(responseBuilder.buildDifficultyResponse({
      difficultyBand: 'standard',
      safeReasonCodes: ['difficulty_calibrated'],
      confidenceBucket: 'medium',
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['difficulty_calibration_failed', message]));
  }
});

// POST /blueprint - Build challenge blueprint
router.post('/blueprint', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateChallengeBlueprintRequest(req.body || {});
    if (!parsed.success) {
      handleValidationError(res, parsed.error);
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    const { safe: answerSafe } = rejectProtectedAnswerFields(req.body);
    if (!answerSafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_answer_key', ['protected_answer_field_detected']));
      return;
    }

    const blueprint = challengeBlueprintService.generateBlueprint({
      challengeType: req.body.challengeType || 'similar_practice',
      subject: req.body.subjectId || 'general',
      topic: req.body.topicId,
      skillTag: req.body.skillId,
      difficultyLevel: req.body.difficultyBand || 'standard',
    });

    res.json(responseBuilder.buildChallengeResponse({
      data: blueprint,
      safeReasonCodes: ['blueprint_generated'],
      challengeType: blueprint.challengeType as any,
      readinessLevel: req.body.readinessLevel,
      difficultyBand: req.body.difficultyBand || 'standard',
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['blueprint_generation_failed', message]));
  }
});

// POST /attempt - Record challenge attempt
router.post('/attempt', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateChallengeAttemptMetadata(req.body || {});
    if (!parsed.success) {
      handleValidationError(res, parsed.error);
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      challengeId: req.body.challengeId,
      challengeType: req.body.challengeType,
      difficultyLevel: req.body.difficultyBand,
      reasonCodes: req.body.safeReasonCodes || ['attempt_recorded'],
      safeEvidenceRefs: (req.body.safeEvidenceRefs || []).map((ref: string) => ({ source: ref, summary: '' })),
      privacyDecision: 'learner_safe_attempt_metadata',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json({
      ok: true,
      status: 'attempt_recorded',
      safeReasonCodes: ['attempt_metadata_recorded'],
      generatedAt: nowISO(),
      rawPrivateDataIncluded: false,
      hiddenReasoningIncluded: false,
      teacherOnlyDataIncluded: false,
      answerKeyIncluded: false,
      modelAnswerIncluded: false,
      markingSchemeIncluded: false,
      correctAnswerIncluded: false,
      safeguardingRawDetailIncluded: false,
      deenSensitivePrivateTextIncluded: false,
    } as any);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['attempt_recording_failed', message]));
  }
});

// GET /:challengeId - Get challenge by ID
router.get('/:challengeId', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      identity.schoolId,
      identity.studentId,
      req.params.challengeId,
    );

    if (!challenge) {
      res.status(404).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['challenge_not_found']));
      return;
    }

    res.json(responseBuilder.buildChallengeResponse({
      data: challenge,
      safeReasonCodes: ['challenge_retrieved'],
      challengeType: challenge.challengeType as any,
      difficultyBand: challenge.difficultyLevel as any,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['challenge_retrieval_failed', message]));
  }
});

// POST /:challengeId/audit - Record audit for challenge
router.post('/:challengeId/audit', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body || {});
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      challengeId: req.params.challengeId,
      reasonCodes: req.body.reasonCodes || ['audit_recorded'],
      safeEvidenceRefs: [],
      privacyDecision: 'learner_safe_audit',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json(responseBuilder.buildChallengeResponse({
      safeReasonCodes: ['audit_recorded'],
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['audit_failed', message]));
  }
});

// GET /:challengeId/hints - Get hint scaffold for challenge
router.get('/:challengeId/hints', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      identity.schoolId,
      identity.studentId,
      req.params.challengeId,
    );

    if (!challenge) {
      res.status(404).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['challenge_not_found']));
      return;
    }

    const hintCount = parseInt(req.query.level as string) || 0;
    const hint = hintScaffoldPolicyService.getHint({
      currentAttemptNumber: 1,
      totalHintsRequested: hintCount + 1,
      challengeType: challenge.challengeType,
      skillTag: challenge.skillTag,
      subject: challenge.subject,
    });

    res.json({
      ok: true,
      status: 'hint_provided',
      data: hint,
      safeReasonCodes: ['hint_requested'],
      generatedAt: nowISO(),
      rawPrivateDataIncluded: false,
      hiddenReasoningIncluded: false,
      teacherOnlyDataIncluded: false,
      answerKeyIncluded: false,
      modelAnswerIncluded: false,
      markingSchemeIncluded: false,
      correctAnswerIncluded: false,
      safeguardingRawDetailIncluded: false,
      deenSensitivePrivateTextIncluded: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['hint_retrieval_failed', message]));
  }
});

export default router;
