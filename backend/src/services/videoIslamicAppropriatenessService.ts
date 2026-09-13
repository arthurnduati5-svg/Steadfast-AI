// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Islamic Appropriateness Service v1
// School policy alignment service, NOT a religious ruling engine.
// Conservative defaults. Unknown evidence = needs review.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, IslamicAppropriatenessStatus, IslamicAppropriatenessReview, IslamicAppropriatenessMode, VideoRecommendationEvidence } from './videoRecommendationContracts';

const CONSERVATIVE_FLAGS = [
  { pattern: /\b(sex|sexual|nude|nudity|porn|pornography|erotic)\b/i, label: 'explicit_sexual' },
  { pattern: /\b(sexy|hot|bikini|lingerie|stripper?|naked)\b/i, label: 'racy_content' },
  { pattern: /\b( damn?|shit|fuck|asshole|bitch|cock|dick|piss|bastard)\b/i, label: 'profanity' },
  { pattern: /\b(gore|blood|violence|killing|murder|torture|slaughter|brutal)\b/i, label: 'violence_gore' },
  { pattern: /\b(mockery|mocks|mocking|ridicule|insult)\s+(religion|islam|muslim|allah|prophet|quran|god)\b/i, label: 'mockery_of_religion' },
  { pattern: /\b(sectarian|shia|sunni|takfir|kafir|rafidhah|nasibi)\s+(attack|hate|curse|insult)\b/i, label: 'sectarian_attack' },
  { pattern: /\b(black magic|magic|sorcery|witchcraft|superstition|fortune.teller|astrology|horoscope)\s+(lesson|class|tutorial|teach|learn)\b/i, label: 'occult_as_instruction' },
  { pattern: /\b(music\s+video|lyric|song|concert|music\s+lesson|guitar\s+lesson|piano\s+lesson|singing)\b/i, label: 'music_entertainment' },
  { pattern: /\b(romantic|romance|dating|boyfriend|girlfriend|kiss|kissing|love\s+story|relationship)\b.*\b(movie|video|film|lesson|tutorial)\b/i, label: 'romantic_content' },
  { pattern: /\b(political\s+propaganda|political\s+agenda|political\s+party|election\s+campaign)\b/i, label: 'political_propaganda' },
];

const CHANNEL_TRUST_INDICATORS = [
  { pattern: /khan\s+academy/i, trust: 'high' },
  { pattern: /ted[- ]?ed/i, trust: 'high' },
  { pattern: /national\s+geographic/i, trust: 'high' },
  { pattern: /crash\s+course/i, trust: 'high' },
  { pattern: /kurzgesagt/i, trust: 'high' },
  { pattern: /veritasium/i, trust: 'medium' },
  { pattern: /minute(?:earth|physics|biology|food)/i, trust: 'medium' },
  { pattern: /scishow/i, trust: 'medium' },
  { pattern: /pbs\s+(?:digital\s+)?studios/i, trust: 'medium' },
  { pattern: /cogito/i, trust: 'medium' },
  { pattern: /the\s+school\s+of\s+life/i, trust: 'medium' },
  { pattern: /simple\s+history/i, trust: 'medium' },
  { pattern: /islamic\s+(knowledge|lectures|lessons|studies)\b/i, trust: 'needs_review' },
];

export class VideoIslamicAppropriatenessService {
  /**
   * Score Islamic appropriateness for a video candidate.
   * Conservative defaults. No religious rulings.
   */
  scoreAppropriateness(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    mode: IslamicAppropriatenessMode = 'balanced',
  ): IslamicAppropriatenessReview & { score: number; evidence: VideoRecommendationEvidence[] } {
    const evidence: VideoRecommendationEvidence[] = [];
    const title = (candidate.title || '') + ' ' + (candidate.description || '') + ' ' + (candidate.channelTitle || '');
    const transcriptSummary = candidate.transcriptSummary || '';

    const flags: string[] = [];

    // Check against conservative flags
    for (const flag of CONSERVATIVE_FLAGS) {
      if (flag.pattern.test(title) || flag.pattern.test(transcriptSummary)) {
        flags.push(flag.label);
        evidence.push({
          dimension: 'islamic_appropriateness',
          score: 0,
          reason: `Flag: ${flag.label} detected`,
          source: 'candidate_metadata',
        });
      }
    }

    // Moderating factors: channel trust
    let channelModeration = 0;
    for (const indicator of CHANNEL_TRUST_INDICATORS) {
      if (indicator.pattern.test(candidate.channelTitle || '') || indicator.pattern.test(candidate.title || '')) {
        if (indicator.trust === 'high') channelModeration = 0.3;
        else if (indicator.trust === 'medium') channelModeration = 0.15;
        break;
      }
    }

    if (flags.length > 0) {
      const flagScore = Math.max(0, 0.3 - (flags.length * 0.15) + channelModeration);
      const finalScore = Math.min(0.4, flagScore);

      if (mode === 'strict') {
        return {
          status: 'not_aligned',
          confidence: 0.8,
          score: 0,
          reasons: flags.map(f => `Content flagged: ${f}`),
          warnings: ['Strict mode — any content flag triggers exclusion'],
          needsTeacherReview: false,
          evidence: [...evidence, {
            dimension: 'islamic_appropriateness',
            score: 0,
            reason: `Strict mode exclusion: ${flags.join(', ')}`,
            source: 'policy',
          }],
        };
      }

      return {
        status: 'needs_review',
        confidence: 0.6,
        score: finalScore,
        reasons: flags.map(f => `Potential issue: ${f}`),
        warnings: ['Content flags detected — teacher review recommended'],
        needsTeacherReview: true,
        evidence,
      };
    }

    // No flags detected
    if (channelModeration > 0) {
      evidence.push({
        dimension: 'islamic_appropriateness',
        score: 0.9,
        reason: `No content flags. Trusted channel: ${candidate.channelTitle || 'Unknown'}`,
        source: 'candidate_metadata',
      });
      return {
        status: 'aligned',
        confidence: 0.8,
        score: 0.9,
        reasons: ['No content concerns detected'],
        warnings: [],
        needsTeacherReview: false,
        evidence,
      };
    }

    // Unknown channel, no flags — acceptable with lower confidence
    evidence.push({
      dimension: 'islamic_appropriateness',
      score: 0.7,
      reason: 'No content flags detected, but channel not in trusted list',
      source: 'candidate_metadata',
    });

    return {
      status: mode === 'strict' ? 'needs_review' : 'acceptable',
      confidence: 0.5,
      score: 0.7,
      reasons: ['No explicit content concerns detected'],
      warnings: mode === 'strict' ? ['Unknown channel — needs review in strict mode'] : [],
      needsTeacherReview: mode === 'strict',
      evidence,
    };
  }
}

export const videoIslamicAppropriatenessService = new VideoIslamicAppropriatenessService();
