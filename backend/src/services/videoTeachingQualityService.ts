// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Teaching Quality Service v1
// Scores teaching quality signals from metadata.
// Does not overuse popularity. Conservative defaults.
// ─────────────────────────────────────────────────────────────

import type { VideoCandidateInput, VideoMetadata, VideoRecommendationEvidence } from './videoRecommendationContracts';

export class VideoTeachingQualityService {
  /**
   * Score teaching quality for a video candidate.
   * Dimensions: clarity, structure, exampleSupport, accessibility, signalQuality
   */
  scoreTeachingQuality(
    candidate: VideoCandidateInput,
    metadata: VideoMetadata | null,
  ): { score: number; dimensions: Record<string, number>; evidence: VideoRecommendationEvidence[] } {
    const evidence: VideoRecommendationEvidence[] = [];
    const title = (candidate.title || '').toLowerCase();
    const description = (candidate.description || '').toLowerCase();
    const combinedText = `${title} ${description} ${(candidate.transcriptSummary || '').toLowerCase()}`;

    // 1. Clarity (0-1): clear educational title and purpose
    const hasEducationalTitle = /^(learn|understand|explain|introduction|what is|how to|why|basics of|master|guide|tutorial|lesson|class)/i.test(candidate.title || '');
    const hasLessonObjective = /\b(learn|understand|explain|objective|goal|outcome|after this|you will|in this lesson|in this video)\b/i.test(description);
    const clarityScore = hasEducationalTitle ? (hasLessonObjective ? 0.9 : 0.7) : (hasLessonObjective ? 0.6 : 0.4);

    evidence.push({
      dimension: 'teaching_clarity',
      score: clarityScore,
      reason: hasEducationalTitle
        ? 'Educational title detected'
        : 'Title may not indicate clear educational purpose',
      source: 'candidate_metadata',
    });

    // 2. Structure (0-1): organized lesson flow
    const hasStructure = /\b(step|part|section|first|next|finally|introduction|summary|conclusion|overview)\b/i.test(combinedText);
    const structureScore = hasStructure ? 0.8 : 0.4;

    evidence.push({
      dimension: 'teaching_structure',
      score: structureScore,
      reason: hasStructure
        ? 'Structured lesson indicators detected'
        : 'No clear lesson structure signals',
      source: 'candidate_metadata',
    });

    // 3. Example support (0-1): uses examples
    const hasExamples = /\b(example|for instance|e\.g\.|such as|like|case study|demonstration|real.world|scenario|sample)\b/i.test(combinedText);
    const exampleScore = hasExamples ? 0.85 : 0.35;

    evidence.push({
      dimension: 'teaching_examples',
      score: exampleScore,
      reason: hasExamples
        ? 'Examples or demonstrations detected'
        : 'No example usage detected',
      source: 'candidate_metadata',
    });

    // 4. Accessibility (0-1): captions, appropriate duration
    const captionsBonus = metadata?.captionAvailable ? 0.15 : 0;
    const duration = metadata?.durationSeconds || candidate.durationSeconds;
    let durationScore = 0.5;
    if (duration) {
      if (duration >= 180 && duration <= 1200) durationScore = 0.9; // 3-20 min
      else if (duration >= 60 && duration <= 1800) durationScore = 0.7;
      else durationScore = 0.3;
    }
    const accessibilityScore = Math.min(1, durationScore + captionsBonus);

    evidence.push({
      dimension: 'teaching_accessibility',
      score: accessibilityScore,
      reason: captionsBonus > 0
        ? 'Captions available, duration appropriate'
        : 'Duration-based accessibility score',
      source: 'provider_metadata',
    });

    // 5. Signal quality (0-1): channel indicators, not purely entertainment
    const isEducationalChannel = /\b(khan|academy|ted.ed|crash.course|kurzgesagt|national.geographic|pbs|scishow|minute|veritasium|explained|professor|teacher|tutor|lecture|educational|learning|school|lesson|classroom|study)\b/i.test(candidate.channelTitle || '');
    const notEntertainment = !/\b(entertainment|funny|comedy|vlog|gaming|prank|reaction|music|dance|movie|trailer)\b/i.test(combinedText);
    const signalScore = isEducationalChannel ? 0.9 : (notEntertainment ? 0.6 : 0.2);

    evidence.push({
      dimension: 'teaching_signal_quality',
      score: signalScore,
      reason: isEducationalChannel
        ? 'Educational channel identified'
        : notEntertainment
          ? 'Not identified as entertainment content'
          : 'Content may be entertainment-focused',
      source: 'candidate_metadata',
    });

    // Composite score (weighted average)
    const weights = { clarity: 0.25, structure: 0.2, examples: 0.2, accessibility: 0.2, signalQuality: 0.15 };
    const finalScore =
      clarityScore * weights.clarity +
      structureScore * weights.structure +
      exampleScore * weights.examples +
      accessibilityScore * weights.accessibility +
      signalScore * weights.signalQuality;

    return {
      score: Math.round(finalScore * 100) / 100,
      dimensions: {
        clarity: clarityScore,
        structure: structureScore,
        examples: exampleScore,
        accessibility: accessibilityScore,
        signalQuality: signalScore,
      },
      evidence,
    };
  }
}

export const videoTeachingQualityService = new VideoTeachingQualityService();
