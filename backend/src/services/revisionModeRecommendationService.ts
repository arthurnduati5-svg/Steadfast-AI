import {
  RevisionRecommendationResult,
} from '../contracts/revisionModeContracts';

export interface RecommendationInput {
  currentQueue: {
    id: string;
    itemCount: number;
    currentItemIndex: number;
    completedItemCount: number;
    skippedItemCount: number;
  };
  itemStates: Array<{
    id: string;
    itemKey: string;
    itemIndex: number;
    targetType: string;
    status: string;
    priorityBucket?: string;
    dueAt?: Date;
    lastReviewedAt?: Date;
    nextReviewAt?: Date;
    recallQuality?: string;
    masterySignal?: string;
    readinessSignal?: string;
    mistakeCategory?: string;
    supportNeed?: string;
    teacherAssigned?: boolean;
    targetRef?: string;
  }>;
  weakTopicSignals?: string[];
  mistakeSignals?: string[];
  masterySignals?: string[];
}

export function selectNextItem(input: RecommendationInput): RevisionRecommendationResult {
  const items = input.itemStates;

  if (items.length === 0) {
    return {
      selectionReasonCodes: ['content_gap_detected'],
      recommendedMode: 'content_gap_referral',
    };
  }

  const unfinishedItems = items.filter(
    (i) => !['completed', 'skipped', 'cancelled', 'failed'].includes(i.status),
  );

  if (unfinishedItems.length === 0) {
    return {
      selectionReasonCodes: [],
      recommendedMode: 'summary_ready',
    };
  }

  const dueItems = unfinishedItems.filter(
    (i) => i.dueAt && new Date(i.dueAt) <= new Date(),
  );

  const teacherAssignedDue = dueItems.filter((i) => i.priorityBucket === 'teacher_assigned');
  if (teacherAssignedDue.length > 0) {
    const selected = teacherAssignedDue[0];
    return {
      selectedItemKey: selected.itemKey,
      selectedItemIndex: selected.itemIndex,
      selectedTargetRef: selected.targetRef,
      selectionReasonCodes: ['teacher_assigned_priority'],
      recommendedMode: 'revision',
    };
  }

  const weakTopicItems = unfinishedItems.filter(
    (i) => i.priorityBucket === 'high' || (i.dueAt && new Date(i.dueAt) <= new Date()),
  );
  if (weakTopicItems.length > 0) {
    const sorted = weakTopicItems.sort((a, b) => {
      if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return 0;
    });
    const selected = sorted[0];
    const mode = deriveRecommendedMode(selected);
    return {
      selectedItemKey: selected.itemKey,
      selectedItemIndex: selected.itemIndex,
      selectedTargetRef: selected.targetRef,
      selectionReasonCodes: ['weak_topic_detected'],
      recommendedMode: mode,
    };
  }

  const nextItem = unfinishedItems.sort((a, b) => a.itemIndex - b.itemIndex)[0];
  if (!nextItem) {
    return {
      selectionReasonCodes: [],
      recommendedMode: 'summary_ready',
    };
  }

  const mode = deriveRecommendedMode(nextItem);
  return {
    selectedItemKey: nextItem.itemKey,
    selectedItemIndex: nextItem.itemIndex,
    selectedTargetRef: nextItem.targetRef,
    selectionReasonCodes: [],
    recommendedMode: mode,
  };
}

function deriveRecommendedMode(item: {
  recallQuality?: string;
  mistakeCategory?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
}): string {
  if (item.supportNeed === 'use_quiz_mode' || item.supportNeed === 'content_gap_referral') {
    return 'quiz';
  }
  if (item.supportNeed === 'use_teach_back_mode') {
    return 'teach_back';
  }
  if (item.supportNeed === 'use_focus_mode') {
    return 'focus';
  }
  if (item.supportNeed === 'teacher_support') {
    return 'teacher_support';
  }
  if (item.supportNeed === 'repair_mistake') {
    return 'focus';
  }
  if (item.mistakeCategory && !['none', 'unknown'].includes(item.mistakeCategory)) {
    return 'focus';
  }
  if (item.recallQuality && ['blank', 'forgotten', 'unclear', 'incorrect'].includes(item.recallQuality)) {
    return 'quiz';
  }
  if (item.readinessSignal === 'teacher_review_recommended') {
    return 'teacher_support';
  }
  if (item.supportNeed === 'deen_referral') {
    return 'deen_referral';
  }
  return 'revision';
}
