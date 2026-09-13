import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { checkRevisionModeAccess } from '../services/revisionModeAccessPolicy';
import { rejectForbiddenRevisionFields } from '../services/revisionModePrivacyGuard';
import {
  startRevisionSession,
  getRevisionSessionById,
  findActiveRevisionSession,
  cancelExistingActiveRevisionSessions,
  updateRevisionSessionStatus,
  updateRevisionSessionStage,
  updateRevisionSessionCounts,
  updateRevisionSessionCurrentItemIndex,
  serializeRevisionSession,
} from '../services/revisionModeSessionService';
import { loadRevisionState, buildRevisionState } from '../services/revisionModeStateService';
import {
  createRevisionQueue,
  getRevisionQueueForSession,
  getActiveRevisionQueue,
  updateRevisionQueue,
  serializeRevisionQueue,
} from '../services/revisionModeQueueService';
import {
  normalizeSafeTargetRefs,
  detectContentGap,
  detectDeenUncertainty,
} from '../services/revisionModeTargetService';
import {
  createRevisionItemState,
  getCurrentRevisionItem,
  getRevisionItemByKey,
  getRevisionItemsForSession,
  markItemActive,
  markItemAttempted,
  markItemFeedbackReady,
  markItemRetryRequested,
  completeItem,
  skipItem,
  pinItem,
  updateRevisionItemState,
  serializeRevisionItemState,
} from '../services/revisionModeItemStateService';
import { recordRevisionAttempt, deriveWeakRecallSignal, deriveStrongRecallSignal, deriveMistakeSignal, deriveStuckChange, deriveRecoveryChange } from '../services/revisionModeAttemptService';
import { classifyRecall } from '../services/revisionModeRecallClassificationService';
import { calculateNextReview } from '../services/revisionModeSchedulingService';
import { selectNextItem } from '../services/revisionModeRecommendationService';
import { getNextRevisionAction } from '../services/revisionModeTutorActionBridgeService';
import { recommendNextMode } from '../services/revisionModeModeBridgeService';
import { createRevisionSummary, getRevisionSummaryForSession, serializeRevisionSummary } from '../services/revisionModeSummaryService';
import {
  writeRevisionSessionStarted,
  writeRevisionSessionExited,
  writeRevisionStageChanged,
  writeRevisionHintGiven,
  writeRevisionSupportActionSelected,
  writeRevisionReflectionDetected,
  writeRevisionModeSummaryCreated,
} from '../services/revisionModeSignalBridgeService';
import { buildStudentRevisionStateResponse, buildEmptyActiveRevisionResponse, buildRevisionSummaryResponse } from '../services/revisionModeResponseBuilder';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import {
  RevisionModeStartRequestSchema,
  RevisionModeQueueCreateRequestSchema,
  RevisionModeItemAddRequestSchema,
  RevisionModeItemAdvanceRequestSchema,
  RevisionModeAttemptRequestSchema,
  RevisionModeHintRequestSchema,
  RevisionModeReflectRequestSchema,
  RevisionModeScheduleRequestSchema,
  RevisionModeBridgeRequestSchema,
  RevisionModeSubmitRequestSchema,
  RevisionModeExitRequestSchema,
} from '../lib/revisionModeValidation';

const router = Router();

function buildMeta(req: Request) {
  return {
    requestId: (req as any).requestId || 'unknown',
    timestamp: new Date().toISOString(),
    route: req.originalUrl || req.url,
    method: req.method,
    contractVersion: '1.0.0',
  };
}

function getStudentId(req: Request): string | null {
  const identity = (req as any).verifiedSchoolIdentity;
  if (!identity) return null;
  return identity.externalStudentId || identity.externalUserId || null;
}

function getLearnerRole(req: Request): 'student' | 'teacher' | 'admin' | 'system' {
  const identity = (req as any).verifiedSchoolIdentity;
  if (!identity) return 'student';
  if (identity.role === 'teacher' || identity.role === 'admin' || identity.role === 'system') {
    return identity.role;
  }
  return 'student';
}

