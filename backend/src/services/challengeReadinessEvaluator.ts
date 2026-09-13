import type {
  ChallengeReadinessInput,
  ChallengeReadinessDecision,
  ChallengeReadinessVerdict,
  AdaptiveChallengeType,
  DifficultyLevel,
} from './task015Contracts';

export function v<T>(value: T, def: T): T {
  return value ?? def;
}

export class ChallengeReadinessEvaluator {
  evaluate(input: ChallengeReadinessInput): ChallengeReadinessDecision {
    const mastery = input.masteryLevel;
    const evidenceCount = input.evidenceCount;
    const independentSuccess = v(input.recentIndependentSuccessCount, 0);
    const hintUsage = v(input.recentHintUsage, 0);
    const mistakes = v(input.recentMistakeCount, 0);
    const repeatedMistakes = v(input.repeatedMistakeSignals, 0);
    const revisionPriority = input.revisionPriority;
    const spacedDue = input.spacedReviewDue;
    const preference = v(input.learnerChallengePreference, 'medium');

    const reasonCodes: string[] = [];
    let verdict: ChallengeReadinessVerdict;
    let suggestedType: AdaptiveChallengeType;
    let difficulty: DifficultyLevel;
    let why: string;
    let confidence = 0.5;

    const hasHighHintDependency = hintUsage > 2 && independentSuccess < 1;
    const hasRepeatedMistakes = repeatedMistakes > 1;
    const hasIndependentSuccess = independentSuccess >= 2;
    const isStruggling = mistakes >= 2 || repeatedMistakes > 0;

    if (mastery === 'not_started' || mastery === 'emerging') {
      if (hasRepeatedMistakes || isStruggling) {
        verdict = 'foundation_needed';
        suggestedType = 'foundation_remediation';
        difficulty = 'foundation';
        reasonCodes.push('mastery_low', 'struggle_detected');
        why = 'Let us strengthen the foundation first. This will make future steps easier to build on.';
        confidence = 0.8;
      } else {
        verdict = 'foundation_needed';
        suggestedType = 'foundation_remediation';
        difficulty = 'foundation';
        reasonCodes.push('mastery_low', 'insufficient_evidence');
        why = 'Building a secure foundation now will make the challenge ahead much smoother.';
        confidence = 0.7;
      }
    } else if (mastery === 'developing') {
      if (hasRepeatedMistakes) {
        verdict = 'remediation_needed';
        suggestedType = 'foundation_remediation';
        difficulty = 'easy';
        reasonCodes.push('developing_mastery', 'repeated_mistakes');
        why = 'A few targeted steps will repair the specific skill gaps holding you back.';
        confidence = 0.7;
      } else if (hasHighHintDependency) {
        verdict = 'similar_practice';
        suggestedType = 'similar_practice';
        difficulty = 'easy';
        reasonCodes.push('developing_mastery', 'hint_dependency');
        why = 'More independent practice will prepare you for the next level.';
        confidence = 0.65;
      } else if (hasIndependentSuccess) {
        verdict = 'light_challenge_ready';
        suggestedType = 'light_challenge';
        difficulty = 'standard';
        reasonCodes.push('developing_improving', 'independent_success');
        why = 'Your recent progress shows you are nearly ready for a gentle challenge.';
        confidence = 0.6;
      } else {
        verdict = 'similar_practice';
        suggestedType = 'similar_practice';
        difficulty = 'standard';
        reasonCodes.push('developing_needs_more_evidence');
        why = 'A little more practice will confirm you are ready for the next step.';
        confidence = 0.55;
      }
    } else if (mastery === 'secure') {
      if (revisionPriority === 'high' || spacedDue) {
        verdict = 'similar_practice';
        suggestedType = 'spaced_review_item';
        difficulty = 'standard';
        reasonCodes.push('secure_mastery', 'revision_due');
        why = 'A quick review will keep this knowledge fresh before moving forward.';
        confidence = 0.7;
      } else if (hasRepeatedMistakes) {
        verdict = 'remediation_needed';
        suggestedType = 'foundation_remediation';
        difficulty = 'easy';
        reasonCodes.push('secure_mastery', 'unexpected_mistakes');
        why = 'Let us address these specific gaps so your understanding stays solid.';
        confidence = 0.6;
      } else {
        verdict = 'standard_challenge_ready';
        suggestedType = 'standard_challenge';
        difficulty = 'challenging';
        reasonCodes.push('secure_mastery', 'ready_for_challenge');
        why = 'You have built a solid understanding. A well-guided challenge will deepen it further.';
        confidence = 0.75;
      }
    } else if (mastery === 'strong') {
      if (revisionPriority === 'high' || spacedDue) {
        verdict = 'standard_challenge_ready';
        suggestedType = 'mastery_check';
        difficulty = 'challenging';
        reasonCodes.push('strong_mastery', 'revision_due');
        why = 'Let us confirm your strong understanding with a targeted check.';
        confidence = 0.8;
      } else {
        verdict = 'stretch_challenge_ready';
        suggestedType = 'stretch_challenge';
        difficulty = 'stretch';
        reasonCodes.push('strong_mastery', 'ready_for_stretch');
        why = 'Your strong grasp means you are ready for a deeper challenge that extends your knowledge.';
        confidence = 0.85;
      }
    } else {
      verdict = 'foundation_needed';
      suggestedType = 'foundation_remediation';
      difficulty = 'foundation';
      reasonCodes.push('unknown_mastery_state');
      why = 'Let us start with a solid foundation to make sure we build from the right place.';
      confidence = 0.5;
    }

    if (preference === 'high' && verdict === 'foundation_needed' && mastery !== 'not_started') {
      reasonCodes.push('learner_preference_considered');
      if (hasIndependentSuccess) {
        verdict = 'light_challenge_ready';
        suggestedType = 'light_challenge';
        difficulty = 'standard';
        why = 'You asked for a challenge, and your recent progress supports offering one.';
        confidence = 0.55;
      }
    }

    if (preference === 'low' && (verdict === 'standard_challenge_ready' || verdict === 'stretch_challenge_ready')) {
      reasonCodes.push('learner_preference_gentler_path');
      verdict = 'light_challenge_ready';
      suggestedType = 'light_challenge';
      difficulty = 'standard';
      why = 'We can take a gentler approach while still keeping you engaged.';
      confidence = 0.6;
    }

    return {
      verdict,
      reasonCodes,
      suggestedChallengeType: suggestedType,
      suggestedDifficultyLevel: difficulty,
      whyThisLevel: why,
      confidence,
    };
  }
}

export const challengeReadinessEvaluator = new ChallengeReadinessEvaluator();
