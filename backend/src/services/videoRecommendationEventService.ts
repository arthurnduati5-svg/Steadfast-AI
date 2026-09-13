// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Event Service v1
// Writes bounded recommendation events. Never raw transcripts.
// ─────────────────────────────────────────────────────────────

import type { VideoRecommendationResponse } from './videoRecommendationContracts';

export class VideoRecommendationEventService {
  /**
   * Record a bounded recommendation event.
   * No raw transcripts. No raw metadata dumps.
   */
  async recordRecommendationEvent(
    identity: { schoolId: string; studentId: string },
    response: VideoRecommendationResponse,
  ): Promise<{ eventWritten: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    if (!identity?.studentId || !identity?.schoolId) {
      return { eventWritten: false, warnings: ['Missing identity — cannot record event'] };
    }

    try {
      const eventPayload = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        requestId: response.meta.requestId,
        status: response.status,
        recommendedCount: response.recommendations.length,
        rejectedCount: response.rejected.length,
        reviewCount: response.reviewQueue.length,
        topRecommendationTitle: response.recommendations[0]?.candidate.title?.slice(0, 200) || null,
        topRecommendationScore: response.recommendations[0]?.score.finalScore || null,
        warnings: response.meta.warnings.slice(0, 5),
        recordedAt: new Date().toISOString(),
      };

      console.log('[VideoRecommendationEvent]', JSON.stringify(eventPayload));
      return { eventWritten: true, warnings };
    } catch (err) {
      warnings.push(`Failed to record recommendation event: ${String(err)}`);
      return { eventWritten: false, warnings };
    }
  }
}

export const videoRecommendationEventService = new VideoRecommendationEventService();
