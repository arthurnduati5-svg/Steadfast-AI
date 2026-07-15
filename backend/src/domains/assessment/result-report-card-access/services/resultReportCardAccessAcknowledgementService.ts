import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessAcknowledgementRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessAcknowledgementInput } from '../contracts/resultReportCardAccessAcknowledgementContracts';
import { evaluateReportCardAccessAcknowledgementPolicy, evaluateReportCardAccessNoNotificationPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessAcknowledgementService {
  constructor(
    private ackRepo: ResultReportCardAccessAcknowledgementRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async recordAccessAcknowledgement(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessAcknowledgementInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessAcknowledgementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const notifPolicy = evaluateReportCardAccessNoNotificationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!notifPolicy.allowed && input.acknowledgementType !== 'dry_run_acknowledgement' && input.acknowledgementType !== 'mock_preview_ready' && input.acknowledgementType !== 'access_readiness_receipt' && input.acknowledgementType !== 'suppression_receipt' && input.acknowledgementType !== 'blocked_receipt') {
      return this.envelope(ctx, { ok: false, safeMessage: notifPolicy.safeMessage, reasonCode: notifPolicy.reasonCode, policyDecision: notifPolicy, status: 'blocked' });
    }

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'recordAccessAcknowledgement', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessAcknowledgementInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.ackRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'recordAccessAcknowledgement', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'recordAccessAcknowledgement', idempotencyKey, 'ResultReportCardAccessAcknowledgement', record.resultReportCardAccessAcknowledgementId, 'Access acknowledgement recorded');
    await this.auditBridge.recordAcknowledgementRecorded(ctx, record.resultReportCardAccessAcknowledgementId, `Access acknowledgement recorded for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessAcknowledgementId, status: record.acknowledgementStatus, safeMessage: 'Access acknowledgement recorded successfully', reasonCode: 'ACKNOWLEDGEMENT_CREATED', data: record });
  }

  async getAccessAcknowledgement(ctx: ResultReportCardAccessCommandContext, acknowledgementId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const ack = await this.ackRepo.getById(acknowledgementId);
    if (!ack) return this.envelope(ctx, { ok: false, safeMessage: 'Access acknowledgement not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: acknowledgementId, status: ack.acknowledgementStatus, safeMessage: 'Access acknowledgement found', data: ack });
  }

  async listAcknowledgementsForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const acks = await this.ackRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${acks.length} acknowledgements for grant`, data: acks });
  }

  async listAcknowledgementsForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const acks = await this.ackRepo.listByRecipientId(recipientId);
    return this.envelope(ctx, { safeMessage: `Found ${acks.length} acknowledgements for recipient`, data: acks });
  }

  async listAcknowledgementsForPreview(ctx: ResultReportCardAccessCommandContext, previewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const acks = await this.ackRepo.listByPreviewId(previewId);
    return this.envelope(ctx, { safeMessage: `Found ${acks.length} acknowledgements for preview`, data: acks });
  }

  async blockAccessAcknowledgement(ctx: ResultReportCardAccessCommandContext, acknowledgementId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const ack = await this.ackRepo.getById(acknowledgementId);
    if (!ack) return this.envelope(ctx, { ok: false, safeMessage: 'Access acknowledgement not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (ack.acknowledgementStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided acknowledgement', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.ackRepo.block(acknowledgementId, 'BLOCKED', 'Access acknowledgement blocked');
    return this.envelope(ctx, { resourceId: acknowledgementId, status: 'blocked', safeMessage: 'Access acknowledgement blocked', reasonCode: 'BLOCKED' });
  }

  async voidAccessAcknowledgement(ctx: ResultReportCardAccessCommandContext, acknowledgementId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const ack = await this.ackRepo.getById(acknowledgementId);
    if (!ack) return this.envelope(ctx, { ok: false, safeMessage: 'Access acknowledgement not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (ack.acknowledgementStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.ackRepo.void(acknowledgementId, 'VOIDED', 'Access acknowledgement voided');
    return this.envelope(ctx, { resourceId: acknowledgementId, status: 'void', safeMessage: 'Access acknowledgement voided', reasonCode: 'VOIDED' });
  }
}
