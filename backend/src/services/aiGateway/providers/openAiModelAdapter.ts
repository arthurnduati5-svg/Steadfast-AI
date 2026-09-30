import type {
  ModelProviderAdapter,
  ProviderGenerationRequest,
  ProviderGenerationResult,
  ProviderModelCapability,
  ProviderStatus,
} from '../modelProviderContracts';
import type { GenerationMode } from '../safeGenerationContracts';
import {
  OpenAIResponsesTransport,
  OpenAIResponsesTransportError,
} from './openAIResponsesTransport';
import type {
  OpenAIResponsesTransportRequest,
  OpenAIResponsesTransportResult,
} from './openAIResponsesTransport';
import {
  evaluatePreviewActivation,
  isQualificationReportPassing,
  OPENAI_PREVIEW_REASONING_EFFORT,
  type ProviderQualificationBundle,
  type ProviderQualificationReport,
} from '../providerPreviewQualificationContracts';

// ── AI-INTELLIGENCE-05R: canonical OpenAI provider adapter ──
// Sits BELOW the canonical aiProviderGateway seam. This adapter translates:
// prompt representation, output-token control, timeouts, usage fields,
// provider errors, and provider request IDs. It MAY NOT decide pedagogy,
// safety, school authorization, evidence, mastery, Deen policy, source
// truth, academic integrity, or learner state.
//
// Convergence law (05R):
// - The adapter performs ZERO direct OpenAI network calls. The ONLY OpenAI
//   execution owner is OpenAIResponsesTransport (Responses API), invoked
//   exactly once per provider attempt.
// - NO SDK-level retries (maxRetries: 0 inside the transport), NO transport
//   retries, NO adapter retries. The gateway performs no transport retry
//   loop either (single adapter.generate call) — retry owner is NONE.
// - Real cancellation: AbortSignal is wired into the transport request so
//   the underlying Responses API request aborts on timeout.
// - Usage truth: missing usage is reported as status 'unknown', never zero.
// - Malformed success law: transport success without usable text is
//   provider_malformed_response, never a fake success.
// - Privacy law: the adapter enforces a private-provider projection
//   checklist (no schoolId, no studentId, no email, no phone, no DB ids,
//   no API key in model-visible content) and fails closed with
//   'privacy_projection_blocked' before dispatch when violated.

export const OPENAI_PREVIEW_PROVIDER_ID = 'openai-preview';

export const OPENAI_ADAPTER_IDENTITY = 'openai-model-adapter-v3';

/** Canonical provider failure classes (AI-05 §24). */
export type CanonicalProviderErrorClass =
  | 'provider_auth_error'
  | 'provider_permission_error'
  | 'provider_rate_limited'
  | 'provider_timeout'
  | 'provider_cancelled'
  | 'provider_unavailable'
  | 'provider_invalid_request'
  | 'provider_protocol_error'
  | 'provider_malformed_response'
  | 'provider_usage_unknown'
  | 'provider_unknown_error';

/** Adapter-level fail-closed gate codes (checked BEFORE transport). */
export type AdapterGateErrorCode =
  | 'misconfigured'
  | 'privacy_projection_blocked'
  | 'preview_disabled'
  | 'school_not_authorized'
  | 'emergency_disabled'
  | 'qualification_required'
  | 'requalification_required'
  | 'capability_not_qualified'
  | 'runtime_bundle_unresolved';

/** Explicit execution mode (05R.1 §7). No permissive default. */
export type OpenAiAdapterExecutionMode = 'qualification' | 'runtime_preview';

/** Explicit runtime preview admission facts (05R.1 §16). */
export interface OpenAiPreviewAdmission {
  previewEnabled: boolean;
  previewSchoolId: string;
  emergencyDisabled: boolean;
  qualificationReport: ProviderQualificationReport | null;
  activeBundle: Omit<ProviderQualificationBundle, 'bundleHash' | 'qualifiedAt'> | null;
  capabilityScope: string;
}

/** Structural transport surface the adapter delegates to (fakeable in tests). */
export interface OpenAIResponsesTransportLike {
  execute(request: OpenAIResponsesTransportRequest): Promise<OpenAIResponsesTransportResult>;
}

