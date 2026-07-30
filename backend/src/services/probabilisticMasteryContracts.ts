export type ActorRole =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'internal_operator'
  | 'parent'
  | 'unknown';

export interface MasteryActorContext {
  schoolId: string;
  actorId: string;
  actorRole: ActorRole;
  learnerId?: string;
  requestId: string;
  correlationId: string;
}

export type TargetNodeType = 'concept' | 'skill' | 'learning_objective';

export interface MasteryTarget {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: TargetNodeType;
  curriculumVersionId: string;
}

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

export type ExplanationQuality = 'missing' | 'weak' | 'partial' | 'strong';

export interface NormalizedMasteryEvidence {
  evidenceId: string;
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: TargetNodeType;
  curriculumVersionId: string;
  sourceType: EvidenceSourceType;
  outcome: number;
  usable: boolean;
  markingConfidence: number;
  integrityRisk: number;
  independence: number;
  hintDependency: number;
  explanationQuality: ExplanationQuality | null;
  misconceptionTags: string[];
  transferSignal: number | null;
  retentionSignal: number | null;
  occurredAt: Date;
  committedAt: Date;
  policyVersion: string;
  supersedes: string | null;
}

export type VisibleMasteryLabel =
  | 'not_started'
  | 'introduced'
  | 'attempted'
  | 'developing'
  | 'near_mastery'
  | 'mastered'
  | 'needs_revisit';

export interface MasteryState {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: TargetNodeType;
  curriculumVersionId: string;
  probabilityOfMastery: number;
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: Date | null;
  decayRisk: number;
  misconceptionTags: string[];
  independenceScore: number;
  hintDependencyScore: number;
  retentionScore: number;
  transferScore: number;
  visibleLabel: VisibleMasteryLabel;
  policyVersion: string;
  strategyId: string;
  strategyVersion: string;
  stateRevision: number;
  updatedAt: Date;
  consecutiveMissCountSinceMastered: number;
}

export type ReasonCode =
  | 'insufficient_evidence'
  | 'weak_prerequisite'
  | 'repeated_misconception'
  | 'evidence_weakened_by_hints'
  | 'evidence_weakened_by_low_independence'
  | 'evidence_weakened_by_low_marking_confidence'
  | 'evidence_blocked_by_integrity_risk'
  | 'mastery_decay'
  | 'retention_risk'
  | 'conflicting_evidence'
  | 'stable_progress'
  | 'model_uncertainty_too_high'
  | 'prerequisite_blocked';

export type DiagnosisStatus =
  | 'insufficient_evidence'
  | 'weak_prerequisite'
  | 'repeated_misconception'
  | 'evidence_quality_weak'
  | 'decay_risk'
  | 'conflicting_signals'
  | 'stable_progress'
  | 'uncertain'
  | 'healthy';

export interface CognitiveDiagnosis {
  diagnosisId: string;
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  diagnosisStatus: DiagnosisStatus;
  primaryReason: string;
  reasonCodes: ReasonCode[];
  weakDirectPrerequisites: string[];
  weakTransitivePrerequisites: string[];
  misconceptionTags: string[];
  evidenceCount: number;
  confidence: number;
  contributingEvidenceIds: string[];
  generatedAt: Date;
  policyVersion: string;
}

export type MasteryNextAction =
  | 'diagnose'
  | 'practice'
  | 'remediate'
  | 'review'
  | 'advance';

export interface NextBestAction {
  action: MasteryNextAction;
  reasonCodes: ReasonCode[];
  safeDescription: string;
}

export interface MasteryChangeLog {
  changeId: string;
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  previousState: MasteryState | null;
  newState: MasteryState;
  contributingEvidenceIds: string[];
  policyVersion: string;
  strategyId: string;
  reasonCodes: ReasonCode[];
  createdAt: Date;
  correlationId: string;
}

export interface MasteryPolicyConfig {
  policyVersion: string;
  sourceWeights: Record<EvidenceSourceType, number>;
  minimumUsableEvidenceCount: number;
  markingConfidenceAdjustment: number;
  integrityRiskPenalty: number;
  independenceBonus: number;
  hintDependencyPenalty: number;
  explanationAdjustment: Record<ExplanationQuality, number>;
  recencyHalfLifeDays: number;
  decayEnabled: boolean;
  decayRatePerDay: number;
  decayMinProbability: number;
  retentionContribution: number;
  transferContribution: number;
  misconceptionPenalty: number;
  labelThresholds: Record<VisibleMasteryLabel, number>;
  prerequisiteThreshold: number;
  modelUncertaintyThreshold: number;
  masteredToNeedsRevisitMissCount: number;
  masteredToNeedsRevisitDecayDays: number;
  strategyId: string;
  strategyVersion: string;
}

export interface MasteryEstimationInput {
  priorProbability: number;
  priorConfidence: number;
  evidenceOutcome: number;
  evidenceWeight: number;
  markingConfidence: number;
  integrityRisk: number;
  independence: number;
  hintDependency: number;
  explanationAdjustment: number;
  retentionSignal: number | null;
  transferSignal: number | null;
  evidenceAgeDays: number;
  totalEvidenceCount: number;
}

export interface MasteryEstimationResult {
  probabilityOfMastery: number;
  confidence: number;
  effectiveEvidenceWeight: number;
}

export interface MasteryEstimationStrategy {
  readonly strategyId: string;
  readonly strategyVersion: string;
  estimate(input: MasteryEstimationInput): MasteryEstimationResult;
}

