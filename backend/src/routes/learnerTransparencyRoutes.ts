import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import {
  validateLearnerTransparencyRequest,
  LearnerTransparencyRequestSchema,
  LearnerProgressNarrativeRequestSchema,
  LearnerWhyThisNextRequestSchema,
  LearnerSafeEvidenceCardRequestSchema,
  LearnerAgencyOptionsRequestSchema,
  detectForbiddenFields,
  assertNoForbiddenFields,
} from '../lib/learnerTransparencyValidation';
import {
  rejectForbiddenLearnerTransparencyFields,
  assertSafeLearnerTransparencyOutput,
} from '../services/learnerTransparencyPrivacyGuard';
import { assertNoHiddenReasoningInLearnerOutput } from '../services/learnerHiddenReasoningBoundaryGuard';
import {
  enforceLearnerTransparencyAccess,
  assertLearnerOwnership,
  assertSchoolContext,
} from '../services/learnerTransparencyAccessPolicy';
import { evaluateLearnerTransparencySourceTruth } from '../services/learnerTransparencySourceTruthPolicy';
import {
  buildSuccessResponse,
  buildEmptyResponse,
  buildInsufficientEvidenceResponse,
  buildContentGapResponse,
  buildDeenReferralResponse,
  buildSafeguardingBoundaryResponse,
  buildBlockedResponse,
  buildErrorResponse,
} from '../services/learnerTransparencyResponseBuilder';
import { recordLearnerTransparencyEvent } from '../services/learnerTransparencyAuditService';
import { determineConfidenceBucket, determineTransparencyStatus } from '../services/learnerUncertaintyLabelService';
import { buildLearnerDeenReferralNotice } from '../services/learnerDeenReferralExplanationService';
import { buildLearnerSafeguardingBoundaryNotice } from '../services/learnerSafeguardingBoundaryNoticeService';
import type {
  LearnerTransparencyContext,
  LearnerTransparencyPacket,
  LearnerTransparencySurface,
  LearnerTransparencySourceTruthResult,
  LearnerProgressNarrative,
  LearnerWhyThisNextExplanation,
  LearnerSafeEvidenceCard,
  LearnerAgencyOption,
  LearnerTransparencyAuditEventType,
} from '../contracts/learnerTransparencyContracts';

const router = Router();

const LEARNER_SAFE_EMPTY_MESSAGE =
  'There is not enough safe learning evidence yet to explain your progress. Try a short learning, quiz, teach-back, or revision session first.';

function resolveIdentity(req: Request): { schoolId: string; studentId: string; userId: string; role: string } | null {
  if (!req.user) return null;
  return {
    studentId: (req.user as any).id || '',
    schoolId: (req.user as any).schoolId || (req as any).schoolId || '',
    userId: (req.user as any).id || '',
    role: (req.user as any).role || 'student',
  };
}

