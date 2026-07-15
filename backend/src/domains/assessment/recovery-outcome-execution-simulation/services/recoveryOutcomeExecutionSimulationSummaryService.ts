import { ISimulationSummaryRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationSummary, CreateSimulationSummaryRequest } from '../contracts/recoveryOutcomeExecutionSimulationSummaryContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionSimulationSummaryService {
  constructor(
    private repo: ISimulationSummaryRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createSimulationSummary(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateSimulationSummaryRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createSimulationSummary', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const allDetails = { ...req.simulationCountsJson, ...req.topFindingsJson, ...req.nextStepsJson };
      const blockedCodes = this.safety.validateContent(req.safeSummary, allDetails);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createSimulationSummary', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createSimulationSummary', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionSimulationSummary> = {
        simulationSummaryId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        teacherRef: req.teacherRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        summaryStatus: 'draft',
        safeSummary: req.safeSummary,
        simulationCountsJson: req.simulationCountsJson ?? {},
        topFindingsJson: req.topFindingsJson ?? {},
        nextStepsJson: req.nextStepsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_SUMMARY_CREATED', 'created', `Simulation summary ${created.simulationSummaryId} created`, { simulationSummaryId: created.simulationSummaryId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createSimulationSummary', ctx.idempotencyKey, `Simulation summary ${created.simulationSummaryId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSimulationSummary(schoolId: string, simulationSummaryId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      const record = await this.repo.getById(simulationSummaryId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Simulation summary not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationSummariesForSchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listSimulationSummariesForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async refreshSimulationSummary(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationSummaryId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION');
      const updated = await this.repo.refresh(simulationSummaryId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_SUMMARY_REFRESHED', 'updated', `Simulation summary ${simulationSummaryId} refreshed`, { simulationSummaryId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markSimulationSummaryStale(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationSummaryId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION');
      const updated = await this.repo.markStale(simulationSummaryId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_SUMMARY_STALE', 'updated', `Simulation summary ${simulationSummaryId} marked stale`, { simulationSummaryId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockSimulationSummary(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationSummaryId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION');
      const updated = await this.repo.block(simulationSummaryId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_SUMMARY_BLOCKED', 'updated', `Simulation summary ${simulationSummaryId} blocked`, { simulationSummaryId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidSimulationSummary(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, simulationSummaryId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION');
      const updated = await this.repo.void(simulationSummaryId);
      await this.audit.recordSimulationEvent(ctx, 'SIMULATION_SUMMARY_VOIDED', 'updated', `Simulation summary ${simulationSummaryId} voided`, { simulationSummaryId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
