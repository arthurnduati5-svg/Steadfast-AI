import { getMockAuthToken } from './mock-auth';
import type {
  AssessmentAnswerPayload,
  AssessmentAnswerResponse,
  AssessmentFinishResponse,
  AssessmentHintPayload,
  AssessmentHintResponse,
  AssessmentNavigatePayload,
  AssessmentNavigateResponse,
  AssessmentResultsResponse,
  AssessmentSessionResponse,
  AssessmentSessionStartRequest,
  AssessmentSessionStartResponse,
  AcademicMemoryResponse,
  ArtifactParseRequest,
  ArtifactParseResponse,
  ChatHistoryResponse,
  ChatSession,
  ChatStreamRequest,
  ConceptDependenciesResponse,
  CopilotPreferencesResponse,
  CopilotPreferencesUpdateRequest,
  CopilotPreloadResponse,
  CreateSessionResponse,
  DeleteRevisionCollectionMode,
  DeleteRevisionCollectionResponse,
  DeleteRevisionItemResponse,
  HandoffTokenResponse,
  InterventionEffectResponse,
  InterventionEffectivenessResponse,
  LatencyAckResponse,
  LatencyTurnPayload,
  LearningEffectivenessSummary,
  LearningEffectEvent,
  LearningEffectEventRecordResponse,
  LearningProfile,
  FounderTruthSummary,
  GrowthActionIntent,
  GrowthActionFunnelSummary,
  GrowthActionPayload,
  GrowthActionResponse,
  GrowthDailyFeedInteractionRequest,
  GrowthDailyFeedInteractionResponse,
  GrowthDailyFeedSnapshot,
  GrowthWorkspaceMasteryTrendsResponse,
  GrowthWorkspaceMistakeJournalResponse,
  GrowthWorkspaceOverviewResponse,
  GrowthWorkspaceStudyPlansResponse,
  GrowthWorkspaceWeakTopicsResponse,
  MasteryPathwayResponse,
  MediaAsset,
  MediaAssetKind,
  MediaCollection,
  MediaCreateCollectionRequest,
  MediaCollectionListResponse,
  MediaUpdateCollectionRequest,
  MediaAudioRecapRequest,
  MediaAudioRecapResponse,
  MediaGenerateImageRequest,
  MediaGenerateImageResponse,
  MediaInteractionAction,
  MediaStreamResponse,
  MediaVideoRecapRequest,
  MediaVideoRecapResponse,
  MetacognitiveEvent,
  MetacognitiveEventRecordResponse,
  MetacognitiveProfile,
  MetacognitivePromptResponse,
  PersistChatMessageRequest,
  PersistChatMessageResponse,
  ProductConstitutionHealth,
  PracticePadCheckStepRequest,
  PracticePadCheckStepResponse,
  ResearchModeResponse,
  VideoContextResponse,
  VideoRecommendationResponse,
  VideoRecommendationIntent,
  RevisionActionResponse,
  RevisionAudioRecapResult,
  RevisionChapterSummariesResponse,
  RevisionFlashcardDeckResponse,
  RevisionNotebookCoverGenerateRequest,
  RevisionNotebookCoverGenerateResponse,
  RevisionNotebookVisualGenerateRequest,
  RevisionNotebookVisualGenerateResponse,
  RevisionCollection,
  RevisionCollectionDetailResponse,
  RevisionCollectionsResponse,
  UpdateRevisionCollectionRequest,
  GuidedRevisionSessionProgressRequest,
  GuidedRevisionSessionProgressResult,
  GuidedRevisionSessionStartResult,
  RevisionGroupingSuggestion,
  RevisionGraphAnalytics,
  RevisionItem,
  RevisionItemBatchUpdateRequest,
  RevisionItemBatchUpdateResponse,
  RevisionModeResult,
  RevisionOverview,
  RevisionProgressOverview,
  RevisionQueue,
  RevisionReviewEventResponse,
  SafeProgressSummary,
  SaveRevisionRequest,
  SaveRevisionResponse,
  SchoolSafeReport,
  SessionDeleteResponse,
  SessionUpdateResponse,
  SafetyAlertDetailResponse,
  SafetyAlertListResponse,
  SafetyAlertStatusUpdateRequest,
  SafetyAlertStatusUpdateResponse,
  SafetyChatsResponse,
  SpeechToTextResponse,
  StudentMemoryResponse,
  StudyGoal,
  StudyPlan,
  StudyPlanGenerateRequest,
  StudyPlanGoalCreateRequest,
  StudyPlanUpdateRequest,
  TextToSpeechRequest,
  TutorInterventionSuggestion,
  TutorPolicyDecision,
  UpdateRevisionItemRequest,
  VoiceBalanceResponse,
  VoiceQuotaResponse,
  VoiceSessionStartRequest,
  VoiceSessionStartResponse,
  VoiceSessionStopRequest,
  VoiceSessionStopResponse,
  WeakTopicSignal,
  WhyThisNextExplanation,
} from './types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type AuthMode = 'mock' | 'local' | 'none';

type EndpointDoc = {
  method: HttpMethod;
  path: string;
  purpose: string;
  requestType?: string;
  responseType?: string;
  transport?: 'json' | 'sse' | 'multipart' | 'binary';
  integrationStatus?: FrontendEndpointIntegrationStatus;
  uiTouchpoints?: FrontendUiTouchpoint[];
};

export type FrontendEndpointIntegrationStatus = 'live' | 'ready_for_ui' | 'admin';

export type FrontendUiSurfaceId =
  | 'widget_embed'
  | 'app_prefetch'
  | 'study_workspace_bootstrap'
  | 'chat_session_lifecycle'
  | 'chat_streaming'
  | 'chat_artifact_upload'
  | 'history_panel'
  | 'revision_panel'
  | 'voice_concierge'
  | 'metacognition_layer'
  | 'practice_pad'
  | 'safety_console'
  | 'study_planning'
  | 'learning_intelligence';

export type FrontendUiTouchpoint = {
  surface: FrontendUiSurfaceId;
  component: string;
  trigger: string;
  notes?: string;
};

type FrontendUiSurfaceDoc = {
  label: string;
  description: string;
  integrationStatus: FrontendEndpointIntegrationStatus;
};

export type FlattenedFrontendEndpointDoc = EndpointDoc & {
  domain: string;
  key: string;
  id: string;
};

export type FrontendUiSurfaceMapEntry = FrontendUiSurfaceDoc & {
  surface: FrontendUiSurfaceId;
  endpoints: FlattenedFrontendEndpointDoc[];
};

export type FrontendComponentEndpointTouchpoint = FlattenedFrontendEndpointDoc & {
  touchpoint: FrontendUiTouchpoint;
};

export type FrontendUiComponentMapEntry = {
  component: string;
  endpoints: FrontendComponentEndpointTouchpoint[];
};

