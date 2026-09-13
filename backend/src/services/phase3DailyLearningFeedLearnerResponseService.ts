import type {
  Phase3DailyLearningFeed,
  Phase3DailyLearningFeedItem,
  Phase3DailyLearningFeedLearnerSummary,
  Phase3DailyLearningFeedCounts,
} from '../contracts/phase3DailyLearningFeedContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export class Phase3DailyLearningFeedLearnerResponseService {
  buildLearnerDailyLearningFeedResponse(
    schoolId: string,
    studentId: string,
    items: Phase3DailyLearningFeedItem[],
    blockedItems: Phase3DailyLearningFeedItem[],
    completedToday: Phase3DailyLearningFeedItem[],
  ): Phase3DailyLearningFeed {
    const allItems = [...items, ...blockedItems, ...completedToday];
    const counts = this.buildCounts(items, blockedItems, completedToday);
    const summary = this.buildLearnerDailySummary(items, blockedItems, completedToday);
    const safeEvidenceRefs = this.collectSafeEvidenceRefs(allItems);

    return {
      schoolId,
      studentId,
      generatedAt: nowISO(),
      items: this.buildLearnerFeedItemCards(items),
      blockedItems: this.buildLearnerFeedItemCards(blockedItems),
      completedToday: this.buildLearnerFeedItemCards(completedToday),
      summary,
      counts,
      safeEvidenceRefs,
    };
  }

  buildLearnerFeedItemCards(items: Phase3DailyLearningFeedItem[]): Phase3DailyLearningFeedItem[] {
    return items.map(item => ({
      ...item,
      safeDescription: this.sanitizeDescription(item.safeDescription),
      learnerSafeReason: this.sanitizeReason(item.learnerSafeReason),
    }));
  }

  buildLearnerDailySummary(
    items: Phase3DailyLearningFeedItem[],
    blockedItems: Phase3DailyLearningFeedItem[],
    completedToday: Phase3DailyLearningFeedItem[],
  ): Phase3DailyLearningFeedLearnerSummary {
    const actionableCount = items.length;
    const urgentCount = items.filter(i => i.priority === 'urgent').length;
    const estimatedTotalMinutes = this.estimateTotalMinutes(items);

    const safeMessage = this.deriveSafeMessage(items, blockedItems, completedToday);
    const nextBestAction = this.deriveNextBestAction(items);

    return {
      totalItems: items.length + blockedItems.length + completedToday.length,
      actionableCount,
      blockedCount: blockedItems.length,
      completedTodayCount: completedToday.length,
      urgentCount,
      estimatedTotalMinutes,
      safeMessage,
      nextBestAction: nextBestAction || undefined,
    };
  }

  buildEmptyFeedResponse(schoolId: string, studentId: string): Phase3DailyLearningFeed {
    return {
      schoolId,
      studentId,
      generatedAt: nowISO(),
      items: [],
      blockedItems: [],
      completedToday: [],
      summary: {
        totalItems: 0,
        actionableCount: 0,
        blockedCount: 0,
        completedTodayCount: 0,
        urgentCount: 0,
        estimatedTotalMinutes: 0,
        safeMessage: 'No objectives are scheduled for today. Well done — you are up to date.',
      },
      counts: this.emptyCounts(),
      safeEvidenceRefs: [],
    };
  }

  buildBlockedFeedNotice(schoolId: string, studentId: string, reason: string): Phase3DailyLearningFeed {
    return {
      schoolId,
      studentId,
      generatedAt: nowISO(),
      items: [],
      blockedItems: [],
      completedToday: [],
      summary: {
        totalItems: 0,
        actionableCount: 0,
        blockedCount: 0,
        completedTodayCount: 0,
        urgentCount: 0,
        estimatedTotalMinutes: 0,
        safeMessage: reason,
      },
      counts: this.emptyCounts(),
      safeEvidenceRefs: [],
    };
  }

  buildCompletedTodaySummary(completedToday: Phase3DailyLearningFeedItem[]): string {
    if (completedToday.length === 0) return '';
    if (completedToday.length === 1) return `You completed 1 objective check today.`;
    return `You completed ${completedToday.length} objective checks today.`;
  }

  private buildCounts(
    items: Phase3DailyLearningFeedItem[],
    blockedItems: Phase3DailyLearningFeedItem[],
    completedToday: Phase3DailyLearningFeedItem[],
  ): Phase3DailyLearningFeedCounts {
    const allItems = [...items, ...blockedItems, ...completedToday];
    return {
      objectiveCheck: allItems.filter(i => i.itemType === 'objective_check').length,
      objectiveRecheck: allItems.filter(i => i.itemType === 'objective_recheck').length,
      objectiveRescue: allItems.filter(i => i.itemType === 'objective_rescue').length,
      teacherSupport: allItems.filter(i => i.itemType === 'teacher_support').length,
      sourceRequired: allItems.filter(i => i.itemType === 'source_required').length,
      completedToday: allItems.filter(i => i.itemType === 'completed_today').length,
      continueCheck: allItems.filter(i => i.itemType === 'continue_check').length,
      confidenceFollowup: allItems.filter(i => i.itemType === 'confidence_followup').length,
      teachBackRequired: allItems.filter(i => i.itemType === 'teach_back_required').length,
      transferCheckRequired: allItems.filter(i => i.itemType === 'transfer_check_required').length,
      delayedRecallRequired: allItems.filter(i => i.itemType === 'delayed_recall_required').length,
      reviewReady: allItems.filter(i => i.itemType === 'review_ready').length,
    };
  }

  private emptyCounts(): Phase3DailyLearningFeedCounts {
    return {
      objectiveCheck: 0, objectiveRecheck: 0, objectiveRescue: 0,
      teacherSupport: 0, sourceRequired: 0, completedToday: 0,
      continueCheck: 0, confidenceFollowup: 0, teachBackRequired: 0,
      transferCheckRequired: 0, delayedRecallRequired: 0, reviewReady: 0,
    };
  }

  private collectSafeEvidenceRefs(items: Phase3DailyLearningFeedItem[]): string[] {
    const refs = new Set<string>();
    for (const item of items) {
      for (const ref of item.safeEvidenceRefs) {
        refs.add(ref);
      }
    }
    return Array.from(refs);
  }

  private sanitizeDescription(desc: string): string {
    return desc || '';
  }

  private sanitizeReason(reason: string): string {
    const forbidden = ['failed', 'cheated', 'suspicious', 'behind', 'weak', 'caught'];
    let sanitized = reason;
    for (const word of forbidden) {
      sanitized = sanitized.replace(new RegExp(word, 'gi'), '');
    }
    return sanitized.trim() || 'This item needs your attention.';
  }

  private estimateTotalMinutes(items: Phase3DailyLearningFeedItem[]): number {
    return items.reduce((sum, item) => sum + (item.estimatedTimeMinutes || 0), 0);
  }

  private deriveSafeMessage(
    items: Phase3DailyLearningFeedItem[],
    blockedItems: Phase3DailyLearningFeedItem[],
    completedToday: Phase3DailyLearningFeedItem[],
  ): string {
    if (items.length === 0 && blockedItems.length === 0 && completedToday.length === 0) {
      return 'No objectives are scheduled for today.';
    }
    if (items.length === 0 && blockedItems.length > 0) {
      return 'Some objectives are waiting for approved sources before you can continue.';
    }
    if (items.length === 0 && completedToday.length > 0) {
      return 'All done for today. Great work!';
    }
    if (items.length === 1) {
      return 'You have 1 focused objective for today.';
    }
    return `You have ${items.length} focused objectives for today.`;
  }

  private deriveNextBestAction(items: Phase3DailyLearningFeedItem[]): string | null {
    if (items.length === 0) return null;
    const first = items[0];
    switch (first.nextAction) {
      case 'start_daily_objective_check':
        return `Start with "${first.title}" — a short check to see how you are doing.`;
      case 'continue_daily_objective_check':
        return `Continue your check on "${first.title}".`;
      case 'record_confidence_before':
        return `Start by recording how confident you feel about "${first.title}".`;
      case 'record_confidence_after':
        return `Finish by recording your confidence after the check on "${first.title}".`;
      case 'complete_teach_back':
        return `Complete the teach-back step for "${first.title}".`;
      case 'complete_transfer_check':
        return `Complete the transfer check for "${first.title}".`;
      case 'complete_delayed_recall':
        return `Complete the delayed recall for "${first.title}".`;
      case 'review_completed_objective':
        return `Review "${first.title}" to keep it fresh.`;
      case 'ask_teacher_for_source':
        return `Ask your teacher about the source for "${first.title}".`;
      case 'ask_teacher_for_help':
        return `Ask your teacher for help with "${first.title}".`;
      default:
        return null;
    }
  }
}

export const phase3DailyLearningFeedLearnerResponseService = new Phase3DailyLearningFeedLearnerResponseService();
