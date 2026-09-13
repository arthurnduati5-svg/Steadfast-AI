import type {
  GrowthActionDestination,
  GrowthActionConfidenceBucket,
  GrowthLearnerEvidenceSnapshot,
} from '../contracts/growthActionContracts';
import type { LearnerState } from './growthActionLearnerStateService';

export interface ModeRecommendationInput {
  evidence: GrowthLearnerEvidenceSnapshot;
  learnerState: LearnerState;
  requestedDestination?: GrowthActionDestination;
  requestedIntent?: string;
}

export interface ModeRecommendationResult {
  recommendedMode: string;
  recommendedDestination: GrowthActionDestination;
  confidence: GrowthActionConfidenceBucket;
  reasonCodes: string[];
}

export function recommendMode(input: ModeRecommendationInput): ModeRecommendationResult {
  const { evidence, learnerState, requestedDestination, requestedIntent } = input;

  if (evidence.stateQuality === 'no_data_yet') {
    return {
      recommendedMode: 'none',
      recommendedDestination: 'none',
      confidence: 'no_data_yet',
      reasonCodes: ['insufficient_evidence', 'mode_unavailable'],
    };
  }

  if (learnerState.contentGovernanceState.contentGap) {
    return {
      recommendedMode: 'content_gap_referral',
      recommendedDestination: 'content_gap_referral',
      confidence: 'low',
      reasonCodes: ['content_gap'],
    };
  }

  if (learnerState.deenGovernanceState.deenUncertain) {
    return {
      recommendedMode: 'deen_referral',
      recommendedDestination: 'deen_referral',
      confidence: 'low',
      reasonCodes: ['deen_uncertainty'],
    };
  }

  if (requestedDestination) {
    const mode = destinationToMode(requestedDestination);
    return {
      recommendedMode: mode,
      recommendedDestination: requestedDestination,
      confidence: 'medium',
      reasonCodes: ['student_choice_requested'],
    };
  }

  if (learnerState.revisionDueState.hasDueItems) {
    return {
      recommendedMode: 'revision',
      recommendedDestination: 'revision',
      confidence: 'high',
      reasonCodes: ['due_revision_item', 'spaced_review_due'],
    };
  }

  if (learnerState.weakTopicState.hasWeakTopics && learnerState.masteryState.status === 'low') {
    return {
      recommendedMode: 'quiz',
      recommendedDestination: 'quiz',
      confidence: 'medium',
      reasonCodes: ['weak_topic_detected', 'low_mastery'],
    };
  }

  if (learnerState.mistakePatternState.hasPatterns) {
    return {
      recommendedMode: 'focus',
      recommendedDestination: 'focus',
      confidence: 'medium',
      reasonCodes: ['mistake_pattern_detected', 'focus_deep_repair_needed'],
    };
  }

  if (evidence.modeSummarySignals.some(m => m.mode === 'teach_back' && m.exitReason === 'unclear')) {
    return {
      recommendedMode: 'teach_back',
      recommendedDestination: 'teach_back',
      confidence: 'high',
      reasonCodes: ['teach_back_explanation_needed'],
    };
  }

  if (learnerState.supportNeedState.hasSupportNeed) {
    return {
      recommendedMode: 'teacher_support',
      recommendedDestination: 'teacher_support',
      confidence: 'medium',
      reasonCodes: ['teacher_assigned_priority'],
    };
  }

  if (learnerState.masteryState.status === 'high') {
    return {
      recommendedMode: 'revision',
      recommendedDestination: 'revision',
      confidence: 'medium',
      reasonCodes: ['strong_mastery_ready_for_challenge'],
    };
  }

  return {
    recommendedMode: 'none',
    recommendedDestination: 'none',
    confidence: 'low',
    reasonCodes: ['insufficient_evidence'],
  };
}

function destinationToMode(dest: GrowthActionDestination): string {
  switch (dest) {
    case 'revision': return 'revision';
    case 'quiz': return 'quiz';
    case 'teach_back': return 'teach_back';
    case 'focus': return 'focus';
    case 'exam': return 'exam';
    case 'mastery_pathway':
    case 'learning_profile':
    case 'weak_topics':
    case 'academic_memory': return 'learning_profile';
    case 'teacher_support': return 'teacher_support';
    case 'content_gap_referral': return 'content_gap_referral';
    case 'deen_referral': return 'deen_referral';
    default: return 'none';
  }
}
