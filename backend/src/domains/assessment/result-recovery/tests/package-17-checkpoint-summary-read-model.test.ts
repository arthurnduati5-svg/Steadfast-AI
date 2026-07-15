import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryCheckpointRepository,
  InMemoryResultRecoverySummaryRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryCheckpointService } from '../services/resultRecoveryCheckpointService';
import { ResultRecoverySummaryService } from '../services/resultRecoverySummaryService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';
import { FORBIDDEN_RECOVERY_FIELDS } from '../contracts';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-cs',
    ...overrides,
  } as any;
}

describe('Package 17 — Checkpoint & Summary Read Model', () => {
  describe('Recovery Checkpoint', () => {
    it('Recovery checkpoint can be created', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      const result = await service.createRecoveryCheckpoint(makeCtx(), {
        resultRecoveryPlanId: 'plan-001',
        studentRef: 's1',
        safeCheckpointSummary: 'Week 1 checkpoint',
      });

      expect(result.ok).toBe(true);
      expect(result.resourceId).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.reasonCode).toBe('CHECKPOINT_CREATED');
    });

    it('Checkpoint can be listed by plan', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-c', studentRef: 's1', safeCheckpointSummary: 'C1' });
      await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-c', studentRef: 's1', safeCheckpointSummary: 'C2' });

      const list = await service.listCheckpointsForPlan(makeCtx(), 'plan-c');
      expect(list.ok).toBe(true);
      const data = list.data as any[];
      expect(data.length).toBe(2);
    });

    it('Checkpoint can be listed by student', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'p1', studentRef: 'student-x', safeCheckpointSummary: 'X1' });
      await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'p2', studentRef: 'student-x', safeCheckpointSummary: 'X2' });

      const list = await service.listCheckpointsForStudent(makeCtx(), 'student-x');
      expect(list.ok).toBe(true);
      const data = list.data as any[];
      expect(data.length).toBe(2);
    });

    it('Checkpoint can be scheduled_mock', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-s', studentRef: 's1', safeCheckpointSummary: 'Schedule' });
      const cpId = created.resourceId!;

      const sch = await service.scheduleCheckpointMock(makeCtx({ idempotencyKey: 'ik-cps' }), cpId, 'SCHEDULED', 'Scheduled');
      expect(sch.ok).toBe(true);
      expect(sch.status).toBe('scheduled_mock');
    });

    it('Checkpoint can be completed_mock', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-cm', studentRef: 's1', safeCheckpointSummary: 'Complete' });
      const cpId = created.resourceId!;

      const cm = await service.completeCheckpointMock(makeCtx(), cpId, 'COMPLETED', 'Done');
      expect(cm.ok).toBe(true);
      expect(cm.status).toBe('completed_mock');
    });

    it('Checkpoint can be cancelled', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-cx', studentRef: 's1', safeCheckpointSummary: 'Cancel' });
      const cpId = created.resourceId!;

      const cx = await service.cancelCheckpoint(makeCtx(), cpId, 'CANCELLED', 'Not needed');
      expect(cx.ok).toBe(true);
      expect(cx.status).toBe('cancelled');
    });

    it('Checkpoint can be voided', async () => {
      const repo = new InMemoryResultRecoveryCheckpointRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryCheckpointService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoveryCheckpoint(makeCtx(), { resultRecoveryPlanId: 'plan-v', studentRef: 's1', safeCheckpointSummary: 'Void' });
      const cpId = created.resourceId!;

      const vd = await service.voidCheckpoint(makeCtx(), cpId, 'VOIDED', 'Error');
      expect(vd.ok).toBe(true);
      expect(vd.status).toBe('void');
    });

    it('Checkpoint does not create calendar event', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertNoCalendarEventPayload({ calendarEventPayload: 'event' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('CALENDAR_EVENT_PAYLOAD');
    });

    it('Checkpoint does not schedule worker', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertNoExternalSyncPayload({ externalSyncPayload: 'sync' });
      expect(check.allowed).toBe(false);
    });

    it('Checkpoint does not notify anyone', async () => {
      const safety = new ResultRecoverySafetyService();
      expect(safety.assertNoNotificationPayload({ emailPayload: 'x' }).allowed).toBe(false);
      expect(safety.assertNoNotificationPayload({ smsPayload: 'x' }).allowed).toBe(false);
      expect(safety.assertNoNotificationPayload({ pushPayload: 'x' }).allowed).toBe(false);
    });
  });

  describe('Recovery Summary', () => {
    it('Recovery summary can be created', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      const result = await service.createRecoverySummary(makeCtx(), {
        schoolId: 'school-001',
        scope: 'school',
        safeSummaryText: 'Summary of all recovery plans',
      });

      expect(result.ok).toBe(true);
      expect(result.resourceId).toBeDefined();
      expect(result.reasonCode).toBe('SUMMARY_CREATED');
    });

    it('Recovery summary can be listed by school', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'school', safeSummaryText: 'S1' });
      await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'student', safeSummaryText: 'S2' });

      const list = await service.listRecoverySummariesForSchool(makeCtx());
      expect(list.ok).toBe(true);
      const data = list.data as any[];
      expect(data.length).toBe(2);
    });

    it('Recovery summary can be listed by student', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      await repo.create({ schoolId: 'school-001', studentRef: 'student-a', safeSummary: 'Stu1', summaryScope: 'student' as any, createdByActorId: 'teacher-001', createdByRole: 'teacher' });
      await repo.create({ schoolId: 'school-001', studentRef: 'student-a', safeSummary: 'Stu2', summaryScope: 'student' as any, createdByActorId: 'teacher-001', createdByRole: 'teacher' });

      const list = await service.listRecoverySummariesForStudent(makeCtx(), 'student-a');
      expect(list.ok).toBe(true);
      const data = list.data as any[];
      expect(data.length).toBe(2);
    });

    it('Recovery summary can be refreshed', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'school', safeSummaryText: 'Refresh' });
      const summaryId = created.resourceId!;

      const ref = await service.refreshRecoverySummary(makeCtx({ idempotencyKey: 'ik-sr' }), summaryId, 'REFRESHED', 'Refreshed');
      expect(ref.ok).toBe(true);
      expect(ref.status).toBe('active');
    });

    it('Recovery summary can be marked stale', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'school', safeSummaryText: 'Stale' });
      const summaryId = created.resourceId!;

      const st = await service.markRecoverySummaryStale(makeCtx(), summaryId, 'STALE', 'Outdated');
      expect(st.ok).toBe(true);
      expect(st.status).toBe('stale');
    });

    it('Recovery summary can be blocked', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'school', safeSummaryText: 'Block' });
      const summaryId = created.resourceId!;

      const blk = await service.blockRecoverySummary(makeCtx(), summaryId, 'BLOCKED', 'Not allowed');
      expect(blk.ok).toBe(true);
      expect(blk.status).toBe('blocked');
    });

    it('Recovery summary can be voided', async () => {
      const repo = new InMemoryResultRecoverySummaryRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoverySummaryService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createRecoverySummary(makeCtx(), { schoolId: 'school-001', scope: 'school', safeSummaryText: 'Void' });
      const summaryId = created.resourceId!;

      const vd = await service.voidRecoverySummary(makeCtx(), summaryId, 'VOIDED', 'Error');
      expect(vd.ok).toBe(true);
      expect(vd.status).toBe('void');
    });

    it('Summary does not expose forbidden fields', () => {
      expect(FORBIDDEN_RECOVERY_FIELDS).toBeInstanceOf(Array);
      expect(FORBIDDEN_RECOVERY_FIELDS.length).toBeGreaterThan(0);
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('answerKeySafeRef');
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('rawStudentAnswer');
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('aiNarrative');
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('ocrText');
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('pdfBinary');
      expect(FORBIDDEN_RECOVERY_FIELDS).toContain('liveTaskPayload');
    });
  });
});
