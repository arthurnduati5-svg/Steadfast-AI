// ─── Scoring & Ranking Helpers ─────────────────────────────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type { MediaAsset, MediaStreamRankingContext } from './types.js';
import { safeString } from './validation.js';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function parseNumericSignal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

export function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeTopicLike(value?: string | null): string {
  return safeString(value).trim().toLowerCase();
}

export function getRecencyBoost(updatedAt?: string | null): number {
  const date = parseIsoDate(updatedAt);
  if (!date) return 0;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return Math.max(0, Math.round(22 * Math.exp(-days / 18)));
}

export function getMediaSourceTrustBoost(sourceTrust: string, streamMode: 'study' | 'creative'): number {
  const normalized = sourceTrust.toLowerCase();
  if (normalized.includes('internal')) return streamMode === 'study' ? 16 : 10;
  if (normalized.includes('verified') || normalized.includes('high')) return 14;
  if (normalized.includes('trusted') || normalized.includes('medium')) return 10;
  if (normalized.includes('low')) return 2;
  return 6;
}

export function getKindPreferenceBoost(
  kind: ReturnType<typeof import('./validation.js').getMediaKindGroup>,
  preferredRecapType?: string | null
): number {
  const preferred = safeString(preferredRecapType).trim().toLowerCase();
  if (!preferred || preferred === 'mixed') return 0;
  if (preferred === 'audio') return kind === 'audio' ? 14 : -2;
  if (preferred === 'video') return kind === 'video' ? 14 : -2;
  if (preferred === 'visual') return kind === 'image' || kind === 'explainer' ? 14 : -2;
  return 0;
}

export function computeMediaStreamScore(asset: MediaAsset, ctx: MediaStreamRankingContext): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = normalizeTopicLike(asset.topic);
  const subject = normalizeTopicLike(asset.subject);
  const activeTopic = normalizeTopicLike(ctx.activeTopic);
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const { getMediaKindGroup } = require('./metadata.js');
  const kind = getMediaKindGroup(asset);
  const duration = Number(asset.durationSec || parseNumericSignal(metadata.durationSec) || 0);
  const completed = asBool(asset.isCompleted, asBool(metadata.isCompleted, false));
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const streamMode = ctx.streamMode === 'creative' ? 'creative' : 'study';
  const sourceTrust = safeString(asset.sourceTrust || metadata.sourceTrust).trim().toLowerCase();
  const transcriptAvailable = Boolean(safeString(asset.transcript).trim() || safeString(asset.transcriptSnippet).trim());
  const hasExternalSource = Boolean(safeString(asset.sourceUrl).trim());
  const schoolLevel = normalizeTopicLike(asset.schoolLevel || safeString(metadata.schoolLevel).trim());
  const preferredSchoolLevel = normalizeTopicLike(ctx.schoolLevel);
  const assetLanguage = normalizeTopicLike(asset.language || safeString(metadata.language).trim());
  const preferredLanguage = normalizeTopicLike(ctx.language);
  const learningNeed = normalizeTopicLike(ctx.learningNeed || ctx.shortFormSupport);
  const creativeClarityScore = parseNumericSignal(metadata.clarityScore);
  const creativeCreativityScore = parseNumericSignal(metadata.creativityScore);
  const creativeIntuitionScore = parseNumericSignal(metadata.intuitionScore);
  const creativeNoveltyScore = parseNumericSignal(metadata.noveltyScore);
  const creativeCompositeScore = parseNumericSignal(metadata.streamRankScore) / 190;
  const externalProvider = normalizeTopicLike(
    asset.videoProvider ||
      safeString(metadata.externalProvider).trim() ||
      safeString(metadata.externalSourceType).trim()
  );
  const supportHints = normalizeTopicLike(
    [
      safeString(asset.bestUse).trim(),
      safeString(asset.nextMove).trim(),
      safeString(asset.summary).trim(),
      safeString(metadata.learningNeed).trim(),
      safeString(metadata.shortFormSupport).trim(),
      ...(Array.isArray(asset.tags) ? asset.tags : []),
    ].join(' ')
  );
  const recommendedScore =
    parseNumericSignal(asset.streamRankScore) ||
    parseNumericSignal(asset.recommendedScore) ||
    parseNumericSignal(metadata.streamRankScore) ||
    parseNumericSignal(metadata.recommendedScore);

  let score = 20;
  score += recommendedScore;
  score += getRecencyBoost(asset.updatedAt);
  if (!completed) score += 14;
  if (helpful) score += 10;
  if (activeTopic && (topic.includes(activeTopic) || activeTopic.includes(topic))) score += 34;
  if (weakTopics.some((weak) => weak && (topic.includes(weak) || weak.includes(topic) || subject.includes(weak)))) score += 36;
  if (ctx.preferredKind && ctx.preferredKind === kind) score += 12;
  score += getKindPreferenceBoost(kind, ctx.preferredRecapType);
  score += getMediaSourceTrustBoost(sourceTrust, streamMode);
  if (transcriptAvailable) score += 6;
  if (preferredSchoolLevel && schoolLevel && (schoolLevel.includes(preferredSchoolLevel) || preferredSchoolLevel.includes(schoolLevel))) {
    score += 8;
  }
  if (preferredLanguage && assetLanguage && preferredLanguage === assetLanguage) score += 8;
  if (learningNeed && supportHints.includes(learningNeed.replace(/_/g, ' '))) score += 10;
  if (ctx.examMode && safeString(asset.examRelevance || metadata.examRelevance).trim()) score += 24;
  if (ctx.focusMode && duration > 0 && duration <= 180) score += 12;
  if (kind === 'video' || kind === 'audio') score += 8;
  if (kind === 'collection') score += 6;
  if (streamMode === 'study') {
    if (asset.revisionItemId) score += 12;
    if (kind === 'video' || kind === 'audio' || kind === 'explainer') score += 4;
  } else {
    const { isCreativeExternalVideoAsset } = require('./validation.js');
    if (!isCreativeExternalVideoAsset(asset)) score -= 90;
    if (kind === 'video' || kind === 'explainer' || kind === 'image') score += 10;
    if (hasExternalSource) score += ctx.allowExternalCreativeSuggestions === false ? -8 : 14;
    if (!hasExternalSource) score += 4;
    if (externalProvider.includes('youtube')) score += 10;
    if (externalProvider.includes('vimeo')) score += 8;
    score += Math.round(clamp(creativeClarityScore, 0, 1) * 16);
    score += Math.round(clamp(creativeCreativityScore, 0, 1) * 16);
    score += Math.round(clamp(creativeIntuitionScore, 0, 1) * 14);
    score += Math.round(clamp(creativeNoveltyScore, 0, 1) * 10);
    score += Math.round(clamp(creativeCompositeScore, 0, 1) * 18);
  }
  return Math.round(score);
}

