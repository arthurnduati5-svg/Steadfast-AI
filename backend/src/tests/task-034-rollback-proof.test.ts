import { describe, it, expect } from 'vitest';
import { evaluateRollbackProof } from '../services/task034RolloutRollbackProofService';

describe('Task034RolloutRollbackProof', () => {
  it('should pass all rollback proof checks', () => {
    const result = evaluateRollbackProof();
    expect(result.ok).toBe(true);
    expect(result.pauseBlocksRuntime).toBe(true);
    expect(result.resumeRequiresGateRecheck).toBe(true);
    expect(result.killSwitchBlocksRuntime).toBe(true);
    expect(result.killSwitchDisableRequiresRecheck).toBe(true);
    expect(result.rollbackBlocksRuntime).toBe(true);
    expect(result.safeAuditSummaryPreserved).toBe(true);
    expect(result.destructiveLearningEvidenceDeletionAvoided).toBe(true);
    expect(result.rawPrivateDataExposed).toBe(false);
    expect(result.blockingIssues).toEqual([]);
  });
});
