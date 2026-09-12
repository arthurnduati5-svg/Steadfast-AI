import {
  PHASE3_REVISION_NODE_TYPES,
  PHASE3_REVISION_EDGE_TYPES,
  PHASE3_REVISION_NODE_STATUSES,
  PHASE3_REVISION_DUE_STATUSES,
  PHASE3_REVISION_PRIORITIES,
  PHASE3_REVISION_ACTIONS,
  PHASE3_REVISION_SOURCE_TYPES,
  PHASE3_REVISION_SIGNAL_TYPES,
  PHASE3_REVISION_FORBIDDEN_FIELDS,
  PHASE3_LIVING_REVISION_FORBIDDEN_FIELDS,
  Phase3RevisionContext,
  Phase3RevisionGraphQuery,
  Phase3RevisionQuery,
  Phase3RevisionTeacherQuery,
  Phase3RevisionNodeCreateInput,
  Phase3RevisionEdgeCreateInput,
} from '../contracts/phase3LivingRevisionContracts';

export interface Phase3RevisionValidationError {
  code: string;
  field?: string;
  message: string;
}

export function createSafeLivingRevisionValidationError(message: string): Phase3RevisionValidationError {
  return { code: 'REVISION_VALIDATION_ERROR', message };
}

export function createSafeRevisionValidationError(message: string): Phase3RevisionValidationError {
  return { code: 'REVISION_VALIDATION_ERROR', message };
}

export function validateLivingRevisionContext(ctx: any): Phase3RevisionValidationError | null {
  return validateRevisionContext(ctx);
}

export function validateRevisionContext(ctx: any): Phase3RevisionValidationError | null {
  if (!ctx || typeof ctx !== 'object') {
    return createSafeRevisionValidationError('Invalid revision context.');
  }
  if (!ctx.schoolId || typeof ctx.schoolId !== 'string' || ctx.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required.');
  }
  if (ctx.role === 'student' || ctx.role === 'learner') {
    if (!ctx.studentId || typeof ctx.studentId !== 'string' || ctx.studentId.trim().length === 0) {
      return createSafeRevisionValidationError('Learner identity is required for student role.');
    }
  }
  if (ctx.role === 'teacher' || ctx.role === 'admin' || ctx.role === 'internal') {
    if (!ctx.teacherId && !ctx.studentId) {
      return createSafeRevisionValidationError('Teacher or admin identity is required.');
    }
  }
  return null;
}

export function validateRevisionDueStatus(s: any): Phase3RevisionValidationError | null {
  if (!s || typeof s !== 'string') {
    return createSafeRevisionValidationError('Due status must be a string.');
  }
  if (!(PHASE3_REVISION_DUE_STATUSES as readonly string[]).includes(s)) {
    return createSafeRevisionValidationError(`Unsupported revision due status: ${s}`);
  }
  return null;
}

export function validateRevisionQuery(q: any): Phase3RevisionValidationError | null {
  if (!q || typeof q !== 'object') {
    return createSafeRevisionValidationError('Invalid revision query.');
  }
  if (!q.schoolId || typeof q.schoolId !== 'string' || q.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required in revision query.');
  }
  if (!q.studentId || typeof q.studentId !== 'string' || q.studentId.trim().length === 0) {
    return createSafeRevisionValidationError('Learner identity is required in revision query.');
  }
  if (q.nodeType) {
    const nodeTypeErr = validateRevisionNodeType(q.nodeType);
    if (nodeTypeErr) return nodeTypeErr;
  }
  if (q.statusFilter) {
    const statusErr = validateRevisionNodeStatus(q.statusFilter);
    if (statusErr) return statusErr;
  }
  if (q.dueStatusFilter) {
    const dueStatusErr = validateRevisionDueStatus(q.dueStatusFilter);
    if (dueStatusErr) return dueStatusErr;
  }
  return null;
}

export function validateRevisionGraphQuery(q: any): Phase3RevisionValidationError | null {
  if (!q || typeof q !== 'object') {
    return createSafeRevisionValidationError('Invalid revision graph query.');
  }
  if (!q.schoolId || typeof q.schoolId !== 'string' || q.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required in graph query.');
  }
  if (!q.studentId || typeof q.studentId !== 'string' || q.studentId.trim().length === 0) {
    return createSafeRevisionValidationError('Learner identity is required in graph query.');
  }
  return null;
}

export function validateRevisionTeacherQuery(q: any): Phase3RevisionValidationError | null {
  if (!q || typeof q !== 'object') {
    return createSafeRevisionValidationError('Invalid teacher revision query.');
  }
  if (!q.schoolId || typeof q.schoolId !== 'string' || q.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required in teacher query.');
  }
  if (!q.teacherId || typeof q.teacherId !== 'string' || q.teacherId.trim().length === 0) {
    return createSafeRevisionValidationError('Teacher identity is required in teacher query.');
  }
  if (!q.role || typeof q.role !== 'string' || q.role.trim().length === 0) {
    return createSafeRevisionValidationError('Role is required in teacher query.');
  }
  return null;
}

