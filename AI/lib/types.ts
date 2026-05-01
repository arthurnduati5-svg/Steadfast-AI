import { z } from 'zod';

export const VideoDataSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  channel: z.string().optional(),
  channelTitle: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  videoId: z.string().optional(),
  whyRecommended: z.string().nullable().optional(),
  trustTier: z.enum(['high', 'medium', 'limited']).nullable().optional(),
  transcriptAvailable: z.boolean().nullable().optional(),
  language: z.string().nullable().optional(),
  intent: z.enum([
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

export const SourceCitationSchema = z.object({
  sourceName: z.string(),
  url: z.string(),
  domain: z.string().nullable().optional(),
  sourceType: z.string().nullable().optional(),
  trustTier: z.enum(['high', 'medium', 'limited']).nullable().optional(),
  relevanceReason: z.string().nullable().optional(),
  recencyReason: z.string().nullable().optional(),
  educationalFit: z.string().nullable().optional(),
});
export type SourceCitation = z.infer<typeof SourceCitationSchema>;

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

export const TutorArtifactSchema = z.object({
  id: z.string(),
  kind: z.enum(['image', 'pdf', 'text']),
  label: z.string(),
  summary: z.string(),
  extractedText: z.string().optional(),
  questions: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  headings: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  actionableTasks: z.array(z.string()).optional(),
  subject: z.string().optional(),
  artifactType: z.string().optional(),
  denseText: z.boolean().optional(),
  ocrConfidence: z.enum(['low', 'medium', 'high']).optional(),
  createdAt: z.string().optional(),
});
export type TutorArtifact = z.infer<typeof TutorArtifactSchema>;

export const RevisionContentTypeSchema = z.enum([
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
export type RevisionContentType = z.infer<typeof RevisionContentTypeSchema>;

export const RevisionSubjectSchema = z.enum([
  'math',
  'english',
  'kiswahili',
  'arabic',
  'biology',
  'chemistry',
  'physics',
  'geography',
  'history',
  'literature',
  'business',
  'ict_coding',
  'ire',
  'kindergarten',
]);
export type RevisionSubject = z.infer<typeof RevisionSubjectSchema>;

export const RevisionSaveTypeSchema = z.enum([
  'explanation',
  'worked_step',
  'short_note',
  'mistake_to_fix',
  'formula',
  'definition',
  'research_note',
  'practice_item',
]);
export type RevisionSaveType = z.infer<typeof RevisionSaveTypeSchema>;

export const RevisionMediaTypeSchema = z.enum(['text', 'image', 'audio', 'video', 'mixed']);
export type RevisionMediaType = z.infer<typeof RevisionMediaTypeSchema>;

export const MediaAssetKindSchema = z.enum([
  'audio_recap',
  'video_recap',
  'annotated_image',
  'visual_explainer',
  'worksheet_explainer',
  'media_card',
  'media_collection_item',
  'video_note',
  'image_note',
  'generated_image',
  'document_note',
  'generated_document',
]);
export type MediaAssetKind = z.infer<typeof MediaAssetKindSchema>;

export const VoiceBehaviorProfileSchema = z.enum([
  'tutor_voice',
  'revision_voice',
  'reading_voice',
  'focus_voice',
  'exam_voice',
]);
export type VoiceBehaviorProfile = z.infer<typeof VoiceBehaviorProfileSchema>;

export const MediaAssetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assetKind: MediaAssetKindSchema,
  title: z.string(),
  summary: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  subtopic: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  sourceChatSessionId: z.string().nullable().optional(),
  sourceChatMessageId: z.string().nullable().optional(),
  revisionItemId: z.string().nullable().optional(),
  sourceMessageId: z.string().nullable().optional(),
  linkedRevisionItemId: z.string().nullable().optional(),
  linkedWeakTopicId: z.string().nullable().optional(),
  collectionIds: z.array(z.string()).optional(),
  sourceUrl: z.string().nullable().optional(),
  videoId: z.string().nullable().optional(),
  videoProvider: z.string().nullable().optional(),
  dataUrl: z.string().nullable().optional(),
  assetUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  durationSec: z.number().nullable().optional(),
  transcript: z.string().nullable().optional(),
  transcriptSnippet: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  annotationData: z.record(z.unknown()).nullable().optional(),
  aspectRatio: z.string().nullable().optional(),
  generationSource: z.string().nullable().optional(),
  recapText: z.string().nullable().optional(),
  keyPoints: z.array(z.string()).optional(),
  quickChecks: z.array(z.string()).optional(),
  bestUse: z.string().nullable().optional(),
  keyIdea: z.string().nullable().optional(),
  nextMove: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  schoolLevel: z.string().nullable().optional(),
  masteryRelevance: z.string().nullable().optional(),
  weakTopicRelevance: z.string().nullable().optional(),
  examRelevance: z.string().nullable().optional(),
  revisionRelevance: z.string().nullable().optional(),
  isSaved: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  isHelpful: z.boolean().optional(),
  lastOpenedAt: z.string().nullable().optional(),
  lastPlayedAt: z.string().nullable().optional(),
  lastReviewedAt: z.string().nullable().optional(),
  recommendedScore: z.number().nullable().optional(),
  streamRankScore: z.number().nullable().optional(),
  playbackPosition: z.number().nullable().optional(),
  interactionCount: z.number().int().optional(),
  completionCount: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
  safetyStatus: z.string().nullable().optional(),
  sourceTrust: z.string().nullable().optional(),
  dedupeKey: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const RevisionSourceTypeSchema = z.enum([
  'tutor_message',
  'tutor_research',
  'tutor_video',
  'tutor_image',
  'tutor_audio',
  'user_note',
  'generated_summary',
]);
export type RevisionSourceType = z.infer<typeof RevisionSourceTypeSchema>;

export const StudentConfidenceSelfCheckSchema = z.enum([
  'understand_well',
  'partly_understand',
  'confused',
]);
export type StudentConfidenceSelfCheck = z.infer<typeof StudentConfidenceSelfCheckSchema>;

export const StudentSupportPreferenceSchema = z.enum([
  'simpler_explanation',
  'small_hint',
  'worked_example',
  'practice_question',
]);
export type StudentSupportPreference = z.infer<typeof StudentSupportPreferenceSchema>;

export const StudentProgressCheckSchema = z.enum([
  'still_confusing',
  'getting_clearer',
  'i_think_i_get_it',
  'let_me_try_one_now',
  'ready_to_try',
  'hint_first',
  'show_worked_example',
  'still_hard',
  'a_bit_better',
  'much_better',
  'quick_test',
]);
export type StudentProgressCheck = z.infer<typeof StudentProgressCheckSchema>;

export const ReflectCardVariantSchema = z.enum([
  'before_continue',
  'after_correction',
  'before_practice',
  'revision_comeback',
  'weak_topic_recovery',
]);
export type ReflectCardVariant = z.infer<typeof ReflectCardVariantSchema>;

export const MicroMasteryLabelSchema = z.enum([
  'still_learning',
  'getting_better',
  'almost_there',
  'confident',
]);
export type MicroMasteryLabel = z.infer<typeof MicroMasteryLabelSchema>;

export const RevisionMasterySchema = MicroMasteryLabelSchema;
export type RevisionMastery = z.infer<typeof RevisionMasterySchema>;

export const WeakTopicRecoveryStageSchema = z.enum([
  'revisit_prerequisite',
  'simpler_example',
  'small_recall',
  'similar_problem',
  'check_again',
  'completed',
]);
export type WeakTopicRecoveryStage = z.infer<typeof WeakTopicRecoveryStageSchema>;

export const RevisionSaveModeSchema = z.enum(['quick_note', 'key_idea', 'practice_later']);
export type RevisionSaveMode = z.infer<typeof RevisionSaveModeSchema>;

export const RevisionReviewStatusSchema = z.enum([
  'new',
  'review_due',
  'practising',
  'improving',
  'strong',
  'needs_attention',
]);
export type RevisionReviewStatus = z.infer<typeof RevisionReviewStatusSchema>;

export const RevisionEventTypeSchema = z.enum([
  'review_started',
  'review_completed',
  'quiz_started',
  'quiz_answered',
  'mastery_changed',
  'note_updated',
  'source_opened',
  'similar_question_practised',
]);
export type RevisionEventType = z.infer<typeof RevisionEventTypeSchema>;

export const RevisionEventOutcomeSchema = z.enum(['correct', 'partial', 'struggled', 'completed', 'skipped']);
export type RevisionEventOutcome = z.infer<typeof RevisionEventOutcomeSchema>;

export const RevisionCollectionKindSchema = z.enum(['standard', 'bundle']);
export type RevisionCollectionKind = z.infer<typeof RevisionCollectionKindSchema>;

export const RevisionModeSourceTypeSchema = z.enum(['collection', 'items', 'queue', 'due', 'weak']);
export type RevisionModeSourceType = z.infer<typeof RevisionModeSourceTypeSchema>;

export const StudyPlanScopeSchema = z.enum([
  'weekly',
  'subject',
  'weak_topics',
  'exam_focus',
  'due_items',
  'month',
  'term',
  'semester',
]);
export type StudyPlanScope = z.infer<typeof StudyPlanScopeSchema>;

export const StudyGoalStatusSchema = z.enum(['not_started', 'in_progress', 'completed', 'paused']);
export type StudyGoalStatus = z.infer<typeof StudyGoalStatusSchema>;

export const StudyGoalTypeSchema = z.enum([
  'revise_due_items',
  'practise_topic',
  'fix_misconception',
  'complete_revision_session',
  'review_formulas',
  'revisit_weak_topic',
]);
export type StudyGoalType = z.infer<typeof StudyGoalTypeSchema>;

export const SubjectMasteryStatusSchema = z.enum(['not_started', 'emerging', 'practising', 'secure', 'needs_review']);
export type SubjectMasteryStatus = z.infer<typeof SubjectMasteryStatusSchema>;

export const TutorPolicyNextActionSchema = z.enum([
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
export type TutorPolicyNextAction = z.infer<typeof TutorPolicyNextActionSchema>;

export const TutorInterventionTypeSchema = z.enum([
  'simplify',
  'use_example',
  'revisit_prerequisite',
  'ask_recall',
  'similar_question',
  'worked_example',
  'compare_concepts',
  'slow_down',
]);
export type TutorInterventionType = z.infer<typeof TutorInterventionTypeSchema>;

export const InterventionOutcomeSchema = z.enum(['improved', 'no_change', 'struggled', 'completed', 'unknown']);
export type InterventionOutcome = z.infer<typeof InterventionOutcomeSchema>;
export const SupportedLearningLanguageSchema = z.enum(['english', 'swahili', 'arabic']);
export type SupportedLearningLanguage = z.infer<typeof SupportedLearningLanguageSchema>;
export const DetectedInputLanguageSchema = z.enum(['english', 'swahili', 'arabic', 'mixed', 'unknown']);
export type DetectedInputLanguage = z.infer<typeof DetectedInputLanguageSchema>;
export const LearningSupportModeSchema = z.enum([
  'strict_single_language',
  'bilingual_support',
  'translation_support',
  'learner_choice',
]);
export type LearningSupportMode = z.infer<typeof LearningSupportModeSchema>;
export const SimplicityLevelSchema = z.enum(['very_simple', 'simple', 'standard']);
export type SimplicityLevel = z.infer<typeof SimplicityLevelSchema>;
export const MetacognitiveConfidenceSchema = z.enum(['sure', 'partly_sure', 'confused']);
export type MetacognitiveConfidence = z.infer<typeof MetacognitiveConfidenceSchema>;
export const MetacognitiveProblemFramingSchema = z.enum([
  'concept',
  'formula',
  'definition',
  'comparison',
  'procedure',
  'application',
  'recall',
]);
export type MetacognitiveProblemFraming = z.infer<typeof MetacognitiveProblemFramingSchema>;
export const MetacognitiveErrorTypeSchema = z.enum([
  'concept_misunderstanding',
  'wrong_method',
  'skipped_step',
  'careless_error',
  'memory_gap',
  'not_sure_yet',
]);
export type MetacognitiveErrorType = z.infer<typeof MetacognitiveErrorTypeSchema>;
export const MetacognitiveStrategyPreferenceSchema = z.enum([
  'hint_helped',
  'example_helped',
  'breakdown_helped',
  'practice_helped',
  'compare_helped',
  'simpler_language_helped',
  'worked_step_helped',
]);
export type MetacognitiveStrategyPreference = z.infer<typeof MetacognitiveStrategyPreferenceSchema>;
export const MetacognitiveTransferReadinessSchema = z.enum([
  'can_reuse',
  'needs_more_practice',
  'can_explain',
  'still_unclear',
]);
export type MetacognitiveTransferReadiness = z.infer<typeof MetacognitiveTransferReadinessSchema>;
export const MetacognitivePromptTypeSchema = z.enum([
  'frame_problem',
  'check_confidence',
  'inspect_step',
  'locate_error',
  'explain_success',
  'transfer_learning',
  'choose_support',
  'reflect_checkin',
  'progress_check',
  'practice_readiness',
  'revision_recheck',
  'weak_topic_recovery',
]);
export type MetacognitivePromptType = z.infer<typeof MetacognitivePromptTypeSchema>;
export const SessionLanguageStateSchema = z.object({
  preferredResponseLanguage: SupportedLearningLanguageSchema,
  learningSupportMode: LearningSupportModeSchema.nullable().optional(),
  simplicityLevel: SimplicityLevelSchema.nullable().optional(),
  voiceOutputLanguage: SupportedLearningLanguageSchema.nullable().optional(),
  bilingualSupportLanguage: SupportedLearningLanguageSchema.nullable().optional(),
  lastDetectedInputLanguage: DetectedInputLanguageSchema.nullable().optional(),
  preferredLanguageMode: z.enum(['english', 'swahili', 'arabic', 'english_sw', 'arabic_english']).optional(),
});
export type SessionLanguageState = z.infer<typeof SessionLanguageStateSchema>;
export const ReflectionSignalSchema = z.object({
  confidence: StudentConfidenceSelfCheckSchema.nullable().optional(),
  supportPreference: StudentSupportPreferenceSchema.nullable().optional(),
  sourceTurnId: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
});
export type ReflectionSignal = z.infer<typeof ReflectionSignalSchema>;

export const MasteryEvidenceSignalSchema = z.object({
  topic: z.string(),
  subject: z.string().nullable().optional(),
  evidenceType: z.enum([
    'attempted_after_prompt',
    'correct_after_support',
    'repeated_mistake',
    'repeated_mistake_reduced',
    'similar_problem_success',
    'explain_back_success',
    'revision_reuse_success',
    'needed_multiple_hints',
    'support_strategy_helped',
    'support_strategy_failed',
  ]),
  weight: z.number().nullable().optional(),
});
export type MasteryEvidenceSignal = z.infer<typeof MasteryEvidenceSignalSchema>;

export const TopicMasteryStateSchema = z.object({
  topic: z.string(),
  subject: z.string().nullable().optional(),
  label: MicroMasteryLabelSchema,
  evidenceScore: z.number().optional(),
  evidenceCount: z.number().optional(),
  lastPracticedAt: z.string().nullable().optional(),
  recentImprovement: z.enum(['improving', 'flat', 'declining']).nullable().optional(),
  repeatedMistakeRate: z.number().nullable().optional(),
  supportDependenceLevel: z.number().nullable().optional(),
  summary: z.string().nullable().optional(),
  nextBestStep: z.string().nullable().optional(),
});
export type TopicMasteryState = z.infer<typeof TopicMasteryStateSchema>;

export const WeakTopicRecoveryStateSchema = z.object({
  topic: z.string(),
  subject: z.string().nullable().optional(),
  active: z.boolean(),
  stage: WeakTopicRecoveryStageSchema.nullable().optional(),
  triggerReason: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  prerequisiteFocus: z.string().nullable().optional(),
  simplerExample: z.string().nullable().optional(),
  recallQuestion: z.string().nullable().optional(),
  similarProblemPrompt: z.string().nullable().optional(),
  checkAgainPrompt: z.string().nullable().optional(),
});
export type WeakTopicRecoveryState = z.infer<typeof WeakTopicRecoveryStateSchema>;

export const MetacognitivePromptSchema = z.object({
  type: MetacognitivePromptTypeSchema,
  text: z.string(),
  variant: ReflectCardVariantSchema.nullable().optional(),
  supportPrompt: z.string().nullable().optional(),
  acknowledgement: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  topicMastery: TopicMasteryStateSchema.nullable().optional(),
  weakTopicRecovery: WeakTopicRecoveryStateSchema.nullable().optional(),
});
export type MetacognitivePrompt = z.infer<typeof MetacognitivePromptSchema>;

export const MetacognitiveStateSnapshotSchema = z.object({
  confidence: MetacognitiveConfidenceSchema.nullable().optional(),
  problemFraming: MetacognitiveProblemFramingSchema.nullable().optional(),
  errorType: MetacognitiveErrorTypeSchema.nullable().optional(),
  strategyPreference: MetacognitiveStrategyPreferenceSchema.nullable().optional(),
  transferReadiness: MetacognitiveTransferReadinessSchema.nullable().optional(),
  confidenceSelfCheck: StudentConfidenceSelfCheckSchema.nullable().optional(),
  supportPreference: StudentSupportPreferenceSchema.nullable().optional(),
  studentReflectionNote: z.string().nullable().optional(),
});
export type MetacognitiveStateSnapshot = z.infer<typeof MetacognitiveStateSnapshotSchema>;

export const RevisionMediaRefSchema = z.object({
  kind: z.enum(['artifact', 'image', 'document', 'video', 'audio', 'source']),
  id: z.string().optional(),
  label: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  mimeType: z.string().optional(),
  durationSec: z.number().optional(),
  artifactId: z.string().optional(),
  videoId: z.string().optional(),
  audioId: z.string().optional(),
  summary: z.string().optional(),
});
export type RevisionMediaRef = z.infer<typeof RevisionMediaRefSchema>;

export const RevisionCollectionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string(),
  subject: z.union([RevisionSubjectSchema, z.string()]).nullable().optional(),
  topic: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  kind: RevisionCollectionKindSchema.nullable().optional(),
  bundleSummary: z.string().nullable().optional(),
  featuredItemIds: z.array(z.string()).nullable().optional(),
  coverRef: z.record(z.any()).nullable().optional(),
  examFocus: z.boolean().optional(),
  pinned: z.boolean().optional(),
  itemCount: z.number().optional(),
  latestItemAt: z.string().optional(),
  previewItems: z.array(z.any()).optional(),
  sourceSessionId: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RevisionCollection = z.infer<typeof RevisionCollectionSchema>;

export const RevisionItemSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().nullable().optional(),
  sourceMessageId: z.string().nullable().optional(),
  collectionId: z.string().nullable().optional(),
  collectionTitle: z.string().nullable().optional(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  contentType: RevisionContentTypeSchema,
  subject: z.union([RevisionSubjectSchema, z.string()]).nullable().optional(),
  saveType: RevisionSaveTypeSchema.nullable().optional(),
  mediaType: RevisionMediaTypeSchema.nullable().optional(),
  topic: z.string().nullable().optional(),
  subtopic: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  artifactLabels: z.array(z.string()).optional(),
  selectedText: z.string().nullable().optional(),
  studentNote: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  mastery: RevisionMasterySchema.nullable().optional(),
  needsPractice: z.boolean().optional(),
  isMistakeBased: z.boolean().optional(),
  saveMode: RevisionSaveModeSchema.nullable().optional(),
  lastPracticedAt: z.string().nullable().optional(),
  practiceCount: z.number().optional(),
  reviewStatus: RevisionReviewStatusSchema.nullable().optional(),
  lastReviewedAt: z.string().nullable().optional(),
  nextReviewAt: z.string().nullable().optional(),
  reviewCount: z.number().optional(),
  successCount: z.number().optional(),
  struggleCount: z.number().optional(),
  recentOutcome: RevisionEventOutcomeSchema.nullable().optional(),
  confidenceTrend: z.enum(['up', 'steady', 'down']).nullable().optional(),
  examPriority: z.boolean().optional(),
  sourceType: z.union([RevisionSourceTypeSchema, z.string()]).nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  videoId: z.string().nullable().optional(),
  videoTitle: z.string().nullable().optional(),
  transcriptSnippet: z.string().nullable().optional(),
  audioRecapRef: z.record(z.any()).nullable().optional(),
  featuredRank: z.number().nullable().optional(),
  bundleRole: z.string().nullable().optional(),
  sourceRefs: z.array(SourceCitationSchema).optional(),
  mediaRefs: z.array(RevisionMediaRefSchema).optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RevisionItem = z.infer<typeof RevisionItemSchema>;

export const RevisionQueueSchema = z.object({
  dueNow: z.array(RevisionItemSchema),
  needsAttention: z.array(RevisionItemSchema),
  continuePractising: z.array(RevisionItemSchema),
  newItems: z.array(RevisionItemSchema),
  recentlyImproved: z.array(RevisionItemSchema),
});
export type RevisionQueue = z.infer<typeof RevisionQueueSchema>;

export const RevisionOverviewSchema = z.object({
  collections: z.array(RevisionCollectionSchema),
  recentItems: z.array(RevisionItemSchema),
  ungroupedItems: z.array(RevisionItemSchema),
  pinnedItems: z.array(RevisionItemSchema).optional(),
  mistakeItems: z.array(RevisionItemSchema).optional(),
  needsPracticeItems: z.array(RevisionItemSchema).optional(),
  queuePreview: RevisionQueueSchema.nullable().optional(),
  totalItems: z.number(),
  totalCollections: z.number(),
  ungroupedCount: z.number(),
  totalDueCount: z.number().optional(),
  totalNeedsAttentionCount: z.number().optional(),
  totalNewCount: z.number().optional(),
});
export type RevisionOverview = z.infer<typeof RevisionOverviewSchema>;

export const RevisionReviewEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  revisionItemId: z.string(),
  sessionId: z.string().nullable().optional(),
  eventType: RevisionEventTypeSchema,
  outcome: RevisionEventOutcomeSchema.nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
});
export type RevisionReviewEvent = z.infer<typeof RevisionReviewEventSchema>;

export const RevisionProgressOverviewSchema = z.object({
  totalDueCount: z.number(),
  totalNeedsAttentionCount: z.number(),
  totalNewCount: z.number(),
  totalStrongCount: z.number(),
  totalPractisedThisWeek: z.number().optional(),
  collectionProgress: z.array(z.object({
    collectionId: z.string(),
    title: z.string(),
    totalItems: z.number(),
    dueCount: z.number(),
    strongCount: z.number(),
    needsAttentionCount: z.number(),
  })).optional(),
});
export type RevisionProgressOverview = z.infer<typeof RevisionProgressOverviewSchema>;

export const RevisionGroupingSuggestionSchema = z.object({
  suggestionId: z.string(),
  title: z.string(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  itemIds: z.array(z.string()),
  reason: z.string(),
  suggestedKind: z.enum(['topic', 'subject', 'exam_bundle', 'media_bundle']).optional(),
});
export type RevisionGroupingSuggestion = z.infer<typeof RevisionGroupingSuggestionSchema>;

export const RevisionAudioRecapResultSchema = z.object({
  recapText: z.string(),
  audioUrl: z.string().nullable().optional(),
  audioDurationSec: z.number().nullable().optional(),
  fallbackToText: z.boolean().optional(),
});
export type RevisionAudioRecapResult = z.infer<typeof RevisionAudioRecapResultSchema>;

export const StudyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  scope: StudyPlanScopeSchema,
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  subjects: z.array(z.string()).nullable().optional(),
  dateRangeStart: z.string().nullable().optional(),
  dateRangeEnd: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  focusAreas: z.array(z.string()).nullable().optional(),
  recommendedBlocks: z.array(z.string()).nullable().optional(),
  suggestedCollectionIds: z.array(z.string()).nullable().optional(),
  suggestedItemIds: z.array(z.string()).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudyPlan = z.infer<typeof StudyPlanSchema>;

export const StudyGoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  studyPlanId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  goalType: StudyGoalTypeSchema,
  targetCount: z.number().nullable().optional(),
  currentCount: z.number(),
  status: StudyGoalStatusSchema,
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudyGoal = z.infer<typeof StudyGoalSchema>;

export const RevisionActionResponseSchema = z.object({
  sessionId: z.string(),
  item: RevisionItemSchema,
  actionType: z.preprocess(
    (value) => (value === 'explain' ? 'breakdown' : value),
    z.enum(['quiz', 'breakdown', 'similar_question'])
  ),
  message: z.lazy(() => MessageSchema),
  promptType: z.string(),
});
export type RevisionActionResponse = z.infer<typeof RevisionActionResponseSchema>;

export const SafeProgressSummarySchema = z.object({
  audience: z.enum(['parent', 'teacher']),
  periodLabel: z.string(),
  highlights: z.array(z.string()),
  focusAreas: z.array(z.string()),
  strengths: z.array(z.string()),
  needsSupport: z.array(z.string()),
  suggestedSupportActions: z.array(z.string()),
});
export type SafeProgressSummary = z.infer<typeof SafeProgressSummarySchema>;

export const WeakTopicSignalSchema = z.object({
  topic: z.string(),
  subject: z.string().nullable().optional(),
  subtopic: z.string().nullable().optional(),
  weaknessScore: z.number(),
  evidenceCount: z.number(),
  lastSeenAt: z.string().nullable().optional(),
  improving: z.boolean().optional(),
  reason: z.string().nullable().optional(),
  suggestedNextAction: z.string().nullable().optional(),
});
export type WeakTopicSignal = z.infer<typeof WeakTopicSignalSchema>;

export const LearningProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  strongerSubjects: z.array(z.string()).nullable().optional(),
  weakerSubjects: z.array(z.string()).nullable().optional(),
  recurringWeakTopics: z.array(z.object({
    topic: z.string(),
    subject: z.string().nullable().optional(),
    count: z.number().optional(),
  })).nullable().optional(),
  recurringMisconceptions: z.array(z.object({
    label: z.string(),
    topic: z.string().nullable().optional(),
    subject: z.string().nullable().optional(),
    count: z.number().optional(),
  })).nullable().optional(),
  preferredRevisionModes: z.array(z.string()).nullable().optional(),
  preferredExplanationStyle: z.string().nullable().optional(),
  studyConsistencySignals: z.record(z.any()).nullable().optional(),
  recentImprovementAreas: z.array(z.string()).nullable().optional(),
  evidenceSummary: z.record(z.any()).nullable().optional(),
  createdAt: z.string().optional(),
  lastUpdatedAt: z.string().optional(),
});
export type LearningProfile = z.infer<typeof LearningProfileSchema>;

export const AcademicMemoryEntrySchema = z.object({
  kind: z.enum([
    'misconception_pattern',
    'weak_topic_pattern',
    'improved_topic_pattern',
    'preferred_support_pattern',
    'revision_pattern',
  ]),
  summary: z.string(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  evidenceCount: z.number().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type AcademicMemoryEntry = z.infer<typeof AcademicMemoryEntrySchema>;

export const ConceptDependencySchema = z.object({
  id: z.string().optional(),
  subject: z.string(),
  topic: z.string(),
  subtopic: z.string().nullable().optional(),
  dependsOnTopic: z.string(),
  dependsOnSubtopic: z.string().nullable().optional(),
  relationshipType: z.enum(['prerequisite', 'supports', 'often_confused_with']),
  confidence: z.number().nullable().optional(),
  source: z.enum(['curated', 'inferred', 'tutor_defined']).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ConceptDependency = z.infer<typeof ConceptDependencySchema>;

export const TutorInterventionSuggestionSchema = z.object({
  title: z.string(),
  reason: z.string(),
  suggestedAction: z.string(),
  targetTopic: z.string().nullable().optional(),
  targetSubtopic: z.string().nullable().optional(),
  strategyType: z.enum([
    'simplify',
    'use_example',
    'revisit_prerequisite',
    'practice_more',
    'focus_misconception',
    'slow_down',
    'switch_mode',
  ]),
  confidence: z.number().nullable().optional(),
});
export type TutorInterventionSuggestion = z.infer<typeof TutorInterventionSuggestionSchema>;

export const TutorPolicyDecisionSchema = z.object({
  nextAction: TutorPolicyNextActionSchema,
  reason: z.string(),
  confidence: z.number().nullable().optional(),
  contextNotes: z.array(z.string()).nullable().optional(),
});
export type TutorPolicyDecision = z.infer<typeof TutorPolicyDecisionSchema>;

export const WhyThisNextExplanationSchema = z.object({
  title: z.string().nullable().optional(),
  shortReason: z.string(),
  supportingSignals: z.array(z.string()).nullable().optional(),
  sourceType: z.enum([
    'review_queue',
    'study_plan',
    'weak_topic',
    'dependency',
    'policy_decision',
    'mastery_pathway',
  ]).optional(),
});
export type WhyThisNextExplanation = z.infer<typeof WhyThisNextExplanationSchema>;

export const SubjectMasteryProgressSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  subject: z.string(),
  topic: z.string(),
  subtopic: z.string().nullable().optional(),
  status: SubjectMasteryStatusSchema,
  evidenceCount: z.number(),
  lastPracticedAt: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type SubjectMasteryProgress = z.infer<typeof SubjectMasteryProgressSchema>;

export const InterventionEffectivenessSummarySchema = z.object({
  interventionType: TutorInterventionTypeSchema,
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  evidenceCount: z.number(),
  improvementRate: z.number(),
  recentTrend: z.enum(['up', 'steady', 'down']),
});
export type InterventionEffectivenessSummary = z.infer<typeof InterventionEffectivenessSummarySchema>;

export const SchoolSafeReportSchema = z.object({
  periodLabel: z.string(),
  studentSummary: z.string(),
  subjectFocus: z.string().nullable().optional(),
  strengths: z.array(z.string()),
  needsSupport: z.array(z.string()),
  revisionPatterns: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
  privacyNotes: z.array(z.string()).nullable().optional(),
});
export type SchoolSafeReport = z.infer<typeof SchoolSafeReportSchema>;

export const ResearchIntentSchema = z.enum([
  'source_backed_explanation',
  'verification',
  'topic_research',
  'current_events',
  'artifact_followup',
  'misconception_research',
]);
export type ResearchIntent = z.infer<typeof ResearchIntentSchema>;

export const ResearchTriggerTypeSchema = z.enum([
  'mode_explicit',
  'explicit_user_request',
  'research_action',
  'intent_gate',
  'followup_reverify',
  'followup_reuse',
]);
export type ResearchTriggerType = z.infer<typeof ResearchTriggerTypeSchema>;

export const ResearchConfidenceStateSchema = z.enum(['high', 'medium', 'low', 'mixed', 'insufficient']);
export type ResearchConfidenceState = z.infer<typeof ResearchConfidenceStateSchema>;

export const SourceTrustTierSchema = z.enum(['high', 'medium', 'limited']);
export type SourceTrustTier = z.infer<typeof SourceTrustTierSchema>;

export const ResearchSourceSchema = z.object({
  title: z.string(),
  url: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  sourceType: z.string().nullable().optional(),
  trustTier: SourceTrustTierSchema.nullable().optional(),
  relevanceReason: z.string().nullable().optional(),
  recencyReason: z.string().nullable().optional(),
  educationalFit: z.string().nullable().optional(),
});
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

export const ResearchNoticeSchema = z.object({
  code: z.enum([
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
  ]),
  message: z.string(),
  severity: z.enum(['info', 'warning']).optional(),
});
export type ResearchNotice = z.infer<typeof ResearchNoticeSchema>;

export const ResearchLatencyStateSchema = z.object({
  startedAt: z.string().optional(),
  firstUsefulAt: z.string().optional(),
  completedAt: z.string().optional(),
  firstUsefulLatencyMs: z.number().optional(),
  completedLatencyMs: z.number().optional(),
});
export type ResearchLatencyState = z.infer<typeof ResearchLatencyStateSchema>;

export const ResearchSourceContextSchema = z.object({
  sourceReuseId: z.string().optional(),
  queryUsed: z.string().optional(),
  sourceCount: z.number().optional(),
  reuseHit: z.boolean().optional(),
  queryPlan: z.array(z.string()).optional(),
});
export type ResearchSourceContext = z.infer<typeof ResearchSourceContextSchema>;

export const ResearchResultSchema = z.object({
  summary: z.string(),
  sources: z.array(ResearchSourceSchema),
  trustSummary: z.string().nullable().optional(),
  limitations: z.array(z.string()).nullable().optional(),
  nextStepPrompt: z.string().nullable().optional(),
  queryPlan: z.array(z.string()).optional(),
  searchCount: z.number().optional(),
  sourceReuseId: z.string().optional(),
  reuseHit: z.boolean().optional(),
  confidenceState: ResearchConfidenceStateSchema.optional(),
  triggerType: ResearchTriggerTypeSchema.optional(),
  latencyMs: z.number().optional(),
  firstUsefulLatencyMs: z.number().optional(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

export const VideoRecommendationIntentSchema = z.enum([
  'concept_explainer',
  'worked_example',
  'revision_recap',
  'visual_animation',
  'exam_help',
  'beginner_friendly',
  'misconception_fix',
  'language_support',
]);
export type VideoRecommendationIntent = z.infer<typeof VideoRecommendationIntentSchema>;

export const RecommendedVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  transcriptAvailable: z.boolean().nullable().optional(),
  language: z.string().nullable().optional(),
  intent: VideoRecommendationIntentSchema.nullable().optional(),
  whyRecommended: z.string().nullable().optional(),
  trustTier: SourceTrustTierSchema.nullable().optional(),
});
export type RecommendedVideo = z.infer<typeof RecommendedVideoSchema>;

export const VideoRecommendationResultSchema = z.object({
  intent: VideoRecommendationIntentSchema,
  queryUsed: z.string(),
  summary: z.string(),
  videos: z.array(RecommendedVideoSchema),
  notices: z.array(ResearchNoticeSchema).nullable().optional(),
});
export type VideoRecommendationResult = z.infer<typeof VideoRecommendationResultSchema>;

export const VideoContextSummarySchema = z.object({
  videoId: z.string(),
  title: z.string().nullable().optional(),
  transcriptAvailable: z.boolean(),
  transcriptExcerpt: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  concepts: z.array(z.string()),
  whyRecommended: z.string().nullable().optional(),
  notices: z.array(ResearchNoticeSchema).nullable().optional(),
});
export type VideoContextSummary = z.infer<typeof VideoContextSummarySchema>;

export const LearningEffectEventSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  sessionId: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  revisionItemId: z.string().nullable().optional(),
  messageId: z.string().nullable().optional(),
  eventType: z.string(),
  outcome: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.string().optional(),
});
export type LearningEffectEvent = z.infer<typeof LearningEffectEventSchema>;

export const RevisionVitalitySummarySchema = z.object({
  vitality: z.enum(['strong', 'mixed', 'weak']),
  reusedRate: z.number().optional(),
  staleSaveRate: z.number().optional(),
  quizActivationRate: z.number().optional(),
  notes: z.array(z.string()),
});
export type RevisionVitalitySummary = z.infer<typeof RevisionVitalitySummarySchema>;

export const ProductConstitutionHealthSchema = z.object({
  passivityRisk: z.enum(['low', 'medium', 'high']),
  revisionVitality: z.enum(['strong', 'mixed', 'weak']),
  tutoringDiscipline: z.enum(['strong', 'mixed', 'weak']),
  multilingualConsistency: z.enum(['strong', 'mixed', 'weak']),
  trustAndHonesty: z.enum(['strong', 'mixed', 'weak']),
  notes: z.array(z.string()),
});
export type ProductConstitutionHealth = z.infer<typeof ProductConstitutionHealthSchema>;

export const LearningEffectivenessSummarySchema = z.object({
  periodLabel: z.string(),
  totalEvents: z.number(),
  effortSignals: z.record(z.number()),
  learningSignals: z.record(z.number()),
  tutorEffectivenessSignals: z.record(z.number()),
  productIntegritySignals: z.record(z.number()),
  voiceSignals: z.record(z.number()),
  researchVideoSignals: z.record(z.number()),
  multilingualSignals: z.record(z.number()),
  revisionVitality: RevisionVitalitySummarySchema,
  notes: z.array(z.string()),
});
export type LearningEffectivenessSummary = z.infer<typeof LearningEffectivenessSummarySchema>;

export const FounderTruthSummarySchema = z.object({
  periodLabel: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  emergingRisks: z.array(z.string()),
  promisingSignals: z.array(z.string()),
  interventionInsights: z.array(z.string()),
  revisionInsights: z.array(z.string()),
  multilingualInsights: z.array(z.string()),
  voiceInsights: z.array(z.string()),
  researchVideoInsights: z.array(z.string()),
  recommendedNextFixes: z.array(z.string()),
});
export type FounderTruthSummary = z.infer<typeof FounderTruthSummarySchema>;

export const TutorQuickActionSchema = z.preprocess(
  (value) => (value === 'explain' ? 'breakdown' : value),
  z.enum([
    'hint',
    'breakdown',
    'summarize',
    'practice',
    'save',
  ])
);
export type TutorQuickAction = z.infer<typeof TutorQuickActionSchema>;

export const TutorActionIdSchema = z.preprocess(
  (value) => (value === 'explain' ? 'breakdown' : value),
  z.enum([
    'ask',
    'hint',
    'breakdown',
    'summarize',
    'practice',
    'save',
  ])
);
export type TutorActionId = z.infer<typeof TutorActionIdSchema>;

export const SelectionSourceKindSchema = z.enum([
  'assistant_message',
  'user_message',
  'artifact',
  'video_summary',
  'study_material',
]);
export type SelectionSourceKind = z.infer<typeof SelectionSourceKindSchema>;

export const AssistantCardKindSchema = z.enum([
  'guided_step',
  'hint',
  'breakdown',
  'summary',
  'explanation',
  'practice',
  'correction',
  'source_supported',
]);
export type AssistantCardKind = z.infer<typeof AssistantCardKindSchema>;

export const SourceConfidenceSchema = z.enum(['high', 'medium', 'limited']);
export type SourceConfidence = z.infer<typeof SourceConfidenceSchema>;

export const UiToneSchema = z.enum(['calm', 'encouraging', 'corrective', 'reflective']);
export type UiTone = z.infer<typeof UiToneSchema>;
export const AssistantTurnTypeSchema = z.enum([
  'explanation',
  'correction',
  'recovery',
  'checkpoint',
  'save_ready',
  'exam',
  'focus',
  'research',
  'celebration_light',
  'revision_handoff',
]);
export type AssistantTurnType = z.infer<typeof AssistantTurnTypeSchema>;

export const SystemNoticeSeveritySchema = z.enum(['info', 'warning', 'error']);
export type SystemNoticeSeverity = z.infer<typeof SystemNoticeSeveritySchema>;

export const SystemNoticeSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: SystemNoticeSeveritySchema,
});
export type SystemNotice = z.infer<typeof SystemNoticeSchema>;

export const MessagePresentationMetaSchema = z.object({
  cardKind: AssistantCardKindSchema.optional(),
  turnType: AssistantTurnTypeSchema.optional(),
  nextStepPrompt: z.string().optional(),
  suggestedActions: z.array(TutorQuickActionSchema).optional(),
  awaitingStudentAttempt: z.boolean().optional(),
  basedOnArtifactLabel: z.string().optional(),
  basedOnVideoTitle: z.string().optional(),
  sourceConfidence: SourceConfidenceSchema.optional(),
  uiTone: UiToneSchema.optional(),
  reflectionPrompt: z.string().optional(),
  reflectionPromptType: MetacognitivePromptTypeSchema.optional(),
  reflectCard: MetacognitivePromptSchema.nullable().optional(),
  inlineReflectionPrompt: z.string().optional(),
  inlineReflectionType: MetacognitivePromptTypeSchema.optional(),
  reflectLevel: z.enum(['silent', 'inline', 'full']).optional(),
  reflectSequenceId: z.string().optional(),
  reflectEligibilityScore: z.number().optional(),
  topicMastery: TopicMasteryStateSchema.nullable().optional(),
  weakTopicRecovery: WeakTopicRecoveryStateSchema.nullable().optional(),
  confidenceCheckSuggested: z.boolean().optional(),
  errorCheckSuggested: z.boolean().optional(),
  transferCheckSuggested: z.boolean().optional(),
  strategyCheckSuggested: z.boolean().optional(),
});
export type MessagePresentationMeta = z.infer<typeof MessagePresentationMetaSchema>;

export const MessageEditHistoryEntrySchema = z.object({
  content: z.string(),
  editedAt: z.string(),
});

export const MessageEditMetaSchema = z.object({
  edited: z.boolean().optional(),
  editedAt: z.string().optional(),
  originalContent: z.string().optional(),
  editHistory: z.array(MessageEditHistoryEntrySchema).optional(),
});
export type MessageEditMeta = z.infer<typeof MessageEditMetaSchema>;

export const TutorActionRequestSchema = z.object({
  id: TutorActionIdSchema,
  sourceMessageId: z.string().optional(),
  sourceText: z.string().optional(),
  selectedText: z.string().optional(),
  sourceVideoId: z.string().optional(),
  sourceVideoTitle: z.string().optional(),
  sourceArtifactLabel: z.string().optional(),
  sourceArtifactSummary: z.string().optional(),
  invokedFrom: z.enum(['assistant_card', 'selection_menu', 'composer']).optional(),
  selectionSourceKind: SelectionSourceKindSchema.optional(),
  inputOrigin: z.enum(['text', 'pasted_question', 'worksheet_followup', 'camera_capture', 'file_upload']).optional(),
  composerIntent: z.string().optional(),
  linkedArtifactId: z.string().optional(),
});
export type TutorActionRequest = z.infer<typeof TutorActionRequestSchema>;

export const TutorRevisionNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  topic: z.string().optional(),
  sourceMessageId: z.string().optional(),
  createdAt: z.string(),
  subject: z.string().optional(),
  artifactLabels: z.array(z.string()).optional(),
  basedOnVideoTitle: z.string().optional(),
  summary: z.string().optional(),
  contentType: RevisionContentTypeSchema.optional(),
  collectionId: z.string().optional(),
  collectionTitle: z.string().optional(),
});
export type TutorRevisionNote = z.infer<typeof TutorRevisionNoteSchema>;

export const TutorActionUiMetaSchema = z.object({
  actionId: TutorActionIdSchema.optional(),
  statusLine: z.string().optional(),
  nextStep: z.string().optional(),
  savedRevisionNote: TutorRevisionNoteSchema.optional(),
});
export type TutorActionUiMeta = z.infer<typeof TutorActionUiMetaSchema>;

export const TutorStateSchema = z.object({
  activeTopic: z.string().optional(),
  activeSubject: z.string().optional(),
  activeArtifactSummary: z.string().optional(),
  activeArtifactLabels: z.array(z.string()).optional(),
  activeVideoId: z.string().optional(),
  activeVideoTitle: z.string().optional(),
  activeVideoSummary: z.string().optional(),
  activeVideoConcepts: z.array(z.string()).optional(),
  activeVideoWhyRecommended: z.string().optional(),
  lastIntent: z.string().optional(),
  misconceptionFocus: z.array(z.string()).optional(),
  masteryFocus: z.array(z.string()).optional(),
  learnerStage: z.enum(['support', 'developing', 'secure']).optional(),
  recommendedMode: z.enum(['guided', 'practice', 'challenge']).optional(),
  recentGoals: z.array(z.string()).optional(),
  islamicContext: z.string().optional(),
  semanticMemory: z.string().optional(),
  teacherCorrections: z.array(z.string()).optional(),
  studentPreferences: z.array(z.string()).optional(),
  evidenceReferences: z.array(z.string()).optional(),
  visibleFocusLabel: z.string().optional(),
  visibleStageLabel: z.string().optional(),
  awaitingStudentAttempt: z.boolean().optional(),
  currentStudyMode: z.string().optional(),
  systemNotices: z.array(SystemNoticeSchema).optional(),
  sessionLanguageState: SessionLanguageStateSchema.optional(),
  metacognitiveState: MetacognitiveStateSnapshotSchema.nullable().optional(),
  reflectionSignal: ReflectionSignalSchema.nullable().optional(),
  lastReflectAt: z.string().optional(),
  lastReflectTopic: z.string().optional(),
  lastReflectType: z.string().optional(),
  reflectSequenceId: z.string().optional(),
  reflectEligibilityScore: z.number().optional(),
  reflectAnsweredRecently: z.boolean().optional(),
  reflectDismissedRecently: z.boolean().optional(),
  topicMastery: TopicMasteryStateSchema.nullable().optional(),
  weakTopicRecovery: WeakTopicRecoveryStateSchema.nullable().optional(),
  preferredSupportPatterns: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
});
export type TutorState = z.infer<typeof TutorStateSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model']),
  content: z.string(),
  timestamp: z.date().optional(),
  videoData: VideoDataSchema.optional(),
  image: ImageSchema.optional(),
  isError: z.boolean().optional(),
  sources: z.array(z.any()).optional(),
  metadata: z.any().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const DailyObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  completed: z.boolean(),
});
export type DailyObjective = z.infer<typeof DailyObjectiveSchema>;

export const ConversationStateSchema = z.object({
  researchModeActive: z.boolean().default(false),
  researchReady: z.boolean().optional(),
  lastSearchTopic: z.array(z.string()).optional(),
  researchQuery: z.string().optional(),
  retrievedSourceSet: z.array(ResearchSourceSchema).optional(),
  sourceReuseId: z.string().optional(),
  researchSourceContext: ResearchSourceContextSchema.optional(),
  inferredSchoolLevel: z.string().optional(),
  inferredLanguage: z.string().optional(),
  researchLatencyState: ResearchLatencyStateSchema.optional(),
  confidenceState: ResearchConfidenceStateSchema.optional(),
  advancedOptions: z
    .object({
      includeVideos: z.boolean().optional(),
      level: z.string().optional(),
      language: z.string().optional(),
    })
    .nullable()
    .optional(),
  lastStudyTopic: z.string().optional(),
  awaitingPracticeQuestionInvitationResponse: z.boolean().default(false),
  activePracticeQuestion: z.string().optional(),
  awaitingPracticeQuestionAnswer: z.boolean().default(false),
  validationAttemptCount: z.number().default(0),
  lastAssistantMessage: z.string().optional(),
  sensitiveContentDetected: z.boolean().default(false),
  videoSuggested: z.boolean().default(false),
  usedExamples: z.array(z.string()).optional(),
  lastAttachmentContextSummary: z.string().optional(),
  lastAttachmentLabels: z.array(z.string()).optional(),
  lastSuggestedVideo: VideoDataSchema.optional(),
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(), // Marking as optional since backend uses 'topic'
  topic: z.string().nullable().optional(),
  messages: z.array(MessageSchema).optional(),
  createdAt: z.string(), // Expecting string from API
  updatedAt: z.string(), // Expecting string from API
  metadata: z.any().optional(),
  conversationState: ConversationStateSchema.optional(), // Added conversationState
  tutorState: TutorStateSchema.optional(),
});
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const UserProfileSchema = z.object({
  userId: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  gradeLevel: z.string().nullable().optional(),
  preferredLanguage: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(), // Changed from topInterests
  profileCompleted: z.boolean().optional(),
  // The 'preferences' field can still exist if the backend sends a more complex object,
  // but for direct access in frontend components, 'preferredLanguage' and 'interests' are now direct properties.
  preferences: z.any().optional(),
  favoriteShows: z.any().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type UserIntent = 'Accept' | 'Decline' | 'NewTopic' | 'Search' | 'GeneralResponse' | 'ExitResearch' | 'Answer' | 'Clarify' | 'ConfirmAccept' | 'ConfirmDecline' | 'Curious' | 'Unsure' | 'RandomSilly' | 'InsultAngry' | 'VideoRequest';
