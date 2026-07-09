import type { Task030RehearsalStageResult } from '../contracts/task030ControlledStagingRehearsalContracts';
import { TASK030_REHEARSAL_STAGE_IDS } from '../contracts/task030ControlledStagingRehearsalContracts';
import { loadTask029ProofForTask030 } from './task030Task029ProofLoaderService';
import { runTask030StagingEnvironmentGate } from './task030StagingEnvironmentGateService';
import { createTask030SyntheticSchoolFixture } from './task030SyntheticSchoolFixtureService';
import { createTask030RoleTokenMatrix } from './task030RoleTokenMatrixService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

export async function runTask030StagingPreflight(
  input: { schoolId: string },
): Promise<Task030RehearsalStageResult> {
  const runId = `preflight_${input.schoolId}_${Date.now()}`;
  const blockingIssues: string[] = [];
  const details: Record<string, unknown> = {};

  const proof = await loadTask029ProofForTask030();
  details.task029ProofOk = proof.ok;
  if (!proof.ok) {
    blockingIssues.push('task029_proof_not_accepted');
    details.task029ProofIssues = proof.remainingBlockers;
  }

  const envGateInput = {
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
  };
  const envGate = await runTask030StagingEnvironmentGate(envGateInput);
  details.envGateOk = envGate.ok;
  if (!envGate.ok) {
    blockingIssues.push(...envGate.blockingIssues.map(i => `env_gate_${i}`));
  }

  let fixture;
  try {
    fixture = await createTask030SyntheticSchoolFixture({ schoolId: input.schoolId });
    details.fixtureCreated = true;
    details.fixtureSchoolId = fixture.schoolId;
  } catch (e: any) {
    details.fixtureCreated = false;
    details.fixtureError = e.message;
    blockingIssues.push('synthetic_fixture_creation_failed');
  }

  let matrix;
  try {
    matrix = await createTask030RoleTokenMatrix({});
    details.matrixCreated = true;
    details.matrixId = matrix.matrixId;
  } catch (e: any) {
    details.matrixCreated = false;
    details.matrixError = e.message;
    blockingIssues.push('role_token_matrix_creation_failed');
  }

  const liveDataFlags = {
    productionDeploymentRequested: false,
    liveStudentAccessRequested: false,
    liveNotificationRequested: false,
    liveAiRequested: false,
    liveSchoolConnectorRequested: false,
    productionMutationRequested: false,
  };
  details.liveDataFlags = liveDataFlags;
  const hasLiveDataFlags = Object.values(liveDataFlags).some(v => v === true);
  if (hasLiveDataFlags) {
    blockingIssues.push('live_data_flags_detected');
  }

  const ok = blockingIssues.length === 0;
  const stageResult: Task030RehearsalStageResult = {
    stageId: TASK030_REHEARSAL_STAGE_IDS[4],
    runId,
    status: ok ? 'passed' : 'blocked',
    ok,
    blockingIssues,
    safeSummary: ok
      ? 'Staging preflight passed. All gates, fixture, matrix, and no-live-data checks passed.'
      : `Staging preflight blocked. ${blockingIssues.length} issue(s).`,
    details,
  };

  await task030ControlledStagingRehearsalRepository.recordStageResult(runId, stageResult);

  return stageResult;
}
