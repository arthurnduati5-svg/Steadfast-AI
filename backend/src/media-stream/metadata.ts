// ─── Text Formatting, Extraction & Analysis Helpers ───────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type { MediaAsset, MediaStreamRankingContext, MediaStreamPayload } from './types.js';
import { safeString, getMediaKindGroup } from './validation.js';
import { parseIsoDate } from './scoring.js';
import { computeMediaStreamScore, computeStudyStreamScore, normalizeTopicLike, asBool, parseNumericSignal, clamp } from './scoring.js';

export const clampMediaText = (value: string, maxChars = 1200) => {
  const normalized = safeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
};

export const limitText = (value: string, maxChars = 1400) => {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
};

export const createLatencyTurnId = () => `backend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function extractMediaKeyPoints(sourceText: string, topicHint?: string): string[] {
  const normalized = safeString(sourceText).replace(/\r/g, '\n').trim();
  if (!normalized) {
    const topic = safeString(topicHint).trim() || 'this concept';
    return [
      `Start with the core idea behind ${topic}.`,
      `Notice the worked step before trying your own example.`,
      `Review one mistake to avoid when applying ${topic}.`,
    ];
  }
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!sentences.length) return [];
  return sentences.slice(0, 4).map((sentence) => clampMediaText(sentence, 160));
}

export function buildMediaQuickChecks(topic: string): string[] {
  const cleanTopic = safeString(topic).trim() || 'this topic';
  return [
    `In one sentence, what is the main idea in ${cleanTopic}?`,
    `What is one common mistake to avoid in ${cleanTopic}?`,
  ];
}

export function buildMediaStreamReason(asset: MediaAsset, ctx: MediaStreamRankingContext): string {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = safeString(asset.topic).trim();
  const activeTopic = safeString(ctx.activeTopic).trim();
  const streamMode = ctx.streamMode === 'creative' ? 'creative' : 'study';
  const sourceTrust = safeString(asset.sourceTrust || metadata.sourceTrust).trim().toLowerCase();
  const creativeRole = safeString(metadata.externalRole || metadata.creativityType).trim().toLowerCase();
  const learningGoal = safeString(metadata.learningGoal).trim();
  const preferredRecapType = safeString(ctx.preferredRecapType).trim().toLowerCase();
  if (streamMode === 'study') {
    return buildStudyStreamReason(asset, ctx);
  }
  if (activeTopic && topic && topic.toLowerCase().includes(activeTopic.toLowerCase())) {
    return `Matches your current focus on ${topic}.`;
  }
  const weakTopics = ctx.weakTopics.map((entry) => entry.toLowerCase());
  if (topic && weakTopics.some((weak) => weak && topic.toLowerCase().includes(weak))) {
    return `Supports weak-topic recovery for ${topic}.`;
  }
  if (streamMode === 'creative' && safeString(asset.sourceUrl).trim()) {
    if (learningGoal) return clampMediaText(learningGoal, 160);
    if (creativeRole.includes('reframe')) return 'Reframe-focused discovery card selected for conceptual shift.';
    if (creativeRole.includes('transfer')) return 'Transfer-focused discovery card selected for applying the idea in a new case.';
    if (creativeRole.includes('notice')) return 'Pattern-notice discovery card selected to sharpen observation.';
    if (sourceTrust.includes('verified') || sourceTrust.includes('high') || sourceTrust.includes('trusted')) {
      return 'Trusted short-form explainer for visual intuition.';
    }
    return 'Creative discovery item selected to unblock understanding.';
  }
  if (preferredRecapType === 'audio' && getMediaKindGroup(asset) === 'audio') {
    return 'Matched to your audio recap preference.';
  }
  if (preferredRecapType === 'video' && getMediaKindGroup(asset) === 'video') {
    return 'Matched to your video recap preference.';
  }
  if (preferredRecapType === 'visual' && (getMediaKindGroup(asset) === 'image' || getMediaKindGroup(asset) === 'explainer')) {
    return 'Matched to your visual recap preference.';
  }
  if (ctx.examMode && safeString(asset.examRelevance || metadata.examRelevance).trim()) {
    return 'Prioritized for exam-ready revision.';
  }
  if (ctx.focusMode) {
    return 'Short, focused recap for low-noise progress.';
  }
  return 'Useful next recap based on recent learning activity.';
}

export function buildStudyStreamReason(asset: MediaAsset, ctx: MediaStreamRankingContext): string {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = safeString(asset.topic).trim() || safeString(asset.title).trim() || 'this topic';
  const revisionItemId = safeString(asset.revisionItemId).trim();
  const activeRevisionItemId = safeString(ctx.activeRevisionItemId).trim();
  const dueNowIds = new Set((ctx.dueNowRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const needsAttentionIds = new Set((ctx.needsAttentionRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const continueIds = new Set((ctx.continueRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const normalizedTopic = normalizeTopicLike(topic);
  const activeTopic = normalizeTopicLike(ctx.activeTopic);
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const preferredRecapType = safeString(ctx.preferredRecapType).trim().toLowerCase();
  const kind = getMediaKindGroup(asset);

  if (revisionItemId && activeRevisionItemId && revisionItemId === activeRevisionItemId) {
    return 'Continues the exact revision item you were already working on.';
  }
  if (revisionItemId && dueNowIds.has(revisionItemId)) {
    return `Due for revisit now, so this recap brings ${topic} back in the right moment.`;
  }
  if (revisionItemId && needsAttentionIds.has(revisionItemId)) {
    return `Returns now because ${topic} recently showed a weak or mistaken step.`;
  }
  if (revisionItemId && continueIds.has(revisionItemId)) {
    return `Keeps continuity on ${topic} without making you restart from scratch.`;
  }
  if (activeTopic && normalizedTopic && (normalizedTopic.includes(activeTopic) || activeTopic.includes(normalizedTopic))) {
    return `Stays on your current revision focus: ${topic}.`;
  }
  if (weakTopics.some((weak) => weak && (normalizedTopic.includes(weak) || weak.includes(normalizedTopic)))) {
    return `Selected to rescue a weak pattern inside ${topic}.`;
  }
  if (helpful) {
    return `You found this useful before, so it is resurfacing as a high-value recap.`;
  }
  if (preferredRecapType === 'audio' && kind === 'audio') {
    return 'Matched to your audio revision preference for a calm revisit.';
  }
  if (preferredRecapType === 'video' && kind === 'video') {
    return 'Matched to your video revision preference for a worked recap.';
  }
  if (preferredRecapType === 'visual' && (kind === 'image' || kind === 'explainer')) {
    return 'Matched to your visual revision preference for quicker recognition.';
  }
  return 'Chosen from your saved recap history as the clearest useful next revisit.';
}

export function buildMediaNextMove(asset: MediaAsset): string {
  const bestUse = safeString(asset.bestUse).trim();
  if (bestUse) return clampMediaText(bestUse, 140);
  const topic = safeString(asset.topic).trim() || safeString(asset.title).trim() || 'this concept';
  if (getMediaKindGroup(asset) === 'video') {
    return `Watch this recap, then run one quick check on ${topic}.`;
  }
  if (getMediaKindGroup(asset) === 'audio') {
    return `Listen once, then explain ${topic} back in your own words.`;
  }
  return `Review this visual, then save one correction to Revision for ${topic}.`;
}

export function buildStudyGuide(asset: MediaAsset, ctx: MediaStreamRankingContext, reason: string) {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = safeString(asset.topic).trim() || safeString(asset.title).trim() || 'this topic';
  const cue =
    clampMediaText(
      safeString(asset.keyIdea).trim() ||
        (Array.isArray(asset.keyPoints) ? safeString(asset.keyPoints[0]).trim() : '') ||
        safeString(asset.bestUse).trim() ||
        safeString(asset.summary).trim(),
      150
    ) || `Look for the one move that makes ${topic} easier to remember.`;
  const nextStep =
    clampMediaText(safeString(asset.nextMove).trim(), 150) ||
    (getMediaKindGroup(asset) === 'audio'
      ? `Listen once, then say the main idea of ${topic} without notes.`
      : `Review the recap, then answer one quick check on ${topic}.`);
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const normalizedTopic = normalizeTopicLike(topic);
  const revisionItemId = safeString(asset.revisionItemId).trim();
  const dueNowIds = new Set((ctx.dueNowRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const needsAttentionIds = new Set((ctx.needsAttentionRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const continueIds = new Set((ctx.continueRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const lineupReason =
    revisionItemId && dueNowIds.has(revisionItemId)
      ? 'due revisit'
      : revisionItemId && needsAttentionIds.has(revisionItemId)
        ? 'weak-step rescue'
        : revisionItemId && continueIds.has(revisionItemId)
          ? 'continue this topic'
          : weakTopics.some((weak) => weak && (normalizedTopic.includes(weak) || weak.includes(normalizedTopic)))
            ? 'reinforce weak pattern'
            : helpful
              ? 'repeat helpful recap'
              : 'continue revision lane';

  return {
    whyNow: clampMediaText(reason, 170) || 'Selected as the clearest next revisit from your saved recap history.',
    cue,
    nextStep,
    lineupReason,
  };
}

export function buildMediaStream(items: MediaAsset[], ctx: MediaStreamRankingContext, limit = 40): MediaStreamPayload[] {
  const { isCreativeExternalVideoAsset } = require('./validation.js');
  const scopedItems =
    (ctx.streamMode || 'study') === 'creative'
      ? items.filter((asset) => isCreativeExternalVideoAsset(asset))
      : items;
  const ranked = scopedItems
    .map((asset) => {
      const checks = Array.isArray(asset.quickChecks) ? asset.quickChecks : [];
      const streamMode = ctx.streamMode === 'creative' ? 'creative' : 'study';
      const reason = buildMediaStreamReason(asset, ctx);
      return {
        asset,
        rankScore: streamMode === 'study' ? computeStudyStreamScore(asset, ctx) : computeMediaStreamScore(asset, ctx),
        reason,
        nextMove: buildMediaNextMove(asset),
        quickCheck: checks[0] || buildMediaQuickChecks(asset.topic || asset.title)[0] || 'What is the one idea to remember here?',
        studyGuide: streamMode === 'study' ? buildStudyGuide(asset, ctx, reason) : null,
      } satisfies MediaStreamPayload;
    })
    .sort((a, b) => b.rankScore - a.rankScore || (parseIsoDate(b.asset.updatedAt)?.getTime() || 0) - (parseIsoDate(a.asset.updatedAt)?.getTime() || 0));

  if ((ctx.streamMode || 'study') === 'creative') {
    const target = Math.min(18, Math.max(8, limit));
    return ranked.slice(0, target);
  }

  const deduped: MediaStreamPayload[] = [];
  const seenKeys = new Set<string>();
  const dominantTopic = normalizeTopicLike(ranked[0]?.asset.topic || ctx.activeTopic);
  const sequenced = ranked
    .map((item, index) => {
      const topicKey = normalizeTopicLike(item.asset.topic || item.asset.title);
      const subjectKey = normalizeTopicLike(item.asset.subject);
      const sameDominantTopic =
        dominantTopic && topicKey && (topicKey.includes(dominantTopic) || dominantTopic.includes(topicKey));
      const sameSubject =
        dominantTopic && !sameDominantTopic && normalizeTopicLike(ctx.activeTopic || '').length === 0
          ? false
          : subjectKey && normalizeTopicLike(ranked[0]?.asset.subject).includes(subjectKey);
      const sequenceScore = item.rankScore + (sameDominantTopic ? 10 : 0) + (sameSubject ? 4 : 0) - index * 0.35;
      return {
        ...item,
        rankScore: Math.round(sequenceScore),
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);

  for (const item of sequenced) {
    const topicKey = normalizeTopicLike(item.asset.topic || item.asset.title);
    const dedupeKey =
      safeString(item.asset.revisionItemId).trim() ||
      `${topicKey || normalizeTopicLike(item.asset.subject || item.asset.title)}:${getMediaKindGroup(item.asset)}`;
    if (dedupeKey && seenKeys.has(dedupeKey)) continue;
    if (dedupeKey) seenKeys.add(dedupeKey);
    deduped.push(item);
    if (deduped.length >= Math.min(100, Math.max(1, limit))) break;
  }

  return deduped;
}

export function extractQuestionLikeLines(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => /^\d+[\)\.\:\-]\s+/.test(line) || /[?]$/.test(line))
    .slice(0, 6);
}

export function extractTopicHints(text: string): string[] {
  const cleaned = safeString(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];
  const stopWords = new Set([
    'about', 'after', 'again', 'also', 'because', 'below', 'between', 'clear', 'clearly',
    'document', 'equation', 'explain', 'from', 'have', 'image', 'into', 'lesson', 'make',
    'notes', 'page', 'pdf', 'photo', 'please', 'question', 'questions', 'school', 'solve',
    'student', 'study', 'summary', 'teacher', 'text', 'that', 'this', 'those', 'these',
    'video', 'watch', 'with', 'worksheet'
  ]);
  const counts = new Map<string, number>();
  for (const token of cleaned.split(' ')) {
    if (token.length < 4 || stopWords.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([token]) => token);
}

export function extractHeadingLikeLines(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) =>
      /^#{1,6}\s+/.test(line) ||
      /^[A-Z0-9][A-Z0-9\s:,-]{5,}$/.test(line) ||
      /^(section|topic|chapter|lesson|surah|ayah|question|part)\s*[\:\-]/i.test(line)
    )
    .map((line) => line.replace(/^#{1,6}\s+/, ''))
    .slice(0, 6);
}

export function extractActionableTasks(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) =>
      /^\d+[\)\.\:\-]\s+/.test(line) ||
      /^(solve|find|calculate|explain|define|compare|describe|list|write|state|prove|show|simplify|factor|differentiate|integrate|translate|summarize|summarise|analyse|analyze)\b/i.test(line)
    )
    .slice(0, 8);
}

export function inferSubjectFromTopic(topic: string): string {
  const lower = safeString(topic).toLowerCase();
  if (!lower) return 'General';
  if (/\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/.test(lower)) return 'Islamic Studies';
  if (/\b(algebra|equation|fraction|ratio|geometry|trigonometry|simultaneous|calculus|math|mathematics|percentage|probability)\b/.test(lower)) return 'Mathematics';
  if (/\b(chemistry|atom|molecule|acid|base|reaction|periodic)\b/.test(lower)) return 'Chemistry';
  if (/\b(physics|force|motion|electric|velocity|acceleration|energy)\b/.test(lower)) return 'Physics';
  if (/\b(biology|cell|photosynthesis|genetics|ecosystem|respiration)\b/.test(lower)) return 'Biology';
  if (/\b(english|grammar|comprehension|essay|poem|literature)\b/.test(lower)) return 'English';
  if (/\b(history|government|geography|map|climate|population)\b/.test(lower)) return 'Humanities';
  return 'General';
}

export function inferArtifactType(args: {
  kind: 'image' | 'pdf' | 'text';
  fileName?: string;
  extractedText?: string;
  summary?: string;
}): string {
  const file = safeString(args.fileName).toLowerCase();
  const text = `${safeString(args.extractedText)} ${safeString(args.summary)}`.toLowerCase();
  if (args.kind === 'image' && /\b(graph|diagram|chart|table)\b/.test(text)) return 'visual-study-material';
  if (/\b(question|answer all questions|marks|attempt|worksheet|revision)\b/.test(text) || /\bworksheet|assignment|revision\b/.test(file)) return 'worksheet';
  if (/\b(notes?|summary|summaries|key points|lesson)\b/.test(text) || /\bnotes?\b/.test(file)) return 'study-notes';
  if (/\b(exam|paper|kcse|quiz|test)\b/.test(text) || /\bexam|test|quiz|paper\b/.test(file)) return 'assessment';
  if (/\b(surah|ayah|hadith|fiqh|tajweed|dua)\b/.test(text)) return 'islamic-study-material';
  if (/\b(table|data|figure)\b/.test(text)) return 'reference-sheet';
  return args.kind === 'pdf' ? 'document' : args.kind === 'text' ? 'text-notes' : 'image-material';
}

export function estimateAudioDurationSec(text: string): number {
  const words = safeString(text).trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(8, Math.round(words / 2.4));
}

export function createStudyImageFallbackDataUrl(args: { title: string; prompt: string }): string {
  const escapedTitle = clampMediaText(args.title || 'Study visual', 80).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
  const escapedPrompt = clampMediaText(args.prompt, 220).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" rx="48" />
      <rect x="72" y="72" width="880" height="880" rx="36" fill="rgba(15,23,42,0.45)" stroke="rgba(148,163,184,0.38)" />
      <text x="120" y="196" fill="#e2e8f0" font-size="44" font-family="Inter, Arial, sans-serif" font-weight="700">${escapedTitle}</text>
      <text x="120" y="258" fill="#bfdbfe" font-size="28" font-family="Inter, Arial, sans-serif">Educational visual (fallback render)</text>
      <foreignObject x="120" y="310" width="784" height="540">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 400 26px/1.55 Inter, Arial, sans-serif; color:#f8fafc;">
          ${escapedPrompt}
        </div>
      </foreignObject>
    </svg>
  `.trim();
  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
