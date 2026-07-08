import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInterventionQueueOperations } from '../services/task029InterventionQueueOperationsService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listInterventionRecords: vi.fn(),
    listOversightItems: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordInterventionOperationsView: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    ...overrides,
  };
}

function makeOversightItem(overrides: Record<string, any> = {}) {
  return {
    id: 'ov_001',
    reasonCodes: ['behavior_escalation'],
    status: 'open',
    severity: 'high',
    assignedRole: 'teacher',
    createdAt: new Date('2026-07-01T10:00:00Z'),
    updatedAt: new Date('2026-07-01T12:00:00Z'),
    requiresTeacherReview: true,
    requiresAdminReview: false,
    requiresPrivacyReview: false,
    requiresDeenReview: false,
    requiresSocraticReview: false,
    requiresPause: false,
    requiresRollback: false,
    itemType: 'behavior',
    safeSummary: 'Student behavior escalation needed.',
    ...overrides,
  };
}

function makeIntervention(overrides: Record<string, any> = {}) {
  return {
    id: 'int_001',
    reasonCodes: ['critical_error'],
    status: 'requested',
    interventionType: 'pause_execution',
    createdAt: new Date('2026-07-02T08:00:00Z'),
    updatedAt: new Date('2026-07-02T09:00:00Z'),
    safeSummary: 'Critical error detected.',
    ...overrides,
  };
}

describe('getInterventionQueueOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getInterventionQueueOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_not_found',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('blocks cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getInterventionQueueOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns empty queue when no items exist', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);

    const result = await getInterventionQueueOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns combined oversight and intervention items', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ requiresPause: true, itemType: 'safeguarding' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([
      makeIntervention({ interventionType: 'pause_execution' }),
    ]);

    const result = await getInterventionQueueOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(2);

    const oversightItem = result.data![0];
    expect(oversightItem.queueItemId).toBe('ov_001');
    expect(oversightItem.reasonCode).toBe('behavior_escalation');
    expect(oversightItem.requiresTeacherReview).toBe(true);
    expect(oversightItem.requiresSafeguardingReview).toBe(true);
    expect(oversightItem.recommendedControlAction).toBe('pause_expansion');
    expect(oversightItem.severity).toBe('high');

    const interventionItem = result.data![1];
    expect(interventionItem.queueItemId).toBe('int_001');
    expect(interventionItem.recommendedControlAction).toBe('pause_expansion');
    expect(interventionItem.requiresAdminReview).toBe(true);
  });

  it('records each item via repository', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem(),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listInterventionRecords).mockResolvedValue([]);

    await getInterventionQueueOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(task029ExpansionOperationsRepository.recordInterventionOperationsView).toHaveBeenCalledTimes(1);
    const recorded = vi.mocked(task029ExpansionOperationsRepository.recordInterventionOperationsView).mock.calls[0][0];
    expect(recorded.queueItemId).toBe('ov_001');
  });
});
