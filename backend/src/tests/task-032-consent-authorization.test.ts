import { describe, it, expect } from 'vitest';
import { validateTask032ConsentAuthorization } from '../services/task032CanaryConsentAuthorizationService';
import { createTask032ConsentMatrixFixture } from '../tests/fixtures/task032ApprovedCanaryFixture';

describe('Task 032 - Consent / Authorization Matrix', () => {
  it('should pass with valid consent matrix', async () => {
    const matrix = createTask032ConsentMatrixFixture();
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(true);
  });

  it('should fail with null matrix', async () => {
    const result = await validateTask032ConsentAuthorization(null);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_authorization_matrix_missing');
  });

  it('should fail if school not authorized', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), schoolAuthorized: false };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_school_not_authorized');
  });

  it('should fail if admin not approved', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), adminApproved: false };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_admin_not_approved');
  });

  it('should fail with unknown guardian policy', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), guardianPolicyStatus: 'unknown_policy' };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_guardian_policy_unknown');
  });

  it('should fail with required and missing guardian consent', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), guardianPolicyStatus: 'required_and_missing' };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_guardian_consent_missing');
  });

  it('should fail if rollback owner not assigned', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), rollbackOwnerAssigned: false };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_rollback_owner_not_assigned');
  });

  it('should fail if safeguarding contact not assigned', async () => {
    const matrix = { ...createTask032ConsentMatrixFixture(), safeguardingContactAssigned: false };
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('consent_safeguarding_contact_not_assigned');
  });

  it('should not expose raw guardian data', async () => {
    const matrix = createTask032ConsentMatrixFixture();
    const result = await validateTask032ConsentAuthorization(matrix);
    expect(result.rawGuardianDataExposed).toBe(false);
  });
});
