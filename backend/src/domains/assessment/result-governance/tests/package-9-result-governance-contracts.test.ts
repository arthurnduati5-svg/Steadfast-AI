import { describe, it, expect } from 'vitest';
import {
  RESULT_GOVERNANCE_POLICY_FAMILIES,
  ResultGovernancePolicyRegistry,
  isAllowedMutationRole,
  isBlockedMutationRole,
} from '../policies/resultGovernancePolicyDefinitions';
import { FORBIDDEN_FIELDS_STUDENT, FORBIDDEN_FIELDS_PARENT } from '../contracts/releaseReadinessContracts';

describe('Package 9 - Result Governance Contracts', () => {
  it('should define all 8 policy families', () => {
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_FINALIZATION_REVIEW');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_FINALIZATION_DECISION');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_RELEASE_READINESS');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_RELEASE_BOUNDARY');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_REGRADE_REQUEST');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_REGRADE_INTAKE');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_GOVERNANCE_PROJECTION');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES).toContain('RESULT_GOVERNANCE_AUDIT');
    expect(RESULT_GOVERNANCE_POLICY_FAMILIES.length).toBe(8);
  });

  it('should allow teacher role for mutation', () => {
    expect(isAllowedMutationRole('teacher')).toBe(true);
    expect(isAllowedMutationRole('admin')).toBe(true);
    expect(isAllowedMutationRole('system_job')).toBe(true);
  });

  it('should block student and parent roles for mutation', () => {
    expect(isAllowedMutationRole('student')).toBe(false);
    expect(isAllowedMutationRole('parent')).toBe(false);
    expect(isAllowedMutationRole('guest')).toBe(false);
  });

  it('should identify blocked mutation roles', () => {
    expect(isBlockedMutationRole('student')).toBe(true);
    expect(isBlockedMutationRole('parent')).toBe(true);
    expect(isBlockedMutationRole('guest')).toBe(true);
    expect(isBlockedMutationRole('teacher')).toBe(false);
  });

  it('should check policy via registry', () => {
    const registry = new ResultGovernancePolicyRegistry();
    const teacherCheck = registry.checkPolicy('RESULT_FINALIZATION_REVIEW', 'teacher');
    expect(teacherCheck.allowed).toBe(true);

    const studentCheck = registry.checkPolicy('RESULT_FINALIZATION_REVIEW', 'student');
    expect(studentCheck.allowed).toBe(false);

    const parentCheck = registry.checkPolicy('RESULT_FINALIZATION_DECISION', 'parent');
    expect(parentCheck.allowed).toBe(false);
  });

  it('should return blocked for missing policy', () => {
    const registry = new ResultGovernancePolicyRegistry({});
    const policy = registry.getPolicy('RESULT_FINALIZATION_REVIEW' as any);
    expect(policy.status).toBe('MISSING');
    expect(policy.allowed).toBe(false);
  });

  it('should verify school context', () => {
    const registry = new ResultGovernancePolicyRegistry();
    expect(registry.isSchoolContextVerified('school-123')).toBe(true);
    expect(registry.isSchoolContextVerified('')).toBe(false);
  });

  it('should check student own request', () => {
    const registry = new ResultGovernancePolicyRegistry();
    expect(registry.isStudentOwnRequest('student-1', 'student-1', 'student')).toBe(true);
    expect(registry.isStudentOwnRequest('student-1', 'student-2', 'student')).toBe(false);
    expect(registry.isStudentOwnRequest('student-1', 'student-1', 'teacher')).toBe(false);
  });

  it('should define student forbidden fields', () => {
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('answerKeyText');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('rubricInternal');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('hiddenReasoning');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('teacherOnlyNotes');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('rawStudentAnswer');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('scoreBeforeFinalization');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('unreleasedScore');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('parentDeliveryPayload');
    expect(FORBIDDEN_FIELDS_STUDENT).toContain('masteryMutation');
    expect(FORBIDDEN_FIELDS_STUDENT).not.toContain('studentRef');
  });

  it('should define parent forbidden fields', () => {
    expect(FORBIDDEN_FIELDS_PARENT).toContain('answerKeyText');
    expect(FORBIDDEN_FIELDS_PARENT).toContain('rubricInternal');
    expect(FORBIDDEN_FIELDS_PARENT).toContain('hiddenReasoning');
    expect(FORBIDDEN_FIELDS_PARENT).toContain('finalGradeBeforeRelease');
    expect(FORBIDDEN_FIELDS_PARENT).toContain('parentDeliveryPayload');
    expect(FORBIDDEN_FIELDS_PARENT).toContain('masteryMutation');
    expect(FORBIDDEN_FIELDS_PARENT).not.toContain('studentRef');
  });
});
