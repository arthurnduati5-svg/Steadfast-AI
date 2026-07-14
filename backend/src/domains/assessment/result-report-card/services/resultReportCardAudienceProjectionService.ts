import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
  ResultReportCardAudienceType,
} from '../contracts';
import type { ResultReportCardAudienceProjection, CreateAudienceProjectionInput } from '../contracts/resultReportCardProjectionContracts';
import type { ResultReportCardAudienceProjectionRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardSafetyService } from './resultReportCardSafetyService';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardAudienceProjectionPolicy } from '../policies/resultReportCardPolicyDefinitions';

export class ResultReportCardAudienceProjectionService {
  constructor(
    private projectionRepo: ResultReportCardAudienceProjectionRepository,
    private safetyService: ResultReportCardSafetyService,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  private async generateProjection(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
    audienceType: string,
    safetyCheckFn: (projection: Record<string, unknown>) => Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }>,
    operationName: string,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportCardAudienceProjectionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const safetyCheck = await safetyCheckFn((input.safeProjectionJson || {}) as Record<string, unknown>);
    if (!safetyCheck.safe) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx, operationName);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, operationName);
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateAudienceProjectionInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      audienceType,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const projection = await this.projectionRepo.create(createInput);
      await this.auditBridge.recordAudienceProjectionGenerated(ctx, projection);
      await this.idempotencyService.completeOperation(startIdem, projection.resultReportCardAudienceProjectionId, `${audienceType} projection generated`);
      return this.envelope(ctx, { resourceId: projection.resultReportCardAudienceProjectionId, status: projection.projectionStatus, safeMessage: `${audienceType} projection generated`, data: projection });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: `Failed to generate ${audienceType} projection`, reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async generateTeacherProjection(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    return this.generateProjection(ctx, input, 'teacher', (p) => this.safetyService.assertTeacherProjectionSafe(p), 'generateTeacherProjection');
  }

  async generateAdminProjection(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    return this.generateProjection(ctx, input, 'admin', (p) => this.safetyService.assertAdminProjectionSafe(p), 'generateAdminProjection');
  }

  async generateStudentSafeProjection(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    return this.generateProjection(ctx, input, 'student', (p) => this.safetyService.assertStudentProjectionSafe(p), 'generateStudentSafeProjection');
  }

  async generateParentBoundaryProjection(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    return this.generateProjection(ctx, input, 'parent', (p) => this.safetyService.assertParentProjectionSafe(p), 'generateParentBoundaryProjection');
  }

  async sealAudienceProjection(ctx: ResultReportCardCommandContext, projectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Audience projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (projection.projectionStatus === 'void' || projection.projectionStatus === 'sealed') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot seal projection in current status', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.projectionRepo.updateStatus(projectionId, 'sealed');
    return this.envelope(ctx, { resourceId: projectionId, status: 'sealed', safeMessage: 'Audience projection sealed' });
  }

  async blockAudienceProjection(ctx: ResultReportCardCommandContext, projectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Audience projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (projection.projectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided projection', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.projectionRepo.updateStatus(projectionId, 'blocked');
    return this.envelope(ctx, { resourceId: projectionId, status: 'blocked', safeMessage: 'Audience projection blocked' });
  }

  async voidAudienceProjection(ctx: ResultReportCardCommandContext, projectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Audience projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (projection.projectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.projectionRepo.updateStatus(projectionId, 'void');
    return this.envelope(ctx, { resourceId: projectionId, status: 'void', safeMessage: 'Audience projection voided' });
  }

  async getAudienceProjection(ctx: ResultReportCardCommandContext, projectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Audience projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: projectionId, status: projection.projectionStatus, safeMessage: 'Audience projection found', data: projection });
  }

  async listAudienceProjectionsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projections = await this.projectionRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${projections.length} audience projections for assembly`, data: projections });
  }
}
