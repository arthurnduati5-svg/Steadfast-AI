// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Resolver v1
// Resolves safe, bounded video-aware practice context for
// TutorTurnContext. No answer keys. No raw learner answers.
// No raw transcript. No hidden prompt.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwarePracticeSession,
  VideoAwarePracticeState,
  VideoAwarePracticeSafeContextSummary,
  VideoAwarePracticeResolverOutput,
} from './videoAwarePracticeContracts';

import { MAX_RECENT_PRACTICE_SESSIONS } from './videoAwarePracticeContracts';
import { getVideoLearningSessionState } from './videoLearningSessionStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

/**
 * Build a bounded, safe summary of misconception state.
 */
function buildMisconceptionSummary(session: VideoAwarePracticeSession): string[] {
  return session.misconceptionSummary
    .filter((m) => m.status === 'suspected' || m.status === 'confirmed')
    .slice(0, 5)
    .map((m) => `${m.label}`)
    .slice(0, 5);
}

/**
 * Build due review summary.
 */
function buildDueReviewSummary(session: VideoAwarePracticeSession): string | null {
  if (session.decision.dueAt) {
    const due = new Date(session.decision.dueAt);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) {
      return 'Review is due now';
    }
    if (diffHours < 24) {
      return `Review due in ${diffHours} hour(s)`;
    }
    const diffDays = Math.round(diffHours / 24);
    return `Review due in ${diffDays} day(s)`;
  }
  return null;
}

/**
 * Resolve safe video-aware practice context for TutorTurnContext.
 * Never returns answer keys, raw learner answers, raw transcript, or hidden prompts.
 */
export async function resolveVideoAwarePracticeContext(
  identity: ResolvedTutorIdentity,
): Promise<VideoAwarePracticeResolverOutput> {
  const warnings: string[] = [];

  try {
    const videoState = await getVideoLearningSessionState(identity);
    const practiceState = (videoState as any).videoAwarePractice as VideoAwarePracticeState | undefined;

    if (!practiceState || !practiceState.activePracticeSession) {
      return {
        activePracticeSession: null,
        recentPracticeSessions: [],
        safeContextSummary: {
          hasActiveVideoPractice: false,
          topic: null,
          skillIds: [],
          currentDecision: null,
          misconceptionSummary: [],
          nextActionPrompt: null,
          dueReviewSummary: null,
          warnings: [],
        },
      };
    }

    const activeSession = practiceState.activePracticeSession;
    const recentSessions = (practiceState.recentPracticeSessions || []).slice(0, MAX_RECENT_PRACTICE_SESSIONS);

    // Strip answer keys from the active session before returning to TutorTurnContext
    const safeSession = activeSession ? {
      ...activeSession,
      items: (activeSession.items || []).map((item: any) => {
        const safe = { ...item };
        delete safe.expectedAnswerSummary;
        return safe;
      }),
    } : null;

    // Build safe context summary (no answer keys, no raw learner answers)
    const safeContextSummary: VideoAwarePracticeSafeContextSummary = {
      hasActiveVideoPractice: true,
      topic: activeSession.topic?.slice(0, 160) || null,
      skillIds: (activeSession.skillIds || []).slice(0, 20),
      currentDecision: activeSession.decision.currentDecision || null,
      misconceptionSummary: buildMisconceptionSummary(activeSession),
      nextActionPrompt: activeSession.decision.nextActionPrompt?.slice(0, 200) || null,
      dueReviewSummary: buildDueReviewSummary(activeSession),
      warnings: activeSession.safety.warnings.slice(0, 5),
    };

    return {
      activePracticeSession: activeSession, // Full session returned for server-side use
      recentPracticeSessions: recentSessions,
      safeContextSummary,
    };
  } catch (err) {
    warnings.push(`Failed to resolve video-aware practice context: ${String(err)}`);
    return {
      activePracticeSession: null,
      recentPracticeSessions: [],
      safeContextSummary: {
        hasActiveVideoPractice: false,
        topic: null,
        skillIds: [],
        currentDecision: null,
        misconceptionSummary: [],
        nextActionPrompt: null,
        dueReviewSummary: null,
        warnings,
      },
    };
  }
}
