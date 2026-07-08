import { describe, it, expect } from 'vitest';
import {
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
} from '../contracts/task029ExpansionOperationsContracts';

describe('TASK029_OPERATION_PANEL_IDS', () => {
  it('should contain 14 panel IDs', () => {
    expect(TASK029_OPERATION_PANEL_IDS).toHaveLength(14);
  });

  it('should include dashboard and run-status', () => {
    expect(TASK029_OPERATION_PANEL_IDS).toContain('dashboard');
    expect(TASK029_OPERATION_PANEL_IDS).toContain('run-status');
  });

  it('should include report and diagnostics', () => {
    expect(TASK029_OPERATION_PANEL_IDS).toContain('report');
    expect(TASK029_OPERATION_PANEL_IDS).toContain('diagnostics');
  });

  it('should include learner-own-status and intervention-queue', () => {
    expect(TASK029_OPERATION_PANEL_IDS).toContain('learner-own-status');
    expect(TASK029_OPERATION_PANEL_IDS).toContain('intervention-queue');
  });
});

describe('TASK029_OPERATION_ACTIONS', () => {
  it('should contain 5 actions', () => {
    expect(TASK029_OPERATION_ACTIONS).toHaveLength(5);
  });

  it('should include pause_expansion and resume_expansion', () => {
    expect(TASK029_OPERATION_ACTIONS).toContain('pause_expansion');
    expect(TASK029_OPERATION_ACTIONS).toContain('resume_expansion');
  });

  it('should include execute_kill_switch', () => {
    expect(TASK029_OPERATION_ACTIONS).toContain('execute_kill_switch');
  });
});

describe('TASK029_OPERATION_ACTION_STATUSES', () => {
  it('should contain 5 statuses', () => {
    expect(TASK029_OPERATION_ACTION_STATUSES).toHaveLength(5);
  });

  it('should include pending and failed', () => {
    expect(TASK029_OPERATION_ACTION_STATUSES).toContain('pending');
    expect(TASK029_OPERATION_ACTION_STATUSES).toContain('failed');
  });
});

describe('TASK029_OPERATION_ROLES', () => {
  it('should contain 12 roles', () => {
    expect(TASK029_OPERATION_ROLES).toHaveLength(12);
  });

  it('should include school_admin and system_admin', () => {
    expect(TASK029_OPERATION_ROLES).toContain('school_admin');
    expect(TASK029_OPERATION_ROLES).toContain('system_admin');
  });

  it('should include learner_in_approved_expanded_cohort', () => {
    expect(TASK029_OPERATION_ROLES).toContain('learner_in_approved_expanded_cohort');
  });
});

describe('TASK029_OPERATION_PERMISSIONS', () => {
  it('should contain 20 permissions', () => {
    expect(TASK029_OPERATION_PERMISSIONS).toHaveLength(20);
  });

  it('should include view_operations_dashboard and view_learner_own_status', () => {
    expect(TASK029_OPERATION_PERMISSIONS).toContain('view_operations_dashboard');
    expect(TASK029_OPERATION_PERMISSIONS).toContain('view_learner_own_status');
  });

  it('should include execute_kill_switch', () => {
    expect(TASK029_OPERATION_PERMISSIONS).toContain('execute_kill_switch');
  });
});

describe('TASK029_OPERATION_RISK_LEVELS', () => {
  it('should contain 4 levels', () => {
    expect(TASK029_OPERATION_RISK_LEVELS).toHaveLength(4);
  });

  it('should include low and critical', () => {
    expect(TASK029_OPERATION_RISK_LEVELS).toContain('low');
    expect(TASK029_OPERATION_RISK_LEVELS).toContain('critical');
  });
});

describe('TASK029_OPERATION_DECISIONS', () => {
  it('should contain 5 decisions', () => {
    expect(TASK029_OPERATION_DECISIONS).toHaveLength(5);
  });

  it('should include proceed and rollback', () => {
    expect(TASK029_OPERATION_DECISIONS).toContain('proceed');
    expect(TASK029_OPERATION_DECISIONS).toContain('rollback');
  });
});