type RequestOptions = {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  authMode?: AuthMode;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type StreamRequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const FRONTEND_UI_SURFACES = {
  widget_embed: {
    label: 'Widget embed handoff',
    description: 'Initial widget authentication and embed bootstrap.',
    integrationStatus: 'live',
  },
  app_prefetch: {
    label: 'App prefetch',
    description: 'Lightweight preference warm-up before the copilot opens.',
    integrationStatus: 'live',
  },
  study_workspace_bootstrap: {
    label: 'Study workspace bootstrap',
    description: 'Workspace hydration, learner memory, and preferences needed before a session starts.',
    integrationStatus: 'live',
  },
  chat_session_lifecycle: {
    label: 'Chat session lifecycle',
    description: 'Creating, loading, editing, renaming, and deleting study sessions.',
    integrationStatus: 'live',
  },
  chat_streaming: {
    label: 'Chat streaming',
    description: 'Live tutor responses, save-to-revision actions, and per-turn telemetry.',
    integrationStatus: 'live',
  },
  chat_artifact_upload: {
    label: 'Artifact upload and parsing',
    description: 'Worksheet, image, and PDF ingestion before or during tutoring.',
    integrationStatus: 'live',
  },
  history_panel: {
    label: 'Recent Study panel',
    description: 'Search, pagination, resume, and delete actions for saved study sessions.',
    integrationStatus: 'live',
  },
  revision_panel: {
    label: 'Revision panel',
    description: 'Revision overview, list drill-down, pinning, notes, mastery, quiz, and grouping actions.',
    integrationStatus: 'live',
  },
  voice_concierge: {
    label: 'Voice concierge',
    description: 'Voice balance, metered sessions, speech-to-text, and text-to-speech.',
    integrationStatus: 'live',
  },
  metacognition_layer: {
    label: 'Metacognition layer',
    description: 'Selective reflection prompts, learner confidence signals, and support-pattern capture.',
    integrationStatus: 'live',
  },
  practice_pad: {
    label: 'Practice Pad',
    description: 'Active working space for checking steps, retrying, and getting targeted guidance.',
    integrationStatus: 'live',
  },
  safety_console: {
    label: 'Safety console',
    description: 'Admin and counselor safety review workflows.',
    integrationStatus: 'admin',
  },
  study_planning: {
    label: 'Study planning surfaces',
    description: 'Study plans, goals, progress summaries, and weak-topic guidance prepared for UI surfaces.',
    integrationStatus: 'ready_for_ui',
  },
  learning_intelligence: {
    label: 'Learning intelligence surfaces',
    description: 'Learning profile, intervention guidance, semester planning, and school-safe reporting prepared for UI surfaces.',
    integrationStatus: 'ready_for_ui',
  },
} as const satisfies Record<FrontendUiSurfaceId, FrontendUiSurfaceDoc>;

export const FRONTEND_API_ENDPOINTS = {
  auth: {
    handoffToken: {
      method: 'GET',
      path: '/api/copilot/handoff',
      purpose: 'Issue a short-lived embed handoff token for the copilot widget.',
      responseType: 'HandoffTokenResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'widget_embed',
          component: 'frontend/components/CopilotWidget.tsx',
          trigger: 'Widget mount and handoff refresh before opening the embedded copilot.',
        },
      ],
    },
  },
  chat: {
    stream: {
      method: 'POST',
      path: '/api/copilot/chat',
      purpose: 'Open the streaming tutoring response channel for the active study session.',
      requestType: 'ChatStreamRequest',
      responseType: 'ReadableStream<Response>',
      transport: 'sse',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Primary composer submit, quick actions, revision quiz continuation, and retry flows.',
        },
      ],
    },
    persistMessage: {
      method: 'POST',
      path: '/api/copilot/message',
      purpose: 'Persist a normalized chat message back into the current study session.',
      requestType: 'PersistChatMessageRequest',
      responseType: 'PersistChatMessageResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Follow-up persistence for research summaries, video recommendations, and non-streamed assistant system turns.',
        },
      ],
    },
  },
  sessions: {
    preload: {
      method: 'GET',
      path: '/api/copilot/preload',
      purpose: 'Load the current workspace bootstrap payload.',
      responseType: 'CopilotPreloadResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'study_workspace_bootstrap',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Copilot dialog open and bootstrap retry flow.',
        },
      ],
    },
    create: {
      method: 'POST',
      path: '/api/copilot/new-session',
      purpose: 'Create a new study session shell.',
      responseType: 'CreateSessionResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_session_lifecycle',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'New Study Session, fallback session creation before sending a message, and resume recovery.',
        },
      ],
    },
    load: {
      method: 'GET',
      path: '/api/copilot/session/:id',
      purpose: 'Load a single full study session.',
      responseType: 'ChatSession',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_session_lifecycle',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Continue chat, session resume, and history selection.',
        },
        {
          surface: 'history_panel',
          component: 'frontend/components/history-tab.tsx',
          trigger: 'Continue button routed through parent session loader.',
        },
      ],
    },
    updateTitle: {
      method: 'PATCH',
      path: '/api/copilot/session/:id',
      purpose: 'Persist a refined session title.',
      requestType: '{ title: string }',
      responseType: 'SessionUpdateResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_session_lifecycle',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Background title refinement after a meaningful tutor exchange.',
        },
      ],
    },
    delete: {
      method: 'POST',
      path: '/api/copilot/session/:id/delete',
      purpose: 'Delete an owned study session.',
      responseType: 'SessionDeleteResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'history_panel',
          component: 'frontend/components/history-tab.tsx',
          trigger: 'Delete action in Recent Study cards via the parent workspace handler.',
        },
      ],
    },
    editMessage: {
      method: 'POST',
      path: '/api/copilot/messages/:id/edit',
      purpose: 'Edit the latest student turn and reload the session.',
      requestType: '{ content: string }',
      responseType: 'ChatSession',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_session_lifecycle',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Student edit-and-regenerate flow for the latest editable user turn.',
        },
      ],
    },
  },
  history: {
    list: {
      method: 'GET',
      path: '/api/copilot/history',
      purpose: 'List recent study sessions with pagination and search.',
      responseType: 'ChatHistoryResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'history_panel',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Recent Study search, pagination, and initial tab population.',
        },
      ],
    },
  },
  preferences: {
    get: {
      method: 'GET',
      path: '/api/copilot/preferences',
      purpose: 'Read current copilot learning preferences.',
      responseType: 'CopilotPreferencesResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'study_workspace_bootstrap',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Workspace bootstrap and settings hydration.',
        },
        {
          surface: 'app_prefetch',
          component: 'frontend/components/CopilotPrefetch.tsx',
          trigger: 'Warm the preference cache before the main workspace opens.',
        },
      ],
    },
    update: {
      method: 'POST',
      path: '/api/copilot/preferences/update',
      purpose: 'Persist preferred language and interests.',
      requestType: 'CopilotPreferencesUpdateRequest',
      responseType: 'CopilotPreferencesResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'study_workspace_bootstrap',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Preferences dialog save flow.',
        },
      ],
    },
  },
  memory: {
    student: {
      method: 'GET',
      path: '/api/copilot/memory/student',
      purpose: 'Load learner memory used to shape tutoring replies.',
      responseType: 'StudentMemoryResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'study_workspace_bootstrap',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Workspace bootstrap before tutoring requests are sent.',
        },
      ],
    },
  },
  revision: {
    overview: {
      method: 'GET',
      path: '/api/copilot/revision',
      purpose: 'Load the Revision home payload.',
      responseType: 'RevisionOverview',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Revision tab bootstrap, refresh after save/mutation, and search reloads.',
        },
      ],
    },
    save: {
      method: 'POST',
      path: '/api/copilot/revision',
      purpose: 'Save a message, selection, or linked material into Revision.',
      requestType: 'SaveRevisionRequest',
      responseType: 'SaveRevisionResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Save-to-Revision from tutor cards, selection actions, and upload-linked saves.',
        },
      ],
    },
    collections: {
      method: 'GET',
      path: '/api/copilot/revision/collections',
      purpose: 'List owned Revision Lists and their counts.',
      responseType: 'RevisionCollectionsResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for dedicated Revision List pickers and create flows.',
          notes: 'The current panel mainly uses the overview payload, but this endpoint remains the explicit list source.',
        },
      ],
    },
    collectionDetail: {
      method: 'GET',
      path: '/api/copilot/revision/collections/:id',
      purpose: 'Load a single Revision List and its items.',
      responseType: 'RevisionCollectionDetailResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Selecting a Revision List from the Revision panel.',
        },
      ],
    },
    createCollection: {
      method: 'POST',
      path: '/api/copilot/revision/collections',
      purpose: 'Create a new Revision List.',
      requestType: '{ title: string; subject?: string; topic?: string; description?: string }',
      responseType: 'RevisionCollection',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for explicit create-list UI controls.',
        },
      ],
    },
    deleteCollection: {
      method: 'DELETE',
      path: '/api/copilot/revision/collections/:id',
      purpose: 'Delete a Revision List by dissolving notes to standalone space or removing the notes completely.',
      requestType: '{ mode?: "dissolve" | "delete_with_items" }',
      responseType: 'DeleteRevisionCollectionResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Notebook options menu actions for dissolve and destructive delete.',
        },
      ],
    },
    generateNotebookCover: {
      method: 'POST',
      path: '/api/copilot/revision/collections/:id/cover/generate',
      purpose: 'Create AI-native notebook cover art without turning the notebook into an external media asset.',
      requestType: 'RevisionNotebookCoverGenerateRequest',
      responseType: 'RevisionNotebookCoverGenerateResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Notebook identity editor cover generation.',
        },
      ],
    },
    generateChapterSummaries: {
      method: 'POST',
      path: '/api/copilot/revision/collections/:id/chapter-summaries',
      purpose: 'Generate and cache AI-native chapter summaries for large notebooks.',
      requestType: '{ force?: boolean }',
      responseType: 'RevisionChapterSummariesResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Large notebook chapter map summaries and refresh actions.',
        },
      ],
    },
    generateFlashcards: {
      method: 'POST',
      path: '/api/copilot/revision/collections/:id/flashcards',
      purpose: 'Generate AI-native notebook flashcards and cache them on the revision collection.',
      requestType: '{ force?: boolean }',
      responseType: 'RevisionFlashcardDeckResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Notebook-level study deck generation for revision.',
        },
      ],
    },
    generateNotebookVisual: {
      method: 'POST',
      path: '/api/copilot/revision/collections/:id/visuals/generate',
      purpose: 'Generate a notebook-linked internal visual explainer for revision.',
      requestType: 'RevisionNotebookVisualGenerateRequest',
      responseType: 'RevisionNotebookVisualGenerateResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Notebook visual explainer generation inside Revision.',
        },
      ],
    },
    itemDetail: {
      method: 'GET',
      path: '/api/copilot/revision/:id',
      purpose: 'Load a single Revision item.',
      responseType: 'RevisionItem',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for dedicated revision item detail surfaces.',
        },
      ],
    },
    updateItem: {
      method: 'PATCH',
      path: '/api/copilot/revision/:id',
      purpose: 'Update a Revision item note, mastery, pin state, or grouping metadata.',
      requestType: 'UpdateRevisionItemRequest',
      responseType: '{ item: RevisionItem; message?: string }',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Pin toggle, mastery updates, and student-note save/edit actions.',
        },
      ],
    },
    action: {
      method: 'POST',
      path: '/api/copilot/revision/:id/action',
      purpose: 'Run an active revision action such as Quiz me.',
      requestType: '{ actionType: "quiz" | "breakdown" | "similar_question" }',
      responseType: 'RevisionActionResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Quiz me action that re-enters Study Chat with a guided prompt.',
        },
      ],
    },
    queue: {
      method: 'GET',
      path: '/api/copilot/revision/queue',
      purpose: 'Load the prioritized revision queue.',
      responseType: 'RevisionQueue',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for due-now and continue-practising sections.',
        },
      ],
    },
    progress: {
      method: 'GET',
      path: '/api/copilot/revision/progress',
      purpose: 'Load revision progress counters used by dashboard summaries.',
      responseType: 'RevisionProgressOverview',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for revision progress header cards and mastery summaries.',
        },
      ],
    },
    graphAnalytics: {
      method: 'GET',
      path: '/api/copilot/revision/graph/analytics',
      purpose: 'Load connected NoteGraph learning analytics (open-rate, summary completion, retention proxy).',
      responseType: 'RevisionGraphAnalytics',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for backend quality monitoring and future admin analytics cards.',
        },
      ],
    },
    reviewEvent: {
      method: 'POST',
      path: '/api/copilot/revision/:id/review-event',
      purpose: 'Record a revision review or quiz outcome.',
      requestType: '{ eventType: string; outcome?: string; sessionId?: string; metadata?: Record<string, unknown> }',
      responseType: 'RevisionReviewEventResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for explicit quiz outcome tracking from the revision surface.',
        },
      ],
    },
    groupingSuggestions: {
      method: 'GET',
      path: '/api/copilot/revision/group-suggestions',
      purpose: 'Load safe grouping suggestions for saved revision items.',
      responseType: '{ suggestions: RevisionGroupingSuggestion[] }',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Suggested grouping section in the Revision panel.',
        },
      ],
    },
    applyGroupingSuggestion: {
      method: 'POST',
      path: '/api/copilot/revision/group-suggestions/:id/apply',
      purpose: 'Apply a grouping suggestion and group revision items into a list.',
      responseType: '{ collection?: RevisionCollection; items?: RevisionItem[] }',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Accept grouping suggestion action.',
        },
      ],
    },
    audioRecap: {
      method: 'POST',
      path: '/api/copilot/revision/audio-recap',
      purpose: 'Generate a short revision audio recap or text fallback.',
      requestType: '{ sourceType: "collection" | "item" | "queue"; collectionId?: string; itemId?: string }',
      responseType: 'RevisionAudioRecapResult',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for play-recap controls from lists or queue.',
        },
      ],
    },
    mode: {
      method: 'POST',
      path: '/api/copilot/revision-mode/start',
      purpose: 'Start a revision-mode tutoring session from revision evidence.',
      responseType: 'RevisionModeResult',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Prepared for Revise with Steadfast entry points.',
        },
      ],
    },
    guidedSessionStart: {
      method: 'POST',
      path: '/api/copilot/revision/guided-session/start',
      purpose: 'Start a dedicated guided revision session for one saved revision item.',
      requestType: '{ itemId?: string; collectionId?: string; sourceType?: "item" | "collection" | "queue" }',
      responseType: 'GuidedRevisionSessionStartResult',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Revise with Steadfast opens a structured guided revision session.',
        },
      ],
    },
    guidedSessionRespond: {
      method: 'POST',
      path: '/api/copilot/revision/guided-session/:sessionId/respond',
      purpose: 'Progress a guided revision step with student response or support action.',
      requestType: 'GuidedRevisionSessionProgressRequest',
      responseType: 'GuidedRevisionSessionProgressResult',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'revision_panel',
          component: 'frontend/components/revision-tab.tsx',
          trigger: 'Guided revision step progression and soft mastery updates.',
        },
      ],
    },
  },
  media: {
    videoRecap: {
      method: 'POST',
      path: '/api/copilot/media/video-recap',
      purpose: 'Generate and save a reusable video recap asset.',
      requestType: 'MediaVideoRecapRequest',
      responseType: 'MediaVideoRecapResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
    },
    audioRecap: {
      method: 'POST',
      path: '/api/copilot/media/audio-recap',
      purpose: 'Generate and save a reusable audio recap asset.',
      requestType: 'MediaAudioRecapRequest',
      responseType: 'MediaAudioRecapResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
    },
    generateImage: {
      method: 'POST',
      path: '/api/copilot/media/generate-image',
      purpose: 'Generate and save an education-safe image asset.',
      requestType: 'MediaGenerateImageRequest',
      responseType: 'MediaGenerateImageResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
    },
    listAssets: {
      method: 'GET',
      path: '/api/copilot/media/assets',
      purpose: 'List reusable media assets for media/revision surfaces.',
      responseType: '{ assets: MediaAsset[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
    },
    linkAssetToRevision: {
      method: 'POST',
      path: '/api/copilot/media/assets/:id/link-revision',
      purpose: 'Link an existing media asset to a revision item.',
      requestType: '{ revisionItemId: string }',
      responseType: '{ asset: MediaAsset }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
    },
  },
  artifacts: {
    parse: {
      method: 'POST',
      path: '/api/copilot/artifacts/parse',
      purpose: 'Extract tutor-ready artifact summaries from uploaded files.',
      requestType: 'ArtifactParseRequest',
      responseType: 'ArtifactParseResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_artifact_upload',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Image, PDF, and text upload parsing before a tutoring turn.',
        },
      ],
    },
  },
  research: {
    run: {
      method: 'POST',
      path: '/api/copilot/research',
      purpose: 'Run educational web research mode and return source-backed guidance.',
      requestType: '{ query: string; sessionId?: string; topic?: string; forceWebSearch?: boolean }',
      responseType: 'ResearchModeResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Research this action in study chat for source-backed tutoring support.',
        },
      ],
    },
    recommendVideo: {
      method: 'POST',
      path: '/api/copilot/video-recommend',
      purpose: 'Return contextual educational video recommendations with whyRecommended signals.',
      requestType:
        '{ query?: string; topic?: string; subject?: string; intent?: VideoRecommendationIntent; sessionId?: string; limit?: number }',
      responseType: 'VideoRecommendationResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Recommend video action from active tutoring context or worksheet follow-up.',
        },
      ],
    },
    videoContext: {
      method: 'GET',
      path: '/api/copilot/video/:id/context',
      purpose: 'Load transcript/context summary for a selected video and support follow-up tutoring turns.',
      responseType: 'VideoContextResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Continue from video action after selecting a recommended or active video.',
        },
      ],
    },
  },
  latency: {
    turn: {
      method: 'POST',
      path: '/api/copilot/latency/turn',
      purpose: 'Persist per-turn latency metrics.',
      requestType: 'LatencyTurnPayload',
      responseType: 'LatencyAckResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'chat_streaming',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Turn completion telemetry after tutor responses resolve.',
        },
      ],
    },
  },
  voice: {
    balance: {
      method: 'GET',
      path: '/api/copilot/voice/balance',
      purpose: 'Read the remaining voice balance.',
      responseType: 'VoiceBalanceResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Voice availability checks before starting or resuming speech mode.',
        },
      ],
    },
    startSession: {
      method: 'POST',
      path: '/api/copilot/voice/session/start',
      purpose: 'Open a metered voice session.',
      requestType: 'VoiceSessionStartRequest',
      responseType: 'VoiceSessionStartResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Voice mode start and voice resume flows.',
        },
      ],
    },
    stopSession: {
      method: 'POST',
      path: '/api/copilot/voice/session/stop',
      purpose: 'Close the current voice session.',
      requestType: 'VoiceSessionStopRequest',
      responseType: 'VoiceSessionStopResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Voice mode shutdown, timeout, and cleanup flows.',
        },
      ],
    },
    quota: {
      method: 'GET',
      path: '/api/copilot/voice/quota',
      purpose: 'Read daily voice quota usage details.',
      responseType: 'VoiceQuotaResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Prepared for explicit quota summaries in the voice UI.',
        },
      ],
    },
    stt: {
      method: 'POST',
      path: '/voice/stt',
      purpose: 'Proxy spoken audio to speech-to-text.',
      requestType: 'FormData',
      responseType: 'SpeechToTextResponse',
      transport: 'multipart',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Fallback speech-to-text and partial retry flows.',
        },
      ],
    },
    tts: {
      method: 'POST',
      path: '/voice/tts',
      purpose: 'Proxy text-to-speech synthesis.',
      requestType: 'TextToSpeechRequest',
      responseType: 'audio/mpeg Response',
      transport: 'binary',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'voice_concierge',
          component: 'AI/useVoiceController.ts',
          trigger: 'Tutor text-to-speech playback requests.',
        },
      ],
    },
  },
  metacognition: {
    recordEvent: {
      method: 'POST',
      path: '/api/copilot/metacognition/event',
      purpose: 'Persist a lightweight learner reflection event that can shape later tutoring.',
      requestType: 'Partial<MetacognitiveEvent>',
      responseType: 'MetacognitiveEventRecordResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'metacognition_layer',
          component: 'frontend/components/chat-tab.tsx',
          trigger: 'Student taps a quick reflection choice after a tutor reply.',
        },
      ],
    },
    profile: {
      method: 'GET',
      path: '/api/copilot/metacognition/profile',
      purpose: 'Load the current learner metacognition profile summary.',
      responseType: 'MetacognitiveProfile',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'metacognition_layer',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Workspace load and post-reflection refresh for learner-aware tutoring.',
        },
      ],
    },
    prompt: {
      method: 'GET',
      path: '/api/copilot/metacognition/prompt',
      purpose: 'Fetch a context-aware reflection prompt for explicit reflection surfaces.',
      responseType: 'MetacognitivePromptResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'practice_pad',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Opening Practice Pad fetches a context-aware reflection prompt when the current tutor card did not already supply one.',
        },
      ],
    },
  },
  practicePad: {
    checkStep: {
      method: 'POST',
      path: '/api/copilot/practice-pad/check-step',
      purpose: 'Analyse the learner’s current working step and return guided feedback plus the next move.',
      requestType: 'PracticePadCheckStepRequest',
      responseType: 'PracticePadCheckStepResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'practice_pad',
          component: 'frontend/components/copilot/PracticePad.tsx',
          trigger: 'Student clicks Submit working after writing their current working.',
        },
      ],
    },
  },
  safety: {
    alerts: {
      method: 'GET',
      path: '/api/copilot/safety/alerts',
      purpose: 'List safety alerts for safety operations screens.',
      responseType: 'SafetyAlertListResponse',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'safety_console',
          component: 'frontend/app/safety/page.tsx',
          trigger: 'Safety operations alert table load and filtering.',
        },
      ],
    },
    alertDetail: {
      method: 'GET',
      path: '/api/copilot/safety/alerts/:id',
      purpose: 'Load a single safety alert with contextual messages.',
      responseType: 'SafetyAlertDetailResponse',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'safety_console',
          component: 'frontend/app/safety/page.tsx',
          trigger: 'Open alert detail and contextual message review.',
        },
      ],
    },
    alertStatus: {
      method: 'PATCH',
      path: '/api/copilot/safety/alerts/:id/status',
      purpose: 'Update the workflow state of a safety alert.',
      requestType: 'SafetyAlertStatusUpdateRequest',
      responseType: 'SafetyAlertStatusUpdateResponse',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'safety_console',
          component: 'frontend/app/safety/page.tsx',
          trigger: 'Mark reviewing, resolve, or dismiss actions.',
        },
      ],
    },
    chats: {
      method: 'GET',
      path: '/api/copilot/safety/chats',
      purpose: 'Load filtered session chat context for safety review.',
      responseType: 'SafetyChatsResponse',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'safety_console',
          component: 'frontend/app/safety/page.tsx',
          trigger: 'Admin chat viewer for session-level safety review.',
        },
      ],
    },
  },
  study: {
    createPlan: {
      method: 'POST',
      path: '/api/copilot/study-plans',
      purpose: 'Create a study plan with linked goals.',
      requestType: 'Record<string, unknown>',
      responseType: '{ plan: StudyPlan; goals: StudyGoal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for study plan creation surfaces.',
        },
      ],
    },
    getPlans: {
      method: 'GET',
      path: '/api/copilot/study-plans',
      purpose: 'List study plans by scope.',
      responseType: '{ plans: StudyPlan[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for study plan dashboards and list views.',
        },
      ],
    },
    getPlan: {
      method: 'GET',
      path: '/api/copilot/study-plans/:id',
      purpose: 'Load one study plan with its goals.',
      responseType: '{ plan: StudyPlan; goals: StudyGoal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for study plan detail views.',
        },
      ],
    },
    getGoals: {
      method: 'GET',
      path: '/api/copilot/study-goals',
      purpose: 'List study goals for the current learner.',
      responseType: '{ goals: StudyGoal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for weekly goal surfaces.',
        },
      ],
    },
    updateGoal: {
      method: 'PATCH',
      path: '/api/copilot/study-goals/:id',
      purpose: 'Update one study goal.',
      requestType: 'Record<string, unknown>',
      responseType: '{ goal: StudyGoal }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for goal progress controls.',
        },
      ],
    },
    getProgressSummary: {
      method: 'GET',
      path: '/api/copilot/progress-summary',
      purpose: 'Load a safe progress summary for a parent or teacher audience.',
      responseType: 'SafeProgressSummary',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for parent/teacher progress summaries.',
        },
      ],
    },
    getWeakTopics: {
      method: 'GET',
      path: '/api/copilot/weak-topics',
      purpose: 'List weak-topic signals for focused study planning.',
      responseType: '{ topics: WeakTopicSignal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'study_planning',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for weak-topic cards and plan suggestions.',
        },
      ],
    },
  },
  intelligence: {
    learningProfile: {
      method: 'GET',
      path: '/api/copilot/learning-profile',
      purpose: 'Load the long-term learning profile for the current learner.',
      responseType: 'LearningProfile',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for learner profile and adaptive guidance surfaces.',
        },
      ],
    },
    academicMemory: {
      method: 'GET',
      path: '/api/copilot/academic-memory',
      purpose: 'Load evidence-based academic memory entries.',
      responseType: 'AcademicMemoryResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for long-term academic memory views.',
        },
      ],
    },
    conceptDependencies: {
      method: 'GET',
      path: '/api/copilot/concept-dependencies',
      purpose: 'Load prerequisite and dependency relationships for a topic.',
      responseType: 'ConceptDependenciesResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for dependency-aware tutoring and study planning.',
        },
      ],
    },
    interventionSuggestions: {
      method: 'GET',
      path: '/api/copilot/intervention-suggestions',
      purpose: 'Load tutor intervention suggestions from learning evidence.',
      responseType: '{ suggestions: TutorInterventionSuggestion[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for adaptive support recommendation surfaces.',
        },
      ],
    },
    tutorPolicy: {
      method: 'GET',
      path: '/api/copilot/tutor-policy',
      purpose: 'Load the current tutor policy decision for the learner context.',
      responseType: 'TutorPolicyDecision',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for explainable next-action decision surfaces.',
        },
      ],
    },
    whyThisNext: {
      method: 'GET',
      path: '/api/copilot/why-this-next',
      purpose: 'Load a student-friendly explanation for the next recommended step.',
      responseType: 'WhyThisNextExplanation',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for next-step explanation surfaces.',
        },
      ],
    },
    interventionEffect: {
      method: 'POST',
      path: '/api/copilot/intervention-effect',
      purpose: 'Record intervention effectiveness evidence.',
      requestType: 'Record<string, unknown>',
      responseType: 'InterventionEffectResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for support-method effectiveness tracking.',
        },
      ],
    },
    interventionEffectiveness: {
      method: 'GET',
      path: '/api/copilot/intervention-effectiveness',
      purpose: 'Load effectiveness summaries for tutor interventions.',
      responseType: 'InterventionEffectivenessResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for intervention analytics surfaces.',
        },
      ],
    },
    createSemesterPlan: {
      method: 'POST',
      path: '/api/copilot/semester-plan',
      purpose: 'Create an adaptive semester plan.',
      requestType: 'Record<string, unknown>',
      responseType: '{ plan: StudyPlan; goals: StudyGoal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for longer-horizon planning surfaces.',
        },
      ],
    },
    semesterPlans: {
      method: 'GET',
      path: '/api/copilot/semester-plans',
      purpose: 'List saved semester plans.',
      responseType: '{ plans: StudyPlan[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for semester planning dashboards.',
        },
      ],
    },
    semesterPlanDetail: {
      method: 'GET',
      path: '/api/copilot/semester-plans/:id',
      purpose: 'Load one semester plan with its goals.',
      responseType: '{ plan: StudyPlan; goals: StudyGoal[] }',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for semester plan detail views.',
        },
      ],
    },
    masteryPathway: {
      method: 'GET',
      path: '/api/copilot/mastery-pathway',
      purpose: 'Load the subject mastery pathway for a topic.',
      responseType: 'MasteryPathwayResponse',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for mastery pathway guidance surfaces.',
        },
      ],
    },
    schoolSafeReport: {
      method: 'GET',
      path: '/api/copilot/school-safe-report',
      purpose: 'Load a privacy-aware school-safe report.',
      responseType: 'SchoolSafeReport',
      transport: 'json',
      integrationStatus: 'ready_for_ui',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for school-safe reporting surfaces.',
        },
      ],
    },
  },
  quality: {
    learningEffectEvent: {
      method: 'POST',
      path: '/api/copilot/learning-effect-event',
      purpose: 'Record one educational effectiveness event for quality analytics.',
      requestType: 'Partial<LearningEffectEvent> & { eventType: string }',
      responseType: 'LearningEffectEventRecordResponse',
      transport: 'json',
      integrationStatus: 'live',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/components/steadfast-copilot.tsx',
          trigger: 'Live instrumentation from tutoring, revision, practice, research, video, and voice flows.',
        },
      ],
    },
    effectivenessSummary: {
      method: 'GET',
      path: '/api/copilot/effectiveness-summary',
      purpose: 'Load aggregated educational effectiveness signals.',
      responseType: 'LearningEffectivenessSummary',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for founder/ops learning-effectiveness surfaces.',
        },
      ],
    },
    constitutionHealth: {
      method: 'GET',
      path: '/api/copilot/constitution-health',
      purpose: 'Load product constitution health drift signals.',
      responseType: 'ProductConstitutionHealth',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for constitution health and product drift monitoring surfaces.',
        },
      ],
    },
    founderTruth: {
      method: 'GET',
      path: '/api/copilot/founder-truth',
      purpose: 'Load concise founder-truth strategic summary from quality signals.',
      responseType: 'FounderTruthSummary',
      transport: 'json',
      integrationStatus: 'admin',
      uiTouchpoints: [
        {
          surface: 'learning_intelligence',
          component: 'frontend/lib/api.ts',
          trigger: 'Prepared for founder truth dashboard payload consumption.',
        },
      ],
    },
  },
} as const satisfies Record<string, Record<string, EndpointDoc>>;

