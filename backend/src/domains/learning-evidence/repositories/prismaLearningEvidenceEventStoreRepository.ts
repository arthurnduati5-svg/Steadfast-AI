// Prisma implementation of the Learning Evidence Event Store Repository

import type { LearningEvidenceEventRecord, LearningEvidenceStreamState, LearningEvidenceCandidateProjectionState, CommittedLearningEvidenceProjectionState, EvidenceProjectionCheckpointState } from '../contracts/learningEvidenceProjectionContracts';
import type { EvidenceCandidateState } from '../contracts/learningEvidenceEventStoreContracts';
import type { LearningEvidenceEventStoreRepository } from './learningEvidenceEventStoreRepository';
import { PrismaClient } from '@prisma/client';

export class PrismaLearningEvidenceEventStoreRepository implements LearningEvidenceEventStoreRepository {
  constructor(private prisma: PrismaClient) {}

  async appendEventAtomically(
    event: LearningEvidenceEventRecord,
    stream: LearningEvidenceStreamState,
    candidateProjection?: LearningEvidenceCandidateProjectionState,
    committedProjection?: CommittedLearningEvidenceProjectionState,
    checkpoint?: EvidenceProjectionCheckpointState,
    idempotencyKey?: string,
    requestHash?: string,
    commandType?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.learningEvidenceEvent.create({
        data: {
          eventId: event.eventId,
          schoolId: event.schoolId,
          learnerId: event.learnerId,
          streamId: event.streamId,
          streamSequence: event.streamSequence,
          eventType: event.eventType,
          evidenceCandidateId: event.evidenceCandidateId ?? null,
          committedEvidenceId: event.committedEvidenceId ?? null,
          sourceType: event.sourceType,
          sourceRecordId: event.sourceRecordId,
          sourceVersion: event.sourceVersion,
          objectiveId: event.objectiveId ?? null,
          skillId: event.skillId ?? null,
          topicId: event.topicId ?? null,
          conceptId: event.conceptId ?? null,
          actorId: event.actorId,
          actorRole: event.actorRole,
          policyVersion: event.policyVersion,
          schemaVersion: event.schemaVersion,
          reasonCodes: event.reasonCodes,
          safePayloadJson: event.safePayloadJson,
          safePayloadHash: event.safePayloadHash,
          privacyClass: event.privacyClass,
          occurredAt: new Date(event.occurredAt),
          recordedAt: new Date(event.recordedAt),
          correlationId: event.correlationId,
          causationId: event.causationId ?? null,
          idempotencyKey: event.idempotencyKey,
          previousEventHash: event.previousEventHash,
          eventHash: event.eventHash,
        },
      });

      await tx.learningEvidenceStream.upsert({
        where: { streamId: stream.streamId },
        update: {
          currentSequence: stream.currentSequence,
          latestEventHash: stream.latestEventHash,
        },
        create: {
          streamId: stream.streamId,
          schoolId: stream.schoolId,
          learnerId: stream.learnerId,
          currentSequence: stream.currentSequence,
          latestEventHash: stream.latestEventHash,
        },
      });

      if (candidateProjection) {
        await tx.learningEvidenceCandidateProjection.upsert({
          where: { evidenceCandidateId: candidateProjection.evidenceCandidateId },
          update: {
            currentState: candidateProjection.currentState,
            sourceType: candidateProjection.sourceType,
            sourceRecordId: candidateProjection.sourceRecordId,
            sourceVersion: candidateProjection.sourceVersion,
            outcome: candidateProjection.outcome ?? null,
            independence: candidateProjection.independence ?? null,
            evidenceMode: candidateProjection.evidenceMode ?? null,
            confidenceState: candidateProjection.confidenceState ?? null,
            integrityState: candidateProjection.integrityState ?? null,
            finalizationState: candidateProjection.finalizationState ?? null,
            difficultyBand: candidateProjection.difficultyBand ?? null,
            timeOnTaskBand: candidateProjection.timeOnTaskBand ?? null,
            misconceptionTags: candidateProjection.misconceptionTags ?? [],
            objectiveId: candidateProjection.objectiveId ?? null,
            skillId: candidateProjection.skillId ?? null,
            topicId: candidateProjection.topicId ?? null,
            conceptId: candidateProjection.conceptId ?? null,
            evidenceWeightSuggestion: candidateProjection.evidenceWeightSuggestion ?? null,
            eligibilityReasonCodes: candidateProjection.eligibilityReasonCodes ?? [],
            latestSequence: candidateProjection.latestSequence,
            version: candidateProjection.version,
          },
          create: {
            evidenceCandidateId: candidateProjection.evidenceCandidateId,
            schoolId: candidateProjection.schoolId,
            learnerId: candidateProjection.learnerId,
            currentState: candidateProjection.currentState,
            sourceType: candidateProjection.sourceType,
            sourceRecordId: candidateProjection.sourceRecordId,
            sourceVersion: candidateProjection.sourceVersion,
            outcome: candidateProjection.outcome ?? null,
            independence: candidateProjection.independence ?? null,
            evidenceMode: candidateProjection.evidenceMode ?? null,
            confidenceState: candidateProjection.confidenceState ?? null,
            integrityState: candidateProjection.integrityState ?? null,
            finalizationState: candidateProjection.finalizationState ?? null,
            difficultyBand: candidateProjection.difficultyBand ?? null,
            timeOnTaskBand: candidateProjection.timeOnTaskBand ?? null,
            misconceptionTags: candidateProjection.misconceptionTags ?? [],
            objectiveId: candidateProjection.objectiveId ?? null,
            skillId: candidateProjection.skillId ?? null,
            topicId: candidateProjection.topicId ?? null,
            conceptId: candidateProjection.conceptId ?? null,
            evidenceWeightSuggestion: candidateProjection.evidenceWeightSuggestion ?? null,
            eligibilityReasonCodes: candidateProjection.eligibilityReasonCodes ?? [],
            latestSequence: candidateProjection.latestSequence,
            version: candidateProjection.version,
          },
        });
      }

      if (committedProjection) {
        await tx.committedLearningEvidenceProjection.upsert({
          where: { committedEvidenceId: committedProjection.committedEvidenceId },
          update: {
            evidenceCandidateId: committedProjection.evidenceCandidateId,
            objectiveId: committedProjection.objectiveId ?? null,
            skillId: committedProjection.skillId ?? null,
            topicId: committedProjection.topicId ?? null,
            conceptId: committedProjection.conceptId ?? null,
            outcome: committedProjection.outcome,
            evidenceMode: committedProjection.evidenceMode,
            independence: committedProjection.independence,
            confidenceState: committedProjection.confidenceState,
            integrityState: committedProjection.integrityState,
            finalizationState: committedProjection.finalizationState,
            evidenceWeightSuggestion: committedProjection.evidenceWeightSuggestion ?? null,
            active: committedProjection.active,
            supersededByEvidenceId: committedProjection.supersededByEvidenceId ?? null,
            committedAt: committedProjection.committedAt ? new Date(committedProjection.committedAt) : null,
            retainedAt: committedProjection.retainedAt ? new Date(committedProjection.retainedAt) : null,
            latestSequence: committedProjection.latestSequence,
            version: committedProjection.version,
          },
          create: {
            committedEvidenceId: committedProjection.committedEvidenceId,
            evidenceCandidateId: committedProjection.evidenceCandidateId,
            schoolId: committedProjection.schoolId,
            learnerId: committedProjection.learnerId,
            objectiveId: committedProjection.objectiveId ?? null,
            skillId: committedProjection.skillId ?? null,
            topicId: committedProjection.topicId ?? null,
            conceptId: committedProjection.conceptId ?? null,
            outcome: committedProjection.outcome,
            evidenceMode: committedProjection.evidenceMode,
            independence: committedProjection.independence,
            confidenceState: committedProjection.confidenceState,
            integrityState: committedProjection.integrityState,
            finalizationState: committedProjection.finalizationState,
            evidenceWeightSuggestion: committedProjection.evidenceWeightSuggestion ?? null,
            active: committedProjection.active,
            supersededByEvidenceId: committedProjection.supersededByEvidenceId ?? null,
            committedAt: committedProjection.committedAt ? new Date(committedProjection.committedAt) : null,
            retainedAt: committedProjection.retainedAt ? new Date(committedProjection.retainedAt) : null,
            latestSequence: committedProjection.latestSequence,
            version: committedProjection.version,
          },
        });
      }

      if (checkpoint) {
        await tx.learningEvidenceProjectionCheckpoint.upsert({
          where: {
            projectionName_schoolId_partitionKey: {
              projectionName: checkpoint.projectionName,
              schoolId: checkpoint.schoolId,
              partitionKey: checkpoint.partitionKey,
            },
          },
          update: {
            lastProcessedSequence: checkpoint.lastProcessedSequence,
            lastEventHash: checkpoint.lastEventHash,
            status: checkpoint.status,
            failureReason: checkpoint.failureReason,
          },
          create: {
            projectionName: checkpoint.projectionName,
            schoolId: checkpoint.schoolId,
            partitionKey: checkpoint.partitionKey,
            lastProcessedSequence: checkpoint.lastProcessedSequence,
            lastEventHash: checkpoint.lastEventHash,
            status: checkpoint.status,
            failureReason: checkpoint.failureReason,
          },
        });
      }

      if (idempotencyKey && commandType && requestHash) {
        await tx.learningEvidenceIdempotency.create({
          data: {
            schoolId: event.schoolId,
            idempotencyKey,
            commandType,
            requestHash,
            responseReference: event.eventId,
          },
        });
      }
    });
  }

  async getStream(schoolId: string, streamId: string): Promise<LearningEvidenceStreamState | null> {
    const record = await this.prisma.learningEvidenceStream.findUnique({
      where: { streamId },
    });
    if (!record || record.schoolId !== schoolId) return null;
    return {
      streamId: record.streamId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      currentSequence: record.currentSequence,
      latestEventHash: record.latestEventHash,
    };
  }

  async getEventsAfter(schoolId: string, streamId: string, afterSequence: number): Promise<LearningEvidenceEventRecord[]> {
    const records = await this.prisma.learningEvidenceEvent.findMany({
      where: { schoolId, streamId, streamSequence: { gt: afterSequence } },
      orderBy: { streamSequence: 'asc' },
    });
    return records.map(r => ({
      eventId: r.eventId,
      schoolId: r.schoolId,
      learnerId: r.learnerId,
      streamId: r.streamId,
      streamSequence: r.streamSequence,
      eventType: r.eventType,
      evidenceCandidateId: r.evidenceCandidateId ?? undefined,
      committedEvidenceId: r.committedEvidenceId ?? undefined,
      sourceType: r.sourceType,
      sourceRecordId: r.sourceRecordId,
      sourceVersion: r.sourceVersion,
      objectiveId: r.objectiveId ?? undefined,
      skillId: r.skillId ?? undefined,
      topicId: r.topicId ?? undefined,
      conceptId: r.conceptId ?? undefined,
      actorId: r.actorId,
      actorRole: r.actorRole,
      policyVersion: r.policyVersion,
      schemaVersion: r.schemaVersion,
      reasonCodes: r.reasonCodes as string[],
      safePayloadJson: r.safePayloadJson,
      safePayloadHash: r.safePayloadHash,
      privacyClass: r.privacyClass,
      occurredAt: r.occurredAt.toISOString(),
      recordedAt: r.recordedAt.toISOString(),
      correlationId: r.correlationId,
      causationId: r.causationId ?? undefined,
      idempotencyKey: r.idempotencyKey,
      previousEventHash: r.previousEventHash,
      eventHash: r.eventHash,
    }));
  }

  async getEventsForEvidence(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceEventRecord[]> {
    const records = await this.prisma.learningEvidenceEvent.findMany({
      where: { schoolId, evidenceCandidateId },
      orderBy: { streamSequence: 'asc' },
    });
    return records.map(r => ({
      eventId: r.eventId,
      schoolId: r.schoolId,
      learnerId: r.learnerId,
      streamId: r.streamId,
      streamSequence: r.streamSequence,
      eventType: r.eventType,
      evidenceCandidateId: r.evidenceCandidateId ?? undefined,
      committedEvidenceId: r.committedEvidenceId ?? undefined,
      sourceType: r.sourceType,
      sourceRecordId: r.sourceRecordId,
      sourceVersion: r.sourceVersion,
      objectiveId: r.objectiveId ?? undefined,
      skillId: r.skillId ?? undefined,
      topicId: r.topicId ?? undefined,
      conceptId: r.conceptId ?? undefined,
      actorId: r.actorId,
      actorRole: r.actorRole,
      policyVersion: r.policyVersion,
      schemaVersion: r.schemaVersion,
      reasonCodes: r.reasonCodes as string[],
      safePayloadJson: r.safePayloadJson,
      safePayloadHash: r.safePayloadHash,
      privacyClass: r.privacyClass,
      occurredAt: r.occurredAt.toISOString(),
      recordedAt: r.recordedAt.toISOString(),
      correlationId: r.correlationId,
      causationId: r.causationId ?? undefined,
      idempotencyKey: r.idempotencyKey,
      previousEventHash: r.previousEventHash,
      eventHash: r.eventHash,
    }));
  }

  async getEventById(schoolId: string, eventId: string): Promise<LearningEvidenceEventRecord | null> {
    const record = await this.prisma.learningEvidenceEvent.findUnique({
      where: { eventId },
    });
    if (!record || record.schoolId !== schoolId) return null;
    return {
      eventId: record.eventId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      streamId: record.streamId,
      streamSequence: record.streamSequence,
      eventType: record.eventType,
      evidenceCandidateId: record.evidenceCandidateId ?? undefined,
      committedEvidenceId: record.committedEvidenceId ?? undefined,
      sourceType: record.sourceType,
      sourceRecordId: record.sourceRecordId,
      sourceVersion: record.sourceVersion,
      objectiveId: record.objectiveId ?? undefined,
      skillId: record.skillId ?? undefined,
      topicId: record.topicId ?? undefined,
      conceptId: record.conceptId ?? undefined,
      actorId: record.actorId,
      actorRole: record.actorRole,
      policyVersion: record.policyVersion,
      schemaVersion: record.schemaVersion,
      reasonCodes: record.reasonCodes as string[],
      safePayloadJson: record.safePayloadJson,
      safePayloadHash: record.safePayloadHash,
      privacyClass: record.privacyClass,
      occurredAt: record.occurredAt.toISOString(),
      recordedAt: record.recordedAt.toISOString(),
      correlationId: record.correlationId,
      causationId: record.causationId ?? undefined,
      idempotencyKey: record.idempotencyKey,
      previousEventHash: record.previousEventHash,
      eventHash: record.eventHash,
    };
  }

  async getLatestEvent(schoolId: string, streamId: string): Promise<LearningEvidenceEventRecord | null> {
    const record = await this.prisma.learningEvidenceEvent.findFirst({
      where: { schoolId, streamId },
      orderBy: { streamSequence: 'desc' },
    });
    if (!record) return null;
    return {
      eventId: record.eventId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      streamId: record.streamId,
      streamSequence: record.streamSequence,
      eventType: record.eventType,
      evidenceCandidateId: record.evidenceCandidateId ?? undefined,
      committedEvidenceId: record.committedEvidenceId ?? undefined,
      sourceType: record.sourceType,
      sourceRecordId: record.sourceRecordId,
      sourceVersion: record.sourceVersion,
      objectiveId: record.objectiveId ?? undefined,
      skillId: record.skillId ?? undefined,
      topicId: record.topicId ?? undefined,
      conceptId: record.conceptId ?? undefined,
      actorId: record.actorId,
      actorRole: record.actorRole,
      policyVersion: record.policyVersion,
      schemaVersion: record.schemaVersion,
      reasonCodes: record.reasonCodes as string[],
      safePayloadJson: record.safePayloadJson,
      safePayloadHash: record.safePayloadHash,
      privacyClass: record.privacyClass,
      occurredAt: record.occurredAt.toISOString(),
      recordedAt: record.recordedAt.toISOString(),
      correlationId: record.correlationId,
      causationId: record.causationId ?? undefined,
      idempotencyKey: record.idempotencyKey,
      previousEventHash: record.previousEventHash,
      eventHash: record.eventHash,
    };
  }

  async verifyStreamIntegrity(schoolId: string, streamId: string): Promise<{ valid: boolean; sequenceGaps: number[]; hashGaps: number[] }> {
    const records = await this.prisma.learningEvidenceEvent.findMany({
      where: { schoolId, streamId },
      orderBy: { streamSequence: 'asc' },
    });

    const sequenceGaps: number[] = [];
    const hashGaps: number[] = [];
    let expectedPrevHash = '';

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (r.streamSequence !== i + 1) {
        sequenceGaps.push(i + 1);
      }
      if (r.previousEventHash !== expectedPrevHash) {
        hashGaps.push(r.streamSequence);
      }
      expectedPrevHash = r.eventHash;
    }

    return {
      valid: sequenceGaps.length === 0 && hashGaps.length === 0,
      sequenceGaps,
      hashGaps,
    };
  }

  async getIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string): Promise<{ requestHash: string; responseReference: string } | null> {
    const record = await this.prisma.learningEvidenceIdempotency.findUnique({
      where: {
        schoolId_commandType_idempotencyKey: { schoolId, commandType, idempotencyKey },
      },
    });
    if (!record) return null;
    return { requestHash: record.requestHash, responseReference: record.responseReference };
  }

  async recordIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string, requestHash: string, responseReference: string): Promise<void> {
    await this.prisma.learningEvidenceIdempotency.upsert({
      where: {
        schoolId_commandType_idempotencyKey: { schoolId, commandType, idempotencyKey },
      },
      update: { commandType, requestHash, responseReference },
      create: { schoolId, idempotencyKey, commandType, requestHash, responseReference },
    });
  }

  async saveCandidateProjection(projection: LearningEvidenceCandidateProjectionState): Promise<void> {
    await this.prisma.learningEvidenceCandidateProjection.upsert({
      where: { evidenceCandidateId: projection.evidenceCandidateId },
      update: {
        currentState: projection.currentState,
        sourceType: projection.sourceType,
        sourceRecordId: projection.sourceRecordId,
        sourceVersion: projection.sourceVersion,
        outcome: projection.outcome ?? null,
        independence: projection.independence ?? null,
        evidenceMode: projection.evidenceMode ?? null,
        confidenceState: projection.confidenceState ?? null,
        integrityState: projection.integrityState ?? null,
        finalizationState: projection.finalizationState ?? null,
        difficultyBand: projection.difficultyBand ?? null,
        timeOnTaskBand: projection.timeOnTaskBand ?? null,
        misconceptionTags: projection.misconceptionTags ?? [],
        objectiveId: projection.objectiveId ?? null,
        skillId: projection.skillId ?? null,
        topicId: projection.topicId ?? null,
        conceptId: projection.conceptId ?? null,
        evidenceWeightSuggestion: projection.evidenceWeightSuggestion ?? null,
        eligibilityReasonCodes: projection.eligibilityReasonCodes ?? [],
        latestSequence: projection.latestSequence,
        version: projection.version,
      },
      create: {
        evidenceCandidateId: projection.evidenceCandidateId,
        schoolId: projection.schoolId,
        learnerId: projection.learnerId,
        currentState: projection.currentState,
        sourceType: projection.sourceType,
        sourceRecordId: projection.sourceRecordId,
        sourceVersion: projection.sourceVersion,
        outcome: projection.outcome ?? null,
        independence: projection.independence ?? null,
        evidenceMode: projection.evidenceMode ?? null,
        confidenceState: projection.confidenceState ?? null,
        integrityState: projection.integrityState ?? null,
        finalizationState: projection.finalizationState ?? null,
        difficultyBand: projection.difficultyBand ?? null,
        timeOnTaskBand: projection.timeOnTaskBand ?? null,
        misconceptionTags: projection.misconceptionTags ?? [],
        objectiveId: projection.objectiveId ?? null,
        skillId: projection.skillId ?? null,
        topicId: projection.topicId ?? null,
        conceptId: projection.conceptId ?? null,
        evidenceWeightSuggestion: projection.evidenceWeightSuggestion ?? null,
        eligibilityReasonCodes: projection.eligibilityReasonCodes ?? [],
        latestSequence: projection.latestSequence,
        version: projection.version,
      },
    });
  }

  async saveCommittedProjection(projection: CommittedLearningEvidenceProjectionState): Promise<void> {
    await this.prisma.committedLearningEvidenceProjection.upsert({
      where: { committedEvidenceId: projection.committedEvidenceId },
      update: {
        evidenceCandidateId: projection.evidenceCandidateId,
        objectiveId: projection.objectiveId ?? null,
        skillId: projection.skillId ?? null,
        topicId: projection.topicId ?? null,
        conceptId: projection.conceptId ?? null,
        outcome: projection.outcome,
        evidenceMode: projection.evidenceMode,
        independence: projection.independence,
        confidenceState: projection.confidenceState,
        integrityState: projection.integrityState,
        finalizationState: projection.finalizationState,
        evidenceWeightSuggestion: projection.evidenceWeightSuggestion ?? null,
        active: projection.active,
        supersededByEvidenceId: projection.supersededByEvidenceId ?? null,
        committedAt: projection.committedAt ? new Date(projection.committedAt) : null,
        retainedAt: projection.retainedAt ? new Date(projection.retainedAt) : null,
        latestSequence: projection.latestSequence,
        version: projection.version,
      },
      create: {
        committedEvidenceId: projection.committedEvidenceId,
        evidenceCandidateId: projection.evidenceCandidateId,
        schoolId: projection.schoolId,
        learnerId: projection.learnerId,
        objectiveId: projection.objectiveId ?? null,
        skillId: projection.skillId ?? null,
        topicId: projection.topicId ?? null,
        conceptId: projection.conceptId ?? null,
        outcome: projection.outcome,
        evidenceMode: projection.evidenceMode,
        independence: projection.independence,
        confidenceState: projection.confidenceState,
        integrityState: projection.integrityState,
        finalizationState: projection.finalizationState,
        evidenceWeightSuggestion: projection.evidenceWeightSuggestion ?? null,
        active: projection.active,
        supersededByEvidenceId: projection.supersededByEvidenceId ?? null,
        committedAt: projection.committedAt ? new Date(projection.committedAt) : null,
        retainedAt: projection.retainedAt ? new Date(projection.retainedAt) : null,
        latestSequence: projection.latestSequence,
        version: projection.version,
      },
    });
  }

  async getCandidateProjection(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceCandidateProjectionState | null> {
    const record = await this.prisma.learningEvidenceCandidateProjection.findUnique({
      where: { evidenceCandidateId },
    });
    if (!record || record.schoolId !== schoolId) return null;
    return {
      evidenceCandidateId: record.evidenceCandidateId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      currentState: record.currentState as EvidenceCandidateState,
      sourceType: record.sourceType,
      sourceRecordId: record.sourceRecordId,
      sourceVersion: record.sourceVersion,
      outcome: record.outcome ?? undefined,
      independence: record.independence ?? undefined,
      evidenceMode: record.evidenceMode ?? undefined,
      confidenceState: record.confidenceState ?? undefined,
      integrityState: record.integrityState ?? undefined,
      finalizationState: record.finalizationState ?? undefined,
      difficultyBand: record.difficultyBand ?? undefined,
      timeOnTaskBand: record.timeOnTaskBand ?? undefined,
      misconceptionTags: record.misconceptionTags as string[],
      objectiveId: record.objectiveId ?? undefined,
      skillId: record.skillId ?? undefined,
      topicId: record.topicId ?? undefined,
      conceptId: record.conceptId ?? undefined,
      evidenceWeightSuggestion: record.evidenceWeightSuggestion ?? undefined,
      eligibilityReasonCodes: record.eligibilityReasonCodes as string[],
      latestSequence: record.latestSequence,
      version: record.version,
    };
  }

  async getCommittedProjection(schoolId: string, committedEvidenceId: string): Promise<CommittedLearningEvidenceProjectionState | null> {
    const record = await this.prisma.committedLearningEvidenceProjection.findUnique({
      where: { committedEvidenceId },
    });
    if (!record || record.schoolId !== schoolId) return null;
    return {
      committedEvidenceId: record.committedEvidenceId,
      evidenceCandidateId: record.evidenceCandidateId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      objectiveId: record.objectiveId ?? undefined,
      skillId: record.skillId ?? undefined,
      topicId: record.topicId ?? undefined,
      conceptId: record.conceptId ?? undefined,
      outcome: record.outcome,
      evidenceMode: record.evidenceMode,
      independence: record.independence,
      confidenceState: record.confidenceState,
      integrityState: record.integrityState,
      finalizationState: record.finalizationState,
      evidenceWeightSuggestion: record.evidenceWeightSuggestion ?? undefined,
      active: record.active,
      supersededByEvidenceId: record.supersededByEvidenceId ?? undefined,
      committedAt: record.committedAt?.toISOString() ?? undefined,
      retainedAt: record.retainedAt?.toISOString() ?? undefined,
      latestSequence: record.latestSequence,
      version: record.version,
    };
  }

  async getCommittedProjectionByCandidateId(schoolId: string, evidenceCandidateId: string): Promise<CommittedLearningEvidenceProjectionState | null> {
    const record = await this.prisma.committedLearningEvidenceProjection.findFirst({
      where: { schoolId, evidenceCandidateId },
    });
    if (!record) return null;
    return {
      committedEvidenceId: record.committedEvidenceId,
      evidenceCandidateId: record.evidenceCandidateId,
      schoolId: record.schoolId,
      learnerId: record.learnerId,
      objectiveId: record.objectiveId ?? undefined,
      skillId: record.skillId ?? undefined,
      topicId: record.topicId ?? undefined,
      conceptId: record.conceptId ?? undefined,
      outcome: record.outcome,
      evidenceMode: record.evidenceMode,
      independence: record.independence,
      confidenceState: record.confidenceState,
      integrityState: record.integrityState,
      finalizationState: record.finalizationState,
      evidenceWeightSuggestion: record.evidenceWeightSuggestion ?? undefined,
      active: record.active,
      supersededByEvidenceId: record.supersededByEvidenceId ?? undefined,
      committedAt: record.committedAt?.toISOString() ?? undefined,
      retainedAt: record.retainedAt?.toISOString() ?? undefined,
      latestSequence: record.latestSequence,
      version: record.version,
    };
  }

  async saveProjectionCheckpoint(checkpoint: EvidenceProjectionCheckpointState): Promise<void> {
    await this.prisma.learningEvidenceProjectionCheckpoint.upsert({
      where: {
        projectionName_schoolId_partitionKey: {
          projectionName: checkpoint.projectionName,
          schoolId: checkpoint.schoolId,
          partitionKey: checkpoint.partitionKey,
        },
      },
      update: {
        lastProcessedSequence: checkpoint.lastProcessedSequence,
        lastEventHash: checkpoint.lastEventHash,
        status: checkpoint.status,
        failureReason: checkpoint.failureReason,
      },
      create: {
        projectionName: checkpoint.projectionName,
        schoolId: checkpoint.schoolId,
        partitionKey: checkpoint.partitionKey,
        lastProcessedSequence: checkpoint.lastProcessedSequence,
        lastEventHash: checkpoint.lastEventHash,
        status: checkpoint.status,
        failureReason: checkpoint.failureReason,
      },
    });
  }

  async getProjectionCheckpoint(projectionName: string, schoolId: string, partitionKey: string): Promise<EvidenceProjectionCheckpointState | null> {
    const record = await this.prisma.learningEvidenceProjectionCheckpoint.findUnique({
      where: {
        projectionName_schoolId_partitionKey: { projectionName, schoolId, partitionKey },
      },
    });
    if (!record) return null;
    return {
      projectionName: record.projectionName,
      schoolId: record.schoolId,
      partitionKey: record.partitionKey,
      lastProcessedSequence: record.lastProcessedSequence,
      lastEventHash: record.lastEventHash,
      status: record.status as EvidenceProjectionCheckpointState['status'],
      failureReason: record.failureReason,
    };
  }

  async getEventsForLearner(schoolId: string, learnerId: string): Promise<LearningEvidenceEventRecord[]> {
    const records = await this.prisma.learningEvidenceEvent.findMany({
      where: { schoolId, learnerId },
      orderBy: { streamSequence: 'asc' },
    });
    return records.map(r => ({
      eventId: r.eventId,
      schoolId: r.schoolId,
      learnerId: r.learnerId,
      streamId: r.streamId,
      streamSequence: r.streamSequence,
      eventType: r.eventType,
      evidenceCandidateId: r.evidenceCandidateId ?? undefined,
      committedEvidenceId: r.committedEvidenceId ?? undefined,
      sourceType: r.sourceType,
      sourceRecordId: r.sourceRecordId,
      sourceVersion: r.sourceVersion,
      objectiveId: r.objectiveId ?? undefined,
      skillId: r.skillId ?? undefined,
      topicId: r.topicId ?? undefined,
      conceptId: r.conceptId ?? undefined,
      actorId: r.actorId,
      actorRole: r.actorRole,
      policyVersion: r.policyVersion,
      schemaVersion: r.schemaVersion,
      reasonCodes: r.reasonCodes as string[],
      safePayloadJson: r.safePayloadJson,
      safePayloadHash: r.safePayloadHash,
      privacyClass: r.privacyClass,
      occurredAt: r.occurredAt.toISOString(),
      recordedAt: r.recordedAt.toISOString(),
      correlationId: r.correlationId,
      causationId: r.causationId ?? undefined,
      idempotencyKey: r.idempotencyKey,
      previousEventHash: r.previousEventHash,
      eventHash: r.eventHash,
    }));
  }
}