export function getStudySpacingBoost(asset: MediaAsset): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const lastTouch =
    safeString(asset.lastReviewedAt).trim() ||
    safeString(asset.lastPlayedAt).trim() ||
    safeString(asset.lastOpenedAt).trim() ||
    safeString(asset.updatedAt).trim() ||
    safeString(metadata.lastTouchedAt).trim();
  const date = parseIsoDate(lastTouch);
  if (!date) return 0;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  if (days >= 1.5 && days <= 8) return 12;
  if (days > 8 && days <= 21) return 8;
  if (days < 0.35) return -8;
  return 0;
}

export function computeStudyStreamScore(asset: MediaAsset, ctx: MediaStreamRankingContext): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = normalizeTopicLike(asset.topic);
  const subject = normalizeTopicLike(asset.subject);
  const activeTopic = normalizeTopicLike(ctx.activeTopic);
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const dueNowIds = new Set((ctx.dueNowRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const needsAttentionIds = new Set((ctx.needsAttentionRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const continueIds = new Set((ctx.continueRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const recentIds = new Set((ctx.recentRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const revisionItemId = safeString(asset.revisionItemId).trim();
  const { getMediaKindGroup } = require('./metadata.js');
  const kind = getMediaKindGroup(asset);
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const completed = asBool(asset.isCompleted, asBool(metadata.isCompleted, false));
  const interactionCount =
    parseNumericSignal(asset.interactionCount) || parseNumericSignal(metadata.interactionCount);
  const completionCount =
    parseNumericSignal(asset.completionCount) || parseNumericSignal(metadata.completionCount);
  const hasInternalTrust =
    normalizeTopicLike(asset.sourceTrust || safeString(metadata.sourceTrust).trim()).includes('internal');
  const activeRevisionItemId = safeString(ctx.activeRevisionItemId).trim();
  const duration = Number(asset.durationSec || parseNumericSignal(metadata.durationSec) || 0);
  const seedTopics = (ctx.revisionSeedTopics || []).map((entry) => normalizeTopicLike(entry));
  const seedMatch = seedTopics.some((seed) => seed && (topic.includes(seed) || seed.includes(topic) || subject.includes(seed)));

  let score = computeMediaStreamScore(asset, { ...ctx, streamMode: 'study' });
  if (revisionItemId) score += 18;
  if (revisionItemId && activeRevisionItemId && revisionItemId === activeRevisionItemId) score += 56;
  if (revisionItemId && dueNowIds.has(revisionItemId)) score += 34;
  if (revisionItemId && needsAttentionIds.has(revisionItemId)) score += 30;
  if (revisionItemId && continueIds.has(revisionItemId)) score += 18;
  if (revisionItemId && recentIds.has(revisionItemId)) score += 10;
  if (seedMatch) score += 10;
  if (helpful) score += 8;
  if (!completed) score += 8;
  if (completed && !helpful && !revisionItemId) score -= 8;
  if (interactionCount > 0) score += Math.min(8, Math.round(interactionCount / 2));
  if (completionCount > 0) score += Math.min(6, completionCount * 2);
  if (hasInternalTrust) score += 6;
  if (kind === 'video' || kind === 'audio') score += 6;
  if (kind === 'image' || kind === 'explainer') score += 3;
  if (kind === 'document') score -= 3;
  if (duration > 0 && duration <= 420) score += 4;
  score += getStudySpacingBoost(asset);

  const weakMatch = weakTopics.some((weak) => weak && (topic.includes(weak) || weak.includes(topic) || subject.includes(weak)));
  const activeMatch = activeTopic && topic && (topic.includes(activeTopic) || activeTopic.includes(topic));
  if (!revisionItemId && !weakMatch && !activeMatch && !seedMatch && !helpful) {
    score -= 18;
  }

  return Math.round(score);
}
