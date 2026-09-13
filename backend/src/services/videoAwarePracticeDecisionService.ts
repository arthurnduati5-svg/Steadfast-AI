// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Decision Service v1
// Decides the next learning action based on answer evaluation,
// misconception status, and practice session context.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwarePracticeDecision,
  VideoAwarePracticeDecisionResult,
  VideoAwarePracticeSession,
  VideoAwarePracticeItem,
  VideoAwareMisconception,
  VideoAwarePracticeStatus,
  VideoAwareAnswerStatus,
  VideoAwarePracticeDecisionOutput,
} from './videoAwarePracticeContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Check if the session has an active video session and it's usable.
 */
function isActiveVideoAvailable(session: VideoAwarePracticeSession): boolean {
  return !!session.sessionVideoId && !!session.sourceVideo.title;
}

/**
 * Check if there are any confirmed misconceptions.
 */
function hasConfirmedMisconceptions(misconceptions: VideoAwareMisconception[]): boolean {
  return misconceptions.some((m) => m.status === 'confirmed');
}

/**
 * Check if there are any active misconceptions.
 */
function hasActiveMisconceptions(misconceptions: VideoAwareMisconception[]): boolean {
  return misconceptions.some(
    (m) => m.status === 'suspected' || m.status === 'confirmed' || m.status === 'needs_review',
  );
}

/**
 * Determine if a skill is still weak based on misconceptions.
 */
function isSkillStillWeak(session: VideoAwarePracticeSession): boolean {
  return session.misconceptionSummary.length > 0;
}

/**
 * Decide the next practice action based on current state.
 *
 * Decision rules:
 * - No active video: ask_clarification
 * - Progress low and answer incorrect: review_video_segment
 * - Answer incorrect + confirmed misconception: reteach
 * - Partially correct: give_similar_practice
 * - Correct + skill still weak: give_harder_practice
 * - Correct + no active weakness: advance
 * - Completed video + correct answer: schedule_spaced_review
 * - Repeated wrong answers: reteach before more practice
 * - Insufficient context: ask_clarification
 */
export function decideNextVideoAwarePracticeAction(
  session: VideoAwarePracticeSession,
  lastEvaluatedItem?: VideoAwarePracticeItem,
  repeatedWrongCount?: number,
): VideoAwarePracticeDecisionOutput {
  const warnings: string[] = [];
  const now = nowISO();

  // 1. No active video
  if (!isActiveVideoAvailable(session)) {
    return {
      decision: 'ask_clarification',
      reason: 'No active video session. Please select or watch a video first.',
      nextActionPrompt: 'Would you like to search for a video on a topic you are studying?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: ['No active video.'],
    };
  }

  // 2. No evaluated item — need answers
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
  const misconceptionCount = session.misconceptionSummary.length;
  const isRepeatedWrong = (repeatedWrongCount ?? 0) >= 2;

  // 3. Repeated wrong answers — reteach
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

  // 4. Answer incorrect
  if (answerStatus === 'incorrect') {
    const hasConfirmedMc = hasConfirmedMisconceptions(session.misconceptionSummary);

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

    // Check progress
    if (session.sourceVideo.watchedPercent != null && session.sourceVideo.watchedPercent < 50) {
      return {
        decision: 'review_video_segment',
        reason: `You have watched ${Math.round(session.sourceVideo.watchedPercent)}% of the video. Revisiting the relevant section may help.`,
        nextActionPrompt: `Would you like to review the section about "${session.topic || session.sourceVideo.title}" from the video?`,
        recommendedReviewAt: null,
        dueAt: null,
        warnings: [],
      };
    }

    return {
      decision: 'give_similar_practice',
      reason: 'Let me give you a similar question to practice this concept again.',
      nextActionPrompt: 'Try a similar practice question to reinforce your understanding.',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 5. Answer needs_review
  if (answerStatus === 'needs_review') {
    return {
      decision: 'review_video_segment',
      reason: 'Let me help you understand the concepts before trying again.',
      nextActionPrompt: 'Would you like me to explain this concept or review the video section?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 6. Answer partially_correct
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

  // 7. Answer correct
  if (answerStatus === 'correct') {
    // Completed video + correct?
    const isCompletedVideo = session.sourceVideo.watchedPercent != null && session.sourceVideo.watchedPercent >= 90;

    // Skill still weak?
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

    if (isCompletedVideo) {
      const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day from now
      return {
        decision: 'schedule_spaced_review',
        reason: 'Great understanding! Let me schedule a review for tomorrow to reinforce this.',
        nextActionPrompt: 'Well done! I will ask you a quick review question tomorrow.',
        recommendedReviewAt: dueAt,
        dueAt,
        warnings: [],
      };
    }

    return {
      decision: 'advance',
      reason: 'Excellent understanding! You are ready to move forward.',
      nextActionPrompt: 'You have mastered this concept. Would you like to explore a related topic or try a harder challenge?',
      recommendedReviewAt: null,
      dueAt: null,
      warnings: [],
    };
  }

  // 8. Invalid answer
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
