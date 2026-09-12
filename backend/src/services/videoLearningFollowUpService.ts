// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Follow-Up Practice Service v1
// Recommends safe follow-up practice after video watching.
// Does not mark practice completed or mastery improved.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningSession,
  VideoLearningSessionResponse,
  VideoLearningSessionFollowUp,
  VideoFollowUpStatus,
} from './videoLearningSessionContracts';

import {
  getVideoLearningSessionState,
  persistVideoLearningSessionState,
} from './videoLearningSessionStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Generate a bounded next-practice prompt based on session context.
 * Does NOT call AI.  Does NOT mark mastery.  Uses deterministic rules.
 */
function generateNextPracticePrompt(session: VideoLearningSession): string | null {
  const topic = session.topic || session.subject;
  if (!topic) return null;

  const hasCheckpoints = session.checkpoints.length > 0;
  const allPassed = hasCheckpoints && session.checkpoints.every((c) => c.status === 'passed');

  if (allPassed) {
    return `You understood the "${topic}" video well. Try a practice set to reinforce what you learned.`;
  }

  const hasNeedsReview = session.checkpoints.some((c) => c.status === 'needs_review');
  if (hasNeedsReview) {
    return `You had some tricky parts in "${topic}". Let's review those concepts with targeted practice.`;
  }

  return `Now that you've watched "${session.title}", you can reinforce "${topic}" with practice.`;
}

/**
 * Find a session in the video state.
 */
function findSession(
  videoState: import('./videoLearningSessionContracts').VideoLearningSessionState,
  sessionVideoId: string,
): { session: VideoLearningSession | null; isActive: boolean } {
  if (videoState.activeVideoSession?.sessionVideoId === sessionVideoId) {
    return { session: videoState.activeVideoSession, isActive: true };
  }

  const found = videoState.recentVideoSessions.find(
    (s) => s.sessionVideoId === sessionVideoId,
  );
  return { session: found || null, isActive: false };
}

/**
 * Replace a session in the video state.
 */
function replaceSession(
  videoState: import('./videoLearningSessionContracts').VideoLearningSessionState,
  updated: VideoLearningSession,
): import('./videoLearningSessionContracts').VideoLearningSessionState {
  const now = nowISO();

  const activeVideoSession =
    videoState.activeVideoSession?.sessionVideoId === updated.sessionVideoId
      ? updated
      : videoState.activeVideoSession;

  const recentVideoSessions = videoState.recentVideoSessions.map((s) =>
    s.sessionVideoId === updated.sessionVideoId ? updated : s,
  );

  return {
    ...videoState,
    activeVideoSession,
    recentVideoSessions,
    updatedAt: now,
  };
}

// ── Public API ──

/**
 * Recommend follow-up practice for a completed/paused video session.
 * Does not mark practice completed or mastery improved.
 * Returns the updated session with follow-up info.
 */
export async function recommendVideoFollowUpPractice(
  identity: ResolvedTutorIdentity,
  sessionVideoId: string,
  options?: {
    practiceMasteryAvailable?: boolean;
    existingPracticeIds?: string[];
  },
): Promise<{ ok: boolean; session?: VideoLearningSession; warnings: string[] }> {
  const warnings: string[] = [];
  const videoState = await getVideoLearningSessionState(identity);

  const { session } = findSession(videoState, sessionVideoId);
  if (!session) {
    warnings.push(`Session ${sessionVideoId} not found.`);
    return { ok: true, warnings };
  }

  // Only recommend for completed or paused sessions
  if (session.status !== 'completed' && session.status !== 'paused') {
    warnings.push(
      `Follow-up practice can only be recommended for completed or paused sessions. Current status: ${session.status}.`,
    );
    return { ok: true, session, warnings };
  }

  // Check if already recommended
  if (session.followUp.status === 'completed') {
    warnings.push('Follow-up practice already completed for this session.');
    return { ok: true, session, warnings };
  }
  if (session.followUp.status === 'skipped') {
    warnings.push('Follow-up practice was skipped for this session.');
    return { ok: true, session, warnings };
  }

  const now = nowISO();
  const nextPracticePrompt = generateNextPracticePrompt(session);

  // Determine status based on session completion
  let followUpStatus: VideoFollowUpStatus;
  if (session.status === 'completed') {
    followUpStatus = 'recommended';
  } else {
    followUpStatus = 'recommended';
  }

  const existingPracticeIds = options?.existingPracticeIds || [];

  const followUp: VideoLearningSessionFollowUp = {
    status: followUpStatus,
    recommendedPracticeIds: existingPracticeIds.slice(0, 10),
    nextPracticePrompt: nextPracticePrompt?.slice(0, 300) || null,
    dueAt: now,
  };

  const updated: VideoLearningSession = {
    ...session,
    followUp,
    updatedAt: now,
  };

  const newState = replaceSession(videoState, updated);
  try {
    await persistVideoLearningSessionState(identity, newState);
  } catch {
    warnings.push('Failed to persist follow-up recommendation to TutorState.');
  }

  const activeSession = newState.activeVideoSession;
  return { ok: true, session: activeSession || updated, warnings };
}

/**
 * Mark follow-up practice as completed (called when learner completes practice).
 * Does NOT automatically improve mastery.
 */
export async function markVideoFollowUpCompleted(
  identity: ResolvedTutorIdentity,
  sessionVideoId: string,
): Promise<{ ok: boolean; session?: VideoLearningSession; warnings: string[] }> {
  const warnings: string[] = [];
  const videoState = await getVideoLearningSessionState(identity);

  const { session } = findSession(videoState, sessionVideoId);
  if (!session) {
    warnings.push(`Session ${sessionVideoId} not found.`);
    return { ok: true, warnings };
  }

  if (session.followUp.status === 'not_created') {
    warnings.push('No follow-up practice was created for this session.');
    return { ok: true, session, warnings };
  }

  const now = nowISO();
  const updated: VideoLearningSession = {
    ...session,
    followUp: {
      ...session.followUp,
      status: 'completed',
    },
    updatedAt: now,
  };

  const newState = replaceSession(videoState, updated);
  try {
    await persistVideoLearningSessionState(identity, newState);
  } catch {
    warnings.push('Failed to persist follow-up completion to TutorState.');
  }

  return { ok: true, session: newState.activeVideoSession || updated, warnings };
}

/**
 * Skip follow-up practice for a video session.
 */
export async function skipVideoFollowUp(
  identity: ResolvedTutorIdentity,
  sessionVideoId: string,
): Promise<{ ok: boolean; session?: VideoLearningSession; warnings: string[] }> {
  const warnings: string[] = [];
  const videoState = await getVideoLearningSessionState(identity);

  const { session } = findSession(videoState, sessionVideoId);
  if (!session) {
    warnings.push(`Session ${sessionVideoId} not found.`);
    return { ok: true, warnings };
  }

  const now = nowISO();
  const updated: VideoLearningSession = {
    ...session,
    followUp: {
      ...session.followUp,
      status: 'skipped',
    },
    updatedAt: now,
  };

  const newState = replaceSession(videoState, updated);
  try {
    await persistVideoLearningSessionState(identity, newState);
  } catch {
    warnings.push('Failed to persist follow-up skip to TutorState.');
  }

  return { ok: true, session: newState.activeVideoSession || updated, warnings };
}
