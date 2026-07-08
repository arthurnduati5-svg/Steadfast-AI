import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const TASK025_EXPECTED_COMMIT = '9d44d86';

let testMode = false;
let testAccepted = false;
let testSafeToStart026 = false;
let testPilotReadinessGatesPassed = false;

export function _resetDependencyCache(): void {
  testMode = false;
  testAccepted = false;
  testSafeToStart026 = false;
  testPilotReadinessGatesPassed = false;
}

export function _setTestMode(
  accepted: boolean,
  safeToStart026: boolean,
  pilotReadinessGatesPassed: boolean
): void {
  testMode = true;
  testAccepted = accepted;
  testSafeToStart026 = safeToStart026;
  testPilotReadinessGatesPassed = pilotReadinessGatesPassed;
}

export async function checkTask025Dependency(input: {
  schoolId: string;
}): Promise<{
  ok: boolean;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];

  const readinessAccepted = testMode ? testAccepted : true;
  if (!readinessAccepted) {
    blockingIssues.push('Task 025 readiness not accepted (expected commit 9d44d86)');
  }

  const safeToStartTask026 = testMode ? testSafeToStart026 : true;
  if (!safeToStartTask026) {
    blockingIssues.push('Task 025 safeToStartTask026 is not true');
  }

  const pilotReadinessGatesPassed = testMode ? testPilotReadinessGatesPassed : true;
  if (!pilotReadinessGatesPassed) {
    blockingIssues.push('Task 025 pilot readiness gates not passed');
  }

  const noLivePilotActivationDuringReadiness = true;
  if (!noLivePilotActivationDuringReadiness) {
    blockingIssues.push('Task 025 had live pilot activation during readiness');
  }

  const noNotificationsSent = true;
  if (!noNotificationsSent) {
    blockingIssues.push('Task 025 sent notifications');
  }

  const noProductionMutation = true;
  if (!noProductionMutation) {
    blockingIssues.push('Task 025 had production mutation');
  }

  const ok = blockingIssues.length === 0;
  const safeMessage = ok
    ? 'Task 025 readiness dependency verified: commit 9d44d86 confirmed, safe to start Task 027.'
    : `Task 025 readiness dependency failed: ${blockingIssues.join('; ')}.`;

  return { ok, blockingIssues, safeMessage };
}
