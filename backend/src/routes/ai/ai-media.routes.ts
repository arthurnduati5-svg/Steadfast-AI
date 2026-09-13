/**
 * AI Route Module — Media
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 7222-7908.
 * Domain: media
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { recapGenerationService } from '../../services/recapGenerationService';
import {
  createMediaAsset,
  linkMediaAssetToRevision,
  listMediaAssets,
  recordMediaAssetInteraction,
  type MediaAsset,
  type MediaAssetKind,
} from '../../services/mediaAssetService';
import {
  addMediaAssetToCollection,
  createMediaCollection,
  listMediaCollections,
  removeMediaAssetFromCollection,
  updateMediaCollection,
} from '../../services/mediaCollectionService';
import { buildCreativeDeck } from '../../services/creativeDeckService';
import { buildCreativeInteractionModel } from '../../services/creativeInteractionService';
import { getRevisionOverview } from '../../services/revisionService';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';
import {
  safeString,
  clampMediaText,
  parseIsoDate,
  getRecencyBoost,
  clamp,
  parseNumericSignal,
  asBool,
  parsePositiveInt,
  normalizeTopicLike,
  getMediaKindGroup,
  getKindPreferenceBoost,
  getMediaSourceTrustBoost,
  type MediaKind,
} from './ai-shared';

const router = Router();

function computeMediaStreamScore(asset: MediaAsset, ctx: Record<string, unknown>): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = normalizeTopicLike(asset.topic);
  const kind = getMediaKindGroup(asset);
  const completed = asBool(asset.isCompleted, false);
  const helpful = asBool(asset.isHelpful, false);
  const streamMode = String(ctx.streamMode || 'study') === 'creative' ? 'creative' : 'study';
  const sourceTrust = safeString(asset.sourceTrust || metadata.sourceTrust).trim().toLowerCase();
  const hasExternalSource = Boolean(safeString(asset.sourceUrl).trim());
  const activeTopic = normalizeTopicLike(ctx.activeTopic as string);
  const weakTopics = (ctx.weakTopics as string[] || []).map((w: string) => normalizeTopicLike(w));
  const preferredRecapType = ctx.preferredRecapType as string | null;
  const allowExternalCreativeSuggestions = ctx.allowExternalCreativeSuggestions as boolean | undefined;

  let score = 20;
  const recommendedScore = parseNumericSignal(asset.streamRankScore) || parseNumericSignal(asset.recommendedScore);
  score += recommendedScore;
  score += getRecencyBoost(asset.updatedAt);
  if (!completed) score += 14;
  if (helpful) score += 10;
  if (activeTopic && (topic.includes(activeTopic) || activeTopic.includes(topic))) score += 34;
  if (weakTopics.some((weak: string) => weak && (topic.includes(weak) || weak.includes(topic)))) score += 36;
  score += getKindPreferenceBoost(kind, preferredRecapType);
  score += getMediaSourceTrustBoost(sourceTrust, streamMode);
  if (streamMode === 'creative') {
    if (hasExternalSource) score += ctx.allowExternalCreativeSuggestions === false ? -8 : 14;
    if (!hasExternalSource) score += 4;
  }
  return Math.round(score);
}

function buildMediaStreamReason(asset: MediaAsset, ctx: Record<string, unknown>): string {
  const topic = safeString(asset.topic).trim() || 'this topic';
  const activeTopic = safeString(ctx.activeTopic as string).trim();
  if (activeTopic && topic.toLowerCase().includes(activeTopic.toLowerCase())) {
    return `Stays on your current focus: ${topic}.`;
  }
  return 'Selected as the clearest useful next revisit.';
}

function buildMediaNextMove(asset: MediaAsset): string {
  const bestUse = safeString(asset.bestUse).trim();
  if (bestUse) return clampMediaText(bestUse, 140);
  const topic = safeString(asset.topic).trim() || safeString(asset.title).trim() || 'this concept';
  if (getMediaKindGroup(asset) === 'video') return `Watch this recap, then run one quick check on ${topic}.`;
  if (getMediaKindGroup(asset) === 'audio') return `Listen once, then explain ${topic} back in your own words.`;
  return `Review this visual, then save one correction to Revision for ${topic}.`;
}

function buildMediaQuickChecks(topic: string): string[] {
  const cleanTopic = safeString(topic).trim() || 'this topic';
  return [
    `In one sentence, what is the main idea in ${cleanTopic}?`,
    `What is one common mistake to avoid in ${cleanTopic}?`,
  ];
}

function buildStudyStreamEmptyState(args: { seedTopics: string[]; hasAssets: boolean; hasRevisionHistory: boolean }) {
  if (args.hasAssets) {
    return { title: 'Study Stream is tightening your revision lane', body: 'You have saved recap media, but none fit the current revision path.', hintChips: args.seedTopics.slice(0, 3), primaryActionLabel: 'Open Library', primaryActionMode: 'library' };
  }
  return { title: 'Study Stream is waiting for your first saved recap', body: 'Save or generate one revision recap first.', hintChips: [], primaryActionLabel: 'Open Library', primaryActionMode: 'library' };
}

function buildMediaStreamDeckMeta(args: { streamMode: 'study' | 'creative'; seedTopics: string[]; sourceHealth?: any }) {
  return {
    modeIdentity: args.streamMode === 'creative' ? 'External discovery engine' : 'Guided revision continuity',
    supportLabel: args.streamMode === 'creative' ? 'Creative orbit' : 'Learning orbit',
    lineupLabel: args.streamMode === 'creative' ? 'Idea path' : 'Orbit lineup',
    replenishes: args.streamMode === 'creative',
    refillBatchSize: args.streamMode === 'creative' ? 3 : 0,
    seedTopics: args.seedTopics.slice(0, 4),
    sourceHealth: args.sourceHealth || null,
  };
}

function isCreativeExternalVideoAsset(asset: MediaAsset): boolean {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const provider = safeString(asset.videoProvider || metadata.externalProvider || metadata.externalSourceType).trim().toLowerCase();
  const sourceUrl = safeString(asset.sourceUrl).trim().toLowerCase();
  if (!sourceUrl && !provider) return false;
  if (provider.includes('youtube') || provider.includes('vimeo')) return true;
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be') || sourceUrl.includes('vimeo.com')) return true;
  return false;
}

function buildMediaStream(items: MediaAsset[], ctx: Record<string, unknown>, limit = 40) {
  const scopedItems = (ctx.streamMode || 'study') === 'creative' ? items.filter((asset) => isCreativeExternalVideoAsset(asset)) : items;
  const ranked = scopedItems
    .map((asset) => {
      const checks = Array.isArray(asset.quickChecks) ? asset.quickChecks : [];
      const reason = buildMediaStreamReason(asset, ctx);
      return {
        asset,
        rankScore: computeMediaStreamScore(asset, ctx),
        reason,
        nextMove: buildMediaNextMove(asset),
        quickCheck: checks[0] || buildMediaQuickChecks(asset.topic || asset.title)[0],
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
  return ranked.slice(0, Math.min(100, limit));
}

// ── POST /media/video-recap ──
router.post('/media/video-recap', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { transcript, summary, topic, subject, sessionId, sourceMessageId } = req.body || {};
    const asset = await createMediaAsset({
      userId: req.user!.id,
      assetKind: 'video_recap',
      title: clampMediaText(safeString(topic) + ' video recap', 110) || 'Video recap',
      summary: clampMediaText(safeString(summary || transcript), 800) || null,
      subject: safeString(subject).trim() || null,
      topic: safeString(topic).trim() || null,
      sessionId: safeString(sessionId).trim() || null,
      sourceChatSessionId: safeString(sessionId).trim() || null,
      sourceChatMessageId: safeString(sourceMessageId).trim() || null,
      tags: ['video_recap'],
      recapText: clampMediaText(safeString(summary || transcript), 800) || null,
      sourceTrust: 'internal',
    });
    res.status(200).send(asset);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/video-recap] Failed');
    res.status(500).send({ message: 'Failed to create video recap' });
  }
});

// ── POST /media/audio-recap ──
router.post('/media/audio-recap', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { text, topic, subject, sessionId, sourceMessageId } = req.body || {};
    const result = await recapGenerationService.generateAudioRecapAsset({
      recapText: safeString(text),
      topic: safeString(topic).trim() || undefined,
      subject: safeString(subject).trim() || undefined,
      userId: req.user!.id,
      sessionId: safeString(sessionId).trim() || undefined,
      sourceChatMessageId: safeString(sourceMessageId).trim() || undefined,
    });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/audio-recap] Failed');
    res.status(500).send({ message: 'Failed to generate audio recap' });
  }
});

// ── POST /media/generate-image ──
router.post('/media/generate-image', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { prompt, title, subject, topic, sessionId, sourceMessageId } = req.body || {};
    if (!prompt) return res.status(400).send({ message: 'Prompt required' });

    const imageUrl = `https://oaidalleapiprodscus.blob.core.windows.net/private/placeholder`;
    const asset = await createMediaAsset({
      userId: req.user!.id,
      assetKind: 'generated_image',
      title: clampMediaText(safeString(title).trim() || safeString(prompt).trim().slice(0, 60), 110),
      summary: clampMediaText(safeString(prompt), 800),
      subject: safeString(subject).trim() || null,
      topic: safeString(topic).trim() || null,
      sessionId: safeString(sessionId).trim() || null,
      sourceChatSessionId: safeString(sessionId).trim() || null,
      sourceChatMessageId: safeString(sourceMessageId).trim() || null,
      tags: ['generated_image'],
      sourceTrust: 'internal',
    });
    res.status(200).send({ asset, imageUrl });
  } catch (error) {
    logger.error({ err: error }, '[POST /media/generate-image] Failed');
    res.status(500).send({ message: 'Failed to generate image' });
  }
});

// ── GET /media/assets ──
router.get('/media/assets', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { kind, subject, topic } = req.query as any;
    const assets = await listMediaAssets({
      userId: req.user!.id,
      assetKind: (safeString(kind) || undefined) as MediaAssetKind | 'all' | undefined,
      subject: safeString(subject) || undefined,
      topic: safeString(topic) || undefined,
    });
    res.status(200).send(assets);
  } catch (error) {
    logger.error({ err: error }, '[GET /media/assets] Failed');
    res.status(500).send({ message: 'Failed to load media assets' });
  }
});

// ── GET /media/stream ──
router.get('/media/stream', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { mode = 'study', limit, kind, topic, subject, weakTopics, sessionId, revisionItemId } = req.query as any;
    const streamMode = mode === 'creative' ? 'creative' : 'study';
    const limitNum = parsePositiveInt(limit, 40, 1, 120);

    const [assets, overview] = await Promise.all([
      listMediaAssets({
        userId: studentId,
        assetKind: (safeString(kind) || undefined) as MediaAssetKind | 'all' | undefined,
        subject: safeString(subject) || undefined,
        topic: safeString(topic) || undefined,
      }),
      getRevisionOverview(studentId),
    ]);

    const ctx: Record<string, unknown> = {
      streamMode,
      activeTopic: safeString(topic) || undefined,
      weakTopics: weakTopics ? String(weakTopics).split(',').filter(Boolean) : [],
      preferredRecapType: kind || undefined,
    };

    const items = buildMediaStream(assets, ctx, limitNum);
    const seedTopics = Array.from(new Set(items.map((i) => i.asset.topic || '').filter(Boolean))).slice(0, 4);
    const deckMeta = buildMediaStreamDeckMeta({ streamMode, seedTopics });
    const emptyState = items.length === 0 ? buildStudyStreamEmptyState({ seedTopics, hasAssets: assets.length > 0, hasRevisionHistory: true }) : null;

    res.status(200).send({ items, deckMeta, emptyState });
  } catch (error) {
    logger.error({ err: error }, '[GET /media/stream] Failed');
    res.status(500).send({ message: 'Failed to load stream' });
  }
});

// ── GET /media/collections ──
router.get('/media/collections', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { subject, topic, includeItems } = req.query as any;
    const collections = await listMediaCollections({
      userId: req.user!.id,
      subject: safeString(subject) || undefined,
      topic: safeString(topic) || undefined,
      includeItems: asBool(includeItems, true),
    });
    res.status(200).send(collections);
  } catch (error) {
    logger.error({ err: error }, '[GET /media/collections] Failed');
    res.status(500).send({ message: 'Failed to load collections' });
  }
});

// ── POST /media/collections ──
router.post('/media/collections', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await createMediaCollection({ ...req.body, userId: req.user!.id });
    res.status(200).send(collection);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/collections] Failed');
    res.status(500).send({ message: 'Failed to create collection' });
  }
});

// ── PATCH /media/collections/:id ──
router.patch('/media/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const collection = await updateMediaCollection({ userId: req.user!.id, collectionId: req.params.id, patch: req.body });
    res.status(200).send(collection);
  } catch (error) {
    logger.error({ err: error }, '[PATCH /media/collections/:id] Failed');
    res.status(500).send({ message: 'Failed to update collection' });
  }
});

// ── POST /media/collections/:id/assets/:assetId ──
router.post('/media/collections/:id/assets/:assetId', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await addMediaAssetToCollection({ userId: req.user!.id, collectionId: req.params.id, assetId: req.params.assetId });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/collections/:id/assets/:assetId] Failed');
    res.status(500).send({ message: 'Failed to add asset' });
  }
});

// ── DELETE /media/collections/:id/assets/:assetId ──
router.delete('/media/collections/:id/assets/:assetId', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await removeMediaAssetFromCollection({ userId: req.user!.id, collectionId: req.params.id, assetId: req.params.assetId });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[DELETE /media/collections/:id/assets/:assetId] Failed');
    res.status(500).send({ message: 'Failed to remove asset' });
  }
});

// ── POST /media/assets/:id/link-revision ──
router.post('/media/assets/:id/link-revision', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await linkMediaAssetToRevision({ userId: req.user!.id, assetId: req.params.id, revisionItemId: req.body?.revisionItemId });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/assets/:id/link-revision] Failed');
    res.status(500).send({ message: 'Failed to link asset' });
  }
});

// ── POST /media/assets/:id/interaction ──
router.post('/media/assets/:id/interaction', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await recordMediaAssetInteraction({
      userId: req.user!.id,
      assetId: req.params.id,
      action: safeString(req.body?.action) as any,
    });
    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /media/assets/:id/interaction] Failed');
    res.status(500).send({ message: 'Failed to record interaction' });
  }
});

export default router;
