import { randomUUID } from 'crypto';
import {
  TeacherSafeReportAuditEvent,
  TeacherSafeReportAuditEventType,
  TeacherSafeInsightType,
  TeacherSafePolicyDecision,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';

const auditStore: TeacherSafeReportAuditEvent[] = [];

export async function recordTeacherSafeAuditEvent(
  schoolId: string,
  teacherId: string,
  reportType: TeacherSafeInsightType,
  policyDecision: TeacherSafePolicyDecision,
  safeReasonCodes: TeacherSafeReasonCode[],
  classId?: string,
  studentId?: string,
): Promise<TeacherSafeReportAuditEvent> {
  const event: TeacherSafeReportAuditEvent = {
    id: `tsa-${randomUUID()}`,
    schoolId,
    teacherId,
    classId,
    studentId,
    reportType,
    policyDecision,
    safeReasonCodes,
    createdAt: new Date().toISOString(),
  };
  auditStore.push(event);
  while (auditStore.length > 1000) {
    auditStore.shift();
  }
  return event;
}

export function listTeacherSafeAuditEvents(
  schoolId: string,
  options?: {
    studentId?: string;
    reportType?: TeacherSafeInsightType;
    limit?: number;
  },
): TeacherSafeReportAuditEvent[] {
  let results = auditStore.filter(r => r.schoolId === schoolId);
  if (options?.studentId) {
    results = results.filter(r => r.studentId === options.studentId);
  }
  if (options?.reportType) {
    results = results.filter(r => r.reportType === options.reportType);
  }
  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const maxLimit = Math.min(options?.limit || 200, 200);
  return results.slice(0, maxLimit);
}

export function clearTeacherSafeAuditStore(): void {
  auditStore.length = 0;
}

export function getTeacherSafeAuditCount(): number {
  return auditStore.length;
}

// ── Legacy v1 audit record types ──

interface LegacyAuditRecord {
  eventId: string;
  actorId: string;
  actorRole: string;
  schoolId: string;
  classId?: string;
  studentId?: string;
  reportType: string;
  scopeDecision: { allowed: boolean; reason: string; code: string };
  privacyDecision: { safe: boolean; errors: string[]; warnings: string[]; metadata: any };
  redactionApplied: boolean;
  minimumNecessary: boolean;
  generatedAt: string;
  requestId: string;
}

const legacyAuditStore: LegacyAuditRecord[] = [];

function toLegacyRecord(
  params: {
    actorId: string; actorRole: string; schoolId: string;
    classId?: string; studentId?: string;
    reportType: string; scopeDecision: any;
    privacyDecision?: any; redactionApplied?: boolean;
    minimumNecessary?: boolean; requestId?: string;
  },
): LegacyAuditRecord {
  const record: LegacyAuditRecord = {
    eventId: `leg-${randomUUID()}`,
    actorId: params.actorId,
    actorRole: params.actorRole,
    schoolId: params.schoolId,
    classId: params.classId,
    studentId: params.studentId,
    reportType: params.reportType || 'student_summary',
    scopeDecision: params.scopeDecision || { allowed: true, reason: 'ok', code: 'ok' },
    privacyDecision: params.privacyDecision || { safe: true, errors: [], warnings: [], metadata: {} },
    redactionApplied: params.redactionApplied ?? false,
    minimumNecessary: params.minimumNecessary ?? true,
    generatedAt: new Date().toISOString(),
    requestId: params.requestId || 'unknown',
  };
  legacyAuditStore.push(record);
  while (legacyAuditStore.length > 1000) {
    legacyAuditStore.shift();
  }
  return record;
}

export async function recordTeacherReportAudit(
  params: {
    actorId: string; actorRole: string; schoolId: string;
    classId?: string; studentId?: string;
    reportType: string; scopeDecision: any;
    privacyDecision?: any; redactionApplied?: boolean;
    minimumNecessary?: boolean; requestId?: string;
  },
): Promise<LegacyAuditRecord>;
export async function recordTeacherReportAudit(
  schoolId: string, teacherId: string,
  reportType: TeacherSafeInsightType, policyDecision: TeacherSafePolicyDecision,
  safeReasonCodes: TeacherSafeReasonCode[], classId?: string, studentId?: string,
): Promise<TeacherSafeReportAuditEvent>;
export async function recordTeacherReportAudit(
  a: any, b?: any, c?: any, d?: any, e?: any, f?: any, g?: any,
): Promise<any> {
  if (typeof a === 'string' && typeof b === 'string') {
    return recordTeacherSafeAuditEvent(a, b, c, d, e, f, g);
  }
  return toLegacyRecord(a);
}

export function listTeacherReportAuditRecords(
  schoolId: string,
  options?: { studentId?: string; reportType?: string; limit?: number },
): LegacyAuditRecord[] {
  let results = legacyAuditStore.filter(r => r.schoolId === schoolId);
  if (options?.studentId) {
    results = results.filter(r => r.studentId === options.studentId);
  }
  if (options?.reportType) {
    results = results.filter(r => r.reportType === options.reportType);
  }
  results.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const maxLimit = Math.min(options?.limit || 200, 200);
  return results.slice(0, maxLimit);
}

export function clearAuditStore(): void {
  legacyAuditStore.length = 0;
}

export function getAuditRecordCount(): number {
  return legacyAuditStore.length;
}

export async function recordTeacherReportPrivacyBlocked(
  params: {
    actorId: string; actorRole: string; schoolId: string;
    classId?: string; studentId?: string;
    reportType: string; privacyDecision: any;
    requestId?: string;
  },
): Promise<LegacyAuditRecord> {
  return toLegacyRecord({
    ...params,
    scopeDecision: { allowed: true, reason: 'ok', code: 'ok' },
    redactionApplied: true,
    minimumNecessary: false,
  });
}

export async function recordTeacherReportScopeDenied(
  params: {
    actorId: string; actorRole: string; schoolId: string;
    classId?: string; studentId?: string;
    reportType: string; scopeDecision: any;
    requestId?: string;
  },
): Promise<LegacyAuditRecord>;
export async function recordTeacherReportScopeDenied(
  scope: string,
  context: { schoolId: string; teacherId: string; role: string; classId?: string; studentId?: string },
): Promise<TeacherSafeReportAuditEvent>;
export async function recordTeacherReportScopeDenied(
  a: any, b?: any,
): Promise<any> {
  if (typeof a === 'string' && b) {
    return recordTeacherSafeAuditEvent(
      b.schoolId, b.teacherId,
      'learner_summary' as TeacherSafeInsightType,
      'blocked_scope_not_proven' as TeacherSafePolicyDecision,
      ['teacher_scope_not_proven'] as TeacherSafeReasonCode[],
      b.classId, b.studentId,
    );
  }
  const params = a as any;
  return toLegacyRecord({
    ...params,
    scopeDecision: params.scopeDecision || { allowed: false, reason: 'Scope denied', code: 'scope_denied' },
    privacyDecision: params.privacyDecision || { safe: false, errors: ['Scope denied'], warnings: [], metadata: {} },
    redactionApplied: false,
    minimumNecessary: true,
  });
}
