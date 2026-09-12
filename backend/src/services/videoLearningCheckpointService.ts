// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Checkpoint Service v1
// Creates and processes comprehension checkpoints linked to
// video sessions.  Deterministic v1 scoring.  No mastery mutation.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningSession,
  VideoLearningSessionResponse,
  VideoLearningCheckpoint,
  VideoLearningCheckpointStatus,
  CreateVideoLearningCheckpointRequest,
  AnswerVideoLearningCheckpointRequest,
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

function generateId(): string {
  return `vlc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * V1 deterministic scoring for checkpoint answers.
 * No LLM grading.  No mastery mutation.
 */
function scoreCheckpointAnswer(
  learnerAnswer: string,
  expectedAnswer?: string | null,
): { status: VideoLearningCheckpointStatus; needsReview: boolean } {
  const answer = (learnerAnswer || '').trim().toLowerCase();

  // Empty answer is a validation error — handled upstream
  if (!answer) {
    return { status: 'needs_review', needsReview: true };
  }

  // "I don't know" or equivalent => needs_review
  const dontKnowPatterns = [
    /^i don'?t know/,
    /^i do not know/,
    /^not sure/,
    /^no idea/,
    /^i (haven'?t|have not) (watched|seen|understood)/,
    /^i don'?t understand/,
    /^can you explain/,
    /^what is the answer/,
    /^\?$/,
  ];

  for (const pattern of dontKnowPatterns) {
    if (pattern.test(answer)) {
      return { status: 'needs_review', needsReview: true };
    }
  }

  // If no expected answer, mark as answered (needs teacher review)
  if (!expectedAnswer || !expectedAnswer.trim()) {
    return { status: 'answered', needsReview: true };
  }

  // Simple keyword overlap check (v1 deterministic)
  const expectedLower = expectedAnswer.toLowerCase();
  const answerWords = answer.split(/\s+/).filter((w) => w.length > 3);
  const expectedWords = expectedLower.split(/\s+/).filter((w) => w.length > 3);

  if (answerWords.length === 0) {
    return { status: 'needs_review', needsReview: true };
  }

  // Count overlapping meaningful words
  let overlapCount = 0;
  for (const word of answerWords) {
    if (expectedWords.includes(word)) {
      overlapCount++;
    }
  }

  const overlapRatio = overlapCount / Math.min(answerWords.length, expectedWords.length);

  if (overlapRatio >= 0.3) {
    return { status: 'passed', needsReview: false };
  }

  return { status: 'needs_review', needsReview: true };
}

/**
 * Find a session in the video state by sessionVideoId.
 * Returns the session and whether it is the active session.
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
 * Replace a session in the video state with an updated version.
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
 * Create a new checkpoint for a video session.
 */
export async function createVideoLearningCheckpoint(
  identity: ResolvedTutorIdentity,
  request: CreateVideoLearningCheckpointRequest,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoLearningSessionState(identity);

  const { session } = findSession(videoState, request.sessionVideoId);
  if (!session) {
    warnings.push(`Session ${request.sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (session.status === 'completed' || session.status === 'abandoned' || session.status === 'cleared') {
    warnings.push(`Cannot create checkpoint for session with status ${session.status}.`);
    return { ok: true, state: videoState, activeVideoSession: videoState.activeVideoSession, warnings };
  }

  const now = nowISO();
  const checkpoint: VideoLearningCheckpoint = {
    checkpointId: generateId(),
    videoTimestampSeconds: request.videoTimestampSeconds ?? null,
    topic: request.topic?.trim().slice(0, 160) || null,
    prompt: request.prompt.trim().slice(0, 500),
    expectedAnswerSummary: request.expectedAnswerSummary?.trim().slice(0, 800) || null,
    learnerAnswerSummary: null,
    status: 'asked',
    createdAt: now,
    answeredAt: null,
  };

  const updated: VideoLearningSession = {
    ...session,
    checkpoints: [...session.checkpoints, checkpoint],
    updatedAt: now,
  };

  const newState = replaceSession(videoState, updated);
  await persistVideoLearningSessionState(identity, newState);

  return { ok: true, state: newState, activeVideoSession: newState.activeVideoSession, warnings };
}

/**
 * Answer (submit learner response to) a checkpoint.
 */
export async function answerVideoLearningCheckpoint(
  identity: ResolvedTutorIdentity,
  request: AnswerVideoLearningCheckpointRequest,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoLearningSessionState(identity);

  const { session } = findSession(videoState, request.sessionVideoId);
  if (!session) {
    warnings.push(`Session ${request.sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  const checkpointIndex = session.checkpoints.findIndex(
    (c) => c.checkpointId === request.checkpointId,
  );
  if (checkpointIndex < 0) {
    warnings.push(`Checkpoint ${request.checkpointId} not found in session ${request.sessionVideoId}.`);
    return { ok: true, state: videoState, activeVideoSession: videoState.activeVideoSession, warnings };
  }

  const existingCheckpoint = session.checkpoints[checkpointIndex];
  if (existingCheckpoint.status === 'passed') {
    warnings.push('Checkpoint already passed.');
    return { ok: true, state: videoState, activeVideoSession: videoState.activeVideoSession, warnings };
  }

  const now = nowISO();
  const scoring = scoreCheckpointAnswer(
    request.learnerAnswerSummary,
    existingCheckpoint.expectedAnswerSummary,
  );

  const updatedCheckpoint: VideoLearningCheckpoint = {
    ...existingCheckpoint,
    learnerAnswerSummary: request.learnerAnswerSummary.trim().slice(0, 1200),
    status: scoring.status,
    answeredAt: now,
  };

  const updatedCheckpoints = [...session.checkpoints];
  updatedCheckpoints[checkpointIndex] = updatedCheckpoint;

  const updated: VideoLearningSession = {
    ...session,
    checkpoints: updatedCheckpoints,
    updatedAt: now,
  };

  const newState = replaceSession(videoState, updated);
  try {
    await persistVideoLearningSessionState(identity, newState);
  } catch {
    warnings.push('Failed to persist checkpoint answer to TutorState.');
  }

  return { ok: true, state: newState, activeVideoSession: newState.activeVideoSession, warnings };
}
