// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Safe Summary Runtime v1 (Task 012)
// Generates safe, bounded, teacher-facing summaries from
// Task 011 evidence. Supports student, class, subject, topic,
// skill, and intervention-ready report levels.
//
// Never exposes raw chat, raw prompts, private memory,
// safeguarding details, or Deen-sensitive raw questions.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import type {
  TeacherSafeStudentSummary,
  TeacherSafeClassSummary,
  TeacherSafeRevisionDueItem,
  TeacherNextActionRecommendation,
  TeacherSummaryWindow,
  ProgressLabel,
  TeacherReportScope,
} from './teacherReportContracts';
import { sanitizeStudentSummary, sanitizeClassSummary } from './teacherReportPrivacyGuardService';
import { generateNextActionRecommendations } from './teacherNextActionRecommendationService';
import { getStudentEvidenceDashboard, getClassEvidenceDashboard } from './learningDashboardEvidenceService';

// ═══════════════════════════════════════════════════════════════
// Student Summary
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a safe teacher-facing summary for one student.
 */
export async function generateStudentSummary(
  scope: TeacherReportScope,
): Promise<TeacherSafeStudentSummary> {
  const evidenceDashboard = await getStudentEvidenceDashboard(scope);
  const recommendations = await generateNextActionRecommendations({ ...scope, studentId: scope.studentId! });

  const strengths = extractStrengths(evidenceDashboard.evidenceCards);
  const needsReview = extractNeedsReview(evidenceDashboard.evidenceCards);
  const improvements = extractImprovements(evidenceDashboard.evidenceCards);
  const revisionDue = extractRevisionDue(evidenceDashboard.evidenceCards);

  const summary: TeacherSafeStudentSummary = {
    studentId: scope.studentId || 'unknown',
    schoolId: scope.schoolId,
    classId: scope.classId,
    summaryWindow: scope.window,
    overallProgressLabel: computeProgressLabel(strengths.length, needsReview.length),
    strengths,
    needsReview,
    recentImprovements: improvements,
    revisionDue,
    recommendedTeacherActions: recommendations.recommendations.slice(0, 5),
    safeEvidenceCount: evidenceDashboard.safeEvidenceCount,
    confidence: computeConfidence(evidenceDashboard.evidenceCards),
    privacyMetadata: {
      privacyLevel: 'teacher_safe',
      redactionApplied: false,
      redactionReasons: [],
      minimumNecessary: true,
      teacherSafe: true,
      safeguardingSeparated: true,
      deenSensitiveHandled: true,
    },
    generatedAt: new Date().toISOString(),
  };

  const { safeSummary } = sanitizeStudentSummary(summary);
  return safeSummary;
}

// ═══════════════════════════════════════════════════════════════
// Class Summary
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a safe teacher-facing summary for a class.
 */
export async function generateClassSummary(
  scope: TeacherReportScope,
): Promise<TeacherSafeClassSummary> {
  const classDashboard = await getClassEvidenceDashboard(scope);

  const commonReviewNeeds = extractCommonReviewNeeds(classDashboard.evidenceCards);
  const commonStrengths = extractCommonStrengths(classDashboard.evidenceCards);
  const checkInStudents = extractStudentsNeedingCheckIn(classDashboard.evidenceCards);
  const challengeStudents = extractStudentsReadyForChallenge(classDashboard.evidenceCards);
  const revisionDue = extractRevisionDue(classDashboard.evidenceCards);

  const summary: TeacherSafeClassSummary = {
    schoolId: scope.schoolId,
    classId: scope.classId || 'unknown',
    summaryWindow: scope.window,
    classProgressOverview: buildClassOverview(commonStrengths, commonReviewNeeds, classDashboard.evidenceCards.length),
    commonReviewNeeds,
    commonStrengths,
    studentsNeedingAcademicCheckIn: checkInStudents,
    studentsReadyForChallenge: challengeStudents,
    revisionDueSoon: revisionDue,
    recommendedClassActions: generateClassActions(commonReviewNeeds, commonStrengths),
    confidence: computeConfidence(classDashboard.evidenceCards),
    privacyMetadata: {
      privacyLevel: 'teacher_safe',
      redactionApplied: false,
      redactionReasons: [],
      minimumNecessary: true,
      teacherSafe: true,
      safeguardingSeparated: true,
      deenSensitiveHandled: true,
    },
    generatedAt: new Date().toISOString(),
  };

  const { safeSummary } = sanitizeClassSummary(summary);
  return safeSummary;
}

// ═══════════════════════════════════════════════════════════════
// Internal: Evidence Analysis
// ═══════════════════════════════════════════════════════════════

function extractStrengths(cards: { masterySignal: string; skillLabel: string; subject: string }[]): string[] {
  return cards
    .filter(c => c.masterySignal === 'secure' || c.masterySignal === 'improving' || c.masterySignal === 'ready_for_challenge')
    .map(c => `${c.subject}: ${c.skillLabel}`)
    .slice(0, 5);
}

