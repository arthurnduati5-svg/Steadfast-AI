import { Router, Request, Response } from 'express';
import { RecoveryOutcomeActionSafetyService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionReadinessService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionReadinessService';
import { RecoveryOutcomeActionBundleService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionBundleService';
import { RecoveryContinuationActionDraftService } from '../domains/assessment/recovery-outcome-action/services/recoveryContinuationActionDraftService';
import { RecoveryIntensificationActionDraftService } from '../domains/assessment/recovery-outcome-action/services/recoveryIntensificationActionDraftService';
import { RecoveryPauseActionDraftService } from '../domains/assessment/recovery-outcome-action/services/recoveryPauseActionDraftService';
import { RecoveryClosureActionDraftService } from '../domains/assessment/recovery-outcome-action/services/recoveryClosureActionDraftService';
import { RecoveryOutcomeApprovalGateService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeApprovalGateService';
import { RecoveryOutcomeMockActivationQueueService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeMockActivationQueueService';
import { RecoveryOutcomeDryRunReceiptService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeDryRunReceiptService';
import { RecoveryOutcomeRollbackPlanService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeRollbackPlanService';
import { RecoveryOutcomeSuppressionRuleService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeSuppressionRuleService';
import { RecoveryOutcomeActionSummaryService } from '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSummaryService';
import {
  InMemoryRecoveryOutcomeActionReadinessRepository,
  InMemoryRecoveryOutcomeActionBundleRepository,
  InMemoryRecoveryContinuationActionDraftRepository,
  InMemoryRecoveryIntensificationActionDraftRepository,
  InMemoryRecoveryPauseActionDraftRepository,
  InMemoryRecoveryClosureActionDraftRepository,
  InMemoryRecoveryOutcomeApprovalGateRepository,
  InMemoryRecoveryOutcomeMockActivationQueueRepository,
  InMemoryRecoveryOutcomeDryRunReceiptRepository,
  InMemoryRecoveryOutcomeRollbackPlanRepository,
  InMemoryRecoveryOutcomeSuppressionRuleRepository,
  InMemoryRecoveryOutcomeActionSummaryRepository,
  InMemoryRecoveryOutcomeActionAuditRepository,
  InMemoryRecoveryOutcomeActionIdempotencyRepository,
} from '../domains/assessment/recovery-outcome-action/repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeActionCommandContext } from '../domains/assessment/recovery-outcome-action/contracts/recoveryOutcomeActionContracts';

const router = Router();

// ─── Repository Instances ────────────────────────────────────────────
const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
const safety = new RecoveryOutcomeActionSafetyService();
const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);

const readinessRepo = new InMemoryRecoveryOutcomeActionReadinessRepository();
const bundleRepo = new InMemoryRecoveryOutcomeActionBundleRepository();
const continuationDraftRepo = new InMemoryRecoveryContinuationActionDraftRepository();
const intensificationDraftRepo = new InMemoryRecoveryIntensificationActionDraftRepository();
const pauseDraftRepo = new InMemoryRecoveryPauseActionDraftRepository();
const closureDraftRepo = new InMemoryRecoveryClosureActionDraftRepository();
const approvalGateRepo = new InMemoryRecoveryOutcomeApprovalGateRepository();
const mockQueueRepo = new InMemoryRecoveryOutcomeMockActivationQueueRepository();
const dryRunRepo = new InMemoryRecoveryOutcomeDryRunReceiptRepository();
const rollbackRepo = new InMemoryRecoveryOutcomeRollbackPlanRepository();
const suppressionRepo = new InMemoryRecoveryOutcomeSuppressionRuleRepository();
const summaryRepo = new InMemoryRecoveryOutcomeActionSummaryRepository();

const readinessService = new RecoveryOutcomeActionReadinessService(readinessRepo, safety, audit, idempotency);
const bundleService = new RecoveryOutcomeActionBundleService(bundleRepo, safety, audit, idempotency);
const continuationDraftService = new RecoveryContinuationActionDraftService(continuationDraftRepo, safety, audit, idempotency);
const intensificationDraftService = new RecoveryIntensificationActionDraftService(intensificationDraftRepo, safety, audit, idempotency);
const pauseDraftService = new RecoveryPauseActionDraftService(pauseDraftRepo, safety, audit, idempotency);
const closureDraftService = new RecoveryClosureActionDraftService(closureDraftRepo, safety, audit, idempotency);
const approvalGateService = new RecoveryOutcomeApprovalGateService(approvalGateRepo, safety, audit, idempotency);
const mockQueueService = new RecoveryOutcomeMockActivationQueueService(mockQueueRepo, safety, audit, idempotency);
const dryRunService = new RecoveryOutcomeDryRunReceiptService(dryRunRepo, safety, audit, idempotency);
const rollbackService = new RecoveryOutcomeRollbackPlanService(rollbackRepo, safety, audit, idempotency);
const suppressionService = new RecoveryOutcomeSuppressionRuleService(suppressionRepo, safety, audit, idempotency);
const summaryService = new RecoveryOutcomeActionSummaryService(summaryRepo, safety, audit, idempotency);

function buildContext(req: Request): RecoveryOutcomeActionCommandContext {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `ik-${Date.now()}`,
    sourceRefsJson: req.body?.sourceRefsJson,
  };
}

function sendResponse(res: Response, result: any) {
  if (result.success) return res.status(200).json(result);
  if (result.status === 'DUPLICATE') return res.status(409).json(result);
  if (result.status === 'NOT_FOUND') return res.status(404).json(result);
  if (result.status === 'error') return res.status(400).json(result);
  return res.status(200).json(result);
}

// ─── Action Readiness ────────────────────────────────────────────────
router.post('/action-readiness', async (req: Request, res: Response) => {
  const ctx = buildContext(req);
  const result = await readinessService.createActionReadiness(ctx, req.body);
  sendResponse(res, result);
});

router.get('/action-readiness', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await readinessService.listActionReadinessForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await readinessService.listActionReadinessForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await readinessService.listActionReadinessByStatus(schoolId, status as any)); return; }
  sendResponse(res, await readinessService.listActionReadinessForSchool(schoolId));
});

router.get('/action-readiness/:id', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.getActionReadiness(req.params.id));
});

