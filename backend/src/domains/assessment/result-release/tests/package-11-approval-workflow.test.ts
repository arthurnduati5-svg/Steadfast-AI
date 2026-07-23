import { describe, it, expect } from 'vitest';
import type { ResultReleaseCommandContext } from '../contracts/resultReleaseContracts';
import {
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseApprovalRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
} from '../repositories/inMemoryResultReleaseRepositories';
import { ResultReleaseAuditBridge } from '../services/resultReleaseAuditBridge';
import { ResultReleaseIdempotencyService } from '../services/resultReleaseIdempotencyService';
import { ResultReleasePacketService } from '../services/resultReleasePacketService';
import { ResultReleaseApprovalService } from '../services/resultReleaseApprovalService';
import { BLOCKED_APPROVAL_ROLES, ALLOWED_APPROVAL_ROLES } from '../contracts/resultReleaseContracts';
import { evaluateReleaseApprovalPolicy } from '../policies/resultReleasePolicyDefinitions';
import { readBackendSrcFile } from '../../../../test-utils/repositoryPaths';

function makeCtx(overrides?: Partial<ResultReleaseCommandContext>): ResultReleaseCommandContext {
  return {
    schoolId: 'test-school',
    actorId: 'test-actor',
    actorRole: 'admin',
    correlationId: 'test-correlation',
    idempotencyKey: `ik-${Date.now()}-${Math.random()}`,
    ...overrides,
  };
}

async function createReadyPacket(
  packetService: ResultReleasePacketService,
  ctx: ResultReleaseCommandContext,
): Promise<string> {
  const baseInput = {
    schoolId: ctx.schoolId,
    resultFinalizationDecisionId: 'fd-1',
    resultReleaseReadinessId: 'rr-1',
    resultReleaseBoundaryId: 'rb-1',
    markingResultVersionId: 'mv-1',
    studentRef: 'student-1',
    packetAudience: 'student' as const,
    packetMode: 'student_safe_result' as const,
    safePacketSummary: 'Test packet for approval',
    createdByActorId: ctx.actorId,
    createdByRole: ctx.actorRole,
  };
  const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
  const packetId = created.resourceId!;
  await packetService.runReleaseSourceChecks(ctx, packetId);
  await packetService.markPacketBoundaryChecked(ctx, packetId);
  await packetService.markPacketReadyForApproval(ctx, packetId);
  return packetId;
}

describe('Package 11 - Approval Workflow', () => {
  const packetRepo = new InMemoryResultReleasePacketRepository();
  const approvalRepo = new InMemoryResultReleaseApprovalRepository();
  const auditRepo = new InMemoryResultReleaseAuditRepository();
  const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();
  const auditBridge = new ResultReleaseAuditBridge(auditRepo);
  const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
  const packetService = new ResultReleasePacketService(packetRepo, approvalRepo, auditBridge, idempotencyService);
  const approvalService = new ResultReleaseApprovalService(approvalRepo, packetRepo, auditBridge, idempotencyService);

  it('should create approval for packet ready_for_approval', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const result = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'teacher_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'Approval test',
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('draft');
  });

  it('should allow teacher to approve', async () => {
    const ctx = makeCtx({ actorRole: 'teacher', idempotencyKey: `teacher-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const approval = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'teacher_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'Teacher approval',
    });
    const result = await approvalService.approveReleasePacket(ctx, approval.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved');
  });

  it('should allow lead_teacher to approve', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'lead_teacher' });
    expect(decision.allowed).toBe(true);
  });

  it('should allow department_head to approve', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'department_head' });
    expect(decision.allowed).toBe(true);
  });

  it('should allow admin to approve', async () => {
    const ctx = makeCtx({ actorRole: 'admin', idempotencyKey: `admin-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const approval = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'admin_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'Admin approval',
    });
    const result = await approvalService.approveReleasePacket(ctx, approval.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved');
  });

  it('should allow system_job to approve', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'system_job' });
    expect(decision.allowed).toBe(true);
  });

  it('should block student from approving', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'student' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('FORBIDDEN');
  });

  it('should block parent from approving', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'parent' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('FORBIDDEN');
  });

  it('should block guest from approving', async () => {
    const decision = evaluateReleaseApprovalPolicy({ schoolId: 's1', actorRole: 'guest' });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe('FORBIDDEN');
  });

  it('should reject approval packet', async () => {
    const ctx = makeCtx({ idempotencyKey: `reject-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const approval = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'teacher_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'To reject',
    });
    const result = await approvalService.rejectReleasePacket(ctx, approval.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('rejected');
  });

  it('should block an approval', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const approval = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'teacher_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'To block',
    });
    const result = await approvalService.blockReleaseApproval(ctx, approval.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void an approval', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-appr-${Date.now()}` });
    const packetId = await createReadyPacket(packetService, ctx);
    const approval = await approvalService.createReleaseApproval(ctx, {
      resultReleasePacketId: packetId,
      resultFinalizationDecisionId: 'fd-1',
      studentRef: 'student-1',
      approvalType: 'teacher_release_approval',
      approvedAudience: 'student',
      safeApprovalSummary: 'To void',
    });
    const result = await approvalService.voidReleaseApproval(ctx, approval.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should list ALLOWED_APPROVAL_ROLES correctly', () => {
    expect(ALLOWED_APPROVAL_ROLES).toEqual(['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job']);
  });

  it('should list BLOCKED_APPROVAL_ROLES correctly', () => {
    expect(BLOCKED_APPROVAL_ROLES).toEqual(['student', 'parent', 'guest', 'unknown']);
  });

  it('should not send notifications in approval service', async () => {
    const content = readBackendSrcFile('domains/assessment/result-release/services/resultReleaseApprovalService.ts');
    expect(content).not.toContain('notify');
    expect(content).not.toContain('publish');
    expect(content).not.toContain('email');
    expect(content).not.toContain('sms');
    expect(content).not.toContain('push');
    expect(content).not.toContain('whatsapp');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('pdf');
  });
});
