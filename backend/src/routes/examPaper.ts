import { Router, Request, Response } from 'express';
import { ExamPaperAssemblyService } from '../domains/assessment/exam-paper/services/examPaperAssemblyService';
import { ExamPaperVersionService } from '../domains/assessment/exam-paper/services/examPaperVersionService';
import { ExamPaperSectionLayoutService } from '../domains/assessment/exam-paper/services/examPaperSectionLayoutService';
import { ExamVariantPlanningService } from '../domains/assessment/exam-paper/services/examVariantPlanningService';
import { ExamAccessPolicyService } from '../domains/assessment/exam-paper/services/examAccessPolicyService';
import { ExamPaperApprovalService } from '../domains/assessment/exam-paper/services/examPaperApprovalService';
import { ExamPaperDeliveryBridgeService } from '../domains/assessment/exam-paper/services/examPaperDeliveryBridgeService';
import { ExamPaperProjectionSafetyService } from '../domains/assessment/exam-paper/services/examPaperProjectionSafetyService';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../domains/assessment/exam-paper/contracts/examPaperContracts';
import type { QuestionBankPackage6Repositories } from '../domains/assessment/runtime/questionBankRuntimeComposition';

export function createExamPaperRouter(deps: QuestionBankPackage6Repositories): Router {
  const router = Router();

  const assemblyService = new ExamPaperAssemblyService(deps.assemblyPersistence);
  const versionService = new ExamPaperVersionService();
  const sectionLayoutService = new ExamPaperSectionLayoutService();
  const variantPlanningService = new ExamVariantPlanningService();
  const accessPolicyService = new ExamAccessPolicyService();
  const approvalService = new ExamPaperApprovalService();
  const deliveryBridgeService = new ExamPaperDeliveryBridgeService();
  const projectionSafetyService = new ExamPaperProjectionSafetyService();

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
    correlationId: (req as any).correlationId,
    ...overrides,
  };
}

function extractActorContext(req: Request): { schoolId: string; actorId: string; role: string } {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const actorId = (req as any).actorId || (req.headers['x-actor-id'] as string) || '';
  const role = (req as any).role || (req.headers['x-actor-role'] as string) || '';
  return { schoolId, actorId, role };
}

function buildCommandContext(req: Request): ExamPaperCommandContext {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) || '';
  const correlationId = (req as any).correlationId || '';
  return { schoolId, actorId, actorRole: role, correlationId, idempotencyKey };
}

function requireIdempotencyKey(req: Request, res: Response): boolean {
  const key = req.headers['x-idempotency-key'] as string;
  if (!key) {
    res.status(400).json(createSafeResponseEnvelope(req, {
      ok: false,
      safeMessage: 'Idempotency key (x-idempotency-key) is required',
      reasonCode: 'IDEMPOTENCY_REQUIRED',
    }));
    return false;
  }
  return true;
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
      else if (message.startsWith('ASSEMBLY_PERSISTENCE_FAILED')) { reasonCode = 'ASSEMBLY_FAILED'; status = 500; }
      else if (message.startsWith('IDEMPOTENCY_REQUIRED')) { reasonCode = 'IDEMPOTENCY_REQUIRED'; status = 400; }
      res.status(status).json(createSafeResponseEnvelope(req, { ok: false, reasonCode, safeMessage: message }));
    }
  };
}

// POST /api/question-bank/exam-papers — Create new exam paper shell
router.post('/', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  if (!ctx.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: School context required');
  const { title, subjectId, curriculumVersionId, gradeBand, examType, safeSummary } = req.body || {};
  if (!title || !subjectId) throw new Error('VALIDATION_FAILED: title and subjectId are required');
  const paper = await deps.paperRepository.create({
    schoolId: ctx.schoolId,
    status: 'draft',
    title,
    subjectId,
    curriculumVersionId: curriculumVersionId || '',
    gradeBand: gradeBand || '',
    examType: examType || '',
    sourceDraftSetId: '',
    sourceDraftId: '',
    blueprintId: '',
    blueprintVersionId: '',
    createdByActorId: ctx.actorId,
    createdByRole: ctx.actorRole,
    currentVersionId: null,
    safeSummary: safeSummary || '',
    archivedAt: null,
  });
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: paper.paperId,
    status: paper.status,
    safeMessage: 'Exam paper shell created',
    data: { paperId: paper.paperId, title, subjectId, status: paper.status },
    nextAllowedActions: ['assemble', 'add_versions'],
  }));
}));

