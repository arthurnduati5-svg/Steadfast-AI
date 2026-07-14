import { randomUUID } from 'crypto';
import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
  ResultReleasePacketStatus,
} from '../contracts';
import type { ResultReleasePacket, CreateReleasePacketInput } from '../contracts/resultReleasePacketContracts';
import type {
  ResultReleasePacketRepository,
  ResultReleaseApprovalRepository,
} from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import {
  evaluatePacketCreationPolicy,
  evaluateBoundaryEnforcementPolicy,
  evaluateAuditPolicy,
} from '../policies/resultReleasePolicyDefinitions';

function ok(data?: unknown): ResultReleaseSafeEnvelope {
  return { ok: true, requestId: '', safeMessage: 'Operation completed', nextAllowedActions: [] };
}

export class ResultReleasePacketService {
  constructor(
    private packetRepo: ResultReleasePacketRepository,
    private approvalRepo: ResultReleaseApprovalRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultReleaseCommandContext,
    overrides: Partial<ResultReleaseSafeEnvelope>,
  ): ResultReleaseSafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async createReleasePacketFromFinalizedResult(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateReleasePacketInput, 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluatePacketCreationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createReleasePacketFromFinalizedResult', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createReleasePacketFromFinalizedResult', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateReleasePacketInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const packet = await this.packetRepo.create(createInput);
      await this.auditBridge.recordReleasePacketCreated(ctx, packet);
      await this.idempotencyService.completeOperation(startIdem, packet.resultReleasePacketId, 'Release packet created');
      return this.envelope(ctx, {
        resourceId: packet.resultReleasePacketId,
        resourceVersion: packet.createdAt,
        status: packet.packetStatus,
        safeMessage: 'Release packet created successfully',
        data: packet,
        nextAllowedActions: ['runReleaseSourceChecks'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create release packet', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getReleasePacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: packet.resultReleasePacketId, status: packet.packetStatus, safeMessage: 'Release packet found', data: packet });
  }

  async listReleasePacketsForSchool(ctx: ResultReleaseCommandContext): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packets = await this.packetRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${packets.length} release packets`, data: packets });
  }

  async listReleasePacketsForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const packets = await this.packetRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${packets.length} release packets for student`, data: packets });
  }

  async listReleasePacketsForFinalizationDecision(ctx: ResultReleaseCommandContext, decisionId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!decisionId) return this.envelope(ctx, { ok: false, safeMessage: 'Decision ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const packets = await this.packetRepo.listByFinalizationDecisionId(decisionId);
    return this.envelope(ctx, { safeMessage: `Found ${packets.length} release packets for decision`, data: packets });
  }

  async runReleaseSourceChecks(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });

    const blockingCodes: string[] = [];
    if (!packet.resultFinalizationDecisionId) blockingCodes.push('MISSING_FINALIZATION_DECISION');
    if (!packet.markingResultVersionId) blockingCodes.push('MISSING_MARKING_RESULT_VERSION');
    if (!packet.studentRef) blockingCodes.push('MISSING_STUDENT_REF');
    if (!packet.resultReleaseReadinessId) blockingCodes.push('MISSING_RELEASE_READINESS');
    if (!packet.resultReleaseBoundaryId) blockingCodes.push('MISSING_RELEASE_BOUNDARY');

    const allChecksPassed = blockingCodes.length === 0;
    const newStatus: ResultReleasePacketStatus = allChecksPassed ? 'source_check_pending' : 'blocked';
    await this.packetRepo.updateStatus(packetId, newStatus);
    await this.auditBridge.recordReleaseSourceChecked(ctx, packet, allChecksPassed, blockingCodes);

    return this.envelope(ctx, {
      resourceId: packetId,
      status: newStatus,
      safeMessage: allChecksPassed ? 'Source checks passed' : 'Source checks failed',
      reasonCode: allChecksPassed ? 'SOURCE_CHECKS_PASSED' : 'SOURCE_CHECKS_FAILED',
      data: { allChecksPassed, blockingReasonCodes: blockingCodes },
      nextAllowedActions: allChecksPassed ? ['markPacketBoundaryChecked'] : [],
    });
  }

  async markPacketBoundaryChecked(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const policyCheck = evaluateBoundaryEnforcementPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    await this.packetRepo.updateStatus(packetId, 'boundary_checked');
    await this.auditBridge.recordBoundaryChecked(ctx, packet);
    return this.envelope(ctx, { resourceId: packetId, status: 'boundary_checked', safeMessage: 'Boundary checked', nextAllowedActions: ['markPacketReadyForApproval'] });
  }

  async markPacketReadyForApproval(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.packetStatus !== 'boundary_checked') return this.envelope(ctx, { ok: false, safeMessage: 'Packet must be boundary_checked before ready for approval', reasonCode: 'INVALID_STATUS_TRANSITION', status: 'error' });

    await this.packetRepo.updateStatus(packetId, 'ready_for_approval');
    await this.auditBridge.recordReleasePacketReadyForApproval(ctx, packet);
    return this.envelope(ctx, { resourceId: packetId, status: 'ready_for_approval', safeMessage: 'Packet ready for approval', nextAllowedActions: ['createReleaseApproval'] });
  }

  async blockReleasePacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });

    const blockedAt = new Date().toISOString();
    await this.packetRepo.blockPacket(packetId, blockedAt);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_RELEASE_PACKET_CREATION', reasonCode: 'MANUALLY_BLOCKED', safeSummary: 'Release packet manually blocked' });
    return this.envelope(ctx, { resourceId: packetId, status: 'blocked', safeMessage: 'Release packet blocked' });
  }

  async cancelReleasePacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.packetStatus === 'void' || packet.packetStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Packet already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    const cancelledAt = new Date().toISOString();
    await this.packetRepo.cancelPacket(packetId, cancelledAt);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_RELEASE_PACKET_CREATION', reasonCode: 'CANCELLED', safeSummary: 'Release packet cancelled' });
    return this.envelope(ctx, { resourceId: packetId, status: 'cancelled', safeMessage: 'Release packet cancelled' });
  }

  async voidReleasePacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const packet = await this.packetRepo.getById(packetId);
    if (!packet) return this.envelope(ctx, { ok: false, safeMessage: 'Release packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (packet.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Packet already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    const voidedAt = new Date().toISOString();
    await this.packetRepo.voidPacket(packetId, voidedAt);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_RELEASE_PACKET_CREATION', reasonCode: 'VOIDED', safeSummary: 'Release packet voided' });
    return this.envelope(ctx, { resourceId: packetId, status: 'void', safeMessage: 'Release packet voided' });
  }
}
