import { Router, Request, Response } from 'express';
import {
  RecoveryLifecycleClosureReadinessService,
  RecoveryPostSimulationHandoffPacketService,
  RecoveryNextCycleRecommendationService,
  RecoveryDeferredIntegrationTicketService,
  RecoveryUnresolvedRiskRegisterService,
  RecoveryClosureReviewPacketService,
  RecoveryStakeholderClosureDraftService,
  RecoveryArchiveManifestService,
  RecoveryFinalLifecycleSummaryService,
  RecoveryLifecycleClosureSafetyService,
  RecoveryLifecycleClosureAuditBridge,
  RecoveryLifecycleClosureIdempotencyService,
} from '../domains/assessment/recovery-lifecycle-closure/services';
import type { IRecoveryLifecycleClosureRepositories } from '../domains/assessment/recovery-lifecycle-closure/contracts/recoveryLifecycleClosureRepositoryContracts';
import { RecoveryLifecycleClosurePolicyEnforcer, RECOVERY_LIFECYCLE_CLOSURE_POLICIES } from '../domains/assessment/recovery-lifecycle-closure/policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureCommandContext } from '../domains/assessment/recovery-lifecycle-closure/contracts/recoveryLifecycleClosureContracts';

export function createRecoveryLifecycleClosureRouter(repos: IRecoveryLifecycleClosureRepositories): Router {
  const router = Router();

  const policyEnforcer = new RecoveryLifecycleClosurePolicyEnforcer();
  const safety = new RecoveryLifecycleClosureSafetyService(policyEnforcer);
  const audit = new RecoveryLifecycleClosureAuditBridge(repos);
  const idempotency = new RecoveryLifecycleClosureIdempotencyService(repos);

  const readinessService = new RecoveryLifecycleClosureReadinessService(repos, policyEnforcer, safety, audit, idempotency);
  const handoffPacketService = new RecoveryPostSimulationHandoffPacketService(repos, policyEnforcer, safety, audit, idempotency);
  const nextCycleService = new RecoveryNextCycleRecommendationService(repos, policyEnforcer, safety, audit, idempotency);
  const deferredTicketService = new RecoveryDeferredIntegrationTicketService(repos, policyEnforcer, safety, audit, idempotency);
  const unresolvedRiskService = new RecoveryUnresolvedRiskRegisterService(repos, policyEnforcer, safety, audit, idempotency);
  const reviewPacketService = new RecoveryClosureReviewPacketService(repos, policyEnforcer, safety, audit, idempotency);
  const stakeholderDraftService = new RecoveryStakeholderClosureDraftService(repos, policyEnforcer, safety, audit, idempotency);
  const archiveManifestService = new RecoveryArchiveManifestService(repos, policyEnforcer, safety, audit, idempotency);
  const finalSummaryService = new RecoveryFinalLifecycleSummaryService(repos, policyEnforcer, safety, audit, idempotency);

function buildContext(req: Request): RecoveryLifecycleClosureCommandContext {
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

// ─── Closure Readiness ───────────────────────────────────────────────
router.post('/closure-readiness', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.createClosureReadiness(buildContext(req), req.body));
});

router.get('/closure-readiness', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await readinessService.listClosureReadinessForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await readinessService.listClosureReadinessForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await readinessService.listClosureReadinessByStatus(schoolId, status as string)); return; }
  sendResponse(res, await readinessService.listClosureReadinessForSchool(schoolId));
});

router.get('/closure-readiness/:id', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.getClosureReadiness(extractSchoolId(req), req.params.id));
});

router.post('/closure-readiness/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markClosureReadinessReviewReady(buildContext(req), req.params.id));
});

router.post('/closure-readiness/:id/handoff-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markClosureReadinessHandoffReady(buildContext(req), req.params.id));
});

router.post('/closure-readiness/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.approveClosureReadinessForFutureUse(buildContext(req), req.params.id));
});

router.post('/closure-readiness/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.suppressClosureReadiness(buildContext(req), req.params.id));
});

router.post('/closure-readiness/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.blockClosureReadiness(buildContext(req), req.params.id));
});

router.post('/closure-readiness/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.voidClosureReadiness(buildContext(req), req.params.id));
});

// ─── Handoff Packets ─────────────────────────────────────────────────
router.post('/handoff-packets', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.createHandoffPacket(buildContext(req), req.body));
});

router.get('/handoff-packets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, runId, status } = req.query;
  if (studentRef) { sendResponse(res, await handoffPacketService.listHandoffPacketsForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await handoffPacketService.listHandoffPacketsForPlan(schoolId, planId as string)); return; }
  if (runId) { sendResponse(res, await handoffPacketService.listHandoffPacketsForSimulationRun(schoolId, runId as string)); return; }
  if (status) { sendResponse(res, await handoffPacketService.listHandoffPacketsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await handoffPacketService.listHandoffPacketsForSchool(schoolId));
});

