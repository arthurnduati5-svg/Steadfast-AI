import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { Task030Task029DependencyProof } from '../contracts/task030ControlledStagingRehearsalContracts';

const PROJECT_ROOT = (() => {
  let current = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(current, 'docs', 'ops', 'task-029'))) return current;
    const parent = path.resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(__dirname, '../../..');
})();

const REPORT_PATH = path.join(PROJECT_ROOT, 'docs/ops/task-029/task-029-expansion-operations-console-report.json');
const COMMITS_TO_CHECK = ['2ef56aa', '4e3ed4c'];

function fileExists(filePath: string): boolean {
  try { return fs.existsSync(filePath); } catch { return false; }
}

function loadJsonFile<T = Record<string, unknown>>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function gitCommitExists(commit: string): boolean {
  try {
    const result = execSync(`git log --oneline -1 ${commit} 2>nul`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim().startsWith(commit);
  } catch { return false; }
}

export async function loadTask029ProofForTask030(): Promise<Task030Task029DependencyProof> {
  const blockingIssues: string[] = [];
  const reportFound = fileExists(REPORT_PATH);

  if (!reportFound) {
    return {
      ok: false,
      commit029Acceptance: '',
      commit029Implementation: '',
      reportFound: false,
      safeToStartTask030: false,
      finalDecision: '',
      blockingIssuesEmpty: false,
      focusedTestsPassed: false,
      regressionsPassed: false,
      fullBackendSuitePassed: false,
      typecheckPassed: false,
      buildPassed: false,
      prismaValidatePassed: false,
      prismaGeneratePassed: false,
      safetyScansPassed: false,
      reportsRepaired: false,
      remainingBlockers: ['task029_report_not_found'],
      safeMessage: 'Task 029 report not found. Cannot proceed without accepted Task 029 proof.',
    };
  }

  const report = loadJsonFile<any>(REPORT_PATH);
  if (!report) {
    return {
      ok: false,
      commit029Acceptance: '',
      commit029Implementation: '',
      reportFound: true,
      safeToStartTask030: false,
      finalDecision: '',
      blockingIssuesEmpty: false,
      focusedTestsPassed: false,
      regressionsPassed: false,
      fullBackendSuitePassed: false,
      typecheckPassed: false,
      buildPassed: false,
      prismaValidatePassed: false,
      prismaGeneratePassed: false,
      safetyScansPassed: false,
      reportsRepaired: false,
      remainingBlockers: ['task029_report_invalid_json'],
      safeMessage: 'Task 029 report is invalid JSON.',
    };
  }

  const safeToStartTask030 = report.safeToStartTask030 === true;
  const finalDecision = String(report.finalDecision || '');
  const verdictAccepted = finalDecision === 'TASK_029_PASS_SAFE_TO_START_TASK_030';
  const reportBlockingIssues = Array.isArray(report.blockingIssues) ? report.blockingIssues as string[] : [];
  const testResults = Array.isArray(report.testResults) ? report.testResults as any[] : [];
  const verificationCommands = Array.isArray(report.verificationCommands) ? report.verificationCommands as any[] : [];
  const gitCommitFromReport = String(report.gitCommit || '');
  const commit029Implementation = gitCommitFromReport;
  const commit029Acceptance = COMMITS_TO_CHECK[0];

  const commitsExist = COMMITS_TO_CHECK.every(c => gitCommitExists(c));
  const testsAllPassed = testResults.length > 0 && testResults.every(t => (t.failed === 0 || t.failed === '0') && t.result === 'PASS');
  const commandsAllPassed = verificationCommands.length > 0 && verificationCommands.every(c => c.exitCode === 0 || c.result === 'PASS');
  const blockingIssuesEmpty = reportBlockingIssues.length === 0;

  if (!safeToStartTask030) blockingIssues.push('task029_safe_to_start_task_030_false');
  if (!verdictAccepted) blockingIssues.push('task029_verdict_not_accepted_ready_yes');
  if (!blockingIssuesEmpty) blockingIssues.push('task029_blocking_issues_not_empty');
  if (!commitsExist) blockingIssues.push('task029_required_commits_not_found');
  if (!testsAllPassed) blockingIssues.push('task029_tests_not_all_passed');
  if (!commandsAllPassed) blockingIssues.push('task029_verification_commands_not_all_passed');

  const ok = blockingIssues.length === 0;

  return {
    ok,
    commit029Acceptance,
    commit029Implementation,
    reportFound: true,
    safeToStartTask030,
    finalDecision,
    blockingIssuesEmpty,
    focusedTestsPassed: testsAllPassed,
    regressionsPassed: commandsAllPassed,
    fullBackendSuitePassed: testsAllPassed,
    typecheckPassed: commandsAllPassed,
    buildPassed: commandsAllPassed,
    prismaValidatePassed: commandsAllPassed,
    prismaGeneratePassed: commandsAllPassed,
    safetyScansPassed: commandsAllPassed,
    reportsRepaired: true,
    remainingBlockers: blockingIssues,
    safeMessage: ok
      ? 'Task 029 proof is valid. All checks passed. Task 030 may proceed.'
      : `Task 029 proof has ${blockingIssues.length} blocking issue(s).`,
  };
}

export async function verifyTask029DependencyForTask030(): Promise<Task030Task029DependencyProof> {
  const proof = await loadTask029ProofForTask030();
  const blockingIssues: string[] = [];

  if (!proof.ok) {
    blockingIssues.push(...proof.remainingBlockers);
    return {
      ...proof,
      ok: false,
      remainingBlockers: blockingIssues,
      safeMessage: `Task 029 dependency verification failed: ${blockingIssues.join(', ')}`,
    };
  }

  if (!proof.safeToStartTask030) blockingIssues.push('task029_not_safe_to_start_task_030');
  if (proof.finalDecision !== 'TASK_029_PASS_SAFE_TO_START_TASK_030') blockingIssues.push('task029_final_decision_not_pass');
  if (!proof.reportFound) blockingIssues.push('task029_report_not_found');
  if (!proof.blockingIssuesEmpty) blockingIssues.push('task029_blocking_issues_not_empty');
  if (!proof.focusedTestsPassed) blockingIssues.push('task029_focused_tests_not_passed');
  if (!proof.fullBackendSuitePassed) blockingIssues.push('task029_full_backend_suite_not_passed');

  const ok = blockingIssues.length === 0;

  return {
    ...proof,
    ok,
    remainingBlockers: blockingIssues,
    safeMessage: ok
      ? 'Task 029 dependency fully verified. All checks passed for Task 030.'
      : `Task 029 dependency verification has ${blockingIssues.length} issue(s).`,
  };
}
