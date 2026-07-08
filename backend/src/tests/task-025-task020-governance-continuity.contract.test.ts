import { describe, it, expect } from 'vitest';
import { checkDataPrivacyReadiness } from '../services/task025DataPrivacyReadinessService';
import {
  TASK025_BLOCKER_TYPES,
  TASK025_FORBIDDEN_FIELDS,
} from '../contracts/task025ControlledPilotReadinessContracts';
import {
  PILOT_READINESS_CHECK_TYPES,
  PRIVATE_CONTENT_PATTERNS,
} from '../contracts/task025PilotContracts';

describe('Task025 Task020 governance continuity contract', () => {
  it('blocker types include governance_continuity', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('governance_continuity');
  });

  it('blocker types include data_privacy for Task 020 governance continuity', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('data_privacy');
  });

  it('readiness check types include privacy_gate from Task 020', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('privacy_gate');
  });

  it('checkDataPrivacyReadiness blocks when data classification is not applied', async () => {
    const result = await checkDataPrivacyReadiness({
      dataClassificationApplied: false,
      roleMatrixApplied: true,
      retentionExportDeleteFoundationNotBypassed: true,
      aiEgressGuardNotBypassed: true,
      rawLearnerDataBlocked: true,
      parentDataBlocked: true,
      safeguardingRawBlocked: true,
      privateDeenTextBlocked: true,
      hiddenReasoningBlocked: true,
      answerArtifactsBlocked: true,
    });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers.some((b) => b.requiredAction.includes('Task 020 governance'))).toBe(true);
  });

  it('checkDataPrivacyReadiness blocks when AI egress guard is bypassed', async () => {
    const result = await checkDataPrivacyReadiness({
      dataClassificationApplied: true,
      roleMatrixApplied: true,
      retentionExportDeleteFoundationNotBypassed: true,
      aiEgressGuardNotBypassed: false,
      rawLearnerDataBlocked: true,
      parentDataBlocked: true,
      safeguardingRawBlocked: true,
      privateDeenTextBlocked: true,
      hiddenReasoningBlocked: true,
      answerArtifactsBlocked: true,
    });
    expect(result.privacyStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers.some((b) => b.safeDescription.includes('AI egress guard'))).toBe(true);
  });

  it('TASK025_FORBIDDEN_FIELDS covers privacy-sensitive patterns from Task 020', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toContain('rawLearnerData');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('rawChat');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('answerKey');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('chainOfThought');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
    expect(TASK025_FORBIDDEN_FIELDS).toContain('providerResponse');
  });

  it('PRIVATE_CONTENT_PATTERNS restricts AI egress patterns from Task 020 governance', () => {
    expect(PRIVATE_CONTENT_PATTERNS).toContain('rawChat');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('providerResponse');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('answerKey');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('deenSensitive');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('safeguardingRaw');
  });

  it('checkDataPrivacyReadiness passes when all Task 020 governance gates are satisfied', async () => {
    const result = await checkDataPrivacyReadiness({
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
    });
    expect(result.privacyStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('low');
  });
});
