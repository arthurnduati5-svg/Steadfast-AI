import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryPostSimulationHandoffPacketService } from '../services/recoveryPostSimulationHandoffPacketService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Handoff Packet Lifecycle', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryPostSimulationHandoffPacketService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryPostSimulationHandoffPacketService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates handoff packet in draft status', async () => {
    const result = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Handoff packet test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.handoffStatus).toBe('draft');
    expect(result.data?.schoolId).toBe(schoolId);
  });

  it('blocks creation when empty safeHandoffSummary', async () => {
    const result = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: '',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('BLOCKED');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createHandoffPacket(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('transitions from draft to review_ready to handoff_ready to approved_for_future_use', async () => {
    const created = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Test lifecycle',
    });
    expect(created.data?.handoffStatus).toBe('draft');

    const reviewReady = await service.markHandoffPacketReviewReady(ctx, created.data!.handoffPacketId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.handoffStatus).toBe('review_ready');

    const handoffReady = await service.markHandoffPacketHandoffReady(ctx, created.data!.handoffPacketId);
    expect(handoffReady.success).toBe(true);
    expect(handoffReady.data?.handoffStatus).toBe('handoff_ready');

    const approved = await service.approveHandoffPacketForFutureUse(ctx, created.data!.handoffPacketId);
    expect(approved.success).toBe(true);
    expect(approved.data?.handoffStatus).toBe('approved_for_future_use');
  });

  it('handoff packets never contain live or executed status', async () => {
    const created = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'No live test',
    });
    expect(created.data?.handoffStatus).not.toMatch(/live/);
    expect(created.data?.handoffStatus).not.toMatch(/executed/);
  });

  it('can suppress, block, and void packet', async () => {
    const created = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Test',
    });
    const id = created.data!.handoffPacketId;

    const suppressed = await service.suppressHandoffPacket(ctx, id);
    expect(suppressed.data?.handoffStatus).toBe('suppressed');

    const blocked = await service.blockHandoffPacket(ctx, id);
    expect(blocked.data?.handoffStatus).toBe('blocked');

    const voided = await service.voidHandoffPacket(ctx, id);
    expect(voided.data?.handoffStatus).toBe('voided');
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Test list',
    });
    const schoolList = await service.listHandoffPacketsForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listHandoffPacketsForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listHandoffPacketsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listHandoffPacketsByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct packet', async () => {
    const created = await service.createHandoffPacket(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeHandoffSummary: 'Test get',
    });
    const found = await service.getHandoffPacket(schoolId, created.data!.handoffPacketId);
    expect(found.success).toBe(true);
    expect(found.data?.safeHandoffSummary).toBe('Test get');
  });
});
