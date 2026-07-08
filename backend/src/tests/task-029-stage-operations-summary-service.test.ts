import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStageOperationsSummary } from '../services/task029StageOperationsSummaryService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listStagesByRun: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_2_active',
    currentStage: 2,
    createdAt: new Date('2026-06-01T08:00:00Z'),
    updatedAt: new Date('2026-07-01T12:00:00Z'),
    ...overrides,
  };
}

function makeStage(overrides: Record<string, any> = {}) {
  return {
    id: 'stage_001',
    executionRunId: 'run_001',
    stageNumber: 1,
    status: 'active',
    plannedStudentCount: 20,
    activatedStudentCount: 18,
    allowedSubjectIds: ['math', 'science', 'english'],
    allowedCurriculumScopes: ['core', 'enrichment'],
    startedAt: new Date('2026-06-01T09:00:00Z'),
    pausedAt: null,
    completedAt: null,
    safeSummary: 'Stage 1 is running.',
    ...overrides,
  };
}

describe('getStageOperationsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when expansionRunId is empty', async () => {
    const result = await getStageOperationsSummary('', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns blockingIssues when schoolId is empty', async () => {
    const result = await getStageOperationsSummary('run_001', '');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getStageOperationsSummary('run_not_found', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('blocks cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getStageOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns stage summaries with correct mappings', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listStagesByRun).mockResolvedValue([
      makeStage(),
      makeStage({
        id: 'stage_002',
        stageNumber: 2,
        status: 'paused',
        plannedStudentCount: 30,
        activatedStudentCount: 25,
        allowedSubjectIds: ['math', 'science'],
        allowedCurriculumScopes: ['core'],
        startedAt: new Date('2026-06-10T09:00:00Z'),
        pausedAt: new Date('2026-06-20T12:00:00Z'),
      }),
    ]);

    const result = await getStageOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.blockingIssues).toHaveLength(0);

    expect(result.data![0].stageId).toBe('stage_001');
    expect(result.data![0].stageNumber).toBe(1);
    expect(result.data![0].status).toBe('active');
    expect(result.data![0].plannedSafeLearnerCount).toBe(20);
    expect(result.data![0].activeSafeLearnerCount).toBe(18);
    expect(result.data![0].blockedSafeLearnerCount).toBe(0);
    expect(result.data![0].safeSubjectScopeCount).toBe(3);
    expect(result.data![0].safeCurriculumScopeCount).toBe(2);
    expect(result.data![0].safeSummary).toBe('Stage 1 is running.');

    expect(result.data![1].status).toBe('paused');
    expect(result.data![1].plannedSafeLearnerCount).toBe(30);
    expect(result.data![1].activeSafeLearnerCount).toBe(25);
  });

  it('returns empty array when no stages exist', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listStagesByRun).mockResolvedValue([]);

    const result = await getStageOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});
