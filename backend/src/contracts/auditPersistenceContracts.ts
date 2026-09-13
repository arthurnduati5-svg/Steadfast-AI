// ─────────────────────────────────────────────────────────────
// Steadfast AI — Audit Persistence Contracts v1
// Defines persistence-level contracts for durable audit events.
// Covers storage guarantees, degraded modes, and DB interaction
// shapes.
// ─────────────────────────────────────────────────────────────

import type { DurableAuditEventPayload, DurableAuditWriteResult } from './durableAuditEventContracts';

/**
 * Persistence guarantee levels.
 */
export type DurableAuditPersistenceLevel =
  | 'required'       // Must persist; failure blocks the operation
  | 'critical'       // Must persist; failure surfaces as degraded status
  | 'best_effort';   // Should persist; failure is acceptable

/**
 * Default persistence level by event category.
 */
export const CATEGORY_PERSISTENCE_LEVEL: Record<string, DurableAuditPersistenceLevel> = {
  safeguarding: 'critical',
  authentication: 'critical',
  authorization_scope: 'critical',
  privacy: 'critical',
  teacher_intervention: 'required',
  no_false_pass: 'critical',
  release_gate: 'critical',
  truth_audit: 'critical',
  report_integrity: 'critical',
  request_lifecycle: 'best_effort',
  route_access: 'best_effort',
  learner_memory: 'best_effort',
  tutor_state: 'best_effort',
  practice_mastery: 'best_effort',
  growth_data_reliability: 'best_effort',
  ai_runtime_reliability: 'best_effort',
  source_trust: 'best_effort',
  artifact_safety: 'best_effort',
  video_learning: 'best_effort',
  backend_health: 'best_effort',
  backend_error: 'best_effort',
  unknown: 'best_effort',
};

/**
 * Shape returned by a Prisma-based repository write attempt.
 */
export type DurableAuditPrismaWriteAttempt = {
  success: boolean;
  eventId?: string;
  error?: string;
};

/**
 * Shape returned by a Prisma-based repository read attempt.
 */
export type DurableAuditPrismaReadAttempt<T> = {
  success: boolean;
  data?: T[];
  error?: string;
};

/**
 * DB health check result for the durable audit table.
 */
export type DurableAuditDbHealth = {
  reachable: boolean;
  tableExists: boolean;
  rowCount?: number;
  lastWriteOk?: boolean;
  error?: string;
};

/**
 * Options for creating a durable audit event.
 */
export type DurableAuditCreateOptions = {
  allowDegradedWrite?: boolean;
  persistenceLevel?: DurableAuditPersistenceLevel;
};

/**
 * Default pagination limit.
 */
export const DEFAULT_AUDIT_PAGE_LIMIT = 50;

/**
 * Maximum pagination limit.
 */
export const MAX_AUDIT_PAGE_LIMIT = 200;

/**
 * Safe summary maximum length.
 */
export const MAX_SAFE_SUMMARY_LENGTH = 500;

/**
 * Safe metadata maximum JSON string length.
 */
export const MAX_SAFE_METADATA_JSON_LENGTH = 10_000;
