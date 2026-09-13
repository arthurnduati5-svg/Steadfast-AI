export const NO_AI_BYPASS_ROUTE_CATEGORIES = [
  'learner_conversation',
  'tutor_conversation',
  'tutor_turn',
  'learning_session',
  'learning_mode',
  'focus_mode',
  'exam_mode',
  'quiz_mode',
  'teach_back_mode',
  'revision_mode',
  'growth_action',
  'safe_evidence',
  'teacher_safe_insight',
  'learner_transparency',
  'adaptive_recommendation',
  'adaptive_challenge',
  'remediation',
  'legacy_ai',
  'unknown',
] as const;

export type NoAiBypassRouteCategory =
  (typeof NO_AI_BYPASS_ROUTE_CATEGORIES)[number];

export const NO_AI_BYPASS_RUNTIME_STAGES = [
  'route_received',
  'school_auth_checked',
  'school_context_verified',
  'learner_scope_checked',
  'session_scope_checked',
  'source_truth_checked',
  'privacy_checked',
  'answer_protection_checked',
  'deen_boundary_checked',
  'safeguarding_boundary_checked',
  'provider_boundary_checked',
  'runtime_dispatched',
  'safe_response_built',
  'audit_recorded',
  'blocked',
] as const;

export type NoAiBypassRuntimeStage =
  (typeof NO_AI_BYPASS_RUNTIME_STAGES)[number];

export const NO_AI_BYPASS_POLICY_DECISIONS = [
  'allowed_runtime_dispatch',
  'blocked_missing_school_auth',
  'blocked_missing_verified_school_context',
  'blocked_cross_school',
  'blocked_cross_learner',
  'blocked_unapproved_route_provider_import',
  'blocked_direct_ai_provider_call',
  'blocked_direct_genkit_call',
  'blocked_raw_provider_response',
  'blocked_hidden_reasoning',
  'blocked_answer_key',
  'blocked_marking_scheme',
  'blocked_model_answer',
  'blocked_correct_answer',
  'blocked_teacher_only_data',
  'blocked_raw_private_content',
  'blocked_source_required',
  'blocked_deen_referral',
  'blocked_safeguarding_boundary',
  'blocked_unknown_route',
  'blocked_unregistered_runtime',
] as const;

export type NoAiBypassPolicyDecision =
  (typeof NO_AI_BYPASS_POLICY_DECISIONS)[number];

export const NO_AI_BYPASS_PROVIDER_BOUNDARY_STATUSES = [
  'no_provider_needed',
  'provider_needed_after_policy',
  'provider_blocked',
  'provider_gateway_only',
  'direct_provider_import_detected',
  'direct_provider_call_detected',
  'raw_provider_response_detected',
  'unknown',
] as const;

export type NoAiBypassProviderBoundaryStatus =
  (typeof NO_AI_BYPASS_PROVIDER_BOUNDARY_STATUSES)[number];

export const NO_AI_BYPASS_REASON_CODES = [
  'school_auth_required',
  'verified_school_context_required',
  'learner_scope_required',
  'session_scope_required',
  'source_truth_required',
  'privacy_guard_required',
  'answer_protection_required',
  'deen_boundary_required',
  'safeguarding_boundary_required',
  'provider_gateway_required',
  'route_provider_import_detected',
  'route_direct_provider_call_detected',
  'raw_provider_response_detected',
  'hidden_reasoning_detected',
  'answer_key_detected',
  'marking_scheme_detected',
  'model_answer_detected',
  'correct_answer_detected',
  'teacher_only_data_detected',
  'raw_private_content_detected',
  'approved_runtime_path',
  'audit_recorded',
  'no_live_ai_in_task',
  'no_live_school_connector_in_task',
] as const;

export type NoAiBypassReasonCode =
  (typeof NO_AI_BYPASS_REASON_CODES)[number];

export const NO_AI_BYPASS_FORBIDDEN_IMPORTS = [
  'openai',
  'OpenAI',
  'genkit',
  'googleai',
  'anthropic',
  'genkitx-openai',
  '@genkit-ai/googleai',
  '@genkit-ai/flow',
  '@genkit-ai/next',
] as const;

export type NoAiBypassForbiddenImport =
  (typeof NO_AI_BYPASS_FORBIDDEN_IMPORTS)[number];

