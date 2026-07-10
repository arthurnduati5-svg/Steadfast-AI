import { describe, it, expect, beforeEach } from 'vitest';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034 Repository', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('clearTask034StoresForTests clears all stores', async () => {
    await task034Repository.saveRolloutEvent({
      eventId: 'e1', sessionId: 's1', activationId: 'a1', schoolId: 'sch1',
      actorRole: 'school_admin', safeActorHash: 'h', safeStudentHash: 'h',
      cohortId: 'c1', classId: 'cls1', subjectId: 'sub1', eventType: 't',
      safeReasonCodes: [], safeSummary: 's', gateName: 'g', gatePassed: true,
      latencyMs: 0, errorCategory: 'none', createdAt: 'ts',
    });
    await task034Repository.clearTask034StoresForTests();
    const events = await task034Repository.listRolloutEventsForSession('s1');
    expect(events).toHaveLength(0);
  });

  it('save/get Task033DependencyProof round trip', async () => {
    const proof = {
      ok: true, reportFound: true, opsReportFound: true, verdict: 'ACCEPTED_READY_YES',
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
    };
    await task034Repository.saveTask033DependencyProof(proof as any);
    const loaded = await task034Repository.getTask033DependencyProof();
    expect(loaded).not.toBeNull();
    expect(loaded!.verdict).toBe('ACCEPTED_READY_YES');
    expect(loaded!.ok).toBe(true);
  });

  it('save/get EnvironmentGate round trip', async () => {
    const result = {
      ok: true, passed: true, environmentTypeValid: true, rolloutModeValid: true,
      dataModeValid: true, sideEffectModeValid: true, task033Accepted: true,
      task034Started: false, task035Started: false, task040Started: false,
      rolloutPercentInRange: true, schoolWideLaunchBlocked: false,
      hundredPercentRolloutBlocked: false, backendFreezeBlocked: false,
      frontendUiBlocked: false, liveAiBlocked: false, liveConnectorBlocked: false,
      liveNotificationBlocked: false, productionDeploymentBlocked: false,
      productionMutationBlocked: false, blockingIssues: [],
    };
    await task034Repository.saveEnvironmentGate(result);
    const loaded = await task034Repository.getEnvironmentGate();
    expect(loaded).not.toBeNull();
    expect(loaded!.ok).toBe(true);
    expect(loaded!.environmentTypeValid).toBe(true);
  });

  it('save/get LimitedRolloutConfig round trip', async () => {
    const config = {
      ok: true, rolloutPercent: 20, maxRolloutPercent: 25,
      expandedCohortId: 'c1', schoolId: 's1', tenantId: 't1',
      activationId: 'a1', task033ObservationSessionId: 'o1',
      rollbackPlanId: 'r1', pausePlanId: 'p1', killSwitchId: 'k1',
      staffReadinessRequired: true, learnerNoticeRequired: true,
      healthBudgetRequired: true, privacyReviewRequired: true,
      contentGovernanceReviewRequired: true, socraticIntegrityReviewRequired: true,
      deenBoundaryReviewRequired: true, blockingIssues: [],
    };
    await task034Repository.saveLimitedRolloutConfig(config);
    const loaded = await task034Repository.getLimitedRolloutConfig();
    expect(loaded).not.toBeNull();
    expect(loaded!.rolloutPercent).toBe(20);
  });

  it('save/get RolloutCapGate round trip', async () => {
    const cap = {
      ok: true, rolloutPercent: 20, maxRolloutPercent: 25,
      expandedStudentCount: 50, maxExpandedStudentCount: 100,
      percentCapPassed: true, studentCapPassed: true,
      schoolWideBlocked: false, hundredPercentBlocked: false,
      openCohortBlocked: false, unknownCohortBlocked: false,
      crossSchoolCohortBlocked: false, blockingIssues: [],
    };
    await task034Repository.saveRolloutCapGate(cap);
    const loaded = await task034Repository.getRolloutCapGate();
    expect(loaded).not.toBeNull();
    expect(loaded!.percentCapPassed).toBe(true);
  });

  it('save/get CohortEligibility round trip', async () => {
    const el = {
      ok: true, schoolVerified: true, tenantVerified: true, cohortVerified: true,
      classIdsValid: true, studentCountWithinCap: true,
      hashedOnlyNoRawPrivateFields: true, approvedSchoolConfig: true,
      staffCoverage: true, rollbackCoverage: true, healthBudgetCoverage: true,
      contentGovernanceCoverage: true, blockingIssues: [],
    };
    await task034Repository.saveExpandedCohortEligibility(el);
    const loaded = await task034Repository.getExpandedCohortEligibility();
    expect(loaded).not.toBeNull();
    expect(loaded!.schoolVerified).toBe(true);
  });

  it('save/get StaffReadiness round trip', async () => {
    const sr = {
      ok: true, schoolAdminAcknowledged: true, internalOperatorAcknowledged: true,
      teacherSupportAcknowledged: true, privacyBoundaryAcknowledged: true,
      safeguardingEscalationAcknowledged: true, deenBoundaryAcknowledged: true,
      contentGovernanceAcknowledged: true, rollbackPauseKillSwitchAcknowledged: true,
      learnerSupportPlanAcknowledged: true, readinessScore: 85, minReadinessScore: 50,
      noRealMessagesSent: true, blockingIssues: [],
    };
    await task034Repository.saveStaffReadiness(sr);
    const loaded = await task034Repository.getStaffReadiness();
    expect(loaded).not.toBeNull();
    expect(loaded!.readinessScore).toBe(85);
  });

  it('save/get LearnerNoticeReadiness round trip', async () => {
    const ln = {
      ok: true, noticeIsCalm: true, noticeIsAgeAppropriate: true, noticeIsNonAlarming: true,
      noticeMentionsThinkingFirst: true, noticeMentionsTeacherSupport: true,
      noInternalRolloutDetails: true, noRiskScores: true, noPrivateComparisons: true,
      noPietyScore: true, noClassmateComparison: true, noRawIncidentDetail: true,
      noAnswerArtifact: true, noticeNotActuallySent: true, blockingIssues: [],
    };
    await task034Repository.saveLearnerNoticeReadiness(ln);
    const loaded = await task034Repository.getLearnerNoticeReadiness();
    expect(loaded).not.toBeNull();
    expect(loaded!.noticeIsCalm).toBe(true);
  });

  it('save/get/list RolloutSession round trip', async () => {
    const session = {
      sessionId: 'rs_1', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin' as const,
      status: 'created' as const, rolloutStage: 'created',
      createdAt: 'ts', updatedAt: 'ts', blockingIssues: [],
    };
    await task034Repository.saveRolloutSession(session);
    const loaded = await task034Repository.getRolloutSession('rs_1');
    expect(loaded).not.toBeNull();
    expect(loaded!.sessionId).toBe('rs_1');
    expect(loaded!.status).toBe('created');
    const sessions = await task034Repository.listRolloutSessions();
    expect(sessions).toHaveLength(1);
  });

  it('save/get/list RolloutEvent round trip', async () => {
    const event = {
      eventId: 'evt_1', sessionId: 'sess_1', activationId: 'a1', schoolId: 'sch1',
      actorRole: 'school_admin' as const, safeActorHash: 'hash_a',
      safeStudentHash: 'hash_s', cohortId: 'c1', classId: 'cls1', subjectId: 'sub1',
      eventType: 'gate', safeReasonCodes: [], safeSummary: 'ok', gateName: 'privacy',
      gatePassed: true, latencyMs: 5, errorCategory: 'none', createdAt: 'ts',
    };
    await task034Repository.saveRolloutEvent(event);
    const loaded = await task034Repository.getRolloutEvent('evt_1');
    expect(loaded).not.toBeNull();
    expect(loaded!.eventId).toBe('evt_1');
    const events = await task034Repository.listRolloutEventsForSession('sess_1');
    expect(events).toHaveLength(1);
  });

  it('save/get RuntimeGuard round trip', async () => {
    const rg = {
      ok: true, verifiedSchoolContextRequired: true, task033AcceptedProofRequired: true,
      approvedSchoolConfigRequired: true, approvedContentContextRequired: true,
      learnerMemoryBlockedBeforeSchoolContext: true, aiBlockedBeforeAllGates: true,
      liveAiBlocked: true, liveConnectorBlocked: true, liveNotificationsBlocked: true,
      crossSchoolAccessBlocked: true, crossLearnerVisibilityBlocked: true,
      parentRawDetailBlocked: true, teacherOnlyLeakageBlocked: true,
      unsafeDeenAuthorityBlocked: true, answerBotBehaviorBlocked: true, blockingIssues: [],
    };
    await task034Repository.saveExpandedRuntimeGuard(rg);
    const loaded = await task034Repository.getExpandedRuntimeGuard();
    expect(loaded).not.toBeNull();
    expect(loaded!.ok).toBe(true);
  });

  it('save/get HealthBudgetEscalation round trip', async () => {
    const hb = {
      ok: true, rolloutLatencyP95Ms: 100, safeReadLatencyP95Ms: 100,
      eventIntakeLatencyP95Ms: 100, errorRate: 0.5, criticalErrorCount: 0,
      timeoutCount: 0, privacyBoundaryFailureCount: 0, schoolContextBypassCount: 0,
      crossSchoolAttemptCount: 0, runtimeGuardDenialCount: 0,
      rollbackReadinessFailureCount: 0, healthBudgetPassed: true,
      escalationRequired: false, pauseRecommended: false, rollbackRecommended: false,
      killSwitchRecommended: false, blockingIssues: [],
    };
    await task034Repository.saveHealthBudgetEscalation(hb);
    const loaded = await task034Repository.getHealthBudgetEscalation();
    expect(loaded).not.toBeNull();
    expect(loaded!.healthBudgetPassed).toBe(true);
  });

  it('save/get IncidentEscalationBridge round trip', async () => {
    const ie = {
      ok: true, safeSeverity: 'none', safeCategory: 'no_incident',
      safeReasonCodes: [], safeSummary: 'no_incident_signals',
      pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false,
      operatorReviewRequired: false, realAlertSent: false, realEmailSent: false,
      realSmsSent: false, realWhatsappSent: false, externalTicketCreated: false,
      webhookCalled: false, rawIncidentDetailsExposed: false, blockingIssues: [],
    };
    await task034Repository.saveIncidentEscalationBridge(ie);
    const loaded = await task034Repository.getIncidentEscalationBridge();
    expect(loaded).not.toBeNull();
    expect(loaded!.ok).toBe(true);
  });

  it('save/get RollbackProtection round trip', async () => {
    const rp = {
      ok: true, rollbackAvailable: true, pauseAvailable: true, killSwitchAvailable: true,
      rollbackOwnerAssigned: true, rollbackPlanValid: true, pausePlanValid: true,
      killSwitchPlanValid: true, safeAuditPreservedOnRollback: true,
      limitedRolloutCanStopWithoutSchoolWideSideEffect: true, blockingIssues: [],
    };
    await task034Repository.saveRollbackProtection(rp);
    const loaded = await task034Repository.getRollbackProtection();
    expect(loaded).not.toBeNull();
    expect(loaded!.rollbackAvailable).toBe(true);
  });

  it('save/get PrivacyReview round trip', async () => {
    const pr = {
      ok: true, noRawLearnerData: true, noRawChat: true, noRawAnswer: true,
      noRawStudentWork: true, noParentContactData: true, noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true, noPrivateDeenText: true, noAnswerKey: true,
      noMarkingScheme: true, noProviderPrompt: true, noProviderResponse: true,
      noHiddenReasoning: true, blockingIssues: [],
    };
    await task034Repository.savePrivacyReview(pr);
    const loaded = await task034Repository.getPrivacyReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.noRawLearnerData).toBe(true);
  });

  it('save/get ContentGovernanceReview round trip', async () => {
    const cg = {
      ok: true, approvedCurriculumSourceRequired: true, noInventedTeachingClaim: true,
      noAnswerKeyLeakage: true, noMarkingSchemeLeakage: true,
      noTeacherOnlyLeakage: true, blockingIssues: [],
    };
    await task034Repository.saveContentGovernanceReview(cg);
    const loaded = await task034Repository.getContentGovernanceReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.ok).toBe(true);
  });

  it('save/get SocraticIntegrityReview round trip', async () => {
    const si = {
      ok: true, socraticGuidancePreserved: true, noFinalAnswerBotBehavior: true,
      cheatingPreventionPreserved: true, hintLadderPreserved: true,
      studentReasoningFirstPreserved: true, teacherEscalationAvailable: true,
      blockingIssues: [],
    };
    await task034Repository.saveSocraticIntegrityReview(si);
    const loaded = await task034Repository.getSocraticIntegrityReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.socraticGuidancePreserved).toBe(true);
  });

  it('save/get DeenBoundaryReview round trip', async () => {
    const db = {
      ok: true, notAFatwaEngine: true, approvedDeenSourcesRequired: true,
      teacherScholarReferralPreserved: true, noPietyScoring: true,
      noRawSafeguardingExposure: true, noUnsafeAuthorityClaim: true, blockingIssues: [],
    };
    await task034Repository.saveDeenBoundaryReview(db);
    const loaded = await task034Repository.getDeenBoundaryReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.notAFatwaEngine).toBe(true);
  });

  it('save/get SchoolIdentityReview round trip', async () => {
    const si = {
      ok: true, verifiedSchoolIdentityRequired: true, unknownSchoolDenied: true,
      crossSchoolAccessDenied: true, actorRoleRequired: true,
      noSessionBeforeSchoolContext: true, noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true, noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    };
    await task034Repository.saveSchoolIdentityReview(si);
    const loaded = await task034Repository.getSchoolIdentityReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.verifiedSchoolIdentityRequired).toBe(true);
  });

  it('save/get CrossSchoolDenialReview round trip', async () => {
    const cs = {
      ok: true, crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true, noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true, safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    };
    await task034Repository.saveCrossSchoolDenialReview(cs);
    const loaded = await task034Repository.getCrossSchoolDenialReview();
    expect(loaded).not.toBeNull();
    expect(loaded!.crossSchoolAttemptsBlocked).toBe(true);
  });

  it('save/get SafeRolloutReadModel round trip', async () => {
    const model = {
      rolloutSessionId: 'rs1', task033ObservationSessionId: 'o1', activationId: 'a1',
      schoolId: 's1', tenantId: 't1', cohortId: 'c1', rolloutPercent: 20,
      studentCount: 10, status: 'created' as const, stage: 'created',
      safeAggregate: null, healthStatus: 'pass' as const, privacyStatus: 'pass' as const,
      governanceStatus: 'pass' as const, socraticStatus: 'pass' as const,
      deenStatus: 'pass' as const, schoolIdentityStatus: 'pass' as const,
      incidentStatus: 'pass' as const, rollbackProtectionStatus: 'pass' as const,
      staffReadinessStatus: 'pass' as const, learnerNoticeReadinessStatus: 'pass' as const,
      safeToStartTask035: false, safeToStartTask040: false,
      safeReasonCodes: [], generatedAt: 'ts',
    };
    await task034Repository.saveSafeRolloutReadModel(model);
    const loaded = await task034Repository.getSafeRolloutReadModel('rs1');
    expect(loaded).not.toBeNull();
    expect(loaded!.rolloutSessionId).toBe('rs1');
  });

  it('append/get EvidenceLedger round trip', async () => {
    const event = {
      eventId: 'evt_l1', sessionId: 'sess_e1', evidenceType: 'privacy_pass',
      safeDescription: 'Privacy check passed', safeReasonCodes: ['privacy_ok'],
      timestamp: 'ts', actorRole: 'internal_operator' as const,
    };
    await task034Repository.appendEvidenceEvent(event);
    const ledger = await task034Repository.getEvidenceLedger('sess_e1');
    expect(ledger.totalCount).toBe(1);
    expect(ledger.events).toHaveLength(1);
    expect(ledger.events[0].eventId).toBe('evt_l1');
  });

  it('save/get Diagnostics round trip', async () => {
    const diag = {
      ok: true, sessionId: 's1', dependencyProofLoaded: true, environmentGatePassed: true,
      configPassed: true, capGatePassed: true, cohortEligibilityPassed: true,
      staffReadinessPassed: true, learnerNoticeReadinessPassed: true,
      stateMachineConsistent: true, eventIntakeWorking: true,
      runtimeGuardWorking: true, healthBudgetWorking: true,
      incidentEscalationWorking: true, rollbackProtectionWorking: true,
      privacyReviewWorking: true, contentGovernanceReviewWorking: true,
      socraticReviewWorking: true, deenReviewWorking: true,
      schoolIdentityReviewWorking: true, crossSchoolDenialReviewWorking: true,
      safeReadModelWorking: true, evidenceLedgerWorking: true,
      reportGenerationWorking: true, blockingIssues: [], diagnosticDetails: {},
    };
    await task034Repository.saveDiagnostics(diag);
    const loaded = await task034Repository.getDiagnostics();
    expect(loaded).not.toBeNull();
    expect(loaded!.ok).toBe(true);
  });

  it('save/get PostLimitedRolloutDecision round trip', async () => {
    const decision = {
      safeToStartTask035: false, safeToStartTask040: false,
      finalDecision: 'TASK_034_BLOCKED' as const,
      remainingBlockers: ['test'], generatedAt: 'ts',
    };
    await task034Repository.savePostLimitedRolloutDecision(decision);
    const loaded = await task034Repository.getPostLimitedRolloutDecision();
    expect(loaded).not.toBeNull();
    expect(loaded!.finalDecision).toBe('TASK_034_BLOCKED');
  });

  it('save/get Report round trip', async () => {
    const report = {
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
    };
    await task034Repository.saveReport(report);
    const loaded = await task034Repository.getLatestReport();
    expect(loaded).not.toBeNull();
    expect(loaded!.taskId).toBe('task-034');
  });

  it('stores do not leak between operations after clear', async () => {
    await task034Repository.saveTask033DependencyProof({
      ok: true, reportFound: true, opsReportFound: true, verdict: 'ok',
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
    } as any);
    await task034Repository.clearTask034StoresForTests();
    const proof = await task034Repository.getTask033DependencyProof();
    expect(proof).toBeNull();
  });
});
