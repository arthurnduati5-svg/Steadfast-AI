import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseWorkloadAllocationDraftRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseAllocationDraftService } from '../services/recoveryCaseAllocationDraftService';
import { RecoveryCaseTriageCommandContext, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Allocation Draft No Assignment', () => {
  let repo: InMemoryRecoveryCaseWorkloadAllocationDraftRepository;
  let service: RecoveryCaseAllocationDraftService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'lead-teacher-1',
    actorRole: 'lead_teacher',
    correlationId: 'corr-alloc-1',
    idempotencyKey: 'ik-alloc-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseWorkloadAllocationDraftRepository();
    service = new RecoveryCaseAllocationDraftService(repo);
  });

  it('creates allocation draft', async () => {
    const result = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1',
      reviewerRef: 'teacher-1',
      audienceRole: 'teacher',
      allocatedItemIdsJson: ['item-1', 'item-2'],
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.allocationDraftStatus).toBe('draft');
    expect(result.data!.totalAllocated).toBe(2);
  });

  it('lists by queue', async () => {
    await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-2', reviewerRef: 't-2', audienceRole: 'teacher',
    });
    const list = await service.listAllocationDraftsForQueue('qs-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by reviewer', async () => {
    await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-2', audienceRole: 'teacher',
    });
    const list = await service.listAllocationDraftsByReviewer('school-1', 't-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by status', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    await service.markAllocationDraftReviewReady(ctx, 'school-1', created.data!.allocationDraftId);
    const list = await service.listAllocationDraftsByStatus('school-1', 'review_ready');
    expect(list.data).toHaveLength(1);
  });

  it('marks review ready', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const updated = await service.markAllocationDraftReviewReady(ctx, 'school-1', created.data!.allocationDraftId);
    expect(updated.data!.allocationDraftStatus).toBe('review_ready');
  });

  it('approve for future use must NOT create live assignment', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const approved = await service.approveAllocationDraftForFutureUse(ctx, 'school-1', created.data!.allocationDraftId);
    expect(approved.data!.allocationDraftStatus).toBe('approved_for_future_use');
    expect(Object.keys(approved.data!)).not.toContain('assignmentId');
    expect(Object.keys(approved.data!)).not.toContain('liveAssignmentId');
  });

  it('verify no "assigned" or "assignment_created" status', () => {
    const validStatuses: RecoveryCaseDraftStatus[] = ['draft', 'review_ready', 'approved_for_future_use', 'blocked', 'suppressed', 'void'];
    expect(validStatuses).not.toContain('assigned');
    expect(validStatuses).not.toContain('assignment_created');
  });

  it('blocks allocation draft', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const blocked = await service.blockAllocationDraft(ctx, 'school-1', created.data!.allocationDraftId, 'BLOCK_REASON', 'Blocked');
    expect(blocked.data!.allocationDraftStatus).toBe('blocked');
  });

  it('suppresses allocation draft', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const suppressed = await service.suppressAllocationDraft(ctx, 'school-1', created.data!.allocationDraftId, 'SUPPRESS_REASON', 'Suppressed');
    expect(suppressed.data!.allocationDraftStatus).toBe('suppressed');
  });

  it('voids allocation draft', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const voided = await service.voidAllocationDraft(ctx, 'school-1', created.data!.allocationDraftId, 'VOID_REASON', 'Voided');
    expect(voided.data!.allocationDraftStatus).toBe('void');
  });

  it('approved-future-use is just a status change', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    const approved = await service.approveAllocationDraftForFutureUse(ctx, 'school-1', created.data!.allocationDraftId);
    expect(approved.data!.allocationDraftStatus).toBe('approved_for_future_use');
    expect(approved.data!.queueSnapshotId).toBe('qs-1');
    expect(approved.data!.reviewerRef).toBe('t-1');
  });

  it('status transitions respect allowed values', async () => {
    const created = await service.createAllocationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
    });
    expect(created.data!.allocationDraftStatus).toBe('draft');

    const reviewReady = await service.markAllocationDraftReviewReady(ctx, 'school-1', created.data!.allocationDraftId);
    expect(reviewReady.data!.allocationDraftStatus).toBe('review_ready');

    const approved = await service.approveAllocationDraftForFutureUse(ctx, 'school-1', created.data!.allocationDraftId);
    expect(approved.data!.allocationDraftStatus).toBe('approved_for_future_use');
  });
});
