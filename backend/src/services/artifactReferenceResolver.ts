// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Reference Resolver v2
// Resolves "question 3", "this section", "that example",
// "the diagram", "the formula", and follow-up references to
// block/question IDs.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningContext,
  ArtifactReferenceResolution,
} from './artifactReasoningContracts';

export class ArtifactReferenceResolver {
  /**
   * Resolve a reference from the learner message or request fields.
   */
  resolve(context: ArtifactReasoningContext, message: string): ArtifactReferenceResolution {
    const trimmed = (message || '').trim().toLowerCase();
    const warnings: string[] = [];

    // 1. Direct questionId provided
    if (context.activeQuestionId) {
      const question = context.questions.find((q) => q.questionId === context.activeQuestionId);
      if (question) {
        return {
          resolved: true,
          blockId: question.parentBlockId || null,
          questionId: question.questionId,
          blockType: 'question',
          locationLabel: question.questionNumber
            ? `Question ${question.questionNumber}`
            : question.location || null,
          pageNumber: null,
          method: 'direct_question_id',
          ambiguityDetected: false,
          notFound: false,
          warnings: [],
        };
      }
    }

    // 2. Direct blockId provided
    if (context.activeBlockId) {
      const block = context.blocks.find((b) => b.id === context.activeBlockId);
      if (block) {
        return {
          resolved: true,
          blockId: block.id,
          questionId: null,
          blockType: block.blockType,
          locationLabel: block.locationLabel || block.sectionPath.join(' > ') || null,
          pageNumber: block.pageNumber || null,
          method: 'direct_block_id',
          ambiguityDetected: false,
          notFound: false,
          warnings: [],
        };
      }
    }

    // 3. Referenced question number (e.g., "question 3", "Q5", "question three")
    const qnPattern = /(?:question|q)\s*[#.]?\s*(\d+)/i;
    const qnMatch = trimmed.match(qnPattern);
    if (qnMatch || context.referencedQuestionNumber) {
      const qNum = qnMatch ? qnMatch[1] : context.referencedQuestionNumber;
      if (qNum) {
        const matched = context.questions.find(
          (q) => q.questionNumber === qNum || q.questionNumber === String(parseInt(qNum, 10)),
        );
        if (matched) {
          return {
            resolved: true,
            blockId: matched.parentBlockId || null,
            questionId: matched.questionId,
            blockType: 'question',
            locationLabel: `Question ${matched.questionNumber}`,
            pageNumber: null,
            method: 'question_number_match',
            ambiguityDetected: false,
            notFound: false,
            warnings: [],
          };
        }

        // Try alternate: leading number like "3. What is..."
        const leadingNumMatch = context.questions.find(
          (q) => q.questionText.trim().startsWith(qNum + '.') || q.questionText.trim().startsWith(qNum + ')'),
        );
        if (leadingNumMatch) {
          return {
            resolved: true,
            blockId: leadingNumMatch.parentBlockId || null,
            questionId: leadingNumMatch.questionId,
            blockType: 'question',
            locationLabel: `Question ${qNum}`,
            pageNumber: null,
            method: 'question_number_match_leading',
            ambiguityDetected: false,
            notFound: false,
            warnings: [],
          };
        }
      }
    }

    // 4. Section reference (e.g., "section 2", "from section 2")
    const sectionPattern = /(?:section|part|chapter)\s+(\d+)/i;
    const sectionMatch = trimmed.match(sectionPattern);
    if (sectionMatch || context.referencedSection) {
      const sectionLabel = sectionMatch ? sectionMatch[0] : context.referencedSection;
      if (sectionLabel) {
        const sectionBlocks = context.blocks.filter(
          (b) =>
            (b.blockType === 'section' || b.blockType === 'heading') &&
            (b.text.toLowerCase().includes(sectionLabel.toLowerCase()) ||
              b.sectionPath.some((s) => s.toLowerCase().includes(sectionLabel.toLowerCase()))),
        );
        if (sectionBlocks.length === 1) {
          return {
            resolved: true,
            blockId: sectionBlocks[0].id,
            questionId: null,
            blockType: 'section',
            locationLabel: sectionBlocks[0].text.slice(0, 100),
            pageNumber: sectionBlocks[0].pageNumber || null,
            method: 'section_match',
            ambiguityDetected: false,
            notFound: false,
            warnings: [],
          };
        }
        if (sectionBlocks.length > 1) {
          return {
            resolved: false,
            blockId: null,
            questionId: null,
            blockType: null,
            locationLabel: null,
            pageNumber: null,
            method: 'section_match_ambiguous',
            ambiguityDetected: true,
            notFound: false,
            warnings: [`Multiple sections match "${sectionLabel}". Please specify.`],
          };
        }
      }
    }

    // 5. "this", "that", "the question", "the worksheet" — use active/first
    if (/^(this|that|the|it)\b/i.test(trimmed) || /(this|that|the)\s+(question|worksheet|file|diagram|section|example)/i.test(trimmed)) {
      // Use the first available question as active reference
      if (context.questions.length > 0) {
        const firstQ = context.questions[0];
        return {
          resolved: true,
          blockId: firstQ.parentBlockId || null,
          questionId: firstQ.questionId,
          blockType: 'question',
          locationLabel: firstQ.questionNumber
            ? `Question ${firstQ.questionNumber}`
            : firstQ.location || null,
          pageNumber: null,
          method: 'demonstrative_first_question',
          ambiguityDetected: false,
          notFound: false,
          warnings: ['Using first question as active reference.'],
        };
      }
    }

    // 6. Worked example reference
    if (/\b(worked example|example|sample)\b/i.test(trimmed)) {
      const workedExamples = context.blocks.filter(
        (b) => b.blockType === 'worked_example',
      );
      if (workedExamples.length === 1) {
        return {
          resolved: true,
          blockId: workedExamples[0].id,
          questionId: null,
          blockType: 'worked_example',
          locationLabel: workedExamples[0].locationLabel || 'Worked example',
          pageNumber: workedExamples[0].pageNumber || null,
          method: 'worked_example_match',
          ambiguityDetected: false,
          notFound: false,
          warnings: [],
        };
      }
      if (workedExamples.length > 1) {
        return {
          resolved: false,
          blockId: null,
          questionId: null,
          blockType: null,
          locationLabel: null,
          pageNumber: null,
          method: 'worked_example_match_ambiguous',
          ambiguityDetected: true,
          notFound: false,
          warnings: ['Multiple worked examples found. Please specify which one.'],
        };
      }
    }

    // 7. Diagram reference
    if (/\b(diagram|figure|table|chart|graph)\b/i.test(trimmed)) {
      const diagrams = context.blocks.filter(
        (b) => b.blockType === 'diagram' || b.blockType === 'figure' || b.blockType === 'table',
      );
      if (diagrams.length === 1) {
        return {
          resolved: true,
          blockId: diagrams[0].id,
          questionId: null,
          blockType: diagrams[0].blockType,
          locationLabel: diagrams[0].locationLabel || diagrams[0].blockType,
          pageNumber: diagrams[0].pageNumber || null,
          method: 'diagram_match',
          ambiguityDetected: false,
          notFound: false,
          warnings: [],
        };
      }
      if (diagrams.length === 0) {
        return {
          resolved: false,
          blockId: null,
          questionId: null,
          blockType: null,
          locationLabel: null,
          pageNumber: null,
          method: 'diagram_not_found',
          ambiguityDetected: false,
          notFound: true,
          warnings: ['No diagram or figure found in this artifact.'],
        };
      }
    }

    // 8. Formula/theorem reference
    if (/\b(formula|theorem|definition|equation)\b/i.test(trimmed)) {
      const formulas = context.blocks.filter(
        (b) => b.blockType === 'formula' || b.blockType === 'theorem' || b.blockType === 'definition',
      );
      if (formulas.length === 1) {
        return {
          resolved: true,
          blockId: formulas[0].id,
          questionId: null,
          blockType: formulas[0].blockType,
          locationLabel: formulas[0].locationLabel || formulas[0].blockType,
          pageNumber: formulas[0].pageNumber || null,
          method: 'formula_match',
          ambiguityDetected: false,
          notFound: false,
          warnings: [],
        };
      }
    }

    // 9. Not found — return default
    return {
      resolved: false,
      blockId: null,
      questionId: null,
      blockType: null,
      locationLabel: null,
      pageNumber: null,
      method: 'not_found',
      ambiguityDetected: false,
      notFound: true,
      warnings: ['Could not resolve artifact reference.'],
    };
  }
}

export const artifactReferenceResolver = new ArtifactReferenceResolver();
