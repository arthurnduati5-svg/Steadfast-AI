import {
  TASK020_ACTOR_ROLES, TASK020_DATA_CATEGORIES, TASK020_DATA_CLASSIFICATION_LEVELS,
  TASK020_ACCESS_DECISIONS, TASK020_VISIBILITY_SCOPES, TASK020_EGRESS_DECISIONS,
  TASK020_RETENTION_ACTIONS, TASK020_FORBIDDEN_FIELDS,
  type Task020GovernanceContext, type Task020DataClassification,
  type Task020RoleAccessRequest, type Task020AiEgressRequest,
  type Task020ExportRequest, type Task020DeleteRequest,
  type Task020ActorRole, type Task020DataCategory,
  type Task020DataClassificationLevel, type Task020AccessDecision,
  type Task020VisibilityScope, type Task020EgressDecision,
  type Task020RetentionAction,
} from '../contracts/task020SecurityPrivacyGovernanceContracts';

export interface Task020ValidationError {
  code: string;
  message: string;
  field?: string;
}

export function validateTask020GovernanceContext(ctx: unknown): { valid: boolean; errors: Task020ValidationError[]; context?: Task020GovernanceContext } {
  const errors: Task020ValidationError[] = [];
  if (!ctx || typeof ctx !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'Governance context must be a non-null object.' });
    return { valid: false, errors };
  }
  const c = ctx as Record<string, unknown>;
  if (!c.schoolId || typeof c.schoolId !== 'string' || c.schoolId.trim().length === 0) {
    errors.push({ code: 'MISSING_SCHOOL_ID', message: 'schoolId is required.', field: 'schoolId' });
  }
  if (!c.verifiedSchoolContext) {
    errors.push({ code: 'MISSING_VERIFIED_CONTEXT', message: 'Verified school context is required.', field: 'verifiedSchoolContext' });
  }
  if (!c.actorId || typeof c.actorId !== 'string') {
    errors.push({ code: 'MISSING_ACTOR_ID', message: 'actorId is required.', field: 'actorId' });
  }
  const roleError = validateTask020ActorRole(c.actorRole);
  if (roleError) {
    errors.push(roleError);
  }
  if (c.actorRole === 'anonymous' || c.actorRole === 'unknown') {
    errors.push({ code: 'ANONYMOUS_DENIED', message: 'Anonymous and unknown roles are denied access.', field: 'actorRole' });
  }
  if (errors.length > 0) return { valid: false, errors };
  const context: Task020GovernanceContext = {
    schoolId: c.schoolId as string,
    actorId: c.actorId as string,
    actorRole: c.actorRole as Task020ActorRole,
    targetLearnerId: c.targetLearnerId as string | undefined,
    targetParentId: c.targetParentId as string | undefined,
    targetTeacherId: c.targetTeacherId as string | undefined,
    verifiedSchoolContext: true,
    correlationId: c.correlationId as string | undefined,
    requestId: c.requestId as string | undefined,
  };
  return { valid: true, errors: [], context };
}

export function validateTask020DataClassification(dc: unknown): { valid: boolean; errors: Task020ValidationError[] } {
  const errors: Task020ValidationError[] = [];
  if (!dc || typeof dc !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'Data classification must be a non-null object.' });
    return { valid: false, errors };
  }
  const d = dc as Record<string, unknown>;
  const catErr = validateTask020DataCategory(d.category);
  if (catErr) errors.push(catErr);
  const lvlErr = validateTask020DataClassificationLevel(d.classificationLevel);
  if (lvlErr) errors.push(lvlErr);
  return { valid: errors.length === 0, errors };
}

export function validateTask020RoleAccessRequest(req: unknown): { valid: boolean; errors: Task020ValidationError[] } {
  const errors: Task020ValidationError[] = [];
  if (!req || typeof req !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'Role access request must be a non-null object.' });
    return { valid: false, errors };
  }
  const r = req as Record<string, unknown>;
  if (!r.schoolId || typeof r.schoolId !== 'string') {
    errors.push({ code: 'MISSING_SCHOOL_ID', message: 'schoolId is required.', field: 'schoolId' });
  }
  const roleErr = validateTask020ActorRole(r.actorRole);
  if (roleErr) errors.push(roleErr);
  const catErr = validateTask020DataCategory(r.dataCategory);
  if (catErr) errors.push(catErr);
  return { valid: errors.length === 0, errors };
}

export function validateTask020AiEgressRequest(req: unknown): { valid: boolean; errors: Task020ValidationError[] } {
  const errors: Task020ValidationError[] = [];
  if (!req || typeof req !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'AI egress request must be a non-null object.' });
    return { valid: false, errors };
  }
  const r = req as Record<string, unknown>;
  if (!r.targetProvider || typeof r.targetProvider !== 'string') {
    errors.push({ code: 'MISSING_TARGET_PROVIDER', message: 'targetProvider is required.', field: 'targetProvider' });
  }
  if (!r.tutorMode || typeof r.tutorMode !== 'string') {
    errors.push({ code: 'MISSING_TUTOR_MODE', message: 'tutorMode is required.', field: 'tutorMode' });
  }
  const egressErr = validateTask020EgressDecision(r.egressDecision as string | undefined);
  if (egressErr) errors.push(egressErr);
  return { valid: errors.length === 0, errors };
}

