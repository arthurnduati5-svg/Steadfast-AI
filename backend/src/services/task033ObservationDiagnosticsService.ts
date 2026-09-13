import type { Task033DiagnosticsResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { createTask033SafeTimestamp } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function runTask033Diagnostics(sessionId: string): Promise<Task033DiagnosticsResult> {
  const blockingIssues: string[] = [];
  const diagnosticDetails: Record<string, unknown> = {};

  const proof = await task033Repository.getLatestTask032DependencyProof();
  const dependencyProofLoaded = proof?.ok === true;
  diagnosticDetails.dependencyProof = proof ? { ok: proof.ok, commitFound: proof.commitFound } : { ok: false };

  const envGates = await task033Repository.listEnvironmentGates();
  const environmentGatePassed = envGates.length > 0 && envGates.every(g => g.passed);
  diagnosticDetails.environmentGates = { count: envGates.length, allPassed: environmentGatePassed };

  const session = await task033Repository.getSession(sessionId);
  const stateMachineConsistent = session !== null && session.status !== 'blocked';
  diagnosticDetails.session = session ? { status: session.status, stage: session.observationStage } : null;

  const events = await task033Repository.listEvents(sessionId);
  const eventIntakeWorking = events.length > 0 || session !== null;
  diagnosticDetails.events = { count: events.length };

  const aggregate = await task033Repository.getAggregate(sessionId);
  const aggregationWorking = aggregate !== null;
  diagnosticDetails.aggregate = aggregate ? { totalObservedEvents: aggregate.totalObservedEvents } : null;

  const healthResults = await task033Repository.listHealthObservations();
  const healthObservationWorking = healthResults.length > 0;
  diagnosticDetails.healthObservations = { count: healthResults.length };

  const guardResults = await task033Repository.listRuntimeGuardObservations();
  const runtimeGuardObservationWorking = guardResults.length > 0;
  diagnosticDetails.runtimeGuardObservations = { count: guardResults.length };

  const privacyResults = await task033Repository.listPrivacyObservations();
  const privacyObservationWorking = privacyResults.length > 0;
  diagnosticDetails.privacyObservations = { count: privacyResults.length };

  const governanceResults = await task033Repository.listContentGovernanceObservations();
  const contentGovernanceObservationWorking = governanceResults.length > 0;
  diagnosticDetails.contentGovernanceObservations = { count: governanceResults.length };

  const socraticResults = await task033Repository.listSocraticIntegrityObservations();
  const socraticObservationWorking = socraticResults.length > 0;
  diagnosticDetails.socraticObservations = { count: socraticResults.length };

  const deenResults = await task033Repository.listDeenBoundaryObservations();
  const deenObservationWorking = deenResults.length > 0;
  diagnosticDetails.deenObservations = { count: deenResults.length };

  const identityResults = await task033Repository.listSchoolIdentityObservations();
  const schoolIdentityObservationWorking = identityResults.length > 0;
  diagnosticDetails.schoolIdentityObservations = { count: identityResults.length };

  const crossSchoolResults = await task033Repository.listCrossSchoolDenialObservations();
  const crossSchoolDenialObservationWorking = crossSchoolResults.length > 0;
  diagnosticDetails.crossSchoolDenialObservations = { count: crossSchoolResults.length };

  const incidentResults = await task033Repository.listIncidentSignalObservations();
  const incidentSignalObservationWorking = incidentResults.length > 0;
  diagnosticDetails.incidentSignalObservations = { count: incidentResults.length };

  const rollbackResults = await task033Repository.listRollbackReadinessObservations();
  const rollbackReadinessObservationWorking = rollbackResults.length > 0;
  diagnosticDetails.rollbackReadinessObservations = { count: rollbackResults.length };

  const driftResults = await task033Repository.listDriftDetections();
  const driftDetectionWorking = driftResults.length > 0;
  diagnosticDetails.driftDetections = { count: driftResults.length };

  const safeReadModel = await task033Repository.getSafeReadModel(sessionId);
  const safeReadModelWorking = safeReadModel !== null;
  diagnosticDetails.safeReadModel = safeReadModel ? { status: safeReadModel.status } : null;

  const evidenceEvents = await task033Repository.listEvidenceEvents(sessionId);
  const evidenceLedgerWorking = evidenceEvents.length > 0;
  diagnosticDetails.evidenceLedger = { count: evidenceEvents.length };

  const reports = await task033Repository.listReports();
  const reportGenerationWorking = reports.length > 0;
  diagnosticDetails.reports = { count: reports.length };

  if (!environmentGatePassed) blockingIssues.push('environment_gate_failed');
  if (!eventIntakeWorking) blockingIssues.push('event_intake_not_working');
  if (!aggregationWorking) blockingIssues.push('aggregation_not_working');

  const result: Task033DiagnosticsResult = {
    ok: blockingIssues.length === 0,
    sessionId,
    dependencyProofLoaded,
    environmentGatePassed,
    stateMachineConsistent,
    eventIntakeWorking,
    aggregationWorking,
    healthObservationWorking,
    runtimeGuardObservationWorking,
    privacyObservationWorking,
    contentGovernanceObservationWorking,
    socraticObservationWorking,
    deenObservationWorking,
    schoolIdentityObservationWorking,
    crossSchoolDenialObservationWorking,
    incidentSignalObservationWorking,
    rollbackReadinessObservationWorking,
    driftDetectionWorking,
    safeReadModelWorking,
    evidenceLedgerWorking,
    reportGenerationWorking,
    blockingIssues,
    diagnosticDetails,
  };

  await task033Repository.recordDiagnostics(result);
  return result;
}
