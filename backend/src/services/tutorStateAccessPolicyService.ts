// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Access Policy Service v1
// Enforces view-mode restrictions and role-based access for
// the Dedicated Tutor State endpoint.
// Rules:
// - Learner can read learner_safe only
// - Learner can patch only learner-safe operations
// - Teacher can read teacher_audit if auth role supports it
// - system_debug is internal only
// - No body-based role elevation
// - No cross-school or cross-student access
// ─────────────────────────────────────────────────────────────

import type { TutorStateViewMode, TutorStatePatchOperation } from './tutorStateEndpointContracts';
import { LEARNER_SAFE_PATCH_OPERATIONS } from './tutorStateEndpointContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

export type AccessDecision =
  | { allowed: true; effectiveViewMode: TutorStateViewMode }
  | { allowed: false; reason: string };

export interface AccessPolicyInput {
  identity: ResolvedTutorIdentity;
  requestedViewMode?: TutorStateViewMode;
  requestedOperation?: TutorStatePatchOperation;
}

// ── Helpers ──

function isTeacher(identity: ResolvedTutorIdentity): boolean {
  return identity.role === 'teacher' || identity.role === 'admin';
}

function isAdmin(identity: ResolvedTutorIdentity): boolean {
  return identity.role === 'admin';
}

function isLearner(identity: ResolvedTutorIdentity): boolean {
  return !isTeacher(identity) && !isAdmin(identity);
}

const LEARNER_ALLOWED_VIEW_MODES: TutorStateViewMode[] = ['learner_safe'];
const TEACHER_ALLOWED_VIEW_MODES: TutorStateViewMode[] = ['learner_safe', 'tutor_internal', 'teacher_audit'];
const ADMIN_ALLOWED_VIEW_MODES: TutorStateViewMode[] = ['learner_safe', 'tutor_internal', 'teacher_audit'];

// ── Service ──

export class TutorStateAccessPolicyService {
  /**
   * Authorize a view mode for a given identity.
   */
  authorizeViewMode(
    identity: ResolvedTutorIdentity,
    requestedViewMode?: TutorStateViewMode,
  ): AccessDecision {
    const effectiveMode: TutorStateViewMode = requestedViewMode || 'learner_safe';

    // system_debug is never exposed externally
    if (effectiveMode === 'system_debug') {
      return {
        allowed: false,
        reason: 'system_debug view mode is not available through normal routes.',
      };
    }

    if (isAdmin(identity)) {
      if ((ADMIN_ALLOWED_VIEW_MODES as readonly string[]).includes(effectiveMode)) {
        return { allowed: true, effectiveViewMode: effectiveMode };
      }
      return {
        allowed: false,
        reason: `View mode "${effectiveMode}" is not allowed for admin role.`,
      };
    }

    if (isTeacher(identity)) {
      if ((TEACHER_ALLOWED_VIEW_MODES as readonly string[]).includes(effectiveMode)) {
        return { allowed: true, effectiveViewMode: effectiveMode };
      }
      return {
        allowed: false,
        reason: `View mode "${effectiveMode}" is not allowed for teacher role.`,
      };
    }

    // Learner
    if (isLearner(identity)) {
      if ((LEARNER_ALLOWED_VIEW_MODES as readonly string[]).includes(effectiveMode)) {
        return { allowed: true, effectiveViewMode: effectiveMode };
      }
      return {
        allowed: false,
        reason: `View mode "${effectiveMode}" is not allowed for learner role.`,
      };
    }

    // Unknown role — default to learner_safe
    if (effectiveMode === 'learner_safe') {
      return { allowed: true, effectiveViewMode: 'learner_safe' };
    }

    return {
      allowed: false,
      reason: `Unknown role "${identity.role}" cannot access view mode "${effectiveMode}".`,
    };
  }

  /**
   * Authorize a patch operation for a given identity.
   */
  authorizePatchOperation(
    identity: ResolvedTutorIdentity,
    operation: TutorStatePatchOperation,
  ): AccessDecision {
    if (isAdmin(identity)) {
      return { allowed: true, effectiveViewMode: 'teacher_audit' };
    }

    if (isTeacher(identity)) {
      // Teachers can use TEACHER_PATCH_OPERATIONS (defined in contracts)
      const teacherOps = [
        'set_active_topic', 'set_learning_mode', 'set_active_artifacts',
        'clear_active_artifacts', 'set_active_video_session',
        'clear_active_video_session', 'set_next_action',
        'clear_next_action', 'reset_session_state',
        'append_note', 'acknowledge_warning',
      ] as const;
      if ((teacherOps as readonly string[]).includes(operation)) {
        return { allowed: true, effectiveViewMode: 'teacher_audit' };
      }
      return {
        allowed: false,
        reason: `Patch operation "${operation}" is not allowed for teacher role.`,
      };
    }

    // Learner — only learner-safe operations
    if ((LEARNER_SAFE_PATCH_OPERATIONS as readonly string[]).includes(operation)) {
      return { allowed: true, effectiveViewMode: 'learner_safe' };
    }

    return {
      allowed: false,
      reason: `Patch operation "${operation}" is not allowed for learner role.`,
    };
  }

  /**
   * Check whether the identity can perform a reset operation.
   */
  authorizeReset(identity: ResolvedTutorIdentity): AccessDecision {
    if (isAdmin(identity) || isTeacher(identity)) {
      return { allowed: true, effectiveViewMode: 'teacher_audit' };
    }
    return {
      allowed: false,
      reason: 'Learner role cannot reset tutor state.',
    };
  }

  /**
   * Check whether the identity can create snapshots.
   */
  authorizeSnapshot(identity: ResolvedTutorIdentity): AccessDecision {
    // All roles can create snapshots (they are scoped to the learner)
    return { allowed: true, effectiveViewMode: 'learner_safe' };
  }
}

// ── Singleton ──

export const tutorStateAccessPolicyService = new TutorStateAccessPolicyService();
