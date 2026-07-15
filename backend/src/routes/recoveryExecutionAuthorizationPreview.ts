import { Router, Request, Response } from 'express';
import {
  RecoveryExecutionAuthorizationReadinessService,
  RecoveryExecutionAuthorizationRequestService,
  RecoveryExecutionAuthorizationEligibilityService,
  RecoveryExecutionAuthorityMatrixService,
  RecoveryExecutionApprovalChainService,
  RecoveryExecutionRiskAttestationService,
  RecoveryExecutionConsentBoundaryService,
  RecoveryExecutionVetoService,
  RecoveryExecutionPreflightChecklistService,
  RecoveryExecutionAuthorizationDryRunService,
  RecoveryExecutionPreLiveDecisionPacketService,
  RecoveryExecutionMockAuthorizationReceiptService,
  RecoveryExecutionAuthorizationSummaryService,
  RecoveryExecutionAuthorizationSafetyService,
  RecoveryExecutionAuthorizationAuditBridge,
  RecoveryExecutionAuthorizationIdempotencyService,
} from '../domains/assessment/recovery-execution-authorization-preview/services';
import {
  InMemoryRecoveryExecutionAuthorizationPreviewRepositories,
} from '../domains/assessment/recovery-execution-authorization-preview/repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../domains/assessment/recovery-execution-authorization-preview/contracts/recoveryExecutionAuthorizationPreviewContracts';

const router = Router();

const repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);

const readinessService = new RecoveryExecutionAuthorizationReadinessService(repos.authorizationReadiness, audit, idempotency);
const requestService = new RecoveryExecutionAuthorizationRequestService(repos.authorizationRequestDraft, audit, idempotency);
const eligibilityService = new RecoveryExecutionAuthorizationEligibilityService(repos.authorizationEligibilityCheck, audit, idempotency);
const authorityMatrixService = new RecoveryExecutionAuthorityMatrixService(repos.authorityMatrixSnapshot, audit, idempotency);
const approvalChainService = new RecoveryExecutionApprovalChainService(repos.approvalChainDraft, audit, idempotency);
const riskAttestationService = new RecoveryExecutionRiskAttestationService(repos.riskAttestation, audit, idempotency);
const consentBoundaryService = new RecoveryExecutionConsentBoundaryService(repos.consentBoundaryCheck, audit, idempotency);
const vetoService = new RecoveryExecutionVetoService(repos.veto, audit, idempotency);
const preflightChecklistService = new RecoveryExecutionPreflightChecklistService(repos.preflightChecklist, audit, idempotency);
const dryRunService = new RecoveryExecutionAuthorizationDryRunService(repos.authorizationDryRun, audit, idempotency);
const preLiveDecisionPacketService = new RecoveryExecutionPreLiveDecisionPacketService(repos.preLiveDecisionPacket, audit, idempotency);
const mockReceiptService = new RecoveryExecutionMockAuthorizationReceiptService(repos.mockAuthorizationReceipt, audit, idempotency);
const summaryService = new RecoveryExecutionAuthorizationSummaryService(repos.authorizationSummary, audit, idempotency);

function buildContext(req: Request): RecoveryExecutionAuthorizationPreviewCommandContext {
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
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
}

// ─── Authorization Readiness ─────────────────────────────────────────
router.post('/authorization-readiness', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.createAuthorizationReadiness(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authorization-readiness', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await readinessService.listAuthorizationReadinessForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await readinessService.listAuthorizationReadinessForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await readinessService.listAuthorizationReadinessByStatus(schoolId, status as string)); return; }
  sendResponse(res, await readinessService.listAuthorizationReadinessForSchool(schoolId));
});

router.get('/authorization-readiness/:id', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.getAuthorizationReadiness(extractSchoolId(req), req.params.id));
});

