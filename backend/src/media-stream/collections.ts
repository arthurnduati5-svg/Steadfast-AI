// ─── Collection, Group, Deck-Meta & Empty-State Helpers ──────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type {
  MediaAsset,
  MediaCollectionPayload,
  MediaStreamDeckMetaPayload,
  MediaStreamEmptyStatePayload,
  MediaStreamNoticePayload,
  MediaStreamRankingContext,
  GrowthActionIntent,
  GrowthActionPlan,
  GrowthActionDestination,
} from './types.js';
import { safeString, getMediaKindGroup } from './validation.js';
import { parseIsoDate } from './scoring.js';
import { parseNumericSignal, asBool, normalizeTopicLike } from './scoring.js';
import { clampMediaText } from './metadata.js';

export function pushStreamNotice(
  target: MediaStreamNoticePayload[],
  notice: { id: string; tone: MediaStreamNoticePayload['tone']; message?: string | null }
) {
  const message = clampMediaText(safeString(notice.message).trim(), 220);
  if (!message) return;
  if (target.some((entry) => entry.id === notice.id || entry.message === message)) return;
  target.push({
    id: notice.id,
    tone: notice.tone,
    message,
  });
}

export function buildMediaStreamDeckMeta(args: {
  streamMode: 'study' | 'creative';
  seedTopics: string[];
  sourceHealth?: {
    youtubeFetched: boolean;
    vimeoFetched: boolean;
    usedCache: boolean;
  } | null;
}): MediaStreamDeckMetaPayload {
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

export function buildMediaStreamEmptyState(args: {
  streamMode: 'study' | 'creative';
  seedTopics: string[];
  hasAssets: boolean;
}): MediaStreamEmptyStatePayload {
  if (args.streamMode === 'creative') {
    if (args.seedTopics.length === 0) {
      return {
        title: 'Creative Stream is waiting for saved context',
        body: 'Save or generate a few study recaps first, then Creative Stream will turn those topics into trusted external discovery clips.',
        hintChips: [],
        primaryActionLabel: 'Open Study Stream',
        primaryActionMode: 'study_stream',
      };
    }
    return {
      title: 'Creative Stream is regrouping around your topics',
      body: `We filtered discovery clips hard to protect quality. Try another refresh around ${args.seedTopics[0] || 'your current topic'} or continue in Study Stream first.`,
      hintChips: args.seedTopics.slice(0, 3),
      primaryActionLabel: 'Open Study Stream',
      primaryActionMode: 'study_stream',
    };
  }
  if (args.hasAssets) {
    return {
      title: 'Study Stream is reorganizing your revision lane',
      body: 'Your media library has assets, but none matched the current stream filters strongly enough yet.',
      hintChips: args.seedTopics.slice(0, 3),
      primaryActionLabel: 'Open Library',
      primaryActionMode: 'library',
    };
  }
  return {
    title: 'No stream items yet',
    body: 'Save or generate one recap, then Study Stream will build a guided revision lane from it.',
    hintChips: [],
    primaryActionLabel: 'Open Library',
    primaryActionMode: 'library',
  };
}

export function buildCreativeTopicSeeds(args: {
  activeTopic?: string | null;
  topic?: string | null;
  query?: string | null;
  weakTopics?: string[];
  learningNeed?: string | null;
}): string[] {
  const chunks = [
    safeString(args.activeTopic).trim(),
    safeString(args.topic).trim(),
    safeString(args.query).trim(),
    ...(args.weakTopics || []).map((entry) => safeString(entry).trim()),
    safeString(args.learningNeed).trim().replace(/_/g, ' '),
  ].filter(Boolean);
  const deduped = Array.from(new Set(chunks));
  return deduped.slice(0, 4);
}

export function deriveCreativeTopicSeedsFromAssets(assets: MediaAsset[]): string[] {
  const ranked = [...assets]
    .sort((left, right) => {
      const leftScore =
        parseNumericSignal(left.streamRankScore) +
        (left.revisionItemId ? 24 : 0) +
        (left.isHelpful ? 10 : 0) +
        (left.isCompleted ? -8 : 10);
      const rightScore =
        parseNumericSignal(right.streamRankScore) +
        (right.revisionItemId ? 24 : 0) +
        (right.isHelpful ? 10 : 0) +
        (right.isCompleted ? -8 : 10);
      return rightScore - leftScore;
    })
    .slice(0, 10);
  const seeds = ranked.flatMap((asset) => [
    safeString(asset.topic).trim(),
    safeString(asset.subtopic).trim(),
    safeString(asset.revisionRelevance).trim(),
    safeString(asset.weakTopicRelevance).trim(),
    safeString(asset.subject).trim(),
  ]);
  return Array.from(new Set(seeds.filter(Boolean))).slice(0, 4);
}

export function inferCreativeSourceRole(video: { channelTitle?: string | null; title?: string | null; trustTier?: string | null }): string {
  const channel = safeString(video.channelTitle).trim().toLowerCase();
  const title = safeString(video.title).trim().toLowerCase();
  if (channel.includes('khan')) return 'khan_academy';
  if (channel.includes('ted-ed') || channel.includes('ted ed')) return 'ted_ed';
  if (channel.includes('ck-12') || channel.includes('ck12')) return 'ck12';
  if (channel.includes('phet') || title.includes('simulation')) return 'phet';
  return 'youtube_shorts';
}

export function mapLearningNeedToVideoIntent(learningNeed?: string | null): string | null {
  const normalized = safeString(learningNeed).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('worked')) return 'worked_example';
  if (normalized.includes('quick') || normalized.includes('recap')) return 'revision_recap';
  if (normalized.includes('visual') || normalized.includes('intuition')) return 'visual_animation';
  if (normalized.includes('mistake') || normalized.includes('misconception')) return 'misconception_fix';
  if (normalized.includes('beginner') || normalized.includes('simple')) return 'beginner_friendly';
  return 'concept_explainer';
}

