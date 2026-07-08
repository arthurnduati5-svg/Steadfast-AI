import { describe, it, expect } from 'vitest';
import {
  Task029OperationsContext,
  Task029Task028DependencyInput,
  Task029Task028DependencyResult,
  Task029OperationsPermissionResult,
  Task029OperationsDashboard,
  Task029ExpansionRunOperationsStatus,
  Task029CohortOperationsSummary,
  Task029StageOperationsSummary,
  Task029HealthOperationsSummary,
  Task029TeacherOversightOperationsSummary,
  Task029LearnerOwnStatus,
  Task029ControlActionPreflightResult,
  Task029ControlActionResult,
  Task029RollbackCommandResult,
  Task029AcceptanceReport,
  TASK029_OPERATION_PANEL_IDS,
  TASK029_OPERATION_ACTIONS,
  TASK029_OPERATION_ACTION_STATUSES,
  TASK029_OPERATION_ROLES,
  TASK029_OPERATION_PERMISSIONS,
  TASK029_OPERATION_RISK_LEVELS,
  TASK029_OPERATION_DECISIONS,
  TASK029_OPERATION_BLOCKER_TYPES,
  TASK029_OPERATION_AUDIT_EVENTS,
  TASK029_OPERATION_EVIDENCE_EVENT_TYPES,
  TASK029_FORBIDDEN_FIELDS,
  TASK029_SAFE_TO_NEXT_TASK_STATUS,
  resolveExpansionOpsRole,
  getRolePermissionsList,
  ExpansionOperationsRole,
} from '../contracts/task029ExpansionOperationsContracts';

describe('Task029 module smoke test', () => {
  it('exports TASK029_OPERATION_PANEL_IDS covering dashboard, run-status, audit-timeline', () => {
    expect(TASK029_OPERATION_PANEL_IDS).toContain('dashboard');
    expect(TASK029_OPERATION_PANEL_IDS).toContain('audit-timeline');
    expect(TASK029_OPERATION_PANEL_IDS.length).toBeGreaterThan(5);
  });

  it('exports TASK029_OPERATION_ACTIONS including pause_expansion and execute_kill_switch', () => {
    expect(TASK029_OPERATION_ACTIONS).toContain('pause_expansion');
    expect(TASK029_OPERATION_ACTIONS).toContain('execute_kill_switch');
  });

  it('exports TASK029_FORBIDDEN_FIELDS protecting raw student, teacher, and provider data', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('providerPrompt');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
  });

  it('resolveExpansionOpsRole maps admin to school_admin and student to learner_in_approved_expanded_cohort', () => {
    expect(resolveExpansionOpsRole('admin')).toBe('school_admin');
    expect(resolveExpansionOpsRole('teacher')).toBe('teacher_assigned_to_expansion');
    expect(resolveExpansionOpsRole('student')).toBe('learner_in_approved_expanded_cohort');
  });

  it('getRolePermissionsList returns expected permissions for school_admin', () => {
    const perms = getRolePermissionsList('school_admin');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('pause_expansion');
    expect(perms).toContain('execute_kill_switch');
    expect(perms).toContain('generate_task029_report');
  });

  it('exports types are usable at runtime', () => {
    const role: ExpansionOperationsRole = 'internal_operator';
    const ctx: Task029OperationsContext = { schoolId: 's1', actorId: 'a1', actorRole: 'internal_operator' };
    expect(role).toBe('internal_operator');
    expect(ctx.schoolId).toBe('s1');
    expect(ctx.actorRole).toBe('internal_operator');
  });
});
