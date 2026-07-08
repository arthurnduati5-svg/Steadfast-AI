import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runControlActionPreflight } from '../services/task029ControlActionPreflightService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordControlActionPreflight: vi.fn(),
  },
}));

vi.mock('../services/task028Task027ProofLoaderService', () => ({
  loadTask027Proof: vi.fn(),
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';

function makeValidRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    currentStage: 1,
    ...overrides,
  };
}

function makeDefaultInput(action: string) {
  return {
    schoolId: 'school_alpha',
    actorId: 'actor_001',
    actorRole: 'admin',
    expansionRunId: 'run_001',
    action,
  };
}

describe('runControlActionPreflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadTask027Proof).mockResolvedValue({
      safeToExecuteExpansion: true,
      blockingIssues: [],
      proofSummary: {},
    });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(makeValidRun());
  });

  describe('blocks forbidden action types', () => {
    it.each([
      ['staging_rehearsal'],
      ['canary'],
      ['rollout'],
      ['school_wide'],
    ])('blocks %s with action_not_allowed and forbidden flags', async (action) => {
      const result = await runControlActionPreflight(makeDefaultInput(action));

      expect(result.ok).toBe(false);
      expect(result.checksPassed).toBe(false);
      expect(result.actionAllowed).toBe(false);
      expect(result.blockingIssues).toContain('action_not_allowed');
      expect(result.actionIsStagingRehearsal).toBe(action === 'staging_rehearsal');
      expect(result.actionIsCanary).toBe(action === 'canary');
      expect(result.actionIsRollout).toBe(action === 'rollout');
      expect(result.actionIsSchoolWide).toBe(action === 'school_wide');
    });
  });

  describe('allows valid control actions', () => {
    it.each([
      ['pause_expansion'],
      ['resume_expansion'],
    ])('allows %s when run state permits', async (action) => {
      const run = makeValidRun(action === 'resume_expansion' ? { status: 'stage_1_paused' } : { status: 'stage_1_active' });
      vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

      const result = await runControlActionPreflight(makeDefaultInput(action));

      expect(result.ok).toBe(true);
      expect(result.checksPassed).toBe(true);
      expect(result.actionAllowed).toBe(true);
      expect(result.blockingIssues).toHaveLength(0);
      expect(result.schoolContextVerified).toBe(true);
      expect(result.task028ProofAccepted).toBe(true);
      expect(result.sameSchool).toBe(true);
      expect(result.actorPermissionGranted).toBe(true);
      expect(result.expansionRunExists).toBe(true);
      expect(result.runStateAllowsAction).toBe(true);
      expect(result.privacyBoundaryClear).toBe(true);
      expect(result.auditWritePathAvailable).toBe(true);
    });
  });

  it('blocks pause_expansion when run is already paused', async () => {
    const run = makeValidRun({ status: 'stage_1_paused' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await runControlActionPreflight(makeDefaultInput('pause_expansion'));

    expect(result.ok).toBe(false);
    expect(result.runStateAllowsAction).toBe(false);
    expect(result.blockingIssues).toContain('action_not_allowed_in_state');
  });

  it('blocks resume_expansion when run is not paused', async () => {
    const run = makeValidRun({ status: 'stage_1_active' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await runControlActionPreflight(makeDefaultInput('resume_expansion'));

    expect(result.ok).toBe(false);
    expect(result.runStateAllowsAction).toBe(false);
    expect(result.blockingIssues).toContain('action_not_allowed_in_state');
  });

  it('reports school_context_missing when schoolId empty', async () => {
    const input = makeDefaultInput('pause_expansion');
    input.schoolId = '';

    const result = await runControlActionPreflight(input);

    expect(result.schoolContextVerified).toBe(false);
    expect(result.blockingIssues).toContain('school_context_missing');
    expect(result.ok).toBe(false);
  });

  it('reports expansion_run_not_found when run missing', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await runControlActionPreflight(makeDefaultInput('pause_expansion'));

    expect(result.expansionRunExists).toBe(false);
    expect(result.blockingIssues).toContain('expansion_run_not_found');
    expect(result.ok).toBe(false);
  });

  it('reports cross_school_access_denied when school mismatches', async () => {
    const run = makeValidRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await runControlActionPreflight(makeDefaultInput('pause_expansion'));

    expect(result.sameSchool).toBe(false);
    expect(result.blockingIssues).toContain('cross_school_access_denied');
    expect(result.ok).toBe(false);
  });

  it('handles loadTask027Proof failure gracefully', async () => {
    vi.mocked(loadTask027Proof).mockRejectedValue(new Error('Proof file not found'));

    const result = await runControlActionPreflight(makeDefaultInput('pause_expansion'));

    expect(result.task028ProofAccepted).toBe(false);
    expect(result.blockingIssues).toContain('task028_proof_load_failed');
  });

  it('reports role_denied when actor lacks permission', async () => {
    const input = makeDefaultInput('execute_kill_switch');
    input.actorRole = 'learner_in_approved_expanded_cohort';

    const result = await runControlActionPreflight(input);

    expect(result.actorPermissionGranted).toBe(false);
    expect(result.blockingIssues).toContain('role_denied');
    expect(result.ok).toBe(false);
  });

  it('reports rollback_not_ready when requesting rollback on already rolled_back', async () => {
    const run = makeValidRun({ status: 'rolled_back' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await runControlActionPreflight(makeDefaultInput('request_rollback'));

    expect(result.rollbackReadiness).toBe(false);
    expect(result.blockingIssues).toContain('rollback_not_ready');
  });

  it('records preflight result via repository', async () => {
    await runControlActionPreflight(makeDefaultInput('pause_expansion'));

    const { task029ExpansionOperationsRepository } = await import('../repositories/task029ExpansionOperationsRepository');
    expect(task029ExpansionOperationsRepository.recordControlActionPreflight).toHaveBeenCalledTimes(1);
  });
});
