// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Chat Request Builder v1
// Builds a VideoRecommendationRequest from authenticated chat
// turn context: identity, TutorTurnContext, IntentResolution,
// learner memory, practice/mastery, artifacts, language, age.
// ─────────────────────────────────────────────────────────────

import type { VideoRecommendationRequest, VideoCandidateInput } from './videoRecommendationContracts';
import type { VideoChatRequestBuilderInput } from './videoChatIntegrationContracts';
import type { TutorIntentResolution } from './intentResolverContracts';
import type { TutorTurnContext } from './tutorStateContracts';

export class VideoChatRequestBuilder {
  /**
   * Build a VideoRecommendationRequest from available chat context.
   * Uses authenticated identity only. Does NOT use body-provided schoolId/studentId.
   * Falls back safely when topic is missing.
   */
  buildVideoRecommendationRequestFromChat(input: {
    identity: { schoolId: string; studentId: string; userId?: string };
    message: string;
    intentResolution: TutorIntentResolution | null;
    tutorContext: TutorTurnContext | null;
    triggerReasons: string[];
    manualCandidates?: VideoCandidateInput[];
    maxResults?: number;
  }): VideoRecommendationRequest {
    // ── Resolve topic — TutorTurnContext first, then IntentResolution, then message ──
    const activeTopic =
      input.tutorContext?.session?.activeTopic ||
      input.tutorContext?.tutorState?.activeTopic ||
      input.intentResolution?.task?.topic ||
      input.intentResolution?.contextUse?.activeTopic ||
      null;

    const activeSubject =
      input.tutorContext?.session?.activeSubject ||
      input.tutorContext?.tutorState?.activeSubject ||
      input.intentResolution?.task?.subject ||
      input.intentResolution?.contextUse?.activeSubject ||
      null;

    const activeSkillIds =
      input.tutorContext?.session?.activeSkillIds ||
      input.tutorContext?.tutorState?.activeSkillIds ||
      [];

    const activeArtifactIds =
      input.tutorContext?.artifactContext?.activeArtifactIds ||
      [];

    // ── Learner preferences from profile ──
    const learnerProfile = input.tutorContext?.learnerProfile;
    const languagePreference = (learnerProfile as Record<string, unknown>)?.languagePreference as string | null || null;
    const learnerAge = (learnerProfile as Record<string, unknown>)?.age as number | null || null;
    const gradeLevel = (learnerProfile as Record<string, unknown>)?.gradeLevel as string | null || null;

    // ── Build query from topic or message ──
    const query = activeTopic || input.message || null;

    // ── Build request ──
    const request: VideoRecommendationRequest = {
      sessionId: input.tutorContext?.session?.sessionId || null,
      message: input.message || null,
      subject: activeSubject,
      topic: activeTopic,
      skillIds: activeSkillIds,
      learnerAge: learnerAge ?? null,
      gradeLevel: gradeLevel ?? null,
      languagePreference: languagePreference ?? null,
      activeArtifactIds: activeArtifactIds,
      candidates: input.manualCandidates || [],
      query: query,
      maxResults: input.maxResults ?? 3, // Default 3 for chat responses
      includeProviderSearch: false, // Default off — only provider search when configured
      includeTeacherReviewItems: false,
    };

    return request;
  }
}

export const videoChatRequestBuilder = new VideoChatRequestBuilder();
