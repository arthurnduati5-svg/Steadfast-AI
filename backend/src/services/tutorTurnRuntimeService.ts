import { v4 as uuidv4 } from 'uuid';
import type {
  TutorTurnRequest,
  TutorTurnResolveRequest,
  TutorTurnDispatchRequest,
  TutorTurnStateRequest,
  TutorTurnEventRequest,
  TutorTurnContext,
  TutorTurnPolicyResult,
  TutorTurnDispatchDecision,
  TutorTurnModeDispatchResult,
  TutorTurnStatePatch,
  TutorTurnEvidenceBridgeResult,
  TutorTurnTelemetryEvent,
  TutorTurnSafeResponse,
  TutorTurnSafeErrorResponse,
  TutorTurnRuntimeResult,
  TutorTurnStatus,
  TutorTurnEventType,
} from '../contracts/tutorTurnRuntimeContracts';
import { buildTutorTurnContext } from './tutorTurnRuntimeContextBuilder';
import { evaluateTutorTurnPolicy } from './tutorTurnRuntimePolicyGate';
import { resolveTutorIntent } from './tutorTurnRuntimeIntentResolver';
import { routeModeDispatch } from './tutorTurnRuntimeModeRouter';
import { dispatchTutorTurn } from './tutorTurnRuntimeDispatcher';
import { produceTutorTurnStatePatch, produceEmptyStatePatch } from './tutorTurnRuntimeStatePatchService';
import { recordTurnEvidence } from './tutorTurnRuntimeEvidenceBridge';
import { recordTutorTurnEvent } from './tutorTurnRuntimeTelemetryService';
import {
  buildStudentView,
  buildBlockedResult,
  buildReferralResult,
  buildEmptyStateResult,
  buildErrorResult,
} from './tutorTurnRuntimeResponseBuilder';

export async function resolveTutorTurn(
  request: TutorTurnResolveRequest,
): Promise<TutorTurnRuntimeResult> {
  const context = buildTutorTurnContext({
    ...request,
    turnSource: request.turnSource || request.sourceSurface,
    execute: false,
    dryRun: true,
    inputFingerprint: undefined,
    inputSafetyFlags: undefined,
  });

  const policyResult = evaluateTutorTurnPolicy(context);
  if (!policyResult.allowed) {
    return {
      ok: false,
      status: 'blocked',
      policyDecision: policyResult.decision,
      safeReasonCodes: policyResult.reasonCodes,
      safeEvidenceRefs: context.safeEvidenceRefs,
      studentSafeMessage: policyResult.safeStudentMessage,
      suggestedNextIntent: policyResult.suggestedNextIntent,
    };
  }

  const decision = resolveTutorIntent(context);
  const routeCheck = routeModeDispatch(decision);

  return {
    ok: true,
    status: 'routed',
    dispatchTarget: decision.dispatchTarget,
    policyDecision: policyResult.decision,
    safeReasonCodes: [routeCheck.reasonCode, ...policyResult.reasonCodes],
    safeEvidenceRefs: context.safeEvidenceRefs,
    studentSafeMessage: undefined,
    suggestedNextIntent: policyResult.suggestedNextIntent,
  };
}

export async function dispatchTutorTurnAction(
  request: TutorTurnDispatchRequest,
): Promise<TutorTurnRuntimeResult> {
  const turnId = uuidv4();
  const context = buildTutorTurnContext({
    ...request,
    turnSource: request.turnSource || request.sourceSurface,
    inputFingerprint: undefined,
    inputSafetyFlags: undefined,
  });

  recordTutorTurnEvent(context, 'tutor_turn_received', 'received', turnId);

  const policyResult = evaluateTutorTurnPolicy(context);
  if (!policyResult.allowed) {
    recordTutorTurnEvent(context, 'tutor_turn_blocked', 'blocked', turnId, policyResult.reasonCodes);
    return {
      ok: false,
      turnId,
      status: 'blocked',
      policyDecision: policyResult.decision,
      safeReasonCodes: policyResult.reasonCodes,
      safeEvidenceRefs: context.safeEvidenceRefs,
      studentSafeMessage: policyResult.safeStudentMessage,
      suggestedNextIntent: policyResult.suggestedNextIntent,
    };
  }

  recordTutorTurnEvent(context, 'tutor_turn_validated', 'validated', turnId);

  const decision = resolveTutorIntent(context);
  const routeCheck = routeModeDispatch(decision);

  recordTutorTurnEvent(context, 'tutor_turn_routed', 'routed', turnId, [routeCheck.reasonCode]);

  const dispatchResult = await dispatchTutorTurn(context, decision);
  recordTutorTurnEvent(context, 'tutor_turn_dispatched', 'dispatched', turnId);

  const statePatch = produceTutorTurnStatePatch(context, decision, turnId);

  const evidenceResult = recordTurnEvidence(context, decision, 'dispatched');

  recordTutorTurnEvent(context, 'tutor_turn_completed', 'completed', turnId);

  return {
    ok: dispatchResult.dispatchStatus === 'dispatched',
    turnId,
    status: dispatchResult.dispatchStatus === 'dispatched' ? 'dispatched' : 'failed',
    dispatchTarget: decision.dispatchTarget,
    policyDecision: policyResult.decision,
    safeReasonCodes: [routeCheck.reasonCode, ...policyResult.reasonCodes],
    safeEvidenceRefs: evidenceResult.safeEvidenceRefs,
    statePatch,
    dispatchResult,
    evidenceResult,
    studentSafeMessage: policyResult.safeStudentMessage,
    suggestedNextIntent: policyResult.suggestedNextIntent,
  };
}

