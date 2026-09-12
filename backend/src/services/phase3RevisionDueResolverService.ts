import {
  Phase3RevisionDueItem,
  Phase3RevisionDueStatus,
  Phase3RevisionPriority,
  Phase3RevisionSignalType,
  Phase3RevisionAction,
  Phase3RevisionSafeEvidenceRef,
  Phase3RevisionNode,
} from '../contracts/phase3LivingRevisionContracts';
import {
  phase3LivingRevisionRepository,
  phase3LivingRevisionDurableRepository,
} from './phase3LivingRevisionRepository';

export function resolveDueStatus(
  node: Phase3RevisionNode,
  dueItem?: Phase3RevisionDueItem | null,
): Phase3RevisionDueStatus {
  if (node.status === 'archived' || node.status === 'blocked') return 'blocked';
  if (node.sourceTruth.status === 'source_required' || node.sourceTruth.status === 'content_gap') return 'source_required';
  if (node.status === 'needs_teacher_support' || node.sourceTruth.status === 'blocked') return 'teacher_support_required';
  if (!dueItem || dueItem.isCompleted) return 'completed';

  const now = Date.now();
  const createdAt = new Date(dueItem.createdAt).getTime();
  const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);

  if (hoursSinceCreated < 1) return 'due_now';
  if (hoursSinceCreated < 24) return 'due_today';
  if (hoursSinceCreated < 168) return 'due_this_week';
  return 'overdue';
}

export function resolveDueRevisionItemsForLearner(
  schoolId: string,
  studentId: string,
): { items: Phase3RevisionDueItem[]; statuses: Map<string, Phase3RevisionDueStatus> } {
  const dueItems = phase3LivingRevisionRepository.listRevisionDueItemsForLearner(schoolId, studentId);
  const statuses = new Map<string, Phase3RevisionDueStatus>();

  for (const item of dueItems) {
    const node = phase3LivingRevisionRepository.getRevisionNode(item.nodeId);
    if (node) {
      statuses.set(item.dueItemId, resolveDueStatus(node, item));
    }
  }

  return {
    items: dueItems.filter((d) => !d.isCompleted),
    statuses,
  };
}

export function createDueItemForRevisionNode(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  priority?: Phase3RevisionPriority,
  objectiveId?: string,
  topicId?: string,
): Phase3RevisionDueItem {
  const node = phase3LivingRevisionRepository.getRevisionNode(nodeId);
  if (!node) throw new Error('Revision node not found.');
  if (node.sourceTruth.status === 'source_required' || node.sourceTruth.status === 'content_gap') {
    throw new Error('Source required revision nodes cannot become actionable due items.');
  }

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority: priority || 'medium',
    signalType: 'due_for_recall',
    safeTitle,
    safeSummary,
    recommendedAction: 'open_revision_node',
    sourceTruthStatus: node.sourceTruth.status,
    objectiveId,
    topicId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['due_item_created'],
  });
}

export function scheduleNextRevision(
  node: Phase3RevisionNode,
): { intervalDays: number; nextDueAt: Date } {
  const defaultInterval = 1;
  return { intervalDays: defaultInterval, nextDueAt: new Date(Date.now() + defaultInterval * 24 * 60 * 60 * 1000) };
}

export function completeDueRevisionItem(dueItemId: string): Phase3RevisionDueItem | null {
  return phase3LivingRevisionRepository.completeDueRevisionItem(dueItemId);
}

export function snoozeDueRevisionItem(dueItemId: string): Phase3RevisionDueItem | null {
  const d = phase3LivingRevisionRepository.getRevisionDueItem(dueItemId);
  if (!d) return null;
  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId: d.schoolId,
    studentId: d.studentId,
    nodeId: d.nodeId,
    priority: 'low',
    signalType: d.signalType,
    safeTitle: d.safeTitle,
    safeSummary: d.safeSummary,
    recommendedAction: d.recommendedAction,
    sourceTruthStatus: d.sourceTruthStatus,
    objectiveId: d.objectiveId,
    topicId: d.topicId,
    skillId: d.skillId,
    isCompleted: d.isCompleted,
    safeEvidenceRefs: d.safeEvidenceRefs,
    safeReasonCodes: [...d.safeReasonCodes, 'snoozed'],
  });
}

