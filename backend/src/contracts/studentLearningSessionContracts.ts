export const STUDENT_LEARNING_SESSION_STATUSES = [
  'created', 'active', 'paused', 'resumed', 'handoff_pending',
  'completed', 'abandoned', 'expired', 'blocked',
] as const;
export type StudentLearningSessionStatus = typeof STUDENT_LEARNING_SESSION_STATUSES[number];

export const STUDENT_LEARNING_SESSION_STAGES = [
  'orienting', 'attempting', 'reflecting', 'correcting',
  'practising', 'revisiting', 'growing', 'blocked',
] as const;
export type StudentLearningSessionStage = typeof STUDENT_LEARNING_SESSION_STAGES[number];

export const STUDENT_LEARNING_SESSION_MODES = [
  'none', 'chat', 'focus', 'exam', 'quiz', 'teach_back',
  'revision', 'challenge', 'remediation', 'growth_action',
  'tutor_turn', 'blocked',
] as const;
export type StudentLearningSessionMode = typeof STUDENT_LEARNING_SESSION_MODES[number];

export const STUDENT_LEARNING_SESSION_TRANSITION_TYPES = [
  'start_session', 'resume_session', 'pause_session',
  'complete_session', 'abandon_session', 'expire_session',
  'enter_focus', 'exit_focus', 'enter_exam', 'exit_exam',
  'enter_quiz', 'exit_quiz', 'enter_teach_back', 'exit_teach_back',
  'enter_revision', 'exit_revision', 'enter_challenge', 'exit_challenge',
  'enter_remediation', 'exit_remediation', 'run_growth_action',
  'run_tutor_turn', 'handoff_to_teacher_support', 'blocked',
] as const;
export type StudentLearningSessionTransitionType = typeof STUDENT_LEARNING_SESSION_TRANSITION_TYPES[number];

export const STUDENT_LEARNING_SESSION_TRANSITION_STATUSES = [
  'allowed', 'allowed_with_scaffold', 'blocked',
  'requires_source', 'requires_teacher_support',
  'requires_safeguarding_boundary', 'requires_deen_referral',
] as const;
export type StudentLearningSessionTransitionStatus = typeof STUDENT_LEARNING_SESSION_TRANSITION_STATUSES[number];

export const STUDENT_LEARNING_SESSION_POLICY_DECISIONS = [
  'allowed', 'allowed_with_scaffold',
  'blocked_no_school_context', 'blocked_no_learner_identity',
  'blocked_cross_school', 'blocked_cross_learner',
  'blocked_forbidden_raw_field', 'blocked_hidden_reasoning',
  'blocked_answer_key', 'blocked_model_answer',
  'blocked_marking_scheme', 'blocked_correct_answer',
  'blocked_teacher_only', 'blocked_source_required',
  'blocked_content_gap', 'blocked_deen_referral',
  'blocked_safeguarding_boundary', 'blocked_invalid_transition',
  'blocked_session_closed', 'blocked_live_ai',
  'blocked_live_school_connector',
] as const;
export type StudentLearningSessionPolicyDecision = typeof STUDENT_LEARNING_SESSION_POLICY_DECISIONS[number];

export const STUDENT_LEARNING_SESSION_SOURCE_TRUTH_STATUSES = [
  'real', 'mixed', 'demo', 'fallback', 'synthetic_test',
  'unknown', 'stale', 'expired', 'content_gap',
  'source_required', 'blocked', 'insufficient',
] as const;
export type StudentLearningSessionSourceTruthStatus = typeof STUDENT_LEARNING_SESSION_SOURCE_TRUTH_STATUSES[number];

export const STUDENT_LEARNING_SESSION_CONFIDENCE_BUCKETS = [
  'not_enough_evidence', 'low', 'medium', 'high', 'mixed', 'blocked',
] as const;
export type StudentLearningSessionConfidenceBucket = typeof STUDENT_LEARNING_SESSION_CONFIDENCE_BUCKETS[number];

export const STUDENT_LEARNING_SESSION_REASON_CODES = [
  'session_created', 'session_resumed', 'session_paused',
  'session_completed', 'session_expired', 'session_abandoned',
  'learner_ownership_verified', 'learner_ownership_not_proven',
  'cross_school_blocked', 'cross_learner_blocked',
  'invalid_transition', 'session_closed', 'source_required',
  'content_gap', 'deen_referral_required',
  'safeguarding_boundary_applied', 'forbidden_raw_field_detected',
  'hidden_reasoning_detected', 'protected_answer_field_detected',
  'teacher_only_field_detected', 'safe_resume_context_created',
  'safe_snapshot_created', 'safe_exit_summary_created',
  'session_evidence_bridged', 'no_live_ai', 'no_live_school_connector',
  'no_existing_session_found', 'session_active', 'not_enough_safe_session_context',
] as const;
export type StudentLearningSessionReasonCode = typeof STUDENT_LEARNING_SESSION_REASON_CODES[number];

