import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';
import { OPERATIONAL_STATUS_VALUES } from '../contracts/task024OperationsContracts';

describe('getOperationalHealth', { timeout: 10000 }, () => {
  it('returns an object with correct shape', async () => {
    const result = await getOperationalHealth();
    expect(result).toHaveProperty('overallStatus');
    expect(result).toHaveProperty('components');
    expect(result).toHaveProperty('criticalFailures');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('safeNextActions');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('correlationId');
  });

  it('components is an array of component checks', async () => {
    const result = await getOperationalHealth();
    expect(Array.isArray(result.components)).toBe(true);
    expect(result.components.length).toBeGreaterThan(0);
  });

  it('each component has component, status, safeMessage, checkedAt', async () => {
    const result = await getOperationalHealth();
    for (const comp of result.components) {
      expect(comp).toHaveProperty('component');
      expect(comp).toHaveProperty('status');
      expect(comp).toHaveProperty('safeMessage');
      expect(comp).toHaveProperty('checkedAt');
    }
  });

  it('each component status is a valid OperationalComponentStatus', async () => {
    const result = await getOperationalHealth();
    for (const comp of result.components) {
      expect(OPERATIONAL_STATUS_VALUES).toContain(comp.status);
    }
  });

  it('does NOT contain raw private data or secrets', async () => {
    process.env.DATABASE_URL = 'postgres://secret:password@host/db';
    process.env.OPENAI_API_KEY = 'sk-real-key-abcdef123456';
    const result = await getOperationalHealth();
    const json = JSON.stringify(result);
    expect(json).not.toContain('secret:password');
    expect(json).not.toContain('sk-real-key');
    expect(json).not.toContain('postgres://secret');
    expect(json).not.toContain('rawChat');
    expect(json).not.toContain('privateMemory');
    expect(json).not.toContain('safeguardingRaw');
    expect(json).not.toContain('deenSensitiveRaw');
    expect(json).not.toContain('providerResponse');
    expect(json).not.toContain('aiPrompt');
    expect(json).not.toContain('answerKey');
  });

  it('does NOT contain stack traces', async () => {
    const result = await getOperationalHealth();
    const json = JSON.stringify(result);
    expect(json).not.toMatch(/Error:/);
    expect(json).not.toMatch(/\n\s+at /);
    expect(json).not.toContain('StackTrace');
    expect(json).not.toContain('stack trace');
  });

  it('accepts an optional correlationId', async () => {
    const result = await getOperationalHealth('test-corr-ophealth');
    expect(result.correlationId).toBe('test-corr-ophealth');
  });

  it('overallStatus is a valid OperationalComponentStatus', async () => {
    const result = await getOperationalHealth();
    expect(OPERATIONAL_STATUS_VALUES).toContain(result.overallStatus);
  });
});
