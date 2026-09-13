import type { Task033DriftDetectionResult, Task033ObservationEnvironmentGateInput, Task033ObservationEventRecord } from '../contracts/task033ControlledCanaryObservationContracts';
import { TASK033_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function detectTask033CanaryDrift(
  sessionId: string,
  environmentInput: Task033ObservationEnvironmentGateInput,
): Promise<Task033DriftDetectionResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];
  const driftCodes: string[] = [];

  const rolloutRequestObserved = !!environmentInput.rolloutRequested;
  const cohortExpansionRequestObserved = !!environmentInput.cohortExpansionRequested;
  const trafficRoutingRequestObserved = !!environmentInput.trafficRoutingRequested;
  const schoolWideLaunchRequestObserved = !!environmentInput.schoolWideLaunchRequested;
  const backendFreezeRequestObserved = !!environmentInput.backendFreezeRequested;
  const liveAiRequestObserved = !!environmentInput.liveAiRequested;
  const liveConnectorRequestObserved = !!environmentInput.liveConnectorRequested;
  const liveNotificationRequestObserved = !!environmentInput.liveNotificationRequested;
  const productionDeploymentRequestObserved = !!environmentInput.productionDeploymentRequested;

  const rawPrivateDataFieldObserved = events.some(e => {
    if (!e.safeReasonCodes) return false;
    return e.safeReasonCodes.some(code => TASK033_FORBIDDEN_OUTPUT_FIELDS.some(f => code.toLowerCase().includes(f.toLowerCase())));
  });

  const answerArtifactFieldObserved = events.some(e => {
    if (!e.safeReasonCodes) return false;
    return e.safeReasonCodes.some(code =>
      code.toLowerCase().includes('answer') ||
      code.toLowerCase().includes('solution') ||
      code.toLowerCase().includes('marking')
    );
  });

  const driftSignals: Array<{ key: string; value: boolean }> = [
    { key: 'rollout', value: rolloutRequestObserved },
    { key: 'cohort_expansion', value: cohortExpansionRequestObserved },
    { key: 'traffic_routing', value: trafficRoutingRequestObserved },
    { key: 'school_wide_launch', value: schoolWideLaunchRequestObserved },
    { key: 'backend_freeze', value: backendFreezeRequestObserved },
    { key: 'live_ai', value: liveAiRequestObserved },
    { key: 'live_connector', value: liveConnectorRequestObserved },
    { key: 'live_notification', value: liveNotificationRequestObserved },
    { key: 'production_deployment', value: productionDeploymentRequestObserved },
    { key: 'raw_private_data', value: rawPrivateDataFieldObserved },
    { key: 'answer_artifact', value: answerArtifactFieldObserved },
  ];

  for (const signal of driftSignals) {
    if (signal.value) {
      driftCodes.push(`drift_${signal.key}`);
      blockingIssues.push(`drift_detected: ${signal.key}`);
    }
  }

  const driftDetected = driftCodes.length > 0;
  const recommendation = driftDetected
    ? `Drift detected: ${driftCodes.join(', ')}. Recommend pause, rollback, or kill switch activation.`
    : 'No drift detected. Controlled canary observation constraints are holding.';

  const result: Task033DriftDetectionResult = {
    ok: !driftDetected,
    driftDetected,
    driftCodes,
    rolloutRequestObserved,
    cohortExpansionRequestObserved,
    trafficRoutingRequestObserved,
    schoolWideLaunchRequestObserved,
    backendFreezeRequestObserved,
    liveAiRequestObserved,
    liveConnectorRequestObserved,
    liveNotificationRequestObserved,
    productionDeploymentRequestObserved,
    rawPrivateDataFieldObserved,
    answerArtifactFieldObserved,
    recommendation,
    blockingIssues,
  };

  await task033Repository.recordDriftDetection(result);
  return result;
}
