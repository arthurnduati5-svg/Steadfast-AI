'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  Brain,
  BookOpenText,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Minimize2,
  Menu,
  NotebookPen,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Workflow,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FullscreenSidebar } from './FullscreenSidebar';
import { FullscreenChatView } from './FullscreenChatView';
import { FullscreenComposer } from './FullscreenComposer';
import { GrowthWorkspacePanel } from './GrowthWorkspace';
import { AssessmentWorkspace } from './AssessmentWorkspace';
import studyStreamStyles from './StudyStreamSurface.module.css';
import YouTubePlayer from '@/components/ui/youtube-player';
import type { ComposerSelectedContextPreview, RecentSessionFilePreview } from '@/components/chat-input-bar';
import { AssistantLogo } from '@/components/copilot/AssistantLogo';
import { PreferencesForm } from '@/components/copilot/PreferencesForm';
import { PracticePad, type PracticePadContext } from '@/components/copilot/PracticePad';
import { RevisionTab } from '@/components/revision-tab';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { executeGrowthActionPlan } from '@/lib/growth-action-routing';
import {
  DEFAULT_WIDGET_NAVIGATION_STYLE,
  resolveWidgetDestinationVisibility,
} from '@/lib/copilot-surface';
import { useCopilotSurfaceProfile } from '@/lib/use-copilot-surface-profile';
import {
  applyStudyOrbitTrackingEvent,
  coerceStudyOrbitProgressState,
  createEmptyStudyOrbitProgressState,
  filterPersistableStudyOrbitTrackingState,
  formatStudyOrbitStageShortLabel,
  type StudyOrbitProgressState,
} from '@/lib/study-orbit-tracking';
import {
  buildStudyOrbitLineupSignal,
  buildStudyOrbitStageSentence,
  selectStudyOrbitPrimaryCue,
} from '@/lib/study-orbit-cue-engine';
import { buildStudyOrbitUnlockView } from '@/lib/study-orbit-unlock-engine';
import {
  mapCreativeContractActionToMediaInteraction,
  parseCreativeContractInteraction,
  resolveCreativeContractRole,
  resolveCreativeContractSourceType,
  resolveCreativeContractTrustLabel,
  type CreativeContractAction,
  type CreativeContractActionId,
  type CreativeContractInteraction,
} from '@/lib/media-stream/creative-stream-contract';
import {
  resolveMediaStreamDeckMeta,
  resolveMediaStreamEmptyState,
  resolveMediaStreamMode,
  resolveMediaStreamNotices,
} from '@/lib/media-stream/stream-response-contract';
import { resetMediaScrollContract, scrollMediaOwnerToAnchor } from '@/lib/media-stream/scroll-contract';
import { pickUpcomingStudyLineup } from '@/lib/media-stream/study-stream-sequencing';
import type {
  ChatSession,
  GrowthActionIntent,
  GrowthActionPayload,
  GrowthActionPlan,
  FullscreenCopilotDestination,
  FullscreenGrowthSection,
  FullscreenMediaFilter,
  FullscreenModeFlags,
  FullscreenPlusAction,
  MediaAsset,
  MediaCollection,
  MediaInteractionAction,
  MediaPreferenceProfile,
  MediaStreamItem,
  MediaStreamResponse,
  MediaWorkspaceMode,
  Message,
  CopilotSurfaceKind,
  CopilotSurfaceProfile,
  GuidedRevisionSessionStartResult,
  MetacognitiveProfile,
  MetacognitiveStateSnapshot,
  PracticePadCheckStepRequest,
  PracticePadCheckStepResponse,
  RecommendedVideo,
  RevisionCollection,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionMastery,
  RevisionOverview,
  DeleteRevisionCollectionMode,
  UpdateRevisionCollectionRequest,
  UpdateRevisionItemRequest,
  TutorActionRequest,
  TutorQuickAction,
  TutorState,
  VideoData,
  StudyAtmospherePreference,
} from '@/lib/types';
import type { SelectionActionPayload } from '@/components/copilot/SelectionActionMenu';
import type { VoiceController } from '../../../../AI/useVoiceController';
import type { MetacognitiveChoicePayload } from '@/components/copilot/MetacognitivePromptCard';
import type { CopilotTheme, CopilotThemePreference } from '@/lib/copilot-theme';

interface FullscreenCopilotUIProps {
  messages: Message[];
  history: ChatSession[];
  activeSession: ChatSession | null;
  historySearchQuery: string;
  setHistorySearchQuery: (q: string) => void;
  searchQuery?: string;
  revisionSearchQuery: string;
  setRevisionSearchQuery: (q: string) => void;
  handleContinueChat: (session: ChatSession) => void;
  handleDeleteChat: (id: string) => void;
  handleNewChat: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  selectedFiles: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index?: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  isStreaming: boolean;
  onStopGenerating: () => void;
  onSend: (
    e: React.FormEvent | null,
    overrideText?: string,
    options?: {
      tutorAction?: TutorActionRequest;
      ignoreSelectedFile?: boolean;
      preserveInput?: boolean;
      editedMessageId?: string;
      inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
      composerIntent?: string;
      linkedArtifactId?: string;
    }
  ) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  tutorState?: TutorState;
  onTutorQuickAction?: (action: TutorQuickAction, message: Message) => void;
  onRunResearch?: (message: Message) => void;
  onRecommendVideos?: (message: Message) => void;
  onContinueFromVideo?: (message: Message, video: RecommendedVideo | VideoData) => void;
  onSelectionAction?: (action: 'ask' | 'breakdown' | 'summarize' | 'save', payload: SelectionActionPayload) => void;
  forceWebSearch: boolean;
  setForceWebSearch: (val: boolean) => void;
  includeVideos: boolean;
  setIncludeVideos: (value: boolean) => void;
  level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
  setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
  languageHint: 'English' | 'Swahili mix';
  setLanguageHint: (value: 'English' | 'Swahili mix') => void;
  onOpenPreferences: () => void;
  onExitFullscreen: () => void;
  onEnterFullscreen?: () => void;
  studentName: string;
  sessionTitle: string;
  voiceController: VoiceController;
  onVoiceModeStart: () => void;
  view: 'chat' | 'preferences' | 'practice_pad';
  setView: React.Dispatch<React.SetStateAction<'chat' | 'preferences' | 'practice_pad'>>;
  profile: any;
  handleSavePreferences: (data: any) => Promise<any>;
  isSavingProfile: boolean;
  isProfileLoading: boolean;
  copilotTheme?: CopilotTheme;
  copilotThemePreference: CopilotThemePreference;
  studyAtmospherePreference: StudyAtmospherePreference;
  copilotThemeStyle?: React.CSSProperties;
  isHistoryLoading: boolean;
  historyError: string;
  sidebarHistorySessions: ChatSession[];
  sidebarHistoryLoading: boolean;
  sidebarHistoryLoadingMore: boolean;
  sidebarHistoryError: string;
  sidebarHistoryHasMore: boolean;
  onSidebarHistoryLoadMore: () => void;
  onSidebarHistoryRefresh: () => void;
  revisionOverview: RevisionOverview | null;
  isRevisionLoading: boolean;
  revisionError: string;
  selectedRevisionCollection: RevisionCollection | null;
  selectedCollection?: RevisionCollection | null;
  selectedRevisionItemId: string | null;
  selectedItemId?: string | null;
  selectedRevisionItems: RevisionItem[];
  isRevisionCollectionLoading: boolean;
  groupingSuggestions: RevisionGroupingSuggestion[];
  isGroupingSuggestionsLoading: boolean;
  onSelectRevisionCollection: (collection: RevisionCollection | null) => void;
  onSelectRevisionItemId: (itemId: string | null) => void;
  onSelectItemId?: (itemId: string | null) => void;
  onContinueFromRevisionItemSession: (sessionId: string) => void;
  onToggleRevisionPin: (item: RevisionItem) => Promise<void> | void;
  onUpdateRevisionMastery: (item: RevisionItem, mastery: RevisionMastery | null) => Promise<void> | void;
  onSaveRevisionStudentNote: (item: RevisionItem, studentNote: string) => Promise<void> | void;
  onUpdateRevisionCollection: (collection: RevisionCollection, patch: UpdateRevisionCollectionRequest) => Promise<void> | void;
  onDeleteRevisionCollection: (collection: RevisionCollection, mode: DeleteRevisionCollectionMode) => Promise<void> | void;
  onUpdateRevisionItem: (item: RevisionItem, patch: UpdateRevisionItemRequest) => Promise<void> | void;
  onUpdateRevisionItemsBatch: (updates: Array<{ itemId: string; patch: UpdateRevisionItemRequest }>) => Promise<void> | void;
  onDeleteRevisionItem: (item: RevisionItem) => Promise<void> | void;
  onQuizRevisionItem: (item: RevisionItem) => Promise<void> | void;
  onBreakdownRevisionItem: (item: RevisionItem) => Promise<void> | void;
  onSimilarQuestionRevisionItem: (item: RevisionItem) => Promise<void> | void;
  onApplyRevisionGroupingSuggestion: (suggestionId: string) => Promise<void> | void;
  onRetryRevisionLoad: () => void;
  onStartRevisionMode: (context: { collectionId?: string; itemId?: string }) => Promise<GuidedRevisionSessionStartResult | null> | GuidedRevisionSessionStartResult | null;
  practicePadContext?: PracticePadContext | null;
  metacognitiveProfile?: MetacognitiveProfile | null;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  onMetacognitiveChoice?: (message: Message, payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: (message?: Message) => void;
  onCheckPracticeStep: (payload: PracticePadCheckStepRequest) => Promise<PracticePadCheckStepResponse>;
  onRecordPracticeReflection?: (payload: MetacognitiveChoicePayload) => Promise<void> | void;
  onSavePracticePadWorking?: (payload: {
    content: string;
    selectedStep?: string | null;
    topic?: string | null;
    subject?: string | null;
    sourceMessageId?: string | null;
  }) => void;
  destination: FullscreenCopilotDestination;
  onDestinationChange: (destination: FullscreenCopilotDestination) => void;
  onStartNewSession: () => void;
  sidebarExpanded: boolean;
  onSidebarExpandedChange: (expanded: boolean) => void;
  onPlusAction: (action: FullscreenPlusAction) => void;
  onPlusMenuOpenChange: (isOpen: boolean) => void;
  modeFlags: FullscreenModeFlags;
  onClearFocusMode?: () => void;
  onClearExamMode?: () => void;
  onClearResearchMode?: () => void;
  devLatencyDiagnostics?: {
    turnId: string;
    source: 'chat' | 'tutor_action' | 'voice';
    firstTokenMs: number | null;
    fullResponseMs: number | null;
    tutorActionTurnaroundMs: number | null;
    updatedAtIso: string;
  } | null;
  recentFiles?: RecentSessionFilePreview[];
  recentFilesModalOpen?: boolean;
  onRecentFilesModalOpenChange?: (isOpen: boolean) => void;
  onAttachRecentFile?: (fileId: string) => void;
  researchStreamStatus?: {
    phase: string;
    label: string;
    timestamp: string;
  } | null;
  selectedComposerContext?: ComposerSelectedContextPreview | null;
  onClearSelectedComposerContext?: () => void;
  composerPlaceholderOverride?: string;
  composerFocusSignal?: number;
  mediaAssets: MediaAsset[];
  isMediaAssetsLoading: boolean;
  mediaAssetsError: string;
  onRetryMediaAssetsLoad?: () => void;
  mediaStream: MediaStreamItem[];
  mediaStreamMeta?: Omit<MediaStreamResponse, 'stream'> | null;
  isMediaStreamLoading: boolean;
  mediaStreamError: string;
  onRetryMediaStreamLoad?: () => void;
  mediaCollections: MediaCollection[];
  isMediaCollectionsLoading: boolean;
  mediaCollectionsError: string;
  onRetryMediaCollectionsLoad?: () => void;
  onRecordMediaInteraction?: (assetId: string, action: MediaInteractionAction, revisionItemId?: string | null) => void | Promise<void>;
  onCreateMediaCollection?: (payload: {
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    metadata?: Record<string, unknown>;
  }) => void | Promise<void>;
  onAddAssetToMediaCollection?: (collectionId: string, assetId: string) => void | Promise<void>;
  onRemoveAssetFromMediaCollection?: (collectionId: string, assetId: string) => void | Promise<void>;
  mediaFilter: FullscreenMediaFilter;
  onMediaFilterChange: (filter: FullscreenMediaFilter) => void;
  mediaMode: MediaWorkspaceMode;
  onMediaModeChange: (mode: MediaWorkspaceMode) => void;
  selectedMediaItemId: string | null;
  onSelectedMediaItemChange: (itemId: string | null) => void;
  mediaPreferenceProfile?: MediaPreferenceProfile | null;
  learningStyleSignals?: string[];
  activeGrowthSection: FullscreenGrowthSection;
  onGrowthSectionChange: (section: FullscreenGrowthSection) => void;
  onResolveGrowthAction?: (
    intent: GrowthActionIntent,
    payload?: GrowthActionPayload
  ) => Promise<GrowthActionPlan | null>;
  shellVariant?: CopilotSurfaceKind;
  onSurfaceProfileChange?: (profile: CopilotSurfaceProfile) => void;
}

function uniqueRevisionItems(overview: RevisionOverview | null) {
  if (!overview) return [];
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
    ...(overview.collections || []).flatMap((collection) => collection.previewItems || []),
  ];
  const seen = new Set<string>();
  const list: RevisionItem[] = [];
  for (const item of pool) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    list.push(item);
  }
  return list;
}

function formatWorkspaceDate(value: Date | string | null | undefined) {
  if (!value) return 'Recent';
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return 'Recent';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(dateValue);
}

const MEDIA_DEMO_ENABLED = process.env.NODE_ENV !== 'production';

const MEDIA_DEMO_GRAPH_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f4f7ff"/><stop offset="100%" stop-color="#e8f2ff"/></linearGradient><linearGradient id="line" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="1200" height="720" rx="48" fill="url(#bg)"/><g opacity=".16"><circle cx="110" cy="110" r="70" fill="#6366f1"/><circle cx="1030" cy="140" r="90" fill="#0ea5e9"/><circle cx="950" cy="600" r="110" fill="#818cf8"/></g><rect x="120" y="520" width="120" height="140" rx="20" fill="#c7d2fe"/><rect x="290" y="430" width="120" height="230" rx="20" fill="#a5b4fc"/><rect x="460" y="470" width="120" height="190" rx="20" fill="#93c5fd"/><rect x="630" y="340" width="120" height="320" rx="20" fill="#7dd3fc"/><rect x="800" y="250" width="120" height="410" rx="20" fill="#67e8f9"/><path d="M120 390 C280 320, 350 350, 460 300 C560 255, 650 305, 760 240 C860 185, 980 215, 1080 150" fill="none" stroke="url(#line)" stroke-width="18" stroke-linecap="round"/><g fill="#4f46e5"><circle cx="280" cy="338" r="14"/><circle cx="460" cy="300" r="14"/><circle cx="760" cy="240" r="14"/><circle cx="1080" cy="150" r="14"/></g><text x="120" y="108" font-family="Inter, Segoe UI, Arial" font-size="62" font-weight="700" fill="#1e293b">Climate Graph Recall</text><text x="120" y="164" font-family="Inter, Segoe UI, Arial" font-size="32" fill="#475569">Bars = rainfall, line = temperature trend</text></svg>'
)}`;

const MEDIA_DEMO_DIAGRAM_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#fff8ed"/><stop offset="100%" stop-color="#ffe9d0"/></linearGradient></defs><rect width="1200" height="720" rx="48" fill="url(#bg)"/><rect x="120" y="140" width="960" height="460" rx="36" fill="#ffffff" stroke="#fbbf24" stroke-width="8"/><path d="M240 380 h230" stroke="#f97316" stroke-width="14" stroke-linecap="round"/><path d="M730 380 h230" stroke="#22c55e" stroke-width="14" stroke-linecap="round"/><circle cx="600" cy="380" r="86" fill="#fde68a" stroke="#f59e0b" stroke-width="8"/><text x="600" y="388" text-anchor="middle" font-family="Inter, Segoe UI, Arial" font-size="34" font-weight="700" fill="#7c2d12">H₂O</text><text x="360" y="335" text-anchor="middle" font-family="Inter, Segoe UI, Arial" font-size="26" font-weight="600" fill="#7c2d12">Acid + Alkali</text><text x="840" y="335" text-anchor="middle" font-family="Inter, Segoe UI, Arial" font-size="26" font-weight="600" fill="#14532d">Salt + Water</text><text x="120" y="108" font-family="Inter, Segoe UI, Arial" font-size="62" font-weight="700" fill="#1f2937">Neutralisation Map</text><text x="120" y="164" font-family="Inter, Segoe UI, Arial" font-size="32" fill="#475569">Use this visual to recall products quickly</text></svg>'
)}`;

const DEMO_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'demo-media-video-linear-01',
    userId: 'demo-user',
    assetKind: 'video_recap',
    title: 'Linear equations visual recap',
    summary: 'See each balancing step once, then solve one similar equation from memory.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Balancing both sides',
    tags: ['algebra', 'equations', 'revision'],
    language: 'english',
    sessionId: 'preview-session-algebra',
    sourceUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y',
    videoId: 'xC-c7E5PK0Y',
    videoProvider: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/xC-c7E5PK0Y/hqdefault.jpg',
    durationSec: 510,
    recapText:
      'Move one variable group first, then constants. Keep each operation mirrored on both sides before simplifying.',
    keyPoints: [
      'Subtract or add variable terms first to isolate one side.',
      'Apply exactly the same operation to both sides.',
      'Check the final value by substituting back quickly.',
    ],
    quickChecks: [
      'For 3x + 5 = x + 17, what is your very first operation?',
      'Why do we apply operations to both sides?',
    ],
    keyIdea: 'Balance first, simplify second.',
    bestUse: 'Use before opening Practice Pad for one similar equation.',
    nextMove: 'Solve one fresh equation and mark where the sign changed.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T08:12:00.000Z',
    updatedAt: '2026-04-05T08:40:00.000Z',
  },
  {
    id: 'demo-media-video-linear-02',
    userId: 'demo-user',
    assetKind: 'video_recap',
    title: 'Keep both sides balanced',
    summary: 'A short worked example that focuses only on preserving balance after each move.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Balancing both sides',
    tags: ['algebra', 'worked example'],
    language: 'english',
    sessionId: 'preview-session-algebra',
    sourceUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y',
    videoId: 'xC-c7E5PK0Y',
    videoProvider: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/xC-c7E5PK0Y/hqdefault.jpg',
    durationSec: 392,
    recapText: 'If you add, subtract, multiply, or divide one side, do exactly the same to the other side before simplifying.',
    keyPoints: [
      'Treat each equation step as a balance scale.',
      'Avoid moving terms mentally without writing the mirrored operation.',
      'Pause before simplifying signs to prevent slips.',
    ],
    quickChecks: ['What operation keeps an equation balanced?', 'Why is writing each mirror step safer than mental jumps?'],
    keyIdea: 'Mirror every operation on both sides.',
    bestUse: 'Use right before solving mixed linear equation questions.',
    nextMove: 'Solve two equations and mark each balancing step.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T08:46:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'demo-media-video-linear-03',
    userId: 'demo-user',
    assetKind: 'video_recap',
    title: 'Linear equations sign-check recap',
    summary: 'A targeted recap for avoiding sign errors when terms cross the equals sign.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Sign changes',
    tags: ['algebra', 'accuracy'],
    language: 'english',
    sessionId: 'preview-session-algebra',
    sourceUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y',
    videoId: 'xC-c7E5PK0Y',
    videoProvider: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/xC-c7E5PK0Y/hqdefault.jpg',
    durationSec: 344,
    recapText: 'Most mistakes happen when negatives are moved carelessly. Circle negative terms before rearranging.',
    keyPoints: [
      'Highlight negative terms first.',
      'Move one term at a time and rewrite fully.',
      'Run a substitution check to confirm the final value.',
    ],
    quickChecks: ['When does a sign error usually happen?', 'How can you verify your answer quickly?'],
    keyIdea: 'Protect signs before simplifying.',
    bestUse: 'Use after one wrong attempt to reset method.',
    nextMove: 'Redo one missed equation using full written steps.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T09:08:00.000Z',
    updatedAt: '2026-04-05T09:18:00.000Z',
  },
  {
    id: 'demo-media-video-linear-04',
    userId: 'demo-user',
    assetKind: 'video_recap',
    title: 'Word problems into linear equations',
    summary: 'Translate sentences into equations, then solve using the same balancing routine.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Word problem translation',
    tags: ['algebra', 'application'],
    language: 'english',
    sessionId: 'preview-session-algebra',
    sourceUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y',
    videoId: 'xC-c7E5PK0Y',
    videoProvider: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/xC-c7E5PK0Y/hqdefault.jpg',
    durationSec: 468,
    recapText: 'Set one variable clearly, translate each phrase, then solve and test the answer in context.',
    keyPoints: [
      'Define the unknown before writing equations.',
      'Translate phrase-by-phrase to avoid missing terms.',
      'Test the result back in the sentence.',
    ],
    quickChecks: ['What is your first step before translating a word problem?', 'Why should you test the answer in context?'],
    keyIdea: 'Translate cleanly, then solve normally.',
    bestUse: 'Use before mixed algebra word problem drills.',
    nextMove: 'Convert one sentence-based question into an equation from memory.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T09:24:00.000Z',
    updatedAt: '2026-04-05T09:35:00.000Z',
  },
  {
    id: 'demo-media-audio-linear-01',
    userId: 'demo-user',
    assetKind: 'audio_recap',
    title: 'Linear equations quick voice note',
    summary: 'A one-minute spoken reminder of the balancing sequence for basic equations.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Quick recall',
    tags: ['audio recap', 'algebra'],
    language: 'english',
    sessionId: 'preview-session-algebra-audio',
    assetUrl: 'https://www.w3schools.com/html/horse.mp3',
    durationSec: 61,
    recapText: 'Isolate variable terms first, constants next, then divide by the coefficient and check the answer.',
    keyPoints: ['Variable terms first.', 'Constants second.', 'Always substitute to verify.'],
    quickChecks: ['After isolating terms, what comes next?', 'What final step confirms accuracy?'],
    keyIdea: 'Keep a fixed solving order.',
    bestUse: 'Play before a timed warm-up.',
    nextMove: 'Solve one equation without looking at notes.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T09:41:00.000Z',
    updatedAt: '2026-04-05T09:45:00.000Z',
  },
  {
    id: 'demo-media-audio-linear-02',
    userId: 'demo-user',
    assetKind: 'audio_recap',
    title: 'Linear equations negative numbers drill',
    summary: 'Spoken checklist for handling minus signs while moving terms.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Negative numbers',
    tags: ['audio recap', 'accuracy'],
    language: 'english',
    sessionId: 'preview-session-algebra-audio',
    assetUrl: 'https://www.w3schools.com/html/horse.ogg',
    durationSec: 57,
    recapText: 'Box negative values before rearranging and rewrite each line fully to avoid hidden sign flips.',
    keyPoints: ['Box negatives first.', 'Rewrite each line fully.', 'Do a substitution check.'],
    quickChecks: ['What do you mark before moving terms?', 'Why rewrite every line?'],
    keyIdea: 'Sign safety first.',
    bestUse: 'Use after making one sign mistake.',
    nextMove: 'Retry the same equation with deliberate sign tracking.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T09:48:00.000Z',
    updatedAt: '2026-04-05T09:55:00.000Z',
  },
  {
    id: 'demo-media-audio-linear-03',
    userId: 'demo-user',
    assetKind: 'audio_recap',
    title: 'Linear equations exam-speed recap',
    summary: 'A concise pacing note for solving accurately under exam time pressure.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Exam pacing',
    tags: ['audio recap', 'exam prep'],
    language: 'english',
    sessionId: 'preview-session-algebra-audio',
    assetUrl: 'https://www.w3schools.com/html/horse.mp3',
    durationSec: 73,
    recapText: 'Use two passes: first pass solves, second pass checks substitution and sign consistency.',
    keyPoints: ['Pass one: solve cleanly.', 'Pass two: verify substitution.', 'Spend final seconds on sign check.'],
    quickChecks: ['What are the two passes?', 'Which check catches most last-minute errors?'],
    keyIdea: 'Accuracy with pace needs a two-pass routine.',
    bestUse: 'Use five minutes before a quiz.',
    nextMove: 'Complete three equations with a timer and check each answer.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T10:00:00.000Z',
    updatedAt: '2026-04-05T10:07:00.000Z',
  },
  {
    id: 'demo-media-doc-linear-01',
    userId: 'demo-user',
    assetKind: 'generated_document',
    title: 'Linear equations method note',
    summary: 'Step-by-step written checklist for solving one-variable equations with fewer mistakes.',
    body: '1) Simplify both sides. 2) Move variable terms together. 3) Move constants. 4) Divide by coefficient. 5) Substitute to verify.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Method checklist',
    tags: ['document', 'checklist'],
    language: 'english',
    sessionId: 'preview-session-algebra-docs',
    recapText: 'This note gives a stable five-step routine students can repeat under pressure.',
    keyPoints: ['Simplify first.', 'Group variables on one side.', 'Verify by substitution.'],
    quickChecks: ['How many steps are in the checklist?', 'Which step confirms the answer?'],
    keyIdea: 'One routine repeated builds reliability.',
    bestUse: 'Use as a pre-practice checklist.',
    nextMove: 'Tick each step while solving two equations.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T10:10:00.000Z',
    updatedAt: '2026-04-05T10:16:00.000Z',
  },
  {
    id: 'demo-media-doc-linear-02',
    userId: 'demo-user',
    assetKind: 'generated_document',
    title: 'Common mistakes in linear equations',
    summary: 'Error-focused note covering sign mistakes, skipped steps, and missed substitutions.',
    body: 'Frequent errors: moving terms mentally, dropping minus signs, dividing one side only, skipping the substitution check.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Error correction',
    tags: ['document', 'mistakes'],
    language: 'english',
    sessionId: 'preview-session-algebra-docs',
    recapText: 'A correction note to reduce repeat mistakes in equation solving.',
    keyPoints: ['Write every transition line.', 'Track negative values explicitly.', 'Always substitute at the end.'],
    quickChecks: ['Which mistake appears most often?', 'What habit reduces sign errors?'],
    keyIdea: 'Most errors are process errors, not concept errors.',
    bestUse: 'Read right after checking a quiz.',
    nextMove: 'Pick one mistake pattern and avoid it on the next set.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T10:18:00.000Z',
    updatedAt: '2026-04-05T10:23:00.000Z',
  },
  {
    id: 'demo-media-image-linear-01',
    userId: 'demo-user',
    assetKind: 'generated_image',
    title: 'Linear equation balancing map',
    summary: 'Visual map showing legal moves on both sides of an equation.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Balance model',
    tags: ['image', 'visual recap', 'algebra'],
    language: 'english',
    imageUrl: MEDIA_DEMO_GRAPH_IMAGE,
    recapText: 'A visual cue that reinforces equal operations on each side of the equation.',
    keyIdea: 'Balanced moves preserve equality.',
    quickChecks: ['What must happen to both sides after one operation?', 'Which move would break balance?'],
    bestUse: 'Use before solving equations with fractions.',
    nextMove: 'Explain the balance model aloud in one sentence.',
    isSaved: true,
    sourceTrust: 'generated_educational',
    createdAt: '2026-04-05T10:28:00.000Z',
    updatedAt: '2026-04-05T10:28:00.000Z',
  },
  {
    id: 'demo-media-image-linear-02',
    userId: 'demo-user',
    assetKind: 'generated_image',
    title: 'Linear equation sign-safety visual',
    summary: 'Compact visual anchor for keeping track of negatives during term movement.',
    subject: 'math',
    topic: 'Linear equations',
    subtopic: 'Sign tracking',
    tags: ['image', 'signs', 'visual recap'],
    language: 'english',
    imageUrl: MEDIA_DEMO_DIAGRAM_IMAGE,
    recapText: 'Use color grouping to keep negatives and positives separated while rearranging.',
    keyIdea: 'Visual grouping prevents sign slips.',
    quickChecks: ['How do you track negative terms visually?', 'What do colors help you avoid?'],
    bestUse: 'Use before mixed-sign equation drills.',
    nextMove: 'Solve one mixed-sign equation and label each term group.',
    isSaved: true,
    sourceTrust: 'generated_educational',
    createdAt: '2026-04-05T10:31:00.000Z',
    updatedAt: '2026-04-05T10:31:00.000Z',
  },
  {
    id: 'demo-media-video-bio-01',
    userId: 'demo-user',
    assetKind: 'video_recap',
    title: 'Photosynthesis in one pass',
    summary: 'A fast concept video note for inputs, process, and output memory anchors.',
    subject: 'biology',
    topic: 'Photosynthesis',
    subtopic: 'Inputs and outputs',
    tags: ['biology', 'plants', 'recap'],
    language: 'english',
    sessionId: 'preview-session-video',
    sourceUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
    videoId: 'aircAruvnKk',
    videoProvider: 'youtube',
    thumbnailUrl: 'https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg',
    durationSec: 590,
    recapText:
      'Remember the chain: chlorophyll captures light, carbon dioxide plus water feed the process, glucose stores the energy.',
    keyPoints: [
      'Sunlight is the energy source.',
      'CO2 and water are the inputs.',
      'Glucose and oxygen are outputs to recall.',
    ],
    quickChecks: [
      'Which gas enters the leaf as an input?',
      'What is the main stored product students should mention?',
    ],
    keyIdea: 'Inputs, process, outputs.',
    bestUse: 'Watch once before answering a short retrieval question.',
    nextMove: 'Explain photosynthesis in one sentence without notes.',
    isSaved: true,
    sourceTrust: 'verified_educational',
    createdAt: '2026-04-05T09:15:00.000Z',
    updatedAt: '2026-04-05T09:44:00.000Z',
  },
  {
    id: 'demo-media-audio-chem-01',
    userId: 'demo-user',
    assetKind: 'audio_recap',
    title: 'Neutralisation audio drill',
    summary: 'Short spoken recap for the acid + alkali pattern and salt naming.',
    subject: 'chemistry',
    topic: 'Neutralisation',
    tags: ['chemistry', 'audio recap'],
    language: 'english',
    sessionId: 'preview-session-audio',
    assetUrl: 'https://www.w3schools.com/html/horse.mp3',
    durationSec: 65,
    recapText:
      'Acid plus alkali gives salt and water. Name the salt from the acid and the alkali used in the reaction.',
    keyPoints: ['Pattern first: acid + alkali = salt + water.', 'Then identify the salt from reactants.'],
    quickChecks: [
      'What are the two products of neutralisation?',
      'What helps you identify the correct salt name?',
    ],
    keyIdea: 'Remember the reaction pattern before naming details.',
    bestUse: 'Play while commuting, then answer one recall question.',
    nextMove: 'Write one neutralisation example from memory.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T10:05:00.000Z',
    updatedAt: '2026-04-05T10:22:00.000Z',
  },
  {
    id: 'demo-media-audio-geo-01',
    userId: 'demo-user',
    assetKind: 'audio_recap',
    title: 'Climate graph reading audio',
    summary: 'Quick listening recap for axis-first graph reading and wettest-month detection.',
    subject: 'geography',
    topic: 'Climate graphs',
    tags: ['geography', 'graphs', 'audio recap'],
    language: 'english',
    sessionId: 'preview-session-geography',
    assetUrl: 'https://www.w3schools.com/html/horse.ogg',
    durationSec: 58,
    recapText:
      'Read the axes first, then rainfall bars, then the temperature line. This order prevents common interpretation mistakes.',
    quickChecks: ['Which part of the graph should you read first?', 'How do you locate the wettest month quickly?'],
    keyIdea: 'Use one reading order every time.',
    bestUse: 'Listen once, then annotate one fresh climate graph.',
    nextMove: 'Try a one-minute graph check in Revision.',
    isSaved: true,
    sourceTrust: 'trusted_source',
    createdAt: '2026-04-05T10:48:00.000Z',
    updatedAt: '2026-04-05T11:02:00.000Z',
  },
  {
    id: 'demo-media-image-graph-01',
    userId: 'demo-user',
    assetKind: 'generated_image',
    title: 'Climate graph visual explainer',
    summary: 'Annotated visual showing rainfall bars and temperature trend together.',
    subject: 'geography',
    topic: 'Climate graphs',
    tags: ['image', 'diagram', 'visual recap'],
    language: 'english',
    imageUrl: MEDIA_DEMO_GRAPH_IMAGE,
    durationSec: null,
    recapText: 'Use this visual to anchor what each element of a climate graph represents.',
    keyIdea: 'Bars and line carry different meanings.',
    quickChecks: ['Which element tracks rainfall?', 'Where do you find peak temperature?'],
    nextMove: 'Compare this visual with one exam-style graph.',
    isSaved: true,
    sourceTrust: 'generated_educational',
    createdAt: '2026-04-05T11:24:00.000Z',
    updatedAt: '2026-04-05T11:24:00.000Z',
  },
  {
    id: 'demo-media-image-chem-01',
    userId: 'demo-user',
    assetKind: 'visual_explainer',
    title: 'Neutralisation concept map',
    summary: 'Diagram-level visual for reactants, products, and quick naming reminders.',
    subject: 'chemistry',
    topic: 'Neutralisation',
    tags: ['chemistry', 'concept map', 'visual'],
    language: 'english',
    imageUrl: MEDIA_DEMO_DIAGRAM_IMAGE,
    recapText: 'A one-frame concept map to reduce reaction recall errors.',
    keyIdea: 'Map reactants to products before naming salts.',
    quickChecks: ['What products should always appear?', 'What detail changes between examples?'],
    bestUse: 'Use before short-answer revision.',
    nextMove: 'Do one corrected similar reaction example.',
    isSaved: true,
    sourceTrust: 'generated_educational',
    createdAt: '2026-04-05T12:08:00.000Z',
    updatedAt: '2026-04-05T12:20:00.000Z',
  },
];

function extractYouTubeId(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractVimeoId(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d{6,}$/.test(raw)) return raw;
  const patterns = [
    /vimeo\.com\/(?:video\/)?(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

type SearchWorkspaceFilter = 'all' | 'study_sessions' | 'revision' | 'media';
type SearchWorkspaceGroup = 'study_sessions' | 'revision' | 'media';
type SearchWorkspaceResultKind = 'session' | 'revision_item' | 'revision_collection';

type SearchWorkspaceResultBase = {
  id: string;
  kind: SearchWorkspaceResultKind;
  group: SearchWorkspaceGroup;
  title: string;
  preview: string;
  typeLabel: string;
  subject?: string | null;
  timeLabel?: string | null;
  score: number;
};

type SearchWorkspaceSessionResult = SearchWorkspaceResultBase & {
  kind: 'session';
  session: ChatSession;
};

type SearchWorkspaceRevisionItemResult = SearchWorkspaceResultBase & {
  kind: 'revision_item';
  item: RevisionItem;
  isMedia: boolean;
};

type SearchWorkspaceCollectionResult = SearchWorkspaceResultBase & {
  kind: 'revision_collection';
  collection: RevisionCollection;
};

type SearchWorkspaceResult =
  | SearchWorkspaceSessionResult
  | SearchWorkspaceRevisionItemResult
  | SearchWorkspaceCollectionResult;

type SearchWorkspaceSection = {
  id: SearchWorkspaceFilter;
  label: string;
  results: SearchWorkspaceResult[];
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenizeSearchText(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function joinSearchParts(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isValidSearchDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const next = value instanceof Date ? value : new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
}

function getSearchRecencyScore(value: Date | string | null | undefined) {
  const date = isValidSearchDate(value);
  if (!date) return 0;
  const daysOld = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return Math.max(0, Math.round(36 * Math.exp(-daysOld / 21)));
}

function getSearchTimeLabel(value: Date | string | null | undefined) {
  const date = isValidSearchDate(value);
  if (!date) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDelta = Math.round((startOfToday - startOfDate) / 86_400_000);
  if (dayDelta === 0) return 'Today';
  if (dayDelta === 1) return 'Yesterday';
  if (dayDelta < 7) return `${dayDelta}d ago`;
  return formatWorkspaceDate(date);
}

function includesAllTokens(haystack: string, tokens: string[]) {
  return tokens.every((token) => haystack.includes(token));
}

function scoreSearchMatch({
  title,
  query,
  fields,
  date,
  importance = 0,
}: {
  title: string;
  query: string;
  fields: Array<string | null | undefined>;
  date?: Date | string | null;
  importance?: number;
}) {
  const normalizedQuery = normalizeSearchText(query);
  const searchableTitle = normalizeSearchText(title);
  const searchableFields = joinSearchParts(title, ...fields);
  const recencyScore = getSearchRecencyScore(date);

  if (!normalizedQuery) {
    return importance + recencyScore;
  }

  const tokens = tokenizeSearchText(normalizedQuery);
  if (!tokens.length) return importance + recencyScore;

  if (!includesAllTokens(searchableFields, tokens)) return -1;

  let score = importance + recencyScore;

  if (searchableTitle === normalizedQuery) score += 1000;
  else if (searchableTitle.startsWith(normalizedQuery)) score += 700;
  else if (searchableTitle.includes(normalizedQuery)) score += 450;

  if (includesAllTokens(searchableTitle, tokens)) score += 240;

  for (const token of tokens) {
    if (searchableTitle.includes(token)) score += 48;
    if (searchableFields.includes(token)) score += 18;
  }

  return score;
}

function getSessionImportance(session: ChatSession) {
  let score = 0;
  if (session.revisionCount) score += Math.min(12, session.revisionCount);
  if (session.hadArtifacts) score += 6;
  if (session.hadVideo) score += 6;
  if (session.continuationStatus) score += 4;
  return score;
}

function getRevisionImportance(item: RevisionItem) {
  let score = 0;
  if (item.isPinned) score += 40;
  if (item.examPriority) score += 28;
  if (item.needsPractice) score += 20;
  if (item.isMistakeBased) score += 18;
  if (item.reviewStatus === 'needs_attention') score += 20;
  else if (item.reviewStatus === 'review_due') score += 16;
  else if (item.reviewStatus === 'practising') score += 10;
  if (item.recentOutcome === 'struggled') score += 10;
  else if (item.recentOutcome === 'partial') score += 6;
  else if (item.recentOutcome === 'completed') score += 4;
  if (typeof item.featuredRank === 'number' && Number.isFinite(item.featuredRank)) {
    score += Math.max(0, 14 - item.featuredRank * 2);
  }
  if (item.saveType === 'worked_step') score += 6;
  if (item.saveType === 'mistake_to_fix') score += 12;
  return score;
}

function getCollectionImportance(collection: RevisionCollection) {
  let score = 0;
  if (collection.pinned) score += 24;
  if (collection.examFocus) score += 18;
  if (collection.kind === 'bundle') score += 8;
  if (collection.itemCount) score += Math.min(10, collection.itemCount);
  return score;
}

function getRevisionItemTypeLabel(item: RevisionItem) {
  const contentType = String(item.contentType || '').toLowerCase();
  const saveType = String(item.saveType || '').toLowerCase();
  const mediaType = String(item.mediaType || '').toLowerCase();
  const sourceType = String(item.sourceType || '').toLowerCase();

  if (mediaType === 'audio' || contentType === 'audio' || sourceType === 'tutor_audio' || item.audioUrl) return 'Audio recap';
  if (mediaType === 'video' || contentType === 'video' || sourceType === 'tutor_video' || item.videoId) return 'Video recap';
  if (mediaType === 'image' || contentType === 'image' || sourceType === 'tutor_image' || item.imageUrl) return 'Image note';
  if (mediaType === 'mixed') return 'Media recap';
  if (saveType === 'worked_step' || contentType === 'worked_step') return 'Worked step';
  if (saveType === 'mistake_to_fix' || contentType === 'misconception' || item.isMistakeBased) return 'Mistake';
  if (contentType === 'formula' || saveType === 'formula') return 'Formula';
  if (contentType === 'definition' || saveType === 'definition') return 'Definition';
  if (contentType === 'practice_tip' || saveType === 'practice_item') return 'Practice item';
  if (contentType === 'correction') return 'Correction';
  if (contentType === 'exam_trap') return 'Exam trap';
  if (contentType === 'summary') return 'Summary';
  if (contentType === 'explanation') return 'Explanation';
  return 'Revision note';
}

function isMediaRevisionItem(item: RevisionItem) {
  const contentType = String(item.contentType || '').toLowerCase();
  const mediaType = String(item.mediaType || '').toLowerCase();
  const sourceType = String(item.sourceType || '').toLowerCase();
  return (
    mediaType === 'audio' ||
    mediaType === 'video' ||
    mediaType === 'image' ||
    mediaType === 'mixed' ||
    contentType === 'audio' ||
    contentType === 'video' ||
    contentType === 'image' ||
    sourceType === 'tutor_audio' ||
    sourceType === 'tutor_video' ||
    sourceType === 'tutor_image' ||
    Boolean(item.audioUrl || item.videoId || item.imageUrl || item.transcriptSnippet)
  );
}

function getRevisionItemPreview(item: RevisionItem) {
  return (
    item.summary ||
    item.studentNote ||
    item.transcriptSnippet ||
    item.selectedText ||
    item.topic ||
    item.subtopic ||
    item.content ||
    'Open this saved learning moment.'
  );
}

function getSessionPreview(session: ChatSession) {
  return (
    session.summary ||
    session.firstMessage ||
    session.lastTutorFocus ||
    session.topic ||
    'Open this study session to continue from the same context.'
  );
}

function getCollectionPreview(collection: RevisionCollection) {
  return (
    collection.bundleSummary ||
    collection.description ||
    collection.previewItems?.[0]?.summary ||
    collection.previewItems?.[0]?.title ||
    'Open this revision list to review its saved items.'
  );
}

function titleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeCompactText(value: unknown, maxLength = 140) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 3)).trimEnd()}...`;
}

function isDiscardableMediaText(value: unknown) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!text) return true;
  return [
    'could not fetch the transcript',
    'transcript is not confirmed yet',
    'transcript unavailable',
    'transcript not available',
    'no transcript',
    'failed to fetch transcript',
    'unable to fetch transcript',
    'undefined',
    'null',
    'n/a',
  ].some((token) => text.includes(token));
}

function normalizeCompactList(value: unknown, limit = 3, maxLength = 120) {
  if (!Array.isArray(value)) return [] as string[];
  const seen = new Set<string>();
  const next: string[] = [];
  value.forEach((item) => {
    if (next.length >= limit) return;
    const normalized = normalizeCompactText(item, maxLength);
    if (!normalized) return;
    if (isDiscardableMediaText(normalized)) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    next.push(normalized);
  });
  return next;
}

function formatMetadataToken(value: unknown) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  return raw
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildMediaTeachingContext(asset: MediaAsset) {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const notes: string[] = [];
  const intent = formatMetadataToken(metadata.recommendedIntent || metadata.externalRole || metadata.learningNeed);
  if (intent) notes.push(`Designed for ${intent.toLowerCase()}.`);
  const whyRecommended = normalizeCompactText(metadata.whyRecommended, 135);
  if (whyRecommended) notes.push(whyRecommended);
  const channelTitle = normalizeCompactText(metadata.channelTitle, 76);
  if (channelTitle) notes.push(`Source channel: ${channelTitle}.`);
  const trustSignal = formatMetadataToken(asset.sourceTrust || metadata.trustTier || metadata.sourceTrust);
  if (trustSignal) notes.push(`Trust signal: ${trustSignal.toLowerCase()}.`);
  const transcriptFlag = metadata.transcriptAvailable;
  if (typeof transcriptFlag === 'boolean') {
    if (transcriptFlag) {
      notes.push('Transcript available for deeper review.');
    }
  }
  const transcriptClue = normalizeCompactText(asset.transcriptSnippet, 135);
  if (transcriptClue && !isDiscardableMediaText(transcriptClue)) notes.push(`Transcript clue: ${transcriptClue}`);
  const seen = new Set<string>();
  return notes.filter((note) => {
    const key = note.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

function hasUsefulTeachingText(value: unknown, minWords = 4, minChars = 18) {
  const text = normalizeCompactText(value, 180);
  if (!text) return false;
  if (isDiscardableMediaText(text)) return false;
  const words = text
    .replace(/[^\w\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return text.length >= minChars || words.length >= minWords;
}

function firstUsefulTeachingText(
  values: unknown[],
  options?: {
    maxLength?: number;
    minWords?: number;
    minChars?: number;
  }
) {
  const maxLength = options?.maxLength ?? 180;
  const minWords = options?.minWords ?? 4;
  const minChars = options?.minChars ?? 18;
  for (const value of values) {
    const text = normalizeCompactText(value, maxLength);
    if (!text) continue;
    if (hasUsefulTeachingText(text, minWords, minChars)) return text;
  }
  return null;
}

const CREATIVE_ENGINE_CACHE_STORAGE_KEY = 'steadfast.media.creative.engine-cache.v1';
const STUDY_ORBIT_TRACKING_STORAGE_KEY = 'steadfast.media.study.orbit-tracking.v1';
const CREATIVE_ENGINE_CACHE_TTL_MS = 45 * 60 * 1000;
const CREATIVE_ENGINE_CACHE_MAX_KEYS = 6;
const CREATIVE_ENGINE_CACHE_MAX_CARDS = 48;

type WorkspaceMetric = {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

function WorkspaceMetricCard({ label, value, detail, icon: Icon }: WorkspaceMetric) {
  return (
    <article className="copilot-workspace-stat px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{detail}</p>
        </div>
        <span className="copilot-workspace-icon h-10 w-10 rounded-2xl">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </article>
  );
}

const studyStreamCardMotion = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 42 : -42,
    y: 22,
    scale: 0.982,
    filter: 'blur(10px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      ease: [0.22, 0.61, 0.36, 1] as const,
      filter: { duration: 0.28 },
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -32 : 32,
    y: -16,
    scale: 0.99,
    filter: 'blur(8px)',
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 1, 1] as const,
    },
  }),
};

const orbitStepMotion = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  animate: (active: boolean) => ({
    opacity: 1,
    y: 0,
    scale: active ? 1.01 : 1,
  }),
};

function WorkspaceHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  nextMove,
  stats,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  nextMove?: string;
  stats?: WorkspaceMetric[];
  actions?: React.ReactNode;
}) {
  void nextMove;
  void stats;
  return (
    <section className="copilot-workspace-hero">
      <div className="relative z-[1] flex items-start gap-4">
        <span className="copilot-workspace-icon shrink-0">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 max-w-3xl">
          <span className="sr-only">{eyebrow}</span>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--copilot-text-primary)] md:text-[2rem]">
            {title}
          </h1>
          <p className="sr-only">{description}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

function LegacySearchWorkspace({
  query,
  setQuery,
  history,
  isHistoryLoading,
  historyError,
  revisionOverview,
  onOpenSession,
  onOpenRevisionItem,
}: {
  query: string;
  setQuery: (query: string) => void;
  history: ChatSession[];
  isHistoryLoading: boolean;
  historyError: string;
  revisionOverview: RevisionOverview | null;
  onOpenSession: (session: ChatSession) => void;
  onOpenRevisionItem: (item: RevisionItem) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const revisionItems = useMemo(() => uniqueRevisionItems(revisionOverview), [revisionOverview]);

  const historyResults = useMemo(() => {
    if (!normalizedQuery) return history.slice(0, 8);
    return history.filter((session) => {
      const haystack = [
        session.title || '',
        session.topic || '',
        session.summary || '',
        session.firstMessage || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [history, normalizedQuery]);

  const revisionResults = useMemo(() => {
    if (!normalizedQuery) return revisionItems.slice(0, 8);
    return revisionItems.filter((item) =>
      [
        item.title,
        item.summary || '',
        item.topic || '',
        item.subject || '',
        item.collectionTitle || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery, revisionItems]);

  const collectionCount = Number(revisionOverview?.totalCollections || 0);
  const totalSearchableItems = history.length + revisionItems.length;
  const quickSearches = useMemo(() => {
    const candidates = [
      ...revisionItems.flatMap((item) => [item.topic, item.subject, item.collectionTitle, item.title]),
      ...history.flatMap((session) => [session.topic, session.title]),
    ]
      .map((value) => String(value || '').trim())
      .filter((value) => value.length > 2);
    const seen = new Set<string>();
    return candidates
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [history, revisionItems]);

  const searchStats: WorkspaceMetric[] = [
    {
      label: 'Searchable moments',
      value: totalSearchableItems,
      detail: 'Sessions, revision saves, and recap materials in one place.',
      icon: Search,
    },
    {
      label: 'Study sessions',
      value: history.length,
      detail: 'Return to past tutoring context quickly.',
      icon: Compass,
    },
    {
      label: 'Revision items',
      value: revisionItems.length,
      detail: 'Jump into definitions, mistakes, steps, and saved explanations.',
      icon: BookMarked,
    },
    {
      label: 'Revision lists',
      value: collectionCount,
      detail: 'Search across your revision library structure.',
      icon: Workflow,
    },
  ];

  const searchNextMove = normalizedQuery
    ? 'Open the strongest match, then continue from that exact context instead of restarting the explanation.'
    : 'Start with a topic, question type, subject, or saved note title to jump directly into the right learning context.';

  return (
    <div className="copilot-workspace-scroll">
      <div className="copilot-workspace-container space-y-5">
        <WorkspaceHero
          eyebrow="Search studio"
          title="Find the exact study moment you need"
          description="Search across recent sessions, revision saves, and recap materials so students can return to the right context without friction."
          icon={Search}
          nextMove={searchNextMove}
          stats={searchStats}
        />

        <section className="copilot-workspace-panel copilot-hover-reveal-group p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--copilot-text-primary)]">
                Search by topic, question type, saved note, or study session
              </h2>
            </div>
            {quickSearches.length ? (
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="copilot-revision-pill"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search study history, revision saves, and recap materials"
              className="copilot-sidebar-search h-12 rounded-[1.15rem] pl-11 text-sm"
            />
          </div>

          {normalizedQuery ? (
            <p className="mt-3 text-sm text-[var(--copilot-text-secondary)]">
              Showing the strongest matches for <span className="font-semibold text-[var(--copilot-text-primary)]">&quot;{query.trim()}&quot;</span>.
            </p>
          ) : null}
        </section>

        {historyError ? (
          <section className="copilot-state-card copilot-state-card-error px-4 py-3">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Search could not load study history fully</p>
            <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">{historyError}</p>
          </section>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="copilot-workspace-panel copilot-workspace-panel-muted p-5">
            <div>
              <h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Resume recent explanations and worked examples</h3>
            </div>

            {isHistoryLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`search-history-skeleton-${index}`} className="h-16 animate-pulse rounded-2xl bg-[var(--copilot-surface-muted)]" />
                ))}
              </div>
            ) : historyResults.length === 0 ? (
              <div className="copilot-empty-state mt-4 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No study sessions match yet</p>
                <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  Try another keyword, search by topic, or open a new session to create more searchable learning history.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {historyResults.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onOpenSession(session)}
                    className="copilot-control-nav flex w-full items-start justify-between gap-4 rounded-[1.1rem] px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">
                        {session.title || session.topic || 'Study session'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {session.summary || session.firstMessage || 'Open this session and continue from the exact learning context.'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium text-[var(--copilot-text-tertiary)]">
                        {formatWorkspaceDate(session.updatedAt || session.createdAt)}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--copilot-workspace-strong)]">
                        Open <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="copilot-workspace-panel p-5">
            <div>
              <h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Jump straight into saved notes and recap materials</h3>
            </div>

            {revisionResults.length === 0 ? (
              <div className="copilot-empty-state mt-4 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No revision items match this search</p>
                <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  Save worked steps, corrections, or recap notes to make the library easier to search and revisit later.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {revisionResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenRevisionItem(item)}
                    className="copilot-control-nav flex w-full items-start gap-3 rounded-[1.1rem] px-4 py-3 text-left"
                  >
                    <span className="copilot-workspace-icon h-10 w-10 shrink-0 rounded-2xl">
                      <BookMarked className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                        {item.subject ? <span className="copilot-revision-pill">{item.subject}</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {item.summary || item.topic || 'Open this saved note in the Revision workspace.'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--copilot-text-tertiary)]">
                        {item.collectionTitle ? <span>{item.collectionTitle}</span> : null}
                        {item.updatedAt ? <span>{formatWorkspaceDate(item.updatedAt)}</span> : null}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--copilot-workspace-strong)]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-[var(--copilot-soft-line)] px-6 py-5">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">Find chats, revision lists, and saved notes</h2>
        <div className="relative mt-4 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search study history and revision library"
            className="copilot-sidebar-search h-11 rounded-2xl pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="copilot-sidebar-card space-y-3">
            <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">Recent Study</h3>
            {historyError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{historyError}</p>
            ) : null}
            {isHistoryLoading ? (
              <p className="text-sm text-[var(--copilot-text-secondary)]">Loading recent study sessions…</p>
            ) : historyResults.length === 0 ? (
              <p className="text-sm text-[var(--copilot-text-secondary)]">No sessions match this search yet.</p>
            ) : (
              <div className="space-y-2">
                {historyResults.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onOpenSession(session)}
                    className="w-full rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--copilot-surface-muted)]"
                  >
                    <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{session.title || session.topic || 'Untitled session'}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--copilot-text-secondary)]">{session.summary || session.firstMessage || 'Open this session to continue where you left off.'}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="copilot-sidebar-card space-y-3">
            <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">Revision matches</h3>
            {revisionResults.length === 0 ? (
              <p className="text-sm text-[var(--copilot-text-secondary)]">No revision items match this search yet.</p>
            ) : (
              <div className="space-y-2">
                {revisionResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenRevisionItem(item)}
                    className="w-full rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--copilot-surface-muted)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--copilot-text-tertiary)]">
                        Open <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--copilot-text-secondary)]">{item.summary || item.topic || 'Open this item in Revision workspace.'}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

type SearchScope = 'all' | 'sessions' | 'revision' | 'media';
type SearchResultKind = 'session' | 'revision_collection' | 'revision_item' | 'media_item';

type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  preview: string;
  subject?: string | null;
  topic?: string | null;
  dateLabel: string;
  score: number;
  pinned?: boolean;
  itemCount?: number | null;
  collectionTitle?: string | null;
  mediaKindLabel?: string | null;
  onSelect: () => void;
};

function normalizeSearchWorkspaceText(value: string | null | undefined) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatSearchWorkspaceRelativeDate(value: Date | string | null | undefined) {
  if (!value) return 'Recent';
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return 'Recent';
  const diffMs = Date.now() - dateValue.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(dateValue);
}

function getSearchWorkspaceMediaKind(item: RevisionItem): 'audio' | 'video' | 'image' | 'document' | null {
  const mediaType = normalizeSearchWorkspaceText(item.mediaType || undefined);
  const contentType = normalizeSearchWorkspaceText(item.contentType || undefined);
  const sourceType = normalizeSearchWorkspaceText(item.sourceType || undefined);
  const haystack = `${mediaType} ${contentType} ${sourceType}`;
  if (haystack.includes('audio')) return 'audio';
  if (haystack.includes('video')) return 'video';
  if (haystack.includes('image')) return 'image';
  if (haystack.includes('document') || haystack.includes('doc') || haystack.includes('pdf')) return 'document';
  if (item.audioUrl || item.audioRecapRef) return 'audio';
  if (item.videoId || item.videoTitle) return 'video';
  if (item.imageUrl) return 'image';
  return null;
}

function scoreSearchWorkspaceCandidate(
  query: string,
  fields: Array<string | null | undefined>,
  options?: { pinned?: boolean; recency?: Date | string | null; importance?: number }
) {
  const q = normalizeSearchWorkspaceText(query);
  const normalizedFields = fields.map((field) => normalizeSearchWorkspaceText(field)).filter(Boolean);
  const joined = normalizedFields.join(' ');
  const titleField = normalizedFields[0] || '';
  let score = 0;

  if (q) {
    const tokens = q.split(' ').filter(Boolean);
    if (titleField === q) score += 200;
    else if (titleField.startsWith(q)) score += 120;
    else if (titleField.includes(q)) score += 85;
    for (const field of normalizedFields) {
      if (field === q) score += 120;
      if (field.startsWith(q)) score += 80;
      if (field.includes(q)) score += 55;
      if (tokens.length > 1 && tokens.every((token) => field.includes(token))) score += 35;
      for (const token of tokens) {
        if (field.includes(token)) score += 4;
      }
    }
    if (tokens.length > 1 && tokens.every((token) => joined.includes(token))) {
      score += 18;
    }
    if (score === 0) return 0;
  }

  const dateValue = options?.recency ? new Date(options.recency) : null;
  if (dateValue && !Number.isNaN(dateValue.getTime())) {
    const diffDays = Math.max(0, (Date.now() - dateValue.getTime()) / 86400000);
    score += Math.max(0, 18 - diffDays * 2);
  }

  if (options?.pinned) score += 22;
  if (options?.importance) score += options.importance;

  return score;
}

function SearchResultRow({
  result,
  icon: Icon,
}: {
  result: SearchResult;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={result.onSelect}
      className="group flex w-full items-start gap-3 rounded-[1.1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[var(--copilot-workspace-strong)]/20 hover:bg-[var(--copilot-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--copilot-workspace-strong)]/30"
    >
      <span className="copilot-workspace-icon mt-0.5 h-10 w-10 shrink-0 rounded-2xl">
        <Icon className="h-4.5 w-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{result.title}</p>
          {result.pinned ? <span className="copilot-revision-pill">Pinned</span> : null}
        </div>
        <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{result.preview}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="copilot-revision-pill">
            {result.kind === 'session'
              ? 'Session'
              : result.kind === 'revision_collection'
                ? 'Revision list'
                : result.kind === 'media_item'
                  ? result.mediaKindLabel || 'Media'
                  : 'Revision item'}
          </span>
          {result.subject ? <span className="copilot-revision-pill">{result.subject}</span> : null}
          {result.collectionTitle ? <span className="copilot-revision-pill">{result.collectionTitle}</span> : null}
          {result.itemCount ? <span className="copilot-revision-pill">{result.itemCount} items</span> : null}
          <span className="text-[11px] text-[var(--copilot-text-tertiary)]">{result.dateLabel}</span>
        </div>
      </div>

      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--copilot-workspace-strong)] opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}

function SearchSection({
  label,
  icon: Icon,
  count,
  emptyText,
  results,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  emptyText: string;
  results: SearchResult[];
}) {
  void count;
  return (
    <section className="copilot-workspace-panel p-5">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="copilot-workspace-icon h-9 w-9 rounded-2xl">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h3 className="min-w-0 text-base font-semibold text-[var(--copilot-text-primary)]">{label}</h3>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--copilot-text-primary)]">No matches in this section yet</p>
          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{emptyText}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {results.map((result) => {
            const icon =
              result.kind === 'session'
                ? Compass
                : result.kind === 'revision_collection'
                  ? Workflow
                  : result.kind === 'media_item'
                    ? PlayCircle
                    : BookMarked;
            return <SearchResultRow key={result.id} result={result} icon={icon} />;
          })}
        </div>
      )}
    </section>
  );
}

function SearchSkeletonSection() {
  return (
    <section className="copilot-workspace-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
          <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
        </div>
        <div className="h-6 w-12 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`search-skeleton-${index}`}
            className="h-16 animate-pulse rounded-[1.1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)]"
          />
        ))}
      </div>
    </section>
  );
}

function SearchWorkspace({
  query,
  setQuery,
  history,
  isHistoryLoading,
  historyError,
  revisionOverview,
  isRevisionLoading,
  revisionError,
  onOpenSession,
  onOpenRevisionCollection,
  onOpenRevisionItem,
  onOpenMediaItem,
}: {
  query: string;
  setQuery: (query: string) => void;
  history: ChatSession[];
  isHistoryLoading: boolean;
  historyError: string;
  revisionOverview: RevisionOverview | null;
  isRevisionLoading: boolean;
  revisionError: string;
  onOpenSession: (session: ChatSession) => void;
  onOpenRevisionCollection: (collection: RevisionCollection) => void;
  onOpenRevisionItem: (item: RevisionItem) => void;
  onOpenMediaItem: (item: RevisionItem) => void;
}) {
  const [scope, setScope] = useState<SearchScope>('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchWorkspaceText(deferredQuery);
  const revisionItems = useMemo(() => uniqueRevisionItems(revisionOverview), [revisionOverview]);
  const collections = useMemo(() => revisionOverview?.collections || [], [revisionOverview]);

  const sessionResults = useMemo<SearchResult[]>(() => {
    return history
      .map((session) => {
        const score = scoreSearchWorkspaceCandidate(deferredQuery, [session.title, session.topic, session.summary, session.firstMessage], {
          recency: session.updatedAt || session.createdAt,
        });
        if (normalizedQuery && score === 0) return null;
        return {
          id: session.id,
          kind: 'session' as const,
          title: session.title || session.topic || 'Study session',
          preview: session.summary || session.firstMessage || 'Open this session and continue from the exact learning context.',
          topic: session.topic || null,
          subject: null,
          dateLabel: formatSearchWorkspaceRelativeDate(session.updatedAt || session.createdAt),
          score,
          pinned: false,
          onSelect: () => onOpenSession(session),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 8) as SearchResult[];
  }, [deferredQuery, history, normalizedQuery, onOpenSession]);

  const revisionCollectionResults = useMemo<SearchResult[]>(() => {
    return collections
      .map((collection) => {
        const previewItems = collection.previewItems || [];
        const previewText =
          collection.bundleSummary ||
          collection.description ||
          previewItems[0]?.summary ||
          previewItems[0]?.topic ||
          'Open this revision list to continue from the right saved items.';
        const score = scoreSearchWorkspaceCandidate(deferredQuery, [collection.title, collection.topic, collection.subject, collection.description, collection.bundleSummary, previewText], {
          recency: collection.latestItemAt || collection.updatedAt,
          pinned: Boolean(collection.pinned || collection.examFocus),
          importance: collection.examFocus ? 8 : collection.pinned ? 6 : 0,
        });
        if (normalizedQuery && score === 0) return null;
        return {
          id: collection.id,
          kind: 'revision_collection' as const,
          title: collection.title,
          preview: previewText,
          subject: collection.subject || null,
          topic: collection.topic || null,
          itemCount: collection.itemCount || previewItems.length || null,
          dateLabel: formatSearchWorkspaceRelativeDate(collection.latestItemAt || collection.updatedAt),
          score,
          pinned: Boolean(collection.pinned || collection.examFocus),
          collectionTitle: collection.kind === 'bundle' ? 'Bundle' : null,
          onSelect: () => onOpenRevisionCollection(collection),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 8) as SearchResult[];
  }, [collections, deferredQuery, normalizedQuery, onOpenRevisionCollection]);

  const revisionItemResults = useMemo<SearchResult[]>(() => {
    return revisionItems
      .map((item) => {
        if (getSearchWorkspaceMediaKind(item)) return null;
        const score = scoreSearchWorkspaceCandidate(
          deferredQuery,
          [item.title, item.summary, item.topic, item.subject, item.collectionTitle, item.tags?.join(' '), item.selectedText, item.studentNote],
          {
            recency: item.updatedAt || item.createdAt,
            pinned: Boolean(item.isPinned),
            importance: item.isMistakeBased ? 8 : item.needsPractice ? 6 : item.examPriority ? 4 : item.featuredRank ? Math.max(1, 6 - item.featuredRank) : 0,
          }
        );
        if (normalizedQuery && score === 0) return null;
        return {
          id: item.id,
          kind: 'revision_item' as const,
          title: item.title,
          preview: item.summary || item.topic || item.studentNote || 'Open this saved item in Revision.',
          subject: item.subject || null,
          topic: item.topic || null,
          dateLabel: formatSearchWorkspaceRelativeDate(item.updatedAt || item.createdAt),
          score,
          pinned: Boolean(item.isPinned),
          collectionTitle: item.collectionTitle || null,
          onSelect: () => onOpenRevisionItem(item),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10) as SearchResult[];
  }, [deferredQuery, normalizedQuery, onOpenRevisionItem, revisionItems]);

  const mediaResults = useMemo<SearchResult[]>(() => {
    return revisionItems
      .map((item) => {
        const mediaKind = getSearchWorkspaceMediaKind(item);
        if (!mediaKind) return null;
        const score = scoreSearchWorkspaceCandidate(
          deferredQuery,
          [item.title, item.summary, item.topic, item.subject, item.collectionTitle, item.videoTitle, item.transcriptSnippet, item.studentNote],
          {
            recency: item.updatedAt || item.createdAt,
            pinned: Boolean(item.isPinned),
            importance: item.mediaType ? 6 : 4,
          }
        );
        if (normalizedQuery && score === 0) return null;
        return {
          id: item.id,
          kind: 'media_item' as const,
          title: item.title,
          preview: item.summary || item.transcriptSnippet || item.topic || 'Open this recap in Media for quicker review.',
          subject: item.subject || null,
          topic: item.topic || null,
          dateLabel: formatSearchWorkspaceRelativeDate(item.updatedAt || item.createdAt),
          score,
          pinned: Boolean(item.isPinned),
          collectionTitle: item.collectionTitle || null,
          mediaKindLabel: titleCase(mediaKind),
          onSelect: () => onOpenMediaItem(item),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10) as SearchResult[];
  }, [deferredQuery, normalizedQuery, onOpenMediaItem, revisionItems]);

  const scopeOptions: Array<{ id: SearchScope; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'sessions', label: 'Study sessions' },
    { id: 'revision', label: 'Revision' },
    { id: 'media', label: 'Media' },
  ];

  const visibleGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      count: number;
      results: SearchResult[];
      emptyText: string;
    }> = [];

    if (scope === 'all' || scope === 'sessions') {
      groups.push({
        key: 'sessions',
        label: 'Study sessions',
        icon: Compass,
        count: sessionResults.length,
        results: sessionResults,
        emptyText: 'Try a session title, topic, or a recent message fragment.',
      });
    }
    if (scope === 'all' || scope === 'revision') {
      groups.push({
        key: 'revision_collections',
        label: 'Revision lists',
        icon: Workflow,
        count: revisionCollectionResults.length,
        results: revisionCollectionResults,
        emptyText: 'Try a collection title, subject, or bundle topic.',
      });
      groups.push({
        key: 'revision_items',
        label: 'Revision items',
        icon: BookMarked,
        count: revisionItemResults.length,
        results: revisionItemResults,
        emptyText: 'Try a saved explanation, worked step, mistake, or note title.',
      });
    }
    if (scope === 'all' || scope === 'media') {
      groups.push({
        key: 'media',
        label: 'Media recaps',
        icon: PlayCircle,
        count: mediaResults.length,
        results: mediaResults,
        emptyText: 'Try audio recap, video note, image note, or transcript wording.',
      });
    }

    return groups;
  }, [mediaResults, revisionCollectionResults, revisionItemResults, scope, sessionResults]);

  const anyResults = visibleGroups.some((group) => group.results.length > 0);
  const isLoading = isHistoryLoading || isRevisionLoading;
  const errorMessages = [historyError, revisionError].filter(Boolean);

  return (
    <div className="copilot-workspace-scroll">
      <div className="copilot-workspace-container max-w-5xl space-y-4">
        <section className="copilot-workspace-panel copilot-hover-reveal-group p-5">
          <div className="flex flex-col gap-2">
            <p className="copilot-workspace-eyebrow">Search</p>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--copilot-text-primary)] md:text-[1.5rem]">
              Find the right past study moment fast
            </h2>
            <p className="copilot-hover-reveal-copy max-w-2xl text-sm leading-6 text-[var(--copilot-text-secondary)]">
              Search sessions, revision saves, collections, and recap media without leaving the flow.
            </p>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sessions, revision lists, notes, or recap media"
              className="copilot-sidebar-search h-12 rounded-[1.1rem] pl-11 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {scopeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setScope(option.id)}
                className={`copilot-revision-pill ${scope === option.id ? 'copilot-revision-pill-active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="copilot-hover-reveal-copy text-sm text-[var(--copilot-text-secondary)]">
            {normalizedQuery ? (
              <>
                Showing the strongest matches for <span className="font-semibold text-[var(--copilot-text-primary)]">&quot;{query.trim()}&quot;</span>.
              </>
            ) : (
              <>Start with a title, topic, or saved note to jump back into the right context.</>
            )}
          </p>
        </section>

        {errorMessages.length > 0 ? (
          <section className="copilot-state-card copilot-state-card-error px-4 py-3">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Some search sources loaded with limits</p>
            <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">{errorMessages.join(' ')}</p>
          </section>
        ) : null}

        {isLoading && !anyResults ? (
          <div className="space-y-4">
            <SearchSkeletonSection />
            <SearchSkeletonSection />
          </div>
        ) : anyResults ? (
          <div className="space-y-4">
            {visibleGroups.map((group) => (
              <SearchSection key={group.key} label={group.label} icon={group.icon} count={group.count} results={group.results} emptyText={group.emptyText} />
            ))}
          </div>
        ) : (
          <section className="copilot-workspace-panel copilot-hover-reveal-group px-5 py-4">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No matches yet</p>
            <p className="copilot-hover-reveal-copy text-sm leading-6 text-[var(--copilot-text-secondary)]">
              Try a title, topic, saved note, or session fragment to bring back the right study context.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function LegacySearchWorkspaceTwo({
  query,
  setQuery,
  history,
  isHistoryLoading,
  isRevisionLoading,
  historyError,
  revisionOverview,
  onOpenSession,
  onOpenRevisionItem,
  onOpenRevisionCollection,
  onOpenMediaItem,
}: {
  query: string;
  setQuery: (query: string) => void;
  history: ChatSession[];
  isHistoryLoading: boolean;
  isRevisionLoading: boolean;
  historyError: string;
  revisionOverview: RevisionOverview | null;
  onOpenSession: (session: ChatSession) => void;
  onOpenRevisionItem: (item: RevisionItem) => void;
  onOpenRevisionCollection: (collection: RevisionCollection) => void;
  onOpenMediaItem: (item: RevisionItem) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<SearchWorkspaceFilter>('all');
  const normalizedQuery = normalizeSearchText(query);
  const revisionItems = useMemo(() => uniqueRevisionItems(revisionOverview), [revisionOverview]);
  const revisionCollections = revisionOverview?.collections || [];

  const sessionResults = useMemo<SearchWorkspaceSessionResult[]>(() => {
    const results = history
      .map((session) => {
        const score = scoreSearchMatch({
          title: session.title || session.topic || 'Study session',
          query: normalizedQuery,
          fields: [
            session.topic,
            session.summary,
            session.firstMessage,
            session.lastTutorFocus,
            session.learningMode,
            session.continuationStatus,
            session.recentArtifactLabel,
            session.metadata ? JSON.stringify(session.metadata) : null,
          ],
          date: session.updatedAt || session.createdAt,
          importance: getSessionImportance(session),
        });

        if (score < 0) return null;

        return {
          id: session.id,
          kind: 'session',
          group: 'study_sessions',
          title: session.title || session.topic || 'Study session',
          preview: getSessionPreview(session),
          typeLabel: 'Study session',
          subject: session.topic || null,
          timeLabel: getSearchTimeLabel(session.updatedAt || session.createdAt),
          score,
          session,
        } satisfies SearchWorkspaceSessionResult;
      })
      .filter(Boolean) as SearchWorkspaceSessionResult[];

    return results.sort((left, right) => right.score - left.score).slice(0, normalizedQuery ? 8 : 6);
  }, [history, normalizedQuery]);

  const revisionItemResults = useMemo<SearchWorkspaceRevisionItemResult[]>(() => {
    const results = revisionItems
      .map((item) => {
        const score = scoreSearchMatch({
          title: item.title,
          query: normalizedQuery,
          fields: [
            item.summary,
            item.content,
            item.topic,
            item.subtopic,
            item.subject,
            item.collectionTitle,
            item.selectedText,
            item.studentNote,
            item.saveType,
            item.contentType,
            item.mediaType,
            item.sourceType,
            item.transcriptSnippet,
            item.videoTitle,
            item.tags?.join(' '),
            item.artifactLabels?.join(' '),
            item.metadata ? JSON.stringify(item.metadata) : null,
          ],
          date: item.updatedAt || item.lastPracticedAt || item.lastReviewedAt || item.createdAt,
          importance: getRevisionImportance(item),
        });

        if (score < 0) return null;

        const isMedia = isMediaRevisionItem(item);

        return {
          id: item.id,
          kind: 'revision_item',
          group: isMedia ? 'media' : 'revision',
          title: item.title,
          preview: getRevisionItemPreview(item),
          typeLabel: getRevisionItemTypeLabel(item),
          subject: item.subject || null,
          timeLabel: getSearchTimeLabel(item.updatedAt || item.lastPracticedAt || item.lastReviewedAt || item.createdAt),
          score,
          item,
          isMedia,
        } satisfies SearchWorkspaceRevisionItemResult;
      })
      .filter(Boolean) as SearchWorkspaceRevisionItemResult[];

    return results.sort((left, right) => right.score - left.score);
  }, [normalizedQuery, revisionItems]);

  const collectionResults = useMemo<SearchWorkspaceCollectionResult[]>(() => {
    const results = revisionCollections
      .map((collection) => {
        const score = scoreSearchMatch({
          title: collection.title,
          query: normalizedQuery,
          fields: [
            collection.subject,
            collection.topic,
            collection.description,
            collection.kind,
            collection.bundleSummary,
            collection.previewItems?.map((item) => [item.title, item.summary, item.topic, item.subject].filter(Boolean).join(' ')).join(' '),
          ],
          date: collection.latestItemAt || collection.updatedAt || collection.createdAt,
          importance: getCollectionImportance(collection),
        });

        if (score < 0) return null;

        return {
          id: collection.id,
          kind: 'revision_collection',
          group: 'revision',
          title: collection.title,
          preview: getCollectionPreview(collection),
          typeLabel: collection.kind === 'bundle' ? 'Revision bundle' : 'Revision list',
          subject: collection.subject || null,
          timeLabel: getSearchTimeLabel(collection.latestItemAt || collection.updatedAt || collection.createdAt),
          score,
          collection,
        } satisfies SearchWorkspaceCollectionResult;
      })
      .filter(Boolean) as SearchWorkspaceCollectionResult[];

    return results.sort((left, right) => right.score - left.score);
  }, [normalizedQuery, revisionCollections]);

  const revisionResults = useMemo(
    () =>
      [...collectionResults, ...revisionItemResults.filter((entry) => !entry.isMedia)]
        .sort((left, right) => right.score - left.score)
        .slice(0, normalizedQuery ? 10 : 6),
    [collectionResults, normalizedQuery, revisionItemResults]
  );

  const mediaResults = useMemo(
    () =>
      revisionItemResults
        .filter((entry) => entry.isMedia)
        .sort((left, right) => right.score - left.score)
        .slice(0, normalizedQuery ? 10 : 6),
    [normalizedQuery, revisionItemResults]
  );

  const allSections: SearchWorkspaceSection[] = useMemo(
    () => [
      { id: 'study_sessions', label: 'Study sessions', results: sessionResults },
      { id: 'revision', label: 'Revision', results: revisionResults },
      { id: 'media', label: 'Media', results: mediaResults },
    ],
    [mediaResults, revisionResults, sessionResults]
  );

  const visibleSections = allSections.filter((section) => activeFilter === 'all' || section.id === activeFilter);
  const totalResults = sessionResults.length + revisionResults.length + mediaResults.length;

  const quickSearches = useMemo(() => {
    const candidates = [
      ...revisionItems.flatMap((item) => [item.topic, item.subject, item.collectionTitle, item.title, item.saveType, item.contentType]),
      ...revisionCollections.flatMap((collection) => [collection.title, collection.subject, collection.topic, collection.description, collection.bundleSummary]),
      ...history.flatMap((session) => [session.topic, session.title, session.lastTutorFocus]),
    ]
      .map((value) => String(value || '').trim())
      .filter((value) => value.length > 2);
    const seen = new Set<string>();
    return candidates
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [history, revisionCollections, revisionItems]);

  const filterOptions: Array<{ id: SearchWorkspaceFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'study_sessions', label: 'Study sessions' },
    { id: 'revision', label: 'Revision' },
    { id: 'media', label: 'Media' },
  ];

  const renderResultRow = (entry: SearchWorkspaceResult) => {
    const isSession = entry.kind === 'session';
    const isCollection = entry.kind === 'revision_collection';
    const isMedia = entry.kind === 'revision_item' && entry.isMedia;
    const AccentIcon = isSession ? Compass : isCollection ? BookMarked : isMedia ? PlayCircle : FileText;

    return (
      <button
        key={`${entry.kind}-${entry.id}`}
        type="button"
        onClick={() => {
          if (entry.kind === 'session') {
            onOpenSession(entry.session);
            return;
          }
          if (entry.kind === 'revision_collection') {
            onOpenRevisionCollection(entry.collection);
            return;
          }
          if (entry.isMedia) {
            onOpenMediaItem(entry.item);
            return;
          }
          onOpenRevisionItem(entry.item);
        }}
        className="group copilot-control-nav flex w-full items-start gap-3 rounded-[1rem] px-3.5 py-3 text-left active:translate-y-0"
      >
        <span className="copilot-workspace-icon h-10 w-10 shrink-0 rounded-[1rem]">
          <AccentIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{entry.title || 'Untitled item'}</p>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{entry.preview}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="copilot-revision-type-pill">{entry.typeLabel}</span>
            {entry.subject ? <span className="copilot-revision-pill">{entry.subject}</span> : null}
            {entry.kind === 'revision_item' && entry.item.collectionTitle ? (
              <span className="copilot-revision-pill">{entry.item.collectionTitle}</span>
            ) : null}
            {entry.timeLabel ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--copilot-text-tertiary)]">
                <Clock3 className="h-3.5 w-3.5" />
                {entry.timeLabel}
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--copilot-text-tertiary)] transition-colors group-hover:text-[var(--copilot-workspace-strong)]" />
      </button>
    );
  };

  const renderSection = (section: SearchWorkspaceSection) => {
    const hasResults = section.results.length > 0;
    const isLoading = section.id === 'study_sessions' ? isHistoryLoading : isRevisionLoading;

    return (
      <section key={section.id} className="space-y-3 border-t border-[var(--copilot-soft-line)] pt-4 first:border-t-0 first:pt-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">{section.label}</h3>
            <p className="mt-0.5 text-xs text-[var(--copilot-text-tertiary)]">
              {section.id === 'study_sessions'
                ? 'Jump back into a tutoring thread.'
                : section.id === 'revision'
                  ? 'Open revision lists, worked steps, and saved notes.'
                  : 'Open media recaps and linked learning material.'}
            </p>
          </div>
          <span className="copilot-revision-pill">{section.results.length}</span>
        </div>

        {isLoading && !hasResults ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`${section.id}-skeleton-${index}`}
                className="flex items-start gap-3 rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3"
              >
                <div className="h-10 w-10 animate-pulse rounded-[1rem] bg-[var(--copilot-surface-muted)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : hasResults ? (
          <div className="space-y-2">{section.results.map((entry) => renderResultRow(entry))}</div>
        ) : (
          <div className="copilot-empty-state px-4 py-3">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
              {section.id === 'study_sessions'
                ? 'No sessions match this search'
                : section.id === 'revision'
                  ? 'No revision items match this search'
                  : 'No media recaps match this search'}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
              {section.id === 'study_sessions'
                ? 'Try a topic, title fragment, or just clear the search to return to recent study moments.'
                : section.id === 'revision'
                  ? 'Try a broader note title, subject, or collection name to surface nearby material.'
                  : 'Try a source title, media type, or transcript phrase to find the right recap.'}
            </p>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="copilot-workspace-scroll">
      <div className="copilot-workspace-container space-y-4">
        <header className="max-w-3xl px-1 pt-1">
          <p className="copilot-workspace-eyebrow">Search workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--copilot-text-primary)] md:text-[2rem]">
            Find the exact study moment you need
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--copilot-text-secondary)]">
            Search sessions, revision lists, media recaps, mistakes, and worked steps from one quiet retrieval surface.
          </p>
        </header>

        <section className="copilot-workspace-panel p-4 md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, topics, mistakes, worked steps, or recap terms"
              className="copilot-sidebar-search h-12 rounded-[1.15rem] pl-11 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`copilot-revision-pill ${activeFilter === filter.id ? 'copilot-revision-pill-active' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--copilot-text-secondary)]">
              {normalizedQuery ? (
                <>
                  Showing the strongest matches for{' '}
                  <span className="font-semibold text-[var(--copilot-text-primary)]">&quot;{query.trim()}&quot;</span>.
                </>
              ) : (
                'Exact titles are ranked first, then recent and important items.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-[var(--copilot-workspace-strong)] transition-colors hover:text-[var(--copilot-text-primary)]"
            >
              Clear search
            </button>
          </div>

          {quickSearches.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickSearches.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="copilot-revision-pill">
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {historyError ? (
          <section className="copilot-state-card copilot-state-card-error px-4 py-3">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Study sessions are partially unavailable</p>
            <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">{historyError}</p>
          </section>
        ) : null}

        <section className="copilot-workspace-panel p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="copilot-workspace-eyebrow">Results</p>
              <h2 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">
                Retrieval-first results grouped by learning type
              </h2>
            </div>
            <span className="copilot-revision-pill">{totalResults}</span>
          </div>

          <div className="mt-4 space-y-5">
            {visibleSections.length > 0 ? (
              visibleSections.map((section) => renderSection(section))
            ) : isHistoryLoading || isRevisionLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`search-empty-skeleton-${index}`}
                    className="flex items-start gap-3 rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-[1rem] bg-[var(--copilot-surface-muted)]" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                      <div className="h-3 w-5/6 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="copilot-empty-state px-4 py-4">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No results yet</p>
                <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  Try a broader title, switch filters, or clear the search to surface recent study moments.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MediaWorkspace({
  revisionOverview,
  mediaAssets,
  isMediaAssetsLoading,
  mediaAssetsError,
  onRetryMediaAssetsLoad,
  mediaStream,
  mediaStreamMeta,
  isMediaStreamLoading,
  mediaStreamError,
  onRetryMediaStreamLoad,
  mediaCollections,
  isMediaCollectionsLoading,
  mediaCollectionsError,
  onRetryMediaCollectionsLoad,
  onRecordMediaInteraction,
  onCreateMediaCollection,
  onAddAssetToMediaCollection,
  onRemoveAssetFromMediaCollection,
  onOpenRevisionItem,
  onOpenSession,
  mediaFilter,
  onMediaFilterChange,
  mediaMode,
  onMediaModeChange,
  selectedMediaItemId,
  onSelectMediaItem,
  mediaPreferenceProfile,
  onLaunchPrompt,
  modeFlags,
  surfaceKind = 'fullscreen',
}: {
  revisionOverview: RevisionOverview | null;
  mediaAssets: MediaAsset[];
  isMediaAssetsLoading: boolean;
  mediaAssetsError: string;
  onRetryMediaAssetsLoad?: () => void;
  mediaStream: MediaStreamItem[];
  mediaStreamMeta?: Omit<MediaStreamResponse, 'stream'> | null;
  isMediaStreamLoading: boolean;
  mediaStreamError: string;
  onRetryMediaStreamLoad?: () => void;
  mediaCollections: MediaCollection[];
  isMediaCollectionsLoading: boolean;
  mediaCollectionsError: string;
  onRetryMediaCollectionsLoad?: () => void;
  onRecordMediaInteraction?: (assetId: string, action: MediaInteractionAction, revisionItemId?: string | null) => void | Promise<void>;
  onCreateMediaCollection?: (payload: {
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    metadata?: Record<string, unknown>;
  }) => void | Promise<void>;
  onAddAssetToMediaCollection?: (collectionId: string, assetId: string) => void | Promise<void>;
  onRemoveAssetFromMediaCollection?: (collectionId: string, assetId: string) => void | Promise<void>;
  onOpenRevisionItem: (item: RevisionItem) => void;
  onOpenSession: (sessionId: string) => void;
  mediaFilter: FullscreenMediaFilter;
  onMediaFilterChange: (filter: FullscreenMediaFilter) => void;
  mediaMode: MediaWorkspaceMode;
  onMediaModeChange: (mode: MediaWorkspaceMode) => void;
  selectedMediaItemId: string | null;
  onSelectMediaItem: (itemId: string | null) => void;
  mediaPreferenceProfile?: MediaPreferenceProfile | null;
  onLaunchPrompt?: (prompt: string, intent?: string) => void;
  modeFlags?: Partial<FullscreenModeFlags>;
  surfaceKind?: CopilotSurfaceKind;
}) {
  type MediaWorkspaceEntry = {
    id: string;
    source: 'asset' | 'revision';
    isDemo?: boolean;
    mediaKind: FullscreenMediaFilter;
    title: string;
    summary: string | null;
    keyIdea: string | null;
    quickCheck: string | null;
    quickChecks: string[];
    conceptPoints: string[];
    teachingContext: string[];
    bestUse: string | null;
    nextMove: string | null;
    subject: string | null;
    topic: string | null;
    subtopic: string | null;
    sessionId: string | null;
    revisionItemId: string | null;
    createdAt: string | null;
    collectionTitle: string | null;
    sourceUrl: string | null;
    videoId: string | null;
    videoProvider: 'youtube' | 'vimeo' | 'unknown';
    audioUrl: string | null;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    durationSec: number | null;
    revisionItem: RevisionItem | null;
    asset: MediaAsset | null;
  };

  const studyTopicLabel = (entry: MediaWorkspaceEntry) =>
    normalizeCompactText(entry.topic || entry.subtopic || entry.title, 72) || 'this topic';

  const studyMediaNoun = (entry: MediaWorkspaceEntry) => {
    if (entry.mediaKind === 'image') return 'visual';
    if (entry.mediaKind === 'audio') return 'recap';
    if (entry.mediaKind === 'document') return 'note';
    return 'clip';
  };

  const buildStudyFocusLine = (
    entry: MediaWorkspaceEntry,
    reason?: string | null,
    guideCue?: string | null
  ) =>
    firstUsefulTeachingText([guideCue, entry.conceptPoints[0], entry.keyIdea, entry.summary, reason], {
      maxLength: 160,
      minWords: 4,
      minChars: 22,
    }) ||
    (entry.mediaKind === 'image'
      ? `Notice the visual pattern that makes ${studyTopicLabel(entry)} easier to remember.`
      : entry.mediaKind === 'audio'
        ? `Listen for the one idea that makes ${studyTopicLabel(entry)} easier to say from memory.`
        : `Watch for the step that makes ${studyTopicLabel(entry)} easier to explain.`);

  const buildStudyWhyNowLine = (
    entry: MediaWorkspaceEntry,
    reason?: string | null,
    weakAssist = false,
    guideWhyNow?: string | null
  ) =>
    firstUsefulTeachingText([guideWhyNow, entry.teachingContext[0], reason], {
      maxLength: 170,
      minWords: 5,
      minChars: 28,
    }) ||
    (weakAssist
      ? `Chosen because ${studyTopicLabel(entry)} is showing up as a weak area and this format can reset understanding quickly.`
      : entry.mediaKind === 'image'
        ? `Chosen because a visual explanation can make ${studyTopicLabel(entry)} click faster.`
        : entry.mediaKind === 'audio'
          ? `Chosen because a short recap can strengthen recall for ${studyTopicLabel(entry)}.`
          : `Chosen because a worked visual walkthrough can make ${studyTopicLabel(entry)} clearer.`);

  const buildStudyUnlockLine = (
    entry: MediaWorkspaceEntry,
    nextMove?: string | null,
    guideNextStep?: string | null
  ) =>
    firstUsefulTeachingText([guideNextStep, nextMove, entry.nextMove], {
      maxLength: 160,
      minWords: 4,
      minChars: 22,
    }) ||
    `Use this ${studyMediaNoun(entry)} to explain ${studyTopicLabel(entry)} in one sentence without notes.`;

  const buildStudyCheckLine = (entry: MediaWorkspaceEntry, quickCheck?: string | null) =>
    firstUsefulTeachingText([entry.quickChecks[0], entry.quickCheck, quickCheck], {
      maxLength: 150,
      minWords: 5,
      minChars: 26,
    }) ||
    `In one sentence, what is the main idea in ${studyTopicLabel(entry)}?`;

  type MediaWorkspaceCollectionEntry = {
    id: string;
    title: string;
    description: string | null;
    subject: string | null;
    topic: string | null;
    itemCount: number;
    items: MediaWorkspaceEntry[];
    nextAssetId: string | null;
    progressLabel: string | null;
  };

  type MediaLibraryCategory = FullscreenMediaFilter | 'collections';

  type StudyCoachContext = {
    entry: MediaWorkspaceEntry;
    focusLine: string;
    whyNowLine: string;
    unlockLine: string;
    checkLine: string;
    followUpCheck: string | null;
    anchorLine: string;
    weakAssist: boolean;
    completed: boolean;
  };

  type QuickChallengeFeedback = {
    tone: 'strong' | 'close' | 'retry' | 'empty';
    title: string;
    body: string;
    nextStep: string;
    hint?: string | null;
    revealHint: boolean;
    revealAnchor: boolean;
    canLock: boolean;
  };

  type TeachBackFeedback = {
    tone: 'strong' | 'close' | 'retry' | 'empty';
    title: string;
    body: string;
    nextStep: string;
    revealModelAnswer: boolean;
    canLock: boolean;
  };

  type CreativeLabVariant = 'spark' | 'reflect' | 'remix' | 'transfer' | 'story';

  type CreativeLabFeedback = {
    tone: 'strong' | 'close' | 'retry' | 'empty';
    title: string;
    body: string;
    nextStep: string;
    revealHint: boolean;
    revealAnchor: boolean;
    canLock: boolean;
  };

  type MediaInlineActionState =
    | {
        kind: 'quick_challenge';
        variant: 'challenge' | 'recall';
        context: StudyCoachContext;
        prompt: string;
        attempts: number;
        lastCheckedDraft: string;
        revealHint: boolean;
        revealAnchor: boolean;
        draft: string;
        feedback: QuickChallengeFeedback | null;
        lockedIn: boolean;
      }
    | {
        kind: 'teach_back';
        context: StudyCoachContext;
        attempts: number;
        revealModelAnswer: boolean;
        draft: string;
        feedback: TeachBackFeedback | null;
        lockedIn: boolean;
      }
    | {
        kind: 'linked_note';
        context: StudyCoachContext;
        noteTitle: string;
        noteSummary: string;
        noteExcerpt: string | null;
        studentNote: string | null;
        revealExcerpt: boolean;
      }
    | {
        kind: 'creative_lab';
        cardId: string;
        cardTitle: string;
        topicLabel: string;
        variant: CreativeLabVariant;
        prompt: string;
        hint: string;
        anchorLine: string;
        nextMove: string;
        selfCheckLine: string;
        signalTokens: string[];
        sourceEntry: MediaWorkspaceEntry | null;
        originStepId?: string | null;
        draft: string;
        feedback: CreativeLabFeedback | null;
        revealHint: boolean;
        revealAnchor: boolean;
        lockedIn: boolean;
      };

  type CreativeStreamCard = {
    id: string;
    sourceType: 'youtube' | 'vimeo';
    title: string;
    subject: string | null;
    topic: string | null;
    whyHelps: string;
    learningType: 'quick_intuition' | 'visual_explanation' | 'concept_recap' | 'worked_example';
    estimatedMinutes: number;
    mediaType: FullscreenMediaFilter;
    oneThingToNotice: string;
    nextMove: string;
    captionReady: boolean;
    sourceTrustScore: number;
    clarityScore: number;
    durationFit: 'short' | 'balanced';
    trustLabel: string;
    sourceLabel: string;
    sourceUrl: string | null;
    previewEntry: MediaWorkspaceEntry | null;
    reason: string;
    interaction: CreativeContractInteraction | null;
    availableActions: CreativeContractAction[];
    storyHook: string;
    sparkLine: string;
    reflectionLine: string;
    metacognitionLine: string;
    creationLine: string;
    transferLine: string;
    selfCheckLine: string;
    pulseLabel: string;
    engineMode: 'spark' | 'story' | 'remix' | 'logic' | 'transfer';
    creativeRole: 'spark' | 'notice' | 'reframe' | 'transfer' | 'deepen';
  };

  const creativeTopicLabel = (args: { topic?: string | null; title?: string | null }) =>
    normalizeCompactText(args.topic || args.title, 78) || 'this idea';

  const buildCreativeStoryHook = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
    whyHelps?: string | null;
    reason?: string | null;
  }) =>
    firstUsefulTeachingText(
      [args.previewEntry?.summary, args.previewEntry?.teachingContext[0], args.whyHelps, args.reason],
      { maxLength: 156, minWords: 5, minChars: 28 }
    ) || `A fresh creative angle for ${creativeTopicLabel(args)} so the idea feels easier to picture and explain.`;

  const buildCreativeSparkLine = (args: {
    topic?: string | null;
    title?: string | null;
    learningType: CreativeStreamCard['learningType'];
    previewEntry?: MediaWorkspaceEntry | null;
    whyHelps?: string | null;
  }) =>
    firstUsefulTeachingText(
      [args.previewEntry?.conceptPoints[0], args.previewEntry?.keyIdea, args.previewEntry?.summary, args.whyHelps],
      { maxLength: 150, minWords: 4, minChars: 24 }
    ) ||
    (args.learningType === 'visual_explanation'
      ? `Catch the picture or pattern that makes ${creativeTopicLabel(args)} easier to imagine.`
      : args.learningType === 'worked_example'
        ? `Watch for the move that turns ${creativeTopicLabel(args)} into something you can actually build or test.`
        : `Look for the one surprising angle that makes ${creativeTopicLabel(args)} feel more intuitive.`);

  const buildCreativeReflectionLine = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
    quickCheck?: string | null;
  }) =>
    firstUsefulTeachingText(
      [args.previewEntry?.quickChecks[0], args.previewEntry?.quickCheck, args.quickCheck],
      { maxLength: 150, minWords: 5, minChars: 28 }
    ) || `What did you first assume about ${creativeTopicLabel(args)}, and what would you update after this card?`;

  const buildCreativeMetacognitionLine = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
    reason?: string | null;
    weakAssist?: boolean;
  }) =>
    firstUsefulTeachingText([args.previewEntry?.teachingContext[1], args.previewEntry?.teachingContext[0], args.reason], {
      maxLength: 160,
      minWords: 5,
      minChars: 30,
    }) ||
    (args.weakAssist
      ? `Pause on the part where your old logic breaks, then name the better model for ${creativeTopicLabel(args)}.`
      : `Check whether you understand the pattern, the reason, or only the final answer in ${creativeTopicLabel(args)}.`);

  const buildCreativeCreationLine = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
    nextMove?: string | null;
  }) =>
    firstUsefulTeachingText([args.nextMove, args.previewEntry?.nextMove], {
      maxLength: 150,
      minWords: 4,
      minChars: 24,
    }) || `Turn ${creativeTopicLabel(args)} into a sketch, tiny story, or teach-back for a younger learner.`;

  const buildCreativeTransferLine = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
  }) =>
    firstUsefulTeachingText(args.previewEntry?.quickChecks?.slice(1) || [], {
      maxLength: 140,
      minWords: 4,
      minChars: 22,
    }) || `Find one real-life example where ${creativeTopicLabel(args)} shows up before the next card.`;

  const buildCreativeSelfCheckLine = (args: {
    topic?: string | null;
    title?: string | null;
    previewEntry?: MediaWorkspaceEntry | null;
    quickCheck?: string | null;
  }) =>
    firstUsefulTeachingText(
      [args.previewEntry?.quickChecks[0], args.previewEntry?.quickCheck, args.quickCheck],
      { maxLength: 140, minWords: 5, minChars: 24 }
    ) || `Explain ${creativeTopicLabel(args)} in one sentence to a younger student without using notes.`;

  const resolveCreativePulseLabel = (args: {
    weakAssist?: boolean;
    learningType: CreativeStreamCard['learningType'];
    sourceType: CreativeStreamCard['sourceType'];
    engineMode: CreativeStreamCard['engineMode'];
  }) => {
    if (args.weakAssist) return 'Logic rescue';
    if (args.engineMode === 'transfer') return 'Bridge forward';
    if (args.engineMode === 'story') return 'Story spark';
    if (args.engineMode === 'remix') return 'Remix lab';
    if (args.learningType === 'visual_explanation') return 'Imagination spark';
    if (args.learningType === 'worked_example') return 'Build-and-test';
    if (args.learningType === 'concept_recap') return 'Memory remix';
    if (args.sourceType === 'vimeo') return 'Discovery beam';
    return 'Perspective shift';
  };

  type StreamMoment = {
    id: string;
    label: string;
    value: string;
    priority: number;
  };

  const selectAdaptiveMoments = (moments: StreamMoment[], limit = 2) =>
    moments
      .filter((moment) => hasUsefulTeachingText(moment.value, 4, 18))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

  const buildStudyMomentCards = (args: {
    entry: MediaWorkspaceEntry;
    focusLine: string;
    checkLine: string;
    unlockLine: string;
    whyNowLine: string;
    weakAssist: boolean;
    completed: boolean;
  }) =>
    selectAdaptiveMoments(
      [
        {
          id: 'notice',
          label: 'Notice',
          value: args.focusLine,
          priority: args.entry.mediaKind === 'image' ? 98 : args.weakAssist ? 90 : 88,
        },
        {
          id: 'check',
          label: args.completed ? 'Retain' : 'Check',
          value: args.checkLine,
          priority: args.completed ? 100 : args.weakAssist ? 96 : 86,
        },
        {
          id: 'unlock',
          label: 'Unlock next',
          value: args.unlockLine,
          priority: args.completed ? 82 : args.entry.mediaKind === 'audio' ? 78 : 74,
        },
        {
          id: 'why',
          label: 'Why now',
          value: args.whyNowLine,
          priority: args.weakAssist ? 84 : 64,
        },
      ],
      2
    );

  const buildCreativeMomentCards = (args: { card: CreativeStreamCard; weakAssist: boolean }) =>
    selectAdaptiveMoments(
      [
        {
          id: 'spark',
          label: 'Spark',
          value: args.card.sparkLine,
          priority:
            args.card.engineMode === 'spark' ? 100 : args.card.engineMode === 'story' ? 92 : 78,
        },
        {
          id: 'reflect',
          label: 'Reflect',
          value: args.card.reflectionLine,
          priority:
            args.weakAssist || args.card.engineMode === 'logic' ? 102 : args.card.engineMode === 'story' ? 88 : args.card.engineMode === 'transfer' ? 90 : 80,
        },
        {
          id: 'make',
          label: args.card.engineMode === 'remix' ? 'Remix' : args.card.engineMode === 'transfer' ? 'Try next' : 'Make',
          value: args.card.creationLine,
          priority:
            args.card.engineMode === 'remix' ? 100 : args.card.engineMode === 'story' ? 84 : args.card.engineMode === 'transfer' ? 86 : 74,
        },
        {
          id: 'transfer',
          label: 'Transfer',
          value: args.card.transferLine,
          priority:
            args.card.engineMode === 'transfer'
              ? 104
              : args.weakAssist || args.card.engineMode === 'logic'
                ? 94
                : args.card.engineMode === 'spark'
                  ? 72
                  : 68,
        },
      ],
      2
    );

  const buildStudyAnchorLine = (args: {
    entry: MediaWorkspaceEntry;
    focusLine: string;
    unlockLine: string;
    whyNowLine: string;
  }) =>
    firstUsefulTeachingText(
      [args.entry.conceptPoints[0], args.entry.keyIdea, args.focusLine, args.unlockLine, args.whyNowLine],
      { maxLength: 112, minWords: 4, minChars: 20 }
    ) || `Anchor the one move that makes ${studyTopicLabel(args.entry)} easier to explain.`;

  const buildStudyCoachContext = (args: {
    entry: MediaWorkspaceEntry;
    reason?: string | null;
    nextMove?: string | null;
    quickCheck?: string | null;
    studyGuide?: MediaStreamItem['studyGuide'] | null;
    weakAssist?: boolean;
    completed?: boolean;
  }): StudyCoachContext => {
    const weakAssist =
      typeof args.weakAssist === 'boolean'
        ? args.weakAssist
        : matchesWeakTopic(args.entry.topic || args.entry.subtopic || args.entry.title, args.entry.subject);
    const completed = typeof args.completed === 'boolean' ? args.completed : args.entry.asset?.isCompleted === true;
    const quickChecks =
      args.entry.quickChecks.length > 0
        ? args.entry.quickChecks
        : [args.entry.quickCheck || args.quickCheck || 'Spot the step that changes the answer.'];
    const focusLine = buildStudyFocusLine(args.entry, args.reason, args.studyGuide?.cue || null);
    const whyNowLine = buildStudyWhyNowLine(args.entry, args.reason, weakAssist, args.studyGuide?.whyNow || null);
    const unlockLine = buildStudyUnlockLine(args.entry, args.nextMove, args.studyGuide?.nextStep || null);
    const checkLine = buildStudyCheckLine(args.entry, args.quickCheck);
    const followUpCheck = firstUsefulTeachingText(quickChecks.slice(1), {
      maxLength: 92,
      minWords: 4,
      minChars: 20,
    });
    const anchorLine = buildStudyAnchorLine({
      entry: args.entry,
      focusLine,
      unlockLine,
      whyNowLine,
    });
    return {
      entry: args.entry,
      focusLine,
      whyNowLine,
      unlockLine,
      checkLine,
      followUpCheck,
      anchorLine,
      weakAssist,
      completed,
    };
  };

  const STUDY_CHALLENGE_STOPWORDS = new Set([
    'about',
    'after',
    'again',
    'also',
    'because',
    'before',
    'being',
    'between',
    'both',
    'came',
    'does',
    'doing',
    'during',
    'each',
    'from',
    'have',
    'into',
    'just',
    'leaf',
    'main',
    'make',
    'many',
    'more',
    'most',
    'need',
    'note',
    'onto',
    'only',
    'other',
    'ours',
    'over',
    'same',
    'show',
    'side',
    'some',
    'step',
    'steps',
    'student',
    'students',
    'than',
    'that',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'this',
    'those',
    'through',
    'topic',
    'what',
    'when',
    'where',
    'which',
    'while',
    'with',
    'your',
  ]);

  const tokenizeStudyChallengeText = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/\bco2\b/g, 'carbon dioxide')
      .replace(/\bo2\b/g, 'oxygen')
      .replace(/\bh2o\b/g, 'water')
      .replace(/\bnaoh\b/g, 'sodium hydroxide')
      .replace(/\bhcl\b/g, 'hydrochloric acid')
      .replace(/[^a-z0-9\s-]+/g, ' ')
      .replace(/-/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STUDY_CHALLENGE_STOPWORDS.has(token) && !/^\d+$/.test(token));

  const normalizeChallengeLine = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const challengeLinesEquivalent = (a: unknown, b: unknown) => {
    const first = normalizeChallengeLine(a);
    const second = normalizeChallengeLine(b);
    if (!first || !second) return false;
    return first === second || first.includes(second) || second.includes(first);
  };

  const buildStudyChallengeSignals = (context: StudyCoachContext, prompt?: string | null) => {
    const excluded = new Set([
      ...tokenizeStudyChallengeText(context.entry.topic),
      ...tokenizeStudyChallengeText(context.entry.subtopic),
      ...tokenizeStudyChallengeText(context.entry.subject),
    ]);
    const counts = new Map<string, number>();
    [
      context.entry.keyIdea,
      ...context.entry.conceptPoints,
      ...context.entry.quickChecks,
      ...context.entry.teachingContext,
      context.focusLine,
      context.anchorLine,
      context.unlockLine,
      prompt,
    ].forEach((value) => {
      tokenizeStudyChallengeText(value).forEach((token) => {
        if (excluded.has(token)) return;
        counts.set(token, (counts.get(token) || 0) + 1);
      });
    });
    const rawClueCandidates = [
      ...context.entry.quickChecks,
      context.entry.quickCheck,
      ...context.entry.conceptPoints,
      context.entry.keyIdea,
      context.focusLine,
      context.anchorLine,
      context.unlockLine,
      context.followUpCheck,
    ]
      .map((line) => normalizeCompactText(line, 170))
      .filter((line): line is string => Boolean(line && hasUsefulTeachingText(line, 4, 20)));
    const promptKey = normalizeChallengeLine(prompt);
    const clueCandidates: string[] = [];
    const seen = new Set<string>();
    rawClueCandidates.forEach((line) => {
      const key = normalizeChallengeLine(line);
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (promptKey && (key === promptKey || key.includes(promptKey) || promptKey.includes(key))) return;
      clueCandidates.push(line);
    });
    const cueText = clueCandidates[0] || context.focusLine;
    return {
      tokens: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .map(([token]) => token)
        .slice(0, 12),
      cueText,
      clueCandidates,
    };
  };

  const evaluateStudyQuickChallenge = (args: {
    context: StudyCoachContext;
    draft: string;
    variant: 'challenge' | 'recall';
    prompt: string;
    attempts: number;
    previousDraft?: string | null;
  }): QuickChallengeFeedback => {
    const answer = normalizeCompactText(args.draft, 320) || '';
    const answerTokens = [...new Set(tokenizeStudyChallengeText(answer))];
    const lowerAnswer = answer.toLowerCase();
    const uncertainAnswer =
      /\b(i\s*(am|'m)\s*not\s*sure|not\s*sure|dont\s*know|don't\s*know|idk|no\s*idea)\b/.test(lowerAnswer);
    if (answerTokens.length === 0) {
      return {
        tone: 'empty',
        title: 'Start with your best guess',
        body: 'A short first attempt is enough. Once you answer, this card can coach you quickly.',
        nextStep: args.context.focusLine,
        hint: null,
        revealHint: false,
        revealAnchor: false,
        canLock: false,
      };
    }

    const signals = buildStudyChallengeSignals(args.context, args.prompt);
    const overlapCount = answerTokens.filter((token) => signals.tokens.includes(token)).length;
    const promptTokens = [...new Set(tokenizeStudyChallengeText(args.prompt))];
    const promptOverlap = answerTokens.filter((token) => promptTokens.includes(token)).length;
    const coverage = overlapCount + promptOverlap;
    const nextCue =
      signals.clueCandidates.find((line) => {
        if (!line) return false;
        if (challengeLinesEquivalent(line, args.prompt)) return false;
        const clueTokens = tokenizeStudyChallengeText(line);
        return clueTokens.some((token) => !answerTokens.includes(token));
      }) || signals.cueText;
    const repeatedAttempt =
      Boolean(args.previousDraft) && normalizeChallengeLine(args.previousDraft) === normalizeChallengeLine(args.draft);
    const shortDirectAnswer = args.variant === 'challenge' && answerTokens.length <= 7 && coverage >= 1;
    const strongRecall =
      args.variant === 'recall' ? coverage >= 2 && answerTokens.length >= 6 : false;
    const strongMatch = coverage >= 2 || shortDirectAnswer || strongRecall;

    if (uncertainAnswer) {
      return {
        tone: 'retry',
        title: args.attempts > 0 ? 'Use one concrete detail' : 'Start with one concrete guess',
        body:
          args.attempts > 0
            ? 'Give one specific element from the video, even if you are unsure.'
            : 'Try one specific answer instead of "not sure."',
        nextStep: args.context.followUpCheck || args.context.checkLine,
        hint: nextCue,
        revealHint: true,
        revealAnchor: false,
        canLock: false,
      };
    }

    if (strongMatch) {
      return {
        tone: 'strong',
        title: 'Strong answer',
        body: 'That matches the learning move this card was trying to secure. Keep the anchor and move on.',
        nextStep: args.context.followUpCheck || args.context.unlockLine,
        hint: null,
        revealHint: false,
        revealAnchor: true,
        canLock: true,
      };
    }

    if (coverage >= 1 || answerTokens.length >= 6) {
      return {
        tone: 'close',
        title: repeatedAttempt ? 'Add one missing detail' : 'Close, tighten one detail',
        body: repeatedAttempt
          ? 'You are close. Add one precise detail the video showed.'
          : 'You are circling the right idea. Tighten one part and re-check.',
        nextStep: args.context.followUpCheck || args.context.checkLine,
        hint: nextCue,
        revealHint: true,
        revealAnchor: false,
        canLock: false,
      };
    }

    return {
      tone: 'retry',
      title: 'Try once more with one clue',
      body: 'Use the clue, then answer in one short sentence.',
      nextStep: args.context.checkLine,
      hint: nextCue,
      revealHint: true,
      revealAnchor: false,
      canLock: false,
    };
  };

  const buildStudyTeachBackModelAnswer = (context: StudyCoachContext) =>
    `${context.anchorLine} Then ${context.unlockLine.charAt(0).toLowerCase()}${context.unlockLine.slice(1)}`;

  const evaluateStudyTeachBack = (args: {
    context: StudyCoachContext;
    draft: string;
  }): TeachBackFeedback => {
    const answer = normalizeCompactText(args.draft, 360) || '';
    const answerTokens = [...new Set(tokenizeStudyChallengeText(answer))];
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    const explanationSignals = ['because', 'so', 'means', 'then', 'first', 'next', 'therefore', 'which', 'helps'];
    const hasExplanationShape =
      explanationSignals.some((token) => answer.toLowerCase().includes(token)) || wordCount >= 14;

    if (answerTokens.length === 0) {
      return {
        tone: 'empty',
        title: 'Try teaching it once first',
        body: 'A rough first explanation is enough. Once you try, this card can tighten the logic with you.',
        nextStep: args.context.anchorLine,
        revealModelAnswer: false,
        canLock: false,
      };
    }

    const signals = buildStudyChallengeSignals(args.context);
    const overlapCount = answerTokens.filter((token) => signals.tokens.includes(token)).length;

    if (overlapCount >= 2 && wordCount >= 10 && hasExplanationShape) {
      return {
        tone: 'strong',
        title: 'That teaches the idea well',
        body: 'You explained the important move in your own words, which means the idea is becoming yours.',
        nextStep: args.context.followUpCheck || args.context.unlockLine,
        revealModelAnswer: false,
        canLock: true,
      };
    }

    if (overlapCount >= 1 && wordCount >= 7) {
      return {
        tone: 'close',
        title: 'Good direction, sharpen the key move',
        body: `Your explanation is pointing the right way. Make this part clearer: ${signals.cueText}`,
        nextStep: args.context.checkLine,
        revealModelAnswer: false,
        canLock: false,
      };
    }

    return {
      tone: 'retry',
      title: 'Use the anchor, then add the why',
      body: args.context.focusLine,
      nextStep: buildStudyTeachBackModelAnswer(args.context),
      revealModelAnswer: true,
      canLock: false,
    };
  };

  const buildCreativeAnchorLine = (card: CreativeStreamCard) =>
    firstUsefulTeachingText([card.storyHook, card.sparkLine, card.metacognitionLine, card.transferLine], {
      maxLength: 112,
      minWords: 4,
      minChars: 20,
    }) || `Hold onto the angle that makes ${creativeTopicLabel(card)} feel easier to imagine.`;

  const roleChipLabel = (role: CreativeStreamCard['creativeRole']) => {
    if (role === 'notice') return 'Notice';
    if (role === 'reframe') return 'Reframe';
    if (role === 'transfer') return 'Transfer';
    if (role === 'deepen') return 'Deepen';
    return 'Spark';
  };

  const roleSupportLine = (card: CreativeStreamCard) => {
    if (card.creativeRole === 'reframe') return `A visual way to rethink ${creativeTopicLabel(card)}.`;
    if (card.creativeRole === 'notice') return `A pattern-first cue to understand ${creativeTopicLabel(card)}.`;
    if (card.creativeRole === 'transfer') return `Apply ${creativeTopicLabel(card)} in a new case.`;
    if (card.creativeRole === 'deepen') return `A deeper follow-up explanation for ${creativeTopicLabel(card)}.`;
    return `A curiosity-first lens for ${creativeTopicLabel(card)}.`;
  };

  const roleOverlay = (card: CreativeStreamCard) => {
    if (card.creativeRole === 'reframe') {
      return { overline: 'TRY THIS ANGLE', text: 'Instead of asking what disappears, ask what gets rearranged.' };
    }
    if (card.creativeRole === 'notice') {
      return { overline: 'WHAT TO NOTICE', text: card.sparkLine };
    }
    if (card.creativeRole === 'transfer') {
      return { overline: 'TRY A NEW CASE', text: card.transferLine };
    }
    if (card.creativeRole === 'deepen') {
      return { overline: 'GO DEEPER', text: card.metacognitionLine };
    }
    return { overline: 'SPARK', text: card.sparkLine };
  };

  const rolePrimaryActionLabel = (card: CreativeStreamCard) => {
    if (card.creativeRole === 'reframe') return 'What changed?';
    if (card.creativeRole === 'transfer') return 'Try a new case';
    if (card.creativeRole === 'deepen') return 'Longer version';
    if (card.creativeRole === 'notice') return 'Quick check';
    return 'Try this angle';
  };

  type CreativeDeckCandidate = CreativeStreamCard & {
    __score: number;
    __generated: boolean;
    __continuityKey: string;
    __freshnessBoost: number;
  };

  type CreativeGeneratedDeckCacheEntry = {
    ts: number;
    cards: CreativeDeckCandidate[];
  };

  const hasCreativeCue = (value: string, phrases: string[]) => phrases.some((phrase) => value.includes(phrase));

  const resolveCreativeEngineMode = (args: {
    topic?: string | null;
    title?: string | null;
    learningType: CreativeStreamCard['learningType'];
    weakAssist: boolean;
    helpful?: boolean;
    revisionLinked?: boolean;
    transcriptSignal?: boolean;
    mediaType: FullscreenMediaFilter;
    previewEntry?: MediaWorkspaceEntry | null;
    reason?: string | null;
    nextMove?: string | null;
    quickCheck?: string | null;
  }): CreativeStreamCard['engineMode'] => {
    const cueText = normalizeMediaLabel(
      [
        args.topic,
        args.title,
        args.reason,
        args.nextMove,
        args.quickCheck,
        args.previewEntry?.summary,
        args.previewEntry?.keyIdea,
        ...(args.previewEntry?.teachingContext || []),
        ...(args.previewEntry?.quickChecks || []),
      ]
        .filter(Boolean)
        .join(' ')
    );
    const storyCue = hasCreativeCue(cueText, ['story', 'narrative', 'character', 'comic', 'scene', 'myth', 'fable', 'plot']);
    const transferCue = hasCreativeCue(cueText, [
      'transfer',
      'apply',
      'real life',
      'real-life',
      'new case',
      'another example',
      'same pattern',
      'different example',
      'where else',
      'use this in',
    ]);
    const remixCue = hasCreativeCue(cueText, ['remix', 'analogy', 'sketch', 'draw', 'invent', 'experiment', 'teach back', 'rebuild']);
    if (args.weakAssist || (args.learningType === 'worked_example' && (args.revisionLinked || args.transcriptSignal))) {
      return 'logic';
    }
    if (storyCue && args.mediaType !== 'audio') {
      return 'story';
    }
    if (transferCue && args.mediaType !== 'image') {
      return 'transfer';
    }
    if (args.mediaType === 'image' || args.learningType === 'visual_explanation') {
      return 'spark';
    }
    if (remixCue || args.learningType === 'concept_recap') {
      return args.helpful ? 'transfer' : 'remix';
    }
    if (args.learningType === 'worked_example') {
      return 'logic';
    }
    return args.helpful ? 'transfer' : 'story';
  };

  const resolveCreativeModeSignature = (card: CreativeStreamCard, weakAssist: boolean) => {
    if (card.engineMode === 'logic' || weakAssist) {
      return {
        heroLabel: 'Logic lab',
        primaryLabel: weakAssist ? 'Open repair lab' : 'Open logic lab',
        secondaryLabel: weakAssist ? 'Repair the logic' : 'Reflect on logic',
        secondaryAction: 'reflect' as const,
        secondaryLiveLabel: 'Reflection live',
        footerLabel: 'Self-check',
        footerValue: card.selfCheckLine,
      };
    }
    if (card.engineMode === 'story') {
      return {
        heroLabel: 'Story lab',
        primaryLabel: 'Open story lab',
        secondaryLabel: 'Retell the idea',
        secondaryAction: 'story' as const,
        secondaryLiveLabel: 'Story live',
        footerLabel: 'Retell next',
        footerValue: card.creationLine,
      };
    }
    if (card.engineMode === 'transfer') {
      return {
        heroLabel: 'Transfer lab',
        primaryLabel: 'Open transfer lab',
        secondaryLabel: 'Try a new case',
        secondaryAction: 'transfer' as const,
        secondaryLiveLabel: 'Transfer live',
        footerLabel: 'Try next',
        footerValue: card.transferLine,
      };
    }
    if (card.engineMode === 'remix') {
      return {
        heroLabel: 'Remix lab',
        primaryLabel: 'Open remix lab',
        secondaryLabel: 'Run a remix',
        secondaryAction: 'remix' as const,
        secondaryLiveLabel: 'Remix ready',
        footerLabel: 'Next leap',
        footerValue: card.transferLine,
      };
    }
    return {
      heroLabel: 'Curiosity lab',
      primaryLabel: 'Open curiosity lab',
      secondaryLabel: 'Sketch the idea',
      secondaryAction: 'remix' as const,
      secondaryLiveLabel: 'Remix ready',
      footerLabel: 'Next leap',
      footerValue: card.transferLine,
    };
  };

  const resolveCreativePrimaryVariant = (card: CreativeStreamCard, weakAssist: boolean): CreativeLabVariant => {
    if (card.engineMode === 'logic' || weakAssist) return 'reflect';
    if (card.engineMode === 'story') return 'story';
    if (card.engineMode === 'transfer') return 'transfer';
    if (card.engineMode === 'remix') return 'remix';
    return 'spark';
  };

  const resolveCreativeVariantFromAction = (
    card: CreativeStreamCard,
    actionId: CreativeContractActionId,
    weakAssist: boolean
  ): CreativeLabVariant => {
    if (actionId === 'quick_check') return 'reflect';
    if (actionId === 'explain_simply') return 'story';
    if (actionId === 'similar_topic' || actionId === 'try_new_angle') return 'transfer';
    if (actionId === 'what_changed') return 'remix';
    if (actionId === 'open_longer_lesson') {
      return card.engineMode === 'logic' || weakAssist ? 'reflect' : 'story';
    }
    if (actionId === 'more_like_this') {
      return card.engineMode === 'story' ? 'story' : card.engineMode === 'transfer' ? 'transfer' : 'spark';
    }
    return resolveCreativePrimaryVariant(card, weakAssist);
  };

  const resolveCreativeVariantFromLabel = (label: string): CreativeLabVariant => {
    const normalized = normalizeMediaLabel(label);
    if (normalized.includes('reflect') || normalized.includes('logic') || normalized.includes('check')) return 'reflect';
    if (normalized.includes('story') || normalized.includes('retell')) return 'story';
    if (normalized.includes('transfer') || normalized.includes('apply') || normalized.includes('case')) return 'transfer';
    if (normalized.includes('remix') || normalized.includes('create') || normalized.includes('invent')) return 'remix';
    return 'spark';
  };

  const buildCreativeLabSignalTokens = (card: CreativeStreamCard) => {
    const topicExcluded = new Set([
      ...tokenizeStudyChallengeText(card.topic),
      ...tokenizeStudyChallengeText(card.subject),
      ...tokenizeStudyChallengeText(card.title),
    ]);
    const counts = new Map<string, number>();
    [
      card.sparkLine,
      card.reflectionLine,
      card.metacognitionLine,
      card.creationLine,
      card.transferLine,
      card.selfCheckLine,
      card.storyHook,
      card.oneThingToNotice,
      card.reason,
      card.nextMove,
    ].forEach((value) => {
      tokenizeStudyChallengeText(value).forEach((token) => {
        if (topicExcluded.has(token)) return;
        counts.set(token, (counts.get(token) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .map(([token]) => token)
      .slice(0, 14);
  };

  const buildCreativeLabBlueprint = (card: CreativeStreamCard, variant: CreativeLabVariant) => {
    const topicLabel = creativeTopicLabel(card);
    const anchorLine = buildCreativeAnchorLine(card);
    if (variant === 'reflect') {
      return {
        prompt: card.reflectionLine,
        hint: card.metacognitionLine,
        nextMove: `Then try: ${card.selfCheckLine}`,
        selfCheckLine: card.selfCheckLine,
        topicLabel,
        anchorLine,
      };
    }
    if (variant === 'story') {
      return {
        prompt: `Retell ${topicLabel} with one image and one sentence of logic.`,
        hint: card.storyHook,
        nextMove: `Then apply it: ${card.transferLine}`,
        selfCheckLine: card.selfCheckLine,
        topicLabel,
        anchorLine,
      };
    }
    if (variant === 'transfer') {
      return {
        prompt: card.transferLine,
        hint: card.sparkLine,
        nextMove: `Close with: ${card.selfCheckLine}`,
        selfCheckLine: card.selfCheckLine,
        topicLabel,
        anchorLine,
      };
    }
    if (variant === 'remix') {
      return {
        prompt: card.creationLine,
        hint: card.oneThingToNotice || card.sparkLine,
        nextMove: `Pressure-test it: ${card.transferLine}`,
        selfCheckLine: card.selfCheckLine,
        topicLabel,
        anchorLine,
      };
    }
    return {
      prompt: card.sparkLine,
      hint: card.metacognitionLine,
      nextMove: `Reflect next: ${card.reflectionLine}`,
      selfCheckLine: card.selfCheckLine,
      topicLabel,
      anchorLine,
    };
  };

  const evaluateCreativeLabResponse = (args: {
    draft: string;
    variant: CreativeLabVariant;
    prompt: string;
    hint: string;
    anchorLine: string;
    nextMove: string;
    selfCheckLine: string;
    signalTokens: string[];
  }): CreativeLabFeedback => {
    const answer = normalizeCompactText(args.draft, 420) || '';
    const answerTokens = [...new Set(tokenizeStudyChallengeText(answer))];
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    if (answerTokens.length === 0) {
      return {
        tone: 'empty',
        title: 'Start with one brave attempt',
        body: 'Write one quick thought first. The engine will tighten it with you immediately.',
        nextStep: args.hint,
        revealHint: false,
        revealAnchor: false,
        canLock: false,
      };
    }
    const overlapCount = answerTokens.filter((token) => args.signalTokens.includes(token)).length;
    const reasoningCueCount = ['because', 'so', 'means', 'if', 'then', 'therefore', 'instead', 'before', 'after'].filter((cue) =>
      answer.toLowerCase().includes(cue)
    ).length;
    const strongByVariant =
      args.variant === 'reflect'
        ? overlapCount >= 2 && wordCount >= 11
        : args.variant === 'story'
          ? overlapCount >= 1 && wordCount >= 12 && reasoningCueCount >= 1
          : args.variant === 'transfer'
            ? overlapCount >= 2 && wordCount >= 10
            : args.variant === 'remix'
              ? overlapCount >= 1 && wordCount >= 10 && reasoningCueCount >= 1
              : overlapCount >= 1 && wordCount >= 8;
    if (strongByVariant) {
      return {
        tone: 'strong',
        title: 'Insight is alive',
        body: 'That response shows real thinking, not just recall. Keep this anchor and carry it to the next angle.',
        nextStep: args.nextMove,
        revealHint: false,
        revealAnchor: true,
        canLock: true,
      };
    }
    if (overlapCount >= 1 || wordCount >= 8) {
      return {
        tone: 'close',
        title: 'Strong direction, sharpen one move',
        body: `You are close. Tighten this exact part: ${args.hint}`,
        nextStep: args.selfCheckLine,
        revealHint: true,
        revealAnchor: false,
        canLock: false,
      };
    }
    return {
      tone: 'retry',
      title: 'Try once more with one cue',
      body: args.prompt,
      nextStep: args.anchorLine,
      revealHint: true,
      revealAnchor: false,
      canLock: false,
    };
  };

  const curateCreativeDeck = (candidates: CreativeDeckCandidate[], limit: number) => {
    const exactSeen = new Set<string>();
    const generatedTopicModeSeen = new Set<string>();
    const pool = candidates
      .sort((a, b) => b.__score - a.__score)
      .filter((candidate) => {
        const stableKey = [
          candidate.__continuityKey,
          candidate.sourceType,
          candidate.engineMode,
          candidate.previewEntry?.id || candidate.sourceUrl || normalizeMediaLabel(candidate.title),
        ].join(':');
        if (exactSeen.has(stableKey)) return false;
        exactSeen.add(stableKey);
        if (!candidate.__generated) return true;
        const generatedKey = `${candidate.__continuityKey}:${candidate.engineMode}`;
        if (generatedTopicModeSeen.has(generatedKey)) return false;
        generatedTopicModeSeen.add(generatedKey);
        return true;
      });
    const deck: CreativeDeckCandidate[] = [];
    const sourceUsage = new Map<string, number>();
    const modeUsage = new Map<string, number>();
    const topicUsage = new Map<string, number>();

    while (deck.length < limit && pool.length > 0) {
      const last = deck[deck.length - 1] || null;
      const secondLast = deck[deck.length - 2] || null;
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;

      for (let index = 0; index < pool.length; index += 1) {
        const candidate = pool[index];
        const sourceCount = sourceUsage.get(candidate.sourceType) || 0;
        const modeCount = modeUsage.get(candidate.engineMode) || 0;
        const topicCount = topicUsage.get(candidate.__continuityKey) || 0;
        let adjusted = candidate.__score + candidate.__freshnessBoost;

        adjusted -= topicCount * 28;
        adjusted -= sourceCount * 8;
        adjusted -= modeCount * 9;

        if (deck.length === 0) {
          if (candidate.engineMode === 'story' || candidate.engineMode === 'spark') adjusted += 14;
          if (candidate.engineMode === 'logic') adjusted += 6;
          if (candidate.engineMode === 'transfer') adjusted -= 12;
        } else if (deck.length === 1) {
          if (candidate.engineMode === 'logic') adjusted += 14;
          if (candidate.engineMode === 'spark') adjusted += 6;
          if (candidate.engineMode === 'transfer') adjusted -= 4;
        } else if (deck.length === 2) {
          if (candidate.engineMode === 'transfer') adjusted += 12;
          if (candidate.engineMode === 'remix') adjusted += 8;
        } else if (deck.length >= 3) {
          if (candidate.engineMode === 'remix') adjusted += 6;
          if (candidate.engineMode === 'transfer') adjusted += 5;
        }

        if (deck.length === 0) {
          adjusted += candidate.previewEntry ? 12 : -8;
          if (candidate.engineMode === 'spark' || candidate.engineMode === 'story') adjusted += 6;
        }
        if (deck.length < 5 && modeCount === 0) adjusted += 10;
        if (deck.length < 4 && sourceCount === 0) adjusted += candidate.sourceType === 'youtube' ? 8 : 10;
        if (candidate.engineMode === 'transfer' && deck.length >= 2) adjusted += 6;
        if (!candidate.__generated && deck.length > 2 && sourceCount === 0) adjusted += 6;
        if (candidate.__generated && deck.length < 2) adjusted -= 10;

        if (last) {
          if (last.__continuityKey === candidate.__continuityKey) adjusted -= 38;
          if (last.sourceType === candidate.sourceType) adjusted -= 12;
          if (last.engineMode === candidate.engineMode) adjusted -= 14;
          if (Boolean(last.previewEntry) !== Boolean(candidate.previewEntry)) adjusted += 4;
          else if (!candidate.previewEntry) adjusted -= 2;
        }
        if (secondLast) {
          if (secondLast.__continuityKey === candidate.__continuityKey) adjusted -= 16;
          if (secondLast.sourceType === candidate.sourceType) adjusted -= 6;
          if (secondLast.engineMode === candidate.engineMode) adjusted -= 6;
        }

        if (adjusted > bestScore) {
          bestScore = adjusted;
          bestIndex = index;
        }
      }

      const [chosen] = pool.splice(bestIndex, 1);
      deck.push(chosen);
      sourceUsage.set(chosen.sourceType, (sourceUsage.get(chosen.sourceType) || 0) + 1);
      modeUsage.set(chosen.engineMode, (modeUsage.get(chosen.engineMode) || 0) + 1);
      topicUsage.set(chosen.__continuityKey, (topicUsage.get(chosen.__continuityKey) || 0) + 1);
    }

    return deck.map(({ __score, __generated, __continuityKey, __freshnessBoost, ...card }) => card as CreativeStreamCard);
  };

  const resolveMediaKindFromRevision = (item: RevisionItem): FullscreenMediaFilter => {
    const mediaType = String(item.mediaType || '').toLowerCase();
    const contentType = String(item.contentType || '').toLowerCase();
    if (mediaType === 'audio' || contentType === 'audio') return 'audio';
    if (mediaType === 'video' || contentType === 'video') return 'video';
    if (mediaType === 'image' || contentType === 'image') return 'image';
    return 'document';
  };

  const resolveMediaKindFromAsset = (asset: MediaAsset): FullscreenMediaFilter => {
    if (asset.assetKind === 'audio_recap') return 'audio';
    if (asset.assetKind === 'video_recap') return 'video';
    if (
      asset.assetKind === 'generated_image' ||
      asset.assetKind === 'annotated_image' ||
      asset.assetKind === 'visual_explainer' ||
      asset.assetKind === 'worksheet_explainer'
    ) {
      return 'image';
    }
    return 'document';
  };

  const revisionItems = useMemo(() => uniqueRevisionItems(revisionOverview), [revisionOverview]);
  const revisionItemsById = useMemo(() => {
    const next = new Map<string, RevisionItem>();
    for (const item of revisionItems) {
      next.set(item.id, item);
    }
    return next;
  }, [revisionItems]);

  const mapAssetToEntry = (asset: MediaAsset): MediaWorkspaceEntry => {
    const linkedRevision = asset.revisionItemId ? revisionItemsById.get(asset.revisionItemId) || null : null;
    const hasAudioAsset = asset.assetKind === 'audio_recap';
    const hasImageAsset = ['generated_image', 'annotated_image', 'visual_explainer', 'worksheet_explainer'].includes(
      asset.assetKind
    );
    const metadata = (asset.metadata || {}) as Record<string, unknown>;
    const providerHint = normalizeMediaLabel(
      asset.videoProvider ||
        String(metadata.externalProvider || '') ||
        String(metadata.externalSourceType || '') ||
        asset.sourceUrl
    );
    const videoProvider =
      providerHint.includes('vimeo') ? 'vimeo' : providerHint.includes('youtube') || providerHint.includes('youtu.be') ? 'youtube' : 'unknown';
    const videoId =
      videoProvider === 'vimeo'
        ? extractVimeoId(asset.videoId || asset.sourceUrl || null)
        : extractYouTubeId(asset.videoId || asset.sourceUrl || null);
    const audioUrl = hasAudioAsset ? asset.assetUrl || asset.dataUrl || null : null;
    const imageUrl = hasImageAsset ? asset.imageUrl || asset.assetUrl || asset.dataUrl || null : null;
    const quickChecks = normalizeCompactList(asset.quickChecks, 3, 100);
    const conceptPoints = normalizeCompactList(asset.keyPoints, 4, 100);
    const teachingContext = buildMediaTeachingContext(asset);
    return {
      id: asset.id,
      source: 'asset',
      mediaKind: resolveMediaKindFromAsset(asset),
      title: asset.title || 'Untitled media asset',
      summary: asset.summary || asset.recapText || null,
      keyIdea: asset.keyIdea || asset.keyPoints?.[0] || null,
      quickCheck: quickChecks[0] || null,
      quickChecks,
      conceptPoints,
      teachingContext,
      bestUse: asset.bestUse || null,
      nextMove: asset.nextMove || null,
      subject: asset.subject || linkedRevision?.subject || null,
      topic: asset.topic || linkedRevision?.topic || null,
      subtopic: asset.subtopic || linkedRevision?.subtopic || null,
      sessionId: asset.sessionId || linkedRevision?.sessionId || null,
      revisionItemId: asset.revisionItemId || linkedRevision?.id || null,
      createdAt: asset.updatedAt || asset.createdAt || null,
      collectionTitle: linkedRevision?.collectionTitle || null,
      sourceUrl: asset.sourceUrl || null,
      videoId,
      videoProvider,
      audioUrl,
      imageUrl,
      thumbnailUrl: asset.thumbnailUrl || null,
      durationSec: typeof asset.durationSec === 'number' ? asset.durationSec : null,
      revisionItem: linkedRevision,
      asset,
    };
  };

  const assetEntries = useMemo<MediaWorkspaceEntry[]>(
    () => mediaAssets.map((asset) => mapAssetToEntry(asset)),
    [mediaAssets, revisionItemsById]
  );

  const revisionFallbackEntries = useMemo<MediaWorkspaceEntry[]>(
    () =>
      revisionItems
        .filter((item) => ['audio', 'video', 'image'].includes(resolveMediaKindFromRevision(item)))
        .map((item) => ({
          id: item.id,
          source: 'revision',
          mediaKind: resolveMediaKindFromRevision(item),
          title: item.title,
          summary: item.summary || item.content || null,
          keyIdea: item.summary || null,
          quickCheck: null,
          quickChecks: [],
          conceptPoints: [],
          teachingContext: [],
          bestUse: null,
          nextMove: null,
          subject: item.subject || null,
          topic: item.topic || null,
          subtopic: item.subtopic || null,
          sessionId: item.sessionId || null,
          revisionItemId: item.id,
          createdAt: item.updatedAt || item.createdAt || null,
          collectionTitle: item.collectionTitle || null,
          sourceUrl: item.sourceUrl || null,
          videoId: extractYouTubeId(item.videoId || item.sourceUrl || null) || extractVimeoId(item.videoId || item.sourceUrl || null),
          videoProvider: normalizeMediaLabel(item.sourceUrl).includes('vimeo') ? 'vimeo' : 'youtube',
          audioUrl: item.audioUrl || null,
          imageUrl: item.imageUrl || null,
          thumbnailUrl: null,
          durationSec: null,
          revisionItem: item,
          asset: null,
        })),
    [revisionItems]
  );

  const shouldUseRevisionFallback =
    assetEntries.length === 0 && (Boolean(mediaAssetsError) || !isMediaAssetsLoading);
  const demoAssetEntries = useMemo<MediaWorkspaceEntry[]>(
    () =>
      DEMO_MEDIA_ASSETS.map((asset) => ({
        ...mapAssetToEntry(asset),
        isDemo: true,
      })),
    [revisionItemsById]
  );
  const baseEntries = shouldUseRevisionFallback ? revisionFallbackEntries : assetEntries;
  const shouldInjectDemoAssets =
    MEDIA_DEMO_ENABLED &&
    (shouldUseRevisionFallback || baseEntries.length < 5);
  const mediaEntries = useMemo(() => {
    if (!shouldInjectDemoAssets) return baseEntries;
    const seen = new Set<string>();
    const merged: MediaWorkspaceEntry[] = [];
    for (const entry of [...demoAssetEntries, ...baseEntries]) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      merged.push(entry);
    }
    return merged;
  }, [baseEntries, demoAssetEntries, shouldInjectDemoAssets]);
  const mediaEntryById = useMemo(() => {
    const next = new Map<string, MediaWorkspaceEntry>();
    for (const entry of mediaEntries) next.set(entry.id, entry);
    return next;
  }, [mediaEntries]);

  const counts = useMemo(() => {
    const next = { audio: 0, video: 0, image: 0, doc: 0 };
    for (const item of mediaEntries) {
      const mediaKind = item.mediaKind;
      if (mediaKind === 'audio') next.audio += 1;
      else if (mediaKind === 'video') next.video += 1;
      else if (mediaKind === 'image') next.image += 1;
      else next.doc += 1;
    }
    return next;
  }, [mediaEntries]);

  const filteredMediaItems = useMemo(() => {
    if (mediaFilter === 'all') return mediaEntries;
    return mediaEntries.filter((item) => item.mediaKind === mediaFilter);
  }, [mediaFilter, mediaEntries]);

  const streamEntries = useMemo(
    () =>
      (mediaStream || [])
        .map((item) => {
          const entry = mediaEntryById.get(item.asset.id) || mapAssetToEntry(item.asset);
          return { ...item, entry };
        })
        .filter((item) => (mediaFilter === 'all' ? true : item.entry.mediaKind === mediaFilter)),
    [mediaEntryById, mediaFilter, mediaStream, revisionItemsById]
  );

  const fallbackStreamEntries = useMemo(
    () =>
      filteredMediaItems.slice(0, 30).map((entry, index) => ({
        asset: entry.asset || ({
          id: entry.id,
          userId: '',
          assetKind: entry.mediaKind === 'audio' ? 'audio_recap' : entry.mediaKind === 'video' ? 'video_recap' : entry.mediaKind === 'image' ? 'generated_image' : 'generated_document',
          title: entry.title,
          summary: entry.summary,
          subject: entry.subject,
          topic: entry.topic,
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: entry.createdAt || new Date().toISOString(),
        } as MediaAsset),
        rankScore: Math.max(1, 100 - index * 3),
        reason: entry.bestUse || (entry.topic ? `Matches ${entry.topic}.` : 'Useful recap from your recent study.'),
        nextMove:
          entry.nextMove ||
          (entry.revisionItem
            ? 'Open this recap in Revision and run a quick self-check.'
            : 'Review this recap, then continue the source session.'),
        quickCheck: entry.quickCheck || (entry.topic ? `What is one key idea from ${entry.topic}?` : 'What is the key idea to remember?'),
        entry,
      })),
    [filteredMediaItems]
  );

  const isCreativeExternalEntry = (entry: MediaWorkspaceEntry) =>
    entry.mediaKind === 'video' &&
    Boolean(entry.sourceUrl) &&
    (entry.videoProvider === 'youtube' ||
      entry.videoProvider === 'vimeo' ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(String(entry.sourceUrl || '')));

  const activeStreamEntries = useMemo(() => {
    if (mediaMode === 'creative_stream') {
      return streamEntries.filter((item) => isCreativeExternalEntry(item.entry));
    }
    if (streamEntries.length >= 3) return streamEntries;
    const merged = [...streamEntries];
    const seen = new Set<string>(merged.map((item) => item.entry.id));
    for (const item of fallbackStreamEntries) {
      if (seen.has(item.entry.id)) continue;
      seen.add(item.entry.id);
      merged.push(item);
    }
    return merged;
  }, [fallbackStreamEntries, mediaMode, streamEntries]);

  const collectionEntries = useMemo<MediaWorkspaceCollectionEntry[]>(() => {
    if (mediaCollections.length > 0) {
      return mediaCollections
        .map((collection) => {
          const items = (collection.items || []).map((asset) => mediaEntryById.get(asset.id) || mapAssetToEntry(asset));
          return {
            id: collection.id,
            title: collection.title,
            description: collection.description || null,
            subject: collection.subject || null,
            topic: collection.topic || null,
            itemCount: collection.itemCount || items.length,
            items,
            nextAssetId: collection.nextAssetId || null,
            progressLabel: collection.progressLabel || null,
          };
        });
    }

    const groups = new Map<string, MediaWorkspaceCollectionEntry>();
    for (const entry of mediaEntries) {
      const key = (entry.topic || entry.subject || 'general').toLowerCase();
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          id: key,
          title: entry.topic ? `${entry.topic} set` : entry.subject ? `${entry.subject} media` : 'General media',
          description: entry.summary || null,
          subject: entry.subject,
          topic: entry.topic,
          itemCount: 1,
          items: [entry],
          nextAssetId: entry.id,
          progressLabel: null,
        });
      } else {
        existing.items.push(entry);
        existing.itemCount = existing.items.length;
      }
    }
    return [...groups.values()];
  }, [mediaCollections, mediaEntries, mediaEntryById, revisionItemsById]);

  const effectiveSelectedMediaItem =
    filteredMediaItems.find(
      (item) => item.id === selectedMediaItemId || (item.revisionItemId && item.revisionItemId === selectedMediaItemId)
    ) ||
    filteredMediaItems[0] ||
    null;

  const previewEntry = (entry: MediaWorkspaceEntry) => {
    onSelectMediaItem(entry.id);
  };

  const openStudyQuickChallengeSurface = (
    context: StudyCoachContext,
    variant: 'challenge' | 'recall' = 'challenge',
    options?: {
      promptOverride?: string | null;
      orbitEventType?: 'open_quick_challenge' | 'open_similar_question' | 'replay_card';
    }
  ) => {
    if (context.entry.asset?.id && onRecordMediaInteraction) {
      void onRecordMediaInteraction(
        context.entry.asset.id,
        variant === 'recall' ? 'quiz_me' : 'quick_check',
        context.entry.revisionItemId
      );
    }
    onSelectMediaItem(context.entry.id);
    const prompt =
      normalizeCompactText(
        options?.promptOverride ||
          (variant === 'recall'
            ? `Without replaying the card, explain ${studyTopicLabel(context.entry)} in your own words.`
            : context.checkLine),
        220
      ) ||
      context.checkLine;
    setMediaInlineAction({
      kind: 'quick_challenge',
      variant,
      context,
      prompt,
      attempts: 0,
      lastCheckedDraft: '',
      revealHint: false,
      revealAnchor: false,
      draft: '',
      feedback: null,
      lockedIn: false,
    });
    const openEventType = options?.orbitEventType || (variant === 'recall' ? 'replay_card' : 'open_quick_challenge');
    if (openEventType === 'replay_card') {
      recordStudyOrbitEvent(context.entry.id, { type: 'replay_card' });
      recordStudyOrbitEvent(context.entry.id, { type: 'open_quick_challenge' });
      return;
    }
    recordStudyOrbitEvent(context.entry.id, { type: openEventType });
  };

  const evaluateActiveQuickChallenge = () => {
    if (!mediaInlineAction || mediaInlineAction.kind !== 'quick_challenge') return;
    const current = mediaInlineAction;
    const feedback = evaluateStudyQuickChallenge({
      context: current.context,
      draft: current.draft,
      variant: current.variant,
      prompt: current.prompt,
      attempts: current.attempts,
      previousDraft: current.lastCheckedDraft,
    });
    setMediaInlineAction({
      ...current,
      attempts: current.attempts + 1,
      lastCheckedDraft: current.draft,
      feedback,
      revealHint: current.revealHint || feedback.revealHint,
      revealAnchor: current.revealAnchor || feedback.revealAnchor,
      lockedIn: feedback.canLock ? current.lockedIn : false,
    });
    recordStudyOrbitEvent(current.context.entry.id, {
      type: 'check_quick_challenge',
      tone: feedback.tone,
      draft: current.draft,
    });
  };

  const keepActiveQuickChallengeAnchor = () => {
    if (!mediaInlineAction || mediaInlineAction.kind !== 'quick_challenge') return;
    setMediaInlineAction({
      ...mediaInlineAction,
      revealAnchor: true,
      lockedIn: true,
    });
    if (!mediaInlineAction.lockedIn) {
      recordStudyOrbitEvent(mediaInlineAction.context.entry.id, { type: 'keep_anchor' });
    }
  };

  const openStudyTeachBackSurface = (context: StudyCoachContext) => {
    if (context.entry.asset?.id && onRecordMediaInteraction) {
      void onRecordMediaInteraction(context.entry.asset.id, 'explain_simply', context.entry.revisionItemId);
    }
    onSelectMediaItem(context.entry.id);
    setMediaInlineAction({
      kind: 'teach_back',
      context,
      attempts: 0,
      revealModelAnswer: false,
      draft: '',
      feedback: null,
      lockedIn: false,
    });
    recordStudyOrbitEvent(context.entry.id, { type: 'open_teach_back' });
  };

  const evaluateActiveTeachBack = () => {
    if (!mediaInlineAction || mediaInlineAction.kind !== 'teach_back') return;
    const current = mediaInlineAction;
    const feedback = evaluateStudyTeachBack({
      context: current.context,
      draft: current.draft,
    });
    setMediaInlineAction({
      ...current,
      attempts: current.attempts + 1,
      feedback,
      revealModelAnswer: current.revealModelAnswer || feedback.revealModelAnswer,
      lockedIn: feedback.canLock ? current.lockedIn : false,
    });
    recordStudyOrbitEvent(current.context.entry.id, {
      type: 'check_teach_back',
      tone: feedback.tone,
      draft: current.draft,
    });
  };

  const keepActiveTeachBack = () => {
    if (!mediaInlineAction || mediaInlineAction.kind !== 'teach_back') return;
    setMediaInlineAction({
      ...mediaInlineAction,
      lockedIn: true,
    });
    if (!mediaInlineAction.lockedIn) {
      recordStudyOrbitEvent(mediaInlineAction.context.entry.id, { type: 'keep_explanation' });
    }
  };

  const openStudyLinkedNoteSurface = (context: StudyCoachContext, options?: { pin?: boolean }) => {
    const item = context.entry.revisionItem;
    if (!item) {
      activateMediaSource(context.entry, options);
      openStudyQuickChallengeSurface(context, context.completed ? 'recall' : 'challenge', {
        promptOverride: context.followUpCheck || context.checkLine,
      });
      setMediaInlineAction((current) =>
        current && current.kind === 'quick_challenge'
          ? {
              ...current,
              revealAnchor: true,
            }
          : current
      );
      return;
    }
    activateMediaSource(context.entry, options);
    setMediaInlineAction({
      kind: 'linked_note',
      context,
      noteTitle: normalizeCompactText(item.title, 96) || context.entry.title,
      noteSummary:
        firstUsefulTeachingText([item.summary, item.studentNote, item.selectedText, getRevisionItemPreview(item)], {
          maxLength: 170,
          minWords: 4,
          minChars: 24,
        }) || `Keep this note open while you work through ${studyTopicLabel(context.entry)}.`,
      noteExcerpt: firstUsefulTeachingText([item.selectedText, item.content], {
        maxLength: 260,
        minWords: 6,
        minChars: 36,
      }),
      studentNote: firstUsefulTeachingText([item.studentNote], {
        maxLength: 160,
        minWords: 4,
        minChars: 20,
      }),
      revealExcerpt: false,
    });
    recordStudyOrbitEvent(context.entry.id, { type: 'open_linked_note' });
  };

  const lockStudyIntoRevision = (context: StudyCoachContext) => {
    const entry = context.entry;
    if (entry.asset?.id && onRecordMediaInteraction) {
      void onRecordMediaInteraction(entry.asset.id, 'save_to_revision', entry.revisionItemId);
    }
    recordStudyOrbitEvent(entry.id, { type: 'save_to_revision' });
    if (entry.revisionItem) {
      openStudyLinkedNoteSurface(context, { pin: true });
      return;
    }
    activateMediaSource(entry, { pin: true });
    openStudyQuickChallengeSurface(context, 'recall', {
      promptOverride: context.followUpCheck || `From memory, teach ${studyTopicLabel(entry)} in one clear sentence.`,
    });
    setMediaInlineAction((current) =>
      current && current.kind === 'quick_challenge'
        ? {
            ...current,
            revealAnchor: true,
          }
        : current
    );
  };

  const activateMediaSource = (entry: MediaWorkspaceEntry, options?: { pin?: boolean }) => {
    if (entry.asset?.id && onRecordMediaInteraction) {
      void onRecordMediaInteraction(entry.asset.id, 'open', entry.revisionItemId);
    }
    onSelectMediaItem(entry.id);
    setActiveSourceEntryId(entry.id);
    setPinnedSourceEntryId((current) => {
      if (options?.pin) return entry.id;
      if (current && current !== entry.id) return entry.id;
      return current;
    });
    setMediaInlineAction(null);
  };

  const pinMediaSource = (entry: MediaWorkspaceEntry) => {
    activateMediaSource(entry, { pin: true });
  };

  const unpinMediaSource = (entry?: MediaWorkspaceEntry | null) => {
    if (entry) {
      onSelectMediaItem(entry.id);
      setActiveSourceEntryId(entry.id);
    }
    setPinnedSourceEntryId(null);
  };

  const openChallengeFromSource = (entry: MediaWorkspaceEntry) => {
    activateMediaSource(entry);
    openStudyQuickChallengeSurface(buildStudyCoachContext({ entry }), 'challenge');
  };

  const openTeachBackFromSource = (entry: MediaWorkspaceEntry) => {
    activateMediaSource(entry);
    openStudyTeachBackSurface(buildStudyCoachContext({ entry }));
  };

  const openCreativeLabSurface = (
    card: CreativeStreamCard,
    variant?: CreativeLabVariant,
    options?: {
      autoLock?: boolean;
      pinSource?: boolean;
      originStepId?: string | null;
      interactionActionOverride?: MediaInteractionAction | null;
    }
  ) => {
    const weakAssist = matchesWeakTopic(card.topic || card.title, card.subject);
    const resolvedVariant = variant || resolveCreativePrimaryVariant(card, weakAssist);
    const blueprint = buildCreativeLabBlueprint(card, resolvedVariant);
    const signalTokens = buildCreativeLabSignalTokens(card);
    const sourceEntry = card.previewEntry || null;
    if (sourceEntry) {
      const interaction =
        options?.interactionActionOverride ||
        (resolvedVariant === 'reflect'
          ? 'quick_check'
          : resolvedVariant === 'story'
            ? 'explain_simply'
            : resolvedVariant === 'transfer'
              ? 'similar_question'
              : 'quick_check');
      if (sourceEntry.asset?.id && onRecordMediaInteraction) {
        void onRecordMediaInteraction(sourceEntry.asset.id, interaction, sourceEntry.revisionItemId);
      }
      activateMediaSource(sourceEntry, options?.pinSource || options?.autoLock ? { pin: true } : undefined);
    }
    setMediaInlineAction({
      kind: 'creative_lab',
      cardId: card.id,
      cardTitle: card.title,
      topicLabel: blueprint.topicLabel,
      variant: resolvedVariant,
      prompt: blueprint.prompt,
      hint: blueprint.hint,
      anchorLine: blueprint.anchorLine,
      nextMove: blueprint.nextMove,
      selfCheckLine: blueprint.selfCheckLine,
      signalTokens,
      sourceEntry,
      originStepId: options?.originStepId || null,
      draft: '',
      feedback: options?.autoLock
        ? {
            tone: 'strong',
            title: 'Insight locked',
            body: 'This card anchor is now pinned in your Media workspace, ready for challenge or teach-back.',
            nextStep: blueprint.nextMove,
            revealHint: false,
            revealAnchor: true,
            canLock: true,
          }
        : null,
      revealHint: false,
      revealAnchor: Boolean(options?.autoLock),
      lockedIn: Boolean(options?.autoLock),
    });
  };

  const evaluateActiveCreativeLab = () => {
    setMediaInlineAction((current) => {
      if (!current || current.kind !== 'creative_lab') return current;
      const feedback = evaluateCreativeLabResponse({
        draft: current.draft,
        variant: current.variant,
        prompt: current.prompt,
        hint: current.hint,
        anchorLine: current.anchorLine,
        nextMove: current.nextMove,
        selfCheckLine: current.selfCheckLine,
        signalTokens: current.signalTokens,
      });
      return {
        ...current,
        feedback,
        revealHint: current.revealHint || feedback.revealHint,
        revealAnchor: current.revealAnchor || feedback.revealAnchor,
        lockedIn: feedback.canLock ? current.lockedIn : false,
      };
    });
  };

  const keepActiveCreativeLabInsight = () => {
    const current = mediaInlineAction;
    if (!current || current.kind !== 'creative_lab') return;
    if (current.sourceEntry) {
      if (current.sourceEntry.asset?.id && onRecordMediaInteraction) {
        void onRecordMediaInteraction(current.sourceEntry.asset.id, 'save_to_revision', current.sourceEntry.revisionItemId);
      }
      activateMediaSource(current.sourceEntry, { pin: true });
    }
    setMediaInlineAction({
      ...current,
      revealAnchor: true,
      lockedIn: true,
      feedback:
        current.feedback ||
        ({
          tone: 'strong',
          title: 'Insight kept',
          body: 'You locked a clear creative anchor. Reuse it on the next case before switching modes.',
          nextStep: current.nextMove,
          revealHint: false,
          revealAnchor: true,
          canLock: true,
        } as CreativeLabFeedback),
    });
    if (current.originStepId) {
      markCreativeOrbitStepDone(current.cardId, current.originStepId);
    }
  };

  const lockCreativeInsight = (card: CreativeStreamCard) => {
    openCreativeLabSurface(card, resolveCreativePrimaryVariant(card, matchesWeakTopic(card.topic || card.title, card.subject)), {
      autoLock: true,
      pinSource: true,
      interactionActionOverride: 'save_to_revision',
    });
  };

  const triggerCreativeAction = (card: CreativeStreamCard, actionId: CreativeContractActionId) => {
    const weakAssist = matchesWeakTopic(card.topic || card.title, card.subject);
    if (actionId === 'save_to_revision') {
      lockCreativeInsight(card);
      return;
    }
    openCreativeLabSurface(card, resolveCreativeVariantFromAction(card, actionId, weakAssist), {
      interactionActionOverride: mapCreativeContractActionToMediaInteraction(actionId),
    });
  };

  const selectCreativeOrbitStep = (cardId: string, index: number) => {
    setCreativeOrbitStepByCardId((prev) => ({
      ...prev,
      [cardId]: Math.max(0, index),
    }));
  };

  const stepCreativeOrbit = (cardId: string, direction: 1 | -1, stepCount: number) => {
    setCreativeOrbitStepByCardId((prev) => {
      const current = prev[cardId] || 0;
      const next = Math.max(0, Math.min(current + direction, Math.max(0, stepCount - 1)));
      if (next === current) return prev;
      return {
        ...prev,
        [cardId]: next,
      };
    });
  };

  const markCreativeOrbitStepDone = (cardId: string, stepId: string) => {
    setCreativeOrbitCompletedByCardId((prev) => {
      const current = prev[cardId] || [];
      if (current.includes(stepId)) return prev;
      return {
        ...prev,
        [cardId]: [...current, stepId],
      };
    });
  };

  const openChallengeFromLinkedNote = (context: StudyCoachContext) => {
    activateMediaSource(context.entry);
    openStudyQuickChallengeSurface(context, 'challenge');
  };

  const openTeachBackFromLinkedNote = (context: StudyCoachContext) => {
    activateMediaSource(context.entry);
    openStudyTeachBackSurface(context);
  };

  const formatDurationLabel = (durationSec: number | null) => {
    if (!durationSec || Number.isNaN(durationSec)) return null;
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  };

  const renderMediaPreview = (
    entry: MediaWorkspaceEntry,
    options?: { compact?: boolean; deferred?: boolean; staticVideo?: boolean; immersive?: boolean; density?: 'study' | 'creative' }
  ) => {
    const compact = Boolean(options?.compact);
    const deferred = Boolean(options?.deferred);
    const staticVideo = Boolean(options?.staticVideo);
    const immersive = Boolean(options?.immersive);
    const density = options?.density === 'study' ? 'study' : 'creative';
    const frameClass = compact
      ? 'rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-0)] p-2'
      : 'rounded-[1.1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-0)] p-2.5';
    const immersiveStudySurface = immersive && density === 'study';
    const immersiveVideoClass =
      density === 'study'
        ? 'h-[clamp(18rem,42vh,30rem)] w-full object-cover md:h-[clamp(20rem,48vh,34rem)]'
        : 'h-[clamp(15.5rem,43vh,24rem)] w-full object-cover md:h-[clamp(16.5rem,46vh,26rem)]';
    const immersiveVideoFallbackClass =
      density === 'study'
        ? 'flex h-[clamp(18rem,42vh,30rem)] w-full items-center justify-center bg-[var(--copilot-surface-1)] text-sm text-[var(--copilot-text-secondary)] md:h-[clamp(20rem,48vh,34rem)]'
        : 'flex h-[clamp(15.5rem,43vh,24rem)] w-full items-center justify-center bg-[var(--copilot-surface-1)] text-sm text-[var(--copilot-text-secondary)] md:h-[clamp(16.5rem,46vh,26rem)]';
    const immersiveFrameClass =
      density === 'study'
        ? 'h-[clamp(18rem,42vh,30rem)] w-full md:h-[clamp(20rem,48vh,34rem)]'
        : 'h-[clamp(15.5rem,43vh,24rem)] w-full md:h-[clamp(16.5rem,46vh,26rem)]';
    const immersiveImageClass =
      density === 'study'
        ? 'h-[clamp(7.5rem,15vh,10rem)] w-full rounded-[0.85rem] object-cover md:h-[clamp(8rem,16vh,10.75rem)]'
        : 'h-[clamp(11.75rem,28vh,17rem)] w-full rounded-[0.85rem] object-cover md:h-[clamp(12.75rem,29vh,18.25rem)]';
    const youtubeVideoId =
      entry.videoProvider === 'vimeo'
        ? null
        : entry.videoId || extractYouTubeId(entry.sourceUrl);
    const vimeoVideoId =
      entry.videoProvider === 'youtube'
        ? null
        : extractVimeoId(entry.videoId || entry.sourceUrl || null);
    const imageSrc = entry.imageUrl || entry.thumbnailUrl || null;

    if (entry.mediaKind === 'video' && (youtubeVideoId || vimeoVideoId)) {
      if (deferred || staticVideo) {
        const fallbackThumb =
          imageSrc ||
          (youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg` : null) ||
          null;
        return (
          <div className={cn(frameClass, 'space-y-2', immersiveStudySurface && 'copilot-study-stream-media-frame')}>
            <div className="relative overflow-hidden rounded-[0.85rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]">
                {fallbackThumb ? (
                  <img
                    src={fallbackThumb}
                    alt={`${entry.title} preview`}
                    loading="lazy"
                    decoding="async"
                    className={
                      immersive
                        ? immersiveVideoClass
                        : 'h-[240px] w-full object-cover'
                    }
                  />
                ) : (
                    <div
                      className={
                        immersive
                          ? immersiveVideoFallbackClass
                          : 'flex h-[240px] w-full items-center justify-center bg-[var(--copilot-surface-1)] text-sm text-[var(--copilot-text-secondary)]'
                      }
                    >
                    Video preview
                  </div>
                )}
              {formatDurationLabel(entry.durationSec) ? (
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-2 rounded-full border border-[var(--copilot-soft-line)] bg-black/55 px-3 py-1.5 text-[11px] text-white/90">
                  <span>{formatDurationLabel(entry.durationSec)}</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      }
      if (youtubeVideoId) {
        return (
          <div className={cn(frameClass, immersiveStudySurface && 'copilot-study-stream-media-frame')}>
            <YouTubePlayer videoId={youtubeVideoId} mode={immersiveStudySurface ? 'fullscreen' : 'embedded'} />
          </div>
        );
      }
      return (
        <div className={cn(frameClass, immersiveStudySurface && 'copilot-study-stream-media-frame')}>
          <div className="relative overflow-hidden rounded-[0.85rem] border border-[var(--copilot-soft-line)] bg-black/90">
            <iframe
              src={`https://player.vimeo.com/video/${encodeURIComponent(vimeoVideoId || '')}`}
              title={entry.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className={immersive ? immersiveFrameClass : 'h-[240px] w-full'}
            />
          </div>
        </div>
      );
    }

    if (entry.mediaKind === 'audio' && entry.audioUrl) {
      if (deferred) {
        return (
          <div className={cn(frameClass, 'min-h-[120px]', immersiveStudySurface && 'copilot-study-stream-audio-frame')}>
            <div className="flex h-full min-h-[100px] items-center justify-center rounded-[0.85rem] bg-[var(--copilot-surface-1)] px-4 py-3 text-center">
              <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                Audio recap loads when this card is active.
              </p>
            </div>
          </div>
        );
      }
      return (
        <div className={cn(frameClass, 'space-y-3', immersiveStudySurface && 'copilot-study-stream-audio-frame')}>
          <div className={cn('flex items-center justify-between gap-2', immersiveStudySurface && 'copilot-study-stream-audio-header')}>
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
              {immersiveStudySurface ? 'Stay with the recap' : 'Audio recap'}
            </p>
            {formatDurationLabel(entry.durationSec) ? (
              <span className={cn('copilot-revision-pill', immersiveStudySurface && 'copilot-study-stream-audio-time')}>
                {formatDurationLabel(entry.durationSec)}
              </span>
            ) : null}
          </div>
          <audio
            controls
            preload="none"
            className={cn('w-full', immersiveStudySurface && 'copilot-study-stream-audio-control')}
            onLoadedMetadata={(event) => {
              const resumeAt = audioProgressRef.current[entry.id] || 0;
              if (resumeAt > 0 && Number.isFinite(event.currentTarget.duration) && resumeAt < event.currentTarget.duration - 1) {
                event.currentTarget.currentTime = resumeAt;
              }
            }}
            onTimeUpdate={(event) => {
              const sec = Math.max(0, Math.floor(event.currentTarget.currentTime || 0));
              if (!sec) return;
              audioProgressRef.current[entry.id] = sec;
              if (sec % 8 === 0) {
                persistAudioProgress();
              }
            }}
            onPause={() => {
              persistAudioProgress();
            }}
            onEnded={() => {
              audioProgressRef.current[entry.id] = 0;
              persistAudioProgress();
            }}
            onPlay={() => {
              if (entry.asset?.id && onRecordMediaInteraction) {
                void onRecordMediaInteraction(entry.asset.id, 'play', entry.revisionItemId);
              }
            }}
          >
            <source src={entry.audioUrl} />
          </audio>
          <p className={cn('line-clamp-2 text-xs text-[var(--copilot-text-secondary)]', immersiveStudySurface && 'copilot-study-stream-audio-summary')}>
            {entry.summary || entry.keyIdea || 'Listen once, then answer one quick recall question.'}
          </p>
        </div>
      );
    }

    if (entry.mediaKind === 'image' && imageSrc) {
      return (
        <div className={frameClass}>
          <img
            src={imageSrc}
            alt={entry.title}
            loading="lazy"
            className={
              immersive
                ? immersiveImageClass
                : 'h-[240px] w-full rounded-[0.85rem] object-cover'
            }
          />
        </div>
      );
    }

    return (
      <div className={`${frameClass} min-h-[190px]`}>
        <div className="flex h-full min-h-[170px] items-center justify-center rounded-[0.85rem] bg-[var(--copilot-surface-1)] px-5 py-4 text-center">
          <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
            {entry.summary || entry.keyIdea || 'This recap is ready. Open it to continue in context.'}
          </p>
        </div>
      </div>
    );
  };

  const mediaPreferences = useMemo<MediaPreferenceProfile>(
    () => ({
      preferredRecapType:
        mediaPreferenceProfile?.preferredRecapType === 'audio' ||
        mediaPreferenceProfile?.preferredRecapType === 'video' ||
        mediaPreferenceProfile?.preferredRecapType === 'visual' ||
        mediaPreferenceProfile?.preferredRecapType === 'mixed'
          ? mediaPreferenceProfile.preferredRecapType
          : 'mixed',
      shortFormSupport:
        mediaPreferenceProfile?.shortFormSupport === 'concept_intuition' ||
        mediaPreferenceProfile?.shortFormSupport === 'worked_example' ||
        mediaPreferenceProfile?.shortFormSupport === 'quick_recap'
          ? mediaPreferenceProfile.shortFormSupport
          : 'concept_intuition',
      allowExternalCreativeSuggestions:
        mediaPreferenceProfile?.allowExternalCreativeSuggestions !== false,
    }),
    [mediaPreferenceProfile]
  );
  const resolvedStreamMode = resolveMediaStreamMode(
    mediaStreamMeta,
    mediaMode === 'creative_stream' ? 'creative' : 'study'
  );
  const mediaStreamNotices = useMemo(() => resolveMediaStreamNotices(mediaStreamMeta), [mediaStreamMeta]);
  const mediaStreamDeck = useMemo(
    () => resolveMediaStreamDeckMeta(mediaStreamMeta, resolvedStreamMode),
    [mediaStreamMeta, resolvedStreamMode]
  );
  const mediaStreamEmptyState = useMemo(
    () => resolveMediaStreamEmptyState(mediaStreamMeta, resolvedStreamMode),
    [mediaStreamMeta, resolvedStreamMode]
  );
  const primaryStreamNotice = mediaStreamNotices[0] || null;
  const weakTopicHints = useMemo(
    () =>
      revisionItems
        .filter((item) => item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled')
        .map((item) => item.topic || item.subtopic || item.title || '')
        .map((value) => value.trim())
        .filter(Boolean),
    [revisionItems]
  );
  function normalizeMediaLabel(value: string | null | undefined) {
    return String(value || '').trim().toLowerCase();
  }
  const resolveStreamTone = (subject: string | null | undefined) => {
    const key = normalizeMediaLabel(subject);
    if (['math', 'physics', 'chemistry'].some((token) => key.includes(token))) return 'analytic';
    if (['biology', 'geography'].some((token) => key.includes(token))) return 'natural';
    if (['english', 'kiswahili', 'arabic', 'literature', 'history'].some((token) => key.includes(token))) return 'language';
    return 'balanced';
  };
  const describeStreamTone = (tone: string) => {
    if (tone === 'analytic') return 'Analytic pulse';
    if (tone === 'natural') return 'Natural pulse';
    if (tone === 'language') return 'Language pulse';
    return 'Guided pulse';
  };
  const matchesWeakTopic = (topic: string | null | undefined, subject: string | null | undefined) => {
    const topicKey = normalizeMediaLabel(topic);
    const subjectKey = normalizeMediaLabel(subject);
    return weakTopicHints.some((weak) => {
      const weakKey = normalizeMediaLabel(weak);
      return weakKey && (topicKey.includes(weakKey) || weakKey.includes(topicKey) || subjectKey.includes(weakKey));
    });
  };
  const bestForLabel = (
    entry: { durationSec: number | null; bestUse: string | null; mediaKind: FullscreenMediaFilter },
    mode: 'study' | 'creative'
  ) => {
    if (entry.bestUse) return entry.bestUse;
    if (modeFlags?.focus && (entry.durationSec == null || entry.durationSec <= 240)) return 'Quick focused recall';
    if (entry.mediaKind === 'audio') return 'Audio-first reinforcement';
    if (entry.mediaKind === 'image') return 'Visual intuition pass';
    if (mode === 'creative') return 'Alternative explanation style';
    return 'Step-by-step concept reinforcement';
  };
  type StreamViewportTier = 'desktop' | 'laptop' | 'tablet' | 'mobile';
  type StreamPointerType = 'fine' | 'coarse';
  type StreamInteractionMatrix = {
    viewportTier: StreamViewportTier;
    pointer: StreamPointerType;
    wheelStepThresholdPx: number;
    wheelResetMs: number;
    wheelLockMs: number;
    scrollSyncLockMs: number;
    scrollHysteresisPx: number;
  };
  const deriveStreamInteractionMatrix = (): StreamInteractionMatrix => {
    if (typeof window === 'undefined') {
      return {
        viewportTier: 'desktop',
        pointer: 'fine',
        wheelStepThresholdPx: 60,
        wheelResetMs: 140,
        wheelLockMs: 560,
        scrollSyncLockMs: 540,
        scrollHysteresisPx: 24,
      };
    }
    const width = window.innerWidth;
    const coarsePointer =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const viewportTier: StreamViewportTier =
      width <= 640 ? 'mobile' : width <= 980 ? 'tablet' : width <= 1360 ? 'laptop' : 'desktop';
    const byTier: Record<
      StreamViewportTier,
      { threshold: number; reset: number; lock: number; sync: number; hysteresis: number }
    > = {
      desktop: { threshold: 64, reset: 138, lock: 590, sync: 560, hysteresis: 28 },
      laptop: { threshold: 58, reset: 145, lock: 560, sync: 540, hysteresis: 24 },
      tablet: { threshold: 46, reset: 156, lock: 520, sync: 500, hysteresis: 20 },
      mobile: { threshold: 38, reset: 168, lock: 470, sync: 450, hysteresis: 15 },
    };
    const tuned = byTier[viewportTier];
    return {
      viewportTier,
      pointer: coarsePointer ? 'coarse' : 'fine',
      wheelStepThresholdPx: Math.max(26, tuned.threshold + (coarsePointer ? -8 : 0)),
      wheelResetMs: coarsePointer ? tuned.reset + 18 : tuned.reset,
      wheelLockMs: coarsePointer ? tuned.lock - 30 : tuned.lock,
      scrollSyncLockMs: reducedMotion ? 120 : tuned.sync,
      scrollHysteresisPx: coarsePointer ? Math.max(10, tuned.hysteresis - 4) : tuned.hysteresis,
    };
  };
  const [streamInteractionMatrix, setStreamInteractionMatrix] = useState<StreamInteractionMatrix>(
    () => deriveStreamInteractionMatrix()
  );
  const [studyStreamIndex, setStudyStreamIndex] = useState(0);
  const [creativeStreamIndex, setCreativeStreamIndex] = useState(0);
  const [studyTransitionDirection, setStudyTransitionDirection] = useState<1 | -1>(1);
  const [creativeTransitionDirection, setCreativeTransitionDirection] = useState<1 | -1>(1);
  const [libraryCategory, setLibraryCategory] = useState<MediaLibraryCategory>(mediaFilter);
  const [showStudyQueue, setShowStudyQueue] = useState(false);
  const [showCreativeQueue, setShowCreativeQueue] = useState(false);
  const [openedCollectionId, setOpenedCollectionId] = useState<string | null>(null);
  const [actionAcks, setActionAcks] = useState<Record<string, number>>({});
  const [mediaInlineAction, setMediaInlineAction] = useState<MediaInlineActionState | null>(null);
  const [activeSourceEntryId, setActiveSourceEntryId] = useState<string | null>(null);
  const [pinnedSourceEntryId, setPinnedSourceEntryId] = useState<string | null>(null);
  const activeSourceEntry =
    (activeSourceEntryId ? mediaEntryById.get(activeSourceEntryId) || null : null) || null;
  const pinnedSourceEntry =
    (pinnedSourceEntryId ? mediaEntryById.get(pinnedSourceEntryId) || null : null) || null;
  const [studyInteracted, setStudyInteracted] = useState(false);
  const [creativeInteracted, setCreativeInteracted] = useState(false);
  const [studyOrbitTrackingByEntryId, setStudyOrbitTrackingByEntryId] = useState<Record<string, StudyOrbitProgressState>>({});
  const [creativeOrbitStepByCardId, setCreativeOrbitStepByCardId] = useState<Record<string, number>>({});
  const [creativeOrbitCompletedByCardId, setCreativeOrbitCompletedByCardId] = useState<Record<string, string[]>>({});
  const [creativeDeckDepth, setCreativeDeckDepth] = useState(0);
  const [creativeDeckCacheVersion, setCreativeDeckCacheVersion] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const mediaWorkspaceScrollRef = useRef<HTMLDivElement | null>(null);
  const studyStreamViewportRef = useRef<HTMLDivElement | null>(null);
  const creativeStreamViewportRef = useRef<HTMLDivElement | null>(null);
  const studyScrollRafRef = useRef<number | null>(null);
  const creativeScrollRafRef = useRef<number | null>(null);
  const studyWheelLockRef = useRef(false);
  const creativeWheelLockRef = useRef(false);
  const studyWheelDeltaRef = useRef(0);
  const creativeWheelDeltaRef = useRef(0);
  const studyWheelStepConsumedRef = useRef(false);
  const creativeWheelStepConsumedRef = useRef(false);
  const studyWheelResetRef = useRef<number | null>(null);
  const creativeWheelResetRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeSourceEntryId && !mediaEntryById.has(activeSourceEntryId)) {
      setActiveSourceEntryId(null);
    }
    if (pinnedSourceEntryId && !mediaEntryById.has(pinnedSourceEntryId)) {
      setPinnedSourceEntryId(null);
    }
  }, [activeSourceEntryId, mediaEntryById, pinnedSourceEntryId]);

  useEffect(() => {
    if (libraryCategory === 'collections') return;
    if (libraryCategory !== mediaFilter) {
      setLibraryCategory(mediaFilter);
    }
  }, [libraryCategory, mediaFilter]);

  const selectLibraryCategory = useCallback(
    (category: MediaLibraryCategory) => {
      setLibraryCategory(category);
      if (category !== 'collections' && category !== mediaFilter) {
        onMediaFilterChange(category);
      }
    },
    [mediaFilter, onMediaFilterChange]
  );

  useEffect(() => {
    if (!openedCollectionId) return;
    if (collectionEntries.some((collection) => collection.id === openedCollectionId)) return;
    setOpenedCollectionId(null);
  }, [collectionEntries, openedCollectionId]);

  const toggleCollectionOpen = useCallback((collectionId: string) => {
    setOpenedCollectionId((current) => (current === collectionId ? null : collectionId));
  }, []);
  const selectedAssetForCollection = effectiveSelectedMediaItem?.asset?.id ? effectiveSelectedMediaItem : null;
  const createMediaCollectionFromWorkspace = useCallback(() => {
    if (!onCreateMediaCollection || typeof window === 'undefined') return;
    const draftTitle = window.prompt('Name your media collection');
    const title = String(draftTitle || '').trim();
    if (!title) return;
    const selected =
      selectedAssetForCollection && !selectedAssetForCollection.isDemo
        ? selectedAssetForCollection
        : null;
    void Promise.resolve(
      onCreateMediaCollection({
        title,
        subject: selected?.subject || undefined,
        topic: selected?.topic || undefined,
        metadata: {
          createdFrom: 'media_workspace',
          seedAssetId: selected?.asset?.id || null,
        },
      })
    );
  }, [onCreateMediaCollection, selectedAssetForCollection]);
  const addSelectedAssetToCollection = useCallback(
    (collectionId: string) => {
      const assetId = selectedAssetForCollection?.asset?.id || null;
      if (!assetId || !onAddAssetToMediaCollection) return;
      void Promise.resolve(onAddAssetToMediaCollection(collectionId, assetId));
    },
    [onAddAssetToMediaCollection, selectedAssetForCollection]
  );
  const studyProgrammaticSyncUntilRef = useRef(0);
  const creativeProgrammaticSyncUntilRef = useRef(0);
  const creativeDeckCacheRef = useRef<Record<string, CreativeGeneratedDeckCacheEntry>>({});
  const creativeDeckCacheHydratedRef = useRef(false);
  const creativeDeckDepthHydratedRef = useRef(false);
  const audioProgressRef = useRef<Record<string, number>>({});
  const didRestoreStudyIndexRef = useRef(false);
  const didRestoreCreativeIndexRef = useRef(false);
  const studySelectionSyncRef = useRef<number | null>(null);
  const creativeSelectionSyncRef = useRef<number | null>(null);
  const inlineActionAutoCheckRef = useRef<number | null>(null);
  const studyOrbitTrackingHydratedRef = useRef(false);
  const studyVisitCountByEntryIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateMatrix = () => {
      const next = deriveStreamInteractionMatrix();
      setStreamInteractionMatrix((prev) =>
        prev.viewportTier === next.viewportTier &&
        prev.pointer === next.pointer &&
        prev.wheelStepThresholdPx === next.wheelStepThresholdPx &&
        prev.wheelResetMs === next.wheelResetMs &&
        prev.wheelLockMs === next.wheelLockMs &&
        prev.scrollSyncLockMs === next.scrollSyncLockMs &&
        prev.scrollHysteresisPx === next.scrollHysteresisPx
          ? prev
          : next
      );
    };
    updateMatrix();
    const resizeListener = () => updateMatrix();
    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(hover: none)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];
    window.addEventListener('resize', resizeListener, { passive: true });
    mediaQueries.forEach((query) => query.addEventListener('change', updateMatrix));
    return () => {
      window.removeEventListener('resize', resizeListener);
      mediaQueries.forEach((query) => query.removeEventListener('change', updateMatrix));
    };
  }, []);

  const isStudyCompanionPinned =
    streamInteractionMatrix.viewportTier === 'desktop' || streamInteractionMatrix.viewportTier === 'laptop';
  const isCreativeCompanionPinned =
    streamInteractionMatrix.viewportTier === 'desktop' || streamInteractionMatrix.viewportTier === 'laptop';
  const creativeCompanionEnabled = true;
  const showStudyCompanion = isStudyCompanionPinned ? true : showStudyQueue;
  const showCreativeCompanion = creativeCompanionEnabled ? (isCreativeCompanionPinned ? true : showCreativeQueue) : false;
  const effectiveStreamWindowMode = surfaceKind === 'fullscreen' ? 'fullscreen' : 'windowed';
  const compactWindowedMediaCard = effectiveStreamWindowMode === 'windowed';
  const studyStreamUsesPageScroll =
    effectiveStreamWindowMode === 'windowed' ||
    streamInteractionMatrix.viewportTier === 'tablet' ||
    streamInteractionMatrix.viewportTier === 'mobile';
  const compactStudyStreamCard =
    compactWindowedMediaCard ||
    streamInteractionMatrix.viewportTier === 'tablet' ||
    streamInteractionMatrix.viewportTier === 'mobile';

  useEffect(() => {
    if (streamInteractionMatrix.viewportTier !== 'mobile') return;
    setShowStudyQueue(false);
    setShowCreativeQueue(false);
  }, [streamInteractionMatrix.viewportTier]);

  useEffect(() => {
    setMediaInlineAction(null);
  }, [mediaMode]);

  useEffect(() => {
    if (mediaMode !== 'study_stream' && mediaMode !== 'creative_stream') return;
    // STRICT: entering or switching Media modes must reset both scroll layers so
    // Media cannot leak a stale shell scroll position into the next route.
    resetMediaScrollContract({
      workspace: mediaWorkspaceScrollRef.current,
      viewport: mediaMode === 'creative_stream' ? creativeStreamViewportRef.current : studyStreamViewportRef.current,
    });
  }, [mediaMode, studyStreamUsesPageScroll]);

  const markActionAck = (key: string, ttlMs = 2200) => {
    const expiresAt = Date.now() + ttlMs;
    setActionAcks((prev) => ({ ...prev, [key]: expiresAt }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setActionAcks((prev) => {
          const next = { ...prev };
          if ((next[key] || 0) <= Date.now()) delete next[key];
          return next;
        });
      }, ttlMs + 120);
    }
  };

  const isAckActive = (key: string) => (actionAcks[key] || 0) > Date.now();

  const recordStudyOrbitEvent = (
    entryId: string | null | undefined,
    event: Parameters<typeof applyStudyOrbitTrackingEvent>[1]
  ) => {
    if (!entryId) return;
    setStudyOrbitTrackingByEntryId((prev) => {
      const next = applyStudyOrbitTrackingEvent(prev[entryId], event);
      return {
        ...prev,
        [entryId]: next,
      };
    });
  };

  const persistAudioProgress = () => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem('steadfast.media.audioProgress', JSON.stringify(audioProgressRef.current));
    } catch {
      // ignore session storage failures
    }
  };

  const dueNowSubjectHints = useMemo(
    () =>
      (revisionOverview?.queuePreview?.dueNow || [])
        .map((item) => String(item.subject || '').trim().toLowerCase())
        .filter(Boolean),
    [revisionOverview?.queuePreview?.dueNow]
  );
  const studyContinuitySeed = useMemo(
    () =>
      normalizeMediaLabel(
        (revisionOverview?.queuePreview?.dueNow || [])[0]?.topic ||
          weakTopicHints[0] ||
          activeStreamEntries[0]?.entry.topic ||
          activeStreamEntries[0]?.entry.title
      ),
    [activeStreamEntries, revisionOverview?.queuePreview?.dueNow, weakTopicHints]
  );
  const baseCreativeDeckTargetCount =
    streamInteractionMatrix.viewportTier === 'mobile'
      ? 8
      : streamInteractionMatrix.viewportTier === 'tablet'
        ? 10
        : 12;
  const creativeReplenishBatchSize = streamInteractionMatrix.viewportTier === 'mobile' ? 2 : 3;
  const creativeDeckTargetCount = Math.min(
    baseCreativeDeckTargetCount + 8,
    baseCreativeDeckTargetCount + Math.floor(Math.max(0, creativeDeckDepth) / 3) * creativeReplenishBatchSize
  );
  const creativeOrbitCacheKey = useMemo(() => {
    const seeds = [
      ...weakTopicHints,
      ...activeStreamEntries.map((item) => item.entry.topic || item.entry.subtopic || item.entry.title),
    ]
      .map((value) => normalizeMediaLabel(value))
      .filter(Boolean);
    const uniqueSeeds = Array.from(new Set(seeds)).slice(0, 12);
    return JSON.stringify({
      support: mediaPreferences.shortFormSupport,
      external: mediaPreferences.allowExternalCreativeSuggestions !== false,
      focus: Boolean(modeFlags?.focus),
      filter: mediaFilter,
      continuity: studyContinuitySeed,
      seeds: uniqueSeeds,
    });
  }, [
    activeStreamEntries,
    mediaFilter,
    mediaPreferences.allowExternalCreativeSuggestions,
    mediaPreferences.shortFormSupport,
    modeFlags?.focus,
    studyContinuitySeed,
    weakTopicHints,
  ]);

  useEffect(() => {
    if (creativeDeckCacheHydratedRef.current || typeof window === 'undefined') return;
    creativeDeckCacheHydratedRef.current = true;
    try {
      const raw = window.sessionStorage.getItem(CREATIVE_ENGINE_CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CreativeGeneratedDeckCacheEntry>;
      if (!parsed || typeof parsed !== 'object') return;
      creativeDeckCacheRef.current = Object.fromEntries(
        Object.entries(parsed).filter(
          ([, value]) =>
            value &&
            typeof value === 'object' &&
            Number.isFinite(Number((value as CreativeGeneratedDeckCacheEntry).ts)) &&
            Array.isArray((value as CreativeGeneratedDeckCacheEntry).cards)
        )
      ) as Record<string, CreativeGeneratedDeckCacheEntry>;
      setCreativeDeckCacheVersion((prev) => prev + 1);
    } catch {
      creativeDeckCacheRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawDepth = window.sessionStorage.getItem('steadfast.media.creative.deckDepth');
    const parsed = Number(rawDepth || 0);
    if (Number.isFinite(parsed) && parsed > 0) {
      setCreativeDeckDepth(parsed);
    }
    creativeDeckDepthHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!creativeDeckDepthHydratedRef.current || typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem('steadfast.media.creative.deckDepth', String(Math.max(0, creativeDeckDepth)));
    } catch {
      // ignore session storage failures
    }
  }, [creativeDeckDepth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('steadfast.media.audioProgress');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const next: Record<string, number> = {};
      Object.entries(parsed || {}).forEach(([key, value]) => {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && numeric > 0) {
          next[key] = numeric;
        }
      });
      audioProgressRef.current = next;
    } catch {
      audioProgressRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (studyOrbitTrackingHydratedRef.current || typeof window === 'undefined') return;
    studyOrbitTrackingHydratedRef.current = true;
    try {
      const raw = window.sessionStorage.getItem(STUDY_ORBIT_TRACKING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') return;
      const next: Record<string, StudyOrbitProgressState> = {};
      Object.entries(parsed).forEach(([entryId, value]) => {
        const key = String(entryId || '').trim();
        if (!key) return;
        const coerced = coerceStudyOrbitProgressState(value);
        if (!coerced) return;
        next[key] = coerced;
      });
      setStudyOrbitTrackingByEntryId(next);
    } catch {
      // ignore hydration failures and start a fresh in-memory tracker
    }
  }, []);

  const studyStreamEntries = useMemo(() => {
    const preferredKindBoost = (entry: MediaWorkspaceEntry) => {
      if (mediaPreferences.preferredRecapType === 'mixed') return 0;
      if (mediaPreferences.preferredRecapType === 'audio') return entry.mediaKind === 'audio' ? 6 : -1;
      if (mediaPreferences.preferredRecapType === 'video') return entry.mediaKind === 'video' ? 6 : -1;
      if (mediaPreferences.preferredRecapType === 'visual') {
        return entry.mediaKind === 'image' || entry.mediaKind === 'document' ? 5 : -1;
      }
      return 0;
    };

    const ranked = activeStreamEntries
      .map((item, index) => {
        const entry = item.entry;
        const topicKey = normalizeMediaLabel(entry.topic || entry.subtopic || entry.title);
        const subjectKey = normalizeMediaLabel(entry.subject);
        const metadata = (entry.asset?.metadata || {}) as Record<string, unknown>;
        const weakMatch = weakTopicHints.some((weak) => {
          const weakKey = normalizeMediaLabel(weak);
          return weakKey && (topicKey.includes(weakKey) || weakKey.includes(topicKey) || subjectKey.includes(weakKey));
        });
        const hasConfusionSignal =
          entry.revisionItem?.reviewStatus === 'needs_attention' ||
          entry.revisionItem?.recentOutcome === 'struggled' ||
          entry.revisionItem?.isMistakeBased === true;
        const unfinished = entry.asset ? entry.asset.isCompleted !== true : true;
        const helpful = entry.asset?.isHelpful === true;
        const continuityHit =
          studyContinuitySeed.length >= 3 &&
          (topicKey.includes(studyContinuitySeed) || studyContinuitySeed.includes(topicKey));
        const revisionLinked = Boolean(entry.revisionItemId || entry.revisionItem);
        const examBoost = modeFlags?.exam
          ? String(entry.asset?.examRelevance || metadata.examRelevance || '').trim()
            ? 8
            : 0
          : 0;
        const focusBoost = modeFlags?.focus
          ? entry.durationSec == null || entry.durationSec <= 220
            ? 6
            : 0
          : 0;
        const dueSubjectBoost =
          dueNowSubjectHints.length > 0 && dueNowSubjectHints.includes(subjectKey) ? 4 : 0;

        let spacingBoost = 0;
        const lastTouch = entry.asset?.lastReviewedAt || entry.asset?.lastPlayedAt || entry.asset?.lastOpenedAt || entry.createdAt;
        if (lastTouch) {
          const days = Math.max(0, (Date.now() - new Date(lastTouch).getTime()) / 86_400_000);
          if (days >= 2 && days <= 7) spacingBoost += 4;
          else if (days < 0.35) spacingBoost -= 3;
        }

        const localScore =
          Number(item.rankScore || 0) +
          (weakMatch ? 5 : 0) +
          (hasConfusionSignal ? 4 : 0) +
          (revisionLinked ? 5 : 0) +
          (unfinished ? 3 : -1) +
          (continuityHit ? 4 : 0) +
          (helpful ? 3 : 0) +
          preferredKindBoost(entry) +
          dueSubjectBoost +
          spacingBoost +
          examBoost +
          focusBoost -
          index * 0.2;

        return {
          ...item,
          streamScore: Math.round(localScore),
        };
      })
      .sort((a, b) => b.streamScore - a.streamScore || b.rankScore - a.rankScore);

    const deduped: typeof ranked = [];
    const seenKeys = new Set<string>();
    ranked.forEach((item) => {
      const dedupeKey =
        normalizeMediaLabel(item.entry.revisionItemId) ||
        `${normalizeMediaLabel(item.entry.topic || item.entry.title)}:${item.entry.mediaKind}`;
      if (seenKeys.has(dedupeKey)) return;
      seenKeys.add(dedupeKey);
      deduped.push(item);
    });

    return deduped;
  }, [activeStreamEntries, dueNowSubjectHints, mediaPreferences.preferredRecapType, modeFlags?.exam, modeFlags?.focus, studyContinuitySeed, weakTopicHints]);

  useEffect(() => {
    setStudyOrbitTrackingByEntryId((prev) => {
      const validIds = new Set(studyStreamEntries.map((item) => item.entry.id).filter(Boolean));
      if (validIds.size === 0) return Object.keys(prev).length ? {} : prev;
      let changed = false;
      const next: Record<string, StudyOrbitProgressState> = {};
      Object.entries(prev).forEach(([entryId, state]) => {
        if (!validIds.has(entryId)) {
          changed = true;
          return;
        }
        next[entryId] = state;
      });
      return changed ? next : prev;
    });
  }, [studyStreamEntries]);

  useEffect(() => {
    if (!studyOrbitTrackingHydratedRef.current || typeof window === 'undefined') return;
    try {
      const demoEntryIds = studyStreamEntries.filter((item) => item.entry.isDemo).map((item) => item.entry.id);
      const persistableState = filterPersistableStudyOrbitTrackingState(studyOrbitTrackingByEntryId, demoEntryIds);
      window.sessionStorage.setItem(STUDY_ORBIT_TRACKING_STORAGE_KEY, JSON.stringify(persistableState));
    } catch {
      // ignore session storage failures
    }
  }, [studyOrbitTrackingByEntryId, studyStreamEntries]);

  useEffect(() => {
    if (studyStreamEntries.length === 0) {
      setStudyStreamIndex(0);
      return;
    }
    setStudyStreamIndex((prev) => Math.max(0, Math.min(prev, studyStreamEntries.length - 1)));
  }, [studyStreamEntries.length]);

  useEffect(() => {
    if (didRestoreStudyIndexRef.current || studyStreamEntries.length === 0) return;
    if (typeof window === 'undefined') return;
    didRestoreStudyIndexRef.current = true;
    const savedCardId = window.sessionStorage.getItem('steadfast.media.study.activeCardId');
    if (!savedCardId) return;
    const savedIndex = studyStreamEntries.findIndex((item) => item.entry.id === savedCardId);
    if (savedIndex >= 0) {
      setStudyStreamIndex(savedIndex);
      window.requestAnimationFrame(() => {
        scrollStudyToIndex(savedIndex, 'auto');
      });
    }
  }, [studyStreamEntries]);

  const highlightedStream = studyStreamEntries[studyStreamIndex] || studyStreamEntries[0] || null;
  const nextStudyStreamItem = studyStreamEntries[studyStreamIndex + 1] || null;
  const nextStudyStreamEntry = nextStudyStreamItem?.entry || null;
  const highlightedStudyEntry = highlightedStream?.entry || null;
  const activeStudyTone = resolveStreamTone(highlightedStudyEntry?.subject);
  const activeStudyWeakAssist = highlightedStudyEntry
    ? matchesWeakTopic(
        highlightedStudyEntry.topic || highlightedStudyEntry.subtopic || highlightedStudyEntry.title,
        highlightedStudyEntry.subject
      )
    : false;
  const activeStudyCompleted = highlightedStudyEntry?.asset?.isCompleted === true;
  const highlightedStudyCoachContext = highlightedStudyEntry
    ? buildStudyCoachContext({
        entry: highlightedStudyEntry,
        reason: highlightedStream?.reason,
        nextMove: highlightedStream?.nextMove,
        quickCheck: highlightedStream?.quickCheck,
        studyGuide: highlightedStream?.studyGuide,
        weakAssist: activeStudyWeakAssist,
        completed: activeStudyCompleted,
      })
    : null;
  const highlightedStudyFocusLine =
    highlightedStudyCoachContext?.focusLine || 'Hold on to the one idea that changes the answer.';
  const highlightedStudyWhyNowLine =
    highlightedStudyCoachContext?.whyNowLine || 'Ranked to give you the clearest next unlock right now.';
  const highlightedStudyUnlockLine =
    highlightedStudyCoachContext?.unlockLine || 'Apply this idea on one similar question right now.';
  const highlightedStudyCheckLine =
    highlightedStudyCoachContext?.checkLine || 'In one sentence, what is the main idea here?';
  const highlightedStudyPulseLabel = activeStudyWeakAssist
    ? 'Weak-topic rescue'
    : activeStudyCompleted
      ? 'Revision-ready'
      : 'Clarity boost';
  const highlightedStudyPulseTone = activeStudyWeakAssist ? 'weak' : activeStudyCompleted ? 'ready' : 'clarity';
  const highlightedStudyAnchorLine =
    highlightedStudyCoachContext?.anchorLine || 'Anchor the one move that makes this topic easier to explain.';
  const highlightedStudyLinkedNoteActive = Boolean(
    highlightedStudyEntry?.revisionItem && activeSourceEntry && activeSourceEntry.id === highlightedStudyEntry.id
  );
  const highlightedStudyLinkedNotePinned = Boolean(
    highlightedStudyEntry?.revisionItem && pinnedSourceEntry && pinnedSourceEntry.id === highlightedStudyEntry.id
  );
  const upcomingStudyQueueEntries = useMemo(
    () => pickUpcomingStudyLineup(studyStreamEntries, studyStreamIndex, 3),
    [studyStreamEntries, studyStreamIndex]
  );
  const highlightedStudyOrbitProgress = highlightedStudyEntry
    ? studyOrbitTrackingByEntryId[highlightedStudyEntry.id] || createEmptyStudyOrbitProgressState()
    : createEmptyStudyOrbitProgressState();
  const highlightedStudyStageShortLabel = formatStudyOrbitStageShortLabel(highlightedStudyOrbitProgress.stage);
  const highlightedStudyReflectionEvidence = highlightedStudyOrbitProgress.lastReflectionEvidence;
  const highlightedStudyReflectionSummary = highlightedStudyReflectionEvidence?.detected
    ? highlightedStudyReflectionEvidence?.triggers.length
      ? `Reflection detected (${highlightedStudyReflectionEvidence.triggers.join(', ')}).`
      : 'Reflection detected from your latest response.'
    : 'No reflection signal yet. Write one reason in your own words to register reflection.';
  const highlightedStudyStageSentence = buildStudyOrbitStageSentence(highlightedStudyOrbitProgress.stage);
  const highlightedStudyPrimaryCue = selectStudyOrbitPrimaryCue({
    stage: highlightedStudyOrbitProgress.stage,
    focusLine: highlightedStudyFocusLine,
    checkLine: highlightedStudyCheckLine,
    anchorLine: highlightedStudyAnchorLine,
    whyNowLine: highlightedStudyWhyNowLine,
    reflectionLine: highlightedStudyReflectionSummary,
    unlockLine: highlightedStudyUnlockLine,
  });
  const highlightedStudyUnlockView = buildStudyOrbitUnlockView({
    stage: highlightedStudyOrbitProgress.stage,
    evidenceScore: highlightedStudyOrbitProgress.evidenceScore,
    confidenceScore: highlightedStudyOrbitProgress.confidenceScore,
    opens: highlightedStudyOrbitProgress.opens,
    quickChecks: highlightedStudyOrbitProgress.quickChecks,
    teachBackChecks: highlightedStudyOrbitProgress.teachBackChecks,
    reflections: highlightedStudyOrbitProgress.reflections,
    strongChecks: highlightedStudyOrbitProgress.strongChecks,
    closeChecks: highlightedStudyOrbitProgress.closeChecks,
    keepCount: highlightedStudyOrbitProgress.keepCount,
    saveToRevisionCount: highlightedStudyOrbitProgress.saveToRevisionCount,
    similarQuestionAttempts: highlightedStudyOrbitProgress.similarQuestionAttempts,
    nextTopic: nextStudyStreamEntry?.topic || nextStudyStreamEntry?.title || null,
  });
  const highlightedStudyUnlockReadinessLabel =
    highlightedStudyUnlockView.readiness === 'ready'
      ? 'Ready now'
      : highlightedStudyUnlockView.readiness === 'nearly_ready'
        ? 'Nearly ready'
        : 'In progress';
  const studyQueueCount = Math.max(0, studyStreamEntries.length - (studyStreamIndex + 1));
  const runHighlightedStudyUnlockAction = () => {
    if (!highlightedStudyCoachContext) return;
    if (highlightedStudyUnlockView.action === 'open_next') {
      scrollStudyToIndex(studyStreamIndex + 1);
      return;
    }
    if (highlightedStudyUnlockView.action === 'quick_check') {
      openStudyQuickChallengeSurface(highlightedStudyCoachContext, 'challenge');
      return;
    }
    if (highlightedStudyUnlockView.action === 'teach_back') {
      openStudyTeachBackSurface(highlightedStudyCoachContext);
      return;
    }
    if (highlightedStudyUnlockView.action === 'keep_anchor') {
      lockStudyIntoRevision(highlightedStudyCoachContext);
      return;
    }
    if (highlightedStudyUnlockView.action === 'transfer') {
      openStudyQuickChallengeSurface(highlightedStudyCoachContext, 'challenge', {
        orbitEventType: 'open_similar_question',
        promptOverride:
          highlightedStudyCoachContext.followUpCheck ||
          `Try one similar case for ${highlightedStudyCoachContext.entry.topic || highlightedStudyCoachContext.entry.title}.`,
      });
      return;
    }
    openStudyQuickChallengeSurface(highlightedStudyCoachContext, 'challenge');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeId = highlightedStream?.entry.id;
    if (!activeId) return;
    window.sessionStorage.setItem('steadfast.media.study.activeCardId', activeId);
  }, [highlightedStream?.entry.id]);

  useEffect(() => {
    const activeId = highlightedStream?.entry.id;
    if (!activeId) return;
    const visits = studyVisitCountByEntryIdRef.current[activeId] || 0;
    if (visits > 0) {
      recordStudyOrbitEvent(activeId, { type: 'revisit_card' });
    }
    studyVisitCountByEntryIdRef.current[activeId] = visits + 1;
  }, [highlightedStream?.entry.id]);

  useEffect(() => {
    if (mediaMode !== 'study_stream') return;
    if (!selectedMediaItemId || studyStreamEntries.length === 0) return;
    if (studyInteracted) return;
    const index = studyStreamEntries.findIndex((item) => item.entry.id === selectedMediaItemId);
    if (index >= 0 && index !== studyStreamIndex) {
      scrollStudyToIndex(index, 'auto');
    }
  }, [mediaMode, selectedMediaItemId, studyInteracted, studyStreamEntries, studyStreamIndex]);

  useEffect(() => {
    if (mediaMode !== 'study_stream') return;
    const activeId = highlightedStream?.entry.id || null;
    if (!activeId) return;
    if (selectedMediaItemId === activeId) return;
    if (studySelectionSyncRef.current != null) {
      window.clearTimeout(studySelectionSyncRef.current);
      studySelectionSyncRef.current = null;
    }
    studySelectionSyncRef.current = window.setTimeout(() => {
      studySelectionSyncRef.current = null;
      onSelectMediaItem(activeId);
    }, 90);
    return () => {
      if (studySelectionSyncRef.current != null) {
        window.clearTimeout(studySelectionSyncRef.current);
        studySelectionSyncRef.current = null;
      }
    };
  }, [highlightedStream?.entry.id, mediaMode, onSelectMediaItem, selectedMediaItemId]);

  useEffect(() => {
    const preloadEntries = [studyStreamEntries[studyStreamIndex + 1], studyStreamEntries[studyStreamIndex + 2]]
      .filter(Boolean)
      .map((entry) => entry.entry);
    preloadEntries.forEach((entry) => {
      const imageSrc = entry.imageUrl || entry.thumbnailUrl;
      if (imageSrc && typeof window !== 'undefined') {
        const img = new Image();
        img.src = imageSrc;
      }
      if (entry.audioUrl && typeof window !== 'undefined') {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = entry.audioUrl;
      }
    });
  }, [studyStreamEntries, studyStreamIndex]);

  const creativeDeckResult = useMemo(() => {
    const sourceProfiles: Record<
      CreativeStreamCard['sourceType'],
      {
        label: string;
        trustScore: number;
        learningType: CreativeStreamCard['learningType'];
        why: string;
        minutes: number;
        urlFactory: (topic: string) => string;
      }
    > = {
      youtube: {
        label: 'YouTube',
        trustScore: 0.82,
        learningType: 'quick_intuition',
        why: 'Primary discovery source for high-coverage educational explainers.',
        minutes: 3,
        urlFactory: (topic) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} educational explainer`)}`,
      },
      vimeo: {
        label: 'Vimeo',
        trustScore: 0.76,
        learningType: 'concept_recap',
        why: 'Secondary source for alternative educational explanation styles.',
        minutes: 4,
        urlFactory: (topic) => `https://vimeo.com/search?q=${encodeURIComponent(`${topic} educational`)}`,
      },
    };

    const sourceTypeLabel: Record<CreativeStreamCard['sourceType'], string> = {
      youtube: sourceProfiles.youtube.label,
      vimeo: sourceProfiles.vimeo.label,
    };

    const toLearningType = (entry: MediaWorkspaceEntry): CreativeStreamCard['learningType'] => {
      if (entry.mediaKind === 'video') return mediaPreferences.shortFormSupport === 'worked_example' ? 'worked_example' : 'quick_intuition';
      if (entry.mediaKind === 'image') return 'visual_explanation';
      if (entry.mediaKind === 'audio') return 'concept_recap';
      return 'concept_recap';
    };

    const preferenceBoostForCard = (
      learningType: CreativeStreamCard['learningType'],
      mediaType: FullscreenMediaFilter
    ) => {
      let boost = 0;
      if (mediaPreferences.shortFormSupport === 'worked_example' && learningType === 'worked_example') boost += 18;
      if (mediaPreferences.shortFormSupport === 'quick_recap' && learningType === 'concept_recap') boost += 16;
      if (mediaPreferences.shortFormSupport === 'concept_intuition' && learningType === 'quick_intuition') boost += 16;
      if (mediaPreferences.preferredRecapType === 'audio' && mediaType === 'audio') boost += 14;
      if (mediaPreferences.preferredRecapType === 'video' && mediaType === 'video') boost += 14;
      if (mediaPreferences.preferredRecapType === 'visual' && mediaType === 'image') boost += 14;
      return boost;
    };

    const streamCards: CreativeDeckCandidate[] = activeStreamEntries
      .filter((item) => item.entry.mediaKind === 'video')
      .flatMap((item, index) => {
        const entry = item.entry;
        const metadata = (entry.asset?.metadata || {}) as Record<string, unknown>;
        const sourceType = resolveCreativeContractSourceType({
          videoProvider: entry.videoProvider || entry.asset?.videoProvider || null,
          sourceUrl: entry.sourceUrl || null,
          metadata,
        });
        if (!sourceType) return [];
        const sourceProfile = sourceProfiles[sourceType];
        const learningType = toLearningType(entry);
        const creativeRole = resolveCreativeContractRole(metadata);
        const interaction = parseCreativeContractInteraction(metadata);
        const transcriptSignal = Boolean(
          entry.asset?.transcript ||
            entry.asset?.transcriptSnippet ||
            metadata.transcriptAvailable === true ||
            metadata.transcriptScored === true
        );
        const weakMatch = matchesWeakTopic(entry.topic || entry.title, entry.subject);
        const helpful = entry.asset?.isHelpful === true;
        const unfinished = entry.asset?.isCompleted !== true;
        const revisionLinked = Boolean(entry.revisionItemId || entry.revisionItem);
        const lastTouch =
          entry.asset?.lastReviewedAt || entry.asset?.lastPlayedAt || entry.asset?.lastOpenedAt || entry.createdAt || null;
        let freshnessBoost = 0;
        if (lastTouch) {
          const ageDays = Math.max(0, (Date.now() - new Date(lastTouch).getTime()) / 86_400_000);
          if (ageDays >= 1 && ageDays <= 7) freshnessBoost += 8;
          else if (ageDays > 7 && ageDays <= 28) freshnessBoost += 10;
          else if (ageDays < 0.35) freshnessBoost -= 10;
        }
        if (helpful) freshnessBoost += 3;
        const clarityScore =
          typeof metadata.clarityScore === 'number'
            ? metadata.clarityScore
            : entry.keyIdea || entry.summary
              ? 0.86
              : 0.58;
        const sourceTrustScore = sourceProfile.trustScore;
        const creativityScore = Number(metadata.creativityScore || 0);
        const intuitionScore = Number(metadata.intuitionScore || 0);
        const noveltyScore = Number(metadata.noveltyScore || 0);
        const estimatedMinutes = entry.durationSec ? Math.max(1, Math.round(entry.durationSec / 60)) : 4;
        const durationFit = modeFlags?.focus ? (estimatedMinutes <= 4 ? 'short' : 'balanced') : estimatedMinutes <= 8 ? 'short' : 'balanced';
        const engineMode = resolveCreativeEngineMode({
          topic: entry.topic,
          title: entry.title,
          learningType,
          weakAssist: weakMatch,
          helpful,
          revisionLinked,
          transcriptSignal,
          mediaType: entry.mediaKind,
          previewEntry: entry,
          reason: item.reason,
          nextMove: item.nextMove,
          quickCheck: item.quickCheck,
        });
        const resolvedEngineMode =
          creativeRole === 'transfer'
            ? 'transfer'
            : creativeRole === 'deepen'
              ? 'logic'
              : creativeRole === 'reframe'
                ? 'remix'
                : creativeRole === 'notice'
                  ? 'spark'
                  : engineMode;
        const continuityKey = normalizeMediaLabel(entry.topic || entry.subtopic || entry.title);
        const score =
          Number(item.rankScore || 0) +
          Math.round(preferenceBoostForCard(learningType, entry.mediaKind) * 0.45) +
          Math.round(freshnessBoost * 0.45) +
          (transcriptSignal ? 4 : 0) +
          (weakMatch ? 6 : 0) +
          (helpful ? 3 : 0) +
          (unfinished ? 2 : -1) +
          (revisionLinked ? 2 : 0) +
          Math.round(sourceTrustScore * 3) +
          Math.round(clarityScore * 2) +
          Math.round(Number.isFinite(creativityScore) ? creativityScore * 3 : 0) +
          Math.round(Number.isFinite(intuitionScore) ? intuitionScore * 3 : 0) +
          Math.round(Number.isFinite(noveltyScore) ? noveltyScore * 2 : 0) -
          index;
        const whyHelps =
          (typeof metadata.learningGoal === 'string' && metadata.learningGoal.trim()) ||
          entry.keyIdea ||
          item.reason ||
          'Directly linked to your saved revision and weak-topic signals.';
        const storyHook = buildCreativeStoryHook({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          whyHelps,
          reason: item.reason,
        });
        const sparkLine = buildCreativeSparkLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          learningType,
          whyHelps,
        });
        const reflectionLine = buildCreativeReflectionLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          quickCheck: item.quickCheck,
        });
        const metacognitionLine = buildCreativeMetacognitionLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          reason: item.reason,
          weakAssist: weakMatch,
        });
        const creationLine = buildCreativeCreationLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          nextMove: item.nextMove,
        });
        const transferLine = buildCreativeTransferLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
        });
        const selfCheckLine = buildCreativeSelfCheckLine({
          topic: entry.topic,
          title: entry.title,
          previewEntry: entry,
          quickCheck: item.quickCheck,
        });
        const pulseLabel = resolveCreativePulseLabel({ weakAssist: weakMatch, learningType, sourceType, engineMode });
        const roleLabel =
          creativeRole === 'reframe'
            ? 'Reframe'
            : creativeRole === 'notice'
              ? 'Notice'
              : creativeRole === 'transfer'
                ? 'Transfer'
                : creativeRole === 'deepen'
                  ? 'Deepen'
                  : 'Spark';
        const trustLabel = resolveCreativeContractTrustLabel({ sourceType, metadata });
        const availableActions = [...(interaction?.secondaryActions || [])].slice(0, 3);

        const card: CreativeDeckCandidate = {
          id: `stream-${entry.id}`,
          sourceType,
          title: entry.title,
          subject: entry.subject,
          topic: entry.topic,
          whyHelps,
          learningType,
          estimatedMinutes,
          mediaType: entry.mediaKind,
          oneThingToNotice: sparkLine,
          nextMove: creationLine,
          captionReady: transcriptSignal,
          sourceTrustScore,
          clarityScore,
          durationFit,
          trustLabel,
          sourceLabel: sourceTypeLabel[sourceType],
          sourceUrl: entry.sourceUrl || null,
          previewEntry: entry,
          reason: item.reason || sourceProfile.why,
          interaction,
          availableActions,
          storyHook,
          sparkLine,
          reflectionLine,
          metacognitionLine,
          creationLine,
          transferLine,
          selfCheckLine,
          pulseLabel: roleLabel,
          engineMode: resolvedEngineMode,
          creativeRole,
          __score: score,
          __generated: false,
          __continuityKey: continuityKey || normalizeMediaLabel(entry.title),
          __freshnessBoost: freshnessBoost,
        };

        return [card];
      });

    return {
      cards: curateCreativeDeck(streamCards, Math.min(Math.max(8, creativeDeckTargetCount), Math.max(8, streamCards.length))),
      generatedCacheCards: [],
    };
  }, [
    activeStreamEntries,
    baseCreativeDeckTargetCount,
    creativeDeckCacheVersion,
    creativeDeckTargetCount,
    creativeOrbitCacheKey,
    matchesWeakTopic,
    mediaPreferences,
    modeFlags?.focus,
    weakTopicHints,
  ]);
  const creativeCards = creativeDeckResult.cards;

  useEffect(() => {
    if (typeof window === 'undefined' || !creativeOrbitCacheKey) return;
    const nextRecord = Object.fromEntries(
      Object.entries({
        ...creativeDeckCacheRef.current,
        [creativeOrbitCacheKey]: {
          ts: Date.now(),
          cards: creativeDeckResult.generatedCacheCards,
        },
      })
        .sort((a, b) => ((b[1] as CreativeGeneratedDeckCacheEntry)?.ts || 0) - ((a[1] as CreativeGeneratedDeckCacheEntry)?.ts || 0))
        .slice(0, CREATIVE_ENGINE_CACHE_MAX_KEYS)
    ) as Record<string, CreativeGeneratedDeckCacheEntry>;
    creativeDeckCacheRef.current = nextRecord;
    try {
      window.sessionStorage.setItem(CREATIVE_ENGINE_CACHE_STORAGE_KEY, JSON.stringify(nextRecord));
    } catch {
      // ignore session storage failures
    }
  }, [creativeDeckResult.generatedCacheCards, creativeOrbitCacheKey]);

  useEffect(() => {
    if (creativeCards.length === 0) {
      setCreativeStreamIndex(0);
      return;
    }
    setCreativeStreamIndex((prev) => Math.max(0, Math.min(prev, creativeCards.length - 1)));
  }, [creativeCards.length]);

  useEffect(() => {
    setCreativeDeckDepth((prev) => Math.max(prev, creativeStreamIndex));
  }, [creativeStreamIndex]);

  useEffect(() => {
    if (didRestoreCreativeIndexRef.current || creativeCards.length === 0) return;
    if (typeof window === 'undefined') return;
    didRestoreCreativeIndexRef.current = true;
    const savedCardId = window.sessionStorage.getItem('steadfast.media.creative.activeCardId');
    if (!savedCardId) return;
    const savedIndex = creativeCards.findIndex((card) => card.id === savedCardId);
    if (savedIndex >= 0) {
      setCreativeStreamIndex(savedIndex);
      window.requestAnimationFrame(() => {
        scrollCreativeToIndex(savedIndex, 'auto');
      });
    }
  }, [creativeCards]);

  const highlightedCreativeCard = creativeCards[creativeStreamIndex] || creativeCards[0] || null;
  const nextCreativeCard = creativeCards[creativeStreamIndex + 1] || null;
  const activeCreativeTone = resolveStreamTone(highlightedCreativeCard?.subject);
  const activeCreativeWeakAssist = highlightedCreativeCard
    ? matchesWeakTopic(highlightedCreativeCard.topic || highlightedCreativeCard.title, highlightedCreativeCard.subject)
    : false;
  const highlightedCreativeStoryHook = highlightedCreativeCard?.storyHook || 'Creative discovery should make the idea feel more alive, not noisier.';
  const highlightedCreativeMetacognitionLine =
    highlightedCreativeCard?.metacognitionLine || 'Notice whether you understand the reason, the rule, or only the answer.';
  const highlightedCreativeTransferLine =
    highlightedCreativeCard?.transferLine || 'Find one new place where the same pattern shows up.';
  const highlightedCreativeSelfCheckLine =
    highlightedCreativeCard?.selfCheckLine || 'Explain the idea in one sentence without notes.';
  const highlightedCreativePulseLabel = highlightedCreativeCard?.pulseLabel || 'Thought engine';
  const highlightedCreativeModeSignature = highlightedCreativeCard
    ? resolveCreativeModeSignature(highlightedCreativeCard, activeCreativeWeakAssist)
    : {
        heroLabel: 'Creative lab',
        primaryLabel: 'Open thought lab',
        secondaryLabel: 'Reflect on logic',
        secondaryAction: 'reflect' as const,
        secondaryLiveLabel: 'Reflection live',
        footerLabel: 'Next leap',
        footerValue: highlightedCreativeTransferLine,
      };
  const highlightedCreativeMomentCards = highlightedCreativeCard
    ? buildCreativeMomentCards({ card: highlightedCreativeCard, weakAssist: activeCreativeWeakAssist })
    : [];
  const highlightedCreativeAnchorLine = highlightedCreativeCard
    ? buildCreativeAnchorLine(highlightedCreativeCard)
    : 'Keep the one angle that makes the idea easier to imagine.';
  const highlightedCreativeFooterLabel = highlightedCreativeModeSignature.footerLabel;
  const highlightedCreativeFooterValue = highlightedCreativeModeSignature.footerValue;
  const highlightedCreativePreviewEntry = highlightedCreativeCard?.previewEntry || null;
  const highlightedCreativeSourceActive = Boolean(
    highlightedCreativePreviewEntry && activeSourceEntry && activeSourceEntry.id === highlightedCreativePreviewEntry.id
  );
  const highlightedCreativeSourcePinned = Boolean(
    highlightedCreativePreviewEntry && pinnedSourceEntry && pinnedSourceEntry.id === highlightedCreativePreviewEntry.id
  );
  const highlightedCreativeOrbitSteps = highlightedCreativeMomentCards.map((moment, index) => {
    const variant = resolveCreativeVariantFromLabel(moment.label);
    const stepId = `${moment.id}:${variant}:${index}`;
    return {
      ...moment,
      variant,
      stepId,
    };
  });
  const highlightedCreativeOrbitStepIndex = highlightedCreativeCard
    ? Math.max(
        0,
        Math.min(
          creativeOrbitStepByCardId[highlightedCreativeCard.id] || 0,
          Math.max(0, highlightedCreativeOrbitSteps.length - 1)
        )
      )
    : 0;
  const highlightedCreativeOrbitStep = highlightedCreativeOrbitSteps[highlightedCreativeOrbitStepIndex] || null;
  const highlightedCreativeCompletedStepIds = highlightedCreativeCard
    ? creativeOrbitCompletedByCardId[highlightedCreativeCard.id] || []
    : [];
  const highlightedCreativeCompletedCount = highlightedCreativeCompletedStepIds.length;
  const highlightedCreativeOrbitStepKey = highlightedCreativeOrbitStep?.stepId || 'orbit-step-fallback';
  const upcomingCreativeQueueEntries = creativeCards.slice(
    creativeStreamIndex + 1,
    Math.min(creativeCards.length, creativeStreamIndex + 6)
  );
  const activeImmersiveTone = mediaMode === 'creative_stream' ? activeCreativeTone : activeStudyTone;

  useEffect(() => {
    if (!highlightedCreativeCard) return;
    setCreativeOrbitStepByCardId((prev) => {
      const next = prev[highlightedCreativeCard.id] || 0;
      const clamped = Math.max(0, Math.min(next, Math.max(0, highlightedCreativeOrbitSteps.length - 1)));
      if (next === clamped) return prev;
      return { ...prev, [highlightedCreativeCard.id]: clamped };
    });
  }, [highlightedCreativeCard, highlightedCreativeOrbitSteps.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeId = highlightedCreativeCard?.id;
    if (!activeId) return;
    window.sessionStorage.setItem('steadfast.media.creative.activeCardId', activeId);
  }, [highlightedCreativeCard?.id]);

  useEffect(() => {
    if (mediaMode !== 'creative_stream') return;
    const previewId = highlightedCreativeCard?.previewEntry?.id || null;
    if (!previewId) return;
    if (selectedMediaItemId === previewId) return;
    if (creativeSelectionSyncRef.current != null) {
      window.clearTimeout(creativeSelectionSyncRef.current);
      creativeSelectionSyncRef.current = null;
    }
    creativeSelectionSyncRef.current = window.setTimeout(() => {
      creativeSelectionSyncRef.current = null;
      onSelectMediaItem(previewId);
    }, 90);
    return () => {
      if (creativeSelectionSyncRef.current != null) {
        window.clearTimeout(creativeSelectionSyncRef.current);
        creativeSelectionSyncRef.current = null;
      }
    };
  }, [highlightedCreativeCard?.previewEntry?.id, mediaMode, onSelectMediaItem, selectedMediaItemId]);

  useEffect(() => {
    const preload = [creativeCards[creativeStreamIndex + 1], creativeCards[creativeStreamIndex + 2]].filter(Boolean);
    preload.forEach((card) => {
      const imageSrc = card.previewEntry?.imageUrl || card.previewEntry?.thumbnailUrl || null;
      if (imageSrc && typeof window !== 'undefined') {
        const img = new Image();
        img.src = imageSrc;
      }
    });
  }, [creativeCards, creativeStreamIndex]);

  const syncIndexFromScroll = (
    viewport: HTMLDivElement | null,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    dataAttribute: 'data-study-index' | 'data-creative-index',
    programmaticSyncUntilRef: React.MutableRefObject<number>,
    hysteresisPx: number
  ) => {
    if (!viewport) return;
    if (Date.now() < programmaticSyncUntilRef.current) return;
    const selector = dataAttribute === 'data-study-index' ? '[data-study-index]' : '[data-creative-index]';
    const cards = [...viewport.querySelectorAll<HTMLElement>(selector)];
    if (!cards.length) return;
    const viewportCenter = viewport.scrollTop + viewport.clientHeight * 0.5;
    let nearest = 0;
    let nearestDelta = Number.POSITIVE_INFINITY;
    cards.forEach((card) => {
      const candidate = Number(card.dataset[dataAttribute === 'data-study-index' ? 'studyIndex' : 'creativeIndex'] || 0);
      const cardCenter = card.offsetTop + card.offsetHeight * 0.5;
      const delta = Math.abs(cardCenter - viewportCenter);
      if (delta < nearestDelta) {
        nearest = candidate;
        nearestDelta = delta;
      }
    });
    const key = dataAttribute === 'data-study-index' ? 'studyIndex' : 'creativeIndex';
    setIndex((prev) => {
      if (prev === nearest) return prev;
      const currentCard = cards.find((card) => Number(card.dataset[key] || -1) === prev);
      if (!currentCard) return nearest;
      const currentCenter = currentCard.offsetTop + currentCard.offsetHeight * 0.5;
      const currentDelta = Math.abs(currentCenter - viewportCenter);
      if (nearestDelta + hysteresisPx >= currentDelta) {
        return prev;
      }
      return nearest;
    });
  };

  const scheduleIndexSyncFromScroll = (
    viewport: HTMLDivElement | null,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    dataAttribute: 'data-study-index' | 'data-creative-index',
    rafRef: React.MutableRefObject<number | null>,
    programmaticSyncUntilRef: React.MutableRefObject<number>,
    hysteresisPx: number
  ) => {
    if (!viewport) return;
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncIndexFromScroll(viewport, setIndex, dataAttribute, programmaticSyncUntilRef, hysteresisPx);
    });
  };

  const handleWheelCardStep = (
    event: React.WheelEvent<HTMLDivElement>,
    args: {
      index: number;
      count: number;
      lockRef: React.MutableRefObject<boolean>;
      deltaRef: React.MutableRefObject<number>;
      resetRef: React.MutableRefObject<number | null>;
      stepConsumedRef?: React.MutableRefObject<boolean>;
      move: (nextIndex: number) => void;
      onInteract?: () => void;
      thresholdPx: number;
      resetMs: number;
      lockMs: number;
    }
  ) => {
    if (args.count <= 1) return;
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const deltaScale =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? Math.max(360, event.currentTarget.clientHeight) : 1;
    const normalizedDelta = event.deltaY * deltaScale;
    if (Math.abs(normalizedDelta) < 2) return;
    event.preventDefault();
    args.onInteract?.();
    args.deltaRef.current += normalizedDelta;
    if (args.resetRef.current != null) {
      window.clearTimeout(args.resetRef.current);
      args.resetRef.current = null;
    }
    args.resetRef.current = window.setTimeout(() => {
      args.deltaRef.current = 0;
      if (args.stepConsumedRef) args.stepConsumedRef.current = false;
      args.resetRef.current = null;
    }, args.resetMs);
    if (Math.abs(args.deltaRef.current) < args.thresholdPx) return;
    if (args.stepConsumedRef?.current) return;
    if (args.lockRef.current) return;
    args.lockRef.current = true;
    if (args.stepConsumedRef) args.stepConsumedRef.current = true;
    const direction = args.deltaRef.current > 0 ? 1 : -1;
    args.deltaRef.current = 0;
    args.move(args.index + direction);
    window.setTimeout(() => {
      args.lockRef.current = false;
    }, args.lockMs);
  };

  const resolveMediaScrollBehavior = (behavior: ScrollBehavior = 'smooth'): 'auto' | 'smooth' => {
    if (behavior !== 'smooth') return 'auto';
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  };

  const scrollStudyToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!studyStreamEntries.length) return;
    const clamped = Math.max(0, Math.min(index, studyStreamEntries.length - 1));
    if (clamped !== studyStreamIndex) {
      setStudyTransitionDirection(clamped > studyStreamIndex ? 1 : -1);
    }
    const viewport = studyStreamViewportRef.current;
    const target = viewport?.querySelector<HTMLElement>(`[data-study-index="${clamped}"]`) || null;
    setStudyStreamIndex((prev) => (prev === clamped ? prev : clamped));
    // STRICT: do not swap this back to scrollIntoView. In Media, that lets the
    // browser promote the shared workspace shell into the scroll owner and the
    // bottom-gap bug follows users into the next route.
    const resolvedBehavior = resolveMediaScrollBehavior(behavior);
    studyProgrammaticSyncUntilRef.current = Date.now() + (resolvedBehavior === 'smooth' ? streamInteractionMatrix.scrollSyncLockMs : 120);
    scrollMediaOwnerToAnchor({
      mode: studyStreamUsesPageScroll ? 'flow' : 'stage',
      workspace: mediaWorkspaceScrollRef.current,
      viewport,
      target,
      behavior: resolvedBehavior,
    });
  };

  const scrollCreativeToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!creativeCards.length) return;
    const clamped = Math.max(0, Math.min(index, creativeCards.length - 1));
    if (clamped !== creativeStreamIndex) {
      setCreativeTransitionDirection(clamped > creativeStreamIndex ? 1 : -1);
    }
    const viewport = creativeStreamViewportRef.current;
    const target = viewport?.querySelector<HTMLElement>(`[data-creative-index="${clamped}"]`) || null;
    setCreativeStreamIndex((prev) => (prev === clamped ? prev : clamped));
    const resolvedBehavior = resolveMediaScrollBehavior(behavior);
    creativeProgrammaticSyncUntilRef.current = Date.now() + (resolvedBehavior === 'smooth' ? streamInteractionMatrix.scrollSyncLockMs : 120);
    scrollMediaOwnerToAnchor({
      mode: 'stage',
      workspace: mediaWorkspaceScrollRef.current,
      viewport,
      target,
      behavior: resolvedBehavior,
    });
  };

  useEffect(() => {
    return () => {
      resetMediaScrollContract({
        workspace: mediaWorkspaceScrollRef.current,
        viewport: studyStreamViewportRef.current,
      });
      resetMediaScrollContract({ viewport: creativeStreamViewportRef.current });
      if (studyScrollRafRef.current != null) {
        window.cancelAnimationFrame(studyScrollRafRef.current);
        studyScrollRafRef.current = null;
      }
      if (creativeScrollRafRef.current != null) {
        window.cancelAnimationFrame(creativeScrollRafRef.current);
        creativeScrollRafRef.current = null;
      }
      if (studyWheelResetRef.current != null) {
        window.clearTimeout(studyWheelResetRef.current);
        studyWheelResetRef.current = null;
      }
      studyWheelStepConsumedRef.current = false;
      if (creativeWheelResetRef.current != null) {
        window.clearTimeout(creativeWheelResetRef.current);
        creativeWheelResetRef.current = null;
      }
      creativeWheelStepConsumedRef.current = false;
      if (studySelectionSyncRef.current != null) {
        window.clearTimeout(studySelectionSyncRef.current);
        studySelectionSyncRef.current = null;
      }
      if (creativeSelectionSyncRef.current != null) {
        window.clearTimeout(creativeSelectionSyncRef.current);
        creativeSelectionSyncRef.current = null;
      }
      if (inlineActionAutoCheckRef.current != null) {
        window.clearTimeout(inlineActionAutoCheckRef.current);
        inlineActionAutoCheckRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (inlineActionAutoCheckRef.current != null) {
      window.clearTimeout(inlineActionAutoCheckRef.current);
      inlineActionAutoCheckRef.current = null;
    }
    if (!mediaInlineAction) return;
    const armAutoCheck = (draft: string, hasFeedback: boolean, lockedIn: boolean, evaluator: () => void) => {
      const normalized = draft.trim();
      if (!normalized || hasFeedback || lockedIn) return;
      const wordCount = normalized.split(/\s+/).filter(Boolean).length;
      if (wordCount < 2) return;
      inlineActionAutoCheckRef.current = window.setTimeout(() => {
        inlineActionAutoCheckRef.current = null;
        evaluator();
      }, 520);
    };
    if (mediaInlineAction.kind === 'quick_challenge') {
      armAutoCheck(
        mediaInlineAction.draft,
        Boolean(mediaInlineAction.feedback),
        mediaInlineAction.lockedIn,
        evaluateActiveQuickChallenge
      );
      return;
    }
    if (mediaInlineAction.kind === 'creative_lab') {
      armAutoCheck(
        mediaInlineAction.draft,
        Boolean(mediaInlineAction.feedback),
        mediaInlineAction.lockedIn,
        evaluateActiveCreativeLab
      );
      return;
    }
  }, [mediaInlineAction, evaluateActiveCreativeLab, evaluateActiveQuickChallenge]);

  const isImmersiveMediaStream = mediaMode === 'study_stream' || mediaMode === 'creative_stream';
  const isCollectionsCategoryActive = mediaMode === 'library' && libraryCategory === 'collections';
  const openedCollection = useMemo(
    () => collectionEntries.find((collection) => collection.id === openedCollectionId) || null,
    [collectionEntries, openedCollectionId]
  );
  const selectedLibraryCoachContext = useMemo(
    () => (effectiveSelectedMediaItem ? buildStudyCoachContext({ entry: effectiveSelectedMediaItem }) : null),
    [effectiveSelectedMediaItem]
  );
  const spotlightSourceIsActive = Boolean(
    effectiveSelectedMediaItem && activeSourceEntry && activeSourceEntry.id === effectiveSelectedMediaItem.id
  );
  const spotlightSourceIsPinned = Boolean(
    effectiveSelectedMediaItem && pinnedSourceEntry && pinnedSourceEntry.id === effectiveSelectedMediaItem.id
  );
  const mediaHeader = useMemo(() => {
    if (mediaMode === 'study_stream') {
      return {
        eyebrow: 'Focused learning lane',
        title: 'Study Stream',
        description: 'One card at a time for calm study, stronger recall, and a clear next move.',
      };
    }
    if (mediaMode === 'creative_stream') {
      return {
        eyebrow: 'Creative lane',
        title: 'Creative Stream',
        description: 'Fresh angles that build intuition, remix ideas, and open new ways of understanding.',
      };
    }
    return {
      eyebrow: 'Media library',
      title: 'Library',
      description: 'All media files stay organized here, with collections grouped in their own category for structured study.',
    };
  }, [mediaMode]);

  return (
      <div
        ref={mediaWorkspaceScrollRef}
        className={cn(
          'copilot-workspace-scroll copilot-media-workspace',
          isImmersiveMediaStream && 'copilot-media-stream-shell',
          isImmersiveMediaStream && 'copilot-media-myth-workspace'
        )}
        data-stream-tone={isImmersiveMediaStream ? activeImmersiveTone : undefined}
        data-stream-tier={isImmersiveMediaStream ? streamInteractionMatrix.viewportTier : undefined}
        data-stream-pointer={isImmersiveMediaStream ? streamInteractionMatrix.pointer : undefined}
        data-stream-window={isImmersiveMediaStream ? effectiveStreamWindowMode : undefined}
        data-study-layout={mediaMode === 'study_stream' && studyStreamUsesPageScroll ? 'flow' : undefined}
      >
        <div
          className={cn(
            'copilot-workspace-container',
            isImmersiveMediaStream ? 'copilot-media-stream-container flex min-h-0 flex-1 flex-col space-y-3' : 'space-y-4',
            mediaMode === 'study_stream' && 'copilot-media-stream-container-study'
          )}
        >
        <section
          className={cn(
            'copilot-workspace-panel copilot-hover-reveal-group px-5 py-4',
            isImmersiveMediaStream && 'copilot-media-stream-toolbar copilot-media-stream-toolbar-compact',
            isImmersiveMediaStream && 'copilot-media-myth-toolbar'
          )}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">
                {mediaHeader.title}
              </h2>
            </div>
            <div className="copilot-media-myth-mode-switcher" aria-label="Media modes">
              {([
                { id: 'study_stream', label: 'Study', icon: PlayCircle },
                { id: 'creative_stream', label: 'Creative', icon: Sparkles },
                { id: 'library', label: 'Library', icon: BookMarked },
              ] as Array<{ id: MediaWorkspaceMode; label: string; icon: typeof PlayCircle }>).map((mode) => {
                const Icon = mode.icon;
                const modeActive = mediaMode === mode.id;
                const modeLoading =
                  mode.id === 'library'
                    ? isMediaAssetsLoading || isMediaCollectionsLoading
                    : isMediaStreamLoading;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onMediaModeChange(mode.id)}
                    className="copilot-media-myth-mode-pill"
                    data-active={modeActive ? 'true' : 'false'}
                    aria-pressed={modeActive}
                    aria-busy={modeLoading && !modeActive}
                    disabled={modeLoading && !modeActive}
                  >
                    <span className="copilot-media-myth-mode-pill-icon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="copilot-media-myth-mode-pill-copy">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!isImmersiveMediaStream && mediaMode === 'library' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {([
                { id: 'all', label: `All (${mediaEntries.length})` },
                { id: 'audio', label: `Audio (${counts.audio})` },
                { id: 'video', label: `Video (${counts.video})` },
                { id: 'image', label: `Image (${counts.image})` },
                { id: 'document', label: `Docs (${counts.doc})` },
                { id: 'collections', label: `Collections (${collectionEntries.length})` },
              ] as Array<{ id: MediaLibraryCategory; label: string }>).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => selectLibraryCategory(filter.id)}
                  className={`copilot-revision-pill ${libraryCategory === filter.id ? 'copilot-revision-pill-active' : ''}`}
                  disabled={
                    filter.id === 'collections'
                      ? isMediaCollectionsLoading
                      : isMediaAssetsLoading
                  }
                  aria-busy={filter.id === 'collections' ? isMediaCollectionsLoading : isMediaAssetsLoading}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : isImmersiveMediaStream && mediaStreamError ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="copilot-revision-pill">Stream needs a refresh</span>
              <Button
                type="button"
                variant="ghost"
                className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                onClick={onRetryMediaStreamLoad}
                disabled={isMediaStreamLoading || !onRetryMediaStreamLoad}
                aria-busy={isMediaStreamLoading}
              >
                {isMediaStreamLoading ? 'Retrying stream...' : 'Retry stream'}
              </Button>
            </div>
          ) : null}
        </section>

        {mediaInlineAction ? (
          <section
            className="copilot-next-move-panel copilot-inline-action-shell px-3 py-3 md:px-4 md:py-3.5"
            data-inline-kind={mediaInlineAction.kind}
          >
            {mediaInlineAction.kind === 'quick_challenge' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                      {mediaInlineAction.variant === 'recall' ? 'Fast recall check' : 'In-page quick challenge'}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                      {mediaInlineAction.variant === 'recall'
                        ? `Recall ${studyTopicLabel(mediaInlineAction.context.entry)} from memory`
                        : `Quick challenge for ${studyTopicLabel(mediaInlineAction.context.entry)}`}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      Answer once, get fast feedback, then keep one anchor and move on.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'quick_challenge'
                            ? { ...current, revealHint: !current.revealHint }
                            : current
                        )
                      }
                      aria-pressed={mediaInlineAction.revealHint}
                    >
                      {mediaInlineAction.revealHint ? 'Hide hint' : 'Need a hint?'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                      onClick={() => setMediaInlineAction(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <div
                  className={cn(
                    'grid gap-3',
                    (mediaInlineAction.feedback || mediaInlineAction.revealHint || mediaInlineAction.revealAnchor) &&
                      'lg:grid-cols-[minmax(0,1fr)_17rem]'
                  )}
                >
                  <div className="copilot-media-myth-anchor">
                    <p className="copilot-media-myth-story-label">
                      {mediaInlineAction.variant === 'recall' ? 'From memory' : 'Question'}
                    </p>
                    <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                      {mediaInlineAction.prompt}
                    </p>
                  </div>
                  {mediaInlineAction.feedback || mediaInlineAction.revealHint || mediaInlineAction.revealAnchor ? (
                    <div className="grid gap-3">
                      {mediaInlineAction.feedback ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Feedback</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.feedback.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.feedback.body}
                          </p>
                          {!challengeLinesEquivalent(
                            mediaInlineAction.feedback.nextStep,
                            mediaInlineAction.feedback.body
                          ) &&
                          !challengeLinesEquivalent(
                            mediaInlineAction.feedback.nextStep,
                            mediaInlineAction.feedback.hint || mediaInlineAction.context.focusLine
                          ) ? (
                            <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              Next move: {mediaInlineAction.feedback.nextStep}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      {mediaInlineAction.revealHint &&
                      !challengeLinesEquivalent(
                        mediaInlineAction.feedback?.hint || mediaInlineAction.context.focusLine,
                        mediaInlineAction.feedback?.body
                      ) ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">One clue</p>
                          <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.feedback?.hint || mediaInlineAction.context.focusLine}
                          </p>
                        </div>
                      ) : null}
                      {mediaInlineAction.revealAnchor ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Keep this anchor</p>
                          <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.context.anchorLine}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label className="block min-w-0">
                    <span className="copilot-media-myth-story-label">Your answer</span>
                    <textarea
                      value={mediaInlineAction.draft}
                      onChange={(event) =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'quick_challenge'
                            ? {
                                ...current,
                                draft: event.target.value,
                                feedback: null,
                                lockedIn: false,
                              }
                            : current
                        )
                      }
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                          event.preventDefault();
                          evaluateActiveQuickChallenge();
                        }
                      }}
                      placeholder="Write a short answer first. The system will respond with one clear piece of feedback."
                      className="copilot-inline-action-textarea mt-2 min-h-[88px] w-full rounded-[1rem] border border-[var(--copilot-soft-line)] bg-white/85 px-3 py-3 text-sm leading-6 text-[var(--copilot-text-primary)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-[var(--copilot-action-primary)] focus:ring-2 focus:ring-[var(--copilot-action-primary)]/15"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="copilot-control-commit h-9 rounded-full px-3 text-xs"
                      onClick={evaluateActiveQuickChallenge}
                      disabled={!mediaInlineAction.draft.trim()}
                    >
                      {mediaInlineAction.feedback ? 'Check again' : 'Check answer'}
                    </Button>
                    {mediaInlineAction.feedback?.canLock ? (
                      <Button
                        type="button"
                      variant="outline"
                      className="copilot-control-nav h-9 rounded-full px-3 text-xs"
                      onClick={keepActiveQuickChallengeAnchor}
                      disabled={mediaInlineAction.lockedIn}
                    >
                      {mediaInlineAction.lockedIn ? 'Anchor kept' : 'Keep anchor'}
                    </Button>
                  ) : null}
                  </div>
                </div>
                {mediaInlineAction.lockedIn ? (
                  <p className="copilot-media-myth-panel-note">
                    Anchor saved in this Media surface. Next quick move: {mediaInlineAction.feedback?.nextStep || mediaInlineAction.context.followUpCheck || mediaInlineAction.context.unlockLine}
                  </p>
                ) : null}
              </div>
            ) : mediaInlineAction.kind === 'creative_lab' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                      {mediaInlineAction.variant === 'reflect'
                        ? 'Creative reflection lab'
                        : mediaInlineAction.variant === 'story'
                          ? 'Creative story lab'
                          : mediaInlineAction.variant === 'transfer'
                            ? 'Creative transfer lab'
                            : mediaInlineAction.variant === 'remix'
                              ? 'Creative remix lab'
                              : 'Creative spark lab'}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                      {mediaInlineAction.cardTitle}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      One fast thought cycle: respond, get feedback, keep one anchor, then move to the next angle.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'creative_lab'
                            ? { ...current, revealHint: !current.revealHint }
                            : current
                        )
                      }
                      aria-pressed={mediaInlineAction.revealHint}
                    >
                      {mediaInlineAction.revealHint ? 'Hide cue' : 'Need a cue?'}
                    </Button>
                    {mediaInlineAction.sourceEntry ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                        onClick={() => openChallengeFromSource(mediaInlineAction.sourceEntry!)}
                      >
                        Challenge source
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                      onClick={() => setMediaInlineAction(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <div
                  className={cn(
                    'grid gap-3',
                    (mediaInlineAction.feedback || mediaInlineAction.revealHint || mediaInlineAction.revealAnchor) &&
                      'lg:grid-cols-[minmax(0,1fr)_17rem]'
                  )}
                >
                  <div className="copilot-media-myth-anchor">
                    <p className="copilot-media-myth-story-label">Prompt</p>
                    <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.prompt}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                      Then test yourself: {mediaInlineAction.selfCheckLine}
                    </p>
                  </div>
                  {mediaInlineAction.feedback || mediaInlineAction.revealHint || mediaInlineAction.revealAnchor ? (
                    <div className="grid gap-3">
                      {mediaInlineAction.feedback ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Feedback</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                              {mediaInlineAction.feedback.title}
                            </p>
                            <span className={`copilot-revision-pill ${mediaInlineAction.feedback.tone === 'strong' ? 'copilot-revision-pill-active' : ''}`}>
                              {mediaInlineAction.feedback.tone === 'strong'
                                ? 'Ready to keep'
                                : mediaInlineAction.feedback.tone === 'close'
                                  ? 'Almost there'
                                  : mediaInlineAction.feedback.tone === 'empty'
                                    ? 'Start first'
                                    : 'Refine once'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.feedback.body}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                            Next move: {mediaInlineAction.feedback.nextStep}
                          </p>
                        </div>
                      ) : null}
                      {mediaInlineAction.revealHint ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Cue</p>
                          <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.hint}</p>
                        </div>
                      ) : null}
                      {mediaInlineAction.revealAnchor ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Anchor to keep</p>
                          <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.anchorLine}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label className="block min-w-0">
                    <span className="copilot-media-myth-story-label">Your thinking</span>
                    <textarea
                      value={mediaInlineAction.draft}
                      onChange={(event) =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'creative_lab'
                            ? {
                                ...current,
                                draft: event.target.value,
                                feedback: null,
                                lockedIn: false,
                              }
                            : current
                        )
                      }
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                          event.preventDefault();
                          evaluateActiveCreativeLab();
                        }
                      }}
                      placeholder="Write your angle in 1-3 sentences. The engine will coach the next refinement."
                      className="copilot-inline-action-textarea mt-2 min-h-[88px] w-full rounded-[1rem] border border-[var(--copilot-soft-line)] bg-white/85 px-3 py-3 text-sm leading-6 text-[var(--copilot-text-primary)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-[var(--copilot-action-primary)] focus:ring-2 focus:ring-[var(--copilot-action-primary)]/15"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="copilot-control-commit h-9 rounded-full px-3 text-xs"
                      onClick={evaluateActiveCreativeLab}
                      disabled={!mediaInlineAction.draft.trim()}
                    >
                      {mediaInlineAction.feedback ? 'Refine response' : 'Check thinking'}
                    </Button>
                    {mediaInlineAction.feedback?.canLock ? (
                      <Button
                        type="button"
                      variant="outline"
                      className="copilot-control-nav h-9 rounded-full px-3 text-xs"
                      onClick={keepActiveCreativeLabInsight}
                      disabled={mediaInlineAction.lockedIn}
                    >
                      {mediaInlineAction.lockedIn ? 'Insight kept' : 'Keep insight'}
                    </Button>
                  ) : null}
                  </div>
                </div>
                {mediaInlineAction.lockedIn ? (
                  <p className="copilot-media-myth-panel-note">
                    Insight kept in this Media surface. Next move: {mediaInlineAction.feedback?.nextStep || mediaInlineAction.nextMove}
                  </p>
                ) : null}
              </div>
            ) : mediaInlineAction.kind === 'teach_back' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                      Teach it back
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                      Teach {studyTopicLabel(mediaInlineAction.context.entry)} in your own words
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      Give one clear explanation, get feedback, then keep the version that teaches best.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'teach_back'
                            ? { ...current, revealModelAnswer: !current.revealModelAnswer }
                            : current
                        )
                      }
                      aria-pressed={mediaInlineAction.revealModelAnswer}
                    >
                      {mediaInlineAction.revealModelAnswer ? 'Hide model' : 'Need a model?'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                      onClick={() => setMediaInlineAction(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <div
                  className={cn(
                    'grid gap-3',
                    (mediaInlineAction.feedback || mediaInlineAction.revealModelAnswer) &&
                      'lg:grid-cols-[minmax(0,1fr)_17rem]'
                  )}
                >
                  <div className="copilot-media-myth-anchor">
                    <p className="copilot-media-myth-story-label">Teaching prompt</p>
                    <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                      Start with: "{mediaInlineAction.context.anchorLine}"
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                      Then explain why it matters or what changes next.
                    </p>
                  </div>
                  {mediaInlineAction.feedback || mediaInlineAction.revealModelAnswer ? (
                    <div className="grid gap-3">
                      {mediaInlineAction.feedback ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">Feedback</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                              {mediaInlineAction.feedback.title}
                            </p>
                            <span className={`copilot-revision-pill ${mediaInlineAction.feedback.tone === 'strong' ? 'copilot-revision-pill-active' : ''}`}>
                              {mediaInlineAction.feedback.tone === 'strong'
                                ? 'Ready to keep'
                                : mediaInlineAction.feedback.tone === 'close'
                                  ? 'Tighten it'
                                  : mediaInlineAction.feedback.tone === 'empty'
                                    ? 'Try first'
                                    : 'Use support'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {mediaInlineAction.feedback.body}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                            Next move: {mediaInlineAction.feedback.nextStep}
                          </p>
                        </div>
                      ) : null}
                      {mediaInlineAction.revealModelAnswer ? (
                        <div className="copilot-media-myth-story-tile">
                          <p className="copilot-media-myth-story-label">One strong version</p>
                          <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                            {buildStudyTeachBackModelAnswer(mediaInlineAction.context)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label className="block min-w-0">
                    <span className="copilot-media-myth-story-label">Your teach-back</span>
                    <textarea
                      value={mediaInlineAction.draft}
                      onChange={(event) =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'teach_back'
                            ? { ...current, draft: event.target.value, feedback: null, lockedIn: false }
                            : current
                        )
                      }
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                          event.preventDefault();
                          evaluateActiveTeachBack();
                        }
                      }}
                      placeholder="Explain the idea as if you are helping a friend understand it quickly."
                      className="copilot-inline-action-textarea mt-2 min-h-[88px] w-full rounded-[1rem] border border-[var(--copilot-soft-line)] bg-white/85 px-3 py-3 text-sm leading-6 text-[var(--copilot-text-primary)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition focus:border-[var(--copilot-action-primary)] focus:ring-2 focus:ring-[var(--copilot-action-primary)]/15"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="copilot-control-commit h-9 rounded-full px-3 text-xs"
                      onClick={evaluateActiveTeachBack}
                      disabled={!mediaInlineAction.draft.trim()}
                    >
                      {mediaInlineAction.feedback ? 'Review again' : 'Review explanation'}
                    </Button>
                    {mediaInlineAction.feedback?.canLock ? (
                      <Button
                        type="button"
                      variant="outline"
                      className="copilot-control-nav h-9 rounded-full px-3 text-xs"
                      onClick={keepActiveTeachBack}
                      disabled={mediaInlineAction.lockedIn}
                    >
                      {mediaInlineAction.lockedIn ? 'Explanation kept' : 'Keep explanation'}
                    </Button>
                  ) : null}
                  </div>
                </div>
                {mediaInlineAction.lockedIn ? (
                  <p className="copilot-media-myth-panel-note">
                    Explanation saved in this Media surface. Next move: {mediaInlineAction.feedback?.nextStep || mediaInlineAction.context.unlockLine}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                      Linked note active
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                      {mediaInlineAction.noteTitle}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      Keep this note inside Media while you answer, explain, and practice.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                      onClick={() => openChallengeFromLinkedNote(mediaInlineAction.context)}
                    >
                      Start quick challenge
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() => openTeachBackFromLinkedNote(mediaInlineAction.context)}
                    >
                      Teach from this note
                    </Button>
                    {mediaInlineAction.noteExcerpt ? (
                      <Button
                        type="button"
                        variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() =>
                        setMediaInlineAction((current) =>
                          current && current.kind === 'linked_note'
                            ? { ...current, revealExcerpt: !current.revealExcerpt }
                            : current
                        )
                      }
                      aria-pressed={mediaInlineAction.revealExcerpt}
                    >
                      {mediaInlineAction.revealExcerpt ? 'Hide note line' : 'Reveal note line'}
                    </Button>
                  ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                      onClick={() => setMediaInlineAction(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="grid gap-3">
                    <div className="copilot-media-myth-anchor">
                      <p className="copilot-media-myth-story-label">Summary to hold onto</p>
                      <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.noteSummary}</p>
                    </div>
                    {mediaInlineAction.revealExcerpt && mediaInlineAction.noteExcerpt ? (
                      <div className="copilot-media-myth-story-tile">
                        <p className="copilot-media-myth-story-label">Saved line</p>
                        <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.noteExcerpt}</p>
                      </div>
                    ) : null}
                    {mediaInlineAction.studentNote ? (
                      <div className="copilot-media-myth-story-tile">
                        <p className="copilot-media-myth-story-label">Your note</p>
                        <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{mediaInlineAction.studentNote}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <div className="copilot-media-myth-story-tile">
                      <p className="copilot-media-myth-story-label">Use now</p>
                      <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                        {mediaInlineAction.context.anchorLine}
                      </p>
                    </div>
                    <div className="copilot-media-myth-story-tile">
                      <p className="copilot-media-myth-story-label">Next move</p>
                      <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                        {mediaInlineAction.context.followUpCheck || mediaInlineAction.context.unlockLine}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {mediaMode === 'study_stream' ? (
          isMediaStreamLoading && studyStreamEntries.length === 0 ? (
            <section className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`media-stream-skeleton-${index}`}
                  className="h-24 animate-pulse rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]"
                >
                </div>
              ))}
            </section>
          ) : studyStreamEntries.length === 0 ? (
            <section className="copilot-empty-state copilot-future-hover copilot-hover-reveal-group max-w-3xl px-6 py-6">
              <p className="text-base font-semibold text-[var(--copilot-text-primary)]">{mediaStreamEmptyState.title}</p>
              <p className="copilot-hover-reveal-copy text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {mediaStreamEmptyState.body}
              </p>
              {mediaStreamEmptyState.hintChips && mediaStreamEmptyState.hintChips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {mediaStreamEmptyState.hintChips.map((chip) => (
                    <span key={`study-empty-${chip}`} className="copilot-revision-pill">
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
              {mediaStreamEmptyState.primaryActionLabel && mediaStreamEmptyState.primaryActionMode ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav h-9 rounded-full px-4 text-xs"
                    onClick={() => onMediaModeChange(mediaStreamEmptyState.primaryActionMode!)}
                  >
                    {mediaStreamEmptyState.primaryActionLabel}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : (
            <div
              className="copilot-media-stream-layout copilot-media-stream-layout-study copilot-media-myth-layout relative flex min-h-0 flex-1 flex-col"
              data-side-rail={showStudyCompanion ? 'true' : 'false'}
              data-stream-tone={activeStudyTone}
            >
              <section
                className={cn(
                  'copilot-workspace-panel copilot-workspace-panel-muted copilot-future-hover copilot-hover-reveal-group copilot-media-stream-panel copilot-media-stream-panel-study copilot-media-myth-panel relative p-3 sm:p-4',
                  studyStreamStyles.studyStreamSurface
                )}
                data-stream-tone={activeStudyTone}
                data-layout={studyStreamUsesPageScroll ? 'flow' : 'stage'}
              >
                  <div className="copilot-study-stream-shell">
                    <div className="copilot-media-myth-header copilot-study-stream-header mb-2">
                      <div className="copilot-media-myth-header-copy min-w-0">
                        <h3 className="line-clamp-2 text-xl font-semibold text-[var(--copilot-text-primary)] md:text-[2rem] md:leading-[1.08]">
                          {highlightedStream?.entry.title || 'Stream card'}
                        </h3>
                        <p className="copilot-media-myth-header-caption text-sm text-[var(--copilot-text-secondary)] md:text-[1.02rem]">
                          {highlightedStream?.entry.mediaKind === 'audio'
                            ? 'One saved audio recap. Listen once and keep one anchor.'
                            : highlightedStream?.entry.mediaKind === 'video'
                              ? 'One saved visual recap. Press play and stay with it.'
                              : highlightedStream?.studyGuide?.whyNow ||
                                highlightedStream?.reason ||
                                'One recap at a time, then the clearest next move.'}
                        </p>
                      </div>
                    </div>
                  </div>

                <div className="copilot-media-stream-lane">
                  <div
                    ref={studyStreamViewportRef}
                    tabIndex={0}
                    data-layout={studyStreamUsesPageScroll ? 'flow' : 'stage'}
                    className={cn(
                      'copilot-stream-viewport copilot-media-stream-viewport touch-pan-y rounded-[1.2rem] p-0 outline-none [scroll-padding-top:0]',
                      studyStreamStyles.studyStreamViewport,
                      studyStreamUsesPageScroll ? 'overflow-visible' : 'overflow-hidden'
                    )}
                    onWheel={
                      studyStreamUsesPageScroll
                        ? undefined
                        : (event) =>
                            handleWheelCardStep(event, {
                              index: studyStreamIndex,
                              count: studyStreamEntries.length,
                              lockRef: studyWheelLockRef,
                              deltaRef: studyWheelDeltaRef,
                              resetRef: studyWheelResetRef,
                              stepConsumedRef: studyWheelStepConsumedRef,
                              move: (nextIndex) => scrollStudyToIndex(nextIndex),
                              onInteract: () => setStudyInteracted(true),
                              thresholdPx: streamInteractionMatrix.wheelStepThresholdPx,
                              resetMs: streamInteractionMatrix.wheelResetMs,
                              lockMs: streamInteractionMatrix.wheelLockMs,
                            })
                    }
                    onKeyDown={(event) => {
                      setStudyInteracted(true);
                      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key.toLowerCase() === 'j') {
                        event.preventDefault();
                        scrollStudyToIndex(studyStreamIndex + 1);
                      } else if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key.toLowerCase() === 'k') {
                        event.preventDefault();
                        scrollStudyToIndex(studyStreamIndex - 1);
                      } else if (event.key.toLowerCase() === 'q') {
                        event.preventDefault();
                        if (!isStudyCompanionPinned) {
                          setShowStudyQueue((prev) => !prev);
                        }
                      }
                    }}
                  >
                    <div className="space-y-0">
                    <AnimatePresence mode="wait" initial={false} custom={studyTransitionDirection}>
                    {studyStreamEntries.map((item, index) => {
                      const entry = item.entry;
                      const active = index === studyStreamIndex;
                      if (!active) return null;
                      const shouldDeferPreview = index !== studyStreamIndex;
                      const weakAssist = matchesWeakTopic(entry.topic || entry.subtopic || entry.title, entry.subject);
                      const tone = resolveStreamTone(entry.subject);
                      const isCompleted = entry.asset?.isCompleted === true;
                      const studyGuide = item.studyGuide || null;
                      const primaryActionKey = isCompleted ? 'quiz' : 'quick_check';
                      const saveAckKey = `study:${entry.id}:save`;
                      const quickCheckAckKey = `study:${entry.id}:quick_check`;
                      const studyCoachContext = buildStudyCoachContext({
                        entry,
                        reason: item.reason,
                        nextMove: item.nextMove,
                        quickCheck: item.quickCheck,
                        studyGuide,
                        weakAssist,
                        completed: isCompleted,
                      });
                      const { focusLine, whyNowLine, unlockLine, checkLine, followUpCheck, anchorLine } =
                        studyCoachContext;
                      const adaptiveMomentCards = buildStudyMomentCards({
                        entry,
                        focusLine,
                        checkLine,
                        unlockLine,
                        whyNowLine,
                        weakAssist,
                        completed: isCompleted,
                      });
                      const secondaryStudyActionMode =
                        weakAssist || entry.mediaKind === 'image' || entry.mediaKind === 'document' ? 'teach' : 'transfer';
                      const utilityStudyAction = entry.revisionItem ? 'revision' : 'save';
                      const linkedNoteActive = Boolean(entry.revisionItem && activeSourceEntry && activeSourceEntry.id === entry.id);
                      const linkedNotePinned = Boolean(entry.revisionItem && pinnedSourceEntry && pinnedSourceEntry.id === entry.id);
                      const primaryStudyActionLabel =
                        primaryActionKey === 'quick_check'
                          ? isAckActive(quickCheckAckKey)
                            ? 'Quiz live'
                            : 'Quiz me'
                          : compactStudyStreamCard
                            ? 'Recall round'
                            : 'Quiz me again';
                      const secondaryStudyActionLabel =
                        secondaryStudyActionMode === 'teach'
                          ? 'Teach back'
                          : 'Similar topic';
                      const utilityStudyActionLabel =
                        utilityStudyAction === 'save'
                          ? isAckActive(saveAckKey)
                            ? 'Saved'
                            : 'Save to revision'
                          : utilityStudyAction === 'revision'
                            ? !linkedNoteActive
                              ? 'Use linked note'
                              : linkedNotePinned
                                ? 'Unpin note'
                                : 'Pin note'
                              : null;
                      const leadingStudyMoment = adaptiveMomentCards[0] || {
                        id: `${entry.id}-focus`,
                        label: 'Study cue',
                        value: focusLine,
                      };
                      const compactStudyContinuation = followUpCheck || unlockLine;
                      const guidanceLine = studyGuide?.cue || leadingStudyMoment.value;
                      const nextActionLine = studyGuide?.nextStep || compactStudyContinuation || anchorLine;
                      const supportAnchorLine =
                        !anchorLine ||
                        challengeLinesEquivalent(anchorLine, guidanceLine) ||
                        challengeLinesEquivalent(anchorLine, nextActionLine)
                          ? null
                          : anchorLine;
                      return (
                        <motion.article
                          key={entry.id}
                          custom={studyTransitionDirection}
                          data-study-index={index}
                          data-active={active ? 'true' : 'false'}
                          data-layout={studyStreamUsesPageScroll ? 'flow' : 'stage'}
                          data-stream-tone={tone}
                          data-density={compactStudyStreamCard ? 'compact' : 'balanced'}
                          variants={studyStreamCardMotion}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className={cn(
                            'copilot-stream-card copilot-media-stream-card snap-start flex flex-col',
                            studyStreamStyles.studyStreamCard
                          )}
                        >
                          <div
                            data-stream-part="media"
                            className="copilot-media-stream-media copilot-media-myth-media copilot-study-stream-stage mt-2"
                            data-media-kind={entry.mediaKind}
                          >
                            {renderMediaPreview(entry, {
                              compact: compactStudyStreamCard,
                              deferred: shouldDeferPreview,
                              immersive: true,
                              density: 'study',
                            })}
                          </div>
                          {!compactWindowedMediaCard ? (
                            <div
                              data-stream-part="story"
                              className="copilot-study-stream-guidance mt-2"
                              data-density={compactStudyStreamCard ? 'compact' : 'balanced'}
                            >
                              <div className="copilot-study-stream-guidance-card">
                                <p className="copilot-media-myth-story-label">
                                  {entry.mediaKind === 'audio' ? 'Listen for' : 'Watch for'}
                                </p>
                                <p className="copilot-study-stream-guidance-copy line-clamp-3">{guidanceLine}</p>
                              </div>
                              <div className="copilot-study-stream-guidance-card">
                                <p className="copilot-media-myth-story-label">After this</p>
                                <p
                                  className={cn(
                                    'copilot-study-stream-guidance-copy',
                                    compactStudyStreamCard ? 'line-clamp-2' : 'line-clamp-3'
                                  )}
                                >
                                  {nextActionLine}
                                </p>
                              </div>
                            </div>
                          ) : null}
                          {supportAnchorLine ? (
                            <p
                              className={cn(
                                  'copilot-study-stream-anchor mt-2',
                                compactStudyStreamCard ? 'line-clamp-2' : 'line-clamp-3'
                              )}
                              >
                                One anchor: {supportAnchorLine}
                              </p>
                            ) : null}
                           <div data-stream-part="actions" className="copilot-stream-action-rail copilot-media-myth-dock copilot-media-myth-dock-study mt-2 flex gap-2 overflow-x-auto pb-1">
                            <Button
                              type="button"
                              variant="default"
                              className="copilot-control-commit h-8 shrink-0 rounded-full px-3 text-xs md:h-9 md:px-3.5 md:text-sm"
                              onClick={() => {
                                if (primaryActionKey === 'quick_check') {
                                  openStudyQuickChallengeSurface(studyCoachContext, 'challenge');
                                  markActionAck(quickCheckAckKey);
                                  return;
                                }
                                openStudyQuickChallengeSurface(studyCoachContext, 'recall');
                                markActionAck(quickCheckAckKey);
                              }}
                            >
                              {primaryStudyActionLabel}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="copilot-control-nav h-8 shrink-0 rounded-full px-3 text-xs md:h-9 md:px-3.5 md:text-sm"
                              onClick={() => {
                                if (secondaryStudyActionMode === 'teach') {
                                  openStudyTeachBackSurface(studyCoachContext);
                                  return;
                                }
                                if (entry.asset?.id && onRecordMediaInteraction) {
                                  void onRecordMediaInteraction(entry.asset.id, 'similar_question', entry.revisionItemId);
                                }
                                openStudyQuickChallengeSurface(studyCoachContext, 'challenge', {
                                  orbitEventType: 'open_similar_question',
                                  promptOverride:
                                    studyCoachContext.followUpCheck ||
                                    `Try one similar case for ${entry.topic || entry.title}.`,
                                });
                              }}
                            >
                              {secondaryStudyActionLabel}
                            </Button>
                            {utilityStudyAction === 'save' ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-8 shrink-0 rounded-full px-3 text-xs md:h-9 md:px-3.5 md:text-sm"
                                onClick={() => {
                                  lockStudyIntoRevision(studyCoachContext);
                                  markActionAck(saveAckKey);
                                }}
                              >
                                {utilityStudyActionLabel}
                              </Button>
                            ) : utilityStudyAction === 'revision' ? (
                              <Button
                                type="button"
                                variant={linkedNoteActive ? (linkedNotePinned ? 'ghost' : 'outline') : 'ghost'}
                                className="copilot-control-utility h-8 shrink-0 rounded-full px-3 text-xs md:h-9 md:px-3.5 md:text-sm"
                                onClick={() => {
                                  if (!linkedNoteActive) {
                                    openStudyLinkedNoteSurface(studyCoachContext);
                                    return;
                                  }
                                  if (linkedNotePinned) {
                                    unpinMediaSource(entry);
                                    return;
                                  }
                                  openStudyLinkedNoteSurface(studyCoachContext, { pin: true });
                                }}
                              >
                                {utilityStudyActionLabel}
                              </Button>
                            ) : null}
                          </div>
                        </motion.article>
                      );
                    })}
                    </AnimatePresence>
                    </div>
                    </div>
                  </div>
                {studyStreamEntries.length > 0 && (studyStreamIndex + 1) % 3 === 0 ? (
                  <div className="copilot-study-stream-handoff mt-auto pt-3">
                    <div className="copilot-next-move-panel flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                          Learning handoff
                        </p>
                        <p className="text-sm text-[var(--copilot-text-secondary)]">
                          You have completed {studyStreamIndex + 1} focused cards. Check retention now, then continue or pause with intent.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                            onClick={() => {
                              if (highlightedStudyCoachContext) {
                                openStudyQuickChallengeSurface(highlightedStudyCoachContext, 'challenge');
                              }
                            }}
                          >
                            Quick challenge
                          </Button>
                          {highlightedStudyCoachContext?.entry.revisionItem ? (
                            !highlightedStudyLinkedNoteActive ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                                onClick={() => openStudyLinkedNoteSurface(highlightedStudyCoachContext)}
                              >
                                Use linked note
                              </Button>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                                  onClick={() => openTeachBackFromLinkedNote(highlightedStudyCoachContext)}
                                >
                                  Explain from note
                                </Button>
                                <Button
                                  type="button"
                                  variant={highlightedStudyLinkedNotePinned ? 'ghost' : 'outline'}
                                  className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                                  onClick={() =>
                                    highlightedStudyLinkedNotePinned
                                      ? unpinMediaSource(highlightedStudyCoachContext.entry)
                                      : openStudyLinkedNoteSurface(highlightedStudyCoachContext, { pin: true })
                                  }
                                >
                                  {highlightedStudyLinkedNotePinned ? 'Unpin note' : 'Pin note'}
                                </Button>
                              </>
                            )
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                              onClick={() => {
                                if (highlightedStudyCoachContext) {
                                  openStudyTeachBackSurface(highlightedStudyCoachContext);
                                }
                              }}
                            >
                              Teach it back
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              {showStudyCompanion ? (
                <aside
                  className={cn(
                    'copilot-workspace-panel copilot-future-hover copilot-hover-reveal-group copilot-stream-queue-drawer copilot-media-myth-companion learning-orbit-panel learning-orbit-panel-study p-3 sm:p-3.5',
                    studyStreamStyles.studyStreamOrbit
                  )}
                  data-stream-tone={activeStudyTone}
                >
                  <div className="learning-orbit-header">
                    <div className="min-w-0">
                      <p className="learning-orbit-eyebrow">{mediaStreamDeck.supportLabel}</p>
                      <h3 className="learning-orbit-title">Quick support</h3>
                    </div>
                    <div className="learning-orbit-header-meta">
                      <span className="learning-orbit-status-badge" data-tone={highlightedStudyPulseTone}>
                        {highlightedStudyPulseLabel}
                      </span>
                      {!isStudyCompanionPinned ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                          onClick={() => setShowStudyQueue(false)}
                        >
                          Hide support
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {highlightedStudyEntry ? (
                    <div className="learning-orbit-body mt-3">
                      <section className="learning-orbit-focus learning-orbit-focus-study-summary">
                        <p className="learning-orbit-overline">Current pulse</p>
                        <div className="learning-orbit-stage-compact-row">
                          <span className="learning-orbit-stage-chip">{highlightedStudyStageShortLabel}</span>
                          <span className="learning-orbit-unlock-readiness">{highlightedStudyUnlockReadinessLabel}</span>
                        </div>
                        <p className="learning-orbit-focus-title">{highlightedStudyPulseLabel}</p>
                        <p className="learning-orbit-focus-support">{highlightedStudyStageSentence}</p>
                      </section>

                      <section className="learning-orbit-primary-cue">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`${highlightedStudyOrbitProgress.stage}:${highlightedStudyPrimaryCue.kind}:${highlightedStudyPrimaryCue.value}`}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 6, filter: 'blur(3px)' }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5, filter: 'blur(3px)' }}
                            transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <p className="learning-orbit-overline">{highlightedStudyPrimaryCue.label}</p>
                            <p className="learning-orbit-primary-text">{highlightedStudyPrimaryCue.value}</p>
                          </motion.div>
                        </AnimatePresence>
                        {highlightedStudyPrimaryCue.secondaryValue ? (
                          <p className="learning-orbit-secondary-line">
                            <span>{highlightedStudyPrimaryCue.secondaryLabel}:</span> {highlightedStudyPrimaryCue.secondaryValue}
                          </p>
                        ) : null}
                        <div className="learning-orbit-support-row">
                          {highlightedStudyCoachContext?.entry.revisionItem ? (
                            !highlightedStudyLinkedNoteActive ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                                onClick={() => openStudyLinkedNoteSurface(highlightedStudyCoachContext)}
                              >
                                Use linked note
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                                onClick={() => openTeachBackFromLinkedNote(highlightedStudyCoachContext)}
                              >
                                Explain from note
                              </Button>
                            )
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                              onClick={() => {
                                if (highlightedStudyCoachContext) {
                                  openStudyTeachBackSurface(highlightedStudyCoachContext);
                                }
                              }}
                            >
                              Teach back
                            </Button>
                          )}
                        </div>
                      </section>

                      <section className="learning-orbit-unlock" data-readiness={highlightedStudyUnlockView.readiness}>
                        <p className="learning-orbit-overline">{highlightedStudyUnlockView.title}</p>
                        <p className="learning-orbit-unlock-text">{highlightedStudyUnlockView.guidance}</p>
                        <p className="learning-orbit-unlock-why">{highlightedStudyUnlockView.whyLine}</p>
                        <div className="learning-orbit-unlock-row">
                          <Button
                            type="button"
                            variant="outline"
                            className="learning-orbit-unlock-action h-7 rounded-full px-3 text-[11px]"
                            onClick={runHighlightedStudyUnlockAction}
                          >
                            {highlightedStudyUnlockView.actionLabel}
                          </Button>
                          <span className="learning-orbit-unlock-readiness">{highlightedStudyUnlockReadinessLabel}</span>
                        </div>
                      </section>
                    </div>
                  ) : null}
                  <div className="learning-orbit-lineup mt-3">
                    <p className="learning-orbit-overline">{mediaStreamDeck.lineupLabel}</p>
                  <div className="learning-orbit-lineup-list mt-2">
                    {upcomingStudyQueueEntries.map((item, visibleIndex) => {
                      const entry = item.entry;
                      const index = studyStreamEntries.findIndex((candidate) => candidate.entry.id === entry.id);
                      const isNext = visibleIndex === 0;
                      const weakAssist = matchesWeakTopic(entry.topic || entry.subtopic || entry.title, entry.subject);
                      const unlockLine = buildStudyUnlockLine(entry, item.nextMove, item.studyGuide?.nextStep || null);
                      const checkLine = buildStudyCheckLine(entry, item.quickCheck);
                      const orbitProgress = studyOrbitTrackingByEntryId[entry.id] || createEmptyStudyOrbitProgressState();
                      const stageShortLabel = formatStudyOrbitStageShortLabel(orbitProgress.stage);
                      const lineupSignal = buildStudyOrbitLineupSignal({
                        isNext,
                        position: visibleIndex,
                        stage: orbitProgress.stage,
                        weakAssist,
                        checkLine,
                        unlockLine,
                        reason: item.reason,
                        nextMove: item.nextMove,
                      });
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => scrollStudyToIndex(index)}
                          className="learning-orbit-lineup-row w-full text-left"
                          data-active={isNext ? 'true' : 'false'}
                            aria-current={isNext ? 'step' : undefined}
                          >
                            <span className="learning-orbit-lineup-kicker">{lineupSignal.kicker}</span>
                            <div className="learning-orbit-lineup-main">
                              <p className="learning-orbit-lineup-purpose">{item.studyGuide?.lineupReason || lineupSignal.purpose}</p>
                              <span className="learning-orbit-lineup-stage">{stageShortLabel}</span>
                            </div>
                            <p className="learning-orbit-lineup-title line-clamp-1">{entry.title}</p>
                        </button>
                      );
                    })}
                  </div>
                  {upcomingStudyQueueEntries.length === 0 ? (
                    <div className="learning-orbit-empty mt-2">
                      You are at the end of this lane. Replay this recap or save the anchor to Revision before switching modes.
                    </div>
                  ) : null}
                  </div>
                  <div aria-hidden="true" className={studyStreamStyles.orbitEndpoint}>
                    <span className={studyStreamStyles.orbitEndpointChip}>Orbit endpoint</span>
                    <span className={studyStreamStyles.orbitEndpointRail} />
                  </div>
                </aside>
              ) : !isStudyCompanionPinned && studyStreamEntries.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setShowStudyQueue(true)}
                  className="copilot-stream-queue-peek w-full rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-4 py-2 text-left text-xs text-[var(--copilot-text-secondary)] transition hover:bg-[var(--copilot-surface-0)]"
                >
                  <span className="font-semibold text-[var(--copilot-text-primary)]">Show support</span>{' '}
                  {studyStreamEntries.length - (studyStreamIndex + 1) > 0
                    ? `${studyStreamEntries.length - (studyStreamIndex + 1)} more cards ready.`
                    : 'Queue complete.'}
                </button>
              ) : null}
            </div>
          )
        ) : mediaMode === 'creative_stream' ? (
          creativeCards.length === 0 ? (
            <section className="copilot-empty-state copilot-future-hover copilot-hover-reveal-group max-w-3xl px-6 py-6">
              <p className="text-base font-semibold text-[var(--copilot-text-primary)]">{mediaStreamEmptyState.title}</p>
              <p className="copilot-hover-reveal-copy text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {mediaStreamEmptyState.body}
              </p>
              {mediaStreamEmptyState.hintChips && mediaStreamEmptyState.hintChips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {mediaStreamEmptyState.hintChips.map((chip) => (
                    <span key={`creative-empty-${chip}`} className="copilot-revision-pill">
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {mediaStreamEmptyState.primaryActionLabel && mediaStreamEmptyState.primaryActionMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav h-9 rounded-full px-4 text-xs"
                    onClick={() => onMediaModeChange(mediaStreamEmptyState.primaryActionMode!)}
                  >
                    {mediaStreamEmptyState.primaryActionLabel}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="copilot-control-utility h-9 rounded-full px-4 text-xs"
                  onClick={() => onMediaModeChange('library')}
                >
                  Open Library
                </Button>
              </div>
            </section>
          ) : (
            <div
              className="copilot-media-stream-layout copilot-media-stream-layout-creative relative flex min-h-0 flex-1 flex-col"
              data-side-rail={showCreativeCompanion ? 'true' : 'false'}
              data-stream-tone={activeCreativeTone}
            >
              <section
                className="copilot-workspace-panel copilot-workspace-panel-muted copilot-media-stream-panel copilot-media-stream-panel-creative relative p-2 sm:p-3 md:p-4"
                data-stream-tone={activeCreativeTone}
              >
                <div className="copilot-media-myth-header copilot-creative-shell-header mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="copilot-media-myth-header-copy min-w-0">
                    <p className="copilot-workspace-eyebrow">{mediaStreamDeck.modeIdentity}</p>
                    <h3 className="line-clamp-2 text-base font-semibold text-[var(--copilot-text-primary)] md:text-lg">
                      {highlightedCreativeCard?.title || 'Creative orbit'}
                    </h3>
                    <p className="copilot-media-myth-header-caption text-xs text-[var(--copilot-text-secondary)] md:text-sm">
                      {highlightedCreativeStoryHook}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="copilot-media-myth-theme-pill" data-stream-tone={activeCreativeTone}>
                      {highlightedCreativePulseLabel}
                    </span>
                    <span className="copilot-revision-pill">
                      {creativeStreamIndex + 1}/{creativeCards.length}
                    </span>
                    {!isCreativeCompanionPinned ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                        onClick={() => setShowCreativeQueue((prev) => !prev)}
                      >
                        {showCreativeCompanion ? 'Hide orbit' : 'Show orbit'}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="copilot-media-myth-lane-intro copilot-creative-shell-intro mb-3 text-xs text-[var(--copilot-text-secondary)]">
                  <p className="line-clamp-2">
                    {primaryStreamNotice?.message ||
                      (upcomingCreativeQueueEntries[0]
                        ? `Next angle: ${upcomingCreativeQueueEntries[0].title}`
                        : 'You are at the front edge of this creative orbit.')}
                  </p>
                </div>
                <div className="copilot-media-stream-lane copilot-creative-stage">
                  <div
                    ref={creativeStreamViewportRef}
                    tabIndex={0}
                    className="copilot-stream-viewport copilot-media-stream-viewport copilot-creative-viewport touch-pan-y overflow-hidden rounded-[1.2rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-0)] p-0 outline-none [scroll-padding-top:0]"
                    onWheel={(event) =>
                      handleWheelCardStep(event, {
                        index: creativeStreamIndex,
                        count: creativeCards.length,
                        lockRef: creativeWheelLockRef,
                        deltaRef: creativeWheelDeltaRef,
                        resetRef: creativeWheelResetRef,
                        stepConsumedRef: creativeWheelStepConsumedRef,
                        move: (nextIndex) => scrollCreativeToIndex(nextIndex),
                        onInteract: () => setCreativeInteracted(true),
                        thresholdPx: streamInteractionMatrix.wheelStepThresholdPx,
                        resetMs: streamInteractionMatrix.wheelResetMs,
                        lockMs: streamInteractionMatrix.wheelLockMs,
                      })
                    }
                    onKeyDown={(event) => {
                      setCreativeInteracted(true);
                      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key.toLowerCase() === 'j') {
                        event.preventDefault();
                        scrollCreativeToIndex(creativeStreamIndex + 1);
                      } else if (event.key === 'ArrowUp' || event.key === 'PageUp' || event.key.toLowerCase() === 'k') {
                        event.preventDefault();
                        scrollCreativeToIndex(creativeStreamIndex - 1);
                      } else if (event.key.toLowerCase() === 'q') {
                        event.preventDefault();
                        if (!isCreativeCompanionPinned) {
                          setShowCreativeQueue((prev) => !prev);
                        }
                      }
                    }}
                  >
                    <div className="space-y-0">
                      <AnimatePresence mode="wait" initial={false} custom={creativeTransitionDirection}>
                        {creativeCards.map((card, index) => {
                          const active = index === creativeStreamIndex;
                          if (!active) return null;
                          const weakAssist = matchesWeakTopic(card.topic || card.title, card.subject);
                          const tone = resolveStreamTone(card.subject);
                          const overlay = card.interaction
                            ? {
                                overline: card.interaction.overline,
                                text: card.interaction.overlayText,
                              }
                            : roleOverlay(card);
                          const primaryAction = card.interaction?.primaryAction || null;
                          const primaryActionLabel = primaryAction?.label || rolePrimaryActionLabel(card);
                          const supportLine =
                            card.creativeRole === 'reframe' && card.topic
                              ? `A visual way to rethink ${card.topic}.`
                              : roleSupportLine(card);
                          const titleLine =
                            normalizeCompactText(card.title, 140) ||
                            'Why neutralisation is more like a swap than a disappearance';
                          const subjectLabel = normalizeCompactText(card.subject, 32) || 'Science';
                          const durationLabel =
                            formatDurationLabel(card.previewEntry?.durationSec || Math.max(38, Math.round(card.estimatedMinutes * 60))) || '0:38';
                          const nextCue =
                            card.interaction?.nextCueBody ||
                            (card.creativeRole === 'reframe'
                              ? 'See how the same pattern shows up in salt formation'
                              : firstUsefulTeachingText([card.nextMove, card.transferLine, card.metacognitionLine], {
                                  maxLength: 120,
                                  minWords: 5,
                                  minChars: 24,
                                }) || 'Carry this idea into a new example before moving on.');
                          const primaryAckKey = `creative:${card.id}:${primaryAction?.id || 'primary'}`;
                          const secondaryActions = (card.availableActions.length > 0
                            ? card.availableActions
                            : [
                                { id: 'more_like_this', label: 'More like this' },
                                { id: 'save_to_revision', label: 'Save idea' },
                                { id: 'open_longer_lesson', label: 'Longer version' },
                              ]) as CreativeContractAction[];
                          return (
                            <motion.article
                              key={card.id}
                              custom={creativeTransitionDirection}
                              data-creative-index={index}
                              data-active={active ? 'true' : 'false'}
                              data-stream-tone={tone}
                              variants={studyStreamCardMotion}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              className={`copilot-stream-card copilot-media-stream-card copilot-creative-card snap-start rounded-[1.24rem] border px-3 py-3 transition-colors duration-150 sm:px-4 sm:py-4 md:px-5 md:py-5 ${
                                active
                                  ? 'copilot-stream-card-active border-[var(--copilot-action-primary)]/45 bg-[var(--copilot-action-primary)]/10'
                                  : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]'
                              } flex flex-col`}
                            >
                              <div data-stream-part="meta" className="copilot-creative-meta-row">
                                <span className="copilot-creative-meta-label">Creative Stream</span>
                                <span className="copilot-creative-chip">{subjectLabel}</span>
                                <span className="copilot-creative-chip">{roleChipLabel(card.creativeRole)}</span>
                                <span className="copilot-creative-duration">{durationLabel}</span>
                              </div>
                              <h4 data-stream-part="meta" className="mt-2 text-[1.02rem] font-semibold leading-tight text-[var(--copilot-text-primary)] sm:text-[1.12rem] md:text-[1.22rem]">
                                {titleLine}
                              </h4>
                              <p data-stream-part="meta" className="mt-1 line-clamp-2 text-[0.78rem] leading-5 text-[var(--copilot-text-secondary)] sm:text-[0.82rem]">
                                {supportLine}
                              </p>

                              <div data-stream-part="media" className="copilot-media-stream-media copilot-creative-media-shell mt-3">
                                {card.previewEntry ? (
                                  renderMediaPreview(card.previewEntry, {
                                    deferred: false,
                                    staticVideo: false,
                                    immersive: true,
                                    density: 'creative',
                                  })
                                ) : (
                                  <div className="copilot-creative-fallback">
                                    <p className="copilot-creative-fallback-kicker">Creative explainer</p>
                                    <p className="line-clamp-3 text-sm font-medium text-[var(--copilot-text-primary)]">
                                      {card.storyHook || card.reason}
                                    </p>
                                  </div>
                                )}
                                <div className="copilot-creative-overlay-shell">
                                  <p className="copilot-creative-overlay-overline">{overlay.overline}</p>
                                  <p className="copilot-creative-overlay-copy line-clamp-2">{overlay.text}</p>
                                </div>
                              </div>

                              <div data-stream-part="actions" className="mt-3">
                                <Button
                                  type="button"
                                  variant="default"
                                  className="copilot-control-commit copilot-creative-primary-action h-10 w-full rounded-full px-4 text-sm"
                                  onClick={() => {
                                    triggerCreativeAction(
                                      card,
                                      primaryAction?.id ||
                                        (weakAssist ? 'quick_check' : card.creativeRole === 'transfer' ? 'try_new_angle' : 'quick_check')
                                    );
                                    markActionAck(primaryAckKey);
                                  }}
                                >
                                  {isAckActive(primaryAckKey) ? `${primaryActionLabel} live` : primaryActionLabel}
                                </Button>
                                <div className="copilot-creative-secondary-row mt-2">
                                  {secondaryActions.map((action) => {
                                    const actionAckKey = `creative:${card.id}:${action.id}`;
                                    const liveLabel =
                                      action.id === 'save_to_revision'
                                        ? 'Idea saved'
                                        : action.id === 'open_longer_lesson'
                                          ? 'Opening...'
                                          : action.id === 'more_like_this'
                                            ? 'Loading ideas'
                                            : `${action.label} live`;
                                    return (
                                      <button
                                        key={action.id}
                                        type="button"
                                        className="copilot-creative-secondary-action"
                                        onClick={() => {
                                          triggerCreativeAction(card, action.id);
                                          markActionAck(actionAckKey);
                                        }}
                                      >
                                        {isAckActive(actionAckKey) ? liveLabel : action.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div data-stream-part="next" className="copilot-creative-next-cue mt-3">
                                <p className="copilot-creative-next-kicker">{card.interaction?.nextCueTitle || 'Next idea'}</p>
                                <p className="line-clamp-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{nextCue}</p>
                              </div>
                            </motion.article>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </section>

              {creativeCompanionEnabled && showCreativeCompanion ? (
                <aside
                  className="copilot-workspace-panel copilot-future-hover copilot-hover-reveal-group copilot-stream-queue-drawer copilot-media-myth-companion creative-orbit-panel p-4"
                  data-stream-tone={activeCreativeTone}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="copilot-workspace-eyebrow">{mediaStreamDeck.supportLabel}</p>
                      <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">Now manufacturing + next angles</h3>
                    </div>
                    {!isCreativeCompanionPinned ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                        onClick={() => setShowCreativeQueue(false)}
                      >
                        Hide panel
                      </Button>
                    ) : null}
                  </div>
                  {highlightedCreativeCard ? (
                    <div className="copilot-media-myth-spotlight copilot-media-myth-spotlight-stack mt-3">
                      <div className="copilot-media-myth-spotlight-header">
                        <div className="min-w-0">
                          <p className="copilot-media-myth-story-label">Now in focus</p>
                          <p className="line-clamp-2 text-sm font-semibold text-[var(--copilot-text-primary)]">{highlightedCreativeCard.title}</p>
                        </div>
                        <span className="copilot-media-myth-story-badge">{highlightedCreativePulseLabel}</span>
                      </div>
                      <div className="copilot-media-myth-queue-meta">
                        <span className="copilot-media-myth-inline-tag">{highlightedCreativeCard.sourceLabel}</span>
                        {activeCreativeWeakAssist ? <span className="copilot-media-myth-inline-tag">Weak-topic assist</span> : null}
                      </div>
                      <div className="copilot-media-myth-anchor">
                        <p className="copilot-media-myth-story-label">Memory anchor</p>
                        <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">{highlightedCreativeAnchorLine}</p>
                      </div>
                      <div className="copilot-media-myth-facts">
                        {highlightedCreativeOrbitSteps.map((fact, factIndex) => {
                          const activeStep = factIndex === highlightedCreativeOrbitStepIndex;
                          const completedStep = highlightedCreativeCompletedStepIds.includes(fact.stepId);
                          return (
                            <motion.button
                              key={fact.stepId}
                              layout
                              custom={activeStep}
                              variants={orbitStepMotion}
                              initial={prefersReducedMotion ? false : 'initial'}
                              animate="animate"
                              type="button"
                              onClick={() => selectCreativeOrbitStep(highlightedCreativeCard.id, factIndex)}
                              className="copilot-media-myth-fact copilot-media-myth-orbit-step w-full text-left"
                              data-active={activeStep ? 'true' : 'false'}
                              data-completed={completedStep ? 'true' : 'false'}
                              aria-pressed={activeStep}
                              transition={
                                prefersReducedMotion
                                  ? { duration: 0.01 }
                                  : {
                                      duration: 0.28,
                                      delay: Math.min(0.18, factIndex * 0.03),
                                      ease: [0.22, 1, 0.36, 1],
                                    }
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="copilot-media-myth-story-label">{fact.label}</p>
                                {completedStep ? <span className="copilot-revision-pill copilot-revision-pill-active">Kept</span> : null}
                              </div>
                              <p className="line-clamp-3 text-sm leading-6 text-[var(--copilot-text-primary)]">{fact.value}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                      <div className="copilot-media-myth-orbit-progress flex items-center justify-between gap-2 text-[11px] text-[var(--copilot-text-secondary)]">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={`${highlightedCreativeCompletedCount}:${highlightedCreativeOrbitSteps.length}`}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 4, scale: 0.98 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.985 }}
                            transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex items-center"
                          >
                            {highlightedCreativeCompletedCount}/{Math.max(1, highlightedCreativeOrbitSteps.length)} steps kept
                          </motion.span>
                        </AnimatePresence>
                        {highlightedCreativeOrbitSteps.length > 1 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="copilot-control-utility h-6 rounded-full px-2 text-[10px]"
                              onClick={() => stepCreativeOrbit(highlightedCreativeCard.id, -1, highlightedCreativeOrbitSteps.length)}
                              disabled={highlightedCreativeOrbitStepIndex <= 0}
                            >
                              Prev
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="copilot-control-utility h-6 rounded-full px-2 text-[10px]"
                              onClick={() => stepCreativeOrbit(highlightedCreativeCard.id, 1, highlightedCreativeOrbitSteps.length)}
                              disabled={highlightedCreativeOrbitStepIndex >= highlightedCreativeOrbitSteps.length - 1}
                            >
                              Next
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={highlightedCreativeOrbitStepKey}
                          className="copilot-media-myth-panel-note"
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 6, filter: 'blur(3px)' }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(3px)' }}
                          transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          aria-live="polite"
                        >
                          Thinking cue: {highlightedCreativeOrbitStep?.value || highlightedCreativeMetacognitionLine}
                        </motion.p>
                      </AnimatePresence>
                      <p className="copilot-media-myth-support-copy line-clamp-2 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                        {highlightedCreativeFooterLabel}: {highlightedCreativeFooterValue}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                          onClick={() =>
                            openCreativeLabSurface(
                              highlightedCreativeCard,
                              highlightedCreativeOrbitStep?.variant ||
                                resolveCreativePrimaryVariant(highlightedCreativeCard, activeCreativeWeakAssist),
                              { originStepId: highlightedCreativeOrbitStep?.stepId || null }
                            )
                          }
                        >
                          Try this step
                        </Button>
                        {highlightedCreativeOrbitStep ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                            onClick={() => markCreativeOrbitStepDone(highlightedCreativeCard.id, highlightedCreativeOrbitStep.stepId)}
                          >
                            Keep step
                          </Button>
                        ) : null}
                        {highlightedCreativePreviewEntry ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="copilot-control-utility h-7 rounded-full px-2.5 text-[11px]"
                            onClick={() => {
                              if (!highlightedCreativeSourceActive) {
                                activateMediaSource(highlightedCreativePreviewEntry);
                                return;
                              }
                              openChallengeFromSource(highlightedCreativePreviewEntry);
                            }}
                          >
                            {!highlightedCreativeSourceActive ? 'Use source' : 'Challenge source'}
                          </Button>
                        ) : null}
                        {highlightedCreativePreviewEntry && highlightedCreativeSourceActive ? (
                          <Button
                            type="button"
                            variant={highlightedCreativeSourcePinned ? 'ghost' : 'outline'}
                            className="copilot-control-utility h-7 rounded-full px-2.5 text-[11px]"
                            onClick={() =>
                              highlightedCreativeSourcePinned
                                ? unpinMediaSource(highlightedCreativePreviewEntry)
                                : pinMediaSource(highlightedCreativePreviewEntry)
                            }
                          >
                            {highlightedCreativeSourcePinned ? 'Unpin source' : 'Pin source'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="copilot-workspace-eyebrow">{mediaStreamDeck.lineupLabel}</p>
                    <span className="text-[11px] text-[var(--copilot-text-secondary)]">
                      {mediaStreamDeck.replenishes ? `Refills in ${Math.max(1, mediaStreamDeck.refillBatchSize || 3)}-card waves` : 'Sequenced for revision'}
                    </span>
                  </div>
                  <div className="copilot-media-myth-orbit-list mt-3">
                    {upcomingCreativeQueueEntries.map((card, visibleIndex) => {
                      const index = creativeStreamIndex + 1 + visibleIndex;
                      const active = visibleIndex === 0;
                      const queueWeakAssist = matchesWeakTopic(card.topic || card.title, card.subject);
                      const queueMomentCards = buildCreativeMomentCards({ card, weakAssist: queueWeakAssist });
                      const queueAnchorLine = buildCreativeAnchorLine(card);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => scrollCreativeToIndex(index)}
                          className="copilot-media-myth-queue-card w-full text-left"
                          data-active={active ? 'true' : 'false'}
                          aria-current={active ? 'step' : undefined}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="copilot-media-myth-queue-kicker">
                                {active ? 'Up next' : 'Later in the orbit'}
                              </p>
                              <p className="line-clamp-2 text-sm font-semibold text-[var(--copilot-text-primary)]">{card.title}</p>
                            </div>
                            <span className="copilot-media-myth-inline-tag">{card.pulseLabel}</span>
                          </div>
                          <div className="copilot-media-myth-queue-meta">
                            <span className="copilot-media-myth-inline-tag">{card.sourceLabel}</span>
                            <span className="copilot-media-myth-inline-tag">{card.estimatedMinutes} min</span>
                            {queueWeakAssist ? <span className="copilot-media-myth-inline-tag">Weak-topic assist</span> : null}
                          </div>
                          <p className="copilot-media-myth-queue-summary line-clamp-2 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                            {queueMomentCards[0] ? `${queueMomentCards[0].label}: ${queueMomentCards[0].value}` : queueAnchorLine}
                          </p>
                          <p className="copilot-media-myth-queue-summary line-clamp-2 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                            {active ? `Memory anchor: ${queueAnchorLine}` : `Thinking cue: ${card.metacognitionLine}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {upcomingCreativeQueueEntries.length === 0 ? (
                    <div className="copilot-media-myth-queue-empty mt-3">
                      You are at the front edge of this orbit. Replay this card, switch to Study Stream, or refresh Media for another creative wave.
                    </div>
                  ) : null}
                  <p className="mt-3 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                    {primaryStreamNotice?.message ||
                      (mediaStreamDeck.replenishes
                        ? 'The engine keeps replenishing this orbit with new thought angles as you move.'
                        : 'This lane keeps your next revision steps close and quiet.')}
                  </p>
                </aside>
              ) : creativeCompanionEnabled && !isCreativeCompanionPinned ? (
                <button
                  type="button"
                  onClick={() => setShowCreativeQueue(true)}
                  className="copilot-stream-queue-peek w-full rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-4 py-2 text-left text-xs text-[var(--copilot-text-secondary)] transition hover:bg-[var(--copilot-surface-0)]"
                >
                  <span className="font-semibold text-[var(--copilot-text-primary)]">Show creative orbit</span>{' '}
                  {upcomingCreativeQueueEntries.length > 0
                    ? `${upcomingCreativeQueueEntries.length} more sparks ready.`
                    : 'Open the orbit view for the current spark.'}
                </button>
              ) : null}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {isCollectionsCategoryActive ? (
              <section className="copilot-workspace-panel copilot-workspace-panel-muted copilot-future-hover copilot-hover-reveal-group p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="copilot-media-collection-kicker">Collections</p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--copilot-text-primary)]">Your media collections</h3>
                    <p className="mt-1 text-sm text-[var(--copilot-text-secondary)]">
                      Group AI-generated media by goal so students can reopen assets with clear context.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="copilot-revision-pill">{collectionEntries.length}</span>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={createMediaCollectionFromWorkspace}
                    >
                      New collection
                    </Button>
                  </div>
                </div>

                {isMediaCollectionsLoading && collectionEntries.length === 0 ? (
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`media-collection-skeleton-${index}`}
                        className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-4 py-4"
                      >
                        <div className="h-4 w-1/3 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                        <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                      </div>
                    ))}
                  </div>
                ) : collectionEntries.length === 0 ? (
                  <div className="copilot-empty-state mt-4 px-5 py-5">
                    <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No collections yet</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      Create a collection, then add selected media assets so students can return to focused study sets.
                    </p>
                  </div>
                ) : (
                  <>
                    <section className="copilot-media-collection-grid mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {collectionEntries.map((collection) => {
                        const metadataPills = [collection.subject, collection.topic, collection.progressLabel].filter(
                          (value): value is string => Boolean(String(value || '').trim())
                        );
                        const visibleMetadataPills = metadataPills.slice(0, 2);
                        const hiddenMetadataCount = Math.max(0, metadataPills.length - visibleMetadataPills.length);
                        const isOpen = openedCollectionId === collection.id;
                        const selectedAssetId =
                          selectedAssetForCollection && !selectedAssetForCollection.isDemo
                            ? selectedAssetForCollection.asset?.id || null
                            : null;
                        const hasSelectedAsset = Boolean(selectedAssetId);
                        const collectionHasSelectedAsset = Boolean(
                          selectedAssetId &&
                          collection.items.some((item) => item.asset?.id === selectedAssetId || item.id === selectedAssetId)
                        );

                        return (
                          <article
                            key={collection.id}
                            className="copilot-workspace-panel copilot-workspace-panel-muted copilot-media-collection-card copilot-future-hover copilot-hover-reveal-group p-4"
                            data-open={isOpen ? 'true' : 'false'}
                          >
                            <p className="copilot-media-collection-kicker">Collection arc</p>
                            <div className="mt-1 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-semibold text-[var(--copilot-text-primary)]">{collection.title}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-[var(--copilot-text-secondary)]">
                                  {collection.description || 'A focused set of reusable recaps for this topic.'}
                                </p>
                              </div>
                              <span className="copilot-revision-pill">{collection.itemCount}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {visibleMetadataPills.map((pill) => (
                                <span key={`${collection.id}-${pill}`} className="copilot-revision-pill">
                                  {pill}
                                </span>
                              ))}
                              {hiddenMetadataCount > 0 ? (
                                <span className="copilot-revision-pill">+{hiddenMetadataCount} more</span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              Files stay hidden until this collection is opened.
                            </p>
                            <div className="mt-auto flex flex-wrap gap-2 pt-4">
                              <Button
                                type="button"
                                className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                                onClick={() => toggleCollectionOpen(collection.id)}
                                disabled={collection.items.length === 0}
                                aria-expanded={isOpen}
                              >
                                {isOpen ? 'Close collection' : 'Open collection'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                                onClick={() => {
                                  const firstItem = collection.items[0] || null;
                                  if (!firstItem) return;
                                  previewEntry(firstItem);
                                  onMediaModeChange('creative_stream');
                                }}
                                disabled={collection.items.length === 0}
                              >
                                Creative angle
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                                onClick={() => addSelectedAssetToCollection(collection.id)}
                                disabled={!hasSelectedAsset || collectionHasSelectedAsset || !onAddAssetToMediaCollection}
                              >
                                {collectionHasSelectedAsset ? 'Asset added' : 'Add selected asset'}
                              </Button>
                            </div>
                          </article>
                        );
                      })}
                    </section>
                    {openedCollection ? (
                      <section className="copilot-workspace-panel copilot-workspace-panel-muted copilot-media-collection-detail-shell mt-4 p-4 md:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="copilot-media-collection-kicker">Opened collection</p>
                            <h4 className="mt-1 text-base font-semibold text-[var(--copilot-text-primary)]">
                              {openedCollection.title} files
                            </h4>
                            <p className="mt-1 text-sm text-[var(--copilot-text-secondary)]">
                              All files for this collection are listed here for clear reading and quick access.
                            </p>
                          </div>
                          <span className="copilot-revision-pill">{openedCollection.itemCount} files</span>
                        </div>
                        <div className="copilot-media-collection-detail-list mt-4">
                          {openedCollection.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="copilot-media-collection-detail-item w-full rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3"
                            >
                              <button
                                type="button"
                                onClick={() => previewEntry(item)}
                                className="w-full text-left"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="line-clamp-1 text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="copilot-revision-pill">#{index + 1}</span>
                                    <span className="copilot-revision-pill">{titleCase(item.mediaKind)}</span>
                                  </div>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                                  {item.summary || item.topic || 'Open this recap file'}
                                </p>
                              </button>
                              {item.asset?.id && onRemoveAssetFromMediaCollection ? (
                                <div className="mt-2 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-7 rounded-full px-3 text-[11px]"
                                    onClick={() => {
                                      void Promise.resolve(onRemoveAssetFromMediaCollection(openedCollection.id, item.asset!.id));
                                    }}
                                  >
                                    Remove from collection
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                            onClick={() => {
                              const firstItem = openedCollection.items[0] || null;
                              if (!firstItem) return;
                              previewEntry(firstItem);
                              onMediaModeChange('study_stream');
                            }}
                            disabled={openedCollection.items.length === 0}
                          >
                            Start study stream
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                            onClick={() => {
                              const firstItem = openedCollection.items[0] || null;
                              if (!firstItem) return;
                              previewEntry(firstItem);
                              onMediaModeChange('creative_stream');
                            }}
                            disabled={openedCollection.items.length === 0}
                          >
                            Creative angle
                          </Button>
                        </div>
                      </section>
                    ) : null}
                  </>
                )}
              </section>
            ) : isMediaAssetsLoading && mediaEntries.length === 0 ? (
              <section className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`media-assets-skeleton-${index}`}
                    className="flex items-start gap-3 rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3.5 py-3"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-[1rem] bg-[var(--copilot-surface-muted)]" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                      <div className="h-3 w-5/6 animate-pulse rounded-full bg-[var(--copilot-surface-muted)]" />
                    </div>
                  </div>
                ))}
              </section>
            ) : filteredMediaItems.length === 0 ? (
              <section className="copilot-empty-state copilot-future-hover copilot-hover-reveal-group max-w-3xl px-6 py-6">
                <p className="text-base font-semibold text-[var(--copilot-text-primary)]">No recap materials in this view yet</p>
                <p className="copilot-hover-reveal-copy text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  {shouldUseRevisionFallback
                    ? 'Save recap-ready revision items and they will appear here automatically.'
                    : 'Save audio recaps, video notes, image explanations, or documents and they will appear here automatically.'}
                </p>
              </section>
            ) : (
              <div className="copilot-media-library-layout grid gap-4 xl:grid-cols-[0.95fr_1.15fr]">
            <section className="copilot-workspace-panel copilot-workspace-panel-muted copilot-media-library-spotlight copilot-media-library-spotlight-shell copilot-future-hover copilot-hover-reveal-group p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="copilot-workspace-eyebrow">Spotlight</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--copilot-text-primary)]">
                    {effectiveSelectedMediaItem?.title || 'Select a recap'}
                  </h3>
                </div>
                {effectiveSelectedMediaItem ? (
                <span className="copilot-revision-pill">{titleCase(effectiveSelectedMediaItem.mediaKind)}</span>
              ) : null}
              </div>

              {effectiveSelectedMediaItem ? (
                <>
                  <div className="mt-3">{renderMediaPreview(effectiveSelectedMediaItem, { compact: true })}</div>
                  <p className="mt-3 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                    {effectiveSelectedMediaItem.keyIdea ||
                      effectiveSelectedMediaItem.summary ||
                      effectiveSelectedMediaItem.topic ||
                      'Keep this recap active inside Media for focused review.'}
                  </p>
                  {selectedLibraryCoachContext ? (
                    <div className="copilot-media-library-spotlight-grid mt-4">
                      <div className="copilot-media-myth-anchor">
                        <p className="copilot-media-myth-story-label">Why keep this active</p>
                        <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                          {selectedLibraryCoachContext.whyNowLine}
                        </p>
                      </div>
                      <div className="copilot-media-myth-story-tile">
                        <p className="copilot-media-myth-story-label">Memory anchor</p>
                        <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                          {selectedLibraryCoachContext.anchorLine}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="copilot-revision-pill">{effectiveSelectedMediaItem.source === 'asset' ? 'Reusable asset' : 'Revision fallback'}</span>
                    {effectiveSelectedMediaItem.subject ? (
                      <span className="copilot-revision-pill">{effectiveSelectedMediaItem.subject}</span>
                    ) : null}
                    {effectiveSelectedMediaItem.topic ? (
                      <span className="copilot-revision-pill">{effectiveSelectedMediaItem.topic}</span>
                    ) : null}
                    {effectiveSelectedMediaItem.collectionTitle ? (
                      <span className="copilot-revision-pill">{effectiveSelectedMediaItem.collectionTitle}</span>
                    ) : null}
                    {effectiveSelectedMediaItem.createdAt ? (
                      <span className="copilot-revision-pill">{formatWorkspaceDate(effectiveSelectedMediaItem.createdAt)}</span>
                    ) : null}
                  </div>
                  {effectiveSelectedMediaItem.quickCheck ? (
                    <div className="copilot-next-move-panel mt-4 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
                        Quick check
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-primary)]">
                        {effectiveSelectedMediaItem.quickCheck}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {!spotlightSourceIsActive ? (
                      <Button
                        type="button"
                        className="copilot-control-commit h-10 rounded-full px-4 text-sm"
                        onClick={() => activateMediaSource(effectiveSelectedMediaItem)}
                      >
                        Use source
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          className="copilot-control-commit h-10 rounded-full px-4 text-sm"
                          onClick={() => openChallengeFromSource(effectiveSelectedMediaItem)}
                        >
                          Challenge from source
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-control-nav h-10 rounded-full px-4 text-sm"
                          onClick={() => openTeachBackFromSource(effectiveSelectedMediaItem)}
                        >
                          Explain from source
                        </Button>
                        <Button
                          type="button"
                          variant={spotlightSourceIsPinned ? 'ghost' : 'outline'}
                          className="copilot-control-utility h-10 rounded-full px-4 text-sm"
                          onClick={() =>
                            spotlightSourceIsPinned
                              ? unpinMediaSource(effectiveSelectedMediaItem)
                              : pinMediaSource(effectiveSelectedMediaItem)
                          }
                        >
                          {spotlightSourceIsPinned ? 'Unpin source' : 'Pin source'}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </section>

            <section className="copilot-workspace-panel copilot-media-library-list copilot-future-hover copilot-hover-reveal-group p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="copilot-workspace-eyebrow">Media library</p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">Choose a recap to continue from</h3>
                </div>
                <span className="copilot-revision-pill">{filteredMediaItems.length}</span>
              </div>

              <div className="copilot-media-library-grid mt-4 grid gap-3 md:grid-cols-2">
                {filteredMediaItems.map((item) => {
                  const active = effectiveSelectedMediaItem?.id === item.id;
                  const cardCoachContext = buildStudyCoachContext({ entry: item });
                  const cardSourceActive = Boolean(activeSourceEntry && activeSourceEntry.id === item.id);
                  const cardSourcePinned = Boolean(pinnedSourceEntry && pinnedSourceEntry.id === item.id);
                  return (
                    <article
                      key={item.id}
                      className={`copilot-media-library-card copilot-future-hover rounded-xl border px-3 py-3 transition ${
                        active
                          ? 'border-[var(--copilot-action-primary)]/45 bg-[var(--copilot-action-primary)]/10'
                          : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]'
                      }`}
                      data-active={active ? 'true' : 'false'}
                    >
                      <p className="copilot-media-library-kicker">{active ? 'Now held in focus' : 'Ready to re-open'}</p>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</h3>
                        <span className="copilot-revision-pill">{titleCase(item.mediaKind)}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {item.summary || item.topic || 'Keep this recap active inside Media.'}
                      </p>
                      <div className="mt-3 rounded-[0.95rem] border border-[var(--copilot-soft-line)]/80 bg-white/70 px-3 py-2">
                        <p className="copilot-media-myth-story-label">Anchor</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-primary)]">
                          {cardCoachContext.anchorLine}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                          onClick={() => onSelectMediaItem(item.id)}
                          disabled={active}
                        >
                          {active ? 'Open now' : 'Open'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                          onClick={() => {
                            if (!cardSourceActive) {
                              activateMediaSource(item);
                              return;
                            }
                            if (cardSourcePinned) {
                              unpinMediaSource(item);
                              return;
                            }
                            openChallengeFromSource(item);
                          }}
                          aria-pressed={cardSourcePinned}
                        >
                          {!cardSourceActive ? 'Use source' : cardSourcePinned ? 'Unpin source' : 'Challenge source'}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export function FullscreenCopilotUI(props: FullscreenCopilotUIProps) {
  const shellVariant = props.shellVariant || 'fullscreen';
  const isWidgetShell = shellVariant === 'widget';
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWidgetWorkspaceSheetOpen, setIsWidgetWorkspaceSheetOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? document.body : null
  );
  const widgetSurfaceProfile = useCopilotSurfaceProfile(shellRef, 'comfortable');
  const effectiveSurfaceProfile: CopilotSurfaceProfile = isWidgetShell ? widgetSurfaceProfile : 'expanded';
  const widgetDestinationVisibility = resolveWidgetDestinationVisibility(effectiveSurfaceProfile);
  const isDesktopSidebarCollapsed = !props.sidebarExpanded;
  const isCopilotDarkMode = props.copilotTheme === 'dark';
  const isFocusModeActive = props.modeFlags.focus === true;
  const isExamModeActive = props.modeFlags.exam === true;
  const modePillLabel = '';
  const shellStudyModeAttr = isFocusModeActive && isExamModeActive
    ? 'focus_exam'
    : isExamModeActive
      ? 'exam'
      : isFocusModeActive
        ? 'focus'
        : 'standard';

  useEffect(() => {
    props.onSurfaceProfileChange?.(effectiveSurfaceProfile);
  }, [effectiveSurfaceProfile, props.onSurfaceProfileChange]);

  useEffect(() => {
    if (isWidgetShell) return;
    if (portalTarget) return;
    setPortalTarget(document.body);
  }, [isWidgetShell, portalTarget]);

  useEffect(() => {
    if (isWidgetShell) return;
    if (!portalTarget) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWidgetShell, portalTarget]);

  const destinationMeta = useMemo(() => {
    const sessionFocus = String(props.sessionTitle || props.tutorState?.activeTopic || 'New Study Session').trim();
    const modeLabel = modePillLabel;
    if (props.destination === 'new_session') {
      return {
        title: 'Study Workspace',
        subtitle: [sessionFocus, modeLabel].filter(Boolean).join(' · '),
      };
    }
    if (props.destination === 'search') {
      return {
        title: 'Search workspace',
        subtitle: 'Find chats, revision notes, and study materials quickly.',
      };
    }
    if (props.destination === 'revision') {
      return {
        title: 'Revision workspace',
        subtitle: '',
      };
    }
    if (props.destination === 'media') {
      return {
        title: 'Media workspace',
        subtitle: 'Library + collections with Study Stream and Creative Stream for reusable learning media.',
      };
    }
    if (props.destination === 'exam') {
      return {
        title: 'Exam workspace',
        subtitle: 'Timed and strict assessment flow with concise review discipline.',
      };
    }
    if (props.destination === 'focus') {
      return {
        title: 'Focus workspace',
        subtitle: 'Low-noise assessment flow with calm pacing and targeted support.',
      };
    }
    return {
      title: 'Growth workspace',
      subtitle: 'Track weak topics, revision habits, and long-term learning progress.',
    };
  }, [
    props.destination,
    props.sessionTitle,
    props.tutorState?.activeTopic,
    modePillLabel,
  ]);

  const weakTopicCount = Number(props.metacognitiveProfile?.recurringErrorPatterns?.length || 0);
  const workspaceRevisionItems = useMemo(
    () => uniqueRevisionItems(props.revisionOverview),
    [props.revisionOverview]
  );
  const shellMeta = useMemo(() => {
    const sessionFocus = String(props.sessionTitle || props.tutorState?.activeTopic || 'New Study Session').trim();
    if (props.destination === 'new_session') {
      return {
        eyebrow: 'Study studio',
        title: 'Study Studio',
        description: 'Tutor-guided learning with clear next moves, strong continuity, and fast retrieval.',
        icon: Sparkles,
        status: sessionFocus,
      };
    }
    if (props.destination === 'search') {
      return {
        eyebrow: 'Search studio',
        title: 'Search Studio',
        description: 'Find past chats, saved notes, and revision materials without losing context.',
        icon: Search,
        status: 'Search history, revision, and recap materials',
      };
    }
    if (props.destination === 'revision') {
      return {
        eyebrow: 'Revision space',
        title: 'Revision Space',
        description: 'A focused workspace for active review, correction, and recall.',
        icon: BookMarked,
        status: 'Structured revision with clear next actions',
      };
    }
    if (props.destination === 'media') {
      return {
        eyebrow: 'Media intelligence',
        title: 'Media Studio',
        description: 'Library with built-in collections, plus Study Stream and Creative Stream in one learning media workspace.',
        icon: PlayCircle,
        status: 'Media that converts into revision progress',
      };
    }
    if (props.destination === 'exam') {
      return {
        eyebrow: 'Exam studio',
        title: 'Exam Workspace',
        description: 'Timed and disciplined question flow built for exam readiness.',
        icon: Target,
        status: 'Strict policy, concise checks, clear completion output',
      };
    }
    if (props.destination === 'focus') {
      return {
        eyebrow: 'Focus studio',
        title: 'Focus Workspace',
        description: 'Calmer assessment flow with one-step guidance and reduced noise.',
        icon: Compass,
        status: 'Steady pacing, targeted hints, and confidence-safe review',
      };
    }
    return {
      eyebrow: 'Growth studio',
      title: 'Growth Studio',
      description: 'Track weak topics, revision momentum, and long-term learning intelligence.',
      icon: BarChart3,
      status: 'Patterns, progress, and next best moves',
    };
  }, [props.destination, props.sessionTitle, props.tutorState?.activeTopic]);
  const shellStatusPills = [
    props.revisionOverview?.totalItems ? `${props.revisionOverview.totalItems} saved` : null,
    weakTopicCount > 0 ? `${weakTopicCount} weak topics` : null,
  ].filter(Boolean) as string[];
  const reminderNotifications = useMemo(() => {
    const revisionCount = Number(props.revisionOverview?.totalItems || 0);
    const reminders = [
      {
        id: 'daily',
        title: 'Daily reminder',
        detail: 'Complete one study card and one reflection before your next break.',
      },
      {
        id: 'workspace',
        title: 'Next best step',
        detail: `Continue in ${destinationMeta.title} to keep momentum and memory retention high.`,
      },
    ];

    if (revisionCount > 0) {
      reminders.push({
        id: 'revision',
        title: 'Revision queue ready',
        detail: `You have ${revisionCount} saved ${revisionCount === 1 ? 'item' : 'items'} ready for a quick recap.`,
      });
    }

    if (weakTopicCount > 0) {
      reminders.push({
        id: 'growth',
        title: 'Growth alert',
        detail: `${weakTopicCount} weak ${weakTopicCount === 1 ? 'topic needs' : 'topics need'} focused practice today.`,
      });
    }

    return reminders;
  }, [destinationMeta.title, props.revisionOverview?.totalItems, weakTopicCount]);
  const unreadReminderCount = reminderNotifications.length;
  const renderReminderList = () => (
    <div className="space-y-2.5">
      <div className="border-b border-[var(--copilot-soft-line)]/80 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
          Notifications
        </p>
        <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
          Daily reminders and key study updates for {props.studentName}.
        </p>
      </div>
      <div className="space-y-1.5">
        {reminderNotifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-xl border border-white/20 bg-white/55 px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{notification.title}</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">{notification.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
  const ShellMetaIcon = shellMeta.icon;
  const showWorkspaceHeaderDetails = props.destination !== 'new_session';
  const useMinimalWorkspaceHeader = true;
  const showWorkspaceEyebrow = showWorkspaceHeaderDetails && !useMinimalWorkspaceHeader;
  const showWorkspaceDescription = showWorkspaceHeaderDetails && !useMinimalWorkspaceHeader;
  const showWorkspaceStatus = showWorkspaceDescription && Boolean(shellMeta.status);
  const showWorkspaceStatusPills = showWorkspaceHeaderDetails && !useMinimalWorkspaceHeader && shellStatusPills.length > 0;
  const widgetNavItems = useMemo(
    () => [
      {
        id: 'new_session' as const,
        label: 'Study',
        icon: Sparkles,
        meta: null,
      },
      {
        id: 'revision' as const,
        label: 'Revision',
        icon: BookMarked,
        meta: null,
      },
      {
        id: 'media' as const,
        label: 'Media',
        icon: PlayCircle,
        meta: null,
      },
      {
        id: 'growth' as const,
        label: 'Growth',
        icon: TrendingUp,
        meta: null,
      },
    ],
    []
  );
  const isWidgetDestinationActive = useCallback(
    (destination: FullscreenCopilotDestination) => props.destination === destination,
    [props.destination]
  );

  const openSessionFromWorkspace = (session: ChatSession) => {
    props.onDestinationChange('new_session');
    props.handleContinueChat(session);
    setIsMobileMenuOpen(false);
  };

  const openSessionById = (sessionId: string) => {
    const session = props.history.find((entry) => entry.id === sessionId);
    if (!session) return;
    openSessionFromWorkspace(session);
  };
  const effectiveRevisionSearchQuery = props.searchQuery ?? props.revisionSearchQuery;
  const effectiveSelectedRevisionCollection = props.selectedCollection ?? props.selectedRevisionCollection;
  const effectiveSelectedRevisionItemId = props.selectedItemId ?? props.selectedRevisionItemId;
  const effectiveSetSelectedRevisionItemId = props.onSelectItemId ?? props.onSelectRevisionItemId;

  const openRevisionItemFromWorkspace = (item: RevisionItem) => {
    props.onDestinationChange('revision');
    if (item.collectionId && props.revisionOverview?.collections?.length) {
      const collection = props.revisionOverview.collections.find((candidate) => candidate.id === item.collectionId) || null;
      props.onSelectRevisionCollection(collection);
    } else {
      props.onSelectRevisionCollection(null);
    }
    effectiveSetSelectedRevisionItemId(item.id);
    props.onSelectedMediaItemChange(item.id);
    setIsMobileMenuOpen(false);
  };

  const openRevisionCollectionFromWorkspace = (collection: RevisionCollection) => {
    props.onDestinationChange('revision');
    props.onSelectRevisionCollection(collection);
    const fallbackItem =
      collection.previewItems?.[0] ||
      props.revisionOverview?.recentItems.find((item) => item.collectionId === collection.id) ||
      props.revisionOverview?.ungroupedItems.find((item) => item.collectionId === collection.id) ||
      null;
    effectiveSetSelectedRevisionItemId(fallbackItem?.id || null);
    props.onSelectedMediaItemChange(fallbackItem?.id || null);
    setIsMobileMenuOpen(false);
  };

  const openMediaItemFromWorkspace = (item: RevisionItem, mode?: MediaWorkspaceMode | null) => {
    props.onDestinationChange('media');
    props.onMediaModeChange(mode || 'study_stream');
    const collection =
      item.collectionId && props.revisionOverview?.collections?.length
        ? props.revisionOverview.collections.find((candidate) => candidate.id === item.collectionId) || null
        : null;
    props.onSelectRevisionCollection(collection);
    effectiveSetSelectedRevisionItemId(item.id);
    props.onSelectedMediaItemChange(item.id);
    setIsMobileMenuOpen(false);
  };

  const launchWorkspacePrompt = (prompt: string, intent = 'workspace_action') => {
    const trimmedPrompt = String(prompt || '').trim();
    if (!trimmedPrompt) return;
    props.onDestinationChange('new_session');
    props.onSend(null, trimmedPrompt, {
      ignoreSelectedFile: true,
      preserveInput: true,
      inputOrigin: 'text',
      composerIntent: intent,
    });
    setIsMobileMenuOpen(false);
  };

  const executeGrowthActionFromWorkspace = async (plan: GrowthActionPlan) => {
    const execution = executeGrowthActionPlan(plan, uniqueRevisionItems(props.revisionOverview), {
      onOpenRevisionItem: openRevisionItemFromWorkspace,
      onOpenMediaItem: openMediaItemFromWorkspace,
      onOpenPrompt: launchWorkspacePrompt,
      onDestinationChange: props.onDestinationChange,
      onMediaModeChange: props.onMediaModeChange,
      onGrowthSectionChange: props.onGrowthSectionChange,
    });
    return {
      executed: execution.executed,
      reason: execution.reason,
    };
  };

  const handleWidgetDestinationSelect = (destination: FullscreenCopilotDestination) => {
    props.onDestinationChange(destination);
    setIsWidgetWorkspaceSheetOpen(false);
  };

  const renderWorkspaceStage = (surfaceKind: CopilotSurfaceKind, surfaceProfile: CopilotSurfaceProfile) => (
    <main className="copilot-main-stage relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${surfaceKind}:${surfaceProfile}:${props.destination}`}
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {props.destination === 'new_session' ? (
            <>
              <FullscreenChatView
                messages={props.messages}
                isLoading={props.isLoading}
                isStreaming={props.isStreaming}
                studentName={props.studentName}
                surfaceKind={surfaceKind}
                surfaceProfile={surfaceProfile}
                onEditMessage={props.onEditMessage}
                tutorState={props.tutorState}
                onTutorQuickAction={props.onTutorQuickAction}
                onRunResearch={props.onRunResearch}
                onRecommendVideos={props.onRecommendVideos}
                onContinueFromVideo={props.onContinueFromVideo}
                onSelectionAction={props.onSelectionAction}
                onMetacognitiveChoice={props.onMetacognitiveChoice}
                onOpenPracticePad={props.onOpenPracticePad}
              />

              <div className="copilot-backdrop-surface sticky bottom-0 z-20 border-t backdrop-blur-xl">
                <FullscreenComposer
                  input={props.input}
                  setInput={props.setInput}
                  isLoading={props.isLoading}
                  isStreaming={props.isStreaming}
                  onSend={props.onSend}
                  onStopGenerating={props.onStopGenerating}
                  selectedFiles={props.selectedFiles}
                  handleFileChange={props.handleFileChange}
                  handleRemoveFile={props.handleRemoveFile}
                  fileInputRef={props.fileInputRef}
                  forceWebSearch={props.forceWebSearch}
                  setForceWebSearch={props.setForceWebSearch}
                  includeVideos={props.includeVideos}
                  setIncludeVideos={props.setIncludeVideos}
                  level={props.level}
                  setLevel={props.setLevel}
                  languageHint={props.languageHint}
                  setLanguageHint={props.setLanguageHint}
                  isVoiceProcessing={props.voiceController.state !== 'idle'}
                  onVoiceToggle={props.onVoiceModeStart}
                  onPlusAction={props.onPlusAction}
                  onPlusMenuOpenChange={props.onPlusMenuOpenChange}
                  onSearchWorkspace={() => props.onDestinationChange('search')}
                  modeFlags={props.modeFlags}
                  onClearFocusMode={props.onClearFocusMode}
                  onClearExamMode={props.onClearExamMode}
                  onClearResearchMode={props.onClearResearchMode}
                  surfaceKind={surfaceKind}
                  surfaceProfile={surfaceProfile}
                  devLatencyDiagnostics={props.devLatencyDiagnostics}
                  recentFiles={props.recentFiles}
                  recentFilesModalOpen={props.recentFilesModalOpen}
                  onRecentFilesModalOpenChange={props.onRecentFilesModalOpenChange}
                  onAttachRecentFile={props.onAttachRecentFile}
                  researchStatus={props.researchStreamStatus}
                  selectedContext={props.selectedComposerContext}
                  onClearSelectedContext={props.onClearSelectedComposerContext}
                  inputPlaceholderOverride={props.composerPlaceholderOverride}
                  focusSignal={props.composerFocusSignal}
                />
              </div>
            </>
          ) : null}

          {props.destination === 'search' ? (
            <SearchWorkspace
              query={props.historySearchQuery}
              setQuery={props.setHistorySearchQuery}
              history={props.history}
              isHistoryLoading={props.isHistoryLoading}
              historyError={props.historyError}
              revisionOverview={props.revisionOverview}
              isRevisionLoading={props.isRevisionLoading}
              revisionError={props.revisionError}
              onOpenSession={openSessionFromWorkspace}
              onOpenRevisionCollection={openRevisionCollectionFromWorkspace}
              onOpenRevisionItem={openRevisionItemFromWorkspace}
              onOpenMediaItem={openMediaItemFromWorkspace}
            />
          ) : null}

          {props.destination === 'revision' ? (
            <RevisionTab
              overview={props.revisionOverview}
              searchQuery={effectiveRevisionSearchQuery}
              setSearchQuery={props.setRevisionSearchQuery}
              isLoading={props.isRevisionLoading}
              errorMessage={props.revisionError}
              selectedCollection={effectiveSelectedRevisionCollection}
              selectedItemId={effectiveSelectedRevisionItemId}
              collectionItems={props.selectedRevisionItems}
              isCollectionLoading={props.isRevisionCollectionLoading}
              groupingSuggestions={props.groupingSuggestions}
              isGroupingSuggestionsLoading={props.isGroupingSuggestionsLoading}
              onSelectCollection={props.onSelectRevisionCollection}
              onSelectItemId={effectiveSetSelectedRevisionItemId}
              onContinueChat={props.onContinueFromRevisionItemSession}
              onTogglePin={props.onToggleRevisionPin}
              onUpdateMastery={props.onUpdateRevisionMastery}
              onSaveStudentNote={props.onSaveRevisionStudentNote}
              onUpdateCollection={props.onUpdateRevisionCollection}
              onDeleteCollection={props.onDeleteRevisionCollection}
              onUpdateItem={props.onUpdateRevisionItem}
              onUpdateItemsBatch={props.onUpdateRevisionItemsBatch}
              onDeleteItem={props.onDeleteRevisionItem}
              onQuizItem={props.onQuizRevisionItem}
              onBreakdownItem={props.onBreakdownRevisionItem}
              onSimilarQuestionItem={props.onSimilarQuestionRevisionItem}
              onApplyGroupingSuggestion={props.onApplyRevisionGroupingSuggestion}
              onRetryLoad={props.onRetryRevisionLoad}
              onReviseWithSteadfast={props.onStartRevisionMode}
              layoutMode="workspace"
              showExpandAction={false}
            />
          ) : null}

          {props.destination === 'media' ? (
            <MediaWorkspace
              revisionOverview={props.revisionOverview}
              mediaAssets={props.mediaAssets}
              isMediaAssetsLoading={props.isMediaAssetsLoading}
              mediaAssetsError={props.mediaAssetsError}
              onRetryMediaAssetsLoad={props.onRetryMediaAssetsLoad}
              mediaStream={props.mediaStream}
              mediaStreamMeta={props.mediaStreamMeta}
              isMediaStreamLoading={props.isMediaStreamLoading}
              mediaStreamError={props.mediaStreamError}
              onRetryMediaStreamLoad={props.onRetryMediaStreamLoad}
              mediaCollections={props.mediaCollections}
              isMediaCollectionsLoading={props.isMediaCollectionsLoading}
              mediaCollectionsError={props.mediaCollectionsError}
              onRetryMediaCollectionsLoad={props.onRetryMediaCollectionsLoad}
              onRecordMediaInteraction={props.onRecordMediaInteraction}
              onCreateMediaCollection={props.onCreateMediaCollection}
              onAddAssetToMediaCollection={props.onAddAssetToMediaCollection}
              onRemoveAssetFromMediaCollection={props.onRemoveAssetFromMediaCollection}
              onOpenRevisionItem={openRevisionItemFromWorkspace}
              onOpenSession={openSessionById}
              mediaFilter={props.mediaFilter}
              onMediaFilterChange={props.onMediaFilterChange}
              mediaMode={props.mediaMode}
              onMediaModeChange={props.onMediaModeChange}
              selectedMediaItemId={props.selectedMediaItemId}
              onSelectMediaItem={props.onSelectedMediaItemChange}
              mediaPreferenceProfile={props.mediaPreferenceProfile}
              onLaunchPrompt={launchWorkspacePrompt}
              modeFlags={props.modeFlags}
              surfaceKind={surfaceKind}
            />
          ) : null}

          {props.destination === 'exam' ? (
            <AssessmentWorkspace
              workspaceMode="exam"
              onDestinationChange={props.onDestinationChange}
            />
          ) : null}

          {props.destination === 'focus' ? (
            <AssessmentWorkspace
              workspaceMode="focus"
              onDestinationChange={props.onDestinationChange}
            />
          ) : null}

          {props.destination === 'growth' ? (
            <GrowthWorkspacePanel
              revisionOverview={props.revisionOverview}
              metacognitiveProfile={props.metacognitiveProfile}
              activeSection={props.activeGrowthSection}
              onSectionChange={props.onGrowthSectionChange}
              onResolveGrowthAction={props.onResolveGrowthAction}
              onExecuteGrowthActionPlan={executeGrowthActionFromWorkspace}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </main>
  );

  if (isWidgetShell) {
    const primaryWidgetNavItems = widgetNavItems.filter((item) =>
      widgetDestinationVisibility.primaryDestinations.includes(item.id)
    );
    const overflowWidgetNavItems = widgetNavItems.filter((item) =>
      widgetDestinationVisibility.overflowDestinations.includes(item.id)
    );

    return (
      <div
        ref={shellRef}
        data-copilot-widget-shell
        data-copilot-theme={props.copilotTheme || 'light'}
        data-copilot-theme-preference={props.copilotThemePreference}
        data-copilot-destination={props.destination}
        data-study-atmosphere={props.studyAtmospherePreference?.presetId || 'midnight_scholar'}
        data-study-atmosphere-advanced={props.studyAtmospherePreference?.useAdvanced ? 'true' : 'false'}
        data-study-mode={shellStudyModeAttr}
        data-copilot-surface-profile={effectiveSurfaceProfile}
        data-copilot-navigation-style={DEFAULT_WIDGET_NAVIGATION_STYLE}
        className={`relative flex h-full min-h-0 flex-col overflow-hidden copilot-theme-scope copilot-learning-shell${
          isCopilotDarkMode ? ' copilot-theme-dark' : ''
        }`}
        style={props.copilotThemeStyle}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
          <div className="absolute -left-16 top-[-8%] h-44 w-44 rounded-full bg-sky-500/12 blur-3xl" />
          <div className="absolute -right-20 top-[8%] h-56 w-56 rounded-full bg-cyan-400/14 blur-3xl" />
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
            animate={{ opacity: [0.2, 0.9, 0.2], x: ['-12%', '12%', '-12%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <AnimatePresence>
          {props.view === 'preferences' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] flex items-center justify-center p-3 sm:p-4"
            >
              <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" onClick={() => props.setView('chat')} />
              <motion.div
                initial={{ scale: 0.97, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: 20 }}
                className="copilot-surface relative flex h-full max-h-[96%] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border shadow-2xl"
              >
                <div className="flex-1 overflow-y-auto">
                  <PreferencesForm
                    profileData={props.profile}
                    onSave={props.handleSavePreferences}
                    isSaving={props.isSavingProfile}
                    isLoading={props.isProfileLoading}
                    onClose={() => props.setView('chat')}
                    copilotThemePreference={props.copilotThemePreference}
                    resolvedCopilotTheme={props.copilotTheme || 'dark'}
                    studyAtmospherePreference={props.studyAtmospherePreference}
                    variant="embedded"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
          {props.view === 'practice_pad' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] flex items-center justify-center p-3 sm:p-4"
            >
              <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" onClick={() => props.setView('chat')} />
              <motion.div
                initial={{ scale: 0.97, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: 20 }}
                className="copilot-surface relative flex h-full max-h-[96%] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border shadow-2xl"
              >
                <PracticePad
                  studentName={props.studentName}
                  sessionId={props.activeSession?.id}
                  context={props.practicePadContext}
                  metacognitiveProfile={props.metacognitiveProfile}
                  metacognitiveState={props.metacognitiveState}
                  onCheckStep={props.onCheckPracticeStep}
                  onRecordReflection={props.onRecordPracticeReflection}
                  onSaveWorking={props.onSavePracticePadWorking}
                  onContinueInChat={({ message, tutorAction }) => {
                    props.setView('chat');
                    props.onDestinationChange('new_session');
                    props.onSend(null, message, {
                      tutorAction,
                      ignoreSelectedFile: true,
                      preserveInput: true,
                      inputOrigin: 'text',
                      composerIntent: 'practice_pad_followup',
                    });
                  }}
                  onClose={() => props.setView('chat')}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="copilot-backdrop-surface sticky top-0 z-20 overflow-hidden border-b border-white/10 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
          <div className="pointer-events-none absolute -right-10 top-[-45%] h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="relative px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl" />
                  <AssistantLogo size={effectiveSurfaceProfile === 'compact' ? 28 : 32} className="relative border-0 bg-transparent p-0 shadow-none" />
                </div>
                <div className="min-w-0">
                  {showWorkspaceEyebrow ? <p className="copilot-workspace-eyebrow">{shellMeta.eyebrow}</p> : null}
                  <h2 className="truncate text-base font-semibold text-[var(--copilot-text-primary)] sm:text-lg">{destinationMeta.title}</h2>
                  {showWorkspaceDescription ? (
                    <>
                      <p className="line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)] sm:text-sm">
                        {destinationMeta.subtitle || shellMeta.description}
                      </p>
                      {showWorkspaceStatus ? (
                        <span className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/55 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                          <ShellMetaIcon className="h-3.5 w-3.5 text-cyan-600" />
                          <span className="truncate">{shellMeta.status}</span>
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {props.destination !== 'media' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => props.onOpenPracticePad?.()}
                    className="copilot-icon-button copilot-control-utility h-9 w-9 rounded-2xl border border-white/10 bg-white/55 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80"
                    title="Open Practice Pad"
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                ) : null}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="copilot-icon-button copilot-control-utility h-9 w-9 rounded-2xl border border-white/10 bg-white/55 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80"
                      title="Notifications"
                    >
                      <span className="relative inline-flex">
                        <Bell className="h-4 w-4" />
                        {unreadReminderCount > 0 ? (
                          useMinimalWorkspaceHeader ? (
                            <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.55)]" />
                          ) : (
                            <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-600 px-1 text-[9px] font-semibold text-white">
                              {Math.min(unreadReminderCount, 9)}
                            </span>
                          )
                        ) : null}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="copilot-surface w-[320px] rounded-2xl border p-3">
                    {renderReminderList()}
                  </PopoverContent>
                </Popover>
                {props.onEnterFullscreen ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="copilot-enter-fullscreen"
                    onClick={props.onEnterFullscreen}
                    className="copilot-icon-button copilot-control-utility h-9 w-9 rounded-2xl border border-cyan-200/60 bg-[linear-gradient(135deg,rgba(240,249,255,0.92),rgba(224,242,254,0.82))] shadow-[0_12px_28px_rgba(14,165,233,0.18)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(14,165,233,0.24)]"
                    title="Expand to fullscreen"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            {showWorkspaceStatusPills ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {shellStatusPills.map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(226,232,240,0.55))] px-3 py-1 text-[11px] font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                  >
                    <span className="mr-2 inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.7)]" />
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {widgetDestinationVisibility.useRail ? (
            <aside className="copilot-backdrop-surface copilot-widget-rail relative hidden w-[96px] shrink-0 overflow-hidden border-r border-white/10 px-2 py-2.5 md:flex md:flex-col">
              <div className="copilot-widget-rail-main">
                {primaryWidgetNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isWidgetDestinationActive(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`widget-nav-${item.id}`}
                      onClick={() => handleWidgetDestinationSelect(item.id)}
                      className={cn(
                        'copilot-hover-reveal-group copilot-widget-rail-item',
                        isActive ? 'copilot-widget-rail-item-active' : null
                      )}
                    >
                      <span className="copilot-widget-rail-item-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="copilot-widget-rail-item-label">{item.label}</span>
                      {item.meta ? <span className="copilot-widget-rail-item-meta">{item.meta}</span> : null}
                    </button>
                  );
                })}
              </div>
              {props.onOpenPreferences ? (
                <div className="copilot-widget-rail-settings-slot">
                  <button
                    type="button"
                    data-testid="widget-nav-settings"
                    onClick={props.onOpenPreferences}
                    className="copilot-hover-reveal-group copilot-widget-rail-item copilot-widget-rail-item-settings"
                    title="Settings"
                    aria-label="Settings"
                  >
                    <span className="copilot-widget-rail-item-icon">
                      <Settings className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              ) : null}
            </aside>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {!widgetDestinationVisibility.useRail ? (
              <div className="copilot-backdrop-surface border-b border-white/10 px-3 py-2 sm:px-4">
                <div className="flex items-center gap-2 overflow-x-auto rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.66),rgba(226,232,240,0.38))] p-1.5 pb-1.5 shadow-[0_18px_32px_rgba(15,23,42,0.06)]">
                  {primaryWidgetNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isWidgetDestinationActive(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`widget-nav-${item.id}`}
                        onClick={() => handleWidgetDestinationSelect(item.id)}
                        className={cn(
                          'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all',
                          isActive
                            ? 'border-cyan-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(224,242,254,0.78))] text-slate-950 shadow-[0_10px_24px_rgba(14,165,233,0.16)]'
                            : 'border-transparent bg-transparent text-[var(--copilot-text-secondary)] hover:bg-white/80 hover:text-slate-950'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                        {item.meta ? <span className="text-[10px] text-[var(--copilot-text-tertiary)]">{item.meta}</span> : null}
                      </button>
                    );
                  })}

                  {overflowWidgetNavItems.length > 0 ? (
                    <Sheet open={isWidgetWorkspaceSheetOpen} onOpenChange={setIsWidgetWorkspaceSheetOpen}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          data-testid="widget-workspace-sheet-trigger"
                          className="copilot-control-utility h-10 shrink-0 rounded-full border border-white/10 bg-white/60 px-3 text-xs shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white/82"
                        >
                          <Workflow className="mr-2 h-3.5 w-3.5" />
                          Workspace
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="copilot-surface border px-4 py-4">
                        <SheetHeader className="pb-3">
                          <SheetTitle className="text-left text-base font-semibold text-[var(--copilot-text-primary)]">
                            More workspace modes
                          </SheetTitle>
                        </SheetHeader>
                        <div className="grid gap-2">
                          {overflowWidgetNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isWidgetDestinationActive(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                data-testid={`widget-nav-${item.id}`}
                                onClick={() => handleWidgetDestinationSelect(item.id)}
                                className={cn(
                                  'flex items-center justify-between rounded-[1.35rem] border px-3 py-3 text-left transition-all',
                                  isActive
                                    ? 'border-cyan-200/70 bg-[linear-gradient(145deg,rgba(240,249,255,0.96),rgba(224,242,254,0.78))] text-slate-950 shadow-[0_12px_28px_rgba(14,165,233,0.16)]'
                                    : 'border-[var(--copilot-soft-line)]/70 text-[var(--copilot-text-secondary)] hover:bg-white/70 hover:text-slate-950'
                                )}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span>
                                    <span className="block text-sm font-medium">{item.label}</span>
                                    {item.meta ? <span className="text-xs text-[var(--copilot-text-tertiary)]">{item.meta}</span> : null}
                                  </span>
                                </span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </SheetContent>
                    </Sheet>
                  ) : null}
                </div>
              </div>
            ) : null}

            {renderWorkspaceStage('widget', effectiveSurfaceProfile)}
          </div>
        </div>
      </div>
    );
  }

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      data-copilot-theme={props.copilotTheme || 'light'}
      data-copilot-theme-preference={props.copilotThemePreference}
      data-copilot-destination={props.destination}
      data-study-atmosphere={props.studyAtmospherePreference?.presetId || 'midnight_scholar'}
      data-study-atmosphere-advanced={props.studyAtmospherePreference?.useAdvanced ? 'true' : 'false'}
      data-study-mode={shellStudyModeAttr}
      className={`fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-300 copilot-theme-scope copilot-learning-shell${
        isCopilotDarkMode ? ' copilot-theme-dark' : ''
      }`}
      style={props.copilotThemeStyle}
    >
      <AnimatePresence>
        {props.view === 'preferences' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" onClick={() => props.setView('chat')} />
            <motion.div
              initial={{ scale: 0.97, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 20 }}
              className="copilot-surface relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto">
                <PreferencesForm
                  profileData={props.profile}
                  onSave={props.handleSavePreferences}
                  isSaving={props.isSavingProfile}
                  isLoading={props.isProfileLoading}
                  onClose={() => props.setView('chat')}
                  copilotThemePreference={props.copilotThemePreference}
                  resolvedCopilotTheme={props.copilotTheme || 'dark'}
                  studyAtmospherePreference={props.studyAtmospherePreference}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
        {props.view === 'practice_pad' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" onClick={() => props.setView('chat')} />
            <motion.div
              initial={{ scale: 0.97, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 20 }}
              className="copilot-surface relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl"
            >
              <PracticePad
                studentName={props.studentName}
                sessionId={props.activeSession?.id}
                context={props.practicePadContext}
                metacognitiveProfile={props.metacognitiveProfile}
                metacognitiveState={props.metacognitiveState}
                onCheckStep={props.onCheckPracticeStep}
                onRecordReflection={props.onRecordPracticeReflection}
                onSaveWorking={props.onSavePracticePadWorking}
                onContinueInChat={({ message, tutorAction }) => {
                  props.setView('chat');
                  props.onDestinationChange('new_session');
                  props.onSend(null, message, {
                    tutorAction,
                    ignoreSelectedFile: true,
                    preserveInput: true,
                    inputOrigin: 'text',
                    composerIntent: 'practice_pad_followup',
                  });
                }}
                onClose={() => props.setView('chat')}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="copilot-backdrop-surface copilot-shell-header sticky top-0 z-20 border-b backdrop-blur-2xl">
        <div className="flex min-h-[4.9rem] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="copilot-icon-button copilot-control-utility h-10 w-10 rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="copilot-surface w-[300px] border p-0">
                  <SheetHeader className="border-b px-4 py-4">
                    <SheetTitle className="copilot-primary-text flex items-center gap-2 text-sm font-semibold">
                      <AssistantLogo size={22} className="border-0 bg-transparent p-0 shadow-none" />
                      Steadfast AI
                    </SheetTitle>
                  </SheetHeader>
                  <FullscreenSidebar
                    destination={props.destination}
                    onDestinationChange={(destination) => {
                      props.onDestinationChange(destination);
                      setIsMobileMenuOpen(false);
                    }}
                    onStartNewSession={() => {
                      props.onStartNewSession();
                      setIsMobileMenuOpen(false);
                    }}
                    revisionOverview={props.revisionOverview}
                    historyCount={props.history.length}
                    isRevisionLoading={props.isRevisionLoading}
                    growthHintCount={weakTopicCount}
                    historySessions={props.sidebarHistorySessions}
                    activeSessionId={props.activeSession?.id || null}
                    historyRailLoading={props.sidebarHistoryLoading}
                    historyRailLoadingMore={props.sidebarHistoryLoadingMore}
                    historyRailError={props.sidebarHistoryError}
                    historyRailHasMore={props.sidebarHistoryHasMore}
                    onOpenSession={openSessionFromWorkspace}
                    onLoadMoreHistory={props.onSidebarHistoryLoadMore}
                    onReloadHistory={props.onSidebarHistoryRefresh}
                    isCollapsed={false}
                    onOpenPreferences={() => {
                      props.onOpenPreferences();
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <AssistantLogo size={34} className="border-0 bg-transparent p-0 shadow-none" />
          </div>

          <div className="flex items-center gap-2">
            <div className="copilot-surface-muted copilot-secondary-text hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium md:flex">
              <span className="copilot-avatar-accent inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold">
                {props.studentName.charAt(0).toUpperCase()}
              </span>
              <span>{props.studentName}</span>
            </div>

            {props.destination !== 'media' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => props.onOpenPracticePad?.()}
                className="copilot-icon-button copilot-control-utility hidden h-10 w-10 rounded-full lg:inline-flex"
                title="Open Practice Pad"
              >
                <NotebookPen className="h-4.5 w-4.5" />
              </Button>
            ) : null}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="copilot-icon-button copilot-control-utility h-10 w-10 rounded-full"
                  title="Notifications"
                >
                  <span className="relative inline-flex">
                    <Bell className="h-4.5 w-4.5" />
                    {unreadReminderCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.55)]" />
                    ) : null}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="copilot-surface w-[320px] rounded-2xl border p-3">
                {renderReminderList()}
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={props.onExitFullscreen}
              className="copilot-icon-button copilot-control-utility h-10 w-10 rounded-full"
              title="Exit fullscreen"
            >
              <Minimize2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden lg:flex">
          <FullscreenSidebar
            destination={props.destination}
            onDestinationChange={props.onDestinationChange}
            onStartNewSession={props.onStartNewSession}
            revisionOverview={props.revisionOverview}
            historyCount={props.history.length}
            isRevisionLoading={props.isRevisionLoading}
            growthHintCount={weakTopicCount}
            historySessions={props.sidebarHistorySessions}
            activeSessionId={props.activeSession?.id || null}
            historyRailLoading={props.sidebarHistoryLoading}
            historyRailLoadingMore={props.sidebarHistoryLoadingMore}
            historyRailError={props.sidebarHistoryError}
            historyRailHasMore={props.sidebarHistoryHasMore}
            onOpenSession={openSessionFromWorkspace}
            onLoadMoreHistory={props.onSidebarHistoryLoadMore}
            onReloadHistory={props.onSidebarHistoryRefresh}
            isCollapsed={isDesktopSidebarCollapsed}
            onToggleCollapse={() => props.onSidebarExpandedChange(isDesktopSidebarCollapsed)}
            onOpenPreferences={props.onOpenPreferences}
          />
        </div>

        {renderWorkspaceStage('fullscreen', 'expanded')}
      </div>
    </div>
    ,
    portalTarget
  );
}


