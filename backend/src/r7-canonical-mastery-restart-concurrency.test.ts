// R7.3 — real process restart + concurrency proof for canonical Mastery.
// Real production services + real Prisma repository + real PostgreSQL +
// separate OS processes (npx tsx worker) + restart + retry + concurrency.
// No mocks, no resetForTest setup, no production changes.
import { describe, it, expect, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';

const execFileAsync = promisify(execFile);

const R73_DATABASE_URL =
  process.env.R73_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:8000/r73_mastery';
const RUN = `r73_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const client = new PrismaClient({ datasourceUrl: R73_DATABASE_URL });

afterAll(async () => {
  await client.$disconnect();
});

interface Target {
  schoolId: string;
  learnerId: string;
  targetNodeId: string;
  targetNodeType: string;
  curriculumVersionId: string;
}

interface WorkerResult {
  pid: number;
  action: string;
  ok: boolean;
  applied?: boolean;
  changed?: boolean;
  exists?: boolean;
  stateRevision?: number | null;
  evidenceCount?: number | null;
  evidenceId?: string;
  error?: string;
  [k: string]: unknown;
}

function kv(args: Record<string, string>): string[] {
  return Object.entries(args).map(([k, v]) => `${k}=${v}`);
}

async function runWorker(action: string, args: Record<string, string>): Promise<WorkerResult> {
  const { stdout } = await execFileAsync(
    'npx.cmd',
    ['tsx', 'src/r7-canonical-mastery-e2e.worker.ts', action, ...kv(args)],
    {
      cwd: process.cwd(),
      env: { ...process.env, R73_DATABASE_URL },
      timeout: 120000,
      maxBuffer: 4 * 1024 * 1024,
      shell: true,
    },
  );
  const line = stdout
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('R73_RESULT:'));
  expect(line, `worker emitted R73_RESULT for ${action}; stdout was: ${stdout}`).toBeDefined();
  return JSON.parse(line!.slice('R73_RESULT:'.length)) as WorkerResult;
}

const practiceArgs = (t: Target, committedEvidenceId: string) => ({
  schoolId: t.schoolId,
  learnerId: t.learnerId,
  committedEvidenceId,
  targetNodeId: t.targetNodeId,
  targetNodeType: t.targetNodeType,
  curriculumVersionId: t.curriculumVersionId,
});

const readArgs = (t: Target) => ({
  schoolId: t.schoolId,
  learnerId: t.learnerId,
  targetNodeId: t.targetNodeId,
  targetNodeType: t.targetNodeType,
  curriculumVersionId: t.curriculumVersionId,
});

async function counts(t: Target): Promise<{ states: number; receipts: number; changes: number }> {
  const where = {
    schoolId: t.schoolId,
    learnerId: t.learnerId,
    targetNodeId: t.targetNodeId,
    targetNodeType: t.targetNodeType,
    curriculumVersionId: t.curriculumVersionId,
  };
  const [states, receipts, changes] = await Promise.all([
    client.canonicalMasteryStateRecord.count({ where }),
    client.canonicalMasteryEvidenceApplicationRecord.count({ where }),
    client.canonicalMasteryChangeRecord.count({ where }),
  ]);
  return { states, receipts, changes };
}

function baseTarget(suffix: string, overrides: Partial<Target> = {}): Target {
  return {
    schoolId: `${RUN}_school`,
    learnerId: `${RUN}_learner`,
    targetNodeId: `r73_${suffix}`,
    targetNodeType: 'skill',
    curriculumVersionId: `${RUN}_cv`,
    ...overrides,
  };
}

describe('R7.3 canonical mastery restart + concurrency (real processes)', () => {
  it('T1 — practice state survives writer-process exit', async () => {
    const t = baseTarget('t1skill');
    const ev = `${RUN}_ev_prac1`;
    const w = await runWorker('practice', practiceArgs(t, ev));
    expect(w.ok).toBe(true);
    expect(w.applied).toBe(true);

    const r = await runWorker('read', readArgs(t));
    expect(r.ok).toBe(true);
    expect(r.pid).not.toBe(w.pid);
    expect(r.exists).toBe(true);
    expect(r.stateRevision).toBe(1);
    expect(r.evidenceCount).toBe(1);

    expect(await counts(t)).toEqual({ states: 1, receipts: 1, changes: 1 });
  }, 180000);

  it('T2 — duplicate evidence stays idempotent after restart', async () => {
    const t = baseTarget('t1skill');
    const ev = `${RUN}_ev_prac1`;
    const w = await runWorker('practice', practiceArgs(t, ev));
    expect(w.ok).toBe(true);
    expect(w.applied).toBe(false);

    const r = await runWorker('read', readArgs(t));
    expect(r.stateRevision).toBe(1);
    expect(r.evidenceCount).toBe(1);

    expect(await counts(t)).toEqual({ states: 1, receipts: 1, changes: 1 });
  }, 180000);

  it('T3 — practice + revision mutate one shared durable state', async () => {
    const t = baseTarget('t1skill');
    const ev = `${RUN}_ev_rev1`;
    const w = await runWorker('revision', practiceArgs(t, ev));
    expect(w.ok).toBe(true);
    expect(w.applied).toBe(true);

    const r = await runWorker('read', readArgs(t));
    expect(r.stateRevision).toBe(2);
    expect(r.evidenceCount).toBe(2);

    expect(await counts(t)).toEqual({ states: 1, receipts: 2, changes: 2 });
  }, 180000);

  it('T4 — daily objective canonical mastery survives restart + retry is safe', async () => {
    const cv = `${RUN}_cv_obj`;
    const obj = `${RUN}_obj1`;
    const schoolId = `${RUN}_school_obj`;
    const learnerId = `${RUN}_learner_obj`;
    const ev = `${RUN}_ev_daily1`;
    const w = await runWorker('daily', {
      objectiveId: obj,
      schoolId,
      learnerId,
      topicId: cv,
      evidenceId: ev,
    });
    expect(w.ok).toBe(true);

    const t: Target = {
      schoolId,
      learnerId,
      targetNodeId: obj,
      targetNodeType: 'learning_objective',
      curriculumVersionId: cv,
    };
    const r = await runWorker('read', readArgs(t));
    expect(r.exists).toBe(true);
    expect(r.stateRevision).toBe(1);
    expect(r.evidenceCount).toBe(1);

    const retry = await runWorker('daily', {
      objectiveId: obj,
      schoolId,
      learnerId,
      topicId: cv,
      evidenceId: ev,
    });
    expect(retry.ok).toBe(true);
    expect(retry.changed ?? retry.applied).toBe(false);

    const r2 = await runWorker('read', readArgs(t));
    expect(r2.stateRevision).toBe(1);
    expect(r2.evidenceCount).toBe(1);
    expect(await counts(t)).toEqual({ states: 1, receipts: 1, changes: 1 });
  }, 240000);

  it('T5 — same-evidence real concurrency mutates once', async () => {
    const t = baseTarget('t5skill');
    const ev = `${RUN}_ev_t5`;
    const [a, b] = await Promise.all([
      runWorker('practice', practiceArgs(t, ev)),
      runWorker('practice', practiceArgs(t, ev)),
    ]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect([a.applied, b.applied].filter(Boolean)).toHaveLength(1);

    const r = await runWorker('read', readArgs(t));
    expect(r.stateRevision).toBe(1);
    expect(r.evidenceCount).toBe(1);
    expect(await counts(t)).toEqual({ states: 1, receipts: 1, changes: 1 });
  }, 240000);

  it('T6 — different-evidence concurrency loses no update after retry', async () => {
    const t = baseTarget('t6skill');
    const evA = `${RUN}_ev_t6a`;
    const evB = `${RUN}_ev_t6b`;
    const [a, b] = await Promise.all([
      runWorker('practice', practiceArgs(t, evA)),
      runWorker('practice', practiceArgs(t, evB)),
    ]);
    const byEv: Array<{ ev: string; res: WorkerResult }> = [
      { ev: evA, res: a },
      { ev: evB, res: b },
    ];
    const appliedNow = byEv.filter((x) => x.res.ok && x.res.applied === true);
    const notApplied = byEv.filter((x) => !(x.res.ok && x.res.applied === true));
    expect(appliedNow.length).toBeGreaterThanOrEqual(1);

    for (const x of notApplied) {
      expect(x.res.applied).toBe(false);
      if (!x.res.ok) {
        expect(x.res.error ?? '').toMatch(/atomic commit failed|Mastery rejected|Mastery commit failed/);
      }
      const retry = await runWorker('practice', practiceArgs(t, x.ev));
      expect(retry.ok).toBe(true);
      expect(retry.applied).toBe(true);
    }

    const r = await runWorker('read', readArgs(t));
    expect(r.stateRevision).toBe(2);
    expect(r.evidenceCount).toBe(2);
    const c = await counts(t);
    expect(c).toEqual({ states: 1, receipts: 2, changes: 2 });
  }, 240000);

  it('T7 — school isolation holds through real services', async () => {
    const shared = {
      learnerId: `${RUN}_shared_learner`,
      targetNodeId: `r73_shared_node`,
      curriculumVersionId: `${RUN}_cv_shared`,
      targetNodeType: 'skill',
    };
    const tA = baseTarget('shared', { ...shared, schoolId: `${RUN}_school_a` });
    const tB = baseTarget('shared', { ...shared, schoolId: `${RUN}_school_b` });
    const wA = await runWorker('practice', practiceArgs(tA, `${RUN}_ev_a`));
    const wB = await runWorker('practice', practiceArgs(tB, `${RUN}_ev_b`));
    expect(wA.applied).toBe(true);
    expect(wB.applied).toBe(true);

    const [rA, rB] = await Promise.all([runWorker('read', readArgs(tA)), runWorker('read', readArgs(tB))]);
    expect(rA.exists).toBe(true);
    expect(rA.stateRevision).toBe(1);
    expect(rA.evidenceCount).toBe(1);
    expect(rB.exists).toBe(true);
    expect(rB.stateRevision).toBe(1);
    expect(rB.evidenceCount).toBe(1);
  }, 240000);
});
