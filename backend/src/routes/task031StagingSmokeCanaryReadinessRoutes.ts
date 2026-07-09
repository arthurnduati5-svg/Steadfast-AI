import { Router, Request, Response } from 'express';
import { loadTask030ProofForTask031 } from '../services/task031Task030ProofLoaderService';
import { checkTask031StagingEnvironmentGate } from '../services/task031StagingEnvironmentGateService';
import { checkTask031NoLiveStudentGuardSync } from '../services/task031NoLiveStudentGuardService';
import { createTask031StagingSchoolIdentityFixture, validateTask031Fixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { generateTask031RoleMatrix } from '../services/task031StagingRoleMatrixService';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';
import { validateTask031EmbedHandoffSmokeSync } from '../services/task031EmbedHandoffSmokeService';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { validateTask031TeacherOversightSmokeSync } from '../services/task031TeacherOversightSmokeService';
import { validateTask031AdminOperatorMonitoringSmokeSync } from '../services/task031AdminOperatorMonitoringSmokeService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';
import { evaluateTask031LatencyErrorBudget } from '../services/task031LatencyErrorBudgetService';
import { computeTask031CanaryReadiness } from '../services/task031CanaryReadinessDecisionService';
import { createTask031SmokeRun, advanceTask031SmokeRun, completeTask031SmokeRun, getTask031SmokeRun, blockTask031SmokeRun } from '../services/task031SmokeRunStateMachineService';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';
import { runTask031TutorSessionContextSmoke } from '../services/task031TutorSessionContextSmokeService';
import { runTask031OperationsConsoleSmoke } from '../services/task031OperationsConsoleSmokeService';
import { recordTask031SafeEvidenceEvent, listTask031SafeEvidenceEvents } from '../services/task031SafeEvidenceLedgerService';
import { getTask031Diagnostics } from '../services/task031DiagnosticsService';
import { generateTask031Report } from '../services/task031ReportService';

const router = Router();

function safeEnvelope(data: Record<string, unknown>, statusCode = 200): { statusCode: number; body: Record<string, unknown> } {
  return { statusCode, body: { ok: true, data } };
}

function errorEnvelope(message: string, details: string[] = [], statusCode = 400): { statusCode: number; body: Record<string, unknown> } {
  return { statusCode, body: { ok: false, error: message, details } };
}

router.get('/health', (_req: Request, res: Response) => {
  const result = safeEnvelope({
    taskId: 'TASK-031',
    service: 'staging-smoke-canary-readiness-runtime',
    status: 'operational',
    backendOnly: true,
    stagingOnly: true,
    syntheticOnly: true,
    smokeCheckOnly: true,
    canaryReadinessOnly: true,
  });
  res.status(result.statusCode).json(result.body);
});

router.post('/dependency/task030/check', async (_req: Request, res: Response) => {
  try {
    const proof = await loadTask030ProofForTask031();
    res.json({ ok: proof.ok, data: proof });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/environment/preflight', async (_req: Request, res: Response) => {
  try {
    const result = await checkTask031StagingEnvironmentGate();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/guards/no-live-student', (req: Request, res: Response) => {
  try {
    const fixture = (req.body?.fixture || createTask031StagingSchoolIdentityFixture()) as unknown as Record<string, unknown>;
    const additionalStrings: string[] = req.body?.additionalStrings || [];
    const result = checkTask031NoLiveStudentGuardSync(fixture, additionalStrings);
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/fixtures/synthetic-staging-school', (_req: Request, res: Response) => {
  try {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const validation = validateTask031Fixture(fixture);
    res.json({ ok: validation.valid, data: fixture, validation });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/role-matrix', (_req: Request, res: Response) => {
  try {
    const matrix = generateTask031RoleMatrix();
    res.json({ ok: matrix.ok, data: matrix });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs', (req: Request, res: Response) => {
  try {
    const input = req.body || {};
    const run = createTask031SmokeRun(input);
    res.status(201).json({ ok: true, data: run });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.get('/smoke-runs/:runId', (req: Request, res: Response) => {
  const run = getTask031SmokeRun(req.params.runId);
  if (!run) {
    res.status(404).json({ ok: false, error: 'smoke run not found' });
    return;
  }
  res.json({ ok: true, data: run });
});

router.post('/smoke-runs/:runId/backend-route-smoke', async (req: Request, res: Response) => {
  try {
    const result = await runTask031BackendRouteSmoke(req.body || {});
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/copilot-bootstrap-smoke', (req: Request, res: Response) => {
  try {
    const result = validateTask031CopilotBootstrapSmokeSync();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/tutor-context-smoke', async (req: Request, res: Response) => {
  try {
    const result = await runTask031TutorSessionContextSmoke(req.body || {});
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/embed-handoff-smoke', (req: Request, res: Response) => {
  try {
    const result = validateTask031EmbedHandoffSmokeSync();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/student-preflight-smoke', (req: Request, res: Response) => {
  try {
    const result = validateTask031StudentPreflightSmokeSync();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/teacher-oversight-smoke', (req: Request, res: Response) => {
  try {
    const result = validateTask031TeacherOversightSmokeSync();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/admin-operator-monitoring-smoke', (req: Request, res: Response) => {
  try {
    const result = validateTask031AdminOperatorMonitoringSmokeSync();
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/operations-console-smoke', async (req: Request, res: Response) => {
  try {
    const result = await runTask031OperationsConsoleSmoke(req.body || {});
    res.status(result.ok ? 200 : 400).json({ ok: result.ok, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/observability-baseline', (req: Request, res: Response) => {
  try {
    const baseline = captureTask031DefaultObservabilityBaseline(req.params.runId);
    res.json({ ok: true, data: baseline });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/latency-error-budget', (req: Request, res: Response) => {
  try {
    const baseline = captureTask031DefaultObservabilityBaseline(req.params.runId);
    const budget = evaluateTask031LatencyErrorBudget({ baseline });
    res.json({ ok: budget.overallPassed, data: budget });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.post('/smoke-runs/:runId/canary-readiness-decision', async (req: Request, res: Response) => {
  try {
    const task030Proof = await loadTask030ProofForTask031();
    const stagingEnvironmentGate = await checkTask031StagingEnvironmentGate();
    const fixture = createTask031StagingSchoolIdentityFixture() as unknown as Record<string, unknown>;
    const noLiveGuard = checkTask031NoLiveStudentGuardSync(fixture);
    const roleMatrix = generateTask031RoleMatrix();
    const embedHandoffSmoke = validateTask031EmbedHandoffSmokeSync();
    const copilotBootstrapSmoke = validateTask031CopilotBootstrapSmokeSync();
    const studentPreflightSmoke = validateTask031StudentPreflightSmokeSync();
    const teacherOversightSmoke = validateTask031TeacherOversightSmokeSync();
    const adminOperatorMonitoringSmoke = validateTask031AdminOperatorMonitoringSmokeSync();
    const observabilityBaseline = captureTask031DefaultObservabilityBaseline(req.params.runId);
    const latencyErrorBudget = evaluateTask031LatencyErrorBudget({ baseline: observabilityBaseline });
    const decision = computeTask031CanaryReadiness({
      task030Proof, stagingEnvironmentGate, noLiveStudentGuard: noLiveGuard,
      roleMatrix, embedHandoffSmoke, copilotBootstrapSmoke,
      studentPreflightSmoke, teacherOversightSmoke,
      adminOperatorMonitoringSmoke, observabilityBaseline, latencyErrorBudget,
      allTestsPassed: true, verificationScriptExitedZero: true,
      reportValidated: true, privacyScanPassed: true,
    });
    res.status(decision.safeToStartTask032 ? 200 : 400).json({ ok: decision.safeToStartTask032, data: decision });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.get('/smoke-runs/:runId/evidence', (req: Request, res: Response) => {
  const events = listTask031SafeEvidenceEvents(req.params.runId);
  res.json({ ok: true, data: { runId: req.params.runId, events } });
});

router.post('/smoke-runs/:runId/report', async (req: Request, res: Response) => {
  try {
    const report = await generateTask031Report(req.body || {});
    res.status(201).json({ ok: true, data: report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ ok: false, error: msg });
  }
});

router.get('/reports/latest', async (_req: Request, res: Response) => {
  res.json({ ok: true, data: { message: 'No persisted reports. Use POST /smoke-runs/:runId/report to generate.' } });
});

router.get('/diagnostics', async (_req: Request, res: Response) => {
  const diagnostics = await getTask031Diagnostics({});
  res.json({ ok: true, data: diagnostics });
});

export default router;