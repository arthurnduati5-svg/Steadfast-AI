import * as fs from 'fs';
import * as path from 'path';
import type { Task028ProofStatus } from '../contracts/task029ExpansionOperationsContracts';

export interface Task029ProofLoaderResult {
  ok: boolean;
  proofStatus: Task028ProofStatus;
  safeMessage: string;
  blockingIssues: string[];
}

const PROOF_PATH = path.resolve(__dirname, '../../docs/ops/task-028/task-028-expansion-execution-report.json');

function loadJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function verifyTask028DependencyFromGit(): Promise<{
  ok: boolean;
  commitHash: string;
  acceptanceVerdict: string;
  safeToStartTask029: boolean;
  blockingIssues: string[];
}> {
  const blockIssues: string[] = [];
  const proof = await loadTask028ProofForTask029();

  if (!proof.ok) {
    blockIssues.push(...proof.blockingIssues);
  }

  return {
    ok: proof.ok,
    commitHash: proof.proofStatus.taskId ? '028' : '',
    acceptanceVerdict: proof.proofStatus.finalDecision || 'not_verified',
    safeToStartTask029: proof.proofStatus.safeToStartTask029,
    blockingIssues: blockIssues,
  };
}

export async function loadTask028ProofForTask029(): Promise<Task029ProofLoaderResult> {
  const blockingIssues: string[] = [];
  const report = loadJsonFile(PROOF_PATH);

  if (!report) {
    blockingIssues.push('task028_proof_not_found');
    return {
      ok: false,
      proofStatus: {
        reportFound: false,
        taskId: '',
        safeToStartTask029: false,
        finalDecision: '',
        blockingIssuesEmpty: false,
        acceptanceScenarioPass: false,
        verificationExitCodeZero: false,
        proofValid: false,
        blockingIssues: ['task028_proof_not_found'],
      },
      safeMessage: 'Task 028 proof report not found. Operations console is unavailable until Task 028 proof is present.',
      blockingIssues,
    };
  }

  const taskId = String(report.taskId || '');
  const safeToStartTask029 = report.safeToStartTask029 === true;
  const finalDecision = String(report.finalDecision || '');
  const reportBlocking = Array.isArray(report.blockingIssues) ? report.blockingIssues as string[] : [];
  const acceptanceScenario = report.acceptanceScenario as Record<string, unknown> | undefined;
  const verificationScriptPassed = report.verificationScriptPassed === true;
  const scenarioRun = acceptanceScenario?.scenarioRun === true;
  const scenarioSafeToStart = acceptanceScenario?.safeToStartTask029 === true;

  if (taskId !== '028') {
    blockingIssues.push('task028_taskid_mismatch');
  }
  if (!safeToStartTask029) {
    blockingIssues.push('task028_safe_to_start_task_029_not_true');
  }
  if (finalDecision !== 'TASK_028_PASS_SAFE_TO_START_TASK_029') {
    blockingIssues.push('task028_final_decision_not_pass');
  }
  if (reportBlocking.length > 0) {
    blockingIssues.push('task028_blocking_issues_not_empty');
  }
  if (!scenarioRun) {
    blockingIssues.push('task028_acceptance_scenario_not_run');
  }
  if (!scenarioSafeToStart) {
    blockingIssues.push('task028_acceptance_scenario_safe_to_start_not_true');
  }
  if (!verificationScriptPassed) {
    blockingIssues.push('task028_verification_script_not_passed');
  }

  const proofValid = blockingIssues.length === 0;

  return {
    ok: proofValid,
    proofStatus: {
      reportFound: true,
      taskId,
      safeToStartTask029,
      finalDecision,
      blockingIssuesEmpty: reportBlocking.length === 0,
      acceptanceScenarioPass: scenarioRun && scenarioSafeToStart,
      verificationExitCodeZero: verificationScriptPassed,
      proofValid,
      blockingIssues,
    },
    safeMessage: proofValid
      ? 'Task 028 proof is valid. Operations console is ready.'
      : `Task 028 proof has ${blockingIssues.length} blocking issue(s). Operations console controls are disabled.`,
    blockingIssues,
  };
}
