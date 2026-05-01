import { runFlow } from '@genkit-ai/flow';
import { ai } from '../genkit';
import { detectLearningTurnPlan } from './intent-detector';
import { generalWebResearchFlow } from './general_web_search_flow';
import { webSearchFlow } from './web_search_flow';
import { youtubeSearchFlow } from './youtube-search-flow';

interface OrchestratorInput {
  query: string;
  lastSearchTopic?: string;
  forceWebSearch?: boolean;
  chatHistory?: { role: string; content: string }[];
}

type ResearchTriggerType =
  | 'mode_explicit'
  | 'explicit_user_request'
  | 'research_action'
  | 'intent_gate'
  | 'followup_reverify'
  | 'followup_reuse';

type YoutubeSearchResult = {
  id: string;
  title?: string;
  channel?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
};

type VideoRecommendationDetails = {
  explanation: string;
  concepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};

const FORBIDDEN_TOPICS = [
  'sex',
  'dating',
  'romance',
  'violence',
  'kill',
  'suicide',
  'harm',
  'drug',
  'alcohol',
  'politics',
  'vote',
  'gambling',
  'betting',
  'hack',
  'cybercrime',
  'cheat',
  'porn',
  'nude',
  'terror',
  'boyfriend',
  'girlfriend',
  'bhang',
  'weed',
  'smoke',
  'music video',
  'lyrics',
  'official video',
  'song',
  'mp3',
  'playlist',
];

const VIDEO_NOISE_WORDS = new Set([
  'better',
  'another',
  'more',
  'different',
  'best',
  'good',
  'suggest',
  'show',
  'video',
  'youtube',
  'this',
  'that',
  'it',
  'same',
  'topic',
]);

function isSafeQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return !FORBIDDEN_TOPICS.some((topic) => lower.includes(topic));
}

