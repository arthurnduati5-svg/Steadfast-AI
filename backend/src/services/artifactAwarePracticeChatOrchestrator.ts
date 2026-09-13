// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Chat Orchestrator v1
// Handles deterministic artifact-aware practice actions from the
// live chat pipeline. Routes trigger results to existing
// artifact-aware practice services. Never writes directly to
// learner memory. Never exposes answer keys. Never bypasses safety.
// ─────────────────────────────────────────────────────────────

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { ArtifactAwarePracticeChatTriggerKind } from './artifactAwarePracticeChatTriggerService';
import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeSafeContextSummary,
  ArtifactAwarePracticeResponse,
} from './artifactAwarePracticeContracts';
import type { ArtifactAwarePracticeState } from './artifactAwarePracticeContracts';

import { resolveArtifactPracticeSources } from './artifactPracticeSourceResolver';
import { generateArtifactAwarePractice } from './artifactAwarePracticeGenerator';
import { evaluateArtifactAwareAnswer } from './artifactAwareAnswerEvaluator';
import { decideNextArtifactAwarePracticeAction } from './artifactAwarePracticeDecisionService';
import { rubricMissesToArtifactMisconceptions, updateArtifactAwareMisconceptions } from './artifactAwareMisconceptionService';
import { determineArtifactReviewSchedule } from './artifactAwarePracticeScheduler';

import {
  getArtifactAwarePracticeState,
  createArtifactAwarePracticeSession,
  answerArtifactAwarePracticeItem,
  reviewArtifactAwarePracticeSession,
  completeArtifactAwarePracticeSession,
  abandonArtifactAwarePracticeSession,
  updateArtifactAwarePracticeSession,
} from './artifactAwarePracticeStateService';

import {
  writeArtifactAwarePracticeEvent,
  writeArtifactAwarePracticeStatusChangeEvent,
} from './artifactAwarePracticeEventService';

// Safety sanitizers not needed directly — the orchestrator builds
// safe answerText strings and only returns safe metadata.

import { getTutorStateForLearner } from './tutorStateService';

// ── Output Type ──

export interface ArtifactAwarePracticeChatOrchestratorOutput {
  handled: boolean;
  answerText: string;
  metadata?: {
    artifactAwarePractice?: {
      status: string;
      currentDecision?: string | null;
      topic?: string | null;
      itemCount?: number;
    };
  };
  warnings: string[];
}

// ── Helpers ──

function safeAnswer(text: string): string {
  return String(text || '').trim();
}

