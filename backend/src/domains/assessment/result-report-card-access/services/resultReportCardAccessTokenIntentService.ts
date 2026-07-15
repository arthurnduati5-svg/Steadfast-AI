import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessTokenIntentRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessTokenIntentInput, ResultReportCardAccessTokenIntent } from '../contracts/resultReportCardAccessTokenIntentContracts';
import { evaluateReportCardAccessTokenIntentPolicy, evaluateReportCardAccessNoRealTokenPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessTokenIntentService {
  constructor(
    private tokenIntentRepo: ResultReportCardAccessTokenIntentRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createTokenIntent(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessTokenIntentInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessTokenIntentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const tokenPolicy = evaluateReportCardAccessNoRealTokenPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!tokenPolicy.allowed && input.tokenIntentMode !== 'no_token_created' && input.tokenIntentMode !== 'future_token_required' && input.tokenIntentMode !== 'admin_review_required') {
      return this.envelope(ctx, { ok: false, safeMessage: tokenPolicy.safeMessage, reasonCode: tokenPolicy.reasonCode, policyDecision: tokenPolicy, status: 'blocked' });
    }

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createTokenIntent', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessTokenIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.tokenIntentRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createTokenIntent', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createTokenIntent', idempotencyKey, 'ResultReportCardAccessTokenIntent', record.resultReportCardAccessTokenIntentId, 'Token intent created');
    await this.auditBridge.recordTokenIntentCreated(ctx, record.resultReportCardAccessTokenIntentId, `Token intent created for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessTokenIntentId, status: record.tokenIntentStatus, safeMessage: 'Token intent created successfully', reasonCode: 'TOKEN_INTENT_CREATED', data: record });
  }

  async getTokenIntent(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.tokenIntentRepo.getById(tokenIntentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Token intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: tokenIntentId, status: intent.tokenIntentStatus, safeMessage: 'Token intent found', data: intent });
  }

  async listTokenIntentsForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intents = await this.tokenIntentRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${intents.length} token intents for grant`, data: intents });
  }

  async listTokenIntentsForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intents = await this.tokenIntentRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${intents.length} token intents`, data: intents });
  }

  async validateTokenIntent(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.tokenIntentRepo.getById(tokenIntentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Token intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.tokenIntentStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Token intent must be in draft status to validate', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.tokenIntentRepo.validate(tokenIntentId);
    await this.auditBridge.recordTokenIntentValidated(ctx, tokenIntentId, 'Token intent validated');
    return this.envelope(ctx, { resourceId: tokenIntentId, status: 'validated', safeMessage: 'Token intent validated', reasonCode: 'VALIDATED' });
  }

  async blockTokenIntent(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.tokenIntentRepo.getById(tokenIntentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Token intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.tokenIntentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided token intent', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.tokenIntentRepo.block(tokenIntentId, 'BLOCKED', 'Token intent blocked');
    return this.envelope(ctx, { resourceId: tokenIntentId, status: 'blocked', safeMessage: 'Token intent blocked', reasonCode: 'BLOCKED' });
  }

  async voidTokenIntent(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.tokenIntentRepo.getById(tokenIntentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Token intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.tokenIntentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.tokenIntentRepo.void(tokenIntentId, 'VOIDED', 'Token intent voided');
    return this.envelope(ctx, { resourceId: tokenIntentId, status: 'void', safeMessage: 'Token intent voided', reasonCode: 'VOIDED' });
  }

  async assertNoRealToken(ctx: ResultReportCardAccessCommandContext, tokenIntentId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.tokenIntentRepo.getById(tokenIntentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Token intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.tokenIntentMode === 'no_token_created') {
      return this.envelope(ctx, { resourceId: tokenIntentId, safeMessage: 'No real token exists', reasonCode: 'NO_REAL_TOKEN' });
    }
    return this.envelope(ctx, { ok: true, resourceId: tokenIntentId, safeMessage: 'Token intent is not a real token', reasonCode: 'TOKEN_INTENT_ONLY' });
  }
}
