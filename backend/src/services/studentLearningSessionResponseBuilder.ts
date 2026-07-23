import type {
  StudentLearningSessionResponse,
  StudentLearningSessionErrorResponse,
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionConfidenceBucket,
  StudentLearningSessionReasonCode,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionSnapshot,
  StudentLearningSessionResumeContext,
  StudentLearningSessionTransitionResult,
  StudentLearningSessionLifecycleResult,
  StudentLearningSessionExitSummary,
} from '../contracts/studentLearningSessionContracts';
import { SAFE_RESPONSE_FLAGS } from '../contracts/studentLearningSessionContracts';

function now(): string {
  return new Date().toISOString();
}

export function buildSessionCreatedResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'created',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionResumedResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'resumed',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionPausedResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'paused',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionCompletedResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'completed',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionAbandonedResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'abandoned',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionExpiredResponse(result: StudentLearningSessionLifecycleResult): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'expired',
    data: { session: result.session } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionId: result.session.id,
    sessionStatus: result.session.status,
    sessionStage: result.session.stage,
    currentMode: result.session.currentMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionSnapshotResponse(snapshot: StudentLearningSessionSnapshot): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'snapshot',
    data: { snapshot } as unknown as Record<string, unknown>,
    safeReasonCodes: snapshot.safeReasonCodes,
    sessionId: snapshot.sessionId,
    sessionStatus: snapshot.sessionStatus,
    sessionStage: snapshot.sessionStage,
    currentMode: snapshot.currentMode,
    sourceTruthStatus: snapshot.sourceTruthStatus,
    confidenceBucket: snapshot.confidenceBucket,
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSessionTransitionResponse(result: StudentLearningSessionTransitionResult): StudentLearningSessionResponse {
  return {
    ok: result.allowed,
    status: result.allowed ? 'transition_allowed' : 'transition_blocked',
    data: { transition: result } as unknown as Record<string, unknown>,
    safeReasonCodes: result.safeReasonCodes,
    sessionStatus: result.sessionStatus,
    sessionStage: result.sessionStage,
    currentMode: result.toMode,
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildResumeContextResponse(context: StudentLearningSessionResumeContext): StudentLearningSessionResponse {
  return {
    ok: true,
    status: context.status === 'sufficient' ? 'resume_context_available' : 'resume_context_insufficient',
    data: { resumeContext: context } as unknown as Record<string, unknown>,
    safeReasonCodes: context.safeReasonCodes,
    currentMode: context.currentMode,
    sourceTruthStatus: context.sourceTruthStatus,
    confidenceBucket: context.confidenceBucket,
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildExitSummaryResponse(summary: StudentLearningSessionExitSummary): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'exit_summary',
    data: { exitSummary: summary } as unknown as Record<string, unknown>,
    safeReasonCodes: summary.safeReasonCodes,
    sessionStatus: summary.status,
    currentMode: 'none',
    sourceTruthStatus: summary.sourceTruthStatus,
    confidenceBucket: summary.confidenceBucket,
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSourceRequiredResponse(message?: string): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'source_required',
    safeReasonCodes: ['source_required'],
    sourceTruthStatus: 'source_required',
    generatedAt: now(),
    message: message || 'This session needs approved source context before content-specific continuation.',
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildDeenReferralResponse(): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'deen_referral',
    safeReasonCodes: ['deen_referral_required'],
    policyDecision: 'blocked_deen_referral',
    generatedAt: now(),
    message: 'This session needs an approved Islamic Studies source, teacher, or scholar before continuing this Deen-sensitive learning step.',
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildSafeguardingBoundaryResponse(): StudentLearningSessionResponse {
  return {
    ok: true,
    status: 'safeguarding_boundary',
    safeReasonCodes: ['safeguarding_boundary_applied'],
    policyDecision: 'blocked_safeguarding_boundary',
    generatedAt: now(),
    message: 'This session step requires safe adult support and cannot continue as a normal learning activity.',
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildForbiddenRawFieldErrorResponse(): StudentLearningSessionErrorResponse {
  return {
    ok: false,
    status: 'forbidden_raw_field',
    policyDecision: 'blocked_forbidden_raw_field',
    safeReasonCodes: ['forbidden_raw_field_detected'],
    message: 'Request contains forbidden raw private data fields.',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildProtectedAnswerErrorResponse(): StudentLearningSessionErrorResponse {
  return {
    ok: false,
    status: 'protected_answer_field',
    policyDecision: 'blocked_answer_key',
    safeReasonCodes: ['protected_answer_field_detected'],
    message: 'Request contains protected answer data.',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildHiddenReasoningErrorResponse(): StudentLearningSessionErrorResponse {
  return {
    ok: false,
    status: 'hidden_reasoning_field',
    policyDecision: 'blocked_hidden_reasoning',
    safeReasonCodes: ['hidden_reasoning_detected'],
    message: 'Request contains hidden reasoning data.',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildTeacherOnlyFieldErrorResponse(): StudentLearningSessionErrorResponse {
  return {
    ok: false,
    status: 'teacher_only_field',
    policyDecision: 'blocked_teacher_only',
    safeReasonCodes: ['teacher_only_field_detected'],
    message: 'Request contains teacher-only data.',
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}

export function buildGenericErrorResponse(message: string): StudentLearningSessionErrorResponse {
  return {
    ok: false,
    status: 'error',
    policyDecision: 'blocked_invalid_transition',
    safeReasonCodes: [],
    message,
    generatedAt: now(),
    ...SAFE_RESPONSE_FLAGS,
  };
}