function generateId(): string {
  return `aapo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Service ──

export class ArtifactAwarePracticeChatOrchestrator {
  /**
   * Handle an artifact-aware practice action from the live chat pipeline.
   * Returns handled=false when no artifact practice action is needed.
   */
  async handleArtifactAwarePracticeChatTurn(input: {
    identity: ResolvedTutorIdentity;
    message: string;
    triggerKind: ArtifactAwarePracticeChatTriggerKind;
    activeArtifactIds: string[];
  }): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const warnings: string[] = [];
    const { identity, message, triggerKind, activeArtifactIds } = input;

    try {
      switch (triggerKind) {
        case 'generate_from_artifact':
          return await this._handleGenerate(identity, message, activeArtifactIds, warnings);
        case 'answer_artifact_practice':
          return await this._handleAnswer(identity, message, warnings);
        case 'review_artifact_practice':
          return await this._handleReview(identity, warnings);
        case 'next_artifact_practice':
          return await this._handleNext(identity, warnings);
        case 'schedule_artifact_review':
          return await this._handleSchedule(identity, warnings);
        case 'complete_artifact_practice':
          return await this._handleComplete(identity, warnings);
        case 'not_triggered':
        default:
          return {
            handled: false,
            answerText: '',
            warnings,
          };
      }
    } catch (err) {
      warnings.push(`Artifact-aware practice orchestrator error: ${String(err)}`);
      return {
        handled: true,
        answerText: 'I encountered an issue processing the artifact practice. Please try again.',
        warnings,
      };
    }
  }

  /**
   * Generate artifact-aware practice from active artifacts.
   */
  private async _handleGenerate(
    identity: ResolvedTutorIdentity,
    message: string,
    activeArtifactIds: string[],
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    // 1. Check if there are active artifacts
    if (activeArtifactIds.length === 0) {
      return {
        handled: true,
        answerText: 'I need an active uploaded file first. Please upload or select the file you want me to use for practice.',
        warnings: ['No active artifact found. Learner needs to upload a file first.'],
      };
    }

    // 2. Check current state — if there's already an active practice, inform learner
    const currentState = await getArtifactAwarePracticeState(identity);
    if (currentState.activePracticeSession) {
      const topic = currentState.activePracticeSession.topic || 'the material';
      return {
        handled: true,
        answerText: safeAnswer(
          `You already have an active practice session about "${topic}". Would you like to continue with that, or should I generate new practice questions?`,
        ),
        metadata: {
          artifactAwarePractice: {
            status: currentState.activePracticeSession.status,
            currentDecision: currentState.activePracticeSession.decision.currentDecision,
            topic: currentState.activePracticeSession.topic,
            itemCount: currentState.activePracticeSession.items.length,
          },
        },
        warnings: ['Learner has an active practice session. Confirming before generating new.'],
      };
    }

    // 3. Resolve practice sources from artifacts
    const resolvedSources = await resolveArtifactPracticeSources(
      identity,
      activeArtifactIds,
      activeArtifactIds[0],
    );

    if (resolvedSources.artifactIds.length === 0) {
      return {
        handled: true,
        answerText: 'I need an active uploaded file first. Please upload or select the file you want me to use.',
        warnings: [...resolvedSources.warnings],
      };
    }

    // 4. Generate practice items
    const generatedResponse = await generateArtifactAwarePractice(identity, {
      sessionId: null,
      artifactIds: activeArtifactIds,
      primaryArtifactId: activeArtifactIds[0],
      requestedItemCount: 3,
      includeLearnerMemory: true,
      includeMasteryContext: true,
    }, resolvedSources);

    if (!generatedResponse.activePracticeSession) {
      return {
        handled: true,
        answerText: 'I was unable to generate practice questions from the uploaded file. The file may not have enough structured content.',
        warnings: [...generatedResponse.warnings],
      };
    }

    // 5. Persist the session
    const persistedResponse = await createArtifactAwarePracticeSession(
      identity,
      generatedResponse.activePracticeSession,
    );

    // 6. Write event (non-blocking)
    writeArtifactAwarePracticeEvent(
      identity,
      'artifact_practice_generated',
      generatedResponse.activePracticeSession,
    ).catch(() => {});

    // 7. Build learner-safe response
    if (persistedResponse.activePracticeSession) {
      const session = persistedResponse.activePracticeSession;
      const topic = session.topic || 'the material';
      const firstItem = session.items[0];

      let answerText: string;
      if (firstItem) {
        answerText = safeAnswer(
          `Here is a practice question from your uploaded file about "${topic}":\n\n${firstItem.prompt}\n\n` +
          `Take your time to think about it, then share your answer when you're ready.`
        );
      } else {
        answerText = safeAnswer(
          `I created practice questions from your uploaded file about "${topic}". ` +
          `Answer the questions and I'll check your understanding.`
        );
      }

      return {
        handled: true,
        answerText,
        metadata: {
          artifactAwarePractice: {
            status: session.status,
            currentDecision: session.decision.currentDecision,
            topic: session.topic,
            itemCount: session.items.length,
          },
        },
        warnings,
      };
    }

    return {
      handled: true,
      answerText: 'I created practice questions from your file. Please answer them when you are ready.',
      warnings,
    };
  }

  /**
   * Answer artifact-aware practice item.
   */
  private async _handleAnswer(
    identity: ResolvedTutorIdentity,
    message: string,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    // 1. Get active practice session
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      // No active practice — check if there are artifacts to generate from
      const tutorState = await getTutorStateForLearner(identity);
      if (tutorState.activeArtifactIds.length > 0) {
        return {
          handled: true,
          answerText: 'I can quiz you from the file first, then check your answer. Would you like me to generate practice questions?',
          warnings: ['No active practice session. Suggesting generation.'],
        };
      }
      return {
        handled: true,
        answerText: 'I need an active practice session first. You can say "quiz me from this file" to start.',
        warnings: ['No active practice session.'],
      };
    }

    // 2. Find the first unanswered item
    const unansweredItem = activeSession.items.find((i) => i.status === 'not_answered');
    if (!unansweredItem) {
      // All items answered — check what's next
      return await this._handleReviewOrNext(identity, activeSession, warnings);
    }

    // 3. Evaluate the answer against the item
    const evaluateResult = evaluateArtifactAwareAnswer(unansweredItem, message);

    // 4. Update misconceptions
    const newMisconceptions = rubricMissesToArtifactMisconceptions(
      evaluateResult.rubricMisses,
      activeSession.skillIds,
      activeSession.artifactIds,
    );
    const updatedMisconceptions = updateArtifactAwareMisconceptions(
      activeSession.misconceptionSummary,
      [...(evaluateResult.suspectedMisconceptions || []), ...newMisconceptions],
      evaluateResult.status === 'correct',
    );

    // 5. Persist the answer
    const answerResponse = await answerArtifactAwarePracticeItem(identity, {
      artifactPracticeSessionId: activeSession.artifactPracticeSessionId,
      practiceItemId: unansweredItem.practiceItemId,
      learnerAnswerSummary: message.slice(0, 1200),
    }, {
      ...evaluateResult,
      suspectedMisconceptions: updatedMisconceptions,
    });

    // 6. Make decision
    const repeatedWrongCount = activeSession.items.filter(
      (i) => i.status === 'incorrect' || i.status === 'needs_review',
    ).length;

    const decision = decideNextArtifactAwarePracticeAction(
      activeSession,
      { ...unansweredItem, status: evaluateResult.status, feedbackSummary: evaluateResult.feedbackSummary },
      repeatedWrongCount,
    );

    // 7. Update decision in session
    if (answerResponse.activePracticeSession) {
      const updatedWithDecision = {
        ...answerResponse.activePracticeSession,
        misconceptionSummary: updatedMisconceptions,
        decision: {
          ...answerResponse.activePracticeSession.decision,
          currentDecision: decision.decision,
          reason: decision.reason,
          nextActionPrompt: decision.nextActionPrompt,
          recommendedReviewAt: decision.recommendedReviewAt,
          dueAt: decision.dueAt,
        },
      };

      // Apply schedule
      const schedule = determineArtifactReviewSchedule(updatedWithDecision, {
        ...unansweredItem,
        status: evaluateResult.status,
        feedbackSummary: evaluateResult.feedbackSummary,
      });
      if (schedule.dueAt) {
        updatedWithDecision.decision.recommendedReviewAt = schedule.recommendedReviewAt;
        updatedWithDecision.decision.dueAt = schedule.dueAt;
      }

      // Persist decision updates
      await updateArtifactAwarePracticeSession(identity, updatedWithDecision);
    }

    // 8. Write event (non-blocking)
    if (answerResponse.activePracticeSession) {
      writeArtifactAwarePracticeStatusChangeEvent(identity, answerResponse.activePracticeSession).catch(() => {});
    }

    // 9. Build learner-safe response
    const feedback = evaluateResult.feedbackSummary || 'Thanks for your answer!';
    let answerText: string;

    switch (evaluateResult.status) {
      case 'correct':
        answerText = safeAnswer(`${feedback}\n\n${decision.nextActionPrompt || 'Great work! Would you like another question?'}`);
        break;
      case 'partially_correct':
        answerText = safeAnswer(`${feedback}\n\n${decision.nextActionPrompt || 'Would you like to try another similar question?'}`);
        break;
      case 'incorrect':
        answerText = safeAnswer(`${feedback}\n\n${decision.nextActionPrompt || 'Let me help you understand this better.'}`);
        break;
      case 'needs_review':
        answerText = safeAnswer(`${feedback}\n\n${decision.nextActionPrompt || 'Would you like me to explain this concept?'}`);
        break;
      case 'invalid':
        answerText = safeAnswer('Please provide a complete answer so I can check your understanding.');
        break;
      default:
        answerText = safeAnswer(feedback);
    }

    return {
      handled: true,
      answerText,
      metadata: {
        artifactAwarePractice: {
          status: (answerResponse.activePracticeSession?.status) || 'answered',
          currentDecision: decision.decision || null,
          topic: activeSession.topic || null,
          itemCount: activeSession.items.length,
        },
      },
      warnings,
    };
  }

  /**
   * Review artifact practice session.
   */
  private async _handleReview(
    identity: ResolvedTutorIdentity,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      return {
        handled: true,
        answerText: 'You do not have an active practice session to review. Say "quiz me from this file" to start.',
        warnings: ['No active practice session.'],
      };
    }

    // Build a safe summary
    const answeredCount = activeSession.items.filter((i) => i.status !== 'not_answered').length;
    const correctCount = activeSession.items.filter((i) => i.status === 'correct').length;
    const topic = activeSession.topic || 'the material';

    let answerText: string;
    if (answeredCount === 0) {
      answerText = safeAnswer(`You have not answered any questions about "${topic}" yet. Go ahead and try the first question!`);
    } else {
      const nextAction = activeSession.decision.nextActionPrompt
        ? `\n\n${activeSession.decision.nextActionPrompt}`
        : '';
      answerText = safeAnswer(
        `Here is your progress on "${topic}":\n` +
        `- Questions answered: ${answeredCount} of ${activeSession.items.length}\n` +
        `- Correct: ${correctCount}\n` +
        `- Current status: ${activeSession.status.replace(/_/g, ' ')}` +
        nextAction
      );
    }

    return {
      handled: true,
      answerText,
      metadata: {
        artifactAwarePractice: {
          status: activeSession.status,
          currentDecision: activeSession.decision.currentDecision,
          topic: activeSession.topic,
          itemCount: activeSession.items.length,
        },
      },
      warnings,
    };
  }

  /**
   * Next artifact practice action.
   */
  private async _handleNext(
    identity: ResolvedTutorIdentity,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      return {
        handled: true,
        answerText: 'You do not have an active practice session. Say "quiz me from this file" to start.',
        warnings: ['No active practice session.'],
      };
    }

    return await this._handleReviewOrNext(identity, activeSession, warnings);
  }

  /**
   * Schedule artifact review.
   */
  private async _handleSchedule(
    identity: ResolvedTutorIdentity,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      return {
        handled: true,
        answerText: 'You do not have an active practice session to schedule. Say "quiz me from this file" to start.',
        warnings: ['No active practice session.'],
      };
    }

    // Schedule the review
    const schedule = determineArtifactReviewSchedule(
      activeSession,
      activeSession.items[activeSession.items.length - 1] || activeSession.items[0],
    );

    const updatedSession = {
      ...activeSession,
      status: 'scheduled_review' as const,
      decision: {
        ...activeSession.decision,
        recommendedReviewAt: schedule.recommendedReviewAt,
        dueAt: schedule.dueAt,
        currentDecision: 'schedule_spaced_review' as const,
        reason: schedule.reason,
      },
    };

    await updateArtifactAwarePracticeSession(identity, updatedSession);
    writeArtifactAwarePracticeEvent(identity, 'artifact_practice_spaced_review_scheduled', updatedSession).catch(() => {});

    const dueLabel = schedule.dueAt
      ? `I have scheduled a review for ${new Date(schedule.dueAt).toLocaleDateString()}.`
      : '';

    return {
      handled: true,
      answerText: safeAnswer(`${dueLabel} Regular review helps with long-term retention!`),
      metadata: {
        artifactAwarePractice: {
          status: 'scheduled_review',
          currentDecision: 'schedule_spaced_review',
          topic: activeSession.topic || null,
          itemCount: activeSession.items.length,
        },
      },
      warnings,
    };
  }

  /**
   * Complete artifact practice.
   */
  private async _handleComplete(
    identity: ResolvedTutorIdentity,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      return {
        handled: true,
        answerText: 'You do not have an active practice session to complete.',
        warnings: ['No active practice session to complete.'],
      };
    }

    const completedResponse = await completeArtifactAwarePracticeSession(
      identity,
      activeSession.artifactPracticeSessionId,
    );

    if (completedResponse.recentPracticeSessions[0]) {
      writeArtifactAwarePracticeEvent(identity, 'artifact_practice_completed', completedResponse.recentPracticeSessions[0]).catch(() => {});
    }

    const topic = activeSession.topic || 'the material';
    return {
      handled: true,
      answerText: safeAnswer(`Great work completing the practice on "${topic}"! You can always come back for more practice.`),
      metadata: {
        artifactAwarePractice: {
          status: 'completed',
          currentDecision: null,
          topic: activeSession.topic || null,
          itemCount: activeSession.items.length,
        },
      },
      warnings,
    };
  }

  /**
   * Handle review/next when all items are answered.
   */
  private async _handleReviewOrNext(
    identity: ResolvedTutorIdentity,
    session: ArtifactAwarePracticeSession,
    warnings: string[],
  ): Promise<ArtifactAwarePracticeChatOrchestratorOutput> {
    const lastAnswered = [...session.items]
      .reverse()
      .find((i) => i.status !== 'not_answered');

    const repeatedWrongCount = session.items.filter(
      (i) => i.status === 'incorrect' || i.status === 'needs_review',
    ).length;

    const decision = decideNextArtifactAwarePracticeAction(
      session,
      lastAnswered,
      repeatedWrongCount,
    );

    // Update decision in session
    const updatedSession = {
      ...session,
      decision: {
        ...session.decision,
        currentDecision: decision.decision,
        reason: decision.reason,
        nextActionPrompt: decision.nextActionPrompt,
      },
    };

    await updateArtifactAwarePracticeSession(identity, updatedSession);
    writeArtifactAwarePracticeStatusChangeEvent(identity, updatedSession).catch(() => {});

    let answerText: string;
    switch (decision.decision) {
      case 'reteach':
        answerText = safeAnswer(decision.reason + ' ' + (decision.nextActionPrompt || ''));
        break;
      case 'give_similar_practice':
        answerText = safeAnswer(decision.reason + ' ' + (decision.nextActionPrompt || ''));
        break;
      case 'give_harder_practice':
        answerText = safeAnswer(decision.reason + ' ' + (decision.nextActionPrompt || ''));
        break;
      case 'schedule_spaced_review':
        answerText = safeAnswer(
          'Great understanding! ' + decision.reason + ' ' + (decision.nextActionPrompt || '')
        );
        break;
      case 'advance':
        answerText = safeAnswer('Excellent work! You are ready to move on to more advanced topics.');
        break;
      default:
        answerText = safeAnswer(decision.nextActionPrompt || 'What would you like to do next?');
    }

    return {
      handled: true,
      answerText,
      metadata: {
        artifactAwarePractice: {
          status: session.status,
          currentDecision: decision.decision,
          topic: session.topic || null,
          itemCount: session.items.length,
        },
      },
      warnings,
    };
  }
}

// ── Singleton ──

export const artifactAwarePracticeChatOrchestrator = new ArtifactAwarePracticeChatOrchestrator();
