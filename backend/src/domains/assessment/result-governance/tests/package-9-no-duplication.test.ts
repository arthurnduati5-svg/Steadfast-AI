import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 9 - No Duplication', () => {
  const schemaPath = path.resolve('backend/prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  it('should define ResultFinalizationReviewRecord', () => {
    expect(schemaContent).toContain('model ResultFinalizationReviewRecord');
  });

  it('should define ResultFinalizationDecisionRecord', () => {
    expect(schemaContent).toContain('model ResultFinalizationDecisionRecord');
  });

  it('should define ResultReleaseReadinessRecord', () => {
    expect(schemaContent).toContain('model ResultReleaseReadinessRecord');
  });

  it('should define ResultReleaseBoundaryRecord', () => {
    expect(schemaContent).toContain('model ResultReleaseBoundaryRecord');
  });

  it('should define ResultRegradeRequestRecord', () => {
    expect(schemaContent).toContain('model ResultRegradeRequestRecord');
  });

  it('should define ResultRegradeIntakeRecord', () => {
    expect(schemaContent).toContain('model ResultRegradeIntakeRecord');
  });

  it('should define ResultGovernanceAuditRecord', () => {
    expect(schemaContent).toContain('model ResultGovernanceAuditRecord');
  });

  it('should define ResultGovernanceIdempotencyRecord', () => {
    expect(schemaContent).toContain('model ResultGovernanceIdempotencyRecord');
  });

  // Existing models NOT duplicated
  it('should NOT duplicate MarkingResultVersionRecord', () => {
    const occurrences = (schemaContent.match(/model MarkingResultVersionRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate MarkingRunRecord', () => {
    const occurrences = (schemaContent.match(/model MarkingRunRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate MarkingInvocationRequestRecord', () => {
    const occurrences = (schemaContent.match(/model MarkingInvocationRequestRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate MarkingResultLinkRecord', () => {
    const occurrences = (schemaContent.match(/model MarkingResultLinkRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate TeacherReviewItemRecord', () => {
    const occurrences = (schemaContent.match(/model TeacherReviewItemRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate TeacherOverrideRecord', () => {
    const occurrences = (schemaContent.match(/model TeacherOverrideRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate ModerationDecisionRecord', () => {
    const occurrences = (schemaContent.match(/model ModerationDecisionRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate StudentMarkChallengeRecord', () => {
    const occurrences = (schemaContent.match(/model StudentMarkChallengeRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate PracticeAttempt', () => {
    const occurrences = (schemaContent.match(/model PracticeAttempt/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('should NOT duplicate SkillMasterySnapshot', () => {
    const occurrences = (schemaContent.match(/model SkillMasterySnapshot/g) || []).length;
    expect(occurrences).toBe(1);
  });

  // Forbidden model names should not exist as duplicates
  it('should NOT have MarkingResultVersionRecordDuplicate', () => {
    expect(schemaContent).not.toContain('MarkingResultVersionRecordDuplicate');
  });

  it('should NOT have MarkingRunRecordDuplicate', () => {
    expect(schemaContent).not.toContain('MarkingRunRecordDuplicate');
  });

  it('should NOT have MarkingInvocationRequestRecordDuplicate', () => {
    expect(schemaContent).not.toContain('MarkingInvocationRequestRecordDuplicate');
  });

  it('should NOT have MarkingResultLinkRecordDuplicate', () => {
    expect(schemaContent).not.toContain('MarkingResultLinkRecordDuplicate');
  });

  // Forbidden models should not exist at all
  it('should NOT have ParentSummaryRecord', () => {
    expect(schemaContent).not.toContain('model ParentSummaryRecord');
  });

  it('should NOT have ParentReleaseRecord', () => {
    expect(schemaContent).not.toContain('model ParentReleaseRecord');
  });

  it('should NOT have ReportCardRecord', () => {
    expect(schemaContent).not.toContain('model ReportCardRecord');
  });

  it('should NOT have OCRRecord', () => {
    expect(schemaContent).not.toContain('model OCRRecord');
  });

  it('should NOT have StudentQuestionAttemptRecord', () => {
    expect(schemaContent).not.toContain('model StudentQuestionAttemptRecord');
  });

  it('should NOT have SkillMasterySnapshotDuplicate', () => {
    expect(schemaContent).not.toContain('SkillMasterySnapshotDuplicate');
  });

  it('should NOT have PracticeAttemptDuplicate', () => {
    expect(schemaContent).not.toContain('PracticeAttemptDuplicate');
  });
});
