"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionAudioRecapResultSchema = exports.RevisionGroupingSuggestionSchema = exports.RevisionProgressOverviewSchema = exports.RevisionReviewEventSchema = exports.RevisionOverviewSchema = exports.RevisionQueueSchema = exports.RevisionItemSchema = exports.RevisionCollectionSchema = exports.RevisionMediaRefSchema = exports.PracticePadCheckStepResponseSchema = exports.PracticePadCheckStepRequestSchema = exports.PracticePadReflectionPayloadSchema = exports.MetacognitiveProfileSchema = exports.MetacognitiveEventSchema = exports.MetacognitiveStateSnapshotSchema = exports.MetacognitivePromptSchema = exports.MessageLanguageMetadataSchema = exports.SessionLanguageStateSchema = exports.PracticePadStepFocusSchema = exports.PracticePadSupportChoiceSchema = exports.MetacognitivePromptTypeSchema = exports.MetacognitiveTransferReadinessSchema = exports.MetacognitiveStrategyPreferenceSchema = exports.MetacognitiveErrorTypeSchema = exports.MetacognitiveProblemFramingSchema = exports.MetacognitiveConfidenceSchema = exports.SimplicityLevelSchema = exports.LearningSupportModeSchema = exports.DetectedInputLanguageSchema = exports.SupportedLearningLanguageSchema = exports.InterventionOutcomeSchema = exports.TutorInterventionTypeSchema = exports.TutorPolicyNextActionSchema = exports.SubjectMasteryStatusSchema = exports.StudyGoalTypeSchema = exports.StudyGoalStatusSchema = exports.StudyPlanScopeSchema = exports.RevisionModeSourceTypeSchema = exports.RevisionCollectionKindSchema = exports.RevisionEventOutcomeSchema = exports.RevisionEventTypeSchema = exports.RevisionReviewStatusSchema = exports.RevisionSaveModeSchema = exports.RevisionMasterySchema = exports.RevisionContentTypeSchema = exports.TutorArtifactSchema = exports.ImageSchema = exports.SourceCitationSchema = exports.VideoDataSchema = exports.UserProfileSchema = void 0;
exports.ConversationStateSchema = exports.ChatSessionSchema = exports.DailyObjectiveSchema = exports.MessageSchema = exports.TutorStateSchema = exports.TutorActionUiMetaSchema = exports.TutorRevisionNoteSchema = exports.TutorActionRequestSchema = exports.MessageEditMetaSchema = exports.MessageEditHistoryEntrySchema = exports.MessagePresentationMetaSchema = exports.SystemNoticeSchema = exports.SystemNoticeSeveritySchema = exports.UiToneSchema = exports.SourceConfidenceSchema = exports.AssistantCardKindSchema = exports.SelectionSourceKindSchema = exports.TutorActionIdSchema = exports.TutorQuickActionSchema = exports.FounderTruthSummarySchema = exports.LearningEffectivenessSummarySchema = exports.ProductConstitutionHealthSchema = exports.RevisionVitalitySummarySchema = exports.LearningEffectEventSchema = exports.VideoContextSummarySchema = exports.VideoRecommendationResultSchema = exports.RecommendedVideoSchema = exports.VideoRecommendationIntentSchema = exports.ResearchResultSchema = exports.ResearchNoticeSchema = exports.ResearchSourceSchema = exports.SourceTrustTierSchema = exports.ResearchIntentSchema = exports.SchoolSafeReportSchema = exports.InterventionEffectivenessSummarySchema = exports.SubjectMasteryProgressSchema = exports.WhyThisNextExplanationSchema = exports.TutorPolicyDecisionSchema = exports.TutorInterventionSuggestionSchema = exports.ConceptDependencySchema = exports.AcademicMemoryEntrySchema = exports.LearningProfileSchema = exports.WeakTopicSignalSchema = exports.SafeProgressSummarySchema = exports.RevisionActionResponseSchema = exports.StudyGoalSchema = exports.StudyPlanSchema = void 0;
const zod_1 = require("zod");
exports.UserProfileSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    name: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().nullable().optional(),
    gradeLevel: zod_1.z.string().nullable().optional(),
    preferredLanguage: zod_1.z.string().nullable().optional(),
    profileCompleted: zod_1.z.boolean().optional(),
    preferences: zod_1.z.any().optional(),
    favoriteShows: zod_1.z.any().optional(),
});
exports.VideoDataSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
    channelTitle: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().optional(),
    videoId: zod_1.z.string().optional(),
    whyRecommended: zod_1.z.string().nullable().optional(),
    trustTier: zod_1.z.enum(['high', 'medium', 'limited']).nullable().optional(),
    transcriptAvailable: zod_1.z.boolean().nullable().optional(),
    language: zod_1.z.string().nullable().optional(),
    intent: zod_1.z.enum([
        'concept_explainer',
        'worked_example',
        'revision_recap',
        'visual_animation',
        'exam_help',
        'beginner_friendly',
        'misconception_fix',
        'language_support',
    ]).nullable().optional(),
});
exports.SourceCitationSchema = zod_1.z.object({
    sourceName: zod_1.z.string(),
    url: zod_1.z.string(),
    domain: zod_1.z.string().nullable().optional(),
    sourceType: zod_1.z.string().nullable().optional(),
    trustTier: zod_1.z.enum(['high', 'medium', 'limited']).nullable().optional(),
    relevanceReason: zod_1.z.string().nullable().optional(),
    recencyReason: zod_1.z.string().nullable().optional(),
    educationalFit: zod_1.z.string().nullable().optional(),
});
exports.ImageSchema = zod_1.z.object({
    src: zod_1.z.string(),
    alt: zod_1.z.string().optional(),
});
exports.TutorArtifactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    kind: zod_1.z.enum(['image', 'pdf', 'text']),
    label: zod_1.z.string(),
    summary: zod_1.z.string(),
    extractedText: zod_1.z.string().optional(),
    questions: zod_1.z.array(zod_1.z.string()).optional(),
    topics: zod_1.z.array(zod_1.z.string()).optional(),
    headings: zod_1.z.array(zod_1.z.string()).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    actionableTasks: zod_1.z.array(zod_1.z.string()).optional(),
    subject: zod_1.z.string().optional(),
    artifactType: zod_1.z.string().optional(),
    denseText: zod_1.z.boolean().optional(),
    ocrConfidence: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    createdAt: zod_1.z.string().optional(),
});
exports.RevisionContentTypeSchema = zod_1.z.enum([
    'note',
    'summary',
    'explanation',
    'formula',
    'definition',
    'worked_step',
    'practice_tip',
    'misconception',
    'correction',
    'exam_trap',
    'image',
    'document',
    'video',
    'audio',
]);
exports.RevisionMasterySchema = zod_1.z.enum(['still_learning', 'getting_better', 'confident']);
exports.RevisionSaveModeSchema = zod_1.z.enum(['quick_note', 'key_idea', 'practice_later']);
exports.RevisionReviewStatusSchema = zod_1.z.enum([
    'new',
    'review_due',
    'practising',
    'improving',
    'strong',
    'needs_attention',
]);
exports.RevisionEventTypeSchema = zod_1.z.enum([
    'review_started',
    'review_completed',
    'quiz_started',
    'quiz_answered',
    'mastery_changed',
    'note_updated',
    'source_opened',
    'similar_question_practised',
]);
exports.RevisionEventOutcomeSchema = zod_1.z.enum(['correct', 'partial', 'struggled', 'completed', 'skipped']);
exports.RevisionCollectionKindSchema = zod_1.z.enum(['standard', 'bundle']);
exports.RevisionModeSourceTypeSchema = zod_1.z.enum(['collection', 'items', 'queue', 'due', 'weak']);
exports.StudyPlanScopeSchema = zod_1.z.enum([
    'weekly',
    'subject',
    'weak_topics',
    'exam_focus',
    'due_items',
    'month',
    'term',
    'semester',
]);
exports.StudyGoalStatusSchema = zod_1.z.enum(['not_started', 'in_progress', 'completed', 'paused']);
exports.StudyGoalTypeSchema = zod_1.z.enum([
    'revise_due_items',
    'practise_topic',
    'fix_misconception',
    'complete_revision_session',
    'review_formulas',
    'revisit_weak_topic',
]);
exports.SubjectMasteryStatusSchema = zod_1.z.enum(['not_started', 'emerging', 'practising', 'secure', 'needs_review']);
exports.TutorPolicyNextActionSchema = zod_1.z.enum([
    'simplify',
    'use_example',
    'revisit_prerequisite',
    'ask_recall',
    'give_similar_question',
    'slow_down',
    'focus_misconception',
    'move_forward',
    'suggest_revision',
    'switch_strategy',
]);
exports.TutorInterventionTypeSchema = zod_1.z.enum([
    'simplify',
    'use_example',
    'revisit_prerequisite',
    'ask_recall',
    'similar_question',
    'worked_example',
    'compare_concepts',
    'slow_down',
]);
exports.InterventionOutcomeSchema = zod_1.z.enum(['improved', 'no_change', 'struggled', 'completed', 'unknown']);
exports.SupportedLearningLanguageSchema = zod_1.z.enum(['english', 'swahili', 'arabic']);
exports.DetectedInputLanguageSchema = zod_1.z.enum(['english', 'swahili', 'arabic', 'mixed', 'unknown']);
exports.LearningSupportModeSchema = zod_1.z.enum([
    'strict_single_language',
    'bilingual_support',
    'translation_support',
    'learner_choice',
]);
exports.SimplicityLevelSchema = zod_1.z.enum(['very_simple', 'simple', 'standard']);
exports.MetacognitiveConfidenceSchema = zod_1.z.enum(['sure', 'partly_sure', 'confused']);
exports.MetacognitiveProblemFramingSchema = zod_1.z.enum([
    'concept',
    'formula',
    'definition',
    'comparison',
    'procedure',
    'application',
    'recall',
]);
exports.MetacognitiveErrorTypeSchema = zod_1.z.enum([
    'concept_misunderstanding',
    'wrong_method',
    'skipped_step',
    'careless_error',
    'memory_gap',
    'not_sure_yet',
]);
exports.MetacognitiveStrategyPreferenceSchema = zod_1.z.enum([
    'hint_helped',
    'example_helped',
    'breakdown_helped',
    'practice_helped',
    'compare_helped',
    'simpler_language_helped',
    'worked_step_helped',
]);
exports.MetacognitiveTransferReadinessSchema = zod_1.z.enum([
    'can_reuse',
    'needs_more_practice',
    'can_explain',
    'still_unclear',
]);
exports.MetacognitivePromptTypeSchema = zod_1.z.enum([
    'frame_problem',
    'check_confidence',
    'inspect_step',
    'locate_error',
    'explain_success',
    'transfer_learning',
    'choose_support',
]);
exports.PracticePadSupportChoiceSchema = zod_1.z.enum(['retry_first', 'hint', 'example', 'break_down']);
exports.PracticePadStepFocusSchema = zod_1.z.enum(['whole_problem', 'selected_step', 'checking_work', 'stuck_point']);
exports.SessionLanguageStateSchema = zod_1.z.object({
    preferredResponseLanguage: exports.SupportedLearningLanguageSchema,
    learningSupportMode: exports.LearningSupportModeSchema.nullable().optional(),
    simplicityLevel: exports.SimplicityLevelSchema.nullable().optional(),
    voiceOutputLanguage: exports.SupportedLearningLanguageSchema.nullable().optional(),
    bilingualSupportLanguage: exports.SupportedLearningLanguageSchema.nullable().optional(),
    lastDetectedInputLanguage: exports.DetectedInputLanguageSchema.nullable().optional(),
    preferredLanguageMode: zod_1.z.enum(['english', 'swahili', 'arabic', 'english_sw', 'arabic_english']).optional(),
});
exports.MessageLanguageMetadataSchema = zod_1.z.object({
    detectedInputLanguage: exports.DetectedInputLanguageSchema.nullable().optional(),
    preferredResponseLanguageAtTurn: exports.SupportedLearningLanguageSchema.nullable().optional(),
    learningSupportModeAtTurn: exports.LearningSupportModeSchema.nullable().optional(),
    generatedLanguage: exports.SupportedLearningLanguageSchema.nullable().optional(),
    sourceInputLanguage: exports.DetectedInputLanguageSchema.nullable().optional(),
    voiceOutputLanguageAtTurn: exports.SupportedLearningLanguageSchema.nullable().optional(),
    simplicityLevelAtTurn: exports.SimplicityLevelSchema.nullable().optional(),
    preferredLanguageModeAtTurn: zod_1.z.enum(['english', 'swahili', 'arabic', 'english_sw', 'arabic_english']).nullable().optional(),
});
exports.MetacognitivePromptSchema = zod_1.z.object({
    type: exports.MetacognitivePromptTypeSchema,
    text: zod_1.z.string(),
});
exports.MetacognitiveStateSnapshotSchema = zod_1.z.object({
    confidence: exports.MetacognitiveConfidenceSchema.nullable().optional(),
    problemFraming: exports.MetacognitiveProblemFramingSchema.nullable().optional(),
    errorType: exports.MetacognitiveErrorTypeSchema.nullable().optional(),
    strategyPreference: exports.MetacognitiveStrategyPreferenceSchema.nullable().optional(),
    transferReadiness: exports.MetacognitiveTransferReadinessSchema.nullable().optional(),
    studentReflectionNote: zod_1.z.string().nullable().optional(),
});
exports.MetacognitiveEventSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    sessionId: zod_1.z.string().nullable().optional(),
    revisionItemId: zod_1.z.string().nullable().optional(),
    sourceMessageId: zod_1.z.string().nullable().optional(),
    eventType: zod_1.z.enum([
        'confidence_check',
        'problem_frame',
        'step_inspection',
        'error_located',
        'strategy_selected',
        'success_explained',
        'transfer_check',
        'reflection_note',
    ]),
    confidence: exports.MetacognitiveConfidenceSchema.nullable().optional(),
    problemFraming: exports.MetacognitiveProblemFramingSchema.nullable().optional(),
    errorType: exports.MetacognitiveErrorTypeSchema.nullable().optional(),
    strategyPreference: exports.MetacognitiveStrategyPreferenceSchema.nullable().optional(),
    transferReadiness: exports.MetacognitiveTransferReadinessSchema.nullable().optional(),
    note: zod_1.z.string().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string().optional(),
});
exports.MetacognitiveProfileSchema = zod_1.z.object({
    commonConfidencePattern: zod_1.z.string().nullable().optional(),
    recurringErrorPatterns: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    preferredSupportPatterns: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    transferStrengths: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    reflectionSignals: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    explanationReadiness: zod_1.z.enum(['emerging', 'developing', 'strong']).nullable().optional(),
    selfCorrectionTrend: zod_1.z.enum(['improving', 'steady', 'needs_support']).nullable().optional(),
    recentSnapshot: exports.MetacognitiveStateSnapshotSchema.nullable().optional(),
    evidenceCount: zod_1.z.number().optional(),
    lastUpdatedAt: zod_1.z.string().nullable().optional(),
});
exports.PracticePadReflectionPayloadSchema = exports.MetacognitiveStateSnapshotSchema.extend({
    supportChoice: exports.PracticePadSupportChoiceSchema.nullable().optional(),
    whatTryingToDo: zod_1.z.string().nullable().optional(),
    leastSureStep: zod_1.z.string().nullable().optional(),
});
exports.PracticePadCheckStepRequestSchema = zod_1.z.object({
    sessionId: zod_1.z.string().nullable().optional(),
    prompt: zod_1.z.string().nullable().optional(),
    workText: zod_1.z.string(),
    selectedStep: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    subject: zod_1.z.string().nullable().optional(),
    supportChoice: exports.PracticePadSupportChoiceSchema.nullable().optional(),
    stepFocus: exports.PracticePadStepFocusSchema.nullable().optional(),
    reflection: exports.PracticePadReflectionPayloadSchema.nullable().optional(),
    sourceMessageId: zod_1.z.string().nullable().optional(),
});
exports.PracticePadCheckStepResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string().nullable().optional(),
    message: zod_1.z.any().nullable().optional(),
    feedback: zod_1.z.string(),
    diagnosis: zod_1.z.string().nullable().optional(),
    nextStep: zod_1.z.string(),
    suggestedSupport: exports.PracticePadSupportChoiceSchema.nullable().optional(),
    reflectionPrompt: exports.MetacognitivePromptSchema.nullable().optional(),
    detectedErrorType: exports.MetacognitiveErrorTypeSchema.nullable().optional(),
    updatedMetacognitiveProfile: exports.MetacognitiveProfileSchema.nullable().optional(),
});
exports.RevisionMediaRefSchema = zod_1.z.object({
    kind: zod_1.z.enum(['artifact', 'image', 'document', 'video', 'audio', 'source']),
    id: zod_1.z.string().optional(),
    label: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    url: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().optional(),
    mimeType: zod_1.z.string().optional(),
    durationSec: zod_1.z.number().optional(),
    artifactId: zod_1.z.string().optional(),
    videoId: zod_1.z.string().optional(),
    audioId: zod_1.z.string().optional(),
    summary: zod_1.z.string().optional(),
});
exports.RevisionCollectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    title: zod_1.z.string(),
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    kind: exports.RevisionCollectionKindSchema.nullable().optional(),
    bundleSummary: zod_1.z.string().nullable().optional(),
    featuredItemIds: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    coverRef: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    examFocus: zod_1.z.boolean().optional(),
    itemCount: zod_1.z.number().optional(),
    latestItemAt: zod_1.z.string().optional(),
    previewItems: zod_1.z.array(zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.RevisionItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().nullable().optional(),
    sourceMessageId: zod_1.z.string().nullable().optional(),
    collectionId: zod_1.z.string().nullable().optional(),
    collectionTitle: zod_1.z.string().nullable().optional(),
    title: zod_1.z.string(),
    summary: zod_1.z.string(),
    content: zod_1.z.string(),
    contentType: exports.RevisionContentTypeSchema,
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    artifactLabels: zod_1.z.array(zod_1.z.string()).optional(),
    selectedText: zod_1.z.string().nullable().optional(),
    studentNote: zod_1.z.string().nullable().optional(),
    isPinned: zod_1.z.boolean().optional(),
    mastery: exports.RevisionMasterySchema.nullable().optional(),
    needsPractice: zod_1.z.boolean().optional(),
    isMistakeBased: zod_1.z.boolean().optional(),
    saveMode: exports.RevisionSaveModeSchema.nullable().optional(),
    lastPracticedAt: zod_1.z.string().nullable().optional(),
    practiceCount: zod_1.z.number().optional(),
    reviewStatus: exports.RevisionReviewStatusSchema.nullable().optional(),
    lastReviewedAt: zod_1.z.string().nullable().optional(),
    nextReviewAt: zod_1.z.string().nullable().optional(),
    reviewCount: zod_1.z.number().optional(),
    successCount: zod_1.z.number().optional(),
    struggleCount: zod_1.z.number().optional(),
    recentOutcome: exports.RevisionEventOutcomeSchema.nullable().optional(),
    confidenceTrend: zod_1.z.enum(['up', 'steady', 'down']).nullable().optional(),
    examPriority: zod_1.z.boolean().optional(),
    audioRecapRef: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    featuredRank: zod_1.z.number().nullable().optional(),
    bundleRole: zod_1.z.string().nullable().optional(),
    sourceRefs: zod_1.z.array(exports.SourceCitationSchema).optional(),
    mediaRefs: zod_1.z.array(exports.RevisionMediaRefSchema).optional(),
    reflection: exports.MetacognitiveStateSnapshotSchema.nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.RevisionQueueSchema = zod_1.z.object({
    dueNow: zod_1.z.array(exports.RevisionItemSchema),
    needsAttention: zod_1.z.array(exports.RevisionItemSchema),
    continuePractising: zod_1.z.array(exports.RevisionItemSchema),
    newItems: zod_1.z.array(exports.RevisionItemSchema),
    recentlyImproved: zod_1.z.array(exports.RevisionItemSchema),
});
exports.RevisionOverviewSchema = zod_1.z.object({
    collections: zod_1.z.array(exports.RevisionCollectionSchema),
    recentItems: zod_1.z.array(exports.RevisionItemSchema),
    ungroupedItems: zod_1.z.array(exports.RevisionItemSchema),
    pinnedItems: zod_1.z.array(exports.RevisionItemSchema).optional(),
    mistakeItems: zod_1.z.array(exports.RevisionItemSchema).optional(),
    needsPracticeItems: zod_1.z.array(exports.RevisionItemSchema).optional(),
    queuePreview: exports.RevisionQueueSchema.nullable().optional(),
    totalItems: zod_1.z.number(),
    totalCollections: zod_1.z.number(),
    ungroupedCount: zod_1.z.number(),
    totalDueCount: zod_1.z.number().optional(),
    totalNeedsAttentionCount: zod_1.z.number().optional(),
    totalNewCount: zod_1.z.number().optional(),
});
exports.RevisionReviewEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    revisionItemId: zod_1.z.string(),
    sessionId: zod_1.z.string().nullable().optional(),
    eventType: exports.RevisionEventTypeSchema,
    outcome: exports.RevisionEventOutcomeSchema.nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string(),
});
exports.RevisionProgressOverviewSchema = zod_1.z.object({
    totalDueCount: zod_1.z.number(),
    totalNeedsAttentionCount: zod_1.z.number(),
    totalNewCount: zod_1.z.number(),
    totalStrongCount: zod_1.z.number(),
    totalPractisedThisWeek: zod_1.z.number().optional(),
    collectionProgress: zod_1.z.array(zod_1.z.object({
        collectionId: zod_1.z.string(),
        title: zod_1.z.string(),
        totalItems: zod_1.z.number(),
        dueCount: zod_1.z.number(),
        strongCount: zod_1.z.number(),
        needsAttentionCount: zod_1.z.number(),
    })).optional(),
});
exports.RevisionGroupingSuggestionSchema = zod_1.z.object({
    suggestionId: zod_1.z.string(),
    title: zod_1.z.string(),
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    itemIds: zod_1.z.array(zod_1.z.string()),
    reason: zod_1.z.string(),
    suggestedKind: zod_1.z.enum(['topic', 'subject', 'exam_bundle', 'media_bundle']).optional(),
});
exports.RevisionAudioRecapResultSchema = zod_1.z.object({
    recapText: zod_1.z.string(),
    audioUrl: zod_1.z.string().nullable().optional(),
    audioDurationSec: zod_1.z.number().nullable().optional(),
    fallbackToText: zod_1.z.boolean().optional(),
});
exports.StudyPlanSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    title: zod_1.z.string(),
    scope: exports.StudyPlanScopeSchema,
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    subjects: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    dateRangeStart: zod_1.z.string().nullable().optional(),
    dateRangeEnd: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.string().nullable().optional(),
    focusAreas: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    recommendedBlocks: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    suggestedCollectionIds: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    suggestedItemIds: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.StudyGoalSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    studyPlanId: zod_1.z.string().nullable().optional(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable().optional(),
    goalType: exports.StudyGoalTypeSchema,
    targetCount: zod_1.z.number().nullable().optional(),
    currentCount: zod_1.z.number(),
    status: exports.StudyGoalStatusSchema,
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    dueAt: zod_1.z.string().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.RevisionActionResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    item: exports.RevisionItemSchema,
    actionType: zod_1.z.preprocess((value) => (value === 'explain' ? 'breakdown' : value), zod_1.z.enum(['quiz', 'breakdown', 'similar_question'])),
    message: zod_1.z.lazy(() => exports.MessageSchema),
    promptType: zod_1.z.string(),
});
exports.SafeProgressSummarySchema = zod_1.z.object({
    audience: zod_1.z.enum(['parent', 'teacher']),
    periodLabel: zod_1.z.string(),
    highlights: zod_1.z.array(zod_1.z.string()),
    focusAreas: zod_1.z.array(zod_1.z.string()),
    strengths: zod_1.z.array(zod_1.z.string()),
    needsSupport: zod_1.z.array(zod_1.z.string()),
    suggestedSupportActions: zod_1.z.array(zod_1.z.string()),
});
exports.WeakTopicSignalSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    subject: zod_1.z.string().nullable().optional(),
    subtopic: zod_1.z.string().nullable().optional(),
    weaknessScore: zod_1.z.number(),
    evidenceCount: zod_1.z.number(),
    lastSeenAt: zod_1.z.string().nullable().optional(),
    improving: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().nullable().optional(),
    suggestedNextAction: zod_1.z.string().nullable().optional(),
});
exports.LearningProfileSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    strongerSubjects: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    weakerSubjects: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    recurringWeakTopics: zod_1.z.array(zod_1.z.object({
        topic: zod_1.z.string(),
        subject: zod_1.z.string().nullable().optional(),
        count: zod_1.z.number().optional(),
    })).nullable().optional(),
    recurringMisconceptions: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string(),
        topic: zod_1.z.string().nullable().optional(),
        subject: zod_1.z.string().nullable().optional(),
        count: zod_1.z.number().optional(),
    })).nullable().optional(),
    preferredRevisionModes: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    preferredExplanationStyle: zod_1.z.string().nullable().optional(),
    studyConsistencySignals: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    recentImprovementAreas: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    evidenceSummary: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string().optional(),
    lastUpdatedAt: zod_1.z.string().optional(),
});
exports.AcademicMemoryEntrySchema = zod_1.z.object({
    kind: zod_1.z.enum([
        'misconception_pattern',
        'weak_topic_pattern',
        'improved_topic_pattern',
        'preferred_support_pattern',
        'revision_pattern',
    ]),
    summary: zod_1.z.string(),
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    evidenceCount: zod_1.z.number().optional(),
    updatedAt: zod_1.z.string().nullable().optional(),
});
exports.ConceptDependencySchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    subject: zod_1.z.string(),
    topic: zod_1.z.string(),
    subtopic: zod_1.z.string().nullable().optional(),
    dependsOnTopic: zod_1.z.string(),
    dependsOnSubtopic: zod_1.z.string().nullable().optional(),
    relationshipType: zod_1.z.enum(['prerequisite', 'supports', 'often_confused_with']),
    confidence: zod_1.z.number().nullable().optional(),
    source: zod_1.z.enum(['curated', 'inferred', 'tutor_defined']).nullable().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.TutorInterventionSuggestionSchema = zod_1.z.object({
    title: zod_1.z.string(),
    reason: zod_1.z.string(),
    suggestedAction: zod_1.z.string(),
    targetTopic: zod_1.z.string().nullable().optional(),
    targetSubtopic: zod_1.z.string().nullable().optional(),
    strategyType: zod_1.z.enum([
        'simplify',
        'use_example',
        'revisit_prerequisite',
        'practice_more',
        'focus_misconception',
        'slow_down',
        'switch_mode',
    ]),
    confidence: zod_1.z.number().nullable().optional(),
});
exports.TutorPolicyDecisionSchema = zod_1.z.object({
    nextAction: exports.TutorPolicyNextActionSchema,
    reason: zod_1.z.string(),
    confidence: zod_1.z.number().nullable().optional(),
    contextNotes: zod_1.z.array(zod_1.z.string()).nullable().optional(),
});
exports.WhyThisNextExplanationSchema = zod_1.z.object({
    title: zod_1.z.string().nullable().optional(),
    shortReason: zod_1.z.string(),
    supportingSignals: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    sourceType: zod_1.z.enum([
        'review_queue',
        'study_plan',
        'weak_topic',
        'dependency',
        'policy_decision',
        'mastery_pathway',
    ]).optional(),
});
exports.SubjectMasteryProgressSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    subject: zod_1.z.string(),
    topic: zod_1.z.string(),
    subtopic: zod_1.z.string().nullable().optional(),
    status: exports.SubjectMasteryStatusSchema,
    evidenceCount: zod_1.z.number(),
    lastPracticedAt: zod_1.z.string().nullable().optional(),
    confidence: zod_1.z.number().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.InterventionEffectivenessSummarySchema = zod_1.z.object({
    interventionType: exports.TutorInterventionTypeSchema,
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    evidenceCount: zod_1.z.number(),
    improvementRate: zod_1.z.number(),
    recentTrend: zod_1.z.enum(['up', 'steady', 'down']),
});
exports.SchoolSafeReportSchema = zod_1.z.object({
    periodLabel: zod_1.z.string(),
    studentSummary: zod_1.z.string(),
    subjectFocus: zod_1.z.string().nullable().optional(),
    strengths: zod_1.z.array(zod_1.z.string()),
    needsSupport: zod_1.z.array(zod_1.z.string()),
    revisionPatterns: zod_1.z.array(zod_1.z.string()),
    recommendedNextSteps: zod_1.z.array(zod_1.z.string()),
    privacyNotes: zod_1.z.array(zod_1.z.string()).nullable().optional(),
});
exports.ResearchIntentSchema = zod_1.z.enum([
    'source_backed_explanation',
    'verification',
    'topic_research',
    'current_events',
    'artifact_followup',
    'misconception_research',
]);
exports.SourceTrustTierSchema = zod_1.z.enum(['high', 'medium', 'limited']);
exports.ResearchSourceSchema = zod_1.z.object({
    title: zod_1.z.string(),
    url: zod_1.z.string().nullable().optional(),
    domain: zod_1.z.string().nullable().optional(),
    sourceType: zod_1.z.string().nullable().optional(),
    trustTier: exports.SourceTrustTierSchema.nullable().optional(),
    relevanceReason: zod_1.z.string().nullable().optional(),
    recencyReason: zod_1.z.string().nullable().optional(),
    educationalFit: zod_1.z.string().nullable().optional(),
});
exports.ResearchNoticeSchema = zod_1.z.object({
    code: zod_1.z.enum([
        'limited_source_support',
        'partial_research',
        'transcript_unavailable',
        'research_not_needed',
        'current_info_risk',
    ]),
    message: zod_1.z.string(),
    severity: zod_1.z.enum(['info', 'warning']).optional(),
});
exports.ResearchResultSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    sources: zod_1.z.array(exports.ResearchSourceSchema),
    trustSummary: zod_1.z.string().nullable().optional(),
    limitations: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    nextStepPrompt: zod_1.z.string().nullable().optional(),
});
exports.VideoRecommendationIntentSchema = zod_1.z.enum([
    'concept_explainer',
    'worked_example',
    'revision_recap',
    'visual_animation',
    'exam_help',
    'beginner_friendly',
    'misconception_fix',
    'language_support',
]);
exports.RecommendedVideoSchema = zod_1.z.object({
    videoId: zod_1.z.string(),
    title: zod_1.z.string(),
    channelTitle: zod_1.z.string().nullable().optional(),
    thumbnailUrl: zod_1.z.string().nullable().optional(),
    transcriptAvailable: zod_1.z.boolean().nullable().optional(),
    language: zod_1.z.string().nullable().optional(),
    intent: exports.VideoRecommendationIntentSchema.nullable().optional(),
    whyRecommended: zod_1.z.string().nullable().optional(),
    trustTier: exports.SourceTrustTierSchema.nullable().optional(),
});
exports.VideoRecommendationResultSchema = zod_1.z.object({
    intent: exports.VideoRecommendationIntentSchema,
    queryUsed: zod_1.z.string(),
    summary: zod_1.z.string(),
    videos: zod_1.z.array(exports.RecommendedVideoSchema),
    notices: zod_1.z.array(exports.ResearchNoticeSchema).nullable().optional(),
});
exports.VideoContextSummarySchema = zod_1.z.object({
    videoId: zod_1.z.string(),
    title: zod_1.z.string().nullable().optional(),
    transcriptAvailable: zod_1.z.boolean(),
    transcriptExcerpt: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.string().nullable().optional(),
    concepts: zod_1.z.array(zod_1.z.string()),
    whyRecommended: zod_1.z.string().nullable().optional(),
    notices: zod_1.z.array(exports.ResearchNoticeSchema).nullable().optional(),
});
exports.LearningEffectEventSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    sessionId: zod_1.z.string().nullable().optional(),
    subject: zod_1.z.string().nullable().optional(),
    topic: zod_1.z.string().nullable().optional(),
    revisionItemId: zod_1.z.string().nullable().optional(),
    messageId: zod_1.z.string().nullable().optional(),
    eventType: zod_1.z.string(),
    outcome: zod_1.z.string().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable().optional(),
    createdAt: zod_1.z.string().optional(),
});
exports.RevisionVitalitySummarySchema = zod_1.z.object({
    vitality: zod_1.z.enum(['strong', 'mixed', 'weak']),
    reusedRate: zod_1.z.number().optional(),
    staleSaveRate: zod_1.z.number().optional(),
    quizActivationRate: zod_1.z.number().optional(),
    notes: zod_1.z.array(zod_1.z.string()),
});
exports.ProductConstitutionHealthSchema = zod_1.z.object({
    passivityRisk: zod_1.z.enum(['low', 'medium', 'high']),
    revisionVitality: zod_1.z.enum(['strong', 'mixed', 'weak']),
    tutoringDiscipline: zod_1.z.enum(['strong', 'mixed', 'weak']),
    multilingualConsistency: zod_1.z.enum(['strong', 'mixed', 'weak']),
    trustAndHonesty: zod_1.z.enum(['strong', 'mixed', 'weak']),
    notes: zod_1.z.array(zod_1.z.string()),
});
exports.LearningEffectivenessSummarySchema = zod_1.z.object({
    periodLabel: zod_1.z.string(),
    totalEvents: zod_1.z.number(),
    effortSignals: zod_1.z.record(zod_1.z.number()),
    learningSignals: zod_1.z.record(zod_1.z.number()),
    tutorEffectivenessSignals: zod_1.z.record(zod_1.z.number()),
    productIntegritySignals: zod_1.z.record(zod_1.z.number()),
    voiceSignals: zod_1.z.record(zod_1.z.number()),
    researchVideoSignals: zod_1.z.record(zod_1.z.number()),
    multilingualSignals: zod_1.z.record(zod_1.z.number()),
    revisionVitality: exports.RevisionVitalitySummarySchema,
    notes: zod_1.z.array(zod_1.z.string()),
});
exports.FounderTruthSummarySchema = zod_1.z.object({
    periodLabel: zod_1.z.string(),
    strengths: zod_1.z.array(zod_1.z.string()),
    weaknesses: zod_1.z.array(zod_1.z.string()),
    emergingRisks: zod_1.z.array(zod_1.z.string()),
    promisingSignals: zod_1.z.array(zod_1.z.string()),
    interventionInsights: zod_1.z.array(zod_1.z.string()),
    revisionInsights: zod_1.z.array(zod_1.z.string()),
    multilingualInsights: zod_1.z.array(zod_1.z.string()),
    voiceInsights: zod_1.z.array(zod_1.z.string()),
    researchVideoInsights: zod_1.z.array(zod_1.z.string()),
    recommendedNextFixes: zod_1.z.array(zod_1.z.string()),
});
exports.TutorQuickActionSchema = zod_1.z.preprocess((value) => (value === 'explain' ? 'breakdown' : value), zod_1.z.enum([
    'hint',
    'breakdown',
    'summarize',
    'practice',
    'save',
]));
exports.TutorActionIdSchema = zod_1.z.preprocess((value) => (value === 'explain' ? 'breakdown' : value), zod_1.z.enum([
    'ask',
    'hint',
    'breakdown',
    'summarize',
    'practice',
    'save',
]));
exports.SelectionSourceKindSchema = zod_1.z.enum([
    'assistant_message',
    'user_message',
    'artifact',
    'video_summary',
    'study_material',
]);
exports.AssistantCardKindSchema = zod_1.z.enum([
    'guided_step',
    'hint',
    'breakdown',
    'summary',
    'explanation',
    'practice',
    'correction',
    'source_supported',
]);
exports.SourceConfidenceSchema = zod_1.z.enum(['high', 'medium', 'limited']);
exports.UiToneSchema = zod_1.z.enum(['calm', 'encouraging', 'corrective', 'reflective']);
exports.SystemNoticeSeveritySchema = zod_1.z.enum(['info', 'warning', 'error']);
exports.SystemNoticeSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    severity: exports.SystemNoticeSeveritySchema,
});
exports.MessagePresentationMetaSchema = zod_1.z.object({
    cardKind: exports.AssistantCardKindSchema.optional(),
    nextStepPrompt: zod_1.z.string().optional(),
    suggestedActions: zod_1.z.array(exports.TutorQuickActionSchema).optional(),
    awaitingStudentAttempt: zod_1.z.boolean().optional(),
    basedOnArtifactLabel: zod_1.z.string().optional(),
    basedOnVideoTitle: zod_1.z.string().optional(),
    sourceConfidence: exports.SourceConfidenceSchema.optional(),
    uiTone: exports.UiToneSchema.optional(),
    reflectionPrompt: zod_1.z.string().optional(),
    reflectionPromptType: exports.MetacognitivePromptTypeSchema.optional(),
    confidenceCheckSuggested: zod_1.z.boolean().optional(),
    errorCheckSuggested: zod_1.z.boolean().optional(),
    transferCheckSuggested: zod_1.z.boolean().optional(),
    strategyCheckSuggested: zod_1.z.boolean().optional(),
});
exports.MessageEditHistoryEntrySchema = zod_1.z.object({
    content: zod_1.z.string(),
    editedAt: zod_1.z.string(),
});
exports.MessageEditMetaSchema = zod_1.z.object({
    edited: zod_1.z.boolean().optional(),
    editedAt: zod_1.z.string().optional(),
    originalContent: zod_1.z.string().optional(),
    editHistory: zod_1.z.array(exports.MessageEditHistoryEntrySchema).optional(),
});
exports.TutorActionRequestSchema = zod_1.z.object({
    id: exports.TutorActionIdSchema,
    sourceMessageId: zod_1.z.string().optional(),
    sourceText: zod_1.z.string().optional(),
    selectedText: zod_1.z.string().optional(),
    sourceVideoId: zod_1.z.string().optional(),
    sourceVideoTitle: zod_1.z.string().optional(),
    sourceArtifactLabel: zod_1.z.string().optional(),
    sourceArtifactSummary: zod_1.z.string().optional(),
    invokedFrom: zod_1.z.enum(['assistant_card', 'selection_menu', 'composer']).optional(),
    selectionSourceKind: exports.SelectionSourceKindSchema.optional(),
    inputOrigin: zod_1.z.enum(['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload']).optional(),
    composerIntent: zod_1.z.string().optional(),
    linkedArtifactId: zod_1.z.string().optional(),
});
exports.TutorRevisionNoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    text: zod_1.z.string(),
    topic: zod_1.z.string().optional(),
    sourceMessageId: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    subject: zod_1.z.string().optional(),
    artifactLabels: zod_1.z.array(zod_1.z.string()).optional(),
    basedOnVideoTitle: zod_1.z.string().optional(),
    summary: zod_1.z.string().optional(),
    contentType: exports.RevisionContentTypeSchema.optional(),
    collectionId: zod_1.z.string().optional(),
    collectionTitle: zod_1.z.string().optional(),
});
exports.TutorActionUiMetaSchema = zod_1.z.object({
    actionId: exports.TutorActionIdSchema.optional(),
    statusLine: zod_1.z.string().optional(),
    nextStep: zod_1.z.string().optional(),
    savedRevisionNote: exports.TutorRevisionNoteSchema.optional(),
});
exports.TutorStateSchema = zod_1.z.object({
    activeTopic: zod_1.z.string().optional(),
    activeArtifactSummary: zod_1.z.string().optional(),
    activeArtifactLabels: zod_1.z.array(zod_1.z.string()).optional(),
    activeVideoId: zod_1.z.string().optional(),
    activeVideoTitle: zod_1.z.string().optional(),
    activeVideoSummary: zod_1.z.string().optional(),
    activeVideoConcepts: zod_1.z.array(zod_1.z.string()).optional(),
    activeVideoWhyRecommended: zod_1.z.string().optional(),
    lastIntent: zod_1.z.string().optional(),
    misconceptionFocus: zod_1.z.array(zod_1.z.string()).optional(),
    masteryFocus: zod_1.z.array(zod_1.z.string()).optional(),
    learnerStage: zod_1.z.enum(['support', 'developing', 'secure']).optional(),
    recommendedMode: zod_1.z.enum(['guided', 'practice', 'challenge']).optional(),
    recentGoals: zod_1.z.array(zod_1.z.string()).optional(),
    islamicContext: zod_1.z.string().optional(),
    semanticMemory: zod_1.z.string().optional(),
    teacherCorrections: zod_1.z.array(zod_1.z.string()).optional(),
    studentPreferences: zod_1.z.array(zod_1.z.string()).optional(),
    evidenceReferences: zod_1.z.array(zod_1.z.string()).optional(),
    visibleFocusLabel: zod_1.z.string().optional(),
    visibleStageLabel: zod_1.z.string().optional(),
    awaitingStudentAttempt: zod_1.z.boolean().optional(),
    currentStudyMode: zod_1.z.string().optional(),
    systemNotices: zod_1.z.array(exports.SystemNoticeSchema).optional(),
    sessionLanguageState: exports.SessionLanguageStateSchema.optional(),
    metacognitiveState: exports.MetacognitiveStateSnapshotSchema.nullable().optional(),
    preferredSupportPatterns: zod_1.z.array(zod_1.z.string()).optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string(), // Added id
    role: zod_1.z.enum(['user', 'model']),
    content: zod_1.z.string(),
    timestamp: zod_1.z.date().optional(), // Added timestamp
    videoData: exports.VideoDataSchema.optional(), // Added videoData
    image: exports.ImageSchema.optional(), // Added image
    sources: zod_1.z.array(exports.SourceCitationSchema).optional(),
    isError: zod_1.z.boolean().optional(),
    messageNumber: zod_1.z.number().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.DailyObjectiveSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    completed: zod_1.z.boolean(),
});
exports.ChatSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    topic: zod_1.z.string().nullable().optional(),
    messages: zod_1.z.array(exports.MessageSchema).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    metadata: zod_1.z.any().optional(),
    student: exports.UserProfileSchema,
    tutorState: exports.TutorStateSchema.optional(),
});
exports.ConversationStateSchema = zod_1.z.object({
    researchModeActive: zod_1.z.boolean().default(false),
    lastSearchTopic: zod_1.z.array(zod_1.z.string()).optional(),
    lastStudyTopic: zod_1.z.string().optional(),
    awaitingPracticeQuestionInvitationResponse: zod_1.z.boolean().default(false),
    activePracticeQuestion: zod_1.z.string().optional(),
    awaitingPracticeQuestionAnswer: zod_1.z.boolean().default(false),
    validationAttemptCount: zod_1.z.number().default(0),
    lastAssistantMessage: zod_1.z.string().optional(),
    sensitiveContentDetected: zod_1.z.boolean().default(false),
    videoSuggested: zod_1.z.boolean().default(false),
    usedExamples: zod_1.z.array(zod_1.z.string()).optional(),
    lastAttachmentContextSummary: zod_1.z.string().optional(),
    lastAttachmentLabels: zod_1.z.array(zod_1.z.string()).optional(),
    lastSuggestedVideo: exports.VideoDataSchema.optional(),
});
//# sourceMappingURL=types.js.map