export function rankDueRevisionItems(items: Phase3RevisionDueItem[]): Phase3RevisionDueItem[] {
  return deriveRevisionDuePriority(items);
}

export function buildDueRevisionSafeSummary(dueItem: Phase3RevisionDueItem): string {
  return buildRevisionDueReason(dueItem);
}

export function deriveDueRevisionItems(
  schoolId: string,
  studentId: string,
): Phase3RevisionDueItem[] {
  return phase3LivingRevisionRepository.listRevisionDueItemsForLearner(schoolId, studentId)
    .filter((d) => !d.isCompleted);
}

export function deriveDueFromGrowthPage(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  priority?: Phase3RevisionPriority,
  objectiveId?: string,
  topicId?: string,
): Phase3RevisionDueItem {
  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority: priority || 'medium',
    signalType: 'created_from_growth_page',
    safeTitle,
    safeSummary,
    recommendedAction: 'start_recall_check',
    sourceTruthStatus: 'approved',
    objectiveId,
    topicId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['created_from_growth_page'],
  });
}

export function deriveDueFromWeakTopicLane(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  status?: string,
  objectiveId?: string,
  topicId?: string,
): Phase3RevisionDueItem {
  const dueStatuses = ['needs_recheck', 'needs_rescue', 'practice_next', 'stabilizing'];
  const effectivePriority: Phase3RevisionPriority =
    status && dueStatuses.includes(status) ? 'high' : 'medium';

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority: effectivePriority,
    signalType: 'created_from_weak_topic',
    safeTitle,
    safeSummary,
    recommendedAction: 'review_weak_topic',
    sourceTruthStatus: 'approved',
    objectiveId,
    topicId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['created_from_weak_topic', status ? `weak_topic_${status}` : 'weak_topic_active'],
  });
}

export function deriveDueFromMistakePattern(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  isRepeated?: boolean,
  isRecent?: boolean,
  objectiveId?: string,
  topicId?: string,
): Phase3RevisionDueItem {
  const priority: Phase3RevisionPriority =
    isRepeated && isRecent ? 'urgent'
    : isRepeated ? 'high'
    : isRecent ? 'high'
    : 'medium';

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority,
    signalType: 'created_from_mistake_pattern',
    safeTitle,
    safeSummary,
    recommendedAction: 'review_mistake_pattern',
    sourceTruthStatus: 'approved',
    objectiveId,
    topicId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: [
      'created_from_mistake_pattern',
      ...(isRepeated ? ['mistake_pattern_repeated'] : []),
      ...(isRecent ? ['mistake_pattern_recent'] : []),
    ],
  });
}

export function deriveDueFromObjectiveMastery(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  masteryStatus?: string,
  objectiveId?: string,
): Phase3RevisionDueItem {
  const dueStatuses = ['still_learning', 'needs_recheck', 'getting_better'];
  const priority: Phase3RevisionPriority =
    masteryStatus && dueStatuses.includes(masteryStatus) ? 'high' : 'medium';

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority,
    signalType: 'created_from_objective',
    safeTitle,
    safeSummary,
    recommendedAction: 'start_recall_check',
    sourceTruthStatus: 'approved',
    objectiveId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: [
      'created_from_objective',
      masteryStatus ? `mastery_${masteryStatus}` : 'mastery_active',
    ],
  });
}

export function deriveDueFromStudyPlan(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  isDue?: boolean,
  objectiveId?: string,
  topicId?: string,
): Phase3RevisionDueItem {
  const priority: Phase3RevisionPriority = isDue ? 'high' : 'medium';

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority,
    signalType: 'created_from_study_plan',
    safeTitle,
    safeSummary,
    recommendedAction: 'open_study_plan',
    sourceTruthStatus: 'approved',
    objectiveId,
    topicId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['created_from_study_plan', ...(isDue ? ['study_plan_due'] : [])],
  });
}

