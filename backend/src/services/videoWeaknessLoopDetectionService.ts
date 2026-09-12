// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Weakness Loop Detection Service v1
// Detects repeated weakness patterns from video learning signals.
// Patterns:
// 1. Watched video but failed practice
// 2. Multiple videos but same skill remains weak
// 3. Reflected weakly after meaningful progress
// 4. Abandoned videos repeatedly
// 5. Completed video but could not reflect
// 6. Reflection showed misconception
// 7. Post-video practice improved
// 8. Post-video practice failed repeatedly
// 9. Learner needs teacher check-in
// 10. Learner is ready to advance
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningAnalyticsEvent,
  VideoWeaknessLoopSummary,
  VideoLearningTrend,
  VideoLearningRiskLevel,
  VideoInterventionAction,
} from './videoLearningAnalyticsContracts';

// ── Detection helpers ──

function getSkillKey(event: VideoLearningAnalyticsEvent): string {
  return `${event.subject || ''}:${event.topic || ''}:${event.skillId || ''}`;
}

function countBySkill(events: VideoLearningAnalyticsEvent[], eventTypes: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (eventTypes.includes(event.normalizedEventType)) {
      const key = getSkillKey(event);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function detectTrend(
  improvements: number,
  failures: number,
): VideoLearningTrend {
  if (improvements === 0 && failures === 0) return 'insufficient_data';
  if (improvements >= 2 && improvements > failures) return 'improving';
  if (failures >= 2 && failures > improvements) return 'declining';
  return 'stable';
}

function determineRiskLevel(
  repeatedWeaknessCount: number,
  failures: number,
  hasAbandoned: boolean,
): VideoLearningRiskLevel {
  if (repeatedWeaknessCount >= 4 || failures >= 3) return 'high';
  if (repeatedWeaknessCount >= 2 || failures >= 2 || hasAbandoned) return 'medium';
  if (repeatedWeaknessCount >= 1) return 'low';
  return 'none';
}

function determineAction(
  riskLevel: VideoLearningRiskLevel,
  trend: VideoLearningTrend,
  hasVideoSupport: boolean,
  hasMisconception: boolean,
  hasImprovements: boolean,
): VideoInterventionAction {
  if (riskLevel === 'high') return 'teacher_check_in';
  if (hasMisconception) return 'reteach_topic';
  if (!hasVideoSupport) return 'recommend_alternative_video';
  if (trend === 'declining' && !hasImprovements) return 'assign_foundation_practice';
  if (trend === 'improving') return 'advance_to_challenge';
  return 'assign_similar_practice';
}

// ── Public API ──

export const videoWeaknessLoopDetectionService = {
  /**
   * Detect weakness loops from a set of analytics events for a student.
   */
  detectWeaknessLoops(
    events: VideoLearningAnalyticsEvent[],
    studentId: string,
  ): VideoWeaknessLoopSummary[] {
    if (events.length < 2) return [];

    const loops: VideoWeaknessLoopSummary[] = [];

    // Group by skill
    const bySkill = new Map<string, VideoLearningAnalyticsEvent[]>();
    for (const event of events) {
      const key = getSkillKey(event);
      if (!bySkill.has(key)) bySkill.set(key, []);
      bySkill.get(key)!.push(event);
    }

    for (const [key, skillEvents] of bySkill) {
      const [subject, topic, skillId] = key.split(':');
      if (!topic && !skillId) continue;

      const hasAbandoned = skillEvents.some((e) => e.normalizedEventType === 'video_abandoned');
      const practiceCompletions = skillEvents.filter((e) => e.normalizedEventType === 'post_video_practice_completed').length;
      const practiceFailures = skillEvents.filter((e) => e.normalizedEventType === 'post_video_practice_failed').length;
      const improvements = skillEvents.filter((e) => e.normalizedEventType === 'post_video_practice_improved').length;
      const confusionSignals = skillEvents.filter((e) => e.warnings.some((w) => w.includes('confusion') || w.includes('misconception'))).length;
      const videoSupportUsed = skillEvents.some((e) =>
        e.normalizedEventType === 'video_opened' ||
        e.normalizedEventType === 'video_started' ||
        e.normalizedEventType === 'video_meaningful_progress'
      );
      const reflections = skillEvents.filter((e) =>
        e.normalizedEventType === 'video_reflection_submitted' ||
        e.normalizedEventType === 'video_reflection_evaluated'
      );

      const trend = detectTrend(improvements, practiceFailures);
      const riskLevel = determineRiskLevel(practiceFailures + practiceCompletions, practiceFailures, hasAbandoned);
      const action = determineAction(riskLevel, trend, videoSupportUsed, confusionSignals > 0, improvements > 0);

      const evidenceRefs: string[] = [];
      if (practiceFailures > 0) evidenceRefs.push(`failed_practice_x${practiceFailures}`);
      if (improvements > 0) evidenceRefs.push(`improvements_x${improvements}`);
      if (hasAbandoned) evidenceRefs.push('abandoned_video');
      if (confusionSignals > 0) evidenceRefs.push('confusion_detected');

      loops.push({
        studentId,
        topic: topic || null,
        skillId: skillId || null,
        skillLabel: null,
        repeatedWeaknessCount: practiceFailures + (hasAbandoned ? 1 : 0),
        videoSupportUsed,
        reflectionQuality: reflections.length > 0 ? (confusionSignals > 0 ? 'confused' : 'submitted') : null,
        postVideoPracticeOutcome: improvements > 0 ? 'improved' : practiceFailures > 0 ? 'failed' : null,
        trend,
        riskLevel,
        recommendedAction: action,
        evidenceRefs: evidenceRefs.slice(0, 5),
        warnings: confusionSignals > 0 ? ['Confusion signals detected in reflection.'] : [],
      });
    }

    // Sort by risk level
    const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
    loops.sort((a, b) => (riskOrder[a.riskLevel] ?? 4) - (riskOrder[b.riskLevel] ?? 4));

    return loops;
  },
};