function flattenEndpointRegistry(
  registry: Record<string, Record<string, EndpointDoc>>
): FlattenedFrontendEndpointDoc[] {
  return Object.entries(registry).flatMap(([domain, entries]) =>
    Object.entries(entries).map(([key, doc]) => ({
      ...doc,
      domain,
      key,
      id: `${domain}.${key}`,
    }))
  );
}

export const FRONTEND_API_ENDPOINT_CATALOG = flattenEndpointRegistry(FRONTEND_API_ENDPOINTS);

export const FRONTEND_UI_ENDPOINT_MAP = Object.fromEntries(
  Object.entries(FRONTEND_UI_SURFACES).map(([surface, meta]) => [
    surface,
    {
      surface: surface as FrontendUiSurfaceId,
      ...meta,
      endpoints: FRONTEND_API_ENDPOINT_CATALOG.filter((endpoint) =>
        endpoint.uiTouchpoints?.some((touchpoint) => touchpoint.surface === surface)
      ),
    },
  ])
) as Record<FrontendUiSurfaceId, FrontendUiSurfaceMapEntry>;

export const FRONTEND_COMPONENT_ENDPOINT_MAP = (() => {
  const entries = new Map<string, FrontendComponentEndpointTouchpoint[]>();

  for (const endpoint of FRONTEND_API_ENDPOINT_CATALOG) {
    for (const touchpoint of endpoint.uiTouchpoints || []) {
      const current = entries.get(touchpoint.component) || [];
      current.push({
        ...endpoint,
        touchpoint,
      });
      entries.set(touchpoint.component, current);
    }
  }

  return Object.fromEntries(
    [...entries.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([component, endpoints]) => [
        component,
        {
          component,
          endpoints: endpoints.sort((left, right) => left.id.localeCompare(right.id)),
        },
      ])
  ) as Record<string, FrontendUiComponentMapEntry>;
})();

