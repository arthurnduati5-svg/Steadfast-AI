/**
 * AI Route Module — Revision
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 5841-7210, 7908-8001.
 * Domain: revision
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import {
  getRevisionOverview,
  saveRevisionItem,
  getRevisionItemDetails,
  createRevisionCollection,
  updateRevisionCollection,
  getRevisionCollectionDetails,
  deleteRevisionCollection,
} from '../../services/revisionService';
import {
  buildExtendedRevisionOverview,
  getRevisionQueue,
  getRevisionProgressOverview,
  updateRevisionItem,
  updateRevisionItemsBatch,
  deleteRevisionItem,
  runRevisionItemAction,
  recordRevisionReviewEvent,
  getRevisionGroupingSuggestions,
  applyRevisionGroupingSuggestion,
  generateRevisionAudioRecap,
  startRevisionMode,
  startGuidedRevisionSession,
  continueGuidedRevisionSession,
} from '../../services/revisionLearningService';
import { getRevisionGraphAnalytics } from '../../services/revisionGraphService';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';

const router = Router();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ── GET /revision ──
router.get('/revision', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const baseOverview = await getRevisionOverview({ userId: req.user!.id });
    const overview = await buildExtendedRevisionOverview(req.user!.id, baseOverview);
    res.status(200).send(overview);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision] Failed');
    res.status(500).send({ message: 'Failed to load revision overview' });
  }
});

// ── POST /revision ──
router.post('/revision', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const item = await saveRevisionItem({ ...req.body, userId: req.user!.id });
    res.status(200).send(item);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision] Failed');
    res.status(500).send({ message: 'Failed to save revision item' });
  }
});

// ── GET /revision/collections ──
router.get('/revision/collections', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collections = await prisma.revisionCollection.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.status(200).send(collections);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/collections] Failed');
    res.status(500).send({ message: 'Failed to load collections' });
  }
});

// ── POST /revision/collections ──
router.post('/revision/collections', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await createRevisionCollection({ ...req.body, userId: req.user!.id });
    res.status(200).send(collection);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/collections] Failed');
    res.status(500).send({ message: 'Failed to create collection' });
  }
});

// ── GET /revision/collections/:id ──
router.get('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const details = await getRevisionCollectionDetails({ userId: req.user!.id, collectionId: req.params.id });
    if (!details) return res.status(404).send({ message: 'Collection not found' });
    res.status(200).send(details);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/collections/:id] Failed');
    res.status(500).send({ message: 'Failed to load collection' });
  }
});

// ── PATCH /revision/collections/:id ──
router.patch('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await updateRevisionCollection({ userId: req.user!.id, collectionId: req.params.id, patch: req.body });
    res.status(200).send(collection);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /revision/collections/:id] Failed');
    res.status(500).send({ message: 'Failed to update collection' });
  }
});

// ── DELETE /revision/collections/:id ──
router.delete('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await deleteRevisionCollection({ userId: req.user!.id, collectionId: req.params.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[DELETE /revision/collections/:id] Failed');
    res.status(500).send({ message: 'Failed to delete collection' });
  }
});

// ── POST /revision/collections/:id/cover/generate ──
router.post('/revision/collections/:id/cover/generate', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await getRevisionCollectionDetails({ userId: req.user!.id, collectionId: req.params.id });
    if (!collection) return res.status(404).send({ message: 'Collection not found' });
    res.status(200).send({ message: 'Cover generation queued', collectionId: req.params.id });
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/collections/:id/cover/generate] Failed');
    res.status(500).send({ message: 'Cover generation failed' });
  }
});

// ── POST /revision/collections/:id/chapter-summaries ──
router.post('/revision/collections/:id/chapter-summaries', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await getRevisionCollectionDetails({ userId: req.user!.id, collectionId: req.params.id });
    if (!collection) return res.status(404).send({ message: 'Collection not found' });
    res.status(200).send({ message: 'Chapter summary generation queued', collectionId: req.params.id });
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/collections/:id/chapter-summaries] Failed');
    res.status(500).send({ message: 'Chapter summary generation failed' });
  }
});

// ── POST /revision/collections/:id/flashcards ──
router.post('/revision/collections/:id/flashcards', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await getRevisionCollectionDetails({ userId: req.user!.id, collectionId: req.params.id });
    if (!collection) return res.status(404).send({ message: 'Collection not found' });
    res.status(200).send({ message: 'Flashcard generation queued', collectionId: req.params.id });
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/collections/:id/flashcards] Failed');
    res.status(500).send({ message: 'Flashcard generation failed' });
  }
});

// ── POST /revision/collections/:id/visuals/generate ──
router.post('/revision/collections/:id/visuals/generate', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await getRevisionCollectionDetails({ userId: req.user!.id, collectionId: req.params.id });
    if (!collection) return res.status(404).send({ message: 'Collection not found' });
    res.status(200).send({ message: 'Visual generation queued', collectionId: req.params.id });
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/collections/:id/visuals/generate] Failed');
    res.status(500).send({ message: 'Visual generation failed' });
  }
});

// ── PATCH /revision/items/batch ──
router.patch('/revision/items/batch', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await updateRevisionItemsBatch({ userId: req.user!.id, updates: req.body });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /revision/items/batch] Failed');
    res.status(500).send({ message: 'Batch update failed' });
  }
});

// ── PATCH /revision/:id ──
// R5: Mastery/review truth is server-owned. Caller may edit content/presentation only.
router.patch('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const patch = { ...req.body };
    // Strip server-owned mastery/review fields — learner must not bypass scheduling truth
    delete patch.mastery;
    delete patch.reviewStatus;
    delete patch.successCount;
    delete patch.struggleCount;
    delete patch.confidenceTrend;
    delete patch.nextReviewAt;
    delete patch.recentOutcome;
    delete patch.practiceCount;
    delete patch.lastPracticedAt;
    delete patch.lastReviewedAt;
    delete patch.reviewCount;

    const item = await updateRevisionItem({ userId: req.user!.id, itemId: req.params.id, patch });
    res.status(200).send(item);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /revision/:id] Failed');
    res.status(500).send({ message: 'Failed to update revision item' });
  }
});

// ── DELETE /revision/:id ──
router.delete('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await deleteRevisionItem({ userId: req.user!.id, itemId: req.params.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[DELETE /revision/:id] Failed');
    res.status(500).send({ message: 'Failed to delete revision item' });
  }
});

// ── POST /revision/:id/action ──
router.post('/revision/:id/action', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await runRevisionItemAction({ userId: req.user!.id, itemId: req.params.id, actionType: req.body.actionType });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/:id/action] Failed');
    res.status(500).send({ message: 'Action failed' });
  }
});

// ── GET /revision/queue ──
router.get('/revision/queue', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const queue = await getRevisionQueue(req.user!.id);
    res.status(200).send(queue);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/queue] Failed');
    res.status(500).send({ message: 'Failed to load queue' });
  }
});

// ── GET /revision/progress ──
router.get('/revision/progress', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const progress = await getRevisionProgressOverview(req.user!.id);
    res.status(200).send(progress);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/progress] Failed');
    res.status(500).send({ message: 'Failed to load progress' });
  }
});

// ── GET /revision/graph/analytics ──
router.get('/revision/graph/analytics', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const analytics = await getRevisionGraphAnalytics({ userId: req.user!.id });
    res.status(200).send(analytics);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/graph/analytics] Failed');
    res.status(500).send({ message: 'Failed to load analytics' });
  }
});

// ── POST /revision/:id/review-event ──
// R5: External learner route must NOT supply trusted scheduling/mastery outcomes.
// outcome is ALWAYS null for external interaction events — server owns scheduling truth.
router.post('/revision/:id/review-event', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const sanitizedBody = { ...req.body };
    // Strip ALL server-owned fields — caller must never control mastery truth
    delete sanitizedBody.correct;
    delete sanitizedBody.completed;
    delete sanitizedBody.mastery;
    delete sanitizedBody.confidenceTrend;
    delete sanitizedBody.successCount;
    delete sanitizedBody.struggleCount;
    delete sanitizedBody.nextReviewAt;
    delete sanitizedBody.recentOutcome;
    delete sanitizedBody.reviewStatus;
    // Force outcome to null for external learner route — no trusted correctness claim
    sanitizedBody.outcome = null;

    const event = await recordRevisionReviewEvent({
      ...sanitizedBody,
      userId: req.user!.id,
      itemId: req.params.id,
    });
    res.status(200).send(event);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/:id/review-event] Failed');
    res.status(500).send({ message: 'Failed to record review event' });
  }
});

// ── GET /revision/group-suggestions ──
router.get('/revision/group-suggestions', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const suggestions = await getRevisionGroupingSuggestions(req.user!.id);
    res.status(200).send(suggestions);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/group-suggestions] Failed');
    res.status(500).send({ message: 'Failed to load suggestions' });
  }
});

// ── POST /revision/group-suggestions/:id/apply ──
router.post('/revision/group-suggestions/:id/apply', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await applyRevisionGroupingSuggestion(req.user!.id, req.params.id);
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/group-suggestions/:id/apply] Failed');
    res.status(500).send({ message: 'Failed to apply suggestion' });
  }
});

// ── POST /revision/audio-recap ──
router.post('/revision/audio-recap', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await generateRevisionAudioRecap({ ...req.body, userId: req.user!.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/audio-recap] Failed');
    res.status(500).send({ message: 'Failed to generate audio recap' });
  }
});

// ── POST /revision-mode/start ──
router.post('/revision-mode/start', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await startRevisionMode({ ...req.body, userId: req.user!.id });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision-mode/start] Failed');
    res.status(500).send({ message: 'Failed to start revision mode' });
  }
});

// ── POST /revision/guided-session/start ──
// R5 Final: allowlisted fields only — client must not provide schoolId, evidenceId, etc.
router.post('/revision/guided-session/start', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body: any = req.body || {};
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : undefined;
    const collectionId = typeof body.collectionId === 'string' ? body.collectionId.trim() : undefined;
    const sourceType = body.sourceType === 'collection' || body.sourceType === 'queue' ? body.sourceType : 'item';
    const examFocus = Boolean(body.examFocus);
    const session = await startGuidedRevisionSession({ userId: req.user!.id, itemId, collectionId, sourceType, examFocus });
    res.status(200).send(session);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/guided-session/start] Failed');
    res.status(500).send({ message: 'Failed to start guided session' });
  }
});

// ── POST /revision/guided-session/:sessionId/respond ──
// R5 Final: verified school context + allowlisted fields; trusted evaluation never from client
router.post('/revision/guided-session/:sessionId/respond', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body: any = req.body || {};
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
    const stage = typeof body.stage === 'string' ? body.stage.trim() : '';
    const responseText = typeof body.responseText === 'string' ? body.responseText : typeof body.response === 'string' ? body.response : '';
    const supportAction = typeof body.supportAction === 'string' ? body.supportAction.trim() : undefined;
    const verifiedSchoolId = (req as any).schoolId || (req.user as any)?.schoolId || '';
    const result = await continueGuidedRevisionSession({
      userId: req.user!.id,
      schoolId: verifiedSchoolId,
      sessionId: req.params.sessionId,
      itemId,
      stage: stage as any,
      responseText,
      supportAction: supportAction as any,
    });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /revision/guided-session/:sessionId/respond] Failed');
    res.status(500).send({ message: 'Failed to continue session' });
  }
});

// ── GET /revision/:id ──
router.get('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const item = await getRevisionItemDetails({ userId: req.user!.id, itemId: req.params.id });
    if (!item) return res.status(404).send({ message: 'Revision item not found' });
    res.status(200).send(item);
  } catch (error) {
    logger.error({ err: error }, '[GET /revision/:id] Failed');
    res.status(500).send({ message: 'Failed to load revision item' });
  }
});

export default router;
