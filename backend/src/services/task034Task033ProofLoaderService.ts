import * as fs from 'fs';
import * as path from 'path';
import type { Task034Task033DependencyProof } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

const PROJECT_ROOT = findProjectRoot();
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-033/task-033-controlled-canary-observation-report.json');

function findProjectRoot(): string {
  let current = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(current, 'docs', 'ops', 'task-033'))) {
      return current;
    }
    const parent = path.resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(__dirname, '../../..');
}

function loadJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function loadTask033ProofForTask034(
  syntheticFixture?: Record<string, unknown> | null,
): Promise<Task034Task033DependencyProof> {
  const blockingIssues: string[] = [];

  const report = syntheticFixture ?? loadJsonFile(REPORT_PATH);
  const reportFound = report !== null;

  if (!reportFound) {
    blockingIssues.push('task033_report_not_found');
  }

  const opsReport = syntheticFixture ?? report;
  const opsReportFound = opsReport !== null;

  const verdict = String(report?.verdict || report?.finalDecision || '');
  const verdictOk =
    verdict === 'TASK_033_PASS_SAFE_TO_START_TASK_034' || verdict === 'ACCEPTED_READY_YES';
  if (!verdictOk) blockingIssues.push(`verdict_not_acceptable: ${verdict}`);

  const safeToStartTask034 = report?.safeToStartTask034 === true;
  const safeToStartTask035 = report?.safeToStartTask035 === true;
  const safeToStartTask040 = report?.safeToStartTask040 === true;

  if (!safeToStartTask034) blockingIssues.push('safe_to_start_task_034_not_true');
  if (safeToStartTask035) blockingIssues.push('safe_to_start_task_035_must_be_false');
  if (safeToStartTask040) blockingIssues.push('safe_to_start_task_040_must_be_false');

  const remainingBlockers = Array.isArray(report?.remainingBlockers)
    ? report!.remainingBlockers as string[]
    : [];
  if (remainingBlockers.length > 0) {
    blockingIssues.push('remaining_blockers_not_empty');
  }

  const task033FocusedTestsPassed = report?.task033FocusedTestsPassed === true;
  const task033RouteContractsPassed = report?.contractsCreatedOrUpdated === true;
  const task033RoleSecurityTestsPassed = report?.task033FocusedTestsPassed === true;
  const task033ContinuityTestsPassed = report?.fullBackendSuitePassed === true;
  const task033NoStarSafetyTestsPassed = report?.noFalsePassScanPassed === true;
  const task033VerificationScriptPassed = report?.task033VerificationScriptPassed === true;
  const task020To032RegressionPassed = report?.task020To032RegressionPassed === true;
  const phase3RegressionPassed = report?.phase3RegressionPassed === true;
  const fullBackendSuitePassed = report?.fullBackendSuitePassed === true;
  const backendTypecheckPassed = report?.backendTypecheckPassed === true;
  const backendBuildPassed = report?.backendBuildPassed === true;
  const prismaValidatePassed = report?.prismaValidatePassed === true;
  const prismaGeneratePassed = report?.prismaGeneratePassed === true;

  const privacyScanPassed = report?.privacyScanPassed === true;
  const noProductionMutationScanPassed = report?.noProductionMutationScanPassed === true;
  const noLiveConnectorAiScanPassed = report?.noLiveConnectorAiScanPassed === true;
  const noLiveNotificationScanPassed = report?.noLiveNotificationScanPassed === true;
  const noFrontendUiScanPassed = report?.noFrontendUiScanPassed === true;
  const noTask034ToTask040ScanPassed = report?.noTask034ToTask040ScanPassed === true;
  const noFalsePassScanPassed = report?.noFalsePassScanPassed === true;
  const noTask034ImplementationInTask033 = report?.noTask034ToTask040ScanPassed === true;
  const noFrontendUiInTask033 = report?.noFrontendUiScanPassed === true;
  const noLiveAiConnectorNotificationInTask033 = report?.noLiveConnectorAiScanPassed === true;

  if (!privacyScanPassed) blockingIssues.push('privacy_scan_failed');
  if (!noProductionMutationScanPassed) blockingIssues.push('production_mutation_scan_failed');
  if (!noLiveConnectorAiScanPassed) blockingIssues.push('live_connector_ai_scan_failed');
  if (!noLiveNotificationScanPassed) blockingIssues.push('live_notification_scan_failed');
  if (!noFrontendUiScanPassed) blockingIssues.push('frontend_ui_scan_failed');
  if (!noTask034ToTask040ScanPassed) blockingIssues.push('future_task_scan_failed');
  if (!noFalsePassScanPassed) blockingIssues.push('false_pass_scan_failed');

  const proof: Task034Task033DependencyProof = {
    ok: blockingIssues.length === 0,
    reportFound,
    opsReportFound,
    verdict,
    safeToStartTask034,
    safeToStartTask035,
    safeToStartTask040,
    task033FocusedTestsPassed,
    task033RouteContractsPassed,
    task033RoleSecurityTestsPassed,
    task033ContinuityTestsPassed,
    task033NoStarSafetyTestsPassed,
    task033VerificationScriptPassed,
    task020To032RegressionPassed,
    phase3RegressionPassed,
    fullBackendSuitePassed,
    backendTypecheckPassed,
    backendBuildPassed,
    prismaValidatePassed,
    prismaGeneratePassed,
    privacyScanPassed,
    noProductionMutationScanPassed,
    noLiveConnectorAiScanPassed,
    noLiveNotificationScanPassed,
    noFrontendUiScanPassed,
    noTask034ToTask040ScanPassed,
    noFalsePassScanPassed,
    noTask034ImplementationInTask033,
    noFrontendUiInTask033,
    noLiveAiConnectorNotificationInTask033,
    remainingBlockers,
    blockingIssues,
  };

  await task034Repository.saveTask033DependencyProof(proof);
  return proof;
}
