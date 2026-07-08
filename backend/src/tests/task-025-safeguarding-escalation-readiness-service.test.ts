import { describe, it, expect } from 'vitest';
import { checkSafeguardingEscalationReadiness } from '../services/task025SafeguardingEscalationReadinessService';

describe('checkSafeguardingEscalationReadiness', () => {
  const allReady = {
    safeguardingOwnerExists: true,
    escalationRouteDefined: true,
    seriousRiskDisclosureMinimal: true,
    rawNotesNeverExposed: true,
    humanReviewPathExists: true,
    auditEventCreated: true,
  };

  it('returns ready status when all conditions pass', async () => {
    const result = await checkSafeguardingEscalationReadiness(allReady);

    expect(result.safeguardingStatus).toBe('safeguarding_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toMatch(/confirmed/i);
  });

  it('adds high blocker when safeguarding owner does not exist', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, safeguardingOwnerExists: false });

    expect(result.safeguardingStatus).toBe('safeguarding_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/no safeguarding escalation owner/i);
  });

  it('adds high blocker when escalation route is not defined', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, escalationRouteDefined: false });

    expect(result.safeguardingStatus).toBe('safeguarding_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/no escalation route/i);
  });

  it('adds high blocker when serious risk disclosure is not minimal', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, seriousRiskDisclosureMinimal: false });

    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/not minimized/i);
  });

  it('adds high blocker when raw notes may be exposed', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, rawNotesNeverExposed: false });

    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/raw safeguarding notes/i);
  });

  it('adds high blocker when human review path does not exist', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, humanReviewPathExists: false });

    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/no human review path/i);
  });

  it('adds medium blocker when audit event was not created', async () => {
    const result = await checkSafeguardingEscalationReadiness({ ...allReady, auditEventCreated: false });

    expect(result.safeguardingStatus).toBe('safeguarding_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('medium');
    expect(result.safeBlockers[0].safeDescription).toMatch(/audit event/i);
  });

  it('accumulates multiple blockers when multiple checks fail', async () => {
    const result = await checkSafeguardingEscalationReadiness({
      safeguardingOwnerExists: false,
      escalationRouteDefined: false,
      seriousRiskDisclosureMinimal: false,
      rawNotesNeverExposed: true,
      humanReviewPathExists: false,
      auditEventCreated: false,
    });

    expect(result.safeguardingStatus).toBe('safeguarding_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(5);
    const highBlockers = result.safeBlockers.filter((b) => b.severity === 'high');
    const mediumBlockers = result.safeBlockers.filter((b) => b.severity === 'medium');
    expect(highBlockers).toHaveLength(4);
    expect(mediumBlockers).toHaveLength(1);
    expect(result.safeSummary).toContain('5 blocker(s)');
  });
});
