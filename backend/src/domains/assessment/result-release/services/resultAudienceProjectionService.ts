import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { ResultAudienceProjection, CreateAudienceProjectionInput } from '../contracts/resultAudienceProjectionContracts';
import type { ResultAudienceProjectionRepository } from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import { evaluateAudienceProjectionPolicy } from '../policies/resultReleasePolicyDefinitions';

export class ResultAudienceProjectionService {
  constructor(
    private projectionRepo: ResultAudienceProjectionRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async generateAudienceProjection(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateAudienceProjectionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateAudienceProjectionPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'generateAudienceProjection', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'generateAudienceProjection', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateAudienceProjectionInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const projection = await this.projectionRepo.create(createInput);
      await this.auditBridge.recordAudienceProjectionGenerated(ctx, projection);
      await this.idempotencyService.completeOperation(startIdem, projection.resultAudienceProjectionId, 'Audience projection generated');
      await this.projectionRepo.updateStatus(projection.resultAudienceProjectionId, 'generated');
      return this.envelope(ctx, { resourceId: projection.resultAudienceProjectionId, status: 'generated', safeMessage: 'Audience projection generated', data: projection });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to generate projection', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getAudienceProjection(ctx: ResultReleaseCommandContext, projectionId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: projectionId, status: projection.projectionStatus, safeMessage: 'Projection found', data: projection });
  }

  async listAudienceProjectionsForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projections = await this.projectionRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${projections.length} projections for packet`, data: projections });
  }

  async listAudienceProjectionsForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const projections = await this.projectionRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${projections.length} projections for student`, data: projections });
  }

  async blockAudienceProjection(ctx: ResultReleaseCommandContext, projectionId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (projection.projectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided projection', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.projectionRepo.blockProjection(projectionId);
    return this.envelope(ctx, { resourceId: projectionId, status: 'blocked', safeMessage: 'Audience projection blocked' });
  }

  async voidAudienceProjection(ctx: ResultReleaseCommandContext, projectionId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const projection = await this.projectionRepo.getById(projectionId);
    if (!projection) return this.envelope(ctx, { ok: false, safeMessage: 'Projection not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (projection.projectionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.projectionRepo.voidProjection(projectionId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: projectionId, status: 'void', safeMessage: 'Audience projection voided' });
  }
}
