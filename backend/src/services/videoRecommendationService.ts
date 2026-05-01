import { runFlow } from '@genkit-ai/flow';
import { getYoutubeTranscriptFlow } from '../../../AI/ai/flows/get-youtube-transcript';
import { youtubeSearchFlow } from '../../../AI/ai/flows/youtube-search-flow';
import type {
  RecommendedVideo,
  ResearchNotice,
  VideoContextSummary,
  VideoRecommendationIntent,
  VideoRecommendationResult,
} from '../lib/types';
import { inferVideoTrustTier } from './sourceTrustService';

type YoutubeCandidate = {
  id?: unknown;
  videoId?: unknown;
  title?: unknown;
  channel?: unknown;
  channelTitle?: unknown;
  thumbnailUrl?: unknown;
};

export type RecommendVideosArgs = {
  query?: string | null;
  topic?: string | null;
  subject?: string | null;
  intent?: VideoRecommendationIntent | null;
  limit?: number;
};

export type VideoContextArgs = {
  videoId: string;
  title?: string | null;
  topic?: string | null;
  whyRecommended?: string | null;
};

const MAX_VIDEOS = 5;

const CHANNEL_TRUST_HINTS = [
  'khan academy',
  'ted-ed',
  'crash course',
  'organic chemistry tutor',
  'math antics',
  'free science lessons',
  'national geographic',
  'bbc',
];

const EDUCATIONAL_TERMS = [
  'lesson',
  'tutorial',
  'explained',
  'introduction',
  'beginner',
  'revision',
  'practice',
  'worked example',
  'step by step',
];

const INTENT_KEYWORDS: Record<VideoRecommendationIntent, string[]> = {
  concept_explainer: ['explain', 'concept', 'understand', 'introduction'],
  worked_example: ['worked example', 'solve', 'step by step', 'questions'],
  revision_recap: ['revision', 'recap', 'summary', 'quick review'],
  visual_animation: ['animation', 'visual', 'diagram', 'illustrated'],
  exam_help: ['exam', 'past paper', 'kcse', 'igcse', 'gcse'],
  beginner_friendly: ['beginner', 'basics', 'easy', 'foundation'],
  misconception_fix: ['common mistakes', 'mistakes', 'avoid errors', 'misconception'],
  language_support: ['simple explanation', 'clear explanation', 'for students'],
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function limitText(value: string, maxChars = 240): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
}

function normalizeTokens(text: string): string[] {
  return safeString(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 18);
}

function inferIntent(args: RecommendVideosArgs): VideoRecommendationIntent {
  if (args.intent) return args.intent;
  const text = `${safeString(args.query)} ${safeString(args.topic)} ${safeString(args.subject)}`.toLowerCase();
  if (/\b(animation|diagram|visual)\b/.test(text)) return 'visual_animation';
  if (/\b(exam|kcse|igcse|gcse|past paper)\b/.test(text)) return 'exam_help';
  if (/\b(recap|revision|quick review)\b/.test(text)) return 'revision_recap';
  if (/\b(mistake|misconception|wrong method|confuse)\b/.test(text)) return 'misconception_fix';
  if (/\b(solve|step|worked)\b/.test(text)) return 'worked_example';
  if (/\b(beginner|basic|simple)\b/.test(text)) return 'beginner_friendly';
  if (/\b(language|swahili|arabic|english)\b/.test(text)) return 'language_support';
  return 'concept_explainer';
}

function buildSearchQuery(args: RecommendVideosArgs, intent: VideoRecommendationIntent): string {
  const topic = safeString(args.topic).trim();
  const query = safeString(args.query).trim();
  const subject = safeString(args.subject).trim();
  const base = topic || query || subject;
  if (!base) return 'educational lesson';
  const qualifiers = INTENT_KEYWORDS[intent].slice(0, 2).join(' ');
  return `${base} ${qualifiers}`.trim();
}

function relevanceScore(candidate: YoutubeCandidate, query: string, intent: VideoRecommendationIntent): number {
  const title = safeString(candidate.title).toLowerCase();
  const channel = safeString(candidate.channelTitle || candidate.channel).toLowerCase();
  const queryTokens = new Set(normalizeTokens(query));
  const intentTokens = new Set(INTENT_KEYWORDS[intent].flatMap((text) => normalizeTokens(text)));

  let score = 0;
  for (const token of queryTokens) {
    if (title.includes(token)) score += 6;
    if (channel.includes(token)) score += 2;
  }
  for (const token of intentTokens) {
    if (title.includes(token)) score += 5;
  }
  if (EDUCATIONAL_TERMS.some((term) => title.includes(term))) score += 4;
  if (CHANNEL_TRUST_HINTS.some((hint) => channel.includes(hint))) score += 8;
  if (/\b(official video|lyrics|song|music video|reaction)\b/.test(title)) score -= 50;
  return score;
}

function buildWhyRecommended(args: {
  intent: VideoRecommendationIntent;
  title: string;
  topic?: string | null;
}): string {
  const topic = safeString(args.topic).trim() || 'your current topic';
  switch (args.intent) {
    case 'worked_example':
      return `This is a strong match because it focuses on worked steps for ${topic}.`;
    case 'revision_recap':
      return `This is useful for revision because it gives a focused recap of ${topic}.`;
    case 'visual_animation':
      return `This was chosen because visual explanation can make ${topic} easier to picture.`;
    case 'exam_help':
      return `This is aligned with exam-style preparation for ${topic}.`;
    case 'beginner_friendly':
      return `This looks beginner-friendly and should explain ${topic} in simpler steps.`;
    case 'misconception_fix':
      return `This can help fix common confusion points in ${topic}.`;
    case 'language_support':
      return `This should support language-friendly understanding for ${topic}.`;
    default:
      return `This was selected because it directly explains ${topic} in a clear way.`;
  }
}

