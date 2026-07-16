import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseReviewWindowDraftRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseReviewWindowDraftService } from '../services/recoveryCaseReviewWindowDraftService';
import { RecoveryCaseTriageCommandContext, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Review Window No Calendar', () => {
  let repo: InMemoryRecoveryCaseReviewWindowDraftRepository;
  let service: RecoveryCaseReviewWindowDraftService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'lead-teacher-1',
    actorRole: 'lead_teacher',
    correlationId: 'corr-rw-1',
    idempotencyKey: 'ik-rw-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseReviewWindowDraftRepository();
    service = new RecoveryCaseReviewWindowDraftService(repo);
  });

  it('creates review window draft with start/end dates', async () => {
    const result = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1',
      reviewerRef: 'teacher-1',
      audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z',
      windowEndAt: '2026-07-20T17:00:00.000Z',
      maxCapacity: 10,
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.reviewWindowDraftStatus).toBe('draft');
    expect(result.data!.windowStartAt).toBe('2026-07-20T08:00:00.000Z');
    expect(result.data!.windowEndAt).toBe('2026-07-20T17:00:00.000Z');
  });

  it('lists by queue', async () => {
    await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-2', reviewerRef: 't-2', audienceRole: 'teacher',
      windowStartAt: '2026-07-21T08:00:00.000Z', windowEndAt: '2026-07-21T17:00:00.000Z', maxCapacity: 5,
    });
    const list = await service.listReviewWindowDraftsForQueue('qs-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by reviewer', async () => {
    await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const list = await service.listReviewWindowDraftsByReviewer('school-1', 't-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by status', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    await service.markReviewWindowDraftReviewReady(ctx, 'school-1', created.data!.reviewWindowDraftId);
    const list = await service.listReviewWindowDraftsByStatus('school-1', 'review_ready');
    expect(list.data).toHaveLength(1);
  });

  it('marks review ready', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const updated = await service.markReviewWindowDraftReviewReady(ctx, 'school-1', created.data!.reviewWindowDraftId);
    expect(updated.data!.reviewWindowDraftStatus).toBe('review_ready');
  });

  it('approve for future use must NOT create calendar event', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const approved = await service.approveReviewWindowForFutureUse(ctx, 'school-1', created.data!.reviewWindowDraftId);
    expect(approved.data!.reviewWindowDraftStatus).toBe('approved_for_future_use');
    expect(Object.keys(approved.data!)).not.toContain('calendarEventId');
    expect(Object.keys(approved.data!)).not.toContain('calendarEventCreated');
  });

  it('verify no calendar event creation in service methods', () => {
    const methods = Object.getOwnPropertyNames(RecoveryCaseReviewWindowDraftService.prototype);
    expect(methods).not.toContain('createCalendarEvent');
    expect(methods).not.toContain('syncWithCalendar');
    expect(methods).not.toContain('publishCalendarEvent');
  });

  it('blocks review window draft', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const blocked = await service.blockReviewWindowDraft(ctx, 'school-1', created.data!.reviewWindowDraftId, 'BLOCK_REASON', 'Blocked');
    expect(blocked.data!.reviewWindowDraftStatus).toBe('blocked');
  });

  it('suppresses review window draft', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const suppressed = await service.suppressReviewWindowDraft(ctx, 'school-1', created.data!.reviewWindowDraftId, 'SUPPRESS_REASON', 'Suppressed');
    expect(suppressed.data!.reviewWindowDraftStatus).toBe('suppressed');
  });

  it('voids review window draft', async () => {
    const created = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z', windowEndAt: '2026-07-20T17:00:00.000Z', maxCapacity: 5,
    });
    const voided = await service.voidReviewWindowDraft(ctx, 'school-1', created.data!.reviewWindowDraftId, 'VOID_REASON', 'Voided');
    expect(voided.data!.reviewWindowDraftStatus).toBe('void');
  });

  it('validates windowEnd > windowStart', async () => {
    const result = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T17:00:00.000Z',
      windowEndAt: '2026-07-20T08:00:00.000Z',
      maxCapacity: 5,
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
    expect(result.message).toContain('windowEnd must be after windowStart');
  });

  it('rejects equal start and end times', async () => {
    const result = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: '2026-07-20T08:00:00.000Z',
      windowEndAt: '2026-07-20T08:00:00.000Z',
      maxCapacity: 5,
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('rejects invalid date strings', async () => {
    const result = await service.createReviewWindowDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', reviewerRef: 't-1', audienceRole: 'teacher',
      windowStartAt: 'not-a-date',
      windowEndAt: '2026-07-20T17:00:00.000Z',
      maxCapacity: 5,
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });
});
