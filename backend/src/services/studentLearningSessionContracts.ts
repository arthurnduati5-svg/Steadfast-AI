export type LearningSessionMode =
  | 'idle'
  | 'session_start'
  | 'context_hydration'
  | 'diagnostic_check'
  | 'concept_teaching'
  | 'socratic_check'
  | 'guided_practice'
  | 'independent_practice'
  | 'attempt_checking'
  | 'revision'
  | 'spaced_review'
  | 'remediation'
  | 'similar_practice'
  | 'challenge'
  | 'stretch_challenge'
  | 'hint_support'
  | 'reflection'
  | 'progress_summary'
  | 'teacher_help_suggested'
  | 'deen_safe_support'
  | 'deen_teacher_referral'
  | 'safeguarding_pause'
  | 'session_complete'
  | 'session_paused';

export type LearningSessionStatus = 'active' | 'paused' | 'completed' | 'expired' | 'safeguarding_paused';

export type TutorModeTransitionReasonCode =
  | 'safeguarding_boundary'
  | 'academic_integrity_boundary'
  | 'no_answer_bot_boundary'
  | 'deen_source_sensitive'
  | 'deen_advanced_referral'
  | 'session_started'
  | 'session_resumed'
  | 'session_completed'
  | 'learner_request'
  | 'learner_requested_challenge'
  | 'learner_requested_help'
  | 'learner_hint_request'
  | 'learner_answer_submitted'
  | 'learner_feedback_submitted'
  | 'learner_continue'
  | 'learner_pause'
  | 'learner_complete'
  | 'attempt_correct'
  | 'attempt_partial'
  | 'attempt_incorrect'
  | 'repeated_mistake'
  | 'revision_due'
  | 'spaced_review_due'
  | 'mastery_not_started'
  | 'mastery_low'
  | 'mastery_secure'
  | 'mastery_strong'
  | 'low_mastery'
  | 'hint_dependency_high'
  | 'remediation_need'
  | 'remediation_complete'
  | 'challenge_ready'
  | 'stretch_challenge_ready'
  | 'weak_skill_foundation'
  | 'improving_learner'
  | 'teacher_help_needed'
  | 'preference_tuning'
  | 'diagnostic_needed'
  | 'context_hydrated'
  | 'evidence_written'
  | 'checkpoint_written'
  | 'reflection_complete'
  | 'progress_summary_shown'
  | 'system_decision'
  | 'time_budget_expired';

export type LearnerActionType =
  | 'message'
  | 'answer_attempt'
  | 'hint_request'
  | 'feedback'
  | 'continue'
  | 'pause'
  | 'complete'
  | 'choose_option';

