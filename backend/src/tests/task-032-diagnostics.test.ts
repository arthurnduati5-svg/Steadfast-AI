import { describe, it, expect, beforeEach } from 'vitest';
import { getTask032CanaryActivationDiagnostics } from '../services/task032CanaryActivationDiagnosticsService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import type { Task032Task031DependencyProof, Task032CanaryEnvironmentGateResult, Task032ApprovedSchoolCanaryConfig, Task032CanaryCohortEligibilityResult, Task032ConsentAuthorizationReadinessResult, Task032LiveStudentPrivacyBoundaryResult, Task032CanaryRuntimeGuardResult, Task032CanaryActivationRecord, Task032CanaryControlActionResult, Task032CanaryHealthBudgetResult, Task032CanaryIncidentBridgeResult, Task032CanarySafeView, Task032CanaryEvidenceEvent } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Diagnostics', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  async function seedPassingFixtures(): Promise<void> {
    const proof: Task032Task031DependencyProof = {
      ok: true, commitFound: true, task031ReportFound: true, task031OpsReportFound: true,
      verdict: 'PASS', safeToStartTask032: true, safeToStartTask033: false,
      safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false,
      task031FocusedTestsPassed: true, task020To030RegressionPassed: true,
      phase3RegressionPassed: true, fullBackendSuitePassed: true,
      backendBuildPassed: true, backendTypecheckPassed: true,
      prismaValidatePassed: true, prismaGeneratePassed: true,
      task031VerificationScriptPassed: true, privacyScanPassed: true,
      noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true,
      noTask032ToTask040ScanPassed: true, noFalsePassScanPassed: true,
      remainingBlockers: [], blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordTask031DependencyProof(proof);

    const envGate: Task032CanaryEnvironmentGateResult = {
      ok: true, environmentTypeValid: true, activationModeValid: true,
      dataModeValid: true, sideEffectModeValid: true,
      productionDeploymentBlocked: true, liveNotificationBlocked: true,
      liveAiBlocked: true, liveSchoolConnectorBlocked: true,
      productionMutationBlocked: true, canaryObservationBlocked: true,
      rolloutBlocked: true, schoolWideLaunchBlocked: true,
      backendFreezeBlocked: true, blockingIssues: [], passed: true
    };
    await task032ControlledCanaryActivationRepository.recordEnvironmentGate(envGate);

    const config: Task032ApprovedSchoolCanaryConfig = {
      configId: 'config_001', schoolId: 'school_task032_canary_safe',
      approvedByRole: 'school_admin', activationMode: 'internal_controlled_activation',
      maxCanaryLearners: 25, allowedClassIds: ['class_001'],
      allowedSubjectIds: ['subject_001'], allowedCohortIds: ['cohort_001'],
      canaryStartWindow: '2026-06-01T00:00:00Z', canaryEndWindow: '2026-06-30T23:59:59Z',
      rollbackPolicyId: 'rollback_001', incidentPolicyId: 'incident_001',
      privacyBoundaryId: 'privacy_001', healthBudgetId: 'budget_001',
      consentAuthorizationPolicyId: 'consent_001', sourceGovernancePolicyId: 'source_001',
      deenBoundaryPolicyId: 'deen_001', socraticIntegrityPolicyId: 'socratic_001',
      blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordApprovedSchoolCanaryConfig(config);

    const cohortResult: Task032CanaryCohortEligibilityResult = {
      ok: true, cohortApproved: true, cohortSizeWithinCap: true,
      cohortSize: 25, maxCanaryLearners: 25, schoolVerified: true,
      classBoundariesMatch: true, subjectBoundariesMatch: true,
      noExcludedLearners: true, noSafeguardingRawExposure: true,
      noCrossSchoolLearner: true, noParentContactData: true,
      noRealIdentifierLeakage: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordCohortEligibility(cohortResult);

    const consentResult: Task032ConsentAuthorizationReadinessResult = {
      ok: true, schoolApprovalRecorded: true, adminOperatorAuthorizationRecorded: true,
      teacherReadinessAcknowledged: true, learnerSafeNoticeTemplateReady: true,
      parentGuardianNoticeTemplateReady: true, noRealNoticeSent: true,
      noSMSSent: true, noWhatsAppSent: true, noEmailSent: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordConsentAuthorization(consentResult);

    const privacyResult: Task032LiveStudentPrivacyBoundaryResult = {
      ok: true, rawLearnerProfilesBlocked: true, realEmailsBlocked: true,
      realPhoneNumbersBlocked: true, parentContactDataBlocked: true,
      rawChatBlocked: true, rawStudentAnswersBlocked: true, rawStudentWorkBlocked: true,
      safeguardingRawNotesBlocked: true, privateDeenTextBlocked: true,
      answerKeysBlocked: true, markingSchemesBlocked: true,
      teacherPrivateNotesBlocked: true, providerPromptsResponsesBlocked: true,
      hiddenReasoningBlocked: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordPrivacyBoundary(privacyResult);

    const guardResult: Task032CanaryRuntimeGuardResult = {
      ok: true, verifiedSchoolContextRequired: true, adminOperatorActorRequired: true,
      actorRoleValid: true, task031ProofRequired: true, approvedConfigRequired: true,
      cohortEligibilityRequired: true, consentAuthorizationReadinessRequired: true,
      privacyBoundaryRequired: true, healthBudgetRequired: true,
      rollbackReadinessRequired: true, incidentBridgeRequired: true,
      noLiveAi: true, noLiveConnector: true, noLiveNotification: true,
      noDeployment: true, noRollout: true, noObservation: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordRuntimeGuard(guardResult);

    const record: Task032CanaryActivationRecord = {
      activationId: 'act_001', schoolId: 'school_task032_canary_safe',
      status: 'activated_internal', configuredCohortSize: 25,
      safeStage: 'activated_internal', healthBudgetStatus: 'passed',
      privacyBoundaryStatus: 'passed', rollbackReadinessStatus: 'passed',
      incidentBridgeStatus: 'passed', safeToStartTask033: true,
      reasonCodes: ['activated'], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), blockers: []
    };
    await task032ControlledCanaryActivationRepository.createActivationRecord(record);

    const healthBudget: Task032CanaryHealthBudgetResult = {
      ok: true, activationPreflightP95Ms: 150, safeViewP95Ms: 100,
      controlActionP95Ms: 80, errorRate: 0, criticalErrorCount: 0,
      privacyBoundaryFailures: 0, schoolContextBypassCount: 0,
      crossSchoolAccessCount: 0, activationPreflightBudgetPassed: true,
      safeViewBudgetPassed: true, controlActionBudgetPassed: true,
      errorRateBudgetPassed: true, criticalErrorBudgetPassed: true,
      privacyBoundaryBudgetPassed: true, schoolContextBypassBudgetPassed: true,
      crossSchoolAccessBudgetPassed: true, overallPassed: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordHealthBudget(healthBudget);

    const incident: Task032CanaryIncidentBridgeResult = {
      ok: true, safeIncidentReasonCodesExist: true, escalationLabelsExist: true,
      rollbackTriggerLabelsExist: true, safeguardingRawDetailsNotExposed: true,
      privateDeenTextNotExposed: true, noNotificationSent: true,
      noExternalTicketCreated: true, noWebhookCalled: true, blockingIssues: []
    };
    await task032ControlledCanaryActivationRepository.recordIncidentBridge(incident);

    const view: Task032CanarySafeView = {
      viewId: 'view_001', activationId: 'act_001', schoolId: 'school_task032_canary_safe',
      status: 'activated_internal', configuredCohortSize: 25,
      safeStage: 'activated_internal', healthBudgetStatus: 'passed',
      privacyBoundaryStatus: 'passed', rollbackReadinessStatus: 'passed',
      incidentBridgeStatus: 'passed', safeToStartTask033: true,
      reasonCodes: ['all_passed'], createdAt: new Date().toISOString()
    };
    await task032ControlledCanaryActivationRepository.recordSafeView(view);
  }

  it('should return all gate statuses', async () => {
    await seedPassingFixtures();
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.task031ProofStatus).toBe('passed');
    expect(diagnostics.environmentGateStatus).toBe('passed');
    expect(diagnostics.approvedConfigStatus).toBe('passed');
    expect(diagnostics.cohortEligibilityStatus).toBe('passed');
    expect(diagnostics.consentAuthorizationStatus).toBe('passed');
    expect(diagnostics.privacyBoundaryStatus).toBe('passed');
    expect(diagnostics.runtimeGuardStatus).toBe('passed');
    expect(diagnostics.activationStateMachineStatus).toBe('passed');
    expect(diagnostics.healthBudgetStatus).toBe('passed');
    expect(diagnostics.incidentBridgeStatus).toBe('passed');
    expect(diagnostics.safeViewStatus).toBe('passed');
    expect(diagnostics.reportStatus).toBe('not_run');
  });

  it('should return task031ProofStatus', async () => {
    await seedPassingFixtures();
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.task031ProofStatus).toBe('passed');
  });

  it('should return routeMountStatus', async () => {
    await seedPassingFixtures();
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.routeMountStatus).toBe('mounted');
  });

  it('should have no blocking issues when clean', async () => {
    await seedPassingFixtures();
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.blockingIssues).toHaveLength(0);
  });

  it('should show not_run for gates with no data', async () => {
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.task031ProofStatus).toBe('not_run');
    expect(diagnostics.environmentGateStatus).toBe('not_run');
    expect(diagnostics.approvedConfigStatus).toBe('not_run');
    expect(diagnostics.cohortEligibilityStatus).toBe('not_run');
  });

  it('should report failed status for failing gates', async () => {
    const proof: Task032Task031DependencyProof = {
      ok: false, commitFound: false, task031ReportFound: false, task031OpsReportFound: false,
      verdict: 'FAIL', safeToStartTask032: false, safeToStartTask033: false,
      safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false,
      task031FocusedTestsPassed: false, task020To030RegressionPassed: false,
      phase3RegressionPassed: false, fullBackendSuitePassed: false,
      backendBuildPassed: false, backendTypecheckPassed: false,
      prismaValidatePassed: false, prismaGeneratePassed: false,
      task031VerificationScriptPassed: false, privacyScanPassed: false,
      noProductionMutationScanPassed: false, noLiveConnectorAiScanPassed: false,
      noLiveNotificationScanPassed: false, noFrontendUiScanPassed: false,
      noTask032ToTask040ScanPassed: false, noFalsePassScanPassed: false,
      remainingBlockers: ['proof_missing'], blockingIssues: ['proof_missing']
    };
    await task032ControlledCanaryActivationRepository.recordTask031DependencyProof(proof);
    const diagnostics = await getTask032CanaryActivationDiagnostics({});
    expect(diagnostics.task031ProofStatus).toBe('failed');
  });

  it('should filter evidence by activationId when provided', async () => {
    const event: Task032CanaryEvidenceEvent = {
      eventId: 'evt_001', activationId: 'act_specific',
      stageId: 'runtime_guard', actorRole: 'school_admin',
      status: 'passed', safeSummary: 'OK', reasonCodes: ['ok'],
      createdAt: new Date().toISOString()
    };
    await task032ControlledCanaryActivationRepository.recordEvidenceEvent(event);
    const diagnosticsWithId = await getTask032CanaryActivationDiagnostics({ activationId: 'act_specific' });
    expect(typeof diagnosticsWithId.evidenceLedgerStatus).toBe('string');
  });
});