export interface OpenAiModelAdapterConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  sdkVersion: string;
  /** REQUIRED execution mode: 'qualification' produces evidence, 'runtime_preview' consumes it. */
  executionMode: OpenAiAdapterExecutionMode;
  /** REQUIRED for runtime_preview; absent is allowed only in qualification mode. */
  previewAdmission?: OpenAiPreviewAdmission;
  /** Injected transport (tests). Defaults to the canonical SDK transport. */
  transport?: OpenAIResponsesTransportLike;
}

export interface OpenAiUsageReport {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  status: 'reported' | 'partial' | 'unknown';
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'APIUserAbortError')
  );
}

function normalizeErrorClass(status: number | undefined, error: unknown): CanonicalProviderErrorClass {
  if (isAbortError(error)) return 'provider_cancelled';
  if (status === 401) return 'provider_auth_error';
  if (status === 403) return 'provider_permission_error';
  if (status === 429) return 'provider_rate_limited';
  if (status !== undefined && status >= 500) return 'provider_unavailable';
  if (status !== undefined && status >= 400) return 'provider_invalid_request';
  return 'provider_unknown_error';
}

/** Reads only the values allowed for the private provider projection. */
function detectForbiddenProviderContent(prompt: string): string[] {
  const violations: string[] = [];
  const patterns: Array<[string, RegExp]> = [
    ['schoolId', /\bschoolId\b\s*[:=]/i],
    ['studentId', /\bstudentId\b\s*[:=]/i],
    ['email address', /[\w.+-]+@[\w-]+\.[\w.]+/],
    ['phone number', /\b\+?\d[\d\s().-]{7,}\d\b/],
    ['database id', /\b(cuid|uuid)\s*[:=]\s*["'][a-z0-9]{8,}["']/i],
    ['openai api key', /\bsk-[A-Za-z0-9_-]{8,}/],
  ];
  for (const [label, pattern] of patterns) {
    if (pattern.test(prompt)) violations.push(label);
  }
  return violations;
}

export function resolveOpenAiPreviewConfiguration(): {
  configured: boolean;
  reason?: string;
  apiKeyPresent: boolean;
  modelId?: string;
} {
  const apiKey = process.env.OPENAI_API_KEY;
  const modelId = process.env.STEADFAST_OPENAI_PREVIEW_MODEL_ID;
  if (!apiKey) {
    return { configured: false, reason: 'OPENAI_API_KEY is not set', apiKeyPresent: false };
  }
  if (!modelId) {
    return {
      configured: false,
      reason: 'STEADFAST_OPENAI_PREVIEW_MODEL_ID is not set',
      apiKeyPresent: true,
    };
  }
  return { configured: true, apiKeyPresent: true, modelId };
}

export class OpenAiModelAdapter implements ModelProviderAdapter {
  providerId = OPENAI_PREVIEW_PROVIDER_ID;
  providerType = 'cloud' as const;

  private config: OpenAiModelAdapterConfig;
  private injectedTransport: OpenAIResponsesTransportLike | null;

  constructor(config: OpenAiModelAdapterConfig) {
    this.config = config;
    this.injectedTransport = config.transport ?? null;
  }

  private getTransport(): OpenAIResponsesTransportLike {
    if (!this.injectedTransport) {
      this.injectedTransport = new OpenAIResponsesTransport({
        apiKey: this.config.apiKey as string,
        baseUrl: this.config.baseUrl,
      });
    }
    return this.injectedTransport;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.config.apiKey) return 'misconfigured';
    if (!this.config.modelId) return 'misconfigured';
    if (this.config.executionMode === 'qualification') return 'available';
    // runtime_preview: never claim available when structural admission cannot
    // possibly succeed. Missing runtime facts → misconfigured; disabled or
    // unqualified preview → unavailable (existing ProviderStatus values only).
    const admission = this.config.previewAdmission;
    if (!admission) return 'misconfigured';
    if (!admission.previewSchoolId) return 'misconfigured';
    if (!admission.activeBundle) return 'misconfigured';
    if (!admission.activeBundle.runtimeCommit) return 'misconfigured';
    if (!admission.activeBundle.promptBundleHash) return 'misconfigured';
    if (!admission.capabilityScope) return 'misconfigured';
    if (admission.emergencyDisabled) return 'unavailable';
    if (!admission.previewEnabled) return 'unavailable';
    if (!admission.qualificationReport) return 'unavailable';
    if (!isQualificationReportPassing(admission.qualificationReport)) return 'unavailable';
    return 'available';
  }

  async listModels(): Promise<ProviderModelCapability[]> {
    if (!this.config.modelId) return [];
    return [
      {
        modelId: this.config.modelId,
        providerId: this.providerId,
        supportsChat: true,
        supportsJson: true,
        supportsStreaming: true,
        recommendedUseCases: [
          'socratic_tutoring',
          'hint_only',
          'attempt_feedback',
          'concept_explanation',
          'practice_generation',
          'study_support',
        ] as GenerationMode[],
        restrictedUseCases: ['safe_deen_referral'] as GenerationMode[],
      },
    ];
  }

  async generate(input: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    const start = Date.now();

    const fail = (
      errorCode: CanonicalProviderErrorClass | AdapterGateErrorCode,
      errorMessage: string,
      extra?: Partial<ProviderGenerationResult>,
    ): ProviderGenerationResult => ({
      requestId: input.requestId,
      providerId: this.providerId,
      modelId: input.modelId,
      ok: false,
      errorCode,
      errorMessage,
      latencyMs: Date.now() - start,
      ...extra,
    });

    if (!this.config.apiKey) {
      return fail('provider_auth_error', 'OPENAI_API_KEY is not configured. Provider refusal is fail-closed. No mock success is possible.');
    }
    if (!input.modelId || input.modelId === 'default' || !this.config.modelId || input.modelId !== this.config.modelId) {
      return fail('provider_invalid_request', 'Requested model does not match the configured preview model. No silent model fallback is permitted.');
    }

    // 05R.1 §8/§9: execution-mode admission gates — fail closed BEFORE transport.
    if (this.config.executionMode === 'runtime_preview') {
      const admission = this.config.previewAdmission;
      if (!admission) {
        return fail('qualification_required', 'Runtime preview admission facts are not configured. No provider dispatch is permitted.');
      }
      if (admission.emergencyDisabled === true) {
        return fail('emergency_disabled', 'OpenAI preview emergency disable is active. No provider dispatch is permitted.');
      }
      if (admission.previewEnabled !== true) {
        return fail('preview_disabled', 'OpenAI preview is disabled. No provider dispatch is permitted.');
      }
      if (!admission.previewSchoolId) {
        return fail('school_not_authorized', 'Preview school is not configured. No provider dispatch is permitted.');
      }
      if (!input.schoolId || input.schoolId !== admission.previewSchoolId) {
        return fail('school_not_authorized', 'Authenticated school does not match the configured preview school. No provider dispatch is permitted.');
      }
      if (!admission.qualificationReport || !isQualificationReportPassing(admission.qualificationReport)) {
        return fail('qualification_required', 'No valid passed preview qualification report exists. No provider dispatch is permitted.');
      }
      const report = admission.qualificationReport;
      if (
        !admission.activeBundle ||
        !admission.activeBundle.runtimeCommit ||
        !admission.activeBundle.promptBundleHash
      ) {
        return fail('runtime_bundle_unresolved', 'Current runtime bundle identities are not configured. No provider dispatch is permitted.');
      }
      if (
        !admission.capabilityScope ||
        !report.qualifiedCapabilityScopes.includes(admission.capabilityScope) ||
        !report.bundle.capabilityScopes.includes(admission.capabilityScope)
      ) {
        return fail('capability_not_qualified', 'Configured capability scope is not qualified. No provider dispatch is permitted.');
      }
      // Canonical activation authority: exact-bundle + school + credential law.
      const gate = evaluatePreviewActivation(
        {
          previewEnabled: admission.previewEnabled,
          previewSchoolId: admission.previewSchoolId,
          previewModelId: this.config.modelId as string,
          emergencyDisabled: admission.emergencyDisabled,
          qualifiedBundle: report.bundle,
        },
        {
          authenticatedSchoolId: input.schoolId || '',
          activeBundle: admission.activeBundle,
          capabilityScope: admission.capabilityScope,
          apiKeyPresent: true,
        },
      );
      if (gate.allowed !== true) {
        if (gate.state === 'REQUALIFICATION_REQUIRED') {
          return fail('requalification_required', `Active bundle does not match the qualified bundle. ${gate.blocker ?? ''}`.trim());
        }
        if (gate.state === 'EMERGENCY_DISABLED') {
          return fail('emergency_disabled', gate.blocker ?? 'Emergency disable is active.');
        }
        if (gate.state === 'DISABLED') {
          return fail('preview_disabled', gate.blocker ?? 'Preview is disabled.');
        }
        if ((gate.blocker ?? '').includes('Capability scope')) {
          return fail('capability_not_qualified', gate.blocker as string);
        }
        if ((gate.blocker ?? '').toLowerCase().includes('school')) {
          return fail('school_not_authorized', gate.blocker as string);
        }
        return fail('qualification_required', gate.blocker ?? 'Preview activation is not eligible.');
      }
    }

    // Privacy projection enforcement — fail closed BEFORE dispatch.
    const forbidden = detectForbiddenProviderContent(input.prompt);
    if (forbidden.length > 0) {
      return fail(
        'privacy_projection_blocked',
        `Provider prompt failed privacy projection: forbidden content present (${forbidden.join(', ')}).`,
      );
    }

    // Bounded controls: output never exceeds 640, timeout never exceeds 7000ms.
    const maxOutputTokens = Math.min(input.maxOutputTokens ?? 640, 640);
    const timeoutMs = Math.min(input.timeoutMs ?? 7000, 7000);

    let timedOut = false;
    const controller = new AbortController();
    const abort = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      // EXACTLY ONE transport call per provider attempt. No retry here.
      const result = await this.getTransport().execute({
        modelId: input.modelId,
        input: input.prompt,
        maxOutputTokens,
        timeoutMs,
        reasoningEffort: OPENAI_PREVIEW_REASONING_EFFORT,
        abortSignal: controller.signal,
      });

      if (typeof result.text !== 'string' || result.text.trim().length === 0) {
        return fail('provider_malformed_response', 'OpenAI returned a success envelope without usable candidate text.');
      }

      const rawUsage = result.usage;
      const usage: OpenAiUsageReport =
        rawUsage && typeof rawUsage.inputTokens === 'number' && typeof rawUsage.outputTokens === 'number'
          ? {
              inputTokens: rawUsage.inputTokens,
              outputTokens: rawUsage.outputTokens,
              totalTokens: typeof rawUsage.totalTokens === 'number' ? rawUsage.totalTokens : undefined,
              status: 'reported',
            }
          : { status: 'unknown' };

      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: true,
        text: result.text,
        latencyMs: Date.now() - start,
        providerRequestId: result.providerRequestId,
        reportedModelId: result.providerReportedModelId,
        usage,
      };
    } catch (error: unknown) {
      if (error instanceof OpenAIResponsesTransportError) {
        if (error.code === 'timeout') {
          return fail('provider_timeout', `OpenAI request timed out after ${timeoutMs}ms and the underlying request was aborted.`);
        }
        if (error.code === 'cancelled') {
          return fail(
            timedOut ? 'provider_timeout' : 'provider_cancelled',
            timedOut
              ? `OpenAI request timed out after ${timeoutMs}ms and the underlying request was aborted.`
              : 'OpenAI request was cancelled before completion.',
          );
        }
        const errorClass = normalizeErrorClass(error.status, error);
        return fail(errorClass, `OpenAI request failed (${errorClass}). Provider message: ${error.message}`);
      }
      if (isAbortError(error)) {
        return fail(
          timedOut ? 'provider_timeout' : 'provider_cancelled',
          timedOut
            ? `OpenAI request timed out after ${timeoutMs}ms and the underlying request was aborted.`
            : 'OpenAI request was cancelled before completion.',
        );
      }
      const message = error instanceof Error ? error.message : 'Unknown provider error';
      return fail('provider_unknown_error', `OpenAI request failed (provider_unknown_error). Provider message: ${message}`);
    } finally {
      clearTimeout(abort);
    }
  }
}
