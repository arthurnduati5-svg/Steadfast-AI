// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice State Service v1
// Owns all artifact-aware practice state CRUD inside
// TutorState.artifactAwarePractice.
// Prevents cross-student leakage, fake progress/mastery.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeState,
  ArtifactAwarePracticeStatus,
  ArtifactAwarePracticeResponse,
  AnswerArtifactAwarePracticeRequest,
  ReviewArtifactAwarePracticeRequest,
  ArtifactAwarePracticeEvaluateResult,
} from './artifactAwarePracticeContracts';

import { MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS } from './artifactAwarePracticeContracts';

import { getTutorStateForLearner, upsertTutorStateForLearner } from './tutorStateService';
import type { TutorState } from './tutorStateContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get or create the artifact-aware practice state within TutorState.
 */
function getPracticeState(tutorState: TutorState): ArtifactAwarePracticeState {
  const existing = (tutorState as any).artifactAwarePractice;
  if (existing && typeof existing === 'object') {
    return existing as ArtifactAwarePracticeState;
  }
  return {
    activePracticeSession: null,
    recentPracticeSessions: [],
    updatedAt: nowISO(),
  };
}

/**
 * Persist artifact-aware practice state into TutorState and save.
 */
async function persistPracticeState(
  identity: ResolvedTutorIdentity,
  tutorState: TutorState,
  practiceState: ArtifactAwarePracticeState,
): Promise<void> {
  const updated: TutorState = {
    ...tutorState,
    artifactAwarePractice: {
      ...practiceState,
      updatedAt: nowISO(),
    } as any,
    updatedAt: nowISO(),
    stateVersion: tutorState.stateVersion + 1,
  };
  await upsertTutorStateForLearner(identity, updated);
}

/**
 * Add a session to recent practice sessions (bounded).
 */
function addToRecentPracticeSessions(
  sessions: ArtifactAwarePracticeSession[],
  session: ArtifactAwarePracticeSession,
): ArtifactAwarePracticeSession[] {
  const filtered = sessions.filter(
    (s) => s.artifactPracticeSessionId !== session.artifactPracticeSessionId,
  );
  return [session, ...filtered].slice(0, MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS);
}

// ── Public API ──

/**
 * Get the current artifact-aware practice state.
 */
export async function getArtifactAwarePracticeState(
  identity: ResolvedTutorIdentity,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);

  return {
    ok: true,
    status: practiceState.activePracticeSession?.status || 'not_started',
    activePracticeSession: practiceState.activePracticeSession || null,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings: [],
  };
}

/**
 * Create a new artifact-aware practice session (after generation).
 */
export async function createArtifactAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  session: ArtifactAwarePracticeSession,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);

  const now = nowISO();

  let recentSessions = practiceState.recentPracticeSessions || [];
  if (practiceState.activePracticeSession) {
    const archived = {
      ...practiceState.activePracticeSession,
      status: 'abandoned' as ArtifactAwarePracticeStatus,
      updatedAt: now,
    };
    recentSessions = addToRecentPracticeSessions(recentSessions, archived);
  }

  const newState: ArtifactAwarePracticeState = {
    activePracticeSession: session,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: session.status,
    activePracticeSession: session,
    recentPracticeSessions: recentSessions,
    warnings: [],
  };
}

/**
 * Answer a practice item within the active session.
 */
