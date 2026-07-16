import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts';
import { InMemoryRecoveryExecutionReadinessBoardAuditRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

export class RecoveryExecutionReadinessBoardAuditBridge {
  private auditRepo: InMemoryRecoveryExecutionReadinessBoardAuditRepository;

  constructor() {
    this.auditRepo = new InMemoryRecoveryExecutionReadinessBoardAuditRepository();
  }

  async recordAuditEvent(
    context: RecoveryExecutionReadinessBoardCommandContext,
    action: string,
    details?: Record<string, any>,
    sourceRefs?: Record<string, any>,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any>> {
    const event = await this.auditRepo.create({
      schoolId: context.schoolId,
      action,
      actorId: context.actorId,
      actorRole: context.actorRole,
      safeAuditSummary: `${action} by ${context.actorRole} ${context.actorId}`,
      auditDetailsJson: details || {},
      sourceRefsJson: sourceRefs || context.sourceRefsJson || {},
    });
    return { success: true, status: 'audit_recorded', data: event, correlationId: context.correlationId };
  }

  async listAuditEventsForSchool(schoolId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any[]>> {
    const events = await this.auditRepo.listBySchool(schoolId);
    return { success: true, status: 'success', data: events, correlationId: context?.correlationId };
  }

  async listAuditEventsForSnapshot(snapshotId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any[]>> {
    const events = await this.auditRepo.listBySnapshotId(snapshotId);
    return { success: true, status: 'success', data: events, correlationId: context?.correlationId };
  }
}
