import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesSafeViewContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
    task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created', activationId: 'act_001', schoolId: 'school_1', tenantId: 'tenant_1', cohortId: 'cohort_1', actorRole: 'internal_operator', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), blockingIssues: [] } as any);
  });

  it('GET /sessions/:sessionId/safe-view returns 403 for denied role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('GET /sessions/:sessionId/safe-view returns 200 for valid session', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
  });

  it('GET /sessions/:sessionId/safe-view returns 200 with admin role', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'school_admin');
    expect(res.status).toBe(200);
  });

  it('GET /sessions/:sessionId/safe-view returns 403 for denied role learner', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('GET /sessions/:sessionId/safe-view returns 403 for denied role anonymous', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'anonymous');
    expect(res.status).toBe(403);
  });

  it('GET /sessions/:sessionId/safe-view returns 403 for denied role parent', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'parent');
    expect(res.status).toBe(403);
  });

  it('GET /sessions/:sessionId/safe-view returns 403 for denied role peer', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'peer');
    expect(res.status).toBe(403);
  });

  it('GET /sessions/:sessionId/safe-view returns 200 for operations_reviewer', async () => {
    const res = await supertest(app)
      .get('/sessions/session-001/safe-view')
      .set('x-actor-role', 'operations_reviewer');
    expect(res.status).toBe(200);
  });
});
