// ─── Shared Types for Media-Stream Modules ─────────────────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

export type TutorArtifact = {
  id: string;
  kind: 'image' | 'pdf' | 'text';
  label: string;
  summary: string;
  extractedText?: string;
  questions?: string[];
  topics?: string[];
  headings?: string[];
  keywords?: string[];
  actionableTasks?: string[];
  subject?: string;
  artifactType?: string;
  denseText?: boolean;
  ocrConfidence?: 'low' | 'medium' | 'high';
  createdAt?: string;
};

export type TutorState = {
  activeTopic?: string;
  activeSubject?: string;
  activeArtifactSummary?: string;
  activeArtifactLabels?: string[];
  activeVideoId?: string;
  activeVideoTitle?: string;
  activeVideoSummary?: string;
  activeVideoConcepts?: string[];
  activeVideoWhyRecommended?: string;
  lastIntent?: string;
  misconceptionFocus?: string[];
  masteryFocus?: string[];
  learnerStage?: 'support' | 'developing' | 'secure';
  recommendedMode?: 'guided' | 'practice' | 'challenge';
  recentGoals?: string[];
  islamicContext?: string;
  semanticMemory?: string;
  teacherCorrections?: string[];
  studentPreferences?: string[];
  evidenceReferences?: string[];
  visibleFocusLabel?: string;
  visibleStageLabel?: string;
  awaitingStudentAttempt?: boolean;
  currentStudyMode?: string;
  systemNotices?: SystemNotice[];
  sessionLanguageState?: SessionLanguageState;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  reflectionSignal?: ReflectionSignal | null;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  preferredSupportPatterns?: string[];
  updatedAt?: string;
};

export type SystemNoticeSeverity = 'info' | 'warning' | 'error';

export type SystemNotice = {
  code: string;
  message: string;
  severity: SystemNoticeSeverity;
};

export type SessionLanguageState = Record<string, unknown>;
export type MetacognitiveStateSnapshot = Record<string, unknown>;
export type ReflectionSignal = Record<string, unknown>;
export type TopicMasteryState = Record<string, unknown>;
export type WeakTopicRecoveryState = Record<string, unknown>;

export type TutorQuickAction = 'hint' | 'breakdown' | 'summarize' | 'practice' | 'save';
export type TutorActionId = 'ask' | TutorQuickAction;
export type SelectionSourceKind = 'assistant_message' | 'user_message' | 'artifact' | 'video_summary' | 'study_material';
export type FullscreenCopilotDestination = 'new_session' | 'search' | 'revision' | 'media' | 'growth' | 'exam' | 'focus';
export type FullscreenPlusAction = 'add_files' | 'recent_files' | 'focus_mode' | 'exam_mode' | 'web_research';
export type FullscreenStudyMode = 'standard' | 'focus' | 'exam';
export type CopilotSurfaceKind = 'widget' | 'fullscreen';
export type CopilotSurfaceProfile = 'compact' | 'cozy' | 'comfortable' | 'expanded';
export type CopilotNavigationStyle = 'progressive_compact';
export type FullscreenModeFlags = { focus?: boolean; exam?: boolean; research?: boolean };
export type FullscreenMediaFilter = 'all' | 'audio' | 'video' | 'image' | 'document';
export type FullscreenMediaMode = 'library' | 'study_stream' | 'creative_stream';
export type FullscreenGrowthSection = 'overview' | 'weak_topics' | 'mistake_journal' | 'daily_feed' | 'study_plans' | 'mastery_trends';

export type GrowthActionIntent =
  | 'open_revision'
  | 'start_guided_session'
  | 'review_recap'
  | 'quiz_me'
  | 'simpler_example'
  | 'open_study_stream'
  | 'open_creative_stream'
  | 'similar_question'
  | 'practice_again'
  | 'view_worked_step'
  | 'continue_plan';

export type GrowthActionDestination = 'revision' | 'media' | 'new_session' | 'growth' | 'exam' | 'focus';

export type GrowthActionPlan = {
  intent: GrowthActionIntent;
  destination: GrowthActionDestination;
  mediaMode?: 'study_stream' | 'creative_stream' | null;
  revisionItemId?: string | null;
  topic?: string | null;
  subject?: string | null;
  title?: string | null;
  prompt?: string | null;
  composerIntent?: string | null;
};

