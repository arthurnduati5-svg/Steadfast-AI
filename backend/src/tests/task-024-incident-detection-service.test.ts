import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectAllSignals,
  detectSignal,
  injectSignal,
  clearSignals,
  getDetectedSignals,
} from '../services/task024IncidentDetectionService';
import type { IncidentSignal } from '../contracts/task024OperationsContracts';
import * as fs from 'node:fs';
import * as path from 'node:path';

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe('task024IncidentDetectionService', () => {
  beforeEach(() => {
    clearSignals();
  });

  describe('detectAllSignals', () => {
    it('runs without error and returns array', async () => {
      const result = await detectAllSignals();
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns signals with correct shape', async () => {
      const result = await detectAllSignals();
      for (const signal of result) {
        expect(signal).toHaveProperty('source');
        expect(signal).toHaveProperty('component');
        expect(signal).toHaveProperty('signalType');
        expect(signal).toHaveProperty('detectedAt');
        expect(signal).toHaveProperty('safeSummary');
        expect(typeof signal.source).toBe('string');
        expect(typeof signal.component).toBe('string');
        expect(typeof signal.signalType).toBe('string');
        expect(typeof signal.detectedAt).toBe('string');
        expect(typeof signal.safeSummary).toBe('string');
      }
    });
  });

  describe('detectSignal', () => {
    it('returns null for unknown signal type', async () => {
      const result = await detectSignal('nonexistent_signal');
      expect(result).toBeNull();
    });

    it('detects startupGateBlocked when env var is set', async () => {
      const prev = process.env.PRODUCTION_STARTUP_GATE_BLOCKED;
      setEnv('PRODUCTION_STARTUP_GATE_BLOCKED', 'true');
      try {
        const signal = await detectSignal('startupGateBlocked');
        expect(signal).not.toBeNull();
        expect(signal!.signalType).toBe('startupGateBlocked');
        expect(signal!.component).toBe('ProductionStartupGate');
      } finally {
        setEnv('PRODUCTION_STARTUP_GATE_BLOCKED', prev);
      }
    });

    it('detects databaseUnavailable when DATABASE_URL is empty', async () => {
      const prev = process.env.DATABASE_URL;
      setEnv('DATABASE_URL', '');
      try {
        const signal = await detectSignal('databaseUnavailable');
        expect(signal).not.toBeNull();
        expect(signal!.signalType).toBe('databaseUnavailable');
        expect(signal!.component).toBe('Database');
      } finally {
        setEnv('DATABASE_URL', prev);
      }
    });

    it('detects secretLeakDetected when env var is set', async () => {
      const prev = process.env.SECRET_LEAK_DETECTED;
      setEnv('SECRET_LEAK_DETECTED', 'true');
      try {
        const signal = await detectSignal('secretLeakDetected');
        expect(signal).not.toBeNull();
        expect(signal!.signalType).toBe('secretLeakDetected');
        expect(signal!.component).toBe('SecretSafety');
      } finally {
        setEnv('SECRET_LEAK_DETECTED', prev);
      }
    });

    it('returns null when signal type check produces no signal', async () => {
      const prev = process.env.PRODUCTION_STARTUP_GATE_BLOCKED;
      setEnv('PRODUCTION_STARTUP_GATE_BLOCKED', 'false');
      try {
        const signal = await detectSignal('startupGateBlocked');
        expect(signal).toBeNull();
      } finally {
        setEnv('PRODUCTION_STARTUP_GATE_BLOCKED', prev);
      }
    });

    it('supports all known signal types', async () => {
      const knownTypes = [
        'startupGateBlocked', 'databaseUnavailable', 'prismaReadinessFailure',
        'migrationSafetyCritical', 'schoolIntegrationReadinessFailure',
        'contentGovernanceReadinessFailure', 'aiGatewayUnsafe',
        'privacyLeakDetected', 'secretLeakDetected', 'rateLimitAbuseSpike',
        'backupReadinessFailed', 'restoreDrillFailed', 'contentGapSpike',
        'deenGovernanceSourceUnavailable',
      ];
      for (const signalType of knownTypes) {
        const signal = await detectSignal(signalType);
        expect(signal === null || typeof signal === 'object').toBe(true);
      }
    });
  });

  describe('injectSignal + getDetectedSignals', () => {
    it('returns injected signals after detectAllSignals', async () => {
      const injected: IncidentSignal = {
        source: 'test',
        component: 'TestComponent',
        signalType: 'testSignal',
        detectedAt: new Date().toISOString(),
        safeSummary: 'Test injected signal',
      };
      injectSignal(injected);
      await detectAllSignals();
      const detected = getDetectedSignals();
      expect(detected.some((s) => s.signalType === 'testSignal')).toBe(true);
    });
  });

  describe('clearSignals', () => {
    it('clears injected and cached signals', () => {
      const injected: IncidentSignal = {
        source: 'test',
        component: 'TestComponent',
        signalType: 'testSignal',
        detectedAt: new Date().toISOString(),
        safeSummary: 'Test injected signal',
      };
      injectSignal(injected);
      clearSignals();
      expect(getDetectedSignals()).toHaveLength(0);
    });
  });

  describe('no live AI calls', () => {
    it('does not invoke any AI provider', () => {
      const serviceContent = fs.readFileSync(path.resolve(__dirname, '../services/task024IncidentDetectionService.ts'), 'utf8');
      expect(serviceContent).not.toContain('openai');
      expect(serviceContent).not.toContain('anthropic');
      expect(serviceContent).not.toContain('provider.generate');
    });
  });
});
