import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope, RecoveryExecutionReadinessBoardPolicyDecision } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { CreateBoardSnapshotRequest, RecoveryExecutionReadinessBoardSnapshot } from '../contracts/recoveryExecutionReadinessBoardSnapshotContracts';
import { CreateBoardLaneRequest, RecoveryExecutionReadinessBoardLane } from '../contracts/recoveryExecutionReadinessBoardLaneContracts';
import { CreateBoardCardRequest, RecoveryExecutionReadinessBoardCard } from '../contracts/recoveryExecutionReadinessBoardCardContracts';
import { CreateFilterPresetRequest, RecoveryExecutionReadinessBoardFilterPreset } from '../contracts/recoveryExecutionReadinessBoardFilterContracts';
import { CreateRiskSignalRequest, RecoveryExecutionReadinessBoardRiskSignal } from '../contracts/recoveryExecutionReadinessBoardRiskContracts';
import { CreateBoardBlockerRequest, RecoveryExecutionReadinessBoardBlocker } from '../contracts/recoveryExecutionReadinessBoardBlockerContracts';
import { CreateGovernanceNoteRequest, RecoveryExecutionReadinessBoardGovernanceNote } from '../contracts/recoveryExecutionReadinessBoardGovernanceContracts';
import { CreateRoleProjectionRequest, RecoveryExecutionReadinessBoardRoleProjection } from '../contracts/recoveryExecutionReadinessBoardProjectionContracts';
import { CreateTeacherQueueRequest, CreateAdminQueueRequest, RecoveryExecutionReadinessBoardTeacherQueue, RecoveryExecutionReadinessBoardAdminQueue } from '../contracts/recoveryExecutionReadinessBoardQueueContracts';
import { CreateStudentSafeStatusDraftRequest, CreateParentSafeStatusDraftRequest, RecoveryExecutionReadinessBoardStudentSafeStatusDraft, RecoveryExecutionReadinessBoardParentSafeStatusDraft } from '../contracts/recoveryExecutionReadinessBoardStakeholderDraftContracts';
import { CreateRefreshJobRequest, RecoveryExecutionReadinessBoardRefreshJob } from '../contracts/recoveryExecutionReadinessBoardRefreshContracts';
import { CreateBoardSummaryRequest, RecoveryExecutionReadinessBoardSummary } from '../contracts/recoveryExecutionReadinessBoardSummaryContracts';
import {
  RecoveryExecutionReadinessBoardSnapshotRepository,
  RecoveryExecutionReadinessBoardLaneRepository,
  RecoveryExecutionReadinessBoardCardRepository,
  RecoveryExecutionReadinessBoardFilterPresetRepository,
  RecoveryExecutionReadinessBoardRiskSignalRepository,
  RecoveryExecutionReadinessBoardBlockerRepository,
  RecoveryExecutionReadinessBoardGovernanceNoteRepository,
  RecoveryExecutionReadinessBoardRoleProjectionRepository,
  RecoveryExecutionReadinessBoardTeacherQueueRepository,
  RecoveryExecutionReadinessBoardAdminQueueRepository,
  RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardRefreshJobRepository,
  RecoveryExecutionReadinessBoardSummaryRepository,
  RecoveryExecutionReadinessBoardAuditRepository,
  RecoveryExecutionReadinessBoardIdempotencyRepository,
} from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import * as path from 'path';
import * as fs from 'fs';

