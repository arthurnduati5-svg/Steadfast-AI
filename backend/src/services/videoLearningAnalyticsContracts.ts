// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Analytics Contracts v1
// Domain: video learning analytics, weakness loop detection,
// video effectiveness scoring, teacher visibility, intervention
// recommendations.
// ─────────────────────────────────────────────────────────────

// ── Analytics Event Types ──

export type VideoLearningAnalyticsEventType =
  | 'video_recommended'
  | 'video_opened'
  | 'video_started'
  | 'video_progressed'
  | 'video_meaningful_progress'
  | 'video_completed'
  | 'video_abandoned'
  | 'video_reflection_requested'
  | 'video_reflection_submitted'
  | 'video_reflection_evaluated'
  | 'post_video_practice_generated'
  | 'post_video_practice_started'
  | 'post_video_practice_completed'
  | 'post_video_practice_failed'
  | 'post_video_practice_improved'
  | 'reteach_recommended'
  | 'teacher_intervention_recommended';

export type VideoLearningEvidenceStrength =
  | 'passive_engagement'
  | 'reflection_signal'
  | 'practice_signal'
  | 'mastery_signal'
  | 'teacher_attention_signal';

export type VideoLearningAnalyticsVisibility =
  | 'student_private'
  | 'teacher_summary'
  | 'teacher_intervention'
  | 'admin_aggregate'
  | 'system_internal';

export type VideoLearningRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'blocked';

export type VideoLearningTrend =
  | 'improving'
  | 'stable'
  | 'declining'
  | 'insufficient_data';

export type VideoInterventionAction =
  | 'no_action'
  | 'reteach_topic'
  | 'assign_foundation_practice'
  | 'assign_similar_practice'
  | 'teacher_check_in'
  | 'recommend_alternative_video'
  | 'review_artifact_question'
  | 'advance_to_challenge'
  | 'blocked';

// ── Core Analytics Types ──

export interface VideoLearningAnalyticsEvent {
  eventId: string;
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  artifactId?: string | null;
  questionId?: string | null;
  videoId?: string | null;
  recommendationId?: string | null;
  watchSessionId?: string | null;
  sourceEventType: string;
  normalizedEventType: VideoLearningAnalyticsEventType;
  eventTime: string;
  confidence: 'low' | 'medium' | 'high';
  evidenceStrength: VideoLearningEvidenceStrength;
  visibility: VideoLearningAnalyticsVisibility;
  metadata: Record<string, unknown>;
  warnings: string[];
}

export interface StudentVideoLearningSummary {
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  timeWindow: {
    from?: string | null;
    to?: string | null;
  };
  videosRecommended: number;
  videosOpened: number;
  videosWithMeaningfulProgress: number;
  videosCompleted: number;
  reflectionsSubmitted: number;
  postVideoPracticeGenerated: number;
  postVideoPracticeCompleted: number;
  improvementSignals: number;
  weaknessSignals: number;
  currentTrend: VideoLearningTrend;
  topWeaknesses: VideoWeaknessLoopSummary[];
  recommendedActions: VideoStudentInterventionRecommendation[];
  warnings: string[];
}

export interface VideoEffectivenessSummary {
  videoId: string;
  provider?: string | null;
  title?: string | null;
  topic?: string | null;
  skillId?: string | null;
  learnersRecommended: number;
  learnersOpened: number;
  learnersMeaningfulProgress: number;
  learnersReflected: number;
  learnersImprovedAfterPractice: number;
  learnersStillWeak: number;
  effectivenessScore: number;
  confidence: 'low' | 'medium' | 'high';
  shouldContinueRecommending: boolean;
  reasons: string[];
  warnings: string[];
}

export interface VideoWeaknessLoopSummary {
  studentId: string;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  repeatedWeaknessCount: number;
  videoSupportUsed: boolean;
  reflectionQuality?: string | null;
  postVideoPracticeOutcome?: string | null;
  trend: VideoLearningTrend;
  riskLevel: VideoLearningRiskLevel;
  recommendedAction: VideoInterventionAction;
  evidenceRefs: string[];
  warnings: string[];
}

export interface VideoStudentInterventionRecommendation {
  recommendationId: string;
  studentId: string;
  action: VideoInterventionAction;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  evidenceSummary: string;
  teacherSafeExplanation: string;
  learnerSafeExplanation?: string | null;
  confidence: 'low' | 'medium' | 'high';
  evidenceRefs: string[];
  warnings: string[];
}

// ── Request/Response Contracts ──

export interface TeacherVideoAnalyticsRequest {
  teacherId?: string | null;
  schoolId: string;
  classId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  studentId?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number | null;
}

export interface TeacherVideoAnalyticsResponse {
  status: 'ok' | 'empty' | 'forbidden' | 'invalid_request' | 'error';
  classSummary?: {
    schoolId: string;
    classId?: string | null;
    studentsAnalyzed: number;
    studentsNeedingAttention: number;
    topicsNeedingReteach: string[];
    videosNeedingReview: string[];
    generatedAt: string;
  };
  studentSummaries: StudentVideoLearningSummary[];
  videoEffectiveness: VideoEffectivenessSummary[];
  interventions: VideoStudentInterventionRecommendation[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

// ── Scoped Identifiers ──

export interface StudentAnalyticsScope {
  studentId: string;
  schoolId: string;
  classId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface TeacherAnalyticsScope {
  teacherId?: string | null;
  schoolId: string;
  classId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  studentIds?: string[];
  from?: string | null;
  to?: string | null;
}
