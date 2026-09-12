// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session Event Service v1
// Writes bounded video learning events for post-turn tracking.
// No raw transcripts. No raw metadata dumps. No mastery mutation.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningSession,
  VideoLearningSessionStatus,
} from './videoLearningSessionContracts';

import { learningEventService } from './learningEventService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export type VideoLearningSessionEventKind =
  | 'video_recommended'
  | 'video_selected'
  | 'video_progress_updated'
  | 'video_checkpoint_created'
  | 'video_checkpoint_answered'
  | 'video_completed'
  | 'video_abandoned'
  | 'video_cleared'
  | 'video_follow_up_recommended';

export interface VideoLearningSessionEventResult {
  eventWritten: boolean;
  eventId?: string;
  warnings: string[];
}

/**
 * Map video session status to event kind.
 */
function statusToEventKind(
  status: VideoLearningSessionStatus,
): VideoLearningSessionEventKind | null {
  switch (status) {
    case 'recommended':
      return 'video_recommended';
    case 'selected':
      return 'video_selected';
    case 'completed':
      return 'video_completed';
    case 'abandoned':
      return 'video_abandoned';
    case 'cleared':
      return 'video_cleared';
    default:
      return null;
  }
}

/**
 * Write a bounded video learning event.
 * Event failure does not fail the caller.
 */
export async function writeVideoLearningSessionEvent(
  identity: ResolvedTutorIdentity,
  kind: VideoLearningSessionEventKind,
  session: VideoLearningSession,
): Promise<VideoLearningSessionEventResult> {
  const warnings: string[] = [];

  if (!identity?.studentId || !identity?.schoolId) {
    return { eventWritten: false, warnings: ['Identity missing — cannot write event.'] };
  }

  try {
    const eventPayload = {
      kind: kind,
      sessionVideoId: session.sessionVideoId,
      title: session.title.slice(0, 200),
      topic: session.topic?.slice(0, 160) || null,
      subject: session.subject?.slice(0, 120) || null,
      status: session.status,
      watchedPercent: session.progress.watchedPercent ?? null,
      watchedSeconds: session.progress.watchedSeconds ?? null,
      checkpointCount: session.checkpoints.length,
      followUpStatus: session.followUp.status,
      skillIds: session.skillIds.slice(0, 10),
      needsTeacherReview: session.safety.needsTeacherReview,
      source: session.progress.source,
      recordedAt: new Date().toISOString(),
    };

    // Write via existing learning event service
    const event = await learningEventService.createLearningEvent(
      identity,
      {
        kind: 'asked_question', // Use safe existing kind
        sessionId: session.tutorSessionId || null,
        subject: session.subject || undefined,
        topic: session.topic || undefined,
        responseSummary: JSON.stringify(eventPayload).slice(0, 1000),
        source: 'video' as import('./learnerMemoryContracts').LearningEventSource,
      },
    );

    return {
      eventWritten: true,
      eventId: event.eventId,
      warnings,
    };
  } catch (err) {
    warnings.push(`Failed to write video learning event: ${String(err)}`);
    return { eventWritten: false, warnings };
  }
}

/**
 * Convenience: write event for a video session status change.
 */
export async function writeVideoSessionStatusChangeEvent(
  identity: ResolvedTutorIdentity,
  session: VideoLearningSession,
  oldStatus?: VideoLearningSessionStatus,
): Promise<VideoLearningSessionEventResult> {
  const kind = statusToEventKind(session.status);
  if (!kind) {
    return { eventWritten: false, warnings: [`No event mapping for status ${session.status}.`] };
  }
  return writeVideoLearningSessionEvent(identity, kind, session);
}

/**
 * Convenience: write checkpoint event.
 */
export async function writeVideoCheckpointEvent(
  identity: ResolvedTutorIdentity,
  session: VideoLearningSession,
  checkpointAction: 'created' | 'answered',
): Promise<VideoLearningSessionEventResult> {
  const kind = checkpointAction === 'created'
    ? 'video_checkpoint_created' as VideoLearningSessionEventKind
    : 'video_checkpoint_answered' as VideoLearningSessionEventKind;
  return writeVideoLearningSessionEvent(identity, kind, session);
}

/**
 * Convenience: write follow-up event.
 */
export async function writeVideoFollowUpEvent(
  identity: ResolvedTutorIdentity,
  session: VideoLearningSession,
): Promise<VideoLearningSessionEventResult> {
  return writeVideoLearningSessionEvent(identity, 'video_follow_up_recommended', session);
}
