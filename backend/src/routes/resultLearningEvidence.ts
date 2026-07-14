import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ResultEvidenceBridgeService } from '../domains/assessment/result-learning-evidence/services/resultEvidenceBridgeService';
import { ObjectiveMasteryImpactService } from '../domains/assessment/result-learning-evidence/services/objectiveMasteryImpactService';
import { MasteryMutationPlanService } from '../domains/assessment/result-learning-evidence/services/masteryMutationPlanService';
import { MasteryMutationApplicationService } from '../domains/assessment/result-learning-evidence/services/masteryMutationApplicationService';
import { RevisionSignalDispatchService } from '../domains/assessment/result-learning-evidence/services/revisionSignalDispatchService';
import { GrowthSignalDispatchService } from '../domains/assessment/result-learning-evidence/services/growthSignalDispatchService';
import { ResultLearningEvidenceProjectionSafetyService } from '../domains/assessment/result-learning-evidence/services/resultLearningEvidenceProjectionSafetyService';
import { ResultLearningEvidenceAuditBridge } from '../domains/assessment/result-learning-evidence/services/resultLearningEvidenceAuditBridge';
import { ResultLearningEvidenceIdempotencyService } from '../domains/assessment/result-learning-evidence/services/resultLearningEvidenceIdempotencyService';
import { ResultLearningEvidencePolicyRegistry } from '../domains/assessment/result-learning-evidence/policies/resultLearningEvidencePolicyDefinitions';

import {
  InMemoryResultLearningEvidenceBridgeRepository,
  InMemoryResultMasteryMutationPlanRepository,
  InMemoryResultMasteryMutationEventRepository,
  InMemoryResultObjectiveMasteryImpactRepository,
  InMemoryResultRevisionSignalRepository,
  InMemoryResultGrowthSignalRepository,
  InMemoryResultLearningEvidenceAuditRepository,
  InMemoryResultLearningEvidenceIdempotencyRepository,
} from '../domains/assessment/result-learning-evidence/repositories/inMemoryResultLearningEvidenceRepositories';

const router = Router();

const bridgeRepo = new InMemoryResultLearningEvidenceBridgeRepository();
const planRepo = new InMemoryResultMasteryMutationPlanRepository();
const eventRepo = new InMemoryResultMasteryMutationEventRepository();
const impactRepo = new InMemoryResultObjectiveMasteryImpactRepository();
const revisionSignalRepo = new InMemoryResultRevisionSignalRepository();
const growthSignalRepo = new InMemoryResultGrowthSignalRepository();
const auditRepo = new InMemoryResultLearningEvidenceAuditRepository();
const idempotencyRepo = new InMemoryResultLearningEvidenceIdempotencyRepository();

const policyRegistry = new ResultLearningEvidencePolicyRegistry();

const bridgeService = new ResultEvidenceBridgeService(bridgeRepo, policyRegistry);
const impactService = new ObjectiveMasteryImpactService(impactRepo, policyRegistry);
const planService = new MasteryMutationPlanService(planRepo, impactRepo, policyRegistry);
const mutationService = new MasteryMutationApplicationService(planRepo, eventRepo, policyRegistry);
const revisionSignalService = new RevisionSignalDispatchService(revisionSignalRepo, policyRegistry);
const growthSignalService = new GrowthSignalDispatchService(growthSignalRepo, policyRegistry);
const projectionSafetyService = new ResultLearningEvidenceProjectionSafetyService();
const auditBridge = new ResultLearningEvidenceAuditBridge(auditRepo);
const idempotencyService = new ResultLearningEvidenceIdempotencyService(idempotencyRepo);

interface SafeResponseEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
}

function createSafeResponseEnvelope(req: Request, overrides: Partial<SafeResponseEnvelope>): SafeResponseEnvelope {
  return {
    ok: overrides.ok ?? true,
    requestId: (req as any).requestId || 'unknown',
    correlationId: (req as any).correlationId || (req.headers['x-correlation-id'] as string) || undefined,
    ...overrides,
  };
}

