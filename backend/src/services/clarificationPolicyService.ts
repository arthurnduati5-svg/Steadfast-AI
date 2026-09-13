// ─────────────────────────────────────────────────────────────
// Steadfast AI — Clarification Policy Service v1
// Decides when the tutor should ask a question instead of
// guessing the learner's intent.  Context-aware, safe.
// ─────────────────────────────────────────────────────────────

import type {
  ClarificationQuestion,
  ClarificationReason,
  TutorIntent,
  ResolveTutorIntentRequest,
} from './intentResolverContracts';

export interface ClarificationInput {
  request: ResolveTutorIntentRequest;
  activeArtifactIds: string[];
  activeSubject?: string | null;
  activeTopic?: string | null;
  hasTutorState: boolean;
  hasLearnerMemory: boolean;
  hasPracticeMastery: boolean;
  hasPracticeRecommendation: boolean;
  hasReviewDue: boolean;
  sourceCandidateIds: string[];
  verifiedSourceCount: number;
  confidenceScore: number;
  topCandidateIntents: Array<{ intent: TutorIntent; score: number }>;
  isPromptInjectionDetected: boolean;
}

// ── ClarificationPolicyService ──

export class ClarificationPolicyService {
  /**
   * Decide whether clarification is needed.
   * Returns a ClarificationQuestion if needed, null if the resolver can proceed.
   */
  decideClarification(input: ClarificationInput): ClarificationQuestion | null {
    const message = String(input.request.message || '').trim().toLowerCase();

    // ── 1. Prompt injection → unsafe, not clarification ──
    if (input.isPromptInjectionDetected) {
      return null; // Handled by safety layer, not clarification
    }

    // ── 2. "Use the file" with no active artifact ──
    if (
      /\b(use\s+the\s+file|look\s+at\s+the\s+file|open\s+the\s+file|check\s+file|the\s+file|that\s+file|this\s+file|my\s+file|worksheet|document|pdf|uploaded)\b/i.test(message) &&
      input.activeArtifactIds.length === 0
    ) {
      return {
        reason: 'missing_artifact',
        question: 'Which file should I use? I do not see an active file attached to this session.',
        options: ['Attach a file now', 'Continue without a file'],
        canProceedWithSafeDefault: true,
        safeDefaultIntent: 'general_chat',
      };
    }

    // ── 3. "Check my answer" with no learner answer ──
    if (
      /\b(check|grade|mark|evaluate|review|look\s+at|correct)\s+(my|the)\s+(answer|work|solution|response)\b/i.test(message) &&
      !input.request.learnerAnswerSummary
    ) {
      return {
        reason: 'missing_answer',
        question: 'Please share your answer first, then I can check it step by step.',
        options: ['Send my answer'],
        canProceedWithSafeDefault: false,
      };
    }

    // ── 4. "Is this source true" with no source candidates ──
    if (
      /\b(is\s+this\s+source|is\s+it\s+true|verify\s+source|source\s+reliable|check\s+this\s+source|is\s+that\s+true|fact\s+check|reliable)\b/i.test(message) &&
      input.sourceCandidateIds.length === 0 &&
      input.verifiedSourceCount === 0
    ) {
      return {
        reason: 'missing_source',
        question: 'Which source or claim would you like me to verify? Please share the text or link.',
        options: ['Share the source', 'Skip verification'],
        canProceedWithSafeDefault: true,
        safeDefaultIntent: 'general_chat',
      };
    }

    // ── 5. "Quiz me" / "Test me" with no topic or context ──
    if (
      /\b(quiz|test|exam|question)\s+(me|time|now|on)\b/i.test(message) &&
      !input.activeSubject &&
      !input.activeTopic &&
      !input.hasPracticeMastery
    ) {
      return {
        reason: 'missing_topic',
        question: 'Sure! What topic would you like me to quiz you on?',
        options: ['Mathematics', 'Science', 'English', 'History'],
        canProceedWithSafeDefault: false,
      };
    }

    // ── 6. "Give me another one" / "Next" with no practice recommendation ──
    if (
      /\b(another\s+one|next\s+(one|question|problem)|give\s+me\s+another|try\s+another)\b/i.test(message) &&
      !input.hasPracticeRecommendation &&
      !input.hasPracticeMastery
    ) {
      return {
        reason: 'ambiguous_task',
        question: 'Do you want another practice question, a new topic to learn, or something else?',
        options: ['Practice question', 'New topic', 'Review past material'],
        canProceedWithSafeDefault: true,
        safeDefaultIntent: 'practice',
      };
    }

    // ── 7. "Help me revise" with no review due ──
    if (
      /\b(help\s+me\s+revise|revise|revision|study\s+for\s+exam|prepare\s+for\s+test)\b/i.test(message) &&
      !input.hasReviewDue &&
      !input.activeTopic
    ) {
      return {
        reason: 'missing_topic',
        question: 'What topic or subject would you like to revise?',
        options: ['Current topic', 'Past mistakes', 'Choose a subject'],
        canProceedWithSafeDefault: true,
        safeDefaultIntent: 'review',
      };
    }

    // ── 8. Multiple possible intents conflict ──
    if (input.topCandidateIntents.length >= 2) {
      const topScore = input.topCandidateIntents[0]?.score || 0;
      const secondScore = input.topCandidateIntents[1]?.score || 0;

      if (topScore - secondScore < 0.15 && input.confidenceScore < 0.5) {
        const intentLabels: Record<string, string> = {
          explain: 'Explain something',
          practice: 'Practice',
          quiz: 'Quiz me',
          review: 'Review',
          check_answer: 'Check my answer',
          artifact_help: 'Help with a file',
          source_verification: 'Verify a source',
        };

        const options = input.topCandidateIntents
          .slice(0, 3)
          .map((c) => intentLabels[c.intent] || c.intent)
          .filter(Boolean);

        return {
          reason: 'multiple_possible_intents',
          question: 'I want to make sure I help with the right thing. Which of these best matches what you need?',
          options: options.length > 0 ? options : ['Explain', 'Practice', 'Quiz'],
          canProceedWithSafeDefault: true,
          safeDefaultIntent: input.topCandidateIntents[0]?.intent || 'explain',
        };
      }
    }

    // ── 9. Low confidence with no context ──
    if (input.confidenceScore < 0.35 && !input.activeTopic && !input.hasTutorState && !input.hasPracticeMastery) {
      return {
        reason: 'ambiguous_task',
        question: 'What would you like help with? I can explain a topic, help you practice, check your work, or review material.',
        options: ['Explain a topic', 'Practice', 'Check my work', 'Review'],
        canProceedWithSafeDefault: true,
        safeDefaultIntent: 'general_chat',
      };
    }

    // ── 10. "Is this source true" but no source candidates (handled above, but check for general source queries) ──
    // Already handled in #4

    // ── No clarification needed ──
    return null;
  }

  /**
   * Generate a safe default clarification for "I don't get it" / vague help when topic exists.
   */
  generateContextualClarification(activeTopic?: string | null): ClarificationQuestion | null {
    if (!activeTopic) return null;
    return {
      reason: 'ambiguous_task',
      question: `We are studying ${activeTopic}. What would help right now?`,
      options: ['Explain it again', 'Give me a practice problem', 'Check my answer', 'Review what I learned'],
      canProceedWithSafeDefault: true,
      safeDefaultIntent: 'explain',
    };
  }
}

// Singleton
export const clarificationPolicyService = new ClarificationPolicyService();
