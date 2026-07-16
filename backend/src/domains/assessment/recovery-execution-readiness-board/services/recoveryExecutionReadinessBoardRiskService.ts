import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { RecoveryExecutionReadinessBoardRiskSignal, CreateRiskSignalRequest } from '../contracts/recoveryExecutionReadinessBoardRiskContracts';
import { RecoveryExecutionReadinessBoardRiskSignalRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
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

export class RecoveryExecutionReadinessBoardRiskService {
  constructor(private repo: RecoveryExecutionReadinessBoardRiskSignalRepository) {}

  async createRiskSignal(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, body: CreateRiskSignalRequest): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionReadinessBoardRiskSignal> = {
        boardRiskSignalId: uuid(),
        boardSnapshotId: body.boardSnapshotId,
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        teacherRef: body.teacherRef,
        adminRef: body.adminRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        laneKey: body.laneKey,
        cardKey: body.cardKey,
        riskLevel: body.riskLevel ?? 'unknown',
        riskStatus: body.riskStatus ?? 'active',
        riskCategory: body.riskCategory,
        riskSummary: body.riskSummary,
        riskDetailsJson: body.riskDetailsJson ?? {},
        mitigationsJson: body.mitigationsJson ?? {},
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

  async getRiskSignal(schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Risk signal not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskSignalsForSnapshot(snapshotId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal[]>> {
    try {
      const records = await this.repo.listBySnapshotId(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskSignalsForStudent(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskSignalsForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal[]>> {
    try {
      const records = await this.repo.listByPlanId(planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskSignalsByRiskLevel(riskLevel: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal[]>> {
    try {
      const records = await this.repo.listByRiskLevel(riskLevel);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markRiskSignalReviewReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressRiskSignal(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockRiskSignal(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidRiskSignal(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRiskSignal>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_RISK_SIGNAL_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
