// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Transcript Service v1
// Detects caption/transcript availability, bounds summaries,
// never exposes raw full transcripts.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata } from './videoRecommendationContracts';

export class VideoTranscriptService {
  /**
   * Check if transcript/caption data is available for a candidate.
   */
  isTranscriptAvailable(candidate: VideoCandidateInput, metadata?: VideoMetadata | null): boolean {
    if (candidate.transcriptSummary && candidate.transcriptSummary.trim().length > 0) {
      return true;
    }
    if (metadata?.captionAvailable === true) {
      return true;
    }
    return false;
  }

  /**
   * Get a safe bounded transcript summary for AI scoring.
   * Never returns raw full transcripts.
   * Returns null if unavailable.
   */
  getSafeTranscriptSummary(candidate: VideoCandidateInput, metadata?: VideoMetadata | null): string | null {
    if (candidate.transcriptSummary && candidate.transcriptSummary.trim().length > 0) {
      return candidate.transcriptSummary.trim().slice(0, 1000);
    }
    if (metadata?.captionAvailable === true) {
      return 'Captions are available for this video.';
    }
    return null;
  }

  /**
   * Score transcript availability for ranking.
   * 1.0 = transcript summary available
   * 0.6 = captions available (confirmed by metadata)
   * 0.0 = unknown/unavailable
   */
  scoreTranscriptAvailability(candidate: VideoCandidateInput, metadata?: VideoMetadata | null): number {
    if (candidate.transcriptSummary && candidate.transcriptSummary.trim().length > 0) {
      return 1.0;
    }
    if (metadata?.captionAvailable === true) {
      return 0.6;
    }
    return 0.0;
  }

  /**
   * Estimate accessibility score (0-1) for ranking.
   * Considers transcript/caption availability.
   */
  scoreAccessibility(candidate: VideoCandidateInput, metadata?: VideoMetadata | null): number {
    const transcriptScore = this.scoreTranscriptAvailability(candidate, metadata);
    const duration = metadata?.durationSeconds || candidate.durationSeconds;

    // Bonus for reasonable duration (2-20 min)
    let durationBonus = 0;
    if (duration && duration >= 120 && duration <= 1200) {
      durationBonus = 0.2;
    }

    return Math.min(1, transcriptScore + durationBonus);
  }

  /**
   * Check for potentially unsafe content indicators in transcript summary.
   * Does NOT override system instructions.
   * Transcript text is treated as untrusted input.
   */
  hasUnsafeTranscriptIndicators(transcriptSummary: string): boolean {
    const unsafePatterns = [
      /\b(explicit|nsfw|porn|nudity|gore|violence)\b/i,
      /\b(ignore\s+(previous|above)\s+instructions|system\s+prompt)\b/i,
    ];
    return unsafePatterns.some(p => p.test(transcriptSummary));
  }
}

export const videoTranscriptService = new VideoTranscriptService();
