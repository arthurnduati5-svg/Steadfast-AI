import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  AdaptiveRecommendationProfile,
  LearnerPreferenceFeedbackType,
  LearnerSupportLevel,
  LearnerStepSizePreference,
  LearnerPracticeModePreference,
  LearnerPreferenceResponseMetadata,
} from './learnerPreferenceFeedbackContracts';
import type { IAdaptiveRecommendationProfileRepository } from './adaptiveRecommendationProfileRepository';
import { adaptiveRecommendationProfileRepository as defaultRepository } from './adaptiveRecommendationProfileRepository';

export class AdaptiveRecommendationProfileService {
  private repository: IAdaptiveRecommendationProfileRepository;

  constructor(repository?: IAdaptiveRecommendationProfileRepository) {
    this.repository = repository || defaultRepository;
  }

  async getOrCreateProfile(identity: ResolvedTutorIdentity): Promise<AdaptiveRecommendationProfile> {
    const row = await this.repository.findByLearner(identity.schoolId, identity.studentId);
    if (!row) {
      return this.createDefaultProfile();
    }
    return this.rowToProfile(row);
  }

  private rowToProfile(row: {
    preferredSupportLevel: string;
    preferredStepSize: string;
    practiceModePreference: string;
    challengeReadinessSignal: string;
    foundationReviewPreference: string;
    hintFrequencySignal: string;
    difficultyCalibration: number;
    profileSnapshot: unknown;
    privacyMetadata: unknown;
    updatedAt: Date;
  }): AdaptiveRecommendationProfile {
    const snap = row.profileSnapshot as Record<string, unknown> | null;
    return {
      preferredSupportLevel: row.preferredSupportLevel as LearnerSupportLevel,
      preferredStepSize: row.preferredStepSize as LearnerStepSizePreference,
      practiceModePreference: row.practiceModePreference as LearnerPracticeModePreference,
      challengeReadinessSignal: row.challengeReadinessSignal as 'low' | 'medium' | 'high',
      foundationReviewPreference: row.foundationReviewPreference as 'low' | 'medium' | 'high',
      hintFrequencySignal: row.hintFrequencySignal as 'low' | 'medium' | 'high',
      difficultyCalibration: row.difficultyCalibration,
      recentSignalSummary: (snap?.recentSignalSummary as string) || 'No recent preference signals',
      lastUpdatedAt: row.updatedAt.toISOString(),
      privacyMetadata: (row.privacyMetadata as LearnerPreferenceResponseMetadata) || {
        rawChatExcluded: true,
        rawPromptExcluded: true,
        privateMemoryExcluded: true,
        teacherOnlyNotesExcluded: true,
        safeguardingBoundaryApplied: false,
        deenSensitivityHandled: false,
      },
    };
  }

  private createDefaultProfile(): AdaptiveRecommendationProfile {
    return {
      preferredSupportLevel: 'guided_support',
      preferredStepSize: 'standard',
      practiceModePreference: 'balanced',
      challengeReadinessSignal: 'medium',
      foundationReviewPreference: 'medium',
      hintFrequencySignal: 'medium',
      difficultyCalibration: 0.5,
      recentSignalSummary: 'No recent preference signals',
      lastUpdatedAt: new Date().toISOString(),
      privacyMetadata: {
        rawChatExcluded: true,
        rawPromptExcluded: true,
        privateMemoryExcluded: true,
        teacherOnlyNotesExcluded: true,
        safeguardingBoundaryApplied: false,
        deenSensitivityHandled: false,
      },
    };
  }

