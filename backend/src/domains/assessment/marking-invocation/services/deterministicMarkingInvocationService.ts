import { MarkingBatch, MarkingBatchItem } from '../contracts/markingBatchContracts';
import { MarkingBatchRepository, MarkingBatchItemRepository, MarkingResultLinkRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingBatchRepository, InMemoryMarkingBatchItemRepository, InMemoryMarkingResultLinkRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import { MARKING_INVOCATION_POLICY_DEFAULTS } from '../policies/markingInvocationPolicyDefinitions';
import { MarkingResultLink } from '../contracts/markingResultBridgeContracts';

export class DeterministicMarkingInvocationService {
  constructor(
    private batchRepo: MarkingBatchRepository = new InMemoryMarkingBatchRepository(),
    private batchItemRepo: MarkingBatchItemRepository = new InMemoryMarkingBatchItemRepository(),
    private resultLinkRepo: MarkingResultLinkRepository = new InMemoryMarkingResultLinkRepository(),
  ) {}

  async executeDeterministicBatch(markingBatchId: string, markingRunId: string): Promise<{ batch: MarkingBatch; markedItems: MarkingBatchItem[]; failedItems: MarkingBatchItem[] }> {
    const batch = await this.batchRepo.findById(markingBatchId);
    if (!batch) throw new Error('NOT_FOUND: Batch not found');

    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.DETERMINISTIC_MARKING_INVOCATION;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }

    const allItems = await this.batchItemRepo.findByBatchId(markingBatchId);
    const deterministicItems = allItems.filter(i => i.itemMode === 'deterministic' || i.itemMode === 'rubric_deterministic');
    const markedItems: MarkingBatchItem[] = [];
    const failedItems: MarkingBatchItem[] = [];

    for (const item of deterministicItems) {
      try {
        const result = await this.executeDeterministicBatchItem(item.markingBatchItemId);
        markedItems.push(result);
      } catch (err) {
        item.itemStatus = 'failed';
        item.updatedAt = new Date().toISOString();
        await this.batchItemRepo.update(item);
        failedItems.push(item);
      }
    }

    batch.batchStatus = 'running';
    batch.startedAt = new Date().toISOString();
    batch.updatedAt = batch.startedAt;
    await this.batchRepo.update(batch);

    if (failedItems.length === 0) {
      batch.batchStatus = 'completed';
      batch.completedAt = new Date().toISOString();
      batch.updatedAt = batch.completedAt;
      await this.batchRepo.update(batch);
    }

    return { batch, markedItems, failedItems };
  }

  async executeDeterministicBatchItem(markingBatchItemId: string): Promise<MarkingBatchItem> {
    const item = await this.batchItemRepo.findById(markingBatchItemId);
    if (!item) throw new Error('NOT_FOUND: Batch item not found');
    if (item.itemMode !== 'deterministic' && item.itemMode !== 'rubric_deterministic') {
      throw new Error('UNSUPPORTED_QUESTION_TYPE: Item mode does not support deterministic marking');
    }
    item.itemStatus = 'marked_deterministically';
    item.completedAt = new Date().toISOString();
    item.updatedAt = item.completedAt;
    return this.batchItemRepo.update(item);
  }

  async executeRubricDeterministicBatchItem(markingBatchItemId: string): Promise<MarkingBatchItem> {
    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.RUBRIC_MARKING_INVOCATION;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const item = await this.batchItemRepo.findById(markingBatchItemId);
    if (!item) throw new Error('NOT_FOUND: Batch item not found');
    if (item.itemMode !== 'rubric_deterministic') {
      throw new Error('UNSUPPORTED_QUESTION_TYPE: Item mode does not support rubric deterministic marking');
    }
    item.itemStatus = 'marked_deterministically';
    item.completedAt = new Date().toISOString();
    item.updatedAt = item.completedAt;
    return this.batchItemRepo.update(item);
  }

  async markUnsupportedItemDeferred(markingBatchItemId: string): Promise<MarkingBatchItem> {
    const item = await this.batchItemRepo.findById(markingBatchItemId);
    if (!item) throw new Error('NOT_FOUND: Batch item not found');
    item.itemStatus = 'skipped';
    item.itemMode = 'unsupported_deferred';
    item.safeItemSummary = 'Deferred: unsupported for deterministic marking';
    item.updatedAt = new Date().toISOString();
    return this.batchItemRepo.update(item);
  }
}
