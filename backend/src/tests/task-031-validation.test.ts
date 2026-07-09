import { describe, it, expect } from 'vitest';
import {
  validateTask031Task030DependencyProof,
  validateTask031StagingEnvironmentGateInput,
  validateTask031SyntheticStagingSchoolFixture,
  validateTask031SmokeRunInput,
  rejectTask031ForbiddenFields,
  redactTask031SensitiveValue,
} from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - Validation Library', () => {
  describe('validateTask031Task030DependencyProof', () => {
    it('should pass with valid proof', () => {
      const result = validateTask031Task030DependencyProof({
        ok: true,
        reportFound: true,
        safeToStartTask031: true,
        blockingIssues: [],
      });
      expect(result.valid).toBe(true);
      expect(result.reasonCodes).toEqual([]);
    });

    it('should fail when input is null', () => {
      const result = validateTask031Task030DependencyProof(null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('input_is_null');
    });

    it('should fail when ok is false', () => {
      const result = validateTask031Task030DependencyProof({
        ok: false,
        reportFound: true,
        safeToStartTask031: true,
        blockingIssues: [],
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('task030_proof_not_ok');
    });

    it('should fail when reportFound is false', () => {
      const result = validateTask031Task030DependencyProof({
        ok: true,
        reportFound: false,
        safeToStartTask031: true,
        blockingIssues: [],
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('task030_report_not_found');
    });

    it('should fail when safeToStartTask031 is false', () => {
      const result = validateTask031Task030DependencyProof({
        ok: true,
        reportFound: true,
        safeToStartTask031: false,
        blockingIssues: [],
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('task030_safe_to_start_task_031_not_true');
    });

    it('should fail when blockingIssues is not empty', () => {
      const result = validateTask031Task030DependencyProof({
        ok: true,
        reportFound: true,
        safeToStartTask031: true,
        blockingIssues: ['some_issue'],
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('task030_blocking_issues_not_empty');
    });
  });

  describe('validateTask031StagingEnvironmentGateInput', () => {
    it('should pass with valid staging input', () => {
      const result = validateTask031StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'synthetic',
        executionMode: 'smoke_check',
        canaryMode: 'readiness_only',
      });
      expect(result.valid).toBe(true);
      expect(result.reasonCodes).toEqual([]);
    });

    it('should fail when input is null', () => {
      const result = validateTask031StagingEnvironmentGateInput(null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('input_is_null');
    });

    it('should fail with production environment type', () => {
      const result = validateTask031StagingEnvironmentGateInput({
        environmentType: 'production',
        dataMode: 'synthetic',
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_environment_type_production');
    });

    it('should fail with live data mode', () => {
      const result = validateTask031StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'live',
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_data_mode_live');
    });

    it('should fail when productionDeploymentRequested is true', () => {
      const result = validateTask031StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'synthetic',
        productionDeploymentRequested: true,
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('production_deployment_requested');
    });

    it('should fail when liveStudentAccessRequested is true', () => {
      const result = validateTask031StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'synthetic',
        liveStudentAccessRequested: true,
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('live_student_access_requested');
    });
  });

  describe('validateTask031SyntheticStagingSchoolFixture', () => {
    it('should pass with valid fixture', () => {
      const result = validateTask031SyntheticStagingSchoolFixture({
        schoolId: 'school_task031_staging_safe',
        tenantId: 'tenant_task031_staging_safe',
        embedId: 'embed_task031_staging_safe',
        handoffId: 'handoff_task031_staging_safe',
      });
      expect(result.valid).toBe(true);
      expect(result.reasonCodes).toEqual([]);
    });

    it('should fail when input is null', () => {
      const result = validateTask031SyntheticStagingSchoolFixture(null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('input_is_null');
    });

    it('should fail when missing required fields', () => {
      const result = validateTask031SyntheticStagingSchoolFixture({
        schoolId: 'school_task031_staging_safe',
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('missing_tenantId');
      expect(result.reasonCodes).toContain('missing_embedId');
      expect(result.reasonCodes).toContain('missing_handoffId');
    });
  });

  describe('validateTask031SmokeRunInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask031SmokeRunInput({
        schoolId: 'school_task031_staging_safe',
        actorId: 'admin_hash_task031_safe',
        actorRole: 'admin',
      });
      expect(result.valid).toBe(true);
      expect(result.reasonCodes).toEqual([]);
    });

    it('should fail when input is null', () => {
      const result = validateTask031SmokeRunInput(null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('input_is_null');
    });

    it('should fail with denied actor role', () => {
      const result = validateTask031SmokeRunInput({
        schoolId: 'school_task031_staging_safe',
        actorId: 'student_hash_task031_safe',
        actorRole: 'student',
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('denied_actor_role_student');
    });

    it('should fail with missing fields', () => {
      const result = validateTask031SmokeRunInput({
        schoolId: 'school_task031_staging_safe',
      });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('missing_actorId');
      expect(result.reasonCodes).toContain('missing_actorRole');
    });
  });

  describe('rejectTask031ForbiddenFields', () => {
    it('should pass when no forbidden fields present', () => {
      const result = rejectTask031ForbiddenFields({ ok: true, status: 'passed' });
      expect(result.valid).toBe(true);
    });

    it('should fail when rawPayload is present', () => {
      const result = rejectTask031ForbiddenFields({ rawPayload: 'some data' });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_field_rawPayload');
    });

    it('should fail when secrets is present', () => {
      const result = rejectTask031ForbiddenFields({ secrets: 'secret-key' });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_field_secrets');
    });

    it('should fail when studentPrivateData is present', () => {
      const result = rejectTask031ForbiddenFields({ studentPrivateData: 'private info' });
      expect(result.valid).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_field_studentPrivateData');
    });
  });

  describe('redactTask031SensitiveValue', () => {
    it('should redact email addresses', () => {
      const result = redactTask031SensitiveValue('contact me at student@school.com');
      expect(result).toBe('contact me at redacted@email.local');
    });

    it('should redact phone numbers', () => {
      const result = redactTask031SensitiveValue('call +1234567890 now');
      expect(result).toContain('REDACTED');
    });

    it('should redact Bearer tokens', () => {
      const result = redactTask031SensitiveValue('Authorization: Bearer sk-proj-abc123');
      expect(result).toContain('Bearer REDACTED');
    });

    it('should return empty string when value is empty', () => {
      expect(redactTask031SensitiveValue('')).toBe('');
    });

    it('should redact sk-proj- keys', () => {
      const result = redactTask031SensitiveValue('sk-proj-my-secret-key-here');
      expect(result).toBe('sk-proj-REDACTED');
    });
  });
});