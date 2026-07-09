import { describe, it, expect } from 'vitest';
import { runTask031TutorSessionContextSmoke } from '../services/task031TutorSessionContextSmokeService';

describe('Task 031 - Tutor Session Context Smoke', () => {
  it('should pass with valid input', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should require school ID', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.schoolIdRequired).toBe(true);
  });

  it('should require student ID', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.studentIdRequired).toBe(true);
  });

  it('should enforce role scope', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.roleScopeEnforced).toBe(true);
  });

  it('should deny cross-school access', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.crossSchoolDenied).toBe(true);
  });

  it('should deny cross-learner access', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.crossLearnerDenied).toBe(true);
  });

  it('should keep session state safe', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.safeSessionState).toBe(true);
  });

  it('should not expose raw messages', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.rawMessagesExposed).toBe(false);
  });

  it('should not invoke AI provider', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.aiProviderInvoked).toBe(false);
  });

  it('should deny unknown actors', async () => {
    const result = await runTask031TutorSessionContextSmoke({});
    expect(result.unknownDenied).toBe(true);
  });
});