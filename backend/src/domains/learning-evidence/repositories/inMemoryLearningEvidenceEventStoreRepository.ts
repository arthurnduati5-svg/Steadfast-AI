// In-memory implementation of the Learning Evidence Event Store Repository

import type { LearningEvidenceEventRecord, LearningEvidenceStreamState, LearningEvidenceCandidateProjectionState, CommittedLearningEvidenceProjectionState, EvidenceProjectionCheckpointState } from '../contracts/learningEvidenceProjectionContracts';
import type { LearningEvidenceEventStoreRepository } from './learningEvidenceEventStoreRepository';

export class InMemoryLearningEvidenceEventStoreRepository implements LearningEvidenceEventStoreRepository {
  private events: Map<string, LearningEvidenceEventRecord> = new Map();
  private streams: Map<string, LearningEvidenceStreamState> = new Map();
  private candidateProjections: Map<string, LearningEvidenceCandidateProjectionState> = new Map();
  private committedProjections: Map<string, CommittedLearningEvidenceProjectionState> = new Map();
  private idempotency: Map<string, { requestHash: string; responseReference: string }> = new Map();
  private checkpoints: Map<string, EvidenceProjectionCheckpointState> = new Map();

  private eventKey(schoolId: string, eventId: string): string {
    return `${schoolId}:${eventId}`;
  }

  private streamKey(schoolId: string, streamId: string): string {
    return `${schoolId}:${streamId}`;
  }

  private idempotencyKey(schoolId: string, idempotencyKey: string, commandType: string): string {
    return `${schoolId}:${commandType}:${idempotencyKey}`;
  }

  private candidateKey(schoolId: string, candidateId: string): string {
    return `${schoolId}:${candidateId}`;
  }

  private committedKey(schoolId: string, evidenceId: string): string {
    return `${schoolId}:${evidenceId}`;
  }

