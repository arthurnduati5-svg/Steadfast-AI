/**
 * AI Route Module — Study Plans & Goals
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 8428-9002.
 * Domain: study
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import {
  createStudyPlan,
  generateAdaptiveStudyPlan,
  getStudyPlans,
  getStudyPlanDetails,
  updateStudyPlan,
  setStudyPlanLifecycle,
  createStudyPlanGoal,
  getStudyGoals,
  completeStudyGoal,
  updateStudyGoal,
  createSemesterPlan,
  getSemesterPlans,
  getSemesterPlanDetails,
} from '../../services/studySupportService';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';

const router = Router();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ── POST /study-plans ──
router.post('/study-plans', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await createStudyPlan({ ...req.body, studentId: req.user!.id });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-plans] Failed');
    res.status(500).send({ message: 'Failed to create study plan' });
  }
});

// ── POST /study-plans/generate ──
router.post('/study-plans/generate', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await generateAdaptiveStudyPlan({ ...req.body, studentId: req.user!.id });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-plans/generate] Failed');
    res.status(500).send({ message: 'Failed to generate study plan' });
  }
});

// ── GET /study-plans ──
router.get('/study-plans', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plans = await getStudyPlans(req.user!.id);
    res.status(200).send(plans);
  } catch (error) {
    logger.error({ err: error }, '[GET /study-plans] Failed');
    res.status(500).send({ message: 'Failed to fetch study plans' });
  }
});

// ── GET /study-plans/:id ──
router.get('/study-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await getStudyPlanDetails(req.user!.id, req.params.id);
    if (!plan) return res.status(404).send({ message: 'Study plan not found' });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[GET /study-plans/:id] Failed');
    res.status(500).send({ message: 'Failed to fetch study plan' });
  }
});

// ── PATCH /study-plans/:id ──
router.patch('/study-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await updateStudyPlan({ userId: req.user!.id, planId: req.params.id, patch: req.body });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /study-plans/:id] Failed');
    res.status(500).send({ message: 'Failed to update study plan' });
  }
});

// ── POST /study-plans/:id/pause ──
router.post('/study-plans/:id/pause', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await setStudyPlanLifecycle({ userId: req.user!.id, planId: req.params.id, lifecycle: 'paused' });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-plans/:id/pause] Failed');
    res.status(500).send({ message: 'Failed to pause study plan' });
  }
});

// ── POST /study-plans/:id/resume ──
router.post('/study-plans/:id/resume', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await setStudyPlanLifecycle({ userId: req.user!.id, planId: req.params.id, lifecycle: 'active' });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-plans/:id/resume] Failed');
    res.status(500).send({ message: 'Failed to resume study plan' });
  }
});

// ── POST /study-plans/:id/goals ──
router.post('/study-plans/:id/goals', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const goal = await createStudyPlanGoal({ ...req.body, studentId: req.user!.id, planId: req.params.id });
    res.status(200).send(goal);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-plans/:id/goals] Failed');
    res.status(500).send({ message: 'Failed to create goal' });
  }
});

// ── GET /study-goals ──
router.get('/study-goals', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const goals = await getStudyGoals(req.user!.id);
    res.status(200).send(goals);
  } catch (error) {
    logger.error({ err: error }, '[GET /study-goals] Failed');
    res.status(500).send({ message: 'Failed to fetch goals' });
  }
});

// ── POST /study-goals/:id/complete ──
router.post('/study-goals/:id/complete', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const goal = await completeStudyGoal({ userId: req.user!.id, goalId: req.params.id });
    res.status(200).send(goal);
  } catch (error) {
    logger.error({ err: error }, '[POST /study-goals/:id/complete] Failed');
    res.status(500).send({ message: 'Failed to complete goal' });
  }
});

// ── PATCH /study-goals/:id ──
router.patch('/study-goals/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const goal = await updateStudyGoal({ userId: req.user!.id, goalId: req.params.id, patch: req.body });
    res.status(200).send(goal);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /study-goals/:id] Failed');
    res.status(500).send({ message: 'Failed to update goal' });
  }
});

// ── POST /semester-plan ──
router.post('/semester-plan', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await createSemesterPlan({ ...req.body, studentId: req.user!.id });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[POST /semester-plan] Failed');
    res.status(500).send({ message: 'Failed to create semester plan' });
  }
});

// ── GET /semester-plans ──
router.get('/semester-plans', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plans = await getSemesterPlans(req.user!.id);
    res.status(200).send(plans);
  } catch (error) {
    logger.error({ err: error }, '[GET /semester-plans] Failed');
    res.status(500).send({ message: 'Failed to fetch semester plans' });
  }
});

// ── GET /semester-plans/:id ──
router.get('/semester-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const plan = await getSemesterPlanDetails(req.user!.id, req.params.id);
    if (!plan) return res.status(404).send({ message: 'Semester plan not found' });
    res.status(200).send(plan);
  } catch (error) {
    logger.error({ err: error }, '[GET /semester-plans/:id] Failed');
    res.status(500).send({ message: 'Failed to fetch semester plan' });
  }
});

export default router;
