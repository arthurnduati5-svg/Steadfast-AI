// ── AI-INTELLIGENCE-05: controlled OpenAI preview qualification contracts ──
// Qualification applies to ONE exact bundle. Changing any material field
// invalidates the qualification (REQUALIFICATION_REQUIRED).
// Provider semantic qualification must never overclaim: school pilot remains
// UNVERIFIED, and activation remains school-scoped and default-off.

export type ProviderPreviewActivationState =
  | 'DISABLED'
  | 'READY_FOR_QUALIFICATION'
  | 'QUALIFYING'
  | 'QUALIFIED'
  | 'PREVIEW_ELIGIBLE'
  | 'BLOCKED'
  | 'EMERGENCY_DISABLED'
  | 'REQUALIFICATION_REQUIRED';

export type ProviderQualificationStatus =
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED_NO_CREDENTIAL'
  | 'UNVERIFIED_PROVIDER_PENDING';

export type ProviderSemanticQualificationStatus =
  | 'PASS_MINIMUM_PREVIEW_SCOPE'
  | 'FAIL'
  | 'UNVERIFIED_PROVIDER_PENDING';

export type ActivationEligibilityStatus = 'PREVIEW_ELIGIBLE' | 'BLOCKED';

export type ActiveTrafficState = 'DISABLED' | 'PREVIEW_ENABLED';

export interface ProviderQualificationBundle {
  provider: 'openai';
  requestedModelId: string;
  providerReportedModelId?: string;
  runtimeCommit: string;
  promptBundleHash: string;
  adapterIdentity: string;
  sdkVersion: string;
  maxOutputTokens: number;
  providerTimeoutMs: number;
  totalDeadlineMs: number;
  retryPolicyVersion: string;
  toolsEnabled: false;
  qualificationCorpusVersion: string;
  capabilityScopes: string[];
  qualifiedAt?: string;
  bundleHash: string;
}

/** Material fields: changing ANY of these invalidates qualification. */
const MATERIAL_BUNDLE_FIELDS: Array<keyof ProviderQualificationBundle> = [
  'provider',
  'requestedModelId',
  'runtimeCommit',
  'promptBundleHash',
  'adapterIdentity',
  'sdkVersion',
  'maxOutputTokens',
  'providerTimeoutMs',
  'totalDeadlineMs',
  'retryPolicyVersion',
  'toolsEnabled',
  'qualificationCorpusVersion',
  'capabilityScopes',
];

export interface ProviderQualificationCaseResult {
  caseId: string;
  capabilityScope: string;
  critical: boolean;
  passed: boolean;
  unverified: boolean;
  failureReasons: string[];
}

export interface ProviderQualificationReport {
  bundle: ProviderQualificationBundle;
  structuralQualification: 'PASS' | 'FAIL';
  liveConnectivityQualification: 'PASS' | 'FAIL' | 'BLOCKED_NO_CREDENTIAL' | 'UNVERIFIED_PROVIDER_PENDING';
  semanticCases: { total: number; passed: number; failed: number; unverified: number };
  criticalFailures: string[];
  qualifiedCapabilityScopes: string[];
  excludedCapabilityScopes: string[];
  providerAttempts: number;
  reportedUsage: { inputTokens?: number; outputTokens?: number } | null;
  usageStatus: 'reported' | 'partial' | 'unknown' | 'none';
  latency: { minMs: number | null; p50Ms: number | null; p95Ms: number | null; maxMs: number | null };
  providerIntegrationQualification: 'PASS' | 'FAIL';
  liveProviderQualification: ProviderQualificationStatus;
  providerSemanticQualification: ProviderSemanticQualificationStatus;
  schoolPilotQualification: 'UNVERIFIED';
  activationEligibility: ActivationEligibilityStatus;
  activeTrafficState: ActiveTrafficState;
  blockers: string[];
}

