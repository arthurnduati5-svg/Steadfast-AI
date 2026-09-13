// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Event Service v1
// Writes bounded post-turn events for video-aware practice
// actions. No raw transcripts. No raw answer dumps.
// No hidden answer keys. No direct mastery mutation.
// Event failure does not fail the caller.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwarePracticeSession,
  VideoAwarePracticeStatus,
} from './videoAwarePracticeContracts';

import { learningEventService } from './learningEventService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export type VideoAwarePracticeEventKind =
  | 'video_practice_generated'
  | 'video_practice_answered'
  | 'video_practice_reviewed'
  | 'video_practice_reteach_needed'
  | 'video_practice_advance_ready'
  | 'video_practice_spaced_review_scheduled'
  | 'video_practice_completed'
  | 'video_practice_abandoned';

export interface VideoAwarePracticeEventResult {
  eventWritten: boolean;
  eventId?: string;
  warnings: string[];
}

/**
 * Map practice status to event kind.
 */
function statusToEventKind(status: VideoAwarePracticeStatus): VideoAwarePracticeEventKind | null {
  switch (status) {
    case 'generated':
      return 'video_practice_generated';
    case 'answered':
      return 'video_practice_answered';
    case 'reviewed':
      return 'video_practice_reviewed';
    case 'reteach_needed':
      return 'video_practice_reteach_needed';
    case 'advance_ready':
      return 'video_practice_advance_ready';
    case 'scheduled_review':
      return 'video_practice_spaced_review_scheduled';
    case 'completed':
      return 'video_practice_completed';
    case 'abandoned':
      return 'video_practice_abandoned';
    default:
      return null;
  }
}

/**
 * Write a bounded video-aware practice event.
 * Event failure does not fail the caller.
 */
export async function writeVideoAwarePracticeEvent(
  identity: ResolvedTutorIdentity,
  kind: VideoAwarePracticeEventKind,
  session: VideoAwarePracticeSession,
): Promise<VideoAwarePracticeEventResult> {
  const warnings: string[] = [];

  if (!identity?.studentId || !identity?.schoolId) {
    return { eventWritten: false, warnings: ['Identity missing — cannot write event.'] };
  }

  try {
    const eventPayload = {
      kind,
      videoPracticeSessionId: session.videoPracticeSessionId,
      sessionVideoId: session.sessionVideoId,
      status: session.status,
      topic: session.topic?.slice(0, 160) || null,
      subject: session.subject?.slice(0, 120) || null,
      itemCount: session.items.length,
      answeredCount: session.items.filter((i) => i.status !== 'not_answered').length,
      correctCount: session.items.filter((i) => i.status === 'correct').length,
      incorrectCount: session.items.filter((i) => i.status === 'incorrect' || i.status === 'needs_review').length,
      misconceptionCount: session.misconceptionSummary.length,
      currentDecision: session.decision.currentDecision,
      skillIds: session.skillIds.slice(0, 10),
      recordedAt: new Date().toISOString(),
    };

    // Write via existing learning event service with safe bounded payload
    const event = await learningEventService.createLearningEvent(
      identity,
      {
        kind: 'answered_question', // Use safe existing kind
        sessionId: session.tutorSessionId || null,
        subject: session.subject || undefined,
        topic: session.topic || undefined,
        responseSummary: JSON.stringify(eventPayload).slice(0, 1000),
        source: 'video' as import('./learnerMemoryContracts').LearningEventSource,
      },
    );

    return {
      eventWritten: true,
      eventId: event.eventId || String(event),
      warnings,
    };
  } catch (err) {
    warnings.push(`Failed to write video-aware practice event: ${String(err)}`);
    return { eventWritten: false, warnings };
  }
}

/**
 * Convenience: write event based on status change.
 */
export async function writeVideoAwarePracticeStatusChangeEvent(
  identity: ResolvedTutorIdentity,
  session: VideoAwarePracticeSession,
): Promise<VideoAwarePracticeEventResult> {
  const kind = statusToEventKind(session.status);
  if (!kind) {
    return { eventWritten: false, warnings: [`No event mapping for status ${session.status}.`] };
  }
  return writeVideoAwarePracticeEvent(identity, kind, session);
}
