import { describe, it, expect } from 'vitest';
import { generateStudentSafeLaunchNotice } from '../services/task035StudentSafeLaunchNoticeService';

describe('task035 continuity from task031 (staging smoke)', () => {
  it('student safe launch notice importable', () => {
    expect(typeof generateStudentSafeLaunchNotice).toBe('function');
  });

  it('notice is calm and non-technical', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noticeIsCalm).toBe(true);
    expect(result.noticeNonTechnical).toBe(true);
    expect(result.noticeMentionsGuidedLearning).toBe(true);
  });

  it('notice mentions teacher help', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noticeMentionsTeacherHelp).toBe(true);
  });

  it('notice has no internal rollout details', () => {
    const result = generateStudentSafeLaunchNotice();
    expect(result.noInternalRolloutDetailsExposed).toBe(true);
    expect(result.noPrivateStudentStatus).toBe(true);
    expect(result.noAnswerKeys).toBe(true);
  });
});
