import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHealthOperationsSummary } from '../services/task029HealthOperationsSummaryService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listHealthSnapshots: vi.fn(),
    listOversightItems: vi.fn(),
    listInterventionRecords: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    ...overrides,
  };
}

function makeHealthSnapshot(overrides: Record<string, any> = {}) {
  return {
    id: 'health_001',
    executionRunId: 'run_001',
    errorCount: 3,
    blockedExpandedSessionStarts: 0,
    schoolAuthBlocks: 1,
    cohortScopeBlocks: 0,
    curriculumGateBlocks: 0,
    socraticGateBlocks: 0,
    deenGateBlocks: 0,
    privacyGateBlocks: 1,
    aiCallBlocks: 0,
    memoryAccessBlocks: 0,
    evidenceWriteBlocks: 0,
    ...overrides,
  };
}

function makeOversightItem(overrides: Record<string, any> = {}) {
  return {
    id: 'ov_001',
    status: 'open',
    severity: 'medium',
    ...overrides,
  };
}

function makeIntervention(overrides: Record<string, any> = {}) {
  return {
    id: 'int_001',
    status: 'requested',
    reasonCodes: ['critical'],
    interventionType: 'pause_execution',
    ...overrides,
  };
}

describe('getHealthOperationsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when expansionRunId is empty', async () => {
    const result = await getHealthOperationsSummary('', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns blockingIssues when schoolId is empty', async () => {
    const result = await getHealthOperationsSummary('run_001', '');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getHealthOperationsSummary('run_not_found', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('blocks cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getHealthOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns low health with no issues', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listHealthSnapshots).mockResolvedValue([
      makeHealthSnapshot({ errorCount: 0, blockedExpandedSessionStarts: 0, schoolAuthBlocks: 0, privacyGateBlocks: 0 }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([]);

    const result = await getHealthOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.latestHealthStatus).toBe('healthy');
    expect(result.data!.operationsRiskLevel).toBe('low');
    expect(result.data!.privacyRiskLevel).toBe('low');
    expect(result.data!.safeguardingRiskLevel).toBe('low');
    expect(result.data!.blockedAccessCount).toBe(0);
    expect(result.data!.supportNeededCount).toBe(0);
    expect(result.data!.interventionCount).toBe(0);
    expect(result.data!.incidentCount).toBe(0);
    expect(result.data!.recommendedControlAction).toBe('none');
    expect(result.data!.safeReasonCodes).toEqual(['healthy']);
  });

  it('returns critical risk when total blocks exceed 20', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listHealthSnapshots).mockResolvedValue([
      makeHealthSnapshot({
        blockedExpandedSessionStarts: 10,
        schoolAuthBlocks: 5,
        cohortScopeBlocks: 3,
        curriculumGateBlocks: 4,
        socraticGateBlocks: 2,
        deenGateBlocks: 1,
        privacyGateBlocks: 3,
        aiCallBlocks: 2,
        memoryAccessBlocks: 1,
        evidenceWriteBlocks: 0,
        errorCount: 5,
      }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ severity: 'critical' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([
      makeIntervention(),
    ]);

    const result = await getHealthOperationsSummary('run_001', 'school_alpha');

    expect(result.data!.latestHealthStatus).toBe('critical');
    expect(result.data!.operationsRiskLevel).toBe('critical');
    expect(result.data!.recommendedControlAction).toBe('execute_kill_switch');
    expect(result.data!.blockedAccessCount).toBe(22);
    expect(result.data!.safeReasonCodes).toContain('access_blocked');
    expect(result.data!.safeReasonCodes).toContain('risk_elevated');
  });

  it('returns rollback readiness based on run status', async () => {
    const run = makeRun({ status: 'rolled_back' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listHealthSnapshots).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([]);

    const result = await getHealthOperationsSummary('run_001', 'school_alpha');

    expect(result.data!.rollbackReadinessStatus).toBe('rolled_back');
  });
});