export interface PrerequisiteInfo {
  targetNodeId: string;
  targetNodeType: TargetNodeType;
  curriculumVersionId: string;
  isPrerequisite: boolean;
  isBuildsOn: boolean;
  state: MasteryState | null;
}

export interface PrerequisiteReader {
  getDirectPrerequisites(target: MasteryTarget): PrerequisiteInfo[];
  getTransitivePrerequisites(target: MasteryTarget): PrerequisiteInfo[];
}

export type ReplayStatus = 'consistent' | 'divergent' | 'repaired' | 'blocked';

export interface ReplayResult {
  status: ReplayStatus;
  rebuiltState: MasteryState | null;
  storedState: MasteryState | null;
  diagnosis: CognitiveDiagnosis | null;
  evidenceIdsUsed: string[];
}

export interface EvidenceApplicationResult {
  state: MasteryState;
  changeLog: MasteryChangeLog;
  diagnosis: CognitiveDiagnosis;
  nextAction: NextBestAction;
}

export interface MasteryClock {
  now(): Date;
}

export type MasteryIdKind = 'state' | 'diagnosis' | 'changeLog' | 'evidenceApplication';

export interface MasteryIdGenerator {
  nextId(kind: MasteryIdKind): string;
}

export type ReplayConflictResultStatus =
  | 'applied'
  | 'duplicate_identical'
  | 'evidence_identity_conflict'
  | 'superseded'
  | 'superseding';

export interface ReplayConflictResult {
  status: ReplayConflictResultStatus;
  evidenceId: string;
  conflictWithEvidenceId?: string;
}

export interface MasteryUpdateCommand {
  actor: MasteryActorContext;
  target: MasteryTarget;
  evidence: NormalizedMasteryEvidence;
  policy: MasteryPolicyConfig;
  strategy: MasteryEstimationStrategy;
  prerequisiteReader: PrerequisiteReader | null;
  clock: MasteryClock;
  idGenerator: MasteryIdGenerator;
  correlationId: string;
}

export interface MasteryQuery {
  actor: MasteryActorContext;
  target: MasteryTarget;
  currentState: MasteryState | null;
  diagnosis: CognitiveDiagnosis | null;
  nextAction: NextBestAction | null;
}

export type AuthorizedMutationRole = 'teacher' | 'school_admin' | 'internal_operator';
export type AuthorizedQueryRole = 'student' | 'teacher' | 'school_admin' | 'internal_operator';

export interface AuthorizationError {
  code: 'ACTOR_NOT_AUTHORIZED' | 'SCHOOL_MISMATCH' | 'LEARNER_MISMATCH' | 'VERSION_MISMATCH' | 'ROLE_DENIED';
  message: string;
}

export function isAuthorizationError(value: unknown): value is AuthorizationError {
  return typeof value === 'object' && value !== null && 'code' in value;
}

export function authorizeMutation(actor: MasteryActorContext, target: MasteryTarget): AuthorizationError | null {
  if (!actor.schoolId) return { code: 'SCHOOL_MISMATCH', message: 'Actor schoolId is empty' };
  if (!actor.actorId) return { code: 'ACTOR_NOT_AUTHORIZED', message: 'ActorId is empty' };
  if (actor.actorRole === 'unknown' || actor.actorRole === 'parent' || actor.actorRole === 'student') {
    return { code: 'ROLE_DENIED', message: `Role ${actor.actorRole} cannot mutate mastery state` };
  }
  if (actor.schoolId !== target.schoolId) {
    return { code: 'SCHOOL_MISMATCH', message: 'Actor school differs from target school' };
  }
  if (actor.actorRole === 'teacher') {
    if (!actor.learnerId) return { code: 'LEARNER_MISMATCH', message: 'Teacher must specify learnerId' };
    if (actor.learnerId !== target.learnerId) {
      return { code: 'LEARNER_MISMATCH', message: 'Teacher learnerId differs from target learner' };
    }
  }
  return null;
}

export function authorizeQuery(actor: MasteryActorContext, target: MasteryTarget): AuthorizationError | null {
  if (!actor.schoolId) return { code: 'SCHOOL_MISMATCH', message: 'Actor schoolId is empty' };
  if (!actor.actorId) return { code: 'ACTOR_NOT_AUTHORIZED', message: 'ActorId is empty' };
  if (actor.actorRole === 'unknown' || actor.actorRole === 'parent') {
    return { code: 'ROLE_DENIED', message: `Role ${actor.actorRole} cannot query mastery state` };
  }
  if (actor.schoolId !== target.schoolId) {
    return { code: 'SCHOOL_MISMATCH', message: 'Actor school differs from target school' };
  }
  if (actor.actorRole === 'student') {
    if (!actor.learnerId) return { code: 'LEARNER_MISMATCH', message: 'Student must specify learnerId' };
    if (actor.learnerId !== target.learnerId) {
      return { code: 'LEARNER_MISMATCH', message: 'Student can only query own state' };
    }
  }
  if (actor.actorRole === 'teacher') {
    if (!actor.learnerId) return { code: 'LEARNER_MISMATCH', message: 'Teacher must specify learnerId' };
    if (actor.learnerId !== target.learnerId) {
      return { code: 'LEARNER_MISMATCH', message: 'Teacher learnerId differs from target learner' };
    }
  }
  return null;
}

export function createDefaultClock(): MasteryClock {
  return { now: () => new Date() };
}

let defaultIdCounter = 0;
export function createDefaultIdGenerator(): MasteryIdGenerator {
  const idCounter = { value: 0 };
  return {
    nextId(_kind: MasteryIdKind): string {
      idCounter.value++;
      return `pm_${idCounter.value}`;
    },
  };
}
