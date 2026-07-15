import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateFollowUpSignalInput } from '../contracts/resultFollowUpSignalContracts';
import type { ResultFollowUpSignalRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class ResultFollowUpSignalService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private signalRepo: ResultFollowUpSignalRepository,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createSignal(ctx: ResultFollowUpCommandContext, input: Omit<CreateFollowUpSignalInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_SIGNAL_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createSignal', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateFollowUpSignalInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.signalRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createSignal', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createSignal', idempotencyKey, 'ResultFollowUpSignal', record.resultFollowUpSignalId, 'Signal created');
    await this.auditBridge.recordFollowUpSignalCreated(ctx.schoolId, record.resultFollowUpCaseId, record.resultFollowUpSignalId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultFollowUpSignalId, status: record.signalStatus, safeMessage: 'Signal created', reasonCode: 'SIGNAL_CREATED', data: record });
  }

  async getSignal(ctx: ResultFollowUpCommandContext, signalId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.signalRepo.getById(signalId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Signal not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: signalId, status: record.signalStatus, safeMessage: 'Signal found', data: record });
  }

  async listSignalsForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals for school`, data: records });
  }

  async listSignalsForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals for case`, data: records });
  }

  async listSignalsForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals for student`, data: records });
  }

  async listSignalsBySeverity(ctx: ResultFollowUpCommandContext, severity: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listBySeverity(ctx.schoolId, severity);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals with severity ${severity}`, data: records });
  }

  async listSignalsByType(ctx: ResultFollowUpCommandContext, type: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listByType(ctx.schoolId, type);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals with type ${type}`, data: records });
  }

  async listSignalsByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.signalRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} signals with status ${status}`, data: records });
  }

  async suppressSignal(ctx: ResultFollowUpCommandContext, signalId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.signalRepo.getById(signalId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Signal not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.signalStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided signal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.signalRepo.suppress(signalId, 'SUPPRESSED', 'Signal suppressed');
    return this.envelope(ctx, { resourceId: signalId, status: 'suppressed', safeMessage: 'Signal suppressed', reasonCode: 'SIGNAL_SUPPRESSED' });
  }

  async voidSignal(ctx: ResultFollowUpCommandContext, signalId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.signalRepo.getById(signalId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Signal not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.signalStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.signalRepo.void(signalId, 'VOIDED', 'Signal voided');
    return this.envelope(ctx, { resourceId: signalId, status: 'void', safeMessage: 'Signal voided', reasonCode: 'SIGNAL_VOIDED' });
  }
}
