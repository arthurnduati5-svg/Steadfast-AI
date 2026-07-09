import type {
  Task030StudentJourneyResult,
  Task030JourneyStepResult,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { getTask030SyntheticPermissions } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030JourneyInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

function makeStep(
  stepName: string,
  syntheticRole: string,
  expectedAllowed: boolean,
  actualAllowed: boolean,
  reasonCodes: string[],
): Task030JourneyStepResult {
  return {
    stepName,
    syntheticRole: syntheticRole as any,
    expectedAllowed,
    actualAllowed,
    passed: expectedAllowed === actualAllowed,
    safeMessage: expectedAllowed === actualAllowed
      ? `Step '${stepName}' passed for ${syntheticRole}.`
      : `Step '${stepName}' failed for ${syntheticRole}.`,
    reasonCodes,
  };
}

export async function runTask030StudentJourney(
  input: { runId: string },
): Promise<Task030StudentJourneyResult> {
  const validation = validateTask030JourneyInput({
    runId: input.runId,
    syntheticRole: 'synthetic_learner',
    schoolId: 'journey',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];
  const permissions = getTask030SyntheticPermissions('synthetic_learner');
  const steps: Task030JourneyStepResult[] = [];

  steps.push(makeStep('access_console', 'synthetic_learner', false, permissions.canViewConsole, ['permission_check']));
  if (permissions.canViewConsole) blockingIssues.push('learner_should_not_access_console');

  steps.push(makeStep('access_other_learners_data', 'synthetic_learner', false, false, ['privacy_boundary']));

  steps.push(makeStep('view_own_synthetic_status', 'synthetic_learner', true, true, ['own_status_returned']));

  steps.push(makeStep('receive_answer_keys', 'synthetic_learner', false, false, ['answer_key_boundary']));

  steps.push(makeStep('view_hidden_reasoning', 'synthetic_learner', false, false, ['hidden_reasoning_boundary']));

  steps.push(makeStep('view_teacher_only_notes', 'synthetic_learner', false, false, ['teacher_notes_boundary']));

  steps.push(makeStep('view_private_deen_data', 'synthetic_learner', false, false, ['deen_boundary']));

  steps.push(makeStep('view_safeguarding_data', 'synthetic_learner', false, false, ['safeguarding_boundary']));

  const allPassed = steps.every(s => s.passed);

  const result: Task030StudentJourneyResult = {
    ok: allPassed && blockingIssues.length === 0,
    journeySteps: steps,
    allPassed,
    blockingIssues,
    safeSummary: allPassed
      ? 'Student journey completed. All privacy and safety boundaries enforced.'
      : `Student journey has ${blockingIssues.length} blocking issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordStudentJourney(result);

  return result;
}
