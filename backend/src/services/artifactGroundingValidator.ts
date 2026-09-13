// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Grounding Validator v2
// Validates that a planned tutor response is supported by
// selected artifact evidence. Prevents fabricated citations,
// unsupported claims, and answer-key leakage.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningEvidence,
  ArtifactReasoningIntent,
  ArtifactGroundingStatus,
  ArtifactGroundingValidationResult,
} from './artifactReasoningContracts';

export class ArtifactGroundingValidator {
  /**
   * Validate whether a planned response is grounded in evidence.
   */
  validate(input: {
    intent: ArtifactReasoningIntent;
    evidence: ArtifactReasoningEvidence[];
  }): ArtifactGroundingValidationResult {
    const warnings: string[] = [];
    const missingEvidence: string[] = [];

    if (input.evidence.length === 0) {
      return {
        status: 'not_grounded',
        supportedByEvidence: false,
        missingEvidence: ['No artifact evidence available to ground the response.'],
        fabricatedCitationRisk: true,
        answerKeyRequired: false,
        unsafeBlocked: false,
        warnings: ['No evidence — response cannot be grounded.'],
      };
    }

    // Check for answer key evidence
    const hasAnswerKey = input.evidence.some(
      (e) => e.blockType === 'answer_key' || e.visibility === 'teacher_visible' || e.visibility === 'tutor_internal',
    );

    if (hasAnswerKey) {
      return {
        status: 'answer_key_restricted',
        supportedByEvidence: false,
        missingEvidence: ['Answer key evidence cannot be used in learner-facing responses.'],
        fabricatedCitationRisk: false,
        answerKeyRequired: true,
        unsafeBlocked: false,
        warnings: ['Evidence contains answer key content — not usable for learner responses.'],
      };
    }

    // Check for unsafe/blocked evidence
    const hasUnsafeBlocked = input.evidence.some(
      (e) => e.visibility === 'blocked' || e.safetyFlags.some((f) => f.includes('blocked') || f.includes('prompt_injection')),
    );

    if (hasUnsafeBlocked) {
      return {
        status: 'unsafe_blocked',
        supportedByEvidence: false,
        missingEvidence: ['Evidence contains unsafe content and cannot be used.'],
        fabricatedCitationRisk: true,
        answerKeyRequired: false,
        unsafeBlocked: true,
        warnings: ['Some evidence is blocked or unsafe — excluding from grounding.'],
      };
    }

    // Validate by intent type
    switch (input.intent) {
      case 'explain_question':
      case 'explain_worked_example':
      case 'explain_formula':
      case 'explain_diagram':
      case 'explain_section':
      case 'teach_from_artifact': {
        const hasRelevantBlock = input.evidence.some(
          (e) => e.blockType !== 'unknown' && e.safeText.length > 20,
        );
        if (!hasRelevantBlock) {
          missingEvidence.push('No substantive block content to explain.');
          return {
            status: 'partially_grounded',
            supportedByEvidence: false,
            missingEvidence,
            fabricatedCitationRisk: true,
            answerKeyRequired: false,
            unsafeBlocked: false,
            warnings: ['Evidence lacks substantive content for explanation.'],
          };
        }
        break;
      }

      case 'mark_answer':
      case 'compare_to_worked_example': {
        const hasQuestionEvidence = input.evidence.some(
          (e) => e.questionId && (e.safeQuestionText || e.safeText).length > 10,
        );
        if (!hasQuestionEvidence) {
          missingEvidence.push('No question evidence for answer marking.');
          return {
            status: 'not_grounded',
            supportedByEvidence: false,
            missingEvidence,
            fabricatedCitationRisk: true,
            answerKeyRequired: false,
            unsafeBlocked: false,
            warnings: ['No question evidence available for marking.'],
          };
        }
        break;
      }

      case 'give_hint': {
        const hasHintContent = input.evidence.some(
          (e) => (e.safeText || e.safeQuestionText || '').length > 20,
        );
        if (!hasHintContent) {
          missingEvidence.push('No content for hint generation.');
          return {
            status: 'not_grounded',
            supportedByEvidence: false,
            missingEvidence,
            fabricatedCitationRisk: true,
            answerKeyRequired: false,
            unsafeBlocked: false,
            warnings: ['No hint-able content in evidence.'],
          };
        }
        break;
      }

      case 'generate_similar_practice':
      case 'generate_section_practice': {
        const hasPracticeEvidence = input.evidence.some(
          (e) => e.topic || e.skillId || e.skillLabel,
        );
        if (!hasPracticeEvidence) {
          missingEvidence.push('No topic/skill mapping for practice generation.');
          return {
            status: 'partially_grounded',
            supportedByEvidence: false,
            missingEvidence,
            fabricatedCitationRisk: false,
            answerKeyRequired: false,
            unsafeBlocked: false,
            warnings: ['Evidence lacks topic/skill mappings — practice may be generic.'],
          };
        }
        break;
      }

      default: {
        // Other intents require at least some evidence
        if (input.evidence.length === 0) {
          return {
            status: 'not_grounded',
            supportedByEvidence: false,
            missingEvidence: ['No artifact evidence.'],
            fabricatedCitationRisk: true,
            answerKeyRequired: false,
            unsafeBlocked: false,
            warnings: ['No evidence available for the requested intent.'],
          };
        }
      }
    }

    return {
      status: 'grounded',
      supportedByEvidence: true,
      missingEvidence: [],
      fabricatedCitationRisk: false,
      answerKeyRequired: false,
      unsafeBlocked: false,
      warnings: [],
    };
  }
}

export const artifactGroundingValidator = new ArtifactGroundingValidator();
