// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Response Planner v2
// Selects response action from intent, reference resolution,
// evidence, grounding, safety, and learner mode.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningContext,
  ArtifactReferenceResolution,
  ArtifactReasoningIntentResolution,
  ArtifactEvidenceRetrievalResult,
  ArtifactGroundingValidationResult,
  ArtifactReasoningResult,
  ArtifactReasoningAction,
  ArtifactGroundingStatus,
  ArtifactReasoningCitation,
  ArtifactReasoningCacheDecision,
} from './artifactReasoningContracts';

export class ArtifactResponsePlanner {
  /**
   * Plan the best response action based on all available signals.
   */
  plan(input: {
    context: ArtifactReasoningContext;
    reference: ArtifactReferenceResolution;
    intent: ArtifactReasoningIntentResolution;
    evidence: ArtifactEvidenceRetrievalResult;
    grounding: ArtifactGroundingValidationResult;
  }): ArtifactReasoningResult {
    const { context, reference, intent, evidence, grounding } = input;
    const warnings: string[] = [...evidence.warnings, ...grounding.warnings];

    let action: ArtifactReasoningAction;
    let groundingStatus: ArtifactGroundingStatus = grounding.status;
    let learnerFacingResponsePlan = '';
    let tutorActionHint = '';
    let answerKeyUsed = false;

    // 1. Artifact missing
    if (!context.artifactId || !context.safeView) {
      action = 'say_not_found';
      groundingStatus = 'artifact_missing';
      learnerFacingResponsePlan = 'No active artifact or worksheet found.';
      tutorActionHint = 'Ask learner to upload or select an artifact.';
    }
    // 2. Unsafe blocked
    else if (grounding.unsafeBlocked) {
      action = 'refuse_unsafe_artifact_instruction';
      groundingStatus = 'unsafe_blocked';
      learnerFacingResponsePlan = 'I found unsafe content in this artifact and cannot process your request.';
      tutorActionHint = 'Block unsafe artifact instruction.';
    }
    // 3. Answer key restricted
    else if (grounding.answerKeyRequired) {
      action = 'give_hint_only';
      groundingStatus = 'answer_key_restricted';
      learnerFacingResponsePlan = 'Answer keys are hidden. I can give you a hint or explanation instead.';
      tutorActionHint = 'Provide hint without answer key.';
    }
    // 4. Reference not found
    else if (reference.notFound && !reference.ambiguityDetected) {
      action = 'say_not_found';
      groundingStatus = 'not_grounded';
      learnerFacingResponsePlan = 'I could not find the specific question or section you referenced.';
      tutorActionHint = 'Offer available questions list.';
    }
    // 5. Ambiguous reference
    else if (reference.ambiguityDetected || intent.requiresClarification) {
      action = 'ask_clarifying_question';
      groundingStatus = 'ambiguous_reference';
      learnerFacingResponsePlan = 'Could you specify which question or section you mean?';
      tutorActionHint = 'Ask for clarification.';
    }
    // 6. Map intent to action
    else {
      switch (intent.intent) {
        case 'mark_answer':
          action = 'mark_answer';
          learnerFacingResponsePlan = 'I will review your answer against the artifact question.';
          tutorActionHint = 'Mark learner answer with safe feedback.';
          break;

        case 'give_hint':
          action = 'give_hint_only';
          learnerFacingResponsePlan = 'I will give you a hint based on the artifact.';
          tutorActionHint = 'Give a Socratic hint without revealing the answer.';
          break;

        case 'generate_similar_practice':
        case 'generate_section_practice':
          action = 'generate_practice';
          learnerFacingResponsePlan = 'I will create practice based on this artifact.';
          tutorActionHint = 'Generate safe artifact-based practice.';
          break;

        case 'explain_question':
        case 'explain_section':
        case 'explain_worked_example':
        case 'explain_formula':
        case 'explain_diagram':
        case 'teach_from_artifact':
        case 'summarize_artifact':
        case 'find_topic':
        case 'compare_to_worked_example':
          if (grounding.supportedByEvidence) {
            action = 'answer_with_evidence';
            learnerFacingResponsePlan = 'I will explain this using the artifact content.';
            tutorActionHint = `Answer with grounded evidence for intent: ${intent.intent}`;
          } else if (grounding.status === 'partially_grounded') {
            action = 'explain_step_by_step';
            learnerFacingResponsePlan = 'I will explain what I can based on available artifact content.';
            tutorActionHint = 'Explain with partial grounding — note uncertainty.';
          } else {
            action = 'say_not_found';
            learnerFacingResponsePlan = 'I could not find enough information in the artifact to answer that.';
            tutorActionHint = 'Say not found — evidence insufficient.';
          }
          break;

        case 'clarify_reference':
          action = 'ask_clarifying_question';
          learnerFacingResponsePlan = 'Could you clarify which part of the artifact you are referring to?';
          tutorActionHint = 'Ask for specific reference.';
          break;

        default:
          action = 'ask_clarifying_question';
          learnerFacingResponsePlan = 'I am not sure what you mean. Could you specify how I can help with this artifact?';
          tutorActionHint = 'Ask clarifying question for unsupported intent.';
      }
    }

    // Build citations from selected evidence
    const citations: ArtifactReasoningCitation[] = evidence.selectedEvidence
      .filter((e) => e.safeText.length > 10)
      .slice(0, 5)
      .map((e) => ({
        artifactId: e.artifactId,
        blockId: e.blockId || null,
        questionId: e.questionId || null,
        label: e.locationLabel || e.blockType || 'Artifact content',
        location: e.locationLabel || null,
        evidence: e.safeText.slice(0, 200),
      }));

    // Build cache decision
    const cachePolicy: ArtifactReasoningCacheDecision = {
      cacheAllowed: false,
      scope: 'no_cache',
      key: null,
      reason: 'Artifact reasoning is never cached due to student/artifact scoping rules.',
    };

    return {
      decision: action,
      intent: intent.intent,
      selectedEvidence: evidence.selectedEvidence,
      excludedEvidence: evidence.excludedEvidence.map((e) => e.evidence),
      groundingStatus,
      answerKeyUsed,
      learnerFacingResponsePlan,
      tutorActionHint,
      practiceCandidateRefs: [],
      masteryEvidenceRefs: [],
      learnerMemorySignals: [],
      citations,
      warnings,
      cachePolicy,
      metadata: {
        resolvedIntentMethod: intent.method,
        resolvedIntentConfidence: intent.confidence,
        totalBlocksScanned: evidence.totalBlocksScanned,
        totalQuestionsScanned: evidence.totalQuestionsScanned,
        answerKeyBlocksExcluded: evidence.answerKeyBlocksExcluded,
        teacherNoteBlocksExcluded: evidence.teacherNoteBlocksExcluded,
      },
    };
  }
}

export const artifactResponsePlanner = new ArtifactResponsePlanner();