function extractActorContext(req: Request): { schoolId: string; actorId: string; role: string } {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const actorId = (req as any).actorId || (req.headers['x-actor-id'] as string) || '';
  const role = (req as any).role || (req.headers['x-actor-role'] as string) || '';
  return { schoolId, actorId, role };
}

function getIdempotencyKey(req: Request): string | null {
  return (req.headers['idempotency-key'] as string) || (req.body?.idempotencyKey as string) || null;
}

function safeHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      const message = err.message || 'UNKNOWN_SAFE_ERROR';
      let reasonCode = 'UNKNOWN_SAFE_ERROR';
      let status = 500;
      if (message.startsWith('SCHOOL_CONTEXT_REQUIRED')) { reasonCode = 'SCHOOL_CONTEXT_REQUIRED'; status = 400; }
      else if (message.startsWith('FORBIDDEN')) { reasonCode = 'AUTH_REQUIRED'; status = 403; }
      else if (message.startsWith('POLICY_BLOCKED')) { reasonCode = 'POLICY_BLOCKED'; status = 403; }
      else if (message.startsWith('NOT_FOUND')) { reasonCode = 'NOT_FOUND'; status = 404; }
      else if (message.startsWith('VALIDATION_FAILED')) { reasonCode = 'VALIDATION_FAILED'; status = 400; }
      else if (message.startsWith('IDEMPOTENCY_CONFLICT')) { reasonCode = 'IDEMPOTENCY_CONFLICT'; status = 409; }
      else if (message.startsWith('PACKAGE_9_FINALIZATION_NOT_FOUND')) { reasonCode = 'PACKAGE_9_FINALIZATION_NOT_FOUND'; status = 404; }
      else if (message.startsWith('PACKAGE_9_FINALIZATION_NOT_APPROVED')) { reasonCode = 'PACKAGE_9_FINALIZATION_NOT_APPROVED'; status = 403; }
      else if (message.startsWith('PACKAGE_9_RELEASE_READINESS_NOT_FOUND')) { reasonCode = 'PACKAGE_9_RELEASE_READINESS_NOT_FOUND'; status = 404; }
      else if (message.startsWith('PACKAGE_5_RESULT_NOT_FOUND')) { reasonCode = 'PACKAGE_5_RESULT_NOT_FOUND'; status = 404; }
      else if (message.startsWith('RESULT_VERSION_NOT_READY')) { reasonCode = 'RESULT_VERSION_NOT_READY'; status = 400; }
      else if (message.startsWith('REGRADE_REQUEST_UNRESOLVED')) { reasonCode = 'REGRADE_REQUEST_UNRESOLVED'; status = 400; }
      else if (message.startsWith('OBJECTIVE_MAPPING_NOT_FOUND')) { reasonCode = 'OBJECTIVE_MAPPING_NOT_FOUND'; status = 404; }
      else if (message.startsWith('MASTERY_SNAPSHOT_NOT_FOUND')) { reasonCode = 'MASTERY_SNAPSHOT_NOT_FOUND'; status = 404; }
      else if (message.startsWith('EXISTING_MASTERY_MUTATION_PATH_NOT_FOUND')) { reasonCode = 'EXISTING_MASTERY_MUTATION_PATH_NOT_FOUND'; status = 501; }
      else if (message.startsWith('MASTER_PLAN_NOT_APPROVED')) { reasonCode = 'MASTER_PLAN_NOT_APPROVED'; status = 403; }
      else if (message.startsWith('MASTERY_MUTATION_BLOCKED')) { reasonCode = 'MASTERY_MUTATION_BLOCKED'; status = 403; }
      else if (message.startsWith('REVISION_SIGNAL_DISPATCH_DEFERRED')) { reasonCode = 'REVISION_SIGNAL_DISPATCH_DEFERRED'; status = 501; }
      else if (message.startsWith('GROWTH_SIGNAL_DISPATCH_DEFERRED')) { reasonCode = 'GROWTH_SIGNAL_DISPATCH_DEFERRED'; status = 501; }
      else if (message.startsWith('PARENT_RELEASE_DEFERRED')) { reasonCode = 'PARENT_RELEASE_DEFERRED'; status = 501; }
      else if (message.startsWith('PARENT_NOTIFICATION_DEFERRED')) { reasonCode = 'PARENT_NOTIFICATION_DEFERRED'; status = 501; }
      else if (message.startsWith('REPORT_CARD_DEFERRED')) { reasonCode = 'REPORT_CARD_DEFERRED'; status = 501; }
      else if (message.startsWith('AI_MARKING_DEFERRED')) { reasonCode = 'AI_MARKING_DEFERRED'; status = 501; }
      else if (message.startsWith('OCR_DEFERRED')) { reasonCode = 'OCR_DEFERRED'; status = 501; }
      else if (message.startsWith('FORBIDDEN_FIELD')) { reasonCode = 'FORBIDDEN_FIELD'; status = 403; }
      res.status(status).json(createSafeResponseEnvelope(req, { ok: false, reasonCode, safeMessage: message, status: 'error' }));
    }
  };
}

