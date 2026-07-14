import { describe, it, expect } from 'vitest';
import {
  ALLOWED_MUTATION_ROLES,
  BLOCKED_MUTATION_ROLES,
  isAllowedMutationRole,
  isBlockedMutationRole,
} from '../contracts/resultLearningEvidenceContracts';
import {
  STUDENT_SAFE_FIELDS,
  PARENT_BOUNDARY_FIELDS,
  FORBIDDEN_FIELDS_STUDENT_PARENT,
} from '../contracts/resultLearningEvidenceProjectionContracts';
import { ResultLearningEvidencePolicyRegistry, RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES } from '../policies/resultLearningEvidencePolicyDefinitions';

describe('Package 10 - Result Learning Evidence Contracts', () => {
  it('should export ALLOWED_MUTATION_ROLES', () => {
    expect(ALLOWED_MUTATION_ROLES).toContain('teacher');
    expect(ALLOWED_MUTATION_ROLES).toContain('admin');
    expect(ALLOWED_MUTATION_ROLES).toContain('system_job');
  });

  it('should export BLOCKED_MUTATION_ROLES', () => {
    expect(BLOCKED_MUTATION_ROLES).toContain('student');
    expect(BLOCKED_MUTATION_ROLES).toContain('parent');
    expect(BLOCKED_MUTATION_ROLES).toContain('guest');
  });

  it('isAllowedMutationRole should return true for allowed roles', () => {
    expect(isAllowedMutationRole('teacher')).toBe(true);
    expect(isAllowedMutationRole('admin')).toBe(true);
  });

  it('isAllowedMutationRole should return false for blocked roles', () => {
    expect(isAllowedMutationRole('student')).toBe(false);
    expect(isAllowedMutationRole('parent')).toBe(false);
  });

  it('isBlockedMutationRole should return true for blocked roles', () => {
    expect(isBlockedMutationRole('student')).toBe(true);
    expect(isBlockedMutationRole('parent')).toBe(true);
  });

  it('isBlockedMutationRole should return false for allowed roles', () => {
    expect(isBlockedMutationRole('teacher')).toBe(false);
  });

  it('STUDENT_SAFE_FIELDS should not include forbidden fields', () => {
    expect(STUDENT_SAFE_FIELDS).not.toContain('answerKeyText');
    expect(STUDENT_SAFE_FIELDS).not.toContain('rawRubric');
    expect(STUDENT_SAFE_FIELDS).not.toContain('rawStudentAnswer');
    expect(STUDENT_SAFE_FIELDS).not.toContain('hiddenReasoning');
  });

  it('PARENT_BOUNDARY_FIELDS should not include report card or parent delivery payload', () => {
    expect(PARENT_BOUNDARY_FIELDS).not.toContain('parentDeliveryPayload');
    expect(PARENT_BOUNDARY_FIELDS).not.toContain('reportCardPayload');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include answer key fields', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('answerKeyText');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('correctAnswerSummary');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include rubric fields', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('rubricInternal');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('rawRubric');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include raw student answer', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('rawStudentAnswer');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include hidden reasoning', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('hiddenReasoning');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('chainOfThought');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include unreleased grades', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('scoreBeforeFinalization');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('unreleasedScore');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include parent/report payloads', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('parentDeliveryPayload');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('reportCardPayload');
  });

  it('FORBIDDEN_FIELDS_STUDENT_PARENT should include raw mastery delta', () => {
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('rawMasteryDelta');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('beforeStateJson');
    expect(FORBIDDEN_FIELDS_STUDENT_PARENT).toContain('afterStateJson');
  });

  it('RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES should be defined', () => {
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toBeDefined();
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES.length).toBeGreaterThan(0);
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_LEARNING_EVIDENCE_INTAKE');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_OBJECTIVE_IMPACT_MAPPING');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_MASTERY_MUTATION_PLANNING');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_MASTERY_MUTATION_APPROVAL');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_MASTERY_MUTATION_APPLICATION');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_REVISION_SIGNAL_DISPATCH');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_GROWTH_SIGNAL_DISPATCH');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_LEARNING_EVIDENCE_PROJECTION');
    expect(RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES).toContain('RESULT_LEARNING_EVIDENCE_AUDIT');
  });

  it('PolicyRegistry should block missing policy by default', () => {
    const registry = new ResultLearningEvidencePolicyRegistry({} as any);
    const result = registry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', 'teacher');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toContain('BLOCKED');
  });

  it('PolicyRegistry should allow teacher for configured intake policy', () => {
    const registry = new ResultLearningEvidencePolicyRegistry();
    const result = registry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', 'teacher');
    expect(result.allowed).toBe(true);
  });

  it('PolicyRegistry should block student for mutation policies', () => {
    const registry = new ResultLearningEvidencePolicyRegistry();
    const result = registry.checkPolicy('RESULT_MASTERY_MUTATION_APPLICATION', 'student');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toContain('ROLE_BLOCKED');
  });

  it('PolicyRegistry should block parent for mutation policies', () => {
    const registry = new ResultLearningEvidencePolicyRegistry();
    const result = registry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', 'parent');
    expect(result.allowed).toBe(false);
  });
});
