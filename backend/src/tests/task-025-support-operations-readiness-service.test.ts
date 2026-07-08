import { describe, it, expect } from 'vitest';
import { checkSupportOperationsReadiness } from '../services/task025SupportOperationsReadinessService';

describe('checkSupportOperationsReadiness', () => {
  const allReady = {
    supportOwnerAssigned: true,
    incidentOwnerAssigned: true,
    supportScheduleDefined: true,
    incidentResponseTimeDefined: true,
    communicationChainDefined: true,
  };

  it('returns ready status when all conditions pass', async () => {
    const result = await checkSupportOperationsReadiness(allReady);

    expect(result.supportStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toMatch(/confirmed/i);
  });

  it('adds high blocker when support owner is not assigned', async () => {
    const result = await checkSupportOperationsReadiness({ ...allReady, supportOwnerAssigned: false });

    expect(result.supportStatus).toBe('stakeholder_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/no support owner/i);
  });

  it('adds high blocker when incident owner is not assigned', async () => {
    const result = await checkSupportOperationsReadiness({ ...allReady, incidentOwnerAssigned: false });

    expect(result.supportStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/no incident owner/i);
  });

  it('adds medium blocker when support schedule is not defined', async () => {
    const result = await checkSupportOperationsReadiness({ ...allReady, supportScheduleDefined: false });

    expect(result.supportStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('medium');
    expect(result.safeBlockers[0].safeDescription).toMatch(/support schedule not defined/i);
  });

  it('returns medium risk when only medium blockers exist', async () => {
    const result = await checkSupportOperationsReadiness({
      supportOwnerAssigned: true,
      incidentOwnerAssigned: true,
      supportScheduleDefined: false,
      incidentResponseTimeDefined: false,
      communicationChainDefined: false,
    });

    expect(result.supportStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers).toHaveLength(3);
    expect(result.safeBlockers.every((b) => b.severity === 'medium')).toBe(true);
  });

  it('accumulates all blockers when everything fails', async () => {
    const result = await checkSupportOperationsReadiness({
      supportOwnerAssigned: false,
      incidentOwnerAssigned: false,
      supportScheduleDefined: false,
      incidentResponseTimeDefined: false,
      communicationChainDefined: false,
    });

    expect(result.supportStatus).toBe('stakeholder_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(5);
    const highBlockers = result.safeBlockers.filter((b) => b.severity === 'high');
    const mediumBlockers = result.safeBlockers.filter((b) => b.severity === 'medium');
    expect(highBlockers).toHaveLength(2);
    expect(mediumBlockers).toHaveLength(3);
    expect(result.safeSummary).toContain('5 issue(s)');
  });
});
