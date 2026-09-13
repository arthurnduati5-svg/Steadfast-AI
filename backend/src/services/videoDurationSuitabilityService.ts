// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Duration Suitability Service v1
// Scores video duration against learner preference or defaults.
// Conservative defaults. Unknown duration = weak score.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoScoreDetail } from './videoRecommendationContracts';

export const DEFAULT_IDEAL_MIN_SECONDS = 180;   // 3 min
export const DEFAULT_IDEAL_MAX_SECONDS = 1200;  // 20 min
export const DEFAULT_ACCEPTABLE_MIN_SECONDS = 90;
export const DEFAULT_ACCEPTABLE_MAX_SECONDS = 2100;

export class VideoDurationSuitabilityService {
  /**
   * Score video duration suitability.
   */
  scoreDurationSuitability(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    preferredDurationMinutes?: number | null,
  ): { score: VideoScoreDetail } {
    const durationSeconds = metadata?.durationSeconds || candidate.durationSeconds || null;
    const evidence: string[] = [];
    const warnings: string[] = [];

    // Unknown duration
    if (durationSeconds === null || typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) {
      return {
        score: {
          score: 0.2,
          label: 'weak',
          reason: 'Video duration unknown — cannot assess suitability',
          confidence: 'low',
          evidence: ['No duration data available from provider or metadata'],
          warnings: ['Duration unknown — may be too long or too short'],
        },
      };
    }

    const minutes = Math.round(durationSeconds / 60);

    // Use preferred duration if provided
    if (preferredDurationMinutes && preferredDurationMinutes > 0) {
      const preferredSeconds = preferredDurationMinutes * 60;
      const ratio = durationSeconds / preferredSeconds;

      if (ratio >= 0.7 && ratio <= 1.5) {
        return {
          score: {
            score: 1.0,
            label: 'excellent',
            reason: `Duration (${minutes}min) matches requested ${preferredDurationMinutes}min preference`,
            confidence: 'high',
            evidence: [`Duration: ${minutes}min, Preferred: ${preferredDurationMinutes}min`],
            warnings: [],
          },
        };
      }
      if (ratio >= 0.4 && ratio <= 2.5) {
        return {
          score: {
            score: 0.65,
            label: 'acceptable',
            reason: `Duration (${minutes}min) is reasonably close to ${preferredDurationMinutes}min preference`,
            confidence: 'medium',
            evidence: [`Duration: ${minutes}min (ratio ${ratio.toFixed(2)})`],
            warnings: [],
          },
        };
      }
      return {
        score: {
          score: 0.25,
          label: 'weak',
          reason: `Duration (${minutes}min) differs significantly from requested ${preferredDurationMinutes}min`,
          confidence: 'medium',
          evidence: [`Duration: ${minutes}min, Preferred: ${preferredDurationMinutes}min`],
          warnings: ['Duration may not match learner attention span'],
        },
      };
    }

    // No preference — use defaults
    if (durationSeconds >= DEFAULT_IDEAL_MIN_SECONDS && durationSeconds <= DEFAULT_IDEAL_MAX_SECONDS) {
      return {
        score: {
          score: 0.9,
          label: 'excellent',
          reason: `Duration ${minutes}min is ideal for a focused learning session`,
          confidence: 'high',
          evidence: [`Duration: ${minutes}min (ideal range: ${Math.round(DEFAULT_IDEAL_MIN_SECONDS / 60)}-${Math.round(DEFAULT_IDEAL_MAX_SECONDS / 60)}min)`],
          warnings: [],
        },
      };
    }

    if (durationSeconds >= DEFAULT_ACCEPTABLE_MIN_SECONDS && durationSeconds <= DEFAULT_ACCEPTABLE_MAX_SECONDS) {
      return {
        score: {
          score: 0.6,
          label: 'acceptable',
          reason: `Duration ${minutes}min is acceptable for most learning contexts`,
          confidence: 'medium',
          evidence: [`Duration: ${minutes}min`],
          warnings: ['Duration may be at the edge of typical attention span'],
        },
      };
    }

    // Too short
    if (durationSeconds < DEFAULT_ACCEPTABLE_MIN_SECONDS) {
      return {
        score: {
          score: 0.2,
          label: 'weak',
          reason: `Duration ${minutes}min is very short — may lack sufficient depth`,
          confidence: 'medium',
          evidence: [`Duration: ${minutes}min (below ${Math.round(DEFAULT_ACCEPTABLE_MIN_SECONDS / 60)}min threshold)`],
          warnings: ['Very short video may not provide thorough explanation'],
        },
      };
    }

    // Too long
    if (durationSeconds > DEFAULT_ACCEPTABLE_MAX_SECONDS) {
      return {
        score: {
          score: 0.15,
          label: 'weak',
          reason: `Duration ${minutes}min is very long — may exceed learner attention span`,
          confidence: 'medium',
          evidence: [`Duration: ${minutes}min (above ${Math.round(DEFAULT_ACCEPTABLE_MAX_SECONDS / 60)}min threshold)`],
          warnings: ['Long video may be difficult to complete in one session'],
        },
      };
    }

    // Fallback
    return {
      score: {
        score: 0.3,
        label: 'weak',
        reason: 'Duration suitability uncertain',
        confidence: 'low',
        evidence: [],
        warnings: ['Unable to confidently assess duration fit'],
      },
    };
  }

  /**
   * Extract a numeric score (0-1) from the detail for easy integration with existing services.
   */
  extractNumericScore(detail: { score: VideoScoreDetail }): number {
    return detail.score.score;
  }
}

export const videoDurationSuitabilityService = new VideoDurationSuitabilityService();
