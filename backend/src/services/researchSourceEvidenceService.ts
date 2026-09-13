// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Evidence Service v1
// Builds evidence objects that prove a source was retrieved.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchSourceEvidence,
  ResearchSourceCandidate,
  ResearchSourceOrigin,
} from './researchSourceTrustContracts';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Extract a domain from a URL string.
 */
function extractDomain(url: string | null | undefined): string | null {
  const cleaned = safeString(url);
  if (!cleaned) return null;
  try {
    const parsed = new URL(cleaned);
    return parsed.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * Build evidence for a research source candidate.
 * Evidence proves that the source was actually retrieved from a tool or context.
 */
export function buildResearchSourceEvidence(
  candidate: ResearchSourceCandidate,
  overrideOrigin?: ResearchSourceOrigin,
): ResearchSourceEvidence {
  const url = safeString(candidate.url);
  const title = safeString(candidate.title);
  const snippet = safeString(candidate.snippet);

  const origin: ResearchSourceOrigin =
    overrideOrigin || inferOrigin(candidate);

  const evidence: ResearchSourceEvidence = {
    evidenceId: candidate.sourceId || generateId(),
    origin,
    retrievedAt: safeString(candidate.retrievedAt) || nowISO(),
    toolName: safeString(candidate.toolName) || null,
    toolCallId: safeString(candidate.toolCallId) || null,
    url: url || null,
    domain: extractDomain(url),
    title: title || null,
    snippet: snippet ? snippet.slice(0, 500) : null,
    artifactId: safeString(candidate.artifactId) || null,
    videoId: safeString(candidate.videoId) || null,
    hash: safeString(candidate.contentHash) || null,
  };

  return evidence;
}

/**
 * Check whether a candidate has sufficient retrieval evidence to be classified as verified.
 */
export function hasRetrievalEvidence(candidate: ResearchSourceCandidate): boolean {
  // Has a retrieval record ID
  if (candidate.retrievalRecordId && typeof candidate.retrievalRecordId === 'string' && candidate.retrievalRecordId.trim()) {
    return true;
  }

  // Has a tool call ID (proves it was retrieved by a search/research tool)
  if (candidate.toolCallId && typeof candidate.toolCallId === 'string' && candidate.toolCallId.trim()) {
    return true;
  }

  // Has a tool name (proves which tool retrieved it)
  if (candidate.toolName && typeof candidate.toolName === 'string' && candidate.toolName.trim()) {
    return true;
  }

  // Has an artifact ID (proves internal provenance)
  if (candidate.artifactId && typeof candidate.artifactId === 'string' && candidate.artifactId.trim()) {
    return true;
  }

  // Has a video ID (proves video context)
  if (candidate.videoId && typeof candidate.videoId === 'string' && candidate.videoId.trim()) {
    return true;
  }

  // Has a retrieval timestamp
  if (candidate.retrievedAt && typeof candidate.retrievedAt === 'string' && candidate.retrievedAt.trim()) {
    return true;
  }

  // Has a content hash (suggests content was actually retrieved)
  if (candidate.contentHash && typeof candidate.contentHash === 'string' && candidate.contentHash.trim()) {
    return true;
  }

  return false;
}

/**
 * Check if a URL is a valid http/https URL.
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  const cleaned = safeString(url);
  if (!cleaned) return false;
  try {
    const parsed = new URL(cleaned);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get the effective origin for evidence building.
 */
export function inferOrigin(candidate: ResearchSourceCandidate): ResearchSourceOrigin {
  if (candidate.origin) return candidate.origin;
  if (candidate.artifactId) return 'artifact_context';
  if (candidate.videoId) return 'video_context';
  if (candidate.toolName || candidate.toolCallId || candidate.retrievalRecordId) {
    if (candidate.toolName === 'serper' || candidate.toolName === 'web_search') return 'web_search';
    return 'research_tool';
  }
  return 'unknown';
}
