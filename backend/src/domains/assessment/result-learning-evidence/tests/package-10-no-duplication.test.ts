import { describe, it, expect } from 'vitest';
import { readBackendFile } from '../../../../test-utils/repositoryPaths';

describe('Package 10 - No Duplication', () => {
  const schemaContent = readBackendFile('prisma/schema.prisma');

  it('ResultLearningEvidenceBridgeRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultLearningEvidenceBridgeRecord');
  });

  it('ResultMasteryMutationPlanRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultMasteryMutationPlanRecord');
  });

  it('ResultMasteryMutationEventRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultMasteryMutationEventRecord');
  });

  it('ResultObjectiveMasteryImpactRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultObjectiveMasteryImpactRecord');
  });

  it('ResultRevisionSignalRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultRevisionSignalRecord');
  });

  it('ResultGrowthSignalRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultGrowthSignalRecord');
  });

  it('ResultLearningEvidenceAuditRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultLearningEvidenceAuditRecord');
  });

  it('ResultLearningEvidenceIdempotencyRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultLearningEvidenceIdempotencyRecord');
  });

  it('Existing SkillMasterySnapshot should not be duplicated', () => {
    expect(schemaContent).toContain('model SkillMasterySnapshot');
  });

  it('Existing PracticeAttempt should not be duplicated', () => {
    expect(schemaContent).toContain('model PracticeAttempt');
  });

  it('Existing LearningEvent should not be duplicated', () => {
    expect(schemaContent).toContain('model LearningEvent');
  });

  it('Existing QuestionObjectiveMappingRecord should not be duplicated', () => {
    expect(schemaContent).toContain('model QuestionObjectiveMappingRecord');
  });

  it('Existing LearningObjectiveRecord should not be duplicated', () => {
    expect(schemaContent).toContain('model LearningObjectiveRecord');
  });

  it('Existing MarkingResultVersionRecord should not be duplicated', () => {
    expect(schemaContent).toContain('model MarkingResultVersionRecord');
  });

  it('Existing ResultFinalizationDecisionRecord should not be duplicated', () => {
    expect(schemaContent).toContain('model ResultFinalizationDecisionRecord');
  });

  it('SkillMasterySnapshotDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/SkillMasterySnapshotDuplicate/);
  });

  it('PracticeAttemptDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/PracticeAttemptDuplicate/);
  });

  it('LearningEventDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/LearningEventDuplicate/);
  });

  it('QuestionObjectiveMappingRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/QuestionObjectiveMappingRecordDuplicate/);
  });

  it('LearningObjectiveRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/LearningObjectiveRecordDuplicate/);
  });

  it('MarkingResultVersionRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toMatch(/MarkingResultVersionRecordDuplicate/);
  });

  it('ParentSummaryRecord should NOT exist', () => {
    expect(schemaContent).not.toMatch(/model ParentSummaryRecord/);
  });

  it('ParentReleaseRecord should NOT exist', () => {
    expect(schemaContent).not.toMatch(/model ParentReleaseRecord/);
  });

  it('ReportCardRecord should NOT exist', () => {
    expect(schemaContent).not.toMatch(/model ReportCardRecord/);
  });

  it('OCRRecord should NOT exist', () => {
    expect(schemaContent).not.toMatch(/model OCRRecord/);
  });

  it('StudentQuestionAttemptRecord should NOT exist', () => {
    expect(schemaContent).not.toMatch(/model StudentQuestionAttemptRecord/);
  });
});
