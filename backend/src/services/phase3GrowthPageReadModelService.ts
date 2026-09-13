import type {
  Phase3GrowthPage,
  Phase3GrowthPageCard,
  Phase3GrowthPageSummary,
  Phase3GrowthPageCardType,
  Phase3GrowthPagePriority,
  Phase3GrowthPageAction,
  Phase3GrowthPageSourceType,
  Phase3GrowthPageSignalType,
  Phase3DueNowItem,
  Phase3WeakTopicLane,
  Phase3MistakeJournalEntry,
  Phase3MistakeJournalReadModel,
  Phase3WhatHelpsMeLearnBestProfile,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';
import { phase3GrowthPageDueNowService } from './phase3GrowthPageDueNowService';
import { phase3WeakTopicLaneService } from './phase3WeakTopicLaneService';
import { phase3MistakeJournalReadModelService } from './phase3MistakeJournalReadModelService';
import { phase3WhatHelpsMeLearnBestService } from './phase3WhatHelpsMeLearnBestService';
import { phase3GrowthPageDailyFeedAdapterService } from './phase3GrowthPageDailyFeedAdapterService';
import { phase3GrowthPageEvidenceAdapterService } from './phase3GrowthPageEvidenceAdapterService';
import { phase3GrowthPageStudyPlanAdapterService } from './phase3GrowthPageStudyPlanAdapterService';

let cardCounter = 0;
function generateCardId(): string {
  return `gpc_${Date.now().toString(36)}_${(++cardCounter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

export class Phase3GrowthPageReadModelService {
  getLearnerGrowthPage(schoolId: string, studentId: string): Phase3GrowthPage {
    return this.buildGrowthPageReadModel(schoolId, studentId);
  }

  buildGrowthPageReadModel(schoolId: string, studentId: string): Phase3GrowthPage {
    const evidence = phase3GrowthPageEvidenceAdapterService.collectSafeEvidenceForGrowthPage({ schoolId, studentId });
    const dailyFeed = phase3GrowthPageDailyFeedAdapterService.loadDailyFeedForGrowthPage(schoolId, studentId);
    const studyPlans = phase3GrowthPageStudyPlanAdapterService.loadStudyPlansForGrowthPage(schoolId, studentId);
    const dueNowItems = phase3GrowthPageDueNowService.dedupeDueNowItems([
      ...phase3GrowthPageDueNowService.getDueNowItemsForLearner(schoolId, studentId),
      ...dailyFeed.dueNowItems,
      ...studyPlans.dueNowItems,
    ]);
    const weakTopicLanes = phase3WeakTopicLaneService.detectWeakTopicLanes(schoolId, studentId);
    const mistakeJournal = phase3MistakeJournalReadModelService.buildMistakeJournalReadModel(schoolId, studentId);
    const helpProfile = phase3WhatHelpsMeLearnBestService.buildWhatHelpsMeLearnBestProfile(schoolId, studentId);
    const recentlyImproving = [
      ...this.buildRecentlyImprovingCards(schoolId, studentId),
      ...dailyFeed.feedCards.filter(card => card.cardType === 'recently_improving'),
      ...studyPlans.planCards.filter(card => card.cardType === 'recently_improving'),
    ];
    const adapterCards = [
      ...dailyFeed.feedCards.filter(card => card.cardType !== 'recently_improving'),
      ...dailyFeed.sourceRequiredCards,
      ...dailyFeed.teacherSupportCards,
      ...studyPlans.planCards.filter(card => card.cardType !== 'recently_improving'),
      ...studyPlans.blockedCards,
    ];
    const cards = this.assembleGrowthPageCards(schoolId, studentId, dueNowItems, weakTopicLanes, mistakeJournal, helpProfile, recentlyImproving, adapterCards);
    const summary = this.buildGrowthPageSummary(dueNowItems, weakTopicLanes, mistakeJournal, recentlyImproving, cards);
    const safeEvidenceRefs = Array.from(new Set([...evidence.evidenceRefs, ...cards.flatMap(c => c.safeEvidenceRefs), ...dueNowItems.flatMap(i => i.safeEvidenceRefs)]));
    const safeReasonCodes = Array.from(new Set([...evidence.reasonCodes, ...cards.flatMap(c => c.safeReasonCodes), ...dueNowItems.flatMap(i => i.safeReasonCodes)]));
    const hasLiveSignals = safeEvidenceRefs.length > 0 || dueNowItems.length > 0 || weakTopicLanes.length > 0 || mistakeJournal.totalPatterns > 0 || adapterCards.length > 0 || recentlyImproving.length > 0;

    const page: Phase3GrowthPage = {
      schoolId,
      studentId,
      generatedAt: nowISO(),
      summary,
      dueNow: dueNowItems,
      weakTopicLanes,
      mistakeJournal,
      whatHelpsMeLearnBest: helpProfile ?? undefined,
      recentlyImproving,
      cards,
      safeEvidenceRefs,
      safeReasonCodes,
      payloadSource: hasLiveSignals ? 'live_safe_evidence' : 'empty_safe',
    };

    phase3GrowthPageRepository.upsertGrowthPageSnapshot(page);
    return page;
  }

  assembleGrowthPageCards(
    schoolId: string,
    studentId: string,
    dueNow: Phase3DueNowItem[],
    weakLanes: Phase3WeakTopicLane[],
    mistakeJournal: Phase3MistakeJournalReadModel,
    helpProfile: Phase3WhatHelpsMeLearnBestProfile | null,
    recentlyImproving: Phase3GrowthPageCard[],
    adapterCards: Phase3GrowthPageCard[] = [],
  ): Phase3GrowthPageCard[] {
    const cards: Phase3GrowthPageCard[] = [...adapterCards];

    for (const item of dueNow) {
      cards.push({
        cardId: generateCardId(),
        cardType: 'due_now',
        priority: item.priority,
        safeTitle: item.safeTitle,
        safeSummary: item.safeSummary,
        recommendedAction: item.recommendedAction,
        sourceType: item.sourceType,
        signalType: item.signalType,
        objectiveId: item.objectiveId,
        topicId: item.topicId,
        skillId: item.skillId,
        dueNowItemId: item.dueNowItemId,
        studyPlanId: item.studyPlanId,
        safeEvidenceRefs: item.safeEvidenceRefs,
        safeReasonCodes: item.safeReasonCodes,
        createdAt: item.createdAt,
      });
    }

    for (const lane of weakLanes) {
      cards.push({
        cardId: generateCardId(),
        cardType: 'weak_topic_lane',
        priority: lane.priority,
        safeTitle: lane.safeTitle,
        safeSummary: lane.safeSummary,
        recommendedAction: lane.recommendedAction,
        sourceType: 'daily_objective_check',
        signalType: 'weak_topic_repeated',
        topicId: lane.topicId,
        skillId: lane.skillId,
        laneId: lane.laneId,
        safeEvidenceRefs: lane.safeEvidenceRefs,
        safeReasonCodes: lane.safeReasonCodes,
        createdAt: lane.createdAt,
      });
    }

    for (const entry of mistakeJournal.entries) {
      cards.push({
        cardId: generateCardId(),
        cardType: 'mistake_pattern',
        priority: entry.priority,
        safeTitle: entry.safeTitle,
        safeSummary: entry.learnerSafeSummary,
        recommendedAction: entry.recommendedAction,
        sourceType: 'daily_objective_check',
        signalType: 'mistake_pattern_repeated',
        topicId: entry.topicId,
        skillId: entry.skillId,
        mistakeEntryId: entry.mistakeEntryId,
        safeEvidenceRefs: entry.safeEvidenceRefs,
        safeReasonCodes: entry.safeReasonCodes,
        createdAt: entry.createdAt,
      });
    }

    if (helpProfile && helpProfile.topPatterns.length > 0) {
      cards.push({
        cardId: generateCardId(),
        cardType: 'what_helps_me_learn_best',
        priority: 'low',
        safeTitle: 'What helps me learn best',
        safeSummary: helpProfile.safeSummary,
        recommendedAction: 'no_action_needed',
        sourceType: 'daily_objective_check',
        signalType: 'learning_help_pattern_detected',
        safeEvidenceRefs: helpProfile.safeEvidenceRefs,
        safeReasonCodes: helpProfile.safeReasonCodes,
        createdAt: helpProfile.updatedAt,
      });
    }

    cards.push(...recentlyImproving);

    if (cards.length === 0) {
      cards.push({
        cardId: generateCardId(),
        cardType: 'empty_state',
        priority: 'low',
        safeTitle: 'Your growth page',
        safeSummary: 'Your growth information will appear here as you learn.',
        recommendedAction: 'no_action_needed',
        sourceType: 'objective_mastery',
        signalType: 'objective_not_started',
        safeEvidenceRefs: [],
        safeReasonCodes: [],
        createdAt: nowISO(),
      });
    }

    return this.rankGrowthPageCards(this.dedupeGrowthPageCards(cards));
  }

  buildGrowthPageSummary(
    dueNow: Phase3DueNowItem[],
    weakLanes: Phase3WeakTopicLane[],
    mistakeJournal: Phase3MistakeJournalReadModel,
    recentlyImproving: Phase3GrowthPageCard[],
    cards: Phase3GrowthPageCard[],
  ): Phase3GrowthPageSummary {
    const sourceRequired = cards.filter(c => c.cardType === 'source_required').length;
    const teacherSupport = cards.filter(c => c.cardType === 'teacher_support_needed').length;
    const headline = this.buildHeadline(dueNow.length, weakLanes.length, mistakeJournal.totalPatterns);
    return {
      totalCards: cards.length,
      dueNowCount: dueNow.length,
      weakTopicLaneCount: weakLanes.length,
      mistakePatternCount: mistakeJournal.totalPatterns,
      recentlyImprovingCount: recentlyImproving.length,
      sourceRequiredCount: sourceRequired,
      teacherSupportCount: teacherSupport,
      safeHeadline: headline,
    };
  }

  private buildHeadline(dueNowCount: number, weakCount: number, mistakeCount: number): string {
    if (dueNowCount > 0) return `You have ${dueNowCount} item${dueNowCount > 1 ? 's' : ''} to focus on.`;
    if (weakCount > 0) return `Some topics could use a short review.`;
    if (mistakeCount > 0) return `Reviewing past patterns may help.`;
    return `You are on track. Keep your momentum going.`;
  }

  buildRecentlyImprovingCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return [];
  }

  buildObjectiveProgressCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return [];
  }

  buildSourceRequiredCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return [];
  }

  buildTeacherSupportCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return [];
  }

  dedupeGrowthPageCards(cards: Phase3GrowthPageCard[]): Phase3GrowthPageCard[] {
    const seen = new Map<string, Phase3GrowthPageCard>();
    for (const card of cards) {
      const key = `${card.cardType}:${card.objectiveId ?? ''}:${card.topicId ?? ''}:${card.recommendedAction}`;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (this.priorityRank(card.priority) < this.priorityRank(existing.priority)) {
          seen.set(key, card);
        }
      } else {
        seen.set(key, card);
      }
    }
    return Array.from(seen.values());
  }

  private priorityRank(p: Phase3GrowthPagePriority): number {
    const ranks: Record<Phase3GrowthPagePriority, number> = { urgent: 0, blocked: 1, high: 2, medium: 3, low: 4 };
    return ranks[p] ?? 5;
  }

  rankGrowthPageCards(cards: Phase3GrowthPageCard[]): Phase3GrowthPageCard[] {
    const typeOrder: Record<Phase3GrowthPageCardType, number> = {
      teacher_support_needed: 0,
      source_required: 1,
      due_now: 2,
      weak_topic_lane: 3,
      mistake_pattern: 4,
      recently_improving: 5,
      study_plan_due: 6,
      daily_feed_item: 7,
      objective_progress: 8,
      what_helps_me_learn_best: 9,
      empty_state: 10,
    };
    return [...cards].sort((a, b) => {
      const typeDiff = (typeOrder[a.cardType] ?? 99) - (typeOrder[b.cardType] ?? 99);
      if (typeDiff !== 0) return typeDiff;
      return this.priorityRank(a.priority) - this.priorityRank(b.priority);
    });
  }

  limitGrowthPageCards(cards: Phase3GrowthPageCard[], max: number = 20): Phase3GrowthPageCard[] {
    return cards.slice(0, max);
  }
}

export const phase3GrowthPageReadModelService = new Phase3GrowthPageReadModelService();
