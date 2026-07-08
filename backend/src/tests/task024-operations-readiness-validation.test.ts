import { describe, it, expect } from 'vitest';
import {
  validateTask024OperationsReadinessContext,
  validateTask024OperationEnvironment,
  validateTask024BackupReadinessResult,
  validateTask024RestoreDrillDryRunResult,
  validateTask024LoadSimulationPlan,
  validateTask024LoadSimulationResult,
  rejectForbiddenTask024OperationFields,
  createSafeTask024ValidationError,
} from '../lib/task024OperationsReadinessValidation';

describe('Task024OperationsReadinessValidation', () => {
  describe('validateTask024OperationsReadinessContext', () => {
    it('should reject missing actorId', () => {
      expect(() => validateTask024OperationsReadinessContext({ actorRole: 'admin', operationEnvironment: 'local' })).toThrow('actorId');
    });
    it('should reject missing actorRole', () => {
      expect(() => validateTask024OperationsReadinessContext({ actorId: 'user1', operationEnvironment: 'local' })).toThrow('actorRole');
    });
    it('should reject learner role', () => {
      expect(() => validateTask024OperationsReadinessContext({ actorId: 'student1', actorRole: 'learner', operationEnvironment: 'local' })).toThrow('learner/parent/peer');
    });
    it('should reject parent role', () => {
      expect(() => validateTask024OperationsReadinessContext({ actorId: 'parent1', actorRole: 'parent', operationEnvironment: 'local' })).toThrow('learner/parent/peer');
    });
    it('should reject peer role', () => {
      expect(() => validateTask024OperationsReadinessContext({ actorId: 'peer1', actorRole: 'peer', operationEnvironment: 'local' })).toThrow('learner/parent/peer');
    });
    it('should accept admin role', () => {
      const ctx = validateTask024OperationsReadinessContext({ actorId: 'admin1', actorRole: 'admin', operationEnvironment: 'local' });
      expect(ctx.actorId).toBe('admin1');
    });
    it('should accept internal role', () => {
      const ctx = validateTask024OperationsReadinessContext({ actorId: 'int1', actorRole: 'internal', operationEnvironment: 'local' });
      expect(ctx.actorId).toBe('int1');
    });
    it('should accept operator role', () => {
      const ctx = validateTask024OperationsReadinessContext({ actorId: 'op1', actorRole: 'operator', operationEnvironment: 'test' });
      expect(ctx.actorId).toBe('op1');
    });
  });

  describe('validateTask024OperationEnvironment', () => {
    it('should reject empty string', () => {
      expect(() => validateTask024OperationEnvironment('')).toThrow();
    });
    it('should reject unknown environment', () => {
      expect(() => validateTask024OperationEnvironment('mars')).toThrow('Unknown');
    });
    it('should accept valid environments', () => {
      expect(validateTask024OperationEnvironment('local')).toBe('local');
      expect(validateTask024OperationEnvironment('production')).toBe('production');
      expect(validateTask024OperationEnvironment('test')).toBe('test');
    });
  });

  describe('validateTask024BackupReadinessResult', () => {
    it('should reject result without noRawOutput true', () => {
      expect(() => validateTask024BackupReadinessResult({ scopeDefined: true, ownerDefined: true, noRawOutput: false } as any)).toThrow('raw output');
    });
    it('should accept valid result with noRawOutput true', () => {
      const result = validateTask024BackupReadinessResult({ status: 'ready', scopeDefined: true, ownerDefined: true, scheduleDefined: true, integrityCheckDefined: true, privacyBoundaryDefined: true, noRawOutput: true, safeSummary: 'ok' });
      expect(result.status).toBe('ready');
    });
  });

  describe('validateTask024RestoreDrillDryRunResult', () => {
    it('should reject non-dry-run result', () => {
      expect(() => validateTask024RestoreDrillDryRunResult({ dryRunMode: false, realRestoreBlocked: true } as any)).toThrow('dry-run');
    });
    it('should reject when real restore not blocked', () => {
      expect(() => validateTask024RestoreDrillDryRunResult({ dryRunMode: true, realRestoreBlocked: false } as any)).toThrow('blocked');
    });
    it('should accept valid dry-run result', () => {
      const result = validateTask024RestoreDrillDryRunResult({ status: 'dry_run_passed', dryRunMode: true, restorePlanDefined: true, ownerDefined: true, integrityVerificationDefined: true, privacyBoundaryDefined: true, rollbackDefined: true, realRestoreBlocked: true, safeSummary: 'ok' });
      expect(result.status).toBe('dry_run_passed');
    });
  });

  describe('validateTask024LoadSimulationPlan', () => {
    it('should reject plan with useLiveAi true', () => {
      expect(() => validateTask024LoadSimulationPlan({ useLiveAi: true, useLiveConnectors: false, safeMockData: true } as any)).toThrow('live AI');
    });
    it('should reject plan with useLiveConnectors true', () => {
      expect(() => validateTask024LoadSimulationPlan({ useLiveAi: false, useLiveConnectors: true, safeMockData: true } as any)).toThrow('live connector');
    });
    it('should reject plan without safeMockData', () => {
      expect(() => validateTask024LoadSimulationPlan({ useLiveAi: false, useLiveConnectors: false, safeMockData: false, simulationId: 's1', targetComponents: [], concurrentCount: 1, durationMs: 100 } as any)).toThrow('mock data');
    });
    it('should accept valid simulation plan', () => {
      const plan = validateTask024LoadSimulationPlan({ simulationId: 's1', targetComponents: ['auth'], concurrentCount: 10, durationMs: 1000, useLiveAi: false, useLiveConnectors: false, safeMockData: true });
      expect(plan.safeMockData).toBe(true);
    });
  });

  describe('validateTask024LoadSimulationResult', () => {
    it('should reject result with liveAiCalled true', () => {
      expect(() => validateTask024LoadSimulationResult({ liveAiCalled: true, liveConnectorCalled: false } as any)).toThrow('live AI');
    });
    it('should reject result with liveConnectorCalled true', () => {
      expect(() => validateTask024LoadSimulationResult({ liveAiCalled: false, liveConnectorCalled: true } as any)).toThrow('live connector');
    });
    it('should accept valid result', () => {
      const result = validateTask024LoadSimulationResult({ status: 'passed', simulationId: 's1', targetComponents: [], durationMs: 100, throughputPerSecond: 10, errorCount: 0, liveAiCalled: false, liveConnectorCalled: false, safeSummary: 'ok' });
      expect(result.status).toBe('passed');
    });
  });

  describe('rejectForbiddenTask024OperationFields', () => {
    it('should detect forbidden fields', () => {
      const result = rejectForbiddenTask024OperationFields({ DATABASE_URL: 'postgres://...', rawLearnerData: 'data' });
      expect(result.valid).toBe(false);
      expect(result.forbiddenFields.length).toBeGreaterThan(0);
    });
    it('should pass clean payloads', () => {
      const result = rejectForbiddenTask024OperationFields({ component: 'monitoring', status: 'healthy' });
      expect(result.valid).toBe(true);
      expect(result.forbiddenFields.length).toBe(0);
    });
  });

  describe('createSafeTask024ValidationError', () => {
    it('should create safe error with reason code', () => {
      const err = createSafeTask024ValidationError('test error', 'TEST_CODE');
      expect(err.message).toBe('test error');
      expect((err as any).safeReasonCode).toBe('TEST_CODE');
      expect((err as any).safe).toBe(true);
    });
  });
});
