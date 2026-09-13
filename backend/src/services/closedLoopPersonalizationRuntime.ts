import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  ClosedLoopPersonalizationRequest,
  ClosedLoopPersonalizationResult,
  LearnerPreferenceResponseMetadata,
} from './learnerPreferenceFeedbackContracts';
import { learnerPreferenceFeedbackService as defaultFeedbackService } from './learnerPreferenceFeedbackService';
import { recommendationInteractionTrackingService as defaultInteractionService } from './recommendationInteractionTrackingService';
import { adaptiveRecommendationProfileService as defaultProfileService } from './adaptiveRecommendationProfileService';
import { adaptiveRecommendationTuningService } from './adaptiveRecommendationTuningService';
import { personalizationAuditService as defaultAuditService } from './personalizationAuditService';
import { validateFeedbackSafety, assertFeedbackIsSafe } from './preferenceFeedbackSafetyGuardService';
import type { LearnerPreferenceFeedbackService } from './learnerPreferenceFeedbackService';
import type { RecommendationInteractionTrackingService } from './recommendationInteractionTrackingService';
import type { AdaptiveRecommendationProfileService } from './adaptiveRecommendationProfileService';
import type { PersonalizationAuditService } from './personalizationAuditService';

export class ClosedLoopPersonalizationRuntime {
  private feedbackService: LearnerPreferenceFeedbackService;
  private interactionService: RecommendationInteractionTrackingService;
  private profileService: AdaptiveRecommendationProfileService;
  private auditService: PersonalizationAuditService;

  constructor(
    deps?: {
      feedbackService?: LearnerPreferenceFeedbackService;
      interactionService?: RecommendationInteractionTrackingService;
      profileService?: AdaptiveRecommendationProfileService;
      auditService?: PersonalizationAuditService;
    },
  ) {
    this.feedbackService = deps?.feedbackService || defaultFeedbackService;
    this.interactionService = deps?.interactionService || defaultInteractionService;
    this.profileService = deps?.profileService || defaultProfileService;
    this.auditService = deps?.auditService || defaultAuditService;
  }

  async processFeedback(input: ClosedLoopPersonalizationRequest): Promise<ClosedLoopPersonalizationResult> {
    const now = new Date().toISOString();

    if (!input.identity || !input.identity.studentId) {
      throw new Error('Learner identity is required');
    }

    if (!input.recommendationId) {
      throw new Error('Recommendation ID is required');
    }

    if (!input.feedback || !input.feedback.feedbackType) {
      throw new Error('Feedback type is required');
    }

    const safetyDecision = validateFeedbackSafety(input.feedback.feedbackType, input.feedback.freeText);
    assertFeedbackIsSafe(safetyDecision);

    const feedbackResult = await this.feedbackService.submitFeedback(
      input.identity,
      input.recommendationId,
      input.feedback,
    );

    const interactionRecord = await this.interactionService.recordInteraction(
      input.identity,
      input.recommendationId,
      {
        interactionType: input.interactionType || 'feedback_submitted',
        sessionId: input.sessionId || input.feedback.sessionId,
        subject: input.subject || input.feedback.subject,
        topic: input.topic || input.feedback.topic,
        skillTag: input.skillTag || input.feedback.skillTag,
      },
    );

    const updatedProfile = await this.profileService.updateProfileFromFeedback(
      input.identity,
      safetyDecision.feedbackType,
    );

    const tooHardCount = await this.interactionService.getRecentCountByType(input.identity, 'recommendation_skipped');
    const tooEasyCount = 0;
    const confusionCount = await this.interactionService.getRecentCountByType(input.identity, 'hint_requested');
    const challengeCount = await this.interactionService.getRecentCountByType(input.identity, 'challenge_requested');
    const teacherHelpCount = await this.interactionService.getRecentCountByType(input.identity, 'teacher_help_requested');
    const skipCount = await this.interactionService.getRecentCountByType(input.identity, 'recommendation_skipped');

    const tuningResult = adaptiveRecommendationTuningService.computeTuning({
      feedbackType: safetyDecision.feedbackType,
      profile: updatedProfile,
      recentTooHardCount: tooHardCount,
      recentTooEasyCount: tooEasyCount,
      recentConfusionCount: confusionCount,
      recentChallengeRequestCount: challengeCount,
      recentTeacherHelpRequestCount: teacherHelpCount,
      recentSkipCount: skipCount,
    });

    const auditRecord = await this.auditService.recordAudit({
      identity: input.identity,
      recommendationId: input.recommendationId,
      feedbackType: safetyDecision.feedbackType,
      interactionType: input.interactionType || 'feedback_submitted',
      tuningReasonCodes: tuningResult.reasonCodes,
      deenSensitivityHandled: safetyDecision.safetyFlags.includes('deen_sensitive_text_detected'),
      safeguardingBoundaryApplied: safetyDecision.safetyFlags.includes('safeguarding_concern_detected'),
      sessionId: input.sessionId || input.feedback.sessionId,
    });

    const privacyMetadata: LearnerPreferenceResponseMetadata = {
      rawChatExcluded: true,
      rawPromptExcluded: true,
      privateMemoryExcluded: true,
      teacherOnlyNotesExcluded: true,
      safeguardingBoundaryApplied: safetyDecision.safetyFlags.includes('safeguarding_concern_detected'),
      deenSensitivityHandled: safetyDecision.safetyFlags.includes('deen_sensitive_text_detected'),
    };

    return {
      feedbackAccepted: true,
      safeFeedbackType: safetyDecision.feedbackType,
      profileUpdated: true,
      tuningApplied: true,
      nextRecommendationPreview: tuningResult.nextRecommendationConstraints.length > 0
        ? `Next steps adjusted: ${tuningResult.nextRecommendationConstraints.join(', ')}`
        : null,
      learnerFriendlyAcknowledgement: feedbackResult.learnerFriendlyAcknowledgement,
      privacyMetadata,
      auditRecord,
      createdAt: now,
    };
  }
}

export const closedLoopPersonalizationRuntime = new ClosedLoopPersonalizationRuntime();