router.post('/authorization-readiness/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markAuthorizationReadinessReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-readiness/:id/authorization-preview-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markAuthorizationReadinessPreviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-readiness/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.suppressAuthorizationReadiness(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-readiness/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await readinessService.blockAuthorizationReadiness(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/authorization-readiness/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.voidAuthorizationReadiness(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Authorization Request Drafts ─────────────────────────────────────
router.post('/authorization-request-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.createAuthorizationRequestDraft(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authorization-request-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await requestService.listAuthorizationRequestDraftsForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await requestService.listAuthorizationRequestDraftsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await requestService.listAuthorizationRequestDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await requestService.listAuthorizationRequestDraftsForSchool(schoolId));
});

router.get('/authorization-request-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.getAuthorizationRequestDraft(extractSchoolId(req), req.params.id));
});

router.post('/authorization-request-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.markAuthorizationRequestReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-request-drafts/:id/authorization-preview-ready', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.markAuthorizationRequestPreviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-request-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.suppressAuthorizationRequest(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-request-drafts/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await requestService.blockAuthorizationRequest(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/authorization-request-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await requestService.voidAuthorizationRequest(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Authorization Eligibility Checks ─────────────────────────────────
router.post('/authorization-eligibility-checks', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.createAuthorizationEligibilityCheck(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authorization-eligibility-checks', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, decision } = req.query;
  if (planId) { sendResponse(res, await eligibilityService.listAuthorizationEligibilityChecksForPlan(schoolId, planId as string)); return; }
  if (decision) { sendResponse(res, await eligibilityService.listAuthorizationEligibilityChecksByDecision(schoolId, decision as string)); return; }
  sendResponse(res, await eligibilityService.listAuthorizationEligibilityChecksForPlan(schoolId, ''));
});

router.get('/authorization-eligibility-checks/:id', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.getAuthorizationEligibilityCheck(extractSchoolId(req), req.params.id));
});

router.post('/authorization-eligibility-checks/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.markAuthorizationEligibilityReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-eligibility-checks/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await eligibilityService.blockAuthorizationEligibilityCheck(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/authorization-eligibility-checks/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.voidAuthorizationEligibilityCheck(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Authority Matrix Snapshots ───────────────────────────────────────
router.post('/authority-matrix-snapshots', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.createAuthorityMatrixSnapshot(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authority-matrix-snapshots', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await authorityMatrixService.listAuthorityMatrixSnapshotsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await authorityMatrixService.listAuthorityMatrixSnapshotsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await authorityMatrixService.listAuthorityMatrixSnapshotsForSchool(schoolId));
});

router.get('/authority-matrix-snapshots/:id', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.getAuthorityMatrixSnapshot(extractSchoolId(req), req.params.id));
});

router.post('/authority-matrix-snapshots/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.markAuthorityMatrixReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authority-matrix-snapshots/:id/approval-chain-ready', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.markAuthorityMatrixApprovalChainReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authority-matrix-snapshots/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.suppressAuthorityMatrix(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authority-matrix-snapshots/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await authorityMatrixService.blockAuthorityMatrix(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/authority-matrix-snapshots/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await authorityMatrixService.voidAuthorityMatrix(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Approval Chain Drafts ────────────────────────────────────────────
router.post('/approval-chain-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.createApprovalChainDraft(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/approval-chain-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, approverRef, status } = req.query;
  if (planId) { sendResponse(res, await approvalChainService.listApprovalChainDraftsForPlan(schoolId, planId as string)); return; }
  if (approverRef) { sendResponse(res, await approvalChainService.listApprovalChainDraftsByApprover(schoolId, approverRef as string)); return; }
  if (status) { sendResponse(res, await approvalChainService.listApprovalChainDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await approvalChainService.listApprovalChainDraftsForPlan(schoolId, ''));
});

router.get('/approval-chain-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.getApprovalChainDraft(extractSchoolId(req), req.params.id));
});

router.post('/approval-chain-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.markApprovalChainReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/approval-chain-drafts/:id/approval-chain-ready', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.markApprovalChainReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/approval-chain-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.suppressApprovalChain(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/approval-chain-drafts/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await approvalChainService.blockApprovalChain(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/approval-chain-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await approvalChainService.voidApprovalChain(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Risk Attestations ────────────────────────────────────────────────
router.post('/risk-attestations', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.createRiskAttestation(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/risk-attestations', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, riskLevel, status, actorRef } = req.query;
  if (planId) { sendResponse(res, await riskAttestationService.listRiskAttestationsForPlan(schoolId, planId as string)); return; }
  if (riskLevel) { sendResponse(res, await riskAttestationService.listRiskAttestationsByRiskLevel(schoolId, riskLevel as string)); return; }
  if (status) { sendResponse(res, await riskAttestationService.listRiskAttestationsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await riskAttestationService.listRiskAttestationsForPlan(schoolId, ''));
});

router.get('/risk-attestations/:id', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.getRiskAttestation(extractSchoolId(req), req.params.id));
});

router.post('/risk-attestations/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.markRiskAttestationReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-attestations/:id/risk-attested', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.markRiskAttested(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-attestations/:id/veto', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.vetoRiskAttestation(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-attestations/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.suppressRiskAttestation(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-attestations/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await riskAttestationService.blockRiskAttestation(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/risk-attestations/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await riskAttestationService.voidRiskAttestation(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Consent Boundary Checks ──────────────────────────────────────────
router.post('/consent-boundary-checks', async (req: Request, res: Response) => {
  sendResponse(res, await consentBoundaryService.createConsentBoundaryCheck(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/consent-boundary-checks', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, decision } = req.query;
  if (planId) { sendResponse(res, await consentBoundaryService.listConsentBoundaryChecksForPlan(schoolId, planId as string)); return; }
  if (decision) { sendResponse(res, await consentBoundaryService.listConsentBoundaryChecksByDecision(schoolId, decision as string)); return; }
  sendResponse(res, await consentBoundaryService.listConsentBoundaryChecksForPlan(schoolId, ''));
});

router.get('/consent-boundary-checks/:id', async (req: Request, res: Response) => {
  sendResponse(res, await consentBoundaryService.getConsentBoundaryCheck(extractSchoolId(req), req.params.id));
});

router.post('/consent-boundary-checks/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await consentBoundaryService.markConsentBoundaryReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/consent-boundary-checks/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await consentBoundaryService.blockConsentBoundaryCheck(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/consent-boundary-checks/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await consentBoundaryService.voidConsentBoundaryCheck(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Vetoes ──────────────────────────────────────────────────────────
router.post('/vetoes', async (req: Request, res: Response) => {
  sendResponse(res, await vetoService.createExecutionVeto(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/vetoes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, reason, actorRef } = req.query;
  if (planId) { sendResponse(res, await vetoService.listExecutionVetoesForPlan(schoolId, planId as string)); return; }
  if (reason) { sendResponse(res, await vetoService.listExecutionVetoesByReason(schoolId, reason as string)); return; }
  if (actorRef) { sendResponse(res, await vetoService.listExecutionVetoesByActor(schoolId, actorRef as string)); return; }
  sendResponse(res, await vetoService.listExecutionVetoesForPlan(schoolId, ''));
});

router.get('/vetoes/:id', async (req: Request, res: Response) => {
  sendResponse(res, await vetoService.getExecutionVeto(extractSchoolId(req), req.params.id));
});

router.post('/vetoes/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await vetoService.markVetoReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/vetoes/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await vetoService.suppressVeto(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/vetoes/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await vetoService.voidVeto(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Preflight Checklists ─────────────────────────────────────────────
router.post('/preflight-checklists', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.createPreflightChecklist(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/preflight-checklists', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await preflightChecklistService.listPreflightChecklistsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await preflightChecklistService.listPreflightChecklistsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await preflightChecklistService.listPreflightChecklistsForPlan(schoolId, ''));
});

router.get('/preflight-checklists/:id', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.getPreflightChecklist(extractSchoolId(req), req.params.id));
});

router.post('/preflight-checklists/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.markPreflightChecklistReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/preflight-checklists/:id/authorization-preview-ready', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.markPreflightChecklistPreviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/preflight-checklists/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await preflightChecklistService.blockPreflightChecklist(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/preflight-checklists/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.voidPreflightChecklist(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/preflight-checklists/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await preflightChecklistService.refreshPreflightChecklist(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Authorization Dry Runs ───────────────────────────────────────────
router.post('/authorization-dry-runs', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.createAuthorizationDryRun(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authorization-dry-runs', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, decision } = req.query;
  if (planId) { sendResponse(res, await dryRunService.listAuthorizationDryRunsForPlan(schoolId, planId as string)); return; }
  if (decision) { sendResponse(res, await dryRunService.listAuthorizationDryRunsByDecision(schoolId, decision as string)); return; }
  sendResponse(res, await dryRunService.listAuthorizationDryRunsForPlan(schoolId, ''));
});

router.get('/authorization-dry-runs/:id', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.getAuthorizationDryRun(extractSchoolId(req), req.params.id));
});

router.post('/authorization-dry-runs/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.markAuthorizationDryRunReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-dry-runs/:id/mock-authorized', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.markAuthorizationDryRunMockAuthorized(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-dry-runs/:id/mock-denied', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.markAuthorizationDryRunMockDenied(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-dry-runs/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await dryRunService.voidAuthorizationDryRun(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Pre-Live Decision Packets ────────────────────────────────────────
router.post('/pre-live-decision-packets', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.createPreLiveDecisionPacket(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/pre-live-decision-packets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await preLiveDecisionPacketService.listPreLiveDecisionPacketsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await preLiveDecisionPacketService.listPreLiveDecisionPacketsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await preLiveDecisionPacketService.listPreLiveDecisionPacketsForPlan(schoolId, ''));
});

router.get('/pre-live-decision-packets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.getPreLiveDecisionPacket(extractSchoolId(req), req.params.id));
});

router.post('/pre-live-decision-packets/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.markPreLiveDecisionPacketReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/pre-live-decision-packets/:id/authorization-preview-ready', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.markPreLiveDecisionPacketPreviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/pre-live-decision-packets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.suppressPreLiveDecisionPacket(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/pre-live-decision-packets/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await preLiveDecisionPacketService.blockPreLiveDecisionPacket(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/pre-live-decision-packets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await preLiveDecisionPacketService.voidPreLiveDecisionPacket(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Mock Authorization Receipts ──────────────────────────────────────
router.post('/mock-authorization-receipts', async (req: Request, res: Response) => {
  sendResponse(res, await mockReceiptService.createMockAuthorizationReceipt(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/mock-authorization-receipts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, decision } = req.query;
  if (planId) { sendResponse(res, await mockReceiptService.listMockAuthorizationReceiptsForPlan(schoolId, planId as string)); return; }
  if (decision) { sendResponse(res, await mockReceiptService.listMockAuthorizationReceiptsByDecision(schoolId, decision as string)); return; }
  sendResponse(res, await mockReceiptService.listMockAuthorizationReceiptsForPlan(schoolId, ''));
});

router.get('/mock-authorization-receipts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await mockReceiptService.getMockAuthorizationReceipt(extractSchoolId(req), req.params.id));
});

router.post('/mock-authorization-receipts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await mockReceiptService.voidMockAuthorizationReceipt(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── Authorization Summaries ──────────────────────────────────────────
router.post('/authorization-summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.createAuthorizationSummary(buildContext(req), extractSchoolId(req), req.body));
});

router.get('/authorization-summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId } = req.query;
  if (studentRef) { sendResponse(res, await summaryService.listAuthorizationSummariesForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await summaryService.listAuthorizationSummariesForPlan(schoolId, planId as string)); return; }
  sendResponse(res, await summaryService.listAuthorizationSummariesForSchool(schoolId));
});

router.get('/authorization-summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.getAuthorizationSummary(extractSchoolId(req), req.params.id));
});

router.post('/authorization-summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.refreshAuthorizationSummary(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markAuthorizationSummaryStale(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-summaries/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markAuthorizationSummaryReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/authorization-summaries/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, await summaryService.blockAuthorizationSummary(buildContext(req), extractSchoolId(req), req.params.id, reasonCodes));
});

router.post('/authorization-summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.voidAuthorizationSummary(buildContext(req), extractSchoolId(req), req.params.id));
});

export default router;
