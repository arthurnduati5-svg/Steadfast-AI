import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardMockExportAttemptRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateMockExportAttemptInput, ResultReportCardMockExportAttempt } from '../contracts/resultReportCardMockExportAttemptContracts';
import { evaluateReportCardMockExportAttemptPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportSafetyService } from './resultReportCardExportSafetyService';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardMockExportService {
  constructor(
    private attemptRepo: ResultReportCardMockExportAttemptRepository,
    private safetyService: ResultReportCardExportSafetyService,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createMockExportAttempt(ctx: ResultReportCardCommandContext, input: Omit<CreateMockExportAttemptInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardMockExportAttemptPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const mockCheck = this.safetyService.assertMockOnlyOperation(input.attemptMode);
    if (!mockCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: mockCheck.safeMessage, reasonCode: mockCheck.reasonCode, status: 'blocked' });

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createMockExportAttempt', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateMockExportAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      attemptNumber: input.attemptNumber ?? 1,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardMockExportAttempt = {
      resultReportCardMockExportAttemptId: id,
      schoolId: ctx.schoolId,
      ...input,
      attemptNumber: input.attemptNumber ?? 1,
      attemptStatus: 'created',
      providerSimulationJson: input.providerSimulationJson || null,
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    await this.attemptRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createMockExportAttempt', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createMockExportAttempt', ctx.idempotencyKey, 'ResultReportCardMockExportAttempt', id, 'Mock export attempt created');
    await this.auditBridge.recordMockExportAttemptCreated(ctx, id, input.resultReportCardExportJobId, `Mock export attempt created for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'created', safeMessage: 'Mock export attempt created successfully', reasonCode: 'MOCK_ATTEMPT_CREATED', data: record });
  }

  async startMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus !== 'created') return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt must be in created status to start', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.start(attemptId);
    return this.envelope(ctx, { resourceId: attemptId, status: 'started', safeMessage: 'Mock export attempt started', reasonCode: 'STARTED' });
  }

  async completeMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus !== 'started') return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt must be started before completing', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.complete(attemptId);
    await this.auditBridge.recordMockExportAttemptCompleted(ctx, attemptId, attempt.resultReportCardExportJobId, 'Mock export attempt completed');
    return this.envelope(ctx, { resourceId: attemptId, status: 'completed', safeMessage: 'Mock export attempt completed', reasonCode: 'COMPLETED' });
  }

  async failMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'completed' || attempt.attemptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: `Cannot fail mock export attempt in ${attempt.attemptStatus} status`, reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.fail(attemptId, 'FAILED', 'Mock export attempt failed');
    return this.envelope(ctx, { resourceId: attemptId, status: 'failed', safeMessage: 'Mock export attempt failed', reasonCode: 'FAILED' });
  }

  async blockMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided mock export attempt', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.block(attemptId, 'BLOCKED', 'Mock export attempt blocked');
    return this.envelope(ctx, { resourceId: attemptId, status: 'blocked', safeMessage: 'Mock export attempt blocked', reasonCode: 'BLOCKED' });
  }

  async voidMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.void(attemptId, 'VOIDED', 'Mock export attempt voided');
    return this.envelope(ctx, { resourceId: attemptId, status: 'void', safeMessage: 'Mock export attempt voided', reasonCode: 'VOIDED' });
  }

  async getMockExportAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock export attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: attemptId, status: attempt.attemptStatus, safeMessage: 'Mock export attempt found', data: attempt });
  }

  async listMockExportAttemptsForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempts = await this.attemptRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${attempts.length} mock export attempts for job`, data: attempts });
  }

  async listMockExportAttemptsForTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempts = await this.attemptRepo.listByTargetId(targetId);
    return this.envelope(ctx, { safeMessage: `Found ${attempts.length} mock export attempts for target`, data: attempts });
  }
}
