// Projection service for the Learning Evidence Event Store
// Handles deterministic rebuild and reconciliation.

import crypto from 'crypto';
import type { LearningEvidenceEventStoreRepository } from '../repositories/learningEvidenceEventStoreRepository';
import type { LearningEvidenceEventRecord, LearningEvidenceCandidateProjectionState, CommittedLearningEvidenceProjectionState } from '../contracts/learningEvidenceProjectionContracts';
import type { EvidenceCandidateState } from '../contracts/learningEvidenceEventStoreContracts';

function generateId(): string {
  return crypto.randomUUID();
}

export class LearningEvidenceProjectionService {
  constructor(private repo: LearningEvidenceEventStoreRepository) {}

  async rebuildProjections(schoolId: string, learnerId: string): Promise<{
    result: 'consistent' | 'divergence_detected' | 'repaired' | 'blocked';
    rebuildId: string;
    eventCount: number;
    candidateProjections: number;
    committedProjections: number;
    sequenceGaps?: number[];
    hashGaps?: number[];
  }> {
    const events = await this.repo.getEventsForLearner(schoolId, learnerId);
    const rebuildId = generateId();

    if (events.length === 0) {
      return { result: 'consistent', rebuildId, eventCount: 0, candidateProjections: 0, committedProjections: 0, sequenceGaps: [], hashGaps: [] };
    }

    // Verify sequence continuity
    const sequenceGaps: number[] = [];
    const hashGaps: number[] = [];
    let expectedPrevHash = '';
    for (let i = 0; i < events.length; i++) {
      if (events[i].streamSequence !== i + 1) {
        sequenceGaps.push(i + 1);
      }
      if (events[i].previousEventHash !== expectedPrevHash) {
        hashGaps.push(events[i].streamSequence);
      }
      expectedPrevHash = events[i].eventHash;
    }

    if (sequenceGaps.length > 0 || hashGaps.length > 0) {
      return {
        result: 'blocked',
        rebuildId,
        eventCount: events.length,
        candidateProjections: 0,
        committedProjections: 0,
        sequenceGaps,
        hashGaps,
      };
    }

    const { candidates, committed } = this.applyReducers(events);

    let divergenceDetected = false;

    for (const [candidateId, rebuilt] of Object.entries(candidates)) {
      const stored = await this.repo.getCandidateProjection(schoolId, candidateId);
      if (!stored || this.candidateDiffers(stored, rebuilt)) {
        divergenceDetected = true;
      }
    }

    for (const [evidenceId, rebuilt] of Object.entries(committed)) {
      const stored = await this.repo.getCommittedProjection(schoolId, evidenceId);
      if (!stored || this.committedDiffers(stored, rebuilt)) {
        divergenceDetected = true;
      }
    }

    if (!divergenceDetected) {
      return { result: 'consistent', rebuildId, eventCount: events.length, candidateProjections: Object.keys(candidates).length, committedProjections: Object.keys(committed).length, sequenceGaps, hashGaps };
    }

    for (const rebuilt of Object.values(candidates)) {
      await this.repo.saveCandidateProjection(rebuilt);
    }
    for (const rebuilt of Object.values(committed)) {
      await this.repo.saveCommittedProjection(rebuilt);
    }

    return { result: 'repaired', rebuildId, eventCount: events.length, candidateProjections: Object.keys(candidates).length, committedProjections: Object.keys(committed).length, sequenceGaps, hashGaps };
  }

  async compareProjections(schoolId: string, learnerId: string): Promise<{
    status: 'consistent' | 'divergence_detected';
    candidateDifferences: string[];
    committedDifferences: string[];
  }> {
    const events = await this.repo.getEventsForLearner(schoolId, learnerId);
    if (events.length === 0) {
      return { status: 'consistent', candidateDifferences: [], committedDifferences: [] };
    }

    const { candidates, committed } = this.applyReducers(events);

    const candidateDifferences: string[] = [];
    const committedDifferences: string[] = [];

    for (const [candidateId, rebuilt] of Object.entries(candidates)) {
      const stored = await this.repo.getCandidateProjection(schoolId, candidateId);
      if (!stored) {
        candidateDifferences.push(`Missing stored candidate ${candidateId}`);
      } else if (this.candidateDiffers(stored, rebuilt)) {
        candidateDifferences.push(`Candidate ${candidateId} diverged (stored v${stored.version} vs rebuilt v${rebuilt.version})`);
      }
    }

    for (const [evidenceId, rebuilt] of Object.entries(committed)) {
      const stored = await this.repo.getCommittedProjection(schoolId, evidenceId);
      if (!stored) {
        committedDifferences.push(`Missing stored committed ${evidenceId}`);
      } else if (this.committedDiffers(stored, rebuilt)) {
        committedDifferences.push(`Committed ${evidenceId} diverged (stored v${stored.version} vs rebuilt v${rebuilt.version})`);
      }
    }

    return {
      status: candidateDifferences.length === 0 && committedDifferences.length === 0 ? 'consistent' : 'divergence_detected',
      candidateDifferences,
      committedDifferences,
    };
  }

