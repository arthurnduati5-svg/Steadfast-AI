import { describe, it, expect } from 'vitest';
import {
  isRoleAllowedForMutation,
  isRoleAllowedForAction,
} from '../policies/recoveryCaseAdjudicationPolicyDefinitions';
import { ForbiddenAdjudicationActorRoles, ForbiddenAdjudicationEntityFields } from '../contracts';

describe('Package 26 - Role Scope and Privacy', () => {
  describe('isRoleAllowedForMutation', () => {
    it('teacher can create adjudication readiness', () => {
      expect(isRoleAllowedForMutation('teacher')).toBe(true);
      expect(isRoleAllowedForAction('teacher', 'createAdjudicationReadiness')).toBe(true);
    });

    it('lead_teacher can create consensus', () => {
      expect(isRoleAllowedForMutation('lead_teacher')).toBe(true);
      expect(isRoleAllowedForAction('lead_teacher', 'createConsensus')).toBe(true);
    });

    it('department_head can create disagreement resolution', () => {
      expect(isRoleAllowedForMutation('department_head')).toBe(true);
      expect(isRoleAllowedForAction('department_head', 'createDisagreementResolution')).toBe(true);
    });

    it('admin can inspect summaries', () => {
      expect(isRoleAllowedForMutation('admin')).toBe(true);
      expect(isRoleAllowedForAction('admin', 'inspectSchoolSummaries')).toBe(true);
    });

    it('system_job can calculate quality samples', () => {
      expect(isRoleAllowedForMutation('system_job')).toBe(true);
      expect(isRoleAllowedForAction('system_job', 'calculateQualitySample')).toBe(true);
    });

    it('student CANNOT create any adjudication record', () => {
      expect(isRoleAllowedForMutation('student')).toBe(false);
    });

    it('parent CANNOT create any adjudication record', () => {
      expect(isRoleAllowedForMutation('parent')).toBe(false);
    });

    it('guest CANNOT create any adjudication record', () => {
      expect(isRoleAllowedForMutation('guest')).toBe(false);
    });

    it('unknown CANNOT create any adjudication record', () => {
      expect(isRoleAllowedForMutation('unknown')).toBe(false);
    });
  });

  describe('ForbiddenAdjudicationActorRoles', () => {
    it('contains student, parent, guest, unknown', () => {
      expect(ForbiddenAdjudicationActorRoles).toContain('student');
      expect(ForbiddenAdjudicationActorRoles).toContain('parent');
      expect(ForbiddenAdjudicationActorRoles).toContain('guest');
      expect(ForbiddenAdjudicationActorRoles).toContain('unknown');
    });

    it('does not contain allowed roles', () => {
      expect(ForbiddenAdjudicationActorRoles).not.toContain('teacher');
      expect(ForbiddenAdjudicationActorRoles).not.toContain('lead_teacher');
      expect(ForbiddenAdjudicationActorRoles).not.toContain('department_head');
      expect(ForbiddenAdjudicationActorRoles).not.toContain('admin');
      expect(ForbiddenAdjudicationActorRoles).not.toContain('system_job');
    });
  });

  describe('ForbiddenAdjudicationEntityFields', () => {
    it('contains the required sensitive fields', () => {
      const required = [
        'rawStudentAnswer', 'correctAnswerSummary', 'rawRubric',
        'chainOfThought', 'unreleasedScore', 'unreleasedGrade',
        'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
        'race', 'ethnicity', 'genderIdentity',
        'familyIncome', 'paymentStatus', 'parentEngagementScore',
        'aiDecision', 'modelOutput',
        'notificationPayload', 'emailPayload', 'smsPayload',
        'liveAssignmentPayload', 'scoreMutationPayload',
        'masteryMutationPayload', 'pdfBuffer',
      ];
      for (const field of required) {
        expect(ForbiddenAdjudicationEntityFields).toContain(field);
      }
    });

    it('does not contain safe field names', () => {
      const safe = [
        'adjudicationReadinessId', 'schoolId', 'studentRef',
        'safeReadinessSummary', 'blockedReasonCodes', 'sourceRefs',
        'createdByActorId', 'createdByRole', 'createdAt',
      ];
      for (const field of safe) {
        expect(ForbiddenAdjudicationEntityFields).not.toContain(field);
      }
    });

    it('forbidden entity fields are not stored on any contract interface', () => {
      const storedFields = [
        'adjudicationReadinessId', 'schoolId', 'studentRef',
        'resultRecoveryPlanId', 'queueItemId', 'readinessStatus',
        'safeReadinessSummary', 'blockedReasonCodes', 'sourceRefs',
        'createdByActorId', 'createdByRole', 'createdAt', 'updatedAt',
      ];
      for (const forbidden of ForbiddenAdjudicationEntityFields) {
        expect(storedFields).not.toContain(forbidden);
      }
    });
  });
});
