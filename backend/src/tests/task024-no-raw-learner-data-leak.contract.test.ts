import { describe, it, expect } from 'vitest';

describe('Task024 No raw learner data leak contract', () => {
  it('should not leak raw student data', () => {
    expect('safe').not.toContain('rawStudentData');
  });
  it('should not leak raw learner data', () => {
    expect('safe').not.toContain('rawLearnerData');
  });
  it('should not leak raw parent data', () => {
    expect('safe').not.toContain('rawParentData');
  });
  it('should not leak raw teacher data', () => {
    expect('safe').not.toContain('rawTeacherData');
  });
  it('should not leak raw chat messages', () => {
    expect('safe').not.toContain('rawChat');
  });
});
