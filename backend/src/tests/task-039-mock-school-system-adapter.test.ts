import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';

describe('Task 039 — Mock School System Adapter', () => {
  beforeEach(async () => {
    const mod = await import('../services/mockSchoolSystemAdapter');
    // no state to clear for mock adapter
  });

  it('returns synthetic student identity', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getVerifiedSchoolIdentity();
    expect(identity.schoolId).toBe('mock-school-001');
    expect(identity.externalUserId).toBeTruthy();
    expect(identity.role).toBe('student');
    expect(identity.externalStudentId).toMatch(/^mock-/);
  });

  it('returns synthetic teacher identity', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getVerifiedTeacherIdentity();
    expect(identity.role).toBe('teacher');
    expect(identity.externalTeacherId).toMatch(/^mock-/);
  });

  it('returns synthetic admin identity', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getVerifiedAdminIdentity();
    expect(identity.role).toBe('school_admin');
  });

  it('returns missing school context', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getMissingSchoolContext();
    expect(identity.schoolId).toBe('');
  });

  it('returns expired identity', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getExpiredIdentity();
    expect(identity.expiresAt).toBeTruthy();
    const expires = new Date(identity.expiresAt!);
    expect(expires.getTime()).toBeLessThan(Date.now());
  });

  it('returns revoked identity payload', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getRevokedIdentityPayload();
    expect(identity.expiresAt).toBeTruthy();
    const expires = new Date(identity.expiresAt!);
    expect(expires.getTime()).toBeLessThan(Date.now() - 86400000 * 30);
  });

  it('returns invalid role identity', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const identity = mockSchoolSystemAdapter.getInvalidRoleIdentity();
    expect(identity.role).toBe('invalid_role_xyz');
  });

  it('returns duplicate student roster input', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const roster = mockSchoolSystemAdapter.getDuplicateStudentRecord();
    expect(roster.students.length).toBe(2);
    expect(roster.students[0].externalStudentId).toBe(roster.students[1].externalStudentId);
  });

  it('returns full mock roster input', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const roster = mockSchoolSystemAdapter.getFullMockRosterInput();
    expect(roster.students.length).toBeGreaterThan(0);
    expect(roster.teachers.length).toBeGreaterThan(0);
    expect(roster.classes.length).toBeGreaterThan(0);
    expect(roster.subjects.length).toBeGreaterThan(0);
    expect(roster.enrollments.length).toBeGreaterThan(0);
    expect(roster.teacherAssignments.length).toBeGreaterThan(0);
  });

  it('all data uses synthetic/fake identifiers', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const roster = mockSchoolSystemAdapter.getFullMockRosterInput();
    for (const student of roster.students) {
      expect(student.name).toMatch(/^Fake /);
    }
    for (const teacher of roster.teachers) {
      expect(teacher.name).toMatch(/^Fake /);
    }
    for (const cls of roster.classes) {
      expect(cls.name).toMatch(/^Fake /);
    }
    for (const subject of roster.subjects) {
      expect(subject.name).toMatch(/^Fake /);
    }
  });

  it('mock adapter source file has no network imports', async () => {
    const source = readFileSync('backend/src/services/mockSchoolSystemAdapter.ts', 'utf-8');
    expect(source).not.toContain('axios');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('http');
  });
});
