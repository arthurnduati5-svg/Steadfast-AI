import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryStudentProgressReflectionDraftService } from '../services/recoveryStudentProgressReflectionDraftService';
import { RecoveryParentProgressNoteDraftService } from '../services/recoveryParentProgressNoteDraftService';
import {
  InMemoryRecoveryStudentProgressReflectionDraftRepository,
  InMemoryRecoveryParentProgressNoteDraftRepository,
} from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

describe('Package 18 — Student Reflection Draft Lifecycle', () => {
  let reflectionRepo: InMemoryRecoveryStudentProgressReflectionDraftRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryStudentProgressReflectionDraftService;

  beforeEach(() => {
    reflectionRepo = new InMemoryRecoveryStudentProgressReflectionDraftRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryStudentProgressReflectionDraftService(reflectionRepo, safetyService, auditBridge, idempotencyService);
  });

  const makeInput = () => ({
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryProgressObservationId: 'obs-1',
    recoveryCheckpointEvaluationId: 'eval-1',
    safeReflectionSummary: 'Student reflected on checkpoint performance',
    studentReflectionPromptJson: { prompt: 'What did you learn?' },
    scaffoldStepsJson: { step1: 'Identify' },
    blockedFieldNamesJson: [],
    blockedReasonCodesJson: [],
  });

  it('creates reflection draft with draft status', async () => {
    const result = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('REFLECTION_DRAFT_CREATED');
  });

  it('getReflectionDraft returns created draft', async () => {
    const created = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const fetched = await service.getReflectionDraft(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getReflectionDraft returns not_found for missing id', async () => {
    const result = await service.getReflectionDraft(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listReflectionDraftsForPlan returns filtered', async () => {
    await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.listReflectionDraftsForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listReflectionDraftsForObservation returns filtered', async () => {
    await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.listReflectionDraftsForObservation(makeCtx(), 'obs-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listReflectionDraftsForEvaluation returns filtered', async () => {
    await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.listReflectionDraftsForEvaluation(makeCtx(), 'eval-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready', async () => {
    const created = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markReflectionDraftReviewReady(makeCtx(), created.resourceId!, 'REFLECTION_DRAFT_REVIEW_READY', 'Ready');
    expect(reviewed.status).toBe('review_ready');
  });

  it('reflection draft can be suppressed', async () => {
    const created = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.suppressReflectionDraft(makeCtx(), created.resourceId!, 'REFLECTION_DRAFT_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('reflection draft can be blocked', async () => {
    const created = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.blockReflectionDraft(makeCtx(), created.resourceId!, 'REFLECTION_DRAFT_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('reflection draft can be voided', async () => {
    const created = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const result = await service.voidReflectionDraft(makeCtx(), created.resourceId!, 'REFLECTION_DRAFT_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('blocks student role from creating reflection draft', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createReflectionDraft(ctx, makeInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('safety check blocks reflection draft with correct answer', async () => {
    const input = { ...makeInput() as any, correctAnswer: 'A' };
    const result = await service.createReflectionDraft(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain notification fields', async () => {
    const result = await service.createReflectionDraft(makeCtx(), makeInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('grade');
  });
});

describe('Package 18 — Parent Progress Note Draft Lifecycle', () => {
  let parentNoteRepo: InMemoryRecoveryParentProgressNoteDraftRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryParentProgressNoteDraftService;

  beforeEach(() => {
    parentNoteRepo = new InMemoryRecoveryParentProgressNoteDraftRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryParentProgressNoteDraftService(parentNoteRepo, safetyService, auditBridge, idempotencyService);
  });

  const makeInput = () => ({
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryProgressObservationId: 'obs-1',
    recoveryCheckpointEvaluationId: 'eval-1',
    audienceType: 'parent',
    safeProgressSummary: 'Student is making progress',
    parentProgressBodyJson: { summary: 'Doing well' },
    allowedFieldNamesJson: ['safeProgressSummary'],
    blockedFieldNamesJson: [],
    blockedReasonCodesJson: [],
  });

  it('creates parent note draft with draft status', async () => {
    const result = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('PARENT_NOTE_DRAFT_CREATED');
  });

  it('getParentNoteDraft returns created draft', async () => {
    const created = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const fetched = await service.getParentNoteDraft(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getParentNoteDraft returns not_found for missing id', async () => {
    const result = await service.getParentNoteDraft(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listParentNoteDraftsForPlan returns filtered', async () => {
    await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.listParentNoteDraftsForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listParentNoteDraftsForObservation returns filtered', async () => {
    await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.listParentNoteDraftsForObservation(makeCtx(), 'obs-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listParentNoteDraftsForEvaluation returns filtered', async () => {
    await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.listParentNoteDraftsForEvaluation(makeCtx(), 'eval-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready', async () => {
    const created = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markParentNoteDraftReviewReady(makeCtx(), created.resourceId!, 'PARENT_NOTE_REVIEW_READY', 'Ready');
    expect(reviewed.status).toBe('review_ready');
  });

  it('parent note draft can be suppressed', async () => {
    const created = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.suppressParentNoteDraft(makeCtx(), created.resourceId!, 'PARENT_NOTE_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('parent note draft can be blocked', async () => {
    const created = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.blockParentNoteDraft(makeCtx(), created.resourceId!, 'PARENT_NOTE_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('parent note draft can be voided', async () => {
    const created = await service.createParentNoteDraft(makeCtx(), makeInput() as any);
    const result = await service.voidParentNoteDraft(makeCtx(), created.resourceId!, 'PARENT_NOTE_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createParentNoteDraft(ctx, makeInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('safety check blocks parent note with notification payload', async () => {
    const input = { ...makeInput() as any, parentNotificationPayload: {} };
    const result = await service.createParentNoteDraft(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain notification sending methods', () => {
    const methods = Object.getOwnPropertyNames(RecoveryParentProgressNoteDraftService.prototype);
    expect(methods).not.toContain('sendEmail');
    expect(methods).not.toContain('notifyParent');
  });
});
