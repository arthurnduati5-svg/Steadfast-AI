import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesReportContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /sessions/:sessionId/report returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'student')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /sessions/:sessionId/report returns 200 with admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.taskId).toBe('034');
  });

  it('POST /sessions/:sessionId/report returns scope controlled_limited_rollout', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.scope).toBe('controlled_limited_rollout');
  });

  it('POST /sessions/:sessionId/report returns commandsRun array', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.commandsRun).toBeInstanceOf(Array);
    expect(res.body.commandsRun.length).toBeGreaterThan(0);
  });

  it('POST /sessions/:sessionId/report returns filesCreated array', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.filesCreated).toBeInstanceOf(Array);
    expect(res.body.filesCreated.length).toBeGreaterThan(0);
  });

  it('POST /sessions/:sessionId/report saves report to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getLatestReport();
    expect(saved).not.toBeNull();
    expect(saved?.taskId).toBe('034');
  });

  it('POST /sessions/:sessionId/report returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'learner')
      .send({});
    expect(res.status).toBe(403);
  });

  it('GET /reports/latest returns the latest saved report', async () => {
    await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const res = await supertest(app)
      .get('/reports/latest')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body.taskId).toBe('034');
  });

  it('GET /reports/latest returns 404 when no report exists', async () => {
    const res = await supertest(app)
      .get('/reports/latest')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_report_found');
  });

  it('GET /reports/latest returns 403 without admin role', async () => {
    const res = await supertest(app)
      .get('/reports/latest')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/report returns safeToStartTask040 false', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.safeToStartTask040).toBe(false);
  });

  it('POST /sessions/:sessionId/report returns verdict blocked with empty body', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/report')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBeDefined();
    expect(res.body.safeToStartTask035).toBe(false);
  });
});
