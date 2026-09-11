import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — No Tutor Before School Context Contract', () => {
  it('tutor learner mapping requires verified school context', async () => {
    const mappingSvc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: '', schoolId: '', role: '' };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const result = mappingSvc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('blocked_missing_verified_identity');
  });

  it('teacher scope mapping requires verified school context', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: '', schoolId: '', role: '' };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, [], [], []);
    expect(scope.scopeDecision).toBe('blocked_missing_verified_identity');
  });

  it('admin scope mapping requires verified school context', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: '', schoolId: '', role: '' };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);
    expect(scope.scopeDecision).toBe('blocked_missing_verified_identity');
  });

  it('missing school context blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: 'ext-001', schoolId: '', role: 'student' };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_missing_school');
  });

  it('expired identity blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_expired_identity');
  });

  it('revoked identity blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() - 86400000 * 365).toISOString(),
    };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
  });

  it('invalid role blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-001',
      schoolId: 'school-001',
      role: 'invalid_role',
    };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_invalid_role');
  });

  it('missing user ID blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: '', schoolId: 'school-001', role: 'student' };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
  });

  it('missing role blocks tutor context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: 'ext-001', schoolId: 'school-001', role: '' };
    const result = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
  });

  it('tenant mismatch can be identified through school context', async () => {
    const verifySvc = await import('../services/schoolContextVerificationService');
    const mappingSvc = await import('../services/tutorLearnerMappingService');
    const payload1: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-001',
      schoolId: 'school-001',
      role: 'student',
      externalStudentId: 'stu-001',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const payload2: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-001',
      schoolId: 'school-002',
      role: 'student',
      externalStudentId: 'stu-001',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification1 = verifySvc.verifyExternalSchoolIdentity(payload1);
    expect(verification1.verified).toBe(true);
    expect(verification1.schoolId).toBe('school-001');

    const verification2 = verifySvc.verifyExternalSchoolIdentity(payload2);
    expect(verification2.verified).toBe(true);
    expect(verification2.schoolId).toBe('school-002');

    mappingSvc.clearMappingStore();
  });

  it('verified school identity enables learner mapping', async () => {
    const mappingSvc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = verifySvc.getMockVerifiedSchoolPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    expect(verification.verified).toBe(true);
    const result = mappingSvc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('mapped_created_dry_run');
    mappingSvc.clearMappingStore();
  });
});
