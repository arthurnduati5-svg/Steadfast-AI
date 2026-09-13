// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Endpoint Service v1
// Orchestrates the full request-to-response flow for all
// Dedicated Tutor State endpoint operations.
// Flow: validate request → resolve identity → enforce access
// → resolve state → build safe view → apply mutation → return
// ─────────────────────────────────────────────────────────────

import type {
  DedicatedTutorState,
  TutorStateEndpointResponse,
  TutorStateHistoryResponse,
  TutorStateViewMode,
  TutorStateSourceDomain,
} from './tutorStateEndpointContracts';

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { getTutorStateForLearner } from './tutorStateService';
import { resolveTutorContext } from './tutorContextResolver';

import { tutorStateAccessPolicyService } from './tutorStateAccessPolicyService';
import { tutorStateSafeViewService } from './tutorStateSafeViewService';
import { tutorStatePatchService } from './tutorStatePatchService';
import { tutorStateSnapshotService } from './tutorStateSnapshotService';
import { tutorStateHistoryService } from './tutorStateHistoryService';
import { tutorStateEndpointEventService } from './tutorStateEndpointEventService';

import {
  FORBIDDEN_BODY_FIELDS,
} from './tutorStateEndpointContracts';

function nowISO(): string {
  return new Date().toISOString();
}

// ── Service ──

