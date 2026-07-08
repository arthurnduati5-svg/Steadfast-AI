import { describe, it, expect, beforeEach } from 'vitest';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationsReadinessRepository', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should store and retrieve monitoring readiness results', async () => {
    const result: any = { status: 'healthy', healthProbeCovered: true, readinessProbeCovered: true, schoolAuthGateMonitored: true, task020GovernanceMonitored: true, task021SchoolIntegrationMonitored: true, task022ContentGovernanceMonitored: true, task023ReadinessMonitored: true, errorRateMonitored: true, latencyMonitored: true, aiEgressBlockMonitored: true, privacyEventMonitored: true, backupRestoreMonitored: true, dataIntegrityMonitored: true, missingCategories: [], safeSummary: 'ok' };
    await task024ReadinessRepository.recordMonitoringReadinessResult(result);
    const list = await task024ReadinessRepository.listMonitoringReadinessResults();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe('healthy');
  });

  it('should store and retrieve alert policy results', async () => {
    await task024ReadinessRepository.recordAlertPolicyResult({ policyDefined: true, alertCategories: ['test'], severity: 'info', owner: 'test_owner', escalationPath: 'test_path', thresholdDefined: true, safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listAlertPolicyResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve incident response plans', async () => {
    await task024ReadinessRepository.recordIncidentResponsePlan({ incidentId: 'inc_1', category: 'test', severity: 'sev3_limited_feature_degradation', owner: 'owner1', escalationPath: 'path1', containmentSteps: [], mitigationSteps: [], postmortemRequired: false, safeSummary: 'plan' });
    const plan = await task024ReadinessRepository.getIncidentResponsePlan('inc_1');
    expect(plan).toBeDefined();
    expect(plan!.incidentId).toBe('inc_1');
  });

  it('should store and retrieve incident severity decisions', async () => {
    await task024ReadinessRepository.recordIncidentSeverityDecision({ incidentId: 'inc_1', severity: 'sev0_school_wide_safety_or_privacy', requiresImmediateContainment: true, requiresSafeguardingEscalation: false, requiresPrivacyEscalation: true, requiresSchoolAdminNotification: true, requiresPostmortem: true, safeReasonCode: 'test' });
    const list = await task024ReadinessRepository.listIncidentSeverityDecisions();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve backup readiness results', async () => {
    await task024ReadinessRepository.recordBackupReadinessResult({ status: 'ready', scopeDefined: true, ownerDefined: true, scheduleDefined: true, integrityCheckDefined: true, privacyBoundaryDefined: true, noRawOutput: true, safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listBackupReadinessResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve restore drill dry-run results', async () => {
    await task024ReadinessRepository.recordRestoreDrillDryRunResult({ status: 'dry_run_passed', dryRunMode: true, restorePlanDefined: true, ownerDefined: true, integrityVerificationDefined: true, privacyBoundaryDefined: true, rollbackDefined: true, realRestoreBlocked: true, safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listRestoreDrillDryRunResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve data integrity results', async () => {
    await task024ReadinessRepository.recordOperationalDataIntegrityResult({ status: 'passed', schoolIdentityIntegrity: true, rosterMappingIntegrity: true, task020GovernanceIntegrity: true, task021SchoolIntegrationIntegrity: true, task022ContentGovernanceIntegrity: true, task023ReadinessIntegrity: true, phase3MetadataIntegrity: true, auditEventIntegrity: true, noOrphanedCriticalRecords: true, issues: [], safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listOperationalDataIntegrityResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve privacy guard results', async () => {
    await task024ReadinessRepository.recordOperationsPrivacyGuardResult({ passed: true, secretsStripped: true, rawLearnerDataStripped: true, rawSafeguardingDataStripped: true, privateDeenTextStripped: true, providerPayloadsStripped: true, answerArtifactsStripped: true, rawBackupRestorePayloadsStripped: true, forbiddenFieldsDetected: [], safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listOperationsPrivacyGuardResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve safe operations summaries', async () => {
    await task024ReadinessRepository.recordSafeOperationsSummary({ monitoringSummary: 'ok', incidentSummary: 'ok', backupRestoreSummary: 'ok', dataIntegritySummary: 'ok', loadPerformanceSummary: 'ok', governanceContinuitySummary: 'ok', overallSafeSummary: 'ok', createdAt: new Date().toISOString() });
    const list = await task024ReadinessRepository.listSafeOperationsSummaries();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve load simulation results', async () => {
    await task024ReadinessRepository.recordLoadSimulationResult({ status: 'passed', simulationId: 'sim_1', targetComponents: ['auth'], durationMs: 100, throughputPerSecond: 50, errorCount: 0, liveAiCalled: false, liveConnectorCalled: false, safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listLoadSimulationResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve performance baseline results', async () => {
    await task024ReadinessRepository.recordPerformanceBaselineResult({ status: 'baseline_recorded', latencyMs: 100, errorRate: 0.01, throughputPerSecond: 50, backpressureLevel: 'low', thresholdLatencyMs: 5000, thresholdErrorRate: 0.05, thresholdThroughput: 50, thresholdBackpressure: 'moderate', thresholdExceeded: false, safeSummary: 'ok' });
    const list = await task024ReadinessRepository.listPerformanceBaselineResults();
    expect(list).toHaveLength(1);
  });

  it('should store and retrieve readiness decisions', async () => {
    await task024ReadinessRepository.recordOperationsReadinessDecision({ decision: 'ready', monitoringReady: true, alertPolicyReady: true, incidentWorkflowReady: true, incidentSeverityReady: true, backupReady: true, restoreDryRunReady: true, dataIntegrityReady: true, privacyGuardReady: true, loadSimulationReady: true, performanceBaselineReady: true, runbookValidationReady: true, task023DependencyReady: true, governanceContinuityReady: true, blockingReasons: [], warningReasons: [], evaluatedAt: new Date().toISOString() });
    const latest = await task024ReadinessRepository.getLatestOperationsReadinessDecision();
    expect(latest).toBeDefined();
    expect(latest!.decision).toBe('ready');
  });

  it('should store only safe metadata - no raw values', async () => {
    await task024ReadinessRepository.recordOperationsAuditEvent({
      eventId: 'e1', actorId: 'admin1', actorRole: 'admin', operationEnvironment: 'local', component: 'test', eventType: 'operations_readiness_evaluated', safeReasonCodes: ['test'], safeMetadata: { count: 1 }, createdAt: new Date().toISOString(),
    });
    const events = await task024ReadinessRepository.listOperationsAuditEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('e1');
    expect(events[0].safeMetadata?.count).toBe(1);
  });

  it('should reset for tests', async () => {
    await task024ReadinessRepository.recordBackupReadinessResult({ status: 'ready', scopeDefined: true, ownerDefined: true, scheduleDefined: true, integrityCheckDefined: true, privacyBoundaryDefined: true, noRawOutput: true, safeSummary: 'ok' });
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
    const list = await task024ReadinessRepository.listBackupReadinessResults();
    expect(list).toHaveLength(0);
  });
});
