import type {
  CreativeDeckRequest,
  CreativeScoredCandidate,
  NormalizedCreativeVideoCard,
} from './creativeStreamTypes';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: unknown): string {
  return safeString(value).trim().toLowerCase();
}

function ageDays(isoDate: string | null): number {
  if (!isoDate) return 30;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 30;
  return Math.max(0, (Date.now() - parsed.getTime()) / 86_400_000);
}

function freshnessScore(card: NormalizedCreativeVideoCard): number {
  const days = ageDays(card.publishedAt);
  if (days <= 14) return 0.9;
  if (days <= 60) return 0.75;
  if (days <= 180) return 0.62;
  return 0.45;
}

function topicContinuity(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): number {
  const activeTopic = normalizeText(request.activeTopic || request.topic || request.query);
  const cardTopic = normalizeText(card.topic || card.title);
  if (!activeTopic) return 0.5;
  if (!cardTopic) return 0.45;
  if (cardTopic.includes(activeTopic) || activeTopic.includes(cardTopic)) return 1;
  return 0.52;
}

function languageFit(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): number {
  const preferred = normalizeText(request.language);
  const candidate = normalizeText(card.language);
  if (!preferred) return 0.72;
  if (!candidate) return 0.62;
  return preferred === candidate ? 1 : 0.4;
}

function conceptFit(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): number {
  const topicSeed = normalizeText(request.activeTopic || request.topic || request.query);
  const searchable = normalizeText(`${card.title} ${card.description || ''} ${card.learningGoal}`);
  if (!topicSeed) return 0.66;
  if (searchable.includes(topicSeed)) return 1;
  return card.weakTopicFit ? 0.84 : 0.58;
}

function curiositySpark(card: NormalizedCreativeVideoCard): number {
  if (card.creativityType === 'spark') return 0.95;
  if (card.creativityType === 'reframe') return 0.9;
  if (card.creativityType === 'notice') return 0.84;
  if (card.creativityType === 'transfer') return 0.79;
  return 0.68;
}

function reframeValue(card: NormalizedCreativeVideoCard): number {
  if (card.creativityType === 'reframe') return 1;
  if (card.creativityType === 'notice') return 0.76;
  if (card.creativityType === 'spark') return 0.72;
  if (card.creativityType === 'transfer') return 0.74;
  return 0.6;
}

function trustScore(card: NormalizedCreativeVideoCard): number {
  if (card.trustTier === 'high') return 1;
  if (card.trustTier === 'medium') return 0.78;
  return 0.52;
}

function captionUtility(card: NormalizedCreativeVideoCard): number {
  if (card.captionsAvailable === true) return 1;
  if (card.captionsAvailable === false) return 0.46;
  return 0.66;
}

function noveltyScore(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): number {
  const seen = new Set((request.previouslySeenIds || []).map((entry) => normalizeText(entry)));
  const idKey = normalizeText(`${card.sourceType}:${card.sourceVideoId}`);
  if (seen.has(idKey) || seen.has(normalizeText(card.sourceVideoId))) return 0.2;
  return card.noveltyScore;
}

function diversityScore(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): number {
  const seenCreators = new Set((request.previouslySeenCreators || []).map((entry) => normalizeText(entry)));
  const creator = normalizeText(card.creatorName);
  if (!creator) return 0.62;
  return seenCreators.has(creator) ? 0.35 : 0.86;
}

export function scoreCreativeCandidates(
  cards: NormalizedCreativeVideoCard[],
  request: CreativeDeckRequest
): CreativeScoredCandidate[] {
  return cards
    .map((card) => {
      const breakdown = {
        conceptFit: conceptFit(card, request),
        curiositySpark: curiositySpark(card),
        intuitionValue: card.intuitionScore,
        reframeValue: reframeValue(card),
        weakTopicFit: card.weakTopicFit ? 1 : 0.5,
        continuity: topicContinuity(card, request),
        schoolFit: 0.72,
        languageFit: languageFit(card, request),
        captionUtility: captionUtility(card),
        trust: trustScore(card),
        novelty: noveltyScore(card, request),
        diversity: diversityScore(card, request),
        freshness: freshnessScore(card),
      };

      const compositeScore = clamp(
        breakdown.conceptFit * 0.17 +
          breakdown.curiositySpark * 0.11 +
          breakdown.intuitionValue * 0.1 +
          breakdown.reframeValue * 0.1 +
          breakdown.weakTopicFit * 0.08 +
          breakdown.continuity * 0.08 +
          breakdown.schoolFit * 0.05 +
          breakdown.languageFit * 0.06 +
          breakdown.captionUtility * 0.07 +
          breakdown.trust * 0.08 +
          breakdown.novelty * 0.05 +
          breakdown.diversity * 0.03 +
          breakdown.freshness * 0.02,
        0,
        1
      );

      return {
        ...card,
        compositeScore,
        scoreBreakdown: breakdown,
      } satisfies CreativeScoredCandidate;
    })
    .sort((left, right) => right.compositeScore - left.compositeScore);
}
