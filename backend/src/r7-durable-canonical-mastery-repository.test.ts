import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  PrismaMasteryRepository,
  type AtomicUpdate,
} from './services/probabilisticMasteryRepository';
import type {
  MasteryState,
  MasteryTarget,
} from './services/probabilisticMasteryContracts';

const DATABASE_URL =
  process.env.R71_DATABASE_URL ?? 'postgresql://postgres@localhost:5439/r71_mastery';
const RUN = `r71_${Date.now().toString(36)}`;

let client: PrismaClient;

function target(suffix: string, overrides: Partial<MasteryTarget> = {}): MasteryTarget {
  return {
    schoolId: `${RUN}_school`,
    learnerId: `${RUN}_learner`,
    targetNodeId: `node_${suffix}`,
    targetNodeType: 'skill',
    curriculumVersionId: `${RUN}_cv1`,
    ...overrides,
  };
}

function stateFor(t: MasteryTarget, revision: number, evidenceAt: Date): MasteryState {
  return {
    schoolId: t.schoolId,
    learnerId: t.learnerId,
    targetNodeId: t.targetNodeId,
    targetNodeType: t.targetNodeType,
    curriculumVersionId: t.curriculumVersionId,
    probabilityOfMastery: 0.42,
    confidence: 0.55,
    evidenceCount: revision,
    lastEvidenceAt: evidenceAt,
    decayRisk: 0.1,
    misconceptionTags: ['sign_error'],
    independenceScore: 0.7,
    hintDependencyScore: 0.2,
    retentionScore: 0.6,
    transferScore: 0.5,
    visibleLabel: 'developing',
    policyVersion: 'pm_policy_1',
    strategyId: 'pm_strategy',
    strategyVersion: '1',
    stateRevision: revision,
    updatedAt: evidenceAt,
    consecutiveMissCountSinceMastered: 0,
  };
}

function updateFor(t: MasteryTarget, revision: number, evidenceId: string): AtomicUpdate {
  const now = new Date();
  const state = stateFor(t, revision, now);
  return {
    state,
    evidenceId,
    changeLog: {
      changeId: `chg_${evidenceId}`,
      schoolId: t.schoolId,
      learnerId: t.learnerId,
      targetNodeId: t.targetNodeId,
      previousState: revision > 1 ? stateFor(t, revision - 1, new Date(now.getTime() - 1000)) : null,
      newState: state,
      contributingEvidenceIds: [evidenceId],
      policyVersion: 'pm_policy_1',
      strategyId: 'pm_strategy',
      reasonCodes: ['stable_progress'],
      createdAt: now,
      correlationId: `corr_${evidenceId}`,
    },
  };
}

async function changeCount(t: MasteryTarget): Promise<number> {
  return client.canonicalMasteryChangeRecord.count({
    where: { schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId },
  });
}

async function receiptCount(evidenceId: string): Promise<number> {
  return client.canonicalMasteryEvidenceApplicationRecord.count({ where: { evidenceId } });
}

beforeAll(async () => {
  client = new PrismaClient({ datasourceUrl: DATABASE_URL });
  const repo = new PrismaMasteryRepository(client);
  await repo.resetForTest();
});

afterAll(async () => {
  await client.$disconnect();
});