// ─── Evidence Bridges ────────────────────────────────────────────

router.post('/bridges', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const idempotencyCheck = await idempotencyService.startOperation({ schoolId, operation: 'create_evidence_bridge', idempotencyKey, requestBody: req.body });
  if (!idempotencyCheck.ok && idempotencyCheck.existing) {
    res.status(200).json(createSafeResponseEnvelope(req, { resourceId: idempotencyCheck.existing.resourceId, status: 'completed', safeMessage: 'Operation already completed', data: { existingResult: true } }));
    return;
  }

  const { resultFinalizationDecisionId, resultReleaseReadinessId, markingRunId, markingResultVersionId, studentRef, paperId, paperVersionId, deliverySessionId, bridgeMode, sourceRefs, safeEvidenceSummary } = req.body;
  const bridge = await bridgeService.createEvidenceBridgeFromFinalizedResult({
    schoolId, resultFinalizationDecisionId, resultReleaseReadinessId, markingRunId, markingResultVersionId, studentRef, paperId, paperVersionId, deliverySessionId, bridgeMode, sourceRefs, safeEvidenceSummary, actorId, actorRole: role,
  }, (req as any).correlationId || '');

  await auditBridge.recordEvidenceBridgeCreated({ schoolId, resultLearningEvidenceBridgeId: bridge.resultLearningEvidenceBridgeId, actorId, actorRole: role, correlationId: (req as any).correlationId, requestId: (req as any).requestId });
  await idempotencyService.completeOperation({ schoolId, operation: 'create_evidence_bridge', idempotencyKey, resourceType: 'ResultLearningEvidenceBridge', resourceId: bridge.resultLearningEvidenceBridgeId, safeResultSummary: bridge.safeEvidenceSummary });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: bridge.resultLearningEvidenceBridgeId, status: bridge.bridgeStatus, safeMessage: 'Evidence bridge created', data: bridge }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId', safeHandler(async (req: Request, res: Response) => {
  const bridge = await bridgeService.getEvidenceBridge(req.params.resultLearningEvidenceBridgeId);
  if (!bridge) throw new Error('NOT_FOUND: evidence bridge not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: bridge.resultLearningEvidenceBridgeId, status: bridge.bridgeStatus, data: bridge }));
}));

router.get('/bridges', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  const { studentRef, resultFinalizationDecisionId } = req.query;
  let bridges;
  if (studentRef) {
    bridges = await bridgeService.listEvidenceBridgesForStudent(schoolId, studentRef as string);
  } else if (resultFinalizationDecisionId) {
    bridges = await bridgeService.listEvidenceBridgesForFinalizationDecision(resultFinalizationDecisionId as string);
  } else {
    bridges = await bridgeService.listEvidenceBridgesForSchool(schoolId);
  }
  res.json(createSafeResponseEnvelope(req, { data: bridges }));
}));

