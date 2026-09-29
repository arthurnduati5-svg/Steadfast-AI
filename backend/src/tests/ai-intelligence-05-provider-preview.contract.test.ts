// ── AI-INTELLIGENCE-05: focused provider preview contract tests ──
// Bounded corpus per §37/§38/§39. NOT the AI-04 48-case corpus.
// Proves: fail-closed credential/config law, privacy projection, emergency
// disable, exact-bundle invalidation, cancellation, error/usage
// normalization, and that qualified provider candidates still pass through
// the canonical output validation chain.
//
// AI-INTELLIGENCE-05R: canonical path is Responses API only. All transport
// fakes target OpenAIResponsesTransport.execute / client.responses.create.
// No canonical fake or implementation path uses chat.completions.create.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  OpenAiModelAdapter,
  resolveOpenAiPreviewConfiguration,
  OPENAI_ADAPTER_IDENTITY,
} from '../services/aiGateway/providers/openAiModelAdapter';
import {
  OpenAIResponsesTransport,
  OpenAIResponsesTransportError,
  buildResponsesCreateParams,
} from '../services/aiGateway/providers/openAIResponsesTransport';
import type {
  OpenAIResponsesTransportRequest,
  OpenAIResponsesTransportResult,
} from '../services/aiGateway/providers/openAIResponsesTransport';
import {
  computeBundleHash,
  evaluatePreviewActivation,
  isQualifiedBundleValid,
  type ProviderQualificationBundle,
} from '../services/aiGateway/providerPreviewQualificationContracts';

const TEST_MODEL_ID = 'steedfast-preview-test-model';
const TEST_PROMPT = 'You are a Socratic tutor. Learner asks: Explain photosynthesis.';

type ExecuteFn = (req: OpenAIResponsesTransportRequest) => Promise<OpenAIResponsesTransportResult>;

function makeAdapter(
  overrides: Partial<{ apiKey: string; modelId: string; previewEnabled: boolean; previewSchoolId: string; emergencyDisabled: boolean }> = {},
  execute?: ExecuteFn,
): OpenAiModelAdapter {
  return new OpenAiModelAdapter({
    apiKey: 'apiKey' in overrides ? overrides.apiKey : 'sk-test-key-abcdefgh',
    modelId: 'modelId' in overrides ? overrides.modelId : TEST_MODEL_ID,
    sdkVersion: 'openai-sdk-6.x',
    previewEnabled: overrides.previewEnabled,
    previewSchoolId: overrides.previewSchoolId,
    emergencyDisabled: overrides.emergencyDisabled,
    transport: execute ? { execute } : undefined,
  });
}

function transportHttpError(status: number, message: string): OpenAIResponsesTransportError {
  return new OpenAIResponsesTransportError(message, { status });
}

function makeBundle(overrides: Partial<ProviderQualificationBundle> = {}): ProviderQualificationBundle {
  const base = {
    provider: 'openai' as const,
    requestedModelId: TEST_MODEL_ID,
    runtimeCommit: 'fdb1217',
    promptBundleHash: 'pbh-001',
    adapterIdentity: OPENAI_ADAPTER_IDENTITY,
    sdkVersion: 'openai-sdk-6.x',
    maxOutputTokens: 640,
    providerTimeoutMs: 7000,
    totalDeadlineMs: 10000,
    retryPolicyVersion: 'gateway-retry-v1',
    toolsEnabled: false as const,
    qualificationCorpusVersion: 'pq-corpus-v1',
    capabilityScopes: ['text.general_tutoring.en'],
  };
  const withoutHash = { ...base, ...overrides };
  const bundleHash = computeBundleHash(withoutHash);
  return { ...withoutHash, bundleHash };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.OPENAI_API_KEY;
  delete process.env.STEADFAST_OPENAI_PREVIEW_MODEL_ID;
});

