// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Trust Validation v1
// Validates source candidates against the 7-class model.
// Wraps existing sourceTrustValidation for URL/evidence checks.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchTrustedSource,
  ResearchSourceCandidate,
  ResearchSourceKind,
  ResearchSourceTrustStatus,
  ResearchCitationDisplayPolicy,
  ResearchSourceOrigin,
  ResearchSourceBlockReason,
  ResearchSourceEvidence,
  ResearchSourceViolation,
} from './researchSourceTrustContracts';
import {
  hasRetrievalEvidence,
  isValidHttpUrl,
  inferOrigin,
  buildResearchSourceEvidence,
} from './researchSourceEvidenceService';
import { isBlockedUrl } from './sourceTrustValidation';

const MAX_TITLE_LENGTH = 240;
const MAX_SNIPPET_LENGTH = 500;
const MAX_SAFE_SUMMARY_LENGTH = 800;

function safeString(value: unknown, maxLength?: number): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!maxLength) return s;
  return s.length <= maxLength ? s : s.slice(0, maxLength - 3).trimEnd() + '...';
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Check if a string contains prompt injection patterns.
 */
function hasPromptInjection(text: string | null | undefined): boolean {
  const cleaned = safeString(text).toLowerCase();
  if (!cleaned) return false;
  const injectionPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions|directions|rules|prompts)/i,
    /ignore\s+everything\s+(above|before|previous)/i,
    /forget\s+(everything|all|previous)/i,
    /disregard\s+(previous|above|all)/i,
    /you\s+are\s+(now\s+)?(an?\s+)?(admin|administrator|assistant|developer|system)/i,
    /override\s+(your\s+)?(instructions|prompt|system)/i,
    /new\s+instructions?:/i,
    /important\s+instruction:/i,
    /system\s+prompt:/i,
    /<\s*input\s+type\s*=\s*["']?(hidden|submit|text)["']?\s/i,
    /<script[\s>]/i,
    /javascript\s*:/i,
    /data\s*:\s*text\s*\/\s*html/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
  ];
  return injectionPatterns.some((p) => p.test(cleaned));
}

/**
 * Classify a source candidate into a ResearchTrustedSource.
 */
