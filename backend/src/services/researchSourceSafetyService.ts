// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Safety Service v1
// Redacts raw/unsafe content from sources. Blocks prompt injection.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchTrustedSource,
  ResearchSourceTrustPacket,
  ResearchSourceViolation,
  ResearchSourceKind,
} from './researchSourceTrustContracts';

const MAX_SNIPPET_LENGTH = 500;
const MAX_TITLE_LENGTH = 240;
const MAX_SAFE_SUMMARY_LENGTH = 800;

function safeString(value: unknown, maxLength?: number): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!maxLength) return s;
  return s.length <= maxLength ? s : s.slice(0, maxLength - 3).trimEnd() + '...';
}

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
    /<script[\s>]/i,
    /javascript\s*:/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
  ];
  return injectionPatterns.some((p) => p.test(cleaned));
}

/**
 * Detect raw content patterns that should be redacted.
 */
function hasRawContent(text: string | null | undefined): boolean {
  const cleaned = safeString(text);
  if (!cleaned) return false;
  const rawPatterns = [
    /^Answer\s+Key:/i,
    /^Marking\s+Scheme:/i,
    /^Rubric:/i,
    /^Confidential:/i,
    /^Internal\s+Only:/i,
    /^NOT\s+FOR\s+STUDENT/i,
    /^Teacher\s+Only:/i,
    /^Solutions?\s+Manual/i,
    /^Instructor\s+Guide:/i,
  ];
  return rawPatterns.some((p) => p.test(cleaned));
}

/**
 * Sanitize a single research source by redacting unsafe content.
 */
export function sanitizeResearchSource(
  source: ResearchTrustedSource,
): ResearchTrustedSource {
  let snippet = source.snippet || null;
  let title = source.title || 'Untitled Source';
  let safeSummary = source.safeSummary || null;
  const warnings = [...source.warnings];
  const blockReasons = [...source.blockReasons];

  // Sanitize title
  if (title && title !== 'Untitled Source') {
    if (hasRawContent(title)) {
      title = '[Redacted: source title contained raw content]';
      warnings.push('Title redacted — contained raw/confidential content');
    }
    if (hasPromptInjection(title)) {
      title = '[Redacted: source title contained prompt injection attempt]';
      warnings.push('Title redacted — potential prompt injection detected');
      if (!blockReasons.includes('prompt_injection')) {
        blockReasons.push('prompt_injection');
      }
    }
    title = safeString(title, MAX_TITLE_LENGTH);
  }

  // Sanitize snippet
  if (snippet) {
    if (hasRawContent(snippet)) {
      snippet = '[Redacted: source snippet contained raw/confidential content]';
      warnings.push('Snippet redacted — contained raw/confidential content');
    }
    if (hasPromptInjection(snippet)) {
      snippet = '[Redacted: source snippet contained prompt injection attempt]';
      warnings.push('Snippet redacted — potential prompt injection detected');
      if (!blockReasons.includes('prompt_injection')) {
        blockReasons.push('prompt_injection');
      }
    }
    snippet = safeString(snippet, MAX_SNIPPET_LENGTH);
  }

  // Sanitize safe summary
  if (safeSummary) {
    if (hasRawContent(safeSummary)) {
      safeSummary = '[Redacted: summary contained raw content]';
      warnings.push('Safe summary redacted — contained raw/confidential content');
    }
    safeSummary = safeString(safeSummary, MAX_SAFE_SUMMARY_LENGTH);
  }

  // Determine if trust status should be downgraded
  const hasRedactedContent =
    snippet?.startsWith('[Redacted:') || false;
  const hasPromptInjectionDetected = blockReasons.includes('prompt_injection');

  let trustStatus = source.trustStatus;
  let displayPolicy = source.displayPolicy;
  let kind = source.kind;

  if (hasPromptInjectionDetected && trustStatus === 'verified') {
    trustStatus = 'blocked';
    displayPolicy = 'hide';
    warnings.push('Source downgraded due to prompt injection');
  }

  if (hasRedactedContent && trustStatus === 'verified') {
    trustStatus = 'redacted';
    warnings.push('Source marked as redacted — some content was unsafe');
  }

  // Ensure safe snippet — never include raw text
  const safeSnippet =
    snippet && !snippet.startsWith('[Redacted:')
      ? snippet.slice(0, MAX_SNIPPET_LENGTH)
      : snippet;

  return {
    ...source,
    title,
    snippet: safeSnippet,
    safeSummary,
    trustStatus,
    displayPolicy,
    kind,
    blockReasons,
    warnings,
  };
}

/**
 * Sanitize an entire research source trust packet.
 */
export function sanitizeResearchSourcePacket(
  packet: ResearchSourceTrustPacket,
): ResearchSourceTrustPacket {
  const sanitizedSources = packet.sources.map(sanitizeResearchSource);
  const sanitizedVerifiedWeb = packet.verifiedWebSources.map(sanitizeResearchSource);
  const sanitizedInternal = packet.internalReferences.map(sanitizeResearchSource);
  const sanitizedUnverified = packet.unverifiedReferences.map(sanitizeResearchSource);
  const sanitizedBlocked = packet.blockedSources.map(sanitizeResearchSource);

  const allWarnings = [
    ...packet.safety.warnings,
    ...sanitizedSources.flatMap((s) => s.warnings),
  ];

  // Check if any prompt injection was caught
  const promptInjectionBlocked = allWarnings.some((w) =>
    w.toLowerCase().includes('prompt injection'),
  );

  // Check if any raw content was redacted
  const rawContentRedacted = allWarnings.some((w) =>
    w.toLowerCase().includes('raw') || w.toLowerCase().includes('redacted'),
  );

  return {
    ...packet,
    sources: sanitizedSources,
    verifiedWebSources: sanitizedVerifiedWeb,
    internalReferences: sanitizedInternal,
    unverifiedReferences: sanitizedUnverified,
    blockedSources: sanitizedBlocked,
    safety: {
      ...packet.safety,
      promptInjectionBlocked: packet.safety.promptInjectionBlocked || promptInjectionBlocked,
      rawContentRedacted: packet.safety.rawContentRedacted || rawContentRedacted,
      warnings: allWarnings,
    },
  };
}

/**
 * Assert that a source packet is safe to pass to the AI and frontend.
 */
export function assertResearchSourcesSafe(
  packet: ResearchSourceTrustPacket,
): { ok: boolean; violations: ResearchSourceViolation[] } {
  const violations: ResearchSourceViolation[] = [];

  for (const source of packet.sources) {
    // Check for unsafe display policies
    if (source.displayPolicy === 'block_response') {
      violations.push({
        code: 'blocked_source_in_packet',
        sourceId: source.sourceId,
        kind: source.kind,
        message: `Source ${source.sourceId} has block_response display policy but is still in source list.`,
        severity: 'error',
      });
    }

    // Check for raw content patterns that might have slipped through
    if (source.snippet && hasRawContent(source.snippet)) {
      violations.push({
        code: 'raw_content_in_snippet',
        sourceId: source.sourceId,
        message: 'Source snippet appears to contain raw/confidential content.',
        severity: 'error',
      });
    }

    // Check snippet length
    if (source.snippet && source.snippet.length > MAX_SNIPPET_LENGTH + 100) {
      violations.push({
        code: 'snippet_too_long',
        sourceId: source.sourceId,
        message: `Source snippet exceeds max length (${source.snippet.length} > ${MAX_SNIPPET_LENGTH}).`,
        severity: 'warning',
      });
    }
  }

  return {
    ok: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
  };
}
