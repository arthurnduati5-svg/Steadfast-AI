import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesLimitedRolloutConfigContract', () => {
  let app: express.Express;
  const validInput = {
    rolloutPercent: 20,
    expandedCohortId: 'cohort_task034_limited_rollout_safe',
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    activationId: 'act_001',
    task033ObservationSessionId: 'obs_001',
    rollbackPlanId: 'rb_001',
    pausePlanId: 'pause_001',
    killSwitchId: 'ks_001',
    staffReadinessRequired: true,
    learnerNoticeRequired: true,
    healthBudgetRequired: true,
    privacyReviewRequired: true,
    contentGovernanceReviewRequired: true,
    socraticIntegrityReviewRequired: true,
    deenBoundaryReviewRequired: true,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /config/limited-rollout returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /config/limited-rollout returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.rolloutPercent).toBe(20);
  });

  it('POST /config/limited-rollout saves to repository', async () => {
    await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getLimitedRolloutConfig();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /config/limited-rollout rejects rollout percent over max', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, rolloutPercent: 100 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('rollout_percent_invalid: 100');
  });

  it('POST /config/limited-rollout rejects rollout percent of 100', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, rolloutPercent: 100 });
    expect(res.status).toBe(200);
    expect(res.body.blockingIssues).toContain('rollout_percent_is_100');
  });

  it('POST /config/limited-rollout rejects missing required fields', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send({ rolloutPercent: 20 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues.length).toBeGreaterThan(0);
  });

  it('POST /config/limited-rollout returns maxRolloutPercent', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.maxRolloutPercent).toBe(25);
  });

  it('POST /config/limited-rollout returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/config/limited-rollout')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
