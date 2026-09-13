// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Source Trust Scorer v1
// Scores video source/channel trustworthiness.
// Uses existing sourceTrustService + curated channel trust list.
// Conservative defaults. Unknown source = low confidence.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoScoreDetail } from './videoRecommendationContracts';
import { inferVideoTrustTier } from './sourceTrustService';

const HIGH_TRUST_CHANNEL_PATTERNS = [
  /khan\s+academy/i,
  /ted[\s-]?ed/i,
  /crash\s+course/i,
  /kurzgesagt/i,
  /national\s+geographic/i,
  /free\s+science\s+lessons/i,
  /organic\s+chemistry\s+tutor/i,
  /math\s+antics/i,
  /professor\s+(leonard|dave)/i,
  /3blue1brown/i,
  /veritasium/i,
  /scishow/i,
  /minute(?:earth|physics|biology|food)/i,
  /pbs\s+(?:digital\s+)?(?:studios|nova)/i,
  /cogito\s+society/i,
  /simple\s+history/i,
  /the\s+school\s+of\s+life/i,
  /amnh|natural\s+history/i,
  /britannica/i,
  /openlearn|open\s+university/i,
];

const MEDIUM_TRUST_CHANNEL_PATTERNS = [
  /\b(academy|education|tutorial|lessons?|school|math|science|revision|learning|lecture|teacher|professor|tutor|classroom|explained|university|college|institute)\b/i,
];

const LOW_TRUST_PATTERNS = [
  /gaming|gameplay|walkthrough|lets\s+play/i,
  /vlog|daily\s+vlog|personal\s+vlog/i,
  /prank|reaction|challenge|comedy|funny|entertainment/i,
  /conspiracy|clickbait|shocking/i,
  /gossip|rumour|rumor|scandal/i,
  /get\s+rich|make\s+money|crypto|nft/i,
  /sponsored|paid\s+promotion|advert/i,
];

export class VideoSourceTrustScorer {
  /**
   * Score source/channel trust for a video candidate.
   */
  scoreSourceTrust(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
  ): { score: VideoScoreDetail } {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const channelTitle = candidate.channelTitle || metadata?.channelTitle || '';
    const title = candidate.title || metadata?.title || '';
    const provider = candidate.provider;

    // Check provider
    if (provider === 'youtube') {
      evidence.push('Source provider: YouTube');
    } else if (provider === 'manual' || provider === 'school_library') {
      evidence.push('Source provider: Manual or school library — trusted');
      return {
        score: {
          score: 0.9,
          label: 'good',
          reason: 'Manual or school-library source — trusted provenance',
          confidence: 'high',
          evidence: ['Provider is manual/school_library — verified by teacher or school'],
          warnings: [],
        },
      };
    } else {
      evidence.push(`Source provider: ${provider}`);
    }

    // Check for high-trust channel patterns
    for (const pattern of HIGH_TRUST_CHANNEL_PATTERNS) {
      if (pattern.test(channelTitle) || pattern.test(title)) {
        return {
          score: {
            score: 0.95,
            label: 'excellent',
            reason: `Highly trusted educational channel: ${channelTitle || 'Identified'}`,
            confidence: 'high',
            evidence: [`Channel matches trusted educational source pattern: ${pattern.source}`],
            warnings: [],
          },
        };
      }
    }

    // Use existing inferVideoTrustTier
    const tier = inferVideoTrustTier(channelTitle);
    if (tier === 'high') {
      return {
        score: {
          score: 0.85,
          label: 'good',
          reason: `Channel "${channelTitle || 'Unknown'}" has high trust tier`,
          confidence: 'medium',
          evidence: [`Channel trust tier: high`],
          warnings: [],
        },
      };
    }

    if (tier === 'medium') {
      return {
        score: {
          score: 0.6,
          label: 'acceptable',
          reason: `Channel "${channelTitle || 'Unknown'}" has medium trust tier`,
          confidence: 'medium',
          evidence: [`Channel trust tier: medium`],
          warnings: ['Medium-trust channel — verify content quality'],
        },
      };
    }

    // Check for medium-trust patterns
    for (const pattern of MEDIUM_TRUST_CHANNEL_PATTERNS) {
      if (pattern.test(channelTitle) || pattern.test(title)) {
        return {
          score: {
            score: 0.5,
            label: 'acceptable',
            reason: `Channel "${channelTitle || 'Unknown'}" has educational indicators`,
            confidence: 'low',
            evidence: [`Channel matches educational pattern: ${pattern.source}`],
            warnings: ['Educational indicators present but channel trust not established'],
          },
        };
      }
    }

    // Check for low-trust patterns
    for (const pattern of LOW_TRUST_PATTERNS) {
      if (pattern.test(channelTitle) || pattern.test(title)) {
        warnings.push(`Channel has low-trust indicators: ${pattern.source}`);
        return {
          score: {
            score: 0.15,
            label: 'weak',
            reason: `Channel "${channelTitle || 'Unknown'}" has low-trust signals`,
            confidence: 'medium',
            evidence: [`Low-trust pattern matched: ${pattern.source}`],
            warnings: [`Channel may not be suitable for educational context`],
          },
        };
      }
    }

    // Unknown channel
    return {
      score: {
        score: 0.35,
        label: 'weak',
        reason: `Channel "${channelTitle || 'Unknown'}" is not in trusted list — confidence is low`,
        confidence: 'low',
        evidence: ['Channel not found in trusted or blocked lists'],
        warnings: ['Unknown channel — teacher review recommended for critical topics'],
      },
    };
  }

  /**
   * Extract numeric score.
   */
  extractNumericScore(detail: { score: VideoScoreDetail }): number {
    return detail.score.score;
  }
}

export const videoSourceTrustScorer = new VideoSourceTrustScorer();
