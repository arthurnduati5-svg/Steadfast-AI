import { MarkingBatch, MarkingBatchItem, MarkingBatchItemMode } from '../contracts/markingBatchContracts';
import { SubmittedSnapshotIntake } from '../contracts/submittedSnapshotIntakeContracts';
import { MarkingBatchRepository, MarkingBatchItemRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import { MARKING_INVOCATION_POLICY_DEFAULTS } from '../policies/markingInvocationPolicyDefinitions';

const DETERMINISTIC_QUESTION_TYPES = ['multiple_choice', 'true_false', 'matching', 'fill_blank', 'numeric'];
const RUBRIC_DETERMINISTIC_TYPES = ['short_answer', 'structured_working'];
const TEACHER_REVIEW_TYPES = ['essay', 'long_answer', 'oral', 'multi_part'];
const MANUAL_ONLY_TYPES = ['teacher_uploaded', 'external'];

export class MarkingBatchPlannerService {
  constructor(
    private batchRepo: MarkingBatchRepository = new InMemoryMarkingBatchRepository(),
    private batchItemRepo: MarkingBatchItemRepository = new InMemoryMarkingBatchItemRepository(),
  ) {}

  async createMarkingBatch(params: {
    schoolId: string;
    markingInvocationRequestId: string;
    markingRunId: string;
    batchMode: string;
    batchSequence: number;
    safeBatchSummary: string;
  }): Promise<MarkingBatch> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.MARKING_BATCH_PLANNING;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const now = new Date().toISOString();
    const batch: MarkingBatch = {
      markingBatchId: crypto.randomUUID(),
      schoolId: params.schoolId,
      markingInvocationRequestId: params.markingInvocationRequestId,
      markingRunId: params.markingRunId,
      batchStatus: 'planned',
      batchMode: params.batchMode as any || 'deterministic_plus_teacher_review',
      batchSequence: params.batchSequence || 1,
      totalItems: 0,
      deterministicItemCount: 0,
      teacherReviewItemCount: 0,
      blockedItemCount: 0,
      safeBatchSummary: params.safeBatchSummary,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
    };
    return this.batchRepo.create(batch);
  }

  async planBatchItemsFromSnapshotIntakes(
    batchId: string,
    intakes: SubmittedSnapshotIntake[],
    questionTypeMap: Map<string, string>,
    marksMap: Map<string, number>,
  ): Promise<MarkingBatchItem[]> {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) throw new Error('NOT_FOUND: Batch not found');

    const items: MarkingBatchItem[] = [];
    for (const intake of intakes) {
      const questionType = questionTypeMap.get(intake.submissionSnapshotId) || 'unknown';
      const marksAvailable = marksMap.get(intake.submissionSnapshotId) || 0;
      const itemMode = this.classifyBatchItemMode(questionType);

      const item: MarkingBatchItem = {
        markingBatchItemId: crypto.randomUUID(),
        schoolId: intake.schoolId,
        markingBatchId: batchId,
        snapshotIntakeId: intake.snapshotIntakeId,
        submissionSnapshotId: intake.submissionSnapshotId,
        attemptId: intake.attemptId,
        attemptQuestionSnapshotId: intake.submissionSnapshotId,
        answerSubmissionId: intake.submissionSnapshotId,
        questionId: '',
        questionVersionId: '',
        paperQuestionId: '',
        variantQuestionId: '',
        studentRef: intake.studentRef,
        itemStatus: 'planned',
        itemMode: itemMode,
        marksAvailable: marksAvailable,
        safeItemSummary: `Batch item for snapshot ${intake.submissionSnapshotId} - ${itemMode}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
      items.push(item);
    }

    const createdItems: MarkingBatchItem[] = [];
    for (const item of items) {
      const created = await this.batchItemRepo.create(item);
      createdItems.push(created);
    }

    batch.totalItems = batch.totalItems + createdItems.length;
    batch.deterministicItemCount = batch.deterministicItemCount + createdItems.filter(i => i.itemMode === 'deterministic' || i.itemMode === 'rubric_deterministic').length;
    batch.teacherReviewItemCount = batch.teacherReviewItemCount + createdItems.filter(i => i.itemMode === 'teacher_review_required' || i.itemMode === 'manual_only').length;
    batch.blockedItemCount = batch.blockedItemCount + createdItems.filter(i => i.itemMode === 'unsupported_deferred').length;
    batch.updatedAt = new Date().toISOString();
    await this.batchRepo.update(batch);

    return createdItems;
  }

  classifyBatchItemMode(questionType: string): MarkingBatchItemMode {
    if (DETERMINISTIC_QUESTION_TYPES.includes(questionType)) return 'deterministic';
    if (RUBRIC_DETERMINISTIC_TYPES.includes(questionType)) return 'rubric_deterministic';
    if (TEACHER_REVIEW_TYPES.includes(questionType)) return 'teacher_review_required';
    if (MANUAL_ONLY_TYPES.includes(questionType)) return 'manual_only';
    return 'unsupported_deferred';
  }

  async queueBatch(markingBatchId: string): Promise<MarkingBatch> {
    const batch = await this.batchRepo.findById(markingBatchId);
    if (!batch) throw new Error('NOT_FOUND: Batch not found');
    batch.batchStatus = 'queued';
    batch.updatedAt = new Date().toISOString();
    return this.batchRepo.update(batch);
  }

  async getBatch(markingBatchId: string): Promise<MarkingBatch | null> {
    return this.batchRepo.findById(markingBatchId);
  }

  async listBatchesForInvocation(markingInvocationRequestId: string): Promise<MarkingBatch[]> {
    return this.batchRepo.findByInvocationRequestId(markingInvocationRequestId);
  }
}
