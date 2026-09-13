// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Evidence Retriever v2
// Retrieves safe structured artifact blocks, questions, and
// evidence by blockId, questionId, topic, section, or page.
// Excludes answer keys, teacher notes, and blocked content
// in learner mode.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningContext,
  ArtifactReferenceResolution,
  ArtifactReasoningEvidence,
  ArtifactEvidenceRetrievalResult,
  ArtifactReasoningIntent,
} from './artifactReasoningContracts';
import { artifactSafetyGuardService } from './artifactSafetyGuardService';

const MAX_EVIDENCE_ITEMS = 8;

export class ArtifactEvidenceRetriever {
  /**
   * Retrieve safe artifact evidence from context.
   */
  retrieve(
    context: ArtifactReasoningContext,
    reference: ArtifactReferenceResolution,
    _intent: ArtifactReasoningIntent,
  ): ArtifactEvidenceRetrievalResult {
    const selected: ArtifactReasoningEvidence[] = [];
    const excluded: Array<{ evidence: ArtifactReasoningEvidence; reason: string }> = [];
    const warnings: string[] = [];

    let totalBlocksScanned = 0;
    let totalQuestionsScanned = 0;
    let answerKeyBlocksExcluded = 0;
    let teacherNoteBlocksExcluded = 0;
    let blockedBlocksExcluded = 0;

    // If reference resolved to a specific block
    if (reference.resolved && reference.blockId) {
      const block = context.blocks.find((b) => b.id === reference.blockId);
      if (block) {
        totalBlocksScanned++;
        const evidence = this._blockToEvidence(block);
        selected.push(evidence);
      }
    }

    // If reference resolved to a specific question
    if (reference.resolved && reference.questionId) {
      const question = context.questions.find((q) => q.questionId === reference.questionId);
      if (question) {
        totalQuestionsScanned++;
        const evidence = this._questionToEvidence(question, context.artifactId!);
        // Only add if not already added via block
        if (!selected.some((e) => e.questionId === question.questionId)) {
          selected.push(evidence);
        }
      }
    }

    // If reference resolved to a section, find questions in that section
    if (reference.resolved && reference.blockType === 'section' && reference.blockId) {
      const sectionBlock = context.blocks.find((b) => b.id === reference.blockId);
      if (sectionBlock) {
        const sectionPath = sectionBlock.text;
        const sectionQuestions = context.questions.filter(
          (q) => q.questionText.includes(sectionPath) || context.blocks.some(
            (b) => b.id === q.parentBlockId && b.sectionPath.some((s) => s.includes(sectionPath)),
          ),
        );
        for (const q of sectionQuestions.slice(0, 5)) {
          totalQuestionsScanned++;
          selected.push(this._questionToEvidence(q, context.artifactId!));
        }
      }
    }

    // If nothing resolved, use context questions as evidence
    if (selected.length === 0) {
      // Check for answer keys, teacher notes, and blocked content
      for (const block of context.blocks) {
        totalBlocksScanned++;

        // Exclude answer key blocks
        if (block.blockType === 'answer_key') {
          const evidence = this._blockToEvidence(block);
          excluded.push({ evidence, reason: 'answer_key_blocked' });
          answerKeyBlocksExcluded++;
          continue;
        }

        // Exclude teacher notes
        if (block.blockType === 'teacher_note' || block.visibility === 'teacher_visible' || block.blockType === 'instruction') {
          const evidence = this._blockToEvidence(block);
          excluded.push({ evidence, reason: 'teacher_note_blocked' });
          teacherNoteBlocksExcluded++;
          continue;
        }

        // Exclude blocked content
        if (block.visibility === 'blocked' || block.blockType === ('answer_key' as typeof block.blockType) || block.safetyFlags.some((f) => f.includes('prompt_injection') || f.includes('blocked'))) {
          const evidence = this._blockToEvidence(block);
          excluded.push({ evidence, reason: 'blocked_or_unsafe' });
          blockedBlocksExcluded++;
          continue;
        }
      }

      // Use learner-visible questions as evidence
      for (const question of context.questions.slice(0, MAX_EVIDENCE_ITEMS)) {
        totalQuestionsScanned++;
        selected.push(this._questionToEvidence(question, context.artifactId!));
      }
    }

    // Bound selected evidence
    const boundedSelected = selected.slice(0, MAX_EVIDENCE_ITEMS);

    if (answerKeyBlocksExcluded > 0) {
      warnings.push(`${answerKeyBlocksExcluded} answer key block(s) excluded from learner evidence.`);
    }
    if (teacherNoteBlocksExcluded > 0) {
      warnings.push(`${teacherNoteBlocksExcluded} teacher note block(s) excluded from learner evidence.`);
    }
    if (blockedBlocksExcluded > 0) {
      warnings.push(`${blockedBlocksExcluded} blocked/unsafe block(s) excluded from learner evidence.`);
    }

    return {
      selectedEvidence: boundedSelected,
      excludedEvidence: excluded,
      totalBlocksScanned,
      totalQuestionsScanned,
      answerKeyBlocksExcluded,
      teacherNoteBlocksExcluded,
      blockedBlocksExcluded,
      warnings,
    };
  }

  private _blockToEvidence(block: ArtifactReasoningContext['blocks'][0]): ArtifactReasoningEvidence {
    const sanitized = artifactSafetyGuardService.sanitizeArtifactBlockForTutor(block as any);
    return {
      artifactId: block.artifactId,
      blockId: block.id,
      questionId: null,
      blockType: sanitized.blockType,
      visibility: sanitized.visibility,
      safeText: sanitized.safeText || sanitized.text.slice(0, 500),
      safeQuestionText: null,
      topic: sanitized.topic || null,
      skillId: sanitized.skillId || null,
      skillLabel: sanitized.skillLabel || null,
      difficulty: sanitized.difficulty || null,
      locationLabel: sanitized.locationLabel || null,
      pageNumber: sanitized.pageNumber || null,
      sectionPath: sanitized.sectionPath,
      confidence: sanitized.confidence,
      sourceTrustStatus: sanitized.provenance?.confidence || 'unknown',
      safetyFlags: sanitized.safetyFlags,
      provenance: sanitized.provenance as unknown as Record<string, unknown>,
    };
  }

  private _questionToEvidence(
    question: ArtifactReasoningContext['questions'][0],
    artifactId: string,
  ): ArtifactReasoningEvidence {
    const sanitized = artifactSafetyGuardService.sanitizeArtifactQuestionForLearner(question as any);
    return {
      artifactId,
      blockId: question.parentBlockId || null,
      questionId: question.questionId,
      blockType: 'question',
      visibility: 'learner_visible',
      safeText: sanitized.safeQuestionText || sanitized.questionText.slice(0, 500),
      safeQuestionText: sanitized.safeQuestionText || sanitized.questionText.slice(0, 500),
      topic: sanitized.topic || null,
      skillId: sanitized.skillId || null,
      skillLabel: sanitized.skillLabel || null,
      difficulty: sanitized.difficulty || null,
      locationLabel: question.questionNumber ? `Question ${question.questionNumber}` : question.location || null,
      pageNumber: null,
      sectionPath: [],
      confidence: sanitized.confidence,
      sourceTrustStatus: 'trusted_uploaded',
      safetyFlags: [],
      provenance: {},
    };
  }
}

export const artifactEvidenceRetriever = new ArtifactEvidenceRetriever();
