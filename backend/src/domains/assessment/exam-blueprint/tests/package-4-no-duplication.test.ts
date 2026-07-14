import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 4: No Duplication', () => {
  const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  function modelExists(name: string): boolean {
    const regex = new RegExp(`^model\\s+${name}\\s*{`, 'm');
    return regex.test(schemaContent);
  }

  it('ExamBlueprintRecord exists', () => {
    expect(modelExists('ExamBlueprintRecord')).toBe(true);
  });

  it('ExamBlueprintVersionRecord exists', () => {
    expect(modelExists('ExamBlueprintVersionRecord')).toBe(true);
  });

  it('ExamBlueprintRequirementRecord exists', () => {
    expect(modelExists('ExamBlueprintRequirementRecord')).toBe(true);
  });

  it('ExamDraftSetRecord exists', () => {
    expect(modelExists('ExamDraftSetRecord')).toBe(true);
  });

  it('ExamDraftRecord exists', () => {
    expect(modelExists('ExamDraftRecord')).toBe(true);
  });

  it('ExamDraftQuestionRecord exists', () => {
    expect(modelExists('ExamDraftQuestionRecord')).toBe(true);
  });

  it('QuestionSelectionRunRecord exists', () => {
    expect(modelExists('QuestionSelectionRunRecord')).toBe(true);
  });

  it('QuestionSelectionCandidateRecord exists', () => {
    expect(modelExists('QuestionSelectionCandidateRecord')).toBe(true);
  });

  const forbiddenModels = [
    'ExamPaperRecord',
    'StudentQuestionAttemptRecord',
    'MarkingResultRecord',
    'OCRRecord',
    'ParentSummaryRecord',
    'FinalizationRecord',
    'RegradingRecord',
  ];

  for (const name of forbiddenModels) {
    it(`${name} does not exist`, () => {
      expect(modelExists(name)).toBe(false);
    });
  }

  it('ExamModeSessionRecord is not duplicated (still exists)', () => {
    expect(modelExists('ExamModeSessionRecord')).toBe(true);
  });

  it('ExamModeAttemptRecord is not duplicated (still exists)', () => {
    expect(modelExists('ExamModeAttemptRecord')).toBe(true);
  });

  it('SkillMasterySnapshot is not duplicated (still exists)', () => {
    expect(modelExists('SkillMasterySnapshot')).toBe(true);
  });

  it('ContentReviewRecord is not duplicated (still exists)', () => {
    expect(modelExists('ContentReviewRecord')).toBe(true);
  });
});