function extractNeedsReview(cards: { masterySignal: string; skillLabel: string; subject: string; topic: string }[]): string[] {
  return cards
    .filter(c => c.masterySignal === 'needs_review' || c.masterySignal === 'recently_struggled' || c.masterySignal === 'developing')
    .map(c => `${c.subject} - ${c.topic}: ${c.skillLabel}`)
    .slice(0, 5);
}

function extractImprovements(cards: { masterySignal: string; skillLabel: string; subject: string }[]): string[] {
  return cards
    .filter(c => c.masterySignal === 'improving' || c.masterySignal === 'growth_observed')
    .map(c => `${c.subject}: ${c.skillLabel}`)
    .slice(0, 5);
}

function extractRevisionDue(cards: { evidenceType: string; safeSummary: string; subject: string; topic: string; skillLabel: string; createdAt: string }[]): TeacherSafeRevisionDueItem[] {
  return cards
    .filter(c => c.evidenceType === 'spaced_review' || c.evidenceType === 'recommendation')
    .map(c => ({
      subject: c.subject,
      topic: c.topic,
      skillLabel: c.skillLabel,
      dueAt: c.createdAt,
      intervalDays: 1,
      reason: c.safeSummary.substring(0, 100),
      priority: 'medium' as const,
    }))
    .slice(0, 5);
}

function extractCommonReviewNeeds(cards: { masterySignal: string; skillLabel: string; topic: string }[]): string[] {
  const needs = new Map<string, number>();
  for (const c of cards) {
    if (c.masterySignal === 'needs_review' || c.masterySignal === 'recently_struggled') {
      const key = `${c.topic}: ${c.skillLabel}`;
      needs.set(key, (needs.get(key) || 0) + 1);
    }
  }
  return [...needs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
}

function extractCommonStrengths(cards: { masterySignal: string; skillLabel: string; topic: string }[]): string[] {
  const strengths = new Map<string, number>();
  for (const c of cards) {
    if (c.masterySignal === 'secure' || c.masterySignal === 'improving') {
      const key = `${c.topic}: ${c.skillLabel}`;
      strengths.set(key, (strengths.get(key) || 0) + 1);
    }
  }
  return [...strengths.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
}

function extractStudentsNeedingCheckIn(cards: { studentId?: string; masterySignal: string }[]): string[] {
  const students = new Set<string>();
  for (const c of cards) {
    if ((c.masterySignal === 'needs_review' || c.masterySignal === 'recently_struggled') && c.studentId) {
      students.add(c.studentId);
    }
  }
  return [...students].slice(0, 20);
}

function extractStudentsReadyForChallenge(cards: { studentId?: string; masterySignal: string }[]): string[] {
  const students = new Set<string>();
  for (const c of cards) {
    if ((c.masterySignal === 'ready_for_challenge' || c.masterySignal === 'secure') && c.studentId) {
      students.add(c.studentId);
    }
  }
  return [...students].slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════
// Internal: Helpers
// ═══════════════════════════════════════════════════════════════

function computeProgressLabel(strengthCount: number, needsReviewCount: number): ProgressLabel {
  if (strengthCount > 3 && needsReviewCount === 0) return 'ready_for_challenge';
  if (strengthCount > 0 && needsReviewCount === 0) return 'secure';
  if (strengthCount > needsReviewCount) return 'improving';
  if (needsReviewCount > strengthCount && needsReviewCount < 5) return 'developing';
  if (needsReviewCount >= 5) return 'support_recommended';
  return 'needs_review';
}

function computeConfidence(cards: { confidence: number }[]): number {
  if (cards.length === 0) return 0;
  const avg = cards.reduce((sum, c) => sum + c.confidence, 0) / cards.length;
  return Math.round(avg * 100) / 100;
}

function buildClassOverview(
  strengths: string[],
  reviewNeeds: string[],
  totalCards: number,
): string {
  const parts: string[] = [];
  if (strengths.length > 0) {
    parts.push(`Class is showing strength in ${strengths.slice(0, 3).join(', ')}.`);
  }
  if (reviewNeeds.length > 0) {
    parts.push(`Areas needing attention include ${reviewNeeds.slice(0, 3).join(', ')}.`);
  }
  if (totalCards > 0) {
    parts.push(`${totalCards} evidence records reviewed.`);
  }
  return parts.join(' ') || 'Insufficient evidence to generate class overview.';
}

function generateClassActions(
  reviewNeeds: string[],
  _strengths: string[],
): TeacherNextActionRecommendation[] {
  const actions: TeacherNextActionRecommendation[] = [];
  if (reviewNeeds.length > 0) {
    actions.push({
      actionType: 'quick_check_in',
      reason: `${reviewNeeds.slice(0, 3).join(', ')} need${reviewNeeds.length === 1 ? 's' : ''} attention.`,
      safeEvidenceRefs: [],
      priority: 'medium',
      confidence: 0.7,
    });
  }
  if (actions.length === 0) {
    actions.push({
      actionType: 'no_action_needed',
      reason: 'No significant concerns detected.',
      safeEvidenceRefs: [],
      priority: 'low',
      confidence: 0.9,
    });
  }
  return actions;
}
