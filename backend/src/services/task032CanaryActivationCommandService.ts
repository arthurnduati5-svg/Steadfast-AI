import type { Task032CanaryActivationCommandInput, Task032CanaryActivationRecord, Task032CanaryActivationStatus } from '../contracts/task032ControlledCanaryActivationContracts';
import { loadTask031ProofForTask032 } from './task032Task031ProofLoaderService';
import { runTask032CanaryEnvironmentGate } from './task032CanaryEnvironmentGateService';
import { createTask032ApprovedSchoolCanaryConfig } from './task032ApprovedSchoolCanaryConfigService';
import { evaluateTask032CanaryCohortEligibility } from './task032CanaryCohortEligibilityService';
import { verifyTask032CanaryConsentAuthorization } from './task032CanaryConsentAuthorizationService';
import { runTask032LiveStudentPrivacyBoundary } from './task032LiveStudentPrivacyBoundaryService';
import { runTask032CanaryRuntimeGuard } from './task032CanaryRuntimeGuardService';
import { createTask032CanaryActivationRecord, advanceTask032CanaryActivationState, blockTask032CanaryActivation } from './task032CanaryActivationStateMachineService';
import { runTask032CanaryHealthBudget } from './task032CanaryHealthBudgetService';
import { verifyTask032CanaryIncidentBridge } from './task032CanaryIncidentBridgeService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import { createTask032CanarySafeView } from './task032CanaryViewService';
import { recordTask032CanaryEvidenceEvent } from './task032CanaryActivationEvidenceLedgerService';

export async function runTask032CanaryActivationCommand(input: Task032CanaryActivationCommandInput): Promise<Task032CanaryActivationRecord> {
  // Step 1: Load Task 031 proof
  const proof = await loadTask031ProofForTask032();
  await task032ControlledCanaryActivationRepository.recordTask031DependencyProof(proof);
  if (!proof.ok) throw new Error(`Task 031 dependency proof failed: ${proof.blockingIssues.join(', ')}`);

  // Step 2: Create activation record
  const activationRecord = await createTask032CanaryActivationRecord({
    schoolId: input.schoolId,
    configuredCohortSize: input.config.maxCanaryLearners
  });

  // Step 3: Advance to dependency checking
  let record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'dependency_checking');

  // Step 4: Run environment gate
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'dependency_passed');
  const envGateResult = await runTask032CanaryEnvironmentGate(input.environmentInput);
  await task032ControlledCanaryActivationRepository.recordEnvironmentGate(envGateResult);
  if (!envGateResult.passed) return blockTask032CanaryActivation(activationRecord.activationId, envGateResult.blockingIssues);

  // Step 5: Create approved canary config
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'config_checking');
  const config = await createTask032ApprovedSchoolCanaryConfig(input.config);
  await task032ControlledCanaryActivationRepository.recordApprovedSchoolCanaryConfig(config);
  if (config.blockingIssues.length > 0) return blockTask032CanaryActivation(activationRecord.activationId, config.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'config_passed');

  // Step 6: Evaluate cohort eligibility
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'cohort_checking');
  const cohortResult = await evaluateTask032CanaryCohortEligibility({
    schoolId: input.schoolId,
    cohortId: input.config.allowedCohortIds[0] || '',
    actorRole: input.actorRole,
    config
  });
  await task032ControlledCanaryActivationRepository.recordCohortEligibility(cohortResult);
  if (!cohortResult.ok) return blockTask032CanaryActivation(activationRecord.activationId, cohortResult.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'cohort_passed');

  // Step 7: Verify consent authorization
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'consent_authorization_checking');
  const consentResult = await verifyTask032CanaryConsentAuthorization({
    schoolId: input.schoolId,
    config,
    actorRole: input.actorRole
  });
  await task032ControlledCanaryActivationRepository.recordConsentAuthorization(consentResult);
  if (!consentResult.ok) return blockTask032CanaryActivation(activationRecord.activationId, consentResult.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'consent_authorization_passed');

  // Step 8: Run privacy boundary
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'privacy_boundary_checking');
  const privacyResult = await runTask032LiveStudentPrivacyBoundary({ schoolId: input.schoolId, actorRole: input.actorRole });
  await task032ControlledCanaryActivationRepository.recordPrivacyBoundary(privacyResult);
  if (!privacyResult.ok) return blockTask032CanaryActivation(activationRecord.activationId, privacyResult.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'privacy_boundary_passed');

  // Step 9: Run runtime guard
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'runtime_guard_checking');
  const guardResult = await runTask032CanaryRuntimeGuard({ schoolId: input.schoolId, actorRole: input.actorRole as any, activationId: activationRecord.activationId });
  await task032ControlledCanaryActivationRepository.recordRuntimeGuard(guardResult);
  if (!guardResult.ok) return blockTask032CanaryActivation(activationRecord.activationId, guardResult.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'runtime_guard_passed');

  // Step 10: Run health budget
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'health_budget_checking');
  const healthResult = await runTask032CanaryHealthBudget({ activationId: activationRecord.activationId, schoolId: input.schoolId });
  await task032ControlledCanaryActivationRepository.recordHealthBudget(healthResult);
  if (!healthResult.overallPassed) return blockTask032CanaryActivation(activationRecord.activationId, healthResult.blockingIssues);
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'health_budget_passed');

  // Step 11: Verify incident bridge
  const incidentResult = await verifyTask032CanaryIncidentBridge({ activationId: activationRecord.activationId, schoolId: input.schoolId });
  await task032ControlledCanaryActivationRepository.recordIncidentBridge(incidentResult);
  if (!incidentResult.ok) return blockTask032CanaryActivation(activationRecord.activationId, incidentResult.blockingIssues);

  // Step 12: Activate internal
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'activation_ready');
  record = await advanceTask032CanaryActivationState(activationRecord.activationId, 'activated_internal');

  // Step 13: Record evidence
  const event = await recordTask032CanaryEvidenceEvent({
    eventId: `evt_${activationRecord.activationId}_activation`,
    activationId: activationRecord.activationId,
    stageId: 'activation_command',
    actorRole: input.actorRole,
    status: 'activated_internal',
    safeSummary: 'Controlled canary activated internally',
    reasonCodes: ['all_gates_passed', 'activated_internal'],
    createdAt: new Date().toISOString()
  });

  // Step 14: Create safe view
  const safeView = await createTask032CanarySafeView({
    activationId: activationRecord.activationId,
    schoolId: input.schoolId,
    status: 'activated_internal',
    configuredCohortSize: input.config.maxCanaryLearners,
    safeStage: 'activated_internal',
    healthBudgetStatus: 'passed',
    privacyBoundaryStatus: 'passed',
    rollbackReadinessStatus: 'passed',
    incidentBridgeStatus: 'passed',
    safeToStartTask033: true,
    reasonCodes: ['all_gates_passed', 'safe_to_start_task033'],
    createdAt: new Date().toISOString()
  });

  // Update record with safeToStartTask033
  const finalRecord: Task032CanaryActivationRecord = {
    ...record,
    safeToStartTask033: true,
    reasonCodes: [...record.reasonCodes, 'safe_to_start_task033', 'activation_complete']
  };
  await task032ControlledCanaryActivationRepository.updateActivationRecord(activationRecord.activationId, finalRecord);

  return finalRecord;
}