router.get('/handoff-packets/student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.listHandoffPacketsForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/handoff-packets/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.listHandoffPacketsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/handoff-packets/simulation-run/:runId', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.listHandoffPacketsForSimulationRun(extractSchoolId(req), req.params.runId));
});

router.get('/handoff-packets/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.listHandoffPacketsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/handoff-packets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.getHandoffPacket(extractSchoolId(req), req.params.id));
});

router.post('/handoff-packets/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.markHandoffPacketReviewReady(buildContext(req), req.params.id));
});

router.post('/handoff-packets/:id/handoff-ready', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.markHandoffPacketHandoffReady(buildContext(req), req.params.id));
});

router.post('/handoff-packets/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.approveHandoffPacketForFutureUse(buildContext(req), req.params.id));
});

router.post('/handoff-packets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.suppressHandoffPacket(buildContext(req), req.params.id));
});

router.post('/handoff-packets/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.blockHandoffPacket(buildContext(req), req.params.id));
});

router.post('/handoff-packets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await handoffPacketService.voidHandoffPacket(buildContext(req), req.params.id));
});

// ─── Next Cycle Recommendations ──────────────────────────────────────
router.post('/next-cycle-recommendations', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.createNextCycleRecommendationDraft(buildContext(req), req.body));
});

router.get('/next-cycle-recommendations', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, studentRef, type } = req.query;
  if (planId) { sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsForPlan(schoolId, planId as string)); return; }
  if (studentRef) { sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsForStudent(schoolId, studentRef as string)); return; }
  if (type) { sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsByType(schoolId, type as string)); return; }
  sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsForPlan(schoolId, ''));
});

router.get('/next-cycle-recommendations/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/next-cycle-recommendations/student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/next-cycle-recommendations/type/:type', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.listNextCycleRecommendationDraftsByType(extractSchoolId(req), req.params.type));
});

router.get('/next-cycle-recommendations/:id', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.getNextCycleRecommendationDraft(extractSchoolId(req), req.params.id));
});

router.post('/next-cycle-recommendations/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.markNextCycleRecommendationReviewReady(buildContext(req), req.params.id));
});

router.post('/next-cycle-recommendations/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.approveNextCycleRecommendationForFutureUse(buildContext(req), req.params.id));
});

router.post('/next-cycle-recommendations/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.suppressNextCycleRecommendation(buildContext(req), req.params.id));
});

router.post('/next-cycle-recommendations/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.blockNextCycleRecommendation(buildContext(req), req.params.id));
});

router.post('/next-cycle-recommendations/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await nextCycleService.voidNextCycleRecommendation(buildContext(req), req.params.id));
});

// ─── Deferred Integration Tickets ────────────────────────────────────
router.post('/deferred-integration-tickets', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.createDeferredIntegrationTicket(buildContext(req), req.body));
});

router.get('/deferred-integration-tickets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, type, status } = req.query;
  if (planId) { sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsForPlan(schoolId, planId as string)); return; }
  if (type) { sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsByType(schoolId, type as string)); return; }
  if (status) { sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsForSchool(schoolId));
});

router.get('/deferred-integration-tickets/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/deferred-integration-tickets/type/:type', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsByType(extractSchoolId(req), req.params.type));
});

router.get('/deferred-integration-tickets/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.listDeferredIntegrationTicketsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/deferred-integration-tickets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.getDeferredIntegrationTicket(extractSchoolId(req), req.params.id));
});

router.post('/deferred-integration-tickets/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.markDeferredIntegrationTicketReviewReady(buildContext(req), req.params.id));
});

router.post('/deferred-integration-tickets/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.approveDeferredIntegrationTicketForFutureUse(buildContext(req), req.params.id));
});

router.post('/deferred-integration-tickets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.suppressDeferredIntegrationTicket(buildContext(req), req.params.id));
});

router.post('/deferred-integration-tickets/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.blockDeferredIntegrationTicket(buildContext(req), req.params.id));
});

router.post('/deferred-integration-tickets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await deferredTicketService.voidDeferredIntegrationTicket(buildContext(req), req.params.id));
});

// ─── Unresolved Risk Registers ───────────────────────────────────────
router.post('/unresolved-risk-registers', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.createUnresolvedRiskRegister(buildContext(req), req.body));
});

