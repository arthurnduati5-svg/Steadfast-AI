// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session Resolver v1
// Resolves active video learning context for TutorTurnContext
// and chat prompt assembly.  Safe, bounded, no raw transcripts.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningSession,
  VideoLearningSessionState,
  VideoLearningSessionResolverOutput,
  VideoLearningSessionSafeContextSummary,
} from './videoLearningSessionContracts';

import { getVideoLearningSessionState } from './videoLearningSessionStateService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

const MAX_RECENT_FOR_CONTEXT = 5;

/**
 * Build a bounded, safe text summary of session progress.
 */
function buildProgressSummary(session: VideoLearningSession): string | null {
  const p = session.progress;
  const parts: string[] = [];

  if (p.watchedPercent != null && p.watchedPercent >= 0) {
    parts.push(`Watched ${Math.round(p.watchedPercent)}%`);
  }
  if (p.watchedSeconds != null && p.watchedSeconds >= 0) {
    const mins = Math.floor(p.watchedSeconds / 60);
    const secs = p.watchedSeconds % 60;
    parts.push(`${mins}m ${secs}s watched`);
  }
  if (p.lastKnownPositionSeconds != null && p.lastKnownPositionSeconds >= 0) {
    const mins = Math.floor(p.lastKnownPositionSeconds / 60);
    const secs = p.lastKnownPositionSeconds % 60;
    parts.push(`Position: ${mins}m ${secs}s`);
  }
  if (session.status === 'completed' && p.completedAt) {
    parts.push('Completed');
  }
  if (session.status === 'paused') {
    parts.push('Paused');
  }

  return parts.length > 0 ? parts.join(' — ') : null;
}

/**
 * Build a bounded, safe text summary of checkpoints.
 */
function buildCheckpointSummary(session: VideoLearningSession): string | null {
  const checkpoints = session.checkpoints;
  if (checkpoints.length === 0) return null;

  const answered = checkpoints.filter((c) => c.status === 'answered' || c.status === 'passed');
  const needsReview = checkpoints.filter((c) => c.status === 'needs_review');
  const parts: string[] = [];

  if (answered.length > 0) {
    parts.push(`${answered.length} checkpoint(s) answered`);
  }
  if (needsReview.length > 0) {
    parts.push(`${needsReview.length} checkpoint(s) need review`);
  }
  const unanswered = checkpoints.filter((c) => c.status === 'asked');
  if (unanswered.length > 0) {
    parts.push(`${unanswered.length} pending checkpoint(s)`);
  }

  return parts.length > 0 ? parts.join(' — ') : null;
}

/**
 * Build a bounded, safe text summary of follow-up state.
 */
function buildFollowUpSummary(session: VideoLearningSession): string | null {
  const fu = session.followUp;
  if (fu.status === 'not_created') return null;
  if (fu.status === 'skipped') return 'Follow-up practice skipped';

  const parts: string[] = [];
  if (fu.status === 'recommended' || fu.status === 'assigned') {
    parts.push(`Follow-up ${fu.status}`);
  }
  if (fu.nextPracticePrompt) {
    parts.push(`Prompt: ${fu.nextPracticePrompt.slice(0, 120)}`);
  }
  if (fu.recommendedPracticeIds.length > 0) {
    parts.push(`${fu.recommendedPracticeIds.length} practice item(s) available`);
  }

  return parts.length > 0 ? parts.join(' — ') : 'Follow-up available';
}

/**
 * Resolve active video learning context for TutorTurnContext.
 * Returns safe, bounded summaries only.
 * Never returns raw transcript.  Never returns unsafe rejected videos as active.
 */
export async function resolveVideoLearningSessionContext(
  identity: ResolvedTutorIdentity,
): Promise<VideoLearningSessionResolverOutput> {
  let videoState: VideoLearningSessionState;
  try {
    videoState = await getVideoLearningSessionState(identity);
  } catch (err) {
    // Return empty state if resolution fails
    return {
      activeVideoSession: null,
      recentVideoSessions: [],
      safeContextSummary: {
        hasActiveVideo: false,
        skillIds: [],
        warnings: [`Failed to resolve video learning session state: ${String(err)}`],
      },
    };
  }

  const warnings: string[] = [];
  const activeSession = videoState.activeVideoSession ?? null;

  // Safety: if active session is needs_review and not teacher-approved, don't expose as safe
  let safeActiveSession: typeof activeSession = activeSession;
  if (activeSession) {
    if (activeSession.safety.needsTeacherReview && activeSession.status !== 'completed') {
      warnings.push('Active video session requires teacher review — limited context available.');
      safeActiveSession = null;
    }
  }

  // Bound recent sessions
  const recentSessions = (videoState.recentVideoSessions || []).slice(0, MAX_RECENT_FOR_CONTEXT);

  // Build safe context summary
  const safeContextSummary: VideoLearningSessionSafeContextSummary = {
    hasActiveVideo: safeActiveSession !== null,
    title: safeActiveSession?.title?.slice(0, 200) || null,
    topic: safeActiveSession?.topic?.slice(0, 160) || null,
    skillIds: safeActiveSession?.skillIds?.slice(0, 20) || [],
    progressSummary: safeActiveSession ? buildProgressSummary(safeActiveSession) : null,
    checkpointSummary: safeActiveSession ? buildCheckpointSummary(safeActiveSession) : null,
    followUpSummary: safeActiveSession ? buildFollowUpSummary(safeActiveSession) : null,
    warnings,
  };

  // Add any safety warnings from the active session
  if (activeSession?.safety.warnings && activeSession.safety.warnings.length > 0) {
    safeContextSummary.warnings.push(...activeSession.safety.warnings.slice(0, 3));
  }

  return {
    activeVideoSession: safeActiveSession,
    recentVideoSessions: recentSessions,
    safeContextSummary,
  };
}
