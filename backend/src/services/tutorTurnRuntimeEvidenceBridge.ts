import type {
  TutorTurnContext,
  TutorTurnEvidenceBridgeResult,
  TutorTurnDispatchDecision,
  TutorTurnStatus,
} from '../contracts/tutorTurnRuntimeContracts';

export function recordTurnEvidence(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
  status: TutorTurnStatus,
): TutorTurnEvidenceBridgeResult {
  let evidenceType: string;

  switch (status) {
    case 'received':
      evidenceType = 'turn_received';
      break;
    case 'routed':
      evidenceType = 'turn_routed';
      break;
    case 'dispatched':
      evidenceType = 'turn_dispatched';
      break;
    case 'blocked':
      evidenceType = 'turn_blocked';
      break;
    case 'completed':
      evidenceType = 'turn_completed';
      break;
    case 'failed':
      evidenceType = 'turn_failed';
      break;
    default:
      evidenceType = `turn_${status}`;
  }

  const refs: string[] = [
    ...context.safeEvidenceRefs,
    `ev_${evidenceType}_${Date.now()}`,
  ];

  return {
    evidenceType,
    recorded: status !== 'failed',
    safeEvidenceRefs: refs,
    safeReasonCodes: [...context.safeReasonCodes, 'dispatch_completed'],
  };
}
