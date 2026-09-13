import type {
  Phase3GrowthPage,
  Phase3GrowthPageLearnerView,
  Phase3GrowthPageCard,
  Phase3DueNowItem,
  Phase3WeakTopicLane,
  Phase3MistakeJournalReadModel,
  Phase3WhatHelpsMeLearnBestProfile,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageReadModelService } from './phase3GrowthPageReadModelService';
import { phase3GrowthPageDueNowService } from './phase3GrowthPageDueNowService';
import { phase3WeakTopicLaneService } from './phase3WeakTopicLaneService';
import { phase3MistakeJournalReadModelService } from './phase3MistakeJournalReadModelService';
import { phase3WhatHelpsMeLearnBestService } from './phase3WhatHelpsMeLearnBestService';

export class Phase3GrowthPageLearnerResponseService {
  buildLearnerGrowthPageView(schoolId: string, studentId: string): Phase3GrowthPageLearnerView {
    const page = phase3GrowthPageReadModelService.getLearnerGrowthPage(schoolId, studentId);
    return {
      schoolId: page.schoolId,
      studentId: page.studentId,
      generatedAt: page.generatedAt,
      safeHeadline: page.summary.safeHeadline,
      safeSummary: this.buildSafeSummary(page),
      dueNow: page.dueNow.map(i => this.buildDueNowCardView(i)),
      weakTopicLanes: page.weakTopicLanes.map(l => this.buildWeakTopicLaneView(l)),
      mistakeJournal: this.buildMistakeJournalView(page.mistakeJournal),
      whatHelpsMeLearnBest: page.whatHelpsMeLearnBest ? this.buildWhatHelpsMeLearnBestView(page.whatHelpsMeLearnBest) : undefined,
      recentlyImproving: page.recentlyImproving,
      cards: page.cards.map(c => this.buildGrowthPageCardView(c)),
      safeEvidenceRefs: page.safeEvidenceRefs,
      safeReasonCodes: page.safeReasonCodes,
      payloadSource: page.payloadSource,
    };
  }

  private buildSafeSummary(page: Phase3GrowthPage): string {
    const parts: string[] = [];
    if (page.summary.dueNowCount > 0) {
      parts.push(`You have ${page.summary.dueNowCount} item${page.summary.dueNowCount > 1 ? 's' : ''} ready for today.`);
    }
    if (page.summary.weakTopicLaneCount > 0) {
      parts.push(`${page.summary.weakTopicLaneCount} topic${page.summary.weakTopicLaneCount > 1 ? 's' : ''} could use a short review.`);
    }
    if (page.summary.mistakePatternCount > 0) {
      parts.push(`${page.summary.mistakePatternCount} pattern${page.summary.mistakePatternCount > 1 ? 's' : ''} might benefit from attention.`);
    }
    if (page.summary.sourceRequiredCount > 0) {
      parts.push(`${page.summary.sourceRequiredCount} item${page.summary.sourceRequiredCount > 1 ? 's' : ''} need${page.summary.sourceRequiredCount > 1 ? '' : 's'} an approved source.`);
    }
    if (parts.length === 0) parts.push('You are on track. Keep your momentum going.');
    return parts.join(' ');
  }

  buildGrowthPageCardView(card: Phase3GrowthPageCard): Phase3GrowthPageCard {
    return { ...card };
  }

  buildDueNowCardView(item: Phase3DueNowItem): Phase3DueNowItem {
    return { ...item };
  }

  buildWeakTopicLaneView(lane: Phase3WeakTopicLane): Phase3WeakTopicLane {
    const message = phase3WeakTopicLaneService.buildWeakTopicLaneLearnerMessage(lane);
    return { ...lane, safeSummary: message };
  }

  buildMistakeJournalView(journal: Phase3MistakeJournalReadModel): Phase3MistakeJournalReadModel {
    return {
      ...journal,
      entries: journal.entries.map(e => ({
        ...e,
        learnerSafeSummary: phase3MistakeJournalReadModelService.buildLearnerSafeMistakeMessage(e),
      })),
    };
  }

  buildWhatHelpsMeLearnBestView(profile: Phase3WhatHelpsMeLearnBestProfile): Phase3WhatHelpsMeLearnBestProfile {
    const message = phase3WhatHelpsMeLearnBestService.buildLearnerSafeHelpPatternSummary(profile);
    return { ...profile, safeSummary: message };
  }

  buildEmptyGrowthPageView(schoolId: string, studentId: string): Phase3GrowthPageLearnerView {
    const now = new Date().toISOString();
    return {
      schoolId,
      studentId,
      generatedAt: now,
      safeHeadline: 'Welcome to your growth page.',
      safeSummary: 'Your learning information will appear here as you progress.',
      dueNow: [],
      weakTopicLanes: [],
      mistakeJournal: { schoolId, studentId, entries: [], summary: 'No patterns yet.', totalPatterns: 0 },
      whatHelpsMeLearnBest: undefined,
      recentlyImproving: [],
      cards: [{
        cardId: 'empty',
        cardType: 'empty_state',
        priority: 'low',
        safeTitle: 'Getting started',
        safeSummary: 'Complete a daily objective check to see your growth information.',
        recommendedAction: 'no_action_needed',
        sourceType: 'objective_mastery',
        signalType: 'objective_not_started',
        safeEvidenceRefs: [],
        safeReasonCodes: [],
        createdAt: now,
      }],
      safeEvidenceRefs: [],
      safeReasonCodes: [],
      payloadSource: 'empty_safe',
    };
  }

  buildBlockedGrowthPageNotice(schoolId: string, studentId: string, reason: string): Phase3GrowthPageLearnerView {
    const now = new Date().toISOString();
    return {
      schoolId,
      studentId,
      generatedAt: now,
      safeHeadline: 'Some information is temporarily unavailable.',
      safeSummary: reason,
      dueNow: [],
      weakTopicLanes: [],
      mistakeJournal: { schoolId, studentId, entries: [], summary: 'Unavailable.', totalPatterns: 0 },
      recentlyImproving: [],
      cards: [],
      safeEvidenceRefs: [],
      safeReasonCodes: ['blocked'],
      payloadSource: 'empty_safe',
    };
  }
}

export const phase3GrowthPageLearnerResponseService = new Phase3GrowthPageLearnerResponseService();
