import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseTriageAuditEvent, RecoveryCaseTriageAuditRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseTriageAuditBridge {
  constructor(private repo: RecoveryCaseTriageAuditRepository) {}

  async createAuditEvent(ctx: RecoveryCaseTriageCommandContext, schoolId: string, event: {
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    actorRole: string;
    safeSummary: string;
    reasonCodesJson: Record<string, unknown> | null;
    metadataJson: Record<string, unknown> | null;
    correlationId: string | null;
  }): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageAuditEvent>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_AUDIT', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const created = await this.repo.create({
        triageAuditId: uuid(),
        schoolId: ctx.schoolId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        actorId: event.actorId,
        actorRole: event.actorRole,
        safeSummary: event.safeSummary,
        reasonCodesJson: event.reasonCodesJson,
        metadataJson: event.metadataJson,
        correlationId: event.correlationId ?? ctx.correlationId,
        createdAt: now,
      } as any);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async listAuditEventsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageAuditEvent[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuditEventsForEntity(schoolId: string, entityType: string, entityId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageAuditEvent[]>> {
    try {
      const records = await this.repo.listByEntity(schoolId, entityType, entityId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuditEventsByAction(schoolId: string, action: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageAuditEvent[]>> {
    try {
      const records = await this.repo.listByAction(schoolId, action);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuditEventsByActor(schoolId: string, actorId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageAuditEvent[]>> {
    try {
      const records = await this.repo.listByActor(schoolId, actorId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
