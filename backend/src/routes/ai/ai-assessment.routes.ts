/**
 * AI Route Module — Assessment & Metacognition
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 8001-8428.
 * Domain: assessment
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import {
  recordMetacognitiveEvent,
  getMetacognitiveProfile,
  chooseMetacognitivePrompt,
} from '../../services/metacognitionService';
import { buildLearnerLoopState } from '../../services/learnerLoopService';
import { checkPracticePadStep } from '../../services/practicePadService';
import {
  startAssessmentSession,
  getAssessmentSession,
  answerAssessmentQuestion,
  navigateAssessmentSession,
  requestAssessmentHint,
  pauseAssessmentSession,
  resumeAssessmentSession,
  finishAssessmentSession,
  getAssessmentResults,
} from '../../services/assessmentSessionService';
import type { MetacognitiveEvent } from '../../lib/types';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';

const router = Router();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ── POST /metacognition/event ──
router.post('/metacognition/event', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { sessionId, eventType, content, metadata } = req.body || {};

    const recorded = await recordMetacognitiveEvent({
      userId: req.user!.id,
      sessionId: safeString(sessionId) || undefined,
      eventType: safeString(eventType) as MetacognitiveEvent['eventType'],
      metadata: { ...(metadata as Record<string, unknown> || {}), content },
    });

    const loopState = await buildLearnerLoopState({
      userId: req.user!.id,
    });

    res.status(200).send({
      event: recorded,
      learnerState: loopState,
    });
  } catch (error) {
    logger.error({ err: error }, '[POST /metacognition/event] Failed');
    res.status(500).send({ message: 'Failed to record metacognitive event' });
  }
});

// ── GET /metacognition/profile ──
router.get('/metacognition/profile', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const profile = await getMetacognitiveProfile(req.user!.id);
    res.status(200).send(profile);
  } catch (error) {
    logger.error({ err: error }, '[GET /metacognition/profile] Failed');
    res.status(500).send({ message: 'Failed to load metacognitive profile' });
  }
});

// ── GET /metacognition/prompt ──
router.get('/metacognition/prompt', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { topic, subject } = req.query as any;
    const prompt = await chooseMetacognitivePrompt({
      topic: safeString(topic) || undefined,
      subject: safeString(subject) || undefined,
    });
    res.status(200).send({ prompt });
  } catch (error) {
    logger.error({ err: error }, '[GET /metacognition/prompt] Failed');
    res.status(500).send({ message: 'Failed to generate prompt' });
  }
});

// ── POST /practice-pad/check-step ──
router.post('/practice-pad/check-step', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await checkPracticePadStep({ ...req.body, userId: req.user!.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /practice-pad/check-step] Failed');
    res.status(500).send({ message: 'Step check failed' });
  }
});

// ── POST /assessment/sessions/start ──
router.post('/assessment/sessions/start', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const session = await startAssessmentSession({ ...req.body, studentId: req.user!.id });
    res.status(200).send(session);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/start] Failed');
    res.status(500).send({ message: 'Failed to start assessment session' });
  }
});

// ── GET /assessment/sessions/:id ──
router.get('/assessment/sessions/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const session = await getAssessmentSession({ userId: req.user!.id, sessionId: req.params.id });
    if (!session) return res.status(404).send({ message: 'Assessment session not found' });
    res.status(200).send(session);
  } catch (error) {
    logger.error({ err: error }, '[GET /assessment/sessions/:id] Failed');
    res.status(500).send({ message: 'Failed to load assessment session' });
  }
});

// ── POST /assessment/sessions/:id/answer ──
router.post('/assessment/sessions/:id/answer', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await answerAssessmentQuestion({ userId: req.user!.id, sessionId: req.params.id, ...req.body });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/answer] Failed');
    res.status(500).send({ message: 'Failed to submit answer' });
  }
});

// ── POST /assessment/sessions/:id/navigate ──
router.post('/assessment/sessions/:id/navigate', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await navigateAssessmentSession({ userId: req.user!.id, sessionId: req.params.id, ...req.body });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/navigate] Failed');
    res.status(500).send({ message: 'Navigation failed' });
  }
});

// ── POST /assessment/sessions/:id/hint ──
router.post('/assessment/sessions/:id/hint', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const hint = await requestAssessmentHint({ userId: req.user!.id, sessionId: req.params.id, ...req.body });
    res.status(200).send(hint);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/hint] Failed');
    res.status(500).send({ message: 'Failed to get hint' });
  }
});

// ── POST /assessment/sessions/:id/pause ──
router.post('/assessment/sessions/:id/pause', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await pauseAssessmentSession({ userId: req.user!.id, sessionId: req.params.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/pause] Failed');
    res.status(500).send({ message: 'Failed to pause session' });
  }
});

// ── POST /assessment/sessions/:id/resume ──
router.post('/assessment/sessions/:id/resume', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await resumeAssessmentSession({ userId: req.user!.id, sessionId: req.params.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/resume] Failed');
    res.status(500).send({ message: 'Failed to resume session' });
  }
});

// ── POST /assessment/sessions/:id/finish ──
router.post('/assessment/sessions/:id/finish', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await finishAssessmentSession({ userId: req.user!.id, sessionId: req.params.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /assessment/sessions/:id/finish] Failed');
    res.status(500).send({ message: 'Failed to finish session' });
  }
});

// ── GET /assessment/sessions/:id/results ──
router.get('/assessment/sessions/:id/results', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const results = await getAssessmentResults({ userId: req.user!.id, sessionId: req.params.id });
    if (!results) return res.status(404).send({ message: 'Results not found' });
    res.status(200).send(results);
  } catch (error) {
    logger.error({ err: error }, '[GET /assessment/sessions/:id/results] Failed');
    res.status(500).send({ message: 'Failed to load results' });
  }
});

export default router;
