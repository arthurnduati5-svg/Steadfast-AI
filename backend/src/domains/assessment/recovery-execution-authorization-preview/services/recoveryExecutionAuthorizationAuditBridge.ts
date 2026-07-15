import { RecoveryExecutionAuthorizationAuditRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { v4 as uuid } from 'uuid';

export class RecoveryExecutionAuthorizationAuditBridge {
  constructor(private repo: RecoveryExecutionAuthorizationAuditRepository) {}

  async recordAuditEvent(params: {
    schoolId: string;
    actorId: string;
    actorRole: string;
    eventType: string;
    decision: string;
    safeSummary: string;
    reasonCodes?: string[];
    metadata?: Record<string, unknown>;
    correlationId?: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    await this.repo.create({
      recoveryAuthorizationAuditEventId: uuid(),
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: params.eventType,
      decision: params.decision,
      safeSummary: params.safeSummary,
      reasonCodesJson: params.reasonCodes ? { reasons: params.reasonCodes } : {},
      metadataJson: params.metadata ?? {},
      correlationId: params.correlationId,
      createdAt: now,
    });
  }
}