export type FullscreenWorkspaceContext = {
  activeDestination?: FullscreenCopilotDestination;
  studyMode?: FullscreenStudyMode;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  navigationStyle?: CopilotNavigationStyle;
  modeFlags?: FullscreenModeFlags;
  plusAction?: FullscreenPlusAction | null;
  plusDrawerOpen?: boolean;
  sidebarExpanded?: boolean;
  researchModeRequested?: boolean;
  revisionCollectionId?: string | null;
  revisionItemId?: string | null;
  mediaItemId?: string | null;
  mediaFilter?: FullscreenMediaFilter;
  mediaMode?: FullscreenMediaMode;
  growthSection?: FullscreenGrowthSection;
  chatSessionId?: string | null;
  historySearchQuery?: string;
  revisionSearchQuery?: string;
};

export type AssistantCardKind =
  | 'guided_step' | 'hint' | 'breakdown' | 'summary' | 'explanation'
  | 'practice' | 'correction' | 'source_supported';
export type SourceConfidence = 'high' | 'medium' | 'limited';
export type UiTone = 'calm' | 'encouraging' | 'corrective' | 'reflective';

export type MessagePresentationMeta = {
  cardKind?: AssistantCardKind;
  nextStepPrompt?: string;
  suggestedActions?: TutorQuickAction[];
  awaitingStudentAttempt?: boolean;
  basedOnArtifactLabel?: string;
  basedOnVideoTitle?: string;
  sourceConfidence?: SourceConfidence;
  uiTone?: UiTone;
  reflectionPrompt?: string;
  reflectionPromptType?: MetacognitivePromptType;
  reflectCard?: MetacognitivePrompt | null;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  confidenceCheckSuggested?: boolean;
  errorCheckSuggested?: boolean;
  transferCheckSuggested?: boolean;
  strategyCheckSuggested?: boolean;
};

export type MetacognitivePromptType = string;
export type MetacognitivePrompt = Record<string, unknown>;

export type MessageEditMeta = {
  edited?: boolean;
  editedAt?: string;
  originalContent?: string;
  editHistory?: Array<{ content: string; editedAt: string }>;
};

export type TutorActionRequest = {
  id: TutorActionId;
  sourceMessageId?: string;
  sourceText?: string;
  selectedText?: string;
  sourceVideoId?: string;
  sourceVideoTitle?: string;
  sourceArtifactLabel?: string;
  sourceArtifactSummary?: string;
  invokedFrom?: 'assistant_card' | 'selection_menu' | 'composer';
  selectionSourceKind?: SelectionSourceKind;
  sourceType?: string;
  sourceDocumentId?: string;
  selectionRange?: { startOffset?: number; endOffset?: number; length?: number };
  inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
  composerIntent?: string;
  linkedArtifactId?: string;
};

export type TutorRevisionNote = {
  id: string;
  text: string;
  topic?: string;
  sourceMessageId?: string;
  createdAt: string;
  subject?: string;
  artifactLabels?: string[];
  basedOnVideoTitle?: string;
  summary?: string;
  contentType?: string;
  collectionId?: string;
  collectionTitle?: string;
};

export type TutorActionUiMeta = {
  actionId?: TutorActionId;
  statusLine?: string;
  nextStep?: string;
  savedRevisionNote?: TutorRevisionNote;
};

export type SemanticSessionSnapshot = {
  semanticMemory?: string;
  teacherCorrections?: string[];
  studentPreferences?: string[];
  evidenceReferences?: string[];
};

export type VideoTutorSnapshot = {
  activeVideoSummary?: string;
  activeVideoConcepts?: string[];
  activeVideoWhyRecommended?: string;
  evidenceReferences?: string[];
  transcriptAvailable?: boolean;
};

export type VoiceLanguageMode = 'english' | 'swahili' | 'arabic' | 'english_sw' | 'arabic_english';

