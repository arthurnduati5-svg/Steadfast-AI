// ─────────────────────────────────────────────────────────────
// Steadfast AI — Audit Visibility Contracts v1
// Defines visibility policy rules: which actor types can view
// which visibility levels, and how visibility is chosen based
// on event category and sensitivity.
// ─────────────────────────────────────────────────────────────

import type { DurableAuditVisibility, DurableAuditActor } from './durableAuditEventContracts';

/**
 * Visibility hierarchy from most restrictive to least.
 */
export const VISIBILITY_HIERARCHY: DurableAuditVisibility[] = [
  'security_only',
  'safeguarding_only',
  'system_internal',
  'school_admin_safe',
  'teacher_safe',
  'learner_safe',
];

/**
 * Default visibility per category when no explicit override is provided.
 */
export const DEFAULT_CATEGORY_VISIBILITY: Record<string, DurableAuditVisibility> = {
  request_lifecycle: 'system_internal',
  route_access: 'system_internal',
  authentication: 'security_only',
  authorization_scope: 'security_only',
  privacy: 'system_internal',
  safeguarding: 'safeguarding_only',
  teacher_intervention: 'teacher_safe',
  learner_memory: 'system_internal',
  tutor_state: 'system_internal',
  practice_mastery: 'system_internal',
  growth_data_reliability: 'system_internal',
  ai_runtime_reliability: 'system_internal',
  source_trust: 'system_internal',
  artifact_safety: 'system_internal',
  video_learning: 'system_internal',
  backend_health: 'system_internal',
  backend_error: 'system_internal',
  report_integrity: 'system_internal',
  truth_audit: 'system_internal',
  release_gate: 'system_internal',
  no_false_pass: 'security_only',
  unknown: 'system_internal',
};

/**
 * Which actor types are allowed to view events at each visibility level.
 */
export function getViewersForVisibility(visibility: DurableAuditVisibility): ReadonlyArray<DurableAuditActor['actorType']> {
  switch (visibility) {
    case 'security_only':
      return ['admin', 'system', 'safeguarding_worker'];
    case 'safeguarding_only':
      return ['admin', 'safeguarding_worker'];
    case 'system_internal':
      return ['admin', 'system', 'ai_runtime', 'safeguarding_worker'];
    case 'school_admin_safe':
      return ['admin', 'teacher', 'system', 'safeguarding_worker'];
    case 'teacher_safe':
      return ['teacher', 'admin', 'system'];
    case 'learner_safe':
      return ['student', 'teacher', 'admin', 'system'];
    default:
      return ['system', 'admin'];
  }
}

/**
 * Check if an actor type is allowed to view events at a given visibility level.
 */
export function canActorTypeViewVisibility(
  actorType: DurableAuditActor['actorType'],
  visibility: DurableAuditVisibility,
): boolean {
  return getViewersForVisibility(visibility).includes(actorType);
}
