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
//
// AI-INTELLIGENCE-05R.1: canonical provider route is 'openai-preview' with
// explicit execution modes. Runtime preview dispatches ONLY through the
// ProviderHealthService-created adapter after the full qualification-gated
// admission chain; qualification mode proves evidence can be produced before
// any bundle exists. Every test transport is injected — no focused test may
// instantiate a real OpenAI SDK transport.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  OpenAiModelAdapter,
  resolveOpenAiPreviewConfiguration,
  OPENAI_ADAPTER_IDENTITY,
  OPENAI_PREVIEW_PROVIDER_ID,
  type OpenAiPreviewAdmission,
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
  parseQualifiedProviderPreviewReport,
  type ProviderQualificationBundle,
  type ProviderQualificationReport,
} from '../services/aiGateway/providerPreviewQualificationContracts';
import { ProviderHealthService } from '../services/aiGateway/providerHealthService';

const TEST_MODEL_ID = 'steedfast-preview-test-model';
const TEST_SCHOOL = 'school-preview-1';
const TEST_PROMPT = 'You are a Socratic tutor. Learner asks: Explain photosynthesis.';
const TEST_API_KEY = 'sk-test-key-abcdefgh';

type ExecuteFn = (req: OpenAIResponsesTransportRequest) => Promise<OpenAIResponsesTransportResult>;

type AdapterOverrides = Partial<{
  apiKey: string | undefined;
  modelId: string | undefined;
  previewAdmission: OpenAiPreviewAdmission | undefined;
}>;

/** Never allow a real SDK transport: tests without an explicit fake get one that throws. */
function neverTransport(): { execute: ExecuteFn } {
  return {
    execute: () => {
      throw new Error('Real provider transport must never execute in focused tests.');
    },
  };
}

function makeAdapter(
  overrides: AdapterOverrides = {},
  execute?: ExecuteFn,
  executionMode: 'qualification' | 'runtime_preview' = 'qualification',
): OpenAiModelAdapter {
  // Distinguish "property absent" (use the fake default) from an explicit
  // undefined (exercise the missing-credential/model path).
  const apiKey = Object.prototype.hasOwnProperty.call(overrides, 'apiKey')
    ? overrides.apiKey
    : TEST_API_KEY;
  const modelId = Object.prototype.hasOwnProperty.call(overrides, 'modelId')
    ? overrides.modelId
    : TEST_MODEL_ID;
  return new OpenAiModelAdapter({
    apiKey,
    modelId,
    sdkVersion: 'openai-sdk-6.x',
    executionMode,
    previewAdmission: overrides.previewAdmission,
    transport: execute ? { execute } : neverTransport(),
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
    retryPolicyVersion: 'no-transport-retry-v1',
    toolsEnabled: false as const,
    qualificationCorpusVersion: 'pq-corpus-v1',
    capabilityScopes: ['text.general_tutoring.en'],
  };
  const withoutHash = { ...base, ...overrides };
  const bundleHash = computeBundleHash(withoutHash);
  return { ...withoutHash, bundleHash, qualifiedAt: '2026-09-29T00:00:00.000Z' };
}

function makePassReport(bundleOverrides: Partial<ProviderQualificationBundle> = {}): ProviderQualificationReport {
  const bundle = makeBundle(bundleOverrides);
  return {
    bundle,
    structuralQualification: 'PASS',
    liveConnectivityQualification: 'PASS',
    semanticCases: { total: 8, passed: 8, failed: 0, unverified: 0 },
    criticalFailures: [],
    qualifiedCapabilityScopes: [...bundle.capabilityScopes],
    excludedCapabilityScopes: [],
    providerAttempts: 8,
    reportedUsage: { inputTokens: 12, outputTokens: 34 },
    usageStatus: 'reported',
    latency: { minMs: 10, p50Ms: 20, p95Ms: 50, maxMs: 60 },
    providerIntegrationQualification: 'PASS',
    liveProviderQualification: 'PASS',
    providerSemanticQualification: 'PASS_MINIMUM_PREVIEW_SCOPE',
    schoolPilotQualification: 'UNVERIFIED',
    activationEligibility: 'BLOCKED',
    activeTrafficState: 'DISABLED',
    blockers: ['Preview traffic stays DISABLED until the owner explicitly enables preview activation'],
  };
}

const PREVIEW_ENV_KEYS = [
  'OPENAI_API_KEY',
  'STEADFAST_OPENAI_PREVIEW_MODEL_ID',
  'STEADFAST_OPENAI_PREVIEW_ENABLED',
  'STEADFAST_OPENAI_PREVIEW_SCHOOL_ID',
  'STEADFAST_OPENAI_EMERGENCY_DISABLED',
  'STEADFAST_OPENAI_PREVIEW_QUALIFICATION_REPORT_JSON',
  'STEADFAST_RUNTIME_COMMIT',
  'STEADFAST_PROMPT_BUNDLE_HASH',
  'STEADFAST_OPENAI_PREVIEW_CAPABILITY_SCOPE',
] as const;

function setMatchingPreviewEnv(report: ProviderQualificationReport | string | undefined): void {
  process.env.OPENAI_API_KEY = TEST_API_KEY;
  process.env.STEADFAST_OPENAI_PREVIEW_MODEL_ID = TEST_MODEL_ID;
  process.env.STEADFAST_OPENAI_PREVIEW_ENABLED = 'true';
  process.env.STEADFAST_OPENAI_PREVIEW_SCHOOL_ID = TEST_SCHOOL;
  delete process.env.STEADFAST_OPENAI_EMERGENCY_DISABLED;
  process.env.STEADFAST_RUNTIME_COMMIT = 'fdb1217';
  process.env.STEADFAST_PROMPT_BUNDLE_HASH = 'pbh-001';
  process.env.STEADFAST_OPENAI_PREVIEW_CAPABILITY_SCOPE = 'text.general_tutoring.en';
  if (report === undefined) {
    delete process.env.STEADFAST_OPENAI_PREVIEW_QUALIFICATION_REPORT_JSON;
  } else {
    process.env.STEADFAST_OPENAI_PREVIEW_QUALIFICATION_REPORT_JSON =
      typeof report === 'string' ? report : JSON.stringify(report);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of PREVIEW_ENV_KEYS) delete process.env[key];
});

