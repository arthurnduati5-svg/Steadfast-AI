import { describe, it, expect } from 'vitest';
import { runTask031TutorSessionContextSmoke } from '../services/task031TutorSessionContextSmokeService';

describe('Task 031 - cross-school access denial in tutor context smoke', () => {
  it('should have crossSchoolDenied true with same school fixture', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.crossSchoolDenied).toBe(true);
    expect(result.crossLearnerDenied).toBe(true);
    expect(result.schoolIdRequired).toBe(true);
    expect(result.studentIdRequired).toBe(true);
  });

  it('should enforce role scope for student', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.roleScopeEnforced).toBe(true);
    expect(result.unknownDenied).toBe(true);
  });

  it('should not expose raw messages or invoke AI', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.rawMessagesExposed).toBe(false);
    expect(result.aiProviderInvoked).toBe(false);
    expect(result.safeSessionState).toBe(true);
  });

  it('should restrict teacher access', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.teacherAccessRestricted).toBe(true);
  });
});
