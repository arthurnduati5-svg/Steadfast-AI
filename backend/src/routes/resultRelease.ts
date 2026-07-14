import { Router, Request, Response } from 'express';
import {
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseApprovalRepository,
  InMemoryResultAudienceProjectionRepository,
  InMemoryStudentResultReportSnapshotRepository,
  InMemoryParentSafeResultSummaryRepository,
  InMemoryStudentSafeResultSummaryRepository,
  InMemoryResultReleaseDeliveryIntentRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
} from '../domains/assessment/result-release/repositories/inMemoryResultReleaseRepositories';
import { ResultReleasePacketService } from '../domains/assessment/result-release/services/resultReleasePacketService';
import { ResultReleaseBoundaryEnforcementService } from '../domains/assessment/result-release/services/resultReleaseBoundaryEnforcementService';
import { ResultReleaseApprovalService } from '../domains/assessment/result-release/services/resultReleaseApprovalService';
import { ResultAudienceProjectionService } from '../domains/assessment/result-release/services/resultAudienceProjectionService';
import { ResultReportSnapshotService } from '../domains/assessment/result-release/services/resultReportSnapshotService';
import { ParentSafeResultSummaryService } from '../domains/assessment/result-release/services/parentSafeResultSummaryService';
import { StudentSafeResultSummaryService } from '../domains/assessment/result-release/services/studentSafeResultSummaryService';
import { ResultReleaseDeliveryIntentService } from '../domains/assessment/result-release/services/resultReleaseDeliveryIntentService';
import { ResultReleaseProjectionSafetyService } from '../domains/assessment/result-release/services/resultReleaseProjectionSafetyService';
import { ResultReleaseAuditBridge } from '../domains/assessment/result-release/services/resultReleaseAuditBridge';
import { ResultReleaseIdempotencyService } from '../domains/assessment/result-release/services/resultReleaseIdempotencyService';
import type { ResultReleaseCommandContext, ResultReleaseSafeEnvelope } from '../domains/assessment/result-release/contracts/resultReleaseContracts';

const router = Router();

const packetRepo = new InMemoryResultReleasePacketRepository();
const approvalRepo = new InMemoryResultReleaseApprovalRepository();
const projectionRepo = new InMemoryResultAudienceProjectionRepository();
const reportSnapshotRepo = new InMemoryStudentResultReportSnapshotRepository();
const parentSummaryRepo = new InMemoryParentSafeResultSummaryRepository();
const studentSummaryRepo = new InMemoryStudentSafeResultSummaryRepository();
const deliveryIntentRepo = new InMemoryResultReleaseDeliveryIntentRepository();
const auditRepo = new InMemoryResultReleaseAuditRepository();
const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();

const auditBridge = new ResultReleaseAuditBridge(auditRepo);
const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
const packetService = new ResultReleasePacketService(packetRepo, approvalRepo, auditBridge, idempotencyService);
const boundaryService = new ResultReleaseBoundaryEnforcementService();
const approvalService = new ResultReleaseApprovalService(approvalRepo, packetRepo, auditBridge, idempotencyService);
const projectionService = new ResultAudienceProjectionService(projectionRepo, auditBridge, idempotencyService);
const reportSnapshotService = new ResultReportSnapshotService(reportSnapshotRepo, auditBridge, idempotencyService);
const parentSummaryService = new ParentSafeResultSummaryService(parentSummaryRepo, auditBridge, idempotencyService);
const studentSummaryService = new StudentSafeResultSummaryService(studentSummaryRepo, auditBridge, idempotencyService);
const deliveryIntentService = new ResultReleaseDeliveryIntentService(deliveryIntentRepo, auditBridge, idempotencyService);
const projectionSafetyService = new ResultReleaseProjectionSafetyService();

function extractContext(req: Request): ResultReleaseCommandContext {
  return {
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || 'test-school',
    actorId: (req as any).user?.id || 'test-actor',
    actorRole: (req as any).user?.role || 'admin',
    correlationId: (req as any).correlationId || 'test-correlation',
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `auto-${Date.now()}`,
  };
}

