/**
 * Backend Health and Readiness Routes
 *
 * GET /api/health/live  — Liveness probe (always responds, no deps)
 * GET /api/health/ready — Readiness probe (checks dependencies)
 */

import { Router, Request, Response } from 'express';
import { getBackendLiveness } from '../services/backendHealthService';
import { getBackendReadiness } from '../services/backendReadinessService';
import { runBackendDependencyChecks } from '../services/backendDependencyCheckService';
import { verifyBackendRouteContracts } from '../services/backendRouteContractService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/health/live
 * Liveness check. Always responds, no dependency checks.
 */
router.get('/live', (req: Request, res: Response) => {
  const liveness = getBackendLiveness();
  res.status(200).json({
    ...liveness,
    requestId: req.requestId,
  });
});

/**
 * GET /api/health/ready
 * Readiness check. Verifies dependencies.
 * Returns 200 if ready, 503 if not ready.
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const readiness = await getBackendReadiness();
    const statusCode = readiness.ok ? 200 : 503;
    res.status(statusCode).json({
      ...readiness,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error({ error: String(error) }, 'Readiness check failed');
    res.status(503).json({
      ok: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      checks: [],
      warnings: ['Readiness check encountered an error'],
    });
  }
});

/**
 * GET /api/health/dependencies
 * Detailed dependency check. Safe, non-destructive.
 */
router.get('/dependencies', async (req: Request, res: Response) => {
  try {
    const checks = await runBackendDependencyChecks({ timeoutMs: 5000 });
    res.status(200).json({
      ok: checks.every((c) => c.ok || !c.required),
      checks,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error({ error: String(error) }, 'Dependency check failed');
    res.status(503).json({
      ok: false,
      checks: [],
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
});

/**
 * GET /api/health/routes
 * Route contract check. Verifies critical routes exist.
 */
router.get('/routes', (req: Request, res: Response) => {
  const report = verifyBackendRouteContracts();
  res.status(report.ok ? 200 : 503).json({
    ok: report.ok,
    routeCount: report.routes.length,
    failures: report.failures.length,
    warnings: report.warnings.length,
    report,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

export default router;