  async updateProfileFromFeedback(
    identity: ResolvedTutorIdentity,
    feedbackType: LearnerPreferenceFeedbackType,
  ): Promise<AdaptiveRecommendationProfile> {
    const current = await this.getOrCreateProfile(identity);
    const now = new Date().toISOString();

    const updated = { ...current, lastUpdatedAt: now };

    switch (feedbackType) {
      case 'too_hard':
        updated.preferredSupportLevel = this._increaseSupport(updated.preferredSupportLevel);
        updated.preferredStepSize = updated.preferredStepSize === 'shorter' ? 'shorter' : 'shorter';
        updated.difficultyCalibration = Math.max(0, updated.difficultyCalibration - 0.1);
        updated.hintFrequencySignal = this._increaseSignal(updated.hintFrequencySignal);
        updated.foundationReviewPreference = this._increaseSignal(updated.foundationReviewPreference);
        break;

      case 'still_confused':
        updated.foundationReviewPreference = this._increaseSignal(updated.foundationReviewPreference);
        updated.preferredSupportLevel = this._increaseSupport(updated.preferredSupportLevel);
        updated.hintFrequencySignal = this._increaseSignal(updated.hintFrequencySignal);
        updated.difficultyCalibration = Math.max(0, updated.difficultyCalibration - 0.05);
        break;

      case 'too_easy':
        updated.challengeReadinessSignal = this._increaseSignal(updated.challengeReadinessSignal);
        updated.difficultyCalibration = Math.min(1, updated.difficultyCalibration + 0.1);
        break;

      case 'understood':
        updated.difficultyCalibration = Math.min(1, updated.difficultyCalibration + 0.05);
        updated.hintFrequencySignal = this._decreaseSignal(updated.hintFrequencySignal);
        break;

      case 'want_hint':
        updated.hintFrequencySignal = this._increaseSignal(updated.hintFrequencySignal);
        break;

      case 'want_challenge':
        updated.challengeReadinessSignal = this._increaseSignal(updated.challengeReadinessSignal);
        break;

      case 'want_foundation_review':
        updated.foundationReviewPreference = this._increaseSignal(updated.foundationReviewPreference);
        break;

      case 'shorter_steps':
        updated.preferredStepSize = 'shorter';
        break;

      case 'slower_pace':
        updated.preferredStepSize = 'shorter';
        break;

      case 'faster_pace':
        updated.preferredStepSize = 'longer';
        break;

      case 'more_examples':
        updated.practiceModePreference = 'more_examples';
        break;

      case 'want_similar_practice':
        updated.practiceModePreference = 'more_practice';
        break;

      case 'not_helpful':
        updated.difficultyCalibration = Math.max(0, updated.difficultyCalibration - 0.05);
        break;

      case 'helpful':
        updated.difficultyCalibration = Math.min(1, updated.difficultyCalibration + 0.03);
        break;

      case 'want_teacher_help':
        updated.preferredSupportLevel = 'teacher_support_recommended';
        break;

      case 'just_right':
        break;

      case 'not_now':
        break;
    }

    updated.recentSignalSummary = this._buildSummary(updated);

    await this.repository.upsert({
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      preferredSupportLevel: updated.preferredSupportLevel,
      preferredStepSize: updated.preferredStepSize,
      practiceModePreference: updated.practiceModePreference,
      challengeReadinessSignal: updated.challengeReadinessSignal,
      foundationReviewPreference: updated.foundationReviewPreference,
      hintFrequencySignal: updated.hintFrequencySignal,
      difficultyCalibration: updated.difficultyCalibration,
      profileSnapshot: { recentSignalSummary: updated.recentSignalSummary },
      privacyMetadata: updated.privacyMetadata,
    });

    return { ...updated };
  }

  async hasProfile(identity: ResolvedTutorIdentity): Promise<boolean> {
    const row = await this.repository.findByLearner(identity.schoolId, identity.studentId);
    return row !== null;
  }

  async deleteProfile(identity: ResolvedTutorIdentity): Promise<void> {
    await this.repository.deleteByLearner(identity.schoolId, identity.studentId);
  }

  async updateProfileDirectly(
    identity: ResolvedTutorIdentity,
    updates: Partial<AdaptiveRecommendationProfile>,
  ): Promise<AdaptiveRecommendationProfile> {
    const current = await this.getOrCreateProfile(identity);
    const updated = { ...current, ...updates, lastUpdatedAt: new Date().toISOString() };

    if (updated.recentSignalSummary) {
      await this.repository.upsert({
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        preferredSupportLevel: updated.preferredSupportLevel,
        preferredStepSize: updated.preferredStepSize,
        practiceModePreference: updated.practiceModePreference,
        challengeReadinessSignal: updated.challengeReadinessSignal,
        foundationReviewPreference: updated.foundationReviewPreference,
        hintFrequencySignal: updated.hintFrequencySignal,
        difficultyCalibration: updated.difficultyCalibration,
        profileSnapshot: { recentSignalSummary: updated.recentSignalSummary },
        privacyMetadata: updated.privacyMetadata,
      });
    } else {
      await this.repository.upsert({
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        preferredSupportLevel: updated.preferredSupportLevel,
        preferredStepSize: updated.preferredStepSize,
        practiceModePreference: updated.practiceModePreference,
        challengeReadinessSignal: updated.challengeReadinessSignal,
        foundationReviewPreference: updated.foundationReviewPreference,
        hintFrequencySignal: updated.hintFrequencySignal,
        difficultyCalibration: updated.difficultyCalibration,
        privacyMetadata: updated.privacyMetadata,
      });
    }

    return { ...updated };
  }

  private _increaseSupport(current: LearnerSupportLevel): LearnerSupportLevel {
    const levels: LearnerSupportLevel[] = [
      'minimal_support', 'light_support', 'guided_support',
      'step_by_step_support', 'foundation_rebuild', 'teacher_support_recommended',
    ];
    const idx = levels.indexOf(current);
    if (idx < levels.length - 1) return levels[idx + 1];
    return current;
  }

  private _increaseSignal(current: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    if (current === 'low') return 'medium';
    if (current === 'medium') return 'high';
    return 'high';
  }

  private _decreaseSignal(current: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    if (current === 'high') return 'medium';
    if (current === 'medium') return 'low';
    return 'low';
  }

  private _buildSummary(profile: AdaptiveRecommendationProfile): string {
    const parts: string[] = [];
    parts.push(`Support: ${profile.preferredSupportLevel}`);
    parts.push(`Step size: ${profile.preferredStepSize}`);
    parts.push(`Challenge readiness: ${profile.challengeReadinessSignal}`);
    parts.push(`Foundation review preference: ${profile.foundationReviewPreference}`);
    return parts.join('; ');
  }
}

export const adaptiveRecommendationProfileService = new AdaptiveRecommendationProfileService();
