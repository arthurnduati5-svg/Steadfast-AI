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

export type OpenAiReasoningEffort =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';

export const OPENAI_PREVIEW_REASONING_EFFORT: OpenAiReasoningEffort = 'low';

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
  reasoningEffort: OpenAiReasoningEffort;
  qualificationCorpusVersion: string;
  capabilityScopes: string[];
  qualifiedAt?: string;
  bundleHash: string;
}

/** Material fields: changing ANY of these invalidates qualification. */
type MaterialBundleField =
  keyof Omit<
    ProviderQualificationBundle,
    'bundleHash' | 'qualifiedAt'
  >;

const MATERIAL_BUNDLE_FIELDS:
  readonly MaterialBundleField[] = [
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
  'reasoningEffort',
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

// ── AI-INTELLIGENCE-05R.1: fail-closed qualification report parser ──
// Runtime admission consumes a qualification REPORT (not a raw bundle) because
// only the report carries the qualification verdict. Malformed optional preview
// config must never throw at startup — it fails closed to null.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isStringArray(value: unknown, nonEmptyElements: boolean): value is string[] {
  if (!Array.isArray(value)) return false;
  for (const entry of value) {
    if (typeof entry !== 'string') return false;
    if (nonEmptyElements && entry.length === 0) return false;
  }
  return true;
}

function isOpenAiReasoningEffort(value: unknown): value is OpenAiReasoningEffort {
  return (
    value === 'none' ||
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'xhigh' ||
    value === 'max'
  );
}

function isValidQualificationBundle(bundle: unknown): bundle is ProviderQualificationBundle {
  if (!isRecord(bundle)) return false;
  if (bundle['provider'] !== 'openai') return false;
  if (!isNonEmptyString(bundle['requestedModelId'])) return false;
  const reported = bundle['providerReportedModelId'];
  if (reported !== undefined && typeof reported !== 'string') return false;
  if (!isNonEmptyString(bundle['runtimeCommit'])) return false;
  if (!isNonEmptyString(bundle['promptBundleHash'])) return false;
  if (!isNonEmptyString(bundle['adapterIdentity'])) return false;
  if (!isNonEmptyString(bundle['sdkVersion'])) return false;
  if (!isFinitePositiveNumber(bundle['maxOutputTokens'])) return false;
  if (!isFinitePositiveNumber(bundle['providerTimeoutMs'])) return false;
  if (!isFinitePositiveNumber(bundle['totalDeadlineMs'])) return false;
  if (!isNonEmptyString(bundle['retryPolicyVersion'])) return false;
  if (bundle['toolsEnabled'] !== false) return false;
  if (!isOpenAiReasoningEffort(bundle['reasoningEffort'])) return false;
  if (!isNonEmptyString(bundle['qualificationCorpusVersion'])) return false;
  if (!isStringArray(bundle['capabilityScopes'], true)) return false;
  if (!isNonEmptyString(bundle['qualifiedAt'])) return false;
  if (!isNonEmptyString(bundle['bundleHash'])) return false;
  return true;
}

function isValidLatency(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const key of ['minMs', 'p50Ms', 'p95Ms', 'maxMs'] as const) {
    const entry = value[key];
    if (entry !== null && !isFiniteNonNegativeNumber(entry)) return false;
  }
  return true;
}

function isValidReportedUsage(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  for (const key of ['inputTokens', 'outputTokens'] as const) {
    const entry = value[key];
    if (entry !== undefined && !isFiniteNonNegativeNumber(entry)) return false;
  }
  return true;
}

