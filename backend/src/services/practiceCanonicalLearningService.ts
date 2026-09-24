// ─────────────────────────────────────────────────────────────
// Steadfast AI — R6 Practice Canonical Learning Service
//
// Thin adapter: PracticeAttempt → canonical Learning Evidence → canonical Mastery.
// Reuses the exact accepted Learning Evidence event-store machinery used by R5.
//
// Invariants enforced here:
//  - sourceType = 'practice_attempt'
//  - The committed Learning Evidence ID is the SAME identity passed to canonical
//    Mastery (LearningEvidence.committedEvidenceId == Mastery evidenceId).
//  - One logical submission → at most 1 attempt + 1 evidence + 1 mastery
//    application, across retries and concurrent identical requests.
//  - Without a trusted server-owned evaluator, no positive mastery is created.
// ─────────────────────────────────────────────────────────────

import { createHash, randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { PrismaLearningEvidenceEventStoreRepository } from '../domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository';
import { LearningEvidenceCommandService } from '../domains/learning-evidence/services/learningEvidenceCommandService';
import { LearningEvidencePrivacyGuard } from '../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import type {
  EvidenceOutcome,
  EvidenceIndependence,
  EvidenceMode,
  ConfidenceState,
  IntegrityState,
  FinalizationState,
} from '../domains/learning-evidence/contracts/learningEvidenceEventStoreContracts';
import { resolveCanonicalRefs } from './revisionCanonicalLearningService';
import { applyPracticeEvidenceToCanonicalMastery } from './practiceMasteryCanonicalApply';
import { practiceCanonicalIdempotency } from './practiceCanonicalIdempotencyService';

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function nowISO(): string {
  return new Date().toISOString();
}

function stableRequestHash(base: string): string {
  return createHash('sha256').update(base).digest('hex');
}

export interface PracticeCanonicalEvidenceInput {
  schoolId: string;
  learnerId: string;
  attemptId: string;
  clientRequestId: string;
  subject?: string | null;
  topic?: string | null;
  curriculumObjectiveId?: string | null;
  curriculumSkillId?: string | null;
  curriculumTopicId?: string | null;
  hintsUsed: number;
  // Trusted outcome: only set when a server-owned evaluator produced it.
  trustedOutcome?: 'correct' | 'partially_correct' | 'incorrect' | null;
  /**
   * PP-10 integrity hold (optional, backward-compatible). When true the
   * mathematical fact is still committed as canonical evidence, but
   * canonical mastery application is deferred until independent evidence
   * exists. No numeric penalty, no punishment: correct math stays correct.
   */
  deferMastery?: boolean | null;
  /**
   * PP-10 safe provenance (optional, backward-compatible). Carried through
   * the existing evidence command safe payload / source lineage / reason
   * codes only. Never raw work, raw ink, hidden answers, or semantic
   * misconception labels.
   */
  practicePadProvenance?: {
    checkId?: string | null;
    problemId?: string | null;
    problemVersion?: number | null;
    documentVersion?: number | null;
    firstDivergenceStepIndex?: number | null;
    firstDivergenceReasonCode?: string | null;
    supportQuality?: string | null;
    recoveryClassification?: string | null;
    transferIndependent?: boolean | null;
    transferReason?: string | null;
    interpretationId?: string | null;
    interpretationSourceHash?: string | null;
    representationClass?: string | null;
    integrityEvidenceId?: string | null;
    integrityConcern?: string | null;
    integrityNextAction?: string | null;
  } | null;
}

export interface PracticeCanonicalResult {
  attemptId: string;
  committedEvidenceId: string | null;
  evidenceCandidateId: string | null;
  masteryApplied: boolean;
  deduplicated: boolean;
}

// ── Durable idempotency receipt (provisioned by migration ──
// 20260929000000_pp12_production_resilience; PP-12 law: migration owns
// schema, runtime assumes provisioned schema, missing schema is an
// explicit persistence failure, never silent request-path provisioning).
// One row per logical submission. Unique key blocks concurrent duplicates.

