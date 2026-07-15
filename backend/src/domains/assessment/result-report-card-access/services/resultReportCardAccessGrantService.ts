import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessGrantRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessGrantInput } from '../contracts/resultReportCardAccessGrantContracts';
import { evaluateReportCardAccessGrantCreationPolicy, evaluateReportCardAccessNoLivePortalPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessGrantService {
  constructor(
    private grantRepo: ResultReportCardAccessGrantRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createAccessGrantFromExportReadiness(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessGrantInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessGrantCreationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const livePolicy = evaluateReportCardAccessNoLivePortalPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!livePolicy.allowed && input.grantMode !== 'mock_portal_preview_only' && input.grantMode !== 'future_access_only' && input.grantMode !== 'metadata_only' && input.grantMode !== 'admin_review_only' && input.grantMode !== 'print_counter_preview_only') {
      return this.envelope(ctx, { ok: false, safeMessage: livePolicy.safeMessage, reasonCode: livePolicy.reasonCode, policyDecision: livePolicy, status: 'blocked' });
    }

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createAccessGrant', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessGrantInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.grantRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createAccessGrant', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createAccessGrant', idempotencyKey, 'ResultReportCardAccessGrant', record.resultReportCardAccessGrantId, 'Access grant created');
    await this.auditBridge.recordAccessGrantCreated(ctx, record.resultReportCardAccessGrantId, `Access grant created for assembly ${input.resultReportCardAssemblyId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessGrantId, status: record.grantStatus, safeMessage: 'Access grant created successfully', reasonCode: 'ACCESS_GRANT_CREATED', data: record });
  }

  async getAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: accessGrantId, status: grant.grantStatus, safeMessage: 'Access grant found', data: grant });
  }

  async listAccessGrantsForSchool(ctx: ResultReportCardAccessCommandContext): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grants = await this.grantRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${grants.length} access grants for school`, data: grants });
  }

  async listAccessGrantsForStudent(ctx: ResultReportCardAccessCommandContext, studentRef: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grants = await this.grantRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${grants.length} access grants for student`, data: grants });
  }

  async listAccessGrantsForAssembly(ctx: ResultReportCardAccessCommandContext, assemblyId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grants = await this.grantRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${grants.length} access grants for assembly`, data: grants });
  }

  async listAccessGrantsForExportJob(ctx: ResultReportCardAccessCommandContext): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grants = await this.grantRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${grants.length} access grants`, data: grants });
  }

  async listAccessGrantsForAudience(ctx: ResultReportCardAccessCommandContext, audienceType: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grants = await this.grantRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${grants.length} access grants`, data: grants });
  }

  async validateAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Access grant must be in draft status to validate', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.validate(accessGrantId);
    await this.auditBridge.recordAccessGrantValidated(ctx, accessGrantId, 'Access grant validated');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'validated', safeMessage: 'Access grant validated', reasonCode: 'VALIDATED' });
  }

  async markReadyForFutureAccess(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus !== 'validated') return this.envelope(ctx, { ok: false, safeMessage: 'Access grant must be validated before marking ready', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.updateStatus(accessGrantId, { status: 'ready_for_future_access', reasonCode: 'READY_FOR_FUTURE_ACCESS', safeMessage: 'Access grant ready for future access' });
    await this.auditBridge.recordAccessGrantReady(ctx, accessGrantId, 'Access grant ready for future access');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'ready_for_future_access', safeMessage: 'Access grant ready for future access', reasonCode: 'READY_FOR_FUTURE_ACCESS' });
  }

  async suppressAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided access grant', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.suppress(accessGrantId, 'SUPPRESSED', 'Access grant suppressed');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'suppressed', safeMessage: 'Access grant suppressed', reasonCode: 'SUPPRESSED' });
  }

  async revokeAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot revoke voided access grant', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.revoke(accessGrantId, 'REVOKED', 'Access grant revoked');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'revoked', safeMessage: 'Access grant revoked', reasonCode: 'REVOKED' });
  }

  async expireAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot expire voided access grant', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.expire(accessGrantId, 'EXPIRED', 'Access grant expired');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'expired', safeMessage: 'Access grant expired', reasonCode: 'EXPIRED' });
  }

  async blockAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided access grant', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.block(accessGrantId, 'BLOCKED', 'Access grant blocked');
    await this.auditBridge.recordPolicyBlocked(ctx, 'grant_block', `Access grant ${accessGrantId} blocked`, null);
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'blocked', safeMessage: 'Access grant blocked', reasonCode: 'BLOCKED' });
  }

  async voidAccessGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const grant = await this.grantRepo.getById(accessGrantId);
    if (!grant) return this.envelope(ctx, { ok: false, safeMessage: 'Access grant not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (grant.grantStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.grantRepo.void(accessGrantId, 'VOIDED', 'Access grant voided');
    return this.envelope(ctx, { resourceId: accessGrantId, status: 'void', safeMessage: 'Access grant voided', reasonCode: 'VOIDED' });
  }
}
