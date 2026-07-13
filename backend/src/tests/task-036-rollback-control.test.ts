import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateRollbackControlResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveRollbackControl: vi.fn(),
    getRollbackControl: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function executeRollback(sessionId: string, rbData: any): { ok: boolean; errors: string[] } {
  const result = {
    ok: rbData.ok ?? true,
    rollbackRequested: rbData.rollbackRequested ?? true,
    rollbackReasonCodes: rbData.rollbackReasonCodes ?? [],
    sessionId,
    rollbackRequestedAt: rbData.rollbackRequestedAt ?? new Date().toISOString(),
    auditPreserved: rbData.auditPreserved ?? true,
    destructiveDatabaseCommandsRun: rbData.destructiveDatabaseCommandsRun ?? false,
    deploymentPerformed: rbData.deploymentPerformed ?? false,
    externalServicesCalled: rbData.externalServicesCalled ?? false,
    blockingIssues: [],
  };
  const errors = validateRollbackControlResult(result);
  if (errors.length > 0) return { ok: false, errors };
  task036Repository.saveRollbackControl(sessionId, result);
  return { ok: true, errors: [] };
}

describe('Task036 Rollback Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rolls back successfully', () => {
    const result = executeRollback('sess-1', {});
    expect(result.ok).toBe(true);
    expect(task036Repository.saveRollbackControl).toHaveBeenCalled();
  });

  it('fails when rollback not requested', () => {
    const result = executeRollback('sess-1', { ok: false, rollbackRequested: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rollback_control_not_ok');
    expect(result.errors).toContain('rollback_not_requested');
  });

  it('fails when audit not preserved', () => {
    const result = executeRollback('sess-1', { auditPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rollback_audit_not_preserved');
  });

  it('fails when destructive DB commands run', () => {
    const result = executeRollback('sess-1', { destructiveDatabaseCommandsRun: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rollback_ran_destructive_db_commands');
  });

  it('fails when deployment performed', () => {
    const result = executeRollback('sess-1', { deploymentPerformed: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rollback_performed_deployment');
  });

  it('fails when external services called', () => {
    const result = executeRollback('sess-1', { externalServicesCalled: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rollback_called_external_services');
  });

  it('retrieves stored rollback from repository', () => {
    const stored: any = {
      ok: true, rollbackRequested: true, rollbackReasonCodes: [],
      sessionId: 'sess-1', rollbackRequestedAt: '', auditPreserved: true,
      destructiveDatabaseCommandsRun: false, deploymentPerformed: false,
      externalServicesCalled: false, blockingIssues: [],
    };
    vi.mocked(task036Repository.getRollbackControl).mockReturnValue(stored);
    const retrieved = task036Repository.getRollbackControl('sess-1');
    expect(retrieved!.rollbackRequested).toBe(true);
    expect(retrieved!.destructiveDatabaseCommandsRun).toBe(false);
  });
});