export const NO_AI_BYPASS_FORBIDDEN_FIELDS = [
  'rawText',
  'rawMessage',
  'studentMessage',
  'messageBody',
  'rawNote',
  'noteText',
  'questionText',
  'rawQuestion',
  'promptText',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'studentExplanation',
  'rawExplanation',
  'solution',
  'fullSolution',
  'finalAnswer',
  'aiResponse',
  'rawAiResponse',
  'providerResponse',
  'rawProviderResponse',
  'prompt',
  'aiPrompt',
  'providerPrompt',
  'chainOfThought',
  'hiddenReasoning',
  'internalReasoning',
  'modelReasoning',
  'reasoningTrace',
  'scratchpad',
  'teacherOnlyNote',
  'teacherOnlyReport',
  'teacherInsight',
  'teacherReport',
  'answerKey',
  'markingScheme',
  'modelAnswer',
  'correctAnswer',
  'expectedAnswer',
  'safeguardingRawDetail',
  'deenSensitivePrivateText',
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

export type NoAiBypassForbiddenField =
  (typeof NO_AI_BYPASS_FORBIDDEN_FIELDS)[number];

export interface NoAiBypassSafeResponseFlags {
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
  providerPromptIncluded: false;
  providerResponseIncluded: false;
  liveAiCallIncluded: false;
  liveSchoolConnectorIncluded: false;
}

export interface NoAiBypassRouteRegistration {
  routeId: string;
  path: string;
  methods: string[];
  category: NoAiBypassRouteCategory;
  requiresSchoolAuth: boolean;
  requiresVerifiedSchoolContext: boolean;
  requiresLearnerScope: boolean;
  requiresSessionScope: boolean;
  requiresSourceTruth: boolean;
  requiresPrivacyGuard: boolean;
  requiresAnswerProtection: boolean;
  requiresDeenBoundary: boolean;
  requiresSafeguardingBoundary: boolean;
  allowedRuntimeService: string;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
}

export interface NoAiBypassRuntimeDecision {
  allowed: boolean;
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes: NoAiBypassReasonCode[];
  blockReason?: string;
  runtimeStage: NoAiBypassRuntimeStage;
}

export interface NoAiBypassAuditEvent {
  eventId: string;
  routeId: string;
  routePath: string;
  method: string;
  category: NoAiBypassRouteCategory;
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes: NoAiBypassReasonCode[];
  requestId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  createdAt: string;
}

export interface NoAiBypassProviderBoundaryScanResult {
  filePath: string;
  hasForbiddenImport: boolean;
  forbiddenImportsFound: string[];
  hasDirectProviderCall: boolean;
  directProviderCallPatterns: string[];
  hasRawProviderResponseField: boolean;
  rawProviderResponseFields: string[];
  hasHiddenReasoningField: boolean;
  hiddenReasoningFields: string[];
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
}

export interface NoAiBypassRouteAuditResult {
  routeId: string;
  path: string;
  methods: string[];
  category: NoAiBypassRouteCategory;
  registered: boolean;
  hasSchoolAuth: boolean;
  hasVerifiedSchoolContext: boolean;
  providerImportsFound: string[];
  directProviderCallsFound: string[];
  allowedRuntimePath: string;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safe: boolean;
}

export interface NoAiBypassModuleScanResult {
  filePath: string;
  forbiddenImportsFound: string[];
  directProviderCallsFound: string[];
  rawProviderResponseFieldsFound: string[];
  hiddenReasoningFieldsFound: string[];
  safe: boolean;
}

export interface NoAiBypassSafeResponse {
  ok: boolean;
  status: string;
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes: NoAiBypassReasonCode[];
  generatedAt: string;
  safeResponseFlags: NoAiBypassSafeResponseFlags;
  data?: Record<string, unknown>;
  error?: string;
}

export interface NoAiBypassErrorResponse {
  ok: false;
  status: string;
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes: NoAiBypassReasonCode[];
  error: string;
  generatedAt: string;
  safeResponseFlags: NoAiBypassSafeResponseFlags;
}

export const SAFE_RESPONSE_FLAGS_DISABLED: NoAiBypassSafeResponseFlags = {
  rawPrivateDataIncluded: false,
  hiddenReasoningIncluded: false,
  teacherOnlyDataIncluded: false,
  answerKeyIncluded: false,
  modelAnswerIncluded: false,
  markingSchemeIncluded: false,
  correctAnswerIncluded: false,
  safeguardingRawDetailIncluded: false,
  deenSensitivePrivateTextIncluded: false,
  rawTranscriptIncluded: false,
  providerPromptIncluded: false,
  providerResponseIncluded: false,
  liveAiCallIncluded: false,
  liveSchoolConnectorIncluded: false,
};
