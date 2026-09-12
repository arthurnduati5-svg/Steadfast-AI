/**
 * R8-G.3A-D1C real-PostgreSQL production-route proof (ONE run).
 *
 * Proves HTTP route → production service → durable repository → PostgreSQL,
 * not merely test → durable repository. Reuses the D1 local test database.
 * No migration. No prisma generate. Cleans only rows it owns.
 *
 * Runs under vitest.r8g3a-d1c-prisma.config.mts (setupFiles: []) so the
 * global ../lib/prisma mock is NOT installed.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';
import express from 'express';
import request from 'supertest';

config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');
const { default: livingRevisionRoutes } = await import('../routes/phase3LivingRevisionRoutes');
const { Phase3LivingRevisionDurableRepository } = await import(
  '../services/phase3LivingRevisionRepository'
);

const RUN = `r8g3ad1c-${Date.now().toString(36)}`;
const SCHOOL = `${RUN}-school`;
const STU = `${RUN}-stu`;

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.school = { id: SCHOOL };
    req.user = { id: STU, role: 'student' };
    next();
  });
  app.use('/api/phase3/living-revision', livingRevisionRoutes);
  return app;
}

async function cleanupOwnedRows(): Promise<void> {
  await prisma.phase3RevisionAuditRecord.deleteMany({ where: { schoolId: SCHOOL } });
  await prisma.phase3RevisionDueItemRecord.deleteMany({ where: { schoolId: SCHOOL } });
  await prisma.phase3RevisionEdgeRecord.deleteMany({ where: { schoolId: SCHOOL } });
  await prisma.phase3RevisionNodeRecord.deleteMany({ where: { schoolId: SCHOOL } });
}

describe('R8-G.3A-D1C HTTP route → durable repository (real DB)', () => {
  beforeAll(async () => {
    await cleanupOwnedRows();
  });

  afterAll(async () => {
    await cleanupOwnedRows();
    await prisma.$disconnect();
  });

  it('POST learner node through HTTP persists; GET reads back durable state', async () => {
    const app = buildApp();

    const postRes = await request(app)
      .post('/api/phase3/living-revision/learner/nodes')
      .send({
        nodeType: 'learner_note',
        safeTitle: 'D1C HTTP durable node',
        safeSummary: 'D1C production composition proof',
        sourceTruth: { status: 'learner_created_visible' },
        safeReasonCodes: ['saved_by_learner'],
      });
    expect(postRes.status).toBe(201);
    expect(postRes.body?.node?.nodeId).toBeTruthy();
    const nodeId: string = postRes.body.node.nodeId;

    // Fresh repository (simulated restart) reconstructs the row.
    const fresh = new Phase3LivingRevisionDurableRepository(prisma as any);
    const row = await fresh.getRevisionNode(nodeId, SCHOOL);
    expect(row).not.toBeNull();
    expect(row!.safeTitle).toBe('D1C HTTP durable node');
    expect(row!.schoolId).toBe(SCHOOL);

    // GET learner nodes route returns the durable node.
    const listRes = await request(app).get('/api/phase3/living-revision/learner/nodes');
    expect(listRes.status).toBe(200);
    expect((listRes.body?.nodes ?? []).map((n: any) => n.nodeId)).toContain(nodeId);

    // GET learner graph reconstructs from durable records.
    const graphRes = await request(app).get('/api/phase3/living-revision/learner/graph');
    expect(graphRes.status).toBe(200);
    const graphNodes: string[] = (graphRes.body?.nodes ?? graphRes.body?.graph?.nodes ?? []).map(
      (n: any) => n.nodeId,
    );
    // Graph view shape: buildLearnerRevisionGraphView wraps graph; accept either.
    const allText = JSON.stringify(graphRes.body);
    expect(allText).toContain(nodeId);
  });
});