router.get('/unresolved-risk-registers', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, riskLevel, status } = req.query;
  if (planId) { sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersForPlan(schoolId, planId as string)); return; }
  if (riskLevel) { sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersByRiskLevel(schoolId, riskLevel as string)); return; }
  if (status) { sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersByStatus(schoolId, status as string)); return; }
  sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersForSchool(schoolId));
});

router.get('/unresolved-risk-registers/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/unresolved-risk-registers/risk-level/:riskLevel', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersByRiskLevel(extractSchoolId(req), req.params.riskLevel));
});

router.get('/unresolved-risk-registers/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.listUnresolvedRiskRegistersByStatus(extractSchoolId(req), req.params.status));
});

router.get('/unresolved-risk-registers/:id', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.getUnresolvedRiskRegister(extractSchoolId(req), req.params.id));
});

router.post('/unresolved-risk-registers/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.markUnresolvedRiskReviewReady(buildContext(req), req.params.id));
});

router.post('/unresolved-risk-registers/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.suppressUnresolvedRisk(buildContext(req), req.params.id));
});

router.post('/unresolved-risk-registers/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.blockUnresolvedRisk(buildContext(req), req.params.id));
});

router.post('/unresolved-risk-registers/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await unresolvedRiskService.voidUnresolvedRisk(buildContext(req), req.params.id));
});

// ─── Teacher Closure Review Packets ──────────────────────────────────
router.post('/teacher-closure-review-packets', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.createTeacherClosureReviewPacket(buildContext(req), req.body));
});

router.get('/teacher-closure-review-packets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await reviewPacketService.listTeacherClosureReviewPacketsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await reviewPacketService.listTeacherClosureReviewPacketsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await reviewPacketService.listTeacherClosureReviewPacketsForPlan(schoolId, ''));
});

router.get('/teacher-closure-review-packets/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.listTeacherClosureReviewPacketsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/teacher-closure-review-packets/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.listTeacherClosureReviewPacketsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/teacher-closure-review-packets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.getTeacherClosureReviewPacket(extractSchoolId(req), req.params.id));
});

router.post('/teacher-closure-review-packets/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.markTeacherClosureReviewPacketReviewReady(buildContext(req), req.params.id));
});

router.post('/teacher-closure-review-packets/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.approveTeacherClosureReviewPacketForFutureUse(buildContext(req), req.params.id));
});

router.post('/teacher-closure-review-packets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.suppressTeacherClosureReviewPacket(buildContext(req), req.params.id));
});

router.post('/teacher-closure-review-packets/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.blockTeacherClosureReviewPacket(buildContext(req), req.params.id));
});

router.post('/teacher-closure-review-packets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.voidTeacherClosureReviewPacket(buildContext(req), req.params.id));
});

// ─── Admin Governance Review Packets ─────────────────────────────────
router.post('/admin-governance-review-packets', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.createAdminGovernanceReviewPacket(buildContext(req), req.body));
});

router.get('/admin-governance-review-packets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await reviewPacketService.listAdminGovernanceReviewPacketsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await reviewPacketService.listAdminGovernanceReviewPacketsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await reviewPacketService.listAdminGovernanceReviewPacketsForPlan(schoolId, ''));
});

router.get('/admin-governance-review-packets/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.listAdminGovernanceReviewPacketsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/admin-governance-review-packets/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.listAdminGovernanceReviewPacketsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/admin-governance-review-packets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.getAdminGovernanceReviewPacket(extractSchoolId(req), req.params.id));
});

router.post('/admin-governance-review-packets/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.markAdminGovernanceReviewPacketReviewReady(buildContext(req), req.params.id));
});

router.post('/admin-governance-review-packets/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.approveAdminGovernanceReviewPacketForFutureUse(buildContext(req), req.params.id));
});

router.post('/admin-governance-review-packets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.suppressAdminGovernanceReviewPacket(buildContext(req), req.params.id));
});

router.post('/admin-governance-review-packets/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.blockAdminGovernanceReviewPacket(buildContext(req), req.params.id));
});

router.post('/admin-governance-review-packets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await reviewPacketService.voidAdminGovernanceReviewPacket(buildContext(req), req.params.id));
});

// ─── Student Closure Reflection Drafts ───────────────────────────────
router.post('/student-closure-reflection-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.createStudentClosureReflectionDraft(buildContext(req), req.body));
});

router.get('/student-closure-reflection-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await stakeholderDraftService.listStudentClosureReflectionDraftsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await stakeholderDraftService.listStudentClosureReflectionDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await stakeholderDraftService.listStudentClosureReflectionDraftsForPlan(schoolId, ''));
});

router.get('/student-closure-reflection-drafts/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listStudentClosureReflectionDraftsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/student-closure-reflection-drafts/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listStudentClosureReflectionDraftsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/student-closure-reflection-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.getStudentClosureReflectionDraft(extractSchoolId(req), req.params.id));
});

