import type {
  LearningSessionMode,
  TutorModeTransitionDecision,
  TutorModeTransitionReasonCode,
  LearnerActionType,
} from './studentLearningSessionContracts';
import { isValidTransition, determineTransition } from './studentLearningSessionStateMachine';

export interface TransitionPolicyInput {
  currentMode: LearningSessionMode;
  learnerActionType: LearnerActionType;
  messageIntent?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  masteryState?: {
    level?: string;
    status?: string;
    confidenceScore?: number;
  };
  revisionDue?: boolean;
  spacedReviewDue?: boolean;
  weakSkillState?: Array<{ skillId: string; weaknessScore: number }>;
  challengeReadiness?: string;
  remediationNeed?: boolean;
  adaptiveProfile?: {
    preferredSupportLevel?: string;
    challengeReadinessSignal?: string;
    difficultyCalibration?: number;
  };
  preferenceSignals?: {
    recentTooHardCount?: number;
    recentTooEasyCount?: number;
    recentConfusionCount?: number;
    recentChallengeRequestCount?: number;
    recentTeacherHelpRequestCount?: number;
  };
  safetyPolicyDecision?: {
    safeguardingRequired: boolean;
    safeguardingCategory?: string;
  };
  deenPolicyDecision?: {
    sourceSensitive: boolean;
    requiresReferral: boolean;
  };
  academicIntegrityDecision?: {
    blockDirectAnswer: boolean;
    enforceSocratic: boolean;
  };
  sessionTimeBudget?: number;
}

export interface TransitionPolicyResult {
  nextMode: LearningSessionMode;
  decision: TutorModeTransitionDecision;
  reasonCodes: TutorModeTransitionReasonCode[];
}

const SAFEGUARDING_TERMS = ['self_harm', 'suicide', 'abuse', 'exploitation', 'grooming', 'credible_threats', 'violence', 'severe_crisis'];
const DEEN_SENSITIVE_TOPICS = ['quran', 'hadith', 'fiqh', 'tafsir', 'aqidah', 'sharia', 'fatwa'];

function containsSafeguardingTerm(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SAFEGUARDING_TERMS.some(t => lower.includes(t));
}

function containsDeenSensitiveTopic(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DEEN_SENSITIVE_TOPICS.some(t => lower.includes(t));
}

