import type { SourceTrustTier } from '../lib/types';

export type CreativeVideoSourceType = 'youtube' | 'vimeo';
export type CreativeMediaFormat = 'short_video' | 'long_video';
export type CreativeCardRole = 'spark' | 'notice' | 'reframe' | 'transfer' | 'deepen';

export type CreativeActionId =
  | 'save_to_revision'
  | 'more_like_this'
  | 'explain_simply'
  | 'similar_topic'
  | 'open_longer_lesson'
  | 'quick_check'
  | 'what_changed'
  | 'try_new_angle';

export type CreativeLearningNeed = 'concept_intuition' | 'worked_example' | 'quick_recap' | string;

export interface ExternalVideoCandidate {
  sourceType: CreativeVideoSourceType;
  sourceVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  canonicalUrl: string;
  embedUrl: string;
  durationSeconds: number | null;
  language: string | null;
  captionsAvailable: boolean | null;
  embeddable: boolean;
  creatorName: string | null;
  publishedAt: string | null;
  trustTier: SourceTrustTier;
  educationalConfidence: number;
  clarityScore: number;
  transcriptQualityEstimate: number;
  providerPayload?: Record<string, unknown>;
}

export interface NormalizedCreativeVideoCard {
  id: string;
  sourceType: CreativeVideoSourceType;
  sourceVideoId: string;
  embedUrl: string;
  canonicalUrl: string;
  title: string;
  description: string | null;
  shortSummary: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  mediaFormat: CreativeMediaFormat;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  language: string | null;
  captionsAvailable: boolean | null;
  embeddable: boolean;
  trustTier: SourceTrustTier;
  creativityType: CreativeCardRole;
  learningGoal: string;
  weakTopicFit: boolean;
  clarityScore: number;
  creativityScore: number;
  intuitionScore: number;
  noveltyScore: number;
  transcriptQualityEstimate: number;
  creatorName: string | null;
  publishedAt: string | null;
  actionsAvailable: CreativeActionId[];
  qualityFlags: string[];
  providerPayload?: Record<string, unknown>;
}

export interface CreativeScoredCandidate extends NormalizedCreativeVideoCard {
  compositeScore: number;
  scoreBreakdown: {
    conceptFit: number;
    curiositySpark: number;
    intuitionValue: number;
    reframeValue: number;
    weakTopicFit: number;
    continuity: number;
    schoolFit: number;
    languageFit: number;
    captionUtility: number;
    trust: number;
    novelty: number;
    diversity: number;
    freshness: number;
  };
}

export interface CreativeDeckRequest {
  query?: string | null;
  subject?: string | null;
  topic?: string | null;
  activeTopic?: string | null;
  weakTopics?: string[];
  learningNeed?: CreativeLearningNeed | null;
  language?: string | null;
  schoolLevel?: string | null;
  allowVimeo?: boolean;
  allowYouTube?: boolean;
  previouslySeenIds?: string[];
  previouslySeenCreators?: string[];
  limit?: number;
}

export interface CreativeSafetyFilterResult {
  accepted: NormalizedCreativeVideoCard[];
  rejected: Array<{ card: NormalizedCreativeVideoCard; reason: string }>;
}

export interface CreativeDeckBuildResult {
  cards: CreativeScoredCandidate[];
  notices: string[];
  sourceHealth: {
    youtubeFetched: boolean;
    vimeoFetched: boolean;
    usedCache: boolean;
  };
}

export interface CreativeInteractionModel {
  overline: string;
  overlayText: string;
  primaryAction: {
    id: CreativeActionId;
    label: string;
  };
  secondaryActions: Array<{
    id: CreativeActionId;
    label: string;
  }>;
  nextCueTitle: string;
  nextCueBody: string;
}
