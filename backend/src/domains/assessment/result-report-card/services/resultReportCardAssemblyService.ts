import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts/resultReportCardContracts';
import type { ResultReportCardAssembly, CreateAssemblyFromReleasePacketInput, ResultReportCardAssemblyPreview } from '../contracts/resultReportCardAssemblyContracts';
import type { ResultReportCardTemplate } from '../contracts/resultReportCardTemplateContracts';
import type { ResultReportCardAssemblyRepository, ResultReportCardSectionRepository, ResultReportCardEvidenceLinkRepository, ResultReportCardTemplateRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardAssemblyCreationPolicy } from '../policies/resultReportCardPolicyDefinitions';

export class ResultReportCardAssemblyService {
  constructor(
    private assemblyRepo: ResultReportCardAssemblyRepository,
    private sectionRepo: ResultReportCardSectionRepository,
    private evidenceRepo: ResultReportCardEvidenceLinkRepository,
    private templateRepo: ResultReportCardTemplateRepository,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultReportCardCommandContext,
    overrides: Partial<ResultReportCardSafeEnvelope>,
  ): ResultReportCardSafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async createAssemblyFromReleasePacket(
    ctx: ResultReportCardCommandContext,
    input: CreateAssemblyFromReleasePacketInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    if (!input.resultReleasePacketId || !input.resultReleaseApprovalId || !input.resultAudienceProjectionId || !input.studentResultReportSnapshotId || !input.resultFinalizationDecisionId || !input.resultReleaseBoundaryId || !input.markingResultVersionId || !input.studentRef || !input.paperId || !input.paperVersionId || !input.deliverySessionId) {
      return this.envelope(ctx, { ok: false, safeMessage: 'Release packet requires all required fields', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    }

    const policyCheck = evaluateReportCardAssemblyCreationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createAssemblyFromReleasePacket');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createAssemblyFromReleasePacket');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const assembly = await this.assemblyRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordAssemblyCreated(ctx, assembly);
      await this.idempotencyService.completeOperation(startIdem, assembly.resultReportCardAssemblyId, 'Assembly created from release packet');
      return this.envelope(ctx, {
        resourceId: assembly.resultReportCardAssemblyId,
        resourceVersion: assembly.createdAt,
        status: assembly.assemblyStatus,
        safeMessage: 'Assembly created from release packet successfully',
        data: assembly,
        nextAllowedActions: ['runAssemblySourceChecks', 'composeSection'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create assembly', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: assembly.resultReportCardAssemblyId, status: assembly.assemblyStatus, safeMessage: 'Assembly found', data: assembly });
  }

  async listAssembliesForSchool(ctx: ResultReportCardCommandContext): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assemblies = await this.assemblyRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${assemblies.length} assemblies`, data: assemblies });
  }

  async listAssembliesForStudent(ctx: ResultReportCardCommandContext, studentRef: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const assemblies = await this.assemblyRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${assemblies.length} assemblies for student`, data: assemblies });
  }

  async listAssembliesForReleasePacket(ctx: ResultReportCardCommandContext, releasePacketId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!releasePacketId) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const assemblies = await this.assemblyRepo.listByReleasePacketId(releasePacketId);
    return this.envelope(ctx, { safeMessage: `Found ${assemblies.length} assemblies for release packet`, data: assemblies });
  }

  async runAssemblySourceChecks(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'assembled');
    await this.auditBridge.recordAssemblySourceChecked(ctx, assembly);
    return this.envelope(ctx, { resourceId: assemblyId, status: 'assembled', safeMessage: 'Assembly source checks passed', nextAllowedActions: ['markAssemblySafetyChecked'] });
  }

  async markAssemblySafetyChecked(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'safety_checked');
    await this.auditBridge.recordAssemblySafetyChecked(ctx, assembly);
    return this.envelope(ctx, { resourceId: assemblyId, status: 'safety_checked', safeMessage: 'Assembly safety checked', nextAllowedActions: ['sealAssembly'] });
  }

  async sealAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'sealed');
    await this.auditBridge.recordAssemblySealed(ctx, assembly);
    return this.envelope(ctx, { resourceId: assemblyId, status: 'sealed', safeMessage: 'Assembly sealed', nextAllowedActions: ['markAssemblyReadyForReview'] });
  }

  async markAssemblyReadyForReview(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'ready_for_review');
    await this.auditBridge.recordAssemblyReadyForReview(ctx, assembly);
    return this.envelope(ctx, { resourceId: assemblyId, status: 'ready_for_review', safeMessage: 'Assembly marked ready for review', nextAllowedActions: ['createReview'] });
  }

  async blockAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'blocked');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', reasonCode: 'BLOCKED', safeSummary: 'Assembly blocked' });
    return this.envelope(ctx, { resourceId: assemblyId, status: 'blocked', safeMessage: 'Assembly blocked' });
  }

  async cancelAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void' || assembly.assemblyStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'cancelled');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', reasonCode: 'CANCELLED', safeSummary: 'Assembly cancelled' });
    return this.envelope(ctx, { resourceId: assemblyId, status: 'cancelled', safeMessage: 'Assembly cancelled' });
  }

  async voidAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const assembly = await this.assemblyRepo.getById(assemblyId);
    if (!assembly) return this.envelope(ctx, { ok: false, safeMessage: 'Assembly not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (assembly.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (assembly.assemblyStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Assembly already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.assemblyRepo.updateStatus(assemblyId, 'void');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', reasonCode: 'VOIDED', safeSummary: 'Assembly voided' });
    return this.envelope(ctx, { resourceId: assemblyId, status: 'void', safeMessage: 'Assembly voided' });
  }
}
