import { describe, it, expect } from 'vitest';
import {
  validateTask026ExecutionContext, validateTask026DependencyGateInput,
  validateTask026ControlledPilotRunInput, validateTask026ExecutionStateTransition,
  validateTask026ExecutionGateInput, validateTask026CohortExecutionScopeInput,
  validateTask026LearnerAccessGateInput, validateTask026TeacherMonitoringInput,
  validateTask026PilotEvidenceEventInput, validateTask026SafeguardingSignalInput,
  validateTask026IncidentWatchInput, validateTask026PauseControlInput,
  validateTask026ResumeControlInput, validateTask026RollbackControlInput,
  validateTask026DailyPilotSummaryInput, rejectTask026ForbiddenFields,
  redactTask026SensitiveValue, isTask026ControlRole, isTask026MonitoringRole, isTask026LearnerRole,
} from '../lib/task026ControlledPilotExecutionValidation';

describe('task026ControlledPilotExecutionValidation', () => {
  describe('validateTask026ExecutionContext', () => {
    it('rejects missing schoolId', () => {
      const result = validateTask026ExecutionContext({ actorId: 'a', actorRole: 'school_admin', verifiedSchoolIdentity: true });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('MISSING_SCHOOL_ID');
    });

    it('rejects denied role', () => {
      const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a', actorRole: 'parent', verifiedSchoolIdentity: true });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('ROLE_DENIED');
    });

    it('rejects unverified school context', () => {
      const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a', actorRole: 'school_admin', verifiedSchoolIdentity: false });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('UNVERIFIED_SCHOOL_CONTEXT');
    });

    it('passes with valid input', () => {
      const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.schoolId).toBe('s1');
        expect(result.data.verifiedSchoolIdentity).toBe(true);
      }
    });
  });

  describe('validateTask026DependencyGateInput', () => {
    it('rejects missing schoolId', () => {
      const result = validateTask026DependencyGateInput({ actorId: 'a', actorRole: 'admin' });
      expect(result.valid).toBe(false);
    });

    it('passes with valid input', () => {
      const result = validateTask026DependencyGateInput({ schoolId: 's1', actorId: 'a', actorRole: 'school_admin' });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTask026ControlledPilotRunInput', () => {
    it('rejects missing cohortIds', () => {
      const result = validateTask026ControlledPilotRunInput({
        schoolId: 's1', pilotProgramId: 'p1',
        teacherOwnerId: 't1', supportOwnerId: 's1', safeguardingOwnerId: 's2',
        pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['c1'], approvedSourceScopeIds: ['c2'],
      });
      expect(result.valid).toBe(false);
    });

    it('rejects too many cohorts', () => {
      const result = validateTask026ControlledPilotRunInput({
        schoolId: 's1', pilotProgramId: 'p1',
        cohortIds: ['c1','c2','c3','c4','c5','c6'],
        teacherOwnerId: 't1', supportOwnerId: 's1', safeguardingOwnerId: 's2',
        pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['c1'], approvedSourceScopeIds: ['c2'],
      });
      expect(result.valid).toBe(false);
    });

    it('passes with valid input', () => {
      const result = validateTask026ControlledPilotRunInput({
        schoolId: 's1', pilotProgramId: 'p1',
        cohortIds: ['c1'], teacherOwnerId: 't1',
        supportOwnerId: 's1', safeguardingOwnerId: 's2',
        pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['c1'], approvedSourceScopeIds: ['c2'],
        actorRole: 'school_admin', actorId: 'a1',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTask026ExecutionStateTransition', () => {
    it('rejects missing runId', () => {
      const result = validateTask026ExecutionStateTransition({ toStatus: 'active_controlled', actorRole: 'admin' });
      expect(result.valid).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = validateTask026ExecutionStateTransition({ runId: 'r1', toStatus: 'invalid_status', actorRole: 'admin' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTask026CohortExecutionScopeInput', () => {
    it('rejects invalid cohort size', () => {
      const result = validateTask026CohortExecutionScopeInput({ schoolId: 's1', cohortId: 'c1', cohortSize: 200, teacherOwnerId: 't1', supportOwnerId: 's1' });
      expect(result.valid).toBe(false);
    });

    it('passes with valid input', () => {
      const result = validateTask026CohortExecutionScopeInput({ schoolId: 's1', cohortId: 'c1', cohortSize: 25, teacherOwnerId: 't1', supportOwnerId: 's1' });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTask026LearnerAccessGateInput', () => {
    it('rejects missing learnerId', () => {
      const result = validateTask026LearnerAccessGateInput({ schoolId: 's1', cohortId: 'c1', pilotRunId: 'r1' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTask026SafeguardingSignalInput', () => {
    it('rejects invalid signal type', () => {
      const result = validateTask026SafeguardingSignalInput({ schoolId: 's1', pilotRunId: 'r1', signalType: 'invalid', source: 'test' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTask026IncidentWatchInput', () => {
    it('rejects invalid severity', () => {
      const result = validateTask026IncidentWatchInput({ schoolId: 's1', pilotRunId: 'r1', severity: 'unknown', category: 'test' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTask026PauseControlInput', () => {
    it('rejects invalid pause reason', () => {
      const result = validateTask026PauseControlInput({ runId: 'r1', actorRole: 'admin', reason: 'invalid_reason' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTask026RollbackControlInput', () => {
    it('rejects invalid rollback reason', () => {
      const result = validateTask026RollbackControlInput({ runId: 'r1', actorRole: 'admin', reason: 'invalid_reason' });
      expect(result.valid).toBe(false);
    });
  });

  describe('rejectTask026ForbiddenFields', () => {
    it('returns null for clean object', () => {
      expect(rejectTask026ForbiddenFields({ schoolId: 's1', safeSummary: 'ok' })).toBeNull();
    });

    it('detects forbidden field at top level', () => {
      const result = rejectTask026ForbiddenFields({ rawStudentData: 'leaked' });
      expect(result).not.toBeNull();
    });

    it('detects forbidden field nested', () => {
      const result = rejectTask026ForbiddenFields({ meta: { privateDeenText: 'sensitive' } });
      expect(result).not.toBeNull();
    });

    it('detects forbidden field in array element', () => {
      const result = rejectTask026ForbiddenFields({ items: [{ answerKey: 'secret' }] });
      expect(result).not.toBeNull();
    });
  });

  describe('redactTask026SensitiveValue', () => {
    it('redacts long values', () => {
      expect(redactTask026SensitiveValue('my-secret-token')).toBe('my***en');
    });

    it('returns *** for short values', () => {
      expect(redactTask026SensitiveValue('abc')).toBe('***');
    });
  });

  describe('isTask026ControlRole', () => {
    it('returns true for school_admin', () => expect(isTask026ControlRole('school_admin')).toBe(true));
    it('returns false for parent', () => expect(isTask026ControlRole('parent')).toBe(false));
  });

  describe('isTask026LearnerRole', () => {
    it('returns true for learner_in_approved_pilot_cohort', () => expect(isTask026LearnerRole('learner_in_approved_pilot_cohort')).toBe(true));
  });
});