export interface LearningSessionStateRecord {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  externalStudentId?: string;
  status: LearningSessionStatus;
  currentMode: LearningSessionMode;
  previousMode?: LearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  activeChallengeId?: string;
  activeRemediationPathId?: string;
  activeRevisionItemId?: string;
  supportLevel?: string;
  difficultyLevel?: string;
  safeProgressSummary?: string;
  safeEvidenceRefs: string[];
  reasonCodes: TutorModeTransitionReasonCode[];
  privacyMetadata: Record<string, unknown>;
  lastTransitionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningSessionEventRecord {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  sessionId: string;
  eventType: string;
  previousMode?: LearningSessionMode;
  nextMode?: LearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeEventSummary?: string;
  safeEvidenceRefs: string[];
  reasonCodes: TutorModeTransitionReasonCode[];
  privacyMetadata: Record<string, unknown>;
  createdAt: Date;
}

export interface TutorModeTransitionDecision {
  allowed: boolean;
  previousMode: LearningSessionMode;
  nextMode: LearningSessionMode;
  reasonCodes: TutorModeTransitionReasonCode[];
  priority: number;
  requiresSafeguardingPause: boolean;
  requiresDeenReferral: boolean;
  requiresEvidenceWrite: boolean;
  requiresCheckpoint: boolean;
  learnerFacingExplanation?: string;
  privacyMetadata: Record<string, unknown>;
}

export interface EndToEndLearningLoopRequest {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  learnerActionType: LearnerActionType;
  message?: string;
  attemptText?: string;
  selectedOptionId?: string;
  feedbackType?: string;
  sessionIntent?: 'learn' | 'practice' | 'revise' | 'challenge' | 'continue';
  clientContext?: Record<string, unknown>;
}

export interface EndToEndLearningLoopResult {
  sessionState: LearningSessionStateRecord;
  mode: LearningSessionMode;
  learnerFacingResponse?: string;
  nextRecommendedAction?: string;
  whyThisNext?: string;
  challenge?: unknown;
  remediationPath?: unknown;
  revisionItem?: unknown;
  progressSummary?: string;
  agencyOptions?: Array<{ label: string; action: string }>;
  checkpointWritten: boolean;
  auditRecorded: boolean;
  privacyMetadata: Record<string, unknown>;
}

export interface SessionContextSnapshot {
  sessionState: LearningSessionStateRecord;
  masteryState?: Record<string, unknown>;
  revisionDue?: Array<Record<string, unknown>>;
  spacedReviewDue?: Array<Record<string, unknown>>;
  weakSkillState?: Array<Record<string, unknown>>;
  growthSummary?: string;
  adaptiveProfile?: Record<string, unknown>;
  difficultyCalibration?: Record<string, unknown>;
  activeChallenge?: Record<string, unknown>;
  activeRemediationPath?: Record<string, unknown>;
}

export interface SessionCheckpoint {
  sessionId: string;
  currentMode: LearningSessionMode;
  previousMode?: LearningSessionMode;
  lastCompletedMode?: LearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  activeChallengeId?: string;
  activeRemediationPathId?: string;
  activeRevisionItemId?: string;
  supportLevel?: string;
  difficultyLevel?: string;
  safeProgressSummary?: string;
  safeEvidenceRefs: string[];
  reasonCodes: TutorModeTransitionReasonCode[];
  privacyMetadata: Record<string, unknown>;
  updatedAt: string;
}

export interface TutorModeExecutionResult {
  mode: LearningSessionMode;
  learnerFacingResponse?: string;
  evidenceWritten: boolean;
  nextRecommendedAction?: string;
  challenge?: unknown;
  remediationPath?: unknown;
  revisionItem?: unknown;
  progressSummary?: string;
  agencyOptions?: Array<{ label: string; action: string }>;
}

export interface SessionResumeDecision {
  canResume: boolean;
  sessionState?: LearningSessionStateRecord;
  carryOverSummary?: string;
  degradeToHydration: boolean;
}

export interface SessionCompletionSummary {
  sessionId: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  whatWasPracticed: string[];
  whatImproved: string[];
  whatNeedsReview: string[];
  nextRecommendedStep: string;
  revisionStatus?: string;
  challengeStatus?: string;
  remediationStatus?: string;
  safeEvidenceCount: number;
  privacyMetadata: Record<string, unknown>;
}

export interface SessionTransitionSafetyDecision {
  allowed: boolean;
  blockedReason?: string;
  redactedFields: string[];
  safeResponse: boolean;
}

export interface SessionAuditRecord {
  actorId: string;
  actorRole: string;
  schoolId: string;
  tutorLearnerId: string;
  sessionId: string;
  previousMode?: LearningSessionMode;
  nextMode?: LearningSessionMode;
  reasonCodes: TutorModeTransitionReasonCode[];
  safeEvidenceRefs: string[];
  privacyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  createdAt: string;
  requestId?: string;
}

export interface LearnerSessionSafeState {
  sessionId: string;
  schoolId: string;
  tutorLearnerId: string;
  status: LearningSessionStatus;
  currentMode: LearningSessionMode;
  previousMode?: LearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  activeChallengeId?: string;
  activeRemediationPathId?: string;
  activeRevisionItemId?: string;
  supportLevel?: string;
  difficultyLevel?: string;
  safeProgressSummary?: string;
  safeEvidenceRefs: string[];
  reasonCodes: TutorModeTransitionReasonCode[];
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeSessionStateForLearner(
  state: LearningSessionStateRecord,
): LearnerSessionSafeState {
  return {
    sessionId: state.id,
    schoolId: state.schoolId,
    tutorLearnerId: state.tutorLearnerId,
    status: state.status,
    currentMode: state.currentMode,
    previousMode: state.previousMode,
    subject: state.subject,
    topic: state.topic,
    skillTag: state.skillTag,
    activeChallengeId: state.activeChallengeId,
    activeRemediationPathId: state.activeRemediationPathId,
    activeRevisionItemId: state.activeRevisionItemId,
    supportLevel: state.supportLevel,
    difficultyLevel: state.difficultyLevel,
    safeProgressSummary: state.safeProgressSummary,
    safeEvidenceRefs: state.safeEvidenceRefs,
    reasonCodes: state.reasonCodes,
    privacyMetadata: state.privacyMetadata,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
  };
}
