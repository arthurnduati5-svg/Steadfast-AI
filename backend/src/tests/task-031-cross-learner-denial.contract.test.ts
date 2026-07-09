import { describe, it, expect } from 'vitest';
import { runTask031TutorSessionContextSmoke } from '../services/task031TutorSessionContextSmokeService';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';

describe('Task 031 - cross-learner access is denied', () => {
  it('should deny cross-learner access in tutor context', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.crossLearnerDenied).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('should require student id for session', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.studentIdRequired).toBe(true);
  });

  it('should require school id for session', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.schoolIdRequired).toBe(true);
  });

  it('should block unknown actors', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.unknownDenied).toBe(true);
  });

  it('should keep session state safe without raw messages', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.safeSessionState).toBe(true);
    expect(result.rawMessagesExposed).toBe(false);
  });

  it('should create a fixture with cross-learner-safe identifiers', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.studentActorIdHash).toContain('task031_safe');
    expect(fixture.teacherActorIdHash).not.toBe(fixture.studentActorIdHash);
  });
});