function sendEnvelope(res: Response, envelope: ResultReleaseSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── PACKETS ───────────────────────────────────────────────

router.post('/packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.createReleasePacketFromFinalizedResult(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.getReleasePacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.get('/packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.listReleasePacketsForSchool(ctx);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/run-source-checks', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.runReleaseSourceChecks(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/boundary-checked', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.markPacketBoundaryChecked(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/ready-for-approval', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.markPacketReadyForApproval(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.blockReleasePacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.cancelReleasePacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/packets/:resultReleasePacketId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.voidReleasePacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

// ─── APPROVALS ────────────────────────────────────────────

router.post('/packets/:resultReleasePacketId/approvals', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.createReleaseApproval(ctx, {
    ...req.body,
    resultReleasePacketId: req.params.resultReleasePacketId,
  });
  sendEnvelope(res, result);
});

router.get('/approvals/:resultReleaseApprovalId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.getReleaseApproval(ctx, req.params.resultReleaseApprovalId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/approvals', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.listApprovalsForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/approvals/:resultReleaseApprovalId/approve', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.approveReleasePacket(ctx, req.params.resultReleaseApprovalId);
  sendEnvelope(res, result);
});

router.post('/approvals/:resultReleaseApprovalId/reject', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.rejectReleasePacket(ctx, req.params.resultReleaseApprovalId);
  sendEnvelope(res, result);
});

router.post('/approvals/:resultReleaseApprovalId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.blockReleaseApproval(ctx, req.params.resultReleaseApprovalId);
  sendEnvelope(res, result);
});

router.post('/approvals/:resultReleaseApprovalId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await approvalService.voidReleaseApproval(ctx, req.params.resultReleaseApprovalId);
  sendEnvelope(res, result);
});

// ─── AUDIENCE PROJECTIONS ────────────────────────────────

router.post('/packets/:resultReleasePacketId/audience-projections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionService.generateAudienceProjection(ctx, {
    ...req.body,
    resultReleasePacketId: req.params.resultReleasePacketId,
  });
  sendEnvelope(res, result);
});

router.get('/audience-projections/:resultAudienceProjectionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionService.getAudienceProjection(ctx, req.params.resultAudienceProjectionId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/audience-projections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionService.listAudienceProjectionsForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/audience-projections/:resultAudienceProjectionId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionService.blockAudienceProjection(ctx, req.params.resultAudienceProjectionId);
  sendEnvelope(res, result);
});

router.post('/audience-projections/:resultAudienceProjectionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionService.voidAudienceProjection(ctx, req.params.resultAudienceProjectionId);
  sendEnvelope(res, result);
});

// ─── REPORT SNAPSHOTS ────────────────────────────────────

router.post('/audience-projections/:resultAudienceProjectionId/report-snapshots', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.createStudentResultReportSnapshot(ctx, {
    ...req.body,
    resultAudienceProjectionId: req.params.resultAudienceProjectionId,
  });
  sendEnvelope(res, result);
});

router.get('/report-snapshots/:studentResultReportSnapshotId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.getStudentResultReportSnapshot(ctx, req.params.studentResultReportSnapshotId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/report-snapshots', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.listReportSnapshotsForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/report-snapshots/:studentResultReportSnapshotId/approve-internal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.approveReportSnapshotForInternalUse(ctx, req.params.studentResultReportSnapshotId);
  sendEnvelope(res, result);
});

router.post('/report-snapshots/:studentResultReportSnapshotId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.blockReportSnapshot(ctx, req.params.studentResultReportSnapshotId);
  sendEnvelope(res, result);
});

router.post('/report-snapshots/:studentResultReportSnapshotId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reportSnapshotService.voidReportSnapshot(ctx, req.params.studentResultReportSnapshotId);
  sendEnvelope(res, result);
});

// ─── PARENT SAFE SUMMARIES ───────────────────────────────

router.post('/audience-projections/:resultAudienceProjectionId/parent-safe-summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.generateParentSafeSummary(ctx, {
    ...req.body,
    resultAudienceProjectionId: req.params.resultAudienceProjectionId,
  });
  sendEnvelope(res, result);
});

