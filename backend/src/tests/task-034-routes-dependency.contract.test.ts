import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesDependencyContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /dependency/task033/check returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'student')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /dependency/task033/check returns 200 with admin role', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'internal_operator')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
  });

  it('POST /dependency/task033/check saves proof to repository', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'internal_operator')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(200);
    const proof = await task034Repository.getTask033DependencyProof();
    expect(proof).not.toBeNull();
    expect(proof?.ok).toBe(res.body.ok);
  });

  it('POST /dependency/task033/check returns structured proof object', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'internal_operator')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reportFound');
    expect(res.body).toHaveProperty('safeToStartTask034');
    expect(res.body).toHaveProperty('blockingIssues');
  });

  it('POST /dependency/task033/check works with school_admin role', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'school_admin')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
  });

  it('POST /dependency/task033/check returns 403 for denied role learner', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'learner')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(403);
  });

  it('POST /dependency/task033/check handles missing body gracefully', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'internal_operator');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
  });

  it('POST /dependency/task033/check works with authorized_rollout_operator', async () => {
    const res = await supertest(app)
      .post('/dependency/task033/check')
      .set('x-actor-role', 'authorized_rollout_operator')
      .send({ syntheticFixture: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok');
    expect(res.body).toHaveProperty('reportFound');
  });
});
