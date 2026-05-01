import type {
  CreativeDeckRequest,
  CreativeSafetyFilterResult,
  NormalizedCreativeVideoCard,
} from './creativeStreamTypes';

const BLOCKED_CONTENT_REGEX =
  /\b(adult|porn|nsfw|graphic|gore|gambling|casino|weapon|violence|extremist|dating prank|shock)\b/i;
const EDUCATIONAL_SIGNAL_REGEX =
  /\b(explain|education|lesson|tutorial|learn|science|math|chemistry|physics|biology|history|geography|concept|example)\b/i;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLanguage(value: unknown): string | null {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw) return null;
  return raw.split(/[-_]/)[0] || null;
}

function hasMetadataCompleteness(card: NormalizedCreativeVideoCard): boolean {
  return Boolean(
    card.title &&
      card.canonicalUrl &&
      card.embedUrl &&
      card.thumbnailUrl &&
      (typeof card.durationSeconds === 'number' ? card.durationSeconds > 0 : true)
  );
}

function isDurationAllowed(card: NormalizedCreativeVideoCard): boolean {
  if (typeof card.durationSeconds !== 'number') return true;
  if (card.durationSeconds < 20) return false;
  if (card.durationSeconds > 2_400) return false;
  return true;
}

function educationalRelevance(card: NormalizedCreativeVideoCard): number {
  const text = `${card.title} ${card.description || ''} ${card.learningGoal}`;
  let score = 0.36;
  if (EDUCATIONAL_SIGNAL_REGEX.test(text)) score += 0.34;
  if (card.creativityType === 'reframe' || card.creativityType === 'notice') score += 0.1;
  if (card.topic && text.toLowerCase().includes(card.topic.toLowerCase())) score += 0.1;
  return clamp(score, 0, 1);
}

function languageCompatible(card: NormalizedCreativeVideoCard, request: CreativeDeckRequest): boolean {
  const preferred = normalizeLanguage(request.language);
  if (!preferred) return true;
  const candidate = normalizeLanguage(card.language);
  if (!candidate) return true;
  return candidate === preferred;
}

function trustPasses(card: NormalizedCreativeVideoCard): boolean {
  if (card.trustTier === 'high' || card.trustTier === 'medium') return true;
  const hasCaptions = card.captionsAvailable === true;
  const highClarity = card.clarityScore >= 0.72;
  return hasCaptions && highClarity;
}

function enrichSoftQuality(card: NormalizedCreativeVideoCard): NormalizedCreativeVideoCard {
  const childFriendlyBoost = /\b(kids|children|beginner|simple|easy to understand)\b/i.test(
    `${card.title} ${card.description || ''}`
  )
    ? 0.08
    : 0;
  const captionBoost = card.captionsAvailable ? 0.08 : 0;
  const clarityScore = clamp(card.clarityScore + childFriendlyBoost + captionBoost, 0.25, 0.99);
  const intuitionScore = clamp(card.intuitionScore + (card.creativityType === 'notice' ? 0.06 : 0), 0.2, 0.99);
  const creativityScore = clamp(card.creativityScore + (card.creativityType === 'reframe' ? 0.06 : 0), 0.2, 0.99);

  return {
    ...card,
    clarityScore,
    intuitionScore,
    creativityScore,
  };
}

export function filterCreativeSafetyAndQuality(
  cards: NormalizedCreativeVideoCard[],
  request: CreativeDeckRequest
): CreativeSafetyFilterResult {
  const accepted: NormalizedCreativeVideoCard[] = [];
  const rejected: Array<{ card: NormalizedCreativeVideoCard; reason: string }> = [];

  for (const raw of cards) {
    const card = enrichSoftQuality(raw);
    const searchable = `${card.title} ${card.description || ''}`;
    if (!card.embeddable) {
      rejected.push({ card, reason: 'not_embeddable' });
      continue;
    }
    if (!hasMetadataCompleteness(card)) {
      rejected.push({ card, reason: 'metadata_incomplete' });
      continue;
    }
    if (!isDurationAllowed(card)) {
      rejected.push({ card, reason: 'duration_out_of_band' });
      continue;
    }
    if (BLOCKED_CONTENT_REGEX.test(searchable)) {
      rejected.push({ card, reason: 'student_safety_block' });
      continue;
    }
    if (!languageCompatible(card, request)) {
      rejected.push({ card, reason: 'language_mismatch' });
      continue;
    }
    const relevance = educationalRelevance(card);
    if (relevance < 0.5) {
      rejected.push({ card, reason: 'low_educational_relevance' });
      continue;
    }
    if (!trustPasses(card)) {
      rejected.push({ card, reason: 'trust_threshold' });
      continue;
    }

    accepted.push({
      ...card,
      clarityScore: clamp((card.clarityScore + relevance) / 2, 0.25, 0.99),
    });
  }

  return {
    accepted,
    rejected,
  };
}
