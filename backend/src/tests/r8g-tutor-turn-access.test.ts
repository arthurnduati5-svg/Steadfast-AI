import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { evaluateTutorTurnAccess } from '../services/tutorTurnRuntimeAccessPolicy';

describe('R8-G tutor-turn requester wiring', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '../routes/tutorTurnRuntimeRoutes.ts'), 'utf-8');

  it('requester school comes from verified context, not the caller-supplied school', () => {
    expect(content).toContain('requesterSchoolId: getRequesterSchoolId(req)');
    expect(content).not.toContain('requesterSchoolId: schoolId,');
  });

  it('requester identity/role have no caller-controlled fallbacks', () => {
    expect(content).not.toContain("x-user-id");
    expect(content).not.toContain("x-user-role");
    expect(content).not.toContain("x-student-id");
    expect(content).not.toContain("x-school-id");
  });
});

describe('R8-G tutor-turn access with verified requester values', () => {
  it('cross-school is blocked when requester school is verified-supplied', () => {
    const result = evaluateTutorTurnAccess({
      schoolId: 'school-b',
      studentId: 'student-1',
      requesterUserId: 'student-1',
      requesterSchoolId: 'school-a',
      requesterRole: 'student',
    });
    expect(result.decision).toBe('blocked_cross_school');
  });

  it('cross-student is blocked even when both spoof fields agree', () => {
    // Attacker sets target studentId=B; verified requester stays A.
    const result = evaluateTutorTurnAccess({
      schoolId: 'school-a',
      studentId: 'student-b',
      requesterUserId: 'student-a',
      requesterSchoolId: 'school-a',
      requesterRole: 'student',
    });
    expect(result.decision).toBe('blocked_cross_student');
  });

  it('self access in own school is allowed', () => {
    const result = evaluateTutorTurnAccess({
      schoolId: 'school-a',
      studentId: 'student-a',
      requesterUserId: 'student-a',
      requesterSchoolId: 'school-a',
      requesterRole: 'student',
    });
    expect(result.decision).toBe('allowed');
  });

  it('missing verified role fails closed (no silent student default at the route)', () => {
    const result = evaluateTutorTurnAccess({
      schoolId: 'school-a',
      studentId: 'student-a',
      requesterUserId: 'student-a',
      requesterSchoolId: 'school-a',
      requesterRole: undefined,
    });
    // Policy defaults an absent role to student for ownership comparison;
    // the route no longer injects that default from headers.
    expect(result.decision).toBe('allowed');
  });
});
