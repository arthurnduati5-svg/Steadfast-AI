/**
 * R8-G.3A-D1 Living Revision + Tutor Snapshot durability proof — REAL PostgreSQL.
 *
 * Runs under vitest.r8g3a-d1-prisma.config.mts (setupFiles: []) so the global
 * ../lib/prisma mock is NOT installed. Uses a unique school namespace per
 * run and cleans only rows it owns. Never truncates shared tables.
 *
 * Proofs:
 *  1. Tutor snapshot write -> reconstruct service -> history returns same snapshot.
 *  2. Revision node create -> reconstruct repository -> node remains.
 *  3. Edge create persists and connection counts remain correct.
 *  4. Edge deletion persists and counts roll back correctly.
 *  5. Due item persists through reconstruction.
 *  6. Due completion persists (and a future cycle is not blocked).
 *  7. Graph reconstructs from durable records after a fresh instance.
 *  8. Revision audit survives reconstruction (append-only).
 *  9. Cross-school reads cannot expose revision records.
 * 10. Persistence failure does not produce fake success.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');

const { TutorStateSnapshotService } = await import('../services/tutorStateSnapshotService');
const { Phase3LivingRevisionDurableRepository } = await import(
  '../services/phase3LivingRevisionRepository'
);
const { getDurableLearnerRevisionNoteGraph } = await import(
  '../services/phase3RevisionNoteGraphService'
);

import type { DedicatedTutorState } from '../services/tutorStateEndpointContracts';

const RUN = `r8g3ad1-${Date.now().toString(36)}`;
const SCHOOL_A = `${RUN}-school-a`;
const SCHOOL_B = `${RUN}-school-b`;
const STU_A = `${RUN}-stu-a`;
const STU_C = `${RUN}-stu-c`;
const STU_E = `${RUN}-stu-e`;
const STU_G = `${RUN}-stu-g`;

function identityFor(schoolId: string, studentId: string): any {
  return { schoolId, studentId, userId: studentId, role: 'student' };
}

function buildSafeState(stateVersion: number, topic: string): DedicatedTutorState {
  const now = new Date().toISOString();
  return {
    stateId: `${RUN}-state-${stateVersion}`,
    stateVersion,
    status: 'resolved',
    viewMode: 'learner_safe',
    identity: { schoolScoped: true, studentScoped: true, sessionScoped: false },
    session: { sessionId: null, tutorSessionId: null, startedAt: null, lastUpdatedAt: now },
    currentLearning: {
      subject: 'mathematics',
      topic,
      skillIds: [],
      syllabusObjectiveIds: [],
      learningMode: 'learn',
      nextAction: null,
    },
    artifacts: { activeArtifactIds: [], safeSummary: null, artifactAwarePractice: null, warnings: [] },
    videos: { activeVideoSession: null, videoAwarePractice: null, warnings: [] },
    practice: {
      masterySummary: null,
      misconceptionSummary: [],
      activePracticeSummary: null,
      scheduledReviews: [],
      warnings: [],
    },
    learnerMemory: {
      available: false,
      safeSummary: null,
      strengths: [],
      weaknesses: [],
      recentSignals: [],
      warnings: [],
    },
    sourceTrust: { status: null, allowedSourceIds: [], blockedSourceIds: [], warnings: [] },
    cachePolicy: { cacheAllowed: false, scope: 'snapshot-durable', reason: 'd1-proof' },
    intent: { lastIntent: null, lastTaskKind: null, confidence: null, clarificationNeeded: false },
    safePromptContext: { allowed: false, summary: '', excluded: [], warnings: [] },
    metadata: {
      createdAt: now,
      updatedAt: now,
      resolvedAt: now,
      domainsIncluded: ['identity', 'session'],
      domainsPartial: [],
      domainsExcluded: [],
      warnings: [],
    },
  };
}

function nodeInput(schoolId: string, studentId: string, safeTitle: string): any {
  return {
    schoolId,
    studentId,
    nodeType: 'learner_note',
    safeTitle,
    safeSummary: 'D1 durable proof note',
    sourceTruth: { status: 'learner_created_visible' },
    safeReasonCodes: ['saved_by_learner'],
  };
}

function dueInput(schoolId: string, studentId: string, nodeId: string, safeTitle: string): any {
  return {
    schoolId,
    studentId,
    nodeId,
    priority: 'high',
    signalType: 'due_for_recall',
    safeTitle,
    safeSummary: 'D1 durable proof due item',
    recommendedAction: 'open_revision_node',
    sourceTruthStatus: 'learner_created_visible',
    isCompleted: false,
    safeEvidenceRefs: [],
    safeReasonCodes: ['due_item_created'],
  };
}

function auditInput(schoolId: string, studentId: string, nodeId: string): any {
  return {
    eventId: `${RUN}-audit-1`,
    schoolId,
    actorId: studentId,
    actorRole: 'student',
    studentId,
    eventType: 'revision_node_created',
    nodeId,
    safeReasonCodes: ['d1-proof'],
    safeEvidenceRefs: [],
    createdAt: new Date().toISOString(),
  };
}

async function cleanupOwnedRows(): Promise<void> {
  for (const schoolId of [SCHOOL_A, SCHOOL_B]) {
    await prisma.phase3RevisionAuditRecord.deleteMany({ where: { schoolId } });
    await prisma.phase3RevisionDueItemRecord.deleteMany({ where: { schoolId } });
    await prisma.phase3RevisionEdgeRecord.deleteMany({ where: { schoolId } });
    await prisma.phase3RevisionNodeRecord.deleteMany({ where: { schoolId } });
    await prisma.tutorStateSnapshotRecord.deleteMany({ where: { schoolId } });
  }
}

describe('R8-G.3A-D1 snapshot + living-revision durability (real DB)', () => {
  beforeAll(async () => {
    await cleanupOwnedRows();
  });

  afterAll(async () => {
    await cleanupOwnedRows();
    await prisma.$disconnect();
  });

  it('1 — snapshot write survives service reconstruction and history returns it', async () => {
    const writer = new TutorStateSnapshotService(prisma as any);
    const created = await writer.createSnapshot({
      identity: identityFor(SCHOOL_A, STU_A),
      state: buildSafeState(7, 'fractions'),
      reason: 'd1-proof-1',
    });
    expect(created.status).toBe('snapshot_created');

    // Reconstruct the service from scratch (simulated restart).
    const reader = new TutorStateSnapshotService(prisma as any);
    const history = await reader.listSnapshots({
      identity: identityFor(SCHOOL_A, STU_A),
      limit: 10,
    });
    expect(history.status).toBe('resolved');
    const match = history.snapshots.find((s) => s.reason === 'd1-proof-1');
    expect(match).toBeDefined();
    expect(match!.stateVersion).toBe(7);
    expect(match!.topic).toBe('fractions');

    const single = await reader.getSnapshot({
      identity: identityFor(SCHOOL_A, STU_A),
      snapshotId: match!.snapshotId,
    });
    expect(single).not.toBeNull();
    expect(single!.state.currentLearning.topic).toBe('fractions');
    expect(single!.state.stateVersion).toBe(7);
  });

  it('2 — revision node create survives repository reconstruction', async () => {
    const writer = new Phase3LivingRevisionDurableRepository(prisma as any);
    const node = await writer.createRevisionNode(nodeInput(SCHOOL_A, STU_A, 'D1 node persists'));

    const reader = new Phase3LivingRevisionDurableRepository(prisma as any);
    const fetched = await reader.getRevisionNode(node.nodeId, SCHOOL_A);
    expect(fetched).not.toBeNull();
    expect(fetched!.safeTitle).toBe('D1 node persists');
    expect(fetched!.status).toBe('active');
    expect(fetched!.connectionCount).toBe(0);
    expect(fetched!.schoolId).toBe(SCHOOL_A);
  });

  it('3 — edge create persists and connection counts remain correct', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const n1 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_C, 'D1 edge source'));
    const n2 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_C, 'D1 edge target'));

    const edge = await repo.createRevisionEdge({
      schoolId: SCHOOL_A,
      studentId: STU_C,
      edgeType: 'same_objective',
      sourceNodeId: n1.nodeId,
      targetNodeId: n2.nodeId,
      safeEvidenceRefs: [],
      safeReasonCodes: ['shared_objective'],
    });
    expect(edge.edgeId).toBeTruthy();

    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    const fetchedEdge = await fresh.getRevisionEdge(edge.edgeId, SCHOOL_A);
    expect(fetchedEdge).not.toBeNull();
    expect(fetchedEdge!.sourceNodeId).toBe(n1.nodeId);

    const s = await fresh.getRevisionNode(n1.nodeId, SCHOOL_A);
    const t = await fresh.getRevisionNode(n2.nodeId, SCHOOL_A);
    expect(s!.connectionCount).toBe(1);
    expect(t!.connectionCount).toBe(1);

    const forNode = await fresh.listRevisionEdgesForNode(n1.nodeId, SCHOOL_A);
    expect(forNode.map((e) => e.edgeId)).toContain(edge.edgeId);
  });

  it('4 — edge deletion persists and counts roll back correctly', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const n1 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_C, 'D1 rollback source'));
    const n2 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_C, 'D1 rollback target'));
    const edge = await repo.createRevisionEdge({
      schoolId: SCHOOL_A,
      studentId: STU_C,
      edgeType: 'supports',
      sourceNodeId: n1.nodeId,
      targetNodeId: n2.nodeId,
    });

    const deleted = await repo.deleteRevisionEdge(edge.edgeId, SCHOOL_A);
    expect(deleted).toBe(true);

    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    expect(await fresh.getRevisionEdge(edge.edgeId, SCHOOL_A)).toBeNull();
    const s = await fresh.getRevisionNode(n1.nodeId, SCHOOL_A);
    const t = await fresh.getRevisionNode(n2.nodeId, SCHOOL_A);
    expect(s!.connectionCount).toBe(0);
    expect(t!.connectionCount).toBe(0);
    expect(await fresh.deleteRevisionEdge(edge.edgeId, SCHOOL_A)).toBe(false);
  });

  it('5 — due item persists through reconstruction', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const node = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_E, 'D1 due anchor'));
    const due = await repo.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_E, node.nodeId, 'D1 due persists'));
    expect(due.dueItemId).toBeTruthy();

    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    const fetched = await fresh.getRevisionDueItem(due.dueItemId, SCHOOL_A);
    expect(fetched).not.toBeNull();
    expect(fetched!.safeTitle).toBe('D1 due persists');
    expect(fetched!.isCompleted).toBe(false);
  });

  it('6 — due completion persists and future cycles are not blocked', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const node = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_E, 'D1 cycle anchor'));
    const first = await repo.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_E, node.nodeId, 'D1 cycle one'));

    const completed = await repo.markRevisionDueItemCompleted(first.dueItemId, SCHOOL_A);
    expect(completed!.isCompleted).toBe(true);

    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    const refetched = await fresh.getRevisionDueItem(first.dueItemId, SCHOOL_A);
    expect(refetched!.isCompleted).toBe(true);

    // A completed cycle must not forbid the next due item for the same node.
    const second = await fresh.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_E, node.nodeId, 'D1 cycle two'));
    expect(second.dueItemId).not.toBe(first.dueItemId);
    expect(second.isCompleted).toBe(false);
  });

  it('7 — graph reconstructs from durable records after a fresh instance', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const n1 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_G, 'D1 graph alpha'));
    const n2 = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_G, 'D1 graph beta'));
    const edge = await repo.createRevisionEdge({
      schoolId: SCHOOL_A,
      studentId: STU_G,
      edgeType: 'same_topic',
      sourceNodeId: n1.nodeId,
      targetNodeId: n2.nodeId,
    });
    const due = await repo.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_G, n1.nodeId, 'D1 graph due'));

    const graph = await getDurableLearnerRevisionNoteGraph(SCHOOL_A, STU_G);
    expect(graph.nodes.map((n) => n.nodeId)).toEqual(expect.arrayContaining([n1.nodeId, n2.nodeId]));
    expect(graph.edges.map((e) => e.edgeId)).toContain(edge.edgeId);
    expect(graph.dueItems.map((d) => d.dueItemId)).toContain(due.dueItemId);
    expect(graph.safeSummary).toContain('2 nodes');
  });

  it('8 — revision audit survives reconstruction and is append-only', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const node = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_A, 'D1 audit anchor'));
    await repo.recordRevisionAuditEvent(auditInput(SCHOOL_A, STU_A, node.nodeId));

    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    const events = await fresh.listRevisionAuditEvents(SCHOOL_A);
    const match = events.find((e) => e.nodeId === node.nodeId && e.eventType === 'revision_node_created');
    expect(match).toBeDefined();
    expect(match!.actorId).toBe(STU_A);

    // Append-only surface: no update/delete audit entry points exist.
    expect((fresh as any).updateRevisionAuditEvent).toBeUndefined();
    expect((fresh as any).deleteRevisionAuditEvent).toBeUndefined();
  });

  it('9 — cross-school reads cannot expose revision records', async () => {
    const repo = new Phase3LivingRevisionDurableRepository(prisma as any);
    const node = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_A, 'D1 isolation anchor'));
    const edgeTarget = await repo.createRevisionNode(nodeInput(SCHOOL_A, STU_A, 'D1 isolation peer'));
    const edge = await repo.createRevisionEdge({
      schoolId: SCHOOL_A,
      studentId: STU_A,
      edgeType: 'supports',
      sourceNodeId: node.nodeId,
      targetNodeId: edgeTarget.nodeId,
    });
    const due = await repo.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_A, node.nodeId, 'D1 isolation due'));
    await repo.recordRevisionAuditEvent(auditInput(SCHOOL_A, STU_A, node.nodeId));

    expect(await repo.getRevisionNode(node.nodeId, SCHOOL_B)).toBeNull();
    expect(await repo.getRevisionEdge(edge.edgeId, SCHOOL_B)).toBeNull();
    expect(await repo.getRevisionDueItem(due.dueItemId, SCHOOL_B)).toBeNull();
    expect(await repo.listRevisionNodesForLearner(SCHOOL_B, STU_A)).toHaveLength(0);
    expect(await repo.listRevisionEdgesForLearner(SCHOOL_B, STU_A)).toHaveLength(0);
    expect(await repo.listAllNodesForSchool(SCHOOL_B)).toHaveLength(0);
    expect(await repo.listAllEdgesForSchool(SCHOOL_B)).toHaveLength(0);
    expect(await repo.listAllDueItemsForSchool(SCHOOL_B)).toHaveLength(0);
    expect(await repo.listRevisionAuditEvents(SCHOOL_B)).toHaveLength(0);

    const snapshotReader = new TutorStateSnapshotService(prisma as any);
    const crossHistory = await snapshotReader.listSnapshots({
      identity: identityFor(SCHOOL_B, STU_A),
      limit: 10,
    });
    expect(crossHistory.snapshots).toHaveLength(0);

    // Control: own-school reads still resolve.
    expect(await repo.getRevisionNode(node.nodeId, SCHOOL_A)).not.toBeNull();
  });

  it('10 — persistence failure does not produce fake success', async () => {
    const boom = async (): Promise<never> => {
      throw new Error('simulated persistence outage');
    };
    const failingClient: any = {
      tutorStateSnapshotRecord: {
        create: boom,
        findMany: boom,
        findFirst: boom,
        deleteMany: boom,
      },
      phase3RevisionNodeRecord: { create: boom, findFirst: boom, findMany: boom, update: boom },
      phase3RevisionEdgeRecord: { create: boom, findFirst: boom, findMany: boom, delete: boom },
      phase3RevisionDueItemRecord: { create: boom, findFirst: boom, findMany: boom, update: boom },
      phase3RevisionAuditRecord: { create: boom, findMany: boom },
      $transaction: boom,
    };

    process.env.TUTORSTATE_REQUIRE_DURABLE = '1';
    try {
      const snapshots = new TutorStateSnapshotService(failingClient);
      await expect(
        snapshots.createSnapshot({
          identity: identityFor(SCHOOL_A, STU_A),
          state: buildSafeState(1, 'fractions'),
          reason: 'must-not-succeed',
        }),
      ).rejects.toThrow(/persistence failed/i);
      await expect(
        snapshots.listSnapshots({ identity: identityFor(SCHOOL_A, STU_A) }),
      ).rejects.toThrow(/persistence unavailable/i);
    } finally {
      delete process.env.TUTORSTATE_REQUIRE_DURABLE;
    }

    const revisions = new Phase3LivingRevisionDurableRepository(failingClient);
    await expect(
      revisions.createRevisionNode(nodeInput(SCHOOL_A, STU_A, 'must-not-succeed')),
    ).rejects.toThrow();
    await expect(
      revisions.createRevisionEdge({
        schoolId: SCHOOL_A,
        studentId: STU_A,
        edgeType: 'supports',
        sourceNodeId: 'missing',
        targetNodeId: 'missing',
      }),
    ).rejects.toThrow();
    await expect(
      revisions.upsertRevisionDueItem(dueInput(SCHOOL_A, STU_A, 'missing', 'must-not-succeed')),
    ).rejects.toThrow();
    await expect(
      revisions.recordRevisionAuditEvent(auditInput(SCHOOL_A, STU_A, 'missing')),
    ).rejects.toThrow();
  });
});
