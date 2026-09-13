import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  GrowthActionResolveRequestSchema,
  GrowthActionExecuteRequestSchema,
  GrowthWhyThisNextRequestSchema,
  GrowthActionStateQuerySchema,
  GrowthActionEventRequestSchema,
} from '../lib/growthActionValidation';
import { assertSafeGrowthActionInput } from '../services/growthActionPrivacyGuard';
import { evaluateGrowthActionAccess } from '../services/growthActionAccessPolicy';
import { collectGrowthActionEvidence } from '../services/growthActionEvidenceService';
import { buildLearnerState } from '../services/growthActionLearnerStateService';
import { resolveGrowthAction } from '../services/growthActionResolverService';
import { generateWhyThisNext } from '../services/growthWhyThisNextService';
import { evaluateRoutingPolicy } from '../services/growthActionRoutingPolicyService';
import { recommendMode } from '../services/growthModeRecommendationService';
import { executeGrowthAction } from '../services/growthActionExecutionService';
import { recordGrowthActionEvent } from '../services/growthActionTelemetryService';
import { buildStudentView, buildWhyThisNextView, buildEmptyStateView, buildErrorView, buildExecutionResultView } from '../services/growthActionResponseBuilder';
import type { GrowthLearnerEvidenceSnapshot, GrowthActionPlan } from '../contracts/growthActionContracts';

const router = Router();

function getStudentId(req: Request): string | undefined {
  return (req.query.studentId as string) ||
    (req.body?.studentId as string) ||
    (req.headers['x-student-id'] as string) ||
    (req.user as any)?.id;
}

function getSchoolId(req: Request): string | undefined {
  return (req.query.schoolId as string) ||
    (req.body?.schoolId as string) ||
    (req.headers['x-school-id'] as string) ||
    (req.user as any)?.schoolId;
}

function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({
    ok: false,
    error: { code, message },
    safeEvidenceRefs: [],
    safeReasonCodes: [],
  });
}

function buildDefaultEvidence(studentId: string, schoolId: string): GrowthLearnerEvidenceSnapshot {
  return {
    studentId,
    schoolId,
    weakTopicSignals: [],
    mistakeSignals: [],
    masterySignals: [],
    supportSignals: [],
    revisionSignals: [],
    modeSummarySignals: [],
    contentAvailability: { available: false, gapDetected: false },
    deenSensitivity: { detected: false, uncertain: false },
    stateQuality: 'no_data_yet',
    safeEvidenceRefs: [],
    safeReasonCodes: ['insufficient_evidence'],
  };
}

const actionPlanStore = new Map<string, GrowthActionPlan>();

// POST /api/copilot/growth/action — resolve or resolve+execute
router.post('/action', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const parsed = GrowthActionResolveRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, 'validation_error', parsed.error.errors.map(e => e.message).join('; '));
    }

    const evidence = buildDefaultEvidence(studentId, schoolId);
    const learnerState = buildLearnerState(evidence);

    const resolverInput = { request: parsed.data, evidence, learnerState };
    const result = resolveGrowthAction(resolverInput);

    actionPlanStore.set(result.actionPlan.id, result.actionPlan);

    recordGrowthActionEvent({
      schoolId: schoolId,
      studentId: studentId,
      growthActionPlanId: result.actionPlan.id,
      eventType: 'growth_action_resolved',
      growthIntent: result.actionPlan.growthIntent,
      resolvedDestination: result.recommendedDestination,
      executionStatus: result.actionPlan.executionStatus,
      safeEvidenceRefs: result.safeEvidenceRefs,
    });

    const execute = req.body?.execute === true;
    if (execute) {
      const execResult = executeGrowthAction({
        actionPlan: result.actionPlan,
        execute: true,
      });

      if (execResult.success && execResult.executionStatus === 'executed') {
        result.actionPlan.executionStatus = 'executed';
        actionPlanStore.set(result.actionPlan.id, result.actionPlan);
        recordGrowthActionEvent({
          schoolId, studentId,
          growthActionPlanId: result.actionPlan.id,
          eventType: 'growth_action_executed',
          growthIntent: result.actionPlan.growthIntent,
          resolvedDestination: result.recommendedDestination,
          executedDestination: result.recommendedDestination,
          executionStatus: 'executed',
          safeEvidenceRefs: result.safeEvidenceRefs,
        });
      }

      const view = buildExecutionResultView({
        actionPlan: result.actionPlan,
        whyThisNextDecision: result.whyThisNextDecision,
        executionResult: execResult,
        safeEvidenceRefs: result.safeEvidenceRefs,
        safeReasonCodes: result.safeReasonCodes,
      });
      return res.status(execResult.success ? 200 : 400).json(view);
    }

    const view = buildStudentView({
      actionPlan: result.actionPlan,
      whyThisNextDecision: result.whyThisNextDecision,
      safeEvidenceRefs: result.safeEvidenceRefs,
      safeReasonCodes: result.safeReasonCodes,
    });
    return res.status(200).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to resolve growth action.');
  }
});

// POST /api/copilot/growth/action/resolve — resolve only
router.post('/action/resolve', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const parsed = GrowthActionResolveRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, 'validation_error', parsed.error.errors.map(e => e.message).join('; '));
    }

    const evidence = buildDefaultEvidence(studentId, schoolId);
    const learnerState = buildLearnerState(evidence);
    const result = resolveGrowthAction({ request: parsed.data, evidence, learnerState });

    actionPlanStore.set(result.actionPlan.id, result.actionPlan);

    recordGrowthActionEvent({
      schoolId, studentId,
      growthActionPlanId: result.actionPlan.id,
      eventType: 'growth_action_resolved',
      growthIntent: result.actionPlan.growthIntent,
      resolvedDestination: result.recommendedDestination,
      executionStatus: result.actionPlan.executionStatus,
      safeEvidenceRefs: result.safeEvidenceRefs,
    });

    const view = buildStudentView({
      actionPlan: result.actionPlan,
      whyThisNextDecision: result.whyThisNextDecision,
      safeEvidenceRefs: result.safeEvidenceRefs,
      safeReasonCodes: result.safeReasonCodes,
    });
    return res.status(200).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to resolve growth action.');
  }
});