router.post('/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const schoolId = identity.schoolId;

    if (parsed.data.replaceExisting) {
      await cancelExistingActiveRevisionSessions(schoolId, studentId);
    } else {
      const existing = await findActiveRevisionSession(schoolId, studentId);
      if (existing) {
        return res.status(409).json(apiErrorFromCategory('conflict', 'Active revision mode session already exists. Use replaceExisting=true to replace.', meta));
      }
    }

    if (!parsed.data.targetRef && !parsed.data.targetRefs) {
      return res.status(400).json(apiErrorFromCategory('validation_error', 'targetRef or targetRefs is required', meta));
    }

    const { default: modeSessionService } = await import('./learningModeRoutes');
    const modeSessionId = `mode_${Date.now()}_${studentId}`;

    const session = await startRevisionSession(schoolId, studentId, modeSessionId, parsed.data);

    await writeRevisionSessionStarted(schoolId, studentId, modeSessionId);

    const queue = await createRevisionQueue({
      schoolId,
      studentId,
      revisionSessionId: session.id,
      modeSessionId,
      queueType: parsed.data.queueType || 'mixed_queue',
      sourceType: parsed.data.sourceType || 'manual',
      sourceRefs: parsed.data.targetRefs || (parsed.data.targetRef ? [parsed.data.targetRef] : []),
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
    });

    const targetRefs = parsed.data.targetRefs || (parsed.data.targetRef ? [parsed.data.targetRef] : []);
    for (let i = 0; i < targetRefs.length; i++) {
      await createRevisionItemState({
        schoolId,
        studentId,
        revisionSessionId: session.id,
        revisionQueueId: queue.id,
        modeSessionId,
        itemKey: `item_${i}`,
        itemIndex: i,
        target: {
          targetType: parsed.data.targetRef ? 'concept' : 'mixed_review_item',
          targetRef: targetRefs[i],
          approvedContentRef: parsed.data.approvedContentRef,
          topicId: parsed.data.topicId,
          skillId: parsed.data.skillId,
        },
      });
    }

    await updateRevisionSessionCounts(session.id, {
      itemCount: targetRefs.length,
    });
    await updateRevisionQueue(queue.id, { itemCount: targetRefs.length });
    await updateRevisionSessionStage(session.id, 'ready_to_start');

    const updatedSession = await getRevisionSessionById(session.id);
    return res.json(buildStudentRevisionStateResponse(
      updatedSession!,
      queue,
      null,
      [],
    ));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start revision mode', meta));
  }
});

router.get('/active', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const session = await findActiveRevisionSession(identity.schoolId, studentId);
    if (!session) {
      return res.json(buildEmptyActiveRevisionResponse());
    }

    const state = await buildRevisionState(session);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get active revision', meta));
  }
});

router.get('/:revisionSessionId/state', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
    }

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId,
      session.studentId,
    );
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    const state = await buildRevisionState(session);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get revision state', meta));
  }
});

router.post('/:revisionSessionId/queue/create', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
    }

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeQueueCreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req)!;
    const queue = await createRevisionQueue({
      schoolId: identity.schoolId,
      studentId,
      revisionSessionId,
      modeSessionId: session.modeSessionId,
      queueType: parsed.data.queueType,
      sourceType: parsed.data.sourceType,
      sourceRefs: parsed.data.targetRefs,
      subjectId: session.subjectId || undefined,
      topicId: session.topicId || undefined,
      skillId: session.skillId || undefined,
    });

    return res.json(createApiSuccess({ queue: serializeRevisionQueue(queue) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to create queue', meta));
  }
});

router.get('/:revisionSessionId/queue', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
    }

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    const queue = await getRevisionQueueForSession(revisionSessionId);
    return res.json(createApiSuccess({
      queue: queue ? serializeRevisionQueue(queue) : null,
    }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get queue', meta));
  }
});

router.post('/:revisionSessionId/item/add', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
    }

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeItemAddRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const target = normalizeSafeTargetRefs(parsed.data as any);
    const studentId = getStudentId(req)!;

    const existingItems = await getRevisionItemsForSession(revisionSessionId);
    const itemIndex = existingItems.length;
    const itemKey = parsed.data.itemKey || `item_${itemIndex}`;

    const existingItem = await getRevisionItemByKey(revisionSessionId, itemKey);
    if (existingItem) {
      return res.status(409).json(apiErrorFromCategory('conflict', `Item with key ${itemKey} already exists`, meta));
    }

    const queue = await getRevisionQueueForSession(revisionSessionId);

    const item = await createRevisionItemState({
      schoolId: identity.schoolId,
      studentId,
      revisionSessionId,
      revisionQueueId: queue?.id,
      modeSessionId: session.modeSessionId,
      itemKey,
      itemIndex,
      target,
    });

    await updateRevisionSessionCounts(session.id, { itemCount: existingItems.length + 1 });

    return res.json(createApiSuccess({ item: serializeRevisionItemState(item) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to add item', meta));
  }
});

