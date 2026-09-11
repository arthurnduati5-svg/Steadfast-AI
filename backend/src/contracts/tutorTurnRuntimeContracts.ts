export const TUTOR_TURN_KINDS = [
  'learning_turn',
  'mode_turn',
  'growth_turn',
  'revision_turn',
  'quiz_turn',
  'teach_back_turn',
  'focus_turn',
  'exam_turn',
  'reflection_turn',
  'hint_turn',
  'state_sync_turn',
  'safe_referral_turn',
  'blocked_turn',
] as const;
export type TutorTurnKind = typeof TUTOR_TURN_KINDS[number];

export const TUTOR_TURN_INTENTS = [
  'continue_current_mode',
  'start_focus_mode',
  'start_exam_mode',
  'start_quiz_mode',
  'start_teach_back_mode',
  'start_revision_mode',
  'resolve_growth_action',
  'ask_why_this_next',
  'request_hint',
  'submit_attempt_metadata',
  'submit_reflection_metadata',
  'check_readiness',
  'repair_mistake',
  'review_weak_topic',
  'revise_due_item',
  'exit_mode',
  'pause_mode',
  'resume_mode',
  'safe_content_gap',
  'safe_deen_referral',
  'teacher_support_needed',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_unsafe_request',
  'no_action_available',
] as const;
export type TutorTurnIntent = typeof TUTOR_TURN_INTENTS[number];

export const TUTOR_TURN_DISPATCH_TARGETS = [
  'learning_mode',
  'focus_mode',
  'exam_mode',
  'quiz_mode',
  'teach_back_mode',
  'revision_mode',
  'growth_action',
  'tutor_action',
  'learning_profile',
  'teacher_support',
  'content_gap_referral',
  'deen_referral',
  'blocked',
  'none',
] as const;
export type TutorTurnDispatchTarget = typeof TUTOR_TURN_DISPATCH_TARGETS[number];

export const TUTOR_TURN_STATUSES = [
  'received',
  'validated',
  'blocked',
  'routed',
  'dispatched',
  'state_patched',
  'evidence_recorded',
  'completed',
  'failed',
  'cancelled',
] as const;
export type TutorTurnStatus = typeof TUTOR_TURN_STATUSES[number];

export const TUTOR_TURN_SOURCE_SURFACES = [
  'copilot_chat',
  'fullscreen_copilot',
  'focus_chamber',
  'exam_chamber',
  'quiz_chamber',
  'teach_back_chamber',
  'revision_chamber',
  'growth_panel',
  'teacher_assigned_task',
  'system_recovery',
] as const;
export type TutorTurnSourceSurface = typeof TUTOR_TURN_SOURCE_SURFACES[number];

export const TUTOR_TURN_POLICY_DECISIONS = [
  'allowed',
  'blocked_missing_school_context',
  'blocked_missing_learner_context',
  'blocked_cross_school',
  'blocked_cross_student',
  'blocked_role_scope',
  'blocked_forbidden_raw_field',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_unsafe_request',
  'blocked_missing_approved_content',
  'blocked_deen_sensitive_uncertain',
  'blocked_live_ai_not_allowed',
  'blocked_live_school_connector_not_allowed',
  'blocked_unknown_mode',
  'blocked_invalid_transition',
  'blocked_no_active_session',
  'blocked_no_safe_target',
] as const;
export type TutorTurnPolicyDecision = typeof TUTOR_TURN_POLICY_DECISIONS[number];

export const TUTOR_TURN_MODE_ACTIONS = [
  'enter',
  'continue',
  'step',
  'hint',
  'attempt',
  'reflect',
  'repair',
  'summarize',
  'exit',
  'pause',
  'resume',
  'cancel',
  'route_to_growth',
] as const;
export type TutorTurnModeAction = typeof TUTOR_TURN_MODE_ACTIONS[number];

