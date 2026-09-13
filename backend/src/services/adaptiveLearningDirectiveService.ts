import type { SubjectModuleProfile } from './subjectModuleContracts';
import type { LearnerAdaptiveSnapshot } from './curriculumRuntimeContracts';

export interface AdaptiveDirectiveResult {
  pacingDirective: 'slow_support' | 'balanced' | 'fast_challenge' | 'unknown';
  rules: string[];
  confidence: 'low' | 'medium' | 'high' | 'none';
}

export function buildAdaptiveDirective(input: {
  module: SubjectModuleProfile;
  learnerAdaptiveSnapshot?: LearnerAdaptiveSnapshot;
}): AdaptiveDirectiveResult {
  const { module, learnerAdaptiveSnapshot } = input;

  if (!learnerAdaptiveSnapshot || learnerAdaptiveSnapshot.confidence === 'none') {
    return {
      pacingDirective: 'balanced',
      rules: [module.adaptiveRules.balanceRule],
      confidence: 'low',
    };
  }

  const speedHint = learnerAdaptiveSnapshot.learningSpeedHint;

  if (speedHint === 'slow') {
    return {
      pacingDirective: 'slow_support',
      rules: [
        ...module.adaptiveRules.slowLearner,
        'use smaller steps',
        'simpler language',
        'repetition',
        'ask one question at a time',
        'praise effort consistently',
      ],
      confidence: learnerAdaptiveSnapshot.confidence === 'high' ? 'high' : 'medium',
    };
  }

  if (speedHint === 'fast') {
    return {
      pacingDirective: 'fast_challenge',
      rules: [
        ...module.adaptiveRules.fastLearner,
        'include deeper questions',
        'offer extension tasks',
        'connect across subjects',
        'encourage independent thinking',
      ],
      confidence: learnerAdaptiveSnapshot.confidence === 'high' ? 'high' : 'medium',
    };
  }

  return {
    pacingDirective: 'balanced',
    rules: [module.adaptiveRules.balanceRule],
    confidence: 'medium',
  };
}
