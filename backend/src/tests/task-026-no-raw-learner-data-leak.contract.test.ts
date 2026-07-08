import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoRawLearnerDataLeak', () => {
  it('rawStudentData is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawStudentData');
  });

  it('rawLearnerData is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawLearnerData');
  });

  it('rawParentData is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawParentData');
  });

  it('rawTeacherData is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawTeacherData');
  });

  it('rawStudentProfile is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawStudentProfile');
  });

  it('rawParentProfile is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawParentProfile');
  });

  it('rawTeacherProfile is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawTeacherProfile');
  });

  it('rejectTask026ForbiddenFields blocks rawLearnerData', () => {
    expect(rejectTask026ForbiddenFields({ rawLearnerData: 'leaked' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks rawStudentProfile', () => {
    expect(rejectTask026ForbiddenFields({ rawStudentProfile: { name: 'test' } })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks nested rawTeacherData', () => {
    expect(rejectTask026ForbiddenFields({ meta: { rawTeacherData: 'leaked' } })).not.toBeNull();
  });
});
