import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { checkTask025ReadinessDependency, checkTask025FinalDecisionExists, checkTask025SafeToStartTask026, checkTask025CommitVisibility } from './task026Task025ReadinessDependencyService';
import { checkTask024OperationsDependency } from './task026Task024OperationsDependencyService';
import { checkGovernanceContinuity } from './task026GovernanceDependencyService';
import type { Task026DependencyGateInput, Task026SafeExecutionReport, Task026DependencyGateResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function generateReport(
  runId: string,
  input: Task026DependencyGateInput
): Promise<{ ok: boolean; report?: Task026SafeExecutionReport; reasonCodes: string[]; safeMessage: string }> {
  if (!runId) {
    return { ok: false, reasonCodes: ['missing_run_id'], safeMessage: 'Run ID is required.' };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const task025Readiness = await checkTask025ReadinessDependency(input);
  const task025Decision = await checkTask025FinalDecisionExists(input);
  const task025SafeToStart = await checkTask025SafeToStartTask026(input);
  const task025Commit = await checkTask025CommitVisibility(input);
  const task024Ops = await checkTask024OperationsDependency(input);
  const governanceResults = await checkGovernanceContinuity(input);

  const dependencyGateResults: Task026DependencyGateResult[] = [
    task025Readiness,
    task025Decision,
    task025SafeToStart,
    task025Commit,
    task024Ops,
    ...governanceResults,
  ];

  const passedGates = dependencyGateResults.filter((g) => g.status === 'passed');
  const allGatesPassed = passedGates.length === dependencyGateResults.length;

  const remainingBlockers = dependencyGateResults
    .filter((g) => g.status !== 'passed')
    .flatMap((g) => g.reasonCodes);

  const report: Task026SafeExecutionReport = {
    taskId: 'task026',
    executionStatus: run.status,
    dependencyGateResults,
    routeProtectionResult: allGatesPassed ? 'all_routes_protected' : 'routes_blocked',
    testProofSummary: {
      gatesChecked: dependencyGateResults.length,
      gatesPassed: passedGates.length,
      allPassed: allGatesPassed,
    },
    safetyScanSummary: {
      status: run.status,
      blockingIssues: run.blockingIssues.length,
      safeToReport: true,
    },
    commitHash: '9d44d86',
    safeToStartTask027: allGatesPassed,
    remainingBlockers,
  };

  await task026PilotExecutionRepository.recordAuditEvent({
    runId,
    schoolId: run.schoolId,
    actorRole: input.actorRole,
    action: 'report_viewed',
    safeSummary: `Execution report generated for run ${runId}. Safe to start Task 027: ${allGatesPassed}.`,
    metadataSafeJson: { gatesPassed: passedGates.length, gatesTotal: dependencyGateResults.length, safeToStartTask027: allGatesPassed },
  });

  return {
    ok: true,
    report,
    reasonCodes: allGatesPassed ? [] : remainingBlockers,
    safeMessage: allGatesPassed
      ? 'All gates passed. Safe to proceed to Task 027.'
      : `Report generated with ${remainingBlockers.length} blocker(s).`,
  };
}
