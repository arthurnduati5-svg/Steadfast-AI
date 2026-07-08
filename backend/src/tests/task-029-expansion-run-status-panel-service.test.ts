import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExpansionRunStatus } from '../services/task029ExpansionRunStatusPanelService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
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
    startedAt: new Date('2026-06-01T09:00:00Z'),
    pausedAt: null,
    rolledBackAt: null,
    completedAt: null,
    safeSummary: 'Expansion run active on stage 1.',
    blockingIssues: [],
    expansionProposalId: 'proposal_001',
    pilotProgramId: 'pilot_001',
    ...overrides,
  };
}

describe('getExpansionRunStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when expansionRunId is empty', async () => {
    const result = await getExpansionRunStatus('', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns blockingIssues when schoolId is empty', async () => {
    const result = await getExpansionRunStatus('run_001', '');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getExpansionRunStatus('run_not_found', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns blockingIssues on cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getExpansionRunStatus('run_001', 'school_alpha');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns status data for a valid active run', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getExpansionRunStatus('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.data!.runId).toBe('run_001');
    expect(result.data!.schoolId).toBe('school_alpha');
    expect(result.data!.status).toBe('stage_1_active');
    expect(result.data!.currentStage).toBe(1);
    expect(result.data!.pauseState).toBe('not_paused');
    expect(result.data!.rollbackState).toBe('not_requested');
    expect(result.data!.killSwitchState).toBe('disabled');
  });

  it('detects paused state when status includes paused', async () => {
    const run = makeRun({ status: 'stage_1_paused', pausedAt: new Date('2026-06-15T10:00:00Z') });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getExpansionRunStatus('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data!.pauseState).toBe('paused');
    expect(result.data!.pausedAt).toBeTruthy();
  });

  it('detects rollback state when status is rolled_back', async () => {
    const run = makeRun({ status: 'rolled_back', rolledBackAt: new Date('2026-06-20T10:00:00Z') });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getExpansionRunStatus('run_001', 'school_alpha');

    expect(result.ok).toBe(true);
    expect(result.data!.rollbackState).toBe('rolled_back');
    expect(result.data!.rolledBackAt).toBeTruthy();
  });
});