describe('TASK029_OPERATION_BLOCKER_TYPES', () => {
  it('should contain 18 blocker types', () => {
    expect(TASK029_OPERATION_BLOCKER_TYPES).toHaveLength(18);
  });

  it('should include task028_proof_missing and role_denied', () => {
    expect(TASK029_OPERATION_BLOCKER_TYPES).toContain('task028_proof_missing');
    expect(TASK029_OPERATION_BLOCKER_TYPES).toContain('role_denied');
  });
});

describe('TASK029_OPERATION_AUDIT_EVENTS', () => {
  it('should contain 15 events', () => {
    expect(TASK029_OPERATION_AUDIT_EVENTS).toHaveLength(15);
  });

  it('should include operation_viewed and control_preflight_passed', () => {
    expect(TASK029_OPERATION_AUDIT_EVENTS).toContain('operation_viewed');
    expect(TASK029_OPERATION_AUDIT_EVENTS).toContain('control_preflight_passed');
  });
});

describe('TASK029_OPERATION_EVIDENCE_EVENT_TYPES', () => {
  it('should contain 6 event types', () => {
    expect(TASK029_OPERATION_EVIDENCE_EVENT_TYPES).toHaveLength(6);
  });

  it('should include access_allowed and intervention_created', () => {
    expect(TASK029_OPERATION_EVIDENCE_EVENT_TYPES).toContain('access_allowed');
    expect(TASK029_OPERATION_EVIDENCE_EVENT_TYPES).toContain('intervention_created');
  });
});

describe('TASK029_FORBIDDEN_FIELDS', () => {
  it('should be a non-empty array', () => {
    expect(TASK029_FORBIDDEN_FIELDS.length).toBeGreaterThan(50);
  });

  it('should include rawStudentData and rawSafeguardingNote', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
  });
});

describe('TASK029_SAFE_TO_NEXT_TASK_STATUS', () => {
  it('should contain 4 statuses', () => {
    expect(TASK029_SAFE_TO_NEXT_TASK_STATUS).toHaveLength(4);
  });

  it('should include task030_ready and task030_blocked', () => {
    expect(TASK029_SAFE_TO_NEXT_TASK_STATUS).toContain('task030_ready');
    expect(TASK029_SAFE_TO_NEXT_TASK_STATUS).toContain('task030_blocked');
  });
});

describe('resolveExpansionOpsRole', () => {
  it('should map admin to school_admin', () => {
    expect(resolveExpansionOpsRole('admin')).toBe('school_admin');
  });

  it('should map school_admin to school_admin', () => {
    expect(resolveExpansionOpsRole('school_admin')).toBe('school_admin');
  });

  it('should map system_admin to system_admin', () => {
    expect(resolveExpansionOpsRole('system_admin')).toBe('system_admin');
  });

  it('should map operator to internal_operator', () => {
    expect(resolveExpansionOpsRole('operator')).toBe('internal_operator');
  });

  it('should map internal_operator to internal_operator', () => {
    expect(resolveExpansionOpsRole('internal_operator')).toBe('internal_operator');
  });

  it('should map teacher to teacher_assigned_to_expansion', () => {
    expect(resolveExpansionOpsRole('teacher')).toBe('teacher_assigned_to_expansion');
  });

  it('should map student to learner_in_approved_expanded_cohort', () => {
    expect(resolveExpansionOpsRole('student')).toBe('learner_in_approved_expanded_cohort');
  });

  it('should map learner_in_approved_expanded_cohort to itself', () => {
    expect(resolveExpansionOpsRole('learner_in_approved_expanded_cohort')).toBe('learner_in_approved_expanded_cohort');
  });

  it('should map unknown role to unknown', () => {
    expect(resolveExpansionOpsRole('nonexistent_role')).toBe('unknown');
  });

  it('should map empty string to unknown', () => {
    expect(resolveExpansionOpsRole('')).toBe('unknown');
  });

  it('should be case insensitive', () => {
    expect(resolveExpansionOpsRole('ADMIN')).toBe('school_admin');
    expect(resolveExpansionOpsRole('School_Admin')).toBe('school_admin');
  });

  it('should handle null and undefined as unknown', () => {
    expect(resolveExpansionOpsRole(null as any)).toBe('unknown');
    expect(resolveExpansionOpsRole(undefined as any)).toBe('unknown');
  });

  it('should map authorized_expansion_operator exactly', () => {
    expect(resolveExpansionOpsRole('authorized_expansion_operator')).toBe('authorized_expansion_operator');
  });

  it('should map safeguarding_reviewer exactly', () => {
    expect(resolveExpansionOpsRole('safeguarding_reviewer')).toBe('safeguarding_reviewer');
  });

  it('should map content_governance_reviewer exactly', () => {
    expect(resolveExpansionOpsRole('content_governance_reviewer')).toBe('content_governance_reviewer');
  });
});

