import { describe, it, expect, beforeEach } from 'vitest';
import { Task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

describe('Task 032 - In-Memory Repository', () => {
  let repo: Task032ControlledCanaryActivationRepository;

  beforeEach(async () => {
    repo = new Task032ControlledCanaryActivationRepository();
  });

  describe('Task 031 Dependency Proof', () => {
    it('should record and retrieve the latest dependency proof', async () => {
      const proof = {
        ok: true,
        commitFound: true,
        task031ReportFound: true,
        task031OpsReportFound: true,
        verdict: 'ACCEPTED_READY_YES',
        safeToStartTask032: true,
        safeToStartTask033: false,
        safeToStartTask034: false,
        safeToStartTask035: false,
        safeToStartTask040: false,
        task031FocusedTestsPassed: true,
        task020To030RegressionPassed: true,
        phase3RegressionPassed: true,
        fullBackendSuitePassed: true,
        backendBuildPassed: true,
        backendTypecheckPassed: true,
        prismaValidatePassed: true,
        prismaGeneratePassed: true,
        task031VerificationScriptPassed: true,
        privacyScanPassed: true,
        noProductionMutationScanPassed: true,
        noLiveConnectorAiScanPassed: true,
        noLiveNotificationScanPassed: true,
        noFrontendUiScanPassed: true,
        noTask032ToTask040ScanPassed: true,
        noFalsePassScanPassed: true,
        remainingBlockers: [],
        blockingIssues: [],
      };
      await repo.recordTask031DependencyProof(proof);
      const retrieved = await repo.getLatestTask031DependencyProof();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.ok).toBe(true);
      expect(retrieved!.verdict).toBe('ACCEPTED_READY_YES');
    });

    it('should return null when no proof recorded', async () => {
      const result = await repo.getLatestTask031DependencyProof();
      expect(result).toBeNull();
    });

    it('should overwrite proof on subsequent record', async () => {
      await repo.recordTask031DependencyProof({ ok: false } as any);
      await repo.recordTask031DependencyProof({ ok: true } as any);
      const retrieved = await repo.getLatestTask031DependencyProof();
      expect(retrieved!.ok).toBe(true);
    });
  });

  describe('Environment Gate', () => {
    it('should record and list environment gates', async () => {
      const result = {
        ok: true, environmentTypeValid: true, activationModeValid: true,
        dataModeValid: true, sideEffectModeValid: true,
        productionDeploymentBlocked: true, liveNotificationBlocked: true,
        liveAiBlocked: true, liveSchoolConnectorBlocked: true,
        productionMutationBlocked: true, canaryObservationBlocked: true,
        rolloutBlocked: true, schoolWideLaunchBlocked: true,
        backendFreezeBlocked: true, blockingIssues: [], passed: true,
      };
      await repo.recordEnvironmentGate(result);
      const list = await repo.listEnvironmentGates();
      expect(list).toHaveLength(1);
      expect(list[0].ok).toBe(true);
      expect(list[0].passed).toBe(true);
    });

    it('should list multiple environment gates', async () => {
      await repo.recordEnvironmentGate({ ok: true } as any);
      await repo.recordEnvironmentGate({ ok: false } as any);
      const list = await repo.listEnvironmentGates();
      expect(list).toHaveLength(2);
    });

    it('should return empty array when no gates recorded', async () => {
      const list = await repo.listEnvironmentGates();
      expect(list).toEqual([]);
    });
  });

  describe('Approved School Canary Config', () => {
    it('should record and retrieve config by configId', async () => {
      const config = {
        configId: 'cfg_001', schoolId: 'school_task032_safe',
        approvedByRole: 'school_admin', activationMode: 'internal_controlled_activation',
        maxCanaryLearners: 25, allowedClassIds: ['class_001'], allowedSubjectIds: ['subj_001'],
        allowedCohortIds: ['cohort_001'], canaryStartWindow: '', canaryEndWindow: '',
        rollbackPolicyId: 'rp_001', incidentPolicyId: 'ip_001', privacyBoundaryId: 'pb_001',
        healthBudgetId: 'hb_001', consentAuthorizationPolicyId: 'cap_001',
        sourceGovernancePolicyId: 'sgp_001', deenBoundaryPolicyId: 'dbp_001',
        socraticIntegrityPolicyId: 'sip_001', blockingIssues: [],
      };
      await repo.recordApprovedSchoolCanaryConfig(config);
      const retrieved = await repo.getApprovedSchoolCanaryConfig('cfg_001');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.schoolId).toBe('school_task032_safe');
      expect(retrieved!.maxCanaryLearners).toBe(25);
    });

    it('should return null for non-existent config', async () => {
      const result = await repo.getApprovedSchoolCanaryConfig('nonexistent');
      expect(result).toBeNull();
    });

    it('should list all approved configs', async () => {
      await repo.recordApprovedSchoolCanaryConfig({ configId: 'cfg_001' } as any);
      await repo.recordApprovedSchoolCanaryConfig({ configId: 'cfg_002' } as any);
      const list = await repo.listApprovedSchoolCanaryConfigs();
      expect(list).toHaveLength(2);
    });
  });

  describe('Cohort Eligibility', () => {
    it('should record and list cohort eligibility results', async () => {
      const result = {
        ok: true, cohortApproved: true, cohortSizeWithinCap: true,
        cohortSize: 25, maxCanaryLearners: 25, schoolVerified: true,
        classBoundariesMatch: true, subjectBoundariesMatch: true,
        noExcludedLearners: true, noSafeguardingRawExposure: true,
        noCrossSchoolLearner: true, noParentContactData: true,
        noRealIdentifierLeakage: true, blockingIssues: [],
      };
      await repo.recordCohortEligibility(result);
      const list = await repo.listCohortEligibilityResults();
      expect(list).toHaveLength(1);
      expect(list[0].ok).toBe(true);
      expect(list[0].cohortApproved).toBe(true);
    });

    it('should list multiple eligibility results', async () => {
      await repo.recordCohortEligibility({ ok: true } as any);
      await repo.recordCohortEligibility({ ok: false } as any);
      expect((await repo.listCohortEligibilityResults()).length).toBe(2);
    });
  });

  describe('Consent Authorization', () => {
    it('should record and list consent authorization results', async () => {
      const result = {
        ok: true, schoolApprovalRecorded: true,
        adminOperatorAuthorizationRecorded: true, teacherReadinessAcknowledged: true,
        learnerSafeNoticeTemplateReady: true, parentGuardianNoticeTemplateReady: true,
        noRealNoticeSent: true, noSMSSent: true, noWhatsAppSent: true,
        noEmailSent: true, blockingIssues: [],
      };
      await repo.recordConsentAuthorization(result);
      const list = await repo.listConsentAuthorizationResults();
      expect(list).toHaveLength(1);
      expect(list[0].schoolApprovalRecorded).toBe(true);
      expect(list[0].noRealNoticeSent).toBe(true);
    });
  });

  describe('Privacy Boundary', () => {
    it('should record and list privacy boundary results', async () => {
      const result = {
        ok: true, rawLearnerProfilesBlocked: true, realEmailsBlocked: true,
        realPhoneNumbersBlocked: true, parentContactDataBlocked: true,
        rawChatBlocked: true, rawStudentAnswersBlocked: true,
        rawStudentWorkBlocked: true, safeguardingRawNotesBlocked: true,
        privateDeenTextBlocked: true, answerKeysBlocked: true,
        markingSchemesBlocked: true, teacherPrivateNotesBlocked: true,
        providerPromptsResponsesBlocked: true, hiddenReasoningBlocked: true,
        blockingIssues: [],
      };
      await repo.recordPrivacyBoundary(result);
      const list = await repo.listPrivacyBoundaryResults();
      expect(list).toHaveLength(1);
      expect(list[0].rawLearnerProfilesBlocked).toBe(true);
      expect(list[0].privateDeenTextBlocked).toBe(true);
    });
  });

  describe('Runtime Guard', () => {
    it('should record and list runtime guard results', async () => {
      const result = {
        ok: true, verifiedSchoolContextRequired: true,
        adminOperatorActorRequired: true, actorRoleValid: true,
        task031ProofRequired: true, approvedConfigRequired: true,
        cohortEligibilityRequired: true, consentAuthorizationReadinessRequired: true,
        privacyBoundaryRequired: true, healthBudgetRequired: true,
        rollbackReadinessRequired: true, incidentBridgeRequired: true,
        noLiveAi: true, noLiveConnector: true, noLiveNotification: true,
        noDeployment: true, noRollout: true, noObservation: true,
        blockingIssues: [],
      };
      await repo.recordRuntimeGuard(result);
      const list = await repo.listRuntimeGuardResults();
      expect(list).toHaveLength(1);
      expect(list[0].noLiveAi).toBe(true);
      expect(list[0].noDeployment).toBe(true);
    });
  });

  describe('Activation Record', () => {
    it('should create, get, update, and list activation records', async () => {
      const record = {
        activationId: 'act_001', schoolId: 'school_task032_safe',
        status: 'created' as const, configuredCohortSize: 25,
        safeStage: 'created', healthBudgetStatus: 'not_run' as const,
        privacyBoundaryStatus: 'not_run' as const,
        rollbackReadinessStatus: 'not_run' as const,
        incidentBridgeStatus: 'not_run' as const,
        safeToStartTask033: false, reasonCodes: ['created'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        blockers: [],
      };
      await repo.createActivationRecord(record);
      const retrieved = await repo.getActivationRecord('act_001');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.status).toBe('created');
      expect(retrieved!.safeToStartTask033).toBe(false);

      await repo.updateActivationRecord('act_001', { status: 'activated_internal', safeToStartTask033: true });
      const updated = await repo.getActivationRecord('act_001');
      expect(updated!.status).toBe('activated_internal');
      expect(updated!.safeToStartTask033).toBe(true);
    });

    it('should return null for non-existent activation record', async () => {
      const result = await repo.getActivationRecord('nonexistent');
      expect(result).toBeNull();
    });

    it('should list all activation records', async () => {
      await repo.createActivationRecord({ activationId: 'act_001' } as any);
      await repo.createActivationRecord({ activationId: 'act_002' } as any);
      const list = await repo.listActivationRecords();
      expect(list).toHaveLength(2);
    });

    it('updateActivationRecord should not throw for non-existent record', async () => {
      await expect(repo.updateActivationRecord('nonexistent', { status: 'blocked' })).resolves.not.toThrow();
    });
  });

  describe('Control Action', () => {
    it('should record and list control actions', async () => {
      const result = {
        ok: true, action: 'pause_internal_canary' as const,
        previousStatus: 'activated_internal' as const,
        nextStatus: 'paused' as const, blockingIssues: [],
      };
      await repo.recordControlAction(result);
      const list = await repo.listControlActions('act_001');
      expect(list).toHaveLength(1);
      expect(list[0].action).toBe('pause_internal_canary');
    });
  });

  describe('Health Budget', () => {
    it('should record and list health budget results', async () => {
      const result = {
        ok: true, activationPreflightP95Ms: 150, safeViewP95Ms: 100,
        controlActionP95Ms: 80, errorRate: 0, criticalErrorCount: 0,
        privacyBoundaryFailures: 0, schoolContextBypassCount: 0,
        crossSchoolAccessCount: 0, activationPreflightBudgetPassed: true,
        safeViewBudgetPassed: true, controlActionBudgetPassed: true,
        errorRateBudgetPassed: true, criticalErrorBudgetPassed: true,
        privacyBoundaryBudgetPassed: true, schoolContextBypassBudgetPassed: true,
        crossSchoolAccessBudgetPassed: true, overallPassed: true,
        blockingIssues: [],
      };
      await repo.recordHealthBudget(result);
      const list = await repo.listHealthBudgetResults();
      expect(list).toHaveLength(1);
      expect(list[0].overallPassed).toBe(true);
    });
  });

  describe('Incident Bridge', () => {
    it('should record and list incident bridge results', async () => {
      const result = {
        ok: true, safeIncidentReasonCodesExist: true,
        escalationLabelsExist: true, rollbackTriggerLabelsExist: true,
        safeguardingRawDetailsNotExposed: true, privateDeenTextNotExposed: true,
        noNotificationSent: true, noExternalTicketCreated: true,
        noWebhookCalled: true, blockingIssues: [],
      };
      await repo.recordIncidentBridge(result);
      const list = await repo.listIncidentBridgeResults();
      expect(list).toHaveLength(1);
      expect(list[0].noNotificationSent).toBe(true);
      expect(list[0].noExternalTicketCreated).toBe(true);
    });
  });

  describe('Safe View', () => {
    it('should record, get, and list safe views', async () => {
      const view = {
        viewId: 'view_001', activationId: 'act_001',
        schoolId: 'school_task032_safe', status: 'activated_internal',
        configuredCohortSize: 25, safeStage: 'activated_internal',
        healthBudgetStatus: 'passed', privacyBoundaryStatus: 'passed',
        rollbackReadinessStatus: 'passed', incidentBridgeStatus: 'passed',
        safeToStartTask033: true, reasonCodes: ['all_clear'],
        createdAt: new Date().toISOString(),
      };
      await repo.recordSafeView(view);
      const retrieved = await repo.getSafeView('view_001');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.safeToStartTask033).toBe(true);
      expect(retrieved!.viewId).toBe('view_001');

      const list = await repo.listSafeViews();
      expect(list).toHaveLength(1);
    });

    it('should return null for non-existent safe view', async () => {
      const result = await repo.getSafeView('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('Evidence Event', () => {
    it('should record and list evidence events by activationId', async () => {
      const event = {
        eventId: 'evt_001', activationId: 'act_001',
        stageId: 'activation_command', actorRole: 'school_admin',
        status: 'activated_internal', safeSummary: 'All checks passed',
        reasonCodes: ['success'], createdAt: new Date().toISOString(),
      };
      await repo.recordEvidenceEvent(event);
      const list = await repo.listEvidenceEvents('act_001');
      expect(list).toHaveLength(1);
      expect(list[0].stageId).toBe('activation_command');

      const otherList = await repo.listEvidenceEvents('other_act');
      expect(otherList).toHaveLength(0);
    });
  });

  describe('Diagnostics', () => {
    it('should record and list diagnostics', async () => {
      const diag = {
        ok: true, task031ProofStatus: 'passed', environmentGateStatus: 'passed',
        approvedConfigStatus: 'passed', cohortEligibilityStatus: 'passed',
        consentAuthorizationStatus: 'passed', privacyBoundaryStatus: 'passed',
        runtimeGuardStatus: 'passed', activationStateMachineStatus: 'passed',
        controlActionStatus: 'passed', healthBudgetStatus: 'passed',
        incidentBridgeStatus: 'passed', safeViewStatus: 'passed',
        evidenceLedgerStatus: 'passed', reportStatus: 'passed',
        routeMountStatus: 'passed', blockingIssues: [],
      };
      await repo.recordDiagnostics(diag);
      const list = await repo.listDiagnostics();
      expect(list).toHaveLength(1);
      expect(list[0].runtimeGuardStatus).toBe('passed');
    });
  });

  describe('Report', () => {
    it('should record, list, and get latest report', async () => {
      const report = {
        taskId: 'TASK032', scope: 'controlled_canary_activation',
        task031DependencyCommit: 'bfcf5af', task031DependencyVerified: true,
        task032Started: true, task033Started: false, task034Started: false,
        task035Started: false, task040Started: false,
        frontendUiCreated: false, productionDeploymentIntroduced: false,
        realNotificationsSent: false, liveAiCallIntroduced: false,
        liveSchoolConnectorWriteIntroduced: false,
        productionDataMutationExecuted: false,
        uncontrolledProductionMutationExecuted: false,
        realStudentDataExposed: false, rawPrivateDataStored: false,
        controlledCanaryActivationCreated: true,
        canaryObservationCreated: false, rolloutCreated: false,
        schoolWideLaunchCreated: false, backendFreezeCreated: false,
        contractsCreatedOrUpdated: true, validationCreatedOrUpdated: true,
        repositoryCreatedOrUpdated: true, servicesCreatedOrUpdated: true,
        routesCreatedOrUpdated: true, routesMountedOrDirectlyTested: true,
        verifiedSchoolContextRequired: true, task031AcceptanceRequired: true,
        canaryEnvironmentGatePassed: true, approvedSchoolCanaryConfigPassed: true,
        canaryCohortEligibilityPassed: true,
        consentAuthorizationReadinessPassed: true, privacyBoundaryPassed: true,
        runtimeGuardPassed: true, activationStateMachinePassed: true,
        activationCommandPassed: true, controlActionsPassed: true,
        healthBudgetPassed: true, incidentBridgePassed: true,
        monitoringSnapshotPlaceholderPassed: true, safeViewPassed: true,
        evidenceLedgerPassed: true, diagnosticsPassed: true, reportPassed: true,
        task032FocusedTestsRun: true, task032FocusedTestsPassed: true,
        task032FocusedTestFiles: 15, task032FocusedTestsPassedCount: 150,
        task032FocusedTestsFailedCount: 0, task020To031RegressionRun: true,
        task020To031RegressionPassed: true, phase3RegressionRun: true,
        phase3RegressionPassed: true, fullBackendSuiteRun: true,
        fullBackendSuitePassed: true, fullBackendSuiteFailedFiles: 0,
        fullBackendSuiteFailedTests: 0, prismaValidateRun: true,
        prismaValidatePassed: true, prismaGenerateRun: true,
        prismaGeneratePassed: true, backendBuildRun: true,
        backendBuildPassed: true, backendTypecheckRun: true,
        backendTypecheckPassed: true, task032VerificationScriptRun: true,
        task032VerificationScriptPassed: true, privacyScanRun: true,
        privacyScanPassed: true, noProductionMutationScanRun: true,
        noProductionMutationScanPassed: true, noLiveConnectorAiScanRun: true,
        noLiveConnectorAiScanPassed: true, noLiveNotificationScanRun: true,
        noLiveNotificationScanPassed: true, noFrontendUiScanRun: true,
        noFrontendUiScanPassed: true, noTask033ToTask040ScanRun: true,
        noTask033ToTask040ScanPassed: true, noFalsePassScanRun: true,
        noFalsePassScanPassed: true, safeToStartTask033: true,
        safeToStartTask034: false, safeToStartTask035: false,
        safeToStartTask040: false, verdict: 'TASK_032_PASS_SAFE_TO_START_TASK_033',
        commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [],
        filesIntentionallyNotStaged: [], remainingBlockers: [],
        generatedAt: new Date().toISOString(),
      };
      await repo.recordReport(report);
      const latest = await repo.getLatestReport();
      expect(latest).not.toBeNull();
      expect(latest!.verdict).toBe('TASK_032_PASS_SAFE_TO_START_TASK_033');
      expect(latest!.task032FocusedTestFiles).toBe(15);

      const list = await repo.listReports();
      expect(list).toHaveLength(1);
    });

    it('should return null for latest report when empty', async () => {
      const result = await repo.getLatestReport();
      expect(result).toBeNull();
    });

    it('getLatestReport should return the most recent report', async () => {
      const r1 = {
        taskId: 'TASK032', scope: 'test',
        task032FocusedTestsRun: true, task032FocusedTestsPassed: true,
        task032FocusedTestFiles: 0, task032FocusedTestsPassedCount: 0,
        task032FocusedTestsFailedCount: 0,
      } as any;
      const r2 = { ...r1, task032FocusedTestFiles: 15, task032FocusedTestsPassedCount: 150 };
      await repo.recordReport(r1);
      await repo.recordReport(r2);
      const latest = await repo.getLatestReport();
      expect(latest!.task032FocusedTestFiles).toBe(15);
    });
  });

  describe('clearTask032StoresForTests', () => {
    it('should clear all stores', async () => {
      await repo.recordTask031DependencyProof({ ok: true } as any);
      await repo.recordEnvironmentGate({ ok: true } as any);
      await repo.recordApprovedSchoolCanaryConfig({ configId: 'test' } as any);
      await repo.createActivationRecord({ activationId: 'test' } as any);
      await repo.recordReport({ taskId: 'TASK032' } as any);

      await repo.clearTask032StoresForTests();

      expect(await repo.getLatestTask031DependencyProof()).toBeNull();
      expect(await repo.listEnvironmentGates()).toEqual([]);
      expect(await repo.listApprovedSchoolCanaryConfigs()).toEqual([]);
      expect(await repo.listActivationRecords()).toEqual([]);
      expect(await repo.listReports()).toEqual([]);
    });
  });
});
