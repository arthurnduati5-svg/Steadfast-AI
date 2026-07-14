import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ExamPaperAssemblyService } from '../domains/assessment/exam-paper/services/examPaperAssemblyService';
import { ExamPaperVersionService } from '../domains/assessment/exam-paper/services/examPaperVersionService';
import { ExamPaperSectionLayoutService } from '../domains/assessment/exam-paper/services/examPaperSectionLayoutService';
import { ExamVariantPlanningService } from '../domains/assessment/exam-paper/services/examVariantPlanningService';
import { ExamAccessPolicyService } from '../domains/assessment/exam-paper/services/examAccessPolicyService';
import { ExamPaperApprovalService } from '../domains/assessment/exam-paper/services/examPaperApprovalService';
import { ExamPaperDeliveryBridgeService } from '../domains/assessment/exam-paper/services/examPaperDeliveryBridgeService';
import { ExamPaperProjectionSafetyService } from '../domains/assessment/exam-paper/services/examPaperProjectionSafetyService';
import { ExamPaperCommandContext } from '../domains/assessment/exam-paper/contracts/examPaperContracts';
import { ExamVariantStrategy } from '../domains/assessment/exam-paper/contracts/examPaperVariantContracts';
import { ExamAvailabilityMode } from '../domains/assessment/exam-paper/contracts/examPaperAccessContracts';
import { ExamPaperApprovalDecision } from '../domains/assessment/exam-paper/contracts/examPaperApprovalContracts';
import { ExamPaperBridgeType, ExamPaperCompatibleRuntime } from '../domains/assessment/exam-paper/contracts/examPaperDeliveryBridgeContracts';

const router = Router();

const assemblyService = new ExamPaperAssemblyService();
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
  const correlationId = (req as any).correlationId || randomUUID();
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

// POST /api/question-bank/exam-papers — Create new exam paper shell
router.post('/', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  if (!ctx.schoolId) {
    res.status(400).json(createSafeResponseEnvelope(req, { ok: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required' }));
    return;
  }
  const { title, subjectId, curriculumVersionId, gradeBand, examType, sourceDraftSetId, sourceDraftId, blueprintId, blueprintVersionId, safeSummary } = req.body || {};
  if (!title || !subjectId) {
    res.status(400).json(createSafeResponseEnvelope(req, { ok: false, reasonCode: 'VALIDATION_FAILED', safeMessage: 'title and subjectId are required' }));
    return;
  }
  const paperId = randomUUID();
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: paperId,
    status: 'draft',
    safeMessage: 'Exam paper shell created',
    data: { paperId, title, subjectId },
    nextAllowedActions: ['assemble', 'add_versions'],
  }));
});

// POST /api/question-bank/exam-papers/from-draft/:draftId — Assemble from draft
router.post('/from-draft/:draftId', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  if (!ctx.schoolId) {
    res.status(400).json(createSafeResponseEnvelope(req, { ok: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required' }));
    return;
  }
  const draftId = req.params.draftId;
  if (!draftId) {
    res.status(400).json(createSafeResponseEnvelope(req, { ok: false, reasonCode: 'VALIDATION_FAILED', safeMessage: 'draftId is required' }));
    return;
  }
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: draftId,
    status: 'assembled',
    safeMessage: `Paper assembled from draft ${draftId}`,
    nextAllowedActions: ['create_variants', 'configure_access', 'approve'],
  }));
});

// GET /api/question-bank/exam-papers/:paperId — Get paper
router.get('/:paperId', (req: Request, res: Response) => {
  const { paperId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperId,
    data: { paperId, status: 'draft' },
  }));
});

// GET /api/question-bank/exam-papers/:paperId/versions — List versions
router.get('/:paperId/versions', (req: Request, res: Response) => {
  const { paperId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperId,
    data: { versions: [], paperId },
  }));
});

// POST /api/question-bank/exam-papers/:paperId/versions — Create version
router.post('/:paperId/versions', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperId } = req.params;
  const versionId = randomUUID();
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: versionId,
    resourceVersion: '1',
    status: 'draft',
    safeMessage: 'Paper version created',
    data: { paperVersionId: versionId, paperId, versionNumber: 1 },
    nextAllowedActions: ['add_sections', 'add_questions', 'create_variants'],
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId — Get version
router.get('/exam-paper-versions/:paperVersionId', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { paperVersionId },
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/sections — Get sections
router.get('/exam-paper-versions/:paperVersionId/sections', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { sections: [], paperVersionId },
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/questions — Get questions
router.get('/exam-paper-versions/:paperVersionId/questions', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { questions: [], paperVersionId },
  }));
});

