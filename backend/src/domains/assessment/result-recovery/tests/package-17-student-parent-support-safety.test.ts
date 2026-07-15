import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryStudentSupportDraftRepository,
  InMemoryResultRecoveryParentSupportNoteDraftRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryStudentSupportDraftService } from '../services/resultRecoveryStudentSupportDraftService';
import { ResultRecoveryParentSupportNoteDraftService } from '../services/resultRecoveryParentSupportNoteDraftService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-ss',
    ...overrides,
  } as any;
}

describe('Package 17 — Student & Parent Support Safety', () => {
  describe('Student Support Draft', () => {
    it('Student support draft can be created', async () => {
      const repo = new InMemoryResultRecoveryStudentSupportDraftRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryStudentSupportDraftService(repo as any, safety, auditBridge, idempotency);

      const result = await service.createStudentSupportDraft(makeCtx(), {
        resultRecoveryPlanId: 'plan-001',
        studentRef: 's1',
        safeSupportDraftSummary: 'Support for algebra',
      });

      expect(result.ok).toBe(true);
      expect(result.resourceId).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.reasonCode).toBe('STUDENT_SUPPORT_CREATED');
    });

    it('Student support draft lifecycle (review_ready, approved, suppressed, blocked, voided)', async () => {
      const repo = new InMemoryResultRecoveryStudentSupportDraftRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryStudentSupportDraftService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createStudentSupportDraft(makeCtx(), {
        resultRecoveryPlanId: 'plan-life', studentRef: 's-life', safeSupportDraftSummary: 'Lifecycle',
      });
      const draftId = created.resourceId!;

      const rr = await service.markStudentSupportDraftReviewReady(makeCtx({ idempotencyKey: 'ik-ssrr' }), draftId, 'READY', 'Review ready');
      expect(rr.status).toBe('review_ready');

      const app = await service.approveStudentSupportDraftForFutureUse(makeCtx({ idempotencyKey: 'ik-ssap' }), draftId, 'APPROVED', 'Approved');
      expect(app.status).toBe('approved_for_future_use');

      const sup = await service.suppressStudentSupportDraft(makeCtx(), draftId, 'SUPPRESSED', 'Suppressed');
      expect(sup.status).toBe('suppressed');

      const blk = await service.blockStudentSupportDraft(makeCtx(), draftId, 'BLOCKED', 'Blocked');
      expect(blk.status).toBe('blocked');

      const vd = await service.voidStudentSupportDraft(makeCtx(), draftId, 'VOIDED', 'Voided');
      expect(vd.status).toBe('void');
    });

    it('Student support draft blocks answer leakage', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertStudentSupportDraftSafe({ correctAnswer: '42' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('ANSWER_LEAKAGE');

      const check2 = safety.assertStudentSupportDraftSafe({ answerKey: 'key' });
      expect(check2.allowed).toBe(false);
    });

    it('Student support draft blocks hidden reasoning', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertStudentSupportDraftSafe({ hiddenReasoning: 'internal logic' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
    });

    it('Student support draft is not assigned live', async () => {
      const safety = new ResultRecoverySafetyService();
      expect(safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'x' }).allowed).toBe(false);
      expect(safety.assertNoHomeworkAssignmentPayload({ homeworkAssignmentPayload: 'x' }).allowed).toBe(false);
      expect(safety.assertNoPracticeAssignmentPayload({ practiceAssignmentPayload: 'x' }).allowed).toBe(false);
    });

    it('Student support draft does not notify student', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertNoNotificationPayload({ studentNotificationPayload: 'hello' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('NOTIFICATION_PAYLOAD');
    });
  });

  describe('Parent Support Note Draft', () => {
    it('Parent support note draft can be created', async () => {
      const repo = new InMemoryResultRecoveryParentSupportNoteDraftRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryParentSupportNoteDraftService(repo as any, safety, auditBridge, idempotency);

      const result = await service.createParentSupportNoteDraft(makeCtx(), {
        resultRecoveryPlanId: 'plan-001',
        studentRef: 's1',
        safeParentNoteSummary: 'Parent note about progress',
      });

      expect(result.ok).toBe(true);
      expect(result.resourceId).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.reasonCode).toBe('PARENT_SUPPORT_CREATED');
    });

    it('Parent support note draft lifecycle (review_ready, approved, suppressed, blocked, voided)', async () => {
      const repo = new InMemoryResultRecoveryParentSupportNoteDraftRepository();
      const auditRepo = new InMemoryResultRecoveryAuditRepository();
      const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
      const safety = new ResultRecoverySafetyService();
      const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
      const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
      const service = new ResultRecoveryParentSupportNoteDraftService(repo as any, safety, auditBridge, idempotency);

      const created = await service.createParentSupportNoteDraft(makeCtx(), {
        resultRecoveryPlanId: 'plan-pl', studentRef: 's-pl', safeParentNoteSummary: 'Lifecycle',
      });
      const draftId = created.resourceId!;

      const rr = await service.markParentSupportNoteReviewReady(makeCtx({ idempotencyKey: 'ik-psrr' }), draftId, 'READY', 'Review ready');
      expect(rr.status).toBe('review_ready');

      const app = await service.approveParentSupportNoteForFutureUse(makeCtx({ idempotencyKey: 'ik-psap' }), draftId, 'APPROVED', 'Approved');
      expect(app.status).toBe('approved_for_future_use');

      const sup = await service.suppressParentSupportNoteDraft(makeCtx(), draftId, 'SUPPRESSED', 'Suppressed');
      expect(sup.status).toBe('suppressed');

      const blk = await service.blockParentSupportNoteDraft(makeCtx(), draftId, 'BLOCKED', 'Blocked');
      expect(blk.status).toBe('blocked');

      const vd = await service.voidParentSupportNoteDraft(makeCtx(), draftId, 'VOIDED', 'Voided');
      expect(vd.status).toBe('void');
    });

    it('Parent support note blocks answer keys', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertParentSupportNoteSafe({ answerKeySafeRef: 'ans-001' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
    });

    it('Parent support note blocks raw student answers', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertParentSupportNoteSafe({ rawStudentAnswer: 'student answer text' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
    });

    it('Parent support note blocks teacher-only notes', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertParentSupportNoteSafe({ teacherOnlyNotes: 'internal note' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
    });

    it('Parent support note blocks diagnosis', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertParentSupportNoteSafe({ diagnosis: 'learning difficulty' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('UNSAFE_DIAGNOSIS');
    });

    it('Parent support note blocks notification payload', async () => {
      const safety = new ResultRecoverySafetyService();
      const check = safety.assertParentSupportNoteSafe({ parentNotificationPayload: 'notify' });
      expect(check.allowed).toBe(false);
      expect(check.reasonCode).toBe('NOTIFICATION_PAYLOAD');
    });

    it('Parent support note is not sent', async () => {
      const safety = new ResultRecoverySafetyService();
      const smsCheck = safety.assertNoNotificationPayload({ smsPayload: 'text' });
      expect(smsCheck.allowed).toBe(false);
      const emailCheck = safety.assertNoNotificationPayload({ emailPayload: 'email' });
      expect(emailCheck.allowed).toBe(false);
    });
  });
});
