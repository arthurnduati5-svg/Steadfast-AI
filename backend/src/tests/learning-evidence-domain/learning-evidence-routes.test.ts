import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createLearningEvidenceRouter } from '../../domains/learning-evidence/routes/learningEvidenceRoutes';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';

function createApp(repo: InMemoryLearningEvidenceEventStoreRepository = new InMemoryLearningEvidenceEventStoreRepository()) {
  const app = express();
  app.use(express.json());
  app.use('/api/copilot/evidence', createLearningEvidenceRouter(repo));
  return app;
}

async function fetchJson(app: express.Express, method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; body: any }> {
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const addr = server.address() as any;
  const base = `http://127.0.0.1:${addr.port}`;
  try {
    const opts: RequestInit = { method, headers: { ...headers } };
    if (body && method !== 'GET') {
      opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${base}${path}`, opts);
    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: res.status, body: parsed };
  } finally {
    server.close();
  }
}

describe('Learning Evidence Routes', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let app: express.Express;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    app = createApp(repo);
  });

  it('POST /candidates returns 400 without school header', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', {});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /candidates returns 400 with missing fields', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', {}, { 'x-school-id': 'school-1' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /candidates returns 201 with valid data', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', {
      learnerId: 'learner-route-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-route-1', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
      idempotencyKey: `idem-route-${Date.now()}`,
    }, { 'x-school-id': 'school-1', 'x-actor-id': 'learner-route-1', 'x-actor-role': 'student' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.evidenceCandidateId).toBeDefined();
  });

  it('GET /learners/:id/evidence returns 200', async () => {
    await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', {
      learnerId: 'learner-route-2',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r2', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-route-2', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
      idempotencyKey: `idem-route-2-${Date.now()}`,
    }, { 'x-school-id': 'school-1', 'x-actor-id': 'learner-route-2', 'x-actor-role': 'student' });
    const res = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-route-2/evidence', {}, { 'x-school-id': 'school-1', 'x-actor-role': 'teacher', 'x-actor-id': 'teacher-1' });
    console.log('GET response:', res.status, JSON.stringify(res.body));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /internal/streams/:id/integrity returns 200', async () => {
    const res = await fetchJson(app, 'GET', '/api/copilot/evidence/internal/streams/learner-x/integrity', {}, { 'x-school-id': 'school-1' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /internal/seeds returns 201', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'seed-route' }, { 'x-school-id': 'school-1' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });
});