router.post('/action-readiness/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markActionReadinessReviewReady(buildContext(req), req.params.id));
});

router.post('/action-readiness/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.approveActionReadinessForFutureUse(buildContext(req), req.params.id));
});

router.post('/action-readiness/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.suppressActionReadiness(buildContext(req), req.params.id));
});

router.post('/action-readiness/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.blockActionReadiness(buildContext(req), req.params.id));
});

router.post('/action-readiness/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.voidActionReadiness(buildContext(req), req.params.id));
});

// ─── Action Bundles ──────────────────────────────────────────────────
router.post('/action-bundles', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.createActionBundle(buildContext(req), req.body));
});

router.get('/action-bundles', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await bundleService.listActionBundlesForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await bundleService.listActionBundlesForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await bundleService.listActionBundlesByStatus(schoolId, status as any)); return; }
  sendResponse(res, await bundleService.listActionBundlesForSchool(schoolId));
});

router.get('/action-bundles/:id', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.getActionBundle(req.params.id));
});

router.post('/action-bundles/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.markActionBundleReviewReady(buildContext(req), req.params.id));
});

router.post('/action-bundles/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.approveActionBundleForFutureUse(buildContext(req), req.params.id));
});

router.post('/action-bundles/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.suppressActionBundle(buildContext(req), req.params.id));
});

router.post('/action-bundles/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.blockActionBundle(buildContext(req), req.params.id));
});

router.post('/action-bundles/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await bundleService.voidActionBundle(buildContext(req), req.params.id));
});

// ─── Continuation Action Drafts ──────────────────────────────────────
router.post('/continuation-action-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.createContinuationActionDraft(buildContext(req), req.body));
});

router.get('/continuation-action-drafts', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, studentRef, status } = req.query;
  if (planId) { sendResponse(res, await continuationDraftService.listActionDraftsForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await continuationDraftService.listActionDraftsForStudent(schoolId, studentRef as string)); return; }
  if (status) { sendResponse(res, await continuationDraftService.listActionDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await continuationDraftService.listActionDraftsForPlan(schoolId, ''));
});

router.get('/continuation-action-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.getActionDraft(req.params.id));
});

router.post('/continuation-action-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.markActionDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/continuation-action-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.approveActionDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/continuation-action-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.suppressActionDraft(buildContext(req), req.params.id));
});

router.post('/continuation-action-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.blockActionDraft(buildContext(req), req.params.id));
});

router.post('/continuation-action-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await continuationDraftService.voidActionDraft(buildContext(req), req.params.id));
});

// ─── Intensification Action Drafts ───────────────────────────────────
router.post('/intensification-action-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.createIntensificationActionDraft(buildContext(req), req.body));
});

