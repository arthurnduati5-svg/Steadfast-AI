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
// NOTE (Practice Pad P0): the legacy heuristic helper
// backend/src/services/practicePadService.ts is preserved but is NO LONGER
// the authority for this route. It survives only as a low-confidence
// supplementary signal inside practicePadDeterministicChecker.
// Canonical path: practicePadCheckRuntime (attempt-bound, versioned,
// idempotent, deterministic-first, evidence-proposing only).
import {
  authorizePracticePadIdentity,
  checkPracticePadStepCanonical,
} from '../../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService } from '../../services/practiceAttemptService';
import { practicePadWorkVersionStore } from '../../services/practicePadRuntime/practicePadWorkVersionStore';
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
import { requireVerifiedSchoolContext } from '../../middleware/schoolContextGuardMiddleware';

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

// ── POST /practice-pad/check-step (canonical P0 runtime) ──
// Protected learner capability: authenticated identity + VERIFIED school
// context + learner ownership of the referenced attempt. Client-supplied
// prompt/topic/work is context only and cannot override server-owned
// attempt/problem truth.
router.post('/practice-pad/check-step', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: AuthedRequest, res) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const schoolId =
      (typeof req.user?.schoolId === 'string' && req.user.schoolId) ||
      (typeof (req as any).schoolId === 'string' && (req as any).schoolId) ||
      null;
    const studentId = typeof req.user?.id === 'string' ? req.user.id : null;

    const auth = authorizePracticePadIdentity({
      schoolId,
      studentId,
      verifiedSchool: !!schoolId,
    });
    if (!auth.ok) {
      return res.status(403).send({
        message: auth.message,
        failureCategory: auth.failureCategory,
        currentFeedbackEligible: false,
      });
    }

    const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
    let attemptId = asString(body.attemptId).trim();

    // Creation only through the single canonical PracticeAttempt owner.
    // Arbitrary prompt/workText alone is NOT sufficient authority: creation
    // requires an explicit prompt/problem reference. Bare workText is
    // context only and can never fabricate a problem.
    if (!attemptId) {
      const promptSummary = asString(body.promptSummary || body.prompt).trim();
      const problemRef = asString(body.problemId || body.sourceQuestionId).trim();
      if (!promptSummary && !problemRef) {
        return res.status(400).send({
          message: 'attemptId is required, or promptSummary/prompt to create an attempt through the canonical owner.',
          failureCategory: 'attempt_not_found',
          code: 'attempt_binding_required',
          currentFeedbackEligible: false,
        });
      }
      const created = await practiceAttemptService.createPracticeAttempt(
        { schoolId: auth.identity.schoolId, studentId: auth.identity.studentId },
        {
          sessionId: asString(body.sessionId) || null,
          kind: 'open_response',
          subject: asString(body.subject) || null,
          topic: asString(body.topic) || null,
          promptSummary: (promptSummary || `Practice problem ${problemRef}`).slice(0, 1200),
          sourceQuestionId: asString(body.problemId || body.sourceQuestionId) || null,
          outcome: 'not_evaluated',
        },
        // PP-01 R1/R2: unevaluated creation is bind-only, and a
        // non-durable attempt must stop before ANY protected downstream
        // learning effect (the 503 gate below then fails closed).
        { requireDurableBeforeEffects: true },
      );
      // PP-01 R3: a non-durably-persisted attempt must never lead to a
      // successful check. Fail closed (PERSISTENCE_FAILED /
      // database_unavailable, no feedback eligibility) instead of
      // succeeding from process memory.
      if (!created.persisted) {
        return res.status(503).send({
          message: 'Practice attempt could not be durably persisted; check cannot succeed.',
          status: 'FAILED_CLOSED',
          failureCategory: 'database_unavailable',
          code: 'PERSISTENCE_FAILED',
          currentFeedbackEligible: false,
        });
      }
      attemptId = created.attempt.attemptId;
      try {
        await practicePadWorkVersionStore.seedVersion(attemptId, 1);
      } catch {
        return res.status(503).send({
          message: 'Practice work version could not be durably persisted; check cannot succeed.',
          status: 'FAILED_CLOSED',
          failureCategory: 'database_unavailable',
          code: 'PERSISTENCE_FAILED',
          currentFeedbackEligible: false,
        });
      }
    }

    let basedOnVersion: number;
    if (typeof body.basedOnVersion === 'number') {
      basedOnVersion = body.basedOnVersion;
    } else {
      try {
        basedOnVersion = await practicePadWorkVersionStore.getCurrentVersion(attemptId);
      } catch {
        return res.status(503).send({
          message: 'Practice work version store unavailable; check cannot succeed.',
          status: 'FAILED_CLOSED',
          failureCategory: 'database_unavailable',
          currentFeedbackEligible: false,
        });
      }
    }
    // PP-03: incoming workText / selected work is a submission to the
    // canonical PracticeDocument owner BEFORE checking. The canonical
    // runtime resolves/creates the document, persists or matches the
    // exact server-owned revision for basedOnVersion, and evaluates only
    // that revision. This route never bypasses the document owner, so
    // existing clients keep working while backend authority improves.
    const outcome = await checkPracticePadStepCanonical(auth.identity, {
      attemptId,
      basedOnVersion,
      idempotencyKey: asString(body.idempotencyKey) || `route:${attemptId}:${Date.now()}`,
      workText: asString(body.workText),
      selectedStep: asString(body.selectedStep) || null,
      prompt: asString(body.prompt) || null,
      topic: asString(body.topic) || null,
      subject: asString(body.subject) || null,
    });

    if (!outcome.ok) {
      const statusByCategory: Record<string, number> = {
        attempt_not_found: 404,
        wrong_learner: 403,
        wrong_school: 403,
        missing_school_identity: 403,
        problem_missing: 422,
        stale_work_version: 409,
        duplicate_conflict: 409,
        unsupported_representation: 422,
        checker_unavailable: 503,
        database_unavailable: 503,
        evidence_commit_failure: 502,
        invalid_request: 400,
      };
      return res.status(statusByCategory[outcome.failureCategory] || 400).send({
        message: outcome.message,
        status: outcome.status,
        failureCategory: outcome.failureCategory,
        currentFeedbackEligible: false,
      });
    }

    // Learner-safe projection: the canonical result contains no protected
    // answer material by construction (expected answers never leave the
    // problem authority).
    return res.status(200).send(outcome.result);
  } catch (error) {
    logger.error({ err: error }, '[POST /practice-pad/check-step] Failed');
    res.status(500).send({ message: 'Step check failed', currentFeedbackEligible: false });
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
