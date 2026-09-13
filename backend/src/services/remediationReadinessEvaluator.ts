import type {
  RemediationReadinessVerdict,
  DifficultyLevel,
  SupportLevel,
} from './task015Contracts';

export interface RemediationReadinessInput {
  currentStepIndex: number;
  totalSteps: number;
  recentStepOutcomes: Array<'correct' | 'partially_correct' | 'incorrect' | 'unclear'>;
  recentHintLevels: number[];
  repeatedConfusionCount: number;
  independentSuccessCount: number;
  difficultyLevel?: DifficultyLevel;
  supportLevel?: SupportLevel;
}

export class RemediationReadinessEvaluator {
  evaluate(input: RemediationReadinessInput): {
    verdict: RemediationReadinessVerdict;
    reasonCodes: string[];
    confidence: number;
  } {
    const reasonCodes: string[] = [];
    const { recentStepOutcomes, recentHintLevels, repeatedConfusionCount, independentSuccessCount } = input;

    const totalAttempts = recentStepOutcomes.length;
    if (totalAttempts === 0) {
      return {
        verdict: 'not_ready',
        reasonCodes: ['no_remediation_evidence'],
        confidence: 0.3,
      };
    }

    const correctCount = recentStepOutcomes.filter(o => o === 'correct' || o === 'partially_correct').length;
    const heavyHintCount = recentHintLevels.filter(h => h >= 3).length;
    const confusionCount = repeatedConfusionCount;

    const hasIndependentSuccess = independentSuccessCount >= 2;
    const hasHeavyHintDependency = heavyHintCount > correctCount;
    const stillConfused = confusionCount > 1;

    if (stillConfused && hasHeavyHintDependency) {
      return {
        verdict: 'not_ready',
        reasonCodes: ['repeated_confusion', 'hint_dependency'],
        confidence: 0.7,
      };
    }

    if (hasIndependentSuccess && !stillConfused) {
      return {
        verdict: 'ready_for_challenge',
        reasonCodes: ['independent_success', 'remediation_complete'],
        confidence: 0.8,
      };
    }

    if (correctCount >= totalAttempts * 0.6 && !hasHeavyHintDependency) {
      return {
        verdict: 'ready_to_return',
        reasonCodes: ['improving_trend', 'partial_progress'],
        confidence: 0.65,
      };
    }

    return {
      verdict: 'partial_progress',
      reasonCodes: ['still_building', 'more_evidence_needed'],
      confidence: 0.5,
    };
  }
}

export const remediationReadinessEvaluator = new RemediationReadinessEvaluator();