function isValidReportShape(report: ProviderQualificationReport): boolean {
  if (!isRecord(report)) return false;
  const record = report as unknown as Record<string, unknown>;
  if (!isValidQualificationBundle(record['bundle'])) return false;
  if (record['structuralQualification'] !== 'PASS' && record['structuralQualification'] !== 'FAIL') return false;
  const liveConnectivity = record['liveConnectivityQualification'];
  if (
    liveConnectivity !== 'PASS' &&
    liveConnectivity !== 'FAIL' &&
    liveConnectivity !== 'BLOCKED_NO_CREDENTIAL' &&
    liveConnectivity !== 'UNVERIFIED_PROVIDER_PENDING'
  ) {
    return false;
  }
  const semanticCases = record['semanticCases'];
  if (!isRecord(semanticCases)) return false;
  if (!isFiniteNonNegativeInteger(semanticCases['total'])) return false;
  if (!isFiniteNonNegativeInteger(semanticCases['passed'])) return false;
  if (!isFiniteNonNegativeInteger(semanticCases['failed'])) return false;
  if (!isFiniteNonNegativeInteger(semanticCases['unverified'])) return false;
  if (
    (semanticCases['passed'] as number) +
      (semanticCases['failed'] as number) +
      (semanticCases['unverified'] as number) !==
    (semanticCases['total'] as number)
  ) {
    return false;
  }
  if (!isStringArray(record['criticalFailures'], false)) return false;
  if (!isStringArray(record['qualifiedCapabilityScopes'], false)) return false;
  if (!isStringArray(record['excludedCapabilityScopes'], false)) return false;
  if (!isFiniteNonNegativeInteger(record['providerAttempts'])) return false;
  if (!isValidReportedUsage(record['reportedUsage'])) return false;
  const usageStatus = record['usageStatus'];
  if (usageStatus !== 'reported' && usageStatus !== 'partial' && usageStatus !== 'unknown' && usageStatus !== 'none') {
    return false;
  }
  if (!isValidLatency(record['latency'])) return false;
  if (record['providerIntegrationQualification'] !== 'PASS' && record['providerIntegrationQualification'] !== 'FAIL') {
    return false;
  }
  const liveProvider = record['liveProviderQualification'];
  if (
    liveProvider !== 'PASS' &&
    liveProvider !== 'FAIL' &&
    liveProvider !== 'BLOCKED_NO_CREDENTIAL' &&
    liveProvider !== 'UNVERIFIED_PROVIDER_PENDING'
  ) {
    return false;
  }
  const semantic = record['providerSemanticQualification'];
  if (semantic !== 'PASS_MINIMUM_PREVIEW_SCOPE' && semantic !== 'FAIL' && semantic !== 'UNVERIFIED_PROVIDER_PENDING') {
    return false;
  }
  if (record['schoolPilotQualification'] !== 'UNVERIFIED') return false;
  if (record['activationEligibility'] !== 'PREVIEW_ELIGIBLE' && record['activationEligibility'] !== 'BLOCKED') {
    return false;
  }
  if (record['activeTrafficState'] !== 'DISABLED' && record['activeTrafficState'] !== 'PREVIEW_ENABLED') {
    return false;
  }
  if (!isStringArray(record['blockers'], false)) return false;
  return true;
}

/**
 * Report-level qualification verdict (05R.1 §11). Accepts a parsed report as
 * qualified ONLY when every verdict field passes. Bundle/model currency is
 * enforced separately by the exact-bundle admission gate.
 */
export function isQualificationReportPassing(report: ProviderQualificationReport): boolean {
  if (!isValidReportShape(report)) return false;
  if (report.providerIntegrationQualification !== 'PASS') return false;
  if (report.liveProviderQualification !== 'PASS') return false;
  if (report.providerSemanticQualification !== 'PASS_MINIMUM_PREVIEW_SCOPE') return false;
  if (report.criticalFailures.length !== 0) return false;
  if (report.semanticCases.failed !== 0) return false;
  if (report.qualifiedCapabilityScopes.length === 0) return false;
  for (const scope of report.qualifiedCapabilityScopes) {
    if (!report.bundle.capabilityScopes.includes(scope)) return false;
  }
  const bundle = report.bundle;
  const { bundleHash: _ignoredHash, qualifiedAt: _ignoredAt, ...material } = bundle;
  void _ignoredHash;
  void _ignoredAt;
  if (computeBundleHash(material) !== bundle.bundleHash) return false;
  return true;
}

export function parseQualifiedProviderPreviewReport(
  raw: string | undefined,
): { report: ProviderQualificationReport | null; reason?: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { report: null, reason: 'qualification report is not configured' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { report: null, reason: 'qualification report is not valid JSON' };
  }
  if (!isRecord(parsed)) {
    return { report: null, reason: 'qualification report has the wrong shape' };
  }
  const candidate = parsed as unknown as ProviderQualificationReport;
  if (!isValidReportShape(candidate)) {
    return { report: null, reason: 'qualification report has the wrong shape' };
  }
  if (!isQualificationReportPassing(candidate)) {
    return { report: null, reason: 'qualification report did not pass' };
  }
  return { report: candidate };
}