async function handleItemAction(req: Request, res: Response, action: string) {
  const identity = (req as any).verifiedSchoolIdentity!;
  const meta = buildMeta(req);
  const { revisionSessionId } = req.params;

  const session = await getRevisionSessionById(revisionSessionId);
  if (!session) {
    return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
  }

  const access = checkRevisionModeAccess(
    { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
    session.schoolId, session.studentId,
  );
  if (!access.allowed) {
    return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
  }

  return null;
}

router.post('/:revisionSessionId/item/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(400).json(apiErrorFromCategory('validation_error', 'No item at current index', meta));
    }

    await markItemActive(currentItem.id);
    await updateRevisionSessionStage(session.id, 'reviewing_item');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start item', meta));
  }
});

router.post('/:revisionSessionId/item/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const currentItem = await getRevisionItemByKey(revisionSessionId, parsed.data.itemKey);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Item not found', meta));
    }

    const studentId = getStudentId(req)!;
    const newAttemptNumber = currentItem.attemptNumber + 1;

    const attempt = await recordRevisionAttempt({
      schoolId: identity.schoolId,
      studentId,
      revisionSessionId,
      revisionQueueId: currentItem.revisionQueueId || undefined,
      revisionItemStateId: currentItem.id,
      modeSessionId: session.modeSessionId,
      itemKey: currentItem.itemKey,
      itemIndex: currentItem.itemIndex,
      targetRef: currentItem.targetRef || undefined,
      stage: 'recalling',
      attemptNumber: newAttemptNumber,
      recallQuality: parsed.data.recallQuality,
      retrievalSignal: parsed.data.retrievalSignal,
      mistakeCategory: parsed.data.mistakeCategory,
      explanationQuality: parsed.data.explanationQuality,
      usedHint: parsed.data.usedHint || false,
      hintLevel: parsed.data.hintLevel,
      safeEvidenceRefs: [],
    });

    const isWeak = deriveWeakRecallSignal(parsed.data.recallQuality);
    const isStrong = deriveStrongRecallSignal(parsed.data.recallQuality);
    const hasMistake = deriveMistakeSignal(parsed.data.mistakeCategory);
    const isStuck = deriveStuckChange(parsed.data.usedHint || false, parsed.data.recallQuality);
    const isRecovery = deriveRecoveryChange(parsed.data.usedHint || false, parsed.data.recallQuality);

    await updateRevisionItemState(currentItem.id, {
      attemptNumber: newAttemptNumber,
      recallQuality: parsed.data.recallQuality,
      retrievalSignal: parsed.data.retrievalSignal,
      mistakeCategory: parsed.data.mistakeCategory,
      lastReviewedAt: new Date(),
    });

    const counts: Record<string, number> = { attemptCount: session.attemptCount + 1 };
    if (isWeak) counts.weakRecallCount = session.weakRecallCount + 1;
    if (isStrong) counts.strongRecallCount = session.strongRecallCount + 1;
    if (hasMistake) counts.mistakeCount = session.mistakeCount + 1;
    if (isStuck) counts.stuckCount = session.stuckCount + 1;
    if (isRecovery) counts.recoveryCount = session.recoveryCount + 1;
    await updateRevisionSessionCounts(session.id, counts as any);

    await markItemAttempted(currentItem.id);
    await updateRevisionSessionStage(session.id, 'recall_submitted');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record attempt', meta));
  }
});

router.post('/:revisionSessionId/item/retry', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No current item', meta));
    }

    await markItemRetryRequested(currentItem.id);
    await updateRevisionSessionStage(session.id, 'retrying_item');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to retry item', meta));
  }
});

router.post('/:revisionSessionId/item/skip', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No current item', meta));
    }

    await skipItem(currentItem.id);
    await updateRevisionSessionCounts(session.id, { skippedItemCount: session.skippedItemCount + 1 });

    const items = await getRevisionItemsForSession(revisionSessionId);
    const nextIndex = session.currentItemIndex + 1;
    if (nextIndex < items.length) {
      await updateRevisionSessionCurrentItemIndex(session.id, nextIndex);
      await updateRevisionSessionStage(session.id, 'reviewing_item');
    } else {
      await updateRevisionSessionStage(session.id, 'summary_ready');
    }

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to skip item', meta));
  }
});

router.post('/:revisionSessionId/item/pin', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No current item', meta));
    }

    await pinItem(currentItem.id);
    await updateRevisionSessionCounts(session.id, { pinnedItemCount: session.pinnedItemCount + 1 });

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to pin item', meta));
  }
});

