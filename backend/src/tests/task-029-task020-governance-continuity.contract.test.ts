import { describe, it, expect } from 'vitest';
import {
  TASK020_FORBIDDEN_FIELDS,
  TASK020_DATA_CLASSIFICATION_LEVELS,
  TASK020_DATA_CATEGORIES,
  TASK020_ACTOR_ROLES,
  TASK020_ACCESS_DECISIONS,
  TASK020_VISIBILITY_SCOPES,
  TASK020_EGRESS_DECISIONS,
} from '../contracts/task020SecurityPrivacyGovernanceContracts';
import { TASK029_FORBIDDEN_FIELDS } from '../contracts/task029ExpansionOperationsContracts';

describe('Task029 preserves Task020 governance continuity', () => {
  it('exports TASK020_FORBIDDEN_FIELDS as a non-empty tuple', () => {
    expect(TASK020_FORBIDDEN_FIELDS.length).toBeGreaterThan(10);
  });

  it('exports TASK020_DATA_CLASSIFICATION_LEVELS including learner_private', () => {
    expect(TASK020_DATA_CLASSIFICATION_LEVELS).toContain('learner_private');
    expect(TASK020_DATA_CLASSIFICATION_LEVELS).toContain('safeguarding_restricted');
  });

  it('exports TASK020_DATA_CATEGORIES including safeguarding_signal', () => {
    expect(TASK020_DATA_CATEGORIES).toContain('safeguarding_signal');
    expect(TASK020_DATA_CATEGORIES).toContain('credential');
  });

  it('exports TASK020_ACTOR_ROLES including student and teacher', () => {
    expect(TASK020_ACTOR_ROLES).toContain('student');
    expect(TASK020_ACTOR_ROLES).toContain('teacher');
  });

  it('exports TASK020_ACCESS_DECISIONS including deny and teacher_mediated', () => {
    expect(TASK020_ACCESS_DECISIONS).toContain('deny');
    expect(TASK020_ACCESS_DECISIONS).toContain('teacher_mediated');
  });

  it('exports TASK020_EGRESS_DECISIONS including deny_raw', () => {
    expect(TASK020_EGRESS_DECISIONS).toContain('deny_raw');
  });

  it('TASK029_FORBIDDEN_FIELDS references rawStudentData from TASK020 style', () => {
    expect(TASK029_FORBIDDEN_FIELDS).toContain('rawStudentData');
  });
});
