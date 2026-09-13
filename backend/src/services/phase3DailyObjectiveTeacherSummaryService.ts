import type {
  Phase3DailyObjectiveCheckSession,
  Phase3DailyObjectiveCheckTeacherSummary,
  Phase3DailyObjectiveRecommendedAction,
  Phase3DailyObjectiveCompletionStatus,
} from '../contracts/phase3DailyObjectiveCheckContracts';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';

function nowISO(): string {
  return new Date().toISOString();
}

function getRecommendedTeacherAction(status: string, session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveRecommendedAction {
  if (status === 'completed') {
    if (session.hintUsageBucket === 'high') return 'assign_short_recall';
    return 'no_action_needed';
  }
  if (status === 'needs_recheck') return 'assign_short_recall';
  if (status === 'needs_rescue') return 'run_teach_back_check';
  if (status === 'needs_teacher_support') return 'teacher_support_needed';
  if (status === 'source_required') return 'provide_approved_source';
  if (status === 'blocked') return 'review_prerequisite';
  if (session.attemptCount >= 3) return 'small_group_support';
  return 'no_action_needed';
}

function buildSafePatternSummary(status: string, session: Phase3DailyObjectiveCheckSession): string {
  const parts: string[] = [];

  if (session.attemptCount > 0) {
    parts.push(`${session.attemptCount} attempt(s)`);
  }
  if (session.hintUsageBucket === 'high') {
    parts.push('high hint dependency');
  }
  if (session.explanationQualityBucket === 'weak') {
    parts.push('weak explanation quality');
  }
  if (session.teachBackQualityBucket === 'strong') {
    parts.push('strong teach-back');
  } else if (session.teachBackQualityBucket === 'weak') {
    parts.push('weak teach-back');
  }
  if (session.transferCheckBucket === 'passed') {
    parts.push('transfer check passed');
  } else if (session.transferCheckBucket === 'unstable') {
    parts.push('transfer check unstable');
  }
  if (session.delayedRecallBucket === 'passed') {
    parts.push('delayed recall passed');
  }

  if (parts.length === 0) {
    return `Check completed with status: ${status}.`;
  }

  return `Check status: ${status}. Signals: ${parts.join(', ')}.`;
}

export class Phase3DailyObjectiveTeacherSummaryService {
  getTeacherSummaries(schoolId: string): Phase3DailyObjectiveCheckTeacherSummary[] {
    const sessions = phase3DailyObjectiveCheckRepository.listTeacherCheckSummaries(schoolId);
    return sessions.map(session => this.buildTeacherSummary(session));
  }

  getTeacherSummaryBySession(schoolId: string, checkSessionId: string): Phase3DailyObjectiveCheckTeacherSummary | null {
    const session = phase3DailyObjectiveCheckRepository.getCheckSessionById(checkSessionId);
    if (!session || session.schoolId !== schoolId) return null;
    return this.buildTeacherSummary(session);
  }

  buildTeacherSummary(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckTeacherSummary {
    const status = session.status;
    const masteryStatus = this.deriveMasteryStatusFromSession(session);

    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      classId: session.classId,
      subjectId: session.subjectId,
      topicId: session.topicId,
      skillId: session.skillId,
      studentId: session.studentId,
      status,
      masteryStatus,
      safePatternSummary: buildSafePatternSummary(status, session),
      hintDependencyBucket: session.hintUsageBucket,
      explanationQualityBucket: session.explanationQualityBucket,
      recallQualityBucket: session.recallQualityBucket,
      teachBackQualityBucket: session.teachBackQualityBucket,
      transferCheckStatus: session.transferCheckBucket,
      delayedRecallStatus: session.delayedRecallBucket,
      safeReasonCodes: session.antiCheatSignalLabels,
      recommendedTeacherAction: getRecommendedTeacherAction(status, session),
      safeEvidenceRefs: session.safeEvidenceRefs,
      updatedAt: session.updatedAt,
    };
  }

  private deriveMasteryStatusFromSession(session: Phase3DailyObjectiveCheckSession): string {
    if (session.status === 'completed') {
      const hasStrong = session.safeSignalBuckets.includes('objective_check_passed') ||
        session.safeSignalBuckets.includes('teach_back_quality_bucket') ||
        session.safeSignalBuckets.includes('transfer_check_passed');
      if (hasStrong && session.hintUsageBucket !== 'high') return 'almost_there';
      return 'getting_better';
    }
    if (session.status === 'needs_recheck') return 'still_learning';
    if (session.status === 'needs_rescue') return 'needs_rescue';
    if (session.status === 'needs_teacher_support') return 'needs_teacher_support';
    if (session.status === 'source_required') return 'source_required';
    if (session.status === 'blocked') return 'blocked';
    return 'not_started';
  }
}

export const phase3DailyObjectiveTeacherSummaryService = new Phase3DailyObjectiveTeacherSummaryService();
