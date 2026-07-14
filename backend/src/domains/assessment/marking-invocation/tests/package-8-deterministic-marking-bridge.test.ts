import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DeterministicMarkingInvocationService } from '../services/deterministicMarkingInvocationService';
import { InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository, InMemoryMarkingResultLinkRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

describe('Package 8 Deterministic Marking Bridge', () => {
  let service: DeterministicMarkingInvocationService;
  let batchRepo: InMemoryMarkingBatchRepository;
  let batchItemRepo: InMemoryMarkingBatchItemRepository;

  beforeEach(() => {
    batchRepo = new InMemoryMarkingBatchRepository();
    batchItemRepo = new InMemoryMarkingBatchItemRepository();
    const resultLinkRepo = new InMemoryMarkingResultLinkRepository();
    service = new DeterministicMarkingInvocationService(batchRepo, batchItemRepo, resultLinkRepo);
  });

  it('deterministic marking can execute on eligible batch items', async () => {
    const batch = await batchRepo.create({
      markingBatchId: 'batch-1', schoolId: 'school-1', markingInvocationRequestId: 'req-1',
      markingRunId: 'run-1', batchStatus: 'planned', batchMode: 'deterministic_only',
      batchSequence: 1, totalItems: 0, deterministicItemCount: 0, teacherReviewItemCount: 0,
      blockedItemCount: 0, safeBatchSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), startedAt: null, completedAt: null,
    });
    await batchItemRepo.create({
      markingBatchItemId: 'item-1', schoolId: 'school-1', markingBatchId: 'batch-1',
      snapshotIntakeId: 'intake-1', submissionSnapshotId: 'snap-1', attemptId: 'att-1',
      attemptQuestionSnapshotId: 'aqs-1', answerSubmissionId: 'ans-1', questionId: 'q-1',
      questionVersionId: 'qv-1', paperQuestionId: 'pq-1', variantQuestionId: 'vq-1',
      studentRef: 'sr-1', itemStatus: 'planned', itemMode: 'deterministic', marksAvailable: 5,
      safeItemSummary: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      completedAt: null,
    });
    const result = await service.executeDeterministicBatch('batch-1', 'run-1');
    expect(result.markedItems.length).toBeGreaterThan(0);
    expect(result.markedItems[0].itemStatus).toBe('marked_deterministically');
  });

  it('rubric deterministic marking executes when supported', async () => {
    const batch = await batchRepo.create({
      markingBatchId: 'batch-2', schoolId: 'school-1', markingInvocationRequestId: 'req-1',
      markingRunId: 'run-1', batchStatus: 'planned', batchMode: 'deterministic_plus_teacher_review',
      batchSequence: 1, totalItems: 0, deterministicItemCount: 0, teacherReviewItemCount: 0,
      blockedItemCount: 0, safeBatchSummary: '', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), startedAt: null, completedAt: null,
    });
    await batchItemRepo.create({
      markingBatchItemId: 'item-2', schoolId: 'school-1', markingBatchId: 'batch-2',
      snapshotIntakeId: 'intake-2', submissionSnapshotId: 'snap-2', attemptId: 'att-2',
      attemptQuestionSnapshotId: 'aqs-2', answerSubmissionId: 'ans-2', questionId: 'q-2',
      questionVersionId: 'qv-2', paperQuestionId: 'pq-2', variantQuestionId: 'vq-2',
      studentRef: 'sr-2', itemStatus: 'planned', itemMode: 'rubric_deterministic', marksAvailable: 10,
      safeItemSummary: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      completedAt: null,
    });
    const item = await service.executeRubricDeterministicBatchItem('item-2');
    expect(item.itemStatus).toBe('marked_deterministically');
  });

  it('unsupported item dispatches via markUnsupportedItemDeferred', async () => {
    await batchItemRepo.create({
      markingBatchItemId: 'item-3', schoolId: 'school-1', markingBatchId: 'batch-3',
      snapshotIntakeId: 'intake-3', submissionSnapshotId: 'snap-3', attemptId: 'att-3',
      attemptQuestionSnapshotId: 'aqs-3', answerSubmissionId: 'ans-3', questionId: 'q-3',
      questionVersionId: 'qv-3', paperQuestionId: 'pq-3', variantQuestionId: 'vq-3',
      studentRef: 'sr-3', itemStatus: 'planned', itemMode: 'unsupported_deferred', marksAvailable: 5,
      safeItemSummary: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      completedAt: null,
    });
    const item = await service.markUnsupportedItemDeferred('item-3');
    expect(item.itemStatus).toBe('skipped');
    expect(item.itemMode).toBe('unsupported_deferred');
  });

  it('no OpenAI import exists in service files', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
      expect(content.toLowerCase()).not.toContain('openai');
      expect(content.toLowerCase()).not.toContain('genkit');
    }
  });

  it('no OCR import exists in service or route files', () => {
    const serviceContent = fs.readFileSync(path.resolve(__dirname, '../services/deterministicMarkingInvocationService.ts'), 'utf-8');
    expect(serviceContent.toLowerCase()).not.toContain('tesseract');
    expect(serviceContent.toLowerCase()).not.toContain('ocr');
  });

  it('no answer key text appears in student-safe output', () => {
    const projectionContent = fs.readFileSync(path.resolve(__dirname, '../contracts/markingInvocationProjectionContracts.ts'), 'utf-8');
    expect(projectionContent).not.toContain('answerKeyText');
    expect(projectionContent).not.toContain('correctAnswerSummary');
  });

  it('no MarkingResultRecord is created in code', () => {
    const serviceContent = fs.readFileSync(path.resolve(__dirname, '../services/deterministicMarkingInvocationService.ts'), 'utf-8');
    expect(serviceContent).not.toContain('MarkingResultRecord');
  });

  it('no final grade is created', () => {
    const serviceContent = fs.readFileSync(path.resolve(__dirname, '../services/deterministicMarkingInvocationService.ts'), 'utf-8');
    expect(serviceContent).not.toContain('finalGrade');
  });
});
