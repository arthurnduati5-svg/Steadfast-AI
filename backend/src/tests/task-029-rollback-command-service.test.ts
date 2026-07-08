import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeRollbackCommand } from '../services/task029RollbackCommandService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listExpandedParticipants: vi.fn(),
    updateParticipantsByRun: vi.fn(),
    createRollbackRecord: vi.fn(),
    createAuditRecord: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordRollbackCommandResult: vi.fn(),
  },
}));

vi.mock('../services/task028Task027ProofLoaderService', () => ({
  loadTask027Proof: vi.fn(),
}));

vi.mock('../services/task029ControlActionPreflightService', () => ({
  runControlActionPreflight: vi.fn(),
}));

vi.mock('../services/task028ExpansionRollbackExecutionService', () => ({
  executeRollback: vi.fn(),
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';
import { runControlActionPreflight } from '../services/task029ControlActionPreflightService';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';

function makeDefaultInput(overrides: Record<string, any> = {}) {
  return {
    schoolId: 'school_alpha',
    actorId: 'actor_001',
    actorRole: 'admin',
    expansionRunId: 'run_001',
    rollbackReason: 'Testing rollback',
    ...overrides,
  };
}

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    currentStage: 1,
    pilotProgramId: 'pilot_001',
    stagePlan: {},
    approvedScopeSnapshot: {},
    allowedClassIds: [],
    allowedSubjectIds: [],
    allowedCurriculumScopes: [],
    ...overrides,
  };
}

describe('executeRollbackCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(loadTask027Proof).mockResolvedValue({
      safeToExecuteExpansion: true,
      blockingIssues: [],
      proofSummary: {},
    });

    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(makeRun());

    vi.mocked(runControlActionPreflight).mockResolvedValue({
      ok: true, checksPassed: true, action: 'request_rollback',
      schoolContextVerified: true, task028ProofAccepted: true,
      sameSchool: true, actorPermissionGranted: true,
      expansionRunExists: true, runStateAllowsAction: true,
      actionAllowed: true, actionIsStagingRehearsal: false,
      actionIsCanary: false, actionIsRollout: false,
      actionIsSchoolWide: false, privacyBoundaryClear: true,
      safeguardingBoundaryClear: true, contentGovernanceBoundaryClear: true,
      rollbackReadiness: true, auditWritePathAvailable: true,
      blockingIssues: [],
    });

    vi.mocked(executeRollback).mockResolvedValue({
      ok: true,
      rollbackId: 'rb_001',
      previousStatus: 'stage_1_active',
      newStatus: 'rolled_back',
      studentAccessBlocked: true,
      dataDestructivelyDeleted: false,
      auditPreserved: true,
      affectedParticipantCount: 10,
      reasonCodes: [],
      safeMessage: 'Rollback completed. New sessions blocked.',
    });
  });

  it('denies unauthorized roles with expandedAccessBlocked=false and auditPreserved=false', async () => {
    const input = makeDefaultInput({ actorRole: 'learner_in_approved_expanded_cohort' });

    const result = await executeRollbackCommand(input);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('denied');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.dataDestructivelyDeleted).toBe(false);
    expect(result.safeMessage).toContain('not authorized');
    expect(result.reasonCodes).toContain('actor_not_authorized');
  });

  it('denies when school context is missing', async () => {
    const input = makeDefaultInput({ schoolId: '' });

    const result = await executeRollbackCommand(input);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('denied');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.safeMessage).toContain('School context');
    expect(result.reasonCodes).toContain('school_context_missing');
  });

  it('denies when task028 proof is not accepted', async () => {
    vi.mocked(loadTask027Proof).mockResolvedValue({
      safeToExecuteExpansion: false,
      blockingIssues: ['task027_proof_invalid'],
      proofSummary: {},
    });

    const result = await executeRollbackCommand(makeDefaultInput());

    expect(result.ok).toBe(false);
    expect(result.status).toBe('denied');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.safeMessage).toContain('proof not accepted');
  });

  it('denies when expansion run is not found', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await executeRollbackCommand(makeDefaultInput());

    expect(result.ok).toBe(false);
    expect(result.status).toBe('denied');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.safeMessage).toContain('not found');
    expect(result.reasonCodes).toContain('expansion_run_not_found');
  });

  it('denies cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await executeRollbackCommand(makeDefaultInput());

    expect(result.ok).toBe(false);
    expect(result.status).toBe('denied');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.reasonCodes).toContain('cross_school_access_denied');
  });

  it('blocks when rollback preflight fails readiness', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue({
      ok: false, checksPassed: false, action: 'request_rollback',
      schoolContextVerified: true, task028ProofAccepted: true,
      sameSchool: true, actorPermissionGranted: true,
      expansionRunExists: true, runStateAllowsAction: false,
      actionAllowed: true, actionIsStagingRehearsal: false,
      actionIsCanary: false, actionIsRollout: false,
      actionIsSchoolWide: false, privacyBoundaryClear: true,
      safeguardingBoundaryClear: true, contentGovernanceBoundaryClear: true,
      rollbackReadiness: false, auditWritePathAvailable: true,
      blockingIssues: ['rollback_not_ready'],
    });

    const result = await executeRollbackCommand(makeDefaultInput());

    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
    expect(result.expandedAccessBlocked).toBe(false);
    expect(result.auditPreserved).toBe(false);
    expect(result.reasonCodes).toContain('rollback_not_ready');
  });

  it('executes rollback successfully and reports expandedAccessBlocked=true and auditPreserved=true', async () => {
    const result = await executeRollbackCommand(makeDefaultInput());

    expect(result.ok).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.rollbackId).toBe('rb_001');
    expect(result.expandedAccessBlocked).toBe(true);
    expect(result.auditPreserved).toBe(true);
    expect(result.dataDestructivelyDeleted).toBe(false);
    expect(result.safeMessage).toContain('Rollback completed');
    expect(executeRollback).toHaveBeenCalledWith('run_001', 'admin', 'actor_001', 'Testing rollback', 'Testing rollback');
  });

  it('records rollback command result via repository', async () => {
    await executeRollbackCommand(makeDefaultInput());

    expect(task029ExpansionOperationsRepository.recordRollbackCommandResult).toHaveBeenCalledTimes(1);
    const recorded = vi.mocked(task029ExpansionOperationsRepository.recordRollbackCommandResult).mock.calls[0][0];
    expect(recorded.ok).toBe(true);
    expect(recorded.expandedAccessBlocked).toBe(true);
    expect(recorded.auditPreserved).toBe(true);
    expect(recorded.dataDestructivelyDeleted).toBe(false);
  });
});
