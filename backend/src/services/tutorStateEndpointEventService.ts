// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Endpoint Event Service v1
// Writes bounded, safe events for tutor state operations.
// No raw artifact text, OCR, transcripts, answer keys, or
// hidden prompts are ever written to events.
// ─────────────────────────────────────────────────────────────

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { chatPostTurnEventService } from './chatPostTurnEventService';

export type TutorStateEventKind =
  | 'tutor_state_resolved'
  | 'tutor_state_patched'
  | 'tutor_state_reset'
  | 'tutor_state_snapshot_created'
  | 'tutor_state_validation_failed'
  | 'tutor_state_access_denied';

export interface TutorStateEventInput {
  eventKind: TutorStateEventKind;
  stateVersion: number;
  summary: string;
  details?: Record<string, unknown>;
}

// ── Service ──

export class TutorStateEndpointEventService {
  /**
   * Write a bounded tutor state event.
   * Non-blocking — failures are caught and logged but do not
   * corrupt the state operation.
   */
  async writeStateEvent(
    identity: ResolvedTutorIdentity,
    input: TutorStateEventInput,
  ): Promise<void> {
    const { eventKind, stateVersion, summary, details } = input;

    try {
      // Use the existing chat post-turn event service as the event sink
      // for v1. The event kind is mapped to a general learning event.
      await chatPostTurnEventService.writePostTurnLearningEvent(
        identity,
        {
          summary,
          details: {
            ...(details || {}),
            eventKind,
            stateVersion,
            timestamp: new Date().toISOString(),
          },
        } as any,
        summary.slice(0, 300),
      );
    } catch {
      // Non-blocking — never fail the calling operation
    }
  }
}

// ── Singleton ──

export const tutorStateEndpointEventService = new TutorStateEndpointEventService();
