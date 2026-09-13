import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  LearnerRecommendationType,
  LearnerReasonCode,
  LearnerRecommendationPriority,
} from './learnerTransparencyContracts';
import {
  getRecommendationPriority,
} from './learnerTransparencyContracts';
import { learnerProgressStateService } from './mastery/learnerProgressStateService';
import { masteryService } from './masteryService';
import { spacedReviewService } from './spacedReviewService';
import { weakSkillTrackingService } from './mastery/weakSkillTrackingService';
import { revisionSchedulingRuntime } from './mastery/revisionSchedulingRuntime';

export interface ResolvedRecommendation {
  recommendationType: LearnerRecommendationType;
  reasonCode: LearnerReasonCode;
  priority: LearnerRecommendationPriority;
  subject: string;
  topic: string;
  skillLabel: string;
  evidenceSummary: string;
}

function nowISO(): string {
  return new Date().toISOString();
}

export class NextStepRecommendationResolver {
  async resolveNextStep(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      mode?: 'practice' | 'revision' | 'challenge' | 'continue';
    },
  ): Promise<{
    recommendation: ResolvedRecommendation | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const mode = options?.mode;

    if (mode === 'continue') {
      const sessionRec = await this._tryContinueSession(identity, options);
      if (sessionRec) return { recommendation: sessionRec, warnings };
    }

    const urgentRev = await this._tryUrgentRevision(identity, options);
    if (urgentRev) return { recommendation: urgentRev, warnings };

    const overdueReview = await this._tryOverdueSpacedReview(identity, options);
    if (overdueReview) return { recommendation: overdueReview, warnings };

    const mistakePattern = await this._tryMistakePatternReview(identity, options);
    if (mistakePattern) return { recommendation: mistakePattern, warnings };

    const foundationReview = await this._tryFoundationReview(identity, options);
    if (foundationReview) return { recommendation: foundationReview, warnings };

    const masteryCheck = await this._tryMasteryCheck(identity, options);
    if (masteryCheck) return { recommendation: masteryCheck, warnings };

    const challengePractice = await this._tryChallengePractice(identity, options);
    if (challengePractice) return { recommendation: challengePractice, warnings };

    const similarPractice = await this._trySimilarPractice(identity, options);
    if (similarPractice) return { recommendation: similarPractice, warnings };

    const teacherHelp = await this._tryTeacherHelpSuggestion(identity, options);
    if (teacherHelp) return { recommendation: teacherHelp, warnings };

    const deenReferral = await this._tryDeenTeacherReferral(identity, options);
    if (deenReferral) return { recommendation: deenReferral, warnings };

    return { recommendation: null, warnings };
  }

  private async _tryUrgentRevision(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const progressState = await learnerProgressStateService.refreshProgressState(identity);
      const state = progressState.state;
      if (!state) return null;

      const urgentItems = state.needsReview.filter((n) => n.priority === 'high');
      if (urgentItems.length === 0) return null;

      const item = urgentItems[0];
      return {
        recommendationType: 'revision_due',
        reasonCode: 'revision_due_skill',
        priority: getRecommendationPriority('revision_due'),
        subject: state.subjects[0] || options?.subject || '',
        topic: '',
        skillLabel: item.skillLabel,
        evidenceSummary: `Urgent revision needed for ${item.skillLabel} (priority: ${item.priority})`,
      };
    } catch {
      return null;
    }
  }

  private async _tryOverdueSpacedReview(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const reviewState = weakSkillTrackingService.listWeakSkills(identity, { limit: 10 });
      const overdue = reviewState.find((r) => r.status === 'needs_review' && r.priority === 'high');

      if (!overdue) {
        const progress = await learnerProgressStateService.refreshProgressState(identity);
        if (progress.state && progress.state.needsReview.length > 0) {
          const needsReview = progress.state.needsReview[0];
          return {
            recommendationType: 'spaced_review',
            reasonCode: 'overdue_spaced_review',
            priority: getRecommendationPriority('spaced_review'),
            subject: options?.subject || progress.state.subjects[0] || '',
            topic: '',
            skillLabel: needsReview.skillLabel,
            evidenceSummary: `Spaced review due for ${needsReview.skillLabel}`,
          };
        }
      }

      if (overdue) {
        return {
          recommendationType: 'spaced_review',
          reasonCode: 'overdue_spaced_review',
          priority: getRecommendationPriority('spaced_review'),
          subject: options?.subject || '',
          topic: '',
          skillLabel: overdue.skillLabel,
          evidenceSummary: `Overdue spaced review for ${overdue.skillLabel}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async _tryMistakePatternReview(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const weakSkills = weakSkillTrackingService.listWeakSkills(identity, { limit: 20 });
      const recentStruggle = weakSkills.find(
        (w) => w.status === 'recently_struggled' && w.mistakeCount >= 2,
      );
      if (!recentStruggle) return null;

      return {
        recommendationType: 'mistake_pattern_review',
        reasonCode: 'mistake_pattern_detected',
        priority: getRecommendationPriority('mistake_pattern_review'),
        subject: options?.subject || '',
        topic: '',
        skillLabel: recentStruggle.skillLabel,
        evidenceSummary: `Mistake pattern detected: ${recentStruggle.mistakeCount} mistakes in ${recentStruggle.skillLabel}`,
      };
    } catch {
      return null;
    }
  }

  private async _tryFoundationReview(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const progressState = await learnerProgressStateService.refreshProgressState(identity);
      const state = progressState.state;
      if (!state) return null;

      const developing = state.needsReview.filter(
        (n) => n.priority === 'medium' || n.priority === 'low',
      );
      if (developing.length === 0) return null;

      const item = developing[0];
      return {
        recommendationType: 'foundation_review',
        reasonCode: 'low_mastery_foundation',
        priority: getRecommendationPriority('foundation_review'),
        subject: state.subjects[0] || options?.subject || '',
        topic: '',
        skillLabel: item.skillLabel,
        evidenceSummary: `Foundation review for developing skill: ${item.skillLabel}`,
      };
    } catch {
      return null;
    }
  }

  private async _tryMasteryCheck(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const progressState = await learnerProgressStateService.refreshProgressState(identity);
      const state = progressState.state;
      if (!state) return null;

      if (state.totalMastered === 0 && state.improving.length > 0) {
        return {
          recommendationType: 'mastery_check',
          reasonCode: 'developing_skill',
          priority: getRecommendationPriority('mastery_check'),
          subject: state.subjects[0] || options?.subject || '',
          topic: '',
          skillLabel: state.improving[0].skillLabel,
          evidenceSummary: `Mastery check for developing skill: ${state.improving[0].skillLabel}`,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async _tryChallengePractice(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const progressState = await learnerProgressStateService.refreshProgressState(identity);
      const state = progressState.state;
      if (!state) return null;

      const readyForChallenge = state.readyForChallenge;
      if (readyForChallenge.length === 0) return null;

      return {
        recommendationType: 'challenge_practice',
        reasonCode: 'secure_mastery_ready',
        priority: getRecommendationPriority('challenge_practice'),
        subject: state.subjects[0] || options?.subject || '',
        topic: '',
        skillLabel: readyForChallenge[0].skillLabel,
        evidenceSummary: `Challenge ready for strong skill: ${readyForChallenge[0].skillLabel}`,
      };
    } catch {
      return null;
    }
  }

  private async _trySimilarPractice(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const progressState = await learnerProgressStateService.refreshProgressState(identity);
      const state = progressState.state;
      if (!state) return null;

      if (state.improving.length > 0) {
        return {
          recommendationType: 'similar_practice',
          reasonCode: 'developing_skill',
          priority: getRecommendationPriority('similar_practice'),
          subject: state.subjects[0] || options?.subject || '',
          topic: '',
          skillLabel: state.improving[0].skillLabel,
          evidenceSummary: `Similar practice for developing skill: ${state.improving[0].skillLabel}`,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async _tryTeacherHelpSuggestion(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      const weakSkills = weakSkillTrackingService.listWeakSkills(identity, { limit: 20 });
      const repeatedStruggle = weakSkills.filter(
        (w) => w.status === 'needs_review' && w.mistakeCount >= 3,
      );
      if (repeatedStruggle.length === 0) return null;

      const item = repeatedStruggle[0];
      return {
        recommendationType: 'teacher_help_suggested',
        reasonCode: 'recent_struggle_suggest_help',
        priority: getRecommendationPriority('teacher_help_suggested'),
        subject: options?.subject || '',
        topic: '',
        skillLabel: item.skillLabel,
        evidenceSummary: `Repeated struggle in ${item.skillLabel} (${item.mistakeCount} mistakes) - teacher help suggested`,
      };
    } catch {
      return null;
    }
  }

  private async _tryDeenTeacherReferral(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; topic?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      if (options?.subject && options.subject.toLowerCase().includes('deen')) {
        return {
          recommendationType: 'deen_teacher_referral',
          reasonCode: 'source_sensitive_deen_referral',
          priority: getRecommendationPriority('deen_teacher_referral'),
          subject: options.subject,
          topic: options?.topic || '',
          skillLabel: options?.topic || 'Deen studies',
          evidenceSummary: `Deen-sensitive topic requires teacher referral: ${options.topic || options.subject}`,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async _tryContinueSession(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; sessionId?: string },
  ): Promise<ResolvedRecommendation | null> {
    try {
      if (!options?.sessionId) return null;
      return {
        recommendationType: 'continue_current_session',
        reasonCode: 'current_session_continuation',
        priority: getRecommendationPriority('continue_current_session'),
        subject: options.subject || '',
        topic: '',
        skillLabel: 'current session',
        evidenceSummary: 'Continue current learning session',
      };
    } catch {
      return null;
    }
  }
}

export const nextStepRecommendationResolver = new NextStepRecommendationResolver();
