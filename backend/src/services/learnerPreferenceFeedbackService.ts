import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  LearnerPreferenceFeedbackRequest,
  LearnerPreferenceFeedbackResult,
  LearnerPreferenceFeedbackType,
  LearnerPreferenceResponseMetadata,
} from './learnerPreferenceFeedbackContracts';
import { LEARNER_PREFERENCE_FEEDBACK_TYPES } from './learnerPreferenceFeedbackContracts';
import { validateFeedbackSafety, assertFeedbackIsSafe } from './preferenceFeedbackSafetyGuardService';
import type { ILearnerPreferenceFeedbackRepository } from './learnerPreferenceFeedbackRepository';
import { learnerPreferenceFeedbackRepository as defaultRepository } from './learnerPreferenceFeedbackRepository';

function generateId(): string {
  return `pref-fb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class LearnerPreferenceFeedbackService {
  private repository: ILearnerPreferenceFeedbackRepository;

  constructor(repository?: ILearnerPreferenceFeedbackRepository) {
    this.repository = repository || defaultRepository;
  }

  async submitFeedback(
    identity: ResolvedTutorIdentity,
    recommendationId: string,
    request: LearnerPreferenceFeedbackRequest,
  ): Promise<LearnerPreferenceFeedbackResult> {
    const now = new Date().toISOString();

    if (!identity || !identity.studentId) {
      throw new Error('Learner identity is required');
    }

    if (!recommendationId) {
      throw new Error('Recommendation ID is required');
    }

    if (!request.feedbackType) {
      throw new Error('Feedback type is required');
    }

    if (!LEARNER_PREFERENCE_FEEDBACK_TYPES.includes(request.feedbackType)) {
      throw new Error(`Unsupported feedback type: ${request.feedbackType}`);
    }

    const safetyDecision = validateFeedbackSafety(request.feedbackType, request.freeText);
    assertFeedbackIsSafe(safetyDecision);

    const id = generateId();
    await this.repository.create({
      id,
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      studentId: identity.studentId,
      sessionId: request.sessionId,
      recommendationId,
      recommendationType: request.feedbackType,
      feedbackType: safetyDecision.feedbackType,
      subject: request.subject,
      topic: request.topic,
      skillTag: request.skillTag,
      safetyFlags: safetyDecision.safetyFlags,
      privacyMetadata: {
        rawChatExcluded: true,
        rawPromptExcluded: true,
        privateMemoryExcluded: true,
        teacherOnlyNotesExcluded: true,
        safeguardingBoundaryApplied: safetyDecision.safetyFlags.includes('safeguarding_concern_detected'),
        deenSensitivityHandled: safetyDecision.safetyFlags.includes('deen_sensitive_text_detected'),
      },
    });

    const ackMessage = getAcknowledgementForFeedbackType(safetyDecision.feedbackType);

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
      interactionRecorded: true,
      profileUpdated: false,
      tuningApplied: false,
      supportLevelAdjustment: 'none',
      learnerFriendlyAcknowledgement: ackMessage,
      privacyMetadata,
      createdAt: now,
    };
  }

  async getFeedbackCount(): Promise<number> {
    return this.repository.count();
  }

  async getFeedbacksForLearner(identity: ResolvedTutorIdentity): Promise<Array<{
    feedbackType: LearnerPreferenceFeedbackType;
    recommendationId: string;
    createdAt: string;
  }>> {
    const rows = await this.repository.findByLearner(identity.schoolId, identity.studentId);
    return rows.map((r) => ({
      feedbackType: r.feedbackType as LearnerPreferenceFeedbackType,
      recommendationId: r.recommendationId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getFeedbackCountByType(identity: ResolvedTutorIdentity): Promise<Record<string, number>> {
    return this.repository.countByType(identity.schoolId, identity.studentId);
  }

  hasCrossStudentAccess(
    identity: ResolvedTutorIdentity,
    targetStudentId: string,
  ): boolean {
    return identity.studentId === targetStudentId;
  }
}

export const learnerPreferenceFeedbackService = new LearnerPreferenceFeedbackService();

function getAcknowledgementForFeedbackType(type: LearnerPreferenceFeedbackType): string {
  const acknowledgements: Record<LearnerPreferenceFeedbackType, string> = {
    too_easy: 'Thank you. I will consider a more suitable challenge based on your progress.',
    too_hard: 'Thank you. I will make the next steps smaller and more supported.',
    just_right: 'Thank you. I will aim to keep the pace just right for you.',
    still_confused: 'Thank you. Let us strengthen the foundation and try a smaller step.',
    understood: 'Thank you for confirming. I will use this to track your confidence.',
    not_helpful: 'Thank you. I will adjust the approach to better support your learning.',
    helpful: 'Thank you. I will continue using similar approaches.',
    want_hint: 'Here is a hint to guide your thinking without giving away the answer.',
    want_foundation_review: 'Let us revisit the foundation concepts to build confidence.',
    want_similar_practice: 'Let us try a similar problem to reinforce your understanding.',
    want_challenge: 'I will check if you are ready for a challenge based on your progress.',
    want_teacher_help: 'I will suggest teacher support options for this topic.',
    not_now: 'Understood. This recommendation can wait for now.',
    shorter_steps: 'Thank you. I will break future steps into smaller pieces.',
    more_examples: 'Thank you. I will include more examples in future recommendations.',
    slower_pace: 'Thank you. I will adjust to a slower pace for this topic.',
    faster_pace: 'Thank you. I will adjust to a slightly faster pace where appropriate.',
  };
  return acknowledgements[type] || 'Thank you for your feedback.';
}
