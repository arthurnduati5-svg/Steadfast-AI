import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLearnerOwnStatus } from '../services/task029LearnerOwnStatusService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listExpandedParticipants: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordLearnerOwnStatusView: vi.fn(),
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

function makeParticipant(overrides: Record<string, any> = {}) {
  return {
    id: 'part_001',
    executionRunId: 'run_001',
    actorIdHash: 'learner_self_hash',
    role: 'student',
    activationStatus: 'active',
    ...overrides,
  };
}

describe('getLearnerOwnStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-learner roles with learner_only_endpoint', async () => {
    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'admin_001',
      actorRole: 'admin',
      learnerSafeRef: 'admin_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('learner_only_endpoint');
  });

  it('rejects when actorId does not match learnerSafeRef (self-only)', async () => {
    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_001',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'different_learner_002',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('learner_safe_ref_mismatch');
  });

  it('rejects when expansionRunId is missing', async () => {
    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_001',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_specified');
  });

  it('rejects when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_001',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_001',
      expansionRunId: 'run_not_found',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('rejects cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_001',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_001',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('rejects when learner is not in the cohort', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ actorIdHash: 'some_other_learner' }),
    ]);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_not_in_cohort',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_not_in_cohort',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('learner_not_in_cohort');
  });

  it('returns own status for an active approved learner', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ actorIdHash: 'learner_self_hash', activationStatus: 'active' }),
    ]);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_self_hash',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_self_hash',
      expansionRunId: 'run_001',
    });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.data!.learnerSafeRef).toBe('learner_self_hash');
    expect(result.data!.schoolId).toBe('school_alpha');
    expect(result.data!.expansionRunId).toBe('run_001');
    expect(result.data!.isInApprovedExpandedCohort).toBe(true);
    expect(result.data!.accessStatus).toBe('access_granted');
    expect(result.data!.pauseStatus).toBe('not_paused');
    expect(result.data!.rollbackStatus).toBe('not_rolled_back');
    expect(result.data!.safeMessage).toBe('You are in the approved expanded cohort.');
    expect(result.data!.nextSafeActionLabel).toBe('continue_learning');
    expect(result.data!.supportAvailable).toBe(true);
  });

  it('returns access_pending for a pending learner', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ actorIdHash: 'learner_pending', activationStatus: 'pending' }),
    ]);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_pending',
      actorRole: 'student',
      learnerSafeRef: 'learner_pending',
      expansionRunId: 'run_001',
    });

    expect(result.data!.isInApprovedExpandedCohort).toBe(true);
    expect(result.data!.accessStatus).toBe('access_pending');
    expect(result.data!.safeMessage).toBe('You are in the approved expanded cohort.');
    expect(result.data!.nextSafeActionLabel).toBe('continue_learning');
  });

  it('returns access_denied for a blocked learner', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ actorIdHash: 'learner_blocked', activationStatus: 'blocked' }),
    ]);

    const result = await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_blocked',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_blocked',
      expansionRunId: 'run_001',
    });

    expect(result.data!.isInApprovedExpandedCohort).toBe(false);
    expect(result.data!.accessStatus).toBe('access_denied');
    expect(result.data!.safeMessage).toBe('You are not currently in the approved expanded cohort.');
    expect(result.data!.nextSafeActionLabel).toBe('contact_support');
  });

  it('records the learner own status view', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ actorIdHash: 'learner_view', activationStatus: 'active' }),
    ]);

    await getLearnerOwnStatus({
      schoolId: 'school_alpha',
      actorId: 'learner_view',
      actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'learner_view',
      expansionRunId: 'run_001',
    });

    expect(task029ExpansionOperationsRepository.recordLearnerOwnStatusView).toHaveBeenCalledTimes(1);
    const recorded = vi.mocked(task029ExpansionOperationsRepository.recordLearnerOwnStatusView).mock.calls[0][0];
    expect(recorded.learnerSafeRef).toBe('learner_view');
    expect(recorded.isInApprovedExpandedCohort).toBe(true);
  });
});
