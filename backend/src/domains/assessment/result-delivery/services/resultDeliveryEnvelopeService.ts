import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryChannelEnvelope, CreateChannelEnvelopeInput } from '../contracts/resultDeliveryEnvelopeContracts';
import type { ResultDeliveryChannelEnvelopeRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import {
  evaluateEnvelopeSealingPolicy,
  evaluateLiveSendBlockPolicy,
} from '../policies/resultDeliveryPolicyDefinitions';

const FORBIDDEN_ENVELOPE_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'portalPayload', 'notificationPayload',
  'rawMasteryDelta', 'beforeStateJson', 'afterStateJson', 'deltaJson',
];

export class ResultDeliveryEnvelopeService {
  constructor(
    private envelopeRepo: ResultDeliveryChannelEnvelopeRepository,
    private auditBridge: ResultDeliveryAuditBridge,
    private idempotencyService: ResultDeliveryIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultDeliveryCommandContext,
    overrides: Partial<ResultDeliverySafeEnvelope>,
  ): ResultDeliverySafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async createChannelEnvelope(
    ctx: ResultDeliveryCommandContext,
    input: CreateChannelEnvelopeInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    if (input.safeBodyJson) {
      const bodyKeys = Object.keys(input.safeBodyJson);
      const blocked = bodyKeys.filter(k => FORBIDDEN_ENVELOPE_FIELDS.includes(k));
      if (blocked.length > 0) {
        await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', reasonCode: 'FORBIDDEN_FIELDS_IN_BODY', safeSummary: `Envelope body contains forbidden fields: ${blocked.join(', ')}` });
        return this.envelope(ctx, { ok: false, safeMessage: 'Envelope body contains forbidden fields', reasonCode: 'FORBIDDEN_FIELDS_IN_BODY', status: 'blocked', data: { blockedFields: blocked } });
      }
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createChannelEnvelope', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createChannelEnvelope', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const envelope = await this.envelopeRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordEnvelopeCreated(ctx, envelope);
      await this.idempotencyService.completeOperation(startIdem, envelope.resultDeliveryChannelEnvelopeId, 'Channel envelope created');
      return this.envelope(ctx, {
        resourceId: envelope.resultDeliveryChannelEnvelopeId,
        resourceVersion: envelope.createdAt,
        status: envelope.envelopeStatus,
        safeMessage: 'Channel envelope created successfully',
        data: envelope,
        nextAllowedActions: ['sealChannelEnvelope'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create channel envelope', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async sealChannelEnvelope(ctx: ResultDeliveryCommandContext, envelopeId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelope = await this.envelopeRepo.getById(envelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (envelope.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });

    const policyCheck = evaluateEnvelopeSealingPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const liveCheck = evaluateLiveSendBlockPolicy({ schoolId: ctx.schoolId, deliveryChannel: envelope.deliveryChannel });
    if (!liveCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: liveCheck.policyFamily, reasonCode: liveCheck.reasonCode, safeSummary: liveCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: liveCheck.safeMessage, reasonCode: liveCheck.reasonCode, policyDecision: liveCheck, status: 'blocked' });
    }

    await this.envelopeRepo.seal(envelopeId);
    await this.auditBridge.recordEnvelopeSealed(ctx, envelope);
    return this.envelope(ctx, { resourceId: envelopeId, status: 'sealed', safeMessage: 'Channel envelope sealed', nextAllowedActions: ['createMockAttempt'] });
  }

  async blockChannelEnvelope(ctx: ResultDeliveryCommandContext, envelopeId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelope = await this.envelopeRepo.getById(envelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (envelope.envelopeStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided envelope', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.block(envelopeId);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', reasonCode: 'MANUALLY_BLOCKED', safeSummary: 'Channel envelope blocked' });
    return this.envelope(ctx, { resourceId: envelopeId, status: 'blocked', safeMessage: 'Channel envelope blocked' });
  }

  async voidChannelEnvelope(ctx: ResultDeliveryCommandContext, envelopeId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelope = await this.envelopeRepo.getById(envelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (envelope.envelopeStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Envelope already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.void(envelopeId);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', reasonCode: 'VOIDED', safeSummary: 'Channel envelope voided' });
    return this.envelope(ctx, { resourceId: envelopeId, status: 'void', safeMessage: 'Channel envelope voided' });
  }

  async getChannelEnvelope(ctx: ResultDeliveryCommandContext, envelopeId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelope = await this.envelopeRepo.getById(envelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (envelope.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: envelope.resultDeliveryChannelEnvelopeId, status: envelope.envelopeStatus, safeMessage: 'Channel envelope found', data: envelope });
  }

  async listEnvelopesForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const envelopes = await this.envelopeRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${envelopes.length} envelopes for job`, data: envelopes });
  }

  async assertEnvelopeIsSafe(ctx: ResultDeliveryCommandContext, envelopeId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelope = await this.envelopeRepo.getById(envelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const leakageChecks: string[] = [];
    if (envelope.safeBodyJson) {
      const bodyKeys = Object.keys(envelope.safeBodyJson);
      const blocked = bodyKeys.filter(k => FORBIDDEN_ENVELOPE_FIELDS.includes(k));
      if (blocked.length > 0) leakageChecks.push(`FORBIDDEN_FIELDS:${blocked.join(',')}`);
    }

    const isSafe = leakageChecks.length === 0;
    return this.envelope(ctx, {
      resourceId: envelopeId,
      status: isSafe ? 'safe' : 'unsafe',
      safeMessage: isSafe ? 'Envelope is safe' : 'Envelope leakage detected',
      reasonCode: isSafe ? 'ENVELOPE_SAFE' : 'ENVELOPE_UNSAFE',
      data: { isSafe, leakageChecks },
    });
  }
}
