// Projection contracts for the Learning Evidence Event Store

import type { EvidenceCandidateState, EvidenceOutcome, EvidenceIndependence, EvidenceMode, ConfidenceState, IntegrityState, FinalizationState, ProjectionStatus, RebuildResult } from './learningEvidenceEventStoreContracts';

export interface LearningEvidenceEventRecord {
  eventId: string;
  schoolId: string;
  learnerId: string;
  streamId: string;
  streamSequence: number;
  eventType: string;
  evidenceCandidateId?: string;
  committedEvidenceId?: string;
  sourceType: string;
  sourceRecordId: string;
  sourceVersion: string;
  objectiveId?: string;
  skillId?: string;
  topicId?: string;
  conceptId?: string;
  actorId: string;
  actorRole: string;
  policyVersion: string;
  schemaVersion: string;
  reasonCodes: string[];
  safePayloadJson: string;
  safePayloadHash: string;
  privacyClass: string;
  occurredAt: string;
  recordedAt: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  previousEventHash: string;
  eventHash: string;
}

export interface LearningEvidenceStreamState {
  streamId: string;
  schoolId: string;
  learnerId: string;
  currentSequence: number;
  latestEventHash: string;
}

export interface LearningEvidenceCandidateProjectionState {
  evidenceCandidateId: string;
  schoolId: string;
  learnerId: string;
  currentState: EvidenceCandidateState;
  sourceType: string;
  sourceRecordId: string;
  sourceVersion: string;
  outcome?: string;
  independence?: string;
  evidenceMode?: string;
  confidenceState?: string;
  integrityState?: string;
  finalizationState?: string;
  difficultyBand?: string;
  timeOnTaskBand?: string;
  misconceptionTags: string[];
  objectiveId?: string;
  skillId?: string;
  topicId?: string;
  conceptId?: string;
  evidenceWeightSuggestion?: number;
  eligibilityReasonCodes: string[];
  latestSequence: number;
  version: number;
}

export interface CommittedLearningEvidenceProjectionState {
  committedEvidenceId: string;
  evidenceCandidateId: string;
  schoolId: string;
  learnerId: string;
  objectiveId?: string;
  skillId?: string;
  topicId?: string;
  conceptId?: string;
  outcome: string;
  evidenceMode: string;
  independence: string;
  confidenceState: string;
  integrityState: string;
  finalizationState: string;
  evidenceWeightSuggestion?: number;
  active: boolean;
  supersededByEvidenceId?: string;
  committedAt?: string;
  retainedAt?: string;
  latestSequence: number;
  version: number;
}

export interface EvidenceProjectionCheckpointState {
  projectionName: string;
  schoolId: string;
  partitionKey: string;
  lastProcessedSequence: number;
  lastEventHash: string;
  status: ProjectionStatus;
  failureReason: string;
}

export interface ProjectionRebuildReport {
  rebuildId: string;
  schoolId: string;
  learnerId: string;
  streamId: string;
  eventCount: number;
  result: RebuildResult;
  sequenceGaps: number[];
  hashGaps: number[];
  candidateProjections: number;
  committedProjections: number;
  storedCandidateVersion: number;
  storedCommittedVersion: number;
  rebuiltCandidateVersion: number;
  rebuiltCommittedVersion: number;
}
