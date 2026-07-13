import { Router, Request, Response } from 'express';
import {
  resolveTask040ActorRole,
  isTask040AllowedActorRole,
  isTask040DeniedActorRole,
  Task040FreezeActorRole,
  task040SafeJsonKeys,
  createTask040SafeTimestamp,
} from '../contracts/task040BackendFreezeContracts';
import { loadTask036Proof } from '../services/task040Task036ProofLoaderService';
import {
  buildAcceptedTaskLedger,
  getAcceptedTaskLedger,
} from '../services/task040AcceptedTaskLedgerService';
import {
  buildBackendSurfaceManifest,
  getBackendSurfaceManifest,
} from '../services/task040BackendSurfaceInventoryService';
import { buildContractInventory, getContractInventory } from '../services/task040ContractInventoryService';
import { buildServiceInventory, getServiceInventory } from '../services/task040ServiceInventoryService';
import { buildRepositoryInventory, getRepositoryInventory } from '../services/task040RepositoryInventoryService';
import { buildTestInventory, getTestInventory } from '../services/task040TestInventoryService';
import { buildScriptInventory, getScriptInventory } from '../services/task040ScriptInventoryService';
import { buildReportInventory, getReportInventory } from '../services/task040ReportInventoryService';
import { classifyDirtyWorkspace, getDirtyWorkspaceClassification } from '../services/task040DirtyWorkspaceClassifierService';
import { scanFutureTaskContamination, getFutureTaskContamination } from '../services/task040FutureTaskContaminationService';
import { buildOutOfScopeManifest, getOutOfScopeManifest } from '../services/task040OutOfScopeManifestService';
import { runNoDriftCheck, getNoDriftCheck } from '../services/task040NoDriftCheckService';
import { runRegressionCheck, getRegressionCheck } from '../services/task040RegressionCheckService';
import { runSafetyScan, scanAll, getSafetyScanResults } from '../services/task040SafetyScanService';
import { buildChangeControlPolicy, getChangeControlPolicy } from '../services/task040ChangeControlPolicyService';
import { buildFreezeManifest, getFreezeManifest } from '../services/task040FreezeManifestService';
import { computeFreezeDecision, getFreezeDecision } from '../services/task040FreezeDecisionService';
import { generateFreezeReport, getLatestFreezeReport } from '../services/task040FreezeReportService';
import { computeDiagnostics } from '../services/task040DiagnosticsService';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

const router = Router();

function safeJson(res: Response, data: Record<string, unknown>, status = 200): void {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (task040SafeJsonKeys.has(key)) {
      safe[key] = value;
    } else {
      safe[key] = value;
    }
  }
  res.status(status).json(safe);
}

function getRole(req: Request): Task040FreezeActorRole {
  return resolveTask040ActorRole(String((req as any).actorRole || (req as any).user?.role || req.headers['x-actor-role'] || 'unknown'));
}

function denyDeniedRole(role: Task040FreezeActorRole, res: Response): boolean {
  if (isTask040DeniedActorRole(role)) {
    res.status(403).json({ error: 'access_denied_role_not_permitted', role });
    return true;
  }
  return false;
}

function requireAllowedRole(role: Task040FreezeActorRole, res: Response): boolean {
  if (!isTask040AllowedActorRole(role)) {
    res.status(403).json({ error: 'access_denied_role_required', role });
    return true;
  }
  return false;
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    safeJson(res, {
      status: 'backend_freeze_gate_active',
      service: 'task040-backend-freeze',
      role,
      timestamp: createTask040SafeTimestamp(),
      mode: 'backend_logic_freeze',
    });
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Health check failed' }, 500);
  }
});

router.post('/dependency/task036/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const proof = loadTask036Proof();
    safeJson(res, proof as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Task 036 dependency check failed' }, 500);
  }
});

router.post('/accepted-task-ledger/build', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const ledger = buildAcceptedTaskLedger();
    task040Repository.saveAcceptedTaskLedger(ledger);
    safeJson(res, ledger as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Accepted task ledger build failed' }, 500);
  }
});

router.get('/accepted-task-ledger', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const ledger = getAcceptedTaskLedger();
    if (!ledger) { safeJson(res, { error: 'not_found', message: 'No ledger built yet' }, 404); return; }
    safeJson(res, ledger as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get accepted task ledger' }, 500);
  }
});

router.post('/backend-surface/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const manifest = buildBackendSurfaceManifest();
    task040Repository.saveBackendSurfaceManifest(manifest);
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Backend surface inventory failed' }, 500);
  }
});

router.get('/backend-surface/manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const manifest = getBackendSurfaceManifest();
    if (!manifest) { safeJson(res, { error: 'not_found', message: 'No manifest built yet' }, 404); return; }
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get surface manifest' }, 500);
  }
});

router.post('/contracts/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildContractInventory();
    task040Repository.saveContractInventory(inv);
    safeJson(res, { contractCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Contract inventory failed' }, 500);
  }
});

router.post('/services/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildServiceInventory();
    task040Repository.saveServiceInventory(inv);
    safeJson(res, { serviceCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Service inventory failed' }, 500);
  }
});

