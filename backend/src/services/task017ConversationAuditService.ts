import { recordDurableAuditEvent } from './durableAuditEventService';
import type { DurableAuditEventCategory, DurableAuditSeverity, DurableAuditActor } from '../contracts/durableAuditEventContracts';
import type { ConversationAuditRecord } from './task017Contracts';

export async function recordConversationAudit(
  input: ConversationAuditRecord,
): Promise<void> {
  await recordDurableAuditEvent({
    category: 'request_lifecycle' as DurableAuditEventCategory,
    eventType: 'conversation.turn',
    severity: 'info' as DurableAuditSeverity,
    actorType: 'student' as DurableAuditActor['actorType'],
    actorId: input.actorId,
    schoolId: input.schoolId,
    studentId: input.tutorLearnerId,
    requestId: input.requestId,
    route: input.route,
    method: 'POST',
    serviceName: 'tutorConversationRuntime',
    operation: input.mode,
    safeSummary: `Conversation turn: ${input.mode} (${input.status})`,
    safeMetadata: {
      mode: input.mode,
      streaming: input.streaming,
      status: input.status,
      errorCode: input.errorCode,
      reasonCodes: input.reasonCodes,
      safeEvidenceRefs: input.safeEvidenceRefs,
      privacyDecision: input.privacyDecision,
      safetyDecision: input.safetyDecision,
      deenSensitivityHandled: input.deenSensitivityHandled,
      safeguardingBoundaryApplied: input.safeguardingBoundaryApplied,
      sessionId: input.sessionId,
    },
    occurredAt: input.createdAt,
  }).catch(() => {});
}
