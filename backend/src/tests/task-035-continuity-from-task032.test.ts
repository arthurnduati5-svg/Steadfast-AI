import { describe, it, expect } from 'vitest';
import { simulateFullSchoolRuntimeGuard } from '../services/task035FullSchoolRuntimeGuardSimulationService';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 continuity from task032 (canary activation)', () => {
  it('runtime guard simulation importable', () => {
    expect(typeof simulateFullSchoolRuntimeGuard).toBe('function');
  });

  it('school boundary guard importable', () => {
    expect(typeof validateApprovedSchoolBoundary).toBe('function');
  });

  it('runtime guard blocks all required protections', () => {
    const result = simulateFullSchoolRuntimeGuard();
    expect(result.sessionBeforeSchoolGateBlocked).toBe(true);
    expect(result.aiBeforeSchoolGateBlocked).toBe(true);
    expect(result.memoryBeforeSchoolGateBlocked).toBe(true);
    expect(result.evidenceBeforeSchoolGateBlocked).toBe(true);
    expect(result.pauseBlocksRuntime).toBe(true);
    expect(result.killSwitchBlocksRuntime).toBe(true);
    expect(result.rollbackBlocksRuntime).toBe(true);
  });

  it('school boundary blocks cross-school and unknown access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
    expect(result.unknownSchoolBlocked).toBe(true);
    expect(result.tenantMismatchBlocked).toBe(true);
  });
});