describe('getRolePermissionsList', () => {
  it('should return full permissions for school_admin', () => {
    const perms = getRolePermissionsList('school_admin');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('execute_kill_switch');
    expect(perms).toContain('generate_task029_report');
    expect(perms).toHaveLength(19);
  });

  it('should return full permissions for system_admin', () => {
    const perms = getRolePermissionsList('system_admin');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('execute_kill_switch');
    expect(perms).toHaveLength(19);
  });

  it('should return full permissions for internal_operator', () => {
    const perms = getRolePermissionsList('internal_operator');
    expect(perms).toContain('request_rollback');
    expect(perms).toHaveLength(19);
  });

  it('should return full permissions for authorized_expansion_operator', () => {
    const perms = getRolePermissionsList('authorized_expansion_operator');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('execute_kill_switch');
    expect(perms).toHaveLength(19);
  });

  it('should return read + request_intervention for authorized_expansion_reviewer', () => {
    const perms = getRolePermissionsList('authorized_expansion_reviewer');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('request_intervention');
    expect(perms).not.toContain('execute_kill_switch');
    expect(perms).toHaveLength(12);
  });

  it('should return read + request_intervention for operations_reviewer', () => {
    const perms = getRolePermissionsList('operations_reviewer');
    expect(perms).toContain('view_completion_review_summary');
    expect(perms).not.toContain('pause_expansion');
  });

  it('should return limited set for safeguarding_reviewer', () => {
    const perms = getRolePermissionsList('safeguarding_reviewer');
    expect(perms).toContain('view_health_summary');
    expect(perms).toContain('request_intervention');
    expect(perms).not.toContain('view_stage_summary');
    expect(perms).toHaveLength(7);
  });

  it('should return small set for content_governance_reviewer', () => {
    const perms = getRolePermissionsList('content_governance_reviewer');
    expect(perms).toContain('view_operations_dashboard');
    expect(perms).toContain('request_intervention');
    expect(perms).not.toContain('view_cohort_summary');
    expect(perms).toHaveLength(4);
  });

  it('should return minimal set for deen_source_reviewer', () => {
    const perms = getRolePermissionsList('deen_source_reviewer');
    expect(perms).toContain('view_intervention_queue');
    expect(perms).not.toContain('request_intervention');
    expect(perms).toHaveLength(3);
  });

  it('should return only view_teacher_oversight for teachers', () => {
    const expansion = getRolePermissionsList('teacher_assigned_to_expansion');
    const pilot = getRolePermissionsList('teacher_assigned_to_pilot');
    expect(expansion).toEqual(['view_teacher_oversight']);
    expect(pilot).toEqual(['view_teacher_oversight']);
  });

  it('should return only view_learner_own_status for learner', () => {
    const perms = getRolePermissionsList('learner_in_approved_expanded_cohort');
    expect(perms).toEqual(['view_learner_own_status']);
  });

  it('should return empty array for unknown', () => {
    const perms = getRolePermissionsList('unknown');
    expect(perms).toEqual([]);
  });
});