function cleanQueryForSearch(value: string): string {
  return value.replace(/["'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isWebModeMetaQuery(query: string): boolean {
  const lower = query.trim().toLowerCase();
  if (!lower) return false;
  if (/\b(web research mode|research mode)\b/.test(lower)) return true;
  return (
    /\b(are you|did you|why are you|how are you|can you|will you)\b[^?.!]{0,120}\b(search|searching|look up|web|online|source|sources|citation|verify)\b/.test(lower) ||
    /\b(are you searching|did you search|why are you searching|did you look up)\b/.test(lower)
  );
}

function isLikelyFollowUpQuery(query: string): boolean {
  const lower = query.trim().toLowerCase();
  if (!lower) return false;
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 24) return false;
  return (
    /\b(this|that|it|those|these|above|earlier|previous|same|part|point)\b/.test(lower) ||
    /\b(you said|your answer|that answer|this answer|explain that|explain this)\b/.test(lower) ||
    /^(and|so|then|but)\b/.test(lower)
  );
}

function hasExplicitNoWebSignal(query: string): boolean {
  const lower = String(query || '').trim().toLowerCase();
  if (!lower) return false;
  return (
    /\b(no web|don't search|do not search|without searching|no internet|without internet|from your knowledge|from context only)\b/.test(lower) ||
    /\bjust explain|no lookup|no research\b/.test(lower)
  );
}

function hasFreshnessOrVolatilitySignal(query: string): boolean {
  const lower = String(query || '').trim().toLowerCase();
  if (!lower) return false;
  return (
    /\b(latest|current|today|this week|this month|this year|updated|recent|news|breaking|price|stock|rate|exchange rate|inflation|election|president|prime minister|ceo|version|release)\b/.test(lower) ||
    /\b(202[4-9]|203[0-9])\b/.test(lower)
  );
}

function wantsReverify(query: string): boolean {
  const lower = String(query || '').trim().toLowerCase();
  if (!lower) return false;
  return /\b(are you sure|double check|double-check|check again|re-verify|reverify|verify again)\b/.test(
    lower
  );
}

function wantsSourceDiversity(query: string): boolean {
  const lower = String(query || '').trim().toLowerCase();
  if (!lower) return false;
  return /\b(another source|different source|more sources|find another source|source from somewhere else)\b/.test(
    lower
  );
}

function isVideoContextFollowUp(query: string): boolean {
  const lower = query.trim().toLowerCase();
  if (!lower) return false;
  if (!/\b(video|youtube|watch|transcript)\b/.test(lower)) return false;
  return /\b(content|contents|about|about it|in it|inside it|aware|know|summary|summarize|summarise|explain|cover|covers|teach|talking about|what is in|what's in|what is the video about|what does the video say)\b/.test(lower);
}

const GENERIC_VIDEO_REQUEST_NOISE_WORDS = new Set([
  'a',
  'an',
  'about',
  'another',
  'can',
  'cvan',
  'could',
  'educational',
  'find',
  'for',
  'get',
  'give',
  'i',
  'it',
  'lecture',
  'lesson',
  'me',
  'on',
  'please',
  'recommend',
  'same',
  'show',
  'suggest',
  'suggested',
  'that',
  'the',
  'this',
  'topic',
  'transcript',
  'video',
  'watch',
  'would',
  'youtube',
  'you',
]);

function looksLikeGenericVideoRequest(query: string): boolean {
  const lower = query.trim().toLowerCase();
  if (!lower) return false;
  if (!/\b(video|youtube|watch|transcript)\b/.test(lower)) return false;
  if (/\b(this|that|it|same topic|same thing|same concept|same lesson)\b/.test(lower)) return true;

  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const meaningfulWords = words.filter((word) => !GENERIC_VIDEO_REQUEST_NOISE_WORDS.has(word));
  return meaningfulWords.length <= 2;
}

function extractTopicCandidate(query: string): string {
  return cleanQueryForSearch(
    String(query || '')
      .replace(/^(show me|give me|find me|suggest|recommend)\s+(an?\s+)?(video|youtube video|youtube|transcript)\s*/i, '')
      .replace(/^(what about|how about|let'?s talk about|talk about|new topic|another topic|different topic|change topic to|switch topic to|instead)\s+/i, '')
  );
}

function shouldPrefixActiveTopicForWebQuery(query: string): boolean {
  const lower = cleanQueryForSearch(query).toLowerCase();
  if (!lower) return false;
  if (/\b(new topic|another topic|different topic|change topic|switch topic|unrelated)\b/.test(lower)) {
    return false;
  }
  if (/\b(this|that|it|again|same|as above|previous)\b/.test(lower)) return true;
  if (/^(search|look up|find|check)\b/.test(lower) && /\b(latest|current|today|update|source|sources|citation|cite)\b/.test(lower)) {
    return true;
  }
  if (/\b(update again|latest update again|cite source links?)\b/.test(lower)) return true;
  return false;
}

function buildContextualWebQuery(query: string, activeTopic?: string): string {
  const cleanedQuery = cleanQueryForSearch(query);
  const topic = cleanQueryForSearch(activeTopic || '');
  if (!topic) return cleanedQuery;
  if (!shouldPrefixActiveTopicForWebQuery(cleanedQuery)) return cleanedQuery;
  const lowerQuery = cleanedQuery.toLowerCase();
  const lowerTopic = topic.toLowerCase();
  if (lowerQuery.includes(lowerTopic)) return cleanedQuery;
  return `${topic} ${cleanedQuery}`.trim();
}

function shouldRewriteVideoQuery(userQuery: string): boolean {
  const words = userQuery.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const noiseCount = words.filter((word) => VIDEO_NOISE_WORDS.has(word)).length;
  return noiseCount >= Math.ceil(words.length / 2);
}

async function generateVideoQuery(userQuery: string, topic?: string): Promise<string> {
  const cleanUserQuery = cleanQueryForSearch(userQuery);
  const candidateTopic = extractTopicCandidate(cleanUserQuery);
  if (topic && (looksLikeGenericVideoRequest(cleanUserQuery) || looksLikeGenericVideoRequest(candidateTopic))) {
    return `${cleanQueryForSearch(topic)} educational`;
  }
  if (candidateTopic && candidateTopic !== cleanUserQuery && !isLikelyFollowUpQuery(cleanUserQuery)) {
    return candidateTopic;
  }
  if (!topic) return cleanUserQuery;
  if (!shouldRewriteVideoQuery(cleanUserQuery)) return cleanUserQuery;

  const prompt = `
Active topic: "${topic}"
User request: "${cleanUserQuery}"

Rewrite into one clean YouTube educational query.

Return strict JSON only:
{"query":"..."}

Rules:
- Replace vague pronouns with the active topic.
- Keep useful qualifiers from the user request.
- If request is generic ("another video"), return "<topic> educational".
`;

  try {
    const res = await ai.generate({
      model: 'openai/gpt-4o-mini',
      prompt,
      output: { format: 'json' },
    });

    const candidate = (res.output as { query?: unknown } | null)?.query;
    if (typeof candidate === 'string' && candidate.trim()) {
      return cleanQueryForSearch(candidate);
    }
  } catch {
    // Fall through to deterministic fallback.
  }

  return `${cleanQueryForSearch(topic)} educational`;
}

function isEducationalVideoTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return !['official video', 'lyrics', 'music', 'reaction', 'song'].some((bad) => lower.includes(bad));
}

function tokenizeTopicTerms(text: string): string[] {
  return cleanQueryForSearch(text)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 10);
}

function scoreEducationalVideoCandidate(
  video: YoutubeSearchResult,
  topic: string,
  userQuery: string
): number {
  const title = String(video.title || '').toLowerCase();
  const channel = String(video.channel || video.channelTitle || '').toLowerCase();
  const topicTerms = new Set([...tokenizeTopicTerms(topic), ...tokenizeTopicTerms(userQuery)]);
  const metaYouTubeTerms = [
    'suggested videos',
    'youtube suggested',
    'watch later',
    'partner program',
    'youtube creator',
    'algorithm',
    'monetization',
    'adsense',
  ];
  const educationalTerms = [
    'lesson',
    'tutorial',
    'explained',
    'introduction',
    'practice',
    'revision',
    'worked example',
    'solve',
    'equations',
    'math',
    'science',
  ];
  const trustedChannelHints = [
    'khan academy',
    'freesciencelessons',
    'organic chemistry tutor',
    'crash course',
    'math antics',
    'ted-ed',
  ];

  if (!isEducationalVideoTitle(title)) return -100;
  if (metaYouTubeTerms.some((term) => title.includes(term) || channel.includes(term))) return -50;

  let score = 0;
  for (const term of topicTerms) {
    if (title.includes(term)) score += 6;
    if (channel.includes(term)) score += 2;
  }
  if (educationalTerms.some((term) => title.includes(term))) score += 5;
  if (trustedChannelHints.some((term) => channel.includes(term))) score += 8;
  if (/\b(kcse|igcse|gcse|grade|form)\b/.test(title)) score += 3;

  return score;
}

function pickBestEducationalVideo(
  videos: YoutubeSearchResult[],
  topic: string,
  userQuery: string
): YoutubeSearchResult | null {
  const ranked = videos
    .map((video) => ({
      video,
      score: scoreEducationalVideoCandidate(video, topic, userQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.video || null;
}

function inferVideoDifficulty(title: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = String(title || '').toLowerCase();
  if (/\b(introduction|intro|basics|beginner|easy|foundation|for beginners)\b/.test(lower)) return 'beginner';
  if (/\b(advanced|hard|exam challenge|olympiad|proof)\b/.test(lower)) return 'advanced';
  return 'intermediate';
}

function buildVideoRecommendationDetails(
  video: YoutubeSearchResult,
  topic: string,
  userQuery: string
): VideoRecommendationDetails {
  const normalizedTopic = cleanQueryForSearch(topic || userQuery || 'this topic');
  const title = String(video.title || '').trim();
  const channel = String(video.channel || video.channelTitle || '').trim();
  const difficulty = inferVideoDifficulty(title);
  const topicTerms = Array.from(new Set([...tokenizeTopicTerms(normalizedTopic), ...tokenizeTopicTerms(userQuery)])).slice(0, 4);
  const coverageTerms = topicTerms.filter((term) => title.toLowerCase().includes(term));
  const concepts = coverageTerms.length > 0 ? coverageTerms : topicTerms;
  const difficultyText =
    difficulty === 'beginner'
      ? 'It looks beginner-friendly and suitable for first understanding.'
      : difficulty === 'advanced'
        ? 'It looks better for deeper or higher-challenge study.'
        : 'It looks suitable for guided practice after the basics.';
  const explanation = [
    `I found a strong video for ${normalizedTopic}: "${title}".`,
    concepts.length > 0 ? `Why this fits: it appears to cover ${concepts.join(', ')} directly.` : 'Why this fits: the title lines up well with the lesson topic.',
    difficultyText,
    channel ? `Channel signal: ${channel}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return { explanation, concepts, difficulty };
}

function hasRunnableFlow(flow: unknown): flow is { inputSchema: unknown } {
  return Boolean(flow) && typeof flow === 'object' && Boolean((flow as Record<string, unknown>).inputSchema);
}

async function runYoutubeSearchSafely(query: string): Promise<YoutubeSearchResult[]> {
  if (!query) return [];
  if (!hasRunnableFlow(youtubeSearchFlow)) {
    console.warn('[ResearchOrchestrator] youtubeSearchFlow is unavailable. Skipping video lookup.');
    return [];
  }
  try {
    const results = await runFlow(youtubeSearchFlow as any, { query });
    return Array.isArray(results) ? (results as YoutubeSearchResult[]) : [];
  } catch (error) {
    console.error('[ResearchOrchestrator] YouTube lookup failed:', error);
    return [];
  }
}

async function runWebSearchFlowSafely(input: {
  query: string;
  chatHistory: { role: string; content: string }[];
  lastSearchTopic?: string;
}) {
  if (!hasRunnableFlow(webSearchFlow)) {
    return {
      mode: 'teaching',
      response: 'Let us continue directly from what we have already discussed.',
    };
  }
  return runFlow(webSearchFlow as any, {
    query: input.query,
    chatHistory: input.chatHistory,
    lastSearchTopic: input.lastSearchTopic,
    awaitingPracticeQuestion: false,
    awaitingPracticeAnswer: false,
    attempts: 0,
  });
}

async function runGeneralResearchFlowSafely(input: { query: string; forceWebSearch: boolean }) {
  if (!hasRunnableFlow(generalWebResearchFlow)) {
    return {
      mode: 'teaching',
      response: 'I can continue teaching this directly without web lookup.',
    };
  }
  return runFlow(generalWebResearchFlow as any, input);
}

function resolveResearchTriggerType(args: {
  forceWebSearch?: boolean;
  researchReason?: string;
  query: string;
}): ResearchTriggerType {
  const normalizedQuery = String(args.query || '').toLowerCase();
  if (wantsReverify(normalizedQuery)) return 'followup_reverify';
  if (wantsSourceDiversity(normalizedQuery)) return 'followup_reuse';
  if (/\b(research this|use sources|find evidence|compare sources)\b/.test(normalizedQuery)) {
    return 'research_action';
  }
  if (args.forceWebSearch) return 'mode_explicit';
  if (args.researchReason === 'explicit_research_request') return 'explicit_user_request';
  return 'intent_gate';
}

export async function runResearchOrchestrator(input: OrchestratorInput) {
  const history = input.chatHistory || [];
  const activeTopic = cleanQueryForSearch(input.lastSearchTopic || '');
  const contextualWebQuery = buildContextualWebQuery(input.query, activeTopic);
  const hasActiveTopic = activeTopic.length > 0;

  if (!isSafeQuery(input.query)) {
    return runWebSearchFlowSafely({
      query: input.query,
      chatHistory: history,
      lastSearchTopic: input.lastSearchTopic,
    });
  }

  const turnPlan = await detectLearningTurnPlan(input.query, input.lastSearchTopic, {
    hasVideoContext: Boolean(hasActiveTopic && isVideoContextFollowUp(input.query)),
    forceWebSearch: input.forceWebSearch,
    recentTurns: history,
  });
  const intent = turnPlan.intent;
  const shouldUseWebResearch = turnPlan.researchRequired && turnPlan.primaryAction === 'research';
  const triggerType = resolveResearchTriggerType({
    forceWebSearch: input.forceWebSearch,
    researchReason: turnPlan.researchReason,
    query: input.query,
  });
  const diversifiedQuery = wantsSourceDiversity(input.query)
    ? `${contextualWebQuery} additional trusted source`
    : contextualWebQuery;
  const researchQuery = wantsReverify(input.query)
    ? `${diversifiedQuery} verify with trusted current source`
    : diversifiedQuery;

  if (intent === 'video_lookup' || turnPlan.primaryAction === 'video_lookup') {
    if (
      turnPlan.currentContextTarget === 'video' ||
      (isVideoContextFollowUp(input.query) && (hasActiveTopic || turnPlan.likelyFollowUp || history.length > 0))
    ) {
      return {
        mode: 'teaching',
        response: 'We are still talking about the current video already in this conversation. Ask me to summarize it or explain a specific part instead of searching for a new one.',
      };
    }
    const effectiveQuery = await generateVideoQuery(input.query, input.lastSearchTopic);
    const videos = await runYoutubeSearchSafely(effectiveQuery);
    const video = pickBestEducationalVideo(videos, input.lastSearchTopic || effectiveQuery, input.query);
    const safeChannel = (video?.channel || video?.channelTitle || '').replace('Unknown Channel', '');
    const recommendation = video
      ? buildVideoRecommendationDetails(video, input.lastSearchTopic || effectiveQuery, input.query)
      : null;

    return {
      mode: 'teaching',
      response: video
        ? recommendation?.explanation || `I found a relevant video on ${effectiveQuery}.`
        : `I searched for videos on "${effectiveQuery}" but could not find a strong educational match right now.`,
      videoData: video
        ? { id: video.id, title: video.title, channel: safeChannel, thumbnail: video.thumbnailUrl }
        : undefined,
      videoWhyRecommended: recommendation?.explanation,
      videoConcepts: recommendation?.concepts,
      triggerType,
      researchReason: turnPlan.researchReason,
      confidenceState: video ? 'medium' : 'insufficient',
      queryUsed: effectiveQuery,
      queryPlan: [effectiveQuery],
      searchCount: 1,
      reuseHit: false,
      notices: video
        ? []
        : [
            {
              code: 'limited_source_support',
              message: 'No strong educational video match was found for this request.',
              severity: 'info' as const,
            },
          ],
    };
  }

  if (shouldUseWebResearch) {
    const webResult = await runGeneralResearchFlowSafely({
      query: researchQuery,
      forceWebSearch: true,
    });
    return {
      ...webResult,
      triggerType,
      researchReason: turnPlan.researchReason,
      queryUsed:
        String((webResult as { queryUsed?: unknown })?.queryUsed || '').trim() || researchQuery,
      queryPlan:
        Array.isArray((webResult as { queryPlan?: unknown })?.queryPlan)
          ? ((webResult as { queryPlan?: string[] }).queryPlan || [])
          : [researchQuery],
      searchCount:
        typeof (webResult as { searchCount?: unknown })?.searchCount === 'number'
          ? (webResult as { searchCount: number }).searchCount
          : 1,
      sourceReuseId:
        String((webResult as { sourceReuseId?: unknown })?.sourceReuseId || '').trim() || undefined,
      reuseHit: (webResult as { reuseHit?: boolean })?.reuseHit === true,
      confidenceState:
        ((webResult as { confidenceState?: unknown })?.confidenceState as
          | 'high'
          | 'medium'
          | 'low'
          | 'mixed'
          | 'insufficient'
          | undefined) || 'insufficient',
      firstUsefulLatencyMs:
        typeof (webResult as { firstUsefulLatencyMs?: unknown })?.firstUsefulLatencyMs === 'number'
          ? (webResult as { firstUsefulLatencyMs: number }).firstUsefulLatencyMs
          : undefined,
      completedLatencyMs:
        typeof (webResult as { latencyMs?: unknown })?.latencyMs === 'number'
          ? (webResult as { latencyMs: number }).latencyMs
          : undefined,
      notices: Array.isArray((webResult as { notices?: unknown })?.notices)
        ? ((webResult as { notices?: any[] }).notices || [])
        : [],
    };
  }

  const contextualResult = await runWebSearchFlowSafely({
    query: input.query,
    chatHistory: history,
    lastSearchTopic: input.lastSearchTopic,
  });
  return {
    ...contextualResult,
    triggerType,
    researchReason: turnPlan.researchReason,
    queryUsed: input.query,
    queryPlan: [input.query],
    searchCount: 0,
    reuseHit: false,
    confidenceState: 'insufficient' as const,
    notices: [
      {
        code: 'source_reuse_miss',
        message: 'Continued with contextual tutoring because fresh web research was not necessary.',
        severity: 'info' as const,
      },
    ],
  };
}