export function validateRevisionNodeCreateInput(input: any): Phase3RevisionValidationError | null {
  if (!input || typeof input !== 'object') {
    return createSafeRevisionValidationError('Invalid revision node input.');
  }
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required.');
  }
  if (!input.nodeType) {
    return createSafeRevisionValidationError('Node type is required.');
  }
  const nodeTypeErr = validateRevisionNodeType(input.nodeType);
  if (nodeTypeErr) return nodeTypeErr;
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length === 0) {
    return createSafeRevisionValidationError('Safe title is required.');
  }
  if (!input.safeSummary || typeof input.safeSummary !== 'string' || input.safeSummary.trim().length === 0) {
    return createSafeRevisionValidationError('Safe summary is required.');
  }
  if (!input.sourceTruth || typeof input.sourceTruth !== 'object') {
    return createSafeRevisionValidationError('Source truth is required.');
  }
  if (!input.sourceTruth.status) {
    return createSafeRevisionValidationError('Source truth status is required.');
  }
  const forbiddenErr = rejectForbiddenRevisionPayloadFields(input);
  if (forbiddenErr) return forbiddenErr;
  return null;
}

export function validateRevisionEdgeCreateInput(input: any): Phase3RevisionValidationError | null {
  if (!input || typeof input !== 'object') {
    return createSafeRevisionValidationError('Invalid revision edge input.');
  }
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim().length === 0) {
    return createSafeRevisionValidationError('School identity is required.');
  }
  if (!input.edgeType) {
    return createSafeRevisionValidationError('Edge type is required.');
  }
  const edgeTypeErr = validateRevisionEdgeType(input.edgeType);
  if (edgeTypeErr) return edgeTypeErr;
  if (!input.sourceNodeId || typeof input.sourceNodeId !== 'string' || input.sourceNodeId.trim().length === 0) {
    return createSafeRevisionValidationError('Source node ID is required.');
  }
  if (!input.targetNodeId || typeof input.targetNodeId !== 'string' || input.targetNodeId.trim().length === 0) {
    return createSafeRevisionValidationError('Target node ID is required.');
  }
  const forbiddenErr = rejectForbiddenRevisionPayloadFields(input);
  if (forbiddenErr) return forbiddenErr;
  return null;
}

export function validateRevisionNodeType(t: any): Phase3RevisionValidationError | null {
  if (!t || typeof t !== 'string') {
    return createSafeRevisionValidationError('Node type must be a string.');
  }
  if (!(PHASE3_REVISION_NODE_TYPES as readonly string[]).includes(t)) {
    return createSafeRevisionValidationError(`Unsupported revision node type: ${t}`);
  }
  return null;
}

export function validateRevisionEdgeType(t: any): Phase3RevisionValidationError | null {
  if (!t || typeof t !== 'string') {
    return createSafeRevisionValidationError('Edge type must be a string.');
  }
  if (!(PHASE3_REVISION_EDGE_TYPES as readonly string[]).includes(t)) {
    return createSafeRevisionValidationError(`Unsupported revision edge type: ${t}`);
  }
  return null;
}

export function validateRevisionNodeStatus(s: any): Phase3RevisionValidationError | null {
  if (!s || typeof s !== 'string') {
    return createSafeRevisionValidationError('Node status must be a string.');
  }
  if (!(PHASE3_REVISION_NODE_STATUSES as readonly string[]).includes(s)) {
    return createSafeRevisionValidationError(`Unsupported revision node status: ${s}`);
  }
  return null;
}

export function validateRevisionPriority(p: any): Phase3RevisionValidationError | null {
  if (!p || typeof p !== 'string') {
    return createSafeRevisionValidationError('Priority must be a string.');
  }
  if (!(PHASE3_REVISION_PRIORITIES as readonly string[]).includes(p)) {
    return createSafeRevisionValidationError(`Unsupported revision priority: ${p}`);
  }
  return null;
}

export function validateRevisionAction(a: any): Phase3RevisionValidationError | null {
  if (!a || typeof a !== 'string') {
    return createSafeRevisionValidationError('Action must be a string.');
  }
  if (!(PHASE3_REVISION_ACTIONS as readonly string[]).includes(a)) {
    return createSafeRevisionValidationError(`Unsupported revision action: ${a}`);
  }
  return null;
}

export function validateRevisionSourceType(s: any): Phase3RevisionValidationError | null {
  if (!s || typeof s !== 'string') {
    return createSafeRevisionValidationError('Source type must be a string.');
  }
  if (!(PHASE3_REVISION_SOURCE_TYPES as readonly string[]).includes(s)) {
    return createSafeRevisionValidationError(`Unsupported revision source type: ${s}`);
  }
  return null;
}

export function validateRevisionSignalType(s: any): Phase3RevisionValidationError | null {
  if (!s || typeof s !== 'string') {
    return createSafeRevisionValidationError('Signal type must be a string.');
  }
  if (!(PHASE3_REVISION_SIGNAL_TYPES as readonly string[]).includes(s)) {
    return createSafeRevisionValidationError(`Unsupported revision signal type: ${s}`);
  }
  return null;
}

export function rejectForbiddenLivingRevisionPayloadFields(payload: any): Phase3RevisionValidationError | null {
  return rejectForbiddenRevisionPayloadFields(payload);
}

export function rejectForbiddenRevisionPayloadFields(payload: any): Phase3RevisionValidationError | null {
  if (!payload || typeof payload !== 'object') return null;
  const forbiddenSet = new Set([...PHASE3_REVISION_FORBIDDEN_FIELDS, ...PHASE3_LIVING_REVISION_FORBIDDEN_FIELDS] as readonly string[]);
  for (const key of Object.keys(payload)) {
    if (forbiddenSet.has(key)) {
      return createSafeRevisionValidationError(`Forbidden field in revision payload: ${key}`);
    }
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedErr = rejectForbiddenRevisionPayloadFields(value);
      if (nestedErr) return nestedErr;
    }
  }
  return null;
}