export const TUTOR_TURN_SAFE_REASON_CODES = [
  'school_identity_verified',
  'learner_identity_verified',
  'student_ownership_confirmed',
  'role_access_allowed',
  'no_active_session',
  'insufficient_evidence',
  'content_gap_detected',
  'deen_uncertainty_detected',
  'answer_key_request_detected',
  'model_answer_request_detected',
  'unsafe_request_detected',
  'live_ai_request_detected',
  'live_school_connector_request_detected',
  'forbidden_field_detected',
  'cross_school_blocked',
  'cross_student_blocked',
  'missing_school_context',
  'missing_learner_context',
  'missing_approved_content',
  'missing_active_mode',
  'invalid_mode_transition',
  'mode_dispatch_failed',
  'state_patch_failed',
  'evidence_write_failed',
  'telemetry_write_failed',
  'blocked_by_policy',
  'dispatch_completed',
  'referral_content_gap',
  'referral_deen',
  'referral_teacher_support',
  'no_action_available',
  'multi_mode_not_allowed',
  'mode_not_found',
  'session_not_found',
] as const;
export type TutorTurnSafeReasonCode = typeof TUTOR_TURN_SAFE_REASON_CODES[number];

export const TUTOR_TURN_EVENT_TYPES = [
  'tutor_turn_received',
  'tutor_turn_validated',
  'tutor_turn_blocked',
  'tutor_turn_routed',
  'tutor_turn_dispatched',
  'tutor_turn_state_patched',
  'tutor_turn_evidence_recorded',
  'tutor_turn_completed',
  'tutor_turn_failed',
] as const;
export type TutorTurnEventType = typeof TUTOR_TURN_EVENT_TYPES[number];

export const FORBIDDEN_TUTOR_TURN_FIELDS = [
  'rawText',
  'rawMessage',
  'studentMessage',
  'messageBody',
  'rawNote',
  'noteText',
  'revisionText',
  'savedText',
  'questionText',
  'promptText',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'studentExplanation',
  'rawExplanation',
  'explanationText',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
  'markingScheme',
  'modelAnswer',
  'correctAnswer',
  'expectedAnswer',
  'teacherOnlyNote',
  'safeguardingRawDetail',
  'deenSensitivePrivateText',
  'privateDisclosure',
  'rawConversation',
  'rawTranscript',
  'transcript',
  'audioBlob',
  'audioUrl',
  'recordingUrl',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
  'connectionString',
] as const;
export type ForbiddenTutorTurnField = typeof FORBIDDEN_TUTOR_TURN_FIELDS[number];

export interface TutorTurnRequest {
  schoolId: string;
  studentId: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnKind: TutorTurnKind;
  turnIntent: TutorTurnIntent;
  turnSource?: TutorTurnSourceSurface;
  requestedMode?: string;
  activeMode?: string;
  modeSessionId?: string;
  growthActionPlanId?: string;
  approvedContentRef?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType?: string;
  targetRef?: string;
  inputFingerprint?: string;
  inputSafetyFlags?: string[];
  safeEvidenceRefs?: string[];
  safeReasonCodes?: string[];
  sourceSurface?: TutorTurnSourceSurface;
  execute?: boolean;
  dryRun?: boolean;
}

export interface TutorTurnResolveRequest {
  schoolId: string;
  studentId: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnKind: TutorTurnKind;
  turnIntent: TutorTurnIntent;
  turnSource?: TutorTurnSourceSurface;
  requestedMode?: string;
  activeMode?: string;
  modeSessionId?: string;
  growthActionPlanId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType?: string;
  targetRef?: string;
  approvedContentRef?: string;
  safeEvidenceRefs?: string[];
  safeReasonCodes?: string[];
  sourceSurface?: TutorTurnSourceSurface;
}

export interface TutorTurnDispatchRequest {
  schoolId: string;
  studentId: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnKind: TutorTurnKind;
  turnIntent: TutorTurnIntent;
  turnSource?: TutorTurnSourceSurface;
  requestedMode?: string;
  activeMode?: string;
  modeSessionId?: string;
  growthActionPlanId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType?: string;
  targetRef?: string;
  approvedContentRef?: string;
  safeEvidenceRefs?: string[];
  safeReasonCodes?: string[];
  sourceSurface?: TutorTurnSourceSurface;
  execute: boolean;
  dryRun?: boolean;
}

