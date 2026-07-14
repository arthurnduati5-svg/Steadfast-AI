export interface ResultRevisionSignal {
  resultRevisionSignalId: string;
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  signalStatus: string;
  signalType: string;
  priority: number;
  safeSignalSummary: string;
  recommendedActionRefsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRevisionSignalRequest {
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  signalType?: string;
  priority?: number;
  safeSignalSummary: string;
  recommendedActionRefs?: Record<string, unknown>;
  sourceRefs?: Record<string, unknown>;
  actorId: string;
  actorRole: string;
}

export type RevisionSignalType =
  | 'revise_objective'
  | 'practice_misconception'
  | 'spaced_review'
  | 'teacher_follow_up'
  | 'evidence_only_no_action';

export interface ResultGrowthSignal {
  resultGrowthSignalId: string;
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  signalStatus: string;
  signalType: string;
  safeGrowthSummary: string;
  growthMetricRefsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateGrowthSignalRequest {
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  signalType?: string;
  safeGrowthSummary: string;
  growthMetricRefs?: Record<string, unknown>;
  sourceRefs?: Record<string, unknown>;
  actorId: string;
  actorRole: string;
}

export type GrowthSignalType =
  | 'mastery_improved'
  | 'mastery_declined'
  | 'misconception_detected'
  | 'consistency_signal'
  | 'effort_signal'
  | 'evidence_only_no_action';