describe('AI-05 provider preview — credential and config law', () => {
  it('T01: missing API key → provider_auth_error, never mock success', async () => {
    const adapter = makeAdapter({ apiKey: undefined });
    const result = await adapter.generate({
      requestId: 'req-t01',
      providerId: OPENAI_PREVIEW_PROVIDER_ID,
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
    process.env.OPENAI_API_KEY = TEST_API_KEY;
    const missingModel = resolveOpenAiPreviewConfiguration();
    expect(missingModel.configured).toBe(false);
    expect(missingModel.reason).toContain('STEADFAST_OPENAI_PREVIEW_MODEL_ID');
  });

  it('T03: configured model mismatch → provider_invalid_request, no silent fallback', async () => {
    const adapter = makeAdapter();
    const result = await adapter.generate({
      requestId: 'req-t03',
      providerId: OPENAI_PREVIEW_PROVIDER_ID,
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
    retryPolicyVersion: 'no-transport-retry-v1',
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
    retryPolicyVersion: 'no-transport-retry-v1',
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

  it('T11: stale adapter identity (v1) → qualification invalid against v2 runtime', () => {
    const qualified = makeBundle({ adapterIdentity: 'openai-model-adapter-v1' });
    expect(OPENAI_ADAPTER_IDENTITY).toBe('openai-model-adapter-v2');
    expect(isQualifiedBundleValid(qualified, activeBundle)).toBe(false);
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
      requestId: 'req-t12a', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(first.ok).toBe(false);
    expect(first.errorCode).toBe('provider_rate_limited');
    expect(execute).toHaveBeenCalledTimes(1);

    const second = await adapter.generate({
      requestId: 'req-t12b', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(second.ok).toBe(false);
    expect(second.errorCode).toBe('provider_auth_error');
    expect(execute).toHaveBeenCalledTimes(2);

    const third = await adapter.generate({
      requestId: 'req-t12c', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
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
      requestId: 'req-t13a', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring', timeoutMs: 40,
    });
    expect(timedOut.ok).toBe(false);
    expect(timedOut.errorCode).toBe('provider_timeout');
    expect(hangingExecute).toHaveBeenCalledTimes(1);
    expect(hangingExecute.mock.calls[0][0].abortSignal?.aborted).toBe(true);

    // Malformed success: transport success with empty text → provider_malformed_response.
    const malformedAdapter = makeAdapter({}, async () => ({ text: '', providerRequestId: 'resp-x', providerReportedModelId: TEST_MODEL_ID }));
    const malformed = await malformedAdapter.generate({
      requestId: 'req-t13b', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
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
      requestId: 'req-t13c', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
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
      requestId: 'req-t14', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: unsafePrompt, generationMode: 'socratic_tutoring',
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
      requestId: 'req-t14b', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(safe.ok).toBe(true);
    expect(JSON.stringify(safe)).not.toContain(TEST_API_KEY);
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
      apiKey: TEST_API_KEY,
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

  it('T15b: qualification-mode adapter delegates exactly once with bounded output (<=640) and timeout (<=7000)', async () => {
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({
      text: 'Bounded candidate.',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    });
    const adapter = makeAdapter({}, execute, 'qualification');
    const result = await adapter.generate({
      requestId: 'req-t15b', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring', maxOutputTokens: 5000, timeoutMs: 30000,
    });
    expect(result.ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0].maxOutputTokens).toBeLessThanOrEqual(640);
    expect(execute.mock.calls[0][0].timeoutMs).toBeLessThanOrEqual(7000);
    expect(execute.mock.calls[0][0].abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('T17: 5xx → provider_unavailable with a single transport attempt (no adapter retry)', async () => {
    const execute = vi.fn<ExecuteFn>().mockRejectedValue(transportHttpError(503, 'Service unavailable'));
    const adapter = makeAdapter({}, execute);
    const result = await adapter.generate({
      requestId: 'req-t17', providerId: OPENAI_PREVIEW_PROVIDER_ID, modelId: TEST_MODEL_ID, prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('provider_unavailable');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

describe('AI-05R.1 — canonical provider route identity', () => {
  it('T18: ProviderHealthService registers openai-preview; legacy openai-provider resolves to nothing', () => {
    setMatchingPreviewEnv(makePassReport());
    const service = new ProviderHealthService({ execute: async () => ({ text: 'x' }) });
    const adapter = service.getAdapter('openai-preview');
    expect(adapter).toBeDefined();
    expect(adapter?.providerId).toBe('openai-preview');
    expect(OPENAI_PREVIEW_PROVIDER_ID).toBe('openai-preview');
    expect(service.getAdapter('openai-provider')).toBeUndefined();
  });
});

describe('AI-05R.1 — ProviderHealthService runtime admission (cases A–H)', () => {
  function healthAdapter(execute: ReturnType<typeof vi.fn<ExecuteFn>>) {
    const service = new ProviderHealthService({ execute });
    const adapter = service.getAdapter('openai-preview');
    expect(adapter).toBeDefined();
    return adapter as OpenAiModelAdapter;
  }

  function runtimeRequest(schoolId: string, requestId: string) {
    return {
      requestId,
      providerId: OPENAI_PREVIEW_PROVIDER_ID,
      modelId: TEST_MODEL_ID,
      prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring' as const,
      schoolId,
    };
  }

  it('T19A: preview disabled → transport calls = 0', async () => {
    setMatchingPreviewEnv(makePassReport());
    process.env.STEADFAST_OPENAI_PREVIEW_ENABLED = 'false';
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-a'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('preview_disabled');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19B: wrong school → transport calls = 0', async () => {
    setMatchingPreviewEnv(makePassReport());
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest('school-b', 'req-b'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('school_not_authorized');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19C: emergency disabled → transport calls = 0', async () => {
    setMatchingPreviewEnv(makePassReport());
    process.env.STEADFAST_OPENAI_EMERGENCY_DISABLED = 'true';
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-c'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('emergency_disabled');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19D: missing qualification report → transport calls = 0', async () => {
    setMatchingPreviewEnv(undefined);
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-d'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('qualification_required');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19E: malformed / failed qualification report → transport calls = 0', async () => {
    // Malformed JSON.
    setMatchingPreviewEnv('definitely-not-json{{{');
    const malformedExecute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const malformed = await healthAdapter(malformedExecute).generate(runtimeRequest(TEST_SCHOOL, 'req-e1'));
    expect(malformed.ok).toBe(false);
    expect(malformedExecute).toHaveBeenCalledTimes(0);

    // Failed verdict with an otherwise valid shape.
    const failed = makePassReport();
    failed.liveProviderQualification = 'FAIL';
    failed.criticalFailures = ['PQ-03'];
    setMatchingPreviewEnv(failed);
    const failedExecute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const failedResult = await healthAdapter(failedExecute).generate(runtimeRequest(TEST_SCHOOL, 'req-e2'));
    expect(failedResult.ok).toBe(false);
    expect(failedResult.errorCode).toBe('qualification_required');
    expect(failedExecute).toHaveBeenCalledTimes(0);
  });

  it('T19F: exact-bundle mismatch (prompt hash drift) → REQUALIFICATION_REQUIRED, transport calls = 0', async () => {
    setMatchingPreviewEnv(makePassReport());
    process.env.STEADFAST_PROMPT_BUNDLE_HASH = 'pbh-002';
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-f'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('requalification_required');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19G: unqualified capability scope → transport calls = 0', async () => {
    setMatchingPreviewEnv(makePassReport());
    process.env.STEADFAST_OPENAI_PREVIEW_CAPABILITY_SCOPE = 'text.math_guidance.en';
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Must not dispatch.' });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-g'));
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('capability_not_qualified');
    expect(execute).toHaveBeenCalledTimes(0);
  });

  it('T19H: all gates match → exactly one synthetic transport call', async () => {
    setMatchingPreviewEnv(makePassReport());
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({
      text: 'Eligible synthetic candidate.',
      providerRequestId: 'resp-h',
      providerReportedModelId: TEST_MODEL_ID,
      usage: { inputTokens: 5, outputTokens: 6, totalTokens: 11 },
    });
    const result = await healthAdapter(execute).generate(runtimeRequest(TEST_SCHOOL, 'req-h'));
    expect(result.ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

describe('AI-05R.1 — qualification execution mode', () => {
  it('T20: qualification mode dispatches once WITHOUT preview env, school, or report', async () => {
    for (const key of PREVIEW_ENV_KEYS) delete process.env[key];
    const execute = vi.fn<ExecuteFn>().mockResolvedValue({ text: 'Qualification evidence.' });
    const adapter = makeAdapter({ apiKey: TEST_API_KEY, modelId: TEST_MODEL_ID }, execute, 'qualification');
    const result = await adapter.generate({
      requestId: 'req-t20',
      providerId: OPENAI_PREVIEW_PROVIDER_ID,
      modelId: TEST_MODEL_ID,
      prompt: TEST_PROMPT,
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

describe('AI-05R.1 — qualification report validation table', () => {
  it('T21: PASS report accepted; any single verdict defect fails closed', () => {
    expect(parseQualifiedProviderPreviewReport(JSON.stringify(makePassReport())).report).not.toBeNull();

    const mutate = (label: string, fn: (r: ProviderQualificationReport) => void) => {
      const report = makePassReport();
      fn(report);
      const parsed = parseQualifiedProviderPreviewReport(JSON.stringify(report));
      expect(parsed.report, label).toBeNull();
    };

    mutate('integration FAIL', (r) => {
      r.providerIntegrationQualification = 'FAIL';
    });
    mutate('live != PASS', (r) => {
      r.liveProviderQualification = 'FAIL';
    });
    mutate('semantic != minimum scope', (r) => {
      r.providerSemanticQualification = 'FAIL';
    });
    mutate('critical failures non-empty', (r) => {
      r.criticalFailures = ['PQ-04'];
    });
    mutate('semantic failed > 0', (r) => {
      r.semanticCases = { total: 8, passed: 7, failed: 1, unverified: 0 };
    });
    mutate('qualifiedAt missing', (r) => {
      r.bundle = { ...r.bundle, qualifiedAt: '' };
    });
    mutate('bundleHash invalid', (r) => {
      r.bundle = { ...r.bundle, bundleHash: 'deadbeef' };
    });
    expect(parseQualifiedProviderPreviewReport('not-json{{{').report).toBeNull();
    expect(parseQualifiedProviderPreviewReport(undefined).report).toBeNull();
  });
});
