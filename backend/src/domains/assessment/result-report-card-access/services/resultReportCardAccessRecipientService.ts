import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessRecipientRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessRecipientInput } from '../contracts/resultReportCardAccessRecipientContracts';
import { evaluateReportCardAccessRecipientResolutionPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessRecipientService {
  constructor(
    private recipientRepo: ResultReportCardAccessRecipientRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createAccessRecipient(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessRecipientInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessRecipientResolutionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createAccessRecipient', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.recipientRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createAccessRecipient', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createAccessRecipient', idempotencyKey, 'ResultReportCardAccessRecipient', record.resultReportCardAccessRecipientId, 'Access recipient created');
    await this.auditBridge.recordRecipientCreated(ctx, record.resultReportCardAccessRecipientId, `Access recipient created for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessRecipientId, status: record.recipientStatus, safeMessage: 'Access recipient created successfully', reasonCode: 'ACCESS_RECIPIENT_CREATED', data: record });
  }

  async getAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: accessRecipientId, status: recipient.recipientStatus, safeMessage: 'Access recipient found', data: recipient });
  }

  async listRecipientsForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipients = await this.recipientRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${recipients.length} recipients for grant`, data: recipients });
  }

  async listRecipientsForStudent(ctx: ResultReportCardAccessCommandContext, studentRef: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipients = await this.recipientRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${recipients.length} recipients`, data: recipients });
  }

  async listRecipientsForAudience(ctx: ResultReportCardAccessCommandContext, audienceType: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipients = await this.recipientRepo.listByAudienceType(ctx.schoolId, audienceType);
    return this.envelope(ctx, { safeMessage: `Found ${recipients.length} recipients for audience type`, data: recipients });
  }

  async validateAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient must be in draft status to validate', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.validate(accessRecipientId);
    await this.auditBridge.recordRecipientValidated(ctx, accessRecipientId, 'Access recipient validated');
    return this.envelope(ctx, { resourceId: accessRecipientId, status: 'validated', safeMessage: 'Access recipient validated', reasonCode: 'VALIDATED' });
  }

  async suppressAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided access recipient', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.suppress(accessRecipientId, 'SUPPRESSED', 'Access recipient suppressed');
    return this.envelope(ctx, { resourceId: accessRecipientId, status: 'suppressed', safeMessage: 'Access recipient suppressed', reasonCode: 'SUPPRESSED' });
  }

  async revokeAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot revoke voided access recipient', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.revoke(accessRecipientId, 'REVOKED', 'Access recipient revoked');
    return this.envelope(ctx, { resourceId: accessRecipientId, status: 'revoked', safeMessage: 'Access recipient revoked', reasonCode: 'REVOKED' });
  }

  async blockAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided access recipient', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.block(accessRecipientId, 'BLOCKED', 'Access recipient blocked');
    return this.envelope(ctx, { resourceId: accessRecipientId, status: 'blocked', safeMessage: 'Access recipient blocked', reasonCode: 'BLOCKED' });
  }

  async voidAccessRecipient(ctx: ResultReportCardAccessCommandContext, accessRecipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(accessRecipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Access recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.void(accessRecipientId, 'VOIDED', 'Access recipient voided');
    return this.envelope(ctx, { resourceId: accessRecipientId, status: 'void', safeMessage: 'Access recipient voided', reasonCode: 'VOIDED' });
  }
}
