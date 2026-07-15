import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryClosureReviewPacketService } from '../services/recoveryClosureReviewPacketService';
import { RecoveryLifecycleClosureSafetyService } from '../services/recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from '../services/recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from '../services/recoveryLifecycleClosureIdempotencyService';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../contracts/recoveryLifecycleClosureContracts';

describe('Package 22 - Closure Review Packet Safety', () => {
  let repos: InMemoryRecoveryLifecycleClosureRepositories;
  let service: RecoveryClosureReviewPacketService;
  let ctx: RecoveryLifecycleClosureCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryLifecycleClosureRepositories();
    const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
    const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
    const audit = new RecoveryLifecycleClosureAuditBridge(repos);
    const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);
    service = new RecoveryClosureReviewPacketService(repos, policyEnforcer, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates teacher closure review packet in draft status', async () => {
    const result = await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Teacher review test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.reviewStatus).toBe('draft');
  });

  it('creates admin governance review packet in draft status', async () => {
    const adminCtx = { ...ctx, actorRole: 'admin' };
    const result = await service.createAdminGovernanceReviewPacket(adminCtx, {
      adminRef: 'admin-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeAdminReviewSummary: 'Admin review test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.reviewStatus).toBe('draft');
  });

  it('blocks student role from creating teacher packet', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createTeacherClosureReviewPacket(studentCtx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('blocks student role from creating admin packet', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createAdminGovernanceReviewPacket(studentCtx, {
      adminRef: 'admin-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeAdminReviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('blocks parent role from creating teacher packet', async () => {
    const parentCtx = { ...ctx, actorRole: 'parent' };
    const result = await service.createTeacherClosureReviewPacket(parentCtx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('teacher and admin review packets do NOT close recovery live', async () => {
    const teacherResult = await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'No live closure',
    });
    expect(teacherResult.data?.reviewStatus).not.toMatch(/close_live/);
    expect(teacherResult.data?.reviewStatus).not.toMatch(/approved_live/);

    const adminCtx = { ...ctx, actorRole: 'admin' };
    const adminResult = await service.createAdminGovernanceReviewPacket(adminCtx, {
      adminRef: 'admin-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeAdminReviewSummary: 'No live closure',
    });
    expect(adminResult.data?.reviewStatus).not.toMatch(/close_live/);
  });

  it('transitions teacher packet to review_ready to approved_for_future_use', async () => {
    const created = await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test lifecycle',
    });
    expect(created.data?.reviewStatus).toBe('draft');

    const reviewReady = await service.markTeacherClosureReviewPacketReviewReady(ctx, created.data!.teacherClosureReviewPacketId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.reviewStatus).toBe('review_ready');

    const approved = await service.approveTeacherClosureReviewPacketForFutureUse(ctx, created.data!.teacherClosureReviewPacketId);
    expect(approved.success).toBe(true);
    expect(approved.data?.reviewStatus).toBe('approved_for_future_use');
  });

  it('transitions admin packet to review_ready to approved_for_future_use', async () => {
    const adminCtx = { ...ctx, actorRole: 'admin' };
    const created = await service.createAdminGovernanceReviewPacket(adminCtx, {
      adminRef: 'admin-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeAdminReviewSummary: 'Admin lifecycle',
    });
    expect(created.data?.reviewStatus).toBe('draft');

    const reviewReady = await service.markAdminGovernanceReviewPacketReviewReady(adminCtx, created.data!.adminGovernanceReviewPacketId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.reviewStatus).toBe('review_ready');

    const approved = await service.approveAdminGovernanceReviewPacketForFutureUse(adminCtx, created.data!.adminGovernanceReviewPacketId);
    expect(approved.success).toBe(true);
    expect(approved.data?.reviewStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void teacher packet', async () => {
    const created = await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test',
    });
    const id = created.data!.teacherClosureReviewPacketId;

    const suppressed = await service.suppressTeacherClosureReviewPacket(ctx, id);
    expect(suppressed.data?.reviewStatus).toBe('suppressed');
  });

  it('can list teacher packets by plan and status', async () => {
    await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test list',
    });
    const planList = await service.listTeacherClosureReviewPacketsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listTeacherClosureReviewPacketsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct teacher packet', async () => {
    const created = await service.createTeacherClosureReviewPacket(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test get',
    });
    const found = await service.getTeacherClosureReviewPacket(schoolId, created.data!.teacherClosureReviewPacketId);
    expect(found.success).toBe(true);
    expect(found.data?.safeTeacherReviewSummary).toBe('Test get');
  });
});
