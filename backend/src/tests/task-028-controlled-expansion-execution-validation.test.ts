import { describe, it, expect } from 'vitest';
import {
  validateTask028ExecutionContext,
  validateTask028Task027DependencyGateInput,
  validateTask028ApprovedExpansionPlanInput,
  validateTask028ControlledExpansionRunInput,
  validateTask028ExpansionStateTransitionInput,
  validateTask028ExpandedCohortActivationInput,
  validateTask028ExpandedLearnerAccessGateInput,
  validateTask028ExpandedRuntimeGuardInput,
  validateTask028TeacherOversightInput,
  validateTask028ExpansionMonitoringEventInput,
  validateTask028ExpansionHealthSnapshotInput,
  validateTask028InterventionQueueInput,
  validateTask028IncidentBridgeInput,
  validateTask028RollbackExecutionInput,
  validateTask028ExpansionEvidenceEventInput,
  validateTask028DailyExpansionSummaryInput,
  validateTask028ExpansionCompletionReviewInput,
  rejectTask028ForbiddenFields,
  redactTask028SensitiveValue,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

describe('Task 028 Controlled Expansion Execution Validation', () => {
  describe('validateTask028ExecutionContext', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExecutionContext({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'school_admin',
        schoolVerified: true,
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing schoolId', () => {
      const errors = validateTask028ExecutionContext({
        actorId: 'actor-1',
        actorRole: 'school_admin',
        schoolVerified: true,
      });
      expect(errors).toContain('schoolId_required');
    });

    it('should reject missing actorId', () => {
      const errors = validateTask028ExecutionContext({
        schoolId: 'school-1',
        actorRole: 'school_admin',
        schoolVerified: true,
      });
      expect(errors).toContain('actorId_required');
    });

    it('should reject unverified school', () => {
      const errors = validateTask028ExecutionContext({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'school_admin',
        schoolVerified: false,
      });
      expect(errors).toContain('school_not_verified');
    });

    it('should reject denied roles', () => {
      const errors = validateTask028ExecutionContext({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'unauthenticated',
        schoolVerified: true,
      });
      expect(errors).toContain('role_not_permitted');
    });

    it('should reject null input', () => {
      const errors = validateTask028ExecutionContext(null);
      expect(errors).toContain('input_required');
    });

    it('should reject forbidden fields', () => {
      const errors = validateTask028ExecutionContext({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'school_admin',
        schoolVerified: true,
        rawStudentData: 'sensitive',
      });
      expect(errors).toContain('forbidden_field_rawStudentData');
    });
  });

  describe('validateTask028Task027DependencyGateInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028Task027DependencyGateInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing proposalId', () => {
      const errors = validateTask028Task027DependencyGateInput({
        schoolId: 'school-1',
      });
      expect(errors).toContain('proposalId_required');
    });
  });

  describe('validateTask028ApprovedExpansionPlanInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ApprovedExpansionPlanInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
        governanceDecisionId: 'gov-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing governanceDecisionId', () => {
      const errors = validateTask028ApprovedExpansionPlanInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
      });
      expect(errors).toContain('governanceDecisionId_required');
    });
  });

  describe('validateTask028ControlledExpansionRunInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ControlledExpansionRunInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
        governanceDecisionId: 'gov-1',
        pilotRunId: 'pilot-1',
        approvedPlan: {},
        actorRole: 'school_admin',
        actorId: 'actor-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing pilotRunId', () => {
      const errors = validateTask028ControlledExpansionRunInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
        governanceDecisionId: 'gov-1',
        actorRole: 'school_admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('pilotRunId_required');
    });

    it('should reject denied roles', () => {
      const errors = validateTask028ControlledExpansionRunInput({
        schoolId: 'school-1',
        proposalId: 'prop-1',
        governanceDecisionId: 'gov-1',
        pilotRunId: 'pilot-1',
        approvedPlan: {},
        actorRole: 'unauthenticated',
        actorId: 'actor-1',
      });
      expect(errors).toContain('role_not_permitted_for_run');
    });
  });

  describe('validateTask028ExpansionStateTransitionInput', () => {
    it('should pass for valid transition', () => {
      const errors = validateTask028ExpansionStateTransitionInput({
        runId: 'run-1',
        fromStatus: 'draft',
        toStatus: 'preflight_pending',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject invalid transition', () => {
      const errors = validateTask028ExpansionStateTransitionInput({
        runId: 'run-1',
        fromStatus: 'draft',
        toStatus: 'completed',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('invalid_transition_draft_to_completed');
    });

    it('should reject unknown status', () => {
      const errors = validateTask028ExpansionStateTransitionInput({
        runId: 'run-1',
        fromStatus: 'draft',
        toStatus: 'unknown_status',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('unknown_status_unknown_status');
    });

    it('should reject missing runId', () => {
      const errors = validateTask028ExpansionStateTransitionInput({
        fromStatus: 'draft',
        toStatus: 'preflight_pending',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('runId_required');
    });
  });

  describe('validateTask028ExpandedCohortActivationInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExpandedCohortActivationInput({
        runId: 'run-1',
        schoolId: 'school-1',
        cohortIds: ['cohort-1'],
        learnerSafeRefs: ['learner-1'],
      });
      expect(errors).toEqual([]);
    });

    it('should reject empty cohortIds', () => {
      const errors = validateTask028ExpandedCohortActivationInput({
        runId: 'run-1',
        schoolId: 'school-1',
        cohortIds: [],
        learnerSafeRefs: ['learner-1'],
      });
      expect(errors).toContain('cohortIds_required');
    });

    it('should reject too many cohorts', () => {
      const errors = validateTask028ExpandedCohortActivationInput({
        runId: 'run-1',
        schoolId: 'school-1',
        cohortIds: Array.from({ length: 51 }, (_, i) => `c-${i}`),
        learnerSafeRefs: ['learner-1'],
      });
      expect(errors).toContain('cohort_set_too_large_no_school_wide');
    });
  });

  describe('validateTask028ExpandedLearnerAccessGateInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExpandedLearnerAccessGateInput({
        schoolId: 'school-1',
        learnerId: 'learner-1',
        runId: 'run-1',
        requestType: 'session_start',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing requestType', () => {
      const errors = validateTask028ExpandedLearnerAccessGateInput({
        schoolId: 'school-1',
        learnerId: 'learner-1',
        runId: 'run-1',
      });
      expect(errors).toContain('requestType_required');
    });
  });

  describe('validateTask028ExpandedRuntimeGuardInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExpandedRuntimeGuardInput({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'school_admin',
        runId: 'run-1',
        action: 'start_session',
      });
      expect(errors).toEqual([]);
    });

    it('should reject denied roles', () => {
      const errors = validateTask028ExpandedRuntimeGuardInput({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'parent',
        runId: 'run-1',
        action: 'start_session',
      });
      expect(errors).toContain('role_not_permitted');
    });

    it('should reject missing action', () => {
      const errors = validateTask028ExpandedRuntimeGuardInput({
        schoolId: 'school-1',
        actorId: 'actor-1',
        actorRole: 'school_admin',
        runId: 'run-1',
      });
      expect(errors).toContain('action_required');
    });
  });

  describe('validateTask028TeacherOversightInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028TeacherOversightInput({
        runId: 'run-1',
        schoolId: 'school-1',
        teacherId: 'teacher-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing teacherId', () => {
      const errors = validateTask028TeacherOversightInput({
        runId: 'run-1',
        schoolId: 'school-1',
      });
      expect(errors).toContain('teacherId_required');
    });
  });

  describe('validateTask028ExpansionMonitoringEventInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExpansionMonitoringEventInput({
        runId: 'run-1',
        schoolId: 'school-1',
        eventType: 'expansion_preflight_passed',
        actorRole: 'admin',
        actorId: 'actor-1',
        safeSummary: 'Preflight passed',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing safeSummary', () => {
      const errors = validateTask028ExpansionMonitoringEventInput({
        runId: 'run-1',
        schoolId: 'school-1',
        eventType: 'expansion_preflight_passed',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('safeSummary_required');
    });
  });

  describe('validateTask028IncidentBridgeInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028IncidentBridgeInput({
        runId: 'run-1',
        schoolId: 'school-1',
        severity: 'high',
        safeSummary: 'Incident occurred',
      });
      expect(errors).toEqual([]);
    });

    it('should reject unknown severity', () => {
      const errors = validateTask028IncidentBridgeInput({
        runId: 'run-1',
        schoolId: 'school-1',
        severity: 'unknown',
        safeSummary: 'Incident',
      });
      expect(errors).toContain('unknown_severity_unknown');
    });

    it('should reject missing severity', () => {
      const errors = validateTask028IncidentBridgeInput({
        runId: 'run-1',
        schoolId: 'school-1',
        safeSummary: 'Incident',
      });
      expect(errors).toContain('severity_required');
    });
  });

  describe('validateTask028RollbackExecutionInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028RollbackExecutionInput({
        runId: 'run-1',
        schoolId: 'school-1',
        actorRole: 'admin',
        actorId: 'actor-1',
        reason: 'Critical issue',
      });
      expect(errors).toEqual([]);
    });

    it('should reject missing reason', () => {
      const errors = validateTask028RollbackExecutionInput({
        runId: 'run-1',
        schoolId: 'school-1',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toContain('reason_required');
    });
  });

  describe('validateTask028ExpansionEvidenceEventInput', () => {
    it('should pass for valid input', () => {
      const errors = validateTask028ExpansionEvidenceEventInput({
        runId: 'run-1',
        schoolId: 'school-1',
        eventType: 'expanded_access_allowed',
        actorRole: 'admin',
        actorId: 'actor-1',
      });
      expect(errors).toEqual([]);
    });

    it('should reject forbidden fields in safeMetadata', () => {
      const errors = validateTask028ExpansionEvidenceEventInput({
        runId: 'run-1',
        schoolId: 'school-1',
        eventType: 'expanded_access_allowed',
        actorRole: 'admin',
        actorId: 'actor-1',
        safeMetadata: { rawStudentData: 'private' },
      });
      expect(errors).toContain('forbidden_field_rawStudentData');
    });
  });

  describe('rejectTask028ForbiddenFields', () => {
    it('should detect forbidden fields', () => {
      const errors: string[] = [];
      rejectTask028ForbiddenFields({ rawStudentData: 'x', safeField: 'ok' }, errors);
      expect(errors).toContain('forbidden_field_rawStudentData');
      expect(errors).not.toContain('forbidden_field_safeField');
    });

    it('should handle null gracefully', () => {
      const errors: string[] = [];
      rejectTask028ForbiddenFields(null, errors);
      expect(errors).toEqual([]);
    });
  });

  describe('redactTask028SensitiveValue', () => {
    it('should redact long strings keeping first and last two chars', () => {
      const redacted = redactTask028SensitiveValue('hello-world');
      expect(redacted).toBe('he****ld');
    });

    it('should redact short strings entirely', () => {
      expect(redactTask028SensitiveValue('abc')).toBe('****');
    });

    it('should handle non-string values', () => {
      expect(redactTask028SensitiveValue(12345)).toBe('12345');
    });
  });

  describe('createSafeTask028ValidationError', () => {
    it('should create a safe error response', () => {
      const error = createSafeTask028ValidationError('Validation failed', ['field_required']);
      expect(error.ok).toBe(false);
      expect(error.safeMessage).toBe('Validation failed');
      expect(error.reasonCodes).toEqual(['field_required']);
    });
  });
});
