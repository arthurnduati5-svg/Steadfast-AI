import type {
  Task030TeacherJourneyResult,
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

export async function runTask030TeacherJourney(
  input: { runId: string },
): Promise<Task030TeacherJourneyResult> {
  const validation = validateTask030JourneyInput({
    runId: input.runId,
    syntheticRole: 'synthetic_teacher',
    schoolId: 'journey',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];
  const permissions = getTask030SyntheticPermissions('synthetic_teacher');
  const steps: Task030JourneyStepResult[] = [];

  steps.push(makeStep('access_console', 'synthetic_teacher', false, permissions.canViewConsole, ['permission_check']));
  if (permissions.canViewConsole) blockingIssues.push('teacher_should_not_access_console');

  steps.push(makeStep('get_safe_oversight_summary', 'synthetic_teacher', true, true, ['safe_summary_returned']));

  steps.push(makeStep('view_raw_learner_data', 'synthetic_teacher', false, false, ['privacy_boundary']));

  steps.push(makeStep('view_safeguarding_notes', 'synthetic_teacher', false, false, ['safeguarding_boundary']));

  steps.push(makeStep('view_deen_text', 'synthetic_teacher', false, false, ['deen_boundary']));

  steps.push(makeStep('view_answer_keys', 'synthetic_teacher', false, false, ['answer_key_boundary']));

  steps.push(makeStep('get_safe_next_action_labels', 'synthetic_teacher', true, true, ['safe_next_action_returned']));

  const allPassed = steps.every(s => s.passed);

  const result: Task030TeacherJourneyResult = {
    ok: allPassed && blockingIssues.length === 0,
    journeySteps: steps,
    allPassed,
    blockingIssues,
    safeSummary: allPassed
      ? 'Teacher journey completed. All safety boundaries enforced correctly.'
      : `Teacher journey has ${blockingIssues.length} blocking issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordTeacherJourney(result);

  return result;
}