export class TutorStateEndpointService {
  /**
   * Resolve the full dedicated tutor state.
   * This optionally resolves TutorTurnContext (if includeDomains requires it)
   * and builds the safe view.
   */
  async resolveDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
    includeDomains?: TutorStateSourceDomain[];
    viewMode?: TutorStateViewMode;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, sessionId, includeDomains, viewMode } = input;
    const warnings: string[] = [];
    const effectiveViewMode: TutorStateViewMode = viewMode || 'learner_safe';

    // 1. Enforce access policy
    const access = tutorStateAccessPolicyService.authorizeViewMode(identity, effectiveViewMode);
    if (!access.allowed) {
      warnings.push(access.reason);
      const fallbackState = await this._buildFallback(identity);
      return { ok: true, status: 'forbidden', state: fallbackState, warnings };
    }

    // 2. Resolve TutorTurnContext (always for full state)
    let turnContext = null;
    try {
      turnContext = await resolveTutorContext(identity, {
        sessionId: sessionId || undefined,
      });
    } catch (err) {
      warnings.push(`TutorTurnContext resolution: ${String(err)}`);
    }

    // 3. Get current TutorState
    const tutorState = await getTutorStateForLearner(identity);

    // 4. Build safe dedicated state view
    const state = tutorStateSafeViewService.buildDedicatedTutorStateView({
      identity,
      tutorState,
      turnContext,
      viewMode: access.effectiveViewMode,
      includeDomains,
    });

    return {
      ok: true,
      status: state.status,
      state,
      warnings,
    };
  }

  /**
   * Get current dedicated tutor state (without re-resolving TutorTurnContext).
   * Uses last resolved context or falls back to state-only view.
   */
  async getDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
    viewMode?: TutorStateViewMode;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, sessionId, viewMode } = input;
    const warnings: string[] = [];
    const effectiveViewMode: TutorStateViewMode = viewMode || 'learner_safe';

    // 1. Enforce access policy
    const access = tutorStateAccessPolicyService.authorizeViewMode(identity, effectiveViewMode);
    if (!access.allowed) {
      warnings.push(access.reason);
      const fallbackState = await this._buildFallback(identity);
      return { ok: true, status: 'forbidden', state: fallbackState, warnings };
    }

    // 2. Get current TutorState
    const tutorState = await getTutorStateForLearner(identity);

    // 3. Try to resolve TutorTurnContext for richer state
    let turnContext = null;
    try {
      turnContext = await resolveTutorContext(identity, {
        sessionId: sessionId || undefined,
      });
    } catch {
      // Fallback to state-only view
    }

    // 4. Build safe view
    const state = tutorStateSafeViewService.buildDedicatedTutorStateView({
      identity,
      tutorState,
      turnContext,
      viewMode: access.effectiveViewMode,
    });

    return {
      ok: true,
      status: state.status,
      state,
      warnings,
    };
  }

  /**
   * Get a brief summary of the dedicated tutor state (lightweight).
   */
  async getDedicatedTutorStateSummary(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
  }): Promise<TutorStateEndpointResponse> {
    const { identity } = input;
    const warnings: string[] = [];

    const tutorState = await getTutorStateForLearner(identity);

    const state = tutorStateSafeViewService.buildFallbackState(identity, tutorState);

    return {
      ok: true,
      status: state.status,
      state,
      warnings,
    };
  }

  /**
   * Patch tutor state.
   */
  async patchDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
    operation: import('./tutorStateEndpointContracts').TutorStatePatchOperation;
    value: unknown;
    reason?: string | null;
    expectedStateVersion?: number | null;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, operation, value, reason, expectedStateVersion } = input;
    const warnings: string[] = [];

    // 1. Enforce access policy for patch operation
    const access = tutorStateAccessPolicyService.authorizePatchOperation(identity, operation);
    if (!access.allowed) {
      warnings.push(access.reason);
      const fallbackState = await this._buildFallback(identity);
      return { ok: true, status: 'forbidden', state: fallbackState, warnings };
    }

    // 2. Apply patch
    const result = await tutorStatePatchService.applyPatch({
      identity,
      operation,
      value,
      reason,
      expectedStateVersion,
    });

    if (result.status === 'updated') {
      // 3. Write event (non-blocking)
      tutorStateEndpointEventService.writeStateEvent(identity, {
        eventKind: 'tutor_state_patched',
        stateVersion: result.state.stateVersion,
        summary: `Patched tutor state: ${operation}`,
        details: { operation, reason },
      }).catch(() => {});
    }

    return result;
  }

  /**
   * Reset tutor state.
   */
  async resetDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    scope: import('./tutorStateEndpointContracts').TutorStateResetScope;
    reason?: string | null;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, scope, reason } = input;
    const warnings: string[] = [];

    // 1. Enforce access policy for reset
    const access = tutorStateAccessPolicyService.authorizeReset(identity);
    if (!access.allowed) {
      warnings.push(access.reason);
      const fallbackState = await this._buildFallback(identity);
      return { ok: true, status: 'forbidden', state: fallbackState, warnings };
    }

    // 2. Apply reset
    const result = await tutorStatePatchService.applyReset({ identity, scope, reason });

    // 3. Write event (non-blocking)
    tutorStateEndpointEventService.writeStateEvent(identity, {
      eventKind: 'tutor_state_reset',
      stateVersion: result.state.stateVersion,
      summary: `Reset tutor state: ${scope}`,
      details: { scope, reason },
    }).catch(() => {});

    return result;
  }

  /**
   * Create a state snapshot.
   */
  async snapshotDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
    reason?: string | null;
    includeSafePromptContext?: boolean;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, sessionId, reason, includeSafePromptContext } = input;

    // Resolve current state
    const resolved = await this.getDedicatedTutorState({
      identity,
      sessionId,
      viewMode: 'learner_safe',
    });

    if (resolved.status === 'forbidden') {
      return resolved;
    }

    // Create snapshot
    const result = await tutorStateSnapshotService.createSnapshot({
      identity,
      state: resolved.state,
      reason,
      includeSafePromptContext,
    });

    // Write event (non-blocking)
    tutorStateEndpointEventService.writeStateEvent(identity, {
      eventKind: 'tutor_state_snapshot_created',
      stateVersion: result.state.stateVersion,
      summary: `State snapshot created: ${reason || 'no reason'}`,
      details: { reason, domainCount: result.state.metadata.domainsIncluded.length },
    }).catch(() => {});

    return result;
  }

  /**
   * Validate a state object against the DedicatedTutorState contract.
   */
  async validateDedicatedTutorState(input: {
    identity: ResolvedTutorIdentity;
    state: Record<string, unknown>;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, state } = input;
    const warnings: string[] = [];

    // Check for forbidden fields
    const forbiddenFound: string[] = [];
    for (const field of FORBIDDEN_BODY_FIELDS) {
      if (field in state && state[field] !== undefined) {
        forbiddenFound.push(field);
        warnings.push(`Forbidden field found: "${field}"`);
      }
    }

    // Basic structural validation
    if (!state.stateId && !state.stateVersion && !state.metadata) {
      warnings.push('State object lacks required top-level fields (stateId, stateVersion, metadata).');
      return {
        ok: true,
        status: 'validation_failed',
        state: await this._buildFallback(identity),
        warnings: ['State validation failed. Structure does not match DedicatedTutorState contract.'],
      };
    }

    if (forbiddenFound.length > 0) {
      return {
        ok: true,
        status: 'validation_failed',
        state: await this._buildFallback(identity),
        warnings: [
          ...warnings,
          'State contains forbidden fields. These must not appear in any state object.',
        ],
      };
    }

    return {
      ok: true,
      status: 'resolved',
      state: await this._buildFallback(identity),
      warnings: ['State structure validated. No forbidden fields detected.'],
    };
  }

  /**
   * Get state history.
   */
  async getDedicatedTutorStateHistory(input: {
    identity: ResolvedTutorIdentity;
    sessionId?: string | null;
    limit?: number;
  }): Promise<TutorStateHistoryResponse> {
    const { identity, limit } = input;

    return tutorStateHistoryService.getHistory(identity, { limit });
  }

  /**
   * Build a fallback state view for error/forbidden responses.
   */
  private async _buildFallback(identity: ResolvedTutorIdentity): Promise<DedicatedTutorState> {
    const tutorState = await getTutorStateForLearner(identity);
    return tutorStateSafeViewService.buildFallbackState(identity, tutorState);
  }
}

// ── Singleton ──

export const tutorStateEndpointService = new TutorStateEndpointService();