router.post('/bridges/:resultLearningEvidenceBridgeId/run-source-checks', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const result = await bridgeService.runSourceIntegrityChecks(req.params.resultLearningEvidenceBridgeId, role);
  await auditBridge.recordSourceIntegrityChecked({
    schoolId: (req as any).schoolId || '',
    resultLearningEvidenceBridgeId: req.params.resultLearningEvidenceBridgeId,
    actorId: (req as any).actorId || '',
    actorRole: role,
    allPassed: result.allChecksPassed,
    blockingReasonCodes: result.blockingReasonCodes,
  });
  res.json(createSafeResponseEnvelope(req, { status: result.allChecksPassed ? 'passed' : 'blocked', safeMessage: result.safeSummary, data: result }));
}));

router.post('/bridges/:resultLearningEvidenceBridgeId/ready-for-mapping', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const bridge = await bridgeService.markBridgeReadyForMapping(req.params.resultLearningEvidenceBridgeId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: bridge?.resultLearningEvidenceBridgeId, status: bridge?.bridgeStatus, safeMessage: 'Bridge marked ready for mapping' }));
}));

router.post('/bridges/:resultLearningEvidenceBridgeId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const bridge = await bridgeService.blockEvidenceBridge(req.params.resultLearningEvidenceBridgeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: bridge?.resultLearningEvidenceBridgeId, status: bridge?.bridgeStatus, safeMessage: 'Bridge blocked' }));
}));

router.post('/bridges/:resultLearningEvidenceBridgeId/cancel', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const bridge = await bridgeService.cancelEvidenceBridge(req.params.resultLearningEvidenceBridgeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: bridge?.resultLearningEvidenceBridgeId, status: bridge?.bridgeStatus, safeMessage: 'Bridge cancelled' }));
}));

router.post('/bridges/:resultLearningEvidenceBridgeId/complete', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const bridge = await bridgeService.completeEvidenceBridge(req.params.resultLearningEvidenceBridgeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: bridge?.resultLearningEvidenceBridgeId, status: bridge?.bridgeStatus, safeMessage: 'Bridge completed' }));
}));

// ─── Objective Impacts ──────────────────────────────────────────

router.post('/bridges/:resultLearningEvidenceBridgeId/objective-impacts', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');

  const { resultMasteryMutationPlanId, studentRef, learningObjectiveId, questionVersionId, markingResultVersionId, impactType, evidenceStrength, masteryDelta, confidenceLevel, safeImpactSummary, sourceRefs } = req.body;
  if (!learningObjectiveId) throw new Error('VALIDATION_FAILED: learningObjectiveId is required');

  const impact = await impactService.mapObjectiveImpactsFromResult({
    schoolId, resultLearningEvidenceBridgeId: req.params.resultLearningEvidenceBridgeId, resultMasteryMutationPlanId, studentRef, learningObjectiveId, questionVersionId, markingResultVersionId, impactType, evidenceStrength, masteryDelta, confidenceLevel, safeImpactSummary, sourceRefs, actorId, actorRole: role,
  });

  await auditBridge.recordObjectiveImpactsMapped({ schoolId, resultLearningEvidenceBridgeId: req.params.resultLearningEvidenceBridgeId, resultMasteryMutationPlanId: impact.resultMasteryMutationPlanId, impactCount: 1, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: impact.resultObjectiveMasteryImpactId, status: impact.impactStatus, safeMessage: 'Objective impact mapped', data: impact }));
}));

router.get('/objective-impacts/:resultObjectiveMasteryImpactId', safeHandler(async (req: Request, res: Response) => {
  const impact = await impactService.getObjectiveImpact(req.params.resultObjectiveMasteryImpactId);
  if (!impact) throw new Error('NOT_FOUND: objective impact not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: impact.resultObjectiveMasteryImpactId, status: impact.impactStatus, data: impact }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId/objective-impacts', safeHandler(async (req: Request, res: Response) => {
  const impacts = await impactService.listObjectiveImpactsForBridge(req.params.resultLearningEvidenceBridgeId);
  res.json(createSafeResponseEnvelope(req, { data: impacts }));
}));

router.post('/objective-impacts/:resultObjectiveMasteryImpactId/approve', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const impact = await impactService.approveObjectiveImpact(req.params.resultObjectiveMasteryImpactId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: impact?.resultObjectiveMasteryImpactId, status: impact?.impactStatus, safeMessage: 'Objective impact approved' }));
}));

