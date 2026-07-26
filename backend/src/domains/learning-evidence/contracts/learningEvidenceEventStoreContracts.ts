// Durable Learning Evidence Event Store Contracts v1
// Immutable event types, source taxonomy, and evidence dimensions.

export type EvidenceEventType =
  | 'EVIDENCE_CANDIDATE_CREATED'
  | 'EVIDENCE_VALIDATION_STARTED'
  | 'EVIDENCE_DECLARED_INELIGIBLE'
  | 'EVIDENCE_REVIEW_REQUIRED'
  | 'EVIDENCE_DECLARED_USABLE'
  | 'EVIDENCE_COMMITTED'
  | 'EVIDENCE_SUPERSEDED'
  | 'EVIDENCE_RETAINED'
  | 'EVIDENCE_PROJECTION_REBUILT'
  | 'EVIDENCE_RECONCILIATION_FAILED';

export type EvidenceCandidateState =
  | 'candidate'
  | 'validating'
  | 'ineligible'
  | 'review_required'
  | 'usable'
  | 'committed'
  | 'superseded'
  | 'retained';

export type EvidenceSourceType =
  | 'tutor_attempt'
  | 'daily_objective_check'
  | 'practice_attempt'
  | 'teach_back'
  | 'reflection'
  | 'revision_recall'
  | 'assessment_result'
  | 'teacher_observation'
  | 'artifact_activity'
  | 'video_learning_checkpoint'
  | 'manual_seed_fixture';

export type EvidenceOutcome =
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'skipped'
  | 'incomplete'
  | 'unscored';

export type EvidenceIndependence =
  | 'independent'
  | 'light_hint'
  | 'guided'
  | 'heavily_supported'
  | 'teacher_assisted'
  | 'unknown';

export type EvidenceMode =
  | 'recall'
  | 'explanation'
  | 'application'
  | 'procedure'
  | 'teach_back'
  | 'reflection'
  | 'transfer'
  | 'observation';

export type ConfidenceState =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type IntegrityState =
  | 'clear'
  | 'review_required'
  | 'invalid'
  | 'unknown';

export type FinalizationState =
  | 'final'
  | 'provisional'
  | 'superseded'
  | 'not_applicable';

export type ActorRole =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'internal_operator'
  | 'parent'
  | 'unknown';

export type PrivacyClass =
  | 'learner_safe'
  | 'teacher_safe'
  | 'admin_safe'
  | 'internal_only';

export type ProjectionStatus =
  | 'healthy'
  | 'diverged'
  | 'rebuilding'
  | 'failed';

export type RebuildResult =
  | 'consistent'
  | 'divergence_detected'
  | 'repaired'
  | 'blocked';

export interface EvidenceSourceLineage {
  sourceType: EvidenceSourceType;
  sourceRecordId: string;
  sourceVersion: string;
  schoolId: string;
  learnerId: string;
  objectiveId?: string;
  skillId?: string;
  topicId?: string;
  conceptId?: string;
  occurredAt: string;
  outcome: EvidenceOutcome;
  supportLevel?: string;
  confidenceMetadata?: string;
  integrityState: IntegrityState;
  finalizationState: FinalizationState;
  policyVersion: string;
}

export interface NormalizedEvidencePayload {
  outcome: EvidenceOutcome;
  independence: EvidenceIndependence;
  evidenceMode: EvidenceMode;
  confidenceState: ConfidenceState;
  integrityState: IntegrityState;
  finalizationState: FinalizationState;
  difficultyBand?: string;
  timeOnTaskBand?: string;
  misconceptionTags?: string[];
  objectiveId?: string;
  skillId?: string;
  topicId?: string;
  conceptId?: string;
  sourceVersion: string;
  evidenceWeightSuggestion?: number;
  eligibilityReasonCodes: string[];
}

export const VALID_TRANSITIONS: Record<EvidenceCandidateState, EvidenceCandidateState[]> = {
  candidate: ['validating'],
  validating: ['ineligible', 'review_required', 'usable'],
  ineligible: [],
  review_required: ['validating'],
  usable: ['committed'],
  committed: ['superseded', 'retained'],
  superseded: [],
  retained: [],
};

export function isValidTransition(from: EvidenceCandidateState, to: EvidenceCandidateState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
