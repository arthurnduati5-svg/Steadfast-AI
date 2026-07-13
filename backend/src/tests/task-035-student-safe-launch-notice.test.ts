import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Student Safe Launch Notice', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035StudentSafeLaunchNoticeService');
  });

  it('should export generateStudentSafeLaunchNotice function', () => {
    expect(typeof service.generateStudentSafeLaunchNotice).toBe('function');
  });

  it('should return a calm, non-technical notice', () => {
    const result = service.generateStudentSafeLaunchNotice();
    expect(result.ok).toBe(true);
    expect(result.noticeReady).toBe(true);
    expect(result.noticeIsCalm).toBe(true);
    expect(result.noticeNonTechnical).toBe(true);
    expect(result.noInternalRolloutDetailsExposed).toBe(true);
    expect(result.noPrivateStudentStatus).toBe(true);
    expect(result.noTeacherOnlyNotes).toBe(true);
    expect(result.noAnswerKeys).toBe(true);
  });

  it('should mention guided learning and teacher help', () => {
    const result = service.generateStudentSafeLaunchNotice();
    expect(result.noticeMentionsGuidedLearning).toBe(true);
    expect(result.noticeMentionsTeacherHelp).toBe(true);
  });

  it('should not contain internal rollout details', () => {
    const result = service.generateStudentSafeLaunchNotice();
    expect(result.safeNoticeMessage).not.toMatch(/task-\d+|rollout|gate|simulation/);
  });
});
