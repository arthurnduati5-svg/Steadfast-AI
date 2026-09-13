// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Next Action Recommendation Service v1 (Task 012)
// Suggests safe, evidence-backed teacher actions based on
// aggregated Task 011 evidence. No automation of sensitive
// decisions without policy.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherNextActionRecommendation,
  TeacherNextActionType,
  TeacherActionRecommendationResult,
  TeacherReportPrivacyMetadata,
  TeacherReportScope,
} from './teacherReportContracts';
import { getStudentEvidenceDashboard, getClassEvidenceDashboard } from './learningDashboardEvidenceService';

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Generate evidence-backed, safe next-action recommendations
 * for a teacher based on student or class scope.
 */
export async function generateNextActionRecommendations(
  scope: TeacherReportScope,
): Promise<TeacherActionRecommendationResult> {
  if (scope.studentId) {
    return generateStudentRecommendations(scope);
  }
  return generateClassRecommendations(scope);
}

/**
 * Generate recommendations for a single student.
 */
async function generateStudentRecommendations(
  scope: TeacherReportScope,
): Promise<TeacherActionRecommendationResult> {
  const dashboard = await getStudentEvidenceDashboard(scope);
  const recommendations: TeacherNextActionRecommendation[] = [];

  // Analyze evidence for weak signals
  const weakSignals = dashboard.evidenceCards.filter(
    c => c.masterySignal === 'needs_review' || c.masterySignal === 'recently_struggled' || c.masterySignal === 'developing',
  );
  const improvementSignals = dashboard.evidenceCards.filter(
    c => c.masterySignal === 'improving' || c.masterySignal === 'growth_observed',
  );

  // Needs review -> assign foundation practice
  if (weakSignals.length > 0) {
    const topWeak = weakSignals[0];
    recommendations.push({
      actionType: 'assign_foundation_practice',
      reason: `${topWeak.subject} - ${topWeak.topic}: ${topWeak.skillLabel} needs review. Foundation practice recommended.`,
      safeEvidenceRefs: [topWeak.evidenceId],
      priority: weakSignals.length >= 3 ? 'high' : 'medium',
      confidence: Math.min(0.5 + weakSignals.length * 0.1, 0.9),
    });
  }

  // Multiple weak areas -> quick check-in
  if (weakSignals.length >= 3) {
    recommendations.push({
      actionType: 'quick_check_in',
      reason: `${weakSignals.length} areas need review. Quick teacher check-in recommended to assess understanding.`,
      safeEvidenceRefs: weakSignals.slice(0, 3).map(c => c.evidenceId),
      priority: 'medium',
      confidence: 0.7,
    });
  }

  // Recently struggling -> reteach micro concept
  const struggling = dashboard.evidenceCards.filter(
    c => c.masterySignal === 'recently_struggled',
  );
  if (struggling.length > 0) {
    const topStruggle = struggling[0];
    recommendations.push({
      actionType: 'reteach_micro_concept',
      reason: `${topStruggle.subject}: ${topStruggle.skillLabel} showed recent difficulty. Brief re-teaching may help.`,
      safeEvidenceRefs: [topStruggle.evidenceId],
      priority: 'high',
      studentFacingSafeInstruction: `Review the ${topStruggle.topic} material on ${topStruggle.skillLabel}.`,
      confidence: 0.6,
    });
  }

  // Improvements observed -> assign challenge
  if (improvementSignals.length >= 3) {
    recommendations.push({
      actionType: 'assign_challenge_practice',
      reason: `${improvementSignals.length} areas showing improvement. Student may be ready for challenge material.`,
      safeEvidenceRefs: improvementSignals.slice(0, 3).map(c => c.evidenceId),
      priority: 'low',
      confidence: 0.6,
    });
  }

  // Revision items due
  const revisionDue = dashboard.evidenceCards.filter(c => c.evidenceType === 'spaced_review');
  if (revisionDue.length > 0) {
    recommendations.push({
      actionType: 'review_revision_item',
      reason: `${revisionDue.length} revision item${revisionDue.length === 1 ? '' : 's'} due soon. Encourage spaced review.`,
      safeEvidenceRefs: revisionDue.slice(0, 3).map(c => c.evidenceId),
      priority: 'medium',
      confidence: 0.8,
    });
  }

  // No action needed
  if (recommendations.length === 0) {
    recommendations.push({
      actionType: 'no_action_needed',
      reason: 'Student is progressing well. No urgent academic concerns detected.',
      safeEvidenceRefs: [],
      priority: 'low',
      confidence: 0.9,
    });
  }

  const privacyMetadata: TeacherReportPrivacyMetadata = {
    privacyLevel: 'teacher_safe',
    redactionApplied: false,
    redactionReasons: [],
    minimumNecessary: true,
    teacherSafe: true,
    safeguardingSeparated: true,
    deenSensitiveHandled: true,
  };

  return {
    studentId: scope.studentId,
    recommendations: sortByPriority(recommendations),
    priorityOrder: 'urgent_first',
    generatedAt: new Date().toISOString(),
    privacyMetadata,
  };
}

/**
 * Generate recommendations for a class.
 */
async function generateClassRecommendations(
  scope: TeacherReportScope,
): Promise<TeacherActionRecommendationResult> {
  const dashboard = await getClassEvidenceDashboard(scope);
  const recommendations: TeacherNextActionRecommendation[] = [];

  // Class-level review needs
  const weakSignals = dashboard.evidenceCards.filter(
    c => c.masterySignal === 'needs_review' || c.masterySignal === 'recently_struggled',
  );
  const strongSignals = dashboard.evidenceCards.filter(
    c => c.masterySignal === 'secure' || c.masterySignal === 'ready_for_challenge',
  );

  if (weakSignals.length > 0) {
    recommendations.push({
      actionType: 'quick_check_in',
      reason: `${weakSignals.length} evidence records indicate areas needing class-wide attention.`,
      safeEvidenceRefs: weakSignals.slice(0, 3).map(c => c.evidenceId),
      priority: weakSignals.length >= 5 ? 'high' : 'medium',
      confidence: 0.7,
    });
  }

  if (strongSignals.length > 3) {
    recommendations.push({
      actionType: 'assign_challenge_practice',
      reason: `Class is showing strength in ${strongSignals.length} areas. Consider challenge material for ready students.`,
      safeEvidenceRefs: strongSignals.slice(0, 3).map(c => c.evidenceId),
      priority: 'low',
      confidence: 0.6,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      actionType: 'no_action_needed',
      reason: 'No significant class-wide academic concerns detected.',
      safeEvidenceRefs: [],
      priority: 'low',
      confidence: 0.9,
    });
  }

  const privacyMetadata: TeacherReportPrivacyMetadata = {
    privacyLevel: 'teacher_safe',
    redactionApplied: false,
    redactionReasons: [],
    minimumNecessary: true,
    teacherSafe: true,
    safeguardingSeparated: true,
    deenSensitiveHandled: true,
  };

  return {
    classId: scope.classId,
    recommendations: sortByPriority(recommendations),
    priorityOrder: 'urgent_first',
    generatedAt: new Date().toISOString(),
    privacyMetadata,
  };
}

// ═══════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════

function sortByPriority(actions: TeacherNextActionRecommendation[]): TeacherNextActionRecommendation[] {
  const priorityRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...actions].sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99));
}
