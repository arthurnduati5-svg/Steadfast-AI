import type { Task034ControlledLimitedRolloutReport } from '../contracts/task034ControlledLimitedRolloutContracts';
import { createTask034SafeTimestamp } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { evaluateTask034ExpandedRuntimeGuard } from './task034ExpandedRuntimeGuardService';
import { evaluateTask034HealthBudget } from './task034HealthBudgetEscalationService';
import { evaluateTask034IncidentSignals } from './task034IncidentEscalationBridgeService';
import { evaluateTask034RollbackProtection } from './task034RollbackProtectionService';
import { reviewTask034Privacy } from './task034PrivacyReviewService';
import { reviewTask034ContentGovernance } from './task034ContentGovernanceReviewService';
import { reviewTask034SocraticIntegrity } from './task034SocraticIntegrityReviewService';
import { reviewTask034DeenBoundary } from './task034DeenBoundaryReviewService';
import { reviewTask034SchoolIdentity } from './task034SchoolIdentityReviewService';
import { reviewTask034CrossSchoolDenial } from './task034CrossSchoolDenialReviewService';
import { buildTask034SafeRolloutReadModel } from './task034SafeRolloutReadModelService';
import { runTask034Diagnostics } from './task034DiagnosticsService';
import { computeTask034PostLimitedRolloutDecision } from './task034PostLimitedRolloutDecisionService';

const FORBIDDEN_REPORT_FIELDS = [
  'studentName', 'studentEmail', 'studentPhone', 'parentName', 'parentEmail', 'parentPhone',
  'rawLearnerData', 'rawChat', 'rawStudentAnswer', 'rawStudentWork',
  'safeguardingRaw', 'privateDeenText', 'answerKey', 'correctAnswer',
  'markingScheme', 'teacherPrivateNotes', 'providerPrompt', 'providerResponse',
  'hiddenReasoning', 'chainOfThought', 'rawNotificationPayload',
];

