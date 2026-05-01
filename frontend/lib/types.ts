
export interface VideoData {
    id: string;
    title?: string;
    channel?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
    videoId?: string;
    whyRecommended?: string | null;
    trustTier?: SourceTrustTier | null;
    transcriptAvailable?: boolean | null;
    language?: string | null;
    intent?: VideoRecommendationIntent | null;
}

export interface Image {
    src: string;
    alt?: string;
}

export interface SourceCitation {
    sourceName: string;
    url: string;
    domain?: string | null;
    sourceType?: string | null;
    trustTier?: SourceTrustTier | null;
    relevanceReason?: string | null;
    recencyReason?: string | null;
    educationalFit?: string | null;
}

export type RevisionContentType =
    | 'note'
    | 'summary'
    | 'explanation'
    | 'formula'
    | 'definition'
    | 'worked_step'
    | 'practice_tip'
    | 'misconception'
    | 'correction'
    | 'exam_trap'
    | 'image'
    | 'document'
    | 'video'
    | 'audio';

export type RevisionSubject =
    | 'math'
    | 'english'
    | 'kiswahili'
    | 'arabic'
    | 'biology'
    | 'chemistry'
    | 'physics'
    | 'geography'
    | 'history'
    | 'literature'
    | 'business'
    | 'ict_coding'
    | 'ire'
    | 'kindergarten';

export type RevisionSaveType =
    | 'explanation'
    | 'worked_step'
    | 'short_note'
    | 'mistake_to_fix'
    | 'formula'
    | 'definition'
    | 'research_note'
    | 'practice_item';

export type RevisionMediaType =
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'mixed';

export type RevisionSourceType =
    | 'tutor_message'
    | 'tutor_research'
    | 'tutor_video'
    | 'tutor_image'
    | 'tutor_audio'
    | 'user_note'
    | 'generated_summary';

export type StudentConfidenceSelfCheck = 'understand_well' | 'partly_understand' | 'confused';
export type StudentSupportPreference =
    | 'simpler_explanation'
    | 'small_hint'
    | 'worked_example'
    | 'practice_question';
export type StudentProgressCheck =
    | 'still_confusing'
    | 'getting_clearer'
    | 'i_think_i_get_it'
    | 'let_me_try_one_now'
    | 'ready_to_try'
    | 'hint_first'
    | 'show_worked_example'
    | 'still_hard'
    | 'a_bit_better'
    | 'much_better'
    | 'quick_test';
export type ReflectCardVariant =
    | 'before_continue'
    | 'after_correction'
    | 'before_practice'
    | 'revision_comeback'
    | 'weak_topic_recovery';
export type MicroMasteryLabel = 'still_learning' | 'getting_better' | 'almost_there' | 'confident';
export type RevisionMastery = MicroMasteryLabel;
export type WeakTopicRecoveryStage =
    | 'revisit_prerequisite'
    | 'simpler_example'
    | 'small_recall'
    | 'similar_problem'
    | 'check_again'
    | 'completed';
export type RevisionSaveMode = 'quick_note' | 'key_idea' | 'practice_later';
export type RevisionReviewStatus =
    | 'new'
    | 'review_due'
    | 'practising'
    | 'improving'
    | 'strong'
    | 'needs_attention';
export type RevisionEventType =
    | 'review_started'
    | 'review_completed'
    | 'quiz_started'
    | 'quiz_answered'
    | 'mastery_changed'
    | 'note_updated'
    | 'source_opened'
    | 'similar_question_practised';
export type RevisionEventOutcome = 'correct' | 'partial' | 'struggled' | 'completed' | 'skipped';
export type RevisionCollectionKind = 'standard' | 'bundle';
export type RevisionModeSourceType = 'collection' | 'items' | 'queue' | 'due' | 'weak';
export type StudyPlanScope =
    | 'weekly'
    | 'subject'
    | 'weak_topics'
    | 'exam_focus'
    | 'due_items'
    | 'month'
    | 'term'
    | 'semester';
export type StudyGoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type StudyGoalType =
    | 'revise_due_items'
    | 'practise_topic'
    | 'fix_misconception'
    | 'complete_revision_session'
    | 'review_formulas'
    | 'revisit_weak_topic';
export type SubjectMasteryStatus = 'not_started' | 'emerging' | 'practising' | 'secure' | 'needs_review';
export type TutorPolicyNextAction =
    | 'simplify'
    | 'use_example'
    | 'revisit_prerequisite'
    | 'ask_recall'
    | 'give_similar_question'
    | 'slow_down'
    | 'focus_misconception'
    | 'move_forward'
    | 'suggest_revision'
    | 'switch_strategy';
export type TutorInterventionType =
    | 'simplify'
    | 'use_example'
    | 'revisit_prerequisite'
    | 'ask_recall'
    | 'similar_question'
    | 'worked_example'
    | 'compare_concepts'
    | 'slow_down';
export type InterventionOutcome = 'improved' | 'no_change' | 'struggled' | 'completed' | 'unknown';
export type SupportedLearningLanguage = 'english' | 'swahili' | 'arabic';
export type DetectedInputLanguage = SupportedLearningLanguage | 'mixed' | 'unknown';
export type LearningSupportMode =
    | 'strict_single_language'
    | 'bilingual_support'
    | 'translation_support'
    | 'learner_choice';
export type SimplicityLevel = 'very_simple' | 'simple' | 'standard';
export type MetacognitiveConfidence = 'sure' | 'partly_sure' | 'confused';
export type MetacognitiveProblemFraming =
    | 'concept'
    | 'formula'
    | 'definition'
    | 'comparison'
    | 'procedure'
    | 'application'
    | 'recall';
export type MetacognitiveErrorType =
    | 'concept_misunderstanding'
    | 'wrong_method'
    | 'skipped_step'
    | 'careless_error'
    | 'memory_gap'
    | 'not_sure_yet';
export type MetacognitiveStrategyPreference =
    | 'hint_helped'
    | 'example_helped'
    | 'breakdown_helped'
    | 'practice_helped'
    | 'compare_helped'
    | 'simpler_language_helped'
    | 'worked_step_helped';
export type MetacognitiveTransferReadiness =
    | 'can_reuse'
    | 'needs_more_practice'
    | 'can_explain'
    | 'still_unclear';
export type MetacognitivePromptType =
    | 'frame_problem'
    | 'check_confidence'
    | 'inspect_step'
    | 'locate_error'
    | 'explain_success'
    | 'transfer_learning'
    | 'choose_support'
    | 'reflect_checkin'
    | 'progress_check'
    | 'practice_readiness'
    | 'revision_recheck'
    | 'weak_topic_recovery';
export type PracticePadSupportChoice = 'retry_first' | 'hint' | 'example' | 'break_down';
export type PracticePadStepFocus = 'whole_problem' | 'selected_step' | 'checking_work' | 'stuck_point';

export interface ReflectionSignal {
    confidence?: StudentConfidenceSelfCheck | null;
    supportPreference?: StudentSupportPreference | null;
    sourceTurnId?: string | null;
    topic?: string | null;
    subject?: string | null;
}

export interface MasteryEvidenceSignal {
    topic: string;
    subject?: string | null;
    evidenceType:
        | 'attempted_after_prompt'
        | 'correct_after_support'
        | 'repeated_mistake'
        | 'repeated_mistake_reduced'
        | 'similar_problem_success'
        | 'explain_back_success'
        | 'revision_reuse_success'
        | 'needed_multiple_hints'
        | 'support_strategy_helped'
        | 'support_strategy_failed';
    weight?: number | null;
}

export interface TopicMasteryState {
    topic: string;
    subject?: string | null;
    label: MicroMasteryLabel;
    evidenceScore?: number;
    evidenceCount?: number;
    lastPracticedAt?: string | null;
    recentImprovement?: 'improving' | 'flat' | 'declining' | null;
    repeatedMistakeRate?: number | null;
    supportDependenceLevel?: number | null;
    summary?: string | null;
    nextBestStep?: string | null;
}

export interface WeakTopicRecoveryState {
    topic: string;
    subject?: string | null;
    active: boolean;
    stage?: WeakTopicRecoveryStage | null;
    triggerReason?: string | null;
    title?: string | null;
    summary?: string | null;
    prerequisiteFocus?: string | null;
    simplerExample?: string | null;
    recallQuestion?: string | null;
    similarProblemPrompt?: string | null;
    checkAgainPrompt?: string | null;
}

export interface SessionLanguageState {
    preferredResponseLanguage: SupportedLearningLanguage;
    learningSupportMode?: LearningSupportMode | null;
    simplicityLevel?: SimplicityLevel | null;
    voiceOutputLanguage?: SupportedLearningLanguage | null;
    bilingualSupportLanguage?: SupportedLearningLanguage | null;
    lastDetectedInputLanguage?: DetectedInputLanguage | null;
    preferredLanguageMode?: 'english' | 'swahili' | 'arabic' | 'english_sw' | 'arabic_english';
}

export interface MessageLanguageMetadata {
    detectedInputLanguage?: DetectedInputLanguage | null;
    preferredResponseLanguageAtTurn?: SupportedLearningLanguage | null;
    learningSupportModeAtTurn?: LearningSupportMode | null;
    generatedLanguage?: SupportedLearningLanguage | null;
    sourceInputLanguage?: DetectedInputLanguage | null;
    voiceOutputLanguageAtTurn?: SupportedLearningLanguage | null;
    simplicityLevelAtTurn?: SimplicityLevel | null;
    preferredLanguageModeAtTurn?: SessionLanguageState['preferredLanguageMode'] | null;
}

export interface MetacognitivePrompt {
    type: MetacognitivePromptType;
    text: string;
    variant?: ReflectCardVariant | null;
    supportPrompt?: string | null;
    acknowledgement?: string | null;
    topic?: string | null;
    subject?: string | null;
    topicMastery?: TopicMasteryState | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
}

export interface MetacognitiveStateSnapshot {
    confidence?: MetacognitiveConfidence | null;
    problemFraming?: MetacognitiveProblemFraming | null;
    errorType?: MetacognitiveErrorType | null;
    strategyPreference?: MetacognitiveStrategyPreference | null;
    transferReadiness?: MetacognitiveTransferReadiness | null;
    confidenceSelfCheck?: StudentConfidenceSelfCheck | null;
    supportPreference?: StudentSupportPreference | null;
    studentReflectionNote?: string | null;
}

