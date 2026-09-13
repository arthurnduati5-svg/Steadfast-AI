import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  LearnerSupportLevel,
  LearnerPreferenceFeedbackType,
} from './learnerPreferenceFeedbackContracts';
import { SUPPORT_LEVELS } from './learnerPreferenceFeedbackContracts';
import { adaptiveRecommendationProfileService as defaultProfileService } from './adaptiveRecommendationProfileService';
import type { AdaptiveRecommendationProfileService } from './adaptiveRecommendationProfileService';

export class LearnerSupportLevelCalibrationService {
  private profileService: AdaptiveRecommendationProfileService;

  constructor(profileService?: AdaptiveRecommendationProfileService) {
    this.profileService = profileService || defaultProfileService;
  }

  async calibrateSupportLevel(
    identity: ResolvedTutorIdentity,
    evidence: {
      recentTooHardCount: number;
      recentTooEasyCount: number;
      recentConfusionCount: number;
      recentCorrectCount: number;
      recentIncorrectCount: number;
      recentIndependentSuccessCount: number;
      masteryLevel?: string;
    },
    feedbackSignals?: LearnerPreferenceFeedbackType[],
  ): Promise<LearnerSupportLevel> {
    let supportIndex = 2;

    if (evidence.recentTooHardCount >= 2) supportIndex += 1;
    if (evidence.recentConfusionCount >= 2) supportIndex += 1;
    if (evidence.recentIncorrectCount >= 3) supportIndex += 1;

    if (evidence.recentIndependentSuccessCount >= 3) supportIndex -= 1;
    if (evidence.recentCorrectCount >= 5 && evidence.recentTooHardCount === 0) supportIndex = Math.max(0, supportIndex - 1);

    if (evidence.recentTooEasyCount >= 3 && evidence.recentCorrectCount >= 5) supportIndex = Math.max(0, supportIndex - 1);

    if (feedbackSignals) {
      for (const signal of feedbackSignals) {
        switch (signal) {
          case 'too_hard':
          case 'still_confused':
          case 'want_hint':
          case 'want_foundation_review':
          case 'shorter_steps':
          case 'slower_pace':
            supportIndex += 1;
            break;
          case 'too_easy':
          case 'understood':
          case 'faster_pace':
            supportIndex = Math.max(0, supportIndex - 1);
            break;
          case 'want_challenge':
            if (evidence.masteryLevel === 'proficient' || evidence.masteryLevel === 'mastered') {
              supportIndex = Math.max(0, supportIndex - 1);
            }
            break;
          case 'want_teacher_help':
            supportIndex = Math.max(supportIndex, 4);
            break;
        }
      }
    }

    const profile = await this.profileService.getOrCreateProfile(identity);
    const profileSupportIdx = SUPPORT_LEVELS.indexOf(profile.preferredSupportLevel);
    if (profileSupportIdx > supportIndex + 1) {
      supportIndex = Math.max(supportIndex, profileSupportIdx - 1);
    }

    supportIndex = Math.max(0, Math.min(SUPPORT_LEVELS.length - 1, supportIndex));
    return SUPPORT_LEVELS[supportIndex];
  }

  getSupportLevelDescription(level: LearnerSupportLevel): string {
    const descriptions: Record<LearnerSupportLevel, string> = {
      minimal_support: 'You can work independently. Check in when needed.',
      light_support: 'Light guidance is available if you get stuck.',
      guided_support: 'The tutor will guide each step with prompts.',
      step_by_step_support: 'The tutor will break problems into very small steps.',
      foundation_rebuild: 'Let us revisit foundational concepts before moving forward.',
      teacher_support_recommended: 'Your teacher may offer the best support for this topic.',
    };
    return descriptions[level] || 'Support is available as needed.';
  }
}

export const learnerSupportLevelCalibrationService = new LearnerSupportLevelCalibrationService();
