import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import prisma from '../utils/prismaClient';
import { getRedisClient } from '../lib/redis';
import pinecone from '../lib/vectorClient';
import { OpenAI } from 'openai';
import { runSummarizationTask, runEmbeddingTask, runPersonalizationTask } from '../workers';
import type {
  ConversationState,
  DetectedInputLanguage,
  LearningSupportMode,
  MetacognitiveErrorType,
  MetacognitiveProfile,
  MetacognitivePrompt,
  MetacognitivePromptType,
  MetacognitiveStateSnapshot,
  ReflectionSignal,
  SessionLanguageState,
  SimplicityLevel,
  SupportedLearningLanguage,
  TopicMasteryState,
  VoiceBehaviorProfile,
  VideoRecommendationIntent,
  WeakTopicRecoveryState,
} from '../lib/types';
import {
  RevisionContentTypeSchema,
  RevisionSaveModeSchema,
  RevisionSaveTypeSchema,
} from '../lib/types';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHash } from 'crypto';
import { runFlow } from '@genkit-ai/flow';

// ✅ IMPORT THE BRAIN & PREFERENCE SERVICE
import { getOrCreateCopilotPreferences } from '../services/aiPreferenceService';
import {
  authorizeVoiceSession,
  getVoiceBalanceSeconds,
  getVoiceBalanceSummary,
  startVoiceSession,
  stopVoiceSession,
} from '../services/voiceLedgerService';
import {
  buildExtendedRevisionOverview,
  generateRevisionAudioRecap,
  getRevisionGroupingSuggestions,
  getRevisionProgressOverview,
  getRevisionQueue,
  recordRevisionReviewEvent,
  runRevisionItemAction,
  startRevisionMode,
  startGuidedRevisionSession,
  continueGuidedRevisionSession,
  deleteRevisionItem,
  updateRevisionItem,
  updateRevisionItemsBatch,
  applyRevisionGroupingSuggestion,
} from '../services/revisionLearningService';
import {
  buildMediaAssetDedupeKey,
  CORE_MEDIA_ASSET_KINDS,
  createMediaAsset,
  isCoreMediaAssetKind,
  linkMediaAssetToRevision,
  listMediaAssets,
  recordMediaAssetInteraction,
  type MediaAsset,
  type MediaAssetKind,
  type MediaAssetInteractionAction,
} from '../services/mediaAssetService';
import {
  addMediaAssetToCollection,
  createMediaCollection,
  listMediaCollections,
  removeMediaAssetFromCollection,
  updateMediaCollection,
} from '../services/mediaCollectionService';
import { recapGenerationService } from '../services/recapGenerationService';
import {
  completeStudyGoal,
  createSemesterPlan,
  createStudyPlanGoal,
  createStudyPlan,
  generateAdaptiveStudyPlan,
  getAcademicMemory,
  getConceptDependencies,
  getGrowthDailyFeed,
  getInterventionEffectiveness,
  getLearningProfile,
  getMasteryPathway,
  getSafeProgressSummary,
  getSchoolSafeReport,
  getSemesterPlanDetails,
  getSemesterPlans,
  getStudyGoals,
  getStudyPlanDetails,
  getStudyPlans,
  getTutorInterventionSuggestions,
  getTutorPolicyDecision,
  getWeakTopics,
  getWhyThisNext,
  recordDailyFeedInteraction,
  recordInterventionEffect,
  setStudyPlanLifecycle,
  updateStudyPlan,
  updateStudyGoal,
} from '../services/studySupportService';
import {
  getGrowthMasteryTrends,
  getGrowthMistakeJournal,
  getGrowthOverview,
  getGrowthStudyPlans,
  getGrowthWeakTopics,
} from '../services/growthIntelligenceService';
import { runResearchMode } from '../services/researchModeService';
import {
  getVideoContextSummary,
  recommendEducationalVideos,
} from '../services/videoRecommendationService';
import { buildCreativeDeck } from '../services/creativeDeckService';
import { buildCreativeInteractionModel } from '../services/creativeInteractionService';
import {
  getGrowthActionFunnelSummary,
  getLearningEffectivenessSummary,
  recordLearningEffectEvent,
} from '../services/learningEffectivenessService';
import { recordMasteryEvidenceSignal } from '../services/masteryInferenceService';
import { getProductConstitutionHealth } from '../services/constitutionHealthService';
import { getFounderTruthSummary } from '../services/founderTruthService';
import {
  chooseMetacognitivePrompt,
  getMetacognitiveProfile,
  mergeMetacognitiveSnapshot,
  recordMetacognitiveEvent,
} from '../services/metacognitionService';
import { buildLearnerLoopState } from '../services/learnerLoopService';
import {
  buildAssistantTurnPipeline,
  type AssistantResponseMeta,
} from '../services/assistantTurnPipelineService';
import { checkPracticePadStep } from '../services/practicePadService';
import {
  answerAssessmentQuestion,
  finishAssessmentSession,
  getAssessmentResults,
  getAssessmentSession,
  navigateAssessmentSession,
  pauseAssessmentSession,
  requestAssessmentHint,
  resumeAssessmentSession,
  startAssessmentSession,
} from '../services/assessmentSessionService';
import {
  createRevisionCollection,
  deleteRevisionCollection,
  getRevisionCollectionDetails,
  getRevisionItemDetails,
  getRevisionOverview,
  saveRevisionItem,
  updateRevisionCollection,
} from '../services/revisionService';
import { getRevisionGraphAnalytics } from '../services/revisionGraphService';
import { logger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';
import { detectSafetyRisk } from '../services/safetyRiskService';
import { notifyCounselor } from '../services/safetyNotifier';
import { requireRole, type UserRole } from '../lib/rbac';
import { recordTurnLatency } from '../services/latencyService';
import {
  buildAttachmentPromptSummary,
  extractTextFromPdfWithOcrFallback,
  isLikelyDenseTextRequest,
  runImageOcrAssist,
} from '../../../AI/ai/flows/emotional-ai-copilot.attachments.js';
import { getYoutubeTranscriptFlow } from '../../../AI/ai/flows/get-youtube-transcript';
import { isTrustedSource } from '../../../AI/lib/research/source-trust';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pineconeIndex = pinecone ? pinecone.Index(process.env.PINECONE_INDEX || '') : null;
let emotionalAICopilotModulePromise: Promise<typeof import('../../../AI/ai/flows/emotional-ai-copilot')> | null = null;
let ensureCopilotPreferencesMetadataPromise: Promise<void> | null = null;

async function getEmotionalAICopilot() {
  if (!emotionalAICopilotModulePromise) {
    emotionalAICopilotModulePromise = import('../../../AI/ai/flows/emotional-ai-copilot');
  }
  const module = await emotionalAICopilotModulePromise;
  return module.emotionalAICopilot;
}

const uploadDir = process.env.STEADFAST_UPLOAD_DIR
  ? path.resolve(process.env.STEADFAST_UPLOAD_DIR)
  : path.join(os.tmpdir(), 'steadfast-ai', 'uploads');

// Configure multer for audio uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = path
        .basename(file.originalname || 'audio.webm')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `audio-${Date.now()}-${safeOriginalName}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// 📉 SPECIALIZED RATE LIMITERS (Limited Per Student ID, not IP, to support School NAT)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 requests per minute per student
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'AI processing limit reached. Please wait a minute.' },
  validate: { default: false }
});

const sttLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many voice-to-text requests. Please slow down.' },
  validate: { default: false }
});

const ttsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => (req.user?.id || req.ip || 'anon').toString(),
  message: { message: 'Too many text-to-voice requests. Please slow down.' },
  validate: { default: false }
});

type AuthedRequest = Request & { user?: any };

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

const MAX_MESSAGE_CHARS = 4000;
const MAX_TTS_CHARS = 4000;
const MAX_HISTORY_MESSAGES = 24;
const MAX_HISTORY_CHARS = 14000;
const MAX_INTERESTS = 30;
const CACHE_VERSION = 'v2';
const MAX_TUTOR_ARTIFACT_PREVIEW_CHARS = 1400;

type TutorArtifact = {
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

type TutorState = {
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

type TutorQuickAction = 'hint' | 'breakdown' | 'summarize' | 'practice' | 'save';
type TutorActionId = 'ask' | TutorQuickAction;
type SelectionSourceKind = 'assistant_message' | 'user_message' | 'artifact' | 'video_summary' | 'study_material';
type FullscreenCopilotDestination = 'new_session' | 'search' | 'revision' | 'media' | 'growth' | 'exam' | 'focus';
type FullscreenPlusAction = 'add_files' | 'recent_files' | 'focus_mode' | 'exam_mode' | 'web_research';
type FullscreenStudyMode = 'standard' | 'focus' | 'exam';
type CopilotSurfaceKind = 'widget' | 'fullscreen';
type CopilotSurfaceProfile = 'compact' | 'cozy' | 'comfortable' | 'expanded';
type CopilotNavigationStyle = 'progressive_compact';
type FullscreenModeFlags = {
  focus?: boolean;
  exam?: boolean;
  research?: boolean;
};
type FullscreenMediaFilter = 'all' | 'audio' | 'video' | 'image' | 'document';
type FullscreenMediaMode = 'library' | 'study_stream' | 'creative_stream';
type FullscreenGrowthSection = 'overview' | 'weak_topics' | 'mistake_journal' | 'daily_feed' | 'study_plans' | 'mastery_trends';
type GrowthActionIntent =
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
type GrowthActionDestination = 'revision' | 'media' | 'new_session' | 'growth' | 'exam' | 'focus';
type GrowthActionPlan = {
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
type FullscreenWorkspaceContext = {
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
type AssistantCardKind =
  | 'guided_step'
  | 'hint'
  | 'breakdown'
  | 'summary'
  | 'explanation'
  | 'practice'
  | 'correction'
  | 'source_supported';
type SourceConfidence = 'high' | 'medium' | 'limited';
type UiTone = 'calm' | 'encouraging' | 'corrective' | 'reflective';
type SystemNoticeSeverity = 'info' | 'warning' | 'error';

type SystemNotice = {
  code: string;
  message: string;
  severity: SystemNoticeSeverity;
};

type MessagePresentationMeta = {
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

type MessageEditMeta = {
  edited?: boolean;
  editedAt?: string;
  originalContent?: string;
  editHistory?: Array<{ content: string; editedAt: string }>;
};

type TutorActionRequest = {
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
  selectionRange?: {
    startOffset?: number;
    endOffset?: number;
    length?: number;
  };
  inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
  composerIntent?: string;
  linkedArtifactId?: string;
};

type TutorRevisionNote = {
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

type TutorActionUiMeta = {
  actionId?: TutorActionId;
  statusLine?: string;
  nextStep?: string;
  savedRevisionNote?: TutorRevisionNote;
};

const VALID_TUTOR_ACTIONS = new Set<TutorActionId>([
  'ask',
  'hint',
  'breakdown',
  'summarize',
  'practice',
  'save',
]);

type SemanticSessionSnapshot = {
  semanticMemory?: string;
  teacherCorrections?: string[];
  studentPreferences?: string[];
  evidenceReferences?: string[];
};

type VideoTutorSnapshot = {
  activeVideoSummary?: string;
  activeVideoConcepts?: string[];
  activeVideoWhyRecommended?: string;
  evidenceReferences?: string[];
  transcriptAvailable?: boolean;
};
const MAX_VOICE_SESSIONS_PER_DAY = 3;
const MAX_VOICE_SECONDS_PER_SESSION = 180;
const MAX_VOICE_BALANCE_SPEND_SECONDS = 240;
const MAX_VOICE_SECONDS_PER_DAY = MAX_VOICE_SESSIONS_PER_DAY * MAX_VOICE_SECONDS_PER_SESSION;
const MAX_DOCUMENT_UPLOADS_PER_24H = 2;
const DOCUMENT_UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTS_VOICE = 'alloy';
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
const ALLOWED_TTS_VOICES = new Set(['alloy', 'sage', 'ash', 'verse', 'coral']);
type VoiceLanguageMode = 'english' | 'swahili' | 'arabic' | 'english_sw' | 'arabic_english';
const createLatencyTurnId = () => `backend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const safeString = (value: unknown) => (typeof value === 'string' ? value : '');
const MAX_MEDIA_DATA_URL_BYTES = 2_000_000;
const EDUCATIONAL_IMAGE_BLOCKLIST = /\b(nude|nudity|porn|explicit|sex|sexy|fetish|gore|blood|violent|violence|nsfw|weapon|drugs?)\b/i;
const EDUCATIONAL_IMAGE_ALLOWLIST =
  /\b(diagram|labeled|labelled|timeline|concept map|mind map|flowchart|chart|table|illustration|study|worksheet|classroom|biology|chemistry|physics|math|mathematics|geography|history|literature|business|ict|coding|islamic|arabic|english|kiswahili|science|revision)\b/i;

const clampMediaText = (value: string, maxChars = 1200) => {
  const normalized = safeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function extractMediaKeyPoints(sourceText: string, topicHint?: string): string[] {
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

function buildMediaQuickChecks(topic: string): string[] {
  const cleanTopic = safeString(topic).trim() || 'this topic';
  return [
    `In one sentence, what is the main idea in ${cleanTopic}?`,
    `What is one common mistake to avoid in ${cleanTopic}?`,
  ];
}

type MediaCollectionPayload = {
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

type MediaStreamPayload = {
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

type MediaStreamNoticePayload = {
  id: string;
  tone: 'info' | 'quality' | 'seed' | 'refresh';
  message: string;
};

type MediaStreamDeckMetaPayload = {
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

type MediaStreamEmptyStatePayload = {
  title: string;
  body: string;
  hintChips: string[];
  primaryActionLabel: string | null;
  primaryActionMode: 'library' | 'study_stream' | 'creative_stream' | null;
};

type MediaStreamRankingContext = {
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

function getMediaKindGroup(asset: MediaAsset): 'audio' | 'video' | 'image' | 'explainer' | 'collection' | 'document' {
  const kind = safeString(asset.assetKind).toLowerCase();
  if (kind === 'audio_recap') return 'audio';
  if (kind === 'video_recap') return 'video';
  if (kind === 'generated_image' || kind === 'annotated_image') return 'image';
  if (kind === 'visual_explainer' || kind === 'worksheet_explainer' || kind === 'media_card') return 'explainer';
  if (kind === 'media_collection_item') return 'collection';
  return 'document';
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRecencyBoost(updatedAt?: string | null): number {
  const date = parseIsoDate(updatedAt);
  if (!date) return 0;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return Math.max(0, Math.round(22 * Math.exp(-days / 18)));
}

function normalizeTopicLike(value?: string | null): string {
  return safeString(value).trim().toLowerCase();
}

function parseNumericSignal(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

function parseQueryBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
}

function parseQueryList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => safeString(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function parsePositiveInt(value: unknown, fallback: number, min = 1, max = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

async function resolveMediaSourceChatContext(args: {
  userId: string;
  sessionId?: string | null;
  sourceMessageId?: string | null;
  revisionItemId?: string | null;
}): Promise<{ sourceChatSessionId: string | null; sourceChatMessageId: string | null }> {
  const userId = safeString(args.userId).trim();
  if (!userId) return { sourceChatSessionId: null, sourceChatMessageId: null };

  let sourceChatSessionId = safeString(args.sessionId).trim() || null;
  let sourceChatMessageId = safeString(args.sourceMessageId).trim() || null;
  const revisionItemId = safeString(args.revisionItemId).trim() || null;

  if (sourceChatSessionId) {
    const hasSession = await prisma.chatSession.count({
      where: {
        id: sourceChatSessionId,
        studentId: userId,
      },
    });
    if (!hasSession) sourceChatSessionId = null;
  }

  if (sourceChatMessageId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; sessionId: string }>>(
      `
        SELECT m."id", m."sessionId"
        FROM "ChatMessage" m
        INNER JOIN "ChatSession" s
          ON s."id" = m."sessionId"
        WHERE m."id" = $1
          AND s."studentId" = $2
        LIMIT 1
      `,
      sourceChatMessageId,
      userId
    );
    const message = rows[0] || null;
    if (message) {
      sourceChatMessageId = safeString(message.id).trim() || sourceChatMessageId;
      if (!sourceChatSessionId) {
        sourceChatSessionId = safeString(message.sessionId).trim() || null;
      }
    } else {
      sourceChatMessageId = null;
    }
  }

  if ((!sourceChatSessionId || !sourceChatMessageId) && revisionItemId) {
    const revisionItem = await prisma.revisionItem.findFirst({
      where: {
        id: revisionItemId,
        userId,
      },
      select: {
        sessionId: true,
        sourceMessageId: true,
      },
    });
    if (revisionItem) {
      if (!sourceChatSessionId) {
        sourceChatSessionId = safeString(revisionItem.sessionId).trim() || null;
      }
      if (!sourceChatMessageId) {
        sourceChatMessageId = safeString(revisionItem.sourceMessageId).trim() || null;
      }
    }
  }

  if (sourceChatSessionId && sourceChatMessageId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
        SELECT m."id"
        FROM "ChatMessage" m
        INNER JOIN "ChatSession" s
          ON s."id" = m."sessionId"
        WHERE m."id" = $1
          AND m."sessionId" = $2
          AND s."studentId" = $3
        LIMIT 1
      `,
      sourceChatMessageId,
      sourceChatSessionId,
      userId
    );
    if (!rows[0]) {
      sourceChatMessageId = null;
    }
  }

  return {
    sourceChatSessionId,
    sourceChatMessageId,
  };
}

function mapLearningNeedToVideoIntent(learningNeed?: string | null): VideoRecommendationIntent | null {
  const normalized = safeString(learningNeed).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('worked')) return 'worked_example';
  if (normalized.includes('quick') || normalized.includes('recap')) return 'revision_recap';
  if (normalized.includes('visual') || normalized.includes('intuition')) return 'visual_animation';
  if (normalized.includes('mistake') || normalized.includes('misconception')) return 'misconception_fix';
  if (normalized.includes('beginner') || normalized.includes('simple')) return 'beginner_friendly';
  return 'concept_explainer';
}

function inferCreativeSourceRole(video: { channelTitle?: string | null; title?: string | null; trustTier?: string | null }): string {
  const channel = safeString(video.channelTitle).trim().toLowerCase();
  const title = safeString(video.title).trim().toLowerCase();
  if (channel.includes('khan')) return 'khan_academy';
  if (channel.includes('ted-ed') || channel.includes('ted ed')) return 'ted_ed';
  if (channel.includes('ck-12') || channel.includes('ck12')) return 'ck12';
  if (channel.includes('phet') || title.includes('simulation')) return 'phet';
  return 'youtube_shorts';
}

function buildCreativeTopicSeeds(args: {
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

function deriveCreativeTopicSeedsFromAssets(assets: MediaAsset[]): string[] {
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

function pushStreamNotice(
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

function buildMediaStreamDeckMeta(args: {
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

function buildMediaStreamEmptyState(args: {
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

type GrowthRevisionItem = Awaited<ReturnType<typeof getRevisionOverview>>['recentItems'][number];

function buildStudyTopicSeeds(args: {
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

function buildStudyStreamDeckMeta(args: {
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

function buildStudyStreamEmptyState(args: {
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

function collectRevisionItemsFromOverview(overview: Awaited<ReturnType<typeof getRevisionOverview>>): GrowthRevisionItem[] {
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
  const byId = new Map<string, GrowthRevisionItem>();
  pool.forEach((item) => {
    if (!item?.id) return;
    if (!byId.has(item.id)) byId.set(item.id, item);
  });
  return [...byId.values()];
}

function buildGrowthActionPrompt(intent: GrowthActionIntent, args: { topic?: string | null; title?: string | null }): string | null {
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

function resolveGrowthActionPlan(args: {
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

function getMediaSourceTrustBoost(sourceTrust: string, streamMode: 'study' | 'creative'): number {
  const normalized = sourceTrust.toLowerCase();
  if (normalized.includes('internal')) return streamMode === 'study' ? 16 : 10;
  if (normalized.includes('verified') || normalized.includes('high')) return 14;
  if (normalized.includes('trusted') || normalized.includes('medium')) return 10;
  if (normalized.includes('low')) return 2;
  return 6;
}

function getKindPreferenceBoost(
  kind: ReturnType<typeof getMediaKindGroup>,
  preferredRecapType?: string | null
): number {
  const preferred = safeString(preferredRecapType).trim().toLowerCase();
  if (!preferred || preferred === 'mixed') return 0;
  if (preferred === 'audio') return kind === 'audio' ? 14 : -2;
  if (preferred === 'video') return kind === 'video' ? 14 : -2;
  if (preferred === 'visual') return kind === 'image' || kind === 'explainer' ? 14 : -2;
  return 0;
}

function computeMediaStreamScore(asset: MediaAsset, ctx: MediaStreamRankingContext): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = normalizeTopicLike(asset.topic);
  const subject = normalizeTopicLike(asset.subject);
  const activeTopic = normalizeTopicLike(ctx.activeTopic);
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const kind = getMediaKindGroup(asset);
  const duration = Number(asset.durationSec || parseNumericSignal(metadata.durationSec) || 0);
  const completed = asBool(asset.isCompleted, asBool(metadata.isCompleted, false));
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const streamMode = ctx.streamMode === 'creative' ? 'creative' : 'study';
  const sourceTrust = safeString(asset.sourceTrust || metadata.sourceTrust).trim().toLowerCase();
  const transcriptAvailable = Boolean(safeString(asset.transcript).trim() || safeString(asset.transcriptSnippet).trim());
  const hasExternalSource = Boolean(safeString(asset.sourceUrl).trim());
  const schoolLevel = normalizeTopicLike(asset.schoolLevel || safeString(metadata.schoolLevel).trim());
  const preferredSchoolLevel = normalizeTopicLike(ctx.schoolLevel);
  const assetLanguage = normalizeTopicLike(asset.language || safeString(metadata.language).trim());
  const preferredLanguage = normalizeTopicLike(ctx.language);
  const learningNeed = normalizeTopicLike(ctx.learningNeed || ctx.shortFormSupport);
  const creativeClarityScore = parseNumericSignal(metadata.clarityScore);
  const creativeCreativityScore = parseNumericSignal(metadata.creativityScore);
  const creativeIntuitionScore = parseNumericSignal(metadata.intuitionScore);
  const creativeNoveltyScore = parseNumericSignal(metadata.noveltyScore);
  const creativeCompositeScore = parseNumericSignal(metadata.streamRankScore) / 190;
  const externalProvider = normalizeTopicLike(
    asset.videoProvider ||
      safeString(metadata.externalProvider).trim() ||
      safeString(metadata.externalSourceType).trim()
  );
  const supportHints = normalizeTopicLike(
    [
      safeString(asset.bestUse).trim(),
      safeString(asset.nextMove).trim(),
      safeString(asset.summary).trim(),
      safeString(metadata.learningNeed).trim(),
      safeString(metadata.shortFormSupport).trim(),
      ...(Array.isArray(asset.tags) ? asset.tags : []),
    ].join(' ')
  );
  const recommendedScore =
    parseNumericSignal(asset.streamRankScore) ||
    parseNumericSignal(asset.recommendedScore) ||
    parseNumericSignal(metadata.streamRankScore) ||
    parseNumericSignal(metadata.recommendedScore);

  let score = 20;
  score += recommendedScore;
  score += getRecencyBoost(asset.updatedAt);
  if (!completed) score += 14;
  if (helpful) score += 10;
  if (activeTopic && (topic.includes(activeTopic) || activeTopic.includes(topic))) score += 34;
  if (weakTopics.some((weak) => weak && (topic.includes(weak) || weak.includes(topic) || subject.includes(weak)))) score += 36;
  if (ctx.preferredKind && ctx.preferredKind === kind) score += 12;
  score += getKindPreferenceBoost(kind, ctx.preferredRecapType);
  score += getMediaSourceTrustBoost(sourceTrust, streamMode);
  if (transcriptAvailable) score += 6;
  if (preferredSchoolLevel && schoolLevel && (schoolLevel.includes(preferredSchoolLevel) || preferredSchoolLevel.includes(schoolLevel))) {
    score += 8;
  }
  if (preferredLanguage && assetLanguage && preferredLanguage === assetLanguage) score += 8;
  if (learningNeed && supportHints.includes(learningNeed.replace(/_/g, ' '))) score += 10;
  if (ctx.examMode && safeString(asset.examRelevance || metadata.examRelevance).trim()) score += 24;
  if (ctx.focusMode && duration > 0 && duration <= 180) score += 12;
  if (kind === 'video' || kind === 'audio') score += 8;
  if (kind === 'collection') score += 6;
  if (streamMode === 'study') {
    if (asset.revisionItemId) score += 12;
    if (kind === 'video' || kind === 'audio' || kind === 'explainer') score += 4;
  } else {
    if (!isCreativeExternalVideoAsset(asset)) score -= 90;
    if (kind === 'video' || kind === 'explainer' || kind === 'image') score += 10;
    if (hasExternalSource) score += ctx.allowExternalCreativeSuggestions === false ? -8 : 14;
    if (!hasExternalSource) score += 4;
    if (externalProvider.includes('youtube')) score += 10;
    if (externalProvider.includes('vimeo')) score += 8;
    score += Math.round(clamp(creativeClarityScore, 0, 1) * 16);
    score += Math.round(clamp(creativeCreativityScore, 0, 1) * 16);
    score += Math.round(clamp(creativeIntuitionScore, 0, 1) * 14);
    score += Math.round(clamp(creativeNoveltyScore, 0, 1) * 10);
    score += Math.round(clamp(creativeCompositeScore, 0, 1) * 18);
  }
  return Math.round(score);
}

function getStudySpacingBoost(asset: MediaAsset): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const lastTouch =
    safeString(asset.lastReviewedAt).trim() ||
    safeString(asset.lastPlayedAt).trim() ||
    safeString(asset.lastOpenedAt).trim() ||
    safeString(asset.updatedAt).trim() ||
    safeString(metadata.lastTouchedAt).trim();
  const date = parseIsoDate(lastTouch);
  if (!date) return 0;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  if (days >= 1.5 && days <= 8) return 12;
  if (days > 8 && days <= 21) return 8;
  if (days < 0.35) return -8;
  return 0;
}

function computeStudyStreamScore(asset: MediaAsset, ctx: MediaStreamRankingContext): number {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const topic = normalizeTopicLike(asset.topic);
  const subject = normalizeTopicLike(asset.subject);
  const activeTopic = normalizeTopicLike(ctx.activeTopic);
  const weakTopics = ctx.weakTopics.map((entry) => normalizeTopicLike(entry));
  const dueNowIds = new Set((ctx.dueNowRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const needsAttentionIds = new Set((ctx.needsAttentionRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const continueIds = new Set((ctx.continueRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const recentIds = new Set((ctx.recentRevisionItemIds || []).map((entry) => safeString(entry).trim()).filter(Boolean));
  const revisionItemId = safeString(asset.revisionItemId).trim();
  const kind = getMediaKindGroup(asset);
  const helpful = asBool(asset.isHelpful, asBool(metadata.isHelpful, false));
  const completed = asBool(asset.isCompleted, asBool(metadata.isCompleted, false));
  const interactionCount =
    parseNumericSignal(asset.interactionCount) || parseNumericSignal(metadata.interactionCount);
  const completionCount =
    parseNumericSignal(asset.completionCount) || parseNumericSignal(metadata.completionCount);
  const hasInternalTrust =
    normalizeTopicLike(asset.sourceTrust || safeString(metadata.sourceTrust).trim()).includes('internal');
  const activeRevisionItemId = safeString(ctx.activeRevisionItemId).trim();
  const duration = Number(asset.durationSec || parseNumericSignal(metadata.durationSec) || 0);
  const seedTopics = (ctx.revisionSeedTopics || []).map((entry) => normalizeTopicLike(entry));
  const seedMatch = seedTopics.some((seed) => seed && (topic.includes(seed) || seed.includes(topic) || subject.includes(seed)));

  let score = computeMediaStreamScore(asset, { ...ctx, streamMode: 'study' });
  if (revisionItemId) score += 18;
  if (revisionItemId && activeRevisionItemId && revisionItemId === activeRevisionItemId) score += 56;
  if (revisionItemId && dueNowIds.has(revisionItemId)) score += 34;
  if (revisionItemId && needsAttentionIds.has(revisionItemId)) score += 30;
  if (revisionItemId && continueIds.has(revisionItemId)) score += 18;
  if (revisionItemId && recentIds.has(revisionItemId)) score += 10;
  if (seedMatch) score += 10;
  if (helpful) score += 8;
  if (!completed) score += 8;
  if (completed && !helpful && !revisionItemId) score -= 8;
  if (interactionCount > 0) score += Math.min(8, Math.round(interactionCount / 2));
  if (completionCount > 0) score += Math.min(6, completionCount * 2);
  if (hasInternalTrust) score += 6;
  if (kind === 'video' || kind === 'audio') score += 6;
  if (kind === 'image' || kind === 'explainer') score += 3;
  if (kind === 'document') score -= 3;
  if (duration > 0 && duration <= 420) score += 4;
  score += getStudySpacingBoost(asset);

  const weakMatch = weakTopics.some((weak) => weak && (topic.includes(weak) || weak.includes(topic) || subject.includes(weak)));
  const activeMatch = activeTopic && topic && (topic.includes(activeTopic) || activeTopic.includes(topic));
  if (!revisionItemId && !weakMatch && !activeMatch && !seedMatch && !helpful) {
    score -= 18;
  }

  return Math.round(score);
}

function buildStudyStreamReason(asset: MediaAsset, ctx: MediaStreamRankingContext): string {
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

function buildStudyGuide(asset: MediaAsset, ctx: MediaStreamRankingContext, reason: string) {
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

function buildMediaStreamReason(asset: MediaAsset, ctx: MediaStreamRankingContext): string {
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

function buildMediaNextMove(asset: MediaAsset): string {
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

function isCreativeExternalVideoAsset(asset: MediaAsset): boolean {
  const metadata = (asset.metadata || {}) as Record<string, unknown>;
  const provider = safeString(asset.videoProvider || metadata.externalProvider || metadata.externalSourceType).trim().toLowerCase();
  const sourceUrl = safeString(asset.sourceUrl).trim().toLowerCase();
  const videoKind = getMediaKindGroup(asset) === 'video';
  if (!videoKind) return false;
  if (!sourceUrl && !provider) return false;
  if (provider.includes('youtube') || provider.includes('vimeo')) return true;
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be') || sourceUrl.includes('vimeo.com')) return true;
  return false;
}

function buildMediaStream(items: MediaAsset[], ctx: MediaStreamRankingContext, limit = 40): MediaStreamPayload[] {
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

function buildMediaCollections(items: MediaAsset[], limit = 40): MediaCollectionPayload[] {
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

async function ingestCreativeExternalMediaAssets(args: {
  userId: string;
  topicSeeds: string[];
  subject?: string | null;
  learningNeed?: string | null;
  schoolLevel?: string | null;
  language?: string | null;
  sourceChatSessionId?: string | null;
  sourceChatMessageId?: string | null;
  limit: number;
}): Promise<{
  assets: MediaAsset[];
  notices: string[];
  sourceHealth: {
    youtubeFetched: boolean;
    vimeoFetched: boolean;
    usedCache: boolean;
  } | null;
  seedTopics: string[];
}> {
  const sourceChatSessionId = safeString(args.sourceChatSessionId).trim();
  const topicSeeds = Array.from(new Set((args.topicSeeds || []).map((seed) => safeString(seed).trim()).filter(Boolean))).slice(0, 3);
  if (topicSeeds.length === 0) {
    return {
      assets: [],
      notices: [],
      sourceHealth: null,
      seedTopics: [],
    };
  }

  const deck = await buildCreativeDeck({
    query: topicSeeds.join(' '),
    subject: safeString(args.subject).trim() || null,
    topic: topicSeeds[0] || null,
    activeTopic: topicSeeds[0] || null,
    weakTopics: topicSeeds,
    learningNeed: safeString(args.learningNeed).trim() || null,
    language: safeString(args.language).trim() || null,
    schoolLevel: safeString(args.schoolLevel).trim() || null,
    allowYouTube: true,
    allowVimeo: true,
    limit: Math.max(8, Math.min(14, Math.max(1, args.limit))),
  });

  const rankedCandidates = deck.cards.slice(0, Math.max(1, Math.min(args.limit, 12)));
  if (rankedCandidates.length === 0) {
    return {
      assets: [],
      notices: deck.notices,
      sourceHealth: deck.sourceHealth,
      seedTopics: topicSeeds,
    };
  }

  const ingested = await Promise.all(
    rankedCandidates.map(async (card, index) => {
      const interaction = buildCreativeInteractionModel(card, {
        activeTopic: card.topic || topicSeeds[0] || null,
        topic: card.topic || topicSeeds[0] || null,
        subject: safeString(args.subject).trim() || null,
        weakTopics: topicSeeds,
        learningNeed: safeString(args.learningNeed).trim() || null,
        language: safeString(args.language).trim() || null,
      });

      const topicLabel = safeString(card.topic || topicSeeds[0]).trim() || 'current concept';
      const trustTier = safeString(card.trustTier).trim() || 'medium';
      const bestSummary =
        clampMediaText(
          safeString(card.shortSummary).trim() ||
            safeString(card.description).trim() ||
            `External creative support selected for ${topicLabel}.`,
          220
        ) || null;

      return createMediaAsset({
        userId: args.userId,
        assetKind: 'video_recap',
        title: clampMediaText(safeString(card.title).trim() || `${topicLabel} creative support`, 110),
        summary: bestSummary,
        subject: safeString(args.subject).trim() || null,
        topic: topicLabel,
        sessionId: sourceChatSessionId || null,
        sourceChatSessionId: sourceChatSessionId || null,
        sourceChatMessageId: safeString(args.sourceChatMessageId).trim() || null,
        tags: [
          'creative_stream',
          'external',
          card.sourceType,
          card.creativityType,
          safeString(args.learningNeed).trim() || 'concept_intuition',
        ].filter(Boolean),
        language: safeString(card.language || args.language).trim() || null,
        sourceUrl: safeString(card.canonicalUrl).trim() || null,
        videoId: safeString(card.sourceVideoId).trim() || null,
        videoProvider: card.sourceType,
        thumbnailUrl: safeString(card.thumbnailUrl).trim() || null,
        durationSec:
          typeof card.durationSeconds === 'number' && Number.isFinite(card.durationSeconds)
            ? Math.max(30, Math.round(card.durationSeconds))
            : 120 + index * 26,
        transcriptSnippet:
          card.captionsAvailable === true
            ? 'Captions are available for follow-up explanation and quick checks.'
            : null,
        recapText: bestSummary,
        keyPoints: [
          clampMediaText(card.learningGoal, 120),
          clampMediaText(interaction.overlayText, 120),
          clampMediaText(interaction.nextCueBody, 120),
        ].filter(Boolean),
        quickChecks: buildMediaQuickChecks(topicLabel),
        bestUse: clampMediaText(interaction.overlayText, 160),
        keyIdea: clampMediaText(card.learningGoal, 130) || null,
        nextMove: clampMediaText(interaction.nextCueBody, 160) || null,
        schoolLevel: safeString(args.schoolLevel).trim() || null,
        weakTopicRelevance: card.weakTopicFit ? topicLabel : null,
        revisionRelevance: topicLabel,
        recommendedScore: Math.max(1, Math.min(190, Math.round(card.compositeScore * 190))),
        streamRankScore: Math.max(1, Math.min(190, Math.round(card.compositeScore * 190))),
        metadata: {
          externalSourceType: card.sourceType,
          externalProvider: card.sourceType,
          externalRole: card.creativityType,
          trustTier,
          embeddable: card.embeddable,
          creatorName: card.creatorName || null,
          publishedAt: card.publishedAt || null,
          captionsAvailable: card.captionsAvailable === true,
          transcriptScored: card.transcriptQualityEstimate >= 0.7,
          transcriptQualityEstimate: card.transcriptQualityEstimate,
          clarityScore: card.clarityScore,
          creativityScore: card.creativityScore,
          intuitionScore: card.intuitionScore,
          noveltyScore: card.noveltyScore,
          learningGoal: card.learningGoal,
          actionsAvailable: card.actionsAvailable,
          interaction,
          qualityFlags: card.qualityFlags,
          streamMode: 'creative',
          streamRankSeedTopic: topicLabel,
          streamRankFromExternalIngestion: true,
          sourceChatSessionId: sourceChatSessionId || null,
          sourceChatMessageId: safeString(args.sourceChatMessageId).trim() || null,
          ingestionNotices: deck.notices,
          sourceHealth: deck.sourceHealth,
          ingestedAt: new Date().toISOString(),
        },
        safetyStatus: 'allowed',
        sourceTrust: trustTier,
        dedupeKey: buildMediaAssetDedupeKey([
          'creative_external_video',
          args.userId,
          card.sourceType,
          safeString(card.sourceVideoId).trim(),
        ]),
      });
    })
  );

  return {
    assets: ingested.filter(Boolean),
    notices: deck.notices,
    sourceHealth: deck.sourceHealth,
    seedTopics: topicSeeds,
  };
}

function estimateAudioDurationSec(text: string): number {
  const words = safeString(text).trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(8, Math.round(words / 2.4));
}

function isEducationSafeImagePrompt(prompt: string): boolean {
  const clean = safeString(prompt).trim();
  if (!clean) return false;
  if (EDUCATIONAL_IMAGE_BLOCKLIST.test(clean)) return false;
  return EDUCATIONAL_IMAGE_ALLOWLIST.test(clean);
}

function createStudyImageFallbackDataUrl(args: { title: string; prompt: string }): string {
  const safeTitle = clampMediaText(args.title || 'Study visual', 80);
  const safePrompt = clampMediaText(args.prompt, 220);
  const escapedTitle = safeTitle.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
  const escapedPrompt = safePrompt.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
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

const EMPTY_METACOGNITIVE_PROFILE: MetacognitiveProfile = {
  evidenceCount: 0,
  recurringErrorPatterns: [],
  preferredSupportPatterns: [],
  transferStrengths: [],
  reflectionSignals: [],
  recentSnapshot: null,
  lastReflectionSignal: null,
  lastUpdatedAt: null,
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const toPrismaNestedJson = (value: unknown): Prisma.InputJsonValue | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = toPrismaNestedJson(item);
      return normalized === undefined ? null : normalized;
    }) as Prisma.InputJsonArray;
  }
  if (typeof value === 'object') {
    const record: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      const normalized = toPrismaNestedJson(nestedValue);
      if (normalized !== undefined) {
        record[key] = normalized;
      }
    }
    return record as Prisma.InputJsonObject;
  }
  return safeString(value);
};

const toPrismaMetadata = (
  value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  const normalized = toPrismaNestedJson(value);
  if (normalized === undefined) return undefined;
  if (normalized === null) return Prisma.JsonNull;
  if (!Array.isArray(normalized) && typeof normalized === 'object' && Object.keys(normalized).length === 0) {
    return undefined;
  }
  return normalized;
};

const normalizeCacheText = (value: string) =>
  safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const limitText = (value: string, maxChars = MAX_TUTOR_ARTIFACT_PREVIEW_CHARS) => {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
};

function extractQuestionLikeLines(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => /^\d+[\).:-]\s+/.test(line) || /[?]$/.test(line))
    .slice(0, 6);
}

function extractTopicHints(text: string): string[] {
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

function extractHeadingLikeLines(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) =>
      /^#{1,6}\s+/.test(line) ||
      /^[A-Z0-9][A-Z0-9\s:,-]{5,}$/.test(line) ||
      /^(section|topic|chapter|lesson|surah|ayah|question|part)\s*[:\-]/i.test(line)
    )
    .map((line) => line.replace(/^#{1,6}\s+/, ''))
    .slice(0, 6);
}

function extractActionableTasks(text: string): string[] {
  return safeString(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) =>
      /^\d+[\).:-]\s+/.test(line) ||
      /^(solve|find|calculate|explain|define|compare|describe|list|write|state|prove|show|simplify|factor|differentiate|integrate|translate|summarize|summarise|analyse|analyze)\b/i.test(line)
    )
    .slice(0, 8);
}

function inferSubjectFromTopic(topic: string): string {
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

function inferArtifactType(args: {
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

function deriveLearnerStage(args: {
  memory?: { progress?: any[]; mistakes?: any[] };
  activeTopic?: string;
}): 'support' | 'developing' | 'secure' | undefined {
  const activeTopic = safeString(args.activeTopic).toLowerCase();
  const progress = Array.isArray(args.memory?.progress) ? args.memory!.progress : [];
  const mistakes = Array.isArray(args.memory?.mistakes) ? args.memory!.mistakes : [];

  const topicProgress = progress.find((entry: any) => safeString(entry?.topic).toLowerCase() === activeTopic);
  const topicMistake = mistakes.find((entry: any) => safeString(entry?.topic).toLowerCase() === activeTopic);

  const mastery = Number(topicProgress?.mastery || 0);
  const attempts = Number(topicMistake?.attempts || 0);
  if (attempts >= 3 || mastery < 35) return 'support';
  if (mastery >= 75 && attempts <= 1) return 'secure';
  if (activeTopic && !topicProgress && topicMistake) return 'support';
  if (activeTopic && topicProgress) return 'developing';
  return undefined;
}

function deriveRecommendedMode(stage?: 'support' | 'developing' | 'secure'): 'guided' | 'practice' | 'challenge' | undefined {
  if (stage === 'support') return 'guided';
  if (stage === 'secure') return 'challenge';
  if (stage === 'developing') return 'practice';
  return undefined;
}

function extractTeacherCorrections(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const corrections: string[] = [];
  for (const message of messages) {
    if (message.role !== 'model') continue;
    const content = safeString(message.content).replace(/\s+/g, ' ').trim();
    if (!content) continue;

    const ruleMatches = [
      ...content.matchAll(/\b(?:remember|key rule|important|definition|means|formula)\b[:\-]?\s*([^.?!\n]{8,180})/gi),
      ...content.matchAll(/\b(?:always|never|do not|don't)\b[^.?!\n]{8,180}/gi),
    ];
    for (const match of ruleMatches) {
      const candidate = limitText(match[1] || match[0] || '', 180);
      if (!candidate) continue;
      if (!corrections.includes(candidate)) corrections.push(candidate);
      if (corrections.length >= 6) return corrections;
    }
  }
  return corrections;
}

function extractStudentPreferenceSignals(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const preferences: string[] = [];
  const pushPreference = (value: string) => {
    const cleaned = limitText(value, 160);
    if (!cleaned) return;
    if (!preferences.includes(cleaned)) preferences.push(cleaned);
  };

  for (const message of messages) {
    if (message.role !== 'user') continue;
    const content = safeString(message.content).replace(/\s+/g, ' ').trim();
    if (!content) continue;

    const directMatches = [
      content.match(/\bi prefer\s+([^.?!\n]+)/i)?.[1],
      content.match(/\bplease\s+(?:use|speak in|explain in)\s+([^.?!\n]+)/i)?.[1],
      content.match(/\bremember(?: this)?[:\-]\s*([^.?!\n]+)/i)?.[1],
      content.match(/\bmy weak topic is\s+([^.?!\n]+)/i)?.[1],
    ].filter(Boolean) as string[];

    for (const candidate of directMatches) {
      pushPreference(candidate);
      if (preferences.length >= 6) return preferences;
    }
  }

  return preferences;
}

function extractEvidenceReferences(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const refs: string[] = [];
  const pushRef = (value: string) => {
    const cleaned = limitText(value, 140);
    if (!cleaned) return;
    if (!refs.includes(cleaned)) refs.push(cleaned);
  };

  for (const message of messages) {
    const sources = Array.isArray(message.metadata?.sources) ? message.metadata.sources : [];
    for (const source of sources) {
      const name = safeString(source?.sourceName).trim();
      const url = safeString(source?.url).trim();
      if (name || url) pushRef([name, url].filter(Boolean).join(' - '));
      if (refs.length >= 6) return refs;
    }

    const content = safeString(message.content);
    for (const match of content.matchAll(/\b(?:surah|sura|ayah|hadith|bukhari|muslim|tirmidhi|ab[uū]\s*dawud|ibn\s*majah|nasai|fiqh)\b[^.?!\n]{0,80}/gi)) {
      pushRef(match[0]);
      if (refs.length >= 6) return refs;
    }
  }

  return refs;
}

function buildSemanticSessionSnapshot(messages: Array<{ role: string; content: string; metadata?: any }>): Pick<
  TutorState,
  'semanticMemory' | 'teacherCorrections' | 'studentPreferences' | 'evidenceReferences'
> {
  const studentPreferences = extractStudentPreferenceSignals(messages);
  const teacherCorrections = extractTeacherCorrections(messages);
  const evidenceReferences = extractEvidenceReferences(messages);

  const semanticParts: string[] = [];
  if (studentPreferences.length > 0) {
    semanticParts.push(`Student preferences and constraints: ${studentPreferences.join(' | ')}`);
  }
  if (teacherCorrections.length > 0) {
    semanticParts.push(`Teacher corrections and key rules: ${teacherCorrections.join(' | ')}`);
  }
  if (evidenceReferences.length > 0) {
    semanticParts.push(`Evidence anchors already in this session: ${evidenceReferences.join(' | ')}`);
  }

  return {
    semanticMemory: semanticParts.join('\n').trim() || undefined,
    teacherCorrections: teacherCorrections.length > 0 ? teacherCorrections : undefined,
    studentPreferences: studentPreferences.length > 0 ? studentPreferences : undefined,
    evidenceReferences: evidenceReferences.length > 0 ? evidenceReferences : undefined,
  };
}

function mergeUniqueTextLists(...groups: Array<string[] | undefined>): string[] | undefined {
  const merged: string[] = [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const value of group) {
      const cleaned = limitText(String(value || '').replace(/\s+/g, ' ').trim(), 180);
      if (!cleaned) continue;
      if (!merged.includes(cleaned)) merged.push(cleaned);
      if (merged.length >= 8) return merged;
    }
  }
  return merged.length > 0 ? merged : undefined;
}

function buildVideoTranscriptFallbackSummary(args: {
  title?: string;
  channel?: string;
  topic?: string;
  whyRecommended?: string;
}): VideoTutorSnapshot {
  const title = safeString(args.title).trim();
  const topic = safeString(args.topic).trim();
  const whyRecommended = limitText(safeString(args.whyRecommended).trim(), 240);
  const concepts = extractTopicHints(`${title} ${topic} ${whyRecommended}`);
  const summary = [
    title ? `Current study video: ${title}.` : '',
    topic ? `Use it as support for ${topic}.` : '',
    whyRecommended ? whyRecommended : '',
  ].filter(Boolean).join(' ');

  return {
    activeVideoSummary: summary || undefined,
    activeVideoConcepts: concepts.length > 0 ? concepts : undefined,
    activeVideoWhyRecommended: whyRecommended || undefined,
    transcriptAvailable: false,
  };
}

async function getOrBuildVideoTutorSnapshot(args: {
  videoData?: { id?: string; title?: string; channel?: string; channelTitle?: string };
  activeTopic?: string;
  whyRecommended?: string;
  priorTutorState?: TutorState;
}): Promise<VideoTutorSnapshot> {
  const videoId = safeString(args.videoData?.id).trim();
  if (!videoId) return {};

  if (
    args.priorTutorState?.activeVideoId === videoId &&
    (args.priorTutorState.activeVideoSummary || args.priorTutorState.activeVideoConcepts?.length)
  ) {
    return {
      activeVideoSummary: args.priorTutorState.activeVideoSummary,
      activeVideoConcepts: args.priorTutorState.activeVideoConcepts,
      activeVideoWhyRecommended:
        safeString(args.whyRecommended).trim() || args.priorTutorState.activeVideoWhyRecommended,
      evidenceReferences: args.priorTutorState.evidenceReferences,
    };
  }

  const redis = await getRedisClient();
  const cacheKey = `video:tutor-snapshot:${videoId}`;
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          activeVideoSummary: safeString(parsed?.activeVideoSummary).trim() || undefined,
          activeVideoConcepts: Array.isArray(parsed?.activeVideoConcepts)
            ? parsed.activeVideoConcepts.map((item: unknown) => safeString(item).trim()).filter(Boolean).slice(0, 8)
            : undefined,
          activeVideoWhyRecommended:
            safeString(args.whyRecommended).trim() || safeString(parsed?.activeVideoWhyRecommended).trim() || undefined,
          evidenceReferences: Array.isArray(parsed?.evidenceReferences)
            ? parsed.evidenceReferences.map((item: unknown) => safeString(item).trim()).filter(Boolean).slice(0, 8)
            : undefined,
          transcriptAvailable: typeof parsed?.transcriptAvailable === 'boolean' ? parsed.transcriptAvailable : undefined,
        };
      }
    } catch (error) {
      logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Cache read failed.');
    }
  }

  const fallback = buildVideoTranscriptFallbackSummary({
    title: args.videoData?.title,
    channel: args.videoData?.channel || args.videoData?.channelTitle,
    topic: args.activeTopic,
    whyRecommended: args.whyRecommended,
  });

  let transcriptExcerpt = '';
  try {
    const transcript = await runFlow(getYoutubeTranscriptFlow as any, { videoId });
    if (typeof transcript === 'string' && transcript.trim() && !transcript.startsWith('Could not')) {
      transcriptExcerpt = transcript.slice(0, 12000);
    }
  } catch (error) {
    logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Transcript fetch failed.');
  }

  if (!transcriptExcerpt) {
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(fallback), { EX: 60 * 60 * 24 * 14 });
      } catch {
        // best effort cache
      }
    }
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content:
            'Summarize the educational video transcript into durable tutor memory. Return strict JSON with keys summary, concepts, evidenceReferences. summary should be concise, grounded, and useful for follow-up tutoring. concepts should be a short array of 3 to 6 concepts. evidenceReferences should list any specific named references only if clearly present.',
        },
        {
          role: 'user',
          content: [
            `Active study topic: ${safeString(args.activeTopic) || 'Unknown topic'}`,
            `Video title: ${safeString(args.videoData?.title) || 'Suggested video'}`,
            args.videoData?.channel || args.videoData?.channelTitle
              ? `Channel: ${safeString(args.videoData?.channel || args.videoData?.channelTitle)}`
              : '',
            args.whyRecommended ? `Why recommended: ${args.whyRecommended}` : '',
            '',
            'Transcript excerpt:',
            transcriptExcerpt,
          ].filter(Boolean).join('\n'),
        },
      ],
    });

    const parsed = JSON.parse(String(completion.choices?.[0]?.message?.content || '{}'));
    const snapshot: VideoTutorSnapshot = {
      activeVideoSummary:
        limitText(safeString(parsed?.summary).trim(), 420) || fallback.activeVideoSummary,
      activeVideoConcepts: mergeUniqueTextLists(
        Array.isArray(parsed?.concepts) ? parsed.concepts.map((item: unknown) => safeString(item).trim()) : undefined,
        fallback.activeVideoConcepts,
      ),
      activeVideoWhyRecommended:
        safeString(args.whyRecommended).trim() || fallback.activeVideoWhyRecommended,
      evidenceReferences: mergeUniqueTextLists(
        Array.isArray(parsed?.evidenceReferences)
          ? parsed.evidenceReferences.map((item: unknown) => safeString(item).trim())
          : undefined,
      ),
      transcriptAvailable: true,
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(snapshot), { EX: 60 * 60 * 24 * 14 });
      } catch {
        // best effort cache
      }
    }
    return snapshot;
  } catch (error) {
    logger.warn({ error: String(error), videoId }, '[VideoTutorSnapshot] Summary generation failed.');
    return fallback;
  }
}

async function invalidateStudentMemoryCache(studentId: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(`memory:${studentId}`);
  } catch (error) {
    logger.warn({ err: error, studentId }, '[TutorMemory] Cache invalidate failed; continuing.');
  }
}

async function applyDeterministicMasteryUpdate(args: {
  studentId: string;
  priorState: ConversationState;
  nextState: ConversationState;
  topic?: string;
  userMessage: string;
  aiResponse: string;
}): Promise<void> {
  const topic = safeString(args.topic || args.nextState.lastStudyTopic || args.priorState.lastStudyTopic).trim();
  if (!topic || topic.length < 3) return;
  if (/\b(new topic|another topic|different topic|change topic|switch topic|instead)\b/i.test(args.userMessage)) return;

  const wasAwaiting = Boolean(args.priorState.awaitingPracticeQuestionAnswer);
  const isAwaiting = Boolean(args.nextState.awaitingPracticeQuestionAnswer);
  const prevAttempts = Number(args.priorState.validationAttemptCount || 0);
  const nextAttempts = Number(args.nextState.validationAttemptCount || 0);
  if (!wasAwaiting) return;

  const subject = inferSubjectFromTopic(topic);

  if (!isAwaiting) {
    const existing = await prisma.progress.findFirst({
      where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
    });
    const currentMastery = Number(existing?.mastery || 0);
    const increment = prevAttempts >= 2 ? 7 : prevAttempts === 1 ? 10 : 12;
    const mastery = Math.min(100, currentMastery + increment);
    if (existing) {
      await prisma.progress.update({
        where: { id: existing.id },
        data: { mastery, subject },
      });
    } else {
      await prisma.progress.create({
        data: {
          studentId: args.studentId,
          subject,
          topic,
          mastery: Math.max(5, increment),
        },
      });
    }
    if (mastery >= 80) {
      await prisma.mistake.deleteMany({
        where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
      });
    }
    await invalidateStudentMemoryCache(args.studentId);
    return;
  }

  if (nextAttempts > prevAttempts) {
    const conciseError = limitText(args.aiResponse, 220) || 'Needs another scaffolded explanation.';
    const existingMistake = await prisma.mistake.findFirst({
      where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
    });
    if (existingMistake) {
      await prisma.mistake.update({
        where: { id: existingMistake.id },
        data: {
          attempts: { increment: 1 },
          error: conciseError,
          lastSeen: new Date(),
        },
      });
    } else {
      await prisma.mistake.create({
        data: {
          studentId: args.studentId,
          topic,
          error: conciseError,
          attempts: 1,
        },
      });
    }

    const existingProgress = await prisma.progress.findFirst({
      where: { studentId: args.studentId, topic: { equals: topic, mode: 'insensitive' } },
    });
    if (existingProgress) {
      await prisma.progress.update({
        where: { id: existingProgress.id },
        data: { mastery: Math.max(0, Number(existingProgress.mastery || 0) - 6) },
      });
    }

    await invalidateStudentMemoryCache(args.studentId);
    return;
  }
}

function sanitizeSources(
  sources:
    | Array<{
        sourceName?: string;
        url?: string;
        domain?: string | null;
        sourceType?: string | null;
        trustTier?: string | null;
        relevanceReason?: string | null;
        recencyReason?: string | null;
        educationalFit?: string | null;
      }>
    | undefined
): Array<{
  sourceName: string;
  url: string;
  domain?: string | null;
  sourceType?: string | null;
  trustTier?: 'high' | 'medium' | 'limited' | null;
  relevanceReason?: string | null;
  recencyReason?: string | null;
  educationalFit?: string | null;
}> {
  if (!Array.isArray(sources)) return [];
  const seen = new Set<string>();
  const cleaned: Array<{
    sourceName: string;
    url: string;
    domain?: string | null;
    sourceType?: string | null;
    trustTier?: 'high' | 'medium' | 'limited' | null;
    relevanceReason?: string | null;
    recencyReason?: string | null;
    educationalFit?: string | null;
  }> = [];

  for (const source of sources) {
    const url = safeString(source?.url).trim();
    const sourceName = safeString(source?.sourceName).trim() || 'Source';
    if (!url || /example\.com/i.test(url)) continue;
    if (!isTrustedSource(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const trustTier = safeString(source?.trustTier).trim();
    cleaned.push({
      sourceName,
      url,
      domain: safeString(source?.domain).trim() || null,
      sourceType: safeString(source?.sourceType).trim() || null,
      trustTier: ['high', 'medium', 'limited'].includes(trustTier) ? (trustTier as 'high' | 'medium' | 'limited') : null,
      relevanceReason: limitText(safeString(source?.relevanceReason).trim(), 180) || null,
      recencyReason: limitText(safeString(source?.recencyReason).trim(), 180) || null,
      educationalFit: limitText(safeString(source?.educationalFit).trim(), 180) || null,
    });
  }

  return cleaned;
}

function buildScopedChatCacheKey(args: {
  studentId: string;
  sessionId: string;
  message: string;
  preferredLanguage?: string;
  gradeLevel?: string;
  activeTopic?: string;
  forceWebSearch?: boolean;
  focusMode?: boolean;
  examMode?: boolean;
  workspaceDestination?: string;
  workspaceStudyMode?: string;
  includeVideos?: boolean;
  tutorActionId?: string;
  tutorActionSourceMessageId?: string;
  tutorActionSelectedText?: string;
  tutorActionLinkedArtifactId?: string;
}): string {
  const payload = {
    v: CACHE_VERSION,
    studentId: safeString(args.studentId),
    sessionId: safeString(args.sessionId),
    message: normalizeCacheText(args.message),
    preferredLanguage: safeString(args.preferredLanguage).toLowerCase(),
    gradeLevel: safeString(args.gradeLevel).toLowerCase(),
    activeTopic: normalizeCacheText(args.activeTopic || ''),
    forceWebSearch: Boolean(args.forceWebSearch),
    focusMode: Boolean(args.focusMode),
    examMode: Boolean(args.examMode),
    workspaceDestination: safeString(args.workspaceDestination).toLowerCase(),
    workspaceStudyMode: safeString(args.workspaceStudyMode).toLowerCase(),
    includeVideos: Boolean(args.includeVideos),
    tutorActionId: safeString(args.tutorActionId),
    tutorActionSourceMessageId: safeString(args.tutorActionSourceMessageId),
    tutorActionSelectedText: normalizeCacheText(args.tutorActionSelectedText || ''),
    tutorActionLinkedArtifactId: safeString(args.tutorActionLinkedArtifactId),
  };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return `ai_cache:${digest}`;
}

function parseTutorAction(raw: unknown): TutorActionRequest | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const rawId = safeString(record.id);
  const id = (rawId === 'explain' ? 'breakdown' : rawId) as TutorActionId;
  if (!VALID_TUTOR_ACTIONS.has(id)) return undefined;
  const selectionRangeRecord = asRecord(record.selectionRange);
  const parsedStartOffset = Number(selectionRangeRecord?.startOffset);
  const parsedEndOffset = Number(selectionRangeRecord?.endOffset);
  const parsedLength = Number(selectionRangeRecord?.length);
  const selectionRange =
    selectionRangeRecord &&
    (Number.isFinite(parsedStartOffset) || Number.isFinite(parsedEndOffset) || Number.isFinite(parsedLength))
      ? {
          ...(Number.isFinite(parsedStartOffset) && parsedStartOffset >= 0
            ? { startOffset: Math.floor(parsedStartOffset) }
            : {}),
          ...(Number.isFinite(parsedEndOffset) && parsedEndOffset >= 0 ? { endOffset: Math.floor(parsedEndOffset) } : {}),
          ...(Number.isFinite(parsedLength) && parsedLength > 0 ? { length: Math.floor(parsedLength) } : {}),
        }
      : undefined;
  return {
    id,
    sourceMessageId: safeString(record.sourceMessageId).trim() || undefined,
    sourceText: safeString(record.sourceText).trim() || undefined,
    selectedText: safeString(record.selectedText).trim() || undefined,
    sourceVideoId: safeString(record.sourceVideoId).trim() || undefined,
    sourceVideoTitle: safeString(record.sourceVideoTitle).trim() || undefined,
    sourceArtifactLabel: safeString(record.sourceArtifactLabel).trim() || undefined,
    sourceArtifactSummary: safeString(record.sourceArtifactSummary).trim() || undefined,
    invokedFrom: ['assistant_card', 'selection_menu', 'composer'].includes(safeString(record.invokedFrom))
      ? (safeString(record.invokedFrom) as TutorActionRequest['invokedFrom'])
      : undefined,
    selectionSourceKind: ['assistant_message', 'user_message', 'artifact', 'video_summary', 'study_material'].includes(safeString(record.selectionSourceKind))
      ? (safeString(record.selectionSourceKind) as TutorActionRequest['selectionSourceKind'])
      : undefined,
    sourceType: safeString(record.sourceType).trim() || undefined,
    sourceDocumentId: safeString(record.sourceDocumentId).trim() || undefined,
    selectionRange:
      selectionRange &&
      (selectionRange.startOffset !== undefined ||
        selectionRange.endOffset !== undefined ||
        selectionRange.length !== undefined)
        ? selectionRange
        : undefined,
    inputOrigin: ['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload'].includes(safeString(record.inputOrigin))
      ? (safeString(record.inputOrigin) as TutorActionRequest['inputOrigin'])
      : undefined,
    composerIntent: safeString(record.composerIntent).trim() || undefined,
    linkedArtifactId: safeString(record.linkedArtifactId).trim() || undefined,
  };
}

function getTutorStateFromMetadata(metadata: unknown): TutorState {
  const record = asRecord(metadata);
  const nested = asRecord(record?.tutorState);
  return (nested || {}) as TutorState;
}

function getTutorArtifactsFromMetadata(metadata: unknown): TutorArtifact[] {
  const record = asRecord(metadata);
  const raw = Array.isArray(record?.tutorArtifacts) ? record?.tutorArtifacts : [];
  return raw as TutorArtifact[];
}

function getTutorRevisionNotesFromMetadata(metadata: unknown): TutorRevisionNote[] {
  const record = asRecord(metadata);
  const raw = Array.isArray(record?.tutorRevisionNotes) ? record?.tutorRevisionNotes : [];
  return raw as TutorRevisionNote[];
}

function buildTutorActionUiMeta(args: {
  tutorAction?: TutorActionRequest;
  activeTopic?: string;
  savedRevisionNote?: TutorRevisionNote;
}): TutorActionUiMeta | undefined {
  if (!args.tutorAction?.id) return undefined;
  const topic = safeString(args.activeTopic).trim() || 'this topic';
  switch (args.tutorAction.id) {
    case 'ask':
      return {
        actionId: 'ask',
        statusLine: 'Focused follow-up',
        nextStep: `Explain the key idea in ${topic} in one sentence, then answer one quick check.`,
      };
    case 'hint':
      return {
        actionId: 'hint',
        statusLine: 'Socratic hint',
        nextStep: `Try one small step on ${topic} and share why you chose it.`,
      };
    case 'breakdown':
      return {
        actionId: 'breakdown',
        statusLine: 'Step breakdown',
        nextStep: 'Start with the first step only, then rate your confidence from 1 to 5.',
      };
    case 'summarize':
      return {
        actionId: 'summarize',
        statusLine: 'Revision summary',
        nextStep: 'From memory, write the key idea in one sentence and one short example.',
      };
    case 'practice':
      return {
        actionId: 'practice',
        statusLine: 'Practice question',
        nextStep: 'Try the question yourself first, then send your answer for feedback.',
      };
    case 'save':
      return {
        actionId: 'save',
        statusLine: 'Saved to revision',
        nextStep: 'Plan one short revisit and test yourself with one quick recall check.',
        savedRevisionNote: args.savedRevisionNote,
      };
    default:
      return undefined;
  }
}

function createSystemNotice(code: string, message: string, severity: SystemNoticeSeverity = 'info'): SystemNotice {
  return { code, message, severity };
}

function sanitizeSystemNotices(notices: Array<SystemNotice | undefined | null>): SystemNotice[] {
  const cleaned: SystemNotice[] = [];
  const seen = new Set<string>();
  for (const notice of notices) {
    if (!notice) continue;
    const code = safeString(notice.code).trim();
    const message = safeString(notice.message).trim();
    const severity = (safeString(notice.severity) as SystemNoticeSeverity) || 'info';
    if (!code || !message) continue;
    const key = `${code}:${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ code, message: limitText(message, 220), severity });
  }
  return cleaned;
}

function getSystemNoticesFromMetadata(metadata: unknown): SystemNotice[] {
  const record = asRecord(metadata);
  const raw = Array.isArray(record?.systemNotices) ? record.systemNotices : [];
  return sanitizeSystemNotices(raw as SystemNotice[]);
}

function getMessageEditMetaFromMetadata(metadata: unknown): MessageEditMeta | undefined {
  const record = asRecord(metadata);
  const nested = asRecord(record?.edit);
  return nested ? (nested as MessageEditMeta) : undefined;
}

function buildArtifactSystemNotices(args: {
  attachments: any[];
  artifacts: TutorArtifact[];
}): SystemNotice[] {
  const notices: Array<SystemNotice | undefined> = [];
  const truncatedAttachment = args.attachments.find((attachment) => Boolean(attachment?.truncated));
  if (truncatedAttachment) {
    notices.push(
      createSystemNotice(
        'partial_file_parse',
        'Some uploaded material was trimmed for speed. Ask about a specific section if anything important seems missing.',
        'warning'
      )
    );
  }

  const weakArtifact = args.artifacts.find((artifact) => artifact.ocrConfidence === 'low');
  if (weakArtifact) {
    notices.push(
      createSystemNotice(
        'weak_extraction_confidence',
        `The text extraction for ${weakArtifact.label || 'this material'} was uncertain, so the tutor may need a more focused follow-up question.`,
        'warning'
      )
    );
  }

  const partialArtifact = args.attachments.find((attachment, index) => {
    const artifact = args.artifacts[index];
    const kind = safeString(attachment?.kind || artifact?.kind).toLowerCase();
    if (!['pdf', 'image', 'text'].includes(kind)) return false;
    const hasExtractedText = Boolean(safeString(artifact?.extractedText).trim());
    const hasSummary = Boolean(safeString(artifact?.summary).trim());
    return !hasExtractedText && !hasSummary;
  });
  if (partialArtifact) {
    notices.push(
      createSystemNotice(
        'partial_file_parse',
        'Part of the uploaded material could only be read partially. The tutor will still help, but a clearer scan or a specific question may work better.',
        'warning'
      )
    );
  }

  return sanitizeSystemNotices(notices);
}

function looksLikeContextDependentFollowUp(text: string): boolean {
  const raw = safeString(text).toLowerCase().trim();
  if (!raw) return false;
  if (raw.split(/\s+/).length > 18) return false;
  return /\b(this|that|it|same|the video|the image|the file|the worksheet|the notes|the text above)\b/.test(raw);
}

function deriveMessagePresentation(args: {
  tutorAction?: TutorActionRequest;
  tutorUi?: TutorActionUiMeta;
  tutorState: TutorState;
  artifacts: TutorArtifact[];
  videoData?: { title?: string };
  sources: Array<{ sourceName: string; url: string }>;
  systemNotices: SystemNotice[];
}): MessagePresentationMeta {
  const baseArtifactLabel = safeString(
    args.tutorAction?.sourceArtifactLabel ||
    args.artifacts[0]?.label ||
    args.tutorState.activeArtifactLabels?.[0] ||
    ''
  ).trim() || undefined;
  const baseVideoTitle = safeString(
    args.tutorAction?.sourceVideoTitle ||
    args.videoData?.title ||
    args.tutorState.activeVideoTitle ||
    ''
  ).trim() || undefined;
  const awaitingStudentAttempt =
    Boolean(args.tutorState.awaitingStudentAttempt) || args.tutorAction?.id === 'practice';
  const limitedSupport = args.systemNotices.some((notice) =>
    ['limited_source_support', 'transcript_unavailable', 'partial_file_parse', 'weak_extraction_confidence'].includes(notice.code)
  );

  let cardKind: AssistantCardKind = 'guided_step';
  let uiTone: UiTone = 'calm';
  let suggestedActions: TutorQuickAction[] = ['hint', 'breakdown', 'summarize', 'practice', 'save'];

  switch (args.tutorAction?.id) {
    case 'hint':
      cardKind = 'hint';
      uiTone = 'encouraging';
      suggestedActions = ['breakdown', 'practice', 'save'];
      break;
    case 'breakdown':
      cardKind = 'breakdown';
      uiTone = 'calm';
      suggestedActions = ['hint', 'practice', 'summarize', 'save'];
      break;
    case 'summarize':
      cardKind = 'summary';
      uiTone = 'reflective';
      suggestedActions = ['practice', 'save', 'breakdown'];
      break;
    case 'ask':
      cardKind = 'explanation';
      uiTone = 'calm';
      suggestedActions = ['hint', 'breakdown', 'practice', 'save'];
      break;
    case 'practice':
      cardKind = 'practice';
      uiTone = 'encouraging';
      suggestedActions = ['hint', 'breakdown', 'save'];
      break;
    case 'save':
      cardKind = 'summary';
      uiTone = 'reflective';
      suggestedActions = ['practice', 'summarize'];
      break;
    default:
      if (args.sources.length > 0) {
        cardKind = 'source_supported';
      }
  }

  if (awaitingStudentAttempt) {
    suggestedActions = suggestedActions.filter((action) => action !== 'summarize');
  }

  return {
    cardKind,
    nextStepPrompt: args.tutorUi?.nextStep,
    suggestedActions,
    awaitingStudentAttempt,
    basedOnArtifactLabel: baseArtifactLabel,
    basedOnVideoTitle: baseVideoTitle,
    sourceConfidence: limitedSupport ? 'limited' : args.sources.length > 1 ? 'high' : args.sources.length === 1 ? 'medium' : undefined,
    uiTone,
  };
}

function buildSessionSummaryMeta(args: {
  topic?: string | null;
  messages: Array<{ role: string; content: string; metadata?: any; timestamp?: Date | string }>;
  tutorState: TutorState;
  tutorArtifacts: TutorArtifact[];
  tutorRevisionNotes: TutorRevisionNote[];
}): {
  summary: string | null;
  lastTutorFocus: string | null;
  learningMode: string | null;
  hadArtifacts: boolean;
  hadVideo: boolean;
  continuationStatus: string | null;
  recentArtifactLabel: string | null;
  revisionCount: number;
} {
  const latestAssistant = [...args.messages].reverse().find((message) => message.role === 'model' && safeString(message.content).trim());
  const latestUser = [...args.messages].reverse().find((message) => message.role === 'user' && safeString(message.content).trim());
  const hadArtifacts =
    args.tutorArtifacts.length > 0 ||
    args.messages.some((message) => Array.isArray(asRecord(message.metadata)?.attachments) && (asRecord(message.metadata)?.attachments as any[]).length > 0);
  const hadVideo =
    Boolean(args.tutorState.activeVideoId) ||
    args.messages.some((message) => Boolean(deriveVideoDataFromMessage({ metadata: message.metadata })));
  const summary = limitText(
    safeString(latestAssistant?.content || latestUser?.content || args.topic || '').trim(),
    220
  ) || null;
  const lastTutorFocus = safeString(
    args.tutorState.visibleFocusLabel ||
    args.tutorState.activeTopic ||
    args.tutorState.masteryFocus?.[0] ||
    args.tutorState.misconceptionFocus?.[0] ||
    ''
  ).trim() || null;
  const learningMode = safeString(args.tutorState.currentStudyMode || args.tutorState.recommendedMode || '').trim() || null;
  const continuationStatus = args.tutorState.awaitingStudentAttempt
    ? 'awaiting_attempt'
    : args.tutorRevisionNotes.length > 0
      ? 'saved_revision_available'
      : 'ready_to_continue';
  return {
    summary,
    lastTutorFocus,
    learningMode,
    hadArtifacts,
    hadVideo,
    continuationStatus,
    recentArtifactLabel: args.tutorState.activeArtifactLabels?.[0] || args.tutorArtifacts[0]?.label || null,
    revisionCount: args.tutorRevisionNotes.length,
  };
}

function buildChatSystemNotices(args: {
  attachmentNotices: SystemNotice[];
  safeSources: Array<{ sourceName: string; url: string }>;
  forceWebSearch: boolean;
  hasVideo: boolean;
  videoSnapshot?: VideoTutorSnapshot;
  userText: string;
  tutorState: TutorState;
}): SystemNotice[] {
  const notices: Array<SystemNotice | undefined> = [...args.attachmentNotices];

  if (args.hasVideo && args.videoSnapshot?.transcriptAvailable === false) {
    notices.push(
      createSystemNotice(
        'transcript_unavailable',
        'The video transcript was unavailable, so the tutor relied on the title, topic, and recommendation context.',
        'info'
      )
    );
  }

  if (args.forceWebSearch && args.safeSources.length === 0) {
    notices.push(
      createSystemNotice(
        'limited_source_support',
        'No strong external sources were available for this turn, so the tutor fell back to general guidance.',
        'warning'
      )
    );
  } else if (args.forceWebSearch && args.safeSources.length === 1) {
    notices.push(
      createSystemNotice(
        'limited_source_support',
        'This answer is supported by a limited number of sources. You can ask for another source or a cross-check.',
        'info'
      )
    );
  }

  if (!args.hasVideo && looksLikeContextDependentFollowUp(args.userText) && (args.tutorState.activeArtifactSummary || args.tutorState.activeVideoTitle)) {
    notices.push(
      createSystemNotice(
        'recovered_from_context_gap',
        'The tutor recovered the answer from the current study context instead of treating the follow-up as a new topic.',
        'info'
      )
    );
  }

  return sanitizeSystemNotices(notices);
}

function mapSessionMessagePayload(message: any) {
  return {
    ...message,
    timestamp: message?.timestamp instanceof Date ? message.timestamp.toISOString() : safeString(message?.timestamp),
    videoData: deriveVideoDataFromMessage(message),
    sources: extractSources(message?.metadata),
    image: deriveImageFromMessage(message),
  };
}

function buildSessionResponsePayload(session: any) {
  const tutorState = getTutorStateFromMetadata(session.metadata);
  const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
  const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
  const summaryMeta = buildSessionSummaryMeta({
    topic: session.topic,
    messages: session.messages || [],
    tutorState,
    tutorArtifacts,
    tutorRevisionNotes,
  });
  return {
    ...session,
    title: resolveSessionTitle(session.topic, session.messages || []),
    messages: (session.messages || []).map(mapSessionMessagePayload),
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : safeString(session.createdAt),
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : safeString(session.updatedAt),
    conversationState: (session.metadata as any || DEFAULT_CONVERSATION_STATE),
    tutorState,
    summary: summaryMeta.summary,
    lastTutorFocus: summaryMeta.lastTutorFocus,
    learningMode: summaryMeta.learningMode,
    hadArtifacts: summaryMeta.hadArtifacts,
    hadVideo: summaryMeta.hadVideo,
    continuationStatus: summaryMeta.continuationStatus,
    recentArtifactLabel: summaryMeta.recentArtifactLabel,
    revisionCount: summaryMeta.revisionCount,
  };
}

function mergeSessionMetadata(args: {
  existing: unknown;
  conversationState: ConversationState;
  tutorState?: TutorState;
  tutorArtifacts?: TutorArtifact[];
  tutorRevisionNotes?: TutorRevisionNote[];
  systemNotices?: SystemNotice[];
}): Record<string, unknown> {
  const existing = asRecord(args.existing) || {};
  const mergedNotices = sanitizeSystemNotices([
    ...getSystemNoticesFromMetadata(existing),
    ...(Array.isArray(args.systemNotices) ? args.systemNotices : []),
  ]);
  return {
    ...existing,
    ...args.conversationState,
    tutorState: {
      ...getTutorStateFromMetadata(existing),
      ...(args.tutorState || {}),
      ...(mergedNotices.length > 0 ? { systemNotices: mergedNotices } : {}),
    },
    tutorArtifacts: Array.isArray(args.tutorArtifacts)
      ? args.tutorArtifacts
      : getTutorArtifactsFromMetadata(existing),
    tutorRevisionNotes: Array.isArray(args.tutorRevisionNotes)
      ? args.tutorRevisionNotes
      : getTutorRevisionNotesFromMetadata(existing),
    ...(mergedNotices.length > 0 ? { systemNotices: mergedNotices } : {}),
  };
}

async function getStudentMemoryPayload(studentId: string): Promise<{ progress: any[]; mistakes: any[] }> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(`memory:${studentId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          progress: Array.isArray(parsed?.progress) ? parsed.progress : [],
          mistakes: Array.isArray(parsed?.mistakes) ? parsed.mistakes : [],
        };
      }
    } catch (error) {
      logger.warn({ err: error, studentId }, '[TutorMemory] Cache read failed; falling back to database.');
    }
  }

  const [progress, mistakes] = await Promise.all([
    prisma.progress.findMany({ where: { studentId } }),
    prisma.mistake.findMany({ where: { studentId } }),
  ]);

  if (redis) {
    try {
      await redis.set(`memory:${studentId}`, JSON.stringify({ progress, mistakes }), { EX: 3600 });
    } catch (error) {
      logger.warn({ err: error, studentId }, '[TutorMemory] Cache write failed; continuing without cache.');
    }
  }

  return { progress, mistakes };
}

function buildLearnerTutorState(args: {
  priorTutorState: TutorState;
  state: ConversationState;
  topic?: string;
  subject?: string | null;
  artifacts?: TutorArtifact[];
  videoData?: { id?: string; title?: string };
  lastIntent?: string;
  memory?: { progress?: any[]; mistakes?: any[] };
  semanticSnapshot?: SemanticSessionSnapshot;
  videoSnapshot?: VideoTutorSnapshot;
  systemNotices?: SystemNotice[];
  sessionLanguageState?: SessionLanguageState;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  reflectionSignal?: ReflectionSignal | null;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  preferredSupportPatterns?: string[];
}): TutorState {
  const strongestProgress = Array.isArray(args.memory?.progress)
    ? args.memory!.progress
        .slice()
        .sort((a: any, b: any) => Number(b?.mastery || 0) - Number(a?.mastery || 0))
        .slice(0, 3)
        .map((entry: any) => safeString(entry?.topic || entry?.subject).trim())
        .filter(Boolean)
    : [];
  const misconceptionFocus = Array.isArray(args.memory?.mistakes)
    ? args.memory!.mistakes
        .slice()
        .sort((a: any, b: any) => new Date(b?.lastSeen || 0).getTime() - new Date(a?.lastSeen || 0).getTime())
        .slice(0, 4)
        .map((entry: any) => safeString(entry?.topic || entry?.error).trim())
        .filter(Boolean)
    : [];
  const artifactLabels = (args.artifacts || []).map((artifact) => artifact.label).filter(Boolean);
  const artifactSummary = (args.artifacts || []).map((artifact) => artifact.summary).filter(Boolean).join(' ');
  const activeTopic = safeString(args.topic || args.state.lastStudyTopic || args.priorTutorState.activeTopic).trim() || undefined;
  const learnerStage = deriveLearnerStage({ memory: args.memory, activeTopic });
  const recommendedMode = deriveRecommendedMode(learnerStage);
  const recentGoals = (args.artifacts || [])
    .flatMap((artifact) => Array.isArray(artifact.actionableTasks) ? artifact.actionableTasks : [])
    .filter(Boolean)
    .slice(0, 4);
  const islamicContext = /\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/i
    .test(`${activeTopic || ''} ${artifactSummary}`)
    ? 'Islamic studies context is active. Keep wording respectful, educational, and age-appropriate.'
    : args.priorTutorState.islamicContext;
  let evidenceReferences = mergeUniqueTextLists(
    args.semanticSnapshot?.evidenceReferences,
    args.videoSnapshot?.evidenceReferences,
    args.priorTutorState.evidenceReferences,
  );
  if (!evidenceReferences && islamicContext) {
    evidenceReferences = [
      "Qur'an text or paraphrase clearly marked as paraphrase",
      'Hadith authenticity only when known',
      'Trusted scholarly explanation with brief note on valid differences',
    ];
  }
  const mergedSystemNotices = sanitizeSystemNotices([
    ...(args.priorTutorState.systemNotices || []),
    ...(args.systemNotices || []),
  ]);
  const visibleFocusLabel = safeString(
    artifactLabels[0] ||
    activeTopic ||
    misconceptionFocus[0] ||
    strongestProgress[0] ||
    ''
  ).trim() || undefined;
  const visibleStageLabel =
    learnerStage === 'support'
      ? 'Needs guided help'
      : learnerStage === 'developing'
        ? 'Building confidence'
        : learnerStage === 'secure'
          ? 'Ready for challenge'
          : undefined;
  const currentStudyMode = args.state.researchModeActive
    ? 'research'
    : args.state.awaitingPracticeQuestionAnswer
      ? 'practice'
      : recommendedMode || 'guided';

  return {
    ...args.priorTutorState,
    activeTopic,
    activeSubject: safeString(args.subject || args.priorTutorState.activeSubject).trim() || undefined,
    activeArtifactLabels: artifactLabels.length > 0
      ? artifactLabels
      : args.priorTutorState.activeArtifactLabels,
    activeArtifactSummary: artifactSummary || args.state.lastAttachmentContextSummary || args.priorTutorState.activeArtifactSummary,
    activeVideoId: safeString(args.videoData?.id || args.state.lastSuggestedVideo?.id || args.priorTutorState.activeVideoId).trim() || undefined,
    activeVideoTitle: safeString(args.videoData?.title || args.state.lastSuggestedVideo?.title || args.priorTutorState.activeVideoTitle).trim() || undefined,
    lastIntent: safeString(args.lastIntent || args.priorTutorState.lastIntent).trim() || undefined,
    misconceptionFocus: misconceptionFocus.length > 0 ? misconceptionFocus : args.priorTutorState.misconceptionFocus,
    masteryFocus: strongestProgress.length > 0 ? strongestProgress : args.priorTutorState.masteryFocus,
    learnerStage: learnerStage || args.priorTutorState.learnerStage,
    recommendedMode: recommendedMode || args.priorTutorState.recommendedMode,
    recentGoals: recentGoals.length > 0 ? recentGoals : args.priorTutorState.recentGoals,
    islamicContext,
    activeVideoSummary:
      args.videoSnapshot?.activeVideoSummary || args.priorTutorState.activeVideoSummary,
    activeVideoConcepts:
      args.videoSnapshot?.activeVideoConcepts || args.priorTutorState.activeVideoConcepts,
    activeVideoWhyRecommended:
      args.videoSnapshot?.activeVideoWhyRecommended || args.priorTutorState.activeVideoWhyRecommended,
    semanticMemory:
      args.semanticSnapshot?.semanticMemory || args.priorTutorState.semanticMemory,
    teacherCorrections:
      args.semanticSnapshot?.teacherCorrections || args.priorTutorState.teacherCorrections,
    studentPreferences:
      args.semanticSnapshot?.studentPreferences || args.priorTutorState.studentPreferences,
    evidenceReferences,
    visibleFocusLabel,
    visibleStageLabel,
    awaitingStudentAttempt: Boolean(args.state.awaitingPracticeQuestionAnswer),
    currentStudyMode,
    systemNotices: mergedSystemNotices.length > 0 ? mergedSystemNotices : undefined,
    sessionLanguageState: args.sessionLanguageState || args.priorTutorState.sessionLanguageState,
    metacognitiveState: mergeMetacognitiveSnapshot(args.priorTutorState.metacognitiveState, args.metacognitiveState),
    reflectionSignal: args.reflectionSignal || args.priorTutorState.reflectionSignal,
    topicMastery: args.topicMastery || args.priorTutorState.topicMastery,
    weakTopicRecovery: args.weakTopicRecovery || args.priorTutorState.weakTopicRecovery,
    preferredSupportPatterns:
      Array.isArray(args.preferredSupportPatterns) && args.preferredSupportPatterns.length > 0
        ? args.preferredSupportPatterns
        : args.priorTutorState.preferredSupportPatterns,
    updatedAt: new Date().toISOString(),
  };
}

async function buildTutorArtifactsFromUploads(args: {
  attachments: any[];
  userText?: string;
}): Promise<TutorArtifact[]> {
  const artifacts: TutorArtifact[] = [];

  for (let index = 0; index < args.attachments.length; index += 1) {
    const attachment = args.attachments[index];
    const kind = safeString(attachment?.kind || 'image').toLowerCase() as 'image' | 'pdf' | 'text';
    const fileName = safeString(attachment?.fileName).trim() || `Attachment ${index + 1}`;
    let extractedText = '';
    let summary = '';

    if (kind === 'text') {
      extractedText = safeString(attachment?.text).trim();
      summary = buildAttachmentPromptSummary({
        kind: 'text',
        fileName,
        extractedText,
        truncated: Boolean(attachment?.truncated),
      });
    } else if (kind === 'pdf') {
      const parsed = await extractTextFromPdfWithOcrFallback(safeString(attachment?.base64));
      extractedText = parsed.text;
      summary = buildAttachmentPromptSummary({
        kind: 'pdf',
        fileName,
        extractedText,
        truncated: parsed.truncated,
        note: parsed.text
          ? parsed.usedOcr
            ? 'OCR fallback was used because this PDF appears scanned or image-heavy.'
            : undefined
          : 'Text extraction was limited for this PDF.',
      });
    } else {
      const mimeType = safeString(attachment?.mimeType || attachment?.type || 'image/jpeg');
      let ocrConfidence: 'low' | 'medium' | 'high' | undefined;
      let denseText = false;
      if (isLikelyDenseTextRequest(args.userText || '', fileName, mimeType, false)) {
        const ocr = await runImageOcrAssist(safeString(attachment?.base64), mimeType);
        extractedText = safeString(ocr?.extractedText).trim();
        ocrConfidence = ocr?.confidence;
        denseText = Boolean(ocr?.dense);
        summary = buildAttachmentPromptSummary({
          kind: 'image',
          fileName,
          extractedText,
          confidence: ocr?.confidence,
          dense: ocr?.dense,
          note: extractedText
            ? 'OCR preview extracted from the uploaded image.'
            : 'Use the visible layout, labels, and figures as context.',
        });
      }
      if (!summary) {
        summary = buildAttachmentPromptSummary({
          kind: 'image',
          fileName,
          note: 'Use the visible layout, labels, and figures as context.',
        });
      }

      const headings = extractHeadingLikeLines(extractedText || summary);
      const topics = extractTopicHints(extractedText || summary);
      const questions = extractQuestionLikeLines(extractedText);
      const actionableTasks = extractActionableTasks(extractedText || summary);
      const artifactType = inferArtifactType({ kind, fileName, extractedText, summary });
      const subject = inferSubjectFromTopic(`${topics.join(' ')} ${summary} ${fileName}`);

      artifacts.push({
        id: `artifact-${Date.now()}-${index}`,
        kind,
        label: fileName,
        summary: limitText(summary),
        extractedText: extractedText ? limitText(extractedText) : undefined,
        questions,
        topics,
        headings,
        keywords: topics,
        actionableTasks,
        subject,
        artifactType,
        denseText,
        ocrConfidence,
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    const headings = extractHeadingLikeLines(extractedText || summary);
    const topics = extractTopicHints(extractedText || summary);
    const questions = extractQuestionLikeLines(extractedText);
    const actionableTasks = extractActionableTasks(extractedText || summary);
    const artifactType = inferArtifactType({ kind, fileName, extractedText, summary });
    const subject = inferSubjectFromTopic(`${topics.join(' ')} ${summary} ${fileName}`);

    artifacts.push({
      id: `artifact-${Date.now()}-${index}`,
      kind,
      label: fileName,
      summary: limitText(summary),
      extractedText: extractedText ? limitText(extractedText) : undefined,
      questions,
      topics,
      headings,
      keywords: topics,
      actionableTasks,
      subject,
      artifactType,
      denseText: false,
      ocrConfidence: undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return artifacts;
}

const isDefaultConversationStatePayload = (value: unknown): boolean => {
  const state = asRecord(value);
  if (!state) return false;
  const activePracticeQuestion = safeString(state.activePracticeQuestion);
  const lastAssistantMessage = safeString(state.lastAssistantMessage);
  const validationAttemptCount = Number(state.validationAttemptCount || 0);
  const hasSearchTopic = Array.isArray(state.lastSearchTopic) && state.lastSearchTopic.length > 0;
  const hasUsedExamples = Array.isArray(state.usedExamples) && state.usedExamples.length > 0;
  return (
    Boolean(state.researchModeActive) === false &&
    hasSearchTopic === false &&
    Boolean(state.awaitingPracticeQuestionInvitationResponse) === false &&
    activePracticeQuestion.length === 0 &&
    Boolean(state.awaitingPracticeQuestionAnswer) === false &&
    validationAttemptCount === 0 &&
    lastAssistantMessage.length === 0 &&
    Boolean(state.sensitiveContentDetected) === false &&
    Boolean(state.videoSuggested) === false &&
    hasUsedExamples === false
  );
};

const buildEffectiveConversationState = (
  persistedState: unknown,
  incomingState: unknown
): ConversationState => {
  const merged: Record<string, unknown> = { ...DEFAULT_CONVERSATION_STATE };
  const persisted = asRecord(persistedState);
  if (persisted) Object.assign(merged, persisted);

  const incoming = asRecord(incomingState);
  if (incoming && !isDefaultConversationStatePayload(incoming)) {
    Object.assign(merged, incoming);
  }

  return merged as ConversationState;
};

const normalizeVoiceLanguageMode = (value: unknown): VoiceLanguageMode => {
  const raw = safeString(value).toLowerCase();
  if (raw.includes('arabic_english') || raw.includes('ar_en')) return 'arabic_english';
  if (raw.includes('arabic + english') || raw.includes('arabic+english')) return 'arabic_english';
  if (raw.includes('arab')) return 'arabic';
  if (raw.includes('swahili')) return 'swahili';
  if (raw.includes('english + swahili') || raw.includes('english+swahili')) return 'english_sw';
  if (raw.includes('english_sw') || raw.includes('mix')) return 'english_sw';
  return 'english';
};

const normalizeSupportedLearningLanguage = (value: unknown): SupportedLearningLanguage => {
  const raw = safeString(value).toLowerCase();
  if (raw.includes('arab')) return 'arabic';
  if (raw.includes('swahili') || raw === 'sw') return 'swahili';
  return 'english';
};

const normalizeLearningSupportMode = (value: unknown): LearningSupportMode => {
  const raw = safeString(value).toLowerCase();
  if (raw === 'bilingual_support') return 'bilingual_support';
  if (raw === 'translation_support') return 'translation_support';
  if (raw === 'learner_choice') return 'learner_choice';
  return 'strict_single_language';
};

const normalizeSimplicityLevel = (value: unknown): SimplicityLevel => {
  const raw = safeString(value).toLowerCase();
  if (raw === 'very_simple') return 'very_simple';
  if (raw === 'standard') return 'standard';
  return 'simple';
};

const toSupportedLanguageFromVoiceMode = (mode: VoiceLanguageMode): SupportedLearningLanguage => {
  if (mode === 'arabic' || mode === 'arabic_english') return 'arabic';
  if (mode === 'swahili') return 'swahili';
  return 'english';
};

const toBilingualSupportLanguage = (mode: VoiceLanguageMode): SupportedLearningLanguage | null => {
  if (mode === 'arabic_english') return 'english';
  if (mode === 'english_sw') return 'swahili';
  return null;
};

const buildDefaultSessionLanguageState = (preferredLanguage: unknown): SessionLanguageState => {
  const preferredLanguageMode = normalizeVoiceLanguageMode(preferredLanguage);
  return {
    preferredResponseLanguage: toSupportedLanguageFromVoiceMode(preferredLanguageMode),
    learningSupportMode:
      preferredLanguageMode === 'english_sw' || preferredLanguageMode === 'arabic_english'
        ? 'bilingual_support'
        : 'strict_single_language',
    simplicityLevel: 'simple',
    voiceOutputLanguage: toSupportedLanguageFromVoiceMode(preferredLanguageMode),
    bilingualSupportLanguage: toBilingualSupportLanguage(preferredLanguageMode),
    lastDetectedInputLanguage: null,
    preferredLanguageMode,
  };
};

const normalizeSessionLanguageState = (
  raw: unknown,
  preferredLanguage: unknown,
  fallbackDetectedLanguage?: DetectedInputLanguage | null,
): SessionLanguageState => {
  const base = buildDefaultSessionLanguageState(preferredLanguage);
  const record = asRecord(raw);
  const preferredLanguageMode = normalizeVoiceLanguageMode(record?.preferredLanguageMode || preferredLanguage);
  return {
    preferredResponseLanguage: normalizeSupportedLearningLanguage(record?.preferredResponseLanguage || base.preferredResponseLanguage),
    learningSupportMode: normalizeLearningSupportMode(record?.learningSupportMode || base.learningSupportMode),
    simplicityLevel: normalizeSimplicityLevel(record?.simplicityLevel || base.simplicityLevel),
    voiceOutputLanguage: normalizeSupportedLearningLanguage(record?.voiceOutputLanguage || base.voiceOutputLanguage),
    bilingualSupportLanguage: record && Object.prototype.hasOwnProperty.call(record, 'bilingualSupportLanguage')
      ? (safeString(record.bilingualSupportLanguage).trim()
          ? normalizeSupportedLearningLanguage(record.bilingualSupportLanguage)
          : null)
      : base.bilingualSupportLanguage,
    lastDetectedInputLanguage:
      (safeString(record?.lastDetectedInputLanguage).trim() || fallbackDetectedLanguage || null) as DetectedInputLanguage | null,
    preferredLanguageMode,
  };
};

const detectInputLanguage = (text: unknown): DetectedInputLanguage => {
  const raw = safeString(text).trim();
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  const hasArabic = /[\u0600-\u06FF]/.test(raw);
  const swahiliScore = [
    /\b(na|kwa|katika|ni|ya|za|hii|hapo|kwenye|tafadhali|swali|hesabu|somo|mwalimu|nisaidie|eleza)\b/g,
  ].reduce((total, pattern) => total + ((lower.match(pattern) || []).length), 0);
  const englishScore = [
    /\b(the|and|what|why|how|please|question|solve|explain|student|lesson|because)\b/g,
  ].reduce((total, pattern) => total + ((lower.match(pattern) || []).length), 0);

  if (hasArabic && (swahiliScore > 0 || englishScore > 0)) return 'mixed';
  if (hasArabic) return 'arabic';
  if (swahiliScore > 0 && englishScore > 0) return 'mixed';
  if (swahiliScore > englishScore) return 'swahili';
  if (englishScore > 0) return 'english';
  return 'unknown';
};

const buildMessageLanguageMetadata = (args: {
  text: string;
  sessionLanguageState: SessionLanguageState;
  detectedInputLanguage?: DetectedInputLanguage | null;
}): Record<string, unknown> => ({
  detectedInputLanguage: args.detectedInputLanguage || detectInputLanguage(args.text),
  preferredResponseLanguageAtTurn: args.sessionLanguageState.preferredResponseLanguage,
  learningSupportModeAtTurn: args.sessionLanguageState.learningSupportMode || null,
  generatedLanguage: args.sessionLanguageState.preferredResponseLanguage,
  sourceInputLanguage: args.detectedInputLanguage || detectInputLanguage(args.text),
  voiceOutputLanguageAtTurn: args.sessionLanguageState.voiceOutputLanguage || null,
  simplicityLevelAtTurn: args.sessionLanguageState.simplicityLevel || null,
  preferredLanguageModeAtTurn: args.sessionLanguageState.preferredLanguageMode || null,
});

const parseMaybeJsonRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return asRecord(value);
};

const recordAssistantEnvelopeAnalytics = (args: {
  userId: string;
  sessionId?: string | null;
  messageId?: string | null;
  subject?: string | null;
  topic?: string | null;
  assistantMetadata?: AssistantResponseMeta | null;
}) => {
  const envelope = asRecord(args.assistantMetadata?.assistantEnvelope);
  if (!envelope) return;
  const presentation = asRecord(envelope.presentation);
  const reflectCard = asRecord(presentation?.reflectCard);
  const notices = Array.isArray(envelope.systemNotices) ? envelope.systemNotices : [];
  void recordLearningEffectEvent({
    userId: args.userId,
    sessionId: args.sessionId || null,
    messageId: args.messageId || null,
    subject: args.subject || null,
    topic: args.topic || null,
    eventType: 'assistant_envelope_emitted',
    metadata: {
      version: safeString(envelope.version).trim() || 'unknown',
      route: safeString(envelope.route).trim() || 'unknown',
      hasPresentation: Boolean(presentation),
      hasReflectCard: Boolean(reflectCard),
      noticeCount: notices.length,
    },
  });
};

const mapLearningEffectToMasteryEvidence = (args: {
  eventType: string;
  topic?: string | null;
  subject?: string | null;
}): import('../lib/types').MasteryEvidenceSignal | null => {
  const topic = safeString(args.topic).trim();
  if (!topic) return null;

  const eventType = safeString(args.eventType).trim();
  const evidenceType =
    eventType === 'attempted_before_help' || eventType === 'selected_try_again'
      ? 'attempted_after_prompt'
      : eventType === 'correction_after_feedback' || eventType === 'concept_explanation_success'
        ? 'correct_after_support'
        : eventType === 'repeated_mistake'
          ? 'repeated_mistake'
          : eventType === 'repeated_mistake_reduction' || eventType === 'weak_topic_improvement'
            ? 'repeated_mistake_reduced'
            : eventType === 'transfer_success' || eventType === 'practice_completion' || eventType === 'topic_return_with_improvement'
              ? 'similar_problem_success'
              : eventType === 'explained_in_own_words'
                ? 'explain_back_success'
                : eventType === 'revision_reuse' || eventType === 'used_revision_again'
                  ? 'revision_reuse_success'
                  : eventType === 'chose_hint_before_full_explanation'
                    ? 'needed_multiple_hints'
                    : eventType === 'simplify_led_to_improvement' || eventType === 'example_led_to_improvement' || eventType === 'worked_step_led_to_improvement' || eventType === 'revision_quiz_led_to_recall'
                      ? 'support_strategy_helped'
                      : eventType === 'support_strategy_failed'
                        ? 'support_strategy_failed'
                        : null;

  if (!evidenceType) return null;

  return {
    topic,
    subject: safeString(args.subject).trim() || null,
    evidenceType,
  };
};

const toWhisperLanguage = (mode: VoiceLanguageMode): 'en' | 'ar' | 'sw' => {
  if (mode === 'arabic' || mode === 'arabic_english') return 'ar';
  if (mode === 'swahili') return 'sw';
  return 'en';
};

const buildSttPrompt = (mode: VoiceLanguageMode): string => {
  if (mode === 'arabic' || mode === 'arabic_english') {
    return '\u0641\u0631\u0651\u063a \u0627\u0644\u0643\u0644\u0627\u0645 \u0628\u062f\u0642\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0643\u0645\u0627 \u0642\u064a\u0644\u060c \u0648\u0644\u0627 \u062a\u0642\u0645 \u0628\u0627\u0644\u062a\u0631\u062c\u0645\u0629.';
  }
  if (mode === 'swahili') {
    return 'Transcribe clearly in Kiswahili exactly as spoken. Usitafsiri.';
  }
  return 'Transcribe clearly in English exactly as spoken. Do not translate.';
};

const sanitizeTtsInput = (raw: string, mode: VoiceLanguageMode): string => {
  let out = safeString(raw)
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[`*_#>~]/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/([.!?]){2,}/g, '$1')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (mode === 'arabic' || mode === 'arabic_english') {
    out = out.replace(/\?/g, '\u061f').replace(/;/g, '\u061b').replace(/,/g, '\u060c');
  }
  return out;
};

const normalizeVoiceBehaviorProfile = (value: unknown): VoiceBehaviorProfile => {
  const normalized = safeString(value).toLowerCase().trim();
  if (normalized === 'focus_voice') return 'focus_voice';
  if (normalized === 'exam_voice') return 'exam_voice';
  if (normalized === 'revision_voice') return 'revision_voice';
  if (normalized === 'reading_voice') return 'reading_voice';
  return 'tutor_voice';
};

const resolveVoiceBehaviorProfile = (context: {
  requestedProfile?: unknown;
  destination?: unknown;
  hasRevisionContext?: boolean;
  hasReadingContext?: boolean;
  hasFocusContext?: boolean;
  hasExamContext?: boolean;
}): VoiceBehaviorProfile => {
  if (context.requestedProfile != null) {
    return normalizeVoiceBehaviorProfile(context.requestedProfile);
  }

  const destination = safeString(context.destination).toLowerCase().trim();
  if (context.hasExamContext) return 'exam_voice';
  if (context.hasFocusContext) return 'focus_voice';
  if (context.hasReadingContext || destination === 'media') return 'reading_voice';
  if (context.hasRevisionContext || destination === 'revision') return 'revision_voice';
  return 'tutor_voice';
};

const buildVoiceBehaviorInstruction = (profile: VoiceBehaviorProfile): string => {
  if (profile === 'exam_voice') {
    return 'Use concise exam coaching: require first attempt, minimal hints before attempt, then brief corrective feedback.';
  }
  if (profile === 'focus_voice') {
    return 'Use focus coaching: one next step only, lower branching, calming rhythm, and short grounding prompts.';
  }
  if (profile === 'revision_voice') {
    return 'Keep it concise, retrieval-first, and revision-focused with one clear check at a time.';
  }
  if (profile === 'reading_voice') {
    return 'Read clearly and calmly for recap playback with short, steady phrasing and no filler.';
  }
  return 'Speak like a serious tutor: short, clear, Socratic, and one step at a time.';
};

const buildTtsInstruction = (mode: VoiceLanguageMode, profile: VoiceBehaviorProfile = 'tutor_voice'): string => {
  const behaviorInstruction = buildVoiceBehaviorInstruction(profile);
  const safetyInstruction =
    'Keep tone respectful, calm, modest, family-safe, and culturally sensitive for Muslim learners. Avoid flippant phrasing.';
  if (mode === 'arabic') {
    return `\u062a\u062d\u062f\u062b \u0643\u0645\u0639\u0644\u0645 \u0647\u0627\u062f\u0626 \u0644\u0637\u0627\u0644\u0628 \u0648\u0627\u062d\u062f \u0628\u0644\u063a\u0629 \u0637\u0628\u064a\u0639\u064a\u0629 \u0633\u0644\u0633\u0629 \u0628\u062f\u0648\u0646 \u0648\u0642\u0641\u0627\u062a \u0637\u0648\u064a\u0644\u0629. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'swahili') {
    return `Ongea kama mwalimu mwenye upole kwa mtiririko laini bila mapumziko marefu. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'english_sw') {
    return `Speak in natural English and Swahili mix as a warm teacher with smooth pacing. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  if (mode === 'arabic_english') {
    return `Speak naturally as a bilingual Arabic-English teacher with smooth transitions. ${behaviorInstruction} ${safetyInstruction}`.trim();
  }
  return `Speak like a warm teacher talking to one student with smooth pacing and short pauses. ${behaviorInstruction} ${safetyInstruction}`.trim();
};

async function ensureCopilotPreferencesMetadataColumn(): Promise<void> {
  if (!ensureCopilotPreferencesMetadataPromise) {
    ensureCopilotPreferencesMetadataPromise = prisma.$executeRawUnsafe(
      `ALTER TABLE "CopilotPreferences" ADD COLUMN IF NOT EXISTS "metadata" JSONB NULL;`
    ).then(() => undefined).catch((error) => {
      ensureCopilotPreferencesMetadataPromise = null;
      throw error;
    });
  }
  return ensureCopilotPreferencesMetadataPromise;
}

async function getCopilotPreferencesMetadata(userId: string): Promise<Record<string, unknown>> {
  await ensureCopilotPreferencesMetadataColumn();
  const [row] = await prisma.$queryRawUnsafe<Array<{ metadata?: unknown }>>(
    `SELECT "metadata" FROM "CopilotPreferences" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  return asRecord(row?.metadata) || {};
}

async function updateCopilotPreferencesMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
  await ensureCopilotPreferencesMetadataColumn();
  await prisma.$executeRawUnsafe(
    `UPDATE "CopilotPreferences" SET "metadata" = CAST($2 AS JSONB) WHERE "userId" = $1`,
    userId,
    JSON.stringify(metadata)
  );
}

const COPILOT_THEME_PREFERENCE_VALUES = new Set(['system', 'light', 'dark']);
const STUDY_ATMOSPHERE_IDS = new Set([
  'midnight_scholar',
  'soft_paper',
  'rose_studio',
  'forest_calm',
  'violet_library',
  'ember_focus',
  'ocean_glass',
]);

type CopilotThemePreferenceValue = 'system' | 'light' | 'dark';
type StudyAtmospherePreferenceValue = {
  presetId: string;
  useAdvanced: boolean;
  customBaseColor: string | null;
};
type MediaRecapPreferenceValue = 'audio' | 'video' | 'visual' | 'mixed';
type MediaShortSupportPreferenceValue = 'concept_intuition' | 'worked_example' | 'quick_recap';
type MediaPreferenceValue = {
  preferredRecapType: MediaRecapPreferenceValue;
  shortFormSupport: MediaShortSupportPreferenceValue;
  allowExternalCreativeSuggestions: boolean;
};

const DEFAULT_STUDY_ATMOSPHERE_PREFERENCE: StudyAtmospherePreferenceValue = {
  presetId: 'midnight_scholar',
  useAdvanced: false,
  customBaseColor: null,
};
const MEDIA_RECAP_PREFERENCE_VALUES = new Set(['audio', 'video', 'visual', 'mixed']);
const MEDIA_SHORT_SUPPORT_VALUES = new Set(['concept_intuition', 'worked_example', 'quick_recap']);
const DEFAULT_MEDIA_PREFERENCES: MediaPreferenceValue = {
  preferredRecapType: 'mixed',
  shortFormSupport: 'concept_intuition',
  allowExternalCreativeSuggestions: true,
};

const normalizeCopilotThemePreferenceValue = (
  value: unknown
): CopilotThemePreferenceValue => {
  const normalized = safeString(value).toLowerCase();
  if (COPILOT_THEME_PREFERENCE_VALUES.has(normalized)) {
    return normalized as CopilotThemePreferenceValue;
  }
  return 'system';
};

const normalizeHexColorValue = (value: unknown): string | null => {
  const raw = safeString(value).trim();
  if (!raw) return null;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(withHash)) return null;
  if (withHash.length === 4) {
    const [_, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return withHash.toLowerCase();
};

const normalizeStudyAtmospherePreferenceValue = (
  value: unknown,
  fallback?: StudyAtmospherePreferenceValue
): StudyAtmospherePreferenceValue => {
  const source = asRecord(value) || {};
  const fallbackValue = fallback || DEFAULT_STUDY_ATMOSPHERE_PREFERENCE;
  const presetCandidate = safeString(source.presetId).toLowerCase();
  const presetId = STUDY_ATMOSPHERE_IDS.has(presetCandidate)
    ? presetCandidate
    : fallbackValue.presetId;
  const useAdvanced = source.useAdvanced !== undefined
    ? Boolean(source.useAdvanced)
    : fallbackValue.useAdvanced;
  const customBaseColor = normalizeHexColorValue(source.customBaseColor);
  return {
    presetId,
    useAdvanced,
    customBaseColor: customBaseColor || null,
  };
};

const readAppearanceMetadata = (metadata: Record<string, unknown>) => {
  const appearance = asRecord(metadata.appearance) || {};
  const copilotThemePreference = normalizeCopilotThemePreferenceValue(
    appearance.copilotThemePreference
  );
  const studyAtmosphere = normalizeStudyAtmospherePreferenceValue(
    appearance.studyAtmosphere,
    DEFAULT_STUDY_ATMOSPHERE_PREFERENCE
  );
  return {
    copilotThemePreference,
    studyAtmosphere,
  };
};

const normalizeMediaPreferencesValue = (
  value: unknown,
  fallback?: MediaPreferenceValue
): MediaPreferenceValue => {
  const source = asRecord(value) || {};
  const base = fallback || DEFAULT_MEDIA_PREFERENCES;
  const recapCandidate = safeString(source.preferredRecapType).trim().toLowerCase();
  const supportCandidate = safeString(source.shortFormSupport).trim().toLowerCase();
  return {
    preferredRecapType: MEDIA_RECAP_PREFERENCE_VALUES.has(recapCandidate)
      ? (recapCandidate as MediaRecapPreferenceValue)
      : base.preferredRecapType,
    shortFormSupport: MEDIA_SHORT_SUPPORT_VALUES.has(supportCandidate)
      ? (supportCandidate as MediaShortSupportPreferenceValue)
      : base.shortFormSupport,
    allowExternalCreativeSuggestions:
      source.allowExternalCreativeSuggestions === undefined
        ? base.allowExternalCreativeSuggestions
        : Boolean(source.allowExternalCreativeSuggestions),
  };
};

const normalizeLearningStyleSignals = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const entry of value) {
    const signal = safeString(entry).trim().toLowerCase();
    if (!signal || seen.has(signal)) continue;
    seen.add(signal);
    list.push(signal);
  }
  return list.slice(0, 10);
};

const readLearningStudioMetadata = (metadata: Record<string, unknown>) => {
  const learningStudio = asRecord(metadata.learningStudio) || {};
  const mediaPreferences = normalizeMediaPreferencesValue(
    learningStudio.mediaPreferences,
    DEFAULT_MEDIA_PREFERENCES
  );
  const learningStyleSignals = normalizeLearningStyleSignals(learningStudio.learningStyleSignals);
  return {
    mediaPreferences,
    learningStyleSignals,
  };
};

const extractVideoData = (metadata: any) => {
  if (!metadata || typeof metadata !== 'object') return null;
  return metadata.videoData || metadata.video || null;
};

const VIDEO_RECOMMENDATION_INTENTS = new Set<VideoRecommendationIntent>([
  'concept_explainer',
  'worked_example',
  'revision_recap',
  'visual_animation',
  'exam_help',
  'beginner_friendly',
  'misconception_fix',
  'language_support',
]);

function normalizeVideoRecommendationIntent(value: unknown): VideoRecommendationIntent | null {
  const normalized = safeString(value).trim();
  return VIDEO_RECOMMENDATION_INTENTS.has(normalized as VideoRecommendationIntent)
    ? (normalized as VideoRecommendationIntent)
    : null;
}

const extractSources = (metadata: any) => {
  if (!metadata || typeof metadata !== 'object') return undefined;
  return sanitizeSources(Array.isArray(metadata.sources) ? metadata.sources : undefined);
};

const extractAttachmentSummaries = (metadata: any) => {
  if (!metadata || typeof metadata !== 'object') return undefined;
  return Array.isArray(metadata.attachments) ? metadata.attachments : undefined;
};

const deriveImageFromMessage = (msg: any) => {
  const metadata = msg?.metadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  const image = metadata.image;
  if (image && typeof image === 'object') {
    const src = safeString(image.src);
    if (src) {
      return {
        src,
        alt: safeString(image.alt) || 'Uploaded study material',
      };
    }
  }

  const rawFileData = metadata.fileData;
  const attachments = Array.isArray(rawFileData) ? rawFileData : rawFileData ? [rawFileData] : [];
  const imageAttachment = attachments.find((attachment: any) => safeString(attachment?.kind || 'image') === 'image');
  if (!imageAttachment) return undefined;
  const base64 = safeString(imageAttachment?.base64);
  if (!base64) return undefined;
  return {
    src: `data:${safeString(imageAttachment?.mimeType || imageAttachment?.type || 'image/jpeg')};base64,${base64}`,
    alt: safeString(imageAttachment?.fileName) || 'Uploaded study material',
  };
};

const extractYoutubeVideoIdFromText = (text: string): string | null => {
  const raw = String(text || '');
  const longMatch = raw.match(/(?:youtube\.com\/watch\?[^)\s]*v=)([A-Za-z0-9_-]{6,15})/i);
  if (longMatch?.[1]) return longMatch[1];
  const shortMatch = raw.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{6,15})/i);
  if (shortMatch?.[1]) return shortMatch[1];
  return null;
};

const deriveVideoDataFromMessage = (msg: any) => {
  const stored = extractVideoData(msg?.metadata);
  if (stored?.id || stored?.videoId) {
    const videoId = safeString(stored?.id || stored?.videoId).trim();
    if (videoId) {
      const trustTier = safeString(stored?.trustTier).trim();
      return {
        ...stored,
        id: videoId,
        videoId,
        title: safeString(stored?.title).trim() || 'Recommended video',
        channel: safeString(stored?.channel).trim() || undefined,
        channelTitle: safeString(stored?.channelTitle).trim() || undefined,
        thumbnailUrl: safeString(stored?.thumbnailUrl).trim() || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        whyRecommended: limitText(safeString(stored?.whyRecommended).trim(), 220) || null,
        trustTier: ['high', 'medium', 'limited'].includes(trustTier) ? trustTier : null,
        transcriptAvailable: typeof stored?.transcriptAvailable === 'boolean' ? stored.transcriptAvailable : null,
        language: safeString(stored?.language).trim() || null,
        intent: normalizeVideoRecommendationIntent(stored?.intent),
      };
    }
  }
  const fallbackId = extractYoutubeVideoIdFromText(msg?.content);
  if (!fallbackId) return null;
  return {
    id: fallbackId,
    videoId: fallbackId,
    title: 'Recommended video',
    thumbnailUrl: `https://img.youtube.com/vi/${fallbackId}/hqdefault.jpg`,
  };
};

function buildStoredMessageMetadata(message: Record<string, any> | null | undefined): Record<string, unknown> {
  const base = asRecord(message?.metadata) || {};
  const videoData = deriveVideoDataFromMessage({ metadata: { ...base, videoData: message?.videoData || message?.video || base.videoData || base.video } });
  const sources = sanitizeSources(
    Array.isArray(message?.sources)
      ? message.sources
      : Array.isArray(base.sources)
        ? (base.sources as Array<Record<string, unknown>>)
        : undefined
  );

  return {
    ...base,
    ...(videoData ? { videoData, video: videoData } : {}),
    ...(sources.length > 0 ? { sources } : {}),
    ...(message?.image && typeof message.image === 'object' ? { image: message.image } : {}),
  };
}

const HIGH_RISK_SEVERITIES = new Set(['high', 'critical']);

const prismaAny = prisma as any;

async function logSafetyAuditEvent(args: {
  actorId: string;
  actorRole: UserRole | string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!prismaAny?.safetyEventAudit) return;
  try {
    await prismaAny.safetyEventAudit.create({
      data: {
        actorId: args.actorId,
        actorRole: String(args.actorRole || 'student'),
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId || null,
        metadata: args.metadata || null,
      },
    });
  } catch (error) {
    logger.warn({ error: String(error), action: args.action }, '[SafetyAudit] Failed to write audit event.');
  }
}

async function createSafetyAlertIfNeeded(args: {
  studentId: string;
  sessionId?: string | null;
  messageId?: string | null;
  text: string;
  source: string;
}) {
  if (!prismaAny?.safetyAlert) return null;

  const assessment = detectSafetyRisk(args.text);
  if (!assessment.flagged || !assessment.severity || !assessment.category) return null;

  try {
    const created = await prismaAny.safetyAlert.create({
      data: {
        studentId: args.studentId,
        sessionId: args.sessionId || null,
        messageId: args.messageId || null,
        category: assessment.category,
        severity: assessment.severity,
        confidence: assessment.confidence,
        riskScore: assessment.riskScore,
        excerptRedacted: assessment.excerptRedacted,
        status: 'open',
        metadata: {
          source: args.source,
          reasons: assessment.reasons,
        },
      },
    });

    const shouldNotify = HIGH_RISK_SEVERITIES.has(assessment.severity) && assessment.needsCounselorReport;
    if (shouldNotify) {
      const notified = await notifyCounselor({
        alertId: created.id,
        studentId: created.studentId,
        sessionId: created.sessionId || null,
        messageId: created.messageId || null,
        category: created.category,
        severity: created.severity,
        confidence: created.confidence,
        excerptRedacted: created.excerptRedacted,
        createdAt: created.createdAt.toISOString(),
      });

      if (notified) {
        await prismaAny.safetyAlert.update({
          where: { id: created.id },
          data: {
            counselorNotified: true,
            counselorNotifiedAt: new Date(),
          },
        });
      }
    }

    return created;
  } catch (error) {
    logger.error({ error: String(error), source: args.source }, '[SafetyAlert] Failed to create alert.');
    return null;
  }
}

type HistoryMessage = {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  image?: { src: string; alt?: string };
  videoData?: {
    id: string;
    title?: string;
    channel?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    videoId?: string;
    whyRecommended?: string | null;
    trustTier?: 'high' | 'medium' | 'limited' | null;
    transcriptAvailable?: boolean | null;
    language?: string | null;
    intent?: VideoRecommendationIntent | null;
  };
  metadata?: Record<string, unknown> | null;
};

const HISTORY_RECENT_WINDOW = 10;
const HISTORY_ANCHOR_WINDOW = 8;

function scoreHistoryMessageImportance(message: HistoryMessage): number {
  const content = safeString(message.content).replace(/\s+/g, ' ').trim().toLowerCase();
  const metadata = message.metadata || {};
  let score = message.role === 'user' ? 1 : 0.5;

  if (message.image?.src) score += 4;
  if (message.videoData?.id) score += 4;
  if (Array.isArray((metadata as any)?.attachments) && (metadata as any).attachments.length > 0) score += 4;
  if (Array.isArray((metadata as any)?.sources) && (metadata as any).sources.length > 0) score += 3;
  if (Array.isArray((metadata as any)?.tutorArtifacts) && (metadata as any).tutorArtifacts.length > 0) score += 4;
  if (safeString((metadata as any)?.attachmentContextSummary).trim()) score += 3;
  if (/\b(remember|i prefer|my weak topic|exam|timeline|teacher correction|key rule|definition|means|formula)\b/.test(content)) score += 3;
  if (/\b(always|never|do not|don't|important|surah|ayah|hadith|bukhari|muslim)\b/.test(content)) score += 2;

  return score;
}

const trimHistoryForModel = (messages: HistoryMessage[]): HistoryMessage[] => {
  const bounded = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    ...m,
    content: m.content.slice(0, MAX_MESSAGE_CHARS),
  }));

  const recent = bounded.slice(-HISTORY_RECENT_WINDOW);
  const recentIds = new Set(recent.map((message) => message.id));
  const anchors = bounded
    .filter((message) => !recentIds.has(message.id))
    .map((message, index) => ({
      message,
      score: scoreHistoryMessageImportance(message),
      index,
    }))
    .filter((entry) => entry.score >= 3)
    .sort((a, b) => b.score - a.score || b.index - a.index)
    .slice(0, HISTORY_ANCHOR_WINDOW)
    .map((entry) => entry.message);

  const prioritized = [...anchors, ...recent]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .filter((message, index, all) => all.findIndex((candidate) => candidate.id === message.id) === index);

  let runningChars = 0;
  const kept: HistoryMessage[] = [];
  for (let i = prioritized.length - 1; i >= 0; i -= 1) {
    const next = prioritized[i];
    if (runningChars + next.content.length > MAX_HISTORY_CHARS && kept.length > 0) {
      break;
    }
    runningChars += next.content.length;
    kept.push(next);
  }
  return kept.reverse();
};

const ensureVoiceTimeAvailable = async (studentId: string, res: Response): Promise<boolean> => {
  const remainingSeconds = await getVoiceBalanceSeconds(studentId);
  if (remainingSeconds > 0) return true;

  res.status(402).send({
    reason: 'time_exhausted',
    remainingSeconds: 0,
    message: 'Voice time finished'
  });
  return false;
};

const readVoiceSessionUsageId = (req: Request): string => {
  const headerValue = req.headers['x-voice-session-id'];
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const normalizedHeader = safeString(fromHeader);
  if (normalizedHeader) return normalizedHeader;
  return safeString((req as Request & { body?: Record<string, unknown> }).body?.sessionUsageId);
};

const ensureActiveVoiceSession = async (
  studentId: string,
  sessionUsageId: string,
  res: Response
): Promise<boolean> => {
  if (!sessionUsageId) {
    res.status(400).send({ message: 'sessionUsageId is required.' });
    return false;
  }

  const authorization = await authorizeVoiceSession({ studentId, sessionUsageId });
  if (authorization.allowed) return true;

  const status =
    authorization.reason === 'time_exhausted'
      ? 402
      : authorization.reason === 'session_not_found'
        ? 404
        : 409;
  res.status(status).send({
    reason: authorization.reason,
    remainingSeconds: authorization.remainingSeconds,
    message:
      authorization.reason === 'time_exhausted'
        ? 'Voice time finished'
        : 'Voice session is not active.'
  });
  return false;
};

const getVoiceQuotaKey = (studentId: string) => {
  const dayKey = new Date().toISOString().slice(0, 10);
  return `voice:quota:${studentId}:${dayKey}`;
};

const getDocumentQuotaKey = (studentId: string) => `doc:quota:${studentId}`;

const isDocumentKind = (kind: unknown) => {
  const raw = safeString(kind).toLowerCase();
  return raw === 'text' || raw === 'pdf';
};

const getDocumentQuotaState = async (studentId: string) => {
  const redis = await getRedisClient();
  if (!redis) {
    return {
      allowed: true,
      count: 0,
      remaining: MAX_DOCUMENT_UPLOADS_PER_24H,
      retryAfterSec: 0,
      windowSeconds: Math.floor(DOCUMENT_UPLOAD_WINDOW_MS / 1000),
      maxPerWindow: MAX_DOCUMENT_UPLOADS_PER_24H,
    };
  }

  const key = getDocumentQuotaKey(studentId);
  const now = Date.now();
  const windowStart = now - DOCUMENT_UPLOAD_WINDOW_MS;
  await redis.zRemRangeByScore(key, 0, windowStart);
  const count = await redis.zCard(key);
  const remaining = Math.max(0, MAX_DOCUMENT_UPLOADS_PER_24H - count);
  let retryAfterSec = 0;

  if (count >= MAX_DOCUMENT_UPLOADS_PER_24H) {
    const oldest = await redis.zRangeWithScores(key, 0, 0);
    if (oldest?.[0]?.score) {
      const retryMs = Math.max(0, Math.floor(oldest[0].score + DOCUMENT_UPLOAD_WINDOW_MS - now));
      retryAfterSec = Math.ceil(retryMs / 1000);
    }
  }

  return {
    allowed: count < MAX_DOCUMENT_UPLOADS_PER_24H,
    count,
    remaining,
    retryAfterSec,
    windowSeconds: Math.floor(DOCUMENT_UPLOAD_WINDOW_MS / 1000),
    maxPerWindow: MAX_DOCUMENT_UPLOADS_PER_24H,
  };
};

const consumeDocumentQuota = async (studentId: string, amount = 1) => {
  const state = await getDocumentQuotaState(studentId);
  if (!state.allowed) return state;
  if (amount <= 0) return state;
  if (state.count + amount > MAX_DOCUMENT_UPLOADS_PER_24H) {
    return {
      ...state,
      allowed: false,
      remaining: Math.max(0, MAX_DOCUMENT_UPLOADS_PER_24H - state.count),
    };
  }

  const redis = await getRedisClient();
  if (!redis) return state;

  const now = Date.now();
  const key = getDocumentQuotaKey(studentId);
  await redis.zAdd(
    key,
    Array.from({ length: amount }, (_, index) => ({
      score: now + index,
      value: `${now + index}:${Math.random().toString(36).slice(2, 8)}`,
    }))
  );
  await redis.pExpire(key, DOCUMENT_UPLOAD_WINDOW_MS * 2);

  const refreshed = await getDocumentQuotaState(studentId);
  return refreshed;
};

const consumeVoiceQuota = async (studentId: string, durationSec: number) => {
  const redis = await getRedisClient();
  if (!redis) return { allowed: true };

  const key = getVoiceQuotaKey(studentId);
  const [countRaw, secondsRaw] = await redis.hmGet(key, ['count', 'seconds']);
  const count = parseInt(countRaw || '0', 10);
  const seconds = parseInt(secondsRaw || '0', 10);

  if (count >= MAX_VOICE_SESSIONS_PER_DAY) {
    return { allowed: false, message: 'Daily voice session limit reached.' };
  }
  if (seconds + durationSec > MAX_VOICE_SECONDS_PER_DAY) {
    return { allowed: false, message: 'Daily voice time limit reached.' };
  }

  const multi = redis.multi();
  multi.hIncrBy(key, 'count', 1);
  multi.hIncrBy(key, 'seconds', durationSec);
  multi.expire(key, 60 * 60 * 24);
  await multi.exec();

  return { allowed: true };
};

const getVoiceDayRange = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const getDailyVoiceUsage = async (studentId: string) => {
  const { start, end } = getVoiceDayRange();
  const sessions = await prisma.voiceUsage.findMany({
    where: { studentId, startedAt: { gte: start, lte: end } },
    orderBy: { startedAt: 'asc' },
  });
  const count = sessions.length;
  const seconds = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
  const bonusSeconds = sessions
    .slice(MAX_VOICE_SESSIONS_PER_DAY)
    .reduce((sum, s) => sum + (s.durationSec || 0), 0);
  return { sessions, count, seconds, bonusSeconds };
};

const computeVoiceQuota = (usage: { count: number; seconds: number; bonusSeconds: number }) => {
  const remainingSeconds = Math.max(0, MAX_VOICE_SECONDS_PER_DAY - usage.seconds);
  const bonusRemaining = Math.max(0, MAX_VOICE_BALANCE_SPEND_SECONDS - usage.bonusSeconds);
  const message = "You've used today's voice time. Try again tomorrow.";

  if (remainingSeconds <= 0) {
    return { allowed: false, message, remainingSeconds, bonusRemaining, maxSessionSeconds: 0 };
  }

  if (usage.count < MAX_VOICE_SESSIONS_PER_DAY) {
    return {
      allowed: true,
      remainingSeconds,
      bonusRemaining,
      maxSessionSeconds: Math.min(MAX_VOICE_SECONDS_PER_SESSION, remainingSeconds),
    };
  }

  if (bonusRemaining <= 0) {
    return { allowed: false, message, remainingSeconds, bonusRemaining, maxSessionSeconds: 0 };
  }

  return {
    allowed: true,
    remainingSeconds,
    bonusRemaining,
    maxSessionSeconds: Math.min(remainingSeconds, bonusRemaining),
  };
};

const isPlaceholderTitle = (title?: string | null) => {
  const raw = (title || '').trim();
  if (!raw) return true;
  if (raw === 'New Chat' || raw === 'New Study Session' || raw === 'Study Session') return true;
  return /^study session\b/i.test(raw);
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
  'who', 'what', 'when', 'where', 'why', 'how', 'please', 'help', 'explain', 'tell', 'learn', 'understand',
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

const fallbackTitleFromSource = (sourceText: string) => {
  const candidate = extractKeywordTitle(sourceText) || 'Learning Topic';
  return TITLE_FORBIDDEN.has(candidate.toLowerCase()) ? 'Learning Topic' : candidate;
};

const normalizeTitleCandidate = (candidate: string, sourceText: string) => {
  let title = cleanTitleText(candidate)
    .replace(/^title\s*:\s*/i, '')
    .split('\n')[0]
    .replace(/[.!?]+$/g, '')
    .trim();

  if (!title || TITLE_FORBIDDEN.has(title.toLowerCase())) {
    return fallbackTitleFromSource(sourceText);
  }

  if (title.includes(',') || title.split(/\s+/).length > 7) {
    title = title.split(',')[0].trim();
  }

  title = title.replace(/\b(and|or|but|because|which|that|to|for|with|it)\b$/i, '').trim();

  if (/^(it|this|that|there|here)\b/i.test(title)) {
    title = fallbackTitleFromSource(sourceText);
  }

  if (!title || TITLE_FORBIDDEN.has(title.toLowerCase())) {
    return fallbackTitleFromSource(sourceText);
  }
  return title;
};

const deriveTitleFromText = (text: string) => normalizeTitleCandidate(text, text);

const deriveTitleFromSessionMessages = (messages: Array<{ role?: string; content?: string }> = []) => {
  const firstUser = messages.find((m) => m.role === 'user' && String(m.content || '').trim().length > 0);
  const firstModel = messages.find((m) => m.role === 'model' && String(m.content || '').trim().length > 0);
  const preferredSource = String(firstUser?.content || firstModel?.content || '').trim();
  if (!preferredSource) return '';
  return normalizeTitleCandidate(preferredSource, preferredSource);
};

const isWeakTitleCandidate = (title?: string | null) => {
  const raw = String(title || '').trim();
  if (!raw) return true;
  if (isPlaceholderTitle(raw)) return true;
  const lower = raw.toLowerCase();
  if (TITLE_FORBIDDEN.has(lower)) return true;
  if (raw.includes(',') || raw.split(/\s+/).length > 7) return true;
  if (/^(it|this|that|there|here)\b/i.test(raw)) return true;
  if (/\b(and|or|but|because|which|that|to|for|with|it)\b$/i.test(raw)) return true;
  return false;
};

const resolveSessionTitle = (currentTitle: string | null | undefined, messages: Array<{ role?: string; content?: string }> = []) => {
  const rawTitle = String(currentTitle || '').trim();
  if (!isWeakTitleCandidate(rawTitle)) {
    return normalizeTitleCandidate(rawTitle, rawTitle);
  }
  const fromMessages = deriveTitleFromSessionMessages(messages);
  if (fromMessages) return fromMessages;
  return normalizeTitleCandidate(rawTitle, rawTitle);
};

// --- HELPER: BACKGROUND TOPIC GENERATOR ---
const generateTopicInBackground = async (sessionId: string, firstMessage: string) => {
  try {
    const topicCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Summarize this in 3-5 words for a title (no quotes): "${firstMessage}"` }],
      temperature: 0.3,
      max_tokens: 15,
    });
    const suggestedTopic = topicCompletion.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');

    if (suggestedTopic) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { topic: normalizeTitleCandidate(suggestedTopic, firstMessage) }
      });
    }
  } catch (error) {
    logger.error({ error: String(error), sessionId }, '[Background] Topic generation failed');
  }
};

// ✅ ROBUST PROFILE GETTER (UPSERT)
const getOrCreateStudentProfile = async (studentId: string) => {
  try {
    const redis = await getRedisClient();
    const cacheKey = `profile:${studentId}`;

    if (redis) {
      try {
        const cachedProfile = await redis.get(cacheKey);
        if (cachedProfile) return JSON.parse(cachedProfile);
      } catch (err) {
        logger.warn({ error: String(err), studentId }, '[Profile] Redis read failed');
      }
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: {},
      create: {
        userId: studentId,
        name: 'Student',
        email: `${studentId}@school.com`,
        gradeLevel: 'Primary',
        profileCompleted: false,
        preferences: {},
        favoriteShows: [],
        topInterests: [],
      },
    });

    if (redis) await redis.set(cacheKey, JSON.stringify(profile), { EX: 86400 });
    return profile;

  } catch (dbError) {
    logger.error({ error: String(dbError), studentId }, '[Profile] Student profile fetch failed');
    throw dbError;
  }
};

// ============================================================================
// 1. PRELOAD LOGIC (GET /preload)
// ============================================================================
router.get('/preload', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[API] /preload hit');
  try {
    const studentUserId = req.user!.id;

    await getOrCreateStudentProfile(studentUserId);

    const [lastSession, history, revisionOverviewBase] = await Promise.all([
      prisma.chatSession.findFirst({
        where: { studentId: studentUserId, messages: { some: {} } },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { timestamp: 'desc' }, take: 12 } },
      }),
      prisma.chatSession.findMany({
        where: { studentId: studentUserId, messages: { some: {} } },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { timestamp: 'asc' }, take: 3 } },
      }),
      getRevisionOverview({ userId: studentUserId, limit: 8 }),
    ]);
    const revisionOverview = await buildExtendedRevisionOverview(studentUserId, revisionOverviewBase);

    const filteredHistory = history.filter(h => h.id !== lastSession?.id);

    const safeToISOString = (date: any) => {
      try {
        return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
      } catch (e) {
        logger.warn({ invalidDate: String(date), userId: req.user?.id }, '[Preload] Invalid date encountered during mapping');
        return new Date().toISOString();
      }
    };

    let resolvedLastSession = null;
    if (lastSession) {
      const resolvedPayload = buildSessionResponsePayload(lastSession);
      const resolvedTitle = resolvedPayload.title;
      if (resolvedTitle && resolvedTitle !== String(lastSession.topic || '').trim()) {
        prisma.chatSession.update({
          where: { id: lastSession.id },
          data: { topic: resolvedTitle }
        }).catch(() => { });
      }
      resolvedLastSession = {
        ...resolvedPayload,
        topic: resolvedTitle || lastSession.topic,
        messages: [...(resolvedPayload.messages || [])].reverse(),
      };
    }

    res.status(200).send({
      ready: true,
      studentId: studentUserId,
      lastSession: resolvedLastSession,
      revisionOverview,
      history: filteredHistory.map((session: any) => {
        const title = resolveSessionTitle(session.topic, session.messages || []);
        const tutorState = getTutorStateFromMetadata(session.metadata);
        const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
        const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
        const summaryMeta = buildSessionSummaryMeta({
          topic: session.topic,
          messages: session.messages || [],
          tutorState,
          tutorArtifacts,
          tutorRevisionNotes,
        });
        if (title && title !== String(session.topic || '').trim()) {
          prisma.chatSession.update({
            where: { id: session.id },
            data: { topic: title }
          }).catch(() => { });
        }
        return {
          id: session.id,
          title,
          createdAt: safeToISOString(session.createdAt),
          updatedAt: safeToISOString(session.updatedAt),
          firstMessage: session.messages ? (session.messages[0]?.content || null) : null,
          summary: summaryMeta.summary,
          lastTutorFocus: summaryMeta.lastTutorFocus,
          learningMode: summaryMeta.learningMode,
          hadArtifacts: summaryMeta.hadArtifacts,
          hadVideo: summaryMeta.hadVideo,
          continuationStatus: summaryMeta.continuationStatus,
          recentArtifactLabel: summaryMeta.recentArtifactLabel,
          revisionCount: summaryMeta.revisionCount,
        };
      })
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Preload route failed');
    res.status(500).send({ message: 'Could not load your study workspace right now.' });
  }
});

// ============================================================================
// 2. NEW SESSION (POST /new-session)
// ============================================================================
router.post('/new-session', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;

    await getOrCreateStudentProfile(studentUserId);

    try {
      await prisma.chatSession.updateMany({
        where: { studentId: studentUserId, isActive: true },
        data: { isActive: false },
      });
    } catch (e) {
      logger.warn({ error: String(e), userId: studentUserId }, '[New Session] Archive warning');
    }

    const newSession = await prisma.chatSession.create({
      data: {
        studentId: studentUserId,
        topic: null,
        isActive: true,
        metadata: DEFAULT_CONVERSATION_STATE,
      },
    });

    res.status(200).send({
      sessionId: newSession.id,
      topic: newSession.topic,
      createdAt: newSession.createdAt.toISOString(),
      updatedAt: newSession.updatedAt.toISOString(),
      conversationState: DEFAULT_CONVERSATION_STATE,
      tutorState: {},
    });

  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Error in /new-session');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ============================================================================
// 3. CHAT ROUTE (POST /chat) - VIDEO & TITLE PERSISTENCE
// ============================================================================
router.post('/chat', schoolAuthMiddleware, aiLimiter, async (req: AuthedRequest, res: Response) => {
  const isStreaming = req.query.stream === 'true';
  logger.info({ userId: req.user?.id, sessionId: req.body.sessionId, isStreaming }, '[API] /chat hit');
  const routeStartedAt = Date.now();
  try {
    const studentId = req.user!.id;
    const messageRaw = safeString(req.body?.message);
    const rawFileData = req.body?.fileData;
    const attachmentList = Array.isArray(rawFileData)
      ? rawFileData.filter((item: unknown) => Boolean(item) && typeof item === 'object')
      : rawFileData && typeof rawFileData === 'object'
        ? [rawFileData]
        : [];
    const fileData = attachmentList.length <= 1 ? attachmentList[0] : attachmentList;
    const sessionId = safeString(req.body?.sessionId || req.body?.currentSessionId);
    const latencyTurnId = safeString(req.body?.turnId) || createLatencyTurnId();
    const responseModeRaw = safeString(req.body?.responseMode || (isStreaming ? 'streaming' : 'default')) || 'default';
    const editedMessageId = safeString(req.body?.editedMessageId).trim() || undefined;
    const parsedTutorAction = parseTutorAction(req.body?.tutorAction);
    const requestedPersistUserMessage = req.body?.persistUserMessage !== false;
    const inputOrigin = ['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload'].includes(safeString(req.body?.inputOrigin))
      ? (safeString(req.body?.inputOrigin) as TutorActionRequest['inputOrigin'])
      : undefined;
    const composerIntent = safeString(req.body?.composerIntent).trim() || undefined;
    const linkedArtifactId = safeString(req.body?.linkedArtifactId).trim() || undefined;
    const tutorAction = parsedTutorAction
      ? {
          ...parsedTutorAction,
          ...(parsedTutorAction.inputOrigin ? {} : inputOrigin ? { inputOrigin } : {}),
          ...(parsedTutorAction.composerIntent ? {} : composerIntent ? { composerIntent } : {}),
          ...(parsedTutorAction.linkedArtifactId ? {} : linkedArtifactId ? { linkedArtifactId } : {}),
        }
      : undefined;
    const latencyContext = req.body?.latencyContext && typeof req.body?.latencyContext === 'object'
      ? req.body.latencyContext
      : null;
    const latencySttMs = Number.isFinite(Number(latencyContext?.sttMs)) ? Math.floor(Number(latencyContext.sttMs)) : undefined;
    const latencySttFirstTokenMs = Number.isFinite(Number(latencyContext?.sttFirstTokenMs))
      ? Math.floor(Number(latencyContext.sttFirstTokenMs))
      : undefined;
    const latencyTtsStartMs = Number.isFinite(Number(latencyContext?.ttsStartMs)) ? Math.floor(Number(latencyContext.ttsStartMs)) : undefined;
    const latencyTtsFirstByteMs = Number.isFinite(Number(latencyContext?.ttsFirstByteMs))
      ? Math.floor(Number(latencyContext.ttsFirstByteMs))
      : undefined;
    const latencyTutorLatencyMs = Number.isFinite(Number(latencyContext?.tutorLatencyMs))
      ? Math.floor(Number(latencyContext.tutorLatencyMs))
      : undefined;
    const latencyLanguageMode = String(
      latencyContext?.languageMode || req.body?.languageMode || req.body?.preferredLanguage || ''
    ).trim().slice(0, 64);
    const conversationState = req.body?.conversationState;
    const hasFilePayload = attachmentList.some((attachment: any) =>
      attachment?.kind === 'text'
        ? safeString(attachment?.text).length > 0
        : safeString(attachment?.base64).length > 0
    );
    const shouldPersistUserMessage = requestedPersistUserMessage || hasFilePayload || Boolean(editedMessageId);
    const documentUploadCount = attachmentList.filter((attachment: any) => {
      const hasPayload =
        attachment?.kind === 'text'
          ? safeString(attachment?.text).length > 0
          : safeString(attachment?.base64).length > 0;
      return hasPayload && isDocumentKind(attachment?.kind);
    }).length;
    const effectiveMessage = messageRaw.trim() || 'Please analyze the attached file and break it into clear steps.';
    const isRevisionSaveAction = tutorAction?.id === 'save';

    if (!sessionId) return res.status(400).send({ message: 'Session ID is required.' });
    if (!messageRaw.trim() && !hasFilePayload) return res.status(400).send({ message: 'Message or file is required.' });
    if (messageRaw.length > MAX_MESSAGE_CHARS) {
      return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
    }

    if (documentUploadCount > 0) {
      const quota = await consumeDocumentQuota(studentId, documentUploadCount);
      if (!quota.allowed) {
        return res.status(429).send({
          message: 'Daily document limit reached (2 per 24 hours).',
          ...quota,
        });
      }
    }

    await getOrCreateStudentProfile(studentId);

    const [session, preferences, preferenceMetadata] = await Promise.all([
      prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          student: { select: { name: true, gradeLevel: true, userId: true } },
          messages: { orderBy: { timestamp: 'asc' }, take: 80 }
        }
      }),
      getOrCreateCopilotPreferences(studentId),
      getCopilotPreferencesMetadata(studentId),
    ]);

    if (!session || session.student.userId !== studentId) {
      return res.status(404).send({ message: 'Session not found.' });
    }

    const existingEditedUserMessage = editedMessageId
      ? session.messages.find((message) => message.id === editedMessageId)
      : undefined;
    if (editedMessageId && !existingEditedUserMessage) {
      return res.status(404).send({ message: 'Edited message not found.' });
    }
    if (existingEditedUserMessage && existingEditedUserMessage.role !== 'user') {
      return res.status(400).send({ message: 'Only student messages can be edited.' });
    }
    const existingEditedMetadata = asRecord(existingEditedUserMessage?.metadata) || {};
    const existingEditedAttachments = Array.isArray(existingEditedMetadata.attachments)
      ? existingEditedMetadata.attachments
      : [];
    if (existingEditedUserMessage && (existingEditedAttachments.length > 0 || deriveImageFromMessage(existingEditedUserMessage))) {
      return res.status(409).send({ message: 'Messages with attachments cannot be edited in place yet.' });
    }
    if (existingEditedUserMessage && hasFilePayload) {
      return res.status(400).send({ message: 'Cannot attach new files while regenerating an edited message.' });
    }
    const priorSessionMessages = existingEditedUserMessage
      ? session.messages.filter((message) => message.id !== existingEditedUserMessage.id)
      : session.messages;

    const effectiveConversationState = buildEffectiveConversationState(
      session.metadata,
      conversationState
    );
    const studentMemory = await getStudentMemoryPayload(studentId);
    const detectedInputLanguage = detectInputLanguage(effectiveMessage);
    const sessionLanguageState = normalizeSessionLanguageState(
      req.body?.sessionLanguageState || preferenceMetadata.sessionLanguageState,
      preferences.preferredLanguage,
      detectedInputLanguage
    );
    const incomingMetacognitiveState = (asRecord(req.body?.metacognitiveState) || null) as MetacognitiveStateSnapshot | null;
    const metacognitiveProfile = await getMetacognitiveProfile(studentId);
    const mergedMetacognitiveState = mergeMetacognitiveSnapshot(
      metacognitiveProfile.recentSnapshot,
      incomingMetacognitiveState
    );
    const workspaceContextRaw = asRecord(req.body?.workspaceContext);
    const workspaceDestinationRaw = safeString(workspaceContextRaw?.activeDestination).trim();
    const workspaceDestination: FullscreenCopilotDestination | undefined = (
      ['new_session', 'search', 'revision', 'media', 'growth'].includes(workspaceDestinationRaw)
        ? workspaceDestinationRaw
        : undefined
    ) as FullscreenCopilotDestination | undefined;
    const workspaceStudyModeRaw = safeString(workspaceContextRaw?.studyMode).trim();
    const workspaceStudyMode: FullscreenStudyMode | undefined = (
      ['standard', 'focus', 'exam'].includes(workspaceStudyModeRaw)
        ? workspaceStudyModeRaw
        : undefined
    ) as FullscreenStudyMode | undefined;
    const workspaceModeFlagsRaw = asRecord(workspaceContextRaw?.modeFlags);
    const workspaceModeFlags: FullscreenModeFlags | undefined = workspaceModeFlagsRaw
      ? {
          focus: workspaceModeFlagsRaw.focus === true,
          exam: workspaceModeFlagsRaw.exam === true,
          research: workspaceModeFlagsRaw.research === true,
        }
      : undefined;
    const workspacePlusActionRaw = safeString(workspaceContextRaw?.plusAction).trim();
    const workspacePlusAction: FullscreenPlusAction | undefined = (
      ['add_files', 'recent_files', 'focus_mode', 'exam_mode', 'web_research'].includes(workspacePlusActionRaw)
        ? workspacePlusActionRaw
        : undefined
    ) as FullscreenPlusAction | undefined;
    const workspaceMediaModeRaw = safeString(workspaceContextRaw?.mediaMode).trim();
    const normalizedWorkspaceMediaMode = workspaceMediaModeRaw === 'collections' ? 'library' : workspaceMediaModeRaw;
    const workspaceContext: FullscreenWorkspaceContext | null = workspaceContextRaw
      ? {
          ...(workspaceDestination ? { activeDestination: workspaceDestination } : {}),
          ...(workspaceStudyMode ? { studyMode: workspaceStudyMode } : {}),
          ...(workspaceModeFlags ? { modeFlags: workspaceModeFlags } : {}),
          ...(workspacePlusAction ? { plusAction: workspacePlusAction } : {}),
          plusDrawerOpen: workspaceContextRaw.plusDrawerOpen === true,
          sidebarExpanded: workspaceContextRaw.sidebarExpanded !== false,
          researchModeRequested: workspaceContextRaw.researchModeRequested === true,
          revisionCollectionId: safeString(workspaceContextRaw.revisionCollectionId).trim() || null,
          revisionItemId: safeString(workspaceContextRaw.revisionItemId).trim() || null,
          mediaItemId: safeString(workspaceContextRaw.mediaItemId).trim() || null,
          mediaFilter: ['all', 'audio', 'video', 'image', 'document'].includes(safeString(workspaceContextRaw.mediaFilter).trim())
            ? (safeString(workspaceContextRaw.mediaFilter).trim() as FullscreenMediaFilter)
            : undefined,
          mediaMode: ['library', 'study_stream', 'creative_stream'].includes(normalizedWorkspaceMediaMode)
            ? (normalizedWorkspaceMediaMode as FullscreenMediaMode)
            : undefined,
          growthSection: ['overview', 'weak_topics', 'mistake_journal', 'daily_feed', 'study_plans', 'mastery_trends'].includes(safeString(workspaceContextRaw.growthSection).trim())
            ? (safeString(workspaceContextRaw.growthSection).trim() as FullscreenGrowthSection)
            : undefined,
          chatSessionId: safeString(workspaceContextRaw.chatSessionId).trim() || null,
          historySearchQuery: safeString(workspaceContextRaw.historySearchQuery).trim() || undefined,
          revisionSearchQuery: safeString(workspaceContextRaw.revisionSearchQuery).trim() || undefined,
        }
      : null;
    const focusModeRequested =
      Boolean(req.body?.focusMode) ||
      workspaceModeFlags?.focus === true ||
      workspaceStudyMode === 'focus' ||
      workspacePlusAction === 'focus_mode';
    const examModeRequested =
      Boolean(req.body?.examMode) ||
      workspaceModeFlags?.exam === true ||
      workspaceStudyMode === 'exam' ||
      workspacePlusAction === 'exam_mode';
    const forceWebSearchRequested =
      Boolean(req.body?.forceWebSearch) ||
      workspaceModeFlags?.research === true ||
      workspaceContext?.researchModeRequested === true ||
      workspacePlusAction === 'web_research';
    const redis = await getRedisClient();
    const cacheKey = buildScopedChatCacheKey({
      studentId,
      sessionId,
      message: effectiveMessage,
      preferredLanguage: sessionLanguageState.preferredLanguageMode || preferences.preferredLanguage,
      gradeLevel: session.student.gradeLevel || undefined,
      activeTopic: safeString(
        (effectiveConversationState as any)?.lastStudyTopic ||
        (effectiveConversationState as any)?.lastTopic ||
        effectiveConversationState?.lastSearchTopic?.[0] ||
        session.topic ||
        ''
      ),
      forceWebSearch: forceWebSearchRequested,
      focusMode: focusModeRequested,
      examMode: examModeRequested,
      workspaceDestination: workspaceDestination,
      workspaceStudyMode: workspaceStudyMode,
      includeVideos: Boolean(req.body?.includeVideos),
      tutorActionId: tutorAction?.id,
      tutorActionSourceMessageId: tutorAction?.sourceMessageId,
      tutorActionSelectedText: tutorAction?.selectedText,
      tutorActionLinkedArtifactId: tutorAction?.linkedArtifactId,
    });

    if (redis && !isStreaming && !hasFilePayload && !isRevisionSaveAction) {
      const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        logger.info({ userId: studentId, sessionId, cacheKey }, '[Cache] HIT - Returning scoped response');
        const parsed = JSON.parse(cachedResponse);
        return res.status(200).send({
          ...parsed,
          cached: true
        });
      }
    }

    const parsedArtifacts = hasFilePayload
      ? await buildTutorArtifactsFromUploads({
          attachments: attachmentList,
          userText: effectiveMessage,
        })
      : [];
    const attachmentNotices = buildArtifactSystemNotices({
      attachments: attachmentList,
      artifacts: parsedArtifacts,
    });
    const priorTutorState = getTutorStateFromMetadata(session.metadata);
    const effectiveArtifacts = parsedArtifacts.length > 0
      ? parsedArtifacts
      : getTutorArtifactsFromMetadata(session.metadata);
    const userMessageMetadata = {
      ...(inputOrigin ? { inputOrigin } : {}),
      ...(composerIntent ? { composerIntent } : {}),
      ...(linkedArtifactId ? { linkedArtifactId } : {}),
      ...(tutorAction ? { tutorAction } : {}),
      language: buildMessageLanguageMetadata({
        text: effectiveMessage,
        sessionLanguageState,
        detectedInputLanguage,
      }),
      metacognition: mergedMetacognitiveState,
      ...(attachmentNotices.length > 0 ? { systemNotices: attachmentNotices } : {}),
      ...(hasFilePayload
        ? {
            fileData,
            attachments: attachmentList.map((attachment: any, index: number) => ({
              name: safeString(attachment?.fileName) || `Attachment ${index + 1}`,
              kind: safeString(attachment?.kind || 'image') || 'image',
              mimeType: safeString(attachment?.mimeType || attachment?.type || ''),
              truncated: Boolean(attachment?.truncated),
            })),
            image:
              attachmentList.length === 1 && safeString(attachmentList[0]?.kind || 'image') === 'image'
                ? {
                    src: `data:${safeString(attachmentList[0]?.mimeType || attachmentList[0]?.type || 'image/jpeg')};base64,${safeString(attachmentList[0]?.base64)}`,
                    alt: safeString(attachmentList[0]?.fileName) || 'Uploaded study material',
                  }
                : undefined,
            tutorArtifacts: parsedArtifacts,
          }
        : {}),
    };
    const preAiSemanticSnapshot = buildSemanticSessionSnapshot([
      ...priorSessionMessages.map((message) => ({
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })),
      {
        role: 'user',
        content: effectiveMessage,
        metadata: userMessageMetadata,
      },
    ]);
    const resolvedModeTurnIntent = forceWebSearchRequested
      ? (focusModeRequested && examModeRequested
          ? 'hybrid_research_focus_exam_turn'
          : focusModeRequested
            ? 'hybrid_research_focus_turn'
            : examModeRequested
              ? 'hybrid_research_exam_turn'
              : 'web_research_turn')
      : focusModeRequested && examModeRequested
        ? 'hybrid_focus_exam_turn'
        : examModeRequested
          ? 'exam_mode_turn'
          : focusModeRequested
            ? 'focus_mode_turn'
            : null;

    const resolvedTurnIntent = hasFilePayload
      ? 'attachment_analysis'
      : tutorAction?.id
        ? `tutor_action_${tutorAction.id}`
        : resolvedModeTurnIntent
          ? resolvedModeTurnIntent
          : workspaceDestination
            ? `workspace_${workspaceDestination}`
            : workspacePlusAction
              ? `workspace_action_${workspacePlusAction}`
              : workspaceStudyMode
                ? `workspace_mode_${workspaceStudyMode}`
                : Boolean(req.body?.includeVideos)
                  ? 'video_enabled_study_turn'
                  : inputOrigin === 'worksheet_followup'
                    ? 'worksheet_followup'
                    : inputOrigin === 'camera_capture'
                      ? 'camera_capture'
                      : inputOrigin === 'pasted_question'
                        ? 'pasted_question'
                        : inputOrigin === 'file_upload'
                          ? 'file_upload'
                          : composerIntent
                            ? `composer_${composerIntent}`
                            : 'study_turn';
    const provisionalTutorState = buildLearnerTutorState({
      priorTutorState,
      state: effectiveConversationState,
      topic: safeString(
        (effectiveConversationState as any)?.lastStudyTopic ||
        (effectiveConversationState as any)?.lastTopic ||
        session.topic ||
        effectiveMessage
      ).trim() || undefined,
      artifacts: effectiveArtifacts,
      lastIntent: resolvedTurnIntent,
      memory: studentMemory,
      semanticSnapshot: preAiSemanticSnapshot,
      systemNotices: attachmentNotices,
      sessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
    });
    const effectiveProvisionalTutorState: TutorState = {
      ...provisionalTutorState,
      currentStudyMode: forceWebSearchRequested
        ? (focusModeRequested && examModeRequested
            ? 'hybrid_research_focus_exam'
            : focusModeRequested
              ? 'hybrid_research_focus'
              : examModeRequested
                ? 'hybrid_research_exam'
                : 'research')
        : focusModeRequested && examModeRequested
          ? 'hybrid_focus_exam'
          : examModeRequested
            ? 'exam'
            : focusModeRequested
              ? 'focus'
              : workspaceStudyMode || provisionalTutorState.currentStudyMode || 'guided',
    };

    const savedUserMessage = existingEditedUserMessage || (
      shouldPersistUserMessage
        ? await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'user',
              content: effectiveMessage,
              timestamp: new Date(),
              messageNumber: priorSessionMessages.length + 1,
              metadata: toPrismaMetadata(userMessageMetadata),
            },
          })
        : null
    );

    if (savedUserMessage) {
      await createSafetyAlertIfNeeded({
        studentId,
        sessionId,
        messageId: savedUserMessage.id,
        text: effectiveMessage,
        source: 'chat_route',
      });
    }

    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }

    let fullAiResponse = '';
    let firstTokenAt: number | null = null;
    const aiStartedAt = Date.now();

    const trimmedHistory = trimHistoryForModel(priorSessionMessages.map(m => ({
      id: m.id,
      role: m.role as "user" | "model",
      content: m.content,
      timestamp: m.timestamp,
      image: deriveImageFromMessage(m),
      videoData: deriveVideoDataFromMessage(m) || undefined,
      metadata: (m.metadata ?? null) as Record<string, unknown> | null,
    })));

    const emotionalAICopilot = await getEmotionalAICopilot();
    const aiResult = await emotionalAICopilot({
      text: effectiveMessage,
      fileData: fileData as any,
      chatHistory: trimmedHistory,
      state: effectiveConversationState,
      tutorState: effectiveProvisionalTutorState,
      studentProfile: {
        name: session.student.name || 'Student',
        gradeLevel: session.student.gradeLevel || 'Primary'
      },
      preferences: {
        preferredLanguage: preferences.preferredLanguage as any,
        interests: preferences.interests
      },
      sessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      memory: studentMemory,
      currentTitle: session.topic || undefined,
      forceWebSearch: forceWebSearchRequested,
      includeVideos: Boolean(req.body?.includeVideos),
      focusMode: focusModeRequested,
      examMode: examModeRequested,
      workspaceContext: workspaceContext || undefined,
      tutorAction,
      onToken: isStreaming ? (token: string) => {
        if (!firstTokenAt) firstTokenAt = Date.now();
        fullAiResponse += token;
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      } : undefined,
      onStatus: isStreaming
        ? (status: { phase?: string; label?: string; timestamp?: string }) => {
            const phase = safeString(status?.phase).trim() || 'progress';
            const label = safeString(status?.label).trim() || 'Working...';
            const timestamp = safeString(status?.timestamp).trim() || new Date().toISOString();
            res.write(
              `data: ${JSON.stringify({
                type: 'status',
                status: {
                  phase,
                  label,
                  timestamp,
                },
              })}\n\n`
            );
          }
        : undefined,
    });

    // If it was streaming, the fullAiResponse will be populated via onToken
    // If it wasn't, we use aiResult.processedText
    const finalContent = isStreaming ? fullAiResponse : aiResult.processedText;
    const aiDoneAt = Date.now();
    const safeSources = sanitizeSources(aiResult.sources);
    const tutorArtifacts = effectiveArtifacts;
    const resolvedTopicForTurn = safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined;
    const sourceContextMessage = tutorAction?.sourceMessageId
      ? priorSessionMessages.find((message) => message.id === tutorAction.sourceMessageId)
      : undefined;
    let savedRevisionNote: TutorRevisionNote | undefined;
    if (tutorAction?.id === 'save') {
      try {
        const revisionSave = await saveRevisionItem({
          userId: studentId,
          sessionId,
          sourceMessageId: tutorAction.sourceMessageId,
          sourceMessage: sourceContextMessage
            ? {
                id: sourceContextMessage.id,
                content: sourceContextMessage.content,
                metadata: (asRecord(sourceContextMessage.metadata) || {}) as Record<string, any>,
                videoData: deriveVideoDataFromMessage(sourceContextMessage),
              }
            : null,
          tutorActionId: tutorAction.id,
          targetContent:
            safeString(sourceContextMessage?.content).trim() ||
            safeString(tutorAction.selectedText || tutorAction.sourceText || '').trim() ||
            finalContent ||
            safeString(effectiveMessage),
          selectedText: tutorAction.selectedText,
          topic: resolvedTopicForTurn,
          subject: safeString(tutorArtifacts[0]?.subject).trim() || undefined,
          tutorState: effectiveProvisionalTutorState,
          tutorArtifacts,
          sources: safeSources,
          videoData: aiResult.videoData || deriveVideoDataFromMessage(sourceContextMessage),
        });
        savedRevisionNote = revisionSave.tutorRevisionNote;
      } catch (error) {
        logger.warn({ userId: studentId, sessionId, error: String(error) }, '[Revision] Save action failed');
      }
    }
    const tutorRevisionNotes = savedRevisionNote
      ? [savedRevisionNote, ...getTutorRevisionNotesFromMetadata(session.metadata)].slice(0, 30)
      : getTutorRevisionNotesFromMetadata(session.metadata);
    const videoSnapshot = await getOrBuildVideoTutorSnapshot({
      videoData: aiResult.videoData,
      activeTopic: safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined,
      whyRecommended: finalContent,
      priorTutorState,
    });
    const systemNotices = buildChatSystemNotices({
      attachmentNotices,
      safeSources,
      forceWebSearch: forceWebSearchRequested,
      hasVideo: Boolean(aiResult.videoData?.id),
      videoSnapshot,
      userText: effectiveMessage,
      tutorState: effectiveProvisionalTutorState,
    });
    const tutorUi = buildTutorActionUiMeta({
      tutorAction,
      activeTopic: resolvedTopicForTurn,
      savedRevisionNote,
    });
    const resolvedSubjectForTurn = safeString(
      tutorArtifacts[0]?.subject ||
      effectiveProvisionalTutorState.activeSubject ||
      inferSubjectFromTopic(resolvedTopicForTurn || effectiveMessage)
    ).trim() || undefined;
    const basePresentation = deriveMessagePresentation({
      tutorAction,
      tutorUi,
      tutorState: effectiveProvisionalTutorState,
      artifacts: tutorArtifacts,
      videoData: aiResult.videoData,
      sources: safeSources,
      systemNotices,
    });
    const { learnerLoopState, assistantMetadata, reflectionStatePatch } = await buildAssistantTurnPipeline({
      route: 'chat',
      userId: studentId,
      userText: effectiveMessage,
      assistantText: finalContent,
      topic: resolvedTopicForTurn,
      subject: resolvedSubjectForTurn,
      tutorActionId: tutorAction?.id,
      priorTutorState: effectiveProvisionalTutorState,
      currentMetacognitiveState: mergedMetacognitiveState,
      awaitingStudentAttempt: Boolean(
        (aiResult.state as ConversationState | undefined)?.awaitingPracticeQuestionAnswer ||
        effectiveProvisionalTutorState.awaitingStudentAttempt
      ),
      afterMistake: Boolean(
        mergedMetacognitiveState?.errorType ||
        /\b(incorrect|not quite|mistake|wrong step|check that step)\b/i.test(finalContent)
      ),
      afterSuccess: /\b(well done|good work|that is right|you got it|correct)\b/i.test(finalContent),
      basePresentation,
      tutorUi,
      aiAssistantMetadata: asRecord(aiResult.assistantMetadata),
      sessionLanguageState,
      detectedInputLanguage,
      generatedLanguage: sessionLanguageState.preferredResponseLanguage,
      systemNotices,
      savedRevisionNote,
      buildMessageLanguageMetadata,
    });
    const postAiSemanticSnapshot = buildSemanticSessionSnapshot([
      ...priorSessionMessages.map((message) => ({
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })),
      {
        role: 'user',
        content: effectiveMessage,
        metadata: userMessageMetadata,
      },
      {
        role: 'model',
        content: finalContent,
        metadata: {
          sources: safeSources,
          videoData: aiResult.videoData,
          tutorArtifacts,
          ...assistantMetadata,
        },
      },
    ]);
    const tutorState = {
      ...buildLearnerTutorState({
      priorTutorState,
      state: aiResult.state as ConversationState,
      topic: safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined,
      subject: resolvedSubjectForTurn,
      artifacts: tutorArtifacts,
      videoData: aiResult.videoData,
      lastIntent: resolvedTurnIntent,
      memory: studentMemory,
      semanticSnapshot: postAiSemanticSnapshot,
      videoSnapshot,
      systemNotices,
      sessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      reflectionSignal: metacognitiveProfile.lastReflectionSignal || effectiveProvisionalTutorState.reflectionSignal || null,
      topicMastery: learnerLoopState.topicMastery,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
      preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
      }),
      ...reflectionStatePatch,
      currentStudyMode: forceWebSearchRequested
        ? (focusModeRequested && examModeRequested
            ? 'hybrid_research_focus_exam'
            : focusModeRequested
              ? 'hybrid_research_focus'
              : examModeRequested
                ? 'hybrid_research_exam'
                : 'research')
        : focusModeRequested && examModeRequested
          ? 'hybrid_focus_exam'
          : examModeRequested
            ? 'exam'
            : focusModeRequested
              ? 'focus'
              : workspaceStudyMode || effectiveProvisionalTutorState.currentStudyMode || 'guided',
    };

    try {
      await updateCopilotPreferencesMetadata(studentId, {
        ...preferenceMetadata,
        sessionLanguageState: {
          ...sessionLanguageState,
          lastDetectedInputLanguage: detectedInputLanguage,
        },
      });
    } catch (error) {
      logger.warn({ userId: studentId, error: String(error) }, '[LanguageState] Preference metadata update failed');
    }

    if (
      savedUserMessage &&
      hasFilePayload &&
      (aiResult.state?.lastAttachmentContextSummary || aiResult.state?.lastAttachmentLabels?.length)
    ) {
      try {
        await prisma.chatMessage.update({
          where: { id: savedUserMessage.id },
          data: {
            metadata: {
              ...((savedUserMessage.metadata as any) || {}),
              attachmentContextSummary: aiResult.state?.lastAttachmentContextSummary,
              attachmentLabels: aiResult.state?.lastAttachmentLabels || [],
              tutorArtifacts: parsedArtifacts,
            } as any,
          },
        });
      } catch (e) {
        logger.warn({ messageId: savedUserMessage.id, error: String(e) }, '[Backend] User attachment context metadata update failed');
      }
    }

    await recordTurnLatency({
      studentId,
      sessionId,
      turnId: latencyTurnId,
      responseMode: responseModeRaw,
      route: 'backend_chat',
      forceWebSearch: forceWebSearchRequested,
      languageMode: latencyLanguageMode || undefined,
      source: 'backend_route',
      sttMs: latencySttMs,
      sttFirstTokenMs: latencySttFirstTokenMs,
      ttsStartMs: latencyTtsStartMs,
      ttsFirstByteMs: latencyTtsFirstByteMs,
      firstTokenMs: firstTokenAt ? Math.max(0, firstTokenAt - aiStartedAt) : undefined,
      tutorLatencyMs: latencyTutorLatencyMs,
      doneMs: Math.max(0, aiDoneAt - aiStartedAt),
      aiMs: Math.max(0, aiDoneAt - aiStartedAt),
      totalMs: Math.max(0, aiDoneAt - routeStartedAt),
      inputChars: effectiveMessage.length,
      outputChars: String(finalContent || '').length,
      metadata: {
        isStreaming,
        destination: workspaceDestination || null,
        studyMode: workspaceStudyMode || null,
        focusMode: focusModeRequested,
        examMode: examModeRequested,
      },
    });

    // Write AI Response with Metadata
    const savedAiMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'model',
        content: finalContent,
        timestamp: new Date(),
        messageNumber: priorSessionMessages.length + (savedUserMessage ? 2 : 1),
        metadata: toPrismaMetadata({
          videoData: aiResult.videoData,
          video: aiResult.videoData,
          sources: safeSources,
          suggestedTitle: aiResult.suggestedTitle,
          tutorArtifacts,
          videoContextSummary: videoSnapshot.activeVideoSummary,
          videoConcepts: videoSnapshot.activeVideoConcepts,
          videoWhyRecommended: videoSnapshot.activeVideoWhyRecommended,
          ...assistantMetadata,
        }),
      }
    });
    recordAssistantEnvelopeAnalytics({
      userId: studentId,
      sessionId: session.id,
      messageId: savedAiMsg.id,
      subject: resolvedSubjectForTurn || null,
      topic: resolvedTopicForTurn || null,
      assistantMetadata,
    });

    // 4. Update Session Metadata & Title (CRITICAL FIX)
    try {
      const rawSuggested = aiResult.suggestedTitle?.trim() || '';
      const suggested = rawSuggested ? normalizeTitleCandidate(rawSuggested, effectiveMessage) : '';
      const derived = suggested || deriveTitleFromText(effectiveMessage || finalContent);
      if (derived && isPlaceholderTitle(session.topic)) {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            topic: derived,
            updatedAt: new Date(),
            metadata: mergeSessionMetadata({
              existing: session.metadata,
              conversationState: aiResult.state as ConversationState,
              tutorState,
              tutorArtifacts,
              tutorRevisionNotes,
              systemNotices,
            }) as any,
          }
        });
      } else {
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            updatedAt: new Date(),
            metadata: mergeSessionMetadata({
              existing: session.metadata,
              conversationState: aiResult.state as ConversationState,
              tutorState,
              tutorArtifacts,
              tutorRevisionNotes,
              systemNotices,
            }) as any,
          }
        });
      }
    } catch (e) {
      logger.warn({ sessionId, error: String(e) }, '[Backend] Session metadata update failed');
    }

    try {
      await applyDeterministicMasteryUpdate({
        studentId,
        priorState: effectiveConversationState,
        nextState: aiResult.state as ConversationState,
        topic: safeString(aiResult.topic || tutorState.activeTopic || session.topic).trim() || undefined,
        userMessage: effectiveMessage,
        aiResponse: finalContent,
      });
    } catch (e) {
      logger.warn({ studentId, sessionId, error: String(e) }, '[Backend] Deterministic mastery update failed');
    }

    // 5. CACHE STORE
    if (redis && !hasFilePayload && !isRevisionSaveAction && finalContent.length > 10 && finalContent.length < 2000) {
      const cacheData = {
          response: finalContent,
          sessionId: session.id,
          topic: aiResult.suggestedTitle || session.topic,
          conversationState: aiResult.state,
          videoData: aiResult.videoData,
          sources: safeSources,
          tutorState,
          assistantMetadata,
      };
      await redis.set(cacheKey, JSON.stringify(cacheData), { EX: 86400 }); // Cache for 24h
    }

    if (isStreaming) {
      res.write(`data: ${JSON.stringify({
        type: 'done',
          metadata: {
            messageId: savedAiMsg.id,
            sessionId: session.id,
            topic: aiResult.suggestedTitle || session.topic,
            state: aiResult.state,
            video: aiResult.videoData,
            sources: safeSources,
            tutorState,
            assistantMetadata,
          }
        })}\n\n`);
      res.end();
      return;
    }

    res.status(200).send({
      response: aiResult.processedText,
      messageId: savedAiMsg.id,
      sessionId: session.id,
      topic: aiResult.suggestedTitle || session.topic,
      conversationState: aiResult.state,
      videoData: aiResult.videoData,
      sources: safeSources,
      tutorState,
      assistantMetadata,
    });

    // Background Tasks
    if (session.messages.length === 0 && isPlaceholderTitle(session.topic)) {
      generateTopicInBackground(sessionId, effectiveMessage);
    }
    if (pineconeIndex) {
      runEmbeddingTask(sessionId, studentId, effectiveMessage, aiResult.processedText);
    }
    runPersonalizationTask(studentId, effectiveMessage, aiResult.processedText);

  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Error in /chat');
    try {
      const studentId = req.user?.id;
      if (studentId) {
        await recordTurnLatency({
          studentId,
          sessionId: safeString(req.body?.sessionId || req.body?.currentSessionId),
          turnId: safeString(req.body?.turnId) || createLatencyTurnId(),
          responseMode: safeString(req.body?.responseMode || 'default') || 'default',
          route: 'backend_chat',
          forceWebSearch: Boolean(req.body?.forceWebSearch),
          source: 'backend_route',
          totalMs: Math.max(0, Date.now() - routeStartedAt),
          inputChars: safeString(req.body?.message).length,
          metadata: { failed: true, error: String(error) },
        });
      }
    } catch {
      // no-op
    }
    res.status(500).send({ message: 'Internal server error' });
  }
});

// --- HELPER ROUTES ---

router.post('/message', schoolAuthMiddleware, rateLimiter, async (req: AuthedRequest, res: Response) => {
  try {
    const message = req.body?.message;
    const sessionId = safeString(req.body?.sessionId || req.body?.currentSessionId);
    const conversationState = req.body?.conversationState;
    if (!sessionId) return res.status(400).send({ message: 'Session ID required.' });
    if (!message || (message.role !== 'user' && message.role !== 'model')) {
      return res.status(400).send({ message: 'Invalid message payload.' });
    }
    if (typeof message.content !== 'string' || !message.content.trim()) {
      return res.status(400).send({ message: 'Message content required.' });
    }
    if (message.content.length > MAX_MESSAGE_CHARS) {
      return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, studentId: true, topic: true, metadata: true },
    });
    if (!session || session.studentId !== req.user!.id) {
      return res.status(404).send({ message: 'Session not found.' });
    }

    const count = await prisma.chatMessage.count({ where: { sessionId } });

    let fallbackTitle: string | null = null;
    if (message?.role === 'model') {
      if (isPlaceholderTitle(session.topic)) {
        const derived = deriveTitleFromText(message?.content || '');
        fallbackTitle = derived || null;
      }
    }

    const savedMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
        timestamp: (() => {
          const ts = message.timestamp ? new Date(message.timestamp) : new Date();
          return isNaN(ts.getTime()) ? new Date() : ts;
        })(),
        messageNumber: count + 1,
        metadata: toPrismaMetadata(buildStoredMessageMetadata(message)),
      },
    });

    if (message.role === 'user') {
      await createSafetyAlertIfNeeded({
        studentId: req.user!.id,
        sessionId,
        messageId: savedMessage.id,
        text: message.content,
        source: 'message_route',
      });
    }

    const nextConversationState: ConversationState = {
      ...DEFAULT_CONVERSATION_STATE,
      ...(asRecord(session.metadata) || {}),
      ...(asRecord(conversationState) || {}),
    } as ConversationState;

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        metadata: toPrismaMetadata(mergeSessionMetadata({
          existing: session.metadata,
          conversationState: nextConversationState,
        })),
        updatedAt: new Date(),
        ...(fallbackTitle ? { topic: fallbackTitle } : {})
      },
    });

    res.status(200).send({ message: 'Message saved', savedMessage: mapSessionMessagePayload(savedMessage) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Error saving message');
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/messages/:id/edit', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const nextContent = safeString(req.body?.content).trim();
    if (!nextContent) return res.status(400).send({ message: 'Edited content is required.' });
    if (nextContent.length > MAX_MESSAGE_CHARS) {
      return res.status(413).send({ message: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` });
    }

    const targetMessage = await prisma.chatMessage.findUnique({
      where: { id: req.params.id },
      include: {
        chatSession: {
          include: {
            messages: {
              orderBy: { messageNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!targetMessage || targetMessage.chatSession.studentId !== studentUserId) {
      return res.status(404).send({ message: 'Message not found.' });
    }
    if (targetMessage.role !== 'user') {
      return res.status(400).send({ message: 'Only student messages can be edited.' });
    }

    const targetMetadata = asRecord(targetMessage.metadata) || {};
    const existingAttachments = Array.isArray(targetMetadata.attachments) ? targetMetadata.attachments : [];
    if (existingAttachments.length > 0 || deriveImageFromMessage(targetMessage)) {
      return res.status(409).send({ message: 'Messages with attachments cannot be edited in place yet.' });
    }

    if (nextContent === safeString(targetMessage.content).trim()) {
      return res.status(200).send(buildSessionResponsePayload(targetMessage.chatSession));
    }

    const session = targetMessage.chatSession;
    const targetIndex = session.messages.findIndex((message) => message.id === targetMessage.id);
    if (targetIndex < 0) {
      return res.status(404).send({ message: 'Message not found in session.' });
    }

    const laterUserTurnExists = session.messages
      .slice(targetIndex + 1)
      .some((message) => message.role === 'user');
    if (laterUserTurnExists) {
      return res.status(409).send({ message: 'Only the latest student turn can be edited safely.' });
    }

    const priorTutorState = getTutorStateFromMetadata(session.metadata);
    const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
    const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);
    const preservedNotices = getSystemNoticesFromMetadata(session.metadata);
    const studentMemory = await getStudentMemoryPayload(studentUserId);
    const now = new Date();
    const nowIso = now.toISOString();

    const existingEditMeta: Partial<MessageEditMeta> = getMessageEditMetaFromMetadata(targetMessage.metadata) || {};
    const updatedMessageMetadata = {
      ...targetMetadata,
      edit: {
        edited: true,
        editedAt: nowIso,
        originalContent: existingEditMeta.originalContent || targetMessage.content,
        editHistory: [
          ...(Array.isArray(existingEditMeta.editHistory) ? existingEditMeta.editHistory : []),
          { content: targetMessage.content, editedAt: nowIso },
        ].slice(-12),
      } satisfies MessageEditMeta,
    };

    const semanticSnapshot = buildSemanticSessionSnapshot([
      ...session.messages.slice(0, targetIndex).map((message) => ({
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })),
      {
        role: 'user',
        content: nextContent,
        metadata: updatedMessageMetadata,
      },
    ]);

    const nextTutorState = buildLearnerTutorState({
      priorTutorState,
      state: DEFAULT_CONVERSATION_STATE,
      topic: safeString(session.topic || nextContent).trim() || undefined,
      artifacts: tutorArtifacts,
      lastIntent: 'message_edit_reset',
      memory: studentMemory,
      semanticSnapshot,
      systemNotices: preservedNotices,
    });
    const mergedMetadata = mergeSessionMetadata({
      existing: session.metadata,
      conversationState: DEFAULT_CONVERSATION_STATE,
      tutorState: nextTutorState,
      tutorArtifacts,
      tutorRevisionNotes,
      systemNotices: preservedNotices,
    });

    const updatedSession = await prisma.$transaction(async (tx) => {
      await tx.chatMessage.update({
        where: { id: targetMessage.id },
        data: {
          content: nextContent,
          timestamp: now,
          metadata: toPrismaMetadata(updatedMessageMetadata),
        },
      });

      await tx.chatMessage.deleteMany({
        where: {
          sessionId: session.id,
          messageNumber: { gt: targetMessage.messageNumber },
        },
      });

      await tx.chatSession.update({
        where: { id: session.id },
        data: {
          metadata: toPrismaMetadata(mergedMetadata),
          updatedAt: now,
        },
      });

      return tx.chatSession.findUnique({
        where: { id: session.id },
        include: {
          messages: { orderBy: { timestamp: 'asc' } },
        },
      });
    });

    if (!updatedSession) {
      return res.status(500).send({ message: 'Could not rebuild the edited session.' });
    }

    return res.status(200).send(buildSessionResponsePayload(updatedSession));
  } catch (error) {
    logger.error({ error: String(error), messageId: req.params.id }, '[Backend] Message edit failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

// ✅ SESSION PATCH (HARD DEBUG VERSION WITH DETAILED LOGS)
router.patch('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  const curSessionId = req.params.id;
  try {
    const studentUserId = req.user!.id;
    const { title } = req.body;

    logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] Starting Title Update');

    // 1. Verify Session Exists & Belongs to User
    const existingSession = await prisma.chatSession.findFirst({
      where: { id: curSessionId, studentId: studentUserId }
    });

    if (!existingSession) {
      logger.error({ sessionId: curSessionId, userId: studentUserId }, '[BACKEND PATCH] ERROR: Session NOT FOUND or NOT OWNED');
      return res.status(404).send({ message: 'Session not found.' });
    }

    logger.info({ sessionId: curSessionId, userId: studentUserId, title }, '[BACKEND PATCH] ✅ Session found. Current Title: "' + existingSession.topic + '". Attempting DB Write...');

    // 2. Perform Update (Hard Error if fails)
    const safeTitle = normalizeTitleCandidate(safeString(title), existingSession.topic || '');
    const updated = await prisma.chatSession.update({
      where: { id: curSessionId },
      data: { topic: safeTitle, updatedAt: new Date() },
    });

    logger.info({ sessionId: curSessionId, newTitle: updated.topic }, '[BACKEND PATCH] ✅ Success! DB Updated');
    res.status(200).json({ message: 'Session updated', session: updated });

  } catch (error) {
    logger.error({ sessionId: curSessionId, error: String(error) }, '[BACKEND PATCH] 💥 CRITICAL DB ERROR');
    res.status(500).send({ message: 'Internal server error', error: String(error) });
  }
});

router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { studentId: studentUserId, messages: { some: {} } };
    if (search) {
      whereClause.OR = [
        { topic: { contains: search as string, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [total, history] = await Promise.all([
      prisma.chatSession.count({ where: whereClause }),
      prisma.chatSession.findMany({
        where: whereClause, skip, take: limitNum, orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { timestamp: 'asc' }, take: 3 } }
      })
    ]);

    // SELF-HEALING HISTORY: Rename old placeholder sessions using background summarization
    const sessionsWithTitles = await Promise.all(history.map(async (s) => {
      const currentTitle = String(s.topic || '').trim();
      let title = resolveSessionTitle(currentTitle, s.messages || []);
      if (title && title !== currentTitle) {
        runSummarizationTask(s.id, studentUserId);
        prisma.chatSession.update({
          where: { id: s.id },
          data: { topic: title }
        }).catch(() => { });
      }
      const tutorState = getTutorStateFromMetadata(s.metadata);
      const tutorArtifacts = getTutorArtifactsFromMetadata(s.metadata);
      const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(s.metadata);
      const summaryMeta = buildSessionSummaryMeta({
        topic: s.topic,
        messages: s.messages || [],
        tutorState,
        tutorArtifacts,
        tutorRevisionNotes,
      });
      return {
        id: s.id,
        title: title,
        updatedAt: s.updatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        firstMessage: s.messages[0]?.content || null,
        summary: summaryMeta.summary,
        lastTutorFocus: summaryMeta.lastTutorFocus,
        learningMode: summaryMeta.learningMode,
        hadArtifacts: summaryMeta.hadArtifacts,
        hadVideo: summaryMeta.hadVideo,
        continuationStatus: summaryMeta.continuationStatus,
        recentArtifactLabel: summaryMeta.recentArtifactLabel,
        revisionCount: summaryMeta.revisionCount,
      };
    }));

    res.status(200).send({
      sessions: sessionsWithTitles,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/session/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    prisma.chatSession.updateMany({
      where: { studentId: studentUserId, isActive: true, id: { not: req.params.id } },
      data: { isActive: false },
    }).catch(e => { });

    const session = await prisma.chatSession.update({
      where: { id: req.params.id, studentId: studentUserId },
      data: { isActive: true },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });

    if (!session) return res.status(404).send({ message: 'Session not found.' });
    return res.status(200).send(buildSessionResponsePayload(session));

    res.status(200).send({
      ...session,
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        // ✅ RETURN SAVED VIDEO DATA
        videoData: deriveVideoDataFromMessage(msg),
        sources: extractSources(msg.metadata),
        image: deriveImageFromMessage(msg),
      })),
      conversationState: (session.metadata as any || DEFAULT_CONVERSATION_STATE),
      tutorState: getTutorStateFromMetadata(session.metadata),
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/session/:id/tutor-state', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, studentId: studentUserId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 8,
        },
      },
    });

    if (!session) return res.status(404).send({ message: 'Session not found.' });

    const tutorState = getTutorStateFromMetadata(session.metadata);
    const tutorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
    const tutorRevisionNotes = getTutorRevisionNotesFromMetadata(session.metadata);

    return res.status(200).send({
      tutorState,
      artifacts: tutorArtifacts,
      systemNotices: getSystemNoticesFromMetadata(session.metadata),
      revisionCount: tutorRevisionNotes.length,
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.put('/session/:id/tutor-state', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, studentId: studentUserId },
      select: { id: true, metadata: true, updatedAt: true },
    });
    if (!session) return res.status(404).send({ message: 'Session not found.' });

    const incoming = asRecord(req.body?.tutorState) || {};
    const nextTutorState: TutorState = {
      ...getTutorStateFromMetadata(session.metadata),
      ...incoming,
      updatedAt: new Date().toISOString(),
    };
    const mergedMetadata = mergeSessionMetadata({
      existing: session.metadata,
      conversationState: buildEffectiveConversationState(session.metadata, null),
      tutorState: nextTutorState,
    });

    const updated = await prisma.chatSession.update({
      where: { id: session.id },
      data: { metadata: mergedMetadata as any, updatedAt: new Date() },
    });

    return res.status(200).send({
      tutorState: getTutorStateFromMetadata(updated.metadata),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const baseOverview = await getRevisionOverview({
      userId: studentUserId,
      search: safeString(req.query?.search).trim() || undefined,
      limit: Number(req.query?.limit) || undefined,
    });
    const overview = await buildExtendedRevisionOverview(studentUserId, baseOverview);

    return res.status(200).send(overview);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision overview failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const sourceMessageId = safeString(req.body?.sourceMessageId).trim() || undefined;
    const requestedSessionId = safeString(req.body?.sessionId).trim() || undefined;
    const selectedText = safeString(req.body?.selectedText).trim() || undefined;
    const collectionId = safeString(req.body?.collectionId).trim() || undefined;
    const createCollectionTitle = safeString(req.body?.createCollectionTitle).trim() || undefined;
    const overrideTitle = safeString(req.body?.title).trim() || undefined;
    const overrideSummary = safeString(req.body?.summary).trim() || undefined;
    const studentNote = safeString(req.body?.studentNote).trim() || undefined;
    const saveMode = safeString(req.body?.saveMode).trim() || undefined;
    const saveType = safeString(req.body?.saveType).trim() || undefined;
    const contentType = safeString(req.body?.contentType).trim() || undefined;
    const sourceKind = safeString(req.body?.sourceKind).trim() || undefined;
    const needsPractice = typeof req.body?.needsPractice === 'boolean' ? Boolean(req.body.needsPractice) : undefined;
    const isMistakeBased = typeof req.body?.isMistakeBased === 'boolean' ? Boolean(req.body.isMistakeBased) : undefined;
    const examPriority = typeof req.body?.examPriority === 'boolean' ? Boolean(req.body.examPriority) : undefined;
    const reflection = (asRecord(req.body?.reflection) || null) as MetacognitiveStateSnapshot | null;
    const saveTypeParse = saveType ? RevisionSaveTypeSchema.safeParse(saveType) : null;
    const saveModeParse = saveMode ? RevisionSaveModeSchema.safeParse(saveMode) : null;
    const contentTypeParse = contentType ? RevisionContentTypeSchema.safeParse(contentType) : null;
    const normalizedSaveType = saveTypeParse?.success ? saveTypeParse.data : undefined;
    const normalizedSaveMode = saveModeParse?.success ? saveModeParse.data : undefined;
    const normalizedContentType = contentTypeParse?.success ? contentTypeParse.data : undefined;

    const sourceMessageRecord = sourceMessageId
      ? await prisma.chatMessage.findUnique({
          where: { id: sourceMessageId },
          include: {
            chatSession: {
              select: { id: true, studentId: true, metadata: true },
            },
          },
        })
      : null;

    if (sourceMessageRecord && sourceMessageRecord.chatSession.studentId !== studentUserId) {
      return res.status(404).send({ message: 'Source message not found.' });
    }

    const sessionId = requestedSessionId || sourceMessageRecord?.chatSession?.id || undefined;
    const session = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, studentId: studentUserId },
          select: { id: true, metadata: true },
        })
      : null;

    if (sessionId && !session) {
      return res.status(404).send({ message: 'Session not found.' });
    }

    const sourceMessage = sourceMessageRecord
      ? {
          id: sourceMessageRecord.id,
          content: sourceMessageRecord.content,
          metadata: (asRecord(sourceMessageRecord.metadata) || {}) as Record<string, any>,
          videoData: deriveVideoDataFromMessage(sourceMessageRecord),
        }
      : null;

    const tutorState = {
      ...getTutorStateFromMetadata(session?.metadata),
      ...(asRecord(req.body?.tutorState) || {}),
    };
    const bodyArtifacts = Array.isArray(req.body?.tutorArtifacts) ? (req.body.tutorArtifacts as TutorArtifact[]) : [];
    const tutorArtifacts = bodyArtifacts.length > 0 ? bodyArtifacts : getTutorArtifactsFromMetadata(session?.metadata);
    const sources = Array.isArray(req.body?.sources) ? sanitizeSources(req.body.sources) : extractSources(sourceMessageRecord?.metadata) || [];
    const topic =
      safeString(req.body?.topic).trim() ||
      safeString(tutorState.activeTopic).trim() ||
      undefined;
    const subject =
      safeString(req.body?.subject).trim() ||
      safeString(tutorArtifacts[0]?.subject).trim() ||
      undefined;
    const targetContent =
      safeString(req.body?.content).trim() ||
      safeString(sourceMessage?.content).trim() ||
      safeString(selectedText).trim() ||
      safeString(overrideSummary).trim();

    if (!targetContent) {
      return res.status(400).send({ message: 'Revision content is required.' });
    }

    const saved = await saveRevisionItem({
      userId: studentUserId,
      sessionId,
      sourceMessageId,
      sourceMessage,
      targetContent,
      selectedText,
      topic,
      subject,
      overrideTitle,
      overrideSummary,
      collectionId,
      createCollectionTitle,
      tutorState,
      tutorArtifacts,
      sources,
      studentNote,
      saveType: normalizedSaveType,
      saveMode: normalizedSaveMode,
      contentType: normalizedContentType,
      needsPractice,
      isMistakeBased,
      examPriority,
      reflection,
      sourceKind,
      videoData:
        req.body?.videoData && typeof req.body.videoData === 'object'
          ? req.body.videoData
          : deriveVideoDataFromMessage(sourceMessageRecord),
    });

    return res.status(201).send(saved);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision save failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

type RevisionNotebookChapterDraft = {
  id: string;
  label: string;
  items: any[];
};

type RevisionNotebookChapterSummaryPayload = {
  id: string;
  label: string;
  summary: string;
  itemCount: number;
  itemIds: string[];
  generatedAt?: string | null;
};

type RevisionNotebookFlashcardPayload = {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  chapterLabel?: string | null;
  chapterId?: string | null;
  sourceItemIds?: string[];
};

function getRevisionNotebookOrderValueForRoute(item: any) {
  return typeof item?.featuredRank === 'number' && Number.isFinite(item.featuredRank)
    ? item.featuredRank
    : Number.MAX_SAFE_INTEGER;
}

function getRevisionChapterLabelForRoute(item: any) {
  const explicit = safeString(item?.bundleRole).trim();
  if (explicit) return explicit;
  const subtopic = safeString(item?.subtopic).trim();
  if (subtopic) return subtopic;
  const topic = safeString(item?.topic).trim();
  if (topic) return topic;
  if (Boolean(item?.isMistakeBased)) return 'Fixes and traps';
  if (safeString(item?.saveType).trim() === 'formula') return 'Formulas';
  if (safeString(item?.saveType).trim() === 'definition') return 'Definitions';
  return 'Core ideas';
}

function buildRevisionNotebookChaptersForRoute(items: any[]): RevisionNotebookChapterDraft[] {
  const chapters = new Map<string, RevisionNotebookChapterDraft>();
  [...items]
    .sort((left, right) => {
      const rankOrder = getRevisionNotebookOrderValueForRoute(left) - getRevisionNotebookOrderValueForRoute(right);
      if (rankOrder !== 0) return rankOrder;
      return new Date(safeString(right?.updatedAt)).getTime() - new Date(safeString(left?.updatedAt)).getTime();
    })
    .forEach((item, index) => {
      const label = getRevisionChapterLabelForRoute(item);
      const token = `${label.toLocaleLowerCase()}-${index}`;
      const existing =
        Array.from(chapters.values()).find((chapter) => chapter.label.toLocaleLowerCase() === label.toLocaleLowerCase()) || null;
      if (existing) {
        existing.items.push(item);
        return;
      }
      chapters.set(token, {
        id: token,
        label,
        items: [item],
      });
    });
  return Array.from(chapters.values());
}

function getRevisionChapterSummaryFallbackForRoute(chapter: RevisionNotebookChapterDraft) {
  const summary = chapter.items
    .map((item) => limitText(safeString(item?.summary || item?.topic || item?.title).trim(), 120))
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ');
  return summary || 'A focused reading pass for this chapter.';
}

function getRevisionNotebookPrefaceFallback(args: {
  title: string;
  topic?: string | null;
  summary?: string | null;
  chapterCount: number;
}) {
  const focus = safeString(args.topic || args.title).trim() || 'this topic';
  const summary = limitText(safeString(args.summary).trim(), 180);
  if (summary) {
    return `Open with ${focus}, then use this notebook to turn the topic into a clearer sequence. ${summary}`;
  }
  return `Open with ${focus}, then move chapter by chapter until the whole notebook feels like one connected explanation.`;
}

function getRevisionNotebookEndRecapFallback(args: {
  title: string;
  topic?: string | null;
  chapterCount: number;
}) {
  const focus = safeString(args.topic || args.title).trim() || 'the topic';
  return `By the end of this notebook, you should be able to explain ${focus} in order, spot the common trap, and revise the key ideas without starting from scratch.`;
}

function createRevisionChapterSummarySignature(collectionId: string, chapters: RevisionNotebookChapterDraft[]) {
  const hash = createHash('sha1');
  hash.update(collectionId);
  chapters.forEach((chapter) => {
    hash.update(chapter.id);
    hash.update(chapter.label);
    chapter.items.forEach((item) => {
      hash.update(safeString(item?.id));
      hash.update(safeString(item?.updatedAt));
      hash.update(String(getRevisionNotebookOrderValueForRoute(item)));
    });
  });
  return hash.digest('hex');
}

function parseCachedRevisionChapterSummaries(value: unknown): {
  signature: string;
  generatedAt: string | null;
  preface: string | null;
  endRecap: string | null;
  chapters: RevisionNotebookChapterSummaryPayload[];
} | null {
  const record = asRecord(value);
  if (!record) return null;
  const signature = safeString(record.signature).trim();
  const generatedAt = safeString(record.generatedAt).trim() || null;
  const preface = limitText(safeString(record.preface).trim(), 320) || null;
  const endRecap = limitText(safeString(record.endRecap).trim(), 320) || null;
  const chaptersRaw = Array.isArray(record.chapters) ? record.chapters : [];
  const chapters = chaptersRaw
    .map((entry) => {
      const chapter = asRecord(entry);
      if (!chapter) return null;
      const id = safeString(chapter.id).trim();
      const label = safeString(chapter.label).trim();
      const summary = limitText(safeString(chapter.summary).trim(), 240);
      if (!id || !label || !summary) return null;
      return {
        id,
        label,
        summary,
        itemCount: Math.max(1, Number(chapter.itemCount) || 0),
        itemIds: Array.isArray(chapter.itemIds)
          ? chapter.itemIds.map((itemId) => safeString(itemId).trim()).filter(Boolean)
          : [],
        generatedAt,
      } satisfies RevisionNotebookChapterSummaryPayload;
    })
    .filter((entry): entry is RevisionNotebookChapterSummaryPayload => Boolean(entry));
  if (!signature || !chapters.length) return null;
  return { signature, generatedAt, preface, endRecap, chapters };
}

function getRevisionFlashcardFallback(chapter: RevisionNotebookChapterDraft, item: any, index: number): RevisionNotebookFlashcardPayload {
  const title = safeString(item?.title).trim() || `Flashcard ${index + 1}`;
  const content =
    limitText(
      safeString(item?.summary).trim() ||
        safeString(item?.content).replace(/\s+/g, ' ').trim(),
      220
    ) || `Review the core idea for ${title}.`;
  return {
    id: `${chapter.id}-${index + 1}`,
    front: `What is the key idea behind ${title}?`,
    back: content,
    hint: chapter.label,
    chapterLabel: chapter.label,
    chapterId: chapter.id,
    sourceItemIds: [safeString(item?.id).trim()].filter(Boolean),
  };
}

function parseCachedRevisionFlashcards(value: unknown): {
  signature: string;
  generatedAt: string | null;
  deckTitle: string | null;
  scope: 'collection' | 'chapter';
  chapterId: string | null;
  chapterLabel: string | null;
  flashcards: RevisionNotebookFlashcardPayload[];
} | null {
  const record = asRecord(value);
  if (!record) return null;
  const signature = safeString(record.signature).trim();
  const generatedAt = safeString(record.generatedAt).trim() || null;
  const deckTitle = limitText(safeString(record.deckTitle).trim(), 160) || null;
  const scope = safeString(record.scope).trim() === 'chapter' ? 'chapter' : 'collection';
  const chapterId = limitText(safeString(record.chapterId).trim(), 120) || null;
  const chapterLabel = limitText(safeString(record.chapterLabel).trim(), 160) || null;
  const flashcardsRaw = Array.isArray(record.flashcards) ? record.flashcards : [];
  const flashcards = flashcardsRaw
    .map((entry) => {
      const card = asRecord(entry);
      if (!card) return null;
      const id = safeString(card.id).trim();
      const front = limitText(safeString(card.front).trim(), 220);
      const back = limitText(safeString(card.back).trim(), 260);
      if (!id || !front || !back) return null;
        return {
          id,
          front,
          back,
          hint: limitText(safeString(card.hint).trim(), 140) || null,
          chapterLabel: limitText(safeString(card.chapterLabel).trim(), 120) || null,
          chapterId: limitText(safeString(card.chapterId).trim(), 120) || null,
          sourceItemIds: Array.isArray(card.sourceItemIds)
            ? card.sourceItemIds.map((itemId) => safeString(itemId).trim()).filter(Boolean).slice(0, 4)
            : [],
      } satisfies RevisionNotebookFlashcardPayload;
    })
    .filter((entry): entry is RevisionNotebookFlashcardPayload => Boolean(entry));
  if (!signature || !flashcards.length) return null;
  return {
    signature,
    generatedAt,
    deckTitle,
    scope,
    chapterId,
    chapterLabel,
    flashcards,
  };
}

router.get('/revision/collections', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const overview = await getRevisionOverview({
      userId: studentUserId,
      search: safeString(req.query?.search).trim() || undefined,
      limit: Number(req.query?.limit) || undefined,
    });

    return res.status(200).send({
      collections: overview.collections,
      totalCollections: overview.totalCollections,
      totalItems: overview.totalItems,
      ungroupedCount: overview.ungroupedCount,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision collections failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/collections', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const title = safeString(req.body?.title).trim();
    if (!title) {
      return res.status(400).send({ message: 'A revision list title is required.' });
    }

    const collection = await createRevisionCollection({
      userId: studentUserId,
      title,
      subject: safeString(req.body?.subject).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      description: safeString(req.body?.description).trim() || null,
    });

    return res.status(201).send(collection);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision collection create failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const details = await getRevisionCollectionDetails({
      userId: studentUserId,
      collectionId: req.params.id,
      search: safeString(req.query?.search).trim() || undefined,
    });

    if (!details) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision collection detail failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const coverRefValue =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'coverRef') && req.body?.coverRef && typeof req.body.coverRef === 'object'
        ? req.body.coverRef
        : Object.prototype.hasOwnProperty.call(req.body || {}, 'coverRef')
          ? null
          : undefined;
    const metadataValue =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'metadata') && req.body?.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata)
        ? req.body.metadata
        : Object.prototype.hasOwnProperty.call(req.body || {}, 'metadata')
          ? null
          : undefined;
    const collection = await updateRevisionCollection({
      userId: req.user!.id,
      collectionId: req.params.id,
      patch: {
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        subject: Object.prototype.hasOwnProperty.call(req.body || {}, 'subject')
          ? (safeString(req.body?.subject).trim() || null)
          : undefined,
        topic: Object.prototype.hasOwnProperty.call(req.body || {}, 'topic')
          ? (safeString(req.body?.topic).trim() || null)
          : undefined,
        description: Object.prototype.hasOwnProperty.call(req.body || {}, 'description')
          ? (safeString(req.body?.description).trim() || null)
          : undefined,
        kind: Object.prototype.hasOwnProperty.call(req.body || {}, 'kind')
          ? ((safeString(req.body?.kind).trim() || null) as any)
          : undefined,
        bundleSummary: Object.prototype.hasOwnProperty.call(req.body || {}, 'bundleSummary')
          ? (safeString(req.body?.bundleSummary).trim() || null)
          : undefined,
        featuredItemIds: Object.prototype.hasOwnProperty.call(req.body || {}, 'featuredItemIds')
          ? (Array.isArray(req.body?.featuredItemIds)
              ? req.body.featuredItemIds.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
              : null)
          : undefined,
        coverRef: coverRefValue as Record<string, unknown> | null | undefined,
        metadata: metadataValue as Record<string, unknown> | null | undefined,
      },
    });

    if (!collection) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    return res.status(200).send(collection);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision collection update failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.delete('/revision/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const modeRaw = safeString(req.query?.mode).trim().toLowerCase();
    if (modeRaw && modeRaw !== 'dissolve' && modeRaw !== 'delete_with_items') {
      return res.status(400).send({ message: 'Delete mode must be "dissolve" or "delete_with_items".' });
    }
    const mode = modeRaw === 'delete_with_items' ? 'delete_with_items' : 'dissolve';
    const result = await deleteRevisionCollection({
      userId: req.user!.id,
      collectionId: req.params.id,
      mode,
    });
    if (!result.deleted) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }
    return res.status(200).send({
      ok: true,
      mode: result.mode,
      dissolvedItemCount: result.dissolvedItemCount,
      deletedItemCount: result.deletedItemCount,
      message:
        result.mode === 'delete_with_items'
          ? 'Revision list and notes deleted.'
          : 'Revision list dissolved. Notes moved to standalone space.',
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision collection delete failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/collections/:id/cover/generate', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getRevisionCollectionDetails({
      userId: req.user!.id,
      collectionId: req.params.id,
    });

    if (!details) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    const title = limitText(safeString(req.body?.title).trim() || details.collection.title, 120) || 'Study notebook';
    const topic = limitText(safeString(req.body?.topic).trim() || safeString(details.collection.topic).trim(), 120) || null;
    const subject =
      limitText(safeString(req.body?.subject).trim() || safeString(details.collection.subject).trim(), 80) ||
      inferSubjectFromTopic(topic || title) ||
      null;
    const summary =
      limitText(
        safeString(req.body?.summary).trim() ||
          safeString(details.collection.bundleSummary).trim() ||
          safeString(details.collection.description).trim(),
        220
      ) || null;
    const motto = limitText(safeString(req.body?.motto).trim(), 120) || null;
    const theme = safeString(req.body?.theme).trim().toLowerCase() || 'indigo';

    const coverPrompt = [
      'Create a premium cover illustration for an AI-native student revision notebook inside Steadfast AI.',
      'This is internal study cover art only, not an imported textbook or external note page.',
      'Use a calm, futuristic, educational style with strong composition, soft atmospheric lighting, and no clutter.',
      'Do not add logos, watermarks, UI chrome, notebook paper, or readable body text.',
      'Keep it visually distinct, symbolic, and easy for a student to recognize at a glance.',
      `Theme direction: ${theme}.`,
      subject ? `Subject: ${subject}.` : '',
      topic ? `Topic: ${topic}.` : '',
      motto ? `Mood line: ${motto}.` : '',
      summary ? `Notebook purpose: ${summary}.` : '',
      `Notebook title: ${title}.`,
    ].filter(Boolean).join('\n');

    let dataUrl: string | null = null;
    let fallbackMode: 'model' | 'svg_fallback' = 'svg_fallback';

    try {
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: coverPrompt,
        size: '1024x1024',
      });
      const b64 = imageResponse.data?.[0]?.b64_json;
      if (b64) {
        const candidate = `data:image/png;base64,${b64}`;
        if (Buffer.byteLength(candidate, 'utf8') <= MAX_MEDIA_DATA_URL_BYTES * 2) {
          dataUrl = candidate;
          fallbackMode = 'model';
        }
      }
    } catch (error) {
      logger.warn({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Notebook cover generation failed, using SVG fallback.');
    }

    if (!dataUrl) {
      dataUrl = createStudyImageFallbackDataUrl({
        title,
        prompt: `${subject || ''} ${topic || ''} ${summary || ''}`.trim() || title,
      });
      fallbackMode = 'svg_fallback';
    }

    return res.status(200).send({
      dataUrl,
      prompt: coverPrompt,
      fallbackMode,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Notebook cover generation failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/collections/:id/chapter-summaries', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getRevisionCollectionDetails({
      userId: req.user!.id,
      collectionId: req.params.id,
    });

    if (!details) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    const chapters = buildRevisionNotebookChaptersForRoute(details.items);
    if (!chapters.length) {
      return res.status(200).send({
        collectionId: details.collection.id,
        chapterSummaries: [],
        cached: true,
        generatedAt: null,
        preface: null,
        endRecap: null,
        collection: details.collection,
      });
    }

    const force = req.body?.force === true;
    const metadata = asRecord(details.collection.metadata) || {};
    const cached = parseCachedRevisionChapterSummaries(metadata.aiChapterSummaryCache);
    const signature = createRevisionChapterSummarySignature(details.collection.id, chapters);
    if (!force && cached?.signature === signature) {
      return res.status(200).send({
        collectionId: details.collection.id,
        chapterSummaries: cached.chapters,
        cached: true,
        generatedAt: cached.generatedAt,
        preface: cached.preface,
        endRecap: cached.endRecap,
        collection: details.collection,
      });
    }

    const fallbackSummaries = chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.label,
      summary: getRevisionChapterSummaryFallbackForRoute(chapter),
      itemCount: chapter.items.length,
      itemIds: chapter.items.map((item) => safeString(item?.id).trim()).filter(Boolean),
    }));
    let preface = getRevisionNotebookPrefaceFallback({
      title: details.collection.title,
      topic: details.collection.topic,
      summary: details.collection.bundleSummary || details.collection.description || null,
      chapterCount: chapters.length,
    });
    let endRecap = getRevisionNotebookEndRecapFallback({
      title: details.collection.title,
      topic: details.collection.topic,
      chapterCount: chapters.length,
    });

    let chapterSummaries = fallbackSummaries;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You write concise narrative scaffolding for internal AI-native revision notebooks. Return strict JSON with keys preface, endRecap, and chapters. preface and endRecap should each be under 45 words, feel calm and deliberate, and explain how to use the notebook. Each chapter must include label and summary. Keep each summary under 28 words. Avoid external-source language and do not talk about imported notes.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              notebook: {
                title: details.collection.title,
                subject: details.collection.subject || null,
                topic: details.collection.topic || null,
                summary: details.collection.bundleSummary || details.collection.description || null,
              },
              chapters: chapters.map((chapter, index) => ({
                label: chapter.label,
                index: index + 1,
                notes: chapter.items.slice(0, 8).map((item) => ({
                  title: safeString(item?.title).trim(),
                  summary: limitText(safeString(item?.summary).trim() || safeString(item?.content).trim(), 180),
                  type: safeString(item?.saveType || item?.contentType).trim() || 'note',
                })),
              })),
            }),
          },
        ],
      });

      const parsed = JSON.parse(safeString(completion.choices?.[0]?.message?.content) || '{}');
      const aiPreface = limitText(safeString(parsed?.preface).trim(), 320);
      const aiEndRecap = limitText(safeString(parsed?.endRecap).trim(), 320);
      const aiChapters = Array.isArray(parsed?.chapters) ? parsed.chapters : [];
      if (aiPreface) {
        preface = aiPreface;
      }
      if (aiEndRecap) {
        endRecap = aiEndRecap;
      }
      if (aiChapters.length) {
        const aiSummaryByLabel = new Map(
          aiChapters
            .map((entry: unknown) => {
              const chapter = asRecord(entry);
              if (!chapter) return null;
              const label = safeString(chapter.label).trim().toLocaleLowerCase();
              const summary = limitText(safeString(chapter.summary).trim(), 240);
              if (!label || !summary) return null;
              return [label, summary] as const;
            })
            .filter((entry): entry is readonly [string, string] => Boolean(entry))
        );

        chapterSummaries = fallbackSummaries.map((chapter) => ({
          ...chapter,
          summary: aiSummaryByLabel.get(chapter.label.toLocaleLowerCase()) || chapter.summary,
        }));
      }
    } catch (error) {
      logger.warn({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Chapter summary generation failed, using fallback summaries.');
    }

    const generatedAt = new Date().toISOString();
    const nextMetadata = {
      ...metadata,
      aiChapterSummaryCache: {
        signature,
        generatedAt,
        preface,
        endRecap,
        chapters: chapterSummaries,
      },
    };
    const updatedCollection =
      await updateRevisionCollection({
        userId: req.user!.id,
        collectionId: details.collection.id,
        patch: {
          metadata: nextMetadata,
        },
      }) || details.collection;

    return res.status(200).send({
      collectionId: details.collection.id,
      chapterSummaries: chapterSummaries.map((chapter) => ({ ...chapter, generatedAt })),
      cached: false,
      generatedAt,
      preface,
      endRecap,
      collection: updatedCollection,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Chapter summary generation failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/collections/:id/flashcards', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getRevisionCollectionDetails({
      userId: req.user!.id,
      collectionId: req.params.id,
    });

    if (!details) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    const chapters = buildRevisionNotebookChaptersForRoute(details.items);
    if (!chapters.length) {
      return res.status(200).send({
        collectionId: details.collection.id,
        flashcards: [],
        cached: true,
        generatedAt: null,
        deckTitle: null,
        scope: 'collection',
        chapterId: null,
        chapterLabel: null,
        collection: details.collection,
      });
    }

    const force = req.body?.force === true;
    const requestedChapterId = limitText(safeString(req.body?.chapterId).trim(), 120) || null;
    const selectedChapter = requestedChapterId
      ? chapters.find((chapter) => chapter.id === requestedChapterId) || null
      : null;
    if (requestedChapterId && !selectedChapter) {
      return res.status(400).send({ message: 'That chapter could not be found in this notebook.' });
    }
    const deckScope: 'collection' | 'chapter' = selectedChapter ? 'chapter' : 'collection';
    const chapterLabel = selectedChapter?.label || null;
    const chapterId = selectedChapter?.id || null;
    const chaptersForDeck = selectedChapter ? [selectedChapter] : chapters;
    const metadata = asRecord(details.collection.metadata) || {};
    const existingFlashcardCache = asRecord(metadata.aiFlashcardCache) || {};
    const cachedChapterDecks = asRecord(existingFlashcardCache.chapterDecks) || {};
    const signature = createRevisionChapterSummarySignature(
      `${details.collection.id}:flashcards:${chapterId || 'all'}`,
      chaptersForDeck
    );
    const cached = parseCachedRevisionFlashcards(
      selectedChapter ? cachedChapterDecks[selectedChapter.id] : metadata.aiFlashcardCache
    );
    if (!force && cached?.signature === signature) {
      return res.status(200).send({
        collectionId: details.collection.id,
        flashcards: cached.flashcards,
        cached: true,
        generatedAt: cached.generatedAt,
        deckTitle: cached.deckTitle,
        scope: cached.scope,
        chapterId: cached.chapterId,
        chapterLabel: cached.chapterLabel,
        collection: details.collection,
      });
    }

    const fallbackFlashcards = chaptersForDeck
      .flatMap((chapter) =>
        chapter.items.slice(0, 3).map((item, index) => getRevisionFlashcardFallback(chapter, item, index))
      )
      .slice(0, 10);

    const defaultDeckTitle = selectedChapter
      ? `${selectedChapter.label} quick deck`
      : `${details.collection.title} quick deck`;
    let deckTitle = defaultDeckTitle;
    let flashcards = fallbackFlashcards;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content:
              'Create a compact flashcard deck for an AI-native revision notebook. Return strict JSON with keys deckTitle and flashcards. Each flashcard needs front and back, may include hint, chapterLabel, and chapterId, and should help a student actively recall instead of reread. Keep front under 18 words and back under 32 words.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              notebook: {
                title: details.collection.title,
                subject: details.collection.subject || null,
                topic: details.collection.topic || null,
                summary: details.collection.bundleSummary || details.collection.description || null,
              },
              scope: selectedChapter ? `chapter-only deck for ${selectedChapter.label}` : 'whole notebook deck',
              chapters: chaptersForDeck.map((chapter) => ({
                id: chapter.id,
                label: chapter.label,
                notes: chapter.items.slice(0, 6).map((item) => ({
                  id: safeString(item?.id).trim(),
                  title: safeString(item?.title).trim(),
                  summary: limitText(safeString(item?.summary).trim() || safeString(item?.content).trim(), 180),
                })),
              })),
            }),
          },
        ],
      });
      const parsed = JSON.parse(safeString(completion.choices?.[0]?.message?.content) || '{}');
      const aiDeckTitle = limitText(safeString(parsed?.deckTitle).trim(), 160);
      const aiFlashcards = Array.isArray(parsed?.flashcards) ? parsed.flashcards : [];
      if (aiDeckTitle) {
        deckTitle = aiDeckTitle;
      }
      if (aiFlashcards.length) {
          const chapterIdByLabel = new Map(
            chaptersForDeck.map((chapter) => [chapter.label.toLocaleLowerCase(), chapter] as const)
          );
        flashcards = aiFlashcards
          .map((entry: unknown, index: number) => {
            const card = asRecord(entry);
            if (!card) return null;
            const front = limitText(safeString(card.front).trim(), 220);
            const back = limitText(safeString(card.back).trim(), 260);
            if (!front || !back) return null;
            const chapterLabel = limitText(safeString(card.chapterLabel).trim(), 120) || null;
            const matchedChapter = chapterLabel ? chapterIdByLabel.get(chapterLabel.toLocaleLowerCase()) || null : null;
            const sourceItemIds = Array.isArray(card.sourceItemIds)
              ? card.sourceItemIds.map((itemId) => safeString(itemId).trim()).filter(Boolean).slice(0, 4)
              : matchedChapter
                ? matchedChapter.items.map((item) => safeString(item?.id).trim()).filter(Boolean).slice(0, 2)
                : [];
            return {
              id: `card-${index + 1}`,
              front,
              back,
              hint: limitText(safeString(card.hint).trim(), 140) || null,
              chapterLabel,
              chapterId: matchedChapter?.id || limitText(safeString(card.chapterId).trim(), 120) || null,
              sourceItemIds,
            } satisfies RevisionNotebookFlashcardPayload;
          })
          .filter((entry): entry is RevisionNotebookFlashcardPayload => Boolean(entry))
          .slice(0, 12);
      }
    } catch (error) {
      logger.warn({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision flashcard generation failed, using fallback deck.');
    }

    const generatedAt = new Date().toISOString();
    const nextMetadata = {
      ...metadata,
      aiFlashcardCache: selectedChapter
        ? {
            ...existingFlashcardCache,
            chapterDecks: {
              ...cachedChapterDecks,
              [selectedChapter.id]: {
                signature,
                generatedAt,
                deckTitle,
                flashcards,
                scope: deckScope,
                chapterId,
                chapterLabel,
              },
            },
          }
        : {
            ...existingFlashcardCache,
            signature,
            generatedAt,
            deckTitle,
            flashcards,
            scope: deckScope,
            chapterId,
            chapterLabel,
            chapterDecks: cachedChapterDecks,
          },
    };
    const updatedCollection =
      await updateRevisionCollection({
        userId: req.user!.id,
        collectionId: details.collection.id,
        patch: {
          metadata: nextMetadata,
        },
      }) || details.collection;

    return res.status(200).send({
      collectionId: details.collection.id,
      flashcards,
      cached: false,
      generatedAt,
      deckTitle,
      scope: deckScope,
      chapterId,
      chapterLabel,
      collection: updatedCollection,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Revision flashcard generation failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/collections/:id/visuals/generate', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getRevisionCollectionDetails({
      userId: req.user!.id,
      collectionId: req.params.id,
    });

    if (!details) {
      return res.status(404).send({ message: 'Revision list not found.' });
    }

    const chapters = buildRevisionNotebookChaptersForRoute(details.items);
    const requestedVisualMode = safeString(req.body?.visualMode).trim().toLowerCase();
    const visualMode =
      requestedVisualMode === 'memory_map' || requestedVisualMode === 'process_flow' || requestedVisualMode === 'diagram'
        ? (requestedVisualMode as 'diagram' | 'memory_map' | 'process_flow')
        : 'diagram';
    const title =
      clampMediaText(
        safeString(req.body?.title).trim() ||
          `${details.collection.title} ${
            visualMode === 'memory_map' ? 'memory map' : visualMode === 'process_flow' ? 'process flow' : 'diagram'
          }`,
        120
      );
    const topic = safeString(req.body?.topic).trim() || safeString(details.collection.topic).trim() || null;
    const subject =
      safeString(req.body?.subject).trim() ||
      safeString(details.collection.subject).trim() ||
      inferSubjectFromTopic(topic || details.collection.title) ||
      null;
    const summary =
      limitText(
        safeString(req.body?.summary).trim() ||
          safeString(details.collection.bundleSummary).trim() ||
          safeString(details.collection.description).trim(),
        220
      ) || null;
    const styleHint =
      limitText(safeString(req.body?.styleHint).trim(), 120) ||
      (visualMode === 'memory_map'
        ? 'memory map with grouped ideas and short connectors'
        : visualMode === 'process_flow'
          ? 'process flow with clear arrows and step sequence'
          : 'diagram-first');

    const chapterFocus = chapters.slice(0, 3).map((chapter) => chapter.label).filter(Boolean);
    const prompt = [
      'Create a calm educational visual explainer for an internal AI-native revision notebook in Steadfast AI.',
      'This should help a student revise faster.',
      'Keep it school-safe, futuristic, clear, and revision-first.',
      'Use labels only where they truly help learning. Avoid decorative clutter, branding, or app UI.',
      visualMode === 'memory_map'
        ? 'Prefer a memory-map structure with grouped concepts, calm connectors, and clear hierarchy.'
        : visualMode === 'process_flow'
          ? 'Prefer a process-flow structure with directional arrows, sequence clarity, and stage labels.'
          : 'Prefer a diagram structure with clear spatial relationships and minimal clutter.',
      subject ? `Subject: ${subject}.` : '',
      topic ? `Topic: ${topic}.` : '',
      summary ? `Notebook focus: ${summary}.` : '',
      chapterFocus.length ? `Key chapters: ${chapterFocus.join(', ')}.` : '',
      `Visual style: ${styleHint}.`,
    ].filter(Boolean).join('\n');

    let dataUrl: string | null = null;
    let fallbackMode: 'model' | 'svg_fallback' = 'svg_fallback';
    try {
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      });
      const b64 = imageResponse.data?.[0]?.b64_json;
      if (b64) {
        const candidate = `data:image/png;base64,${b64}`;
        if (Buffer.byteLength(candidate, 'utf8') <= MAX_MEDIA_DATA_URL_BYTES * 2) {
          dataUrl = candidate;
          fallbackMode = 'model';
        }
      }
    } catch (error) {
      logger.warn({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Notebook visual generation failed, using SVG fallback.');
    }

    if (!dataUrl) {
      dataUrl = createStudyImageFallbackDataUrl({
        title,
        prompt: `${subject || ''} ${topic || ''} ${summary || ''}`.trim() || title,
      });
      fallbackMode = 'svg_fallback';
    }

    const sourceChatContext = await resolveMediaSourceChatContext({
      userId: req.user!.id,
      sessionId:
        safeString(req.body?.sessionId).trim() ||
        safeString(details.collection.sourceSessionId).trim() ||
        safeString(details.items?.[0]?.sessionId).trim() ||
        null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
    });
    if (!sourceChatContext.sourceChatSessionId) {
      return res.status(400).send({ message: 'Media assets require a source chat session context.' });
    }

    const asset = await createMediaAsset({
      userId: req.user!.id,
      assetKind: 'visual_explainer',
      title,
      summary: summary || `AI-generated visual explainer for ${details.collection.title}.`,
      subject,
      topic,
      language: 'english',
      sessionId: sourceChatContext.sourceChatSessionId,
      sourceChatSessionId: sourceChatContext.sourceChatSessionId,
      sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      collectionIds: [details.collection.id],
      dataUrl,
      thumbnailUrl: dataUrl,
      keyPoints: chapterFocus,
      quickChecks: [],
      bestUse:
        visualMode === 'memory_map'
          ? 'Use this when you want to see how ideas cluster and connect before revising details.'
          : visualMode === 'process_flow'
            ? 'Use this when the topic depends on order, stages, or cause-and-effect steps.'
            : 'Use this before or after the notebook reading pass to see the concept structure at a glance.',
      keyIdea: topic || details.collection.title,
      nextMove: 'Open the notebook chapters after scanning the visual so the details slot into a clearer mental picture.',
      revisionRelevance: `Generated from the notebook ${details.collection.title}.`,
      metadata: {
        prompt,
        fallbackMode,
        visualMode,
        notebookTitle: details.collection.title,
        generatedFrom: 'revision_notebook',
      },
      safetyStatus: 'allowed',
      sourceTrust: 'internal',
      dedupeKey: buildMediaAssetDedupeKey([
        'revision_visual',
        req.user!.id,
        details.collection.id,
        prompt,
      ]),
    });

    return res.status(200).send({
      asset,
      fallbackMode,
      visualMode,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Notebook visual generation failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/revision/items/batch', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const updates = Array.isArray(req.body?.updates)
      ? req.body.updates
          .map((entry) => {
            const patchBody = asRecord(entry?.patch) || {};
            const hasFeaturedRank = Object.prototype.hasOwnProperty.call(patchBody, 'featuredRank');
            const parsedFeaturedRank = hasFeaturedRank
              ? Number(patchBody.featuredRank)
              : undefined;
            return {
              itemId: safeString(entry?.itemId).trim(),
              patch: {
                title: typeof patchBody.title === 'string' ? patchBody.title : undefined,
                summary: typeof patchBody.summary === 'string' ? patchBody.summary : undefined,
                content: typeof patchBody.content === 'string' ? patchBody.content : undefined,
                collectionId: Object.prototype.hasOwnProperty.call(patchBody, 'collectionId')
                  ? (safeString(patchBody.collectionId).trim() || null)
                  : undefined,
                featuredRank: hasFeaturedRank
                  ? (Number.isFinite(parsedFeaturedRank) ? Math.max(1, Math.round(parsedFeaturedRank)) : null)
                  : undefined,
                bundleRole: Object.prototype.hasOwnProperty.call(patchBody, 'bundleRole')
                  ? (safeString(patchBody.bundleRole).trim() || null)
                  : undefined,
                studentNote: Object.prototype.hasOwnProperty.call(patchBody, 'studentNote')
                  ? (safeString(patchBody.studentNote).trim() || null)
                  : undefined,
                isPinned: typeof patchBody.isPinned === 'boolean' ? patchBody.isPinned : undefined,
                mastery: Object.prototype.hasOwnProperty.call(patchBody, 'mastery')
                  ? ((safeString(patchBody.mastery).trim() || null) as any)
                  : undefined,
                needsPractice: typeof patchBody.needsPractice === 'boolean' ? patchBody.needsPractice : undefined,
                isMistakeBased: typeof patchBody.isMistakeBased === 'boolean' ? patchBody.isMistakeBased : undefined,
                saveMode: Object.prototype.hasOwnProperty.call(patchBody, 'saveMode')
                  ? ((safeString(patchBody.saveMode).trim() || null) as any)
                  : undefined,
                contentType: typeof patchBody.contentType === 'string' ? (patchBody.contentType as any) : undefined,
                examPriority: typeof patchBody.examPriority === 'boolean' ? patchBody.examPriority : undefined,
                reflection: Object.prototype.hasOwnProperty.call(patchBody, 'reflection')
                  ? ((asRecord(patchBody.reflection) || null) as MetacognitiveStateSnapshot | null)
                  : undefined,
                metadataPatch: Object.prototype.hasOwnProperty.call(patchBody, 'metadataPatch')
                  ? ((asRecord(patchBody.metadataPatch) || null) as Record<string, unknown> | null)
                  : undefined,
              },
            };
          })
          .filter((entry) => entry.itemId)
      : [];

    if (!updates.length) {
      return res.status(400).send({ message: 'At least one revision update is required.' });
    }

    const items = await updateRevisionItemsBatch({
      userId: req.user!.id,
      updates,
    });

    return res.status(200).send({ items, message: 'Revision items updated.' });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision batch update failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const hasFeaturedRank = Object.prototype.hasOwnProperty.call(req.body || {}, 'featuredRank');
    const parsedFeaturedRank = hasFeaturedRank ? Number(req.body?.featuredRank) : undefined;
    const item = await updateRevisionItem({
      userId: req.user!.id,
      itemId: req.params.id,
      patch: {
        title: typeof req.body?.title === 'string' ? req.body.title : undefined,
        summary: typeof req.body?.summary === 'string' ? req.body.summary : undefined,
        content: typeof req.body?.content === 'string' ? req.body.content : undefined,
        collectionId: Object.prototype.hasOwnProperty.call(req.body || {}, 'collectionId') ? (safeString(req.body?.collectionId).trim() || null) : undefined,
        featuredRank: hasFeaturedRank ? (Number.isFinite(parsedFeaturedRank) ? Math.max(1, Math.round(parsedFeaturedRank)) : null) : undefined,
        bundleRole: Object.prototype.hasOwnProperty.call(req.body || {}, 'bundleRole') ? (safeString(req.body?.bundleRole).trim() || null) : undefined,
        studentNote: Object.prototype.hasOwnProperty.call(req.body || {}, 'studentNote') ? (safeString(req.body?.studentNote).trim() || null) : undefined,
        isPinned: typeof req.body?.isPinned === 'boolean' ? req.body.isPinned : undefined,
        mastery: Object.prototype.hasOwnProperty.call(req.body || {}, 'mastery') ? ((safeString(req.body?.mastery).trim() || null) as any) : undefined,
        needsPractice: typeof req.body?.needsPractice === 'boolean' ? req.body.needsPractice : undefined,
        isMistakeBased: typeof req.body?.isMistakeBased === 'boolean' ? req.body.isMistakeBased : undefined,
        saveMode: Object.prototype.hasOwnProperty.call(req.body || {}, 'saveMode') ? ((safeString(req.body?.saveMode).trim() || null) as any) : undefined,
        contentType: typeof req.body?.contentType === 'string' ? (req.body.contentType as any) : undefined,
        examPriority: typeof req.body?.examPriority === 'boolean' ? req.body.examPriority : undefined,
        reflection: Object.prototype.hasOwnProperty.call(req.body || {}, 'reflection')
          ? ((asRecord(req.body?.reflection) || null) as MetacognitiveStateSnapshot | null)
          : undefined,
        metadataPatch: Object.prototype.hasOwnProperty.call(req.body || {}, 'metadataPatch')
          ? ((asRecord(req.body?.metadataPatch) || null) as Record<string, unknown> | null)
          : undefined,
      },
    });
    if (!item) return res.status(404).send({ message: 'Revision item not found.' });
    return res.status(200).send({ item, message: 'Revision item updated.' });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision item update failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.delete('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const deleted = await deleteRevisionItem({
      userId: req.user!.id,
      itemId: req.params.id,
    });
    if (!deleted) return res.status(404).send({ message: 'Revision item not found.' });
    return res.status(200).send({ ok: true, message: 'Revision item deleted.' });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision item delete failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/:id/action', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const actionType = safeString(req.body?.actionType).trim();
    const normalizedActionType = actionType === 'explain' ? 'breakdown' : actionType;
    if (!['quiz', 'breakdown', 'similar_question'].includes(normalizedActionType)) {
      return res.status(400).send({ message: 'A valid revision action is required.' });
    }
    const result = await runRevisionItemAction({
      userId: req.user!.id,
      itemId: req.params.id,
      actionType: normalizedActionType as 'quiz' | 'breakdown' | 'similar_question',
    });
    if (!result) return res.status(404).send({ message: 'Revision item not found.' });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision action failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/queue', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getRevisionQueue(req.user!.id, Number(req.query?.limit) || undefined));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision queue failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/progress', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getRevisionProgressOverview(req.user!.id));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision progress failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/graph/analytics', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const days = Number(req.query?.days);
    return res.status(200).send(
      await getRevisionGraphAnalytics({
        userId: req.user!.id,
        windowDays: Number.isFinite(days) ? days : undefined,
      })
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision graph analytics failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/:id/review-event', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const eventType = safeString(req.body?.eventType).trim();
    if (!eventType) return res.status(400).send({ message: 'eventType is required.' });
    const result = await recordRevisionReviewEvent({
      userId: req.user!.id,
      itemId: req.params.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      eventType: eventType as any,
      outcome: (safeString(req.body?.outcome).trim() || null) as any,
      metadata: asRecord(req.body?.metadata) || {},
    });
    if (!result) return res.status(404).send({ message: 'Revision item not found.' });
    return res.status(201).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision review event failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/group-suggestions', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ suggestions: await getRevisionGroupingSuggestions(req.user!.id) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision group suggestions failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/group-suggestions/:id/apply', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await applyRevisionGroupingSuggestion(req.user!.id, req.params.id);
    if (!result) return res.status(404).send({ message: 'Revision grouping suggestion not found.' });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, suggestionId: req.params.id }, '[Backend] Revision grouping apply failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/audio-recap', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sourceType = safeString(req.body?.sourceType).trim();
    if (!['collection', 'item', 'queue'].includes(sourceType)) {
      return res.status(400).send({ message: 'A valid audio recap source is required.' });
    }
    const title =
      safeString(req.body?.title).trim() ||
      (sourceType === 'item'
        ? 'Revision item audio recap'
        : sourceType === 'collection'
          ? 'Revision list audio recap'
          : 'Revision queue audio recap');
    const sourceChatContext = await resolveMediaSourceChatContext({
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      revisionItemId: safeString(req.body?.itemId).trim() || safeString(req.body?.revisionItemId).trim() || null,
    });
    const result = await recapGenerationService.generateAudioRecapAsset({
      userId: req.user!.id,
      sourceType,
      collectionId: safeString(req.body?.collectionId).trim() || null,
      itemId: safeString(req.body?.itemId).trim() || null,
      title,
      topic: safeString(req.body?.topic).trim() || null,
      subject: safeString(req.body?.subject).trim() || null,
      language: safeString(req.body?.language).trim() || 'english',
      sessionId: sourceChatContext.sourceChatSessionId || safeString(req.body?.sessionId).trim() || null,
      sourceChatSessionId: sourceChatContext.sourceChatSessionId,
      sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      voiceBehaviorProfile: 'revision_voice',
      eventSource: 'revision',
    });

    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision audio recap failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/video-recap', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sourceChatContext = await resolveMediaSourceChatContext({
      userId,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
    });
    if (!sourceChatContext.sourceChatSessionId) {
      return res.status(400).send({ message: 'Media assets require a source chat session context.' });
    }
    const title = clampMediaText(safeString(req.body?.title).trim() || 'Video recap', 120);
    const topic = safeString(req.body?.topic).trim() || null;
    const subject = safeString(req.body?.subject).trim() || inferSubjectFromTopic(topic || title);
    const transcriptText = safeString(req.body?.transcriptText).trim();
    const summaryText = safeString(req.body?.summaryText).trim();
    const recapSeed = transcriptText || summaryText || `This recap covers ${topic || title}.`;
    const recapText = clampMediaText(recapSeed, 1800);
    const keyPoints = extractMediaKeyPoints(recapSeed, topic || title);
    const quickChecks = buildMediaQuickChecks(topic || title);
    const saveReadyNote = clampMediaText(
      `Save this for revision: ${keyPoints[0] || `Start with the core idea in ${topic || title}.`}`,
      260
    );
    const sourceUrl = safeString(req.body?.sourceUrl).trim() || null;
    const videoId = safeString(req.body?.videoId).trim() || null;
    const language = safeString(req.body?.language).trim() || 'english';

    const asset = await createMediaAsset({
      userId,
      assetKind: 'video_recap',
      title,
      summary: clampMediaText(recapText, 220),
      subject,
      topic,
      language,
      sessionId: sourceChatContext.sourceChatSessionId,
      sourceChatSessionId: sourceChatContext.sourceChatSessionId,
      sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      sourceUrl,
      videoId,
      thumbnailUrl: safeString(req.body?.thumbnailUrl).trim() || null,
      recapText,
      keyPoints,
      quickChecks,
      metadata: {
        transcriptAvailable: Boolean(transcriptText),
        whyRecommended: safeString(req.body?.whyRecommended).trim() || null,
        sourceChatSessionId: sourceChatContext.sourceChatSessionId,
        sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      },
      safetyStatus: 'safe',
      sourceTrust: safeString(req.body?.sourceTrust).trim() || 'medium',
      dedupeKey: buildMediaAssetDedupeKey([
        'video_recap',
        userId,
        videoId || sourceUrl || title,
        topic || '',
        recapText.slice(0, 320),
      ]),
    });
    void recordLearningEffectEvent({
      userId,
      sessionId: sourceChatContext.sourceChatSessionId,
      subject,
      topic,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      eventType: 'media_asset_created',
      metadata: {
        assetKind: 'video_recap',
        assetId: asset.id,
      },
    }).catch(() => undefined);

    return res.status(200).send({
      asset,
      recapText,
      keyPoints,
      quickChecks,
      saveReadyNote,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media video recap failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/audio-recap', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sourceChatContext = await resolveMediaSourceChatContext({
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
    });
    if (!sourceChatContext.sourceChatSessionId) {
      return res.status(400).send({ message: 'Media assets require a source chat session context.' });
    }
    const result = await recapGenerationService.generateAudioRecapAsset({
      userId: req.user!.id,
      sourceType: safeString(req.body?.sourceType).trim() || 'manual',
      recapText: safeString(req.body?.recapText).trim() || null,
      collectionId: safeString(req.body?.collectionId).trim() || null,
      itemId: safeString(req.body?.itemId).trim() || null,
      title: safeString(req.body?.title).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      subject: safeString(req.body?.subject).trim() || null,
      language: safeString(req.body?.language).trim() || 'english',
      sessionId: sourceChatContext.sourceChatSessionId,
      sourceChatSessionId: sourceChatContext.sourceChatSessionId,
      sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      voiceBehaviorProfile: 'reading_voice',
      eventSource: 'media',
    });
    return res.status(200).send(result);
  } catch (error) {
    if (String(error).toLowerCase().includes('recaptext') || String(error).toLowerCase().includes('valid revision source')) {
      return res.status(400).send({ message: 'A recapText or valid revision source is required.' });
    }
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media audio recap failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/generate-image', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sourceChatContext = await resolveMediaSourceChatContext({
      userId,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
    });
    if (!sourceChatContext.sourceChatSessionId) {
      return res.status(400).send({ message: 'Media assets require a source chat session context.' });
    }
    const prompt = safeString(req.body?.prompt).trim();
    if (!prompt) return res.status(400).send({ message: 'A prompt is required.' });
    if (!isEducationSafeImagePrompt(prompt)) {
      return res.status(400).send({
        message: 'That image request is outside study-safe generation. Please ask for a school diagram, concept map, timeline, or labeled educational visual.',
      });
    }

    const title = clampMediaText(safeString(req.body?.title).trim() || 'Generated study visual', 120);
    const topic = safeString(req.body?.topic).trim() || null;
    const subject = safeString(req.body?.subject).trim() || inferSubjectFromTopic(topic || prompt);
    const language = safeString(req.body?.language).trim() || 'english';
    let dataUrl: string | null = null;
    let fallbackMode: 'model' | 'svg_fallback' = 'svg_fallback';

    try {
      const imageResponse = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: `Create a clean educational illustration for students. Keep it school-safe, clear, and label key elements.\n\nPrompt: ${prompt}`,
        size: '1024x1024',
      });
      const b64 = imageResponse.data?.[0]?.b64_json;
      if (b64) {
        const candidate = `data:image/png;base64,${b64}`;
        if (Buffer.byteLength(candidate, 'utf8') <= MAX_MEDIA_DATA_URL_BYTES * 2) {
          dataUrl = candidate;
          fallbackMode = 'model';
        }
      }
    } catch (error) {
      logger.warn({ error: String(error), userId }, '[Backend] Image model generation failed, using SVG fallback.');
    }

    if (!dataUrl) {
      dataUrl = createStudyImageFallbackDataUrl({ title, prompt });
      fallbackMode = 'svg_fallback';
    }

    const asset = await createMediaAsset({
      userId,
      assetKind: 'generated_image',
      title,
      summary: clampMediaText(prompt, 220),
      subject,
      topic,
      language,
      sessionId: sourceChatContext.sourceChatSessionId,
      sourceChatSessionId: sourceChatContext.sourceChatSessionId,
      sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      dataUrl,
      thumbnailUrl: dataUrl,
      recapText: null,
      keyPoints: [],
      quickChecks: [],
      metadata: {
        prompt,
        fallbackMode,
        sourceChatSessionId: sourceChatContext.sourceChatSessionId,
        sourceChatMessageId: sourceChatContext.sourceChatMessageId,
      },
      safetyStatus: 'allowed',
      sourceTrust: 'internal',
      dedupeKey: buildMediaAssetDedupeKey([
        'generated_image',
        userId,
        prompt,
        topic || '',
      ]),
    });
    void recordLearningEffectEvent({
      userId,
      sessionId: sourceChatContext.sourceChatSessionId,
      subject,
      topic,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      eventType: 'media_asset_created',
      metadata: {
        assetKind: 'generated_image',
        assetId: asset.id,
        fallbackMode,
      },
    }).catch(() => undefined);

    return res.status(200).send({
      asset,
      fallbackMode,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media generate image failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/media/assets', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const kindRaw =
      safeString(req.query?.assetKind).trim() ||
      safeString(req.query?.kind).trim();
    if (kindRaw && kindRaw !== 'all' && !isCoreMediaAssetKind(kindRaw)) {
      return res.status(400).send({
        message: `assetKind must be one of: all, ${CORE_MEDIA_ASSET_KINDS.join(', ')}.`,
      });
    }
    const kind = kindRaw && kindRaw !== 'all' ? (kindRaw as MediaAssetKind) : 'all';
    const assets = await listMediaAssets({
      userId: req.user!.id,
      assetKind: kind,
      subject: safeString(req.query?.subject).trim() || undefined,
      topic: safeString(req.query?.topic).trim() || undefined,
      subtopic: safeString(req.query?.subtopic).trim() || undefined,
      linkedWeakTopicId: safeString(req.query?.linkedWeakTopicId).trim() || undefined,
      collectionId: safeString(req.query?.collectionId).trim() || undefined,
      sessionId: safeString(req.query?.sessionId).trim() || undefined,
      revisionItemId: safeString(req.query?.revisionItemId).trim() || undefined,
      onlySaved: parseQueryBoolean(req.query?.onlySaved),
      onlyCompleted: parseQueryBoolean(req.query?.onlyCompleted),
      onlyHelpful: parseQueryBoolean(req.query?.onlyHelpful),
      sortBy: (safeString(req.query?.sortBy).trim() || 'recent') as 'recent' | 'useful' | 'recommended',
      query: safeString(req.query?.query).trim() || undefined,
      limit: parsePositiveInt(req.query?.limit, 40, 1, 120),
      onlyCore: true,
      requireSourceContext: true,
    });
    return res.status(200).send({ assets });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media list assets failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/media/stream', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const limit = parsePositiveInt(req.query?.limit, 40, 1, 120);
    const streamMode = safeString(req.query?.streamMode).trim().toLowerCase() === 'creative' ? 'creative' : 'study';
    const weakTopics = parseQueryList(req.query?.weakTopics);
    const requestedRevisionItemId = safeString(req.query?.revisionItemId).trim() || null;
    const studyRevisionOverview =
      streamMode === 'study'
        ? await getRevisionOverview({
            userId: req.user!.id,
            limit: 16,
          })
        : null;
    const studyRevisionItems = studyRevisionOverview ? collectRevisionItemsFromOverview(studyRevisionOverview) : [];
    const rankingContext: MediaStreamRankingContext = {
      activeTopic: safeString(req.query?.activeTopic).trim() || null,
      weakTopics,
      examMode: parseQueryBoolean(req.query?.examMode) === true,
      focusMode: parseQueryBoolean(req.query?.focusMode) === true,
      preferredKind: safeString(req.query?.preferredKind).trim() || null,
      streamMode,
      preferredRecapType: (safeString(req.query?.preferredRecapType).trim().toLowerCase() as any) || null,
      shortFormSupport: (safeString(req.query?.shortFormSupport).trim().toLowerCase() as any) || null,
      allowExternalCreativeSuggestions: parseQueryBoolean(req.query?.allowExternalCreativeSuggestions) !== false,
      learningNeed: safeString(req.query?.learningNeed).trim() || null,
      schoolLevel: safeString(req.query?.schoolLevel).trim() || null,
      language: safeString(req.query?.language).trim() || null,
      activeRevisionItemId: requestedRevisionItemId,
      dueNowRevisionItemIds: studyRevisionOverview?.queuePreview?.dueNow?.map((item) => safeString(item.id).trim()).filter(Boolean) || [],
      needsAttentionRevisionItemIds:
        studyRevisionOverview?.queuePreview?.needsAttention?.map((item) => safeString(item.id).trim()).filter(Boolean) || [],
      continueRevisionItemIds:
        studyRevisionOverview?.queuePreview?.continuePractising?.map((item) => safeString(item.id).trim()).filter(Boolean) || [],
      recentRevisionItemIds: studyRevisionItems.map((item) => safeString(item.id).trim()).filter(Boolean).slice(0, 24),
      revisionSeedTopics: buildStudyTopicSeeds({
        activeTopic: safeString(req.query?.activeTopic).trim() || null,
        weakTopics,
        revisionItems: studyRevisionItems,
      }),
    };
    const sourceChatContext = await resolveMediaSourceChatContext({
      userId: req.user!.id,
      sessionId: safeString(req.query?.sessionId).trim() || null,
      sourceMessageId: safeString(req.query?.sourceMessageId).trim() || null,
      revisionItemId: requestedRevisionItemId,
    });

    const assets = await listMediaAssets({
      userId: req.user!.id,
      assetKind: 'all',
      subject: safeString(req.query?.subject).trim() || undefined,
      topic: safeString(req.query?.topic).trim() || undefined,
      sessionId: safeString(req.query?.sessionId).trim() || undefined,
      revisionItemId: safeString(req.query?.revisionItemId).trim() || undefined,
      query: safeString(req.query?.query).trim() || undefined,
      limit: Math.max(limit * 2, 80),
      sortBy: (safeString(req.query?.sortBy).trim() || 'recommended') as 'recent' | 'useful' | 'recommended',
      onlyCore: true,
      requireSourceContext: true,
    });

    const requestedTopicSeeds = buildCreativeTopicSeeds({
      activeTopic: rankingContext.activeTopic,
      topic: safeString(req.query?.topic).trim() || null,
      query: safeString(req.query?.query).trim() || null,
      weakTopics,
      learningNeed: rankingContext.learningNeed,
    });
    const creativeSeedTopics =
      requestedTopicSeeds.length > 0 ? requestedTopicSeeds : deriveCreativeTopicSeedsFromAssets(assets);
    const creativeIngestion =
      streamMode === 'creative' && rankingContext.allowExternalCreativeSuggestions
        ? await ingestCreativeExternalMediaAssets({
            userId: req.user!.id,
            topicSeeds: creativeSeedTopics,
            subject: safeString(req.query?.subject).trim() || null,
            learningNeed: rankingContext.learningNeed,
            schoolLevel: rankingContext.schoolLevel || null,
            language: rankingContext.language || null,
            sourceChatSessionId: sourceChatContext.sourceChatSessionId,
            sourceChatMessageId: sourceChatContext.sourceChatMessageId,
            limit: Math.max(3, Math.min(12, Math.ceil(limit * 0.6))),
          })
        : {
            assets: [],
            notices: [],
            sourceHealth: null,
            seedTopics: creativeSeedTopics,
          };
    const externalCreativeAssets = creativeIngestion.assets;
    const notices: MediaStreamNoticePayload[] = [];

    if (
      streamMode === 'creative' &&
      rankingContext.allowExternalCreativeSuggestions &&
      requestedTopicSeeds.length === 0 &&
      creativeSeedTopics.length > 0
    ) {
      pushStreamNotice(notices, {
        id: 'creative-seed-from-library',
        tone: 'seed',
        message: `Creative Stream used your saved study topics to seed discovery: ${creativeSeedTopics.join(', ')}.`,
      });
    }
    creativeIngestion.notices.forEach((message, index) => {
      pushStreamNotice(notices, {
        id: `creative-engine-${index}`,
        tone: message.toLowerCase().includes('filtered') ? 'quality' : message.toLowerCase().includes('cache') ? 'refresh' : 'info',
        message,
      });
    });

    if (externalCreativeAssets.length > 0) {
      void recordLearningEffectEvent({
        userId: req.user!.id,
        sessionId: sourceChatContext.sourceChatSessionId,
        subject: safeString(req.query?.subject).trim() || null,
        topic: rankingContext.activeTopic || creativeSeedTopics[0] || null,
        eventType: 'creative_stream_external_candidates_loaded',
        metadata: {
          topicSeeds: creativeSeedTopics,
          candidateCount: externalCreativeAssets.length,
          learningNeed: rankingContext.learningNeed,
          schoolLevel: rankingContext.schoolLevel,
          language: rankingContext.language,
        },
      }).catch(() => undefined);
    }

    const mergedAssets = Array.from(
      new Map([...externalCreativeAssets, ...assets].map((asset) => [asset.id, asset] as const)).values()
    );

    const stream = buildMediaStream(mergedAssets, rankingContext, limit);
    const deck =
      streamMode === 'study'
        ? buildStudyStreamDeckMeta({
            activeTopic: rankingContext.activeTopic,
            weakTopics,
            revisionItems: studyRevisionItems,
          })
        : buildMediaStreamDeckMeta({
            streamMode,
            seedTopics:
              streamMode === 'creative'
                ? creativeIngestion.seedTopics
                : buildCreativeTopicSeeds({
                    activeTopic: rankingContext.activeTopic,
                    weakTopics,
                    learningNeed: rankingContext.learningNeed,
                  }),
            sourceHealth: streamMode === 'creative' ? creativeIngestion.sourceHealth : null,
          });
    const emptyState =
      stream.length === 0
        ? streamMode === 'study'
          ? buildStudyStreamEmptyState({
              seedTopics: deck.seedTopics,
              hasAssets: assets.length > 0,
              hasRevisionHistory: studyRevisionItems.length > 0,
            })
          : buildMediaStreamEmptyState({
              streamMode,
              seedTopics: deck.seedTopics,
              hasAssets: assets.length > 0,
            })
        : null;

    return res.status(200).send({
      stream,
      streamMode,
      notices,
      deck,
      emptyState,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media stream failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/media/collections', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const limit = parsePositiveInt(req.query?.limit, 24, 1, 80);
    const sortByRaw = safeString(req.query?.sortBy).trim().toLowerCase();
    const sortBy = sortByRaw === 'title' ? 'title' : 'recent';
    const collections = await listMediaCollections({
      userId: req.user!.id,
      subject: safeString(req.query?.subject).trim() || undefined,
      topic: safeString(req.query?.topic).trim() || undefined,
      query: safeString(req.query?.query).trim() || undefined,
      sortBy,
      limit,
      includeItems: true,
      onlyWithItems: false,
      itemLimit: 24,
    });
    return res.status(200).send({ collections });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media collections failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/collections', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const title = clampMediaText(safeString(req.body?.title).trim(), 90);
    if (!title) {
      return res.status(400).send({ message: 'A collection title is required.' });
    }
    const collection = await createMediaCollection({
      userId: req.user!.id,
      title,
      description: clampMediaText(safeString(req.body?.description).trim(), 220) || null,
      subject: clampMediaText(safeString(req.body?.subject).trim(), 80) || null,
      topic: clampMediaText(safeString(req.body?.topic).trim(), 120) || null,
      metadata: asRecord(req.body?.metadata) || {},
    });
    return res.status(201).send({ collection });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Media create collection failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/media/collections/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const collection = await updateMediaCollection({
      userId: req.user!.id,
      collectionId: safeString(req.params.id).trim(),
      patch: {
        ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'title')
          ? { title: clampMediaText(safeString(req.body?.title).trim(), 90) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'description')
          ? { description: clampMediaText(safeString(req.body?.description).trim(), 220) || null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'subject')
          ? { subject: clampMediaText(safeString(req.body?.subject).trim(), 80) || null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'topic')
          ? { topic: clampMediaText(safeString(req.body?.topic).trim(), 120) || null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(req.body || {}, 'metadata')
          ? { metadata: asRecord(req.body?.metadata) || {} }
          : {}),
      },
    });
    if (!collection) return res.status(404).send({ message: 'Media collection not found.' });
    return res.status(200).send({ collection });
  } catch (error) {
    if (String(error).toLowerCase().includes('title')) {
      return res.status(400).send({ message: 'A collection title is required.' });
    }
    logger.error({ error: String(error), userId: req.user?.id, collectionId: req.params.id }, '[Backend] Media update collection failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/collections/:id/assets/:assetId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const linked = await addMediaAssetToCollection({
      userId: req.user!.id,
      collectionId: safeString(req.params.id).trim(),
      assetId: safeString(req.params.assetId).trim(),
    });
    if (!linked) return res.status(404).send({ message: 'Media collection or asset not found.' });
    return res.status(200).send(linked);
  } catch (error) {
    logger.error(
      { error: String(error), userId: req.user?.id, collectionId: req.params.id, assetId: req.params.assetId },
      '[Backend] Media add asset to collection failed'
    );
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.delete('/media/collections/:id/assets/:assetId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const unlinked = await removeMediaAssetFromCollection({
      userId: req.user!.id,
      collectionId: safeString(req.params.id).trim(),
      assetId: safeString(req.params.assetId).trim(),
    });
    if (!unlinked) return res.status(404).send({ message: 'Media collection or asset not found.' });
    return res.status(200).send(unlinked);
  } catch (error) {
    logger.error(
      { error: String(error), userId: req.user?.id, collectionId: req.params.id, assetId: req.params.assetId },
      '[Backend] Media remove asset from collection failed'
    );
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/assets/:id/link-revision', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const revisionItemId = safeString(req.body?.revisionItemId).trim();
    if (!revisionItemId) {
      return res.status(400).send({ message: 'revisionItemId is required.' });
    }
    const linked = await linkMediaAssetToRevision({
      userId: req.user!.id,
      assetId: safeString(req.params.id).trim(),
      revisionItemId,
    });
    if (!linked) return res.status(404).send({ message: 'Media asset not found.' });
    void recordLearningEffectEvent({
      userId: req.user!.id,
      revisionItemId,
      subject: linked.subject,
      topic: linked.topic,
      eventType: 'media_asset_linked_to_revision',
      metadata: {
        assetId: linked.id,
        assetKind: linked.assetKind,
      },
    }).catch(() => undefined);
    return res.status(200).send({ asset: linked });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, assetId: req.params.id }, '[Backend] Media link revision failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/media/assets/:id/interaction', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const action = safeString(req.body?.action).trim() as MediaAssetInteractionAction;
    const allowedActions = new Set<MediaAssetInteractionAction>([
      'open',
      'play',
      'complete',
      'helpful',
      'unhelpful',
      'save_to_revision',
      'quick_check',
      'show_more_like_this',
      'explain_simply',
      'open_long_lesson',
      'similar_topic',
      'quiz_me',
      'similar_question',
    ]);
    if (!allowedActions.has(action)) {
      return res.status(400).send({ message: 'A valid media interaction action is required.' });
    }

    const assetId = safeString(req.params.id).trim();
    if (!assetId) {
      return res.status(400).send({ message: 'assetId is required.' });
    }

    const revisionItemId = safeString(req.body?.revisionItemId).trim() || null;
    const asset = await recordMediaAssetInteraction({
      userId: req.user!.id,
      assetId,
      action,
      revisionItemId,
    });

    if (!asset) {
      return res.status(404).send({ message: 'Media asset not found.' });
    }

    void recordLearningEffectEvent({
      userId: req.user!.id,
      sessionId: asset.sessionId,
      subject: asset.subject,
      topic: asset.topic,
      revisionItemId: asset.revisionItemId,
      eventType: 'media_asset_interaction',
      metadata: {
        action,
        assetId: asset.id,
        assetKind: asset.assetKind,
      },
    }).catch(() => undefined);

    const interactionMetadata = asRecord(asset.metadata) || null;
    const interactionStamp = safeString(interactionMetadata?.lastInteractionAt).trim();
    const conversionSignals: Array<{ eventType: string; stage: string }> = [];
    if (interactionStamp) {
      if (safeString(interactionMetadata?.openToPracticeConversionAt).trim() === interactionStamp) {
        conversionSignals.push({ eventType: 'media_conversion_open_to_practice', stage: 'open_to_practice' });
      }
      if (safeString(interactionMetadata?.openToSaveConversionAt).trim() === interactionStamp) {
        conversionSignals.push({ eventType: 'media_conversion_open_to_revision_save', stage: 'open_to_revision_save' });
      }
      if (safeString(interactionMetadata?.openPracticeSaveConversionAt).trim() === interactionStamp) {
        conversionSignals.push({ eventType: 'media_conversion_open_practice_revision_save', stage: 'open_practice_save' });
      }
    }
    conversionSignals.forEach((signal) => {
      void recordLearningEffectEvent({
        userId: req.user!.id,
        sessionId: asset.sessionId,
        subject: asset.subject,
        topic: asset.topic,
        revisionItemId: asset.revisionItemId,
        eventType: signal.eventType,
        metadata: {
          action,
          stage: signal.stage,
          assetId: asset.id,
          assetKind: asset.assetKind,
        },
      }).catch(() => undefined);
    });

    return res.status(200).send({ asset });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, assetId: req.params.id }, '[Backend] Media interaction failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision-mode/start', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sourceType = safeString(req.body?.sourceType).trim() || 'queue';
    const result = await startRevisionMode({
      userId: req.user!.id,
      sourceType: sourceType as any,
      collectionId: safeString(req.body?.collectionId).trim() || undefined,
      itemIds: Array.isArray(req.body?.itemIds) ? req.body.itemIds.map((item: unknown) => safeString(item).trim()).filter(Boolean) : undefined,
      examFocus: Boolean(req.body?.examFocus),
    });
    if (!result) return res.status(404).send({ message: 'No revision items were available for that revision mode.' });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Revision mode start failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/guided-session/start', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sourceType = safeString(req.body?.sourceType).trim() || 'item';
    const itemId = safeString(req.body?.itemId).trim() || undefined;
    const collectionId = safeString(req.body?.collectionId).trim() || undefined;
    const result = await startGuidedRevisionSession({
      userId: req.user!.id,
      sourceType: sourceType === 'collection' || sourceType === 'queue' ? (sourceType as any) : 'item',
      itemId,
      collectionId,
      examFocus: Boolean(req.body?.examFocus),
    });
    if (!result) {
      return res.status(404).send({ message: 'No revision item was available for guided revision.' });
    }
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Guided revision start failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/revision/guided-session/:sessionId/respond', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const itemId = safeString(req.body?.itemId).trim();
    if (!itemId) {
      return res.status(400).send({ message: 'itemId is required.' });
    }
    const stage = safeString(req.body?.stage).trim() || 'recall';
    const supportAction = safeString(req.body?.supportAction).trim() || undefined;
    const allowedSupportActions = new Set(['hint', 'explain_again', 'break_down', 'compare', 'mark_for_later']);
    const result = await continueGuidedRevisionSession({
      userId: req.user!.id,
      sessionId: safeString(req.params.sessionId).trim(),
      itemId,
      stage: stage as any,
      responseText: safeString(req.body?.responseText).trim() || undefined,
      supportAction: supportAction && allowedSupportActions.has(supportAction) ? (supportAction as any) : undefined,
    });
    if (!result) {
      return res.status(404).send({ message: 'Guided revision session item not found.' });
    }
    return res.status(200).send(result);
  } catch (error) {
    logger.error(
      {
        error: String(error),
        userId: req.user?.id,
        sessionId: req.params.sessionId,
      },
      '[Backend] Guided revision step failed'
    );
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/revision/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const item = await getRevisionItemDetails({
      userId: studentUserId,
      itemId: req.params.id,
    });

    if (!item) {
      return res.status(404).send({ message: 'Revision item not found.' });
    }

    return res.status(200).send(item);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.id }, '[Backend] Revision item detail failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/metacognition/event', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const eventType = safeString(req.body?.eventType).trim();
    if (!eventType) {
      return res.status(400).send({ message: 'eventType is required.' });
    }
    const requestMetadata = asRecord(req.body?.metadata) || null;
    const requestTopic =
      safeString(req.body?.topic).trim() ||
      safeString(requestMetadata?.topic).trim() ||
      safeString(requestMetadata?.activeTopic).trim() ||
      null;
    const requestSubject =
      safeString(req.body?.subject).trim() ||
      safeString(requestMetadata?.subject).trim() ||
      inferSubjectFromTopic(requestTopic || '') ||
      null;
    const event = await recordMetacognitiveEvent({
      userId: studentUserId,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      eventType: eventType as any,
      confidence: (safeString(req.body?.confidence).trim() || null) as any,
      problemFraming: (safeString(req.body?.problemFraming).trim() || null) as any,
      errorType: (safeString(req.body?.errorType).trim() || null) as any,
      strategyPreference: (safeString(req.body?.strategyPreference).trim() || null) as any,
      transferReadiness: (safeString(req.body?.transferReadiness).trim() || null) as any,
      confidenceSelfCheck: (safeString(req.body?.confidenceSelfCheck).trim() || null) as any,
      supportPreference: (safeString(req.body?.supportPreference).trim() || null) as any,
      note: safeString(req.body?.note).trim() || null,
      metadata: {
        ...(requestMetadata || {}),
        ...(requestTopic ? { topic: requestTopic } : {}),
        ...(requestSubject ? { subject: requestSubject } : {}),
        ...(safeString(req.body?.sourceMessageId).trim()
          ? { sourceTurnId: safeString(req.body?.sourceMessageId).trim() }
          : {}),
      },
    });
    const profile = await getMetacognitiveProfile(studentUserId);
    const reflectionSignal = profile.lastReflectionSignal || null;
    const learnerLoopState =
      requestTopic || requestSubject
        ? await buildLearnerLoopState({
            userId: studentUserId,
            userText: safeString(req.body?.note).trim() || safeString(requestMetadata?.promptText).trim() || undefined,
            topic: requestTopic,
            subject: requestSubject,
            awaitingStudentAttempt:
              event.supportPreference === 'practice_question' ||
              safeString(requestMetadata?.progressCheck).trim() === 'ready_to_try' ||
              safeString(requestMetadata?.progressCheck).trim() === 'let_me_try_one_now' ||
              safeString(requestMetadata?.progressCheck).trim() === 'quick_test',
            afterMistake:
              Boolean(event.errorType) ||
              safeString(requestMetadata?.progressCheck).trim() === 'still_confusing',
            afterSuccess:
              event.transferReadiness === 'can_explain' ||
              event.transferReadiness === 'can_reuse' ||
              safeString(requestMetadata?.progressCheck).trim() === 'much_better' ||
              safeString(requestMetadata?.progressCheck).trim() === 'i_think_i_get_it',
            currentMetacognitiveState: mergeMetacognitiveSnapshot(profile.recentSnapshot, {
              confidence: event.confidence || null,
              problemFraming: event.problemFraming || null,
              errorType: event.errorType || null,
              strategyPreference: event.strategyPreference || null,
              transferReadiness: event.transferReadiness || null,
              confidenceSelfCheck: event.confidenceSelfCheck || null,
              supportPreference: event.supportPreference || null,
              studentReflectionNote: event.note || null,
            }),
            priorTutorState: {
              activeTopic: requestTopic || undefined,
              activeSubject: requestSubject || undefined,
              metacognitiveState: profile.recentSnapshot || null,
              reflectionSignal,
            },
          })
        : { topicMastery: null, weakTopicRecovery: null, reflectionPrompt: null };
    return res.status(201).send({
      event,
      profile,
      snapshot: mergeMetacognitiveSnapshot(profile.recentSnapshot, {
        confidence: event.confidence || null,
        problemFraming: event.problemFraming || null,
        errorType: event.errorType || null,
        strategyPreference: event.strategyPreference || null,
        transferReadiness: event.transferReadiness || null,
        confidenceSelfCheck: event.confidenceSelfCheck || null,
        supportPreference: event.supportPreference || null,
        studentReflectionNote: event.note || null,
      }),
      reflectionSignal,
      topicMastery: learnerLoopState.topicMastery,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition event failed');
    const fallbackEventType = safeString(req.body?.eventType).trim() || 'reflection_checkin';
    const fallbackEvent = {
      id: `fallback-meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      eventType: fallbackEventType,
      confidence: (safeString(req.body?.confidence).trim() || null) as any,
      problemFraming: (safeString(req.body?.problemFraming).trim() || null) as any,
      errorType: (safeString(req.body?.errorType).trim() || null) as any,
      strategyPreference: (safeString(req.body?.strategyPreference).trim() || null) as any,
      transferReadiness: (safeString(req.body?.transferReadiness).trim() || null) as any,
      confidenceSelfCheck: (safeString(req.body?.confidenceSelfCheck).trim() || null) as any,
      supportPreference: (safeString(req.body?.supportPreference).trim() || null) as any,
      note: safeString(req.body?.note).trim() || null,
      metadata: asRecord(req.body?.metadata) || null,
      createdAt: new Date().toISOString(),
    };

    return res.status(201).send({
      event: fallbackEvent,
      profile: EMPTY_METACOGNITIVE_PROFILE,
      snapshot: null,
      reflectionSignal: null,
      topicMastery: null,
      weakTopicRecovery: null,
    });
  }
});

router.get('/metacognition/profile', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getMetacognitiveProfile(req.user!.id));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition profile failed');
    return res.status(200).send(EMPTY_METACOGNITIVE_PROFILE);
  }
});

router.get('/metacognition/prompt', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const message = safeString(req.query?.message).trim();
    const topic = safeString(req.query?.topic).trim() || message || null;
    const subject = safeString(req.query?.subject).trim() || inferSubjectFromTopic(topic || message || '');
    const metacognitiveProfile = await getMetacognitiveProfile(req.user!.id);
    const learnerLoopState = await buildLearnerLoopState({
      userId: req.user!.id,
      userText: message,
      topic,
      subject,
      tutorActionId: safeString(req.query?.tutorActionId).trim() || undefined,
      isRevision: req.query?.isRevision === 'true',
      isPracticePad: req.query?.isPracticePad === 'true',
      awaitingStudentAttempt: req.query?.awaitingStudentAttempt === 'true',
      afterMistake: req.query?.afterMistake === 'true',
      afterSuccess: req.query?.afterSuccess === 'true',
      currentMetacognitiveState: metacognitiveProfile.recentSnapshot || null,
      priorTutorState: {
        activeTopic: topic || undefined,
        activeSubject: subject || undefined,
        metacognitiveState: metacognitiveProfile.recentSnapshot || null,
      },
    });
    return res.status(200).send({
      prompt: learnerLoopState.reflectionPrompt || chooseMetacognitivePrompt({
        userText: message,
        tutorActionId: safeString(req.query?.tutorActionId).trim() || undefined,
        isRevision: req.query?.isRevision === 'true',
        isPracticePad: req.query?.isPracticePad === 'true',
        awaitingStudentAttempt: req.query?.awaitingStudentAttempt === 'true',
        afterMistake: req.query?.afterMistake === 'true',
        afterSuccess: req.query?.afterSuccess === 'true',
        currentErrorType: (safeString(req.query?.currentErrorType).trim() || null) as MetacognitiveErrorType | null,
        topic,
        subject,
        topicMastery: learnerLoopState.topicMastery,
        weakTopicRecovery: learnerLoopState.weakTopicRecovery,
      }) || null,
      topicMastery: learnerLoopState.topicMastery,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Metacognition prompt failed');
    return res.status(200).send({
      prompt: null,
      topicMastery: null,
      weakTopicRecovery: null,
    });
  }
});

router.post('/practice-pad/check-step', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await checkPracticePadStep({
      userId: req.user!.id,
      payload: {
        sessionId: safeString(req.body?.sessionId).trim() || null,
        prompt: safeString(req.body?.prompt).trim() || null,
        workText: safeString(req.body?.workText),
        selectedStep: safeString(req.body?.selectedStep).trim() || null,
        topic: safeString(req.body?.topic).trim() || null,
        subject: safeString(req.body?.subject).trim() || null,
        supportChoice: (safeString(req.body?.supportChoice).trim() || null) as any,
        stepFocus: (safeString(req.body?.stepFocus).trim() || null) as any,
        reflection: (asRecord(req.body?.reflection) || null) as any,
        sourceMessageId: safeString(req.body?.sourceMessageId).trim() || null,
      },
    });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Practice Pad check-step failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

const ASSESSMENT_WORKSPACE_MODES = new Set(['exam', 'focus']);
const ASSESSMENT_MODE_TYPES = new Set(['quick_drill', 'timed_practice', 'mini_mock', 'weak_topic_drill', 'focus_session']);
const ASSESSMENT_QUESTION_STYLES = new Set(['multiple_choice', 'short_answer', 'worked_response', 'numeric', 'mixed']);
const ASSESSMENT_STRICTNESS = new Set(['strict_exam', 'light_support', 'review_after_attempt']);
const ASSESSMENT_REVIEW_MODES = new Set(['immediate', 'delayed_block', 'flag_and_review', 'post_mock']);
const ASSESSMENT_NAVIGATION_DIRECTIONS = new Set(['next', 'previous', 'jump', 'unanswered', 'review_flagged', 'skip_current']);

function resolveAssessmentHttpStatus(error: unknown): number {
  const message = safeString((error as Error | undefined)?.message).toLowerCase();
  if (!message) return 500;
  if (message.includes('not found')) return 404;
  if (message.includes('paused') || message.includes('already completed') || message.includes('not active')) return 409;
  if (
    message.includes('invalid') ||
    message.includes('must be') ||
    message.includes('disabled') ||
    message.includes('limit reached') ||
    message.includes('no resumable')
  ) {
    return 400;
  }
  return 500;
}

router.post('/assessment/sessions/start', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const workspaceMode = safeString(req.body?.workspaceMode).trim();
    if (!ASSESSMENT_WORKSPACE_MODES.has(workspaceMode)) {
      return res.status(400).send({ message: 'workspaceMode must be exam or focus.' });
    }
    const modeTypeRaw = safeString(req.body?.modeType).trim();
    const questionStyleRaw = safeString(req.body?.questionStyle).trim();
    const strictnessRaw = safeString(req.body?.strictness).trim();
    const reviewModeRaw = safeString(req.body?.reviewMode).trim();
    const questionCount =
      typeof req.body?.questionCount === 'number' && Number.isFinite(req.body.questionCount)
        ? Math.max(1, Math.min(24, Math.round(req.body.questionCount)))
        : null;
    const timedMinutes =
      typeof req.body?.timedMinutes === 'number' && Number.isFinite(req.body.timedMinutes)
        ? Math.max(1, Math.min(180, Math.round(req.body.timedMinutes)))
        : null;

    const snapshot = await startAssessmentSession({
      userId: req.user!.id,
      workspaceMode: workspaceMode as 'exam' | 'focus',
      modeType: ASSESSMENT_MODE_TYPES.has(modeTypeRaw) ? (modeTypeRaw as any) : undefined,
      subject: safeString(req.body?.subject).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      schoolLevel: safeString(req.body?.schoolLevel).trim() || null,
      questionStyle: ASSESSMENT_QUESTION_STYLES.has(questionStyleRaw) ? (questionStyleRaw as any) : undefined,
      strictness: ASSESSMENT_STRICTNESS.has(strictnessRaw) ? (strictnessRaw as any) : undefined,
      reviewMode: ASSESSMENT_REVIEW_MODES.has(reviewModeRaw) ? (reviewModeRaw as any) : undefined,
      questionCount,
      timedMinutes,
      resumeLatest: Boolean(req.body?.resumeLatest),
      createIfNone: req.body?.createIfNone === false ? false : true,
    });
    return res.status(200).send(snapshot);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment start failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to start assessment session.' });
  }
});

router.get('/assessment/sessions/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const snapshot = await getAssessmentSession({
      userId: req.user!.id,
      sessionId,
    });
    return res.status(200).send(snapshot);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment get session failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to load assessment session.' });
  }
});

router.post('/assessment/sessions/:id/answer', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const answer =
      typeof req.body?.answer === 'string' || typeof req.body?.answer === 'number'
        ? req.body.answer
        : null;
    const response = await answerAssessmentQuestion({
      userId: req.user!.id,
      sessionId,
      questionId: safeString(req.body?.questionId).trim() || null,
      answer,
      selectedOptionId: safeString(req.body?.selectedOptionId).trim() || null,
      workedSteps: safeString(req.body?.workedSteps),
      unsure: Boolean(req.body?.unsure),
      flagForReview: Boolean(req.body?.flagForReview),
      responseTimeSec:
        typeof req.body?.responseTimeSec === 'number' && Number.isFinite(req.body.responseTimeSec)
          ? Math.max(0, Math.min(24 * 60 * 60, Math.round(req.body.responseTimeSec)))
          : null,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment answer failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to submit assessment answer.' });
  }
});

router.post('/assessment/sessions/:id/navigate', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const direction = safeString(req.body?.direction).trim();
    if (!ASSESSMENT_NAVIGATION_DIRECTIONS.has(direction)) {
      return res.status(400).send({ message: 'Invalid navigation direction.' });
    }
    const response = await navigateAssessmentSession({
      userId: req.user!.id,
      sessionId,
      direction: direction as any,
      targetIndex:
        typeof req.body?.targetIndex === 'number' && Number.isFinite(req.body.targetIndex)
          ? Math.round(req.body.targetIndex)
          : null,
      flagReason: safeString(req.body?.flagReason).trim() || null,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment navigate failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to navigate assessment session.' });
  }
});

router.post('/assessment/sessions/:id/hint', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const response = await requestAssessmentHint({
      userId: req.user!.id,
      sessionId,
      questionId: safeString(req.body?.questionId).trim() || null,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment hint failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to request hint.' });
  }
});

router.post('/assessment/sessions/:id/pause', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const snapshot = await pauseAssessmentSession({
      userId: req.user!.id,
      sessionId,
    });
    return res.status(200).send(snapshot);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment pause failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to pause assessment session.' });
  }
});

router.post('/assessment/sessions/:id/resume', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const snapshot = await resumeAssessmentSession({
      userId: req.user!.id,
      sessionId,
    });
    return res.status(200).send(snapshot);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment resume failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to resume assessment session.' });
  }
});

router.post('/assessment/sessions/:id/finish', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const response = await finishAssessmentSession({
      userId: req.user!.id,
      sessionId,
      reason: safeString(req.body?.reason).trim() || null,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment finish failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to finish assessment session.' });
  }
});

router.get('/assessment/sessions/:id/results', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const sessionId = safeString(req.params?.id).trim();
    if (!sessionId) return res.status(400).send({ message: 'session id is required.' });
    const response = await getAssessmentResults({
      userId: req.user!.id,
      sessionId,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Assessment results failed');
    return res.status(resolveAssessmentHttpStatus(error)).send({ message: (error as Error)?.message || 'Failed to load assessment results.' });
  }
});

router.post('/study-plans', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(201).send(
      await createStudyPlan({
        userId: req.user!.id,
        scope: (safeString(req.body?.scope).trim() || 'weekly') as any,
        subject: safeString(req.body?.subject).trim() || null,
        topic: safeString(req.body?.topic).trim() || null,
        subjects: Array.isArray(req.body?.subjects) ? req.body.subjects.map((item: unknown) => safeString(item).trim()).filter(Boolean) : null,
        examFocus: Boolean(req.body?.examFocus),
      })
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study plan create failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/study-plans/generate', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(201).send(
      await generateAdaptiveStudyPlan({
        userId: req.user!.id,
        scope: (safeString(req.body?.scope).trim() || 'weekly') as any,
        subject: safeString(req.body?.subject).trim() || null,
        gradeLevel: safeString(req.body?.gradeLevel).trim() || null,
        goal: safeString(req.body?.goal).trim() || null,
        availableMinutesPerDay:
          typeof req.body?.availableMinutesPerDay === 'number'
            ? Math.max(10, Math.min(240, Math.round(req.body.availableMinutesPerDay)))
            : null,
        examDate: safeString(req.body?.examDate).trim() || null,
        strengths: Array.isArray(req.body?.strengths)
          ? req.body.strengths.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
          : null,
        weakAreas: Array.isArray(req.body?.weakAreas)
          ? req.body.weakAreas.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
          : null,
        preferredSupportStyle: safeString(req.body?.preferredSupportStyle).trim() || null,
        topic: safeString(req.body?.topic).trim() || null,
      })
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Adaptive study plan generation failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/study-plans', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const scopes = Array.isArray(req.query?.scope)
      ? (req.query.scope as string[]).map((value) => safeString(value).trim()).filter(Boolean)
      : safeString(req.query?.scope).trim()
        ? [safeString(req.query?.scope).trim()]
        : undefined;
    return res.status(200).send({ plans: await getStudyPlans(req.user!.id, scopes as any) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study plans failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/study-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getStudyPlanDetails(req.user!.id, req.params.id);
    if (!details) return res.status(404).send({ message: 'Study plan not found.' });
    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan detail failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/study-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await updateStudyPlan({
      userId: req.user!.id,
      planId: req.params.id,
      patch: {
        title: safeString(req.body?.title).trim() || undefined,
        summary: req.body?.summary === null ? null : safeString(req.body?.summary).trim() || undefined,
        subject: req.body?.subject === null ? null : safeString(req.body?.subject).trim() || undefined,
        topic: req.body?.topic === null ? null : safeString(req.body?.topic).trim() || undefined,
        subjects: Array.isArray(req.body?.subjects)
          ? req.body.subjects.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
          : req.body?.subjects === null
            ? null
            : undefined,
        focusAreas: Array.isArray(req.body?.focusAreas)
          ? req.body.focusAreas.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
          : req.body?.focusAreas === null
            ? null
            : undefined,
        recommendedBlocks: Array.isArray(req.body?.recommendedBlocks)
          ? req.body.recommendedBlocks.map((entry: unknown) => safeString(entry).trim()).filter(Boolean)
          : req.body?.recommendedBlocks === null
            ? null
            : undefined,
        dateRangeStart:
          req.body?.dateRangeStart === null ? null : safeString(req.body?.dateRangeStart).trim() || undefined,
        dateRangeEnd:
          req.body?.dateRangeEnd === null ? null : safeString(req.body?.dateRangeEnd).trim() || undefined,
        metadataPatch: asRecord(req.body?.metadataPatch) || undefined,
      },
    });
    if (!details) return res.status(404).send({ message: 'Study plan not found.' });
    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan update failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/study-plans/:id/pause', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await setStudyPlanLifecycle({
      userId: req.user!.id,
      planId: req.params.id,
      lifecycle: 'paused',
    });
    if (!details) return res.status(404).send({ message: 'Study plan not found.' });
    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan pause failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/study-plans/:id/resume', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await setStudyPlanLifecycle({
      userId: req.user!.id,
      planId: req.params.id,
      lifecycle: 'active',
    });
    if (!details) return res.status(404).send({ message: 'Study plan not found.' });
    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan resume failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/study-plans/:id/goals', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const goal = await createStudyPlanGoal({
      userId: req.user!.id,
      planId: req.params.id,
      title: safeString(req.body?.title).trim(),
      description: safeString(req.body?.description).trim() || null,
      goalType: (safeString(req.body?.goalType).trim() || 'practise_topic') as any,
      targetCount: typeof req.body?.targetCount === 'number' ? req.body.targetCount : null,
      subject: safeString(req.body?.subject).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      dueAt: safeString(req.body?.dueAt).trim() || null,
      metadata: asRecord(req.body?.metadata) || null,
    });
    if (!goal) return res.status(404).send({ message: 'Study plan not found.' });
    return res.status(201).send({ goal });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Study plan goal create failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/study-goals', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ goals: await getStudyGoals(req.user!.id) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Study goals failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/study-goals/:id/complete', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const goal = await completeStudyGoal({
      userId: req.user!.id,
      goalId: req.params.id,
      completionNote: safeString(req.body?.completionNote).trim() || null,
    });
    if (!goal) return res.status(404).send({ message: 'Study goal not found.' });
    return res.status(200).send({ goal });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, goalId: req.params.id }, '[Backend] Study goal complete failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/study-goals/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const goal = await updateStudyGoal({
      userId: req.user!.id,
      goalId: req.params.id,
      patch: {
        status: safeString(req.body?.status).trim() ? (req.body.status as any) : undefined,
        currentCount: typeof req.body?.currentCount === 'number' ? req.body.currentCount : undefined,
      },
    });
    if (!goal) return res.status(404).send({ message: 'Study goal not found.' });
    return res.status(200).send({ goal });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, goalId: req.params.id }, '[Backend] Study goal update failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/daily-feed', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getGrowthDailyFeed(req.user!.id));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth daily feed failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/growth/daily-feed/:itemId/interaction', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const itemId = safeString(req.params.itemId).trim();
    if (!itemId) return res.status(400).send({ message: 'itemId is required.' });
    const actionRaw = safeString(req.body?.action).trim().toLowerCase();
    const action = ['open', 'start', 'submit', 'complete', 'skip'].includes(actionRaw) ? (actionRaw as any) : null;
    if (!action) return res.status(400).send({ message: 'A valid interaction action is required.' });
    const result = await recordDailyFeedInteraction({
      userId: req.user!.id,
      feedItemId: itemId,
      itemType: safeString(req.body?.itemType).trim() as any,
      action,
      responseText: safeString(req.body?.responseText) || null,
      responseTimeSec:
        typeof req.body?.responseTimeSec === 'number'
          ? Math.max(0, Math.min(600, Number(req.body.responseTimeSec)))
          : null,
    });
    return res.status(200).send(result);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, itemId: req.params.itemId }, '[Backend] Growth daily feed interaction failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/action-funnel', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const days = Math.max(1, Math.min(Number(req.query?.days || 21), 90));
    return res.status(200).send(await getGrowthActionFunnelSummary({ userId: req.user!.id, days }));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth action funnel failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/overview', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getGrowthOverview(req.user!.id, safeString(req.query?.subject).trim() || null)
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth overview failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/weak-topics', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getGrowthWeakTopics(req.user!.id, safeString(req.query?.subject).trim() || null)
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth weak topics failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/mistake-journal', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getGrowthMistakeJournal(req.user!.id, safeString(req.query?.subject).trim() || null)
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth mistake journal failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/study-plans', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getGrowthStudyPlans(req.user!.id, safeString(req.query?.subject).trim() || null)
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth study plans failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/growth/mastery-trends', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getGrowthMasteryTrends(req.user!.id, safeString(req.query?.subject).trim() || null)
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth mastery trends failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/progress-summary', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const audience = safeString(req.query?.audience).trim() === 'teacher' ? 'teacher' : 'parent';
    return res.status(200).send(await getSafeProgressSummary(req.user!.id, audience, safeString(req.query?.subject).trim() || undefined));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Progress summary failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/weak-topics', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ topics: await getWeakTopics(req.user!.id, safeString(req.query?.subject).trim() || undefined) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Weak topics failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/growth/action', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const intent = safeString(req.body?.intent).trim() as GrowthActionIntent;
    const allowedIntents = new Set<GrowthActionIntent>([
      'open_revision',
      'start_guided_session',
      'review_recap',
      'quiz_me',
      'simpler_example',
      'open_study_stream',
      'open_creative_stream',
      'similar_question',
      'practice_again',
      'view_worked_step',
      'continue_plan',
    ]);
    if (!allowedIntents.has(intent)) {
      return res.status(400).send({ message: 'A valid growth action intent is required.' });
    }

    const payload = {
      topic: safeString(req.body?.topic).trim() || null,
      subject: safeString(req.body?.subject).trim() || null,
      title: safeString(req.body?.title).trim() || null,
      itemId: safeString(req.body?.itemId).trim() || null,
    };
    const overview = await getRevisionOverview({
      userId: req.user!.id,
      search: payload.topic || payload.title || undefined,
      limit: 40,
    });
    const revisionItems = collectRevisionItemsFromOverview(overview);
    const normalizedTopic = safeString(payload.topic || payload.title).trim().toLowerCase();

    const targetItem =
      (payload.itemId ? revisionItems.find((item) => item.id === payload.itemId) || null : null) ||
      (normalizedTopic
        ? revisionItems.find((item) =>
            [
              safeString(item.topic).trim().toLowerCase(),
              safeString(item.subtopic).trim().toLowerCase(),
              safeString(item.title).trim().toLowerCase(),
              safeString(item.summary).trim().toLowerCase(),
            ].some((field) => field.includes(normalizedTopic))
          ) || null
        : null) ||
      overview.queuePreview?.dueNow?.[0] ||
      overview.queuePreview?.needsAttention?.[0] ||
      null;

    const actionPlan = resolveGrowthActionPlan({
      intent,
      payload,
      targetItem,
    });

    void recordLearningEffectEvent({
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      subject: actionPlan.subject || payload.subject || null,
      topic: actionPlan.topic || payload.topic || null,
      revisionItemId: actionPlan.revisionItemId || null,
      eventType: 'growth_action_planned',
      metadata: {
        intent,
        destination: actionPlan.destination,
        mediaMode: actionPlan.mediaMode || null,
        composerIntent: actionPlan.composerIntent || null,
        resolvedRevisionItemId: actionPlan.revisionItemId || null,
        hadPrompt: Boolean(actionPlan.prompt),
      },
    }).catch(() => undefined);

    return res.status(200).send({ actionPlan });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Growth action resolution failed');
    return res.status(200).send({
      actionPlan: resolveGrowthActionPlan({
        intent: 'open_revision',
        payload: {
          topic: safeString(req.body?.topic).trim() || null,
          subject: safeString(req.body?.subject).trim() || null,
          title: safeString(req.body?.title).trim() || null,
          itemId: safeString(req.body?.itemId).trim() || null,
        },
        targetItem: null,
      }),
    });
  }
});

router.get('/learning-profile', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getLearningProfile(req.user!.id));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Learning profile failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/academic-memory', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ entries: await getAcademicMemory(req.user!.id) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Academic memory failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/concept-dependencies', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({
      dependencies: await getConceptDependencies(
        safeString(req.query?.subject).trim() || undefined,
        safeString(req.query?.topic).trim() || undefined
      ),
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Concept dependencies failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/intervention-suggestions', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({
      suggestions: await getTutorInterventionSuggestions(
        req.user!.id,
        safeString(req.query?.subject).trim() || undefined,
        safeString(req.query?.topic).trim() || undefined
      ),
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention suggestions failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/tutor-policy', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getTutorPolicyDecision(
        req.user!.id,
        safeString(req.query?.subject).trim() || undefined,
        safeString(req.query?.topic).trim() || undefined
      )
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Tutor policy failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/why-this-next', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getWhyThisNext(
        req.user!.id,
        safeString(req.query?.subject).trim() || undefined,
        safeString(req.query?.topic).trim() || undefined
      )
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Why-this-next failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/intervention-effect', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(201).send(
      await recordInterventionEffect({
        userId: req.user!.id,
        sessionId: safeString(req.body?.sessionId).trim() || null,
        subject: safeString(req.body?.subject).trim() || null,
        topic: safeString(req.body?.topic).trim() || null,
        interventionType: safeString(req.body?.interventionType).trim() as any,
        relatedRevisionItemId: safeString(req.body?.relatedRevisionItemId).trim() || null,
        outcome: (safeString(req.body?.outcome).trim() || null) as any,
        metadata: asRecord(req.body?.metadata) || {},
      })
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention effect record failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/intervention-effectiveness', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ summaries: await getInterventionEffectiveness(req.user!.id) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Intervention effectiveness failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/semester-plan', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(201).send(
      await createSemesterPlan({
        userId: req.user!.id,
        scope: (safeString(req.body?.scope).trim() || 'semester') as 'month' | 'term' | 'semester',
        subject: safeString(req.body?.subject).trim() || null,
        subjects: Array.isArray(req.body?.subjects) ? req.body.subjects.map((item: unknown) => safeString(item).trim()).filter(Boolean) : null,
        examFocus: Boolean(req.body?.examFocus),
      })
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Semester plan create failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/semester-plans', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send({ plans: await getSemesterPlans(req.user!.id) });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Semester plans failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/semester-plans/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const details = await getSemesterPlanDetails(req.user!.id, req.params.id);
    if (!details) return res.status(404).send({ message: 'Semester plan not found.' });
    return res.status(200).send(details);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id, planId: req.params.id }, '[Backend] Semester plan detail failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/mastery-pathway', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(
      await getMasteryPathway(
        req.user!.id,
        safeString(req.query?.subject).trim() || undefined,
        safeString(req.query?.topic).trim() || undefined
      )
    );
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Mastery pathway failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/school-safe-report', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    return res.status(200).send(await getSchoolSafeReport(req.user!.id, safeString(req.query?.subject).trim() || undefined));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] School-safe report failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/research', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const query = safeString(req.body?.query || req.body?.message).trim();
    if (!query) {
      return res.status(400).send({ message: 'A research query is required.' });
    }

    const sessionId = safeString(req.body?.sessionId).trim() || null;
    let activeTopic = safeString(req.body?.topic).trim() || null;

    if (sessionId && !activeTopic) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
        select: { topic: true, metadata: true },
      });
      activeTopic =
        safeString(session?.topic).trim() ||
        safeString(getTutorStateFromMetadata(session?.metadata).activeTopic).trim() ||
        null;
    }

    const chatHistory = Array.isArray(req.body?.chatHistory)
      ? req.body.chatHistory
          .map((entry: any) => ({
            role: safeString(entry?.role).trim() || 'user',
            content: safeString(entry?.content),
          }))
          .filter((entry: { content: string }) => Boolean(entry.content.trim()))
          .slice(-24)
      : [];

    const response = await runResearchMode({
      query,
      activeTopic,
      forceWebSearch: req.body?.forceWebSearch === true,
      chatHistory,
    });

    if (sessionId) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
        select: { id: true, metadata: true },
      });
      if (session) {
        const conversationState = buildEffectiveConversationState(session.metadata, null);
        const tutorState = getTutorStateFromMetadata(session.metadata);
        const topVideo = response.recommendedVideo;
        const mergedMetadata = mergeSessionMetadata({
          existing: session.metadata,
          conversationState: {
            ...conversationState,
            researchModeActive: response.mode === 'web_research',
            lastStudyTopic: activeTopic || conversationState.lastStudyTopic || query,
            lastSearchTopic: response.mode === 'web_research'
              ? [query, ...(conversationState.lastSearchTopic || [])].filter(Boolean).slice(0, 6)
              : conversationState.lastSearchTopic,
          },
          tutorState: {
            ...tutorState,
            activeTopic: activeTopic || tutorState.activeTopic,
            activeVideoId: topVideo?.videoId || tutorState.activeVideoId,
            activeVideoTitle: topVideo?.title || tutorState.activeVideoTitle,
            activeVideoWhyRecommended: topVideo?.whyRecommended || tutorState.activeVideoWhyRecommended,
            updatedAt: new Date().toISOString(),
          },
          systemNotices: response.notices.map((notice) =>
            createSystemNotice(
              notice.code,
              notice.message,
              notice.severity === 'warning' ? 'warning' : 'info'
            )
          ),
        });
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadata: mergedMetadata as any, updatedAt: new Date() },
        });
      }
    }

    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Research mode route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/video-recommend', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const sessionId = safeString(req.body?.sessionId).trim() || null;
    const requestedTopic = safeString(req.body?.topic).trim() || null;

    const response = await recommendEducationalVideos({
      query: safeString(req.body?.query || req.body?.message).trim() || null,
      topic: requestedTopic,
      subject: safeString(req.body?.subject).trim() || null,
      intent: (safeString(req.body?.intent).trim() || null) as any,
      limit: Number(req.body?.limit || 3),
    });

    if (sessionId && response.videos.length > 0) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
        select: { id: true, metadata: true },
      });
      if (session) {
        const conversationState = buildEffectiveConversationState(session.metadata, null);
        const tutorState = getTutorStateFromMetadata(session.metadata);
        const topVideo = response.videos[0];
        const mergedMetadata = mergeSessionMetadata({
          existing: session.metadata,
          conversationState: {
            ...conversationState,
            videoSuggested: true,
            lastStudyTopic: requestedTopic || conversationState.lastStudyTopic || topVideo.title,
          },
          tutorState: {
            ...tutorState,
            activeVideoId: topVideo.videoId,
            activeVideoTitle: topVideo.title,
            activeVideoWhyRecommended: topVideo.whyRecommended || tutorState.activeVideoWhyRecommended,
            updatedAt: new Date().toISOString(),
          },
          systemNotices: (response.notices || []).map((notice) =>
            createSystemNotice(
              notice.code,
              notice.message,
              notice.severity === 'warning' ? 'warning' : 'info'
            )
          ),
        });
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadata: mergedMetadata as any, updatedAt: new Date() },
        });
      }
    }

    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Video recommendation route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/video/:id/context', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const videoId = safeString(req.params?.id).trim();
    if (!videoId) {
      return res.status(400).send({ message: 'A video id is required.' });
    }

    const sessionId = safeString(req.query?.sessionId).trim() || null;
    const fallbackTitle = safeString(req.query?.title).trim() || null;
    const fallbackTopic = safeString(req.query?.topic).trim() || null;
    const fallbackWhy = safeString(req.query?.whyRecommended).trim() || null;

    let sessionMetadata: unknown = null;
    let sessionTopic: string | null = null;
    if (sessionId) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
        select: { topic: true, metadata: true },
      });
      sessionMetadata = session?.metadata ?? null;
      sessionTopic = safeString(session?.topic).trim() || null;
    }

    const tutorState = getTutorStateFromMetadata(sessionMetadata);
    const response = await getVideoContextSummary({
      videoId,
      title:
        fallbackTitle ||
        (safeString(tutorState.activeVideoId).trim() === videoId
          ? safeString(tutorState.activeVideoTitle).trim()
          : '') ||
        null,
      topic: fallbackTopic || safeString(tutorState.activeTopic).trim() || sessionTopic,
      whyRecommended: fallbackWhy || safeString(tutorState.activeVideoWhyRecommended).trim() || null,
    });

    if (sessionId && sessionMetadata) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, studentId: studentUserId },
        select: { id: true, metadata: true },
      });
      if (session) {
        const conversationState = buildEffectiveConversationState(session.metadata, null);
        const existingTutorState = getTutorStateFromMetadata(session.metadata);
        const mergedMetadata = mergeSessionMetadata({
          existing: session.metadata,
          conversationState,
          tutorState: {
            ...existingTutorState,
            activeVideoId: videoId,
            activeVideoTitle: response.title || existingTutorState.activeVideoTitle,
            activeVideoSummary: response.summary || existingTutorState.activeVideoSummary,
            activeVideoConcepts: response.concepts.length > 0 ? response.concepts : existingTutorState.activeVideoConcepts,
            activeVideoWhyRecommended: response.whyRecommended || existingTutorState.activeVideoWhyRecommended,
            updatedAt: new Date().toISOString(),
          },
          systemNotices: (response.notices || []).map((notice) =>
            createSystemNotice(
              notice.code,
              notice.message,
              notice.severity === 'warning' ? 'warning' : 'info'
            )
          ),
        });
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadata: mergedMetadata as any, updatedAt: new Date() },
        });
      }
    }

    return res.status(200).send(response);
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Video context route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/learning-effect-event', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const eventType = safeString(req.body?.eventType).trim();
    if (!eventType) {
      return res.status(400).send({ message: 'eventType is required.' });
    }
    const event = await recordLearningEffectEvent({
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      subject: safeString(req.body?.subject).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      messageId: safeString(req.body?.messageId).trim() || null,
      eventType,
      outcome: safeString(req.body?.outcome).trim() || null,
      metadata: asRecord(req.body?.metadata) || null,
    });
    const masterySignal = mapLearningEffectToMasteryEvidence({
      eventType,
      topic: event.topic || null,
      subject: event.subject || null,
    });
    const topicMastery = masterySignal
      ? await recordMasteryEvidenceSignal({
          userId: req.user!.id,
          signal: masterySignal,
          metadata: asRecord(req.body?.metadata) || null,
        })
      : null;
    return res.status(201).send({ event, topicMastery });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Learning effect event route failed');
    const fallbackEventType = safeString(req.body?.eventType).trim() || 'event_recorded';
    const fallbackEvent = {
      id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: req.user!.id,
      sessionId: safeString(req.body?.sessionId).trim() || null,
      subject: safeString(req.body?.subject).trim() || null,
      topic: safeString(req.body?.topic).trim() || null,
      revisionItemId: safeString(req.body?.revisionItemId).trim() || null,
      messageId: safeString(req.body?.messageId).trim() || null,
      eventType: fallbackEventType,
      outcome: safeString(req.body?.outcome).trim() || null,
      metadata: asRecord(req.body?.metadata) || null,
      createdAt: new Date().toISOString(),
    };
    return res.status(201).send({ event: fallbackEvent, topicMastery: null });
  }
});

router.get('/effectiveness-summary', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    if (!requireRole(req as any, res, ['admin'])) return;
    const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
    const targetUserId = safeString(req.query?.studentId).trim() || req.user!.id;
    return res.status(200).send(await getLearningEffectivenessSummary({ userId: targetUserId, days }));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Effectiveness summary route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/constitution-health', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    if (!requireRole(req as any, res, ['admin'])) return;
    const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
    const targetUserId = safeString(req.query?.studentId).trim() || req.user!.id;
    return res.status(200).send(await getProductConstitutionHealth({ userId: targetUserId, days }));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Constitution health route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/founder-truth', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    if (!requireRole(req as any, res, ['admin'])) return;
    const days = Math.max(1, Math.min(Number(req.query?.days || 30), 180));
    const targetUserId = safeString(req.query?.studentId).trim() || req.user!.id;
    return res.status(200).send(await getFounderTruthSummary({ userId: targetUserId, days }));
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Founder truth route failed');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/artifacts/parse', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const rawFileData = req.body?.fileData;
    const attachments = Array.isArray(rawFileData) ? rawFileData.filter(Boolean) : rawFileData ? [rawFileData] : [];
    if (attachments.length === 0) {
      return res.status(400).send({ message: 'fileData is required.' });
    }

    const artifacts = await buildTutorArtifactsFromUploads({
      attachments,
      userText: safeString(req.body?.prompt || req.body?.message || ''),
    });
    const systemNotices = buildArtifactSystemNotices({ attachments, artifacts });

    if (safeString(req.body?.sessionId)) {
      const studentUserId = req.user!.id;
      const session = await prisma.chatSession.findFirst({
        where: { id: safeString(req.body.sessionId), studentId: studentUserId },
        select: { id: true, metadata: true },
      });

      if (session) {
        const mergedMetadata = mergeSessionMetadata({
          existing: session.metadata,
          conversationState: buildEffectiveConversationState(session.metadata, null),
          tutorArtifacts: artifacts,
          tutorState: {
            ...getTutorStateFromMetadata(session.metadata),
            activeArtifactLabels: artifacts.map((artifact) => artifact.label),
            activeArtifactSummary: artifacts.map((artifact) => artifact.summary).join(' '),
            updatedAt: new Date().toISOString(),
          },
          systemNotices,
        });
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadata: mergedMetadata as any, updatedAt: new Date() },
        });
      }
    }

    return res.status(200).send({ artifacts, systemNotices });
  } catch (error) {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/safety/alerts', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin', 'counselor']);
    if (!viewerRole) return;

    if (!prismaAny?.safetyAlert) {
      return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
    }

    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const status = safeString(req.query.status);
    const severity = safeString(req.query.severity);
    const studentIdFilter = viewerRole === 'admin' ? safeString(req.query.studentId) : '';
    const where: any = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (studentIdFilter) where.studentId = studentIdFilter;
    if (viewerRole === 'counselor') {
      where.severity = { in: ['high', 'critical'] };
    }

    const alerts = await prismaAny.safetyAlert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    await logSafetyAuditEvent({
      actorId: req.user!.id,
      actorRole: viewerRole,
      action: 'safety_alerts_list',
      targetType: 'safety_alert',
      metadata: { count: alerts.length },
    });

    return res.status(200).send({ viewerRole, alerts });
  } catch (error) {
    logger.error({ error: String(error) }, '[Safety] Failed to fetch alerts list.');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/safety/alerts/:id', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin', 'counselor']);
    if (!viewerRole) return;

    if (!prismaAny?.safetyAlert) {
      return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
    }

    const alert = await prismaAny.safetyAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) return res.status(404).send({ message: 'Alert not found.' });

    if (viewerRole === 'counselor' && !HIGH_RISK_SEVERITIES.has(String(alert.severity || ''))) {
      return res.status(403).send({ message: 'Forbidden' });
    }

    let contextMessages: any[] = [];
    if (alert.sessionId) {
      if (alert.messageId) {
        const anchor = await prisma.chatMessage.findUnique({
          where: { id: alert.messageId },
          select: { messageNumber: true, sessionId: true },
        });
        if (anchor?.messageNumber) {
          contextMessages = await prisma.chatMessage.findMany({
            where: {
              sessionId: alert.sessionId,
              messageNumber: {
                gte: Math.max(1, anchor.messageNumber - 4),
                lte: anchor.messageNumber + 8,
              },
            },
            orderBy: { messageNumber: 'asc' },
          });
        }
      }

      if (contextMessages.length === 0) {
        contextMessages = await prisma.chatMessage.findMany({
          where: { sessionId: alert.sessionId },
          orderBy: { timestamp: 'desc' },
          take: 20,
        });
        contextMessages = [...contextMessages].reverse();
      }
    }

    await logSafetyAuditEvent({
      actorId: req.user!.id,
      actorRole: viewerRole,
      action: 'safety_alerts_view',
      targetType: 'safety_alert',
      targetId: alert.id,
      metadata: { sessionId: alert.sessionId || null },
    });

    return res.status(200).send({
      viewerRole,
      alert,
      contextMessages: contextMessages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toISOString ? msg.timestamp.toISOString() : msg.timestamp,
        videoData: deriveVideoDataFromMessage(msg),
        sources: extractSources(msg.metadata),
      })),
    });
  } catch (error) {
    logger.error({ error: String(error), alertId: req.params.id }, '[Safety] Failed to fetch alert detail.');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.patch('/safety/alerts/:id/status', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin', 'counselor']);
    if (!viewerRole) return;

    if (!prismaAny?.safetyAlert) {
      return res.status(503).send({ message: 'Safety alerts are not configured yet.' });
    }

    const nextStatus = safeString(req.body?.status).toLowerCase();
    const allowedStatus = new Set(['open', 'reviewing', 'resolved', 'dismissed']);
    if (!allowedStatus.has(nextStatus)) {
      return res.status(400).send({ message: 'Invalid status' });
    }

    const updated = await prismaAny.safetyAlert.update({
      where: { id: req.params.id },
      data: {
        status: nextStatus,
        metadata: {
          updatedBy: req.user!.id,
          updatedByRole: viewerRole,
          note: safeString(req.body?.note),
        },
      },
    });

    await logSafetyAuditEvent({
      actorId: req.user!.id,
      actorRole: viewerRole,
      action: 'safety_alerts_status_update',
      targetType: 'safety_alert',
      targetId: req.params.id,
      metadata: { status: nextStatus },
    });

    return res.status(200).send({
      message: 'Safety alert updated.',
      alert: updated,
    });
  } catch (error) {
    logger.error({ error: String(error), alertId: req.params.id }, '[Safety] Failed to update alert status.');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/safety/chats', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const viewerRole = requireRole(req as any, res, ['admin']);
    if (!viewerRole) return;

    const sessionId = safeString(req.query.sessionId);
    const studentId = safeString(req.query.studentId);
    const query = safeString(req.query.q);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100)));

    if (sessionId) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, ...(studentId ? { studentId } : {}) },
        include: { messages: { orderBy: { timestamp: 'asc' } } },
      });
      if (!session) return res.status(404).send({ message: 'Session not found.' });

      await logSafetyAuditEvent({
        actorId: req.user!.id,
        actorRole: viewerRole,
        action: 'safety_chats_session_view',
        targetType: 'chat_session',
        targetId: session.id,
      });

      return res.status(200).send({
        viewerRole,
        session: {
          id: session.id,
          studentId: session.studentId,
          topic: session.topic,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        },
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
          videoData: deriveVideoDataFromMessage(msg),
          sources: extractSources(msg.metadata),
          image: deriveImageFromMessage(msg),
        })),
      });
    }

    const where: any = {};
    if (query) where.content = { contains: query, mode: 'insensitive' };
    if (studentId) where.chatSession = { studentId };

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        chatSession: {
          select: { id: true, studentId: true, topic: true, updatedAt: true },
        },
      },
    });

    await logSafetyAuditEvent({
      actorId: req.user!.id,
      actorRole: viewerRole,
      action: 'safety_chats_list',
      targetType: 'chat_message',
      metadata: { count: messages.length, query: query || null, studentId: studentId || null },
    });

    return res.status(200).send({
      viewerRole,
      messages: messages.map((msg: any) => ({
        id: msg.id,
        sessionId: msg.sessionId,
        role: msg.role,
        content: msg.content,
        messageNumber: msg.messageNumber,
        timestamp: msg.timestamp.toISOString(),
        studentId: msg.chatSession?.studentId,
        sessionTopic: msg.chatSession?.topic || '',
        videoData: deriveVideoDataFromMessage(msg),
        sources: extractSources(msg.metadata),
        image: deriveImageFromMessage(msg),
      })),
    });
  } catch (error) {
    logger.error({ error: String(error) }, '[Safety] Failed to fetch chat viewer data.');
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/session/:id/delete', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const { count } = await prisma.chatSession.deleteMany({
      where: { id: req.params.id, studentId: req.user!.id }
    });
    if (count === 0) return res.status(404).send({ message: 'Session not found' });
    res.status(200).send({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/search', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { q: query, mode = 'hybrid' } = req.query as any;
    if (!query) return res.status(400).send({ message: 'Query required' });

    let results: any[] = [];
    const promises = [];

    if (mode === 'keyword' || mode === 'hybrid') {
      promises.push(
        prisma.chatSession.findMany({
          where: {
            studentId,
            messages: { some: {} },
            OR: [
              { topic: { contains: query, mode: 'insensitive' } },
              { messages: { some: { content: { contains: query, mode: 'insensitive' } } } }
            ]
          },
          select: { id: true, topic: true, updatedAt: true },
          take: 10
        }).then(sess => sess.map(s => ({ ...s, source: 'keyword', relevance: 0.5 })))
      );
    }

    if ((mode === 'semantic' || mode === 'hybrid') && pineconeIndex) {
      promises.push(
        openai.embeddings.create({ model: 'text-embedding-ada-002', input: query })
          .then(async (emb) => {
            const vec = emb.data[0].embedding;
            const matches = await pineconeIndex.query({
              vector: vec, topK: 10, filter: { studentId: { $eq: studentId } }
            });
            const ids = matches.matches?.map(m => m.id) || [];
            if (ids.length === 0) return [];
            const sessions = await prisma.chatSession.findMany({ where: { id: { in: ids } }, select: { id: true, topic: true, updatedAt: true } });
            return sessions.map(s => ({ ...s, source: 'semantic', relevance: 0.8 }));
          })
      );
    }

    const searchResults = await Promise.all(promises);
    const unique = Array.from(new Map(searchResults.flat().map(item => [item.id, item])).values());
    res.status(200).send(unique.slice(0, 10));

  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/preferences', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  logger.debug({ userId: req.user?.id }, '[API] /preferences hit');
  try {
    const [prefs, metadata] = await Promise.all([
      getOrCreateCopilotPreferences(req.user!.id),
      getCopilotPreferencesMetadata(req.user!.id),
    ]);
    const preferredLanguage = normalizeVoiceLanguageMode(prefs?.preferredLanguage);
    const interests = Array.isArray(prefs?.interests)
      ? prefs.interests.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : [];
    const sessionLanguageState = normalizeSessionLanguageState(metadata.sessionLanguageState, preferredLanguage);
    const appearance = readAppearanceMetadata(metadata);
    const learningStudio = readLearningStudioMetadata(metadata);
    res.status(200).json({
      ...prefs,
      preferredLanguage,
      interests,
      sessionLanguageState,
      copilotThemePreference: appearance.copilotThemePreference,
      studyAtmosphere: appearance.studyAtmosphere,
      mediaPreferences: learningStudio.mediaPreferences,
      learningStyleSignals: learningStudio.learningStyleSignals,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Error fetching preferences');
    res.status(500).send({ message: 'Could not load preferences right now.' });
  }
});

router.post('/preferences/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const preferredLanguage = normalizeVoiceLanguageMode(req.body?.preferredLanguage);
    const interestsRaw = Array.isArray(req.body?.interests) ? req.body.interests : [];
    const interests = interestsRaw
      .filter((item: any) => typeof item === 'string')
      .map((item: string) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_INTERESTS);
    const existingMetadata = await getCopilotPreferencesMetadata(studentId);
    const existingAppearance = readAppearanceMetadata(existingMetadata);
    const existingLearningStudio = readLearningStudioMetadata(existingMetadata);
    const sessionLanguageState = normalizeSessionLanguageState(
      req.body?.sessionLanguageState,
      preferredLanguage,
      (existingMetadata.sessionLanguageState as SessionLanguageState | undefined)?.lastDetectedInputLanguage || null
    );
    const copilotThemePreference = normalizeCopilotThemePreferenceValue(
      req.body?.copilotThemePreference || existingAppearance.copilotThemePreference
    );
    const studyAtmosphere = normalizeStudyAtmospherePreferenceValue(
      req.body?.studyAtmosphere,
      existingAppearance.studyAtmosphere
    );
    const mediaPreferences = normalizeMediaPreferencesValue(
      req.body?.mediaPreferences,
      existingLearningStudio.mediaPreferences
    );
    const learningStyleSignals = normalizeLearningStyleSignals(
      req.body?.learningStyleSignals ?? existingLearningStudio.learningStyleSignals
    );

    const saved = await prisma.copilotPreferences.upsert({
      where: { userId: studentId },
      update: { preferredLanguage, interests: interests as Prisma.JsonArray },
      create: { userId: studentId, preferredLanguage, interests: interests as Prisma.JsonArray },
    });
    await updateCopilotPreferencesMetadata(studentId, {
      ...existingMetadata,
      sessionLanguageState,
      appearance: {
        ...existingAppearance,
        copilotThemePreference,
        studyAtmosphere,
      },
      learningStudio: {
        ...existingLearningStudio,
        mediaPreferences,
        learningStyleSignals,
      },
    });

    const redis = await getRedisClient();
    if (redis) await redis.del(`copilot:preferences:${studentId}`);

    res.status(200).json({
      message: 'Preferences updated',
      preferredLanguage: normalizeVoiceLanguageMode(saved.preferredLanguage),
      interests: Array.isArray(saved.interests) ? saved.interests : [],
      lastUpdatedAt: saved.lastUpdatedAt,
      sessionLanguageState,
      copilotThemePreference,
      studyAtmosphere,
      mediaPreferences,
      learningStyleSignals,
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/memory/student', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const memory = await getStudentMemoryPayload(studentId);
    res.status(200).send(memory);
  } catch (error) {
    logger.error({ err: error, userId: req.user?.id }, '[API] /memory/student failed');
    res.status(500).send({ message: 'Error' });
  }
});

router.post('/memory/update', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const type = safeString(req.body?.type);
    const data = req.body?.data;
    const studentId = req.user!.id;
    if (!data || (type !== 'progress' && type !== 'mistake')) {
      return res.status(400).send({ message: 'Invalid memory update payload' });
    }
    if (type === 'progress') {
      await prisma.progress.upsert({ where: { id: data.id || 'new' }, create: { ...data, studentId }, update: data });
    } else if (type === 'mistake') {
      await prisma.mistake.create({ data: { ...data, studentId } });
    }
    const redis = await getRedisClient();
    if (redis) await redis.del(`memory:${studentId}`);
    res.status(200).send({ message: 'Updated' });
  } catch (e) { res.status(500).send({ message: 'Error' }); }
});

router.post('/memory/mastery/upsert', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const subject = safeString(req.body?.subject).trim();
    const topic = safeString(req.body?.topic).trim();
    const misconception = safeString(req.body?.misconception).trim();
    const mastery = Math.max(0, Math.min(100, Number(req.body?.mastery || 0)));

    if (!subject || !topic) {
      return res.status(400).send({ message: 'subject and topic are required.' });
    }

    const existingProgress = await prisma.progress.findFirst({
      where: { studentId, subject, topic },
      orderBy: { updatedAt: 'desc' },
    });

    const progress = existingProgress
      ? await prisma.progress.update({
          where: { id: existingProgress.id },
          data: { mastery },
        })
      : await prisma.progress.create({
          data: { studentId, subject, topic, mastery },
        });

    let mistake = null;
    if (misconception) {
      const existingMistake = await prisma.mistake.findFirst({
        where: { studentId, topic, error: misconception },
        orderBy: { lastSeen: 'desc' },
      });
      mistake = existingMistake
        ? await prisma.mistake.update({
            where: { id: existingMistake.id },
            data: { attempts: { increment: 1 }, lastSeen: new Date() },
          })
        : await prisma.mistake.create({
            data: { studentId, topic, error: misconception, attempts: 1 },
          });
    }

    const redis = await getRedisClient();
    if (redis) {
      await redis.del(`memory:${studentId}`);
    }

    return res.status(200).send({ progress, mistake });
  } catch (error) {
    return res.status(500).send({ message: 'Error' });
  }
});

// ============================================================================
// 🎙️ VOICE USAGE QUOTA (DB-Backed)
// ============================================================================
router.get('/document/quota', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const quota = await getDocumentQuotaState(studentId);
    return res.status(200).send(quota);
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/document/consume', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const kind = safeString(req.body?.documentKind || req.body?.kind).toLowerCase();
    if (!isDocumentKind(kind)) {
      return res.status(400).send({ message: 'Unsupported document kind.' });
    }

    const quota = await consumeDocumentQuota(studentId);
    if (!quota.allowed) {
      return res.status(429).send({
        message: 'Daily document limit reached (2 per 24 hours).',
        ...quota,
      });
    }

    return res.status(200).send({
      message: 'Document quota consumed.',
      ...quota,
    });
  } catch {
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/voice/balance', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const summary = await getVoiceBalanceSummary(studentId);
    res.status(200).send({
      studentId: summary.studentId,
      remainingSeconds: summary.remainingSeconds,
      remainingMinutesRoundedDown: summary.remainingMinutesRoundedDown,
      display: summary.display,
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/voice/session/start', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const chatSessionId = safeString(req.body?.chatSessionId || '') || null;
    const metadata = req.body?.metadata;
    const started = await startVoiceSession({ studentId, chatSessionId, metadata });

    if (!started.allowed) {
      return res.status(402).send({
        allowed: false,
        reason: started.reason,
        remainingSeconds: started.remainingSeconds,
        message: 'Voice time finished'
      });
    }

    return res.status(200).send({
      allowed: true,
      sessionUsageId: started.sessionUsageId,
      mode: started.mode,
      remainingSeconds: started.remainingSeconds,
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/voice/session/stop', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const sessionUsageId = safeString(req.body?.sessionUsageId);
    if (!sessionUsageId) {
      return res.status(400).send({ message: 'sessionUsageId is required.' });
    }

    const result = await stopVoiceSession({
      studentId,
      sessionUsageId,
      stopReason: safeString(req.body?.stopReason),
      listeningSecondsUsed: Number(req.body?.listeningSecondsUsed || 0),
      ttsSecondsUsed: Number(req.body?.ttsSecondsUsed || 0),
      metadata: req.body?.metadata,
    });

    return res.status(200).send({
      sessionUsageId: result.sessionUsageId,
      billedSeconds: result.billedSeconds,
      remainingSeconds: result.remainingSeconds,
      reason: result.stopReason,
      mode: result.mode,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    if (message.includes('Voice session not found')) {
      return res.status(404).send({ message: 'Voice session not found.' });
    }
    return res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/voice/quota', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { start, end } = getVoiceDayRange();
    const [summary, dailySessions] = await Promise.all([
      getVoiceBalanceSummary(studentId),
      prisma.voiceSessionUsage.findMany({
        where: { studentId, startedAt: { gte: start, lte: end } },
        select: { billedSeconds: true },
        orderBy: { startedAt: 'asc' }
      })
    ]);

    const count = dailySessions.length;
    const seconds = dailySessions.reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
    const bonusSeconds = dailySessions
      .slice(MAX_VOICE_SESSIONS_PER_DAY)
      .reduce((sum, s) => sum + (s.billedSeconds || 0), 0);
    const quota = computeVoiceQuota({ count, seconds, bonusSeconds });

    res.status(200).send({
      date: new Date().toISOString().slice(0, 10),
      count,
      seconds,
      bonusSeconds,
      remainingBalanceSeconds: summary.remainingSeconds,
      ...quota,
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.post('/voice/usage', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const durationRaw = Number(req.body?.durationSec);
    if (!Number.isFinite(durationRaw) || durationRaw <= 0) {
      return res.status(400).send({ message: 'Duration required.' });
    }
    const durationSec = Math.ceil(durationRaw);
    const startedAtRaw = req.body?.startedAt;
    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date();
    const sessionId = safeString(req.body?.sessionId || '') || null;
    const source = safeString(req.body?.source || '');

    const started = await startVoiceSession({
      studentId,
      chatSessionId: sessionId,
      metadata: { source: source || 'legacy-usage', startedAt: Number.isNaN(startedAt.getTime()) ? new Date().toISOString() : startedAt.toISOString() }
    });

    if (!started.allowed || !started.sessionUsageId) {
      return res.status(429).send({ message: "You've used today's voice time. Try again tomorrow." });
    }

    const stopped = await stopVoiceSession({
      studentId,
      sessionUsageId: started.sessionUsageId,
      stopReason: 'user_stop',
      listeningSecondsUsed: durationSec,
      ttsSecondsUsed: 0,
      metadata: { source: source || 'legacy-usage' }
    });

    res.status(200).send({ ok: true, recordId: stopped.sessionUsageId, billedSeconds: stopped.billedSeconds, remainingSeconds: stopped.remainingSeconds });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ============================================================================
// 🎯 CONVERSATIONAL VOICE ENDPOINT (STT -> AI STREAM -> SENTENCE TTS)
// ============================================================================
router.post('/voice-chat', schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[API] /voice-chat hit');

  if (!req.file) return res.status(400).send({ message: 'Audio required' });
  const audioFilePath = req.file.path;

  try {
    const studentId = req.user!.id;
    if (!(await ensureVoiceTimeAvailable(studentId, res))) return;

    const { sessionId, conversationState } = req.body;
    const incomingVoiceConversationState = parseMaybeJsonRecord(conversationState);
    const incomingVoiceLanguageState = parseMaybeJsonRecord(req.body?.sessionLanguageState);
    const incomingVoiceMetacognitiveState = (parseMaybeJsonRecord(req.body?.metacognitiveState) || null) as MetacognitiveStateSnapshot | null;
    const incomingVoiceWorkspaceContext = parseMaybeJsonRecord(req.body?.workspaceContext);
    const requestVoiceMode = normalizeVoiceLanguageMode(
      incomingVoiceLanguageState?.preferredLanguageMode || req.body?.languageMode
    );
    const resolvedVoiceBehaviorProfile = resolveVoiceBehaviorProfile({
      requestedProfile: req.body?.voiceBehaviorProfile,
      destination: incomingVoiceWorkspaceContext?.activeDestination,
      hasRevisionContext:
        safeString(incomingVoiceWorkspaceContext?.activeDestination).toLowerCase() === 'revision' ||
        Boolean(safeString(req.body?.revisionItemId).trim()) ||
        Boolean(safeString(req.body?.revisionCollectionId).trim()),
      hasReadingContext:
        safeString(incomingVoiceWorkspaceContext?.activeDestination).toLowerCase() === 'media' ||
        safeString(req.body?.contentPurpose).toLowerCase().includes('recap') ||
        req.body?.readAloud === true ||
        safeString(req.body?.readAloud).toLowerCase() === 'true',
      hasFocusContext:
        Boolean(incomingVoiceWorkspaceContext?.modeFlags && asRecord(incomingVoiceWorkspaceContext.modeFlags)?.focus) ||
        req.body?.focusMode === true ||
        safeString(req.body?.focusMode).toLowerCase() === 'true',
      hasExamContext:
        Boolean(incomingVoiceWorkspaceContext?.modeFlags && asRecord(incomingVoiceWorkspaceContext.modeFlags)?.exam) ||
        req.body?.examMode === true ||
        safeString(req.body?.examMode).toLowerCase() === 'true',
    });

    // 1. STT - Transcribe User Audio
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: toWhisperLanguage(requestVoiceMode),
      prompt: buildSttPrompt(requestVoiceMode),
      temperature: 0,
    });
    fs.unlinkSync(audioFilePath);

    const userText = transcription.text;
    const detectedInputLanguage = detectInputLanguage(userText);
    logger.info({ userText }, '[VoiceChat] User Transcribed');

    const [session, preferences, preferenceMetadata] = await Promise.all([
      prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          student: { select: { name: true, gradeLevel: true, userId: true } },
          messages: { orderBy: { timestamp: 'asc' }, take: 60 }
        }
      }),
      getOrCreateCopilotPreferences(studentId),
      getCopilotPreferencesMetadata(studentId),
    ]);

    if (!session) throw new Error('Session not found');
    const effectiveVoiceSessionLanguageState = normalizeSessionLanguageState(
      incomingVoiceLanguageState || preferenceMetadata.sessionLanguageState,
      preferences?.preferredLanguage,
      detectedInputLanguage
    );
    const effectiveVoiceMode = normalizeVoiceLanguageMode(
      effectiveVoiceSessionLanguageState.preferredLanguageMode || preferences?.preferredLanguage || req.body?.languageMode
    );
    const effectiveVoiceState = buildEffectiveConversationState(session.metadata, incomingVoiceConversationState);
    const studentMemory = await getStudentMemoryPayload(studentId);
    const priorTutorState = getTutorStateFromMetadata(session.metadata);
    const priorArtifacts = getTutorArtifactsFromMetadata(session.metadata);
    const metacognitiveProfile = await getMetacognitiveProfile(studentId);
    const mergedMetacognitiveState = mergeMetacognitiveSnapshot(
      metacognitiveProfile.recentSnapshot,
      incomingVoiceMetacognitiveState
    );

    // 2. Prep Stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send original transcription to UI
    res.write(`data: ${JSON.stringify({
      type: 'transcription',
      content: userText,
      detectedInputLanguage,
      preferredResponseLanguage: effectiveVoiceSessionLanguageState.preferredResponseLanguage,
    })}\n\n`);

    const preAiSemanticSnapshot = buildSemanticSessionSnapshot([
      ...session.messages.map((message) => ({
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })),
      {
        role: 'user',
        content: userText,
        metadata: {
          language: buildMessageLanguageMetadata({
            text: userText,
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            detectedInputLanguage,
          }),
          metacognition: mergedMetacognitiveState,
        },
      },
    ]);
    const provisionalTutorState = buildLearnerTutorState({
      priorTutorState,
      state: effectiveVoiceState,
      topic: safeString(
        (effectiveVoiceState as any)?.lastStudyTopic ||
        (effectiveVoiceState as any)?.lastTopic ||
        session.topic ||
        userText
      ).trim() || undefined,
      artifacts: priorArtifacts,
      lastIntent: 'voice_study_turn',
      memory: studentMemory,
      semanticSnapshot: preAiSemanticSnapshot,
      sessionLanguageState: effectiveVoiceSessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
    });

    let fullAiResponse = '';
    let sentenceBuffer = '';
    let streamedVoiceChunkCount = 0;
    const FIRST_VOICE_CHUNK_MIN = 24;
    const FIRST_VOICE_CHUNK_MAX = 170;
    const NEXT_VOICE_CHUNK_MIN = 70;
    const NEXT_VOICE_CHUNK_MAX = 280;
    let ttsDispatchChain: Promise<void> = Promise.resolve();

    // Function to Synthesize and Stream Audio Chunk
    const synthAndStream = async (text: string) => {
      try {
        const mp3 = await openai.audio.speech.create({
          model: DEFAULT_TTS_MODEL,
          voice: DEFAULT_TTS_VOICE as any,
          input: sanitizeTtsInput(text, effectiveVoiceMode),
          instructions: buildTtsInstruction(effectiveVoiceMode, resolvedVoiceBehaviorProfile),
          response_format: 'mp3',
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.write(`data: ${JSON.stringify({ type: 'audio', content: buffer.toString('base64') })}\n\n`);
      } catch (e) {
        logger.error({ error: String(e) }, '[VoiceChat] TTS Chunk Error');
      }
    };

    const pickWhitespaceCut = (source: string, maxChars: number, minChars: number) => {
      const capped = source.slice(0, maxChars);
      const whitespaceCut = Math.max(capped.lastIndexOf(' '), capped.lastIndexOf('\n'));
      return whitespaceCut >= minChars ? whitespaceCut : capped.length;
    };

    const popSpeakableChunk = (forceTail = false): string | null => {
      const source = sentenceBuffer;
      if (!source.trim()) return null;
      if (forceTail) {
        sentenceBuffer = '';
        return source.trim();
      }

      const isFirst = streamedVoiceChunkCount === 0;
      const minChars = isFirst ? FIRST_VOICE_CHUNK_MIN : NEXT_VOICE_CHUNK_MIN;
      const maxChars = isFirst ? FIRST_VOICE_CHUNK_MAX : NEXT_VOICE_CHUNK_MAX;
      const capped = source.slice(0, maxChars);
      const sentenceRegex = /[^.!?\u061F]+[.!?\u061F]+(?:\s+|$)/g;
      let selectedEnd = 0;
      let match: RegExpExecArray | null = null;
      while ((match = sentenceRegex.exec(capped)) !== null) {
        const end = (match.index || 0) + match[0].length;
        if (end >= minChars) selectedEnd = end;
      }

      if (selectedEnd <= 0) {
        if (!isFirst || source.trim().length < 120) return null;
        selectedEnd = pickWhitespaceCut(source, maxChars, minChars);
      }

      while (selectedEnd < source.length && /\s/.test(source[selectedEnd] || '')) {
        selectedEnd += 1;
      }

      const chunk = source.slice(0, selectedEnd).trim();
      sentenceBuffer = source.slice(selectedEnd).trimStart();
      return chunk || null;
    };

    const queueSynthChunk = (chunk: string) => {
      if (!chunk) return;
      streamedVoiceChunkCount += 1;
      ttsDispatchChain = ttsDispatchChain
        .then(() => synthAndStream(chunk))
        .catch((error) => {
          logger.error({ error: String(error) }, '[VoiceChat] queued TTS chunk failed');
        });
    };

    // 3. AI Stream + Sentence Buffer TTS
    const emotionalAICopilot = await getEmotionalAICopilot();
    const aiResult = await emotionalAICopilot({
      text: userText,
      chatHistory: trimHistoryForModel(session.messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "model",
        content: m.content,
        timestamp: m.timestamp,
        image: deriveImageFromMessage(m),
        videoData: deriveVideoDataFromMessage(m) || undefined,
        metadata: (m.metadata ?? null) as Record<string, unknown> | null,
      }))),
      state: effectiveVoiceState,
      tutorState: provisionalTutorState,
      studentProfile: { name: session.student.name || 'Student', gradeLevel: session.student.gradeLevel || 'Primary' },
      preferences: { preferredLanguage: preferences.preferredLanguage as any, interests: preferences.interests },
      sessionLanguageState: effectiveVoiceSessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      memory: studentMemory,
      currentTitle: session.topic || undefined,
      onToken: (token: string) => {
        fullAiResponse += token;
        sentenceBuffer += token;

        // Push token to UI for text rendering
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);

        while (true) {
          const nextChunk = popSpeakableChunk(false);
          if (!nextChunk) break;
          queueSynthChunk(nextChunk);
        }
      }
    });

    // Handle remaining sentence
    if (sentenceBuffer.trim().length > 0) {
      const tailChunk = popSpeakableChunk(true);
      if (tailChunk) queueSynthChunk(tailChunk);
    }
    await ttsDispatchChain;

    // 4. Persistence (Post-Stream)
    const savedVoiceUserMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userText,
        timestamp: new Date(),
        messageNumber: session.messages.length + 1,
        metadata: toPrismaMetadata({
          language: buildMessageLanguageMetadata({
            text: userText,
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            detectedInputLanguage,
          }),
          metacognition: mergedMetacognitiveState,
        }),
      }
    });

    await createSafetyAlertIfNeeded({
      studentId,
      sessionId,
      messageId: savedVoiceUserMessage.id,
      text: userText,
      source: 'voice_chat',
    });

    const safeSources = sanitizeSources(aiResult.sources);
    const systemNotices = buildChatSystemNotices({
      attachmentNotices: [],
      safeSources,
      forceWebSearch: false,
      hasVideo: Boolean(aiResult.videoData?.id),
      videoSnapshot: undefined,
      userText,
      tutorState: provisionalTutorState,
    });
    const postAiSemanticSnapshot = buildSemanticSessionSnapshot([
      ...session.messages.map((message) => ({
        role: message.role,
        content: message.content,
        metadata: message.metadata,
      })),
      { role: 'user', content: userText },
      {
        role: 'model',
        content: fullAiResponse || aiResult.processedText,
        metadata: {
          sources: safeSources,
          videoData: aiResult.videoData,
          tutorArtifacts: priorArtifacts,
          language: buildMessageLanguageMetadata({
            text: userText,
            sessionLanguageState: effectiveVoiceSessionLanguageState,
            detectedInputLanguage,
          }),
          metacognition: mergedMetacognitiveState,
        },
      },
    ]);
    const videoSnapshot = await getOrBuildVideoTutorSnapshot({
      videoData: aiResult.videoData,
      activeTopic: safeString(aiResult.topic || session.topic || userText).trim() || undefined,
      whyRecommended: fullAiResponse || aiResult.processedText,
      priorTutorState,
    });
    const resolvedVoiceTopic = safeString(aiResult.topic || aiResult.suggestedTitle || session.topic).trim() || undefined;
    const resolvedVoiceSubject = safeString(
      priorArtifacts[0]?.subject ||
      provisionalTutorState.activeSubject ||
      inferSubjectFromTopic(resolvedVoiceTopic || userText)
    ).trim() || undefined;
    const { learnerLoopState, assistantMetadata, reflectionStatePatch } = await buildAssistantTurnPipeline({
      route: 'voice_chat',
      userId: studentId,
      userText,
      assistantText: fullAiResponse || aiResult.processedText,
      topic: resolvedVoiceTopic,
      subject: resolvedVoiceSubject,
      tutorActionId: undefined,
      priorTutorState: provisionalTutorState,
      currentMetacognitiveState: mergedMetacognitiveState,
      awaitingStudentAttempt: Boolean(
        (aiResult.state as ConversationState | undefined)?.awaitingPracticeQuestionAnswer ||
        provisionalTutorState.awaitingStudentAttempt
      ),
      afterMistake: Boolean(
        mergedMetacognitiveState?.errorType ||
        /\b(incorrect|not quite|mistake|wrong step|check that step)\b/i.test(fullAiResponse || aiResult.processedText)
      ),
      afterSuccess: /\b(well done|good work|that is right|you got it|correct)\b/i.test(fullAiResponse || aiResult.processedText),
      forceAwaitingStudentAttempt: Boolean(priorTutorState.awaitingStudentAttempt),
      sessionLanguageState: effectiveVoiceSessionLanguageState,
      detectedInputLanguage,
      generatedLanguage: effectiveVoiceSessionLanguageState.preferredResponseLanguage,
      systemNotices,
      buildMessageLanguageMetadata,
    });
    const tutorState = {
      ...buildLearnerTutorState({
      priorTutorState,
      state: aiResult.state as ConversationState,
      topic: resolvedVoiceTopic,
      subject: resolvedVoiceSubject,
      artifacts: priorArtifacts,
      videoData: aiResult.videoData,
      lastIntent: 'voice_study_turn',
      memory: studentMemory,
      semanticSnapshot: postAiSemanticSnapshot,
      videoSnapshot,
      systemNotices,
      sessionLanguageState: effectiveVoiceSessionLanguageState,
      metacognitiveState: mergedMetacognitiveState,
      reflectionSignal: metacognitiveProfile.lastReflectionSignal || provisionalTutorState.reflectionSignal || null,
      topicMastery: learnerLoopState.topicMastery,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
      preferredSupportPatterns: metacognitiveProfile.preferredSupportPatterns || undefined,
      }),
      ...reflectionStatePatch,
    };
    const savedVoiceAiMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'model',
        content: fullAiResponse || aiResult.processedText,
        timestamp: new Date(),
        messageNumber: session.messages.length + 2,
        metadata: toPrismaMetadata({
          videoData: aiResult.videoData || null,
          video: aiResult.videoData || null,
          sources: safeSources,
          tutorArtifacts: priorArtifacts,
          videoContextSummary: videoSnapshot.activeVideoSummary,
          videoConcepts: videoSnapshot.activeVideoConcepts,
          videoWhyRecommended: videoSnapshot.activeVideoWhyRecommended,
          ...assistantMetadata,
        }),
      }
    });
    recordAssistantEnvelopeAnalytics({
      userId: studentId,
      sessionId,
      messageId: savedVoiceAiMessage.id,
      subject: resolvedVoiceSubject || null,
      topic: resolvedVoiceTopic || null,
      assistantMetadata,
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        topic: isPlaceholderTitle(session.topic)
          ? (normalizeTitleCandidate(aiResult.suggestedTitle || '', userText) || deriveTitleFromText(userText) || session.topic)
          : session.topic,
        updatedAt: new Date(),
        metadata: toPrismaMetadata(mergeSessionMetadata({
          existing: session.metadata,
          conversationState: aiResult.state as ConversationState,
          tutorState,
          tutorArtifacts: priorArtifacts,
          systemNotices,
        })),
      },
    });

    try {
      await updateCopilotPreferencesMetadata(studentId, {
        ...preferenceMetadata,
        sessionLanguageState: {
          ...effectiveVoiceSessionLanguageState,
          lastDetectedInputLanguage: detectedInputLanguage,
        },
      });
    } catch (error) {
      logger.warn({ userId: studentId, error: String(error) }, '[VoiceChat] Failed to persist language state');
    }

    try {
      await applyDeterministicMasteryUpdate({
        studentId,
        priorState: effectiveVoiceState,
        nextState: aiResult.state as ConversationState,
        topic: safeString(aiResult.topic || tutorState.activeTopic || session.topic).trim() || undefined,
        userMessage: userText,
        aiResponse: fullAiResponse || aiResult.processedText,
      });
    } catch (error) {
      logger.warn({ studentId, sessionId, error: String(error) }, '[VoiceChat] Deterministic mastery update failed');
    }

    res.write(`data: ${JSON.stringify({
      type: 'done',
      state: aiResult.state,
      metadata: {
        tutorState,
        video: aiResult.videoData,
        sources: safeSources,
        assistantMetadata,
      }
    })}\n\n`);
    res.end();

  } catch (error) {
    if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
    logger.error({ error: String(error) }, '[VoiceChat] Fatal Error');
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Voice processing failed' })}\n\n`);
      res.end();
    }
  }
});
router.post('/stt', schoolAuthMiddleware, sttLimiter, upload.single('audio'), async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[STT BACKEND] 🎤 STT request');
  try {
    if (!req.file) {
      logger.error('[STT BACKEND] ❌ No audio file provided in request');
      return res.status(400).send({ message: 'No audio file provided' });
    }

    const studentId = req.user!.id;
    const sessionUsageId = readVoiceSessionUsageId(req);
    if (!(await ensureActiveVoiceSession(studentId, sessionUsageId, res))) return;
    const preferenceMetadata = await getCopilotPreferencesMetadata(studentId);
    const requestedLanguageState = normalizeSessionLanguageState(
      parseMaybeJsonRecord(req.body?.sessionLanguageState) || preferenceMetadata.sessionLanguageState,
      req.body?.preferredLanguage || req.body?.languageMode || 'english'
    );
    const requestedMode = normalizeVoiceLanguageMode(
      requestedLanguageState.preferredLanguageMode || req.body?.languageMode || req.body?.preferredLanguage
    );

    const audioFilePath = req.file.path;
    logger.debug({ path: audioFilePath, size: req.file.size, mimetype: req.file.mimetype }, '[STT BACKEND] 📁 Audio file received');

    try {
      // Use OpenAI Whisper to transcribe the audio
      logger.debug('[STT BACKEND] 📡 Sending to OpenAI Whisper...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: toWhisperLanguage(requestedMode),
        prompt: buildSttPrompt(requestedMode),
        temperature: 0,
      });

      logger.info({ transcriptionText: transcription.text }, '[STT BACKEND] ✅ Transcription success');

      // Clean up the uploaded file
      fs.unlinkSync(audioFilePath);

      const detectedInputLanguage = detectInputLanguage(transcription.text);
      try {
        await updateCopilotPreferencesMetadata(studentId, {
          ...preferenceMetadata,
          sessionLanguageState: {
            ...requestedLanguageState,
            lastDetectedInputLanguage: detectedInputLanguage,
          },
        });
      } catch (persistError) {
        logger.warn({ userId: studentId, error: String(persistError) }, '[STT BACKEND] Failed to persist session language metadata');
      }

      res.status(200).json({
        text: transcription.text,
        detectedInputLanguage,
        preferredResponseLanguage: requestedLanguageState.preferredResponseLanguage,
      });
    } catch (error: any) {
      // Clean up the file if transcription fails
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
      logger.error({ error: error.response?.data || error.message }, '[STT BACKEND] ❌ Transcription error');
      res.status(500).send({ message: 'Failed to transcribe audio' });
    }
  } catch (error) {
    logger.error({ error: String(error) }, '[STT BACKEND] Error:');
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ============================================================================
// TEXT-TO-SPEECH ENDPOINT (OpenAI TTS with "alloy" voice)
// ============================================================================
router.post('/tts', schoolAuthMiddleware, ttsLimiter, async (req: AuthedRequest, res: Response) => {
  logger.info({ userId: req.user?.id }, '[TTS BACKEND] TTS request');
  try {
    const studentId = req.user!.id;
    const sessionUsageId = readVoiceSessionUsageId(req);
    if (!(await ensureActiveVoiceSession(studentId, sessionUsageId, res))) return;

    const preferenceMetadata = await getCopilotPreferencesMetadata(studentId);
    const requestedLanguageState = normalizeSessionLanguageState(
      req.body?.sessionLanguageState,
      req.body?.preferredLanguage || req.body?.languageMode || preferenceMetadata.sessionLanguageState || 'english'
    );
    const requestedWorkspaceContext = parseMaybeJsonRecord(req.body?.workspaceContext);
    const requestedMode = normalizeVoiceLanguageMode(
      requestedLanguageState.preferredLanguageMode || req.body?.languageMode || req.body?.preferredLanguage
    );
    const resolvedVoiceBehaviorProfile = resolveVoiceBehaviorProfile({
      requestedProfile: req.body?.voiceBehaviorProfile,
      destination: requestedWorkspaceContext?.activeDestination,
      hasRevisionContext:
        safeString(requestedWorkspaceContext?.activeDestination).toLowerCase() === 'revision' ||
        safeString(req.body?.sourceType).toLowerCase() === 'item' ||
        safeString(req.body?.sourceType).toLowerCase() === 'collection' ||
        safeString(req.body?.sourceType).toLowerCase() === 'queue' ||
        Boolean(safeString(req.body?.revisionItemId).trim()),
      hasReadingContext:
        safeString(requestedWorkspaceContext?.activeDestination).toLowerCase() === 'media' ||
        safeString(req.body?.contentPurpose).toLowerCase().includes('recap') ||
        req.body?.readAloud === true ||
        safeString(req.body?.readAloud).toLowerCase() === 'true',
      hasFocusContext:
        Boolean(requestedWorkspaceContext?.modeFlags && asRecord(requestedWorkspaceContext.modeFlags)?.focus) ||
        req.body?.focusMode === true ||
        safeString(req.body?.focusMode).toLowerCase() === 'true',
      hasExamContext:
        Boolean(requestedWorkspaceContext?.modeFlags && asRecord(requestedWorkspaceContext.modeFlags)?.exam) ||
        req.body?.examMode === true ||
        safeString(req.body?.examMode).toLowerCase() === 'true',
    });
    const text = sanitizeTtsInput(safeString(req.body?.text), requestedMode);
    const requestedVoice = safeString(req.body?.voice).toLowerCase();
    const voice = ALLOWED_TTS_VOICES.has(requestedVoice) ? requestedVoice : DEFAULT_TTS_VOICE;
    const speedRaw = Number(req.body?.speed ?? 1.2);
    const speed = Number.isFinite(speedRaw) ? Math.min(1.25, Math.max(0.95, speedRaw)) : 1.2;

    logger.debug({ textLength: text?.length }, '[TTS BACKEND] Request body');

    if (!text || typeof text !== 'string') {
      logger.error('[TTS BACKEND] Invalid text parameter');
      return res.status(400).send({ message: 'Text is required' });
    }
    if (text.length > MAX_TTS_CHARS) {
      return res.status(413).send({ message: `Text too long (max ${MAX_TTS_CHARS} characters).` });
    }

    logger.debug('[TTS BACKEND] Sending request to OpenAI TTS...');
    let mp3;
    try {
        mp3 = await openai.audio.speech.create({
          model: DEFAULT_TTS_MODEL,
          voice: voice as any,
          input: text,
          speed,
          instructions: buildTtsInstruction(requestedMode, resolvedVoiceBehaviorProfile),
          response_format: 'mp3',
        });
    } catch {
      mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: DEFAULT_TTS_VOICE as any,
        input: text,
        speed,
        response_format: 'mp3',
      });
    }

    logger.debug('[TTS BACKEND] Received response from OpenAI');

    const buffer = Buffer.from(await mp3.arrayBuffer());
    logger.debug({ bufferSize: buffer.length }, '[TTS BACKEND] Buffer created');

    if (buffer.length === 0) {
      logger.error('[TTS BACKEND] Generated audio buffer is empty');
      return res.status(500).send({ message: 'Generated empty audio' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
      'X-TTS-Voice': voice,
      'X-Voice-Profile': resolvedVoiceBehaviorProfile,
    });

    res.send(buffer);
  } catch (error: any) {
    logger.error({ error: String(error), userId: req.user?.id }, '[TTS BACKEND] Error in TTS endpoint');
    res.status(500).send({ message: 'Failed to generate speech', error: error.message });
  }
});

export default router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