export function selectNextMode(input: TransitionPolicyInput): TransitionPolicyResult {
  const reasonCodes: TutorModeTransitionReasonCode[] = [];

  // Priority 1: Safeguarding boundary
  if (input.safetyPolicyDecision?.safeguardingRequired || containsSafeguardingTerm(input.subject) || containsSafeguardingTerm(input.topic)) {
    reasonCodes.push('safeguarding_boundary');
    const decision = determineTransition(input.currentMode, 'safeguarding_pause', reasonCodes);
    return { nextMode: 'safeguarding_pause', decision, reasonCodes };
  }

  // Priority 2: Academic integrity / No-answer-bot
  if (input.academicIntegrityDecision?.blockDirectAnswer || input.academicIntegrityDecision?.enforceSocratic) {
    reasonCodes.push('academic_integrity_boundary');
    const targetMode: LearningSessionMode = 'socratic_check';
    if (isValidTransition(input.currentMode, targetMode)) {
      const decision = determineTransition(input.currentMode, targetMode, reasonCodes);
      return { nextMode: targetMode, decision, reasonCodes };
    }
  }

  // Priority 3: Deen source-sensitivity
  if (input.deenPolicyDecision?.sourceSensitive || input.deenPolicyDecision?.requiresReferral || containsDeenSensitiveTopic(input.topic)) {
    if (input.deenPolicyDecision?.requiresReferral || containsDeenSensitiveTopic(input.topic)) {
      reasonCodes.push('deen_advanced_referral');
      const decision = determineTransition(input.currentMode, 'deen_teacher_referral', reasonCodes);
      return { nextMode: 'deen_teacher_referral', decision, reasonCodes };
    }
    reasonCodes.push('deen_source_sensitive');
    const decision = determineTransition(input.currentMode, 'deen_safe_support', reasonCodes);
    return { nextMode: 'deen_safe_support', decision, reasonCodes };
  }

  // Priority 4: Active remediation path
  if (input.remediationNeed) {
    reasonCodes.push('remediation_need');
    if (isValidTransition(input.currentMode, 'remediation')) {
      const decision = determineTransition(input.currentMode, 'remediation', reasonCodes);
      return { nextMode: 'remediation', decision, reasonCodes };
    }
  }

  // Priority 5: Urgent revision due
  if (input.revisionDue) {
    reasonCodes.push('revision_due');
    if (isValidTransition(input.currentMode, 'revision')) {
      const decision = determineTransition(input.currentMode, 'revision', reasonCodes);
      return { nextMode: 'revision', decision, reasonCodes };
    }
  }

  // Priority 6: Spaced review due
  if (input.spacedReviewDue) {
    reasonCodes.push('spaced_review_due');
    if (isValidTransition(input.currentMode, 'spaced_review')) {
      const decision = determineTransition(input.currentMode, 'spaced_review', reasonCodes);
      return { nextMode: 'spaced_review', decision, reasonCodes };
    }
  }

  // Priority 7: Current attempt checking
  if (input.learnerActionType === 'answer_attempt') {
    reasonCodes.push('learner_answer_submitted');
    if (isValidTransition(input.currentMode, 'attempt_checking')) {
      const decision = determineTransition(input.currentMode, 'attempt_checking', reasonCodes);
      return { nextMode: 'attempt_checking', decision, reasonCodes };
    }
  }

  // Priority 8: Learner requested hint/help
  if (input.learnerActionType === 'hint_request') {
    reasonCodes.push('learner_hint_request');
    if (isValidTransition(input.currentMode, 'hint_support')) {
      const decision = determineTransition(input.currentMode, 'hint_support', reasonCodes);
      return { nextMode: 'hint_support', decision, reasonCodes };
    }
  }

  // Priority 9: Low mastery foundation
  const masteryLevel = input.masteryState?.level;
  const masteryConfidence = input.masteryState?.confidenceScore ?? 0.5;
  if (masteryLevel === 'not_started' || masteryLevel === 'beginner' || masteryConfidence < 0.3) {
    reasonCodes.push('low_mastery');
    if (isValidTransition(input.currentMode, 'concept_teaching')) {
      const decision = determineTransition(input.currentMode, 'concept_teaching', reasonCodes);
      return { nextMode: 'concept_teaching', decision, reasonCodes };
    }
  }

  // Priority 10: Weak skill state
  if (input.weakSkillState && input.weakSkillState.length > 0) {
    const hasWeak = input.weakSkillState.some(w => w.weaknessScore > 0.5);
    if (hasWeak) {
      reasonCodes.push('weak_skill_foundation');
      if (isValidTransition(input.currentMode, 'remediation')) {
        const decision = determineTransition(input.currentMode, 'remediation', reasonCodes);
        return { nextMode: 'remediation', decision, reasonCodes };
      }
    }
  }

  // Priority 11: Improving learner - similar practice
  if (input.learnerActionType === 'feedback' && input.adaptiveProfile) {
    reasonCodes.push('improving_learner');
    if (isValidTransition(input.currentMode, 'similar_practice')) {
      const decision = determineTransition(input.currentMode, 'similar_practice', reasonCodes);
      return { nextMode: 'similar_practice', decision, reasonCodes };
    }
  }

  // Priority 12: Challenge readiness
  if (input.challengeReadiness === 'challenge_ready' || input.challengeReadiness === 'ready') {
    reasonCodes.push('challenge_ready');
    if (isValidTransition(input.currentMode, 'challenge')) {
      const decision = determineTransition(input.currentMode, 'challenge', reasonCodes);
      return { nextMode: 'challenge', decision, reasonCodes };
    }
  }

  // Priority 13: Stretch challenge readiness
  if (input.challengeReadiness === 'stretch_challenge_ready' || input.challengeReadiness === 'stretch_ready') {
    reasonCodes.push('stretch_challenge_ready');
    if (isValidTransition(input.currentMode, 'stretch_challenge')) {
      const decision = determineTransition(input.currentMode, 'stretch_challenge', reasonCodes);
      return { nextMode: 'stretch_challenge', decision, reasonCodes };
    }
  }

  // Priority 14: Learner requested challenge
  if (input.learnerActionType === 'choose_option' && input.messageIntent === 'challenge') {
    reasonCodes.push('learner_requested_challenge');
    if (isValidTransition(input.currentMode, 'challenge')) {
      const decision = determineTransition(input.currentMode, 'challenge', reasonCodes);
      return { nextMode: 'challenge', decision, reasonCodes };
    }
  }

  // Priority 15: Diagnostic check for new sessions
  if (input.currentMode === 'session_start' || input.currentMode === 'context_hydration') {
    reasonCodes.push('diagnostic_needed');
    if (isValidTransition(input.currentMode, 'diagnostic_check')) {
      const decision = determineTransition(input.currentMode, 'diagnostic_check', reasonCodes);
      return { nextMode: 'diagnostic_check', decision, reasonCodes };
    }
  }

  // Priority 16: Learner requested session end
  if (input.learnerActionType === 'complete') {
    reasonCodes.push('session_completed');
    if (isValidTransition(input.currentMode, 'reflection')) {
      const decision = determineTransition(input.currentMode, 'reflection', reasonCodes);
      return { nextMode: 'reflection', decision, reasonCodes };
    }
  }

  // Default: stay in current mode or go to guided_practice
  if (isValidTransition(input.currentMode, 'guided_practice')) {
    reasonCodes.push('system_decision');
    const decision = determineTransition(input.currentMode, 'guided_practice', reasonCodes);
    return { nextMode: 'guided_practice', decision, reasonCodes };
  }

  reasonCodes.push('system_decision');
  const decision = determineTransition(input.currentMode, input.currentMode, reasonCodes);
  return { nextMode: input.currentMode, decision, reasonCodes };
}
