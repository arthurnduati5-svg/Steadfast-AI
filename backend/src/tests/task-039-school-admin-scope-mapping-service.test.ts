import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — School Admin Scope Mapping Service', () => {
  it('maps verified school admin to school-level scope', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-adm-001',
      schoolId: 'school-001',
      role: 'school_admin',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);
    expect(scope.scopeDecision).toBe('admin_scope_verified');
    expect(scope.allowedSchoolIds).toContain('school-001');
  });

  it('blocks when identity not verified', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = { externalUserId: '', schoolId: '', role: '' };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);
    expect(scope.scopeDecision).toBe('blocked_missing_verified_identity');
  });

  it('blocks when user is not admin', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-stu-001',
      schoolId: 'school-001',
      role: 'student',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);
    expect(scope.scopeDecision).toBe('blocked_not_school_admin');
  });

  it('verifies admin school scope', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-adm-001',
      schoolId: 'school-001',
      role: 'school_admin',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);

    const check = adminSvc.verifyAdminSchoolScope(scope, 'school-001');
    expect(check.allowed).toBe(true);

    const blocked = adminSvc.verifyAdminSchoolScope(scope, 'school-999');
    expect(blocked.allowed).toBe(false);
  });

  it('blocks admin from accessing secrets', async () => {
    const adminSvc = await import('../services/schoolAdminScopeMappingService');
    const verifySvc = await import('../services/schoolContextVerificationService');
    const payload: ExternalSchoolIdentityPayload = {
      externalUserId: 'ext-adm-001',
      schoolId: 'school-001',
      role: 'school_admin',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    const verification = verifySvc.verifyExternalSchoolIdentity(payload);
    const scope = adminSvc.mapSchoolAdminScope(payload, verification);

    const secretCheck = adminSvc.verifyAdminSecretVisibility(scope);
    expect(secretCheck.allowed).toBe(false);

    const privateCheck = adminSvc.verifyAdminRawPrivateDataVisibility(scope);
    expect(privateCheck.allowed).toBe(false);
  });
});
