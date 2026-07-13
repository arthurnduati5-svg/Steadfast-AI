import * as fs from 'fs';
import * as path from 'path';
import {
  Task036Task035DependencyProof,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

const rootDir = path.resolve(__dirname, '..', '..', '..');

function readJsonFile(relativePath: string): Record<string, unknown> | null {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

function readTextFile(relativePath: string): string | null {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

function readLogFile(relativePath: string): string | null {
  return readTextFile(relativePath);
}

export async function loadAndValidateTask035Proof(): Promise<Task036Task035DependencyProof> {
  const blockingIssues: string[] = [];

  const reportData = readJsonFile('docs/ops/task-035/task-035-school-wide-readiness-report.json');
  const handoffContent = readTextFile('docs/ops/task-035/TASK_035_HANDOFF.md');
  const verSummaryData = readJsonFile('logs/task-035/task-035-verification-summary.json');
  const resultData = readJsonFile('logs/task-035/school-wide-readiness-result.json');

  const reportExists = reportData !== null;
  const handoffExists = handoffContent !== null;
  const jsonReportExists = reportData !== null;

  if (!reportExists) blockingIssues.push('task035_report_not_found');
  if (!handoffExists) blockingIssues.push('task035_handoff_not_found');

  const reportTaskId = reportData?.taskId as string | undefined;
  const reportDecision = reportData?.finalDecision as string | undefined;
  const reportSafeToStartTask036 = reportData?.safeToStartTask036 as boolean | undefined;
  const reportBlockingIssues = reportData?.blockingIssues as string[] | undefined;
  const resultSafeToStartTask036 = resultData?.safeToStartTask036 as boolean | undefined;
  const resultFinalDecision = resultData?.finalLaunchDecision as string | undefined;
  const verOverallExitCode = verSummaryData?.OverallExitCode as number | undefined;

  const handoffContainsPass = handoffContent?.includes('TASK_035_PASS_SAFE_TO_START_TASK_036') ?? false;
  const handoffContainsFail = handoffContent?.includes('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036') ?? false;

  const verdictIsAcceptedReadyYes = reportSafeToStartTask036 === true;
  const safeToStartTask036 = reportSafeToStartTask036 === true;
  const safeToStartTask040 = false;
  const remainingBlockersEmpty = Array.isArray(reportBlockingIssues) && reportBlockingIssues.length === 0;

  const focusedTestsPassed = false;
  const continuityTestsPassed = false;
  const routeContractsPassed = false;
  const roleSecurityTestsPassed = false;
  const noSafetyTestsPassed = false;
  const verificationScriptPassed = verOverallExitCode === 0;
  const task020To034RegressionPassed = false;
  const phase3RegressionPassed = false;
  const fullBackendSuitePassed = false;
  const typeScriptPassed = false;
  const backendBuildPassed = false;
  const prismaValidatePassed = false;
  const prismaGeneratePassed = false;

  const reportStr = reportData ? JSON.stringify(reportData) : '';
  const noTask036InsideTask035 = !reportStr.includes('task036') && !reportStr.includes('task_036') && !reportStr.includes('TASK_036');
  const noTask040InsideTask035 = !reportStr.includes('task040') && !reportStr.includes('task_040') && !reportStr.includes('TASK_040');
  const noFrontendUiInsideTask035 = !reportStr.includes('frontend') && !reportStr.includes('dashboard') && !reportStr.includes('browser launch');
  const noLiveLaunchInsideTask035 = !reportStr.includes('live launch') && !reportStr.includes('live_launch') && !reportStr.includes('LIVE_LAUNCH');

  if (!reportExists) blockingIssues.push('task035_report_not_found');
  if (!handoffExists) blockingIssues.push('task035_handoff_not_found');
  if (!jsonReportExists) blockingIssues.push('task035_json_report_not_found');
  if (reportTaskId !== '035') blockingIssues.push('task035_report_wrong_task_id');
  if (!verdictIsAcceptedReadyYes) blockingIssues.push('task035_safeToStartTask036_not_true');
  if (!remainingBlockersEmpty) blockingIssues.push('task035_blockingIssues_not_empty');
  if (handoffExists && !handoffContainsPass && !handoffContainsFail) blockingIssues.push('task035_handoff_inconsistent');
  if (!noTask036InsideTask035) blockingIssues.push('task035_contains_task036');
  if (!noTask040InsideTask035) blockingIssues.push('task035_contains_task040');
  if (!noFrontendUiInsideTask035) blockingIssues.push('task035_contains_frontend_ui');
  if (!noLiveLaunchInsideTask035) blockingIssues.push('task035_contains_live_launch');

  const ok = blockingIssues.length === 0;

  const proof: Task036Task035DependencyProof = {
    ok,
    handoffExists,
    reportExists,
    jsonReportExists,
    verdictIsAcceptedReadyYes,
    safeToStartTask036,
    safeToStartTask040,
    remainingBlockersEmpty,
    focusedTestsPassed,
    continuityTestsPassed,
    routeContractsPassed,
    roleSecurityTestsPassed,
    noSafetyTestsPassed,
    verificationScriptPassed,
    task020To034RegressionPassed,
    phase3RegressionPassed,
    fullBackendSuitePassed,
    typeScriptPassed,
    backendBuildPassed,
    prismaValidatePassed,
    prismaGeneratePassed,
    noTask036InsideTask035,
    noTask040InsideTask035,
    noFrontendUiInsideTask035,
    noLiveLaunchInsideTask035,
    blockingIssues,
    loadedAt: createTask036SafeTimestamp(),
  };

  task036Repository.saveTask035DependencyProof(proof);
  return proof;
}

export function loadTask035Proof(): Task036Task035DependencyProof {
  const proof = task036Repository.getTask035DependencyProof();
  if (proof) return proof;
  const blockingIssues: string[] = ['proof_not_loaded'];
  return {
    ok: false,
    handoffExists: false,
    reportExists: false,
    jsonReportExists: false,
    verdictIsAcceptedReadyYes: false,
    safeToStartTask036: false,
    safeToStartTask040: false,
    remainingBlockersEmpty: false,
    focusedTestsPassed: false,
    continuityTestsPassed: false,
    routeContractsPassed: false,
    roleSecurityTestsPassed: false,
    noSafetyTestsPassed: false,
    verificationScriptPassed: false,
    task020To034RegressionPassed: false,
    phase3RegressionPassed: false,
    fullBackendSuitePassed: false,
    typeScriptPassed: false,
    backendBuildPassed: false,
    prismaValidatePassed: false,
    prismaGeneratePassed: false,
    noTask036InsideTask035: false,
    noTask040InsideTask035: false,
    noFrontendUiInsideTask035: false,
    noLiveLaunchInsideTask035: false,
    blockingIssues,
    loadedAt: createTask036SafeTimestamp(),
  };
}
