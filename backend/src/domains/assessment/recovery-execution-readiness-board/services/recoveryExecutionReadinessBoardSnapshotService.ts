import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { RecoveryExecutionReadinessBoardSnapshot, CreateBoardSnapshotRequest } from '../contracts/recoveryExecutionReadinessBoardSnapshotContracts';
import { RecoveryExecutionReadinessBoardSnapshotRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import { RECOVERY_EXECUTION_READINESS_BOARD_POLICIES } from '../policies/recoveryExecutionReadinessBoardPolicyDefinitions';
import { v4 as uuid } from 'uuid';

function checkPolicy(policyFamily: string, actorRole: string): { allowed: boolean; denied: boolean; reasonCodes: string[] } {
  const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyFamily];
  if (!policy) return { allowed: false, denied: true, reasonCodes: ['POLICY_NOT_FOUND'] };
  if (policy.blockedRoles.includes(actorRole)) return { allowed: false, denied: true, reasonCodes: [`ROLE_BLOCKED:${actorRole}`] };
  if (policy.allowedRoles.includes(actorRole)) return { allowed: true, denied: false, reasonCodes: [] };
  if (policy.failClosed) return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_ALLOWED:${actorRole}`] };
  return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_AUTHORIZED:${actorRole}`] };
}

export class RecoveryExecutionReadinessBoardSnapshotService {
  constructor(private repo: RecoveryExecutionReadinessBoardSnapshotRepository) {}

  async createBoardSnapshot(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, body: CreateBoardSnapshotRequest): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionReadinessBoardSnapshot> = {
        boardSnapshotId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        teacherRef: body.teacherRef,
        adminRef: body.adminRef,
        departmentHeadRef: body.departmentHeadRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        resultRecoveryFollowUpId: body.resultRecoveryFollowUpId,
        recoveryProgressObservationId: body.recoveryProgressObservationId,
        recoveryOutcomeDecisionSummaryId: body.recoveryOutcomeDecisionSummaryId,
        recoveryOutcomeActionBundleId: body.recoveryOutcomeActionBundleId,
        recoveryOutcomeExecutionSimulationRunId: body.recoveryOutcomeExecutionSimulationRunId,
        recoveryOutcomeExecutionSimulationSummaryId: body.recoveryOutcomeExecutionSimulationSummaryId,
        recoveryLifecycleClosureReadinessId: body.recoveryLifecycleClosureReadinessId,
        recoveryFinalLifecycleSummaryId: body.recoveryFinalLifecycleSummaryId,
        recoveryExecutionAuthorizationPreviewReadinessId: body.recoveryExecutionAuthorizationPreviewReadinessId,
        recoveryExecutionAuthorizationSummaryId: body.recoveryExecutionAuthorizationSummaryId,
        boardStatus: body.boardStatus ?? 'draft',
        boardPriority: body.boardPriority ?? 'normal',
        riskLevel: body.riskLevel ?? 'unknown',
        blockerStatus: 'none',
        snapshotSummary: body.snapshotSummary,
        snapshotDetailsJson: body.snapshotDetailsJson ?? {},
        laneKeysJson: body.laneKeysJson ?? [],
        cardCountsJson: {},
        riskSignalsJson: [],
        blockedReasonCodesJson: [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getBoardSnapshot(schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Board snapshot not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardSnapshotsForSchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardSnapshotsForStudent(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardSnapshotsForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot[]>> {
    try {
      const records = await this.repo.listByPlanId(planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardSnapshotsByStatus(schoolId: string, status: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot[]>> {
    try {
      const records = await this.repo.listByStatus(status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markBoardSnapshotReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markBoardSnapshotReviewReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markBoardSnapshotStale(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressBoardSnapshot(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockBoardSnapshot(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidBoardSnapshot(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async refreshBoardSnapshot(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.refresh(id);
      return { success: true, data: updated, status: 'refreshed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
