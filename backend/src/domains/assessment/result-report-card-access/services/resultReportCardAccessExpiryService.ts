import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessExpiryRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessExpiryInput } from '../contracts/resultReportCardAccessExpiryContracts';
import { evaluateReportCardAccessExpiryPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessExpiryService {
  constructor(
    private expiryRepo: ResultReportCardAccessExpiryRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExpiry(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessExpiryInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessExpiryPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createExpiry', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessExpiryInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.expiryRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createExpiry', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createExpiry', idempotencyKey, 'ResultReportCardAccessExpiry', record.resultReportCardAccessExpiryId, 'Expiry created');
    await this.auditBridge.recordExpiryCreated(ctx, record.resultReportCardAccessExpiryId, `Expiry created for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessExpiryId, status: record.expiryStatus, safeMessage: 'Expiry created successfully', reasonCode: 'EXPIRY_CREATED', data: record });
  }

  async getExpiry(ctx: ResultReportCardAccessCommandContext, expiryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiry = await this.expiryRepo.getById(expiryId);
    if (!expiry) return this.envelope(ctx, { ok: false, safeMessage: 'Expiry not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: expiryId, status: expiry.expiryStatus, safeMessage: 'Expiry found', data: expiry });
  }

  async listExpiriesForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiries = await this.expiryRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${expiries.length} expiries for grant`, data: expiries });
  }

  async listExpiriesForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiries = await this.expiryRepo.listByRecipientId(recipientId);
    return this.envelope(ctx, { safeMessage: `Found ${expiries.length} expiries for recipient`, data: expiries });
  }

  async scheduleExpiry(ctx: ResultReportCardAccessCommandContext, expiryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiry = await this.expiryRepo.getById(expiryId);
    if (!expiry) return this.envelope(ctx, { ok: false, safeMessage: 'Expiry not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (expiry.expiryStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Expiry must be in draft status to schedule', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.expiryRepo.schedule(expiryId);
    await this.auditBridge.recordExpiryScheduled(ctx, expiryId, 'Expiry scheduled');
    return this.envelope(ctx, { resourceId: expiryId, status: 'scheduled', safeMessage: 'Expiry scheduled', reasonCode: 'SCHEDULED' });
  }

  async applyExpiry(ctx: ResultReportCardAccessCommandContext, expiryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiry = await this.expiryRepo.getById(expiryId);
    if (!expiry) return this.envelope(ctx, { ok: false, safeMessage: 'Expiry not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (expiry.expiryStatus !== 'scheduled') return this.envelope(ctx, { ok: false, safeMessage: 'Expiry must be scheduled before applying', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.expiryRepo.apply(expiryId);
    await this.auditBridge.recordExpiryApplied(ctx, expiryId, 'Expiry applied');
    return this.envelope(ctx, { resourceId: expiryId, status: 'applied', safeMessage: 'Expiry applied', reasonCode: 'APPLIED' });
  }

  async cancelExpiry(ctx: ResultReportCardAccessCommandContext, expiryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiry = await this.expiryRepo.getById(expiryId);
    if (!expiry) return this.envelope(ctx, { ok: false, safeMessage: 'Expiry not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (expiry.expiryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot cancel voided expiry', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.expiryRepo.cancel(expiryId, 'CANCELLED', 'Expiry cancelled');
    return this.envelope(ctx, { resourceId: expiryId, status: 'cancelled', safeMessage: 'Expiry cancelled', reasonCode: 'CANCELLED' });
  }

  async voidExpiry(ctx: ResultReportCardAccessCommandContext, expiryId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const expiry = await this.expiryRepo.getById(expiryId);
    if (!expiry) return this.envelope(ctx, { ok: false, safeMessage: 'Expiry not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (expiry.expiryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.expiryRepo.void(expiryId, 'VOIDED', 'Expiry voided');
    return this.envelope(ctx, { resourceId: expiryId, status: 'void', safeMessage: 'Expiry voided', reasonCode: 'VOIDED' });
  }
}
