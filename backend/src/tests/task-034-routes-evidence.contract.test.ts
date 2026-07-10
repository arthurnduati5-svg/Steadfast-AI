import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesEvidenceContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
    task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created' } as any);
  });

  it('GET /sessions/:sessionId/evidence returns 403 without admin role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('GET /sessions/:sessionId/evidence returns empty ledger when no events', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('session-001');
    expect(res.body.totalCount).toBe(0);
    expect(res.body.events).toEqual([]);
  });

  it('GET /sessions/:sessionId/evidence returns ledger with events', async () => {
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-001', eventId: 'evt_1', evidenceType: 'gate_pass', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.events).toHaveLength(1);
  });

  it('GET /sessions/:sessionId/evidence includes generatedAt', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.generatedAt).toBeDefined();
    expect(typeof res.body.generatedAt).toBe('string');
  });

  it('GET /sessions/:sessionId/evidence returns events with correct fields', async () => {
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-001', eventId: 'evt_1', evidenceType: 'gate_pass', safeDescription: 'Runtime guard passed', safeReasonCodes: ['ok'], timestamp: '2025-01-01T00:00:00.000Z', actorRole: 'internal_operator' });
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.events[0].evidenceType).toBe('gate_pass');
    expect(res.body.events[0].safeDescription).toBe('Runtime guard passed');
    expect(res.body.events[0].actorRole).toBe('internal_operator');
  });

  it('GET /sessions/:sessionId/evidence filters by session', async () => {
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-001', eventId: 'evt_1', evidenceType: 'a', safeDescription: 'a', safeReasonCodes: [], timestamp: '2025-01-01T00:00:00.000Z', actorRole: 'internal_operator' });
    await task034Repository.appendEvidenceEvent({ sessionId: 'session-002', eventId: 'evt_2', evidenceType: 'b', safeDescription: 'b', safeReasonCodes: [], timestamp: '2025-01-01T00:00:00.000Z', actorRole: 'internal_operator' });
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.events[0].eventId).toBe('evt_1');
  });

  it('GET /sessions/:sessionId/evidence returns 403 for denied role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/evidence')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
