import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIncidentOperations } from '../services/task029IncidentOperationsService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listOversightItems: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordIncidentOperationsView: vi.fn(),
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
    id: 'incident_001',
    severity: 'critical',
    status: 'open',
    itemType: 'safeguarding',
    requiresPause: true,
    requiresRollback: false,
    requiresAdminReview: true,
    createdAt: new Date('2026-07-01T10:00:00Z'),
    safeSummary: 'Safeguarding incident detected.',
    ...overrides,
  };
}

describe('getIncidentOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getIncidentOperations({
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

    const result = await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns empty incidents when no items exist', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);

    const result = await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('includes only critical, high, and medium severity items', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ id: 'inc_001', severity: 'critical' }),
      makeOversightItem({ id: 'inc_002', severity: 'high' }),
      makeOversightItem({ id: 'inc_003', severity: 'medium' }),
      makeOversightItem({ id: 'inc_004', severity: 'low' }),
      makeOversightItem({ id: 'inc_005', severity: 'info' }),
    ]);

    const result = await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(result.data).toHaveLength(3);
    const ids = result.data!.map(i => i.incidentId);
    expect(ids).toContain('inc_001');
    expect(ids).toContain('inc_002');
    expect(ids).toContain('inc_003');
    expect(ids).not.toContain('inc_004');
    expect(ids).not.toContain('inc_005');
  });

  it('maps incident fields correctly', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({
        severity: 'critical',
        status: 'open',
        itemType: 'safeguarding',
        requiresPause: true,
        requiresAdminReview: true,
        safeSummary: 'Critical safeguarding event.',
      }),
    ]);

    const result = await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    const incident = result.data![0];
    expect(incident.incidentId).toBe('incident_001');
    expect(incident.severity).toBe('critical');
    expect(incident.status).toBe('open');
    expect(incident.safeCategory).toBe('safeguarding');
    expect(incident.recommendedControlAction).toBe('pause_expansion');
    expect(incident.requiresSafeguardingReview).toBe(true);
    expect(incident.requiresAdminReview).toBe(true);
    expect(incident.requiresRollbackReview).toBe(false);
    expect(incident.safeSummary).toBe('Critical safeguarding event.');
  });

  it('classifies item types into safe categories', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ id: 'a', severity: 'high', itemType: 'privacy' }),
      makeOversightItem({ id: 'b', severity: 'high', itemType: 'content_governance' }),
      makeOversightItem({ id: 'c', severity: 'high', itemType: 'curriculum' }),
      makeOversightItem({ id: 'd', severity: 'high', itemType: 'unknown_type' }),
    ]);

    const result = await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    const byId = new Map(result.data!.map(i => [i.incidentId, i]));
    expect(byId.get('a')!.safeCategory).toBe('privacy');
    expect(byId.get('b')!.safeCategory).toBe('content_governance');
    expect(byId.get('c')!.safeCategory).toBe('curriculum');
    expect(byId.get('d')!.safeCategory).toBe('operations');
  });

  it('records each incident view via repository', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ severity: 'critical' }),
    ]);

    await getIncidentOperations({
      schoolId: 'school_alpha',
      actorId: 'actor_001',
      actorRole: 'admin',
      expansionRunId: 'run_001',
    });

    expect(task029ExpansionOperationsRepository.recordIncidentOperationsView).toHaveBeenCalledTimes(1);
    const recorded = vi.mocked(task029ExpansionOperationsRepository.recordIncidentOperationsView).mock.calls[0][0];
    expect(recorded.incidentId).toBe('incident_001');
  });
});
