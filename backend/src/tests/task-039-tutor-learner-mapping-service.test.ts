import { describe, it, expect, beforeEach } from 'vitest';
import type { ExternalSchoolIdentityPayload, SchoolContextVerificationResult } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — Tutor Learner Mapping Service', () => {
  beforeEach(async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    svc.clearMappingStore();
  });

  it('maps verified student identity to tutor learner', async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = verifySvc.getMockVerifiedSchoolPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const result = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('mapped_created_dry_run');
    expect(result.tutorLearnerId).toBeTruthy();
    expect(result.externalStudentId).toBeTruthy();
    expect(result.schoolId).toBeTruthy();
  });

  it('blocks mapping when identity is not verified', async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: '',
      schoolId: '',
      role: '',
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const result = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('blocked_missing_verified_identity');
  });

  it('blocks mapping when user is not student', async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'teacher',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const result = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('blocked_not_student');
  });

  it('detects duplicate external student mapping', async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = verifySvc.getMockVerifiedSchoolPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const first = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(first.decision).toBe('mapped_created_dry_run');

    const second = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(second.decision).toBe('mapped_existing');
  });

  it('handles missing external student ID', async () => {
    const svc = await import('../services/tutorLearnerMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const result = svc.mapExternalStudentToTutorLearner(payload, verification);
    expect(result.decision).toBe('blocked_conflict');
  });
});
