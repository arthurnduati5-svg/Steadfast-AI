import { describe, it, expect } from 'vitest';
import { createTask031StagingSchoolIdentityFixture, validateTask031Fixture } from '../services/task031StagingSchoolIdentityFixtureService';

describe('Task 031 - POST /fixtures/synthetic-staging-school contract', () => {
  it('should create a valid safe fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const validation = validateTask031Fixture(fixture);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toHaveLength(0);
    expect(fixture.schoolId).toContain('task031_safe');
    expect(fixture.tenantId).toContain('task031_safe');
    expect(fixture.studentActorIdHash).toContain('task031_safe');
    expect(fixture.teacherActorIdHash).toContain('task031_safe');
  });

  it('should provide all role auth contexts', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.adminAuthContext.role).toBe('admin');
    expect(fixture.operatorAuthContext.role).toBe('operator');
    expect(fixture.teacherAuthContext.role).toBe('teacher');
    expect(fixture.studentAuthContext.role).toBe('student');
    expect(fixture.unknownAuthContext.role).toBe('unknown');
  });
});
