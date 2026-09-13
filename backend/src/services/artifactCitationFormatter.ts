// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Citation Formatter v2
// Formats honest artifact references using known location data
// only. Does not fabricate pages, URLs, or question numbers.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningEvidence,
  ArtifactReasoningCitation,
} from './artifactReasoningContracts';

export class ArtifactCitationFormatter {
  /**
   * Format citations from evidence using only known provenance.
   */
  format(evidence: ArtifactReasoningEvidence[]): ArtifactReasoningCitation[] {
    const citations: ArtifactReasoningCitation[] = [];

    for (const ev of evidence) {
      if (!ev.safeText || ev.safeText.length < 10) continue;

      const labelParts: string[] = [];
      if (ev.locationLabel) {
        labelParts.push(ev.locationLabel);
      } else if (ev.questionId) {
        labelParts.push(`Question ${ev.questionId.slice(0, 8)}`);
      } else if (ev.blockType) {
        labelParts.push(ev.blockType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }

      // Add page number only if available
      if (ev.pageNumber != null) {
        labelParts.push(`p.${ev.pageNumber}`);
      }

      const label = labelParts.length > 0
        ? labelParts.join(' — ')
        : 'Artifact content';

      citations.push({
        artifactId: ev.artifactId,
        blockId: ev.blockId || null,
        questionId: ev.questionId || null,
        label,
        location: ev.locationLabel || null,
        evidence: ev.safeText.slice(0, 200),
      });
    }

    return citations;
  }

  /**
   * Format a single citation string for display.
   */
  formatCitationText(citation: ArtifactReasoningCitation): string {
    const parts: string[] = [];

    if (citation.label) {
      parts.push(`[${citation.label}]`);
    }

    if (citation.evidence) {
      parts.push(citation.evidence);
    }

    return parts.join(' ');
  }
}

export const artifactCitationFormatter = new ArtifactCitationFormatter();
