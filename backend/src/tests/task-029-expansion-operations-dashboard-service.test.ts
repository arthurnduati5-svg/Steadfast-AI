import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOperationsDashboard } from '../services/task029ExpansionOperationsDashboardService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    listExecutionRuns: vi.fn(),
    listHealthSnapshots: vi.fn(),
    listOversightItems: vi.fn(),
    listExpandedParticipants: vi.fn(),
    listStagesByRun: vi.fn(),
    listInterventionRecords: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordOperationsDashboardSnapshot: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    currentStage: 1,
    updatedAt: new Date('2026-07-01T12:00:00Z'),
    expansionProposalId: 'proposal_001',
    pilotProgramId: 'pilot_001',
    safeSummary: 'Active run',
    blockingIssues: [],
    ...overrides,
  };
}

function makeHealthSnapshot(overrides: Record<string, any> = {}) {
  return {
    id: 'health_001',
    executionRunId: 'run_001',
    errorCount: 3,
    blockedExpandedSessionStarts: 1,
    schoolAuthBlocks: 2,
    cohortScopeBlocks: 0,
    curriculumGateBlocks: 0,
    socraticGateBlocks: 0,
    deenGateBlocks: 0,
    privacyGateBlocks: 0,
    aiCallBlocks: 0,
    memoryAccessBlocks: 0,
    evidenceWriteBlocks: 0,
    safeSummary: 'Healthy',
    ...overrides,
  };
}

function makeParticipant(overrides: Record<string, any> = {}) {
  return {
    id: 'part_001',
    actorIdHash: 'learner_hash_01',
    role: 'student',
    activationStatus: 'active',
    ...overrides,
  };
}

function makeStage(overrides: Record<string, any> = {}) {
  return {
    id: 'stage_001',
    executionRunId: 'run_001',
    stageNumber: 1,
    status: 'active',
    plannedStudentCount: 10,
    activatedStudentCount: 8,
    allowedSubjectIds: ['math', 'science'],
    allowedCurriculumScopes: ['core'],
    safeSummary: 'Stage 1 active',
    ...overrides,
  };
}

function makeOversightItem(overrides: Record<string, any> = {}) {
  return {
    id: 'ov_001',
    status: 'open',
    severity: 'medium',
    requiresTeacherReview: false,
    ...overrides,
  };
}

function makeIntervention(overrides: Record<string, any> = {}) {
  return {
    id: 'int_001',
    status: 'requested',
    reasonCodes: ['critical'],
    interventionType: 'pause_execution',
    safeSummary: 'Critical intervention needed',
    actorRole: 'admin',
    ...overrides,
  };
}

describe('getOperationsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when schoolId is missing', async () => {
    const result = await getOperationsDashboard({ schoolId: '', actorId: 'actor_001', actorRole: 'admin' });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('school_context_missing');
    expect(result.safeMessage).toBe('School context is required.');
  });

  it('returns dashboard with valid school and existing run', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.listExecutionRuns).mockResolvedValue([run]);
    vi.mocked(task028ExpansionExecutionRepository.listHealthSnapshots).mockResolvedValue([makeHealthSnapshot()]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ status: 'open', severity: 'critical' }),
      makeOversightItem({ status: 'closed', severity: 'low' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ activationStatus: 'active' }),
      makeParticipant({ activationStatus: 'active', role: 'teacher' }),
      makeParticipant({ activationStatus: 'blocked' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listStagesByRun).mockResolvedValue([
      makeStage({ status: 'active' }),
      makeStage({ stageNumber: 2, status: 'paused' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([
      makeIntervention({ status: 'requested', reasonCodes: ['critical'] }),
    ]);

    const result = await getOperationsDashboard({ schoolId: 'school_alpha', actorId: 'actor_001', actorRole: 'admin' });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.data!.schoolId).toBe('school_alpha');
    expect(result.data!.runStatus).toBe('stage_1_active');
    expect(result.data!.cohortSafeCounts).toEqual({ approved: 2, active: 2, blocked: 1, rolledBack: 0 });
    expect(result.data!.stageSafeCounts).toEqual({ total: 2, active: 1, paused: 1, completed: 0 });
    expect(result.data!.interventionQueueCounts.total).toBe(2);
    expect(result.data!.interventionQueueCounts.open).toBe(1);
    expect(result.data!.incidentCounts.total).toBe(1);
    expect(result.data!.healthRiskLevel).toBe('low');
    expect(result.data!.allowedControlActions).toEqual(['pause_expansion', 'resume_expansion', 'request_intervention']);
    expect(result.data!.rollbackReadinessStatus).toBe('ready');
  });

  it('returns not_found runStatus when no runs exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.listExecutionRuns).mockResolvedValue([]);

    const result = await getOperationsDashboard({ schoolId: 'school_empty', actorId: 'actor_001', actorRole: 'admin' });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.runStatus).toBe('not_found');
    expect(result.data!.cohortSafeCounts).toEqual({ approved: 0, active: 0, blocked: 0, rolledBack: 0 });
    expect(result.data!.stageSafeCounts).toEqual({ total: 0, active: 0, paused: 0, completed: 0 });
    expect(result.data!.safeNextActionLabels).toEqual(['create_expansion_run']);
  });

  it('records dashboard snapshot via repository', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.listExecutionRuns).mockResolvedValue([run]);
    vi.mocked(task028ExpansionExecutionRepository.listHealthSnapshots).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listStagesByRun).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([]);

    await getOperationsDashboard({ schoolId: 'school_alpha', actorId: 'actor_001', actorRole: 'admin' });

    expect(task029ExpansionOperationsRepository.recordOperationsDashboardSnapshot).toHaveBeenCalledTimes(1);
    const snapshot = vi.mocked(task029ExpansionOperationsRepository.recordOperationsDashboardSnapshot).mock.calls[0][0];
    expect(snapshot.schoolId).toBe('school_alpha');
    expect(snapshot.expansionRunId).toBe('run_001');
  });
});
