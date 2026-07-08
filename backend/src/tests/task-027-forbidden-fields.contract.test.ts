import { describe, it, expect } from 'vitest';
import {
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import {
  rejectTask027ForbiddenFields,
  validateTask027GovernanceContext,
  validateTask027Task026DependencyGateInput,
  validateTask027PilotExecutionEvidenceInput,
  validateTask027TeacherReviewInput,
  validateTask027SchoolAdminApprovalInput,
  validateTask027SafeguardingReviewInput,
  validateTask027PrivacyReviewInput,
  validateTask027DeenContentReviewInput,
  validateTask027SocraticIntegrityReviewInput,
  validateTask027AcademicIntegrityReviewInput,
} from '../lib/task027PilotExpansionGovernanceValidation';

function safeInput(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-1', actorId: 'actor-1', actorRole: 'school_admin',
    pilotRunId: 'run-1', verifiedSchoolIdentity: true,
    task026CommitVerified: true, task025Accepted: true, task024Accepted: true,
    ...overrides,
  };
}

describe('Task027 forbidden fields enforcement', () => {
  describe('rejectTask027ForbiddenFields - all major categories', () => {
    const forbiddenCategories: { field: string; label: string }[] = [
      { field: 'rawStudentData', label: 'raw student data' },
      { field: 'rawLearnerData', label: 'raw learner data' },
      { field: 'rawParentData', label: 'raw parent data' },
      { field: 'rawAnswerKey', label: 'answer key' },
      { field: 'rawProviderPayloads', label: 'provider payloads' },
      { field: 'rawHiddenReasoning', label: 'hidden reasoning' },
      { field: 'rawPII', label: 'PII' },
      { field: 'rawBiometricData', label: 'biometric data' },
      { field: 'rawLocationData', label: 'location data' },
      { field: 'rawDeviceData', label: 'device data' },
      { field: 'rawBehavioralProfile', label: 'behavioral profile' },
      { field: 'rawSafeguardingDisclosure', label: 'safeguarding disclosure' },
      { field: 'rawFatwaText', label: 'fatwa text' },
      { field: 'rawPietyScore', label: 'piety score' },
      { field: 'rawSectarianLabel', label: 'sectarian label' },
      { field: 'rawFinalAnswer', label: 'final answer' },
      { field: 'rawReasoningTrace', label: 'reasoning trace' },
      { field: 'rawModelOutput', label: 'model output' },
      { field: 'rawPromptData', label: 'prompt data' },
      { field: 'rawProviderLog', label: 'provider log' },
      { field: 'rawExamContent', label: 'exam content' },
      { field: 'rawHomeworkSubmission', label: 'homework submission' },
      { field: 'rawSessionTranscript', label: 'session transcript' },
      { field: 'rawTeacherNotes', label: 'teacher notes' },
      { field: 'rawSafeguardingNotes', label: 'safeguarding notes' },
      { field: 'rawDeenText', label: 'deen text' },
      { field: 'rawRubricData', label: 'rubric data' },
      { field: 'rawFeedbackContent', label: 'feedback content' },
      { field: 'rawParentFeedback', label: 'parent feedback' },
      { field: 'rawLearnerFeedback', label: 'learner feedback' },
    ];

    forbiddenCategories.forEach(({ field, label }) => {
      it(`detects "${field}" (${label})`, () => {
        const result = rejectTask027ForbiddenFields({ safeField: 'ok', [field]: 'leaked' });
        expect(result.length).toBe(1);
        expect(result[0]).toContain(field);
        expect(result[0]).toContain('Forbidden field');
      });
    });
  });

  describe('validateTask027GovernanceContext rejects forbidden fields', () => {
    it('rejects rawStudentData', () => {
      const result = validateTask027GovernanceContext(safeInput({ rawStudentData: 'leaked' }));
      expect(result.ok).toBe(false);
      expect(result.errors.some((e: string) => e.includes('rawStudentData'))).toBe(true);
    });

    it('rejects rawFatwaText', () => {
      const result = validateTask027GovernanceContext(safeInput({ rawFatwaText: 'fatwa' }));
      expect(result.ok).toBe(false);
    });

    it('rejects rawPietyScore', () => {
      const result = validateTask027GovernanceContext(safeInput({ rawPietyScore: '0.8' }));
      expect(result.ok).toBe(false);
    });

    it('rejects rawSectarianLabel', () => {
      const result = validateTask027GovernanceContext(safeInput({ rawSectarianLabel: 'label' }));
      expect(result.ok).toBe(false);
    });

    it('rejects rawFinalAnswer', () => {
      const result = validateTask027GovernanceContext(safeInput({ rawFinalAnswer: '42' }));
      expect(result.ok).toBe(false);
    });
  });

  describe('validateTask027Task026DependencyGateInput rejects forbidden fields', () => {
    it('rejects rawLearnerData', () => {
      const input = { schoolId: 's1', actorRole: 'school_admin', executionRunId: 'e1', commitHash: 'abc', rawLearnerData: 'x' };
      expect(validateTask027Task026DependencyGateInput(input).ok).toBe(false);
    });

    it('rejects rawPII', () => {
      const input = { schoolId: 's1', actorRole: 'school_admin', executionRunId: 'e1', commitHash: 'abc', rawPII: 'x' };
      expect(validateTask027Task026DependencyGateInput(input).ok).toBe(false);
    });
  });

  describe('validateTask027PilotExecutionEvidenceInput rejects forbidden fields', () => {
    it('rejects rawBiometricData', () => {
      const input = { schoolId: 's1', pilotRunId: 'r1', executionRunId: 'e1', rawBiometricData: 'x' };
      expect(validateTask027PilotExecutionEvidenceInput(input).ok).toBe(false);
    });

    it('rejects rawLocationData', () => {
      const input = { schoolId: 's1', pilotRunId: 'r1', executionRunId: 'e1', rawLocationData: 'x' };
      expect(validateTask027PilotExecutionEvidenceInput(input).ok).toBe(false);
    });
  });

  describe('validateTask027TeacherReviewInput rejects raw learner data', () => {
    it('rejects rawLearnerData', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        teacherSafeId: 't1', safeSummary: 'ok',
        supportConcerns: [], learningQualityConcerns: [], workloadConcerns: [],
        recommendedDecision: 'expand', safeReasonCodes: [],
        rawLearnerData: 'leaked',
      };
      expect(validateTask027TeacherReviewInput(input).ok).toBe(false);
    });

    it('rejects rawParentData', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        teacherSafeId: 't1', safeSummary: 'ok',
        supportConcerns: [], learningQualityConcerns: [], workloadConcerns: [],
        recommendedDecision: 'expand', safeReasonCodes: [],
        rawParentData: 'leaked',
      };
      expect(validateTask027TeacherReviewInput(input).ok).toBe(false);
    });
  });

  describe('validateTask027SchoolAdminApprovalInput rejects forbidden fields', () => {
    it('rejects rawBehavioralProfile', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        adminSafeId: 'a1', teacherReviewCompleted: true,
        riskAssessmentAcceptable: true, operationsCapacityAcceptable: true,
        privacyReviewPassed: true, safeguardingReviewPassed: true,
        contentDeenReviewPassed: true, rollbackPathReady: true,
        evidencePackGenerated: true, safeSummary: 'ok', conditions: [],
        rawBehavioralProfile: 'x',
      };
      expect(validateTask027SchoolAdminApprovalInput(input).ok).toBe(false);
    });
  });

  describe('validateTask027SafeguardingReviewInput rejects forbidden fields', () => {
    it('rejects rawSafeguardingDisclosure', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        safeguardingOwnerSafeRef: 'sg1', seriousRiskDisclosureMinimal: true,
        humanReviewPathExists: true, roleScopedDisclosureOnly: true,
        rawSafeguardingDisclosure: 'x',
      };
      expect(validateTask027SafeguardingReviewInput(input).ok).toBe(false);
    });
  });

  describe('validateTask027PrivacyReviewInput rejects forbidden fields', () => {
    it('rejects rawDeviceData', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        noRawLearnerData: true, noRawParentData: true, noRawTeacherNotes: true,
        noRawSafeguardingNotes: true, noPrivateDeenText: true, noProviderPayloads: true,
        noHiddenReasoning: true, minimalSafeMetadataOnly: true, roleScopedReportVisibility: true,
        rawDeviceData: 'x',
      };
      expect(validateTask027PrivacyReviewInput(input).ok).toBe(false);
    });
  });

  describe('no false positives on safe field names', () => {
    it('allows schoolId', () => {
      expect(rejectTask027ForbiddenFields({ schoolId: 's1' })).toEqual([]);
    });

    it('allows safeSummary', () => {
      expect(rejectTask027ForbiddenFields({ safeSummary: 'ok' })).toEqual([]);
    });

    it('allows nested safe fields', () => {
      expect(rejectTask027ForbiddenFields({ meta: { status: 'active', riskLevel: 'low' } })).toEqual([]);
    });

    it('allows arrays of safe objects', () => {
      expect(rejectTask027ForbiddenFields({ items: [{ name: 'test', value: 1 }] })).toEqual([]);
    });

    it('allows empty object', () => {
      expect(rejectTask027ForbiddenFields({})).toEqual([]);
    });
  });

  describe('additional validator rejection', () => {
    it('validateTask027DeenContentReviewInput rejects rawDeenText', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        approvedDeenSourcesVerified: true, deenContentPresent: false,
        noFatwaEngineBehavior: true, noPietyScoring: true, noSectarianJudgment: true,
        scholarReferralPathExists: true, contentSourcePolicyPassed: true,
        rawDeenText: 'sensitive',
      };
      expect(validateTask027SchoolAdminApprovalInput as any).toBeDefined();
      expect(validateTask027DeenContentReviewInput(input).ok).toBe(false);
    });

    it('validateTask027SocraticIntegrityReviewInput rejects rawAnswerKey', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        noFinalAnswerShortcut: true, noAnswerKeyLeakage: true,
        hintLadderPreserved: true, studentAgencyPreserved: true,
        reflectionPromptsPreserved: true, cheatingPreventionPreserved: true,
        teacherOnlyMaterialProtected: true,
        rawAnswerKey: 'key',
      };
      expect(validateTask027SocraticIntegrityReviewInput(input).ok).toBe(false);
    });

    it('validateTask027AcademicIntegrityReviewInput rejects rawRubricData', () => {
      const input = {
        schoolId: 's1', proposalId: 'p1', pilotRunId: 'r1',
        noAnswerKeyLeakage: true, noHomeworkShortcutPattern: true,
        noFinalAnswerFirstBehavior: true, noProtectedRubricLeakage: true,
        noExamBypass: true, studentEffortEvidenceExists: true,
        rawRubricData: 'rubric',
      };
      expect(validateTask027AcademicIntegrityReviewInput(input).ok).toBe(false);
    });
  });

  describe('multiple forbidden fields', () => {
    it('detects multiple forbidden fields in one object', () => {
      const result = rejectTask027ForbiddenFields({ rawStudentData: 'a', rawLearnerData: 'b', rawParentData: 'c' });
      expect(result.length).toBe(3);
    });
  });

  describe('null/undefined forbidden fields', () => {
    it('detects forbidden field set to null', () => {
      expect(rejectTask027ForbiddenFields({ rawStudentData: null }).length).toBe(1);
    });

    it('detects forbidden field set to empty string', () => {
      expect(rejectTask027ForbiddenFields({ rawLearnerData: '' }).length).toBe(1);
    });
  });
});
