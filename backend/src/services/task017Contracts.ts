import type { LearningSessionMode, LearningSessionStatus, LearnerActionType } from './studentLearningSessionContracts';

export type TutorConversationMode =
  | 'message'
  | 'answer_attempt'
  | 'hint_request'
  | 'continue'
  | 'revision'
  | 'challenge'
  | 'remediation'
  | 'feedback'
  | 'pause'
  | 'complete';

export const TUTOR_CONVERSATION_MODES: readonly TutorConversationMode[] = [
  'message', 'answer_attempt', 'hint_request', 'continue',
  'revision', 'challenge', 'remediation', 'feedback',
  'pause', 'complete',
] as const;

export const MODE_TO_LEARNER_ACTION: Record<TutorConversationMode, LearnerActionType> = {
  message: 'message',
  answer_attempt: 'answer_attempt',
  hint_request: 'hint_request',
  continue: 'continue',
  revision: 'continue',
  challenge: 'continue',
  remediation: 'continue',
  feedback: 'feedback',
  pause: 'pause',
  complete: 'complete',
};

export interface TutorConversationTurnRequest {
  sessionId?: string;
  mode: TutorConversationMode;
  message?: string;
  attemptText?: string;
  selectedOptionId?: string;
  feedbackType?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  clientContext?: Record<string, unknown>;
  idempotencyKey?: string;
  stream?: boolean;
}

export interface TutorConversationResponseEnvelope {
  requestId: string;
  correlationId: string;
  sessionId: string;
  status: LearningSessionStatus;
  mode: LearningSessionMode;
  sessionState: {
    currentMode: LearningSessionMode;
    previousMode?: LearningSessionMode;
    subject?: string;
    topic?: string;
    skillTag?: string;
    safeProgressSummary?: string;
    safeEvidenceRefs: string[];
    reasonCodes: string[];
  };
  learnerFacingResponse?: string;
  nextRecommendedAction?: string;
  whyThisNext?: string;
  challenge?: unknown;
  remediationPath?: unknown;
  revisionItem?: unknown;
  agencyOptions?: Array<{ label: string; action: string }>;
  progressSummary?: string;
  streaming?: boolean;
  privacyMetadata: Record<string, unknown>;
  safetyMetadata: {
    safetyCheckPassed: boolean;
    deenSensitivityHandled: boolean;
    safeguardingBoundaryApplied: boolean;
  };
  createdAt: string;
}

export type ConversationRuntimeErrorCode =
  | 'AUTH_REQUIRED'
  | 'LEARNER_CONTEXT_REQUIRED'
  | 'FORBIDDEN_SESSION_SCOPE'
  | 'INVALID_REQUEST'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_CONFLICT'
  | 'SAFETY_BOUNDARY'
  | 'DEEN_SOURCE_SENSITIVE'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'LEARNING_LOOP_FAILED'
  | 'STREAM_ABORTED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'UNKNOWN_SAFE_ERROR';

export const CONVERSATION_ERROR_CODES: Record<string, ConversationRuntimeErrorCode> = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  LEARNER_CONTEXT_REQUIRED: 'LEARNER_CONTEXT_REQUIRED',
  FORBIDDEN_SESSION_SCOPE: 'FORBIDDEN_SESSION_SCOPE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_CONFLICT: 'SESSION_CONFLICT',
  SAFETY_BOUNDARY: 'SAFETY_BOUNDARY',
  DEEN_SOURCE_SENSITIVE: 'DEEN_SOURCE_SENSITIVE',
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  LEARNING_LOOP_FAILED: 'LEARNING_LOOP_FAILED',
  STREAM_ABORTED: 'STREAM_ABORTED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN_SAFE_ERROR: 'UNKNOWN_SAFE_ERROR',
};

export interface TutorConversationErrorEnvelope {
  requestId: string;
  correlationId: string;
  status: 'error';
  errorCode: ConversationRuntimeErrorCode;
  safeMessage: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
}

export type TutorStreamingEventType =
  | 'conversation.started'
  | 'session.resolved'
  | 'mode.selected'
  | 'safety.checked'
  | 'response.delta'
  | 'response.completed'
  | 'recommendation.ready'
  | 'challenge.ready'
  | 'remediation.ready'
  | 'revision.ready'
  | 'evidence.persisted'
  | 'checkpoint.saved'
  | 'conversation.completed'
  | 'conversation.error';

export const STREAM_EVENT_TYPES: readonly TutorStreamingEventType[] = [
  'conversation.started',
  'session.resolved',
  'mode.selected',
  'safety.checked',
  'response.delta',
  'response.completed',
  'recommendation.ready',
  'challenge.ready',
  'remediation.ready',
  'revision.ready',
  'evidence.persisted',
  'checkpoint.saved',
  'conversation.completed',
  'conversation.error',
];

export interface TutorStreamingEvent {
  eventId: string;
  eventType: TutorStreamingEventType;
  requestId: string;
  correlationId: string;
  sessionId?: string;
  sequence: number;
  payload: Record<string, unknown>;
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface StreamingSafetyDecision {
  allowed: boolean;
  redactedFields: string[];
  blockedReason?: string;
}

export interface ConversationIdempotencyRecord {
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string;
  idempotencyKey: string;
  requestHash: string;
  status: 'in_progress' | 'completed' | 'failed';
  safeResultJson?: string;
  errorCode?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationAuditRecord {
  actorId: string;
  actorRole: 'learner';
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string;
  requestId: string;
  correlationId: string;
  route: string;
  mode: string;
  streaming: boolean;
  status: string;
  errorCode?: string;
  reasonCodes: string[];
  safeEvidenceRefs: string[];
  privacyDecision: string;
  safetyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  createdAt: string;
}

export interface TutorRuntimeHealthStatus {
  ok: boolean;
  status: string;
  service: string;
  uptimeSec: number;
  version: string;
  timestamp: string;
  requestId: string;
}

export interface TutorRuntimeReadinessStatus {
  ok: boolean;
  service: string;
  checks: Record<string, { ok: boolean; status: string }>;
  degraded: string[];
  timestamp: string;
}

export interface ProductionSmokeTestResult {
  name: string;
  passed: boolean;
  assertions: Array<{ label: string; passed: boolean; detail?: string }>;
  error?: string;
}

export interface ConversationRequestValidationResult {
  valid: boolean;
  error?: ConversationRuntimeErrorCode;
  safeMessage?: string;
}

export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_ATTEMPT_TEXT_LENGTH = 20000;
export const MAX_CLIENT_CONTEXT_SIZE = 5000;
export const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export const UNSAFE_FIELD_PATTERNS = [
  'rawPrompt', 'systemPrompt', 'developerPrompt', 'modelDraft',
  'providerResponse', 'rawTranscript', 'privateMemory', 'teacherOnlyNotes',
  'safeguardingRaw', 'answerKey', 'solutionSteps', 'internalScoring',
  'internalRubric', 'stackTrace', 'databaseConnectionString',
  'connectionString', 'secret', 'apiKey', 'token',
  'deenSensitiveRawQuestion',
];
