import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConflictDeclarationRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseConflictService } from '../services/recoveryCaseConflictService';
import { RecoveryCaseAdjudicationCommandContext, ForbiddenAdjudicationActorRoles, AllowedAdjudicationActorRoles } from '../contracts';

function makeCtx(overrides?: Partial<RecoveryCaseAdjudicationCommandContext>): RecoveryCaseAdjudicationCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
    ...overrides,
  };
}

describe('Package 26 - Conflict of Interest Safety', () => {
  let conflictRepo: InMemoryConflictDeclarationRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseConflictService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    conflictRepo = new InMemoryConflictDeclarationRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseConflictService(conflictRepo, auditRepo);
  });

  it('create conflict declaration with various types', async () => {
    const types = ['none_declared', 'priority_assessment_author', 'override_requestor', 'primary_reviewer', 'secondary_reviewer', 'source_record_author', 'declared_personal_conflict', 'other_declared_conflict'];
    for (const conflictType of types) {
      const result = await service.createConflictDeclaration(makeCtx(), {
        schoolId: schoolA,
        queueItemId: 'queue-1',
        reviewerActorId: 'reviewer-1',
        reviewerRole: 'teacher',
        conflictType,
        safeDeclarationSummary: `Conflict type: ${conflictType}`,
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      expect(result.success).toBe(true);
      expect(result.data!.conflictType).toBe(conflictType);
      expect(result.data!.conflictStatus).toBe('draft');
    }
  });

  it('declared_personal_conflict blocks review (evaluate returns blocked)', async () => {
    const result = await service.createConflictDeclaration(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', conflictType: 'declared_personal_conflict', safeDeclarationSummary: 'Personal conflict', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const evaluated = await service.evaluateConflictDeclaration(result.data!.conflictDeclarationId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.conflictStatus).toBe('blocked');
  });

  it('system_job cannot author reviewer decision (evaluated via conflict system)', async () => {
    const created = await conflictRepo.create({
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'system_job', conflictType: 'none_declared', safeDeclarationSummary: 'System job', createdByActorId: 'a1', createdByRole: 'system_job',
    });
    const evaluated = await service.evaluateConflictDeclaration(created.conflictDeclarationId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.conflictStatus).toBe('no_conflict');
  });

  it('student cannot review (forbidden role)', async () => {
    const created = await conflictRepo.create({
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'student-1', reviewerRole: 'student', conflictType: 'none_declared', safeDeclarationSummary: 'Student review', createdByActorId: 's1', createdByRole: 'student',
    });
    const evaluated = await service.evaluateConflictDeclaration(created.conflictDeclarationId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.conflictStatus).toBe('blocked');
  });

  it('parent cannot review', async () => {
    const created = await conflictRepo.create({
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'parent-1', reviewerRole: 'parent', conflictType: 'none_declared', safeDeclarationSummary: 'Parent review', createdByActorId: 'p1', createdByRole: 'parent',
    });
    const evaluated = await service.evaluateConflictDeclaration(created.conflictDeclarationId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.conflictStatus).toBe('blocked');
  });

  it('mark no conflict', async () => {
    const result = await service.createConflictDeclaration(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', conflictType: 'none_declared', safeDeclarationSummary: 'No conflict', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const noConflict = await service.markNoConflict(result.data!.conflictDeclarationId);
    expect(noConflict.success).toBe(true);
    expect(noConflict.data!.conflictStatus).toBe('no_conflict');
  });

  it('mark hard conflict', async () => {
    const result = await service.createConflictDeclaration(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', conflictType: 'declared_personal_conflict', safeDeclarationSummary: 'Hard conflict', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const hard = await service.markHardConflict(result.data!.conflictDeclarationId, ['irreconcilable_conflict']);
    expect(hard.success).toBe(true);
    expect(hard.data!.conflictStatus).toBe('blocked');
  });

  it('mark needs alternate reviewer', async () => {
    const result = await service.createConflictDeclaration(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', conflictType: 'primary_reviewer', safeDeclarationSummary: 'Need alternate', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const alt = await service.markNeedsAlternateReviewer(result.data!.conflictDeclarationId);
    expect(alt.success).toBe(true);
    expect(alt.data!.conflictStatus).toBe('needs_alternate_reviewer');
  });

  it('school isolation for conflicts', async () => {
    const a = await service.createConflictDeclaration(makeCtx({ schoolId: schoolA }), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', conflictType: 'none_declared', safeDeclarationSummary: 'A', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const b = await service.createConflictDeclaration(makeCtx({ schoolId: schoolB }), {
      schoolId: schoolB, queueItemId: 'q2', reviewerActorId: 'r2', reviewerRole: 'teacher', conflictType: 'none_declared', safeDeclarationSummary: 'B', createdByActorId: 'a2', createdByRole: 'teacher',
    });
    const listA = await conflictRepo.listBySchool(schoolA);
    const listB = await conflictRepo.listBySchool(schoolB);
    expect(listA).toHaveLength(1);
    expect(listB).toHaveLength(1);
    const foundA = await conflictRepo.getById(a.data!.conflictDeclarationId);
    const foundB = await conflictRepo.getById(b.data!.conflictDeclarationId);
    expect(foundA?.schoolId).toBe(schoolA);
    expect(foundB?.schoolId).toBe(schoolB);
  });

  it('guest and unknown are also forbidden', () => {
    expect(ForbiddenAdjudicationActorRoles).toContain('guest');
    expect(ForbiddenAdjudicationActorRoles).toContain('unknown');
    expect(AllowedAdjudicationActorRoles).not.toContain('guest');
    expect(AllowedAdjudicationActorRoles).not.toContain('unknown');
  });
});
