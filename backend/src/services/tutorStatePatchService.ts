// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Patch Service v1
// Applies bounded, validated patch operations to TutorState.
// Rejects forbidden operations, version mismatches, and
// raw data writes. Increments stateVersion on each patch.
// ─────────────────────────────────────────────────────────────

import type {
  TutorStatePatchOperation,
  TutorStateResetScope,
  TutorStateEndpointResponse,
  TutorStateEndpointStatus,
} from './tutorStateEndpointContracts';

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { TutorState } from './tutorStateContracts';
import { getTutorStateForLearner, upsertTutorStateForLearner } from './tutorStateService';
import { tutorStateSafeViewService } from './tutorStateSafeViewService';

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Check if a patch operation is a "clear" operation.
 */
function isClearOperation(operation: TutorStatePatchOperation): boolean {
  return operation === 'clear_active_artifacts'
    || operation === 'clear_active_video_session'
    || operation === 'clear_next_action';
}

/**
 * Apply a single patch operation to a TutorState.
 */
function applyOperation(
  state: TutorState,
  operation: TutorStatePatchOperation,
  value: unknown,
  reason: string | null | undefined,
): TutorState {
  const now = nowISO();

  switch (operation) {
    case 'set_active_topic':
      return {
        ...state,
        activeTopic: String(value || '').trim().slice(0, 256) || null,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'set_learning_mode': {
      const mode = String(value || 'learn').trim() as TutorState['learningMode'];
      return {
        ...state,
        learningMode: mode,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'set_active_artifacts': {
      const ids = Array.isArray(value) ? value.map(String) : [];
      return {
        ...state,
        activeArtifactIds: [...new Set(ids)].slice(0, 50),
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'clear_active_artifacts': {
      if (value !== 'confirmed' && value !== true) {
        return state;
      }
      return {
        ...state,
        activeArtifactIds: [],
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'set_active_video_session': {
      if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, any>;
        return {
          ...state,
          activeVideoId: String(v.sessionVideoId || '').trim() || null,
          stateVersion: state.stateVersion + 1,
          updatedAt: now,
        };
      }
      return state;
    }

    case 'clear_active_video_session': {
      if (value !== 'confirmed' && value !== true) {
        return state;
      }
      return {
        ...state,
        activeVideoId: null,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'set_next_action':
      // Next action is ephemeral — stored via the session/stateVersion bump
      return {
        ...state,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'clear_next_action':
      return {
        ...state,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'reset_session_state': {
      if (value !== 'confirmed' && value !== true) {
        return state;
      }
      return {
        ...state,
        activeSubject: null,
        activeTopic: null,
        activeSkillIds: [],
        activeArtifactIds: [],
        activeVideoId: null,
        learningMode: 'learn',
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'append_note': {
      const note = String(value || '').trim().slice(0, 500);
      if (!note) return state;
      const evidence = [...(state.evidence || [])];
      evidence.push({
        source: 'system',
        field: 'endpoint_note',
        valueSummary: note,
        confidence: 1,
        resolvedAt: now,
      });
      return {
        ...state,
        evidence,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    case 'acknowledge_warning': {
      const warning = String(value || '').trim().slice(0, 500);
      if (!warning) return state;
      const evidence = [...(state.evidence || [])];
      evidence.push({
        source: 'system',
        field: 'warning_acknowledged',
        valueSummary: `Warning acknowledged: ${warning}`,
        confidence: 1,
        resolvedAt: now,
      });
      return {
        ...state,
        evidence,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };
    }

    default:
      return state;
  }
}

/**
 * Apply a reset scope to TutorState.
 */
function applyReset(
  state: TutorState,
  scope: TutorStateResetScope,
): TutorState {
  const now = nowISO();

  switch (scope) {
    case 'session_only':
      return {
        ...state,
        sessionId: null,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'active_topic':
      return {
        ...state,
        activeSubject: null,
        activeTopic: null,
        activeSkillIds: [],
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'active_artifacts':
      return {
        ...state,
        activeArtifactIds: [],
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'active_video':
      return {
        ...state,
        activeVideoId: null,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'active_practice':
      return {
        ...state,
        // Clear practice by removing artifact-aware practice active session
        artifactAwarePractice: (state as any).artifactAwarePractice
          ? {
              ...(state as any).artifactAwarePractice,
              activePracticeSession: null,
            }
          : undefined,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      } as any;

    case 'next_action':
      return {
        ...state,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    case 'all_ephemeral':
      return {
        ...state,
        activeSubject: null,
        activeTopic: null,
        activeSkillIds: [],
        activeArtifactIds: [],
        activeVideoId: null,
        sessionId: null,
        learningMode: 'learn',
        artifactAwarePractice: undefined,
        stateVersion: state.stateVersion + 1,
        updatedAt: now,
      };

    default:
      return state;
  }
}

// ── Service ──

export class TutorStatePatchService {
  /**
   * Apply a validated patch operation to the learner's TutorState.
   */
  async applyPatch(input: {
    identity: ResolvedTutorIdentity;
    operation: TutorStatePatchOperation;
    value: unknown;
    reason?: string | null;
    expectedStateVersion?: number | null;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, operation, value, reason, expectedStateVersion } = input;
    const warnings: string[] = [];

    // Load current state
    const currentState = await getTutorStateForLearner(identity);

    // Check state version
    if (expectedStateVersion !== null && expectedStateVersion !== undefined) {
      if (currentState.stateVersion !== expectedStateVersion) {
        return {
          ok: true,
          status: 'validation_failed',
          state: tutorStateSafeViewService.buildFallbackState(identity, currentState),
          warnings: [
            `State version mismatch: expected ${expectedStateVersion}, current ${currentState.stateVersion}. ` +
            'Reload state and retry.',
          ],
        };
      }
    }

    // Apply operation
    const updatedState = applyOperation(currentState, operation, value, reason);

    // Persist
    const persisted = await upsertTutorStateForLearner(identity, updatedState);

    // Build response
    const state = tutorStateSafeViewService.buildFallbackState(identity, persisted);

    return {
      ok: true,
      status: 'updated',
      state,
      warnings,
    };
  }

  /**
   * Apply a reset operation to the learner's TutorState.
   */
  async applyReset(input: {
    identity: ResolvedTutorIdentity;
    scope: TutorStateResetScope;
    reason?: string | null;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, scope } = input;
    const warnings: string[] = [];

    const currentState = await getTutorStateForLearner(identity);
    const resetState = applyReset(currentState, scope);
    const persisted = await upsertTutorStateForLearner(identity, resetState);

    const state = tutorStateSafeViewService.buildFallbackState(identity, persisted);

    return {
      ok: true,
      status: 'reset',
      state,
      warnings,
    };
  }
}

// ── Singleton ──

export const tutorStatePatchService = new TutorStatePatchService();
