import { describe, it, expect, beforeEach } from 'vitest';
import { generateTask032ControlledCanaryActivationReport } from '../services/task032CanaryActivationReportService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import type { Task032Task031DependencyProof } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Report Generation Service', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  async function seedMinimalData(): Promise<void> {
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

    const record = {
      activationId: 'act_report_001', schoolId: 'school_task032_canary_safe',
      status: 'activated_internal' as any, configuredCohortSize: 25,
      safeStage: 'activated_internal', healthBudgetStatus: 'passed' as any,
      privacyBoundaryStatus: 'passed' as any, rollbackReadinessStatus: 'passed' as any,
      incidentBridgeStatus: 'passed' as any, safeToStartTask033: true,
      reasonCodes: ['activated'], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), blockers: []
    };
    await task032ControlledCanaryActivationRepository.createActivationRecord(record);
  }

  it('should generate report with taskId TASK-032', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.taskId).toBe('TASK-032');
  });

  it('should have correct scope', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.scope).toBe('controlled-canary-activation-runtime-backend');
  });

  it('should have task031DependencyCommit bfcf5af', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task031DependencyCommit).toBe('bfcf5af');
  });

  it('should set task032Started true', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task032Started).toBe(true);
  });

  it('should set task033Started false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task033Started).toBe(false);
  });

  it('should set task034Started false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task034Started).toBe(false);
  });

  it('should set task035Started false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task035Started).toBe(false);
  });

  it('should set task040Started false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.task040Started).toBe(false);
  });

  it('should set frontendUiCreated false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.frontendUiCreated).toBe(false);
  });

  it('should set productionDeploymentIntroduced false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.productionDeploymentIntroduced).toBe(false);
  });

  it('should set realNotificationsSent false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.realNotificationsSent).toBe(false);
  });

  it('should set liveAiCallIntroduced false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.liveAiCallIntroduced).toBe(false);
  });

  it('should set liveSchoolConnectorWriteIntroduced false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.liveSchoolConnectorWriteIntroduced).toBe(false);
  });

  it('should set productionDataMutationExecuted false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.productionDataMutationExecuted).toBe(false);
  });

  it('should set uncontrolledProductionMutationExecuted false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.uncontrolledProductionMutationExecuted).toBe(false);
  });

  it('should set realStudentDataExposed false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.realStudentDataExposed).toBe(false);
  });

  it('should set rawPrivateDataStored false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.rawPrivateDataStored).toBe(false);
  });

  it('should set canaryObservationCreated false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.canaryObservationCreated).toBe(false);
  });

  it('should set rolloutCreated false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.rolloutCreated).toBe(false);
  });

  it('should set schoolWideLaunchCreated false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.schoolWideLaunchCreated).toBe(false);
  });

  it('should set backendFreezeCreated false', async () => {
    await seedMinimalData();
    const report = await generateTask032ControlledCanaryActivationReport({});
    expect(report.backendFreezeCreated).toBe(false);
  });
});
