import { describe, it, expect } from 'vitest';
import { getRolePermissionsList, resolveExpansionOpsRole } from '../contracts/task029ExpansionOperationsContracts';

describe('Task 029 - Learner Denied Operations Console', () => {
  it('student role should not have console permission', () => {
    const role = resolveExpansionOpsRole('student');
    expect(role).toBe('learner_in_approved_expanded_cohort');
    const perms = getRolePermissionsList(role);
    expect(perms).not.toContain('view_operations_dashboard');
    expect(perms).not.toContain('view_run_status');
    expect(perms).not.toContain('view_health_summary');
    expect(perms).not.toContain('view_audit_timeline');
    expect(perms).not.toContain('generate_task029_report');
  });

  it('student role should not have control permissions', () => {
    const perms = getRolePermissionsList('learner_in_approved_expanded_cohort');
    expect(perms).not.toContain('pause_expansion');
    expect(perms).not.toContain('resume_expansion');
    expect(perms).not.toContain('execute_kill_switch');
    expect(perms).not.toContain('request_rollback');
    expect(perms).not.toContain('run_control_preflight');
  });

  it('student role should only have own-status permission', () => {
    const perms = getRolePermissionsList('learner_in_approved_expanded_cohort');
    expect(perms).toEqual(['view_learner_own_status']);
  });

  it('teacher role should not have admin control permissions', () => {
    const perms = getRolePermissionsList('teacher_assigned_to_expansion');
    expect(perms).not.toContain('pause_expansion');
    expect(perms).not.toContain('resume_expansion');
    expect(perms).not.toContain('execute_kill_switch');
    expect(perms).not.toContain('request_rollback');
    expect(perms).not.toContain('view_operations_dashboard');
    expect(perms).not.toContain('view_health_summary');
  });

  it('teacher role should only have assigned teacher items permission', () => {
    const perms = getRolePermissionsList('teacher_assigned_to_expansion');
    expect(perms).toEqual(['view_teacher_oversight']);
  });

  it('unknown role should be denied all permissions', () => {
    const perms = getRolePermissionsList('unknown');
    expect(perms).toEqual([]);
  });

  it('routes should use adminGuard for console access', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');

    const adminRoutes = ['/dashboard', '/status', '/stages', '/health', '/events', '/oversight', '/pause', '/resume', '/kill-switch/', '/rollback', '/completion-review'];
    for (const route of adminRoutes) {
      if (content.includes(route)) {
        const lineMatch = content.split('\n').filter((l: string) => l.includes(route));
        for (const line of lineMatch) {
          if (line.includes('studentGuard')) {
            throw new Error(`Route ${route} uses studentGuard but should use adminGuard`);
          }
        }
      }
    }
  });

  it('should not expose student chat in operations contracts', () => {
    const forbidden = [
      'raw student chat',
      'private learner memory',
      'teacher-only notes',
      'safeguarding raw details',
      'Deen-sensitive private text',
      'AI prompt',
      'provider response',
    ];
    const fs = require('fs');
    const contractsPath = require('path').resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const content = fs.readFileSync(contractsPath, 'utf8');
    for (const f of forbidden) {
      if (content.includes(f)) {
        const isInForbiddenList = content.includes("'" + f + "'");
        expect(isInForbiddenList).toBe(true);
      }
    }
  });
});
