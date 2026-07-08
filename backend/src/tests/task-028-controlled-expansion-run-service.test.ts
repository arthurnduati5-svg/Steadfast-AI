import { describe, it, expect, beforeEach } from 'vitest';
import { createRun } from '../services/task028ControlledExpansionRunService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Controlled Expansion Run Service', () => {
  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  const validInput = {
    schoolId: 'school-1',
    proposalId: 'prop-1',
    governanceDecisionId: 'gov-1',
    pilotRunId: 'pilot-1',
    approvedPlan: {
      schoolId: 'school-1',
      proposalId: 'prop-1',
      governanceDecisionId: 'gov-1',
      pilotRunId: 'pilot-1',
      expansionScopeLabels: ['Stage 2'],
      approvedCohortIds: ['cohort-1'],
      approvedLearnerSafeRefs: ['learner-1'],
      approvedTeacherSafeRefs: ['teacher-1'],
      approvedSupportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: ['cur-1'],
      deenSourceScopeIds: ['deen-1'],
      operationsMonitoringPlanId: 'mon-1',
      pauseRollbackPlanId: 'pr-1',
      approvedStartWindow: '2026-01-01',
      safeConditions: {},
    },
    actorRole: 'school_admin',
    actorId: 'admin-1',
  };

  it('should create an expansion run', async () => {
    const result = await createRun(validInput);
    expect(result.ok).toBe(true);
    expect(result.runId).toBeTruthy();
    expect(result.status).toBe('draft');

    const run = await task028ExpansionExecutionRepository.getExecutionRun(result.runId!);
    expect(run).toBeTruthy();
    expect((run as any).status).toBe('draft');
  });

  it('should fail for invalid input', async () => {
    const result = await createRun({
      schoolId: '',
      proposalId: 'prop-1',
      governanceDecisionId: 'gov-1',
      pilotRunId: 'pilot-1',
      approvedPlan: {} as any,
      actorRole: 'school_admin',
      actorId: 'admin-1',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes.length).toBeGreaterThan(0);
  });

  it('should fail for denied role', async () => {
    const result = await createRun({ ...validInput, actorRole: 'unauthenticated' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('role_not_permitted_for_run');
  });

  it('should fail when an active run already exists', async () => {
    await createRun(validInput);
    const result = await createRun(validInput);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('expansion_already_active');
  });

  it('should allow second run after completion of first', async () => {
    const first = await createRun(validInput);
    await task028ExpansionExecutionRepository.updateExecutionRun(first.runId!, { status: 'completed' });
    const second = await createRun(validInput);
    expect(second.ok).toBe(true);
    expect(second.runId).not.toBe(first.runId);
  });

  it('should create audit record on run creation', async () => {
    const result = await createRun(validInput);
    const audits = await task028ExpansionExecutionRepository.listAuditRecords(result.runId!);
    expect(audits.length).toBe(1);
    expect(audits[0].action).toBe('expansion_run_created');
  });

  it('should reject missing approvedPlan', async () => {
    const result = await createRun({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      governanceDecisionId: 'gov-1',
      pilotRunId: 'pilot-1',
      approvedPlan: undefined as any,
      actorRole: 'school_admin',
      actorId: 'admin-1',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('approvedPlan_required');
  });
});
