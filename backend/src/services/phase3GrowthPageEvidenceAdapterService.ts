import type {
  Phase3GrowthPageEvidenceAdapterInput,
  Phase3GrowthPageEvidenceAdapterResult,
} from '../contracts/phase3GrowthPageContracts';
import { PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS } from '../contracts/phase3GrowthPageContracts';
import { phase3DailyLearningFeedService } from './phase3DailyLearningFeedService';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';
import { phase3StudyPlanRepository } from './phase3StudyPlanRepository';

type SafeSignal = {
  ref?: string;
  reasonCodes?: string[];
  sourceTruthStatus?: string;
  signalType: string;
  updatedAt?: string;
  createdAt?: string;
};

const safeReasonPattern = /^[a-z0-9_:-]+$/i;
const emptyResult: Phase3GrowthPageEvidenceAdapterResult = {
  evidenceRefs: [],
  reasonCodes: ['empty_safe'],
  hasRecentEvidence: false,
  evidenceSummary: 'No safe growth evidence is available yet.',
  sourceTruthStatus: 'empty_safe',
  signalCounts: {},
};

function isRecent(iso?: string): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= 1000 * 60 * 60 * 24 * 14;
}

function latestIso(values: Array<string | undefined>): string | undefined {
  return values.filter(Boolean).sort().pop();
}

export class Phase3GrowthPageEvidenceAdapterService {
  collectSafeEvidenceForGrowthPage(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };

    const signals = [
      ...this.collectObjectiveSignals(input),
      ...this.collectDailyCheckSignals(input),
      ...this.collectStudyPlanSignals(input),
      ...this.collectRevisionSignals(input),
      ...this.collectMistakeSignals(input),
    ];

