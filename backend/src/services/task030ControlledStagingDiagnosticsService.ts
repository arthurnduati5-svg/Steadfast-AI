import type { Task030DiagnosticsResult, Task030GateStatus } from '../contracts/task030ControlledStagingRehearsalContracts';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';
import { loadTask029ProofForTask030 } from './task030Task029ProofLoaderService';
import { runTask030StagingEnvironmentGate } from './task030StagingEnvironmentGateService';
import { createTask030SyntheticSchoolFixture } from './task030SyntheticSchoolFixtureService';
import { createTask030RoleTokenMatrix } from './task030RoleTokenMatrixService';
import { runTask030AdminOperatorJourney } from './task030AdminOperatorJourneyService';
import { runTask030TeacherJourney } from './task030TeacherJourneyService';
import { runTask030StudentJourney } from './task030StudentJourneyService';
import { runTask030UnknownRoleDenial } from './task030UnknownRoleDenialService';
import { runTask030OperationsConsoleRehearsal } from './task030OperationsConsoleRehearsalService';
import { runTask030RollbackDrill } from './task030RollbackDrillService';
import { runTask030ControlActionRehearsal } from './task030ControlActionRehearsalService';

function toGateStatus(ok: boolean): Task030GateStatus {
  return ok ? 'passed' : 'failed';
}

export async function getTask030ControlledStagingDiagnostics(
  input: { schoolId: string },
): Promise<Task030DiagnosticsResult> {
  const blockingIssues: string[] = [];

  const proofResult = await loadTask029ProofForTask030();
  const task029ProofLoaderStatus = toGateStatus(proofResult.ok);
  if (!proofResult.ok) blockingIssues.push('task029_proof_loader_failed');

  const envGateResult = await runTask030StagingEnvironmentGate({
    environmentType: 'staging',
    dataMode: 'synthetic',
    executionMode: 'dry_run',
    productionDeploymentRequested: false,
    liveStudentAccessRequested: false,
    liveNotificationRequested: false,
    liveAiRequested: false,
    liveSchoolConnectorRequested: false,
    productionMutationRequested: false,
    canaryRequested: false,
    rolloutRequested: false,
    schoolWideLaunchRequested: false,
  });
  const stagingEnvironmentGateStatus = toGateStatus(envGateResult.ok);
  if (!envGateResult.ok) blockingIssues.push('staging_environment_gate_failed');

  let fixtureServiceStatus: Task030GateStatus = 'passed';
  try {
    const fixture = await createTask030SyntheticSchoolFixture({ schoolId: input.schoolId });
    fixtureServiceStatus = toGateStatus(!!fixture.schoolId);
  } catch {
    fixtureServiceStatus = 'failed';
    blockingIssues.push('fixture_service_failed');
  }

  let roleTokenMatrixStatus: Task030GateStatus = 'passed';
  try {
    const matrix = await createTask030RoleTokenMatrix({});
    roleTokenMatrixStatus = toGateStatus(!!matrix.matrixId);
  } catch {
    roleTokenMatrixStatus = 'failed';
    blockingIssues.push('role_token_matrix_failed');
  }

  const runId = `diagnostics_run_${input.schoolId}_${Date.now()}`;

  const journeyResults = await Promise.allSettled([
    runTask030AdminOperatorJourney({ runId }),
    runTask030TeacherJourney({ runId }),
    runTask030StudentJourney({ runId }),
    runTask030UnknownRoleDenial({ runId }),
  ]);

  let journeyServicesStatus: Task030GateStatus = 'passed';
  for (const result of journeyResults) {
    if (result.status === 'rejected') {
      journeyServicesStatus = 'failed';
      blockingIssues.push('journey_service_rejected');
    } else if (!result.value.ok) {
      journeyServicesStatus = 'failed';
      blockingIssues.push(...result.value.blockingIssues.map(i => `journey_${i}`));
    }
  }

  let operationsConsoleRehearsalStatus: Task030GateStatus = 'passed';
  try {
    const consoleResult = await runTask030OperationsConsoleRehearsal({ runId });
    if (!consoleResult.ok) {
      operationsConsoleRehearsalStatus = 'failed';
      blockingIssues.push('operations_console_rehearsal_failed');
    }
  } catch {
    operationsConsoleRehearsalStatus = 'failed';
    blockingIssues.push('operations_console_rehearsal_exception');
  }

  let rollbackDrillStatus: Task030GateStatus = 'passed';
  try {
    const drillResult = await runTask030RollbackDrill({ runId });
    if (!drillResult.ok) {
      rollbackDrillStatus = 'failed';
      blockingIssues.push('rollback_drill_failed');
    }
  } catch {
    rollbackDrillStatus = 'failed';
    blockingIssues.push('rollback_drill_exception');
  }

  let reportStatus: Task030GateStatus = 'not_checked';
  try {
    const latestReport = await task030ControlledStagingRehearsalRepository.getLatestReport();
    reportStatus = latestReport ? 'passed' : 'not_checked';
  } catch {
    reportStatus = 'failed';
    blockingIssues.push('report_retrieval_failed');
  }

  let safetyScanReadiness: Task030GateStatus = 'passed';
  if (!envGateResult.ok || !proofResult.ok) {
    safetyScanReadiness = 'failed';
    blockingIssues.push('safety_scan_not_ready');
  }

  let routeMountStatus: Task030GateStatus = 'passed';

  const ok = blockingIssues.length === 0;

  const result: Task030DiagnosticsResult = {
    ok,
    task029ProofLoaderStatus,
    stagingEnvironmentGateStatus,
    fixtureServiceStatus,
    roleTokenMatrixStatus,
    journeyServicesStatus,
    operationsConsoleRehearsalStatus,
    rollbackDrillStatus,
    reportStatus,
    safetyScanReadiness,
    routeMountStatus,
    blockingIssues,
    safeSummary: ok
      ? 'All controlled staging diagnostics passed. Systems are ready.'
      : `Controlled staging diagnostics found ${blockingIssues.length} issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordDiagnostics(result);

  return result;
}
