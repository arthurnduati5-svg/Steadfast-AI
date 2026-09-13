import type {
  NoAiBypassPolicyDecision,
  NoAiBypassProviderBoundaryStatus,
  NoAiBypassReasonCode,
  NoAiBypassSafeResponse,
  NoAiBypassErrorResponse,
  NoAiBypassSafeResponseFlags,
} from '../contracts/noAiBypassContracts';
import { SAFE_RESPONSE_FLAGS_DISABLED } from '../contracts/noAiBypassContracts';

function buildSafeResponseFlags(): NoAiBypassSafeResponseFlags {
  return { ...SAFE_RESPONSE_FLAGS_DISABLED };
}

function buildAllowedResponse(params: {
  policyDecision?: NoAiBypassPolicyDecision;
  providerBoundaryStatus?: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes?: NoAiBypassReasonCode[];
  data?: Record<string, unknown>;
}): NoAiBypassSafeResponse {
  return {
    ok: true,
    status: 'allowed',
    policyDecision: params.policyDecision || 'allowed_runtime_dispatch',
    providerBoundaryStatus: params.providerBoundaryStatus || 'no_provider_needed',
    safeReasonCodes: params.safeReasonCodes || ['approved_runtime_path'],
    generatedAt: new Date().toISOString(),
    safeResponseFlags: buildSafeResponseFlags(),
    data: params.data,
  };
}

function buildBlockedResponse(params: {
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus?: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes?: NoAiBypassReasonCode[];
  error: string;
}): NoAiBypassSafeResponse {
  return {
    ok: true,
    status: 'blocked',
    policyDecision: params.policyDecision,
    providerBoundaryStatus: params.providerBoundaryStatus || 'provider_blocked',
    safeReasonCodes: params.safeReasonCodes || [],
    generatedAt: new Date().toISOString(),
    safeResponseFlags: buildSafeResponseFlags(),
    error: params.error,
  };
}

function buildAuditResponse(params: {
  events: unknown[];
  summary?: unknown;
}): NoAiBypassSafeResponse {
  return {
    ok: true,
    status: 'ok',
    policyDecision: 'allowed_runtime_dispatch',
    providerBoundaryStatus: 'no_provider_needed',
    safeReasonCodes: ['audit_recorded'],
    generatedAt: new Date().toISOString(),
    safeResponseFlags: buildSafeResponseFlags(),
    data: {
      events: params.events,
      ...(params.summary ? { summary: params.summary } : {}),
    },
  };
}

function buildScanResponse(params: {
  results: unknown[];
}): NoAiBypassSafeResponse {
  return {
    ok: true,
    status: 'ok',
    policyDecision: 'allowed_runtime_dispatch',
    providerBoundaryStatus: 'no_provider_needed',
    safeReasonCodes: ['audit_recorded'],
    generatedAt: new Date().toISOString(),
    safeResponseFlags: buildSafeResponseFlags(),
    data: { results: params.results },
  };
}

function buildErrorResponse(params: {
  policyDecision?: NoAiBypassPolicyDecision;
  providerBoundaryStatus?: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes?: NoAiBypassReasonCode[];
  error: string;
}): NoAiBypassErrorResponse {
  return {
    ok: false,
    status: 'error',
    policyDecision: params.policyDecision || 'blocked_unknown_route',
    providerBoundaryStatus: params.providerBoundaryStatus || 'unknown',
    safeReasonCodes: params.safeReasonCodes || [],
    error: params.error,
    generatedAt: new Date().toISOString(),
    safeResponseFlags: buildSafeResponseFlags(),
  };
}

function assertResponseSafe(response: NoAiBypassSafeResponse | NoAiBypassErrorResponse): void {
  const flags = response.safeResponseFlags;
  if (flags.rawPrivateDataIncluded !== false) throw new Error('rawPrivateDataIncluded must be false');
  if (flags.hiddenReasoningIncluded !== false) throw new Error('hiddenReasoningIncluded must be false');
  if (flags.teacherOnlyDataIncluded !== false) throw new Error('teacherOnlyDataIncluded must be false');
  if (flags.answerKeyIncluded !== false) throw new Error('answerKeyIncluded must be false');
  if (flags.modelAnswerIncluded !== false) throw new Error('modelAnswerIncluded must be false');
  if (flags.markingSchemeIncluded !== false) throw new Error('markingSchemeIncluded must be false');
  if (flags.correctAnswerIncluded !== false) throw new Error('correctAnswerIncluded must be false');
  if (flags.safeguardingRawDetailIncluded !== false) throw new Error('safeguardingRawDetailIncluded must be false');
  if (flags.deenSensitivePrivateTextIncluded !== false) throw new Error('deenSensitivePrivateTextIncluded must be false');
  if (flags.rawTranscriptIncluded !== false) throw new Error('rawTranscriptIncluded must be false');
  if (flags.providerPromptIncluded !== false) throw new Error('providerPromptIncluded must be false');
  if (flags.providerResponseIncluded !== false) throw new Error('providerResponseIncluded must be false');
  if (flags.liveAiCallIncluded !== false) throw new Error('liveAiCallIncluded must be false');
  if (flags.liveSchoolConnectorIncluded !== false) throw new Error('liveSchoolConnectorIncluded must be false');
}

export {
  buildAllowedResponse as buildNoAiBypassAllowedResponse,
  buildBlockedResponse as buildNoAiBypassBlockedResponse,
  buildAuditResponse as buildNoAiBypassAuditResponse,
  buildScanResponse as buildNoAiBypassScanResponse,
  buildErrorResponse as buildNoAiBypassErrorResponse,
  assertResponseSafe as assertNoAiBypassResponseSafe,
};
