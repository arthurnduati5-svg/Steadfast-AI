// Thin adapter: revision -> canonical Learning Evidence + canonical Mastery
// No new evidence/mastery subsystem, only wraps existing canonical owners.

import { createHash, randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { PrismaLearningEvidenceEventStoreRepository } from '../domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository';
import { LearningEvidenceCommandService } from '../domains/learning-evidence/services/learningEvidenceCommandService';
import { LearningEvidencePrivacyGuard } from '../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import type { EvidenceOutcome, EvidenceIndependence, EvidenceMode, ConfidenceState, IntegrityState, FinalizationState } from '../domains/learning-evidence/contracts/learningEvidenceEventStoreContracts';
import { InMemoryMasteryRepository } from './probabilisticMasteryRepository';
import { applyEvidenceWithRepository } from './probabilisticMasteryEvidenceProcessor';
import { createFixturePolicy } from './probabilisticMasteryPolicy';
import { EvidenceWeightedStrategy } from './probabilisticMasteryStrategy';
import type { MasteryTarget, NormalizedMasteryEvidence, MasteryActorContext } from './probabilisticMasteryContracts';

function safeString(v: unknown): string { return typeof v === 'string' ? v : ''; }

export interface RevisionCanonicalEvidenceInput {
  schoolId: string;
  learnerId: string;
  revisionItemId: string;
  revisionSessionId: string;
  stage: 'recall' | 'quick_check' | 'similar' | 'wrap';
  idempotencyKey: string; // sha256 of request fingerprint, stable
  curriculumObjectiveId?: string | null;
  curriculumSkillId?: string | null;
  curriculumTopicId?: string | null;
  supportUsed: boolean;
  trustedOutcome?: 'correct' | 'partially_correct' | 'incorrect' | null;
}

export interface CommitResult {
  committedEvidenceId: string;
  evidenceCandidateId: string;
  sourceType: string;
}

// Singleton mastery repo for revision (shared across requests, test-resettable)
export const revisionMasteryRepository = new InMemoryMasteryRepository();
const masteryPolicy = createFixturePolicy();
const masteryStrategy = new EvidenceWeightedStrategy();

// Test seam: deterministic mastery failure injection (C4)
let _forceMasteryFailure = false;
export function __setForceMasteryFailure(v: boolean) { _forceMasteryFailure = v; }
export function __resetMasteryForTests() {
  try { revisionMasteryRepository.resetForTest(); } catch {}
  _forceMasteryFailure = false;
}

// Resolve canonical hierarchy LearningObjective -> Skill -> Topic -> Version
export async function resolveCanonicalRefs(input: {
  curriculumObjectiveId?: string | null;
  curriculumSkillId?: string | null;
  curriculumTopicId?: string | null;
}): Promise<{ objectiveId: string | null; skillId: string | null; topicId: string | null; curriculumVersionId: string | null }> {
  const objectiveIdRaw = safeString(input.curriculumObjectiveId).trim() || null;
  const skillIdRaw = safeString(input.curriculumSkillId).trim() || null;
  const topicIdRaw = safeString(input.curriculumTopicId).trim() || null;

  if (!objectiveIdRaw && !skillIdRaw && !topicIdRaw) {
    return { objectiveId: null, skillId: null, topicId: null, curriculumVersionId: null };
  }

  // If objectiveId supplied, must exist and drive chain
  if (objectiveIdRaw) {
    const [obj] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumSkillId" FROM "LearningObjectiveRecord" WHERE "id" = $1 LIMIT 1`, objectiveIdRaw);
    if (!obj) throw new Error(`Invalid curriculumObjectiveId: ${objectiveIdRaw}`);
    const skillId = safeString(obj.curriculumSkillId).trim();
    if (!skillId) throw new Error(`Invalid curriculumObjectiveId: ${objectiveIdRaw} has no skill`);
    const [skill] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumTopicId" FROM "CurriculumSkillRecord" WHERE "id" = $1 LIMIT 1`, skillId);
    if (!skill) throw new Error(`Invalid curriculumSkillId: ${skillId} for objective ${objectiveIdRaw}`);
    const topicId = safeString(skill.curriculumTopicId).trim();
    const [topic] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumVersionId" FROM "CurriculumTopicRecord" WHERE "id" = $1 LIMIT 1`, topicId);
    if (!topic) throw new Error(`Invalid curriculumTopicId: ${topicId} for skill ${skillId}`);
    const versionId = safeString(topic.curriculumVersionId).trim();
    const [version] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id" FROM "CurriculumVersionRecord" WHERE "id" = $1 LIMIT 1`, versionId);
    if (!version) throw new Error(`Invalid curriculumVersionId: ${versionId} for topic ${topicId}`);

    // If caller also supplied skillId/topicId, verify they match the resolved chain (fail-closed if mismatch)
    if (skillIdRaw && skillIdRaw !== skillId) throw new Error(`curriculumSkillId ${skillIdRaw} does not match objective's skill ${skillId}`);
    if (topicIdRaw && topicIdRaw !== topicId) throw new Error(`curriculumTopicId ${topicIdRaw} does not match skill's topic ${topicId}`);

    return { objectiveId: objectiveIdRaw, skillId, topicId, curriculumVersionId: versionId };
  }

  if (skillIdRaw) {
    const [skill] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumTopicId" FROM "CurriculumSkillRecord" WHERE "id" = $1 LIMIT 1`, skillIdRaw);
    if (!skill) throw new Error(`Invalid curriculumSkillId: ${skillIdRaw}`);
    const topicId = safeString(skill.curriculumTopicId).trim();
    if (topicIdRaw && topicIdRaw !== topicId) throw new Error(`curriculumTopicId ${topicIdRaw} does not match skill's topic ${topicId}`);
    const [topic] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumVersionId" FROM "CurriculumTopicRecord" WHERE "id" = $1 LIMIT 1`, topicId);
    if (!topic) throw new Error(`Invalid curriculumTopicId: ${topicId} for skill ${skillIdRaw}`);
    const versionId = safeString(topic.curriculumVersionId).trim();
    const [version] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id" FROM "CurriculumVersionRecord" WHERE "id" = $1 LIMIT 1`, versionId);
    if (!version) throw new Error(`Invalid curriculumVersionId: ${versionId} for topic ${topicId}`);
    if (topicIdRaw && topicIdRaw !== topicId) throw new Error(`Mismatch topic`);
    return { objectiveId: null, skillId: skillIdRaw, topicId, curriculumVersionId: versionId };
  }

  if (topicIdRaw) {
    const [topic] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id", "curriculumVersionId" FROM "CurriculumTopicRecord" WHERE "id" = $1 LIMIT 1`, topicIdRaw);
    if (!topic) throw new Error(`Invalid curriculumTopicId: ${topicIdRaw}`);
    const versionId = safeString(topic.curriculumVersionId).trim();
    const [version] = await prisma.$queryRawUnsafe<any[]>(`SELECT "id" FROM "CurriculumVersionRecord" WHERE "id" = $1 LIMIT 1`, versionId);
    if (!version) throw new Error(`Invalid curriculumVersionId: ${versionId} for topic ${topicIdRaw}`);
    return { objectiveId: null, skillId: null, topicId: topicIdRaw, curriculumVersionId: versionId };
  }

  return { objectiveId: null, skillId: null, topicId: null, curriculumVersionId: null };
}

function stageToEvidenceMode(stage: string): EvidenceMode {
  if (stage === 'recall') return 'recall';
  if (stage === 'quick_check') return 'explanation';
  if (stage === 'similar') return 'application';
  if (stage === 'wrap') return 'reflection';
  return 'recall';
}

function nowISO() { return new Date().toISOString(); }

function stableRequestHash(base: string): string {
  return createHash('sha256').update(base).digest('hex');
}

async function getCurrentSequence(repo: PrismaLearningEvidenceEventStoreRepository, schoolId: string, learnerId: string): Promise<number> {
  const streamId = `evidence_${schoolId}_${learnerId}`;
  const stream = await repo.getStream(schoolId, streamId);
  return stream ? stream.currentSequence : 0;
}

export async function commitRevisionLearningEvidence(input: RevisionCanonicalEvidenceInput): Promise<CommitResult> {
  const schoolId = safeString(input.schoolId).trim();
  const learnerId = safeString(input.learnerId).trim();
  if (!schoolId) throw new Error('schoolId is required for canonical evidence');
  if (!learnerId) throw new Error('learnerId is required for canonical evidence');

  const repo = new PrismaLearningEvidenceEventStoreRepository(prisma as any);
  const guard = new LearningEvidencePrivacyGuard();
  const service = new LearningEvidenceCommandService(repo as any, guard as any);

  // Resolve canonical refs fail-closed
  const resolved = await resolveCanonicalRefs({
    curriculumObjectiveId: input.curriculumObjectiveId,
    curriculumSkillId: input.curriculumSkillId,
    curriculumTopicId: input.curriculumTopicId,
  });

  // Stable base key for idempotency: revision_evidence:<sessionId>:<stage>:<sha256>
  const baseKey = `revision_evidence:${input.revisionSessionId}:${input.stage}:${input.idempotencyKey}`;
  const requestHash = stableRequestHash(baseKey);
  const sourceRecordId = `revision-guided:${input.revisionSessionId}:${input.stage}`;
  const sourceVersion = '1.0';

  // Determine outcome & dimensions
  let outcome: EvidenceOutcome = 'unscored';
  if (input.trustedOutcome === 'correct') outcome = 'correct';
  else if (input.trustedOutcome === 'partially_correct') outcome = 'partially_correct';
  else if (input.trustedOutcome === 'incorrect') outcome = 'incorrect';
  else outcome = 'unscored';

  const independence: EvidenceIndependence = input.supportUsed ? 'guided' : 'independent';
  const evidenceMode: EvidenceMode = stageToEvidenceMode(input.stage);
  const confidenceState: ConfidenceState = outcome === 'unscored' ? 'low' : 'high';
  const integrityState: IntegrityState = 'clear';
  const finalizationState: FinalizationState = 'final';
  const correlationId = `revision-${input.revisionSessionId}-${input.stage}-${Date.now()}`;

  // Before creating, check if evidence already exists via committed projection lookup by sourceRecordId?
  // We use idempotency keys to handle retries; additionally, try to find existing committed evidence by querying repo for events with sourceRecordId
  // Simpler: attempt to fetch existing candidate by idempotency key if already committed
  // But we rely on service idempotency: Create will return existing if same key+hash

  // Step 1: CreateEvidenceCandidate
  let evidenceCandidateId: string | null = null;
  let seq = await getCurrentSequence(repo, schoolId, learnerId);
  const createCmd: any = {
    commandType: 'CreateEvidenceCandidate',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `revision:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `rev-${Date.now()}`, correlationId },
    learnerId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:create`,
    requestHash,
    reasonCodes: ['revision_recall'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
    sourceLineage: {
      sourceType: 'revision_recall',
      sourceRecordId,
      sourceVersion,
      schoolId,
      learnerId,
      objectiveId: resolved.objectiveId || undefined,
      skillId: resolved.skillId || undefined,
      topicId: resolved.topicId || undefined,
      occurredAt: nowISO(),
      outcome,
      integrityState,
      finalizationState,
      policyVersion: '1.0',
    },
    safePayload: {
      outcome,
      independence,
      evidenceMode,
      confidenceState,
      integrityState,
      finalizationState,
      sourceVersion,
      eligibilityReasonCodes: [],
      objectiveId: resolved.objectiveId || undefined,
      skillId: resolved.skillId || undefined,
      topicId: resolved.topicId || undefined,
    },
  };

  let res: any = await service.execute(createCmd);
  // Handle concurrency retry once
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    seq = await getCurrentSequence(repo, schoolId, learnerId);
    createCmd.expectedStreamSequence = seq;
    createCmd.commandId = randomUUID();
    res = await service.execute(createCmd);
  }
  if (!res.success) {
    // If idempotency duplicate returns success via early return, it will be success true
    throw new Error(`CreateEvidenceCandidate failed: ${res.error?.code} ${res.error?.message}`);
  }
  evidenceCandidateId = res.data.evidenceCandidateId as string;
  if (!evidenceCandidateId) throw new Error('Missing evidenceCandidateId');

  // Step 2: StartEvidenceValidation
  seq = await getCurrentSequence(repo, schoolId, learnerId);
  const validateCmd: any = {
    commandType: 'StartEvidenceValidation',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `revision:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `rev-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:validate`,
    requestHash,
    reasonCodes: ['revision_recall'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(validateCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    seq = await getCurrentSequence(repo, schoolId, learnerId);
    validateCmd.expectedStreamSequence = seq;
    validateCmd.commandId = randomUUID();
    res = await service.execute(validateCmd);
  }
  // If already validating/usable etc, transition may fail with invalid transition; treat as idempotent success if already beyond
  if (!res.success) {
    // Check if candidate already usable/committed (means validation already done)
    const cand = await repo.getCandidateProjection(schoolId, evidenceCandidateId);
    if (!cand || (cand.currentState !== 'validating' && cand.currentState !== 'usable' && cand.currentState !== 'committed')) {
      throw new Error(`StartEvidenceValidation failed: ${res.error?.code} ${res.error?.message} state ${cand?.currentState}`);
    }
    // else already progressed, continue
  }

  // Step 3: MarkEvidenceUsable
  seq = await getCurrentSequence(repo, schoolId, learnerId);
  const usableCmd: any = {
    commandType: 'MarkEvidenceUsable',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `revision:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `rev-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:usable`,
    requestHash,
    reasonCodes: ['revision_recall'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(usableCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    seq = await getCurrentSequence(repo, schoolId, learnerId);
    usableCmd.expectedStreamSequence = seq;
    usableCmd.commandId = randomUUID();
    res = await service.execute(usableCmd);
  }
  if (!res.success) {
    const cand = await repo.getCandidateProjection(schoolId, evidenceCandidateId);
    if (!cand || (cand.currentState !== 'usable' && cand.currentState !== 'committed')) {
      throw new Error(`MarkEvidenceUsable failed: ${res.error?.code} ${res.error?.message} state ${cand?.currentState}`);
    }
  }

  // Step 4: CommitLearningEvidence
  seq = await getCurrentSequence(repo, schoolId, learnerId);
  const commitCmd: any = {
    commandType: 'CommitLearningEvidence',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `revision:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `rev-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:commit`,
    requestHash,
    reasonCodes: ['revision_recall'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(commitCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    seq = await getCurrentSequence(repo, schoolId, learnerId);
    commitCmd.expectedStreamSequence = seq;
    commitCmd.commandId = randomUUID();
    res = await service.execute(commitCmd);
  }
  if (!res.success) {
    // If already committed, fetch committed projection
    const cand = await repo.getCandidateProjection(schoolId, evidenceCandidateId);
    if (cand?.currentState === 'committed') {
      const committed = await (repo as any).getCommittedProjectionByCandidateId(schoolId, evidenceCandidateId);
      if (committed?.committedEvidenceId) {
        return { committedEvidenceId: committed.committedEvidenceId, evidenceCandidateId, sourceType: 'revision_recall' };
      }
      // fallback: query via events?
      const events = await repo.getEventsForLearner(schoolId, learnerId);
      const ev = [...events].reverse().find((e: any) => e.evidenceCandidateId === evidenceCandidateId && e.committedEvidenceId);
      if (ev?.committedEvidenceId) return { committedEvidenceId: ev.committedEvidenceId, evidenceCandidateId, sourceType: 'revision_recall' };
    }
    throw new Error(`CommitLearningEvidence failed: ${res.error?.code} ${res.error?.message}`);
  }

  let committedEvidenceId = res.data?.committedEvidenceId as string | undefined;
  if (!committedEvidenceId) {
    // Try to fetch via repo if idempotent early return didn't include it
    const committed = await (repo as any).getCommittedProjectionByCandidateId(schoolId, evidenceCandidateId);
    if (committed?.committedEvidenceId) committedEvidenceId = committed.committedEvidenceId;
  }
  if (!committedEvidenceId) throw new Error('Missing committedEvidenceId after commit');
  return { committedEvidenceId, evidenceCandidateId, sourceType: 'revision_recall' };
}

export interface ApplyMasteryInput {
  schoolId: string;
  learnerId: string;
  committedEvidenceId: string;
  targetNodeId: string;
  targetNodeType: 'learning_objective' | 'skill';
  curriculumVersionId: string;
  outcome: number; // 1, 0.5, 0, -1 etc
  usable: boolean;
  markingConfidence: number;
  integrityRisk: number;
  independence: number;
  hintDependency: number;
  sourceType: 'revision_recall';
}

export async function applyRevisionEvidenceToCanonicalMastery(input: ApplyMasteryInput): Promise<{ applied: boolean; state?: any }> {
  if (_forceMasteryFailure) {
    throw new Error('Injected mastery failure for C4');
  }

  // If not usable or no target, skip (heuristic unscored path)
  if (!input.usable) {
    return { applied: false };
  }
  if (!input.targetNodeId || !input.curriculumVersionId) {
    return { applied: false };
  }

  const evidence: NormalizedMasteryEvidence = {
    evidenceId: input.committedEvidenceId,
    schoolId: input.schoolId,
    learnerId: input.learnerId,
    targetNodeId: input.targetNodeId,
    targetNodeType: input.targetNodeType as any,
    curriculumVersionId: input.curriculumVersionId,
    sourceType: input.sourceType,
    outcome: input.outcome,
    usable: input.usable,
    markingConfidence: input.markingConfidence,
    integrityRisk: input.integrityRisk,
    independence: input.independence,
    hintDependency: input.hintDependency,
    explanationQuality: null,
    misconceptionTags: [],
    transferSignal: null,
    retentionSignal: null,
    occurredAt: new Date(),
    committedAt: new Date(),
    policyVersion: masteryPolicy.policyVersion,
    supersedes: null,
  };

  const target: MasteryTarget = {
    schoolId: input.schoolId,
    learnerId: input.learnerId,
    targetNodeId: input.targetNodeId,
    targetNodeType: input.targetNodeType as any,
    curriculumVersionId: input.curriculumVersionId,
  };

  const actor: MasteryActorContext = {
    schoolId: input.schoolId,
    actorId: input.learnerId,
    actorRole: 'internal_operator',
    learnerId: input.learnerId,
    requestId: `rev-mastery-${Date.now()}`,
    correlationId: `rev-mastery-${Date.now()}`,
  };

  const clock = { now: () => new Date() };
  const idGen = { nextId: (kind: string) => `${kind}_${randomUUID().slice(0, 8)}` };
  const correlationId = `rev-mastery-${input.committedEvidenceId}`;

  const currentState = revisionMasteryRepository.readState(target);
  const result: any = applyEvidenceWithRepository(currentState, evidence as any, actor as any, target as any, masteryPolicy as any, masteryStrategy as any, null as any, clock as any, idGen as any, revisionMasteryRepository as any, correlationId as any);

  // result may be AuthorizationError
  if (result && typeof result === 'object' && 'code' in result) {
    throw new Error(`Mastery authorization failed: ${result.message}`);
  }
  if (result.rejected) {
    if (result.rejectReason === 'evidence already applied') {
      // Idempotent duplicate, treat as not newly applied but not error
      return { applied: false, state: result.state };
    }
    throw new Error(`Mastery rejected: ${result.rejectReason}`);
  }
  if (!result.committed) throw new Error('Mastery commit failed');

  return { applied: true, state: result.state };
}
