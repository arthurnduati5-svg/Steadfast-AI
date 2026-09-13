// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Decision Service v1
// Decides the next learning action based on answer evaluation,
// misconception status, and practice session context.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeDecision,
  ArtifactAwarePracticeDecisionOutput,
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeItem,
  ArtifactAwareMisconception,
  ArtifactAwarePracticeStatus,
  ArtifactAwareAnswerStatus,
} from './artifactAwarePracticeContracts';

function hasConfirmedMisconceptions(misconceptions: ArtifactAwareMisconception[]): boolean {
  return misconceptions.some((m) => m.status === 'confirmed');
}

function hasActiveMisconceptions(misconceptions: ArtifactAwareMisconception[]): boolean {
  return misconceptions.some(
    (m) => m.status === 'suspected' || m.status === 'confirmed' || m.status === 'needs_review',
  );
}

function isSkillStillWeak(session: ArtifactAwarePracticeSession): boolean {
  return session.misconceptionSummary.length > 0;
}

function hasActiveArtifact(session: ArtifactAwarePracticeSession): boolean {
  return session.artifactIds.length > 0;
}

function hasSufficientStructure(session: ArtifactAwarePracticeSession): boolean {
  return session.items.length > 0 || session.basis.extractedQuestionIds.length > 0;
}

/**
 * Decide the next practice action based on current state.
 *
 * Decision rules:
 * - No active artifact: ask_clarification
 * - Insufficient structure: review_artifact_section or ask_clarification
 * - Answer incorrect + confirmed misconception: reteach
 * - Diagram question incorrect: review_diagram
 * - Worked example transfer fails: review_worked_example
 * - Theorem/formula condition missed: review_artifact_section or reteach
 * - Partially correct: give_similar_practice
 * - Correct and skill still weak: give_harder_practice
 * - Correct and no active weakness: advance
 * - Completed practice with correct answer: schedule_spaced_review
 * - Repeated wrong answers: reteach before more practice
 * - Insufficient context: ask_clarification
 */
export function decideNextArtifactAwarePracticeAction(
  session: ArtifactAwarePracticeSession,
  lastEvaluatedItem?: ArtifactAwarePracticeItem,
  repeatedWrongCount?: number,
): ArtifactAwarePracticeDecisionOutput {
  const warnings: string[] = [];

  // 1. No active artifact
  if (!hasActiveArtifact(session)) {
    return {
      decision: 'ask_clarification',
      reason: 'No active learning artifact found. Please upload or select a file first.',
      nextActionPrompt: 'Would you like to upload a worksheet, PDF, or notes to practice from?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: ['No active artifact.'],
    };
  }

  // 2. Insufficient structure
  if (!hasSufficientStructure(session)) {
    return {
      decision: 'review_artifact_section',
      reason: 'The learning material needs more processing before I can create detailed practice from it.',
      nextActionPrompt: 'Let me review the material and create practice questions from what I find.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: ['Insufficient artifact structure.'],
    };
  }

  // 3. No evaluated item
  if (!lastEvaluatedItem || lastEvaluatedItem.status === 'not_answered') {
    return {
      decision: 'give_similar_practice',
      reason: 'Awaiting learner answers to determine next steps.',
      nextActionPrompt: 'Answer the practice questions to continue.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  const answerStatus = lastEvaluatedItem.status;
  const isRepeatedWrong = (repeatedWrongCount ?? 0) >= 2;

  // 4. Repeated wrong answers — reteach
  if (isRepeatedWrong && (answerStatus === 'incorrect' || answerStatus === 'needs_review')) {
    return {
      decision: 'reteach',
      reason: `You have had difficulty with this topic after ${(repeatedWrongCount ?? 0) + 1} attempt(s). Let me explain the concept in a different way.`,
      nextActionPrompt: 'Let me re-explain this concept with a different approach.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 5. Answer incorrect
  if (answerStatus === 'incorrect') {
    const hasConfirmedMc = hasConfirmedMisconceptions(session.misconceptionSummary);

    // Check if diagram question
    if (lastEvaluatedItem.linkedSourceKind === 'diagram') {
      return {
        decision: 'review_diagram',
        reason: 'Your answer suggests some confusion about the diagram. Let me help you interpret it more clearly.',
        nextActionPrompt: 'Would you like to review the diagram and its key components?',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    // Check if worked example
    if (lastEvaluatedItem.linkedSourceKind === 'worked_example') {
      return {
        decision: 'review_worked_example',
        reason: 'Let me walk you through the worked example step by step to clarify the approach.',
        nextActionPrompt: 'Would you like to go through the worked example together?',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    if (hasConfirmedMc) {
      return {
        decision: 'reteach',
        reason: 'Your answer shows a common misunderstanding. Let me help clarify this concept.',
        nextActionPrompt: 'Let me re-explain this concept addressing the specific misunderstanding.',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    return {
      decision: 'review_artifact_section',
      reason: 'Let me help you review the relevant section of the material.',
      nextActionPrompt: 'Would you like to revisit the section about this topic in the material?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 6. Answer needs_review
  if (answerStatus === 'needs_review') {
    if (lastEvaluatedItem.linkedSourceKind === 'diagram') {
      return {
        decision: 'review_diagram',
        reason: 'Let me help you understand the diagram better before you try again.',
        nextActionPrompt: 'Would you like me to explain the diagram?',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }
    return {
      decision: 'review_artifact_section',
      reason: 'Let me help you understand the concepts before trying again.',
      nextActionPrompt: 'Would you like me to explain this topic from the material?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 7. Answer partially_correct
  if (answerStatus === 'partially_correct') {
    if (hasActiveMisconceptions(session.misconceptionSummary)) {
      return {
        decision: 'reteach',
        reason: 'You are on the right track but there are some areas to clarify. Let me help.',
        nextActionPrompt: 'Let me address the areas where there is some confusion.',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    return {
      decision: 'give_similar_practice',
      reason: 'Good progress! Let me give you another practice question to strengthen your understanding.',
      nextActionPrompt: 'Try this similar question to reinforce what you learned.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 8. Answer correct
  if (answerStatus === 'correct') {
    if (isSkillStillWeak(session)) {
      return {
        decision: 'give_harder_practice',
        reason: 'Good answer! Let me give you a more challenging question to deepen your understanding.',
        nextActionPrompt: 'Try this harder question to apply what you have learned.',
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      decision: 'schedule_spaced_review',
      reason: 'Great understanding! Let me schedule a review for tomorrow to reinforce this.',
      nextActionPrompt: 'Well done! I will check in with you tomorrow for a quick review.',
      recommendedReviewAt: dueAt,
      dueAt,
      warnings: [],
    };
  }

  // 9. Invalid answer
  if (answerStatus === 'invalid') {
    return {
      decision: 'ask_clarification',
      reason: 'I need you to provide a proper answer to continue.',
      nextActionPrompt: 'Please give me your best answer to the question.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: ['Invalid answer.'],
    };
  }

  // Default fallback
  return {
    decision: 'give_similar_practice',
    reason: 'Let me continue helping you practice this concept.',
    nextActionPrompt: 'Try this practice question.',
    recommendedReviewAt: null,
    dueAt: null,
    warnings: [],
  };
}
