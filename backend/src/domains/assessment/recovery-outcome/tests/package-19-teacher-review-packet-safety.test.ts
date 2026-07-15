import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryOutcomeTeacherReviewPacketService } from '../services/recoveryOutcomeTeacherReviewPacketService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { InMemoryRecoveryOutcomeTeacherReviewPacketRepository, InMemoryRecoveryOutcomeAuditRepository, InMemoryRecoveryOutcomeIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import type { RecoveryOutcomeCommandContext } from '../contracts/recoveryOutcomeContracts';

function makeCtx(overrides?: Partial<RecoveryOutcomeCommandContext>): RecoveryOutcomeCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

function makePacketInput() {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    teacherRef: 'teacher-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryOutcomeDecisionReadinessId: 'readiness-1',
    safeReviewPacketSummary: 'Teacher review of outcome readiness',
    readinessSnapshotJson: { checks: 'all passed' },
    decisionDraftRefsJson: { continuationDraftId: 'cd-1', closureDraftId: 'cd-2' },
    sourceRefsJson: { progressSummaryId: 'psum-1', evidenceRollupId: 'eroll-1' },
  };
}

describe('Package 19 — Teacher Review Packet Safety', () => {
  let packetRepo: InMemoryRecoveryOutcomeTeacherReviewPacketRepository;
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let service: RecoveryOutcomeTeacherReviewPacketService;

  beforeEach(() => {
    packetRepo = new InMemoryRecoveryOutcomeTeacherReviewPacketRepository();
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    service = new RecoveryOutcomeTeacherReviewPacketService(packetRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates packet via service with teacherRef', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('TEACHER_REVIEW_PACKET_CREATED');
  });

  it('get packet by ID', async () => {
    const created = await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const fetched = await service.getTeacherReviewPacket(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
    const data = fetched.data as any;
    expect(data.teacherRef).toBe('teacher-1');
  });

  it('get returns not_found for missing packet', async () => {
    const result = await service.getTeacherReviewPacket(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('list by school', async () => {
    await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const list = await service.listPacketsForSchool(makeCtx());
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by student', async () => {
    await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const list = await service.listPacketsForStudent(makeCtx(), 'student-1');
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by plan', async () => {
    await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const list = await service.listPacketsForPlan(makeCtx(), 'plan-1');
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by teacher', async () => {
    await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const list = await service.listPacketsForTeacher(makeCtx(), 'teacher-1');
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by teacher returns empty for non-matching', async () => {
    await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const list = await service.listPacketsForTeacher(makeCtx(), 'other-teacher');
    expect((list.data as any[]).length).toBe(0);
  });

  it('status transitions on packet', async () => {
    const created = await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    const id = created.resourceId!;

    const reviewReady = await service.markPacketReviewReady(makeCtx(), id);
    expect(reviewReady.status).toBe('review_ready');

    const approved = await service.approvePacketForFutureUse(makeCtx(), id);
    expect(approved.status).toBe('approved_for_future_use');

    const suppressed = await service.suppressPacket(makeCtx(), id);
    expect(suppressed.status).toBe('suppressed');

    const blocked = await service.blockPacket(makeCtx(), id);
    expect(blocked.status).toBe('blocked');

    const voided = await service.voidPacket(makeCtx(), id);
    expect(voided.status).toBe('void');
  });

  it('packet does not execute live decisions (draft-only)', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ idempotencyKey: 'idem-draft-only' }), makePacketInput());
    expect(result.ok).toBe(true);
    const data = result.data as any;
    expect(data.packetStatus).toBe('draft');
    expect(data.readinessSnapshotJson).toBeDefined();
    expect(data.decisionDraftRefsJson).toBeDefined();
  });

  it('student role is blocked from creating packets', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ actorRole: 'student' }), makePacketInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
    expect(result.status).toBe('blocked');
  });

  it('parent role is blocked from creating packets', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ actorRole: 'parent' }), makePacketInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('missing schoolId blocks packet creation', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ schoolId: '' } as any), makePacketInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('missing sourceRefs blocks packet creation', async () => {
    const input = { ...makePacketInput(), sourceRefsJson: {} };
    const result = await service.createTeacherReviewPacket(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SOURCE_REFS_MISSING');
  });

  it('packet contains readinessSnapshotJson', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ idempotencyKey: 'idem-readiness' }), makePacketInput());
    const data = result.data as any;
    expect(data.readinessSnapshotJson).toEqual({ checks: 'all passed' });
  });

  it('packet contains decisionDraftRefsJson', async () => {
    const result = await service.createTeacherReviewPacket(makeCtx({ idempotencyKey: 'idem-drafts' }), makePacketInput());
    const data = result.data as any;
    expect(data.decisionDraftRefsJson).toEqual({ continuationDraftId: 'cd-1', closureDraftId: 'cd-2' });
  });

  it('cannot review voided packet', async () => {
    const created = await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    await service.voidPacket(makeCtx(), created.resourceId!);
    const result = await service.markPacketReviewReady(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('cannot void already voided packet', async () => {
    const created = await service.createTeacherReviewPacket(makeCtx(), makePacketInput());
    await service.voidPacket(makeCtx(), created.resourceId!);
    const result = await service.voidPacket(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });
});
