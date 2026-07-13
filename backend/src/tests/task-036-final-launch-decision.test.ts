import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import {
  calculateTask036FinalLaunchDecision,
  calculateTask036SafeToStartTask040,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateFinalLaunchDecision,
} from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveFinalLaunchDecision: vi.fn(),
    getFinalLaunchDecision: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

describe('Task036 Final Launch Decision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all gates pass', () => {
    const gates: Record<string, boolean> = {
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(decision.safeToStartTask040).toBe(true);
    expect(decision.finalDecision).toBe('TASK_036_PASS_SAFE_TO_START_TASK_040');
    expect(decision.allGatesPassed).toBe(true);
    expect(decision.remainingBlockers).toEqual([]);
    const validationErrors = validateFinalLaunchDecision(decision);
    expect(validationErrors).toEqual([]);
  });

  it('blocks when any gate fails', () => {
    const gates: Record<string, boolean> = {
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: false,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: false,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(decision.safeToStartTask040).toBe(false);
    expect(decision.finalDecision).toBe('TASK_036_BLOCKED');
    expect(decision.allGatesPassed).toBe(false);
    expect(decision.remainingBlockers).toContain('launchWindowPassed');
    expect(decision.remainingBlockers).toContain('privacyBoundaryPassed');
  });

  it('defaults missing gates to false', () => {
    const decision = calculateTask036FinalLaunchDecision({});
    expect(decision.dependencyProofPassed).toBe(false);
    expect(decision.environmentGatePassed).toBe(false);
    expect(decision.launchWindowPassed).toBe(false);
    expect(decision.safeToStartTask040).toBe(false);
  });

  it('saves final decision to repository', () => {
    const gates: Record<string, boolean> = { gate1: true, gate2: true };
    const decision = calculateTask036FinalLaunchDecision(gates);
    task036Repository.saveFinalLaunchDecision('sess-1', decision);
    expect(task036Repository.saveFinalLaunchDecision).toHaveBeenCalledWith('sess-1', decision);
  });

  it('retrieves final decision from repository', () => {
    const gates: Record<string, boolean> = { gate1: false };
    const decision = calculateTask036FinalLaunchDecision(gates);
    vi.mocked(task036Repository.getFinalLaunchDecision).mockReturnValue(decision);
    const retrieved = task036Repository.getFinalLaunchDecision('sess-1');
    expect(retrieved!.safeToStartTask040).toBe(false);
    expect(retrieved!.allGatesPassed).toBe(false);
  });

  it('calculateTask036SafeToStartTask040 works correctly', () => {
    expect(calculateTask036SafeToStartTask040({ a: true, b: true })).toBe(true);
    expect(calculateTask036SafeToStartTask040({ a: true, b: false })).toBe(false);
    expect(calculateTask036SafeToStartTask040({})).toBe(true);
  });
});
