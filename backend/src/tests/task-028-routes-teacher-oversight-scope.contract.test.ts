import { describe, it, expect } from 'vitest';
import { TASK028_TEACHER_OVERSIGHT_STATUSES, TASK028_ACTOR_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';
import { validateTask028TeacherOversightInput } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesTeacherOversightScope', () => {
  it('healthy oversight status is defined', () => {
    expect(TASK028_TEACHER_OVERSIGHT_STATUSES).toContain('healthy');
  });

  it('watch oversight status is defined', () => {
    expect(TASK028_TEACHER_OVERSIGHT_STATUSES).toContain('watch');
  });

  it('needs_review oversight status is defined', () => {
    expect(TASK028_TEACHER_OVERSIGHT_STATUSES).toContain('needs_review');
  });

  it('critical oversight status is defined', () => {
    expect(TASK028_TEACHER_OVERSIGHT_STATUSES).toContain('critical');
  });

  it('teacher_assigned_to_expansion is a valid actor role', () => {
    expect(TASK028_ACTOR_ROLES).toContain('teacher_assigned_to_expansion');
  });

  it('validateTask028TeacherOversightInput requires teacherId', () => {
    const errors = validateTask028TeacherOversightInput({ runId: 'r1', schoolId: 's1' });
    expect(errors).toContain('teacherId_required');
  });

  it('validateTask028TeacherOversightInput requires runId', () => {
    const errors = validateTask028TeacherOversightInput({ schoolId: 's1', teacherId: 't1' });
    expect(errors).toContain('runId_required');
  });

  it('validateTask028TeacherOversightInput requires schoolId', () => {
    const errors = validateTask028TeacherOversightInput({ runId: 'r1', teacherId: 't1' });
    expect(errors).toContain('schoolId_required');
  });
});
