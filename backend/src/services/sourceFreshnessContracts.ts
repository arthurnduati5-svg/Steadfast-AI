export type SourceNeed =
  | 'none'
  | 'internal_context'
  | 'artifact'
  | 'video'
  | 'web_current'
  | 'mixed'
  | 'unavailable';

export type FreshnessSensitivity =
  | 'stable'
  | 'moderately_time_sensitive'
  | 'highly_time_sensitive'
  | 'current_required';

export type SourceFreshnessStatus =
  | 'not_needed'
  | 'fresh'
  | 'possibly_stale'
  | 'stale'
  | 'unknown'
  | 'unavailable';

export interface SourceFreshnessDecision {
  sourceNeed: SourceNeed;
  freshnessSensitivity: FreshnessSensitivity;
  freshnessStatus: SourceFreshnessStatus;
  shouldRetrieveExternalSource: boolean;
  allowedSourceTypes: Array<'artifact' | 'video' | 'web' | 'internal'>;
  blockedSourceTypes: Array<'artifact' | 'video' | 'web' | 'internal'>;
  safeSearchQuery?: string;
  queryPrivacyRisk: 'none' | 'low' | 'medium' | 'high' | 'blocked';
  reason: string;
  rawPrivateDataIncluded: false;
}

export interface FreshnessRoutingInput {
  studentMessage: string;
  hasSafeguardingContent: boolean;
  isAssignmentAnswerRequest: boolean;
  isVideoContextFollowUp: boolean;
  isArtifactContextFollowUp: boolean;
  containsFreshnessSignal: boolean;
  topicCategory?: 'conceptual' | 'current_event' | 'factual' | 'procedural' | 'personal' | 'crisis';
  privateDataPresent: boolean;
  safeSearchQuery?: string;
}
