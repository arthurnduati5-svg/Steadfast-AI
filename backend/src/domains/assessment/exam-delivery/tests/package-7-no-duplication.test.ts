import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 7 - No Duplication', () => {
  const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
  let schema: string;

  beforeAll(() => {
    schema = fs.readFileSync(schemaPath, 'utf-8');
  });

  it('ExamDeliverySessionRecord exists in schema', () => {
    expect(schema).toContain('model ExamDeliverySessionRecord');
  });

  it('ExamDeliverySessionStateRecord exists in schema', () => {
    expect(schema).toContain('model ExamDeliverySessionStateRecord');
  });

  it('ExamVariantAssignmentRecord exists in schema', () => {
    expect(schema).toContain('model ExamVariantAssignmentRecord');
  });

  it('ExamAttemptRecord exists in schema', () => {
    expect(schema).toContain('model ExamAttemptRecord');
  });

  it('ExamAttemptQuestionSnapshotRecord exists in schema', () => {
    expect(schema).toContain('model ExamAttemptQuestionSnapshotRecord');
  });

  it('ExamAnswerSubmissionRecord exists in schema', () => {
    expect(schema).toContain('model ExamAnswerSubmissionRecord');
  });

  it('ExamAttemptTimingEventRecord exists in schema', () => {
    expect(schema).toContain('model ExamAttemptTimingEventRecord');
  });

  it('ExamAttemptSubmissionSnapshotRecord exists in schema', () => {
    expect(schema).toContain('model ExamAttemptSubmissionSnapshotRecord');
  });

  it('ExamDeliveryAuditRecord exists in schema', () => {
    expect(schema).toContain('model ExamDeliveryAuditRecord');
  });

  it('ExamDeliveryIdempotencyRecord exists in schema', () => {
    expect(schema).toContain('model ExamDeliveryIdempotencyRecord');
  });

  it('ExamPaperRecord is not duplicated (original still exists)', () => {
    const matches = schema.match(/model ExamPaperRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('ExamPaperVersionRecord is not duplicated', () => {
    const matches = schema.match(/model ExamPaperVersionRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('ExamVariantRecord is not duplicated', () => {
    const matches = schema.match(/model ExamVariantRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('ExamVariantQuestionRecord is not duplicated', () => {
    const matches = schema.match(/model ExamVariantQuestionRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('ExamPaperDeliveryBridgeRecord is not duplicated', () => {
    const matches = schema.match(/model ExamPaperDeliveryBridgeRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('ExamAccessPolicyRecord is not duplicated', () => {
    expect(schema).toContain('model ExamAccessPolicyRecord');
  });

  it('ExamPaperApprovalRecord is not duplicated', () => {
    expect(schema).toContain('model ExamPaperApprovalRecord');
  });

  it('PracticeAttempt is not duplicated', () => {
    const matches = schema.match(/model PracticeAttempt\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('SkillMasterySnapshot is not duplicated', () => {
    const matches = schema.match(/model SkillMasterySnapshot\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('MarkingRunRecord is not duplicated', () => {
    const matches = schema.match(/model MarkingRunRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('MarkingResultVersionRecord is not duplicated', () => {
    const matches = schema.match(/model MarkingResultVersionRecord\b/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('StudentQuestionAttemptRecord does not exist', () => {
    expect(schema).not.toContain('StudentQuestionAttemptRecord');
  });

  it('OCRRecord does not exist', () => {
    expect(schema).not.toContain('model OCRRecord');
  });

  it('ParentSummaryRecord does not exist', () => {
    expect(schema).not.toContain('ParentSummaryRecord');
  });

  it('FinalizationRecord does not exist', () => {
    expect(schema).not.toContain('FinalizationRecord');
  });

  it('RegradingRecord does not exist', () => {
    expect(schema).not.toContain('RegradingRecord');
  });

  it('ExamPaperPrintPacketRecord does not exist', () => {
    expect(schema).not.toContain('ExamPaperPrintPacketRecord');
  });
});
