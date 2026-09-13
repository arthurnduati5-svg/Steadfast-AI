import { RevisionModeSession, RevisionModeQueue, RevisionModeItemState, RevisionModeAttempt, RevisionModeSummary } from '../contracts/revisionModeContracts';
import { serializeRevisionSession } from './revisionModeSessionService';
import { serializeRevisionQueue } from './revisionModeQueueService';
import { serializeRevisionItemState } from './revisionModeItemStateService';
import { serializeRevisionSummary } from './revisionModeSummaryService';

export function buildStudentRevisionStateResponse(
  session: RevisionModeSession,
  queue?: RevisionModeQueue | null,
  currentItem?: RevisionModeItemState | null,
  attempts?: RevisionModeAttempt[],
  summary?: RevisionModeSummary | null,
): Record<string, unknown> {
  return {
    ok: true,
    revisionMode: {
      session: serializeRevisionSession(session),
      queue: queue ? serializeRevisionQueue(queue) : null,
      currentItem: currentItem ? serializeRevisionItemState(currentItem) : null,
      attemptCount: attempts?.length || 0,
      summary: summary ? serializeRevisionSummary(summary) : null,
    },
  };
}

export function buildEmptyActiveRevisionResponse(): Record<string, unknown> {
  return {
    ok: true,
    revisionMode: null,
  };
}

export function buildRevisionSummaryResponse(
  summary: RevisionModeSummary,
): Record<string, unknown> {
  return {
    ok: true,
    summary: serializeRevisionSummary(summary),
  };
}