export function classifyResearchSource(
  candidate: ResearchSourceCandidate,
): ResearchTrustedSource {
  const now = nowISO();
  const url = safeString(candidate.url);
  const title = safeString(candidate.title) || 'Untitled Source';
  const snippet = safeString(candidate.snippet);
  const origin = inferOrigin(candidate);
  const evidence: ResearchSourceEvidence[] = [];

  // Build evidence
  const ev = buildResearchSourceEvidence(candidate, origin);
  evidence.push(ev);

  let kind: ResearchSourceKind;
  let trustStatus: ResearchSourceTrustStatus;
  let displayPolicy: ResearchCitationDisplayPolicy;
  const blockReasons: ResearchSourceBlockReason[] = [];

  if (candidate.kind) {
    kind = candidate.kind;
  } else if (origin === 'model_output') {
    kind = 'model_generated';
  } else if (origin === 'fallback') {
    kind = 'model_generated';
  } else if (candidate.artifactId) {
    kind = 'verified_internal_artifact';
  } else if (candidate.videoId) {
    kind = 'verified_video_context';
  } else if (url && isValidHttpUrl(url)) {
    kind = 'verified_web';
  } else if (url && !isValidHttpUrl(url)) {
    kind = 'blocked';
  } else if (!url && (candidate.retrievalRecordId || candidate.toolCallId)) {
    kind = 'unverified_reference';
  } else {
    kind = 'missing';
  }

  // Determine trust status and display policy
  switch (kind) {
    case 'verified_web':
      // Check URL blacklist
      if (url && isBlockedUrl(url)) {
        kind = 'blocked';
        trustStatus = 'blocked';
        displayPolicy = 'hide';
        blockReasons.push('placeholder_url');
        break;
      }

      // Check for retrieval evidence
      if (hasRetrievalEvidence(candidate)) {
        trustStatus = 'verified';
        displayPolicy = 'show_as_verified_citation';
      } else {
        trustStatus = 'unverified';
        displayPolicy = 'show_as_context_note';
        blockReasons.push('missing_evidence');
      }
      break;

    case 'verified_internal_artifact':
      trustStatus = 'verified';
      displayPolicy = 'show_as_internal_reference';
      break;

    case 'verified_video_context':
      trustStatus = 'verified';
      displayPolicy = 'show_as_internal_reference';
      break;

    case 'unverified_reference':
      trustStatus = 'unverified';
      displayPolicy = 'show_as_context_note';
      blockReasons.push('missing_evidence');
      break;

    case 'model_generated':
      trustStatus = 'blocked';
      displayPolicy = 'hide';
      blockReasons.push('model_generated_url');
      break;

    case 'blocked':
      trustStatus = 'blocked';
      displayPolicy = 'hide';
      if (!url || !isValidHttpUrl(url)) {
        if (!blockReasons.includes('placeholder_url')) {
          blockReasons.push('invalid_url');
        }
      }
      break;

    case 'missing':
      trustStatus = 'missing';
      displayPolicy = 'hide';
      break;

    default:
      trustStatus = 'unverified';
      displayPolicy = 'hide';
      blockReasons.push('unsupported_origin');
  }

  // Check for prompt injection in snippet or title
  const safeSnippet = snippet ? snippet.slice(0, MAX_SNIPPET_LENGTH) : null;
  const safeTitle = title ? title.slice(0, MAX_TITLE_LENGTH) : 'Untitled Source';
  let injectionDetected = false;

  if (safeSnippet && hasPromptInjection(safeSnippet)) {
    injectionDetected = true;
    blockReasons.push('prompt_injection');
  }
  if (safeTitle && hasPromptInjection(safeTitle)) {
    injectionDetected = true;
    blockReasons.push('prompt_injection');
  }

  // If prompt injection detected, downgrade
  if (injectionDetected) {
    if (trustStatus === 'verified') {
      trustStatus = 'blocked';
      displayPolicy = 'hide';
    }
  }

  // Build safe summary
  const safeSummary = buildSafeSummary(kind, safeTitle, safeSnippet);

  const warnings: string[] = [];
  if (trustStatus === 'blocked') {
    warnings.push(`Source blocked: ${blockReasons.join(', ')}`);
  }
  if (trustStatus === 'unverified') {
    warnings.push('Source is unverified — missing retrieval evidence');
  }
  if (injectionDetected) {
    warnings.push('Potential prompt injection detected in source content');
  }

  return {
    sourceId: candidate.sourceId || generateId(),
    kind,
    trustStatus,
    displayPolicy,
    origin,
    url: url && isValidHttpUrl(url) ? url : null,
    domain: url && isValidHttpUrl(url) ? extractDomain(url) : null,
    title: safeTitle,
    snippet: safeSnippet,
    artifactId: safeString(candidate.artifactId) || null,
    videoId: safeString(candidate.videoId) || null,
    evidence,
    safeSummary,
    blockReasons,
    warnings,
    createdAt: now,
  };
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function buildSafeSummary(
  kind: ResearchSourceKind,
  title: string,
  snippet: string | null,
): string {
  switch (kind) {
    case 'verified_web':
      return `Verified web source: ${title.slice(0, 100)}${snippet ? `. ${snippet.slice(0, 200)}` : ''}`;
    case 'verified_internal_artifact':
      return `Internal artifact reference: ${title.slice(0, 100)}`;
    case 'verified_video_context':
      return `Video context reference: ${title.slice(0, 100)}`;
    case 'unverified_reference':
      return `Unverified reference: ${title.slice(0, 100)}`;
    case 'model_generated':
      return '[Model-generated reference — not a verified source]';
    case 'blocked':
      return '[Blocked source]';
    case 'missing':
      return '[No source available]';
    default:
      return `Source: ${title.slice(0, 100)}`;
  }
}

/**
 * Classify multiple candidates into a ResearchTrustedSource array.
 */
export function classifyResearchSources(
  candidates: ResearchSourceCandidate[],
): ResearchTrustedSource[] {
  if (!candidates || candidates.length === 0) return [];
  return candidates.map((c) => classifyResearchSource(c));
}

/**
 * Group classified sources by kind.
 */
export function groupClassifiedSources(sources: ResearchTrustedSource[]): {
  verifiedWeb: ResearchTrustedSource[];
  internalReferences: ResearchTrustedSource[];
  unverified: ResearchTrustedSource[];
  blocked: ResearchTrustedSource[];
} {
  const verifiedWeb: ResearchTrustedSource[] = [];
  const internalReferences: ResearchTrustedSource[] = [];
  const unverified: ResearchTrustedSource[] = [];
  const blocked: ResearchTrustedSource[] = [];

  for (const source of sources) {
    switch (source.kind) {
      case 'verified_web':
        verifiedWeb.push(source);
        break;
      case 'verified_internal_artifact':
      case 'verified_video_context':
        internalReferences.push(source);
        break;
      case 'unverified_reference':
        unverified.push(source);
        break;
      case 'model_generated':
      case 'blocked':
        blocked.push(source);
        break;
      case 'missing':
        // Don't add missing to any group
        break;
    }
  }

  return { verifiedWeb, internalReferences, unverified, blocked };
}

/**
 * Validate a candidate and return violations if any.
 */
export function validateResearchSourceCandidate(
  candidate: ResearchSourceCandidate,
): ResearchSourceViolation[] {
  const violations: ResearchSourceViolation[] = [];

  // Check for unsafe content
  const snippet = safeString(candidate.snippet);
  const title = safeString(candidate.title);
  const url = safeString(candidate.url);

  if (snippet && hasPromptInjection(snippet)) {
    violations.push({
      code: 'prompt_injection_in_snippet',
      message: 'Source snippet contains prompt injection patterns',
      severity: 'error',
    });
  }

  if (title && hasPromptInjection(title)) {
    violations.push({
      code: 'prompt_injection_in_title',
      message: 'Source title contains prompt injection patterns',
      severity: 'error',
    });
  }

  if (url && !isValidHttpUrl(url)) {
    violations.push({
      code: 'invalid_url_format',
      message: 'Source URL is not a valid http/https URL',
      severity: 'error',
    });
  }

  if (url && isBlockedUrl(url)) {
    violations.push({
      code: 'blocked_url',
      message: 'Source URL is blocked (placeholder, private, or invalid)',
      severity: 'error',
    });
  }

  return violations;
}
