import type {
  DifficultyCalibrationInput,
  DifficultyCalibrationDecision,
  DifficultyLevel,
  SupportLevel,
} from './task015Contracts';
import { difficultySignalAggregator } from './difficultySignalAggregator';
import { difficultyCalibrationRepository } from './difficultyCalibrationRepository';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['foundation', 'easy', 'standard', 'challenging', 'stretch'];
const SUPPORT_ORDER: SupportLevel[] = ['minimal', 'moderate', 'significant', 'intensive', 'maximum'];

function clampIndex(idx: number, max: number): number {
  return Math.max(0, Math.min(idx, max));
}

export class DifficultyCalibrationRuntime {
  async calibrate(input: DifficultyCalibrationInput): Promise<DifficultyCalibrationDecision> {
    const aggregated = difficultySignalAggregator.aggregate(input.recentSignals);
    const currentRecord = await difficultyCalibrationRepository.getCalibration(
      input.schoolId,
      input.tutorLearnerId,
      input.subject,
      input.skillTag,
    );

    const currentDifficulty: DifficultyLevel = (currentRecord?.currentDifficultyLevel as DifficultyLevel) ?? 'standard';
    const currentSupport: SupportLevel = (currentRecord?.supportLevel as SupportLevel) ?? 'moderate';

    let difficultyIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
    if (difficultyIndex < 0) difficultyIndex = 2;

    let supportIndex = SUPPORT_ORDER.indexOf(currentSupport);
    if (supportIndex < 0) supportIndex = 1;

    const reasonCodes: string[] = [];
    const signalParts: string[] = [];

    if (aggregated.tooHardCount > aggregated.tooEasyCount && aggregated.recentStruggleRate > 0.4) {
      difficultyIndex = clampIndex(difficultyIndex - 1, DIFFICULTY_ORDER.length - 1);
      supportIndex = clampIndex(supportIndex + 1, SUPPORT_ORDER.length - 1);
      reasonCodes.push('too_hard_signals', 'struggle_rate_high');
      signalParts.push('too_hard_signals_detected');
    }

    if (aggregated.tooEasyCount > aggregated.tooHardCount && aggregated.recentSuccessRate >= 0.8 && aggregated.correctIndependentCount >= 2) {
      difficultyIndex = clampIndex(difficultyIndex + 1, DIFFICULTY_ORDER.length - 1);
      supportIndex = clampIndex(supportIndex - 1, SUPPORT_ORDER.length - 1);
      reasonCodes.push('too_easy_signals', 'independent_success');
      signalParts.push('too_easy_signals_detected');
    }

    if (aggregated.stillConfusedCount > 1 || aggregated.repeatedMistakeCount > 2) {
      difficultyIndex = clampIndex(difficultyIndex - 1, DIFFICULTY_ORDER.length - 1);
      supportIndex = clampIndex(supportIndex + 1, SUPPORT_ORDER.length - 1);
      reasonCodes.push('confusion_detected', 'repeated_mistakes');
      signalParts.push('confusion_remediation_needed');
    }

    if (aggregated.correctIndependentCount >= 3 && aggregated.recentSuccessRate >= 0.85) {
      difficultyIndex = clampIndex(difficultyIndex + 1, DIFFICULTY_ORDER.length - 1);
      supportIndex = clampIndex(supportIndex - 1, SUPPORT_ORDER.length - 1);
      reasonCodes.push('independent_success_streak');
      signalParts.push('independent_success_streak');
    }

    if (aggregated.recentStruggleRate > 0.6) {
      difficultyIndex = clampIndex(difficultyIndex - 1, DIFFICULTY_ORDER.length - 1);
      supportIndex = clampIndex(supportIndex + 1, SUPPORT_ORDER.length - 1);
      if (!reasonCodes.includes('struggle_rate_high')) {
        reasonCodes.push('struggle_rate_high');
      }
      signalParts.push('high_struggle_rate');
    }

    const newDifficulty = DIFFICULTY_ORDER[difficultyIndex];
    const newSupport = SUPPORT_ORDER[supportIndex];

    await difficultyCalibrationRepository.upsertCalibration({
      schoolId: input.schoolId,
      tutorLearnerId: input.tutorLearnerId,
      subject: input.subject,
      topic: input.topic,
      skillTag: input.skillTag,
      currentDifficultyLevel: newDifficulty,
      supportLevel: newSupport,
      calibrationSignals: aggregated as any,
      recentSuccessCount: aggregated.correctIndependentCount,
      recentStruggleCount: aggregated.incorrectCount + aggregated.repeatedMistakeCount,
      recentHintDependency: aggregated.correctWithHintCount + aggregated.hintRequestCount,
      recentTooHardCount: aggregated.tooHardCount,
      recentTooEasyCount: aggregated.tooEasyCount,
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
    });

    const enumReason = reasonCodes.join(', ') || 'stable_performance';
    let signalSummary = '';
    if (signalParts.length > 0) {
      signalSummary = signalParts.join(', ');
    } else {
      signalSummary = 'stable_performance';
    }

    return {
      currentDifficultyLevel: newDifficulty,
      supportLevel: newSupport,
      calibrationReason: enumReason,
      recentSignalSummary: signalSummary,
      nextAdjustmentCondition: aggregated.correctIndependentCount >= 3 && aggregated.recentSuccessRate >= 0.85
        ? 'Increase difficulty after more independent success'
        : aggregated.recentStruggleRate > 0.4
          ? 'Maintain support until struggle rate decreases'
          : 'Monitor next 3 attempts for adjustment signal',
      confidence: 0.6 + (aggregated.totalAttempts > 5 ? 0.2 : 0),
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
      updatedAt: new Date().toISOString(),
    };
  }
}

export const difficultyCalibrationRuntime = new DifficultyCalibrationRuntime();
