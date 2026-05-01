'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, History, MessageSquare, NotebookPen, Plus, Settings, Maximize2 } from 'lucide-react';
import { AssistantLogo } from './copilot/AssistantLogo';
import { VoiceConcierge } from './voice-concierge';
import { FullscreenCopilotUI } from './copilot/fullscreen/FullscreenCopilotUI';
import { useVoiceController } from '../../AI/useVoiceController';
import type {
  Message,
  ChatSession,
  CopilotPreferencesResponse,
  CopilotPreloadResponse,
  ConversationState,
  CreateSessionResponse,
  GrowthActionIntent,
  GrowthActionPayload,
  GrowthActionPlan,
  FullscreenCopilotDestination,
  FullscreenGrowthSection,
  FullscreenMediaFilter,
  FullscreenModeFlags,
  FullscreenPlusAction,
  FullscreenStudyMode,
  FullscreenWorkspaceContext,
  DeleteRevisionCollectionMode,
  GuidedRevisionSessionStartResult,
  MetacognitiveProfile,
  MetacognitiveStateSnapshot,
  MessageResearchMeta,
  MediaAsset,
  MediaCollection,
  MediaInteractionAction,
  MediaPreferenceProfile,
  MediaStreamItem,
  MediaStreamResponse,
  MediaWorkspaceMode,
  PracticePadCheckStepRequest,
  PracticePadCheckStepResponse,
  RecommendedVideo,
  ResearchModeResponse,
  RevisionCollection,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionSaveType,
  RevisionMastery,
  RevisionOverview,
  RevisionSubject,
  UpdateRevisionCollectionRequest,
  UpdateRevisionItemRequest,
  StudyAtmospherePreference,
  SessionLanguageState,
  SourceCitation,
  StudentMemoryResponse,
  TutorActionRequest,
  TutorArtifact,
  TutorQuickAction,
  TutorState,
  VideoContextResponse,
  VideoData,
  VideoRecommendationResponse,
  VoiceBehaviorProfile,
  CopilotSurfaceProfile,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api, { ApiError } from '@/lib/api';
import {
  getRevisionPreviewCollectionDetail,
  getRevisionPreviewOverview,
  isPreviewRevisionEntityId,
} from '@/lib/revision-preview-data';
import {
  WORKSPACE_PREVIEW_ENABLED,
  buildWorkspacePreviewPreload,
  enrichRevisionOverviewWithPreview,
  getWorkspacePreviewHistoryPage,
  getWorkspacePreviewSession,
  isPreviewWorkspaceSessionId,
  mergeGroupingSuggestionsWithPreview,
  mergeMetacognitiveProfileWithPreview,
} from '@/lib/workspace-preview-data';
import {
  getAmbientDocumentTheme,
  normalizeCopilotThemePreference,
  observeAmbientDocumentTheme,
  resolveCopilotTheme,
  type CopilotTheme,
  type CopilotThemePreference,
} from '@/lib/copilot-theme';
import {
  buildStudyAtmosphereStyle,
  DEFAULT_STUDY_ATMOSPHERE_PREFERENCE,
  normalizeStudyAtmospherePreference,
} from '@/lib/study-atmospheres';
import {
  buildWorkspaceContextPayload,
  resolveFullscreenStudyMode,
} from '@/lib/fullscreen-workspace-context';
import { DEFAULT_WIDGET_NAVIGATION_STYLE } from '@/lib/copilot-surface';
import {
  buildCopilotNavigationSnapshot,
  createCopilotHistoryState,
  readCopilotNavigationSnapshotFromHistoryState,
  serializeCopilotNavigationSnapshot,
  type CopilotNavigationView,
} from '@/lib/copilot-navigation-history';
import {
  applyWorkspaceDestinationChange,
  applyWorkspacePlusAction,
  applyWorkspacePlusMenuOpenChange,
  resetWorkspaceForNewSession,
  resolveWorkspaceDestinationFromLegacyTab,
  type WorkspaceMachineEffect,
  type WorkspaceMachineResult,
  type WorkspaceRuntimeState,
} from '@/lib/copilot-workspace-machine';
import { PreferencesForm } from './copilot/PreferencesForm';
import { PracticePad, type PracticePadContext } from './copilot/PracticePad';
import type { MetacognitiveChoicePayload } from './copilot/MetacognitivePromptCard';
import type { ComposerSelectedContextPreview, RecentSessionFilePreview } from './chat-input-bar';
import { ChatTab } from './chat-tab';
import { HistoryTab } from './history-tab';
import { RevisionTab } from './revision-tab';
import { RevisionWorkspaceOverlay } from './revision-workspace-overlay';
import { useUserProfile } from '@/contexts/UserProfileContext';
import type { SelectionActionPayload, SelectionRangeMetadata } from './copilot/SelectionActionMenu';
import { SaveToRevisionDialog, type RevisionSaveDialogDraft } from './copilot/SaveToRevisionDialog';
import {
  buildRevisionAutoFillSuggestion,
} from '@/lib/revision-save-taxonomy';
import { resolveAssistantEnvelopeMetadata } from '@/lib/assistant-envelope';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TEXT_UPLOAD_CHARS = 18000;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_PDF_TYPES = new Set(['application/pdf']);
const SUPPORTED_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/json',
  'application/xml',
  'text/xml',
]);
const SUPPORTED_TEXT_EXTENSIONS = /\.(txt|md|csv|json|xml|ts|tsx|js|jsx|py|java|c|cpp|cs|go|rs|php|html|css|sql)$/i;
const SUPPORTED_PDF_EXTENSIONS = /\.pdf$/i;
const DRAFT_RECENT_FILE_SCOPE = '__draft__';

type SessionRecentFileEntry = {
  id: string;
  signature: string;
  name: string;
  sizeKb: number;
  mimeType: string | null;
  addedAtIso: string;
  file: File;
};

function buildFileSignature(file: Pick<File, 'name' | 'size' | 'lastModified'>): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

type UploadFilePayload =
  | { kind: 'image'; mimeType: string; base64: string; fileName: string }
  | { kind: 'text'; mimeType: string; text: string; fileName: string; truncated: boolean }
  | { kind: 'pdf'; mimeType: string; base64: string; fileName: string };

const TUTOR_ACTION_DISPLAY_TEXT: Record<TutorQuickAction, string> = {
  hint: 'Give me a hint on this.',
  breakdown: 'Break this down for me.',
  summarize: 'Summarize this for revision.',
  practice: 'Give me one practice question on this.',
  save: 'Save this to revision.',
};

const SYNTHETIC_TUTOR_ACTION_PROMPTS = new Set<string>([
  ...Object.values(TUTOR_ACTION_DISPLAY_TEXT),
  'Save this selected part to revision.',
  'Continue from Practice Pad. Ask me one short question for the next step, then wait for my attempt.',
]);

function isSyntheticTutorActionMessage(message: Message | null | undefined): boolean {
  if (!message || message.role !== 'user') return false;
  const metadata =
    message.metadata && typeof message.metadata === 'object'
      ? (message.metadata as Record<string, unknown>)
      : null;
  const tutorAction =
    metadata && typeof metadata.tutorAction === 'object'
      ? (metadata.tutorAction as Record<string, unknown>)
      : null;
  if (!tutorAction?.id) return false;
  if (metadata?.uiHidden === true) return true;
  const content = String(message.content || '').trim();
  if (!content) return true;
  if (SYNTHETIC_TUTOR_ACTION_PROMPTS.has(content)) return true;
  if (/^Help me study this:/i.test(content)) return true;
  if (/^Ask Steadfast AI for help/i.test(content)) return true;
  if (/this selected part/i.test(content)) return true;
  return false;
}

function buildHiddenTutorActionPrompt(action: TutorActionRequest, topicHint?: string): string {
  const topic = String(topicHint || '').trim();
  switch (action.id) {
    case 'hint':
      return topic ? `Give one short hint only for ${topic}.` : 'Give one short hint only.';
    case 'breakdown':
      return topic ? `Break this into short clear steps for ${topic}.` : 'Break this into short clear steps.';
    case 'summarize':
      return 'Summarize this into concise revision notes.';
    case 'practice':
      return topic ? `Give one short practice question for ${topic}.` : 'Give one short practice question.';
    case 'save':
      return 'Save this to revision.';
    case 'ask':
    default:
      return 'Continue this in study chat.';
  }
}
type ComposerContext = {
  inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
  composerIntent?: string;
  linkedArtifactId?: string;
};

type PreparedSelectionContext = {
  selectedText: string;
  sourceMessageId?: string;
  sourceKind?: TutorActionRequest['selectionSourceKind'];
  sourceArtifactLabel?: string;
  sourceArtifactSummary?: string;
  sourceVideoTitle?: string;
  sourceVideoId?: string;
  sourceText?: string;
  sourceType?: string;
  sourceDocumentId?: string;
  selectionRange?: SelectionRangeMetadata;
  linkedArtifactId?: string;
  createdAtIso: string;
};

type DevTurnLatencyDiagnostics = {
  turnId: string;
  source: 'chat' | 'tutor_action' | 'voice';
  firstTokenMs: number | null;
  fullResponseMs: number | null;
  tutorActionTurnaroundMs: number | null;
  updatedAtIso: string;
};

type InFlightChatRequest = {
  id: number;
  controller: AbortController;
  kind: 'chat' | 'tutor_action';
};

type ResearchStreamStatus = {
  phase: string;
  label: string;
  timestamp: string;
};

const REVISION_PREVIEW_ENABLED = WORKSPACE_PREVIEW_ENABLED;
const PREVIEW_MIN_HISTORY_TOTAL = 6;

function mapResearchSourcesToCitations(
  sources?: ResearchModeResponse['result']['sources']
): SourceCitation[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((source) => {
      const url = String(source?.url || '').trim();
      const sourceName = String(source?.title || source?.domain || '').trim();
      if (!url || !sourceName) return null;
      return {
        sourceName,
        url,
        domain: source.domain || null,
        sourceType: source.sourceType || null,
        trustTier: source.trustTier || null,
        relevanceReason: source.relevanceReason || null,
        recencyReason: source.recencyReason || null,
        educationalFit: source.educationalFit || null,
      } satisfies SourceCitation;
    })
    .filter(Boolean) as SourceCitation[];
}

function mapRecommendedVideoToVideoData(video?: RecommendedVideo | null): VideoData | undefined {
  if (!video?.videoId) return undefined;
  return {
    id: video.videoId,
    videoId: video.videoId,
    title: video.title,
    channelTitle: video.channelTitle || undefined,
    thumbnailUrl: video.thumbnailUrl || undefined,
    transcriptAvailable: video.transcriptAvailable ?? null,
    language: video.language || null,
    intent: video.intent || null,
    whyRecommended: video.whyRecommended || null,
    trustTier: video.trustTier || null,
  };
}

function buildResearchMessageContent(response: ResearchModeResponse): string {
  const parts = [response.result.summary];
  if (response.result.nextStepPrompt) {
    parts.push(`Next move: ${response.result.nextStepPrompt}`);
  }
  return parts.filter(Boolean).join('\n\n').trim();
}

function buildVideoRecommendationMessageContent(response: VideoRecommendationResponse): string {
  const parts = [response.summary];
  const firstReason = response.videos.find((video) => video.whyRecommended)?.whyRecommended;
  if (firstReason) {
    parts.push(`Why this first match: ${firstReason}`);
  }
  return parts.filter(Boolean).join('\n\n').trim();
}

function buildVideoContextMessageContent(response: VideoContextResponse): string {
  const parts = [response.summary || response.transcriptExcerpt || 'This video can support the current topic.'];
  if (response.whyRecommended) {
    parts.push(`Why it fits: ${response.whyRecommended}`);
  }
  if (Array.isArray(response.concepts) && response.concepts.length > 0) {
    parts.push(`Key ideas: ${response.concepts.slice(0, 4).join(', ')}`);
  }
  return parts.filter(Boolean).join('\n\n').trim();
}

const DEFAULT_CONVERSATION_STATE: ConversationState = {
  researchModeActive: false,
  researchReady: false,
  lastSearchTopic: [],
  researchQuery: undefined,
  retrievedSourceSet: [],
  sourceReuseId: undefined,
  researchSourceContext: undefined,
  inferredSchoolLevel: undefined,
  inferredLanguage: undefined,
  researchLatencyState: undefined,
  confidenceState: undefined,
  advancedOptions: null,
  awaitingPracticeQuestionInvitationResponse: false,
  activePracticeQuestion: undefined,
  awaitingPracticeQuestionAnswer: false,
  validationAttemptCount: 0,
  lastAssistantMessage: undefined,
  sensitiveContentDetected: false,
  videoSuggested: false,
  usedExamples: [],
};

const languageFrontendToBackend = {
  'English': 'english',
  'Swahili': 'swahili',
  'Swahili mix': 'english_sw',
  'Arabic': 'arabic',
  'English + Swahili Mix': 'english_sw',
  'Arabic + English': 'arabic_english',
};

const languageBackendToFrontend = {
  'english': 'English',
  'swahili': 'Swahili',
  'arabic': 'Arabic',
  'english_sw': 'English + Swahili Mix',
  'arabic_english': 'Arabic + English',
};

const DEFAULT_MEDIA_PREFERENCES: MediaPreferenceProfile = {
  preferredRecapType: 'mixed',
  shortFormSupport: 'concept_intuition',
  allowExternalCreativeSuggestions: true,
};

const normalizeMediaPreferences = (value: unknown): MediaPreferenceProfile => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const recapCandidate = String(source.preferredRecapType || '').trim().toLowerCase();
  const supportCandidate = String(source.shortFormSupport || '').trim().toLowerCase();
  return {
    preferredRecapType:
      recapCandidate === 'audio' || recapCandidate === 'video' || recapCandidate === 'visual' || recapCandidate === 'mixed'
        ? (recapCandidate as MediaPreferenceProfile['preferredRecapType'])
        : DEFAULT_MEDIA_PREFERENCES.preferredRecapType,
    shortFormSupport:
      supportCandidate === 'concept_intuition' || supportCandidate === 'worked_example' || supportCandidate === 'quick_recap'
        ? (supportCandidate as MediaPreferenceProfile['shortFormSupport'])
        : DEFAULT_MEDIA_PREFERENCES.shortFormSupport,
    allowExternalCreativeSuggestions:
      source.allowExternalCreativeSuggestions === undefined
        ? DEFAULT_MEDIA_PREFERENCES.allowExternalCreativeSuggestions
        : Boolean(source.allowExternalCreativeSuggestions),
  };
};

const normalizeLearningStyleSignals = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const entry of value) {
    const signal = String(entry || '').trim().toLowerCase();
    if (!signal || seen.has(signal)) continue;
    seen.add(signal);
    list.push(signal);
  }
  return list.slice(0, 10);
};

type CopilotView = CopilotNavigationView;
type RevisionWorkspaceScrollState = {
  libraryScrollTop: number;
  detailScrollTop: number;
};
type PendingRevisionSave = RevisionSaveDialogDraft & {
  sessionId?: string | null;
  sourceMessageId?: string | null;
  sourceKind?: 'assistant_message' | 'selected_text' | 'artifact' | 'video' | 'audio';
  tutorArtifacts?: TutorArtifact[];
  tutorState?: Partial<TutorState> | null;
  sources?: SourceCitation[] | null;
  videoData?: VideoData | null;
};

const buildSessionLanguageState = (
  preferredLanguageMode?: string,
  existing?: Partial<SessionLanguageState> | null
): SessionLanguageState => {
  const normalizedMode = String(preferredLanguageMode || existing?.preferredLanguageMode || 'english').toLowerCase();
  const baseByMode: Record<string, SessionLanguageState> = {
    english: {
      preferredResponseLanguage: 'english',
      learningSupportMode: 'strict_single_language',
      simplicityLevel: 'simple',
      voiceOutputLanguage: 'english',
      preferredLanguageMode: 'english',
    },
    swahili: {
      preferredResponseLanguage: 'swahili',
      learningSupportMode: 'strict_single_language',
      simplicityLevel: 'simple',
      voiceOutputLanguage: 'swahili',
      preferredLanguageMode: 'swahili',
    },
    arabic: {
      preferredResponseLanguage: 'arabic',
      learningSupportMode: 'strict_single_language',
      simplicityLevel: 'simple',
      voiceOutputLanguage: 'arabic',
      preferredLanguageMode: 'arabic',
    },
    english_sw: {
      preferredResponseLanguage: 'english',
      learningSupportMode: 'bilingual_support',
      simplicityLevel: 'simple',
      voiceOutputLanguage: 'english',
      bilingualSupportLanguage: 'swahili',
      preferredLanguageMode: 'english_sw',
    },
    arabic_english: {
      preferredResponseLanguage: 'arabic',
      learningSupportMode: 'bilingual_support',
      simplicityLevel: 'simple',
      voiceOutputLanguage: 'arabic',
      bilingualSupportLanguage: 'english',
      preferredLanguageMode: 'arabic_english',
    },
  };

  return {
    ...(baseByMode[normalizedMode] || baseByMode.english),
    ...(existing || {}),
    preferredLanguageMode: (existing?.preferredLanguageMode || baseByMode[normalizedMode]?.preferredLanguageMode || 'english') as SessionLanguageState['preferredLanguageMode'],
  };
};

const mergeSessionLanguageState = (
  current: SessionLanguageState | null | undefined,
  patch: Partial<SessionLanguageState> | null | undefined,
  preferredLanguageMode?: string
): SessionLanguageState => {
  const fallbackMode =
    patch?.preferredLanguageMode ||
    current?.preferredLanguageMode ||
    preferredLanguageMode ||
    'english';
  const base = buildSessionLanguageState(fallbackMode);
  return {
    ...base,
    ...(current || {}),
    ...(patch || {}),
    preferredResponseLanguage:
      patch?.preferredResponseLanguage ||
      current?.preferredResponseLanguage ||
      base.preferredResponseLanguage,
    voiceOutputLanguage:
      patch?.voiceOutputLanguage ||
      current?.voiceOutputLanguage ||
      base.voiceOutputLanguage,
    learningSupportMode:
      patch?.learningSupportMode ||
      current?.learningSupportMode ||
      base.learningSupportMode,
    simplicityLevel:
      patch?.simplicityLevel ||
      current?.simplicityLevel ||
      base.simplicityLevel,
    bilingualSupportLanguage:
      patch?.bilingualSupportLanguage ||
      current?.bilingualSupportLanguage ||
      base.bilingualSupportLanguage ||
      null,
    preferredLanguageMode:
      (patch?.preferredLanguageMode ||
        current?.preferredLanguageMode ||
        base.preferredLanguageMode) as SessionLanguageState['preferredLanguageMode'],
  };
};

const mergeMetacognitiveState = (
  current: MetacognitiveStateSnapshot | null | undefined,
  patch: Partial<MetacognitiveStateSnapshot> | null | undefined
): MetacognitiveStateSnapshot | null => {
  if (!current && !patch) return null;
  return {
    ...(current || {}),
    ...(patch || {}),
  };
};

const TITLE_FORBIDDEN = new Set([
  'new chat',
  'new study session',
  'study session',
  'untitled',
  'general discussion',
  'conversation',
  'chat session',
  'understood',
  'okay',
  'ok',
  'yes',
  'sure',
]);

const TITLE_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'of', 'to', 'for', 'in', 'on', 'at', 'by', 'with',
  'from', 'into', 'about', 'over', 'under', 'after', 'before', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'this', 'that', 'these', 'those', 'as', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'do',
  'does', 'did', 'done', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she', 'his', 'her',
  'who', 'what', 'when', 'where', 'why', 'how', 'please', 'help', 'explain', 'tell', 'learn', 'understand'
]);

