// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Seal Service v1
// Orchestrates the full source trust seal pipeline:
//   candidates → classify → validate → apply citation policy
//   → apply fallback policy → build metadata → write event
// ─────────────────────────────────────────────────────────────

import type {
  ResearchSourceCandidate,
  ResearchSourceTrustPacket,
  ResearchSourceResponseMetadata,
  ResearchSourceSealInput,
  ResearchSourceSealOutput,
  ResearchSourceViolation,
  ResearchTrustedSource,
} from './researchSourceTrustContracts';
import { classifyResearchSources, groupClassifiedSources } from './researchSourceTrustValidation';
import { sanitizeResearchSourcePacket, assertResearchSourcesSafe } from './researchSourceSafetyService';
import { researchCitationPolicyService } from './researchCitationPolicyService';
import { researchFallbackPolicyService } from './researchFallbackPolicyService';
import { buildResearchSourceResponseMetadata, buildEmptySourceMetadata } from './researchSourceMetadataService';
import { buildResearchSourceEvent, writeResearchSourceEvent } from './researchSourceEventService';

function nowISO(): string {
  return new Date().toISOString();
}

function generatePacketId(): string {
  return `spt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Run the complete source trust seal pipeline.
 */
export function sealResearchSources(input: ResearchSourceSealInput): ResearchSourceSealOutput {
  const now = nowISO();
  const violations: ResearchSourceViolation[] = [];

  // 1. Classify all source candidates
  const classifiedSources = classifyResearchSources(input.candidates || []);

  // 2. Apply existing trusted sources if provided
  const allSources = [
    ...classifiedSources,
    ...(input.existingTrustedSources || []),
  ];

  // 3. Group by kind
  const { verifiedWeb, internalReferences, unverified, blocked: blockedFromClassification } =
    groupClassifiedSources(allSources);

  // 4. Build the source trust packet
  const usage = {
    sourceCount: allSources.length,
    verifiedWebCount: verifiedWeb.length,
    internalReferenceCount: internalReferences.length,
    unverifiedCount: unverified.length,
    blockedCount: blockedFromClassification.length,
    citationDisplayCount: 0, // Will be updated after citation policy
  };

  const packet: ResearchSourceTrustPacket = {
    packetId: generatePacketId(),
    noCache: true,
    sources: allSources,
    verifiedWebSources: verifiedWeb,
    internalReferences,
    unverifiedReferences: unverified,
    blockedSources: blockedFromClassification,
    missingSourceReason: null,
    usage,
    safety: {
      fabricatedUrlsBlocked: true,
      fallbackUrlsBlocked: true,
      modelGeneratedUrlsBlocked: true,
      promptInjectionBlocked: false, // Will be updated after safety check
      rawContentRedacted: false, // Will be updated after safety check
      warnings: [],
    },
    createdAt: now,
  };

  // 5. Sanitize — redact unsafe content, block prompt injection
  const sanitizedPacket = sanitizeResearchSourcePacket(packet);

  // 6. Assert safety
  const safetyAssertion = assertResearchSourcesSafe(sanitizedPacket);
  if (safetyAssertion.violations.length > 0) {
    violations.push(...safetyAssertion.violations);
  }

  // 7. Apply citation policy
  const citationResult = researchCitationPolicyService.applyCitationPolicy(
    sanitizedPacket.sources,
  );

  // Update citation display count
  sanitizedPacket.usage.citationDisplayCount = citationResult.allowedCitations.length;

  // 8. Apply fallback policy
  const fallbackResult = researchFallbackPolicyService.evaluateSources(
    sanitizedPacket.sources,
  );

  if (fallbackResult.missingSourceReason) {
    sanitizedPacket.missingSourceReason = fallbackResult.missingSourceReason;
  }

  // 9. Build response metadata
  const metadata = buildResearchSourceResponseMetadata(
    sanitizedPacket,
    citationResult,
    fallbackResult,
  );

  // 10. Write bounded event (non-blocking)
  try {
    const event = buildResearchSourceEvent(sanitizedPacket);
    writeResearchSourceEvent(event);
  } catch {
    // Non-blocking
  }

  return {
    ok: violations.filter((v) => v.severity === 'error').length === 0,
    packet: sanitizedPacket,
    metadata,
    violations,
  };
}

/**
 * Quick seal for a single source candidate.
 */
export function sealSingleSource(
  candidate: ResearchSourceCandidate,
): {
  source: ResearchTrustedSource;
  packet: ResearchSourceTrustPacket;
  metadata: ResearchSourceResponseMetadata;
} {
  const output = sealResearchSources({
    candidates: [candidate],
    authenticatedSchoolId: 'self',
  });
  return {
    source: output.packet.sources[0],
    packet: output.packet,
    metadata: output.metadata,
  };
}

/**
 * Build a prompt block from a source trust packet for the ChatPromptAssembler.
 */
export function buildSourcePromptBlock(
  metadata: ResearchSourceResponseMetadata,
): string {
  if (!metadata.hasVerifiedSources && !metadata.missingSourceReason) {
    return researchFallbackPolicyService.buildNoSourcePromptInstruction();
  }

  const lines: string[] = [];

  // Verified web sources
  if (metadata.verifiedWebCount > 0) {
    lines.push('VERIFIED WEB SOURCES:');
    for (const source of metadata.displaySources.filter(
      (s) => s.kind === 'verified_web',
    )) {
      const urlPart = source.url ? ` — ${source.url}` : '';
      lines.push(`  - ${source.title || 'Verified source'}${urlPart}`);
    }
    lines.push('');
  }

  // Internal references
  if (metadata.internalReferenceCount > 0) {
    lines.push('INTERNAL REFERENCES (from study materials/video context):');
    for (const source of metadata.displaySources.filter(
      (s) => s.kind === 'verified_internal_artifact' || s.kind === 'verified_video_context',
    )) {
      lines.push(`  - ${source.title || 'Internal reference'} (${source.kind === 'verified_internal_artifact' ? 'from study material' : 'from video context'})`);
    }
    lines.push('');
  }

  // Citation policy instruction
  if (metadata.verifiedWebCount > 0) {
    lines.push('CITATION POLICY:');
    lines.push('- Only cite sources from the VERIFIED WEB SOURCES list above.');
    lines.push('- Do NOT invent any URLs, citations, or references.');
    lines.push('- Internal references must NOT be presented as web citations.');
  } else if (metadata.internalReferenceCount > 0) {
    lines.push('CITATION POLICY:');
    lines.push('- No verified web sources are available.');
    lines.push('- Internal references are from the learner\'s study materials or video context.');
    lines.push('- Do NOT present internal references as external web citations.');
  } else {
    lines.push(researchFallbackPolicyService.buildNoSourcePromptInstruction());
  }

  if (metadata.missingSourceReason === 'no_verified_sources') {
    lines.push('');
    lines.push('NOTE: If the user asks for sources, state honestly that no verified sources are available.');
  }

  return lines.join('\n');
}
