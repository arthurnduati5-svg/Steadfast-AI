// ─────────────────────────────────────────────────────────────
// Steadfast AI — Low-Workload Teacher Insight Service v1 (Task 012)
// Gives teachers short, actionable summaries with minimal
// workload. Top 3 review needs, top 3 improvements, next
// teacher action, students needing check-in, students ready
// for challenge, revision items due soon.
//
// No long raw logs. No raw chat. No private student diary data.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherReportScope,
  TeacherNextActionRecommendation,
} from './teacherReportContracts';
import { generateClassSummary, generateStudentSummary } from './teacherSafeSummaryRuntimeService';

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export interface LowWorkloadInsight {
  scope: TeacherReportScope;
  topReviewNeeds: string[];
  topImprovements: string[];
  recommendedTeacherAction: TeacherNextActionRecommendation[];
  studentsNeedingAcademicCheckIn: string[];
  studentsReadyForChallenge: string[];
  revisionItemsDueSoon: string[];
  confidence: number;
  safeEvidenceCount: number;
  generatedAt: string;
}

/**
 * Generate a low-workload insight for a teacher.
 * Short, actionable, safe summary.
 * Max 10 items per category to avoid overwhelming.
 */
export async function generateLowWorkloadInsight(
  scope: TeacherReportScope,
): Promise<LowWorkloadInsight> {
  if (scope.studentId) {
    return generateStudentLowWorkloadInsight(scope);
  }
  return generateClassLowWorkloadInsight(scope);
}

/**
 * Generate low-workload insight for a single student.
 */
async function generateStudentLowWorkloadInsight(
  scope: TeacherReportScope,
): Promise<LowWorkloadInsight> {
  const summary = await generateStudentSummary(scope);

  return {
    scope,
    topReviewNeeds: summary.needsReview.slice(0, 3),
    topImprovements: summary.recentImprovements.slice(0, 3),
    recommendedTeacherAction: summary.recommendedTeacherActions.slice(0, 3),
    studentsNeedingAcademicCheckIn: [],
    studentsReadyForChallenge: [],
    revisionItemsDueSoon: summary.revisionDue.slice(0, 3).map(r => `${r.subject}: ${r.topic} - ${r.skillLabel}`),
    confidence: summary.confidence,
    safeEvidenceCount: summary.safeEvidenceCount,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate low-workload insight for a class.
 */
async function generateClassLowWorkloadInsight(
  scope: TeacherReportScope,
): Promise<LowWorkloadInsight> {
  const summary = await generateClassSummary(scope);

  return {
    scope,
    topReviewNeeds: summary.commonReviewNeeds.slice(0, 3),
    topImprovements: summary.commonStrengths.slice(0, 3),
    recommendedTeacherAction: summary.recommendedClassActions.slice(0, 3),
    studentsNeedingAcademicCheckIn: summary.studentsNeedingAcademicCheckIn.slice(0, 5),
    studentsReadyForChallenge: summary.studentsReadyForChallenge.slice(0, 5),
    revisionItemsDueSoon: summary.revisionDueSoon.slice(0, 3).map(r => `${r.subject}: ${r.topic} - ${r.skillLabel}`),
    confidence: summary.confidence,
    safeEvidenceCount: summary.commonReviewNeeds.length + summary.commonStrengths.length,
    generatedAt: new Date().toISOString(),
  };
}