router.post('/:revisionSessionId/item/complete', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No current item', meta));
    }

    const classificationResult = classifyRecall({
      recallQuality: currentItem.recallQuality || 'not_attempted',
      retrievalSignal: currentItem.retrievalSignal || undefined,
      mistakeCategory: currentItem.mistakeCategory || undefined,
      attemptNumber: currentItem.attemptNumber,
      usedHint: false,
      approvedContextAvailable: true,
    });

    const scheduleResult = calculateNextReview({
      recallStrengthBucket: classificationResult.recallStrengthBucket,
      readinessSignal: classificationResult.readinessSignal,
      attemptCount: currentItem.attemptNumber,
      usedHint: false,
      priorityBucket: currentItem.priorityBucket || undefined,
    });

    await completeItem(currentItem.id);

    if (scheduleResult.nextReviewAt) {
      await updateRevisionItemState(currentItem.id, {
        nextReviewAt: scheduleResult.nextReviewAt,
        reviewIntervalBucket: scheduleResult.nextReviewIntervalBucket,
        masterySignal: classificationResult.masterySignal,
        readinessSignal: classificationResult.readinessSignal,
        supportNeed: classificationResult.supportNeed,
        safeReasonCodesJson: classificationResult.safeReasonCodes,
      });
    }

    await updateRevisionSessionCounts(session.id, {
      completedItemCount: session.completedItemCount + 1,
    });

    const items = await getRevisionItemsForSession(revisionSessionId);
    const nextIndex = session.currentItemIndex + 1;
    if (nextIndex < items.length) {
      await updateRevisionSessionCurrentItemIndex(session.id, nextIndex);
      await updateRevisionSessionStage(session.id, 'reviewing_item');
    } else {
      await updateRevisionSessionStage(session.id, 'summary_ready');
    }

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to complete item', meta));
  }
});

router.post('/:revisionSessionId/item/next', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const items = await getRevisionItemsForSession(revisionSessionId);
    const nextIndex = session.currentItemIndex + 1;
    if (nextIndex >= items.length) {
      await updateRevisionSessionStage(session.id, 'summary_ready');
      const updated = await getRevisionSessionById(revisionSessionId);
      return res.json(await buildRevisionState(updated!));
    }

    await updateRevisionSessionCurrentItemIndex(session.id, nextIndex);
    await updateRevisionSessionStage(session.id, 'reviewing_item');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to advance item', meta));
  }
});

router.post('/:revisionSessionId/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeHintRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const currentItem = await getRevisionItemByKey(revisionSessionId, parsed.data.itemKey);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Item not found', meta));
    }

    await updateRevisionSessionCounts(session.id, { hintCount: session.hintCount + 1 });
    await writeRevisionHintGiven(identity.schoolId, getStudentId(req)!, session.modeSessionId, 'attention_hint');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to request hint', meta));
  }
});

router.post('/:revisionSessionId/reflect', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeReflectRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    await updateRevisionSessionCounts(session.id, { reflectionCount: session.reflectionCount + 1 });
    await writeRevisionReflectionDetected(identity.schoolId, getStudentId(req)!, session.modeSessionId);

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to reflect', meta));
  }
});

router.post('/:revisionSessionId/schedule', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const currentItem = await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);
    if (!currentItem) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No current item', meta));
    }

    const scheduleResult = calculateNextReview({
      recallStrengthBucket: currentItem.recallQuality ? 'stable' : 'unknown',
      readinessSignal: currentItem.readinessSignal || 'unknown',
      attemptCount: currentItem.attemptNumber,
      usedHint: !!currentItem.hintLevel,
      priorityBucket: currentItem.priorityBucket || undefined,
    });

    await updateRevisionItemState(currentItem.id, {
      nextReviewAt: scheduleResult.nextReviewAt || undefined,
      reviewIntervalBucket: scheduleResult.nextReviewIntervalBucket,
      safeReasonCodesJson: scheduleResult.scheduleReasonCodes,
    });

    await updateRevisionSessionStage(session.id, 'scheduling_next_review');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    const state = await buildRevisionState(updatedSession!);
    return res.json(state);
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to schedule', meta));
  }
});

router.post('/:revisionSessionId/bridge', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeBridgeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const currentItem = parsed.data.itemKey
      ? await getRevisionItemByKey(revisionSessionId, parsed.data.itemKey)
      : await getCurrentRevisionItem(revisionSessionId, session.currentItemIndex);

    const bridgeResult = recommendNextMode({
      recallQuality: currentItem?.recallQuality || undefined,
      retrievalSignal: currentItem?.retrievalSignal || undefined,
      mistakeCategory: currentItem?.mistakeCategory || undefined,
      supportNeed: currentItem?.supportNeed || undefined,
      masterySignal: currentItem?.masterySignal || undefined,
      readinessSignal: currentItem?.readinessSignal || undefined,
      attemptCount: session.attemptCount,
      weakRecallCount: session.weakRecallCount,
      completedItemCount: session.completedItemCount,
      itemCount: session.itemCount,
      approvedContextAvailable: true,
    });

    return res.json(createApiSuccess({ bridgeRecommendation: bridgeResult }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to bridge', meta));
  }
});