// POST /api/question-bank/exam-papers/from-draft/:draftId — Assemble from draft
router.post('/from-draft/:draftId', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  if (!ctx.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: School context required');
  const draftId = req.params.draftId;
  if (!draftId) throw new Error('VALIDATION_FAILED: draftId is required');
  const { sourceDraftSetId, blueprintId, blueprintVersionId, title, subjectId, curriculumVersionId, gradeBand, examType, instructionsSafeText, durationMinutes, securityClass, draftQuestions } = req.body || {};
  if (!title || !subjectId) throw new Error('VALIDATION_FAILED: title and subjectId are required');
  if (!Array.isArray(draftQuestions)) throw new Error('VALIDATION_FAILED: draftQuestions array is required');
  const result = await assemblyService.assemblePaperFromDraft({
    sourceDraftSetId: sourceDraftSetId || draftId,
    sourceDraftId: draftId,
    blueprintId: blueprintId || '',
    blueprintVersionId: blueprintVersionId || '',
    title,
    subjectId,
    curriculumVersionId: curriculumVersionId || '',
    gradeBand: gradeBand || '',
    examType: examType || '',
    instructionsSafeText: instructionsSafeText || '',
    durationMinutes: durationMinutes || 0,
    securityClass: securityClass || 'standard',
    draftQuestions,
  }, ctx);
  if (result.status === 'blocked') {
    res.status(400).json(createSafeResponseEnvelope(req, { ok: false, reasonCode: 'POLICY_BLOCKED', safeMessage: result.warnings.join('; '), data: result }));
    return;
  }
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: result.paperId,
    resourceVersion: result.paperVersionId,
    status: result.status,
    safeMessage: `Paper assembled from draft ${draftId}`,
    data: result,
    nextAllowedActions: ['create_variants', 'configure_access', 'approve'],
  }));
}));

// GET /api/question-bank/exam-papers/:paperId — Get paper
router.get('/:paperId', safeHandler(async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const paper = await deps.paperRepository.getById(paperId);
  if (!paper) throw new Error('NOT_FOUND: Exam paper not found');
  const { schoolId } = extractActorContext(req);
  if (schoolId && paper.schoolId !== schoolId) throw new Error('FORBIDDEN: School scope violation');
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperId,
    data: paper,
  }));
}));

// GET /api/question-bank/exam-papers/:paperId/versions — List versions
router.get('/:paperId/versions', safeHandler(async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const paper = await deps.paperRepository.getById(paperId);
  if (!paper) throw new Error('NOT_FOUND: Exam paper not found');
  const { schoolId } = extractActorContext(req);
  if (schoolId && paper.schoolId !== schoolId) throw new Error('FORBIDDEN: School scope violation');
  const versions = await deps.versionRepository.listByPaperId(paperId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperId,
    data: { versions, paperId },
  }));
}));

