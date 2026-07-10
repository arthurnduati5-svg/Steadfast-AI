import { Router, Request, Response } from 'express';
import { resolveTask034ActorRole, isTask034AdminOperatorRole, isTask034DeniedRole } from '../contracts/task034ControlledLimitedRolloutContracts';
import type { Task034RolloutEnvironmentGateInput, Task034LimitedRolloutConfigInput, Task034RolloutCapGateInput, Task034ExpandedCohortEligibilityInput, Task034StaffReadinessInput, Task034LearnerNoticeReadinessInput, Task034ControlledRolloutSessionInput, Task034ControlledRolloutEventInput, Task034ExpandedRuntimeGuardResult, Task034RollbackProtectionResult, Task034PrivacyReviewResult, Task034ContentGovernanceReviewResult, Task034SocraticIntegrityReviewResult, Task034DeenBoundaryReviewResult, Task034SchoolIdentityReviewResult, Task034CrossSchoolDenialReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { loadTask033ProofForTask034 } from '../services/task034Task033ProofLoaderService';
import { evaluateTask034EnvironmentGate } from '../services/task034RolloutEnvironmentGateService';
import { validateTask034LimitedRolloutConfig } from '../services/task034LimitedRolloutConfigService';
import { evaluateTask034RolloutCap } from '../services/task034RolloutCapGateService';
import { evaluateTask034CohortEligibility } from '../services/task034ExpandedCohortEligibilityService';
import { evaluateTask034StaffReadiness } from '../services/task034StaffReadinessService';
import { evaluateTask034LearnerNoticeReadiness } from '../services/task034LearnerNoticeReadinessService';
import { createTask034RolloutSession, transitionTask034RolloutStatus } from '../services/task034ControlledRolloutStateMachineService';
import { intakeTask034RolloutEvent } from '../services/task034ControlledRolloutEventIntakeService';
import { executeTask034RolloutCommand } from '../services/task034ControlledRolloutCommandService';
import { evaluateTask034ExpandedRuntimeGuard } from '../services/task034ExpandedRuntimeGuardService';
import { evaluateTask034HealthBudget } from '../services/task034HealthBudgetEscalationService';
import { evaluateTask034IncidentSignals } from '../services/task034IncidentEscalationBridgeService';
import { evaluateTask034RollbackProtection } from '../services/task034RollbackProtectionService';
import { reviewTask034Privacy } from '../services/task034PrivacyReviewService';
import { reviewTask034ContentGovernance } from '../services/task034ContentGovernanceReviewService';
import { reviewTask034SocraticIntegrity } from '../services/task034SocraticIntegrityReviewService';
import { reviewTask034DeenBoundary } from '../services/task034DeenBoundaryReviewService';
import { reviewTask034SchoolIdentity } from '../services/task034SchoolIdentityReviewService';
import { reviewTask034CrossSchoolDenial } from '../services/task034CrossSchoolDenialReviewService';
import { buildTask034SafeRolloutReadModel } from '../services/task034SafeRolloutReadModelService';
import { appendTask034EvidenceEvent, getTask034EvidenceLedger } from '../services/task034EvidenceLedgerService';
import { runTask034Diagnostics } from '../services/task034DiagnosticsService';
import { computeTask034PostLimitedRolloutDecision } from '../services/task034PostLimitedRolloutDecisionService';

const router = Router();

function requireAdminOrOperator(req: Request, res: Response): boolean {
  const role = resolveTask034ActorRole(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  if (!isTask034AdminOperatorRole(role)) {
    res.status(403).json({ error: 'access_denied', role, reason: 'admin_or_operator_role_required' });
    return false;
  }
  return true;
}

function requireNotDeniedRole(req: Request, res: Response): boolean {
  const role = resolveTask034ActorRole(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
  if (isTask034DeniedRole(role)) {
    res.status(403).json({ error: 'access_denied', role, reason: 'denied_role' });
    return false;
  }
  return true;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'task034-controlled-limited-rollout', timestamp: new Date().toISOString() });
});

router.post('/dependency/task033/check', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  try {
    const syntheticFixture = req.body?.syntheticFixture;
    const proof = await loadTask033ProofForTask034(syntheticFixture);
    await task034Repository.saveTask033DependencyProof(proof);
    res.json(proof);
  } catch {
    res.status(500).json({ error: 'dependency_check_failed' });
  }
});

router.post('/environment/preflight', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034RolloutEnvironmentGateInput = req.body;
  const result = evaluateTask034EnvironmentGate(input);
  task034Repository.saveEnvironmentGate(result);
  res.json(result);
});

router.post('/config/limited-rollout', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034LimitedRolloutConfigInput = req.body;
  const result = validateTask034LimitedRolloutConfig(input);
  task034Repository.saveLimitedRolloutConfig(result);
  res.json(result);
});

router.post('/cap/check', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034RolloutCapGateInput = req.body;
  const result = evaluateTask034RolloutCap(input);
  task034Repository.saveRolloutCapGate(result);
  res.json(result);
});

router.post('/cohort/eligibility', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034ExpandedCohortEligibilityInput = req.body;
  const result = evaluateTask034CohortEligibility(input);
  task034Repository.saveExpandedCohortEligibility(result);
  res.json(result);
});

router.post('/staff/readiness', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034StaffReadinessInput = req.body;
  const result = evaluateTask034StaffReadiness(input);
  task034Repository.saveStaffReadiness(result);
  res.json(result);
});

router.post('/learner-notice/readiness', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034LearnerNoticeReadinessInput = req.body;
  const result = evaluateTask034LearnerNoticeReadiness(input);
  task034Repository.saveLearnerNoticeReadiness(result);
  res.json(result);
});