describe('R7.1 durable canonical mastery repository', () => {
  it('T1 state survives repository reconstruction', async () => {
    const t = target('t1');
    const repoA = new PrismaMasteryRepository(client);
    await repoA.saveState(stateFor(t, 1, new Date('2026-09-08T10:00:00Z')));
    const repoB = new PrismaMasteryRepository(client);
    const read = await repoB.readState(t);
    expect(read).not.toBeNull();
    expect(read?.probabilityOfMastery).toBe(0.42);
    expect(read?.confidence).toBe(0.55);
    expect(read?.evidenceCount).toBe(1);
    expect(read?.visibleLabel).toBe('developing');
    expect(read?.stateRevision).toBe(1);
    expect(read?.curriculumVersionId).toBe(`${RUN}_cv1`);
  });

  it('T2 evidence idempotency survives reconstruction', async () => {
    const t = target('t2');
    const repoA = new PrismaMasteryRepository(client);
    await repoA.recordEvidenceApplication('ev-r7-1', t);
    const repoB = new PrismaMasteryRepository(client);
    expect(await repoB.hasEvidenceBeenApplied('ev-r7-1')).toBe(true);
  });

  it('T3 atomic commit writes all three truths', async () => {
    const t = target('t3');
    const repo = new PrismaMasteryRepository(client);
    const committed = await repo.applyEvidenceAtomically(updateFor(t, 1, `${RUN}_ev_t3`));
    expect(committed).toBe(true);
    const stored = await repo.readState(t);
    expect(stored?.stateRevision).toBe(1);
    expect(await repo.hasEvidenceBeenApplied(`${RUN}_ev_t3`)).toBe(true);
    expect(await receiptCount(`${RUN}_ev_t3`)).toBe(1);
    expect(await changeCount(t)).toBe(1);
  });

  it('T4 duplicate evidence cannot mutate twice', async () => {
    const t = target('t4');
    const repo = new PrismaMasteryRepository(client);
    const update = updateFor(t, 1, `${RUN}_ev_t4`);
    const first = await repo.applyEvidenceAtomically(update);
    const second = await repo.applyEvidenceAtomically(update);
    expect(first).toBe(true);
    expect(second).toBe(false);
    const stored = await repo.readState(t);
    expect(stored?.stateRevision).toBe(1);
    expect(await changeCount(t)).toBe(1);
  });

  it('T5 tenant isolation across schools', async () => {
    const base = { learnerId: `${RUN}_shared_learner`, targetNodeId: 'shared_node', curriculumVersionId: `${RUN}_cv1` } as const;
    const schoolA = target('t5', { ...base, schoolId: `${RUN}_school_a` });
    const schoolB = target('t5', { ...base, schoolId: `${RUN}_school_b` });
    const repo = new PrismaMasteryRepository(client);
    await repo.saveState({ ...stateFor(schoolA, 1, new Date()), probabilityOfMastery: 0.9 });
    await repo.saveState({ ...stateFor(schoolB, 1, new Date()), probabilityOfMastery: 0.1 });
    const readA = await repo.readState(schoolA);
    const readB = await repo.readState(schoolB);
    expect(readA?.probabilityOfMastery).toBe(0.9);
    expect(readB?.probabilityOfMastery).toBe(0.1);
  });

  it('T6 target type isolation', async () => {
    const skill = target('t6', { targetNodeType: 'skill' });
    const objective = target('t6', { targetNodeType: 'learning_objective' });
    const repo = new PrismaMasteryRepository(client);
    await repo.saveState({ ...stateFor(skill, 1, new Date()), probabilityOfMastery: 0.8 });
    await repo.saveState({ ...stateFor(objective, 1, new Date()), probabilityOfMastery: 0.2 });
    expect((await repo.readState(skill))?.probabilityOfMastery).toBe(0.8);
    expect((await repo.readState(objective))?.probabilityOfMastery).toBe(0.2);
  });

  it('T7 stale revision rejected', async () => {
    const t = target('t7');
    const repo = new PrismaMasteryRepository(client);
    expect(await repo.applyEvidenceAtomically(updateFor(t, 1, `${RUN}_ev_t7_1`))).toBe(true);
    const stale = await repo.applyEvidenceAtomically(updateFor(t, 1, `${RUN}_ev_t7_2`));
    expect(stale).toBe(false);
    const stored = await repo.readState(t);
    expect(stored?.stateRevision).toBe(1);
    expect(await changeCount(t)).toBe(1);
  });

  it('T8 concurrent same evidence commits once', async () => {
    const t = target('t8');
    const update = updateFor(t, 1, `${RUN}_ev_t8`);
    const repoA = new PrismaMasteryRepository(client);
    const repoB = new PrismaMasteryRepository(client);
    const [a, b] = await Promise.allSettled([
      repoA.applyEvidenceAtomically(update),
      repoB.applyEvidenceAtomically(update),
    ]);
    const values = [a, b].map((r) => (r.status === 'fulfilled' ? r.value : false));
    expect(values.filter(Boolean)).toHaveLength(1);
    const stored = await new PrismaMasteryRepository(client).readState(t);
    expect(stored?.stateRevision).toBe(1);
    expect(await changeCount(t)).toBe(1);
    expect(await receiptCount(`${RUN}_ev_t8`)).toBe(1);
  });
});