export function validateTask020ExportRequest(req: unknown): { valid: boolean; errors: Task020ValidationError[] } {
  const errors: Task020ValidationError[] = [];
  if (!req || typeof req !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'Export request must be a non-null object.' });
    return { valid: false, errors };
  }
  const r = req as Record<string, unknown>;
  if (!r.schoolId || typeof r.schoolId !== 'string') {
    errors.push({ code: 'MISSING_SCHOOL_ID', message: 'schoolId is required.', field: 'schoolId' });
  }
  const roleErr = validateTask020ActorRole(r.requesterRole);
  if (roleErr) errors.push(roleErr);
  return { valid: errors.length === 0, errors };
}

export function validateTask020DeleteRequest(req: unknown): { valid: boolean; errors: Task020ValidationError[] } {
  const errors: Task020ValidationError[] = [];
  if (!req || typeof req !== 'object') {
    errors.push({ code: 'INVALID_INPUT', message: 'Delete request must be a non-null object.' });
    return { valid: false, errors };
  }
  const r = req as Record<string, unknown>;
  if (!r.schoolId || typeof r.schoolId !== 'string') {
    errors.push({ code: 'MISSING_SCHOOL_ID', message: 'schoolId is required.', field: 'schoolId' });
  }
  const roleErr = validateTask020ActorRole(r.requesterRole);
  if (roleErr) errors.push(roleErr);
  return { valid: errors.length === 0, errors };
}

export function validateTask020ActorRole(role: unknown): Task020ValidationError | null {
  if (!role || typeof role !== 'string') {
    return { code: 'INVALID_ROLE', message: 'actorRole must be a non-empty string.', field: 'actorRole' };
  }
  if (!(TASK020_ACTOR_ROLES as readonly string[]).includes(role)) {
    return { code: 'UNSUPPORTED_ROLE', message: `Unsupported actor role: ${role}`, field: 'actorRole' };
  }
  return null;
}

export function validateTask020DataCategory(category: unknown): Task020ValidationError | null {
  if (!category || typeof category !== 'string') {
    return { code: 'INVALID_CATEGORY', message: 'dataCategory must be a non-empty string.', field: 'dataCategory' };
  }
  if (!(TASK020_DATA_CATEGORIES as readonly string[]).includes(category)) {
    return { code: 'UNSUPPORTED_CATEGORY', message: `Unsupported data category: ${category}`, field: 'dataCategory' };
  }
  return null;
}

export function validateTask020DataClassificationLevel(level: unknown): Task020ValidationError | null {
  if (!level || typeof level !== 'string') {
    return { code: 'INVALID_LEVEL', message: 'classificationLevel must be a non-empty string.', field: 'classificationLevel' };
  }
  if (!(TASK020_DATA_CLASSIFICATION_LEVELS as readonly string[]).includes(level)) {
    return { code: 'UNSUPPORTED_LEVEL', message: `Unsupported classification level: ${level}`, field: 'classificationLevel' };
  }
  return null;
}

export function validateTask020AccessDecision(decision: unknown): Task020ValidationError | null {
  if (!decision || typeof decision !== 'string') return null;
  if (!(TASK020_ACCESS_DECISIONS as readonly string[]).includes(decision)) {
    return { code: 'UNSUPPORTED_DECISION', message: `Unsupported access decision: ${decision}`, field: 'accessDecision' };
  }
  return null;
}

export function validateTask020VisibilityScope(scope: unknown): Task020ValidationError | null {
  if (!scope || typeof scope !== 'string') return null;
  if (!(TASK020_VISIBILITY_SCOPES as readonly string[]).includes(scope)) {
    return { code: 'UNSUPPORTED_SCOPE', message: `Unsupported visibility scope: ${scope}`, field: 'visibilityScope' };
  }
  return null;
}

export function validateTask020EgressDecision(decision: unknown): Task020ValidationError | null {
  if (!decision || typeof decision !== 'string') return null;
  if (!(TASK020_EGRESS_DECISIONS as readonly string[]).includes(decision)) {
    return { code: 'UNSUPPORTED_EGRESS', message: `Unsupported egress decision: ${decision}`, field: 'egressDecision' };
  }
  return null;
}

export function validateTask020RetentionAction(action: unknown): Task020ValidationError | null {
  if (!action || typeof action !== 'string') return null;
  if (!(TASK020_RETENTION_ACTIONS as readonly string[]).includes(action)) {
    return { code: 'UNSUPPORTED_RETENTION', message: `Unsupported retention action: ${action}`, field: 'retentionAction' };
  }
  return null;
}

export function rejectForbiddenTask020PayloadFields(payload: Record<string, unknown>): { valid: boolean; forbiddenFields: string[] } {
  const forbiddenFields: string[] = [];
  const searchField = (obj: unknown, path: string): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const fullPath = path ? `${path}.${key}` : key;
      if ((TASK020_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
        forbiddenFields.push(fullPath);
      }
      const val = (obj as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        searchField(val, fullPath);
      }
    }
  };
  searchField(payload, '');
  return { valid: forbiddenFields.length === 0, forbiddenFields };
}

export function createSafeTask020ValidationError(code: string, message: string): Task020ValidationError {
  return { code, message };
}