router.post('/student-closure-reflection-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.markStudentClosureReflectionReviewReady(buildContext(req), req.params.id));
});

router.post('/student-closure-reflection-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.approveStudentClosureReflectionForFutureUse(buildContext(req), req.params.id));
});

router.post('/student-closure-reflection-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.suppressStudentClosureReflection(buildContext(req), req.params.id));
});

router.post('/student-closure-reflection-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.blockStudentClosureReflection(buildContext(req), req.params.id));
});

router.post('/student-closure-reflection-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.voidStudentClosureReflection(buildContext(req), req.params.id));
});

// ─── Parent Closure Guidance Drafts ──────────────────────────────────
router.post('/parent-closure-guidance-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.createParentClosureGuidanceDraft(buildContext(req), req.body));
});

router.get('/parent-closure-guidance-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await stakeholderDraftService.listParentClosureGuidanceDraftsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await stakeholderDraftService.listParentClosureGuidanceDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await stakeholderDraftService.listParentClosureGuidanceDraftsForPlan(schoolId, ''));
});

router.get('/parent-closure-guidance-drafts/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listParentClosureGuidanceDraftsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/parent-closure-guidance-drafts/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listParentClosureGuidanceDraftsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/parent-closure-guidance-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.getParentClosureGuidanceDraft(extractSchoolId(req), req.params.id));
});

router.post('/parent-closure-guidance-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.markParentClosureGuidanceReviewReady(buildContext(req), req.params.id));
});

router.post('/parent-closure-guidance-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.approveParentClosureGuidanceForFutureUse(buildContext(req), req.params.id));
});

router.post('/parent-closure-guidance-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.suppressParentClosureGuidance(buildContext(req), req.params.id));
});

router.post('/parent-closure-guidance-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.blockParentClosureGuidance(buildContext(req), req.params.id));
});

router.post('/parent-closure-guidance-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.voidParentClosureGuidance(buildContext(req), req.params.id));
});

// ─── Archive Manifests ───────────────────────────────────────────────
router.post('/archive-manifests', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.createArchiveManifest(buildContext(req), req.body));
});

router.get('/archive-manifests', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await archiveManifestService.listArchiveManifestsForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await archiveManifestService.listArchiveManifestsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await archiveManifestService.listArchiveManifestsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await archiveManifestService.listArchiveManifestsForSchool(schoolId));
});

router.get('/archive-manifests/student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.listArchiveManifestsForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/archive-manifests/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.listArchiveManifestsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/archive-manifests/status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.listArchiveManifestsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/archive-manifests/:id', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.getArchiveManifest(extractSchoolId(req), req.params.id));
});

router.post('/archive-manifests/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.markArchiveManifestReviewReady(buildContext(req), req.params.id));
});

router.post('/archive-manifests/:id/archive-ready', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.markArchiveManifestArchiveReady(buildContext(req), req.params.id));
});

router.post('/archive-manifests/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.approveArchiveManifestForFutureUse(buildContext(req), req.params.id));
});

router.post('/archive-manifests/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.suppressArchiveManifest(buildContext(req), req.params.id));
});

router.post('/archive-manifests/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.blockArchiveManifest(buildContext(req), req.params.id));
});

router.post('/archive-manifests/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await archiveManifestService.voidArchiveManifest(buildContext(req), req.params.id));
});

// ─── Final Lifecycle Summaries ───────────────────────────────────────
router.post('/final-lifecycle-summaries', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.createFinalLifecycleSummary(buildContext(req), req.body));
});

router.get('/final-lifecycle-summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId } = req.query;
  if (studentRef) { sendResponse(res, await finalSummaryService.listFinalLifecycleSummariesForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await finalSummaryService.listFinalLifecycleSummariesForPlan(schoolId, planId as string)); return; }
  sendResponse(res, await finalSummaryService.listFinalLifecycleSummariesForSchool(schoolId));
});

router.get('/final-lifecycle-summaries/student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.listFinalLifecycleSummariesForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/final-lifecycle-summaries/plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.listFinalLifecycleSummariesForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/final-lifecycle-summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.getFinalLifecycleSummary(extractSchoolId(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.refreshFinalLifecycleSummary(buildContext(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/mark-stale', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.markFinalLifecycleSummaryStale(buildContext(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.markFinalLifecycleSummaryReviewReady(buildContext(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.approveFinalLifecycleSummaryForFutureUse(buildContext(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.blockFinalLifecycleSummary(buildContext(req), req.params.id));
});

router.post('/final-lifecycle-summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await finalSummaryService.voidFinalLifecycleSummary(buildContext(req), req.params.id));
});

  return router;
}
