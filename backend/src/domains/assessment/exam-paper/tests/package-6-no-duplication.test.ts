import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 6 - No Duplication', () => {
  const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');

  function countModel(name: string): number {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const regex = new RegExp(`model\\s+${name}\\b`, 'g');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  function modelExists(name: string): boolean {
    return countModel(name) > 0;
  }

  it('ExamPaperRecord exists in schema', () => {
    expect(modelExists('ExamPaperRecord')).toBe(true);
  });

  it('ExamPaperVersionRecord exists in schema', () => {
    expect(modelExists('ExamPaperVersionRecord')).toBe(true);
  });

  it('ExamPaperSectionRecord exists in schema', () => {
    expect(modelExists('ExamPaperSectionRecord')).toBe(true);
  });

  it('ExamPaperQuestionRecord exists in schema', () => {
    expect(modelExists('ExamPaperQuestionRecord')).toBe(true);
  });

  it('ExamVariantRecord exists in schema', () => {
    expect(modelExists('ExamVariantRecord')).toBe(true);
  });

  it('ExamVariantQuestionRecord exists in schema', () => {
    expect(modelExists('ExamVariantQuestionRecord')).toBe(true);
  });

  it('ExamAccessPolicyRecord exists in schema', () => {
    expect(modelExists('ExamAccessPolicyRecord')).toBe(true);
  });

  it('ExamPaperApprovalRecord exists in schema', () => {
    expect(modelExists('ExamPaperApprovalRecord')).toBe(true);
  });

  it('ExamPaperAssemblyRunRecord exists in schema', () => {
    expect(modelExists('ExamPaperAssemblyRunRecord')).toBe(true);
  });

  it('ExamPaperDeliveryBridgeRecord exists in schema', () => {
    expect(modelExists('ExamPaperDeliveryBridgeRecord')).toBe(true);
  });

  it('ExamModeSessionRecord is not duplicated (exactly 1)', () => {
    expect(countModel('ExamModeSessionRecord')).toBe(1);
  });

  it('ExamModeQuestionStateRecord is not duplicated (exactly 1)', () => {
    expect(countModel('ExamModeQuestionStateRecord')).toBe(1);
  });

  it('ExamModeAttemptRecord is not duplicated (exactly 1)', () => {
    expect(countModel('ExamModeAttemptRecord')).toBe(1);
  });

  it('PracticeAttempt is not duplicated (exactly 1)', () => {
    expect(countModel('PracticeAttempt')).toBe(1);
  });

  it('SkillMasterySnapshot is not duplicated (exactly 1)', () => {
    expect(countModel('SkillMasterySnapshot')).toBe(1);
  });

  it('MarkingRunRecord is not duplicated (exactly 1)', () => {
    expect(countModel('MarkingRunRecord')).toBe(1);
  });

  it('MarkingResultVersionRecord is not duplicated (exactly 1)', () => {
    expect(countModel('MarkingResultVersionRecord')).toBe(1);
  });

  it('QuestionBankItemRecord is not duplicated (exactly 1)', () => {
    expect(countModel('QuestionBankItemRecord')).toBe(1);
  });

  it('QuestionVersionRecord is not duplicated (exactly 1)', () => {
    expect(countModel('QuestionVersionRecord')).toBe(1);
  });

  it('AnswerKeyVersionRecord is not duplicated (exactly 1)', () => {
    expect(countModel('AnswerKeyVersionRecord')).toBe(1);
  });

  it('RubricVersionRecord is not duplicated (exactly 1)', () => {
    expect(countModel('RubricVersionRecord')).toBe(1);
  });

  it('StudentQuestionAttemptRecord does not exist', () => {
    expect(modelExists('StudentQuestionAttemptRecord')).toBe(false);
  });

  it('OCRRecord does not exist', () => {
    expect(modelExists('OCRRecord')).toBe(false);
  });

  it('ParentSummaryRecord does not exist', () => {
    expect(modelExists('ParentSummaryRecord')).toBe(false);
  });

  it('FinalizationRecord does not exist', () => {
    expect(modelExists('FinalizationRecord')).toBe(false);
  });

  it('RegradingRecord does not exist', () => {
    expect(modelExists('RegradingRecord')).toBe(false);
  });

  it('ExamReleaseWindowRecord does not exist', () => {
    expect(modelExists('ExamReleaseWindowRecord')).toBe(false);
  });

  it('ExamVariantAssignmentRecord does not exist', () => {
    expect(modelExists('ExamVariantAssignmentRecord')).toBe(false);
  });

  it('ExamPaperPrintPacketRecord does not exist', () => {
    expect(modelExists('ExamPaperPrintPacketRecord')).toBe(false);
  });
});
