import { describe, it, expect } from 'vitest';
import {
  validateTask025PilotReadinessContext,
  validateTask025PilotScopeInput,
  validateTask025CandidateCohortInput,
  validateTask025StakeholderReadinessInput,
  validateTask025TeacherWorkflowInput,
  validateTask025AdminAcceptanceInput,
  validateTask025ParentCommunicationInput,
  validateTask025SafeguardingReadinessInput,
  validateTask025MonitoringReadinessInput,
  validateTask025PauseRollbackInput,
  validateTask025DataPrivacyInput,
  rejectTask025ForbiddenFields,
  createSafeTask025ValidationError,
} from '../lib/task025ControlledPilotReadinessValidation';
import { TASK025_FORBIDDEN_FIELDS } from '../contracts/task025ControlledPilotReadinessContracts';

const VALID_CONTEXT = {
  schoolId: 'school_001',
  actorId: 'actor_admin',
  actorRole: 'school_admin',
  requestId: 'req_abc',
  verifiedSchoolIdentity: true,
  schoolName: 'Test School',
  pilotCoordinatorName: 'Coordinator A',
};

const VALID_SCOPE = {
  schoolId: 'school_001',
  pilotPurpose: 'Evaluate AI tutor efficacy',
  cohortSize: 25,
  pilotDurationWeeks: 12,
  adminOwner: 'admin@school',
  supportOwner: 'support@school',
  monitoringOwner: 'monitor@school',
  pauseOwner: 'pause@school',
  rollbackOwner: 'rollback@school',
  teacherCoverageAvailable: true,
  safeguardingEscalationPathDefined: true,
  parentCommunicationMaterialPrepared: true,
  deenSourceReferralPathDefined: true,
  curriculumSourceGovernanceReady: true,
  privacyGovernanceReady: true,
  operationsMonitoringReady: true,
};

const VALID_COHORT = {
  schoolId: 'school_001',
  cohortId: 'cohort_a',
  cohortSize: 20,
  teacherOwner: 'teacher@school',
  supportOwner: 'support@school',
  sourceApprovedCurriculumContext: true,
  safeLearningContextAvailable: true,
};

const VALID_STAKEHOLDER = {
  schoolId: 'school_001',
  teacherIds: ['t1', 't2'],
  adminIds: ['a1'],
  supportStaffIds: ['s1'],
  safeguardingOwnerId: 'safeguard_officer',
};

describe('validateTask025PilotReadinessContext', () => {
  it('should return valid for complete input', () => {
    const result = validateTask025PilotReadinessContext(VALID_CONTEXT);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.schoolId).toBe('school_001');
      expect(result.data.actorId).toBe('actor_admin');
      expect(result.data.actorRole).toBe('school_admin');
      expect(result.data.requestId).toBe('req_abc');
      expect(result.data.verifiedSchoolIdentity).toBe(true);
      expect(typeof result.data.timestamp).toBe('string');
    }
  });

  it('should reject missing schoolId', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, schoolId: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_SCHOOL_ID');
      expect(result.reasonCodes).toContain('missing_school_id');
    }
  });

  it('should reject empty schoolId string', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, schoolId: '' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_SCHOOL_ID');
    }
  });

  it('should reject missing actorId', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, actorId: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ACTOR_ID');
      expect(result.reasonCodes).toContain('missing_actor_id');
    }
  });

  it('should reject missing actorRole', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, actorRole: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ACTOR_ROLE');
      expect(result.reasonCodes).toContain('missing_actor_role');
    }
  });

  it('should reject when verifiedSchoolIdentity is false', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, verifiedSchoolIdentity: false });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('UNVERIFIED_SCHOOL_CONTEXT');
    }
  });

  it('should reject when verifiedSchoolIdentity is undefined', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, verifiedSchoolIdentity: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('UNVERIFIED_SCHOOL_CONTEXT');
    }
  });

  it('should deny learner role', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, actorRole: 'learner' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('LEARNER_PARENT_PEER_DENIED');
      expect(result.reasonCodes).toContain('actor_role_denied');
    }
  });

  it('should deny student role', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, actorRole: 'student' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('LEARNER_PARENT_PEER_DENIED');
    }
  });

  it('should deny parent role', () => {
    const result = validateTask025PilotReadinessContext({ ...VALID_CONTEXT, actorRole: 'parent' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('LEARNER_PARENT_PEER_DENIED');
    }
  });
});

