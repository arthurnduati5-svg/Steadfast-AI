// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Filter Service v1
// Applies hard exclusion gates before ranking.
// Uses deterministic rules. No AI. No fuzzy logic.
// Preserves rejected candidates with exact reasons.
// ─────────────────────────────────────────────────────────────

import type {
  VideoCandidateInput,
  VideoMetadata,
  VideoScoreDetail,
  VideoPolicyProfile,
} from './videoRecommendationContracts';

export interface HardFilterResult {
  blocked: boolean;
  blockReasons: string[];
  score: VideoScoreDetail;
}

export class VideoRecommendationFilterService {
  /**
   * Apply hard exclusion gates to a single candidate.
   * If blocked is true, the candidate must NOT be recommended.
   */
  applyHardFilters(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
    policy: VideoPolicyProfile,
    context: {
      learnerAge?: number | null;
      gradeLevel?: string | null;
      languagePreference?: string | null;
      subject?: string | null;
      topic?: string | null;
    },
  ): HardFilterResult {
    const blockReasons: string[] = [];
    const warnings: string[] = [];
    const title = (candidate.title || '').toLowerCase();
    const description = (candidate.description || '').toLowerCase();
    const channelTitle = (candidate.channelTitle || '').toLowerCase();
    const combined = `${title} ${description} ${channelTitle}`;

    // ── Gate 1: Explicit/unsafe sexual content ──
    if (policy.blockExplicitContent) {
      const explicitPatterns = [
        /\b(sex|sexual|nude|nudity|porn|pornography|erotic|explicit|adult\s+content|18\+|nsfw)\b/i,
      ];
      for (const pattern of explicitPatterns) {
        if (pattern.test(combined)) {
          blockReasons.push('Explicit content detected — blocked by school policy');
          break;
        }
      }
    }

    // ── Gate 2: Hate/extremist/anti-Islamic content ──
    if (policy.blockSectarianAttackContent) {
      const hatePatterns = [
        /\b(mockery|mocks|mocking|ridicule|insult)(\s+\w+)?\s+(religion|islam|muslim|allah|prophet|quran)/i,
        /\b(hate|extremist|terror|radical)\s+(speech|content|propaganda)/i,
        /\b(attack|curse|insult)\s+(islam|muslim|allah|prophet)/i,
        /\b(anti.?islam|islamophob|hate.?speech)/i,
      ];
      for (const pattern of hatePatterns) {
        if (pattern.test(combined)) {
          blockReasons.push('Hate or anti-Islamic content detected — blocked by school policy');
          break;
        }
      }
    }

    // ── Gate 3: Violence unsuitable for learner age ──
    if (policy.blockViolence) {
      const violencePatterns = [
        /\b(gore|blood|violence|killing|murder|torture|slaughter|brutal|graphic)\b/i,
      ];
      for (const pattern of violencePatterns) {
        if (pattern.test(combined)) {
          blockReasons.push('Violent or graphic content detected — blocked by school policy');
          break;
        }
      }
    }

    // ── Gate 4: Profanity ──
    if (policy.blockProfanity) {
      const profanityPatterns = [
        /\b(fuck|shit|damn|asshole|bitch|cock|dick|piss|bastard|whore|slut)\b/i,
      ];
      for (const pattern of profanityPatterns) {
        if (pattern.test(combined)) {
          blockReasons.push('Profanity detected — blocked by school policy');
          break;
        }
      }
    }

    // ── Gate 5: Racy/inappropriate content ──
    if (policy.blockRacyContent) {
      const racyPatterns = [
        /\b(sexy|bikini|lingerie|stripper|romantic|romance|dating|boyfriend|girlfriend)\b/i,
      ];
      for (const pattern of racyPatterns) {
        if (pattern.test(combined)) {
          blockReasons.push('Inappropriate content detected — blocked by school policy');
          break;
        }
      }
    }

    // ── Gate 6: Language mismatch (no usable captions) ──
    if (context.languagePreference) {
      const pref = context.languagePreference.toLowerCase().slice(0, 2);
      const videoLang = (candidate.language || metadata?.defaultLanguage || '').toLowerCase().slice(0, 2);
      const hasCaptions = metadata?.captionAvailable === true;

      if (videoLang && videoLang !== pref && !hasCaptions) {
        // Language mismatch without captions — major barrier
        const isCloseEnough = ['en', 'sw', 'ar'].includes(pref) && ['en', 'sw', 'ar'].includes(videoLang);
        if (!isCloseEnough) {
          blockReasons.push(`Language mismatch: video language (${videoLang}) differs from preference (${pref}) with no captions`);
        }
      }
    }

    // ── Gate 7: Off-topic (far from requested subject/topic) ──
    if (context.subject || context.topic) {
      const searchText = `${title} ${description}`;
      const queryTerms = [context.subject, context.topic]
        .filter(Boolean)
        .map(t => (t || '').toLowerCase().split(/\s+/))
        .flat()
        .filter(t => t.length >= 3);

      if (queryTerms.length > 0) {
        const matchCount = queryTerms.filter(t => searchText.includes(t)).length;
        const matchRatio = matchCount / queryTerms.length;
        if (matchRatio === 0) {
          warnings.push('No topic or subject keywords found in video metadata — may be off-topic');
        }
      }
    }

    // ── Gate 8: Metadata too incomplete to score safely ──
    if (!candidate.title || candidate.title.trim().length < 3) {
      blockReasons.push('Video title is missing or too short to evaluate safely');
    }

    // ── Gate 9: Unsafe or suspicious URL ──
    if (candidate.url) {
      try {
        const parsed = new URL(candidate.url);
        const hostname = parsed.hostname.toLowerCase();
        const knownUnsafeHosts = [
          'example.com', 'test.com', 'localhost',
        ];
        if (knownUnsafeHosts.includes(hostname) || hostname.endsWith('.example.com')) {
          blockReasons.push(`Suspicious or placeholder URL: ${candidate.url}`);
        }
      } catch {
        blockReasons.push(`Invalid video URL: ${candidate.url}`);
      }
    }

    // ── Build result ──
    const blocked = blockReasons.length > 0;
    const score: VideoScoreDetail = {
      score: blocked ? 0 : 0.8,
      label: blocked ? 'blocked' : 'acceptable',
      reason: blocked
        ? `Blocked by ${blockReasons.length} hard filter(s)`
        : 'Passed all hard filters',
      confidence: blocked ? 'high' : 'medium',
      evidence: blocked ? blockReasons : ['No hard filter violations'],
      warnings,
    };

    return { blocked, blockReasons, score };
  }
}

export const videoRecommendationFilterService = new VideoRecommendationFilterService();
