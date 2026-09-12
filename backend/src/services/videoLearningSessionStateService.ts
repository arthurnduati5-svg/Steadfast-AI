// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session State Service v1
// Owns all video learning session state CRUD and transitions.
// Stores state inside TutorState.videoLearningSession.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningSession,
  VideoLearningSessionState,
  VideoLearningSessionStatus,
  VideoLearningSessionResponse,
  VideoLearningSessionIdentity,
  SelectVideoLearningSessionRequest,
  UpdateVideoLearningProgressRequest,
  CreateVideoLearningCheckpointRequest,
  AnswerVideoLearningCheckpointRequest,
  CompleteVideoLearningSessionRequest,
  VideoLearningProgressSource,
  VideoLearningCheckpoint,
} from './videoLearningSessionContracts';

import { getTutorStateForLearner, upsertTutorStateForLearner } from './tutorStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Constants ──
const MAX_RECENT_SESSIONS = 5;
const MAX_RECOMMENDED_SESSIONS = 10;

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `vls_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

// ── Allowed state transitions ──

const ALLOWED_TRANSITIONS: Record<VideoLearningSessionStatus, VideoLearningSessionStatus[]> = {
  recommended: ['selected', 'cleared'],
  selected: ['active', 'paused', 'abandoned', 'cleared'],
  active: ['paused', 'completed', 'abandoned', 'cleared'],
  paused: ['active', 'abandoned', 'completed', 'cleared'],
  completed: ['cleared'],
  abandoned: ['cleared'],
  cleared: [],
};

function isAllowedTransition(
  from: VideoLearningSessionStatus,
  to: VideoLearningSessionStatus,
): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ── Build default empty state ──

function buildEmptyState(): VideoLearningSessionState {
  return {
    activeVideoSession: null,
    recentVideoSessions: [],
    recommendedVideoSessions: [],
    updatedAt: nowISO(),
  };
}

// ── Get current video learning session state from TutorState ──

async function getVideoState(
  identity: ResolvedTutorIdentity,
): Promise<VideoLearningSessionState> {
  const tutorState = await getTutorStateForLearner(identity);
  const raw = (tutorState as any).videoLearningSession;
  if (raw && typeof raw === 'object') {
    return raw as VideoLearningSessionState;
  }
  return buildEmptyState();
}

// ── Persist video learning session state to TutorState ──

async function persistVideoState(
  identity: ResolvedTutorIdentity,
  videoState: VideoLearningSessionState,
): Promise<void> {
  const tutorState = await getTutorStateForLearner(identity);
  const updated = {
    ...tutorState,
    videoLearningSession: videoState,
  } as any;
  updated.updatedAt = nowISO();
  // Increment version to indicate state change
  updated.stateVersion = (tutorState.stateVersion || 0) + 1;
  await upsertTutorStateForLearner(identity, updated);
}

// ── Add to recent sessions (bounded) ──

function addToRecentSessions(
  sessions: VideoLearningSession[],
  session: VideoLearningSession,
): VideoLearningSession[] {
  const filtered = sessions.filter((s) => s.sessionVideoId !== session.sessionVideoId);
  const updated = [session, ...filtered];
  return updated.slice(0, MAX_RECENT_SESSIONS);
}

function addToRecommendedSessions(
  sessions: VideoLearningSession[],
  session: VideoLearningSession,
): VideoLearningSession[] {
  const filtered = sessions.filter((s) => s.sessionVideoId !== session.sessionVideoId);
  const updated = [session, ...filtered];
  return updated.slice(0, MAX_RECOMMENDED_SESSIONS);
}

function buildSessionFromSelect(
  identity: VideoLearningSessionIdentity,
  request: SelectVideoLearningSessionRequest,
): VideoLearningSession {
  const now = nowISO();
  const sessionVideoId = generateId();

  return {
    sessionVideoId,
    tutorSessionId: identity.sessionId || request.sessionId || null,

    provider: request.provider || null,
    providerVideoId: request.providerVideoId || null,
    canonicalUrl: request.canonicalUrl || null,

    title: request.title,
    channelTitle: request.channelTitle || null,
    thumbnailUrl: request.thumbnailUrl || null,
    durationSeconds: request.durationSeconds ?? null,

    status: 'selected',

    subject: request.subject || null,
    topic: request.topic || null,
    skillIds: uniqueStrings(request.skillIds || []),
    syllabusObjectiveIds: [],
    activeArtifactIds: uniqueStrings(request.activeArtifactIds || []),

    triggerMessage: null,
    triggerIntent: null,
    triggerTaskKind: null,

    recommendationId: request.recommendationId || null,
    recommendationReasons: (request.recommendationReasons || []).slice(0, 10),
    recommendationWarnings: (request.recommendationWarnings || []).slice(0, 10),

    safety: {
      sourceTrustStatus: request.safety?.sourceTrustStatus || null,
      ageSuitabilityStatus: request.safety?.ageSuitabilityStatus || null,
      islamicAppropriatenessStatus: request.safety?.islamicAppropriatenessStatus || null,
      languageSuitabilityStatus: request.safety?.languageSuitabilityStatus || null,
      needsTeacherReview: request.safety?.needsTeacherReview ?? false,
      warnings: (request.safety?.warnings || []).slice(0, 10),
    },

    progress: {
      watchedSeconds: null,
      watchedPercent: null,
      lastKnownPositionSeconds: null,
      completedAt: null,
      updatedAt: now,
      source: 'learner_selected',
    },

    checkpoints: [],

    followUp: {
      status: 'not_created',
      recommendedPracticeIds: [],
      nextPracticePrompt: null,
      dueAt: null,
    },

    createdAt: now,
    updatedAt: now,
  };
}

// ── Public API ──

/**
 * Get the full VideoLearningSessionState for a learner.
 */
export async function getVideoLearningSessionState(
  identity: ResolvedTutorIdentity,
): Promise<VideoLearningSessionState> {
  return getVideoState(identity);
}

/**
 * Select a video for learning (learner chose a recommended video).
 * Creates a new VideoLearningSession with status 'selected'.
 * If an existing active session exists for the same video, updates it.
 */
export async function selectVideoLearningSession(
  identity: ResolvedTutorIdentity,
  request: SelectVideoLearningSessionRequest,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const vlsIdentity: VideoLearningSessionIdentity = {
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    sessionId: request.sessionId || null,
  };

  const newSession = buildSessionFromSelect(vlsIdentity, request);

  // Check for existing session with same providerVideoId
  let activeVideoSession = videoState.activeVideoSession;
  if (activeVideoSession && activeVideoSession.providerVideoId && request.providerVideoId) {
    if (activeVideoSession.providerVideoId === request.providerVideoId) {
      // Same video - update existing session
      const updatedStatus: VideoLearningSessionStatus =
        activeVideoSession.status === 'completed' || activeVideoSession.status === 'abandoned'
          ? 'selected'
          : 'active';

      const updated: VideoLearningSession = {
        ...activeVideoSession,
        status: updatedStatus,
        title: request.title,
        channelTitle: request.channelTitle || activeVideoSession.channelTitle,
        subject: request.subject || activeVideoSession.subject,
        topic: request.topic || activeVideoSession.topic,
        skillIds: uniqueStrings([...activeVideoSession.skillIds, ...(request.skillIds || [])]),
        activeArtifactIds: uniqueStrings([...activeVideoSession.activeArtifactIds, ...(request.activeArtifactIds || [])]),
        recommendationReasons: [...new Set([...activeVideoSession.recommendationReasons, ...(request.recommendationReasons || [])])].slice(0, 10),
        progress: {
          ...activeVideoSession.progress,
          updatedAt: nowISO(),
          source: 'learner_selected',
        },
        updatedAt: nowISO(),
      };

      const recentSessions = addToRecentSessions(videoState.recentVideoSessions, updated);
      const recommendedSessions = addToRecommendedSessions(videoState.recommendedVideoSessions, newSession);

      const newState: VideoLearningSessionState = {
        activeVideoSession: updated,
        recentVideoSessions: recentSessions,
        recommendedVideoSessions: recommendedSessions,
        updatedAt: nowISO(),
      };

      await persistVideoState(identity, newState);
      return { ok: true, state: newState, activeVideoSession: updated, warnings };
    }

    // Different video - move current active to recent, set new active
    const archivedSession = { ...activeVideoSession, status: 'paused' as VideoLearningSessionStatus, updatedAt: nowISO() };
    const recentWithArchived = addToRecentSessions(videoState.recentVideoSessions, archivedSession);

    const recentSessions = addToRecentSessions(recentWithArchived, newSession);
    const recommendedSessions = addToRecommendedSessions(videoState.recommendedVideoSessions, newSession);

    const newState: VideoLearningSessionState = {
      activeVideoSession: newSession,
      recentVideoSessions: recentSessions,
      recommendedVideoSessions: recommendedSessions,
      updatedAt: nowISO(),
    };

    await persistVideoState(identity, newState);
    return { ok: true, state: newState, activeVideoSession: newSession, warnings };
  }

  // No active session - set this as active
  const recentSessions = addToRecentSessions(videoState.recentVideoSessions, newSession);
  const recommendedSessions = addToRecommendedSessions(videoState.recommendedVideoSessions, newSession);

  const newState: VideoLearningSessionState = {
    activeVideoSession: newSession,
    recentVideoSessions: recentSessions,
    recommendedVideoSessions: recommendedSessions,
    updatedAt: nowISO(),
  };

  await persistVideoState(identity, newState);
  return { ok: true, state: newState, activeVideoSession: newSession, warnings };
}

/**
 * Update watch progress for an active video session.
 */
export async function updateVideoLearningProgress(
  identity: ResolvedTutorIdentity,
  request: UpdateVideoLearningProgressRequest,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const [activeSession, sessionIndex] = findSession(videoState, request.sessionVideoId);
  if (!activeSession) {
    warnings.push(`Session ${request.sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (activeSession.status === 'completed' || activeSession.status === 'abandoned' || activeSession.status === 'cleared') {
    warnings.push(`Cannot update progress on session with status ${activeSession.status}.`);
    return { ok: true, state: videoState, activeVideoSession: activeSession, warnings };
  }

  const now = nowISO();
  const source: VideoLearningProgressSource = request.source || 'watch_progress';

  // Update progress
  const updatedProgress = {
    watchedSeconds: request.watchedSeconds !== undefined ? request.watchedSeconds : (activeSession.progress.watchedSeconds ?? null),
    watchedPercent: request.watchedPercent !== undefined ? request.watchedPercent : (activeSession.progress.watchedPercent ?? null),
    lastKnownPositionSeconds: request.lastKnownPositionSeconds !== undefined ? request.lastKnownPositionSeconds : (activeSession.progress.lastKnownPositionSeconds ?? null),
    completedAt: activeSession.progress.completedAt,
    updatedAt: now,
    source,
  };

  // If watchedPercent >= 100, auto-transition to paused (not completed!)
  let newStatus: VideoLearningSessionStatus = activeSession.status;
  if (activeSession.status === 'selected') {
    newStatus = 'active';
  }

  const updated: VideoLearningSession = {
    ...activeSession,
    status: newStatus,
    progress: updatedProgress,
    updatedAt: now,
  };

  const newState = replaceSessionInState(videoState, updated);
  await persistVideoState(identity, newState);

  return { ok: true, state: newState, activeVideoSession: updated, warnings };
}