describe('validateTask025PilotScopeInput', () => {
  it('should return valid for complete input', () => {
    const result = validateTask025PilotScopeInput(VALID_SCOPE, 'school_001');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.pilotPurpose).toBe('Evaluate AI tutor efficacy');
      expect(result.data.cohortSize).toBe(25);
      expect(result.data.pilotDurationWeeks).toBe(12);
    }
  });

  it('should reject cross-school scope', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, schoolId: 'school_999' }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('CROSS_SCHOOL_SCOPE');
      expect(result.reasonCodes).toContain('cross_school_denied');
    }
  });

  it('should reject missing pilotPurpose', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, pilotPurpose: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_PILOT_PURPOSE');
    }
  });

  it('should reject cohortSize less than 1', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, cohortSize: 0 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_COHORT_SIZE');
      expect(result.reasonCodes).toContain('invalid_cohort_size');
    }
  });

  it('should reject cohortSize greater than 100', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, cohortSize: 101 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_COHORT_SIZE');
    }
  });

  it('should reject pilotDurationWeeks less than 1', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, pilotDurationWeeks: 0 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_PILOT_DURATION');
    }
  });

  it('should reject pilotDurationWeeks greater than 52', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, pilotDurationWeeks: 53 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_PILOT_DURATION');
      expect(result.reasonCodes).toContain('invalid_pilot_duration');
    }
  });

  it('should reject missing adminOwner', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, adminOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ADMIN_OWNER');
    }
  });

  it('should reject missing supportOwner', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, supportOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_SUPPORT_OWNER');
    }
  });

  it('should reject missing monitoringOwner', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, monitoringOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_MONITORING_OWNER');
    }
  });

  it('should reject missing pauseOwner', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, pauseOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_PAUSE_OWNER');
    }
  });

  it('should reject missing rollbackOwner', () => {
    const result = validateTask025PilotScopeInput({ ...VALID_SCOPE, rollbackOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ROLLBACK_OWNER');
      expect(result.reasonCodes).toContain('missing_rollback_owner');
    }
  });
});

describe('validateTask025CandidateCohortInput', () => {
  it('should return valid for complete input', () => {
    const result = validateTask025CandidateCohortInput(VALID_COHORT, 'school_001');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.cohortId).toBe('cohort_a');
      expect(result.data.cohortSize).toBe(20);
      expect(result.data.teacherOwner).toBe('teacher@school');
    }
  });

  it('should reject cross-school cohort', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, schoolId: 'school_999' }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('CROSS_SCHOOL_COHORT');
      expect(result.reasonCodes).toContain('cross_school_denied');
    }
  });

  it('should reject missing cohortId', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, cohortId: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_COHORT_ID');
    }
  });

  it('should reject cohortSize less than 1', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, cohortSize: 0 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_COHORT_SIZE');
      expect(result.reasonCodes).toContain('invalid_cohort_size_cohort');
    }
  });

  it('should reject cohortSize greater than 100', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, cohortSize: 101 }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_COHORT_SIZE');
    }
  });

  it('should reject missing teacherOwner', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, teacherOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_TEACHER_OWNER');
    }
  });

  it('should reject missing supportOwner', () => {
    const result = validateTask025CandidateCohortInput({ ...VALID_COHORT, supportOwner: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_SUPPORT_OWNER_COHORT');
      expect(result.reasonCodes).toContain('missing_support_owner_cohort');
    }
  });
});

describe('validateTask025StakeholderReadinessInput', () => {
  it('should return valid for complete input', () => {
    const result = validateTask025StakeholderReadinessInput(VALID_STAKEHOLDER, 'school_001');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.teacherIds).toEqual(['t1', 't2']);
      expect(result.data.adminIds).toEqual(['a1']);
      expect(result.data.safeguardingOwnerId).toBe('safeguard_officer');
      expect(result.data.supportStaffIds).toEqual(['s1']);
    }
  });

  it('should reject cross-school stakeholder', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, schoolId: 'school_999' }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('CROSS_SCHOOL_STAKEHOLDER');
      expect(result.reasonCodes).toContain('cross_school_denied');
    }
  });

  it('should reject missing teacherIds', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, teacherIds: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_TEACHER_IDS');
    }
  });

  it('should reject empty teacherIds array', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, teacherIds: [] }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_TEACHER_IDS');
      expect(result.reasonCodes).toContain('missing_teacher_ids');
    }
  });

  it('should reject missing adminIds', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, adminIds: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ADMIN_IDS');
    }
  });

  it('should reject empty adminIds array', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, adminIds: [] }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ADMIN_IDS');
      expect(result.reasonCodes).toContain('missing_admin_ids');
    }
  });

  it('should reject missing safeguardingOwnerId', () => {
    const result = validateTask025StakeholderReadinessInput({ ...VALID_STAKEHOLDER, safeguardingOwnerId: undefined }, 'school_001');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_SAFEGUARDING_OWNER');
      expect(result.reasonCodes).toContain('missing_safeguarding_owner');
    }
  });
});

