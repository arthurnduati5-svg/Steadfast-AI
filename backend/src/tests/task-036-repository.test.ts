import { describe, it, expect, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

describe('Task036LiveSchoolLaunchRepository', () => {
  beforeEach(() => {
    task036Repository.clearTask036StoresForTests();
  });

  it('clearTask036StoresForTests resets all stores', () => {
    const session: any = {
      sessionId: 's-1', schoolId: 'sch-1', tenantId: 't-1',
      status: 'created', launchWindowId: '', approvalId: '',
      operatorId: '', createdAt: '', updatedAt: '', blockingIssues: [],
    };
    task036Repository.saveLaunchSession(session);
    expect(task036Repository.getLaunchSession('s-1')).toBeDefined();
    task036Repository.clearTask036StoresForTests();
    expect(task036Repository.getLaunchSession('s-1')).toBeUndefined();
  });

  describe('Task035 Dependency Proof', () => {
    it('saves and retrieves dependency proof', () => {
      const proof: any = {
        ok: true, handoffExists: true, reportExists: true,
        jsonReportExists: true, verdictIsAcceptedReadyYes: true,
        safeToStartTask036: true, safeToStartTask040: false,
        remainingBlockersEmpty: true, focusedTestsPassed: true,
        continuityTestsPassed: true, routeContractsPassed: true,
        roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
        verificationScriptPassed: true, typeScriptPassed: true,
        backendBuildPassed: true, prismaValidatePassed: true,
        prismaGeneratePassed: true, noTask036InsideTask035: true,
        noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
        noLiveLaunchInsideTask035: true, blockingIssues: [],
        loadedAt: new Date().toISOString(),
      };
      task036Repository.saveTask035DependencyProof(proof);
      const retrieved = task036Repository.getTask035DependencyProof();
      expect(retrieved).toEqual(proof);
      expect(retrieved!.ok).toBe(true);
    });

    it('returns null when no proof saved', () => {
      expect(task036Repository.getTask035DependencyProof()).toBeNull();
    });
  });

  describe('Environment Gate', () => {
    it('saves and retrieves environment gate result', () => {
      const result: any = {
        ok: true, passed: true, environmentType: 'test', launchMode: 'single_school_controlled_live_launch',
        dataMode: 'safe', sideEffectMode: 'read', task035Accepted: true,
        task036Started: true, task040Started: false, singleSchoolScope: true,
        multiSchoolScope: false, publicLaunchRequested: false,
        marketingLaunchRequested: false, paymentLaunchRequested: false,
        backendFreezeRequested: false, frontendUiRequested: false,
        liveAiExpansionRequested: false, liveConnectorWriteExpansionRequested: false,
        externalNotificationRequested: false, productionDeploymentRequested: false,
        productionMutationRequested: false, blockingIssues: [],
      };
      task036Repository.saveEnvironmentGate('gate-1', result);
      const retrieved = task036Repository.getEnvironmentGate('gate-1');
      expect(retrieved).toEqual(result);
      expect(retrieved!.passed).toBe(true);
    });

    it('returns undefined for unknown gate', () => {
      expect(task036Repository.getEnvironmentGate('unknown')).toBeUndefined();
    });
  });

  describe('Launch Window', () => {
    it('saves and retrieves launch window result', () => {
      const result: any = {
        ok: true, passed: true, launchWindowId: 'lw-1', schoolId: 's-1', tenantId: 't-1',
        approvedStartAt: '', approvedEndAt: '', approvalReferenceId: '',
        rollbackPlanId: 'rb-1', pausePlanId: 'pp-1', killSwitchId: 'ks-1',
        operatorId: 'op-1', isExpired: false, isOpenEnded: false,
        isWithinApprovedTime: true, hasRollbackPlan: true, hasPausePlan: true,
        hasKillSwitch: true, blockingIssues: [],
      };
      task036Repository.saveLaunchWindow('lw-1', result);
      const retrieved = task036Repository.getLaunchWindow('lw-1');
      expect(retrieved).toEqual(result);
      expect(retrieved!.hasRollbackPlan).toBe(true);
    });
  });

  describe('Launch Sessions', () => {
    it('saves and retrieves launch sessions', () => {
      const session: any = {
        sessionId: 'sess-1', schoolId: 'sch-1', tenantId: 't-1',
        status: 'created', launchWindowId: 'lw-1', approvalId: 'a-1',
        operatorId: 'op-1', createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z', blockingIssues: [],
      };
      task036Repository.saveLaunchSession(session);
      const retrieved = task036Repository.getLaunchSession('sess-1');
      expect(retrieved).toEqual(session);
    });

    it('listLaunchSessions returns all sessions', () => {
      const s1: any = { sessionId: 's1', schoolId: 'sch-1', tenantId: 't-1', status: 'created', launchWindowId: '', approvalId: '', operatorId: '', createdAt: '', updatedAt: '', blockingIssues: [] };
      const s2: any = { sessionId: 's2', schoolId: 'sch-1', tenantId: 't-1', status: 'blocked', launchWindowId: '', approvalId: '', operatorId: '', createdAt: '', updatedAt: '', blockingIssues: [] };
      task036Repository.saveLaunchSession(s1);
      task036Repository.saveLaunchSession(s2);
      const all = task036Repository.listLaunchSessions();
      expect(all.length).toBe(2);
      expect(all.map(s => s.sessionId)).toContain('s1');
      expect(all.map(s => s.sessionId)).toContain('s2');
    });
  });

  describe('Launch Events', () => {
    it('saves and retrieves launch events', () => {
      const event: any = {
        eventId: 'evt-1', sessionId: 'sess-1', eventType: 'gate_passed',
        safeSummary: 'Environment gate passed', timestamp: '2026-01-01T00:00:00Z',
      };
      task036Repository.saveLaunchEvent(event);
      const retrieved = task036Repository.getLaunchEvent('evt-1');
      expect(retrieved).toEqual(event);
    });

    it('listLaunchEventsForSession filters by session', () => {
      const e1: any = { eventId: 'e1', sessionId: 's1', eventType: 'pass', safeSummary: 'ok', timestamp: '' };
      const e2: any = { eventId: 'e2', sessionId: 's1', eventType: 'fail', safeSummary: 'fail', timestamp: '' };
      const e3: any = { eventId: 'e3', sessionId: 's2', eventType: 'pass', safeSummary: 'ok', timestamp: '' };
      task036Repository.saveLaunchEvent(e1);
      task036Repository.saveLaunchEvent(e2);
      task036Repository.saveLaunchEvent(e3);
      const s1Events = task036Repository.listLaunchEventsForSession('s1');
      expect(s1Events.length).toBe(2);
      const s2Events = task036Repository.listLaunchEventsForSession('s2');
      expect(s2Events.length).toBe(1);
    });
  });

  describe('Evidence Ledger', () => {
    it('appends and retrieves evidence events', () => {
      const event: any = {
        eventId: 'evt-1', sessionId: 'sess-1', eventType: 'gate_passed',
        safeSummary: 'Approval passed', actorRole: 'school_admin',
        timestamp: '2026-01-01T00:00:00Z',
      };
      task036Repository.appendEvidenceEvent(event);
      const ledger = task036Repository.getEvidenceLedger('sess-1');
      expect(ledger.totalEventCount).toBe(1);
      expect(ledger.events[0].eventId).toBe('evt-1');
      expect(ledger.sessionId).toBe('sess-1');
    });

    it('getEvidenceLedger returns all events when no sessionId', () => {
      task036Repository.appendEvidenceEvent({ eventId: 'e1', sessionId: 's1', eventType: 'pass', safeSummary: 'ok', actorRole: 'operator', timestamp: '' });
      task036Repository.appendEvidenceEvent({ eventId: 'e2', sessionId: 's2', eventType: 'fail', safeSummary: 'nok', actorRole: 'operator', timestamp: '' });
      const all = task036Repository.getEvidenceLedger();
      expect(all.totalEventCount).toBe(2);
      expect(all.sessionId).toBe('all');
    });
  });

  describe('Reports', () => {
    it('saves and retrieves latest report', () => {
      const report1: any = { taskId: 'task036', verdict: 'PENDING', filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [], commandsRun: [], generatedAt: '' };
      const report2: any = { taskId: 'task036', verdict: 'ACCEPTED_READY_YES', filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [], commandsRun: [], generatedAt: '' };
      task036Repository.saveReport(report1);
      task036Repository.saveReport(report2);
      const latest = task036Repository.getLatestReport();
      expect(latest!.verdict).toBe('ACCEPTED_READY_YES');
    });

    it('getLatestReport returns undefined when no reports', () => {
      expect(task036Repository.getLatestReport()).toBeUndefined();
    });
  });

  describe('All Gate Result Stores', () => {
    it('saves and retrieves each gate type independently', () => {
      const approval: any = { ok: true, passed: true, approvalId: 'a-1', role: 'school_admin', roleValid: true, roleHasApprovalAuthority: true, withinSchoolScope: true, noRawPrivateDataReference: true, noPublicLaunchRequest: true, noMultiSchoolLaunchRequest: true, noBackendFreezeRequest: true, blockingIssues: [] };
      task036Repository.saveLaunchApproval('a-1', approval);
      expect(task036Repository.getLaunchApproval('a-1')).toEqual(approval);

      const scope: any = { ok: true, passed: true, schoolId: 's-1', tenantId: 't-1', approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true, singleSchoolScope: true, multiSchoolScope: false, crossSchoolAccessDenied: true, publicSignupDisabled: true, openRegistrationDisabled: true, paymentFlowDisabled: true, marketingLaunchDisabled: true, blockingIssues: [] };
      task036Repository.saveSingleSchoolScope('s-1', scope);
      expect(task036Repository.getSingleSchoolScope('s-1')).toEqual(scope);

      const runtime: any = { ok: true, activeLaunchSessionCount: 0, safeRequestCount: 0, safeDeniedRequestCount: 0, runtimeGuardDenialCount: 0, schoolContextBypassAttemptCount: 0, crossSchoolAttemptCount: 0, privacyBoundaryFailureCount: 0, contentGovernanceFailureCount: 0, socraticIntegrityFailureCount: 0, deenBoundaryFailureCount: 0, incidentSignalCount: 0, criticalIncidentSignalCount: 0, pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false, generatedAt: '', blockingIssues: [] };
      task036Repository.saveRuntimeMonitoring('sess-1', runtime);
      expect(task036Repository.getRuntimeMonitoring('sess-1')).toEqual(runtime);

      const health: any = { ok: true, launchLatencyP95Ms: 100, safeReadLatencyP95Ms: 50, runtimeMonitorLatencyP95Ms: 10, errorRate: 0, criticalErrorCount: 0, timeoutCount: 0, privacyBoundaryFailureCount: 0, schoolContextBypassCount: 0, crossSchoolAttemptCount: 0, rollbackReadinessFailureCount: 0, healthBudgetPassed: true, pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false, blockingIssues: [] };
      task036Repository.saveHealthBudget('sess-1', health);
      expect(task036Repository.getHealthBudget('sess-1')).toEqual(health);

      const incident: any = { ok: true, incidentDetectionReady: true, incidentClassificationReady: true, incidentResponseReady: true, incidentEscalationReady: true, incidentAuditReady: true, pausePlanReady: true, rollbackPlanReady: true, killSwitchReady: true, blockingIssues: [] };
      task036Repository.saveIncidentReadiness('sess-1', incident);
      expect(task036Repository.getIncidentReadiness('sess-1')).toEqual(incident);

      const pause: any = { ok: true, paused: true, pauseReasonCodes: [], sessionId: 'sess-1', pausedAt: '', auditPreserved: true, externalNotificationSent: false, productionMutated: false, blockingIssues: [] };
      task036Repository.savePauseControl('sess-1', pause);
      expect(task036Repository.getPauseControl('sess-1')).toEqual(pause);

      const rb: any = { ok: true, rollbackRequested: true, rollbackReasonCodes: [], sessionId: 'sess-1', rollbackRequestedAt: '', auditPreserved: true, destructiveDatabaseCommandsRun: false, deploymentPerformed: false, externalServicesCalled: false, blockingIssues: [] };
      task036Repository.saveRollbackControl('sess-1', rb);
      expect(task036Repository.getRollbackControl('sess-1')).toEqual(rb);

      const ks: any = { ok: true, killSwitchEnabled: true, killSwitchReasonCodes: [], sessionId: 'sess-1', killSwitchEnabledAt: '', auditPreserved: true, dataDeleted: false, externalServicesCalled: false, blockingIssues: [] };
      task036Repository.saveKillSwitchControl('sess-1', ks);
      expect(task036Repository.getKillSwitchControl('sess-1')).toEqual(ks);

      const pb: any = { ok: true, passed: true, rawStudentChatExposed: false, rawAnswersExposed: false, rawSafeguardingNotesExposed: false, rawDeenTextExposed: false, rawProviderPayloadExposed: false, parentContactExposed: false, teacherPrivateNotesExposed: false, hiddenReasoningExposed: false, secretsExposed: false, answerKeyExposed: false, markingSchemeExposed: false, blockingIssues: [] };
      task036Repository.savePrivacyBoundary('sess-1', pb);
      expect(task036Repository.getPrivacyBoundary('sess-1')).toEqual(pb);

      const cg: any = { ok: true, passed: true, approvedSourceRequired: true, unapprovedContentBlocked: true, curriculumGatePassed: true, teacherOnlyContentProtected: true, noInventedTeachingClaim: true, blockingIssues: [] };
      task036Repository.saveContentGovernance('sess-1', cg);
      expect(task036Repository.getContentGovernance('sess-1')).toEqual(cg);
    });
  });

  describe('Save & Load Complex Models', () => {
    it('saves and loads final launch decision', () => {
      const decision: any = {
        safeToStartTask040: true,
        finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040',
        remainingBlockers: [],
        allGatesPassed: true,
        dependencyProofPassed: true,
        environmentGatePassed: true,
        launchWindowPassed: true,
        launchApprovalPassed: true,
        singleSchoolScopePassed: true,
        privacyBoundaryPassed: true,
        contentGovernancePassed: true,
        socraticIntegrityPassed: true,
        deenBoundaryPassed: true,
        schoolIdentityPassed: true,
        crossSchoolDenialPassed: true,
        runtimeMonitoringPassed: true,
        healthBudgetPassed: true,
        incidentReadinessPassed: true,
        computedAt: new Date().toISOString(),
      };
      task036Repository.saveFinalLaunchDecision('sess-1', decision);
      const loaded = task036Repository.getFinalLaunchDecision('sess-1');
      expect(loaded).toEqual(decision);
      expect(loaded!.safeToStartTask040).toBe(true);
    });

    it('saves and loads safe launch read model', () => {
      const model: any = {
        ok: true, sessionId: 'sess-1', schoolId: 'sch-1',
        status: 'launch_ready', launchWindowResult: null,
        environmentGateResult: null, approvalResult: null,
        singleSchoolScopeResult: null, privacyBoundaryResult: null,
        contentGovernanceResult: null, socraticIntegrityResult: null,
        deenBoundaryResult: null, schoolIdentityResult: null,
        crossSchoolDenialResult: null, runtimeMonitoringResult: null,
        healthBudgetResult: null, incidentReadinessResult: null,
        safeSummariesOnly: true, generatedAt: new Date().toISOString(),
      };
      task036Repository.saveSafeLaunchReadModel('sess-1', model);
      const loaded = task036Repository.getSafeLaunchReadModel('sess-1');
      expect(loaded).toEqual(model);
      expect(loaded!.safeSummariesOnly).toBe(true);
    });

    it('saves and loads diagnostics', () => {
      const diag: any = {
        ok: true, sessionId: 'sess-1', status: 'launch_ready',
        totalGates: 15, gatesPassed: 15, gatesFailed: 0, gatesPending: 0,
        blockingIssueCount: 0, healthBudgetPassed: true,
        incidentReadinessPassed: true, pauseReady: true,
        rollbackReady: true, killSwitchReady: true,
        generatedAt: new Date().toISOString(),
      };
      task036Repository.saveDiagnostics('sess-1', diag);
      const loaded = task036Repository.getDiagnostics('sess-1');
      expect(loaded).toEqual(diag);
      expect(loaded!.totalGates).toBe(15);
    });
  });
});
