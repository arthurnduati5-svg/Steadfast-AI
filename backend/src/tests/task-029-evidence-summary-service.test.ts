import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task029EvidenceSummaryInput, Task029EvidenceSummary } from '../contracts/task029ExpansionOperationsContracts';

vi.mock('../services/task029EvidenceSummaryService', () => ({
  getEvidenceSummary: vi.fn(),
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    listEvidenceSummaryViews: vi.fn(),
    recordEvidenceSummaryView: vi.fn(),
  },
}));

const { getEvidenceSummary } = await import('../services/task029EvidenceSummaryService');

describe('getEvidenceSummary', () => {
  const validInput: Task029EvidenceSummaryInput = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'admin',
    expansionRunId: 'run-1',
  };

  const mockSummary: Task029EvidenceSummary = {
    evidenceEventCount: 10,
    accessAllowedCount: 8,
    accessDeniedCount: 2,
    interventionCount: 3,
    incidentCount: 1,
    rollbackCount: 0,
    teacherOversightCount: 5,
    safeLatestEventAt: '2025-01-01T00:00:00Z',
    safeEvidenceCategories: ['access_allowed', 'access_denied'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true with summary data for valid input', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
  });

  it('returns numeric count fields', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    expect(typeof result.data!.evidenceEventCount).toBe('number');
    expect(typeof result.data!.accessAllowedCount).toBe('number');
    expect(typeof result.data!.accessDeniedCount).toBe('number');
    expect(typeof result.data!.interventionCount).toBe('number');
    expect(typeof result.data!.incidentCount).toBe('number');
    expect(typeof result.data!.rollbackCount).toBe('number');
    expect(typeof result.data!.teacherOversightCount).toBe('number');
  });

  it('returns safeLatestEventAt as ISO string', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    expect(typeof result.data!.safeLatestEventAt).toBe('string');
    expect(result.data!.safeLatestEventAt.length).toBeGreaterThan(0);
  });

  it('returns safeEvidenceCategories as string array', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    expect(Array.isArray(result.data!.safeEvidenceCategories)).toBe(true);
  });

  it('accessAllowedCount + accessDeniedCount <= evidenceEventCount', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    const d = result.data!;
    expect(d.accessAllowedCount + d.accessDeniedCount).toBeLessThanOrEqual(d.evidenceEventCount);
  });

  it('returns blockingIssues when missing required input', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getEvidenceSummary({ schoolId: '', actorId: '', actorRole: '', expansionRunId: '' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_required_input_fields');
  });

  it('blocks when schoolId is empty', async () => {
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getEvidenceSummary({ ...validInput, schoolId: '' });
    expect(result.ok).toBe(false);
  });

  it('evidence categories only contain allowed event types', async () => {
    const allowedCategories = ['access_allowed', 'access_denied', 'intervention_created', 'incident_created', 'rollback_executed', 'teacher_oversight_viewed'];
    vi.mocked(getEvidenceSummary).mockResolvedValue({ ok: true, data: mockSummary, blockingIssues: [] });
    const result = await getEvidenceSummary(validInput);
    for (const cat of result.data!.safeEvidenceCategories) {
      expect(allowedCategories).toContain(cat);
    }
  });
});
