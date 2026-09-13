// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Resolver v1
// Resolves safe, bounded artifact-aware practice context for
// TutorTurnContext. No answer keys. No raw learner answers.
// No raw artifact text. No hidden prompt.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeState,
  ArtifactAwarePracticeSafeContextSummary,
  ArtifactAwarePracticeResolverOutput,
} from './artifactAwarePracticeContracts';

import { MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS } from './artifactAwarePracticeContracts';
import { getTutorStateForLearner } from './tutorStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

function buildMisconceptionSummary(session: ArtifactAwarePracticeSession): string[] {
  return session.misconceptionSummary
    .filter((m) => m.status === 'suspected' || m.status === 'confirmed')
    .slice(0, 5)
    .map((m) => m.label);
}

function buildDueReviewSummary(session: ArtifactAwarePracticeSession): string | null {
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
 * Resolve safe artifact-aware practice context for TutorTurnContext.
 * Never returns answer keys, raw learner answers, raw artifact text, or hidden prompts.
 */
export async function resolveArtifactAwarePracticeContext(
  identity: ResolvedTutorIdentity,
): Promise<ArtifactAwarePracticeResolverOutput> {
  const warnings: string[] = [];

  try {
    const tutorState = await getTutorStateForLearner(identity);
    const practiceState = (tutorState as any).artifactAwarePractice as ArtifactAwarePracticeState | undefined;

    if (!practiceState || !practiceState.activePracticeSession) {
      return {
        activePracticeSession: null,
        recentPracticeSessions: [],
        safeContextSummary: {
          hasActiveArtifactPractice: false,
          artifactIds: [],
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
    const recentSessions = (practiceState.recentPracticeSessions || []).slice(0, MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS);

    // Strip answer keys from the active session before returning to TutorTurnContext
    const safeSession = activeSession ? {
      ...activeSession,
      items: (activeSession.items || []).map((item: any) => {
        const safe = { ...item };
        delete safe.expectedAnswerSummary;
        return safe;
      }),
    } : null;

    const safeContextSummary: ArtifactAwarePracticeSafeContextSummary = {
      hasActiveArtifactPractice: true,
      artifactIds: (activeSession.artifactIds || []).slice(0, MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS),
      topic: activeSession.topic?.slice(0, 160) || null,
      skillIds: (activeSession.skillIds || []).slice(0, 20),
      currentDecision: activeSession.decision.currentDecision || null,
      misconceptionSummary: buildMisconceptionSummary(activeSession),
      nextActionPrompt: activeSession.decision.nextActionPrompt?.slice(0, 200) || null,
      dueReviewSummary: buildDueReviewSummary(activeSession),
      warnings: activeSession.safety.warnings.slice(0, 5),
    };

    return {
      activePracticeSession: safeSession as ArtifactAwarePracticeSession,
      recentPracticeSessions: recentSessions,
      safeContextSummary,
    };
  } catch (err) {
    warnings.push(`Failed to resolve artifact-aware practice context: ${String(err)}`);
    return {
      activePracticeSession: null,
      recentPracticeSessions: [],
      safeContextSummary: {
        hasActiveArtifactPractice: false,
        artifactIds: [],
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
