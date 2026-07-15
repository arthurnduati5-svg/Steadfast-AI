import { RecoveryOutcomeApprovalGateRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeApprovalGate, CreateApprovalGateRequest, ApprovalGateStatus } from '../contracts/recoveryOutcomeApprovalGateContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeApprovalGateService {
  constructor(
    private repo: RecoveryOutcomeApprovalGateRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createApprovalGate(ctx: RecoveryOutcomeActionCommandContext, req: CreateApprovalGateRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createApprovalGate', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeApprovalGate = {
        approvalGateId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        gateStatus: 'pending', safeGateSummary: req.safeGateSummary,
        requiredApprovalsJson: req.requiredApprovalsJson, approvalResultsJson: {}, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'APPROVAL_GATE_CREATED', 'created', `Gate ${created.approvalGateId} created`, { approvalGateId: created.approvalGateId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeApprovalGate', created.approvalGateId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getApprovalGate(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesByStatus(schoolId: string, status: ApprovalGateStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markApprovalGateSatisfied(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION');
      const updated = await this.repo.markSatisfied(id);
      await this.audit.record(ctx, 'APPROVAL_GATE_SATISFIED', 'updated', `Gate ${id} satisfied`, { approvalGateId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markApprovalGateBlocked(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION');
      const updated = await this.repo.markBlocked(id);
      await this.audit.record(ctx, 'APPROVAL_GATE_BLOCKED', 'updated', `Gate ${id} blocked`, { approvalGateId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidApprovalGate(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'APPROVAL_GATE_VOIDED', 'updated', `Gate ${id} voided`, { approvalGateId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
