import * as fs from 'fs';
import * as path from 'path';

export interface Task031Task030ProofResult {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask031: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  stagingRehearsalResultFound: boolean;
  stagingRehearsalSafeToStartTask031: boolean;
  handoffConsistent: boolean;
  proofLoaded: boolean;
  blockingIssues: string[];
}

function findProjectRoot(): string {
  let current = __dirname;
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(current, 'docs', 'ops', 'task-030')) &&
      fs.existsSync(path.join(current, 'backend', 'src'))
    ) {
      return current;
    }
    const parent = path.resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(__dirname, '../../..');
}

const PROJECT_ROOT = findProjectRoot();
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-030/task-030-staging-rehearsal-report.json');
const HANDOFF_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-030/TASK_030_HANDOFF.md');
const VERIFICATION_SUMMARY_PATH = path.join(PROJECT_ROOT, 'logs/task-030/task-030-verification-summary.json');
const STAGING_REHEARSAL_RESULT_PATH = path.join(PROJECT_ROOT, 'logs/task-030/staging-rehearsal-result.json');
const STANDALONE_LOG_PATH = path.join(PROJECT_ROOT, 'logs/task-030/verify-task030-standalone.log');

function loadJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export async function loadTask030ProofForTask031(): Promise<Task031Task030ProofResult> {
  const blockingIssues: string[] = [];

  const report = loadJsonFile(REPORT_PATH);
  const verificationSummary = loadJsonFile(VERIFICATION_SUMMARY_PATH);
  const rehearsalResult = loadJsonFile(STAGING_REHEARSAL_RESULT_PATH);
  const handoffExists = fileExists(HANDOFF_PATH);
  const standaloneLogExists = fileExists(STANDALONE_LOG_PATH);

  if (!report) {
    blockingIssues.push('task030_report_not_found');
    return {
      ok: false, reportFound: false, taskId: '', safeToStartTask031: false,
      finalDecision: '', blockingIssuesEmpty: false, verificationExitCodeZero: false,
      stagingRehearsalResultFound: false, stagingRehearsalSafeToStartTask031: false,
      handoffConsistent: false, proofLoaded: false, blockingIssues,
    };
  }

  const taskId = String(report.taskId || '');
  const safeToStartTask031 = report.safeToStartTask031 === true;
  const finalDecision = String(report.finalDecision || '');
  const reportBlockingIssues = Array.isArray(report.blockingIssues) ? report.blockingIssues as string[] : [];
  const blockingIssuesEmpty = reportBlockingIssues.length === 0;

  const verificationCommands = Array.isArray(report.verificationCommands) ? report.verificationCommands as Record<string, unknown>[] : [];
  const verificationExitCodeZero = verificationCommands.every((vc: Record<string, unknown>) => vc.exitCode === 0 || vc.result === 'PASS');

  const rehearsalScenarioRun = rehearsalResult?.scenarioRun === true;
  const rehearsalSafeToStart = rehearsalResult?.safeToStartTask031 === true;

  const verificationOverallExit = verificationSummary?.OverallExitCode === 0;

  if (taskId !== '030') blockingIssues.push('task030_taskid_mismatch');
  if (!safeToStartTask031) blockingIssues.push('task030_safe_to_start_task_031_not_true');
  if (finalDecision !== 'TASK_030_PASS_SAFE_TO_START_TASK_031') blockingIssues.push('task030_final_decision_not_pass');
  if (!blockingIssuesEmpty) blockingIssues.push('task030_blocking_issues_not_empty');
  if (!verificationExitCodeZero) blockingIssues.push('task030_verification_exit_code_not_zero');
  if (!handoffExists) blockingIssues.push('task030_handoff_not_found');
  if (!standaloneLogExists) blockingIssues.push('task030_standalone_log_not_found');
  if (!verificationOverallExit) blockingIssues.push('task030_verification_summary_not_pass');
  if (!rehearsalScenarioRun) blockingIssues.push('task030_staging_rehearsal_not_run');
  if (!rehearsalSafeToStart) blockingIssues.push('task030_staging_rehearsal_safe_to_start_false');

  const proofLoaded = blockingIssues.length === 0;

  return {
    ok: proofLoaded, reportFound: true, taskId, safeToStartTask031, finalDecision,
    blockingIssuesEmpty, verificationExitCodeZero,
    stagingRehearsalResultFound: rehearsalScenarioRun,
    stagingRehearsalSafeToStartTask031: rehearsalSafeToStart,
    handoffConsistent: handoffExists,
    proofLoaded, blockingIssues,
  };
}
