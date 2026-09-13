// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Ranking Service v1
// Weighted scoring, hard exclusions, deterministic sorting.
// ─────────────────────────────────────────────────────────────

import type {
  VideoCandidateInput,
  VideoMetadata,
  VideoScoreBreakdown,
  VideoRankingDecision,
  VideoRecommendationStatus,
  VideoRecommendationEvidence,
  IslamicAppropriatenessStatus,
  AgeSuitabilityStatus,
} from './videoRecommendationContracts';

export const RANKING_WEIGHTS = {
  syllabusAlignment: 0.22,
  topicRelevance: 0.16,
  learnerNeedFit: 0.14,
  ageSuitability: 0.12,
  islamicAppropriateness: 0.14,
  languageSuitability: 0.08,
  teachingQuality: 0.08,
  sourceTrust: 0.04,
  accessibility: 0.01,
  availability: 0.01,
};

export interface RankingInput {
  candidate: VideoCandidateInput;
  metadata: VideoMetadata | null;
  scores: {
    syllabusAlignment: number;
    topicRelevance: number;
    learnerNeedFit: number;
    ageSuitability: number;
    ageSuitabilityStatus: AgeSuitabilityStatus;
    islamicAppropriateness: number;
    islamicAppropriatenessStatus: IslamicAppropriatenessStatus;
    languageSuitability: number;
    teachingQuality: number;
    sourceTrust: number;
    accessibility: number;
    availability: number;
  };
  evidence: VideoRecommendationEvidence[];
}

export interface RankingOutput {
  decision: VideoRankingDecision;
  status: VideoRecommendationStatus;
  score: VideoScoreBreakdown;
  rejectionReasons: string[];
}

export class VideoRankingService {
  /**
   * Compute final score from individual dimension scores.
   */
  computeFinalScore(scores: RankingInput['scores']): number {
    return (
      scores.syllabusAlignment * RANKING_WEIGHTS.syllabusAlignment +
      scores.topicRelevance * RANKING_WEIGHTS.topicRelevance +
      scores.learnerNeedFit * RANKING_WEIGHTS.learnerNeedFit +
      scores.ageSuitability * RANKING_WEIGHTS.ageSuitability +
      scores.islamicAppropriateness * RANKING_WEIGHTS.islamicAppropriateness +
      scores.languageSuitability * RANKING_WEIGHTS.languageSuitability +
      scores.teachingQuality * RANKING_WEIGHTS.teachingQuality +
      scores.sourceTrust * RANKING_WEIGHTS.sourceTrust +
      scores.accessibility * RANKING_WEIGHTS.accessibility +
      scores.availability * RANKING_WEIGHTS.availability
    );
  }

  /**
   * Rank a single video candidate. Applies hard exclusions and needs-review rules.
   */
  rank(input: RankingInput): RankingOutput {
    const rejectionReasons: string[] = [];
    const finalScore = this.computeFinalScore(input.scores);
    const s = input.scores;

    // ── Hard exclusions ──
    // Explicit/unsafe Islamic policy
    if (s.islamicAppropriatenessStatus === 'not_aligned') {
      rejectionReasons.push('Islamic policy not aligned — excluded');
      return {
        decision: 'exclude',
        status: 'not_recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons,
      };
    }

    // Adult age rating for child learner
    if (s.ageSuitabilityStatus === 'not_suitable') {
      rejectionReasons.push('Not age-suitable for learner');
      return {
        decision: 'exclude',
        status: 'not_recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons,
      };
    }

    // Wrong language with no captions
    if (s.languageSuitability < 0.2) {
      rejectionReasons.push('Language not suitable and no captions available');
      return {
        decision: 'exclude',
        status: 'not_recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons,
      };
    }

    // Off-topic below threshold
    if (s.syllabusAlignment < 0.2 && s.topicRelevance < 0.2) {
      rejectionReasons.push('Off-topic — insufficient alignment with syllabus or topic');
      return {
        decision: 'exclude',
        status: 'not_recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons,
      };
    }

    // ── Needs review rules ──
    const reviewReasons: string[] = [];
    if (s.islamicAppropriatenessStatus === 'unknown' || s.islamicAppropriatenessStatus === 'needs_review') {
      reviewReasons.push('Islamic appropriateness policy status needs review');
    }
    if (s.ageSuitabilityStatus === 'unknown') {
      reviewReasons.push('Age suitability unknown — needs review');
    }
    if (s.languageSuitability < 0.3) {
      reviewReasons.push('Language suitability low — needs review');
    }

    if (reviewReasons.length > 0) {
      return {
        decision: 'needs_teacher_review',
        status: 'needs_review',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons: reviewReasons,
      };
    }

    // ── Include decision ──
    if (finalScore >= 0.5) {
      return {
        decision: 'include',
        status: 'recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons,
      };
    }

    if (finalScore >= 0.3) {
      return {
        decision: 'include_with_warning',
        status: 'recommended',
        score: this.buildScoreBreakdown(finalScore, s),
        rejectionReasons: ['Lower confidence score — teacher review recommended'],
      };
    }

    // Below threshold
    rejectionReasons.push(`Final score (${finalScore.toFixed(2)}) below recommendation threshold`);
    return {
      decision: 'exclude',
      status: 'not_recommended',
      score: this.buildScoreBreakdown(finalScore, s),
      rejectionReasons,
    };
  }

  private buildScoreBreakdown(finalScore: number, s: RankingInput['scores']): VideoScoreBreakdown {
    return {
      finalScore: Math.round(finalScore * 10000) / 10000,
      syllabusAlignment: s.syllabusAlignment,
      topicRelevance: s.topicRelevance,
      learnerNeedFit: s.learnerNeedFit,
      ageSuitability: s.ageSuitability,
      islamicAppropriateness: s.islamicAppropriateness,
      languageSuitability: s.languageSuitability,
      teachingQuality: s.teachingQuality,
      sourceTrust: s.sourceTrust,
      accessibility: s.accessibility,
      availability: s.availability,
    };
  }
}

export const videoRankingService = new VideoRankingService();
