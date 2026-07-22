import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Package 5 - No Duplication', () => {
  const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
  const schemaContent = readFileSync(schemaPath, 'utf-8');

  function modelExists(name: string): boolean {
    const regex = new RegExp(`^model\\s+${name}\\s*{`, 'm');
    return regex.test(schemaContent);
  }

  it('MarkingRunRecord exists', () => {
    expect(modelExists('MarkingRunRecord')).toBe(true);
  });

  it('MarkingResultVersionRecord exists', () => {
    expect(modelExists('MarkingResultVersionRecord')).toBe(true);
  });

  it('MarkingBreakdownItemRecord exists', () => {
    expect(modelExists('MarkingBreakdownItemRecord')).toBe(true);
  });

  it('ScoringSuggestionRecord exists', () => {
    expect(modelExists('ScoringSuggestionRecord')).toBe(true);
  });

  it('TeacherReviewItemRecord exists', () => {
    expect(modelExists('TeacherReviewItemRecord')).toBe(true);
  });

  it('TeacherReviewGroupRecord exists', () => {
    expect(modelExists('TeacherReviewGroupRecord')).toBe(true);
  });

  it('TeacherOverrideRecord exists', () => {
    expect(modelExists('TeacherOverrideRecord')).toBe(true);
  });

  it('ModerationDecisionRecord exists', () => {
    expect(modelExists('ModerationDecisionRecord')).toBe(true);
  });

  it('StudentMarkChallengeRecord exists', () => {
    expect(modelExists('StudentMarkChallengeRecord')).toBe(true);
  });

  it('ExamModeAttemptRecord is not duplicated (still exists)', () => {
    expect(modelExists('ExamModeAttemptRecord')).toBe(true);
  });

  it('ExamModeQuestionStateRecord is not duplicated (still exists)', () => {
    expect(modelExists('ExamModeQuestionStateRecord')).toBe(true);
  });

  it('PracticeAttempt is not duplicated (still exists)', () => {
    expect(modelExists('PracticeAttempt')).toBe(true);
  });

  it('SkillMasterySnapshot is not duplicated (still exists)', () => {
    expect(modelExists('SkillMasterySnapshot')).toBe(true);
  });

  it('RubricVersionRecord is not duplicated (still exists)', () => {
    expect(modelExists('RubricVersionRecord')).toBe(true);
  });

  it('AnswerKeyVersionRecord is not duplicated (still exists)', () => {
    expect(modelExists('AnswerKeyVersionRecord')).toBe(true);
  });

  it('ContentReviewRecord is not duplicated (still exists)', () => {
    expect(modelExists('ContentReviewRecord')).toBe(true);
  });

  const forbiddenModels = [
    'StudentQuestionAttemptRecord',
    'OCRRecord',
    'ParentSummaryRecord',
    'FinalizationRecord',
    'RegradingRecord',
    'MarkingResultRecord',
    'SkillMasterySnapshotDuplicate',
    'PracticeAttemptDuplicate',
    'RubricVersionDuplicate',
  ];

  for (const name of forbiddenModels) {
    it(`${name} does not exist`, () => {
      expect(modelExists(name)).toBe(false);
    });
  }
});
