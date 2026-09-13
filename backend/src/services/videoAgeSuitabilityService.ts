// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Age Suitability Service v1
// Scores video suitability for learner age/grade.
// Conservative defaults. Unknown metadata = needs review.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, AgeSuitabilityStatus, VideoRecommendationEvidence } from './videoRecommendationContracts';

export class VideoAgeSuitabilityService {
  /**
   * Score age suitability for a video candidate.
   */
  scoreAgeSuitability(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    learnerAge?: number | null,
    gradeLevel?: string | null,
  ): {
    status: AgeSuitabilityStatus;
    score: number;
    evidence: VideoRecommendationEvidence[];
  } {
    const evidence: VideoRecommendationEvidence[] = [];

    // If no learner age and no grade level, status = unknown
    if (!learnerAge && !gradeLevel) {
      return {
        status: 'unknown',
        score: 0.3,
        evidence: [{
          dimension: 'age_suitability',
          score: 0.3,
          reason: 'Learner age and grade level unknown — cannot assess suitability',
          source: 'structured_context',
        }],
      };
    }

    const effectiveAge = learnerAge || this.guessAgeFromGrade(gradeLevel);

    // Check content ratings if available
    if (metadata?.contentRatings) {
      const ratings = metadata.contentRatings;
      if (ratings['ytRating'] === 'ytAgeRestricted' || ratings['mpaaRating']?.includes('R') || ratings['tvRating']?.includes('MA')) {
        return {
          status: 'not_suitable',
          score: 0,
          evidence: [{
            dimension: 'age_suitability',
            score: 0,
            reason: 'Content rating indicates adult content — not suitable for learners',
            source: 'provider_metadata',
          }],
        };
      }
    }

    // Check madeForKids flag
    if (metadata?.madeForKids === true && effectiveAge && effectiveAge > 13) {
      return {
        status: 'borderline',
        score: 0.5,
        evidence: [{
          dimension: 'age_suitability',
          score: 0.5,
          reason: 'Made for kids flag may oversimplify for older learner',
          source: 'provider_metadata',
        }],
      };
    }

    // Check duration
    const duration = metadata?.durationSeconds || candidate.durationSeconds;
    if (duration && effectiveAge) {
      if (effectiveAge <= 10 && duration > 600) {
        return {
          status: 'borderline',
          score: 0.4,
          evidence: [{
            dimension: 'age_suitability',
            score: 0.4,
            reason: `Long duration (${Math.round(duration / 60)}min) for young learner (age ${effectiveAge})`,
            source: 'provider_metadata',
          }],
        };
      }
    }

    // Title/description risk cues
    const title = (candidate.title || '').toLowerCase();
    const description = (candidate.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    const adultCues = /\b(adult|mature|18\+|nsfw|explicit)\b/i;
    if (adultCues.test(combined)) {
      return {
        status: 'not_suitable',
        score: 0,
        evidence: [{
          dimension: 'age_suitability',
          score: 0,
          reason: 'Title/description contains adult content indicators',
          source: 'candidate_metadata',
        }],
      };
    }

    // Default: suitable with evidence
    const ageAppropriateScore = effectiveAge && effectiveAge >= 12 ? 0.9 : 0.7;
    evidence.push({
      dimension: 'age_suitability',
      score: ageAppropriateScore,
      reason: effectiveAge
        ? `Age-appropriate for learner age ${effectiveAge}`
        : 'Age-appropriate based on grade level',
      source: 'structured_context',
    });

    return { status: 'suitable', score: ageAppropriateScore, evidence };
  }

  private guessAgeFromGrade(gradeLevel?: string | null): number | null {
    if (!gradeLevel) return null;
    const grade = String(gradeLevel).toLowerCase().replace(/[^0-9]/g, '');
    const num = parseInt(grade, 10);
    if (Number.isFinite(num) && num >= 1 && num <= 12) {
      return num + 5; // Rough: grade 1 ≈ age 6, grade 12 ≈ age 17
    }
    return null;
  }
}

export const videoAgeSuitabilityService = new VideoAgeSuitabilityService();