// POST /api/copilot/growth/action/execute — execute an already-resolved plan
router.post('/action/execute', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const parsed = GrowthActionExecuteRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, 'validation_error', parsed.error.errors.map(e => e.message).join('; '));
    }

    const evidence = buildDefaultEvidence(studentId, schoolId);
    const learnerState = buildLearnerState(evidence);
    const result = resolveGrowthAction({ request: parsed.data, evidence, learnerState });

    const execResult = executeGrowthAction({
      actionPlan: result.actionPlan,
      execute: true,
      replaceExisting: parsed.data.replaceExisting,
    });

    if (execResult.success && execResult.executionStatus === 'executed') {
      result.actionPlan.executionStatus = 'executed';
      actionPlanStore.set(result.actionPlan.id, result.actionPlan);
      recordGrowthActionEvent({
        schoolId, studentId,
        growthActionPlanId: result.actionPlan.id,
        eventType: 'growth_action_executed',
        growthIntent: result.actionPlan.growthIntent,
        resolvedDestination: result.recommendedDestination,
        executedDestination: result.recommendedDestination,
        executionStatus: 'executed',
        safeEvidenceRefs: result.safeEvidenceRefs,
      });
    } else {
      recordGrowthActionEvent({
        schoolId, studentId,
        growthActionPlanId: result.actionPlan.id,
        eventType: 'growth_action_failed',
        growthIntent: result.actionPlan.growthIntent,
        resolvedDestination: result.recommendedDestination,
        executionStatus: execResult.executionStatus,
        failureReasonCode: execResult.failureReasonCode,
        safeEvidenceRefs: result.safeEvidenceRefs,
      });
    }

    const view = buildExecutionResultView({
      actionPlan: result.actionPlan,
      whyThisNextDecision: result.whyThisNextDecision,
      executionResult: execResult,
      safeEvidenceRefs: result.safeEvidenceRefs,
      safeReasonCodes: result.safeReasonCodes,
    });
    return res.status(execResult.success ? 200 : 400).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to execute growth action.');
  }
});

// GET /api/copilot/growth/action/:growthActionPlanId — get plan by id
router.get('/action/:growthActionPlanId', async (req: Request, res: Response) => {
  try {
    const { growthActionPlanId } = req.params;
    const plan = actionPlanStore.get(growthActionPlanId);
    if (!plan) {
      return sendError(res, 404, 'not_found', 'Growth action plan not found.');
    }
    const view = buildStudentView({
      actionPlan: plan,
      safeEvidenceRefs: plan.safeEvidenceRefs,
      safeReasonCodes: plan.safeReasonCodes,
    });
    return res.status(200).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to retrieve growth action plan.');
  }
});

// POST /api/copilot/growth/why-this-next — generate why-this-next explanation
router.post('/why-this-next', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const parsed = GrowthWhyThisNextRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, 'validation_error', parsed.error.errors.map(e => e.message).join('; '));
    }

    const evidence = buildDefaultEvidence(studentId, schoolId);
    const learnerState = buildLearnerState(evidence);

    const resolveResult = resolveGrowthAction({
      request: parsed.data,
      evidence,
      learnerState,
    });

    recordGrowthActionEvent({
      schoolId, studentId,
      growthActionPlanId: resolveResult.actionPlan.id,
      eventType: 'why_this_next_generated',
      growthIntent: resolveResult.actionPlan.growthIntent,
      resolvedDestination: resolveResult.recommendedDestination,
      executionStatus: 'resolved',
      safeEvidenceRefs: resolveResult.safeEvidenceRefs,
    });

    const view = buildWhyThisNextView({
      actionPlan: resolveResult.actionPlan,
      whyThisNextDecision: resolveResult.whyThisNextDecision,
      safeEvidenceRefs: resolveResult.safeEvidenceRefs,
      safeReasonCodes: resolveResult.safeReasonCodes,
    });
    return res.status(200).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to generate why-this-next explanation.');
  }
});

// GET /api/copilot/growth/next — get next recommended action (simplified)
router.get('/next', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const evidence = buildDefaultEvidence(studentId, schoolId);
    const learnerState = buildLearnerState(evidence);

    const resolveResult = resolveGrowthAction({
      request: { schoolId, studentId },
      evidence,
      learnerState,
    });

    const view = buildStudentView({
      actionPlan: resolveResult.actionPlan,
      whyThisNextDecision: resolveResult.whyThisNextDecision,
      safeEvidenceRefs: resolveResult.safeEvidenceRefs,
      safeReasonCodes: resolveResult.safeReasonCodes,
    });
    return res.status(200).json(view);
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to get next action.');
  }
});

// POST /api/copilot/growth/action/event — record a telemetry event
router.post('/action/event', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    if (!studentId) return sendError(res, 400, 'validation_error', 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'validation_error', 'schoolId is required');

    const parsed = GrowthActionEventRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, 'validation_error', parsed.error.errors.map(e => e.message).join('; '));
    }

    const event = recordGrowthActionEvent(parsed.data);
    return res.status(201).json({
      ok: true,
      data: { event },
      safeEvidenceRefs: parsed.data.safeEvidenceRefs || [],
      safeReasonCodes: [],
    });
  } catch (err) {
    return sendError(res, 500, 'internal_error', 'Failed to record event.');
  }
});

export default router;