  applyReducers(events: LearningEvidenceEventRecord[]): {
    candidates: Record<string, LearningEvidenceCandidateProjectionState>;
    committed: Record<string, CommittedLearningEvidenceProjectionState>;
  } {
    const candidates: Record<string, LearningEvidenceCandidateProjectionState> = {};
    const committed: Record<string, CommittedLearningEvidenceProjectionState> = {};

    for (const event of events) {
      this.reduceEvent(event, candidates, committed);
    }

    return { candidates, committed };
  }

  private reduceEvent(
    event: LearningEvidenceEventRecord,
    candidates: Record<string, LearningEvidenceCandidateProjectionState>,
    committed: Record<string, CommittedLearningEvidenceProjectionState>,
  ): void {
    const cid = event.evidenceCandidateId;
    const ceid = event.committedEvidenceId;

    switch (event.eventType) {
      case 'EVIDENCE_CANDIDATE_CREATED': {
        if (cid) {
          candidates[cid] = {
            evidenceCandidateId: cid,
            schoolId: event.schoolId,
            learnerId: event.learnerId,
            currentState: 'candidate',
            sourceType: event.sourceType,
            sourceRecordId: event.sourceRecordId,
            sourceVersion: event.sourceVersion,
            latestSequence: event.streamSequence,
            version: 1,
            misconceptionTags: [],
            eligibilityReasonCodes: [],
          };
        }
        break;
      }
      case 'EVIDENCE_VALIDATION_STARTED': {
        if (cid && candidates[cid]) {
          candidates[cid] = { ...candidates[cid], currentState: 'validating', latestSequence: event.streamSequence, version: candidates[cid].version + 1 };
        }
        break;
      }
      case 'EVIDENCE_DECLARED_INELIGIBLE': {
        if (cid && candidates[cid]) {
          candidates[cid] = { ...candidates[cid], currentState: 'ineligible', latestSequence: event.streamSequence, version: candidates[cid].version + 1 };
        }
        break;
      }
      case 'EVIDENCE_REVIEW_REQUIRED': {
        if (cid && candidates[cid]) {
          candidates[cid] = { ...candidates[cid], currentState: 'review_required', latestSequence: event.streamSequence, version: candidates[cid].version + 1 };
        }
        break;
      }
      case 'EVIDENCE_DECLARED_USABLE': {
        if (cid && candidates[cid]) {
          candidates[cid] = { ...candidates[cid], currentState: 'usable', latestSequence: event.streamSequence, version: candidates[cid].version + 1 };
        }
        break;
      }
      case 'EVIDENCE_COMMITTED': {
        if (cid && candidates[cid]) {
          candidates[cid] = { ...candidates[cid], currentState: 'committed', latestSequence: event.streamSequence, version: candidates[cid].version + 1 };
        }
        if (ceid) {
          committed[ceid] = {
            committedEvidenceId: ceid,
            evidenceCandidateId: cid ?? '',
            schoolId: event.schoolId,
            learnerId: event.learnerId,
            objectiveId: event.objectiveId,
            skillId: event.skillId,
            topicId: event.topicId,
            conceptId: event.conceptId,
            outcome: 'unscored',
            evidenceMode: 'recall',
            independence: 'unknown',
            confidenceState: 'unknown',
            integrityState: 'unknown',
            finalizationState: 'not_applicable',
            active: true,
            supersededByEvidenceId: undefined,
            committedAt: event.recordedAt,
            retainedAt: undefined,
            latestSequence: event.streamSequence,
            version: 1,
          };
        }
        break;
      }
      case 'EVIDENCE_SUPERSEDED': {
        if (ceid && committed[ceid]) {
          const payload = this.safeParseJson(event.safePayloadJson);
          committed[ceid] = {
            ...committed[ceid],
            active: false,
            supersededByEvidenceId: (payload?.replacementEvidenceCandidateId as string) ?? undefined,
            latestSequence: event.streamSequence,
            version: committed[ceid].version + 1,
          };
        }
        break;
      }
      case 'EVIDENCE_RETAINED': {
        if (ceid && committed[ceid]) {
          committed[ceid] = {
            ...committed[ceid],
            retainedAt: event.recordedAt,
            latestSequence: event.streamSequence,
            version: committed[ceid].version + 1,
          };
        }
        break;
      }
    }
  }

  private candidateDiffers(a: LearningEvidenceCandidateProjectionState, b: LearningEvidenceCandidateProjectionState): boolean {
    return a.currentState !== b.currentState || a.version !== b.version || a.latestSequence !== b.latestSequence;
  }

  private committedDiffers(a: CommittedLearningEvidenceProjectionState, b: CommittedLearningEvidenceProjectionState): boolean {
    return a.active !== b.active || a.version !== b.version || a.latestSequence !== b.latestSequence;
  }

  private safeParseJson(json: string): Record<string, unknown> | null {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
