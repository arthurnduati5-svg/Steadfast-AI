import { describe, it, expect } from 'vitest';
import { verifyTask032CanaryConsentAuthorization } from '../services/task032CanaryConsentAuthorizationService';

function validConfig() {
  return {
    schoolId: 'school_task032_safe',
    approvedByRole: 'school_admin',
    activationMode: 'internal_controlled_activation',
    maxCanaryLearners: 25,
    allowedClassIds: ['class_001'],
    allowedSubjectIds: ['subj_001'],
    allowedCohortIds: ['cohort_001'],
    canaryStartWindow: '',
    canaryEndWindow: '',
    rollbackPolicyId: 'rp_001',
    incidentPolicyId: 'ip_001',
    privacyBoundaryId: 'pb_001',
    healthBudgetId: 'hb_001',
    consentAuthorizationPolicyId: 'cap_001',
    sourceGovernancePolicyId: 'sgp_001',
    deenBoundaryPolicyId: 'dbp_001',
    socraticIntegrityPolicyId: 'sip_001',
    blockingIssues: [],
  };
}

describe('Task 032 - Consent Authorization Readiness', () => {
  it('should pass with valid schoolId and admin role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(true);
    expect(result.schoolApprovalRecorded).toBe(true);
    expect(result.adminOperatorAuthorizationRecorded).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should pass with system_admin role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'system_admin',
    });
    expect(result.ok).toBe(true);
    expect(result.adminOperatorAuthorizationRecorded).toBe(true);
  });

  it('should pass with internal_operator role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'internal_operator',
    });
    expect(result.ok).toBe(true);
    expect(result.adminOperatorAuthorizationRecorded).toBe(true);
  });

  it('should fail when schoolId is missing', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: '',
      config: validConfig(),
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(false);
    expect(result.schoolApprovalRecorded).toBe(false);
    expect(result.blockingIssues).toContain('school_approval_not_recorded');
  });

  it('should reject student actor role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'student',
    });
    expect(result.ok).toBe(false);
    expect(result.adminOperatorAuthorizationRecorded).toBe(false);
    expect(result.blockingIssues).toContain('admin_operator_not_authorized');
  });

  it('should reject teacher actor role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'teacher',
    });
    expect(result.ok).toBe(false);
    expect(result.adminOperatorAuthorizationRecorded).toBe(false);
  });

  it('should reject parent actor role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'parent',
    });
    expect(result.ok).toBe(false);
    expect(result.adminOperatorAuthorizationRecorded).toBe(false);
  });

  it('should reject anonymous actor role', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'anonymous',
    });
    expect(result.ok).toBe(false);
    expect(result.adminOperatorAuthorizationRecorded).toBe(false);
  });

  it('should show teacher readiness acknowledged', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'school_admin',
    });
    expect(result.teacherReadinessAcknowledged).toBe(true);
  });

  it('should show learner and parent notice templates ready', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'school_admin',
    });
    expect(result.learnerSafeNoticeTemplateReady).toBe(true);
    expect(result.parentGuardianNoticeTemplateReady).toBe(true);
  });

  it('should confirm no real notices sent', async () => {
    const result = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config: validConfig(),
      actorRole: 'school_admin',
    });
    expect(result.noRealNoticeSent).toBe(true);
    expect(result.noSMSSent).toBe(true);
    expect(result.noWhatsAppSent).toBe(true);
    expect(result.noEmailSent).toBe(true);
  });
});