function buildEmptyPacket(surface: LearnerTransparencySurface): LearnerTransparencyPacket {
  return {
    surface,
    status: 'empty',
    sourceTruthStatus: 'insufficient',
    confidenceBucket: 'not_enough_evidence',
    policyDecision: 'allowed',
    safeReasonCodes: ['no_safe_learning_evidence_yet'],
    learnerSafeMessage: LEARNER_SAFE_EMPTY_MESSAGE,
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
}

function buildInsufficientPacket(surface: LearnerTransparencySurface): LearnerTransparencyPacket {
  return {
    surface,
    status: 'insufficient',
    sourceTruthStatus: 'insufficient',
    confidenceBucket: 'not_enough_evidence',
    policyDecision: 'allowed',
    safeReasonCodes: ['insufficient_evidence_for_narrative'],
    learnerSafeMessage: LEARNER_SAFE_EMPTY_MESSAGE,
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
}

function sendEmptyResponse(res: Response, surface: LearnerTransparencySurface): void {
  res.json({
    ...buildEmptyResponse(surface),
    data: buildEmptyPacket(surface),
  });
}

function sendInsufficientResponse(res: Response, surface: LearnerTransparencySurface): void {
  res.json({
    ...buildInsufficientEvidenceResponse(surface),
    data: buildInsufficientPacket(surface),
  });
}

// ─────────────────────────────────────────────────────────────
// GET /progress
// Returns learner progress narrative
// ─────────────────────────────────────────────────────────────
router.get('/progress', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const query: Record<string, unknown> = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
    };

    const parsed = LearnerProgressNarrativeRequestSchema.safeParse(query);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse({ policyDecision: 'blocked_forbidden_raw_field', safeReasonCodes: ['forbidden_raw_field_detected'] }));
      return;
    }

    assertNoForbiddenFields(query);

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'progress_narrative',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'progress_narrative', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const hasEvidence = false;
    if (!hasEvidence) {
      sendEmptyResponse(res, 'progress_narrative');
      return;
    }

    const sourceTruth = evaluateLearnerTransparencySourceTruth({
      sourceTruthStatus: 'real',
      realEvidenceCount: 0,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenReferral: false,
      hasSafeguardingBoundary: false,
      hasAnswerKeyEvent: false,
      hasModelAnswerEvent: false,
      hasMarkingSchemeEvent: false,
      hasCorrectAnswerEvent: false,
    });

    if (!sourceTruth.canSupportNarrative) {
      sendInsufficientResponse(res, 'progress_narrative');
      return;
    }

    const narrative: LearnerProgressNarrative = {
      id: `pn-${Date.now()}`,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      safeProgressBucket: 'developing',
      safeMasteryBucket: 'foundation',
      safeRevisionNeedBucket: 'none',
      safeGrowthStatusBucket: 'progressing',
      learnerSafeSummary: 'You are making progress in this topic.',
      encouragementText: 'Keep going — every step builds your understanding.',
      safeEvidenceCardIds: [],
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      createdAt: new Date().toISOString(),
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

    const confidenceBucket = determineConfidenceBucket({
      realEvidenceCount: 1,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenSignal: false,
      hasSafeguarding: false,
      sourceTruthStatus: 'real',
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'progress_narrative',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket,
      policyDecision: 'allowed',
      safeReasonCodes: [],
      progressNarrative: narrative,
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

    const response = buildSuccessResponse({ surface: 'progress_narrative', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'progress_narrative',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket,
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'progress_narrative',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /why-this-next
// Returns why-this-next explanation
// ─────────────────────────────────────────────────────────────
router.get('/why-this-next', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const query: Record<string, unknown> = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
      nextStepType: req.query.nextStepType as string | undefined,
    };

    const parsed = LearnerWhyThisNextRequestSchema.safeParse(query);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse({ policyDecision: 'blocked_forbidden_raw_field', safeReasonCodes: ['forbidden_raw_field_detected'] }));
      return;
    }

    assertNoForbiddenFields(query);

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'why_this_next',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'why_this_next', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const hasEvidence = false;
    if (!hasEvidence) {
      sendEmptyResponse(res, 'why_this_next');
      return;
    }

    const sourceTruth = evaluateLearnerTransparencySourceTruth({
      sourceTruthStatus: 'real',
      realEvidenceCount: 0,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenReferral: false,
      hasSafeguardingBoundary: false,
      hasAnswerKeyEvent: false,
      hasModelAnswerEvent: false,
      hasMarkingSchemeEvent: false,
      hasCorrectAnswerEvent: false,
    });

    if (!sourceTruth.canSupportExplanation) {
      sendInsufficientResponse(res, 'why_this_next');
      return;
    }

    const explanation: LearnerWhyThisNextExplanation = {
      id: `wtn-${Date.now()}`,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      recommendedNextStepType: (req.query.nextStepType as any) || 'continue_current_step',
      whyThisNextText: 'This next step helps you build on what you have just learned.',
      safeBecauseText: 'Your recent practice shows you are ready for this.',
      whatYouCanDoText: 'Try the next practice question to check your understanding.',
      whatIsNotShownText: 'Detailed model answers are not shown to protect your learning.',
      safeEvidenceCardIds: [],
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      createdAt: new Date().toISOString(),
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

    const confidenceBucket = determineConfidenceBucket({
      realEvidenceCount: 1,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenSignal: false,
      hasSafeguarding: false,
      sourceTruthStatus: 'real',
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'why_this_next',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket,
      policyDecision: 'allowed',
      safeReasonCodes: [],
      whyThisNextExplanation: explanation,
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

    const response = buildSuccessResponse({ surface: 'why_this_next', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'why_this_next',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket,
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'why_this_next',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /evidence-cards
// Returns list of safe evidence cards
// ─────────────────────────────────────────────────────────────
router.get('/evidence-cards', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const query: Record<string, unknown> = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const parsed = LearnerSafeEvidenceCardRequestSchema.safeParse(query);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse({ policyDecision: 'blocked_forbidden_raw_field', safeReasonCodes: ['forbidden_raw_field_detected'] }));
      return;
    }

    assertNoForbiddenFields(query);

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'safe_evidence_card_list',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'safe_evidence_card_list', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const hasEvidence = false;
    if (!hasEvidence) {
      sendEmptyResponse(res, 'safe_evidence_card_list');
      return;
    }

    const sourceTruth = evaluateLearnerTransparencySourceTruth({
      sourceTruthStatus: 'real',
      realEvidenceCount: 0,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenReferral: false,
      hasSafeguardingBoundary: false,
      hasAnswerKeyEvent: false,
      hasModelAnswerEvent: false,
      hasMarkingSchemeEvent: false,
      hasCorrectAnswerEvent: false,
    });

    if (!sourceTruth.canSupportEvidenceCard) {
      sendInsufficientResponse(res, 'safe_evidence_card_list');
      return;
    }

    const safeEvidenceCards: LearnerSafeEvidenceCard[] = [];

    const confidenceBucket = determineConfidenceBucket({
      realEvidenceCount: safeEvidenceCards.length,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenSignal: false,
      hasSafeguarding: false,
      sourceTruthStatus: 'real',
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'safe_evidence_card_list',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket,
      policyDecision: 'allowed',
      safeReasonCodes: [],
      safeEvidenceCards,
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

    const response = buildSuccessResponse({ surface: 'safe_evidence_card_list', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'safe_evidence_card_list',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket,
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'safe_evidence_card_list',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /evidence-cards/:cardId
// Returns single evidence card
// ─────────────────────────────────────────────────────────────
router.get('/evidence-cards/:cardId', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'safe_evidence_card',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'safe_evidence_card', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const cardId = req.params.cardId;
    const found = false;

    if (!found) {
      sendEmptyResponse(res, 'safe_evidence_card');
      return;
    }

    const evidenceCard: LearnerSafeEvidenceCard = {
      id: cardId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'safe_evidence_card',
      safeTitle: 'Evidence of progress',
      safeSummary: 'You showed understanding of this topic.',
      safeEvidenceRefs: [cardId],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      safeReasonCodes: [],
      createdAt: new Date().toISOString(),
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

    const packet: LearnerTransparencyPacket = {
      surface: 'safe_evidence_card',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      safeEvidenceCards: [evidenceCard],
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

    const response = buildSuccessResponse({ surface: 'safe_evidence_card', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'safe_evidence_card',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'safe_evidence_card',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /agency-options
// Returns learner agency options
// ─────────────────────────────────────────────────────────────
router.get('/agency-options', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const query: Record<string, unknown> = {
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      subjectId: req.query.subjectId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      skillId: req.query.skillId as string | undefined,
      nextStepType: req.query.nextStepType as string | undefined,
    };

    const parsed = LearnerAgencyOptionsRequestSchema.safeParse(query);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse({ policyDecision: 'blocked_forbidden_raw_field', safeReasonCodes: ['forbidden_raw_field_detected'] }));
      return;
    }

    assertNoForbiddenFields(query);

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'learner_agency_options',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'learner_agency_options', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const hasEvidence = false;
    if (!hasEvidence) {
      sendEmptyResponse(res, 'learner_agency_options');
      return;
    }

    const sourceTruth = evaluateLearnerTransparencySourceTruth({
      sourceTruthStatus: 'real',
      realEvidenceCount: 0,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenReferral: false,
      hasSafeguardingBoundary: false,
      hasAnswerKeyEvent: false,
      hasModelAnswerEvent: false,
      hasMarkingSchemeEvent: false,
      hasCorrectAnswerEvent: false,
    });

    if (!sourceTruth.canSupportAgencyOptions) {
      sendInsufficientResponse(res, 'learner_agency_options');
      return;
    }

    const agencyOptions: LearnerAgencyOption[] = [];

    const confidenceBucket = determineConfidenceBucket({
      realEvidenceCount: agencyOptions.length,
      nonRealEvidenceCount: 0,
      unknownEvidenceCount: 0,
      staleEvidenceCount: 0,
      hasContentGap: false,
      hasDeenSignal: false,
      hasSafeguarding: false,
      sourceTruthStatus: 'real',
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'learner_agency_options',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket,
      policyDecision: 'allowed',
      safeReasonCodes: [],
      agencyOptions,
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

    const response = buildSuccessResponse({ surface: 'learner_agency_options', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'learner_agency_options',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket,
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'learner_agency_options',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /recommendation
// Returns recommendation transparency
// ─────────────────────────────────────────────────────────────
router.get('/recommendation', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'recommendation_transparency',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'recommendation_transparency', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'recommendation_transparency',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      policyDecision: 'allowed',
      safeReasonCodes: [],
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

    const response = buildSuccessResponse({ surface: 'recommendation_transparency', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'recommendation_transparency',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'recommendation_transparency',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /revision-reason
// Returns revision reason
// ─────────────────────────────────────────────────────────────
router.get('/revision-reason', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'revision_reason',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'revision_reason', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'revision_reason',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      policyDecision: 'allowed',
      safeReasonCodes: [],
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

    const response = buildSuccessResponse({ surface: 'revision_reason', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'revision_reason',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'revision_reason',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /mastery-progress
// Returns mastery progress
// ─────────────────────────────────────────────────────────────
router.get('/mastery-progress', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'mastery_progress_reason',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'mastery_progress_reason', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    assertLearnerOwnership({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    const packet: LearnerTransparencyPacket = {
      surface: 'mastery_progress_reason',
      status: 'ok',
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
      policyDecision: 'allowed',
      safeReasonCodes: [],
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

    const response = buildSuccessResponse({ surface: 'mastery_progress_reason', packet });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'mastery_progress_reason',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: [],
      sourceTruthStatus: 'real',
      confidenceBucket: 'medium',
    });

    res.json(response);
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'mastery_progress_reason',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /content-gap
// Returns content gap notice
// ─────────────────────────────────────────────────────────────
router.get('/content-gap', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'content_gap_notice',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'content_gap_notice', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'content_gap_notice',
      eventType: 'learner_transparency_returned',
      policyDecision: 'allowed',
      safeReasonCodes: ['content_gap_no_curriculum_context'],
      sourceTruthStatus: 'content_gap',
      confidenceBucket: 'blocked',
    });

    res.json(buildContentGapResponse('content_gap_notice'));
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'content_gap_notice',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /deen-referral
// Returns Deen referral notice
// ─────────────────────────────────────────────────────────────
router.get('/deen-referral', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'deen_referral_notice',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'deen_referral_notice', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    const deenReferralNotice = buildLearnerDeenReferralNotice({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
    });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'deen_referral_notice',
      eventType: 'learner_transparency_deen_referral_returned',
      policyDecision: 'allowed',
      safeReasonCodes: deenReferralNotice.safeReasonCodes,
      sourceTruthStatus: deenReferralNotice.sourceTruthStatus,
      confidenceBucket: deenReferralNotice.confidenceBucket,
    });

    res.json(buildDeenReferralResponse('deen_referral_notice'));
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'deen_referral_notice',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /safeguarding-boundary
// Returns safeguarding boundary notice
// ─────────────────────────────────────────────────────────────
router.get('/safeguarding-boundary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const access = enforceLearnerTransparencyAccess({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      userId: identity.userId,
      role: identity.role,
      targetSchoolId: identity.schoolId,
      targetStudentId: identity.studentId,
    });

    if (!access.allowed) {
      await recordLearnerTransparencyEvent({
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        surface: 'safeguarding_boundary_notice',
        eventType: 'learner_transparency_blocked',
        policyDecision: access.policyDecision,
        safeReasonCodes: access.safeReasonCodes,
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
      });
      res.status(403).json(buildBlockedResponse({ surface: 'safeguarding_boundary_notice', policyDecision: access.policyDecision, safeReasonCodes: access.safeReasonCodes }));
      return;
    }

    const safeguardingNotice = buildLearnerSafeguardingBoundaryNotice({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
    });

    await recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: 'safeguarding_boundary_notice',
      eventType: 'learner_transparency_safeguarding_boundary_returned',
      policyDecision: 'allowed',
      safeReasonCodes: safeguardingNotice.safeReasonCodes,
      sourceTruthStatus: safeguardingNotice.sourceTruthStatus,
      confidenceBucket: safeguardingNotice.confidenceBucket,
    });

    res.json(buildSafeguardingBoundaryResponse('safeguarding_boundary_notice'));
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'safeguarding_boundary_notice',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

// ─────────────────────────────────────────────────────────────
// POST /audit
// Records an audit event from client
// ─────────────────────────────────────────────────────────────
router.post('/audit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(buildErrorResponse({ policyDecision: 'blocked_no_learner_identity', safeReasonCodes: ['no_learner_identity'] }));
      return;
    }

    assertSchoolContext({ schoolId: identity.schoolId });

    const body = req.body || {};
    const parsed = LearnerTransparencyRequestSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse({ policyDecision: 'blocked_forbidden_raw_field', safeReasonCodes: ['forbidden_raw_field_detected'] }));
      return;
    }

    assertNoForbiddenFields(body);

    const event = recordLearnerTransparencyEvent({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      surface: body.surface || 'empty_state_notice',
      eventType: body.eventType || 'learner_transparency_requested',
      policyDecision: body.policyDecision || 'allowed',
      safeReasonCodes: body.safeReasonCodes || [],
      sourceTruthStatus: body.sourceTruthStatus || 'unknown',
      confidenceBucket: body.confidenceBucket || 'not_enough_evidence',
    });

    res.json({ ok: true, event });
  } catch (error: any) {
    await recordLearnerTransparencyEvent({
      schoolId: (req as any).schoolId || '',
      studentId: (req as any).user?.id || '',
      surface: 'empty_state_notice',
      eventType: 'learner_transparency_failed',
      policyDecision: 'blocked_live_ai',
      safeReasonCodes: ['blocked_by_access_policy'],
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
    });
    res.status(500).json(buildErrorResponse({ policyDecision: 'blocked_live_ai', safeReasonCodes: ['blocked_by_access_policy'] }));
  }
});

export default router;
