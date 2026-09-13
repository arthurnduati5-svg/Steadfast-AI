import { RevisionModeSession, RevisionModeQueue, RevisionModeItemState, RevisionModeAttempt, RevisionModeSummary, RevisionModeState } from '../contracts/revisionModeContracts';
import { getRevisionQueueForSession } from './revisionModeQueueService';
import { getCurrentRevisionItem, getRevisionItemsForSession } from './revisionModeItemStateService';
import { getAttemptsForItem } from './revisionModeAttemptService';
import { getRevisionSummaryForSession } from './revisionModeSummaryService';

export async function loadRevisionState(
  session: RevisionModeSession,
): Promise<RevisionModeState> {
  const queue = await getRevisionQueueForSession(session.id);
  const items = await getRevisionItemsForSession(session.id);
  const currentItem = items.length > 0 && session.currentItemIndex < items.length
    ? items[session.currentItemIndex]
    : null;
  const attempts = currentItem
    ? await getAttemptsForItem(session.id, currentItem.itemKey)
    : [];
  const summary = await getRevisionSummaryForSession(session.id);

  return {
    session,
    queue: queue || undefined,
    currentItem: currentItem || undefined,
    attempts,
    summary: summary || undefined,
  };
}

export async function buildRevisionState(
  session: RevisionModeSession,
): Promise<Record<string, unknown>> {
  const state = await loadRevisionState(session);
  return {
    ok: true,
    revisionMode: {
      session: {
        id: session.id,
        schoolId: session.schoolId,
        studentId: session.studentId,
        modeSessionId: session.modeSessionId,
        conversationId: session.conversationId || null,
        subjectId: session.subjectId || null,
        topicId: session.topicId || null,
        skillId: session.skillId || null,
        approvedContentRef: session.approvedContentRef || null,
        targetRef: session.targetRef || null,
        revisionGoalCategory: session.revisionGoalCategory,
        revisionSessionType: session.revisionSessionType,
        status: session.status,
        currentStage: session.currentStage,
        currentItemIndex: session.currentItemIndex,
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
        safeEvidenceRefs: session.safeEvidenceRefsJson,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt || null,
        endedAt: session.endedAt || null,
      },
      queue: state.queue ? {
        id: state.queue.id,
        queueType: state.queue.queueType,
        queueStatus: state.queue.queueStatus,
        sourceType: state.queue.sourceType,
        sourceRefs: state.queue.sourceRefsJson,
        itemCount: state.queue.itemCount,
        currentItemIndex: state.queue.currentItemIndex,
        dueItemCount: state.queue.dueItemCount,
        completedItemCount: state.queue.completedItemCount,
        skippedItemCount: state.queue.skippedItemCount,
        pinnedItemCount: state.queue.pinnedItemCount,
      } : null,
      currentItem: state.currentItem ? {
        id: state.currentItem.id,
        itemKey: state.currentItem.itemKey,
        itemIndex: state.currentItem.itemIndex,
        targetType: state.currentItem.targetType,
        targetRef: state.currentItem.targetRef || null,
        approvedContentRef: state.currentItem.approvedContentRef || null,
        sourceMode: state.currentItem.sourceMode || null,
        status: state.currentItem.status,
        attemptNumber: state.currentItem.attemptNumber,
        recallQuality: state.currentItem.recallQuality || null,
        retrievalSignal: state.currentItem.retrievalSignal || null,
        mistakeCategory: state.currentItem.mistakeCategory || null,
        supportNeed: state.currentItem.supportNeed || null,
        masterySignal: state.currentItem.masterySignal || null,
        readinessSignal: state.currentItem.readinessSignal || null,
        selectedTutorAction: state.currentItem.selectedTutorAction || null,
        hintLevel: state.currentItem.hintLevel || null,
        dueAt: state.currentItem.dueAt || null,
        lastReviewedAt: state.currentItem.lastReviewedAt || null,
        nextReviewAt: state.currentItem.nextReviewAt || null,
        reviewIntervalBucket: state.currentItem.reviewIntervalBucket || null,
        completedAt: state.currentItem.completedAt || null,
      } : null,
      summary: state.summary ? {
        id: state.summary.id,
        finalStage: state.summary.finalStage,
        exitReason: state.summary.exitReason,
        itemCount: state.summary.itemCount,
        attemptCount: state.summary.attemptCount,
        weakRecallCount: state.summary.weakRecallCount,
        strongRecallCount: state.summary.strongRecallCount,
        mistakeCount: state.summary.mistakeCount,
        hintCount: state.summary.hintCount,
        stuckCount: state.summary.stuckCount,
        recoveryCount: state.summary.recoveryCount,
        reflectionCount: state.summary.reflectionCount,
        completedItemCount: state.summary.completedItemCount,
        skippedItemCount: state.summary.skippedItemCount,
        pinnedItemCount: state.summary.pinnedItemCount,
        estimatedRecallStrengthBucket: state.summary.estimatedRecallStrengthBucket || null,
        estimatedReadinessSignal: state.summary.estimatedReadinessSignal || null,
        masterySignal: state.summary.masterySignal || null,
        nextReviewAt: state.summary.nextReviewAt || null,
      } : null,
    },
  };
}
