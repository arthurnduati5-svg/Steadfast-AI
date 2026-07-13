import { describe, it, expect } from 'vitest';
import { generateStudentSafeLaunchNotice } from '../services/task035StudentSafeLaunchNoticeService';

describe('task035StudentSafeLaunchNotice', () => {
  it('should generate a calm non-technical message that mentions guided learning and teacher help', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.ok).toBe(true);
    expect(result.noticeIsCalm).toBe(true);
    expect(result.noticeNonTechnical).toBe(true);
    expect(result.noticeMentionsGuidedLearning).toBe(true);
    expect(result.noticeMentionsTeacherHelp).toBe(true);
  });

  it('should contain no internal rollout details or private student status', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noInternalRolloutDetailsExposed).toBe(true);
    expect(result.noPrivateStudentStatus).toBe(true);
    expect(result.noOtherStudentInfo).toBe(true);
    expect(result.noTeacherOnlyNotes).toBe(true);
  });

  it('should contain no answer keys, AI provider details, or debug details', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noAnswerKeys).toBe(true);
    expect(result.noAiProviderDetails).toBe(true);
    expect(result.noDebugDetails).toBe(true);
  });

  it('should have a non-empty safe notice message without internal task identifiers', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.safeNoticeMessage.length).toBeGreaterThan(50);
    expect(result.safeNoticeMessage).not.toMatch(/task-\d+|rollout|gate|simulation/i);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should be marked as noticeReady when ok', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noticeReady).toBe(true);
  });
});