router.get('/parent-safe-summaries/:parentSafeResultSummaryId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.getParentSafeSummary(ctx, req.params.parentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/parent-safe-summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.listParentSafeSummariesForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/parent-safe-summaries/:parentSafeResultSummaryId/approve-future-delivery', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.approveParentSafeSummaryForFutureDelivery(ctx, req.params.parentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.post('/parent-safe-summaries/:parentSafeResultSummaryId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.blockParentSafeSummary(ctx, req.params.parentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.post('/parent-safe-summaries/:parentSafeResultSummaryId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSummaryService.voidParentSafeSummary(ctx, req.params.parentSafeResultSummaryId);
  sendEnvelope(res, result);
});

// ─── STUDENT SAFE SUMMARIES ──────────────────────────────

router.post('/audience-projections/:resultAudienceProjectionId/student-safe-summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.generateStudentSafeSummary(ctx, {
    ...req.body,
    resultAudienceProjectionId: req.params.resultAudienceProjectionId,
  });
  sendEnvelope(res, result);
});

router.get('/student-safe-summaries/:studentSafeResultSummaryId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.getStudentSafeSummary(ctx, req.params.studentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/student-safe-summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.listStudentSafeSummariesForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/student-safe-summaries/:studentSafeResultSummaryId/approve-future-delivery', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.approveStudentSafeSummaryForFutureDelivery(ctx, req.params.studentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.post('/student-safe-summaries/:studentSafeResultSummaryId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.blockStudentSafeSummary(ctx, req.params.studentSafeResultSummaryId);
  sendEnvelope(res, result);
});

router.post('/student-safe-summaries/:studentSafeResultSummaryId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSummaryService.voidStudentSafeSummary(ctx, req.params.studentSafeResultSummaryId);
  sendEnvelope(res, result);
});

// ─── DELIVERY INTENTS ─────────────────────────────────────

router.post('/packets/:resultReleasePacketId/delivery-intents', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.createDeliveryIntent(ctx, {
    ...req.body,
    resultReleasePacketId: req.params.resultReleasePacketId,
  });
  sendEnvelope(res, result);
});

router.get('/delivery-intents/:resultReleaseDeliveryIntentId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.getDeliveryIntent(ctx, req.params.resultReleaseDeliveryIntentId);
  sendEnvelope(res, result);
});

router.get('/packets/:resultReleasePacketId/delivery-intents', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.listDeliveryIntentsForPacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/delivery-intents/:resultReleaseDeliveryIntentId/eligible', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.markDeliveryIntentEligible(ctx, req.params.resultReleaseDeliveryIntentId);
  sendEnvelope(res, result);
});

router.post('/delivery-intents/:resultReleaseDeliveryIntentId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.blockDeliveryIntent(ctx, req.params.resultReleaseDeliveryIntentId);
  sendEnvelope(res, result);
});

router.post('/delivery-intents/:resultReleaseDeliveryIntentId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryIntentService.voidDeliveryIntent(ctx, req.params.resultReleaseDeliveryIntentId);
  sendEnvelope(res, result);
});

// ─── PROJECTION SAFETY ROUTES ────────────────────────────

router.get('/packets/:resultReleasePacketId/projection/teacher', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const packet = await packetService.getReleasePacket(ctx, req.params.resultReleasePacketId);
  if (!packet.ok || !packet.data) {
    sendEnvelope(res, packet);
    return;
  }
  const projection = await projectionSafetyService.toTeacherProjection(ctx, (packet.data as any) as Record<string, unknown>);
  sendEnvelope(res, projection);
});

router.get('/packets/:resultReleasePacketId/projection/admin', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const packet = await packetService.getReleasePacket(ctx, req.params.resultReleasePacketId);
  if (!packet.ok || !packet.data) {
    sendEnvelope(res, packet);
    return;
  }
  const projection = await projectionSafetyService.toAdminProjection(ctx, (packet.data as any) as Record<string, unknown>);
  sendEnvelope(res, projection);
});

router.get('/packets/:resultReleasePacketId/projection/student-safe', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const packet = await packetService.getReleasePacket(ctx, req.params.resultReleasePacketId);
  if (!packet.ok || !packet.data) {
    sendEnvelope(res, packet);
    return;
  }
  const projection = await projectionSafetyService.toStudentSafeProjection(ctx, (packet.data as any) as Record<string, unknown>);
  sendEnvelope(res, projection);
});

router.get('/packets/:resultReleasePacketId/projection/parent-boundary', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const packet = await packetService.getReleasePacket(ctx, req.params.resultReleasePacketId);
  if (!packet.ok || !packet.data) {
    sendEnvelope(res, packet);
    return;
  }
  const projection = await projectionSafetyService.toParentBoundaryProjection(ctx, (packet.data as any) as Record<string, unknown>);
  sendEnvelope(res, projection);
});

export default router;
