import type {
  TutorTurnContext,
  TutorTurnPolicyResult,
  TutorTurnDispatchDecision,
  TutorTurnModeDispatchResult,
  TutorTurnStatePatch,
  TutorTurnEvidenceBridgeResult,
  TutorTurnTelemetryEvent,
  TutorTurnSafeResponse,
  TutorTurnSafeErrorResponse,
  TutorTurnStatus,
  TutorTurnDispatchTarget,
  TutorTurnIntent,
  TutorTurnSafeReasonCode,
} from '../contracts/tutorTurnRuntimeContracts';
import { redactForbiddenTutorTurnFields } from './tutorTurnRuntimePrivacyGuard';

export interface BuildStudentViewInput {
  ok: boolean;
  status: TutorTurnStatus;
  dispatchTarget?: TutorTurnDispatchTarget;
  policyDecision?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  studentSafeMessage?: string;
  suggestedNextIntent?: TutorTurnIntent;
  statePatch?: TutorTurnStatePatch;
  dispatchResult?: TutorTurnModeDispatchResult;
}

export function buildStudentView(input: BuildStudentViewInput): TutorTurnSafeResponse {
  const response: TutorTurnSafeResponse = {
    ok: input.ok,
    status: input.status,
    dispatchTarget: input.dispatchTarget,
    safeReasonCodes: input.safeReasonCodes,
    safeEvidenceRefs: input.safeEvidenceRefs,
    studentSafeMessage: input.studentSafeMessage,
    suggestedNextIntent: input.suggestedNextIntent,
  };

  if (input.policyDecision) response.policyDecision = input.policyDecision as any;
  if (input.statePatch) response.statePatch = input.statePatch;
  if (input.dispatchResult) response.dispatchResult = input.dispatchResult;

  return redactForbiddenTutorTurnFields(response) as TutorTurnSafeResponse;
}

export function buildTeacherView(input: BuildStudentViewInput): TutorTurnSafeResponse {
  return buildStudentView(input);
}

export function buildAdminDiagnosticsView(input: BuildStudentViewInput): TutorTurnSafeResponse {
  return buildStudentView(input);
}

export function buildBlockedResult(
  reasonCodes: string[],
  safeMessage: string,
  suggestedNextIntent?: TutorTurnIntent,
): TutorTurnSafeResponse {
  return {
    ok: false,
    status: 'blocked',
    safeReasonCodes: reasonCodes,
    safeEvidenceRefs: [],
    studentSafeMessage: safeMessage,
    suggestedNextIntent,
  };
}

export function buildReferralResult(
  reasonCodes: string[],
  safeMessage: string,
  suggestedNextIntent?: TutorTurnIntent,
): TutorTurnSafeResponse {
  return {
    ok: true,
    status: 'completed',
    dispatchTarget: 'content_gap_referral',
    safeReasonCodes: reasonCodes,
    safeEvidenceRefs: [],
    studentSafeMessage: safeMessage,
    suggestedNextIntent,
  };
}

export function buildDispatchResult(
  turnId: string,
  dispatchTarget: TutorTurnDispatchTarget,
  modeSessionId?: string,
): TutorTurnSafeResponse {
  return {
    ok: true,
    turnId,
    status: 'dispatched',
    dispatchTarget,
    safeReasonCodes: ['dispatch_completed'],
    safeEvidenceRefs: [],
  };
}

export function buildEmptyStateResult(): TutorTurnSafeResponse {
  return {
    ok: true,
    status: 'completed',
    dispatchTarget: 'none',
    safeReasonCodes: ['no_active_session'],
    safeEvidenceRefs: [],
    studentSafeMessage: 'I do not have an active learning mode yet. I can help choose the next safe step.',
    suggestedNextIntent: 'resolve_growth_action',
  };
}

export function buildErrorResult(
  code: string,
  message: string,
): TutorTurnSafeErrorResponse {
  return {
    ok: false,
    status: 'failed',
    safeReasonCodes: [code],
    safeEvidenceRefs: [],
    studentSafeMessage: message,
  };
}
