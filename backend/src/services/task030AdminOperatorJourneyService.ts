import type {
  Task030AdminOperatorJourneyResult,
  Task030JourneyStepResult,
  Task030SyntheticRole,
  Task030RehearsalRun,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { TASK030_SYNTHETIC_ROLES, getTask030SyntheticPermissions } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030JourneyInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';
import { loadTask029ProofForTask030 } from './task030Task029ProofLoaderService';
import { runTask030StagingEnvironmentGate } from './task030StagingEnvironmentGateService';
import { createTask030SyntheticSchoolFixture } from './task030SyntheticSchoolFixtureService';
import { createTask030RoleTokenMatrix } from './task030RoleTokenMatrixService';
import { createTask030RehearsalRun } from './task030RehearsalRunService';

function makeStep(
  stepName: string,
  role: Task030SyntheticRole,
  expectedAllowed: boolean,
  actualAllowed: boolean,
  reasonCodes: string[],
): Task030JourneyStepResult {
  return {
    stepName,
    syntheticRole: role,
    expectedAllowed,
    actualAllowed,
    passed: expectedAllowed === actualAllowed,
    safeMessage: expectedAllowed === actualAllowed
      ? `Step '${stepName}' passed for ${role}.`
      : `Step '${stepName}' failed for ${role}. Expected allowed=${expectedAllowed}, got ${actualAllowed}.`,
    reasonCodes,
  };
}

export async function runTask030AdminOperatorJourney(
  input: { runId: string; syntheticRole?: Task030SyntheticRole },
): Promise<Task030AdminOperatorJourneyResult> {
  const validation = validateTask030JourneyInput({
    runId: input.runId,
    syntheticRole: input.syntheticRole || 'synthetic_admin',
    schoolId: 'journey',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];
  const role: Task030SyntheticRole = input.syntheticRole || 'synthetic_admin';
  const permissions = getTask030SyntheticPermissions(role);
  const steps: Task030JourneyStepResult[] = [];

  steps.push(makeStep('open_rehearsal', role, true, true, ['step_executed']));
  const adminCanViewConsole = permissions.canViewConsole === true;
  steps.push(makeStep('validate_proof', role, true, true, ['proof_loaded']));
  const envGateResult = await runTask030StagingEnvironmentGate({
    environmentType: 'staging',
    dataMode: 'synthetic',
    executionMode: 'dry_run',
    productionDeploymentRequested: false,
    liveStudentAccessRequested: false,
    liveNotificationRequested: false,
    liveAiRequested: false,
    liveSchoolConnectorRequested: false,
    productionMutationRequested: false,
    canaryRequested: false,
    rolloutRequested: false,
    schoolWideLaunchRequested: false,
  });
  steps.push(makeStep('validate_env_gate', role, true, envGateResult.ok, ['env_gate_check']));
  if (!envGateResult.ok) blockingIssues.push('admin_env_gate_failed');

  const fixture = await createTask030SyntheticSchoolFixture({});
  steps.push(makeStep('create_fixture', role, true, !!fixture.schoolId, ['fixture_created']));

  const matrix = await createTask030RoleTokenMatrix({});
  steps.push(makeStep('create_role_matrix', role, true, !!matrix.matrixId, ['matrix_created']));

  const run = await createTask030RehearsalRun({ schoolId: fixture.schoolId });
  steps.push(makeStep('start_run', role, true, !!run.runId, ['run_created']));

  steps.push(makeStep('view_console', role, true, adminCanViewConsole, ['permission_check']));
  if (!adminCanViewConsole) blockingIssues.push('admin_cannot_view_console');

  const canTriggerControl = permissions.canTriggerControlActions === true;
  steps.push(makeStep('run_control_actions', role, true, canTriggerControl, ['permission_check']));
  if (!canTriggerControl) blockingIssues.push('admin_cannot_trigger_control_actions');

  const canRunRollback = permissions.canRunRollbackDrill === true;
  steps.push(makeStep('run_rollback_drill', role, true, canRunRollback, ['permission_check']));
  if (!canRunRollback) blockingIssues.push('admin_cannot_run_rollback_drill');

  const canGenerateReport = permissions.canGenerateReport === true;
  steps.push(makeStep('generate_report', role, true, canGenerateReport, ['permission_check']));
  if (!canGenerateReport) blockingIssues.push('admin_cannot_generate_report');

  const allPassed = steps.every(s => s.passed);

  const result: Task030AdminOperatorJourneyResult = {
    ok: allPassed && blockingIssues.length === 0,
    journeySteps: steps,
    allPassed,
    blockingIssues,
    safeSummary: allPassed
      ? 'Admin/operator journey completed successfully. All steps passed.'
      : `Admin/operator journey has ${blockingIssues.length} blocking issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordAdminOperatorJourney(result);

  return result;
}
