import { runResearchOrchestrator } from '../../../AI/ai/flows/research-orchestrator';
import type {
  RecommendedVideo,
  ResearchIntent,
  ResearchNotice,
  ResearchResult,
  ResearchSource,
} from '../lib/types';
import { evaluateResearchSource, summarizeSourceTrust, inferVideoTrustTier } from './sourceTrustService';

export type RunResearchModeArgs = {
  query: string;
  activeTopic?: string | null;
  forceWebSearch?: boolean;
  chatHistory?: Array<{ role: string; content: string }>;
};

export type RunResearchModeResult = {
  mode: 'teaching' | 'web_research';
  intent: ResearchIntent;
  queryUsed: string;
  result: ResearchResult;
  notices: ResearchNotice[];
  recommendedVideo?: RecommendedVideo | null;
};

type OrchestratorSource = {
  sourceName?: unknown;
  title?: unknown;
  url?: unknown;
  link?: unknown;
};

type OrchestratorVideo = {
  id?: unknown;
  videoId?: unknown;
  title?: unknown;
  channel?: unknown;
  channelTitle?: unknown;
  thumbnail?: unknown;
  thumbnailUrl?: unknown;
};

type OrchestratorNotice = {
  code?: unknown;
  message?: unknown;
  severity?: unknown;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function limitText(value: string, maxChars = 420): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
}

function inferResearchIntent(query: string): ResearchIntent {
  const lower = safeString(query).toLowerCase();
  if (/\b(latest|current|today|this week|news|update|recent)\b/.test(lower)) return 'current_events';
  if (/\b(verify|verification|is this true|fact check|cross check)\b/.test(lower)) return 'verification';
  if (/\b(worksheet|artifact|document|image|pdf|uploaded file)\b/.test(lower)) return 'artifact_followup';
  if (/\b(misconception|wrong idea|confuse|mix up|mistake)\b/.test(lower)) return 'misconception_research';
  if (/\b(source|sources|citation|cite)\b/.test(lower)) return 'source_backed_explanation';
  return 'topic_research';
}

function parseSources(rawSources: unknown): ResearchSource[] {
  if (!Array.isArray(rawSources)) return [];
  const dedupe = new Map<string, ResearchSource>();
  for (const raw of rawSources as OrchestratorSource[]) {
    const title = safeString(raw?.sourceName || raw?.title).trim();
    const url = safeString(raw?.url || raw?.link).trim() || null;
    if (!title && !url) continue;
    const normalized = evaluateResearchSource({
      title: title || 'Source',
      url,
    });
    const key = `${safeString(normalized.url).toLowerCase()}::${safeString(normalized.title).toLowerCase()}`;
    if (!dedupe.has(key)) {
      dedupe.set(key, normalized);
    }
    if (dedupe.size >= 6) break;
  }
  return [...dedupe.values()];
}

function buildNotices(args: {
  mode: string;
  sources: ResearchSource[];
  query: string;
  confidenceState?: string;
}): ResearchNotice[] {
  const notices: ResearchNotice[] = [];
  const lower = safeString(args.query).toLowerCase();
  const hasFreshnessSignal = /\b(latest|current|today|this week|news|recent|update|price)\b/.test(lower);

  if (args.mode !== 'web_research') {
    notices.push({
      code: 'research_not_needed',
      message: 'The tutor used direct teaching because full web research was not needed for this turn.',
      severity: 'info',
    });
  }

  if (args.sources.length === 0) {
    notices.push({
      code: 'limited_source_support',
      message: 'Strong external sources were limited, so this answer leans on guided teaching support.',
      severity: 'warning',
    });
  } else if (args.sources.length === 1) {
    notices.push({
      code: 'partial_research',
      message: 'Only one source was confidently selected, so it is best to cross-check key points.',
      severity: 'info',
    });
  }

  if (hasFreshnessSignal) {
    notices.push({
      code: 'current_info_risk',
      message: 'This topic can change quickly, so verify dates and latest updates when needed.',
      severity: 'info',
    });
  }

  if (args.confidenceState === 'low' || args.confidenceState === 'insufficient') {
    notices.push({
      code: 'research_confidence_low',
      message: 'Confidence is limited for this query, so consider a narrower follow-up.',
      severity: 'warning',
    });
  }

  return notices;
}