export interface MediaAsset {
  id: string;
  userId: string;
  assetKind: string;
  title: string;
  summary?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  sessionId?: string | null;
  sourceChatSessionId?: string | null;
  sourceChatMessageId?: string | null;
  tags?: string[];
  language?: string | null;
  sourceUrl?: string | null;
  videoId?: string | null;
  videoProvider?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  transcript?: string | null;
  transcriptSnippet?: string | null;
  recapText?: string | null;
  keyPoints?: string[];
  quickChecks?: string[];
  bestUse?: string | null;
  keyIdea?: string | null;
  nextMove?: string | null;
  schoolLevel?: string | null;
  weakTopicRelevance?: string | null;
  revisionRelevance?: string | null;
  recommendedScore?: number | null;
  streamRankScore?: number | null;
  metadata?: Record<string, unknown> | null;
  safetyStatus?: string | null;
  sourceTrust?: string | null;
  dedupeKey?: string | null;
  revisionItemId?: string | null;
  isCompleted?: boolean | null;
  isHelpful?: boolean | null;
  interactionCount?: number | null;
  completionCount?: number | null;
  collectionIds?: string[];
  lastReviewedAt?: string | null;
  lastPlayedAt?: string | null;
  lastOpenedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  examRelevance?: string | null;
}

export type MediaCollectionPayload = {
  id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  description?: string | null;
  itemCount: number;
  items: MediaAsset[];
  nextAssetId?: string | null;
  progressLabel?: string | null;
};

export type MediaStreamPayload = {
  asset: MediaAsset;
  rankScore: number;
  reason: string;
  nextMove: string;
  quickCheck: string;
  studyGuide?: {
    whyNow: string;
    cue: string;
    nextStep: string;
    lineupReason: string;
  } | null;
};

export type MediaStreamNoticePayload = {
  id: string;
  tone: 'info' | 'quality' | 'seed' | 'refresh';
  message: string;
};

export type MediaStreamDeckMetaPayload = {
  modeIdentity: string;
  supportLabel: string;
  lineupLabel: string;
  replenishes: boolean;
  refillBatchSize: number;
  seedTopics: string[];
  sourceHealth: {
    youtubeFetched: boolean;
    vimeoFetched: boolean;
    usedCache: boolean;
  } | null;
};

export type MediaStreamEmptyStatePayload = {
  title: string;
  body: string;
  hintChips: string[];
  primaryActionLabel: string | null;
  primaryActionMode: 'library' | 'study_stream' | 'creative_stream' | null;
};

export type MediaStreamRankingContext = {
  activeTopic?: string | null;
  weakTopics: string[];
  examMode: boolean;
  focusMode: boolean;
  preferredKind?: string | null;
  streamMode?: 'study' | 'creative';
  preferredRecapType?: 'audio' | 'video' | 'visual' | 'mixed' | null;
  shortFormSupport?: 'concept_intuition' | 'worked_example' | 'quick_recap' | null;
  allowExternalCreativeSuggestions?: boolean;
  learningNeed?: string | null;
  schoolLevel?: string | null;
  language?: string | null;
  activeRevisionItemId?: string | null;
  dueNowRevisionItemIds?: string[];
  needsAttentionRevisionItemIds?: string[];
  continueRevisionItemIds?: string[];
  recentRevisionItemIds?: string[];
  revisionSeedTopics?: string[];
};

export const VALID_TUTOR_ACTIONS = new Set<TutorActionId>(['ask', 'hint', 'breakdown', 'summarize', 'practice', 'save']);

export const MAX_TUTOR_ARTIFACT_PREVIEW_CHARS = 1400;
export const CACHE_VERSION = 'v2';
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_HISTORY_MESSAGES = 24;
export const MAX_HISTORY_CHARS = 14000;
export const MAX_VOICE_SESSIONS_PER_DAY = 3;
export const MAX_VOICE_SECONDS_PER_SESSION = 180;
export const MAX_VOICE_BALANCE_SPEND_SECONDS = 240;
export const MAX_VOICE_SECONDS_PER_DAY = MAX_VOICE_SESSIONS_PER_DAY * MAX_VOICE_SECONDS_PER_SESSION;
export const MAX_DOCUMENT_UPLOADS_PER_24H = 2;
export const DOCUMENT_UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_TTS_VOICE = 'alloy';
export const MAX_MEDIA_DATA_URL_BYTES = 2_000_000;
export const EDUCATIONAL_IMAGE_BLOCKLIST = /\b(nude|nudity|porn|explicit|sex|sexy|fetish|gore|blood|violent|violence|nsfw|weapon|drugs?)\b/i;
export const EDUCATIONAL_IMAGE_ALLOWLIST =
  /\b(diagram|labeled|labelled|timeline|concept map|mind map|flowchart|chart|table|illustration|study|worksheet|classroom|biology|chemistry|physics|math|mathematics|geography|history|literature|business|ict|coding|islamic|arabic|english|kiswahili|science|revision)\b/i;