export async function handleTutorTurn(
  request: TutorTurnRequest,
): Promise<TutorTurnRuntimeResult> {
  const turnId = uuidv4();
  const context = buildTutorTurnContext(request);

  recordTutorTurnEvent(context, 'tutor_turn_received', 'received', turnId);

  const policyResult = evaluateTutorTurnPolicy(context);
  if (!policyResult.allowed) {
    recordTutorTurnEvent(context, 'tutor_turn_blocked', 'blocked', turnId, policyResult.reasonCodes);
    return {
      ok: false,
      turnId,
      status: 'blocked',
      policyDecision: policyResult.decision,
      safeReasonCodes: policyResult.reasonCodes,
      safeEvidenceRefs: context.safeEvidenceRefs,
      studentSafeMessage: policyResult.safeStudentMessage,
      suggestedNextIntent: policyResult.suggestedNextIntent,
    };
  }

  recordTutorTurnEvent(context, 'tutor_turn_validated', 'validated', turnId);

  const decision = resolveTutorIntent(context);
  const routeCheck = routeModeDispatch(decision);

  recordTutorTurnEvent(context, 'tutor_turn_routed', 'routed', turnId, [routeCheck.reasonCode]);

  let dispatchResult: TutorTurnModeDispatchResult | undefined;
  if (context.execute) {
    dispatchResult = await dispatchTutorTurn(context, decision);
    recordTutorTurnEvent(context, 'tutor_turn_dispatched', 'dispatched', turnId);
  }

  const statePatch = produceTutorTurnStatePatch(context, decision, turnId);

  const evidenceResult = recordTurnEvidence(context, decision, dispatchResult?.dispatchStatus === 'failed' ? 'failed' : 'dispatched');

  const finalStatus: TutorTurnStatus = context.execute
    ? (dispatchResult?.dispatchStatus === 'dispatched' ? 'dispatched' : 'failed')
    : 'routed';

  const eventType: TutorTurnEventType = finalStatus === 'failed' ? 'tutor_turn_failed' : 'tutor_turn_completed';
  recordTutorTurnEvent(context, eventType, finalStatus, turnId);

  return {
    ok: finalStatus !== 'failed',
    turnId,
    status: finalStatus,
    dispatchTarget: decision.dispatchTarget,
    policyDecision: policyResult.decision,
    safeReasonCodes: [routeCheck.reasonCode, ...policyResult.reasonCodes],
    safeEvidenceRefs: evidenceResult.safeEvidenceRefs,
    statePatch,
    dispatchResult,
    evidenceResult,
    studentSafeMessage: policyResult.safeStudentMessage,
    suggestedNextIntent: policyResult.suggestedNextIntent,
  };
}

export function getTutorTurnState(
  _request: TutorTurnStateRequest,
): TutorTurnSafeResponse {
  return buildEmptyStateResult();
}

export function recordTurnEvent(
  request: TutorTurnEventRequest,
): TutorTurnTelemetryEvent {
  const context = buildTutorTurnContext({
    schoolId: request.schoolId,
    studentId: request.studentId,
    turnKind: 'state_sync_turn',
    turnIntent: 'state_sync_turn' as any,
    execute: false,
    dryRun: true,
    safeEvidenceRefs: request.safeEvidenceRefs,
    safeReasonCodes: request.safeReasonCodes,
  });

  return recordTutorTurnEvent(
    context,
    request.eventType,
    request.eventStatus as TutorTurnStatus,
    request.turnId,
    request.safeReasonCodes as any,
  );
}
