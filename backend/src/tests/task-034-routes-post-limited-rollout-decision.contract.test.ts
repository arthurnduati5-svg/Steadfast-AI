import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesPostLimitedRolloutDecisionContract', () => {
  let app: express.Express;
  const allPassedInput = {
    runtimeGuardPassed: true,
    healthBudgetPassed: true,
    incidentEscalationPassed: true,
    rollbackProtectionPassed: true,
    privacyReviewPassed: true,
    contentGovernanceReviewPassed: true,
    socraticIntegrityReviewPassed: true,
    deenBoundaryReviewPassed: true,
    schoolIdentityReviewPassed: true,
    crossSchoolDenialReviewPassed: true,
    staffReadinessPassed: true,
    learnerNoticeReadinessPassed: true,
    diagnosticsPassed: true,
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

  it('POST /sessions/:sessionId/post-limited-rollout-decision returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'student')
      .send(allPassedInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision returns safeToStartTask035 true when all pass', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send(allPassedInput);
    expect(res.status).toBe(200);
    expect(res.body.safeToStartTask035).toBe(true);
    expect(res.body.finalDecision).toBe('TASK_034_PASS_SAFE_TO_START_TASK_035');
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send(allPassedInput);
    const saved = await task034Repository.getPostLimitedRolloutDecision();
    expect(saved).not.toBeNull();
    expect(saved?.safeToStartTask035).toBe(true);
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision safeToStartTask040 always false', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send(allPassedInput);
    expect(res.status).toBe(200);
    expect(res.body.safeToStartTask040).toBe(false);
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision returns blocked when gates fail', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send({ ...allPassedInput, runtimeGuardPassed: false });
    expect(res.status).toBe(200);
    expect(res.body.safeToStartTask035).toBe(false);
    expect(res.body.finalDecision).toBe('TASK_034_BLOCKED');
    expect(res.body.remainingBlockers).toContain('runtime_guard_not_passed');
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision includes generatedAt', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send(allPassedInput);
    expect(res.status).toBe(200);
    expect(res.body.generatedAt).toBeDefined();
    expect(typeof res.body.generatedAt).toBe('string');
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision handles partial input', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.safeToStartTask035).toBe(false);
    expect(res.body.remainingBlockers.length).toBeGreaterThan(0);
  });

  it('POST /sessions/:sessionId/post-limited-rollout-decision returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/post-limited-rollout-decision')
      .set('x-actor-role', 'learner')
      .send(allPassedInput);
    expect(res.status).toBe(403);
  });
});
