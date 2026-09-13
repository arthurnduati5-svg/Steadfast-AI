import type { ResolvedRecommendation } from './learnerNextStepRecommendationResolver';
import type {
  LearnerAgencyOption,
  LearnerRecommendationType,
} from './learnerTransparencyContracts';

let optionCounter = 0;
function generateOptionId(): string {
  optionCounter++;
  return `opt-${Date.now()}-${optionCounter}`;
}

export function buildLearnerAgencyOptions(
  recommendation: ResolvedRecommendation,
): LearnerAgencyOption[] {
  const options: LearnerAgencyOption[] = [];
  const type = recommendation.recommendationType;

  options.push({
    optionId: generateOptionId(),
    optionType: 'start_recommended',
    label: 'Start recommended step',
    studentFriendlyDescription: `Begin the recommended ${recommendation.skillLabel} activity.`,
    recommended: true,
    available: true,
  });

  if (type !== 'deen_teacher_referral') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'review_foundation',
      label: 'Review foundation first',
      studentFriendlyDescription: 'Review the basic ideas before starting.',
      recommended: false,
      available: true,
    });
  }

  if (type !== 'challenge_practice' && type !== 'deen_teacher_referral') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'try_similar',
      label: 'Try a similar example',
      studentFriendlyDescription: 'Practice with a similar problem first.',
      recommended: false,
      available: true,
    });
  }

  if (type === 'challenge_practice' || type === 'mastery_check') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'try_challenge',
      label: 'Try a challenge',
      studentFriendlyDescription: 'Attempt a more challenging problem to stretch your understanding.',
      recommended: false,
      available: true,
    });
  }

  if (type !== 'deen_teacher_referral') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'ask_for_hint',
      label: 'Ask for a hint',
      studentFriendlyDescription: 'Get a small hint to help you get started.',
      recommended: false,
      available: true,
    });
  }

  options.push({
    optionId: generateOptionId(),
    optionType: 'explain_back',
    label: 'Explain it back',
    studentFriendlyDescription: 'Try explaining the concept in your own words.',
    recommended: false,
    available: true,
  });

  if (type !== 'deen_teacher_referral') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'request_teacher_help',
      label: 'Request teacher help',
      studentFriendlyDescription: 'Ask your teacher for guidance on this topic.',
      recommended: false,
      available: type === 'teacher_help_suggested' || type === 'revision_due',
      unavailableReason: type !== 'teacher_help_suggested' && type !== 'revision_due'
        ? 'Teacher help is available if you continue to find this challenging.'
        : undefined,
    });
  }

  if (type === 'challenge_practice') {
    options.push({
      optionId: generateOptionId(),
      optionType: 'skip_for_now_with_reason',
      label: 'Try easier practice',
      studentFriendlyDescription: 'Practice with a simpler problem first, then try the challenge later.',
      recommended: false,
      available: true,
    });
  }

  return options;
}

export function isOptionAvailableForType(
  optionType: string,
  recommendationType: LearnerRecommendationType,
): boolean {
  if (optionType === 'deen_teacher_referral' && recommendationType !== 'deen_teacher_referral') {
    return false;
  }
  if (optionType === 'try_challenge' && recommendationType === 'foundation_review') {
    return false;
  }
  return true;
}

export function buildLearnerAgencyPreferenceOption(
  feedback: string,
): LearnerAgencyOption {
  return {
    optionId: generateOptionId(),
    optionType: 'preference_feedback',
    label: 'Share your preference',
    studentFriendlyDescription: `You indicated this was ${feedback.replace('_', ' ')}.`,
    recommended: false,
    available: true,
  };
}