router.post('/objective-impacts/:resultObjectiveMasteryImpactId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const impact = await impactService.blockObjectiveImpact(req.params.resultObjectiveMasteryImpactId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: impact?.resultObjectiveMasteryImpactId, status: impact?.impactStatus, safeMessage: 'Objective impact blocked' }));
}));

router.post('/objective-impacts/:resultObjectiveMasteryImpactId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const impact = await impactService.voidObjectiveImpact(req.params.resultObjectiveMasteryImpactId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: impact?.resultObjectiveMasteryImpactId, status: impact?.impactStatus, safeMessage: 'Objective impact voided' }));
}));

// ─── Mastery Plans ──────────────────────────────────────────────

router.post('/bridges/:resultLearningEvidenceBridgeId/mastery-plans', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const { resultFinalizationDecisionId, markingResultVersionId, studentRef, planMode, objectiveImpactRefs, targetMasterySnapshotRefs, safePlanSummary } = req.body;
  const plan = await planService.createMasteryMutationPlan({
    schoolId, resultLearningEvidenceBridgeId: req.params.resultLearningEvidenceBridgeId, resultFinalizationDecisionId, markingResultVersionId, studentRef, planMode, objectiveImpactRefs, targetMasterySnapshotRefs, safePlanSummary, actorId, actorRole: role,
  });

  await auditBridge.recordMasteryPlanCreated({ schoolId, resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, resultLearningEvidenceBridgeId: req.params.resultLearningEvidenceBridgeId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: plan.resultMasteryMutationPlanId, status: plan.planStatus, safeMessage: 'Mastery plan created', data: plan }));
}));

