import type { RecoveryCaseAdjudicationAuditRepository } from '../contracts';

export class RecoveryCaseAdjudicationAuditBridge {
  constructor(private repo: RecoveryCaseAdjudicationAuditRepository) {}

  async recordAuditEvent(params: {
    schoolId: string;
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    actorRole: string;
    correlationId?: string;
    safeMetadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.repo.create({
      schoolId: params.schoolId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      correlationId: params.correlationId,
      safeMetadata: params.safeMetadata,
    });
  }

  async listAuditEventsForSchool(schoolId: string): Promise<unknown[]> {
    return this.repo.listBySchool(schoolId);
  }

  async listAuditEventsForEntity(schoolId: string, entityId: string): Promise<unknown[]> {
    return this.repo.listByEntityId(schoolId, entityId);
  }
}