export interface MetacognitiveEvent {
    id?: string;
    userId: string;
    sessionId?: string | null;
    revisionItemId?: string | null;
    sourceMessageId?: string | null;
    eventType:
        | 'confidence_check'
        | 'problem_frame'
        | 'step_inspection'
        | 'error_located'
        | 'strategy_selected'
        | 'concept_clarity_check'
        | 'recovery_checkpoint'
        | 'save_reflection'
        | 'revision_intent_check'
        | 'success_explained'
        | 'transfer_check'
        | 'reflection_note'
        | 'reflection_checkin';
    confidence?: MetacognitiveConfidence | null;
    problemFraming?: MetacognitiveProblemFraming | null;
    errorType?: MetacognitiveErrorType | null;
    strategyPreference?: MetacognitiveStrategyPreference | null;
    transferReadiness?: MetacognitiveTransferReadiness | null;
    confidenceSelfCheck?: StudentConfidenceSelfCheck | null;
    supportPreference?: StudentSupportPreference | null;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: string;
}

export interface MetacognitiveProfile {
    commonConfidencePattern?: string | null;
    recurringErrorPatterns?: string[] | null;
    preferredSupportPatterns?: string[] | null;
    transferStrengths?: string[] | null;
    reflectionSignals?: string[] | null;
    explanationReadiness?: 'emerging' | 'developing' | 'strong' | null;
    selfCorrectionTrend?: 'improving' | 'steady' | 'needs_support' | null;
    recentSnapshot?: MetacognitiveStateSnapshot | null;
    lastReflectionSignal?: ReflectionSignal | null;
    evidenceCount?: number;
    lastUpdatedAt?: string | null;
}

export interface MetacognitiveEventRecordResponse {
    event: MetacognitiveEvent;
    profile: MetacognitiveProfile;
    snapshot?: MetacognitiveStateSnapshot | null;
    reflectionSignal?: ReflectionSignal | null;
    topicMastery?: TopicMasteryState | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
}

export interface MetacognitivePromptResponse {
    prompt: MetacognitivePrompt | null;
    topicMastery?: TopicMasteryState | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
}

export interface PracticePadReflectionPayload extends MetacognitiveStateSnapshot {
    supportChoice?: PracticePadSupportChoice | null;
    whatTryingToDo?: string | null;
    leastSureStep?: string | null;
}

export interface PracticePadCheckStepRequest {
    sessionId?: string | null;
    prompt?: string | null;
    workText: string;
    selectedStep?: string | null;
    topic?: string | null;
    subject?: string | null;
    supportChoice?: PracticePadSupportChoice | null;
    stepFocus?: PracticePadStepFocus | null;
    reflection?: PracticePadReflectionPayload | null;
    sourceMessageId?: string | null;
}

export interface PracticePadCheckStepResponse {
    sessionId?: string | null;
    message?: Message | null;
    feedback: string;
    diagnosis?: string | null;
    nextStep: string;
    suggestedSupport?: PracticePadSupportChoice | null;
    reflectionPrompt?: MetacognitivePrompt | null;
    detectedErrorType?: MetacognitiveErrorType | null;
    updatedMetacognitiveProfile?: MetacognitiveProfile | null;
}

export interface RevisionMediaRef {
    kind: 'artifact' | 'image' | 'document' | 'video' | 'audio' | 'source';
    id?: string;
    label?: string;
    title?: string;
    url?: string;
    thumbnailUrl?: string;
    mimeType?: string;
    durationSec?: number;
    artifactId?: string;
    videoId?: string;
    audioId?: string;
    summary?: string;
}