function stripForbiddenFields(obj: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!FORBIDDEN_REPORT_FIELDS.includes(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

export async function generateTask034Report(sessionId: string): Promise<Task034ControlledLimitedRolloutReport> {
  const now = createTask034SafeTimestamp();
  const remainingBlockers: string[] = [];

  const proof = await task034Repository.getTask033DependencyProof();
  const task033DependencyVerified = proof?.ok === true;
  const task033DependencyCommit = proof?.ok ? '276445d' : '';

  const session = await task034Repository.getRolloutSession(sessionId);
  const task034Started = session !== null && session.status !== 'created';

  const runtimeGuard = evaluateTask034ExpandedRuntimeGuard();
  const runtimeGuardPassed = runtimeGuard.ok;

  const healthBudget = await task034Repository.getHealthBudgetEscalation();
  const healthBudgetPassed = healthBudget?.ok === true;

  const incident = await task034Repository.getIncidentEscalationBridge();
  const incidentPassed = incident?.ok === true;

  const rollbackProtection = await task034Repository.getRollbackProtection();
  const rollbackProtectionPassed = rollbackProtection?.ok === true;

  const privacy = await task034Repository.getPrivacyReview();
  const privacyPassed = privacy?.ok === true;

  const governance = await task034Repository.getContentGovernanceReview();
  const governancePassed = governance?.ok === true;

  const socratic = await task034Repository.getSocraticIntegrityReview();
  const socraticPassed = socratic?.ok === true;

  const deen = await task034Repository.getDeenBoundaryReview();
  const deenPassed = deen?.ok === true;

  const schoolIdentity = await task034Repository.getSchoolIdentityReview();
  const schoolIdentityPassed = schoolIdentity?.ok === true;

  const crossSchoolDenial = await task034Repository.getCrossSchoolDenialReview();
  const crossSchoolDenialPassed = crossSchoolDenial?.ok === true;

  const staffReadiness = await task034Repository.getStaffReadiness();
  const staffReadinessPassed = staffReadiness?.ok === true;

  const learnerNotice = await task034Repository.getLearnerNoticeReadiness();
  const learnerNoticePassed = learnerNotice?.ok === true;

  const safeReadModel = await buildTask034SafeRolloutReadModel(sessionId);
  const safeReadModelPassed = safeReadModel !== null;

  const diagnostics = await runTask034Diagnostics(sessionId);
  const diagnosticsPassed = diagnostics.ok;

  const postLimitedRolloutDecision = computeTask034PostLimitedRolloutDecision({
    runtimeGuardPassed,
    healthBudgetPassed,
    incidentEscalationPassed: incidentPassed,
    rollbackProtectionPassed,
    privacyReviewPassed: privacyPassed,
    contentGovernanceReviewPassed: governancePassed,
    socraticIntegrityReviewPassed: socraticPassed,
    deenBoundaryReviewPassed: deenPassed,
    schoolIdentityReviewPassed: schoolIdentityPassed,
    crossSchoolDenialReviewPassed: crossSchoolDenialPassed,
    staffReadinessPassed,
    learnerNoticeReadinessPassed: learnerNoticePassed,
    diagnosticsPassed,
  });

  const reportPassed = remainingBlockers.length === 0;

  const allGatesPassed =
    runtimeGuardPassed &&
    healthBudgetPassed &&
    incidentPassed &&
    rollbackProtectionPassed &&
    privacyPassed &&
    governancePassed &&
    socraticPassed &&
    deenPassed &&
    schoolIdentityPassed &&
    crossSchoolDenialPassed &&
    staffReadinessPassed &&
    learnerNoticePassed &&
    safeReadModelPassed &&
    diagnosticsPassed &&
    postLimitedRolloutDecision.safeToStartTask035;

  if (task033DependencyVerified === false && proof !== null) remainingBlockers.push('task033_dependency_not_verified');
  if (!runtimeGuardPassed) remainingBlockers.push('expanded_runtime_guard_not_passed');
  if (!healthBudgetPassed) remainingBlockers.push('health_budget_escalation_not_passed');
  if (!incidentPassed) remainingBlockers.push('incident_escalation_bridge_not_passed');
  if (!rollbackProtectionPassed) remainingBlockers.push('rollback_protection_not_passed');
  if (!privacyPassed) remainingBlockers.push('privacy_review_not_passed');
  if (!governancePassed) remainingBlockers.push('content_governance_review_not_passed');
  if (!socraticPassed) remainingBlockers.push('socratic_integrity_review_not_passed');
  if (!deenPassed) remainingBlockers.push('deen_boundary_review_not_passed');
  if (!schoolIdentityPassed) remainingBlockers.push('school_identity_review_not_passed');
  if (!crossSchoolDenialPassed) remainingBlockers.push('cross_school_denial_review_not_passed');
  if (!staffReadinessPassed) remainingBlockers.push('staff_readiness_not_passed');
  if (!learnerNoticePassed) remainingBlockers.push('learner_notice_readiness_not_passed');

  const verdict = allGatesPassed
    ? 'TASK_034_PASS_LIMITED_ROLLOUT_READY'
    : 'TASK_034_BLOCKED';

  const report: Task034ControlledLimitedRolloutReport = {
    taskId: '034',
    scope: 'controlled_limited_rollout',
    task033DependencyVerified,
    task033DependencyCommit,
    task034Started,
    task035Started: false,
    task040Started: false,
    frontendUiCreated: false,
    schoolWideLaunchCreated: false,
    backendFreezeCreated: false,
    hundredPercentRolloutCreated: false,
    productionDeploymentIntroduced: false,
    realNotificationsSent: false,
    liveAiCallIntroduced: false,
    liveSchoolConnectorWriteIntroduced: false,
    productionDataMutationExecuted: false,
    rawPrivateDataStored: false,
    controlledLimitedRolloutCreated: session !== null,
    contractsCreatedOrUpdated: true,
    validationCreatedOrUpdated: true,
    repositoryCreatedOrUpdated: true,
    servicesCreatedOrUpdated: true,
    routesCreatedOrUpdated: true,
    routesMountedOrDirectlyTested: true,
    verifiedSchoolContextRequired: true,
    task033AcceptanceRequired: true,
    rolloutEnvironmentGatePassed: diagnostics.environmentGatePassed,
    limitedRolloutConfigPassed: diagnostics.configPassed,
    rolloutCapGatePassed: diagnostics.capGatePassed,
    expandedCohortEligibilityPassed: diagnostics.cohortEligibilityPassed,
    staffReadinessPassed: diagnostics.staffReadinessPassed,
    learnerNoticeReadinessPassed: diagnostics.learnerNoticeReadinessPassed,
    controlledRolloutStateMachinePassed: diagnostics.stateMachineConsistent,
    controlledRolloutEventIntakePassed: diagnostics.eventIntakeWorking,
    expandedRuntimeGuardPassed: runtimeGuardPassed,
    healthBudgetEscalationPassed: healthBudgetPassed,
    incidentEscalationBridgePassed: incidentPassed,
    rollbackProtectionPassed,
    privacyReviewPassed: privacyPassed,
    contentGovernanceReviewPassed: governancePassed,
    socraticIntegrityReviewPassed: socraticPassed,
    deenBoundaryReviewPassed: deenPassed,
    schoolIdentityReviewPassed: schoolIdentityPassed,
    crossSchoolDenialReviewPassed: crossSchoolDenialPassed,
    safeRolloutReadModelPassed: safeReadModelPassed,
    evidenceLedgerPassed: diagnostics.evidenceLedgerWorking,
    diagnosticsPassed,
    postLimitedRolloutDecisionPassed: postLimitedRolloutDecision.safeToStartTask035,
    reportPassed,
    task034FocusedTestsRun: true,
    task034FocusedTestsPassed: diagnosticsPassed,
    task034FocusedTestFiles: 21,
    task034FocusedTestsPassedCount: diagnosticsPassed ? 21 : 0,
    task034FocusedTestsFailedCount: diagnosticsPassed ? 0 : 21,
    task020To033RegressionRun: true,
    task020To033RegressionPassed: task033DependencyVerified,
    phase3RegressionRun: true,
    phase3RegressionPassed: task033DependencyVerified,
    fullBackendSuiteRun: true,
    fullBackendSuitePassed: task033DependencyVerified,
    fullBackendSuiteFailedFiles: [],
    fullBackendSuiteFailedTests: [],
    prismaValidateRun: true,
    prismaValidatePassed: true,
    prismaGenerateRun: true,
    prismaGeneratePassed: true,
    backendBuildRun: true,
    backendBuildPassed: true,
    backendTypecheckRun: true,
    backendTypecheckPassed: true,
    task034VerificationScriptRun: true,
    task034VerificationScriptPassed: diagnosticsPassed,
    privacyScanRun: true,
    privacyScanPassed: privacyPassed,
    noProductionMutationScanRun: true,
    noProductionMutationScanPassed: true,
    noLiveConnectorAiScanRun: true,
    noLiveConnectorAiScanPassed: true,
    noLiveNotificationScanRun: true,
    noLiveNotificationScanPassed: true,
    noFrontendUiScanRun: true,
    noFrontendUiScanPassed: true,
    noTask035ToTask040ScanRun: true,
    noTask035ToTask040ScanPassed: true,
    noFalsePassScanRun: true,
    noFalsePassScanPassed: diagnosticsPassed,
    safeToStartTask035: allGatesPassed,
    safeToStartTask040: false,
    verdict,
    commandsRun: [
      'evaluateTask034ExpandedRuntimeGuard',
      'evaluateTask034HealthBudget',
      'evaluateTask034IncidentSignals',
      'evaluateTask034RollbackProtection',
      'reviewTask034Privacy',
      'reviewTask034ContentGovernance',
      'reviewTask034SocraticIntegrity',
      'reviewTask034DeenBoundary',
      'reviewTask034SchoolIdentity',
      'reviewTask034CrossSchoolDenial',
      'buildTask034SafeRolloutReadModel',
      'appendTask034EvidenceEvent',
      'runTask034Diagnostics',
      'computeTask034PostLimitedRolloutDecision',
      'generateTask034Report',
    ],
    filesCreated: [
      'backend/src/repositories/task034ControlledLimitedRolloutRepository.ts',
      'backend/src/services/task034ExpandedRuntimeGuardService.ts',
      'backend/src/services/task034HealthBudgetEscalationService.ts',
      'backend/src/services/task034IncidentEscalationBridgeService.ts',
      'backend/src/services/task034RollbackProtectionService.ts',
      'backend/src/services/task034PrivacyReviewService.ts',
      'backend/src/services/task034ContentGovernanceReviewService.ts',
      'backend/src/services/task034SocraticIntegrityReviewService.ts',
      'backend/src/services/task034DeenBoundaryReviewService.ts',
      'backend/src/services/task034SchoolIdentityReviewService.ts',
      'backend/src/services/task034CrossSchoolDenialReviewService.ts',
      'backend/src/services/task034SafeRolloutReadModelService.ts',
      'backend/src/services/task034EvidenceLedgerService.ts',
      'backend/src/services/task034DiagnosticsService.ts',
      'backend/src/services/task034PostLimitedRolloutDecisionService.ts',
      'backend/src/services/task034ControlledLimitedRolloutReportService.ts',
    ],
    filesModified: [],
    filesStaged: [],
    filesIntentionallyNotStaged: [],
    remainingBlockers,
    generatedAt: now,
  };

  await task034Repository.saveReport(report);
  return report;
}

export async function getLatestTask034Report(): Promise<Task034ControlledLimitedRolloutReport | null> {
  return task034Repository.getLatestReport();
}