function isUniqueViolation(cause: unknown): boolean {
  const err = cause as { code?: unknown; meta?: { code?: unknown } };
  if (err?.code === 'P2002') return true;
  // Prisma wraps raw-SQL failures as P2010 with the database code in meta.
  if (String(err?.meta?.code || '') === '23505') return true;
  if (String(err?.code || '') === '23505') return true;
  const message = String((cause as Error)?.message || cause || '');
  return /unique constraint|duplicate key|already exists/i.test(message);
}

async function findExistingReceipt(schoolId: string, learnerId: string, requestHash: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "attemptId", "committedEvidenceId", "masteryApplied"
     FROM "PracticeCanonicalIdempotency"
     WHERE "schoolId" = $1 AND "learnerId" = $2 AND "requestHash" = $3
     LIMIT 1`,
    schoolId,
    learnerId,
    requestHash,
  );
  return rows[0] || null;
}

async function insertReceiptClaim(args: {
  schoolId: string;
  learnerId: string;
  requestHash: string;
  attemptId: string;
}): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PracticeCanonicalIdempotency" ("id", "schoolId", "learnerId", "requestHash", "attemptId")
       VALUES ($1, $2, $3, $4, $5)`,
      randomUUID(),
      args.schoolId,
      args.learnerId,
      args.requestHash,
      args.attemptId,
    );
    return true;
  } catch (cause) {
    // Unique violation → another concurrent identical submission owns the claim.
    // Any other failure (missing provisioned table, DB down) FAILS CLOSED:
    // never converted into a deduplication claim, never silent provisioning.
    if (!isUniqueViolation(cause)) throw cause;
    return false;
  }
}

