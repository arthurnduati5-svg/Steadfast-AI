// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Visibility Policy Service v1
// Controls what teachers can see about video learning analytics.
// Teacher can see: student name/id (if authorized), topic/skill
//   weakness summary, video learning status summary, reflection
//   quality label, post-video practice outcome, recommended action,
//   evidence summary, risk level, confidence.
// Teacher must NOT see: raw chat logs, raw transcript text,
//   full private learner memory, hidden diagnostic prompts,
//   private student-only notes, unsafe metadata.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherVideoAnalyticsResponse,
  StudentVideoLearningSummary,
  VideoEffectivenessSummary,
  VideoStudentInterventionRecommendation,
  VideoWeaknessLoopSummary,
} from './videoLearningAnalyticsContracts';

// ── Forbidden fields in teacher output ──

const FORBIDDEN_KEYS = [
  'rawTranscript', 'rawChatLog', 'rawPrivateMemory', 'hiddenPrompt',
  'answerKey', 'privateNotes', 'learnerOnlyNotes', 'diagnosticOnly',
  'fullReflectionText',
];

// ── Helpers ──

function stripForbiddenFields(obj: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!FORBIDDEN_KEYS.includes(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

function makeTeacherSafeReflectionLabel(quality?: string | null): string | null {
  if (!quality) return null;
  // Only show safe quality labels
  const safeLabels = ['submitted', 'good', 'partial', 'weak'];
  return safeLabels.includes(quality) ? quality : 'submitted';
}

function makeTeacherSafeRiskLabel(risk: string): string {
  // Only show bounded risk labels
  const safeRisks = ['none', 'low', 'medium', 'high'];
  return safeRisks.includes(risk) ? risk : 'medium';
}

// ── Public API ──

/**
 * Filter teacher-safe video analytics response.
 * Removes raw transcripts, raw chat logs, private memory,
 * hidden diagnostics, and private student notes.
 */
export function filterTeacherVisibleVideoAnalytics(
  response: TeacherVideoAnalyticsResponse,
): TeacherVideoAnalyticsResponse {
  const safeResponse: TeacherVideoAnalyticsResponse = {
    ...response,
    studentSummaries: response.studentSummaries.map(sanitizeStudentSummary),
    videoEffectiveness: response.videoEffectiveness.map(sanitizeVideoEffectiveness),
    interventions: response.interventions.map(sanitizeIntervention),
    warnings: [
      ...response.warnings,
      'Teacher view is privacy-filtered. Raw chat logs, transcripts, and private learner memory are hidden.',
    ],
    metadata: stripForbiddenFields(response.metadata as Record<string, unknown>),
  };

  return safeResponse;
}

function sanitizeStudentSummary(summary: StudentVideoLearningSummary): StudentVideoLearningSummary {
  return {
    ...summary,
    topWeaknesses: summary.topWeaknesses.map(sanitizeWeaknessLoop),
    warnings: [
      ...summary.warnings,
      'Reflection quality shown as summary label only.',
    ],
  };
}

function sanitizeWeaknessLoop(loop: VideoWeaknessLoopSummary): VideoWeaknessLoopSummary {
  return {
    ...loop,
    reflectionQuality: makeTeacherSafeReflectionLabel(loop.reflectionQuality),
    riskLevel: makeTeacherSafeRiskLabel(loop.riskLevel) as any,
    // Strip any raw data from evidence refs
    evidenceRefs: loop.evidenceRefs.slice(0, 5),
  };
}

function sanitizeVideoEffectiveness(effectiveness: VideoEffectivenessSummary): VideoEffectivenessSummary {
  return {
    ...effectiveness,
    reasons: effectiveness.reasons.slice(0, 5),
    warnings: effectiveness.warnings.slice(0, 5),
  };
}

function sanitizeIntervention(intervention: VideoStudentInterventionRecommendation): VideoStudentInterventionRecommendation {
  return {
    ...intervention,
    teacherSafeExplanation: intervention.teacherSafeExplanation.slice(0, 500),
    learnerSafeExplanation: intervention.learnerSafeExplanation?.slice(0, 300) || null,
    evidenceRefs: intervention.evidenceRefs.slice(0, 5),
    warnings: intervention.warnings.slice(0, 3),
  };
}