function normalizeCandidate(candidate: YoutubeCandidate): RecommendedVideo | null {
  const videoId = safeString(candidate.videoId || candidate.id).trim();
  if (!videoId) return null;
  const channelTitle = safeString(candidate.channelTitle || candidate.channel).trim() || null;
  return {
    videoId,
    title: safeString(candidate.title).trim() || 'Recommended video',
    channelTitle,
    thumbnailUrl: safeString(candidate.thumbnailUrl).trim() || null,
    transcriptAvailable: null,
    language: null,
    intent: null,
    whyRecommended: null,
    trustTier: inferVideoTrustTier(channelTitle),
  };
}

async function checkTranscriptAvailability(videoId: string): Promise<boolean | null> {
  try {
    const transcript = await runFlow(getYoutubeTranscriptFlow as any, { videoId });
    if (typeof transcript !== 'string') return null;
    const normalized = transcript.trim();
    if (!normalized) return null;
    if (/^could not fetch transcript/i.test(normalized)) return false;
    return true;
  } catch {
    return null;
  }
}

function extractConcepts(text: string): string[] {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'that',
    'with',
    'this',
    'from',
    'are',
    'was',
    'have',
    'into',
    'your',
    'you',
    'they',
    'their',
    'about',
    'what',
    'when',
    'where',
    'which',
    'while',
    'then',
    'than',
    'there',
  ]);
  const counts = new Map<string, number>();
  for (const token of normalizeTokens(text)) {
    if (stopWords.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([token]) => token);
}

function summarizeTranscript(transcript: string): string {
  const sentences = safeString(transcript)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim().length > 20);
  return limitText(sentences.slice(0, 2).join(' '), 360);
}

export async function recommendEducationalVideos(args: RecommendVideosArgs): Promise<VideoRecommendationResult> {
  const intent = inferIntent(args);
  const queryUsed = buildSearchQuery(args, intent);
  const rawResults = (await runFlow(youtubeSearchFlow as any, { query: queryUsed })) as YoutubeCandidate[];
  const ranked = (Array.isArray(rawResults) ? rawResults : [])
    .map((candidate) => ({
      candidate,
      score: relevanceScore(candidate, queryUsed, intent),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(1, Math.min(Number(args.limit || 3), MAX_VIDEOS)));

  const notices: ResearchNotice[] = [];
  if (!ranked.length) {
    notices.push({
      code: 'limited_source_support',
      message: 'No strong educational video match was found yet for this exact request.',
      severity: 'warning',
    });
  }

  const videos: RecommendedVideo[] = [];
  for (const entry of ranked) {
    const normalized = normalizeCandidate(entry.candidate);
    if (!normalized) continue;
    const transcriptAvailable = await checkTranscriptAvailability(normalized.videoId);
    videos.push({
      ...normalized,
      intent,
      transcriptAvailable,
      whyRecommended: buildWhyRecommended({
        intent,
        title: normalized.title,
        topic: args.topic || args.query || null,
      }),
    });
  }

  return {
    intent,
    queryUsed,
    summary: videos.length
      ? `I found ${videos.length} video ${videos.length === 1 ? 'option' : 'options'} that match your current study need.`
      : 'I could not find a strong video recommendation yet, so I suggest continuing with guided tutoring for now.',
    videos,
    notices: notices.length > 0 ? notices : null,
  };
}

export async function getVideoContextSummary(args: VideoContextArgs): Promise<VideoContextSummary> {
  const notices: ResearchNotice[] = [];
  const transcript = await runFlow(getYoutubeTranscriptFlow as any, { videoId: args.videoId }).catch(() => null);
  const transcriptText = typeof transcript === 'string' ? transcript.trim() : '';
  const transcriptAvailable = Boolean(transcriptText) && !/^could not fetch transcript/i.test(transcriptText);

  if (!transcriptAvailable) {
    notices.push({
      code: 'transcript_unavailable',
      message: 'Transcript was unavailable for this video, so context is based on title and recommendation metadata.',
      severity: 'info',
    });
  }

  const effectiveText = transcriptAvailable ? transcriptText : `${safeString(args.title)} ${safeString(args.topic)}`;
  const concepts = extractConcepts(effectiveText);
  const summary = transcriptAvailable
    ? summarizeTranscript(transcriptText)
    : limitText(
        `This video is being used for ${safeString(args.topic).trim() || 'the current topic'}. ${
          safeString(args.whyRecommended).trim() || 'Use it as guided support, then return for a quick check.'
        }`,
        320
      );

  return {
    videoId: args.videoId,
    title: safeString(args.title).trim() || null,
    transcriptAvailable,
    transcriptExcerpt: transcriptAvailable ? limitText(transcriptText, 420) : null,
    summary: summary || null,
    concepts,
    whyRecommended: safeString(args.whyRecommended).trim() || null,
    notices: notices.length > 0 ? notices : null,
  };
}
