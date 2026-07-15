import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryTeacherReviewPacketRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryTeacherReviewPacketService } from '../services/resultRecoveryTeacherReviewPacketService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-pkt',
    ...overrides,
  } as any;
}

describe('Package 17 — Teacher Review Packet Safety', () => {
  it('Teacher review packet can be created', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const result = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-001',
      teacherRef: 'teacher-001',
      studentRef: 'student-001',
      safePacketSummary: 'Review packet for student',
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.reasonCode).toBe('PACKET_CREATED');
  });

  it('Teacher review packet can be listed by plan', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    await service.createTeacherReviewPacket(makeCtx(), { resultRecoveryPlanId: 'plan-1', teacherRef: 't1', studentRef: 's1', safePacketSummary: 'P1' });
    await service.createTeacherReviewPacket(makeCtx(), { resultRecoveryPlanId: 'plan-1', teacherRef: 't2', studentRef: 's2', safePacketSummary: 'P2' });

    const list = await service.listTeacherReviewPacketsForPlan(makeCtx(), 'plan-1');
    expect(list.ok).toBe(true);
    const data = list.data as any[];
    expect(data.length).toBe(2);
  });

  it('Teacher review packet can be listed by teacherRef', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    await service.createTeacherReviewPacket(makeCtx(), { resultRecoveryPlanId: 'plan-a', teacherRef: 'teacher-xyz', studentRef: 's1', safePacketSummary: 'For X' });
    await service.createTeacherReviewPacket(makeCtx(), { resultRecoveryPlanId: 'plan-b', teacherRef: 'teacher-xyz', studentRef: 's2', safePacketSummary: 'For X 2' });

    const list = await service.listTeacherReviewPacketsForTeacher(makeCtx(), 'teacher-xyz');
    expect(list.ok).toBe(true);
    const data = list.data as any[];
    expect(data.length).toBe(2);
  });

  it('Teacher review packet can be marked ready', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const created = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-r', teacherRef: 't-r', studentRef: 's-r', safePacketSummary: 'Ready test',
    });
    const pktId = created.resourceId!;

    const ready = await service.markTeacherReviewPacketReady(makeCtx({ idempotencyKey: 'ik-pkr' }), pktId, 'READY', 'Ready');
    expect(ready.ok).toBe(true);
    expect(ready.status).toBe('ready');
  });

  it('Teacher review packet can be acknowledged_mock', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const created = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-am', teacherRef: 't-am', studentRef: 's-am', safePacketSummary: 'Ack mock',
    });
    const pktId = created.resourceId!;

    const ack = await service.acknowledgeTeacherReviewPacketMock(makeCtx(), pktId, 'ACKNOWLEDGED', 'Acknowledged');
    expect(ack.ok).toBe(true);
    expect(ack.status).toBe('acknowledged_mock');
  });

  it('Teacher review packet can be approved_for_future_use', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const created = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-ap', teacherRef: 't-ap', studentRef: 's-ap', safePacketSummary: 'Approve',
    });
    const pktId = created.resourceId!;

    const app = await service.approveTeacherReviewPacketForFutureUse(makeCtx({ idempotencyKey: 'ik-pkap' }), pktId, 'APPROVED', 'Approved');
    expect(app.ok).toBe(true);
    expect(app.status).toBe('approved_for_future_use');
  });

  it('Teacher review packet can be suppressed', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const created = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-s', teacherRef: 't-s', studentRef: 's-s', safePacketSummary: 'Suppress',
    });
    const pktId = created.resourceId!;

    const sup = await service.suppressTeacherReviewPacket(makeCtx(), pktId, 'SUPPRESSED', 'Not needed');
    expect(sup.ok).toBe(true);
    expect(sup.status).toBe('suppressed');
  });

  it('Teacher review packet can be voided', async () => {
    const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safety, auditBridge, idempotency);

    const created = await service.createTeacherReviewPacket(makeCtx(), {
      resultRecoveryPlanId: 'plan-v', teacherRef: 't-v', studentRef: 's-v', safePacketSummary: 'Void',
    });
    const pktId = created.resourceId!;

    const vd = await service.voidTeacherReviewPacket(makeCtx(), pktId, 'VOIDED', 'Error');
    expect(vd.ok).toBe(true);
    expect(vd.status).toBe('void');
  });

  it('Teacher review packet does not notify teacher', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoNotificationPayload({ teacherNotificationPayload: 'notify' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('Teacher review packet does not create live teacher task', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'teacher task' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('LIVE_ASSIGNMENT_PAYLOAD');
  });

  it('Teacher review packet does not expose unsafe student/private data', async () => {
    const safety = new ResultRecoverySafetyService();
    const rawAnswer = safety.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'student essay' });
    expect(rawAnswer.allowed).toBe(false);
    expect(rawAnswer.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');

    const unreleased = safety.assertNoUnreleasedGradeLeakage({ unreleasedScore: 85 });
    expect(unreleased.allowed).toBe(false);
    expect(unreleased.reasonCode).toBe('UNRELEASED_GRADE_LEAKAGE');

    const diagnosis = safety.assertNoUnsafeDiagnosis({ diagnosis: 'ADHD' });
    expect(diagnosis.allowed).toBe(false);
    expect(diagnosis.reasonCode).toBe('UNSAFE_DIAGNOSIS');
  });
});