// POST /api/question-bank/exam-papers/:paperId/versions — Create version
router.post('/:paperId/versions', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperId } = req.params;
  const paper = await deps.paperRepository.getById(paperId);
  if (!paper) throw new Error('NOT_FOUND: Exam paper not found');
  if (ctx.schoolId && paper.schoolId !== ctx.schoolId) throw new Error('FORBIDDEN: School scope violation');
  const versionDecision = versionService.validateContext(ctx);
  if (!versionDecision.allowed) throw new Error(versionDecision.reasonCode + ': ' + versionDecision.safeMessage);
  const existingVersions = await deps.versionRepository.listByPaperId(paperId);
  const newVersionNumber = existingVersions.length > 0 ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1 : 1;
  const version = await versionService.createPaperVersion({
    paperId,
    schoolId: ctx.schoolId,
    versionNumber: newVersionNumber,
    status: 'draft',
    title: req.body?.title || paper.title,
    instructionsSafeText: req.body?.instructionsSafeText || '',
    durationMinutes: req.body?.durationMinutes || 0,
    totalMarks: req.body?.totalMarks || 0,
    questionCount: 0,
    sectionCount: 0,
    variantCount: 0,
    assemblyPolicyJson: null,
    securityClass: req.body?.securityClass || 'standard',
    createdByActorId: ctx.actorId,
  });
  const persisted = await deps.versionRepository.create(version);
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: persisted.paperVersionId,
    resourceVersion: String(persisted.versionNumber),
    status: persisted.status,
    safeMessage: 'Paper version created',
    data: { paperVersionId: persisted.paperVersionId, paperId, versionNumber: persisted.versionNumber },
    nextAllowedActions: ['add_sections', 'add_questions', 'create_variants'],
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId — Get version
router.get('/exam-paper-versions/:paperVersionId', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  const { schoolId } = extractActorContext(req);
  if (schoolId && version.schoolId !== schoolId) throw new Error('FORBIDDEN: School scope violation');
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: version,
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/sections — Get sections
router.get('/exam-paper-versions/:paperVersionId/sections', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const sections = await deps.sectionRepository.listByPaperVersionId(paperVersionId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { sections, paperVersionId },
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/questions — Get questions
router.get('/exam-paper-versions/:paperVersionId/questions', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const questions = await deps.questionRepository.listByPaperVersionId(paperVersionId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { questions, paperVersionId },
  }));
}));

// POST /api/question-bank/exam-paper-versions/:paperVersionId/variants — Create variant
router.post('/exam-paper-versions/:paperVersionId/variants', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  if (ctx.schoolId && version.schoolId !== ctx.schoolId) throw new Error('FORBIDDEN: School scope violation');
  const { variantStrategy, safeSummary } = req.body || {};
  const variant = await deps.variantRepository.create({
    schoolId: ctx.schoolId,
    paperVersionId,
    status: 'draft',
    variantStrategy: variantStrategy || 'same_questions_reordered',
    questionCount: 0,
    totalMarks: 0,
    shuffleSections: true,
    shuffleQuestionsWithinSections: true,
    safeSummary: safeSummary || '',
    approvedAt: null,
  });
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: variant.variantId,
    status: variant.status,
    safeMessage: 'Variant plan created',
    data: { variantId: variant.variantId, paperVersionId, variantStrategy: variant.variantStrategy },
    nextAllowedActions: ['approve_variant', 'generate_variant_questions'],
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/variants — List variants
router.get('/exam-paper-versions/:paperVersionId/variants', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const variants = await deps.variantRepository.listByPaperVersionId(paperVersionId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { variants, paperVersionId },
  }));
}));

// POST /api/question-bank/exam-paper-versions/:paperVersionId/access-policy — Create access policy
router.post('/exam-paper-versions/:paperVersionId/access-policy', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  if (ctx.schoolId && version.schoolId !== ctx.schoolId) throw new Error('FORBIDDEN: School scope violation');
  const policy = await deps.accessPolicyRepository.create({
    schoolId: ctx.schoolId,
    paperId: version.paperId,
    paperVersionId,
    status: 'draft',
    intendedAudienceType: req.body?.intendedAudienceType || 'class',
    classScopeRefsJson: null,
    roleScopeRefsJson: null,
    availabilityMode: req.body?.availabilityMode || 'manual_teacher_activation',
    requiresTeacherActivation: true,
    allowStudentSelfStart: false,
    allowRetake: false,
    maxAttempts: 1,
    safePolicySummary: req.body?.safePolicySummary || '',
    createdByActorId: ctx.actorId,
  });
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: policy.accessPolicyId,
    status: policy.status,
    safeMessage: 'Access policy created (metadata only, no live delivery)',
    data: { accessPolicyId: policy.accessPolicyId, paperVersionId, availabilityMode: policy.availabilityMode },
    nextAllowedActions: ['configure_access', 'mark_delivery_ready'],
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/access-policy — Get access policy
router.get('/exam-paper-versions/:paperVersionId/access-policy', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const policy = await deps.accessPolicyRepository.getByPaperVersionId(paperVersionId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { accessPolicy: policy || null, paperVersionId },
  }));
}));

