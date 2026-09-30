import OpenAI from 'openai';
import type { OpenAiReasoningEffort } from '../providerPreviewQualificationContracts';
import { OPENAI_PREVIEW_REASONING_EFFORT } from '../providerPreviewQualificationContracts';

// ── AI-INTELLIGENCE-05R: canonical OpenAI Responses transport ──
// SINGLE OpenAI network owner for the canonical AI-05 preview path.
// SDK-only Responses API invocation, zero automatic retries, real
// AbortSignal propagation. This module owns ONLY: SDK construction,
// Responses API invocation, signal propagation, transport result/error,
// provider request ID, and raw provider usage. It owns NO pedagogy,
// authorization, learner truth, evidence, mastery, source/Deen policy,
// academic integrity, safeguarding, or final learner approval.

/** Canonical transport input (§11). API key stays inside this boundary. */
export interface OpenAIResponsesTransportRequest {
  modelId: string;
  input: string;
  maxOutputTokens: number;
  timeoutMs: number;
  reasoningEffort: OpenAiReasoningEffort;
  abortSignal?: AbortSignal;
}

/** Canonical transport result (§11). Errors are thrown, never returned here. */
export interface OpenAIResponsesTransportResult {
  text: string;
  providerReportedModelId?: string;
  providerRequestId?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  providerStatus?: string;
}

/** Transport-level failure facts. The adapter owns canonical error mapping. */
export class OpenAIResponsesTransportError extends Error {
  readonly status?: number;
  readonly code?: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.name = 'OpenAIResponsesTransportError';
    this.status = opts?.status;
    this.code = opts?.code;
  }
}

/** The single approved production OpenAI API origin for this provider. */
export const OPENAI_ALLOWED_ORIGIN = 'https://api.openai.com';

/**
 * Reject every origin except the approved HTTPS OpenAI API origin.
 * Throws BEFORE any credential is touched or any byte is sent.
 */
function assertAllowedOpenAIOrigin(baseUrl: string | undefined): string {
  const normalized = (baseUrl || OPENAI_ALLOWED_ORIGIN).replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('openai_origin_rejected: unparseable base URL — production OpenAI traffic is limited to https://api.openai.com');
  }
  const isAllowed =
    parsed.protocol === 'https:' &&
    parsed.hostname === 'api.openai.com' &&
    (parsed.port === '' || parsed.port === '443') &&
    !parsed.username &&
    !parsed.password &&
    (parsed.pathname === '' || parsed.pathname === '/') &&
    !parsed.search &&
    !parsed.hash;
  if (!isAllowed) {
    throw new Error('openai_origin_rejected: production OpenAI traffic is limited to https://api.openai.com');
  }
  return OPENAI_ALLOWED_ORIGIN;
}

/**
 * Pure SDK body builder. Capped output (never above 640), store:false,
 * NO tools array. Exported so the focused suite can assert the exact
 * provider-visible shape without a live call.
 */
export function buildResponsesCreateParams(input: {
  modelId: string;
  inputText: string;
  maxOutputTokens: number;
  reasoningEffort: OpenAiReasoningEffort;
}): {
  model: string;
  input: string;
  max_output_tokens: number;
  store: false;
  reasoning: { effort: OpenAiReasoningEffort };
} {
  return {
    model: input.modelId,
    input: input.inputText,
    max_output_tokens: Math.min(input.maxOutputTokens, 640),
    store: false,
    reasoning: { effort: input.reasoningEffort },
  };
}

/** Minimal structural SDK surface — lets tests inject a fake client. */
export interface ResponsesSdkClient {
  responses: {
    create: (
      body: Record<string, unknown>,
      opts?: { signal?: AbortSignal | null },
    ) => Promise<{
      id?: string;
      model?: unknown;
      status?: unknown;
      output_text?: unknown;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      } | null;
    }>;
  };
}

