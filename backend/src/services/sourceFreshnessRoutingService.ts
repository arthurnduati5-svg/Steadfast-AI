import type { SourceFreshnessDecision, FreshnessRoutingInput, SourceNeed, FreshnessSensitivity, SourceFreshnessStatus } from './sourceFreshnessContracts';

export class SourceFreshnessRoutingService {
  decide(input: FreshnessRoutingInput): SourceFreshnessDecision {
    if (input.hasSafeguardingContent) {
      return {
        sourceNeed: 'none',
        freshnessSensitivity: 'stable',
        freshnessStatus: 'not_needed',
        shouldRetrieveExternalSource: false,
        allowedSourceTypes: ['internal'],
        blockedSourceTypes: ['web', 'video', 'artifact'],
        queryPrivacyRisk: 'blocked',
        reason: 'Safeguarding content must not route to ordinary source retrieval paths',
        rawPrivateDataIncluded: false,
      };
    }

    if (input.isAssignmentAnswerRequest) {
      return {
        sourceNeed: 'none',
        freshnessSensitivity: 'stable',
        freshnessStatus: 'not_needed',
        shouldRetrieveExternalSource: false,
        allowedSourceTypes: ['internal'],
        blockedSourceTypes: ['web', 'video', 'artifact'],
        queryPrivacyRisk: 'blocked',
        reason: 'Assignment answer requests must not use source retrieval to deliver final answers',
        rawPrivateDataIncluded: false,
      };
    }

    if (input.privateDataPresent && !input.safeSearchQuery) {
      return {
        sourceNeed: 'none',
        freshnessSensitivity: 'stable',
        freshnessStatus: 'unknown',
        shouldRetrieveExternalSource: false,
        allowedSourceTypes: ['internal'],
        blockedSourceTypes: ['web', 'video', 'artifact'],
        queryPrivacyRisk: 'high',
        reason: 'Private data present in query and no safe search query available — blocked to prevent privacy leak',
        rawPrivateDataIncluded: false,
      };
    }

    if (input.isVideoContextFollowUp) {
      return {
        sourceNeed: 'video',
        freshnessSensitivity: 'stable',
        freshnessStatus: input.containsFreshnessSignal ? 'possibly_stale' : 'fresh',
        shouldRetrieveExternalSource: input.containsFreshnessSignal,
        allowedSourceTypes: ['video', 'internal'],
        blockedSourceTypes: ['web', 'artifact'],
        safeSearchQuery: input.safeSearchQuery,
        queryPrivacyRisk: input.privateDataPresent ? 'medium' : 'none',
        reason: 'Video context follow-up routed to video source reliability',
        rawPrivateDataIncluded: false,
      };
    }

    if (input.isArtifactContextFollowUp) {
      return {
        sourceNeed: 'artifact',
        freshnessSensitivity: 'stable',
        freshnessStatus: 'fresh',
        shouldRetrieveExternalSource: false,
        allowedSourceTypes: ['artifact', 'internal'],
        blockedSourceTypes: ['web', 'video'],
        queryPrivacyRisk: input.privateDataPresent ? 'medium' : 'none',
        reason: 'Artifact context follow-up routed to artifact reliability',
        rawPrivateDataIncluded: false,
      };
    }

    if (input.topicCategory === 'current_event' || input.topicCategory === 'crisis' || input.containsFreshnessSignal) {
      const need: SourceNeed = input.isVideoContextFollowUp ? 'video' :
        input.isArtifactContextFollowUp ? 'artifact' : 'web_current';

      return {
        sourceNeed: need,
        freshnessSensitivity: 'current_required',
        freshnessStatus: 'unknown',
        shouldRetrieveExternalSource: true,
        allowedSourceTypes: need === 'web_current' ? ['web', 'internal'] :
          need === 'video' ? ['video', 'internal'] : ['artifact', 'internal'],
        blockedSourceTypes: need === 'web_current' ? ['video', 'artifact'] :
          need === 'video' ? ['web', 'artifact'] : ['web', 'video'],
        safeSearchQuery: input.safeSearchQuery,
        queryPrivacyRisk: input.privateDataPresent ? 'medium' : 'none',
        reason: `Current event or freshness signal detected — routing to ${need} source`,
        rawPrivateDataIncluded: false,
      };
    }

    if (input.topicCategory === 'conceptual' || input.topicCategory === 'procedural' || input.topicCategory === 'factual') {
      return {
        sourceNeed: 'none',
        freshnessSensitivity: 'stable',
        freshnessStatus: 'not_needed',
        shouldRetrieveExternalSource: false,
        allowedSourceTypes: ['internal'],
        blockedSourceTypes: ['web', 'video', 'artifact'],
        safeSearchQuery: input.safeSearchQuery,
        queryPrivacyRisk: 'none',
        reason: 'Stable conceptual/procedural/factual question does not require external source retrieval',
        rawPrivateDataIncluded: false,
      };
    }

    return {
      sourceNeed: 'unavailable',
      freshnessSensitivity: 'stable',
      freshnessStatus: 'unavailable',
      shouldRetrieveExternalSource: false,
      allowedSourceTypes: ['internal'],
      blockedSourceTypes: ['web', 'video', 'artifact'],
      safeSearchQuery: input.safeSearchQuery,
      queryPrivacyRisk: input.privateDataPresent ? 'high' : 'low',
      reason: 'Could not determine source need — defaulting to no external retrieval',
      rawPrivateDataIncluded: false,
    };
  }
}

export const sourceFreshnessRoutingService = new SourceFreshnessRoutingService();
