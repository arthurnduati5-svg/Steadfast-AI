import { MarkingBatchItem } from '../contracts/markingBatchContracts';
import { TeacherReviewDispatchPreview } from '../contracts/markingResultBridgeContracts';
import { MarkingBatchItemRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingBatchItemRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import { MARKING_INVOCATION_POLICY_DEFAULTS } from '../policies/markingInvocationPolicyDefinitions';

export class TeacherReviewDispatchService {
  constructor(
    private batchItemRepo: MarkingBatchItemRepository = new InMemoryMarkingBatchItemRepository(),
  ) {}

  async dispatchBatchItemToTeacherReview(markingBatchItemId: string): Promise<{ item: MarkingBatchItem; preview: TeacherReviewDispatchPreview }> {
    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.TEACHER_REVIEW_DISPATCH;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const item = await this.batchItemRepo.findById(markingBatchItemId);
    if (!item) throw new Error('NOT_FOUND: Batch item not found');
    item.itemStatus = 'sent_to_teacher_review';
    item.updatedAt = new Date().toISOString();
    const updated = await this.batchItemRepo.update(item);
    const preview: TeacherReviewDispatchPreview = {
      markingBatchItemId: updated.markingBatchItemId,
      teacherReviewItemId: '',
      teacherReviewGroupId: '',
      reviewReasonCode: 'teacher_review_required',
      safeSummary: `Dispatched to teacher review: ${updated.safeItemSummary}`,
      status: 'open',
      dispatchedAt: updated.updatedAt,
    };
    return { item: updated, preview };
  }

  async bulkDispatchTeacherReviewItems(markingBatchItemIds: string[]): Promise<{ item: MarkingBatchItem; preview: TeacherReviewDispatchPreview }[]> {
    const results: { item: MarkingBatchItem; preview: TeacherReviewDispatchPreview }[] = [];
    for (const id of markingBatchItemIds) {
      const result = await this.dispatchBatchItemToTeacherReview(id);
      results.push(result);
    }
    return results;
  }

  async getTeacherReviewDispatchPreview(markingBatchItemId: string): Promise<TeacherReviewDispatchPreview | null> {
    const item = await this.batchItemRepo.findById(markingBatchItemId);
    if (!item || item.itemStatus !== 'sent_to_teacher_review') return null;
    return {
      markingBatchItemId: item.markingBatchItemId,
      teacherReviewItemId: '',
      teacherReviewGroupId: '',
      reviewReasonCode: 'teacher_review_required',
      safeSummary: `In teacher review: ${item.safeItemSummary}`,
      status: 'open',
      dispatchedAt: item.updatedAt,
    };
  }

  async listTeacherReviewDispatchesForInvocation(markingInvocationRequestId: string): Promise<TeacherReviewDispatchPreview[]> {
    const items = await this.batchItemRepo.findByBatchId(markingInvocationRequestId);
    const reviewItems = items.filter(i => i.itemStatus === 'sent_to_teacher_review');
    return reviewItems.map(item => ({
      markingBatchItemId: item.markingBatchItemId,
      teacherReviewItemId: '',
      teacherReviewGroupId: '',
      reviewReasonCode: 'teacher_review_required',
      safeSummary: item.safeItemSummary,
      status: 'open',
      dispatchedAt: item.updatedAt,
    }));
  }
}
