import { describe, it, expect } from 'vitest';
import type { ResultReleaseCommandContext } from '../contracts/resultReleaseContracts';
import {
  InMemoryResultAudienceProjectionRepository,
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
} from '../repositories/inMemoryResultReleaseRepositories';
import { ResultReleaseAuditBridge } from '../services/resultReleaseAuditBridge';
import { ResultReleaseIdempotencyService } from '../services/resultReleaseIdempotencyService';
import { ResultAudienceProjectionService } from '../services/resultAudienceProjectionService';

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

describe('Package 11 - Audience Projections', () => {
  const projectionRepo = new InMemoryResultAudienceProjectionRepository();
  const packetRepo = new InMemoryResultReleasePacketRepository();
  const auditRepo = new InMemoryResultReleaseAuditRepository();
  const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();
  const auditBridge = new ResultReleaseAuditBridge(auditRepo);
  const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
  const projectionService = new ResultAudienceProjectionService(projectionRepo, auditBridge, idempotencyService);

  it('should create audience projection from packet', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-proj-${Date.now()}` });
    const result = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-1',
      studentRef: 'student-1',
      audienceType: 'student',
      safeProjectionSummary: 'Student projection test',
      allowedFieldsJson: { fields: ['studentRef', 'safeAchievementSummary'] },
      blockedFieldsJson: { fields: ['answerKeyText'] },
      redactionRulesJson: { rules: ['removeInternal'] },
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('generated');
  });

  it('should generate projection that is audience-scoped', async () => {
    const ctx = makeCtx({ idempotencyKey: `scope-proj-${Date.now()}` });
    const result = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-1',
      studentRef: 'student-1',
      audienceType: 'parent',
      safeProjectionSummary: 'Parent scoped projection',
    });
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.audienceType).toBe('parent');
    expect(data.resultReleasePacketId).toBe('packet-1');
  });

  it('should freeze allowedFieldsJson and blockedFieldsJson', async () => {
    const ctx = makeCtx({ idempotencyKey: `freeze-proj-${Date.now()}` });
    const result = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-2',
      studentRef: 'student-2',
      audienceType: 'teacher',
      safeProjectionSummary: 'Teacher projection',
      allowedFieldsJson: { studentRef: true, safeStatusSummary: true },
      blockedFieldsJson: { rubricInternal: true, hiddenReasoning: true },
    });
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.allowedFieldsJson).toEqual({ studentRef: true, safeStatusSummary: true });
    expect(data.blockedFieldsJson).toEqual({ rubricInternal: true, hiddenReasoning: true });
  });

  it('should generate projection with default projectionVersion 1', async () => {
    const ctx = makeCtx({ idempotencyKey: `version-proj-${Date.now()}` });
    const result = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-3',
      studentRef: 'student-3',
      audienceType: 'admin',
      safeProjectionSummary: 'Admin projection',
    });
    const data = (result as any).data;
    expect(data.projectionVersion).toBe(1);
  });

  it('should get audience projection by id', async () => {
    const ctx = makeCtx({ idempotencyKey: `get-proj-${Date.now()}` });
    const created = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-4',
      studentRef: 'student-4',
      audienceType: 'student',
      safeProjectionSummary: 'Get test',
    });
    const projId = created.resourceId!;
    const result = await projectionService.getAudienceProjection(ctx, projId);
    expect(result.ok).toBe(true);
    expect(result.data).toBeTruthy();
  });

  it('should list audience projections for packet', async () => {
    const ctx = makeCtx({ idempotencyKey: `list-proj-${Date.now()}` });
    const result = await projectionService.listAudienceProjectionsForPacket(ctx, 'packet-1');
    expect(result.ok).toBe(true);
    expect(Array.isArray((result as any).data)).toBe(true);
  });

  it('should block a projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-proj-${Date.now()}` });
    const created = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-5',
      studentRef: 'student-5',
      audienceType: 'student',
      safeProjectionSummary: 'To block',
    });
    const projId = created.resourceId!;
    const result = await projectionService.blockAudienceProjection(ctx, projId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void a projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-proj-${Date.now()}` });
    const created = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-6',
      studentRef: 'student-6',
      audienceType: 'student',
      safeProjectionSummary: 'To void',
    });
    const projId = created.resourceId!;
    const result = await projectionService.voidAudienceProjection(ctx, projId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should block missing schoolId', async () => {
    const ctx = makeCtx({ schoolId: '', idempotencyKey: `bad-proj-${Date.now()}` });
    const result = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-7',
      studentRef: 'student-7',
      audienceType: 'student',
      safeProjectionSummary: 'No school',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should not block voided projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-voided-${Date.now()}` });
    const created = await projectionService.generateAudienceProjection(ctx, {
      resultReleasePacketId: 'packet-8',
      studentRef: 'student-8',
      audienceType: 'student',
      safeProjectionSummary: 'Block voided',
    });
    const projId = created.resourceId!;
    await projectionService.voidAudienceProjection(ctx, projId);
    const result = await projectionService.blockAudienceProjection(ctx, projId);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });
});
