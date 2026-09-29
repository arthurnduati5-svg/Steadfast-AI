import OpenAI from 'openai';
import type {
  ModelProviderAdapter,
  ProviderGenerationRequest,
  ProviderGenerationResult,
  ProviderModelCapability,
  ProviderStatus,
} from '../modelProviderContracts';
import type { GenerationMode } from '../safeGenerationContracts';

// ── AI-INTELLIGENCE-05: canonical OpenAI provider adapter ──
// Sits BELOW the canonical aiProviderGateway seam. This adapter translates:
// prompt representation, output-token control, timeouts, usage fields,
// provider errors, and provider request IDs. It MAY NOT decide pedagogy,
// safety, school authorization, evidence, mastery, Deen policy, source
// truth, academic integrity, or learner state.
//
// Transport law:
// - NO SDK-level retries (the gateway owns retry; single retry owner).
// - Real cancellation: AbortSignal is wired into the SDK request so the
//   underlying provider request aborts on timeout. No uncancellable races.
// - Usage truth: missing usage is reported as status 'unknown', never zero.
// - Malformed success law: HTTP 200 without usable text is
//   provider_malformed_response, never a fake success.
// - Privacy law: the adapter enforces a private-provider projection
//   checklist (no schoolId, no studentId, no email, no phone, no DB ids
//   in model-visible content) and fails closed with
//   'privacy_projection_blocked' before dispatch when violated.

export const OPENAI_ADAPTER_IDENTITY = 'openai-model-adapter-v1';

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

export interface OpenAiModelAdapterConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  sdkVersion: string;
}

export interface OpenAiUsageReport {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  status: 'reported' | 'partial' | 'unknown';
}

interface OpenAiErrorShape {
  status?: number;
  message?: string;
  code?: string;
  error?: { message?: string; code?: string };
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
  providerId = 'openai-provider';
  providerType = 'cloud' as const;

  private config: OpenAiModelAdapterConfig;
  private client: OpenAI | null = null;

  constructor(config: OpenAiModelAdapterConfig) {
    this.config = config;
  }

  private getClient(): OpenAI | null {
    if (!this.config.apiKey) return null;
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
        maxRetries: 0,
        timeout: undefined,
      });
    }
    return this.client;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.config.apiKey) return 'misconfigured';
    if (!this.config.modelId) return 'misconfigured';
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
      errorCode: CanonicalProviderErrorClass | 'misconfigured' | 'privacy_projection_blocked',
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

    // Privacy projection enforcement — fail closed BEFORE dispatch.
    const forbidden = detectForbiddenProviderContent(input.prompt);
    if (forbidden.length > 0) {
      return fail(
        'privacy_projection_blocked',
        `Provider prompt failed privacy projection: forbidden content present (${forbidden.join(', ')}).`,
      );
    }

    const client = this.getClient();
    if (!client) {
      return fail('provider_auth_error', 'OpenAI client unavailable: missing API key.');
    }

    const timeoutMs = input.timeoutMs ?? 7000;
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await client.chat.completions.create(
        {
          model: input.modelId,
          messages: [{ role: 'user', content: input.prompt }],
          max_completion_tokens: input.maxOutputTokens ?? 640,
          tools: undefined,
          tool_choice: 'none',
          stream: false,
        },
        { signal: controller.signal },
      );

      const text = completion.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || text.trim().length === 0) {
        return fail('provider_malformed_response', 'OpenAI returned a success envelope without usable candidate text.');
      }

      const rawUsage = completion.usage;
      const usage: OpenAiUsageReport =
        rawUsage && typeof rawUsage.prompt_tokens === 'number' && typeof rawUsage.completion_tokens === 'number'
          ? {
              inputTokens: rawUsage.prompt_tokens,
              outputTokens: rawUsage.completion_tokens,
              totalTokens: typeof rawUsage.total_tokens === 'number' ? rawUsage.total_tokens : undefined,
              status: 'reported',
            }
          : { status: 'unknown' };

      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: true,
        text,
        latencyMs: Date.now() - start,
        providerRequestId: completion.id,
        reportedModelId: typeof completion.model === 'string' ? completion.model : undefined,
        usage,
      };
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return fail('provider_timeout', `OpenAI request timed out after ${timeoutMs}ms and the underlying request was aborted.`);
      }
      const errShape = error as OpenAiErrorShape;
      const status = errShape?.status;
      const errorClass = normalizeErrorClass(status, error);
      const providerMessage = errShape?.error?.message ?? errShape?.message ?? 'Unknown provider error';
      return fail(errorClass, `OpenAI request failed (${errorClass}). Provider message: ${providerMessage}`);
    } finally {
      clearTimeout(abort);
    }
  }
}
