import { describe, it, expect } from 'vitest';
import { validateTeacherWorkflow } from '../services/task025TeacherWorkflowValidationService';

describe('validateTeacherWorkflow', () => {
  it('returns validated status when all conditions pass', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 5,
      validatedTeachers: 5,
      allTeachersUnderstandScope: true,
      escalationPathKnown: true,
      privacyBoundaryUnderstood: true,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_validated');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('All 5/5 teachers validated');
  });

  it('returns blocked with high risk when teacherCount is 0', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 0,
      validatedTeachers: 0,
      allTeachersUnderstandScope: false,
      escalationPathKnown: false,
      privacyBoundaryUnderstood: false,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/no teachers available/i);
  });

  it('adds blocker when not all teachers are validated', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 10,
      validatedTeachers: 7,
      allTeachersUnderstandScope: true,
      escalationPathKnown: true,
      privacyBoundaryUnderstood: true,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_pending');
    expect(result.riskLevel).toBe('medium');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/3 teacher.*not been validated/i);
  });

  it('adds high blocker when teachers do not understand scope', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 2,
      validatedTeachers: 2,
      allTeachersUnderstandScope: false,
      escalationPathKnown: true,
      privacyBoundaryUnderstood: true,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/not all teachers understand the pilot scope/i);
  });

  it('adds high blocker when escalation path is not known', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 3,
      validatedTeachers: 3,
      allTeachersUnderstandScope: true,
      escalationPathKnown: false,
      privacyBoundaryUnderstood: true,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/do not know the escalation path/i);
  });

  it('adds high blocker when privacy boundary is not understood', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 4,
      validatedTeachers: 4,
      allTeachersUnderstandScope: true,
      escalationPathKnown: true,
      privacyBoundaryUnderstood: false,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
    expect(result.safeBlockers[0].safeDescription).toMatch(/do not understand privacy boundaries/i);
  });

  it('accumulates multiple blockers for combined failures', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 3,
      validatedTeachers: 1,
      allTeachersUnderstandScope: false,
      escalationPathKnown: false,
      privacyBoundaryUnderstood: false,
    });

    expect(result.teacherWorkflowStatus).toBe('teacher_workflow_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers).toHaveLength(4);
    expect(result.safeBlockers.every((b) => b.type === 'teacher_workflow')).toBe(true);
    expect(result.safeSummary).toContain('4 issue(s)');
  });
});
