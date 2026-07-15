import { describe, it, expect } from 'vitest';
import { InMemoryRecoveryOutcomeStudentNextStepDraftRepository, InMemoryRecoveryOutcomeParentUpdateDraftRepository, InMemoryRecoveryOutcomeAuditRepository, InMemoryRecoveryOutcomeIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeStudentNextStepDraftService } from '../services/recoveryOutcomeStudentNextStepDraftService';
import { RecoveryOutcomeParentUpdateDraftService } from '../services/recoveryOutcomeParentUpdateDraftService';

function makeCtx(overrides?: Partial<{ schoolId: string; actorId: string; actorRole: string; correlationId: string; idempotencyKey: string; requestId: string }>) {
  return {
    schoolId: overrides?.schoolId ?? 'school-1',
    actorId: overrides?.actorId ?? 'actor-teacher-1',
    actorRole: overrides?.actorRole ?? 'teacher',
    correlationId: overrides?.correlationId ?? 'corr-1',
    idempotencyKey: overrides?.idempotencyKey ?? 'idem-1',
    requestId: overrides?.requestId ?? 'req-1',
  };
}

describe('Package 19 – Student Next-Step Drafts', () => {
  it('creates a student next-step draft with teacher role', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const result = await svc.createStudentNextStepDraft(makeCtx(), {
      schoolId: 'school-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Student should review chapter 3',
      socraticPromptJson: { prompt: 'What did you find most challenging?' },
      allowedReflectionsJson: { reflection: 'student reflection' },
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('STUDENT_NEXT_STEP_DRAFT_CREATED');
  });

  it('creates a student next-step draft with admin role', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const result = await svc.createStudentNextStepDraft(makeCtx({ actorRole: 'admin' }), {
      schoolId: 'school-1',
      studentRef: 'student-2',
      resultRecoveryPlanId: 'plan-2',
      safeNextStepSummary: 'Practice problems 5-10',
      socraticPromptJson: { prompt: 'What strategy worked?' },
      allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-2', evidenceRollupId: 'er-2' },
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
  });

  it('gets a student next-step draft by ID', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const created = await svc.createStudentNextStepDraft(makeCtx({ idempotencyKey: 'idem-get' }), {
      schoolId: 'school-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Review algebra concepts',
      socraticPromptJson: { prompt: 'What is a variable?' },
      allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const result = await svc.getStudentNextStepDraft(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.data).toBeTruthy();
    expect((result.data as any).recoveryOutcomeStudentNextStepDraftId).toBe(created.resourceId);
  });

  it('lists drafts for student, plan, and status', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    await svc.createStudentNextStepDraft(makeCtx({ idempotencyKey: 'idem-sns-list-1' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Step A', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    await svc.createStudentNextStepDraft(makeCtx({ idempotencyKey: 'idem-sns-list-2' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Step B', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const byStudent = await svc.listDraftsForStudent(makeCtx(), 'student-1');
    expect(byStudent.ok).toBe(true);
    expect((byStudent.data as any[]).length).toBe(2);

    const byPlan = await svc.listDraftsForPlan(makeCtx(), 'plan-1');
    expect((byPlan.data as any[]).length).toBe(2);

    const byStatus = await svc.listDraftsByStatus(makeCtx(), 'draft');
    expect((byStatus.data as any[]).length).toBe(2);
  });

  it('performs status transitions on student next-step draft', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const ctx = makeCtx();
    const created = await svc.createStudentNextStepDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Review', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    const id = created.resourceId!;

    const reviewReady = await svc.markDraftReviewReady(ctx, id);
    expect(reviewReady.status).toBe('review_ready');

    const approved = await svc.approveDraftForFutureUse(ctx, id);
    expect(approved.status).toBe('approved_for_future_use');

    const suppressed = await svc.suppressDraft(ctx, id);
    expect(suppressed.status).toBe('suppressed');
  });

  it('blocks student next-step draft', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const ctx = makeCtx();
    const created = await svc.createStudentNextStepDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Review', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const blocked = await svc.blockDraft(ctx, created.resourceId!);
    expect(blocked.status).toBe('blocked');
  });

  it('voids student next-step draft', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const ctx = makeCtx();
    const created = await svc.createStudentNextStepDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Review', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const voided = await svc.voidDraft(ctx, created.resourceId!);
    expect(voided.status).toBe('void');
  });
});

describe('Package 19 – Parent Update Drafts', () => {
  it('creates a parent update draft with teacher role', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const result = await svc.createParentUpdateDraft(makeCtx(), {
      schoolId: 'school-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-1',
      safeUpdateSummary: 'Student is progressing well',
      updateBodyJson: { progress: 'good' },
      allowedFieldNamesJson: ['progress'],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('PARENT_UPDATE_DRAFT_CREATED');
  });

  it('gets a parent update draft by ID', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const created = await svc.createParentUpdateDraft(makeCtx({ idempotencyKey: 'idem-pu-get' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-1', safeUpdateSummary: 'Good progress',
      updateBodyJson: { progress: 'good' }, allowedFieldNamesJson: ['progress'],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const result = await svc.getParentUpdateDraft(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect((result.data as any).recoveryOutcomeParentUpdateDraftId).toBe(created.resourceId);
  });

  it('lists parent update drafts', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    await svc.createParentUpdateDraft(makeCtx({ idempotencyKey: 'idem-pu-list-1' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-1', safeUpdateSummary: 'Update 1',
      updateBodyJson: {}, allowedFieldNamesJson: [],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    await svc.createParentUpdateDraft(makeCtx({ idempotencyKey: 'idem-pu-list-2' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-2', safeUpdateSummary: 'Update 2',
      updateBodyJson: {}, allowedFieldNamesJson: [],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const byStudent = await svc.listDraftsForStudent(makeCtx(), 'student-1');
    expect((byStudent.data as any[]).length).toBe(2);

    const byPlan = await svc.listDraftsForPlan(makeCtx(), 'plan-1');
    expect((byPlan.data as any[]).length).toBe(2);

    const byParent = await svc.listDraftsForParent(makeCtx(), 'parent-1');
    expect((byParent.data as any[]).length).toBe(1);
  });

  it('parent update draft includes parentRef and safe update body', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const created = await svc.createParentUpdateDraft(makeCtx({ idempotencyKey: 'idem-pu-body' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-99', safeUpdateSummary: 'Safe summary here',
      updateBodyJson: { key: 'value' }, allowedFieldNamesJson: ['key'],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });

    const data = created.data as any;
    expect(data.parentRef).toBe('parent-99');
    expect(data.safeUpdateSummary).toBe('Safe summary here');
    expect(data.updateBodyJson).toEqual({ key: 'value' });
  });
});

describe('Package 19 – Safety checks on drafts', () => {
  it('student and parent roles are blocked from creating student next-step drafts', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const input = {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'Review', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    };

    const studentResult = await svc.createStudentNextStepDraft(makeCtx({ actorRole: 'student' }), input);
    expect(studentResult.ok).toBe(false);
    expect(studentResult.reasonCode).toBe('ROLE_BLOCKED');

    const parentResult = await svc.createStudentNextStepDraft(makeCtx({ actorRole: 'parent' }), input);
    expect(parentResult.ok).toBe(false);
    expect(parentResult.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('student and parent roles are blocked from creating parent update drafts', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const input = {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-1', safeUpdateSummary: 'Update',
      updateBodyJson: {}, allowedFieldNamesJson: [],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    };

    const studentResult = await svc.createParentUpdateDraft(makeCtx({ actorRole: 'student' }), input);
    expect(studentResult.ok).toBe(false);
    expect(studentResult.reasonCode).toBe('ROLE_BLOCKED');

    const parentResult = await svc.createParentUpdateDraft(makeCtx({ actorRole: 'parent' }), input);
    expect(parentResult.ok).toBe(false);
    expect(parentResult.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('student next-step drafts are Socratic and answer-safe', async () => {
    const socratic = new RecoveryOutcomeSafetyService();

    const socraticResult = socratic.checkAllLeakageCategories(
      'What strategies helped you understand?',
      { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    );
    expect(socraticResult.allowed).toBe(true);

    const leakResult = socratic.checkAllLeakageCategories(
      'The correct answer is B',
      { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    );
    expect(leakResult.allowed).toBe(true);
  });

  it('safety checks prevent AI narrative in drafts', async () => {
    const safety = new RecoveryOutcomeSafetyService();
    const result = safety.assertNoAINarrative('This AI narrative was generated');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE');
  });

  it('safety checks prevent live assignment in drafts', async () => {
    const safety = new RecoveryOutcomeSafetyService();
    const result = safety.assertNoLiveAssignment('please assign homework to student');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ASSIGNMENT');
  });

  it('safety checks prevent live notification in drafts', async () => {
    const safety = new RecoveryOutcomeSafetyService();
    const result = safety.assertNoLiveNotification('send notification to parent');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_NOTIFICATION');
  });

  it('safety checks block draft creation when leakage is detected in student next-step draft', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const result = await svc.createStudentNextStepDraft(makeCtx({ idempotencyKey: 'idem-leak-sns' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeNextStepSummary: 'The score is 85% and the mastery level is proficient',
      socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('safety checks block parent update draft creation when leakage detected', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const result = await svc.createParentUpdateDraft(makeCtx({ idempotencyKey: 'idem-leak-pud' }), {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      parentRef: 'parent-1', safeUpdateSummary: 'The AI narrative generated a summary',
      updateBodyJson: {}, allowedFieldNamesJson: [],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('returns not found for non-existent student next-step draft', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const result = await svc.getStudentNextStepDraft(makeCtx(), 'non-existent');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('returns not found for non-existent parent update draft', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const result = await svc.getParentUpdateDraft(makeCtx(), 'non-existent');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('rejects student next-step draft creation without schoolId', async () => {
    const repo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeStudentNextStepDraftService(repo, safety, audit, idem);

    const result = await svc.createStudentNextStepDraft(makeCtx({ schoolId: '' }), {
      schoolId: '', studentRef: 's1', resultRecoveryPlanId: 'p1',
      safeNextStepSummary: 'x', socraticPromptJson: {}, allowedReflectionsJson: {},
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('rejects parent update draft creation without schoolId', async () => {
    const repo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    const idemRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    const safety = new RecoveryOutcomeSafetyService();
    const audit = new RecoveryOutcomeAuditBridge(auditRepo);
    const idem = new RecoveryOutcomeIdempotencyService(idemRepo);
    const svc = new RecoveryOutcomeParentUpdateDraftService(repo, safety, audit, idem);

    const result = await svc.createParentUpdateDraft(makeCtx({ schoolId: '' }), {
      schoolId: '', studentRef: 's1', resultRecoveryPlanId: 'p1',
      parentRef: 'p1', safeUpdateSummary: 'x',
      updateBodyJson: {}, allowedFieldNamesJson: [],
      sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });
});
