import { describe, it, expect, beforeEach } from 'vitest';
import { TeacherReviewDispatchService } from '../services/teacherReviewDispatchService';
import { InMemoryMarkingBatchItemRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

describe('Package 8 Teacher Review Dispatch', () => {
  let service: TeacherReviewDispatchService;
  let batchItemRepo: InMemoryMarkingBatchItemRepository;

  beforeEach(() => {
    batchItemRepo = new InMemoryMarkingBatchItemRepository();
    service = new TeacherReviewDispatchService(batchItemRepo);
  });

  it('teacher-review-required items dispatch to teacher review', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-tr-1', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-1', submissionSnapshotId: 'snap-1', attemptId: 'att-1',
      attemptQuestionSnapshotId: 'aqs-1', answerSubmissionId: 'ans-1', questionId: 'q-1',
      questionVersionId: 'qv-1', paperQuestionId: 'pq-1', variantQuestionId: 'vq-1',
      studentRef: 'sr-1', itemStatus: 'planned', itemMode: 'teacher_review_required',
      marksAvailable: 10, safeItemSummary: 'Needs review', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), completedAt: null,
    });
    const result = await service.dispatchBatchItemToTeacherReview('item-tr-1');
    expect(result.item.itemStatus).toBe('sent_to_teacher_review');
    expect(result.preview.reviewReasonCode).toBe('teacher_review_required');
  });

  it('teacher review dispatch does not mark automatically', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-tr-2', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-2', submissionSnapshotId: 'snap-2', attemptId: 'att-2',
      attemptQuestionSnapshotId: 'aqs-2', answerSubmissionId: 'ans-2', questionId: 'q-2',
      questionVersionId: 'qv-2', paperQuestionId: 'pq-2', variantQuestionId: 'vq-2',
      studentRef: 'sr-2', itemStatus: 'planned', itemMode: 'teacher_review_required',
      marksAvailable: 10, safeItemSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), completedAt: null,
    });
    const result = await service.dispatchBatchItemToTeacherReview('item-tr-2');
    expect(result.item.itemStatus).not.toBe('marked_deterministically');
    expect(result.item.itemStatus).not.toBe('completed');
    expect(result.preview).not.toHaveProperty('marksAwarded');
  });

  it('teacher review dispatch does not override teacher decision', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-tr-3', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-3', submissionSnapshotId: 'snap-3', attemptId: 'att-3',
      attemptQuestionSnapshotId: 'aqs-3', answerSubmissionId: 'ans-3', questionId: 'q-3',
      questionVersionId: 'qv-3', paperQuestionId: 'pq-3', variantQuestionId: 'vq-3',
      studentRef: 'sr-3', itemStatus: 'planned', itemMode: 'teacher_review_required',
      marksAvailable: 10, safeItemSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), completedAt: null,
    });
    const result = await service.dispatchBatchItemToTeacherReview('item-tr-3');
    expect(result.preview).not.toHaveProperty('teacherOverride');
    expect(result.preview).not.toHaveProperty('moderationDecision');
  });

  it('teacher review dispatch does not finalize', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-tr-4', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-4', submissionSnapshotId: 'snap-4', attemptId: 'att-4',
      attemptQuestionSnapshotId: 'aqs-4', answerSubmissionId: 'ans-4', questionId: 'q-4',
      questionVersionId: 'qv-4', paperQuestionId: 'pq-4', variantQuestionId: 'vq-4',
      studentRef: 'sr-4', itemStatus: 'planned', itemMode: 'teacher_review_required',
      marksAvailable: 10, safeItemSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), completedAt: null,
    });
    const result = await service.dispatchBatchItemToTeacherReview('item-tr-4');
    expect(result.item.itemStatus).not.toBe('finalized');
    expect(result.item).not.toHaveProperty('finalizedAt');
  });

  it('teacher review dispatch does not parent-release', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-tr-5', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-5', submissionSnapshotId: 'snap-5', attemptId: 'att-5',
      attemptQuestionSnapshotId: 'aqs-5', answerSubmissionId: 'ans-5', questionId: 'q-5',
      questionVersionId: 'qv-5', paperQuestionId: 'pq-5', variantQuestionId: 'vq-5',
      studentRef: 'sr-5', itemStatus: 'planned', itemMode: 'teacher_review_required',
      marksAvailable: 10, safeItemSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), completedAt: null,
    });
    const result = await service.dispatchBatchItemToTeacherReview('item-tr-5');
    expect(result.preview).not.toHaveProperty('parentReleaseStatus');
  });
});