  private checkpointKey(projectionName: string, schoolId: string, partitionKey: string): string {
    return `${projectionName}:${schoolId}:${partitionKey}`;
  }

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
    this.events.set(this.eventKey(event.schoolId, event.eventId), { ...event });
    this.streams.set(this.streamKey(stream.schoolId, stream.streamId), { ...stream });
    if (candidateProjection) {
      this.candidateProjections.set(this.candidateKey(candidateProjection.schoolId, candidateProjection.evidenceCandidateId), { ...candidateProjection });
    }
    if (committedProjection) {
      this.committedProjections.set(this.committedKey(committedProjection.schoolId, committedProjection.committedEvidenceId), { ...committedProjection });
    }
    if (checkpoint) {
      this.checkpoints.set(this.checkpointKey(checkpoint.projectionName, checkpoint.schoolId, checkpoint.partitionKey), { ...checkpoint });
    }
    if (idempotencyKey && commandType && requestHash) {
      const ik = this.idempotencyKey(event.schoolId, idempotencyKey, commandType);
      this.idempotency.set(ik, { requestHash, responseReference: event.eventId });
    }
  }

  async getStream(schoolId: string, streamId: string): Promise<LearningEvidenceStreamState | null> {
    const s = this.streams.get(this.streamKey(schoolId, streamId));
    return s ? { ...s } : null;
  }

  async getEventsAfter(schoolId: string, streamId: string, afterSequence: number): Promise<LearningEvidenceEventRecord[]> {
    return Array.from(this.events.values())
      .filter(e => e.schoolId === schoolId && e.streamId === streamId && e.streamSequence > afterSequence)
      .sort((a, b) => a.streamSequence - b.streamSequence)
      .map(e => ({ ...e }));
  }

  async getEventsForEvidence(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceEventRecord[]> {
    return Array.from(this.events.values())
      .filter(e => e.schoolId === schoolId && e.evidenceCandidateId === evidenceCandidateId)
      .sort((a, b) => a.streamSequence - b.streamSequence)
      .map(e => ({ ...e }));
  }

  async getEventById(schoolId: string, eventId: string): Promise<LearningEvidenceEventRecord | null> {
    const e = this.events.get(this.eventKey(schoolId, eventId));
    return e ? { ...e } : null;
  }

  async getLatestEvent(schoolId: string, streamId: string): Promise<LearningEvidenceEventRecord | null> {
    const streamEvents = Array.from(this.events.values())
      .filter(e => e.schoolId === schoolId && e.streamId === streamId)
      .sort((a, b) => b.streamSequence - a.streamSequence);
    return streamEvents.length > 0 ? { ...streamEvents[0] } : null;
  }

  async verifyStreamIntegrity(schoolId: string, streamId: string): Promise<{ valid: boolean; sequenceGaps: number[]; hashGaps: number[] }> {
    const streamEvents = Array.from(this.events.values())
      .filter(e => e.schoolId === schoolId && e.streamId === streamId)
      .sort((a, b) => a.streamSequence - b.streamSequence);

    const sequenceGaps: number[] = [];
    const hashGaps: number[] = [];
    let expectedPrevHash = '';

    for (let i = 0; i < streamEvents.length; i++) {
      const event = streamEvents[i];
      if (event.streamSequence !== i + 1) {
        sequenceGaps.push(i + 1);
      }
      if (event.previousEventHash !== expectedPrevHash) {
        hashGaps.push(event.streamSequence);
      }
      expectedPrevHash = event.eventHash;
    }

    return {
      valid: sequenceGaps.length === 0 && hashGaps.length === 0,
      sequenceGaps,
      hashGaps,
    };
  }

  async getIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string): Promise<{ requestHash: string; responseReference: string } | null> {
    const result = this.idempotency.get(this.idempotencyKey(schoolId, idempotencyKey, commandType));
    return result ? { ...result } : null;
  }

  async recordIdempotencyResult(schoolId: string, idempotencyKey: string, commandType: string, requestHash: string, responseReference: string): Promise<void> {
    this.idempotency.set(this.idempotencyKey(schoolId, idempotencyKey, commandType), { requestHash, responseReference });
  }

  async saveCandidateProjection(projection: LearningEvidenceCandidateProjectionState): Promise<void> {
    this.candidateProjections.set(this.candidateKey(projection.schoolId, projection.evidenceCandidateId), { ...projection });
  }

  async saveCommittedProjection(projection: CommittedLearningEvidenceProjectionState): Promise<void> {
    this.committedProjections.set(this.committedKey(projection.schoolId, projection.committedEvidenceId), { ...projection });
  }

  async getCandidateProjection(schoolId: string, evidenceCandidateId: string): Promise<LearningEvidenceCandidateProjectionState | null> {
    const p = this.candidateProjections.get(this.candidateKey(schoolId, evidenceCandidateId));
    return p ? { ...p } : null;
  }

  async getCommittedProjection(schoolId: string, committedEvidenceId: string): Promise<CommittedLearningEvidenceProjectionState | null> {
    const p = this.committedProjections.get(this.committedKey(schoolId, committedEvidenceId));
    return p ? { ...p } : null;
  }

  async getCommittedProjectionByCandidateId(schoolId: string, evidenceCandidateId: string): Promise<CommittedLearningEvidenceProjectionState | null> {
    const all = Array.from(this.committedProjections.values())
      .filter(p => p.schoolId === schoolId && p.evidenceCandidateId === evidenceCandidateId);
    return all.length > 0 ? { ...all[0] } : null;
  }

  async saveProjectionCheckpoint(checkpoint: EvidenceProjectionCheckpointState): Promise<void> {
    this.checkpoints.set(this.checkpointKey(checkpoint.projectionName, checkpoint.schoolId, checkpoint.partitionKey), { ...checkpoint });
  }

  async getProjectionCheckpoint(projectionName: string, schoolId: string, partitionKey: string): Promise<EvidenceProjectionCheckpointState | null> {
    const c = this.checkpoints.get(this.checkpointKey(projectionName, schoolId, partitionKey));
    return c ? { ...c } : null;
  }

  async getEventsForLearner(schoolId: string, learnerId: string): Promise<LearningEvidenceEventRecord[]> {
    return Array.from(this.events.values())
      .filter(e => e.schoolId === schoolId && e.learnerId === learnerId)
      .sort((a, b) => a.streamSequence - b.streamSequence)
      .map(e => ({ ...e }));
  }

  /** Test-only: clears projections without affecting events or streams. */
  clearProjectionsOnly(): void {
    this.candidateProjections.clear();
    this.committedProjections.clear();
    this.checkpoints.clear();
  }

  clear(): void {
    this.events.clear();
    this.streams.clear();
    this.candidateProjections.clear();
    this.committedProjections.clear();
    this.idempotency.clear();
    this.checkpoints.clear();
  }
}