    return this.normalizeSignals(signals);
  }

  normalizeObjectiveEvidenceForGrowth(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };
    return this.normalizeSignals(this.collectObjectiveSignals(input));
  }

  normalizeDailyCheckEvidenceForGrowth(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };
    return this.normalizeSignals(this.collectDailyCheckSignals(input));
  }

  normalizeStudyPlanEvidenceForGrowth(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };
    return this.normalizeSignals(this.collectStudyPlanSignals(input));
  }

  normalizeRevisionEvidenceForGrowth(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };
    return this.normalizeSignals(this.collectRevisionSignals(input));
  }

  normalizeMistakeEvidenceForGrowth(input: Phase3GrowthPageEvidenceAdapterInput): Phase3GrowthPageEvidenceAdapterResult {
    if (!this.isSameLearnerRequest(input)) return { ...emptyResult, reasonCodes: ['school_identity_boundary'], sourceTruthStatus: 'blocked' };
    return this.normalizeSignals(this.collectMistakeSignals(input));
  }

  buildGrowthPageSafeEvidenceRefs(schoolId: string, studentId: string, refs: string[]): string[] {
    const prefix = `${schoolId}:${studentId}:evt:`;
    return Array.from(new Set(refs.filter(Boolean).map(r => r.startsWith(prefix) ? r : `${prefix}${r}`)));
  }

  filterUnsafeGrowthEvidence<T>(items: T[]): T[] {
    return items.map(item => this.stripForbiddenFields(item) as T);
  }

  private isSameLearnerRequest(input: Phase3GrowthPageEvidenceAdapterInput): boolean {
    if (input.requesterSchoolId && input.requesterSchoolId !== input.schoolId) return false;
    if (input.requesterStudentId && input.requesterStudentId !== input.studentId) return false;
    return Boolean(input.schoolId && input.studentId);
  }

  private collectObjectiveSignals(input: Phase3GrowthPageEvidenceAdapterInput): SafeSignal[] {
    const dueNow = phase3GrowthPageRepository.listDueNowItemsForLearner(input.schoolId, input.studentId)
      .filter(item => this.matchesScope(input, item));
    const weakLanes = phase3GrowthPageRepository.listWeakTopicLanesForLearner(input.schoolId, input.studentId)
      .filter(lane => this.matchesScope(input, lane));
    return [
      ...dueNow.map(item => ({
        ref: item.safeEvidenceRefs[0] || item.dueNowItemId,
        reasonCodes: item.safeReasonCodes,
        sourceTruthStatus: item.signalType === 'source_required' ? 'source_required' : 'approved',
        signalType: item.signalType,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      })),
      ...weakLanes.map(lane => ({
        ref: lane.safeEvidenceRefs[0] || lane.laneId,
        reasonCodes: lane.safeReasonCodes,
        sourceTruthStatus: lane.status === 'source_required' ? 'source_required' : 'approved',
        signalType: 'weak_topic_repeated',
        updatedAt: lane.updatedAt,
        createdAt: lane.createdAt,
      })),
    ];
  }

  private collectDailyCheckSignals(input: Phase3GrowthPageEvidenceAdapterInput): SafeSignal[] {
    const feed = phase3DailyLearningFeedService.getLearnerDailyLearningFeed(input.schoolId, input.studentId);
    const allItems = [...feed.items, ...feed.blockedItems, ...feed.completedToday]
      .filter(item => this.matchesScope(input, item));
    return allItems.map(item => ({
      ref: item.safeEvidenceRefs[0] || item.feedItemId,
      reasonCodes: item.safeReasonCodes,
      sourceTruthStatus: item.sourceTruthStatus,
      signalType: item.itemType,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
    }));
  }

  private collectStudyPlanSignals(input: Phase3GrowthPageEvidenceAdapterInput): SafeSignal[] {
    const plans = phase3StudyPlanRepository.listStudyPlansForLearner(input.schoolId, input.studentId)
      .filter(plan => this.matchesScope(input, plan));
    const signals: SafeSignal[] = [];
    for (const plan of plans) {
      signals.push({
        ref: plan.safeEvidenceRefs[0] || plan.planId,
        reasonCodes: plan.safeReasonCodes,
        sourceTruthStatus: plan.sourceTruthStatus,
        signalType: `study_plan_${plan.status}`,
        updatedAt: plan.updatedAt,
        createdAt: plan.createdAt,
      });
      for (const step of phase3StudyPlanRepository.listStudyPlanSteps(plan.planId)) {
        if (step.schoolId !== input.schoolId) continue;
        signals.push({
          ref: step.safeEvidenceRefs[0] || step.stepId,
          reasonCodes: step.reasonCode ? [step.reasonCode] : [],
          sourceTruthStatus: step.sourceTruthStatus,
          signalType: `study_plan_step_${step.status}`,
          updatedAt: step.updatedAt,
          createdAt: step.createdAt,
        });
      }
    }
    return signals;
  }

  private collectRevisionSignals(input: Phase3GrowthPageEvidenceAdapterInput): SafeSignal[] {
    const pages = phase3GrowthPageRepository.listGrowthPageSnapshotsForLearner(input.schoolId, input.studentId);
    return pages.flatMap(page => page.cards
      .filter(card => card.sourceType === 'revision_due_adapter')
      .map(card => ({
        ref: card.safeEvidenceRefs[0] || card.cardId,
        reasonCodes: card.safeReasonCodes,
        sourceTruthStatus: card.signalType === 'source_required' ? 'source_required' : 'learner_created_visible',
        signalType: card.signalType,
        createdAt: card.createdAt,
      })));
  }

  private collectMistakeSignals(input: Phase3GrowthPageEvidenceAdapterInput): SafeSignal[] {
    return phase3GrowthPageRepository.listMistakeJournalEntriesForLearner(input.schoolId, input.studentId)
      .filter(entry => this.matchesScope(input, entry))
      .map(entry => ({
        ref: entry.safeEvidenceRefs[0] || entry.mistakeEntryId,
        reasonCodes: entry.safeReasonCodes,
        sourceTruthStatus: entry.patternType === 'source_context_gap' ? 'source_required' : 'approved',
        signalType: entry.patternType,
        updatedAt: entry.updatedAt,
        createdAt: entry.createdAt,
      }));
  }

  private normalizeSignals(signals: SafeSignal[]): Phase3GrowthPageEvidenceAdapterResult {
    const cleanSignals = this.filterUnsafeGrowthEvidence(signals).filter(Boolean);
    if (cleanSignals.length === 0) return { ...emptyResult, signalCounts: {} };

    const rawRefs = cleanSignals.map(s => s.ref).filter(Boolean) as string[];
    const reasonCodes = Array.from(new Set(cleanSignals.flatMap(s => s.reasonCodes || [])
      .filter(code => safeReasonPattern.test(code))));
    const signalCounts: Record<string, number> = {};
    for (const signal of cleanSignals) {
      signalCounts[signal.signalType] = (signalCounts[signal.signalType] || 0) + 1;
    }
    const lastSignalAt = latestIso(cleanSignals.map(s => s.updatedAt || s.createdAt));
    const hasBlocked = cleanSignals.some(s => ['source_required', 'blocked', 'content_gap', 'unknown'].includes(String(s.sourceTruthStatus)));

    return {
      evidenceRefs: Array.from(new Set(rawRefs)),
      reasonCodes: reasonCodes.length ? reasonCodes : ['safe_growth_signal'],
      hasRecentEvidence: cleanSignals.some(s => isRecent(s.updatedAt || s.createdAt)),
      evidenceSummary: `${cleanSignals.length} safe growth signal${cleanSignals.length === 1 ? '' : 's'} available from accepted learning systems.`,
      sourceTruthStatus: hasBlocked ? 'source_required' : 'approved',
      signalCounts,
      lastSignalAt,
    };
  }

  private matchesScope(input: Phase3GrowthPageEvidenceAdapterInput, item: { schoolId?: string; studentId?: string; topicId?: string; skillId?: string; objectiveId?: string }): boolean {
    if (item.schoolId && item.schoolId !== input.schoolId) return false;
    if (item.studentId && item.studentId !== input.studentId) return false;
    if (input.topicId && item.topicId && item.topicId !== input.topicId) return false;
    if (input.skillId && item.skillId && item.skillId !== input.skillId) return false;
    return true;
  }

  private stripForbiddenFields(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(v => this.stripForbiddenFields(v));
    if (!value || typeof value !== 'object') return value;
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if ((PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS as readonly string[]).includes(key)) continue;
      result[key] = this.stripForbiddenFields(nested);
    }
    return result;
  }
}

export const phase3GrowthPageEvidenceAdapterService = new Phase3GrowthPageEvidenceAdapterService();