/** Deterministic bundle hash (FNV-1a) over the canonical JSON of material fields. */
export function computeBundleHash(bundle: Omit<ProviderQualificationBundle, 'bundleHash' | 'qualifiedAt'>): string {
  const material: Record<string, unknown> = {};
  for (const field of MATERIAL_BUNDLE_FIELDS) {
    material[field] = bundle[field];
  }
  const serialized = JSON.stringify(material);
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Exact-bundle invalidation: qualified bundle remains valid ONLY while every
 * material field of the active bundle matches. Any mismatch requires
 * requalification. No stale qualification reuse.
 */
export function isQualifiedBundleValid(
  qualified: ProviderQualificationBundle,
  active: Omit<ProviderQualificationBundle, 'bundleHash' | 'qualifiedAt'>,
): boolean {
  const activeHash = computeBundleHash(active);
  if (qualified.bundleHash !== activeHash) return false;
  for (const field of MATERIAL_BUNDLE_FIELDS) {
    const a = qualified[field];
    const b = active[field];
    if (JSON.stringify(a) !== JSON.stringify(b)) return false;
  }
  return true;
}

export interface OpenAiPreviewActivationConfig {
  previewEnabled: boolean;
  previewSchoolId: string;
  previewModelId: string;
  emergencyDisabled: boolean;
  qualifiedBundle: ProviderQualificationBundle | null;
}

/**
 * Preview activation gate (AI-05 §30). Preview traffic is allowed ONLY for:
 * configured preview school AND qualified bundle AND privacy/credential gates
 * AND emergency disable false. Fail-closed in every branch.
 */
export function evaluatePreviewActivation(
  config: OpenAiPreviewActivationConfig,
  input: {
    authenticatedSchoolId: string;
    activeBundle: Omit<ProviderQualificationBundle, 'bundleHash' | 'qualifiedAt'>;
    capabilityScope: string;
    apiKeyPresent: boolean;
  },
): { state: ProviderPreviewActivationState; allowed: boolean; blocker?: string } {
  if (config.emergencyDisabled) {
    return { state: 'EMERGENCY_DISABLED', allowed: false, blocker: 'STEADFAST_OPENAI_EMERGENCY_DISABLED is active' };
  }
  if (!config.previewEnabled) {
    return { state: 'DISABLED', allowed: false, blocker: 'STEADFAST_OPENAI_PREVIEW_ENABLED is not true' };
  }
  if (!config.previewSchoolId) {
    return { state: 'BLOCKED', allowed: false, blocker: 'STEADFAST_OPENAI_PREVIEW_SCHOOL_ID is not configured' };
  }
  if (input.authenticatedSchoolId !== config.previewSchoolId) {
    return { state: 'BLOCKED', allowed: false, blocker: 'Authenticated school does not match the configured preview school' };
  }
  if (!config.previewModelId) {
    return { state: 'BLOCKED', allowed: false, blocker: 'STEADFAST_OPENAI_PREVIEW_MODEL_ID is not configured' };
  }
  if (!config.qualifiedBundle) {
    return { state: 'READY_FOR_QUALIFICATION', allowed: false, blocker: 'No qualified provider bundle exists' };
  }
  if (!isQualifiedBundleValid(config.qualifiedBundle, input.activeBundle)) {
    return { state: 'REQUALIFICATION_REQUIRED', allowed: false, blocker: 'Active bundle does not match the qualified bundle' };
  }
  if (!input.capabilityScope || !config.qualifiedBundle.capabilityScopes.includes(input.capabilityScope)) {
    return { state: 'BLOCKED', allowed: false, blocker: `Capability scope not qualified: ${input.capabilityScope || 'none'}` };
  }
  if (!input.apiKeyPresent) {
    return { state: 'BLOCKED', allowed: false, blocker: 'OPENAI_API_KEY is not present' };
  }
  return { state: 'PREVIEW_ELIGIBLE', allowed: true };
}