const JSON_CONTENT_TYPE = 'application/json';

function readStoredBrowserToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token') ||
    ''
  ).trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function resolveRequestCredentials(endpoint: string): RequestCredentials {
  if (typeof window === 'undefined') return 'include';
  try {
    const resolved = new URL(endpoint, window.location.origin);
    return resolved.origin === window.location.origin ? 'include' : 'omit';
  } catch {
    return 'include';
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes(JSON_CONTENT_TYPE)) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => '');
}

async function resolveAuthorizationHeader(authMode: AuthMode, forceRefresh = false): Promise<string> {
  if (authMode === 'none') return '';
  if (authMode === 'local') {
    const token = readStoredBrowserToken();
    return token ? `Bearer ${token}` : '';
  }
  const token = await getMockAuthToken(forceRefresh ? { forceRefresh: true } : undefined);
  return token ? `Bearer ${token}` : '';
}

function serializeBody(body: unknown, headers: Record<string, string>): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (typeof body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || JSON_CONTENT_TYPE;
    return headers['Content-Type'] === JSON_CONTENT_TYPE ? JSON.stringify(body) : body;
  }
  if (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return body as BodyInit;
  }
  if (ArrayBuffer.isView(body)) {
    return body as unknown as BodyInit;
  }
  headers['Content-Type'] = headers['Content-Type'] || JSON_CONTENT_TYPE;
  return JSON.stringify(body);
}