describe('validateTask025TeacherWorkflowInput', () => {
  it('should return valid when teacherCount >= validatedTeachers', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: 10, validatedTeachers: 7 });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.teacherCount).toBe(10);
      expect(result.data.validatedTeachers).toBe(7);
    }
  });

  it('should reject negative teacherCount', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: -1, validatedTeachers: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_TEACHER_COUNT');
    }
  });

  it('should reject non-number teacherCount', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: 'abc' as any, validatedTeachers: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_TEACHER_COUNT');
      expect(result.reasonCodes).toContain('invalid_teacher_count');
    }
  });

  it('should reject negative validatedTeachers', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: 5, validatedTeachers: -3 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_VALIDATED_TEACHERS');
    }
  });

  it('should reject non-number validatedTeachers', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: 5, validatedTeachers: 'x' as any });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('INVALID_VALIDATED_TEACHERS');
      expect(result.reasonCodes).toContain('invalid_validated_teachers');
    }
  });

  it('should reject when validatedTeachers exceeds teacherCount', () => {
    const result = validateTask025TeacherWorkflowInput({ teacherCount: 5, validatedTeachers: 10 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('VALIDATED_EXCEEDS_TOTAL');
      expect(result.reasonCodes).toContain('validated_exceeds_total');
    }
  });
});

