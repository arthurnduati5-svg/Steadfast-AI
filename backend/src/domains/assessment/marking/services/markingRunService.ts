import { MarkingRun, MarkingResultVersion, SubmittedAnswerSnapshot, MarkingRunStatus, MarkingResultStatus } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';
import { MarkingRunRepository, MarkingResultVersionRepository } from '../contracts/markingRepositoryContracts';
import { InMemoryMarkingRunRepository, InMemoryMarkingResultVersionRepository } from '../repositories/inMemoryMarkingRepositories';
import { DeterministicMarkerService } from './deterministicMarkerService';
import { TeacherReviewQueueService } from './teacherReviewQueueService';
import { MARKING_POLICY_DEFAULTS } from '../policies/markingPolicyDefinitions';

export interface CreateMarkingRunParams {
  schoolId: string;
  sourceType: string;
  sourceRef: string;
  blueprintId?: string;
  blueprintVersionId?: string;
  draftId?: string;
  createdByActorId: string;
  createdByRole: string;
  safeSummary: string;
}

export interface MarkSnapshotParams {
  runId: string;
  snapshot: SubmittedAnswerSnapshot;
  input: MarkingInputSnapshot;
  actorId: string;
  role: string;
}

export interface MarkBatchParams {
  runId: string;
  snapshots: SubmittedAnswerSnapshot[];
  inputs: MarkingInputSnapshot[];
  actorId: string;
  role: string;
}

const ALLOWED_CREATOR_ROLES = ['teacher', 'lead_teacher', 'admin', 'system_job'];

export class MarkingRunService {
  constructor(
    private runRepo: MarkingRunRepository = new InMemoryMarkingRunRepository(),
    private resultRepo: MarkingResultVersionRepository = new InMemoryMarkingResultVersionRepository(),
    private markerService: DeterministicMarkerService = new DeterministicMarkerService(),
    private reviewQueueService: TeacherReviewQueueService = new TeacherReviewQueueService(),
  ) {}

  async createMarkingRun(params: CreateMarkingRunParams): Promise<MarkingRun> {
    if (!params.schoolId) {
      throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    }
    if (!ALLOWED_CREATOR_ROLES.includes(params.createdByRole)) {
      throw new Error('FORBIDDEN: Only teacher, lead_teacher, admin, or system_job may create marking runs');
    }
    const policyDefault = MARKING_POLICY_DEFAULTS.MARKING_RUN_CREATION;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const now = new Date().toISOString();
    const run: MarkingRun = {
      markingRunId: crypto.randomUUID(),
      schoolId: params.schoolId,
      status: 'draft',
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      blueprintId: params.blueprintId,
      blueprintVersionId: params.blueprintVersionId,
      draftId: params.draftId,
      createdByActorId: params.createdByActorId,
      createdByRole: params.createdByRole,
      inputSnapshotCount: 0,
      markedCount: 0,
      reviewRequiredCount: 0,
      blockedCount: 0,
      safeSummary: params.safeSummary,
      createdAt: now,
      updatedAt: now,
    };
    return this.runRepo.create(run);
  }

  async markSnapshot(params: MarkSnapshotParams): Promise<MarkingResultVersion> {
    const run = await this.runRepo.findById(params.runId);
    if (!run) throw new Error('NOT_FOUND: Marking run not found');
    const now = new Date().toISOString();
    let result: MarkingResultVersion;
    if (this.markerService.canDeterministicallyMark(params.snapshot.questionType)) {
      result = this.markerService.markSnapshotDeterministically(params.snapshot, params.input);
      result.markingRunId = params.runId;
      result.createdByActorId = params.actorId;
      result.createdByRole = params.role;
      result.createdAt = now;
      result.schoolId = run.schoolId;
    } else {
      result = {
        markingResultVersionId: crypto.randomUUID(),
        schoolId: run.schoolId,
        markingRunId: params.runId,
        questionId: params.snapshot.questionId,
        questionVersionId: params.snapshot.questionVersionId,
        answerSnapshotRef: params.snapshot.answerSnapshotRef,
        resultVersionNumber: 1,
        status: 'review_required',
        questionType: params.snapshot.questionType,
        markingMethod: 'teacher_required',
        marksAwarded: 0,
        marksAvailable: params.input?.snapshot?.submittedJson ? 0 : 1,
        confidence: 0,
        requiresTeacherReview: true,
        reviewReasonCode: 'unsupported_question_type',
        safeStudentFeedback: 'This question type requires teacher review.',
        safeTeacherSummary: 'Non-deterministic question type routed to teacher review.',
        createdByActorId: params.actorId,
        createdByRole: params.role,
        createdAt: now,
      };
    }
    const saved = await this.resultRepo.create(result);
    if (saved.requiresTeacherReview) {
      await this.reviewQueueService.createReviewItem({
        schoolId: run.schoolId,
        markingRunId: params.runId,
        markingResultVersionId: saved.markingResultVersionId,
        reasonCode: saved.reviewReasonCode || 'teacher_required',
        safeSummary: saved.safeTeacherSummary,
      });
    }
    run.inputSnapshotCount += 1;
    if (saved.requiresTeacherReview) run.reviewRequiredCount += 1;
    else run.markedCount += 1;
    if (saved.status === 'blocked') run.blockedCount += 1;
    run.updatedAt = now;
    await this.runRepo.update(run);
    return saved;
  }

  async markBatch(params: MarkBatchParams): Promise<{ runId: string; results: MarkingResultVersion[] }> {
    const run = await this.runRepo.findById(params.runId);
    if (!run) throw new Error('NOT_FOUND: Marking run not found');
    run.status = 'running';
    run.updatedAt = new Date().toISOString();
    await this.runRepo.update(run);
    const results: MarkingResultVersion[] = [];
    for (let i = 0; i < params.snapshots.length; i++) {
      const result = await this.markSnapshot({
        runId: params.runId,
        snapshot: params.snapshots[i],
        input: params.inputs[i] || { snapshot: params.snapshots[i] },
        actorId: params.actorId,
        role: params.role,
      });
      results.push(result);
    }
    const hasBlocked = results.some(r => r.status === 'blocked');
    const hasReview = results.some(r => r.requiresTeacherReview);
    run.status = hasBlocked ? 'partial' : hasReview ? 'partial' : 'completed';
    run.completedAt = new Date().toISOString();
    run.updatedAt = run.completedAt;
    await this.runRepo.update(run);
    return { runId: params.runId, results };
  }

  async getMarkingRun(markingRunId: string): Promise<MarkingRun | null> {
    return this.runRepo.findById(markingRunId);
  }

  async listRunResults(markingRunId: string): Promise<MarkingResultVersion[]> {
    return this.resultRepo.findByMarkingRunId(markingRunId);
  }

  async blockMarkingRun(markingRunId: string, reason: string): Promise<MarkingRun> {
    const run = await this.runRepo.findById(markingRunId);
    if (!run) throw new Error('NOT_FOUND: Marking run not found');
    run.status = 'blocked';
    run.safeSummary = reason;
    run.updatedAt = new Date().toISOString();
    return this.runRepo.update(run);
  }
}