function withTimeout(signal?: AbortSignal, timeoutMs?: number) {
  if (!timeoutMs) {
    return {
      signal,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const relayAbort = () => controller.abort();
  signal?.addEventListener('abort', relayAbort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', relayAbort);
    },
  };
}

async function performRequest(options: RequestOptions): Promise<Response> {
  const authMode = options.authMode ?? 'mock';
  const baseHeaders = { ...(options.headers || {}) };
  const body = serializeBody(options.body, baseHeaders);
  const timeout = withTimeout(options.signal, options.timeoutMs);

  const makeRequest = async (forceRefresh = false) => {
    const authHeader = await resolveAuthorizationHeader(authMode, forceRefresh);
    const headers: Record<string, string> = { ...baseHeaders };
    if (authHeader) headers.Authorization = authHeader;

    return fetch(options.endpoint, {
      method: options.method,
      headers,
      body,
      credentials: resolveRequestCredentials(options.endpoint),
      cache: 'no-store',
      signal: timeout.signal,
    });
  };

  try {
    let response = await makeRequest();
    if (response.status === 401 && authMode === 'mock') {
      response = await makeRequest(true);
    }
    return response;
  } finally {
    timeout.cleanup();
  }
}

function normalizeApiErrorMessage(payload: unknown): string {
  const fallback = 'Something went wrong while loading your study workspace. Please try again.';
  const rawMessage =
    isPlainObject(payload) && typeof payload.message === 'string'
      ? payload.message.trim()
      : '';
  if (!rawMessage) return fallback;
  if (/internal server error/i.test(rawMessage)) return fallback;
  if (/backend/i.test(rawMessage)) return fallback;
  if (/request failed/i.test(rawMessage)) return fallback;
  if (/http error/i.test(rawMessage)) return fallback;
  return rawMessage;
}

async function requestJson<T>(options: RequestOptions): Promise<T> {
  const response = await performRequest(options);
  const payload = await parseResponse(response);
  if (!response.ok) {
    const message = normalizeApiErrorMessage(payload);
    throw new ApiError(response.status, message, payload);
  }
  return payload as T;
}

async function requestResponse(options: RequestOptions): Promise<Response> {
  const response = await performRequest(options);
  if (!response.ok) {
    const payload = await parseResponse(response);
    const message = normalizeApiErrorMessage(payload);
    throw new ApiError(response.status, message, payload);
  }
  return response;
}

const authApi = {
  /**
   * Fetches the short-lived handoff token used by the embedded widget bridge.
   * Endpoint: `GET /api/copilot/handoff`
   */
  fetchHandoffToken(): Promise<HandoffTokenResponse> {
    return requestJson<HandoffTokenResponse>({
      method: 'GET',
      endpoint: '/api/copilot/handoff',
      authMode: 'local',
    });
  },
};

const chatApi = {
  /**
   * Opens the streamed chat response channel while leaving SSE parsing in the caller.
   * Endpoint: `POST /api/copilot/chat`
   */
  openStream(payload: ChatStreamRequest, options?: StreamRequestOptions): Promise<Response> {
    return requestResponse({
      method: 'POST',
      endpoint: '/api/copilot/chat',
      body: payload,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  },

  /**
   * Persists a normalized message into the active study session.
   * Endpoint: `POST /api/copilot/message`
   */
  persistMessage(payload: PersistChatMessageRequest): Promise<PersistChatMessageResponse> {
    return requestJson<PersistChatMessageResponse>({
      method: 'POST',
      endpoint: '/api/copilot/message',
      body: payload,
    });
  },
};

const sessionsApi = {
  /**
   * Loads the bootstrap payload for the current workspace.
   * Endpoint: `GET /api/copilot/preload`
   */
  preload(): Promise<CopilotPreloadResponse> {
    return requestJson<CopilotPreloadResponse>({
      method: 'GET',
      endpoint: '/api/copilot/preload',
    });
  },

  /**
   * Creates a new study session shell.
   * Endpoint: `POST /api/copilot/new-session`
   */
  create(): Promise<CreateSessionResponse> {
    return requestJson<CreateSessionResponse>({
      method: 'POST',
      endpoint: '/api/copilot/new-session',
      body: {},
    });
  },

  /**
   * Loads a single study session with messages and tutor state.
   * Endpoint: `GET /api/copilot/session/:id`
   */
  load(sessionId: string): Promise<ChatSession> {
    return requestJson<ChatSession>({
      method: 'GET',
      endpoint: `/api/copilot/session/${encodeURIComponent(sessionId)}`,
    });
  },

  /**
   * Persists a refined title for an owned study session.
   * Endpoint: `PATCH /api/copilot/session/:id`
   */
  updateTitle(sessionId: string, title: string): Promise<SessionUpdateResponse> {
    return requestJson<SessionUpdateResponse>({
      method: 'PATCH',
      endpoint: `/api/copilot/session/${encodeURIComponent(sessionId)}`,
      body: { title },
    });
  },

  /**
   * Deletes an owned study session.
   * Endpoint: `POST /api/copilot/session/:id/delete`
   */
  delete(sessionId: string): Promise<SessionDeleteResponse> {
    return requestJson<SessionDeleteResponse>({
      method: 'POST',
      endpoint: `/api/copilot/session/${encodeURIComponent(sessionId)}/delete`,
      body: {},
    });
  },

  /**
   * Edits the latest student-authored message turn and reloads the normalized session.
   * Endpoint: `POST /api/copilot/messages/:id/edit`
   */
  editMessage(messageId: string, content: string): Promise<ChatSession> {
    return requestJson<ChatSession>({
      method: 'POST',
      endpoint: `/api/copilot/messages/${encodeURIComponent(messageId)}/edit`,
      body: { content },
    });
  },
};

const historyApi = {
  /**
   * Lists recent study sessions with pagination and optional search.
   * Endpoint: `GET /api/copilot/history`
   */
  list(params?: { page?: number; limit?: number; search?: string }): Promise<ChatHistoryResponse> {
    return requestJson<ChatHistoryResponse>({
      method: 'GET',
      endpoint: `/api/copilot/history${toQueryString(params)}`,
    });
  },
};

const preferencesApi = {
  /**
   * Loads persisted copilot learning preferences.
   * Endpoint: `GET /api/copilot/preferences`
   */
  get(): Promise<CopilotPreferencesResponse> {
    return requestJson<CopilotPreferencesResponse>({
      method: 'GET',
      endpoint: '/api/copilot/preferences',
    });
  },

  /**
   * Updates persisted copilot learning preferences.
   * Endpoint: `POST /api/copilot/preferences/update`
   */
  update(payload: CopilotPreferencesUpdateRequest): Promise<CopilotPreferencesResponse> {
    return requestJson<CopilotPreferencesResponse>({
      method: 'POST',
      endpoint: '/api/copilot/preferences/update',
      body: payload,
    });
  },
};

const memoryApi = {
  /**
   * Loads lightweight student memory used to shape tutoring replies.
   * Endpoint: `GET /api/copilot/memory/student`
   */
  getStudent(): Promise<StudentMemoryResponse> {
    return requestJson<StudentMemoryResponse>({
      method: 'GET',
      endpoint: '/api/copilot/memory/student',
    });
  },
};

const revisionApi = {
  /**
   * Loads the Revision home payload.
   * Endpoint: `GET /api/copilot/revision`
   */
  getOverview(params?: { search?: string; limit?: number }): Promise<RevisionOverview> {
    return requestJson<RevisionOverview>({
      method: 'GET',
      endpoint: `/api/copilot/revision${toQueryString(params)}`,
    });
  },

  /**
   * Saves a message, selection, or linked material into Revision as a structured study object.
   * Endpoint: `POST /api/copilot/revision`
   */
  save(payload: SaveRevisionRequest): Promise<SaveRevisionResponse> {
    return requestJson<SaveRevisionResponse>({
      method: 'POST',
      endpoint: '/api/copilot/revision',
      body: payload,
    });
  },

  /**
   * Lists owned Revision Lists and their counts.
   * Endpoint: `GET /api/copilot/revision/collections`
   */
  getCollections(params?: { search?: string; limit?: number }): Promise<RevisionCollectionsResponse> {
    return requestJson<RevisionCollectionsResponse>({
      method: 'GET',
      endpoint: `/api/copilot/revision/collections${toQueryString(params)}`,
    });
  },

  /**
   * Creates a new Revision List.
   * Endpoint: `POST /api/copilot/revision/collections`
   */
  createCollection(payload: {
    title: string;
    subject?: string | null;
    topic?: string | null;
    description?: string | null;
  }): Promise<RevisionCollection> {
    return requestJson<RevisionCollection>({
      method: 'POST',
      endpoint: '/api/copilot/revision/collections',
      body: payload,
    });
  },

  /**
   * Loads a single Revision List with its items.
   * Endpoint: `GET /api/copilot/revision/collections/:id`
   */
  getCollection(collectionId: string, params?: { search?: string }): Promise<RevisionCollectionDetailResponse> {
    return requestJson<RevisionCollectionDetailResponse>({
      method: 'GET',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}${toQueryString(params)}`,
    });
  },

  /**
   * Updates a Revision notebook.
   * Endpoint: `PATCH /api/copilot/revision/collections/:id`
   */
  updateCollection(collectionId: string, payload: UpdateRevisionCollectionRequest): Promise<RevisionCollection> {
    return requestJson<RevisionCollection>({
      method: 'PATCH',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}`,
      body: payload,
    });
  },

  /**
   * Deletes a Revision notebook. Default behavior dissolves the notebook and keeps notes.
   * Endpoint: `DELETE /api/copilot/revision/collections/:id`
   */
  deleteCollection(
    collectionId: string,
    mode: DeleteRevisionCollectionMode = 'dissolve'
  ): Promise<DeleteRevisionCollectionResponse> {
    return requestJson<DeleteRevisionCollectionResponse>({
      method: 'DELETE',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}${toQueryString({ mode })}`,
    });
  },

  /**
   * Generates AI-native notebook cover art for the selected revision notebook.
   * Endpoint: `POST /api/copilot/revision/collections/:id/cover/generate`
   */
  generateNotebookCover(
    collectionId: string,
    payload: RevisionNotebookCoverGenerateRequest
  ): Promise<RevisionNotebookCoverGenerateResponse> {
    return requestJson<RevisionNotebookCoverGenerateResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}/cover/generate`,
      body: payload,
    });
  },

  /**
   * Generates AI chapter summaries for large revision notebooks and reuses cached summaries when possible.
   * Endpoint: `POST /api/copilot/revision/collections/:id/chapter-summaries`
   */
  generateChapterSummaries(
    collectionId: string,
    payload?: { force?: boolean }
  ): Promise<RevisionChapterSummariesResponse> {
    return requestJson<RevisionChapterSummariesResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}/chapter-summaries`,
      body: payload,
    });
  },

  /**
   * Generates a flashcard deck for a revision notebook.
   * Endpoint: `POST /api/copilot/revision/collections/:id/flashcards`
   */
  generateFlashcards(
    collectionId: string,
    payload?: { force?: boolean; chapterId?: string | null }
  ): Promise<RevisionFlashcardDeckResponse> {
    return requestJson<RevisionFlashcardDeckResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}/flashcards`,
      body: payload,
    });
  },

  /**
   * Generates an internal visual explainer linked to a revision notebook.
   * Endpoint: `POST /api/copilot/revision/collections/:id/visuals/generate`
   */
  generateNotebookVisual(
    collectionId: string,
    payload?: RevisionNotebookVisualGenerateRequest
  ): Promise<RevisionNotebookVisualGenerateResponse> {
    return requestJson<RevisionNotebookVisualGenerateResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/collections/${encodeURIComponent(collectionId)}/visuals/generate`,
      body: payload,
    });
  },

  /**
   * Loads a single Revision item.
   * Endpoint: `GET /api/copilot/revision/:id`
   */
  getItem(itemId: string): Promise<RevisionItem> {
    return requestJson<RevisionItem>({
      method: 'GET',
      endpoint: `/api/copilot/revision/${encodeURIComponent(itemId)}`,
    });
  },

  /**
   * Updates a Revision item.
   * Endpoint: `PATCH /api/copilot/revision/:id`
   */
  updateItem(itemId: string, payload: UpdateRevisionItemRequest): Promise<{ item: RevisionItem; message?: string }> {
    return requestJson<{ item: RevisionItem; message?: string }>({
      method: 'PATCH',
      endpoint: `/api/copilot/revision/${encodeURIComponent(itemId)}`,
      body: payload,
    });
  },

  /**
   * Updates multiple Revision items in one request.
   * Endpoint: `PATCH /api/copilot/revision/items/batch`
   */
  updateItemsBatch(payload: RevisionItemBatchUpdateRequest): Promise<RevisionItemBatchUpdateResponse> {
    return requestJson<RevisionItemBatchUpdateResponse>({
      method: 'PATCH',
      endpoint: '/api/copilot/revision/items/batch',
      body: payload,
    });
  },

  /**
   * Deletes a Revision item.
   * Endpoint: `DELETE /api/copilot/revision/:id`
   */
  deleteItem(itemId: string): Promise<DeleteRevisionItemResponse> {
    return requestJson<DeleteRevisionItemResponse>({
      method: 'DELETE',
      endpoint: `/api/copilot/revision/${encodeURIComponent(itemId)}`,
    });
  },

  /**
   * Runs an active revision action such as Quiz me.
   * Endpoint: `POST /api/copilot/revision/:id/action`
   */
  runAction(itemId: string, actionType: 'quiz' | 'breakdown' | 'similar_question'): Promise<RevisionActionResponse> {
    return requestJson<RevisionActionResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/${encodeURIComponent(itemId)}/action`,
      body: { actionType },
    });
  },

  /**
   * Loads the prioritized revision queue.
   * Endpoint: `GET /api/copilot/revision/queue`
   */
  getQueue(limit?: number): Promise<RevisionQueue> {
    return requestJson<RevisionQueue>({
      method: 'GET',
      endpoint: `/api/copilot/revision/queue${toQueryString({ limit })}`,
    });
  },

  /**
   * Loads revision progress counters for the current learner.
   * Endpoint: `GET /api/copilot/revision/progress`
   */
  getProgress(): Promise<RevisionProgressOverview> {
    return requestJson<RevisionProgressOverview>({
      method: 'GET',
      endpoint: '/api/copilot/revision/progress',
    });
  },

  /**
   * Loads connected NoteGraph analytics used for quality and learning monitoring.
   * Endpoint: `GET /api/copilot/revision/graph/analytics`
   */
  getGraphAnalytics(days?: number): Promise<RevisionGraphAnalytics> {
    return requestJson<RevisionGraphAnalytics>({
      method: 'GET',
      endpoint: `/api/copilot/revision/graph/analytics${toQueryString({ days })}`,
    });
  },

  /**
   * Records a revision review event and returns the updated item.
   * Endpoint: `POST /api/copilot/revision/:id/review-event`
   */
  recordReviewEvent(
    itemId: string,
    payload: {
      eventType: string;
      outcome?: string | null;
      sessionId?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<RevisionReviewEventResponse> {
    return requestJson<RevisionReviewEventResponse>({
      method: 'POST',
      endpoint: `/api/copilot/revision/${encodeURIComponent(itemId)}/review-event`,
      body: payload,
    });
  },

  /**
   * Loads safe grouping suggestions for saved revision items.
   * Endpoint: `GET /api/copilot/revision/group-suggestions`
   */
  getGroupingSuggestions(): Promise<{ suggestions: RevisionGroupingSuggestion[] }> {
    return requestJson<{ suggestions: RevisionGroupingSuggestion[] }>({
      method: 'GET',
      endpoint: '/api/copilot/revision/group-suggestions',
    });
  },

  /**
   * Applies a grouping suggestion.
   * Endpoint: `POST /api/copilot/revision/group-suggestions/:id/apply`
   */
  applyGroupingSuggestion(suggestionId: string): Promise<{ collection?: RevisionCollection; items?: RevisionItem[] }> {
    return requestJson<{ collection?: RevisionCollection; items?: RevisionItem[] }>({
      method: 'POST',
      endpoint: `/api/copilot/revision/group-suggestions/${encodeURIComponent(suggestionId)}/apply`,
      body: {},
    });
  },

  /**
   * Generates a revision audio recap or text fallback.
   * Endpoint: `POST /api/copilot/revision/audio-recap`
   */
  generateAudioRecap(payload: {
    sourceType: 'collection' | 'item' | 'queue';
    collectionId?: string;
    itemId?: string;
  }): Promise<RevisionAudioRecapResult> {
    return requestJson<RevisionAudioRecapResult>({
      method: 'POST',
      endpoint: '/api/copilot/revision/audio-recap',
      body: payload,
    });
  },

  /**
   * Starts a revision-mode tutoring session.
   * Endpoint: `POST /api/copilot/revision-mode/start`
   */
  startMode(payload: Record<string, unknown>): Promise<RevisionModeResult> {
    return requestJson<RevisionModeResult>({
      method: 'POST',
      endpoint: '/api/copilot/revision-mode/start',
      body: payload,
    });
  },

  /**
   * Starts a dedicated guided revision session from one revision item.
   * Endpoint: `POST /api/copilot/revision/guided-session/start`
   */
  startGuidedSession(payload: {
    itemId?: string;
    collectionId?: string;
    sourceType?: 'item' | 'collection' | 'queue';
    examFocus?: boolean;
  }): Promise<GuidedRevisionSessionStartResult> {
    return requestJson<GuidedRevisionSessionStartResult>({
      method: 'POST',
      endpoint: '/api/copilot/revision/guided-session/start',
      body: payload,
    });
  },

  /**
   * Continues a guided revision session by submitting a step response.
   * Endpoint: `POST /api/copilot/revision/guided-session/:sessionId/respond`
   */
  respondGuidedSession(
    sessionId: string,
    payload: GuidedRevisionSessionProgressRequest
  ): Promise<GuidedRevisionSessionProgressResult> {
    return requestJson<GuidedRevisionSessionProgressResult>({
      method: 'POST',
      endpoint: `/api/copilot/revision/guided-session/${encodeURIComponent(sessionId)}/respond`,
      body: payload,
    });
  },
};

const mediaApi = {
  generateVideoRecap(payload: MediaVideoRecapRequest): Promise<MediaVideoRecapResponse> {
    return requestJson<MediaVideoRecapResponse>({
      method: 'POST',
      endpoint: '/api/copilot/media/video-recap',
      body: payload,
    });
  },

  generateAudioRecap(payload: MediaAudioRecapRequest): Promise<MediaAudioRecapResponse> {
    return requestJson<MediaAudioRecapResponse>({
      method: 'POST',
      endpoint: '/api/copilot/media/audio-recap',
      body: payload,
    });
  },

  generateImage(payload: MediaGenerateImageRequest): Promise<MediaGenerateImageResponse> {
    return requestJson<MediaGenerateImageResponse>({
      method: 'POST',
      endpoint: '/api/copilot/media/generate-image',
      body: payload,
    });
  },

  listAssets(params?: {
    assetKind?: MediaAssetKind | 'all';
    subject?: string;
    topic?: string;
    subtopic?: string;
    linkedWeakTopicId?: string;
    collectionId?: string;
    sessionId?: string;
    revisionItemId?: string;
    onlySaved?: boolean;
    onlyCompleted?: boolean;
    onlyHelpful?: boolean;
    sortBy?: 'recent' | 'useful' | 'recommended';
    query?: string;
    limit?: number;
  }): Promise<{ assets: MediaAsset[] }> {
    return requestJson<{ assets: MediaAsset[] }>({
      method: 'GET',
      endpoint: `/api/copilot/media/assets${toQueryString(params)}`,
    });
  },

  linkAssetToRevision(assetId: string, revisionItemId: string): Promise<{ asset: MediaAsset }> {
    return requestJson<{ asset: MediaAsset }>({
      method: 'POST',
      endpoint: `/api/copilot/media/assets/${encodeURIComponent(assetId)}/link-revision`,
      body: { revisionItemId },
    });
  },

  listStream(params?: {
    activeTopic?: string;
    weakTopics?: string[] | string;
    preferredKind?: 'audio' | 'video' | 'image' | 'explainer' | 'document' | 'collection';
    examMode?: boolean;
    focusMode?: boolean;
    streamMode?: 'study' | 'creative';
    preferredRecapType?: 'audio' | 'video' | 'visual' | 'mixed';
    shortFormSupport?: 'concept_intuition' | 'worked_example' | 'quick_recap';
    allowExternalCreativeSuggestions?: boolean;
    learningNeed?: 'concept_intuition' | 'worked_example' | 'quick_recap' | string;
    schoolLevel?: string;
    language?: string;
    subject?: string;
    topic?: string;
    sessionId?: string;
    revisionItemId?: string;
    sourceMessageId?: string;
    sortBy?: 'recent' | 'useful' | 'recommended';
    query?: string;
    limit?: number;
  }): Promise<MediaStreamResponse> {
    const normalized = {
      ...params,
      weakTopics: Array.isArray(params?.weakTopics) ? params?.weakTopics.join(',') : params?.weakTopics,
    };
    return requestJson<MediaStreamResponse>({
      method: 'GET',
      endpoint: `/api/copilot/media/stream${toQueryString(normalized)}`,
    });
  },

  listCollections(params?: {
    subject?: string;
    topic?: string;
    sessionId?: string;
    sortBy?: 'recent' | 'useful' | 'recommended' | 'title';
    query?: string;
    limit?: number;
  }): Promise<MediaCollectionListResponse> {
    return requestJson<MediaCollectionListResponse>({
      method: 'GET',
      endpoint: `/api/copilot/media/collections${toQueryString(params)}`,
    });
  },

  createCollection(payload: MediaCreateCollectionRequest): Promise<{ collection: MediaCollection }> {
    return requestJson<{ collection: MediaCollection }>({
      method: 'POST',
      endpoint: '/api/copilot/media/collections',
      body: payload,
    });
  },

  updateCollection(
    collectionId: string,
    payload: MediaUpdateCollectionRequest
  ): Promise<{ collection: MediaCollection }> {
    return requestJson<{ collection: MediaCollection }>({
      method: 'PATCH',
      endpoint: `/api/copilot/media/collections/${encodeURIComponent(collectionId)}`,
      body: payload,
    });
  },

  addAssetToCollection(
    collectionId: string,
    assetId: string
  ): Promise<{ collection: MediaCollection; asset: MediaAsset }> {
    return requestJson<{ collection: MediaCollection; asset: MediaAsset }>({
      method: 'POST',
      endpoint: `/api/copilot/media/collections/${encodeURIComponent(collectionId)}/assets/${encodeURIComponent(assetId)}`,
    });
  },

  removeAssetFromCollection(
    collectionId: string,
    assetId: string
  ): Promise<{ collection: MediaCollection; asset: MediaAsset }> {
    return requestJson<{ collection: MediaCollection; asset: MediaAsset }>({
      method: 'DELETE',
      endpoint: `/api/copilot/media/collections/${encodeURIComponent(collectionId)}/assets/${encodeURIComponent(assetId)}`,
    });
  },

  recordInteraction(
    assetId: string,
    payload: {
      action: MediaInteractionAction;
      revisionItemId?: string | null;
    }
  ): Promise<{ asset: MediaAsset }> {
    return requestJson<{ asset: MediaAsset }>({
      method: 'POST',
      endpoint: `/api/copilot/media/assets/${encodeURIComponent(assetId)}/interaction`,
      body: payload,
    });
  },
};

const artifactsApi = {
  /**
   * Parses uploaded files into tutor-ready artifact metadata.
   * Endpoint: `POST /api/copilot/artifacts/parse`
   */
  parse(payload: ArtifactParseRequest): Promise<ArtifactParseResponse> {
    return requestJson<ArtifactParseResponse>({
      method: 'POST',
      endpoint: '/api/copilot/artifacts/parse',
      body: payload,
    });
  },
};

const researchApi = {
  /**
   * Runs source-backed research mode for the active study turn.
   * Endpoint: `POST /api/copilot/research`
   */
  run(payload: {
    query: string;
    sessionId?: string;
    topic?: string;
    forceWebSearch?: boolean;
    chatHistory?: Array<{ role: string; content: string }>;
  }): Promise<ResearchModeResponse> {
    return requestJson<ResearchModeResponse>({
      method: 'POST',
      endpoint: '/api/copilot/research',
      body: payload,
    });
  },

  /**
   * Returns contextual educational video recommendations.
   * Endpoint: `POST /api/copilot/video-recommend`
   */
  recommendVideos(payload: {
    query?: string;
    message?: string;
    topic?: string;
    subject?: string;
    intent?: VideoRecommendationIntent;
    sessionId?: string;
    limit?: number;
  }): Promise<VideoRecommendationResponse> {
    return requestJson<VideoRecommendationResponse>({
      method: 'POST',
      endpoint: '/api/copilot/video-recommend',
      body: payload,
    });
  },

  /**
   * Loads transcript/context summary for one selected video.
   * Endpoint: `GET /api/copilot/video/:id/context`
   */
  getVideoContext(
    videoId: string,
    params?: {
      sessionId?: string;
      title?: string;
      topic?: string;
      whyRecommended?: string;
    }
  ): Promise<VideoContextResponse> {
    return requestJson<VideoContextResponse>({
      method: 'GET',
      endpoint: `/api/copilot/video/${encodeURIComponent(videoId)}/context${toQueryString(params)}`,
    });
  },
};

const latencyApi = {
  /**
   * Stores non-blocking per-turn latency telemetry for the active learner.
   * Endpoint: `POST /api/copilot/latency/turn`
   */
  recordTurn(payload: LatencyTurnPayload): Promise<LatencyAckResponse> {
    return requestJson<LatencyAckResponse>({
      method: 'POST',
      endpoint: '/api/copilot/latency/turn',
      body: payload,
    });
  },
};

const voiceApi = {
  /**
   * Reads the learner's remaining voice balance.
   * Endpoint: `GET /api/copilot/voice/balance`
   */
  getBalance(): Promise<VoiceBalanceResponse> {
    return requestJson<VoiceBalanceResponse>({
      method: 'GET',
      endpoint: '/api/copilot/voice/balance',
    });
  },

  /**
   * Starts a metered voice session.
   * Endpoint: `POST /api/copilot/voice/session/start`
   */
  startSession(payload: VoiceSessionStartRequest): Promise<VoiceSessionStartResponse> {
    return requestJson<VoiceSessionStartResponse>({
      method: 'POST',
      endpoint: '/api/copilot/voice/session/start',
      body: payload,
    });
  },

  /**
   * Stops a metered voice session.
   * Endpoint: `POST /api/copilot/voice/session/stop`
   */
  stopSession(payload: VoiceSessionStopRequest): Promise<VoiceSessionStopResponse> {
    return requestJson<VoiceSessionStopResponse>({
      method: 'POST',
      endpoint: '/api/copilot/voice/session/stop',
      body: payload,
    });
  },

  /**
   * Reads the current daily voice quota summary.
   * Endpoint: `GET /api/copilot/voice/quota`
   */
  getQuota(): Promise<VoiceQuotaResponse> {
    return requestJson<VoiceQuotaResponse>({
      method: 'GET',
      endpoint: '/api/copilot/voice/quota',
    });
  },

  /**
   * Sends recorded audio through the voice STT proxy.
   * Endpoint: `POST /voice/stt`
   */
  transcribe(formData: FormData, options?: { sessionUsageId?: string; signal?: AbortSignal }): Promise<SpeechToTextResponse> {
    return requestJson<SpeechToTextResponse>({
      method: 'POST',
      endpoint: '/voice/stt',
      body: formData,
      headers: options?.sessionUsageId ? { 'X-Voice-Session-Id': options.sessionUsageId } : undefined,
      signal: options?.signal,
    });
  },

  /**
   * Requests synthesized speech through the voice TTS proxy.
   * Endpoint: `POST /voice/tts`
   */
  synthesize(
    payload: TextToSpeechRequest,
    options?: { sessionUsageId?: string; signal?: AbortSignal; timeoutMs?: number }
  ): Promise<Response> {
    return requestResponse({
      method: 'POST',
      endpoint: '/voice/tts',
      body: payload,
      headers: options?.sessionUsageId ? { 'X-Voice-Session-Id': options.sessionUsageId } : undefined,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  },
};

const metacognitionApi = {
  /**
   * Records a lightweight reflection signal without interrupting the tutoring flow.
   * Endpoint: `POST /api/copilot/metacognition/event`
   */
  recordEvent(payload: Partial<MetacognitiveEvent>): Promise<MetacognitiveEventRecordResponse> {
    return requestJson<MetacognitiveEventRecordResponse>({
      method: 'POST',
      endpoint: '/api/copilot/metacognition/event',
      body: payload,
    });
  },

  /**
   * Loads the learner's current metacognition profile summary.
   * Endpoint: `GET /api/copilot/metacognition/profile`
   */
  getProfile(): Promise<MetacognitiveProfile> {
    return requestJson<MetacognitiveProfile>({
      method: 'GET',
      endpoint: '/api/copilot/metacognition/profile',
    });
  },

  /**
   * Fetches a context-aware reflection prompt for explicit reflection surfaces.
   * Endpoint: `GET /api/copilot/metacognition/prompt`
   */
  getPrompt(params?: {
    message?: string;
    tutorActionId?: string;
    isRevision?: boolean;
    isPracticePad?: boolean;
    awaitingStudentAttempt?: boolean;
    afterMistake?: boolean;
    afterSuccess?: boolean;
    currentErrorType?: string;
  }): Promise<MetacognitivePromptResponse> {
    return requestJson<MetacognitivePromptResponse>({
      method: 'GET',
      endpoint: `/api/copilot/metacognition/prompt${toQueryString(params)}`,
    });
  },
};

const practicePadApi = {
  /**
   * Checks the learner's current step in the Practice Pad and returns guided feedback.
   * Endpoint: `POST /api/copilot/practice-pad/check-step`
   */
  checkStep(payload: PracticePadCheckStepRequest): Promise<PracticePadCheckStepResponse> {
    return requestJson<PracticePadCheckStepResponse>({
      method: 'POST',
      endpoint: '/api/copilot/practice-pad/check-step',
      body: payload,
    });
  },
};

const safetyApi = {
  /**
   * Lists safety alerts for the safety operations screen.
   * Endpoint: `GET /api/copilot/safety/alerts`
   */
  listAlerts(params?: { limit?: number; status?: string; severity?: string; studentId?: string }): Promise<SafetyAlertListResponse> {
    return requestJson<SafetyAlertListResponse>({
      method: 'GET',
      endpoint: `/api/copilot/safety/alerts${toQueryString(params)}`,
    });
  },

  /**
   * Loads a single safety alert with contextual messages.
   * Endpoint: `GET /api/copilot/safety/alerts/:id`
   */
  getAlert(alertId: string): Promise<SafetyAlertDetailResponse> {
    return requestJson<SafetyAlertDetailResponse>({
      method: 'GET',
      endpoint: `/api/copilot/safety/alerts/${encodeURIComponent(alertId)}`,
    });
  },

  /**
   * Updates a safety alert workflow status.
   * Endpoint: `PATCH /api/copilot/safety/alerts/:id/status`
   */
  updateAlertStatus(
    alertId: string,
    payload: SafetyAlertStatusUpdateRequest
  ): Promise<SafetyAlertStatusUpdateResponse> {
    return requestJson<SafetyAlertStatusUpdateResponse>({
      method: 'PATCH',
      endpoint: `/api/copilot/safety/alerts/${encodeURIComponent(alertId)}/status`,
      body: payload,
    });
  },

  /**
   * Loads safety chat context by session or student filter.
   * Endpoint: `GET /api/copilot/safety/chats`
   */
  getChats(params: {
    sessionId?: string;
    studentId?: string;
    q?: string;
    limit?: number;
  }): Promise<SafetyChatsResponse> {
    return requestJson<SafetyChatsResponse>({
      method: 'GET',
      endpoint: `/api/copilot/safety/chats${toQueryString(params)}`,
    });
  },
};

const studyApi = {
  createPlan(payload: Record<string, unknown>): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'POST',
      endpoint: '/api/copilot/study-plans',
      body: payload,
    });
  },
  generatePlan(payload: StudyPlanGenerateRequest): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'POST',
      endpoint: '/api/copilot/study-plans/generate',
      body: payload,
    });
  },
  getPlans(scope?: string): Promise<{ plans: StudyPlan[] }> {
    return requestJson<{ plans: StudyPlan[] }>({
      method: 'GET',
      endpoint: `/api/copilot/study-plans${toQueryString({ scope })}`,
    });
  },
  getPlan(planId: string): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'GET',
      endpoint: `/api/copilot/study-plans/${encodeURIComponent(planId)}`,
    });
  },
  updatePlan(planId: string, payload: StudyPlanUpdateRequest): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'PATCH',
      endpoint: `/api/copilot/study-plans/${encodeURIComponent(planId)}`,
      body: payload,
    });
  },
  pausePlan(planId: string): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'POST',
      endpoint: `/api/copilot/study-plans/${encodeURIComponent(planId)}/pause`,
      body: {},
    });
  },
  resumePlan(planId: string): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'POST',
      endpoint: `/api/copilot/study-plans/${encodeURIComponent(planId)}/resume`,
      body: {},
    });
  },
  createPlanGoal(planId: string, payload: StudyPlanGoalCreateRequest): Promise<{ goal: StudyGoal }> {
    return requestJson<{ goal: StudyGoal }>({
      method: 'POST',
      endpoint: `/api/copilot/study-plans/${encodeURIComponent(planId)}/goals`,
      body: payload,
    });
  },
  getGoals(): Promise<{ goals: StudyGoal[] }> {
    return requestJson<{ goals: StudyGoal[] }>({
      method: 'GET',
      endpoint: '/api/copilot/study-goals',
    });
  },
  updateGoal(goalId: string, payload: Record<string, unknown>): Promise<{ goal: StudyGoal }> {
    return requestJson<{ goal: StudyGoal }>({
      method: 'PATCH',
      endpoint: `/api/copilot/study-goals/${encodeURIComponent(goalId)}`,
      body: payload,
    });
  },
  completeGoal(goalId: string, completionNote?: string): Promise<{ goal: StudyGoal }> {
    return requestJson<{ goal: StudyGoal }>({
      method: 'POST',
      endpoint: `/api/copilot/study-goals/${encodeURIComponent(goalId)}/complete`,
      body: { completionNote: completionNote || null },
    });
  },
  getProgressSummary(audience: 'parent' | 'teacher', subject?: string): Promise<SafeProgressSummary> {
    return requestJson<SafeProgressSummary>({
      method: 'GET',
      endpoint: `/api/copilot/progress-summary${toQueryString({ audience, subject })}`,
    });
  },
  getWeakTopics(subject?: string): Promise<{ topics: WeakTopicSignal[] }> {
    return requestJson<{ topics: WeakTopicSignal[] }>({
      method: 'GET',
      endpoint: `/api/copilot/weak-topics${toQueryString({ subject })}`,
    });
  },
};

