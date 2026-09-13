import {
  type Phase3ParentSupportTeacherOverview,
  type Phase3ParentSupportTeacherLearnerRow,
  type Phase3ParentSupportAction,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

let overviewCounter = 0;

function generateOverviewId(): string {
  const c = ++overviewCounter;
  return `ov_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function getTeacherParentSupportOverview(
  schoolId: string,
  teacherId: string,
  classId?: string,
  subjectId?: string,
): Phase3ParentSupportTeacherOverview {
  const allSummaries = repo.listAllParentSupportSummariesForSchool(schoolId);
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);

  const learnerIds = new Set<string>();
  for (const s of allSummaries) learnerIds.add(s.studentId);
  for (const c of allCards) learnerIds.add(c.studentId);

  const learnerRows: Phase3ParentSupportTeacherLearnerRow[] = [];
  for (const studentId of learnerIds) {
    const links = repo.listParentLinksForLearner(schoolId, studentId);
    const activeLinks = links.filter((l) => l.linkStatus === 'active');
    const studentSummaries = allSummaries.filter((s) => s.studentId === studentId);
    const studentCards = allCards.filter((c) => c.studentId === studentId);

    const sourceRequiredCount = studentCards.filter((c) =>
      c.notificationStatus === 'blocked_by_source_truth' || c.safeReasonCodes.includes('source_required')
    ).length;
    const teacherMediatedCount = studentCards.filter((c) =>
      c.notificationStatus === 'teacher_mediated' || c.safeReasonCodes.includes('teacher_mediated')
    ).length;
    const blockedBySafeguardingCount = studentCards.filter((c) =>
      c.notificationStatus === 'blocked_by_safeguarding'
    ).length;

    const safePatternSummary = activeLinks.length > 0
      ? `Learner has ${activeLinks.length} active parent link(s) and ${studentSummaries.length} progress summary/summaries.`
      : 'Learner has no active parent links.';

    const recommendedTeacherAction: Phase3ParentSupportAction =
      sourceRequiredCount > 0 ? 'ask_teacher_for_source' :
      teacherMediatedCount > 0 ? 'ask_teacher_for_support' :
      'review_teacher_note';

    learnerRows.push({
      studentId,
      activeParentLinkCount: activeLinks.length,
      summaryCount: studentSummaries.length,
      notificationCardCount: studentCards.length,
      sourceRequiredCount,
      teacherMediatedCount,
      blockedBySafeguardingCount,
      safePatternSummary,
      recommendedTeacherAction,
      safeEvidenceRefs: [],
    });
  }

  const totalActiveParentLinks = learnerRows.reduce((sum, r) => sum + r.activeParentLinkCount, 0);
  const totalSourceRequired = learnerRows.reduce((sum, r) => sum + r.sourceRequiredCount, 0);
  const totalTeacherMediated = learnerRows.reduce((sum, r) => sum + r.teacherMediatedCount, 0);
  const totalBlockedBySafeguarding = learnerRows.reduce((sum, r) => sum + r.blockedBySafeguardingCount, 0);

  const overview: Phase3ParentSupportTeacherOverview = {
    schoolId,
    teacherId,
    classId,
    subjectId,
    generatedAt: nowISO(),
    totalLearnersWithParentSupport: learnerIds.size,
    totalActiveParentLinks,
    totalParentSummaries: allSummaries.length,
    totalNotificationCards: allCards.length,
    totalSourceRequired,
    totalTeacherMediated,
    totalBlockedBySafeguarding,
    learnerRows,
    safeSummary: `Teacher overview for ${learnerIds.size} learner(s) with parent support data.`,
    recommendedTeacherActions: [],
  };

  return overview;
}

export function getClassParentSupportOverview(
  schoolId: string,
  teacherId: string,
  classId: string,
): Phase3ParentSupportTeacherOverview {
  return getTeacherParentSupportOverview(schoolId, teacherId, classId);
}

export function getLearnerParentSupportTeacherSummary(
  schoolId: string,
  studentId: string,
): { links: number; summaries: number; cards: number; sourceRequired: number; teacherMediated: number } {
  const allSummaries = repo.listAllParentSupportSummariesForSchool(schoolId);
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);

  const studentSummaries = allSummaries.filter((s) => s.studentId === studentId);
  const studentCards = allCards.filter((c) => c.studentId === studentId);
  const links = repo.listParentLinksForLearner(schoolId, studentId);

  return {
    links: links.filter((l) => l.linkStatus === 'active').length,
    summaries: studentSummaries.length,
    cards: studentCards.length,
    sourceRequired: studentCards.filter((c) => c.notificationStatus === 'blocked_by_source_truth').length,
    teacherMediated: studentCards.filter((c) => c.notificationStatus === 'teacher_mediated').length,
  };
}

export function getParentSupportNotificationReviewQueue(
  schoolId: string,
): Phase3ParentSupportTeacherLearnerRow[] {
  const allSummaries = repo.listAllParentSupportSummariesForSchool(schoolId);
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);

  const learnerIds = new Set<string>();
  for (const c of allCards) {
    if (c.notificationStatus === 'ready_for_review' || c.notificationStatus === 'teacher_mediated') {
      learnerIds.add(c.studentId);
    }
  }

  const rows: Phase3ParentSupportTeacherLearnerRow[] = [];
  for (const studentId of learnerIds) {
    const studentCards = allCards.filter((c) => c.studentId === studentId);
    const reviewCards = studentCards.filter(
      (c) => c.notificationStatus === 'ready_for_review' || c.notificationStatus === 'teacher_mediated'
    );

    rows.push({
      studentId,
      activeParentLinkCount: repo.listParentLinksForLearner(schoolId, studentId).filter((l) => l.linkStatus === 'active').length,
      summaryCount: allSummaries.filter((s) => s.studentId === studentId).length,
      notificationCardCount: reviewCards.length,
      sourceRequiredCount: studentCards.filter((c) => c.notificationStatus === 'blocked_by_source_truth').length,
      teacherMediatedCount: reviewCards.length,
      blockedBySafeguardingCount: studentCards.filter((c) => c.notificationStatus === 'blocked_by_safeguarding').length,
      safePatternSummary: `Learner has ${reviewCards.length} notification card(s) requiring review.`,
      recommendedTeacherAction: 'ask_teacher_for_support',
      safeEvidenceRefs: [],
    });
  }

  return rows;
}

export function getParentSupportSourceRequiredQueue(
  schoolId: string,
): Phase3ParentSupportTeacherLearnerRow[] {
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);
  const sourceRequiredCards = allCards.filter((c) => c.notificationStatus === 'blocked_by_source_truth');

  const learnerIds = new Set(sourceRequiredCards.map((c) => c.studentId));
  const rows: Phase3ParentSupportTeacherLearnerRow[] = [];

  for (const studentId of learnerIds) {
    rows.push({
      studentId,
      activeParentLinkCount: repo.listParentLinksForLearner(schoolId, studentId).filter((l) => l.linkStatus === 'active').length,
      summaryCount: 0,
      notificationCardCount: sourceRequiredCards.filter((c) => c.studentId === studentId).length,
      sourceRequiredCount: sourceRequiredCards.filter((c) => c.studentId === studentId).length,
      teacherMediatedCount: 0,
      blockedBySafeguardingCount: 0,
      safePatternSummary: 'This learner has notifications blocked by missing source context.',
      recommendedTeacherAction: 'ask_teacher_for_source',
      safeEvidenceRefs: [],
    });
  }

  return rows;
}

export function getParentSupportTeacherMediatedQueue(
  schoolId: string,
): Phase3ParentSupportTeacherLearnerRow[] {
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);
  const mediatedCards = allCards.filter(
    (c) => c.notificationStatus === 'teacher_mediated' || c.notificationStatus === 'ready_for_review'
  );

  const learnerIds = new Set(mediatedCards.map((c) => c.studentId));
  const rows: Phase3ParentSupportTeacherLearnerRow[] = [];

  for (const studentId of learnerIds) {
    rows.push({
      studentId,
      activeParentLinkCount: repo.listParentLinksForLearner(schoolId, studentId).filter((l) => l.linkStatus === 'active').length,
      summaryCount: 0,
      notificationCardCount: mediatedCards.filter((c) => c.studentId === studentId).length,
      sourceRequiredCount: 0,
      teacherMediatedCount: mediatedCards.filter((c) => c.studentId === studentId).length,
      blockedBySafeguardingCount: 0,
      safePatternSummary: 'This learner has notifications requiring teacher mediation.',
      recommendedTeacherAction: 'ask_teacher_for_support',
      safeEvidenceRefs: [],
    });
  }

  return rows;
}

export function getTeacherRecommendedParentSupportActions(
  schoolId: string,
): { action: Phase3ParentSupportAction; learnerCount: number }[] {
  const actionCounts = new Map<Phase3ParentSupportAction, number>();
  const allCards = repo.listAllParentNotificationCardsForSchool(schoolId);

  for (const card of allCards) {
    const count = actionCounts.get(card.supportAction) ?? 0;
    actionCounts.set(card.supportAction, count + 1);
  }

  return Array.from(actionCounts.entries())
    .map(([action, learnerCount]) => ({ action, learnerCount }))
    .sort((a, b) => b.learnerCount - a.learnerCount);
}