router.get('/mastery-plans/:resultMasteryMutationPlanId', safeHandler(async (req: Request, res: Response) => {
  const plan = await planService.getMasteryMutationPlan(req.params.resultMasteryMutationPlanId);
  if (!plan) throw new Error('NOT_FOUND: mastery plan not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: plan.resultMasteryMutationPlanId, status: plan.planStatus, data: plan }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId/mastery-plans', safeHandler(async (req: Request, res: Response) => {
  const plans = await planService.listPlansForBridge(req.params.resultLearningEvidenceBridgeId);
  res.json(createSafeResponseEnvelope(req, { data: plans }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/build', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const plan = await planService.buildPlanFromObjectiveImpacts(req.params.resultMasteryMutationPlanId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: plan?.resultMasteryMutationPlanId, status: plan?.planStatus, safeMessage: 'Plan built from impacts' }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/ready-for-approval', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const plan = await planService.markPlanReadyForApproval(req.params.resultMasteryMutationPlanId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: plan?.resultMasteryMutationPlanId, status: plan?.planStatus, safeMessage: 'Plan ready for approval' }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/approve', safeHandler(async (req: Request, res: Response) => {
  const { actorId, role } = extractActorContext(req);
  const plan = await planService.approvePlan(req.params.resultMasteryMutationPlanId, actorId, role);
  await auditBridge.recordMasteryPlanApproved({ schoolId: (req as any).schoolId || '', resultMasteryMutationPlanId: plan?.resultMasteryMutationPlanId || '', resultLearningEvidenceBridgeId: (req as any).resultLearningEvidenceBridgeId || '', actorId, actorRole: role });
  res.json(createSafeResponseEnvelope(req, { resourceId: plan?.resultMasteryMutationPlanId, status: plan?.planStatus, safeMessage: 'Plan approved' }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const plan = await planService.blockPlan(req.params.resultMasteryMutationPlanId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: plan?.resultMasteryMutationPlanId, status: plan?.planStatus, safeMessage: 'Plan blocked' }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/cancel', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const plan = await planService.cancelPlan(req.params.resultMasteryMutationPlanId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: plan?.resultMasteryMutationPlanId, status: plan?.planStatus, safeMessage: 'Plan cancelled' }));
}));

router.post('/mastery-plans/:resultMasteryMutationPlanId/apply', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');

  const event = await mutationService.applyApprovedMasteryMutationPlan({
    schoolId, resultMasteryMutationPlanId: req.params.resultMasteryMutationPlanId, actorId, actorRole: role, safeMutationSummary: req.body.safeMutationSummary || 'Mastery mutation applied',
  });

  await auditBridge.recordMasteryMutationApplied({
    schoolId, resultMasteryMutationEventId: event.resultMasteryMutationEventId, resultMasteryMutationPlanId: event.resultMasteryMutationPlanId, resultLearningEvidenceBridgeId: event.resultLearningEvidenceBridgeId, actorId, actorRole: role,
  });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: event.resultMasteryMutationEventId, status: event.mutationStatus, safeMessage: event.safeMutationSummary, data: event }));
}));

// ─── Mastery Events ─────────────────────────────────────────────

router.get('/mastery-events/:resultMasteryMutationEventId', safeHandler(async (req: Request, res: Response) => {
  const event = await mutationService.getMasteryMutationEvent(req.params.resultMasteryMutationEventId);
  if (!event) throw new Error('NOT_FOUND: mastery event not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: event.resultMasteryMutationEventId, status: event.mutationStatus, data: event }));
}));

router.get('/mastery-plans/:resultMasteryMutationPlanId/mastery-events', safeHandler(async (req: Request, res: Response) => {
  const events = await mutationService.listMutationEventsForPlan(req.params.resultMasteryMutationPlanId);
  res.json(createSafeResponseEnvelope(req, { data: events }));
}));

router.post('/mastery-events/:resultMasteryMutationEventId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const event = await mutationService.voidMutationEvent(req.params.resultMasteryMutationEventId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: event?.resultMasteryMutationEventId, status: event?.mutationStatus, safeMessage: 'Mutation event voided' }));
}));

// ─── Revision Signals ───────────────────────────────────────────

router.post('/mastery-plans/:resultMasteryMutationPlanId/revision-signals', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');

  const { studentRef, learningObjectiveId, signalType, priority, safeSignalSummary, recommendedActionRefs, sourceRefs, resultLearningEvidenceBridgeId } = req.body;
  const signal = await revisionSignalService.createRevisionSignalsFromPlan({
    schoolId, resultLearningEvidenceBridgeId: resultLearningEvidenceBridgeId || (req.params.resultMasteryMutationPlanId), resultMasteryMutationPlanId: req.params.resultMasteryMutationPlanId, studentRef, learningObjectiveId, signalType, priority, safeSignalSummary, recommendedActionRefs, sourceRefs, actorId, actorRole: role,
  });

  await auditBridge.recordRevisionSignalCreated({ schoolId, resultRevisionSignalId: signal.resultRevisionSignalId, resultMasteryMutationPlanId: req.params.resultMasteryMutationPlanId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: signal.resultRevisionSignalId, status: signal.signalStatus, safeMessage: 'Revision signal created', data: signal }));
}));

router.get('/revision-signals/:resultRevisionSignalId', safeHandler(async (req: Request, res: Response) => {
  const signal = await revisionSignalService.getRevisionSignal(req.params.resultRevisionSignalId);
  if (!signal) throw new Error('NOT_FOUND: revision signal not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: signal.resultRevisionSignalId, status: signal.signalStatus, data: signal }));
}));

router.get('/mastery-plans/:resultMasteryMutationPlanId/revision-signals', safeHandler(async (req: Request, res: Response) => {
  const signals = await revisionSignalService.listRevisionSignalsForPlan(req.params.resultMasteryMutationPlanId);
  res.json(createSafeResponseEnvelope(req, { data: signals }));
}));

router.post('/revision-signals/:resultRevisionSignalId/ready', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await revisionSignalService.markRevisionSignalReady(req.params.resultRevisionSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultRevisionSignalId, status: signal?.signalStatus, safeMessage: 'Revision signal ready' }));
}));

