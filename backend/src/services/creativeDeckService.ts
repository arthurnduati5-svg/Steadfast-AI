import { fetchExternalCreativeVideoCandidates } from './externalVideoCandidateService';
import { normalizeExternalVideoCandidates } from './externalVideoNormalizationService';
import { filterCreativeSafetyAndQuality } from './creativeSafetyAndQualityService';
import { scoreCreativeCandidates } from './creativeScoringService';
import type { CreativeCardRole, CreativeDeckBuildResult, CreativeDeckRequest, CreativeScoredCandidate } from './creativeStreamTypes';

const DECK_CACHE_TTL_MS = 18 * 60 * 1000;
const DECK_CACHE = new Map<string, { ts: number; cards: CreativeScoredCandidate[] }>();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildDeckCacheKey(request: CreativeDeckRequest): string {
  return JSON.stringify({
    query: safeString(request.query).trim().toLowerCase(),
    topic: safeString(request.topic).trim().toLowerCase(),
    activeTopic: safeString(request.activeTopic).trim().toLowerCase(),
    subject: safeString(request.subject).trim().toLowerCase(),
    weak: (request.weakTopics || []).map((entry) => safeString(entry).trim().toLowerCase()).slice(0, 6),
    language: safeString(request.language).trim().toLowerCase(),
    learningNeed: safeString(request.learningNeed).trim().toLowerCase(),
    schoolLevel: safeString(request.schoolLevel).trim().toLowerCase(),
    allowYouTube: request.allowYouTube !== false,
    allowVimeo: request.allowVimeo !== false,
  });
}

function roleSequenceWeight(role: CreativeCardRole, index: number): number {
  if (index === 0 && (role === 'spark' || role === 'reframe')) return 0.12;
  if (index === 1 && (role === 'notice' || role === 'reframe')) return 0.08;
  if (index >= 2 && role === 'transfer') return 0.09;
  if (index >= 3 && role === 'deepen') return 0.06;
  return 0;
}

function curateBoundedDeck(scored: CreativeScoredCandidate[], limit: number): CreativeScoredCandidate[] {
  const queue = [...scored];
  const deck: CreativeScoredCandidate[] = [];
  const creatorUsage = new Map<string, number>();
  const topicUsage = new Map<string, number>();
  const roleUsage = new Map<string, number>();

  while (deck.length < limit && queue.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < queue.length; index += 1) {
      const candidate = queue[index];
      const creatorKey = safeString(candidate.creatorName).trim().toLowerCase();
      const topicKey = safeString(candidate.topic || candidate.title).trim().toLowerCase();
      const roleKey = candidate.creativityType;
      const creatorPenalty = (creatorUsage.get(creatorKey) || 0) * 0.13;
      const topicPenalty = (topicUsage.get(topicKey) || 0) * 0.18;
      const rolePenalty = (roleUsage.get(roleKey) || 0) * 0.09;
      const sequenceBoost = roleSequenceWeight(candidate.creativityType, deck.length);
      const diversityBoost = creatorUsage.has(creatorKey) ? 0 : 0.05;
      const adjusted = candidate.compositeScore - creatorPenalty - topicPenalty - rolePenalty + sequenceBoost + diversityBoost;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    }
    const [picked] = queue.splice(bestIndex, 1);
    deck.push(picked);

    const creatorKey = safeString(picked.creatorName).trim().toLowerCase();
    const topicKey = safeString(picked.topic || picked.title).trim().toLowerCase();
    const roleKey = picked.creativityType;
    creatorUsage.set(creatorKey, (creatorUsage.get(creatorKey) || 0) + 1);
    topicUsage.set(topicKey, (topicUsage.get(topicKey) || 0) + 1);
    roleUsage.set(roleKey, (roleUsage.get(roleKey) || 0) + 1);
  }
  return deck;
}

export async function buildCreativeDeck(request: CreativeDeckRequest): Promise<CreativeDeckBuildResult> {
  const deckCacheKey = buildDeckCacheKey(request);
  const targetInitial = clamp(Number(request.limit || 10), 8, 12);
  const targetTotal = clamp(Number(request.limit || targetInitial), targetInitial, targetInitial + 6);

  const external = await fetchExternalCreativeVideoCandidates(request);
  const normalized = normalizeExternalVideoCandidates(external.candidates, request);
  const filtered = filterCreativeSafetyAndQuality(normalized, request);
  const scored = scoreCreativeCandidates(filtered.accepted, request);
  const cards = curateBoundedDeck(scored, targetTotal);

  const notices = [...external.notices];
  if (filtered.rejected.length > 0) {
    notices.push(`Filtered ${filtered.rejected.length} low-quality or unsafe candidates before ranking.`);
  }
  if (cards.length < targetInitial && cards.length > 0) {
    notices.push('Creative stream returned a smaller batch to protect quality.');
  }

  if (cards.length === 0) {
    const cached = DECK_CACHE.get(deckCacheKey);
    if (cached && Date.now() - cached.ts < DECK_CACHE_TTL_MS && cached.cards.length > 0) {
      return {
        cards: cached.cards.slice(0, targetInitial),
        notices: [...notices, 'Reused a previous high-quality creative deck while sources recover.'],
        sourceHealth: {
          ...external.sourceHealth,
          usedCache: true,
        },
      };
    }
  } else {
    DECK_CACHE.set(deckCacheKey, { ts: Date.now(), cards });
  }

  return {
    cards,
    notices,
    sourceHealth: external.sourceHealth,
  };
}
