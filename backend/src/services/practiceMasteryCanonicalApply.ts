// ─────────────────────────────────────────────────────────────
// R6: canonical mastery application for practice evidence.
// Reuses the exact Probabilistic Mastery contracts/policies/strategy owned by
// the mastery domain — no new mastery algorithm, no second evidence identity.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import {
  revisionMasteryRepository,
} from './revisionCanonicalLearningService';
import { applyEvidenceWithRepository } from './probabilisticMasteryEvidenceProcessor';
import { createFixturePolicy } from './probabilisticMasteryPolicy';
import { EvidenceWeightedStrategy } from './probabilisticMasteryStrategy';
import type {
  MasteryTarget,
  NormalizedMasteryEvidence,
  MasteryActorContext,
} from './probabilisticMasteryContracts';

const masteryPolicy = createFixturePolicy();
const masteryStrategy = new EvidenceWeightedStrategy();

export interface PracticeMasteryApplyInput {
  schoolId: string;
  learnerId: string;
  committedEvidenceId: string;
  targetNodeId: string;
  targetNodeType: 'learning_objective' | 'skill';
  curriculumVersionId: string;
  outcome: number;
  usable: boolean;
  markingConfidence: number;
  integrityRisk: number;
  independence: number;
  hintDependency: number;
  sourceType: 'practice_attempt';
}

export async function applyPracticeEvidenceToCanonicalMastery(
  input: PracticeMasteryApplyInput,
): Promise<{ applied: boolean; state?: unknown }> {
  if (!input.usable) return { applied: false };
  if (!input.targetNodeId || !input.curriculumVersionId) return { applied: false };

  const evidence: NormalizedMasteryEvidence = {
    evidenceId: input.committedEvidenceId,
    schoolId: input.schoolId,
    learnerId: input.learnerId,
    targetNodeId: input.targetNodeId,
    targetNodeType: input.targetNodeType,
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
    targetNodeType: input.targetNodeType,
    curriculumVersionId: input.curriculumVersionId,
  };

  const actor: MasteryActorContext = {
    schoolId: input.schoolId,
    actorId: input.learnerId,
    actorRole: 'internal_operator',
    learnerId: input.learnerId,
    requestId: `prac-mastery-${Date.now()}`,
    correlationId: `prac-mastery-${input.committedEvidenceId}`,
  };

  const clock = { now: () => new Date() };
  const idGen = { nextId: (kind: string) => `${kind}_${randomUUID().slice(0, 8)}` };

  const currentState = revisionMasteryRepository.readState(target);
  const result: any = applyEvidenceWithRepository(
    currentState,
    evidence,
    actor,
    target,
    masteryPolicy as any,
    masteryStrategy as any,
    null as any,
    clock as any,
    idGen as any,
    revisionMasteryRepository as any,
    `prac-mastery-${input.committedEvidenceId}`,
  );

  if (result && typeof result === 'object' && 'code' in result) {
    throw new Error(`Mastery authorization failed: ${result.message}`);
  }
  if (result.rejected) {
    if (result.rejectReason === 'evidence already applied') {
      return { applied: false, state: result.state };
    }
    throw new Error(`Mastery rejected: ${result.rejectReason}`);
  }
  if (!result.committed) throw new Error('Mastery commit failed');

  return { applied: true, state: result.state };
}
