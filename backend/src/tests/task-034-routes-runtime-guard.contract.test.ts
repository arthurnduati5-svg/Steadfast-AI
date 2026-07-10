import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesRuntimeGuardContract', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
    task034Repository.saveRolloutSession({ sessionId: 'session-001', status: 'created', rolloutStage: 'created' } as any);
  });

  it('POST /sessions/:sessionId/runtime-guard returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'student');
    expect(res.status).toBe(403);
  });

  it('POST /sessions/:sessionId/runtime-guard returns default ok:true', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.verifiedSchoolContextRequired).toBe(true);
  });

  it('POST /sessions/:sessionId/runtime-guard saves to repository', async () => {
    await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({});
    const saved = await task034Repository.getExpandedRuntimeGuard();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /sessions/:sessionId/runtime-guard accepts overrides', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({ verifiedSchoolContextRequired: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.verifiedSchoolContextRequired).toBe(false);
    expect(res.body.blockingIssues).toContain('verified_school_context_not_required');
  });

  it('POST /sessions/:sessionId/runtime-guard rejects live AI allowed', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({ liveAiBlocked: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('live_ai_not_blocked');
  });

  it('POST /sessions/:sessionId/runtime-guard rejects answer bot behavior', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({ answerBotBehaviorBlocked: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.blockingIssues).toContain('answer_bot_behavior_not_blocked');
  });

  it('POST /sessions/:sessionId/runtime-guard returns all guard fields', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'internal_operator')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.liveAiBlocked).toBe(true);
    expect(res.body.liveConnectorBlocked).toBe(true);
    expect(res.body.liveNotificationsBlocked).toBe(true);
    expect(res.body.crossSchoolAccessBlocked).toBe(true);
  });

  it('POST /sessions/:sessionId/runtime-guard returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/sessions/session-001/runtime-guard')
      .set('x-actor-role', 'learner');
    expect(res.status).toBe(403);
  });
});
