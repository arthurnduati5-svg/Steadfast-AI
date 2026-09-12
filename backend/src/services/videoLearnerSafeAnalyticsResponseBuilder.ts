// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner-Safe Analytics Response Builder v1
// Builds learner-facing video learning analytics.
// Learner can see: progress summary, next step, encouragement,
//   practice recommendation, reflection reminder.
// Learner must NOT see: teacher intervention notes, risk labels
//   that shame the learner, class comparisons, other students,
//   private diagnostic labels.
// ─────────────────────────────────────────────────────────────

import type {
  StudentVideoLearningSummary,
  StudentAnalyticsScope,
} from './videoLearningAnalyticsContracts';
import { buildStudentVideoLearningSummary } from './videoLearningAnalyticsAggregationService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Learner-safe summary contract ──

export interface LearnerSafeVideoAnalyticsSummary {
  studentId: string;
  progressSummary: string;
  nextRecommendedStep: string;
  encouragement: string;
  reflectionReminder?: string | null;
  warnings: string[];
}

// ── Helpers ──

function buildProgressSummary(summary: StudentVideoLearningSummary): string {
  const parts: string[] = [];
  if (summary.videosCompleted > 0) parts.push(`Completed ${summary.videosCompleted} video(s)`);
  if (summary.reflectionsSubmitted > 0) parts.push(`Reflected on ${summary.reflectionsSubmitted} video(s)`);
  if (summary.postVideoPracticeCompleted > 0) parts.push(`Practiced after ${summary.postVideoPracticeCompleted} video(s)`);
  if (summary.videosWithMeaningfulProgress > 0 && summary.videosCompleted === 0) {
    parts.push(`Made meaningful progress on ${summary.videosWithMeaningfulProgress} video(s)`);
  }
  if (parts.length === 0) parts.push('Starting your video learning journey');
  return parts.join('. ');
}

function buildNextStep(summary: StudentVideoLearningSummary): string {
  if (summary.topWeaknesses.length > 0) {
    const top = summary.topWeaknesses[0];
    if (top.riskLevel === 'high' || top.riskLevel === 'medium') {
      return `Let's review ${top.topic || 'this topic'} — I think a different approach would help.`;
    }
  }
  if (summary.improvementSignals > 0) {
    return 'Great progress! Let me find something challenging for you next.';
  }
  if (summary.videosWithMeaningfulProgress > 0 && summary.reflectionsSubmitted === 0) {
    return 'What did you think of the video? A quick reflection would help me find the right practice for you.';
  }
  if (summary.reflectionsSubmitted > 0 && summary.postVideoPracticeGenerated === 0) {
    return 'Would you like some practice based on what you learned?';
  }
  return 'Keep up the great work! What would you like to learn next?';
}

function buildEncouragement(summary: StudentVideoLearningSummary): string {
  if (summary.improvementSignals > summary.weaknessSignals) return 'You are improving — keep going!';
  if (summary.videosCompleted > 0) return 'Nice work completing those videos!';
  if (summary.videosWithMeaningfulProgress > 0) return 'You are making good progress!';
  if (summary.videosOpened > 0) return 'Great start — every step counts!';
  return 'Ready to learn something new today?';
}

// ── Public API ──

/**
 * Build a learner-safe analytics summary from raw aggregation data.
 * Strips all teacher-only, diagnostic, and comparative information.
 */
export async function buildLearnerSafeAnalyticsSummary(
  scope: StudentAnalyticsScope,
  identity: ResolvedTutorIdentity,
): Promise<LearnerSafeVideoAnalyticsSummary> {
  const summary = await buildStudentVideoLearningSummary(scope, identity);

  const reflectionReminder = (summary.videosWithMeaningfulProgress > 0 && summary.reflectionsSubmitted === 0)
    ? 'You watched some great content! Share your thoughts so I can find the best practice for you.'
    : null;

  return {
    studentId: scope.studentId,
    progressSummary: buildProgressSummary(summary),
    nextRecommendedStep: buildNextStep(summary),
    encouragement: buildEncouragement(summary),
    reflectionReminder,
    warnings: summary.warnings.filter((w) =>
      !w.includes('not mastery') && !w.includes('passive engagement')
    ).slice(0, 3),
  };
}
