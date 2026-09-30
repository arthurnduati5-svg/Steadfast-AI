import type { ModelProviderAdapter, ProviderStatus } from './modelProviderContracts';
import { MockModelAdapter } from './providers/mockModelAdapter';
import { LocalModelAdapter } from './providers/localModelAdapter';
import { CloudModelAdapter } from './providers/cloudModelAdapter';
import {
  OpenAiModelAdapter,
  OPENAI_ADAPTER_IDENTITY,
  OPENAI_PREVIEW_PROVIDER_ID,
  type OpenAIResponsesTransportLike,
  type OpenAiPreviewAdmission,
} from './providers/openAiModelAdapter';
import {
  OPENAI_PREVIEW_REASONING_EFFORT,
  parseQualifiedProviderPreviewReport,
  type ProviderQualificationBundle,
} from './providerPreviewQualificationContracts';

export interface ProviderHealthEntry {
  providerId: string;
  status: ProviderStatus;
  reason?: string;
}

export interface ProviderHealthInput {
  providerId?: string;
}

// ── AI-INTELLIGENCE-05R.1: canonical runtime preview environment wiring ──
// The REAL ProviderHealthService-created OpenAI adapter runs in
// 'runtime_preview' mode and fails closed unless the complete
// preview-admission chain (enabled, school, model, passed qualification
// report, exact active bundle, qualified capability, emergency, key) agrees.
const PREVIEW_SDK_VERSION = 'openai-sdk-6.x';

const UNRESOLVED_RUNTIME_COMMIT = 'unknown';
const UNRESOLVED_PROMPT_BUNDLE_HASH = 'unversioned-at-qualification-time';

function isRuntimeCommitResolved(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === UNRESOLVED_RUNTIME_COMMIT) return false;
  return true;
}

function isPromptBundleHashResolved(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === UNRESOLVED_PROMPT_BUNDLE_HASH) return false;
  return true;
}

function readPreviewAdmission(
  modelId: string,
): OpenAiPreviewAdmission {
  const previewEnabled = process.env.STEADFAST_OPENAI_PREVIEW_ENABLED === 'true';
  const previewSchoolId = process.env.STEADFAST_OPENAI_PREVIEW_SCHOOL_ID ?? '';
  const emergencyDisabled = process.env.STEADFAST_OPENAI_EMERGENCY_DISABLED === 'true';
  const capabilityScope = process.env.STEADFAST_OPENAI_PREVIEW_CAPABILITY_SCOPE ?? '';
  const { report } = parseQualifiedProviderPreviewReport(
    process.env.STEADFAST_OPENAI_PREVIEW_QUALIFICATION_REPORT_JSON,
  );

  const runtimeCommit = process.env.STEADFAST_RUNTIME_COMMIT ?? '';
  const promptBundleHash = process.env.STEADFAST_PROMPT_BUNDLE_HASH ?? '';
  // The CURRENT active bundle is reconstructed from current runtime facts —
  // never by reusing the qualified bundle itself. Placeholder identities are
  // valid only as reporting placeholders, never as learner-preview activation
  // identity: unresolved commit/hash means activeBundle = null.
  const activeBundle: OpenAiPreviewAdmission['activeBundle'] =
    isRuntimeCommitResolved(runtimeCommit) && isPromptBundleHashResolved(promptBundleHash)
      ? {
          provider: 'openai',
          requestedModelId: modelId,
          runtimeCommit,
          promptBundleHash,
          adapterIdentity: OPENAI_ADAPTER_IDENTITY,
          sdkVersion: PREVIEW_SDK_VERSION,
          maxOutputTokens: 640,
          providerTimeoutMs: 7000,
          totalDeadlineMs: 10000,
          retryPolicyVersion: 'no-transport-retry-v1',
          toolsEnabled: false,
          reasoningEffort: OPENAI_PREVIEW_REASONING_EFFORT,
          qualificationCorpusVersion: 'pq-corpus-v1',
          capabilityScopes: report ? [...report.bundle.capabilityScopes] : [],
        } satisfies Omit<ProviderQualificationBundle, 'bundleHash' | 'qualifiedAt'>
      : null;

  return {
    previewEnabled,
    previewSchoolId,
    emergencyDisabled,
    qualificationReport: report,
    activeBundle,
    capabilityScope,
  };
}

export class ProviderHealthService {
  private adapters: Map<string, ModelProviderAdapter> = new Map();

  constructor(previewTransport?: OpenAIResponsesTransportLike) {
    this.registerAdapter(new MockModelAdapter());
    this.registerAdapter(new LocalModelAdapter());
    this.registerAdapter(new CloudModelAdapter());
    // AI-INTELLIGENCE-05: register the real OpenAI adapter ONLY when the
    // preview credential AND model are explicitly configured. No credential
    // and no model must never resolve to a mock-capable success path.
    // 05R.1: the registered adapter is the openai-preview ROUTE in
    // runtime_preview mode with environment-derived admission facts. The
    // adapter itself is the non-bypassable final admission boundary, so
    // registration is allowed even while admission is currently blocked.
    const apiKey = process.env.OPENAI_API_KEY;
    const modelId = process.env.STEADFAST_OPENAI_PREVIEW_MODEL_ID;
    if (apiKey && modelId) {
      this.registerAdapter(
        new OpenAiModelAdapter({
          apiKey,
          modelId,
          baseUrl: process.env.OPENAI_BASE_URL,
          sdkVersion: PREVIEW_SDK_VERSION,
          executionMode: 'runtime_preview',
          previewAdmission: readPreviewAdmission(modelId),
          transport: previewTransport,
        }),
      );
    }
  }

  registerAdapter(adapter: ModelProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  async getProviderHealth(input?: ProviderHealthInput): Promise<ProviderHealthEntry[]> {
    const results: ProviderHealthEntry[] = [];

    if (input?.providerId) {
      const adapter = this.adapters.get(input.providerId);
      if (!adapter) {
        results.push({ providerId: input.providerId, status: 'unavailable', reason: 'Unknown provider' });
        return results;
      }
      const status = await adapter.getStatus();
      results.push({
        providerId: adapter.providerId,
        status,
        reason: status === 'available' ? undefined : `Provider status: ${status}`,
      });
      return results;
    }

    for (const adapter of this.adapters.values()) {
      try {
        const status = await adapter.getStatus();
        results.push({
          providerId: adapter.providerId,
          status,
          reason: status === 'available' ? undefined : `Provider status: ${status}`,
        });
      } catch {
        results.push({ providerId: adapter.providerId, status: 'unavailable', reason: 'Health check failed' });
      }
    }

    return results;
  }

  getAdapter(providerId: string): ModelProviderAdapter | undefined {
    if (providerId === OPENAI_PREVIEW_PROVIDER_ID) {
      return this.adapters.get(OPENAI_PREVIEW_PROVIDER_ID);
    }
    return this.adapters.get(providerId);
  }

  getAllAdapters(): ModelProviderAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const defaultProviderHealthService = new ProviderHealthService();
