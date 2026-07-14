import { describe, it, expect, beforeEach } from 'vitest';
import { MarkingResultVersionBridgeService } from '../services/markingResultVersionBridgeService';
import { InMemoryMarkingResultLinkRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

describe('Package 8 Result Version Linking', () => {
  let service: MarkingResultVersionBridgeService;
  let linkRepo: InMemoryMarkingResultLinkRepository;

  beforeEach(() => {
    linkRepo = new InMemoryMarkingResultLinkRepository();
    service = new MarkingResultVersionBridgeService(linkRepo);
  });

  it('batch item can link to MarkingResultVersionRecord', async () => {
    const link = await service.linkResultVersionToBatchItem(
      'item-1', 'run-1', 'result-1', 'school-1', 'req-1',
    );
    expect(link.linkStatus).toBe('linked');
    expect(link.markingRunId).toBe('run-1');
    expect(link.markingResultVersionId).toBe('result-1');
    expect(link.markingBatchItemId).toBe('item-1');
  });

  it('link preserves markingRunId', async () => {
    const link = await service.linkResultVersionToBatchItem(
      'item-2', 'run-2', 'result-2', 'school-1', 'req-1',
    );
    expect(link.markingRunId).toBe('run-2');
  });

  it('link preserves markingResultVersionId', async () => {
    const link = await service.linkResultVersionToBatchItem(
      'item-3', 'run-3', 'result-3', 'school-1', 'req-1',
    );
    expect(link.markingResultVersionId).toBe('result-3');
  });

  it('link preserves submissionSnapshotId when from batch item', async () => {
    const link = await service.createResultVersionFromBatchItem(
      {
        markingBatchItemId: 'item-4', schoolId: 'school-1', markingBatchId: 'batch-1',
        snapshotIntakeId: 'intake-1', submissionSnapshotId: 'snap-1', attemptId: 'att-1',
        attemptQuestionSnapshotId: 'aqs-1', answerSubmissionId: 'ans-1', questionId: 'q-1',
        questionVersionId: 'qv-1', paperQuestionId: 'pq-1', variantQuestionId: 'vq-1',
        studentRef: 'sr-1', itemStatus: 'planned', itemMode: 'deterministic', marksAvailable: 5,
        safeItemSummary: '', createdAt: '', updatedAt: '', completedAt: null,
      },
      'run-4', 'result-4',
    );
    expect(link.submissionSnapshotId).toBe('snap-1');
    expect(link.answerSubmissionId).toBe('ans-1');
  });

  it('duplicate link is idempotent (no conflict error)', async () => {
    await service.linkResultVersionToBatchItem('item-5', 'run-5', 'result-5', 'school-1', 'req-1');
    const second = await service.linkResultVersionToBatchItem('item-6', 'run-5', 'result-6', 'school-1', 'req-1');
    expect(second.linkStatus).toBe('linked');
    expect(second.markingResultLinkId).not.toBe('');
  });

  it('linking does not finalize', async () => {
    const link = await service.linkResultVersionToBatchItem('item-7', 'run-7', 'result-7', 'school-1', 'req-1');
    expect(link.linkStatus).not.toBe('finalized');
    expect(link).not.toHaveProperty('finalizedAt');
  });

  it('linking does not release to parent', async () => {
    const link = await service.linkResultVersionToBatchItem('item-8', 'run-8', 'result-8', 'school-1', 'req-1');
    expect(link).not.toHaveProperty('parentReleaseStatus');
  });

  it('linking does not mutate mastery', async () => {
    const link = await service.linkResultVersionToBatchItem('item-9', 'run-9', 'result-9', 'school-1', 'req-1');
    expect(link).not.toHaveProperty('masteryMutation');
    expect(link).not.toHaveProperty('skillMasterySnapshotId');
  });
});
