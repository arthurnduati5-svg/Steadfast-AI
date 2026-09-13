// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Event Service v1
// Writes bounded post-turn events for artifact-aware practice
// actions. No raw artifact text. No raw answer dumps.
// No hidden answer keys. No direct mastery mutation.
// Event failure does not fail the caller.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeStatus,
} from './artifactAwarePracticeContracts';

import { learningEventService } from './learningEventService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export type ArtifactAwarePracticeEventKind =
  | 'artifact_practice_generated'
  | 'artifact_practice_answered'
  | 'artifact_practice_reviewed'
  | 'artifact_practice_reteach_needed'
  | 'artifact_practice_advance_ready'
  | 'artifact_practice_spaced_review_scheduled'
  | 'artifact_practice_completed'
  | 'artifact_practice_abandoned';

export interface ArtifactAwarePracticeEventResult {
  eventWritten: boolean;
  eventId?: string;
  warnings: string[];
}

/**
 * Map practice status to event kind.
 */
function statusToEventKind(status: ArtifactAwarePracticeStatus): ArtifactAwarePracticeEventKind | null {
  switch (status) {
    case 'generated':
      return 'artifact_practice_generated';
    case 'answered':
      return 'artifact_practice_answered';
    case 'reviewed':
      return 'artifact_practice_reviewed';
    case 'reteach_needed':
      return 'artifact_practice_reteach_needed';
    case 'advance_ready':
      return 'artifact_practice_advance_ready';
    case 'scheduled_review':
      return 'artifact_practice_spaced_review_scheduled';
    case 'completed':
      return 'artifact_practice_completed';
    case 'abandoned':
      return 'artifact_practice_abandoned';
    default:
      return null;
  }
}

/**
 * Write a bounded artifact-aware practice event.
 * Event failure does not fail the caller.
 */
export async function writeArtifactAwarePracticeEvent(
  identity: ResolvedTutorIdentity,
  kind: ArtifactAwarePracticeEventKind,
  session: ArtifactAwarePracticeSession,
): Promise<ArtifactAwarePracticeEventResult> {
  const warnings: string[] = [];

  if (!identity?.studentId || !identity?.schoolId) {
    return { eventWritten: false, warnings: ['Identity missing — cannot write event.'] };
  }

  try {
    const eventPayload = {
      kind,
      artifactPracticeSessionId: session.artifactPracticeSessionId,
      status: session.status,
      topic: session.topic?.slice(0, 160) || null,
      subject: session.subject?.slice(0, 120) || null,
      artifactIds: session.artifactIds.slice(0, 5),
      sourceKind: session.source.sourceKind,
      itemCount: session.items.length,
      answeredCount: session.items.filter((i) => i.status !== 'not_answered').length,
      correctCount: session.items.filter((i) => i.status === 'correct').length,
      incorrectCount: session.items.filter((i) => i.status === 'incorrect' || i.status === 'needs_review').length,
      misconceptionCount: session.misconceptionSummary.length,
      currentDecision: session.decision.currentDecision,
      skillIds: session.skillIds.slice(0, 10),
      recordedAt: new Date().toISOString(),
    };

    await learningEventService.createLearningEvent(
      identity,
      {
        kind: 'answered_question',
        sessionId: session.tutorSessionId || null,
        subject: session.subject || undefined,
        topic: session.topic || undefined,
        responseSummary: JSON.stringify(eventPayload).slice(0, 1000),
        source: 'chat',
      },
    );

    return {
      eventWritten: true,
      warnings,
    };
  } catch (err) {
    warnings.push(`Failed to write artifact-aware practice event: ${String(err)}`);
    return { eventWritten: false, warnings };
  }
}

/**
 * Convenience: write event based on status change.
 */
export async function writeArtifactAwarePracticeStatusChangeEvent(
  identity: ResolvedTutorIdentity,
  session: ArtifactAwarePracticeSession,
): Promise<ArtifactAwarePracticeEventResult> {
  const kind = statusToEventKind(session.status);
  if (!kind) {
    return { eventWritten: false, warnings: [`No event mapping for status ${session.status}.`] };
  }
  return writeArtifactAwarePracticeEvent(identity, kind, session);
}