export function deriveDueFromDailyCheck(
  schoolId: string,
  studentId: string,
  nodeId: string,
  safeTitle: string,
  safeSummary: string,
  needsDelayedRecall?: boolean,
  needsTeachBack?: boolean,
  objectiveId?: string,
): Phase3RevisionDueItem {
  const action: Phase3RevisionAction =
    needsTeachBack ? 'start_teach_back'
    : needsDelayedRecall ? 'start_recall_check'
    : 'open_revision_node';

  return phase3LivingRevisionRepository.upsertRevisionDueItem({
    schoolId,
    studentId,
    nodeId,
    priority: 'medium',
    signalType: 'created_from_daily_check',
    safeTitle,
    safeSummary,
    recommendedAction: action,
    sourceTruthStatus: 'approved',
    objectiveId,
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['created_from_daily_check'],
  });
}

export function deriveRevisionDuePriority(
  dueItems: Phase3RevisionDueItem[],
): Phase3RevisionDueItem[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0, high: 1, medium: 2, low: 3, blocked: 4,
  };
  return [...dueItems].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 5;
    const pb = priorityOrder[b.priority] ?? 5;
    return pa - pb;
  });
}

export function buildRevisionDueReason(dueItem: Phase3RevisionDueItem): string {
  if (dueItem.safeReasonCodes.includes('created_from_mistake_pattern')) {
    return 'This mistake pattern is repairable with a quick revisit.';
  }
  if (dueItem.safeReasonCodes.includes('created_from_weak_topic')) {
    return 'This topic needs your attention to strengthen understanding.';
  }
  if (dueItem.safeReasonCodes.includes('created_from_growth_page')) {
    return 'This item is due for a short recall check.';
  }
  if (dueItem.safeReasonCodes.includes('created_from_objective')) {
    return 'This idea connects to an objective you are still strengthening.';
  }
  if (dueItem.safeReasonCodes.includes('created_from_study_plan')) {
    return 'This study plan step is ready for review.';
  }
  return 'This revision item is ready for review.';
}

export function dedupeRevisionDueItems(items: Phase3RevisionDueItem[]): Phase3RevisionDueItem[] {
  const seen = new Map<string, Phase3RevisionDueItem>();
  for (const item of items) {
    const key = `${item.schoolId}:${item.studentId}:${item.nodeId}:${item.signalType}`;
    const existing = seen.get(key);
    if (!existing || item.priority === 'urgent' || item.priority === 'high') {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

export function limitRevisionDueItems(
  items: Phase3RevisionDueItem[],
  maxItems = 20,
): Phase3RevisionDueItem[] {
  return items.slice(0, maxItems);
}

export function markRevisionDueItemCompleted(dueItemId: string): Phase3RevisionDueItem | null {
  return phase3LivingRevisionRepository.markRevisionDueItemCompleted(dueItemId);
}

// ─────────────────────────────────────────────────────────────
// R8-G.3A-D1C durable async production counterparts.
// Pure calculations above remain pure; state read/write below uses
// the durable repository. Priority/signal/source-truth/
// recommended-action/completion semantics are preserved.
// ─────────────────────────────────────────────────────────────

export async function deriveDueRevisionItemsDurable(
  schoolId: string,
  studentId: string,
): Promise<Phase3RevisionDueItem[]> {
  return phase3LivingRevisionDurableRepository.listDueRevisionItemsForLearner(schoolId, studentId);
}

export async function listDueRevisionItemsForLearnerDurable(
  schoolId: string,
  studentId: string,
): Promise<Phase3RevisionDueItem[]> {
  return phase3LivingRevisionDurableRepository.listRevisionDueItemsForLearner(schoolId, studentId);
}

export async function markRevisionDueItemCompletedDurable(
  dueItemId: string,
  schoolId: string,
): Promise<Phase3RevisionDueItem | null> {
  return phase3LivingRevisionDurableRepository.markRevisionDueItemCompleted(dueItemId, schoolId);
}

export async function completeDueRevisionItemDurable(
  dueItemId: string,
  schoolId: string,
): Promise<Phase3RevisionDueItem | null> {
  return phase3LivingRevisionDurableRepository.completeDueRevisionItem(dueItemId, schoolId);
}
