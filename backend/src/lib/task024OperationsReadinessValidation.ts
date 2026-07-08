import type {
  Task024OperationsReadinessContext, Task024OperationEnvironment,
  Task024MonitoringReadinessResult, Task024AlertPolicyResult,
  Task024IncidentResponsePlan, Task024IncidentSeverityDecision,
  Task024BackupReadinessResult, Task024RestoreDrillDryRunResult,
  Task024OperationalDataIntegrityResult, Task024LoadSimulationPlan,
  Task024LoadSimulationResult, Task024PerformanceBaselineResult,
  Task024OperationsReadinessQuery, Task024OperationsPrivacyGuardResult,
} from '../contracts/task024OperationsReadinessContracts';
import { TASK024_FORBIDDEN_OPERATION_FIELDS } from '../contracts/task024OperationsReadinessContracts';

const ADMIN_INTERNAL_ROLES = ['admin', 'internal', 'operator', 'counselor'];
const LEARNER_PARENT_PEER_ROLES = ['learner', 'student', 'parent', 'peer', 'guardian'];

function isValidString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function createSafeError(message: string, reasonCode?: string): Error {
  const err = new Error(message);
  (err as any).safeReasonCode = reasonCode || 'VALIDATION_ERROR';
  (err as any).safe = true;
  return err;
}

export function createSafeTask024ValidationError(message: string, reasonCode?: string): Error {
  return createSafeError(message, reasonCode);
}

export function redactTask024SensitiveValue(value: string): string {
  return value.replace(/[A-Za-z0-9+/]{8,}(={0,2})/g, '[REDACTED]');
}

export function rejectForbiddenTask024OperationFields(payload: Record<string, unknown>): { valid: boolean; forbiddenFields: string[] } {
  const forbidden: string[] = [];
  for (const key of Object.keys(payload)) {
    const upperKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
    if (TASK024_FORBIDDEN_OPERATION_FIELDS.some(f => f.toUpperCase() === upperKey || f === key)) {
      forbidden.push(key);
    }
  }
  return { valid: forbidden.length === 0, forbiddenFields: forbidden };
}

function deepRejectForbidden(obj: unknown, path: string[] = []): string[] {
  const found: string[] = [];
  if (obj === null || obj === undefined) return found;
  if (typeof obj === 'string') return found;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      found.push(...deepRejectForbidden(obj[i], [...path, `[${i}]`]));
    }
    return found;
  }
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const upperKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
      if (TASK024_FORBIDDEN_OPERATION_FIELDS.some(f => f.toUpperCase() === upperKey || f === key)) {
        found.push([...path, key].join('.'));
      }
      found.push(...deepRejectForbidden(value, [...path, key]));
    }
  }
  return found;
}

export function validateTask024OperationsReadinessContext(ctx: unknown): Task024OperationsReadinessContext {
  if (!ctx || typeof ctx !== 'object') {
    throw createSafeError('Operations readiness context must be an object', 'INVALID_CONTEXT');
  }
  const c = ctx as Record<string, unknown>;
  if (!isValidString(c.actorId)) {
    throw createSafeError('actorId is required', 'MISSING_ACTOR_ID');
  }
  if (!isValidString(c.actorRole)) {
    throw createSafeError('actorRole is required', 'MISSING_ACTOR_ROLE');
  }
  if (LEARNER_PARENT_PEER_ROLES.includes(c.actorRole.toLowerCase())) {
    throw createSafeError('Operations readiness access denied for learner/parent/peer roles', 'ACCESS_DENIED_ROLE');
  }
  if (!ADMIN_INTERNAL_ROLES.includes(c.actorRole.toLowerCase())) {
    throw createSafeError('Operations readiness requires admin, internal, or operator role', 'INVALID_ROLE');
  }
  if (c.schoolId !== undefined && !isValidString(c.schoolId)) {
    throw createSafeError('schoolId must be a non-empty string when provided', 'INVALID_SCHOOL_ID');
  }
  if (c.operationEnvironment === undefined || !isValidString(c.operationEnvironment)) {
    throw createSafeError('operationEnvironment is required', 'MISSING_ENVIRONMENT');
  }
  const forbidden = deepRejectForbidden(ctx);
  if (forbidden.length > 0) {
    throw createSafeError(`Payload contains forbidden fields: ${forbidden.join(', ')}`, 'FORBIDDEN_FIELDS');
  }
  return ctx as Task024OperationsReadinessContext;
}

export function validateTask024OperationEnvironment(env: unknown): Task024OperationEnvironment {
  if (!isValidString(env)) {
    throw createSafeError('Operation environment must be a non-empty string', 'INVALID_ENVIRONMENT');
  }
  const validEnvs = ['local', 'test', 'ci', 'staging', 'production_like', 'production_candidate', 'production', 'unknown'];
  if (!validEnvs.includes(env.toLowerCase())) {
    throw createSafeError(`Unknown operation environment: ${env}`, 'UNKNOWN_ENVIRONMENT');
  }
  return env.toLowerCase() as Task024OperationEnvironment;
}

export function validateTask024MonitoringReadinessResult(result: unknown): Task024MonitoringReadinessResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Monitoring readiness result must be an object', 'INVALID_MONITORING_RESULT');
  }
  const r = result as Record<string, unknown>;
  if (typeof r.healthProbeCovered !== 'boolean') throw createSafeError('healthProbeCovered must be boolean', 'INVALID_MONITORING_FIELD');
  if (typeof r.readinessProbeCovered !== 'boolean') throw createSafeError('readinessProbeCovered must be boolean', 'INVALID_MONITORING_FIELD');
  if (typeof r.schoolAuthGateMonitored !== 'boolean') throw createSafeError('schoolAuthGateMonitored must be boolean', 'INVALID_MONITORING_FIELD');
  return result as Task024MonitoringReadinessResult;
}

