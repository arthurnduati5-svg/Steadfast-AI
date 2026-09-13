import type {
  Phase3DailyLearningFeedItem,
  Phase3DailyLearningFeedTeacherOverview,
  Phase3DailyLearningFeedObjectiveRow,
} from '../contracts/phase3DailyLearningFeedContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';
import { phase3DailyLearningFeedAuditService } from './phase3DailyLearningFeedAuditService';

function nowISO(): string {
  return new Date().toISOString();
}

export class Phase3DailyLearningFeedTeacherOverviewService {
  getTeacherDailyLearningOverview(
    schoolId: string,
    teacherId: string,
    classId?: string,
    subjectId?: string,
  ): Phase3DailyLearningFeedTeacherOverview {
    const objectiveRows = this.buildClassDailyObjectiveOverview(schoolId, teacherId, classId);
    const supportCounts = this.buildTeacherSafeSupportCounts(objectiveRows);
    const recommendedActions = this.buildTeacherRecommendedActions(objectiveRows);

    phase3DailyLearningFeedAuditService.recordTeacherOverviewViewed(
      schoolId, teacherId, 'teacher', classId,
    );

    return {
      schoolId,
      teacherId,
      classId,
      subjectId,
      generatedAt: nowISO(),
      totalLearnersWithItems: this.computeTotalLearnersWithItems(objectiveRows),
      totalActionableItems: supportCounts.totalActionableItems,
      totalSourceRequiredItems: supportCounts.totalSourceRequiredItems,
      totalTeacherSupportItems: supportCounts.totalTeacherSupportItems,
      totalRescueItems: supportCounts.totalRescueItems,
      totalCompletedTodayItems: supportCounts.totalCompletedTodayItems,
      objectiveRows,
      safeSummary: this.buildSafeSummary(objectiveRows),
      recommendedTeacherActions: recommendedActions,
    };
  }

  buildClassDailyObjectiveOverview(
    schoolId: string,
    teacherId: string,
    classId?: string,
  ): Phase3DailyLearningFeedObjectiveRow[] {
    const objectives = phase3ObjectiveRepository.listObjectivesByTeacher(schoolId, teacherId);
    if (classId) {
      const filtered = objectives.filter(o => o.classId === classId);
      return this.buildObjectiveRows(schoolId, filtered, classId);
    }
    return this.buildObjectiveRows(schoolId, objectives, classId);
  }

  buildTeacherSafeObjectiveQueueSummary(
    schoolId: string,
    teacherId: string,
    classId?: string,
  ): Phase3DailyLearningFeedObjectiveRow[] {
    return this.buildClassDailyObjectiveOverview(schoolId, teacherId, classId);
  }

  buildTeacherSafeSupportCounts(rows: Phase3DailyLearningFeedObjectiveRow[]): {
    totalActionableItems: number;
    totalSourceRequiredItems: number;
    totalTeacherSupportItems: number;
    totalRescueItems: number;
    totalCompletedTodayItems: number;
  } {
    return {
      totalActionableItems: rows.reduce((sum, r) => sum + r.pendingCheckCount + r.inProgressCheckCount + r.needsRecheckCount, 0),
      totalSourceRequiredItems: rows.reduce((sum, r) => sum + r.sourceRequiredCount, 0),
      totalTeacherSupportItems: rows.reduce((sum, r) => sum + r.teacherSupportCount, 0),
      totalRescueItems: rows.reduce((sum, r) => sum + r.needsRescueCount, 0),
      totalCompletedTodayItems: rows.reduce((sum, r) => sum + r.completedTodayCount, 0),
    };
  }

  buildTeacherRecommendedActions(rows: Phase3DailyLearningFeedObjectiveRow[]): string[] {
    const actions = new Set<string>();
    for (const row of rows) {
      if (row.recommendedTeacherAction && row.recommendedTeacherAction !== 'no_action_needed') {
        actions.add(row.recommendedTeacherAction);
      }
    }
    return Array.from(actions).slice(0, 5);
  }

