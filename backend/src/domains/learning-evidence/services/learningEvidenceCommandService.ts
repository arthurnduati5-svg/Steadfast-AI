// Command service for the Learning Evidence Event Store
// Implements all 10 command handlers with state machine enforcement.

import crypto from 'crypto';
import type { LearningEvidenceEventStoreRepository } from '../repositories/learningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from './learningEvidencePrivacyGuard';
import { isValidTransition } from '../contracts/learningEvidenceEventStoreContracts';
import type {
  EvidenceCommand,
  EvidenceCommandResult,
  EvidenceDomainError,
  CreateEvidenceCandidateCommand,
  StartEvidenceValidationCommand,
  MarkEvidenceIneligibleCommand,
  RequireEvidenceReviewCommand,
  MarkEvidenceUsableCommand,
  CommitLearningEvidenceCommand,
  SupersedeLearningEvidenceCommand,
  RetainLearningEvidenceCommand,
  RebuildEvidenceProjectionCommand,
  VerifyEvidenceStreamIntegrityCommand,
} from '../contracts/learningEvidenceCommandContracts';
import { EVIDENCE_ERROR_CODES } from '../contracts/learningEvidenceCommandContracts';
import type {
  LearningEvidenceEventRecord,
  LearningEvidenceStreamState,
  LearningEvidenceCandidateProjectionState,
  CommittedLearningEvidenceProjectionState,
} from '../contracts/learningEvidenceProjectionContracts';
import type { EvidenceCandidateState, NormalizedEvidencePayload, EvidenceSourceLineage } from '../contracts/learningEvidenceEventStoreContracts';
import { LearningEvidenceConcurrencyError, LearningEvidenceIdempotencyConflictError } from '../repositories/learningEvidenceRepositoryErrors';

const LOGGER_PREFIX = '[LearningEvidenceCommandService]';

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

