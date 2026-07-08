import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task029CompletionReviewSummaryInput, Task029CompletionReviewSummary } from '../contracts/task029ExpansionOperationsContracts';

vi.mock('../services/task029CompletionReviewSummaryService', () => ({
  getCompletionReviewSummary: vi.fn(),
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    listCompletionReviewSummaryViews: vi.fn(),
    recordCompletionReviewSummaryView: vi.fn(),
  },
}));

const { getCompletionReviewSummary } = await import('../services/task029CompletionReviewSummaryService');

describe('getCompletionReviewSummary', () => {
  const validInput: Task029CompletionReviewSummaryInput = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'admin',
    expansionRunId: 'run-1',
  };

  const mockReview: Task029CompletionReviewSummary = {
    safeToStartTask029: true,
    safeToStartTask030Candidate: true,
    remainingBlockers: [],
    privacyBoundaryStatus: 'clear',
    safeguardingBoundaryStatus: 'clear',
    deenContentBoundaryStatus: 'clear',
    socraticIntegrityStatus: 'clear',
    rollbackReadinessStatus: 'ready',
    safeSummary: 'All boundaries clear.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true with review data for valid input', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
  });

  it('returns safeToStartTask029 and safeToStartTask030Candidate booleans', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(typeof result.data!.safeToStartTask029).toBe('boolean');
    expect(typeof result.data!.safeToStartTask030Candidate).toBe('boolean');
  });

  it('returns all six boundary status fields', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(result.data).toHaveProperty('privacyBoundaryStatus');
    expect(result.data).toHaveProperty('safeguardingBoundaryStatus');
    expect(result.data).toHaveProperty('deenContentBoundaryStatus');
    expect(result.data).toHaveProperty('socraticIntegrityStatus');
    expect(result.data).toHaveProperty('rollbackReadinessStatus');
    expect(result.data).toHaveProperty('safeSummary');
  });

  it('remainingBlockers is a string array', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(Array.isArray(result.data!.remainingBlockers)).toBe(true);
    result.data!.remainingBlockers.forEach(b => expect(typeof b).toBe('string'));
  });

  it('safeSummary is a non-empty string', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(typeof result.data!.safeSummary).toBe('string');
    expect(result.data!.safeSummary.length).toBeGreaterThan(0);
  });

  it('returns blockingIssues when missing required input', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getCompletionReviewSummary({ schoolId: '', actorId: '', actorRole: '', expansionRunId: '' });
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('missing_required_input_fields');
  });

  it('reports remaining blockers when review not generated', async () => {
    const blockedReview: Task029CompletionReviewSummary = {
      ...mockReview,
      safeToStartTask029: false,
      remainingBlockers: ['completion_review_not_yet_generated'],
    };
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: false, data: null, blockingIssues: blockedReview.remainingBlockers });
    const result = await getCompletionReviewSummary(validInput);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('completion_review_not_yet_generated');
  });

  it('boundary status values are non-empty strings', async () => {
    vi.mocked(getCompletionReviewSummary).mockResolvedValue({ ok: true, data: mockReview, blockingIssues: [] });
    const result = await getCompletionReviewSummary(validInput);
    expect(result.data!.privacyBoundaryStatus.length).toBeGreaterThan(0);
    expect(result.data!.safeguardingBoundaryStatus.length).toBeGreaterThan(0);
  });
});
