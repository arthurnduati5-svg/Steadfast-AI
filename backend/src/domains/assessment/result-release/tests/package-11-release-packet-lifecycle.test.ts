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

function makeCtx(overrides?: Partial<ResultReleaseCommandContext>): ResultReleaseCommandContext {
  return {
    schoolId: 'test-school',
    actorId: 'test-actor',
    actorRole: 'admin',
    correlationId: 'test-correlation',
    idempotencyKey: 'test-ik',
    ...overrides,
  };
}

describe('Package 11 - Release Packet Lifecycle', () => {
  const packetRepo = new InMemoryResultReleasePacketRepository();
  const approvalRepo = new InMemoryResultReleaseApprovalRepository();
  const auditRepo = new InMemoryResultReleaseAuditRepository();
  const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();
  const auditBridge = new ResultReleaseAuditBridge(auditRepo);
  const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
  const packetService = new ResultReleasePacketService(packetRepo, approvalRepo, auditBridge, idempotencyService);

  const baseInput = {
    schoolId: 'test-school',
    resultFinalizationDecisionId: 'fd-1',
    resultReleaseReadinessId: 'rr-1',
    resultReleaseBoundaryId: 'rb-1',
    markingResultVersionId: 'mv-1',
    studentRef: 'student-1',
    packetAudience: 'student' as const,
    packetMode: 'student_safe_result' as const,
    safePacketSummary: 'Test release packet',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };

  it('should create a release packet with draft status', async () => {
    const ctx = makeCtx({ idempotencyKey: 'create-draft-1' });
    const result = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('draft');
  });

  it('should return blocked when schoolId is missing', async () => {
    const ctx = makeCtx({ schoolId: '', idempotencyKey: 'no-school-1' });
    const result = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should return blocked when actor role is student', async () => {
    const ctx = makeCtx({ actorRole: 'student', idempotencyKey: 'student-create-1' });
    const result = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('FORBIDDEN');
  });

  it('should get release packet by id', async () => {
    const ctx = makeCtx({ idempotencyKey: 'get-packet-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.getReleasePacket(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.data).toBeTruthy();
  });

  it('should list release packets for school', async () => {
    const ctx = makeCtx({ idempotencyKey: 'list-packet-1' });
    const result = await packetService.listReleasePacketsForSchool(ctx);
    expect(result.ok).toBe(true);
    expect(Array.isArray((result as any).data)).toBe(true);
  });

  it('should run source checks and transition to source_check_pending', async () => {
    const ctx = makeCtx({ idempotencyKey: 'source-check-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.runReleaseSourceChecks(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('source_check_pending');
  });

  it('should transition to boundary_checked', async () => {
    const ctx = makeCtx({ idempotencyKey: 'boundary-check-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    await packetService.runReleaseSourceChecks(ctx, packetId);
    const result = await packetService.markPacketBoundaryChecked(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('boundary_checked');
  });

  it('should transition to ready_for_approval', async () => {
    const ctx = makeCtx({ idempotencyKey: 'ready-approval-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    await packetService.runReleaseSourceChecks(ctx, packetId);
    await packetService.markPacketBoundaryChecked(ctx, packetId);
    const result = await packetService.markPacketReadyForApproval(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('ready_for_approval');
  });

  it('should block a packet', async () => {
    const ctx = makeCtx({ idempotencyKey: 'block-packet-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.blockReleasePacket(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should cancel a packet', async () => {
    const ctx = makeCtx({ idempotencyKey: 'cancel-packet-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.cancelReleasePacket(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('cancelled');
  });

  it('should void a packet', async () => {
    const ctx = makeCtx({ idempotencyKey: 'void-packet-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.voidReleasePacket(ctx, packetId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should not send or publish anything (no notification imports in service)', async () => {
    const fs = await import('fs');
    const serviceContent = fs.readFileSync('backend/src/domains/assessment/result-release/services/resultReleasePacketService.ts', 'utf-8');
    expect(serviceContent).not.toContain('notify');
    expect(serviceContent).not.toContain('publish');
    expect(serviceContent).not.toContain('email');
    expect(serviceContent).not.toContain('sms');
    expect(serviceContent).not.toContain('whatsapp');
    expect(serviceContent).not.toContain('portal');
    expect(serviceContent).not.toContain('pdf');
  });

  it('should not change scores', async () => {
    const fs = await import('fs');
    const serviceContent = fs.readFileSync('backend/src/domains/assessment/result-release/services/resultReleasePacketService.ts', 'utf-8');
    expect(serviceContent).not.toContain('score');
    expect(serviceContent).not.toContain('grade');
  });

  it('should fail ready_for_approval if not boundary_checked', async () => {
    const ctx = makeCtx({ idempotencyKey: 'invalid-transition-1' });
    const created = await packetService.createReleasePacketFromFinalizedResult(ctx, baseInput);
    const packetId = created.resourceId!;
    const result = await packetService.markPacketReadyForApproval(ctx, packetId);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS_TRANSITION');
  });
});
