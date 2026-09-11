import { describe, it, expect } from 'vitest';
import {
  buildVerifiedActorContext,
  enforceVerifiedLearnerScope,
  getVerifiedActorId,
  getVerifiedActorRole,
  getVerifiedSchoolId,
} from '../lib/verifiedActorContext';

function req(overrides: Record<string, unknown> = {}): any {
  return overrides;
}

describe('R8-G verified actor context', () => {
  it('derives identity exclusively from verified server context', () => {
    const context = buildVerifiedActorContext(
      req({ schoolId: 'school-verified', user: { id: 'user-1', role: 'teacher', schoolId: 'school-verified' } }),
    );
    expect(context).toEqual({ schoolId: 'school-verified', actorId: 'user-1', role: 'teacher' });
  });

  it('ignores caller-controlled transports (no header/query/body reads)', () => {
    const context = buildVerifiedActorContext(
      req({
        schoolId: 'school-verified',
        user: { id: 'user-1', role: 'student', schoolId: 'school-verified' },
        headers: { 'x-school-id': 'school-spoofed', 'x-actor-id': 'spoofed', 'x-actor-role': 'admin' },
        query: { schoolId: 'school-spoofed', studentId: 'spoofed' },
        body: { schoolId: 'school-spoofed', actorRole: 'admin' },
      }),
    );
    expect(context.schoolId).toBe('school-verified');
    expect(context.actorId).toBe('user-1');
    expect(context.role).toBe('student');
  });

  it('returns empty identity when verified context is missing (fail-closed)', () => {
    expect(getVerifiedSchoolId(req({}))).toBe('');
    expect(getVerifiedActorId(req({}))).toBe('');
    expect(getVerifiedActorRole(req({}))).toBe('');
  });

  it('prefers req.schoolId set by requireVerifiedSchoolContext', () => {
    expect(
      getVerifiedSchoolId(req({ schoolId: 'guard-school', user: { id: 'u', schoolId: 'token-school' } })),
    ).toBe('guard-school');
  });
});

describe('R8-G verified learner scope enforcement', () => {
  const studentReq = () =>
    req({ schoolId: 'school-a', user: { id: 'student-1', role: 'student', schoolId: 'school-a' } });

  it('student addressing self in own school is allowed', () => {
    expect(enforceVerifiedLearnerScope(studentReq(), 'student-1', 'school-a')).toEqual({ ok: true });
  });

  it('student addressing another learner is blocked (cross-student)', () => {
    const verdict = enforceVerifiedLearnerScope(studentReq(), 'student-2', 'school-a');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.status).toBe(403);
      expect(verdict.reasonCodes).toContain('cross_student_blocked');
    }
  });

  it('student addressing another school is blocked (cross-school)', () => {
    const verdict = enforceVerifiedLearnerScope(studentReq(), 'student-1', 'school-b');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.status).toBe(403);
      expect(verdict.reasonCodes).toContain('cross_school_blocked');
    }
  });

  it('teacher addressing a learner in own school is allowed', () => {
    const teacher = req({ schoolId: 'school-a', user: { id: 'teacher-1', role: 'teacher', schoolId: 'school-a' } });
    expect(enforceVerifiedLearnerScope(teacher, 'student-9', 'school-a')).toEqual({ ok: true });
  });

  it('teacher addressing another school is blocked', () => {
    const teacher = req({ schoolId: 'school-a', user: { id: 'teacher-1', role: 'teacher', schoolId: 'school-a' } });
    const verdict = enforceVerifiedLearnerScope(teacher, 'student-9', 'school-b');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reasonCodes).toContain('cross_school_blocked');
  });

  it('missing verified identity is denied without trusting the target', () => {
    const verdict = enforceVerifiedLearnerScope(req({}), 'student-1', 'school-a');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.status).toBe(401);
  });

  it('unknown role is denied (fail-closed, no silent student default)', () => {
    const unknown = req({ schoolId: 'school-a', user: { id: 'user-x', role: 'mystery', schoolId: 'school-a' } });
    const verdict = enforceVerifiedLearnerScope(unknown, 'user-x', 'school-a');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.status).toBe(403);
  });
});
