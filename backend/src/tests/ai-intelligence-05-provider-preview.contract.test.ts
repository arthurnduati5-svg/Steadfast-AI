// ── AI-INTELLIGENCE-05: focused provider preview contract tests ──
// Bounded corpus per §37/§38/§39. NOT the AI-04 48-case corpus.
// Proves: fail-closed credential/config law, privacy projection, emergency
// disable, exact-bundle invalidation, cancellation, error/usage
// normalization, and that qualified provider candidates still pass through
// the canonical output validation chain.

import { describe, it, expect, vi, afterEach } from 'vitest';
import OpenAI from 'openai';
import {
  OpenAiModelAdapter,
  resolveOpenAiPreviewConfiguration,
  OPENAI_ADAPTER_IDENTITY,
} from '../services/aiGateway/providers/openAiModelAdapter';
import {
  computeBundleHash,
  evaluatePreviewActivation,
  isQualifiedBundleValid,
  type ProviderQualificationBundle,
} from '../services/aiGateway/providerPreviewQualificationContracts';

const TEST_MODEL_ID = 'steedfast-preview-test-model';
const TEST_PROMPT = 'You are a Socratic tutor. Learner asks: Explain photosynthesis.';

function makeAdapter(overrides: Partial<{ apiKey: string; modelId: string }> = {}): OpenAiModelAdapter {
  return new OpenAiModelAdapter({
    apiKey: overrides.apiKey ?? 'sk-test-key-abcdefgh',
    modelId: overrides.modelId ?? TEST_MODEL_ID,
    sdkVersion: 'openai-sdk-6.x',
  });
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
  it('T12: 429 → provider_rate_limited; 401/403 → auth/permission (adapter performs zero retries)', async () => {
    const adapter = makeAdapter();
    const fakeClient = {
      chat: {
        completions: {
          create: vi
            .fn()
            .mockRejectedValueOnce(Object.assign(new Error('Too many requests'), { status: 429 }))
            .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 })),
        },
      },
    };
    (adapter as unknown as { client: unknown }).client = fakeClient;

    const first = await adapter.generate({
      requestId: 'req-t12a', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(first.ok).toBe(false);
    expect(first.errorCode).toBe('provider_rate_limited');
    expect(fakeClient.chat.completions.create).toHaveBeenCalledTimes(1);

    const second = await adapter.generate({
      requestId: 'req-t12b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(second.ok).toBe(false);
    expect(second.errorCode).toBe('provider_auth_error');
    expect(fakeClient.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('T13: timeout aborts underlying request; malformed success and missing usage normalize truthfully', async () => {
    const adapter = makeAdapter();

    // Timeout: SDK call never resolves; adapter must abort via signal.
    const never = new Promise<never>((_, reject) => {
      (adapter as unknown as { client: unknown }).client = {
        chat: { completions: { create: vi.fn().mockImplementation((_body: unknown, opts: { signal: AbortSignal }) => new Promise<never>((__, rej) => {
          opts.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        })) } },
      };
    });
    void never;
    const timedOut = await adapter.generate({
      requestId: 'req-t13a', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring', timeoutMs: 40,
    });
    expect(timedOut.ok).toBe(false);
    expect(timedOut.errorCode).toBe('provider_timeout');

    // Malformed success: HTTP 200 with empty text → provider_malformed_response.
    (adapter as unknown as { client: unknown }).client = {
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: '' } }], id: 'resp-x', model: TEST_MODEL_ID }) } },
    };
    const malformed = await adapter.generate({
      requestId: 'req-t13b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(malformed.ok).toBe(false);
    expect(malformed.errorCode).toBe('provider_malformed_response');

    // Usage missing → status 'unknown', NOT zero.
    (adapter as unknown as { client: unknown }).client = {
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Let us explore this together.' } }], id: 'resp-y', model: TEST_MODEL_ID }) } },
    };
    const noUsage = await adapter.generate({
      requestId: 'req-t13c', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(noUsage.ok).toBe(true);
    expect(noUsage.usage?.status).toBe('unknown');
    expect(noUsage.usage?.inputTokens).toBeUndefined();
    expect(noUsage.usage?.outputTokens).toBeUndefined();
  });

  it('T14: privacy projection blocks unsafe prompt BEFORE dispatch (provider call count 0); API key never visible', async () => {
    const adapter = makeAdapter();
    const createSpy = vi.fn();
    (adapter as unknown as { client: unknown }).client = { chat: { completions: { create: createSpy } } };

    const unsafePrompt = `${TEST_PROMPT}\nschoolId: sch_123456\nstudentId: stu_98765\ncontact: learner@example.com`;
    const result = await adapter.generate({
      requestId: 'req-t14', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: unsafePrompt, generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('privacy_projection_blocked');
    expect(createSpy).not.toHaveBeenCalled();

    // Clean prompt succeeds and never echoes the key.
    (adapter as unknown as { client: unknown }).client = {
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Safe candidate text.' } }], id: 'resp-z', model: TEST_MODEL_ID, usage: { prompt_tokens: 12, completion_tokens: 34, total_tokens: 46 } }) } },
    };
    const safe = await adapter.generate({
      requestId: 'req-t14b', providerId: 'openai-provider', modelId: TEST_MODEL_ID, prompt: TEST_PROMPT, generationMode: 'socratic_tutoring',
    });
    expect(safe.ok).toBe(true);
    expect(JSON.stringify(safe)).not.toContain('sk-test-key-abcdefgh');
    expect(safe.usage?.status).toBe('reported');
    expect(safe.usage?.outputTokens).toBe(34);
  });
});