// POST /api/question-bank/exam-paper-versions/:paperVersionId/variants — Create variant
router.post('/exam-paper-versions/:paperVersionId/variants', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const variantId = randomUUID();
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: variantId,
    status: 'draft',
    safeMessage: 'Variant plan created',
    data: { variantId, paperVersionId, variantStrategy: 'same_questions_reordered' },
    nextAllowedActions: ['approve_variant', 'generate_variant_questions'],
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/variants — List variants
router.get('/exam-paper-versions/:paperVersionId/variants', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { variants: [], paperVersionId },
  }));
});

// POST /api/question-bank/exam-paper-versions/:paperVersionId/access-policy — Create access policy
router.post('/exam-paper-versions/:paperVersionId/access-policy', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const policyId = randomUUID();
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: policyId,
    status: 'draft',
    safeMessage: 'Access policy created (metadata only, no live delivery)',
    data: { accessPolicyId: policyId, paperVersionId, availabilityMode: 'manual_teacher_activation' },
    nextAllowedActions: ['configure_access', 'mark_delivery_ready'],
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/access-policy — Get access policy
router.get('/exam-paper-versions/:paperVersionId/access-policy', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { accessPolicy: null, paperVersionId },
  }));
});

// POST /api/question-bank/exam-paper-versions/:paperVersionId/approve — Approve paper
router.post('/exam-paper-versions/:paperVersionId/approve', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const approvalId = randomUUID();
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: approvalId,
    status: 'approved',
    safeMessage: 'Paper version approved for delivery bridge (not live delivery)',
    data: { paperApprovalId: approvalId, paperVersionId, decision: 'approve_for_delivery_bridge' },
    nextAllowedActions: ['create_delivery_bridge', 'mark_delivery_ready'],
  }));
});

// POST /api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge — Create delivery bridge
router.post('/exam-paper-versions/:paperVersionId/delivery-bridge', (req: Request, res: Response) => {
  if (!requireIdempotencyKey(req, res)) return;
  const ctx = buildCommandContext(req);
  const { paperVersionId } = req.params;
  const bridgeId = randomUUID();
  res.status(201).json(createSafeResponseEnvelope(req, {
    resourceId: bridgeId,
    status: 'draft',
    safeMessage: 'Delivery bridge contract created (no live sessions, no release)',
    data: { deliveryBridgeId: bridgeId, paperVersionId },
    nextAllowedActions: ['validate_bridge', 'mark_delivery_ready'],
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/delivery-bridge — Get delivery bridge
router.get('/exam-paper-versions/:paperVersionId/delivery-bridge', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { deliveryBridge: null, paperVersionId },
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/teacher — Teacher projection
router.get('/exam-paper-versions/:paperVersionId/projection/teacher', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: { projection: { paperVersionId, role: 'teacher' } },
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/student-preview
router.get('/exam-paper-versions/:paperVersionId/projection/student-preview', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: {
      projection: {
        paperVersionId,
        title: 'Safe Title',
        durationMinutes: 0,
        totalMarks: 0,
        sectionTitles: [],
        safeQuestionCount: 0,
        safePolicySummary: 'Not configured',
        deliveryReadinessLabel: 'Not yet ready',
      },
    },
  }));
});

// GET /api/question-bank/exam-paper-versions/:paperVersionId/projection/parent-preview
router.get('/exam-paper-versions/:paperVersionId/projection/parent-preview', (req: Request, res: Response) => {
  const { paperVersionId } = req.params;
  res.status(200).json(createSafeResponseEnvelope(req, {
    resourceId: paperVersionId,
    data: {
      projection: {
        paperVersionId,
        title: 'Safe Title',
        durationMinutes: 0,
        totalMarks: 0,
        sectionCount: 0,
        safePolicySummary: 'Not configured',
        deliveryReadinessLabel: 'Not yet ready',
      },
    },
  }));
});

export default router;
