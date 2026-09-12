import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// R8-G.3A-D1C Focused Proofs 2 + 3 — strict mode + tutor-history failure.
// Runs with NO memory-fallback env flag and strict/durable behavior enabled.
// Proves the legacy sync revision repository rejects while the durable
// production path continues, and that tutor-history persistence failure
// propagates instead of returning fake empty success.
// Production is NEVER proven by setting REVISION_ALLOW_MEMORY_FALLBACK=1.

import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import { Phase3LivingRevisionDurableRepository } from '../services/phase3LivingRevisionRepository';
import { isRevisionMemoryFallbackAllowed } from '../services/phase3LivingRevisionRepository';
import { isTutorSnapshotMemoryFallbackAllowed } from '../services/tutorStateSnapshotService';
import { TutorStateSnapshotService } from '../services/tutorStateSnapshotService';
import { tutorStateHistoryService } from '../services/tutorStateHistoryService';
import { tutorStateEndpointService } from '../services/tutorStateEndpointService';

function clearFallbackFlags(): void {
  delete process.env.REVISION_ALLOW_MEMORY_FALLBACK;
  delete process.env.REVISION_REQUIRE_DURABLE;
  delete process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK;
  delete process.env.TUTORSTATE_REQUIRE_DURABLE;
}

describe('R8-G.3A-D1C strict mode: legacy rejects, durable continues', () => {
  beforeEach(() => {
    clearFallbackFlags();
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  afterEach(() => {
    clearFallbackFlags();
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('memory fallback is explicit opt-in only (NODE_ENV=test does not enable it)', () => {
    expect(process.env.REVISION_ALLOW_MEMORY_FALLBACK).toBeUndefined();
    expect(process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK).toBeUndefined();
    expect(isRevisionMemoryFallbackAllowed()).toBe(false);
    expect(isTutorSnapshotMemoryFallbackAllowed()).toBe(false);
  });

  it('strict/durable flags win over fallback opt-in', () => {
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    process.env.REVISION_REQUIRE_DURABLE = '1';
    expect(isRevisionMemoryFallbackAllowed()).toBe(false);

    process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK = '1';
    process.env.TUTORSTATE_REQUIRE_DURABLE = '1';
    expect(isTutorSnapshotMemoryFallbackAllowed()).toBe(false);
  });

  it('legacy sync revision repository rejects in strict mode', () => {
    process.env.REVISION_REQUIRE_DURABLE = '1';
    expect(() =>
      phase3LivingRevisionRepository.createRevisionNode({
        schoolId: 'sch-strict',
        studentId: 'stu-strict',
        nodeType: 'learner_note',
        safeTitle: 'must not persist',
        safeSummary: 'strict proof',
        sourceTruth: { status: 'learner_created_visible' },
        safeReasonCodes: ['strict-proof'],
      }),
    ).toThrow(/not canonical truth|durability is required/i);
    expect(() => phase3LivingRevisionRepository.listRevisionNodesForLearner('sch-strict', 'stu-strict')).toThrow(
      /not canonical truth|durability is required/i,
    );
  });

  it('durable production functions continue through the durable repository (stub client, no memory flag)', async () => {
    expect(process.env.REVISION_ALLOW_MEMORY_FALLBACK).toBeUndefined();
    const store = {
      nodes: new Map<string, any>(),
      edges: new Map<string, any>(),
      due: new Map<string, any>(),
      audits: [] as any[],
    };
    let seq = 0;
    const stubClient: any = {
      phase3RevisionNodeRecord: {
        create: async ({ data }: any) => {
          const record = {
            id: `n${++seq}`,
            schoolId: data.schoolId,
            studentId: data.studentId,
            nodeType: data.nodeType,
            status: 'active',
            priority: 'medium',
            subjectId: data.subjectId,
            topicId: data.topicId,
            skillId: data.skillId,
            objectiveId: data.objectiveId,
            safeTitle: data.safeTitle,
            safeSummary: data.safeSummary,
            learnerVisibleText: data.learnerVisibleText,
            sourceAnchorTitle: data.sourceAnchorTitle,
            approvedSourceRef: data.approvedSourceRef,
            sourceTruth: data.sourceTruth,
            safeEvidenceRefs: data.safeEvidenceRefs,
            safeReasonCodes: data.safeReasonCodes,
            connectionCount: 0,
            isPinned: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          store.nodes.set(record.id, record);
          return record;
        },
        findFirst: async ({ where }: any) => {
          const node = store.nodes.get(where.id);
          if (!node) return null;
          if (where.schoolId && node.schoolId !== where.schoolId) return null;
          return node;
        },
        findMany: async ({ where }: any) => {
          return Array.from(store.nodes.values()).filter((n: any) => {
            if (where.schoolId && n.schoolId !== where.schoolId) return false;
            if (where.studentId && n.studentId !== where.studentId) return false;
            return true;
          });
        },
        update: async ({ where, data }: any) => {
          const node = store.nodes.get(where.id);
          if (!node) throw new Error('not found');
          Object.assign(node, data, { updatedAt: new Date() });
          return node;
        },
      },
      phase3RevisionEdgeRecord: {
        create: async ({ data }: any) => ({ id: `e${++seq}`, ...data, createdAt: new Date() }),
        findFirst: async () => null,
        findMany: async () => [],
        delete: async () => ({}),
      },
      phase3RevisionDueItemRecord: {
        create: async ({ data }: any) => ({ id: `d${++seq}`, ...data, createdAt: new Date(), updatedAt: new Date() }),
        findFirst: async () => null,
        findMany: async () => [],
        update: async () => ({}),
      },
      phase3RevisionAuditRecord: {
        create: async ({ data }: any) => {
          const record = { id: `a${++seq}`, ...data, createdAt: new Date() };
          store.audits.push(record);
          return record;
        },
        findMany: async () => store.audits,
      },
      $transaction: async (fn: any) => fn(stubClient),
    };

    const durable = new Phase3LivingRevisionDurableRepository(stubClient);
    const node = await durable.createRevisionNode({
      schoolId: 'sch-strict',
      studentId: 'stu-strict',
      nodeType: 'learner_note',
      safeTitle: 'durable continues',
      safeSummary: 'strict proof',
      sourceTruth: { status: 'learner_created_visible' },
      safeReasonCodes: ['strict-proof'],
    });
    expect(node.nodeId).toBeTruthy();
    expect(node.safeTitle).toBe('durable continues');

    const fetched = await durable.getRevisionNode(node.nodeId, 'sch-strict');
    expect(fetched).not.toBeNull();
    expect(fetched!.safeTitle).toBe('durable continues');

    const listed = await durable.listRevisionNodesForLearner('sch-strict', 'stu-strict');
    expect(listed.map((n) => n.nodeId)).toContain(node.nodeId);
  });
});

describe('R8-G.3A-D1C tutor history persistence failure propagates', () => {
  beforeEach(() => {
    clearFallbackFlags();
  });

  afterEach(() => {
    clearFallbackFlags();
  });

  it('TutorStateHistoryService.getHistory() rejects instead of fake empty success', async () => {
    // Global prisma mock has no tutorStateSnapshotRecord delegate, and no
    // memory-fallback flag is set, so the snapshot read throws. History
    // must propagate it (fail-closed), never ok:true + empty.
    const identity = { schoolId: 'sch-hist', studentId: 'stu-hist', userId: 'stu-hist', role: 'student' } as any;
    await expect(tutorStateHistoryService.getHistory(identity, { limit: 10 })).rejects.toThrow(
      /persistence unavailable|unreachable/i,
    );
  });

  it('endpoint history path rejects so HTTP returns non-success (no fake empty)', async () => {
    const identity = { schoolId: 'sch-hist', studentId: 'stu-hist', userId: 'stu-hist', role: 'student' } as any;
    await expect(
      tutorStateEndpointService.getDedicatedTutorStateHistory({ identity, limit: 10 }),
    ).rejects.toThrow(/persistence unavailable|unreachable/i);
  });

  it('failing snapshot stub rejects through listSnapshots (no memory flag)', async () => {
    const boom = async (): Promise<never> => {
      throw new Error('simulated snapshot outage');
    };
    const failing = new TutorStateSnapshotService({
      tutorStateSnapshotRecord: { create: boom, findMany: boom, findFirst: boom, deleteMany: boom },
    } as any);
    const identity = { schoolId: 'sch-hist', studentId: 'stu-hist', userId: 'stu-hist', role: 'student' } as any;
    await expect(failing.listSnapshots({ identity, limit: 5 })).rejects.toThrow(/persistence unavailable/i);
  });

  it('history HTTP route maps failure to a generic dependency error (no DB internals)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routeSrc = fs.readFileSync(path.resolve(__dirname, '../routes/tutorStateEndpoint.ts'), 'utf-8');
    expect(routeSrc).toContain('Failed to retrieve state history.');
    expect(routeSrc).not.toContain('simulated snapshot outage');
  });
});
