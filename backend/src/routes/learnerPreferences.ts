import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { learnerPreferenceFeedbackService } from '../services/learnerPreferenceFeedbackService';
import { recommendationInteractionTrackingService } from '../services/recommendationInteractionTrackingService';
import { adaptiveRecommendationProfileService } from '../services/adaptiveRecommendationProfileService';
import { adaptiveRecommendationTuningService } from '../services/adaptiveRecommendationTuningService';
import { closedLoopPersonalizationRuntime } from '../services/closedLoopPersonalizationRuntime';
import { recommendationWeightingPolicyService } from '../services/recommendationWeightingPolicyService';
import { learnerSupportLevelCalibrationService } from '../services/learnerSupportLevelCalibrationService';
import { learnerChoicePolicyService } from '../services/learnerChoicePolicyService';
import { personalizationAuditService } from '../services/personalizationAuditService';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import type {
  RecommendationInteractionType,
} from '../services/learnerPreferenceFeedbackContracts';

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

router.post('/recommendations/:recommendationId/feedback', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { recommendationId } = req.params;
    const { feedbackType, agencyOptionId, subject, topic, skillTag, sessionId, freeText } = req.body;

    if (!feedbackType) {
      return sendError(res, 400, 'validation_error', 'feedbackType is required');
    }

    const result = await closedLoopPersonalizationRuntime.processFeedback({
      identity,
      recommendationId,
      feedback: { feedbackType, agencyOptionId, subject, topic, skillTag, sessionId, freeText },
      sessionId,
      subject,
      topic,
      skillTag,
    });

    res.json({
      ok: true,
      feedbackAccepted: result.feedbackAccepted,
      safeFeedbackType: result.safeFeedbackType,
      profileUpdated: result.profileUpdated,
      tuningApplied: result.tuningApplied,
      nextRecommendationPreview: result.nextRecommendationPreview,
      learnerFriendlyAcknowledgement: result.learnerFriendlyAcknowledgement,
      privacyMetadata: result.privacyMetadata,
      auditRecord: result.auditRecord,
      createdAt: result.createdAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.post('/recommendations/:recommendationId/interaction', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { recommendationId } = req.params;
    const { interactionType, sessionId, subject, topic, skillTag } = req.body;

    if (!interactionType) {
      return sendError(res, 400, 'validation_error', 'interactionType is required');
    }

    const record = await recommendationInteractionTrackingService.recordInteraction(
      identity,
      recommendationId,
      { interactionType, sessionId, subject, topic, skillTag },
    );

    res.json({
      ok: true,
      interaction: record,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/recommendations/profile', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const profile = await adaptiveRecommendationProfileService.getOrCreateProfile(identity);

    res.json({
      ok: true,
      profile: {
        preferredSupportLevel: profile.preferredSupportLevel,
        preferredStepSize: profile.preferredStepSize,
        practiceModePreference: profile.practiceModePreference,
        challengeReadinessSignal: profile.challengeReadinessSignal,
        foundationReviewPreference: profile.foundationReviewPreference,
        hintFrequencySignal: profile.hintFrequencySignal,
        recentSignalSummary: profile.recentSignalSummary,
        lastUpdatedAt: profile.lastUpdatedAt,
        privacyMetadata: profile.privacyMetadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/recommendations/tuning-context', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const profile = await adaptiveRecommendationProfileService.getOrCreateProfile(identity);
    const supportLevel = await learnerSupportLevelCalibrationService.calibrateSupportLevel(identity, {
      recentTooHardCount: 0,
      recentTooEasyCount: 0,
      recentConfusionCount: 0,
      recentCorrectCount: 0,
      recentIncorrectCount: 0,
      recentIndependentSuccessCount: 0,
    });
    const supportDescription = learnerSupportLevelCalibrationService.getSupportLevelDescription(supportLevel);

    const tuningParts: string[] = [];
    tuningParts.push(`Your current support level is: ${profile.preferredSupportLevel}`);
    tuningParts.push(`Your step size preference is: ${profile.preferredStepSize}`);
    if (profile.foundationReviewPreference === 'high') {
      tuningParts.push('You prefer reviewing foundations before new topics.');
    }
    if (profile.challengeReadinessSignal === 'high') {
      tuningParts.push('You may be ready for challenges based on your activity.');
    }
    tuningParts.push(`Current calibration: ${supportDescription}`);

    res.json({
      ok: true,
      tuningContext: tuningParts.join(' '),
      supportLevel: {
        level: supportLevel,
        description: supportDescription,
      },
      profile: {
        preferredSupportLevel: profile.preferredSupportLevel,
        preferredStepSize: profile.preferredStepSize,
        practiceModePreference: profile.practiceModePreference,
        foundationReviewPreference: profile.foundationReviewPreference,
        challengeReadinessSignal: profile.challengeReadinessSignal,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.patch('/recommendations/preferences', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { preferredStepSize, preferredSupportLevel, challengePreference, examplePreference } = req.body;

    const updates: Record<string, any> = {};
    if (preferredStepSize) updates.preferredStepSize = preferredStepSize;
    if (preferredSupportLevel) updates.preferredSupportLevel = preferredSupportLevel;
    if (challengePreference) updates.challengeReadinessSignal = challengePreference;
    if (examplePreference) updates.practiceModePreference = examplePreference;

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'validation_error', 'At least one preference field is required');
    }

    const profile = await adaptiveRecommendationProfileService.updateProfileDirectly(identity, updates);

    res.json({
      ok: true,
      updated: Object.keys(updates),
      profile: {
        preferredSupportLevel: profile.preferredSupportLevel,
        preferredStepSize: profile.preferredStepSize,
        practiceModePreference: profile.practiceModePreference,
        challengeReadinessSignal: profile.challengeReadinessSignal,
        recentSignalSummary: profile.recentSignalSummary,
        lastUpdatedAt: profile.lastUpdatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

export default router;
