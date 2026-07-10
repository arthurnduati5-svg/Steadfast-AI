import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTask034LearnerNoticeReadiness } from '../services/task034LearnerNoticeReadinessService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validNoticeInput() {
  return {
    noticeIsCalm: true,
    noticeIsAgeAppropriate: true,
    noticeIsNonAlarming: true,
    noticeMentionsThinkingFirst: true,
    noticeMentionsTeacherSupport: true,
    noInternalRolloutDetails: true,
    noRiskScores: true,
    noPrivateComparisons: true,
    noPietyScore: true,
    noClassmateComparison: true,
    noRawIncidentDetail: true,
    noAnswerArtifact: true,
  };
}

describe('Task034 Learner Notice Readiness', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid notice with all fields passes', () => {
    const result = evaluateTask034LearnerNoticeReadiness(validNoticeInput());
    expect(result.ok).toBe(true);
    expect(result.noticeIsCalm).toBe(true);
    expect(result.noticeIsAgeAppropriate).toBe(true);
    expect(result.noticeIsNonAlarming).toBe(true);
    expect(result.noticeNotActuallySent).toBe(true);
  });

  it('noticeIsCalm false fails', () => {
    const input = validNoticeInput();
    input.noticeIsCalm = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('noticeIsCalm_not_passed');
  });

  it('noticeIsAgeAppropriate false fails', () => {
    const input = validNoticeInput();
    input.noticeIsAgeAppropriate = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noticeIsNonAlarming false fails', () => {
    const input = validNoticeInput();
    input.noticeIsNonAlarming = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noticeMentionsThinkingFirst false fails', () => {
    const input = validNoticeInput();
    input.noticeMentionsThinkingFirst = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noticeMentionsTeacherSupport false fails', () => {
    const input = validNoticeInput();
    input.noticeMentionsTeacherSupport = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noInternalRolloutDetails false fails', () => {
    const input = validNoticeInput();
    input.noInternalRolloutDetails = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noRiskScores false fails', () => {
    const input = validNoticeInput();
    input.noRiskScores = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noPrivateComparisons false fails', () => {
    const input = validNoticeInput();
    input.noPrivateComparisons = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noPietyScore false fails', () => {
    const input = validNoticeInput();
    input.noPietyScore = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noClassmateComparison false fails', () => {
    const input = validNoticeInput();
    input.noClassmateComparison = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noRawIncidentDetail false fails', () => {
    const input = validNoticeInput();
    input.noRawIncidentDetail = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('noAnswerArtifact false fails', () => {
    const input = validNoticeInput();
    input.noAnswerArtifact = false;
    const result = evaluateTask034LearnerNoticeReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('stores result in repository', async () => {
    evaluateTask034LearnerNoticeReadiness(validNoticeInput());
    const stored = await task034Repository.getLearnerNoticeReadiness();
    expect(stored).not.toBeNull();
    expect(stored!.noticeIsCalm).toBe(true);
  });
});