router.get('/intensification-action-drafts', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, studentRef, status } = req.query;
  if (planId) { sendResponse(res, await intensificationDraftService.listActionDraftsForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await intensificationDraftService.listActionDraftsForStudent(schoolId, studentRef as string)); return; }
  sendResponse(res, await intensificationDraftService.listActionDraftsForPlan(schoolId, ''));
});

router.get('/intensification-action-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.getActionDraft(req.params.id));
});

router.post('/intensification-action-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.markActionDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/intensification-action-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.approveActionDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/intensification-action-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.suppressActionDraft(buildContext(req), req.params.id));
});

router.post('/intensification-action-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.blockActionDraft(buildContext(req), req.params.id));
});

router.post('/intensification-action-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await intensificationDraftService.voidActionDraft(buildContext(req), req.params.id));
});

// ─── Pause Action Drafts ─────────────────────────────────────────────
router.post('/pause-action-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.createPauseActionDraft(buildContext(req), req.body));
});

router.get('/pause-action-drafts', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, studentRef, status } = req.query;
  if (planId) { sendResponse(res, await pauseDraftService.listActionDraftsForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await pauseDraftService.listActionDraftsForStudent(schoolId, studentRef as string)); return; }
  sendResponse(res, await pauseDraftService.listActionDraftsForPlan(schoolId, ''));
});

router.get('/pause-action-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.getActionDraft(req.params.id));
});

router.post('/pause-action-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.markActionDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/pause-action-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.approveActionDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/pause-action-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.suppressActionDraft(buildContext(req), req.params.id));
});

router.post('/pause-action-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.blockActionDraft(buildContext(req), req.params.id));
});

router.post('/pause-action-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await pauseDraftService.voidActionDraft(buildContext(req), req.params.id));
});

// ─── Closure Action Drafts ───────────────────────────────────────────
router.post('/closure-action-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.createClosureActionDraft(buildContext(req), req.body));
});

router.get('/closure-action-drafts', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, studentRef, status } = req.query;
  if (planId) { sendResponse(res, await closureDraftService.listActionDraftsForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await closureDraftService.listActionDraftsForStudent(schoolId, studentRef as string)); return; }
  if (status) { sendResponse(res, await closureDraftService.listActionDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await closureDraftService.listActionDraftsForPlan(schoolId, ''));
});

router.get('/closure-action-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.getActionDraft(req.params.id));
});

router.post('/closure-action-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.markActionDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/closure-action-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.approveActionDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/closure-action-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.suppressActionDraft(buildContext(req), req.params.id));
});

router.post('/closure-action-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.blockActionDraft(buildContext(req), req.params.id));
});

router.post('/closure-action-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await closureDraftService.voidActionDraft(buildContext(req), req.params.id));
});

// ─── Approval Gates ──────────────────────────────────────────────────
router.post('/approval-gates', async (req: Request, res: Response) => {
  sendResponse(res, await approvalGateService.createApprovalGate(buildContext(req), req.body));
});

router.get('/approval-gates', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, studentRef, status } = req.query;
  if (planId) { sendResponse(res, await approvalGateService.listApprovalGatesForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await approvalGateService.listApprovalGatesForStudent(schoolId, studentRef as string)); return; }
  if (status) { sendResponse(res, await approvalGateService.listApprovalGatesByStatus(schoolId, status as any)); return; }
  sendResponse(res, await approvalGateService.listApprovalGatesForPlan(schoolId, ''));
});

router.get('/approval-gates/:id', async (req: Request, res: Response) => {
  sendResponse(res, await approvalGateService.getApprovalGate(req.params.id));
});

router.post('/approval-gates/:id/satisfied', async (req: Request, res: Response) => {
  sendResponse(res, await approvalGateService.markApprovalGateSatisfied(buildContext(req), req.params.id));
});

router.post('/approval-gates/:id/blocked', async (req: Request, res: Response) => {
  sendResponse(res, await approvalGateService.markApprovalGateBlocked(buildContext(req), req.params.id));
});

router.post('/approval-gates/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await approvalGateService.voidApprovalGate(buildContext(req), req.params.id));
});

// ─── Mock Activation Queue ───────────────────────────────────────────
router.post('/mock-activation-queue', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.createMockActivationQueueItem(buildContext(req), req.body));
});

router.get('/mock-activation-queue', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await mockQueueService.listQueueItemsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await mockQueueService.listQueueItemsByStatus(schoolId, status as any)); return; }
  sendResponse(res, await mockQueueService.listQueueItemsForSchool(schoolId));
});

