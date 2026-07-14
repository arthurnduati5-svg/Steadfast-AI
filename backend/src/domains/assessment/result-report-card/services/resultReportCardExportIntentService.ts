import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts';
import type { ResultReportCardExportIntent, CreateExportIntentInput } from '../contracts/resultReportCardExportContracts';
import type { ResultReportCardExportIntentRepository, ResultReportCardReviewRepository, ResultReportCardAssemblyRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardExportIntentPolicy } from '../policies/resultReportCardPolicyDefinitions';

const LIVE_EXPORT_CHANNELS: string[] = [
  'pdf_export_live', 'student_portal_live', 'parent_portal_live',
  'email_live', 'sms_live', 'push_live', 'whatsapp_live', 'external_school_system_live',
];

export class ResultReportCardExportIntentService {
  constructor(
    private exportIntentRepo: ResultReportCardExportIntentRepository,
    private reviewRepo: ResultReportCardReviewRepository,
    private assemblyRepo: ResultReportCardAssemblyRepository,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExportIntent(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateExportIntentInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportCardExportIntentPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const review = await this.reviewRepo.getById(input.resultReportCardReviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus !== 'approved') return this.envelope(ctx, { ok: false, safeMessage: 'Review must be approved before creating export intent', reasonCode: 'REVIEW_NOT_APPROVED', status: 'blocked' });

    const liveCheck = this.assertNoLiveExport(input.exportChannel);
    if (!liveCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: liveCheck.safeMessage, reasonCode: liveCheck.reasonCode, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createExportIntent');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createExportIntent');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateExportIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const intent = await this.exportIntentRepo.create(createInput);
      await this.auditBridge.recordExportIntentCreated(ctx, intent);
      await this.idempotencyService.completeOperation(startIdem, intent.resultReportCardExportIntentId, 'Export intent created');
      return this.envelope(ctx, { resourceId: intent.resultReportCardExportIntentId, status: intent.exportStatus, safeMessage: 'Export intent created', data: intent });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create export intent', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getExportIntent(ctx: ResultReportCardCommandContext, intentId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.exportIntentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Export intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: intentId, status: intent.exportStatus, safeMessage: 'Export intent found', data: intent });
  }

  async listExportIntentsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intents = await this.exportIntentRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${intents.length} export intents for assembly`, data: intents });
  }

  async markEligibleForFutureExport(ctx: ResultReportCardCommandContext, intentId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.exportIntentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Export intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.exportStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Export intent must be in draft status', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.exportIntentRepo.updateStatus(intentId, 'eligible_for_future_export');
    await this.auditBridge.recordExportIntentEligible(ctx, intent);
    return this.envelope(ctx, { resourceId: intentId, status: 'eligible_for_future_export', safeMessage: 'Export intent marked eligible for future export' });
  }

  async blockExportIntent(ctx: ResultReportCardCommandContext, intentId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.exportIntentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Export intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.exportStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided export intent', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.exportIntentRepo.updateStatus(intentId, 'blocked');
    return this.envelope(ctx, { resourceId: intentId, status: 'blocked', safeMessage: 'Export intent blocked' });
  }

  async voidExportIntent(ctx: ResultReportCardCommandContext, intentId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const intent = await this.exportIntentRepo.getById(intentId);
    if (!intent) return this.envelope(ctx, { ok: false, safeMessage: 'Export intent not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (intent.exportStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.exportIntentRepo.updateStatus(intentId, 'void');
    return this.envelope(ctx, { resourceId: intentId, status: 'void', safeMessage: 'Export intent voided' });
  }

  assertNoLiveExport(channel: string): { allowed: boolean; safeMessage: string; reasonCode: string } {
    if (LIVE_EXPORT_CHANNELS.includes(channel)) {
      return { allowed: false, safeMessage: 'Live export channels are not allowed for report card export intents', reasonCode: 'LIVE_CHANNEL_BLOCKED' };
    }
    return { allowed: true, safeMessage: 'Export channel is not a live channel', reasonCode: 'CHANNEL_ALLOWED' };
  }

  assertNoPdfGeneration(ctx: ResultReportCardCommandContext): { allowed: boolean; safeMessage: string; reasonCode: string } {
    return { allowed: false, safeMessage: 'PDF generation is blocked for report card export intents', reasonCode: 'PDF_GENERATION_BLOCKED' };
  }
}