describe('validateTask025AdminAcceptanceInput', () => {
  it('should return valid with adminOwner and no notes', () => {
    const result = validateTask025AdminAcceptanceInput({ adminOwner: 'admin@school' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.adminOwner).toBe('admin@school');
      expect(result.data.approvalNotes).toBe('');
    }
  });

  it('should return valid with approval notes', () => {
    const result = validateTask025AdminAcceptanceInput({ adminOwner: 'admin@school', approvalNotes: 'Approved after review.' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.approvalNotes).toBe('Approved after review.');
    }
  });

  it('should reject missing adminOwner', () => {
    const result = validateTask025AdminAcceptanceInput({ adminOwner: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ADMIN_ACCEPTANCE_OWNER');
      expect(result.reasonCodes).toContain('missing_admin_acceptance_owner');
    }
  });

  it('should reject empty adminOwner', () => {
    const result = validateTask025AdminAcceptanceInput({ adminOwner: '' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('MISSING_ADMIN_ACCEPTANCE_OWNER');
    }
  });

  it('should reject approval notes exceeding 2000 characters', () => {
    const result = validateTask025AdminAcceptanceInput({ adminOwner: 'admin@school', approvalNotes: 'x'.repeat(2001) });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('APPROVAL_NOTES_TOO_LONG');
      expect(result.reasonCodes).toContain('approval_notes_too_long');
    }
  });
});

describe('validateTask025ParentCommunicationInput', () => {
  it('should return valid with all false defaults', () => {
    const result = validateTask025ParentCommunicationInput({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.templatesReady).toBe(false);
      expect(result.data.privacySummaryIncluded).toBe(false);
      expect(result.data.optOutPathDefined).toBe(false);
    }
  });

  it('should return valid with all true', () => {
    const result = validateTask025ParentCommunicationInput({ templatesReady: true, privacySummaryIncluded: true, optOutPathDefined: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.templatesReady).toBe(true);
      expect(result.data.privacySummaryIncluded).toBe(true);
      expect(result.data.optOutPathDefined).toBe(true);
    }
  });
});

describe('validateTask025SafeguardingReadinessInput', () => {
  it('should return valid with all false defaults', () => {
    const result = validateTask025SafeguardingReadinessInput({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.safeguardingOwnerExists).toBe(false);
      expect(result.data.escalationRouteDefined).toBe(false);
      expect(result.data.humanReviewPathExists).toBe(false);
    }
  });

  it('should return valid with all true', () => {
    const result = validateTask025SafeguardingReadinessInput({ safeguardingOwnerExists: true, escalationRouteDefined: true, humanReviewPathExists: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.safeguardingOwnerExists).toBe(true);
      expect(result.data.escalationRouteDefined).toBe(true);
      expect(result.data.humanReviewPathExists).toBe(true);
    }
  });
});

describe('validateTask025MonitoringReadinessInput', () => {
  it('should return valid with all false defaults', () => {
    const result = validateTask025MonitoringReadinessInput({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.task024MonitoringReady).toBe(false);
      expect(result.data.incidentDrillAvailable).toBe(false);
      expect(result.data.backupRestoreDrillAvailable).toBe(false);
    }
  });

  it('should return valid with all true', () => {
    const result = validateTask025MonitoringReadinessInput({ task024MonitoringReady: true, incidentDrillAvailable: true, backupRestoreDrillAvailable: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.task024MonitoringReady).toBe(true);
      expect(result.data.incidentDrillAvailable).toBe(true);
      expect(result.data.backupRestoreDrillAvailable).toBe(true);
    }
  });
});

describe('validateTask025PauseRollbackInput', () => {
  it('should return valid with all false defaults', () => {
    const result = validateTask025PauseRollbackInput({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.pauseOwnerExists).toBe(false);
      expect(result.data.rollbackOwnerExists).toBe(false);
      expect(result.data.pauseCriteriaDefined).toBe(false);
      expect(result.data.rollbackCriteriaDefined).toBe(false);
    }
  });

  it('should return valid with all true', () => {
    const result = validateTask025PauseRollbackInput({ pauseOwnerExists: true, rollbackOwnerExists: true, pauseCriteriaDefined: true, rollbackCriteriaDefined: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.pauseOwnerExists).toBe(true);
      expect(result.data.rollbackOwnerExists).toBe(true);
      expect(result.data.pauseCriteriaDefined).toBe(true);
      expect(result.data.rollbackCriteriaDefined).toBe(true);
    }
  });
});

describe('validateTask025DataPrivacyInput', () => {
  it('should return valid with all false defaults', () => {
    const result = validateTask025DataPrivacyInput({});
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.dataClassificationApplied).toBe(false);
      expect(result.data.roleMatrixApplied).toBe(false);
      expect(result.data.aiEgressGuardNotBypassed).toBe(false);
    }
  });

  it('should return valid with all true', () => {
    const result = validateTask025DataPrivacyInput({ dataClassificationApplied: true, roleMatrixApplied: true, aiEgressGuardNotBypassed: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.dataClassificationApplied).toBe(true);
      expect(result.data.roleMatrixApplied).toBe(true);
      expect(result.data.aiEgressGuardNotBypassed).toBe(true);
    }
  });
});

describe('rejectTask025ForbiddenFields', () => {
  it('should return null for clean object', () => {
    expect(rejectTask025ForbiddenFields({ schoolId: 's1', pilotPurpose: 'safe' })).toBeNull();
  });

  it('should detect forbidden field at top level', () => {
    const result = rejectTask025ForbiddenFields({ schoolId: 's1', rawStudentData: 'leaked' });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.code).toBe('FORBIDDEN_FIELD');
      expect(result.reasonCodes).toContain('forbidden_field');
      expect(result.reasonCodes).toContain('field:rawStudentData');
    }
  });

  it('should detect forbidden field in nested object', () => {
    const result = rejectTask025ForbiddenFields({ meta: { answerKey: 'secret' } });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.code).toBe('FORBIDDEN_FIELD');
      expect(result.reasonCodes).toContain('field:answerKey');
    }
  });

  it('should detect forbidden field in array element object', () => {
    const result = rejectTask025ForbiddenFields({ items: [{ name: 'ok' }, { chainOfThought: 'hidden' }] });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.code).toBe('FORBIDDEN_FIELD');
      expect(result.reasonCodes).toContain('field:chainOfThought');
    }
  });

  it('should detect multiple forbidden field types', () => {
    const result = rejectTask025ForbiddenFields({ rawSafeguardingNote: 'note', parentPhone: '123' });
    expect(result).not.toBeNull();
  });
});

describe('createSafeTask025ValidationError', () => {
  it('should return correct shape', () => {
    const result = createSafeTask025ValidationError('TEST_CODE', 'A test error.', ['reason_a', 'reason_b']);
    expect(result).toEqual({
      valid: false,
      code: 'TEST_CODE',
      safeMessage: 'A test error.',
      reasonCodes: ['reason_a', 'reason_b'],
    });
  });
});
