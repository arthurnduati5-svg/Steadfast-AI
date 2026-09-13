import type {
  Phase3GrowthPageDailyFeedAdapterResult,
  Phase3GrowthPageCard,
  Phase3DueNowItem,
  Phase3GrowthPageAction,
  Phase3GrowthPageSignalType,
  Phase3GrowthPagePriority,
} from '../contracts/phase3GrowthPageContracts';
import type { Phase3DailyLearningFeedItem } from '../contracts/phase3DailyLearningFeedContracts';
import { phase3DailyLearningFeedService } from './phase3DailyLearningFeedService';

let cardCounter = 0;
let dueNowCounter = 0;
function nowISO(): string { return new Date().toISOString(); }
function cardId(): string { return `gpdf_${Date.now().toString(36)}_${(++cardCounter).toString(36)}`; }
function dueNowId(): string { return `gpdf_due_${Date.now().toString(36)}_${(++dueNowCounter).toString(36)}`; }

const sourceMessage = 'This item needs an approved source or teacher confirmation before you continue.';

export class Phase3GrowthPageDailyFeedAdapterService {
  loadDailyFeedForGrowthPage(schoolId: string, studentId: string): Phase3GrowthPageDailyFeedAdapterResult {
    if (!schoolId || !studentId) return this.buildDailyFeedAdapterEmptyState();
    const feed = phase3DailyLearningFeedService.getLearnerDailyLearningFeed(schoolId, studentId);
    const allItems = [...feed.items, ...feed.blockedItems, ...feed.completedToday]
      .filter(item => item.schoolId === schoolId && item.studentId === studentId);

    const feedCards = this.mapItemsToGrowthCards(allItems, schoolId, studentId)
      .filter(card => card.cardType !== 'source_required' && card.cardType !== 'teacher_support_needed');
    const dueNowItems = this.mapItemsToDueNow(allItems, schoolId, studentId);
    const sourceRequiredCards = this.mapBlockedItemsToSourceCards(allItems, schoolId, studentId);
    const teacherSupportCards = this.mapTeacherSupportItems(allItems, schoolId, studentId);

    return {
      feedCards: this.dedupeCards(feedCards),
      dueNowItems: this.dedupeDueNow(dueNowItems),
      sourceRequiredCards: this.dedupeCards(sourceRequiredCards),
      teacherSupportCards: this.dedupeCards(teacherSupportCards),
    };
  }

  mapDailyFeedItemsToGrowthCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return this.loadDailyFeedForGrowthPage(schoolId, studentId).feedCards;
  }

  mapDailyFeedItemsToDueNow(schoolId: string, studentId: string): Phase3DueNowItem[] {
    return this.loadDailyFeedForGrowthPage(schoolId, studentId).dueNowItems;
  }

  mapDailyFeedBlockedItemsToSourceCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return this.loadDailyFeedForGrowthPage(schoolId, studentId).sourceRequiredCards;
  }

  mapDailyFeedTeacherSupportItems(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return this.loadDailyFeedForGrowthPage(schoolId, studentId).teacherSupportCards;
  }

  buildDailyFeedAdapterEmptyState(): Phase3GrowthPageDailyFeedAdapterResult {
    return { feedCards: [], dueNowItems: [], sourceRequiredCards: [], teacherSupportCards: [] };
  }

  private mapItemsToGrowthCards(items: Phase3DailyLearningFeedItem[], schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return items.map(item => this.toGrowthCard(item, schoolId, studentId)).filter(Boolean) as Phase3GrowthPageCard[];
  }

  private mapItemsToDueNow(items: Phase3DailyLearningFeedItem[], schoolId: string, studentId: string): Phase3DueNowItem[] {
    return items
      .filter(item => this.isActionableDueNow(item))
      .map(item => ({
        dueNowItemId: dueNowId(),
        schoolId,
        studentId,
        sourceType: 'daily_learning_feed',
        signalType: this.signalTypeFor(item),
        priority: this.priorityFor(item.priority),
        safeTitle: item.title,
        safeSummary: item.learnerSafeReason || item.safeDescription,
        recommendedAction: this.actionFor(item),
        objectiveId: item.objectiveId,
        topicId: item.topicId,
        skillId: item.skillId,
        actionPayload: { feedItemId: item.feedItemId, sourceTruthStatus: item.sourceTruthStatus },
        isCompleted: false,
        safeEvidenceRefs: item.safeEvidenceRefs,
        safeReasonCodes: item.safeReasonCodes,
        createdAt: item.createdAt || nowISO(),
        updatedAt: item.updatedAt || nowISO(),
      }));
  }

  private mapBlockedItemsToSourceCards(items: Phase3DailyLearningFeedItem[], schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return items
      .filter(item => item.itemType === 'source_required' || ['source_required', 'content_gap', 'blocked', 'unknown'].includes(item.sourceTruthStatus))
      .map(item => this.toBlockedCard(item, schoolId, studentId));
  }

  private mapTeacherSupportItems(items: Phase3DailyLearningFeedItem[], schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return items
      .filter(item => item.itemType === 'teacher_support')
      .map(item => ({
        cardId: cardId(),
        cardType: 'teacher_support_needed',
        priority: 'urgent',
        safeTitle: item.title || 'Teacher support needed',
        safeSummary: item.learnerSafeReason || 'This area needs teacher support before the next step can continue.',
        recommendedAction: 'ask_teacher_for_help',
        sourceType: 'daily_learning_feed',
        signalType: 'teacher_support_required',
        objectiveId: item.objectiveId,
        topicId: item.topicId,
        skillId: item.skillId,
        safeEvidenceRefs: item.safeEvidenceRefs,
        safeReasonCodes: item.safeReasonCodes,
        createdAt: item.createdAt || nowISO(),
      }));
  }

  private toGrowthCard(item: Phase3DailyLearningFeedItem, schoolId: string, studentId: string): Phase3GrowthPageCard | null {
    if (item.schoolId !== schoolId || item.studentId !== studentId) return null;
    if (item.itemType === 'source_required' || ['source_required', 'content_gap', 'blocked', 'unknown'].includes(item.sourceTruthStatus)) {
      return this.toBlockedCard(item, schoolId, studentId);
    }
    if (item.itemType === 'teacher_support') return this.mapTeacherSupportItems([item], schoolId, studentId)[0];

    const cardType = item.itemType === 'objective_rescue'
      ? 'weak_topic_lane'
      : item.itemType === 'completed_today'
      ? 'recently_improving'
      : 'daily_feed_item';
    return {
      cardId: cardId(),
      cardType,
      priority: this.priorityFor(item.priority),
      safeTitle: item.title,
      safeSummary: item.learnerSafeReason || item.safeDescription,
      recommendedAction: this.actionFor(item),
      sourceType: 'daily_learning_feed',
      signalType: this.signalTypeFor(item),
      objectiveId: item.objectiveId,
      topicId: item.topicId,
      skillId: item.skillId,
      safeEvidenceRefs: item.safeEvidenceRefs,
      safeReasonCodes: item.safeReasonCodes,
      createdAt: item.createdAt || nowISO(),
    };
  }

  private toBlockedCard(item: Phase3DailyLearningFeedItem, _schoolId: string, _studentId: string): Phase3GrowthPageCard {
    return {
      cardId: cardId(),
      cardType: 'source_required',
      priority: 'blocked',
      safeTitle: item.title || 'Source confirmation needed',
      safeSummary: sourceMessage,
      recommendedAction: 'ask_teacher_for_source',
      sourceType: 'daily_learning_feed',
      signalType: 'source_required',
      objectiveId: item.objectiveId,
      topicId: item.topicId,
      skillId: item.skillId,
      safeEvidenceRefs: item.safeEvidenceRefs,
      safeReasonCodes: item.safeReasonCodes,
      createdAt: item.createdAt || nowISO(),
    };
  }

  private isActionableDueNow(item: Phase3DailyLearningFeedItem): boolean {
    if (item.itemType === 'source_required' || item.itemType === 'teacher_support' || item.itemType === 'completed_today') return false;
    if (['source_required', 'content_gap', 'blocked', 'unknown'].includes(item.sourceTruthStatus)) return false;
    return ['objective_check', 'continue_check', 'teach_back_required', 'transfer_check_required', 'delayed_recall_required'].includes(item.itemType);
  }

  private actionFor(item: Phase3DailyLearningFeedItem): Phase3GrowthPageAction {
    if (item.itemType === 'continue_check') return 'continue_daily_objective_check';
    if (item.itemType === 'objective_rescue') return 'review_weak_topic';
    if (item.itemType === 'teacher_support') return 'ask_teacher_for_help';
    if (item.itemType === 'source_required') return 'ask_teacher_for_source';
    if (item.itemType === 'teach_back_required') return 'open_teach_back_mode';
    if (item.itemType === 'transfer_check_required') return 'open_focus_mode';
    if (item.itemType === 'delayed_recall_required') return 'open_revision_mode';
    return item.nextAction === 'continue_daily_objective_check' ? 'continue_daily_objective_check' : 'start_daily_objective_check';
  }

  private signalTypeFor(item: Phase3DailyLearningFeedItem): Phase3GrowthPageSignalType {
    if (item.itemType === 'continue_check') return 'daily_check_in_progress';
    if (item.itemType === 'objective_rescue') return 'objective_needs_rescue';
    if (item.itemType === 'teacher_support') return 'teacher_support_required';
    if (item.itemType === 'source_required') return 'source_required';
    if (item.itemType === 'completed_today') return 'daily_check_completed';
    if (item.itemType === 'objective_recheck') return 'daily_check_needs_recheck';
    return 'daily_check_pending';
  }

  private priorityFor(priority: string): Phase3GrowthPagePriority {
    return ['low', 'medium', 'high', 'urgent', 'blocked'].includes(priority) ? priority as Phase3GrowthPagePriority : 'medium';
  }

  private dedupeCards(cards: Phase3GrowthPageCard[]): Phase3GrowthPageCard[] {
    const seen = new Set<string>();
    return cards.filter(card => {
      const key = `${card.objectiveId ?? ''}:${card.cardType}:${card.recommendedAction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private dedupeDueNow(items: Phase3DueNowItem[]): Phase3DueNowItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = `${item.objectiveId ?? ''}:${item.recommendedAction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const phase3GrowthPageDailyFeedAdapterService = new Phase3GrowthPageDailyFeedAdapterService();
