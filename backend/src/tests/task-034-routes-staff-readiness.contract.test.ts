import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesStaffReadinessContract', () => {
  let app: express.Express;
  const validInput = {
    schoolAdminAcknowledged: true,
    internalOperatorAcknowledged: true,
    teacherSupportAcknowledged: true,
    privacyBoundaryAcknowledged: true,
    safeguardingEscalationAcknowledged: true,
    deenBoundaryAcknowledged: true,
    contentGovernanceAcknowledged: true,
    rollbackPauseKillSwitchAcknowledged: true,
    learnerSupportPlanAcknowledged: true,
    readinessScore: 75,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /staff/readiness returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /staff/readiness returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.readinessScore).toBe(75);
  });

  it('POST /staff/readiness saves to repository', async () => {
    await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getStaffReadiness();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /staff/readiness rejects missing acknowledgements', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, schoolAdminAcknowledged: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('schoolAdminAcknowledged_not_acknowledged');
  });

  it('POST /staff/readiness rejects low readiness score', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, readinessScore: 30 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.readinessScore).toBe(30);
    expect(res.body.blockingIssues.some((i: string) => i.includes('readiness_score_below_minimum'))).toBe(true);
  });

  it('POST /staff/readiness includes minReadinessScore', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.minReadinessScore).toBe(50);
  });

  it('POST /staff/readiness sets noRealMessagesSent', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.noRealMessagesSent).toBe(true);
  });

  it('POST /staff/readiness returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/staff/readiness')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
