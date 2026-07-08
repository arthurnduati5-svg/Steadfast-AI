import { describe, it, expect, beforeEach } from 'vitest';
import { resolveOperationsPermissions } from '../services/task029OperationsPermissionService';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

describe('resolveOperationsPermissions', () => {
  beforeEach(async () => {
    await task029ExpansionOperationsRepository.clearTask029StoresForTests();
  });

  it('should return school_context_missing when schoolId is empty', async () => {
    const result = await resolveOperationsPermissions({ schoolId: '', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('should return actor_id_missing when actorId is empty', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: '', actorRole: 'school_admin' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('actor_id_missing');
  });

  it('should return role_denied for unknown role', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'nonexistent' });
    expect(result.ok).toBe(false);
    expect(result.role).toBe('unknown');
    expect(result.blockingIssues).toContain('role_denied');
    expect(result.blockingIssues).toHaveLength(1);
  });

  it('should allow school_admin with full access', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('school_admin');
    expect(result.permissions.length).toBeGreaterThan(10);
    expect(result.permissions).toContain('view_operations_dashboard');
    expect(result.permissions).toContain('execute_kill_switch');
    expect(result.blockingIssues).toEqual([]);
  });

  it('should allow system_admin with full access', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'system_admin' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('system_admin');
    expect(result.permissions).toContain('generate_task029_report');
  });

  it('should allow internal_operator with full access', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'internal_operator' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('internal_operator');
  });

  it('should allow authorized_expansion_operator with full access', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'authorized_expansion_operator' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('authorized_expansion_operator');
  });

  it('should resolve teacher alias to teacher_assigned_to_expansion', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'teacher' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('teacher_assigned_to_expansion');
    expect(result.permissions).toEqual(['view_teacher_oversight']);
  });

  it('should resolve student alias to learner_in_approved_expanded_cohort', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'student' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('learner_in_approved_expanded_cohort');
    expect(result.permissions).toEqual(['view_learner_own_status']);
  });

  it('should return empty permissions when role is unknown and ok is false', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'unknown_role_here' });
    expect(result.ok).toBe(false);
    expect(result.permissions).toEqual([]);
  });

  it('should record the permission decision in the repository', async () => {
    await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'admin' });
    const decisions = await task029ExpansionOperationsRepository.listPermissionDecisions('s1');
    const match = decisions.find(d => d.role === 'school_admin');
    expect(match).toBeDefined();
    expect(match!.ok).toBe(true);
  });

  it('should handle operator alias to internal_operator', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: 'a1', actorRole: 'operator' });
    expect(result.ok).toBe(true);
    expect(result.role).toBe('internal_operator');
  });

  it('should return both school_context_missing and role_denied together', async () => {
    const result = await resolveOperationsPermissions({ schoolId: '', actorId: '', actorRole: 'garbage' });
    expect(result.blockingIssues).toContain('school_context_missing');
    expect(result.blockingIssues).toContain('actor_id_missing');
    expect(result.blockingIssues).toContain('role_denied');
    expect(result.ok).toBe(false);
  });

  it('should handle whitespace-only schoolId as missing', async () => {
    const result = await resolveOperationsPermissions({ schoolId: '   ', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.blockingIssues).toContain('school_context_missing');
    expect(result.ok).toBe(false);
  });

  it('should handle whitespace-only actorId as missing', async () => {
    const result = await resolveOperationsPermissions({ schoolId: 's1', actorId: '   ', actorRole: 'school_admin' });
    expect(result.blockingIssues).toContain('actor_id_missing');
    expect(result.ok).toBe(false);
  });
});
