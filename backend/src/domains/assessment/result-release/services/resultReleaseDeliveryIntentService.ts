import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { ResultReleaseDeliveryIntent, CreateDeliveryIntentInput } from '../contracts/resultReleaseDeliveryIntentContracts';
import type { ResultReleaseDeliveryIntentRepository } from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import { evaluateDeliveryIntentPolicy } from '../policies/resultReleasePolicyDefinitions';

export class ResultReleaseDeliveryIntentService {
  constructor(
    private intentRepo: ResultReleaseDeliveryIntentRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createDeliveryIntent(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateDeliveryIntentInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateDeliveryIntentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createDeliveryIntent', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createDeliveryIntent', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateDeliveryIntentInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const intent = await this.intentRepo.create(createInput);
      await this.auditBridge.recordDeliveryIntentCreated(ctx, intent);
      await this.idempotencyService.completeOperation(startIdem, intent.resultReleaseDeliveryIntentId, 'Delivery intent created');
      return this.envelope(ctx, { resourceId: intent.resultReleaseDeliveryIntentId, status: intent.intentStatus, safeMessage: 'Delivery intent created', data: intent });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create delivery intent', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getDeliveryIntent(ctx: ResultReleaseCommandContext, intentId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.intentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: intentId, status: intent.intentStatus, safeMessage: 'Delivery intent found', data: intent });
  }

  async listDeliveryIntentsForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intents = await this.intentRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${intents.length} delivery intents for packet`, data: intents });
  }

  async listDeliveryIntentsForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const intents = await this.intentRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${intents.length} delivery intents for student`, data: intents });
  }

  async markDeliveryIntentEligible(ctx: ResultReleaseCommandContext, intentId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.intentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.intentStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Intent must be in draft status', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.intentRepo.updateStatus(intentId, 'eligible_for_future_delivery');
    await this.auditBridge.recordDeliveryIntentEligible(ctx, intent);
    return this.envelope(ctx, { resourceId: intentId, status: 'eligible_for_future_delivery', safeMessage: 'Delivery intent marked eligible' });
  }

  async blockDeliveryIntent(ctx: ResultReleaseCommandContext, intentId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.intentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.intentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided intent', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.intentRepo.blockIntent(intentId);
    return this.envelope(ctx, { resourceId: intentId, status: 'blocked', safeMessage: 'Delivery intent blocked' });
  }

  async voidDeliveryIntent(ctx: ResultReleaseCommandContext, intentId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.intentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.intentStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.intentRepo.voidIntent(intentId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: intentId, status: 'void', safeMessage: 'Delivery intent voided' });
  }
}
