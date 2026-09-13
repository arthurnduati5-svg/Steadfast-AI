import type {
  AdaptiveTuningSupportLevel,
  AdaptiveTuningHintPacingBucket,
  AdaptiveTuningSourceTruthStatus,
  AdaptiveTuningConfidenceBucket,
  AdaptiveTuningReasonCode,
  SupportCalibrationResult,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface CalibrationEvidence {
  recentTooHardCount: number;
  recentTooEasyCount: number;
  recentConfusionCount: number;
  recentCorrectCount: number;
  recentIncorrectCount: number;
  recentIndependentSuccessCount: number;
  recentHintDependencyCount: number;
  feedbackSignals?: string[];
  masteryLevel?: string;
  sourceTruthStatus?: string;
}

const SUPPORT_ORDER: AdaptiveTuningSupportLevel[] = [
  'minimal', 'light', 'standard', 'guided', 'high_support',
  'teacher_support_recommended', 'blocked',
];

const HINT_PACING_ORDER: AdaptiveTuningHintPacingBucket[] = [
  'no_hints_yet', 'slow_hint_pacing', 'standard_hint_pacing',
  'faster_hint_pacing', 'high_hint_dependency', 'blocked',
];

export class SupportLevelCalibrationService {
  calibrateSupportLevel(evidence: CalibrationEvidence): AdaptiveTuningSupportLevel {
    let supportIndex = 2;

    if (evidence.recentConfusionCount >= 2) supportIndex += 1;
    if (evidence.recentTooHardCount >= 2) supportIndex += 1;
    if (evidence.recentIncorrectCount >= 3) supportIndex += 1;
    if (evidence.recentHintDependencyCount >= 3) supportIndex += 1;

    if (evidence.recentIndependentSuccessCount >= 3) supportIndex -= 1;
    if (evidence.recentCorrectCount >= 5 && evidence.recentTooHardCount === 0) {
      supportIndex = Math.max(0, supportIndex - 1);
    }

    if (evidence.feedbackSignals) {
      for (const signal of evidence.feedbackSignals) {
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
          case 'want_teacher_help':
            supportIndex = Math.max(supportIndex, 4);
            break;
        }
      }
    }

    supportIndex = Math.max(0, Math.min(SUPPORT_ORDER.length - 1, supportIndex));
    return SUPPORT_ORDER[supportIndex];
  }

  calibrateHintPacing(evidence: CalibrationEvidence): AdaptiveTuningHintPacingBucket {
    let pacingIndex = 2;

    if (evidence.recentHintDependencyCount >= 3) pacingIndex += 1;
    if (evidence.recentConfusionCount >= 2) pacingIndex += 1;

    if (evidence.recentIndependentSuccessCount >= 3) pacingIndex = Math.max(0, pacingIndex - 1);
    if (evidence.recentCorrectCount >= 5 && evidence.recentConfusionCount === 0) {
      pacingIndex = Math.max(0, pacingIndex - 1);
    }

    if (evidence.feedbackSignals) {
      for (const signal of evidence.feedbackSignals) {
        switch (signal) {
          case 'want_hint':
          case 'still_confused':
          case 'shorter_steps':
          case 'slower_pace':
            pacingIndex += 1;
            break;
          case 'understood':
          case 'faster_pace':
            pacingIndex = Math.max(0, pacingIndex - 1);
            break;
        }
      }
    }

    pacingIndex = Math.max(0, Math.min(HINT_PACING_ORDER.length - 1, pacingIndex));
    return HINT_PACING_ORDER[pacingIndex];
  }

  buildSupportCalibrationResult(evidence: CalibrationEvidence): SupportCalibrationResult {
    const supportLevel = this.calibrateSupportLevel(evidence);
    const hintPacingBucket = this.calibrateHintPacing(evidence);
    const reasonCodes: AdaptiveTuningReasonCode[] = [];

    if (evidence.recentConfusionCount >= 2 || evidence.recentTooHardCount >= 2) {
      reasonCodes.push('support_increased');
    }
    if (evidence.recentIndependentSuccessCount >= 3) {
      reasonCodes.push('support_decreased');
    }
    if (evidence.recentHintDependencyCount >= 3) {
      reasonCodes.push('hint_pacing_adjusted');
    }

    const sourceTruthStatus: AdaptiveTuningSourceTruthStatus =
      (evidence.sourceTruthStatus as AdaptiveTuningSourceTruthStatus) || 'real_evidence';

    const confidenceBucket: AdaptiveTuningConfidenceBucket =
      evidence.recentCorrectCount >= 5 ? 'high_confidence' :
      evidence.recentConfusionCount >= 2 ? 'low_confidence' :
      'medium_confidence';

    return {
      supportLevel,
      hintPacingBucket,
      safeReasonCodes: reasonCodes,
      sourceTruthStatus,
      confidenceBucket,
    };
  }

  assertSupportCalibrationIsSafe(result: SupportCalibrationResult): void {
    if (result.supportLevel === 'blocked') {
      throw new Error('Support calibration resulted in blocked state');
    }
  }
}

export const supportLevelCalibrationService = new SupportLevelCalibrationService();
