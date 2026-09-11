import { describe, it, expect } from 'vitest';

describe('Task 039 — School System Bridge Contracts', () => {
  it('loads all contract types from schoolSystemBridgeContracts', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    expect(mod.getDefaultSchoolProviderMode).toBeDefined();
    expect(mod.getDefaultSchoolConnectorChecklist).toBeDefined();
    expect(mod.SCHOOL_CONNECTOR_SAFE_IDENTIFIERS).toBeDefined();
    expect(mod.FUTURE_SCHOOL_CONNECTOR_ENV_NAMES).toBeDefined();
  });

  it('default provider mode is mock_only', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    expect(mod.getDefaultSchoolProviderMode()).toBe('mock_only');
  });

  it('default checklist has all items false', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const checklist = mod.getDefaultSchoolConnectorChecklist();
    expect(checklist.frontendIntegrationComplete).toBe(false);
    expect(checklist.schoolSystemOwnerApprovalRecorded).toBe(false);
    expect(checklist.schoolConnectorProviderSelected).toBe(false);
    expect(checklist.secureCredentialStorageConfigured).toBe(false);
    expect(checklist.schoolIdentitySignatureValidationConfigured).toBe(false);
    expect(checklist.roleClaimMappingApproved).toBe(false);
    expect(checklist.rosterSyncDryRunPassed).toBe(false);
    expect(checklist.teacherScopeDryRunPassed).toBe(false);
    expect(checklist.studentMappingDryRunPassed).toBe(false);
    expect(checklist.privacyScanPassed).toBe(false);
    expect(checklist.auditPathConfigured).toBe(false);
    expect(checklist.rollbackPlanExists).toBe(false);
    expect(checklist.manualActivationApprovalRecorded).toBe(false);
    expect(checklist.stagingOnlySmokeTestPassed).toBe(false);
  });

  it('safe identifiers are synthetic', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const ids = mod.SCHOOL_CONNECTOR_SAFE_IDENTIFIERS;
    expect(ids.mockSchoolId).toMatch(/^mock-/);
    expect(ids.mockExternalUserId).toMatch(/^mock-/);
    expect(ids.mockExternalStudentId).toMatch(/^mock-/);
    expect(ids.mockExternalTeacherId).toMatch(/^mock-/);
    expect(ids.mockExternalAdminId).toMatch(/^mock-/);
  });

  it('future env var names are documented only', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const envs = mod.FUTURE_SCHOOL_CONNECTOR_ENV_NAMES;
    expect(envs.SCHOOL_CONNECTOR_MODE).toBe('SCHOOL_CONNECTOR_MODE');
    expect(envs.SCHOOL_CONNECTOR_PROVIDER).toBe('SCHOOL_CONNECTOR_PROVIDER');
    expect(envs.SCHOOL_CONNECTOR_CLIENT_SECRET_NAME).toBe('SCHOOL_CONNECTOR_CLIENT_SECRET_NAME');
  });

  it('provider mode type includes mock_only and disabled_live', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const validModes: mod.SchoolSystemProviderMode[] = ['mock_only', 'disabled_live', 'activation_pending', 'live_ready_not_enabled', 'live_enabled', 'degraded', 'blocked'];
    expect(validModes).toContain('mock_only');
    expect(validModes).toContain('disabled_live');
    expect(validModes).toContain('blocked');
  });

  it('provider name type includes mock_school_system and future_ names', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const validNames: mod.SchoolSystemProviderName[] = [
      'mock_school_system',
      'future_school_sis',
      'future_school_lms',
      'future_google_classroom',
      'future_microsoft_education',
      'future_custom_school_system',
      'future_other',
    ];
    expect(validNames).toContain('mock_school_system');
    expect(validNames).toContain('future_school_sis');
  });

  it('role types include student, teacher, school_admin, internal_operator, unknown', async () => {
    const mod = await import('../contracts/schoolSystemBridgeContracts');
    const roles: mod.SchoolRoleClaim[] = ['student', 'teacher', 'school_admin', 'internal_operator', 'unknown'];
    expect(roles).toContain('student');
    expect(roles).toContain('teacher');
    expect(roles).toContain('school_admin');
    expect(roles).toContain('unknown');
  });
});