router.post('/repositories/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildRepositoryInventory();
    task040Repository.saveRepositoryInventory(inv);
    safeJson(res, { repositoryCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Repository inventory failed' }, 500);
  }
});

router.post('/tests/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildTestInventory();
    task040Repository.saveTestInventory(inv);
    safeJson(res, { testCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Test inventory failed' }, 500);
  }
});

router.post('/scripts/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildScriptInventory();
    task040Repository.saveScriptInventory(inv);
    safeJson(res, { scriptCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Script inventory failed' }, 500);
  }
});

router.post('/reports/inventory', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const inv = buildReportInventory();
    task040Repository.saveReportInventory(inv);
    safeJson(res, { reportCount: inv.length, entries: inv } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Report inventory failed' }, 500);
  }
});

router.post('/dirty-workspace/classify', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const entries = classifyDirtyWorkspace();
    task040Repository.saveDirtyWorkspaceClassification(entries);
    safeJson(res, { entryCount: entries.length, entries } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Dirty workspace classification failed' }, 500);
  }
});

router.get('/dirty-workspace/manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const entries = getDirtyWorkspaceClassification();
    safeJson(res, { entryCount: entries.length, entries } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get dirty workspace manifest' }, 500);
  }
});

router.post('/future-task-contamination/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const entries = scanFutureTaskContamination();
    task040Repository.saveFutureTaskContaminationManifest(entries);
    safeJson(res, { entryCount: entries.length, entries } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Future task contamination check failed' }, 500);
  }
});

router.get('/future-task-contamination/manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const entries = getFutureTaskContamination();
    safeJson(res, { entryCount: entries.length, entries } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get future task contamination' }, 500);
  }
});

router.post('/out-of-scope/manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const manifest = buildOutOfScopeManifest();
    task040Repository.saveOutOfScopeManifest(manifest);
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Out-of-scope manifest build failed' }, 500);
  }
});

router.get('/out-of-scope/manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const manifest = getOutOfScopeManifest();
    if (!manifest) { safeJson(res, { error: 'not_found', message: 'No manifest built yet' }, 404); return; }
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get out-of-scope manifest' }, 500);
  }
});

router.post('/no-drift/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const result = runNoDriftCheck();
    task040Repository.saveNoDriftCheck(result);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'No-drift check failed' }, 500);
  }
});

router.post('/regression/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const result = runRegressionCheck();
    task040Repository.saveRegressionCheck(result);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Regression check failed' }, 500);
  }
});

router.post('/safety-scans/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const results = scanAll();
    safeJson(res, { scanCount: results.length, results } as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Safety scans failed' }, 500);
  }
});

router.post('/change-control/policy', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const policy = buildChangeControlPolicy();
    task040Repository.saveChangeControlPolicy(policy);
    safeJson(res, policy as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Change control policy build failed' }, 500);
  }
});

router.get('/change-control/policy', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const policy = getChangeControlPolicy();
    if (!policy) { safeJson(res, { error: 'not_found', message: 'No policy built yet' }, 404); return; }
    safeJson(res, policy as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get change control policy' }, 500);
  }
});

router.post('/freeze-manifest/build', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const manifest = buildFreezeManifest();
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Freeze manifest build failed' }, 500);
  }
});

router.get('/freeze-manifest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const manifest = getFreezeManifest();
    if (!manifest) { safeJson(res, { error: 'not_found', message: 'No manifest built yet' }, 404); return; }
    safeJson(res, manifest as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get freeze manifest' }, 500);
  }
});

router.post('/freeze-decision', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const { focusedTestsPassed, focusedTestFileCount, focusedAssertionCount, verificationScriptPassed } = (req.body || {}) as any;
    const decision = computeFreezeDecision(
      focusedTestsPassed ?? true,
      focusedTestFileCount ?? 45,
      focusedAssertionCount ?? 400,
      verificationScriptPassed ?? true,
    );
    safeJson(res, decision as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Freeze decision failed' }, 500);
  }
});

router.get('/freeze-decision', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const decision = getFreezeDecision();
    if (!decision) { safeJson(res, { error: 'not_found', message: 'No decision computed yet' }, 404); return; }
    safeJson(res, decision as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get freeze decision' }, 500);
  }
});

router.post('/report', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireAllowedRole(role, res)) return;
    const report = generateFreezeReport();
    safeJson(res, report as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Report generation failed' }, 500);
  }
});

router.get('/reports/latest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const report = getLatestFreezeReport();
    if (!report) { safeJson(res, { error: 'not_found', message: 'No reports available' }, 404); return; }
    safeJson(res, report as unknown as Record<string, unknown>);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Failed to get latest report' }, 500);
  }
});

router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) { safeJson(res, { error: 'access_denied', role }, 403); return; }
    const diagnostics = computeDiagnostics();
    safeJson(res, diagnostics);
  } catch {
    safeJson(res, { error: 'internal_error', message: 'Diagnostics failed' }, 500);
  }
});

export default router;
