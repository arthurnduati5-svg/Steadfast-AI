import { describe, it, expect } from 'vitest';
import { checkPauseRollbackReadiness } from '../services/task025PauseRollbackReadinessService';

describe('checkPauseRollbackReadiness', () => {
  const allTrue = {
    pauseOwnerExists: true,
    rollbackOwnerExists: true,
    pauseCriteriaDefined: true,
    rollbackCriteriaDefined: true,
    incidentSeverityMappingExists: true,
    communicationChainExistsAsMetadata: true,
    noActualRollbackExecuted: true,
    noDeploymentCommandExists: true,
  };

  it('returns pause_rollback_ready when all inputs are satisfied', async () => {
    const result = await checkPauseRollbackReadiness(allTrue);
    expect(result.pauseRollbackStatus).toBe('pause_rollback_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('confirmed');
  });

  it('blocks when pause owner is missing', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, pauseOwnerExists: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('pause owner');
  });

  it('blocks when rollback owner is missing', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, rollbackOwnerExists: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('rollback owner');
  });

  it('blocks when pause criteria are not defined', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, pauseCriteriaDefined: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('pause criteria');
  });

  it('blocks when rollback criteria are not defined', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, rollbackCriteriaDefined: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('rollback criteria');
  });

  it('blocks when actual rollback was executed during readiness', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, noActualRollbackExecuted: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toContain('actual rollback');
  });

  it('blocks when deployment command exists in readiness context', async () => {
    const result = await checkPauseRollbackReadiness({ ...allTrue, noDeploymentCommandExists: false });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('deployment command');
  });

  it('returns pause_rollback_pending when only medium-severity blockers exist', async () => {
    const result = await checkPauseRollbackReadiness({
      ...allTrue,
      incidentSeverityMappingExists: false,
      communicationChainExistsAsMetadata: false,
    });
    expect(result.pauseRollbackStatus).toBe('pause_rollback_pending');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers).toHaveLength(2);
  });
});