router.post('/sessions', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034ControlledRolloutSessionInput = req.body;
  const session = await createTask034RolloutSession(input);
  res.json(session);
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  if (!requireNotDeniedRole(req, res)) return;
  const session = await task034Repository.getRolloutSession(req.params.sessionId);
  if (!session) { res.status(404).json({ error: 'session_not_found' }); return; }
  res.json(session);
});

router.post('/sessions/:sessionId/start-limited-rollout', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const session = await task034Repository.getRolloutSession(req.params.sessionId);
  if (!session) { res.status(404).json({ error: 'session_not_found' }); return; }
  const updated = await transitionTask034RolloutStatus(session, 'limited_rollout_active_internal');
  res.json(updated);
});

router.post('/sessions/:sessionId/events', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input: Task034ControlledRolloutEventInput = { ...req.body, sessionId: req.params.sessionId };
  const event = await intakeTask034RolloutEvent(input);
  res.json(event);
});

router.get('/sessions/:sessionId/events/safe-summary', async (req: Request, res: Response) => {
  if (!requireNotDeniedRole(req, res)) return;
  const events = await task034Repository.listRolloutEventsForSession(req.params.sessionId);
  const safeSummaries = events.map(e => ({ eventId: e.eventId, eventType: e.eventType, safeSummary: e.safeSummary, gateName: e.gateName, gatePassed: e.gatePassed }));
  res.json({ sessionId: req.params.sessionId, eventCount: safeSummaries.length, safeSummaries });
});

router.post('/sessions/:sessionId/runtime-guard', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034ExpandedRuntimeGuardResult> = req.body;
  const result = evaluateTask034ExpandedRuntimeGuard(overrides);
  task034Repository.saveExpandedRuntimeGuard(result);
  res.json(result);
});

router.post('/sessions/:sessionId/health-budget', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const metrics = req.body;
  const result = evaluateTask034HealthBudget(metrics);
  task034Repository.saveHealthBudgetEscalation(result);
  res.json(result);
});

router.post('/sessions/:sessionId/incident-escalation', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const { signals, safeSummaries } = req.body;
  const result = evaluateTask034IncidentSignals(signals || [], safeSummaries || []);
  task034Repository.saveIncidentEscalationBridge(result);
  res.json(result);
});

router.post('/sessions/:sessionId/rollback-protection', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034RollbackProtectionResult> = req.body;
  const result = evaluateTask034RollbackProtection(overrides);
  task034Repository.saveRollbackProtection(result);
  res.json(result);
});

router.post('/sessions/:sessionId/privacy-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034PrivacyReviewResult> = req.body;
  const result = reviewTask034Privacy(overrides);
  task034Repository.savePrivacyReview(result);
  res.json(result);
});

router.post('/sessions/:sessionId/content-governance-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034ContentGovernanceReviewResult> = req.body;
  const result = reviewTask034ContentGovernance(overrides);
  task034Repository.saveContentGovernanceReview(result);
  res.json(result);
});

router.post('/sessions/:sessionId/socratic-integrity-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034SocraticIntegrityReviewResult> = req.body;
  const result = reviewTask034SocraticIntegrity(overrides);
  task034Repository.saveSocraticIntegrityReview(result);
  res.json(result);
});

router.post('/sessions/:sessionId/deen-boundary-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034DeenBoundaryReviewResult> = req.body;
  const result = reviewTask034DeenBoundary(overrides);
  task034Repository.saveDeenBoundaryReview(result);
  res.json(result);
});

router.post('/sessions/:sessionId/school-identity-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034SchoolIdentityReviewResult> = req.body;
  const result = reviewTask034SchoolIdentity(overrides);
  task034Repository.saveSchoolIdentityReview(result);
  res.json(result);
});

router.post('/sessions/:sessionId/cross-school-denial-review', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const overrides: Partial<Task034CrossSchoolDenialReviewResult> = req.body;
  const result = reviewTask034CrossSchoolDenial(overrides);
  task034Repository.saveCrossSchoolDenialReview(result);
  res.json(result);
});

router.get('/sessions/:sessionId/safe-view', (_req: Request, res: Response) => {
  if (!requireNotDeniedRole(_req, res)) return;
  const readModel = buildTask034SafeRolloutReadModel(_req.params.sessionId);
  res.json(readModel);
});

router.get('/sessions/:sessionId/evidence', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const ledger = await getTask034EvidenceLedger(req.params.sessionId);
  res.json(ledger);
});

router.get('/sessions/:sessionId/diagnostics', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const diagnostics = await runTask034Diagnostics(req.params.sessionId);
  await task034Repository.saveDiagnostics(diagnostics);
  res.json(diagnostics);
});

router.post('/sessions/:sessionId/post-limited-rollout-decision', (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input = req.body;
  const decision = computeTask034PostLimitedRolloutDecision(input);
  task034Repository.savePostLimitedRolloutDecision(decision);
  res.json(decision);
});

router.post('/sessions/:sessionId/report', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const input = req.body;
  const report = await (await import('../services/task034ControlledLimitedRolloutReportService')).generateTask034Report(req.params.sessionId);
  await task034Repository.saveReport(report);
  res.json(report);
});

router.get('/reports/latest', async (req: Request, res: Response) => {
  if (!requireAdminOrOperator(req, res)) return;
  const report = await task034Repository.getLatestReport();
  if (!report) { res.status(404).json({ error: 'no_report_found' }); return; }
  res.json(report);
});

export default router;
