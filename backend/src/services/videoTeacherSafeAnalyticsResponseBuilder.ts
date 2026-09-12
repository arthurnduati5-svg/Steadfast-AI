// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher-Safe Analytics Response Builder v1
// Builds teacher-safe analytics responses from aggregation data.
// Includes evidence summaries, confidence, and warnings.
// Excludes raw transcripts, raw chat logs, private memory.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherVideoAnalyticsResponse,
  TeacherVideoAnalyticsRequest,
} from './videoLearningAnalyticsContracts';
import { buildClassVideoLearningSummary } from './videoLearningAnalyticsAggregationService';
import { filterTeacherVisibleVideoAnalytics } from './videoTeacherVisibilityPolicyService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Public API ──

/**
 * Build a teacher-safe analytics response.
 * Filters through visibility policy for privacy protection.
 */
export async function buildTeacherSafeAnalyticsResponse(
  request: TeacherVideoAnalyticsRequest,
  teacherIdentity: ResolvedTutorIdentity,
  studentIdentities: ResolvedTutorIdentity[],
): Promise<TeacherVideoAnalyticsResponse> {
  // Validate scope
  if (!request.schoolId) {
    return {
      status: 'invalid_request',
      studentSummaries: [],
      videoEffectiveness: [],
      interventions: [],
      warnings: ['schoolId is required.'],
      metadata: {},
    };
  }

  // Check authorization
  if (teacherIdentity.schoolId !== request.schoolId) {
    return {
      status: 'forbidden',
      studentSummaries: [],
      videoEffectiveness: [],
      interventions: [],
      warnings: ['Teacher not authorized for this school.'],
      metadata: {},
    };
  }

  // Filter student identities by scope
  // Note: classId filtering requires class membership data not in ResolvedTutorIdentity
  const scopedIdentities = studentIdentities.filter((id) => {
    if (request.studentId && id.studentId !== request.studentId) return false;
    return true;
  });

  if (scopedIdentities.length === 0) {
    return {
      status: 'empty',
      studentSummaries: [],
      videoEffectiveness: [],
      interventions: [],
      warnings: ['No students found for the requested scope.'],
      metadata: {},
    };
  }

  // Build class summary
  const response = await buildClassVideoLearningSummary(
    {
      studentId: '',
      schoolId: request.schoolId,
      classId: request.classId || null,
      subject: request.subject || null,
      topic: request.topic || null,
      skillId: request.skillId || null,
      from: request.from || null,
      to: request.to || null,
    },
    scopedIdentities,
  );

  // Apply teacher visibility policy
  const safeResponse = filterTeacherVisibleVideoAnalytics(response);

  return safeResponse;
}
