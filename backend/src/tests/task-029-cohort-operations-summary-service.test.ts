import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCohortOperationsSummary } from '../services/task029CohortOperationsSummaryService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listExpandedParticipants: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    currentStage: 1,
    createdAt: new Date('2026-06-01T08:00:00Z'),
    updatedAt: new Date('2026-07-01T12:00:00Z'),
    ...overrides,
  };
}

function makeParticipant(overrides: Record<string, any> = {}) {
  return {
    id: 'part_001',
    executionRunId: 'run_001',
    actorIdHash: 'actor_hash',
    role: 'student',
    activationStatus: 'active',
    ...overrides,
  };
}

describe('getCohortOperationsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when expansionRunId is empty', async () => {
    const result = await getCohortOperationsSummary('', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns blockingIssues when schoolId is empty', async () => {
    const result = await getCohortOperationsSummary('run_001', '');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getCohortOperationsSummary('run_not_found', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('blocks cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getCohortOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns cohort summary with mixed participant states', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ role: 'student', activationStatus: 'active' }),
      makeParticipant({ role: 'student', activationStatus: 'pending' }),
      makeParticipant({ role: 'student', activationStatus: 'blocked' }),
      makeParticipant({ role: 'student', activationStatus: 'rolled_back' }),
      makeParticipant({ role: 'teacher', activationStatus: 'active' }),
      makeParticipant({ role: 'support_owner', activationStatus: 'active' }),
    ]);

    const result = await getCohortOperationsSummary('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.data!.approvedCohortCount).toBe(4);
    expect(result.data!.approvedLearnerSafeCount).toBe(2);
    expect(result.data!.activeLearnerSafeCount).toBe(1);
    expect(result.data!.blockedLearnerSafeCount).toBe(1);
    expect(result.data!.rolledBackLearnerSafeCount).toBe(1);
    expect(result.data!.teacherSafeCount).toBe(1);
    expect(result.data!.supportOwnerSafeCount).toBe(1);
    expect(result.data!.outOfScopeAccessDeniedCount).toBe(1);
    expect(result.data!.crossSchoolDeniedCount).toBe(0);
  });

  it('returns zeros when no participants exist', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([]);

    const result = await getCohortOperationsSummary('run_001', 'school_alpha');

    expect(result.data!.approvedCohortCount).toBe(0);
    expect(result.data!.teacherSafeCount).toBe(0);
    expect(result.data!.supportOwnerSafeCount).toBe(0);
  });
});