router.post('/:revisionSessionId/pause', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    await updateRevisionSessionStatus(session.id, 'paused');
    await writeRevisionStageChanged(identity.schoolId, getStudentId(req)!, session.modeSessionId, 'paused');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    return res.json(createApiSuccess({ session: serializeRevisionSession(updatedSession!) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to pause', meta));
  }
});

router.post('/:revisionSessionId/resume', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    await updateRevisionSessionStatus(session.id, 'active');
    await writeRevisionStageChanged(identity.schoolId, getStudentId(req)!, session.modeSessionId, 'active');

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    return res.json(createApiSuccess({ session: serializeRevisionSession(updatedSession!) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to resume', meta));
  }
});

router.post('/:revisionSessionId/submit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeSubmitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    await updateRevisionSessionStatus(session.id, 'submitted');
    await updateRevisionSessionStage(session.id, 'summary_ready');

    const summary = await createRevisionSummary({
      schoolId: identity.schoolId,
      studentId: getStudentId(req)!,
      revisionSessionId,
      revisionQueueId: (await getRevisionQueueForSession(revisionSessionId))?.id || undefined,
      modeSessionId: session.modeSessionId,
      finalStage: 'summary_ready',
      exitReason: parsed.data.exitReason || 'student_completed',
      itemCount: session.itemCount,
      attemptCount: session.attemptCount,
      weakRecallCount: session.weakRecallCount,
      strongRecallCount: session.strongRecallCount,
      mistakeCount: session.mistakeCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      reflectionCount: session.reflectionCount,
      completedItemCount: session.completedItemCount,
      skippedItemCount: session.skippedItemCount,
      pinnedItemCount: session.pinnedItemCount,
    });

    await writeRevisionModeSummaryCreated(identity.schoolId, getStudentId(req)!, session.modeSessionId);

    return res.json(createApiSuccess({ summary: serializeRevisionSummary(summary) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to submit', meta));
  }
});

router.post('/:revisionSessionId/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    const privacyCheck = rejectForbiddenRevisionFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = RevisionModeExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    await updateRevisionSessionStatus(session.id, 'completed');
    await updateRevisionSessionStage(session.id, 'completed');

    const summary = await createRevisionSummary({
      schoolId: identity.schoolId,
      studentId: getStudentId(req)!,
      revisionSessionId,
      modeSessionId: session.modeSessionId,
      finalStage: 'completed',
      exitReason: parsed.data.exitReason,
      itemCount: session.itemCount,
      attemptCount: session.attemptCount,
      weakRecallCount: session.weakRecallCount,
      strongRecallCount: session.strongRecallCount,
      mistakeCount: session.mistakeCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      reflectionCount: session.reflectionCount,
      completedItemCount: session.completedItemCount,
      skippedItemCount: session.skippedItemCount,
      pinnedItemCount: session.pinnedItemCount,
    });

    await writeRevisionSessionExited(identity.schoolId, getStudentId(req)!, session.modeSessionId);

    return res.json(createApiSuccess({ summary: serializeRevisionSummary(summary) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit', meta));
  }
});

router.get('/:revisionSessionId/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));
    }

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));
    }

    const summary = await getRevisionSummaryForSession(revisionSessionId);
    if (!summary) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Summary not found', meta));
    }

    return res.json(buildRevisionSummaryResponse(summary));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get summary', meta));
  }
});

router.post('/:revisionSessionId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { revisionSessionId } = req.params;

    const session = await getRevisionSessionById(revisionSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Revision session not found', meta));

    const access = checkRevisionModeAccess(
      { schoolId: identity.schoolId, role: getLearnerRole(req), studentId: getStudentId(req) || undefined },
      session.schoolId, session.studentId,
    );
    if (!access.allowed) return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reason || 'Access denied', meta));

    await updateRevisionSessionStatus(session.id, 'cancelled');
    await writeRevisionSessionExited(identity.schoolId, getStudentId(req)!, session.modeSessionId);

    const updatedSession = await getRevisionSessionById(revisionSessionId);
    return res.json(createApiSuccess({ session: serializeRevisionSession(updatedSession!) }, meta));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to cancel', meta));
  }
});

export default router;
