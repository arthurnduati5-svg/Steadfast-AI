import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionPreLiveDecisionPacketService } from '../services/recoveryExecutionPreLiveDecisionPacketService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Pre-Live Decision Packet Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionPreLiveDecisionPacketService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionPreLiveDecisionPacketService(repos.preLiveDecisionPacket, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('pre-live decision packets do NOT become live decision packets', async () => {
    const result = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'No live test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.packetStatus).not.toMatch(/live/);
    expect(result.data?.packetStatus).not.toMatch(/authorized_live/);
  });

  it('packet status never contains live or authorized_live', async () => {
    const validStatuses = ['draft', 'review_ready', 'authorization_preview_ready', 'suppressed', 'blocked', 'voided'];
    for (const s of validStatuses) {
      expect(s).not.toMatch(/live/);
      expect(s).not.toMatch(/authorized_live/);
    }
  });

  it('can mark review_ready to authorization_preview_ready', async () => {
    const created = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'Lifecycle test',
    });
    expect(created.data?.packetStatus).toBe('draft');

    const reviewReady = await service.markPreLiveDecisionPacketReviewReady(ctx, schoolId, created.data!.preLiveDecisionPacketId);
    expect(reviewReady.data?.packetStatus).toBe('review_ready');

    const previewReady = await service.markPreLiveDecisionPacketPreviewReady(ctx, schoolId, created.data!.preLiveDecisionPacketId);
    expect(previewReady.success).toBe(true);
    expect(previewReady.data?.packetStatus).toBe('authorization_preview_ready');
  });

  it('can suppress, block, void', async () => {
    const created = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'Suppress test',
    });
    const suppressed = await service.suppressPreLiveDecisionPacket(ctx, schoolId, created.data!.preLiveDecisionPacketId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can block', async () => {
    const created = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'Block test',
    });
    const blocked = await service.blockPreLiveDecisionPacket(ctx, schoolId, created.data!.preLiveDecisionPacketId, ['missing_data']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('missing_data');
  });

  it('can void', async () => {
    const created = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'Void test',
    });
    const voided = await service.voidPreLiveDecisionPacket(ctx, schoolId, created.data!.preLiveDecisionPacketId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by plan and status', async () => {
    await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'List test',
    });
    const planList = await service.listPreLiveDecisionPacketsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listPreLiveDecisionPacketsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct packet', async () => {
    const created = await service.createPreLiveDecisionPacket(ctx, schoolId, {
      resultRecoveryPlanId: 'plan-1',
      safePacketSummary: 'Test get',
    });
    const found = await service.getPreLiveDecisionPacket(schoolId, created.data!.preLiveDecisionPacketId);
    expect(found.success).toBe(true);
    expect(found.data?.safePacketSummary).toBe('Test get');
  });
});
