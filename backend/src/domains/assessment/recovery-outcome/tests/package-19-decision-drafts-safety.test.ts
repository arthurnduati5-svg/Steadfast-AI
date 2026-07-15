import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryContinuationDecisionDraftService } from '../services/recoveryContinuationDecisionDraftService';
import { RecoveryIntensificationDecisionDraftService } from '../services/recoveryIntensificationDecisionDraftService';
import { RecoveryPauseDecisionDraftService } from '../services/recoveryPauseDecisionDraftService';
import { RecoveryClosureDecisionDraftService } from '../services/recoveryClosureDecisionDraftService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import {
  InMemoryRecoveryContinuationDecisionDraftRepository,
  InMemoryRecoveryIntensificationDecisionDraftRepository,
  InMemoryRecoveryPauseDecisionDraftRepository,
  InMemoryRecoveryClosureDecisionDraftRepository,
  InMemoryRecoveryOutcomeAuditRepository,
  InMemoryRecoveryOutcomeIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeRepositories';
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

function draftInput(overrides?: Partial<Record<string, unknown>>) {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    safeDecisionSummary: 'Decision summary for testing',
    rationaleJson: { reason: 'evidence-based' },
    sourceRefsJson: { progressSummaryId: 'psum-1', evidenceRollupId: 'eroll-1' },
    ...overrides,
  };
}

