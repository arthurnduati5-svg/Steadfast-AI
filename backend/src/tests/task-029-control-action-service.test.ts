import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeControlAction } from '../services/task029ControlActionService';

vi.mock('../services/task029ControlActionPreflightService', () => ({
  runControlActionPreflight: vi.fn(),
}));

vi.mock('../services/task028ExpansionInterventionService', () => ({
  pauseExpansion: vi.fn(),
  resumeExpansion: vi.fn(),
  requestIntervention: vi.fn(),
  enableKillSwitch: vi.fn(),
}));

vi.mock('../services/task028ExpansionRollbackExecutionService', () => ({
  executeRollback: vi.fn(),
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordControlActionResult: vi.fn(),
  },
}));

import { runControlActionPreflight } from '../services/task029ControlActionPreflightService';
import { pauseExpansion, resumeExpansion, requestIntervention, enableKillSwitch } from '../services/task028ExpansionInterventionService';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

function makePreflightOk() {
  return {
    ok: true,
    checksPassed: true,
    action: 'pause_expansion',
    schoolContextVerified: true,
    task028ProofAccepted: true,
    sameSchool: true,
    actorPermissionGranted: true,
    expansionRunExists: true,
    runStateAllowsAction: true,
    actionAllowed: true,
    actionIsStagingRehearsal: false,
    actionIsCanary: false,
    actionIsRollout: false,
    actionIsSchoolWide: false,
    privacyBoundaryClear: true,
    safeguardingBoundaryClear: true,
    contentGovernanceBoundaryClear: true,
    rollbackReadiness: true,
    auditWritePathAvailable: true,
    blockingIssues: [],
  };
}

function makePreflightBlocked(issues: string[] = ['preflight_failed']) {
  return { ...makePreflightOk(), ok: false, checksPassed: false, blockingIssues: issues };
}

function makeServiceOk(overrides: Record<string, any> = {}) {
  return { ok: true, reasonCodes: [], safeMessage: 'Action executed.', ...overrides };
}

function makeDefaultInput(action: string) {
  return {
    schoolId: 'school_alpha',
    actorId: 'actor_001',
    actorRole: 'admin',
    expansionRunId: 'run_001',
    action,
    reason: 'test_reason',
  };
}

describe('executeControlAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns preflight_blocked when preflight fails', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightBlocked(['school_context_missing']));

    const result = await executeControlAction(makeDefaultInput('pause_expansion'));

    expect(result.ok).toBe(false);
    expect(result.status).toBe('preflight_blocked');
    expect(result.reasonCodes).toEqual(['school_context_missing']);
    expect(result.safeMessage).toContain('Preflight failed');
  });

  it('delegates to pauseExpansion for pause_expansion action', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(pauseExpansion).mockResolvedValue(makeServiceOk({ safeMessage: 'Expansion paused.' }));

    const result = await executeControlAction(makeDefaultInput('pause_expansion'));

    expect(result.ok).toBe(true);
    expect(result.status).toBe('executed');
    expect(result.safeMessage).toBe('Expansion paused.');
    expect(pauseExpansion).toHaveBeenCalledWith('run_001', 'admin', 'actor_001', 'test_reason');
  });

  it('delegates to resumeExpansion for resume_expansion action', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(resumeExpansion).mockResolvedValue(makeServiceOk({ safeMessage: 'Expansion resumed.' }));

    const result = await executeControlAction(makeDefaultInput('resume_expansion'));

    expect(result.ok).toBe(true);
    expect(result.status).toBe('executed');
    expect(result.safeMessage).toBe('Expansion resumed.');
    expect(resumeExpansion).toHaveBeenCalledWith('run_001', 'admin', 'actor_001', 'test_reason');
  });

  it('delegates to requestIntervention for request_intervention action', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(requestIntervention).mockResolvedValue(makeServiceOk({ safeMessage: 'Intervention requested.' }));

    const result = await executeControlAction(makeDefaultInput('request_intervention'));

    expect(result.ok).toBe(true);
    expect(result.status).toBe('executed');
    expect(result.safeMessage).toBe('Intervention requested.');
    expect(requestIntervention).toHaveBeenCalledWith('run_001', 'pause_execution', 'admin', 'actor_001', 'test_reason', 'test_reason');
  });

  it('delegates to enableKillSwitch for execute_kill_switch action', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(enableKillSwitch).mockResolvedValue(makeServiceOk({ safeMessage: 'Kill switch enabled.' }));

    const result = await executeControlAction(makeDefaultInput('execute_kill_switch'));

    expect(result.ok).toBe(true);
    expect(result.status).toBe('executed');
    expect(result.safeMessage).toBe('Kill switch enabled.');
    expect(enableKillSwitch).toHaveBeenCalledWith('run_001', 'admin', 'actor_001', 'test_reason');
  });

  it('delegates to executeRollback for request_rollback action', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(executeRollback).mockResolvedValue({
      ok: true, rollbackId: 'rb_001', previousStatus: 'stage_1_active',
      newStatus: 'rolled_back', studentAccessBlocked: true,
      dataDestructivelyDeleted: false, auditPreserved: true,
      affectedParticipantCount: 5, reasonCodes: [], safeMessage: 'Rollback completed.',
    });

    const result = await executeControlAction(makeDefaultInput('request_rollback'));

    expect(result.ok).toBe(true);
    expect(result.status).toBe('executed');
    expect(result.safeMessage).toBe('Rollback completed.');
    expect(executeRollback).toHaveBeenCalledWith('run_001', 'admin', 'actor_001', 'test_reason', 'test_reason');
  });

  it('handles unknown action with error', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());

    const result = await executeControlAction(makeDefaultInput('unknown_action'));

    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.reasonCodes).toContain('unknown_action');
  });

  it('catches service errors and returns failed status', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(pauseExpansion).mockRejectedValue(new Error('DB connection lost'));

    const result = await executeControlAction(makeDefaultInput('pause_expansion'));

    expect(result.ok).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.reasonCodes).toContain('service_error');
  });

  it('records the action result via repository', async () => {
    vi.mocked(runControlActionPreflight).mockResolvedValue(makePreflightOk());
    vi.mocked(pauseExpansion).mockResolvedValue(makeServiceOk());

    await executeControlAction(makeDefaultInput('pause_expansion'));

    expect(task029ExpansionOperationsRepository.recordControlActionResult).toHaveBeenCalledTimes(1);
    const recorded = vi.mocked(task029ExpansionOperationsRepository.recordControlActionResult).mock.calls[0][0];
    expect(recorded.action).toBe('pause_expansion');
    expect(recorded.status).toBe('executed');
  });
});