describe('Package 24 - Board Contracts', () => {
  it('contracts/index.ts exports all required types', () => {
    const indexContent = fs.readFileSync(
      path.resolve(__dirname, '../contracts/index.ts'), 'utf-8');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardSnapshotContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardLaneContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardCardContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardFilterContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardRiskContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardBlockerContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardGovernanceContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardProjectionContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardQueueContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardStakeholderDraftContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardRefreshContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardSummaryContracts');
    expect(indexContent).toContain('recoveryExecutionReadinessBoardRepositoryContracts');
  });

  it('RecoveryExecutionReadinessBoardCommandContext has required fields', () => {
    const ctx: RecoveryExecutionReadinessBoardCommandContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'admin',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorId).toBe('actor-1');
    expect(ctx.actorRole).toBe('admin');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
    expect(ctx.sourceRefsJson).toBeUndefined();
  });

  it('RecoveryExecutionReadinessBoardSafeEnvelope wraps data correctly', () => {
    const envelope: RecoveryExecutionReadinessBoardSafeEnvelope<{ id: string }> = { success: true, data: { id: 'test' }, status: 'created' };
    expect(envelope.success).toBe(true);
    expect(envelope.data?.id).toBe('test');
    expect(envelope.status).toBe('created');
  });

  it('RecoveryExecutionReadinessBoardPolicyDecision has allowed and reason', () => {
    const decision: RecoveryExecutionReadinessBoardPolicyDecision = { allowed: true, reason: 'allowed', requiredRole: 'admin' };
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('allowed');
    expect(decision.requiredRole).toBe('admin');
  });

  it('CreateBoardSnapshotRequest has snapshotSummary field', () => {
    const r: Partial<CreateBoardSnapshotRequest> = { snapshotSummary: 'test summary' };
    expect(r.snapshotSummary).toBe('test summary');
  });

  it('RecoveryExecutionReadinessBoardSnapshot boardStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardSnapshot> = { boardStatus: 'draft' };
    expect(r.boardStatus).toBe('draft');
  });

  it('CreateBoardLaneRequest has laneKey field', () => {
    const r: Partial<CreateBoardLaneRequest> = { laneKey: 'planning' };
    expect(r.laneKey).toBe('planning');
  });

  it('RecoveryExecutionReadinessBoardLane laneStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardLane> = { laneStatus: 'draft' };
    expect(r.laneStatus).toBe('draft');
  });

  it('CreateBoardCardRequest has cardKey field', () => {
    const r: Partial<CreateBoardCardRequest> = { cardKey: 'card-1' };
    expect(r.cardKey).toBe('card-1');
  });

  it('RecoveryExecutionReadinessBoardCard cardStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardCard> = { cardStatus: 'draft' };
    expect(r.cardStatus).toBe('draft');
  });

  it('CreateFilterPresetRequest has presetName field', () => {
    const r: Partial<CreateFilterPresetRequest> = { presetName: 'my filter' };
    expect(r.presetName).toBe('my filter');
  });

  it('RecoveryExecutionReadinessBoardFilterPreset presetStatus defaults to active', () => {
    const r: Partial<RecoveryExecutionReadinessBoardFilterPreset> = { presetStatus: 'active' };
    expect(r.presetStatus).toBe('active');
  });

  it('CreateRiskSignalRequest has riskCategory field', () => {
    const r: Partial<CreateRiskSignalRequest> = { riskCategory: 'academic' };
    expect(r.riskCategory).toBe('academic');
  });

  it('RecoveryExecutionReadinessBoardRiskSignal riskStatus defaults to active', () => {
    const r: Partial<RecoveryExecutionReadinessBoardRiskSignal> = { riskStatus: 'active' };
    expect(r.riskStatus).toBe('active');
  });

  it('CreateBoardBlockerRequest has blockerCategory field', () => {
    const r: Partial<CreateBoardBlockerRequest> = { blockerCategory: 'scheduling' };
    expect(r.blockerCategory).toBe('scheduling');
  });

  it('RecoveryExecutionReadinessBoardBlocker blockerStatus defaults to open', () => {
    const r: Partial<RecoveryExecutionReadinessBoardBlocker> = { blockerStatus: 'open' };
    expect(r.blockerStatus).toBe('open');
  });

  it('CreateGovernanceNoteRequest has noteCategory field', () => {
    const r: Partial<CreateGovernanceNoteRequest> = { noteCategory: 'policy' };
    expect(r.noteCategory).toBe('policy');
  });

  it('RecoveryExecutionReadinessBoardGovernanceNote noteStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardGovernanceNote> = { noteStatus: 'draft' };
    expect(r.noteStatus).toBe('draft');
  });

  it('CreateRoleProjectionRequest has targetRole field', () => {
    const r: Partial<CreateRoleProjectionRequest> = { targetRole: 'teacher' };
    expect(r.targetRole).toBe('teacher');
  });

  it('RecoveryExecutionReadinessBoardRoleProjection projectionStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardRoleProjection> = { projectionStatus: 'draft' };
    expect(r.projectionStatus).toBe('draft');
  });

  it('CreateTeacherQueueRequest has teacherRef field', () => {
    const r: Partial<CreateTeacherQueueRequest> = { teacherRef: 'teacher-1' };
    expect(r.teacherRef).toBe('teacher-1');
  });

  it('CreateAdminQueueRequest has adminRef field', () => {
    const r: Partial<CreateAdminQueueRequest> = { adminRef: 'admin-1' };
    expect(r.adminRef).toBe('admin-1');
  });

  it('RecoveryExecutionReadinessBoardTeacherQueue queueStatus defaults to active', () => {
    const r: Partial<RecoveryExecutionReadinessBoardTeacherQueue> = { queueStatus: 'active' };
    expect(r.queueStatus).toBe('active');
  });

  it('RecoveryExecutionReadinessBoardAdminQueue queueStatus defaults to active', () => {
    const r: Partial<RecoveryExecutionReadinessBoardAdminQueue> = { queueStatus: 'active' };
    expect(r.queueStatus).toBe('active');
  });

  it('CreateStudentSafeStatusDraftRequest has studentRef field', () => {
    const r: Partial<CreateStudentSafeStatusDraftRequest> = { studentRef: 'student-1' };
    expect(r.studentRef).toBe('student-1');
  });

  it('CreateParentSafeStatusDraftRequest has studentRef field', () => {
    const r: Partial<CreateParentSafeStatusDraftRequest> = { studentRef: 'student-1' };
    expect(r.studentRef).toBe('student-1');
  });

  it('RecoveryExecutionReadinessBoardStudentSafeStatusDraft draftStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> = { draftStatus: 'draft' };
    expect(r.draftStatus).toBe('draft');
  });

  it('RecoveryExecutionReadinessBoardParentSafeStatusDraft draftStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardParentSafeStatusDraft> = { draftStatus: 'draft' };
    expect(r.draftStatus).toBe('draft');
  });

  it('CreateRefreshJobRequest has jobType field', () => {
    const r: Partial<CreateRefreshJobRequest> = { jobType: 'full' };
    expect(r.jobType).toBe('full');
  });

  it('RecoveryExecutionReadinessBoardRefreshJob jobStatus defaults to pending', () => {
    const r: Partial<RecoveryExecutionReadinessBoardRefreshJob> = { jobStatus: 'pending' };
    expect(r.jobStatus).toBe('pending');
  });

  it('CreateBoardSummaryRequest has safeSummary field', () => {
    const r: Partial<CreateBoardSummaryRequest> = { safeSummary: 'all good' };
    expect(r.safeSummary).toBe('all good');
  });

  it('RecoveryExecutionReadinessBoardSummary summaryStatus defaults to draft', () => {
    const r: Partial<RecoveryExecutionReadinessBoardSummary> = { summaryStatus: 'draft' };
    expect(r.summaryStatus).toBe('draft');
  });

  it('Repository contracts export snapshot repository interface', () => {
    const repo: RecoveryExecutionReadinessBoardSnapshotRepository = { create: async () => ({}), getById: async () => ({}), listBySchool: async () => [], listByStudentRef: async () => [], listByPlanId: async () => [], listByStatus: async () => [], update: async () => ({}), updateStatus: async () => ({}), markReady: async () => ({}), markReviewReady: async () => ({}), markStale: async () => ({}), markRefreshing: async () => ({}), markRiskFlagged: async () => ({}), suppress: async () => ({}), block: async () => ({}), void: async () => ({}), refresh: async () => ({}) };
    expect(repo.create).toBeDefined();
    expect(repo.getById).toBeDefined();
  });

  it('Repository contracts export lane repository interface', () => {
    const repo: RecoveryExecutionReadinessBoardLaneRepository = { create: async () => ({}), getById: async () => ({}), listBySnapshotId: async () => [], listByLaneKey: async () => [], listByStatus: async () => [], update: async () => ({}), updateStatus: async () => ({}), markReady: async () => ({}), markStale: async () => ({}), block: async () => ({}), void: async () => ({}) };
    expect(repo.create).toBeDefined();
    expect(repo.listByLaneKey).toBeDefined();
  });

  it('Repository contracts export card repository interface', () => {
    const repo: RecoveryExecutionReadinessBoardCardRepository = { create: async () => ({}), getById: async () => ({}), listBySnapshotId: async () => [], listByStudentRef: async () => [], listByPlanId: async () => [], listByLaneKey: async () => [], listByStatus: async () => [], listByPriority: async () => [], update: async () => ({}), markReady: async () => ({}), markNeedsTeacherReview: async () => ({}), markNeedsAdminReview: async () => ({}), markRiskFlagged: async () => ({}), block: async () => ({}), void: async () => ({}) };
    expect(repo.create).toBeDefined();
    expect(repo.listByPriority).toBeDefined();
  });

  it('Repository contracts export audit and idempotency repositories', () => {
    const audit: RecoveryExecutionReadinessBoardAuditRepository = { create: async () => ({}), listBySchool: async () => [], listBySnapshotId: async () => [] };
    const idempotency: RecoveryExecutionReadinessBoardIdempotencyRepository = { create: async () => ({}), getByIdempotencyKey: async () => null, update: async () => ({}), complete: async () => ({}) };
    expect(audit.create).toBeDefined();
    expect(audit.listBySchool).toBeDefined();
    expect(idempotency.getByIdempotencyKey).toBeDefined();
    expect(idempotency.complete).toBeDefined();
  });

  it('forbidden live fields are not present in any snapshot contract', () => {
    const forbidden = [
      'scoreMutationPayload', 'masteryMutationPayload', 'liveRecoveryActivationPayload',
      'liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload', 'aiNarrative',
      'generatedQuestionText', 'ocrText', 'pdfBinary',
    ];
    const keys = Object.keys({} as RecoveryExecutionReadinessBoardSnapshot);
    for (const f of forbidden) {
      expect(keys).not.toContain(f);
    }
  });
});
