import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesEventIntakeContract', () => {
  let app: express.Express;
  const validInput = {
    eventId: 'evt_001',
    activationId: 'act_001',
    schoolId: 'school_task034_limited_rollout_safe',
    actorRole: 'internal_operator',
    safeActorHash: 'actor_hash',
    safeStudentHash: 'student_hash',
    cohortId: 'cohort_task034_limited_rollout_safe',
    classId: 'class_001',
    subjectId: 'subj_001',
    eventType: 'gate_check',
    safeReasonCodes: ['runtime_guard_passed'],
    safeSummary: 'Runtime guard passed',
    gateName: 'runtime_guard',
    gatePassed: true,
    latencyMs: 15,
    errorCategory: 'none',
    createdAt: new Date().toISOString(),
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
    task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created' } as any);
  });

  it('POST /sessions/:sessionId/events returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/events')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /sessions/:sessionId/events returns 200 with valid event', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/events')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.eventType).toBe('gate_check');
    expect(res.body.gateName).toBe('runtime_guard');
  });

  it('POST /sessions/:sessionId/events saves the event to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/events')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const events = await task034Repository.listRolloutEventsForSession('session-001');
    expect(events.length).toBe(1);
    expect(events[0].eventId).toBe('evt_001');
  });

  it('POST /sessions/:sessionId/events stores sessionId from params', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/events')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('session-001');
  });

  it('POST /sessions/:sessionId/events handles multiple events for same session', async () => {
    await supertest(app).post('/sessions/session-001/events').set('x-actor-role', 'internal_operator').send(validInput);
    await supertest(app).post('/sessions/session-001/events').set('x-actor-role', 'internal_operator').send({ ...validInput, eventId: 'evt_002' });
    const events = await task034Repository.listRolloutEventsForSession('session-001');
    expect(events.length).toBe(2);
  });

  it('POST /sessions/:sessionId/events returns saved event fields', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/events')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.gatePassed).toBe(true);
    expect(res.body.safeSummary).toBe('Runtime guard passed');
    expect(res.body.latencyMs).toBe(15);
  });

  it('GET /sessions/:sessionId/events/safe-summary returns summaries', async () => {
    await supertest(app).post('/sessions/session-001/events').set('x-actor-role', 'internal_operator').send(validInput);
    const res = await supertest(app)
      .get('/sessions/session-001/events/safe-summary')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('session-001');
    expect(res.body.eventCount).toBe(1);
    expect(res.body.safeSummaries).toHaveLength(1);
  });

  it('GET /sessions/:sessionId/events/safe-summary returns 403 for denied role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/events/safe-summary')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });
});