function parseNotices(rawNotices: unknown): ResearchNotice[] {
  if (!Array.isArray(rawNotices)) return [];
  const notices: ResearchNotice[] = [];
  const seen = new Set<string>();
  for (const rawNotice of rawNotices as OrchestratorNotice[]) {
    const code = safeString(rawNotice?.code).trim();
    const message = safeString(rawNotice?.message).trim();
    const severity = safeString(rawNotice?.severity).trim().toLowerCase();
    if (!code || !message) continue;
    if (
      ![
        'limited_source_support',
        'partial_research',
        'transcript_unavailable',
        'research_not_needed',
        'current_info_risk',
        'mixed_sources',
        'research_timeout',
        'research_confidence_low',
        'source_reuse_hit',
        'source_reuse_miss',
      ].includes(code)
    ) {
      continue;
    }
    const dedupeKey = `${code}:${message}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      code: code as ResearchNotice['code'],
      message,
      severity: severity === 'warning' ? 'warning' : 'info',
    });
  }
  return notices;
}

function mapRecommendedVideo(rawVideo: unknown, whyRecommended?: unknown): RecommendedVideo | null {
  const video = (rawVideo || {}) as OrchestratorVideo;
  const videoId = safeString(video.id || video.videoId).trim();
  if (!videoId) return null;

  const channelTitle = safeString(video.channelTitle || video.channel).trim() || null;
  return {
    videoId,
    title: safeString(video.title).trim() || 'Recommended video',
    channelTitle,
    thumbnailUrl: safeString(video.thumbnailUrl || video.thumbnail).trim() || null,
    transcriptAvailable: null,
    language: null,
    intent: null,
    whyRecommended: limitText(safeString(whyRecommended).trim(), 180) || null,
    trustTier: inferVideoTrustTier(channelTitle),
  };
}

export async function runResearchMode(args: RunResearchModeArgs): Promise<RunResearchModeResult> {
  const query = safeString(args.query).trim();
  if (!query) {
    return {
      mode: 'teaching',
      intent: 'topic_research',
      queryUsed: '',
      result: {
        summary: 'Please share a topic or question so I can run focused research support.',
        sources: [],
        trustSummary: null,
        limitations: ['No research query was provided.'],
        nextStepPrompt: 'Try asking for one topic and what you want to understand first.',
      },
      notices: [
        {
          code: 'partial_research',
          message: 'No query was provided for research mode.',
          severity: 'warning',
        },
      ],
      recommendedVideo: null,
    };
  }

  const orchestrated = await runResearchOrchestrator({
    query,
    forceWebSearch: Boolean(args.forceWebSearch),
    lastSearchTopic: safeString(args.activeTopic || '').trim() || undefined,
    chatHistory: Array.isArray(args.chatHistory)
      ? args.chatHistory.map((entry) => ({
          role: safeString(entry.role).trim() || 'user',
          content: safeString(entry.content),
        }))
      : [],
  });

  const mode = safeString((orchestrated as { mode?: unknown })?.mode) === 'web_research' ? 'web_research' : 'teaching';
  const summaryText =
    limitText(
      safeString(
        (orchestrated as { reply?: unknown; response?: unknown })?.reply ||
          (orchestrated as { reply?: unknown; response?: unknown })?.response
      ),
      1100
    ) || 'I could not gather enough external evidence yet, but I can still guide this topic step by step.';

  const sources = parseSources((orchestrated as { sources?: unknown })?.sources);
  const trustSummary = summarizeSourceTrust(sources);
  const confidenceState = safeString((orchestrated as { confidenceState?: unknown })?.confidenceState).trim();
  const orchestratorNotices = parseNotices((orchestrated as { notices?: unknown })?.notices);
  const notices = [
    ...buildNotices({ mode, sources, query, confidenceState }),
    ...orchestratorNotices,
  ].filter((notice, index, all) => all.findIndex((entry) => entry.code === notice.code && entry.message === notice.message) === index);
  const limitations = notices
    .filter((notice) =>
      notice.code === 'limited_source_support' ||
      notice.code === 'partial_research' ||
      notice.code === 'research_confidence_low'
    )
    .map((notice) => notice.message);

  return {
    mode,
    intent: inferResearchIntent(query),
    queryUsed: query,
    result: {
      summary: summaryText,
      sources,
      trustSummary,
      limitations: limitations.length > 0 ? limitations : null,
      nextStepPrompt:
        mode === 'web_research'
          ? 'Would you like a short quiz, a simpler explanation, or a saved revision note from this research?'
          : 'Would you like me to run deeper source-backed research for this same topic?',
      queryPlan: Array.isArray((orchestrated as { queryPlan?: unknown })?.queryPlan)
        ? ((orchestrated as { queryPlan?: string[] }).queryPlan || [])
        : [query],
      searchCount:
        typeof (orchestrated as { searchCount?: unknown })?.searchCount === 'number'
          ? Number((orchestrated as { searchCount?: unknown }).searchCount)
          : undefined,
      sourceReuseId: safeString((orchestrated as { sourceReuseId?: unknown })?.sourceReuseId).trim() || undefined,
      reuseHit: (orchestrated as { reuseHit?: unknown })?.reuseHit === true,
      confidenceState:
        confidenceState === 'high' ||
        confidenceState === 'medium' ||
        confidenceState === 'low' ||
        confidenceState === 'mixed' ||
        confidenceState === 'insufficient'
          ? (confidenceState as ResearchResult['confidenceState'])
          : undefined,
      triggerType: (() => {
        const raw = safeString((orchestrated as { triggerType?: unknown })?.triggerType).trim();
        return raw === 'mode_explicit' ||
          raw === 'explicit_user_request' ||
          raw === 'research_action' ||
          raw === 'intent_gate' ||
          raw === 'followup_reverify' ||
          raw === 'followup_reuse'
          ? (raw as ResearchResult['triggerType'])
          : undefined;
      })(),
      latencyMs:
        typeof (orchestrated as { completedLatencyMs?: unknown })?.completedLatencyMs === 'number'
          ? Number((orchestrated as { completedLatencyMs?: unknown }).completedLatencyMs)
          : typeof (orchestrated as { latencyMs?: unknown })?.latencyMs === 'number'
            ? Number((orchestrated as { latencyMs?: unknown }).latencyMs)
            : undefined,
      firstUsefulLatencyMs:
        typeof (orchestrated as { firstUsefulLatencyMs?: unknown })?.firstUsefulLatencyMs === 'number'
          ? Number((orchestrated as { firstUsefulLatencyMs?: unknown }).firstUsefulLatencyMs)
          : undefined,
    },
    notices,
    recommendedVideo: mapRecommendedVideo(
      (orchestrated as { videoData?: unknown })?.videoData,
      (orchestrated as { videoWhyRecommended?: unknown })?.videoWhyRecommended
    ),
  };
}
