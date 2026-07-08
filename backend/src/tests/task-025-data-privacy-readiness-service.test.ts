import { describe, it, expect } from 'vitest';
import { checkDataPrivacyReadiness } from '../services/task025DataPrivacyReadinessService';

describe('checkDataPrivacyReadiness', () => {
  const allTrue = {
    dataClassificationApplied: true,
    roleMatrixApplied: true,
    retentionExportDeleteFoundationNotBypassed: true,
    aiEgressGuardNotBypassed: true,
    rawLearnerDataBlocked: true,
    parentDataBlocked: true,
    safeguardingRawBlocked: true,
    privateDeenTextBlocked: true,
    hiddenReasoningBlocked: true,
    answerArtifactsBlocked: true,
  };

  it('returns stakeholder_ready when all privacy inputs are satisfied', async () => {
    const result = await checkDataPrivacyReadiness(allTrue);
    expect(result.privacyStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('confirmed');
  });

  it('blocks when data classification is not applied', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, dataClassificationApplied: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('classification');
  });

  it('blocks when role access matrix is not applied', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, roleMatrixApplied: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('Role access matrix');
  });

  it('blocks when retention/export/delete foundation is bypassed', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, retentionExportDeleteFoundationNotBypassed: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('bypassed');
  });

  it('blocks when AI egress guard is bypassed', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, aiEgressGuardNotBypassed: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('AI egress');
  });

  it('blocks when raw learner data is not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, rawLearnerDataBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toContain('Raw learner data');
  });

  it('blocks when parent data is not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, parentDataBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Parent contact data');
  });

  it('blocks when safeguarding raw data is not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, safeguardingRawBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('safeguarding');
  });

  it('blocks when private Deen text is not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, privateDeenTextBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Deen text');
  });

  it('blocks when hidden reasoning is not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, hiddenReasoningBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Hidden reasoning');
  });

  it('blocks when answer artifacts are not blocked', async () => {
    const result = await checkDataPrivacyReadiness({ ...allTrue, answerArtifactsBlocked: false });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers[0].safeDescription).toContain('Answer artifacts');
  });

  it('returns all 10 blockers when every check fails', async () => {
    const result = await checkDataPrivacyReadiness({
      dataClassificationApplied: false,
      roleMatrixApplied: false,
      retentionExportDeleteFoundationNotBypassed: false,
      aiEgressGuardNotBypassed: false,
      rawLearnerDataBlocked: false,
      parentDataBlocked: false,
      safeguardingRawBlocked: false,
      privateDeenTextBlocked: false,
      hiddenReasoningBlocked: false,
      answerArtifactsBlocked: false,
    });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(10);
    expect(result.safeSummary).toContain('10 blocker');
  });
});
