// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Citation Policy Service v1
// Final seal: enforces that only verified web sources become
// citation chips. Internal references are labeled. Model-generated
// and blocked sources are hidden.
// ─────────────────────────────────────────────────────────────

import type {
  ResearchTrustedSource,
  ResearchSourceKind,
  ResearchCitationDisplayPolicy,
} from './researchSourceTrustContracts';

/**
 * Result of citation policy enforcement.
 */
export interface ResearchCitationPolicyResult {
  allowedCitations: ResearchTrustedSource[];
  internalReferences: ResearchTrustedSource[];
  hiddenSources: ResearchTrustedSource[];
  sourceChipsAllowed: boolean;
  warnings: string[];
  message?: string | null;
}

/**
 * Citation policy final seal service.
 * Only verified_web sources with retrieval evidence become citation chips.
 */
export class ResearchCitationPolicyService {
  /**
   * Apply the citation policy to a list of classified sources.
   * Returns only sources that pass the citation gate.
   */
  applyCitationPolicy(sources: ResearchTrustedSource[]): ResearchCitationPolicyResult {
    const allowedCitations: ResearchTrustedSource[] = [];
    const internalReferences: ResearchTrustedSource[] = [];
    const hiddenSources: ResearchTrustedSource[] = [];
    const warnings: string[] = [];

    for (const source of sources) {
      switch (source.displayPolicy) {
        case 'show_as_verified_citation':
          // Only verified_web with evidence may become a citation chip
          if (
            source.kind === 'verified_web' &&
            source.trustStatus === 'verified' &&
            source.evidence.length > 0 &&
            source.url
          ) {
            allowedCitations.push(source);
          } else {
            // Downgrade — conditions not fully met
            internalReferences.push(source);
            warnings.push(
              `Source ${source.sourceId} was expected to be a verified citation but lacks evidence — downgraded to internal reference.`,
            );
          }
          break;

        case 'show_as_internal_reference':
          // Internal artifact/video references — labeled as internal, not citations
          if (
            source.kind === 'verified_internal_artifact' ||
            source.kind === 'verified_video_context'
          ) {
            internalReferences.push(source);
          } else {
            hiddenSources.push(source);
            warnings.push(
              `Source ${source.sourceId} marked as internal reference but kind is ${source.kind} — hidden.`,
            );
          }
          break;

        case 'show_as_context_note':
          // Unverified references — can be shown as context note but NOT as citation chip
          internalReferences.push(source);
          break;

        case 'hide':
          hiddenSources.push(source);
          break;

        case 'block_response':
          hiddenSources.push(source);
          warnings.push(
            `Source ${source.sourceId} triggered block_response policy — hidden.`,
          );
          break;

        default:
          hiddenSources.push(source);
      }
    }

    const sourceChipsAllowed = allowedCitations.length > 0;

    const message = !sourceChipsAllowed && sources.length > 0
      ? 'No verified web sources available for citation display.'
      : null;

    if (!sourceChipsAllowed && sources.length > 0) {
      warnings.push('No sources passed the citation gate for display as verified citations.');
    }

    return {
      allowedCitations,
      internalReferences,
      hiddenSources,
      sourceChipsAllowed,
      warnings,
      message,
    };
  }

  /**
   * Check whether a specific source can be displayed as a citation chip.
   */
  canDisplayAsCitation(source: ResearchTrustedSource): boolean {
    return (
      source.displayPolicy === 'show_as_verified_citation' &&
      source.kind === 'verified_web' &&
      source.trustStatus === 'verified' &&
      source.evidence.length > 0 &&
      !!source.url
    );
  }

  /**
   * Get the policy-appropriate label for a source.
   */
  getSourceLabel(source: ResearchTrustedSource): string {
    switch (source.kind) {
      case 'verified_web':
        return 'Verified source';
      case 'verified_internal_artifact':
        return 'From your study material';
      case 'verified_video_context':
        return 'From video context';
      case 'unverified_reference':
        return 'Reference';
      case 'model_generated':
        return 'AI-generated reference';
      case 'blocked':
        return 'Blocked';
      case 'missing':
        return 'No source';
      default:
        return 'Source';
    }
  }

  /**
   * Build a citation prompt instruction for the AI.
   * This tells the model which sources are verified and available.
   */
  buildCitationPromptInstruction(
    allowedCitations: ResearchTrustedSource[],
    hasInternalReferences: boolean,
  ): string {
    if (allowedCitations.length === 0) {
      return [
        'CITATION POLICY:',
        '- No verified web sources are available for this response.',
        '- Do NOT invent or fabricate any URLs, citations, or source references.',
        '- If the user asks for sources, state that no verified sources are available for this topic.',
        '- Internal reference context may be available but must not be presented as a web citation.',
      ].join('\n');
    }

    const citationList = allowedCitations
      .map(
        (s, i) =>
          `  ${i + 1}. ${s.title || 'Verified source'}${s.url ? ` — ${s.url}` : ''}`,
      )
      .join('\n');

    return [
      'CITATION POLICY:',
      '- Only cite sources from the verified list below.',
      '- Do NOT invent any URLs, citations, or source references not in this list.',
      '- Internal reference context must not be presented as a web citation.',
      '',
      'VERIFIED SOURCES AVAILABLE:',
      citationList,
    ].join('\n');
  }
}

export const researchCitationPolicyService = new ResearchCitationPolicyService();
