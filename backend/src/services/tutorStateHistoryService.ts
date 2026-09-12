// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State History Service v1
// Reads recent state snapshots or events and returns bounded,
// learner-safe summaries. Supports optional session filter.
// Returns empty history safely if no storage exists.
// ─────────────────────────────────────────────────────────────

import type { TutorStateHistoryResponse } from './tutorStateEndpointContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { tutorStateSnapshotService } from './tutorStateSnapshotService';

export interface TutorStateHistoryQuery {
  sessionId?: string | null;
  limit?: number;
}

// ── Service ──

export class TutorStateHistoryService {
  /**
   * Get recent state history for a learner.
   * Delegates to the snapshot service's list method.
   */
  async getHistory(
    identity: ResolvedTutorIdentity,
    query: TutorStateHistoryQuery,
  ): Promise<TutorStateHistoryResponse> {
    // R8-G.3A-D1C: persistence failure must propagate (fail-closed).
    // Returning ok:true + empty on DB failure would mask outages as
    // fake success. The HTTP route already maps service errors to its
    // established internal/dependency failure response.
    const { limit } = query;
    return tutorStateSnapshotService.listSnapshots({
      identity,
      limit,
    });
  }
}

// ── Singleton ──

export const tutorStateHistoryService = new TutorStateHistoryService();
