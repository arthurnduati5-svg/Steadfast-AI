import type {
  Phase3DailyLearningFeed,
  Phase3DailyLearningFeedItem,
  Phase3DailyLearningFeedItemType,
  Phase3DailyLearningFeedAction,
  Phase3DailyLearningFeedPriority,
  Phase3DailyLearningFeedReasonCode,
  Phase3DailyLearningFeedCounts,
} from '../contracts/phase3DailyLearningFeedContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3ObjectiveMasteryService } from './phase3ObjectiveMasteryService';
import { phase3DailyObjectiveSeedService } from './phase3DailyObjectiveSeedService';
import { phase3DailyLearningFeedRankingService } from './phase3DailyLearningFeedRankingService';
import { phase3DailyLearningFeedSourceTruthService } from './phase3DailyLearningFeedSourceTruthService';
import { phase3DailyLearningFeedLearnerResponseService } from './phase3DailyLearningFeedLearnerResponseService';
import { phase3DailyLearningFeedAuditService } from './phase3DailyLearningFeedAuditService';

let feedItemIdCounter = 0;

function generateFeedItemId(): string {
  const c = ++feedItemIdCounter;
  return `fi_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
}

export class Phase3DailyLearningFeedService {
  getLearnerDailyLearningFeed(schoolId: string, studentId: string, classId?: string): Phase3DailyLearningFeed {
    const items = this.assembleLearnerFeedItems(schoolId, studentId, classId);
    const rankedItems = phase3DailyLearningFeedRankingService.rankDailyLearningFeedItems(items);
    const limitedItems = phase3DailyLearningFeedRankingService.limitFeedItems(rankedItems, 50);

    const actionableItems = limitedItems.filter(i => i.priority !== 'blocked' && i.itemType !== 'source_required');
    const blockedItems = limitedItems.filter(i => i.priority === 'blocked' || i.itemType === 'source_required');
    const completedItems = limitedItems.filter(i => i.itemType === 'completed_today');

    phase3DailyLearningFeedAuditService.recordDailyLearningFeedViewed(
      schoolId, studentId, 'learner', studentId,
    );

    if (limitedItems.length === 0) {
      phase3DailyLearningFeedAuditService.recordEmptyStateReturned(
        schoolId, studentId, 'learner', studentId,
      );
      return phase3DailyLearningFeedLearnerResponseService.buildEmptyFeedResponse(schoolId, studentId);
    }

    return phase3DailyLearningFeedLearnerResponseService.buildLearnerDailyLearningFeedResponse(
      schoolId, studentId, actionableItems, blockedItems, completedItems,
    );
  }

  assembleLearnerFeedItems(schoolId: string, studentId: string, classId?: string): Phase3DailyLearningFeedItem[] {
    const progressCards = this.loadLearnerObjectiveProgress(schoolId, studentId, classId);
    const seeds = this.loadLearnerDailySeeds(schoolId, studentId);
    const checkSessions = this.loadLearnerDailyObjectiveCheckSessions(schoolId, studentId);

    const items: Phase3DailyLearningFeedItem[] = [];

    const objectiveIds = new Set<string>();
    for (const card of progressCards) {
      objectiveIds.add(card.objectiveId);
    }
    for (const seed of seeds) {
      objectiveIds.add(seed.targetObjectiveId);
    }

    for (const objectiveId of objectiveIds) {
      const seed = seeds.find(s => s.targetObjectiveId === objectiveId);
      const sessions = checkSessions.filter(s => s.objectiveId === objectiveId);
      const activeSession = sessions.find(s =>
        ['started', 'in_progress', 'confidence_before_required', 'awaiting_teach_back', 'awaiting_transfer_check', 'awaiting_delayed_recall', 'awaiting_confidence_after', 'needs_recheck'].includes(s.status)
      );
      const completedSession = sessions.find(s => s.status === 'completed');
      const card = progressCards.find(c => c.objectiveId === objectiveId);

      const item = this.mergeObjectiveSeedAndCheckSignals(
        schoolId, studentId, objectiveId, card, seed, activeSession, completedSession, classId,
      );
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private loadLearnerObjectiveProgress(schoolId: string, studentId: string, classId?: string) {
    return phase3ObjectiveMasteryService.summarizeObjectiveProgressForLearner(schoolId, studentId, classId);
  }

  private loadLearnerDailySeeds(schoolId: string, studentId: string) {
    return phase3DailyObjectiveSeedService.listDailyObjectiveCheckSeedsForLearner(schoolId, studentId);
  }

  private loadLearnerDailyObjectiveCheckSessions(schoolId: string, studentId: string) {
    return phase3DailyObjectiveCheckRepository.listCheckSessionsByLearner(schoolId, studentId);
  }

  private mergeObjectiveSeedAndCheckSignals(
    schoolId: string,
    studentId: string,
    objectiveId: string,
    card?: any,
    seed?: any,
    activeSession?: any,
    completedSession?: any,
    classId?: string,
  ): Phase3DailyLearningFeedItem | null {
    const srcTruth = phase3DailyLearningFeedSourceTruthService.deriveSourceTruthFeedStatus(objectiveId);

    const base: Partial<Phase3DailyLearningFeedItem> = {
      feedItemId: generateFeedItemId(),
      schoolId,
      studentId,
      classId: classId || card?.objective?.classId || seed?.classId,
      subjectId: card ? undefined : seed?.subjectId,
      topicId: card ? undefined : seed?.topicId,
      skillId: card ? undefined : seed?.skillId,
      objectiveId,
      dailySeedId: seed?.seedId,
      checkSessionId: activeSession?.checkSessionId || completedSession?.checkSessionId,
      title: seed?.title || card?.title || 'Objective',
      safeDescription: seed?.safeDescription || card?.safeDescription || '',
      sourceTruthStatus: srcTruth.status,
      masteryStatus: card?.masteryStatus || seed?.reasonCode?.replace('status_', '') || 'not_started',
      dueAt: seed?.dueAt,
      estimatedTimeMinutes: seed?.estimatedTimeMinutes || card?.estimatedTimeMinutes || 10,
      safeEvidenceRefs: [],
      safeReasonCodes: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const masteryStatus = base.masteryStatus as string;

    if (!srcTruth.actionable) {
      const sourceItem = phase3DailyLearningFeedSourceTruthService.buildSourceRequiredFeedItem(objectiveId, schoolId, studentId);
      const blockedReasons: Phase3DailyLearningFeedReasonCode[] = ['source_required_status'];

      if (seed?.reasonCode === 'deen_boundary') {
        blockedReasons.push('deen_source_required');
      }

      return {
        ...base,
        ...sourceItem,
        feedItemId: generateFeedItemId(),
        learnerSafeReason: 'This objective needs an approved source or teacher confirmation before checks can continue.',
        safeReasonCodes: blockedReasons,
      } as Phase3DailyLearningFeedItem;
    }

    if (masteryStatus === 'needs_teacher_support') {
      return {
        ...base,
        itemType: 'teacher_support',
        priority: 'urgent',
        learnerSafeReason: 'This objective needs teacher support before you continue.',
        teacherSafeReason: 'Learner has persistent difficulty and needs teacher intervention.',
        nextAction: 'ask_teacher_for_help',
        checkStatus: activeSession?.status,
        safeReasonCodes: ['needs_teacher_support'],
      } as Phase3DailyLearningFeedItem;
    }

    if (masteryStatus === 'needs_rescue') {
      return {
        ...base,
        itemType: 'objective_rescue',
        priority: 'high',
        learnerSafeReason: 'This objective needs dedicated attention to get back on track.',
        teacherSafeReason: 'Learner has repeated weak signals and needs rescue intervention.',
        nextAction: 'start_daily_objective_check',
        modeDestination: 'focus',
        checkStatus: activeSession?.status,
        safeReasonCodes: ['needs_rescue_mastery'],
      } as Phase3DailyLearningFeedItem;
    }

    if (activeSession) {
      return this.buildActiveSessionItem(base, activeSession, seed);
    }

    if (completedSession && isToday(completedSession.completedAt || completedSession.updatedAt)) {
      return {
        ...base,
        itemType: 'completed_today',
        priority: 'low',
        learnerSafeReason: 'You completed this objective check today.',
        nextAction: 'no_action_needed',
        checkStatus: 'completed',
        modeDestination: 'none',
        safeReasonCodes: ['completed_today'],
      } as Phase3DailyLearningFeedItem;
    }

    if (seed && seed.completionStatus === 'pending') {
      return {
        ...base,
        itemType: 'objective_check',
        priority: this.derivePriorityFromMastery(masteryStatus),
        learnerSafeReason: 'This objective is ready for a short check.',
        teacherSafeReason: 'Daily seed is pending check.',
        nextAction: 'start_daily_objective_check',
        modeDestination: this.deriveModeDestination(masteryStatus),
        checkStatus: 'not_started',
        safeReasonCodes: ['pending_daily_seed'],
      } as Phase3DailyLearningFeedItem;
    }

    if (masteryStatus === 'almost_there' || masteryStatus === 'getting_better') {
      return {
        ...base,
        itemType: 'objective_recheck',
        priority: 'medium',
        learnerSafeReason: masteryStatus === 'almost_there'
          ? 'You are almost there — one more check will confirm your understanding.'
          : 'Keep going — a quick recheck will help solidify your understanding.',
        teacherSafeReason: 'Objective needs recheck for stabilization.',
        nextAction: 'start_daily_objective_check',
        modeDestination: 'quiz',
        checkStatus: 'needs_recheck',
        safeReasonCodes: masteryStatus === 'almost_there' ? ['almost_there_needs_recheck'] : ['getting_better_needs_recheck'],
      } as Phase3DailyLearningFeedItem;
    }

    if (masteryStatus === 'confident') {
      return {
        ...base,
        itemType: 'review_ready',
        priority: 'low',
        learnerSafeReason: 'You are confident here — a quick review will keep it fresh.',
        teacherSafeReason: 'Objective is confident and due for safe revisit.',
        nextAction: 'review_completed_objective',
        modeDestination: 'revision',
        checkStatus: 'completed',
        safeReasonCodes: ['confident_review_due'],
      } as Phase3DailyLearningFeedItem;
    }

    return null;
  }

  private buildActiveSessionItem(
    base: Partial<Phase3DailyLearningFeedItem>,
    activeSession: any,
    seed?: any,
  ): Phase3DailyLearningFeedItem {
    const completedSteps = new Set(activeSession.completedSteps || []);
    const requiredSteps = activeSession.requiredSteps || [];

    if (activeSession.status === 'confidence_before_required' || (!completedSteps.has('confidence_before') && requiredSteps.includes('confidence_before'))) {
      return {
        ...base,
        itemType: 'confidence_followup',
        priority: 'high',
        learnerSafeReason: 'Start by recording how confident you feel about this objective.',
        teacherSafeReason: 'Session awaiting confidence-before recording.',
        nextAction: 'record_confidence_before',
        checkStatus: activeSession.status,
        safeReasonCodes: ['awaiting_confidence_before'],
      } as Phase3DailyLearningFeedItem;
    }

    if (activeSession.status === 'awaiting_teach_back' || (!completedSteps.has('teach_back') && requiredSteps.includes('teach_back'))) {
      return {
        ...base,
        itemType: 'teach_back_required',
        priority: 'high',
        learnerSafeReason: 'Explain what you have learned in your own words.',
        teacherSafeReason: 'Teach-back step is required for this objective.',
        nextAction: 'complete_teach_back',
        modeDestination: 'teach_back',
        checkStatus: activeSession.status,
        safeReasonCodes: ['awaiting_teach_back'],
      } as Phase3DailyLearningFeedItem;
    }

    if (activeSession.status === 'awaiting_transfer_check' || (!completedSteps.has('transfer_check') && requiredSteps.includes('transfer_check'))) {
      return {
        ...base,
        itemType: 'transfer_check_required',
        priority: 'high',
        learnerSafeReason: 'Try applying what you have learned in a different context.',
        teacherSafeReason: 'Transfer check step is required for this objective.',
        nextAction: 'complete_transfer_check',
        checkStatus: activeSession.status,
        safeReasonCodes: ['awaiting_transfer_check'],
      } as Phase3DailyLearningFeedItem;
    }

    if (activeSession.status === 'awaiting_delayed_recall' || (!completedSteps.has('delayed_recall') && requiredSteps.includes('delayed_recall'))) {
      return {
        ...base,
        itemType: 'delayed_recall_required',
        priority: 'high',
        learnerSafeReason: 'Wait a moment and then recall what you learned about this objective.',
        teacherSafeReason: 'Delayed recall step is required for this objective.',
        nextAction: 'complete_delayed_recall',
        checkStatus: activeSession.status,
        safeReasonCodes: ['awaiting_delayed_recall'],
      } as Phase3DailyLearningFeedItem;
    }

    if (activeSession.status === 'awaiting_confidence_after' || (!completedSteps.has('confidence_after') && requiredSteps.includes('confidence_after'))) {
      return {
        ...base,
        itemType: 'confidence_followup',
        priority: 'medium',
        learnerSafeReason: 'Finish by recording how you feel about this objective now.',
        teacherSafeReason: 'Session awaiting confidence-after recording.',
        nextAction: 'record_confidence_after',
        checkStatus: activeSession.status,
        safeReasonCodes: ['awaiting_confidence_after'],
      } as Phase3DailyLearningFeedItem;
    }

    return {
      ...base,
      itemType: 'continue_check',
      priority: 'high',
      learnerSafeReason: 'Continue your check on this objective — it is in progress.',
      teacherSafeReason: 'Check session is in progress.',
      nextAction: 'continue_daily_objective_check',
      checkStatus: activeSession.status,
      safeReasonCodes: ['in_progress_check'],
    } as Phase3DailyLearningFeedItem;
  }

  getFeedItemById(schoolId: string, studentId: string, feedItemId: string): Phase3DailyLearningFeedItem | null {
    const feed = this.getLearnerDailyLearningFeed(schoolId, studentId);
    const allItems = [...feed.items, ...feed.blockedItems, ...feed.completedToday];
    return allItems.find(i => i.feedItemId === feedItemId) || null;
  }

  private derivePriorityFromMastery(masteryStatus?: string): 'low' | 'medium' | 'high' {
    switch (masteryStatus) {
      case 'needs_rescue':
      case 'needs_teacher_support':
        return 'high';
      case 'still_learning':
      case 'early_signal':
      case 'almost_there':
      case 'getting_better':
        return 'medium';
      case 'not_started':
      case 'confident':
      case 'source_required':
      default:
        return 'low';
    }
  }

  private deriveModeDestination(masteryStatus?: string): string {
    switch (masteryStatus) {
      case 'not_started': return 'focus';
      case 'early_signal': return 'quiz';
      case 'still_learning': return 'teach_back';
      case 'getting_better':
      case 'almost_there': return 'quiz';
      case 'confident': return 'revision';
      case 'needs_rescue': return 'focus';
      default: return 'none';
    }
  }

  resetForTests(): void {
    feedItemIdCounter = 0;
  }
}

export const phase3DailyLearningFeedService = new Phase3DailyLearningFeedService();
