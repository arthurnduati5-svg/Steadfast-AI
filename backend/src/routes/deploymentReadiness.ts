import { Router, Request, Response, NextFunction } from 'express';
import { getDeploymentEnvironment } from '../services/task023EnvironmentGateService';
import { getDeploymentReadinessReport } from '../services/task023DeploymentReadinessAggregator';
import { getProductionStartupGateResult } from '../services/task023ProductionStartupGateService';
import { getMigrationSafetyResult } from '../services/task023MigrationSafetyChecker';
import { getMigrationPreflightResult } from '../services/task023MigrationPreflightService';
import { runReleaseSmokeTests } from '../services/task023ReleaseSmokeTestHarness';
import { getRollbackReadinessCheck } from '../services/task023RollbackReadinessService';
import { getBackendLiveness } from '../services/backendHealthService';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';

const router = Router();

const internalGuard = [schoolAuthMiddleware, requireRole('admin', 'counselor')];

router.get('/deployment/health', (_req: Request, res: Response) => {
  const health = getBackendLiveness();
  res.status(200).json(health);
});

router.get('/deployment/readiness', ...internalGuard, async (req: Request, res: Response) => {
  const report = await getDeploymentReadinessReport(req.requestId);
  const statusCode = report.overallStatus === 'ready' || report.overallStatus === 'degraded' ? 200 : 503;
  res.status(statusCode).json(report);
});

router.get('/deployment/readiness/full', ...internalGuard, async (req: Request, res: Response) => {
  const startupGate = await getProductionStartupGateResult();
  const report = await getDeploymentReadinessReport(req.requestId);
  res.json({
    startupGate,
    aggregator: report,
    environment: getDeploymentEnvironment(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

router.get('/deployment/migration-safety', ...internalGuard, (_req: Request, res: Response) => {
  const result = getMigrationSafetyResult();
  const statusCode = result.blocked ? 503 : 200;
  res.status(statusCode).json(result);
});

router.get('/deployment/migration-preflight', ...internalGuard, async (_req: Request, res: Response) => {
  const result = await getMigrationPreflightResult();
  const statusCode = result.status === 'blocked' ? 503 : 200;
  res.status(statusCode).json(result);
});

router.get('/deployment/smoke/plan', ...internalGuard, async (_req: Request, res: Response) => {
  const result = await runReleaseSmokeTests();
  const statusCode = result.overall === 'ready' ? 200 : 503;
  res.status(statusCode).json(result);
});

router.get('/deployment/rollback/plan', ...internalGuard, (_req: Request, res: Response) => {
  const result = getRollbackReadinessCheck();
  res.status(200).json(result);
});

export default router;
export { internalGuard };