/** Single-attempt SDK transport. Retries: 0 (SDK maxRetries: 0, no loop here). */
export class OpenAIResponsesTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly injectedClient: ResponsesSdkClient | null;

  constructor(input: { apiKey: string; baseUrl?: string; client?: ResponsesSdkClient }) {
    // Fence runs FIRST: reject disallowed origins before credentials are used.
    this.baseUrl = assertAllowedOpenAIOrigin(input.baseUrl);
    this.apiKey = input.apiKey;
    this.injectedClient = input.client ?? null;
  }

  private getClient(): ResponsesSdkClient {
    if (this.injectedClient) return this.injectedClient;
    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      maxRetries: 0,
    });
    return client as unknown as ResponsesSdkClient;
  }

  async execute(request: OpenAIResponsesTransportRequest): Promise<OpenAIResponsesTransportResult> {
    const client = this.getClient();
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    if (request.abortSignal) {
      if (request.abortSignal.aborted) controller.abort();
      else request.abortSignal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const body = buildResponsesCreateParams({
        modelId: request.modelId,
        inputText: request.input,
        maxOutputTokens: request.maxOutputTokens,
        reasoningEffort: request.reasoningEffort,
      });
      const response = await client.responses.create(body, { signal: controller.signal });
      const usage = response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined;
      return {
        text: typeof response.output_text === 'string' ? response.output_text.trim() : '',
        providerReportedModelId: typeof response.model === 'string' ? response.model : undefined,
        providerRequestId: typeof response.id === 'string' ? response.id : undefined,
        usage,
        providerStatus: typeof response.status === 'string' ? response.status : undefined,
      };
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'APIUserAbortError')) {
        if (request.abortSignal?.aborted) {
          throw new OpenAIResponsesTransportError('Request cancelled', { code: 'cancelled' });
        }
        throw new OpenAIResponsesTransportError(
          `Provider request timed out after ${request.timeoutMs}ms and the underlying request was aborted.`,
          { code: 'timeout' },
        );
      }
      const shaped = error as { status?: number; message?: string; error?: { message?: string } };
      const message = shaped?.error?.message ?? (error instanceof Error ? error.message : 'Unknown transport error');
      throw new OpenAIResponsesTransportError(String(message).slice(0, 500), { status: shaped?.status });
    } finally {
      clearTimeout(timer);
      request.abortSignal?.removeEventListener('abort', onAbort);
    }
  }
}

// ── Legacy MP-B surface: signatures preserved, SDK-backed ──
// These wrappers delegate to the single SDK execute() above. There is
// exactly ONE Responses API network implementation in this file.

export interface OpenAIResponseInput {
  model: string;
  prompt: string;
  maxOutputTokens: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface OpenAIResponseOutput {
  ok: boolean;
  text?: string;
  refusal?: boolean;
  incomplete?: boolean;
  statusCode?: number;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; complete: boolean };
  providerResponseId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface OpenAITransport {
  createResponse(input: OpenAIResponseInput): Promise<OpenAIResponseOutput>;
}

export function createFetchResponsesTransport(input: {
  apiKey: string;
  baseUrl?: string;
}): OpenAITransport {
  // Fence runs FIRST: reject disallowed origins before credentials are used.
  const inner = new OpenAIResponsesTransport({ apiKey: input.apiKey, baseUrl: input.baseUrl });
  return {
    async createResponse(request: OpenAIResponseInput): Promise<OpenAIResponseOutput> {
      try {
        const out = await inner.execute({
          modelId: request.model,
          input: request.prompt,
          maxOutputTokens: request.maxOutputTokens,
          timeoutMs: request.timeoutMs ?? 30000,
          reasoningEffort: OPENAI_PREVIEW_REASONING_EFFORT,
          abortSignal: request.signal,
        });
        if (!out.text) {
          return { ok: false, errorCode: 'malformed_response', errorMessage: 'Provider returned no text output' };
        }
        return {
          ok: true,
          text: out.text,
          usage: out.usage
            ? { ...out.usage, complete: true }
            : { complete: false },
          providerResponseId: out.providerRequestId,
        };
      } catch (error: unknown) {
        if (error instanceof OpenAIResponsesTransportError) {
          if (error.code === 'timeout') {
            return { ok: false, errorCode: 'timeout', errorMessage: error.message };
          }
          if (error.code === 'cancelled') {
            return { ok: false, errorCode: 'cancelled', errorMessage: error.message };
          }
          if (error.status === 429) {
            return { ok: false, statusCode: 429, errorCode: 'rate_limited', errorMessage: error.message };
          }
          if (error.status !== undefined && error.status >= 500) {
            return { ok: false, statusCode: error.status, errorCode: 'server_error', errorMessage: error.message };
          }
          return {
            ok: false,
            statusCode: error.status,
            errorCode: 'provider_error',
            errorMessage: error.message,
          };
        }
        const message = error instanceof Error ? error.message : 'Unknown transport error';
        return { ok: false, errorCode: 'provider_error', errorMessage: message.slice(0, 500) };
      }
    },
  };
}
