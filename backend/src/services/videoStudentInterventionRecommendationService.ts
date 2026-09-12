// ─────────────────────────────────────────────────────────────
// Steadfast AI — Student Intervention Recommendation Service v1
// Generates intervention recommendations based on video learning
// analytics events and weakness loop detection.
// Uses deterministic rules — no LLM calls.
// ─────────────────────────────────────────────────────────────

import type {
  VideoLearningAnalyticsEvent,
  VideoStudentInterventionRecommendation,
  VideoInterventionAction,
} from './videoLearningAnalyticsContracts';

// ── Helpers ──

let recCounter = 0;
function generateRecId(): string {
  recCounter += 1;
  return `vir_${Date.now()}_${recCounter}`;
}

function countEventType(events: VideoLearningAnalyticsEvent[], type: string): number {
  return events.filter((e) => e.normalizedEventType === type).length;
}

function hasEventType(events: VideoLearningAnalyticsEvent[], type: string): boolean {
  return events.some((e) => e.normalizedEventType === type);
}

// ── Public API ──

export const videoStudentInterventionRecommendationService = {
  /**
   * Generate intervention recommendations from analytics events.
   * Deterministic v1 — rule-based, no LLM.
   */
  generateRecommendations(
    events: VideoLearningAnalyticsEvent[],
    studentId: string,
  ): VideoStudentInterventionRecommendation[] {
    if (events.length === 0) return [];

    const recommendations: VideoStudentInterventionRecommendation[] = [];

    // 1. Check for repeated video abandonment
    const abandonCount = countEventType(events, 'video_abandoned');
    if (abandonCount >= 2) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'recommend_alternative_video',
        priority: abandonCount >= 3 ? 'high' : 'medium',
        reason: `Student abandoned ${abandonCount} videos. Current videos may not match learning style or level.`,
        evidenceSummary: `${abandonCount} video abandonment(s) detected.`,
        teacherSafeExplanation: 'This student has abandoned multiple videos. Consider recommending shorter or more targeted videos, or switching to practice-based learning.',
        learnerSafeExplanation: 'The videos you tried may not have been the right fit. Let me find better ones for you.',
        confidence: abandonCount >= 3 ? 'high' : 'medium',
        evidenceRefs: [`abandoned_x${abandonCount}`],
        warnings: [],
      });
    }

    // 2. Check for watched but failed practice
    const practiceCompletions = countEventType(events, 'post_video_practice_completed');
    const practiceFailures = countEventType(events, 'post_video_practice_failed');
    const hasMeaningfulWatch = hasEventType(events, 'video_meaningful_progress') || hasEventType(events, 'video_completed');

    if (hasMeaningfulWatch && practiceFailures > 0 && practiceFailures >= practiceCompletions) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'reteach_topic',
        priority: practiceFailures >= 2 ? 'high' : 'medium',
        reason: `Student watched video(s) but failed post-video practice ${practiceFailures} time(s). Video may not have addressed the underlying gap.`,
        evidenceSummary: `${practiceFailures} practice failure(s) after watching videos.`,
        teacherSafeExplanation: 'This student is watching videos but still failing follow-up practice. The videos may not address their specific gaps. Consider reteaching the foundational concepts.',
        learnerSafeExplanation: 'Let me try a different approach to explain this topic.',
        confidence: 'medium',
        evidenceRefs: [`practice_failed_x${practiceFailures}`],
        warnings: [],
      });
    }

    // 3. Check for reflection showing confusion
    const confusionReflections = events.filter((e) =>
      e.normalizedEventType === 'video_reflection_evaluated' &&
      e.warnings.some((w) => w.includes('confusion') || w.includes('misconception'))
    ).length;

    if (confusionReflections > 0) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'reteach_topic',
        priority: confusionReflections >= 2 ? 'high' : 'medium',
        reason: `Student showed confusion in ${confusionReflections} reflection(s) after watching video(s).`,
        evidenceSummary: `${confusionReflections} reflection(s) with confusion signals.`,
        teacherSafeExplanation: 'This student expressed confusion in their video reflections. The video content may not be clear enough. Consider reteaching with simpler explanations.',
        learnerSafeExplanation: 'I can see some parts are still unclear. Let me explain it differently.',
        confidence: 'medium',
        evidenceRefs: [`confusion_x${confusionReflections}`],
        warnings: [],
      });
    }

    // 4. Check for improvement after practice
    const improvements = countEventType(events, 'post_video_practice_improved');
    if (improvements > 0) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'advance_to_challenge',
        priority: 'low',
        reason: `Student improved after post-video practice ${improvements} time(s). Ready for challenge.`,
        evidenceSummary: `${improvements} improvement signal(s) detected.`,
        teacherSafeExplanation: 'This student shows improvement after video-supported practice. They may be ready for more challenging material.',
        learnerSafeExplanation: 'Great improvement! You are ready to try something more challenging.',
        confidence: improvements >= 2 ? 'high' : 'medium',
        evidenceRefs: [`improvements_x${improvements}`],
        warnings: [],
      });
    }

    // 5. Check for no reflection after completion
    const completions = countEventType(events, 'video_completed');
    const reflections = countEventType(events, 'video_reflection_submitted');
    if (completions > 0 && reflections === 0) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'assign_similar_practice',
        priority: 'low',
        reason: 'Student completed video(s) but did not reflect. Practice may be a better next step.',
        evidenceSummary: `${completions} video completion(s) with 0 reflections.`,
        teacherSafeExplanation: 'This student watches videos but does not reflect. Consider assigning practice to gauge understanding.',
        learnerSafeExplanation: 'Since you watched the video, let me give you some practice to check your understanding.',
        confidence: 'low',
        evidenceRefs: ['completed_no_reflection'],
        warnings: [],
      });
    }

    // 6. Check for teacher check-in need
    const totalWeakSignals = abandonCount + practiceFailures + confusionReflections;
    if (totalWeakSignals >= 4) {
      recommendations.push({
        recommendationId: generateRecId(),
        studentId,
        action: 'teacher_check_in',
        priority: 'urgent',
        reason: `Student has ${totalWeakSignals} risk signals across abandoned videos, failed practice, and confusion. Needs teacher attention.`,
        evidenceSummary: `${totalWeakSignals} risk signals: ${abandonCount} abandoned, ${practiceFailures} practice failures, ${confusionReflections} confusion signals.`,
        teacherSafeExplanation: 'This student is showing multiple risk signals. A teacher intervention may be needed to adjust the learning approach.',
        confidence: 'high',
        evidenceRefs: ['multiple_risk_signals'],
        warnings: ['Multiple risk signals detected — recommend teacher review.'],
      });
    }

    return recommendations.slice(0, 6);
  },
};
