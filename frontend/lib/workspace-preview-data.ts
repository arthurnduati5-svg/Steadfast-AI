import type {
  ChatSession,
  CopilotPreloadResponse,
  Message,
  MetacognitiveProfile,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionOverview,
} from '@/lib/types';
import {
  getRevisionPreviewGroupingSuggestions,
  getRevisionPreviewOverview,
} from '@/lib/revision-preview-data';

export const WORKSPACE_PREVIEW_ENABLED = process.env.NODE_ENV !== 'production';

const PREVIEW_STUDENT_ID = 'preview-student';
const PREVIEW_SESSION_PREFIX = 'preview-session-';
const PREVIEW_HISTORY_MINIMUM = 12;

function previewMessage(id: string, role: 'user' | 'model', content: string, timestamp: string): Message {
  return {
    id,
    role,
    content,
    timestamp: new Date(timestamp),
  };
}

const previewHistorySessions: ChatSession[] = [
  {
    id: 'preview-session-algebra',
    title: 'Linear equations rescue',
    topic: 'Linear equations',
    firstMessage: 'I always get stuck when x is on both sides of the equation.',
    summary: 'We slowed down the sign changes and practiced isolating x without rushing.',
    lastTutorFocus: 'Move one term at a time and say the sign change aloud.',
    learningMode: 'guided',
    revisionCount: 3,
    createdAt: '2026-04-04T07:10:00.000Z',
    updatedAt: '2026-04-04T07:34:00.000Z',
    tutorState: {
      activeTopic: 'Linear equations',
      activeSubject: 'math',
      learnerStage: 'developing',
      recommendedMode: 'guided',
      visibleFocusLabel: 'Algebra recovery',
      preferredSupportPatterns: ['Worked example first', 'Check the sign before the next step'],
    },
    messages: [
      previewMessage(
        'preview-msg-algebra-1',
        'user',
        'I always get stuck when x is on both sides of the equation.',
        '2026-04-04T07:12:00.000Z'
      ),
      previewMessage(
        'preview-msg-algebra-2',
        'model',
        'Start by moving one x-term first. For 3x + 5 = x + 17, subtract x from both sides before touching the constants.',
        '2026-04-04T07:12:30.000Z'
      ),
      previewMessage(
        'preview-msg-algebra-3',
        'user',
        'So it becomes 2x + 5 = 17, then subtract 5?',
        '2026-04-04T07:13:10.000Z'
      ),
      previewMessage(
        'preview-msg-algebra-4',
        'model',
        'Exactly. Then 2x = 12 and x = 6. The key win is moving one kind of term at a time.',
        '2026-04-04T07:13:35.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-biology',
    title: 'Osmosis vs diffusion',
    topic: 'Cell transport',
    firstMessage: 'I mix up diffusion and osmosis in exams.',
    summary: 'We separated water movement from general particle movement and wrote one clear memory cue.',
    lastTutorFocus: 'If the question is about water across a membrane, think osmosis first.',
    learningMode: 'guided',
    revisionCount: 3,
    createdAt: '2026-04-04T06:10:00.000Z',
    updatedAt: '2026-04-04T06:45:00.000Z',
    tutorState: {
      activeTopic: 'Cell transport',
      activeSubject: 'biology',
      learnerStage: 'developing',
      recommendedMode: 'guided',
      visibleFocusLabel: 'Biology misconception fix',
      preferredSupportPatterns: ['Short comparison table', 'Quick recall question'],
    },
    messages: [
      previewMessage(
        'preview-msg-bio-1',
        'user',
        'I mix up diffusion and osmosis in exams.',
        '2026-04-04T06:12:00.000Z'
      ),
      previewMessage(
        'preview-msg-bio-2',
        'model',
        'Use this memory cue: osmosis is water only, diffusion can be many particles. Both move from higher to lower concentration.',
        '2026-04-04T06:12:25.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-video',
    title: 'Photosynthesis video recap',
    topic: 'Photosynthesis',
    firstMessage: 'Can you help me revise the photosynthesis video we watched?',
    summary: 'We turned the video into three memory anchors and one practice prompt.',
    lastTutorFocus: 'Link chlorophyll, sunlight, and glucose in one sentence.',
    learningMode: 'recap',
    revisionCount: 1,
    createdAt: '2026-04-03T18:20:00.000Z',
    updatedAt: '2026-04-03T18:42:00.000Z',
    tutorState: {
      activeTopic: 'Photosynthesis',
      activeSubject: 'biology',
      activeVideoId: 'preview-video-photosynthesis',
      activeVideoTitle: 'Photosynthesis in 4 minutes',
      activeVideoSummary: 'Short recap of light absorption, glucose, and the main inputs.',
    },
    messages: [
      previewMessage(
        'preview-msg-video-1',
        'user',
        'Can you help me revise the photosynthesis video we watched?',
        '2026-04-03T18:21:00.000Z'
      ),
      previewMessage(
        'preview-msg-video-2',
        'model',
        'Yes. Keep three anchors: chlorophyll traps light, carbon dioxide and water are inputs, and glucose stores the energy made.',
        '2026-04-03T18:21:25.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-chemistry',
    title: 'Indicators and neutralisation',
    topic: 'Acids and bases',
    firstMessage: 'I remember the colour changes slowly.',
    summary: 'We grouped the indicator colours and then replayed a short neutralisation recap.',
    lastTutorFocus: 'Use universal indicator for the range, litmus for the quick acid-or-alkali check.',
    learningMode: 'guided',
    revisionCount: 2,
    createdAt: '2026-04-03T16:10:00.000Z',
    updatedAt: '2026-04-03T16:36:00.000Z',
    tutorState: {
      activeTopic: 'Acids and bases',
      activeSubject: 'chemistry',
      learnerStage: 'developing',
      recommendedMode: 'guided',
      visibleFocusLabel: 'Chemistry quick check',
    },
    messages: [
      previewMessage(
        'preview-msg-chem-1',
        'user',
        'I remember the colour changes slowly.',
        '2026-04-03T16:12:00.000Z'
      ),
      previewMessage(
        'preview-msg-chem-2',
        'model',
        'Group them. Litmus gives the fast yes-or-no check, while universal indicator gives you the strength using the colour scale.',
        '2026-04-03T16:12:24.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-audio',
    title: 'Neutralisation audio notes',
    topic: 'Neutralisation',
    firstMessage: 'The audio recap was easier for me than reading notes.',
    summary: 'We used the spoken recap to lock in the salt-and-water pattern.',
    lastTutorFocus: 'Repeat the pattern first, then attach the correct salt name.',
    learningMode: 'audio',
    revisionCount: 1,
    createdAt: '2026-04-03T15:05:00.000Z',
    updatedAt: '2026-04-03T15:24:00.000Z',
    tutorState: {
      activeTopic: 'Neutralisation',
      activeSubject: 'chemistry',
      activeArtifactSummary: 'Audio recap for salt and water pattern recognition.',
    },
    messages: [
      previewMessage(
        'preview-msg-audio-1',
        'user',
        'The audio recap was easier for me than reading notes.',
        '2026-04-03T15:06:00.000Z'
      ),
      previewMessage(
        'preview-msg-audio-2',
        'model',
        'Great. Keep the sentence: acid plus alkali gives salt and water. Then pause and name the salt from the acid and the alkali used.',
        '2026-04-03T15:06:20.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-geography',
    title: 'Climate graph reading',
    topic: 'Climate graphs',
    firstMessage: 'I rush the graph and miss the wettest month.',
    summary: 'We slowed the reading order and added a visual checkpoint for bars versus the line.',
    lastTutorFocus: 'Read axes first, then rainfall bars, then temperature line.',
    learningMode: 'guided',
    revisionCount: 2,
    createdAt: '2026-04-03T11:40:00.000Z',
    updatedAt: '2026-04-03T12:18:00.000Z',
    tutorState: {
      activeTopic: 'Climate graphs',
      activeSubject: 'geography',
      learnerStage: 'support',
      recommendedMode: 'guided',
      visibleFocusLabel: 'Graph-reading recovery',
    },
    messages: [
      previewMessage(
        'preview-msg-geo-1',
        'user',
        'I rush the graph and miss the wettest month.',
        '2026-04-03T11:41:00.000Z'
      ),
      previewMessage(
        'preview-msg-geo-2',
        'model',
        'Use one safe order every time: check the axes, find the tallest rainfall bar, then read the highest and lowest points on the temperature line.',
        '2026-04-03T11:41:28.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-english',
    title: 'Poetry evidence writing',
    topic: 'Poetry analysis',
    firstMessage: 'My teacher says I drop quotes without explaining them.',
    summary: 'We practised embedding short quotes and naming the effect more clearly.',
    lastTutorFocus: 'Blend the quote into your sentence, then say what effect it creates.',
    learningMode: 'guided',
    revisionCount: 2,
    createdAt: '2026-04-02T17:15:00.000Z',
    updatedAt: '2026-04-02T17:48:00.000Z',
    tutorState: {
      activeTopic: 'Poetry analysis',
      activeSubject: 'english',
      learnerStage: 'developing',
      recommendedMode: 'guided',
      visibleFocusLabel: 'Writing evidence cleanly',
    },
    messages: [
      previewMessage(
        'preview-msg-eng-1',
        'user',
        'My teacher says I drop quotes without explaining them.',
        '2026-04-02T17:16:00.000Z'
      ),
      previewMessage(
        'preview-msg-eng-2',
        'model',
        'Try this frame: The poet presents hope as something that "rises quietly", which suggests calm strength even in difficulty.',
        '2026-04-02T17:16:30.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-study-skills',
    title: 'Spaced revision plan',
    topic: 'Revision habits',
    firstMessage: 'I study for a long time once, then forget.',
    summary: 'We built a shorter repeat plan and added an exam pacing checklist.',
    lastTutorFocus: 'Short, repeated retrieval is stronger than one long reread.',
    learningMode: 'planning',
    revisionCount: 2,
    createdAt: '2026-04-02T13:00:00.000Z',
    updatedAt: '2026-04-02T13:22:00.000Z',
    tutorState: {
      activeTopic: 'Revision habits',
      activeSubject: 'english',
      learnerStage: 'developing',
      recommendedMode: 'practice',
      recentGoals: ['Do two short review bursts this evening'],
    },
    messages: [
      previewMessage(
        'preview-msg-skills-1',
        'user',
        'I study for a long time once, then forget.',
        '2026-04-02T13:01:00.000Z'
      ),
      previewMessage(
        'preview-msg-skills-2',
        'model',
        'Switch to short returns. Try 15 minutes today, 10 minutes tomorrow, then a 5-minute recall on the weekend.',
        '2026-04-02T13:01:18.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-physics',
    title: 'Balanced and unbalanced forces',
    topic: 'Forces',
    firstMessage: 'I know the words but not how to explain the motion.',
    summary: 'We tied balanced forces to constant motion or rest, and unbalanced forces to a change in motion.',
    lastTutorFocus: 'Look for whether the object changes speed or direction.',
    learningMode: 'guided',
    revisionCount: 1,
    createdAt: '2026-04-01T14:25:00.000Z',
    updatedAt: '2026-04-01T14:47:00.000Z',
    tutorState: {
      activeTopic: 'Forces',
      activeSubject: 'physics',
      learnerStage: 'developing',
      recommendedMode: 'guided',
    },
    messages: [
      previewMessage(
        'preview-msg-physics-1',
        'user',
        'I know the words but not how to explain the motion.',
        '2026-04-01T14:26:00.000Z'
      ),
      previewMessage(
        'preview-msg-physics-2',
        'model',
        'Ask one question: did the motion change? If not, the forces are balanced. If speed or direction changes, the forces are unbalanced.',
        '2026-04-01T14:26:25.000Z'
      ),
    ],
  },
  {
    id: 'preview-session-fractions',
    title: 'Fractions word problems',
    topic: 'Fractions',
    firstMessage: 'I can calculate fractions, but the word problems slow me down.',
    summary: 'We highlighted the important quantity first, then translated the language into one operation.',
    lastTutorFocus: 'Underline the whole amount before you take the fraction of it.',
    learningMode: 'guided',
    revisionCount: 1,
    createdAt: '2026-03-31T09:10:00.000Z',
    updatedAt: '2026-03-31T09:34:00.000Z',
    tutorState: {
      activeTopic: 'Fractions',
      activeSubject: 'math',
      learnerStage: 'developing',
      recommendedMode: 'practice',
    },
    messages: [
      previewMessage(
        'preview-msg-frac-1',
        'user',
        'I can calculate fractions, but the word problems slow me down.',
        '2026-03-31T09:11:00.000Z'
      ),
      previewMessage(
        'preview-msg-frac-2',
        'model',
        'Start by naming the whole amount. Once you know the whole, taking one-third or three-quarters becomes a clear operation instead of a guess.',
        '2026-03-31T09:11:26.000Z'
      ),
    ],
  },
];

const previewMetacognitiveProfile: MetacognitiveProfile = {
  commonConfidencePattern: 'Starts confidently, then slows down on multi-step questions or when two similar ideas are compared.',
  recurringErrorPatterns: [
    'Negative-sign slips in equations',
    'Mixing osmosis with diffusion',
    'Rushing climate-graph interpretation',
    'Dropping quotes without explaining the effect',
    'Forgetting to name the whole amount in fraction word problems',
  ],
  preferredSupportPatterns: [
    'Worked example before independent practice',
    'Quick hint before a full breakdown',
    'Short recap audio for memory-heavy topics',
    'One follow-up practice question after the explanation',
  ],
  transferStrengths: [
    'Can explain one-step algebra aloud after support',
    'Reuses membrane ideas across biology questions',
    'Recalls exam timing strategies when prompted',
  ],
  reflectionSignals: [
    'Improves after saying the tricky step in own words',
    'More accurate when asked to re-check one specific detail',
    'Engages well with visual or spoken recap material',
  ],
  explanationReadiness: 'developing',
  selfCorrectionTrend: 'improving',
  recentSnapshot: {
    confidence: 'partly_sure',
    problemFraming: 'procedure',
    errorType: 'careless_error',
    strategyPreference: 'worked_step_helped',
    transferReadiness: 'can_reuse',
    confidenceSelfCheck: 'partly_understand',
    supportPreference: 'worked_example',
    studentReflectionNote: 'I understand faster when the first example is short and clearly labelled.',
  },
  lastReflectionSignal: {
    confidence: 'partly_understand',
    supportPreference: 'worked_example',
    topic: 'Linear equations',
    subject: 'math',
  },
  evidenceCount: 18,
  lastUpdatedAt: '2026-04-03T18:20:00.000Z',
};

function cloneMessage(message: Message): Message {
  return {
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : undefined,
    videoData: message.videoData ? { ...message.videoData } : undefined,
    image: message.image ? { ...message.image } : undefined,
    sources: Array.isArray(message.sources) ? message.sources.map((source) => ({ ...source })) : undefined,
    metadata: message.metadata ? { ...message.metadata } : undefined,
  };
}

function cloneSession(session: ChatSession): ChatSession {
  return {
    ...session,
    messages: Array.isArray(session.messages) ? session.messages.map(cloneMessage) : undefined,
    metadata: session.metadata ? { ...session.metadata } : undefined,
    tutorState: session.tutorState ? { ...session.tutorState } : undefined,
    conversationState: session.conversationState ? { ...session.conversationState } : undefined,
    student: session.student ? { ...session.student } : undefined,
  };
}

function cloneRevisionItem(item: RevisionItem): RevisionItem {
  return {
    ...item,
    tags: Array.isArray(item.tags) ? [...item.tags] : undefined,
    artifactLabels: Array.isArray(item.artifactLabels) ? [...item.artifactLabels] : undefined,
    sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs.map((source) => ({ ...source })) : undefined,
    mediaRefs: Array.isArray(item.mediaRefs) ? item.mediaRefs.map((media) => ({ ...media })) : undefined,
    reflection: item.reflection ? { ...item.reflection } : undefined,
    metadata: item.metadata ? { ...item.metadata } : undefined,
  };
}

function cloneRevisionItems(items?: RevisionItem[] | null): RevisionItem[] {
  return Array.isArray(items) ? items.map(cloneRevisionItem) : [];
}

function cloneRevisionOverview(overview: RevisionOverview): RevisionOverview {
  return {
    ...overview,
    collections: overview.collections.map((collection) => ({
      ...collection,
      previewItems: cloneRevisionItems(collection.previewItems),
      featuredItemIds: Array.isArray(collection.featuredItemIds) ? [...collection.featuredItemIds] : undefined,
      metadata: collection.metadata ? { ...collection.metadata } : undefined,
    })),
    recentItems: cloneRevisionItems(overview.recentItems),
    ungroupedItems: cloneRevisionItems(overview.ungroupedItems),
    pinnedItems: cloneRevisionItems(overview.pinnedItems),
    mistakeItems: cloneRevisionItems(overview.mistakeItems),
    needsPracticeItems: cloneRevisionItems(overview.needsPracticeItems),
    queuePreview: overview.queuePreview
      ? {
          dueNow: cloneRevisionItems(overview.queuePreview.dueNow),
          needsAttention: cloneRevisionItems(overview.queuePreview.needsAttention),
          continuePractising: cloneRevisionItems(overview.queuePreview.continuePractising),
          newItems: cloneRevisionItems(overview.queuePreview.newItems),
          recentlyImproved: cloneRevisionItems(overview.queuePreview.recentlyImproved),
        }
      : null,
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
  }
  return next;
}

function dedupeSuggestionsById(items: RevisionGroupingSuggestion[]): RevisionGroupingSuggestion[] {
  const seen = new Set<string>();
  const next: RevisionGroupingSuggestion[] = [];
  for (const item of items) {
    const key = String(item?.suggestionId || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

function dedupeStrings(values?: Array<string | null | undefined> | null): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values || []) {
    const normalized = String(value || '').trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(normalized);
  }
  return next;
}

function toMillis(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const dateValue = value instanceof Date ? value : new Date(value);
  const millis = dateValue.getTime();
  return Number.isFinite(millis) ? millis : 0;
}

function sortSessionsByUpdatedAtDesc(left: ChatSession, right: ChatSession) {
  return toMillis(right.updatedAt || right.createdAt) - toMillis(left.updatedAt || left.createdAt);
}

function sortItemsByUpdatedAtDesc(left: RevisionItem, right: RevisionItem) {
  return toMillis(right.updatedAt) - toMillis(left.updatedAt);
}

function previewSessionMatches(session: ChatSession, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return [
    session.title || '',
    session.topic || '',
    session.summary || '',
    session.firstMessage || '',
    session.lastTutorFocus || '',
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

function getPreviewHistorySessions(search = ''): ChatSession[] {
  const normalizedQuery = search.trim().toLowerCase();
  return previewHistorySessions
    .filter((session) => previewSessionMatches(session, normalizedQuery))
    .sort(sortSessionsByUpdatedAtDesc)
    .map(cloneSession);
}

function getCombinedRevisionItems(overview: RevisionOverview | null, previewOverview: RevisionOverview): RevisionItem[] {
  return dedupeById([
    ...cloneRevisionItems(overview?.recentItems),
    ...cloneRevisionItems(overview?.ungroupedItems),
    ...cloneRevisionItems(overview?.pinnedItems),
    ...cloneRevisionItems(overview?.mistakeItems),
    ...cloneRevisionItems(overview?.needsPracticeItems),
    ...cloneRevisionItems(previewOverview.recentItems),
    ...cloneRevisionItems(previewOverview.ungroupedItems),
    ...cloneRevisionItems(previewOverview.pinnedItems),
    ...cloneRevisionItems(previewOverview.mistakeItems),
    ...cloneRevisionItems(previewOverview.needsPracticeItems),
  ]).sort(sortItemsByUpdatedAtDesc);
}

export function isPreviewWorkspaceSessionId(id?: string | null): boolean {
  return Boolean(id && id.startsWith(PREVIEW_SESSION_PREFIX));
}

export function getWorkspacePreviewSession(sessionId?: string | null): ChatSession | null {
  if (!sessionId) return null;
  const session = previewHistorySessions.find((entry) => entry.id === sessionId);
  return session ? cloneSession(session) : null;
}

export function getWorkspacePreviewHistoryPage({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const safeLimit = Math.max(1, limit);
  const filteredSessions = getPreviewHistorySessions(search);
  const total = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * safeLimit;

  return {
    sessions: filteredSessions.slice(startIndex, startIndex + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

export function enrichHistorySessionsWithPreview(
  sessions: ChatSession[] | null | undefined,
  minimumCount = PREVIEW_HISTORY_MINIMUM
): ChatSession[] {
  const realSessions = Array.isArray(sessions) ? sessions.map(cloneSession) : [];
  if (realSessions.length >= minimumCount) return realSessions.sort(sortSessionsByUpdatedAtDesc);

  return dedupeById([...realSessions, ...getPreviewHistorySessions('')])
    .sort(sortSessionsByUpdatedAtDesc)
    .slice(0, Math.max(minimumCount, realSessions.length));
}

export function enrichRevisionOverviewWithPreview(
  overview: RevisionOverview | null | undefined,
  search = ''
): RevisionOverview {
  const previewOverview = getRevisionPreviewOverview(search);
  if (!overview) return cloneRevisionOverview(previewOverview);

  const collections = dedupeById([
    ...overview.collections.map((collection) => ({
      ...collection,
      previewItems: cloneRevisionItems(collection.previewItems),
      featuredItemIds: Array.isArray(collection.featuredItemIds) ? [...collection.featuredItemIds] : undefined,
      metadata: collection.metadata ? { ...collection.metadata } : undefined,
    })),
    ...previewOverview.collections.map((collection) => ({
      ...collection,
      previewItems: cloneRevisionItems(collection.previewItems),
      featuredItemIds: Array.isArray(collection.featuredItemIds) ? [...collection.featuredItemIds] : undefined,
      metadata: collection.metadata ? { ...collection.metadata } : undefined,
    })),
  ]).sort((left, right) => toMillis(right.latestItemAt || right.updatedAt) - toMillis(left.latestItemAt || left.updatedAt));

  const combinedItems = getCombinedRevisionItems(overview, previewOverview);
  const ungroupedItems = combinedItems.filter((item) => !item.collectionId);
  const pinnedItems = combinedItems.filter((item) => item.isPinned);
  const mistakeItems = combinedItems.filter((item) => item.isMistakeBased);
  const needsPracticeItems = combinedItems.filter((item) => item.needsPractice);
  const dueNowItems = combinedItems.filter((item) => item.reviewStatus === 'review_due');
  const needsAttentionItems = combinedItems.filter((item) => item.reviewStatus === 'needs_attention');
  const newItems = combinedItems.filter((item) => item.reviewStatus === 'new');
  const recentlyImprovedItems = combinedItems.filter((item) => item.recentOutcome === 'completed');

  return {
    collections,
    recentItems: combinedItems.slice(0, 12),
    ungroupedItems,
    pinnedItems: pinnedItems.slice(0, 6),
    mistakeItems: mistakeItems.slice(0, 6),
    needsPracticeItems: needsPracticeItems.slice(0, 8),
    queuePreview: {
      dueNow: dueNowItems.slice(0, 4),
      needsAttention: needsAttentionItems.slice(0, 4),
      continuePractising: needsPracticeItems.slice(0, 4),
      newItems: newItems.slice(0, 4),
      recentlyImproved: recentlyImprovedItems.slice(0, 4),
    },
    totalItems: combinedItems.length,
    totalCollections: collections.length,
    ungroupedCount: ungroupedItems.length,
    totalDueCount: dueNowItems.length,
    totalNeedsAttentionCount: needsAttentionItems.length,
    totalNewCount: newItems.length,
  };
}

export function mergeMetacognitiveProfileWithPreview(
  profile?: MetacognitiveProfile | null
): MetacognitiveProfile {
  return {
    ...previewMetacognitiveProfile,
    ...(profile || {}),
    recurringErrorPatterns: dedupeStrings([
      ...(profile?.recurringErrorPatterns || []),
      ...(previewMetacognitiveProfile.recurringErrorPatterns || []),
    ]),
    preferredSupportPatterns: dedupeStrings([
      ...(profile?.preferredSupportPatterns || []),
      ...(previewMetacognitiveProfile.preferredSupportPatterns || []),
    ]),
    transferStrengths: dedupeStrings([
      ...(profile?.transferStrengths || []),
      ...(previewMetacognitiveProfile.transferStrengths || []),
    ]),
    reflectionSignals: dedupeStrings([
      ...(profile?.reflectionSignals || []),
      ...(previewMetacognitiveProfile.reflectionSignals || []),
    ]),
    recentSnapshot: profile?.recentSnapshot
      ? { ...previewMetacognitiveProfile.recentSnapshot, ...profile.recentSnapshot }
      : previewMetacognitiveProfile.recentSnapshot,
    lastReflectionSignal: profile?.lastReflectionSignal || previewMetacognitiveProfile.lastReflectionSignal,
    evidenceCount: Math.max(
      Number(profile?.evidenceCount || 0),
      Number(previewMetacognitiveProfile.evidenceCount || 0)
    ),
  };
}

export function mergeGroupingSuggestionsWithPreview(
  suggestions?: RevisionGroupingSuggestion[] | null
): RevisionGroupingSuggestion[] {
  return dedupeSuggestionsById([
    ...((suggestions || []).map((suggestion) => ({ ...suggestion }))),
    ...getRevisionPreviewGroupingSuggestions('').map((suggestion) => ({ ...suggestion })),
  ]);
}

export function buildWorkspacePreviewPreload(
  base?: CopilotPreloadResponse | null
): CopilotPreloadResponse {
  return {
    ready: base?.ready ?? true,
    studentId: base?.studentId || PREVIEW_STUDENT_ID,
    lastSession: base?.lastSession ? cloneSession(base.lastSession) : null,
    revisionOverview: enrichRevisionOverviewWithPreview(base?.revisionOverview ?? null),
    history: enrichHistorySessionsWithPreview(base?.history || []),
  };
}
