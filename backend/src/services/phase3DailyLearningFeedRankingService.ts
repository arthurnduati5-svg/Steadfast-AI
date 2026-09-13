import type {
  Phase3DailyLearningFeedItem,
  Phase3DailyLearningFeedPriority,
  Phase3DailyLearningFeedItemType,
  Phase3DailyLearningFeedReasonCode,
} from '../contracts/phase3DailyLearningFeedContracts';
import { PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER } from '../contracts/phase3DailyLearningFeedContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export class Phase3DailyLearningFeedRankingService {
  rankDailyLearningFeedItems(items: Phase3DailyLearningFeedItem[]): Phase3DailyLearningFeedItem[] {
    const deduped = this.dedupeFeedItemsByObjective(items);
    const sorted = this.sortFeedItemsForLearner(deduped);
    return sorted;
  }

  deriveFeedItemPriority(
    itemType: Phase3DailyLearningFeedItemType,
    masteryStatus?: string,
    checkStatus?: string,
    dueAt?: string,
  ): Phase3DailyLearningFeedPriority {
    switch (itemType) {
      case 'teacher_support':
        return 'urgent';
      case 'source_required':
        if (dueAt && new Date(dueAt).getTime() <= Date.now()) return 'urgent';
        return 'high';
      case 'objective_rescue':
        return 'high';
      case 'continue_check':
        if (checkStatus === 'needs_recheck') return 'high';
        return 'high';
      case 'teach_back_required':
      case 'transfer_check_required':
      case 'delayed_recall_required':
        return 'high';
      case 'confidence_followup':
        return 'medium';
      case 'objective_recheck':
        if (dueAt && new Date(dueAt).getTime() <= Date.now()) return 'high';
        return 'medium';
      case 'objective_check':
        if (dueAt && new Date(dueAt).getTime() <= Date.now()) return 'high';
        return 'medium';
      case 'review_ready':
        return 'low';
      case 'completed_today':
        return 'low';
      default:
        return 'medium';
    }
  }

  deriveFeedItemReasonCodes(
    itemType: Phase3DailyLearningFeedItemType,
    masteryStatus?: string,
    checkStatus?: string,
    dueAt?: string,
  ): Phase3DailyLearningFeedReasonCode[] {
    const codes: Phase3DailyLearningFeedReasonCode[] = [];
    switch (itemType) {
      case 'objective_check':
        codes.push('pending_daily_seed');
        break;
      case 'continue_check':
        codes.push('in_progress_check');
        break;
      case 'confidence_followup':
        codes.push('awaiting_confidence_before');
        if (checkStatus === 'awaiting_confidence_after') codes.push('awaiting_confidence_after');
        break;
      case 'teach_back_required':
        codes.push('awaiting_teach_back');
        break;
      case 'transfer_check_required':
        codes.push('awaiting_transfer_check');
        break;
      case 'delayed_recall_required':
        codes.push('awaiting_delayed_recall');
        break;
      case 'completed_today':
        codes.push('completed_today');
        break;
      case 'objective_rescue':
        codes.push('needs_rescue_mastery');
        break;
      case 'teacher_support':
        codes.push('needs_teacher_support');
        break;
      case 'source_required':
        codes.push('source_required_status');
        break;
      case 'objective_recheck':
        if (masteryStatus === 'almost_there') codes.push('almost_there_needs_recheck');
        else codes.push('getting_better_needs_recheck');
        break;
      case 'review_ready':
        codes.push('confident_review_due');
        break;
    }
    if (dueAt && new Date(dueAt).getTime() <= Date.now()) {
      codes.push('overdue_seed');
    }
    return codes;
  }

  dedupeFeedItemsByObjective(items: Phase3DailyLearningFeedItem[]): Phase3DailyLearningFeedItem[] {
    const itemsByObjective = new Map<string, Phase3DailyLearningFeedItem>();

    for (const item of items) {
      const existing = itemsByObjective.get(item.objectiveId);
      if (!existing) {
        itemsByObjective.set(item.objectiveId, item);
        continue;
      }

      const existingRank = PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER.indexOf(existing.itemType);
      const newRank = PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER.indexOf(item.itemType);

      if (newRank < existingRank) {
        itemsByObjective.set(item.objectiveId, item);
      }
    }

    return Array.from(itemsByObjective.values());
  }

  sortFeedItemsForLearner(items: Phase3DailyLearningFeedItem[]): Phase3DailyLearningFeedItem[] {
    const priorityOrder: Record<Phase3DailyLearningFeedPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      blocked: 0,
    };

    const typeOrder: Record<string, number> = {
      teacher_support: 0,
      source_required: 1,
      objective_rescue: 2,
      continue_check: 3,
      teach_back_required: 4,
      transfer_check_required: 5,
      delayed_recall_required: 6,
      confidence_followup: 7,
      objective_recheck: 8,
      objective_check: 9,
      review_ready: 10,
      completed_today: 11,
    };

    return [...items].sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      if (pDiff !== 0) return pDiff;

      const tDiff = (typeOrder[a.itemType] ?? 99) - (typeOrder[b.itemType] ?? 99);
      if (tDiff !== 0) return tDiff;

      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;

      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  limitFeedItems(items: Phase3DailyLearningFeedItem[], limit?: number): Phase3DailyLearningFeedItem[] {
    if (!limit || limit <= 0) return items;
    return items.slice(0, limit);
  }
}

export const phase3DailyLearningFeedRankingService = new Phase3DailyLearningFeedRankingService();
