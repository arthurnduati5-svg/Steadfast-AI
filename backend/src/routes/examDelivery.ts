import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { createInMemoryExamDeliveryRepositories } from '../domains/assessment/exam-delivery/repositories/inMemoryExamDeliveryRepositories';
import { ExamDeliverySessionService } from '../domains/assessment/exam-delivery/services/examDeliverySessionService';
import { ExamDeliveryActivationService } from '../domains/assessment/exam-delivery/services/examDeliveryActivationService';
import { ExamVariantAssignmentService } from '../domains/assessment/exam-delivery/services/examVariantAssignmentService';
import { ExamAttemptService } from '../domains/assessment/exam-delivery/services/examAttemptService';
import { ExamAttemptQuestionSnapshotService } from '../domains/assessment/exam-delivery/services/examAttemptQuestionSnapshotService';
import { ExamAnswerSubmissionService } from '../domains/assessment/exam-delivery/services/examAnswerSubmissionService';
import { ExamTimingService } from '../domains/assessment/exam-delivery/services/examTimingService';
import { ExamSubmissionSnapshotService } from '../domains/assessment/exam-delivery/services/examSubmissionSnapshotService';
import { ExamDeliveryProjectionSafetyService } from '../domains/assessment/exam-delivery/services/examDeliveryProjectionSafetyService';
import { ExamDeliveryAuditBridge } from '../domains/assessment/exam-delivery/services/examDeliveryAuditBridge';
import {
  ExamDeliveryCommandContext,
  ExamDeliverySafeEnvelope,
  ExamDeliveryPolicyDecision,
} from '../domains/assessment/exam-delivery/contracts/examDeliveryContracts';

const router = Router();

const repos = createInMemoryExamDeliveryRepositories();

const sessionService = new ExamDeliverySessionService(repos);
const activationService = new ExamDeliveryActivationService(repos);
const assignmentService = new ExamVariantAssignmentService(repos);
const attemptService = new ExamAttemptService(repos);
const questionSnapshotService = new ExamAttemptQuestionSnapshotService(repos);
const answerService = new ExamAnswerSubmissionService(repos);
const timingService = new ExamTimingService(repos);
const submissionSnapshotService = new ExamSubmissionSnapshotService(repos);
const projectionService = new ExamDeliveryProjectionSafetyService(repos);
const auditBridge = new ExamDeliveryAuditBridge(repos);

function defaultPolicyDecision(): ExamDeliveryPolicyDecision {
  return { allowed: true, reasonCode: 'OK', safeMessage: 'Operation permitted', blockedOperation: '' };
}

function buildSafeEnvelope(
  req: Request,
  overrides: Partial<ExamDeliverySafeEnvelope>,
): ExamDeliverySafeEnvelope {
  return {
    ok: overrides.ok ?? true,
    requestId: (req as any).requestId || 'unknown',
    correlationId: overrides.correlationId ?? ((req as any).correlationId ?? ''),
    resourceId: overrides.resourceId ?? '',
    resourceVersion: overrides.resourceVersion ?? null,
    status: overrides.status ?? 'ok',
    safeMessage: overrides.safeMessage ?? '',
    reasonCode: overrides.reasonCode ?? '',
    policyDecision: overrides.policyDecision ?? defaultPolicyDecision(),
    nextAllowedActions: overrides.nextAllowedActions ?? [],
    data: overrides.data ?? {},
  };
}

function extractActorContext(req: Request): { schoolId: string; actorId: string; actorRole: string } {
  const schoolId = (req.headers['x-school-id'] as string) ?? '';
  const actorId = (req.headers['x-actor-id'] as string) ?? '';
  const actorRole = (req.headers['x-actor-role'] as string) ?? '';
  return { schoolId, actorId, actorRole };
}

function buildCommandContext(req: Request): ExamDeliveryCommandContext {
  const { schoolId, actorId, actorRole } = extractActorContext(req);
  const correlationId = (req.headers['x-correlation-id'] as string) ?? uuid();
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) ?? '';
  return { schoolId, actorId, actorRole, correlationId, idempotencyKey };
}