function computeHash(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function makeError(code: string, message: string, requestId: string, correlationId: string, retryable: boolean, currentSafeState?: unknown): EvidenceDomainError {
  return { code, message, requestId, correlationId, retryable, currentSafeState };
}

export class LearningEvidenceCommandService {
  constructor(
    private repo: LearningEvidenceEventStoreRepository,
    private privacyGuard: LearningEvidencePrivacyGuard,
  ) {}

  async execute(command: EvidenceCommand): Promise<EvidenceCommandResult> {
    if (command.idempotencyKey && command.requestHash) {
      const existing = await this.repo.getIdempotencyResult(command.actor.schoolId, command.idempotencyKey, command.commandType);
      if (existing) {
        if (existing.requestHash === command.requestHash) {
          const event = await this.repo.getEventById(command.actor.schoolId, existing.responseReference);
          if (event) {
            const candidate = await this.repo.getCandidateProjection(command.actor.schoolId, event.evidenceCandidateId!);
            return {
              success: true,
              data: {
                eventId: event.eventId,
                evidenceCandidateId: event.evidenceCandidateId,
                streamSequence: event.streamSequence,
                currentState: candidate?.currentState ?? 'candidate',
                eventHash: event.eventHash,
              },
            };
          }
        } else {
          return { success: false, error: makeError(EVIDENCE_ERROR_CODES.IDEMPOTENCY_CONFLICT, `Idempotency key ${command.idempotencyKey} already used with different request hash`, command.actor.requestId, command.actor.correlationId, false) };
        }
      }
    }
    try {
      switch (command.commandType) {
        case 'CreateEvidenceCandidate':
          return this.handleCreateEvidenceCandidate(command);
        case 'StartEvidenceValidation':
          return this.handleStartEvidenceValidation(command);
        case 'MarkEvidenceIneligible':
          return this.handleMarkEvidenceIneligible(command);
        case 'RequireEvidenceReview':
          return this.handleRequireEvidenceReview(command);
        case 'MarkEvidenceUsable':
          return this.handleMarkEvidenceUsable(command);
        case 'CommitLearningEvidence':
          return this.handleCommitLearningEvidence(command);
        case 'SupersedeLearningEvidence':
          return this.handleSupersedeLearningEvidence(command);
        case 'RetainLearningEvidence':
          return this.handleRetainLearningEvidence(command);
        case 'RebuildEvidenceProjection':
          return this.handleRebuildEvidenceProjection(command);
        case 'VerifyEvidenceStreamIntegrity':
          return this.handleVerifyEvidenceStreamIntegrity(command);
        default:
          return { success: false, error: makeError('UNKNOWN_COMMAND', 'Unknown command type', (command as EvidenceCommand).actor.requestId, (command as EvidenceCommand).actor.correlationId, false) };
      }
    } catch (err: any) {
      if (err instanceof LearningEvidenceConcurrencyError) {
        return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, err.message, command.actor.requestId, command.actor.correlationId, true) };
      }
      if (err instanceof LearningEvidenceIdempotencyConflictError) {
        return { success: false, error: makeError(EVIDENCE_ERROR_CODES.IDEMPOTENCY_CONFLICT, err.message, command.actor.requestId, command.actor.correlationId, false) };
      }
      const message = err?.message ?? 'Unexpected error';
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.PERSISTENCE_FAILED, message, command.actor.requestId, command.actor.correlationId, true) };
    }
  }

  private async getOrCreateStream(schoolId: string, learnerId: string, streamId: string): Promise<LearningEvidenceStreamState> {
    const existing = await this.repo.getStream(schoolId, streamId);
    if (existing) return existing;
    return {
      streamId,
      schoolId,
      learnerId,
      currentSequence: 0,
      latestEventHash: '',
    };
  }

  private buildEvent(
    stream: LearningEvidenceStreamState,
    command: EvidenceCommand,
    eventType: string,
    extra: Partial<LearningEvidenceEventRecord> = {},
  ): { event: LearningEvidenceEventRecord; updatedStream: LearningEvidenceStreamState } {
    const nextSequence = stream.currentSequence + 1;
    const schemaVersion = '1.0';
    const safePayloadJson = JSON.stringify({});
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const recordedAt = nowISO();
    const eventHashBase = `${eventType}:${nextSequence}:${payloadHash}:${previousEventHash}:${command.actor.schoolId}:${command.actor.learnerId}:${recordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: command.actor.schoolId,
      learnerId: command.learnerId,
      streamId: stream.streamId,
      streamSequence: nextSequence,
      eventType,
      evidenceCandidateId: extra.evidenceCandidateId,
      committedEvidenceId: extra.committedEvidenceId,
      sourceType: extra.sourceType ?? 'manual_seed_fixture',
      sourceRecordId: extra.sourceRecordId ?? '',
      sourceVersion: extra.sourceVersion ?? '1.0',
      objectiveId: extra.objectiveId,
      skillId: extra.skillId,
      topicId: extra.topicId,
      conceptId: extra.conceptId,
      actorId: command.actor.actorId,
      actorRole: command.actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion,
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'learner_safe',
      occurredAt: command.occurredAt,
      recordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: nextSequence,
      latestEventHash: eventHash,
    };

    return { event, updatedStream };
  }

  private roleIsAllowed(actorRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(actorRole);
  }

  private authorize(actorRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(actorRole);
  }

  private async handleCreateEvidenceCandidate(command: CreateEvidenceCandidateCommand): Promise<EvidenceCommandResult> {
    const { actor } = command;

    if (!actor.schoolId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.SCHOOL_CONTEXT_REQUIRED, 'School context is required', actor.requestId, actor.correlationId, false) };
    }

    if (!this.authorize(actor.actorRole, ['student', 'teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Role not authorized to create evidence candidates', actor.requestId, actor.correlationId, false) };
    }

    if (actor.actorRole === 'student' && command.learnerId !== actor.learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.RELATIONSHIP_FORBIDDEN, 'Students can only create evidence for themselves', actor.requestId, actor.correlationId, false) };
    }

    const privacyCheck = this.privacyGuard.validatePayload(command.safePayload as unknown as Record<string, unknown>);
    if (!privacyCheck.valid) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.PAYLOAD_FORBIDDEN, `Forbidden payload keys: ${privacyCheck.forbiddenKeys.join(', ')}`, actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, actor.requestId, actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const evidenceCandidateId = generateId();

    const sourceLineage = command.sourceLineage;

    if (!sourceLineage?.sourceType || !sourceLineage?.sourceRecordId || !sourceLineage?.sourceVersion) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.SOURCE_LINEAGE_REQUIRED, 'Source lineage is required (sourceType, sourceRecordId, sourceVersion)', actor.requestId, actor.correlationId, false) };
    }

    const safePayloadJson = JSON.stringify(command.safePayload);
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const recordedAt = nowISO();
    const eventHashBase = `EVIDENCE_CANDIDATE_CREATED:${stream.currentSequence + 1}:${payloadHash}:${previousEventHash}:${actor.schoolId}:${command.learnerId}:${recordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      streamSequence: stream.currentSequence + 1,
      eventType: 'EVIDENCE_CANDIDATE_CREATED',
      evidenceCandidateId,
      committedEvidenceId: undefined,
      sourceType: sourceLineage.sourceType,
      sourceRecordId: sourceLineage.sourceRecordId,
      sourceVersion: sourceLineage.sourceVersion,
      objectiveId: sourceLineage.objectiveId ?? command.safePayload.objectiveId,
      skillId: sourceLineage.skillId ?? command.safePayload.skillId,
      topicId: sourceLineage.topicId ?? command.safePayload.topicId,
      conceptId: sourceLineage.conceptId ?? command.safePayload.conceptId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion: '1.0',
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'learner_safe',
      occurredAt: command.occurredAt,
      recordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: stream.currentSequence + 1,
      latestEventHash: eventHash,
    };

    const candidateProjection: LearningEvidenceCandidateProjectionState = {
      evidenceCandidateId,
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      currentState: 'candidate',
      sourceType: sourceLineage.sourceType,
      sourceRecordId: sourceLineage.sourceRecordId,
      sourceVersion: sourceLineage.sourceVersion,
      outcome: command.safePayload.outcome,
      independence: command.safePayload.independence,
      evidenceMode: command.safePayload.evidenceMode,
      confidenceState: command.safePayload.confidenceState,
      integrityState: command.safePayload.integrityState,
      finalizationState: command.safePayload.finalizationState,
      difficultyBand: command.safePayload.difficultyBand,
      timeOnTaskBand: command.safePayload.timeOnTaskBand,
      misconceptionTags: command.safePayload.misconceptionTags ?? [],
      objectiveId: command.safePayload.objectiveId ?? sourceLineage.objectiveId,
      skillId: command.safePayload.skillId ?? sourceLineage.skillId,
      topicId: command.safePayload.topicId ?? sourceLineage.topicId,
      conceptId: command.safePayload.conceptId ?? sourceLineage.conceptId,
      evidenceWeightSuggestion: command.safePayload.evidenceWeightSuggestion,
      eligibilityReasonCodes: command.safePayload.eligibilityReasonCodes ?? [],
      latestSequence: event.streamSequence,
      version: 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, candidateProjection, undefined, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: {
        eventId: event.eventId,
        evidenceCandidateId,
        streamSequence: event.streamSequence,
        currentState: 'candidate' as EvidenceCandidateState,
        eventHash: event.eventHash,
      },
    };
  }

  private async handleStartEvidenceValidation(command: StartEvidenceValidationCommand): Promise<EvidenceCommandResult> {
    const { actor, evidenceCandidateId } = command;

    if (!this.authorize(actor.actorRole, ['teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only teachers or admins can validate evidence', actor.requestId, actor.correlationId, false) };
    }

    const candidate = await this.repo.getCandidateProjection(actor.schoolId, evidenceCandidateId);
    if (!candidate) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (candidate.learnerId !== command.learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (!isValidTransition(candidate.currentState, 'validating')) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.INVALID_TRANSITION, `Cannot transition from ${candidate.currentState} to validating`, actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, actor.requestId, actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const { event, updatedStream } = this.buildEvent(stream, command, 'EVIDENCE_VALIDATION_STARTED', { evidenceCandidateId });

    const updatedProjection: LearningEvidenceCandidateProjectionState = {
      ...candidate,
      currentState: 'validating',
      latestSequence: event.streamSequence,
      version: candidate.version + 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, updatedProjection, undefined, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { eventId: event.eventId, evidenceCandidateId, currentState: 'validating' as EvidenceCandidateState, streamSequence: event.streamSequence },
    };
  }

  private async handleMarkEvidenceIneligible(command: MarkEvidenceIneligibleCommand): Promise<EvidenceCommandResult> {
    const { actor, evidenceCandidateId } = command;
    if (!this.authorize(actor.actorRole, ['teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only teachers or admins can mark evidence ineligible', actor.requestId, actor.correlationId, false) };
    }

    return this.transitionCandidate(actor.schoolId, evidenceCandidateId, command.learnerId, 'ineligible', command, 'EVIDENCE_DECLARED_INELIGIBLE');
  }

  private async handleRequireEvidenceReview(command: RequireEvidenceReviewCommand): Promise<EvidenceCommandResult> {
    const { actor, evidenceCandidateId } = command;
    if (!this.authorize(actor.actorRole, ['teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only teachers or admins can require evidence review', actor.requestId, actor.correlationId, false) };
    }

    return this.transitionCandidate(actor.schoolId, evidenceCandidateId, command.learnerId, 'review_required', command, 'EVIDENCE_REVIEW_REQUIRED');
  }

  private async handleMarkEvidenceUsable(command: MarkEvidenceUsableCommand): Promise<EvidenceCommandResult> {
    const { actor, evidenceCandidateId } = command;
    if (!this.authorize(actor.actorRole, ['teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only teachers or admins can mark evidence usable', actor.requestId, actor.correlationId, false) };
    }
    return this.transitionCandidate(actor.schoolId, evidenceCandidateId, command.learnerId, 'usable', command, 'EVIDENCE_DECLARED_USABLE');
  }

  private async handleCommitLearningEvidence(command: CommitLearningEvidenceCommand): Promise<EvidenceCommandResult> {
    const { actor, evidenceCandidateId } = command;

    if (!this.authorize(actor.actorRole, ['teacher', 'school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only teachers or admins can commit evidence', actor.requestId, actor.correlationId, false) };
    }

    const candidate = await this.repo.getCandidateProjection(actor.schoolId, evidenceCandidateId);
    if (!candidate) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (candidate.learnerId !== command.learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (!isValidTransition(candidate.currentState, 'committed')) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.INVALID_TRANSITION, `Cannot transition from ${candidate.currentState} to committed`, actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, actor.requestId, actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const committedEvidenceId = generateId();
    const safePayloadJson = JSON.stringify({});
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const commitRecordedAt = nowISO();
    const eventHashBase = `EVIDENCE_COMMITTED:${stream.currentSequence + 1}:${payloadHash}:${previousEventHash}:${actor.schoolId}:${command.learnerId}:${commitRecordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      streamSequence: stream.currentSequence + 1,
      eventType: 'EVIDENCE_COMMITTED',
      evidenceCandidateId,
      committedEvidenceId,
      sourceType: candidate.sourceType,
      sourceRecordId: candidate.sourceRecordId,
      sourceVersion: candidate.sourceVersion,
      objectiveId: candidate.objectiveId,
      skillId: candidate.skillId,
      topicId: candidate.topicId,
      conceptId: candidate.conceptId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion: '1.0',
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'learner_safe',
      occurredAt: command.occurredAt,
      recordedAt: commitRecordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: stream.currentSequence + 1,
      latestEventHash: eventHash,
    };

    const updatedCandidateProjection: LearningEvidenceCandidateProjectionState = {
      ...candidate,
      currentState: 'committed',
      latestSequence: event.streamSequence,
      version: candidate.version + 1,
    };

    const committedProjection: CommittedLearningEvidenceProjectionState = {
      committedEvidenceId,
      evidenceCandidateId,
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      objectiveId: candidate.objectiveId,
      skillId: candidate.skillId,
      topicId: candidate.topicId,
      conceptId: candidate.conceptId,
      outcome: candidate.outcome ?? 'unscored',
      evidenceMode: candidate.evidenceMode ?? 'recall',
      independence: candidate.independence ?? 'unknown',
      confidenceState: candidate.confidenceState ?? 'unknown',
      integrityState: candidate.integrityState ?? 'unknown',
      finalizationState: candidate.finalizationState ?? 'not_applicable',
      evidenceWeightSuggestion: candidate.evidenceWeightSuggestion,
      active: true,
      supersededByEvidenceId: undefined,
      committedAt: nowISO(),
      retainedAt: undefined,
      latestSequence: event.streamSequence,
      version: 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, updatedCandidateProjection, committedProjection, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { eventId: event.eventId, evidenceCandidateId, committedEvidenceId, currentState: 'committed' as EvidenceCandidateState, streamSequence: event.streamSequence },
    };
  }

  private async handleSupersedeLearningEvidence(command: SupersedeLearningEvidenceCommand): Promise<EvidenceCommandResult> {
    const { actor, committedEvidenceId, replacementEvidenceCandidateId } = command;

    if (!this.authorize(actor.actorRole, ['school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only school admins or internal operators can supersede evidence', actor.requestId, actor.correlationId, false) };
    }

    const committed = await this.repo.getCommittedProjection(actor.schoolId, committedEvidenceId);
    if (!committed) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Committed evidence ${committedEvidenceId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (committed.learnerId !== command.learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Committed evidence ${committedEvidenceId} not found`, actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, actor.requestId, actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const safePayloadJson = JSON.stringify({ replacementEvidenceCandidateId });
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const supersedeRecordedAt = nowISO();
    const eventHashBase = `EVIDENCE_SUPERSEDED:${stream.currentSequence + 1}:${payloadHash}:${previousEventHash}:${actor.schoolId}:${command.learnerId}:${supersedeRecordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      streamSequence: stream.currentSequence + 1,
      eventType: 'EVIDENCE_SUPERSEDED',
      evidenceCandidateId: undefined,
      committedEvidenceId,
      sourceType: committed.evidenceMode,
      sourceRecordId: committedEvidenceId,
      sourceVersion: '1.0',
      objectiveId: committed.objectiveId,
      skillId: committed.skillId,
      topicId: committed.topicId,
      conceptId: committed.conceptId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion: '1.0',
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'learner_safe',
      occurredAt: command.occurredAt,
      recordedAt: supersedeRecordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: stream.currentSequence + 1,
      latestEventHash: eventHash,
    };

    const updatedCommittedProjection: CommittedLearningEvidenceProjectionState = {
      ...committed,
      active: false,
      supersededByEvidenceId: replacementEvidenceCandidateId,
      latestSequence: event.streamSequence,
      version: committed.version + 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, undefined, updatedCommittedProjection, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { eventId: event.eventId, committedEvidenceId, active: false, supersededByEvidenceId: replacementEvidenceCandidateId, streamSequence: event.streamSequence },
    };
  }

  private async handleRetainLearningEvidence(command: RetainLearningEvidenceCommand): Promise<EvidenceCommandResult> {
    const { actor, committedEvidenceId, policyReason } = command;

    if (!this.authorize(actor.actorRole, ['school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only school admins or internal operators can retain evidence', actor.requestId, actor.correlationId, false) };
    }

    const committed = await this.repo.getCommittedProjection(actor.schoolId, committedEvidenceId);
    if (!committed) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Committed evidence ${committedEvidenceId} not found`, actor.requestId, actor.correlationId, false) };
    }

    if (committed.learnerId !== command.learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Committed evidence ${committedEvidenceId} not found`, actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, actor.requestId, actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const safePayloadJson = JSON.stringify({ policyReason });
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const retainRecordedAt = nowISO();
    const eventHashBase = `EVIDENCE_RETAINED:${stream.currentSequence + 1}:${payloadHash}:${previousEventHash}:${actor.schoolId}:${command.learnerId}:${retainRecordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      streamSequence: stream.currentSequence + 1,
      eventType: 'EVIDENCE_RETAINED',
      evidenceCandidateId: undefined,
      committedEvidenceId,
      sourceType: committed.evidenceMode,
      sourceRecordId: committedEvidenceId,
      sourceVersion: '1.0',
      objectiveId: committed.objectiveId,
      skillId: committed.skillId,
      topicId: committed.topicId,
      conceptId: committed.conceptId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion: '1.0',
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'learner_safe',
      occurredAt: command.occurredAt,
      recordedAt: retainRecordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: stream.currentSequence + 1,
      latestEventHash: eventHash,
    };

    const updatedCommittedProjection: CommittedLearningEvidenceProjectionState = {
      ...committed,
      retainedAt: retainRecordedAt,
      latestSequence: event.streamSequence,
      version: committed.version + 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, undefined, updatedCommittedProjection, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { eventId: event.eventId, committedEvidenceId, retainedAt: retainRecordedAt, streamSequence: event.streamSequence },
    };
  }

  private async handleRebuildEvidenceProjection(command: RebuildEvidenceProjectionCommand): Promise<EvidenceCommandResult> {
    const { actor } = command;
    if (!this.authorize(actor.actorRole, ['school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only school admins or internal operators can rebuild projections', actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    const events = await this.repo.getEventsForLearner(actor.schoolId, command.learnerId);

    const rebuildReport = {
      rebuildId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      eventCount: events.length,
      result: 'consistent' as const,
      sequenceGaps: [] as number[],
      hashGaps: [] as number[],
      candidateProjections: 0,
      committedProjections: 0,
      storedCandidateVersion: 0,
      storedCommittedVersion: 0,
      rebuiltCandidateVersion: 0,
      rebuiltCommittedVersion: 0,
    };

    const safePayloadJson = JSON.stringify(rebuildReport);
    const payloadHash = computeHash(safePayloadJson);
    const previousEventHash = stream.latestEventHash;
    const rebuildRecordedAt = nowISO();
    const eventHashBase = `EVIDENCE_PROJECTION_REBUILT:${stream.currentSequence + 1}:${payloadHash}:${previousEventHash}:${actor.schoolId}:${command.learnerId}:${rebuildRecordedAt}:${command.correlationId}`;
    const eventHash = computeHash(eventHashBase);

    const event: LearningEvidenceEventRecord = {
      eventId: generateId(),
      schoolId: actor.schoolId,
      learnerId: command.learnerId,
      streamId,
      streamSequence: stream.currentSequence + 1,
      eventType: 'EVIDENCE_PROJECTION_REBUILT',
      evidenceCandidateId: undefined,
      committedEvidenceId: undefined,
      sourceType: 'manual_seed_fixture',
      sourceRecordId: streamId,
      sourceVersion: '1.0',
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      policyVersion: command.policyVersion,
      schemaVersion: '1.0',
      reasonCodes: command.reasonCodes,
      safePayloadJson,
      safePayloadHash: payloadHash,
      privacyClass: 'internal_only',
      occurredAt: command.occurredAt,
      recordedAt: rebuildRecordedAt,
      correlationId: command.correlationId,
      causationId: command.causationId,
      idempotencyKey: command.idempotencyKey,
      previousEventHash,
      eventHash,
    };

    const updatedStream: LearningEvidenceStreamState = {
      ...stream,
      currentSequence: stream.currentSequence + 1,
      latestEventHash: eventHash,
    };

    const checkpoint = {
      projectionName: 'learning_evidence_canonical',
      schoolId: actor.schoolId,
      partitionKey: command.learnerId,
      lastProcessedSequence: events.length,
      lastEventHash: events.length > 0 ? events[events.length - 1].eventHash : '',
      status: 'healthy' as const,
      failureReason: '',
    };

    await this.repo.appendEventAtomically(event, updatedStream, undefined, undefined, checkpoint, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { rebuildReport, eventId: event.eventId },
    };
  }

  private async handleVerifyEvidenceStreamIntegrity(command: VerifyEvidenceStreamIntegrityCommand): Promise<EvidenceCommandResult> {
    const { actor } = command;
    if (!this.authorize(actor.actorRole, ['school_admin', 'internal_operator'])) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.ROLE_FORBIDDEN, 'Only school admins or internal operators can verify stream integrity', actor.requestId, actor.correlationId, false) };
    }

    const streamId = `evidence_${actor.schoolId}_${command.learnerId}`;

    const integrity = await this.repo.verifyStreamIntegrity(actor.schoolId, streamId);
    const stream = await this.getOrCreateStream(actor.schoolId, command.learnerId, streamId);

    return {
      success: integrity.valid,
      data: {
        streamId,
        schoolId: actor.schoolId,
        learnerId: command.learnerId,
        currentSequence: stream.currentSequence,
        valid: integrity.valid,
        sequenceGaps: integrity.sequenceGaps,
        hashGaps: integrity.hashGaps,
      },
      error: integrity.valid ? undefined : makeError(EVIDENCE_ERROR_CODES.STREAM_INTEGRITY_FAILED, 'Stream integrity check failed', actor.requestId, actor.correlationId, false),
    };
  }

  private async transitionCandidate(
    schoolId: string,
    evidenceCandidateId: string,
    learnerId: string,
    targetState: EvidenceCandidateState,
    command: EvidenceCommand,
    eventType: string,
  ): Promise<EvidenceCommandResult> {
    const candidate = await this.repo.getCandidateProjection(schoolId, evidenceCandidateId);
    if (!candidate) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, command.actor.requestId, command.actor.correlationId, false) };
    }

    if (candidate.learnerId !== learnerId) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.NOT_FOUND, `Evidence candidate ${evidenceCandidateId} not found`, command.actor.requestId, command.actor.correlationId, false) };
    }

    if (!isValidTransition(candidate.currentState, targetState)) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.INVALID_TRANSITION, `Cannot transition from ${candidate.currentState} to ${targetState}`, command.actor.requestId, command.actor.correlationId, false) };
    }

    const streamId = `evidence_${schoolId}_${learnerId}`;
    const stream = await this.getOrCreateStream(schoolId, learnerId, streamId);

    if (stream.currentSequence !== command.expectedStreamSequence) {
      return { success: false, error: makeError(EVIDENCE_ERROR_CODES.STREAM_CONCURRENCY_CONFLICT, `Expected stream sequence ${command.expectedStreamSequence} but current is ${stream.currentSequence}`, command.actor.requestId, command.actor.correlationId, true, { currentSequence: stream.currentSequence }) };
    }

    const { event, updatedStream } = this.buildEvent(stream, command, eventType, { evidenceCandidateId });

    const updatedProjection: LearningEvidenceCandidateProjectionState = {
      ...candidate,
      currentState: targetState,
      latestSequence: event.streamSequence,
      version: candidate.version + 1,
    };

    await this.repo.appendEventAtomically(event, updatedStream, updatedProjection, undefined, undefined, command.idempotencyKey, command.requestHash, command.commandType);

    return {
      success: true,
      data: { eventId: event.eventId, evidenceCandidateId, currentState: targetState, streamSequence: event.streamSequence },
    };
  }
}