  private buildObjectiveRows(
    schoolId: string,
    objectives: any[],
    classId?: string,
  ): Phase3DailyLearningFeedObjectiveRow[] {
    const rows: Phase3DailyLearningFeedObjectiveRow[] = [];

    for (const obj of objectives) {
      const sessions = phase3DailyObjectiveCheckRepository.listCheckSessionsByObjective(obj.objectiveId);
      const schoolSessions = sessions.filter(s => s.schoolId === schoolId);

      const row: Phase3DailyLearningFeedObjectiveRow = {
        objectiveId: obj.objectiveId,
        classId: obj.classId || classId,
        subjectId: obj.subjectId,
        topicId: obj.topicId,
        skillId: obj.skillId,
        title: obj.title,
        pendingCheckCount: schoolSessions.filter(s => s.status === 'not_started' || s.status === 'confidence_before_required').length,
        inProgressCheckCount: schoolSessions.filter(s => s.status === 'in_progress' || s.status === 'started').length,
        needsRecheckCount: schoolSessions.filter(s => s.status === 'needs_recheck').length,
        needsRescueCount: schoolSessions.filter(s => s.status === 'needs_rescue').length,
        teacherSupportCount: schoolSessions.filter(s => s.status === 'needs_teacher_support').length,
        sourceRequiredCount: schoolSessions.filter(s => s.status === 'source_required').length,
        completedTodayCount: schoolSessions.filter(s => s.status === 'completed').length,
        safePatternSummary: this.deriveSafePatternSummary(schoolSessions),
        recommendedTeacherAction: this.deriveRecommendedTeacherAction(schoolSessions),
        safeEvidenceRefs: this.collectEvidenceRefs(schoolSessions),
      };
      rows.push(row);
    }

    return rows;
  }

  private computeTotalLearnersWithItems(rows: Phase3DailyLearningFeedObjectiveRow[]): number {
    const learnerIds = new Set<string>();
    for (const row of rows) {
      if (row.pendingCheckCount > 0 || row.inProgressCheckCount > 0) {
        learnerIds.add(row.objectiveId);
      }
    }
    return Math.min(learnerIds.size, rows.length);
  }

  private deriveSafePatternSummary(sessions: any[]): string {
    if (sessions.length === 0) return 'No check sessions yet.';
    const completed = sessions.filter(s => s.status === 'completed').length;
    const inProgress = sessions.filter(s => s.status === 'in_progress' || s.status === 'started').length;
    const needsHelp = sessions.filter(s => s.status === 'needs_teacher_support' || s.status === 'needs_rescue').length;
    return `${completed} completed, ${inProgress} in progress, ${needsHelp} need intervention.`;
  }

  private deriveRecommendedTeacherAction(sessions: any[]): string {
    if (sessions.some(s => s.status === 'source_required')) return 'review_source_gap';
    if (sessions.some(s => s.status === 'needs_teacher_support')) return 'teacher_support_needed';
    if (sessions.some(s => s.status === 'needs_rescue')) return 'small_group_support';
    if (sessions.some(s => s.status === 'needs_recheck')) return 'check_learner_progress';
    return 'no_action_needed';
  }

  private collectEvidenceRefs(sessions: any[]): string[] {
    const refs = new Set<string>();
    for (const session of sessions) {
      for (const ref of (session.safeEvidenceRefs || [])) {
        refs.add(ref);
      }
    }
    return Array.from(refs);
  }

  private buildSafeSummary(rows: Phase3DailyLearningFeedObjectiveRow[]): string {
    const totalObjectives = rows.length;
    const objectivesWithIssues = rows.filter(r => r.needsRescueCount > 0 || r.teacherSupportCount > 0 || r.sourceRequiredCount > 0).length;
    if (objectivesWithIssues === 0) {
      return `All ${totalObjectives} objectives are progressing well.`;
    }
    return `${objectivesWithIssues}/${totalObjectives} objectives need attention. ${rows.filter(r => r.sourceRequiredCount > 0).length} need source review, ${rows.filter(r => r.needsRescueCount > 0).length} need rescue intervention.`;
  }
}

export const phase3DailyLearningFeedTeacherOverviewService = new Phase3DailyLearningFeedTeacherOverviewService();
