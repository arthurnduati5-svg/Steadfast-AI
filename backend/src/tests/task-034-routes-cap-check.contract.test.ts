import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesCapCheckContract', () => {
  let app: express.Express;
  const validInput = {
    rolloutPercent: 20,
    expandedStudentCount: 50,
    maxRolloutPercent: 25,
    maxExpandedStudentCount: 100,
    schoolWideRequested: false,
    hundredPercentRequested: false,
    openCohortRequested: false,
    unknownCohortRequested: false,
    crossSchoolCohortRequested: false,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /cap/check returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /cap/check returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.percentCapPassed).toBe(true);
    expect(res.body.studentCapPassed).toBe(true);
  });

  it('POST /cap/check saves to repository', async () => {
    await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getRolloutCapGate();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /cap/check rejects rollout percent exceeding cap', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, rolloutPercent: 50 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.percentCapPassed).toBe(false);
  });

  it('POST /cap/check rejects student count exceeding cap', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, expandedStudentCount: 200 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.studentCapPassed).toBe(false);
  });

  it('POST /cap/check blocks school wide request', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, schoolWideRequested: true });
    expect(res.status).toBe(200);
    expect(res.body.schoolWideBlocked).toBe(true);
    expect(res.body.ok).toBe(false);
  });

  it('POST /cap/check blocks hundred percent request', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, hundredPercentRequested: true });
    expect(res.status).toBe(200);
    expect(res.body.hundredPercentBlocked).toBe(true);
    expect(res.body.ok).toBe(false);
  });

  it('POST /cap/check returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/cap/check')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