export const FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS = [
  'rawText', 'rawMessage', 'studentMessage', 'messageBody',
  'rawNote', 'noteText', 'revisionText', 'savedText',
  'questionText', 'rawQuestion', 'promptText',
  'answerText', 'studentAnswer', 'rawAnswer',
  'studentExplanation', 'rawExplanation', 'explanationText',
  'solution', 'fullSolution', 'finalAnswer',
  'aiResponse', 'prompt', 'providerResponse',
  'chainOfThought', 'hiddenReasoning', 'internalReasoning',
  'modelReasoning', 'reasoningTrace', 'scratchpad',
  'teacherOnlyNote', 'teacherOnlyReport', 'teacherInsight',
  'teacherReport', 'teacherOnlyRubric',
  'answerKey', 'markingScheme', 'modelAnswer',
  'correctAnswer', 'expectedAnswer',
  'safeguardingRawDetail', 'safeguardingCaseNote',
  'deenSensitivePrivateText', 'privateDisclosure',
  'rawConversation', 'rawTranscript', 'transcript',
  'audioBlob', 'audioUrl', 'recordingUrl',
  'token', 'apiKey', 'authorization', 'cookie',
  'privateKey', 'databaseUrl', 'connectionString',
] as const;
export type ForbiddenStudentLearningSessionField = typeof FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS[number];

export const SAFE_RESPONSE_FLAGS = {
  rawPrivateDataIncluded: false as const,
  hiddenReasoningIncluded: false as const,
  teacherOnlyDataIncluded: false as const,
  answerKeyIncluded: false as const,
  modelAnswerIncluded: false as const,
  markingSchemeIncluded: false as const,
  correctAnswerIncluded: false as const,
  safeguardingRawDetailIncluded: false as const,
  deenSensitivePrivateTextIncluded: false as const,
  rawTranscriptIncluded: false as const,
  liveAiCallIncluded: false as const,
  liveSchoolConnectorIncluded: false as const,
};

