import type {
  GrowthActionPlan,
  GrowthWhyThisNextDecision,
  GrowthActionRouteEvent,
  GrowthActionExecutionResult,
  GrowthActionStateResponse,
} from '../contracts/growthActionContracts';
import { assertSafeGrowthActionOutput } from './growthActionPrivacyGuard';

export interface ResponseBuildInput {
  actionPlan?: GrowthActionPlan;
  whyThisNextDecision?: GrowthWhyThisNextDecision;
  routeEvent?: GrowthActionRouteEvent;
  executionResult?: GrowthActionExecutionResult;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export function buildStudentView(input: ResponseBuildInput): GrowthActionStateResponse {
  return buildSafeResponse(input, 'student');
}

export function buildTeacherView(input: ResponseBuildInput): GrowthActionStateResponse {
  const response = buildSafeResponse(input, 'teacher');
  if (response.whyThisNextDecision && input.whyThisNextDecision?.teacherSafeReason) {
    response.whyThisNextDecision = {
      ...response.whyThisNextDecision,
      teacherSafeReason: input.whyThisNextDecision.teacherSafeReason,
    };
  }
  return response;
}

export function buildAdminDiagnosticsView(input: ResponseBuildInput): GrowthActionStateResponse {
  return buildSafeResponse(input, 'admin');
}

export function buildExecutionResultView(input: ResponseBuildInput): GrowthActionStateResponse {
  return {
    ok: input.executionResult?.success ?? false,
    executionResult: input.executionResult,
    actionPlan: input.actionPlan,
    safeEvidenceRefs: input.safeEvidenceRefs,
    safeReasonCodes: input.safeReasonCodes,
  };
}

export function buildWhyThisNextView(input: ResponseBuildInput): GrowthActionStateResponse {
  return {
    ok: true,
    whyThisNextDecision: input.whyThisNextDecision,
    safeEvidenceRefs: input.safeEvidenceRefs,
    safeReasonCodes: input.safeReasonCodes,
  };
}

export function buildEmptyStateView(): GrowthActionStateResponse {
  return {
    ok: true,
    safeEvidenceRefs: [],
    safeReasonCodes: ['insufficient_evidence'],
    actionPlan: undefined,
  };
}

export function buildErrorView(
  code: string,
  message: string,
  safeReasonCodes: string[] = [],
  safeEvidenceRefs: string[] = [],
): GrowthActionStateResponse {
  return {
    ok: false,
    safeEvidenceRefs,
    safeReasonCodes,
  };
}

function buildSafeResponse(input: ResponseBuildInput, _viewerRole: string): GrowthActionStateResponse {
  const redactedPlan = input.actionPlan
    ? assertSafeGrowthActionOutput(input.actionPlan) as unknown as GrowthActionPlan
    : undefined;
  const redactedDecision = input.whyThisNextDecision
    ? assertSafeGrowthActionOutput(input.whyThisNextDecision) as unknown as GrowthWhyThisNextDecision
    : undefined;
  const redactedEvent = input.routeEvent
    ? assertSafeGrowthActionOutput(input.routeEvent) as unknown as GrowthActionRouteEvent
    : undefined;
  const redactedResult = input.executionResult
    ? assertSafeGrowthActionOutput(input.executionResult) as unknown as GrowthActionExecutionResult
    : undefined;

  return {
    ok: true,
    actionPlan: redactedPlan,
    whyThisNextDecision: redactedDecision,
    routeEvent: redactedEvent,
    executionResult: redactedResult,
    safeEvidenceRefs: input.safeEvidenceRefs,
    safeReasonCodes: input.safeReasonCodes,
  };
}