export interface RevisionCollection {
    id: string;
    userId?: string;
    title: string;
    subject?: RevisionSubject | string | null;
    topic?: string | null;
    description?: string | null;
    kind?: RevisionCollectionKind | null;
    bundleSummary?: string | null;
    featuredItemIds?: string[] | null;
    coverRef?: Record<string, unknown> | null;
    examFocus?: boolean;
    pinned?: boolean;
    itemCount?: number;
    latestItemAt?: string;
    previewItems?: RevisionItem[];
    sourceSessionId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateRevisionCollectionRequest {
    title?: string;
    subject?: RevisionSubject | string | null;
    topic?: string | null;
    description?: string | null;
    kind?: RevisionCollectionKind | null;
    bundleSummary?: string | null;
    featuredItemIds?: string[] | null;
    coverRef?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
}

export interface RevisionNotebookCoverGenerateRequest {
    title?: string;
    subject?: string | null;
    topic?: string | null;
    summary?: string | null;
    theme?: string | null;
    motto?: string | null;
}

export interface RevisionNotebookCoverGenerateResponse {
    dataUrl: string;
    prompt: string;
    fallbackMode: 'model' | 'svg_fallback';
}

export interface RevisionChapterSummary {
    id: string;
    label: string;
    summary: string;
    itemCount: number;
    itemIds: string[];
    generatedAt?: string | null;
}

export interface RevisionChapterSummariesResponse {
    collectionId: string;
    chapterSummaries: RevisionChapterSummary[];
    cached: boolean;
    generatedAt?: string | null;
    preface?: string | null;
    endRecap?: string | null;
    collection?: RevisionCollection | null;
}

export interface RevisionFlashcard {
    id: string;
    front: string;
    back: string;
    hint?: string | null;
    chapterLabel?: string | null;
    chapterId?: string | null;
    sourceItemIds?: string[];
}

export interface RevisionFlashcardDeckResponse {
    collectionId: string;
    flashcards: RevisionFlashcard[];
    cached: boolean;
    generatedAt?: string | null;
    deckTitle?: string | null;
    scope?: 'collection' | 'chapter';
    chapterId?: string | null;
    chapterLabel?: string | null;
    collection?: RevisionCollection | null;
}

export type RevisionNotebookVisualMode = 'diagram' | 'memory_map' | 'process_flow';

export interface RevisionNotebookVisualGenerateRequest {
    title?: string;
    subject?: string | null;
    topic?: string | null;
    summary?: string | null;
    styleHint?: string | null;
    visualMode?: RevisionNotebookVisualMode | null;
}

export interface RevisionNotebookVisualGenerateResponse {
    asset: MediaAsset;
    fallbackMode?: 'model' | 'svg_fallback';
    visualMode?: RevisionNotebookVisualMode | null;
}

export type RevisionConnectionCategory = 'theory' | 'procedure' | 'application' | 'recovery';
export type RevisionConnectionStrength = 'light' | 'moderate' | 'strong';
export type RevisionConnectionField =
    | 'tags'
    | 'topic'
    | 'subtopic'
    | 'subject'
    | 'mistake_history'
    | 'title_tokens';
export type RevisionTagSuggestionKind = 'merge_duplicate' | 'fix_spelling' | 'mapped_synonym';

export interface RevisionTagSuggestion {
    from: string;
    to: string;
    reason: string;
    kind: RevisionTagSuggestionKind;
}

export interface RevisionConnectionExplainability {
    fields: RevisionConnectionField[];
    sharedTags: string[];
    sharedTitleTokens: string[];
    sameTopic: boolean;
    sameSubtopic: boolean;
    sameSubject: boolean;
    mistakeBridge: boolean;
}

export interface RevisionConnectedNoteLink {
    targetItemId: string;
    targetTitle: string;
    score: number;
    category: RevisionConnectionCategory;
    strength: RevisionConnectionStrength;
    whyConnected: string;
    whySignals: string[];
    sharedTags: string[];
    explainability: RevisionConnectionExplainability;
    actionStep: string;
}

export interface RevisionConnectedNoteGraph {
    generatedAt: string;
    totalLinks: number;
    links: RevisionConnectedNoteLink[];
    summaryLines: string[];
    tagSuggestions: RevisionTagSuggestion[];
}

export interface RevisionItem {
    id: string;
    userId?: string;
    sessionId?: string | null;
    sourceMessageId?: string | null;
    collectionId?: string | null;
    collectionTitle?: string | null;
    title: string;
    summary: string;
    content: string;
    contentType: RevisionContentType;
    subject?: RevisionSubject | string | null;
    saveType?: RevisionSaveType | null;
    mediaType?: RevisionMediaType | null;
    topic?: string | null;
    subtopic?: string | null;
    tags?: string[];
    artifactLabels?: string[];
    selectedText?: string | null;
    studentNote?: string | null;
    isPinned?: boolean;
    mastery?: RevisionMastery | null;
    needsPractice?: boolean;
    isMistakeBased?: boolean;
    saveMode?: RevisionSaveMode | null;
    lastPracticedAt?: string | null;
    practiceCount?: number;
    reviewStatus?: RevisionReviewStatus | null;
    lastReviewedAt?: string | null;
    nextReviewAt?: string | null;
    reviewCount?: number;
    successCount?: number;
    struggleCount?: number;
    recentOutcome?: RevisionEventOutcome | null;
    confidenceTrend?: 'up' | 'steady' | 'down' | null;
    examPriority?: boolean;
    sourceType?: RevisionSourceType | string | null;
    sourceUrl?: string | null;
    imageUrl?: string | null;
    audioUrl?: string | null;
    videoId?: string | null;
    videoTitle?: string | null;
    transcriptSnippet?: string | null;
    audioRecapRef?: Record<string, unknown> | null;
    featuredRank?: number | null;
    bundleRole?: string | null;
    sourceRefs?: SourceCitation[];
    mediaRefs?: RevisionMediaRef[];
    connectedGraph?: RevisionConnectedNoteGraph | null;
    reflection?: MetacognitiveStateSnapshot | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface RevisionQueue {
    dueNow: RevisionItem[];
    needsAttention: RevisionItem[];
    continuePractising: RevisionItem[];
    newItems: RevisionItem[];
    recentlyImproved: RevisionItem[];
}

export interface RevisionOverview {
    collections: RevisionCollection[];
    recentItems: RevisionItem[];
    ungroupedItems: RevisionItem[];
    pinnedItems?: RevisionItem[];
    mistakeItems?: RevisionItem[];
    needsPracticeItems?: RevisionItem[];
    queuePreview?: RevisionQueue | null;
    totalItems: number;
    totalCollections: number;
    ungroupedCount: number;
    totalDueCount?: number;
    totalNeedsAttentionCount?: number;
    totalNewCount?: number;
}

export interface RevisionReviewEvent {
    id: string;
    userId: string;
    revisionItemId: string;
    sessionId?: string | null;
    eventType: RevisionEventType;
    outcome?: RevisionEventOutcome | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
}

export interface RevisionProgressOverview {
    totalDueCount: number;
    totalNeedsAttentionCount: number;
    totalNewCount: number;
    totalStrongCount: number;
    totalPractisedThisWeek?: number;
    collectionProgress?: Array<{
        collectionId: string;
        title: string;
        totalItems: number;
        dueCount: number;
        strongCount: number;
        needsAttentionCount: number;
    }>;
}

export interface RevisionGraphAnalytics {
    windowDays: number;
    totalRevisionItems: number;
    graphOpenCount: number;
    uniqueGraphOpenedItems: number;
    openRate: number;
    summaryGeneratedCount: number;
    summaryCompletionRate: number;
    quizAttemptsAfterGraphOpen: number;
    quizCorrectAfterGraphOpen: number;
    retentionLiftProxy: number;
}

export interface RevisionGroupingSuggestion {
    suggestionId: string;
    title: string;
    subject?: string | null;
    topic?: string | null;
    itemIds: string[];
    reason: string;
    suggestedKind?: 'topic' | 'subject' | 'exam_bundle' | 'media_bundle';
}

export interface RevisionAudioRecapResult {
    recapText: string;
    audioUrl?: string | null;
    audioDurationSec?: number | null;
    fallbackToText?: boolean;
    asset?: MediaAsset | null;
}

export type MediaRecapPreference = 'audio' | 'video' | 'visual' | 'mixed';
export type MediaShortSupportPreference = 'concept_intuition' | 'worked_example' | 'quick_recap';

export interface MediaPreferenceProfile {
    preferredRecapType: MediaRecapPreference;
    shortFormSupport: MediaShortSupportPreference;
    allowExternalCreativeSuggestions: boolean;
}

export type MediaAssetKind =
    | 'audio_recap'
    | 'video_recap'
    | 'annotated_image'
    | 'visual_explainer'
    | 'worksheet_explainer'
    | 'media_card'
    | 'media_collection_item'
    | 'video_note'
    | 'image_note'
    | 'generated_image'
    | 'document_note'
    | 'generated_document';

export type VoiceBehaviorProfile =
    | 'tutor_voice'
    | 'revision_voice'
    | 'reading_voice'
    | 'focus_voice'
    | 'exam_voice';

export type VoiceModeVisualState =
    | 'idle'
    | 'ready'
    | 'listening'
    | 'active_capture'
    | 'processing'
    | 'speaking'
    | 'waiting_response'
    | 'interrupted'
    | 'paused'
    | 'reconnecting'
    | 'error'
    | 'recap_playback';

export type VoiceMicPermissionState =
    | 'unknown'
    | 'prompt'
    | 'granted'
    | 'denied'
    | 'unsupported';

export type VoiceAudioPlaybackState =
    | 'idle'
    | 'buffering'
    | 'playing'
    | 'stopped'
    | 'error';

export type VoiceInterruptionState =
    | 'none'
    | 'student_barge_in'
    | 'assistant_interrupted'
    | 'recovery_pending';

export type VoiceReconnectState = 'stable' | 'reconnecting' | 'degraded' | 'offline';

export type VoiceRecapGenerationState =
    | 'idle'
    | 'generating'
    | 'ready'
    | 'saving'
    | 'saved'
    | 'error';

export interface VoiceTranscriptTurn {
    id: string;
    role: 'student' | 'assistant' | 'system';
    text: string;
    partial?: boolean;
    final?: boolean;
    language?: DetectedInputLanguage | SupportedLearningLanguage | null;
    createdAt: string;
}

export interface VoiceModeRuntimeState {
    isVoiceModeActive: boolean;
    voiceSessionId: string | null;
    voiceProfile: VoiceBehaviorProfile;
    currentVoiceState: VoiceModeVisualState;
    micPermissionState: VoiceMicPermissionState;
    detectedLanguage: DetectedInputLanguage | null;
    selectedLanguage: SupportedLearningLanguage | null;
    partialTranscript: string;
    finalTranscript: string;
    aiSpokenText: string;
    currentAudioPlaybackState: VoiceAudioPlaybackState;
    interruptionState: VoiceInterruptionState;
    reconnectState: VoiceReconnectState;
    recapGenerationState: VoiceRecapGenerationState;
    savedRecapIds: string[];
    entryPoint: string | null;
    returnContext: string | null;
}

export interface MediaAsset {
    id: string;
    userId: string;
    assetKind: MediaAssetKind;
    title: string;
    summary?: string | null;
    body?: string | null;
    subject?: string | null;
    topic?: string | null;
    subtopic?: string | null;
    tags?: string[];
    language?: string | null;
    sessionId?: string | null;
    sourceChatSessionId?: string | null;
    sourceChatMessageId?: string | null;
    revisionItemId?: string | null;
    sourceMessageId?: string | null;
    linkedRevisionItemId?: string | null;
    linkedWeakTopicId?: string | null;
    collectionIds?: string[];
    sourceUrl?: string | null;
    videoId?: string | null;
    videoProvider?: string | null;
    dataUrl?: string | null;
    assetUrl?: string | null;
    thumbnailUrl?: string | null;
    durationSec?: number | null;
    transcript?: string | null;
    transcriptSnippet?: string | null;
    imageUrl?: string | null;
    annotationData?: Record<string, unknown> | null;
    aspectRatio?: string | null;
    generationSource?: string | null;
    recapText?: string | null;
    keyPoints?: string[];
    quickChecks?: string[];
    bestUse?: string | null;
    keyIdea?: string | null;
    nextMove?: string | null;
    difficulty?: string | null;
    schoolLevel?: string | null;
    masteryRelevance?: string | null;
    weakTopicRelevance?: string | null;
    examRelevance?: string | null;
    revisionRelevance?: string | null;
    isSaved?: boolean;
    isPinned?: boolean;
    isCompleted?: boolean;
    isHelpful?: boolean;
    lastOpenedAt?: string | null;
    lastPlayedAt?: string | null;
    lastReviewedAt?: string | null;
    recommendedScore?: number | null;
    streamRankScore?: number | null;
    playbackPosition?: number | null;
    interactionCount?: number;
    completionCount?: number;
    metadata?: Record<string, unknown>;
    safetyStatus?: string | null;
    sourceTrust?: string | null;
    dedupeKey?: string | null;
    createdAt: string;
    updatedAt: string;
}

export type MediaWorkspaceMode = 'library' | 'study_stream' | 'creative_stream';

export interface MediaStreamItem {
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
}

export interface MediaStreamNotice {
    id: string;
    tone?: 'info' | 'quality' | 'seed' | 'refresh';
    message: string;
}

export interface MediaStreamDeckMeta {
    modeIdentity?: string | null;
    supportLabel?: string | null;
    lineupLabel?: string | null;
    replenishes?: boolean;
    refillBatchSize?: number | null;
    seedTopics?: string[];
    sourceHealth?: {
        youtubeFetched?: boolean;
        vimeoFetched?: boolean;
        usedCache?: boolean;
    } | null;
}

export interface MediaStreamEmptyState {
    title: string;
    body: string;
    hintChips?: string[];
    primaryActionLabel?: string | null;
    primaryActionMode?: MediaWorkspaceMode | null;
}

export interface MediaCollection {
    id: string;
    userId?: string;
    title: string;
    subject?: string | null;
    topic?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
    itemCount: number;
    items: MediaAsset[];
    nextAssetId?: string | null;
    progressLabel?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface MediaCollectionListResponse {
    collections: MediaCollection[];
}

export interface MediaCreateCollectionRequest {
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    metadata?: Record<string, unknown>;
}

export interface MediaUpdateCollectionRequest {
    title?: string;
    description?: string | null;
    subject?: string | null;
    topic?: string | null;
    metadata?: Record<string, unknown>;
}

export interface MediaStreamResponse {
    stream: MediaStreamItem[];
    streamMode?: 'study' | 'creative';
    notices?: Array<MediaStreamNotice | string>;
    deck?: MediaStreamDeckMeta | null;
    emptyState?: MediaStreamEmptyState | null;
}

export type MediaInteractionAction =
    | 'open'
    | 'play'
    | 'complete'
    | 'helpful'
    | 'unhelpful'
    | 'save_to_revision'
    | 'quick_check'
    | 'show_more_like_this'
    | 'explain_simply'
    | 'open_long_lesson'
    | 'similar_topic'
    | 'quiz_me'
    | 'similar_question';

export interface MediaVideoRecapRequest {
    videoId?: string;
    sourceUrl?: string;
    title?: string;
    topic?: string;
    subject?: string;
    transcriptText?: string;
    summaryText?: string;
    language?: string;
    sessionId?: string;
    sourceMessageId?: string;
    revisionItemId?: string;
}

export interface MediaVideoRecapResponse {
    asset: MediaAsset;
    recapText: string;
    keyPoints: string[];
    quickChecks: string[];
    saveReadyNote: string;
}

export interface MediaAudioRecapRequest {
    recapText?: string;
    title?: string;
    topic?: string;
    subject?: string;
    language?: string;
    sessionId?: string;
    sourceMessageId?: string;
    revisionItemId?: string;
    sourceType?: 'collection' | 'item' | 'queue';
    collectionId?: string;
    itemId?: string;
}

export interface MediaAudioRecapResponse {
    asset: MediaAsset;
    recapText: string;
    audioUrl?: string | null;
    audioDurationSec?: number | null;
    fallbackToText: boolean;
}

export interface MediaGenerateImageRequest {
    prompt: string;
    title?: string;
    subject?: string;
    topic?: string;
    sessionId?: string;
    sourceMessageId?: string;
    revisionItemId?: string;
    language?: string;
}

export interface MediaGenerateImageResponse {
    asset: MediaAsset;
    fallbackMode?: 'model' | 'svg_fallback';
}

export interface RevisionModeResult {
    sessionId: string;
    message: Message;
    items: RevisionItem[];
    sourceType: RevisionModeSourceType;
}

export type GuidedRevisionSessionStage =
    | 'recall'
    | 'quick_check'
    | 'similar'
    | 'wrap'
    | 'completed';

export type GuidedRevisionSupportAction =
    | 'hint'
    | 'explain_again'
    | 'break_down'
    | 'compare'
    | 'mark_for_later';

export interface GuidedRevisionSessionStep {
    stage: GuidedRevisionSessionStage;
    prompt: string;
    helperText?: string | null;
    inputPlaceholder?: string | null;
    requiresInput: boolean;
    ctaLabel?: string | null;
}

export interface GuidedRevisionSessionStartResult {
    sessionId: string;
    item: RevisionItem;
    orientationLine: string;
    itemTypeLabel: string;
    masteryLabel?: RevisionMastery | null;
    supportActions: GuidedRevisionSupportAction[];
    currentStep: GuidedRevisionSessionStep;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
}

export interface GuidedRevisionSessionProgressRequest {
    itemId: string;
    stage: GuidedRevisionSessionStage;
    responseText?: string;
    supportAction?: GuidedRevisionSupportAction;
}

export interface GuidedRevisionSessionProgressResult {
    sessionId: string;
    itemId: string;
    stage: GuidedRevisionSessionStage;
    feedbackText: string;
    currentStep?: GuidedRevisionSessionStep | null;
    masteryLabel?: RevisionMastery | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
    progressSummary?: string | null;
    nextMoveText?: string | null;
    saveSuggestion?: string | null;
}

export interface SaveRevisionRequest {
    sessionId?: string;
    sourceMessageId?: string;
    selectedText?: string;
    collectionId?: string | null;
    createCollectionTitle?: string | null;
    sourceKind?: 'assistant_message' | 'selected_text' | 'artifact' | 'video' | 'audio';
    title?: string | null;
    summary?: string | null;
    content?: string | null;
    topic?: string | null;
    subject?: RevisionSubject | string | null;
    saveType?: RevisionSaveType | null;
    tutorState?: Partial<TutorState> | null;
    tutorArtifacts?: TutorArtifact[] | null;
    sources?: SourceCitation[] | null;
    videoData?: VideoData | null;
    studentNote?: string | null;
    saveMode?: RevisionSaveMode | null;
    needsPractice?: boolean;
    isMistakeBased?: boolean;
    contentType?: RevisionContentType | null;
    examPriority?: boolean;
    reflection?: MetacognitiveStateSnapshot | null;
}

export interface SaveRevisionResponse {
    item: RevisionItem;
    collection?: RevisionCollection | null;
    tutorRevisionNote?: TutorRevisionNote;
    message?: string;
}

export interface UpdateRevisionItemRequest {
    title?: string;
    summary?: string;
    content?: string;
    collectionId?: string | null;
    featuredRank?: number | null;
    bundleRole?: string | null;
    studentNote?: string | null;
    isPinned?: boolean;
    mastery?: RevisionMastery | null;
    needsPractice?: boolean;
    isMistakeBased?: boolean;
    saveMode?: RevisionSaveMode | null;
    contentType?: RevisionContentType;
    examPriority?: boolean;
    reflection?: MetacognitiveStateSnapshot | null;
    metadataPatch?: Record<string, unknown> | null;
}

export interface DeleteRevisionItemResponse {
    ok: boolean;
    message?: string;
}

export type DeleteRevisionCollectionMode = 'dissolve' | 'delete_with_items';

export interface DeleteRevisionCollectionResponse {
    ok: boolean;
    mode: DeleteRevisionCollectionMode;
    dissolvedItemCount: number;
    deletedItemCount: number;
    message?: string;
}

export interface RevisionItemBatchUpdateRequest {
    updates: Array<{
        itemId: string;
        patch: UpdateRevisionItemRequest;
    }>;
}

export interface RevisionItemBatchUpdateResponse {
    items: RevisionItem[];
    message?: string;
}

export interface RevisionActionResponse {
    sessionId: string;
    item: RevisionItem;
    actionType: 'quiz' | 'breakdown' | 'similar_question';
    message: Message;
    promptType: string;
}

export interface RevisionCollectionDetailResponse {
    collection: RevisionCollection;
    items: RevisionItem[];
}

export interface RevisionCollectionsResponse {
    collections: RevisionCollection[];
    totalCollections: number;
    totalItems: number;
    ungroupedCount: number;
}

export interface RevisionReviewEventResponse {
    event: RevisionReviewEvent;
    item: RevisionItem;
}

export interface StudyPlan {
    id: string;
    userId: string;
    title: string;
    scope: StudyPlanScope;
    subject?: string | null;
    topic?: string | null;
    subjects?: string[] | null;
    dateRangeStart?: string | null;
    dateRangeEnd?: string | null;
    summary?: string | null;
    focusAreas?: string[] | null;
    recommendedBlocks?: string[] | null;
    suggestedCollectionIds?: string[] | null;
    suggestedItemIds?: string[] | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface StudyGoal {
    id: string;
    userId: string;
    studyPlanId?: string | null;
    title: string;
    description?: string | null;
    goalType: StudyGoalType;
    targetCount?: number | null;
    currentCount: number;
    status: StudyGoalStatus;
    subject?: string | null;
    topic?: string | null;
    dueAt?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export type StudyPlanLifecycleStatus = 'active' | 'paused' | 'completed';

export type AssessmentWorkspaceMode = 'exam' | 'focus';
export type AssessmentModeType =
    | 'quick_drill'
    | 'timed_practice'
    | 'mini_mock'
    | 'weak_topic_drill'
    | 'focus_session';
export type AssessmentQuestionStyle =
    | 'multiple_choice'
    | 'short_answer'
    | 'worked_response'
    | 'numeric'
    | 'mixed';
export type AssessmentStrictness = 'strict_exam' | 'light_support' | 'review_after_attempt';
export type AssessmentReviewMode = 'immediate' | 'delayed_block' | 'flag_and_review' | 'post_mock';
export type AssessmentSessionStatus = 'created' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type AssessmentQuestionStatus = 'pending' | 'answered' | 'skipped';
export type AssessmentFeedbackStatus = 'correct' | 'incorrect' | 'partial';
export type AssessmentTimerUrgency = 'normal' | 'warning' | 'critical' | 'expired';

export interface AssessmentQuestionOption {
    id: string;
    label: string;
}

export interface AssessmentQuestion {
    id: string;
    sessionId: string;
    position: number;
    subject?: string | null;
    topic?: string | null;
    subtopic?: string | null;
    questionType: AssessmentQuestionStyle;
    prompt: string;
    options?: AssessmentQuestionOption[] | null;
    status: AssessmentQuestionStatus;
    isFlagged: boolean;
    unsureMarked: boolean;
    metadata?: Record<string, unknown> | null;
}

export interface AssessmentAttempt {
    id: string;
    sessionId: string;
    questionId: string;
    attemptIndex: number;
    isCorrect: boolean;
    isPartial: boolean;
    score: number;
    responseTimeSec?: number | null;
    answerPreview?: string | null;
    feedbackShort?: string | null;
    memoryNote?: string | null;
    submittedAt: string;
}

export interface AssessmentSession {
    id: string;
    userId: string;
    workspaceMode: AssessmentWorkspaceMode;
    modeType: AssessmentModeType;
    questionStyle: AssessmentQuestionStyle;
    strictness: AssessmentStrictness;
    reviewMode: AssessmentReviewMode;
    status: AssessmentSessionStatus;
    subject?: string | null;
    topic?: string | null;
    schoolLevel?: string | null;
    totalQuestions: number;
    currentIndex: number;
    answeredCount: number;
    skippedCount: number;
    flaggedCount: number;
    remainingCount: number;
    timerDurationSec?: number | null;
    timerRemainingSec?: number | null;
    timerStartedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown> | null;
}

export interface AssessmentPolicyState {
    strictness: AssessmentStrictness;
    reviewMode: AssessmentReviewMode;
    preSubmitHelpAllowed: boolean;
    hintsPerQuestion: number;
}

export interface AssessmentProgressState {
    currentQuestionNumber: number;
    totalQuestions: number;
    answeredCount: number;
    skippedCount: number;
    flaggedCount: number;
    remainingCount: number;
    progressPercent: number;
}

export interface AssessmentTimerState {
    durationSec?: number | null;
    remainingSec?: number | null;
    percentRemaining?: number | null;
    urgency: AssessmentTimerUrgency;
    isPaused: boolean;
}

export interface AssessmentNextMove {
    label: string;
    description: string;
    destination: 'revision' | 'growth' | 'media' | 'exam' | 'focus' | 'new_session';
    intent?: string | null;
    topic?: string | null;
    subject?: string | null;
}

export interface AssessmentSessionSnapshot {
    session: AssessmentSession;
    currentQuestion: AssessmentQuestion | null;
    questions: AssessmentQuestion[];
    latestAttempt?: AssessmentAttempt | null;
    policy: AssessmentPolicyState;
    progress: AssessmentProgressState;
    timer: AssessmentTimerState;
    review: {
        pendingCount: number;
        flaggedCount: number;
        canReviewNow: boolean;
    };
    resultsReady: boolean;
    resumed?: boolean;
    nextMove?: AssessmentNextMove | null;
}

export interface AssessmentFeedback {
    status: AssessmentFeedbackStatus;
    headline: string;
    explanation: string;
    remember: string;
    nextActionLabel: string;
    handoff?: AssessmentNextMove | null;
}

export interface AssessmentResult {
    id: string;
    sessionId: string;
    userId: string;
    scorePercent: number;
    correctCount: number;
    incorrectCount: number;
    partialCount: number;
    completedAt: string;
    topicBreakdown: Array<{
        topic: string;
        subject?: string | null;
        total: number;
        correct: number;
        partial: number;
        incorrect: number;
    }>;
    mistakeClusters: Array<{
        pattern: string;
        count: number;
        topic?: string | null;
        subject?: string | null;
    }>;
    weakTopicTriggers: string[];
    improvementSignals: string[];
    timeUsedSec?: number | null;
    bestNextMove: AssessmentNextMove;
    followupPaths: AssessmentNextMove[];
}

export interface AssessmentSessionStartRequest {
    workspaceMode: AssessmentWorkspaceMode;
    modeType?: AssessmentModeType;
    subject?: string | null;
    topic?: string | null;
    schoolLevel?: string | null;
    questionStyle?: AssessmentQuestionStyle;
    strictness?: AssessmentStrictness;
    reviewMode?: AssessmentReviewMode;
    questionCount?: number | null;
    timedMinutes?: number | null;
    resumeLatest?: boolean;
    createIfNone?: boolean;
}

export interface AssessmentAnswerPayload {
    questionId?: string | null;
    answer?: string | number | null;
    selectedOptionId?: string | null;
    workedSteps?: string | null;
    unsure?: boolean;
    flagForReview?: boolean;
    responseTimeSec?: number | null;
}

export interface AssessmentNavigatePayload {
    direction: 'next' | 'previous' | 'jump' | 'unanswered' | 'review_flagged' | 'skip_current';
    targetIndex?: number | null;
    flagReason?: string | null;
}

export interface AssessmentHintPayload {
    questionId?: string | null;
}

export interface AssessmentSessionStartResponse extends AssessmentSessionSnapshot {}

export interface AssessmentSessionResponse extends AssessmentSessionSnapshot {}

export interface AssessmentAnswerResponse {
    snapshot: AssessmentSessionSnapshot;
    attempt: AssessmentAttempt;
    feedback: AssessmentFeedback;
}

export interface AssessmentNavigateResponse {
    snapshot: AssessmentSessionSnapshot;
}

export interface AssessmentHintResponse {
    snapshot: AssessmentSessionSnapshot;
    hint: string;
    remainingHints: number;
}

export interface AssessmentFinishResponse {
    snapshot: AssessmentSessionSnapshot;
    results: AssessmentResult;
}

export interface AssessmentResultsResponse {
    sessionId: string;
    results: AssessmentResult | null;
}

export interface StudyPlanGenerateRequest {
    scope?: StudyPlanScope;
    subject?: string | null;
    topic?: string | null;
    gradeLevel?: string | null;
    goal?: string | null;
    availableMinutesPerDay?: number | null;
    examDate?: string | null;
    strengths?: string[] | null;
    weakAreas?: string[] | null;
    preferredSupportStyle?: string | null;
}

export interface StudyPlanUpdateRequest {
    title?: string;
    summary?: string | null;
    subject?: string | null;
    topic?: string | null;
    subjects?: string[] | null;
    focusAreas?: string[] | null;
    recommendedBlocks?: string[] | null;
    dateRangeStart?: string | null;
    dateRangeEnd?: string | null;
    metadataPatch?: Record<string, unknown> | null;
}

export interface StudyPlanGoalCreateRequest {
    title: string;
    description?: string | null;
    goalType?: StudyGoalType;
    targetCount?: number | null;
    subject?: string | null;
    topic?: string | null;
    dueAt?: string | null;
    metadata?: Record<string, unknown> | null;
}

export type GrowthInlineActionType =
    | 'review_recap'
    | 'quiz'
    | 'simpler_example'
    | 'open_revision_inline'
    | 'work_on_this'
    | 'continue_plan'
    | 'do_now';

export type GrowthInlineTargetType =
    | 'revision_item'
    | 'weak_topic'
    | 'mistake_entry'
    | 'daily_feed_item'
    | 'study_plan'
    | 'study_goal'
    | 'mastery_bucket';

export type GrowthActionRenderMode = 'inline_panel' | 'inline_drawer' | 'split_view';

export interface GrowthInlineActionRequest {
    actionType: GrowthInlineActionType;
    targetType: GrowthInlineTargetType;
    targetId: string;
    renderMode: GrowthActionRenderMode;
    subject?: string | null;
    topic?: string | null;
    title?: string | null;
    helperText?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface GrowthInlineActionProgress {
    key: string;
    status: 'idle' | 'in_progress' | 'completed';
    completions: number;
    startedAt?: string | null;
    completedAt?: string | null;
    evidenceScore?: number | null;
    notes?: string[] | null;
}

export type GrowthDailyFeedItemType =
    | 'due_now_recap'
    | 'weak_topic_review'
    | 'similar_practice'
    | 'mistake_revisit'
    | 'momentum_item'
    | 'plan_milestone'
    | 'media_recap_boost';

export type GrowthDailyFeedEvidenceMode =
    | 'short_reasoning'
    | 'step_ordering'
    | 'why_wrong'
    | 'best_method_reason'
    | 'problem_variant_transfer';

export type GrowthDailyFeedItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface GrowthDailyFeedItem {
    id: string;
    type: GrowthDailyFeedItemType;
    title: string;
    subject?: string | null;
    topic?: string | null;
    reasonToday: string;
    estimatedMinutes: number;
    nextActionLabel: string;
    evidenceMode: GrowthDailyFeedEvidenceMode;
    targetRevisionItemId?: string | null;
    targetStudyPlanId?: string | null;
    targetStudyGoalId?: string | null;
    targetMediaAssetId?: string | null;
    status: GrowthDailyFeedItemStatus;
}

export interface GrowthDailyFeedSnapshot {
    dateKey: string;
    items: GrowthDailyFeedItem[];
    completedCount: number;
    totalCount: number;
    progressPercent: number;
    integritySignals: {
        rapidGuessSignals: number;
        lowEvidenceSignals: number;
        averageResponseSec: number | null;
        recommendation: string;
    };
}

export interface GrowthDailyFeedInteractionRequest {
    action: 'open' | 'start' | 'submit' | 'complete' | 'skip';
    itemType?: GrowthDailyFeedItemType;
    responseText?: string | null;
    responseTimeSec?: number | null;
}

export interface GrowthDailyFeedInteractionResponse {
    progress: {
        id: string;
        userId: string;
        feedDate: string;
        feedItemId: string;
        itemType: GrowthDailyFeedItemType;
        status: GrowthDailyFeedItemStatus;
        actionCount: number;
        completionCount: number;
        rapidGuessCount: number;
        lastResponseSec?: number | null;
        evidenceScore?: number | null;
        metadata?: Record<string, unknown> | null;
        createdAt: string;
        updatedAt: string;
    };
    snapshot: GrowthDailyFeedSnapshot;
}

export interface GrowthActionFunnelModuleSummary {
    actionType: string;
    opened: number;
    submitted: number;
    completed: number;
    openToSubmitRate: number;
    submitToCompleteRate: number;
    averageEvidenceScore: number | null;
    estimatedMasteryLiftRate: number;
}

export interface GrowthActionFunnelSummary {
    periodLabel: string;
    totalOpened: number;
    totalSubmitted: number;
    totalCompleted: number;
    openToSubmitRate: number;
    submitToCompleteRate: number;
    modules: GrowthActionFunnelModuleSummary[];
    topImprovingModules: GrowthActionFunnelModuleSummary[];
}

export type GrowthWorkspaceTrendStatus =
    | 'improving'
    | 'stable'
    | 'fragile'
    | 'needs_support'
    | 'plateauing'
    | 'recovering';

export type GrowthWorkspaceWeakTopicStatus = 'active' | 'improving' | 'stable' | 'recovered';
export type GrowthWorkspaceMistakePatternStatus = 'active' | 'improving' | 'resolved_recently';

export interface GrowthWorkspaceAction {
    actionType:
        | 'open_revision'
        | 'review_recap'
        | 'quiz_me'
        | 'practice_now'
        | 'continue_study_plan'
        | 'rescue_weak_topic'
        | 'open_related_media'
        | 'save_reminder'
        | 'start_guided_study';
    label: string;
    destination: 'revision' | 'media' | 'study_plan' | 'growth' | 'new_session';
    targetId?: string | null;
    topic?: string | null;
    subject?: string | null;
    context?: Record<string, unknown> | null;
}

export interface GrowthWorkspaceRecommendation {
    id: string;
    userId: string;
    type:
        | 'due_revision'
        | 'weak_topic_rescue'
        | 'mistake_pattern_repair'
        | 'continue_study_plan'
        | 'saved_recap_replay'
        | 'struggle_revisit';
    priorityScore: number;
    sourceType: string;
    title: string;
    reason: string;
    primaryAction: GrowthWorkspaceAction;
    secondaryAction?: GrowthWorkspaceAction | null;
    linkedTopic?: string | null;
    linkedRevisionId?: string | null;
    linkedMediaId?: string | null;
    expiresAt?: string | null;
    createdAt: string;
}

export interface GrowthWorkspaceWeakTopic {
    id: string;
    userId: string;
    subject: string;
    topic: string;
    subtopic?: string | null;
    weaknessScore: number;
    microMasteryLabel: RevisionMastery;
    status: GrowthWorkspaceWeakTopicStatus;
    weaknessReasonSummary: string;
    triggers: string[];
    lastStruggledAt?: string | null;
    lastReviewedAt?: string | null;
    nextReviewAt?: string | null;
    linkedRevisionIds: string[];
    linkedMediaIds: string[];
    linkedMistakePatternIds: string[];
    recommendedAction: string;
    createdAt: string;
    updatedAt: string;
}

export interface GrowthWorkspaceMistakePattern {
    id: string;
    userId: string;
    subject: string;
    patternKey: string;
    title: string;
    description: string;
    examples: string[];
    recurrenceScore: number;
    status: GrowthWorkspaceMistakePatternStatus;
    commonContext: string;
    fixReminder: string;
    linkedTopics: string[];
    linkedRevisionIds: string[];
    lastSeenAt?: string | null;
    lastImprovedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GrowthWorkspaceOverviewResponse {
    generatedAt: string;
    recommendedNextMove: GrowthWorkspaceRecommendation | null;
    dueNowQueue: GrowthWorkspaceRecommendation[];
    recentlyImproved: Array<{
        id: string;
        title: string;
        summary: string;
        topic?: string | null;
        subject?: string | null;
        evidence: string[];
        createdAt: string;
    }>;
    weakPatternSpotlight: GrowthWorkspaceMistakePattern[];
    supportPatterns: Array<{
        id: string;
        title: string;
        reason: string;
        confidence: number;
        evidence: string[];
    }>;
    metrics: {
        dueNowCount: number;
        weakTopicCount: number;
        activeMistakePatternCount: number;
        improvingCount: number;
        plansInProgressCount: number;
        masteryCoveragePercent: number;
    };
}

export interface GrowthWorkspaceWeakTopicsResponse {
    generatedAt: string;
    items: GrowthWorkspaceWeakTopic[];
    groups: {
        needsRescueNow: string[];
        stillUnstable: string[];
        improvingSlowly: string[];
        recentlyStabilized: string[];
    };
}

export interface GrowthWorkspaceMistakeJournalResponse {
    generatedAt: string;
    patterns: GrowthWorkspaceMistakePattern[];
    groups: {
        active: string[];
        improving: string[];
        resolvedRecently: string[];
    };
}

export interface GrowthWorkspaceStudyPlanView {
    id: string;
    userId: string;
    title: string;
    goal: string;
    subject?: string | null;
    targetTopics: string[];
    status: 'suggested' | 'active' | 'paused' | 'completed' | 'stale';
    milestoneIndex: number;
    milestones: Array<{
        id: string;
        title: string;
        status: string;
        dueAt?: string | null;
    }>;
    nextAction: string;
    progressSummary: string;
    createdAt: string;
    updatedAt: string;
    linkedPlan: StudyPlan;
}

export interface GrowthWorkspaceStudyPlansResponse {
    generatedAt: string;
    plans: GrowthWorkspaceStudyPlanView[];
    recommendations: GrowthWorkspaceRecommendation[];
}

export interface GrowthWorkspaceMasteryTrendsResponse {
    generatedAt: string;
    overall: {
        status: GrowthWorkspaceTrendStatus;
        summary: string;
        confidence: number;
    };
    subjectTrends: Array<{
        subject: string;
        status: GrowthWorkspaceTrendStatus;
        masteryScore: number;
        evidenceCount: number;
        topicCount: number;
        summary: string;
        delta: number;
    }>;
    topicTrends: Array<{
        topic: string;
        subject: string;
        subtopic?: string | null;
        status: GrowthWorkspaceTrendStatus;
        microMasteryLabel: RevisionMastery;
        confidenceScore: number;
        evidenceScore: number;
        summary: string;
        lastSeenAt?: string | null;
    }>;
    masterySignals: Array<{
        id: string;
        userId: string;
        subject: string;
        topic: string;
        subtopic?: string | null;
        signalType: string;
        confidenceScore: number;
        evidenceScore: number;
        sourceType: string;
        outcome?: string | null;
        createdAt: string;
    }>;
}

export interface SafeProgressSummary {
    audience: 'parent' | 'teacher';
    periodLabel: string;
    highlights: string[];
    focusAreas: string[];
    strengths: string[];
    needsSupport: string[];
    suggestedSupportActions: string[];
}

export interface WeakTopicSignal {
    topic: string;
    subject?: string | null;
    subtopic?: string | null;
    weaknessScore: number;
    evidenceCount: number;
    lastSeenAt?: string | null;
    improving?: boolean;
    reason?: string | null;
    suggestedNextAction?: string | null;
}

export interface LearningProfile {
    id?: string;
    userId: string;
    strongerSubjects?: string[] | null;
    weakerSubjects?: string[] | null;
    recurringWeakTopics?: Array<{ topic: string; subject?: string | null; count?: number }> | null;
    recurringMisconceptions?: Array<{ label: string; topic?: string | null; subject?: string | null; count?: number }> | null;
    preferredRevisionModes?: string[] | null;
    preferredExplanationStyle?: string | null;
    studyConsistencySignals?: Record<string, unknown> | null;
    recentImprovementAreas?: string[] | null;
    evidenceSummary?: Record<string, unknown> | null;
    createdAt?: string;
    lastUpdatedAt?: string;
}

export interface AcademicMemoryEntry {
    kind: 'misconception_pattern' | 'weak_topic_pattern' | 'improved_topic_pattern' | 'preferred_support_pattern' | 'revision_pattern';
    summary: string;
    subject?: string | null;
    topic?: string | null;
    evidenceCount?: number;
    updatedAt?: string | null;
}

export interface ConceptDependency {
    id?: string;
    subject: string;
    topic: string;
    subtopic?: string | null;
    dependsOnTopic: string;
    dependsOnSubtopic?: string | null;
    relationshipType: 'prerequisite' | 'supports' | 'often_confused_with';
    confidence?: number | null;
    source?: 'curated' | 'inferred' | 'tutor_defined' | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface TutorInterventionSuggestion {
    title: string;
    reason: string;
    suggestedAction: string;
    targetTopic?: string | null;
    targetSubtopic?: string | null;
    strategyType:
        | 'simplify'
        | 'use_example'
        | 'revisit_prerequisite'
        | 'practice_more'
        | 'focus_misconception'
        | 'slow_down'
        | 'switch_mode';
    confidence?: number | null;
}

export interface TutorPolicyDecision {
    nextAction: TutorPolicyNextAction;
    reason: string;
    confidence?: number | null;
    contextNotes?: string[] | null;
}

export interface WhyThisNextExplanation {
    title?: string | null;
    shortReason: string;
    supportingSignals?: string[] | null;
    sourceType?:
        | 'review_queue'
        | 'study_plan'
        | 'weak_topic'
        | 'dependency'
        | 'policy_decision'
        | 'mastery_pathway';
}

export interface SubjectMasteryProgress {
    id?: string;
    userId: string;
    subject: string;
    topic: string;
    subtopic?: string | null;
    status: SubjectMasteryStatus;
    evidenceCount: number;
    lastPracticedAt?: string | null;
    confidence?: number | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface InterventionEffectivenessSummary {
    interventionType: TutorInterventionType;
    subject?: string | null;
    topic?: string | null;
    evidenceCount: number;
    improvementRate: number;
    recentTrend: 'up' | 'steady' | 'down';
}

export interface SchoolSafeReport {
    periodLabel: string;
    studentSummary: string;
    subjectFocus?: string | null;
    strengths: string[];
    needsSupport: string[];
    revisionPatterns: string[];
    recommendedNextSteps: string[];
    privacyNotes?: string[] | null;
}

export interface HandoffTokenResponse {
    token: string;
}

export interface StudentMemoryResponse {
    progress: Array<Record<string, unknown>>;
    mistakes: Array<Record<string, unknown>>;
}

export interface CopilotPreferencesResponse {
    preferredLanguage: string;
    interests: string[];
    lastUpdatedAt?: string | null;
    sessionLanguageState?: SessionLanguageState | null;
    copilotThemePreference?: 'light' | 'dark' | 'system';
    studyAtmosphere?: StudyAtmospherePreference | null;
    mediaPreferences?: MediaPreferenceProfile | null;
    learningStyleSignals?: string[];
    [key: string]: unknown;
}

export interface CopilotPreferencesUpdateRequest {
    preferredLanguage: string;
    interests?: string[];
    sessionLanguageState?: Partial<SessionLanguageState> | null;
    copilotThemePreference?: 'light' | 'dark' | 'system';
    studyAtmosphere?: StudyAtmospherePreference | null;
    mediaPreferences?: MediaPreferenceProfile | null;
    learningStyleSignals?: string[];
}

export interface HistoryPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ChatHistoryResponse {
    sessions: ChatSession[];
    pagination: HistoryPagination;
}

export interface CopilotPreloadResponse {
    ready: boolean;
    studentId: string;
    lastSession: ChatSession | null;
    revisionOverview: RevisionOverview | null;
    history: ChatSession[];
}

export interface CreateSessionResponse {
    sessionId: string;
    topic?: string | null;
    createdAt: string;
    updatedAt: string;
    conversationState?: ConversationState;
    tutorState?: TutorState;
}

export interface SessionUpdateResponse {
    message: string;
    session: {
        id: string;
        topic?: string | null;
        updatedAt?: string | Date;
        [key: string]: unknown;
    };
}

export interface SessionDeleteResponse {
    message: string;
}

export interface ArtifactParseRequest {
    fileData: unknown[] | unknown;
    prompt?: string;
    sessionId?: string;
}

export interface ArtifactParseResponse {
    artifacts: TutorArtifact[];
    systemNotices?: SystemNotice[];
}

export interface LatencyThresholdBreach {
    thresholdType:
        | 'sttMs'
        | 'sttFirstTokenMs'
        | 'firstTokenMs'
        | 'tutorLatencyMs'
        | 'doneMs'
        | 'ttsStartMs'
        | 'ttsFirstByteMs'
        | 'totalMs';
    observedMs: number;
    thresholdMs: number;
    severity: 'warn' | 'critical';
}

export interface LatencyTurnPayload {
    studentId?: string;
    sessionId?: string | null;
    turnId?: string;
    responseMode?: string;
    route?: string;
    forceWebSearch?: boolean;
    languageMode?: string;
    source?: string;
    sttMs?: number | null;
    sttFirstTokenMs?: number | null;
    firstTokenMs?: number | null;
    tutorLatencyMs?: number | null;
    doneMs?: number | null;
    totalMs?: number | null;
    ttsStartMs?: number | null;
    ttsFirstByteMs?: number | null;
    aiMs?: number | null;
    inputChars?: number | null;
    outputChars?: number | null;
    metadata?: Record<string, unknown> | null;
}

export interface LatencyAckResponse {
    stored: boolean;
    turnId: string;
    breaches?: LatencyThresholdBreach[];
    severity?: 'warn' | 'critical' | null;
    reason?: string;
}

export interface VoiceBalanceResponse {
    studentId?: string;
    remainingSeconds: number;
    remainingMinutesRoundedDown: number;
    display: string;
}

export interface VoiceSessionStartRequest {
    chatSessionId?: string;
    metadata?: Record<string, unknown>;
}

export interface VoiceSessionStartResponse {
    allowed: boolean;
    sessionUsageId?: string;
    mode?: string;
    remainingSeconds?: number;
    reason?: string;
    message?: string;
}

export interface VoiceSessionStopRequest {
    sessionUsageId: string;
    stopReason: string;
    listeningSecondsUsed: number;
    ttsSecondsUsed: number;
    metadata?: Record<string, unknown>;
}

export interface VoiceSessionStopResponse {
    sessionUsageId: string;
    billedSeconds: number;
    remainingSeconds: number;
    reason: string;
    mode?: string;
}

export interface VoiceQuotaResponse {
    date: string;
    count: number;
    seconds: number;
    bonusSeconds: number;
    remainingBalanceSeconds: number;
    remainingCount?: number;
    remainingSeconds?: number;
    remainingBonusSeconds?: number;
    dailyLimitCount?: number;
    dailyLimitSeconds?: number;
}

export interface SpeechToTextResponse {
    text: string;
    detectedInputLanguage?: DetectedInputLanguage | null;
    preferredResponseLanguage?: SupportedLearningLanguage | null;
}

export interface TextToSpeechRequest {
    text: string;
    voice?: string;
    speed?: number;
    languageMode?: string;
    voiceBehaviorProfile?: VoiceBehaviorProfile;
    sessionUsageId?: string | null;
    sessionLanguageState?: SessionLanguageState | null;
    workspaceContext?: Record<string, unknown> | null;
}

export interface SafetyAlert {
    id: string;
    studentId: string;
    sessionId?: string | null;
    messageId?: string | null;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    excerptRedacted: string;
    status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
    counselorNotified: boolean;
    counselorNotifiedAt?: string | null;
    createdAt: string;
}

export interface SafetyChatMessage {
    id: string;
    role: string;
    content: string;
    messageNumber: number;
    timestamp: string;
    [key: string]: unknown;
}

export interface SafetyChatSessionMeta {
    id: string;
    studentId: string;
    topic?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface SafetyAlertListResponse {
    viewerRole: string;
    alerts: SafetyAlert[];
}

export interface SafetyAlertDetailResponse {
    viewerRole: string;
    alert: SafetyAlert;
    contextMessages: SafetyChatMessage[];
}

export interface SafetyAlertStatusUpdateRequest {
    status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
    note?: string;
}

export interface SafetyAlertStatusUpdateResponse {
    message?: string;
    alert?: SafetyAlert;
}

export interface SafetyChatsResponse {
    viewerRole: string;
    session?: SafetyChatSessionMeta | null;
    messages: SafetyChatMessage[];
}

export interface AcademicMemoryResponse {
    entries: AcademicMemoryEntry[];
}

export interface ConceptDependenciesResponse {
    dependencies: ConceptDependency[];
}

export interface InterventionEffectResponse {
    id: string;
}

export interface InterventionEffectivenessResponse {
    summaries: InterventionEffectivenessSummary[];
}

export type ResearchIntent =
    | 'source_backed_explanation'
    | 'verification'
    | 'topic_research'
    | 'current_events'
    | 'artifact_followup'
    | 'misconception_research';

export type ResearchTriggerType =
    | 'mode_explicit'
    | 'explicit_user_request'
    | 'research_action'
    | 'intent_gate'
    | 'followup_reverify'
    | 'followup_reuse';

export type ResearchConfidenceState = 'high' | 'medium' | 'low' | 'mixed' | 'insufficient';

export type SourceTrustTier = 'high' | 'medium' | 'limited';

export interface ResearchSource {
    title: string;
    url?: string | null;
    domain?: string | null;
    sourceType?: string | null;
    trustTier?: SourceTrustTier | null;
    relevanceReason?: string | null;
    recencyReason?: string | null;
    educationalFit?: string | null;
}

export interface ResearchNotice {
    code:
        | 'limited_source_support'
        | 'partial_research'
        | 'transcript_unavailable'
        | 'research_not_needed'
        | 'current_info_risk'
        | 'mixed_sources'
        | 'research_timeout'
        | 'research_confidence_low'
        | 'source_reuse_hit'
        | 'source_reuse_miss';
    message: string;
    severity?: 'info' | 'warning';
}

export interface ResearchLatencyState {
    startedAt?: string;
    firstUsefulAt?: string;
    completedAt?: string;
    firstUsefulLatencyMs?: number;
    completedLatencyMs?: number;
}

export interface ResearchSourceContext {
    sourceReuseId?: string;
    queryUsed?: string;
    sourceCount?: number;
    reuseHit?: boolean;
    queryPlan?: string[];
}

export interface ResearchResult {
    summary: string;
    sources: ResearchSource[];
    trustSummary?: string | null;
    limitations?: string[] | null;
    nextStepPrompt?: string | null;
    queryPlan?: string[];
    searchCount?: number;
    sourceReuseId?: string;
    reuseHit?: boolean;
    confidenceState?: ResearchConfidenceState;
    triggerType?: ResearchTriggerType;
    latencyMs?: number;
    firstUsefulLatencyMs?: number;
}

export type VideoRecommendationIntent =
    | 'concept_explainer'
    | 'worked_example'
    | 'revision_recap'
    | 'visual_animation'
    | 'exam_help'
    | 'beginner_friendly'
    | 'misconception_fix'
    | 'language_support';

export interface RecommendedVideo {
    videoId: string;
    title: string;
    channelTitle?: string | null;
    thumbnailUrl?: string | null;
    transcriptAvailable?: boolean | null;
    language?: string | null;
    intent?: VideoRecommendationIntent | null;
    whyRecommended?: string | null;
    trustTier?: SourceTrustTier | null;
}

export interface VideoRecommendationResponse {
    intent: VideoRecommendationIntent;
    queryUsed: string;
    summary: string;
    videos: RecommendedVideo[];
    notices?: ResearchNotice[] | null;
}

export interface VideoContextResponse {
    videoId: string;
    title?: string | null;
    transcriptAvailable: boolean;
    transcriptExcerpt?: string | null;
    summary?: string | null;
    concepts: string[];
    whyRecommended?: string | null;
    notices?: ResearchNotice[] | null;
}

export interface ResearchModeResponse {
    mode: 'teaching' | 'web_research';
    intent: ResearchIntent;
    queryUsed: string;
    result: ResearchResult;
    notices: ResearchNotice[];
    recommendedVideo?: RecommendedVideo | null;
}

export interface LearningEffectEvent {
    id?: string;
    userId: string;
    sessionId?: string | null;
    subject?: string | null;
    topic?: string | null;
    revisionItemId?: string | null;
    messageId?: string | null;
    eventType: string;
    outcome?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: string;
}

export interface RevisionVitalitySummary {
    vitality: 'strong' | 'mixed' | 'weak';
    reusedRate?: number;
    staleSaveRate?: number;
    quizActivationRate?: number;
    notes: string[];
}

export interface ProductConstitutionHealth {
    passivityRisk: 'low' | 'medium' | 'high';
    revisionVitality: 'strong' | 'mixed' | 'weak';
    tutoringDiscipline: 'strong' | 'mixed' | 'weak';
    multilingualConsistency: 'strong' | 'mixed' | 'weak';
    trustAndHonesty: 'strong' | 'mixed' | 'weak';
    notes: string[];
}

export interface LearningEffectivenessSummary {
    periodLabel: string;
    totalEvents: number;
    effortSignals: Record<string, number>;
    learningSignals: Record<string, number>;
    tutorEffectivenessSignals: Record<string, number>;
    productIntegritySignals: Record<string, number>;
    voiceSignals: Record<string, number>;
    researchVideoSignals: Record<string, number>;
    multilingualSignals: Record<string, number>;
    revisionVitality: RevisionVitalitySummary;
    notes: string[];
}

export interface FounderTruthSummary {
    periodLabel: string;
    strengths: string[];
    weaknesses: string[];
    emergingRisks: string[];
    promisingSignals: string[];
    interventionInsights: string[];
    revisionInsights: string[];
    multilingualInsights: string[];
    voiceInsights: string[];
    researchVideoInsights: string[];
    recommendedNextFixes: string[];
}

export interface LearningEffectEventRecordResponse {
    event: LearningEffectEvent;
}

export interface MasteryPathwayNode {
    subject: string;
    topic: string;
    label: string;
    stageOrder: number;
    description?: string | null;
    prerequisites?: string[] | null;
}

export interface MasteryPathwayResponse {
    subject?: string | null;
    topic?: string | null;
    nodes: MasteryPathwayNode[];
    currentNode?: MasteryPathwayNode | null;
    nextNode?: MasteryPathwayNode | null;
    progress: SubjectMasteryProgress[];
}

export interface ChatStreamRequest {
    currentSessionId?: string | null;
    message: string;
    persistUserMessage?: boolean;
    editedMessageId?: string;
    turnId?: string;
    responseMode?: string;
    chatHistory?: Message[];
    conversationState?: ConversationState;
    fileData?: unknown;
    tutorAction?: TutorActionRequest;
    inputOrigin?: 'text' | 'pasted_question' | 'worksheet_followup' | 'camera_capture' | 'file_upload';
    composerIntent?: string;
    linkedArtifactId?: string;
    forceWebSearch?: boolean;
    focusMode?: boolean;
    examMode?: boolean;
    includeVideos?: boolean;
    workspaceContext?: FullscreenWorkspaceContext;
    preferences?: Record<string, unknown>;
    studentMemory?: StudentMemoryResponse | Record<string, unknown>;
    latencyContext?: Record<string, unknown>;
    sessionLanguageState?: SessionLanguageState;
    metacognitiveState?: MetacognitiveStateSnapshot | null;
}

export type TutorQuickAction =
    | 'hint'
    | 'breakdown'
    | 'summarize'
    | 'practice'
    | 'save';

export type TutorActionId = TutorQuickAction | 'ask';

export type StudyAtmosphereId =
    | 'midnight_scholar'
    | 'soft_paper'
    | 'rose_studio'
    | 'forest_calm'
    | 'violet_library'
    | 'ember_focus'
    | 'ocean_glass';

export interface StudyAtmospherePreference {
    presetId: StudyAtmosphereId;
    useAdvanced: boolean;
    customBaseColor?: string | null;
}

export type FullscreenCopilotDestination =
    | 'new_session'
    | 'search'
    | 'revision'
    | 'media'
    | 'growth'
    | 'exam'
    | 'focus';

export type FullscreenPlusAction =
    | 'add_files'
    | 'recent_files'
    | 'focus_mode'
    | 'exam_mode'
    | 'web_research';

export type FullscreenStudyMode = 'standard' | 'focus' | 'exam';
export type CopilotSurfaceKind = 'widget' | 'fullscreen';
export type CopilotSurfaceProfile = 'compact' | 'cozy' | 'comfortable' | 'expanded';
export type CopilotNavigationStyle = 'progressive_compact';
export interface FullscreenModeFlags {
    focus: boolean;
    exam: boolean;
    research: boolean;
}

export type FullscreenMediaFilter = 'all' | 'audio' | 'video' | 'image' | 'document';

export type FullscreenGrowthSection =
    | 'overview'
    | 'weak_topics'
    | 'mistake_journal'
    | 'daily_feed'
    | 'study_plans'
    | 'mastery_trends';

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

export interface GrowthActionPayload {
    topic?: string | null;
    subject?: string | null;
    title?: string | null;
    itemId?: string | null;
}

export interface GrowthActionPlan {
    intent: GrowthActionIntent;
    destination: 'revision' | 'media' | 'new_session' | 'growth' | 'exam' | 'focus';
    mediaMode?: MediaWorkspaceMode | null;
    revisionItemId?: string | null;
    topic?: string | null;
    subject?: string | null;
    title?: string | null;
    prompt?: string | null;
    composerIntent?: string | null;
}

export interface GrowthActionResponse {
    actionPlan: GrowthActionPlan;
}

export interface FullscreenWorkspaceContext {
    activeDestination: FullscreenCopilotDestination;
    studyMode: FullscreenStudyMode;
    surfaceKind?: CopilotSurfaceKind;
    surfaceProfile?: CopilotSurfaceProfile;
    navigationStyle?: CopilotNavigationStyle;
    modeFlags?: Partial<FullscreenModeFlags>;
    plusAction?: FullscreenPlusAction | null;
    plusDrawerOpen?: boolean;
    sidebarExpanded?: boolean;
    researchModeRequested?: boolean;
    revisionCollectionId?: string | null;
    revisionItemId?: string | null;
    mediaItemId?: string | null;
    mediaFilter?: FullscreenMediaFilter;
    mediaMode?: MediaWorkspaceMode;
    growthSection?: FullscreenGrowthSection;
    chatSessionId?: string | null;
    historySearchQuery?: string;
    revisionSearchQuery?: string;
}

export type SelectionSourceKind =
    | 'assistant_message'
    | 'user_message'
    | 'artifact'
    | 'video_summary'
    | 'study_material';

export type AssistantCardKind =
    | 'guided_step'
    | 'hint'
    | 'breakdown'
    | 'summary'
    | 'explanation'
    | 'practice'
    | 'correction'
    | 'source_supported';

export type SourceConfidence = 'high' | 'medium' | 'limited';
export type UiTone = 'calm' | 'encouraging' | 'corrective' | 'reflective';
export type SystemNoticeSeverity = 'info' | 'warning' | 'error';

export interface SystemNotice {
    code: string;
    message: string;
    severity: SystemNoticeSeverity;
}

export interface MessagePresentationMeta {
    cardKind?: AssistantCardKind;
    turnType?:
        | 'explanation'
        | 'correction'
        | 'recovery'
        | 'checkpoint'
        | 'save_ready'
        | 'exam'
        | 'focus'
        | 'research'
        | 'celebration_light'
        | 'revision_handoff';
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
    inlineReflectionPrompt?: string;
    inlineReflectionType?: MetacognitivePromptType;
    reflectLevel?: 'silent' | 'inline' | 'full';
    reflectSequenceId?: string;
    reflectEligibilityScore?: number;
    topicMastery?: TopicMasteryState | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
    confidenceCheckSuggested?: boolean;
    errorCheckSuggested?: boolean;
    transferCheckSuggested?: boolean;
    strategyCheckSuggested?: boolean;
}

export type AssistantMessageEnvelopeRoute = 'chat' | 'voice_chat';

export interface AssistantMessageEnvelope {
    version: 'v1';
    route: AssistantMessageEnvelopeRoute;
    generatedAt: string;
    tutorUi?: TutorActionUiMeta;
    presentation?: MessagePresentationMeta;
    systemNotices?: SystemNotice[];
    language?: MessageLanguageMetadata;
    metacognition?: MetacognitiveStateSnapshot | null;
    savedRevisionNote?: TutorRevisionNote;
}

export interface MessageEditMeta {
    edited?: boolean;
    editedAt?: string;
    originalContent?: string;
    editHistory?: Array<{
        content: string;
        editedAt: string;
    }>;
}

export interface MessageResearchMeta {
    queryUsed?: string | null;
    trustSummary?: string | null;
    limitations?: string[] | null;
    notices?: ResearchNotice[] | null;
    recommendedVideos?: RecommendedVideo[] | null;
    researchIntent?: ResearchIntent | null;
    videoIntent?: VideoRecommendationIntent | null;
    triggerType?: ResearchTriggerType | null;
    sourceReuseId?: string | null;
    reuseHit?: boolean | null;
    confidenceState?: ResearchConfidenceState | null;
    searchCount?: number | null;
    queryPlan?: string[] | null;
    firstUsefulLatencyMs?: number | null;
    completedLatencyMs?: number | null;
    latency?: ResearchLatencyState | null;
}

export interface TutorActionRequest {
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
}

export interface TutorRevisionNote {
    id: string;
    text: string;
    topic?: string;
    sourceMessageId?: string;
    createdAt: string;
    subject?: string;
    artifactLabels?: string[];
    basedOnVideoTitle?: string;
    summary?: string;
    contentType?: RevisionContentType;
    collectionId?: string;
    collectionTitle?: string;
}

export interface TutorActionUiMeta {
    actionId?: TutorActionId;
    statusLine?: string;
    nextStep?: string;
    savedRevisionNote?: TutorRevisionNote;
}

export interface MessageMetadata {
    tutorUi?: TutorActionUiMeta;
    presentation?: MessagePresentationMeta;
    systemNotices?: SystemNotice[];
    assistantEnvelope?: AssistantMessageEnvelope;
    edit?: MessageEditMeta;
    language?: MessageLanguageMetadata;
    metacognition?: MetacognitiveStateSnapshot | null;
    research?: MessageResearchMeta | null;
    [key: string]: any;
}

export interface TutorArtifact {
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
}

export interface TutorState {
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
    lastReflectAt?: string;
    lastReflectTopic?: string;
    lastReflectType?: string;
    reflectSequenceId?: string;
    reflectEligibilityScore?: number;
    reflectAnsweredRecently?: boolean;
    reflectDismissedRecently?: boolean;
    topicMastery?: TopicMasteryState | null;
    weakTopicRecovery?: WeakTopicRecoveryState | null;
    preferredSupportPatterns?: string[];
    updatedAt?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp?: Date;
    videoData?: VideoData;
    image?: Image;
    sources?: SourceCitation[];
    isError?: boolean;
    messageNumber?: number; // Added to match backend usage sometimes
    metadata?: MessageMetadata;
}

export interface PersistChatMessageRequest {
    sessionId?: string | null;
    currentSessionId?: string | null;
    conversationState?: ConversationState;
    message: Message;
}

export interface PersistChatMessageResponse {
    message: string;
    savedMessage?: Message;
}

export interface DailyObjective {
    id: string;
    description: string;
    completed: boolean;
}

export interface UserProfile {
    userId: string;
    name?: string | null;
    email?: string | null;
    gradeLevel?: string | null;
    preferredLanguage?: string | null;
    profileCompleted?: boolean;
    preferences?: any;
    favoriteShows?: any;
}

export interface ChatSession {
    id: string;
    title?: string | null;
    topic?: string | null;
    messages?: Message[];
    firstMessage?: string | null;
    summary?: string | null;
    lastTutorFocus?: string | null;
    learningMode?: string | null;
    hadArtifacts?: boolean;
    hadVideo?: boolean;
    continuationStatus?: string | null;
    recentArtifactLabel?: string | null;
    revisionCount?: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    metadata?: Record<string, any>;
    tutorState?: TutorState;

    /**
     * Session-level conversation state as persisted/returned by the backend.
     * Optional because some endpoints (e.g. preload/history lists) may omit it.
     */
    conversationState?: ConversationState;

    /**
     * The backend schema always has a student, but many frontend flows create a
     * placeholder session object before we have a full student payload.
     */
    student?: UserProfile;
}

export interface ConversationState {
    researchModeActive: boolean;
    researchReady?: boolean;
    lastSearchTopic?: string[];
    researchQuery?: string;
    retrievedSourceSet?: ResearchSource[];
    sourceReuseId?: string;
    researchSourceContext?: ResearchSourceContext;
    inferredSchoolLevel?: string;
    inferredLanguage?: string;
    researchLatencyState?: ResearchLatencyState;
    confidenceState?: ResearchConfidenceState;
    advancedOptions?: {
        includeVideos?: boolean;
        level?: string;
        language?: string;
    } | null;
    lastStudyTopic?: string;
    awaitingPracticeQuestionInvitationResponse: boolean;
    activePracticeQuestion?: string;
    awaitingPracticeQuestionAnswer: boolean;
    validationAttemptCount: number;
    lastAssistantMessage?: string;
    sensitiveContentDetected: boolean;
    videoSuggested: boolean;
    usedExamples?: string[];
    lastAttachmentContextSummary?: string;
    lastAttachmentLabels?: string[];
    lastSuggestedVideo?: VideoData;
}

export type UserIntent = 'Accept' | 'Decline' | 'NewTopic' | 'Search' | 'GeneralResponse' | 'ExitResearch' | 'Answer' | 'Clarify' | 'ConfirmAccept' | 'ConfirmDecline' | 'Curious' | 'Unsure' | 'RandomSilly' | 'InsultAngry' | 'VideoRequest';
