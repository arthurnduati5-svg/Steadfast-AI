import { describe, it, expect } from 'vitest';
import { createTask031StagingSchoolIdentityFixture, validateTask031Fixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { validateTask031TeacherOversightSmokeSync } from '../services/task031TeacherOversightSmokeService';
import { validateTask031AdminOperatorMonitoringSmokeSync } from '../services/task031AdminOperatorMonitoringSmokeService';
import { validateTask031EmbedHandoffSmokeSync } from '../services/task031EmbedHandoffSmokeService';
import { evaluateTask031LatencyErrorBudget } from '../services/task031LatencyErrorBudgetService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';
import { generateTask031Report } from '../services/task031ReportService';
import { generateTask031RoleMatrix } from '../services/task031StagingRoleMatrixService';
import { getRolePermissions031 } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - Full Canary Readiness Pipeline Smoke', () => {
  it('should load a valid staging school identity fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const validation = validateTask031Fixture(fixture);
    expect(validation.valid).toBe(true);
    expect(fixture.schoolId).toBe('school_task031_staging_safe');
    expect(fixture.tenantId).toBe('tenant_task031_staging_safe');
  });

  it('should run backend route smoke with all routes defined', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.ok).toBe(true);
    expect(result.totalRoutes).toBeGreaterThan(0);
    expect(result.healthRoutesChecked).toBe(4);
    expect(result.taskRoutesChecked).toBe(12);
    expect(result.serviceRoutesChecked).toBe(10);
    expect(result.liveConnectorCallMade).toBe(false);
    expect(result.liveAiCallMade).toBe(false);
  });

  it('should pass copilot bootstrap smoke with no AI calls or private data', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.aiProviderCallMade).toBe(false);
    expect(result.rawPrivateMemoryExposed).toBe(false);
    expect(result.rawChatHistoryExposed).toBe(false);
    expect(result.teacherOnlyNotesExposed).toBe(false);
    expect(result.answerKeysExposed).toBe(false);
  });

  it('should pass student preflight smoke with gates active', () => {
    const result = validateTask031StudentPreflightSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.schoolIdentityVerified).toBe(true);
    expect(result.stagingScopeChecked).toBe(true);
    expect(result.curriculumScopeChecked).toBe(true);
    expect(result.aiCallMade).toBe(false);
  });

  it('should pass embed handoff smoke with school context required', () => {
    const result = validateTask031EmbedHandoffSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.requiresSchoolContext).toBe(true);
    expect(result.requiresAuthenticatedActor).toBe(true);
    expect(result.rawTokenExposed).toBe(false);
    expect(result.secretsExposed).toBe(false);
  });

  it('should pass teacher oversight smoke with correct restrictions', () => {
    const result = validateTask031TeacherOversightSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.adminControlsDenied).toBe(true);
    expect(result.fullCanaryReportDenied).toBe(true);
    expect(result.rawPrivateDataHidden).toBe(true);
  });

  it('should pass admin operator monitoring smoke with rollouts unavailable', () => {
    const result = validateTask031AdminOperatorMonitoringSmokeSync();
    expect(result.ok).toBe(true);
    expect(result.liveRolloutActivationUnavailable).toBe(true);
    expect(result.aggregateMetricsOnly).toBe(true);
  });

  it('should generate role matrix with all five roles verified', () => {
    const matrix = generateTask031RoleMatrix();
    expect(matrix.ok).toBe(true);
    expect(matrix.rolesChecked).toContain('admin');
    expect(matrix.rolesChecked).toContain('operator');
    expect(matrix.rolesChecked).toContain('teacher');
    expect(matrix.rolesChecked).toContain('student');
    expect(matrix.rolesChecked).toContain('unknown');
  });

  it('should evaluate latency error budget with default baseline passing', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('smoke-test-run');
    expect(baseline.smokeRunId).toBe('smoke-test-run');
    expect(baseline.rawPrivateDataExposed).toBe(false);

    const budget = evaluateTask031LatencyErrorBudget({ baseline });
    expect(budget.overallPassed).toBe(true);
    expect(budget.latencyBudgetPassed).toBe(true);
    expect(budget.errorBudgetPassed).toBe(true);
    expect(budget.privacyBudgetPassed).toBe(true);
  });

  it('should generate a complete report with all pipeline stages passing', async () => {
    const report = await generateTask031Report({});
    expect(report.taskId).toBe('031');
    expect(report.task031Started).toBe(true);
    expect(report.safeToStartTask032).toBe(true);
    expect(report.verdict).toBe('TASK_031_PASS_SAFE_TO_START_TASK_032');
    expect(report.liveAiCallIntroduced).toBe(false);
    expect(report.realNotificationsSent).toBe(false);
    expect(report.productionDeploymentIntroduced).toBe(false);
    expect(report.productionDataMutationExecuted).toBe(false);
    expect(report.frontendUiCreated).toBe(false);
    expect(report.syntheticDataOnly).toBe(true);
    expect(report.stagingEnvironmentOnly).toBe(true);
    expect(report.canaryActivationCreated).toBe(false);
    expect(report.canaryObservationCreated).toBe(false);
    expect(report.rolloutCreated).toBe(false);
    expect(report.schoolWideLaunchCreated).toBe(false);
    expect(report.backendFreezeCreated).toBe(false);
  });
});
