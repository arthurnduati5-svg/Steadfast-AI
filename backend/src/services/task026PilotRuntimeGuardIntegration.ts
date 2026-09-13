import { checkPilotRuntimeAccess } from './task026PilotRuntimeGuardService';
import { recordPilotEvent } from './task026PilotExecutionEventService';

export type IntegrationPoint =
  | 'pilot_session_start'
  | 'tutor_context_creation'
  | 'memory_read'
  | 'conversation_read'
  | 'ai_provider_call'
  | 'learning_evidence_write';

export async function enforcePilotRuntimeGate(params: {
  integrationPoint: IntegrationPoint;
  schoolId: string;
  actorIdHash: string;
  role: string;
  pilotProgramId?: string;
  executionRunId?: string;
  cohortId?: string;
  subject?: string;
  curriculumTrack?: string;
  requestId?: string;
}): Promise<{ allowed: boolean; safeMessage: string; reasonCodes: string[] }> {
  const { integrationPoint } = params;

  if (integrationPoint === 'pilot_session_start' || integrationPoint === 'tutor_context_creation') {
    const result = await checkPilotRuntimeAccess({
      schoolId: params.schoolId,
      actorIdHash: params.actorIdHash,
      role: params.role,
      pilotProgramId: params.pilotProgramId,
      executionRunId: params.executionRunId,
      cohortId: params.cohortId,
      subject: params.subject,
      curriculumTrack: params.curriculumTrack,
    });

    if (!result.allowed) {
      if (result.gateSnapshot.executionRunId) {
        await recordPilotEvent({
          executionRunId: result.gateSnapshot.executionRunId as string,
          pilotProgramId: params.pilotProgramId ?? '',
          schoolId: params.schoolId,
          actorRole: params.role,
          actorIdHash: params.actorIdHash,
          eventType: 'pilot_session_start_denied',
          eventStatus: 'blocked',
          safeSummary: `${integrationPoint} blocked: ${result.safeMessage}`,
          reasonCodes: result.reasonCodes,
          requestId: params.requestId,
        });
      }
    }

    return {
      allowed: result.allowed,
      safeMessage: result.allowed ? 'Pilot runtime gate passed.' : result.safeMessage,
      reasonCodes: result.reasonCodes,
    };
  }

  if (integrationPoint === 'ai_provider_call' || integrationPoint === 'memory_read' || integrationPoint === 'conversation_read' || integrationPoint === 'learning_evidence_write') {
    const result = await checkPilotRuntimeAccess({
      schoolId: params.schoolId,
      actorIdHash: params.actorIdHash,
      role: params.role,
      pilotProgramId: params.pilotProgramId,
      executionRunId: params.executionRunId,
    });

    if (!result.allowed) {
      const signalType = integrationPoint === 'ai_provider_call' ? 'ai_call_before_gates' : integrationPoint === 'memory_read' ? 'runtime_guard_denial' : 'runtime_guard_denial';

      if (result.gateSnapshot.executionRunId) {
        try {
          const { createPilotIncident } = await import('./task026PilotIncidentBridgeService');
          await createPilotIncident({
            executionRunId: result.gateSnapshot.executionRunId as string,
            pilotProgramId: params.pilotProgramId ?? '',
            schoolId: params.schoolId,
            reason: signalType as any,
            severity: 'high',
            safeSummary: `Runtime guard blocked ${integrationPoint}: ${result.safeMessage}`,
            reasonCodes: result.reasonCodes,
          });
        } catch { /* incident bridge failed silently */ }
      }
    }

    return {
      allowed: result.allowed,
      safeMessage: result.allowed ? `Pilot runtime gate passed for ${integrationPoint}.` : result.safeMessage,
      reasonCodes: result.reasonCodes,
    };
  }

  return {
    allowed: false,
    safeMessage: `Unknown integration point: ${integrationPoint}`,
    reasonCodes: ['unknown_integration_point'],
  };
}
