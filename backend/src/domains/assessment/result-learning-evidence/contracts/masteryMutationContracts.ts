export interface ResultMasteryMutationPlan {
  resultMasteryMutationPlanId: string;
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultFinalizationDecisionId: string;
  markingResultVersionId: string;
  studentRef: string;
  planStatus: string;
  planMode: string;
  objectiveImpactRefsJson?: Record<string, unknown>;
  targetMasterySnapshotRefsJson?: Record<string, unknown>;
  safePlanSummary: string;
  approvalRequired: boolean;
  approvedByActorId?: string;
  approvedByRole?: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  blockedAt?: string;
  cancelledAt?: string;
}

export interface CreateMasteryMutationPlanRequest {
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultFinalizationDecisionId: string;
  markingResultVersionId: string;
  studentRef: string;
  planMode?: string;
  objectiveImpactRefs?: Record<string, unknown>;
  targetMasterySnapshotRefs?: Record<string, unknown>;
  safePlanSummary: string;
  actorId: string;
  actorRole: string;
}

export interface ResultMasteryMutationEvent {
  resultMasteryMutationEventId: string;
  schoolId: string;
  resultMasteryMutationPlanId: string;
  resultLearningEvidenceBridgeId: string;
  studentRef: string;
  targetSnapshotRef?: string;
  mutationStatus: string;
  mutationType: string;
  beforeStateJson?: Record<string, unknown>;
  afterStateJson?: Record<string, unknown>;
  deltaJson?: Record<string, unknown>;
  safeMutationSummary: string;
  appliedByActorId?: string;
  appliedByRole?: string;
  createdAt: string;
  appliedAt?: string;
  voidedAt?: string;
}

export interface ApplyMasteryMutationRequest {
  schoolId: string;
  resultMasteryMutationPlanId: string;
  actorId: string;
  actorRole: string;
  safeMutationSummary: string;
}

export type MasteryPlanMode =
  | 'objective_level_mastery'
  | 'topic_level_mastery'
  | 'skill_level_mastery'
  | 'safe_preflight_only';

export type MasteryMutationType =
  | 'objective_mastery_update'
  | 'skill_mastery_update'
  | 'topic_mastery_update'
  | 'evidence_only_no_change';
