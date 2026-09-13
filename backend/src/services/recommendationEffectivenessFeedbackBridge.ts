import type {
  AdaptiveTuningEffectivenessSignal,
  AdaptiveTuningReasonCode,
  LearnerPreferenceFeedbackRequest,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface EffectivenessSignalInput {
  feedbackType: string;
  choiceType?: string;
  wasHintRequested: boolean;
  wasTeacherHelpRequested: boolean;
  wasStuckAfter: boolean;
  wasRecoveryAfter: boolean;
  wasAvoidanceDetected: boolean;
}

export class RecommendationEffectivenessFeedbackBridge {
  buildRecommendationEffectivenessSignal(input: EffectivenessSignalInput): AdaptiveTuningEffectivenessSignal {
    if (input.wasStuckAfter && input.wasTeacherHelpRequested) return 'teacher_help_needed';
    if (input.wasAvoidanceDetected) return 'avoidance_detected';
    if (input.wasStuckAfter) return 'still_stuck';
    if (input.wasRecoveryAfter && !input.wasStuckAfter) return 'helped_recover';
    if (input.wasRecoveryAfter) return 'helped_continue';
    return 'no_effect';
  }

  recordSafeRecommendationFeedback(
    input: LearnerPreferenceFeedbackRequest & { recommendationId: string; studentId: string; schoolId: string },
  ): {
    recommendationId: string;
    feedbackType: string;
    safeReasonCodes: AdaptiveTuningReasonCode[];
    rawPrivateDataIncluded: false;
    hiddenReasoningIncluded: false;
    teacherOnlyDataIncluded: false;
    answerKeyIncluded: false;
    modelAnswerIncluded: false;
  } {
    return {
      recommendationId: input.recommendationId,
      feedbackType: input.feedbackType,
      safeReasonCodes: [],
      rawPrivateDataIncluded: false,
      hiddenReasoningIncluded: false,
      teacherOnlyDataIncluded: false,
      answerKeyIncluded: false,
      modelAnswerIncluded: false,
    };
  }

  bridgeFeedbackToTutorActionEffectiveness(
    feedback: { feedbackType: string; safeReasonCodes: string[] },
  ): { effectivenessSignal: string; reasonCodes: string[] } {
    const signalMap: Record<string, string> = {
      too_hard: 'under_supported',
      still_confused: 'under_supported',
      too_easy: 'over_supported',
      understood: 'helped_continue',
      helpful: 'helped_continue',
      not_helpful: 'no_effect',
      want_hint: 'not_enough_evidence',
      want_teacher_help: 'teacher_help_needed',
    };
    return {
      effectivenessSignal: signalMap[feedback.feedbackType] || 'no_effect',
      reasonCodes: feedback.safeReasonCodes,
    };
  }

  bridgeFeedbackToGrowthTelemetry(
    feedback: { feedbackType: string; schoolId: string; studentId: string },
  ): { telemetryEvent: string; safeMetadata: Record<string, string> } {
    return {
      telemetryEvent: 'recommendation_feedback_recorded',
      safeMetadata: {
        feedbackType: feedback.feedbackType,
        schoolId: feedback.schoolId,
        studentId: feedback.studentId,
      },
    };
  }

  assertEffectivenessFeedbackIsSafe(data: Record<string, unknown>): void {
    const forbiddenFields = ['rawText', 'rawMessage', 'studentMessage', 'aiResponse', 'prompt', 'chainOfThought', 'hiddenReasoning', 'answerKey', 'modelAnswer', 'correctAnswer'];
    for (const field of forbiddenFields) {
      if (field in data) {
        throw new Error(`Forbidden field in effectiveness feedback: ${field}`);
      }
    }
  }
}

export const recommendationEffectivenessFeedbackBridge = new RecommendationEffectivenessFeedbackBridge();