/**
 * Pause an active video session.
 */
export async function pauseVideoLearningSession(
  identity: ResolvedTutorIdentity,
  sessionVideoId: string,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const [session] = findSession(videoState, sessionVideoId);
  if (!session) {
    warnings.push(`Session ${sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (!isAllowedTransition(session.status, 'paused')) {
    warnings.push(`Cannot pause session in status ${session.status}.`);
    return { ok: true, state: videoState, activeVideoSession: session, warnings };
  }

  const now = nowISO();
  const updated: VideoLearningSession = {
    ...session,
    status: 'paused',
    progress: { ...session.progress, updatedAt: now, source: session.progress.source },
    updatedAt: now,
  };

  const newState = replaceSessionInState(videoState, updated);
  await persistVideoState(identity, newState);

  return { ok: true, state: newState, activeVideoSession: updated, warnings };
}

/**
 * Complete an active video session.
 */
export async function completeVideoLearningSession(
  identity: ResolvedTutorIdentity,
  request: CompleteVideoLearningSessionRequest,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const [session] = findSession(videoState, request.sessionVideoId);
  if (!session) {
    warnings.push(`Session ${request.sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (!isAllowedTransition(session.status, 'completed')) {
    warnings.push(`Cannot complete session in status ${session.status}.`);
    return { ok: true, state: videoState, activeVideoSession: session, warnings };
  }

  const now = nowISO();
  const progressSource: VideoLearningProgressSource = 'learner_reported';

  const updated: VideoLearningSession = {
    ...session,
    status: 'completed',
    progress: {
      watchedSeconds: request.watchedSeconds !== undefined ? request.watchedSeconds : (session.progress.watchedSeconds ?? null),
      watchedPercent: request.watchedPercent !== undefined ? request.watchedPercent : (session.progress.watchedPercent ?? 100),
      lastKnownPositionSeconds: session.progress.lastKnownPositionSeconds,
      completedAt: now,
      updatedAt: now,
      source: progressSource,
    },
    updatedAt: now,
  };

  const newState = replaceSessionInState(videoState, updated);
  await persistVideoState(identity, newState);

  return { ok: true, state: newState, activeVideoSession: updated, warnings };
}

/**
 * Abandon an active video session.
 */
export async function abandonVideoLearningSession(
  identity: ResolvedTutorIdentity,
  sessionVideoId: string,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const [session] = findSession(videoState, sessionVideoId);
  if (!session) {
    warnings.push(`Session ${sessionVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (!isAllowedTransition(session.status, 'abandoned')) {
    warnings.push(`Cannot abandon session in status ${session.status}.`);
    return { ok: true, state: videoState, activeVideoSession: session, warnings };
  }

  const now = nowISO();
  const updated: VideoLearningSession = {
    ...session,
    status: 'abandoned',
    updatedAt: now,
  };

  const newState = replaceSessionInState(videoState, updated);
  await persistVideoState(identity, newState);

  return { ok: true, state: newState, activeVideoSession: updated, warnings };
}

/**
 * Clear a video session (removes from active, keeps in history).
 */
export async function clearActiveVideoLearningSession(
  identity: ResolvedTutorIdentity,
  sessionVideoId?: string | null,
): Promise<VideoLearningSessionResponse> {
  const warnings: string[] = [];
  const videoState = await getVideoState(identity);

  const targetVideoId = sessionVideoId || videoState.activeVideoSession?.sessionVideoId;
  if (!targetVideoId) {
    warnings.push('No active video session to clear.');
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  const [session] = findSession(videoState, targetVideoId);
  if (!session) {
    warnings.push(`Session ${targetVideoId} not found.`);
    return { ok: true, state: videoState, activeVideoSession: null, warnings };
  }

  if (!isAllowedTransition(session.status, 'cleared')) {
    warnings.push(`Cannot clear session in status ${session.status}.`);
    return { ok: true, state: videoState, activeVideoSession: session, warnings };
  }

  const now = nowISO();
  const cleared: VideoLearningSession = {
    ...session,
    status: 'cleared',
    updatedAt: now,
  };

  // Keep in recent sessions but remove from active
  const recentSessions = addToRecentSessions(videoState.recentVideoSessions, cleared);

  const newState: VideoLearningSessionState = {
    ...videoState,
    activeVideoSession: null,
    recentVideoSessions: recentSessions,
    updatedAt: now,
  };

  await persistVideoState(identity, newState);
  return { ok: true, state: newState, activeVideoSession: null, warnings };
}

// ── Internal helpers ──

function findSession(
  videoState: VideoLearningSessionState,
  sessionVideoId: string,
): [VideoLearningSession | null, number] {
  // Check active first
  if (videoState.activeVideoSession?.sessionVideoId === sessionVideoId) {
    return [videoState.activeVideoSession, -1];
  }

  // Check recent
  const recentIdx = videoState.recentVideoSessions.findIndex((s) => s.sessionVideoId === sessionVideoId);
  if (recentIdx >= 0) {
    return [videoState.recentVideoSessions[recentIdx], recentIdx];
  }

  return [null, -1];
}

function replaceSessionInState(
  videoState: VideoLearningSessionState,
  updated: VideoLearningSession,
): VideoLearningSessionState {
  const now = nowISO();

  // Update active if this is the active session
  let activeVideoSession = videoState.activeVideoSession;
  if (activeVideoSession?.sessionVideoId === updated.sessionVideoId) {
    activeVideoSession = updated;
  }

  // Update in recent sessions
  const recentSessions = videoState.recentVideoSessions.map((s) =>
    s.sessionVideoId === updated.sessionVideoId ? updated : s,
  );

  // Ensure updated session is in recent sessions
  const finalRecentSessions = addToRecentSessions(recentSessions, updated);

  return {
    ...videoState,
    activeVideoSession,
    recentVideoSessions: finalRecentSessions,
    updatedAt: now,
  };
}

// ── Persist video learning session state (used by other services) ──
export async function persistVideoLearningSessionState(
  identity: ResolvedTutorIdentity,
  state: VideoLearningSessionState,
): Promise<void> {
  await persistVideoState(identity, state);
}

/**
 * @deprecated Use persistVideoLearningSessionState instead.
 * Kept for test compatibility.
 */
export const setVideoLearningSessionStateForTest = persistVideoLearningSessionState;
