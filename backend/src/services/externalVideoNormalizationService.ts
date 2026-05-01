import type { CreativeActionId } from './creativeStreamTypes';
import type {
  CreativeCardRole,
  CreativeDeckRequest,
  ExternalVideoCandidate,
  NormalizedCreativeVideoCard,
} from './creativeStreamTypes';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value: unknown): string {
  return safeString(value).replace(/\s+/g, ' ').trim();
}

function inferMediaFormat(durationSeconds: number | null): 'short_video' | 'long_video' {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) return 'short_video';
  return durationSeconds <= 85 ? 'short_video' : 'long_video';
}

function inferRoleFromText(title: string, description: string): CreativeCardRole {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(transfer|apply|real world|new case|same pattern)\b/.test(text)) return 'transfer';
  if (/\b(reframe|instead|different way|myth|misconception|swap|rethink)\b/.test(text)) return 'reframe';
  if (/\b(notice|pattern|observe|spot)\b/.test(text)) return 'notice';
  if (/\b(deep|full|complete|long lesson|masterclass|detailed)\b/.test(text)) return 'deepen';
  return 'spark';
}

function inferRoleFromNeed(role: CreativeCardRole, learningNeed?: string | null): CreativeCardRole {
  const normalized = normalizeText(learningNeed).toLowerCase();
  if (!normalized) return role;
  if (normalized.includes('worked')) return 'deepen';
  if (normalized.includes('quick') || normalized.includes('recap')) return role === 'deepen' ? 'notice' : role;
  if (normalized.includes('intuition') || normalized.includes('visual')) return role === 'deepen' ? 'reframe' : role;
  return role;
}

function buildLearningGoal(role: CreativeCardRole, topicLabel: string): string {
  if (role === 'notice') return `Notice a reliable pattern inside ${topicLabel}.`;
  if (role === 'reframe') return `Rethink ${topicLabel} using a better mental model.`;
  if (role === 'transfer') return `Apply ${topicLabel} to a new case.`;
  if (role === 'deepen') return `Strengthen conceptual depth for ${topicLabel}.`;
  return `Spark curiosity and intuition for ${topicLabel}.`;
}

function shortSummaryFromDescription(description: string, fallbackTitle: string): string {
  const trimmed = normalizeText(description);
  if (!trimmed) return `A creative learning angle for ${fallbackTitle}.`;
  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0] || trimmed;
  if (firstSentence.length <= 180) return firstSentence;
  return `${firstSentence.slice(0, 177).trimEnd()}...`;
}

function weakTopicMatch(topicLike: string, weakTopics: string[]): boolean {
  const normalizedTopic = topicLike.toLowerCase();
  return weakTopics.some((entry) => {
    const weak = normalizeText(entry).toLowerCase();
    if (!weak) return false;
    return normalizedTopic.includes(weak) || weak.includes(normalizedTopic);
  });
}

function baseActionSet(role: CreativeCardRole): CreativeActionId[] {
  if (role === 'reframe') return ['what_changed', 'save_to_revision', 'more_like_this', 'open_longer_lesson'];
  if (role === 'transfer') return ['try_new_angle', 'quick_check', 'similar_topic', 'save_to_revision'];
  if (role === 'notice') return ['quick_check', 'more_like_this', 'explain_simply', 'save_to_revision'];
  if (role === 'deepen') return ['open_longer_lesson', 'quick_check', 'save_to_revision', 'more_like_this'];
  return ['try_new_angle', 'more_like_this', 'save_to_revision', 'explain_simply'];
}

export function normalizeExternalVideoCandidate(
  candidate: ExternalVideoCandidate,
  request: CreativeDeckRequest
): NormalizedCreativeVideoCard {
  const topic = normalizeText(request.activeTopic || request.topic || request.query) || null;
  const subject = normalizeText(request.subject) || null;
  const subtopic = null;
  const title = normalizeText(candidate.title) || 'Creative learning clip';
  const description = normalizeText(candidate.description);
  const inferredRole = inferRoleFromNeed(inferRoleFromText(title, description), request.learningNeed);
  const weakTopics = (request.weakTopics || []).map((entry) => normalizeText(entry)).filter(Boolean);
  const topicLike = topic || title;
  const weakTopicFit = weakTopicMatch(topicLike, weakTopics);
  const qualityFlags: string[] = [];
  if (candidate.captionsAvailable) qualityFlags.push('captions_available');
  if (candidate.embeddable) qualityFlags.push('embeddable');
  if (candidate.trustTier === 'high') qualityFlags.push('high_trust');
  if (candidate.educationalConfidence >= 0.75) qualityFlags.push('strong_education_match');

  const creativityScore = clamp(
    0.45 +
      (inferredRole === 'reframe' ? 0.24 : inferredRole === 'spark' ? 0.2 : inferredRole === 'transfer' ? 0.16 : 0.12),
    0.25,
    0.98
  );
  const intuitionScore = clamp(
    0.42 +
      (inferredRole === 'notice' || inferredRole === 'reframe' ? 0.22 : inferredRole === 'spark' ? 0.18 : 0.12) +
      (candidate.durationSeconds && candidate.durationSeconds <= 120 ? 0.08 : 0),
    0.24,
    0.96
  );
  const noveltyScore = clamp(
    0.48 +
      (candidate.sourceType === 'vimeo' ? 0.08 : 0) +
      (inferredRole === 'spark' || inferredRole === 'reframe' ? 0.1 : 0),
    0.2,
    0.94
  );

  return {
    id: `${candidate.sourceType}:${candidate.sourceVideoId}`,
    sourceType: candidate.sourceType,
    sourceVideoId: candidate.sourceVideoId,
    embedUrl: candidate.embedUrl,
    canonicalUrl: candidate.canonicalUrl,
    title,
    description: description || null,
    shortSummary: shortSummaryFromDescription(description, title),
    thumbnailUrl: candidate.thumbnailUrl,
    durationSeconds: candidate.durationSeconds,
    mediaFormat: inferMediaFormat(candidate.durationSeconds),
    subject,
    topic,
    subtopic,
    language: candidate.language || normalizeText(request.language) || null,
    captionsAvailable: candidate.captionsAvailable,
    embeddable: candidate.embeddable,
    trustTier: candidate.trustTier,
    creativityType: inferredRole,
    learningGoal: buildLearningGoal(inferredRole, topicLike),
    weakTopicFit,
    clarityScore: clamp(candidate.clarityScore || 0.5, 0.2, 0.99),
    creativityScore,
    intuitionScore,
    noveltyScore,
    transcriptQualityEstimate: clamp(candidate.transcriptQualityEstimate || 0.5, 0.2, 0.98),
    creatorName: candidate.creatorName,
    publishedAt: candidate.publishedAt,
    actionsAvailable: baseActionSet(inferredRole),
    qualityFlags,
    providerPayload: candidate.providerPayload,
  };
}

export function normalizeExternalVideoCandidates(
  candidates: ExternalVideoCandidate[],
  request: CreativeDeckRequest
): NormalizedCreativeVideoCard[] {
  return candidates.map((candidate) => normalizeExternalVideoCandidate(candidate, request));
}
