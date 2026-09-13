export type LearnerNextActionKind =
  | 'continue_current_step'
  | 'revise_skill'
  | 'retry_similar_problem'
  | 'explain_reasoning'
  | 'correct_previous_step'
  | 'reflect_on_mistake'
  | 'try_transfer_problem'
  | 'review_artifact_feedback'
  | 'watch_targeted_video'
  | 'ask_socratic_tutor'
  | 'insufficient_evidence'
  | 'safe_integrity_redirect'
  | 'safeguarding_safe_response';

export type WhyThisNextReasonKind =
  | 'repeated_mistake'
  | 'weak_evidence'
  | 'stale_evidence'
  | 'hint_dependency'
  | 'missing_reasoning'
  | 'correction_needed'
  | 'reflection_needed'
  | 'transfer_needed'
  | 'revision_due'
  | 'growth_observed'
  | 'mastery_not_supported'
  | 'mastery_candidate'
  | 'cross_surface_pattern'
  | 'source_quality_caution'
  | 'integrity_boundary'
  | 'safeguarding_boundary'
  | 'insufficient_evidence';

export type LearnerExplanationTone =
  | 'supportive'
  | 'direct'
  | 'encouraging'
  | 'cautious'
  | 'integrity_safe'
  | 'safeguarding_safe';

export interface SourceTruthSummary {
  realEvidenceCount: number;
  nonRealEvidenceCount: number;
  unknownEvidenceCount: number;
  staleEvidenceCount: number;
  explanationConfidence: 'low' | 'medium' | 'high';
}

export interface LearnerFacingWhyThisNext {
  explanationId: string;
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  recommendedAction: LearnerNextActionKind;
  reasonKind: WhyThisNextReasonKind;
  tone: LearnerExplanationTone;
  shortExplanation: string;
  nextLearnerAction: string;
  evidenceEventIds: string[];
  revisionQueueItemIds: string[];
  growthProofId?: string;
  continuitySnapshotId?: string;
  supportLevelDecisionId?: string;
  sourceTruthSummary: SourceTruthSummary;
  canShowToLearner: boolean;
  finalAnswerIncluded: false;
  answerKeyIncluded: false;
  hiddenReasoningIncluded: false;
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
  rawArtifactContentIncluded: false;
  rawVideoTranscriptIncluded: false;
  rawLearnerMemoryIncluded: false;
  safeguardingDetailsIncluded: false;
  createdAt: string;
}

export interface LearnerFacingRevisionExplanation {
  revisionExplanationId: string;
  revisionQueueItemId: string;
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  safeReason: string;
  learnerFriendlyReason: string;
  recommendedAction: LearnerNextActionKind;
  expectedBenefit: string;
  evidenceEventIds: string[];
  mistakeType?: string;
  supportLevel?: string;
  sourceTruthSummary: {
    canSupportRealRevision: boolean;
    explanationConfidence: 'low' | 'medium' | 'high';
  };
  finalAnswerIncluded: false;
  answerKeyIncluded: false;
  hiddenReasoningIncluded: false;
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

export interface WhyThisNextInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  evidenceEvents?: Array<{
    eventId: string;
    evidenceStrength: string;
    sourceQuality: string;
    freshness: string;
    safeSummary: string;
    mistakeType?: string;
    correctionObserved?: boolean;
    reflectionObserved?: boolean;
    transferObserved?: boolean;
  }>;
  revisionQueueItems?: Array<{
    itemId: string;
    reasonCode: string;
    safeReason: string;
    recommendedAction: string;
    evidenceEventIds: string[];
    priority: string;
    status: string;
  }>;
  growthProof?: {
    proofId: string;
    verdict: string;
    safeReason: string;
    supportingEvidenceEventIds: string[];
    revisionRecommended: boolean;
    masteryClaimAllowed: boolean;
  };
  continuitySnapshot?: {
    snapshotId: string;
    recommendedNextLearningMove: string;
    safeSummary: string;
    supportingEvidenceEventIds: string[];
    sourceTruthSummary: {
      realEvidenceCount: number;
      nonRealEvidenceCount: number;
      staleEvidenceCount: number;
      unknownEvidenceCount: number;
    };
  };
  practiceStepCheck?: {
    resultId: string;
    status: string;
    feedbackMove: string;
    nextLearnerAction: string;
    safeReason: string;
    evidenceStrength: string;
    canSupportGrowth: boolean;
    canSupportMastery: boolean;
  };
  supportLevelDecision?: {
    decisionId: string;
    supportLevel: string;
    nextLearnerAction: string;
    safeReason: string;
    maxAllowedTutorMove: string;
  };
  dataSourceTruth?: {
    sourceKind: string;
    canSupportRealMastery: boolean;
    canSupportRealGrowth: boolean;
    canBeDisplayedAsReal: boolean;
    truthLabel: string;
  };
}

export interface WhyThisNextDecision {
  reasonKind: WhyThisNextReasonKind;
  recommendedAction: LearnerNextActionKind;
  tone: LearnerExplanationTone;
  shortExplanation: string;
  nextLearnerAction: string;
  evidenceEventIds: string[];
  revisionQueueItemIds: string[];
  growthProofId?: string;
  continuitySnapshotId?: string;
  supportLevelDecisionId?: string;
  sourceTruthSummary: SourceTruthSummary;
}

export interface WhyThisNextValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RecommendationReasoningPolicyDecision {
  reasonKind: WhyThisNextReasonKind;
  recommendedAction: LearnerNextActionKind;
  tone: LearnerExplanationTone;
  priority: number;
  explanationTemplate: string;
  nextActionTemplate: string;
}