async function updateReceipt(args: {
  schoolId: string;
  learnerId: string;
  requestHash: string;
  committedEvidenceId: string | null;
  masteryApplied: boolean;
}): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "PracticeCanonicalIdempotency"
     SET "committedEvidenceId" = $4, "masteryApplied" = $5
     WHERE "schoolId" = $1 AND "learnerId" = $2 AND "requestHash" = $3`,
    args.schoolId,
    args.learnerId,
    args.requestHash,
    args.committedEvidenceId,
    args.masteryApplied,
  );
}

// ── Evidence mode mapping ──

function practiceKindToEvidenceMode(kind: string): EvidenceMode {
  if (kind === 'teach_back') return 'teach_back';
  if (kind === 'worked_solution') return 'procedure';
  if (kind === 'open_response') return 'explanation';
  return 'application';
}

// ── Main entry ──

export async function commitPracticeLearningEvidence(
  input: PracticeCanonicalEvidenceInput,
): Promise<PracticeCanonicalResult> {
  const schoolId = safeString(input.schoolId).trim();
  const learnerId = safeString(input.learnerId).trim();
  const attemptId = safeString(input.attemptId).trim();
  if (!schoolId) throw new Error('schoolId is required for canonical practice evidence');
  if (!learnerId) throw new Error('learnerId is required for canonical practice evidence');
  if (!attemptId) throw new Error('attemptId is required for canonical practice evidence');

  // Stable logical-submission identity: learner + subject + topic + prompt-level
  // request id. Retries and concurrent duplicates hash to the same receipt.
  const requestHash = stableRequestHash(
    `practice_attempt:${schoolId}:${learnerId}:${safeString(input.clientRequestId).trim() || attemptId}`,
  );

  // PP-12: no request-path provisioning. The provisioned PracticeCanonicalIdempotency
  // table (migration 20260929000000) is assumed; a missing table throws
  // here and fails closed.

  // Fast path: identical logical submission already fully processed.
  const existing = await findExistingReceipt(schoolId, learnerId, requestHash);
  if (existing) {
    return {
      attemptId: safeString(existing.attemptId) || attemptId,
      committedEvidenceId: safeString(existing.committedEvidenceId) || null,
      evidenceCandidateId: null,
      masteryApplied: Boolean(existing.masteryApplied),
      deduplicated: true,
    };
  }

  // Claim the idempotency slot; loser of the race re-reads the winner's receipt.
  const claimed = await insertReceiptClaim({ schoolId, learnerId, requestHash, attemptId });
  if (!claimed) {
    const winner = await findExistingReceipt(schoolId, learnerId, requestHash);
    return {
      attemptId: safeString(winner?.attemptId) || attemptId,
      committedEvidenceId: safeString(winner?.committedEvidenceId) || null,
      evidenceCandidateId: null,
      masteryApplied: Boolean(winner?.masteryApplied),
      deduplicated: true,
    };
  }

  // Resolve canonical curriculum refs fail-closed (same machinery as R5).
  const resolved = await resolveCanonicalRefs({
    curriculumObjectiveId: input.curriculumObjectiveId,
    curriculumSkillId: input.curriculumSkillId,
    curriculumTopicId: input.curriculumTopicId,
  });

  const repo = new PrismaLearningEvidenceEventStoreRepository(prisma as any);
  const guard = new LearningEvidencePrivacyGuard();
  const service = new LearningEvidenceCommandService(repo as any, guard as any);

  const baseKey = `practice_evidence:${attemptId}`;
  const requestHashForStore = stableRequestHash(baseKey);
  const sourceRecordId = `practice-attempt:${attemptId}`;
  const correlationId = `practice-${attemptId}-${Date.now()}`;

  // Trusted outcome drives the evidence outcome; without a trusted evaluator
  // the evidence is recorded as unscored (support signal only).
  const trusted = input.trustedOutcome || null;
  let outcome: EvidenceOutcome = 'unscored';
  if (trusted === 'correct') outcome = 'correct';
  else if (trusted === 'partially_correct') outcome = 'partially_correct';
  else if (trusted === 'incorrect') outcome = 'incorrect';

  const independence: EvidenceIndependence =
    input.hintsUsed >= 3 ? 'heavily_supported' : input.hintsUsed >= 1 ? 'light_hint' : 'independent';  const evidenceMode: EvidenceMode = practiceKindToEvidenceMode('open_response');
  const confidenceState: ConfidenceState = outcome === 'unscored' ? 'low' : 'high';
  const integrityState: IntegrityState = 'clear';
  const finalizationState: FinalizationState = 'final';

  // PP-10: safe provenance only (scalar ids / codes / counts). The existing
  // command already carries sourceLineage + safePayload + reasonCodes, so
  // PP-10 provenance rides those exact contracts — no second ledger.
  const pp10 = input.practicePadProvenance ?? null;
  const pp10ReasonCodes = ['practice_attempt'];
  if (pp10?.recoveryClassification) pp10ReasonCodes.push(`pp10_recovery:${pp10.recoveryClassification}`);
  if (pp10?.transferIndependent === true) pp10ReasonCodes.push('pp10_transfer:independent');
  if (pp10?.integrityConcern) pp10ReasonCodes.push(`pp10_integrity:${pp10.integrityConcern}`);
  if (input.deferMastery === true) pp10ReasonCodes.push('pp10_mastery:deferred_pending_transfer');

  async function currentSeq(): Promise<number> {
    const streamId = `evidence_${schoolId}_${learnerId}`;
    const stream = await repo.getStream(schoolId, streamId);
    return stream ? stream.currentSequence : 0;
  }

  // Step 1: CreateEvidenceCandidate
  let seq = await currentSeq();
  const createCmd: any = {
    commandType: 'CreateEvidenceCandidate',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `practice:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `prac-${Date.now()}`, correlationId },
    learnerId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:create`,
    requestHash: requestHashForStore,
    reasonCodes: pp10ReasonCodes,
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
    sourceLineage: {
      sourceType: 'practice_attempt',
      sourceRecordId,
      sourceVersion: '1.0',
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
      // PP-10 safe provenance through the existing lineage contract.
      ...(pp10
        ? {
            practicePadCheckId: pp10.checkId ?? undefined,
            practicePadProblemId: pp10.problemId ?? undefined,
            practicePadProblemVersion: pp10.problemVersion ?? undefined,
            practicePadDocumentVersion: pp10.documentVersion ?? undefined,
            practicePadIntegrityEvidenceId: pp10.integrityEvidenceId ?? undefined,
            practicePadInterpretationId: pp10.interpretationId ?? undefined,
          }
        : {}),
    },
    safePayload: {
      outcome,
      independence,
      evidenceMode,
      confidenceState,
      integrityState,
      finalizationState,
      sourceVersion: '1.0',
      eligibilityReasonCodes: [],
      objectiveId: resolved.objectiveId || undefined,
      skillId: resolved.skillId || undefined,
      topicId: resolved.topicId || undefined,
      // PP-10 safe provenance through the existing safe-payload contract.
      ...(pp10
        ? {
            practicePad: {
              checkId: pp10.checkId ?? null,
              firstDivergenceStepIndex: pp10.firstDivergenceStepIndex ?? null,
              firstDivergenceReasonCode: pp10.firstDivergenceReasonCode ?? null,
              supportQuality: pp10.supportQuality ?? null,
              recoveryClassification: pp10.recoveryClassification ?? null,
              transferIndependent: pp10.transferIndependent ?? null,
              transferReason: pp10.transferReason ?? null,
              interpretationId: pp10.interpretationId ?? null,
              interpretationSourceHash: pp10.interpretationSourceHash ?? null,
              representationClass: pp10.representationClass ?? null,
              integrityEvidenceId: pp10.integrityEvidenceId ?? null,
              integrityConcern: pp10.integrityConcern ?? null,
              integrityNextAction: pp10.integrityNextAction ?? null,
              masteryDeferred: input.deferMastery === true,
            },
          }
        : {}),
    },
  };

  let res: any = await service.execute(createCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    createCmd.expectedStreamSequence = await currentSeq();
    createCmd.commandId = randomUUID();
    res = await service.execute(createCmd);
  }
  if (!res.success) {
    // Idempotent store duplicate → recover the existing candidate.
    if (res.error?.code === 'EVIDENCE_IDEMPOTENCY_CONFLICT' || res.error?.code === 'EVIDENCE_DUPLICATE') {
      const recovered = await recoverExistingCommittedEvidence(repo, schoolId, learnerId, sourceRecordId);
      if (recovered) {
        await updateReceipt({ schoolId, learnerId, requestHash, committedEvidenceId: recovered.committedEvidenceId, masteryApplied: false });
        return { attemptId, committedEvidenceId: recovered.committedEvidenceId, evidenceCandidateId: recovered.evidenceCandidateId, masteryApplied: false, deduplicated: true };
      }
    }
    throw new Error(`CreateEvidenceCandidate failed: ${res.error?.code} ${res.error?.message}`);
  }
  const evidenceCandidateId = safeString(res.data?.evidenceCandidateId);
  if (!evidenceCandidateId) throw new Error('Missing evidenceCandidateId');

  // Step 2: StartEvidenceValidation
  seq = await currentSeq();
  const validateCmd: any = {
    commandType: 'StartEvidenceValidation',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `practice:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `prac-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:validate`,
    requestHash: requestHashForStore,
    reasonCodes: ['practice_attempt'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(validateCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    validateCmd.expectedStreamSequence = await currentSeq();
    validateCmd.commandId = randomUUID();
    res = await service.execute(validateCmd);
  }
  if (!res.success) {
    const cand = await repo.getCandidateProjection(schoolId, evidenceCandidateId);
    if (!cand || (cand.currentState !== 'validating' && cand.currentState !== 'usable' && cand.currentState !== 'committed')) {
      throw new Error(`StartEvidenceValidation failed: ${res.error?.code} ${res.error?.message} state ${cand?.currentState}`);
    }
  }

  // Step 3: MarkEvidenceUsable
  seq = await currentSeq();
  const usableCmd: any = {
    commandType: 'MarkEvidenceUsable',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `practice:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `prac-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:usable`,
    requestHash: requestHashForStore,
    reasonCodes: ['practice_attempt'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(usableCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    usableCmd.expectedStreamSequence = await currentSeq();
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
  seq = await currentSeq();
  const commitCmd: any = {
    commandType: 'CommitLearningEvidence',
    commandId: randomUUID(),
    actor: { schoolId, actorId: `practice:${learnerId}`, actorRole: 'internal_operator', learnerId, requestId: `prac-${Date.now()}`, correlationId },
    learnerId,
    evidenceCandidateId,
    expectedStreamSequence: seq,
    idempotencyKey: `${baseKey}:commit`,
    requestHash: requestHashForStore,
    reasonCodes: ['practice_attempt'],
    policyVersion: '1.0',
    occurredAt: nowISO(),
    correlationId,
  };
  res = await service.execute(commitCmd);
  if (!res.success && res.error?.code === 'EVIDENCE_STREAM_CONCURRENCY_CONFLICT') {
    commitCmd.expectedStreamSequence = await currentSeq();
    commitCmd.commandId = randomUUID();
    res = await service.execute(commitCmd);
  }

  let committedEvidenceId = safeString(res.data?.committedEvidenceId);
  if (!res.success || !committedEvidenceId) {
    const committed = await (repo as any).getCommittedProjectionByCandidateId(schoolId, evidenceCandidateId);
    if (committed?.committedEvidenceId) committedEvidenceId = safeString(committed.committedEvidenceId);
  }
  if (!committedEvidenceId) {
    if (!res.success) throw new Error(`CommitLearningEvidence failed: ${res.error?.code} ${res.error?.message}`);
    throw new Error('Missing committedEvidenceId after commit');
  }

  // Step 5: canonical Mastery — ONLY for trusted, scored evidence with a
  // resolvable canonical target. The committed evidence ID is the mastery
  // evidence ID (same-identity invariant).
  // PP-10 integrity hold: deferMastery records the mathematical fact but
  // applies no mastery until independent evidence exists. No penalty.
  let masteryApplied = false;
  if (input.deferMastery === true) {
    masteryApplied = false;
  } else if (trusted && (resolved.objectiveId || resolved.skillId) && resolved.curriculumVersionId) {
    const outcomeNum = trusted === 'correct' ? 1 : trusted === 'partially_correct' ? 0.5 : 0;
    const masteryRes = await applyPracticeEvidenceToCanonicalMastery({
      schoolId,
      learnerId,
      committedEvidenceId,
      targetNodeId: (resolved.objectiveId || resolved.skillId) as string,
      targetNodeType: resolved.objectiveId ? 'learning_objective' : 'skill',
      curriculumVersionId: resolved.curriculumVersionId,
      outcome: outcomeNum,
      usable: true,
      markingConfidence: 0.9,
      integrityRisk: 0,
      independence: input.hintsUsed >= 3 ? 0.3 : input.hintsUsed >= 1 ? 0.6 : 1,
      hintDependency: input.hintsUsed >= 3 ? 0.7 : input.hintsUsed >= 1 ? 0.4 : 0,
      sourceType: 'practice_attempt',
    });
    masteryApplied = masteryRes.applied;
  }

  await updateReceipt({ schoolId, learnerId, requestHash, committedEvidenceId, masteryApplied });

  return { attemptId, committedEvidenceId, evidenceCandidateId, masteryApplied, deduplicated: false };
}

async function recoverExistingCommittedEvidence(
  repo: PrismaLearningEvidenceEventStoreRepository,
  schoolId: string,
  learnerId: string,
  sourceRecordId: string,
): Promise<{ committedEvidenceId: string; evidenceCandidateId: string } | null> {
  try {
    const events = await repo.getEventsForLearner(schoolId, learnerId);
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event: any = events[i];
      if (event?.sourceLineage?.sourceRecordId === sourceRecordId && event?.committedEvidenceId) {
        return {
          committedEvidenceId: safeString(event.committedEvidenceId),
          evidenceCandidateId: safeString(event.evidenceCandidateId),
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
