export interface ResultObjectiveMasteryImpact {
  resultObjectiveMasteryImpactId: string;
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  questionVersionId?: string;
  markingResultVersionId: string;
  impactStatus: string;
  impactType: string;
  evidenceStrength: string;
  masteryDelta: string;
  confidenceLevel: string;
  safeImpactSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface MapObjectiveImpactRequest {
  schoolId: string;
  resultLearningEvidenceBridgeId: string;
  resultMasteryMutationPlanId: string;
  studentRef: string;
  learningObjectiveId: string;
  questionVersionId?: string;
  markingResultVersionId: string;
  impactType?: string;
  evidenceStrength?: string;
  masteryDelta?: string;
  confidenceLevel?: string;
  safeImpactSummary: string;
  sourceRefs?: Record<string, unknown>;
  actorId: string;
  actorRole: string;
}

export type ObjectiveImpactType =
  | 'correct_evidence'
  | 'partial_evidence'
  | 'misconception_evidence'
  | 'missing_evidence'
  | 'teacher_override_evidence'
  | 'moderation_adjusted_evidence';

export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | 'unknown';
export type MasteryDelta = 'improved' | 'declined' | 'no_change' | 'uncertain';
export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'unknown';
