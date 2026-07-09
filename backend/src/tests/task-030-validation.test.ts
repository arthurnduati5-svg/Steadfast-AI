import { describe, it, expect } from 'vitest';
import {
  validateTask030Task029DependencyProof,
  validateTask030StagingEnvironmentGateInput,
  validateTask030SyntheticSchoolFixture,
  validateTask030SyntheticCohortFixture,
  validateTask030RoleTokenMatrix,
  validateTask030RehearsalRunInput,
  validateTask030JourneyInput,
  validateTask030OperationsConsoleRehearsalInput,
  validateTask030ControlActionRehearsalInput,
  validateTask030RollbackDrillInput,
  validateTask030StaffTrainingPackInput,
  validateTask030ReportInput,
  rejectTask030ForbiddenFields,
  redactTask030SensitiveValue,
  createSafeTask030ValidationError,
} from '../lib/task030ControlledStagingRehearsalValidation';

describe('Task 030 - Validation Functions', () => {
  describe('validateTask030Task029DependencyProof', () => {
    it('should pass with valid input', () => {
      const result = validateTask030Task029DependencyProof({
        ok: true,
        reportFound: true,
        safeToStartTask030: true,
        finalDecision: 'TASK_029_PASS_SAFE_TO_START_TASK_030',
        blockingIssuesEmpty: true,
        remainingBlockers: [],
      });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when ok is not true', () => {
      const result = validateTask030Task029DependencyProof({
        ok: false,
        reportFound: true,
        safeToStartTask030: true,
        finalDecision: 'PASS',
        blockingIssuesEmpty: true,
        remainingBlockers: [],
      });
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTask030StagingEnvironmentGateInput', () => {
    it('should pass with valid staging input', () => {
      const result = validateTask030StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
      });
      expect(result.ok).toBe(true);
    });

    it('should fail with production environment type', () => {
      const result = validateTask030StagingEnvironmentGateInput({
        environmentType: 'production',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
      });
      expect(result.ok).toBe(false);
    });

    it('should fail with live data mode', () => {
      const result = validateTask030StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'live',
        executionMode: 'dry_run',
      });
      expect(result.ok).toBe(false);
    });

    it('should fail when productionDeploymentRequested is true', () => {
      const result = validateTask030StagingEnvironmentGateInput({
        environmentType: 'staging',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
        productionDeploymentRequested: true,
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030SyntheticSchoolFixture', () => {
    it('should pass with valid synthetic fixture', () => {
      const result = validateTask030SyntheticSchoolFixture({
        schoolId: 'synthetic_school_001',
        adminId: 'admin_001',
        operatorId: 'op_001',
        teacherIds: ['t1'],
        learnerIds: ['l1'],
        parentIds: ['p1'],
        classIds: ['c1'],
        subjectIds: ['s1'],
        cohortIds: ['co1'],
        approvedCurriculumSource: 'cambridge',
      });
      expect(result.ok).toBe(true);
    });

    it('should fail when schoolId does not start with synthetic_', () => {
      const result = validateTask030SyntheticSchoolFixture({
        schoolId: 'real_school_001',
        adminId: 'admin_001',
        operatorId: 'op_001',
        teacherIds: ['t1'],
        learnerIds: ['l1'],
        parentIds: [],
        classIds: [],
        subjectIds: [],
        cohortIds: [],
        approvedCurriculumSource: 'cambridge',
      });
      expect(result.ok).toBe(false);
    });

    it('should fail when teacherIds is empty', () => {
      const result = validateTask030SyntheticSchoolFixture({
        schoolId: 'synthetic_school_001',
        adminId: 'admin_001',
        operatorId: 'op_001',
        teacherIds: [],
        learnerIds: ['l1'],
        parentIds: [],
        classIds: [],
        subjectIds: [],
        cohortIds: [],
        approvedCurriculumSource: 'cambridge',
      });
      expect(result.ok).toBe(false);
    });

    it('should reject email patterns in schoolId', () => {
      const result = validateTask030SyntheticSchoolFixture({
        schoolId: 'synthetic_student@school.edu',
        adminId: 'admin_001',
        operatorId: 'op_001',
        teacherIds: ['t1'],
        learnerIds: ['l1'],
        parentIds: [],
        classIds: [],
        subjectIds: [],
        cohortIds: [],
        approvedCurriculumSource: 'cambridge',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030SyntheticCohortFixture', () => {
    it('should pass with valid input', () => {
      const result = validateTask030SyntheticCohortFixture({
        cohortId: 'cohort_001',
        schoolId: 'school_001',
        className: 'Math 101',
        subjectName: 'Mathematics',
        learnerCount: 10,
        teacherCount: 1,
        safeCohortLabel: 'Safe Cohort A',
      });
      expect(result.ok).toBe(true);
    });

    it('should fail with zero learner count', () => {
      const result = validateTask030SyntheticCohortFixture({
        cohortId: 'cohort_001',
        schoolId: 'school_001',
        className: 'Math 101',
        subjectName: 'Mathematics',
        learnerCount: 0,
        teacherCount: 1,
        safeCohortLabel: 'Safe Cohort A',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030RoleTokenMatrix', () => {
    it('should pass with valid matrix', () => {
      const result = validateTask030RoleTokenMatrix({
        matrixId: 'matrix_001',
        tokens: [{
          syntheticRole: 'synthetic_admin',
          token: 'task030_synthetic_token_admin_000001',
          actorIdHash: 'actor_admin_hash',
          permissions: { canViewConsole: true },
        }],
      });
      expect(result.ok).toBe(true);
    });

    it('should fail when token does not start with task030_synthetic_token_', () => {
      const result = validateTask030RoleTokenMatrix({
        matrixId: 'matrix_001',
        tokens: [{
          syntheticRole: 'synthetic_admin',
          token: 'bad_token',
          actorIdHash: 'actor_admin_hash',
          permissions: { canViewConsole: true },
        }],
      });
      expect(result.ok).toBe(false);
    });

    it('should fail when tokens array is empty', () => {
      const result = validateTask030RoleTokenMatrix({
        matrixId: 'matrix_001',
        tokens: [],
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030RehearsalRunInput', () => {
    it('should pass with valid run input', () => {
      const result = validateTask030RehearsalRunInput({
        runId: 'run_001',
        schoolId: 'school_001',
        environmentType: 'staging',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
      });
      expect(result.ok).toBe(true);
    });

    it('should fail with invalid environment', () => {
      const result = validateTask030RehearsalRunInput({
        runId: 'run_001',
        schoolId: 'school_001',
        environmentType: 'production',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
      });
      expect(result.ok).toBe(false);
    });

    it('should fail with invalid status', () => {
      const result = validateTask030RehearsalRunInput({
        runId: 'run_001',
        schoolId: 'school_001',
        environmentType: 'staging',
        dataMode: 'synthetic',
        executionMode: 'dry_run',
        status: 'nonexistent_status',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030JourneyInput', () => {
    it('should pass with valid journey input', () => {
      const result = validateTask030JourneyInput({
        runId: 'run_001',
        syntheticRole: 'synthetic_admin',
        schoolId: 'school_001',
      });
      expect(result.ok).toBe(true);
    });

    it('should fail with missing runId', () => {
      const result = validateTask030JourneyInput({
        syntheticRole: 'synthetic_admin',
        schoolId: 'school_001',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030OperationsConsoleRehearsalInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask030OperationsConsoleRehearsalInput({ runId: 'run_001', schoolId: 'school_001' });
      expect(result.ok).toBe(true);
    });

    it('should fail with missing schoolId', () => {
      const result = validateTask030OperationsConsoleRehearsalInput({ runId: 'run_001' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030ControlActionRehearsalInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask030ControlActionRehearsalInput({ runId: 'run_001', schoolId: 'school_001', actionId: 'pause' });
      expect(result.ok).toBe(true);
    });

    it('should fail with missing actionId', () => {
      const result = validateTask030ControlActionRehearsalInput({ runId: 'run_001', schoolId: 'school_001' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030RollbackDrillInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask030RollbackDrillInput({ runId: 'run_001', schoolId: 'school_001' });
      expect(result.ok).toBe(true);
    });

    it('should fail with empty runId', () => {
      const result = validateTask030RollbackDrillInput({ runId: '', schoolId: 'school_001' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030StaffTrainingPackInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask030StaffTrainingPackInput({ runId: 'run_001', schoolId: 'school_001' });
      expect(result.ok).toBe(true);
    });

    it('should fail with missing runId', () => {
      const result = validateTask030StaffTrainingPackInput({ schoolId: 'school_001' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask030ReportInput', () => {
    it('should pass with valid input', () => {
      const result = validateTask030ReportInput({ runId: 'run_001', schoolId: 'school_001' });
      expect(result.ok).toBe(true);
    });

    it('should fail with missing schoolId', () => {
      const result = validateTask030ReportInput({ runId: 'run_001' });
      expect(result.ok).toBe(false);
    });
  });

  describe('rejectTask030ForbiddenFields', () => {
    it('should detect forbidden fields in an object', () => {
      const result = rejectTask030ForbiddenFields({ rawStudentData: 'leaked', ok: true });
      expect(result).toContain('rawStudentData');
    });

    it('should return empty array for safe objects', () => {
      const result = rejectTask030ForbiddenFields({ ok: true, data: 'safe' });
      expect(result).toHaveLength(0);
    });
  });

  describe('redactTask030SensitiveValue', () => {
    it('should redact email addresses', () => {
      const result = redactTask030SensitiveValue('contact me at student@school.edu');
      expect(result).toContain('[REDACTED_EMAIL]');
    });

    it('should short-circuit for very short strings', () => {
      const result = redactTask030SensitiveValue('ab');
      expect(result).toBe('redacted');
    });
  });

  describe('createSafeTask030ValidationError', () => {
    it('should create a safe error envelope', () => {
      const result = createSafeTask030ValidationError('Invalid input', ['invalid_input']);
      expect(result.ok).toBe(false);
      expect(result.error.title).toBe('Invalid input');
      expect(result.error.reasonCodes).toContain('invalid_input');
    });
  });
});