describe('Package 19 — Decision Drafts Safety (all 4 types)', () => {
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;

  beforeEach(() => {
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
  });

  describe('Continuation Drafts', () => {
    let repo: InMemoryRecoveryContinuationDecisionDraftRepository;
    let service: RecoveryContinuationDecisionDraftService;

    beforeEach(() => {
      repo = new InMemoryRecoveryContinuationDecisionDraftRepository();
      service = new RecoveryContinuationDecisionDraftService(repo, safetyService, auditBridge, idempotencyService);
    });

    it('creates continuation draft via service', async () => {
      const result = await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
      expect(result.resourceId).toBeTruthy();
      expect(result.reasonCode).toBe('CONTINUATION_DRAFT_CREATED');
    });

    it('gets continuation draft by ID', async () => {
      const created = await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      const fetched = await service.getDecisionDraft(makeCtx(), created.resourceId!);
      expect(fetched.ok).toBe(true);
      expect(fetched.resourceId).toBe(created.resourceId);
    });

    it('lists continuation drafts by plan', async () => {
      await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsForPlan(makeCtx(), 'plan-1');
      expect(list.ok).toBe(true);
      expect((list.data as any[]).length).toBe(1);
    });

    it('lists continuation drafts by student', async () => {
      await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsForStudent(makeCtx(), 'student-1');
      expect(list.ok).toBe(true);
      expect((list.data as any[]).length).toBe(1);
    });

    it('lists continuation drafts by status', async () => {
      await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsByStatus(makeCtx(), 'draft');
      expect(list.ok).toBe(true);
      expect((list.data as any[]).length).toBe(1);
    });

    it('continuation draft status transitions', async () => {
      const created = await service.createContinuationDecisionDraft(makeCtx(), draftInput() as any);
      const id = created.resourceId!;
      expect((await service.markDecisionDraftReviewReady(makeCtx(), id)).status).toBe('review_ready');
      expect((await service.approveDecisionDraftForFutureUse(makeCtx(), id)).status).toBe('approved_for_future_use');
      expect((await service.suppressDecisionDraft(makeCtx(), id)).status).toBe('suppressed');
      expect((await service.blockDecisionDraft(makeCtx(), id)).status).toBe('blocked');
      expect((await service.voidDecisionDraft(makeCtx(), id)).status).toBe('void');
    });

    it('student role blocked from creating continuation draft', async () => {
      const result = await service.createContinuationDecisionDraft(makeCtx({ actorRole: 'student' }), draftInput() as any);
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('ROLE_BLOCKED');
    });
  });

  describe('Intensification Drafts', () => {
    let repo: InMemoryRecoveryIntensificationDecisionDraftRepository;
    let service: RecoveryIntensificationDecisionDraftService;

    beforeEach(() => {
      repo = new InMemoryRecoveryIntensificationDecisionDraftRepository();
      service = new RecoveryIntensificationDecisionDraftService(repo, safetyService, auditBridge, idempotencyService);
    });

    it('creates intensification draft via service', async () => {
      const result = await service.createIntensificationDecisionDraft(makeCtx(), draftInput() as any);
      expect(result.ok).toBe(true);
      expect(result.reasonCode).toBe('INTENSIFICATION_DRAFT_CREATED');
    });

    it('gets intensification draft by ID', async () => {
      const created = await service.createIntensificationDecisionDraft(makeCtx(), draftInput() as any);
      const fetched = await service.getDecisionDraft(makeCtx(), created.resourceId!);
      expect(fetched.ok).toBe(true);
    });

    it('lists intensification drafts by plan', async () => {
      await service.createIntensificationDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsForPlan(makeCtx(), 'plan-1');
      expect((list.data as any[]).length).toBe(1);
    });

    it('lists intensification drafts by status', async () => {
      await service.createIntensificationDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsByStatus(makeCtx(), 'draft');
      expect((list.data as any[]).length).toBe(1);
    });

    it('intensification draft status transitions', async () => {
      const created = await service.createIntensificationDecisionDraft(makeCtx(), draftInput() as any);
      const id = created.resourceId!;
      expect((await service.markDecisionDraftReviewReady(makeCtx(), id)).status).toBe('review_ready');
      expect((await service.suppressDecisionDraft(makeCtx(), id)).status).toBe('suppressed');
      expect((await service.blockDecisionDraft(makeCtx(), id)).status).toBe('blocked');
      expect((await service.voidDecisionDraft(makeCtx(), id)).status).toBe('void');
    });

    it('student role blocked from creating intensification draft', async () => {
      const result = await service.createIntensificationDecisionDraft(makeCtx({ actorRole: 'student' }), draftInput() as any);
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('ROLE_BLOCKED');
    });
  });

  describe('Pause Drafts', () => {
    let repo: InMemoryRecoveryPauseDecisionDraftRepository;
    let service: RecoveryPauseDecisionDraftService;

    beforeEach(() => {
      repo = new InMemoryRecoveryPauseDecisionDraftRepository();
      service = new RecoveryPauseDecisionDraftService(repo, safetyService, auditBridge, idempotencyService);
    });

    it('creates pause draft via service', async () => {
      const result = await service.createPauseDecisionDraft(makeCtx(), draftInput() as any);
      expect(result.ok).toBe(true);
      expect(result.reasonCode).toBe('PAUSE_DRAFT_CREATED');
    });

    it('lists pause drafts by plan', async () => {
      await service.createPauseDecisionDraft(makeCtx(), draftInput() as any);
      const list = await service.listDecisionDraftsForPlan(makeCtx(), 'plan-1');
      expect((list.data as any[]).length).toBe(1);
    });

    it('pause draft status transitions', async () => {
      const created = await service.createPauseDecisionDraft(makeCtx(), draftInput() as any);
      const id = created.resourceId!;
      expect((await service.markDecisionDraftReviewReady(makeCtx(), id)).status).toBe('review_ready');
      expect((await service.approveDecisionDraftForFutureUse(makeCtx(), id)).status).toBe('approved_for_future_use');
      expect((await service.voidDecisionDraft(makeCtx(), id)).status).toBe('void');
    });

    it('student role blocked from creating pause draft', async () => {
      const result = await service.createPauseDecisionDraft(makeCtx({ actorRole: 'student' }), draftInput() as any);
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('ROLE_BLOCKED');
    });
  });

  describe('Closure Drafts', () => {
    let repo: InMemoryRecoveryClosureDecisionDraftRepository;
    let service: RecoveryClosureDecisionDraftService;

    beforeEach(() => {
      repo = new InMemoryRecoveryClosureDecisionDraftRepository();
      service = new RecoveryClosureDecisionDraftService(repo, safetyService, auditBridge, idempotencyService);
    });

    it('creates closure draft via service', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput(),
        closureType: 'graduation' as const,
        futureReviewRefsJson: {},
      } as any);
      expect(result.ok).toBe(true);
      expect(result.reasonCode).toBe('CLOSURE_DRAFT_CREATED');
    });

    it('gets closure draft by ID', async () => {
      const created = await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput({ idempotencyKey: 'idem-closure-get' } as any),
        closureType: 'graduation',
        futureReviewRefsJson: {},
      } as any);
      const fetched = await service.getDecisionDraft(makeCtx(), created.resourceId!);
      expect(fetched.ok).toBe(true);
    });

    it('lists closure drafts by plan', async () => {
      await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      const list = await service.listDecisionDraftsForPlan(makeCtx(), 'plan-1');
      expect((list.data as any[]).length).toBe(1);
    });

    it('lists closure drafts by status', async () => {
      await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      const list = await service.listDecisionDraftsByStatus(makeCtx(), 'draft');
      expect((list.data as any[]).length).toBe(1);
    });

    it('closure draft does NOT perform live closure (creates draft record)', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      expect(result.ok).toBe(true);
      const data = result.data as any;
      expect(data.draftStatus).toBe('draft');
      expect(data.closureType).toBe('graduation');
      expect(data.recoveryClosureDecisionDraftId).toBeTruthy();
    });

    it('closure draft has closureType field', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput({ idempotencyKey: 'idem-closure-type' } as any),
        closureType: 'teacher_discretion',
        futureReviewRefsJson: {},
      } as any);
      const data = result.data as any;
      expect(data.closureType).toBe('teacher_discretion');
    });

    it('closure draft status transitions', async () => {
      const created = await service.createClosureDecisionDraft(makeCtx(), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      const id = created.resourceId!;
      expect((await service.markDecisionDraftReviewReady(makeCtx(), id)).status).toBe('review_ready');
      expect((await service.approveDecisionDraftForFutureUse(makeCtx(), id)).status).toBe('approved_for_future_use');
      expect((await service.blockDecisionDraft(makeCtx(), id)).status).toBe('blocked');
    });

    it('student role blocked from creating closure draft', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx({ actorRole: 'student' }), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('ROLE_BLOCKED');
    });

    it('parent role blocked from creating closure draft', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx({ actorRole: 'parent' }), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('ROLE_BLOCKED');
    });

    it('missing schoolId blocks closure draft creation', async () => {
      const result = await service.createClosureDecisionDraft(makeCtx({ schoolId: '' } as any), {
        ...draftInput() as any,
        closureType: 'graduation',
        futureReviewRefsJson: {},
      });
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
    });
  });

  describe('Cross-draft role blocking', () => {
    it('all 4 draft types block student role', async () => {
      const ctx = makeCtx({ actorRole: 'student' });

      const cRepo = new InMemoryRecoveryContinuationDecisionDraftRepository();
      const cSvc = new RecoveryContinuationDecisionDraftService(cRepo, safetyService, auditBridge, idempotencyService);
      const cont = await cSvc.createContinuationDecisionDraft(ctx, draftInput() as any);
      expect(cont.ok).toBe(false);
      expect(cont.reasonCode).toBe('ROLE_BLOCKED');

      const iRepo = new InMemoryRecoveryIntensificationDecisionDraftRepository();
      const iSvc = new RecoveryIntensificationDecisionDraftService(iRepo, safetyService, auditBridge, idempotencyService);
      const inten = await iSvc.createIntensificationDecisionDraft(ctx, draftInput() as any);
      expect(inten.ok).toBe(false);

      const pRepo = new InMemoryRecoveryPauseDecisionDraftRepository();
      const pSvc = new RecoveryPauseDecisionDraftService(pRepo, safetyService, auditBridge, idempotencyService);
      const pause = await pSvc.createPauseDecisionDraft(ctx, draftInput() as any);
      expect(pause.ok).toBe(false);

      const clRepo = new InMemoryRecoveryClosureDecisionDraftRepository();
      const clSvc = new RecoveryClosureDecisionDraftService(clRepo, safetyService, auditBridge, idempotencyService);
      const closure = await clSvc.createClosureDecisionDraft(ctx, { ...draftInput() as any, closureType: 'graduation', futureReviewRefsJson: {} });
      expect(closure.ok).toBe(false);
    });
  });
});
