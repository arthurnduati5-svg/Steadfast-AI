import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — Role Scope Boundary Contract', () => {
  const makeStudentPayload = (): ExternalSchoolIdentityPayload => ({
    externalUserId: 'ext-stu-001',
    schoolId: 'school-001',
    role: 'student',
    externalStudentId: 'stu-001',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  });

  const makeTeacherPayload = (): ExternalSchoolIdentityPayload => ({
    externalUserId: 'ext-tch-001',
    schoolId: 'school-001',
    role: 'teacher',
    externalTeacherId: 'tch-001',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  });

  const makeAdminPayload = (): ExternalSchoolIdentityPayload => ({
    externalUserId: 'ext-adm-001',
    schoolId: 'school-001',
    role: 'school_admin',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  });

  it('teacher cannot access unrelated students', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeTeacherPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], ['stu-001']);

    const check = scopeSvc.verifyStudentInTeacherScope(scope, 'stu-999');
    expect(check.allowed).toBe(false);
  });

  it('teacher cannot access unrelated classes', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeTeacherPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], []);

    const check = scopeSvc.verifyClassInTeacherScope(scope, 'class-999');
    expect(check.allowed).toBe(false);
  });

  it('student cannot map to teacher scope', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeStudentPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], []);
    expect(scope.scopeDecision).toBe('blocked_not_teacher');
  });

  it('student cannot map to admin scope', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeStudentPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);
    expect(scope.scopeDecision).toBe('blocked_not_school_admin');
  });

  it('student cannot access admin secret visibility', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeAdminPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);

    const secretCheck = adminSvc.verifyAdminSecretVisibility(scope);
    expect(secretCheck.allowed).toBe(false);

    const privateCheck = adminSvc.verifyAdminRawPrivateDataVisibility(scope);
    expect(privateCheck.allowed).toBe(false);
  });

  it('admin cannot access secrets or raw private data', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeAdminPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);

    const secretCheck = adminSvc.verifyAdminSecretVisibility(scope);
    expect(secretCheck.allowed).toBe(false);
    expect(secretCheck.reasonCodes).toContain('admin_secret_visibility_blocked');

    const privateCheck = adminSvc.verifyAdminRawPrivateDataVisibility(scope);
    expect(privateCheck.allowed).toBe(false);
    expect(privateCheck.reasonCodes).toContain('admin_raw_private_data_visibility_blocked');
  });

  it('teacher can access own students and classes', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeTeacherPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], ['stu-001', 'stu-002']);

    expect(scopeSvc.verifyStudentInTeacherScope(scope, 'stu-001').allowed).toBe(true);
    expect(scopeSvc.verifyStudentInTeacherScope(scope, 'stu-002').allowed).toBe(true);
    expect(scopeSvc.verifyStudentInTeacherScope(scope, 'stu-003').allowed).toBe(false);
    expect(scopeSvc.verifyClassInTeacherScope(scope, 'class-001').allowed).toBe(true);
    expect(scopeSvc.verifyClassInTeacherScope(scope, 'class-002').allowed).toBe(false);
  });

  it('admin scope is restricted to own school', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload = makeAdminPayload();
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);

    expect(adminSvc.verifyAdminSchoolScope(scope, 'school-001').allowed).toBe(true);
    expect(adminSvc.verifyAdminSchoolScope(scope, 'school-002').allowed).toBe(false);
  });
});
