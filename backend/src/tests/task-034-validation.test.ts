import { describe, it, expect } from 'vitest';
import {
  validateTask034DependencyProof,
  validateTask034EnvironmentGateInput,
  validateTask034LimitedRolloutConfig,
  validateTask034RolloutCapGate,
  validateTask034ExpandedCohortEligibility,
  validateTask034StaffReadiness,
  validateTask034LearnerNoticeReadiness,
  validateTask034RolloutSessionInput,
  validateTask034RolloutEventInput,
  validateTask034ExpandedRuntimeGuard,
  validateTask034HealthBudgetEscalation,
  validateTask034IncidentEscalationBridge,
  validateTask034RollbackProtection,
  validateTask034PrivacyReview,
  validateTask034ContentGovernanceReview,
  validateTask034SocraticIntegrityReview,
  validateTask034DeenBoundaryReview,
  validateTask034SchoolIdentityReview,
  validateTask034CrossSchoolDenialReview,
  validateTask034SafeRolloutReadModel,
  validateTask034ReportTruth,
  validateTask034ForbiddenOutputFields,
} from '../lib/task034ControlledLimitedRolloutValidation';

describe('Task034 Validation', () => {
  it('validateTask034DependencyProof valid proof passes', () => {
    const result = validateTask034DependencyProof({
      ok: true, reportFound: true, opsReportFound: true, verdict: 'TASK_033_PASS_SAFE_TO_START_TASK_034',
      safeToStartTask034: true, safeToStartTask035: false, safeToStartTask040: false,
      task033FocusedTestsPassed: true, task033RouteContractsPassed: true,
      task033RoleSecurityTestsPassed: true, task033ContinuityTestsPassed: true,
      task033NoStarSafetyTestsPassed: true, task033VerificationScriptPassed: true,
      task020To032RegressionPassed: true, phase3RegressionPassed: true,
      fullBackendSuitePassed: true, backendTypecheckPassed: true, backendBuildPassed: true,
      prismaValidatePassed: true, prismaGeneratePassed: true,
      privacyScanPassed: true, noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true, noTask034ToTask040ScanPassed: true,
      noFalsePassScanPassed: true, noTask034ImplementationInTask033: true,
      noFrontendUiInTask033: true, noLiveAiConnectorNotificationInTask033: true,
      remainingBlockers: [], blockingIssues: [],
    });
    expect(result.ok).toBe(true);
    expect(result.reasonCodes).toEqual([]);
  });

  it('validateTask034DependencyProof null fails', () => {
    const result = validateTask034DependencyProof(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('validateTask034DependencyProof ok_not_true fails', () => {
    const result = validateTask034DependencyProof({
      ok: false, reportFound: true, opsReportFound: true, verdict: 'verdict',
      safeToStartTask034: true, safeToStartTask035: false, safeToStartTask040: false,
      task033FocusedTestsPassed: true, task033RouteContractsPassed: true,
      task033RoleSecurityTestsPassed: true, task033ContinuityTestsPassed: true,
      task033NoStarSafetyTestsPassed: true, task033VerificationScriptPassed: true,
      task020To032RegressionPassed: true, phase3RegressionPassed: true,
      fullBackendSuitePassed: true, backendTypecheckPassed: true, backendBuildPassed: true,
      prismaValidatePassed: true, prismaGeneratePassed: true,
      privacyScanPassed: true, noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true, noTask034ToTask040ScanPassed: true,
      noFalsePassScanPassed: true, noTask034ImplementationInTask033: true,
      noFrontendUiInTask033: true, noLiveAiConnectorNotificationInTask033: true,
      remainingBlockers: [], blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('ok_not_true');
  });

  it('validateTask034EnvironmentGateInput valid input passes', () => {
    const result = validateTask034EnvironmentGateInput({
      environmentType: 'controlled_limited_rollout',
      rolloutMode: 'limited_cohort_expansion_only',
      dataMode: 'safe_metadata_and_aggregate_only',
      sideEffectMode: 'internal_rollout_store_only',
      task033Accepted: true, task034Started: false,
      task035Started: false, task040Started: false,
      rolloutPercent: 20, schoolWideLaunchRequested: false,
      hundredPercentRolloutRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false, liveAiRequested: false,
      liveConnectorRequested: false, liveNotificationRequested: false,
      productionDeploymentRequested: false, productionMutationRequested: false,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034EnvironmentGateInput invalid env type fails', () => {
    const result = validateTask034EnvironmentGateInput({
      environmentType: 'production',
      rolloutMode: 'limited_cohort_expansion_only',
      dataMode: 'safe_metadata_and_aggregate_only',
      sideEffectMode: 'internal_rollout_store_only',
      task033Accepted: true, task034Started: false,
      task035Started: false, task040Started: false,
      rolloutPercent: 20, schoolWideLaunchRequested: false,
      hundredPercentRolloutRequested: false, backendFreezeRequested: false,
      frontendUiRequested: false, liveAiRequested: false,
      liveConnectorRequested: false, liveNotificationRequested: false,
      productionDeploymentRequested: false, productionMutationRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('environmentType_not_controlled_limited_rollout');
  });

  it('validateTask034LimitedRolloutConfig valid passes', () => {
    const result = validateTask034LimitedRolloutConfig({
      rolloutPercent: 20, expandedCohortId: 'c1', schoolId: 's1', tenantId: 't1',
      activationId: 'a1', task033ObservationSessionId: 'o1',
      rollbackPlanId: 'r1', pausePlanId: 'p1', killSwitchId: 'k1',
      staffReadinessRequired: true, learnerNoticeRequired: true,
      healthBudgetRequired: true, privacyReviewRequired: true,
      contentGovernanceReviewRequired: true, socraticIntegrityReviewRequired: true,
      deenBoundaryReviewRequired: true,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034LimitedRolloutConfig rolloutPercent > 25 fails', () => {
    const result = validateTask034LimitedRolloutConfig({
      rolloutPercent: 50, expandedCohortId: 'c1', schoolId: 's1', tenantId: 't1',
      activationId: 'a1', task033ObservationSessionId: 'o1',
      rollbackPlanId: 'r1', pausePlanId: 'p1', killSwitchId: 'k1',
      staffReadinessRequired: true, learnerNoticeRequired: true,
      healthBudgetRequired: true, privacyReviewRequired: true,
      contentGovernanceReviewRequired: true, socraticIntegrityReviewRequired: true,
      deenBoundaryReviewRequired: true,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('rolloutPercent_out_of_range');
  });

  it('validateTask034RolloutCapGate valid passes', () => {
    const result = validateTask034RolloutCapGate({
      rolloutPercent: 20, expandedStudentCount: 50, maxRolloutPercent: 25,
      maxExpandedStudentCount: 100, schoolWideRequested: false,
      hundredPercentRequested: false, openCohortRequested: false,
      unknownCohortRequested: false, crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034RolloutCapGate schoolWideRequested fails', () => {
    const result = validateTask034RolloutCapGate({
      rolloutPercent: 20, expandedStudentCount: 50, maxRolloutPercent: 25,
      maxExpandedStudentCount: 100, schoolWideRequested: true,
      hundredPercentRequested: false, openCohortRequested: false,
      unknownCohortRequested: false, crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('schoolWideRequested_not_false');
  });

  it('validateTask034ExpandedCohortEligibility valid passes', () => {
    const result = validateTask034ExpandedCohortEligibility({
      schoolId: 's1', tenantId: 't1', cohortId: 'c1', classIds: ['cls1'],
      studentCount: 10, hashedStudentIds: ['h1', 'h2'],
      approvedSchoolConfig: true, staffCoverage: true, rollbackCoverage: true,
      healthBudgetCoverage: true, contentGovernanceCoverage: true,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034ExpandedCohortEligibility missing fields fails', () => {
    const result = validateTask034ExpandedCohortEligibility({});
    expect(result.ok).toBe(false);
  });

  it('validateTask034StaffReadiness valid passes', () => {
    const result = validateTask034StaffReadiness({
      schoolAdminAcknowledged: true, internalOperatorAcknowledged: true,
      teacherSupportAcknowledged: true, privacyBoundaryAcknowledged: true,
      safeguardingEscalationAcknowledged: true, deenBoundaryAcknowledged: true,
      contentGovernanceAcknowledged: true, rollbackPauseKillSwitchAcknowledged: true,
      learnerSupportPlanAcknowledged: true, readinessScore: 85,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034StaffReadiness null fails', () => {
    const result = validateTask034StaffReadiness(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('validateTask034LearnerNoticeReadiness valid passes', () => {
    const result = validateTask034LearnerNoticeReadiness({
      noticeIsCalm: true, noticeIsAgeAppropriate: true, noticeIsNonAlarming: true,
      noticeMentionsThinkingFirst: true, noticeMentionsTeacherSupport: true,
      noInternalRolloutDetails: true, noRiskScores: true, noPrivateComparisons: true,
      noPietyScore: true, noClassmateComparison: true, noRawIncidentDetail: true,
      noAnswerArtifact: true,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034LearnerNoticeReadiness missing fields fails', () => {
    const result = validateTask034LearnerNoticeReadiness({});
    expect(result.ok).toBe(false);
  });

  it('validateTask034RolloutSessionInput valid passes', () => {
    const result = validateTask034RolloutSessionInput({
      sessionId: 's1', activationId: 'a1', schoolId: 'sch1', tenantId: 't1',
      cohortId: 'c1', actorRole: 'school_admin',
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034RolloutSessionInput student role fails', () => {
    const result = validateTask034RolloutSessionInput({
      sessionId: 's1', activationId: 'a1', schoolId: 'sch1', tenantId: 't1',
      cohortId: 'c1', actorRole: 'student',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('actorRole_not_allowed');
  });

  it('validateTask034RolloutEventInput valid passes', () => {
    const result = validateTask034RolloutEventInput({
      eventId: 'e1', sessionId: 's1', activationId: 'a1', schoolId: 'sch1',
      actorRole: 'school_admin', safeActorHash: 'hash_a', safeStudentHash: 'hash_s',
      cohortId: 'c1', classId: 'cls1', subjectId: 'sub1', eventType: 'gate',
      safeReasonCodes: [], safeSummary: 'ok', gateName: 'g', gatePassed: true,
      latencyMs: 5, errorCategory: 'none', createdAt: 'ts',
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034RolloutEventInput denied role fails', () => {
    const result = validateTask034RolloutEventInput({
      eventId: 'e1', sessionId: 's1', activationId: 'a1', schoolId: 'sch1',
      actorRole: 'student', safeActorHash: 'hash_a', safeStudentHash: 'hash_s',
      cohortId: 'c1', classId: 'cls1', subjectId: 'sub1', eventType: 'gate',
      safeReasonCodes: [], safeSummary: 'ok', gateName: 'g', gatePassed: true,
      latencyMs: 5, errorCategory: 'none', createdAt: 'ts',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('actorRole_not_allowed');
  });

  it('validateTask034ExpandedRuntimeGuard valid passes', () => {
    const result = validateTask034ExpandedRuntimeGuard({
      ok: true, verifiedSchoolContextRequired: true, task033AcceptedProofRequired: true,
      approvedSchoolConfigRequired: true, approvedContentContextRequired: true,
      learnerMemoryBlockedBeforeSchoolContext: true, aiBlockedBeforeAllGates: true,
      liveAiBlocked: true, liveConnectorBlocked: true, liveNotificationsBlocked: true,
      crossSchoolAccessBlocked: true, crossLearnerVisibilityBlocked: true,
      parentRawDetailBlocked: true, teacherOnlyLeakageBlocked: true,
      unsafeDeenAuthorityBlocked: true, answerBotBehaviorBlocked: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034ExpandedRuntimeGuard null fails', () => {
    const result = validateTask034ExpandedRuntimeGuard(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('validateTask034HealthBudgetEscalation valid passes', () => {
    const result = validateTask034HealthBudgetEscalation({
      ok: true, rolloutLatencyP95Ms: 100, safeReadLatencyP95Ms: 100,
      eventIntakeLatencyP95Ms: 100, errorRate: 0.5, criticalErrorCount: 0,
      timeoutCount: 0, privacyBoundaryFailureCount: 0, schoolContextBypassCount: 0,
      crossSchoolAttemptCount: 0, runtimeGuardDenialCount: 0,
      rollbackReadinessFailureCount: 0, healthBudgetPassed: true,
      escalationRequired: false, pauseRecommended: false, rollbackRecommended: false,
      killSwitchRecommended: false, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034HealthBudgetEscalation latency not number fails', () => {
    const result = validateTask034HealthBudgetEscalation({
      ok: true, rolloutLatencyP95Ms: 'abc', safeReadLatencyP95Ms: 100,
      eventIntakeLatencyP95Ms: 100, errorRate: 0.5, criticalErrorCount: 0,
      timeoutCount: 0, privacyBoundaryFailureCount: 0, schoolContextBypassCount: 0,
      crossSchoolAttemptCount: 0, runtimeGuardDenialCount: 0,
      rollbackReadinessFailureCount: 0, healthBudgetPassed: true,
      escalationRequired: false, pauseRecommended: false, rollbackRecommended: false,
      killSwitchRecommended: false, blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('rolloutLatencyP95Ms_not_number');
  });

  it('validateTask034IncidentEscalationBridge valid passes', () => {
    const result = validateTask034IncidentEscalationBridge({
      ok: true, safeSeverity: 'none', safeCategory: 'no_incident',
      safeReasonCodes: [], safeSummary: 'no_incident_signals',
      pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false,
      operatorReviewRequired: false, realAlertSent: false, realEmailSent: false,
      realSmsSent: false, realWhatsappSent: false, externalTicketCreated: false,
      webhookCalled: false, rawIncidentDetailsExposed: false, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034IncidentEscalationBridge realAlertSent true fails', () => {
    const result = validateTask034IncidentEscalationBridge({
      ok: true, safeSeverity: 'info', safeCategory: 'incident',
      safeReasonCodes: [], safeSummary: 'test',
      pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false,
      operatorReviewRequired: false, realAlertSent: true, realEmailSent: false,
      realSmsSent: false, realWhatsappSent: false, externalTicketCreated: false,
      webhookCalled: false, rawIncidentDetailsExposed: false, blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('realAlertSent_not_false');
  });

  it('validateTask034RollbackProtection valid passes', () => {
    const result = validateTask034RollbackProtection({
      ok: true, rollbackAvailable: true, pauseAvailable: true, killSwitchAvailable: true,
      rollbackOwnerAssigned: true, rollbackPlanValid: true, pausePlanValid: true,
      killSwitchPlanValid: true, safeAuditPreservedOnRollback: true,
      limitedRolloutCanStopWithoutSchoolWideSideEffect: true, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034PrivacyReview valid passes', () => {
    const result = validateTask034PrivacyReview({
      ok: true, noRawLearnerData: true, noRawChat: true, noRawAnswer: true,
      noRawStudentWork: true, noParentContactData: true, noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true, noPrivateDeenText: true, noAnswerKey: true,
      noMarkingScheme: true, noProviderPrompt: true, noProviderResponse: true,
      noHiddenReasoning: true, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034ContentGovernanceReview valid passes', () => {
    const result = validateTask034ContentGovernanceReview({
      ok: true, approvedCurriculumSourceRequired: true, noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true, noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034SocraticIntegrityReview valid passes', () => {
    const result = validateTask034SocraticIntegrityReview({
      ok: true, socraticGuidancePreserved: true, noFinalAnswerBotBehavior: true,
      cheatingPreventionPreserved: true, hintLadderPreserved: true,
      studentReasoningFirstPreserved: true, teacherEscalationAvailable: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034DeenBoundaryReview valid passes', () => {
    const result = validateTask034DeenBoundaryReview({
      ok: true, notAFatwaEngine: true, approvedDeenSourcesRequired: true,
      teacherScholarReferralPreserved: true, noPietyScoring: true,
      noRawSafeguardingExposure: true, noUnsafeAuthorityClaim: true, blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034SchoolIdentityReview valid passes', () => {
    const result = validateTask034SchoolIdentityReview({
      ok: true, verifiedSchoolIdentityRequired: true, unknownSchoolDenied: true,
      crossSchoolAccessDenied: true, actorRoleRequired: true,
      noSessionBeforeSchoolContext: true, noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true, noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034CrossSchoolDenialReview valid passes', () => {
    const result = validateTask034CrossSchoolDenialReview({
      ok: true, crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true, noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true, safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034SafeRolloutReadModel valid passes', () => {
    const result = validateTask034SafeRolloutReadModel({
      rolloutSessionId: 'rs1', task033ObservationSessionId: 'o1', activationId: 'a1',
      schoolId: 's1', tenantId: 't1', cohortId: 'c1', rolloutPercent: 20,
      studentCount: 10, status: 'created', stage: 'created',
      healthStatus: 'pass', privacyStatus: 'pass', governanceStatus: 'pass',
      socraticStatus: 'pass', deenStatus: 'pass', schoolIdentityStatus: 'pass',
      incidentStatus: 'pass', rollbackProtectionStatus: 'pass',
      staffReadinessStatus: 'pass', learnerNoticeReadinessStatus: 'pass',
      safeToStartTask035: false, safeToStartTask040: false,
      safeReasonCodes: [], generatedAt: 'ts',
      safeAggregate: null,
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034SafeRolloutReadModel safeToStartTask035 true fails', () => {
    const result = validateTask034SafeRolloutReadModel({
      rolloutSessionId: 'rs1', task033ObservationSessionId: 'o1', activationId: 'a1',
      schoolId: 's1', tenantId: 't1', cohortId: 'c1', rolloutPercent: 20,
      studentCount: 10, status: 'created', stage: 'created',
      healthStatus: 'pass', privacyStatus: 'pass', governanceStatus: 'pass',
      socraticStatus: 'pass', deenStatus: 'pass', schoolIdentityStatus: 'pass',
      incidentStatus: 'pass', rollbackProtectionStatus: 'pass',
      staffReadinessStatus: 'pass', learnerNoticeReadinessStatus: 'pass',
      safeToStartTask035: true, safeToStartTask040: false,
      safeReasonCodes: [], generatedAt: 'ts',
      safeAggregate: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask035_not_false');
  });

  it('validateTask034ReportTruth valid passes', () => {
    const result = validateTask034ReportTruth({
      taskId: 'task-034', scope: 'controlled-limited-rollout',
      task033DependencyCommit: '276445d', task033DependencyVerified: true,
      task034Started: false, task035Started: false, task040Started: false,
      frontendUiCreated: false, schoolWideLaunchCreated: false,
      backendFreezeCreated: false, hundredPercentRolloutCreated: false,
      productionDeploymentIntroduced: false, realNotificationsSent: false,
      liveAiCallIntroduced: false, liveSchoolConnectorWriteIntroduced: false,
      productionDataMutationExecuted: false, rawPrivateDataStored: false,
      controlledLimitedRolloutCreated: true,
      contractsCreatedOrUpdated: true, validationCreatedOrUpdated: true,
      repositoryCreatedOrUpdated: true, servicesCreatedOrUpdated: true,
      routesCreatedOrUpdated: true, routesMountedOrDirectlyTested: true,
      verifiedSchoolContextRequired: true, task033AcceptanceRequired: true,
      rolloutEnvironmentGatePassed: true, limitedRolloutConfigPassed: true,
      rolloutCapGatePassed: true, expandedCohortEligibilityPassed: true,
      staffReadinessPassed: true, learnerNoticeReadinessPassed: true,
      controlledRolloutStateMachinePassed: true, controlledRolloutEventIntakePassed: true,
      expandedRuntimeGuardPassed: true, healthBudgetEscalationPassed: true,
      incidentEscalationBridgePassed: true, rollbackProtectionPassed: true,
      privacyReviewPassed: true, contentGovernanceReviewPassed: true,
      socraticIntegrityReviewPassed: true, deenBoundaryReviewPassed: true,
      schoolIdentityReviewPassed: true, crossSchoolDenialReviewPassed: true,
      safeRolloutReadModelPassed: true, evidenceLedgerPassed: true,
      diagnosticsPassed: true, postLimitedRolloutDecisionPassed: true,
      reportPassed: true,
      task034FocusedTestsRun: true, task034FocusedTestsPassed: true,
      task034FocusedTestFiles: 25, task034FocusedTestsPassedCount: 25,
      task034FocusedTestsFailedCount: 0,
      task020To033RegressionRun: true, task020To033RegressionPassed: true,
      phase3RegressionRun: true, phase3RegressionPassed: true,
      fullBackendSuiteRun: true, fullBackendSuitePassed: true,
      fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [],
      prismaValidateRun: true, prismaValidatePassed: true,
      prismaGenerateRun: true, prismaGeneratePassed: true,
      backendBuildRun: true, backendBuildPassed: true,
      backendTypecheckRun: true, backendTypecheckPassed: true,
      task034VerificationScriptRun: true, task034VerificationScriptPassed: true,
      privacyScanRun: true, privacyScanPassed: true,
      noProductionMutationScanRun: true, noProductionMutationScanPassed: true,
      noLiveConnectorAiScanRun: true, noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true,
      noFrontendUiScanRun: true, noFrontendUiScanPassed: true,
      noTask035ToTask040ScanRun: true, noTask035ToTask040ScanPassed: true,
      noFalsePassScanRun: true, noFalsePassScanPassed: true,
      safeToStartTask035: false, safeToStartTask040: false,
      verdict: 'TASK_034_PASS_SAFE_TO_START_TASK_035',
      commandsRun: [], filesCreated: [], filesModified: [],
      filesStaged: [], filesIntentionallyNotStaged: [],
      remainingBlockers: [], generatedAt: 'ts',
    });
    expect(result.ok).toBe(true);
  });

  it('validateTask034ForbiddenOutputFields detects forbidden fields', () => {
    const result = validateTask034ForbiddenOutputFields({
      studentName: 'John', safeField: 'ok',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('forbidden_field_non_empty_studentName');
  });

  it('validateTask034ForbiddenOutputFields null fails', () => {
    const result = validateTask034ForbiddenOutputFields(null as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('validateTask034ForbiddenOutputFields empty object passes', () => {
    const result = validateTask034ForbiddenOutputFields({});
    expect(result.ok).toBe(true);
  });
});
