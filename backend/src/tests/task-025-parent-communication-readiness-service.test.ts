import { describe, it, expect } from 'vitest';
import { checkParentCommunicationReadiness } from '../services/task025ParentCommunicationReadinessService';

describe('checkParentCommunicationReadiness', () => {
  const allReady = {
    templatesReady: true,
    noRawLearnerDataInTemplates: true,
    noUnsupportedClaims: true,
    noReligiousAuthorityOverclaim: true,
    noAiExaggeration: true,
    noGuaranteeOfOutcomes: true,
    clearPilotExplanation: true,
    clearSupportPath: true,
    clearSchoolContactPath: true,
    clearPrivacySummary: true,
    clearOptOutPathDefined: true,
  };

  it('returns ready status when all conditions pass', async () => {
    const result = await checkParentCommunicationReadiness(allReady);

    expect(result.parentCommunicationStatus).toBe('parent_communication_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toMatch(/ready/i);
  });

  it('adds high blocker when templates are not ready', async () => {
    const result = await checkParentCommunicationReadiness({ ...allReady, templatesReady: false });

    expect(result.parentCommunicationStatus).toBe('parent_communication_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/templates are not ready/i);
  });

  it('adds high blocker when templates may contain raw learner data', async () => {
    const result = await checkParentCommunicationReadiness({ ...allReady, noRawLearnerDataInTemplates: false });

    expect(result.parentCommunicationStatus).toBe('parent_communication_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/raw learner data/i);
  });

  it('adds high blockers for unsupported claims and religious overclaim', async () => {
    const result = await checkParentCommunicationReadiness({
      ...allReady,
      noUnsupportedClaims: false,
      noReligiousAuthorityOverclaim: false,
    });

    expect(result.parentCommunicationStatus).toBe('parent_communication_blocked');
    expect(result.safeBlockers).toHaveLength(2);
    expect(result.safeBlockers[0].safeDescription).toMatch(/unsupported claims/i);
    expect(result.safeBlockers[1].safeDescription).toMatch(/overclaim religious authority/i);
  });

  it('adds high blocker for AI exaggeration', async () => {
    const result = await checkParentCommunicationReadiness({ ...allReady, noAiExaggeration: false });

    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/exaggerate AI capabilities/i);
  });

  it('adds high blocker for guarantee of outcomes', async () => {
    const result = await checkParentCommunicationReadiness({ ...allReady, noGuaranteeOfOutcomes: false });

    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/guarantee outcomes/i);
  });

  it('returns pending with medium blockers when only medium-severity items fail', async () => {
    const result = await checkParentCommunicationReadiness({
      ...allReady,
      clearSupportPath: false,
      clearSchoolContactPath: false,
      clearOptOutPathDefined: false,
    });

    expect(result.parentCommunicationStatus).toBe('parent_communication_pending');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers).toHaveLength(3);
    expect(result.safeBlockers.every((b) => b.severity === 'medium')).toBe(true);
  });

  it('accumulates all blockers when everything fails', async () => {
    const result = await checkParentCommunicationReadiness({
      templatesReady: false,
      noRawLearnerDataInTemplates: false,
      noUnsupportedClaims: false,
      noReligiousAuthorityOverclaim: false,
      noAiExaggeration: false,
      noGuaranteeOfOutcomes: false,
      clearPilotExplanation: false,
      clearSupportPath: false,
      clearSchoolContactPath: false,
      clearPrivacySummary: false,
      clearOptOutPathDefined: false,
    });

    expect(result.parentCommunicationStatus).toBe('parent_communication_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(11);
    expect(result.safeSummary).toContain('11 issue(s)');
  });
});
