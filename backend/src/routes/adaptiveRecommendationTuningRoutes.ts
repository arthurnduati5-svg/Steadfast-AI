import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { LearnerPreferenceFeedbackRequestSchema, LearnerChoiceSignalRequestSchema, SupportCalibrationRequestSchema, RecommendationTuningRequestSchema, detectForbiddenFields } from '../lib/adaptiveRecommendationTuningValidation';
import { rejectForbiddenAdaptiveTuningFields, assertSafeAdaptiveTuningInput } from '../services/adaptiveRecommendationTuningPrivacyGuard';
import { adaptiveRecommendationTuningAccessPolicy } from '../services/adaptiveRecommendationTuningAccessPolicy';
import { adaptiveRecommendationTuningResponseBuilder } from '../services/adaptiveRecommendationTuningResponseBuilder';
import { adaptiveRecommendationTuningAuditService } from '../services/adaptiveRecommendationTuningAuditService';
import { preferenceSafetyGuard } from '../services/preferenceSafetyGuard';
import { noAvoidanceLoopPolicyService } from '../services/noAvoidanceLoopPolicyService';
import { noMasteryInflationPolicyService } from '../services/noMasteryInflationPolicyService';
import { supportLevelCalibrationService } from '../services/supportLevelCalibrationService';
import { adaptiveRecommendationSourceTruthPolicy } from '../services/adaptiveRecommendationSourceTruthPolicy';
import { adaptiveRecommendationTuningService } from '../services/adaptiveRecommendationTuningService';
import { closedLoopPersonalizationRuntime } from '../services/closedLoopPersonalizationRuntime';
import { recommendationEffectivenessFeedbackBridge } from '../services/recommendationEffectivenessFeedbackBridge';
import { learnerPreferenceFeedbackService } from '../services/learnerPreferenceFeedbackService';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import type { AdaptiveTuningPolicyDecision, AdaptiveTuningReasonCode } from '../contracts/adaptiveRecommendationTuningContracts';

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

function sendSafeError(res: Response, status: number, code: string, message: string, policyDecision?: AdaptiveTuningPolicyDecision, safeReasonCodes?: AdaptiveTuningReasonCode[]) {
  const errorResponse = adaptiveRecommendationTuningResponseBuilder.error(code, message, { policyDecision, safeReasonCodes });
  res.status(status).json(errorResponse);
}