const cleanTitleText = (value: string) =>
  String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractKeywordTitle = (text: string, maxWords = 5) => {
  const cleaned = cleanTitleText(text).replace(/[^A-Za-z0-9\u0600-\u06FF\s-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  const keywords = words.filter((word) => {
    const lower = word.toLowerCase();
    if (lower.length < 3) return false;
    if (TITLE_STOPWORDS.has(lower)) return false;
    return true;
  });
  const selected = (keywords.length > 0 ? keywords : words).slice(0, maxWords);
  if (selected.length === 0) return '';
  const joined = selected.join(' ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

const fallbackTitleFromSource = (text: string) => {
  const candidate = extractKeywordTitle(text) || 'Learning Topic';
  return TITLE_FORBIDDEN.has(candidate.toLowerCase()) ? 'Learning Topic' : candidate;
};

const deriveTitleFromText = (text: string) => {
  let candidate = cleanTitleText(text)
    .replace(/^title\s*:\s*/i, '')
    .split('\n')[0]
    .replace(/[.!?]+$/g, '')
    .trim();

  if (!candidate || TITLE_FORBIDDEN.has(candidate.toLowerCase())) {
    return fallbackTitleFromSource(text);
  }
  if (candidate.includes(',') || candidate.split(/\s+/).length > 7) {
    candidate = candidate.split(',')[0].trim();
  }
  candidate = candidate.replace(/\b(and|or|but|because|which|that|to|for|with|it)\b$/i, '').trim();
  if (/^(it|this|that|there|here)\b/i.test(candidate)) {
    candidate = fallbackTitleFromSource(text);
  }
  if (!candidate || TITLE_FORBIDDEN.has(candidate.toLowerCase())) {
    return fallbackTitleFromSource(text);
  }
  return candidate;
};

const isPlaceholderTitle = (title?: string | null) => {
  const raw = String(title || '').trim();
  if (!raw) return true;
  if (raw === 'New Chat' || raw === 'New Study Session' || raw === 'Study Session') return true;
  return /^study session\b/i.test(raw);
};

const normalizeTitleText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isEchoedTitle = (title: string, sourceText: string) => {
  const t = normalizeTitleText(title);
  const s = normalizeTitleText(sourceText);
  if (!t) return true;
  if (t.split(' ').length > 6) return true;
  if (!s) return false;
  if (s.startsWith(t) || t.startsWith(s)) return true;
  if (t.includes('i want') || t.includes('i need') || t.includes('help me')) return true;
  return false;
};

const buildConnectionRecoveryText = (preferredLanguage?: string, lastPrompt?: string) => {
  const lang = String(preferredLanguage || '').toLowerCase();
  const topicHint = String(lastPrompt || '').trim().split(/\s+/).slice(0, 6).join(' ');

  if (lang.includes('arab')) {
    return topicHint
      ? `Ø­Ø¯Ø« Ø§Ù†Ù‚Ø·Ø§Ø¹ Ù…Ø¤Ù‚Øª Ø£Ø«Ù†Ø§Ø¡ ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø±Ø¯ Ø¹Ù† "${topicHint}". Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ ÙˆØ³Ø£ÙƒÙ…Ù„ Ø¨Ø³Ø±Ø¹Ø©.`
      : 'Ø­Ø¯Ø« Ø§Ù†Ù‚Ø·Ø§Ø¹ Ù…Ø¤Ù‚Øª Ø£Ø«Ù†Ø§Ø¡ ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø±Ø¯. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ ÙˆØ³Ø£ÙƒÙ…Ù„ Ø¨Ø³Ø±Ø¹Ø©.';
  }

  if (lang.includes('swahili') || lang.includes('english_sw')) {
    return topicHint
      ? `Kumetokea hitilafu ya muda wakati wa kuandaa jibu la \"${topicHint}\". Jaribu tena, nitaendelea haraka.`
      : 'Kumetokea hitilafu ya muda wakati wa kuandaa jibu. Jaribu tena, nitaendelea haraka.';
  }

  return topicHint
    ? `I hit a temporary connection issue while preparing your answer on "${topicHint}". Please try again and I will continue quickly.`
    : 'I hit a temporary connection issue while preparing your answer. Please try again and I will continue quickly.';
};

type HistoryPaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PRELOAD_CACHE_KEY = 'copilot:preload';
const MEDIA_STREAM_CACHE_KEY = 'copilot:media-stream-cache:v2';
const MEDIA_COLLECTIONS_CACHE_KEY = 'copilot:media-collections-cache:v2';
const COPILOT_THEME_STORAGE_KEY = 'copilot:theme';
const COPILOT_STUDY_ATMOSPHERE_STORAGE_KEY = 'copilot:study-atmosphere';
const PRELOAD_TTL_MS = 2 * 60 * 1000;
const MEDIA_STREAM_CACHE_TTL_MS = 4 * 60 * 1000;
const MEDIA_COLLECTIONS_CACHE_TTL_MS = 8 * 60 * 1000;
const MEDIA_CACHE_MAX_ENTRIES = 8;
const COPILOT_BOOT_RETRY_DELAYS_MS = [250, 600, 1200];
const BOOTSTRAP_FAILURE_COOLDOWN_MS = 10000;
const HISTORY_PAGE_SIZE = 10;
const SIDEBAR_HISTORY_PAGE_SIZE = 12;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_IMAGE_EDGE_PX = 1600;
const TARGET_IMAGE_UPLOAD_BYTES = 1_200_000;

type MediaStreamCacheEntry = {
  ts: number;
  response?: MediaStreamResponse;
  stream?: MediaStreamItem[];
};

type MediaCollectionsCacheEntry = {
  ts: number;
  collections: MediaCollection[];
};

const normalizeMediaCacheToken = (value: unknown) => String(value ?? '').trim().toLowerCase();

const buildMediaStreamCacheKey = (args: {
  mode: MediaWorkspaceMode;
  filter: FullscreenMediaFilter;
  activeTopic?: string | null;
  weakTopics?: string[] | null;
  examMode?: boolean;
  focusMode?: boolean;
  preferredRecapType?: MediaPreferenceProfile['preferredRecapType'];
  shortFormSupport?: MediaPreferenceProfile['shortFormSupport'];
  allowExternalCreativeSuggestions?: boolean;
  level?: string | null;
  language?: string | null;
}) =>
  JSON.stringify({
    mode: args.mode,
    filter: args.filter,
    topic: normalizeMediaCacheToken(args.activeTopic),
    weak: Array.isArray(args.weakTopics)
      ? args.weakTopics.map((topic) => normalizeMediaCacheToken(topic)).filter(Boolean).slice(0, 8)
      : [],
    exam: Boolean(args.examMode),
    focus: Boolean(args.focusMode),
    recap: args.preferredRecapType || 'mixed',
    support: args.shortFormSupport || 'concept_intuition',
    external: args.allowExternalCreativeSuggestions !== false,
    level: normalizeMediaCacheToken(args.level),
    language: normalizeMediaCacheToken(args.language),
  });

const buildMediaCollectionsCacheKey = (args: {
  topic?: string | null;
  sortBy?: 'recent' | 'useful' | 'recommended';
  limit?: number;
}) =>
  JSON.stringify({
    topic: normalizeMediaCacheToken(args.topic),
    sortBy: args.sortBy || 'recommended',
    limit: Number(args.limit || 36),
  });

function trimCacheRecord<T extends { ts: number }>(record: Record<string, T>, limit = MEDIA_CACHE_MAX_ENTRIES) {
  return Object.fromEntries(
    Object.entries(record)
      .sort((a, b) => (b[1]?.ts || 0) - (a[1]?.ts || 0))
      .slice(0, limit)
  ) as Record<string, T>;
}

function mergeMediaStreamItems(existing: MediaStreamItem[], incoming: MediaStreamItem[]) {
  const merged = new Map<string, MediaStreamItem>();
  [...existing, ...incoming].forEach((item) => {
    const asset = item.asset;
    const stableKey = String(
      asset?.id ||
        asset?.videoId ||
        asset?.sourceUrl ||
        asset?.title ||
        `${item.reason}:${item.quickCheck}`
    ).trim();
    if (!stableKey) return;
    const current = merged.get(stableKey);
    if (!current) {
      merged.set(stableKey, item);
      return;
    }
      merged.set(stableKey, {
        asset: {
          ...current.asset,
          ...item.asset,
        metadata: {
          ...((current.asset?.metadata || {}) as Record<string, unknown>),
          ...((item.asset?.metadata || {}) as Record<string, unknown>),
        },
      },
      rankScore: Math.max(Number(current.rankScore || 0), Number(item.rankScore || 0)),
      reason:
        (String(item.reason || '').trim().length >= String(current.reason || '').trim().length
          ? item.reason
          : current.reason) || '',
      nextMove:
        (String(item.nextMove || '').trim().length >= String(current.nextMove || '').trim().length
          ? item.nextMove
          : current.nextMove) || '',
        quickCheck:
          (String(item.quickCheck || '').trim().length >= String(current.quickCheck || '').trim().length
            ? item.quickCheck
            : current.quickCheck) || '',
        studyGuide: item.studyGuide || current.studyGuide || null,
      });
    });
  return [...merged.values()].sort((a, b) => Number(b.rankScore || 0) - Number(a.rankScore || 0));
}

function coerceMediaStreamResponse(entry: MediaStreamCacheEntry | null | undefined): MediaStreamResponse | null {
  if (!entry) return null;
  if (entry.response && Array.isArray(entry.response.stream)) return entry.response;
  if (Array.isArray(entry.stream)) {
    return {
      stream: entry.stream,
    };
  }
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientCopilotBootstrapError = (error: unknown) =>
  error instanceof ApiError && [500, 502, 503, 504].includes(error.status);

async function withCopilotBootstrapRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= COPILOT_BOOT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientCopilotBootstrapError(error) || attempt === COPILOT_BOOT_RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(COPILOT_BOOT_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

const isSupportedUploadFile = (file: File) => {
  const mime = String(file.type || '').toLowerCase();
  if (SUPPORTED_IMAGE_TYPES.has(mime)) return true;
  if (SUPPORTED_PDF_TYPES.has(mime)) return true;
  if (SUPPORTED_TEXT_TYPES.has(mime)) return true;
  if (SUPPORTED_PDF_EXTENSIONS.test(file.name || '')) return true;
  return SUPPORTED_TEXT_EXTENSIONS.test(file.name || '');
};

const isImageUploadFile = (file: File) =>
  SUPPORTED_IMAGE_TYPES.has(String(file.type || '').toLowerCase());

const isPdfUploadFile = (file: File) => {
  const mime = String(file.type || '').toLowerCase();
  if (SUPPORTED_PDF_TYPES.has(mime)) return true;
  return SUPPORTED_PDF_EXTENSIONS.test(file.name || '');
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:')) {
        reject(new Error('Unable to read image data.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image preview.'));
    };
    image.src = objectUrl;
  });

const normalizeImageUpload = async (file: File): Promise<{ mimeType: string; base64: string }> => {
  const originalMime = String(file.type || '').toLowerCase();
  if (file.size <= TARGET_IMAGE_UPLOAD_BYTES) {
    const fallbackDataUrl = await fileToDataUrl(file);
    const fallbackBase64 = fallbackDataUrl.split(',')[1] || '';
    if (!fallbackBase64) {
      throw new Error('Image upload encoding failed.');
    }
    return {
      mimeType: originalMime || 'image/jpeg',
      base64: fallbackBase64,
    };
  }

  try {
    const image = await loadImageElement(file);
    const longestEdge = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height, 1);
    const scale = Math.min(1, MAX_IMAGE_EDGE_PX / longestEdge);
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      const fallbackDataUrl = await fileToDataUrl(file);
      const fallbackBase64 = fallbackDataUrl.split(',')[1] || '';
      return {
        mimeType: originalMime || 'image/jpeg',
        base64: fallbackBase64,
      };
    }

    context.drawImage(image, 0, 0, width, height);
    const outputMime = originalMime === 'image/webp' ? 'image/webp' : 'image/jpeg';
    let quality = 0.86;
    let optimizedDataUrl = canvas.toDataURL(outputMime, quality);
    let optimizedBase64 = optimizedDataUrl.split(',')[1] || '';

    while (optimizedBase64.length > TARGET_IMAGE_UPLOAD_BYTES * 1.45 && quality > 0.55) {
      quality -= 0.08;
      optimizedDataUrl = canvas.toDataURL(outputMime, quality);
      optimizedBase64 = optimizedDataUrl.split(',')[1] || optimizedBase64;
    }

    return {
      mimeType: outputMime,
      base64: optimizedBase64,
    };
  } catch {
    const fallbackDataUrl = await fileToDataUrl(file);
    const fallbackBase64 = fallbackDataUrl.split(',')[1] || '';
    return {
      mimeType: originalMime || 'image/jpeg',
      base64: fallbackBase64,
    };
  }
};

const buildUploadPayload = async (file: File): Promise<UploadFilePayload> => {
  const mime = String(file.type || '').toLowerCase() || 'application/octet-stream';
  const fileName = String(file.name || 'upload');

  if (isImageUploadFile(file)) {
    const normalized = await normalizeImageUpload(file);
    const base64 = normalized.base64;
    if (!base64) {
      throw new Error('Image upload encoding failed.');
    }
    return {
      kind: 'image',
      mimeType: normalized.mimeType || mime,
      base64,
      fileName,
    };
  }

  if (isPdfUploadFile(file)) {
    const dataUrl = await fileToDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    if (!base64) {
      throw new Error('PDF upload encoding failed.');
    }
    return {
      kind: 'pdf',
      mimeType: mime,
      base64,
      fileName,
    };
  }

  const rawText = await file.text();
  const cleaned = String(rawText || '').trim();
  if (!cleaned) {
    throw new Error('The selected text file appears empty.');
  }
  const truncated = cleaned.length > MAX_TEXT_UPLOAD_CHARS;
  return {
    kind: 'text',
    mimeType: mime,
    fileName,
    text: cleaned.slice(0, MAX_TEXT_UPLOAD_CHARS),
    truncated,
  };
};

const buildDurableMessageFromUploadPayloads = (
  message: Message,
  payloads: UploadFilePayload[],
  artifacts?: TutorArtifact[],
  systemNotices?: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error' }>
): Message => {
  if (!Array.isArray(payloads) || payloads.length === 0) return message;

  const nextMetadata = {
    ...((message.metadata as any) || {}),
    fileData: payloads,
    attachments: payloads.map((payload) => ({
      name: payload.fileName,
      sizeBytes:
        payload.kind === 'text'
          ? payload.text.length
          : Math.ceil((payload.base64.length * 3) / 4),
        kind: payload.kind,
      })),
      tutorArtifacts: Array.isArray(artifacts) ? artifacts : ((message.metadata as any)?.tutorArtifacts || []),
      ...(Array.isArray(systemNotices) && systemNotices.length > 0 ? { systemNotices } : {}),
  };

  const singleImage = payloads.length === 1 && payloads[0]?.kind === 'image'
    ? payloads[0]
    : null;

  return {
    ...message,
    image: singleImage
      ? {
          src: `data:${singleImage.mimeType || 'image/jpeg'};base64,${singleImage.base64}`,
          alt: singleImage.fileName || message.image?.alt || 'Uploaded study material',
        }
      : message.image,
    metadata: nextMetadata,
  };
};

export function SteadfastCopilot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<CopilotView>('chat');
  const [activeTab, setActiveTab] = useState('chat');
  const [copilotThemePreference, setCopilotThemePreference] = useState<CopilotThemePreference>('system');
  const [studyAtmospherePreference, setStudyAtmospherePreference] = useState<StudyAtmospherePreference>(
    DEFAULT_STUDY_ATMOSPHERE_PREFERENCE
  );
  const [ambientCopilotTheme, setAmbientCopilotTheme] = useState<CopilotTheme>('light');

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isNewChat, setIsNewChat] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationState>(DEFAULT_CONVERSATION_STATE);
  const [tutorState, setTutorState] = useState<TutorState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [historyPagination, setHistoryPagination] = useState<HistoryPaginationState>({
    page: 1,
    limit: HISTORY_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [sidebarHistorySessions, setSidebarHistorySessions] = useState<ChatSession[]>([]);
  const [sidebarHistoryPagination, setSidebarHistoryPagination] = useState<HistoryPaginationState>({
    page: 1,
    limit: SIDEBAR_HISTORY_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [isSidebarHistoryLoading, setIsSidebarHistoryLoading] = useState(false);
  const [isSidebarHistoryLoadingMore, setIsSidebarHistoryLoadingMore] = useState(false);
  const [sidebarHistoryError, setSidebarHistoryError] = useState('');
  const [hasSidebarHistoryHydrated, setHasSidebarHistoryHydrated] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [revisionOverview, setRevisionOverview] = useState<RevisionOverview | null>(null);
  const [revisionSearchQuery, setRevisionSearchQuery] = useState('');
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);
  const [revisionError, setRevisionError] = useState('');
  const [selectedRevisionCollection, setSelectedRevisionCollection] = useState<RevisionCollection | null>(null);
  const [selectedRevisionItemId, setSelectedRevisionItemId] = useState<string | null>(null);
  const [selectedRevisionItems, setSelectedRevisionItems] = useState<RevisionItem[]>([]);
  const [revisionWorkspaceScrollState, setRevisionWorkspaceScrollState] = useState<RevisionWorkspaceScrollState>({
    libraryScrollTop: 0,
    detailScrollTop: 0,
  });
  const [isRevisionCollectionLoading, setIsRevisionCollectionLoading] = useState(false);
  const [groupingSuggestions, setGroupingSuggestions] = useState<RevisionGroupingSuggestion[]>([]);
  const [isGroupingSuggestionsLoading, setIsGroupingSuggestionsLoading] = useState(false);
  const [pendingRevisionSave, setPendingRevisionSave] = useState<PendingRevisionSave | null>(null);
  const [isRevisionSaveDialogOpen, setIsRevisionSaveDialogOpen] = useState(false);
  const [isSavingRevisionItem, setIsSavingRevisionItem] = useState(false);
  const [fullscreenDestination, setFullscreenDestination] = useState<FullscreenCopilotDestination>('new_session');
  const [fullscreenSidebarExpanded, setFullscreenSidebarExpanded] = useState(true);
  const [fullscreenPlusDrawerOpen, setFullscreenPlusDrawerOpen] = useState(false);
  const [activeFullscreenPlusAction, setActiveFullscreenPlusAction] = useState<FullscreenPlusAction | null>(null);
  const [recentFilesModalOpen, setRecentFilesModalOpen] = useState(false);
  const [fullscreenModeFlags, setFullscreenModeFlags] = useState<FullscreenModeFlags>({
    focus: false,
    exam: false,
    research: false,
  });
  const fullscreenModeFlagsRef = useRef<FullscreenModeFlags>({
    focus: false,
    exam: false,
    research: false,
  });
  const [sessionRecentFilesByScope, setSessionRecentFilesByScope] = useState<Record<string, SessionRecentFileEntry[]>>({});
  const [selectedMediaItemId, setSelectedMediaItemId] = useState<string | null>(null);
  const [activeMediaFilter, setActiveMediaFilter] = useState<FullscreenMediaFilter>('all');
  const [activeMediaMode, setActiveMediaMode] = useState<MediaWorkspaceMode>('study_stream');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isMediaAssetsLoading, setIsMediaAssetsLoading] = useState(false);
  const [mediaAssetsError, setMediaAssetsError] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStreamItem[]>([]);
  const [mediaStreamMeta, setMediaStreamMeta] = useState<Omit<MediaStreamResponse, 'stream'> | null>(null);
  const [isMediaStreamLoading, setIsMediaStreamLoading] = useState(false);
  const [mediaStreamError, setMediaStreamError] = useState('');
  const [mediaCollections, setMediaCollections] = useState<MediaCollection[]>([]);
  const [isMediaCollectionsLoading, setIsMediaCollectionsLoading] = useState(false);
  const [mediaCollectionsError, setMediaCollectionsError] = useState('');
  const [activeGrowthSection, setActiveGrowthSection] = useState<FullscreenGrowthSection>('overview');
  const [sessionLanguageState, setSessionLanguageState] = useState<SessionLanguageState>(
    buildSessionLanguageState('english')
  );
  const [metacognitiveProfile, setMetacognitiveProfile] = useState<MetacognitiveProfile | null>(null);
  const [metacognitiveState, setMetacognitiveState] = useState<MetacognitiveStateSnapshot | null>(null);
  const [practicePadContext, setPracticePadContext] = useState<PracticePadContext | null>(null);
  const [devLatencyDiagnostics, setDevLatencyDiagnostics] = useState<DevTurnLatencyDiagnostics | null>(null);
  const inFlightChatRequestRef = useRef<InFlightChatRequest | null>(null);
  const chatRequestIdRef = useRef(0);
  const silentlyCanceledRequestIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fullscreenModeFlagsRef.current = fullscreenModeFlags;
  }, [fullscreenModeFlags]);

  const [studentMemory, setStudentMemory] = useState<StudentMemoryResponse>({ progress: [], mistakes: [] });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [researchStreamStatus, setResearchStreamStatus] = useState<ResearchStreamStatus | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [widgetSurfaceProfile, setWidgetSurfaceProfile] = useState<CopilotSurfaceProfile>('comfortable');
  const isCopilotVisible = isOpen || isFullscreen;
  const [isRevisionWorkspaceOpen, setIsRevisionWorkspaceOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [composerContext, setComposerContext] = useState<ComposerContext | undefined>(undefined);
  const [preparedSelectionContext, setPreparedSelectionContext] = useState<PreparedSelectionContext | null>(null);
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recentFileScopeKey = activeSession?.id || DRAFT_RECENT_FILE_SCOPE;
  const attachedFileSignatures = useMemo(
    () => new Set(selectedFiles.map((file) => buildFileSignature(file))),
    [selectedFiles]
  );
  const recentSessionFiles = useMemo<RecentSessionFilePreview[]>(
    () =>
      (sessionRecentFilesByScope[recentFileScopeKey] || []).map((entry) => ({
        id: entry.id,
        name: entry.name,
        sizeKb: entry.sizeKb,
        mimeType: entry.mimeType,
        addedAt: new Date(entry.addedAtIso).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        isAttached: attachedFileSignatures.has(entry.signature),
      })),
    [attachedFileSignatures, recentFileScopeKey, sessionRecentFilesByScope]
  );
  const selectedComposerContextPreview = useMemo<ComposerSelectedContextPreview | null>(() => {
    if (!preparedSelectionContext) return null;
    return {
      text: preparedSelectionContext.selectedText,
      sourceLabel:
        preparedSelectionContext.sourceArtifactLabel ||
        preparedSelectionContext.sourceVideoTitle ||
        null,
      sourceKind: preparedSelectionContext.sourceKind || null,
    };
  }, [preparedSelectionContext]);
  const composerPlaceholderOverride = preparedSelectionContext ? 'Ask about this selection...' : undefined;
  const clearPreparedSelectionContext = useCallback(() => {
    setPreparedSelectionContext(null);
  }, []);
  const appendRecentFilesForScope = useCallback((scopeKey: string, files: File[]) => {
    if (!files.length) return;
    const nowIso = new Date().toISOString();
    setSessionRecentFilesByScope((prev) => {
      const existing = prev[scopeKey] || [];
      const next = [...existing];
      for (const file of files) {
        const signature = buildFileSignature(file);
        const nextEntry: SessionRecentFileEntry = {
          id: signature,
          signature,
          name: file.name,
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          mimeType: file.type || null,
          addedAtIso: nowIso,
          file,
        };
        const existingIndex = next.findIndex((entry) => entry.id === nextEntry.id);
        if (existingIndex >= 0) {
          next.splice(existingIndex, 1);
        }
        next.unshift(nextEntry);
      }
      return { ...prev, [scopeKey]: next.slice(0, 30) };
    });
  }, []);

  const [hasInitialized, setHasInitialized] = useState(false);
  const userTabOverrideRef = useRef(false);
  const isApplyingBrowserNavRef = useRef(false);
  const browserNavReleaseTimerRef = useRef<number | null>(null);
  const browserNavInitializedRef = useRef(false);
  const browserNavSnapshotKeyRef = useRef('');
  const preloadCacheRef = useRef<{ ts: number; data: any } | null>(null);
  const preloadInFlightRef = useRef<Promise<any> | null>(null);
  const historyRequestIdRef = useRef(0);
  const sidebarHistoryRequestIdRef = useRef(0);
  const revisionRequestIdRef = useRef(0);
  const groupingSuggestionsRequestIdRef = useRef(0);
  const mediaAssetsRequestIdRef = useRef(0);
  const mediaStreamRequestIdRef = useRef(0);
  const mediaCollectionsRequestIdRef = useRef(0);
  const mediaCachesHydratedRef = useRef(false);
  const mediaStreamCacheRef = useRef<Record<string, MediaStreamCacheEntry>>({});
  const mediaCollectionsCacheRef = useRef<Record<string, MediaCollectionsCacheEntry>>({});

  const hydrateMediaCaches = useCallback(() => {
    if (mediaCachesHydratedRef.current || typeof window === 'undefined') return;
    mediaCachesHydratedRef.current = true;
    try {
      const rawStreamCache = sessionStorage.getItem(MEDIA_STREAM_CACHE_KEY);
      if (rawStreamCache) {
        const parsed = JSON.parse(rawStreamCache) as Record<string, MediaStreamCacheEntry>;
        if (parsed && typeof parsed === 'object') {
          mediaStreamCacheRef.current = trimCacheRecord(
            Object.fromEntries(
              Object.entries(parsed).filter(
                ([, value]) =>
                  value &&
                  typeof value === 'object' &&
                  Number.isFinite(Number((value as MediaStreamCacheEntry).ts)) &&
                  Boolean(coerceMediaStreamResponse(value as MediaStreamCacheEntry))
              )
            ) as Record<string, MediaStreamCacheEntry>
          );
        }
      }
    } catch {
      mediaStreamCacheRef.current = {};
    }
    try {
      const rawCollectionsCache = sessionStorage.getItem(MEDIA_COLLECTIONS_CACHE_KEY);
      if (rawCollectionsCache) {
        const parsed = JSON.parse(rawCollectionsCache) as Record<string, MediaCollectionsCacheEntry>;
        if (parsed && typeof parsed === 'object') {
          mediaCollectionsCacheRef.current = trimCacheRecord(
            Object.fromEntries(
              Object.entries(parsed).filter(
                ([, value]) =>
                  value &&
                  typeof value === 'object' &&
                  Number.isFinite(Number((value as MediaCollectionsCacheEntry).ts)) &&
                  Array.isArray((value as MediaCollectionsCacheEntry).collections)
              )
            ) as Record<string, MediaCollectionsCacheEntry>
          );
        }
      }
    } catch {
      mediaCollectionsCacheRef.current = {};
    }
  }, []);

  const persistMediaStreamCache = useCallback((key: string, response: MediaStreamResponse) => {
    mediaStreamCacheRef.current = trimCacheRecord({
      ...mediaStreamCacheRef.current,
      [key]: {
        ts: Date.now(),
        response,
      },
    });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(MEDIA_STREAM_CACHE_KEY, JSON.stringify(mediaStreamCacheRef.current));
      } catch {
        // ignore storage failures
      }
    }
  }, []);

  const persistMediaCollectionsCache = useCallback((key: string, collections: MediaCollection[]) => {
    mediaCollectionsCacheRef.current = trimCacheRecord({
      ...mediaCollectionsCacheRef.current,
      [key]: {
        ts: Date.now(),
        collections,
      },
    });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(MEDIA_COLLECTIONS_CACHE_KEY, JSON.stringify(mediaCollectionsCacheRef.current));
      } catch {
        // ignore storage failures
      }
    }
  }, []);
  const clearMediaCollectionsCache = useCallback(() => {
    mediaCollectionsCacheRef.current = {};
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(MEDIA_COLLECTIONS_CACHE_KEY);
      } catch {
        // ignore storage failures
      }
    }
  }, []);
  const bootstrapFailureRef = useRef<Map<string, number>>(new Map());
  const initialLoadPromiseRef = useRef<Promise<void> | null>(null);
  const historyRef = useRef<ChatSession[]>([]);
  const revisionOverviewRef = useRef<RevisionOverview | null>(null);
  const activeSessionRef = useRef<ChatSession | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const composerContextRef = useRef<ComposerContext | undefined>(undefined);
  const preparedSelectionContextRef = useRef<PreparedSelectionContext | null>(null);

  const { profile, setProfile, updateProfile } = useUserProfile();

  const researchModeRequested = fullscreenModeFlags.research === true;
  const fullscreenStudyMode: FullscreenStudyMode = resolveFullscreenStudyMode(fullscreenModeFlags);

  const [forceWebSearch, setForceWebSearch] = useState(false);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [level, setLevel] = useState<'Primary' | 'LowerSecondary' | 'UpperSecondary'>('Primary');
  const [languageHint, setLanguageHint] = useState<'English' | 'Swahili mix'>('English');
  const handleForceWebSearchChange = useCallback((value: boolean) => {
    setForceWebSearch(value);
    if (!value) {
      setResearchStreamStatus(null);
    }
    const nextModeFlags: FullscreenModeFlags = {
      ...fullscreenModeFlagsRef.current,
      research: value,
    };
    fullscreenModeFlagsRef.current = nextModeFlags;
    setFullscreenModeFlags(nextModeFlags);
  }, []);
  const activeWorkspaceDestination = useMemo<FullscreenCopilotDestination>(
    () => (isCopilotVisible ? fullscreenDestination : resolveWorkspaceDestinationFromLegacyTab(activeTab)),
    [activeTab, fullscreenDestination, isCopilotVisible]
  );
  const browserNavigationSnapshot = useMemo(
    () =>
      buildCopilotNavigationSnapshot({
        isOpen,
        isFullscreen,
        view,
        activeTab,
        destination: fullscreenDestination,
        revisionOverlayOpen: isRevisionWorkspaceOpen,
      }),
    [activeTab, fullscreenDestination, isFullscreen, isOpen, isRevisionWorkspaceOpen, view]
  );
  const applyBrowserNavigationSnapshot = useCallback((snapshot: ReturnType<typeof buildCopilotNavigationSnapshot>) => {
    userTabOverrideRef.current = true;
    setIsFullscreen(snapshot.isFullscreen);
    setIsOpen(snapshot.isOpen);
    setView(snapshot.view);
    setActiveTab(snapshot.activeTab);
    setFullscreenDestination(snapshot.destination);
    setIsRevisionWorkspaceOpen(snapshot.revisionOverlayOpen);
  }, []);
  const copilotTheme = useMemo(
    () => resolveCopilotTheme(copilotThemePreference, ambientCopilotTheme),
    [copilotThemePreference, ambientCopilotTheme]
  );
  const isCopilotDarkMode = copilotTheme === 'dark';
  const copilotThemeScopeClass = `copilot-theme-scope${isCopilotDarkMode ? ' copilot-theme-dark' : ''}`;
  const copilotThemeStyle = useMemo(
    () =>
      buildStudyAtmosphereStyle({
        atmosphere: studyAtmospherePreference,
        colorMode: copilotTheme,
        studyMode: isCopilotVisible ? fullscreenStudyMode : 'standard',
        modeFlags: isCopilotVisible
          ? {
              focus: fullscreenModeFlags.focus,
              exam: fullscreenModeFlags.exam,
            }
          : { focus: false, exam: false },
      }),
    [
      copilotTheme,
      fullscreenModeFlags.exam,
      fullscreenModeFlags.focus,
      fullscreenStudyMode,
      isCopilotVisible,
      studyAtmospherePreference,
    ]
  );

  // --- Voice Overlay Management ---
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const voiceOverlayOpenedAtRef = useRef<number | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const pendingVoiceReplyRef = useRef(false);
  type VoiceTurnRuntimeMetrics = {
    sttMs?: number;
    sttFirstTokenMs?: number;
    ttsStartMs?: number;
    ttsFirstByteMs?: number;
    languageMode?: string;
    ttsRetryCount?: number;
    ttsResumeCount?: number;
    ttsCutoffCount?: number;
    ttsResumeReasons?: string[];
  };
  const voiceLatencyByTurnRef = useRef<Map<string, VoiceTurnRuntimeMetrics>>(new Map());

  const persistTurnLatency = useCallback(async (payload: Record<string, unknown>) => {
    try {
      await api.latency.recordTurn(payload);
    } catch {
      // no-op: latency persistence must never block student UX
    }
  }, []);

  const resolvePreferredLanguageMode = useCallback(
    () =>
      (languageFrontendToBackend as any)[profile?.preferredLanguage || 'English'] ||
      (languageFrontendToBackend as any)[languageHint] ||
      sessionLanguageState.preferredLanguageMode ||
      'english',
    [languageHint, profile?.preferredLanguage, sessionLanguageState.preferredLanguageMode]
  );

  const syncTutorDerivedState = useCallback(
    (nextTutorState?: TutorState | null) => {
      const safeTutorState = nextTutorState || {};
      setTutorState(safeTutorState);

      if (safeTutorState.sessionLanguageState) {
        setSessionLanguageState((prev) =>
          mergeSessionLanguageState(prev, safeTutorState.sessionLanguageState, resolvePreferredLanguageMode())
        );
      }

      if (safeTutorState.metacognitiveState) {
        const mergedSnapshot = mergeMetacognitiveState(
          metacognitiveProfile?.recentSnapshot || metacognitiveState,
          safeTutorState.metacognitiveState
        );
        setMetacognitiveState(mergedSnapshot);
        setMetacognitiveProfile((prev) => ({
          ...(prev || {}),
          recentSnapshot: mergedSnapshot,
          preferredSupportPatterns:
            safeTutorState.preferredSupportPatterns ||
            prev?.preferredSupportPatterns ||
            null,
        }));
      } else if (safeTutorState.preferredSupportPatterns) {
        setMetacognitiveProfile((prev) => ({
          ...(prev || {}),
          preferredSupportPatterns: safeTutorState.preferredSupportPatterns,
          recentSnapshot: prev?.recentSnapshot || metacognitiveState,
        }));
      }
    },
    [metacognitiveProfile?.recentSnapshot, metacognitiveState, resolvePreferredLanguageMode]
  );

  const activeVoiceBehaviorProfile = useMemo<VoiceBehaviorProfile>(() => {
    if (isCopilotVisible) {
      if (fullscreenModeFlags.exam) return 'exam_voice';
      if (fullscreenModeFlags.focus) return 'focus_voice';
      if (activeWorkspaceDestination === 'revision') return 'revision_voice';
      if (activeWorkspaceDestination === 'media') return 'reading_voice';
    }
    if (activeTab === 'revision' || isRevisionWorkspaceOpen) {
      return 'revision_voice';
    }
    return 'tutor_voice';
  }, [
    activeTab,
    activeWorkspaceDestination,
    fullscreenModeFlags.exam,
    fullscreenModeFlags.focus,
    isCopilotVisible,
    isRevisionWorkspaceOpen,
  ]);

  const voiceController = useVoiceController({
    sessionId: activeSession?.id,
    preferredLanguage: (languageFrontendToBackend as any)[profile?.preferredLanguage || 'English'] || 'english',
    sessionLanguageState,
    voiceBehaviorProfile: activeVoiceBehaviorProfile,
    onTranscript: (transcript, meta) => {
      pendingVoiceReplyRef.current = true;
      const preferredLanguageBackend =
        (languageFrontendToBackend as any)[profile?.preferredLanguage || 'English'] ||
        (languageFrontendToBackend as any)[languageHint] ||
        'english';
      if (meta?.detectedInputLanguage || meta?.preferredResponseLanguage) {
        setSessionLanguageState((prev) =>
          mergeSessionLanguageState(
            prev,
            {
              ...(meta?.detectedInputLanguage
                ? { lastDetectedInputLanguage: meta.detectedInputLanguage }
                : {}),
              ...(meta?.preferredResponseLanguage
                ? { preferredResponseLanguage: meta.preferredResponseLanguage }
                : {}),
            },
            preferredLanguageBackend
          )
        );
      }
      if (meta?.turnId) {
        voiceLatencyByTurnRef.current.set(meta.turnId, {
          sttMs: meta.sttLatencyMs,
          languageMode: preferredLanguageBackend,
          ttsRetryCount: 0,
          ttsResumeCount: 0,
          ttsCutoffCount: 0,
          ttsResumeReasons: [],
        });
      }
      handleSendMessage(null, transcript, {
        fromVoice: true,
        turnId: meta?.turnId,
      });
    },
    onTelemetry: (event) => {
      if (!event.turnId) return;
      const preferredLanguageBackend =
        (languageFrontendToBackend as any)[profile?.preferredLanguage || 'English'] ||
        (languageFrontendToBackend as any)[languageHint] ||
        'english';
      const existing = voiceLatencyByTurnRef.current.get(event.turnId) || {};
      const merged = {
        ...existing,
        languageMode: existing.languageMode || preferredLanguageBackend,
      };

      if (event.type === 'stt_ready') {
        merged.sttMs = event.latencyMs;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'stt_first_token') {
        merged.sttFirstTokenMs = event.latencyMs;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'tts_start') {
        merged.ttsStartMs = event.latencyMs;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'tts_first_audio_byte') {
        merged.ttsFirstByteMs = event.latencyMs;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'tts_retry') {
        merged.ttsRetryCount = Number(merged.ttsRetryCount || 0) + 1;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'tts_resume') {
        merged.ttsResumeCount = Number(merged.ttsResumeCount || 0) + 1;
        const nextReasons = Array.isArray(merged.ttsResumeReasons) ? merged.ttsResumeReasons.slice(0, 5) : [];
        if (event.reason) {
          nextReasons.push(String(event.reason));
        }
        merged.ttsResumeReasons = nextReasons.slice(-5);
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }

      if (event.type === 'tts_cutoff') {
        merged.ttsCutoffCount = Number(merged.ttsCutoffCount || 0) + 1;
        voiceLatencyByTurnRef.current.set(event.turnId, merged);
        return;
      }
    }
  });

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    revisionOverviewRef.current = revisionOverview;
  }, [revisionOverview]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    composerContextRef.current = composerContext;
  }, [composerContext]);

  useEffect(() => {
    preparedSelectionContextRef.current = preparedSelectionContext;
  }, [preparedSelectionContext]);

  const onVoiceModeStart = useCallback(() => {
    voiceController.discard();
    voiceOverlayOpenedAtRef.current = Date.now();
    void api.quality.recordLearningEffectEvent({
      eventType: 'voice_mode_started',
      sessionId: activeSessionRef.current?.id || null,
      metadata: {
        voiceProfile: activeVoiceBehaviorProfile,
        destination: activeWorkspaceDestination,
        source: 'voice_overlay',
      },
    }).catch(() => undefined);
    setIsVoiceOverlayOpen(true);
  }, [activeVoiceBehaviorProfile, activeWorkspaceDestination, voiceController]);

  const handleVoiceModeClose = useCallback(() => {
    const openedAt = voiceOverlayOpenedAtRef.current;
    const durationMs = openedAt ? Math.max(0, Date.now() - openedAt) : null;
    void api.quality.recordLearningEffectEvent({
      eventType: 'voice_mode_ended',
      sessionId: activeSessionRef.current?.id || null,
      metadata: {
        voiceProfile: activeVoiceBehaviorProfile,
        durationMs,
        finalControllerState: voiceController.state,
        interruptionState: voiceController.interruptionState,
      },
    }).catch(() => undefined);
    voiceOverlayOpenedAtRef.current = null;
    setIsVoiceOverlayOpen(false);
  }, [activeVoiceBehaviorProfile, voiceController.interruptionState, voiceController.state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAmbientCopilotTheme(getAmbientDocumentTheme());
    const raw = window.localStorage.getItem(COPILOT_THEME_STORAGE_KEY);
    setCopilotThemePreference(normalizeCopilotThemePreference(raw));
    const rawAtmosphere = window.localStorage.getItem(COPILOT_STUDY_ATMOSPHERE_STORAGE_KEY);
    if (rawAtmosphere) {
      try {
        const parsed = JSON.parse(rawAtmosphere);
        setStudyAtmospherePreference(normalizeStudyAtmospherePreference(parsed));
      } catch {
        setStudyAtmospherePreference(DEFAULT_STUDY_ATMOSPHERE_PREFERENCE);
      }
    }
    return observeAmbientDocumentTheme(setAmbientCopilotTheme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COPILOT_THEME_STORAGE_KEY, copilotThemePreference);
  }, [copilotThemePreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      COPILOT_STUDY_ATMOSPHERE_STORAGE_KEY,
      JSON.stringify(studyAtmospherePreference)
    );
  }, [studyAtmospherePreference]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }, []);

  const shouldSkipBootstrapCall = useCallback((key: string) => {
    const lastFailureAt = bootstrapFailureRef.current.get(key);
    return Boolean(lastFailureAt && Date.now() - lastFailureAt < BOOTSTRAP_FAILURE_COOLDOWN_MS);
  }, []);

  const markBootstrapFailure = useCallback((key: string) => {
    bootstrapFailureRef.current.set(key, Date.now());
  }, []);

  const clearBootstrapFailure = useCallback((key: string) => {
    bootstrapFailureRef.current.delete(key);
  }, []);

  const fetchMemory = useCallback(async () => {
    if (shouldSkipBootstrapCall('memory')) return;
    try {
      const data = await withCopilotBootstrapRetry(() => api.memory.getStudent());
      if (data) {
        setStudentMemory({ progress: data.progress || [], mistakes: data.mistakes || [] });
      }
      clearBootstrapFailure('memory');
    } catch (error) {
      markBootstrapFailure('memory');
      console.warn('[Copilot] Failed to fetch student memory:', error);
    }
  }, [clearBootstrapFailure, markBootstrapFailure, shouldSkipBootstrapCall]);

  const fetchProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const preferencesData = await withCopilotBootstrapRetry<CopilotPreferencesResponse>(() => api.preferences.get());
      const frontendPreferredLanguage = (languageBackendToFrontend as any)[preferencesData.preferredLanguage] || 'English';
      if (preferencesData.copilotThemePreference) {
        setCopilotThemePreference(normalizeCopilotThemePreference(preferencesData.copilotThemePreference));
      }
      if (preferencesData.studyAtmosphere) {
        setStudyAtmospherePreference(normalizeStudyAtmospherePreference(preferencesData.studyAtmosphere));
      }
      setSessionLanguageState(
        mergeSessionLanguageState(
          sessionLanguageState,
          preferencesData.sessionLanguageState || null,
          preferencesData.preferredLanguage
        )
      );

      setProfile({
        preferredLanguage: frontendPreferredLanguage,
        interests: preferencesData.interests || [],
        name: profile?.name || 'Student',
        gradeLevel: profile?.gradeLevel || 'Primary',
        favoriteShows: profile?.favoriteShows || [],
        lastUpdatedAt: preferencesData.lastUpdatedAt || null,
        mediaPreferences: normalizeMediaPreferences(preferencesData.mediaPreferences),
        learningStyleSignals: normalizeLearningStyleSignals(preferencesData.learningStyleSignals),
      });
      return preferencesData;
    } catch (error: any) {
      console.warn('[Copilot] fetchProfile failed (likely 500 from backend). Using defaults.', error);
      // Fallback to defaults so UI doesn't crash
      const defaultPrefs = {
        preferredLanguage: 'English',
        interests: [],
        favoriteShows: [],
        lastUpdatedAt: null,
        sessionLanguageState: buildSessionLanguageState('english'),
        copilotThemePreference,
        studyAtmosphere: studyAtmospherePreference,
        mediaPreferences: DEFAULT_MEDIA_PREFERENCES,
        learningStyleSignals: [],
      };
      setSessionLanguageState(defaultPrefs.sessionLanguageState);
      setProfile({
        ...defaultPrefs,
        name: profile?.name || 'Student',
        gradeLevel: profile?.gradeLevel || 'Primary',
      });
      return defaultPrefs;
    } finally {
      setIsProfileLoading(false);
    }
  }, [copilotThemePreference, profile, sessionLanguageState, setProfile, studyAtmospherePreference]);

  const fetchMetacognitionProfile = useCallback(async () => {
    try {
      const profileData = await withCopilotBootstrapRetry(() => api.metacognition.getProfile());
      const effectiveProfile = WORKSPACE_PREVIEW_ENABLED
        ? mergeMetacognitiveProfileWithPreview(profileData)
        : profileData;
      setMetacognitiveProfile(effectiveProfile);
      setMetacognitiveState(effectiveProfile?.recentSnapshot || null);
      return effectiveProfile;
    } catch (error) {
      console.warn('[Copilot] Failed to load metacognition profile:', error);
      if (WORKSPACE_PREVIEW_ENABLED) {
        const previewProfile = mergeMetacognitiveProfileWithPreview(null);
        setMetacognitiveProfile(previewProfile);
        setMetacognitiveState(previewProfile.recentSnapshot || null);
        return previewProfile;
      }
      return null;
    }
  }, []);

  const upsertHistoryEntry = useCallback((entry: any) => {
    if (!entry?.id) return;
    const normalizedTitle = String(entry.title || entry.topic || '').trim();
    if (!normalizedTitle || isPlaceholderTitle(normalizedTitle)) return;
    setHistory(prev => {
      const exists = prev.find(session => session.id === entry.id);
      if (exists) {
        return prev.map(session => session.id === entry.id ? { ...session, ...entry, title: normalizedTitle } : session);
      }
      return [{ ...entry, title: normalizedTitle }, ...prev];
    });
    setSidebarHistorySessions((prev) => {
      const currentIndex = prev.findIndex((session) => session.id === entry.id);
      const normalizedEntry = { ...entry, title: normalizedTitle } as ChatSession;
      if (currentIndex >= 0) {
        const next = prev.slice();
        const existing = next[currentIndex];
        next.splice(currentIndex, 1);
        return [{ ...existing, ...normalizedEntry }, ...next];
      }
      return [normalizedEntry, ...prev];
    });
  }, []);

  const normalizeHistorySessions = useCallback((sessions: any[]) => {
    return (Array.isArray(sessions) ? sessions : []).filter((session: any) => {
      const title = String(session?.title || session?.topic || '').trim();
      return title && !isPlaceholderTitle(title);
    });
  }, []);

  const mergeSidebarHistorySessions = useCallback((current: ChatSession[], incoming: ChatSession[]) => {
    if (!incoming.length) return current;
    const next = current.slice();
    const existingIds = new Set(current.map((session) => session.id));
    for (const session of incoming) {
      if (!session?.id || existingIds.has(session.id)) continue;
      next.push(session);
      existingIds.add(session.id);
    }
    return next;
  }, []);

  const loadSidebarHistoryPage = useCallback(
    async (page: number, options?: { append?: boolean }) => {
      const append = Boolean(options?.append);
      const requestId = sidebarHistoryRequestIdRef.current + 1;
      sidebarHistoryRequestIdRef.current = requestId;
      if (append) {
        setIsSidebarHistoryLoadingMore(true);
      } else {
        setIsSidebarHistoryLoading(true);
      }

      try {
        const data = await api.history.list({
          page: Math.max(1, page),
          limit: SIDEBAR_HISTORY_PAGE_SIZE,
        });
        if (sidebarHistoryRequestIdRef.current !== requestId) return;
        const incomingSessions = normalizeHistorySessions(data?.sessions || []);
        const incomingTotal = Number(data?.pagination?.total || incomingSessions.length);

        if (WORKSPACE_PREVIEW_ENABLED && incomingTotal < PREVIEW_MIN_HISTORY_TOTAL) {
          const previewPage = getWorkspacePreviewHistoryPage({
            page: Math.max(1, page),
            limit: SIDEBAR_HISTORY_PAGE_SIZE,
          });
          setSidebarHistorySessions(previewPage.sessions);
          setSidebarHistoryPagination(previewPage.pagination);
          setSidebarHistoryError('');
          setHasSidebarHistoryHydrated(true);
          return;
        }

        setSidebarHistorySessions((prev) =>
          append ? mergeSidebarHistorySessions(prev, incomingSessions) : incomingSessions
        );
        setSidebarHistoryPagination({
          page: Number(data?.pagination?.page || page || 1),
          limit: Number(data?.pagination?.limit || SIDEBAR_HISTORY_PAGE_SIZE),
          total: Number(data?.pagination?.total || incomingSessions.length),
          totalPages: Number(data?.pagination?.totalPages || 1),
        });
        setSidebarHistoryError('');
        setHasSidebarHistoryHydrated(true);
      } catch (error) {
        if (sidebarHistoryRequestIdRef.current !== requestId) return;
        if (WORKSPACE_PREVIEW_ENABLED) {
          const previewPage = getWorkspacePreviewHistoryPage({
            page: Math.max(1, page),
            limit: SIDEBAR_HISTORY_PAGE_SIZE,
          });
          setSidebarHistorySessions(previewPage.sessions);
          setSidebarHistoryPagination(previewPage.pagination);
          setSidebarHistoryError('');
          setHasSidebarHistoryHydrated(true);
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not load recent study sessions.';
        setSidebarHistoryError(message);
      } finally {
        if (sidebarHistoryRequestIdRef.current === requestId) {
          if (append) {
            setIsSidebarHistoryLoadingMore(false);
          } else {
            setIsSidebarHistoryLoading(false);
          }
        }
      }
    },
    [mergeSidebarHistorySessions, normalizeHistorySessions]
  );

  const hasSidebarHistoryMore = useMemo(
    () => sidebarHistoryPagination.page < Math.max(1, sidebarHistoryPagination.totalPages),
    [sidebarHistoryPagination.page, sidebarHistoryPagination.totalPages]
  );

  const handleSidebarHistoryLoadMore = useCallback(() => {
    if (!hasSidebarHistoryHydrated) return;
    if (isSidebarHistoryLoading || isSidebarHistoryLoadingMore) return;
    if (!hasSidebarHistoryMore) return;
    const nextPage = Math.max(1, sidebarHistoryPagination.page) + 1;
    void loadSidebarHistoryPage(nextPage, { append: true });
  }, [
    hasSidebarHistoryHydrated,
    hasSidebarHistoryMore,
    isSidebarHistoryLoading,
    isSidebarHistoryLoadingMore,
    loadSidebarHistoryPage,
    sidebarHistoryPagination.page,
  ]);

  const handleSidebarHistoryRefresh = useCallback(() => {
    void loadSidebarHistoryPage(1);
  }, [loadSidebarHistoryPage]);

  const refreshHistory = useCallback(async (page = 1, search = '') => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    setIsHistoryLoading(true);
    setHistoryError('');

    try {
      const data = await api.history.list({
        page: Math.max(1, page),
        limit: HISTORY_PAGE_SIZE,
        search: search.trim() || undefined,
      });
      if (historyRequestIdRef.current !== requestId) return;

      const normalizedSessions = normalizeHistorySessions(data?.sessions || []);
      const totalItems = Number(data?.pagination?.total || normalizedSessions.length);

      if (WORKSPACE_PREVIEW_ENABLED && totalItems < PREVIEW_MIN_HISTORY_TOTAL) {
        const previewPage = getWorkspacePreviewHistoryPage({
          page: Math.max(1, page),
          limit: HISTORY_PAGE_SIZE,
          search,
        });
        setHistory(previewPage.sessions);
        setHistoryPagination(previewPage.pagination);
        if (!search.trim() && previewPage.pagination.page === 1) {
          const sidebarPreviewPage = getWorkspacePreviewHistoryPage({
            page: 1,
            limit: SIDEBAR_HISTORY_PAGE_SIZE,
          });
          setSidebarHistorySessions(sidebarPreviewPage.sessions);
          setSidebarHistoryPagination(sidebarPreviewPage.pagination);
          setSidebarHistoryError('');
          setHasSidebarHistoryHydrated(true);
        }
        return;
      }

      setHistory(normalizedSessions);
      setHistoryPagination({
        page: Number(data?.pagination?.page || page || 1),
        limit: Number(data?.pagination?.limit || HISTORY_PAGE_SIZE),
        total: totalItems,
        totalPages: Number(data?.pagination?.totalPages || 0),
      });
      if (!search.trim() && Number(data?.pagination?.page || page || 1) === 1) {
        setSidebarHistorySessions(normalizedSessions);
        setSidebarHistoryPagination({
          page: Number(data?.pagination?.page || 1),
          limit: Number(data?.pagination?.limit || SIDEBAR_HISTORY_PAGE_SIZE),
          total: Number(data?.pagination?.total || normalizedSessions.length),
          totalPages: Number(data?.pagination?.totalPages || 1),
        });
        setSidebarHistoryError('');
        setHasSidebarHistoryHydrated(true);
      }
    } catch (e) {
      if (historyRequestIdRef.current !== requestId) return;
      if (WORKSPACE_PREVIEW_ENABLED) {
        const previewPage = getWorkspacePreviewHistoryPage({
          page: Math.max(1, page),
          limit: HISTORY_PAGE_SIZE,
          search,
        });
        setHistory(previewPage.sessions);
        setHistoryPagination(previewPage.pagination);
        if (!search.trim() && previewPage.pagination.page === 1) {
          const sidebarPreviewPage = getWorkspacePreviewHistoryPage({
            page: 1,
            limit: SIDEBAR_HISTORY_PAGE_SIZE,
          });
          setSidebarHistorySessions(sidebarPreviewPage.sessions);
          setSidebarHistoryPagination(sidebarPreviewPage.pagination);
          setSidebarHistoryError('');
          setHasSidebarHistoryHydrated(true);
        }
        setHistoryError('');
        return;
      }
      if (e instanceof ApiError && e.status >= 500) {
        setHistory([]);
        setHistoryPagination({
          page: Number(page || 1),
          limit: HISTORY_PAGE_SIZE,
          total: 0,
          totalPages: 1,
        });
        setHistoryError('');
        return;
      }
      console.warn('History refresh failed', e);
      setHistoryError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : 'Could not load chat history right now.'
      );
    } finally {
      if (historyRequestIdRef.current === requestId) {
        setIsHistoryLoading(false);
      }
    }
  }, [normalizeHistorySessions]);

  const refreshRevision = useCallback(async (search = '') => {
    const requestId = revisionRequestIdRef.current + 1;
    revisionRequestIdRef.current = requestId;
    setIsRevisionLoading(true);
    setRevisionError('');

    try {
      const data = await api.revision.getOverview({
        search: search.trim() || undefined,
        limit: 12,
      });
      if (revisionRequestIdRef.current !== requestId) return;
      const effectiveOverview = WORKSPACE_PREVIEW_ENABLED
        ? enrichRevisionOverviewWithPreview(data, search)
        : data;
      setRevisionOverview(effectiveOverview);

      if (selectedRevisionCollection) {
        const updatedCollection =
          effectiveOverview.collections.find((collection) => collection.id === selectedRevisionCollection.id) ||
          selectedRevisionCollection;
        setSelectedRevisionCollection(updatedCollection);
      }
    } catch (error) {
      if (revisionRequestIdRef.current !== requestId) return;
      console.warn('Revision refresh failed', error);
      if (REVISION_PREVIEW_ENABLED) {
        setRevisionOverview(getRevisionPreviewOverview(search));
        if (!isPreviewRevisionEntityId(selectedRevisionCollection?.id)) {
          setSelectedRevisionCollection(null);
          setSelectedRevisionItems([]);
          setSelectedRevisionItemId(null);
        }
        setRevisionError('');
        return;
      }
      setRevisionError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
            : 'Could not load revision right now.'
      );
    } finally {
      if (revisionRequestIdRef.current === requestId) {
        setIsRevisionLoading(false);
      }
    }
  }, [selectedRevisionCollection]);

  const loadRevisionCollection = useCallback(async (
    collection: RevisionCollection | null,
    search = ''
  ) => {
    setSelectedRevisionCollection(collection);
    setSelectedRevisionItems([]);
    setRevisionError('');

    if (!collection) {
      setIsRevisionCollectionLoading(false);
      return;
    }

    if (isPreviewRevisionEntityId(collection.id)) {
      const previewDetail = getRevisionPreviewCollectionDetail(collection.id, search);
      if (previewDetail) {
        setSelectedRevisionCollection(previewDetail.collection);
        setSelectedRevisionItems(previewDetail.items);
        setRevisionError('');
      }
      setIsRevisionCollectionLoading(false);
      return;
    }

    setIsRevisionCollectionLoading(true);
    try {
      const data = await api.revision.getCollection(collection.id, {
        search: search.trim() || undefined,
      });
      setSelectedRevisionCollection(data.collection);
      setSelectedRevisionItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.warn('Revision collection load failed', error);
      if (REVISION_PREVIEW_ENABLED) {
        const previewDetail = getRevisionPreviewCollectionDetail(collection.id, search);
        if (previewDetail) {
          setSelectedRevisionCollection(previewDetail.collection);
          setSelectedRevisionItems(previewDetail.items);
          setRevisionError('');
          return;
        }
      }
      setRevisionError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not load this revision list right now.'
      );
    } finally {
      setIsRevisionCollectionLoading(false);
    }
  }, []);

  const refreshGroupingSuggestions = useCallback(async () => {
    const requestId = groupingSuggestionsRequestIdRef.current + 1;
    groupingSuggestionsRequestIdRef.current = requestId;
    setIsGroupingSuggestionsLoading(true);

    try {
      const data = await api.revision.getGroupingSuggestions();
      if (groupingSuggestionsRequestIdRef.current !== requestId) return;
      setGroupingSuggestions(
        WORKSPACE_PREVIEW_ENABLED
          ? mergeGroupingSuggestionsWithPreview(Array.isArray(data?.suggestions) ? data.suggestions : [])
          : Array.isArray(data?.suggestions)
            ? data.suggestions
            : []
      );
    } catch (error) {
      if (groupingSuggestionsRequestIdRef.current !== requestId) return;
      console.warn('Revision grouping suggestions failed', error);
      setGroupingSuggestions(
        WORKSPACE_PREVIEW_ENABLED ? mergeGroupingSuggestionsWithPreview([]) : []
      );
    } finally {
      if (groupingSuggestionsRequestIdRef.current === requestId) {
        setIsGroupingSuggestionsLoading(false);
      }
    }
  }, []);

  const syncRevisionPanelState = useCallback(async () => {
    await refreshRevision(revisionSearchQuery);
    if (selectedRevisionCollection) {
      await loadRevisionCollection(selectedRevisionCollection, revisionSearchQuery);
    }
    await refreshGroupingSuggestions();
  }, [
    loadRevisionCollection,
    refreshGroupingSuggestions,
    refreshRevision,
    revisionSearchQuery,
    selectedRevisionCollection,
  ]);

  const handleRetryRevisionLoad = useCallback(async () => {
    await refreshRevision(revisionSearchQuery);

    if (selectedRevisionCollection) {
      await loadRevisionCollection(selectedRevisionCollection, revisionSearchQuery);
      return;
    }

    if (!revisionSearchQuery.trim()) {
      await refreshGroupingSuggestions();
    }
  }, [
    loadRevisionCollection,
    refreshGroupingSuggestions,
    refreshRevision,
    revisionSearchQuery,
    selectedRevisionCollection,
  ]);

  const refreshMediaAssets = useCallback(
    async (options?: { silent?: boolean }) => {
      const requestId = mediaAssetsRequestIdRef.current + 1;
      mediaAssetsRequestIdRef.current = requestId;

      if (!options?.silent || mediaAssets.length === 0) {
        setIsMediaAssetsLoading(true);
      }
      setMediaAssetsError('');

      try {
        const data = await api.media.listAssets({ limit: 120 });
        if (mediaAssetsRequestIdRef.current !== requestId) return;
        setMediaAssets(Array.isArray(data?.assets) ? data.assets : []);
      } catch (error) {
        if (mediaAssetsRequestIdRef.current !== requestId) return;
        console.warn('Media asset refresh failed', error);
        setMediaAssetsError(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not load media assets right now.'
        );
      } finally {
        if (mediaAssetsRequestIdRef.current === requestId) {
          setIsMediaAssetsLoading(false);
        }
      }
    },
    [mediaAssets.length]
  );

  const handleRetryMediaAssetsLoad = useCallback(async () => {
    await refreshMediaAssets({ silent: false });
  }, [refreshMediaAssets]);

  const upsertMediaAssetAcrossWorkspace = useCallback((asset: MediaAsset) => {
    setMediaAssets((prev) => {
      const index = prev.findIndex((entry) => entry.id === asset.id);
      if (index < 0) return [asset, ...prev];
      const next = [...prev];
      next[index] = asset;
      return next;
    });
    setMediaStream((prev) =>
      prev.map((entry) => (entry.asset.id === asset.id ? { ...entry, asset } : entry))
    );
    setMediaCollections((prev) =>
      prev.map((collection) => ({
        ...collection,
        items: collection.items.map((entry) => (entry.id === asset.id ? asset : entry)),
      }))
    );
  }, []);

  const refreshMediaStream = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      const requestId = mediaStreamRequestIdRef.current + 1;
      mediaStreamRequestIdRef.current = requestId;
      hydrateMediaCaches();

      const normalizedMediaPreferences = normalizeMediaPreferences(profile?.mediaPreferences);
      const cacheKey = buildMediaStreamCacheKey({
        mode: activeMediaMode,
        filter: activeMediaFilter,
        activeTopic: tutorState.activeTopic || undefined,
        weakTopics: metacognitiveProfile?.recurringErrorPatterns || undefined,
        examMode: fullscreenModeFlags.exam,
        focusMode: fullscreenModeFlags.focus,
        preferredRecapType: normalizedMediaPreferences.preferredRecapType,
        shortFormSupport: normalizedMediaPreferences.shortFormSupport,
        allowExternalCreativeSuggestions: normalizedMediaPreferences.allowExternalCreativeSuggestions,
        level: String(profile?.gradeLevel || level || '').trim() || undefined,
        language: sessionLanguageState.preferredResponseLanguage || undefined,
      });
      const cachedEntry = options?.force ? null : mediaStreamCacheRef.current[cacheKey] || null;
      const cacheAgeMs = cachedEntry ? Date.now() - cachedEntry.ts : Number.POSITIVE_INFINITY;
      const cachedResponse = coerceMediaStreamResponse(cachedEntry);
      const cachedStream = cachedResponse?.stream || [];

      if (!options?.silent || mediaStream.length === 0) {
        setIsMediaStreamLoading(true);
      }
      setMediaStreamError('');
      if (!cachedResponse) {
        setMediaStreamMeta(null);
      }

      if (cachedStream.length > 0) {
        setMediaStream((prev) =>
          activeMediaMode === 'creative_stream' ? mergeMediaStreamItems(prev, cachedStream) : cachedStream
        );
        if (cachedResponse) {
          const { stream: _cachedStream, ...cachedMeta } = cachedResponse;
          setMediaStreamMeta(cachedMeta);
        } else {
          setMediaStreamMeta(null);
        }
        if (cacheAgeMs < MEDIA_STREAM_CACHE_TTL_MS) {
          if (mediaStreamRequestIdRef.current === requestId) {
            setIsMediaStreamLoading(false);
          }
          return;
        }
      }

      try {
        const data = await api.media.listStream({
          limit: activeMediaMode === 'creative_stream' ? 144 : 60,
          sessionId: activeSession?.id || undefined,
          activeTopic: tutorState.activeTopic || undefined,
          weakTopics: metacognitiveProfile?.recurringErrorPatterns || undefined,
          examMode: fullscreenModeFlags.exam,
          focusMode: fullscreenModeFlags.focus,
          preferredKind: activeMediaFilter !== 'all' ? (activeMediaFilter as any) : undefined,
          streamMode: activeMediaMode === 'creative_stream' ? 'creative' : 'study',
          preferredRecapType: normalizedMediaPreferences.preferredRecapType,
          shortFormSupport: normalizedMediaPreferences.shortFormSupport,
          allowExternalCreativeSuggestions: normalizedMediaPreferences.allowExternalCreativeSuggestions,
          learningNeed: normalizedMediaPreferences.shortFormSupport,
          schoolLevel: String(profile?.gradeLevel || level || '').trim() || undefined,
          language: sessionLanguageState.preferredResponseLanguage || undefined,
          sortBy: 'recommended',
        });
        if (mediaStreamRequestIdRef.current !== requestId) return;
        const fetchedStream = Array.isArray(data?.stream) ? data.stream : [];
        const resolvedStream =
          activeMediaMode === 'creative_stream'
            ? mergeMediaStreamItems(cachedStream, fetchedStream)
            : fetchedStream;
        const response: MediaStreamResponse = {
          ...data,
          stream: resolvedStream,
        };
        setMediaStream(resolvedStream);
        const { stream: _responseStream, ...responseMeta } = response;
        setMediaStreamMeta(responseMeta);
        persistMediaStreamCache(cacheKey, response);
      } catch (error) {
        if (mediaStreamRequestIdRef.current !== requestId) return;
        console.warn('Media stream refresh failed', error);
        setMediaStreamError(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : activeMediaMode === 'creative_stream'
                ? 'Could not load creative stream right now.'
                : 'Could not load study stream right now.'
        );
      } finally {
        if (mediaStreamRequestIdRef.current === requestId) {
          setIsMediaStreamLoading(false);
        }
      }
    },
    [
      activeMediaFilter,
      activeMediaMode,
      activeSession?.id,
      fullscreenModeFlags.exam,
      fullscreenModeFlags.focus,
      hydrateMediaCaches,
      level,
      mediaStream.length,
      metacognitiveProfile?.recurringErrorPatterns,
      persistMediaStreamCache,
      profile?.gradeLevel,
      profile?.mediaPreferences,
      sessionLanguageState.preferredResponseLanguage,
      tutorState.activeTopic,
    ]
  );

  const refreshMediaCollections = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      const requestId = mediaCollectionsRequestIdRef.current + 1;
      mediaCollectionsRequestIdRef.current = requestId;
      hydrateMediaCaches();

      const cacheKey = buildMediaCollectionsCacheKey({
        topic: tutorState.activeTopic || undefined,
        sortBy: 'recommended',
        limit: 36,
      });
      const cachedEntry = options?.force ? null : mediaCollectionsCacheRef.current[cacheKey] || null;
      const cacheAgeMs = cachedEntry ? Date.now() - cachedEntry.ts : Number.POSITIVE_INFINITY;

      if (!options?.silent || mediaCollections.length === 0) {
        setIsMediaCollectionsLoading(true);
      }
      setMediaCollectionsError('');

      if (cachedEntry?.collections?.length) {
        setMediaCollections(cachedEntry.collections);
        if (cacheAgeMs < MEDIA_COLLECTIONS_CACHE_TTL_MS) {
          if (mediaCollectionsRequestIdRef.current === requestId) {
            setIsMediaCollectionsLoading(false);
          }
          return;
        }
      }

      try {
        const data = await api.media.listCollections({
          limit: 36,
          sortBy: 'recommended',
        });
        if (mediaCollectionsRequestIdRef.current !== requestId) return;
        const resolvedCollections = Array.isArray(data?.collections) ? data.collections : [];
        setMediaCollections(resolvedCollections);
        persistMediaCollectionsCache(cacheKey, resolvedCollections);
      } catch (error) {
        if (mediaCollectionsRequestIdRef.current !== requestId) return;
        console.warn('Media collections refresh failed', error);
        setMediaCollectionsError(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not load media collections right now.'
        );
      } finally {
        if (mediaCollectionsRequestIdRef.current === requestId) {
          setIsMediaCollectionsLoading(false);
        }
      }
    },
    [hydrateMediaCaches, mediaCollections.length, persistMediaCollectionsCache, tutorState.activeTopic]
  );

  const handleRetryMediaStreamLoad = useCallback(async () => {
    await refreshMediaStream({ silent: false, force: true });
  }, [refreshMediaStream]);

  const handleRetryMediaCollectionsLoad = useCallback(async () => {
    await refreshMediaCollections({ silent: false, force: true });
  }, [refreshMediaCollections]);

  const handleCreateMediaCollection = useCallback(
    async (payload: {
      title: string;
      description?: string;
      subject?: string;
      topic?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const title = String(payload.title || '').trim();
      if (!title) return;
      try {
        const seedAssetId =
          payload.metadata && typeof payload.metadata.seedAssetId === 'string'
            ? payload.metadata.seedAssetId.trim()
            : '';
        const data = await api.media.createCollection({
          ...payload,
          title,
        });
        if (data?.collection) {
          setMediaCollections((prev) => [data.collection, ...prev.filter((entry) => entry.id !== data.collection.id)]);
          if (seedAssetId) {
            await api.media.addAssetToCollection(data.collection.id, seedAssetId).catch(() => undefined);
          }
        }
        clearMediaCollectionsCache();
        await refreshMediaCollections({ silent: false, force: true });
      } catch (error) {
        console.warn('Media collection creation failed', error);
      }
    },
    [clearMediaCollectionsCache, refreshMediaCollections]
  );

  const handleAddAssetToMediaCollection = useCallback(
    async (collectionId: string, assetId: string) => {
      if (!collectionId || !assetId) return;
      try {
        const data = await api.media.addAssetToCollection(collectionId, assetId);
        if (data?.asset) {
          upsertMediaAssetAcrossWorkspace(data.asset);
        }
        clearMediaCollectionsCache();
        await refreshMediaCollections({ silent: true, force: true });
      } catch (error) {
        console.warn('Adding media asset to collection failed', error);
      }
    },
    [clearMediaCollectionsCache, refreshMediaCollections, upsertMediaAssetAcrossWorkspace]
  );

  const handleRemoveAssetFromMediaCollection = useCallback(
    async (collectionId: string, assetId: string) => {
      if (!collectionId || !assetId) return;
      try {
        const data = await api.media.removeAssetFromCollection(collectionId, assetId);
        if (data?.asset) {
          upsertMediaAssetAcrossWorkspace(data.asset);
        }
        clearMediaCollectionsCache();
        await refreshMediaCollections({ silent: true, force: true });
      } catch (error) {
        console.warn('Removing media asset from collection failed', error);
      }
    },
    [clearMediaCollectionsCache, refreshMediaCollections, upsertMediaAssetAcrossWorkspace]
  );

  const handleRecordMediaInteraction = useCallback(
    async (assetId: string, action: MediaInteractionAction, revisionItemId?: string | null) => {
      if (!assetId) return;
      try {
        const data = await api.media.recordInteraction(assetId, {
          action,
          revisionItemId: revisionItemId || null,
        });
        if (data?.asset) {
          upsertMediaAssetAcrossWorkspace(data.asset);
        }
      } catch (error) {
        console.warn('Media interaction failed', error);
      }
    },
    [upsertMediaAssetAcrossWorkspace]
  );

  const resolveGrowthActionPlan = useCallback(
    async (intent: GrowthActionIntent, payload?: GrowthActionPayload): Promise<GrowthActionPlan | null> => {
      try {
        const response = await api.growth.resolveAction({
          intent,
          sessionId: activeSessionRef.current?.id || null,
          topic: payload?.topic || null,
          subject: payload?.subject || null,
          title: payload?.title || null,
          itemId: payload?.itemId || null,
        });
        return response?.actionPlan || null;
      } catch (error) {
        console.warn('[Copilot] Growth action resolve failed, using local fallback:', error);
        return null;
      }
    },
    []
  );

  const showRevisionPreviewToast = useCallback(
    (actionLabel: string) => {
      toast({
        title: 'Preview item',
        description: `${actionLabel} is available when this item is saved from a real study session.`,
      });
    },
    [toast]
  );


  const readPreloadCache = useCallback(() => {
    if (preloadCacheRef.current) return preloadCacheRef.current;
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(PRELOAD_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts || !parsed?.data) return null;
      preloadCacheRef.current = parsed;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const writePreloadCache = useCallback((data: any) => {
    if (!data) return;
    const entry = { ts: Date.now(), data };
    preloadCacheRef.current = entry;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(PRELOAD_CACHE_KEY, JSON.stringify(entry));
      } catch {
        // ignore storage failures
      }
    }
  }, []);

  const applyPreloadData = useCallback((
    data: any,
    allowTabReset: boolean,
    options?: { hydrateLastSession?: boolean }
  ) => {
    if (!data) return false;
    const effectiveData = WORKSPACE_PREVIEW_ENABLED ? buildWorkspacePreviewPreload(data) : data;
    const hydrateLastSession = Boolean(options?.hydrateLastSession);

    if (effectiveData.history) {
      setHistory(normalizeHistorySessions(effectiveData.history));
    }
    if (effectiveData.revisionOverview) {
      setRevisionOverview(effectiveData.revisionOverview);
    }

    if (effectiveData.lastSession) {
      const rawTitle = (effectiveData.lastSession.topic || effectiveData.lastSession.title || '').trim();
      const safeTitle = isPlaceholderTitle(rawTitle) ? '' : rawTitle;

      upsertHistoryEntry({
        id: effectiveData.lastSession.id,
        title: safeTitle || effectiveData.lastSession.topic || effectiveData.lastSession.title || '',
        createdAt: effectiveData.lastSession.createdAt,
        updatedAt: effectiveData.lastSession.updatedAt,
        firstMessage: effectiveData.lastSession.messages?.[0]?.content || null,
      });

      if (!hydrateLastSession) {
        return false;
      }

      const messagesWithParsedDates = (effectiveData.lastSession.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        videoData: m.videoData || undefined
      }));

      setMessages(messagesWithParsedDates);
      setActiveSession({
        ...effectiveData.lastSession,
        title: safeTitle,
        topic: safeTitle || effectiveData.lastSession.topic,
      });
      setConversationState(effectiveData.lastSession.conversationState || DEFAULT_CONVERSATION_STATE);
      syncTutorDerivedState(effectiveData.lastSession.tutorState || {});
      setIsNewChat(false);
      if (allowTabReset && !userTabOverrideRef.current) {
        setActiveTab('chat');
      }

      return true;
    }

    return false;
  }, [normalizeHistorySessions, syncTutorDerivedState, upsertHistoryEntry]);

  const preloadCopilotData = useCallback(async (allowCache = true) => {
    const cached = allowCache ? readPreloadCache() : null;
    if (cached && Date.now() - cached.ts < PRELOAD_TTL_MS) {
      return cached.data;
    }
    if (shouldSkipBootstrapCall('preload')) {
      return cached?.data || null;
    }
    if (preloadInFlightRef.current) return preloadInFlightRef.current;

    const promise = withCopilotBootstrapRetry<CopilotPreloadResponse>(() => api.sessions.preload())
      .then((data) => {
        const effectiveData = WORKSPACE_PREVIEW_ENABLED ? buildWorkspacePreviewPreload(data) : data;
        writePreloadCache(effectiveData);
        clearBootstrapFailure('preload');
        return effectiveData;
      })
      .catch((error) => {
        markBootstrapFailure('preload');
        throw error;
      })
      .finally(() => {
        preloadInFlightRef.current = null;
      });

    preloadInFlightRef.current = promise;
    return promise;
  }, [clearBootstrapFailure, markBootstrapFailure, readPreloadCache, shouldSkipBootstrapCall, writePreloadCache]);

  const updatePreloadCache = useCallback((
    lastSession: any,
    historyOverride?: ChatSession[],
    revisionOverviewOverride?: RevisionOverview | null
  ) => {
    if (!lastSession) return;
    const safeHistory = historyOverride || historyRef.current;
    writePreloadCache({
      lastSession,
      revisionOverview: revisionOverviewOverride ?? revisionOverviewRef.current,
      history: safeHistory
        .filter((s) => {
          const title = String(s.title || s.topic || '').trim();
          return title && !isPlaceholderTitle(title);
        })
        .map((s) => ({
          id: s.id,
          title: s.title || s.topic || '',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          firstMessage: s.messages?.[0]?.content || null
        })),
    });
  }, [writePreloadCache]);

  const normalizeSessionMessages = useCallback(
    (sessionMessages: Message[] | undefined | null) =>
      Array.isArray(sessionMessages)
        ? sessionMessages
            .map((message: any) => ({
              ...message,
              timestamp: message?.timestamp ? new Date(message.timestamp) : new Date(),
              videoData: message?.videoData || undefined,
            }))
            .filter((message: Message) => !isSyntheticTutorActionMessage(message))
        : [],
    []
  );

  const applyLoadedSession = useCallback((
    sessionData: ChatSession,
    options?: {
      historySeed?: ChatSession | null;
      showToast?: boolean;
      toastTitle?: string;
      toastDescription?: string;
    }
  ) => {
    const sessionMessages = normalizeSessionMessages(sessionData.messages);
    const sessionTitle = (sessionData.title || sessionData.topic || options?.historySeed?.title || '').trim();
    const historySeed = options?.historySeed || null;
    const historyNext = historyRef.current.some((entry) => entry.id === sessionData.id)
      ? historyRef.current.map((entry) =>
          entry.id === sessionData.id
            ? { ...entry, title: sessionTitle || entry.title, updatedAt: sessionData.updatedAt }
            : entry
        )
      : [
          {
            ...(historySeed || sessionData),
            title: sessionTitle || historySeed?.title || sessionData.title || sessionData.topic || '',
            updatedAt: sessionData.updatedAt,
          },
          ...historyRef.current,
        ];

    setMessages(sessionMessages);
    setActiveSession({ ...sessionData, title: sessionTitle || sessionData.title || sessionData.topic || '' });
    setConversationState(sessionData.conversationState || DEFAULT_CONVERSATION_STATE);
    syncTutorDerivedState(sessionData.tutorState || {});
    setIsNewChat(false);
    setInput('');
    setSelectedFiles([]);
    setPreparedSelectionContext(null);
    setPracticePadContext(null);
    setView('chat');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('chat');
    setHasInitialized(true);
    void fetchMemory();

    updatePreloadCache(
      {
        ...sessionData,
        title: sessionTitle || sessionData.title || sessionData.topic || '',
        messages: sessionMessages.map((message: any) => ({
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
          videoData: message.videoData || null,
        })),
      },
      historyNext
    );

    if (options?.showToast) {
      toast({
        title: options.toastTitle || 'Session loaded',
        description: options.toastDescription,
      });
    }
  }, [fetchMemory, normalizeSessionMessages, syncTutorDerivedState, toast, updatePreloadCache]);

  const recordLearningEffectSignal = useCallback((payload: {
    eventType: string;
    outcome?: string | null;
    messageId?: string | null;
    revisionItemId?: string | null;
    subject?: string | null;
    topic?: string | null;
    metadata?: Record<string, unknown> | null;
  }) => {
    void api.quality.recordLearningEffectEvent({
      eventType: payload.eventType,
      sessionId: activeSessionRef.current?.id || null,
      messageId: payload.messageId || null,
      revisionItemId: payload.revisionItemId || null,
      subject: payload.subject || null,
      topic:
        payload.topic ||
        tutorState.activeTopic ||
        conversationState.lastStudyTopic ||
        activeSessionRef.current?.title ||
        null,
      outcome: payload.outcome || null,
      metadata: payload.metadata || null,
    }).catch((error) => {
      console.warn('[Copilot] Failed to record learning-effect signal:', error);
    });
  }, [conversationState.lastStudyTopic, tutorState.activeTopic]);

  const closeRevisionSaveDialog = useCallback(() => {
    setIsRevisionSaveDialogOpen(false);
    setPendingRevisionSave(null);
  }, []);

  const beginRevisionSaveFlow = useCallback((args: {
    message?: Message | null;
    selectedText?: string | null;
    sourceKind?: 'assistant_message' | 'selected_text' | 'artifact' | 'video' | 'audio';
  }) => {
    const message = args.message || null;
    const messagePresentation = resolveAssistantEnvelopeMetadata((message?.metadata as any) || null).presentation;
    const sourceArtifacts = Array.isArray((message?.metadata as any)?.tutorArtifacts)
      ? ((message?.metadata as any)?.tutorArtifacts as TutorArtifact[])
      : [];
    const sourceText =
      String(args.selectedText || message?.content || '').replace(/\s+/g, ' ').trim();

    if (!sourceText) {
      toast({
        title: 'Could not save this yet',
        description: 'There was no clear study note to save from this message.',
        variant: 'destructive',
      });
      return;
    }

    const topicHint =
      String(
        messagePresentation?.topicMastery?.topic ||
          messagePresentation?.weakTopicRecovery?.topic ||
          tutorState.activeTopic ||
          conversationState.lastStudyTopic ||
          activeSessionRef.current?.title ||
          ''
      ).trim() || null;
    const autoFill = buildRevisionAutoFillSuggestion({
      message,
      selectedText: args.selectedText,
      tutorState,
      tutorArtifacts: sourceArtifacts,
      topic: topicHint,
      subject: sourceArtifacts[0]?.subject || tutorState.activeSubject || null,
    });

    setPendingRevisionSave({
      sessionId: activeSessionRef.current?.id || null,
      sourceMessageId: message?.id || null,
      sourceKind: args.sourceKind || 'assistant_message',
      sourceText,
      selectedText: args.selectedText || null,
      topic: topicHint,
      subject: autoFill.subject,
      saveType: autoFill.saveType,
      autoFill,
      tutorArtifacts: sourceArtifacts,
      tutorState,
      sources: Array.isArray(message?.sources) ? message.sources : [],
      videoData: message?.videoData || null,
    });
    setIsRevisionSaveDialogOpen(true);
  }, [conversationState.lastStudyTopic, toast, tutorState]);

  const handleConfirmRevisionSave = useCallback(async (selection: {
    subject: RevisionSubject;
    saveType: RevisionSaveType;
  }) => {
    if (!pendingRevisionSave) return;

    if (pendingRevisionSave.sourceMessageId && isPreviewRevisionEntityId(pendingRevisionSave.sourceMessageId)) {
      showRevisionPreviewToast('Saving to Revision');
      closeRevisionSaveDialog();
      return;
    }

    setIsSavingRevisionItem(true);
    try {
      const response = await api.revision.save({
        sessionId: pendingRevisionSave.sessionId || undefined,
        sourceMessageId: pendingRevisionSave.sourceMessageId || undefined,
        selectedText: pendingRevisionSave.selectedText || undefined,
        sourceKind: pendingRevisionSave.sourceKind,
        content: pendingRevisionSave.sourceText,
        topic: pendingRevisionSave.topic || undefined,
        subject: selection.subject,
        saveType: selection.saveType,
        tutorState: pendingRevisionSave.tutorState || null,
        tutorArtifacts: pendingRevisionSave.tutorArtifacts || null,
        sources: pendingRevisionSave.sources || null,
        videoData: pendingRevisionSave.videoData || null,
      });

      await syncRevisionPanelState();
      setSelectedRevisionItemId(response.item.id);

      recordLearningEffectSignal({
        eventType: 'revision_saved',
        messageId: pendingRevisionSave.sourceMessageId || null,
        revisionItemId: response.item.id,
        subject: String(response.item.subject || selection.subject),
        topic: response.item.topic || pendingRevisionSave.topic || null,
        metadata: {
          saveType: response.item.saveType || selection.saveType,
          mediaType: response.item.mediaType || null,
          sourceType: response.item.sourceType || null,
          collectionId: response.collection?.id || null,
        },
      });

      const researchBackedSave =
        selection.saveType === 'research_note' ||
        response.item.saveType === 'research_note' ||
        (Array.isArray(pendingRevisionSave.sources) && pendingRevisionSave.sources.length > 0);
      if (researchBackedSave) {
        recordLearningEffectSignal({
          eventType: 'save_to_revision_from_research',
          messageId: pendingRevisionSave.sourceMessageId || null,
          revisionItemId: response.item.id,
          subject: String(response.item.subject || selection.subject),
          topic: response.item.topic || pendingRevisionSave.topic || null,
          metadata: {
            saveType: response.item.saveType || selection.saveType,
            sourceCount: Array.isArray(pendingRevisionSave.sources) ? pendingRevisionSave.sources.length : 0,
          },
        });
      }

      toast({
        title: 'Saved to Revision',
        description: response.collection?.title
          ? `Added to ${response.collection.title}.`
          : 'You can revisit it later from Revision.',
      });
      closeRevisionSaveDialog();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not save this to Revision right now.';
      toast({
        title: 'Could not save to Revision',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingRevisionItem(false);
    }
  }, [closeRevisionSaveDialog, pendingRevisionSave, recordLearningEffectSignal, showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleNewChat = useCallback(async (showToast = true) => {
    if (shouldSkipBootstrapCall('new-session')) {
      if (showToast) {
        toast({ title: "Error", description: "Copilot setup is temporarily unavailable.", variant: "destructive" });
      }
      return false;
    }
    try {
      const newSessionData = await withCopilotBootstrapRetry<CreateSessionResponse>(() => api.sessions.create());

      setMessages([]);
      setSelectedFiles([]);
      setActiveSession({
        id: newSessionData.sessionId,
        title: '',
        messages: [],
        createdAt: newSessionData.createdAt,
        updatedAt: newSessionData.updatedAt,
        tutorState: newSessionData.tutorState || {},
      });
      setIsNewChat(true);
      setPracticePadContext(null);
      setView('chat');
      setConversationState(newSessionData.conversationState || DEFAULT_CONVERSATION_STATE);
      syncTutorDerivedState(newSessionData.tutorState || {});
      setActiveTab('chat');

      if (showToast) {
        toast({ title: "New Study Session", description: "Fresh start! Ready for your questions." });
      }
      clearBootstrapFailure('new-session');
      return true;
    } catch (error) {
      markBootstrapFailure('new-session');
      console.error('[handleNewChat] Error starting new chat:', error);
      if (showToast) {
        toast({ title: "Error", description: "Could not start a new session.", variant: "destructive" });
      }
      return false;
    }
  }, [clearBootstrapFailure, markBootstrapFailure, shouldSkipBootstrapCall, syncTutorDerivedState, toast]);

  const loadInitialData = useCallback(async () => {
    if (initialLoadPromiseRef.current) return initialLoadPromiseRef.current;

    const run = (async () => {
    let bootstrapRecovered = false;
    try {
      const cached = readPreloadCache();
      if (cached) {
        const cachedHydrated = applyPreloadData(cached.data, true, { hydrateLastSession: true });
        bootstrapRecovered =
          cachedHydrated ||
          bootstrapRecovered ||
          (WORKSPACE_PREVIEW_ENABLED && Array.isArray(cached.data?.history) && cached.data.history.length > 0);
      }

      // 1. Fetch Profile (Critical for identity)
      try {
        await fetchProfile();
      } catch (err) {
        console.error('[loadInitialData] Profile fetch failed, using defaults:', err);
      }

      try {
        await fetchMetacognitionProfile();
      } catch (metaErr) {
        console.warn('[loadInitialData] Metacognition profile fetch failed:', metaErr);
      }

      // 2. Fetch History & Last Session (Non-critical)
      try {
        const data = await preloadCopilotData(false);
        const hydratedLastSession = applyPreloadData(data, true, { hydrateLastSession: true });
        bootstrapRecovered =
          hydratedLastSession ||
          bootstrapRecovered ||
          (WORKSPACE_PREVIEW_ENABLED && Array.isArray(data?.history) && data.history.length > 0);
        if (!hydratedLastSession && !activeSessionRef.current?.id) {
          bootstrapRecovered = (await handleNewChat(false)) || bootstrapRecovered;
        }
      } catch (preloadErr) {
        console.error('[loadInitialData] Preload failed, leaving copilot unhydrated until backend is ready:', preloadErr);
        if (WORKSPACE_PREVIEW_ENABLED) {
          applyPreloadData(buildWorkspacePreviewPreload(null), false, { hydrateLastSession: false });
          bootstrapRecovered = true;
        }
        if (!activeSessionRef.current?.id) {
          bootstrapRecovered = (await handleNewChat(false)) || bootstrapRecovered;
        }
      }

      // 3. Fetch Memory
      try {
        await fetchMemory();
      } catch (memErr) {
        console.warn('[loadInitialData] Memory fetch failed:', memErr);
      }

      setHasInitialized(
        bootstrapRecovered ||
        Boolean(activeSessionRef.current?.id) ||
        messagesRef.current.length > 0 ||
        historyRef.current.length > 0
      );
    } catch (error) {
      console.error('[loadInitialData] Critical failure in initialization sequence:', error);
      // Fallback: Ensure UI is interactive
      setMessages([]);
      setConversationState(DEFAULT_CONVERSATION_STATE);
      syncTutorDerivedState({});
      setMetacognitiveState(null);
      setHasInitialized(Boolean(activeSessionRef.current?.id) || historyRef.current.length > 0);
    }
    })().finally(() => {
      initialLoadPromiseRef.current = null;
    });

    initialLoadPromiseRef.current = run;
    return run;
  }, [applyPreloadData, fetchMemory, fetchMetacognitionProfile, fetchProfile, handleNewChat, preloadCopilotData, readPreloadCache, syncTutorDerivedState]);

  const handleTabChange = useCallback((value: string) => {
    userTabOverrideRef.current = true;
    setActiveTab(value);
    if (value === 'history') {
      setFullscreenDestination('search');
    } else if (value === 'revision') {
      setFullscreenDestination('revision');
    } else if (value === 'chat') {
      setFullscreenDestination('new_session');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (browserNavInitializedRef.current) return;

    browserNavInitializedRef.current = true;
    browserNavSnapshotKeyRef.current = serializeCopilotNavigationSnapshot(browserNavigationSnapshot);
    window.history.replaceState(
      createCopilotHistoryState(window.history.state, browserNavigationSnapshot),
      '',
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      const snapshot = readCopilotNavigationSnapshotFromHistoryState(event.state);
      if (!snapshot) return;
      isApplyingBrowserNavRef.current = true;
      browserNavSnapshotKeyRef.current = serializeCopilotNavigationSnapshot(snapshot);
      applyBrowserNavigationSnapshot(snapshot);

      if (browserNavReleaseTimerRef.current !== null) {
        window.clearTimeout(browserNavReleaseTimerRef.current);
      }
      browserNavReleaseTimerRef.current = window.setTimeout(() => {
        isApplyingBrowserNavRef.current = false;
        browserNavReleaseTimerRef.current = null;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (browserNavReleaseTimerRef.current !== null) {
        window.clearTimeout(browserNavReleaseTimerRef.current);
        browserNavReleaseTimerRef.current = null;
      }
    };
  }, [applyBrowserNavigationSnapshot]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextSnapshotKey = serializeCopilotNavigationSnapshot(browserNavigationSnapshot);
    if (!browserNavInitializedRef.current) {
      browserNavInitializedRef.current = true;
      browserNavSnapshotKeyRef.current = nextSnapshotKey;
      window.history.replaceState(
        createCopilotHistoryState(window.history.state, browserNavigationSnapshot),
        '',
        window.location.href
      );
      return;
    }

    if (isApplyingBrowserNavRef.current) {
      browserNavSnapshotKeyRef.current = nextSnapshotKey;
      return;
    }

    if (browserNavSnapshotKeyRef.current === nextSnapshotKey) return;

    browserNavSnapshotKeyRef.current = nextSnapshotKey;
    window.history.pushState(
      createCopilotHistoryState(window.history.state, browserNavigationSnapshot),
      '',
      window.location.href
    );
  }, [browserNavigationSnapshot]);

  useEffect(() => {
    if (activeTab !== 'revision') {
      setIsRevisionWorkspaceOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeWorkspaceDestination === 'new_session') return;
    setPreparedSelectionContext(null);
  }, [activeWorkspaceDestination]);

  useEffect(() => {
    if (!preparedSelectionContext?.sourceMessageId) return;
    const stillExists = messages.some((message) => message.id === preparedSelectionContext.sourceMessageId);
    if (!stillExists) {
      setPreparedSelectionContext(null);
    }
  }, [messages, preparedSelectionContext?.sourceMessageId]);

  useEffect(() => {
    if (isCopilotVisible && !hasInitialized) {
      userTabOverrideRef.current = false;
      loadInitialData();
    } else if (!isCopilotVisible) {
      setInput('');
      setSelectedFiles([]);
      setPreparedSelectionContext(null);
      setIsRevisionWorkspaceOpen(false);
    }
  }, [hasInitialized, isCopilotVisible, loadInitialData]);

  useEffect(() => {
    if (isFullscreen && !isOpen) {
      setIsOpen(true);
    }
  }, [isFullscreen, isOpen]);

  useEffect(() => {
    setHistoryPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedRevisionCollection) return;
    setSelectedRevisionItems([]);
  }, [revisionSearchQuery, selectedRevisionCollection?.id]);

  useEffect(() => {
    if (!isCopilotVisible || activeTab !== 'history') return;
    const timeoutId = window.setTimeout(() => {
      refreshHistory(historyPagination.page, searchQuery);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [activeTab, historyPagination.page, isCopilotVisible, refreshHistory, searchQuery]);

  useEffect(() => {
    if (!isCopilotVisible || !isFullscreen) return;
    if (hasSidebarHistoryHydrated) return;

    const seeded = normalizeHistorySessions(historyRef.current).slice(0, SIDEBAR_HISTORY_PAGE_SIZE);
    if (seeded.length > 0) {
      setSidebarHistorySessions(seeded);
      setSidebarHistoryPagination((prev) => ({
        ...prev,
        page: 1,
        total: Math.max(prev.total, seeded.length),
        totalPages: Math.max(prev.totalPages, 1),
      }));
    }
    void loadSidebarHistoryPage(1);
  }, [
    hasSidebarHistoryHydrated,
    isCopilotVisible,
    isFullscreen,
    loadSidebarHistoryPage,
    normalizeHistorySessions,
  ]);

  useEffect(() => {
    if (!isCopilotVisible || activeWorkspaceDestination !== 'revision') return;
    const timeoutId = window.setTimeout(() => {
      if (selectedRevisionCollection) {
        void loadRevisionCollection(selectedRevisionCollection, revisionSearchQuery);
      } else {
        void refreshRevision(revisionSearchQuery);
        if (!revisionSearchQuery.trim()) {
          void refreshGroupingSuggestions();
        }
      }
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [
    activeWorkspaceDestination,
    isCopilotVisible,
    loadRevisionCollection,
    refreshGroupingSuggestions,
    refreshRevision,
    revisionSearchQuery,
    selectedRevisionCollection,
  ]);

  useEffect(() => {
    if (!isCopilotVisible) return;
    const requiresRevisionData =
      activeWorkspaceDestination === 'revision' ||
      activeWorkspaceDestination === 'media' ||
      activeWorkspaceDestination === 'growth' ||
      activeWorkspaceDestination === 'search' ||
      activeWorkspaceDestination === 'exam' ||
      activeWorkspaceDestination === 'focus';
    if (!requiresRevisionData) return;

    const timeoutId = window.setTimeout(() => {
      void refreshRevision(revisionSearchQuery);
      if (
        activeWorkspaceDestination === 'revision' &&
        !selectedRevisionCollection &&
        !revisionSearchQuery.trim()
      ) {
        void refreshGroupingSuggestions();
      }
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [
    activeWorkspaceDestination,
    isCopilotVisible,
    refreshGroupingSuggestions,
    refreshRevision,
    revisionSearchQuery,
    selectedRevisionCollection,
  ]);

  useEffect(() => {
    if (!isCopilotVisible) return;
    const needsMediaAssets = activeWorkspaceDestination === 'media' || mediaAssets.length === 0;
    const needsMediaStream = activeWorkspaceDestination === 'media' || mediaStream.length === 0;
    const needsMediaCollections = activeWorkspaceDestination === 'media' || mediaCollections.length === 0;
    if (!needsMediaAssets && !needsMediaStream && !needsMediaCollections) return;
    const timeoutId = window.setTimeout(() => {
      if (needsMediaAssets) {
        void refreshMediaAssets({ silent: mediaAssets.length > 0 });
      }
      if (needsMediaStream) {
        void refreshMediaStream({ silent: mediaStream.length > 0 });
      }
      if (needsMediaCollections) {
        void refreshMediaCollections({ silent: mediaCollections.length > 0 });
      }
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [
    activeWorkspaceDestination,
    isCopilotVisible,
    mediaAssets.length,
    mediaCollections.length,
    mediaStream.length,
    refreshMediaAssets,
    refreshMediaCollections,
    refreshMediaStream,
  ]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const cached = readPreloadCache();
    if (!cached?.data?.lastSession || !revisionOverview) return;
    updatePreloadCache(cached.data.lastSession, historyRef.current, revisionOverview);
  }, [readPreloadCache, revisionOverview, updatePreloadCache]);

  useEffect(() => {
    if (conversationState.researchModeActive && voiceController.state !== 'idle') {
      voiceController.toggle();
    }
  }, [conversationState.researchModeActive, voiceController]);

  useEffect(() => {
    if (voiceController.state === 'idle') {
      pendingVoiceReplyRef.current = false;
    }
  }, [voiceController.state]);

  async function handleSendMessage(
    e: React.FormEvent | null,
    overrideContent?: string,
    options?: {
      fromVoice?: boolean;
      turnId?: string;
      baseMessages?: Message[];
      existingUserMessage?: Message;
      overrideConversationState?: ConversationState;
      ignoreSelectedFile?: boolean;
      preserveInput?: boolean;
      tutorAction?: TutorActionRequest;
      editedMessageId?: string;
      inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
      composerIntent?: string;
      linkedArtifactId?: string;
      displayUserMessage?: boolean;
      persistUserMessage?: boolean;
    }
  ) {
    if (e) e.preventDefault();
    const contentToSend = overrideContent ?? input;
    const baseMessages = options?.baseMessages ?? messages;
    const filesToUpload = options?.ignoreSelectedFile ? [] : selectedFiles;
    const preparedSelectionForSend = options?.tutorAction ? null : preparedSelectionContextRef.current;
    const contextualTutorAction: TutorActionRequest | undefined =
      options?.tutorAction ||
      (preparedSelectionForSend
        ? {
            id: 'ask',
            selectedText: preparedSelectionForSend.selectedText,
            sourceMessageId: preparedSelectionForSend.sourceMessageId,
            sourceText: preparedSelectionForSend.sourceText,
            sourceVideoId: preparedSelectionForSend.sourceVideoId,
            sourceVideoTitle: preparedSelectionForSend.sourceVideoTitle,
            sourceArtifactLabel: preparedSelectionForSend.sourceArtifactLabel,
            sourceArtifactSummary: preparedSelectionForSend.sourceArtifactSummary,
            selectionSourceKind: preparedSelectionForSend.sourceKind,
            invokedFrom: 'composer',
            sourceType: preparedSelectionForSend.sourceType,
            sourceDocumentId: preparedSelectionForSend.sourceDocumentId,
            selectionRange: preparedSelectionForSend.selectionRange,
            linkedArtifactId: preparedSelectionForSend.linkedArtifactId,
          }
        : undefined);
    const usedPreparedSelectionContext = Boolean(preparedSelectionForSend && !options?.tutorAction);
    if (!contentToSend.trim() && filesToUpload.length === 0) return;

    const incomingRequestKind: InFlightChatRequest['kind'] = contextualTutorAction ? 'tutor_action' : 'chat';
    const existingRequest = inFlightChatRequestRef.current;
    if (existingRequest) {
      const canCoalesceTutorAction =
        incomingRequestKind === 'tutor_action' && existingRequest.kind === 'tutor_action';
      if (!canCoalesceTutorAction) return;
      silentlyCanceledRequestIdsRef.current.add(existingRequest.id);
      existingRequest.controller.abort();
      setIsStreaming(false);
      setResearchStreamStatus(null);
    } else if (isLoading) {
      return;
    }

    const requestId = chatRequestIdRef.current + 1;
    chatRequestIdRef.current = requestId;
    const requestController = new AbortController();
    inFlightChatRequestRef.current = {
      id: requestId,
      controller: requestController,
      kind: incomingRequestKind,
    };

    if (!options?.fromVoice) {
      voiceController.silence();
    }
    setIsLoading(true);
    const userInput = contentToSend;
    const displayUserInput =
      userInput.trim() ||
      (filesToUpload.length > 0
        ? `Attached file${filesToUpload.length > 1 ? 's' : ''}: ${filesToUpload.map((file) => file.name).join(', ')}`
        : userInput);
    const effectiveUserInput =
      userInput.trim() ||
      (filesToUpload.length > 0
        ? `Please study the attached school material${filesToUpload.length > 1 ? 's' : ''} "${filesToUpload.map((file) => file.name).join(', ')}". Summarize the important content, identify any questions or exercises, and break ${filesToUpload.length > 1 ? 'them' : 'it'} into clear steps for a student.`
        : userInput);
    const shouldDisplayUserMessage = options?.displayUserMessage !== false;
    const shouldPersistUserMessage = options?.persistUserMessage !== false;
    if (!options?.preserveInput) {
      setInput('');
    }
    if (!options?.ignoreSelectedFile) {
      setSelectedFiles([]);
    }
    const activeComposerContext = {
      ...composerContextRef.current,
      ...(options?.inputOrigin ? { inputOrigin: options.inputOrigin } : {}),
      ...(options?.composerIntent ? { composerIntent: options.composerIntent } : {}),
      ...(usedPreparedSelectionContext && !options?.inputOrigin ? { inputOrigin: 'text' as const } : {}),
      ...(usedPreparedSelectionContext && !options?.composerIntent ? { composerIntent: 'selection_context_ask' } : {}),
      ...(options?.linkedArtifactId ? { linkedArtifactId: options.linkedArtifactId } : {}),
      ...(usedPreparedSelectionContext && preparedSelectionForSend?.linkedArtifactId
        ? { linkedArtifactId: preparedSelectionForSend.linkedArtifactId }
        : {}),
    };
    setComposerContext(undefined);
    const selectionContextMessageMeta = preparedSelectionForSend
      ? {
          selectionContext: {
            selectedText: preparedSelectionForSend.selectedText,
            sourceMessageId: preparedSelectionForSend.sourceMessageId || null,
            sourceKind: preparedSelectionForSend.sourceKind || null,
            sourceType: preparedSelectionForSend.sourceType || null,
            sourceDocumentId: preparedSelectionForSend.sourceDocumentId || null,
            selectionRange: preparedSelectionForSend.selectionRange || null,
            createdAt: preparedSelectionForSend.createdAtIso,
          },
        }
      : {};

    const userMessage: Message = options?.existingUserMessage || {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayUserInput,
      image: filesToUpload.length === 1 && isImageUploadFile(filesToUpload[0])
        ? { src: URL.createObjectURL(filesToUpload[0]), alt: filesToUpload[0].name }
        : undefined,
      metadata: filesToUpload.length > 0
        ? {
            attachments: filesToUpload.map((file) => ({
              name: file.name,
              sizeBytes: file.size,
              kind: isImageUploadFile(file) ? 'image' : isPdfUploadFile(file) ? 'pdf' : 'text',
            })),
            ...(activeComposerContext.inputOrigin ? { inputOrigin: activeComposerContext.inputOrigin } : {}),
            ...(activeComposerContext.composerIntent ? { composerIntent: activeComposerContext.composerIntent } : {}),
            ...selectionContextMessageMeta,
          }
        : (
            activeComposerContext.inputOrigin ||
            activeComposerContext.composerIntent ||
            activeComposerContext.linkedArtifactId ||
            preparedSelectionForSend
          )
          ? {
              ...(activeComposerContext.inputOrigin ? { inputOrigin: activeComposerContext.inputOrigin } : {}),
              ...(activeComposerContext.composerIntent ? { composerIntent: activeComposerContext.composerIntent } : {}),
              ...(activeComposerContext.linkedArtifactId ? { linkedArtifactId: activeComposerContext.linkedArtifactId } : {}),
              ...selectionContextMessageMeta,
              ...(!shouldDisplayUserMessage ? { uiHidden: true } : {}),
            }
          : undefined,
      timestamp: new Date(),
    };

    let currentMessages = shouldDisplayUserMessage ? [...baseMessages, userMessage] : [...baseMessages];
    setMessages(currentMessages);
    if (!options?.ignoreSelectedFile && fileInputRef.current) fileInputRef.current.value = '';
    scrollToBottom();

    let fileDataForAction: UploadFilePayload[] | undefined = undefined;

    const executeAction = async () => {
        let shouldUsePacedTyping = false;
        let hasDoneEvent = false;
        let typingFinalized = false;
      let requestSucceeded = false;
      let typingPump: ReturnType<typeof setInterval> | null = null;
      const stopTypingPump = () => {
        if (typingPump) {
          clearInterval(typingPump);
          typingPump = null;
        }
      };

        try {
          if (inFlightChatRequestRef.current?.id !== requestId || requestController.signal.aborted) {
            return;
          }
          let currentSessionId = activeSession?.id;
          let currentSessionSeed = activeSession;

          if (!currentSessionId || isPreviewWorkspaceSessionId(currentSessionId)) {
            const newSess = await api.sessions.create();
            currentSessionId = newSess.sessionId;

            const sessionPayload: ChatSession = {
              id: newSess.sessionId,
              title: '',
              messages: [],
              createdAt: newSess.createdAt,
              updatedAt: newSess.updatedAt,
            };

            currentSessionSeed = sessionPayload;
            setActiveSession(sessionPayload);
            upsertHistoryEntry({
              id: sessionPayload.id,
              title: sessionPayload.title || '',
              createdAt: sessionPayload.createdAt,
              updatedAt: sessionPayload.updatedAt,
              firstMessage: currentMessages[0]?.content || displayUserInput || null,
            });
          }

        if (options?.fromVoice) {
          recordLearningEffectSignal({
            eventType: 'voice_mode_used',
            metadata: {
              turnId: options.turnId || null,
              responseMode: 'voice_realtime',
            },
          });
        }

        const currentInterests = profile?.interests || [];
        const preferredLanguageBackend =
          (languageFrontendToBackend as any)[profile?.preferredLanguage || ''] ||
          (languageFrontendToBackend as any)[languageHint] ||
          'english';

        upsertHistoryEntry({
          id: currentSessionId,
          title: currentSessionSeed?.title || '',
          createdAt: currentSessionSeed?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstMessage: currentMessages[0]?.content || displayUserInput || null,
        });

        const latencyContext = options?.fromVoice && options?.turnId
          ? voiceLatencyByTurnRef.current.get(options.turnId)
          : undefined;
        const workspaceContext: FullscreenWorkspaceContext = buildWorkspaceContextPayload({
          isFullscreen,
          fullscreenDestination,
          activeTab,
          studyMode: fullscreenStudyMode,
          modeFlags: fullscreenModeFlags,
          forceWebSearch,
          activePlusAction: activeFullscreenPlusAction,
          plusDrawerOpen: fullscreenPlusDrawerOpen,
          sidebarExpanded: fullscreenSidebarExpanded,
          selectedRevisionCollectionId: selectedRevisionCollection?.id || null,
          selectedRevisionItemId,
          selectedMediaItemId,
          activeMediaFilter,
          activeMediaMode,
          activeGrowthSection,
          chatSessionId: currentSessionId,
          historySearchQuery: searchQuery,
          revisionSearchQuery,
          surfaceKind: isFullscreen ? 'fullscreen' : 'widget',
          surfaceProfile: isFullscreen ? 'expanded' : widgetSurfaceProfile,
          navigationStyle: DEFAULT_WIDGET_NAVIGATION_STYLE,
        });
        const effectiveForceWebSearch = Boolean(workspaceContext.modeFlags?.research);
        setResearchStreamStatus(
          effectiveForceWebSearch
            ? {
                phase: 'research_ready',
                label: 'Web research ready',
                timestamp: new Date().toISOString(),
              }
            : null
        );
        const chatPayload = {
          currentSessionId,
          message: effectiveUserInput,
          editedMessageId: options?.editedMessageId,
          turnId: options?.turnId,
          responseMode: options?.fromVoice ? 'voice_realtime' : 'default',
          chatHistory: currentMessages,
          conversationState: options?.overrideConversationState || conversationState,
          fileData: fileDataForAction && fileDataForAction.length === 1 ? fileDataForAction[0] : fileDataForAction,
          tutorAction: contextualTutorAction,
          inputOrigin: activeComposerContext.inputOrigin,
          composerIntent: activeComposerContext.composerIntent,
          linkedArtifactId: activeComposerContext.linkedArtifactId,
          persistUserMessage: shouldPersistUserMessage,
          forceWebSearch: effectiveForceWebSearch,
          focusMode: fullscreenModeFlags.focus,
          examMode: fullscreenModeFlags.exam,
          includeVideos,
          workspaceContext,
          preferences: {
            name: profile?.name || 'Student',
            gradeLevel: level,
            preferredLanguage: preferredLanguageBackend,
            interests: currentInterests,
            learningStyleSignals: normalizeLearningStyleSignals(profile?.learningStyleSignals),
            mediaPreferences: normalizeMediaPreferences(profile?.mediaPreferences),
          },
          studentMemory,
          sessionLanguageState,
          metacognitiveState,
          latencyContext: options?.fromVoice
            ? {
                sttMs: latencyContext?.sttMs,
                sttFirstTokenMs: latencyContext?.sttFirstTokenMs,
                ttsStartMs: latencyContext?.ttsStartMs,
                ttsFirstByteMs: latencyContext?.ttsFirstByteMs,
                languageMode: latencyContext?.languageMode || preferredLanguageBackend,
              }
            : undefined
        };
        if (effectiveForceWebSearch) {
          const triggerType =
            activeFullscreenPlusAction === 'web_research'
              ? 'research_action'
              : researchModeRequested
                ? 'mode_explicit'
                : 'intent_gate';
          recordLearningEffectSignal({
            eventType: 'research_mode_entered',
            metadata: {
              triggerType,
              plusAction: activeFullscreenPlusAction || null,
              destination: workspaceContext.activeDestination || null,
            },
          });
          recordLearningEffectSignal({
            eventType: 'research_trigger_type',
            metadata: {
              triggerType,
              plusAction: activeFullscreenPlusAction || null,
              destination: workspaceContext.activeDestination || null,
            },
          });
        }
        const requestStartedAtMs = Date.now();
        let firstTokenAtMs: number | null = null;
        let doneAtMs: number | null = null;
        let firstUsefulStatusAtMs: number | null = null;
        let sawSearchStatus = false;

        const chatFetch = async () => {
          return api.chat.openStream(chatPayload, {
            timeoutMs: 25000,
            signal: requestController.signal,
          });
        };

        let response: Response;
        try {
          response = await chatFetch();
        } catch (err) {
          if (requestController.signal.aborted) {
            throw err;
          }
          // One quick retry for transient local network/server hiccups.
          await new Promise((resolve) => setTimeout(resolve, 300));
          response = await chatFetch();
        }

        if (!response.ok) {
          const responseText = await response.text().catch(() => '');
          let details = response.statusText;

          if (responseText) {
            try {
              const parsed = JSON.parse(responseText);
              details =
                String(
                  parsed?.error ||
                  parsed?.message ||
                  parsed?.details ||
                  responseText
                ).trim() || response.statusText;
            } catch {
              details = responseText.trim() || response.statusText;
            }
          }

          throw new Error(`Chat request failed (${response.status}): ${details.slice(0, 300)}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        let assistantMessageId: string | null = null;
        let streamedContent = "";
        let buffer = "";
        // Production speed: only pace typing for voice-origin turns where sync matters.
        shouldUsePacedTyping = Boolean(options?.fromVoice);
        let renderedContent = "";
        let queuedContent = "";
        let doneFinalText: string | null = null;
        let doneMeta: any = null;

        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 30;
        const TYPING_INTERVAL_MS = 16;
        const normalizeSpeechChunk = (text: string) => {
          return String(text || '')
            .replace(
              /\b([A-Za-z]{4,})\s+(ist|ism|istic|tion|sion|ment|ness|ship|hood|ology|ologist|able|ible|ing|ed|er|ers)\b/g,
              '$1$2'
            )
            .replace(/\b([A-Za-z]{5,})\s+([a-z])\b/g, '$1$2')
            .replace(/\s+/g, ' ')
            .trim();
        };
        const ENABLE_STREAMING_VOICE_TTS = Boolean(options?.fromVoice);
        const isSpeakableSpeechChunk = (text: string) => {
          const cleaned = String(text || '')
            .replace(/[^A-Za-z0-9\u0600-\u06FF\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (!cleaned) return false;
          const words = cleaned.split(/\s+/).filter(Boolean);
          if (words.length === 0) return false;
          if (words.length === 1) {
            const single = words[0] || '';
            if (/^[A-Za-z\u0600-\u06FF]$/.test(single)) return false;
          }
          const meaningfulChars = (cleaned.match(/[A-Za-z0-9\u0600-\u06FF]/g) || []).length;
          return meaningfulChars >= 2;
        };
        const MIN_SPEAKABLE_CHARS = 10;
        const FIRST_VOICE_CHUNK_MIN_CHARS = 24;
        const FIRST_VOICE_CHUNK_MAX_CHARS = 160;
        const NEXT_VOICE_CHUNK_MIN_CHARS = 72;
        const NEXT_VOICE_CHUNK_MAX_CHARS = 280;
        const FORCE_EARLY_CHUNK_AT_CHARS = 120;
        const MIN_VOICE_DISPATCH_GAP_MS = 260;
        let voiceSpeechCursor = 0;
        let voiceStreamChunkCount = 0;
        let voiceLastDispatchAt = 0;

        const pickWhitespaceCut = (source: string, maxChars: number, minChars: number) => {
          const capped = source.slice(0, maxChars);
          const whitespaceCut = Math.max(capped.lastIndexOf(' '), capped.lastIndexOf('\n'));
          return whitespaceCut >= minChars ? whitespaceCut : capped.length;
        };

        const extractNextSpeechChunk = (
          sourceText: string,
          isFirstChunk: boolean,
          forceTail: boolean
        ): { chunk: string; consumedChars: number } | null => {
          const remaining = String(sourceText || '');
          if (!remaining.trim()) return null;

          if (forceTail) {
            return { chunk: remaining, consumedChars: remaining.length };
          }

          const minChars = isFirstChunk ? FIRST_VOICE_CHUNK_MIN_CHARS : NEXT_VOICE_CHUNK_MIN_CHARS;
          const maxChars = isFirstChunk ? FIRST_VOICE_CHUNK_MAX_CHARS : NEXT_VOICE_CHUNK_MAX_CHARS;
          const capped = remaining.slice(0, maxChars);

          const sentenceRegex = /[^.!?\u061F]+[.!?\u061F]+(?:\s+|$)/g;
          let selectedEnd = 0;
          let match: RegExpExecArray | null = null;
          while ((match = sentenceRegex.exec(capped)) !== null) {
            const end = (match.index || 0) + match[0].length;
            if (end >= minChars) {
              selectedEnd = end;
            }
          }

          if (selectedEnd <= 0) {
            if (!isFirstChunk || remaining.trim().length < FORCE_EARLY_CHUNK_AT_CHARS) {
              return null;
            }
            selectedEnd = pickWhitespaceCut(remaining, maxChars, minChars);
          }

          while (selectedEnd < remaining.length && /\s/.test(remaining[selectedEnd] || '')) {
            selectedEnd += 1;
          }

          const chunk = remaining.slice(0, selectedEnd);
          if (!chunk.trim()) return null;
          return { chunk, consumedChars: Math.max(1, selectedEnd) };
        };

        const queueVoiceFromStream = (sourceText: string, forceTail = false): boolean => {
          if (!ENABLE_STREAMING_VOICE_TTS) return false;
          if (!options?.fromVoice) return false;
          if (!pendingVoiceReplyRef.current) return false;
          if (!forceTail && Date.now() - voiceLastDispatchAt < MIN_VOICE_DISPATCH_GAP_MS) return false;
          const raw = String(sourceText || '');
          if (!raw) return false;
          if (voiceSpeechCursor >= raw.length && !forceTail) return false;

          const remaining = raw.slice(voiceSpeechCursor);
          if (!remaining || !remaining.trim()) return false;
          const extracted = extractNextSpeechChunk(
            remaining,
            voiceStreamChunkCount === 0,
            forceTail
          );
          if (!extracted) return false;
          const { chunk: chunkToSpeak, consumedChars } = extracted;

          const normalizedChunk = normalizeSpeechChunk(chunkToSpeak);
          const minChars = forceTail && voiceStreamChunkCount === 0 ? 2 : MIN_SPEAKABLE_CHARS;
          if (normalizedChunk.length < minChars) return false;
          if (!isSpeakableSpeechChunk(normalizedChunk)) return false;

          voiceStreamChunkCount += 1;
          voiceSpeechCursor += consumedChars > 0 ? consumedChars : chunkToSpeak.length;
          voiceLastDispatchAt = Date.now();
          voiceController.speak(normalizedChunk);
          return true;
        };

        const upsertAssistantMessage = (content: string, meta?: any) => {
          const assistantMetadata = meta?.assistantMetadata || undefined;
          if (!assistantMessageId) {
            assistantMessageId = `model-${Date.now()}`;
            setMessages(prev => [...prev, {
              id: assistantMessageId!,
              role: 'model',
              content,
              timestamp: new Date(),
              ...(meta ? { videoData: meta.video, sources: meta.sources } : {}),
              ...(assistantMetadata ? { metadata: assistantMetadata } : {}),
            }]);
            setIsLoading(false);
            return;
          }

          setMessages(prev => prev.map(m =>
            m.id === assistantMessageId ? {
              ...m,
              content,
              ...(meta ? { videoData: meta.video, sources: meta.sources } : {}),
              ...(assistantMetadata ? { metadata: assistantMetadata } : {}),
            } : m
          ));
        };

        const startTypingPump = () => {
          if (!shouldUsePacedTyping || typingPump) return;
          typingPump = setInterval(() => {
            if (!assistantMessageId) return;

            if (queuedContent.length > 0) {
              const step = Math.min(8, Math.max(1, Math.ceil(queuedContent.length / 60)));
              renderedContent += queuedContent.slice(0, step);
              queuedContent = queuedContent.slice(step);
              upsertAssistantMessage(renderedContent);
              return;
            }

            if (hasDoneEvent && !typingFinalized && doneFinalText !== null) {
              typingFinalized = true;
              upsertAssistantMessage(doneFinalText, doneMeta);
              setIsStreaming(false);
              stopTypingPump();
            }
          }, TYPING_INTERVAL_MS);
        };

        const handleDoneEvent = (meta: any) => {
          doneAtMs = Date.now();
          setResearchStreamStatus(null);
          const finalText = meta.finalText || streamedContent;
          const speechText = normalizeSpeechChunk(finalText) || finalText;
          const resolvedAssistantMessageId: string =
            assistantMessageId !== null ? assistantMessageId : `model-${Date.now()}`;

          if (shouldUsePacedTyping) {
            if (!assistantMessageId) {
              assistantMessageId = resolvedAssistantMessageId;
              upsertAssistantMessage('');
            }

            if (finalText.startsWith(renderedContent)) {
              queuedContent += finalText.slice(renderedContent.length);
            } else {
              renderedContent = '';
              queuedContent = finalText;
            }

            doneMeta = meta;
            doneFinalText = finalText;
            hasDoneEvent = true;
            startTypingPump();
          } else {
            if (!assistantMessageId) {
              assistantMessageId = resolvedAssistantMessageId;
              upsertAssistantMessage(finalText, meta);
              setIsStreaming(false);
            } else {
              upsertAssistantMessage(finalText, meta);
            }
          }

          if (pendingVoiceReplyRef.current) {
            if (lastSpokenIdRef.current !== resolvedAssistantMessageId) {
              lastSpokenIdRef.current = resolvedAssistantMessageId;
              if (ENABLE_STREAMING_VOICE_TTS && options?.fromVoice) {
                const queuedTail = queueVoiceFromStream(finalText, true);
                if (voiceStreamChunkCount === 0 && !queuedTail) {
                  voiceController.speak(speechText);
                }
              } else {
                voiceController.speak(speechText);
              }
              pendingVoiceReplyRef.current = false;
            }
          }

          setConversationState(meta.state);
          syncTutorDerivedState(meta.tutorState || {});
          if (meta?.tutorState?.sessionLanguageState) {
            setSessionLanguageState((prev) =>
              mergeSessionLanguageState(prev, meta.tutorState.sessionLanguageState, resolvePreferredLanguageMode())
            );
          }
          if (meta?.tutorState?.metacognitiveState) {
            const nextSnapshot = mergeMetacognitiveState(
              metacognitiveState,
              meta.tutorState.metacognitiveState
            );
            setMetacognitiveState(nextSnapshot);
            setMetacognitiveProfile((prev) => ({
              ...(prev || {}),
              preferredSupportPatterns:
                meta.tutorState?.preferredSupportPatterns ||
                prev?.preferredSupportPatterns ||
                null,
              recentSnapshot: nextSnapshot,
            }));
          }
          setActiveSession((prev) => prev ? { ...prev, tutorState: meta.tutorState || prev.tutorState } : prev);
          const assistantMetadata = meta.assistantMetadata || {};
          const canonicalAssistantMeta = resolveAssistantEnvelopeMetadata(assistantMetadata as any);
          const savedRevisionNote = canonicalAssistantMeta.savedRevisionNote;
          const systemNotices = canonicalAssistantMeta.systemNotices;
          const researchMeta =
            assistantMetadata &&
            typeof assistantMetadata === 'object' &&
            (assistantMetadata as Record<string, unknown>).research &&
            typeof (assistantMetadata as Record<string, unknown>).research === 'object'
              ? ((assistantMetadata as Record<string, unknown>).research as MessageResearchMeta)
              : null;
          const completedLatencyMs =
            doneAtMs !== null
              ? Math.max(0, doneAtMs - requestStartedAtMs)
              : null;

          if (finalText.length >= 900) {
            recordLearningEffectSignal({
              eventType: 'noisy_or_overlong_response_rate',
              messageId: resolvedAssistantMessageId,
              metadata: {
                outputChars: finalText.length,
              },
            });
          }

          if (!contextualTutorAction && finalText.length >= 1200) {
            recordLearningEffectSignal({
              eventType: 'answer_dump_risk_detected',
              messageId: resolvedAssistantMessageId,
              metadata: {
                outputChars: finalText.length,
              },
            });
          }

          if (options?.fromVoice) {
            recordLearningEffectSignal({
              eventType: 'voice_mode_helped',
              messageId: resolvedAssistantMessageId,
              metadata: {
                outputChars: finalText.length,
                streamedVoiceChunks: voiceStreamChunkCount,
              },
            });
          }

          if (Array.isArray(meta.sources) && meta.sources.length > 0) {
            const researchSignalActive = forceWebSearch || researchModeRequested;
            recordLearningEffectSignal({
              eventType: researchSignalActive ? 'research_mode_helped' : 'source_backed_answer_followup_signal',
              messageId: resolvedAssistantMessageId,
              metadata: {
                sourceCount: meta.sources.length,
                forceWebSearch: researchSignalActive,
              },
            });
          }

          if (researchMeta) {
            const normalizedSearchCount =
              typeof researchMeta.searchCount === 'number' && Number.isFinite(researchMeta.searchCount)
                ? Math.max(0, Math.floor(researchMeta.searchCount))
                : 0;
            const selectedSourceCount = Array.isArray(meta.sources) ? meta.sources.length : 0;
            const triggerType = String(researchMeta.triggerType || '').trim() || null;
            const confidenceState = String(researchMeta.confidenceState || '').trim().toLowerCase();
            const firstUsefulLatencyFromMeta =
              typeof researchMeta.firstUsefulLatencyMs === 'number' && Number.isFinite(researchMeta.firstUsefulLatencyMs)
                ? Math.max(0, Math.floor(researchMeta.firstUsefulLatencyMs))
                : null;
            const queryPlanCount = Array.isArray(researchMeta.queryPlan) ? researchMeta.queryPlan.length : 0;

            if (!sawSearchStatus && (normalizedSearchCount > 0 || queryPlanCount > 0)) {
              sawSearchStatus = true;
              recordLearningEffectSignal({
                eventType: 'search_executed',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  triggerType,
                  searchCount: normalizedSearchCount || queryPlanCount,
                },
              });
            }

            if (selectedSourceCount > 0) {
              recordLearningEffectSignal({
                eventType: 'sources_selected',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  sourceCount: selectedSourceCount,
                  triggerType,
                  confidenceState,
                },
              });
            }

            if (completedLatencyMs !== null) {
              recordLearningEffectSignal({
                eventType: 'response_latency',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  latencyMs: completedLatencyMs,
                  triggerType,
                },
              });
            }

            if (firstUsefulStatusAtMs === null && firstUsefulLatencyFromMeta !== null) {
              firstUsefulStatusAtMs = requestStartedAtMs + firstUsefulLatencyFromMeta;
              recordLearningEffectSignal({
                eventType: 'first_useful_answer_latency',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  latencyMs: firstUsefulLatencyFromMeta,
                  triggerType,
                },
              });
            }

            if (researchMeta.reuseHit === true) {
              recordLearningEffectSignal({
                eventType: 'follow_up_reuse_hit',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  sourceReuseId: researchMeta.sourceReuseId || null,
                  triggerType,
                },
              });
            }

            if (confidenceState === 'low' || confidenceState === 'mixed' || confidenceState === 'insufficient') {
              recordLearningEffectSignal({
                eventType: 'low_confidence_outcome',
                messageId: resolvedAssistantMessageId,
                metadata: {
                  confidenceState,
                  sourceCount: selectedSourceCount,
                  triggerType,
                },
              });
            }
          }

          if (meta.video) {
            recordLearningEffectSignal({
              eventType: 'video_recommendation_helped',
              messageId: resolvedAssistantMessageId,
              metadata: {
                videoId: meta.video.id || meta.video.videoId || null,
              },
            });
          }

          const preferredLanguageAtTurn = String(
            canonicalAssistantMeta.language?.preferredResponseLanguageAtTurn ||
            meta?.tutorState?.sessionLanguageState?.preferredResponseLanguage ||
            ''
          ).trim();
          const generatedLanguage = String(canonicalAssistantMeta.language?.generatedLanguage || '').trim();
          if (preferredLanguageAtTurn && generatedLanguage) {
            recordLearningEffectSignal({
              eventType:
                preferredLanguageAtTurn === generatedLanguage
                  ? 'response_language_match_rate'
                  : 'language_drift_detected',
              messageId: resolvedAssistantMessageId,
              metadata: {
                preferredLanguageAtTurn,
                generatedLanguage,
              },
            });
          }

          if (systemNotices.length > 0) {
            recordLearningEffectSignal({
              eventType: 'fallback_notice_shown',
              messageId: resolvedAssistantMessageId,
              metadata: {
                noticeCodes: systemNotices.map((notice: any) => notice?.code).filter(Boolean),
              },
            });
            recordLearningEffectSignal({
              eventType: 'fallback_notice_honest',
              messageId: resolvedAssistantMessageId,
              metadata: {
                noticeCodes: systemNotices.map((notice: any) => notice?.code).filter(Boolean),
              },
            });
          }

          if (savedRevisionNote?.id) {
            toast({
              title: 'Saved to revision',
              description: savedRevisionNote.collectionTitle
                ? `Saved under ${savedRevisionNote.collectionTitle}.`
                : 'This note is ready in Revision.',
            });
            void refreshRevision();
          }

          const aiTitle = meta.suggestedTitle ? meta.suggestedTitle.trim() : '';
          const aiTitleInvalid = TITLE_FORBIDDEN.has(aiTitle.toLowerCase()) || aiTitle.split(/\s+/).length > 7;
          const derivedTitle = deriveTitleFromText(effectiveUserInput || finalText);
          const useDerivedTitle =
            !aiTitle || aiTitleInvalid || isPlaceholderTitle(aiTitle) || isEchoedTitle(aiTitle, effectiveUserInput || '');
          const finalTitle = (useDerivedTitle ? derivedTitle : aiTitle).trim();

          if (finalTitle) {
            upsertHistoryEntry({
              id: currentSessionId,
              title: finalTitle,
              updatedAt: new Date().toISOString(),
              firstMessage: currentMessages[0]?.content || displayUserInput || null,
            });

            setActiveSession(prev => prev ? { ...prev, title: finalTitle } : null);
            setHistory(prevHistory => prevHistory.map(s => s.id === currentSessionId ? { ...s, title: finalTitle } : s));
            api.sessions.updateTitle(currentSessionId, finalTitle).catch(() => { });
          }

          const snapshotMessages = [
            ...currentMessages,
            {
              id: assistantMessageId || `model-${Date.now()}`,
              role: 'model',
              content: finalText,
              timestamp: new Date(),
              videoData: meta.video,
              sources: meta.sources,
              metadata: {
                tutorState: meta.tutorState || {},
                ...assistantMetadata,
              },
            }
          ];

          const cacheTitle = finalTitle || activeSessionRef.current?.title || '';
          const cacheSession = {
            id: currentSessionId,
            title: cacheTitle,
            topic: cacheTitle,
            createdAt: activeSessionRef.current?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            conversationState: meta.state,
            tutorState: meta.tutorState || {},
            messages: snapshotMessages.map((m: any) => ({
              ...m,
              timestamp: (m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp)
            }))
          };

          updatePreloadCache(cacheSession);

          const firstTokenMs =
            firstTokenAtMs !== null
              ? Math.max(0, firstTokenAtMs - requestStartedAtMs)
              : null;
          const doneMs =
            doneAtMs !== null
              ? Math.max(0, doneAtMs - requestStartedAtMs)
              : null;
          setDevLatencyDiagnostics({
            turnId: options?.turnId || `${currentSessionId}:${requestId}`,
            source: options?.fromVoice ? 'voice' : contextualTutorAction ? 'tutor_action' : 'chat',
            firstTokenMs,
            fullResponseMs: doneMs,
            tutorActionTurnaroundMs: contextualTutorAction ? doneMs : null,
            updatedAtIso: new Date().toISOString(),
          });
          requestSucceeded = true;

          if (options?.fromVoice && options?.turnId) {
            const turnId = options.turnId;
            const runtime = voiceLatencyByTurnRef.current.get(turnId) || {};
            void persistTurnLatency({
              turnId,
              sessionId: currentSessionId,
              responseMode: 'voice_realtime',
              route: 'next_sse_chat_frontend',
              source: 'voice_frontend_stream',
              languageMode: runtime.languageMode || preferredLanguageBackend,
              sttMs: runtime.sttMs,
              sttFirstTokenMs: runtime.sttFirstTokenMs,
              firstTokenMs,
              tutorLatencyMs: firstTokenMs,
              doneMs,
              totalMs: doneMs,
              ttsStartMs: runtime.ttsStartMs,
              ttsFirstByteMs: runtime.ttsFirstByteMs,
              aiMs: firstTokenMs,
              inputChars: effectiveUserInput.length,
              outputChars: finalText.length,
              metadata: {
                streamVoiceEnabled: ENABLE_STREAMING_VOICE_TTS,
                streamedVoiceChunks: voiceStreamChunkCount,
                ttsRetryCount: Number(runtime.ttsRetryCount || 0),
                ttsResumeCount: Number(runtime.ttsResumeCount || 0),
                ttsCutoffCount: Number(runtime.ttsCutoffCount || 0),
                ttsResumeReasons: runtime.ttsResumeReasons || [],
              },
            });
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || "";

          for (const frame of frames) {
            if (!frame.trim() || !frame.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(frame.slice(6));

              if (data.type === 'token') {
                if (firstTokenAtMs === null) {
                  firstTokenAtMs = Date.now();
                }
                setIsStreaming(true);
                streamedContent += data.content;
                if (ENABLE_STREAMING_VOICE_TTS) {
                  queueVoiceFromStream(streamedContent);
                }

                if (shouldUsePacedTyping) {
                  if (!assistantMessageId) {
                    upsertAssistantMessage('');
                  }
                  queuedContent += data.content;
                  startTypingPump();
                } else {
                  if (!assistantMessageId) {
                    upsertAssistantMessage(streamedContent);
                  } else {
                    const now = Date.now();
                    if (now - lastUpdateTime > UPDATE_INTERVAL) {
                      upsertAssistantMessage(streamedContent);
                      lastUpdateTime = now;
                    }
                  }
                }
              }

              else if (data.type === 'status') {
                const phase = String(data?.status?.phase || 'progress').trim() || 'progress';
                const label = String(data?.status?.label || 'Working...').trim() || 'Working...';
                const timestamp = String(data?.status?.timestamp || new Date().toISOString()).trim();
                setResearchStreamStatus({ phase, label, timestamp });
                setIsStreaming(true);

                if (!assistantMessageId && !streamedContent.trim()) {
                  upsertAssistantMessage(label);
                }

                if (phase === 'searching_sources' && !sawSearchStatus) {
                  sawSearchStatus = true;
                  recordLearningEffectSignal({
                    eventType: 'search_executed',
                    metadata: {
                      phase,
                    },
                  });
                }

                if ((phase === 'first_useful' || phase === 'synthesizing') && firstUsefulStatusAtMs === null) {
                  firstUsefulStatusAtMs = Date.now();
                  recordLearningEffectSignal({
                    eventType: 'first_useful_answer_latency',
                    metadata: {
                      latencyMs: Math.max(0, firstUsefulStatusAtMs - requestStartedAtMs),
                    },
                  });
                }

                if (phase === 'failed') {
                  recordLearningEffectSignal({
                    eventType: 'research_failed',
                    metadata: {
                      label,
                    },
                  });
                }
              }

              else if (data.type === 'done') {
                handleDoneEvent(data.metadata);
              }

              else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (err) {
              console.warn("SSE frame parse error", err, frame);
            }
          }
        }

        // Process any trailing frame that may not end with "\n\n".
        const trailing = buffer.trim();
        if (trailing.startsWith('data: ')) {
          try {
            const tailData = JSON.parse(trailing.slice(6));
            if (tailData.type === 'token') {
              streamedContent += tailData.content || '';
              if (shouldUsePacedTyping) {
                if (!assistantMessageId) upsertAssistantMessage('');
                queuedContent += tailData.content || '';
                startTypingPump();
              } else if (streamedContent) {
                upsertAssistantMessage(streamedContent);
              }
            } else if (tailData.type === 'status') {
              const phase = String(tailData?.status?.phase || 'progress').trim() || 'progress';
              const label = String(tailData?.status?.label || 'Working...').trim() || 'Working...';
              const timestamp = String(tailData?.status?.timestamp || new Date().toISOString()).trim();
              setResearchStreamStatus({ phase, label, timestamp });
              if (!assistantMessageId && !streamedContent.trim()) {
                upsertAssistantMessage(label);
              }
              if (phase === 'searching_sources' && !sawSearchStatus) {
                sawSearchStatus = true;
                recordLearningEffectSignal({
                  eventType: 'search_executed',
                  metadata: {
                    phase,
                  },
                });
              }
              if ((phase === 'first_useful' || phase === 'synthesizing') && firstUsefulStatusAtMs === null) {
                firstUsefulStatusAtMs = Date.now();
                recordLearningEffectSignal({
                  eventType: 'first_useful_answer_latency',
                  metadata: {
                    latencyMs: Math.max(0, firstUsefulStatusAtMs - requestStartedAtMs),
                  },
                });
              }
              if (phase === 'failed') {
                recordLearningEffectSignal({
                  eventType: 'research_failed',
                  metadata: {
                    label,
                  },
                });
              }
            } else if (tailData.type === 'done') {
              handleDoneEvent(tailData.metadata);
            } else if (tailData.type === 'error') {
              throw new Error(tailData.content || 'Unknown SSE error');
            }
          } catch (tailErr) {
            console.warn("Trailing SSE frame parse error", tailErr, trailing);
          }
        }

        // Safety: if we got content but never emitted a model bubble, emit it now.
        if (!assistantMessageId && streamedContent.trim()) {
          upsertAssistantMessage(streamedContent);
        }

        setTimeout(() => fetchMemory(), 2000);

      } catch (error: any) {
        setResearchStreamStatus(null);
        if (silentlyCanceledRequestIdsRef.current.has(requestId)) {
          silentlyCanceledRequestIdsRef.current.delete(requestId);
          stopTypingPump();
          return;
        }
        const message = String(error?.message || '');
        const isTransientFetchError =
          error instanceof TypeError ||
          message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          message.includes('AbortError');

        if (isTransientFetchError) {
          console.warn('[Copilot] Chat request failed after retry:', message || error);
        } else {
          console.error("Action Failed:", error);
        }
        if (forceWebSearch || researchModeRequested || researchStreamStatus !== null) {
          recordLearningEffectSignal({
            eventType: 'research_failed',
            metadata: {
              reason: message || String(error || 'unknown_error'),
            },
          });
        }
        stopTypingPump();
        setIsLoading(false);
        setIsStreaming(false);
        pendingVoiceReplyRef.current = false;
        setMessages(prev => [...prev, {
          id: `model-error-${Date.now()}`,
          role: 'model',
          content: buildConnectionRecoveryText(
            profile?.preferredLanguage,
            effectiveUserInput
          ),
          isError: true,
          timestamp: new Date(),
        }]);
      } finally {
        const isCurrentRequest = inFlightChatRequestRef.current?.id === requestId;
        if (isCurrentRequest) {
          inFlightChatRequestRef.current = null;
          setResearchStreamStatus(null);
        }
        if (isCurrentRequest && requestSucceeded && usedPreparedSelectionContext) {
          setPreparedSelectionContext(null);
        }
        silentlyCanceledRequestIdsRef.current.delete(requestId);

        if ((!shouldUsePacedTyping || !hasDoneEvent || typingFinalized) && isCurrentRequest) {
          setIsStreaming(false);
        }
        if (options?.turnId) {
          const turnId = options.turnId;
          setTimeout(() => {
            voiceLatencyByTurnRef.current.delete(turnId);
          }, 120000);
        }
        if (isCurrentRequest) {
          setActiveFullscreenPlusAction(null);
          setIsLoading(false);
        }
        scrollToBottom();
      }
    };

    if (filesToUpload.length > 0) {
      Promise.all(filesToUpload.map((file) => buildUploadPayload(file)))
        .then(async (payloads) => {
          fileDataForAction = payloads;
          let parsedArtifacts: TutorArtifact[] = [];
          try {
            const artifactResult = await api.artifacts.parse({
              fileData: payloads,
              prompt: effectiveUserInput,
              sessionId: activeSessionRef.current?.id || undefined,
            });
            parsedArtifacts = Array.isArray(artifactResult?.artifacts) ? artifactResult.artifacts : [];
            currentMessages = [
              ...baseMessages,
              buildDurableMessageFromUploadPayloads(
                userMessage,
                payloads,
                parsedArtifacts,
                Array.isArray(artifactResult?.systemNotices) ? artifactResult.systemNotices : []
              ),
            ];
          } catch {
            parsedArtifacts = [];
            currentMessages = [
              ...baseMessages,
              buildDurableMessageFromUploadPayloads(userMessage, payloads, parsedArtifacts),
            ];
          }
          setMessages(currentMessages);
          executeAction();
        })
        .catch((error: any) => {
          if (silentlyCanceledRequestIdsRef.current.has(requestId)) {
            silentlyCanceledRequestIdsRef.current.delete(requestId);
            return;
          }
          toast({
            variant: "destructive",
            title: "File Upload Error",
            description: String(error?.message || 'Could not read the selected file.'),
          });
          setSelectedFiles(filesToUpload);
          if (inFlightChatRequestRef.current?.id === requestId) {
            inFlightChatRequestRef.current = null;
            setIsLoading(false);
          }
        });
      return;
    }

    executeAction();
  }

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    const editedContent = String(content || '').trim();
    if (!editedContent || isLoading) return;

    try {
      const sessionData = await api.sessions.editMessage(messageId, editedContent);
      const parsedMessages = normalizeSessionMessages(sessionData.messages);
      const editedUserMessage = parsedMessages.find((message: Message) => message.id === messageId);
      const baseMessages = parsedMessages.filter((message: Message) => message.id !== messageId);

      setMessages(parsedMessages);
      setActiveSession(sessionData);
      setConversationState(sessionData.conversationState || DEFAULT_CONVERSATION_STATE);
      syncTutorDerivedState(sessionData.tutorState || {});
      updatePreloadCache({
        ...sessionData,
        messages: parsedMessages.map((message) => ({
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
        })),
      });

      if (!editedUserMessage) return;

      void handleSendMessage(null, editedContent, {
        baseMessages,
        existingUserMessage: editedUserMessage,
        overrideConversationState: sessionData.conversationState || DEFAULT_CONVERSATION_STATE,
        ignoreSelectedFile: true,
        preserveInput: true,
        editedMessageId: messageId,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not edit message',
        description: String(error?.message || 'Please try again.'),
      });
    }
  }, [handleSendMessage, isLoading, normalizeSessionMessages, syncTutorDerivedState, toast]);

  const handleContextualSelectionAction = useCallback((
    action: 'ask' | 'breakdown' | 'summarize' | 'save',
    payload: SelectionActionPayload
  ) => {
    const selectedText = String(payload.text || '').trim();
    if (!selectedText || isLoading) return;

    const sourceMessage = (messagesRef.current || []).find((message) => message.id === payload.messageId);
    const sourceArtifacts = Array.isArray((sourceMessage?.metadata as any)?.tutorArtifacts)
      ? (sourceMessage?.metadata as any)?.tutorArtifacts
      : [];
    const sourceArtifactLabel =
      String(payload.artifactLabel || sourceArtifacts[0]?.label || tutorState.activeArtifactLabels?.[0] || '').trim() || undefined;
    const sourceArtifactSummary =
      String(sourceArtifacts[0]?.summary || tutorState.activeArtifactSummary || '').trim() || undefined;
    if (action === 'save') {
      beginRevisionSaveFlow({
        message: sourceMessage || null,
        selectedText,
        sourceKind:
          payload.sourceKind === 'artifact'
            ? 'artifact'
            : payload.sourceKind === 'video_summary'
              ? 'video'
              : payload.sourceKind === 'study_material'
                ? 'artifact'
                : 'selected_text',
      });
      return;
    }

    if (action === 'ask') {
      const nextPreparedSelectionContext: PreparedSelectionContext = {
        selectedText,
        sourceMessageId: payload.messageId,
        sourceKind: payload.sourceKind,
        sourceArtifactLabel,
        sourceArtifactSummary,
        sourceVideoTitle: payload.videoTitle || sourceMessage?.videoData?.title,
        sourceVideoId: sourceMessage?.videoData?.id,
        sourceText: String(sourceMessage?.content || '').trim().slice(0, 1800) || undefined,
        sourceType: payload.sourceType,
        sourceDocumentId: payload.sourceDocumentId,
        selectionRange: payload.selectionRange,
        linkedArtifactId: sourceArtifacts[0]?.id,
        createdAtIso: new Date().toISOString(),
      };
      setPreparedSelectionContext(nextPreparedSelectionContext);
      setComposerContext((previous) => ({
        ...(previous || {}),
        inputOrigin: 'text',
        composerIntent: 'selection_context_ask',
        linkedArtifactId: sourceArtifacts[0]?.id || undefined,
      }));
      setComposerFocusSignal((prev) => prev + 1);
      return;
    }

    const tutorAction: TutorActionRequest = {
      id: action,
      selectedText,
      sourceMessageId: payload.messageId,
      sourceText: String(sourceMessage?.content || '').trim().slice(0, 1800) || undefined,
      sourceVideoId: sourceMessage?.videoData?.id,
      sourceVideoTitle: payload.videoTitle || sourceMessage?.videoData?.title,
      sourceArtifactLabel,
      sourceArtifactSummary,
      selectionSourceKind: payload.sourceKind,
      linkedArtifactId: sourceArtifacts[0]?.id,
      invokedFrom: 'selection_menu',
      sourceType: payload.sourceType,
      sourceDocumentId: payload.sourceDocumentId,
      selectionRange: payload.selectionRange,
    };

    const displayText = action === 'summarize'
      ? 'Summarize this selected part.'
      : 'Break down this selected part.';

    void handleSendMessage(null, displayText, {
      ignoreSelectedFile: true,
      preserveInput: true,
      tutorAction,
      displayUserMessage: false,
      persistUserMessage: false,
    });
  }, [beginRevisionSaveFlow, handleSendMessage, isLoading, tutorState.activeArtifactLabels, tutorState.activeArtifactSummary]);

  const handleContinueChat = async (session: ChatSession) => {
    try {
      if (isPreviewWorkspaceSessionId(session.id)) {
        const previewSession = getWorkspacePreviewSession(session.id);
        if (previewSession) {
          applyLoadedSession(previewSession, {
            historySeed: session,
            showToast: true,
            toastTitle: 'Demo session loaded',
            toastDescription: 'Preview data is ready so you can keep polishing the UI.',
          });
          return;
        }
      }
      const sessionData = await api.sessions.load(session.id);
      applyLoadedSession(sessionData, {
        historySeed: session,
        showToast: true,
        toastTitle: 'Session loaded',
      });
    } catch (error) {
      handleNewChat(false);
    }
  };

  const persistWorkspaceMessage = useCallback(async (message: Message) => {
    let sessionId = activeSessionRef.current?.id;
    if (!sessionId || isPreviewWorkspaceSessionId(sessionId)) {
      const newSession = await api.sessions.create();
      sessionId = newSession.sessionId;
      const previewTitle = String(
        activeSessionRef.current?.title || activeSessionRef.current?.topic || ''
      ).trim();
      const sessionPayload: ChatSession = {
        id: newSession.sessionId,
        title: previewTitle,
        topic: previewTitle || undefined,
        messages: [],
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt,
        tutorState: newSession.tutorState || {},
      };
      setActiveSession(sessionPayload);
      setConversationState(newSession.conversationState || DEFAULT_CONVERSATION_STATE);
      syncTutorDerivedState(newSession.tutorState || {});
      upsertHistoryEntry({
        id: sessionPayload.id,
        title: sessionPayload.title || '',
        createdAt: sessionPayload.createdAt,
        updatedAt: sessionPayload.updatedAt,
        firstMessage: message.content || null,
      });
    }
    if (!sessionId) {
      throw new Error('A study session is required before saving this tutor note.');
    }

    await api.chat.persistMessage({
      sessionId,
      currentSessionId: sessionId,
      conversationState,
      message,
    });

    const reloadedSession = await api.sessions.load(sessionId);
    applyLoadedSession(reloadedSession, { historySeed: activeSessionRef.current, showToast: false });
    return reloadedSession;
  }, [applyLoadedSession, conversationState]);

  const handleRunResearchFromMessage = useCallback(async (message: Message) => {
    if (isLoading) return;
    const sessionId = activeSessionRef.current?.id;
    const messagePresentation = resolveAssistantEnvelopeMetadata((message.metadata as any) || null).presentation;
    const topic =
      String(
        tutorState.activeTopic ||
        conversationState.lastStudyTopic ||
        activeSessionRef.current?.title ||
        messagePresentation?.basedOnArtifactLabel ||
        'this topic'
      ).trim() || 'this topic';
    const sourceCountBefore = Array.isArray(message.sources) ? message.sources.length : 0;
    const baseQuery = String(message.content || topic).trim().slice(0, 320);
    const query =
      sourceCountBefore > 0
        ? `Find another trusted source to verify this: ${baseQuery}`.slice(0, 400)
        : baseQuery;
    if (!query) return;

    setIsLoading(true);
    try {
      const runStartedAtMs = Date.now();
      const response = await api.research.run({
        query,
        sessionId: sessionId || undefined,
        topic,
        forceWebSearch: true,
        chatHistory: (messagesRef.current || []).slice(-10).map((entry) => ({
          role: entry.role,
          content: String(entry.content || '').slice(0, 1200),
        })),
      });

      const recommendedVideos = response.recommendedVideo ? [response.recommendedVideo] : [];
      const researchMeta: MessageResearchMeta = {
        queryUsed: response.queryUsed,
        trustSummary: response.result.trustSummary || null,
        limitations: response.result.limitations || null,
        notices: response.notices || null,
        recommendedVideos,
        researchIntent: response.intent,
        triggerType: response.result.triggerType || null,
        sourceReuseId: response.result.sourceReuseId || null,
        reuseHit: response.result.reuseHit === true,
        confidenceState: response.result.confidenceState || null,
        searchCount: typeof response.result.searchCount === 'number' ? response.result.searchCount : null,
        queryPlan: Array.isArray(response.result.queryPlan) ? response.result.queryPlan : null,
        firstUsefulLatencyMs:
          typeof response.result.firstUsefulLatencyMs === 'number'
            ? response.result.firstUsefulLatencyMs
            : null,
        completedLatencyMs:
          typeof response.result.latencyMs === 'number'
            ? response.result.latencyMs
            : null,
        latency:
          typeof response.result.firstUsefulLatencyMs === 'number' ||
          typeof response.result.latencyMs === 'number'
            ? {
                firstUsefulLatencyMs:
                  typeof response.result.firstUsefulLatencyMs === 'number'
                    ? response.result.firstUsefulLatencyMs
                    : undefined,
                completedLatencyMs:
                  typeof response.result.latencyMs === 'number'
                    ? response.result.latencyMs
                    : undefined,
              }
            : null,
      };

      const researchMessage: Message = {
        id: `model-research-${Date.now()}`,
        role: 'model',
        content: buildResearchMessageContent(response),
        timestamp: new Date(),
        sources: mapResearchSourcesToCitations(response.result.sources),
        videoData: mapRecommendedVideoToVideoData(response.recommendedVideo),
        metadata: {
          presentation: {
            cardKind: 'source_supported',
            sourceConfidence:
              response.result.sources.some((source) => source.trustTier === 'high')
                ? 'high'
                : response.result.sources.some((source) => source.trustTier === 'medium')
                  ? 'medium'
                  : 'limited',
            nextStepPrompt: response.result.nextStepPrompt || undefined,
            suggestedActions: ['summarize', 'practice', 'save'],
            uiTone: 'calm',
          },
          research: researchMeta,
        },
      };

      await persistWorkspaceMessage(researchMessage);

      recordLearningEffectSignal({
        eventType: 'research_mode_used',
        messageId: message.id,
        topic,
        metadata: {
          queryUsed: response.queryUsed,
          sourceCount: response.result.sources.length,
          noticeCodes: (response.notices || []).map((notice) => notice.code),
        },
      });

      if (sourceCountBefore > 0) {
        recordLearningEffectSignal({
          eventType: 'compare_sources_used',
          messageId: message.id,
          topic,
          metadata: {
            priorSourceCount: sourceCountBefore,
            nextSourceCount: response.result.sources.length,
          },
        });
      }

      const searchCount =
        typeof response.result.searchCount === 'number'
          ? Math.max(0, Math.floor(response.result.searchCount))
          : Array.isArray(response.result.queryPlan)
            ? response.result.queryPlan.length
            : 0;
      if (searchCount > 0) {
        recordLearningEffectSignal({
          eventType: 'search_executed',
          messageId: message.id,
          topic,
          metadata: {
            searchCount,
            triggerType: response.result.triggerType || null,
          },
        });
      }

      if (Array.isArray(response.result.sources) && response.result.sources.length > 0) {
        recordLearningEffectSignal({
          eventType: 'sources_selected',
          messageId: message.id,
          topic,
          metadata: {
            sourceCount: response.result.sources.length,
            confidenceState: response.result.confidenceState || null,
          },
        });
      }

      if (typeof response.result.firstUsefulLatencyMs === 'number') {
        recordLearningEffectSignal({
          eventType: 'first_useful_answer_latency',
          messageId: message.id,
          topic,
          metadata: {
            latencyMs: Math.max(0, Math.floor(response.result.firstUsefulLatencyMs)),
          },
        });
      }

      const completedLatencyMs =
        typeof response.result.latencyMs === 'number'
          ? Math.max(0, Math.floor(response.result.latencyMs))
          : Math.max(0, Date.now() - runStartedAtMs);
      recordLearningEffectSignal({
        eventType: 'response_latency',
        messageId: message.id,
        topic,
        metadata: {
          latencyMs: completedLatencyMs,
          triggerType: response.result.triggerType || null,
        },
      });

      if (response.result.reuseHit) {
        recordLearningEffectSignal({
          eventType: 'follow_up_reuse_hit',
          messageId: message.id,
          topic,
          metadata: {
            sourceReuseId: response.result.sourceReuseId || null,
          },
        });
      }

      if (
        response.result.confidenceState === 'low' ||
        response.result.confidenceState === 'mixed' ||
        response.result.confidenceState === 'insufficient'
      ) {
        recordLearningEffectSignal({
          eventType: 'low_confidence_outcome',
          messageId: message.id,
          topic,
          metadata: {
            confidenceState: response.result.confidenceState,
            sourceCount: response.result.sources.length,
          },
        });
      }

      if ((response.notices || []).length > 0 || (response.result.limitations || []).length > 0) {
        recordLearningEffectSignal({
          eventType: 'fallback_notice_shown',
          messageId: message.id,
          topic,
          metadata: {
            noticeCodes: (response.notices || []).map((notice) => notice.code),
            limitations: response.result.limitations || [],
          },
        });
        recordLearningEffectSignal({
          eventType: 'fallback_notice_honest',
          messageId: message.id,
          topic,
          metadata: {
            noticeCodes: (response.notices || []).map((notice) => notice.code),
          },
        });
      }

      toast({
        title: 'Research added to Study Chat',
        description: 'I saved a source-backed explanation into this session.',
      });
    } catch (error) {
      recordLearningEffectSignal({
        eventType: 'research_failed',
        messageId: message.id,
        topic,
        metadata: {
          reason:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : 'unknown_research_error',
        },
      });
      const messageText =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not run research right now.';
      toast({
        title: 'Could not run research',
        description: messageText,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationState.lastStudyTopic, isLoading, persistWorkspaceMessage, recordLearningEffectSignal, toast, tutorState.activeTopic]);

  const handleRecommendVideosFromMessage = useCallback(async (message: Message) => {
    if (isLoading) return;
    const sessionId = activeSessionRef.current?.id;
    const topic =
      String(
        tutorState.activeTopic ||
        conversationState.lastStudyTopic ||
        activeSessionRef.current?.title ||
        'this topic'
      ).trim() || 'this topic';
    const query = String(message.content || topic).trim().slice(0, 400);
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await api.research.recommendVideos({
        query,
        topic,
        sessionId: sessionId || undefined,
        limit: 4,
      });

      const primaryVideo = response.videos[0] || null;
      const recommendationMessage: Message = {
        id: `model-video-${Date.now()}`,
        role: 'model',
        content: buildVideoRecommendationMessageContent(response),
        timestamp: new Date(),
        videoData: mapRecommendedVideoToVideoData(primaryVideo),
        metadata: {
          presentation: {
            cardKind: 'source_supported',
            uiTone: 'calm',
            suggestedActions: ['summarize', 'practice', 'save'],
          },
          research: {
            queryUsed: response.queryUsed,
            notices: response.notices || null,
            recommendedVideos: response.videos,
            videoIntent: response.intent,
          } satisfies MessageResearchMeta,
        },
      };

      await persistWorkspaceMessage(recommendationMessage);

      recordLearningEffectSignal({
        eventType: 'video_recommendation_acceptance_rate',
        messageId: message.id,
        topic,
        metadata: {
          queryUsed: response.queryUsed,
          resultCount: response.videos.length,
          intent: response.intent,
        },
      });

      toast({
        title: 'Video matches ready',
        description: 'I added contextual video recommendations to this session.',
      });
    } catch (error) {
      const messageText =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not recommend videos right now.';
      toast({
        title: 'Could not recommend videos',
        description: messageText,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationState.lastStudyTopic, isLoading, persistWorkspaceMessage, recordLearningEffectSignal, toast, tutorState.activeTopic]);

  const handleContinueFromVideo = useCallback(async (message: Message, video: RecommendedVideo | VideoData) => {
    if (isLoading) return;
    const videoId = String((video as RecommendedVideo).videoId || (video as VideoData).videoId || (video as VideoData).id || '').trim();
    if (!videoId) return;

    const sessionId = activeSessionRef.current?.id;
    const topic =
      String(
        tutorState.activeTopic ||
        conversationState.lastStudyTopic ||
        activeSessionRef.current?.title ||
        message.videoData?.title ||
        'this topic'
      ).trim() || 'this topic';

    setIsLoading(true);
    try {
      const response = await api.research.getVideoContext(videoId, {
        sessionId: sessionId || undefined,
        title: String(video.title || message.videoData?.title || '').trim() || undefined,
        topic,
        whyRecommended: String(video.whyRecommended || message.videoData?.whyRecommended || '').trim() || undefined,
      });

      const contextMessage: Message = {
        id: `model-video-context-${Date.now()}`,
        role: 'model',
        content: buildVideoContextMessageContent(response),
        timestamp: new Date(),
        videoData: {
          id: response.videoId,
          videoId: response.videoId,
          title: response.title || String(video.title || message.videoData?.title || 'Recommended video').trim(),
          whyRecommended: response.whyRecommended || String(video.whyRecommended || message.videoData?.whyRecommended || '').trim() || null,
          transcriptAvailable: response.transcriptAvailable,
          language: (video as RecommendedVideo).language || message.videoData?.language || null,
          trustTier: (video as RecommendedVideo).trustTier || message.videoData?.trustTier || null,
          intent: (video as RecommendedVideo).intent || message.videoData?.intent || null,
          thumbnailUrl: (video as RecommendedVideo).thumbnailUrl || message.videoData?.thumbnailUrl || undefined,
          channelTitle: (video as RecommendedVideo).channelTitle || message.videoData?.channelTitle || undefined,
        },
        metadata: {
          presentation: {
            cardKind: 'source_supported',
            uiTone: 'calm',
            suggestedActions: ['summarize', 'practice', 'save'],
            basedOnVideoTitle: response.title || undefined,
          },
          research: {
            notices: response.notices || null,
            recommendedVideos: [
              {
                videoId: response.videoId,
                title: response.title || String(video.title || 'Recommended video').trim(),
                whyRecommended: response.whyRecommended || String(video.whyRecommended || '').trim() || null,
                transcriptAvailable: response.transcriptAvailable,
                language: (video as RecommendedVideo).language || null,
                intent: (video as RecommendedVideo).intent || null,
                thumbnailUrl: (video as RecommendedVideo).thumbnailUrl || null,
                channelTitle: (video as RecommendedVideo).channelTitle || null,
                trustTier: (video as RecommendedVideo).trustTier || null,
              },
            ],
          } satisfies MessageResearchMeta,
        },
      };

      await persistWorkspaceMessage(contextMessage);

      recordLearningEffectSignal({
        eventType: 'video_recommendation_opened',
        messageId: message.id,
        topic,
        metadata: {
          videoId: response.videoId,
          transcriptAvailable: response.transcriptAvailable,
        },
      });
      recordLearningEffectSignal({
        eventType: 'video_context_reuse_rate',
        messageId: message.id,
        topic,
        metadata: {
          videoId: response.videoId,
        },
      });
      if (!response.transcriptAvailable) {
        recordLearningEffectSignal({
          eventType: 'transcript_unavailable_rate',
          messageId: message.id,
          topic,
          metadata: {
            videoId: response.videoId,
            noticeCodes: (response.notices || []).map((notice) => notice.code),
          },
        });
      }

      toast({
        title: 'Video brought into Study Chat',
        description: 'I added the video context so we can keep working from it here.',
      });
    } catch (error) {
      const messageText =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not continue from this video right now.';
      toast({
        title: 'Could not continue from video',
        description: messageText,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationState.lastStudyTopic, isLoading, persistWorkspaceMessage, recordLearningEffectSignal, toast, tutorState.activeTopic]);

  const handleToggleRevisionPin = useCallback(async (item: RevisionItem) => {
    if (isPreviewRevisionEntityId(item.id)) {
      showRevisionPreviewToast('Pinning and updates');
      return;
    }
    try {
      await api.revision.updateItem(item.id, {
        isPinned: !item.isPinned,
      });
      await syncRevisionPanelState();
      toast({
        title: item.isPinned ? 'Removed from pinned' : 'Pinned for revision',
        description: item.isPinned
          ? 'This item is no longer pinned.'
          : 'This item will stay easy to find during revision.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update this revision item right now.';
      toast({
        title: 'Could not update this item',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleUpdateRevisionMastery = useCallback(async (item: RevisionItem, mastery: RevisionMastery | null) => {
    if (isPreviewRevisionEntityId(item.id)) {
      showRevisionPreviewToast('Mastery updates');
      return;
    }
    try {
      await api.revision.updateItem(item.id, { mastery });
      await syncRevisionPanelState();
      if (mastery === 'getting_better' || mastery === 'almost_there' || mastery === 'confident') {
        recordLearningEffectSignal({
          eventType: 'topic_return_with_improvement',
          revisionItemId: item.id,
          topic: item.topic || item.title,
          metadata: {
            mastery,
            contentType: item.contentType,
          },
        });
      }
      const masteryLabel =
        mastery === 'still_learning'
          ? 'Still learning'
          : mastery === 'getting_better'
            ? 'Getting better'
            : mastery === 'almost_there'
              ? 'Almost there'
            : mastery === 'confident'
              ? 'Confident'
              : 'Not set';
      toast({
        title: 'Revision progress updated',
        description: `This item is now marked as ${masteryLabel.toLowerCase()}.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update mastery right now.';
      toast({
        title: 'Could not update mastery',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [recordLearningEffectSignal, showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleSaveRevisionStudentNote = useCallback(async (item: RevisionItem, studentNote: string) => {
    if (isPreviewRevisionEntityId(item.id)) {
      showRevisionPreviewToast('Saving student notes');
      return;
    }
    try {
      await api.revision.updateItem(item.id, {
        studentNote: studentNote.trim() || null,
      });
      await syncRevisionPanelState();
      toast({
        title: studentNote.trim() ? 'Revision note saved' : 'Revision note cleared',
        description: studentNote.trim()
          ? 'Your reminder is attached to this revision item.'
          : 'This item no longer has a personal note.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not save your note right now.';
      toast({
        title: 'Could not save your note',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleUpdateRevisionItem = useCallback(async (item: RevisionItem, patch: UpdateRevisionItemRequest) => {
    if (isPreviewRevisionEntityId(item.id)) {
      showRevisionPreviewToast('Editing revision notes');
      return;
    }
    try {
      await api.revision.updateItem(item.id, patch);
      if (Object.prototype.hasOwnProperty.call(patch, 'collectionId') && patch.collectionId !== item.collectionId) {
        setSelectedRevisionCollection(null);
      }
      await syncRevisionPanelState();
      toast({
        title: 'Revision note updated',
        description: 'Your note changes are saved and organized for the next revision pass.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update this revision note right now.';
      toast({
        title: 'Could not update this note',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleUpdateRevisionItemsBatch = useCallback(async (
    updates: Array<{ itemId: string; patch: UpdateRevisionItemRequest }>
  ) => {
    const realUpdates = updates.filter((entry) => !isPreviewRevisionEntityId(entry.itemId));
    if (!realUpdates.length) {
      showRevisionPreviewToast('Organizing revision notes');
      return;
    }
    try {
      await api.revision.updateItemsBatch({ updates: realUpdates });
      if (
        selectedRevisionCollection &&
        realUpdates.some((entry) =>
          Object.prototype.hasOwnProperty.call(entry.patch, 'collectionId') &&
          entry.patch.collectionId !== selectedRevisionCollection.id
        )
      ) {
        setSelectedRevisionItemId(null);
      }
      await syncRevisionPanelState();
      toast({
        title: 'Notebook updated',
        description: 'Your note order and notebook organization are saved.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update these revision notes right now.';
      toast({
        title: 'Could not organize these notes',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [selectedRevisionCollection, showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleUpdateRevisionCollection = useCallback(async (
    collection: RevisionCollection,
    patch: UpdateRevisionCollectionRequest
  ) => {
    if (isPreviewRevisionEntityId(collection.id)) {
      showRevisionPreviewToast('Editing notebooks');
      return;
    }
    try {
      await api.revision.updateCollection(collection.id, patch);
      await syncRevisionPanelState();
      toast({
        title: 'Notebook updated',
        description: 'Your notebook identity is saved.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update this notebook right now.';
      toast({
        title: 'Could not update this notebook',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleDeleteRevisionCollection = useCallback(async (
    collection: RevisionCollection,
    mode: DeleteRevisionCollectionMode
  ) => {
    if (isPreviewRevisionEntityId(collection.id)) {
      showRevisionPreviewToast(mode === 'delete_with_items' ? 'Deleting notebooks and notes' : 'Dissolving notebooks');
      return;
    }
    try {
      const result = await api.revision.deleteCollection(collection.id, mode);
      setSelectedRevisionCollection(null);
      setSelectedRevisionItemId(null);
      await syncRevisionPanelState();
      toast({
        title: mode === 'delete_with_items' ? 'Notebook deleted' : 'Notebook dissolved',
        description:
          mode === 'delete_with_items'
            ? `${result.deletedItemCount} note${result.deletedItemCount === 1 ? '' : 's'} removed with the notebook.`
            : `${result.dissolvedItemCount} note${result.dissolvedItemCount === 1 ? '' : 's'} moved to standalone saves.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not remove this notebook right now.';
      toast({
        title: 'Could not update this notebook',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleDeleteRevisionItem = useCallback(async (item: RevisionItem) => {
    if (isPreviewRevisionEntityId(item.id)) {
      showRevisionPreviewToast('Deleting revision notes');
      return;
    }
    try {
      await api.revision.deleteItem(item.id);
      setSelectedRevisionItemId(null);
      await syncRevisionPanelState();
      toast({
        title: 'Revision note deleted',
        description: 'The note was removed from your revision library.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not delete this revision note right now.';
      toast({
        title: 'Could not delete this note',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleRunRevisionAction = useCallback(async (
    item: RevisionItem,
    actionType: 'quiz' | 'breakdown' | 'similar_question'
  ) => {
    if (isPreviewRevisionEntityId(item.id)) {
      const actionLabel =
        actionType === 'quiz'
          ? 'Quiz mode'
          : actionType === 'breakdown'
            ? 'Break down again'
            : 'Similar-question practice';
      showRevisionPreviewToast(actionLabel);
      return;
    }
    try {
      const response = await api.revision.runAction(item.id, actionType);
      await syncRevisionPanelState();
      recordLearningEffectSignal({
        eventType: 'used_revision_again',
        revisionItemId: item.id,
        topic: item.topic || item.title,
        metadata: {
          actionType,
          contentType: item.contentType,
        },
      });
      recordLearningEffectSignal({
        eventType: 'revision_reuse',
        revisionItemId: item.id,
        topic: item.topic || item.title,
        metadata: {
          actionType,
        },
      });
      const session =
        historyRef.current.find((entry) => entry.id === response.sessionId) ||
        ({
          id: response.sessionId,
          title: item.topic || item.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ChatSession);
      await handleContinueChat(session);

      const successTitle =
        actionType === 'quiz'
          ? 'Quiz ready'
          : actionType === 'breakdown'
            ? 'Breakdown ready'
            : 'Similar question ready';
      const successDescription =
        actionType === 'quiz'
          ? 'I opened a guided revision prompt in Study Chat.'
          : actionType === 'breakdown'
            ? 'I opened a clearer step-by-step version in Study Chat.'
            : 'I opened a similar-question practice prompt in Study Chat.';
      toast({
        title: successTitle,
        description: successDescription,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not start this revision action right now.';
      const failureTitle =
        actionType === 'quiz'
          ? 'Could not start quiz'
          : actionType === 'breakdown'
            ? 'Could not open breakdown'
            : 'Could not open similar question';
      toast({
        title: failureTitle,
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [handleContinueChat, recordLearningEffectSignal, showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleQuizRevisionItem = useCallback(async (item: RevisionItem) => {
    await handleRunRevisionAction(item, 'quiz');
  }, [handleRunRevisionAction]);

  const handleBreakdownRevisionItem = useCallback(async (item: RevisionItem) => {
    await handleRunRevisionAction(item, 'breakdown');
  }, [handleRunRevisionAction]);

  const handleSimilarQuestionRevisionItem = useCallback(async (item: RevisionItem) => {
    await handleRunRevisionAction(item, 'similar_question');
  }, [handleRunRevisionAction]);

  const handleStartRevisionMode = useCallback(async (
    context: { collectionId?: string; itemId?: string }
  ): Promise<GuidedRevisionSessionStartResult | null> => {
    if (isPreviewRevisionEntityId(context.itemId) || isPreviewRevisionEntityId(context.collectionId)) {
      showRevisionPreviewToast('Guided revision mode');
      return null;
    }
    try {
      const payload = context.itemId
        ? { sourceType: 'item' as const, itemId: context.itemId }
        : context.collectionId
          ? { sourceType: 'collection' as const, collectionId: context.collectionId }
          : { sourceType: 'queue' as const };
      const response = await api.revision.startGuidedSession(payload);
      await syncRevisionPanelState();
      toast({
        title: 'Guided revision ready',
        description: 'Starting a focused recall-first revision flow for this item.',
      });
      return response;
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not start guided revision right now.';
      toast({
        title: 'Could not start revision mode',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [showRevisionPreviewToast, syncRevisionPanelState, toast]);

  const handleApplyRevisionGroupingSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const response = await api.revision.applyGroupingSuggestion(suggestionId);
      await syncRevisionPanelState();
      toast({
        title: 'Revision list created',
        description: response?.collection?.title
          ? `Saved under ${response.collection.title}.`
          : 'Your saved items were grouped into a revision list.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not apply this suggestion right now.';
      toast({
        title: 'Could not group those items',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [syncRevisionPanelState, toast]);

  const handleSelectRevisionCollection = useCallback((collection: RevisionCollection | null) => {
    if (collection) {
      setSelectedRevisionItemId(null);
      void loadRevisionCollection(collection, revisionSearchQuery);
      return;
    }
    setSelectedRevisionItemId(null);
    setSelectedRevisionCollection(null);
    setSelectedRevisionItems([]);
  }, [loadRevisionCollection, revisionSearchQuery]);

  const handleContinueFromRevisionItemSession = useCallback((sessionId: string) => {
    if (isPreviewRevisionEntityId(sessionId)) {
      const previewSession = getWorkspacePreviewSession(sessionId);
      if (previewSession) {
        void handleContinueChat(previewSession);
        return;
      }
      showRevisionPreviewToast('Returning to the source session');
      return;
    }
    const session =
      historyRef.current.find((entry) => entry.id === sessionId) ||
      ({
        id: sessionId,
        title: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ChatSession);
    void handleContinueChat(session);
  }, [handleContinueChat, showRevisionPreviewToast]);

  const handleDeleteChat = async (sessionId: string) => {
    try {
      setHistory(prev => prev.filter(s => s.id !== sessionId));
      setSidebarHistorySessions((prev) => prev.filter((session) => session.id !== sessionId));
      setSidebarHistoryPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      if (isPreviewWorkspaceSessionId(sessionId)) {
        if (activeSession?.id === sessionId) {
          handleNewChat(false);
        }
        toast({ title: 'Preview session removed' });
        return;
      }
      await api.sessions.delete(sessionId);
      if (activeSession?.id === sessionId) {
        handleNewChat(false);
      }
      if (activeTab === 'history') {
        void refreshHistory(historyPagination.page, searchQuery);
      }
      toast({ title: "Session Deleted" });
    } catch (error) {
      void refreshHistory(historyPagination.page, searchQuery);
    }
  };

  const handleTutorWorkspaceAction = useCallback((action: TutorQuickAction, message: Message) => {
    if (action === 'save') {
      beginRevisionSaveFlow({
        message,
        sourceKind: message.videoData?.id ? 'video' : message.image?.src ? 'artifact' : 'assistant_message',
      });
      return;
    }

    const sourceArtifacts = Array.isArray((message.metadata as any)?.tutorArtifacts)
      ? (message.metadata as any).tutorArtifacts
      : [];
    const sourceText = String(message.content || '').trim().slice(0, 1800);
    const topicHint =
      String(
        tutorState.activeTopic ||
        conversationState.lastStudyTopic ||
        conversationState.lastSearchTopic?.[0] ||
        activeSessionRef.current?.title ||
        'this topic'
      ).trim() || 'this topic';

    const tutorAction: TutorActionRequest = {
      id: action,
      sourceMessageId: message.id,
      sourceText,
      sourceVideoId: message.videoData?.id,
      sourceVideoTitle: message.videoData?.title,
      sourceArtifactLabel: String(sourceArtifacts[0]?.label || tutorState.activeArtifactLabels?.[0] || '').trim() || undefined,
      sourceArtifactSummary: String(
        sourceArtifacts[0]?.summary ||
        tutorState.activeArtifactSummary ||
        ''
      ).trim() || undefined,
      invokedFrom: 'assistant_card',
    };

    const hiddenPrompt = buildHiddenTutorActionPrompt(
      tutorAction,
      action === 'practice' ? topicHint : undefined
    );

    void handleSendMessage(null, hiddenPrompt, {
      ignoreSelectedFile: true,
      preserveInput: true,
      tutorAction,
      displayUserMessage: false,
      persistUserMessage: false,
    });
    const isResearchBackedMessage = Array.isArray(message.sources) && message.sources.length > 0;
    if (action === 'hint') {
      recordLearningEffectSignal({
        eventType: 'chose_hint_before_full_explanation',
        messageId: message.id,
        metadata: { source: 'tutor_quick_action' },
      });
    }
    if (action === 'summarize' && isResearchBackedMessage) {
      recordLearningEffectSignal({
        eventType: 'simplify_after_research',
        messageId: message.id,
        metadata: {
          sourceCount: message.sources?.length || 0,
          source: 'tutor_quick_action',
        },
      });
    }
    if (action === 'practice') {
      recordLearningEffectSignal({
        eventType: 'used_practice_path',
        messageId: message.id,
        metadata: { source: 'tutor_quick_action' },
      });
    }
  }, [beginRevisionSaveFlow, conversationState.lastSearchTopic, conversationState.lastStudyTopic, handleSendMessage, recordLearningEffectSignal, tutorState.activeArtifactLabels, tutorState.activeArtifactSummary, tutorState.activeTopic]);

  const handleSavePreferences = async (data: any) => {
    setIsSavingProfile(true);
    try {
      const backendPreferredLanguage = (languageFrontendToBackend as any)[data.preferredLanguage] || 'english';
      const nextThemePreference = normalizeCopilotThemePreference(data?.copilotThemePreference);
      const nextStudyAtmosphere = normalizeStudyAtmospherePreference(data?.studyAtmosphere);
      const nextMediaPreferences = normalizeMediaPreferences(data?.mediaPreferences);
      const nextLearningStyleSignals = normalizeLearningStyleSignals(data?.learningStyleSignals);
      const incomingSessionLanguagePatch =
        data?.sessionLanguageState && typeof data.sessionLanguageState === 'object'
          ? data.sessionLanguageState
          : null;
      const nextSessionLanguageState = mergeSessionLanguageState(
        sessionLanguageState,
        incomingSessionLanguagePatch,
        backendPreferredLanguage
      );
      const payload = {
        preferredLanguage: backendPreferredLanguage,
        interests: data.interests || [],
        sessionLanguageState: nextSessionLanguageState,
        copilotThemePreference: nextThemePreference,
        studyAtmosphere: nextStudyAtmosphere,
        mediaPreferences: nextMediaPreferences,
        learningStyleSignals: nextLearningStyleSignals,
      };
      const savedPreferences = await api.preferences.update(payload);
      const resolvedBackendLanguage = String(savedPreferences?.preferredLanguage || backendPreferredLanguage);
      const frontendPreferredLanguage = (languageBackendToFrontend as any)[resolvedBackendLanguage] || 'English';
      const resolvedInterests = Array.isArray(savedPreferences?.interests)
        ? savedPreferences.interests
        : payload.interests;
      const resolvedThemePreference = normalizeCopilotThemePreference(
        savedPreferences?.copilotThemePreference || nextThemePreference
      );
      const resolvedStudyAtmosphere = normalizeStudyAtmospherePreference(
        savedPreferences?.studyAtmosphere || nextStudyAtmosphere
      );
      const resolvedMediaPreferences = normalizeMediaPreferences(
        savedPreferences?.mediaPreferences || nextMediaPreferences
      );
      const resolvedLearningStyleSignals = normalizeLearningStyleSignals(
        savedPreferences?.learningStyleSignals || nextLearningStyleSignals
      );
      const resolvedLastUpdatedAt = savedPreferences?.lastUpdatedAt || data.lastUpdatedAt || new Date().toISOString();
      const resolvedSessionLanguageState = mergeSessionLanguageState(
        nextSessionLanguageState,
        savedPreferences?.sessionLanguageState || null,
        resolvedBackendLanguage
      );
      setSessionLanguageState(resolvedSessionLanguageState);
      setCopilotThemePreference(resolvedThemePreference);
      setStudyAtmospherePreference(resolvedStudyAtmosphere);
      updateProfile({
        preferredLanguage: frontendPreferredLanguage,
        interests: resolvedInterests,
        lastUpdatedAt: resolvedLastUpdatedAt,
        mediaPreferences: resolvedMediaPreferences,
        learningStyleSignals: resolvedLearningStyleSignals,
      });
      toast({ title: 'Preferences saved' });
      setTimeout(() => setView('chat'), 1000);
      return {
        preferredLanguage: frontendPreferredLanguage,
        interests: resolvedInterests,
        lastUpdatedAt: resolvedLastUpdatedAt,
        sessionLanguageState: resolvedSessionLanguageState,
        copilotThemePreference: resolvedThemePreference,
        studyAtmosphere: resolvedStudyAtmosphere,
        mediaPreferences: resolvedMediaPreferences,
        learningStyleSignals: resolvedLearningStyleSignals,
      };
    } finally {
      setIsSavingProfile(false);
    }
  };

  const recordMetacognitiveSignal = useCallback(
    async (
      payload: MetacognitiveChoicePayload,
      options?: {
        sourceMessageId?: string | null;
        metadata?: Record<string, unknown> | null;
      }
    ) => {
      const response = await api.metacognition.recordEvent({
        eventType: payload.eventType,
        sessionId: activeSession?.id || null,
        sourceMessageId: options?.sourceMessageId || null,
        confidence: payload.confidence || null,
        problemFraming: payload.problemFraming || null,
        errorType: payload.errorType || null,
        strategyPreference: payload.strategyPreference || null,
        transferReadiness: payload.transferReadiness || null,
        confidenceSelfCheck: payload.confidenceSelfCheck || null,
        supportPreference: payload.supportPreference || null,
        note: payload.note || null,
        metadata: {
          ...(options?.metadata || {}),
          ...(payload.progressCheck ? { progressCheck: payload.progressCheck } : {}),
        },
      });

      setMetacognitiveProfile({
        ...(response.profile || {}),
        lastReflectionSignal:
          response.reflectionSignal || response.profile?.lastReflectionSignal || null,
      });
      const mergedSnapshot =
        mergeMetacognitiveState(response.profile?.recentSnapshot, response.snapshot || payload.snapshotPatch || null);
      setMetacognitiveState(mergedSnapshot);
      setTutorState((prev) => ({
        ...(prev || {}),
        metacognitiveState: mergedSnapshot,
        reflectionSignal:
          response.reflectionSignal || response.profile?.lastReflectionSignal || prev?.reflectionSignal || null,
        lastReflectAt: new Date().toISOString(),
        lastReflectTopic:
          String((options?.metadata as any)?.topic || '').trim() || prev?.lastReflectTopic,
        lastReflectType: prev?.lastReflectType,
        reflectSequenceId: prev?.reflectSequenceId,
        reflectEligibilityScore: prev?.reflectEligibilityScore,
        reflectAnsweredRecently: true,
        reflectDismissedRecently: false,
        topicMastery: response.topicMastery ?? prev?.topicMastery ?? null,
        weakTopicRecovery: response.weakTopicRecovery ?? prev?.weakTopicRecovery ?? null,
      }));
      return response;
    },
    [activeSession?.id]
  );

  const handleMetacognitiveChoice = useCallback(
    async (message: Message, payload: MetacognitiveChoicePayload) => {
      try {
        const canonicalMessageMeta = resolveAssistantEnvelopeMetadata((message.metadata as any) || null);
        const presentation = canonicalMessageMeta.presentation;
        const reflectCard = presentation?.reflectCard || null;
        const topicHint =
          String(
            reflectCard?.topic ||
            presentation?.topicMastery?.topic ||
            presentation?.weakTopicRecovery?.topic ||
            tutorState.activeTopic ||
            conversationState.lastStudyTopic ||
            activeSessionRef.current?.title ||
            'this topic'
          ).trim() || 'this topic';
        const subjectHint =
          String(
            reflectCard?.subject ||
            presentation?.topicMastery?.subject ||
            presentation?.weakTopicRecovery?.subject ||
            tutorState.activeSubject ||
            ''
          ).trim() || null;

        await recordMetacognitiveSignal(payload, {
          sourceMessageId: message.id,
          metadata: {
            source: 'chat_message',
            promptType: presentation?.reflectionPromptType || null,
            promptText: presentation?.reflectionPrompt || null,
            promptVariant: reflectCard?.variant || null,
            activeTopic: tutorState.activeTopic || null,
            topic: topicHint,
            subject: subjectHint,
          },
        });

        const requestedSupport =
          payload.supportPreference ||
          (payload.progressCheck === 'hint_first'
            ? 'small_hint'
            : payload.progressCheck === 'ready_to_try' ||
                payload.progressCheck === 'let_me_try_one_now' ||
                payload.progressCheck === 'quick_test'
              ? 'practice_question'
              : payload.progressCheck === 'show_worked_example'
                ? 'worked_example'
                : payload.progressCheck === 'still_confusing'
                  ? 'simpler_explanation'
                  : null);

        if (
          payload.progressCheck === 'let_me_try_one_now' ||
          payload.progressCheck === 'ready_to_try' ||
          payload.progressCheck === 'quick_test'
        ) {
          recordLearningEffectSignal({
            eventType: 'attempted_before_help',
            messageId: message.id,
            topic: topicHint,
            metadata: {
              source: 'reflection_card',
              progressCheck: payload.progressCheck,
            },
          });
        }
        if (payload.eventType === 'success_explained' || payload.transferReadiness === 'can_explain') {
          recordLearningEffectSignal({
            eventType: 'explained_in_own_words',
            messageId: message.id,
            metadata: {
              promptType: presentation?.reflectionPromptType || null,
            },
          });
        }
        if (payload.transferReadiness === 'can_reuse') {
          recordLearningEffectSignal({
            eventType: 'transfer_success',
            messageId: message.id,
            metadata: {
              promptType: presentation?.reflectionPromptType || null,
            },
          });
        }
        if (requestedSupport === 'small_hint') {
          recordLearningEffectSignal({
            eventType: 'chose_hint_before_full_explanation',
            messageId: message.id,
            topic: topicHint,
            metadata: { source: 'reflection_card' },
          });
        }
        if (requestedSupport === 'practice_question') {
          recordLearningEffectSignal({
            eventType: 'used_practice_path',
            messageId: message.id,
            topic: topicHint,
            metadata: { source: 'reflection_card' },
          });
        }

        const sourceArtifacts = Array.isArray((message.metadata as any)?.tutorArtifacts)
          ? (message.metadata as any).tutorArtifacts
          : [];
        const tutorActionBase: TutorActionRequest = {
          id: 'ask',
          sourceMessageId: message.id,
          sourceText: String(message.content || '').trim().slice(0, 1800),
          sourceVideoId: message.videoData?.id,
          sourceVideoTitle: message.videoData?.title,
          sourceArtifactLabel:
            String(sourceArtifacts[0]?.label || tutorState.activeArtifactLabels?.[0] || '').trim() || undefined,
          sourceArtifactSummary:
            String(sourceArtifacts[0]?.summary || tutorState.activeArtifactSummary || '').trim() || undefined,
          invokedFrom: 'assistant_card',
        };

        if (requestedSupport === 'small_hint' || requestedSupport === 'simpler_explanation' || requestedSupport === 'practice_question') {
          const tutorActionId: TutorQuickAction =
            requestedSupport === 'small_hint'
              ? 'hint'
              : requestedSupport === 'simpler_explanation'
                ? 'breakdown'
                : 'practice';
          const tutorAction: TutorActionRequest = { ...tutorActionBase, id: tutorActionId };
          const hiddenPrompt = buildHiddenTutorActionPrompt(
            tutorAction,
            tutorActionId === 'practice' ? topicHint : undefined
          );
          void handleSendMessage(null, hiddenPrompt, {
            ignoreSelectedFile: true,
            preserveInput: true,
            tutorAction,
            displayUserMessage: false,
            persistUserMessage: false,
          });
        } else if (requestedSupport === 'worked_example') {
          void handleSendMessage(
            null,
            `Show one short worked example for ${topicHint}. Keep it simple, stay on the same skill, then ask me to try the next one.`,
            {
              ignoreSelectedFile: true,
              preserveInput: true,
              tutorAction: tutorActionBase,
              displayUserMessage: false,
              persistUserMessage: false,
            }
          );
        }
      } catch (error) {
        console.warn('[Copilot] Failed to record metacognitive signal:', error);
      }
    },
    [
      conversationState.lastStudyTopic,
      recordLearningEffectSignal,
      recordMetacognitiveSignal,
      tutorState.activeArtifactLabels,
      tutorState.activeArtifactSummary,
      tutorState.activeSubject,
      tutorState.activeTopic,
    ]
  );

  const handlePracticePadReflection = useCallback(
    async (payload: MetacognitiveChoicePayload) => {
      try {
        await recordMetacognitiveSignal(payload, {
          sourceMessageId: practicePadContext?.sourceMessageId || null,
          metadata: {
            source: 'practice_pad',
            topic: practicePadContext?.topic || null,
            subject: practicePadContext?.subject || null,
          },
        });
      } catch (error) {
        console.warn('[Copilot] Failed to record Practice Pad reflection:', error);
      }
    },
    [practicePadContext?.sourceMessageId, practicePadContext?.subject, practicePadContext?.topic, recordMetacognitiveSignal]
  );

  const handleOpenPracticePad = useCallback(
    async (message?: Message) => {
      const targetMessage =
        message ||
        [...(messagesRef.current || [])].reverse().find((entry) => entry.role === 'model') ||
        null;
      const targetPresentation =
        resolveAssistantEnvelopeMetadata((targetMessage?.metadata as any) || null).presentation || null;
      const nextContext: PracticePadContext = {
        prompt: String(targetMessage?.content || '').trim() || null,
        topic: tutorState.activeTopic || null,
        subject: null,
        sourceMessageId: targetMessage?.id || null,
        reflectionPrompt: targetPresentation?.reflectionPrompt
          ? {
              type: targetPresentation.reflectionPromptType || 'inspect_step',
              text: targetPresentation.reflectionPrompt || '',
            }
          : null,
      };

      setPracticePadContext(nextContext);
      setView('practice_pad');
      recordLearningEffectSignal({
        eventType: 'used_practice_path',
        messageId: targetMessage?.id || null,
        metadata: {
          source: 'practice_pad_open',
          hasReflectionPrompt: Boolean(nextContext.reflectionPrompt),
        },
      });

      if (nextContext.reflectionPrompt) return;

      try {
        const promptResponse = await api.metacognition.getPrompt({
          message: String(targetMessage?.content || tutorState.activeTopic || '').slice(0, 400),
          isPracticePad: true,
          afterMistake: Boolean(metacognitiveState?.errorType),
          currentErrorType: metacognitiveState?.errorType || undefined,
        });
        setPracticePadContext((prev) => (prev ? { ...prev, reflectionPrompt: promptResponse.prompt } : prev));
      } catch (error) {
        console.warn('[Copilot] Failed to fetch Practice Pad prompt:', error);
      }
    },
    [metacognitiveState?.errorType, recordLearningEffectSignal, tutorState.activeTopic]
  );

  const handleCheckPracticeStep = useCallback(
    async (payload: PracticePadCheckStepRequest): Promise<PracticePadCheckStepResponse> => {
      const response = await api.practicePad.checkStep(payload);
      recordLearningEffectSignal({
        eventType: 'practice_completion',
        messageId: payload.sourceMessageId || null,
        topic: payload.topic || null,
        metadata: {
          supportChoice: payload.supportChoice || null,
          stepFocus: payload.stepFocus || null,
          detectedErrorType: response.detectedErrorType || null,
        },
      });
      if (response.updatedMetacognitiveProfile) {
        setMetacognitiveProfile(response.updatedMetacognitiveProfile);
        setMetacognitiveState(
          mergeMetacognitiveState(
            response.updatedMetacognitiveProfile.recentSnapshot,
            response.detectedErrorType ? { errorType: response.detectedErrorType } : null
          )
        );
      } else if (response.detectedErrorType) {
        setMetacognitiveState((prev) =>
          mergeMetacognitiveState(prev, { errorType: response.detectedErrorType })
        );
      }
      return response;
    },
    [recordLearningEffectSignal]
  );

  const handleContinuePracticePadInChat = useCallback(
    (payload: { message: string; tutorAction: TutorActionRequest }) => {
      setView('chat');
      setActiveTab('chat');
      recordLearningEffectSignal({
        eventType: 'selected_try_again',
        messageId: practicePadContext?.sourceMessageId || null,
        topic: practicePadContext?.topic || null,
        metadata: {
          source: 'practice_pad_continue',
          tutorActionId: payload.tutorAction.id,
        },
      });
      void handleSendMessage(null, payload.message, {
        ignoreSelectedFile: true,
        preserveInput: true,
        tutorAction: payload.tutorAction,
        inputOrigin: 'text',
        composerIntent: 'practice_pad_followup',
        displayUserMessage: false,
        persistUserMessage: false,
      });
    },
    [handleSendMessage, practicePadContext?.sourceMessageId, practicePadContext?.topic, recordLearningEffectSignal]
  );

  const handleSavePracticePadWorking = useCallback((payload: {
    content: string;
    selectedStep?: string | null;
    topic?: string | null;
    subject?: string | null;
    sourceMessageId?: string | null;
  }) => {
    const selectedText = String(payload.selectedStep || payload.content || '').trim();
    if (!selectedText) return;

    const sourceMessage = payload.sourceMessageId
      ? (messagesRef.current || []).find((message) => message.id === payload.sourceMessageId) || null
      : null;

    beginRevisionSaveFlow({
      message: sourceMessage,
      selectedText,
      sourceKind: sourceMessage
        ? sourceMessage.videoData?.id
          ? 'video'
          : sourceMessage.image?.src
            ? 'artifact'
            : 'assistant_message'
        : 'selected_text',
    });

    recordLearningEffectSignal({
      eventType: 'revision_saved',
      messageId: sourceMessage?.id || payload.sourceMessageId || null,
      topic: payload.topic || practicePadContext?.topic || null,
      subject: payload.subject || null,
      metadata: {
        source: 'practice_pad',
        hasSelectedStep: Boolean(payload.selectedStep),
      },
    });
  }, [beginRevisionSaveFlow, practicePadContext?.topic, recordLearningEffectSignal]);

  const handleOpenPreferences = () => {
    setView('preferences');
    fetchProfile();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []);
    if (incomingFiles.length === 0) return;

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "File Too Large", description: `${file.name}: max ${MAX_FILE_SIZE_MB}MB` });
        continue;
      }
      if (!isSupportedUploadFile(file)) {
        toast({
          variant: "destructive",
          title: "Unsupported File",
          description: `${file.name}: use image (JPG/PNG/WEBP), PDF, or text/code files (TXT/MD/CSV/JSON/XML).`,
        });
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => {
      const next = [...prev];
      const seen = new Set(prev.map((file) => buildFileSignature(file)));

      for (const file of validFiles) {
        const key = buildFileSignature(file);
        if (seen.has(key)) continue;
        if (next.length >= MAX_ATTACHMENT_COUNT) {
          toast({
            variant: "destructive",
            title: "Too Many Files",
            description: `You can attach up to ${MAX_ATTACHMENT_COUNT} files in one message.`,
          });
          break;
        }
        seen.add(key);
        next.push(file);
      }

      return next;
    });

    appendRecentFilesForScope(recentFileScopeKey, validFiles);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index?: number) => {
    if (typeof index !== 'number') {
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachRecentFile = useCallback(
    (fileId: string) => {
      const entry = (sessionRecentFilesByScope[recentFileScopeKey] || []).find((item) => item.id === fileId);
      if (!entry) return;
      setSelectedFiles((prev) => {
        const seen = new Set(prev.map((file) => buildFileSignature(file)));
        if (seen.has(entry.signature)) return prev;
        if (prev.length >= MAX_ATTACHMENT_COUNT) {
          toast({
            variant: 'destructive',
            title: 'Too Many Files',
            description: `You can attach up to ${MAX_ATTACHMENT_COUNT} files in one message.`,
          });
          return prev;
        }
        return [...prev, entry.file];
      });
      setRecentFilesModalOpen(false);
    },
    [recentFileScopeKey, sessionRecentFilesByScope, toast]
  );

  const buildWorkspaceRuntimeState = useCallback(
    (): WorkspaceRuntimeState => ({
      destination: fullscreenDestination,
      activeLegacyTab: activeTab,
      sidebarExpanded: fullscreenSidebarExpanded,
      plusDrawerOpen: fullscreenPlusDrawerOpen,
      activePlusAction: activeFullscreenPlusAction,
      recentFilesModalOpen,
      modeFlags: fullscreenModeFlagsRef.current,
      selectedMediaItemId,
      mediaFilter: activeMediaFilter,
      mediaMode: activeMediaMode,
      activeGrowthSection,
    }),
    [
      activeFullscreenPlusAction,
      activeGrowthSection,
      activeMediaFilter,
      activeMediaMode,
      activeTab,
      fullscreenDestination,
      fullscreenPlusDrawerOpen,
      fullscreenSidebarExpanded,
      recentFilesModalOpen,
      selectedMediaItemId,
    ]
  );

  const syncWorkspaceRuntimeState = useCallback((nextState: WorkspaceRuntimeState) => {
    setFullscreenDestination(nextState.destination);
    setActiveTab(nextState.activeLegacyTab);
    setFullscreenSidebarExpanded(nextState.sidebarExpanded);
    setFullscreenPlusDrawerOpen(nextState.plusDrawerOpen);
    setActiveFullscreenPlusAction(nextState.activePlusAction);
    setRecentFilesModalOpen(nextState.recentFilesModalOpen);
    fullscreenModeFlagsRef.current = nextState.modeFlags;
    setFullscreenModeFlags(nextState.modeFlags);
    setSelectedMediaItemId(nextState.selectedMediaItemId);
    setActiveMediaFilter(nextState.mediaFilter);
    setActiveMediaMode(nextState.mediaMode);
    setActiveGrowthSection(nextState.activeGrowthSection);
  }, []);

  const applyWorkspaceMachineEffects = useCallback(
    (effects: WorkspaceMachineEffect[]) => {
      effects.forEach((effect) => {
        switch (effect.type) {
          case 'open_file_picker':
            setComposerContext({
              inputOrigin: effect.inputOrigin,
              composerIntent: effect.composerIntent,
            });
            window.setTimeout(() => fileInputRef.current?.click(), 0);
            break;
          case 'toggle_recent_files':
            setRecentFilesModalOpen(effect.open);
            break;
          case 'set_force_web_search':
            setForceWebSearch(effect.value);
            if (!effect.value) {
              setResearchStreamStatus(null);
            }
            break;
          case 'set_research_status':
            setResearchStreamStatus(
              effect.active
                ? {
                    phase: 'research_ready',
                    label: effect.label,
                    timestamp: new Date().toISOString(),
                  }
                : null
            );
            break;
          case 'seed_input_if_empty':
            setInput((prev) => (prev.trim() ? prev : effect.value));
            break;
          case 'toast':
            toast({
              title: effect.title,
              description: effect.description,
            });
            break;
        }
      });
    },
    [fileInputRef, toast]
  );

  const applyWorkspaceMachineResult = useCallback(
    (result: WorkspaceMachineResult) => {
      syncWorkspaceRuntimeState(result.state);
      applyWorkspaceMachineEffects(result.effects);
    },
    [applyWorkspaceMachineEffects, syncWorkspaceRuntimeState]
  );

  const handleEnterFullscreen = useCallback(() => {
    setFullscreenDestination(activeWorkspaceDestination);
    setIsOpen(true);
    setIsFullscreen(true);
  }, [activeWorkspaceDestination]);

  const handleFullscreenPlusMenuOpenChange = useCallback((isOpen: boolean) => {
    applyWorkspaceMachineResult(
      applyWorkspacePlusMenuOpenChange(buildWorkspaceRuntimeState(), isOpen)
    );
  }, [applyWorkspaceMachineResult, buildWorkspaceRuntimeState]);

  const handleClearFullscreenFocusMode = useCallback(() => {
    setFullscreenModeFlags((prev) => {
      const next = { ...prev, focus: false };
      fullscreenModeFlagsRef.current = next;
      return next;
    });
    setActiveFullscreenPlusAction((prev) => (prev === 'focus_mode' ? null : prev));
  }, []);

  const handleClearFullscreenExamMode = useCallback(() => {
    setFullscreenModeFlags((prev) => {
      const next = { ...prev, exam: false };
      fullscreenModeFlagsRef.current = next;
      return next;
    });
    setActiveFullscreenPlusAction((prev) => (prev === 'exam_mode' ? null : prev));
  }, []);

  const handleClearFullscreenResearchMode = useCallback(() => {
    const wasResearchActive = Boolean(fullscreenModeFlagsRef.current.research || forceWebSearch);
    if (wasResearchActive) {
      recordLearningEffectSignal({
        eventType: 'research_cancelled',
        metadata: {
          reason: 'mode_chip_clear',
        },
      });
    }
    setResearchStreamStatus(null);
    setForceWebSearch(false);
    setFullscreenModeFlags((prev) => {
      const next = { ...prev, research: false };
      fullscreenModeFlagsRef.current = next;
      return next;
    });
    setActiveFullscreenPlusAction((prev) => (prev === 'web_research' ? null : prev));
  }, [forceWebSearch, recordLearningEffectSignal]);

  const handleFullscreenPlusAction = useCallback(
    (action: FullscreenPlusAction) => {
      const result = applyWorkspacePlusAction(buildWorkspaceRuntimeState(), action, input);
      applyWorkspaceMachineResult(result);
      if (action === 'web_research') {
        const nextResearchActive = result.state.modeFlags.research;
        recordLearningEffectSignal({
          eventType: nextResearchActive ? 'research_mode_entered' : 'research_cancelled',
          metadata: {
            reason: nextResearchActive ? 'plus_action_toggle' : 'plus_action_toggle_off',
            action,
          },
        });
      }
    },
    [applyWorkspaceMachineResult, buildWorkspaceRuntimeState, input, recordLearningEffectSignal]
  );

  const handleFullscreenDestinationChange = useCallback(
    (destination: FullscreenCopilotDestination) => {
      applyWorkspaceMachineResult(
        applyWorkspaceDestinationChange(buildWorkspaceRuntimeState(), destination)
      );
    },
    [applyWorkspaceMachineResult, buildWorkspaceRuntimeState]
  );

  const handleStartNewSessionFromFullscreen = useCallback(() => {
    applyWorkspaceMachineResult(resetWorkspaceForNewSession(buildWorkspaceRuntimeState()));
    setSelectedRevisionCollection(null);
    setSelectedRevisionItemId(null);
    setSelectedRevisionItems([]);
    setInput('');
    setSelectedFiles([]);
    setComposerContext(undefined);
    setPreparedSelectionContext(null);
    void handleNewChat(true);
  }, [applyWorkspaceMachineResult, buildWorkspaceRuntimeState, handleNewChat]);

  const handleStopGenerating = useCallback(() => {
    const activeRequest = inFlightChatRequestRef.current;
    if (!activeRequest) return;
    if (forceWebSearch || researchModeRequested || researchStreamStatus !== null) {
      recordLearningEffectSignal({
        eventType: 'research_cancelled',
        metadata: {
          reason: 'stop_generating',
          requestKind: activeRequest.kind,
        },
      });
    }
    silentlyCanceledRequestIdsRef.current.add(activeRequest.id);
    activeRequest.controller.abort();
    inFlightChatRequestRef.current = null;
    setResearchStreamStatus(null);
    setIsStreaming(false);
    setIsLoading(false);
    setActiveFullscreenPlusAction(null);
  }, [forceWebSearch, recordLearningEffectSignal, researchModeRequested, researchStreamStatus]);

  const renderContent = () => {
    if (view === 'preferences') {
      return (
        <PreferencesForm
          profileData={profile}
          onSave={handleSavePreferences}
          isSaving={isSavingProfile}
          isLoading={isProfileLoading}
          onClose={() => setView('chat')}
          variant="standalone"
          copilotThemePreference={copilotThemePreference}
          resolvedCopilotTheme={copilotTheme}
          studyAtmospherePreference={studyAtmospherePreference}
        />
      );
    }

    return (
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-2">
              <AssistantLogo size={20} className="border-0 bg-transparent p-0 shadow-none" />
              <span className="font-semibold tracking-tight">Steadfast AI</span>
            </DialogTitle>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="copilot-enter-fullscreen"
                      onClick={handleEnterFullscreen}
                      className="h-8 w-8"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Expand to Fullscreen</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleOpenPreferences}>
                      <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>My Study Preferences</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {activeTab === 'history' ? (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNewChat(true)}
                className="copilot-surface-muted text-sm border-primary/20 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/35"
              >
                <Plus className="h-4 w-4 mr-1" /> New Study Session
              </Button>
            </div>
          ) : null}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-muted/30">
            <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Study Chat</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Recent Study</TabsTrigger>
            <TabsTrigger value="revision"><Bookmark className="mr-2 h-4 w-4" />Revision</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0 flex h-full min-h-0 flex-col overflow-hidden border-0 p-0 outline-none">
            <ChatTab
              messages={messages}
              studentName={profile?.name || 'Student'}
              scrollAreaRef={scrollAreaRef}
              selectedFiles={selectedFiles}
              handleRemoveFile={handleRemoveFile}
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              forceWebSearch={forceWebSearch}
              setForceWebSearch={handleForceWebSearchChange}
              includeVideos={includeVideos}
              setIncludeVideos={setIncludeVideos}
              level={level}
              setLevel={setLevel}
              languageHint={languageHint}
              setLanguageHint={setLanguageHint}
              conversationState={conversationState}
              tutorState={tutorState}
              isNewChat={isNewChat}
                        displayedWelcomeText=""
                        voiceController={voiceController}
              onVoiceModeStart={onVoiceModeStart}
              onEditMessage={handleEditMessage}
              onTutorQuickAction={handleTutorWorkspaceAction}
              onRunResearch={handleRunResearchFromMessage}
              onRecommendVideos={handleRecommendVideosFromMessage}
              onContinueFromVideo={handleContinueFromVideo}
              onSelectionAction={handleContextualSelectionAction}
              onMetacognitiveChoice={handleMetacognitiveChoice}
              onOpenPracticePad={handleOpenPracticePad}
              researchStreamStatus={researchStreamStatus}
              selectedContext={selectedComposerContextPreview}
              onClearSelectedContext={clearPreparedSelectionContext}
              inputPlaceholderOverride={composerPlaceholderOverride}
              focusSignal={composerFocusSignal}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0 flex h-full min-h-0 flex-col overflow-hidden border-0 p-0 outline-none">
            <HistoryTab
              history={history}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleContinueChat={handleContinueChat}
              handleDeleteChat={handleDeleteChat}
              currentPage={historyPagination.page}
              totalPages={historyPagination.totalPages}
              totalItems={historyPagination.total}
              isLoading={isHistoryLoading}
              errorMessage={historyError}
              onPreviousPage={() =>
                setHistoryPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              onNextPage={() =>
                setHistoryPagination((prev) => ({
                  ...prev,
                  page: prev.totalPages > 0 ? Math.min(prev.totalPages, prev.page + 1) : prev.page + 1,
                }))
              }
            />
          </TabsContent>

          <TabsContent value="revision" className="mt-0 flex h-full min-h-0 flex-col overflow-hidden border-0 p-0 outline-none">
            <RevisionTab
              overview={revisionOverview}
              searchQuery={revisionSearchQuery}
              setSearchQuery={setRevisionSearchQuery}
              isLoading={isRevisionLoading}
              errorMessage={revisionError}
              selectedCollection={selectedRevisionCollection}
              selectedItemId={selectedRevisionItemId}
              collectionItems={selectedRevisionItems}
              isCollectionLoading={isRevisionCollectionLoading}
              groupingSuggestions={groupingSuggestions}
              isGroupingSuggestionsLoading={isGroupingSuggestionsLoading}
              onSelectCollection={handleSelectRevisionCollection}
              onSelectItemId={setSelectedRevisionItemId}
              onContinueChat={handleContinueFromRevisionItemSession}
              onTogglePin={handleToggleRevisionPin}
              onUpdateMastery={handleUpdateRevisionMastery}
              onSaveStudentNote={handleSaveRevisionStudentNote}
              onUpdateCollection={handleUpdateRevisionCollection}
              onDeleteCollection={handleDeleteRevisionCollection}
              onUpdateItem={handleUpdateRevisionItem}
              onUpdateItemsBatch={handleUpdateRevisionItemsBatch}
              onDeleteItem={handleDeleteRevisionItem}
              onQuizItem={handleQuizRevisionItem}
              onBreakdownItem={handleBreakdownRevisionItem}
              onSimilarQuestionItem={handleSimilarQuestionRevisionItem}
              onApplyGroupingSuggestion={handleApplyRevisionGroupingSuggestion}
              onRetryLoad={() => {
                void handleRetryRevisionLoad();
              }}
              onExpandWorkspace={() => {
                setFullscreenDestination('revision');
                setIsRevisionWorkspaceOpen(true);
              }}
              onReviseWithSteadfast={handleStartRevisionMode}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <>
      {isCopilotVisible && (
        isFullscreen ? (
          <>
              <FullscreenCopilotUI
                messages={messages}
                history={history}
                activeSession={activeSession}
                historySearchQuery={searchQuery}
                setHistorySearchQuery={setSearchQuery}
                revisionSearchQuery={revisionSearchQuery}
                setRevisionSearchQuery={setRevisionSearchQuery}
                searchQuery={revisionSearchQuery}
              input={input}
              setInput={setInput}
              selectedFiles={selectedFiles}
              fileInputRef={fileInputRef}
              isLoading={isLoading}
              isStreaming={isStreaming}
              studentName={profile?.name || 'Student'}
              sessionTitle={activeSession?.title || 'New Session'}
              handleContinueChat={handleContinueChat}
              handleDeleteChat={handleDeleteChat}
              handleNewChat={() => handleNewChat(true)}
              handleFileChange={handleFileChange}
              handleRemoveFile={handleRemoveFile}
              onStopGenerating={handleStopGenerating}
              onSend={handleSendMessage}
              onEditMessage={handleEditMessage}
              tutorState={tutorState}
              onTutorQuickAction={handleTutorWorkspaceAction}
              onRunResearch={handleRunResearchFromMessage}
              onRecommendVideos={handleRecommendVideosFromMessage}
              onContinueFromVideo={handleContinueFromVideo}
              onSelectionAction={handleContextualSelectionAction}
              forceWebSearch={forceWebSearch}
              setForceWebSearch={handleForceWebSearchChange}
              includeVideos={includeVideos}
              setIncludeVideos={setIncludeVideos}
              level={level}
              setLevel={setLevel}
              languageHint={languageHint}
              setLanguageHint={setLanguageHint}
              onOpenPreferences={() => handleOpenPreferences()}
              onExitFullscreen={() => {
                setRecentFilesModalOpen(false);
                setIsFullscreen(false);
                setIsOpen(true);
              }}
              voiceController={voiceController}
              onVoiceModeStart={onVoiceModeStart}
              view={view}
              setView={setView}
              copilotTheme={copilotTheme}
              copilotThemePreference={copilotThemePreference}
              studyAtmospherePreference={studyAtmospherePreference}
              copilotThemeStyle={copilotThemeStyle}
              profile={profile}
              handleSavePreferences={handleSavePreferences}
              isSavingProfile={isSavingProfile}
              isProfileLoading={isProfileLoading}
              isHistoryLoading={isHistoryLoading}
              historyError={historyError}
              sidebarHistorySessions={sidebarHistorySessions}
              sidebarHistoryLoading={isSidebarHistoryLoading}
              sidebarHistoryLoadingMore={isSidebarHistoryLoadingMore}
              sidebarHistoryError={sidebarHistoryError}
              sidebarHistoryHasMore={hasSidebarHistoryMore}
              onSidebarHistoryLoadMore={handleSidebarHistoryLoadMore}
              onSidebarHistoryRefresh={handleSidebarHistoryRefresh}
              revisionOverview={revisionOverview}
              isRevisionLoading={isRevisionLoading}
              revisionError={revisionError}
              selectedRevisionCollection={selectedRevisionCollection}
              selectedRevisionItemId={selectedRevisionItemId}
              selectedCollection={selectedRevisionCollection}
              selectedItemId={selectedRevisionItemId}
              selectedRevisionItems={selectedRevisionItems}
              isRevisionCollectionLoading={isRevisionCollectionLoading}
              groupingSuggestions={groupingSuggestions}
              isGroupingSuggestionsLoading={isGroupingSuggestionsLoading}
              onSelectRevisionCollection={handleSelectRevisionCollection}
              onSelectRevisionItemId={setSelectedRevisionItemId}
              onSelectItemId={setSelectedRevisionItemId}
              onContinueFromRevisionItemSession={handleContinueFromRevisionItemSession}
              onToggleRevisionPin={handleToggleRevisionPin}
              onUpdateRevisionMastery={handleUpdateRevisionMastery}
              onSaveRevisionStudentNote={handleSaveRevisionStudentNote}
              onUpdateRevisionCollection={handleUpdateRevisionCollection}
              onDeleteRevisionCollection={handleDeleteRevisionCollection}
              onUpdateRevisionItem={handleUpdateRevisionItem}
              onUpdateRevisionItemsBatch={handleUpdateRevisionItemsBatch}
              onDeleteRevisionItem={handleDeleteRevisionItem}
              onQuizRevisionItem={handleQuizRevisionItem}
              onBreakdownRevisionItem={handleBreakdownRevisionItem}
              onSimilarQuestionRevisionItem={handleSimilarQuestionRevisionItem}
              onApplyRevisionGroupingSuggestion={handleApplyRevisionGroupingSuggestion}
              onRetryRevisionLoad={() => {
                void handleRetryRevisionLoad();
              }}
              onStartRevisionMode={handleStartRevisionMode}
              practicePadContext={practicePadContext}
              metacognitiveProfile={metacognitiveProfile}
              metacognitiveState={metacognitiveState}
              onMetacognitiveChoice={handleMetacognitiveChoice}
              onOpenPracticePad={handleOpenPracticePad}
              onCheckPracticeStep={handleCheckPracticeStep}
              onRecordPracticeReflection={handlePracticePadReflection}
              onSavePracticePadWorking={handleSavePracticePadWorking}
              destination={fullscreenDestination}
              onDestinationChange={handleFullscreenDestinationChange}
              onStartNewSession={handleStartNewSessionFromFullscreen}
              sidebarExpanded={fullscreenSidebarExpanded}
              onSidebarExpandedChange={setFullscreenSidebarExpanded}
              onPlusAction={handleFullscreenPlusAction}
              onPlusMenuOpenChange={handleFullscreenPlusMenuOpenChange}
              modeFlags={fullscreenModeFlags}
              onClearFocusMode={handleClearFullscreenFocusMode}
              onClearExamMode={handleClearFullscreenExamMode}
              onClearResearchMode={handleClearFullscreenResearchMode}
              researchStreamStatus={researchStreamStatus}
              selectedComposerContext={selectedComposerContextPreview}
              onClearSelectedComposerContext={clearPreparedSelectionContext}
              composerPlaceholderOverride={composerPlaceholderOverride}
              composerFocusSignal={composerFocusSignal}
              devLatencyDiagnostics={devLatencyDiagnostics}
              recentFiles={recentSessionFiles}
              recentFilesModalOpen={recentFilesModalOpen}
              onRecentFilesModalOpenChange={setRecentFilesModalOpen}
              onAttachRecentFile={handleAttachRecentFile}
              mediaAssets={mediaAssets}
              isMediaAssetsLoading={isMediaAssetsLoading}
              mediaAssetsError={mediaAssetsError}
              onRetryMediaAssetsLoad={() => {
                void handleRetryMediaAssetsLoad();
              }}
              mediaStream={mediaStream}
              mediaStreamMeta={mediaStreamMeta}
              isMediaStreamLoading={isMediaStreamLoading}
              mediaStreamError={mediaStreamError}
              onRetryMediaStreamLoad={() => {
                void handleRetryMediaStreamLoad();
              }}
              mediaCollections={mediaCollections}
              isMediaCollectionsLoading={isMediaCollectionsLoading}
              mediaCollectionsError={mediaCollectionsError}
              onRetryMediaCollectionsLoad={() => {
                void handleRetryMediaCollectionsLoad();
              }}
              onRecordMediaInteraction={(assetId, action, revisionItemId) => {
                void handleRecordMediaInteraction(assetId, action, revisionItemId);
              }}
              onCreateMediaCollection={(payload) => {
                void handleCreateMediaCollection(payload);
              }}
              onAddAssetToMediaCollection={(collectionId, assetId) => {
                void handleAddAssetToMediaCollection(collectionId, assetId);
              }}
              onRemoveAssetFromMediaCollection={(collectionId, assetId) => {
                void handleRemoveAssetFromMediaCollection(collectionId, assetId);
              }}
              mediaFilter={activeMediaFilter}
              onMediaFilterChange={setActiveMediaFilter}
              mediaMode={activeMediaMode}
              onMediaModeChange={setActiveMediaMode}
              selectedMediaItemId={selectedMediaItemId}
              onSelectedMediaItemChange={setSelectedMediaItemId}
              mediaPreferenceProfile={normalizeMediaPreferences(profile?.mediaPreferences)}
              learningStyleSignals={normalizeLearningStyleSignals(profile?.learningStyleSignals)}
              activeGrowthSection={activeGrowthSection}
              onGrowthSectionChange={setActiveGrowthSection}
              onResolveGrowthAction={resolveGrowthActionPlan}
            />

          </>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
              data-copilot-widget-shell
              data-copilot-theme={copilotTheme}
              data-copilot-theme-preference={copilotThemePreference}
              data-study-atmosphere={studyAtmospherePreference.presetId}
              data-study-atmosphere-advanced={studyAtmospherePreference.useAdvanced ? 'true' : 'false'}
              data-study-mode={isCopilotVisible ? fullscreenStudyMode : 'standard'}
              data-copilot-surface-profile={widgetSurfaceProfile}
              className={`copilot-surface flex h-[82vh] max-h-[900px] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-[2rem] border p-0 shadow-[0_32px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl [&>button]:hidden sm:max-w-[1040px] ${copilotThemeScopeClass}`}
              style={copilotThemeStyle}
              showCloseButton={voiceController.state === 'idle'}
              onPointerDownOutside={(event) => {
                if (isVoiceOverlayOpen) event.preventDefault();
              }}
              onInteractOutside={(event) => {
                if (isVoiceOverlayOpen) event.preventDefault();
              }}
              onEscapeKeyDown={(event) => {
                if (isVoiceOverlayOpen) event.preventDefault();
              }}
            >
              <DialogTitle className="sr-only">Steadfast AI</DialogTitle>
              <FullscreenCopilotUI
                shellVariant="widget"
                onSurfaceProfileChange={setWidgetSurfaceProfile}
                messages={messages}
                history={history}
                activeSession={activeSession}
                historySearchQuery={searchQuery}
                setHistorySearchQuery={setSearchQuery}
                revisionSearchQuery={revisionSearchQuery}
                setRevisionSearchQuery={setRevisionSearchQuery}
                searchQuery={revisionSearchQuery}
                input={input}
                setInput={setInput}
                selectedFiles={selectedFiles}
                fileInputRef={fileInputRef}
                isLoading={isLoading}
                isStreaming={isStreaming}
                studentName={profile?.name || 'Student'}
                sessionTitle={activeSession?.title || 'New Session'}
                handleContinueChat={handleContinueChat}
                handleDeleteChat={handleDeleteChat}
                handleNewChat={() => handleNewChat(true)}
                handleFileChange={handleFileChange}
                handleRemoveFile={handleRemoveFile}
                onStopGenerating={handleStopGenerating}
                onSend={handleSendMessage}
                onEditMessage={handleEditMessage}
                tutorState={tutorState}
                onTutorQuickAction={handleTutorWorkspaceAction}
                onRunResearch={handleRunResearchFromMessage}
                onRecommendVideos={handleRecommendVideosFromMessage}
                onContinueFromVideo={handleContinueFromVideo}
                onSelectionAction={handleContextualSelectionAction}
                forceWebSearch={forceWebSearch}
                setForceWebSearch={handleForceWebSearchChange}
                includeVideos={includeVideos}
                setIncludeVideos={setIncludeVideos}
                level={level}
                setLevel={setLevel}
                languageHint={languageHint}
                setLanguageHint={setLanguageHint}
                onOpenPreferences={() => handleOpenPreferences()}
                onExitFullscreen={() => setIsFullscreen(false)}
                onEnterFullscreen={handleEnterFullscreen}
                voiceController={voiceController}
                onVoiceModeStart={onVoiceModeStart}
                view={view}
                setView={setView}
                copilotTheme={copilotTheme}
                copilotThemePreference={copilotThemePreference}
                studyAtmospherePreference={studyAtmospherePreference}
                copilotThemeStyle={copilotThemeStyle}
                profile={profile}
                handleSavePreferences={handleSavePreferences}
                isSavingProfile={isSavingProfile}
                isProfileLoading={isProfileLoading}
                isHistoryLoading={isHistoryLoading}
                historyError={historyError}
                sidebarHistorySessions={sidebarHistorySessions}
                sidebarHistoryLoading={isSidebarHistoryLoading}
                sidebarHistoryLoadingMore={isSidebarHistoryLoadingMore}
                sidebarHistoryError={sidebarHistoryError}
                sidebarHistoryHasMore={hasSidebarHistoryMore}
                onSidebarHistoryLoadMore={handleSidebarHistoryLoadMore}
                onSidebarHistoryRefresh={handleSidebarHistoryRefresh}
                revisionOverview={revisionOverview}
                isRevisionLoading={isRevisionLoading}
                revisionError={revisionError}
                selectedRevisionCollection={selectedRevisionCollection}
                selectedRevisionItemId={selectedRevisionItemId}
                selectedCollection={selectedRevisionCollection}
                selectedItemId={selectedRevisionItemId}
                selectedRevisionItems={selectedRevisionItems}
                isRevisionCollectionLoading={isRevisionCollectionLoading}
                groupingSuggestions={groupingSuggestions}
                isGroupingSuggestionsLoading={isGroupingSuggestionsLoading}
                onSelectRevisionCollection={handleSelectRevisionCollection}
                onSelectRevisionItemId={setSelectedRevisionItemId}
                onSelectItemId={setSelectedRevisionItemId}
                onContinueFromRevisionItemSession={handleContinueFromRevisionItemSession}
                onToggleRevisionPin={handleToggleRevisionPin}
                onUpdateRevisionMastery={handleUpdateRevisionMastery}
                onSaveRevisionStudentNote={handleSaveRevisionStudentNote}
                onUpdateRevisionCollection={handleUpdateRevisionCollection}
                onDeleteRevisionCollection={handleDeleteRevisionCollection}
                onUpdateRevisionItem={handleUpdateRevisionItem}
                onUpdateRevisionItemsBatch={handleUpdateRevisionItemsBatch}
                onDeleteRevisionItem={handleDeleteRevisionItem}
                onQuizRevisionItem={handleQuizRevisionItem}
                onBreakdownRevisionItem={handleBreakdownRevisionItem}
                onSimilarQuestionRevisionItem={handleSimilarQuestionRevisionItem}
                onApplyRevisionGroupingSuggestion={handleApplyRevisionGroupingSuggestion}
                onRetryRevisionLoad={() => {
                  void handleRetryRevisionLoad();
                }}
                onStartRevisionMode={handleStartRevisionMode}
                practicePadContext={practicePadContext}
                metacognitiveProfile={metacognitiveProfile}
                metacognitiveState={metacognitiveState}
                onMetacognitiveChoice={handleMetacognitiveChoice}
                onOpenPracticePad={handleOpenPracticePad}
                onCheckPracticeStep={handleCheckPracticeStep}
                onRecordPracticeReflection={handlePracticePadReflection}
                onSavePracticePadWorking={handleSavePracticePadWorking}
                destination={fullscreenDestination}
                onDestinationChange={handleFullscreenDestinationChange}
                onStartNewSession={handleStartNewSessionFromFullscreen}
                sidebarExpanded={fullscreenSidebarExpanded}
                onSidebarExpandedChange={setFullscreenSidebarExpanded}
                onPlusAction={handleFullscreenPlusAction}
                onPlusMenuOpenChange={handleFullscreenPlusMenuOpenChange}
                modeFlags={fullscreenModeFlags}
                onClearFocusMode={handleClearFullscreenFocusMode}
                onClearExamMode={handleClearFullscreenExamMode}
                onClearResearchMode={handleClearFullscreenResearchMode}
                researchStreamStatus={researchStreamStatus}
                selectedComposerContext={selectedComposerContextPreview}
                onClearSelectedComposerContext={clearPreparedSelectionContext}
                composerPlaceholderOverride={composerPlaceholderOverride}
                composerFocusSignal={composerFocusSignal}
                devLatencyDiagnostics={devLatencyDiagnostics}
                recentFiles={recentSessionFiles}
                recentFilesModalOpen={recentFilesModalOpen}
                onRecentFilesModalOpenChange={setRecentFilesModalOpen}
                onAttachRecentFile={handleAttachRecentFile}
                mediaAssets={mediaAssets}
                isMediaAssetsLoading={isMediaAssetsLoading}
                mediaAssetsError={mediaAssetsError}
                onRetryMediaAssetsLoad={() => {
                  void handleRetryMediaAssetsLoad();
                }}
                mediaStream={mediaStream}
                mediaStreamMeta={mediaStreamMeta}
                isMediaStreamLoading={isMediaStreamLoading}
                mediaStreamError={mediaStreamError}
                onRetryMediaStreamLoad={() => {
                  void handleRetryMediaStreamLoad();
                }}
                mediaCollections={mediaCollections}
                isMediaCollectionsLoading={isMediaCollectionsLoading}
                mediaCollectionsError={mediaCollectionsError}
                onRetryMediaCollectionsLoad={() => {
                  void handleRetryMediaCollectionsLoad();
                }}
                onRecordMediaInteraction={(assetId, action, revisionItemId) => {
                  void handleRecordMediaInteraction(assetId, action, revisionItemId);
                }}
                onCreateMediaCollection={(payload) => {
                  void handleCreateMediaCollection(payload);
                }}
                onAddAssetToMediaCollection={(collectionId, assetId) => {
                  void handleAddAssetToMediaCollection(collectionId, assetId);
                }}
                onRemoveAssetFromMediaCollection={(collectionId, assetId) => {
                  void handleRemoveAssetFromMediaCollection(collectionId, assetId);
                }}
                mediaFilter={activeMediaFilter}
                onMediaFilterChange={setActiveMediaFilter}
                mediaMode={activeMediaMode}
                onMediaModeChange={setActiveMediaMode}
                selectedMediaItemId={selectedMediaItemId}
                onSelectedMediaItemChange={setSelectedMediaItemId}
                mediaPreferenceProfile={normalizeMediaPreferences(profile?.mediaPreferences)}
                learningStyleSignals={normalizeLearningStyleSignals(profile?.learningStyleSignals)}
                activeGrowthSection={activeGrowthSection}
                onGrowthSectionChange={setActiveGrowthSection}
                onResolveGrowthAction={resolveGrowthActionPlan}
              />

            </DialogContent>
          </Dialog>
        )
      )}

      <RevisionWorkspaceOverlay
        open={isOpen && isRevisionWorkspaceOpen}
        onClose={() => setIsRevisionWorkspaceOpen(false)}
      >
        <RevisionTab
          overview={revisionOverview}
          searchQuery={revisionSearchQuery}
          setSearchQuery={setRevisionSearchQuery}
          isLoading={isRevisionLoading}
          errorMessage={revisionError}
          selectedCollection={selectedRevisionCollection}
          selectedItemId={selectedRevisionItemId}
          collectionItems={selectedRevisionItems}
          isCollectionLoading={isRevisionCollectionLoading}
          groupingSuggestions={groupingSuggestions}
          isGroupingSuggestionsLoading={isGroupingSuggestionsLoading}
          onSelectCollection={handleSelectRevisionCollection}
          onSelectItemId={setSelectedRevisionItemId}
          onContinueChat={handleContinueFromRevisionItemSession}
          onTogglePin={handleToggleRevisionPin}
          onUpdateMastery={handleUpdateRevisionMastery}
          onSaveStudentNote={handleSaveRevisionStudentNote}
          onUpdateCollection={handleUpdateRevisionCollection}
          onDeleteCollection={handleDeleteRevisionCollection}
          onUpdateItem={handleUpdateRevisionItem}
          onUpdateItemsBatch={handleUpdateRevisionItemsBatch}
          onDeleteItem={handleDeleteRevisionItem}
          onQuizItem={handleQuizRevisionItem}
          onBreakdownItem={handleBreakdownRevisionItem}
          onSimilarQuestionItem={handleSimilarQuestionRevisionItem}
          onApplyGroupingSuggestion={handleApplyRevisionGroupingSuggestion}
          onRetryLoad={() => {
            void handleRetryRevisionLoad();
          }}
          onReviseWithSteadfast={handleStartRevisionMode}
          workspaceScrollState={revisionWorkspaceScrollState}
          onWorkspaceScrollStateChange={setRevisionWorkspaceScrollState}
          layoutMode="workspace"
          showExpandAction={false}
        />
      </RevisionWorkspaceOverlay>

      <SaveToRevisionDialog
        open={isRevisionSaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeRevisionSaveDialog();
            return;
          }
          setIsRevisionSaveDialogOpen(true);
        }}
        draft={pendingRevisionSave}
        isSaving={isSavingRevisionItem}
        onConfirm={handleConfirmRevisionSave}
      />

      <VoiceConcierge
        voiceController={voiceController}
        sessionId={activeSession?.id}
        isOpen={isVoiceOverlayOpen}
        onClose={handleVoiceModeClose}
      />

      {!isCopilotVisible && (
        <div className="fixed bottom-4 right-4 z-30 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsOpen(true)}
                    data-testid="copilot-open-button"
                    onMouseEnter={() => {
                      void preloadCopilotData(true).catch(() => undefined);
                    }}
                    onFocus={() => {
                      void preloadCopilotData(true).catch(() => undefined);
                    }}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                  >
                  <MessageSquare className="h-7 w-7 text-primary-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Open Student Hub</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
}

