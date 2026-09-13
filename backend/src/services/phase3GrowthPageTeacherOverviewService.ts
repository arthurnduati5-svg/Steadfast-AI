import type {
  Phase3GrowthPageTeacherOverview,
  Phase3GrowthPageTeacherLearnerRow,
  Phase3GrowthPageTeacherTopicRow,
  Phase3GrowthPageTeacherQuery,
  Phase3GrowthPageCard,
  Phase3DueNowItem,
  Phase3WeakTopicLane,
  Phase3MistakeJournalEntry,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageDailyFeedAdapterService } from './phase3GrowthPageDailyFeedAdapterService';
import { phase3GrowthPageEvidenceAdapterService } from './phase3GrowthPageEvidenceAdapterService';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';
import { phase3GrowthPageStudyPlanAdapterService } from './phase3GrowthPageStudyPlanAdapterService';
import { phase3StudyPlanRepository } from './phase3StudyPlanRepository';

type LearnerSignals = {
  studentId: string;
  dueNow: Phase3DueNowItem[];
  weakLanes: Phase3WeakTopicLane[];
  mistakes: Phase3MistakeJournalEntry[];
  cards: Phase3GrowthPageCard[];
  evidenceRefs: string[];
};

function nowISO(): string { return new Date().toISOString(); }
function assertTeacherRole(query: Phase3GrowthPageTeacherQuery): void {
  if (!['teacher', 'admin', 'internal'].includes(query.role)) {
    throw Object.assign(new Error('Access denied. Teacher or admin role required.'), { name: 'Phase3GrowthPageAccessDenied', safeMessage: 'Access denied. Teacher or admin role required.' });
  }
}

