import type {
  AvoidanceLoopPolicyResult,
  AdaptiveTuningAvoidanceRiskBucket,
  AdaptiveTuningReasonCode,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface AvoidanceContext {
  feedbackType?: string;
  choiceType?: string;
  isWeakTopic: boolean;
  isItemDue: boolean;
  isUrgentRevision: boolean;
  recentNotNowCount: number;
  recentTopicChangeCount: number;
  recentEasyModeCount: number;
  recentHintWithoutAttemptCount: number;
  recentRevisionSkipCount: number;
  recentTeacherDeclineCount: number;
  recentAnswerRequestCount: number;
  recentChallengeRequestCount: number;
  foundationReviewPreference?: string;
}

export class NoAvoidanceLoopPolicyService {
  detectAvoidanceLoopRisk(context: AvoidanceContext): AvoidanceLoopPolicyResult {
    const signals: string[] = [];
    let risk: AdaptiveTuningAvoidanceRiskBucket = 'none';

    if (context.recentNotNowCount >= 3 && context.isWeakTopic) {
      signals.push('repeated_not_now_on_weak_topic');
      risk = 'elevated';
    }

    if (context.recentTopicChangeCount >= 3 && context.isItemDue) {
      signals.push('repeated_choose_different_topic_on_due_item');
      risk = 'elevated';
    }

    if (context.recentEasyModeCount >= 3 && context.isWeakTopic) {
      signals.push('easy_mode_preference_with_weak_evidence');
      risk = risk === 'none' ? 'low' : 'elevated';
    }

    if (context.recentHintWithoutAttemptCount >= 3) {
      signals.push('hint_request_without_attempt');
      risk = risk === 'none' ? 'low' : risk;
    }

    if (context.recentRevisionSkipCount >= 2) {
      signals.push('skipping_revision_due_items');
      risk = risk === 'none' ? 'elevated' : 'high';
    }

    if (context.recentTeacherDeclineCount >= 3 && context.isWeakTopic) {
      signals.push('declining_teacher_help_after_repeated_stuck');
      risk = risk === 'none' ? 'low' : 'elevated';
    }

    if (context.recentAnswerRequestCount >= 2) {
      signals.push('asking_for_answer_or_solution');
      risk = risk === 'none' ? 'low' : 'elevated';
    }

    if (context.recentChallengeRequestCount >= 3 && context.isWeakTopic) {
      signals.push('challenge_request_to_avoid_foundation');
      risk = risk === 'none' ? 'low' : 'elevated';
    }

    if (context.isUrgentRevision && context.recentNotNowCount >= 1) {
      risk = 'high';
      signals.push('urgent_revision_avoidance');
    }

    const reasonCodes: AdaptiveTuningReasonCode[] = signals.length > 0
      ? ['avoidance_loop_risk_detected']
      : [];

    if (risk === 'none') {
      return {
        decision: 'allowed',
        avoidanceRiskBucket: 'none',
        safeReasonCodes: [],
      };
    }

    if (risk === 'high') {
      return {
        decision: 'blocked_avoidance_loop',
        avoidanceRiskBucket: 'high',
        safeReasonCodes: reasonCodes,
        safeAlternativeSuggestion: 'The system will keep this learning need visible, but it can offer a smaller next step.',
      };
    }

    if (risk === 'elevated' || context.isWeakTopic) {
      return {
        decision: 'allowed_with_shorter_step',
        avoidanceRiskBucket: risk,
        safeReasonCodes: reasonCodes,
        safeAlternativeSuggestion: 'Would you like to try a shorter step instead?',
      };
    }

    return {
      decision: 'allowed',
      avoidanceRiskBucket: risk,
      safeReasonCodes: reasonCodes,
    };
  }

  evaluateAvoidanceLoopPolicy(context: AvoidanceContext): AvoidanceLoopPolicyResult {
    return this.detectAvoidanceLoopRisk(context);
  }

  buildAvoidanceSafeAlternative(result: AvoidanceLoopPolicyResult): string {
    if (result.decision === 'allowed_with_shorter_step') {
      return 'Let us try a shorter step to make progress.';
    }
    if (result.decision === 'allowed_with_revision_anchor') {
      return 'Let us start with a quick review first.';
    }
    if (result.decision === 'allowed_with_teacher_help_suggestion') {
      return 'Your teacher may be able to help with this topic.';
    }
    if (result.decision === 'blocked_avoidance_loop') {
      return 'This topic needs attention. Let us take a small step together.';
    }
    return '';
  }

  assertNoAvoidanceLoopReinforced(result: AvoidanceLoopPolicyResult): void {
    if (result.decision === 'blocked_avoidance_loop') {
      throw new Error(`Avoidance loop blocked: ${result.safeReasonCodes.join(', ')}`);
    }
  }
}

export const noAvoidanceLoopPolicyService = new NoAvoidanceLoopPolicyService();
