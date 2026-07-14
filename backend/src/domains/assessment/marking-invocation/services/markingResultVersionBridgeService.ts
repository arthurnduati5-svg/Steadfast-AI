import { MarkingResultLink, MarkingInvocationResultVersionPreview } from '../contracts/markingResultBridgeContracts';
import { MarkingBatchItem } from '../contracts/markingBatchContracts';
import { MarkingResultLinkRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingResultLinkRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

export class MarkingResultVersionBridgeService {
  constructor(
    private resultLinkRepo: MarkingResultLinkRepository = new InMemoryMarkingResultLinkRepository(),
  ) {}

  async createResultVersionFromBatchItem(
    batchItem: MarkingBatchItem,
    markingRunId: string,
    markingResultVersionId: string,
  ): Promise<MarkingResultLink> {
    const now = new Date().toISOString();
    const link: MarkingResultLink = {
      markingResultLinkId: crypto.randomUUID(),
      schoolId: batchItem.schoolId,
      markingInvocationRequestId: '',
      markingBatchId: batchItem.markingBatchId,
      markingBatchItemId: batchItem.markingBatchItemId,
      markingRunId,
      markingResultVersionId,
      submissionSnapshotId: batchItem.submissionSnapshotId,
      attemptId: batchItem.attemptId,
      answerSubmissionId: batchItem.answerSubmissionId,
      linkStatus: 'linked',
      safeLinkSummary: `Linked batch item ${batchItem.markingBatchItemId} to result version ${markingResultVersionId}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.resultLinkRepo.create(link);
  }

  async linkResultVersionToBatchItem(
    markingBatchItemId: string,
    markingRunId: string,
    markingResultVersionId: string,
    schoolId: string,
    markingInvocationRequestId: string,
  ): Promise<MarkingResultLink> {
    const now = new Date().toISOString();
    const link: MarkingResultLink = {
      markingResultLinkId: crypto.randomUUID(),
      schoolId,
      markingInvocationRequestId,
      markingBatchId: '',
      markingBatchItemId,
      markingRunId,
      markingResultVersionId,
      submissionSnapshotId: '',
      attemptId: '',
      answerSubmissionId: '',
      linkStatus: 'linked',
      safeLinkSummary: `Linked batch item ${markingBatchItemId} to result version ${markingResultVersionId}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.resultLinkRepo.create(link);
  }

  async getResultLinksForInvocation(markingInvocationRequestId: string): Promise<MarkingResultLink[]> {
    return this.resultLinkRepo.findByInvocationRequestId(markingInvocationRequestId);
  }

  async getResultLinksForBatch(markingBatchId: string): Promise<MarkingResultLink[]> {
    return this.resultLinkRepo.findByBatchId(markingBatchId);
  }

  async voidResultLink(markingResultLinkId: string): Promise<MarkingResultLink> {
    const link = await this.resultLinkRepo.findById(markingResultLinkId);
    if (!link) throw new Error('NOT_FOUND: Result link not found');
    link.linkStatus = 'void';
    link.updatedAt = new Date().toISOString();
    return this.resultLinkRepo.update(link);
  }

  async buildResultVersionPreview(markingResultLinkId: string): Promise<MarkingInvocationResultVersionPreview | null> {
    const link = await this.resultLinkRepo.findById(markingResultLinkId);
    if (!link) return null;
    return {
      markingResultLinkId: link.markingResultLinkId,
      markingBatchItemId: link.markingBatchItemId,
      markingRunId: link.markingRunId,
      markingResultVersionId: link.markingResultVersionId,
      linkStatus: link.linkStatus,
      marksAwarded: 0,
      marksAvailable: 0,
      safeStudentFeedback: '',
      requiresTeacherReview: false,
      createdAt: link.createdAt,
    };
  }
}
