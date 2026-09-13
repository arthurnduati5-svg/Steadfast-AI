// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Chat Safety Service v1
// Sanitizes video recommendation output for learner-facing chat.
// Strips rejected videos, fake URLs, raw transcripts, and debug data.
// Labels needs_review videos correctly.
// ─────────────────────────────────────────────────────────────

import type {
  VideoChatRecommendationMeta,
  VideoChatIntegrationStatus,
  VideoChatTriggerReason,
  VideoChatSafetyInput,
} from './videoChatIntegrationContracts';

export class VideoChatSafetyService {
  /**
   * Sanitize video recommendation output for safe chat consumption.
   */
  sanitizeVideoRecommendationsForChat(input: VideoChatSafetyInput): VideoChatRecommendationMeta {
    // Note: includeDebug is accepted for future use but debug data is intentionally
    // excluded from learner-facing chat output regardless. Score internals are never
    // exposed through the VideoChatRecommendationMeta type.
    const triggerReasons: VideoChatTriggerReason[] = [];
    const warnings: string[] = [];
    let status: VideoChatIntegrationStatus = 'not_requested';

    // ── 1. Build safe recommendations (rejected videos excluded) ──
    const recommendations = input.recommendations
      .filter((r) => {
        // Remove rejected-status items
        if (r.status === 'not_recommended' || r.decision === 'exclude') {
          return false;
        }
        // Remove fake/unverified URLs
        if (r.candidate?.url && this._isFakeUrl(r.candidate.url)) {
          warnings.push(`Fake URL removed: ${r.candidate.url}`);
          return false;
        }
        return true;
      })
      .map((r) => ({
        recommendationId: r.recommendationId,
        title: r.candidate?.title || null,
        url: r.candidate?.url || null,
        channelTitle: r.candidate?.channelTitle || null,
        status: r.status,
        decision: r.decision,
        finalScore: r.score.finalScore,
        reasons: (r.reasons || []).slice(0, 3),
        warnings: (r.warnings || []).slice(0, 3),
      }));

    // ── 2. Build review queue items (labeled as review-required) ──
    const reviewQueue = input.reviewQueue
      .filter((r) => {
        if (r.candidate?.url && this._isFakeUrl(r.candidate.url)) {
          return false;
        }
        return true;
      })
      .map((r) => ({
        recommendationId: r.recommendationId,
        title: r.candidate?.title || null,
        status: r.status,
        decision: r.decision,
        reasons: (r.reasons || []).slice(0, 2),
        warnings: (r.warnings || []).slice(0, 2),
      }));

    // ── 3. Compute rejected count ──
    const rejectedCount = input.rejected.length;

    // ── 4. Determine status ──
    if (recommendations.length > 0 && reviewQueue.length > 0) {
      status = 'recommended';
      warnings.push('Some recommendations need teacher review before use.');
    } else if (recommendations.length > 0) {
      status = 'recommended';
    } else if (reviewQueue.length > 0) {
      status = 'needs_teacher_review';
      warnings.push('All available videos need teacher review before recommendation.');
    } else if (input.recommendations.length === 0 && input.reviewQueue.length === 0 && input.rejected.length === 0) {
      status = 'no_candidates';
    } else if (rejectedCount > 0) {
      status = 'no_candidates';
      warnings.push('All candidates were rejected by safety checks.');
    } else {
      status = 'blocked';
    }

    // ── 5. Ensure no raw transcripts in output ──
    // (Already excluded by type contract — no transcript field exists in output)

    // ── 6. Safety warnings ──
    if (rejectedCount > 0) {
      warnings.push(`${rejectedCount} video(s) rejected by safety policy and not shown.`);
    }

    return {
      status,
      triggerReasons,
      requestSummary: {
        subject: null,
        topic: null,
        skillIds: [],
        activeArtifactIds: [],
        languagePreference: null,
        learnerAge: null,
        gradeLevel: null,
      },
      recommendations,
      reviewQueue,
      rejectedCount,
      warnings: warnings.slice(0, 5),
    };
  }

  /**
   * Check if a URL appears fake or unverifiable.
   */
  private _isFakeUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return true;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'example.com' || parsed.hostname.endsWith('.example.com')) {
        return true;
      }
      if (!parsed.protocol.startsWith('http')) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }
}

export const videoChatSafetyService = new VideoChatSafetyService();
