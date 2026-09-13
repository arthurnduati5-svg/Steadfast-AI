// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Safe Summary Service v1
// Builds bounded safe artifact summaries and safe block
// references for prompts. Excludes answer keys, raw text.
// ─────────────────────────────────────────────────────────────

import type {
  StructuredArtifactRecord,
  ArtifactStructuredBlock,
  ArtifactQuestionBlock,
  ArtifactTopicSkillMapping,
  ArtifactSafeView,
  ArtifactExtractionConfidence,
  ArtifactSourceTrustStatus,
  ArtifactParseStatus,
} from './artifactUnderstandingContracts';

const MAX_SUMMARY_LENGTH = 1600;
const MAX_TOPIC_MAPPINGS = 8;
const MAX_SECTION_NAMES = 10;
const MAX_QUESTION_PREVIEWS = 5;
const MAX_WARNINGS = 10;
const MAX_STRING_LENGTH = 240;

export class ArtifactSafeSummaryService {
  /**
   * Build a safe artifact summary from structured blocks.
   */
  buildSafeSummary(
    artifact: StructuredArtifactRecord,
    blocks: ArtifactStructuredBlock[],
    questions: ArtifactQuestionBlock[],
    topicMappings: ArtifactTopicSkillMapping[],
  ): ArtifactSafeView {
    const warnings: string[] = [];
    const learnerVisibleBlocks = blocks.filter((b) =>
      b.visibility === 'learner_visible' || b.visibility === 'teacher_visible',
    );
    const learnerVisibleQuestions = questions.filter((q) => q.learnerCanSeeAnswer);

    // Build summary parts
    const summaryParts: string[] = [];

    // Title
    if (artifact.fileName) {
      summaryParts.push(`File: ${artifact.fileName.slice(0, MAX_STRING_LENGTH)}`);
    }

    // Parse status
    summaryParts.push(`Status: ${this._formatParseStatus(artifact.parseStatus)}`);

    // Block summary
    const mainBlockTypes = ['section', 'heading', 'paragraph', 'question', 'worked_example', 'definition', 'theorem'];
    const visibleMainBlocks = learnerVisibleBlocks.filter((b) => mainBlockTypes.includes(b.blockType));
    if (visibleMainBlocks.length > 0) {
      const typeCounts = this._countBlockTypes(visibleMainBlocks);
      const typeSummary = Object.entries(typeCounts)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `${count} ${type}(s)`)
        .join(', ');
      summaryParts.push(`Contains: ${typeSummary}`);
    }

    // Question count
    if (learnerVisibleQuestions.length > 0) {
      summaryParts.push(`${learnerVisibleQuestions.length} learner-visible question(s)`);
    }

    // Topic mappings
    if (topicMappings.length > 0) {
      const topics = [...new Set(topicMappings.map((m) => m.topic))].filter((t) => t !== 'unknown' && t !== 'unmapped');
      if (topics.length > 0) {
        summaryParts.push(`Topics: ${topics.slice(0, MAX_TOPIC_MAPPINGS).join(', ')}`);
      }
    }

    // Section names
    const sectionNames = [...new Set(blocks
      .filter((b) => b.blockType === 'section' || b.blockType === 'heading')
      .map((b) => b.text.replace(/^#{1,6}\s+/, '').trim())
      .filter(Boolean),
    )];
    if (sectionNames.length > 0) {
      summaryParts.push(`Sections: ${sectionNames.slice(0, MAX_SECTION_NAMES).join(' | ')}`);
    }

    // Question previews (safe text only)
    if (learnerVisibleQuestions.length > 0) {
      const previews = learnerVisibleQuestions
        .slice(0, MAX_QUESTION_PREVIEWS)
        .map((q) => {
          const prefix = q.questionNumber ? `Q${q.questionNumber}: ` : '';
          return `${prefix}${q.safeQuestionText.slice(0, MAX_STRING_LENGTH)}`;
        });
      summaryParts.push(`Sample questions:\n${previews.map((p) => `- ${p}`).join('\n')}`);
    }

    // Safety flags
    if (artifact.safetyFlags.length > 0) {
      warnings.push(`Safety flags: ${artifact.safetyFlags.join(', ')}`);
    }

    // Parser warnings
    if (artifact.parserWarnings.length > 0) {
      warnings.push(...artifact.parserWarnings.slice(0, MAX_WARNINGS));
    }

    // Warnings about answer keys
    const answerKeyCount = blocks.filter((b) => b.blockType === 'answer_key').length;
    if (answerKeyCount > 0) {
      summaryParts.push(`${answerKeyCount} answer key section(s) detected (hidden from learner view)`);
    }

    // Default message
    const safeSummary = summaryParts.length > 0
      ? summaryParts.join('. ').slice(0, MAX_SUMMARY_LENGTH)
      : 'Artifact parsed. No structured content detected.';

    // Dedupe warnings
    const uniqueWarnings = [...new Set(warnings)];

    return {
      artifactId: artifact.artifactId,
      title: artifact.fileName || null,
      artifactType: artifact.artifactType,
      parseStatus: artifact.parseStatus,
      sourceTrustStatus: artifact.sourceTrustStatus,
      questionCount: learnerVisibleQuestions.length,
      learnerVisibleBlockCount: learnerVisibleBlocks.length,
      topicMappings: topicMappings.slice(0, MAX_TOPIC_MAPPINGS),
      safeSummary,
      warnings: uniqueWarnings.slice(0, MAX_WARNINGS),
    };
  }

  /**
   * Build safe block references for prompts (without raw text).
   */
  buildSafeBlockRefs(
    blocks: ArtifactStructuredBlock[],
    maxBlocks: number = 6,
  ): Array<{ id: string; type: string; summary: string; location: string | null }> {
    const learnerVisible = blocks.filter((b) => b.visibility === 'learner_visible');
    return learnerVisible.slice(0, maxBlocks).map((b) => ({
      id: b.id,
      type: b.blockType,
      summary: b.safeText.slice(0, 200) || b.text.slice(0, 200),
      location: b.locationLabel || b.pageNumber?.toString() || null,
    }));
  }

  private _formatParseStatus(status: ArtifactParseStatus): string {
    const labels: Record<ArtifactParseStatus, string> = {
      queued: 'Queued for parsing',
      parsing: 'Currently parsing',
      parsed: 'Parsed',
      parsed_with_warnings: 'Parsed with warnings',
      failed: 'Parse failed',
      blocked: 'Blocked (unsafe or unsupported)',
    };
    return labels[status] || status;
  }

  private _countBlockTypes(blocks: ArtifactStructuredBlock[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const block of blocks) {
      const type = block.blockType;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }
}

export const artifactSafeSummaryService = new ArtifactSafeSummaryService();