router.get('/mock-activation-queue/:id', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.getMockActivationQueueItem(req.params.id));
});

router.post('/mock-activation-queue/:id/dry-run-ready', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.markQueueItemDryRunReady(buildContext(req), req.params.id));
});

router.post('/mock-activation-queue/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.suppressQueueItem(buildContext(req), req.params.id));
});

router.post('/mock-activation-queue/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.blockQueueItem(buildContext(req), req.params.id));
});

router.post('/mock-activation-queue/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await mockQueueService.voidQueueItem(buildContext(req), req.params.id));
});

// ─── Dry-Run Receipts ────────────────────────────────────────────────
router.post('/dry-run-receipts', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.createDryRunReceipt(buildContext(req), req.body));
});

router.get('/dry-run-receipts', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { queueItemId, planId, result } = req.query;
  if (queueItemId) { sendResponse(res, await dryRunService.listReceiptsForQueueItem(queueItemId as string)); return; }
  if (planId) { sendResponse(res, await dryRunService.listReceiptsForPlan(schoolId, planId as string)); return; }
  if (result) { sendResponse(res, await dryRunService.listReceiptsByResult(schoolId, result as any)); return; }
  sendResponse(res, { success: false, status: 'error', message: 'Provide queueItemId, planId, or result query' });
});

router.get('/dry-run-receipts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.getDryRunReceipt(req.params.id));
});

router.post('/dry-run-receipts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.voidDryRunReceipt(buildContext(req), req.params.id));
});

// ─── Rollback Plans ──────────────────────────────────────────────────
router.post('/rollback-plans', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.createRollbackPlan(buildContext(req), req.body));
});

router.get('/rollback-plans', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await rollbackService.listRollbackPlansForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await rollbackService.listRollbackPlansByStatus(schoolId, status as any)); return; }
  sendResponse(res, await rollbackService.listRollbackPlansForPlan(schoolId, ''));
});

router.get('/rollback-plans/:id', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.getRollbackPlan(req.params.id));
});

router.post('/rollback-plans/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.markRollbackPlanReviewReady(buildContext(req), req.params.id));
});

router.post('/rollback-plans/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.approveRollbackPlanForFutureUse(buildContext(req), req.params.id));
});

router.post('/rollback-plans/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.suppressRollbackPlan(buildContext(req), req.params.id));
});

router.post('/rollback-plans/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.blockRollbackPlan(buildContext(req), req.params.id));
});

router.post('/rollback-plans/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await rollbackService.voidRollbackPlan(buildContext(req), req.params.id));
});

// ─── Suppression Rules ───────────────────────────────────────────────
router.post('/suppression-rules', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.createSuppressionRule(buildContext(req), req.body));
});

router.get('/suppression-rules', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await suppressionService.listSuppressionRulesForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await suppressionService.listSuppressionRulesByStatus(schoolId, status as any)); return; }
  sendResponse(res, await suppressionService.listSuppressionRulesForPlan(schoolId, ''));
});

router.get('/suppression-rules/:id', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.getSuppressionRule(req.params.id));
});

router.post('/suppression-rules/:id/activate', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.activateSuppressionRuleForFutureUse(buildContext(req), req.params.id));
});

router.post('/suppression-rules/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.suppressSuppressionRule(buildContext(req), req.params.id));
});

router.post('/suppression-rules/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.blockSuppressionRule(buildContext(req), req.params.id));
});

router.post('/suppression-rules/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await suppressionService.voidSuppressionRule(buildContext(req), req.params.id));
});

// ─── Summaries ───────────────────────────────────────────────────────
router.post('/summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.createActionSummary(buildContext(req), req.body));
});

router.get('/summaries', async (req: Request, res: Response) => {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await summaryService.listActionSummariesForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await summaryService.listActionSummariesForPlan(schoolId, planId as string)); return; }
  sendResponse(res, await summaryService.listActionSummariesForSchool(schoolId));
});

router.get('/summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.getActionSummary(req.params.id));
});

router.post('/summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.refreshActionSummary(buildContext(req), req.params.id, req.body));
});

router.post('/summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markActionSummaryStale(buildContext(req), req.params.id));
});

router.post('/summaries/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.blockActionSummary(buildContext(req), req.params.id));
});

router.post('/summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.voidActionSummary(buildContext(req), req.params.id));
});

export default router;
