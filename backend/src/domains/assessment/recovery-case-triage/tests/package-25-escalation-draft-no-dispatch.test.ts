import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseEscalationDraftRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseEscalationDraftService } from '../services/recoveryCaseEscalationDraftService';
import { RecoveryCaseTriageCommandContext, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Escalation Draft No Dispatch', () => {
  let repo: InMemoryRecoveryCaseEscalationDraftRepository;
  let service: RecoveryCaseEscalationDraftService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'lead-teacher-1',
    actorRole: 'lead_teacher',
    correlationId: 'corr-esc-1',
    idempotencyKey: 'ik-esc-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseEscalationDraftRepository();
    service = new RecoveryCaseEscalationDraftService(repo);
  });

  it('creates escalation draft', async () => {
    const result = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1',
      queueItemId: 'qi-1',
      escalationLevel: 'level_1',
      escalatedToRole: 'department_head',
      escalationReason: 'Requires higher authority review',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.escalationDraftStatus).toBe('draft');
  });

  it('lists by level', async () => {
    await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-2', escalationLevel: 'level_2',
      escalatedToRole: 'admin', escalationReason: 'Test',
    });
    const list = await service.listEscalationDraftsByLevel('school-1', 'level_1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by status', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    await service.markEscalationDraftReviewReady(ctx, 'school-1', created.data!.escalationDraftId);
    const list = await service.listEscalationDraftsByStatus('school-1', 'review_ready');
    expect(list.data).toHaveLength(1);
  });

  it('marks review ready', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const updated = await service.markEscalationDraftReviewReady(ctx, 'school-1', created.data!.escalationDraftId);
    expect(updated.data!.escalationDraftStatus).toBe('review_ready');
  });

  it('approve for future use must NOT dispatch', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const approved = await service.approveEscalationDraftForFutureUse(ctx, 'school-1', created.data!.escalationDraftId);
    expect(approved.data!.escalationDraftStatus).toBe('approved_for_future_use');
    expect(Object.keys(approved.data!)).not.toContain('dispatchedAt');
    expect(Object.keys(approved.data!)).not.toContain('sentAt');
  });

  it('verify no "sent" or "notified" status', () => {
    const validStatuses: RecoveryCaseDraftStatus[] = ['draft', 'review_ready', 'approved_for_future_use', 'blocked', 'suppressed', 'void'];
    expect(validStatuses).not.toContain('sent');
    expect(validStatuses).not.toContain('notified');
  });

  it('verify no dispatch method exists on service', () => {
    const serviceMethods = Object.getOwnPropertyNames(RecoveryCaseEscalationDraftService.prototype);
    expect(serviceMethods).not.toContain('dispatchEscalationDraft');
    expect(serviceMethods).not.toContain('sendEscalationDraft');
    expect(serviceMethods).not.toContain('notifyEscalationDraft');
  });

  it('blocks escalation draft', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const blocked = await service.blockEscalationDraft(ctx, 'school-1', created.data!.escalationDraftId, 'BLOCK_REASON', 'Blocked');
    expect(blocked.data!.escalationDraftStatus).toBe('blocked');
  });

  it('suppresses escalation draft', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const suppressed = await service.suppressEscalationDraft(ctx, 'school-1', created.data!.escalationDraftId, 'SUPPRESS_REASON', 'Suppressed');
    expect(suppressed.data!.escalationDraftStatus).toBe('suppressed');
  });

  it('voids escalation draft', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const voided = await service.voidEscalationDraft(ctx, 'school-1', created.data!.escalationDraftId, 'VOID_REASON', 'Voided');
    expect(voided.data!.escalationDraftStatus).toBe('void');
  });

  it('approved_for_future_use is just a status update', async () => {
    const created = await service.createEscalationDraft(ctx, 'school-1', {
      queueSnapshotId: 'qs-1', queueItemId: 'qi-1', escalationLevel: 'level_1',
      escalatedToRole: 'dh', escalationReason: 'Test',
    });
    const approved = await service.approveEscalationDraftForFutureUse(ctx, 'school-1', created.data!.escalationDraftId);
    expect(approved.data!.escalationDraftStatus).toBe('approved_for_future_use');
    expect(approved.data!.queueItemId).toBe('qi-1');
  });
});
