// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Contracts v1
// Domain: video ranking, recommendation, policy, suitability
// ─────────────────────────────────────────────────────────────

export type VideoProvider = 'youtube' | 'manual' | 'school_library' | 'unknown';
export type VideoCandidateSource = 'provider_search' | 'teacher_submitted' | 'artifact_linked' | 'chat_context' | 'manual_candidate' | 'cached_candidate';
export type VideoRecommendationStatus = 'recommended' | 'not_recommended' | 'needs_review' | 'insufficient_metadata' | 'error';
export type VideoSafetyStatus = 'safe' | 'needs_review' | 'unsafe' | 'unknown';
export type VideoRankingDecision = 'include' | 'include_with_warning' | 'needs_teacher_review' | 'exclude';
export type IslamicAppropriatenessStatus = 'aligned' | 'acceptable' | 'needs_review' | 'not_aligned' | 'unknown';
export type AgeSuitabilityStatus = 'suitable' | 'borderline' | 'needs_review' | 'not_suitable' | 'unknown';
export type LanguageSuitabilityStatus = 'suitable' | 'needs_review' | 'not_suitable' | 'unknown';

export type IslamicAppropriatenessMode = 'strict' | 'balanced' | 'teacher_review' | 'custom';

export interface VideoCandidateInput {
  provider: VideoProvider;
  providerVideoId?: string | null;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  channelTitle?: string | null;
  language?: string | null;
  transcriptSummary?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  source: VideoCandidateSource;
}

export interface VideoMetadata {
  provider: VideoProvider;
  providerVideoId: string;
  canonicalUrl?: string | null;
  title: string;
  description?: string | null;
  channelId?: string | null;
  channelTitle?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  captionAvailable?: boolean | null;
  defaultLanguage?: string | null;
  defaultAudioLanguage?: string | null;
  categoryId?: string | null;
  madeForKids?: boolean | null;
  embeddable?: boolean | null;
  regionAllowed?: string[];
  regionBlocked?: string[];
  contentRatings?: Record<string, string>;
  statistics?: { viewCount?: number | null; likeCount?: number | null; commentCount?: number | null };
  thumbnailUrls?: string[];
  fetchedAt: string;
  metadataConfidence: number;
}

export interface VideoScoreBreakdown {
  syllabusAlignment: number;
  topicRelevance: number;
  learnerNeedFit: number;
  ageSuitability: number;
  islamicAppropriateness: number;
  languageSuitability: number;
  teachingQuality: number;
  sourceTrust: number;
  accessibility: number;
  availability: number;
  finalScore: number;
}

export interface VideoSafetyReview {
  status: VideoSafetyStatus;
  reasons: string[];
  warnings: string[];
}

export interface IslamicAppropriatenessReview {
  status: IslamicAppropriatenessStatus;
  confidence: number;
  reasons: string[];
  warnings: string[];
  needsTeacherReview: boolean;
}

export interface VideoSuitabilityReview {
  ageSuitability: { status: AgeSuitabilityStatus; reasons: string[] };
  islamicAppropriateness: IslamicAppropriatenessReview;
  languageSuitability: { status: LanguageSuitabilityStatus; reasons: string[] };
}

// ── New scoring types (v1.1: added for Video Ranking v1) ──

export type VideoScoreLabel =
  | 'excellent'
  | 'good'
  | 'acceptable'
  | 'weak'
  | 'blocked'
  | 'unknown';

export type VideoScoreConfidence =
  | 'low'
  | 'medium'
  | 'high';

export interface VideoScoreDetail {
  score: number;
  label: VideoScoreLabel;
  reason: string;
  confidence: VideoScoreConfidence;
  evidence: string[];
  warnings: string[];
}

export interface VideoRankingScores {
  syllabusAlignmentScore: VideoScoreDetail;
  topicRelevanceScore: VideoScoreDetail;
  ageSuitabilityScore: VideoScoreDetail;
  islamicAppropriatenessScore: VideoScoreDetail;
  languageSuitabilityScore: VideoScoreDetail;
  teachingQualityScore: VideoScoreDetail;
  durationSuitabilityScore: VideoScoreDetail;
  transcriptAvailabilityScore: VideoScoreDetail;
  sourceTrustScore: VideoScoreDetail;
  learnerFitScore: VideoScoreDetail;
  safetyScore: VideoScoreDetail;
  overallScore: number;
  blocked: boolean;
  blockReasons: string[];
}

export interface RankedVideoRecommendation {
  candidate: VideoCandidateInput;
  scores: VideoRankingScores;
  rank: number;
  recommendationReason: string;
  learnerFacingReason: string;
  tutorUseHint: string;
  warnings: string[];
}

export interface VideoRecommendationEvidence {
  dimension: string;
  score: number;
  reason: string;
  source: string;
}

export interface VideoPolicyProfile {
  profileId: string;
  schoolId: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
  allowedLanguages: string[];
  preferredLanguages: string[];
  blockExplicitContent: boolean;
  blockViolence: boolean;
  blockRacyContent: boolean;
  blockProfanity: boolean;
  blockSectarianAttackContent: boolean;
  requireEducationalPurpose: boolean;
  requireEmbeddable?: boolean;
  preferCaptions: boolean;
  islamicAppropriatenessMode: IslamicAppropriatenessMode;
  createdAt: string;
}

export interface VideoRecommendation {
  recommendationId: string;
  status: VideoRecommendationStatus;
  decision: VideoRankingDecision;
  candidate: VideoCandidateInput;
  metadata?: VideoMetadata | null;
  score: VideoScoreBreakdown;
  reasons: string[];
  warnings: string[];
  rejectionReasons: string[];
  safety: VideoSafetyReview;
  suitability: VideoSuitabilityReview;
  evidence: VideoRecommendationEvidence[];
  cachePolicy: { cacheAllowed: boolean; scope: string; reason: string };
  createdAt: string;
}

export interface VideoRecommendationRequest {
  sessionId?: string | null;
  message?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  syllabusId?: string | null;
  syllabusObjectiveIds?: string[];
  learnerAge?: number | null;
  gradeLevel?: string | null;
  languagePreference?: string | null;
  schoolPolicyProfileId?: string | null;
  activeArtifactIds?: string[];
  activeVideoIds?: string[];
  candidates?: VideoCandidateInput[];
  query?: string | null;
  maxResults?: number;
  includeProviderSearch?: boolean;
  includeTeacherReviewItems?: boolean;
  // v1.1: Duration preference for scoring
  preferredDurationMinutes?: number | null;
}

export interface VideoRecommendationResponse {
  ok: true;
  status: 'resolved' | 'partial' | 'no_candidates' | 'needs_review' | 'error';
  recommendations: VideoRecommendation[];
  rejected: VideoRecommendation[];
  reviewQueue: VideoRecommendation[];
  meta: {
    requestId: string;
    schoolId: string;
    sessionId?: string | null;
    usedTutorContext: boolean;
    usedIntentResolution: boolean;
    usedLearnerMemory: boolean;
    usedPracticeMastery: boolean;
    usedArtifactContext: boolean;
    providerSearchUsed: boolean;
    warnings: string[];
  };
  // v1.1: Optional safe summary and cache policy for new response builder
  safeSummary?: string;
  cachePolicy?: {
    mode: 'no_cache' | 'scoped_cache';
    keyParts: string[];
    key?: string | null;
    reason: string;
    ttlSeconds: number | null;
    warnings: string[];
  };
  rejectedCandidates?: RankedVideoRecommendation[];
  queryUsed?: string | null;
}
