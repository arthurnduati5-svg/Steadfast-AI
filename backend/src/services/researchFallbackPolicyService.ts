// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Fallback Policy Service v1
// Ensures no-source responses are honest. No invented URLs,
// no fake citations, no fallback theater.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchTrustedSource,
  ResearchSourceKind,
  ResearchSourceResponseMetadata,
} from './researchSourceTrustContracts';

export interface ResearchFallbackPolicyResult {
  hasVerifiedSources: boolean;
  sourceChipsAllowed: boolean;
  honestMessage: string | null;
  missingSourceReason: string | null;
  displaySources: ResearchTrustedSource[];
  warnings: string[];
}

/**
 * Fallback policy service.
 * Prevents invented URLs when no verified sources exist.
 */
export class ResearchFallbackPolicyService {
  /**
   * Evaluate whether sources are sufficient for citation display.
   * If not, returns an honest message instead of invented sources.
   */
  evaluateSources(sources: ResearchTrustedSource[]): ResearchFallbackPolicyResult {
    const warnings: string[] = [];

    // Filter to only sources that passed citation policy
    const verifiedWebSources = sources.filter(
      (s) =>
        s.kind === 'verified_web' &&
        s.trustStatus === 'verified' &&
        s.url &&
        s.evidence.length > 0,
    );

    const internalReferences = sources.filter(
      (s) =>
        s.kind === 'verified_internal_artifact' || s.kind === 'verified_video_context',
    );

    const hasVerifiedSources = verifiedWebSources.length > 0;
    const hasInternalReferences = internalReferences.length > 0;

    let missingSourceReason: string | null = null;
    let honestMessage: string | null = null;

    if (!hasVerifiedSources && !hasInternalReferences) {
      missingSourceReason = 'no_verified_sources';
      honestMessage = 'I do not have verified web sources for this response. The information shared is based on general knowledge and tutoring context.';
      warnings.push('No verified sources available — returned honest no-source message.');
    } else if (!hasVerifiedSources && hasInternalReferences) {
      missingSourceReason = 'internal_references_only';
      honestMessage = 'I do not have verified web sources for this response, but I do have relevant context from your study materials.';
      warnings.push('No verified web sources — using internal references only.');
    }

    const displaySources = hasVerifiedSources
      ? verifiedWebSources
      : hasInternalReferences
        ? internalReferences
        : [];

    return {
      hasVerifiedSources,
      sourceChipsAllowed: hasVerifiedSources,
      honestMessage,
      missingSourceReason,
      displaySources,
      warnings,
    };
  }

  /**
   * Build prompt instructions for the AI when no sources exist.
   */
  buildNoSourcePromptInstruction(): string {
    return [
      'SOURCE POLICY:',
      '- No verified sources are available for this response.',
      '- Do NOT invent or fabricate any URLs, citations, or source references.',
      '- If the user asks for sources, honestly state that no verified sources were found.',
      '- Continue teaching from general knowledge and available context only.',
      '- Do NOT use phrases like "according to sources" or "research shows" unless you have verified sources.',
    ].join('\n');
  }

  /**
   * Check if the model's output claims sources when none exist.
   * This is a post-generation check.
   */
  checkOutputForFakeSources(
    answerText: string,
    hasVerifiedSources: boolean,
  ): string[] {
    if (hasVerifiedSources) return [];
    const fakeSourcePatterns = [
      /according\s+to\s+(\w+\s+)?(sources?|research|studies?|experts?)/i,
      /(research|studies?)\s+(shows?|suggests?|indicates?|finds?|demonstrates?)/i,
      /as\s+reported\s+by/i,
      /sources?\s+(suggest|indicate|show|confirm|reveal)/i,
      /based\s+on\s+(our\s+)?(research|sources?|findings?)/i,
      /https?:\/\/[^\s"')]+/i,
    ];

    const violations: string[] = [];
    for (const pattern of fakeSourcePatterns) {
      const match = answerText.match(pattern);
      if (match) {
        violations.push(`Fake source claim detected: "${match[0]}"`);
      }
    }

    // Check for specific URLs that weren't in verified sources
    const urlPattern = /https?:\/\/[^\s"')]+/gi;
    const urlMatches = answerText.match(urlPattern);
    if (urlMatches) {
      for (const url of urlMatches) {
        if (/example\.com/i.test(url)) {
          violations.push(`Fake URL detected: ${url}`);
        }
      }
    }

    return violations;
  }

  /**
   * Ensure no URLs appear in answer text when no verified sources exist.
   */
  stripFakeUrlsFromAnswer(
    answerText: string,
    hasVerifiedSources: boolean,
  ): string {
    if (hasVerifiedSources) return answerText;
    return answerText.replace(/https?:\/\/[^\s"')]+/gi, '');
  }
}

export const researchFallbackPolicyService = new ResearchFallbackPolicyService();
