import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesHealthBudgetContract', () => {
  let app: express.Express;
  const validMetrics = {
    rolloutLatencyP95Ms: 100,
    safeReadLatencyP95Ms: 200,
    eventIntakeLatencyP95Ms: 150,
    errorRate: 0.1,
    criticalErrorCount: 0,
    timeoutCount: 0,
    privacyBoundaryFailureCount: 0,
    schoolContextBypassCount: 0,
    crossSchoolAttemptCount: 0,
    runtimeGuardDenialCount: 0,
    rollbackReadinessFailureCount: 0,
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

  it('POST /sessions/:sessionId/health-budget returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'student')
      .send(validMetrics);
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/health-budget returns ok with healthy metrics', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send(validMetrics);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.healthBudgetPassed).toBe(true);
  });

  it('POST /sessions/:sessionId/health-budget saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send(validMetrics);
    const saved = await task034Repository.getHealthBudgetEscalation();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/health-budget rejects high latency', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validMetrics, rolloutLatencyP95Ms: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('rollout_latency_p95_exceeded');
  });

  it('POST /sessions/:sessionId/health-budget rejects critical errors', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validMetrics, criticalErrorCount: 2 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.rollbackRecommended).toBe(true);
  });

  it('POST /sessions/:sessionId/health-budget rejects privacy boundary failures', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validMetrics, privacyBoundaryFailureCount: 1 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('privacy_boundary_failures_detected');
  });

  it('POST /sessions/:sessionId/health-budget sets escalationRequired when failing', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validMetrics, errorRate: 5 });
    expect(res.status).toBe(200);
    expect(res.body.escalationRequired).toBe(true);
    expect(res.body.pauseRecommended).toBe(true);
  });

  it('POST /sessions/:sessionId/health-budget returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/health-budget')
      .set('x-actor-role', 'learner')
      .send(validMetrics);
    expect(res.status).toBe(403);
  });
});
