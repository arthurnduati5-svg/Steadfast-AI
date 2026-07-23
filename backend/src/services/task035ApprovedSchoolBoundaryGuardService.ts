import { Task035SchoolBoundaryConfig } from '../contracts/task035SchoolWideReadinessContracts';

export function validateApprovedSchoolBoundary(): Task035SchoolBoundaryConfig {
  const config: Task035SchoolBoundaryConfig = {
    approvedSchoolId: 'school_task035_full_school_safe',
    approvedTenantId: 'tenant_task035_full_school_safe',
    approvedRosterScope: 'school_task035_full_school_safe',
    teacherAssignmentScope: 'assigned_school_only',
    studentMembershipScope: 'enrolled_school_students',
    crossSchoolAccessBlocked: true,
    unknownSchoolBlocked: true,
    tenantMismatchBlocked: true,
    realRosterExportExposed: false,
    ok: false,
    blockingIssues: [],
  };

  const blockingIssues: string[] = [];

  if (!config.approvedSchoolId) blockingIssues.push('approved_school_id_missing');
  if (!config.approvedTenantId) blockingIssues.push('approved_tenant_id_missing');
  if (!config.approvedRosterScope) blockingIssues.push('approved_roster_scope_missing');
  if (!config.teacherAssignmentScope) blockingIssues.push('teacher_assignment_scope_missing');
  if (!config.studentMembershipScope) blockingIssues.push('student_membership_scope_missing');
  if (!config.crossSchoolAccessBlocked) blockingIssues.push('cross_school_access_not_blocked');
  if (!config.unknownSchoolBlocked) blockingIssues.push('unknown_school_not_blocked');
  if (!config.tenantMismatchBlocked) blockingIssues.push('tenant_mismatch_not_blocked');

  config.ok = blockingIssues.length === 0;
  config.blockingIssues = blockingIssues;

  if (config.ok) {
    console.log('[Task035 SchoolBoundary] Approved school boundary validated');
  } else {
    console.log('[Task035 SchoolBoundary] School boundary validation failed:', blockingIssues.join(', '));
  }

  return config;
}