router.post('/revision-signals/:resultRevisionSignalId/dispatch', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await revisionSignalService.dispatchRevisionSignal(req.params.resultRevisionSignalId, role);
  await auditBridge.recordRevisionSignalDispatched({ schoolId: (req as any).schoolId || '', resultRevisionSignalId: signal?.resultRevisionSignalId || '', resultMasteryMutationPlanId: signal?.resultMasteryMutationPlanId || '', actorId: (req as any).actorId || '', actorRole: role });
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultRevisionSignalId, status: signal?.signalStatus, safeMessage: signal?.signalStatus === 'dispatched' ? 'Revision signal dispatched' : 'Revision signal dispatch deferred/blocked' }));
}));

router.post('/revision-signals/:resultRevisionSignalId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await revisionSignalService.blockRevisionSignal(req.params.resultRevisionSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultRevisionSignalId, status: signal?.signalStatus, safeMessage: 'Revision signal blocked' }));
}));

router.post('/revision-signals/:resultRevisionSignalId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await revisionSignalService.voidRevisionSignal(req.params.resultRevisionSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultRevisionSignalId, status: signal?.signalStatus, safeMessage: 'Revision signal voided' }));
}));

// ─── Growth Signals ─────────────────────────────────────────────

router.post('/mastery-plans/:resultMasteryMutationPlanId/growth-signals', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');

  const { studentRef, learningObjectiveId, signalType, safeGrowthSummary, growthMetricRefs, sourceRefs, resultLearningEvidenceBridgeId } = req.body;
  const signal = await growthSignalService.createGrowthSignalsFromPlan({
    schoolId, resultLearningEvidenceBridgeId: resultLearningEvidenceBridgeId || (req.params.resultMasteryMutationPlanId), resultMasteryMutationPlanId: req.params.resultMasteryMutationPlanId, studentRef, learningObjectiveId, signalType, safeGrowthSummary, growthMetricRefs, sourceRefs, actorId, actorRole: role,
  });

  await auditBridge.recordGrowthSignalCreated({ schoolId, resultGrowthSignalId: signal.resultGrowthSignalId, resultMasteryMutationPlanId: req.params.resultMasteryMutationPlanId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: signal.resultGrowthSignalId, status: signal.signalStatus, safeMessage: 'Growth signal created', data: signal }));
}));

router.get('/growth-signals/:resultGrowthSignalId', safeHandler(async (req: Request, res: Response) => {
  const signal = await growthSignalService.getGrowthSignal(req.params.resultGrowthSignalId);
  if (!signal) throw new Error('NOT_FOUND: growth signal not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: signal.resultGrowthSignalId, status: signal.signalStatus, data: signal }));
}));

router.get('/mastery-plans/:resultMasteryMutationPlanId/growth-signals', safeHandler(async (req: Request, res: Response) => {
  const signals = await growthSignalService.listGrowthSignalsForPlan(req.params.resultMasteryMutationPlanId);
  res.json(createSafeResponseEnvelope(req, { data: signals }));
}));

router.post('/growth-signals/:resultGrowthSignalId/ready', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await growthSignalService.markGrowthSignalReady(req.params.resultGrowthSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultGrowthSignalId, status: signal?.signalStatus, safeMessage: 'Growth signal ready' }));
}));

router.post('/growth-signals/:resultGrowthSignalId/dispatch', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await growthSignalService.dispatchGrowthSignal(req.params.resultGrowthSignalId, role);
  await auditBridge.recordGrowthSignalDispatched({ schoolId: (req as any).schoolId || '', resultGrowthSignalId: signal?.resultGrowthSignalId || '', resultMasteryMutationPlanId: signal?.resultMasteryMutationPlanId || '', actorId: (req as any).actorId || '', actorRole: role });
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultGrowthSignalId, status: signal?.signalStatus, safeMessage: signal?.signalStatus === 'dispatched' ? 'Growth signal dispatched' : 'Growth signal dispatch deferred/blocked' }));
}));

router.post('/growth-signals/:resultGrowthSignalId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await growthSignalService.blockGrowthSignal(req.params.resultGrowthSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultGrowthSignalId, status: signal?.signalStatus, safeMessage: 'Growth signal blocked' }));
}));

router.post('/growth-signals/:resultGrowthSignalId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const signal = await growthSignalService.voidGrowthSignal(req.params.resultGrowthSignalId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: signal?.resultGrowthSignalId, status: signal?.signalStatus, safeMessage: 'Growth signal voided' }));
}));

