// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Language Suitability Service v1
// Scores video language match against learner preferences.
// Caption availability improves borderline scores.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, LanguageSuitabilityStatus, VideoRecommendationEvidence } from './videoRecommendationContracts';

export class VideoLanguageSuitabilityService {
  /**
   * Score language suitability for a video candidate.
   */
  scoreLanguageSuitability(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    languagePreference?: string | null,
  ): {
    status: LanguageSuitabilityStatus;
    score: number;
    evidence: VideoRecommendationEvidence[];
  } {
    const evidence: VideoRecommendationEvidence[] = [];

    // No language preference — can't assess
    if (!languagePreference) {
      return {
        status: 'unknown',
        score: 0.5,
        evidence: [{
          dimension: 'language_suitability',
          score: 0.5,
          reason: 'No language preference provided — neutral score',
          source: 'structured_context',
        }],
      };
    }

    const pref = languagePreference.toLowerCase().slice(0, 2);
    const videoLang = (candidate.language || metadata?.defaultLanguage || '').toLowerCase().slice(0, 2);
    const audioLang = (metadata?.defaultAudioLanguage || '').toLowerCase().slice(0, 2);
    const captionsAvailable = metadata?.captionAvailable === true;

    // Exact language match
    if (videoLang === pref || audioLang === pref) {
      evidence.push({
        dimension: 'language_suitability',
        score: 1.0,
        reason: `Exact language match: ${pref}`,
        source: 'provider_metadata',
      });
      return { status: 'suitable', score: 1.0, evidence };
    }

    // Title/description gives language hint but no explicit match
    const title = (candidate.title || '').toLowerCase();
    const desc = (candidate.description || '').toLowerCase();

    // If video language is unknown, check if captions are available in preferred language
    if (videoLang === '' && captionsAvailable) {
      evidence.push({
        dimension: 'language_suitability',
        score: 0.6,
        reason: 'Video language unknown but captions available — borderline',
        source: 'provider_metadata',
      });
      return { status: 'borderline' as LanguageSuitabilityStatus, score: 0.6, evidence };
    }

    // Wrong language but captions available
    if (captionsAvailable) {
      evidence.push({
        dimension: 'language_suitability',
        score: 0.4,
        reason: `Video language (${videoLang || 'unknown'}) differs from preference (${pref}), but captions available`,
        source: 'provider_metadata',
      });
      return { status: 'borderline' as LanguageSuitabilityStatus, score: 0.4, evidence };
    }

    // Wrong language and no captions — not suitable
    if (videoLang && videoLang !== pref) {
      evidence.push({
        dimension: 'language_suitability',
        score: 0.1,
        reason: `Video language (${videoLang}) does not match preference (${pref})`,
        source: 'provider_metadata',
      });
      return { status: 'not_suitable', score: 0.1, evidence };
    }

    // Completely unknown
    return {
      status: 'unknown',
      score: 0.3,
      evidence: [{
        dimension: 'language_suitability',
        score: 0.3,
        reason: 'Language metadata unavailable — cannot assess',
        source: 'candidate_metadata',
      }],
    };
  }
}

export const videoLanguageSuitabilityService = new VideoLanguageSuitabilityService();
