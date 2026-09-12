// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Analytics Aggregation Service v1
// Aggregates normalized video learning events into:
// - Per-student video learning summary
// - Per-video effectiveness summary
// - Class-level overview
// Does NOT count passive engagement as mastery.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningAnalyticsEvent,
  StudentVideoLearningSummary,
  VideoEffectivenessSummary,
  VideoWeaknessLoopSummary,
  VideoStudentInterventionRecommendation,
  TeacherVideoAnalyticsResponse,
  StudentAnalyticsScope,
  VideoLearningTrend,
} from './videoLearningAnalyticsContracts';
import { listStudentVideoLearningEvents } from './videoLearningAnalyticsRepository';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { videoWeaknessLoopDetectionService } from './videoWeaknessLoopDetectionService';
import { videoStudentInterventionRecommendationService } from './videoStudentInterventionRecommendationService';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function getTrend(improvementSignals: number, weaknessSignals: number, totalEvents: number): VideoLearningTrend {
  if (totalEvents < 3) return 'insufficient_data';
  if (improvementSignals > weaknessSignals && improvementSignals >= 2) return 'improving';
  if (weaknessSignals > improvementSignals && weaknessSignals >= 2) return 'declining';
  return 'stable';
}

// ── Public API ──

/**
 * Build a per-student video learning summary from analytics events.
 */
export async function buildStudentVideoLearningSummary(
  scope: StudentAnalyticsScope,
  identity: ResolvedTutorIdentity,
): Promise<StudentVideoLearningSummary> {
  const events = await listStudentVideoLearningEvents(scope, identity);
  const warnings: string[] = [];

  if (events.length === 0) {
    warnings.push('No video learning analytics events for this scope.');
  }

  // Count event types
  const videosRecommended = events.filter((e) => e.normalizedEventType === 'video_recommended').length;
  const videosOpened = events.filter((e) => e.normalizedEventType === 'video_opened' || e.normalizedEventType === 'video_started').length;
  const videosWithMeaningfulProgress = events.filter((e) => e.normalizedEventType === 'video_meaningful_progress' || e.normalizedEventType === 'video_completed').length;
  const videosCompleted = events.filter((e) => e.normalizedEventType === 'video_completed').length;
  const reflectionsSubmitted = events.filter((e) => e.normalizedEventType === 'video_reflection_submitted').length;
  const postVideoPracticeGenerated = events.filter((e) => e.normalizedEventType === 'post_video_practice_generated').length;
  const postVideoPracticeCompleted = events.filter((e) => e.normalizedEventType === 'post_video_practice_completed').length;
  const improvementSignals = events.filter((e) => e.normalizedEventType === 'post_video_practice_improved' || e.evidenceStrength === 'mastery_signal').length;
  const weaknessSignals = events.filter((e) => e.normalizedEventType === 'post_video_practice_failed' || e.normalizedEventType === 'video_abandoned' || e.evidenceStrength === 'teacher_attention_signal').length;

  const currentTrend = getTrend(improvementSignals, weaknessSignals, events.length);

  // Detect weakness loops
  const weaknessLoops = videoWeaknessLoopDetectionService.detectWeaknessLoops(events, scope.studentId);

  // Generate intervention recommendations
  const recommendations = videoStudentInterventionRecommendationService.generateRecommendations(events, scope.studentId);

  if (events.length > 0 && events.length < 5) {
    warnings.push('Limited analytics data — trends may not be reliable.');
  }

  return {
    studentId: scope.studentId,
    schoolId: scope.schoolId,
    classId: scope.classId,
    subject: scope.subject,
    topic: scope.topic,
    skillId: scope.skillId,
    timeWindow: {
      from: scope.from || null,
      to: scope.to || null,
    },
    videosRecommended,
    videosOpened,
    videosWithMeaningfulProgress,
    videosCompleted,
    reflectionsSubmitted,
    postVideoPracticeGenerated,
    postVideoPracticeCompleted,
    improvementSignals,
    weaknessSignals,
    currentTrend,
    topWeaknesses: weaknessLoops.slice(0, 5),
    recommendedActions: recommendations.slice(0, 5),
    warnings,
  };
}

/**
 * Build class-level analytics summary from multiple student summaries.
 */
export async function buildClassVideoLearningSummary(
  scope: StudentAnalyticsScope,
  studentIdentities: ResolvedTutorIdentity[],
): Promise<TeacherVideoAnalyticsResponse> {
  const warnings: string[] = [];
  const studentSummaries: StudentVideoLearningSummary[] = [];
  const allWeaknesses: VideoWeaknessLoopSummary[] = [];
  const allInterventions: VideoStudentInterventionRecommendation[] = [];
  const videoMap = new Map<string, { events: VideoLearningAnalyticsEvent[] }>();

  for (const identity of studentIdentities) {
    const summary = await buildStudentVideoLearningSummary(scope, identity);
    studentSummaries.push(summary);
    allWeaknesses.push(...summary.topWeaknesses);
    allInterventions.push(...summary.recommendedActions);
  }

  const studentsNeedingAttention = allInterventions.filter((i) => i.priority === 'high' || i.priority === 'urgent').length;
  const topicsNeedingReteach = [...new Set(
    allWeaknesses
      .filter((w) => w.riskLevel === 'high' || w.riskLevel === 'medium')
      .map((w) => w.topic)
      .filter(Boolean),
  )] as string[];

  if (studentSummaries.length === 0) {
    warnings.push('No student analytics found for this class scope.');
    return {
      status: 'empty',
      studentSummaries: [],
      videoEffectiveness: [],
      interventions: [],
      warnings,
      metadata: { generatedAt: nowISO() },
    };
  }

  return {
    status: 'ok',
    classSummary: {
      schoolId: scope.schoolId,
      classId: scope.classId || null,
      studentsAnalyzed: studentSummaries.length,
      studentsNeedingAttention,
      topicsNeedingReteach: topicsNeedingReteach.slice(0, 10),
      videosNeedingReview: [],
      generatedAt: nowISO(),
    },
    studentSummaries,
    videoEffectiveness: [],
    interventions: allInterventions.slice(0, 20),
    warnings,
    metadata: { generatedAt: nowISO() },
  };
}