function requireIdempotencyKey(req: Request, res: Response): boolean {
  const key = req.headers['x-idempotency-key'] as string;
  if (!key) {
    res.status(400).json(buildSafeEnvelope(req, {
      ok: false,
      correlationId: (req.headers['x-correlation-id'] as string) ?? uuid(),
      safeMessage: 'Idempotency key (x-idempotency-key) is required',
      reasonCode: 'IDEMPOTENCY_REQUIRED',
    }));
    return false;
  }
  return true;
}

// ── Session Routes ──

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const {
      paperId, paperVersionId, deliveryBridgeId, accessPolicyId,
      title, safeInstructions, intendedAudienceType, sessionMode, activationMode,
      classScopeRefsJson, roleScopeRefsJson,
    } = req.body ?? {};
    if (!paperId || !paperVersionId || !title) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'paperId, paperVersionId, and title are required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const result = await sessionService.createDeliverySession(ctx, {
      paperId, paperVersionId, deliveryBridgeId, accessPolicyId,
      title, safeInstructions, intendedAudienceType, sessionMode, activationMode,
      classScopeRefsJson, roleScopeRefsJson,
    });
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordSessionCreated(ctx, result.session.deliverySessionId);
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: result.session.deliverySessionId,
      resourceVersion: 1,
      status: 'draft',
      safeMessage: 'Delivery session created',
      policyDecision: result.policy,
      nextAllowedActions: ['open', 'assign_variants'],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions/:deliverySessionId', async (req: Request, res: Response) => {
  try {
    const { deliverySessionId } = req.params;
    const session = await sessionService.getDeliverySession(deliverySessionId);
    if (!session) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, safeMessage: 'Delivery session not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      resourceId: deliverySessionId,
      status: session.status,
      safeMessage: 'Delivery session retrieved',
      data: { session: session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const ctx = buildCommandContext(req);
    const status = req.query.status as string | undefined;
    const sessions = await sessionService.listDeliverySessionsForSchool(ctx.schoolId, status as any);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      safeMessage: 'Delivery sessions listed',
      data: { sessions: sessions as unknown as Record<string, unknown>[] },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/open', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const result = await activationService.openDeliverySession(ctx, deliverySessionId);
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordSessionOpened(ctx, deliverySessionId);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      status: 'open',
      safeMessage: 'Delivery session opened',
      policyDecision: result.policy,
      nextAllowedActions: ['assign_variants', 'pause', 'close'],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/pause', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const result = await activationService.pauseDeliverySession(ctx, deliverySessionId);
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      status: 'paused',
      safeMessage: 'Delivery session paused',
      policyDecision: result.policy,
      nextAllowedActions: ['resume', 'close'],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/resume', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const result = await activationService.resumeDeliverySession(ctx, deliverySessionId);
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      status: 'open',
      safeMessage: 'Delivery session resumed',
      policyDecision: result.policy,
      nextAllowedActions: ['pause', 'close'],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/close', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const result = await activationService.closeDeliverySession(ctx, deliverySessionId);
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordSessionClosed(ctx, deliverySessionId);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      status: 'closed',
      safeMessage: 'Delivery session closed',
      policyDecision: result.policy,
      nextAllowedActions: ['reopen'],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/cancel', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const result = await activationService.cancelDeliverySession(ctx, deliverySessionId);
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      status: 'cancelled',
      safeMessage: 'Delivery session cancelled',
      policyDecision: result.policy,
      nextAllowedActions: [],
      data: { session: result.session as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Assignment Routes ──

router.post('/sessions/:deliverySessionId/assignments', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const {
      paperId, paperVersionId, variantId, studentRef, learnerRefType,
      assignmentStrategy, safeAssignmentSummary,
    } = req.body ?? {};
    if (!variantId || !studentRef) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'variantId and studentRef are required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const result = await assignmentService.assignVariantToStudent(ctx, {
      deliverySessionId, paperId, paperVersionId, variantId, studentRef,
      learnerRefType, assignmentStrategy, safeAssignmentSummary,
    });
    if (!result.policy.allowed) {
      const status = result.policy.reasonCode === 'SESSION_NOT_FOUND' ? 404 : 403;
      res.status(status).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordVariantAssigned(ctx, deliverySessionId);
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: result.assignment!.variantAssignmentId,
      status: 'assigned',
      safeMessage: 'Variant assigned to student',
      policyDecision: result.policy,
      nextAllowedActions: ['start_attempt'],
      data: { assignment: result.assignment as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/sessions/:deliverySessionId/assignments/bulk', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const { paperId, paperVersionId, assignments } = req.body ?? {};
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'assignments array is required with at least one entry', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const result = await assignmentService.bulkAssignVariants(ctx, {
      deliverySessionId, paperId, paperVersionId, assignments,
    });
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      status: 'assigned',
      safeMessage: `${result.assignments.length} variants assigned`,
      policyDecision: result.policy,
      nextAllowedActions: ['start_attempt'],
      data: { assignments: result.assignments as unknown as Record<string, unknown>[] },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions/:deliverySessionId/assignments', async (req: Request, res: Response) => {
  try {
    const { deliverySessionId } = req.params;
    const assignments = await assignmentService.listAssignmentsForSession(deliverySessionId);
    res.json(buildSafeEnvelope(req, {
      resourceId: deliverySessionId,
      safeMessage: 'Assignments listed for session',
      data: { assignments: assignments as unknown as Record<string, unknown>[] },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions/:deliverySessionId/assignments/:studentRef', async (req: Request, res: Response) => {
  try {
    const { deliverySessionId, studentRef } = req.params;
    const assignment = await assignmentService.getAssignmentForStudent(deliverySessionId, studentRef);
    if (!assignment) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, safeMessage: 'Assignment not found for student', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      resourceId: assignment.variantAssignmentId,
      safeMessage: 'Assignment retrieved for student',
      data: { assignment: assignment as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/assignments/:variantAssignmentId/revoke', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { variantAssignmentId } = req.params;
    const result = await assignmentService.revokeVariantAssignment(ctx, variantAssignmentId);
    if (!result.policy.allowed) {
      const status = result.policy.reasonCode === 'NOT_FOUND' ? 404 : 403;
      res.status(status).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: variantAssignmentId,
      status: 'revoked',
      safeMessage: 'Variant assignment revoked',
      policyDecision: result.policy,
      nextAllowedActions: ['assign_new_variant'],
      data: { assignment: result.assignment as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Attempt Routes ──

router.post('/assignments/:variantAssignmentId/attempts', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { variantAssignmentId } = req.params;
    const { deliverySessionId, studentRef, durationSecondsAllowed } = req.body ?? {};
    if (!deliverySessionId || !studentRef || !durationSecondsAllowed) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'deliverySessionId, studentRef, and durationSecondsAllowed are required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const result = await attemptService.startAttempt(ctx, {
      deliverySessionId, variantAssignmentId, studentRef, durationSecondsAllowed,
    });
    if (!result.policy.allowed) {
      const status = result.policy.reasonCode === 'SESSION_NOT_FOUND' || result.policy.reasonCode === 'ASSIGNMENT_NOT_FOUND' ? 404 : 403;
      res.status(status).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await timingService.recordAttemptStarted(ctx.schoolId, result.attempt!.attemptId, deliverySessionId, durationSecondsAllowed);
    await auditBridge.recordAttemptStarted(ctx, deliverySessionId, result.attempt!.attemptId);
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: result.attempt!.attemptId,
      status: 'in_progress',
      safeMessage: 'Attempt started',
      policyDecision: result.policy,
      nextAllowedActions: ['answer_questions', 'submit', 'pause'],
      data: { attempt: result.attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/attempts/:attemptId', async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const attempt = await attemptService.getAttempt(attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      resourceId: attemptId,
      status: attempt.status,
      safeMessage: 'Attempt retrieved',
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/attempts/:attemptId/pause', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const { durationSecondsUsed, durationSecondsRemaining } = req.body ?? {};
    const attempt = await attemptService.pauseAttempt(ctx, attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    await timingService.recordPaused(ctx.schoolId, attemptId, attempt.deliverySessionId, durationSecondsUsed ?? 0, durationSecondsRemaining ?? 0);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      status: 'paused',
      safeMessage: 'Attempt paused',
      nextAllowedActions: ['resume'],
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/attempts/:attemptId/resume', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const { durationSecondsUsed, durationSecondsRemaining } = req.body ?? {};
    const attempt = await attemptService.resumeAttempt(ctx, attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    await timingService.recordResumed(ctx.schoolId, attemptId, attempt.deliverySessionId, durationSecondsUsed ?? 0, durationSecondsRemaining ?? 0);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      status: 'in_progress',
      safeMessage: 'Attempt resumed',
      nextAllowedActions: ['answer_questions', 'submit', 'pause'],
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/attempts/:attemptId/cancel', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const attempt = await attemptService.cancelAttempt(ctx, attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      status: 'cancelled',
      safeMessage: 'Attempt cancelled',
      nextAllowedActions: ['start_new_attempt'],
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/attempts/:attemptId/expire', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const attempt = await attemptService.expireAttempt(ctx, attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    await timingService.recordExpired(ctx.schoolId, attemptId, attempt.deliverySessionId, attempt.durationSecondsUsed, 0);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      status: 'expired',
      safeMessage: 'Attempt expired',
      nextAllowedActions: ['start_new_attempt'],
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/attempts/:attemptId/submit', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const attempt = await attemptService.submitAttempt(ctx, attemptId);
    if (!attempt) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Attempt not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    await timingService.recordSubmitted(ctx.schoolId, attemptId, attempt.deliverySessionId, attempt.durationSecondsUsed, 0);
    await auditBridge.recordAttemptSubmitted(ctx, attempt.deliverySessionId, attemptId);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      status: 'submitted',
      safeMessage: 'Attempt submitted',
      nextAllowedActions: ['view_results'],
      data: { attempt: attempt as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Question Snapshot Routes ──

router.get('/attempts/:attemptId/questions', async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const snapshots = await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId);
    res.json(buildSafeEnvelope(req, {
      resourceId: attemptId,
      safeMessage: 'Question snapshots listed for attempt',
      data: { questionSnapshots: snapshots as unknown as Record<string, unknown>[] },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Answer Routes ──

router.post('/attempts/:attemptId/answers', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const {
      attemptQuestionSnapshotId, deliverySessionId, studentRef,
      answerTextSafe, answerPayloadJson, attachmentRefsJson, clientSavedAt, isFinal,
    } = req.body ?? {};
    if (!attemptQuestionSnapshotId || !studentRef) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'attemptQuestionSnapshotId and studentRef are required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    let result;
    if (isFinal) {
      result = await answerService.submitAnswer(ctx, {
        attemptId, attemptQuestionSnapshotId, deliverySessionId, studentRef,
        answerTextSafe, answerPayloadJson, attachmentRefsJson, clientSavedAt,
      });
    } else {
      result = await answerService.saveDraftAnswer(ctx, {
        attemptId, attemptQuestionSnapshotId, deliverySessionId, studentRef,
        answerTextSafe, answerPayloadJson, attachmentRefsJson, clientSavedAt,
      });
    }
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordAnswerSaved(ctx, deliverySessionId ?? '', attemptId);
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: result.submission!.answerSubmissionId,
      status: result.submission!.answerStatus,
      safeMessage: isFinal ? 'Answer submitted as final' : 'Draft answer saved',
      policyDecision: result.policy,
      nextAllowedActions: ['save_draft', 'submit_answer'],
      data: { submission: result.submission as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/attempts/:attemptId/answers', async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const answers = await answerService.listAnswersForAttempt(attemptId);
    res.json(buildSafeEnvelope(req, {
      resourceId: attemptId,
      safeMessage: 'Answers listed for attempt',
      data: { answers: answers as unknown as Record<string, unknown>[] },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.post('/answers/:answerSubmissionId/submit', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { answerSubmissionId } = req.params;
    const { attemptQuestionSnapshotId, attemptId, deliverySessionId, studentRef, answerTextSafe, answerPayloadJson, attachmentRefsJson, clientSavedAt } = req.body ?? {};
    if (!attemptQuestionSnapshotId || !studentRef) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'attemptQuestionSnapshotId and studentRef are required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const result = await answerService.submitAnswer(ctx, {
      attemptId, attemptQuestionSnapshotId, deliverySessionId, studentRef,
      answerTextSafe, answerPayloadJson, attachmentRefsJson, clientSavedAt,
    });
    if (!result.policy.allowed) {
      res.status(403).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordAnswerSaved(ctx, deliverySessionId ?? '', attemptId);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: answerSubmissionId,
      status: 'submitted',
      safeMessage: 'Answer submitted as final',
      policyDecision: result.policy,
      nextAllowedActions: [],
      data: { submission: result.submission as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Timing Routes ──

router.post('/attempts/:attemptId/timing/heartbeat', async (req: Request, res: Response) => {
  try {
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const { durationSecondsUsed, durationSecondsRemaining } = req.body ?? {};
    const event = await timingService.recordHeartbeat(ctx.schoolId, attemptId, '', durationSecondsUsed ?? 0, durationSecondsRemaining ?? 0);
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      safeMessage: 'Heartbeat recorded',
      data: { timingEvent: event as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Submission Snapshot Routes ──

router.post('/attempts/:attemptId/submission-snapshot', async (req: Request, res: Response) => {
  try {
    if (!requireIdempotencyKey(req, res)) return;
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const result = await submissionSnapshotService.sealSubmissionSnapshot(ctx, attemptId);
    if (!result.policy.allowed) {
      const status = result.policy.reasonCode === 'ATTEMPT_NOT_FOUND' ? 404 : 403;
      res.status(status).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: result.policy.safeMessage, reasonCode: result.policy.reasonCode, policyDecision: result.policy }));
      return;
    }
    await auditBridge.recordSnapshotSealed(ctx, result.snapshot!.deliverySessionId, attemptId);
    res.status(201).json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: result.snapshot!.submissionSnapshotId,
      status: 'sealed',
      safeMessage: 'Submission snapshot sealed',
      policyDecision: result.policy,
      nextAllowedActions: ['view_snapshot', 'marking'],
      data: { snapshot: result.snapshot as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/attempts/:attemptId/submission-snapshot', async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    if (!snapshot) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, safeMessage: 'Submission snapshot not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      resourceId: snapshot.submissionSnapshotId,
      status: snapshot.snapshotStatus,
      safeMessage: 'Submission snapshot retrieved',
      data: { snapshot: snapshot as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

// ── Projection Routes ──

router.get('/attempts/:attemptId/projection/student', async (req: Request, res: Response) => {
  try {
    const ctx = buildCommandContext(req);
    const { attemptId } = req.params;
    const studentRef = (req.query.studentRef as string) ?? (req.headers['x-student-ref'] as string) ?? '';
    if (!studentRef) {
      res.status(400).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'studentRef query parameter or x-student-ref header is required', reasonCode: 'VALIDATION_FAILED' }));
      return;
    }
    const projection = await projectionService.toStudentAttemptProjection(attemptId, ctx.schoolId, studentRef);
    if (!projection) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Student projection not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: attemptId,
      safeMessage: 'Student attempt projection retrieved',
      data: { projection: projection as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions/:deliverySessionId/projection/teacher', async (req: Request, res: Response) => {
  try {
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const projection = await projectionService.toTeacherProjection(deliverySessionId, ctx.schoolId);
    if (!projection) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Teacher projection not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      safeMessage: 'Teacher projection retrieved',
      data: { projection: projection as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

router.get('/sessions/:deliverySessionId/projection/admin', async (req: Request, res: Response) => {
  try {
    const ctx = buildCommandContext(req);
    const { deliverySessionId } = req.params;
    const projection = await projectionService.toAdminProjection(deliverySessionId, ctx.schoolId);
    if (!projection) {
      res.status(404).json(buildSafeEnvelope(req, { ok: false, correlationId: ctx.correlationId, safeMessage: 'Admin projection not found', reasonCode: 'NOT_FOUND' }));
      return;
    }
    res.json(buildSafeEnvelope(req, {
      correlationId: ctx.correlationId,
      resourceId: deliverySessionId,
      safeMessage: 'Admin projection retrieved',
      data: { projection: projection as unknown as Record<string, unknown> },
    }));
  } catch (error: any) {
    res.status(500).json(buildSafeEnvelope(req, { ok: false, safeMessage: error.message, reasonCode: 'UNKNOWN_SAFE_ERROR' }));
  }
});

export default router;
