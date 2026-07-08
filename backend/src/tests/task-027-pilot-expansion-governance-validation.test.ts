import { describe, it, expect } from 'vitest';
import {
  rejectTask027ForbiddenFields,
  redactTask027SensitiveValue,
  createSafeTask027ValidationError,
  validateTask027GovernanceContext,
  validateTask027Task026DependencyGateInput,
  validateTask027PilotExecutionEvidenceInput,
  validateTask027LearningQualityReviewInput,
  validateTask027CohortExpansionProposalInput,
  validateTask027CohortExpansionEligibilityInput,
  validateTask027ExpansionRiskAssessmentInput,
  validateTask027TeacherReviewInput,
  validateTask027SchoolAdminApprovalInput,
  validateTask027ParentLearnerFeedbackReadinessInput,
  validateTask027SafeguardingReviewInput,
  validateTask027DeenContentReviewInput,
  validateTask027PrivacyReviewInput,
  validateTask027SocraticIntegrityReviewInput,
  validateTask027AcademicIntegrityReviewInput,
  validateTask027OperationsHealthBudgetInput,
  validateTask027PauseRollbackReadinessInput,
  validateTask027ExpansionEvidencePackInput,
  validateTask027GovernanceDecisionInput,
} from '../lib/task027PilotExpansionGovernanceValidation';

function validGovernanceContext() {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'school_admin',
    pilotRunId: 'run-1',
    verifiedSchoolIdentity: true,
    task026CommitVerified: true,
    task025Accepted: true,
    task024Accepted: true,
  };
}

function validDependencyGateInput() {
  return {
    schoolId: 'school-1',
    actorRole: 'school_admin',
    executionRunId: 'exec-1',
    commitHash: 'a2ebb29',
  };
}

function validEvidenceInput() {
  return { schoolId: 'school-1', pilotRunId: 'run-1', executionRunId: 'exec-1' };
}

function validLearningQualityInput() {
  return {
    schoolId: 'school-1',
    pilotRunId: 'run-1',
    evidenceSummary: {
      pilotRunId: 'run-1', schoolId: 'school-1',
      cohortSafeCount: 10, sessionsStartedCount: 5, sessionsBlockedCount: 0,
      supportNeededCount: 1, incidentCount: 0, safeguardingSignalCount: 0,
      pauseCount: 0, rollbackCount: 0,
      safeLearningQualitySignals: {}, safeSocraticIntegritySignals: {},
      safeContentGovernanceSignals: {}, safeOperationsSignals: {},
    },
  };
}

function validProposalInput() {
  return {
    schoolId: 'school-1', pilotRunId: 'run-1', proposedCohortSize: 30,
    proposedScopeLabels: ['class'], proposedClassOrGradeIds: ['c1'],
    teacherOwnerSafeRefs: ['t1'], supportOwnerSafeRefs: ['s1'],
    curriculumSourceScopeIds: ['cur1'], startReadinessWindow: '2026-07-10',
    rollbackReadinessPath: '/rollback/plan',
  };
}

function validEligibilityInput() {
  return { schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1' };
}

function validRiskInput() {
  return { schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1' };
}

function validTeacherReviewInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    teacherSafeId: 't1', safeSummary: 'Good progress',
    supportConcerns: [], learningQualityConcerns: [], workloadConcerns: [],
    recommendedDecision: 'expand_cautiously', safeReasonCodes: ['rc-1'],
  };
}

function validAdminApprovalInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    adminSafeId: 'a1', teacherReviewCompleted: true, riskAssessmentAcceptable: true,
    operationsCapacityAcceptable: true, privacyReviewPassed: true,
    safeguardingReviewPassed: true, contentDeenReviewPassed: true,
    rollbackPathReady: true, evidencePackGenerated: true,
    safeSummary: 'All clear', conditions: [],
  };
}

function validFeedbackInput() {
  return { schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1' };
}

function validSafeguardingInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    safeguardingOwnerSafeRef: 'sg1', seriousRiskDisclosureMinimal: true,
    humanReviewPathExists: true, roleScopedDisclosureOnly: true,
  };
}

function validDeenInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    approvedDeenSourcesVerified: true, deenContentPresent: false,
    noFatwaEngineBehavior: true, noPietyScoring: true, noSectarianJudgment: true,
    scholarReferralPathExists: true, contentSourcePolicyPassed: true,
  };
}

function validPrivacyInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    noRawLearnerData: true, noRawParentData: true, noRawTeacherNotes: true,
    noRawSafeguardingNotes: true, noPrivateDeenText: true, noProviderPayloads: true,
    noHiddenReasoning: true, minimalSafeMetadataOnly: true, roleScopedReportVisibility: true,
  };
}

function validSocraticInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    noFinalAnswerShortcut: true, noAnswerKeyLeakage: true, hintLadderPreserved: true,
    studentAgencyPreserved: true, reflectionPromptsPreserved: true,
    cheatingPreventionPreserved: true, teacherOnlyMaterialProtected: true,
  };
}

function validAcademicIntegrityInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    noAnswerKeyLeakage: true, noHomeworkShortcutPattern: true,
    noFinalAnswerFirstBehavior: true, noProtectedRubricLeakage: true,
    noExamBypass: true, studentEffortEvidenceExists: true,
  };
}

function validOperationsInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    monitoringCapacityOk: true, supportQueueCapacityOk: true,
    incidentResponseReadinessOk: true, latencyErrorBudgetAcceptable: true,
    pausePathReady: true, rollbackPathReady: true, killSwitchReady: true,
    teacherWorkloadAcceptable: true,
  };
}

function validPauseRollbackInput() {
  return {
    schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1',
    pauseCanBlockNewLearnerAccess: true, rollbackCanBlockExpansion: true,
    killSwitchExists: true, auditPreserved: true, noDestructiveDeletion: true,
    manualReviewPathExists: true,
  };
}

function validEvidencePackInput() {
  return { schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1' };
}

function validDecisionInput() {
  return { schoolId: 'school-1', proposalId: 'prop-1', pilotRunId: 'run-1' };
}

describe('Task027PilotExpansionGovernanceValidation', () => {
  describe('rejectTask027ForbiddenFields', () => {
    it('returns empty array for clean object', () => {
      expect(rejectTask027ForbiddenFields({ schoolId: 's1', safeField: 'ok' })).toEqual([]);
    });

    it('detects rawStudentData at top level', () => {
      const result = rejectTask027ForbiddenFields({ rawStudentData: 'leaked' });
      expect(result.length).toBe(1);
      expect(result[0]).toContain('rawStudentData');
    });

    it('detects rawLearnerData at top level', () => {
      const result = rejectTask027ForbiddenFields({ rawLearnerData: 'leaked' });
      expect(result.length).toBe(1);
    });

    it('detects rawParentData at top level', () => {
      expect(rejectTask027ForbiddenFields({ rawParentData: 'x' }).length).toBe(1);
    });

    it('detects rawAnswerKey at top level', () => {
      expect(rejectTask027ForbiddenFields({ rawAnswerKey: 'x' }).length).toBe(1);
    });

    it('detects forbidden fields nested one level deep', () => {
      const result = rejectTask027ForbiddenFields({ meta: { rawStudentData: 'hidden' } });
      expect(result.length).toBe(1);
      expect(result[0]).toContain('meta.rawStudentData');
    });

    it('detects forbidden fields nested three levels deep', () => {
      const result = rejectTask027ForbiddenFields({ a: { b: { c: { rawLearnerData: 'x' } } } });
      expect(result.length).toBe(1);
      expect(result[0]).toContain('a.b.c.rawLearnerData');
    });

    it('detects forbidden fields in array of objects', () => {
      const result = rejectTask027ForbiddenFields({ items: [{ rawSafeguardingNotes: 'x' }] });
      expect(result.length).toBe(1);
    });

    it('detects rawFatwaText', () => {
      expect(rejectTask027ForbiddenFields({ rawFatwaText: 'fatwa' }).length).toBe(1);
    });

    it('detects rawPietyScore', () => {
      expect(rejectTask027ForbiddenFields({ rawPietyScore: '0.5' }).length).toBe(1);
    });
  });

  describe('redactTask027SensitiveValue', () => {
    it('returns [REDACTED] for non-empty string', () => {
      expect(redactTask027SensitiveValue('secret')).toBe('[REDACTED]');
    });

    it('returns [REDACTED] for any non-empty value', () => {
      expect(redactTask027SensitiveValue('anything')).toBe('[REDACTED]');
    });

    it('returns empty string for empty input', () => {
      expect(redactTask027SensitiveValue('')).toBe('');
    });
  });

  describe('createSafeTask027ValidationError', () => {
    it('returns correct shape with ok:false', () => {
      const result = createSafeTask027ValidationError('Validation failed', ['err1', 'err2']);
      expect(result).toEqual({ ok: false, errors: ['err1', 'err2'], safeMessage: 'Validation failed' });
    });

    it('returns empty errors array when none passed', () => {
      const result = createSafeTask027ValidationError('Ok', []);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateTask027GovernanceContext', () => {
    it('accepts valid input', () => {
      const result = validateTask027GovernanceContext(validGovernanceContext());
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toEqual([]);
    });

    it('rejects missing schoolId', () => {
      const { schoolId, ...rest } = validGovernanceContext();
      const result = validateTask027GovernanceContext(rest);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e: string) => e.includes('schoolId'))).toBe(true);
    });

    it('rejects missing actorId', () => {
      const { actorId, ...rest } = validGovernanceContext();
      const result = validateTask027GovernanceContext(rest);
      expect(result.ok).toBe(false);
    });

    it('rejects missing actorRole', () => {
      const { actorRole, ...rest } = validGovernanceContext();
      const result = validateTask027GovernanceContext(rest);
      expect(result.ok).toBe(false);
    });

    it('rejects learner role', () => {
      const result = validateTask027GovernanceContext({ ...validGovernanceContext(), actorRole: 'learner' });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e: string) => e.includes('not authorized'))).toBe(true);
    });

    it('rejects student role', () => {
      const result = validateTask027GovernanceContext({ ...validGovernanceContext(), actorRole: 'student' });
      expect(result.ok).toBe(false);
    });

    it('rejects forbidden fields in input', () => {
      const result = validateTask027GovernanceContext({ ...validGovernanceContext(), rawStudentData: 'leaked' });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Forbidden field'))).toBe(true);
    });
  });

  describe('validateTask027Task026DependencyGateInput', () => {
    it('accepts valid input', () => {
      const result = validateTask027Task026DependencyGateInput(validDependencyGateInput());
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('rejects missing commitHash', () => {
      const { commitHash, ...rest } = validDependencyGateInput();
      const result = validateTask027Task026DependencyGateInput(rest);
      expect(result.ok).toBe(false);
    });

    it('rejects missing executionRunId', () => {
      const { executionRunId, ...rest } = validDependencyGateInput();
      const result = validateTask027Task026DependencyGateInput(rest);
      expect(result.ok).toBe(false);
    });

    it('rejects forbidden fields', () => {
      const result = validateTask027Task026DependencyGateInput({ ...validDependencyGateInput(), rawStudentData: 'x' });
      expect(result.ok).toBe(false);
    });

    it('rejects learner parent role', () => {
      const result = validateTask027Task026DependencyGateInput({ ...validDependencyGateInput(), actorRole: 'parent' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask027PilotExecutionEvidenceInput', () => {
    it('accepts valid input', () => {
      const result = validateTask027PilotExecutionEvidenceInput(validEvidenceInput());
      expect(result.ok).toBe(true);
    });

    it('rejects missing pilotRunId', () => {
      const { pilotRunId, ...rest } = validEvidenceInput();
      expect(validateTask027PilotExecutionEvidenceInput(rest).ok).toBe(false);
    });

    it('rejects forbidden fields', () => {
      expect(validateTask027PilotExecutionEvidenceInput({ ...validEvidenceInput(), rawLearnerData: 'x' }).ok).toBe(false);
    });
  });

  describe('validateTask027LearningQualityReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027LearningQualityReviewInput(validLearningQualityInput()).ok).toBe(true);
    });

    it('rejects missing evidenceSummary', () => {
      const { evidenceSummary, ...rest } = validLearningQualityInput();
      expect(validateTask027LearningQualityReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027CohortExpansionProposalInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027CohortExpansionProposalInput(validProposalInput()).ok).toBe(true);
    });

    it('rejects missing proposedCohortSize', () => {
      const { proposedCohortSize, ...rest } = validProposalInput();
      expect(validateTask027CohortExpansionProposalInput(rest).ok).toBe(false);
    });

    it('rejects non-array proposedScopeLabels', () => {
      const result = validateTask027CohortExpansionProposalInput({ ...validProposalInput(), proposedScopeLabels: 'not-array' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask027CohortExpansionEligibilityInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027CohortExpansionEligibilityInput(validEligibilityInput()).ok).toBe(true);
    });

    it('rejects missing proposalId', () => {
      const { proposalId, ...rest } = validEligibilityInput();
      expect(validateTask027CohortExpansionEligibilityInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027ExpansionRiskAssessmentInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027ExpansionRiskAssessmentInput(validRiskInput()).ok).toBe(true);
    });

    it('rejects missing proposalId', () => {
      const { proposalId, ...rest } = validRiskInput();
      expect(validateTask027ExpansionRiskAssessmentInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027TeacherReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027TeacherReviewInput(validTeacherReviewInput()).ok).toBe(true);
    });

    it('rejects missing teacherSafeId', () => {
      const { teacherSafeId, ...rest } = validTeacherReviewInput();
      expect(validateTask027TeacherReviewInput(rest).ok).toBe(false);
    });

    it('rejects missing safeSummary', () => {
      const { safeSummary, ...rest } = validTeacherReviewInput();
      expect(validateTask027TeacherReviewInput(rest).ok).toBe(false);
    });

    it('rejects raw learner data fields', () => {
      const result = validateTask027TeacherReviewInput({ ...validTeacherReviewInput(), rawLearnerData: 'leaked' });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Forbidden field'))).toBe(true);
    });
  });

  describe('validateTask027SchoolAdminApprovalInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027SchoolAdminApprovalInput(validAdminApprovalInput()).ok).toBe(true);
    });

    it('rejects missing adminSafeId', () => {
      const { adminSafeId, ...rest } = validAdminApprovalInput();
      expect(validateTask027SchoolAdminApprovalInput(rest).ok).toBe(false);
    });

    it('rejects non-boolean teacherReviewCompleted', () => {
      const result = validateTask027SchoolAdminApprovalInput({ ...validAdminApprovalInput(), teacherReviewCompleted: 'yes' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask027ParentLearnerFeedbackReadinessInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027ParentLearnerFeedbackReadinessInput(validFeedbackInput()).ok).toBe(true);
    });

    it('rejects forbidden fields', () => {
      const result = validateTask027ParentLearnerFeedbackReadinessInput({ ...validFeedbackInput(), rawParentData: 'x' });
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask027SafeguardingReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027SafeguardingReviewInput(validSafeguardingInput()).ok).toBe(true);
    });

    it('rejects missing safeguardingOwnerSafeRef', () => {
      const { safeguardingOwnerSafeRef, ...rest } = validSafeguardingInput();
      expect(validateTask027SafeguardingReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027DeenContentReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027DeenContentReviewInput(validDeenInput()).ok).toBe(true);
    });

    it('rejects missing approvedDeenSourcesVerified', () => {
      const { approvedDeenSourcesVerified, ...rest } = validDeenInput();
      expect(validateTask027DeenContentReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027PrivacyReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027PrivacyReviewInput(validPrivacyInput()).ok).toBe(true);
    });

    it('rejects missing noRawLearnerData', () => {
      const { noRawLearnerData, ...rest } = validPrivacyInput();
      expect(validateTask027PrivacyReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027SocraticIntegrityReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027SocraticIntegrityReviewInput(validSocraticInput()).ok).toBe(true);
    });

    it('rejects missing noFinalAnswerShortcut', () => {
      const { noFinalAnswerShortcut, ...rest } = validSocraticInput();
      expect(validateTask027SocraticIntegrityReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027AcademicIntegrityReviewInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027AcademicIntegrityReviewInput(validAcademicIntegrityInput()).ok).toBe(true);
    });

    it('rejects missing noAnswerKeyLeakage', () => {
      const { noAnswerKeyLeakage, ...rest } = validAcademicIntegrityInput();
      expect(validateTask027AcademicIntegrityReviewInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027OperationsHealthBudgetInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027OperationsHealthBudgetInput(validOperationsInput()).ok).toBe(true);
    });

    it('rejects missing monitoringCapacityOk', () => {
      const { monitoringCapacityOk, ...rest } = validOperationsInput();
      expect(validateTask027OperationsHealthBudgetInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027PauseRollbackReadinessInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027PauseRollbackReadinessInput(validPauseRollbackInput()).ok).toBe(true);
    });

    it('rejects missing pauseCanBlockNewLearnerAccess', () => {
      const { pauseCanBlockNewLearnerAccess, ...rest } = validPauseRollbackInput();
      expect(validateTask027PauseRollbackReadinessInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027ExpansionEvidencePackInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027ExpansionEvidencePackInput(validEvidencePackInput()).ok).toBe(true);
    });

    it('rejects missing proposalId', () => {
      const { proposalId, ...rest } = validEvidencePackInput();
      expect(validateTask027ExpansionEvidencePackInput(rest).ok).toBe(false);
    });
  });

  describe('validateTask027GovernanceDecisionInput', () => {
    it('accepts valid input', () => {
      expect(validateTask027GovernanceDecisionInput(validDecisionInput()).ok).toBe(true);
    });

    it('rejects missing pilotRunId', () => {
      const { pilotRunId, ...rest } = validDecisionInput();
      expect(validateTask027GovernanceDecisionInput(rest).ok).toBe(false);
    });
  });
});