const growthApi = {
  getOverview(subject?: string): Promise<GrowthWorkspaceOverviewResponse> {
    return requestJson<GrowthWorkspaceOverviewResponse>({
      method: 'GET',
      endpoint: `/api/copilot/growth/overview${toQueryString({ subject })}`,
    });
  },
  getWeakTopics(subject?: string): Promise<GrowthWorkspaceWeakTopicsResponse> {
    return requestJson<GrowthWorkspaceWeakTopicsResponse>({
      method: 'GET',
      endpoint: `/api/copilot/growth/weak-topics${toQueryString({ subject })}`,
    });
  },
  getMistakeJournal(subject?: string): Promise<GrowthWorkspaceMistakeJournalResponse> {
    return requestJson<GrowthWorkspaceMistakeJournalResponse>({
      method: 'GET',
      endpoint: `/api/copilot/growth/mistake-journal${toQueryString({ subject })}`,
    });
  },
  getStudyPlans(subject?: string): Promise<GrowthWorkspaceStudyPlansResponse> {
    return requestJson<GrowthWorkspaceStudyPlansResponse>({
      method: 'GET',
      endpoint: `/api/copilot/growth/study-plans${toQueryString({ subject })}`,
    });
  },
  getMasteryTrends(subject?: string): Promise<GrowthWorkspaceMasteryTrendsResponse> {
    return requestJson<GrowthWorkspaceMasteryTrendsResponse>({
      method: 'GET',
      endpoint: `/api/copilot/growth/mastery-trends${toQueryString({ subject })}`,
    });
  },
  resolveAction(
    payload: {
      intent: GrowthActionIntent;
      sessionId?: string | null;
    } & GrowthActionPayload
  ): Promise<GrowthActionResponse> {
    return requestJson<GrowthActionResponse>({
      method: 'POST',
      endpoint: '/api/copilot/growth/action',
      body: payload,
    });
  },
  getDailyFeed(): Promise<GrowthDailyFeedSnapshot> {
    return requestJson<GrowthDailyFeedSnapshot>({
      method: 'GET',
      endpoint: '/api/copilot/growth/daily-feed',
    });
  },
  recordDailyFeedInteraction(
    itemId: string,
    payload: GrowthDailyFeedInteractionRequest
  ): Promise<GrowthDailyFeedInteractionResponse> {
    return requestJson<GrowthDailyFeedInteractionResponse>({
      method: 'POST',
      endpoint: `/api/copilot/growth/daily-feed/${encodeURIComponent(itemId)}/interaction`,
      body: payload,
    });
  },
  getActionFunnel(days = 21): Promise<GrowthActionFunnelSummary> {
    return requestJson<GrowthActionFunnelSummary>({
      method: 'GET',
      endpoint: `/api/copilot/growth/action-funnel${toQueryString({ days })}`,
    });
  },
};

