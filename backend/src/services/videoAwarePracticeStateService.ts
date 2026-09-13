// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice State Service v1
// Owns all video-aware practice state CRUD inside
// VideoLearningSessionState.videoAwarePractice.
// Prevents cross-student leakage, fake progress/mastery.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwarePracticeSession,
  VideoAwarePracticeState,
  VideoAwarePracticeStatus,
  VideoAwarePracticeResponse,
  GenerateVideoAwarePracticeRequest,
  AnswerVideoAwarePracticeRequest,
  ReviewVideoAwarePracticeRequest,
  VideoAwarePracticeItem,
  VideoAwareMisconception,
  VideoAwarePracticeEvaluateResult,
} from './videoAwarePracticeContracts';

import { MAX_RECENT_PRACTICE_SESSIONS } from './videoAwarePracticeContracts';

import {
  getVideoLearningSessionState,
  persistVideoLearningSessionState,
} from './videoLearningSessionStateService';
import type { VideoLearningSessionState } from './videoLearningSessionContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get or create the video-aware practice state within VideoLearningSessionState.
 */
function getPracticeState(videoState: VideoLearningSessionState): VideoAwarePracticeState {
  const existing = (videoState as any).videoAwarePractice;
  if (existing && typeof existing === 'object') {
    return existing as VideoAwarePracticeState;
  }
  return {
    activePracticeSession: null,
    recentPracticeSessions: [],
    updatedAt: nowISO(),
  };
}

/**
 * Persist video-aware practice state into VideoLearningSessionState and save.
 */
async function persistPracticeState(
  identity: ResolvedTutorIdentity,
  videoState: VideoLearningSessionState,
  practiceState: VideoAwarePracticeState,
): Promise<void> {
  const updated = {
    ...videoState,
    videoAwarePractice: {
      ...practiceState,
      updatedAt: nowISO(),
    },
  } as any;
  updated.updatedAt = nowISO();
  await persistVideoLearningSessionState(identity, updated as VideoLearningSessionState);
}

/**
 * Add a session to recent practice sessions (bounded).
 */
function addToRecentPracticeSessions(
  sessions: VideoAwarePracticeSession[],
  session: VideoAwarePracticeSession,
): VideoAwarePracticeSession[] {
  const filtered = sessions.filter(
    (s) => s.videoPracticeSessionId !== session.videoPracticeSessionId,
  );
  return [session, ...filtered].slice(0, MAX_RECENT_PRACTICE_SESSIONS);
}

// ── Public API ──

/**
 * Get the current video-aware practice state for a learner.
 */
export async function getVideoAwarePracticeState(
  identity: ResolvedTutorIdentity,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);

  return {
    ok: true,
    status: practiceState.activePracticeSession?.status || 'not_started',
    activePracticeSession: practiceState.activePracticeSession || null,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings: [],
  };
}

/**
 * Create a new video-aware practice session (after generation).
 */
export async function createVideoAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  session: VideoAwarePracticeSession,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);

  const now = nowISO();

  // Archive any existing active session
  let recentSessions = practiceState.recentPracticeSessions || [];
  if (practiceState.activePracticeSession) {
    const archived = {
      ...practiceState.activePracticeSession,
      status: 'abandoned' as VideoAwarePracticeStatus,
      updatedAt: now,
    };
    recentSessions = addToRecentPracticeSessions(recentSessions, archived);
  }

  const newState: VideoAwarePracticeState = {
    activePracticeSession: session,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

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
export async function answerVideoAwarePracticeItem(
  identity: ResolvedTutorIdentity,
  request: AnswerVideoAwarePracticeRequest,
  evaluateResult: VideoAwarePracticeEvaluateResult,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);
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

  if (active.videoPracticeSessionId !== request.videoPracticeSessionId) {
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

  // Update the specific item
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

  // Update misconceptions
  const updatedMisconceptions = [
    ...active.misconceptionSummary,
    ...(evaluateResult.suspectedMisconceptions || []),
  ].slice(0, 10);

  // Determine new status
  const allAnswered = updatedItems.every((i) => i.status !== 'not_answered');
  const hasIncorrect = updatedItems.some(
    (i) => i.status === 'incorrect' || i.status === 'needs_review',
  );
  const allCorrect = updatedItems.every((i) => i.status === 'correct');

  let newStatus: VideoAwarePracticeStatus;
  if (allCorrect) {
    newStatus = 'reviewed';
  } else if (allAnswered && hasIncorrect) {
    newStatus = 'answered';
  } else if (allAnswered) {
    newStatus = 'answered';
  } else {
    newStatus = 'answered';
  }

  const updatedSession: VideoAwarePracticeSession = {
    ...active,
    items: updatedItems,
    misconceptionSummary: updatedMisconceptions,
    status: newStatus,
    updatedAt: now,
  };

  const newState: VideoAwarePracticeState = {
    ...practiceState,
    activePracticeSession: updatedSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

  return {
    ok: true,
    status: newStatus,
    activePracticeSession: updatedSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings,
  };
}

/**
 * Review a practice session (trigger decision + update).
 */
export async function reviewVideoAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  request: ReviewVideoAwarePracticeRequest,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);
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

  if (active.videoPracticeSessionId !== request.videoPracticeSessionId) {
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
  const updatedSession: VideoAwarePracticeSession = {
    ...active,
    status: 'reviewed',
    updatedAt: now,
  };

  const newState: VideoAwarePracticeState = {
    ...practiceState,
    activePracticeSession: updatedSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

  return {
    ok: true,
    status: 'reviewed',
    activePracticeSession: updatedSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings,
  };
}

/**
 * Complete a practice session (mark completed, archive as recent).
 */
export async function completeVideoAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  videoPracticeSessionId: string,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);
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

  if (active.videoPracticeSessionId !== videoPracticeSessionId) {
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
  const completed: VideoAwarePracticeSession = {
    ...active,
    status: 'completed',
    updatedAt: now,
  };

  const recentSessions = addToRecentPracticeSessions(
    practiceState.recentPracticeSessions || [],
    completed,
  );

  const newState: VideoAwarePracticeState = {
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

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
export async function abandonVideoAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  videoPracticeSessionId: string,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);
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

  if (active.videoPracticeSessionId !== videoPracticeSessionId) {
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
  const abandoned: VideoAwarePracticeSession = {
    ...active,
    status: 'abandoned',
    updatedAt: now,
  };

  const recentSessions = addToRecentPracticeSessions(
    practiceState.recentPracticeSessions || [],
    abandoned,
  );

  const newState: VideoAwarePracticeState = {
    activePracticeSession: null,
    recentPracticeSessions: recentSessions,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

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
export async function updateVideoAwarePracticeSession(
  identity: ResolvedTutorIdentity,
  updatedSession: VideoAwarePracticeSession,
): Promise<VideoAwarePracticeResponse> {
  const videoState = await getVideoLearningSessionState(identity);
  const practiceState = getPracticeState(videoState);

  const now = nowISO();
  const finalSession = {
    ...updatedSession,
    updatedAt: now,
  };

  const newState: VideoAwarePracticeState = {
    ...practiceState,
    activePracticeSession: finalSession,
    updatedAt: now,
  };

  await persistPracticeState(identity, videoState, newState);

  return {
    ok: true,
    status: finalSession.status,
    activePracticeSession: finalSession,
    recentPracticeSessions: practiceState.recentPracticeSessions || [],
    warnings: [],
  };
}