export class Phase3GrowthPageTeacherOverviewService {
  getTeacherGrowthPageOverview(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherOverview {
    assertTeacherRole(query);
    const learnerRows = this.buildTeacherGrowthLearnerRows(query);
    const topicRows = this.buildTeacherGrowthTopicRows(query);
    const totals = learnerRows.reduce((acc, row) => {
      acc.totalDueNowItems += row.dueNowCount;
      acc.totalWeakTopicLanes += row.weakTopicLaneCount;
      acc.totalMistakePatterns += row.mistakePatternCount;
      acc.totalTeacherSupportNeeded += row.teacherSupportNeeded;
      acc.totalSourceRequired += row.sourceRequiredCount;
      return acc;
    }, {
      totalDueNowItems: 0,
      totalWeakTopicLanes: 0,
      totalMistakePatterns: 0,
      totalTeacherSupportNeeded: 0,
      totalSourceRequired: 0,
    });

    const activeLearners = learnerRows.filter(row =>
      row.dueNowCount + row.weakTopicLaneCount + row.mistakePatternCount + row.teacherSupportNeeded + row.sourceRequiredCount > 0
    ).length;

    return {
      schoolId: query.schoolId,
      teacherId: query.teacherId,
      classId: query.classId,
      subjectId: query.subjectId,
      generatedAt: nowISO(),
      totalLearnersWithGrowthSignals: activeLearners,
      ...totals,
      learnerRows,
      topicRows,
      safeSummary: activeLearners === 0
        ? 'No safe growth signals need teacher action right now.'
        : `${activeLearners} learner${activeLearners === 1 ? '' : 's'} have safe growth signals. ${totals.totalTeacherSupportNeeded} need teacher support and ${totals.totalSourceRequired} need source confirmation.`,
      recommendedTeacherActions: this.getTeacherRecommendedGrowthActions(query),
    };
  }

  getClassGrowthPageOverview(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherOverview {
    return this.getTeacherGrowthPageOverview(query);
  }

  getLearnerGrowthPageTeacherSummary(query: Phase3GrowthPageTeacherQuery, studentId: string): Phase3GrowthPageTeacherLearnerRow {
    assertTeacherRole(query);
    const signals = this.collectLearnerSignals(query, studentId);
    return this.toLearnerRow(signals);
  }

  getWeakTopicSupportQueue(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherLearnerRow[] {
    assertTeacherRole(query);
    return this.buildTeacherGrowthLearnerRows(query).filter(row => row.weakTopicLaneCount > 0 || row.teacherSupportNeeded > 0);
  }

  getMistakePatternClassSummary(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherTopicRow[] {
    assertTeacherRole(query);
    return this.buildTeacherGrowthTopicRows(query).filter(row => row.mistakePatternCount > 0);
  }

  getTeacherRecommendedGrowthActions(query: Phase3GrowthPageTeacherQuery): string[] {
    assertTeacherRole(query);
    const rows = this.buildTeacherGrowthLearnerRows(query);
    const actions: string[] = [];
    if (rows.some(r => r.teacherSupportNeeded > 0)) actions.push('Review learners who need teacher support before the next step.');
    if (rows.some(r => r.sourceRequiredCount > 0)) actions.push('Confirm approved sources for source-required growth items.');
    if (rows.some(r => r.weakTopicLaneCount > 0)) actions.push('Check weak topic lanes for short intervention opportunities.');
    if (rows.some(r => r.mistakePatternCount > 0)) actions.push('Review recurring mistake patterns by topic.');
    return actions.length ? actions : ['No urgent growth action is needed right now.'];
  }

  buildTeacherGrowthLearnerRows(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherLearnerRow[] {
    assertTeacherRole(query);
    return this.collectLearnerIds(query).map(studentId => this.toLearnerRow(this.collectLearnerSignals(query, studentId)));
  }

  buildTeacherGrowthTopicRows(query: Phase3GrowthPageTeacherQuery): Phase3GrowthPageTeacherTopicRow[] {
    assertTeacherRole(query);
    const topicMap = new Map<string, {
      topicId: string;
      skillId?: string;
      objectiveIds: Set<string>;
      learners: Set<string>;
      weakTopicCount: number;
      mistakePatternCount: number;
      teacherSupportCount: number;
      sourceRequiredCount: number;
      safeEvidenceRefs: Set<string>;
    }>();

    for (const studentId of this.collectLearnerIds(query)) {
      const signals = this.collectLearnerSignals(query, studentId);
      const cards = signals.cards;
      for (const lane of signals.weakLanes) this.addTopicSignal(topicMap, studentId, lane.topicId, lane.skillId, lane.objectiveIds, 'weak', lane.safeEvidenceRefs);
      for (const mistake of signals.mistakes) this.addTopicSignal(topicMap, studentId, mistake.topicId, mistake.skillId, mistake.objectiveId ? [mistake.objectiveId] : [], 'mistake', mistake.safeEvidenceRefs);
      for (const card of cards) {
        if (card.cardType === 'teacher_support_needed') this.addTopicSignal(topicMap, studentId, card.topicId, card.skillId, card.objectiveId ? [card.objectiveId] : [], 'teacher', card.safeEvidenceRefs);
        if (card.cardType === 'source_required') this.addTopicSignal(topicMap, studentId, card.topicId, card.skillId, card.objectiveId ? [card.objectiveId] : [], 'source', card.safeEvidenceRefs);
      }
    }

    return Array.from(topicMap.values()).map(row => ({
      topicId: row.topicId,
      skillId: row.skillId,
      objectiveIds: Array.from(row.objectiveIds),
      learnersAffectedCount: row.learners.size,
      weakTopicCount: row.weakTopicCount,
      mistakePatternCount: row.mistakePatternCount,
      teacherSupportCount: row.teacherSupportCount,
      sourceRequiredCount: row.sourceRequiredCount,
      safePatternSummary: `${row.learners.size} learner${row.learners.size === 1 ? '' : 's'} affected by safe topic signals.`,
      recommendedTeacherAction: row.teacherSupportCount > 0
        ? 'Provide short teacher support.'
        : row.sourceRequiredCount > 0
        ? 'Confirm source/context before learner action.'
        : 'Monitor and revisit in class support.',
      safeEvidenceRefs: Array.from(row.safeEvidenceRefs),
    }));
  }

  private collectLearnerIds(query: Phase3GrowthPageTeacherQuery): string[] {
    const ids = new Set<string>();
    for (const page of phase3GrowthPageRepository.listGrowthPageSnapshotsForSchool(query.schoolId)) {
      if (this.matchesQuery(query, page)) ids.add(page.studentId);
    }
    for (const item of phase3GrowthPageRepository.listDueNowItemsForSchool(query.schoolId)) {
      if (this.matchesQuery(query, item)) ids.add(item.studentId);
    }
    for (const lane of phase3GrowthPageRepository.listWeakTopicLanesForSchool(query.schoolId)) {
      if (this.matchesQuery(query, lane)) ids.add(lane.studentId);
    }
    for (const mistake of phase3GrowthPageRepository.listMistakeJournalEntriesForSchool(query.schoolId)) {
      if (this.matchesQuery(query, mistake)) ids.add(mistake.studentId);
    }
    for (const plan of phase3StudyPlanRepository.listTeacherStudyPlanOverviews(query.schoolId)) {
      if (this.matchesQuery(query, plan)) ids.add(plan.studentId);
    }
    return Array.from(ids).sort();
  }

  private collectLearnerSignals(query: Phase3GrowthPageTeacherQuery, studentId: string): LearnerSignals {
    const dueNow = phase3GrowthPageRepository.listDueNowItemsForLearner(query.schoolId, studentId).filter(item => !item.isCompleted && this.matchesQuery(query, item));
    const weakLanes = phase3GrowthPageRepository.listWeakTopicLanesForLearner(query.schoolId, studentId).filter(lane => this.matchesQuery(query, lane));
    const mistakes = phase3GrowthPageRepository.listMistakeJournalEntriesForLearner(query.schoolId, studentId).filter(entry => this.matchesQuery(query, entry));
    const daily = phase3GrowthPageDailyFeedAdapterService.loadDailyFeedForGrowthPage(query.schoolId, studentId);
    const study = phase3GrowthPageStudyPlanAdapterService.loadStudyPlansForGrowthPage(query.schoolId, studentId);
    const cards = [...daily.feedCards, ...daily.sourceRequiredCards, ...daily.teacherSupportCards, ...study.planCards, ...study.blockedCards]
      .filter(card => this.matchesQuery(query, card));
    const evidence = phase3GrowthPageEvidenceAdapterService.collectSafeEvidenceForGrowthPage({ schoolId: query.schoolId, studentId });
    return {
      studentId,
      dueNow: [...dueNow, ...daily.dueNowItems, ...study.dueNowItems],
      weakLanes,
      mistakes,
      cards,
      evidenceRefs: evidence.evidenceRefs,
    };
  }

  private toLearnerRow(signals: LearnerSignals): Phase3GrowthPageTeacherLearnerRow {
    const teacherSupportNeeded = signals.cards.filter(card => card.cardType === 'teacher_support_needed').length +
      signals.dueNow.filter(item => item.signalType === 'teacher_support_required').length +
      signals.weakLanes.filter(lane => lane.status === 'needs_teacher_support').length;
    const sourceRequiredCount = signals.cards.filter(card => card.cardType === 'source_required').length +
      signals.dueNow.filter(item => item.signalType === 'source_required').length +
      signals.weakLanes.filter(lane => lane.status === 'source_required').length;
    return {
      studentId: signals.studentId,
      dueNowCount: signals.dueNow.length,
      weakTopicLaneCount: signals.weakLanes.length,
      mistakePatternCount: signals.mistakes.length,
      teacherSupportNeeded,
      sourceRequiredCount,
      safePatternSummary: this.safeLearnerSummary(signals, teacherSupportNeeded, sourceRequiredCount),
      recommendedTeacherAction: teacherSupportNeeded > 0
        ? 'Offer short teacher support before the learner continues.'
        : sourceRequiredCount > 0
        ? 'Confirm approved source/context before learner action.'
        : signals.weakLanes.length > 0
        ? 'Assign a short revisit for weak topic lanes.'
        : 'Monitor progress.',
      safeEvidenceRefs: Array.from(new Set(signals.evidenceRefs)),
    };
  }

  private safeLearnerSummary(signals: LearnerSignals, teacherSupportNeeded: number, sourceRequiredCount: number): string {
    if (teacherSupportNeeded > 0) return 'Learner has safe signals needing teacher support.';
    if (sourceRequiredCount > 0) return 'Learner has growth items waiting for approved source/context.';
    if (signals.weakLanes.length > 0) return 'Learner has weak topic signals that may benefit from a short revisit.';
    if (signals.mistakes.length > 0) return 'Learner has recurring mistake patterns to review.';
    if (signals.dueNow.length > 0) return 'Learner has due-now growth items ready.';
    return 'No safe growth signals need action right now.';
  }

  private addTopicSignal(
    topicMap: Map<string, any>,
    studentId: string,
    topicId: string | undefined,
    skillId: string | undefined,
    objectiveIds: string[],
    kind: 'weak' | 'mistake' | 'teacher' | 'source',
    evidenceRefs: string[],
  ): void {
    const key = topicId || objectiveIds[0] || 'unknown_topic';
    if (!topicMap.has(key)) {
      topicMap.set(key, {
        topicId: key,
        skillId,
        objectiveIds: new Set<string>(),
        learners: new Set<string>(),
        weakTopicCount: 0,
        mistakePatternCount: 0,
        teacherSupportCount: 0,
        sourceRequiredCount: 0,
        safeEvidenceRefs: new Set<string>(),
      });
    }
    const row = topicMap.get(key)!;
    row.learners.add(studentId);
    for (const objectiveId of objectiveIds) row.objectiveIds.add(objectiveId);
    for (const ref of evidenceRefs) row.safeEvidenceRefs.add(ref);
    if (kind === 'weak') row.weakTopicCount += 1;
    if (kind === 'mistake') row.mistakePatternCount += 1;
    if (kind === 'teacher') row.teacherSupportCount += 1;
    if (kind === 'source') row.sourceRequiredCount += 1;
  }

  private matchesQuery(query: Phase3GrowthPageTeacherQuery, item: object): boolean {
    const scoped = item as { schoolId?: string; classId?: string; subjectId?: string };
    if (scoped.schoolId && scoped.schoolId !== query.schoolId) return false;
    if (query.classId && scoped.classId && scoped.classId !== query.classId) return false;
    if (query.subjectId && scoped.subjectId && scoped.subjectId !== query.subjectId) return false;
    return true;
  }
}

export const phase3GrowthPageTeacherOverviewService = new Phase3GrowthPageTeacherOverviewService();