const assessmentApi = {
  startSession(payload: AssessmentSessionStartRequest): Promise<AssessmentSessionStartResponse> {
    return requestJson<AssessmentSessionStartResponse>({
      method: 'POST',
      endpoint: '/api/copilot/assessment/sessions/start',
      body: payload,
    });
  },
  getSession(sessionId: string): Promise<AssessmentSessionResponse> {
    return requestJson<AssessmentSessionResponse>({
      method: 'GET',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}`,
    });
  },
  submitAnswer(sessionId: string, payload: AssessmentAnswerPayload): Promise<AssessmentAnswerResponse> {
    return requestJson<AssessmentAnswerResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/answer`,
      body: payload,
    });
  },
  navigate(sessionId: string, payload: AssessmentNavigatePayload): Promise<AssessmentNavigateResponse> {
    return requestJson<AssessmentNavigateResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/navigate`,
      body: payload,
    });
  },
  requestHint(sessionId: string, payload?: AssessmentHintPayload): Promise<AssessmentHintResponse> {
    return requestJson<AssessmentHintResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/hint`,
      body: payload || {},
    });
  },
  pause(sessionId: string): Promise<AssessmentSessionResponse> {
    return requestJson<AssessmentSessionResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/pause`,
      body: {},
    });
  },
  resume(sessionId: string): Promise<AssessmentSessionResponse> {
    return requestJson<AssessmentSessionResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/resume`,
      body: {},
    });
  },
  finish(sessionId: string, payload?: { reason?: string | null }): Promise<AssessmentFinishResponse> {
    return requestJson<AssessmentFinishResponse>({
      method: 'POST',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/finish`,
      body: payload || {},
    });
  },
  getResults(sessionId: string): Promise<AssessmentResultsResponse> {
    return requestJson<AssessmentResultsResponse>({
      method: 'GET',
      endpoint: `/api/copilot/assessment/sessions/${encodeURIComponent(sessionId)}/results`,
    });
  },
};

const intelligenceApi = {
  getLearningProfile(): Promise<LearningProfile> {
    return requestJson<LearningProfile>({
      method: 'GET',
      endpoint: '/api/copilot/learning-profile',
    });
  },
  getAcademicMemory(): Promise<AcademicMemoryResponse> {
    return requestJson<AcademicMemoryResponse>({
      method: 'GET',
      endpoint: '/api/copilot/academic-memory',
    });
  },
  getConceptDependencies(subject?: string, topic?: string): Promise<ConceptDependenciesResponse> {
    return requestJson<ConceptDependenciesResponse>({
      method: 'GET',
      endpoint: `/api/copilot/concept-dependencies${toQueryString({ subject, topic })}`,
    });
  },
  getTutorInterventionSuggestions(subject?: string, topic?: string): Promise<{ suggestions: TutorInterventionSuggestion[] }> {
    return requestJson<{ suggestions: TutorInterventionSuggestion[] }>({
      method: 'GET',
      endpoint: `/api/copilot/intervention-suggestions${toQueryString({ subject, topic })}`,
    });
  },
  getTutorPolicy(subject?: string, topic?: string): Promise<TutorPolicyDecision> {
    return requestJson<TutorPolicyDecision>({
      method: 'GET',
      endpoint: `/api/copilot/tutor-policy${toQueryString({ subject, topic })}`,
    });
  },
  getWhyThisNext(subject?: string, topic?: string): Promise<WhyThisNextExplanation> {
    return requestJson<WhyThisNextExplanation>({
      method: 'GET',
      endpoint: `/api/copilot/why-this-next${toQueryString({ subject, topic })}`,
    });
  },
  recordInterventionEffect(payload: Record<string, unknown>): Promise<InterventionEffectResponse> {
    return requestJson<InterventionEffectResponse>({
      method: 'POST',
      endpoint: '/api/copilot/intervention-effect',
      body: payload,
    });
  },
  getInterventionEffectiveness(): Promise<InterventionEffectivenessResponse> {
    return requestJson<InterventionEffectivenessResponse>({
      method: 'GET',
      endpoint: '/api/copilot/intervention-effectiveness',
    });
  },
  createSemesterPlan(payload: Record<string, unknown>): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'POST',
      endpoint: '/api/copilot/semester-plan',
      body: payload,
    });
  },
  getSemesterPlans(): Promise<{ plans: StudyPlan[] }> {
    return requestJson<{ plans: StudyPlan[] }>({
      method: 'GET',
      endpoint: '/api/copilot/semester-plans',
    });
  },
  getSemesterPlan(planId: string): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
    return requestJson<{ plan: StudyPlan; goals: StudyGoal[] }>({
      method: 'GET',
      endpoint: `/api/copilot/semester-plans/${encodeURIComponent(planId)}`,
    });
  },
  getMasteryPathway(subject?: string, topic?: string): Promise<MasteryPathwayResponse> {
    return requestJson<MasteryPathwayResponse>({
      method: 'GET',
      endpoint: `/api/copilot/mastery-pathway${toQueryString({ subject, topic })}`,
    });
  },
  getSchoolSafeReport(subject?: string): Promise<SchoolSafeReport> {
    return requestJson<SchoolSafeReport>({
      method: 'GET',
      endpoint: `/api/copilot/school-safe-report${toQueryString({ subject })}`,
    });
  },
};

const qualityApi = {
  /**
   * Records one learning-effect signal for effectiveness analytics.
   * Endpoint: `POST /api/copilot/learning-effect-event`
   */
  recordLearningEffectEvent(
    payload: Partial<LearningEffectEvent> & { eventType: string }
  ): Promise<LearningEffectEventRecordResponse> {
    return requestJson<LearningEffectEventRecordResponse>({
      method: 'POST',
      endpoint: '/api/copilot/learning-effect-event',
      body: payload,
    });
  },

  /**
   * Loads aggregate educational-effectiveness signals for the selected window.
   * Endpoint: `GET /api/copilot/effectiveness-summary`
   */
  getEffectivenessSummary(params?: { days?: number; studentId?: string }): Promise<LearningEffectivenessSummary> {
    return requestJson<LearningEffectivenessSummary>({
      method: 'GET',
      endpoint: `/api/copilot/effectiveness-summary${toQueryString(params)}`,
    });
  },

  /**
   * Loads constitution health drift summary.
   * Endpoint: `GET /api/copilot/constitution-health`
   */
  getConstitutionHealth(params?: { days?: number; studentId?: string }): Promise<ProductConstitutionHealth> {
    return requestJson<ProductConstitutionHealth>({
      method: 'GET',
      endpoint: `/api/copilot/constitution-health${toQueryString(params)}`,
    });
  },

  /**
   * Loads founder-truth strategic summary.
   * Endpoint: `GET /api/copilot/founder-truth`
   */
  getFounderTruth(params?: { days?: number; studentId?: string }): Promise<FounderTruthSummary> {
    return requestJson<FounderTruthSummary>({
      method: 'GET',
      endpoint: `/api/copilot/founder-truth${toQueryString(params)}`,
    });
  },
};

const genericApi = {
  /**
   * @deprecated Prefer named domain helpers, for example `api.sessions.preload()`.
   */
  get<T = unknown>(endpoint: string) {
    return requestJson<T>({ method: 'GET', endpoint });
  },

  /**
   * @deprecated Prefer named domain helpers, for example `api.preferences.update(payload)`.
   */
  post<T = unknown>(endpoint: string, body: unknown) {
    return requestJson<T>({ method: 'POST', endpoint, body });
  },

  /**
   * @deprecated Prefer named domain helpers, for example `api.revision.updateItem(id, patch)`.
   */
  patch<T = unknown>(endpoint: string, body: unknown) {
    return requestJson<T>({ method: 'PATCH', endpoint, body });
  },

  /**
   * @deprecated Prefer named domain helpers, for example `api.sessions.delete(sessionId)`.
   */
  delete<T = unknown>(endpoint: string) {
    return requestJson<T>({ method: 'DELETE', endpoint });
  },
};

const api = {
  ...genericApi,
  endpoints: FRONTEND_API_ENDPOINTS,
  endpointCatalog: FRONTEND_API_ENDPOINT_CATALOG,
  uiSurfaces: FRONTEND_UI_SURFACES,
  uiMap: FRONTEND_UI_ENDPOINT_MAP,
  componentMap: FRONTEND_COMPONENT_ENDPOINT_MAP,
  auth: authApi,
  chat: chatApi,
  sessions: sessionsApi,
  history: historyApi,
  preferences: preferencesApi,
  memory: memoryApi,
  revision: revisionApi,
  media: mediaApi,
  artifacts: artifactsApi,
  research: researchApi,
  latency: latencyApi,
  voice: voiceApi,
  metacognition: metacognitionApi,
  practicePad: practicePadApi,
  assessment: assessmentApi,
  safety: safetyApi,
  study: studyApi,
  growth: growthApi,
  intelligence: intelligenceApi,
  quality: qualityApi,

  fetchRevisionOverview: revisionApi.getOverview,
  saveRevision: revisionApi.save,
  updateRevisionItem: revisionApi.updateItem,
  runRevisionAction: revisionApi.runAction,
  fetchRevisionQueue: revisionApi.getQueue,
  fetchRevisionProgress: revisionApi.getProgress,
  recordRevisionReviewEvent: revisionApi.recordReviewEvent,
  fetchRevisionGroupingSuggestions: revisionApi.getGroupingSuggestions,
  applyRevisionGroupingSuggestion: revisionApi.applyGroupingSuggestion,
  generateRevisionAudioRecap: revisionApi.generateAudioRecap,
  startRevisionMode: revisionApi.startMode,
  recordMetacognitiveEvent: metacognitionApi.recordEvent,
  fetchMetacognitiveProfile: metacognitionApi.getProfile,
  fetchMetacognitivePrompt: metacognitionApi.getPrompt,
  checkPracticePadStep: practicePadApi.checkStep,
  startAssessmentSession: assessmentApi.startSession,
  fetchAssessmentSession: assessmentApi.getSession,
  submitAssessmentAnswer: assessmentApi.submitAnswer,
  navigateAssessmentSession: assessmentApi.navigate,
  requestAssessmentHint: assessmentApi.requestHint,
  pauseAssessmentSession: assessmentApi.pause,
  resumeAssessmentSession: assessmentApi.resume,
  finishAssessmentSession: assessmentApi.finish,
  fetchAssessmentResults: assessmentApi.getResults,
  runResearch: researchApi.run,
  recommendVideos: researchApi.recommendVideos,
  fetchVideoContext: researchApi.getVideoContext,
  createStudyPlan: studyApi.createPlan,
  generateStudyPlan: studyApi.generatePlan,
  fetchStudyPlans: studyApi.getPlans,
  fetchStudyPlan: studyApi.getPlan,
  updateStudyPlan: studyApi.updatePlan,
  pauseStudyPlan: studyApi.pausePlan,
  resumeStudyPlan: studyApi.resumePlan,
  createStudyPlanGoal: studyApi.createPlanGoal,
  fetchStudyGoals: studyApi.getGoals,
  updateStudyGoal: studyApi.updateGoal,
  completeStudyGoal: studyApi.completeGoal,
  fetchProgressSummary: studyApi.getProgressSummary,
  fetchWeakTopics: studyApi.getWeakTopics,
  resolveGrowthAction: growthApi.resolveAction,
  fetchGrowthDailyFeed: growthApi.getDailyFeed,
  recordGrowthDailyFeedInteraction: growthApi.recordDailyFeedInteraction,
  fetchGrowthActionFunnel: growthApi.getActionFunnel,
  fetchLearningProfile: intelligenceApi.getLearningProfile,
  fetchAcademicMemory: intelligenceApi.getAcademicMemory,
  fetchConceptDependencies: intelligenceApi.getConceptDependencies,
  fetchTutorInterventionSuggestions: intelligenceApi.getTutorInterventionSuggestions,
  fetchTutorPolicy: intelligenceApi.getTutorPolicy,
  fetchWhyThisNext: intelligenceApi.getWhyThisNext,
  recordInterventionEffect: intelligenceApi.recordInterventionEffect,
  fetchInterventionEffectiveness: intelligenceApi.getInterventionEffectiveness,
  createSemesterPlan: intelligenceApi.createSemesterPlan,
  fetchSemesterPlans: intelligenceApi.getSemesterPlans,
  fetchSemesterPlan: intelligenceApi.getSemesterPlan,
  fetchMasteryPathway: intelligenceApi.getMasteryPathway,
  fetchSchoolSafeReport: intelligenceApi.getSchoolSafeReport,
  recordLearningEffectEvent: qualityApi.recordLearningEffectEvent,
  fetchLearningEffectivenessSummary: qualityApi.getEffectivenessSummary,
  fetchConstitutionHealth: qualityApi.getConstitutionHealth,
  fetchFounderTruth: qualityApi.getFounderTruth,
};

export default api;
