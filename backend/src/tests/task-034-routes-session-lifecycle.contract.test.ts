import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesSessionLifecycleContract', () => {
  let app: express.Express;
  const sessionInput = {
    sessionId: 'test-session-001',
    activationId: 'act_001',
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    actorRole: 'internal_operator',
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /sessions returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'student')
      .send(sessionInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /sessions creates a session with status created', async () => {
    const res = await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'internal_operator')
      .send(sessionInput);
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('test-session-001');
    expect(res.body.status).toBe('created');
    expect(res.body.rolloutStage).toBe('created');
  });

  it('POST /sessions returns saved session fields', async () => {
    const res = await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'internal_operator')
      .send(sessionInput);
    expect(res.status).toBe(200);
    expect(res.body.schoolId).toBe('school_task034_limited_rollout_safe');
    expect(res.body.tenantId).toBe('tenant_task034_limited_rollout_safe');
    expect(res.body.cohortId).toBe('cohort_task034_limited_rollout_safe');
    expect(res.body.actorRole).toBe('internal_operator');
  });

  it('GET /sessions/:sessionId returns session when found', async () => {
    await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'internal_operator')
      .send(sessionInput);
    const res = await supertest(app)
      .get('/sessions/test-session-001')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('test-session-001');
    expect(res.body.status).toBe('created');
  });

  it('GET /sessions/:sessionId returns 404 for missing session', async () => {
    const res = await supertest(app)
      .get('/sessions/nonexistent')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('session_not_found');
  });

  it('GET /sessions/:sessionId returns 403 for denied role', async () => {
    const res = await supertest(app)
      .get('/sessions/test-session-001')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /sessions/:sessionId/start-limited-rollout transitions session', async () => {
    await task034Repository.saveRolloutSession({ sessionId: 'test-session-001', status: 'limited_rollout_ready', rolloutStage: 'limited_rollout_ready', activationId: 'act_001', schoolId: 'school_1', tenantId: 'tenant_1', cohortId: 'cohort_1', actorRole: 'internal_operator', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), blockingIssues: [] } as any);
    const res = await supertest(app)
      .post('/sessions/test-session-001/start-limited-rollout')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('test-session-001');
    expect(res.body.status).toBe('limited_rollout_active_internal');
  });

  it('POST /sessions/:sessionId/start-limited-rollout returns 404 for missing session', async () => {
    const res = await supertest(app)
      .post('/sessions/nonexistent/start-limited-rollout')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('session_not_found');
  });

  it('POST /sessions/:sessionId/start-limited-rollout returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/test-session-001/start-limited-rollout')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions creates session with generated ID when not provided', async () => {
    const res = await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'internal_operator')
      .send({ ...sessionInput, sessionId: undefined });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.sessionId).toContain('rollout_');
    expect(res.body.status).toBe('created');
  });

  it('POST /sessions returns createdAt and updatedAt timestamps', async () => {
    const res = await supertest(app)
      .post('/sessions')
      .set('x-actor-role', 'internal_operator')
      .send(sessionInput);
    expect(res.status).toBe(200);
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
  });
});
