import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Task033Task032DependencyProof } from '../contracts/task033ControlledCanaryObservationContracts';
import { TASK033_REQUIRED_DEPENDENCY_COMMITS, TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS, TASK033_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

const PROJECT_ROOT = findProjectRoot();
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-032/task-032-controlled-canary-report.json');
const OPS_REPORT_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-032/task-032-controlled-canary-report.json');

function findProjectRoot(): string {
  let current = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(current, 'docs', 'ops', 'task-032'))) {
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

function checkGitCommitExists(commit: string): boolean {
  try {
    execSync(`git cat-file -e ${commit}`, { stdio: 'pipe', cwd: PROJECT_ROOT });
    return true;
  } catch {
    return false;
  }
}

function checkCorrectiveCommitForbiddenFiles(commit: string): boolean {
  try {
    const filesChanged = execSync(`git show --name-only --format="" ${commit}`, {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: PROJECT_ROOT,
    }).toString().trim().split('\n').filter(Boolean);

    for (const file of filesChanged) {
      for (const pattern of TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS) {
        if (file.toLowerCase().includes(pattern.toLowerCase())) return false;
      }
      for (const pattern of TASK033_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
        if (file.toLowerCase().includes(pattern.toLowerCase())) return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

export async function loadTask032ProofForTask033(): Promise<Task033Task032DependencyProof> {
  const blockingIssues: string[] = [];

  const requiredCommit = TASK033_REQUIRED_DEPENDENCY_COMMITS[0];
  const commitFound = checkGitCommitExists(requiredCommit);

  if (!commitFound) {
    blockingIssues.push(`required_commit_not_found: ${requiredCommit}`);
  }

  const report = loadJsonFile(REPORT_PATH);
  const task032ReportFound = report !== null;

  if (!task032ReportFound) {
    blockingIssues.push('task032_report_not_found');
  }

  const opsReport = loadJsonFile(OPS_REPORT_PATH);
  const task032OpsReportFound = opsReport !== null;

  const safeToStartTask033 = report?.safeToStartTask033 === true;
  const safeToStartTask034 = report?.safeToStartTask034 === true;
  const safeToStartTask035 = report?.safeToStartTask035 === true;
  const safeToStartTask040 = report?.safeToStartTask040 === true;

  if (!safeToStartTask033) blockingIssues.push('safe_to_start_task_033_not_true');
  if (safeToStartTask034) blockingIssues.push('safe_to_start_task_034_must_be_false');
  if (safeToStartTask035) blockingIssues.push('safe_to_start_task_035_must_be_false');
  if (safeToStartTask040) blockingIssues.push('safe_to_start_task_040_must_be_false');

  const verdict = String(report?.verdict || report?.finalDecision || '');
  const verdictOk = verdict === 'TASK_032_PASS_SAFE_TO_START_TASK_033' || verdict === 'ACCEPTED_READY_YES';
  if (!verdictOk) blockingIssues.push(`verdict_not_acceptable: ${verdict}`);

  const remainingBlockers = Array.isArray(report?.remainingBlockers)
    ? report!.remainingBlockers as string[]
    : [];
  if (remainingBlockers.length > 0) {
    blockingIssues.push('remaining_blockers_not_empty');
  }

  const task032FocusedTestsPassed = report?.task032FocusedTestsPassed === true;
  const task020To032RegressionPassed = report?.task020To032RegressionPassed === true;
  const phase3RegressionPassed = report?.phase3RegressionPassed === true;
  const fullBackendSuitePassed = report?.fullBackendSuitePassed === true;
  const backendBuildPassed = report?.backendBuildPassed === true;
  const backendTypecheckPassed = report?.backendTypecheckPassed === true;
  const prismaValidatePassed = report?.prismaValidatePassed === true;
  const prismaGeneratePassed = report?.prismaGeneratePassed === true;
  const task032VerificationScriptPassed = report?.task032VerificationScriptPassed === true;

  const privacyScanPassed = report?.privacyScanPassed === true;
  const noProductionMutationScanPassed = report?.noProductionMutationScanPassed === true;
  const noLiveConnectorAiScanPassed = report?.noLiveConnectorAiScanPassed === true;
  const noLiveNotificationScanPassed = report?.noLiveNotificationScanPassed === true;
  const noFrontendUiScanPassed = report?.noFrontendUiScanPassed === true;
  const noTask033ToTask040ScanPassed = report?.noTask033ToTask040ScanPassed === true;
  const noFalsePassScanPassed = report?.noFalsePassScanPassed === true;

  if (!privacyScanPassed) blockingIssues.push('privacy_scan_failed');
  if (!noProductionMutationScanPassed) blockingIssues.push('production_mutation_scan_failed');
  if (!noLiveConnectorAiScanPassed) blockingIssues.push('live_connector_ai_scan_failed');
  if (!noLiveNotificationScanPassed) blockingIssues.push('live_notification_scan_failed');
  if (!noFrontendUiScanPassed) blockingIssues.push('frontend_ui_scan_failed');
  if (!noTask033ToTask040ScanPassed) blockingIssues.push('future_task_scan_failed');
  if (!noFalsePassScanPassed) blockingIssues.push('false_pass_scan_failed');

  let correctiveCommitNoForbidden = true;
  if (commitFound) {
    correctiveCommitNoForbidden = checkCorrectiveCommitForbiddenFiles(requiredCommit);
    if (!correctiveCommitNoForbidden) blockingIssues.push('corrective_commit_contains_forbidden_files');
  }

  const proof: Task033Task032DependencyProof = {
    ok: blockingIssues.length === 0,
    commitFound,
    commitHash: requiredCommit,
    task032ReportFound,
    task032OpsReportFound,
    verdict,
    safeToStartTask033,
    safeToStartTask034,
    safeToStartTask035,
    safeToStartTask040,
    task032FocusedTestsPassed,
    task020To032RegressionPassed,
    phase3RegressionPassed,
    fullBackendSuitePassed,
    backendBuildPassed,
    backendTypecheckPassed,
    prismaValidatePassed,
    prismaGeneratePassed,
    task032VerificationScriptPassed,
    privacyScanPassed,
    noProductionMutationScanPassed,
    noLiveConnectorAiScanPassed,
    noLiveNotificationScanPassed,
    noFrontendUiScanPassed,
    noTask033ToTask040ScanPassed,
    noFalsePassScanPassed,
    correctiveCommitNoForbidden,
    remainingBlockers,
    blockingIssues,
  };

  await task033Repository.recordTask032DependencyProof(proof);
  return proof;
}
