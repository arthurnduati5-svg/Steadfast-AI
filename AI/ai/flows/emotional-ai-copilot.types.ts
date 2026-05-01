import {
  ConversationState,
  Message,
  MessagePresentationMeta,
  MetacognitiveStateSnapshot,
  SessionLanguageState,
  SystemNotice,
  TutorActionRequest,
  TutorActionUiMeta,
  TutorArtifact,
  TutorState,
} from '../../lib/types';

export type MathTopicType = 'fractions' | 'algebra' | 'percentages' | 'equations' | 'generic';

export interface ExtendedConversationState extends ConversationState {
  activePracticeQuestion?: string;
  correctAnswers?: string[];
  lastStudyTopic?: string;
  lastTopic?: string;
  lastAssistantMessage?: string;
  conversationState?: 'initial_search' | 'awaiting_practice_response' | 'providing_practice_question' | 'general';
  mathModeActive?: boolean;
  mathWorkedExampleStep?: number;
  mathLessonKind?: 'fraction_division' | 'generic';
  mathLessonStep?: number;
  mathTargetExpression?: string;
  mathExpectedFinalAnswer?: string;
  mathTopicType?: MathTopicType;
  conceptualLessonModeActive?: boolean;
  conceptualTopic?: string;
  lastAttachmentContextSummary?: string;
  lastAttachmentLabels?: string[];
  lastSuggestedVideo?: { id: string; title?: string; channel?: string; thumbnailUrl?: string; videoId?: string };
  lastResearchDecision?: 'web' | 'context';
  lastResearchReason?: string;
  lastResearchAt?: string;
  lastResearchQuery?: string;
  researchSkipStreak?: number;
}

export type ResearchStatusPhase =
  | 'research_ready'
  | 'searching_sources'
  | 'first_useful'
  | 'synthesizing'
  | 'finalizing'
  | 'complete'
  | 'failed';

export type ResearchStatusEvent = {
  phase: ResearchStatusPhase;
  label: string;
  timestamp: string;
};

export interface EmotionalAICopilotInput {
  text: string;
  chatHistory: Message[];
  state: ConversationState;
  tutorState?: TutorState;
  studentProfile: {
    name: string;
    gradeLevel: string;
  };
  preferences: {
    preferredLanguage?: 'english' | 'swahili' | 'arabic' | 'english_sw' | 'arabic_english';
    interests?: string[];
  };
  sessionLanguageState?: SessionLanguageState;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  fileData?:
    | { kind?: 'image'; type?: string; mimeType?: string; base64: string; fileName?: string }
    | { kind: 'text'; mimeType?: string; text: string; fileName?: string; truncated?: boolean }
    | { kind: 'pdf'; mimeType?: string; type?: string; base64: string; fileName?: string }
    | Array<
        | { kind?: 'image'; type?: string; mimeType?: string; base64: string; fileName?: string }
        | { kind: 'text'; mimeType?: string; text: string; fileName?: string; truncated?: boolean }
        | { kind: 'pdf'; mimeType?: string; type?: string; base64: string; fileName?: string }
      >;
  forceWebSearch?: boolean;
  includeVideos?: boolean;
  responseMode?: 'default' | 'voice_realtime';
  examMode?: boolean;
  focusMode?: boolean;
  workspaceContext?: {
    activeDestination?: 'new_session' | 'search' | 'revision' | 'media' | 'growth' | 'exam' | 'focus';
    studyMode?: 'standard' | 'focus' | 'exam';
    surfaceKind?: 'widget' | 'fullscreen';
    surfaceProfile?: 'compact' | 'cozy' | 'comfortable' | 'expanded';
    navigationStyle?: 'progressive_compact';
    modeFlags?: {
      focus?: boolean;
      exam?: boolean;
      research?: boolean;
    };
    plusAction?: 'add_files' | 'recent_files' | 'focus_mode' | 'exam_mode' | 'web_research' | null;
    plusDrawerOpen?: boolean;
    sidebarExpanded?: boolean;
    researchModeRequested?: boolean;
    revisionCollectionId?: string | null;
    revisionItemId?: string | null;
    mediaItemId?: string | null;
    mediaFilter?: 'all' | 'audio' | 'video' | 'image' | 'document';
    growthSection?:
      | 'overview'
      | 'weak_topics'
      | 'mistake_journal'
      | 'daily_feed'
      | 'study_plans'
      | 'mastery_trends';
    chatSessionId?: string | null;
    historySearchQuery?: string;
    revisionSearchQuery?: string;
  };
  currentTitle?: string;
  memory?: {
    progress?: any[];
    mistakes?: any[];
  };
  tutorAction?: TutorActionRequest;
  onToken?: (token: string) => void;
  onStatus?: (status: ResearchStatusEvent) => void;
}

export interface EmotionalAICopilotOutput {
  processedText: string;
  videoData?: { id: string; title: string; channel?: string; thumbnail?: string };
  state: ConversationState;
  topic?: string;
  sources?: { sourceName: string; url: string }[];
  suggestedTitle?: string;
  tutorState?: TutorState;
  artifacts?: TutorArtifact[];
  assistantMetadata?: {
    tutorUi?: TutorActionUiMeta;
    presentation?: MessagePresentationMeta;
    systemNotices?: SystemNotice[];
    research?: {
      queryUsed?: string | null;
      trustSummary?: string | null;
      limitations?: string[] | null;
      notices?: Array<{ code: string; message: string; severity?: 'info' | 'warning' }> | null;
      recommendedVideos?: Array<{
        videoId: string;
        title: string;
        channelTitle?: string | null;
        thumbnailUrl?: string | null;
        transcriptAvailable?: boolean | null;
        language?: string | null;
        intent?: string | null;
        whyRecommended?: string | null;
        trustTier?: 'high' | 'medium' | 'limited' | null;
      }> | null;
      researchIntent?: string | null;
      triggerType?: string | null;
      sourceReuseId?: string | null;
      reuseHit?: boolean | null;
      confidenceState?: 'high' | 'medium' | 'low' | 'mixed' | 'insufficient' | null;
      searchCount?: number | null;
      queryPlan?: string[] | null;
      firstUsefulLatencyMs?: number | null;
      completedLatencyMs?: number | null;
      latency?: {
        startedAt?: string;
        firstUsefulAt?: string;
        completedAt?: string;
        firstUsefulLatencyMs?: number;
        completedLatencyMs?: number;
      } | null;
    };
  };
}

export type ResearchOrchestratorResult = {
  mode?: 'teaching' | 'web_research' | string;
  reply?: string;
  response?: string;
  sources?: { sourceName: string; url: string }[];
  videoData?: { id: string; title: string; channel?: string; thumbnail?: string };
  videoWhyRecommended?: string;
  videoConcepts?: string[];
  queryUsed?: string;
  queryPlan?: string[];
  searchCount?: number;
  sourceReuseId?: string;
  reuseHit?: boolean;
  confidenceState?: 'high' | 'medium' | 'low' | 'mixed' | 'insufficient';
  triggerType?: string;
  researchReason?: string;
  firstUsefulLatencyMs?: number;
  completedLatencyMs?: number;
  notices?: Array<{ code: string; message: string; severity?: 'info' | 'warning' }>;
};

export type AskPracticeToolArgs = {
  question?: string;
  correctAnswers?: string[] | string;
  topic?: string;
};

export type YoutubeSearchResult = {
  id: string;
  title?: string;
  channel?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
};
