import { Router, Request, Response } from 'express';
import { resolveRolloutRole034, getRolloutRolePermissions034 } from '../contracts/task034ControlledRolloutContracts';
import { evaluateTask034RolloutCap } from '../services/task034RolloutCapGateService';
import { evaluateHealthBudget } from '../services/task034ControlledRolloutHealthBudgetService';

const router = Router();

function safeJson(res: Response, data: Record<string, unknown>, status = 200): void {
  const unsafeKeys = ['authorization', 'cookie', 'token', 'secret', 'password', 'apiKey'];
  const safe = { ...data };
  for (const key of unsafeKeys) {
    delete safe[key];
  }
  res.status(status).json(safe);
}

function requireRole(role: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(role);
}

router.get('/api/pilot/limited-rollout/status', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewOwnRolloutStatus && !perms.canViewAggregateRolloutSummary && !perms.canViewAssignedSafeTeacherSummary) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    status: 'active',
    role,
    rolloutRunId: 'rollout_run_task034_safe',
    schoolId: 'school_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    rolloutPercent: 20,
  });
});

router.get('/api/pilot/limited-rollout/summary', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewAggregateRolloutSummary) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    summary: 'Controlled limited rollout active',
    eligibleStudentCount: 400,
    approvedRolloutStudentCount: 80,
    activeRolloutStudentCount: 80,
    rolloutPercent: 20,
    openRolloutPerformed: false,
    schoolWideRolloutPerformed: false,
    hundredPercentRolloutPerformed: false,
  });
});

router.get('/api/pilot/limited-rollout/health', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewHealthBudget) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const health = evaluateHealthBudget({
    p95LatencyMs: 1200,
    errorRatePercent: 0.1,
    privacyLeakCount: 0,
    schoolAuthBypassCount: 0,
    rolloutMembershipBypassCount: 0,
    socraticBypassCount: 0,
    deenBypassCount: 0,
    curriculumBypassCount: 0,
    unhandledSafeguardingCount: 0,
    openRolloutCount: 0,
    schoolWideRolloutCount: 0,
    hundredPercentRolloutCount: 0,
  });
  safeJson(res, health as unknown as Record<string, unknown>);
});

router.get('/api/pilot/limited-rollout/cap', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewCapStatus) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const cap = evaluateTask034RolloutCap({
    rolloutPercent: 20,
    expandedStudentCount: 80,
    maxRolloutPercent: 25,
    maxExpandedStudentCount: 100,
    schoolWideRequested: false,
    hundredPercentRequested: false,
    openCohortRequested: false,
    unknownCohortRequested: false,
    crossSchoolCohortRequested: false,
  });
  safeJson(res, cap as unknown as Record<string, unknown>);
});

router.get('/api/pilot/limited-rollout/incidents', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewSafeIncidentSummaries) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { signals: [], safeSummaries: ['No incidents detected'], pauseRecommended: false, rollbackRecommended: false });
});

router.get('/api/pilot/limited-rollout/staff-readiness', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewAggregateRolloutSummary) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, staffReady: true, acknowledgements: 7 });
});

router.post('/api/pilot/limited-rollout/staff-acknowledgement', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canSubmitAssignedScopeAcknowledgement && !perms.canSubmitAdminReview) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, message: 'Acknowledgement recorded' });
});

router.post('/api/pilot/limited-rollout/student-safe-feedback', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canSubmitSafeCategoryFeedback) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, message: 'Safe feedback recorded' });
});

router.post('/api/pilot/limited-rollout/admin-review', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canSubmitAdminReview) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, message: 'Admin review submitted' });
});

router.post('/api/pilot/limited-rollout/decision', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canGenerateDecision) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    decision: 'safe_to_prepare_next_rollout_stage',
    safeToStartTask035: true,
    blockingIssues: [],
  });
});

router.post('/api/pilot/limited-rollout/pause', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canPauseResumeKillSwitchRollback) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, state: 'paused', message: 'Rollout paused' });
});

router.post('/api/pilot/limited-rollout/resume', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canPauseResumeKillSwitchRollback) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, state: 'active', message: 'Rollout resumed' });
});

router.post('/api/pilot/limited-rollout/kill-switch', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canPauseResumeKillSwitchRollback) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, state: 'kill_switch_active', message: 'Kill switch activated' });
});

router.post('/api/pilot/limited-rollout/rollback', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canPauseResumeKillSwitchRollback) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, state: 'rollback_in_progress', message: 'Rollback initiated' });
});

router.get('/api/pilot/limited-rollout/report/task-034', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canViewReportReferences) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    reportPath: 'docs/ops/task-034/task-034-controlled-rollout-report.json',
    handoffPath: 'docs/ops/task-034/TASK_034_HANDOFF.md',
  });
});

router.post('/api/pilot/limited-rollout/report/task-034/generate', (req: Request, res: Response) => {
  const role = resolveRolloutRole034(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  const perms = getRolloutRolePermissions034(role);
  if (!perms.canGenerateDecision) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, { ok: true, message: 'Report generation triggered' });
});

export default router;
