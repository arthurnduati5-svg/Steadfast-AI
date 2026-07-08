import * as fs from 'fs';
import * as path from 'path';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

const REPORT_PATH = path.resolve(__dirname, '../../docs/ops/task-027/task-027-pilot-expansion-report.json');

export interface Task027ProofResult {
  safeToExecuteExpansion: boolean;
  blockingIssues: string[];
  proofSummary: Record<string, unknown>;
}

export async function loadTask027Proof(): Promise<Task027ProofResult> {
  const blockingIssues: string[] = [];

  if (!fs.existsSync(REPORT_PATH)) {
    blockingIssues.push('task027_proof_invalid');
    return {
      safeToExecuteExpansion: false,
      blockingIssues,
      proofSummary: { reportFound: false, path: REPORT_PATH },
    };
  }

  let report: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    report = JSON.parse(raw);
  } catch {
    blockingIssues.push('task027_proof_invalid');
    return {
      safeToExecuteExpansion: false,
      blockingIssues,
      proofSummary: { reportFound: true, parseError: true },
    };
  }

  if (report.taskId !== '027') {
    blockingIssues.push('task027_proof_invalid');
  }

  if (report.safeToStartTask028 !== true) {
    blockingIssues.push('task027_proof_invalid');
  }

  if (report.finalDecision !== 'TASK_027_PASS_SAFE_TO_START_TASK_028') {
    blockingIssues.push('task027_proof_invalid');
  }

  const rawBlocking = report.blockingIssues;
  const blockingArr = Array.isArray(rawBlocking) ? rawBlocking : [];
  if (blockingArr.length > 0) {
    blockingIssues.push('task027_proof_invalid');
  }

  const acceptanceScenario = report.acceptanceScenario as Record<string, unknown> | undefined;
  if (!acceptanceScenario || acceptanceScenario.scenarioRun !== true) {
    blockingIssues.push('task027_proof_invalid');
  } else if (acceptanceScenario.safeToStartTask028 !== true) {
    blockingIssues.push('task027_proof_invalid');
  }

  const safeToExecuteExpansion = blockingIssues.length === 0;
  const proofSummary: Record<string, unknown> = {
    reportFound: true,
    taskId: report.taskId,
    safeToStartTask028: report.safeToStartTask028,
    finalDecision: report.finalDecision,
    blockingIssues: blockingArr.length,
    acceptanceScenarioRun: acceptanceScenario?.scenarioRun ?? false,
    acceptanceScenarioSafe: acceptanceScenario?.safeToStartTask028 ?? false,
    safeToExecuteExpansion,
  };

  return { safeToExecuteExpansion, blockingIssues, proofSummary };
}