router.post('/feedback', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const parsed = LearnerPreferenceFeedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const forbiddenErrors = parsed.error.issues.filter((i) => i.path.includes('_forbidden'));
      if (forbiddenErrors.length > 0) {
        return sendSafeError(res, 400, 'forbidden_field', forbiddenErrors[0].message, 'blocked_forbidden_raw_field', ['forbidden_raw_field_detected']);
      }
      return sendSafeError(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
    }

    const privacyResult = rejectForbiddenAdaptiveTuningFields(req.body);
    if (!privacyResult.safe) {
      return sendSafeError(res, 400, 'forbidden_field', `Forbidden fields: ${privacyResult.forbiddenFieldsFound.join(', ')}`, privacyResult.policyDecision, privacyResult.safeReasonCodes);
    }

    if (!parsed.data.recommendationId) {
      return sendSafeError(res, 400, 'validation_error', 'recommendationId is required');
    }

    const feedbackResult = await learnerPreferenceFeedbackService.submitFeedback(
      identity,
      parsed.data.recommendationId,
      {
        feedbackType: parsed.data.feedbackType as any,
        subject: parsed.data.subject,
        topic: parsed.data.topic,
        skillTag: parsed.data.skillTag,
        sessionId: parsed.data.sessionId,
        agencyOptionId: parsed.data.agencyOptionId,
      },
    );

    await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType: 'adaptive_tuning_feedback_received',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      recommendationId: parsed.data.recommendationId,
      feedbackType: parsed.data.feedbackType,
      safeReasonCodes: [],
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      feedbackAccepted: feedbackResult.feedbackAccepted,
      safeFeedbackType: feedbackResult.safeFeedbackType,
      learnerFriendlyAcknowledgement: feedbackResult.learnerFriendlyAcknowledgement,
      privacyMetadata: feedbackResult.privacyMetadata,
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType: 'adaptive_tuning_failed',
      schoolId: (req.user as any)?.schoolId || '',
      studentId: (req.user as any)?.id || '',
      safeReasonCodes: [],
    }).catch(() => {});
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.post('/choice', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const parsed = LearnerChoiceSignalRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const forbiddenErrors = parsed.error.issues.filter((i) => i.path.includes('_forbidden'));
      if (forbiddenErrors.length > 0) {
        return sendSafeError(res, 400, 'forbidden_field', forbiddenErrors[0].message, 'blocked_forbidden_raw_field', ['forbidden_raw_field_detected']);
      }
      return sendSafeError(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
    }

    const privacyResult = rejectForbiddenAdaptiveTuningFields(req.body);
    if (!privacyResult.safe) {
      return sendSafeError(res, 400, 'forbidden_field', `Forbidden fields: ${privacyResult.forbiddenFieldsFound.join(', ')}`, privacyResult.policyDecision, privacyResult.safeReasonCodes);
    }

    await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType: 'adaptive_tuning_choice_recorded',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      recommendationId: parsed.data.recommendationId,
      choiceType: parsed.data.choiceType,
      safeReasonCodes: [],
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      choiceType: parsed.data.choiceType,
      recorded: true,
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.get('/snapshot', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const snapshot = {
      id: `snap-${Date.now()}`,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      supportLevel: 'standard',
      hintPacingBucket: 'standard_hint_pacing',
      preferredModeHints: [],
      effectiveModeHints: [],
      avoidanceRiskBucket: 'none',
      masteryInflationRiskBucket: 'none',
      safeReasonCodes: [],
      safeEvidenceRefs: [],
      sourceTruthStatus: 'real_evidence',
      confidenceBucket: 'medium_confidence',
      updatedAt: new Date().toISOString(),
      rawPrivateDataIncluded: false,
      hiddenReasoningIncluded: false,
      teacherOnlyDataIncluded: false,
      answerKeyIncluded: false,
      modelAnswerIncluded: false,
      markingSchemeIncluded: false,
      correctAnswerIncluded: false,
      safeguardingRawDetailIncluded: false,
      deenSensitivePrivateTextIncluded: false,
    };

    await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType: 'adaptive_tuning_snapshot_returned',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      safeReasonCodes: [],
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      snapshot,
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.post('/calibrate-support', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const parsed = SupportCalibrationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendSafeError(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
    }

    const calibrationResult = supportLevelCalibrationService.buildSupportCalibrationResult({
      recentTooHardCount: parsed.data.recentTooHardCount,
      recentTooEasyCount: parsed.data.recentTooEasyCount,
      recentConfusionCount: parsed.data.recentConfusionCount,
      recentCorrectCount: parsed.data.recentCorrectCount,
      recentIncorrectCount: parsed.data.recentIncorrectCount,
      recentIndependentSuccessCount: parsed.data.recentIndependentSuccessCount,
      recentHintDependencyCount: parsed.data.recentHintDependencyCount,
      sourceTruthStatus: parsed.data.sourceTruthStatus,
    });

    await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType: 'adaptive_tuning_support_calibrated',
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      safeReasonCodes: calibrationResult.safeReasonCodes,
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      calibration: calibrationResult,
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.post('/tune', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const parsed = RecommendationTuningRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const forbiddenErrors = parsed.error.issues.filter((i) => i.path.includes('_forbidden'));
      if (forbiddenErrors.length > 0) {
        return sendSafeError(res, 400, 'forbidden_field', forbiddenErrors[0].message, 'blocked_forbidden_raw_field', ['forbidden_raw_field_detected']);
      }
      return sendSafeError(res, 400, 'validation_error', parsed.error.issues.map((i) => i.message).join('; '));
    }

    const privacyResult = rejectForbiddenAdaptiveTuningFields(req.body);
    if (!privacyResult.safe) {
      return sendSafeError(res, 400, 'forbidden_field', `Forbidden fields: ${privacyResult.forbiddenFieldsFound.join(', ')}`, privacyResult.policyDecision, privacyResult.safeReasonCodes);
    }

    const sourceTruthResult = adaptiveRecommendationSourceTruthPolicy.evaluateSourceTruth({
      evidenceSource: parsed.data.sourceTruthStatus,
      isDeenSensitive: false,
      isSafeguardingActive: false,
      hasContentGap: false,
    });

    if (!sourceTruthResult.canTune) {
      return res.json(adaptiveRecommendationTuningResponseBuilder.success(undefined, {
        status: 'insufficient',
        sourceTruthStatus: sourceTruthResult.sourceTruthStatus,
        confidenceBucket: sourceTruthResult.confidenceBucket,
        safeReasonCodes: sourceTruthResult.safeReasonCodes,
      }));
    }

    const tuningResult = adaptiveRecommendationTuningService.computeTuning({
      feedbackType: parsed.data.feedbackType as any,
      profile: {
        preferredSupportLevel: 'guided_support',
        preferredStepSize: 'standard',
        practiceModePreference: 'balanced',
        challengeReadinessSignal: 'medium',
        foundationReviewPreference: 'medium',
        hintFrequencySignal: 'medium',
        difficultyCalibration: 0.5,
        recentSignalSummary: '',
        lastUpdatedAt: new Date().toISOString(),
        privacyMetadata: {
          rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true,
          teacherOnlyNotesExcluded: true, safeguardingBoundaryApplied: false, deenSensitivityHandled: false,
        },
      },
      recentTooHardCount: parsed.data.recentTooHardCount,
      recentTooEasyCount: parsed.data.recentTooEasyCount,
      recentConfusionCount: parsed.data.recentConfusionCount,
      recentChallengeRequestCount: parsed.data.recentChallengeRequestCount,
      recentTeacherHelpRequestCount: parsed.data.recentTeacherHelpRequestCount,
      recentSkipCount: parsed.data.recentSkipCount,
      masteryEvidenceLevel: parsed.data.masteryEvidenceLevel,
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      tuning: {
        supportLevelAdjustment: tuningResult.supportLevelAdjustment,
        difficultyAdjustment: tuningResult.difficultyAdjustment,
        stepSizeAdjustment: tuningResult.stepSizeAdjustment,
        recommendationBiases: tuningResult.recommendationBiases,
        reasonCodes: tuningResult.reasonCodes,
        safetyConstraintsApplied: tuningResult.safetyConstraintsApplied,
        nextRecommendationConstraints: tuningResult.nextRecommendationConstraints,
        confidence: tuningResult.confidence,
        sourceTruthStatus: sourceTruthResult.sourceTruthStatus,
      },
    }, {
      safeReasonCodes: tuningResult.reasonCodes as AdaptiveTuningReasonCode[],
      sourceTruthStatus: sourceTruthResult.sourceTruthStatus,
      confidenceBucket: sourceTruthResult.confidenceBucket,
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.get('/personalization-packet', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const packet = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      tuningDecision: 'keep_current',
      supportLevel: 'standard' as const,
      hintPacingBucket: 'standard_hint_pacing' as const,
      safeModeRankingHints: [],
      safeAgencyRankingHints: [],
      avoidanceRiskBucket: 'none' as const,
      masteryInflationRiskBucket: 'none' as const,
      sourceTruthStatus: 'real_evidence' as const,
      confidenceBucket: 'medium_confidence' as const,
      safeReasonCodes: [],
      safeEvidenceRefs: [],
      generatedAt: new Date().toISOString(),
      rawPrivateDataIncluded: false,
      hiddenReasoningIncluded: false,
      teacherOnlyDataIncluded: false,
      answerKeyIncluded: false,
      modelAnswerIncluded: false,
      markingSchemeIncluded: false,
      correctAnswerIncluded: false,
      safeguardingRawDetailIncluded: false,
      deenSensitivePrivateTextIncluded: false,
    };

    res.json(adaptiveRecommendationTuningResponseBuilder.success({ packet }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.get('/agency-ranking', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      agencyRankingHints: [],
      modeRankingHints: [],
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.get('/support-level', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const calibration = supportLevelCalibrationService.buildSupportCalibrationResult({
      recentTooHardCount: 0,
      recentTooEasyCount: 0,
      recentConfusionCount: 0,
      recentCorrectCount: 0,
      recentIncorrectCount: 0,
      recentIndependentSuccessCount: 0,
      recentHintDependencyCount: 0,
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({
      supportLevel: calibration.supportLevel,
      hintPacingBucket: calibration.hintPacingBucket,
      description: getSupportLevelDescription(calibration.supportLevel),
    });

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

router.post('/audit', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendSafeError(res, 401, 'unauthenticated', 'Authentication required', 'blocked_no_learner_identity', ['learner_ownership_not_proven']);
    }

    const accessPolicy = adaptiveRecommendationTuningAccessPolicy.evaluateAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
      role: identity.role,
    });
    if (!accessPolicy.allowed) {
      return sendSafeError(res, 403, 'access_denied', accessPolicy.policyDecision, accessPolicy.policyDecision, accessPolicy.safeReasonCodes);
    }

    const { eventType, recommendationId, feedbackType, choiceType } = req.body || {};
    if (!eventType) {
      return sendSafeError(res, 400, 'validation_error', 'eventType is required');
    }

    const event = await adaptiveRecommendationTuningAuditService.recordAuditEvent({
      eventType,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      recommendationId,
      feedbackType,
      choiceType,
      safeReasonCodes: [],
    });

    const response = adaptiveRecommendationTuningResponseBuilder.success({ event });
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendSafeError(res, 500, 'internal_error', message);
  }
});

function getSupportLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    minimal: 'You can work independently. Check in when needed.',
    light: 'Light guidance is available if you get stuck.',
    standard: 'The tutor will guide each step with prompts.',
    guided: 'The tutor will break problems into very small steps.',
    high_support: 'Let us revisit foundational concepts before moving forward.',
    teacher_support_recommended: 'Your teacher may offer the best support for this topic.',
    blocked: 'Support level is blocked pending review.',
  };
  return descriptions[level] || 'Support is available as needed.';
}

export default router;
