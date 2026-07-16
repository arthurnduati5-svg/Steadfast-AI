import { Router, Request, Response } from 'express';
import { RecoveryCaseTriageReadinessService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseTriageReadinessService';
import { RecoveryCasePriorityEngineService } from '../domains/assessment/recovery-case-triage/services/recoveryCasePriorityEngineService';
import { RecoveryCasePriorityAssessmentService } from '../domains/assessment/recovery-case-triage/services/recoveryCasePriorityAssessmentService';
import { RecoveryCaseFairnessService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseFairnessService';
import { RecoveryCaseCapacityService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseCapacityService';
import { RecoveryCaseQueueService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseQueueService';
import { RecoveryCaseAllocationDraftService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseAllocationDraftService';
import { RecoveryCaseEscalationDraftService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseEscalationDraftService';
import { RecoveryCaseReviewWindowDraftService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseReviewWindowDraftService';
import { RecoveryCaseQueueExplanationService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseQueueExplanationService';
import { RecoveryCaseDuplicateSuppressionService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseDuplicateSuppressionService';
import { RecoveryCaseTriageSummaryService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseTriageSummaryService';
import { RecoveryCaseTriageAuditBridge } from '../domains/assessment/recovery-case-triage/services/recoveryCaseTriageAuditBridge';
import { RecoveryCaseTriageIdempotencyService } from '../domains/assessment/recovery-case-triage/services/recoveryCaseTriageIdempotencyService';
import {
  InMemoryRecoveryCaseTriageReadinessRepository,
  InMemoryRecoveryCasePriorityAssessmentRepository,
  InMemoryRecoveryCasePriorityFactorRepository,
  InMemoryRecoveryCaseFairnessCheckRepository,
  InMemoryRecoveryCaseCapacitySnapshotRepository,
  InMemoryRecoveryCaseTriageQueueSnapshotRepository,
  InMemoryRecoveryCaseTriageQueueItemRepository,
  InMemoryRecoveryCaseWorkloadAllocationDraftRepository,
  InMemoryRecoveryCaseEscalationDraftRepository,
  InMemoryRecoveryCaseReviewWindowDraftRepository,
  InMemoryRecoveryCaseQueueExplanationRepository,
  InMemoryRecoveryCaseDuplicateSuppressionRepository,
  InMemoryRecoveryCaseTriageSummaryRepository,
  InMemoryRecoveryCaseTriageAuditRepository,
  InMemoryRecoveryCaseTriageIdempotencyRepository,
} from '../domains/assessment/recovery-case-triage/repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseTriageCommandContext } from '../domains/assessment/recovery-case-triage/contracts/recoveryCaseTriageContracts';

const router = Router();

// ─── Repository Instances ────────────────────────────────────────────
const readinessRepo = new InMemoryRecoveryCaseTriageReadinessRepository();
const priorityAssessmentRepo = new InMemoryRecoveryCasePriorityAssessmentRepository();
const priorityFactorRepo = new InMemoryRecoveryCasePriorityFactorRepository();
const fairnessRepo = new InMemoryRecoveryCaseFairnessCheckRepository();
const capacityRepo = new InMemoryRecoveryCaseCapacitySnapshotRepository();
const queueSnapshotRepo = new InMemoryRecoveryCaseTriageQueueSnapshotRepository();
const queueItemRepo = new InMemoryRecoveryCaseTriageQueueItemRepository();
const allocationDraftRepo = new InMemoryRecoveryCaseWorkloadAllocationDraftRepository();
const escalationDraftRepo = new InMemoryRecoveryCaseEscalationDraftRepository();
const reviewWindowDraftRepo = new InMemoryRecoveryCaseReviewWindowDraftRepository();
const queueExplanationRepo = new InMemoryRecoveryCaseQueueExplanationRepository();
const duplicateSuppressionRepo = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
const triageSummaryRepo = new InMemoryRecoveryCaseTriageSummaryRepository();
const auditRepo = new InMemoryRecoveryCaseTriageAuditRepository();
const idempotencyRepo = new InMemoryRecoveryCaseTriageIdempotencyRepository();

// ─── Shared Services ─────────────────────────────────────────────────
const engine = new RecoveryCasePriorityEngineService();
const audit = new RecoveryCaseTriageAuditBridge(auditRepo);
const idempotency = new RecoveryCaseTriageIdempotencyService(idempotencyRepo, engine);
const fairness = new RecoveryCaseFairnessService(fairnessRepo);

// ─── Domain Services ─────────────────────────────────────────────────
const readinessService = new RecoveryCaseTriageReadinessService(readinessRepo);
const priorityAssessmentService = new RecoveryCasePriorityAssessmentService(priorityAssessmentRepo, priorityFactorRepo, engine, fairness, audit, idempotency);
const capacityService = new RecoveryCaseCapacityService(capacityRepo);
const queueService = new RecoveryCaseQueueService(queueSnapshotRepo, queueItemRepo, engine, new RecoveryCaseDuplicateSuppressionService(duplicateSuppressionRepo), fairness, audit);
const allocationDraftService = new RecoveryCaseAllocationDraftService(allocationDraftRepo);
const escalationDraftService = new RecoveryCaseEscalationDraftService(escalationDraftRepo);
const reviewWindowDraftService = new RecoveryCaseReviewWindowDraftService(reviewWindowDraftRepo);
const queueExplanationService = new RecoveryCaseQueueExplanationService(queueExplanationRepo, priorityFactorRepo);
const duplicateSuppressionService = new RecoveryCaseDuplicateSuppressionService(duplicateSuppressionRepo);
const triageSummaryService = new RecoveryCaseTriageSummaryService(triageSummaryRepo);

function buildContext(req: Request): RecoveryCaseTriageCommandContext {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `ik-${Date.now()}`,
    sourceRefsJson: req.body?.sourceRefsJson,
  };
}

function extractSchoolId(req: Request): string {
  return (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
}

function sendResponse(res: Response, result: any) {
  if (result.success) return res.status(200).json(result);
  if (result.status === 'DUPLICATE') return res.status(409).json(result);
  if (result.status === 'NOT_FOUND') return res.status(404).json(result);
  if (result.status === 'error') return res.status(400).json(result);
  return res.status(200).json(result);
}

// ─── GROUP 1: Triage Readiness ───────────────────────────────────────
router.post('/triage-readiness', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await readinessService.createTriageReadiness(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await readinessService.listTriageReadinessForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await readinessService.getTriageReadiness(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/by-student/:studentRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await readinessService.listTriageReadinessForStudent(schoolId, req.params.studentRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/by-plan/:planId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await readinessService.listTriageReadinessForPlan(schoolId, req.params.planId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/by-board-snapshot/:snapshotId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await readinessRepo.listByBoardSnapshotId(schoolId, req.params.snapshotId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/by-board-card/:cardId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await readinessRepo.listByBoardCardId(schoolId, req.params.cardId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-readiness/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await readinessService.listTriageReadinessByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await readinessService.markTriageReadinessReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await readinessService.markTriageReadinessReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/stale', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await readinessService.markTriageReadinessStale(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await readinessService.blockTriageReadiness(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/suppress', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_SUPPRESS';
    const safeMessage = req.body?.safeMessage || 'Suppressed by user action';
    const result = await readinessService.suppressTriageReadiness(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-readiness/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await readinessService.voidTriageReadiness(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 2: Priority Assessments ───────────────────────────────────
router.post('/priority-assessments', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await priorityAssessmentService.createPriorityAssessment(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await priorityAssessmentService.listPriorityAssessmentsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await priorityAssessmentService.getPriorityAssessment(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-student/:studentRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await priorityAssessmentService.listPriorityAssessmentsForStudent(schoolId, req.params.studentRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-plan/:planId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await priorityAssessmentService.listPriorityAssessmentsForPlan(schoolId, req.params.planId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-board-snapshot/:snapshotId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await priorityAssessmentRepo.listByBoardSnapshotId(schoolId, req.params.snapshotId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-board-card/:cardId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await priorityAssessmentRepo.listByBoardCardId(schoolId, req.params.cardId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-band/:band', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await priorityAssessmentService.listPriorityAssessmentsByBand(schoolId, req.params.band);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/priority-assessments/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await priorityAssessmentService.listPriorityAssessmentsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/priority-assessments/:id/score', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await priorityAssessmentService.scorePriorityAssessment(ctx, schoolId, req.params.id, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/priority-assessments/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await priorityAssessmentService.markPriorityAssessmentReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/priority-assessments/:id/stale', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await priorityAssessmentService.markPriorityAssessmentStale(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/priority-assessments/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await priorityAssessmentService.blockPriorityAssessment(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/priority-assessments/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await priorityAssessmentService.voidPriorityAssessment(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 3: Fairness Checks ────────────────────────────────────────
router.post('/fairness-checks', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await fairness.createFairnessCheck(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/fairness-checks', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await fairnessRepo.listBySchool(schoolId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/fairness-checks/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await fairness.getFairnessCheck(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/fairness-checks/by-assessment/:assessmentId', async (req: Request, res: Response) => {
  try {
    const result = await fairness.listFairnessChecksForAssessment(req.params.assessmentId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/fairness-checks/by-queue/:queueSnapshotId', async (req: Request, res: Response) => {
  try {
    const result = await fairness.listFairnessChecksForQueue(req.params.queueSnapshotId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/fairness-checks/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await fairness.listFairnessChecksByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/fairness-checks/:id/evaluate', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await fairness.evaluateFairnessCheck(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/fairness-checks/:id/needs-review', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await fairness.markFairnessNeedsReview(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/fairness-checks/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await fairness.blockFairnessCheck(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/fairness-checks/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await fairness.voidFairnessCheck(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 4: Capacity Snapshots ─────────────────────────────────────
router.post('/capacity-snapshots', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await capacityService.createCapacitySnapshot(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/capacity-snapshots', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await capacityService.listCapacitySnapshotsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/capacity-snapshots/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await capacityService.getCapacitySnapshot(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/capacity-snapshots/by-role/:role', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await capacityService.listCapacitySnapshotsByRole(schoolId, req.params.role);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/capacity-snapshots/by-reviewer/:reviewerRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await capacityService.listCapacitySnapshotsByReviewer(schoolId, req.params.reviewerRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/capacity-snapshots/by-window', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const reviewWindowId = (req.query.windowId as string) || (req.query.reviewWindowId as string) || '';
    if (!reviewWindowId) { sendResponse(res, { success: false, status: 'DENIED', message: 'reviewWindowId query param is required' }); return; }
    const result = await capacityService.listCapacitySnapshotsByWindow(schoolId, reviewWindowId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/capacity-snapshots/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await capacityService.markCapacitySnapshotReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/capacity-snapshots/:id/capacity-exceeded', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await capacityService.markCapacityExceeded(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/capacity-snapshots/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await capacityService.voidCapacitySnapshot(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 5: Queue Snapshots ────────────────────────────────────────
router.post('/queue-snapshots', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await queueService.createQueueSnapshot(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-snapshots', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueSnapshotsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-snapshots/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await queueService.getQueueSnapshot(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-snapshots/by-role/:audienceRole', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueSnapshotsByAudienceRole(schoolId, req.params.audienceRole);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-snapshots/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueSnapshotsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-snapshots/:id/generate', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const { candidates, capacityLimit } = req.body;
    const result = await queueService.generateQueueSnapshot(ctx, schoolId, req.params.id, candidates || [], capacityLimit || 0);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-snapshots/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await queueService.markQueueSnapshotReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-snapshots/:id/stale', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await queueService.markQueueSnapshotStale(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-snapshots/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const data = await queueSnapshotRepo.block(req.params.id, reasonCode, safeMessage);
    sendResponse(res, { success: true, data, status: 'blocked' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-snapshots/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await queueService.voidQueueSnapshot(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 6: Queue Items ────────────────────────────────────────────
router.get('/queue-items', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await queueItemRepo.listBySchool(schoolId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/:id', async (req: Request, res: Response) => {
  try {
    const result = await queueItemRepo.getById(req.params.id);
    if (!result) { sendResponse(res, { success: false, status: 'NOT_FOUND', message: 'Queue item not found' }); return; }
    sendResponse(res, { success: true, data: result, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/by-snapshot/:snapshotId', async (req: Request, res: Response) => {
  try {
    const result = await queueService.listQueueItemsForSnapshot(req.params.snapshotId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/by-student/:studentRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueItemsForStudent(schoolId, req.params.studentRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/by-plan/:planId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueItemsForPlan(schoolId, req.params.planId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/by-band/:band', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueItemsByPriorityBand(schoolId, req.params.band);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-items/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await queueService.listQueueItemsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-items/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await queueService.markQueueItemReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-items/:id/defer', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_DEFER';
    const safeMessage = req.body?.safeMessage || 'Deferred by user action';
    const result = await queueService.deferQueueItem(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-items/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await queueService.blockQueueItem(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/queue-items/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await queueService.voidQueueItem(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 7: Allocation Drafts ─────────────────────────────────────
router.post('/allocation-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await allocationDraftService.createAllocationDraft(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/allocation-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await allocationDraftService.listAllocationDraftsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/allocation-drafts/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await allocationDraftService.getAllocationDraft(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/allocation-drafts/by-queue/:queueItemId', async (req: Request, res: Response) => {
  try {
    const result = await allocationDraftService.listAllocationDraftsForQueue(req.params.queueItemId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/allocation-drafts/by-reviewer/:reviewerRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await allocationDraftService.listAllocationDraftsByReviewer(schoolId, req.params.reviewerRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/allocation-drafts/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await allocationDraftService.listAllocationDraftsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/allocation-drafts/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await allocationDraftService.markAllocationDraftReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/allocation-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await allocationDraftService.approveAllocationDraftForFutureUse(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/allocation-drafts/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await allocationDraftService.blockAllocationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/allocation-drafts/:id/suppress', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_SUPPRESS';
    const safeMessage = req.body?.safeMessage || 'Suppressed by user action';
    const result = await allocationDraftService.suppressAllocationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/allocation-drafts/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await allocationDraftService.voidAllocationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 8: Escalation Drafts ──────────────────────────────────────
router.post('/escalation-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await escalationDraftService.createEscalationDraft(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/escalation-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await escalationDraftService.listEscalationDraftsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/escalation-drafts/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await escalationDraftService.getEscalationDraft(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/escalation-drafts/by-queue/:queueItemId', async (req: Request, res: Response) => {
  try {
    const result = await escalationDraftService.listEscalationDraftsForQueue(req.params.queueItemId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/escalation-drafts/by-level/:level', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await escalationDraftService.listEscalationDraftsByLevel(schoolId, req.params.level);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/escalation-drafts/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await escalationDraftService.listEscalationDraftsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/escalation-drafts/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await escalationDraftService.markEscalationDraftReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/escalation-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await escalationDraftService.approveEscalationDraftForFutureUse(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/escalation-drafts/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await escalationDraftService.blockEscalationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/escalation-drafts/:id/suppress', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_SUPPRESS';
    const safeMessage = req.body?.safeMessage || 'Suppressed by user action';
    const result = await escalationDraftService.suppressEscalationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/escalation-drafts/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await escalationDraftService.voidEscalationDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 9: Review Window Drafts ──────────────────────────────────
router.post('/review-window-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await reviewWindowDraftService.createReviewWindowDraft(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/review-window-drafts', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await reviewWindowDraftService.listReviewWindowDraftsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/review-window-drafts/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await reviewWindowDraftService.getReviewWindowDraft(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/review-window-drafts/by-queue/:queueItemId', async (req: Request, res: Response) => {
  try {
    const result = await reviewWindowDraftService.listReviewWindowDraftsForQueue(req.params.queueItemId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/review-window-drafts/by-reviewer/:reviewerRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await reviewWindowDraftService.listReviewWindowDraftsByReviewer(schoolId, req.params.reviewerRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/review-window-drafts/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await reviewWindowDraftService.listReviewWindowDraftsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/review-window-drafts/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await reviewWindowDraftService.markReviewWindowDraftReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/review-window-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await reviewWindowDraftService.approveReviewWindowForFutureUse(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/review-window-drafts/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await reviewWindowDraftService.blockReviewWindowDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/review-window-drafts/:id/suppress', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_SUPPRESS';
    const safeMessage = req.body?.safeMessage || 'Suppressed by user action';
    const result = await reviewWindowDraftService.suppressReviewWindowDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/review-window-drafts/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await reviewWindowDraftService.voidReviewWindowDraft(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 10: Queue Explanations ────────────────────────────────────
router.post('/queue-explanations', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await queueExplanationService.createQueueExplanation(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-explanations', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const data = await queueExplanationRepo.listBySchool(schoolId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-explanations/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await queueExplanationService.getQueueExplanation(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-explanations/by-item/:queueItemId', async (req: Request, res: Response) => {
  try {
    const result = await queueExplanationService.listQueueExplanationsForItem(req.params.queueItemId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-explanations/by-assessment/:assessmentId', async (req: Request, res: Response) => {
  try {
    const data = await queueExplanationRepo.listByAssessment(req.params.assessmentId);
    sendResponse(res, { success: true, data, status: 'found' });
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/queue-explanations/by-snapshot/:snapshotId', async (req: Request, res: Response) => {
  try {
    const result = await queueExplanationService.listQueueExplanationsForSnapshot(req.params.snapshotId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 11: Duplicate Suppressions ───────────────────────────────
router.post('/duplicate-suppressions', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await duplicateSuppressionService.createDuplicateSuppression(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/duplicate-suppressions', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await duplicateSuppressionService.listDuplicateSuppressionsForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/duplicate-suppressions/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await duplicateSuppressionService.getDuplicateSuppression(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/duplicate-suppressions/by-plan/:planId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await duplicateSuppressionService.listDuplicateSuppressionsForPlan(schoolId, req.params.planId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/duplicate-suppressions/by-status/:status', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await duplicateSuppressionService.listDuplicateSuppressionsByStatus(schoolId, req.params.status);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/duplicate-suppressions/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await duplicateSuppressionService.voidDuplicateSuppression(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

// ─── GROUP 12: Triage Summaries ─────────────────────────────────────
router.post('/triage-summaries', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await triageSummaryService.createTriageSummary(ctx, schoolId, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-summaries', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await triageSummaryService.listTriageSummariesForSchool(schoolId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-summaries/:id', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    const result = await triageSummaryService.getTriageSummary(schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-summaries/by-student/:studentRef', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await triageSummaryService.listTriageSummariesForStudent(schoolId, req.params.studentRef);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.get('/triage-summaries/by-plan/:planId', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const result = await triageSummaryService.listTriageSummariesForPlan(schoolId, req.params.planId);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-summaries/:id/refresh', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await triageSummaryService.refreshTriageSummary(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-summaries/:id/review-ready', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await triageSummaryService.markTriageSummaryReviewReady(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-summaries/:id/stale', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const result = await triageSummaryService.markTriageSummaryStale(ctx, schoolId, req.params.id);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-summaries/:id/block', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_BLOCK';
    const safeMessage = req.body?.safeMessage || 'Blocked by user action';
    const result = await triageSummaryService.blockTriageSummary(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

router.post('/triage-summaries/:id/void', async (req: Request, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) { sendResponse(res, { success: false, status: 'DENIED', message: 'schoolId is required' }); return; }
    const ctx = buildContext(req);
    const reasonCode = req.body?.reasonCode || 'MANUAL_VOID';
    const safeMessage = req.body?.safeMessage || 'Voided by user action';
    const result = await triageSummaryService.voidTriageSummary(ctx, schoolId, req.params.id, reasonCode, safeMessage);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, { success: false, status: 'error', message: err.message });
  }
});

export default router;
