import type {
  NoAiBypassRouteRegistration,
  NoAiBypassRuntimeDecision,
  NoAiBypassPolicyDecision,
  NoAiBypassProviderBoundaryStatus,
  NoAiBypassReasonCode,
  NoAiBypassRuntimeStage,
} from '../contracts/noAiBypassContracts';
import { getRouteRegistrationByPath } from './noAiBypassRouteRegistry';

interface RuntimeContext {
  path: string;
  method: string;
  schoolId?: string;
  learnerId?: string;
  sessionId?: string;
  hasSchoolAuth: boolean;
  hasVerifiedSchoolContext: boolean;
  isCrossSchool: boolean;
  isCrossLearner: boolean;
  hasDirectProviderImport: boolean;
  hasDirectProviderCall: boolean;
  hasRawProviderResponse: boolean;
  hasHiddenReasoning: boolean;
  hasAnswerKey: boolean;
  hasMarkingScheme: boolean;
  hasCorrectAnswer: boolean;
  hasModelAnswer: boolean;
  hasTeacherOnlyData: boolean;
  hasRawPrivateContent: boolean;
  requiresSourceTruth: boolean;
  sourceTruthAvailable: boolean;
  requiresDeenBoundary: boolean;
  deenBoundaryPassed: boolean;
  requiresSafeguardingBoundary: boolean;
  safeguardingBoundaryPassed: boolean;
}

function buildBlockedDecision(
  policyDecision: NoAiBypassPolicyDecision,
  reasonCode: NoAiBypassReasonCode,
  blockReason: string,
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus,
): NoAiBypassRuntimeDecision {
  return {
    allowed: false,
    policyDecision,
    providerBoundaryStatus,
    safeReasonCodes: [reasonCode],
    blockReason,
    runtimeStage: 'blocked',
  };
}

function buildAllowedDecision(
  reasonCodes: NoAiBypassReasonCode[],
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus,
): NoAiBypassRuntimeDecision {
  return {
    allowed: true,
    policyDecision: 'allowed_runtime_dispatch',
    providerBoundaryStatus,
    safeReasonCodes: [...reasonCodes, 'approved_runtime_path', 'audit_recorded'],
    runtimeStage: 'audit_recorded',
  };
}

function evaluateRouteGuardRequirements(
  registration: NoAiBypassRouteRegistration,
  ctx: RuntimeContext,
): NoAiBypassRuntimeDecision | null {
  if (registration.requiresSchoolAuth && !ctx.hasSchoolAuth) {
    return buildBlockedDecision('blocked_missing_school_auth', 'school_auth_required', 'School authentication is required', registration.providerBoundaryStatus);
  }
  if (registration.requiresVerifiedSchoolContext && !ctx.hasVerifiedSchoolContext) {
    return buildBlockedDecision('blocked_missing_verified_school_context', 'verified_school_context_required', 'Verified school context is required', registration.providerBoundaryStatus);
  }
  if (ctx.isCrossSchool) {
    return buildBlockedDecision('blocked_cross_school', 'school_auth_required', 'Cross-school access is blocked', registration.providerBoundaryStatus);
  }
  if (ctx.isCrossLearner) {
    return buildBlockedDecision('blocked_cross_learner', 'learner_scope_required', 'Cross-learner access is blocked', registration.providerBoundaryStatus);
  }
  return null;
}