// POST /api/question-bank/exam-paper-versions/:paperVersionId/approve — Approve paper
router.post('/exam-paper-versions/:paperVersionId/approve', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  if (ctx.schoolId && version.schoolId !== ctx.schoolId) throw new Error('FORBIDDEN: School scope violation');
  const decision = req.body?.decision || 'approve_for_delivery_bridge';
  const approval = await deps.approvalRepository.create({
    schoolId: ctx.schoolId,
    paperId: version.paperId,
    paperVersionId,
    decision,
    decisionReasonCode: req.body?.decisionReasonCode || '',
    safeReason: req.body?.safeReason || '',
    decidedByActorId: ctx.actorId,
    decidedByRole: ctx.actorRole,
  });
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: approval.paperApprovalId,
    status: 'approved',
    safeMessage: 'Paper version approved for delivery bridge (not live delivery)',
    data: { paperApprovalId: approval.paperApprovalId, paperVersionId, decision },
    nextAllowedActions: ['create_delivery_bridge', 'mark_delivery_ready'],
  }));
}));

// POST /api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge — Create delivery bridge
router.post('/exam-paper-versions/:paperVersionId/delivery-bridge', safeHandler(async (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  if (ctx.schoolId && version.schoolId !== ctx.schoolId) throw new Error('FORBIDDEN: School scope violation');
  const bridge = await deps.deliveryBridgeRepository.create({
    schoolId: ctx.schoolId,
    paperId: version.paperId,
    paperVersionId,
    status: 'draft',
    bridgeType: req.body?.bridgeType || 'exam_mode_contract',
    compatibleRuntime: req.body?.compatibleRuntime || 'exam_mode_future',
    contractVersion: '1.0',
    safeContractSummary: req.body?.safeContractSummary || '',
    blockedReasonCode: null,
    validatedAt: null,
  });
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: bridge.deliveryBridgeId,
    status: bridge.status,
    safeMessage: 'Delivery bridge contract created (no live sessions, no release)',
    data: { deliveryBridgeId: bridge.deliveryBridgeId, paperVersionId },
    nextAllowedActions: ['validate_bridge', 'mark_delivery_ready'],
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge — Get delivery bridge
router.get('/exam-paper-versions/:paperVersionId/delivery-bridge', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const bridge = await deps.deliveryBridgeRepository.getByPaperVersionId(paperVersionId);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { deliveryBridge: bridge || null, paperVersionId },
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/teacher — Teacher projection
router.get('/exam-paper-versions/:paperVersionId/projection/teacher', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  const projection = projectionSafetyService.toTeacherProjection(version);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { projection: { ...projection, role: 'teacher' } },
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/student-preview
router.get('/exam-paper-versions/:paperVersionId/projection/student-preview', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  const sections = await deps.sectionRepository.listByPaperVersionId(paperVersionId);
  const policy = await deps.accessPolicyRepository.getByPaperVersionId(paperVersionId);
  const projection = projectionSafetyService.toStudentPreviewProjection(version, sections, policy || null);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { projection },
  }));
}));

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/parent-preview
router.get('/exam-paper-versions/:paperVersionId/projection/parent-preview', safeHandler(async (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  const version = await deps.versionRepository.getById(paperVersionId);
  if (!version) throw new Error('NOT_FOUND: Paper version not found');
  const policy = await deps.accessPolicyRepository.getByPaperVersionId(paperVersionId);
  const projection = projectionSafetyService.toParentPreviewProjection(version, policy || null);
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { projection },
  }));
}));

  return router;
}
