import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessRevocationRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessRevocationInput } from '../contracts/resultReportCardAccessRevocationContracts';
import { evaluateReportCardAccessRevocationPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessRevocationService {
  constructor(
    private revocationRepo: ResultReportCardAccessRevocationRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRevocation(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessRevocationInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessRevocationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRevocation', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessRevocationInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.revocationRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRevocation', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRevocation', idempotencyKey, 'ResultReportCardAccessRevocation', record.resultReportCardAccessRevocationId, 'Revocation created');
    await this.auditBridge.recordRevocationCreated(ctx, record.resultReportCardAccessRevocationId, `Revocation created for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessRevocationId, status: record.revocationStatus, safeMessage: 'Revocation created successfully', reasonCode: 'REVOCATION_CREATED', data: record });
  }

  async getRevocation(ctx: ResultReportCardAccessCommandContext, revocationId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const revocation = await this.revocationRepo.getById(revocationId);
    if (!revocation) return this.envelope(ctx, { ok: false, safeMessage: 'Revocation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: revocationId, status: revocation.revocationStatus, safeMessage: 'Revocation found', data: revocation });
  }

  async listRevocationsForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const revocations = await this.revocationRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${revocations.length} revocations for grant`, data: revocations });
  }

  async listRevocationsForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const revocations = await this.revocationRepo.listByRecipientId(recipientId);
    return this.envelope(ctx, { safeMessage: `Found ${revocations.length} revocations for recipient`, data: revocations });
  }

  async applyRevocation(ctx: ResultReportCardAccessCommandContext, revocationId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const revocation = await this.revocationRepo.getById(revocationId);
    if (!revocation) return this.envelope(ctx, { ok: false, safeMessage: 'Revocation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (revocation.revocationStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Revocation must be in draft status to apply', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.revocationRepo.apply(revocationId);
    await this.auditBridge.recordRevocationApplied(ctx, revocationId, 'Revocation applied');
    return this.envelope(ctx, { resourceId: revocationId, status: 'applied', safeMessage: 'Revocation applied', reasonCode: 'APPLIED' });
  }

  async voidRevocation(ctx: ResultReportCardAccessCommandContext, revocationId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const revocation = await this.revocationRepo.getById(revocationId);
    if (!revocation) return this.envelope(ctx, { ok: false, safeMessage: 'Revocation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (revocation.revocationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.revocationRepo.void(revocationId, 'VOIDED', 'Revocation voided');
    return this.envelope(ctx, { resourceId: revocationId, status: 'void', safeMessage: 'Revocation voided', reasonCode: 'VOIDED' });
  }
}
