import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { StudentResultReportSnapshot, CreateReportSnapshotInput } from '../contracts/resultReportSnapshotContracts';
import type { StudentResultReportSnapshotRepository } from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import { evaluateReportSnapshotPolicy } from '../policies/resultReleasePolicyDefinitions';

export class ResultReportSnapshotService {
  constructor(
    private snapshotRepo: StudentResultReportSnapshotRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createStudentResultReportSnapshot(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateReportSnapshotInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportSnapshotPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createStudentResultReportSnapshot', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createStudentResultReportSnapshot', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateReportSnapshotInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const snapshot = await this.snapshotRepo.create(createInput);
      await this.auditBridge.recordReportSnapshotCreated(ctx, snapshot);
      await this.idempotencyService.completeOperation(startIdem, snapshot.studentResultReportSnapshotId, 'Report snapshot created');
      await this.snapshotRepo.updateStatus(snapshot.studentResultReportSnapshotId, 'generated');
      return this.envelope(ctx, { resourceId: snapshot.studentResultReportSnapshotId, status: 'generated', safeMessage: 'Report snapshot created', data: snapshot });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create report snapshot', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getStudentResultReportSnapshot(ctx: ResultReleaseCommandContext, snapshotId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const snapshot = await this.snapshotRepo.getById(snapshotId);
    if (!snapshot) return this.envelope(ctx, { ok: false, safeMessage: 'Snapshot not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: snapshotId, status: snapshot.snapshotStatus, safeMessage: 'Snapshot found', data: snapshot });
  }

  async listReportSnapshotsForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const snapshots = await this.snapshotRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${snapshots.length} snapshots for packet`, data: snapshots });
  }

  async listReportSnapshotsForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const snapshots = await this.snapshotRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${snapshots.length} snapshots for student`, data: snapshots });
  }

  async approveReportSnapshotForInternalUse(ctx: ResultReleaseCommandContext, snapshotId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const snapshot = await this.snapshotRepo.getById(snapshotId);
    if (!snapshot) return this.envelope(ctx, { ok: false, safeMessage: 'Snapshot not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (snapshot.snapshotStatus !== 'generated') return this.envelope(ctx, { ok: false, safeMessage: 'Snapshot must be in generated status to approve', reasonCode: 'INVALID_STATUS', status: 'error' });
    const approvedAt = new Date().toISOString();
    const updated = await this.snapshotRepo.approveSnapshot(snapshotId, approvedAt);
    if (!updated) return this.envelope(ctx, { ok: false, safeMessage: 'Failed to approve snapshot', reasonCode: 'APPROVE_FAILED', status: 'error' });
    return this.envelope(ctx, { resourceId: snapshotId, status: 'approved_for_internal_use', safeMessage: 'Report snapshot approved for internal use' });
  }

  async blockReportSnapshot(ctx: ResultReleaseCommandContext, snapshotId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const snapshot = await this.snapshotRepo.getById(snapshotId);
    if (!snapshot) return this.envelope(ctx, { ok: false, safeMessage: 'Snapshot not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (snapshot.snapshotStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided snapshot', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.snapshotRepo.blockSnapshot(snapshotId);
    return this.envelope(ctx, { resourceId: snapshotId, status: 'blocked', safeMessage: 'Report snapshot blocked' });
  }

  async voidReportSnapshot(ctx: ResultReleaseCommandContext, snapshotId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const snapshot = await this.snapshotRepo.getById(snapshotId);
    if (!snapshot) return this.envelope(ctx, { ok: false, safeMessage: 'Snapshot not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (snapshot.snapshotStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.snapshotRepo.voidSnapshot(snapshotId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: snapshotId, status: 'void', safeMessage: 'Report snapshot voided' });
  }
}