export interface StudentLearningSessionContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface StudentLearningSessionRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface StudentLearningSessionRecord {
  id: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  status: StudentLearningSessionStatus;
  stage: StudentLearningSessionStage;
  currentMode: StudentLearningSessionMode;
  previousMode?: StudentLearningSessionMode;
  transitionStatus?: StudentLearningSessionTransitionStatus;
  allowedTransitions: StudentLearningSessionTransitionType[];
  blockedTransitions: StudentLearningSessionTransitionType[];
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeEvidenceRefs: string[];
  safeActionRefs: string[];
  lastGrowthActionId?: string;
  lastTutorTurnId?: string;
  lastChallengeId?: string;
  lastRemediationPathId?: string;
  lastRecommendationId?: string;
  lastEvidenceEventId?: string;
  startedAt: Date;
  lastActiveAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentLearningSessionState {
  id: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  status: StudentLearningSessionStatus;
  stage: StudentLearningSessionStage;
  currentMode: StudentLearningSessionMode;
  previousMode?: StudentLearningSessionMode;
  allowedTransitions: StudentLearningSessionTransitionType[];
  blockedTransitions: StudentLearningSessionTransitionType[];
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus;
  confidenceBucket: StudentLearningSessionConfidenceBucket;
  lastActiveAt: Date;
}

export interface StudentLearningSessionSnapshot {
  sessionId: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  sessionStatus: StudentLearningSessionStatus;
  sessionStage: StudentLearningSessionStage;
  currentMode: StudentLearningSessionMode;
  allowedTransitions: StudentLearningSessionTransitionType[];
  blockedTransitions: StudentLearningSessionTransitionType[];
  resumeContext: StudentLearningSessionResumeContext;
  safeProgressMarkers: string[];
  safeReasonCodes: StudentLearningSessionReasonCode[];
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus;
  confidenceBucket: StudentLearningSessionConfidenceBucket;
  privacyFlags: typeof SAFE_RESPONSE_FLAGS;
  updatedAt: string;
}

export interface StudentLearningSessionResumeContext {
  sessionId: string;
  currentMode: StudentLearningSessionMode;
  sessionStage: StudentLearningSessionStage;
  safeTopicLabel?: string;
  safeSkillLabel?: string;
  lastSafeActionLabel?: string;
  nextSuggestedActionType?: string;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeEvidenceRefs: string[];
  confidenceBucket: StudentLearningSessionConfidenceBucket;
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus;
  lastActiveAt?: string;
  status: 'sufficient' | 'insufficient';
}

export interface StudentLearningSessionTransitionRequest {
  sessionId: string;
  transitionType: StudentLearningSessionTransitionType;
  requestedMode?: StudentLearningSessionMode;
  schoolId: string;
  studentId: string;
  tutorLearnerId: string;
}

export interface StudentLearningSessionTransitionResult {
  allowed: boolean;
  transitionType: StudentLearningSessionTransitionType;
  fromMode: StudentLearningSessionMode;
  toMode: StudentLearningSessionMode;
  policyDecision: StudentLearningSessionPolicyDecision;
  transitionStatus: StudentLearningSessionTransitionStatus;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeAlternatives: StudentLearningSessionTransitionType[];
  sessionStatus: StudentLearningSessionStatus;
  sessionStage: StudentLearningSessionStage;
}

export interface StudentLearningSessionLifecycleResult {
  session: StudentLearningSessionRecord;
  created: boolean;
  resumed: boolean;
  safeReasonCodes: StudentLearningSessionReasonCode[];
}

export interface StudentLearningSessionModeState {
  mode: StudentLearningSessionMode;
  status: string;
  stage: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  lastUpdatedAt: string;
  privacyFlags: typeof SAFE_RESPONSE_FLAGS;
}

export interface StudentLearningSessionExitSummary {
  sessionId: string;
  status: StudentLearningSessionStatus;
  startedAt: string;
  endedAt: string;
  durationBucket: string;
  modesUsed: StudentLearningSessionMode[];
  safeProgressMarkers: string[];
  safeEvidenceRefs: string[];
  nextRecommendedActionType: string;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  sourceTruthStatus: StudentLearningSessionSourceTruthStatus;
  confidenceBucket: StudentLearningSessionConfidenceBucket;
  privacyFlags: typeof SAFE_RESPONSE_FLAGS;
}

export interface StudentLearningSessionEvidenceBridgeInput {
  sessionId: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  sessionStatus: StudentLearningSessionStatus;
  sessionStage: StudentLearningSessionStage;
  currentMode: StudentLearningSessionMode;
  modesUsed: StudentLearningSessionMode[];
  safeProgressMarkers: string[];
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface StudentLearningSessionEvidenceBridgeResult {
  bridged: boolean;
  evidenceRef?: string;
  safeReasonCodes: StudentLearningSessionReasonCode[];
}

export interface StudentLearningSessionActionHistoryEvent {
  eventId: string;
  sessionId: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  actionType: string;
  mode: StudentLearningSessionMode;
  transitionType?: StudentLearningSessionTransitionType;
  status: string;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface StudentLearningSessionAuditEvent {
  eventId: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  sessionId: string;
  eventType: string;
  currentMode?: StudentLearningSessionMode;
  transitionType?: StudentLearningSessionTransitionType;
  policyDecision?: StudentLearningSessionPolicyDecision;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  createdAt: string;
}

export interface StudentLearningSessionAccessResult {
  allowed: boolean;
  policyDecision: StudentLearningSessionPolicyDecision;
  safeReasonCodes: StudentLearningSessionReasonCode[];
}

export interface StudentLearningSessionPrivacyResult {
  safe: boolean;
  forbiddenFieldsFound: string[];
  policyDecision: StudentLearningSessionPolicyDecision;
  safeReasonCodes: StudentLearningSessionReasonCode[];
}

export interface StudentLearningSessionResponse {
  ok: boolean;
  status: string;
  data?: Record<string, unknown>;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  policyDecision?: StudentLearningSessionPolicyDecision;
  sessionId?: string;
  sessionStatus?: StudentLearningSessionStatus;
  sessionStage?: StudentLearningSessionStage;
  currentMode?: StudentLearningSessionMode;
  sourceTruthStatus?: StudentLearningSessionSourceTruthStatus;
  confidenceBucket?: StudentLearningSessionConfidenceBucket;
  message?: string;
  generatedAt: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
  rawTranscriptIncluded: false;
  liveAiCallIncluded: false;
  liveSchoolConnectorIncluded: false;
}

export interface StudentLearningSessionErrorResponse {
  ok: false;
  status: string;
  policyDecision: StudentLearningSessionPolicyDecision;
  safeReasonCodes: StudentLearningSessionReasonCode[];
  message: string;
  generatedAt: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
  rawTranscriptIncluded: false;
  liveAiCallIncluded: false;
  liveSchoolConnectorIncluded: false;
}
