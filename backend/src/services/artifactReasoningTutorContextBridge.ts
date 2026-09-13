// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Reasoning Tutor Context Bridge v2
// Adds artifact reasoning context (summary, intent, evidence
// refs, warnings, action hint, grounding status) to
// TutorTurnContext for live chat and AI generation.
// ─────────────────────────────────────────────────────────────

import type { ArtifactReasoningResult } from './artifactReasoningContracts';

export interface ArtifactReasoningTutorContextAttachment {
  summary: string;
  intent: string;
  evidenceRefs: string[];
  warnings: string[];
  actionHint: string;
  groundingStatus: string;
  citationLabels: string[];
}

export class ArtifactReasoningTutorContextBridge {
  /**
   * Build a safe, bounded attachment for TutorTurnContext from the reasoning result.
   */
  buildAttachment(result: ArtifactReasoningResult): ArtifactReasoningTutorContextAttachment {
    const summaryParts: string[] = [
      `Artifact reasoning: ${result.intent} (${result.groundingStatus})`,
    ];

    if (result.selectedEvidence.length > 0) {
      const firstEvidence = result.selectedEvidence[0];
      summaryParts.push(
        `Evidence: ${firstEvidence.locationLabel || firstEvidence.blockType || 'artifact content'}`,
      );
    }

    const evidenceRefs = result.selectedEvidence
      .slice(0, 5)
      .map((e) => {
        const parts: string[] = [];
        if (e.artifactId) parts.push(`artifact:${e.artifactId}`);
        if (e.blockId) parts.push(`block:${e.blockId}`);
        if (e.questionId) parts.push(`question:${e.questionId}`);
        return parts.join('/');
      });

    const citationLabels = result.citations
      .slice(0, 5)
      .map((c) => c.label)
      .filter(Boolean);

    return {
      summary: summaryParts.join('. ').slice(0, 400),
      intent: result.intent,
      evidenceRefs,
      warnings: result.warnings.slice(0, 5),
      actionHint: result.tutorActionHint.slice(0, 300),
      groundingStatus: result.groundingStatus,
      citationLabels,
    };
  }
}

export const artifactReasoningTutorContextBridge = new ArtifactReasoningTutorContextBridge();