function evaluateProviderBoundary(
  registration: NoAiBypassRouteRegistration,
  ctx: RuntimeContext,
): NoAiBypassRuntimeDecision | null {
  if (ctx.hasDirectProviderImport) {
    return buildBlockedDecision('blocked_unapproved_route_provider_import', 'route_provider_import_detected', 'Route has direct provider import', 'direct_provider_import_detected');
  }
  if (ctx.hasDirectProviderCall) {
    return buildBlockedDecision('blocked_direct_ai_provider_call', 'route_direct_provider_call_detected', 'Route has direct provider call', 'direct_provider_call_detected');
  }
  if (ctx.hasRawProviderResponse) {
    return buildBlockedDecision('blocked_raw_provider_response', 'raw_provider_response_detected', 'Route returns raw provider response', 'raw_provider_response_detected');
  }
  if (ctx.hasHiddenReasoning) {
    return buildBlockedDecision('blocked_hidden_reasoning', 'hidden_reasoning_detected', 'Route exposes hidden reasoning', registration.providerBoundaryStatus);
  }
  if (ctx.hasAnswerKey) {
    return buildBlockedDecision('blocked_answer_key', 'answer_key_detected', 'Route exposes answer keys', registration.providerBoundaryStatus);
  }
  if (ctx.hasMarkingScheme) {
    return buildBlockedDecision('blocked_marking_scheme', 'marking_scheme_detected', 'Route exposes marking schemes', registration.providerBoundaryStatus);
  }
  if (ctx.hasModelAnswer) {
    return buildBlockedDecision('blocked_model_answer', 'model_answer_detected', 'Route exposes model answers', registration.providerBoundaryStatus);
  }
  if (ctx.hasCorrectAnswer) {
    return buildBlockedDecision('blocked_correct_answer', 'correct_answer_detected', 'Route exposes correct answers', registration.providerBoundaryStatus);
  }
  if (ctx.hasTeacherOnlyData) {
    return buildBlockedDecision('blocked_teacher_only_data', 'teacher_only_data_detected', 'Route exposes teacher-only data', registration.providerBoundaryStatus);
  }
  if (ctx.hasRawPrivateContent) {
    return buildBlockedDecision('blocked_raw_private_content', 'raw_private_content_detected', 'Route contains raw private content', registration.providerBoundaryStatus);
  }
  return null;
}

function evaluateSafeRuntimeDispatch(
  registration: NoAiBypassRouteRegistration,
  ctx: RuntimeContext,
): NoAiBypassRuntimeDecision | null {
  if (registration.requiresSourceTruth && !ctx.sourceTruthAvailable) {
    return buildBlockedDecision('blocked_source_required', 'source_truth_required', 'Source truth is required but not available', registration.providerBoundaryStatus);
  }
  if (registration.requiresDeenBoundary && !ctx.deenBoundaryPassed) {
    return buildBlockedDecision('blocked_deen_referral', 'deen_boundary_required', 'Deen boundary check required', registration.providerBoundaryStatus);
  }
  if (registration.requiresSafeguardingBoundary && !ctx.safeguardingBoundaryPassed) {
    return buildBlockedDecision('blocked_safeguarding_boundary', 'safeguarding_boundary_required', 'Safeguarding boundary check required', registration.providerBoundaryStatus);
  }
  if (registration.providerBoundaryStatus === 'provider_blocked') {
    return buildBlockedDecision('blocked_unregistered_runtime', 'provider_gateway_required', 'Provider calls are blocked for this route', 'provider_blocked');
  }
  return null;
}

function evaluateRuntimeDecision(
  registration: NoAiBypassRouteRegistration | undefined,
  ctx: RuntimeContext,
): NoAiBypassRuntimeDecision {
  if (!registration) {
    return buildBlockedDecision('blocked_unknown_route', 'school_auth_required', 'Unknown route - no registration found', 'unknown');
  }

  const guardResult = evaluateRouteGuardRequirements(registration, ctx);
  if (guardResult) return guardResult;

  const providerResult = evaluateProviderBoundary(registration, ctx);
  if (providerResult) return providerResult;

  const dispatchResult = evaluateSafeRuntimeDispatch(registration, ctx);
  if (dispatchResult) return dispatchResult;

  const reasonCodes: NoAiBypassReasonCode[] = [];
  if (registration.requiresSchoolAuth) reasonCodes.push('school_auth_required');
  if (registration.requiresVerifiedSchoolContext) reasonCodes.push('verified_school_context_required');
  if (registration.requiresPrivacyGuard) reasonCodes.push('privacy_guard_required');
  if (registration.requiresAnswerProtection) reasonCodes.push('answer_protection_required');
  if (registration.providerBoundaryStatus === 'provider_gateway_only') reasonCodes.push('provider_gateway_required');

  return buildAllowedDecision(reasonCodes, registration.providerBoundaryStatus);
}

export { evaluateRuntimeDecision as evaluateNoAiBypassRuntimeDecision };

export function assertNoAiBypassAllowed(decision: NoAiBypassRuntimeDecision): void {
  if (!decision.allowed) {
    throw new Error(`No-AI-bypass blocked: ${decision.blockReason || decision.policyDecision}`);
  }
}
