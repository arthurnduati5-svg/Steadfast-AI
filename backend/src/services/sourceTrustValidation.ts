// ─────────────────────────────────────────────────────────────
// Steadfast AI — Source Trust Validation Utilities
// Pure functions for validating source candidates and blocking
// fake/placeholder/unsupported URLs.
// ─────────────────────────────────────────────────────────────

import type {
  SourceCandidate,
  VerifiedSourceRecord,
  UnsupportedSourceRecord,
  SourceKind,
  VerificationMethod,
} from './sourceTrustContracts';

/**
 * Blocked URL patterns — these are never trusted.
 */
const BLOCKED_URL_PATTERNS: RegExp[] = [
  /^example\.com/i,
  /^https?:\/\/example\.com/i,
  /^https?:\/\/www\.example\.com/i,
  /^localhost/i,
  /^https?:\/\/localhost/i,
  /^127\.0\.0\.1/i,
  /^https?:\/\/127\.0\.0\.1/i,
  /^0\.0\.0\.0/i,
  /^https?:\/\/0\.0\.0\.0/i,
  /^file:\/\//i,
  /^data:/i,
  /^javascript:/i,
  /^about:/i,
  /^chrome:/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,    // Private 10.x.x.x
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/i, // Private 172.16-31.x.x
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/i,          // Private 192.168.x.x
];

/**
 * Placeholder/example domains that should never be trusted.
 */
const KNOWN_PLACEHOLDER_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'placeholder.com',
  'test.com',
  'domain.com',
  'yourdomain.com',
  'sourcedomain.com',
];

/**
 * Check if a URL is blocked by pattern.
 */
export function isBlockedUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // Check blocked patterns
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Check placeholder domains
  try {
    const hostname = new URL(trimmed).hostname.toLowerCase();
    if (KNOWN_PLACEHOLDER_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return true;
    }
  } catch {
    // Invalid URL is also blocked
    return true;
  }

  return false;
}

/**
 * Get the reason why a URL is blocked.
 * Uses the same logic as isBlockedUrl for consistency.
 */
export function getBlockedReason(url: string | null | undefined): UnsupportedSourceRecord['reason'] {
  if (!url || typeof url !== 'string') return 'invalid_url';
  const trimmed = url.trim();
  if (!trimmed) return 'invalid_url';

  // Check blocked protocols first
  if (/^file:\/\//i.test(trimmed)) return 'blocked_protocol';
  if (/^data:/i.test(trimmed)) return 'blocked_protocol';
  if (/^javascript:/i.test(trimmed)) return 'blocked_protocol';
  if (/^about:/i.test(trimmed)) return 'blocked_protocol';
  if (/^chrome:/i.test(trimmed)) return 'blocked_protocol';

  // Use URL parsing to extract hostname for reliable pattern matching
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Check placeholder domains
    if (/^example\./.test(hostname) || hostname === 'www.example.com' || hostname.endsWith('.example.com') || hostname.endsWith('.example.org') || hostname.endsWith('.example.net')) {
      return 'placeholder_url';
    }

    // Check local/private hosts
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname === '0.0.0.0') {
      return 'private_or_local_url';
    }

    // Check private IP ranges
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return 'private_or_local_url';
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return 'private_or_local_url';
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return 'private_or_local_url';

    return 'unknown';
  } catch {
    // If URL parsing fails, fall back to simple prefix checks for bare domains
    if (/^example\./i.test(trimmed)) return 'placeholder_url';
    if (/^localhost/i.test(trimmed)) return 'private_or_local_url';
    if (/^127\.0\.0\.1/i.test(trimmed)) return 'private_or_local_url';
    if (/^0\.0\.0\.0/i.test(trimmed)) return 'private_or_local_url';
    return 'unknown';
  }
}

/**
 * Determine if a source candidate has retrieval/provenance/verification.
 */