// ─── Projection Routes ─────────────────────────────────────────

router.get('/bridges/:resultLearningEvidenceBridgeId/projection/teacher', safeHandler(async (req: Request, res: Response) => {
  const bridge = await bridgeService.getEvidenceBridge(req.params.resultLearningEvidenceBridgeId);
  if (!bridge) throw new Error('NOT_FOUND: evidence bridge not found');
  const impacts = await impactService.listObjectiveImpactsForBridge(req.params.resultLearningEvidenceBridgeId);
  const plans = await planService.listPlansForBridge(req.params.resultLearningEvidenceBridgeId);
  const revisionSignals = await revisionSignalService.listRevisionSignalsForBridge(req.params.resultLearningEvidenceBridgeId);
  const growthSignals = await growthSignalService.listGrowthSignalsForBridge(req.params.resultLearningEvidenceBridgeId);
  const projection = projectionSafetyService.toTeacherProjection(bridge, impacts.length, plans[0]?.planStatus, revisionSignals.length, growthSignals.length);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId/projection/admin', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  const bridges = await bridgeService.listEvidenceBridgesForSchool(schoolId);
  const plans = await planService.listPlansForStudent(schoolId, '');
  const allImpacts = await impactService.listObjectiveImpactsForStudent(schoolId, '');
  const allRevisionSignals = await revisionSignalService.listRevisionSignalsForStudent(schoolId, '');
  const allGrowthSignals = await growthSignalService.listGrowthSignalsForStudent(schoolId, '');
  const bridgesByStatus: Record<string, number> = {};
  const plansByStatus: Record<string, number> = {};
  for (const b of bridges) { bridgesByStatus[b.bridgeStatus] = (bridgesByStatus[b.bridgeStatus] || 0) + 1; }
  for (const p of plans) { plansByStatus[p.planStatus] = (plansByStatus[p.planStatus] || 0) + 1; }
  const projection = projectionSafetyService.toAdminProjection(bridges.length, plans.length, allImpacts.length, allRevisionSignals.length, allGrowthSignals.length, bridgesByStatus, plansByStatus, schoolId);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId/projection/student-safe', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId } = extractActorContext(req);
  const bridge = await bridgeService.getEvidenceBridge(req.params.resultLearningEvidenceBridgeId);
  if (!bridge) throw new Error('NOT_FOUND: evidence bridge not found');
  const plans = await planService.listPlansForBridge(req.params.resultLearningEvidenceBridgeId);
  const projection = projectionSafetyService.toStudentSafeProjection(actorId, bridge, plans[0]?.planStatus);
  projectionSafetyService.assertNoAnswerKeyLeakage(projection as any);
  projectionSafetyService.assertNoRubricLeakage(projection as any);
  projectionSafetyService.assertNoRawStudentAnswerLeakage(projection as any);
  projectionSafetyService.assertNoTeacherOnlyLeakage(projection as any);
  projectionSafetyService.assertNoHiddenReasoningLeakage(projection as any);
  projectionSafetyService.assertNoUnreleasedGradeLeakage(projection as any);
  projectionSafetyService.assertNoParentDeliveryPayloadLeakage(projection as any);
  projectionSafetyService.assertNoReportCardPayloadLeakage(projection as any);
  projectionSafetyService.assertNoRawMasteryDeltaLeakage(projection as any);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/bridges/:resultLearningEvidenceBridgeId/projection/parent-boundary', safeHandler(async (req: Request, res: Response) => {
  const bridge = await bridgeService.getEvidenceBridge(req.params.resultLearningEvidenceBridgeId);
  if (!bridge) throw new Error('NOT_FOUND: evidence bridge not found');
  const projection = projectionSafetyService.toParentBoundaryProjection((req as any).actorId || '', bridge);
  if (!projection.notYetReleasedReason) {
    projection.notYetReleasedReason = 'Parent release is boundary-only. No scores, answer keys, or raw rubrics are released to parents.';
  }
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

export default router;
