import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — Teacher Scope Mapping Service', () => {
  it('maps verified teacher identity to class/subject scope', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-tch-001',
      schoolId: 'school-001',
      role: 'teacher',
      externalTeacherId: 'tch-001',
      classId: 'class-001',
      subjectId: 'sub-001',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], ['stu-001', 'stu-002']);
    expect(scope.scopeDecision).toBe('scope_verified');
    expect(scope.allowedClassIds).toContain('class-001');
    expect(scope.allowedSubjectIds).toContain('sub-001');
    expect(scope.allowedStudentIds).toContain('stu-001');
  });

  it('blocks when identity is not verified', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: '',
      schoolId: '',
      role: '',
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], []);
    expect(scope.scopeDecision).toBe('blocked_missing_verified_identity');
  });

  it('blocks when user is not teacher', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-user-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], []);
    expect(scope.scopeDecision).toBe('blocked_not_teacher');
  });

  it('blocks when no class scope defined', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-tch-001',
      schoolId: 'school-001',
      role: 'teacher',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);

    const scope = scopeSvc.mapTeacherScope(payload, verification, [], ['sub-001'], []);
    expect(scope.scopeDecision).toBe('blocked_no_class_scope');
  });

  it('verifies student in teacher scope', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-tch-001',
      schoolId: 'school-001',
      role: 'teacher',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], ['stu-001']);

    const check = scopeSvc.verifyStudentInTeacherScope(scope, 'stu-001');
    expect(check.allowed).toBe(true);

    const blocked = scopeSvc.verifyStudentInTeacherScope(scope, 'stu-999');
    expect(blocked.allowed).toBe(false);
  });

  it('verifies class in teacher scope', async () => {
    const scopeSvc = await import('../services/teacherScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-tch-001',
      schoolId: 'school-001',
      role: 'teacher',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = scopeSvc.mapTeacherScope(payload, verification, ['class-001'], ['sub-001'], []);

    const check = scopeSvc.verifyClassInTeacherScope(scope, 'class-001');
    expect(check.allowed).toBe(true);

    const blocked = scopeSvc.verifyClassInTeacherScope(scope, 'class-999');
    expect(blocked.allowed).toBe(false);
  });
});
