import type {
  PreferenceSafetyResult,
  AdaptiveTuningPolicyDecision,
  AdaptiveTuningReasonCode,
  LearnerPreferenceFeedbackRequest,
  LearnerChoiceSignalRequest,
} from '../contracts/adaptiveRecommendationTuningContracts';

export class PreferenceSafetyGuard {
  evaluatePreferenceFeedbackSafety(
    request: LearnerPreferenceFeedbackRequest,
    context: { isDeenSensitive?: boolean; isSafeguardingActive?: boolean; hasSourceTruth?: boolean },
  ): PreferenceSafetyResult {
    const safeReasonCodes: AdaptiveTuningReasonCode[] = [];
    let canTuneSupport = true;
    let canTuneHints = true;
    let canReorderOptions = true;
    let bypassesSourceTruth = false;
    let bypassesDeenBoundary = false;
    let bypassesSafeguardingBoundary = false;
    let bypassesRevisionDebt = false;
    let erasesWeakTopic = false;
    let revealsAnswers = false;
    let convertsFallbackToReal = false;

    if (request.feedbackType === 'want_challenge' && !context.hasSourceTruth) {
      canTuneSupport = false;
      bypassesSourceTruth = true;
      safeReasonCodes.push('source_required_tuning_blocked');
    }

    if (request.feedbackType === 'too_easy' && !context.hasSourceTruth) {
      canReorderOptions = false;
      bypassesSourceTruth = true;
      safeReasonCodes.push('source_required_tuning_blocked');
    }

    if (context.isDeenSensitive) {
      canReorderOptions = false;
      canTuneSupport = false;
      bypassesDeenBoundary = true;
      safeReasonCodes.push('preference_cannot_bypass_deen_boundary');
    }

    if (context.isSafeguardingActive) {
      canReorderOptions = false;
      canTuneSupport = false;
      bypassesSafeguardingBoundary = true;
      safeReasonCodes.push('preference_cannot_bypass_safeguarding_boundary');
    }

    if (request.feedbackType === 'not_now') {
      bypassesRevisionDebt = false;
      erasesWeakTopic = false;
    }

    if (request.feedbackType === 'want_hint' || request.feedbackType === 'want_teacher_help') {
      revealsAnswers = false;
    }

    if (request.feedbackType === 'too_easy') {
      convertsFallbackToReal = false;
    }

    const safe = !bypassesSourceTruth && !bypassesDeenBoundary && !bypassesSafeguardingBoundary;

    return {
      safe,
      policyDecision: safe ? 'allowed' as AdaptiveTuningPolicyDecision : 'blocked_source_required' as AdaptiveTuningPolicyDecision,
      safeReasonCodes: safeReasonCodes.length > 0 ? safeReasonCodes : [],
      canTuneSupport,
      canTuneHints,
      canReorderOptions,
      bypassesSourceTruth,
      bypassesDeenBoundary,
      bypassesSafeguardingBoundary,
      bypassesRevisionDebt,
      erasesWeakTopic,
      revealsAnswers,
      convertsFallbackToReal,
    };
  }

  evaluateChoiceSignalSafety(
    request: LearnerChoiceSignalRequest,
    context: { isDeenSensitive?: boolean; isSafeguardingActive?: boolean },
  ): PreferenceSafetyResult {
    const safeReasonCodes: AdaptiveTuningReasonCode[] = [];
    let canTuneSupport = true;
    let canTuneHints = true;
    let canReorderOptions = true;
    let bypassesSourceTruth = false;
    let bypassesDeenBoundary = false;
    let bypassesSafeguardingBoundary = false;
    let bypassesRevisionDebt = false;
    let erasesWeakTopic = false;
    let revealsAnswers = false;
    let convertsFallbackToReal = false;

    if (context.isDeenSensitive) {
      canReorderOptions = false;
      canTuneSupport = false;
      bypassesDeenBoundary = true;
      safeReasonCodes.push('preference_cannot_bypass_deen_boundary');
    }

    if (context.isSafeguardingActive) {
      canReorderOptions = false;
      canTuneSupport = false;
      bypassesSafeguardingBoundary = true;
      safeReasonCodes.push('preference_cannot_bypass_safeguarding_boundary');
    }

    if (request.choiceType === 'skipped_for_now') {
      erasesWeakTopic = false;
    }

    const safe = !bypassesDeenBoundary && !bypassesSafeguardingBoundary;

    return {
      safe,
      policyDecision: safe ? 'allowed' as AdaptiveTuningPolicyDecision : 'blocked_source_required' as AdaptiveTuningPolicyDecision,
      safeReasonCodes: safeReasonCodes.length > 0 ? safeReasonCodes : [],
      canTuneSupport,
      canTuneHints,
      canReorderOptions,
      bypassesSourceTruth,
      bypassesDeenBoundary,
      bypassesSafeguardingBoundary,
      bypassesRevisionDebt,
      erasesWeakTopic,
      revealsAnswers,
      convertsFallbackToReal,
    };
  }

  filterUnsafePreferenceSignal(signal: PreferenceSafetyResult): PreferenceSafetyResult {
    if (!signal.safe) {
      return {
        ...signal,
        canTuneSupport: false,
        canTuneHints: false,
        canReorderOptions: false,
      };
    }
    return signal;
  }

  assertPreferenceSignalIsSafe(signal: PreferenceSafetyResult): void {
    if (!signal.safe) {
      throw new Error(`Preference signal is unsafe: ${signal.safeReasonCodes.join(', ')}`);
    }
  }

  assertTuningDoesNotBypassSafety(result: { tuningDecision?: string }): void {
    if (result.tuningDecision === 'block_tuning') {
      throw new Error('Tuning decision blocked by safety policy');
    }
  }
}

export const preferenceSafetyGuard = new PreferenceSafetyGuard();
