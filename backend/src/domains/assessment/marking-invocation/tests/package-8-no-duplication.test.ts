import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 8 No Duplication', () => {
  const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');

  it('MarkingInvocationRequestRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingInvocationRequestRecord');
  });

  it('SubmittedSnapshotIntakeRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model SubmittedSnapshotIntakeRecord');
  });

  it('MarkingBatchRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingBatchRecord');
  });

  it('MarkingBatchItemRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingBatchItemRecord');
  });

  it('MarkingResultLinkRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingResultLinkRecord');
  });

  it('MarkingDispatchAuditRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingDispatchAuditRecord');
  });

  it('MarkingInvocationIdempotencyRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingInvocationIdempotencyRecord');
  });

  it('MarkingReadinessCheckRecord exists', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model MarkingReadinessCheckRecord');
  });

  it('Existing MarkingRunRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model MarkingRunRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing MarkingResultVersionRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model MarkingResultVersionRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing MarkingBreakdownItemRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model MarkingBreakdownItemRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing ScoringSuggestionRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model ScoringSuggestionRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing TeacherReviewItemRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model TeacherReviewItemRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing TeacherReviewGroupRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model TeacherReviewGroupRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing ExamAttemptSubmissionSnapshotRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model ExamAttemptSubmissionSnapshotRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing ExamAttemptRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model ExamAttemptRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing ExamAnswerSubmissionRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model ExamAnswerSubmissionRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing ExamAttemptQuestionSnapshotRecord is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model ExamAttemptQuestionSnapshotRecord/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing PracticeAttempt is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model PracticeAttempt/g);
    expect(matches).toHaveLength(1);
  });

  it('Existing SkillMasterySnapshot is not duplicated', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const matches = content.match(/model SkillMasterySnapshot/g);
    expect(matches).toHaveLength(1);
  });

  it('MarkingResultRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model MarkingResultRecord');
  });

  it('StudentQuestionAttemptRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model StudentQuestionAttemptRecord');
  });

  it('OCRRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model OCRRecord');
  });

  it('ParentSummaryRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model ParentSummaryRecord');
  });

  it('FinalizationRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model FinalizationRecord');
  });

  it('RegradingRecord does not exist', () => {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).not.toContain('model RegradingRecord');
  });
});