export interface LearnerExplanationInput {
  reasonKind: WhyThisNextReasonKind;
  recommendedAction: LearnerNextActionKind;
  tone: LearnerExplanationTone;
  skillLabel?: string;
  topicLabel?: string;
  evidenceCount: number;
  confidence: 'low' | 'medium' | 'high';
  isRealEvidence: boolean;
  mistakeLabel?: string;
  hasCorrection?: boolean;
  hasReflection?: boolean;
  hasTransfer?: boolean;
}

export interface NextLearnerActionInput {
  recommendedAction: LearnerNextActionKind;
  skillLabel?: string;
  topicLabel?: string;
  sessionActive: boolean;
}

export interface ExplanationEvidenceBundle {
  evidenceEvents: Array<{
    eventId: string;
    evidenceStrength: string;
    sourceQuality: string;
    freshness: string;
    safeSummary: string;
    mistakeType?: string;
    correctionObserved?: boolean;
    reflectionObserved?: boolean;
    transferObserved?: boolean;
  }>;
  revisionQueueItems: Array<{
    itemId: string;
    reasonCode: string;
    safeReason: string;
    recommendedAction: string;
    evidenceEventIds: string[];
    priority: string;
    status: string;
  }>;
  growthProof?: {
    proofId: string;
    verdict: string;
    safeReason: string;
    supportingEvidenceEventIds: string[];
    revisionRecommended: boolean;
    masteryClaimAllowed: boolean;
  };
  continuitySnapshot?: {
    snapshotId: string;
    recommendedNextLearningMove: string;
    safeSummary: string;
    supportingEvidenceEventIds: string[];
    sourceTruthSummary: {
      realEvidenceCount: number;
      nonRealEvidenceCount: number;
      staleEvidenceCount: number;
      unknownEvidenceCount: number;
    };
  };
  practiceStepCheck?: {
    resultId: string;
    status: string;
    feedbackMove: string;
    nextLearnerAction: string;
    safeReason: string;
    evidenceStrength: string;
    canSupportGrowth: boolean;
    canSupportMastery: boolean;
  };
  supportLevelDecision?: {
    decisionId: string;
    supportLevel: string;
    nextLearnerAction: string;
    safeReason: string;
    maxAllowedTutorMove: string;
  };
}

export interface SafeExplanationEvidenceSummary {
  totalEvidenceCount: number;
  realEvidenceCount: number;
  nonRealEvidenceCount: number;
  unknownEvidenceCount: number;
  staleEvidenceCount: number;
  hasRevisionQueueItems: boolean;
  hasGrowthProof: boolean;
  hasContinuitySnapshot: boolean;
  hasPracticeStepCheck: boolean;
  hasSupportLevelDecision: boolean;
  strongestEvidenceStrength: string;
  explanationConfidence: 'low' | 'medium' | 'high';
  canSupportRealClaim: boolean;
}

export interface ExplanationEvidenceInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  evidenceEvents?: Array<{
    eventId: string;
    evidenceStrength: string;
    sourceQuality: string;
    freshness: string;
    safeSummary: string;
    mistakeType?: string;
    correctionObserved?: boolean;
    reflectionObserved?: boolean;
    transferObserved?: boolean;
  }>;
  revisionQueueItems?: Array<{
    itemId: string;
    reasonCode: string;
    safeReason: string;
    recommendedAction: string;
    evidenceEventIds: string[];
    priority: string;
    status: string;
  }>;
  growthProof?: {
    proofId: string;
    verdict: string;
    safeReason: string;
    supportingEvidenceEventIds: string[];
    revisionRecommended: boolean;
    masteryClaimAllowed: boolean;
  };
  continuitySnapshot?: {
    snapshotId: string;
    recommendedNextLearningMove: string;
    safeSummary: string;
    supportingEvidenceEventIds: string[];
    sourceTruthSummary: {
      realEvidenceCount: number;
      nonRealEvidenceCount: number;
      staleEvidenceCount: number;
      unknownEvidenceCount: number;
    };
  };
  practiceStepCheck?: {
    resultId: string;
    status: string;
    feedbackMove: string;
    nextLearnerAction: string;
    safeReason: string;
    evidenceStrength: string;
    canSupportGrowth: boolean;
    canSupportMastery: boolean;
  };
  supportLevelDecision?: {
    decisionId: string;
    supportLevel: string;
    nextLearnerAction: string;
    safeReason: string;
    maxAllowedTutorMove: string;
  };
  dataSourceTruth?: {
    sourceKind: string;
    canSupportRealMastery: boolean;
    canSupportRealGrowth: boolean;
    canBeDisplayedAsReal: boolean;
    truthLabel: string;
  };
}

export interface RecommendationReasoningInput {
  evidenceBundle: ExplanationEvidenceBundle;
  evidenceSummary: SafeExplanationEvidenceSummary;
  sourceTruthSummary: SourceTruthSummary;
}

export interface RecommendationReasonRank {
  reasonKind: WhyThisNextReasonKind;
  rank: number;
  explanation: string;
}

export interface RevisionExplanationInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  revisionQueueItem: {
    itemId: string;
    reasonCode: string;
    safeReason: string;
    recommendedAction: string;
    evidenceEventIds: string[];
    priority: string;
    status: string;
  };
  evidenceEvents?: Array<{
    eventId: string;
    evidenceStrength: string;
    sourceQuality: string;
    freshness: string;
    safeSummary: string;
    mistakeType?: string;
  }>;
  mistakeType?: string;
  supportLevel?: string;
  dataSourceTruth?: {
    sourceKind: string;
    canSupportRealMastery: boolean;
    canSupportRealGrowth: boolean;
    canBeDisplayedAsReal: boolean;
    truthLabel: string;
  };
}
