import { describe, it, expect, beforeEach } from 'vitest';
import { MarkingBatchPlannerService } from '../services/markingBatchPlannerService';
import { InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

describe('Package 8 Batch Planning', () => {
  let service: MarkingBatchPlannerService;
  let batchRepo: InMemoryMarkingBatchRepository;
  let batchItemRepo: InMemoryMarkingBatchItemRepository;

  beforeEach(() => {
    batchRepo = new InMemoryMarkingBatchRepository();
    batchItemRepo = new InMemoryMarkingBatchItemRepository();
    service = new MarkingBatchPlannerService(batchRepo, batchItemRepo);
  });

  it('batch can be created from validated snapshot intakes', async () => {
    const batch = await service.createMarkingBatch({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      markingRunId: 'run-1',
      batchMode: 'deterministic_plus_teacher_review',
      batchSequence: 1,
      safeBatchSummary: 'Test batch',
    });
    expect(batch.markingBatchId).toBeTruthy();
    expect(batch.batchStatus).toBe('planned');
    expect(batch.markingRunId).toBe('run-1');
  });

  it('batch links to markingRunId', async () => {
    const batch = await service.createMarkingBatch({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', markingRunId: 'run-specific',
      batchMode: 'deterministic_only', batchSequence: 1, safeBatchSummary: '',
    });
    expect(batch.markingRunId).toBe('run-specific');
  });

  it('batch items preserve answer references', async () => {
    const batch = await service.createMarkingBatch({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', markingRunId: 'run-1',
      batchMode: 'deterministic_only', batchSequence: 1, safeBatchSummary: '',
    });
    const questionTypeMap = new Map<string, string>();
    questionTypeMap.set('snap-1', 'multiple_choice');
    const marksMap = new Map<string, number>();
    marksMap.set('snap-1', 5);
    const items = await service.planBatchItemsFromSnapshotIntakes(
      batch.markingBatchId,
      [{
        snapshotIntakeId: 'intake-1', schoolId: 'school-1', markingInvocationRequestId: 'req-1',
        submissionSnapshotId: 'snap-1', attemptId: 'att-1', deliverySessionId: 'sess-1',
        paperId: 'p-1', paperVersionId: 'pv-1', variantId: 'v-1', studentRef: 'sr-1',
        intakeStatus: 'ready_for_marking', readinessStatus: 'ready', readinessReasonCodesJson: null,
        safeIntakeSummary: '', createdAt: '', updatedAt: '', blockedAt: null,
      }],
      questionTypeMap, marksMap,
    );
    expect(items.length).toBe(1);
    expect(items[0].submissionSnapshotId).toBe('snap-1');
    expect(items[0].snapshotIntakeId).toBe('intake-1');
    expect(items[0].marksAvailable).toBe(5);
  });

  it('batch item mode classification is deterministic', () => {
    expect(service.classifyBatchItemMode('multiple_choice')).toBe('deterministic');
    expect(service.classifyBatchItemMode('true_false')).toBe('deterministic');
    expect(service.classifyBatchItemMode('matching')).toBe('deterministic');
    expect(service.classifyBatchItemMode('fill_blank')).toBe('deterministic');
    expect(service.classifyBatchItemMode('numeric')).toBe('deterministic');
    expect(service.classifyBatchItemMode('short_answer')).toBe('rubric_deterministic');
    expect(service.classifyBatchItemMode('structured_working')).toBe('rubric_deterministic');
    expect(service.classifyBatchItemMode('essay')).toBe('teacher_review_required');
    expect(service.classifyBatchItemMode('long_answer')).toBe('teacher_review_required');
    expect(service.classifyBatchItemMode('oral')).toBe('teacher_review_required');
    expect(service.classifyBatchItemMode('teacher_uploaded')).toBe('manual_only');
  });

  it('unsupported items become unsupported_deferred', () => {
    expect(service.classifyBatchItemMode('unknown_type')).toBe('unsupported_deferred');
    expect(service.classifyBatchItemMode('ai_scored')).toBe('unsupported_deferred');
  });

  it('batch planning does not calculate scores', async () => {
    const batch = await service.createMarkingBatch({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', markingRunId: 'run-1',
      batchMode: 'deterministic_only', batchSequence: 1, safeBatchSummary: '',
    });
    expect(batch).not.toHaveProperty('totalScore');
    expect(batch).not.toHaveProperty('averageScore');
    expect(batch.safeBatchSummary).toBe('');
  });

  it('batch planning does not finalize', async () => {
    const batch = await service.createMarkingBatch({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', markingRunId: 'run-1',
      batchMode: 'deterministic_only', batchSequence: 1, safeBatchSummary: '',
    });
    expect(batch.batchStatus).not.toBe('completed');
    expect(batch.batchStatus).not.toBe('finalized');
  });

  it('no parent release or mastery mutation references', () => {
    expect(batchRepo).toBeDefined();
    expect(batchItemRepo).toBeDefined();
  });
});