export interface TutorTurnStateRequest {
  schoolId: string;
  studentId: string;
  turnId?: string;
  conversationId?: string;
  tutorSessionId?: string;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}

export interface TutorTurnEventRequest {
  schoolId: string;
  studentId: string;
  turnId?: string;
  eventType: TutorTurnEventType;
  eventStatus: string;
  safeMetadataJson?: Record<string, unknown>;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}

export interface TutorTurnContext {
  schoolId: string;
  studentId: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnKind: TutorTurnKind;
  turnIntent: TutorTurnIntent;
  turnSource?: TutorTurnSourceSurface;
  requestedMode?: string;
  activeMode?: string;
  modeSessionId?: string;
  growthActionPlanId?: string;
  approvedContentRef?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType?: string;
  targetRef?: string;
  inputFingerprint?: string;
  inputSafetyFlags?: string[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  sourceSurface?: TutorTurnSourceSurface;
  execute: boolean;
  dryRun: boolean;
}

export interface TutorTurnPolicyResult {
  decision: TutorTurnPolicyDecision;
  allowed: boolean;
  reasonCodes: TutorTurnSafeReasonCode[];
  blockReasons: string[];
  safeStudentMessage?: string;
  suggestedNextIntent?: TutorTurnIntent;
}

export interface TutorTurnDispatchDecision {
  dispatchTarget: TutorTurnDispatchTarget;
  modeAction?: TutorTurnModeAction;
  routeReasonCode: TutorTurnSafeReasonCode;
  confidenceBucket: string;
  requiresExecution: boolean;
}

export interface TutorTurnModeDispatchResult {
  dispatchTarget: TutorTurnDispatchTarget;
  modeAction?: TutorTurnModeAction;
  modeSessionId?: string;
  dispatchStatus: 'pending' | 'dispatched' | 'failed' | 'skipped';
  failureReasonCode?: string;
  safeMetadata?: Record<string, unknown>;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface TutorTurnStatePatch {
  activeMode?: string;
  modeSessionId?: string;
  lastTurnId?: string;
  lastDispatchTarget?: string;
  lastSafeReasonCodes?: string[];
  lastSafeEvidenceRefs?: string[];
  lastWhyThisNextCode?: string;
  lastUpdatedAt: string;
}

export interface TutorTurnEvidenceBridgeResult {
  evidenceType: string;
  recorded: boolean;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface TutorTurnTelemetryEvent {
  eventType: TutorTurnEventType;
  eventStatus: string;
  schoolId: string;
  studentId: string;
  turnId?: string;
  safeMetadata?: Record<string, unknown>;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
  createdAt: string;
}

export interface TutorTurnSafeResponse {
  ok: boolean;
  turnId?: string;
  status: TutorTurnStatus;
  dispatchTarget?: TutorTurnDispatchTarget;
  modeAction?: TutorTurnModeAction;
  policyDecision?: TutorTurnPolicyDecision;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  statePatch?: TutorTurnStatePatch;
  dispatchResult?: TutorTurnModeDispatchResult;
  evidenceResult?: TutorTurnEvidenceBridgeResult;
  studentSafeMessage?: string;
  suggestedNextIntent?: TutorTurnIntent;
}

export interface TutorTurnSafeErrorResponse {
  ok: boolean;
  status: 'failed' | 'blocked';
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  studentSafeMessage?: string;
}

export interface TutorTurnRuntimeResult {
  ok: boolean;
  turnId?: string;
  status: TutorTurnStatus;
  dispatchTarget?: TutorTurnDispatchTarget;
  policyDecision?: TutorTurnPolicyDecision;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  statePatch?: TutorTurnStatePatch;
  dispatchResult?: TutorTurnModeDispatchResult;
  evidenceResult?: TutorTurnEvidenceBridgeResult;
  telemetryEvent?: TutorTurnTelemetryEvent;
  studentSafeMessage?: string;
  suggestedNextIntent?: TutorTurnIntent;
  error?: string;
}
