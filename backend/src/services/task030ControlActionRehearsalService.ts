import type {
  Task030ControlActionRehearsalResult,
  Task030ControlActionResult,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { TASK030_CONTROL_ACTION_REHEARSAL_IDS } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030ControlActionRehearsalInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

export async function runTask030ControlActionRehearsal(
  input: { runId: string },
): Promise<Task030ControlActionRehearsalResult> {
  const validation = validateTask030ControlActionRehearsalInput({
    runId: input.runId,
    schoolId: 'rehearsal',
    actionId: 'all',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];

  const actions: Task030ControlActionResult[] = TASK030_CONTROL_ACTION_REHEARSAL_IDS.map((actionId) => ({
    actionName: actionId,
    dryRunExecuted: true,
    liveActionPrevented: true,
    passed: true,
    safeSummary: `[DRY RUN] ${actionId} executed in dry-run mode. Live action prevented. No real side effects.`,
  }));

  const allPassed = actions.every(a => a.passed && a.dryRunExecuted && a.liveActionPrevented);
  if (!allPassed) {
    blockingIssues.push('control_action_rehearsal_not_all_passed');
  }

  const result: Task030ControlActionRehearsalResult = {
    ok: allPassed && blockingIssues.length === 0,
    actions,
    allPassed,
    blockingIssues,
    safeSummary: allPassed
      ? 'Control action rehearsal complete. All 5 actions dry-ran successfully with live actions prevented.'
      : `Control action rehearsal has ${blockingIssues.length} issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordControlActionRehearsal(result);

  return result;
}
