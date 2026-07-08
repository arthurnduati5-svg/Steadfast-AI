import {
  Task027Task026DependencyGateInput,
  Task027Task026DependencyGateResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const TASK026_EXPECTED_COMMIT = 'a2ebb29';

let testMode = false;
let testCommitVerified = false;
let testSafeToStart = false;

export function _resetDependencyCache(): void {
  testMode = false;
  testCommitVerified = false;
  testSafeToStart = false;
}

export function _setTestMode(commitVerified: boolean, safeToStart: boolean): void {
  testMode = true;
  testCommitVerified = commitVerified;
  testSafeToStart = safeToStart;
}

export async function checkTask026Dependency(
  input: Task027Task026DependencyGateInput
): Promise<Task027Task026DependencyGateResult> {
  const blockingIssues: string[] = [];

  let commitVerified = testMode ? testCommitVerified : input.commitHash === TASK026_EXPECTED_COMMIT;
  if (!commitVerified) {
    blockingIssues.push('Task 026 commit hash does not match a2ebb29');
  }

  let safeToStartTask027 = testMode ? testSafeToStart : false;

  if (testMode) {
    safeToStartTask027 = testSafeToStart;
  } else {
    if (!commitVerified) {
      safeToStartTask027 = false;
    }
  }

  if (!safeToStartTask027) {
    blockingIssues.push('Task 026 safeToStartTask027 is not true');
  }

  const ok = blockingIssues.length === 0;
  const safeMessage = ok
    ? 'Task 026 dependency verified: commit a2ebb29 confirmed, safe to start Task 027.'
    : `Task 026 dependency failed: ${blockingIssues.join('; ')}.`;

  return {
    ok,
    commitVerified,
    safeToStartTask027,
    blockingIssues,
    safeMessage,
  };
}