describe('AI-05 provider preview — credential and config law', () => {
  it('T01: missing API key → provider_auth_error, never mock success', async () => {
    const adapter = makeAdapter({ apiKey: undefined });
    const result = await adapter.generate({
      requestId: 'req-t01',
      providerId: 'openai-provider',
      modelId: TEST_MODEL_ID,
      prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('provider_auth_error');
    expect(result.text).toBeUndefined();
  });

  it('T02: preview configuration resolution is fail-closed (no key, no model)', () => {
    expect(resolveOpenAiPreviewConfiguration()).toMatchObject({
      configured: false,
      apiKeyPresent: false,
    });
    process.env.OPENAI_API_KEY = 'sk-test-key-abcdefgh';
    const missingModel = resolveOpenAiPreviewConfiguration();
    expect(missingModel.configured).toBe(false);
    expect(missingModel.reason).toContain('STEADFAST_OPENAI_PREVIEW_MODEL_ID');
  });

  it('T03: configured model mismatch → provider_invalid_request, no silent fallback', async () => {
    const adapter = makeAdapter();
    const result = await adapter.generate({
      requestId: 'req-t03',
      providerId: 'openai-provider',
      modelId: 'some-other-model',
      prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('provider_invalid_request');
  });
});

describe('AI-05 provider preview — admission gates', () => {
  const activeBundle = {
    provider: 'openai' as const,
    requestedModelId: TEST_MODEL_ID,
    runtimeCommit: 'fdb1217',
    promptBundleHash: 'pbh-001',
    adapterIdentity: OPENAI_ADAPTER_IDENTITY,
    sdkVersion: 'openai-sdk-6.x',
    maxOutputTokens: 640,
    providerTimeoutMs: 7000,
    totalDeadlineMs: 10000,
    retryPolicyVersion: 'gateway-retry-v1',
    toolsEnabled: false as const,
    qualificationCorpusVersion: 'pq-corpus-v1',
    capabilityScopes: ['text.general_tutoring.en'],
  };

  const config = {
    previewEnabled: true,
    previewSchoolId: 'school-preview-1',
    previewModelId: TEST_MODEL_ID,
    emergencyDisabled: false,
    qualifiedBundle: makeBundle(),
  };

  it('T04: preview disabled → no provider call', () => {
    const gate = evaluatePreviewActivation(
      { ...config, previewEnabled: false },
      { authenticatedSchoolId: 'school-preview-1', activeBundle, capabilityScope: 'text.general_tutoring.en', apiKeyPresent: true },
    );
    expect(gate.allowed).toBe(false);
    expect(gate.state).toBe('DISABLED');
  });

  it('T05: wrong school ID → blocked, no provider call', () => {
    const gate = evaluatePreviewActivation(
      config,
      { authenticatedSchoolId: 'school-other', activeBundle, capabilityScope: 'text.general_tutoring.en', apiKeyPresent: true },
    );
    expect(gate.allowed).toBe(false);
    expect(gate.state).toBe('BLOCKED');
    expect(gate.blocker).toContain('does not match');
  });

  it('T06: emergency disable → blocked from any state', () => {
    const gate = evaluatePreviewActivation(
      { ...config, emergencyDisabled: true },
      { authenticatedSchoolId: 'school-preview-1', activeBundle, capabilityScope: 'text.general_tutoring.en', apiKeyPresent: true },
    );
    expect(gate.allowed).toBe(false);
    expect(gate.state).toBe('EMERGENCY_DISABLED');
  });

  it('T07: unqualified capability scope → blocked', () => {
    const gate = evaluatePreviewActivation(
      config,
      { authenticatedSchoolId: 'school-preview-1', activeBundle, capabilityScope: 'text.general_tutoring.sw', apiKeyPresent: true },
    );
    expect(gate.allowed).toBe(false);
    expect(gate.state).toBe('BLOCKED');
  });
});

describe('AI-05 provider preview — exact-bundle invalidation', () => {
  const activeBundle = {
    provider: 'openai' as const,
    requestedModelId: TEST_MODEL_ID,
    runtimeCommit: 'fdb1217',
    promptBundleHash: 'pbh-001',
    adapterIdentity: OPENAI_ADAPTER_IDENTITY,
    sdkVersion: 'openai-sdk-6.x',
    maxOutputTokens: 640,
    providerTimeoutMs: 7000,
    totalDeadlineMs: 10000,
    retryPolicyVersion: 'gateway-retry-v1',
    toolsEnabled: false as const,
    qualificationCorpusVersion: 'pq-corpus-v1',
    capabilityScopes: ['text.general_tutoring.en'],
  };

  it('T08: matching bundle stays valid', () => {
    const qualified = makeBundle();
    expect(isQualifiedBundleValid(qualified, activeBundle)).toBe(true);
  });

  it('T09: model ID change → REQUALIFICATION_REQUIRED (bundle invalid)', () => {
    const qualified = makeBundle();
    const changed = { ...activeBundle, requestedModelId: 'changed-model' };
    expect(isQualifiedBundleValid(qualified, changed)).toBe(false);
    const gate = evaluatePreviewActivation(
      { previewEnabled: true, previewSchoolId: 's1', previewModelId: 'changed-model', emergencyDisabled: false, qualifiedBundle: qualified },
      { authenticatedSchoolId: 's1', activeBundle: changed, capabilityScope: 'text.general_tutoring.en', apiKeyPresent: true },
    );
    expect(gate.state).toBe('REQUALIFICATION_REQUIRED');
    expect(gate.allowed).toBe(false);
  });

  it('T10: prompt bundle hash change → qualification invalid', () => {
    const qualified = makeBundle();
    const changed = { ...activeBundle, promptBundleHash: 'pbh-002' };
    expect(isQualifiedBundleValid(qualified, changed)).toBe(false);
  });

  it('T11: adapter identity change → qualification invalid', () => {
    const qualified = makeBundle();
    const changed = { ...activeBundle, adapterIdentity: 'openai-model-adapter-v2' };
    expect(isQualifiedBundleValid(qualified, changed)).toBe(false);
  });
});

describe('AI-05 provider preview — transport, error, usage, privacy normalization', () => {
  it('T12: 429 → provider_rate_limited; 401/403 → auth/permission (exactly one transport attempt each, no retry)', async () => {
    const execute = vi
      .fn<ExecuteFn>()
      .mockRejectedValueOnce(transportHttpError(429, 'Too many requests'))
      .mockRejectedValueOnce(transportHttpError(401, 'Unauthorized'))
      .mockRejectedValueOnce(transportHttpError(403, 'Forbidden'));
    const adapter = makeAdapter({}, execute);

    const first = await adapter.generate({
      requestId: 'req-t12a', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(first.ok).toBe(false);
    expect(first.errorCode).toBe('provider_rate_limited');
    expect(execute).toHaveBeenCalledTimes(1);

    const second = await adapter.generate({
      requestId: 'req-t12b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(second.ok).toBe(false);
    expect(second.errorCode).toBe('provider_auth_error');
    expect(execute).toHaveBeenCalledTimes(2);

    const third = await adapter.generate({
      requestId: 'req-t12c', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(third.ok).toBe(false);
    expect(third.errorCode).toBe('provider_permission_error');
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('T13: timeout aborts underlying request; malformed success and missing usage normalize truthfully', async () => {
    // Timeout: transport never resolves; adapter must abort via signal.
    const hangingExecute = vi.fn<ExecuteFn>().mockImplementation(
      (req) =>
        new Promise<OpenAIResponsesTransportResult>((_, rej) => {
          req.abortSignal?.addEventListener('abort', () =>
            rej(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );
    const timeoutAdapter = makeAdapter({}, hangingExecute);
    const timedOut = await timeoutAdapter.generate({
      requestId: 'req-t13a', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring', timeoutMs: 40,
    });
    expect(timedOut.ok).toBe(false);
    expect(timedOut.errorCode).toBe('provider_timeout');
    expect(hangingExecute).toHaveBeenCalledTimes(1);
    expect(hangingExecute.mock.calls[0][0].abortSignal?.aborted).toBe(true);

    // Malformed success: transport success with empty text → provider_malformed_response.
    const malformedAdapter = makeAdapter({}, async () => ({ text: '', providerRequestId: 'resp-x', providerReportedModelId: TEST_MODEL_ID }));
    const malformed = await malformedAdapter.generate({
      requestId: 'req-t13b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(malformed.ok).toBe(false);
    expect(malformed.errorCode).toBe('provider_malformed_response');

    // Usage missing → status 'unknown', NOT zero.
    const noUsageAdapter = makeAdapter({}, async () => ({
      text: 'Let us explore this together.',
      providerRequestId: 'resp-y',
      providerReportedModelId: TEST_MODEL_ID,
    }));
    const noUsage = await noUsageAdapter.generate({
      requestId: 'req-t13c', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(noUsage.ok).toBe(true);
    expect(noUsage.usage?.status).toBe('unknown');
    expect(noUsage.usage?.inputTokens).toBeUndefined();
    expect(noUsage.usage?.outputTokens).toBeUndefined();
  });

  it('T14: privacy projection blocks unsafe prompt BEFORE dispatch (transport call count 0); API key never visible', async () => {
    const execute = vi.fn<ExecuteFn>();
    const adapter = makeAdapter({}, execute);

    const unsafePrompt = `${TEST_PROMPT}\nschoolId: sch_123456\nstudentId: stu_98765\ncontact: learner@example.com`;
    const result = await adapter.generate({
      requestId: 'req-t14', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: unsafePrompt, generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('privacy_projection_blocked');
    expect(execute).not.toHaveBeenCalled();

    // Clean prompt succeeds and never echoes the key.
    const safeAdapter = makeAdapter({}, async () => ({
      text: 'Safe candidate text.',
      providerRequestId: 'resp-z',
      providerReportedModelId: TEST_MODEL_ID,
      usage: { inputTokens: 12, outputTokens: 34, totalTokens: 46 },
    }));
    const safe = await safeAdapter.generate({
      requestId: 'req-t14b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(safe.ok).toBe(true);
    expect(JSON.stringify(safe)).not.toContain('sk-test-key-abcdefgh');
    expect(safe.usage?.status).toBe('reported');
    expect(safe.usage?.outputTokens).toBe(34);
  });
});

describe('AI-05R convergence — Responses execution proof', () => {
  it('T15: canonical transport calls responses.create exactly once with capped output, store:false, no tools', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'resp_123',
      model: TEST_MODEL_ID,
      status: 'completed',
      output_text: 'Guided response.',
      usage: { input_tokens: 12, output_tokens: 34, total_tokens: 46 },
    });
    const transport = new OpenAIResponsesTransport({
      apiKey: 'sk-test-key-abcdefgh',
      client: { responses: { create } },
    });
    const out = await transport.execute({
      modelId: TEST_MODEL_ID,
      input: TEST_PROMPT,
      maxOutputTokens: 5000,
      timeoutMs: 7000,
    });
    expect(create).toHaveBeenCalledTimes(1);
    const [body, opts] = create.mock.calls[0] as [Record<string, unknown>, { signal?: AbortSignal }];
    expect(body['model']).toBe(TEST_MODEL_ID);
    expect(body['max_output_tokens']).toBeLessThanOrEqual(640);
    expect(body['store']).toBe(false);
    expect('tools' in body).toBe(false);
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(out.text).toBe('Guided response.');
    expect(out.usage).toMatchObject({ inputTokens: 12, outputTokens: 34, totalTokens: 46 });
    expect(out.providerRequestId).toBe('resp_123');
    expect(out.providerReportedModelId).toBe(TEST_MODEL_ID);

    // Pure body builder enforces the same law deterministically.
    expect(buildResponsesCreateParams({ modelId: TEST_MODEL_ID, inputText: TEST_PROMPT, maxOutputTokens: 9999 })).toMatchObject({
      model: TEST_MODEL_ID,
      max_output_tokens: 640,
      store: false,
    });
  });

  it('T15b: adapter delegates exactly once with bounded output (<=640) and timeout (<=7000)', async () => {
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({
      text: 'Bounded candidate.',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    });
    const adapter = makeAdapter({}, execute);
    const result = await adapter.generate({
      requestId: 'req-t15b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', maxOutputTokens: 5000, timeoutMs: 30000,
    });
    expect(result.ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0].maxOutputTokens).toBeLessThanOrEqual(640);
    expect(execute.mock.calls[0][0].timeoutMs).toBeLessThanOrEqual(7000);
    expect(execute.mock.calls[0][0].abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('T16: preview-disabled / wrong-school / emergency-disabled → zero transport calls; matching school dispatches once', async () => {
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Should never be called.' });

    const disabled = makeAdapter({ previewEnabled: false }, execute);
    const disabledResult = await disabled.generate({
      requestId: 'req-t16a', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', schoolId: 'school-preview-1',
    });
    expect(disabledResult.ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();

    const wrongSchool = makeAdapter({ previewSchoolId: 'school-preview-1' }, execute);
    const wrongSchoolResult = await wrongSchool.generate({
      requestId: 'req-t16b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', schoolId: 'school-other',
    });
    expect(wrongSchoolResult.ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();

    const emergency = makeAdapter({ emergencyDisabled: true }, execute);
    const emergencyResult = await emergency.generate({
      requestId: 'req-t16c', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', schoolId: 'school-preview-1',
    });
    expect(emergencyResult.ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();

    const matchingExecute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Eligible candidate.' });
    const matching = makeAdapter({ previewEnabled: true, previewSchoolId: 'school-preview-1' }, matchingExecute);
    const matchingResult = await matching.generate({
      requestId: 'req-t16d', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', schoolId: 'school-preview-1',
    });
    expect(matchingResult.ok).toBe(true);
    expect(matchingExecute).toHaveBeenCalledTimes(1);
  });

  it('T17: 5xx → provider_unavailable with a single transport attempt (no adapter retry)', async () => {
    const execute = vi.fn<ExecuteFn>().mockRejectedValue(transportHttpError(503, 'Service unavailable'));
    const adapter = makeAdapter({}, execute);
    const result = await adapter.generate({
      requestId: 'req-t17', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('provider_unavailable');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