export async function answerArtifactAwarePracticeItem(
  identity: ResolvedTutorIdentity,
  request: AnswerArtifactAwarePracticeRequest,
  evaluateResult: ArtifactAwarePracticeEvaluateResult,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);
  const warnings: string[] = [];

  const active = practiceState.activePracticeSession;
  if (!active) {
    warnings.push('No active practice session.');
    return {
      ok: true,
      status: 'not_started',
      activePracticeSession: null,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  if (active.artifactPracticeSessionId !== request.artifactPracticeSessionId) {
    warnings.push('Practice session ID does not match active session.');
    return {
      ok: true,
      status: active.status,
      activePracticeSession: active,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  const now = nowISO();

  const updatedItems = active.items.map((item) => {
    if (item.practiceItemId === request.practiceItemId) {
      return {
        ...item,
        status: evaluateResult.status,
        learnerAnswerSummary: request.learnerAnswerSummary.slice(0, 1200),
        feedbackSummary: evaluateResult.feedbackSummary,
        answeredAt: now,
      };
    }
    return item;
  });

  const updatedMisconceptions = [
    ...active.misconceptionSummary,
    ...(evaluateResult.suspectedMisconceptions || []),
  ].slice(0, 10);

  const allAnswered = updatedItems.every((i) => i.status !== 'not_answered');
  const allCorrect = updatedItems.every((i) => i.status === 'correct');

  let newStatus: ArtifactAwarePracticeStatus;
  if (allCorrect && allAnswered) {
    newStatus = 'reviewed';
  } else if (allAnswered) {
    newStatus = 'answered';
  } else {
    newStatus = 'answered';
  }

  const updatedSession: ArtifactAwarePracticeSession = {
    ...active,
    items: updatedItems,
    misconceptionSummary: updatedMisconceptions,
    status: newStatus,
    updatedAt: now,
  };

  const newState: ArtifactAwarePracticeState = {
    ...practiceState,
    activePracticeSession: updatedSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: newStatus,
    activePracticeSession: updatedSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings,
  };
}

/**
 * Review a practice session.
 */
export async function reviewArtifactAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  request: ReviewArtifactAwarePracticeRequest,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);
  const warnings: string[] = [];

  const active = practiceState.activePracticeSession;
  if (!active) {
    warnings.push('No active practice session to review.');
    return {
      ok: true,
      status: 'not_started',
      activePracticeSession: null,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  if (active.artifactPracticeSessionId !== request.artifactPracticeSessionId) {
    warnings.push('Practice session ID mismatch.');
    return {
      ok: true,
      status: active.status,
      activePracticeSession: active,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  const now = nowISO();
  const updatedSession: ArtifactAwarePracticeSession = {
    ...active,
    status: 'reviewed',
    updatedAt: now,
  };

  const newState: ArtifactAwarePracticeState = {
    ...practiceState,
    activePracticeSession: updatedSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: 'reviewed',
    activePracticeSession: updatedSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings,
  };
}

/**
 * Complete a practice session.
 */
export async function completeArtifactAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  artifactPracticeSessionId: string,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);
  const warnings: string[] = [];

  const active = practiceState.activePracticeSession;
  if (!active) {
    warnings.push('No active practice session to complete.');
    return {
      ok: true,
      status: 'not_started',
      activePracticeSession: null,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  if (active.artifactPracticeSessionId !== artifactPracticeSessionId) {
    warnings.push('Practice session ID mismatch.');
    return {
      ok: true,
      status: active.status,
      activePracticeSession: active,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  const now = nowISO();
  const completed: ArtifactAwarePracticeSession = {
    ...active,
    status: 'completed',
    updatedAt: now,
  };

  const recentSessions = addToRecentPracticeSessions(
    practiceState.recentPracticeSessions || [],
    completed,
  );

  const newState: ArtifactAwarePracticeState = {
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: 'completed',
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    warnings,
  };
}

/**
 * Abandon a practice session.
 */
export async function abandonArtifactAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  artifactPracticeSessionId: string,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);
  const warnings: string[] = [];

  const active = practiceState.activePracticeSession;
  if (!active) {
    warnings.push('No active practice session to abandon.');
    return {
      ok: true,
      status: 'not_started',
      activePracticeSession: null,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  if (active.artifactPracticeSessionId !== artifactPracticeSessionId) {
    warnings.push('Practice session ID mismatch.');
    return {
      ok: true,
      status: active.status,
      activePracticeSession: active,
      recentPracticeSessions: practiceState.recentPracticeSessions || [],
      warnings,
    };
  }

  const now = nowISO();
  const abandoned: ArtifactAwarePracticeSession = {
    ...active,
    status: 'abandoned',
    updatedAt: now,
  };

  const recentSessions = addToRecentPracticeSessions(
    practiceState.recentPracticeSessions || [],
    abandoned,
  );

  const newState: ArtifactAwarePracticeState = {
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: 'abandoned',
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    warnings,
  };
}

/**
 * Update the active practice session (used by decision services).
 */
export async function updateArtifactAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  updatedSession: ArtifactAwarePracticeSession,
): Promise<ArtifactAwarePracticeResponse> {
  const tutorState = await getTutorStateForLearner(identity);
  const practiceState = getPracticeState(tutorState);

  const now = nowISO();
  const finalSession = {
    ...updatedSession,
    updatedAt: now,
  };

  const newState: ArtifactAwarePracticeState = {
    ...practiceState,
    activePracticeSession: finalSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, tutorState, newState);

  return {
    ok: true,
    status: finalSession.status,
    activePracticeSession: finalSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings: [],
  };
}
