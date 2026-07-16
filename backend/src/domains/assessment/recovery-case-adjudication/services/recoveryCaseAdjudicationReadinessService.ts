import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseAdjudicationReadiness, CreateAdjudicationReadinessInput } from '../contracts/recoveryCaseAdjudicationReadinessContracts';
import type { RecoveryCaseAdjudicationReadinessRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseAdjudicationReadinessService {
  constructor(
    private readinessRepo: RecoveryCaseAdjudicationReadinessRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createAdjudicationReadiness(
    schoolId: string,
    actorId: string,
    actorRole: string,
    correlationId: string,
    idempotencyKey: string,
    sourceRefsJson: Record<string, unknown>,
    input: CreateAdjudicationReadinessInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    if (!isRoleAllowedForMutation(actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId };
    }

    const readiness = await this.readinessRepo.create({
      ...input,
      createdByActorId: actorId,
      createdByRole: actorRole,
    });

    await this.auditRepo.create({
      schoolId,
      entityType: 'adjudication_readiness',
      entityId: readiness.adjudicationReadinessId,
      action: 'create_adjudication_readiness',
      actorId,
      actorRole,
      correlationId,
      safeMetadata: { sourceRefs: sourceRefsJson },
    });

    return { success: true, status: 'ok', data: readiness, correlationId };
  }

  async getAdjudicationReadiness(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.getById(readinessId);
    if (!readiness) {
      return { success: false, status: 'not_found', message: 'Adjudication readiness not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: readiness };
  }

  async listAdjudicationReadinessForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness[]>> {
    const items = await this.readinessRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness[]>> {
    const items = await this.readinessRepo.listByStudentRef(schoolId, studentRef);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationReadinessForPlan(schoolId: string, planId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness[]>> {
    const items = await this.readinessRepo.listByPlanId(schoolId, planId);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationReadinessForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness[]>> {
    const items = await this.readinessRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationReadinessByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness[]>> {
    const items = await this.readinessRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markAdjudicationReady(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.updateStatus(readinessId, 'ready');
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'mark_adjudication_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }

  async markAdjudicationReviewReady(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.updateStatus(readinessId, 'review_ready');
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'mark_adjudication_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }

  async markAdjudicationStale(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.updateStatus(readinessId, 'stale');
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'mark_adjudication_stale',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }

  async blockAdjudicationReadiness(readinessId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.updateStatus(readinessId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'block_adjudication_readiness',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }

  async suppressAdjudicationReadiness(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.updateStatus(readinessId, 'suppressed');
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'suppress_adjudication_readiness',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }

  async voidAdjudicationReadiness(readinessId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationReadiness>> {
    const readiness = await this.readinessRepo.void(readinessId);
    await this.auditRepo.create({
      schoolId: readiness.schoolId,
      entityType: 'adjudication_readiness',
      entityId: readinessId,
      action: 'void_adjudication_readiness',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: readiness.readinessStatus },
    });
    return { success: true, status: 'ok', data: readiness };
  }
}