function hasVerificationProvenance(candidate: SourceCandidate): boolean {
  // Has a retrieval record ID
  if (candidate.retrievalRecordId && typeof candidate.retrievalRecordId === 'string' && candidate.retrievalRecordId.trim()) {
    return true;
  }

  // Has artifact provenance
  if (candidate.artifactId && typeof candidate.artifactId === 'string' && candidate.artifactId.trim()) {
    return true;
  }

  // Has content fingerprint (suggests retrieved content exists)
  if (candidate.contentFingerprint && typeof candidate.contentFingerprint === 'string' && candidate.contentFingerprint.trim()) {
    return true;
  }

  // Has retrieved timestamp
  if (candidate.retrievedAt && typeof candidate.retrievedAt === 'string' && candidate.retrievedAt.trim()) {
    return true;
  }

  return false;
}

/**
 * Determine verification method from candidate.
 */
function inferVerificationMethod(candidate: SourceCandidate): VerificationMethod {
  if (candidate.artifactId && typeof candidate.artifactId === 'string' && candidate.artifactId.trim()) {
    return 'artifact_provenance';
  }
  if (candidate.kind === 'teacher_upload') return 'teacher_upload';
  if (candidate.kind === 'school_resource') return 'school_registry';
  if (candidate.kind === 'internal_curriculum') return 'internal_curriculum';
  if (candidate.retrievalRecordId) return 'retrieval_record';
  return 'manual_review';
}

function nowISO(): string {
  return new Date().toISOString();
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validate a single source candidate.
 * Returns VerifiedSourceRecord if valid, UnsupportedSourceRecord if blocked.
 */
export function validateSourceCandidate(
  candidate: SourceCandidate,
  schoolId?: string | null,
): VerifiedSourceRecord | UnsupportedSourceRecord {
  const now = nowISO();
  const url = safeString(candidate.url);
  const title = safeString(candidate.title) || 'Untitled Source';

  // Check if URL is blocked
  if (url && isBlockedUrl(url)) {
    return {
      attemptedTitle: title,
      attemptedUrl: url,
      reason: getBlockedReason(url),
      blockedAt: now,
    };
  }

  // Model-generated URL without verification provenance
  if (url && !hasVerificationProvenance(candidate)) {
    return {
      attemptedTitle: title,
      attemptedUrl: url,
      reason: 'model_generated_url',
      blockedAt: now,
    };
  }

  // No URL and no verification provenance
  if (!url && !hasVerificationProvenance(candidate)) {
    return {
      attemptedTitle: title,
      attemptedUrl: null,
      reason: 'missing_retrieval_record',
      blockedAt: now,
    };
  }

  // Has verification provenance — create verified record
  const kind: SourceKind = candidate.kind || 'web';
  const verificationMethod = inferVerificationMethod(candidate);
  const displayAllowed = candidate.displayAllowed !== false;

  return {
    sourceId: candidate.sourceId || `src_${now}_${Math.random().toString(36).slice(2, 10)}`,
    kind,
    title,
    url: url || null,
    artifactId: safeString(candidate.artifactId) || null,
    artifactBlockId: safeString(candidate.artifactBlockId) || null,
    schoolId: schoolId || null,
    retrievedAt: safeString(candidate.retrievedAt) || null,
    verifiedAt: now,
    verificationMethod,
    contentFingerprint: safeString(candidate.contentFingerprint) || null,
    trustStatus: verificationMethod === 'manual_review' ? 'partial' : 'verified',
    displayAllowed,
    citationAllowed: displayAllowed,
    notes: [],
  };
}

/**
 * Generate a deterministic fingerprint from verified sources.
 */
export function fingerprintVerifiedSources(sources: VerifiedSourceRecord[]): string | null {
  if (!sources || sources.length === 0) return null;

  const sorted = [...sources].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  const fingerprintInput = sorted
    .map((s) => `${s.sourceId}:${s.url || ''}:${s.contentFingerprint || ''}:${s.retrievedAt || s.verifiedAt}`)
    .join('|');

  let hash = 0;
  for (let i = 0; i < fingerprintInput.length; i++) {
    const char = fingerprintInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Filter verified sources that are allowed to be displayed/sent to frontend.
 */
export function filterDisplaySources(sources: VerifiedSourceRecord[]): VerifiedSourceRecord[] {
  return sources.filter((s) => s.displayAllowed);
}
