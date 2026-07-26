// Repository interface for the Learning Evidence Event Store

import type { LearningEvidenceEventRecord, LearningEvidenceStreamState, LearningEvidenceCandidateProjectionState, CommittedLearningEvidenceProjectionState, EvidenceProjectionCheckpointState } from '../contracts/learningEvidenceProjectionContracts';

export interface LearningEvidenceEventStoreRepository {
  appendEventAtomically(
    event: LearningEvidenceEventRecord,
    stream: LearningEvidenceStreamState,
    candidateProjection?: LearningEvidenceCandidateProjectionState,
    committedProjection?: CommittedLearningEvidenceProjectionState,
    checkpoint?: EvidenceProjectionCheckpointState,
    idempotencyKey?: string,
    requestHash?: string,
    commandType?: string,
  ): Promise<void>;

  getStream(schoolId: string, streamId: string): Promise<LearningEvidenceStreamState | null>;

  getEventsAfter(schoolId: string, streamId: string, afterSequence: number): Promise<LearningEvidenceEventRecord[]>;

  getEventsForEvidence(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceEventRecord[]>;

  getEventById(schoolId: string, eventId: string): Promise<LearningEvidenceEventRecord | null>;

  getLatestEvent(schoolId: string, streamId: string): Promise<LearningEvidenceEventRecord | null>;

  verifyStreamIntegrity(schoolId: string, streamId: string): Promise<{ valid: boolean; sequenceGaps: number[]; hashGaps: number[] }>;

  getIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string): Promise<{ requestHash: string; responseReference: string } | null>;

  recordIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string, requestHash: string, responseReference: string): Promise<void>;

  saveCandidateProjection(projection: LearningEvidenceCandidateProjectionState): Promise<void>;

  saveCommittedProjection(projection: CommittedLearningEvidenceProjectionState): Promise<void>;

  getCandidateProjection(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceCandidateProjectionState | null>;

  getCommittedProjection(schoolId: string, committedEvidenceId: string): Promise<CommittedLearningEvidenceProjectionState | null>;

  getCommittedProjectionByCandidateId(schoolId: string, evidenceCandidateId: string): Promise<CommittedLearningEvidenceProjectionState | null>;

  saveProjectionCheckpoint(checkpoint: EvidenceProjectionCheckpointState): Promise<void>;

  getProjectionCheckpoint(projectionName: string, schoolId: string, partitionKey: string): Promise<EvidenceProjectionCheckpointState | null>;

  getEventsForLearner(schoolId: string, learnerId: string): Promise<LearningEvidenceEventRecord[]>;
}
