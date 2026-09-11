import { describe, it, expect } from 'vitest';

describe('Task 039 — School Connector Activation Guard', () => {
  it('default check blocks live connector', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const result = guard.checkSchoolConnectorActivationReadiness();
    expect(result.allowed).toBe(false);
    expect(result.activationState).toBe('blocked');
    expect(result.blockedReasons.length).toBeGreaterThan(0);
  });

  it('live_enabled mode is explicitly blocked', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const result = guard.checkSchoolConnectorActivationReadiness('live_enabled');
    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain('Live school connector mode is not allowed in Task 039');
  });

  it('mock_only mode is not live enabled', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const result = guard.checkSchoolConnectorActivationReadiness('mock_only');
    expect(result.allowed).toBe(false); // still blocked by future gates
  });

  it('getTask039ActivationState returns mock_only', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const result = guard.getTask039ActivationState();
    expect(result.activationState).toBe('mock_only');
    expect(result.ready).toBe(true);
  });

  it('isLiveSchoolConnectorAllowedByGuard returns false', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const allowed = guard.isLiveSchoolConnectorAllowedByGuard();
    expect(allowed).toBe(false);
  });

  it('checklist with all items false blocks activation', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const contracts = await import('../contracts/schoolSystemBridgeContracts');
    const checklist = contracts.getDefaultSchoolConnectorChecklist();
    const result = guard.checkChecklistAgainstActivationGates(checklist);
    expect(result.allowed).toBe(false);
    expect(result.activationState).toBe('blocked');
  });

  it('checklist with all items true allows activation', async () => {
    const guard = await import('../services/schoolConnectorActivationGuard');
    const result = guard.checkChecklistAgainstActivationGates({
      frontendIntegrationComplete: true,
      schoolSystemOwnerApprovalRecorded: true,
      schoolConnectorProviderSelected: true,
      secureCredentialStorageConfigured: true,
      schoolIdentitySignatureValidationConfigured: true,
      roleClaimMappingApproved: true,
      rosterSyncDryRunPassed: true,
      teacherScopeDryRunPassed: true,
      studentMappingDryRunPassed: true,
      privacyScanPassed: true,
      auditPathConfigured: true,
      rollbackPlanExists: true,
      manualActivationApprovalRecorded: true,
      stagingOnlySmokeTestPassed: true,
    });
    expect(result.ready).toBe(true);
    expect(result.allowed).toBe(true);
    expect(result.activationState).toBe('live_ready_not_enabled');
  });
});
