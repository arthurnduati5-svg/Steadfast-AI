import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — School Context Verification Service', () => {
  it('verifies valid school identity', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'student',
      externalStudentId: 'stu-001',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(true);
    expect(result.verificationStatus).toBe('verified');
    expect(result.schoolId).toBe('school-001');
    expect(result.externalUserId).toBe('ext-user-001');
  });

  it('blocks missing school ID', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: '',
      role: 'student',
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_missing_school');
  });

  it('blocks missing user ID', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: '',
      schoolId: 'school-001',
      role: 'student',
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_missing_user');
  });

  it('blocks missing role', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: '',
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_missing_role');
  });

  it('blocks invalid role', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'invalid_role_xyz',
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_invalid_role');
  });

  it('blocks expired identity', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(false);
    expect(result.verificationStatus).toBe('blocked_expired_identity');
  });

  it('allows future expiry', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'teacher',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(true);
    expect(result.verificationStatus).toBe('verified');
  });

  it('verifies mock payload', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const payload = svc.getMockVerifiedSchoolPayload();
    expect(payload.schoolId).toBeTruthy();
    expect(payload.externalUserId).toBeTruthy();
    expect(payload.role).toBe('student');
    const result = svc.verifyExternalSchoolIdentity(payload);
    expect(result.verified).toBe(true);
    expect(result.verificationStatus).toBe('verified');
  });

  it('isSchoolIdentityVerified type guard works', async () => {
    const svc = await import('../services/schoolContextVerificationService');
    const validPayload = svc.getMockVerifiedSchoolPayload();
    const validResult = svc.verifyExternalSchoolIdentity(validPayload);
    expect(svc.isSchoolIdentityVerified(validResult)).toBe(true);

    const invalidPayload: ExternalSchoolIdentityPayload = {
      externalUserId: '',
      schoolId: '',
      role: '',
    };
    const invalidResult = svc.verifyExternalSchoolIdentity(invalidPayload);
    expect(svc.isSchoolIdentityVerified(invalidResult)).toBe(false);
  });
});
