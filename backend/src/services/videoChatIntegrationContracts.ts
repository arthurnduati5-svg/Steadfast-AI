// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Chat Integration Contracts v1
// Domain: live chat pipeline ↔ video recommendation integration
// Safe, bounded types for trigger, request, safety, response.
// ─────────────────────────────────────────────────────────────

export type VideoChatTriggerReason =
  | 'intent_video_help'
  | 'intent_explain_video_context'
  | 'intent_recommend_video'
  | 'task_video_context'
  | 'message_video_request'
  | 'artifact_video_support'
  | 'practice_mastery_video_support'
  | 'not_triggered';

export type VideoChatIntegrationStatus =
  | 'not_requested'
  | 'triggered'
  | 'recommended'
  | 'needs_clarification'
  | 'no_candidates'
  | 'needs_teacher_review'
  | 'blocked'
  | 'error';

export interface VideoChatRecommendationMeta {
  status: VideoChatIntegrationStatus;
  triggerReasons: VideoChatTriggerReason[];
  requestSummary: {
    subject?: string | null;
    topic?: string | null;
    skillIds?: string[];
    activeArtifactIds?: string[];
    languagePreference?: string | null;
    learnerAge?: number | null;
    gradeLevel?: string | null;
  };
  recommendations: Array<{
    recommendationId: string;
    title?: string | null;
    url?: string | null;
    channelTitle?: string | null;
    status: string;
    decision: string;
    finalScore: number;
    reasons: string[];
    warnings: string[];
  }>;
  reviewQueue: Array<{
    recommendationId: string;
    title?: string | null;
    status: string;
    decision: string;
    reasons: string[];
    warnings: string[];
  }>;
  rejectedCount: number;
  warnings: string[];
}

export interface VideoChatTriggerResult {
  shouldTrigger: boolean;
  reasons: VideoChatTriggerReason[];
  confidence: number;
  warnings: string[];
}

export interface VideoChatRequestBuilderInput {
  identity: { schoolId: string; studentId: string; userId?: string };
  message: string;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  activeArtifactIds?: string[];
  learnerAge?: number | null;
  gradeLevel?: string | null;
  languagePreference?: string | null;
  schoolPolicyProfileId?: string | null;
  sessionId?: string | null;
}

export interface VideoChatComposerOutput {
  answerAddon: string;
  videoMeta: VideoChatRecommendationMeta;
  warnings: string[];
}

export interface VideoChatSafetyInput {
  recommendations: Array<{
    recommendationId: string;
    status: string;
    decision: string;
    candidate: { url?: string | null; title?: string | null; channelTitle?: string | null };
    score: { finalScore: number };
    reasons: string[];
    warnings: string[];
    safety: { status: string; reasons: string[]; warnings: string[] };
  }>;
  rejected: Array<{
    recommendationId: string;
    status: string;
    decision: string;
    candidate: { url?: string | null; title?: string | null };
  }>;
  reviewQueue: Array<{
    recommendationId: string;
    status: string;
    decision: string;
    candidate: { url?: string | null; title?: string | null };
    reasons: string[];
    warnings: string[];
  }>;
  includeDebug?: boolean;
}