export function validateTask024AlertPolicyResult(result: unknown): Task024AlertPolicyResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Alert policy result must be an object', 'INVALID_ALERT_RESULT');
  }
  const r = result as Record<string, unknown>;
  if (typeof r.policyDefined !== 'boolean') throw createSafeError('policyDefined must be boolean', 'INVALID_ALERT_FIELD');
  if (!isValidString(r.owner)) throw createSafeError('alert owner is required', 'MISSING_ALERT_OWNER');
  if (!isValidString(r.escalationPath)) throw createSafeError('alert escalation path is required', 'MISSING_ESCALATION_PATH');
  return result as Task024AlertPolicyResult;
}

export function validateTask024IncidentResponsePlan(plan: unknown): Task024IncidentResponsePlan {
  if (!plan || typeof plan !== 'object') {
    throw createSafeError('Incident response plan must be an object', 'INVALID_INCIDENT_PLAN');
  }
  const p = plan as Record<string, unknown>;
  if (!isValidString(p.incidentId)) throw createSafeError('incidentId is required', 'MISSING_INCIDENT_ID');
  if (!isValidString(p.owner)) throw createSafeError('incident owner is required', 'MISSING_INCIDENT_OWNER');
  if (!isValidString(p.escalationPath)) throw createSafeError('incident escalation path is required', 'MISSING_ESCALATION_PATH');
  return plan as Task024IncidentResponsePlan;
}

export function validateTask024IncidentSeverityDecision(decision: unknown): Task024IncidentSeverityDecision {
  if (!decision || typeof decision !== 'object') {
    throw createSafeError('Incident severity decision must be an object', 'INVALID_SEVERITY_DECISION');
  }
  return decision as Task024IncidentSeverityDecision;
}

export function validateTask024BackupReadinessResult(result: unknown): Task024BackupReadinessResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Backup readiness result must be an object', 'INVALID_BACKUP_RESULT');
  }
  const r = result as Record<string, unknown>;
  if (typeof r.scopeDefined !== 'boolean') throw createSafeError('scopeDefined must be boolean', 'INVALID_BACKUP_FIELD');
  if (typeof r.ownerDefined !== 'boolean') throw createSafeError('ownerDefined must be boolean', 'INVALID_BACKUP_FIELD');
  if (typeof r.noRawOutput !== 'boolean') throw createSafeError('noRawOutput must be boolean', 'INVALID_BACKUP_FIELD');
  if (r.noRawOutput !== true) throw createSafeError('Backup readiness must reject raw output', 'RAW_OUTPUT_NOT_REJECTED');
  return result as Task024BackupReadinessResult;
}

export function validateTask024RestoreDrillDryRunResult(result: unknown): Task024RestoreDrillDryRunResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Restore drill dry run result must be an object', 'INVALID_RESTORE_RESULT');
  }
  const r = result as Record<string, unknown>;
  if (r.dryRunMode !== true) throw createSafeError('Restore drill must be in dry-run mode', 'NOT_DRY_RUN');
  if (r.realRestoreBlocked !== true) throw createSafeError('Real restore must be blocked', 'REAL_RESTORE_NOT_BLOCKED');
  return result as Task024RestoreDrillDryRunResult;
}

export function validateTask024OperationalDataIntegrityResult(result: unknown): Task024OperationalDataIntegrityResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Data integrity result must be an object', 'INVALID_INTEGRITY_RESULT');
  }
  return result as Task024OperationalDataIntegrityResult;
}

export function validateTask024LoadSimulationPlan(plan: unknown): Task024LoadSimulationPlan {
  if (!plan || typeof plan !== 'object') {
    throw createSafeError('Load simulation plan must be an object', 'INVALID_SIMULATION_PLAN');
  }
  const p = plan as Record<string, unknown>;
  if (p.useLiveAi === true) throw createSafeError('Load simulation must not use live AI', 'LIVE_AI_FORBIDDEN');
  if (p.useLiveConnectors === true) throw createSafeError('Load simulation must not use live connectors', 'LIVE_CONNECTOR_FORBIDDEN');
  if (p.safeMockData !== true) throw createSafeError('Load simulation must use safe mock data', 'UNSAFE_MOCK_DATA');
  return plan as Task024LoadSimulationPlan;
}

export function validateTask024LoadSimulationResult(result: unknown): Task024LoadSimulationResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Load simulation result must be an object', 'INVALID_SIMULATION_RESULT');
  }
  const r = result as Record<string, unknown>;
  if (r.liveAiCalled === true) throw createSafeError('Load simulation must not call live AI', 'LIVE_AI_CALLED');
  if (r.liveConnectorCalled === true) throw createSafeError('Load simulation must not call live connectors', 'LIVE_CONNECTOR_CALLED');
  return result as Task024LoadSimulationResult;
}

export function validateTask024PerformanceBaselineResult(result: unknown): Task024PerformanceBaselineResult {
  if (!result || typeof result !== 'object') {
    throw createSafeError('Performance baseline result must be an object', 'INVALID_BASELINE_RESULT');
  }
  return result as Task024PerformanceBaselineResult;
}

export function validateTask024OperationsReadinessQuery(query: unknown): Task024OperationsReadinessQuery {
  if (!query || typeof query !== 'object') {
    throw createSafeError('Readiness query must be an object', 'INVALID_QUERY');
  }
  const q = query as Record<string, unknown>;
  if (q.schoolId !== undefined && !isValidString(q.schoolId)) {
    throw createSafeError('schoolId must be a non-empty string', 'INVALID_SCHOOL_ID');
  }
  return query as Task024OperationsReadinessQuery;
}
