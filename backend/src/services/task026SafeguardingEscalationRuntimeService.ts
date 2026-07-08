import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026SafeguardingSignalInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026SafeguardingSignalInput, Task026SafeguardingSignalResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function recordSafeguardingSignal(
  input: Task026SafeguardingSignalInput
): Promise<Task026SafeguardingSignalResult> {
  const validation = validateTask026SafeguardingSignalInput(input);
  if (!validation.valid) {
    return {
      recorded: false,
      signalId: '',
      pauseRecommended: false,
      humanReviewRequired: false,
      safeMessage: validation.safeMessage,
    };
  }

  const { schoolId, pilotRunId, signalType, severity, source, safeSummary, requiresPause, requiresHumanReview } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(pilotRunId);
  if (!run) {
    return {
      recorded: false,
      signalId: '',
      pauseRecommended: false,
      humanReviewRequired: false,
      safeMessage: 'Pilot run not found.',
    };
  }

  if (run.schoolId !== schoolId) {
    return {
      recorded: false,
      signalId: '',
      pauseRecommended: false,
      humanReviewRequired: false,
      safeMessage: 'School mismatch for safeguarding signal.',
    };
  }

  if (!run.safeguardingOwnerId) {
    return {
      recorded: false,
      signalId: '',
      pauseRecommended: false,
      humanReviewRequired: false,
      safeMessage: 'No safeguarding owner assigned to this pilot run.',
    };
  }

  const signal = await task026PilotExecutionRepository.recordSafeguardingSignal({
    schoolId,
    pilotRunId,
    signalType,
    severity,
    source,
    safeSummary,
    requiresPause,
    requiresHumanReview,
    humanReviewPathExists: true,
    status: requiresHumanReview ? 'pending_review' : 'logged',
  });

  const signalId = (signal as any).id || '';

  await task026PilotExecutionRepository.recordAuditEvent({
    runId: pilotRunId,
    schoolId,
    actorRole: source,
    action: 'safeguarding_signal_recorded',
    safeSummary: `Safeguarding signal ${signalId} recorded (type: ${signalType}).`,
    metadataSafeJson: { signalId, signalType, severity, requiresHumanReview, requiresPause },
  });

  return {
    recorded: true,
    signalId,
    pauseRecommended: requiresPause,
    humanReviewRequired: requiresHumanReview,
    safeMessage: `Safeguarding signal recorded (ID: ${signalId}).`,
  };
}
