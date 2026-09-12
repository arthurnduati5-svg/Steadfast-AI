// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Effectiveness Scoring Service v1
// Scores a video's effectiveness based on recommendation,
// engagement, reflection, and post-video practice signals.
// High watch rate alone is NOT high effectiveness.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningAnalyticsEvent,
  VideoEffectivenessSummary,
} from './videoLearningAnalyticsContracts';

// ── Score weights ──

const WEIGHTS = {
  openRate: 0.05,
  meaningfulProgressRate: 0.10,
  reflectionRate: 0.15,
  practiceCompletionRate: 0.25,
  improvementRate: 0.30,
  noWeaknessRate: 0.15,
};

// ── Helpers ──

function calculateScore(metrics: {
  openRate: number;
  meaningfulProgressRate: number;
  reflectionRate: number;
  practiceCompletionRate: number;
  improvementRate: number;
  noWeaknessRate: number;
  totalLearners: number;
}): { score: number; confidence: 'low' | 'medium' | 'high' } {
  if (metrics.totalLearners === 0) return { score: 0, confidence: 'low' };

  const score =
    metrics.openRate * WEIGHTS.openRate +
    metrics.meaningfulProgressRate * WEIGHTS.meaningfulProgressRate +
    metrics.reflectionRate * WEIGHTS.reflectionRate +
    metrics.practiceCompletionRate * WEIGHTS.practiceCompletionRate +
    metrics.improvementRate * WEIGHTS.improvementRate +
    metrics.noWeaknessRate * WEIGHTS.noWeaknessRate;

  const confidence = metrics.totalLearners < 3
    ? 'low'
    : metrics.totalLearners < 10
      ? 'medium'
      : 'high';

  return { score: Math.round(score * 100) / 100, confidence };
}

// ── Public API ──

/**
 * Calculate video effectiveness from aggregated analytics events.
 * Does NOT overcount passive engagement as effectiveness.
 */
export function scoreVideoEffectiveness(
  events: VideoLearningAnalyticsEvent[],
): VideoEffectivenessSummary {
  if (events.length === 0) {
    return {
      videoId: 'unknown',
      learnersRecommended: 0,
      learnersOpened: 0,
      learnersMeaningfulProgress: 0,
      learnersReflected: 0,
      learnersImprovedAfterPractice: 0,
      learnersStillWeak: 0,
      effectivenessScore: 0,
      confidence: 'low',
      shouldContinueRecommending: false,
      reasons: ['No analytics data for this video.'],
      warnings: ['Insufficient data to score effectiveness.'],
    };
  }

  // Extract video info from first event
  const firstEvent = events[0];
  const videoId = firstEvent.videoId || 'unknown';

  // Get unique students
  const uniqueStudents = new Set(events.map((e) => e.studentId));
  const totalLearners = uniqueStudents.size;

  // Count by student
  const studentEngagement = new Map<string, {
    opened: boolean;
    meaningfulProgress: boolean;
    reflected: boolean;
    practiceCompleted: boolean;
    improved: boolean;
    stayedWeak: boolean;
  }>();

  for (const studentId of uniqueStudents) {
    studentEngagement.set(studentId, {
      opened: false,
      meaningfulProgress: false,
      reflected: false,
      practiceCompleted: false,
      improved: false,
      stayedWeak: false,
    });
  }

  for (const event of events) {
    const engagement = studentEngagement.get(event.studentId);
    if (!engagement) continue;

    switch (event.normalizedEventType) {
      case 'video_opened':
      case 'video_started':
        engagement.opened = true;
        break;
      case 'video_meaningful_progress':
      case 'video_completed':
        engagement.meaningfulProgress = true;
        break;
      case 'video_reflection_submitted':
      case 'video_reflection_evaluated':
        engagement.reflected = true;
        break;
      case 'post_video_practice_completed':
      case 'post_video_practice_improved':
        engagement.practiceCompleted = true;
        engagement.improved = event.normalizedEventType === 'post_video_practice_improved';
        break;
      case 'post_video_practice_failed':
        engagement.stayedWeak = true;
        break;
    }
  }

  const learnersOpened = [...studentEngagement.values()].filter((e) => e.opened).length;
  const learnersMeaningfulProgress = [...studentEngagement.values()].filter((e) => e.meaningfulProgress).length;
  const learnersReflected = [...studentEngagement.values()].filter((e) => e.reflected).length;
  const learnersPracticeCompleted = [...studentEngagement.values()].filter((e) => e.practiceCompleted).length;
  const learnersImproved = [...studentEngagement.values()].filter((e) => e.improved).length;
  const learnersStillWeak = [...studentEngagement.values()].filter((e) => e.stayedWeak).length;

  // Calculate rates
  const openRate = totalLearners > 0 ? learnersOpened / totalLearners : 0;
  const meaningfulProgressRate = learnersOpened > 0 ? learnersMeaningfulProgress / learnersOpened : 0;
  const reflectionRate = learnersMeaningfulProgress > 0 ? learnersReflected / learnersMeaningfulProgress : 0;
  const practiceCompletionRate = learnersReflected > 0 ? learnersPracticeCompleted / learnersReflected : 0;
  const improvementRate = learnersPracticeCompleted > 0 ? learnersImproved / learnersPracticeCompleted : 0;
  const noWeaknessRate = learnersMeaningfulProgress > 0 ? (learnersMeaningfulProgress - learnersStillWeak) / learnersMeaningfulProgress : 0;

  // Calculate score
  const { score, confidence } = calculateScore({
    openRate,
    meaningfulProgressRate,
    reflectionRate,
    practiceCompletionRate,
    improvementRate,
    noWeaknessRate,
    totalLearners,
  });

  const shouldContinueRecommending = score >= 0.3 && learnersImproved >= learnersStillWeak;
  const reasons: string[] = [];

  if (improvementRate > 0.5) reasons.push(`${Math.round(improvementRate * 100)}% of learners improved after practice.`);
  if (reflectionRate > 0.5) reasons.push(`${Math.round(reflectionRate * 100)}% of engaged learners reflected.`);
  if (meaningfulProgressRate > 0.7) reasons.push('High meaningful progress rate among openers.');
  if (learnersStillWeak > learnersImproved) reasons.push('More learners stayed weak than improved.');
  if (totalLearners < 3) reasons.push('Limited learner data — score may not be reliable.');

  const warnings: string[] = [];
  if (totalLearners < 3) warnings.push('Insufficient learner data for reliable effectiveness scoring.');
  if (improvementRate < 0.3 && learnersPracticeCompleted > 0) warnings.push('Low improvement rate despite practice completion.');

  return {
    videoId,
    title: firstEvent.metadata?.videoTitle as string || null,
    topic: firstEvent.topic || null,
    skillId: firstEvent.skillId || null,
    learnersRecommended: totalLearners,
    learnersOpened,
    learnersMeaningfulProgress,
    learnersReflected,
    learnersImprovedAfterPractice: learnersImproved,
    learnersStillWeak,
    effectivenessScore: score,
    confidence,
    shouldContinueRecommending,
    reasons,
    warnings,
  };
}
