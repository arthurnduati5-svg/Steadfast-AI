// Command Contracts for Learning Evidence Event Store

import type { EvidenceSourceLineage, NormalizedEvidencePayload, EvidenceCandidateState } from './learningEvidenceEventStoreContracts';

export interface EvidenceActorContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  learnerId: string;
  requestId: string;
  correlationId: string;
}

export interface EvidenceCommandBase {
  commandId: string;
  actor: EvidenceActorContext;
  learnerId: string;
  expectedStreamSequence: number;
  idempotencyKey: string;
  requestHash: string;
  reasonCodes: string[];
  policyVersion: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
}

export interface CreateEvidenceCandidateCommand extends EvidenceCommandBase {
  readonly commandType: 'CreateEvidenceCandidate';
  sourceLineage: EvidenceSourceLineage;
  safePayload: NormalizedEvidencePayload;
}

export interface StartEvidenceValidationCommand extends EvidenceCommandBase {
  readonly commandType: 'StartEvidenceValidation';
  evidenceCandidateId: string;
}

export interface MarkEvidenceIneligibleCommand extends EvidenceCommandBase {
  readonly commandType: 'MarkEvidenceIneligible';
  evidenceCandidateId: string;
}

export interface RequireEvidenceReviewCommand extends EvidenceCommandBase {
  readonly commandType: 'RequireEvidenceReview';
  evidenceCandidateId: string;
}

export interface MarkEvidenceUsableCommand extends EvidenceCommandBase {
  readonly commandType: 'MarkEvidenceUsable';
  evidenceCandidateId: string;
}

export interface CommitLearningEvidenceCommand extends EvidenceCommandBase {
  readonly commandType: 'CommitLearningEvidence';
  evidenceCandidateId: string;
}

export interface SupersedeLearningEvidenceCommand extends EvidenceCommandBase {
  readonly commandType: 'SupersedeLearningEvidence';
  committedEvidenceId: string;
  replacementEvidenceCandidateId: string;
}

export interface RetainLearningEvidenceCommand extends EvidenceCommandBase {
  readonly commandType: 'RetainLearningEvidence';
  committedEvidenceId: string;
  policyReason: string;
}

export interface RebuildEvidenceProjectionCommand extends EvidenceCommandBase {
  readonly commandType: 'RebuildEvidenceProjection';
  learnerId: string;
  schoolId: string;
}

export interface VerifyEvidenceStreamIntegrityCommand extends EvidenceCommandBase {
  readonly commandType: 'VerifyEvidenceStreamIntegrity';
  learnerId: string;
  schoolId: string;
}

export type EvidenceCommand =
  | CreateEvidenceCandidateCommand
  | StartEvidenceValidationCommand
  | MarkEvidenceIneligibleCommand
  | RequireEvidenceReviewCommand
  | MarkEvidenceUsableCommand
  | CommitLearningEvidenceCommand
  | SupersedeLearningEvidenceCommand
  | RetainLearningEvidenceCommand
  | RebuildEvidenceProjectionCommand
  | VerifyEvidenceStreamIntegrityCommand;

export interface CreateEvidenceCandidateResult {
  eventId: string;
  evidenceCandidateId: string;
  streamSequence: number;
  currentState: EvidenceCandidateState;
  eventHash: string;
}

export interface StartEvidenceValidationResult {
  eventId: string;
  evidenceCandidateId: string;
  currentState: EvidenceCandidateState;
  streamSequence: number;
}

export interface CommitLearningEvidenceResult {
  eventId: string;
  evidenceCandidateId: string;
  committedEvidenceId: string;
  currentState: EvidenceCandidateState;
  streamSequence: number;
}

export interface SupersedeLearningEvidenceResult {
  eventId: string;
  committedEvidenceId: string;
  active: boolean;
  supersededByEvidenceId: string;
  streamSequence: number;
}

export interface RetainLearningEvidenceResult {
  eventId: string;
  committedEvidenceId: string;
  retainedAt: string;
  streamSequence: number;
}

export interface ProjectionRebuildResult {
  rebuildReport: {
    rebuildId: string;
    schoolId: string;
    learnerId: string;
    streamId: string;
    eventCount: number;
    result: string;
    sequenceGaps: number[];
    hashGaps: number[];
    candidateProjections: number;
    committedProjections: number;
    storedCandidateVersion: number;
    storedCommittedVersion: number;
    rebuiltCandidateVersion: number;
    rebuiltCommittedVersion: number;
  };
  eventId: string;
}

export interface StreamIntegrityResult {
  streamId: string;
  schoolId: string;
  learnerId: string;
  currentSequence: number;
  valid: boolean;
  sequenceGaps: number[];
  hashGaps: number[];
}

export interface EvidenceCommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: EvidenceDomainError;
}

export type CreateEvidenceCandidateCommandResult = EvidenceCommandResult<CreateEvidenceCandidateResult>;
export type StartEvidenceValidationCommandResult = EvidenceCommandResult<StartEvidenceValidationResult>;
export type CommitLearningEvidenceCommandResult = EvidenceCommandResult<CommitLearningEvidenceResult>;
export type SupersedeLearningEvidenceCommandResult = EvidenceCommandResult<SupersedeLearningEvidenceResult>;
export type RetainLearningEvidenceCommandResult = EvidenceCommandResult<RetainLearningEvidenceResult>;
export type ProjectionRebuildCommandResult = EvidenceCommandResult<ProjectionRebuildResult>;
export type StreamIntegrityCommandResult = EvidenceCommandResult<StreamIntegrityResult>;

export interface EvidenceDomainError {
  code: string;
  message: string;
  requestId: string;
  correlationId: string;
  retryable: boolean;
  currentSafeState?: unknown;
}

export const EVIDENCE_ERROR_CODES = {
  SCHOOL_CONTEXT_REQUIRED: 'EVIDENCE_SCHOOL_CONTEXT_REQUIRED',
  ROLE_FORBIDDEN: 'EVIDENCE_ROLE_FORBIDDEN',
  RELATIONSHIP_FORBIDDEN: 'EVIDENCE_RELATIONSHIP_FORBIDDEN',
  INVALID_TRANSITION: 'EVIDENCE_INVALID_TRANSITION',
  SOURCE_LINEAGE_REQUIRED: 'EVIDENCE_SOURCE_LINEAGE_REQUIRED',
  PAYLOAD_FORBIDDEN: 'EVIDENCE_PAYLOAD_FORBIDDEN',
  POLICY_REQUIRED: 'EVIDENCE_POLICY_REQUIRED',
  NOT_FOUND: 'EVIDENCE_NOT_FOUND',
  IDEMPOTENCY_CONFLICT: 'EVIDENCE_IDEMPOTENCY_CONFLICT',
  STREAM_CONCURRENCY_CONFLICT: 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT',
  STREAM_INTEGRITY_FAILED: 'EVIDENCE_STREAM_INTEGRITY_FAILED',
  PROJECTION_DIVERGENCE: 'EVIDENCE_PROJECTION_DIVERGENCE',
  PERSISTENCE_FAILED: 'EVIDENCE_PERSISTENCE_FAILED',
} as const;