export type GrowthRevisionItem = {
  id: string;
  topic?: string | null;
  subtopic?: string | null;
  subject?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

export function buildStudyTopicSeeds(args: {
  activeTopic?: string | null;
  weakTopics?: string[];
  revisionItems?: GrowthRevisionItem[];
}): string[] {
  const revisionItems = args.revisionItems || [];
  const seeds = [
    safeString(args.activeTopic).trim(),
    ...(args.weakTopics || []),
    ...revisionItems.flatMap((item) => [
      safeString(item.topic).trim(),
      safeString(item.subtopic).trim(),
      safeString(item.subject).trim(),
    ]),
  ];
  return Array.from(new Set(seeds.filter(Boolean))).slice(0, 5);
}

export function buildStudyStreamDeckMeta(args: {
  activeTopic?: string | null;
  weakTopics?: string[];
  revisionItems?: GrowthRevisionItem[];
}): MediaStreamDeckMetaPayload {
  return {
    modeIdentity: 'Focused revision lane',
    supportLabel: 'Learning orbit',
    lineupLabel: 'Next in lane',
    replenishes: false,
    refillBatchSize: 0,
    seedTopics: buildStudyTopicSeeds(args),
    sourceHealth: null,
  };
}

export function buildStudyStreamEmptyState(args: {
  seedTopics: string[];
  hasAssets: boolean;
  hasRevisionHistory: boolean;
}): MediaStreamEmptyStatePayload {
  if (args.hasAssets) {
    return {
      title: 'Study Stream is tightening your revision lane',
      body:
        'You have saved recap media, but none fit the current revision path strongly enough yet. Open Library or keep revising to strengthen the lane.',
      hintChips: args.seedTopics.slice(0, 3),
      primaryActionLabel: 'Open Library',
      primaryActionMode: 'library',
    };
  }
  if (args.hasRevisionHistory) {
    return {
      title: 'Study Stream is waiting for recap media',
      body:
        'Your revision history is here, but there are no recap media items ready to anchor a focused lane yet. Save one recap and this lane will sequence it.',
      hintChips: args.seedTopics.slice(0, 3),
      primaryActionLabel: 'Open Library',
      primaryActionMode: 'library',
    };
  }
  return {
    title: 'Study Stream is waiting for your first saved recap',
    body:
      'Save or generate one revision recap first. Study Stream will then turn it into a calm, one-card-at-a-time revision lane.',
    hintChips: [],
    primaryActionLabel: 'Open Library',
    primaryActionMode: 'library',
  };
}

export function collectRevisionItemsFromOverview(overview: any): GrowthRevisionItem[] {
  const pool = [
    ...(overview.recentItems || []),
    ...(overview.ungroupedItems || []),
    ...(overview.pinnedItems || []),
    ...(overview.mistakeItems || []),
    ...(overview.needsPracticeItems || []),
    ...(overview.queuePreview?.dueNow || []),
    ...(overview.queuePreview?.needsAttention || []),
    ...(overview.queuePreview?.continuePractising || []),
    ...(overview.queuePreview?.newItems || []),
    ...(overview.queuePreview?.recentlyImproved || []),
    ...(overview.collections || []).flatMap((collection: any) => collection.previewItems || []),
  ];
  const byId = new Map<string, GrowthRevisionItem>();
  pool.forEach((item: any) => {
    if (!item?.id) return;
    if (!byId.has(item.id)) byId.set(item.id, item);
  });
  return [...byId.values()];
}

export function buildGrowthActionPrompt(intent: GrowthActionIntent, args: { topic?: string | null; title?: string | null }): string | null {
  const topicOrTitle = safeString(args.topic || args.title).trim() || 'my current weak topic';
  if (intent === 'start_guided_session') {
    return `Start a focused revision session on ${topicOrTitle} with one clear next move and one quick check.`;
  }
  if (intent === 'quiz_me') {
    return `Quiz me on ${topicOrTitle} with one question at a time and short feedback.`;
  }
  if (intent === 'simpler_example') {
    return `Give me one simpler worked example for ${topicOrTitle}, then ask me one transfer question.`;
  }
  if (intent === 'similar_question') {
    return `Give me one similar question on ${topicOrTitle} and a quick correction checklist.`;
  }
  if (intent === 'continue_plan') {
    return `Continue my study plan "${topicOrTitle}" with one milestone task and one short checkpoint.`;
  }
  return null;
}

export function resolveGrowthActionPlan(args: {
  intent: GrowthActionIntent;
  payload?: { topic?: string | null; subject?: string | null; title?: string | null; itemId?: string | null };
  targetItem?: GrowthRevisionItem | null;
}): GrowthActionPlan {
  const payload = args.payload || {};
  const topic = safeString(payload.topic).trim() || safeString(args.targetItem?.topic).trim() || null;
  const subject = safeString(payload.subject).trim() || safeString(args.targetItem?.subject).trim() || null;
  const title = safeString(payload.title).trim() || safeString(args.targetItem?.title).trim() || null;
  const revisionItemId = safeString(args.targetItem?.id || payload.itemId).trim() || null;

  if (args.intent === 'open_revision') {
    return { intent: args.intent, destination: 'revision', revisionItemId, topic, subject, title };
  }
  if (args.intent === 'open_study_stream') {
    return { intent: args.intent, destination: 'media', mediaMode: 'study_stream', revisionItemId, topic, subject, title };
  }
  if (args.intent === 'open_creative_stream') {
    return { intent: args.intent, destination: 'media', mediaMode: 'creative_stream', revisionItemId, topic, subject, title };
  }
  if (args.intent === 'review_recap' || args.intent === 'practice_again' || args.intent === 'view_worked_step') {
    return { intent: args.intent, destination: 'revision', revisionItemId, topic, subject, title };
  }

  const prompt = buildGrowthActionPrompt(args.intent, { topic, title });
  return {
    intent: args.intent,
    destination: 'new_session',
    revisionItemId,
    topic,
    subject,
    title,
    prompt,
    composerIntent: `growth_${args.intent}`,
  };
}

export function buildMediaCollections(items: MediaAsset[], limit = 40): MediaCollectionPayload[] {
  const groups = new Map<string, MediaCollectionPayload>();
  for (const asset of items) {
    const collectionIds = Array.isArray(asset.collectionIds) ? asset.collectionIds : [];
    const topic = safeString(asset.topic).trim();
    const subject = safeString(asset.subject).trim();
    const fallbackId = topic ? `topic:${topic.toLowerCase()}` : subject ? `subject:${subject.toLowerCase()}` : 'general';
    const targetIds = collectionIds.length > 0 ? collectionIds : [fallbackId];

    for (const groupIdRaw of targetIds) {
      const groupId = safeString(groupIdRaw).trim() || fallbackId;
      const existing = groups.get(groupId);
      if (!existing) {
        const title =
          topic ? `${topic} media` : subject ? `${subject} media set` : 'General media set';
        groups.set(groupId, {
          id: groupId,
          title: clampMediaText(title, 70),
          subject: subject || null,
          topic: topic || null,
          description: clampMediaText(
            safeString(asset.summary).trim() || `A reusable study collection around ${topic || subject || 'recent learning'}.`,
            180
          ),
          itemCount: 1,
          items: [asset],
          nextAssetId: asset.id,
          progressLabel: asBool(asset.isCompleted, false) ? 'Recently reviewed' : 'Ready to continue',
        });
      } else {
        existing.items.push(asset);
        existing.itemCount = existing.items.length;
        const completeCount = existing.items.filter((entry) => asBool(entry.isCompleted, false)).length;
        existing.progressLabel = `${completeCount}/${existing.items.length} reviewed`;
      }
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: group.items
        .sort((a, b) => {
          const aScore = parseNumericSignal(a.streamRankScore) || parseNumericSignal(a.recommendedScore);
          const bScore = parseNumericSignal(b.streamRankScore) || parseNumericSignal(b.recommendedScore);
          if (bScore !== aScore) return bScore - aScore;
          const aDate = parseIsoDate(a.updatedAt)?.getTime() || 0;
          const bDate = parseIsoDate(b.updatedAt)?.getTime() || 0;
          return bDate - aDate;
        })
        .slice(0, 24),
    }))
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, Math.min(100, Math.max(1, limit)));
}
