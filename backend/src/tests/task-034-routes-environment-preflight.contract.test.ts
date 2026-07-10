import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesEnvironmentPreflightContract', () => {
  let app: express.Express;
  const validInput = {
    environmentType: 'controlled_limited_rollout',
    rolloutMode: 'limited_cohort_expansion_only',
    dataMode: 'safe_metadata_and_aggregate_only',
    sideEffectMode: 'internal_rollout_store_only',
    task033Accepted: true,
    task034Started: false,
    task035Started: false,
    task040Started: false,
    rolloutPercent: 20,
    schoolWideLaunchRequested: false,
    hundredPercentRolloutRequested: false,
    backendFreezeRequested: false,
    frontendUiRequested: false,
    liveAiRequested: false,
    liveConnectorRequested: false,
    liveNotificationRequested: false,
    productionDeploymentRequested: false,
    productionMutationRequested: false,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /environment/preflight returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /environment/preflight returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.passed).toBe(true);
  });

  it('POST /environment/preflight saves result to repository', async () => {
    await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getEnvironmentGate();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /environment/preflight rejects invalid environment type', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, environmentType: 'production' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.environmentTypeValid).toBe(false);
    expect(res.body.blockingIssues).toContain('invalid_environment_type: production');
  });

  it('POST /environment/preflight rejects invalid rollout mode', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, rolloutMode: 'school_wide' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.rolloutModeValid).toBe(false);
  });

  it('POST /environment/preflight rejects if task033 not accepted', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, task033Accepted: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('task_033_not_accepted');
  });

  it('POST /environment/preflight rejects rollout percent out of range', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, rolloutPercent: 50 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.rolloutPercentInRange).toBe(false);
  });

  it('POST /environment/preflight returns 403 for denied role learner', async () => {
    const res = await supertest(app)
      .post('/environment/preflight')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
