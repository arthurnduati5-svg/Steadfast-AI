// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Metadata Service v1
// Builds frontend-safe response metadata from source trust packet.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchSourceTrustPacket,
  ResearchTrustedSource,
  ResearchSourceResponseMetadata,
  ResearchCitationDisplayPolicy,
} from './researchSourceTrustContracts';
import type { ResearchCitationPolicyResult } from './researchCitationPolicyService';
import type { ResearchFallbackPolicyResult } from './researchFallbackPolicyService';

/**
 * Build frontend-safe response metadata from a source trust packet
 * and citation/fallback policy results.
 */
export function buildResearchSourceResponseMetadata(
  packet: ResearchSourceTrustPacket,
  citationResult: ResearchCitationPolicyResult,
  fallbackResult: ResearchFallbackPolicyResult,
): ResearchSourceResponseMetadata {
  // Build display sources — only sources that should be shown
  const displaySources: ResearchTrustedSource[] = [
    ...citationResult.allowedCitations,
    ...citationResult.internalReferences,
  ];

  // Count blocked sources
  const blockedCount =
    citationResult.hiddenSources.length + packet.blockedSources.length;

  return {
    hasVerifiedSources: fallbackResult.hasVerifiedSources,
    sourceCount: packet.sources.length,
    verifiedWebCount: packet.usage.verifiedWebCount,
    internalReferenceCount: packet.usage.internalReferenceCount,
    blockedCount,
    displaySources,
    missingSourceReason: fallbackResult.missingSourceReason,
    warnings: [
      ...packet.safety.warnings,
      ...citationResult.warnings,
      ...fallbackResult.warnings,
    ],
  };
}

/**
 * Build a simplified metadata for cases where no packet exists (no sources).
 */
export function buildEmptySourceMetadata(): ResearchSourceResponseMetadata {
  return {
    hasVerifiedSources: false,
    sourceCount: 0,
    verifiedWebCount: 0,
    internalReferenceCount: 0,
    blockedCount: 0,
    displaySources: [],
    missingSourceReason: 'no_verified_sources',
    warnings: [],
  };
}
